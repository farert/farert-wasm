/**
 * Core SDK Module - WebAssembly Wrapper and Infrastructure
 * 
 * Central exports for the Farert WebAssembly wrapper and core infrastructure
 * components used throughout the frontend API layer SDK.
 * 
 * This module provides:
 * - WebAssembly wrapper with type safety and caching
 * - Factory functions for different usage scenarios
 * - Type definitions for WebAssembly integration
 * - Performance monitoring and Svelte reactivity support
 * 
 * @file Core Module Index
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// WASM WRAPPER EXPORTS
// ============================================================================

export {
  WasmWrapper,
  createWasmWrapper,
  createSvelteWasmWrapper,
  createProductionWasmWrapper
} from './wasm-wrapper';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  WasmWrapperConfig,
  WasmWrapperStats,
  ApiCallContext,
  ApiCallResult
} from './wasm-wrapper';

// ============================================================================
// RE-EXPORTS FROM CLI TYPES (for convenience)
// ============================================================================

export type {
  FarertModule,
  RouteWrapper,
  RouteListWrapper,
  CalcRouteWrapper,
  RouteItemWrapper,
  RouteFlagWrapper,
  FareInfoData,
  AndroidCompatibleRouteWrapper,
  AndroidCompatibleCalcRouteWrapper,
  AndroidCompatibleFareInfoData,
  AndroidCompatibleRouteItemData,
  AndroidRouteUtilCompat,
  AndroidCompatibilityResult,
  CLIError,
  CLIErrorCode,
  WebAssemblyLoadError,
  DatabaseError,
  InputValidationError,
  RouteConstructionError,
  FareCalculationError,
  RouteErrorCode
} from '../../cli/types';

// ============================================================================
// RE-EXPORTS FROM SDK TYPES (for convenience)
// ============================================================================

export type {
  StationInfo,
  StationSearchResult,
  FareCalculationResult,
  CompanyInfo,
  PrefectureInfo,
  LineInfo,
  RouteInfo,
  ValidationResult
} from '../types/core';