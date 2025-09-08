/**
 * Svelte Store for Farert WebAssembly SDK
 * Provides comprehensive state management for WebAssembly initialization,
 * error handling, and Svelte-friendly reactive API access
 * 
 * Requirements: REQ-API-003 - Svelte Integration Stores and Components
 */

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
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

export interface FarertStoreState {
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

export interface FarertStoreConfig {
  enableCache?: boolean;
  cacheTimeout?: number;
  debugMode?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  onInitialized?: () => void;
  onError?: (error: CLIError) => void;
}

// Initial state
const initialState: FarertStoreState = {
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

// Create the main store
function createFarertStore() {
  const { subscribe, set, update } = writable<FarertStoreState>(initialState);
  
  // Internal state for cleanup and avoiding memory leaks
  let wasmLoader: any = null;
  let cacheTimers = new Map<string, NodeJS.Timeout>();
  let storeConfig: FarertStoreConfig = {};
  
  // Cleanup function
  const cleanup = () => {
    if (wasmLoader) {
      try {
        wasmLoader.cleanup();
      } catch (error) {
        console.warn('[FarertStore] Cleanup warning:', error);
      }
      wasmLoader = null;
    }
    
    // Clear cache timers
    cacheTimers.forEach(timer => clearTimeout(timer));
    cacheTimers.clear();
  };
  
  // Initialize WebAssembly module
  const initialize = async (config?: FarertStoreConfig) => {
    if (config) {
      storeConfig = { ...storeConfig, ...config };
    }
    
    const currentState = get({ subscribe });
    if (currentState.initState === 'loading' || currentState.initState === 'retrying') {
      return; // Already initializing
    }
    
    update(state => ({
      ...state,
      initState: 'loading',
      error: null,
      config: { ...state.config, ...config },
      maxRetries: config?.maxRetries ?? state.maxRetries
    }));
    
    try {
      // Import WasmLoader dynamically to avoid SSR issues
      const { wasmLoader: loader } = await import('../../cli/wasm_loader');
      wasmLoader = loader;
      
      // Update configuration
      const wasmConfig = wasmLoader.getConfiguration();
      update(state => ({
        ...state,
        config: { 
          ...state.config, 
          debugMode: wasmConfig.debug 
        }
      }));
      
      // Load and initialize module
      const module = await wasmLoader.loadModule();
      const dbInitialized = await wasmLoader.initializeDatabase();
      
      if (!dbInitialized) {
        throw new DatabaseError('Database initialization returned false');
      }
      
      update(state => ({
        ...state,
        initState: 'ready',
        error: null,
        module,
        retryCount: 0
      }));
      
      if (storeConfig.onInitialized) {
        storeConfig.onInitialized();
      }
      
    } catch (error) {
      const farertError = error instanceof CLIError 
        ? error 
        : new WebAssemblyLoadError(
            error instanceof Error ? error.message : String(error),
            { originalError: error }
          );
      
      update(state => ({
        ...state,
        initState: 'error',
        error: farertError,
        retryCount: state.retryCount + 1
      }));
      
      if (storeConfig.onError) {
        storeConfig.onError(farertError);
      }
    }
  };
  
  // Retry initialization
  const retry = async () => {
    const currentState = get({ subscribe });
    if (currentState.retryCount >= currentState.maxRetries) {
      return;
    }
    
    update(state => ({
      ...state,
      initState: 'retrying',
      error: null
    }));
    
    // Clean up previous attempt
    cleanup();
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, currentState.retryCount)));
    
    return initialize();
  };
  
  // Clear error state
  const clearError = () => {
    update(state => ({
      ...state,
      error: null,
      initState: state.module ? 'ready' : 'idle'
    }));
  };
  
  // Clear all caches
  const clearCache = () => {
    cacheTimers.forEach(timer => clearTimeout(timer));
    cacheTimers.clear();
    
    update(state => ({
      ...state,
      stationsCache: new Map(),
      linesCache: new Map(),
      fareCalculationCache: new Map()
    }));
  };
  
  // Station search with caching
  const searchStations = async (query: string): Promise<StationSearchResult[]> => {
    const currentState = get({ subscribe });
    if (!currentState.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    // Check cache first
    if (currentState.config.enableCache && currentState.stationsCache.has(query)) {
      return currentState.stationsCache.get(query)!;
    }
    
    try {
      // Simple implementation - in real app would implement fuzzy search
      const stationId = currentState.module.getStationId(query);
      const results: StationSearchResult[] = [];
      
      if (stationId > 0) {
        const name = currentState.module.getStationName(stationId);
        results.push({
          id: stationId,
          name: name,
          nameEx: name, // Would get extended name if available
          kana: '', // Would get kana reading if available
          prefecture: '' // Would get prefecture if available
        });
      }
      
      // Cache results
      if (currentState.config.enableCache) {
        update(state => {
          const newStationsCache = new Map(state.stationsCache);
          newStationsCache.set(query, results);
          return {
            ...state,
            stationsCache: newStationsCache
          };
        });
        
        // Set cache expiration timer
        const timer = setTimeout(() => {
          update(state => {
            const newCache = new Map(state.stationsCache);
            newCache.delete(query);
            return {
              ...state,
              stationsCache: newCache
            };
          });
        }, currentState.config.cacheTimeout);
        
        cacheTimers.set(`station_${query}`, timer);
      }
      
      return results;
      
    } catch (error) {
      throw new CLIError(
        `Station search failed: ${error instanceof Error ? error.message : String(error)}`,
        CLIErrorCode.INVALID_STATION_NAME,
        { query, originalError: error }
      );
    }
  };
  
  // Get station by ID
  const getStationById = async (id: number): Promise<StationSearchResult | null> => {
    const currentState = get({ subscribe });
    if (!currentState.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    try {
      const name = currentState.module.getStationName(id);
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
  };
  
  // Get lines for station
  const getLinesForStation = async (stationId: number): Promise<LineInfo[]> => {
    const currentState = get({ subscribe });
    if (!currentState.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    // Check cache first
    if (currentState.config.enableCache && currentState.linesCache.has(stationId)) {
      return currentState.linesCache.get(stationId)!;
    }
    
    try {
      // Placeholder implementation - would use actual WASM API
      const results: LineInfo[] = [];
      
      // Cache results
      if (currentState.config.enableCache) {
        update(state => {
          const newLinesCache = new Map(state.linesCache);
          newLinesCache.set(stationId, results);
          return {
            ...state,
            linesCache: newLinesCache
          };
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
  };
  
  // Get line by ID
  const getLineById = async (id: number): Promise<LineInfo | null> => {
    const currentState = get({ subscribe });
    if (!currentState.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    try {
      const name = currentState.module.getLineName(id);
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
  };
  
  // Calculate fare for route
  const calculateFare = async (route: RouteSegment[]): Promise<FareCalculationResult> => {
    const currentState = get({ subscribe });
    if (!currentState.module) {
      throw new CLIError('WebAssembly module not initialized', CLIErrorCode.WASM_RUNTIME_ERROR);
    }
    
    if (route.length < 2) {
      throw new CLIError('Route must have at least 2 stations', CLIErrorCode.INVALID_ROUTE_FORMAT);
    }
    
    // Generate cache key
    const cacheKey = route.map(r => `${r.stationId}_${r.lineId || 0}`).join('|');
    
    // Check cache first
    if (currentState.config.enableCache && currentState.fareCalculationCache.has(cacheKey)) {
      return currentState.fareCalculationCache.get(cacheKey)!;
    }
    
    const startTime = Date.now();
    
    try {
      // Clear any existing route
      currentState.module.removeAll();
      
      // Add route beginning
      const startResult = currentState.module.addRouteBegin(route[0].stationId);
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
          ? currentState.module.addRoute(segment.lineId, segment.stationId)
          : currentState.module.addRoute(0, segment.stationId); // Auto-route
        
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
      const fareResult = currentState.module.calculateFare();
      if (fareResult < 0) {
        throw new CLIError(
          'Fare calculation failed',
          CLIErrorCode.FARE_CALC_ERROR,
          { result: fareResult }
        );
      }
      
      // Get detailed fare information
      const fareInfoJson = currentState.module.getFareInfoJson();
      const fareInfo: FareInfoData = JSON.parse(fareInfoJson);
      
      const result: FareCalculationResult = {
        fareInfo,
        route,
        calculatedAt: new Date(),
        calculationTimeMs: Date.now() - startTime
      };
      
      // Cache result
      if (currentState.config.enableCache) {
        update(state => {
          const newFareCache = new Map(state.fareCalculationCache);
          newFareCache.set(cacheKey, result);
          return {
            ...state,
            fareCalculationCache: newFareCache
          };
        });
        
        // Set cache expiration timer
        const timer = setTimeout(() => {
          update(state => {
            const newCache = new Map(state.fareCalculationCache);
            newCache.delete(cacheKey);
            return {
              ...state,
              fareCalculationCache: newCache
            };
          });
        }, currentState.config.cacheTimeout);
        
        cacheTimers.set(`fare_${cacheKey}`, timer);
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
  };
  
  // Create route wrapper
  const createRoute = (): RouteWrapper | null => {
    const currentState = get({ subscribe });
    if (!currentState.module) {
      return null;
    }
    
    try {
      return new currentState.module.cRoute();
    } catch (error) {
      console.error('[FarertStore] Failed to create route:', error);
      return null;
    }
  };
  
  // Create calc route wrapper
  const createCalcRoute = (): CalcRouteWrapper | null => {
    const currentState = get({ subscribe });
    if (!currentState.module) {
      return null;
    }
    
    try {
      const route = new currentState.module.cRoute();
      return new currentState.module.cCalcRoute(route);
    } catch (error) {
      console.error('[FarertStore] Failed to create calc route:', error);
      return null;
    }
  };
  
  // Return store interface
  return {
    subscribe,
    
    // Actions
    initialize,
    retry,
    clearError,
    clearCache,
    
    // API methods
    searchStations,
    getStationById,
    getLinesForStation,
    getLineById,
    calculateFare,
    createRoute,
    createCalcRoute,
    
    // Cleanup
    destroy: cleanup
  };
}

// Create the main store instance
export const farertStore = createFarertStore();

// Derived stores for common state queries
export const isReady: Readable<boolean> = derived(
  farertStore,
  $farertStore => $farertStore.initState === 'ready'
);

export const isLoading: Readable<boolean> = derived(
  farertStore,
  $farertStore => $farertStore.initState === 'loading' || $farertStore.initState === 'retrying'
);

export const hasError: Readable<boolean> = derived(
  farertStore,
  $farertStore => $farertStore.initState === 'error'
);

export const canRetry: Readable<boolean> = derived(
  farertStore,
  $farertStore => $farertStore.retryCount < $farertStore.maxRetries
);

export const currentError: Readable<CLIError | null> = derived(
  farertStore,
  $farertStore => $farertStore.error
);

export const wasmModule: Readable<FarertModule | null> = derived(
  farertStore,
  $farertStore => $farertStore.module
);

// Auto-initialization utility
export function autoInitializeFarert(config?: FarertStoreConfig) {
  let initialized = false;
  
  const unsubscribe = farertStore.subscribe(state => {
    if (!initialized && state.initState === 'idle') {
      initialized = true;
      farertStore.initialize(config);
    }
  });
  
  // Auto-retry on error if configured
  const unsubscribeRetry = farertStore.subscribe(state => {
    if (state.initState === 'error' && 
        state.config.autoRetry && 
        state.retryCount < state.maxRetries) {
      setTimeout(() => {
        farertStore.retry();
      }, 2000);
    }
  });
  
  return () => {
    unsubscribe();
    unsubscribeRetry();
  };
}

// Svelte action for automatic initialization
export function farertInit(node: HTMLElement, config?: FarertStoreConfig) {
  const cleanup = autoInitializeFarert(config);
  
  return {
    destroy: cleanup
  };
}

export default farertStore;