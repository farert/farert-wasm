/**
 * React SDK for Farert WebAssembly Module
 * Entry point for React-specific exports
 * 
 * Requirements: REQ-API-003 - React Integration Hooks and Components
 */

// Main provider exports
export {
  FarertProvider,
  useFarert,
  withFarert,
  FarertErrorBoundary,
  type FarertProviderProps,
  type FarertContextValue,
  type FarertContextState,
  type FarertInitializationState,
  type StationSearchResult,
  type LineInfo,
  type RouteSegment,
  type FareCalculationResult
} from './farert-provider';

// Hook exports
export {
  useRouteBuilder,
  type UseRouteBuilderOptions
} from './use-route-builder';

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
  type RouteValidationWarning,
  type UseStationSearchResult,
  type UseFareCalculationResult,
  type UseRouteBuildingResult,
  type ReactSDKConfig,
  type StationSelectorProps,
  type RouteBuilderProps,
  type FareDisplayProps,
  ReactSDKError,
  ReactSDKErrorCode,
  defaultReactSDKConfig,
  isStationInfo,
  isRouteSegmentInfo,
  isRoutePlanResult
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
export const REACT_SDK_VERSION = '1.0.0';

// Feature flags for development
export const FEATURES = {
  STATION_SEARCH: true,
  FARE_CALCULATION: true,
  ROUTE_BUILDING: true,
  CACHING: true,
  ERROR_BOUNDARIES: true,
  PERFORMANCE_MONITORING: false, // Will be enabled in future versions
  DRAG_DROP: false, // Will be implemented in future versions
  ACCESSIBILITY: true
} as const;

/**
 * Initialize React SDK with configuration
 * This is optional - the provider will auto-initialize if not called
 */
export function initializeReactSDK(config?: Partial<ReactSDKConfig>): void {
  // Future implementation for global SDK initialization
  console.log('[FarertReactSDK] Initialization called with config:', config);
  
  // This could set global defaults, register error handlers, etc.
  if (config?.debug?.enabled) {
    console.log('[FarertReactSDK] Debug mode enabled');
  }
}

/**
 * Get React SDK information
 */
export function getSDKInfo() {
  return {
    version: REACT_SDK_VERSION,
    features: FEATURES,
    buildDate: new Date().toISOString(), // Would be set during build
    wasmVersion: VERSION,
    reactVersion: '18.0.0' // Minimum supported React version
  };
}

/**
 * Type predicate to check if an error is a React SDK error
 */
export function isReactSDKError(error: unknown): error is ReactSDKError {
  return error instanceof Error && 
         error.name === 'ReactSDKError' &&
         'code' in error;
}

/**
 * Development utilities (only available in development mode)
 */
export const dev = {
  /**
   * Debug function to inspect WebAssembly module state
   */
  inspectModule: (module: any) => {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('[FarertReactSDK] inspectModule only available in development');
      return;
    }
    
    console.group('[FarertReactSDK] Module Inspector');
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
      if (process.env.NODE_ENV !== 'development') return;
      console.time(`[FarertReactSDK] ${name}`);
    },
    
    end: (name: string) => {
      if (process.env.NODE_ENV !== 'development') return;
      console.timeEnd(`[FarertReactSDK] ${name}`);
    },
    
    mark: (message: string) => {
      if (process.env.NODE_ENV !== 'development') return;
      console.log(`[FarertReactSDK] ${new Date().toISOString()} - ${message}`);
    }
  }
} as const;