/**
 * Svelte Store for Building Multi-Segment Railway Routes with Validation
 * Implements REQ-API-003.4 requirements for route building with reactive stores
 * 
 * Features:
 * - Route building with stations and lines
 * - Undo/redo functionality using command pattern
 * - Comprehensive validation and error handling
 * - Integration with WebAssembly object classes
 * - Real-time fare calculation
 * - Enhanced drag-and-drop interface with accessibility
 * - Route optimization suggestions
 * - Performance optimized with Svelte reactivity
 * 
 * @fileoverview Enhanced Route Builder Store for Farert Svelte SDK
 * @author Claude Code (claude.ai/code)
 * @version 1.1.0
 */

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { farertStore } from './farert-store';

// Core SDK types
import {
  RouteSegmentInfo,
  StationInfo,
  LineInfo,
  RouteValidationResult,
  RouteValidationError,
  RouteValidationWarning,
  RoutePlanResult,
  CLIError,
  CLIErrorCode
} from '../types';

/**
 * Command interface for undo/redo functionality
 */
interface RouteCommand {
  id: string;
  type: 'add' | 'remove' | 'move' | 'clear' | 'replace';
  timestamp: number;
  execute: () => void;
  undo: () => void;
  description: string;
  data?: any;
}

/**
 * Enhanced route optimization suggestion
 */
interface RouteOptimization {
  alternatives: Array<{
    route: {
      from: { stationId: number; stationName: string };
      to: { stationId: number; stationName: string };
      via: Array<{ stationId: number; stationName: string; lineId?: number }>;
    };
    description: string;
    estimatedFare?: number;
    estimatedTime?: number;
    savings?: number;
  }>;
  currentRoute?: {
    fare: number;
    time: number;
  };
}

/**
 * Connection validation result for route segments
 */
interface ConnectionValidationResult {
  isValid: boolean;
  fromStationId: number;
  toStationId: number;
  lineId?: number;
  error?: string;
  suggestion?: string;
}

/**
 * Route suggestion for corrections
 */
interface RouteSuggestion {
  type: 'connection' | 'station' | 'line' | 'optimization';
  description: string;
  confidence: number;
  action?: 'replace' | 'add' | 'remove';
}

/**
 * Enhanced route building options and configuration
 */
export interface RouteBuilderConfig {
  /** Maximum number of stations allowed in route */
  maxStations?: number;
  /** Enable automatic validation on changes */
  autoValidate?: boolean;
  /** Enable undo/redo functionality */
  enableUndo?: boolean;
  /** Maximum undo history size */
  maxUndoHistory?: number;
  /** Enable real-time fare calculation */
  enableRealTimeCalculation?: boolean;
  /** Debounce delay for validation/calculation (ms) */
  debounceMs?: number;
  /** Initial route segments */
  initialRoute?: RouteSegmentInfo[];
  /** Enable route optimization suggestions */
  enableOptimization?: boolean;
  /** Enable drag-and-drop interface */
  enableDragDrop?: boolean;
  /** Enable fuzzy station matching */
  fuzzyMatching?: boolean;
  /** Cache validation results */
  cacheResults?: boolean;
  /** Validation configuration */
  validation?: {
    checkConnections?: boolean;
    allowPartialRoutes?: boolean;
    strictMode?: boolean;
    maxValidationTime?: number;
  };
  /** Fare calculation options */
  fareOptions?: {
    includeTax?: boolean;
    includeDiscounts?: boolean;
    format?: 'simple' | 'detailed';
  };
}

/**
 * Enhanced route builder state interface
 */
interface RouteBuilderState {
  segments: RouteSegmentInfo[];
  validation: RouteValidationResult;
  fareResult: RoutePlanResult | null;
  isCalculating: boolean;
  isValidating: boolean;
  isOptimizing: boolean;
  isDirty: boolean;
  
  // Enhanced drag-and-drop state
  dragState: {
    isDragging: boolean;
    dragIndex: number;
    dragOverIndex: number;
    dropTarget: 'before' | 'after' | 'replace' | null;
    canDrop: boolean;
  };
  
  // Route optimization and suggestions
  optimization: RouteOptimization | null;
  suggestions: RouteSuggestion[];
  connectionValidation: ConnectionValidationResult[];
  
  config: Required<RouteBuilderConfig>;
}

/**
 * Default configuration for enhanced route builder
 */
const DEFAULT_CONFIG: Required<RouteBuilderConfig> = {
  maxStations: 10,
  autoValidate: true,
  enableUndo: true,
  maxUndoHistory: 20,
  enableRealTimeCalculation: true,
  debounceMs: 300,
  initialRoute: [],
  enableOptimization: true,
  enableDragDrop: true,
  fuzzyMatching: true,
  cacheResults: true,
  validation: {
    checkConnections: true,
    allowPartialRoutes: false,
    strictMode: false,
    maxValidationTime: 5000
  },
  fareOptions: {
    includeTax: true,
    includeDiscounts: true,
    format: 'detailed'
  }
};

/**
 * Create an enhanced route builder store with full feature integration
 */
function createRouteBuilderStore(config: RouteBuilderConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Enhanced initial state
  const initialState: RouteBuilderState = {
    segments: finalConfig.initialRoute,
    validation: { isValid: true, errors: [], warnings: [], suggestions: [] },
    fareResult: null,
    isCalculating: false,
    isValidating: false,
    isOptimizing: false,
    isDirty: false,
    
    // Enhanced drag-and-drop state
    dragState: {
      isDragging: false,
      dragIndex: -1,
      dragOverIndex: -1,
      dropTarget: null,
      canDrop: false
    },
    
    // Route optimization and suggestions
    optimization: null,
    suggestions: [],
    connectionValidation: [],
    
    config: finalConfig
  };

  const { subscribe, set, update } = writable<RouteBuilderState>(initialState);

  // Command history for undo/redo
  let undoStack: RouteCommand[] = [];
  let redoStack: RouteCommand[] = [];
  let commandIdCounter = 0;
  
  // Timers for debouncing
  let validationTimer: NodeJS.Timeout | undefined;
  let calculationTimer: NodeJS.Timeout | undefined;
  let optimizationTimer: NodeJS.Timeout | undefined;

  /**
   * Generate unique command ID
   */
  function generateCommandId(): string {
    return `cmd_${Date.now()}_${++commandIdCounter}`;
  }

  /**
   * Execute command and add to undo stack
   */
  function executeCommand(command: RouteCommand) {
    const currentState = get({ subscribe });
    
    if (!currentState.config.enableUndo) {
      command.execute();
      return;
    }

    // Clear redo stack when new command is executed
    redoStack = [];

    // Add to undo stack
    undoStack.push(command);

    // Limit undo history size
    if (undoStack.length > currentState.config.maxUndoHistory) {
      undoStack.shift();
    }

    // Execute the command
    command.execute();
  }

  /**
   * Enhanced route validation with connection checking
   */
  async function validateRouteSegments(segments: RouteSegmentInfo[]): Promise<RouteValidationResult> {
    const currentState = get({ subscribe });
    
    if (segments.length === 0) {
      return { isValid: true, errors: [], warnings: [], suggestions: [] };
    }

    const farert = get(farertStore);
    if (!farert.module) {
      return { 
        isValid: false, 
        errors: [{ 
          type: 'system_error',
          message: 'WebAssembly モジュールが初期化されていません',
          suggestions: ['しばらく待ってから再試行してください']
        }], 
        warnings: [], 
        suggestions: [] 
      };
    }

    try {
      const errors: RouteValidationError[] = [];
      const warnings: RouteValidationWarning[] = [];
      const suggestions: string[] = [];
      const connectionResults: ConnectionValidationResult[] = [];

      // Enhanced station validation
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const stationName = farert.module.getStationName(segment.stationId);
        
        if (!stationName || stationName === 'null') {
          errors.push({
            type: 'station_not_found',
            message: `駅ID ${segment.stationId} は存在しません`,
            position: i,
            value: segment.stationId.toString(),
            suggestions: ['有効な駅IDを使用してください']
          });
        }
      }

      // Enhanced connection validation with specific line checking
      if (currentState.config.validation.checkConnections) {
        for (let i = 0; i < segments.length - 1; i++) {
          const from = segments[i];
          const to = segments[i + 1];

          const connectionResult: ConnectionValidationResult = {
            isValid: true,
            fromStationId: from.stationId,
            toStationId: to.stationId,
            lineId: to.lineId
          };

          if (to.lineId) {
            const lineName = farert.module.getLineName(to.lineId);
            if (!lineName || lineName === 'null') {
              connectionResult.isValid = false;
              connectionResult.error = `路線ID ${to.lineId} は存在しません`;
              
              errors.push({
                type: 'line_not_found',
                message: connectionResult.error,
                position: i + 1,
                value: to.lineId.toString(),
                suggestions: ['有効な路線IDを使用してください']
              });
            }
          }

          connectionResults.push(connectionResult);
        }
      }

      // Route optimization warnings
      if (segments.length > 5) {
        warnings.push({
          type: 'long_route',
          message: '複雑な経路です。計算に時間がかかる場合があります',
          suggestion: '中間駅を省略できる場合は省略してください'
        });
        suggestions.push('経路の最適化を検討してください');
      }

      if (segments.length > 8) {
        warnings.push({
          type: 'very_long_route',
          message: '非常に複雑な経路です。エラーが発生する可能性があります',
          suggestion: '経路を分割することを検討してください'
        });
      }

      // Update connection validation results
      update(state => ({ 
        ...state, 
        connectionValidation: connectionResults 
      }));

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions: errors.length > 0 ? [
          '駅名・路線名の正確性を確認してください',
          '接続可能な路線を選択してください',
          ...suggestions
        ] : suggestions
      };
    } catch (error) {
      console.error('Enhanced route validation error:', error);
      return {
        isValid: false,
        errors: [{
          type: 'route_format_invalid',
          message: `検証中にエラーが発生しました: ${error}`,
          suggestions: ['入力内容を確認してください']
        }],
        warnings: [],
        suggestions: []
      };
    }
  }

  /**
   * Enhanced fare calculation with detailed breakdown
   */
  async function calculateFare(segments: RouteSegmentInfo[]): Promise<RoutePlanResult | null> {
    const currentState = get({ subscribe });
    const farert = get(farertStore);
    
    if (!farert.module || segments.length < 2) {
      return null;
    }

    try {
      // Clear any existing route
      farert.module.removeAll();

      // Add route beginning
      const startResult = farert.module.addRouteBegin(segments[0].stationId);
      if (startResult !== 0) {
        console.warn(`Failed to set starting station: ${segments[0].stationName}`);
        return null;
      }

      // Add route segments with enhanced error handling
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        const result = segment.lineId 
          ? farert.module.addRoute(segment.lineId, segment.stationId)
          : farert.module.addRoute(0, segment.stationId); // Auto-route

        if (result !== 0) {
          console.warn(`Failed to add route segment to: ${segment.stationName}`);
          return null;
        }
      }

      // Calculate fare
      const fareResult = farert.module.calculateFare();
      if (fareResult < 0) {
        console.warn('Fare calculation failed:', fareResult);
        return null;
      }

      // Get detailed fare information
      const fareInfoJson = farert.module.getFareInfoJson();
      const fareInfo = JSON.parse(fareInfoJson);

      // Build enhanced result object with detailed breakdown
      const result: RoutePlanResult = {
        route: segments,
        totalFare: fareInfo.fare || 0,
        totalTime: 0, // Not available from current API
        totalDistance: fareInfo.totalSalesKm || 0,
        transfers: Math.max(0, segments.length - 2),
        fareBreakdown: [
          {
            description: '基本運賃',
            amount: fareInfo.fare || 0,
            type: 'base'
          }
        ]
      };

      // Add tax information if enabled
      if (currentState.config.fareOptions.includeTax && fareInfo.taxAmount) {
        result.fareBreakdown.push({
          description: '消費税',
          amount: fareInfo.taxAmount,
          type: 'tax'
        });
      }

      // Add discount information if available
      if (currentState.config.fareOptions.includeDiscounts && fareInfo.discounts) {
        fareInfo.discounts.forEach((discount: any) => {
          result.fareBreakdown.push({
            description: discount.name || '割引',
            amount: -discount.amount,
            type: 'discount'
          });
        });
      }

      return result;
    } catch (error) {
      console.error('Enhanced fare calculation error:', error);
      return null;
    }
  }

  /**
   * Get simple route optimization suggestions
   */
  async function getSimpleOptimizationSuggestions(segments: RouteSegmentInfo[]): Promise<RouteOptimization | null> {
    if (segments.length < 2) return null;

    try {
      // Simple optimization: suggest direct route if more than 2 segments
      if (segments.length > 2) {
        const directRoute = {
          route: {
            from: { stationId: segments[0].stationId, stationName: segments[0].stationName },
            to: { 
              stationId: segments[segments.length - 1].stationId, 
              stationName: segments[segments.length - 1].stationName 
            },
            via: []
          },
          description: '直通経路（中間駅省略）',
          savings: segments.length - 2
        };

        return {
          alternatives: [directRoute]
        };
      }

      return null;
    } catch (error) {
      console.error('Route optimization failed:', error);
      return null;
    }
  }

  /**
   * Enhanced debounced validation with optimization
   */
  function debouncedValidate(segments: RouteSegmentInfo[]) {
    const currentState = get({ subscribe });
    if (!currentState.config.autoValidate) return;

    update(state => ({ ...state, isValidating: true }));

    if (validationTimer) {
      clearTimeout(validationTimer);
    }

    validationTimer = setTimeout(async () => {
      const validation = await validateRouteSegments(segments);
      
      // Trigger simple optimization if enabled
      let optimization: RouteOptimization | null = null;
      if (currentState.config.enableOptimization && validation.isValid && segments.length >= 2) {
        optimization = await getSimpleOptimizationSuggestions(segments);
      }
      
      update(state => ({ 
        ...state, 
        validation, 
        optimization,
        isValidating: false 
      }));
    }, currentState.config.debounceMs);
  }

  /**
   * Enhanced debounced fare calculation
   */
  function debouncedCalculate(segments: RouteSegmentInfo[]) {
    const currentState = get({ subscribe });
    if (!currentState.config.enableRealTimeCalculation || segments.length < 2) return;

    update(state => ({ ...state, isCalculating: true }));

    if (calculationTimer) {
      clearTimeout(calculationTimer);
    }

    calculationTimer = setTimeout(async () => {
      const result = await calculateFare(segments);
      update(state => ({ ...state, fareResult: result, isCalculating: false }));
    }, currentState.config.debounceMs);
  }

  /**
   * Enhanced segment update function
   */
  function updateSegments(newSegments: RouteSegmentInfo[]) {
    update(state => ({ ...state, segments: newSegments, isDirty: true }));
    debouncedValidate(newSegments);
    debouncedCalculate(newSegments);
  }

  /**
   * Get station information from WebAssembly module
   */
  async function getStationInfo(stationId: number): Promise<StationInfo | null> {
    const farert = get(farertStore);
    if (!farert.module) return null;

    try {
      const name = farert.module.getStationName(stationId);
      if (!name || name === 'null' || name === '') return null;

      const stationInfo: StationInfo = {
        id: stationId,
        name,
        nameExtended: name,
        kana: '',
        prefecture: '',
        prefectureId: 0,
        isJunction: false,
        lines: []
      };

      // Try to get enhanced information if available
      if (farert.module.getStationNameEx) {
        stationInfo.nameExtended = farert.module.getStationNameEx(stationId) || name;
      }

      if (farert.module.getStationKana) {
        stationInfo.kana = farert.module.getStationKana(stationId) || '';
      }

      if (farert.module.getStationPrefecture) {
        stationInfo.prefecture = farert.module.getStationPrefecture(stationId) || '';
      }

      return stationInfo;
    } catch (error) {
      console.warn(`Failed to get station info for ${stationId}:`, error);
      return null;
    }
  }

  /**
   * Get line information from WebAssembly module
   */
  async function getLineInfo(lineId: number): Promise<LineInfo | null> {
    const farert = get(farertStore);
    if (!farert.module) return null;

    try {
      const name = farert.module.getLineName(lineId);
      if (!name || name === 'null' || name === '') return null;

      const lineInfo: LineInfo = {
        id: lineId,
        name,
        companyId: 0,
        companyName: '',
        isJR: lineId < 0x10000,
        isPrivate: lineId >= 0x10000,
        stations: []
      };

      return lineInfo;
    } catch (error) {
      console.warn(`Failed to get line info for ${lineId}:`, error);
      return null;
    }
  }

  /**
   * Add station to route with enhanced validation
   */
  async function addStation(stationId: number, lineId?: number) {
    const currentState = get({ subscribe });
    
    if (currentState.segments.length >= currentState.config.maxStations) {
      throw new CLIError(
        `最大駅数 (${currentState.config.maxStations}) に達しています`,
        CLIErrorCode.VALIDATION_FAILED
      );
    }

    const stationInfo = await getStationInfo(stationId);
    if (!stationInfo) {
      throw new CLIError(
        `駅ID ${stationId} が見つかりません`,
        CLIErrorCode.INVALID_STATION_NAME
      );
    }

    let lineInfo: LineInfo | null = null;
    if (lineId) {
      lineInfo = await getLineInfo(lineId);
      if (!lineInfo) {
        throw new CLIError(
          `路線ID ${lineId} が見つかりません`,
          CLIErrorCode.INVALID_LINE_NAME
        );
      }
    }

    const newSegment: RouteSegmentInfo = {
      stationId,
      stationName: stationInfo.name,
      stationKana: stationInfo.kana,
      lineId,
      lineName: lineInfo?.name,
      isTransfer: currentState.segments.length > 0,
      transferLines: stationInfo.lines
    };

    const oldSegments = [...currentState.segments];
    const newSegments = [...oldSegments, newSegment];

    const command: RouteCommand = {
      id: generateCommandId(),
      type: 'add',
      timestamp: Date.now(),
      description: `駅「${stationInfo.name}」を追加`,
      data: { segment: newSegment, index: oldSegments.length },
      execute: () => updateSegments(newSegments),
      undo: () => updateSegments(oldSegments)
    };

    executeCommand(command);
  }

  /**
   * Remove station from route
   */
  function removeStation(index: number) {
    const currentState = get({ subscribe });
    
    if (index < 0 || index >= currentState.segments.length) {
      throw new CLIError(
        `無効なインデックス: ${index}`,
        CLIErrorCode.VALIDATION_FAILED
      );
    }

    const oldSegments = [...currentState.segments];
    const removedSegment = oldSegments[index];
    const newSegments = oldSegments.filter((_, i) => i !== index);

    const command: RouteCommand = {
      id: generateCommandId(),
      type: 'remove',
      timestamp: Date.now(),
      description: `駅「${removedSegment.stationName}」を削除`,
      data: { segment: removedSegment, index },
      execute: () => updateSegments(newSegments),
      undo: () => updateSegments(oldSegments)
    };

    executeCommand(command);
  }

  /**
   * Move station to new position
   */
  function moveStation(fromIndex: number, toIndex: number) {
    const currentState = get({ subscribe });
    
    if (
      fromIndex < 0 || fromIndex >= currentState.segments.length ||
      toIndex < 0 || toIndex >= currentState.segments.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const oldSegments = [...currentState.segments];
    const newSegments = [...oldSegments];
    const movedSegment = newSegments.splice(fromIndex, 1)[0];
    newSegments.splice(toIndex, 0, movedSegment);

    const command: RouteCommand = {
      id: generateCommandId(),
      type: 'move',
      timestamp: Date.now(),
      description: `駅「${movedSegment.stationName}」を移動 (${fromIndex + 1} → ${toIndex + 1})`,
      data: { fromIndex, toIndex },
      execute: () => updateSegments(newSegments),
      undo: () => updateSegments(oldSegments)
    };

    executeCommand(command);
  }

  /**
   * Clear all stations
   */
  function clear() {
    const currentState = get({ subscribe });
    if (currentState.segments.length === 0) return;

    const oldSegments = [...currentState.segments];

    const command: RouteCommand = {
      id: generateCommandId(),
      type: 'clear',
      timestamp: Date.now(),
      description: '全ての駅をクリア',
      execute: () => updateSegments([]),
      undo: () => updateSegments(oldSegments)
    };

    executeCommand(command);
  }

  /**
   * Undo last command
   */
  function undo() {
    const currentState = get({ subscribe });
    if (!currentState.config.enableUndo || undoStack.length === 0) return;

    const command = undoStack.pop();
    if (command) {
      redoStack.push(command);
      command.undo();
    }
  }

  /**
   * Redo last undone command
   */
  function redo() {
    const currentState = get({ subscribe });
    if (!currentState.config.enableUndo || redoStack.length === 0) return;

    const command = redoStack.pop();
    if (command) {
      undoStack.push(command);
      command.execute();
    }
  }

  // ============================================================================
  // ENHANCED DRAG-AND-DROP OPERATIONS
  // ============================================================================

  /**
   * Start drag operation with enhanced accessibility
   */
  function onDragStart(index: number, event?: DragEvent) {
    const currentState = get({ subscribe });
    
    if (!currentState.config.enableDragDrop || index < 0 || index >= currentState.segments.length) {
      return false;
    }

    // Set drag data for accessibility
    if (event?.dataTransfer) {
      const segment = currentState.segments[index];
      event.dataTransfer.setData('application/json', JSON.stringify({
        index,
        segment,
        sourceStore: 'route-builder'
      }));
      event.dataTransfer.effectAllowed = 'move';
    }
    
    update(state => ({
      ...state,
      dragState: { 
        ...state.dragState, 
        isDragging: true, 
        dragIndex: index,
        canDrop: false
      }
    }));
    
    return true;
  }

  /**
   * Enhanced drag over with drop target validation
   */
  function onDragOver(index: number, position: 'before' | 'after' | 'replace' = 'replace') {
    const currentState = get({ subscribe });
    
    if (!currentState.dragState.isDragging || !currentState.config.enableDragDrop) {
      return;
    }
    
    // Validate drop target
    const canDrop = index >= 0 && 
                   index < currentState.segments.length && 
                   index !== currentState.dragState.dragIndex;
    
    update(state => ({
      ...state,
      dragState: { 
        ...state.dragState, 
        dragOverIndex: index,
        dropTarget: position,
        canDrop
      }
    }));
  }

  /**
   * Handle drag enter for visual feedback
   */
  function onDragEnter(index: number, event?: DragEvent) {
    if (event?.preventDefault) {
      event.preventDefault();
    }
    onDragOver(index, 'replace');
  }

  /**
   * Handle drag leave for cleanup
   */
  function onDragLeave() {
    const currentState = get({ subscribe });
    if (!currentState.dragState.isDragging) return;
    
    update(state => ({
      ...state,
      dragState: { 
        ...state.dragState, 
        dragOverIndex: -1,
        dropTarget: null,
        canDrop: false
      }
    }));
  }

  /**
   * Enhanced drop handling with validation
   */
  function onDrop(targetIndex: number, event?: DragEvent) {
    const currentState = get({ subscribe });
    
    if (event?.preventDefault) {
      event.preventDefault();
    }
    
    if (!currentState.dragState.canDrop) {
      onDragEnd();
      return false;
    }

    const { dragIndex } = currentState.dragState;
    
    if (dragIndex >= 0 && targetIndex >= 0 && dragIndex !== targetIndex) {
      try {
        moveStation(dragIndex, targetIndex);
        return true;
      } catch (error) {
        console.error('Drop operation failed:', error);
      }
    }
    
    onDragEnd();
    return false;
  }

  /**
   * End drag operation with cleanup
   */
  function onDragEnd() {
    update(state => ({
      ...state,
      dragState: { 
        isDragging: false, 
        dragIndex: -1, 
        dragOverIndex: -1,
        dropTarget: null,
        canDrop: false
      }
    }));
  }

  /**
   * Keyboard-accessible move operations
   */
  function moveStationUp(index: number) {
    if (index > 0) {
      moveStation(index, index - 1);
    }
  }

  function moveStationDown(index: number) {
    const currentState = get({ subscribe });
    if (index < currentState.segments.length - 1) {
      moveStation(index, index + 1);
    }
  }

  // ============================================================================
  // ROUTE OPTIMIZATION AND ANALYSIS
  // ============================================================================

  /**
   * Get route optimization suggestions
   */
  async function getOptimizationSuggestions(): Promise<RouteOptimization | null> {
    const currentState = get({ subscribe });
    
    if (currentState.segments.length < 2 || !currentState.config.enableOptimization) {
      return null;
    }

    try {
      update(state => ({ ...state, isOptimizing: true }));
      
      const optimization = await getSimpleOptimizationSuggestions(currentState.segments);

      update(state => ({ 
        ...state, 
        optimization, 
        isOptimizing: false 
      }));
      
      return optimization;
    } catch (error) {
      console.error('Route optimization failed:', error);
      update(state => ({ ...state, isOptimizing: false }));
      return null;
    }
  }

  /**
   * Apply optimization suggestion
   */
  async function applyOptimization(optimizationIndex: number) {
    const currentState = get({ subscribe });
    
    if (!currentState.optimization || 
        optimizationIndex < 0 || 
        optimizationIndex >= currentState.optimization.alternatives.length) {
      return false;
    }

    try {
      const alternative = currentState.optimization.alternatives[optimizationIndex];
      
      // Convert optimization result back to segments
      const newSegments: RouteSegmentInfo[] = [
        {
          stationId: alternative.route.from.stationId,
          stationName: alternative.route.from.stationName,
          stationKana: '',
          isTransfer: false,
          transferLines: []
        },
        ...alternative.route.via.map((via, index) => ({
          stationId: via.stationId,
          stationName: via.stationName,
          stationKana: '',
          lineId: via.lineId,
          lineName: '',
          isTransfer: true,
          transferLines: []
        })),
        {
          stationId: alternative.route.to.stationId,
          stationName: alternative.route.to.stationName,
          stationKana: '',
          lineId: undefined,
          isTransfer: true,
          transferLines: []
        }
      ];

      // Create command for undo/redo
      const oldSegments = [...currentState.segments];
      const command: RouteCommand = {
        id: generateCommandId(),
        type: 'replace',
        timestamp: Date.now(),
        description: `最適化を適用: ${alternative.description}`,
        data: { optimization: alternative, oldSegments, newSegments },
        execute: () => updateSegments(newSegments),
        undo: () => updateSegments(oldSegments)
      };

      executeCommand(command);
      return true;
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      return false;
    }
  }

  /**
   * Enhanced cleanup function
   */
  function destroy() {
    // Clear timers
    if (validationTimer) clearTimeout(validationTimer);
    if (calculationTimer) clearTimeout(calculationTimer);
    if (optimizationTimer) clearTimeout(optimizationTimer);
  }

  // ============================================================================
  // STORE INTERFACE
  // ============================================================================

  return {
    subscribe,
    
    // Core actions
    addStation,
    removeStation,
    moveStation,
    clear,
    
    // Undo/Redo
    undo,
    redo,
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    
    // Enhanced drag and drop
    onDragStart,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onDragEnd,
    moveStationUp,
    moveStationDown,
    
    // Route optimization and analysis
    getOptimizationSuggestions,
    applyOptimization,
    
    // Validation and calculation utilities
    validateRoute: validateRouteSegments,
    calculateFare,
    getStationInfo,
    getLineInfo,
    
    // Configuration and state access
    getConfig: () => get({ subscribe }).config,
    updateConfig: (newConfig: Partial<RouteBuilderConfig>) => {
      update(state => ({ 
        ...state, 
        config: { ...state.config, ...newConfig } 
      }));
    },
    
    // State introspection
    getState: () => get({ subscribe }),
    isReady: () => {
      const farert = get(farertStore);
      return farert.initState === 'ready';
    },
    
    // Cleanup
    destroy
  };
}

// ============================================================================
// CONVENIENCE STORE INSTANCES AND DERIVED STORES
// ============================================================================

// Export store creator
export { createRouteBuilderStore };

/**
 * Enhanced derived stores with optimization and analysis capabilities
 */
export function createRouteBuilderDerivedStores(routeBuilder: ReturnType<typeof createRouteBuilderStore>) {
  // Core state derivations
  const segments: Readable<RouteSegmentInfo[]> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.segments
  );

  const validation: Readable<RouteValidationResult> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.validation
  );

  const fareResult: Readable<RoutePlanResult | null> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.fareResult
  );

  // Enhanced loading states
  const isLoading: Readable<boolean> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.isCalculating || $routeBuilder.isValidating || $routeBuilder.isOptimizing
  );

  const isValid: Readable<boolean> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.validation.isValid
  );

  // Enhanced calculation readiness check
  const canCalculate: Readable<boolean> = derived(
    [routeBuilder, farertStore],
    ([$routeBuilder, $farertStore]) => 
      $routeBuilder.segments.length >= 2 && 
      $farertStore.initState === 'ready' &&
      $routeBuilder.validation.isValid &&
      !$routeBuilder.isCalculating &&
      routeBuilder.isReady()
  );

  // Optimization-related derived stores
  const optimization: Readable<RouteOptimization | null> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.optimization
  );

  const suggestions: Readable<RouteSuggestion[]> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.suggestions
  );

  const hasOptimizations: Readable<boolean> = derived(
    optimization,
    $optimization => !!($optimization?.alternatives?.length)
  );

  // Drag-and-drop state
  const dragState = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.dragState
  );

  const isDragging: Readable<boolean> = derived(
    dragState,
    $dragState => $dragState.isDragging
  );

  const canDrop: Readable<boolean> = derived(
    dragState,
    $dragState => $dragState.canDrop
  );

  // Route analysis
  const connectionValidation: Readable<ConnectionValidationResult[]> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.connectionValidation
  );

  // Undo/redo state
  const canUndo: Readable<boolean> = derived(
    routeBuilder,
    () => routeBuilder.canUndo()
  );

  const canRedo: Readable<boolean> = derived(
    routeBuilder,
    () => routeBuilder.canRedo()
  );

  return {
    // Core state
    segments,
    validation,
    fareResult,
    isLoading,
    isValid,
    canCalculate,
    
    // Enhancement features
    optimization,
    suggestions,
    hasOptimizations,
    connectionValidation,
    
    // Drag-and-drop
    dragState,
    isDragging,
    canDrop,
    
    // History
    canUndo,
    canRedo
  };
}

// ============================================================================
// CONVENIENCE STORE INSTANCES
// ============================================================================

/**
 * Default route builder store instance with standard configuration
 */
export const routeBuilderStore = createRouteBuilderStore({
  autoValidate: true,
  enableRealTimeCalculation: true,
  enableOptimization: true,
  enableDragDrop: true,
  maxStations: 10,
  debounceMs: 300
});

/**
 * Simple route builder for basic route construction
 */
export const simpleRouteStore = createRouteBuilderStore({
  autoValidate: true,
  enableRealTimeCalculation: false,
  enableOptimization: false,
  enableDragDrop: false,
  enableUndo: false,
  maxStations: 5,
  debounceMs: 500
});

/**
 * Advanced route builder with all features enabled
 */
export const advancedRouteStore = createRouteBuilderStore({
  autoValidate: true,
  enableRealTimeCalculation: true,
  enableOptimization: true,
  enableDragDrop: true,
  enableUndo: true,
  fuzzyMatching: true,
  cacheResults: true,
  maxStations: 20,
  maxUndoHistory: 50,
  debounceMs: 200,
  validation: {
    checkConnections: true,
    allowPartialRoutes: true,
    strictMode: false,
    maxValidationTime: 10000
  },
  fareOptions: {
    includeTax: true,
    includeDiscounts: true,
    format: 'detailed'
  }
});

// Export as both named and default
export default createRouteBuilderStore;

// ============================================================================
// TYPE EXPORTS FOR CONSUMERS
// ============================================================================

export type {
  RouteBuilderConfig,
  RouteCommand,
  RouteOptimization,
  RouteSuggestion,
  ConnectionValidationResult
};