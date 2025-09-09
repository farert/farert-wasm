/**
 * Error Manager Test Suite
 * 
 * Comprehensive tests for the error management system including:
 * - Basic error handling and conversion
 * - Retry logic with exponential backoff
 * - Circuit breaker functionality
 * - WebAssembly-specific error handling
 * - Svelte reactivity
 * - Error reporting and analytics
 * 
 * @file Error Manager Tests
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// IMPORTS AND TEST SETUP
// ============================================================================

import {
  ErrorManager,
  ManagedError,
  ErrorSeverity,
  ErrorCategory,
  CircuitBreakerState,
  createErrorManager,
  createSvelteErrorManager,
  createProductionErrorManager,
  isManagedError,
  convertCLIError,
  DEVELOPMENT_RETRY_STRATEGY,
  PRODUCTION_RETRY_STRATEGY
} from './error-manager';

import type {
  ErrorContext,
  RetryStrategy,
  ErrorManagerConfig,
  ErrorSuggestion,
  ErrorRecoveryAction
} from './error-manager';

// Mock CLI errors for testing
class MockCLIError extends Error {
  public readonly code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'MockCLIError';
    this.code = code;
  }
  
  getLocalizedMessage(locale: 'ja' | 'en'): string {
    return locale === 'ja' ? `エラー: ${this.message}` : `Error: ${this.message}`;
  }
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a test error context
 */
function createTestContext(overrides: Partial<ErrorContext> = {}): ErrorContext {
  return {
    operation: 'test_operation',
    operationDescription: 'Test operation',
    source: 'test',
    metadata: { testData: true },
    ...overrides
  };
}

/**
 * Create a test error manager with minimal config
 */
function createTestErrorManager(config: Partial<ErrorManagerConfig> = {}): ErrorManager {
  return new ErrorManager({
    enableErrorReporting: false,
    enablePerformanceMonitoring: false,
    svelteReactive: false,
    maxErrorHistory: 10,
    ...config
  });
}

/**
 * Sleep helper for async tests
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// BASIC ERROR HANDLING TESTS
// ============================================================================

describe('ErrorManager - Basic Functionality', () => {
  let errorManager: ErrorManager;
  
  beforeEach(() => {
    errorManager = createTestErrorManager();
  });
  
  afterEach(() => {
    errorManager.dispose();
  });
  
  test('should handle basic errors', async () => {
    const error = new Error('Test error');
    const context = createTestContext();
    
    const managedError = await errorManager.handleError(error, context);
    
    expect(managedError).toBeInstanceOf(ManagedError);
    expect(managedError.message).toBe('Test error');
    expect(managedError.context).toBe(context);
    expect(managedError.severity).toBe(ErrorSeverity.WARNING);
    expect(managedError.category).toBe(ErrorCategory.SYSTEM);
  });
  
  test('should convert CLI errors correctly', async () => {
    const cliError = new MockCLIError('Station not found', 'INVALID_STATION_NAME');
    const context = createTestContext();
    
    const managedError = await errorManager.handleError(cliError, context);
    
    expect(managedError.code).toBe('INVALID_STATION_NAME');
    expect(managedError.category).toBe(ErrorCategory.USER_INPUT);
    expect(managedError.retryable).toBe(false); // Input errors should not be retryable
  });
  
  test('should maintain error history', async () => {
    const errors = [
      new Error('Error 1'),
      new Error('Error 2'),
      new Error('Error 3')
    ];
    
    for (const error of errors) {
      await errorManager.handleError(error, createTestContext());
    }
    
    const recentErrors = errorManager.getRecentErrors();
    expect(recentErrors).toHaveLength(3);
    expect(recentErrors.map(e => e.message)).toEqual(['Error 3', 'Error 2', 'Error 1']); // Newest first
  });
  
  test('should limit error history size', async () => {
    const manager = createTestErrorManager({ maxErrorHistory: 2 });
    
    for (let i = 1; i <= 5; i++) {
      await manager.handleError(new Error(`Error ${i}`), createTestContext());
    }
    
    const recentErrors = manager.getRecentErrors();
    expect(recentErrors).toHaveLength(2);
    expect(recentErrors.map(e => e.message)).toEqual(['Error 5', 'Error 4']);
    
    manager.dispose();
  });
});

// ============================================================================
// ERROR CATEGORIZATION TESTS
// ============================================================================

describe('ErrorManager - Error Categorization', () => {
  let errorManager: ErrorManager;
  
  beforeEach(() => {
    errorManager = createTestErrorManager();
  });
  
  afterEach(() => {
    errorManager.dispose();
  });
  
  test('should categorize WebAssembly errors', async () => {
    const wasmError = new Error('WebAssembly module failed to compile');
    const managedError = await errorManager.handleError(wasmError, createTestContext());
    
    expect(managedError.category).toBe(ErrorCategory.WEBASSEMBLY);
  });
  
  test('should categorize network errors', async () => {
    const networkError = new Error('Network request timeout');
    const managedError = await errorManager.handleError(networkError, createTestContext());
    
    expect(managedError.category).toBe(ErrorCategory.NETWORK);
  });
  
  test('should categorize validation errors', async () => {
    const validationError = new Error('Invalid data format provided');
    const managedError = await errorManager.handleError(validationError, createTestContext());
    
    expect(managedError.category).toBe(ErrorCategory.DATA_VALIDATION);
  });
});

// ============================================================================
// RETRY LOGIC TESTS
// ============================================================================

describe('ErrorManager - Retry Logic', () => {
  test('should retry retryable errors', async () => {
    const errorManager = createTestErrorManager({
      defaultRetryStrategy: {
        maxAttempts: 3,
        initialDelay: 10, // Fast for testing
        backoffMultiplier: 1.5,
        maxDelay: 100,
        jitter: 0,
        retryableErrors: new Set(['NETWORK_ERROR']),
        nonRetryableErrors: new Set()
      }
    });
    
    let callCount = 0;
    const operation = async () => {
      callCount++;
      if (callCount < 3) {
        const error = new Error('Network timeout');
        (error as any).code = 'NETWORK_ERROR';
        throw error;
      }
      return 'success';
    };
    
    const result = await errorManager.executeWithErrorHandling(
      operation,
      createTestContext({ operation: 'test_network' })
    );
    
    expect(result).toBe('success');
    expect(callCount).toBe(3);
    
    errorManager.dispose();
  });
  
  test('should not retry non-retryable errors', async () => {
    const errorManager = createTestErrorManager({
      defaultRetryStrategy: {
        maxAttempts: 3,
        initialDelay: 10,
        backoffMultiplier: 2,
        maxDelay: 100,
        jitter: 0,
        retryableErrors: new Set(),
        nonRetryableErrors: new Set(['INVALID_INPUT'])
      }
    });
    
    let callCount = 0;
    const operation = async () => {
      callCount++;
      const error = new Error('Invalid input provided');
      (error as any).code = 'INVALID_INPUT';
      throw error;
    };
    
    await expect(
      errorManager.executeWithErrorHandling(
        operation,
        createTestContext({ operation: 'test_input' })
      )
    ).rejects.toThrow('Invalid input provided');
    
    expect(callCount).toBe(1); // Should not retry
    
    errorManager.dispose();
  });
  
  test('should apply exponential backoff', async () => {
    const errorManager = createTestErrorManager({
      defaultRetryStrategy: {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
        maxDelay: 1000,
        jitter: 0,
        retryableErrors: new Set(['RETRYABLE_ERROR']),
        nonRetryableErrors: new Set()
      }
    });
    
    const timings: number[] = [];
    let startTime = Date.now();
    
    const operation = async () => {
      timings.push(Date.now() - startTime);
      const error = new Error('Retryable error');
      (error as any).code = 'RETRYABLE_ERROR';
      throw error;
    };
    
    try {
      await errorManager.executeWithErrorHandling(
        operation,
        createTestContext({ operation: 'backoff_test' })
      );
    } catch {
      // Expected to fail after retries
    }
    
    // Should have 3 attempts with increasing delays
    expect(timings).toHaveLength(3);
    
    // First attempt should be immediate
    expect(timings[0]).toBeLessThan(50);
    
    // Second attempt should be delayed by ~100ms
    expect(timings[1]).toBeGreaterThan(90);
    expect(timings[1]).toBeLessThan(150);
    
    // Third attempt should be delayed by ~200ms more
    expect(timings[2]).toBeGreaterThan(250);
    expect(timings[2]).toBeLessThan(350);
    
    errorManager.dispose();
  });
});

// ============================================================================
// CIRCUIT BREAKER TESTS
// ============================================================================

describe('ErrorManager - Circuit Breaker', () => {
  test('should open circuit after failure threshold', async () => {
    const errorManager = createTestErrorManager({
      enableCircuitBreaker: true,
      circuitBreakerConfig: {
        failureThreshold: 2,
        recoveryTimeout: 1000,
        halfOpenMaxCalls: 1
      }
    });
    
    const operation = async () => {
      throw new Error('Operation failed');
    };
    
    const context = createTestContext({ operation: 'circuit_test' });
    
    // First two failures should execute normally
    await expect(errorManager.executeWithErrorHandling(operation, context)).rejects.toThrow();
    await expect(errorManager.executeWithErrorHandling(operation, context)).rejects.toThrow();
    
    // Third attempt should be blocked by circuit breaker
    await expect(errorManager.executeWithErrorHandling(operation, context)).rejects.toThrow('Circuit breaker is OPEN');
    
    const stats = errorManager.getStats();
    expect(stats.circuitBreakerStats['circuit_test']?.state).toBe(CircuitBreakerState.OPEN);
    
    errorManager.dispose();
  });
  
  test('should transition to half-open after recovery timeout', async () => {
    const errorManager = createTestErrorManager({
      enableCircuitBreaker: true,
      circuitBreakerConfig: {
        failureThreshold: 1,
        recoveryTimeout: 50, // Short for testing
        halfOpenMaxCalls: 1
      }
    });
    
    const context = createTestContext({ operation: 'recovery_test' });
    
    // Trigger circuit breaker
    await expect(
      errorManager.executeWithErrorHandling(
        async () => { throw new Error('Failure'); },
        context
      )
    ).rejects.toThrow();
    
    // Should be OPEN
    let stats = errorManager.getStats();
    expect(stats.circuitBreakerStats['recovery_test']?.state).toBe(CircuitBreakerState.OPEN);
    
    // Wait for recovery timeout
    await sleep(100);
    
    // Next call should attempt to execute (HALF_OPEN)
    const successOperation = async () => 'success';
    const result = await errorManager.executeWithErrorHandling(successOperation, context);
    expect(result).toBe('success');
    
    // Should be CLOSED after successful call
    stats = errorManager.getStats();
    expect(stats.circuitBreakerStats['recovery_test']?.state).toBe(CircuitBreakerState.CLOSED);
    
    errorManager.dispose();
  });
});

// ============================================================================
// WEBASSEMBLY ERROR HANDLING TESTS
// ============================================================================

describe('ErrorManager - WebAssembly Errors', () => {
  let errorManager: ErrorManager;
  
  beforeEach(() => {
    errorManager = createTestErrorManager({
      enableWasmErrorHandling: true
    });
  });
  
  afterEach(() => {
    errorManager.dispose();
  });
  
  test('should detect WebAssembly memory errors', async () => {
    const memoryError = new Error('out of memory');
    const managedError = await errorManager.handleWebAssemblyError(memoryError, createTestContext());
    
    expect(managedError.category).toBe(ErrorCategory.WEBASSEMBLY);
    expect(managedError.severity).toBe(ErrorSeverity.CRITICAL);
    expect(managedError.userMessageJa).toContain('メモリ不足');
    expect(managedError.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'reload',
          priority: 1
        })
      ])
    );
  });
  
  test('should detect WebAssembly module errors', async () => {
    const moduleError = new Error('invalid module detected');
    const managedError = await errorManager.handleWebAssemblyError(moduleError, createTestContext());
    
    expect(managedError.userMessageJa).toContain('アプリケーションファイルが破損');
    expect(managedError.retryable).toBe(false); // Module errors shouldn't be retryable
  });
  
  test('should detect WebAssembly runtime errors', async () => {
    const runtimeError = new Error('wasm runtime exception');
    const managedError = await errorManager.handleWebAssemblyError(runtimeError, createTestContext());
    
    expect(managedError.retryable).toBe(true); // Runtime errors can be retryable
    expect(managedError.severity).toBe(ErrorSeverity.WARNING);
  });
  
  test('should include WebAssembly context information', async () => {
    const wasmError = new Error('WebAssembly error');
    const managedError = await errorManager.handleWebAssemblyError(wasmError, createTestContext());
    
    expect(managedError.context.metadata).toHaveProperty('wasmErrorType');
    expect(managedError.context.metadata).toHaveProperty('wasmModuleInfo');
    expect(managedError.context.metadata.wasmModuleInfo).toHaveProperty('webAssemblySupported');
  });
});

// ============================================================================
// SVELTE REACTIVITY TESTS
// ============================================================================

describe('ErrorManager - Svelte Reactivity', () => {
  test('should support Svelte subscriptions', () => {
    const errorManager = createTestErrorManager({
      svelteReactive: true
    });
    
    let notificationCount = 0;
    const unsubscribe = errorManager.subscribe(() => {
      notificationCount++;
    });
    
    expect(notificationCount).toBe(1); // Initial call
    
    // Trigger state change
    errorManager.handleError(new Error('Test'), createTestContext());
    
    expect(notificationCount).toBeGreaterThan(1);
    
    unsubscribe();
    errorManager.dispose();
  });
  
  test('should support error event listeners', async () => {
    const errorManager = createTestErrorManager();
    
    let capturedError: ManagedError | null = null;
    const unsubscribe = errorManager.onError(error => {
      capturedError = error;
    });
    
    const testError = new Error('Test error');
    await errorManager.handleError(testError, createTestContext());
    
    expect(capturedError).not.toBeNull();
    expect(capturedError!.message).toBe('Test error');
    
    unsubscribe();
    errorManager.dispose();
  });
});

// ============================================================================
// STATISTICS AND ANALYTICS TESTS
// ============================================================================

describe('ErrorManager - Statistics', () => {
  test('should track error statistics', async () => {
    const errorManager = createTestErrorManager();
    
    // Generate different types of errors
    await errorManager.handleError(new Error('Network error'), createTestContext());
    await errorManager.handleError(new Error('Validation error'), createTestContext());
    await errorManager.handleError(new Error('System error'), createTestContext());
    
    const stats = errorManager.getStats();
    
    expect(stats.totalErrors).toBe(3);
    expect(stats.errorsBySeverity[ErrorSeverity.WARNING]).toBeGreaterThan(0);
    expect(stats.errorsByCategory[ErrorCategory.SYSTEM]).toBeGreaterThan(0);
    
    errorManager.dispose();
  });
  
  test('should calculate error rates', async () => {
    const errorManager = createTestErrorManager({
      enablePerformanceMonitoring: true
    });
    
    // Generate errors over time
    for (let i = 0; i < 5; i++) {
      await errorManager.handleError(new Error(`Error ${i}`), createTestContext());
    }
    
    const stats = errorManager.getStats();
    expect(stats.performance.errorRate).toBeGreaterThan(0);
    
    errorManager.dispose();
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('ErrorManager - Factory Functions', () => {
  test('should create Svelte-optimized error manager', () => {
    const manager = createSvelteErrorManager();
    
    expect(manager).toBeInstanceOf(ErrorManager);
    // Verify Svelte-specific config is applied
    const stats = manager.getStats();
    expect(stats).toBeDefined();
    
    manager.dispose();
  });
  
  test('should create production-optimized error manager', () => {
    const manager = createProductionErrorManager({
      reportingEndpoint: '/api/test-errors'
    });
    
    expect(manager).toBeInstanceOf(ErrorManager);
    
    manager.dispose();
  });
});

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('ErrorManager - Utility Functions', () => {
  test('should identify managed errors', () => {
    const managedError = new ManagedError({
      message: 'Test error',
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.SYSTEM,
      code: 'TEST_ERROR',
      context: createTestContext(),
      userMessageJa: 'テストエラー',
      userMessageEn: 'Test error'
    });
    
    const regularError = new Error('Regular error');
    
    expect(isManagedError(managedError)).toBe(true);
    expect(isManagedError(regularError)).toBe(false);
  });
  
  test('should convert CLI errors', () => {
    const cliError = new MockCLIError('Station not found', 'INVALID_STATION_NAME');
    const managedError = convertCLIError(cliError);
    
    expect(managedError).toBeInstanceOf(ManagedError);
    expect(managedError.code).toBe('INVALID_STATION_NAME');
    expect(managedError.originalError).toBe(cliError);
  });
});

// ============================================================================
// ERROR RECOVERY TESTS
// ============================================================================

describe('ErrorManager - Error Recovery', () => {
  test('should execute recovery actions', async () => {
    const errorManager = createTestErrorManager();
    
    let recoveryExecuted = false;
    const recoveryAction: ErrorRecoveryAction = {
      id: 'test_recovery',
      description: 'Test recovery action',
      action: async () => {
        recoveryExecuted = true;
      },
      retryable: true
    };
    
    const error = new ManagedError({
      message: 'Recoverable error',
      severity: ErrorSeverity.WARNING,
      category: ErrorCategory.SYSTEM,
      code: 'RECOVERABLE_ERROR',
      context: createTestContext(),
      retryable: true,
      userMessageJa: '回復可能なエラー',
      userMessageEn: 'Recoverable error',
      recoveryActions: [recoveryAction]
    });
    
    await errorManager.handleError(error, createTestContext());
    
    // Recovery action should have been executed
    expect(recoveryExecuted).toBe(true);
    
    errorManager.dispose();
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('ErrorManager - Edge Cases', () => {
  test('should handle null or undefined errors gracefully', async () => {
    const errorManager = createTestErrorManager();
    
    // Test with various invalid inputs
    const nullError = null as any;
    const undefinedError = undefined as any;
    
    // These should not throw but should create appropriate managed errors
    expect(async () => {
      await errorManager.handleError(nullError, createTestContext());
    }).not.toThrow();
    
    expect(async () => {
      await errorManager.handleError(undefinedError, createTestContext());
    }).not.toThrow();
    
    errorManager.dispose();
  });
  
  test('should handle errors in error handling', async () => {
    // Create an error manager with a problematic configuration
    const errorManager = createTestErrorManager({
      enableErrorReporting: true,
      reportingEndpoint: 'invalid-url' // This should cause reporting to fail
    });
    
    const testError = new Error('Original error');
    
    // Should not throw even if error reporting fails
    const managedError = await errorManager.handleError(testError, createTestContext());
    
    expect(managedError).toBeInstanceOf(ManagedError);
    expect(managedError.message).toBe('Original error');
    
    errorManager.dispose();
  });
  
  test('should handle concurrent error handling', async () => {
    const errorManager = createTestErrorManager();
    
    // Create multiple concurrent errors
    const promises = Array.from({ length: 10 }, (_, i) => 
      errorManager.handleError(new Error(`Concurrent error ${i}`), createTestContext())
    );
    
    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(10);
    results.forEach((result, i) => {
      expect(result.message).toBe(`Concurrent error ${i}`);
    });
    
    errorManager.dispose();
  });
});