/**
 * Error Management System for Farert Frontend API Layer SDK
 * 
 * Comprehensive error handling system with retry logic, exponential backoff,
 * user-friendly messaging, and WebAssembly-specific error detection and recovery.
 * 
 * This system provides intelligent error handling across the entire SDK:
 * - Automatic retry with exponential backoff
 * - WebAssembly-specific error detection and recovery
 * - User-friendly error message formatting with actionable suggestions
 * - Svelte-reactive error state management
 * - Context-aware error categorization and handling
 * - Production-ready error reporting and analytics
 * 
 * Features:
 * - Multi-level error categorization (WASM, Network, Data, User, System)
 * - Intelligent retry strategies with circuit breaker pattern
 * - Context-aware error recovery mechanisms
 * - User-friendly error messages with suggestions in Japanese and English
 * - Svelte-reactive error state with automatic UI updates
 * - Error analytics and reporting for production monitoring
 * - WebAssembly memory and module error recovery
 * 
 * @file Error Manager Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-004: Create error management system with retry logic
 *   - Implement ErrorManager class with exponential backoff
 *   - Create user-friendly error message formatting
 *   - Add WebAssembly error detection and recovery
 *   - Build upon existing CLI error patterns from types.ts
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

// Import CLI error types for compatibility
import type {
  CLIError,
  CLIErrorCode,
  WebAssemblyLoadError,
  DatabaseError,
  InputValidationError,
  RouteConstructionError,
  FareCalculationError,
  RouteErrorCode,
  ErrorMessages
} from '../../cli/types';

// Import SDK core types
import type {
  FarertSDKError,
  FarertSDKErrorCode,
  ErrorRecoveryStrategy
} from '../types/core';

// ============================================================================
// ERROR MANAGER INTERFACES
// ============================================================================

/**
 * Error severity levels for prioritization and handling
 */
export enum ErrorSeverity {
  /** Info-level errors (warnings, notices) */
  INFO = 'info',
  /** Warning-level errors (recoverable issues) */
  WARNING = 'warning', 
  /** Error-level (operation failures) */
  ERROR = 'error',
  /** Critical errors (system failures) */
  CRITICAL = 'critical',
  /** Fatal errors (unrecoverable) */
  FATAL = 'fatal'
}

/**
 * Error categories for specialized handling
 */
export enum ErrorCategory {
  /** WebAssembly module loading and runtime errors */
  WEBASSEMBLY = 'webassembly',
  /** Network and communication errors */
  NETWORK = 'network',
  /** Data validation and format errors */
  DATA_VALIDATION = 'data_validation',
  /** User input and interaction errors */
  USER_INPUT = 'user_input',
  /** System and environment errors */
  SYSTEM = 'system',
  /** Route construction and calculation errors */
  ROUTE_CALCULATION = 'route_calculation',
  /** Cache and storage errors */
  CACHE = 'cache',
  /** Database operation errors */
  DATABASE = 'database'
}

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  
  /** Initial delay between retries (milliseconds) */
  initialDelay: number;
  
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier: number;
  
  /** Maximum delay between retries (milliseconds) */
  maxDelay: number;
  
  /** Jitter factor to prevent thundering herd (0-1) */
  jitter: number;
  
  /** Specific error codes that should be retried */
  retryableErrors: Set<string>;
  
  /** Specific error codes that should never be retried */
  nonRetryableErrors: Set<string>;
  
  /** Custom retry condition function */
  customRetryCondition?: (error: ManagedError) => boolean;
}

/**
 * Error context information
 */
export interface ErrorContext {
  /** Operation that was being performed */
  operation: string;
  
  /** User-facing operation description */
  operationDescription: string;
  
  /** Function or method where error occurred */
  source: string;
  
  /** Additional context data */
  metadata: Record<string, any>;
  
  /** User session information */
  session?: {
    sessionId: string;
    userId?: string;
    userAgent?: string;
    timestamp: number;
  };
  
  /** Technical stack trace information */
  stackTrace?: string;
  
  /** Related error IDs for debugging */
  relatedErrors?: string[];
}

/**
 * Error recovery action
 */
export interface ErrorRecoveryAction {
  /** Action identifier */
  id: string;
  
  /** Human-readable action description */
  description: string;
  
  /** Action function to execute */
  action: () => Promise<void>;
  
  /** Whether this action can be retried */
  retryable: boolean;
  
  /** Expected recovery time (milliseconds) */
  estimatedTime?: number;
  
  /** Success probability (0-1) */
  successProbability?: number;
}

/**
 * User-friendly error suggestion
 */
export interface ErrorSuggestion {
  /** Suggestion ID */
  id: string;
  
  /** User-facing suggestion text (Japanese) */
  messageJa: string;
  
  /** User-facing suggestion text (English) */
  messageEn: string;
  
  /** Action the user can take */
  action?: 'retry' | 'reload' | 'check_input' | 'contact_support' | 'wait';
  
  /** Priority level for display order */
  priority: number;
  
  /** Icon identifier for UI */
  icon?: string;
  
  /** Additional resources or links */
  resources?: Array<{
    title: string;
    url: string;
    type: 'documentation' | 'support' | 'tutorial';
  }>;
}

/**
 * Comprehensive managed error class
 */
export class ManagedError extends Error {
  /** Unique error identifier */
  public readonly id: string;
  
  /** Error severity level */
  public readonly severity: ErrorSeverity;
  
  /** Error category */
  public readonly category: ErrorCategory;
  
  /** Original error code (CLI, SDK, or custom) */
  public readonly code: string;
  
  /** Error context information */
  public readonly context: ErrorContext;
  
  /** Whether this error can be retried */
  public readonly retryable: boolean;
  
  /** Number of retry attempts made */
  public retryCount: number;
  
  /** Error occurrence timestamp */
  public readonly timestamp: number;
  
  /** User-friendly error message (Japanese) */
  public readonly userMessageJa: string;
  
  /** User-friendly error message (English) */
  public readonly userMessageEn: string;
  
  /** Suggested actions for recovery */
  public readonly suggestions: ErrorSuggestion[];
  
  /** Recovery actions available */
  public readonly recoveryActions: ErrorRecoveryAction[];
  
  /** Original error instance */
  public readonly originalError?: Error;
  
  constructor(config: {
    message: string;
    severity: ErrorSeverity;
    category: ErrorCategory;
    code: string;
    context: ErrorContext;
    retryable?: boolean;
    userMessageJa: string;
    userMessageEn: string;
    suggestions?: ErrorSuggestion[];
    recoveryActions?: ErrorRecoveryAction[];
    originalError?: Error;
  }) {
    super(config.message);
    
    this.name = 'ManagedError';
    this.id = this.generateErrorId();
    this.severity = config.severity;
    this.category = config.category;
    this.code = config.code;
    this.context = config.context;
    this.retryable = config.retryable ?? false;
    this.retryCount = 0;
    this.timestamp = Date.now();
    this.userMessageJa = config.userMessageJa;
    this.userMessageEn = config.userMessageEn;
    this.suggestions = config.suggestions ?? [];
    this.recoveryActions = config.recoveryActions ?? [];
    this.originalError = config.originalError;
  }
  
  /**
   * Generate unique error identifier
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get user-friendly message in specified language
   */
  public getUserMessage(locale: 'ja' | 'en' = 'ja'): string {
    return locale === 'ja' ? this.userMessageJa : this.userMessageEn;
  }
  
  /**
   * Get suggestions for specified language
   */
  public getSuggestions(locale: 'ja' | 'en' = 'ja'): string[] {
    return this.suggestions
      .sort((a, b) => a.priority - b.priority)
      .map(suggestion => locale === 'ja' ? suggestion.messageJa : suggestion.messageEn);
  }
  
  /**
   * Convert to JSON for logging/reporting
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      message: this.message,
      severity: this.severity,
      category: this.category,
      code: this.code,
      context: this.context,
      retryable: this.retryable,
      retryCount: this.retryCount,
      timestamp: this.timestamp,
      userMessageJa: this.userMessageJa,
      userMessageEn: this.userMessageEn,
      suggestions: this.suggestions,
      recoveryActions: this.recoveryActions.map(action => ({
        id: action.id,
        description: action.description,
        retryable: action.retryable,
        estimatedTime: action.estimatedTime,
        successProbability: action.successProbability
      })),
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

/**
 * Error manager configuration
 */
export interface ErrorManagerConfig {
  /** Default retry strategy */
  defaultRetryStrategy?: Partial<RetryStrategy>;
  
  /** Category-specific retry strategies */
  categoryRetryStrategies?: Partial<Record<ErrorCategory, Partial<RetryStrategy>>>;
  
  /** Enable automatic error reporting */
  enableErrorReporting?: boolean;
  
  /** Error reporting endpoint */
  reportingEndpoint?: string;
  
  /** Enable Svelte reactivity */
  svelteReactive?: boolean;
  
  /** Maximum errors to keep in memory */
  maxErrorHistory?: number;
  
  /** Enable circuit breaker pattern */
  enableCircuitBreaker?: boolean;
  
  /** Circuit breaker configuration */
  circuitBreakerConfig?: {
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxCalls: number;
  };
  
  /** Default locale for error messages */
  defaultLocale?: 'ja' | 'en';
  
  /** Enable WebAssembly-specific error handling */
  enableWasmErrorHandling?: boolean;
  
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
}

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit breaker information
 */
export interface CircuitBreakerInfo {
  /** Current state */
  state: CircuitBreakerState;
  
  /** Failure count */
  failureCount: number;
  
  /** Last failure time */
  lastFailureTime?: number;
  
  /** Next retry time (for OPEN state) */
  nextRetryTime?: number;
  
  /** Success count in HALF_OPEN state */
  halfOpenSuccessCount: number;
}

/**
 * Error manager statistics
 */
export interface ErrorManagerStats {
  /** Total errors handled */
  totalErrors: number;
  
  /** Errors by severity */
  errorsBySeverity: Record<ErrorSeverity, number>;
  
  /** Errors by category */
  errorsByCategory: Record<ErrorCategory, number>;
  
  /** Retry statistics */
  retryStats: {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
    averageRetryCount: number;
  };
  
  /** Circuit breaker stats */
  circuitBreakerStats: Record<string, CircuitBreakerInfo>;
  
  /** Performance metrics */
  performance: {
    averageHandlingTime: number;
    averageRecoveryTime: number;
    errorRate: number; // errors per minute
  };
  
  /** Time range for statistics */
  timeRange: {
    start: number;
    end: number;
  };
}

// ============================================================================
// ERROR MANAGER IMPLEMENTATION
// ============================================================================

/**
 * Central error management system for the Farert SDK
 * 
 * Provides comprehensive error handling with retry logic, user-friendly messaging,
 * and WebAssembly-specific error recovery mechanisms.
 * 
 * @class ErrorManager
 */
export class ErrorManager {
  // Configuration
  private readonly config: Required<ErrorManagerConfig>;
  
  // Error history and tracking
  private readonly errorHistory: ManagedError[] = [];
  private readonly errorCount = new Map<string, number>();
  
  // Circuit breaker state by operation
  private readonly circuitBreakers = new Map<string, CircuitBreakerInfo>();
  
  // Retry strategies by category
  private readonly retryStrategies: Record<ErrorCategory, RetryStrategy>;
  
  // Statistics tracking
  private readonly stats: ErrorManagerStats;
  
  // Event listeners for Svelte reactivity
  private readonly svelteSubscribers = new Set<() => void>();
  private readonly errorListeners = new Set<(error: ManagedError) => void>();
  
  // Performance monitoring
  private readonly performanceTimers = new Map<string, number>();
  
  constructor(config: ErrorManagerConfig = {}) {
    // Merge configuration with defaults
    this.config = {
      defaultRetryStrategy: {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        maxDelay: 30000,
        jitter: 0.1,
        retryableErrors: new Set([
          'WASM_LOAD_FAILED',
          'NETWORK_ERROR', 
          'CALCULATION_FAILED',
          'DB_CONNECTION_FAILED'
        ]),
        nonRetryableErrors: new Set([
          'INVALID_STATION_NAME',
          'INVALID_LINE_NAME',
          'MALFORMED_INPUT'
        ]),
        ...config.defaultRetryStrategy
      },
      categoryRetryStrategies: config.categoryRetryStrategies ?? {},
      enableErrorReporting: config.enableErrorReporting ?? false,
      reportingEndpoint: config.reportingEndpoint ?? '/api/errors',
      svelteReactive: config.svelteReactive ?? true,
      maxErrorHistory: config.maxErrorHistory ?? 1000,
      enableCircuitBreaker: config.enableCircuitBreaker ?? true,
      circuitBreakerConfig: {
        failureThreshold: 5,
        recoveryTimeout: 60000, // 1 minute
        halfOpenMaxCalls: 3,
        ...config.circuitBreakerConfig
      },
      defaultLocale: config.defaultLocale ?? 'ja',
      enableWasmErrorHandling: config.enableWasmErrorHandling ?? true,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true
    };
    
    // Initialize retry strategies
    this.retryStrategies = this.initializeRetryStrategies();
    
    // Initialize statistics
    this.stats = this.initializeStats();
  }
  
  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================
  
  /**
   * Handle an error with automatic retry and recovery
   * 
   * @param error Original error
   * @param context Error context
   * @returns Promise resolving to handled error
   */
  async handleError(error: Error, context: ErrorContext): Promise<ManagedError> {
    const startTime = this.config.enablePerformanceMonitoring ? performance.now() : 0;
    
    try {
      // Convert to managed error
      const managedError = this.convertToManagedError(error, context);
      
      // Record error
      this.recordError(managedError);
      
      // Check circuit breaker
      if (this.config.enableCircuitBreaker && this.isCircuitOpen(context.operation)) {
        managedError.suggestions.push({
          id: 'circuit_open',
          messageJa: 'システムが一時的に利用できません。しばらく待ってから再試行してください。',
          messageEn: 'System temporarily unavailable. Please wait and try again later.',
          action: 'wait',
          priority: 1,
          icon: 'clock'
        });
        
        this.notifySubscribers();
        return managedError;
      }
      
      // Attempt recovery if retryable
      if (managedError.retryable && this.shouldRetry(managedError)) {
        try {
          await this.attemptRecovery(managedError);
        } catch (recoveryError) {
          // Recovery failed, update circuit breaker
          this.updateCircuitBreaker(context.operation, false);
          managedError.suggestions.push({
            id: 'recovery_failed',
            messageJa: '自動復旧に失敗しました。手動での対応が必要です。',
            messageEn: 'Automatic recovery failed. Manual intervention required.',
            action: 'contact_support',
            priority: 2,
            icon: 'alert'
          });
        }
      }
      
      // Record performance metrics
      if (this.config.enablePerformanceMonitoring) {
        const handlingTime = performance.now() - startTime;
        this.recordPerformanceMetric('error_handling', handlingTime);
      }
      
      // Notify subscribers
      this.notifySubscribers();
      this.notifyErrorListeners(managedError);
      
      // Report error if enabled
      if (this.config.enableErrorReporting) {
        this.reportError(managedError).catch(console.error);
      }
      
      return managedError;
    } catch (handlingError) {
      // Error in error handling - create a fallback error
      console.error('Error in error handling:', handlingError);
      
      return new ManagedError({
        message: 'Error handling system failure',
        severity: ErrorSeverity.CRITICAL,
        category: ErrorCategory.SYSTEM,
        code: 'ERROR_HANDLER_FAILURE',
        context,
        userMessageJa: 'エラー処理システムに問題が発生しました。',
        userMessageEn: 'Error handling system encountered a problem.',
        suggestions: [{
          id: 'system_error',
          messageJa: 'ページを再読み込みしてください。問題が続く場合はサポートにお問い合わせください。',
          messageEn: 'Please reload the page. Contact support if the problem persists.',
          action: 'reload',
          priority: 1,
          icon: 'refresh'
        }],
        originalError: error
      });
    }
  }
  
  /**
   * Execute an operation with automatic error handling and retry
   * 
   * @param operation Function to execute
   * @param context Operation context
   * @returns Promise with operation result or throws ManagedError
   */
  async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext
  ): Promise<T> {
    for (let attempt = 0; attempt < this.getRetryStrategy(ErrorCategory.SYSTEM).maxAttempts; attempt++) {
      try {
        // Check circuit breaker
        if (this.config.enableCircuitBreaker && this.isCircuitOpen(context.operation)) {
          throw new Error(`Circuit breaker is OPEN for operation: ${context.operation}`);
        }
        
        const result = await operation();
        
        // Success - update circuit breaker
        if (this.config.enableCircuitBreaker) {
          this.updateCircuitBreaker(context.operation, true);
        }
        
        return result;
      } catch (error) {
        const managedError = await this.handleError(error as Error, {
          ...context,
          metadata: {
            ...context.metadata,
            attempt: attempt + 1,
            maxAttempts: this.getRetryStrategy(ErrorCategory.SYSTEM).maxAttempts
          }
        });
        
        // If this is the last attempt or error is not retryable, throw
        if (attempt === this.getRetryStrategy(ErrorCategory.SYSTEM).maxAttempts - 1 || !managedError.retryable) {
          throw managedError;
        }
        
        // Wait before retry
        const strategy = this.getRetryStrategy(this.categorizeError(error as Error));
        const delay = this.calculateRetryDelay(attempt, strategy);
        await this.sleep(delay);
      }
    }
    
    // This should never be reached
    throw new Error('Unexpected end of retry loop');
  }
  
  /**
   * Get current error statistics
   */
  getStats(): ErrorManagerStats {
    this.updateStats();
    return JSON.parse(JSON.stringify(this.stats));
  }
  
  /**
   * Get recent errors
   * 
   * @param limit Maximum number of errors to return
   * @returns Array of recent errors
   */
  getRecentErrors(limit = 50): ManagedError[] {
    return this.errorHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory.length = 0;
    this.errorCount.clear();
    this.updateStats();
    this.notifySubscribers();
  }
  
  /**
   * Add error event listener
   * 
   * @param listener Function to call when errors occur
   * @returns Unsubscribe function
   */
  onError(listener: (error: ManagedError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }
  
  /**
   * Subscribe to error manager state changes (Svelte-compatible)
   * 
   * @param subscriber Function to call on state changes
   * @returns Unsubscribe function
   */
  subscribe(subscriber: () => void): () => void {
    if (!this.config.svelteReactive) {
      return () => {}; // No-op unsubscribe
    }
    
    this.svelteSubscribers.add(subscriber);
    subscriber(); // Call immediately
    
    return () => this.svelteSubscribers.delete(subscriber);
  }
  
  // ============================================================================
  // WebAssembly-SPECIFIC ERROR HANDLING
  // ============================================================================
  
  /**
   * Handle WebAssembly-specific errors with specialized recovery
   * 
   * @param error WebAssembly error
   * @param context Error context
   * @returns Promise resolving to managed error with WASM-specific handling
   */
  async handleWebAssemblyError(error: Error, context: ErrorContext): Promise<ManagedError> {
    if (!this.config.enableWasmErrorHandling) {
      return this.handleError(error, context);
    }
    
    // Detect WebAssembly error types
    const wasmErrorType = this.detectWebAssemblyErrorType(error);
    
    // Create WebAssembly-specific managed error
    const managedError = new ManagedError({
      message: error.message,
      severity: this.getWebAssemblyErrorSeverity(wasmErrorType),
      category: ErrorCategory.WEBASSEMBLY,
      code: wasmErrorType,
      context: {
        ...context,
        metadata: {
          ...context.metadata,
          wasmErrorType,
          wasmMemoryInfo: this.getWebAssemblyMemoryInfo(),
          wasmModuleInfo: this.getWebAssemblyModuleInfo()
        }
      },
      retryable: this.isWebAssemblyErrorRetryable(wasmErrorType),
      userMessageJa: this.getWebAssemblyUserMessage(wasmErrorType, 'ja'),
      userMessageEn: this.getWebAssemblyUserMessage(wasmErrorType, 'en'),
      suggestions: this.getWebAssemblyErrorSuggestions(wasmErrorType),
      recoveryActions: this.getWebAssemblyRecoveryActions(wasmErrorType),
      originalError: error
    });
    
    // Record and handle error
    return this.handleError(managedError, context);
  }
  
  /**
   * Detect WebAssembly error type
   */
  private detectWebAssemblyErrorType(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    if (message.includes('out of memory') || message.includes('memory')) {
      return 'WASM_MEMORY_ERROR';
    }
    
    if (message.includes('module') && (message.includes('invalid') || message.includes('corrupted'))) {
      return 'WASM_MODULE_INVALID';
    }
    
    if (message.includes('instantiation') || message.includes('compilation')) {
      return 'WASM_INSTANTIATION_FAILED';
    }
    
    if (message.includes('import') || message.includes('export')) {
      return 'WASM_IMPORT_ERROR';
    }
    
    if (message.includes('function') && message.includes('undefined')) {
      return 'WASM_FUNCTION_NOT_FOUND';
    }
    
    if (stack.includes('wasm') || message.includes('webassembly')) {
      return 'WASM_RUNTIME_ERROR';
    }
    
    return 'WASM_UNKNOWN_ERROR';
  }
  
  /**
   * Get WebAssembly error severity
   */
  private getWebAssemblyErrorSeverity(errorType: string): ErrorSeverity {
    switch (errorType) {
      case 'WASM_MEMORY_ERROR':
      case 'WASM_MODULE_INVALID':
        return ErrorSeverity.CRITICAL;
      case 'WASM_INSTANTIATION_FAILED':
        return ErrorSeverity.ERROR;
      case 'WASM_IMPORT_ERROR':
      case 'WASM_FUNCTION_NOT_FOUND':
        return ErrorSeverity.ERROR;
      case 'WASM_RUNTIME_ERROR':
        return ErrorSeverity.WARNING;
      default:
        return ErrorSeverity.ERROR;
    }
  }
  
  /**
   * Check if WebAssembly error is retryable
   */
  private isWebAssemblyErrorRetryable(errorType: string): boolean {
    switch (errorType) {
      case 'WASM_MEMORY_ERROR':
      case 'WASM_RUNTIME_ERROR':
        return true;
      case 'WASM_MODULE_INVALID':
      case 'WASM_INSTANTIATION_FAILED':
      case 'WASM_IMPORT_ERROR':
      case 'WASM_FUNCTION_NOT_FOUND':
        return false;
      default:
        return false;
    }
  }
  
  /**
   * Get WebAssembly user message
   */
  private getWebAssemblyUserMessage(errorType: string, locale: 'ja' | 'en'): string {
    const messages = {
      'WASM_MEMORY_ERROR': {
        ja: 'メモリ不足のため処理を完了できませんでした。',
        en: 'Processing could not be completed due to insufficient memory.'
      },
      'WASM_MODULE_INVALID': {
        ja: 'アプリケーションファイルが破損している可能性があります。',
        en: 'Application files may be corrupted.'
      },
      'WASM_INSTANTIATION_FAILED': {
        ja: 'アプリケーションの初期化に失敗しました。',
        en: 'Application initialization failed.'
      },
      'WASM_RUNTIME_ERROR': {
        ja: '実行中にエラーが発生しました。',
        en: 'A runtime error occurred.'
      },
      'WASM_UNKNOWN_ERROR': {
        ja: 'WebAssemblyでエラーが発生しました。',
        en: 'A WebAssembly error occurred.'
      }
    };
    
    return messages[errorType as keyof typeof messages]?.[locale] || 
           messages['WASM_UNKNOWN_ERROR'][locale];
  }
  
  /**
   * Get WebAssembly error suggestions
   */
  private getWebAssemblyErrorSuggestions(errorType: string): ErrorSuggestion[] {
    const suggestions: Record<string, ErrorSuggestion[]> = {
      'WASM_MEMORY_ERROR': [{
        id: 'memory_refresh',
        messageJa: 'ページを再読み込みしてメモリをクリアしてください。',
        messageEn: 'Refresh the page to clear memory.',
        action: 'reload',
        priority: 1,
        icon: 'refresh'
      }, {
        id: 'close_tabs',
        messageJa: '他のタブを閉じてメモリを確保してください。',
        messageEn: 'Close other tabs to free up memory.',
        action: 'check_input',
        priority: 2,
        icon: 'tabs'
      }],
      'WASM_MODULE_INVALID': [{
        id: 'hard_refresh',
        messageJa: 'Ctrl+F5でページを強制再読み込みしてください。',
        messageEn: 'Press Ctrl+F5 to hard refresh the page.',
        action: 'reload',
        priority: 1,
        icon: 'refresh'
      }, {
        id: 'clear_cache',
        messageJa: 'ブラウザキャッシュをクリアしてください。',
        messageEn: 'Clear your browser cache.',
        action: 'check_input',
        priority: 2,
        icon: 'settings'
      }],
      'WASM_RUNTIME_ERROR': [{
        id: 'retry_operation',
        messageJa: '操作を再試行してください。',
        messageEn: 'Please retry the operation.',
        action: 'retry',
        priority: 1,
        icon: 'retry'
      }]
    };
    
    return suggestions[errorType] || [{
      id: 'general_wasm_error',
      messageJa: 'ページを再読み込みしてください。',
      messageEn: 'Please reload the page.',
      action: 'reload',
      priority: 1,
      icon: 'refresh'
    }];
  }
  
  /**
   * Get WebAssembly recovery actions
   */
  private getWebAssemblyRecoveryActions(errorType: string): ErrorRecoveryAction[] {
    const actions: Record<string, ErrorRecoveryAction[]> = {
      'WASM_MEMORY_ERROR': [{
        id: 'gc_collect',
        description: 'Force garbage collection',
        action: async () => {
          if ('gc' in window && typeof (window as any).gc === 'function') {
            (window as any).gc();
          }
        },
        retryable: true,
        estimatedTime: 100,
        successProbability: 0.3
      }],
      'WASM_RUNTIME_ERROR': [{
        id: 'reset_wasm_state',
        description: 'Reset WebAssembly module state',
        action: async () => {
          // Implementation would depend on specific WASM module
          // This is a placeholder for state reset logic
        },
        retryable: true,
        estimatedTime: 1000,
        successProbability: 0.7
      }]
    };
    
    return actions[errorType] || [];
  }
  
  /**
   * Get WebAssembly memory information
   */
  private getWebAssemblyMemoryInfo(): Record<string, any> {
    try {
      if ('performance' in window && 'memory' in (window as any).performance) {
        const memory = (window as any).performance.memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          memoryPressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit
        };
      }
    } catch (error) {
      console.warn('Could not get memory info:', error);
    }
    
    return {};
  }
  
  /**
   * Get WebAssembly module information
   */
  private getWebAssemblyModuleInfo(): Record<string, any> {
    return {
      webAssemblySupported: 'WebAssembly' in window,
      wasmStreamingSupported: 'instantiateStreaming' in WebAssembly,
      wasmThreadsSupported: typeof SharedArrayBuffer !== 'undefined',
      userAgent: navigator.userAgent
    };
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  /**
   * Convert generic error to managed error
   */
  private convertToManagedError(error: Error, context: ErrorContext): ManagedError {
    // Check if already a managed error
    if (error instanceof ManagedError) {
      return error;
    }
    
    // Determine error category and code
    const category = this.categorizeError(error);
    const code = this.extractErrorCode(error);
    const severity = this.determineSeverity(error, category);
    
    // Generate user-friendly messages
    const userMessages = this.generateUserMessages(error, category, code);
    
    // Generate suggestions
    const suggestions = this.generateErrorSuggestions(error, category, code);
    
    // Generate recovery actions
    const recoveryActions = this.generateRecoveryActions(error, category);
    
    return new ManagedError({
      message: error.message,
      severity,
      category,
      code,
      context,
      retryable: this.isErrorRetryable(error, category),
      userMessageJa: userMessages.ja,
      userMessageEn: userMessages.en,
      suggestions,
      recoveryActions,
      originalError: error
    });
  }
  
  /**
   * Categorize error based on type and content
   */
  private categorizeError(error: Error): ErrorCategory {
    // Check error types
    if (error instanceof WebAssemblyLoadError || error.name === 'WebAssemblyLoadError') {
      return ErrorCategory.WEBASSEMBLY;
    }
    
    if (error instanceof DatabaseError || error.name === 'DatabaseError') {
      return ErrorCategory.DATABASE;
    }
    
    if (error instanceof InputValidationError || error.name === 'InputValidationError') {
      return ErrorCategory.USER_INPUT;
    }
    
    if (error instanceof RouteConstructionError || error instanceof FareCalculationError) {
      return ErrorCategory.ROUTE_CALCULATION;
    }
    
    // Check error messages for patterns
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('format')) {
      return ErrorCategory.DATA_VALIDATION;
    }
    
    if (message.includes('cache') || message.includes('storage')) {
      return ErrorCategory.CACHE;
    }
    
    if (message.includes('wasm') || message.includes('webassembly') || message.includes('module')) {
      return ErrorCategory.WEBASSEMBLY;
    }
    
    return ErrorCategory.SYSTEM;
  }
  
  /**
   * Extract error code from error
   */
  private extractErrorCode(error: Error): string {
    // Check for existing error codes
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }
    
    if ('name' in error && error.name !== 'Error') {
      return error.name;
    }
    
    // Generate code based on error type
    if (error instanceof TypeError) {
      return 'TYPE_ERROR';
    }
    
    if (error instanceof ReferenceError) {
      return 'REFERENCE_ERROR';
    }
    
    if (error instanceof RangeError) {
      return 'RANGE_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // High severity categories
    if (category === ErrorCategory.WEBASSEMBLY || category === ErrorCategory.SYSTEM) {
      return ErrorSeverity.ERROR;
    }
    
    // Medium severity categories
    if (category === ErrorCategory.DATABASE || category === ErrorCategory.ROUTE_CALCULATION) {
      return ErrorSeverity.WARNING;
    }
    
    // Lower severity categories
    if (category === ErrorCategory.USER_INPUT || category === ErrorCategory.DATA_VALIDATION) {
      return ErrorSeverity.INFO;
    }
    
    return ErrorSeverity.WARNING;
  }
  
  /**
   * Generate user-friendly messages
   */
  private generateUserMessages(error: Error, category: ErrorCategory, code: string): { ja: string; en: string } {
    // Category-based messages
    const categoryMessages: Record<ErrorCategory, { ja: string; en: string }> = {
      [ErrorCategory.WEBASSEMBLY]: {
        ja: 'アプリケーションの初期化中にエラーが発生しました。',
        en: 'An error occurred during application initialization.'
      },
      [ErrorCategory.NETWORK]: {
        ja: 'ネットワーク接続に問題があります。',
        en: 'There is a problem with the network connection.'
      },
      [ErrorCategory.DATA_VALIDATION]: {
        ja: '入力データの形式が正しくありません。',
        en: 'The input data format is incorrect.'
      },
      [ErrorCategory.USER_INPUT]: {
        ja: '入力内容を確認してください。',
        en: 'Please check your input.'
      },
      [ErrorCategory.ROUTE_CALCULATION]: {
        ja: 'ルート計算中にエラーが発生しました。',
        en: 'An error occurred during route calculation.'
      },
      [ErrorCategory.DATABASE]: {
        ja: 'データベースアクセスエラーが発生しました。',
        en: 'A database access error occurred.'
      },
      [ErrorCategory.CACHE]: {
        ja: 'キャッシュ操作でエラーが発生しました。',
        en: 'An error occurred in cache operation.'
      },
      [ErrorCategory.SYSTEM]: {
        ja: 'システムエラーが発生しました。',
        en: 'A system error occurred.'
      }
    };
    
    return categoryMessages[category] || categoryMessages[ErrorCategory.SYSTEM];
  }
  
  /**
   * Generate error suggestions
   */
  private generateErrorSuggestions(error: Error, category: ErrorCategory, code: string): ErrorSuggestion[] {
    const baseSuggestions: Record<ErrorCategory, ErrorSuggestion[]> = {
      [ErrorCategory.NETWORK]: [{
        id: 'check_connection',
        messageJa: 'インターネット接続を確認してください。',
        messageEn: 'Please check your internet connection.',
        action: 'retry',
        priority: 1,
        icon: 'wifi'
      }],
      [ErrorCategory.USER_INPUT]: [{
        id: 'check_input',
        messageJa: '入力内容を確認して再試行してください。',
        messageEn: 'Please check your input and try again.',
        action: 'check_input',
        priority: 1,
        icon: 'edit'
      }],
      [ErrorCategory.WEBASSEMBLY]: [{
        id: 'reload_page',
        messageJa: 'ページを再読み込みしてください。',
        messageEn: 'Please reload the page.',
        action: 'reload',
        priority: 1,
        icon: 'refresh'
      }]
    };
    
    return baseSuggestions[category] || [{
      id: 'general_retry',
      messageJa: '少し待ってから再試行してください。',
      messageEn: 'Please wait a moment and try again.',
      action: 'retry',
      priority: 1,
      icon: 'clock'
    }];
  }
  
  /**
   * Generate recovery actions
   */
  private generateRecoveryActions(error: Error, category: ErrorCategory): ErrorRecoveryAction[] {
    // Category-specific recovery actions
    if (category === ErrorCategory.CACHE) {
      return [{
        id: 'clear_cache',
        description: 'Clear application cache',
        action: async () => {
          // Implementation would clear cache
        },
        retryable: true,
        estimatedTime: 500
      }];
    }
    
    return [];
  }
  
  /**
   * Check if error is retryable
   */
  private isErrorRetryable(error: Error, category: ErrorCategory): boolean {
    const strategy = this.getRetryStrategy(category);
    
    // Check non-retryable errors first
    if (strategy.nonRetryableErrors.has(error.name) || 
        strategy.nonRetryableErrors.has(this.extractErrorCode(error))) {
      return false;
    }
    
    // Check retryable errors
    if (strategy.retryableErrors.has(error.name) ||
        strategy.retryableErrors.has(this.extractErrorCode(error))) {
      return true;
    }
    
    // Custom retry condition
    if (strategy.customRetryCondition) {
      const managedError = new ManagedError({
        message: error.message,
        severity: ErrorSeverity.ERROR,
        category,
        code: this.extractErrorCode(error),
        context: { operation: 'unknown', operationDescription: 'Unknown', source: 'unknown', metadata: {} },
        userMessageJa: '不明なエラー',
        userMessageEn: 'Unknown error'
      });
      return strategy.customRetryCondition(managedError);
    }
    
    // Default to category-based logic
    return category === ErrorCategory.NETWORK ||
           category === ErrorCategory.WEBASSEMBLY ||
           category === ErrorCategory.ROUTE_CALCULATION;
  }
  
  /**
   * Get retry strategy for category
   */
  private getRetryStrategy(category: ErrorCategory): RetryStrategy {
    return this.retryStrategies[category];
  }
  
  /**
   * Initialize retry strategies
   */
  private initializeRetryStrategies(): Record<ErrorCategory, RetryStrategy> {
    const baseStrategy = this.config.defaultRetryStrategy;
    
    return {
      [ErrorCategory.WEBASSEMBLY]: {
        ...baseStrategy,
        maxAttempts: 2,
        initialDelay: 2000,
        ...this.config.categoryRetryStrategies[ErrorCategory.WEBASSEMBLY]
      },
      [ErrorCategory.NETWORK]: {
        ...baseStrategy,
        maxAttempts: 5,
        initialDelay: 500,
        ...this.config.categoryRetryStrategies[ErrorCategory.NETWORK]
      },
      [ErrorCategory.ROUTE_CALCULATION]: {
        ...baseStrategy,
        maxAttempts: 3,
        initialDelay: 1000,
        ...this.config.categoryRetryStrategies[ErrorCategory.ROUTE_CALCULATION]
      },
      [ErrorCategory.DATABASE]: {
        ...baseStrategy,
        maxAttempts: 2,
        initialDelay: 1500,
        ...this.config.categoryRetryStrategies[ErrorCategory.DATABASE]
      },
      [ErrorCategory.CACHE]: {
        ...baseStrategy,
        maxAttempts: 1,
        initialDelay: 0,
        ...this.config.categoryRetryStrategies[ErrorCategory.CACHE]
      },
      [ErrorCategory.DATA_VALIDATION]: {
        ...baseStrategy,
        maxAttempts: 1,
        initialDelay: 0,
        retryableErrors: new Set(),
        ...this.config.categoryRetryStrategies[ErrorCategory.DATA_VALIDATION]
      },
      [ErrorCategory.USER_INPUT]: {
        ...baseStrategy,
        maxAttempts: 1,
        initialDelay: 0,
        retryableErrors: new Set(),
        ...this.config.categoryRetryStrategies[ErrorCategory.USER_INPUT]
      },
      [ErrorCategory.SYSTEM]: {
        ...baseStrategy,
        ...this.config.categoryRetryStrategies[ErrorCategory.SYSTEM]
      }
    };
  }
  
  /**
   * Record error in history
   */
  private recordError(error: ManagedError): void {
    // Add to history
    this.errorHistory.push(error);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory.shift();
    }
    
    // Update error count
    const key = `${error.category}:${error.code}`;
    this.errorCount.set(key, (this.errorCount.get(key) || 0) + 1);
    
    // Update statistics
    this.updateStats();
  }
  
  /**
   * Check if should retry error
   */
  private shouldRetry(error: ManagedError): boolean {
    const strategy = this.getRetryStrategy(error.category);
    return error.retryCount < strategy.maxAttempts;
  }
  
  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: ManagedError): Promise<void> {
    const strategy = this.getRetryStrategy(error.category);
    
    // Calculate retry delay
    const delay = this.calculateRetryDelay(error.retryCount, strategy);
    
    // Wait before retry
    await this.sleep(delay);
    
    // Increment retry count
    error.retryCount++;
    
    // Execute recovery actions
    for (const action of error.recoveryActions.filter(a => a.retryable)) {
      try {
        await action.action();
      } catch (recoveryError) {
        console.warn(`Recovery action ${action.id} failed:`, recoveryError);
      }
    }
  }
  
  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(attempt: number, strategy: RetryStrategy): number {
    const baseDelay = strategy.initialDelay * Math.pow(strategy.backoffMultiplier, attempt);
    const cappedDelay = Math.min(baseDelay, strategy.maxDelay);
    const jitter = cappedDelay * strategy.jitter * Math.random();
    return cappedDelay + jitter;
  }
  
  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(operation: string): boolean {
    if (!this.config.enableCircuitBreaker) return false;
    
    const breaker = this.circuitBreakers.get(operation);
    if (!breaker) return false;
    
    if (breaker.state === CircuitBreakerState.OPEN) {
      return Date.now() < (breaker.nextRetryTime || 0);
    }
    
    return false;
  }
  
  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(operation: string, success: boolean): void {
    if (!this.config.enableCircuitBreaker) return;
    
    let breaker = this.circuitBreakers.get(operation);
    if (!breaker) {
      breaker = {
        state: CircuitBreakerState.CLOSED,
        failureCount: 0,
        halfOpenSuccessCount: 0
      };
      this.circuitBreakers.set(operation, breaker);
    }
    
    if (success) {
      if (breaker.state === CircuitBreakerState.HALF_OPEN) {
        breaker.halfOpenSuccessCount++;
        if (breaker.halfOpenSuccessCount >= this.config.circuitBreakerConfig.halfOpenMaxCalls) {
          breaker.state = CircuitBreakerState.CLOSED;
          breaker.failureCount = 0;
          breaker.halfOpenSuccessCount = 0;
        }
      } else if (breaker.state === CircuitBreakerState.CLOSED) {
        breaker.failureCount = Math.max(0, breaker.failureCount - 1);
      }
    } else {
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.state === CircuitBreakerState.CLOSED && 
          breaker.failureCount >= this.config.circuitBreakerConfig.failureThreshold) {
        breaker.state = CircuitBreakerState.OPEN;
        breaker.nextRetryTime = Date.now() + this.config.circuitBreakerConfig.recoveryTimeout;
      } else if (breaker.state === CircuitBreakerState.HALF_OPEN) {
        breaker.state = CircuitBreakerState.OPEN;
        breaker.nextRetryTime = Date.now() + this.config.circuitBreakerConfig.recoveryTimeout;
        breaker.halfOpenSuccessCount = 0;
      }
    }
    
    // Transition from OPEN to HALF_OPEN
    if (breaker.state === CircuitBreakerState.OPEN && 
        Date.now() >= (breaker.nextRetryTime || 0)) {
      breaker.state = CircuitBreakerState.HALF_OPEN;
      breaker.halfOpenSuccessCount = 0;
    }
  }
  
  /**
   * Initialize statistics
   */
  private initializeStats(): ErrorManagerStats {
    const now = Date.now();
    return {
      totalErrors: 0,
      errorsBySeverity: {
        [ErrorSeverity.INFO]: 0,
        [ErrorSeverity.WARNING]: 0,
        [ErrorSeverity.ERROR]: 0,
        [ErrorSeverity.CRITICAL]: 0,
        [ErrorSeverity.FATAL]: 0
      },
      errorsByCategory: {
        [ErrorCategory.WEBASSEMBLY]: 0,
        [ErrorCategory.NETWORK]: 0,
        [ErrorCategory.DATA_VALIDATION]: 0,
        [ErrorCategory.USER_INPUT]: 0,
        [ErrorCategory.SYSTEM]: 0,
        [ErrorCategory.ROUTE_CALCULATION]: 0,
        [ErrorCategory.CACHE]: 0,
        [ErrorCategory.DATABASE]: 0
      },
      retryStats: {
        totalRetries: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageRetryCount: 0
      },
      circuitBreakerStats: {},
      performance: {
        averageHandlingTime: 0,
        averageRecoveryTime: 0,
        errorRate: 0
      },
      timeRange: {
        start: now,
        end: now
      }
    };
  }
  
  /**
   * Update statistics
   */
  private updateStats(): void {
    const now = Date.now();
    
    // Update basic counts
    this.stats.totalErrors = this.errorHistory.length;
    
    // Reset counters
    Object.keys(this.stats.errorsBySeverity).forEach(key => {
      this.stats.errorsBySeverity[key as ErrorSeverity] = 0;
    });
    Object.keys(this.stats.errorsByCategory).forEach(key => {
      this.stats.errorsByCategory[key as ErrorCategory] = 0;
    });
    
    // Count by severity and category
    this.errorHistory.forEach(error => {
      this.stats.errorsBySeverity[error.severity]++;
      this.stats.errorsByCategory[error.category]++;
    });
    
    // Update retry statistics
    const retriedErrors = this.errorHistory.filter(e => e.retryCount > 0);
    this.stats.retryStats.totalRetries = retriedErrors.reduce((sum, e) => sum + e.retryCount, 0);
    this.stats.retryStats.averageRetryCount = retriedErrors.length > 0 ? 
      this.stats.retryStats.totalRetries / retriedErrors.length : 0;
    
    // Update circuit breaker stats
    this.stats.circuitBreakerStats = Object.fromEntries(this.circuitBreakers);
    
    // Update time range
    this.stats.timeRange.end = now;
    
    // Calculate error rate (errors per minute)
    const timeRangeMinutes = (now - this.stats.timeRange.start) / (1000 * 60);
    this.stats.performance.errorRate = timeRangeMinutes > 0 ? 
      this.errorHistory.length / timeRangeMinutes : 0;
  }
  
  /**
   * Record performance metric
   */
  private recordPerformanceMetric(operation: string, time: number): void {
    if (!this.performanceTimers.has(operation)) {
      this.performanceTimers.set(operation, time);
    } else {
      const current = this.performanceTimers.get(operation)!;
      this.performanceTimers.set(operation, (current + time) / 2); // Simple average
    }
  }
  
  /**
   * Report error to external service
   */
  private async reportError(error: ManagedError): Promise<void> {
    try {
      const payload = {
        ...error.toJSON(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      };
      
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
  
  /**
   * Notify Svelte subscribers
   */
  private notifySubscribers(): void {
    if (!this.config.svelteReactive) return;
    
    for (const subscriber of Array.from(this.svelteSubscribers)) {
      try {
        subscriber();
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    }
  }
  
  /**
   * Notify error listeners
   */
  private notifyErrorListeners(error: ManagedError): void {
    for (const listener of Array.from(this.errorListeners)) {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    }
  }
  
  /**
   * Dispose error manager and clean up resources
   */
  dispose(): void {
    this.errorHistory.length = 0;
    this.errorCount.clear();
    this.circuitBreakers.clear();
    this.svelteSubscribers.clear();
    this.errorListeners.clear();
    this.performanceTimers.clear();
  }
}

// ============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// ============================================================================

/**
 * Create a default error manager instance
 */
export function createErrorManager(config?: ErrorManagerConfig): ErrorManager {
  return new ErrorManager(config);
}

/**
 * Create an error manager optimized for Svelte applications
 */
export function createSvelteErrorManager(config?: ErrorManagerConfig): ErrorManager {
  return new ErrorManager({
    ...config,
    svelteReactive: true,
    enableCircuitBreaker: true,
    enableWasmErrorHandling: true
  });
}

/**
 * Create an error manager optimized for production use
 */
export function createProductionErrorManager(config?: ErrorManagerConfig): ErrorManager {
  return new ErrorManager({
    ...config,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    maxErrorHistory: 500, // Smaller history for production
    defaultRetryStrategy: {
      maxAttempts: 2, // Fewer retries in production
      initialDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000,
      jitter: 0.1,
      retryableErrors: new Set(['WASM_LOAD_FAILED', 'NETWORK_ERROR']),
      nonRetryableErrors: new Set(['INVALID_STATION_NAME', 'INVALID_LINE_NAME'])
    }
  });
}

// ============================================================================
// TYPE EXPORTS AND UTILITIES
// ============================================================================

export type {
  ErrorContext,
  ErrorRecoveryAction,
  ErrorSuggestion,
  RetryStrategy,
  ErrorManagerConfig,
  ErrorManagerStats,
  CircuitBreakerInfo
};

/**
 * Type guard to check if an error is a ManagedError
 */
export function isManagedError(error: any): error is ManagedError {
  return error instanceof ManagedError ||
         (error && 
          error.name === 'ManagedError' &&
          typeof error.id === 'string' &&
          typeof error.severity === 'string' &&
          typeof error.category === 'string');
}

/**
 * Convert CLI error to managed error
 */
export function convertCLIError(cliError: CLIError, context: Partial<ErrorContext> = {}): ManagedError {
  const fullContext: ErrorContext = {
    operation: 'unknown',
    operationDescription: 'Unknown operation',
    source: 'CLI',
    metadata: {},
    ...context
  };
  
  return new ManagedError({
    message: cliError.message,
    severity: ErrorSeverity.ERROR,
    category: ErrorCategory.SYSTEM,
    code: cliError.code,
    context: fullContext,
    retryable: true,
    userMessageJa: cliError.getLocalizedMessage('ja'),
    userMessageEn: cliError.getLocalizedMessage('en'),
    originalError: cliError
  });
}