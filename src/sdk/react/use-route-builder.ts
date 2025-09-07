/**
 * React Hook for Building Multi-Segment Railway Routes with Validation
 * Implements REQ-API-003.4 requirements for drag-and-drop route building
 * 
 * Features:
 * - Route building with stations and lines
 * - Undo/redo functionality using command pattern
 * - Comprehensive validation and error handling
 * - Integration with WebAssembly object classes
 * - Drag-and-drop support for reordering segments
 * - Real-time fare calculation
 * - Performance optimized with React patterns
 * 
 * @fileoverview Route Builder Hook for Farert React SDK
 * @author Claude Code (claude.ai/code)
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useFarert } from './farert-provider';
import {
  RouteSegmentInfo,
  StationInfo,
  LineInfo,
  RouteValidationResult,
  RouteValidationError,
  RouteValidationWarning,
  RoutePlanResult,
  ReactSDKError,
  ReactSDKErrorCode,
  UseRouteBuildingResult
} from '../types';
import {
  validateRoute,
  formatValidationErrors,
  createRouteBuilder,
  RouteBuilder
} from '../utils/fare-utils';

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
export interface UseRouteBuilderOptions {
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
  /** Enable drag and drop reordering */
  enableDragDrop?: boolean;
  /** Initial route segments */
  initialRoute?: RouteSegmentInfo[];
  /** Callback for route changes */
  onRouteChange?: (route: RouteSegmentInfo[]) => void;
  /** Callback for validation results */
  onValidationChange?: (validation: RouteValidationResult) => void;
  /** Callback for fare calculation results */
  onFareCalculated?: (result: RoutePlanResult | null) => void;
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
}

/**
 * Default options for route builder
 */
const DEFAULT_OPTIONS: Required<UseRouteBuilderOptions> = {
  maxStations: 10,
  autoValidate: true,
  enableUndo: true,
  maxUndoHistory: 20,
  enableRealTimeCalculation: true,
  debounceMs: 300,
  enableDragDrop: true,
  initialRoute: [],
  onRouteChange: () => {},
  onValidationChange: () => {},
  onFareCalculated: () => {}
};

/**
 * React Hook for building multi-segment railway routes
 * 
 * @param options Configuration options for route builder
 * @returns Route builder interface with state and actions
 * 
 * @example
 * ```tsx
 * function RouteBuilderComponent() {
 *   const {
 *     segments,
 *     addStation,
 *     removeStation,
 *     validation,
 *     undo,
 *     redo,
 *     canUndo,
 *     canRedo
 *   } = useRouteBuilder({
 *     maxStations: 8,
 *     enableRealTimeCalculation: true,
 *     onFareCalculated: (result) => console.log('Fare:', result?.totalFare)
 *   });
 * 
 *   return (
 *     <div>
 *       {segments.map((segment, index) => (
 *         <div key={`${segment.stationId}-${index}`}>
 *           {segment.stationName}
 *           <button onClick={() => removeStation(index)}>Remove</button>
 *         </div>
 *       ))}
 *       <button onClick={() => addStation(1234)} disabled={!validation.isValid}>
 *         Add Tokyo Station
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRouteBuilder(
  options: UseRouteBuilderOptions = {}
): UseRouteBuildingResult {
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options]);
  const { farert, isLoading } = useFarert();

  // State management
  const [state, setState] = useState<RouteBuilderState>(() => ({
    segments: opts.initialRoute || [],
    validation: { isValid: true, errors: [], warnings: [], suggestions: [] },
    fareResult: null,
    isCalculating: false,
    isValidating: false,
    isDirty: false,
    dragState: {
      isDragging: false,
      dragIndex: -1,
      dragOverIndex: -1
    }
  }));

  // Command history for undo/redo
  const undoStack = useRef<RouteCommand[]>([]);
  const redoStack = useRef<RouteCommand[]>([]);
  const commandIdCounter = useRef(0);

  // Timers for debouncing
  const validationTimer = useRef<NodeJS.Timeout>();
  const calculationTimer = useRef<NodeJS.Timeout>();

  // Route builder utility
  const routeBuilder = useRef<RouteBuilder>(createRouteBuilder());

  /**
   * Generate unique command ID
   */
  const generateCommandId = useCallback((): string => {
    return `cmd_${Date.now()}_${++commandIdCounter.current}`;
  }, []);

  /**
   * Execute command and add to undo stack
   */
  const executeCommand = useCallback((command: RouteCommand) => {
    if (!opts.enableUndo) {
      command.execute();
      return;
    }

    // Clear redo stack when new command is executed
    redoStack.current = [];

    // Add to undo stack
    undoStack.current.push(command);

    // Limit undo history size
    if (undoStack.current.length > opts.maxUndoHistory) {
      undoStack.current.shift();
    }

    // Execute the command
    command.execute();
  }, [opts.enableUndo, opts.maxUndoHistory]);

  /**
   * Get station information from WebAssembly module
   */
  const getStationInfo = useCallback(
    async (stationId: number): Promise<StationInfo | null> => {
      if (!farert) return null;

      try {
        const name = farert.getStationName(stationId);
        if (!name || name === 'null' || name === '') return null;

        // Build enhanced station info
        const stationInfo: StationInfo = {
          id: stationId,
          name,
          nameExtended: name, // Will be enhanced if extended method available
          kana: '', // Will be filled if kana method available
          prefecture: '',
          prefectureId: 0,
          isJunction: Boolean(farert.isJunction?.(stationId)),
          lines: [] // Will be filled if line enumeration available
        };

        // Try to get enhanced information if available
        if (farert.getStationNameEx) {
          stationInfo.nameExtended = farert.getStationNameEx(stationId) || name;
        }

        if (farert.getStationKana) {
          stationInfo.kana = farert.getStationKana(stationId) || '';
        }

        if (farert.getStationPrefecture) {
          stationInfo.prefecture = farert.getStationPrefecture(stationId) || '';
        }

        return stationInfo;
      } catch (error) {
        console.warn(`Failed to get station info for ${stationId}:`, error);
        return null;
      }
    },
    [farert]
  );

  /**
   * Get line information from WebAssembly module
   */
  const getLineInfo = useCallback(
    async (lineId: number): Promise<LineInfo | null> => {
      if (!farert) return null;

      try {
        const name = farert.getLineName(lineId);
        if (!name || name === 'null' || name === '') return null;

        const lineInfo: LineInfo = {
          id: lineId,
          name,
          companyId: 0, // Will be enhanced if company method available
          companyName: '',
          isJR: lineId < 0x10000, // JR lines typically have lower IDs
          isPrivate: lineId >= 0x10000,
          stations: [] // Will be filled if station enumeration available
        };

        // Try to get enhanced information if available
        if (farert.getCompanyName && farert.getLineCompanyId) {
          const companyId = farert.getLineCompanyId(lineId);
          if (companyId > 0) {
            lineInfo.companyId = companyId;
            lineInfo.companyName = farert.getCompanyName(companyId) || '';
          }
        }

        return lineInfo;
      } catch (error) {
        console.warn(`Failed to get line info for ${lineId}:`, error);
        return null;
      }
    },
    [farert]
  );

  /**
   * Validate route segments using WebAssembly module
   */
  const validateRouteSegments = useCallback(
    async (segments: RouteSegmentInfo[]): Promise<RouteValidationResult> => {
      if (!farert || segments.length === 0) {
        return { isValid: true, errors: [], warnings: [], suggestions: [] };
      }

      try {
        // Convert segments to route string for validation
        const routeParts: string[] = [];
        for (let i = 0; i < segments.length; i++) {
          routeParts.push(segments[i].stationName);
          if (i < segments.length - 1 && segments[i + 1].lineName) {
            routeParts.push(segments[i + 1].lineName!);
          }
        }

        const routeString = routeParts.join(' ');
        const basicValidation = validateRoute(routeString);

        // Enhanced validation using WebAssembly
        const errors: RouteValidationError[] = [...basicValidation.errors];
        const warnings: RouteValidationWarning[] = [...basicValidation.warnings];

        // Validate station existence
        for (let i = 0; i < segments.length; i++) {
          const segment = segments[i];
          const stationName = farert.getStationName(segment.stationId);
          
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
          const currentSegment = segments[i];
          const nextSegment = segments[i + 1];

          if (nextSegment.lineId) {
            const lineName = farert.getLineName(nextSegment.lineId);
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
    },
    [farert]
  );

  /**
   * Calculate fare for current route using WebAssembly
   */
  const calculateFare = useCallback(
    async (segments: RouteSegmentInfo[]): Promise<RoutePlanResult | null> => {
      if (!farert || segments.length < 2) return null;

      try {
        // Create route using object classes
        const route = new farert.cRoute();
        let success = true;

        // Build route step by step
        for (let i = 0; i < segments.length; i++) {
          if (i === 0) {
            // First station - start point
            const result = route.addRoute(segments[i].stationId);
            if (result !== 0) {
              console.warn(`Failed to add start station ${segments[i].stationId}`);
              success = false;
              break;
            }
          } else {
            // Subsequent stations with line information
            const lineId = segments[i].lineId || 0;
            const result = route.addRouteWithLine(lineId, segments[i].stationId);
            if (result !== 0) {
              console.warn(`Failed to add route segment: line ${lineId}, station ${segments[i].stationId}`);
              success = false;
              break;
            }
          }
        }

        if (!success) return null;

        // Calculate fare using CalcRoute
        const calcRoute = new farert.cCalcRoute(route);
        const fareInfo = calcRoute.calcFare();

        if (!fareInfo || fareInfo.result !== 0) {
          console.warn('Fare calculation failed:', fareInfo?.result);
          return null;
        }

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

        // Add discount information if available
        if (fareInfo.availCountForFareOfStockDiscount > 0) {
          for (let i = 0; i < fareInfo.availCountForFareOfStockDiscount; i++) {
            const discountFare = fareInfo.fareForStockDiscount?.(i);
            const discountTitle = fareInfo.fareForStockDiscountTitle?.(i);
            if (discountFare && discountTitle) {
              result.fareBreakdown.push({
                description: discountTitle,
                amount: discountFare,
                type: 'discount'
              });
            }
          }
        }

        return result;
      } catch (error) {
        console.error('Fare calculation error:', error);
        return null;
      }
    },
    [farert]
  );

  /**
   * Debounced validation function
   */
  const debouncedValidate = useCallback(
    (segments: RouteSegmentInfo[]) => {
      if (!opts.autoValidate) return;

      setState(prev => ({ ...prev, isValidating: true }));

      if (validationTimer.current) {
        clearTimeout(validationTimer.current);
      }

      validationTimer.current = setTimeout(async () => {
        const validation = await validateRouteSegments(segments);
        setState(prev => ({ ...prev, validation, isValidating: false }));
        opts.onValidationChange(validation);
      }, opts.debounceMs);
    },
    [opts.autoValidate, opts.debounceMs, opts.onValidationChange, validateRouteSegments]
  );

  /**
   * Debounced fare calculation function
   */
  const debouncedCalculate = useCallback(
    (segments: RouteSegmentInfo[]) => {
      if (!opts.enableRealTimeCalculation || segments.length < 2) return;

      setState(prev => ({ ...prev, isCalculating: true }));

      if (calculationTimer.current) {
        clearTimeout(calculationTimer.current);
      }

      calculationTimer.current = setTimeout(async () => {
        const result = await calculateFare(segments);
        setState(prev => ({ ...prev, fareResult: result, isCalculating: false }));
        opts.onFareCalculated(result);
      }, opts.debounceMs);
    },
    [opts.enableRealTimeCalculation, opts.debounceMs, opts.onFareCalculated, calculateFare]
  );

  /**
   * Update segments and trigger validation/calculation
   */
  const updateSegments = useCallback(
    (newSegments: RouteSegmentInfo[]) => {
      setState(prev => ({ ...prev, segments: newSegments, isDirty: true }));
      opts.onRouteChange(newSegments);
      debouncedValidate(newSegments);
      debouncedCalculate(newSegments);
    },
    [opts.onRouteChange, debouncedValidate, debouncedCalculate]
  );

  /**
   * Add station to route
   */
  const addStation = useCallback(
    async (stationId: number, lineId?: number) => {
      if (state.segments.length >= opts.maxStations) {
        throw new ReactSDKError(
          `最大駅数 (${opts.maxStations}) に達しています`,
          ReactSDKErrorCode.VALIDATION_FAILED
        );
      }

      const stationInfo = await getStationInfo(stationId);
      if (!stationInfo) {
        throw new ReactSDKError(
          `駅ID ${stationId} が見つかりません`,
          ReactSDKErrorCode.VALIDATION_FAILED
        );
      }

      let lineInfo: LineInfo | null = null;
      if (lineId) {
        lineInfo = await getLineInfo(lineId);
        if (!lineInfo) {
          throw new ReactSDKError(
            `路線ID ${lineId} が見つかりません`,
            ReactSDKErrorCode.VALIDATION_FAILED
          );
        }
      }

      const newSegment: RouteSegmentInfo = {
        stationId,
        stationName: stationInfo.name,
        stationKana: stationInfo.kana,
        lineId,
        lineName: lineInfo?.name,
        isTransfer: state.segments.length > 0,
        transferLines: stationInfo.lines
      };

      const oldSegments = [...state.segments];
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
    },
    [
      state.segments,
      opts.maxStations,
      getStationInfo,
      getLineInfo,
      generateCommandId,
      updateSegments,
      executeCommand
    ]
  );

  /**
   * Remove station from route
   */
  const removeStation = useCallback(
    (index: number) => {
      if (index < 0 || index >= state.segments.length) {
        throw new ReactSDKError(
          `無効なインデックス: ${index}`,
          ReactSDKErrorCode.VALIDATION_FAILED
        );
      }

      const oldSegments = [...state.segments];
      const removedSegment = oldSegments[index];
      const newSegments = oldSegments.filter((_, i) => i !== index);

      const command: RouteCommand = {
        id: generateCommandId(),
        type: 'remove',
        timestamp: Date.now(),
        description: `駅「${removedSegment.stationName}」を削除`,
        data: { segment: removedSegment, index },
        execute: () => updateSegments(newSegments),
        undo: () => {
          const restored = [...oldSegments];
          restored.splice(index, 0, removedSegment);
          updateSegments(restored);
        }
      };

      executeCommand(command);
    },
    [state.segments, generateCommandId, updateSegments, executeCommand]
  );

  /**
   * Move station to new position (for drag-and-drop)
   */
  const moveStation = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        fromIndex < 0 || fromIndex >= state.segments.length ||
        toIndex < 0 || toIndex >= state.segments.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      const oldSegments = [...state.segments];
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
    },
    [state.segments, generateCommandId, updateSegments, executeCommand]
  );

  /**
   * Clear all stations
   */
  const clear = useCallback(() => {
    if (state.segments.length === 0) return;

    const oldSegments = [...state.segments];

    const command: RouteCommand = {
      id: generateCommandId(),
      type: 'clear',
      timestamp: Date.now(),
      description: '全ての駅をクリア',
      execute: () => updateSegments([]),
      undo: () => updateSegments(oldSegments)
    };

    executeCommand(command);
  }, [state.segments, generateCommandId, updateSegments, executeCommand]);

  /**
   * Optimize route (placeholder for future implementation)
   */
  const optimize = useCallback(() => {
    // Future implementation: use AI or heuristics to optimize route
    console.log('Route optimization not yet implemented');
  }, []);

  /**
   * Undo last command
   */
  const undo = useCallback(() => {
    if (!opts.enableUndo || undoStack.current.length === 0) return;

    const command = undoStack.current.pop();
    if (command) {
      redoStack.current.push(command);
      command.undo();
    }
  }, [opts.enableUndo]);

  /**
   * Redo last undone command
   */
  const redo = useCallback(() => {
    if (!opts.enableUndo || redoStack.current.length === 0) return;

    const command = redoStack.current.pop();
    if (command) {
      undoStack.current.push(command);
      command.execute();
    }
  }, [opts.enableUndo]);

  // Drag and drop handlers
  const onDragStart = useCallback(
    (index: number) => {
      if (!opts.enableDragDrop) return;
      setState(prev => ({
        ...prev,
        dragState: { ...prev.dragState, isDragging: true, dragIndex: index }
      }));
    },
    [opts.enableDragDrop]
  );

  const onDragOver = useCallback(
    (index: number) => {
      if (!opts.enableDragDrop || !state.dragState.isDragging) return;
      setState(prev => ({
        ...prev,
        dragState: { ...prev.dragState, dragOverIndex: index }
      }));
    },
    [opts.enableDragDrop, state.dragState.isDragging]
  );

  const onDragEnd = useCallback(() => {
    if (!opts.enableDragDrop) return;

    const { dragIndex, dragOverIndex } = state.dragState;
    if (dragIndex >= 0 && dragOverIndex >= 0 && dragIndex !== dragOverIndex) {
      moveStation(dragIndex, dragOverIndex);
    }

    setState(prev => ({
      ...prev,
      dragState: { isDragging: false, dragIndex: -1, dragOverIndex: -1 }
    }));
  }, [opts.enableDragDrop, state.dragState, moveStation]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (validationTimer.current) clearTimeout(validationTimer.current);
      if (calculationTimer.current) clearTimeout(calculationTimer.current);
    };
  }, []);

  // Initial validation if route provided
  useEffect(() => {
    if (opts.initialRoute && opts.initialRoute.length > 0) {
      debouncedValidate(opts.initialRoute);
      debouncedCalculate(opts.initialRoute);
    }
  }, [opts.initialRoute, debouncedValidate, debouncedCalculate]);

  // Memoized computed values
  const canUndo = useMemo(() => opts.enableUndo && undoStack.current.length > 0, [opts.enableUndo, state.isDirty]);
  const canRedo = useMemo(() => opts.enableUndo && redoStack.current.length > 0, [opts.enableUndo, state.isDirty]);

  const isValid = useMemo(() => state.validation.isValid && !isLoading, [state.validation.isValid, isLoading]);

  const errorMessage = useMemo(
    () => state.validation.errors.length > 0 ? formatValidationErrors(state.validation) : null,
    [state.validation]
  );

  return {
    // State
    segments: state.segments,
    validation: state.validation,
    fareResult: state.fareResult,
    isValid,
    isLoading: isLoading || state.isValidating || state.isCalculating,
    isDirty: state.isDirty,
    errorMessage,

    // Actions
    addStation,
    removeStation,
    moveStation,
    clear,
    optimize,

    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,

    // Drag and Drop
    onDragStart: opts.enableDragDrop ? onDragStart : undefined,
    onDragOver: opts.enableDragDrop ? onDragOver : undefined,
    onDragEnd: opts.enableDragDrop ? onDragEnd : undefined,
    dragState: state.dragState,

    // Utilities
    validateRoute: validateRouteSegments,
    calculateFare,
    getStationInfo,
    getLineInfo,

    // Builder utilities
    routeBuilder: routeBuilder.current
  };
}

export default useRouteBuilder;