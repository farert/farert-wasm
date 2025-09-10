/**
 * Debug Tools Export Module for Farert Frontend API Layer SDK
 * 
 * Exports comprehensive debugging utilities for troubleshooting SDK issues,
 * performance optimization, and understanding internal behavior.
 * 
 * @file Debug Module Exports
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// Main debug tools class and factory functions
export {
  DebugTools,
  createDevelopmentDebugTools,
  createProductionDebugTools,
  createPerformanceDebugTools
} from './debug-tools';

// Type definitions and enums
export type {
  DebugConfig,
  CacheInspectionResult,
  PerformanceMonitoringData,
  WebAssemblyMemoryAnalysis,
  SDKStateSnapshot,
  DiagnosticReport
} from './debug-tools';

export { DebugLevel } from './debug-tools';

// Re-export commonly used types from other modules for convenience
export type {
  CacheManagerStats,
  CacheManagerEvent,
  CacheManagerEventType,
  CacheCategory
} from '../cache/cache-manager';

export type {
  ErrorSeverity,
  ErrorCategory,
  UserFriendlyError,
  ErrorContext
} from '../errors/error-manager';

export type {
  ValidationResult
} from '../types/core';