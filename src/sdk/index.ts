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
// SVELTE SDK EXPORTS (PRIMARY)
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
// REACT SDK EXPORTS (SECONDARY)
// ============================================================================

/**
 * Secondary React integration with hooks and context patterns
 * Provides React-native development experience using the core SDK
 */
export {
  // React Context and Provider
  FarertSDKContext,
  FarertSDKProvider,
  
  // Core React hooks
  useFarertSDK,
  useStationSearch,
  useFareCalculation,
  useRouteBuilder,
  useReferenceData,
  
  // Error boundary for WebAssembly failures
  FarertErrorBoundary
} from './react';

// React-specific types
export type {
  FarertSDKContextValue,
  FarertSDKProviderProps,
  UseStationSearchOptions,
  UseStationSearchResult,
  UseFareCalculationResult,
  UseRouteBuilderResult,
  UseReferenceDataResult,
  FarertErrorBoundaryProps
} from './react';

// ============================================================================
// VUE SDK EXPORTS (SECONDARY)
// ============================================================================

/**
 * Secondary Vue 3 integration with composables and plugin system
 * Provides Vue-native development experience using the core SDK
 */
export {
  // Vue Plugin System
  FarertSDKPlugin,
  FarertSDKKey,
  
  // Core Vue composables
  useFarertSDK as useVueFarertSDK,
  useStationSearch as useVueStationSearch,
  useFareCalculation as useVueFareCalculation,
  useRouteBuilder as useVueRouteBuilder,
  useReferenceData as useVueReferenceData
} from './vue';

// Vue-specific types
export type {
  FarertSDKPluginOptions,
  VueSDKState,
  UseFarertSDKResult as VueUseFarertSDKResult,
  UseStationSearchOptions as VueUseStationSearchOptions,
  UseStationSearchResult as VueUseStationSearchResult,
  UseFareCalculationResult as VueUseFareCalculationResult,
  UseRouteBuilderResult as VueUseRouteBuilderResult,
  UseReferenceDataResult as VueUseReferenceDataResult
} from './vue';

// ============================================================================
// MAIN FARERT SDK CLASS
// ============================================================================

/**
 * Main FarertSDK class that provides unified access to all WebAssembly functionality
 * with enhanced TypeScript support, intelligent caching, and comprehensive error handling.
 * This is the primary entry point for the Frontend API Layer SDK.
 */
export {
  // Main SDK class and factory functions
  FarertSDK,
  createFarertSDK,
  createDevelopmentSDK,
  createProductionSDK,
  
  // Core SDK types and interfaces
  type FarertSDKInterface,
  type SDKState,
  type SDKConfig
} from './core/farert-sdk';

// ============================================================================
// CORE WEBASSEMBLY WRAPPER
// ============================================================================

/**
 * Core WebAssembly wrapper with type safety, caching, and error handling
 * Provides direct access to all 39+ WebAssembly APIs with production-ready features
 */
export {
  // Main WebAssembly wrapper class and factory functions
  WasmWrapper,
  createWasmWrapper,
  createSvelteWasmWrapper,
  createProductionWasmWrapper,
  
  // Core infrastructure types
  type WasmWrapperConfig,
  type WasmWrapperStats,
  type ApiCallContext,
  type ApiCallResult
} from './core';

// ============================================================================
// ENHANCED OBJECT CLASSES
// ============================================================================

/**
 * Enhanced object classes with fluent APIs and lifecycle management
 * Provides modern JavaScript patterns for the 6 core WebAssembly object classes
 */
export {
  // Enhanced object class implementations
  ObjectLifecycleManager,
  ObjectClassFactory,
  createObjectClassFactory,
  
  // Enhanced object class interfaces
  type EnhancedRouteList,
  type EnhancedRoute,
  type EnhancedCalcRoute,
  type EnhancedRouteItem,
  type EnhancedRouteFlag,
  type EnhancedFareInfo,
  
  // Supporting types and enums
  RouteFlagType
} from './core/object-classes';

// ============================================================================
// CACHING AND PERFORMANCE
// ============================================================================

/**
 * Intelligent caching system for WebAssembly API calls
 * Provides LRU caching with category-specific TTL values and memory management
 */
export {
  // Cache manager for WebAssembly API caching
  CacheManager,
  CacheCategory,
  createCacheManager,
  createSvelteCacheManager,
  createProductionCacheManager,
  
  // LRU cache implementation
  LRUCache,
  CACHE_PRESETS,
  
  // Cache-specific types
  type CacheManagerConfig,
  type CacheManagerStats,
  type CacheConfig,
  type CacheStats,
  type CacheEntry
} from './cache';

// ============================================================================
// ERROR MANAGEMENT SYSTEM
// ============================================================================

/**
 * Comprehensive error management with retry logic and WebAssembly error handling
 * Includes automatic retry, circuit breaker, and user-friendly error messaging
 */
export {
  // Enhanced error management system
  ErrorManager,
  ManagedError,
  ErrorSeverity,
  ErrorCategory,
  createErrorManager,
  createSvelteErrorManager,
  createProductionErrorManager,
  isManagedError,
  convertCLIError,
  
  // Retry strategies
  DEVELOPMENT_RETRY_STRATEGY,
  PRODUCTION_RETRY_STRATEGY,
  SVELTE_ERROR_MANAGER_CONFIG,
  MINIMAL_ERROR_MANAGER_CONFIG,
  
  // Enhanced error types
  type RetryStrategy,
  type ErrorContext,
  type ErrorRecoveryAction,
  type ErrorSuggestion,
  type ErrorManagerConfig,
  type ErrorManagerStats,
  type CircuitBreakerInfo,
  type UserFriendlyError
} from './errors';

// ============================================================================
// DEBUG TOOLS AND DIAGNOSTICS
// ============================================================================

/**
 * Comprehensive debugging utilities for troubleshooting SDK issues,
 * performance optimization, and understanding internal behavior
 */
export {
  // Main debug tools class and factory functions
  DebugTools,
  createDevelopmentDebugTools,
  createProductionDebugTools,
  createPerformanceDebugTools,
  
  // Debug level enumeration
  DebugLevel,
  
  // Debug-specific types
  type DebugConfig,
  type CacheInspectionResult,
  type PerformanceMonitoringData,
  type WebAssemblyMemoryAnalysis,
  type SDKStateSnapshot,
  type DiagnosticReport
} from './debug';

// ============================================================================
// FRAMEWORK-AGNOSTIC UTILITIES
// ============================================================================

/**
 * Framework-agnostic utilities for fare formatting, validation, route building,
 * and framework detection - Can be used in any JavaScript framework or vanilla JavaScript applications
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
  
  // Framework detection utilities
  FrameworkDetector,
  detectFramework,
  getOptimizedSDKLoader,
  getFrameworkConfig,
  isFrameworkSupported,
  createFrameworkDetector,
  frameworkDetector,
  frameworkDetectorDev,
  
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
  StationNameOptions,
  
  // Framework detection types
  FrameworkDetectionResult,
  FrameworkType,
  MetaFrameworkType,
  EnvironmentInfo,
  FrameworkDetails,
  BundlerInfo,
  FrameworkAdapter,
  ConditionalLoadingConfig,
  DetectionRule
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

/**
 * Comprehensive error management system
 * Provides retry logic, WebAssembly error handling, and user-friendly messaging
 */
export {
  ErrorManager,
  ManagedError,
  ErrorSeverity,
  ErrorCategory,
  createErrorManager,
  createSvelteErrorManager,
  createProductionErrorManager,
  isManagedError,
  convertCLIError,
  DEVELOPMENT_RETRY_STRATEGY,
  PRODUCTION_RETRY_STRATEGY,
  SVELTE_ERROR_MANAGER_CONFIG,
  MINIMAL_ERROR_MANAGER_CONFIG
} from './errors';

export type {
  RetryStrategy,
  ErrorContext,
  ErrorRecoveryAction,
  ErrorSuggestion,
  ErrorManagerConfig,
  ErrorManagerStats,
  CircuitBreakerInfo
} from './errors';

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
    reactHooks: true, // ✅ Implemented - Task 18
    vueComposables: true, // ✅ Implemented - Task 19
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
 * const { sdk, utils } = await quickStart();
 * 
 * // Initialize and use the SDK
 * await sdk.initialize();
 * const station = await sdk.getStationById("東京");
 * ```
 */
export async function quickStart(config?: Partial<SDKConfig>) {
  // Import main SDK class
  const { createFarertSDK } = await import('./core/farert-sdk');
  const utils = await import('./utils');
  
  // Create SDK with provided config or defaults
  const sdk = createFarertSDK(config);
  
  return {
    sdk,
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
 * await calculator.initialize();
 * const fare = await calculator.calculate('東京', '横浜');
 * ```
 */
export async function createCalculator() {
  const { createFarertSDK } = await import('./core/farert-sdk');
  const { createRouteBuilder } = await import('./utils');
  
  const sdk = createFarertSDK({
    caching: { enabled: true },
    errorHandling: { retryAttempts: 2 }
  });
  
  return {
    // Initialize the SDK
    initialize: () => sdk.initialize(),
    
    // Simple calculation interface
    calculate: async (startStation: string, endStation: string) => {
      const result = await sdk.calculateFare({
        start: startStation,
        end: endStation
      });
      return result.totalFare;
    },
    
    // Advanced calculation with full result
    calculateAdvanced: (startStation: string, endStation: string) => {
      return sdk.calculateFare({
        start: startStation,
        end: endStation
      });
    },
    
    // Search stations
    searchStations: (query: string) => sdk.searchStations(query),
    
    // Route builder utility
    routeBuilder: createRouteBuilder(),
    
    // Access to full SDK for advanced usage
    sdk
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
  
  // Debug tools for development
  get debugTools() {
    return import('./debug').then(m => m.createDevelopmentDebugTools);
  },
  
  // Performance debug tools
  get performanceDebugTools() {
    return import('./debug').then(m => m.createPerformanceDebugTools);
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
  // Main SDK class
  SDK: {
    get create() { return import('./core/farert-sdk').then(m => m.createFarertSDK); },
    get createDevelopment() { return import('./core/farert-sdk').then(m => m.createDevelopmentSDK); },
    get createProduction() { return import('./core/farert-sdk').then(m => m.createProductionSDK); }
  },
  
  // Legacy Svelte stores for backward compatibility
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
 * import { FarertSDK, createFarertSDK } from '@farert/sdk';
 * 
 * const sdk = createFarertSDK();
 * await sdk.initialize();
 * 
 * // Get station information
 * const station = await sdk.getStationById("東京");
 * 
 * // Calculate fares
 * const result = await sdk.calculateFare("東京 東海道線 横浜");
 * console.log(`Fare: ${result.totalFare}円`);
 * ```
 * 
 * ## Object-Oriented API
 * 
 * ```typescript
 * import { FarertSDK } from '@farert/sdk';
 * 
 * const sdk = new FarertSDK();
 * await sdk.initialize();
 * 
 * // Create routes with fluent API
 * const route = sdk.objectClasses.Route.create()
 *   .from("東京")
 *   .via("品川")
 *   .to("横浜");
 * 
 * const calcRoute = sdk.objectClasses.CalcRoute.create()
 *   .from("東京")
 *   .to("大阪")
 *   .setLongRouteEnabled(true);
 * 
 * const fareResult = await calcRoute.calculateFare();
 * ```
 * 
 * ## Svelte Integration (Legacy)
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