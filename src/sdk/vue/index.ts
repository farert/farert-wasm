/**
 * Vue Compatibility Layer Entry Point
 * 
 * Main entry point for the Vue 3 compatibility layer of the Farert Frontend API Layer SDK.
 * Exports all Vue composables, plugin system, and type definitions for seamless integration
 * with Vue applications.
 * 
 * @file Vue Package Entry Point
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// MAIN EXPORTS
// ============================================================================

// Vue Plugin System
export {
  FarertSDKPlugin,
  FarertSDKKey,
  type FarertSDKPluginOptions,
  type VueSDKState
} from './vue-adapter';

// Core Composables
export {
  useFarertSDK,
  useStationSearch,
  useFareCalculation,
  useRouteBuilder,
  useReferenceData,
  type UseFarertSDKResult,
  type UseStationSearchOptions,
  type UseStationSearchResult,
  type UseFareCalculationResult,
  type UseRouteBuilderResult,
  type UseReferenceDataResult
} from './vue-adapter';

// Re-export core SDK types for convenience
export type {
  FarertSDK,
  SDKState,
  SDKConfig,
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

// Re-export utility functions for convenience
export { formatFare, calculateDiscountPercentage } from '../utils/fare-utils';
export { validateRouteSegments, optimizeRoute } from '../utils/route-utils';
export { debounce } from '../utils/station-utils';

// Default export for convenience
export { default } from './vue-adapter';