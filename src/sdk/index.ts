/**
 * Farert WebAssembly SDK - Main Export
 * 
 * Comprehensive Svelte-first TypeScript SDK that wraps 39+ WebAssembly APIs
 * and 5 Object Classes to enable rapid development of railway fare calculation applications.
 * 
 * This SDK provides:
 * - Svelte stores for reactive state management
 * - Framework-agnostic utilities
 * - Complete TypeScript type safety
 * - SvelteKit SSR and static generation support
 * - Intelligent caching layer
 * 
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements: REQ-API-006 - Frontend SDK Development Experience
 */

// ============================================================================
// SVELTE SDK EXPORTS
// ============================================================================

/**
 * Primary Svelte integration with reactive stores and components
 * Provides the main entry point for Svelte/SvelteKit applications
 */
export {
  // Main farert store and state management
  farertStore,
  isReady,
  isLoading,
  hasError,
  canRetry,
  currentError,
  wasmModule,
  autoInitializeFarert,
  farertInit,
  
  // Route builder store for complex route planning
  createRouteBuilderStore,
  createRouteBuilderDerivedStores,
  
  // SDK lifecycle management
  initializeSvelteSDK,
  getSDKInfo,
  isCLIError,
  dev,
  
  // Version and feature information
  VERSION,
  SVELTE_SDK_VERSION,
  FEATURES,
  
  // Svelte-specific type definitions
  type FarertStoreState,
  type FarertStoreConfig,
  type FarertInitializationState,
  type StationSearchResult,
  type LineInfo,
  type RouteSegment,
  type FareCalculationResult,
  type RouteBuilderConfig
} from './svelte';

// ============================================================================
// FRAMEWORK-AGNOSTIC UTILITIES
// ============================================================================

/**
 * Framework-agnostic utilities for fare formatting, validation, and route building
 * Can be used in any JavaScript framework or vanilla JavaScript applications
 */
export {
  // Fare formatting utilities
  formatFare,
  formatFareSimple,
  formatFareBreakdown,
  formatStationName,
  formatRouteDescription,
  
  // Route validation and building
  validateRoute,
  formatValidationErrors,
  createRouteBuilder,
  RouteBuilder,
  
  // Utility functions
  isFareReasonable,
  formatKilometers,
  compareFares,
  
  // Utility collection with async loading
  utils,
  
  // Default export for convenience
  fareUtils
} from './utils';

// ============================================================================
// TYPESCRIPT TYPE DEFINITIONS
// ============================================================================

/**
 * Complete TypeScript type definitions for the SDK
 * Includes WebAssembly types, React extensions, and validation interfaces
 */
export type {
  // Core WebAssembly types
  FarertModule,
  ExtendedFarertModule,
  FareInfoData,
  RouteWrapper,
  CalcRouteWrapper,
  RouteItemWrapper,
  RouteFlagWrapper,
  
  // Enhanced UI types
  StationInfo,
  ExtendedLineInfo,
  CompanyInfo,
  PrefectureInfo,
  RouteSegmentInfo,
  RoutePlanResult,
  FareBreakdownItem,
  
  // Search and filtering
  StationSearchFilters,
  RouteSearchOptions,
  
  // Validation types
  RouteValidationResult,
  RouteValidationError,
  RouteValidationWarning,
  
  // Caching and performance
  CacheEntry,
  CacheStats,
  PerformanceMetrics,
  
  // Event handling
  FarertEvent,
  StationSelectedEvent,
  RouteCalculatedEvent,
  ErrorEvent,
  
  // Hook result types (for future React integration)
  UseStationSearchResult,
  UseFareCalculationResult,
  UseRouteBuildingResult,
  
  // Configuration types
  ReactSDKConfig,
  
  // Component prop types
  StationSelectorProps,
  RouteBuilderProps,
  FareDisplayProps,
  
  // Utility formatting types
  LocaleOptions,
  FareBreakdownOptions,
  StationNameOptions
} from './types';

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Error classes and error handling utilities
 */
export {
  CLIError,
  CLIErrorCode,
  ReactSDKError,
  ReactSDKErrorCode,
  WebAssemblyLoadError,
  DatabaseError,
  InputValidationError
} from './types';

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard functions for runtime type checking
 */
export {
  isStationInfo,
  isRouteSegmentInfo,
  isRoutePlanResult
} from './types';

// ============================================================================
// CONFIGURATION AND DEFAULTS
// ============================================================================

/**
 * Default configuration objects for SDK initialization
 */
export {
  defaultReactSDKConfig
} from './types';

// ============================================================================
// SDK METADATA AND VERSION INFORMATION
// ============================================================================

/**
 * SDK metadata and version information
 */
export const SDK_INFO = {
  name: 'Farert WebAssembly SDK',
  version: '1.0.0',
  description: 'Svelte-first TypeScript SDK for Japanese railway fare calculations',
  author: 'Farert WebAssembly Project',
  license: 'GPL-3.0',
  repository: 'https://github.com/farert/farert-wasm',
  documentation: 'https://farert.github.io/farert-wasm',
  
  // Supported framework versions
  compatibility: {
    svelte: '>=3.44.0',
    svelteKit: '>=1.0.0',
    react: '>=16.8.0',
    vue: '>=3.0.0',
    angular: '>=12.0.0',
    typescript: '>=4.5.0',
    node: '>=14.0.0'
  },
  
  // Feature availability
  features: {
    webAssembly: true,
    svelteStores: true,
    reactHooks: false, // Future implementation
    vueComposables: false, // Future implementation
    angularServices: false, // Future implementation
    svelteKitSSR: true,
    caching: true,
    typeScript: true,
    errorHandling: true,
    validation: true,
    i18n: true
  },
  
  // API coverage
  apiCoverage: {
    webAssemblyAPIs: 39,
    objectClasses: 5,
    utilityFunctions: 15,
    typeDefinitions: 50
  }
} as const;

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Convenience exports for common use cases
 */

/**
 * Quick start function for simple applications
 * Initializes the SDK with sensible defaults
 * 
 * @example
 * ```typescript
 * import { quickStart } from '@farert/sdk';
 * 
 * const { farertStore, utils } = await quickStart();
 * 
 * // Use the store in Svelte components
 * $: isReady = $farertStore.isReady;
 * ```
 */
export async function quickStart(config?: Partial<FarertStoreConfig>) {
  // Import Svelte SDK for initialization
  const { farertStore, initializeSvelteSDK } = await import('./svelte');
  const utils = await import('./utils');
  
  // Initialize with provided config or defaults
  if (config) {
    initializeSvelteSDK(config);
  }
  
  return {
    store: farertStore,
    utils: utils.fareUtils,
    version: SDK_INFO.version
  };
}

/**
 * Create a minimal fare calculator instance
 * For applications that only need basic fare calculation functionality
 * 
 * @example
 * ```typescript
 * import { createCalculator } from '@farert/sdk';
 * 
 * const calculator = await createCalculator();
 * const fare = await calculator.calculate('東京', '横浜');
 * ```
 */
export async function createCalculator() {
  const { farertStore } = await import('./svelte');
  const { createRouteBuilder } = await import('./utils');
  
  return {
    calculate: async (startStation: string, endStation: string) => {
      // Implementation would use the WebAssembly module
      // This is a placeholder for the actual implementation
      throw new Error('createCalculator not yet implemented - use farertStore for full functionality');
    },
    
    routeBuilder: createRouteBuilder(),
    
    // Provide access to the full store for advanced usage
    store: farertStore
  };
}

/**
 * Development utilities export
 * Only available in development builds
 */
export const devUtils = {
  inspectSDK: () => {
    if (import.meta.env && !import.meta.env.DEV) {
      console.warn('[FarertSDK] Development utilities only available in development mode');
      return null;
    }
    
    return {
      sdkInfo: SDK_INFO,
      loadedModules: {
        svelte: typeof window !== 'undefined' && 'svelte' in window,
        webAssembly: typeof WebAssembly !== 'undefined'
      },
      environment: {
        node: typeof process !== 'undefined',
        browser: typeof window !== 'undefined',
        webWorker: typeof self !== 'undefined' && 'importScripts' in self
      }
    };
  },
  
  // Re-export development utilities from Svelte SDK
  get svelteDevUtils() {
    return import('./svelte').then(m => m.dev);
  }
} as const;

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Default export provides the most commonly used functionality
 * This allows for `import FarertSDK from '@farert/sdk'` usage patterns
 */
export default {
  // Primary SDK components
  stores: {
    get farert() { return import('./svelte').then(m => m.farertStore); },
    get routeBuilder() { return import('./svelte').then(m => m.createRouteBuilderStore); }
  },
  
  // Utilities
  utils: {
    get fare() { return import('./utils').then(m => m.fareUtils); },
    get route() { return import('./utils').then(m => m.createRouteBuilder); }
  },
  
  // Quick initialization
  quickStart,
  createCalculator,
  
  // Metadata
  version: SDK_INFO.version,
  info: SDK_INFO,
  
  // Development
  dev: devUtils
} as const;

// ============================================================================
// JSDoc DOCUMENTATION FOR TYPESCRIPT INTELLISENSE
// ============================================================================

/**
 * @fileoverview
 * 
 * # Farert WebAssembly SDK
 * 
 * This SDK provides a comprehensive Svelte-first interface to the Farert WebAssembly
 * module for Japanese railway fare calculations. It includes:
 * 
 * ## Core Features
 * - **39+ WebAssembly APIs** - Complete access to C++ fare calculation logic
 * - **5 Object Classes** - Type-safe wrappers for WebAssembly objects
 * - **Svelte Stores** - Reactive state management for Svelte/SvelteKit apps
 * - **Framework-Agnostic Utilities** - Use in any JavaScript framework
 * - **Complete TypeScript Support** - Full type safety with strict mode
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { quickStart } from '@farert/sdk';
 * 
 * const { store, utils } = await quickStart();
 * 
 * // In Svelte components:
 * $: isReady = $store.isReady;
 * $: module = $store.wasmModule;
 * ```
 * 
 * ## Svelte Integration
 * 
 * ```typescript
 * import { farertStore, createRouteBuilderStore } from '@farert/sdk';
 * 
 * // Use reactive stores
 * $: canCalculate = $farertStore.isReady && !$farertStore.hasError;
 * 
 * // Create route builder for complex routes
 * const routeBuilder = createRouteBuilderStore();
 * ```
 * 
 * ## Utilities
 * 
 * ```typescript
 * import { formatFare, createRouteBuilder, validateRoute } from '@farert/sdk';
 * 
 * const formattedFare = formatFare(320, { locale: 'ja', currency: 'JPY' });
 * const builder = createRouteBuilder();
 * const validation = validateRoute('東京 東海道線 横浜');
 * ```
 * 
 * ## Error Handling
 * 
 * ```typescript
 * import { CLIError, isCLIError } from '@farert/sdk';
 * 
 * try {
 *   // SDK operations
 * } catch (error) {
 *   if (isCLIError(error)) {
 *     console.error('SDK Error:', error.message, error.code);
 *   }
 * }
 * ```
 * 
 * @see {@link https://farert.github.io/farert-wasm} Documentation
 * @see {@link https://github.com/farert/farert-wasm} Source Code
 */