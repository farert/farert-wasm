/**
 * Performance Validation Tests - Task 15
 * Comprehensive performance testing with exact requirement validation
 * Requirements: REQ-CLI-002.5 - CLI performance requirements
 * 
 * This test suite validates:
 * - CLI startup time ≤2 seconds
 * - Route calculation time ≤1 second per route
 * - Memory usage ≤512MB during operation
 * - Test suite execution ≤30 seconds
 * - WebAssembly initialization performance
 * - Database connection performance
 */

import * as path from 'path';
import { performance } from 'perf_hooks';
import { CliTestExecutor, BatchTestExecutor } from './helpers/test-executor';
import { extractPerformanceMetrics } from './helpers/result-parser';

const CLI_PATH = path.resolve(__dirname, '../../../src/cli/main.ts');
const STARTUP_LIMIT = 2000; // 2 seconds
const CALCULATION_LIMIT = 1000; // 1 second
const MEMORY_LIMIT = 512 * 1024 * 1024; // 512MB
const TEST_SUITE_LIMIT = 30000; // 30 seconds

/**
 * Performance test case structure
 */
interface PerformanceTestCase {
  name: string;
  args: string[];
  expectedMaxDuration: number;
  expectedMaxMemory?: number;
  description: string;
  requirement: string;
}

/**
 * Performance measurement result
 */
interface PerformanceMeasurement {
  testName: string;
  duration: number;
  memoryPeak: number;
  requirement: string;
  passed: boolean;
  margin: number; // How much under/over the limit
  details: {
    startupTime?: number;
    wasmLoadTime?: number;
    dbInitTime?: number;
    calculationTime?: number;
  };
}

describe('Performance Validation Tests - Task 15', () => {
  let executor: CliTestExecutor;
  let measurements: PerformanceMeasurement[] = [];
  let overallStartTime: number;
  
  beforeAll(async () => {
    overallStartTime = performance.now();
    console.log('⏱️  Starting CLI Performance Validation Suite');
    
    executor = new CliTestExecutor(CLI_PATH, {
      timeout: 10000, // 10 second timeout per test
      memoryLimit: MEMORY_LIMIT,
      monitorMemory: true,
      monitorPerformance: true,
      captureDebugOutput: true
    });
  });

  afterAll(async () => {
    const totalDuration = performance.now() - overallStartTime;
    console.log(`\n📊 Performance Test Suite Summary (${(totalDuration / 1000).toFixed(2)}s):`);
    
    // Overall statistics
    const passedTests = measurements.filter(m => m.passed).length;
    const failedTests = measurements.length - passedTests;
    console.log(`✅ Passed: ${passedTests}, ❌ Failed: ${failedTests}`);
    
    // Performance statistics
    const avgDuration = measurements.reduce((sum, m) => sum + m.duration, 0) / measurements.length;
    const maxDuration = Math.max(...measurements.map(m => m.duration));
    const avgMemory = measurements.reduce((sum, m) => sum + m.memoryPeak, 0) / measurements.length;
    const maxMemory = Math.max(...measurements.map(m => m.memoryPeak));
    
    console.log(`⏱️  Average execution time: ${avgDuration.toFixed(1)}ms`);
    console.log(`⏱️  Maximum execution time: ${maxDuration.toFixed(1)}ms`);
    console.log(`💾 Average memory usage: ${(avgMemory / 1024 / 1024).toFixed(1)}MB`);
    console.log(`💾 Maximum memory usage: ${(maxMemory / 1024 / 1024).toFixed(1)}MB`);
    
    // Performance violations
    const violations = measurements.filter(m => !m.passed);
    if (violations.length > 0) {
      console.log(`\n⚠️  Performance Violations:`);
      violations.forEach(v => {
        console.log(`   ${v.testName}: ${v.duration.toFixed(1)}ms (limit: ${v.requirement})`);
      });
    }
    
    executor.cleanup();
  });

  /**
   * Helper function to record performance measurement
   */
  function recordMeasurement(
    testName: string,
    duration: number,
    memoryPeak: number,
    requirement: string,
    limit: number,
    details: any = {}
  ): PerformanceMeasurement {
    const passed = duration <= limit;
    const margin = limit - duration;
    
    const measurement: PerformanceMeasurement = {
      testName,
      duration,
      memoryPeak,
      requirement,
      passed,
      margin,
      details
    };
    
    measurements.push(measurement);
    
    // Log result
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${duration.toFixed(1)}ms (${requirement}, margin: ${margin.toFixed(1)}ms)`);
    
    return measurement;
  }

  /**
   * CLI Startup Performance Tests
   */
  describe('CLI Startup Performance', () => {
    test('help command should start within 2 seconds', async () => {
      const result = await executor.execute(['-h'], 'startup_help');
      
      recordMeasurement(
        'Help command startup',
        result.duration,
        result.memoryUsage?.peakHeapUsed || 0,
        'REQ-CLI-002.5 startup ≤2s',
        STARTUP_LIMIT,
        result.performanceMetrics
      );
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThanOrEqual(STARTUP_LIMIT);
    });

    test('environment report should start within 2 seconds', async () => {
      const result = await executor.execute(['--env-report'], 'startup_env_report');
      
      recordMeasurement(
        'Environment report startup',
        result.duration,
        result.memoryUsage?.peakHeapUsed || 0,
        'REQ-CLI-002.5 startup ≤2s',
        STARTUP_LIMIT,
        result.performanceMetrics
      );
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThanOrEqual(STARTUP_LIMIT);
    });

    test('WebAssembly initialization should be efficient', async () => {
      const result = await executor.execute(['-5', '東京', '東海道線', '品川', '山手線', '新宿'], 'wasm_init_perf');
      
      // Extract WebAssembly-specific timing
      const wasmLoadTime = result.performanceMetrics?.wasmLoadTime || 0;
      const dbInitTime = result.performanceMetrics?.dbInitTime || 0;
      
      recordMeasurement(
        'WebAssembly + DB initialization',
        wasmLoadTime + dbInitTime,
        result.memoryUsage?.peakHeapUsed || 0,
        'WASM init ≤1s',
        1000,
        { wasmLoadTime, dbInitTime }
      );
      
      expect(result.success).toBe(true);
      expect(wasmLoadTime + dbInitTime).toBeLessThanOrEqual(1000);
    });
  });

  /**
   * Route Calculation Performance Tests
   */
  describe('Route Calculation Performance', () => {
    const routeTestCases: PerformanceTestCase[] = [
      {
        name: 'Simple Tokyo route',
        args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿'],
        expectedMaxDuration: CALCULATION_LIMIT,
        description: 'Basic 3-station route within Tokyo',
        requirement: 'REQ-CLI-002.5 calculation ≤1s'
      },
      {
        name: 'Long distance route',
        args: ['-5', '東京', '東海道線', '名古屋', '東海道線', '大阪'],
        expectedMaxDuration: CALCULATION_LIMIT,
        description: 'Intercity route calculation',
        requirement: 'REQ-CLI-002.5 calculation ≤1s'
      },
      {
        name: 'Complex junction route',
        args: ['-5', '新宿', '中央線', '立川', '青梅線', '青梅'],
        expectedMaxDuration: CALCULATION_LIMIT,
        description: 'Route with junction complexity',
        requirement: 'REQ-CLI-002.5 calculation ≤1s'
      },
      {
        name: 'Shinkansen route',
        args: ['-5', '東京', '東北新幹線', '仙台', '東北線', '盛岡'],
        expectedMaxDuration: CALCULATION_LIMIT,
        description: 'Mixed Shinkansen and conventional',
        requirement: 'REQ-CLI-002.5 calculation ≤1s'
      }
    ];

    test.each(routeTestCases)('$name should calculate within 1 second', async (testCase) => {
      const result = await executor.execute(testCase.args, testCase.name);
      
      // Extract calculation-specific timing
      const calculationTime = result.performanceMetrics?.calculationTime || result.duration;
      
      recordMeasurement(
        testCase.name,
        calculationTime,
        result.memoryUsage?.peakHeapUsed || 0,
        testCase.requirement,
        testCase.expectedMaxDuration,
        result.performanceMetrics
      );
      
      expect(result.success).toBe(true);
      expect(calculationTime).toBeLessThanOrEqual(testCase.expectedMaxDuration);
      
      if (result.memoryUsage) {
        expect(result.memoryUsage.peakHeapUsed).toBeLessThanOrEqual(MEMORY_LIMIT);
      }
    });
  });

  /**
   * Test Suite Performance Tests
   */
  describe('Test Suite Performance', () => {
    test('complete test suite should execute within 30 seconds', async () => {
      const testSuiteExecutor = new CliTestExecutor(CLI_PATH, {
        timeout: TEST_SUITE_LIMIT + 5000, // 5 second buffer for timeout
        memoryLimit: MEMORY_LIMIT,
        monitorMemory: true,
        monitorPerformance: true,
        captureDebugOutput: false // Reduce overhead for large test
      });

      const result = await testSuiteExecutor.execute(['-exec'], 'complete_test_suite');
      
      recordMeasurement(
        'Complete test suite execution',
        result.duration,
        result.memoryUsage?.peakHeapUsed || 0,
        'REQ-CLI-002.5 test suite ≤30s',
        TEST_SUITE_LIMIT,
        result.performanceMetrics
      );
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThanOrEqual(TEST_SUITE_LIMIT);
      
      testSuiteExecutor.cleanup();
    });
  });

  /**
   * Memory Performance Tests
   */
  describe('Memory Performance', () => {
    test('should not exceed 512MB memory limit during normal operation', async () => {
      const result = await executor.execute(['-5', '東京', '東海道線', '大阪'], 'memory_limit_test');
      
      expect(result.success).toBe(true);
      
      if (result.memoryUsage) {
        const memoryMB = result.memoryUsage.peakHeapUsed / 1024 / 1024;
        console.log(`Memory usage: ${memoryMB.toFixed(1)}MB (limit: ${MEMORY_LIMIT / 1024 / 1024}MB)`);
        
        expect(result.memoryUsage.peakHeapUsed).toBeLessThanOrEqual(MEMORY_LIMIT);
        expect(result.memoryUsage.exceedsLimit).toBe(false);
      }
    });

    test('should maintain reasonable memory usage during batch operations', async () => {
      const batchExecutor = new BatchTestExecutor(CLI_PATH, {
        memoryLimit: MEMORY_LIMIT,
        monitorMemory: true
      });

      const batchTests = [
        { name: 'batch_1', args: ['-5', '東京', '東海道線', '品川'] },
        { name: 'batch_2', args: ['-5', '新宿', '中央線', '立川'] },
        { name: 'batch_3', args: ['-5', '大阪', '東海道線', '京都'] },
        { name: 'batch_4', args: ['-5', '仙台', '東北線', '盛岡'] },
        { name: 'batch_5', args: ['-5', '札幌', '函館線', '小樽'] }
      ];

      const results = await batchExecutor.executeTests(batchTests);
      const summary = batchExecutor.getSummary();
      
      console.log(`Batch execution: ${summary.passedTests}/${summary.totalTests} passed`);
      console.log(`Memory violations: ${summary.memoryViolations}`);
      
      expect(summary.memoryViolations).toBe(0);
      expect(summary.passedTests).toBe(summary.totalTests);
      
      batchExecutor.cleanup();
    });
  });

  /**
   * Performance Regression Tests
   */
  describe('Performance Regression', () => {
    test('should maintain consistent performance across multiple runs', async () => {
      const runs = 5;
      const measurements: number[] = [];
      
      for (let i = 0; i < runs; i++) {
        const result = await executor.execute(['-5', '東京', '東海道線', '品川'], `consistency_run_${i + 1}`);
        
        expect(result.success).toBe(true);
        measurements.push(result.duration);
      }
      
      // Calculate statistics
      const average = measurements.reduce((sum, m) => sum + m, 0) / runs;
      const variance = measurements.reduce((sum, m) => sum + Math.pow(m - average, 2), 0) / runs;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / average;
      
      console.log(`Performance consistency over ${runs} runs:`);
      console.log(`  Average: ${average.toFixed(1)}ms`);
      console.log(`  Std Dev: ${stdDev.toFixed(1)}ms`);
      console.log(`  Coefficient of Variation: ${(coefficientOfVariation * 100).toFixed(1)}%`);
      
      // Expect reasonable consistency (coefficient of variation < 20%)
      expect(coefficientOfVariation).toBeLessThan(0.2);
      
      // All runs should meet performance requirements
      measurements.forEach(duration => {
        expect(duration).toBeLessThanOrEqual(CALCULATION_LIMIT);
      });
    });

    test('should handle concurrent execution efficiently', async () => {
      const concurrentTests = [
        executor.execute(['-5', '東京', '東海道線', '品川'], 'concurrent_1'),
        executor.execute(['-5', '新宿', '中央線', '立川'], 'concurrent_2'),
        executor.execute(['-5', '大阪', '東海道線', '京都'], 'concurrent_3')
      ];
      
      const startTime = performance.now();
      const results = await Promise.all(concurrentTests);
      const totalTime = performance.now() - startTime;
      
      // All tests should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.duration).toBeLessThanOrEqual(CALCULATION_LIMIT);
      });
      
      // Concurrent execution should not take much longer than individual tests
      const maxIndividualTime = Math.max(...results.map(r => r.duration));
      const concurrencyOverhead = totalTime - maxIndividualTime;
      
      console.log(`Concurrent execution: ${totalTime.toFixed(1)}ms total, ${concurrencyOverhead.toFixed(1)}ms overhead`);
      
      // Overhead should be reasonable (less than 1 second)
      expect(concurrencyOverhead).toBeLessThan(1000);
    });
  });

  /**
   * Error Scenario Performance Tests
   */
  describe('Error Scenario Performance', () => {
    test('should fail quickly with invalid parameters', async () => {
      const result = await executor.execute(['-5', 'InvalidStation'], 'invalid_param_performance');
      
      recordMeasurement(
        'Invalid parameter error',
        result.duration,
        result.memoryUsage?.peakHeapUsed || 0,
        'Error handling ≤500ms',
        500
      );
      
      expect(result.success).toBe(false);
      expect(result.duration).toBeLessThanOrEqual(500); // Should fail quickly
    });

    test('should handle missing arguments efficiently', async () => {
      const result = await executor.execute([], 'no_args_performance');
      
      recordMeasurement(
        'No arguments error',
        result.duration,
        result.memoryUsage?.peakHeapUsed || 0,
        'Error handling ≤500ms',
        500
      );
      
      expect(result.success).toBe(false);
      expect(result.duration).toBeLessThanOrEqual(500);
    });
  });
});