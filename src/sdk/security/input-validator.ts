/**
 * Security Input Validator for Farert Frontend API Layer SDK
 * 
 * Comprehensive security validation system that prevents injection attacks,
 * validates Japanese text correctly, and provides robust input sanitization
 * for all API parameters including station names, route parameters, and search queries.
 * 
 * This validator is designed to protect the Frontend API Layer from various attack vectors
 * while maintaining excellent developer experience and complete TypeScript type safety.
 * 
 * Security Features:
 * - Injection attack prevention (SQL, NoSQL, XSS, prototype pollution)
 * - Japanese text validation with Unicode normalization
 * - Station ID and line ID range validation
 * - Route parameter structure validation
 * - Search query sanitization with safe error handling
 * - Memory-safe validation with bounded execution time
 * 
 * Requirements:
 * - REQ-SEC-001: Prevent injection attacks through station names or route parameters
 * - REQ-SEC-002: Handle Japanese text validation correctly
 * - REQ-SEC-003: Provide TypeScript type safety for all validation functions
 * - REQ-SEC-004: Return safe error messages that don't expose internals
 * 
 * @file Security Input Validator Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

// Import core types for validation
import type {
  StationInfo,
  RouteSegment,
  RouteSpec,
  StationSearchOptions,
  RouteValidationErrorCode,
  FarertSDKError,
  FarertSDKErrorCode
} from '../types/core';

// Import existing validation utilities for reference
// Note: We implement our own security-focused validation that builds upon but doesn't directly use these

// ============================================================================
// SECURITY VALIDATION INTERFACES
// ============================================================================

/**
 * Validation result with comprehensive security feedback
 */
export interface ValidationResult {
  /** Whether the input is valid and safe */
  isValid: boolean;
  
  /** Validation errors with security context */
  errors: ValidationError[];
  
  /** Sanitized/normalized value if validation passes */
  sanitizedValue?: any;
  
  /** Security warnings (non-blocking) */
  warnings: ValidationWarning[];
  
  /** Validation metadata */
  metadata: {
    validationTime: number;
    originalLength: number;
    sanitizedLength?: number;
    securityLevel: SecurityLevel;
  };
}

/**
 * Validation error with security classification
 */
export interface ValidationError {
  /** Error field/parameter name */
  field: string;
  
  /** Error code for programmatic handling */
  code: ValidationErrorCode;
  
  /** User-safe error message (no internals exposed) */
  message: string;
  
  /** Error severity level */
  severity: 'error' | 'warning';
  
  /** Security-related classification */
  securityType?: SecurityViolationType;
  
  /** Safe suggestions for fixing the error */
  suggestions: string[];
}

/**
 * Security warning for potential issues
 */
export interface ValidationWarning {
  /** Warning type */
  type: SecurityWarningType;
  
  /** Warning message */
  message: string;
  
  /** Recommended action */
  recommendation: string;
  
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Security levels for input classification
 */
export enum SecurityLevel {
  SAFE = 'safe',
  MONITORED = 'monitored', 
  SUSPICIOUS = 'suspicious',
  BLOCKED = 'blocked'
}

/**
 * Security violation types
 */
export enum SecurityViolationType {
  SQL_INJECTION = 'sql_injection',
  XSS_ATTEMPT = 'xss_attempt',
  PROTOTYPE_POLLUTION = 'prototype_pollution',
  COMMAND_INJECTION = 'command_injection',
  PATH_TRAVERSAL = 'path_traversal',
  BUFFER_OVERFLOW = 'buffer_overflow',
  UNICODE_ATTACK = 'unicode_attack',
  REGEX_DOS = 'regex_dos'
}

/**
 * Security warning types
 */
export enum SecurityWarningType {
  UNUSUAL_CHARACTERS = 'unusual_characters',
  EXCESSIVE_LENGTH = 'excessive_length',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  ENCODING_ISSUE = 'encoding_issue',
  RATE_LIMIT_CONCERN = 'rate_limit_concern'
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  // Input format errors
  INVALID_FORMAT = 'INVALID_FORMAT',
  EMPTY_INPUT = 'EMPTY_INPUT',
  EXCESSIVE_LENGTH = 'EXCESSIVE_LENGTH',
  INVALID_CHARACTERS = 'INVALID_CHARACTERS',
  
  // Security violations
  INJECTION_ATTEMPT = 'INJECTION_ATTEMPT',
  XSS_DETECTED = 'XSS_DETECTED',
  MALICIOUS_PATTERN = 'MALICIOUS_PATTERN',
  UNSAFE_UNICODE = 'UNSAFE_UNICODE',
  
  // Data validation errors
  INVALID_STATION_ID = 'INVALID_STATION_ID',
  INVALID_LINE_ID = 'INVALID_LINE_ID',
  INVALID_ROUTE_STRUCTURE = 'INVALID_ROUTE_STRUCTURE',
  CIRCULAR_ROUTE = 'CIRCULAR_ROUTE',
  
  // Search validation errors
  INVALID_SEARCH_QUERY = 'INVALID_SEARCH_QUERY',
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  INVALID_OPTIONS = 'INVALID_OPTIONS'
}

/**
 * Validator configuration options
 */
export interface ValidatorOptions {
  /** Maximum allowed string length */
  maxStringLength?: number;
  
  /** Maximum allowed array length */
  maxArrayLength?: number;
  
  /** Enable Japanese text validation */
  enableJapaneseValidation?: boolean;
  
  /** Enable Unicode normalization */
  enableUnicodeNormalization?: boolean;
  
  /** Security level threshold */
  securityLevelThreshold?: SecurityLevel;
  
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  
  /** Custom validation patterns */
  customPatterns?: {
    dangerous: RegExp[];
    suspicious: RegExp[];
    allowed: RegExp[];
  };
  
  /** Rate limiting configuration */
  rateLimiting?: {
    enabled: boolean;
    maxRequestsPerMinute: number;
    windowSizeMs: number;
  };
}

/**
 * Route validation options
 */
export interface RouteValidationOptions {
  /** Maximum number of route segments */
  maxSegments?: number;
  
  /** Allow circular routes */
  allowCircular?: boolean;
  
  /** Validate station connectivity */
  validateConnectivity?: boolean;
  
  /** Maximum route distance (km) */
  maxDistance?: number;
}

/**
 * Pagination validation parameters
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  
  /** Items per page */
  limit?: number;
  
  /** Offset from start */
  offset?: number;
  
  /** Sort field */
  sortBy?: string;
  
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// SECURITY PATTERNS AND CONSTANTS
// ============================================================================

/**
 * Dangerous patterns that indicate potential attacks
 */
const DANGEROUS_PATTERNS = [
  // SQL Injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
  /(\b(OR|AND)\s+\w+\s*=\s*\w+)/i,
  /(--|\/\*|\*\/)/,
  /('(\s*;\s*|\s*OR\s+|\s*AND\s+))/i,
  
  // XSS patterns
  /<script[^>]*>.*?<\/script>/i,
  /<iframe[^>]*>.*?<\/iframe>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  
  // Command injection patterns
  /(\||;|&|`|\$\(|\$\{)/,
  /(cmd|powershell|bash|sh|eval|exec)\s*\(/i,
  
  // Path traversal patterns
  /(\.\.|\/\.\.|\\\.\.)/,
  /(\/etc\/|\/proc\/|\/sys\/|C:\\)/i,
  
  // Prototype pollution patterns
  /(__proto__|constructor\.prototype|prototype\.constructor)/i,
  
  // Unicode attacks
  /[\u200B-\u200D\uFEFF]/,  // Zero-width characters
  /[\u0000-\u001F\u007F-\u009F]/,  // Control characters
];

/**
 * Suspicious patterns that warrant monitoring
 */
const SUSPICIOUS_PATTERNS = [
  // Unusual repetition
  /(.)\1{10,}/,
  
  // Mixed scripts in suspicious ways
  /[\u4e00-\u9fff].*[a-zA-Z].*[\u4e00-\u9fff]/,
  
  // Excessive punctuation
  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{5,}/,
  
  // Base64-like patterns
  /^[A-Za-z0-9+\/=]{20,}$/,
  
  // URL-like patterns in unexpected places
  /(https?|ftp):\/\/[^\s]+/i,
];

/**
 * Valid Japanese text patterns
 */
const JAPANESE_TEXT_PATTERNS = {
  // Hiragana: あ-ん
  hiragana: /[\u3041-\u3096]/,
  
  // Katakana: ア-ン
  katakana: /[\u30A1-\u30FA]/,
  
  // Kanji: 一-龯
  kanji: /[\u4e00-\u9fff]/,
  
  // Japanese punctuation
  punctuation: /[\u3000-\u303f]/,
  
  // Valid station name characters (includes some ASCII for mixed names)
  stationName: /^[\u3041-\u3096\u30A1-\u30FA\u4e00-\u9fff\u3000-\u303fa-zA-Z0-9\s\-()（）・ー]+$/,
};

/**
 * Security limits and constraints
 */
const SECURITY_LIMITS = {
  MAX_STRING_LENGTH: 1000,
  MAX_STATION_NAME_LENGTH: 100,
  MAX_SEARCH_QUERY_LENGTH: 200,
  MAX_ROUTE_SEGMENTS: 50,
  MAX_ARRAY_LENGTH: 1000,
  MAX_PAGINATION_LIMIT: 1000,
  MAX_UNICODE_LENGTH: 2000,
  VALIDATION_TIMEOUT_MS: 5000,
} as const;

// ============================================================================
// MAIN INPUT VALIDATOR CLASS
// ============================================================================

/**
 * Comprehensive security input validator
 * 
 * Provides robust validation for all input types in the Farert SDK,
 * with special emphasis on Japanese text handling and security.
 */
export class InputValidator {
  private readonly options: Required<ValidatorOptions>;
  private readonly performanceMetrics = new Map<string, number[]>();
  private readonly rateLimitTracker = new Map<string, number[]>();

  constructor(options: ValidatorOptions = {}) {
    this.options = {
      maxStringLength: options.maxStringLength ?? SECURITY_LIMITS.MAX_STRING_LENGTH,
      maxArrayLength: options.maxArrayLength ?? SECURITY_LIMITS.MAX_ARRAY_LENGTH,
      enableJapaneseValidation: options.enableJapaneseValidation ?? true,
      enableUnicodeNormalization: options.enableUnicodeNormalization ?? true,
      securityLevelThreshold: options.securityLevelThreshold ?? SecurityLevel.SUSPICIOUS,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
      customPatterns: {
        dangerous: [...DANGEROUS_PATTERNS, ...(options.customPatterns?.dangerous ?? [])],
        suspicious: [...SUSPICIOUS_PATTERNS, ...(options.customPatterns?.suspicious ?? [])],
        allowed: options.customPatterns?.allowed ?? []
      },
      rateLimiting: {
        enabled: options.rateLimiting?.enabled ?? true,
        maxRequestsPerMinute: options.rateLimiting?.maxRequestsPerMinute ?? 100,
        windowSizeMs: options.rateLimiting?.windowSizeMs ?? 60000
      }
    };
  }

  // ============================================================================
  // STATION VALIDATION METHODS
  // ============================================================================

  /**
   * Validate station name with comprehensive security checks
   * 
   * @param name Station name to validate
   * @returns Validation result with sanitized value
   */
  validateStationName(name: string): ValidationResult {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Rate limiting check
      if (!this.checkRateLimit('stationName')) {
        return this.createBlockedResult('Rate limit exceeded', startTime, name);
      }

      // Basic input validation
      if (!this.isValidInput(name)) {
        errors.push({
          field: 'name',
          code: ValidationErrorCode.INVALID_FORMAT,
          message: 'Station name must be a valid string',
          severity: 'error',
          suggestions: ['Provide a non-empty string value']
        });
      }

      // Length validation
      if (name && name.length > SECURITY_LIMITS.MAX_STATION_NAME_LENGTH) {
        errors.push({
          field: 'name',
          code: ValidationErrorCode.EXCESSIVE_LENGTH,
          message: `Station name exceeds maximum length of ${SECURITY_LIMITS.MAX_STATION_NAME_LENGTH} characters`,
          severity: 'error',
          suggestions: ['Shorten the station name', 'Remove unnecessary characters']
        });
      }

      // Security pattern analysis
      const securityAnalysis = this.analyzeSecurityPatterns(name);
      errors.push(...securityAnalysis.errors);
      warnings.push(...securityAnalysis.warnings);

      // Japanese text validation
      if (this.options.enableJapaneseValidation && name) {
        const japaneseValidation = this.validateJapaneseText(name);
        if (!japaneseValidation.isValid) {
          errors.push(...japaneseValidation.errors);
        }
        warnings.push(...japaneseValidation.warnings);
      }

      // Sanitization
      let sanitizedValue: string | undefined;
      if (errors.length === 0 && name) {
        sanitizedValue = this.sanitizeString(name);
      }

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      // Record performance metrics
      if (this.options.enablePerformanceMonitoring) {
        this.recordPerformanceMetric('stationName', validationTime);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue,
        metadata: {
          validationTime,
          originalLength: name?.length ?? 0,
          sanitizedLength: sanitizedValue?.length,
          securityLevel: this.determineSecurityLevel(errors, warnings)
        }
      };

    } catch (error) {
      return this.createErrorResult(
        'Validation failed due to internal error',
        startTime,
        name,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate station ID with range and format checks
   * 
   * @param id Station ID to validate
   * @returns Validation result
   */
  validateStationId(id: number): ValidationResult {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Rate limiting check
      if (!this.checkRateLimit('stationId')) {
        return this.createBlockedResult('Rate limit exceeded', startTime, id);
      }

      // Type validation
      if (typeof id !== 'number' || isNaN(id) || !isFinite(id)) {
        errors.push({
          field: 'id',
          code: ValidationErrorCode.INVALID_STATION_ID,
          message: 'Station ID must be a valid finite number',
          severity: 'error',
          suggestions: ['Provide a valid numeric station ID']
        });
      }

      // Range validation
      else if (id <= 0) {
        errors.push({
          field: 'id',
          code: ValidationErrorCode.INVALID_STATION_ID,
          message: 'Station ID must be a positive integer',
          severity: 'error',
          suggestions: ['Station IDs start from 1']
        });
      }

      // Reasonable range check (Japanese station IDs)
      else if (id > 99999999) {
        errors.push({
          field: 'id',
          code: ValidationErrorCode.INVALID_STATION_ID,
          message: 'Station ID appears to be outside valid range',
          severity: 'error',
          suggestions: ['Japanese station IDs are typically 7 digits or less']
        });
      }

      // Integer check
      else if (!Number.isInteger(id)) {
        warnings.push({
          type: SecurityWarningType.SUSPICIOUS_PATTERN,
          message: 'Station ID should be an integer',
          recommendation: 'Round to nearest integer if needed',
          riskLevel: 'low'
        });
      }

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: errors.length === 0 ? Math.floor(id) : undefined,
        metadata: {
          validationTime,
          originalLength: String(id).length,
          sanitizedLength: errors.length === 0 ? String(Math.floor(id)).length : undefined,
          securityLevel: this.determineSecurityLevel(errors, warnings)
        }
      };

    } catch (error) {
      return this.createErrorResult(
        'Station ID validation failed',
        startTime,
        id,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // ============================================================================
  // ROUTE VALIDATION METHODS
  // ============================================================================

  /**
   * Validate route segments with comprehensive security and structure checks
   * 
   * @param segments Route segments to validate
   * @param options Validation options
   * @returns Validation result
   */
  validateRouteSegments(
    segments: RouteSegment[], 
    options: RouteValidationOptions = {}
  ): ValidationResult {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Rate limiting check
      if (!this.checkRateLimit('routeSegments')) {
        return this.createBlockedResult('Rate limit exceeded', startTime, segments);
      }

      // Basic array validation
      if (!Array.isArray(segments)) {
        errors.push({
          field: 'segments',
          code: ValidationErrorCode.INVALID_ROUTE_STRUCTURE,
          message: 'Route segments must be an array',
          severity: 'error',
          suggestions: ['Provide route segments as an array']
        });
        return this.createValidationResult(errors, warnings, startTime, segments);
      }

      // Length validation
      const maxSegments = options.maxSegments ?? SECURITY_LIMITS.MAX_ROUTE_SEGMENTS;
      if (segments.length > maxSegments) {
        errors.push({
          field: 'segments',
          code: ValidationErrorCode.EXCESSIVE_LENGTH,
          message: `Route has too many segments (maximum: ${maxSegments})`,
          severity: 'error',
          suggestions: ['Reduce the number of route segments', 'Split into multiple routes']
        });
      }

      // Empty route check
      if (segments.length === 0) {
        errors.push({
          field: 'segments',
          code: ValidationErrorCode.EMPTY_INPUT,
          message: 'Route must contain at least one segment',
          severity: 'error',
          suggestions: ['Add at least one route segment']
        });
      }

      // Validate individual segments
      const validatedSegments: RouteSegment[] = [];
      const stationIds = new Set<number>();

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const segmentValidation = this.validateRouteSegment(segment, i);
        
        if (!segmentValidation.isValid) {
          errors.push(...segmentValidation.errors);
        } else if (segmentValidation.sanitizedValue) {
          validatedSegments.push(segmentValidation.sanitizedValue);
          
          // Check for circular routes
          if (stationIds.has(segment.stationId)) {
            if (!options.allowCircular) {
              errors.push({
                field: `segments[${i}].stationId`,
                code: ValidationErrorCode.CIRCULAR_ROUTE,
                message: `Circular route detected: station ${segment.stationId} appears multiple times`,
                severity: 'error',
                suggestions: ['Remove duplicate stations', 'Use different stations']
              });
            } else {
              warnings.push({
                type: SecurityWarningType.SUSPICIOUS_PATTERN,
                message: 'Circular route detected',
                recommendation: 'Verify this is intentional',
                riskLevel: 'low'
              });
            }
          }
          stationIds.add(segment.stationId);
        }
        
        warnings.push(...segmentValidation.warnings);
      }

      // Route connectivity validation (if enabled)
      if (options.validateConnectivity && validatedSegments.length > 1) {
        const connectivityValidation = this.validateRouteConnectivity(validatedSegments);
        errors.push(...connectivityValidation.errors);
        warnings.push(...connectivityValidation.warnings);
      }

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: errors.length === 0 ? validatedSegments : undefined,
        metadata: {
          validationTime,
          originalLength: segments.length,
          sanitizedLength: validatedSegments.length,
          securityLevel: this.determineSecurityLevel(errors, warnings)
        }
      };

    } catch (error) {
      return this.createErrorResult(
        'Route validation failed',
        startTime,
        segments,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate route options object
   * 
   * @param options Route options to validate
   * @returns Validation result
   */
  validateRouteOptions(options: any): ValidationResult {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Rate limiting check
      if (!this.checkRateLimit('routeOptions')) {
        return this.createBlockedResult('Rate limit exceeded', startTime, options);
      }

      // Null/undefined check
      if (options === null || options === undefined) {
        return {
          isValid: true,
          errors: [],
          warnings: [],
          sanitizedValue: {},
          metadata: {
            validationTime: performance.now() - startTime,
            originalLength: 0,
            sanitizedLength: 0,
            securityLevel: SecurityLevel.SAFE
          }
        };
      }

      // Type check
      if (typeof options !== 'object') {
        errors.push({
          field: 'options',
          code: ValidationErrorCode.INVALID_FORMAT,
          message: 'Route options must be an object',
          severity: 'error',
          suggestions: ['Provide route options as an object']
        });
        return this.createValidationResult(errors, warnings, startTime, options);
      }

      // Prototype pollution protection
      const prototypePollutionCheck = this.checkPrototypePollution(options);
      if (!prototypePollutionCheck.isValid) {
        errors.push({
          field: 'options',
          code: ValidationErrorCode.INJECTION_ATTEMPT,
          message: 'Potential prototype pollution attempt detected',
          severity: 'error',
          securityType: SecurityViolationType.PROTOTYPE_POLLUTION,
          suggestions: ['Remove prototype manipulation properties']
        });
      }

      // Sanitize and validate known properties
      const sanitizedOptions: any = {};
      const allowedProperties = [
        'preferFaster', 'preferCheaper', 'avoidTransfers', 'maxTransfers',
        'allowedLineTypes', 'prohibitedLines'
      ];

      for (const [key, value] of Object.entries(options)) {
        if (allowedProperties.includes(key)) {
          const propertyValidation = this.validateRouteOptionProperty(key, value);
          if (propertyValidation.isValid) {
            sanitizedOptions[key] = propertyValidation.sanitizedValue;
          } else {
            errors.push(...propertyValidation.errors);
          }
          warnings.push(...propertyValidation.warnings);
        } else {
          warnings.push({
            type: SecurityWarningType.UNUSUAL_CHARACTERS,
            message: `Unknown route option property: ${key}`,
            recommendation: 'Remove unknown properties',
            riskLevel: 'low'
          });
        }
      }

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: errors.length === 0 ? sanitizedOptions : undefined,
        metadata: {
          validationTime,
          originalLength: Object.keys(options).length,
          sanitizedLength: Object.keys(sanitizedOptions).length,
          securityLevel: this.determineSecurityLevel(errors, warnings)
        }
      };

    } catch (error) {
      return this.createErrorResult(
        'Route options validation failed',
        startTime,
        options,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // ============================================================================
  // SEARCH AND QUERY VALIDATION METHODS
  // ============================================================================

  /**
   * Validate search query with XSS and injection protection
   * 
   * @param query Search query to validate
   * @returns Validation result
   */
  validateSearchQuery(query: string): ValidationResult {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Rate limiting check
      if (!this.checkRateLimit('searchQuery')) {
        return this.createBlockedResult('Rate limit exceeded', startTime, query);
      }

      // Basic input validation
      if (!this.isValidInput(query)) {
        errors.push({
          field: 'query',
          code: ValidationErrorCode.EMPTY_INPUT,
          message: 'Search query must be a non-empty string',
          severity: 'error',
          suggestions: ['Provide a search query']
        });
      }

      // Length validation
      if (query && query.length > SECURITY_LIMITS.MAX_SEARCH_QUERY_LENGTH) {
        errors.push({
          field: 'query',
          code: ValidationErrorCode.EXCESSIVE_LENGTH,
          message: `Search query exceeds maximum length of ${SECURITY_LIMITS.MAX_SEARCH_QUERY_LENGTH} characters`,
          severity: 'error',
          suggestions: ['Shorten the search query']
        });
      }

      // Security pattern analysis
      const securityAnalysis = this.analyzeSecurityPatterns(query);
      errors.push(...securityAnalysis.errors);
      warnings.push(...securityAnalysis.warnings);

      // Search-specific validation
      if (query) {
        // Check for regex DoS patterns
        if (this.containsRegexDoSPatterns(query)) {
          errors.push({
            field: 'query',
            code: ValidationErrorCode.MALICIOUS_PATTERN,
            message: 'Search query contains potentially dangerous patterns',
            severity: 'error',
            securityType: SecurityViolationType.REGEX_DOS,
            suggestions: ['Simplify the search query', 'Remove special characters']
          });
        }

        // Check for excessive wildcards or special characters
        const specialCharCount = (query.match(/[*%_\\]/g) || []).length;
        if (specialCharCount > 10) {
          warnings.push({
            type: SecurityWarningType.SUSPICIOUS_PATTERN,
            message: 'Search query contains many special characters',
            recommendation: 'Consider simplifying the query for better performance',
            riskLevel: 'medium'
          });
        }
      }

      // Sanitization
      let sanitizedValue: string | undefined;
      if (errors.length === 0 && query) {
        sanitizedValue = this.sanitizeSearchQuery(query);
      }

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue,
        metadata: {
          validationTime,
          originalLength: query?.length ?? 0,
          sanitizedLength: sanitizedValue?.length,
          securityLevel: this.determineSecurityLevel(errors, warnings)
        }
      };

    } catch (error) {
      return this.createErrorResult(
        'Search query validation failed',
        startTime,
        query,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate pagination parameters
   * 
   * @param params Pagination parameters
   * @returns Validation result
   */
  validatePaginationParams(params: PaginationParams): ValidationResult {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Rate limiting check
      if (!this.checkRateLimit('pagination')) {
        return this.createBlockedResult('Rate limit exceeded', startTime, params);
      }

      const sanitizedParams: PaginationParams = {};

      // Validate page number
      if (params.page !== undefined) {
        if (typeof params.page !== 'number' || !Number.isInteger(params.page) || params.page < 1) {
          errors.push({
            field: 'page',
            code: ValidationErrorCode.INVALID_PAGINATION,
            message: 'Page number must be a positive integer',
            severity: 'error',
            suggestions: ['Use page numbers starting from 1']
          });
        } else if (params.page > 10000) {
          warnings.push({
            type: SecurityWarningType.EXCESSIVE_LENGTH,
            message: 'Very high page number requested',
            recommendation: 'Consider using different pagination approach',
            riskLevel: 'low'
          });
          sanitizedParams.page = Math.min(params.page, 10000);
        } else {
          sanitizedParams.page = params.page;
        }
      }

      // Validate limit
      if (params.limit !== undefined) {
        if (typeof params.limit !== 'number' || !Number.isInteger(params.limit) || params.limit < 1) {
          errors.push({
            field: 'limit',
            code: ValidationErrorCode.INVALID_PAGINATION,
            message: 'Limit must be a positive integer',
            severity: 'error',
            suggestions: ['Use positive numbers for limit']
          });
        } else if (params.limit > SECURITY_LIMITS.MAX_PAGINATION_LIMIT) {
          errors.push({
            field: 'limit',
            code: ValidationErrorCode.EXCESSIVE_LENGTH,
            message: `Limit exceeds maximum of ${SECURITY_LIMITS.MAX_PAGINATION_LIMIT}`,
            severity: 'error',
            suggestions: [`Use limit up to ${SECURITY_LIMITS.MAX_PAGINATION_LIMIT}`]
          });
        } else {
          sanitizedParams.limit = params.limit;
        }
      }

      // Validate offset
      if (params.offset !== undefined) {
        if (typeof params.offset !== 'number' || !Number.isInteger(params.offset) || params.offset < 0) {
          errors.push({
            field: 'offset',
            code: ValidationErrorCode.INVALID_PAGINATION,
            message: 'Offset must be a non-negative integer',
            severity: 'error',
            suggestions: ['Use non-negative numbers for offset']
          });
        } else {
          sanitizedParams.offset = params.offset;
        }
      }

      // Validate sort parameters
      if (params.sortBy !== undefined) {
        const sortValidation = this.validateSortField(params.sortBy);
        if (!sortValidation.isValid) {
          errors.push(...sortValidation.errors);
        } else {
          sanitizedParams.sortBy = sortValidation.sanitizedValue;
        }
      }

      if (params.sortOrder !== undefined) {
        if (params.sortOrder !== 'asc' && params.sortOrder !== 'desc') {
          errors.push({
            field: 'sortOrder',
            code: ValidationErrorCode.INVALID_PAGINATION,
            message: 'Sort order must be "asc" or "desc"',
            severity: 'error',
            suggestions: ['Use "asc" for ascending or "desc" for descending']
          });
        } else {
          sanitizedParams.sortOrder = params.sortOrder;
        }
      }

      const endTime = performance.now();
      const validationTime = endTime - startTime;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: errors.length === 0 ? sanitizedParams : undefined,
        metadata: {
          validationTime,
          originalLength: Object.keys(params).length,
          sanitizedLength: Object.keys(sanitizedParams).length,
          securityLevel: this.determineSecurityLevel(errors, warnings)
        }
      };

    } catch (error) {
      return this.createErrorResult(
        'Pagination validation failed',
        startTime,
        params,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // ============================================================================
  // GENERAL UTILITY METHODS
  // ============================================================================

  /**
   * Sanitize string input by removing dangerous characters and normalizing
   * 
   * @param input Input string to sanitize
   * @returns Sanitized string
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Unicode normalization
    if (this.options.enableUnicodeNormalization) {
      sanitized = sanitized.normalize('NFKC');
    }

    // Remove control characters (except common ones like newline, tab)
    sanitized = sanitized.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');

    // Remove zero-width characters that could be used for attacks
    sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Ensure length doesn't exceed limits
    if (sanitized.length > this.options.maxStringLength) {
      sanitized = sanitized.substring(0, this.options.maxStringLength);
    }

    return sanitized;
  }

  /**
   * Check if input is valid Japanese text
   * 
   * @param text Text to validate
   * @returns True if valid Japanese text
   */
  isValidJapaneseText(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Check if text contains valid Japanese characters
    return JAPANESE_TEXT_PATTERNS.stationName.test(text);
  }

  /**
   * Check string length with security considerations
   * 
   * @param text Text to check
   * @param maxLength Maximum allowed length
   * @returns True if length is acceptable
   */
  checkStringLength(text: string, maxLength: number): boolean {
    if (!text || typeof text !== 'string') {
      return true; // Empty strings are valid
    }

    // Check both character count and byte length for Unicode safety
    const charLength = text.length;
    const byteLength = new TextEncoder().encode(text).length;

    return charLength <= maxLength && byteLength <= maxLength * 4; // UTF-8 max 4 bytes per char
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Check if input is valid (not null, undefined, or non-string for strings)
   */
  private isValidInput(input: any): boolean {
    return input !== null && input !== undefined && typeof input === 'string' && input.trim() !== '';
  }

  /**
   * Analyze input for security patterns
   */
  private analyzeSecurityPatterns(input: string): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!input) return { errors, warnings };

    // Check dangerous patterns
    for (const pattern of this.options.customPatterns.dangerous) {
      if (pattern.test(input)) {
        errors.push({
          field: 'input',
          code: ValidationErrorCode.INJECTION_ATTEMPT,
          message: 'Input contains potentially dangerous patterns',
          severity: 'error',
          securityType: SecurityViolationType.SQL_INJECTION,
          suggestions: ['Remove special characters and keywords', 'Use only alphanumeric characters']
        });
        break; // One dangerous pattern is enough
      }
    }

    // Check suspicious patterns
    for (const pattern of this.options.customPatterns.suspicious) {
      if (pattern.test(input)) {
        warnings.push({
          type: SecurityWarningType.SUSPICIOUS_PATTERN,
          message: 'Input contains suspicious patterns',
          recommendation: 'Review input for potential security issues',
          riskLevel: 'medium'
        });
        break; // One suspicious pattern is enough
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate Japanese text with proper Unicode handling
   */
  private validateJapaneseText(text: string): { isValid: boolean, errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!this.isValidJapaneseText(text)) {
      // Check if it's entirely ASCII (might be romanized)
      if (/^[a-zA-Z0-9\s\-()]+$/.test(text)) {
        warnings.push({
          type: SecurityWarningType.ENCODING_ISSUE,
          message: 'Input appears to be romanized - consider using Japanese characters',
          recommendation: 'Use Hiragana, Katakana, or Kanji for better results',
          riskLevel: 'low'
        });
      } else {
        errors.push({
          field: 'text',
          code: ValidationErrorCode.INVALID_CHARACTERS,
          message: 'Text contains invalid characters for Japanese station names',
          severity: 'error',
          suggestions: ['Use only Japanese characters (Hiragana, Katakana, Kanji)', 'Remove special symbols']
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate individual route segment
   */
  private validateRouteSegment(segment: RouteSegment, index: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate station ID
    if (typeof segment.stationId !== 'number' || !Number.isInteger(segment.stationId) || segment.stationId <= 0) {
      errors.push({
        field: `segments[${index}].stationId`,
        code: ValidationErrorCode.INVALID_STATION_ID,
        message: 'Route segment must have a valid station ID',
        severity: 'error',
        suggestions: ['Provide a positive integer station ID']
      });
    }

    // Validate station name
    if (!segment.stationName || typeof segment.stationName !== 'string') {
      errors.push({
        field: `segments[${index}].stationName`,
        code: ValidationErrorCode.INVALID_FORMAT,
        message: 'Route segment must have a valid station name',
        severity: 'error',
        suggestions: ['Provide a station name']
      });
    } else {
      const nameValidation = this.validateStationName(segment.stationName);
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors.map(err => ({
          ...err,
          field: `segments[${index}].stationName`
        })));
      }
    }

    // Validate line ID (if provided)
    if (segment.lineId !== undefined) {
      if (typeof segment.lineId !== 'number' || !Number.isInteger(segment.lineId) || segment.lineId <= 0) {
        errors.push({
          field: `segments[${index}].lineId`,
          code: ValidationErrorCode.INVALID_LINE_ID,
          message: 'Line ID must be a positive integer',
          severity: 'error',
          suggestions: ['Provide a valid line ID or omit this field']
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: errors.length === 0 ? {
        ...segment,
        stationName: this.sanitizeString(segment.stationName),
        stationKana: segment.stationKana ? this.sanitizeString(segment.stationKana) : segment.stationKana
      } : undefined,
      metadata: {
        validationTime: 0,
        originalLength: 1,
        sanitizedLength: errors.length === 0 ? 1 : 0,
        securityLevel: this.determineSecurityLevel(errors, warnings)
      }
    };
  }

  /**
   * Validate route connectivity (placeholder implementation)
   */
  private validateRouteConnectivity(segments: RouteSegment[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // This would implement actual connectivity validation
    // For now, just check for basic consistency
    if (segments.length > 1) {
      for (let i = 1; i < segments.length; i++) {
        const prev = segments[i - 1];
        const curr = segments[i];
        
        // Check if consecutive segments have line information when needed
        if (!prev.lineId && segments.length > 2) {
          warnings.push({
            type: SecurityWarningType.SUSPICIOUS_PATTERN,
            message: `Missing line information for segment ${i - 1}`,
            recommendation: 'Provide line IDs for better route validation',
            riskLevel: 'low'
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate route option property
   */
  private validateRouteOptionProperty(key: string, value: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (key) {
      case 'preferFaster':
      case 'preferCheaper':
      case 'avoidTransfers':
        if (typeof value !== 'boolean') {
          errors.push({
            field: key,
            code: ValidationErrorCode.INVALID_FORMAT,
            message: `${key} must be a boolean value`,
            severity: 'error',
            suggestions: ['Use true or false']
          });
        }
        break;

      case 'maxTransfers':
        if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
          errors.push({
            field: key,
            code: ValidationErrorCode.INVALID_FORMAT,
            message: 'maxTransfers must be a non-negative integer',
            severity: 'error',
            suggestions: ['Use a non-negative integer']
          });
        } else if (value > 20) {
          warnings.push({
            type: SecurityWarningType.EXCESSIVE_LENGTH,
            message: 'Very high number of transfers requested',
            recommendation: 'Consider reducing for better performance',
            riskLevel: 'low'
          });
        }
        break;

      case 'allowedLineTypes':
      case 'prohibitedLines':
        if (!Array.isArray(value)) {
          errors.push({
            field: key,
            code: ValidationErrorCode.INVALID_FORMAT,
            message: `${key} must be an array`,
            severity: 'error',
            suggestions: ['Provide an array of values']
          });
        } else if (value.length > this.options.maxArrayLength) {
          errors.push({
            field: key,
            code: ValidationErrorCode.EXCESSIVE_LENGTH,
            message: `${key} array is too long`,
            severity: 'error',
            suggestions: ['Reduce the number of items']
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedValue: errors.length === 0 ? value : undefined,
      metadata: {
        validationTime: 0,
        originalLength: Array.isArray(value) ? value.length : String(value).length,
        sanitizedLength: errors.length === 0 ? (Array.isArray(value) ? value.length : String(value).length) : 0,
        securityLevel: this.determineSecurityLevel(errors, warnings)
      }
    };
  }

  /**
   * Check for prototype pollution attempts
   */
  private checkPrototypePollution(obj: any): { isValid: boolean } {
    if (typeof obj !== 'object' || obj === null) {
      return { isValid: true };
    }

    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        return { isValid: false };
      }
      
      // Check nested objects
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nestedCheck = this.checkPrototypePollution(obj[key]);
        if (!nestedCheck.isValid) {
          return { isValid: false };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Check for regex DoS patterns
   */
  private containsRegexDoSPatterns(input: string): boolean {
    // Patterns that could cause regex DoS
    const dosPatterns = [
      /(\(.*\)){5,}/, // Excessive grouping
      /(\[.*\]){5,}/, // Excessive character classes
      /(.+){10,}/, // Excessive repetition
      /(\|.*){10,}/, // Excessive alternation
    ];

    return dosPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize search query
   */
  private sanitizeSearchQuery(query: string): string {
    let sanitized = this.sanitizeString(query);
    
    // Remove potentially dangerous search operators
    sanitized = sanitized.replace(/[<>]/g, '');
    
    // Limit wildcard usage
    sanitized = sanitized.replace(/\*{2,}/g, '*');
    sanitized = sanitized.replace(/%{2,}/g, '%');
    
    return sanitized;
  }

  /**
   * Validate sort field
   */
  private validateSortField(sortBy: string): ValidationResult {
    const errors: ValidationError[] = [];
    const allowedSortFields = ['id', 'name', 'kana', 'prefecture', 'ranking', 'type'];

    if (!sortBy || typeof sortBy !== 'string') {
      errors.push({
        field: 'sortBy',
        code: ValidationErrorCode.INVALID_FORMAT,
        message: 'Sort field must be a non-empty string',
        severity: 'error',
        suggestions: ['Provide a valid sort field name']
      });
    } else if (!allowedSortFields.includes(sortBy)) {
      errors.push({
        field: 'sortBy',
        code: ValidationErrorCode.INVALID_FORMAT,
        message: `Invalid sort field: ${sortBy}`,
        severity: 'error',
        suggestions: [`Use one of: ${allowedSortFields.join(', ')}`]
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      sanitizedValue: errors.length === 0 ? sortBy : undefined,
      metadata: {
        validationTime: 0,
        originalLength: sortBy?.length ?? 0,
        sanitizedLength: errors.length === 0 ? sortBy?.length ?? 0 : 0,
        securityLevel: errors.length === 0 ? SecurityLevel.SAFE : SecurityLevel.BLOCKED
      }
    };
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(operation: string): boolean {
    if (!this.options.rateLimiting.enabled) {
      return true;
    }

    const now = Date.now();
    const windowSize = this.options.rateLimiting.windowSizeMs;
    const maxRequests = this.options.rateLimiting.maxRequestsPerMinute;

    // Get or create tracking array for this operation
    if (!this.rateLimitTracker.has(operation)) {
      this.rateLimitTracker.set(operation, []);
    }

    const requests = this.rateLimitTracker.get(operation)!;

    // Clean old requests outside the window
    const cutoff = now - windowSize;
    while (requests.length > 0 && requests[0] < cutoff) {
      requests.shift();
    }

    // Check if we're over the limit
    if (requests.length >= maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    return true;
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(operation: string, time: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }

    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(time);

    // Keep only recent metrics (last 100)
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Determine security level based on errors and warnings
   */
  private determineSecurityLevel(errors: ValidationError[], warnings: ValidationWarning[]): SecurityLevel {
    // Check for security violations
    const hasSecurityViolation = errors.some(error => error.securityType);
    if (hasSecurityViolation) {
      return SecurityLevel.BLOCKED;
    }

    // Check for high-risk warnings
    const hasHighRiskWarning = warnings.some(warning => warning.riskLevel === 'high');
    if (hasHighRiskWarning) {
      return SecurityLevel.SUSPICIOUS;
    }

    // Check for medium-risk warnings
    const hasMediumRiskWarning = warnings.some(warning => warning.riskLevel === 'medium');
    if (hasMediumRiskWarning) {
      return SecurityLevel.MONITORED;
    }

    // Check for any errors
    if (errors.length > 0) {
      return SecurityLevel.MONITORED;
    }

    return SecurityLevel.SAFE;
  }

  /**
   * Create validation result helper
   */
  private createValidationResult(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    startTime: number,
    originalValue: any
  ): ValidationResult {
    const endTime = performance.now();
    const validationTime = endTime - startTime;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        validationTime,
        originalLength: this.getValueLength(originalValue),
        securityLevel: this.determineSecurityLevel(errors, warnings)
      }
    };
  }

  /**
   * Create blocked result for rate limiting
   */
  private createBlockedResult(message: string, startTime: number, originalValue: any): ValidationResult {
    const endTime = performance.now();
    const validationTime = endTime - startTime;

    return {
      isValid: false,
      errors: [{
        field: 'global',
        code: ValidationErrorCode.INJECTION_ATTEMPT,
        message,
        severity: 'error',
        securityType: SecurityViolationType.COMMAND_INJECTION,
        suggestions: ['Wait before retrying', 'Reduce request frequency']
      }],
      warnings: [],
      metadata: {
        validationTime,
        originalLength: this.getValueLength(originalValue),
        securityLevel: SecurityLevel.BLOCKED
      }
    };
  }

  /**
   * Create error result for internal errors
   */
  private createErrorResult(message: string, startTime: number, originalValue: any, details?: string): ValidationResult {
    const endTime = performance.now();
    const validationTime = endTime - startTime;

    return {
      isValid: false,
      errors: [{
        field: 'validation',
        code: ValidationErrorCode.INVALID_FORMAT,
        message,
        severity: 'error',
        suggestions: ['Check input format', 'Try again later']
      }],
      warnings: [],
      metadata: {
        validationTime,
        originalLength: this.getValueLength(originalValue),
        securityLevel: SecurityLevel.BLOCKED
      }
    };
  }

  /**
   * Get value length helper
   */
  private getValueLength(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') return value.length;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object') return Object.keys(value).length;
    return String(value).length;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<string, { count: number, avgTime: number, maxTime: number }> {
    const stats: Record<string, { count: number, avgTime: number, maxTime: number }> = {};

    for (const [operation, times] of this.performanceMetrics.entries()) {
      if (times.length > 0) {
        stats[operation] = {
          count: times.length,
          avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          maxTime: Math.max(...times)
        };
      }
    }

    return stats;
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceStats(): void {
    this.performanceMetrics.clear();
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): Record<string, { requests: number, remaining: number }> {
    const status: Record<string, { requests: number, remaining: number }> = {};
    const now = Date.now();
    const windowSize = this.options.rateLimiting.windowSizeMs;
    const maxRequests = this.options.rateLimiting.maxRequestsPerMinute;

    for (const [operation, requests] of this.rateLimitTracker.entries()) {
      // Clean old requests
      const cutoff = now - windowSize;
      const currentRequests = requests.filter(time => time > cutoff);
      
      status[operation] = {
        requests: currentRequests.length,
        remaining: Math.max(0, maxRequests - currentRequests.length)
      };
    }

    return status;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default input validator instance
 * 
 * @param options Validator configuration options
 * @returns InputValidator instance
 */
export function createInputValidator(options?: ValidatorOptions): InputValidator {
  return new InputValidator(options);
}

/**
 * Create a strict input validator for production use
 * 
 * @param options Additional validator options
 * @returns Strict InputValidator instance
 */
export function createStrictInputValidator(options?: ValidatorOptions): InputValidator {
  return new InputValidator({
    ...options,
    maxStringLength: 500,
    maxArrayLength: 100,
    securityLevelThreshold: SecurityLevel.MONITORED,
    enableJapaneseValidation: true,
    enableUnicodeNormalization: true,
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 60,
      windowSizeMs: 60000,
      ...options?.rateLimiting
    }
  });
}

/**
 * Create a permissive input validator for development
 * 
 * @param options Additional validator options
 * @returns Permissive InputValidator instance
 */
export function createPermissiveInputValidator(options?: ValidatorOptions): InputValidator {
  return new InputValidator({
    ...options,
    maxStringLength: 2000,
    maxArrayLength: 1000,
    securityLevelThreshold: SecurityLevel.SUSPICIOUS,
    rateLimiting: {
      enabled: false,
      maxRequestsPerMinute: 1000,
      windowSizeMs: 60000,
      ...options?.rateLimiting
    }
  });
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidatorOptions,
  RouteValidationOptions,
  PaginationParams
};

export {
  SecurityLevel,
  SecurityViolationType,
  SecurityWarningType,
  ValidationErrorCode
};