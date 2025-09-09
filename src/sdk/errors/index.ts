/**
 * Error Management System Exports
 * 
 * Central export point for all error management functionality in the Farert SDK.
 * This module provides comprehensive error handling with retry logic, WebAssembly-specific
 * error detection, user-friendly messaging, and Svelte-reactive error state management.
 * 
 * @file Error Management System Exports
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// MAIN ERROR MANAGER EXPORTS
// ============================================================================

export {
  ErrorManager,
  createErrorManager,
  createSvelteErrorManager,
  createProductionErrorManager
} from './error-manager';

// ============================================================================
// ERROR TYPES AND ENUMS
// ============================================================================

export {
  ErrorSeverity,
  ErrorCategory,
  ManagedError,
  CircuitBreakerState
} from './error-manager';

// ============================================================================
// INTERFACE EXPORTS
// ============================================================================

export type {
  RetryStrategy,
  ErrorContext,
  ErrorRecoveryAction,
  ErrorSuggestion,
  ErrorManagerConfig,
  ErrorManagerStats,
  CircuitBreakerInfo
} from './error-manager';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export {
  isManagedError,
  convertCLIError
} from './error-manager';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default retry strategy for development environments
 */
export const DEVELOPMENT_RETRY_STRATEGY = {
  maxAttempts: 5,
  initialDelay: 500,
  backoffMultiplier: 1.5,
  maxDelay: 5000,
  jitter: 0.2,
  retryableErrors: new Set([
    'WASM_LOAD_FAILED',
    'WASM_RUNTIME_ERROR',
    'NETWORK_ERROR',
    'CALCULATION_FAILED',
    'DB_CONNECTION_FAILED',
    'CACHE_ERROR'
  ]),
  nonRetryableErrors: new Set([
    'INVALID_STATION_NAME',
    'INVALID_LINE_NAME',
    'MALFORMED_INPUT',
    'WASM_MODULE_INVALID',
    'WASM_FUNCTION_NOT_FOUND'
  ])
} as const;

/**
 * Default retry strategy for production environments
 */
export const PRODUCTION_RETRY_STRATEGY = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  jitter: 0.1,
  retryableErrors: new Set([
    'WASM_LOAD_FAILED',
    'NETWORK_ERROR',
    'CALCULATION_FAILED'
  ]),
  nonRetryableErrors: new Set([
    'INVALID_STATION_NAME',
    'INVALID_LINE_NAME',
    'MALFORMED_INPUT',
    'WASM_MODULE_INVALID',
    'WASM_FUNCTION_NOT_FOUND',
    'WASM_INSTANTIATION_FAILED'
  ])
} as const;

/**
 * Default error manager configuration for Svelte applications
 */
export const SVELTE_ERROR_MANAGER_CONFIG = {
  svelteReactive: true,
  enableCircuitBreaker: true,
  enableWasmErrorHandling: true,
  enablePerformanceMonitoring: true,
  maxErrorHistory: 1000,
  defaultLocale: 'ja' as const,
  circuitBreakerConfig: {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    halfOpenMaxCalls: 2
  }
} as const;

/**
 * Minimal error manager configuration for production
 */
export const MINIMAL_ERROR_MANAGER_CONFIG = {
  svelteReactive: false,
  enableCircuitBreaker: false,
  enableWasmErrorHandling: true,
  enablePerformanceMonitoring: false,
  enableErrorReporting: false,
  maxErrorHistory: 100,
  defaultLocale: 'ja' as const
} as const;