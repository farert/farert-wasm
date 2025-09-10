/**
 * Jest Setup for Cache Performance Tests
 * 
 * Global setup configuration for cache performance testing environment,
 * including mock configurations, performance monitoring, and test utilities.
 * 
 * @file Cache Test Setup
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { jest } from '@jest/globals';

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

/**
 * Configure global test environment
 */
beforeAll(() => {
  // Set up performance monitoring
  if (typeof performance === 'undefined') {
    global.performance = {
      now: () => Date.now(),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn().mockReturnValue([]),
      getEntriesByType: jest.fn().mockReturnValue([]),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn()
    } as any;
  }
  
  // Configure test timeouts
  jest.setTimeout(60000); // 60 seconds for performance tests
  
  // Set up memory monitoring
  global.gc = global.gc || (() => {
    // Mock garbage collection for testing
    console.log('[TEST] Mock GC called');
  });
  
  // Configure Node.js memory settings for consistent testing
  if (process.env.NODE_OPTIONS && !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
    process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --max-old-space-size=2048';
  }
});

/**
 * Clean up after each test
 */
afterEach(() => {
  // Clear any lingering timers
  jest.clearAllTimers();
  
  // Force garbage collection if available
  if (typeof global.gc === 'function') {
    global.gc();
  }
  
  // Clear any console spies
  if (jest.isMockFunction(console.error)) {
    (console.error as jest.MockedFunction<typeof console.error>).mockClear();
  }
  if (jest.isMockFunction(console.warn)) {
    (console.warn as jest.MockedFunction<typeof console.warn>).mockClear();
  }
});

/**
 * Clean up after all tests
 */
afterAll(() => {
  // Final cleanup
  jest.restoreAllMocks();
  jest.useRealTimers();
});

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * Global performance test utilities
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Assert that a performance value is within acceptable limits
       */
      toBeWithinPerformanceLimit(limit: number, unit?: string): R;
      
      /**
       * Assert that memory usage is reasonable
       */
      toBeWithinMemoryLimit(limitMB: number): R;
      
      /**
       * Assert that cache hit ratio is acceptable
       */
      toHaveGoodCacheRatio(minimumRatio: number): R;
    }
  }
}

/**
 * Custom Jest matchers for cache performance testing
 */
expect.extend({
  toBeWithinPerformanceLimit(received: number, limit: number, unit: string = 'ms') {
    const pass = received <= limit;
    
    if (pass) {
      return {
        message: () => `Expected ${received}${unit} to exceed ${limit}${unit}`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received}${unit} to be within ${limit}${unit} limit`,
        pass: false,
      };
    }
  },

  toBeWithinMemoryLimit(received: number, limitMB: number) {
    const receivedMB = received / (1024 * 1024);
    const pass = receivedMB <= limitMB;
    
    if (pass) {
      return {
        message: () => `Expected ${receivedMB.toFixed(2)}MB to exceed ${limitMB}MB`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${receivedMB.toFixed(2)}MB to be within ${limitMB}MB limit`,
        pass: false,
      };
    }
  },

  toHaveGoodCacheRatio(received: number, minimumRatio: number) {
    const pass = received >= minimumRatio;
    const percentage = (received * 100).toFixed(2);
    const expectedPercentage = (minimumRatio * 100).toFixed(2);
    
    if (pass) {
      return {
        message: () => `Expected cache ratio ${percentage}% to be below ${expectedPercentage}%`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected cache ratio ${percentage}% to be at least ${expectedPercentage}%`,
        pass: false,
      };
    }
  }
});

// ============================================================================
// MOCK CONFIGURATIONS
// ============================================================================

/**
 * Mock console methods for cleaner test output
 */
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress expected error messages during testing
  console.error = jest.fn((message: any) => {
    if (typeof message === 'string') {
      // Only suppress specific expected errors
      const suppressPatterns = [
        /Memory monitoring error/,
        /Error in cache event listener/,
        /Cache optimization failed/,
        /Failed to delete cache key/,
        /Failed to clear cache category/,
        /Failed to check cache key/
      ];
      
      const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));
      if (!shouldSuppress) {
        originalConsoleError(message);
      }
    } else {
      originalConsoleError(message);
    }
  });

  console.warn = jest.fn((message: any) => {
    if (typeof message === 'string') {
      // Suppress expected warning messages
      const suppressPatterns = [
        /Cache warning/,
        /Memory usage/,
        /Performance degradation/
      ];
      
      const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));
      if (!shouldSuppress) {
        originalConsoleWarn(message);
      }
    } else {
      originalConsoleWarn(message);
    }
  });
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// ============================================================================
// TEST DATA GENERATORS
// ============================================================================

/**
 * Global test data utilities
 */
global.testUtils = {
  /**
   * Generate deterministic test data for consistent results
   */
  generateDeterministicData: (seed: number, size: number) => {
    const data: any[] = [];
    for (let i = 0; i < size; i++) {
      data.push({
        id: seed + i,
        name: `Test Item ${seed + i}`,
        data: `${'x'.repeat(100)}${i}`, // Consistent size
        timestamp: Date.now() + i
      });
    }
    return data;
  },

  /**
   * Create memory pressure for testing
   */
  createMemoryPressure: (targetSizeMB: number) => {
    const targetBytes = targetSizeMB * 1024 * 1024;
    const chunkSize = 1024; // 1KB chunks
    const chunks = Math.floor(targetBytes / chunkSize);
    
    return Array.from({ length: chunks }, (_, i) => ({
      id: i,
      data: 'x'.repeat(chunkSize - 50), // Account for object overhead
      index: i
    }));
  },

  /**
   * Wait for a specific condition with timeout
   */
  waitForCondition: async (
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Global performance monitor for test analysis
 */
global.performanceMonitor = {
  measurements: new Map<string, number[]>(),
  
  startMeasurement(name: string): number {
    const start = performance.now();
    return start;
  },
  
  endMeasurement(name: string, start: number): number {
    const end = performance.now();
    const duration = end - start;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    this.measurements.get(name)!.push(duration);
    return duration;
  },
  
  getAverageTime(name: string): number {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  },
  
  getPercentile(name: string, percentile: number): number {
    const times = this.measurements.get(name) || [];
    if (times.length === 0) return 0;
    
    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index] || 0;
  },
  
  reset(): void {
    this.measurements.clear();
  },
  
  getSummary(): Record<string, any> {
    const summary: Record<string, any> = {};
    
    for (const [name, times] of this.measurements.entries()) {
      summary[name] = {
        count: times.length,
        average: this.getAverageTime(name),
        min: Math.min(...times),
        max: Math.max(...times),
        p50: this.getPercentile(name, 50),
        p90: this.getPercentile(name, 90),
        p99: this.getPercentile(name, 99)
      };
    }
    
    return summary;
  }
};

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

declare global {
  var testUtils: {
    generateDeterministicData: (seed: number, size: number) => any[];
    createMemoryPressure: (targetSizeMB: number) => any[];
    waitForCondition: (condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number) => Promise<void>;
  };
  
  var performanceMonitor: {
    measurements: Map<string, number[]>;
    startMeasurement(name: string): number;
    endMeasurement(name: string, start: number): number;
    getAverageTime(name: string): number;
    getPercentile(name: string, percentile: number): number;
    reset(): void;
    getSummary(): Record<string, any>;
  };
  
  function gc(): void;
}

// Export for external use
export {};