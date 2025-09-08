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
 * - Performance optimized with Svelte reactivity
 * 
 * @fileoverview Route Builder Store for Farert Svelte SDK
 * @author Claude Code (claude.ai/code)
 * @version 1.0.0
 */

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import { farertStore } from './farert-store';
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
 * Route building options and configuration
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
}

/**
 * Route builder state interface
 */
interface RouteBuilderState {
  segments: RouteSegmentInfo[];
  validation: RouteValidationResult;
  fareResult: RoutePlanResult | null;
  isCalculating: boolean;
  isValidating: boolean;
  isDirty: boolean;
  dragState: {
    isDragging: boolean;
    dragIndex: number;
    dragOverIndex: number;
  };
  config: Required<RouteBuilderConfig>;
}

/**
 * Default configuration for route builder
 */
const DEFAULT_CONFIG: Required<RouteBuilderConfig> = {
  maxStations: 10,
  autoValidate: true,
  enableUndo: true,
  maxUndoHistory: 20,
  enableRealTimeCalculation: true,
  debounceMs: 300,
  initialRoute: []
};

/**
 * Create a route builder store
 */
function createRouteBuilderStore(config: RouteBuilderConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Initial state
  const initialState: RouteBuilderState = {
    segments: finalConfig.initialRoute,
    validation: { isValid: true, errors: [], warnings: [], suggestions: [] },
    fareResult: null,
    isCalculating: false,
    isValidating: false,
    isDirty: false,
    dragState: {
      isDragging: false,
      dragIndex: -1,
      dragOverIndex: -1
    },
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
   * Validate route segments using WebAssembly module
   */
  async function validateRouteSegments(segments: RouteSegmentInfo[]): Promise<RouteValidationResult> {
    const farert = get(farertStore);
    if (!farert.module || segments.length === 0) {
      return { isValid: true, errors: [], warnings: [], suggestions: [] };
    }

    try {
      const errors: RouteValidationError[] = [];
      const warnings: RouteValidationWarning[] = [];

      // Validate station existence
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

      // Validate line connections
      for (let i = 0; i < segments.length - 1; i++) {
        const nextSegment = segments[i + 1];

        if (nextSegment.lineId) {
          const lineName = farert.module.getLineName(nextSegment.lineId);
          if (!lineName || lineName === 'null') {
            errors.push({
              type: 'line_not_found',
              message: `路線ID ${nextSegment.lineId} は存在しません`,
              position: i + 1,
              value: nextSegment.lineId.toString(),
              suggestions: ['有効な路線IDを使用してください']
            });
          }
        }
      }

      // Add warnings for complex routes
      if (segments.length > 5) {
        warnings.push({
          type: 'long_route',
          message: '複雑な経路です。計算に時間がかかる場合があります',
          suggestion: '中間駅を省略できる場合は省略してください'
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions: errors.length > 0 ? [
          '駅名・路線名の正確性を確認してください',
          '接続可能な路線を選択してください'
        ] : []
      };
    } catch (error) {
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
   * Calculate fare for current route using WebAssembly
   */
  async function calculateFare(segments: RouteSegmentInfo[]): Promise<RoutePlanResult | null> {
    const farert = get(farertStore);
    if (!farert.module || segments.length < 2) return null;

    try {
      // Clear any existing route
      farert.module.removeAll();

      // Add route beginning
      const startResult = farert.module.addRouteBegin(segments[0].stationId);
      if (startResult !== 0) {
        console.warn(`Failed to set starting station: ${segments[0].stationName}`);
        return null;
      }

      // Add route segments
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

      // Build result object
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

      return result;
    } catch (error) {
      console.error('Fare calculation error:', error);
      return null;
    }
  }

  /**
   * Debounced validation function
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
      update(state => ({ ...state, validation, isValidating: false }));
    }, currentState.config.debounceMs);
  }

  /**
   * Debounced fare calculation function
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
   * Update segments and trigger validation/calculation
   */
  function updateSegments(newSegments: RouteSegmentInfo[]) {
    update(state => ({ ...state, segments: newSegments, isDirty: true }));
    debouncedValidate(newSegments);
    debouncedCalculate(newSegments);
  }

  /**
   * Add station to route
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

  /**
   * Start drag operation
   */
  function onDragStart(index: number) {
    update(state => ({
      ...state,
      dragState: { ...state.dragState, isDragging: true, dragIndex: index }
    }));
  }

  /**
   * Handle drag over
   */
  function onDragOver(index: number) {
    const currentState = get({ subscribe });
    if (!currentState.dragState.isDragging) return;
    
    update(state => ({
      ...state,
      dragState: { ...state.dragState, dragOverIndex: index }
    }));
  }

  /**
   * End drag operation
   */
  function onDragEnd() {
    const currentState = get({ subscribe });
    const { dragIndex, dragOverIndex } = currentState.dragState;
    
    if (dragIndex >= 0 && dragOverIndex >= 0 && dragIndex !== dragOverIndex) {
      moveStation(dragIndex, dragOverIndex);
    }

    update(state => ({
      ...state,
      dragState: { isDragging: false, dragIndex: -1, dragOverIndex: -1 }
    }));
  }

  /**
   * Cleanup function
   */
  function destroy() {
    if (validationTimer) clearTimeout(validationTimer);
    if (calculationTimer) clearTimeout(calculationTimer);
  }

  return {
    subscribe,
    
    // Actions
    addStation,
    removeStation,
    moveStation,
    clear,
    
    // Undo/Redo
    undo,
    redo,
    
    // Drag and Drop
    onDragStart,
    onDragOver,
    onDragEnd,
    
    // Utilities
    validateRoute: validateRouteSegments,
    calculateFare,
    getStationInfo,
    getLineInfo,
    
    // Getters for undo/redo state
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    
    // Cleanup
    destroy
  };
}

// Export store creator and derived stores
export { createRouteBuilderStore };

// Derived stores for common queries
export function createRouteBuilderDerivedStores(routeBuilder: ReturnType<typeof createRouteBuilderStore>) {
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

  const isLoading: Readable<boolean> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.isCalculating || $routeBuilder.isValidating
  );

  const isValid: Readable<boolean> = derived(
    routeBuilder,
    $routeBuilder => $routeBuilder.validation.isValid
  );

  const canCalculate: Readable<boolean> = derived(
    [routeBuilder, farertStore],
    ([$routeBuilder, $farertStore]) => 
      $routeBuilder.segments.length >= 2 && 
      $farertStore.initState === 'ready' &&
      $routeBuilder.validation.isValid &&
      !$routeBuilder.isCalculating
  );

  return {
    segments,
    validation,
    fareResult,
    isLoading,
    isValid,
    canCalculate
  };
}

export default createRouteBuilderStore;