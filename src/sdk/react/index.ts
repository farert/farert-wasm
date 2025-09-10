/**
 * React Compatibility Layer - Main Export
 * 
 * Provides React hooks and components for the Farert Frontend API Layer SDK.
 * This is a secondary support layer that wraps the core SDK with React-native patterns.
 * 
 * @file React Adapter Index
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-005: React compatibility layer using core SDK
 */

// Export all React hooks and components
export {
  // Context and Provider
  FarertSDKContext,
  FarertSDKProvider,
  
  // Core hooks
  useFarertSDK,
  useStationSearch,
  useFareCalculation,
  useRouteBuilder,
  useReferenceData,
  
  // Error boundary
  FarertErrorBoundary
} from './react-adapter';

// Export React-specific types
export type {
  FarertSDKContextValue,
  FarertSDKProviderProps,
  UseStationSearchOptions,
  UseStationSearchResult,
  UseFareCalculationResult,
  UseRouteBuilderResult,
  UseReferenceDataResult,
  FarertErrorBoundaryProps
} from './react-adapter';

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

// Re-export utility functions for React components
export { formatFare, calculateDiscountPercentage } from '../utils/fare-utils';
export { validateRouteSegments, optimizeRoute } from '../utils/route-utils';
export { debounce } from '../utils/station-utils';