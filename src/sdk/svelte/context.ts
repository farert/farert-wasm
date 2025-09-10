/**
 * Svelte Context System for Farert SDK
 * 
 * Provides comprehensive context management for the Farert WebAssembly SDK in Svelte applications.
 * This context system enables easy access to SDK functionality across component hierarchies
 * with proper type safety, error handling, and SSR support.
 * 
 * Features:
 * - Type-safe context keys with symbol-based isolation
 * - Hierarchical context providers for different use cases
 * - SSR-compatible context initialization
 * - Automatic cleanup and lifecycle management
 * - Integration with existing FarertSDK and reactive stores
 * - Comprehensive error boundaries and fallbacks
 * 
 * Requirements:
 * - REQ-API-003: Svelte Reactive Stores and Components
 *   - Context providers for SDK access across components
 *   - Type-safe context consumption with proper error handling
 *   - SSR-compatible context initialization patterns
 *   - Integration with reactive stores for automatic UI updates
 * 
 * @file Svelte SDK Context Management
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

// Import Svelte functions with fallbacks for non-Svelte environments
let getContext: any, setContext: any, hasContext: any, onMount: any, onDestroy: any;
let writable: any, derived: any, readable: any, get: any;
let Writable: any, Readable: any;

try {
  ({ getContext, setContext, hasContext, onMount, onDestroy } = require('svelte'));
  ({ writable, derived, readable, get } = require('svelte/store'));
  // Type imports for TypeScript
  const svelteStoreTypes = require('svelte/store');
  Writable = svelteStoreTypes.Writable;
  Readable = svelteStoreTypes.Readable;
} catch {
  // Fallback implementations for non-Svelte environments
  getContext = () => null;
  setContext = () => {};
  hasContext = () => false;
  onMount = () => {};
  onDestroy = () => {};
  
  writable = (value: any) => ({ 
    subscribe: (fn: any) => { fn(value); return () => {}; }, 
    set: () => {}, 
    update: () => {} 
  });
  derived = () => writable(null);
  readable = () => writable(null);
  get = (store: any) => store.value || null;
  
  // Type fallbacks
  Writable = any;
  Readable = any;
}

import { farertStore, type FarertStoreState, type FarertStoreConfig } from './farert-store';
import { createRouteBuilderStore, type RouteBuilderConfig } from './route-builder-store';
import type {
  StationSearchResult,
  LineInfo,
  RouteSegment,
  FareCalculationResult
} from './farert-store';

// ============================================================================
// CONTEXT KEY SYMBOLS AND TYPES
// ============================================================================

/**
 * Context key symbols for type-safe context isolation
 * Using symbols prevents accidental context key collisions
 */
export const FARERT_SDK_CONTEXT_KEY = Symbol('farert-sdk');
export const STATION_DATA_CONTEXT_KEY = Symbol('station-data');
export const ROUTE_BUILDER_CONTEXT_KEY = Symbol('route-builder');
export const FARE_CALCULATOR_CONTEXT_KEY = Symbol('fare-calculator');

/**
 * Core SDK context interface providing access to SDK instance and reactive stores
 */
export interface SvelteSDKContext {
  /** SDK instance for direct API access */
  sdk: typeof farertStore;
  
  /** Reactive store for SDK state */
  state: any; // Readable<string>
  
  /** Reactive store for SDK readiness */
  isReady: any; // Readable<boolean>
  
  /** Reactive store for initialization errors */
  error: any; // Readable<Error | null>
  
  /** Reactive store for loading state */
  isLoading: any; // Readable<boolean>
  
  /** Configuration used to initialize the SDK */
  config: FarertStoreConfig;
  
  /** Context metadata */
  metadata: {
    createdAt: Date;
    version: string;
    contextId: string;
  };
  
  /** Cleanup function for context disposal */
  dispose(): Promise<void>;
}

/**
 * Station data context for station search and information
 */
export interface StationDataContext {
  /** Search stations with reactive results */
  searchStore: (query: string) => any; // Readable<StationSearchResult[]>
  
  /** Get station by ID with caching */
  getStation: (id: number) => Promise<StationSearchResult | null>;
  
  /** Station search loading state */
  isSearching: any; // Readable<boolean>
  
  /** Station search errors */
  searchError: any; // Readable<Error | null>
  
  /** Clear search results and reset state */
  clearSearch(): void;
}

/**
 * Route builder context for route construction and management
 */
export interface RouteBuilderContext {
  /** Current route segments */
  route: any; // Writable<RouteSegment[]>
  
  /** Add station to route */
  addStation: (stationId: number, lineId?: number) => void;
  
  /** Remove station from route */
  removeStation: (index: number) => void;
  
  /** Clear all route segments */
  clearRoute(): void;
  
  /** Route validation state */
  validation: any; // Readable<{ isValid: boolean; errors: string[] }>
  
  /** Route building configuration */
  config: Readonly<RouteBuilderConfig>;
}

/**
 * Fare calculator context for fare calculations and results
 */
export interface FareCalculatorContext {
  /** Calculate fare for current route */
  calculateFare: (route: RouteSegment[]) => Promise<FareCalculationResult>;
  
  /** Current calculation result */
  result: any; // Readable<FareCalculationResult | null>
  
  /** Calculation loading state */
  isCalculating: any; // Readable<boolean>
  
  /** Calculation errors */
  calculationError: any; // Readable<Error | null>
  
  /** Clear calculation results */
  clearResult(): void;
  
  /** Automatic calculation when route changes */
  autoCalculate: any; // Writable<boolean>
}

/**
 * Context configuration for different provider types
 */
export interface ContextConfig {
  /** SDK configuration for initialization */
  sdk?: Partial<SDKConfig>;
  
  /** Enable development mode with enhanced debugging */
  development?: boolean;
  
  /** Enable automatic SDK initialization */
  autoInitialize?: boolean;
  
  /** Context-specific error handling */
  onError?: (error: Error, context: string) => void;
  
  /** Context initialization callback */
  onInitialized?: (context: SvelteSDKContext) => void;
  
  /** SSR mode configuration */
  ssr?: {
    enabled: boolean;
    fallback?: any;
  };
}

// ============================================================================
// CORE CONTEXT FUNCTIONS
// ============================================================================

/**
 * Create a new Svelte SDK context with complete initialization
 * 
 * @param config Context configuration options
 * @returns Promise resolving to initialized SDK context
 * 
 * @example
 * ```typescript
 * import { createSvelteSDKContext } from '@farert/sdk/svelte';
 * 
 * const context = await createSvelteSDKContext({
 *   sdk: { caching: { enabled: true } },
 *   development: true,
 *   autoInitialize: true
 * });
 * 
 * console.log('SDK ready:', get(context.isReady));
 * ```
 */
export async function createSvelteSDKContext(config: ContextConfig = {}): Promise<SvelteSDKContext> {
  // Use the existing farertStore as the SDK instance
  const sdk = farertStore;
  
  // Initialize the store if requested
  if (config.autoInitialize !== false) {
    try {
      await sdk.initialize(config.sdk as FarertStoreConfig);
    } catch (error) {
      if (config.onError) {
        config.onError(error as Error, 'initialization');
      } else {
        console.error('[SvelteSDKContext] Initialization failed:', error);
      }
    }
  }
  
  // Import the derived stores from farert-store
  const { isReady, isLoading, hasError, currentError } = await import('./farert-store');
  
  // Generate unique context ID
  const contextId = `sdk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const context: SvelteSDKContext = {
    sdk,
    state: farertStore, // The store itself contains the state
    isReady,
    error: currentError,
    isLoading,
    config: config.sdk || {},
    metadata: {
      createdAt: new Date(),
      version: '1.0.0',
      contextId
    },
    dispose: async () => {
      try {
        if (sdk.destroy && typeof sdk.destroy === 'function') {
          sdk.destroy();
        }
      } catch (error) {
        console.warn('[SvelteSDKContext] Disposal warning:', error);
      }
    }
  };
  
  // Notify initialization complete
  if (config.onInitialized) {
    config.onInitialized(context);
  }
  
  return context;
}

/**
 * Set SDK context for the current component hierarchy
 * 
 * @param context SDK context to set
 * @returns The same context for chaining
 * 
 * @example
 * ```svelte
 * <script>
 *   import { setSvelteSDKContext, createSvelteSDKContext } from '@farert/sdk/svelte';
 *   
 *   onMount(async () => {
 *     const context = await createSvelteSDKContext();
 *     setSvelteSDKContext(context);
 *   });
 * </script>
 * ```
 */
export function setSvelteSDKContext(context: SvelteSDKContext): SvelteSDKContext {
  setContext(FARERT_SDK_CONTEXT_KEY, context);
  return context;
}

/**
 * Get SDK context from the current component hierarchy
 * 
 * @returns SDK context or null if not available
 * 
 * @example
 * ```svelte
 * <script>
 *   import { getSDK } from '@farert/sdk/svelte';
 *   
 *   const sdk = getSDK();
 *   if (sdk) {
 *     console.log('SDK available');
 *   }
 * </script>
 * ```
 */
export function getSDK(): typeof farertStore | null {
  if (!hasContext(FARERT_SDK_CONTEXT_KEY)) {
    return null;
  }
  
  try {
    const context = getContext<SvelteSDKContext>(FARERT_SDK_CONTEXT_KEY);
    return context?.sdk || null;
  } catch (error) {
    console.warn('[SvelteSDKContext] Failed to get SDK context:', error);
    return null;
  }
}

/**
 * Get SDK context with error if not available
 * 
 * @throws {FarertSDKError} If SDK context is not available
 * @returns SDK instance
 * 
 * @example
 * ```svelte
 * <script>
 *   import { requireSDK } from '@farert/sdk/svelte';
 *   
 *   try {
 *     const sdk = requireSDK();
 *     // SDK is guaranteed to be available here
 *   } catch (error) {
 *     console.error('SDK not available:', error);
 *   }
 * </script>
 * ```
 */
export function requireSDK(): typeof farertStore {
  const sdk = getSDK();
  if (!sdk) {
    throw new Error(
      'SDK context not available. Make sure to use SvelteSDKProvider or call setSvelteSDKContext() in a parent component.'
    );
  }
  return sdk;
}

/**
 * Get complete SDK context from the current component hierarchy
 * 
 * @returns Complete SDK context or null if not available
 */
export function getSDKContext(): SvelteSDKContext | null {
  if (!hasContext(FARERT_SDK_CONTEXT_KEY)) {
    return null;
  }
  
  try {
    return getContext<SvelteSDKContext>(FARERT_SDK_CONTEXT_KEY);
  } catch (error) {
    console.warn('[SvelteSDKContext] Failed to get SDK context:', error);
    return null;
  }
}

/**
 * Get SDK reactive stores from context
 * 
 * @returns Reactive stores or null if context not available
 * 
 * @example
 * ```svelte
 * <script>
 *   import { getSDKStores } from '@farert/sdk/svelte';
 *   
 *   const stores = getSDKStores();
 *   if (stores) {
 *     $: isReady = $stores.isReady;
 *     $: error = $stores.error;
 *   }
 * </script>
 * ```
 */
export function getSDKStores(): {
  state: any;
  isReady: any;
  error: any;
  isLoading: any;
} | null {
  const context = getSDKContext();
  if (!context) {
    return null;
  }
  
  return {
    state: context.state,
    isReady: context.isReady,
    error: context.error,
    isLoading: context.isLoading
  };
}

/**
 * Get SDK stores with error if context not available
 * 
 * @throws {Error} If SDK context is not available
 * @returns SDK reactive stores
 */
export function requireSDKStores(): {
  state: any;
  isReady: any;
  error: any;
  isLoading: any;
} {
  const stores = getSDKStores();
  if (!stores) {
    throw new Error(
      'SDK stores not available. Make sure to use SvelteSDKProvider or call setSvelteSDKContext() in a parent component.'
    );
  }
  return stores;
}

// ============================================================================
// SPECIALIZED CONTEXT FUNCTIONS
// ============================================================================

/**
 * Create and set station data context
 * 
 * @param config Station context configuration
 * @returns Station data context
 */
export function createStationDataContext(config: { 
  debounceMs?: number;
  cacheSize?: number;
} = {}): StationDataContext {
  const sdk = requireSDK();
  const searchingStore = writable(false);
  const errorStore = writable<Error | null>(null);
  const searchCache = new Map<string, StationSearchResult[]>();
  
  let searchTimeout: NodeJS.Timeout | null = null;
  
  const searchStore = (query: string): Readable<StationSearchResult[]> => {
    const resultsStore = writable<StationSearchResult[]>([]);
    
    const performSearch = async () => {
      if (!query.trim()) {
        resultsStore.set([]);
        return;
      }
      
      // Check cache
      if (searchCache.has(query)) {
        resultsStore.set(searchCache.get(query)!);
        return;
      }
      
      try {
        searchingStore.set(true);
        errorStore.set(null);
        
        const results = await sdk.searchStations(query);
        
        // Cache results
        if (searchCache.size >= (config.cacheSize || 50)) {
          const firstKey = searchCache.keys().next().value;
          searchCache.delete(firstKey);
        }
        searchCache.set(query, results);
        
        resultsStore.set(results);
      } catch (error) {
        errorStore.set(error as Error);
        resultsStore.set([]);
      } finally {
        searchingStore.set(false);
      }
    };
    
    // Debounced search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(performSearch, config.debounceMs || 300);
    
    return { subscribe: resultsStore.subscribe };
  };
  
  const context: StationDataContext = {
    searchStore,
    getStation: (id: number) => sdk.getStationById(id),
    isSearching: { subscribe: searchingStore.subscribe },
    searchError: { subscribe: errorStore.subscribe },
    clearSearch: () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }
      searchingStore.set(false);
      errorStore.set(null);
      searchCache.clear();
    }
  };
  
  setContext(STATION_DATA_CONTEXT_KEY, context);
  return context;
}

/**
 * Get station data context
 * 
 * @returns Station data context or null if not available
 */
export function getStationDataContext(): StationDataContext | null {
  if (!hasContext(STATION_DATA_CONTEXT_KEY)) {
    return null;
  }
  
  try {
    return getContext<StationDataContext>(STATION_DATA_CONTEXT_KEY);
  } catch (error) {
    console.warn('[SvelteSDKContext] Failed to get station data context:', error);
    return null;
  }
}

/**
 * Create and set route builder context
 * 
 * @param config Route builder configuration
 * @returns Route builder context
 */
export function createRouteBuilderContext(config: RouteBuilderConfig = {}): RouteBuilderContext {
  const sdk = requireSDK();
  const routeStore = writable<RouteSegment[]>([]);
  
  const validation = derived(routeStore, ($route) => {
    const errors: string[] = [];
    
    if ($route.length < 2) {
      errors.push('Route must have at least 2 stations');
    }
    
    // Check for duplicate consecutive stations
    for (let i = 1; i < $route.length; i++) {
      if ($route[i].stationId === $route[i - 1].stationId) {
        errors.push(`Duplicate consecutive station: ${$route[i].stationName}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  });
  
  const context: RouteBuilderContext = {
    route: routeStore,
    addStation: (stationId: number, lineId?: number) => {
      routeStore.update(route => {
        // Get station name (simplified - in real implementation would cache this)
        sdk.getStationById(stationId).then(station => {
          if (station) {
            const segment: RouteSegment = {
              stationId,
              stationName: station.name,
              lineId
            };
            
            routeStore.update(r => [...r, segment]);
          }
        });
        
        return route;
      });
    },
    removeStation: (index: number) => {
      routeStore.update(route => {
        const newRoute = [...route];
        newRoute.splice(index, 1);
        
        // Return updated route
        return newRoute;
      });
    },
    clearRoute: () => {
      routeStore.set([]);
    },
    validation,
    config: { ...config }
  };
  
  setContext(ROUTE_BUILDER_CONTEXT_KEY, context);
  return context;
}

/**
 * Get route builder context
 * 
 * @returns Route builder context or null if not available
 */
export function getRouteBuilderContext(): RouteBuilderContext | null {
  if (!hasContext(ROUTE_BUILDER_CONTEXT_KEY)) {
    return null;
  }
  
  try {
    return getContext<RouteBuilderContext>(ROUTE_BUILDER_CONTEXT_KEY);
  } catch (error) {
    console.warn('[SvelteSDKContext] Failed to get route builder context:', error);
    return null;
  }
}

/**
 * Create and set fare calculator context
 * 
 * @param config Calculator configuration
 * @returns Fare calculator context
 */
export function createFareCalculatorContext(config: {
  autoCalculate?: boolean;
} = {}): FareCalculatorContext {
  const sdk = requireSDK();
  const resultStore = writable<FareCalculationResult | null>(null);
  const calculatingStore = writable(false);
  const errorStore = writable<Error | null>(null);
  const autoCalculateStore = writable(config.autoCalculate ?? true);
  
  const calculateFare = async (route: RouteSegment[]): Promise<FareCalculationResult> => {
    try {
      calculatingStore.set(true);
      errorStore.set(null);
      
      const result = await sdk.calculateFare(route);
      resultStore.set(result);
      return result;
    } catch (error) {
      const sdkError = error as Error;
      errorStore.set(sdkError);
      throw sdkError;
    } finally {
      calculatingStore.set(false);
    }
  };
  
  const context: FareCalculatorContext = {
    calculateFare,
    result: { subscribe: resultStore.subscribe },
    isCalculating: { subscribe: calculatingStore.subscribe },
    calculationError: { subscribe: errorStore.subscribe },
    clearResult: () => {
      resultStore.set(null);
      errorStore.set(null);
    },
    autoCalculate: autoCalculateStore
  };
  
  setContext(FARE_CALCULATOR_CONTEXT_KEY, context);
  return context;
}

/**
 * Get fare calculator context
 * 
 * @returns Fare calculator context or null if not available
 */
export function getFareCalculatorContext(): FareCalculatorContext | null {
  if (!hasContext(FARE_CALCULATOR_CONTEXT_KEY)) {
    return null;
  }
  
  try {
    return getContext<FareCalculatorContext>(FARE_CALCULATOR_CONTEXT_KEY);
  } catch (error) {
    console.warn('[SvelteSDKContext] Failed to get fare calculator context:', error);
    return null;
  }
}

// ============================================================================
// CONTEXT MANAGEMENT UTILITIES
// ============================================================================

/**
 * Initialize SDK context with automatic cleanup
 * 
 * @param config Context configuration
 * @returns Context initialization promise
 * 
 * @example
 * ```svelte
 * <script>
 *   import { initializeSDKContext } from '@farert/sdk/svelte';
 *   
 *   onMount(() => {
 *     initializeSDKContext({
 *       development: true,
 *       autoInitialize: true
 *     });
 *   });
 * </script>
 * ```
 */
export async function initializeSDKContext(config: ContextConfig = {}): Promise<SvelteSDKContext> {
  const context = await createSvelteSDKContext(config);
  setSvelteSDKContext(context);
  
  // Automatic cleanup on component destruction
  onDestroy(async () => {
    try {
      await context.dispose();
    } catch (error) {
      console.warn('[SvelteSDKContext] Context cleanup warning:', error);
    }
  });
  
  return context;
}

/**
 * Destroy SDK context and clean up resources
 * 
 * @returns Promise that resolves when cleanup is complete
 */
export async function destroySDKContext(): Promise<void> {
  const context = getSDKContext();
  if (context) {
    await context.dispose();
  }
}

/**
 * Check if SDK context is available in the current component hierarchy
 * 
 * @returns True if SDK context is available
 * 
 * @example
 * ```svelte
 * <script>
 *   import { isSDKContextAvailable } from '@farert/sdk/svelte';
 *   
 *   const hasSDK = isSDKContextAvailable();
 *   console.log('SDK available:', hasSDK);
 * </script>
 * ```
 */
export function isSDKContextAvailable(): boolean {
  return hasContext(FARERT_SDK_CONTEXT_KEY);
}

/**
 * Wait for SDK to be ready with timeout
 * 
 * @param timeoutMs Timeout in milliseconds (default: 10 seconds)
 * @returns Promise that resolves when SDK is ready
 * 
 * @throws {Error} If timeout is reached
 */
export async function waitForSDKReady(timeoutMs: number = 10000): Promise<void> {
  const context = getSDKContext();
  if (!context) {
    throw new Error('SDK context not available');
  }
  
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | null = null;
    let timeout: NodeJS.Timeout | null = null;
    
    const cleanup = () => {
      if (unsubscribe) unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
    
    // Check if already ready
    if (get(context.isReady)) {
      resolve();
      return;
    }
    
    // Set timeout
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error('SDK ready timeout'));
    }, timeoutMs);
    
    // Wait for ready state
    unsubscribe = context.isReady.subscribe(isReady => {
      if (isReady) {
        cleanup();
        resolve();
      }
    });
  });
}

// ============================================================================
// DEVELOPMENT AND DEBUG UTILITIES
// ============================================================================

/**
 * Get context debug information
 * 
 * @returns Debug information object
 */
export function getContextDebugInfo(): {
  contexts: string[];
  metadata: Record<string, any>;
} {
  const contexts: string[] = [];
  const metadata: Record<string, any> = {};
  
  if (hasContext(FARERT_SDK_CONTEXT_KEY)) {
    contexts.push('SDK');
    const context = getContext<SvelteSDKContext>(FARERT_SDK_CONTEXT_KEY);
    if (context) {
      metadata.sdk = {
        version: context.metadata.version,
        contextId: context.metadata.contextId,
        createdAt: context.metadata.createdAt,
        state: get(context.state)
      };
    }
  }
  
  if (hasContext(STATION_DATA_CONTEXT_KEY)) {
    contexts.push('StationData');
  }
  
  if (hasContext(ROUTE_BUILDER_CONTEXT_KEY)) {
    contexts.push('RouteBuilder');
  }
  
  if (hasContext(FARE_CALCULATOR_CONTEXT_KEY)) {
    contexts.push('FareCalculator');
  }
  
  return { contexts, metadata };
}

/**
 * Development utility to log context state
 */
export function logContextState(): void {
  if (typeof window !== 'undefined' && !window?.location?.hostname.includes('localhost')) {
    console.warn('[SvelteSDKContext] logContextState should only be used in development');
    return;
  }
  
  const debugInfo = getContextDebugInfo();
  console.group('[SvelteSDKContext] Context State');
  console.log('Available contexts:', debugInfo.contexts);
  console.log('Metadata:', debugInfo.metadata);
  console.groupEnd();
}

// Export all types for external use
export type {
  SvelteSDKContext,
  StationDataContext,
  RouteBuilderContext,
  FareCalculatorContext,
  ContextConfig
};