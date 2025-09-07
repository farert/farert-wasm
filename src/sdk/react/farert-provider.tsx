/**
 * React Context Provider for Farert WebAssembly SDK
 * Provides comprehensive state management for WebAssembly initialization,
 * error handling, and React-friendly API access
 * 
 * Requirements: REQ-API-003 - React Integration Hooks and Components
 */

import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useEffect, 
  useCallback, 
  useRef,
  useMemo,
  type ReactNode 
} from 'react';
import { 
  FarertModule,
  FareInfoData,
  CLIError,
  CLIErrorCode,
  WebAssemblyLoadError,
  DatabaseError,
  type RouteWrapper,
  type CalcRouteWrapper
} from '../types';

// Types and Interfaces
export type FarertInitializationState = 'idle' | 'loading' | 'ready' | 'error' | 'retrying';

export interface StationSearchResult {
  id: number;
  name: string;
  nameEx: string;
  kana: string;
  prefecture: string;
}

export interface LineInfo {
  id: number;
  name: string;
  companyId: number;
}

export interface RouteSegment {
  stationId: number;
  stationName: string;
  lineId?: number;
  lineName?: string;
}

export interface FareCalculationResult {
  fareInfo: FareInfoData;
  route: RouteSegment[];
  calculatedAt: Date;
  calculationTimeMs: number;
}

export interface FarertContextState {
  // Initialization state
  initState: FarertInitializationState;
  error: CLIError | null;
  retryCount: number;
  maxRetries: number;
  
  // WebAssembly module
  module: FarertModule | null;
  
  // Cached data for performance
  stationsCache: Map<string, StationSearchResult[]>;
  linesCache: Map<number, LineInfo[]>;
  fareCalculationCache: Map<string, FareCalculationResult>;
  
  // Configuration
  config: {
    enableCache: boolean;
    cacheTimeout: number; // milliseconds
    debugMode: boolean;
    autoRetry: boolean;
  };
}

export interface FarertContextValue extends FarertContextState {
  // Actions
  initialize: () => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  clearCache: () => void;
  
  // Station operations
  searchStations: (query: string) => Promise<StationSearchResult[]>;
  getStationById: (id: number) => Promise<StationSearchResult | null>;
  
  // Line operations  
  getLinesForStation: (stationId: number) => Promise<LineInfo[]>;
  getLineById: (id: number) => Promise<LineInfo | null>;
  
  // Route calculation
  calculateFare: (route: RouteSegment[]) => Promise<FareCalculationResult>;
  createRoute: () => RouteWrapper | null;
  createCalcRoute: () => CalcRouteWrapper | null;
  
  // Utility functions
  isReady: boolean;
  isLoading: boolean;
  hasError: boolean;
  canRetry: boolean;
}

export interface FarertProviderProps {
  children: ReactNode;
  config?: Partial<FarertContextState['config']>;
  onInitialized?: () => void;
  onError?: (error: CLIError) => void;
  maxRetries?: number;
}

// Action types for reducer
type FarertAction = 
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: { module: FarertModule } }
  | { type: 'INIT_ERROR'; payload: { error: CLIError } }
  | { type: 'RETRY_START' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_CONFIG'; payload: Partial<FarertContextState['config']> }
  | { type: 'CACHE_STATIONS'; payload: { query: string; results: StationSearchResult[] } }
  | { type: 'CACHE_LINES'; payload: { stationId: number; lines: LineInfo[] } }
  | { type: 'CACHE_FARE'; payload: { key: string; result: FareCalculationResult } };

// Initial state
const initialState: FarertContextState = {
  initState: 'idle',
  error: null,
  retryCount: 0,
  maxRetries: 3,
  module: null,
  stationsCache: new Map(),
  linesCache: new Map(),
  fareCalculationCache: new Map(),
  config: {
    enableCache: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    debugMode: false,
    autoRetry: true
  }
};

// Reducer function
function farertReducer(state: FarertContextState, action: FarertAction): FarertContextState {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        initState: 'loading',
        error: null
      };
    
    case 'INIT_SUCCESS':
      return {
        ...state,
        initState: 'ready',
        error: null,
        module: action.payload.module,
        retryCount: 0
      };
    
    case 'INIT_ERROR':
      return {
        ...state,
        initState: 'error',
        error: action.payload.error,
        retryCount: state.retryCount + 1
      };
    
    case 'RETRY_START':
      return {
        ...state,
        initState: 'retrying',
        error: null
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        initState: state.module ? 'ready' : 'idle'
      };
    
    case 'CLEAR_CACHE':
      return {
        ...state,
        stationsCache: new Map(),
        linesCache: new Map(),
        fareCalculationCache: new Map()
      };
    
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload }
      };
    
    case 'CACHE_STATIONS':
      const newStationsCache = new Map(state.stationsCache);
      newStationsCache.set(action.payload.query, action.payload.results);
      return {
        ...state,
        stationsCache: newStationsCache
      };
    
    case 'CACHE_LINES':
      const newLinesCache = new Map(state.linesCache);
      newLinesCache.set(action.payload.stationId, action.payload.lines);
      return {
        ...state,
        linesCache: newLinesCache
      };
    
    case 'CACHE_FARE':
      const newFareCache = new Map(state.fareCalculationCache);
      newFareCache.set(action.payload.key, action.payload.result);
      return {
        ...state,
        fareCalculationCache: newFareCache
      };
    
    default:
      return state;
  }
}

// Context creation
const FarertContext = createContext<FarertContextValue | null>(null);

/**
 * React Context Provider for Farert SDK
 * Manages WebAssembly initialization, caching, and error handling
 */
export function FarertProvider({ 
  children, 
  config: userConfig = {}, 
  onInitialized,
  onError,
  maxRetries = 3
}: FarertProviderProps) {
  const [state, dispatch] = useReducer(farertReducer, {
    ...initialState,
    config: { ...initialState.config, ...userConfig },
    maxRetries
  });
  
  // Refs for cleanup and avoiding stale closures
  const wasmLoaderRef = useRef<any>(null);
  const cacheTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (wasmLoaderRef.current) {
      try {
        wasmLoaderRef.current.cleanup();
      } catch (error) {
        console.warn('[FarertProvider] Cleanup warning:', error);
      }
      wasmLoaderRef.current = null;
    }
    
    // Clear cache timers
    cacheTimersRef.current.forEach(timer => clearTimeout(timer));
    cacheTimersRef.current.clear();
  }, []);
  
  // Initialize WebAssembly module
  const initialize = useCallback(async () => {
    if (state.initState === 'loading' || state.initState === 'retrying') {
      return; // Already initializing
    }
    
    dispatch({ type: 'INIT_START' });
    
    try {
      // Import WasmLoader dynamically to avoid SSR issues
      const { wasmLoader } = await import('../../cli/wasm_loader');
      wasmLoaderRef.current = wasmLoader;
      
      // Update configuration
      const config = wasmLoader.getConfiguration();
      if (state.config.debugMode !== config.debug) {
        // Update config to match WASM loader
        dispatch({ 
          type: 'UPDATE_CONFIG', 
          payload: { debugMode: config.debug } 
        });
      }
      
      // Load and initialize module
      const module = await wasmLoader.loadModule();
      const dbInitialized = await wasmLoader.initializeDatabase();
      
      if (!dbInitialized) {
        throw new DatabaseError('Database initialization returned false');
      }
      
      dispatch({ 
        type: 'INIT_SUCCESS', 
        payload: { module } 
      });
      
      if (onInitialized) {
        onInitialized();
      }
      
    } catch (error) {
      const farertError = error instanceof CLIError 
        ? error 
        : new WebAssemblyLoadError(
            error instanceof Error ? error.message : String(error),
            { originalError: error }
          );
      
      dispatch({ 
        type: 'INIT_ERROR', 
        payload: { error: farertError } 
      });
      
      if (onError) {
        onError(farertError);
      }
    }
  }, [state.initState, state.config.debugMode, onInitialized, onError]);
  
  // Retry initialization
  const retry = useCallback(async () => {
    if (state.retryCount >= state.maxRetries) {
      return;
    }
    
    dispatch({ type: 'RETRY_START' });
    
    // Clean up previous attempt
    cleanup();
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, state.retryCount)));
    
    return initialize();
  }, [state.retryCount, state.maxRetries, cleanup, initialize]);
  
  // Clear error state
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);
  
  // Clear all caches
  const clearCache = useCallback(() => {
    cacheTimersRef.current.forEach(timer => clearTimeout(timer));
    cacheTimersRef.current.clear();
    dispatch({ type: 'CLEAR_CACHE' });
  }, []);
  
  // Station search with caching
  const searchStations = useCallback(async (query: string): Promise<StationSearchResult[]> => {
    if (!state.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    // Check cache first
    if (state.config.enableCache && state.stationsCache.has(query)) {
      return state.stationsCache.get(query)!;
    }
    
    try {
      // Simple implementation - in real app would implement fuzzy search
      const stationId = state.module.getStationId(query);
      const results: StationSearchResult[] = [];
      
      if (stationId > 0) {
        const name = state.module.getStationName(stationId);
        results.push({
          id: stationId,
          name: name,
          nameEx: name, // Would get extended name if available
          kana: '', // Would get kana reading if available
          prefecture: '' // Would get prefecture if available
        });
      }
      
      // Cache results
      if (state.config.enableCache) {
        dispatch({ 
          type: 'CACHE_STATIONS', 
          payload: { query, results } 
        });
        
        // Set cache expiration timer
        const timer = setTimeout(() => {
          const newCache = new Map(state.stationsCache);
          newCache.delete(query);
          dispatch({ type: 'CLEAR_CACHE' });
        }, state.config.cacheTimeout);
        
        cacheTimersRef.current.set(`station_${query}`, timer);
      }
      
      return results;
      
    } catch (error) {
      throw new CLIError(
        `Station search failed: ${error instanceof Error ? error.message : String(error)}`,
        CLIErrorCode.INVALID_STATION_NAME,
        { query, originalError: error }
      );
    }
  }, [state.module, state.config.enableCache, state.stationsCache, state.config.cacheTimeout]);
  
  // Get station by ID
  const getStationById = useCallback(async (id: number): Promise<StationSearchResult | null> => {
    if (!state.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    try {
      const name = state.module.getStationName(id);
      if (!name || name === '') {
        return null;
      }
      
      return {
        id,
        name,
        nameEx: name,
        kana: '',
        prefecture: ''
      };
      
    } catch (error) {
      throw new CLIError(
        `Failed to get station by ID: ${error instanceof Error ? error.message : String(error)}`,
        CLIErrorCode.INVALID_STATION_NAME,
        { stationId: id, originalError: error }
      );
    }
  }, [state.module]);
  
  // Get lines for station
  const getLinesForStation = useCallback(async (stationId: number): Promise<LineInfo[]> => {
    if (!state.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    // Check cache first
    if (state.config.enableCache && state.linesCache.has(stationId)) {
      return state.linesCache.get(stationId)!;
    }
    
    try {
      // Placeholder implementation - would use actual WASM API
      const results: LineInfo[] = [];
      
      // Cache results
      if (state.config.enableCache) {
        dispatch({
          type: 'CACHE_LINES',
          payload: { stationId, lines: results }
        });
      }
      
      return results;
      
    } catch (error) {
      throw new CLIError(
        `Failed to get lines for station: ${error instanceof Error ? error.message : String(error)}`,
        CLIErrorCode.INVALID_STATION_NAME,
        { stationId, originalError: error }
      );
    }
  }, [state.module, state.config.enableCache, state.linesCache]);
  
  // Get line by ID
  const getLineById = useCallback(async (id: number): Promise<LineInfo | null> => {
    if (!state.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    try {
      const name = state.module.getLineName(id);
      if (!name || name === '') {
        return null;
      }
      
      return {
        id,
        name,
        companyId: 0 // Would get actual company ID
      };
      
    } catch (error) {
      throw new CLIError(
        `Failed to get line by ID: ${error instanceof Error ? error.message : String(error)}`,
        CLIErrorCode.INVALID_LINE_NAME,
        { lineId: id, originalError: error }
      );
    }
  }, [state.module]);
  
  // Calculate fare for route
  const calculateFare = useCallback(async (route: RouteSegment[]): Promise<FareCalculationResult> => {
    if (!state.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    if (route.length < 2) {
      throw new CLIError('Route must have at least 2 stations', CLIErrorCode.INVALID_ROUTE_FORMAT);
    }
    
    // Generate cache key
    const cacheKey = route.map(r => `${r.stationId}_${r.lineId || 0}`).join('|');
    
    // Check cache first
    if (state.config.enableCache && state.fareCalculationCache.has(cacheKey)) {
      return state.fareCalculationCache.get(cacheKey)!;
    }
    
    const startTime = Date.now();
    
    try {
      // Clear any existing route
      state.module.removeAll();
      
      // Add route beginning
      const startResult = state.module.addRouteBegin(route[0].stationId);
      if (startResult !== 0) {
        throw new CLIError(
          `Failed to set starting station: ${route[0].stationName}`,
          CLIErrorCode.ROUTE_CALC_FAILED,
          { stationId: route[0].stationId, result: startResult }
        );
      }
      
      // Add route segments
      for (let i = 1; i < route.length; i++) {
        const segment = route[i];
        const result = segment.lineId 
          ? state.module.addRoute(segment.lineId, segment.stationId)
          : state.module.addRoute(0, segment.stationId); // Auto-route
        
        if (result !== 0) {
          throw new CLIError(
            `Failed to add route segment to: ${segment.stationName}`,
            CLIErrorCode.ROUTE_CALC_FAILED,
            { 
              stationId: segment.stationId, 
              lineId: segment.lineId,
              result,
              segmentIndex: i 
            }
          );
        }
      }
      
      // Calculate fare
      const fareResult = state.module.calculateFare();
      if (fareResult < 0) {
        throw new CLIError(
          'Fare calculation failed',
          CLIErrorCode.FARE_CALC_ERROR,
          { result: fareResult }
        );
      }
      
      // Get detailed fare information
      const fareInfoJson = state.module.getFareInfoJson();
      const fareInfo: FareInfoData = JSON.parse(fareInfoJson);
      
      const result: FareCalculationResult = {
        fareInfo,
        route,
        calculatedAt: new Date(),
        calculationTimeMs: Date.now() - startTime
      };
      
      // Cache result
      if (state.config.enableCache) {
        dispatch({
          type: 'CACHE_FARE',
          payload: { key: cacheKey, result }
        });
        
        // Set cache expiration timer
        const timer = setTimeout(() => {
          const newCache = new Map(state.fareCalculationCache);
          newCache.delete(cacheKey);
          // Don't dispatch CLEAR_CACHE as it would clear all caches
        }, state.config.cacheTimeout);
        
        cacheTimersRef.current.set(`fare_${cacheKey}`, timer);
      }
      
      return result;
      
    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      }
      
      throw new CLIError(
        `Fare calculation failed: ${error instanceof Error ? error.message : String(error)}`,
        CLIErrorCode.FARE_CALC_ERROR,
        { route, originalError: error, calculationTimeMs: Date.now() - startTime }
      );
    }
  }, [state.module, state.config.enableCache, state.fareCalculationCache, state.config.cacheTimeout]);
  
  // Create route wrapper
  const createRoute = useCallback((): RouteWrapper | null => {
    if (!state.module) {
      return null;
    }
    
    try {
      return new state.module.cRoute();
    } catch (error) {
      console.error('[FarertProvider] Failed to create route:', error);
      return null;
    }
  }, [state.module]);
  
  // Create calc route wrapper
  const createCalcRoute = useCallback((): CalcRouteWrapper | null => {
    if (!state.module) {
      return null;
    }
    
    try {
      const route = new state.module.cRoute();
      return new state.module.cCalcRoute(route);
    } catch (error) {
      console.error('[FarertProvider] Failed to create calc route:', error);
      return null;
    }
  }, [state.module]);
  
  // Auto-initialize on mount
  useEffect(() => {
    if (state.initState === 'idle') {
      initialize();
    }
  }, [initialize, state.initState]);
  
  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  // Auto-retry on error if configured
  useEffect(() => {
    if (state.initState === 'error' && 
        state.config.autoRetry && 
        state.retryCount < state.maxRetries) {
      const timer = setTimeout(() => {
        retry();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [state.initState, state.config.autoRetry, state.retryCount, state.maxRetries, retry]);
  
  // Computed values
  const contextValue = useMemo((): FarertContextValue => ({
    ...state,
    initialize,
    retry,
    clearError,
    clearCache,
    searchStations,
    getStationById,
    getLinesForStation,
    getLineById,
    calculateFare,
    createRoute,
    createCalcRoute,
    isReady: state.initState === 'ready',
    isLoading: state.initState === 'loading' || state.initState === 'retrying',
    hasError: state.initState === 'error',
    canRetry: state.retryCount < state.maxRetries
  }), [
    state,
    initialize,
    retry,
    clearError,
    clearCache,
    searchStations,
    getStationById,
    getLinesForStation,
    getLineById,
    calculateFare,
    createRoute,
    createCalcRoute
  ]);
  
  return (
    <FarertContext.Provider value={contextValue}>
      {children}
    </FarertContext.Provider>
  );
}

/**
 * Hook to use Farert context
 * @throws Error if used outside FarertProvider
 */
export function useFarert(): FarertContextValue {
  const context = useContext(FarertContext);
  
  if (!context) {
    throw new Error(
      'useFarert must be used within a FarertProvider. ' +
      'Wrap your component tree with <FarertProvider>.'
    );
  }
  
  return context;
}

/**
 * Higher-order component for components that need Farert context
 */
export function withFarert<P extends object>(
  Component: React.ComponentType<P & { farert: FarertContextValue }>
): React.ComponentType<P> {
  return function FarertWrappedComponent(props: P) {
    const farert = useFarert();
    return <Component {...props} farert={farert} />;
  };
}

// Error boundary for WebAssembly failures
export interface FarertErrorBoundaryState {
  hasError: boolean;
  error?: CLIError;
  errorInfo?: React.ErrorInfo;
}

export interface FarertErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<FarertErrorBoundaryState>;
  onError?: (error: CLIError, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error boundary specifically for WebAssembly and Farert-related errors
 */
export class FarertErrorBoundary extends React.Component<
  FarertErrorBoundaryProps,
  FarertErrorBoundaryState
> {
  constructor(props: FarertErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): FarertErrorBoundaryState {
    const farertError = error instanceof CLIError 
      ? error 
      : new CLIError(
          error.message || 'Unknown error in Farert component',
          CLIErrorCode.JAVASCRIPT_EXCEPTION,
          { originalError: error }
        );
    
    return {
      hasError: true,
      error: farertError
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const farertError = this.state.error || new CLIError(
      error.message || 'Component error',
      CLIErrorCode.JAVASCRIPT_EXCEPTION
    );
    
    this.setState({ errorInfo });
    
    if (this.props.onError) {
      this.props.onError(farertError, errorInfo);
    }
    
    // Log error for debugging
    console.error('[FarertErrorBoundary] Component error:', error);
    console.error('[FarertErrorBoundary] Error info:', errorInfo);
    
    if (farertError instanceof CLIError) {
      console.error('[FarertErrorBoundary] Formatted error:', farertError.getFormattedMessage());
    }
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent {...this.state} />;
      }
      
      // Default fallback
      return (
        <div className="farert-error-boundary" style={{ 
          padding: '20px', 
          border: '1px solid #ff6b6b',
          borderRadius: '4px',
          backgroundColor: '#ffebee',
          margin: '10px 0'
        }}>
          <h3 style={{ color: '#c62828', margin: '0 0 10px 0' }}>
            🚫 Railway System Error
          </h3>
          
          <p style={{ margin: '0 0 10px 0' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          
          {this.state.error instanceof CLIError && this.state.error.suggestions.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <strong>Suggestions:</strong>
              <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
                {this.state.error.suggestions.map((suggestion, index) => (
                  <li key={index} style={{ margin: '2px 0' }}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}

export default FarertProvider;