/**
 * Security Module for Farert Frontend API Layer SDK
 * 
 * This module provides comprehensive security validation and input sanitization
 * for the Farert WebAssembly SDK, protecting against various attack vectors
 * while maintaining excellent developer experience.
 * 
 * @file Security Module Exports
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// Export the main InputValidator class and factory functions
export {
  InputValidator,
  createInputValidator,
  createStrictInputValidator,
  createPermissiveInputValidator
} from './input-validator';

// Export all types and interfaces
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidatorOptions,
  RouteValidationOptions,
  PaginationParams
} from './input-validator';

// Export enums and constants
export {
  SecurityLevel,
  SecurityViolationType,
  SecurityWarningType,
  ValidationErrorCode
} from './input-validator';

// Re-export as default for convenience
export { InputValidator as default } from './input-validator';