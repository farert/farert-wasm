/**
 * Svelte SDK for Farert WebAssembly Module
 * Entry point for Svelte-specific exports
 * 
 * Requirements: REQ-API-003 - Svelte Integration Stores and Components
 */

// Main store exports
export {
  farertStore,
  isReady,
  isLoading,
  hasError,
  canRetry,
  currentError,
  wasmModule,
  autoInitializeFarert,
  farertInit,
  type FarertStoreState,
  type FarertStoreConfig,
  type FarertInitializationState,
  type StationSearchResult,
  type LineInfo,
  type RouteSegment,
  type FareCalculationResult
} from './farert-store';

// Route builder store exports
export {
  createRouteBuilderStore,
  createRouteBuilderDerivedStores,
  type RouteBuilderConfig
} from './route-builder-store';

// Type exports
export {
  type StationInfo,
  type LineInfo as ExtendedLineInfo,
  type CompanyInfo,
  type PrefectureInfo,
  type RouteSegmentInfo,
  type RoutePlanResult,
  type FareBreakdownItem,
  type StationSearchFilters,
  type RouteSearchOptions,
  type RouteValidationResult,
  type RouteValidationError,
  type RouteValidationWarning
} from '../types';

// Re-export WebAssembly types that are commonly used
export {
  type FarertModule,
  type FareInfoData,
  type RouteWrapper,
  type CalcRouteWrapper,
  type RouteItemWrapper,
  type RouteFlagWrapper,
  CLIError,
  CLIErrorCode,
  WebAssemblyLoadError,
  DatabaseError,
  InputValidationError
} from '../types';

// Version information
export const VERSION = '1.0.0';
export const SVELTE_SDK_VERSION = '1.0.0';

// Feature flags for development
export const FEATURES = {
  STATION_SEARCH: true,
  FARE_CALCULATION: true,
  ROUTE_BUILDING: true,
  CACHING: true,
  ERROR_HANDLING: true,
  REACTIVE_STORES: true,
  PERFORMANCE_MONITORING: false, // Will be enabled in future versions
  DRAG_DROP: true,
  ACCESSIBILITY: true
} as const;

/**
 * Initialize Svelte SDK with configuration
 * This is optional - the store will auto-initialize if not called
 */
export function initializeSvelteSDK(config?: FarertStoreConfig): void {
  // Future implementation for global SDK initialization
  console.log('[FarertSvelteSDK] Initialization called with config:', config);
  
  // This could set global defaults, register error handlers, etc.
  if (config?.debugMode) {
    console.log('[FarertSvelteSDK] Debug mode enabled');
  }
}

/**
 * Get Svelte SDK information
 */
export function getSDKInfo() {
  return {
    version: SVELTE_SDK_VERSION,
    features: FEATURES,
    buildDate: new Date().toISOString(), // Would be set during build
    wasmVersion: VERSION,
    svelteVersion: '3.44.0' // Minimum supported Svelte version
  };
}

/**
 * Type predicate to check if an error is a CLI error
 */
export function isCLIError(error: unknown): error is CLIError {
  return error instanceof CLIError;
}

/**
 * Development utilities (only available in development mode)
 */
export const dev = {
  /**
   * Debug function to inspect WebAssembly module state
   */
  inspectModule: (module: any) => {
    if (import.meta.env && !import.meta.env.DEV) {
      console.warn('[FarertSvelteSDK] inspectModule only available in development');
      return;
    }
    
    console.group('[FarertSvelteSDK] Module Inspector');
    console.log('Module type:', typeof module);
    console.log('Available methods:', Object.getOwnPropertyNames(module).filter(name => 
      typeof module[name] === 'function'
    ));
    console.log('Module instance:', module);
    console.groupEnd();
  },
  
  /**
   * Performance profiler for development
   */
  profile: {
    start: (name: string) => {
      if (import.meta.env && !import.meta.env.DEV) return;
      console.time(`[FarertSvelteSDK] ${name}`);
    },
    
    end: (name: string) => {
      if (import.meta.env && !import.meta.env.DEV) return;
      console.timeEnd(`[FarertSvelteSDK] ${name}`);
    },
    
    mark: (message: string) => {
      if (import.meta.env && !import.meta.env.DEV) return;
      console.log(`[FarertSvelteSDK] ${new Date().toISOString()} - ${message}`);
    }
  }
} as const;