/**
 * React Compatibility Layer for Farert Frontend API Layer SDK
 * 
 * Provides React hooks and context patterns that wrap the core SDK functionality,
 * creating a React-native development experience while leveraging the existing
 * Svelte-first SDK architecture.
 * 
 * This compatibility layer provides:
 * - React Context system for SDK instance sharing
 * - React hooks that wrap core SDK functionality  
 * - Error boundary integration for WebAssembly failures
 * - Performance optimizations with proper cleanup
 * - TypeScript-first design with complete type safety
 * 
 * @file React Adapter Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-005: React compatibility layer using core SDK
 * - Support React 16.8+ (hooks) and React 18+
 * - Leverage existing src/sdk/core/farert-sdk.ts
 * - Secondary support layer (Svelte is primary)
 */

// ============================================================================
// IMPORTS AND DEPENDENCIES
// ============================================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type ComponentType,
  type ErrorInfo
} from 'react';

// Core SDK imports
import { 
  createFarertSDK,
  createDevelopmentSDK,
  createProductionSDK,
  type FarertSDK,
  type SDKState,
  type SDKConfig
} from '../core/farert-sdk';

// Type imports
import type {
  StationInfo,
  StationSearchResult,
  StationSearchOptions,
  LineInfo,
  CompanyInfo,
  PrefectureInfo,
  RouteSpec,
  RouteSegment,
  FareCalculationResult,
  RouteValidationResult,
  RoutePlanResult,
  FareBreakdownItem,
  FareDiscount,
  FarertSDKError,
  FarertSDKErrorCode,
  FarertSDKEventMap,
  PerformanceMetrics
} from '../types/core';

// Utility imports
import { debounce } from '../utils/station-utils';
import { formatFare, calculateDiscountPercentage } from '../utils/fare-utils';
import { validateRouteSegments, optimizeRoute } from '../utils/route-utils';

// ============================================================================
// REACT CONTEXT SYSTEM
// ============================================================================

/**
 * React Context for SDK instance sharing
 * 
 * Provides the FarertSDK instance throughout the React component tree,
 * enabling components to access railway calculation functionality without
 * prop drilling.
 */
export interface FarertSDKContextValue {
  /** SDK instance (null when not initialized) */
  sdk: FarertSDK | null;
  
  /** Current initialization state */
  state: SDKState;
  
  /** Initialization error if any */
  error: FarertSDKError | null;
  
  /** Whether SDK is ready for use */
  isReady: boolean;
  
  /** Whether SDK is currently initializing */
  isLoading: boolean;
  
  /** Reinitialize the SDK */
  reinitialize: () => Promise<void>;
  
  /** Configuration used for SDK */
  config: SDKConfig | null;
}

/**
 * React Context for Farert SDK
 */
export const FarertSDKContext = createContext<FarertSDKContextValue | undefined>(undefined);

/**
 * Props for FarertSDKProvider component
 */
export interface FarertSDKProviderProps {
  /** Child components */
  children: ReactNode;
  
  /** SDK configuration */
  config?: Partial<SDKConfig>;
  
  /** Whether to use development optimized SDK */
  development?: boolean;
  
  /** Whether to use production optimized SDK */
  production?: boolean;
  
  /** Custom SDK instance (for testing) */
  customSDK?: FarertSDK;
  
  /** Callback when SDK initialization completes */
  onInitialized?: (sdk: FarertSDK) => void;
  
  /** Callback when SDK initialization fails */
  onError?: (error: FarertSDKError) => void;
  
  /** Whether to automatically initialize on mount */
  autoInitialize?: boolean;
}

/**
 * React Context Provider for FarertSDK
 * 
 * Provides SDK instance and state management throughout the React component tree.
 * Handles SDK lifecycle, error recovery, and performance optimization.
 * 
 * @example Basic Usage
 * ```tsx
 * import { FarertSDKProvider } from '@farert/sdk/react';
 * 
 * function App() {
 *   return (
 *     <FarertSDKProvider autoInitialize>
 *       <StationSelector />
 *       <FareCalculator />
 *     </FarertSDKProvider>
 *   );
 * }
 * ```
 * 
 * @example Development Mode
 * ```tsx
 * <FarertSDKProvider 
 *   development
 *   config={{
 *     performance: { trackingLevel: 'detailed' },
 *     caching: { ttl: 60000 }
 *   }}
 *   onInitialized={(sdk) => console.log('SDK ready')}
 *   onError={(error) => console.error('SDK error:', error)}
 * >
 *   <MyApp />
 * </FarertSDKProvider>
 * ```
 */
export const FarertSDKProvider: React.FC<FarertSDKProviderProps> = ({
  children,
  config,
  development = false,
  production = false,
  customSDK,
  onInitialized,
  onError,
  autoInitialize = true
}) => {
  // State management
  const [sdk, setSdk] = useState<FarertSDK | null>(customSDK || null);
  const [state, setState] = useState<SDKState>(SDKState.UNINITIALIZED);
  const [error, setError] = useState<FarertSDKError | null>(null);
  const [finalConfig, setFinalConfig] = useState<SDKConfig | null>(null);
  
  // Refs for cleanup
  const initializationRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);
  
  // Computed state
  const isReady = state === SDKState.READY && sdk !== null;
  const isLoading = state === SDKState.INITIALIZING;
  
  // SDK initialization function
  const initializeSDK = useCallback(async () => {
    if (initializationRef.current) {
      return initializationRef.current;
    }
    
    try {
      setState(SDKState.INITIALIZING);
      setError(null);
      
      // Create SDK instance
      let sdkInstance: FarertSDK;
      
      if (customSDK) {
        sdkInstance = customSDK;
      } else if (development) {
        sdkInstance = createDevelopmentSDK(config);
      } else if (production) {
        sdkInstance = createProductionSDK(config);
      } else {
        sdkInstance = createFarertSDK(config);
      }
      
      // Initialize SDK
      const initPromise = sdkInstance.initialize();
      initializationRef.current = initPromise;
      
      await initPromise;
      
      // Check if component is still mounted
      if (!mountedRef.current) {
        await sdkInstance.dispose();
        return;
      }
      
      // Update state
      setSdk(sdkInstance);
      setState(SDKState.READY);
      setFinalConfig(sdkInstance.config);
      
      // Call success callback
      if (onInitialized) {
        onInitialized(sdkInstance);
      }
      
    } catch (err) {
      const sdkError = err instanceof FarertSDKError ? err : new FarertSDKError(
        `SDK initialization failed: ${err instanceof Error ? err.message : String(err)}`,
        FarertSDKErrorCode.INITIALIZATION_FAILED,
        { originalError: err },
        true
      );
      
      if (mountedRef.current) {
        setState(SDKState.ERROR);
        setError(sdkError);
        
        if (onError) {
          onError(sdkError);
        }
      }
    } finally {
      initializationRef.current = null;
    }
  }, [config, development, production, customSDK, onInitialized, onError]);
  
  // Reinitialize function
  const reinitialize = useCallback(async () => {
    if (sdk) {
      await sdk.dispose();
      setSdk(null);
      setState(SDKState.UNINITIALIZED);
      setError(null);
    }
    
    await initializeSDK();
  }, [sdk, initializeSDK]);
  
  // Initialize on mount
  useEffect(() => {
    if (autoInitialize && !customSDK && state === SDKState.UNINITIALIZED) {
      initializeSDK();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [autoInitialize, customSDK, state, initializeSDK]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sdk) {
        sdk.dispose().catch(err => {
          console.error('Error disposing SDK:', err);
        });
      }
    };
  }, [sdk]);
  
  // Context value
  const contextValue = useMemo<FarertSDKContextValue>(() => ({
    sdk,
    state,
    error,
    isReady,
    isLoading,
    reinitialize,
    config: finalConfig
  }), [sdk, state, error, isReady, isLoading, reinitialize, finalConfig]);
  
  return (
    <FarertSDKContext.Provider value={contextValue}>
      {children}
    </FarertSDKContext.Provider>
  );
};

// ============================================================================
// CORE REACT HOOKS
// ============================================================================

/**
 * Main hook to access the FarertSDK instance
 * 
 * Provides access to the SDK instance and its current state.
 * Throws an error if used outside of FarertSDKProvider.
 * 
 * @returns SDK context value with instance and state
 * 
 * @example Basic Usage
 * ```tsx
 * function MyComponent() {
 *   const { sdk, isReady, error } = useFarertSDK();
 *   
 *   if (!isReady) {
 *     return <div>Loading...</div>;
 *   }
 *   
 *   if (error) {
 *     return <div>Error: {error.message}</div>;
 *   }
 *   
 *   // Use SDK...
 *   return <div>Ready!</div>;
 * }
 * ```
 */
export const useFarertSDK = (): FarertSDKContextValue => {
  const context = useContext(FarertSDKContext);
  
  if (!context) {
    throw new Error('useFarertSDK must be used within a FarertSDKProvider');
  }
  
  return context;
};

/**
 * Hook for station search with debounced queries and caching
 * 
 * Provides reactive station search functionality with automatic debouncing,
 * error handling, and result caching for optimal performance.
 * 
 * @param initialQuery Initial search query
 * @param options Search configuration options
 * @returns Station search state and methods
 * 
 * @example Basic Search
 * ```tsx
 * function StationSearch() {
 *   const { 
 *     query, 
 *     setQuery, 
 *     results, 
 *     isLoading, 
 *     error,
 *     hasMore,
 *     loadMore
 *   } = useStationSearch('', {
 *     debounceMs: 300,
 *     limit: 10
 *   });
 *   
 *   return (
 *     <div>
 *       <input 
 *         value={query} 
 *         onChange={e => setQuery(e.target.value)} 
 *         placeholder="駅名を入力..."
 *       />
 *       
 *       {isLoading && <div>検索中...</div>}
 *       {error && <div>エラー: {error.message}</div>}
 *       
 *       <ul>
 *         {results.map(result => (
 *           <li key={result.station.id}>
 *             {result.station.name} ({result.station.prefecture})
 *           </li>
 *         ))}
 *       </ul>
 *       
 *       {hasMore && (
 *         <button onClick={loadMore}>さらに読み込む</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export interface UseStationSearchOptions extends StationSearchOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  
  /** Whether to search automatically */
  autoSearch?: boolean;
  
  /** Minimum query length to trigger search */
  minQueryLength?: number;
}

export interface UseStationSearchResult {
  /** Current search query */
  query: string;
  
  /** Update search query */
  setQuery: (query: string) => void;
  
  /** Search results */
  results: StationSearchResult[];
  
  /** Whether search is in progress */
  isLoading: boolean;
  
  /** Search error if any */
  error: FarertSDKError | null;
  
  /** Whether more results are available */
  hasMore: boolean;
  
  /** Total number of available results */
  totalCount: number;
  
  /** Load more results */
  loadMore: () => Promise<void>;
  
  /** Clear search results */
  clearResults: () => void;
  
  /** Manually trigger search */
  search: (newQuery?: string) => Promise<void>;
}

export const useStationSearch = (
  initialQuery = '',
  options: UseStationSearchOptions = {}
): UseStationSearchResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // Options with defaults
  const {
    debounceMs = 300,
    autoSearch = true,
    minQueryLength = 1,
    limit = 20,
    ...searchOptions
  } = options;
  
  // State management
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<StationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FarertSDKError | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  
  // Refs for cleanup and caching
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, { results: StationSearchResult[], timestamp: number }>>(new Map());
  
  // Search function
  const performSearch = useCallback(async (searchQuery: string, offset = 0, append = false) => {
    if (!sdk || !isReady) {
      return;
    }
    
    if (searchQuery.length < minQueryLength) {
      setResults([]);
      setHasMore(false);
      setTotalCount(0);
      return;
    }
    
    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cacheKey = `${searchQuery}:${offset}:${JSON.stringify(searchOptions)}`;
      const cached = cacheRef.current.get(cacheKey);
      const cacheValidMs = 60000; // 1 minute cache
      
      if (cached && Date.now() - cached.timestamp < cacheValidMs) {
        if (append) {
          setResults(prev => [...prev, ...cached.results]);
        } else {
          setResults(cached.results);
        }
        setHasMore(cached.results.length === limit);
        setTotalCount(prev => append ? prev + cached.results.length : cached.results.length);
        setIsLoading(false);
        return;
      }
      
      // Perform search with pagination
      const searchResults = await sdk.searchStations(searchQuery, {
        ...searchOptions,
        limit,
        // Note: SDK doesn't support offset directly, so we'll simulate it
      });
      
      // Simple pagination simulation (in production, this would be handled by the backend)
      const paginatedResults = searchResults.slice(offset, offset + limit);
      const hasMoreResults = searchResults.length > offset + limit;
      
      // Cache results
      cacheRef.current.set(cacheKey, {
        results: paginatedResults,
        timestamp: Date.now()
      });
      
      // Update state
      if (append) {
        setResults(prev => [...prev, ...paginatedResults]);
        setTotalCount(prev => Math.max(prev, searchResults.length));
      } else {
        setResults(paginatedResults);
        setTotalCount(searchResults.length);
        setCurrentOffset(offset);
      }
      
      setHasMore(hasMoreResults);
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Search was cancelled
      }
      
      const searchError = err instanceof FarertSDKError ? err : new FarertSDKError(
        `Station search failed: ${err instanceof Error ? err.message : String(err)}`,
        FarertSDKErrorCode.SEARCH_FAILED,
        { query: searchQuery, options: searchOptions },
        true
      );
      
      setError(searchError);
      
      if (!append) {
        setResults([]);
        setHasMore(false);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isReady, minQueryLength, limit, searchOptions]);
  
  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      performSearch(searchQuery, 0, false);
    }, debounceMs),
    [performSearch, debounceMs]
  );
  
  // Manual search function
  const search = useCallback(async (newQuery?: string) => {
    const searchQuery = newQuery ?? query;
    setQuery(searchQuery);
    await performSearch(searchQuery, 0, false);
  }, [query, performSearch]);
  
  // Load more function
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) {
      return;
    }
    
    const nextOffset = currentOffset + limit;
    await performSearch(query, nextOffset, true);
    setCurrentOffset(nextOffset);
  }, [hasMore, isLoading, currentOffset, limit, query, performSearch]);
  
  // Clear results function
  const clearResults = useCallback(() => {
    setResults([]);
    setHasMore(false);
    setTotalCount(0);
    setCurrentOffset(0);
    setError(null);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  
  // Auto-search effect
  useEffect(() => {
    if (autoSearch && isReady) {
      if (query.length >= minQueryLength) {
        debouncedSearch(query);
      } else {
        clearResults();
      }
    }
    
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, autoSearch, isReady, minQueryLength, debouncedSearch, clearResults]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  
  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    hasMore,
    totalCount,
    loadMore,
    clearResults,
    search
  };
};

/**
 * Hook for fare calculations with caching and validation
 * 
 * Provides reactive fare calculation functionality with automatic validation,
 * caching, and comprehensive error handling.
 * 
 * @example Basic Usage
 * ```tsx
 * function FareCalculator() {
 *   const { 
 *     calculateFare, 
 *     result, 
 *     isCalculating, 
 *     error,
 *     validate
 *   } = useFareCalculation();
 *   
 *   const handleCalculate = async () => {
 *     const route = "東京 東海道線 横浜";
 *     const validation = await validate(route);
 *     
 *     if (validation.isValid) {
 *       await calculateFare(route);
 *     } else {
 *       console.error('Invalid route:', validation.errors);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleCalculate} disabled={isCalculating}>
 *         運賃計算
 *       </button>
 *       
 *       {isCalculating && <div>計算中...</div>}
 *       {error && <div>エラー: {error.message}</div>}
 *       {result && (
 *         <div>
 *           運賃: {formatFare(result.totalFare)}円
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export interface UseFareCalculationResult {
  /** Calculate fare for route */
  calculateFare: (route: RouteSpec) => Promise<FareCalculationResult | null>;
  
  /** Latest calculation result */
  result: FareCalculationResult | null;
  
  /** Whether calculation is in progress */
  isCalculating: boolean;
  
  /** Calculation error if any */
  error: FarertSDKError | null;
  
  /** Validate route before calculation */
  validate: (route: RouteSpec) => Promise<RouteValidationResult>;
  
  /** Clear current result */
  clearResult: () => void;
  
  /** Calculation history */
  history: FareCalculationResult[];
  
  /** Clear calculation history */
  clearHistory: () => void;
}

export const useFareCalculation = (): UseFareCalculationResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // State management
  const [result, setResult] = useState<FareCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<FarertSDKError | null>(null);
  const [history, setHistory] = useState<FareCalculationResult[]>([]);
  
  // Calculate fare function
  const calculateFare = useCallback(async (route: RouteSpec): Promise<FareCalculationResult | null> => {
    if (!sdk || !isReady) {
      throw new Error('SDK not ready for fare calculation');
    }
    
    setIsCalculating(true);
    setError(null);
    
    try {
      const calculationResult = await sdk.calculateFare(route);
      
      setResult(calculationResult);
      setHistory(prev => [calculationResult, ...prev.slice(0, 9)]); // Keep last 10 results
      
      return calculationResult;
      
    } catch (err) {
      const fareError = err instanceof FarertSDKError ? err : new FarertSDKError(
        `Fare calculation failed: ${err instanceof Error ? err.message : String(err)}`,
        FarertSDKErrorCode.CALCULATION_FAILED,
        { route },
        true
      );
      
      setError(fareError);
      return null;
      
    } finally {
      setIsCalculating(false);
    }
  }, [sdk, isReady]);
  
  // Validate route function
  const validate = useCallback(async (route: RouteSpec): Promise<RouteValidationResult> => {
    if (!sdk || !isReady) {
      throw new Error('SDK not ready for route validation');
    }
    
    try {
      return await sdk.validateRoute(route);
    } catch (err) {
      // Return validation failure result
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_FAILED',
          message: err instanceof Error ? err.message : String(err),
          field: 'route',
          severity: 'error'
        }],
        warnings: [],
        suggestions: []
      };
    }
  }, [sdk, isReady]);
  
  // Clear result function
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);
  
  // Clear history function
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);
  
  return {
    calculateFare,
    result,
    isCalculating,
    error,
    validate,
    clearResult,
    history,
    clearHistory
  };
};

/**
 * Hook for building routes with validation and optimization
 * 
 * Provides reactive route building functionality with step-by-step validation,
 * optimization suggestions, and real-time feedback.
 */
export interface UseRouteBuilderResult {
  /** Current route segments */
  segments: RouteSegment[];
  
  /** Add station to route */
  addStation: (stationId: number, lineId?: number) => Promise<void>;
  
  /** Remove station from route */
  removeStation: (index: number) => void;
  
  /** Insert station at specific position */
  insertStation: (index: number, stationId: number, lineId?: number) => Promise<void>;
  
  /** Clear all segments */
  clearRoute: () => void;
  
  /** Validate current route */
  validate: () => Promise<RouteValidationResult>;
  
  /** Get route optimization suggestions */
  getOptimizationSuggestions: () => Promise<string[]>;
  
  /** Whether route is currently being validated */
  isValidating: boolean;
  
  /** Current validation result */
  validation: RouteValidationResult | null;
  
  /** Convert to route specification */
  toRouteSpec: () => RouteSpec;
  
  /** Build from route specification */
  fromRouteSpec: (route: RouteSpec) => Promise<void>;
}

export const useRouteBuilder = (): UseRouteBuilderResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // State management
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<RouteValidationResult | null>(null);
  
  // Add station function
  const addStation = useCallback(async (stationId: number, lineId?: number) => {
    if (!sdk || !isReady) {
      return;
    }
    
    try {
      const stationInfo = await sdk.getStationById(stationId);
      if (!stationInfo) {
        throw new Error(`Station with ID ${stationId} not found`);
      }
      
      const newSegment: RouteSegment = {
        stationId,
        stationName: stationInfo.name,
        lineId,
        isTransfer: segments.length > 0 // First station is not a transfer
      };
      
      setSegments(prev => [...prev, newSegment]);
      
    } catch (err) {
      console.error('Failed to add station:', err);
    }
  }, [sdk, isReady, segments.length]);
  
  // Remove station function
  const removeStation = useCallback((index: number) => {
    setSegments(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Insert station function
  const insertStation = useCallback(async (index: number, stationId: number, lineId?: number) => {
    if (!sdk || !isReady) {
      return;
    }
    
    try {
      const stationInfo = await sdk.getStationById(stationId);
      if (!stationInfo) {
        throw new Error(`Station with ID ${stationId} not found`);
      }
      
      const newSegment: RouteSegment = {
        stationId,
        stationName: stationInfo.name,
        lineId,
        isTransfer: index > 0 // First station is not a transfer
      };
      
      setSegments(prev => {
        const newSegments = [...prev];
        newSegments.splice(index, 0, newSegment);
        return newSegments;
      });
      
    } catch (err) {
      console.error('Failed to insert station:', err);
    }
  }, [sdk, isReady]);
  
  // Clear route function
  const clearRoute = useCallback(() => {
    setSegments([]);
    setValidation(null);
  }, []);
  
  // Validate route function
  const validate = useCallback(async (): Promise<RouteValidationResult> => {
    if (!sdk || !isReady) {
      return {
        isValid: false,
        errors: [{ code: 'SDK_NOT_READY', message: 'SDK not ready', field: 'sdk', severity: 'error' }],
        warnings: [],
        suggestions: []
      };
    }
    
    if (segments.length < 2) {
      const result = {
        isValid: false,
        errors: [{ code: 'INSUFFICIENT_STATIONS', message: 'At least 2 stations required', field: 'segments', severity: 'error' }],
        warnings: [],
        suggestions: ['Add more stations to create a valid route']
      };
      setValidation(result);
      return result;
    }
    
    setIsValidating(true);
    
    try {
      const result = await sdk.validateRoute(segments);
      setValidation(result);
      return result;
      
    } catch (err) {
      const result = {
        isValid: false,
        errors: [{ code: 'VALIDATION_ERROR', message: String(err), field: 'route', severity: 'error' }],
        warnings: [],
        suggestions: []
      };
      setValidation(result);
      return result;
      
    } finally {
      setIsValidating(false);
    }
  }, [sdk, isReady, segments]);
  
  // Get optimization suggestions function
  const getOptimizationSuggestions = useCallback(async (): Promise<string[]> => {
    if (!sdk || !isReady || segments.length < 2) {
      return [];
    }
    
    try {
      // This would use the SDK to analyze the route and provide suggestions
      // For now, return basic suggestions based on route characteristics
      const suggestions: string[] = [];
      
      if (segments.length > 5) {
        suggestions.push('Consider using express trains for long-distance segments');
      }
      
      if (segments.some(s => s.isTransfer)) {
        suggestions.push('Review transfer stations for optimization opportunities');
      }
      
      return suggestions;
      
    } catch (err) {
      console.error('Failed to get optimization suggestions:', err);
      return [];
    }
  }, [sdk, isReady, segments]);
  
  // Convert to route spec function
  const toRouteSpec = useCallback((): RouteSpec => {
    return segments;
  }, [segments]);
  
  // Build from route spec function
  const fromRouteSpec = useCallback(async (route: RouteSpec) => {
    if (!sdk || !isReady) {
      return;
    }
    
    try {
      if (typeof route === 'string') {
        // Parse route string - this would need to be implemented based on the expected format
        // For now, just clear the route
        clearRoute();
        return;
      }
      
      if (Array.isArray(route)) {
        setSegments(route);
        return;
      }
      
      // Handle object format
      const newSegments: RouteSegment[] = [];
      
      // Add start station
      const startStationInfo = await sdk.getStationById(
        typeof route.start === 'string' ? route.start : route.start
      );
      if (startStationInfo) {
        newSegments.push({
          stationId: startStationInfo.id,
          stationName: startStationInfo.name,
          isTransfer: false
        });
      }
      
      // Add via stations
      if (route.via) {
        for (const via of route.via) {
          const viaStationInfo = await sdk.getStationById(
            typeof via === 'string' ? via : via
          );
          if (viaStationInfo) {
            newSegments.push({
              stationId: viaStationInfo.id,
              stationName: viaStationInfo.name,
              isTransfer: true
            });
          }
        }
      }
      
      // Add end station
      const endStationInfo = await sdk.getStationById(
        typeof route.end === 'string' ? route.end : route.end
      );
      if (endStationInfo) {
        newSegments.push({
          stationId: endStationInfo.id,
          stationName: endStationInfo.name,
          isTransfer: newSegments.length > 0
        });
      }
      
      setSegments(newSegments);
      
    } catch (err) {
      console.error('Failed to build route from spec:', err);
    }
  }, [sdk, isReady, clearRoute]);
  
  // Auto-validate when segments change
  useEffect(() => {
    if (segments.length >= 2) {
      const timeoutId = setTimeout(() => {
        validate();
      }, 500); // Debounce validation
      
      return () => clearTimeout(timeoutId);
    } else {
      setValidation(null);
    }
  }, [segments, validate]);
  
  return {
    segments,
    addStation,
    removeStation,
    insertStation,
    clearRoute,
    validate,
    getOptimizationSuggestions,
    isValidating,
    validation,
    toRouteSpec,
    fromRouteSpec
  };
};

/**
 * Hook for accessing reference data (companies, prefectures, lines)
 * 
 * Provides cached access to railway reference data with automatic loading
 * and refresh capabilities.
 */
export interface UseReferenceDataResult {
  /** All available companies */
  companies: CompanyInfo[];
  
  /** All available prefectures */
  prefectures: PrefectureInfo[];
  
  /** All available lines */
  lines: LineInfo[];
  
  /** Whether data is loading */
  isLoading: boolean;
  
  /** Loading error if any */
  error: FarertSDKError | null;
  
  /** Refresh all data */
  refresh: () => Promise<void>;
  
  /** Get company by ID */
  getCompany: (companyId: number) => CompanyInfo | null;
  
  /** Get prefecture by ID */
  getPrefecture: (prefectureId: number) => PrefectureInfo | null;
  
  /** Get line by ID */
  getLine: (lineId: number) => LineInfo | null;
}

export const useReferenceData = (): UseReferenceDataResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // State management
  const [companies, setCompanies] = useState<CompanyInfo[]>([]);
  const [prefectures, setPrefectures] = useState<PrefectureInfo[]>([]);
  const [lines, setLines] = useState<LineInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FarertSDKError | null>(null);
  
  // Load data function
  const loadData = useCallback(async () => {
    if (!sdk || !isReady) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [companiesData, prefecturesData, linesData] = await Promise.all([
        sdk.getCompanies(),
        sdk.getPrefectures(),
        sdk.getLines()
      ]);
      
      setCompanies(companiesData);
      setPrefectures(prefecturesData);
      setLines(linesData);
      
    } catch (err) {
      const referenceError = err instanceof FarertSDKError ? err : new FarertSDKError(
        `Failed to load reference data: ${err instanceof Error ? err.message : String(err)}`,
        FarertSDKErrorCode.DATA_LOAD_FAILED,
        { operation: 'loadReferenceData' },
        true
      );
      
      setError(referenceError);
      
    } finally {
      setIsLoading(false);
    }
  }, [sdk, isReady]);
  
  // Refresh function
  const refresh = useCallback(async () => {
    await loadData();
  }, [loadData]);
  
  // Get company function
  const getCompany = useCallback((companyId: number): CompanyInfo | null => {
    return companies.find(c => c.id === companyId) || null;
  }, [companies]);
  
  // Get prefecture function
  const getPrefecture = useCallback((prefectureId: number): PrefectureInfo | null => {
    return prefectures.find(p => p.id === prefectureId) || null;
  }, [prefectures]);
  
  // Get line function
  const getLine = useCallback((lineId: number): LineInfo | null => {
    return lines.find(l => l.id === lineId) || null;
  }, [lines]);
  
  // Load data when SDK becomes ready
  useEffect(() => {
    if (isReady && companies.length === 0 && prefectures.length === 0 && lines.length === 0 && !isLoading) {
      loadData();
    }
  }, [isReady, companies.length, prefectures.length, lines.length, isLoading, loadData]);
  
  return {
    companies,
    prefectures,
    lines,
    isLoading,
    error,
    refresh,
    getCompany,
    getPrefecture,
    getLine
  };
};

// ============================================================================
// ERROR BOUNDARY INTEGRATION
// ============================================================================

/**
 * Error boundary component for WebAssembly failures
 * 
 * Provides graceful error handling for WebAssembly-related failures,
 * including memory issues, initialization failures, and runtime errors.
 */
export interface FarertErrorBoundaryProps {
  /** Child components */
  children: ReactNode;
  
  /** Custom error fallback component */
  fallback?: ComponentType<{ error: Error; resetError: () => void }>;
  
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** Whether to attempt automatic recovery */
  enableAutoRecovery?: boolean;
  
  /** Recovery attempt delay in milliseconds */
  recoveryDelay?: number;
  
  /** Maximum recovery attempts */
  maxRecoveryAttempts?: number;
}

/**
 * Default error fallback component
 */
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError
}) => (
  <div style={{ padding: '20px', border: '1px solid #ff6b6b', borderRadius: '8px', backgroundColor: '#ffe0e0' }}>
    <h3 style={{ color: '#d63031', margin: '0 0 16px 0' }}>WebAssembly Error</h3>
    <p style={{ margin: '0 0 16px 0', color: '#2d3436' }}>
      {error.message || 'An unexpected error occurred with the railway calculation system.'}
    </p>
    <button
      onClick={resetError}
      style={{
        padding: '8px 16px',
        backgroundColor: '#74b9ff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Retry
    </button>
  </div>
);

/**
 * Error boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  recoveryAttempts: number;
  isRecovering: boolean;
}

/**
 * React Error Boundary for Farert WebAssembly integration
 * 
 * Catches and handles WebAssembly-related errors, providing recovery mechanisms
 * and user-friendly error messages.
 * 
 * @example Basic Usage
 * ```tsx
 * <FarertErrorBoundary>
 *   <FarertSDKProvider>
 *     <MyApp />
 *   </FarertSDKProvider>
 * </FarertErrorBoundary>
 * ```
 * 
 * @example Custom Error Handling
 * ```tsx
 * const CustomErrorFallback = ({ error, resetError }) => (
 *   <div>
 *     <h2>Railway System Error</h2>
 *     <p>{error.message}</p>
 *     <button onClick={resetError}>Try Again</button>
 *   </div>
 * );
 * 
 * <FarertErrorBoundary
 *   fallback={CustomErrorFallback}
 *   onError={(error, errorInfo) => {
 *     console.error('Farert error:', error, errorInfo);
 *     // Send to error reporting service
 *   }}
 *   enableAutoRecovery={true}
 *   maxRecoveryAttempts={3}
 * >
 *   <App />
 * </FarertErrorBoundary>
 * ```
 */
export class FarertErrorBoundary extends React.Component<FarertErrorBoundaryProps, ErrorBoundaryState> {
  private recoveryTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(props: FarertErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      isRecovering: false
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableAutoRecovery = false, recoveryDelay = 3000, maxRecoveryAttempts = 3 } = this.props;
    
    this.setState({ errorInfo });
    
    // Call error callback
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Attempt automatic recovery if enabled
    if (enableAutoRecovery && this.state.recoveryAttempts < maxRecoveryAttempts) {
      this.setState({ isRecovering: true });
      
      this.recoveryTimeoutId = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          errorInfo: null,
          recoveryAttempts: prevState.recoveryAttempts + 1,
          isRecovering: false
        }));
      }, recoveryDelay);
    }
  }
  
  componentWillUnmount() {
    if (this.recoveryTimeoutId) {
      clearTimeout(this.recoveryTimeoutId);
    }
  }
  
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0,
      isRecovering: false
    });
  };
  
  render() {
    const { fallback: FallbackComponent = DefaultErrorFallback, children } = this.props;
    const { hasError, error, isRecovering } = this.state;
    
    if (hasError && error) {
      if (isRecovering) {
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div>Recovering from error...</div>
          </div>
        );
      }
      
      return <FallbackComponent error={error} resetError={this.resetError} />;
    }
    
    return children;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  FarertSDKContextValue,
  FarertSDKProviderProps,
  UseStationSearchOptions,
  UseStationSearchResult,
  UseFareCalculationResult,
  UseRouteBuilderResult,
  UseReferenceDataResult,
  FarertErrorBoundaryProps
};