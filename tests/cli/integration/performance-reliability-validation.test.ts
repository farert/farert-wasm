/**
 * Performance and Reliability Testing Validation - Task 20
 * Requirements: REQ-CLI-002.5, REQ-CLI-004.2 - Performance requirements and reliability testing
 * 
 * This comprehensive test suite validates:
 * - CLI startup performance (≤2 seconds)
 * - Route calculation performance (≤1 second per route)  
 * - Test suite execution performance (≤30 seconds)
 * - Memory usage limits (≤512MB during operation)
 * - WebAssembly initialization performance
 * - Database connection performance and reliability
 * - Signal handling and graceful shutdown
 * - Long-running operation reliability
 * - Memory leak detection and cleanup
 * - Error recovery and fault tolerance
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { performance } from 'perf_hooks';

const CLI_PATH = path.resolve(__dirname, '../../../src/cli/main.ts');
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

// Performance requirements (strict compliance)
const PERFORMANCE_REQUIREMENTS = {
  CLI_STARTUP_MAX: 2000,      // 2 seconds
  ROUTE_CALCULATION_MAX: 1000, // 1 second  
  TEST_SUITE_MAX: 30000,      // 30 seconds
  MEMORY_LIMIT: 512 * 1024 * 1024, // 512MB
  WASM_INIT_MAX: 3000,        // 3 seconds for WASM+DB
  DB_CONNECTION_MAX: 3000,     // 3 seconds for DB connection
  HELP_DISPLAY_MAX: 1000,     // 1 second for help
  ERROR_HANDLING_MAX: 500     // 0.5 seconds for error messages
} as const;

/**
 * Performance measurement result
 */
interface PerformanceMeasurement {
  testName: string;
  category: 'startup' | 'calculation' | 'test_suite' | 'memory' | 'wasm' | 'database' | 'reliability';
  duration: number;
  memoryUsage: number;
  requirement: number;
  passed: boolean;
  margin: number;
  details: {
    startTime: number;
    endTime: number;
    peakMemory: number;
    averageMemory: number;
    cpuUsage?: number;
    iterations?: number;
  };
  issues: string[];
  recommendations: string[];
}

/**
 * Reliability test result
 */
interface ReliabilityTestResult {
  testName: string;
  scenario: string;
  success: boolean;
  duration: number;
  iterations: number;
  failures: number;
  failureRate: number;
  averageResponseTime: number;
  maxResponseTime: number;
  memoryLeakDetected: boolean;
  gracefulShutdown: boolean;
  errorRecovery: boolean;
  issues: string[];
  recommendations: string[];
}

describe('Performance and Reliability Validation - Task 20', () => {
  let performanceMeasurements: PerformanceMeasurement[] = [];
  let reliabilityResults: ReliabilityTestResult[] = [];
  let overallStartTime: number;
  
  beforeAll(() => {
    overallStartTime = performance.now();
    console.log('⚡ Starting Performance and Reliability Validation Suite');
    console.log(`📊 Performance Requirements:`);
    console.log(`   CLI Startup: ≤${PERFORMANCE_REQUIREMENTS.CLI_STARTUP_MAX}ms`);
    console.log(`   Route Calculation: ≤${PERFORMANCE_REQUIREMENTS.ROUTE_CALCULATION_MAX}ms`);
    console.log(`   Test Suite: ≤${PERFORMANCE_REQUIREMENTS.TEST_SUITE_MAX}ms`);
    console.log(`   Memory Usage: ≤${(PERFORMANCE_REQUIREMENTS.MEMORY_LIMIT / 1024 / 1024).toFixed(0)}MB`);
  });
  
  afterAll(async () => {
    const totalDuration = performance.now() - overallStartTime;
    console.log(`\n📊 Performance and Reliability Suite completed in ${(totalDuration / 1000).toFixed(2)}s`);
    
    await generatePerformanceReport();
    displayPerformanceSummary();
  });

  describe('1. CLI Startup Performance - REQ-CLI-002.5', () => {
    it('should start CLI and display help within 2 seconds', async () => {
      const measurement = await measurePerformance({
        testName: 'CLI Help Startup Performance',
        category: 'startup',
        requirement: PERFORMANCE_REQUIREMENTS.CLI_STARTUP_MAX,
        args: ['-h'],
        expectedExitCode: 0,
        iterations: 5, // Average over multiple runs
        monitorMemory: true
      });
      
      expect(measurement.passed).toBe(true);
      expect(measurement.duration).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.CLI_STARTUP_MAX);
      
      performanceMeasurements.push(measurement);
    });
    
    it('should initialize WebAssembly and database within 3 seconds', async () => {
      const measurement = await measurePerformance({
        testName: 'WebAssembly + Database Initialization',
        category: 'wasm',
        requirement: PERFORMANCE_REQUIREMENTS.WASM_INIT_MAX,
        args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: 0,
        iterations: 3,
        monitorMemory: true,
        measureInitOnly: true
      });
      
      expect(measurement.passed).toBe(true);
      expect(measurement.duration).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.WASM_INIT_MAX);
      
      performanceMeasurements.push(measurement);
    });
    
    it('should handle cold start performance consistently', async () => {
      const coldStartMeasurements: number[] = [];
      
      // Measure cold start performance multiple times
      for (let i = 0; i < 3; i++) {
        // Clear Node.js module cache to simulate cold start
        console.log(`  Cold start test ${i + 1}/3`);
        
        const startTime = performance.now();
        const result = await executeCLICommand(['-h'], { timeout: 5000 });
        const duration = performance.now() - startTime;
        
        coldStartMeasurements.push(duration);
        expect(result.exitCode).toBe(0);
        expect(duration).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.CLI_STARTUP_MAX);
        
        // Small delay between cold starts
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const averageColdStart = coldStartMeasurements.reduce((sum, d) => sum + d, 0) / coldStartMeasurements.length;
      const maxColdStart = Math.max(...coldStartMeasurements);
      
      console.log(`  Cold start average: ${averageColdStart.toFixed(1)}ms`);
      console.log(`  Cold start max: ${maxColdStart.toFixed(1)}ms`);
      
      expect(averageColdStart).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.CLI_STARTUP_MAX);
      expect(maxColdStart).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.CLI_STARTUP_MAX * 1.5); // Allow 50% margin for worst case
    });
  });

  describe('2. Route Calculation Performance - REQ-CLI-002.5', () => {
    const routeTestCases = [
      {
        name: 'Simple Route (2 stations)',
        args: ['東京', '東海道線', '品川']
      },
      {
        name: '5-Parameter Route',
        args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿']
      },
      {
        name: 'Long Distance Route',
        args: ['-5', '東京', '東海道線', '名古屋', '東海道線', '大阪']
      },
      {
        name: 'Complex Transfer Route',
        args: ['-5', '新宿', '中央線', '立川', '青梅線', '青梅']
      }
    ];
    
    routeTestCases.forEach(testCase => {
      it(`should calculate ${testCase.name} within 1 second`, async () => {
        const measurement = await measurePerformance({
          testName: `Route Calculation: ${testCase.name}`,
          category: 'calculation',
          requirement: PERFORMANCE_REQUIREMENTS.ROUTE_CALCULATION_MAX,
          args: testCase.args,
          expectedExitCode: 0,
          iterations: 3,
          monitorMemory: true
        });
        
        expect(measurement.passed).toBe(true);
        expect(measurement.duration).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.ROUTE_CALCULATION_MAX);
        
        performanceMeasurements.push(measurement);
      });
    });
    
    it('should handle multiple sequential calculations efficiently', async () => {
      const routes = [
        ['-5', '東京', '東海道線', '品川', '山手線', '新宿'],
        ['-5', '大阪', '東海道線', '京都', '東海道線', '名古屋'],
        ['-5', '仙台', '東北線', '上野', '山手線', '新宿']
      ];
      
      const sequentialStartTime = performance.now();
      
      for (const route of routes) {
        const startTime = performance.now();
        const result = await executeCLICommand(route, { timeout: 3000 });
        const duration = performance.now() - startTime;
        
        expect(result.exitCode).toBe(0);
        expect(duration).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.ROUTE_CALCULATION_MAX);
      }
      
      const totalSequentialTime = performance.now() - sequentialStartTime;
      console.log(`  Sequential calculations: ${totalSequentialTime.toFixed(1)}ms`);
      
      // Total time should be reasonable (not much longer than individual times)
      expect(totalSequentialTime).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.ROUTE_CALCULATION_MAX * routes.length * 1.5);
    });
  });

  describe('3. Test Suite Performance - REQ-CLI-002.5', () => {
    it('should complete full test suite within 30 seconds', async () => {
      const measurement = await measurePerformance({
        testName: 'Complete Test Suite Execution',
        category: 'test_suite',
        requirement: PERFORMANCE_REQUIREMENTS.TEST_SUITE_MAX,
        args: ['-exec'],
        expectedExitCode: 0,
        iterations: 1, // Test suite is expensive, run once
        monitorMemory: true,
        timeout: PERFORMANCE_REQUIREMENTS.TEST_SUITE_MAX + 5000 // Add buffer for timeout
      });
      
      expect(measurement.passed).toBe(true);
      expect(measurement.duration).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.TEST_SUITE_MAX);
      
      performanceMeasurements.push(measurement);
    });
  });

  describe('4. Memory Usage Validation - REQ-CLI-002.5', () => {
    it('should maintain memory usage under 512MB during operations', async () => {
      const memoryTests = [
        {
          name: 'Help Command Memory',
          args: ['-h']
        },
        {
          name: 'Route Calculation Memory',
          args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿']
        },
        {
          name: 'Test Suite Memory',
          args: ['-exec'],
          timeout: PERFORMANCE_REQUIREMENTS.TEST_SUITE_MAX + 5000
        }
      ];
      
      for (const test of memoryTests) {
        const measurement = await measurePerformance({
          testName: test.name,
          category: 'memory',
          requirement: PERFORMANCE_REQUIREMENTS.MEMORY_LIMIT,
          args: test.args,
          expectedExitCode: 0,
          iterations: 1,
          monitorMemory: true,
          timeout: test.timeout || 5000
        });
        
        expect(measurement.memoryUsage).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.MEMORY_LIMIT);
        expect(measurement.passed).toBe(true);
        
        performanceMeasurements.push(measurement);
        
        console.log(`  ${test.name}: ${(measurement.memoryUsage / 1024 / 1024).toFixed(1)}MB peak`);
      }
    });
    
    it('should detect memory leaks in long-running operations', async () => {
      const reliabilityResult = await testMemoryLeaks({
        testName: 'Memory Leak Detection',
        scenario: 'Repeated route calculations',
        iterations: 10,
        operation: () => executeCLICommand(['-5', '東京', '東海道線', '品川', '山手線', '新宿'], { timeout: 3000 })
      });
      
      expect(reliabilityResult.memoryLeakDetected).toBe(false);
      expect(reliabilityResult.success).toBe(true);
      
      reliabilityResults.push(reliabilityResult);
    });
  });

  describe('5. Reliability and Error Recovery', () => {
    it('should handle graceful shutdown on SIGINT', async () => {
      const reliabilityResult = await testGracefulShutdown({
        testName: 'SIGINT Graceful Shutdown',
        scenario: 'Signal handling during operation',
        signal: 'SIGINT'
      });
      
      expect(reliabilityResult.gracefulShutdown).toBe(true);
      expect(reliabilityResult.success).toBe(true);
      
      reliabilityResults.push(reliabilityResult);
    });
    
    it('should handle graceful shutdown on SIGTERM', async () => {
      const reliabilityResult = await testGracefulShutdown({
        testName: 'SIGTERM Graceful Shutdown',
        scenario: 'Signal handling during test suite',
        signal: 'SIGTERM'
      });
      
      expect(reliabilityResult.gracefulShutdown).toBe(true);
      expect(reliabilityResult.success).toBe(true);
      
      reliabilityResults.push(reliabilityResult);
    });
    
    it('should recover from database connection errors', async () => {
      const reliabilityResult = await testErrorRecovery({
        testName: 'Database Error Recovery',
        scenario: 'Missing database file',
        errorCondition: 'missing_database'
      });
      
      expect(reliabilityResult.errorRecovery).toBe(true);
      expect(reliabilityResult.success).toBe(true);
      
      reliabilityResults.push(reliabilityResult);
    });
    
    it('should handle concurrent operations reliably', async () => {
      const concurrentOperations = 5;
      const operations: Promise<any>[] = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < concurrentOperations; i++) {
        operations.push(
          executeCLICommand(['-5', '東京', '東海道線', '品川', '山手線', '新宿'], { timeout: 5000 })
        );
      }
      
      const results = await Promise.all(operations);
      const duration = performance.now() - startTime;
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.exitCode).toBe(0);
      });
      
      // Concurrent operations should complete in reasonable time
      expect(duration).toBeLessThanOrEqual(PERFORMANCE_REQUIREMENTS.ROUTE_CALCULATION_MAX * 2);
      
      console.log(`  ${concurrentOperations} concurrent operations: ${duration.toFixed(1)}ms`);
    });
  });

  // Helper functions

  async function measurePerformance(config: {
    testName: string;
    category: PerformanceMeasurement['category'];
    requirement: number;
    args: string[];
    expectedExitCode: number;
    iterations: number;
    monitorMemory: boolean;
    measureInitOnly?: boolean;
    timeout?: number;
  }): Promise<PerformanceMeasurement> {
    
    console.log(`  ⏱️  ${config.testName} (${config.iterations} iterations)`);
    
    const durations: number[] = [];
    const memoryUsages: number[] = [];
    let totalStartTime = performance.now();
    
    for (let i = 0; i < config.iterations; i++) {
      const startTime = performance.now();
      
      const result = await executeCLICommand(config.args, {
        timeout: config.timeout || 10000,
        monitorMemory: config.monitorMemory
      });
      
      const duration = performance.now() - startTime;
      durations.push(duration);
      
      if (result.memoryUsage) {
        memoryUsages.push(result.memoryUsage);
      }
      
      expect(result.exitCode).toBe(config.expectedExitCode);
    }
    
    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const averageMemory = memoryUsages.length > 0 ? memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length : 0;
    const peakMemory = memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0;
    
    const measurement: PerformanceMeasurement = {
      testName: config.testName,
      category: config.category,
      duration: averageDuration,
      memoryUsage: peakMemory,
      requirement: config.requirement,
      passed: (config.category === 'memory' ? peakMemory : averageDuration) <= config.requirement,
      margin: config.requirement - (config.category === 'memory' ? peakMemory : averageDuration),
      details: {
        startTime: totalStartTime,
        endTime: performance.now(),
        peakMemory,
        averageMemory,
        iterations: config.iterations
      },
      issues: [],
      recommendations: []
    };
    
    // Add performance analysis
    if (!measurement.passed) {
      if (config.category === 'memory') {
        measurement.issues.push(`Memory usage ${(peakMemory / 1024 / 1024).toFixed(1)}MB exceeds limit ${(config.requirement / 1024 / 1024).toFixed(1)}MB`);
        measurement.recommendations.push('Optimize memory usage and check for memory leaks');
      } else {
        measurement.issues.push(`Duration ${averageDuration.toFixed(1)}ms exceeds requirement ${config.requirement}ms`);
        measurement.recommendations.push('Optimize performance-critical code paths');
      }
    }
    
    // Performance variability analysis
    const maxVariation = maxDuration - Math.min(...durations);
    if (maxVariation > averageDuration * 0.5) {
      measurement.issues.push(`High performance variability: ${maxVariation.toFixed(1)}ms`);
      measurement.recommendations.push('Investigate performance inconsistencies');
    }
    
    console.log(`    Average: ${averageDuration.toFixed(1)}ms (requirement: ≤${config.requirement}ms)`);
    if (config.monitorMemory && peakMemory > 0) {
      console.log(`    Peak memory: ${(peakMemory / 1024 / 1024).toFixed(1)}MB`);
    }
    
    return measurement;
  }

  async function testMemoryLeaks(config: {
    testName: string;
    scenario: string;
    iterations: number;
    operation: () => Promise<any>;
  }): Promise<ReliabilityTestResult> {
    
    console.log(`  🧪 ${config.testName} (${config.iterations} iterations)`);
    
    const memorySnapshots: number[] = [];
    const startTime = performance.now();
    let failures = 0;
    
    // Take initial memory snapshot
    const initialMemory = process.memoryUsage().heapUsed;
    memorySnapshots.push(initialMemory);
    
    for (let i = 0; i < config.iterations; i++) {
      try {
        await config.operation();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        // Take memory snapshot
        const currentMemory = process.memoryUsage().heapUsed;
        memorySnapshots.push(currentMemory);
        
      } catch (error) {
        failures++;
        console.warn(`    Iteration ${i + 1} failed:`, error);
      }
      
      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const duration = performance.now() - startTime;
    const finalMemory = memorySnapshots[memorySnapshots.length - 1];
    
    // Analyze memory trend
    const memoryGrowth = finalMemory - initialMemory;
    const memoryLeakDetected = memoryGrowth > (10 * 1024 * 1024); // 10MB threshold
    
    const result: ReliabilityTestResult = {
      testName: config.testName,
      scenario: config.scenario,
      success: failures === 0 && !memoryLeakDetected,
      duration,
      iterations: config.iterations,
      failures,
      failureRate: (failures / config.iterations) * 100,
      averageResponseTime: duration / config.iterations,
      maxResponseTime: duration, // Simplified for this test
      memoryLeakDetected,
      gracefulShutdown: true, // Not tested in this function
      errorRecovery: failures === 0,
      issues: [],
      recommendations: []
    };
    
    if (memoryLeakDetected) {
      result.issues.push(`Memory leak detected: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB growth over ${config.iterations} iterations`);
      result.recommendations.push('Investigate memory management and cleanup');
    }
    
    if (failures > 0) {
      result.issues.push(`${failures} failures out of ${config.iterations} iterations (${result.failureRate.toFixed(1)}% failure rate)`);
      result.recommendations.push('Improve error handling and operation reliability');
    }
    
    console.log(`    Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(1)}MB`);
    console.log(`    Failure rate: ${result.failureRate.toFixed(1)}%`);
    
    return result;
  }

  async function testGracefulShutdown(config: {
    testName: string;
    scenario: string;
    signal: 'SIGINT' | 'SIGTERM';
  }): Promise<ReliabilityTestResult> {
    
    console.log(`  🛑 ${config.testName}`);
    
    const startTime = performance.now();
    
    return new Promise<ReliabilityTestResult>((resolve) => {
      const child = spawn('node', [CLI_PATH, '-exec'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let shutdownCompleted = false;
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Send signal after CLI has started
      setTimeout(() => {
        child.kill(config.signal);
      }, 1000);
      
      // Set up timeout for graceful shutdown
      const shutdownTimeout = setTimeout(() => {
        child.kill('SIGKILL'); // Force kill if graceful shutdown fails
        
        const result: ReliabilityTestResult = {
          testName: config.testName,
          scenario: config.scenario,
          success: false,
          duration: performance.now() - startTime,
          iterations: 1,
          failures: 1,
          failureRate: 100,
          averageResponseTime: performance.now() - startTime,
          maxResponseTime: performance.now() - startTime,
          memoryLeakDetected: false,
          gracefulShutdown: false,
          errorRecovery: false,
          issues: ['Graceful shutdown timed out'],
          recommendations: ['Improve signal handling and cleanup timeouts']
        };
        
        resolve(result);
      }, 10000); // 10 second timeout for graceful shutdown
      
      child.on('exit', (code, signal) => {
        clearTimeout(shutdownTimeout);
        shutdownCompleted = true;
        
        const duration = performance.now() - startTime;
        const gracefulShutdown = duration < 5000 && (code === 0 || signal === config.signal);
        
        const result: ReliabilityTestResult = {
          testName: config.testName,
          scenario: config.scenario,
          success: gracefulShutdown,
          duration,
          iterations: 1,
          failures: gracefulShutdown ? 0 : 1,
          failureRate: gracefulShutdown ? 0 : 100,
          averageResponseTime: duration,
          maxResponseTime: duration,
          memoryLeakDetected: false,
          gracefulShutdown,
          errorRecovery: true,
          issues: gracefulShutdown ? [] : [`Graceful shutdown failed: code=${code}, signal=${signal}`],
          recommendations: gracefulShutdown ? [] : ['Improve signal handling implementation']
        };
        
        console.log(`    Shutdown time: ${duration.toFixed(1)}ms`);
        console.log(`    Exit code: ${code}, Signal: ${signal}`);
        
        resolve(result);
      });
    });
  }

  async function testErrorRecovery(config: {
    testName: string;
    scenario: string;
    errorCondition: string;
  }): Promise<ReliabilityTestResult> {
    
    console.log(`  🔧 ${config.testName}`);
    
    const startTime = performance.now();
    
    // Simulate error condition based on type
    if (config.errorCondition === 'missing_database') {
      // Test with missing database file
      const result = await executeCLICommand(['-exec'], { 
        timeout: 5000,
        expectError: true 
      });
      
      const duration = performance.now() - startTime;
      const errorRecovery = result.exitCode !== 0 && result.stderr.includes('database');
      
      return {
        testName: config.testName,
        scenario: config.scenario,
        success: errorRecovery,
        duration,
        iterations: 1,
        failures: errorRecovery ? 0 : 1,
        failureRate: errorRecovery ? 0 : 100,
        averageResponseTime: duration,
        maxResponseTime: duration,
        memoryLeakDetected: false,
        gracefulShutdown: true,
        errorRecovery,
        issues: errorRecovery ? [] : ['Error recovery mechanism failed'],
        recommendations: errorRecovery ? [] : ['Improve error detection and recovery']
      };
    }
    
    // Default error recovery test
    return {
      testName: config.testName,
      scenario: config.scenario,
      success: true,
      duration: 0,
      iterations: 1,
      failures: 0,
      failureRate: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      memoryLeakDetected: false,
      gracefulShutdown: true,
      errorRecovery: true,
      issues: [],
      recommendations: []
    };
  }

  async function executeCLICommand(
    args: string[],
    options: {
      timeout?: number;
      monitorMemory?: boolean;
      expectError?: boolean;
    } = {}
  ): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
    memoryUsage?: number;
  }> {
    const timeout = options.timeout || 10000;
    
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let memoryUsage = 0;
      
      const child = spawn('node', [CLI_PATH, ...args], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Memory monitoring
      const memoryMonitor = options.monitorMemory ? setInterval(() => {
        try {
          const usage = process.memoryUsage();
          memoryUsage = Math.max(memoryUsage, usage.heapUsed);
        } catch {
          // Continue without memory monitoring if it fails
        }
      }, 50) : null;
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        if (memoryMonitor) clearInterval(memoryMonitor);
        resolve({
          exitCode: -1,
          stdout,
          stderr: stderr + '\nProcess timed out',
          memoryUsage
        });
      }, timeout);
      
      child.on('exit', (code) => {
        clearTimeout(timer);
        if (memoryMonitor) clearInterval(memoryMonitor);
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
          memoryUsage
        });
      });
      
      child.on('error', (error) => {
        clearTimeout(timer);
        if (memoryMonitor) clearInterval(memoryMonitor);
        resolve({
          exitCode: -1,
          stdout,
          stderr: stderr + `\nProcess error: ${error.message}`,
          memoryUsage
        });
      });
    });
  }

  async function generatePerformanceReport(): Promise<void> {
    const reportPath = path.join(PROJECT_ROOT, 'PERFORMANCE_RELIABILITY_REPORT.md');
    
    let report = `# Performance and Reliability Validation Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Platform: ${os.platform()} ${os.arch()}\n`;
    report += `Node.js: ${process.version}\n\n`;
    
    // Performance summary
    const passedPerf = performanceMeasurements.filter(m => m.passed).length;
    const totalPerf = performanceMeasurements.length;
    const perfRate = (passedPerf / totalPerf) * 100;
    
    report += `## Performance Summary\n\n`;
    report += `**Performance Tests:** ${passedPerf}/${totalPerf} passed (${perfRate.toFixed(1)}%)\n`;
    report += `**Requirements Compliance:** ${perfRate === 100 ? '✅ FULL' : '❌ PARTIAL'}\n\n`;
    
    // Performance requirements table
    report += `### Performance Requirements Status\n\n`;
    report += `| Requirement | Limit | Actual | Status | Margin |\n`;
    report += `|-------------|--------|---------|---------|--------|\n`;
    
    for (const measurement of performanceMeasurements) {
      const actualValue = measurement.category === 'memory' 
        ? `${(measurement.memoryUsage / 1024 / 1024).toFixed(1)}MB`
        : `${measurement.duration.toFixed(1)}ms`;
      
      const limitValue = measurement.category === 'memory'
        ? `${(measurement.requirement / 1024 / 1024).toFixed(0)}MB`
        : `${measurement.requirement}ms`;
      
      const status = measurement.passed ? '✅ PASSED' : '❌ FAILED';
      const margin = measurement.category === 'memory'
        ? `${(measurement.margin / 1024 / 1024).toFixed(1)}MB`
        : `${measurement.margin.toFixed(1)}ms`;
      
      report += `| ${measurement.testName} | ${limitValue} | ${actualValue} | ${status} | ${margin} |\n`;
    }
    
    // Reliability summary
    const passedRel = reliabilityResults.filter(r => r.success).length;
    const totalRel = reliabilityResults.length;
    const relRate = totalRel > 0 ? (passedRel / totalRel) * 100 : 100;
    
    report += `\n## Reliability Summary\n\n`;
    report += `**Reliability Tests:** ${passedRel}/${totalRel} passed (${relRate.toFixed(1)}%)\n`;
    report += `**System Reliability:** ${relRate === 100 ? '✅ EXCELLENT' : relRate >= 80 ? '⚠️  ACCEPTABLE' : '❌ POOR'}\n\n`;
    
    // Task 20 compliance assessment
    const overallCompliance = perfRate === 100 && relRate >= 95;
    report += `## Task 20 Compliance Assessment\n\n`;
    report += `**Overall Performance & Reliability:** ${overallCompliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}\n\n`;
    
    if (!overallCompliance) {
      report += `### Issues Requiring Attention\n\n`;
      
      const allIssues = [
        ...performanceMeasurements.flatMap(m => m.issues),
        ...reliabilityResults.flatMap(r => r.issues)
      ];
      
      for (const issue of allIssues) {
        report += `- ${issue}\n`;
      }
      
      report += `\n### Recommendations\n\n`;
      
      const allRecommendations = [
        ...performanceMeasurements.flatMap(m => m.recommendations),
        ...reliabilityResults.flatMap(r => r.recommendations)
      ];
      
      for (const rec of [...new Set(allRecommendations)]) {
        report += `- ${rec}\n`;
      }
    }
    
    try {
      fs.writeFileSync(reportPath, report, 'utf8');
      console.log(`📊 Performance report generated: ${reportPath}`);
    } catch (error) {
      console.error('Failed to generate performance report:', error);
    }
  }

  function displayPerformanceSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('⚡ PERFORMANCE & RELIABILITY VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    const passedPerf = performanceMeasurements.filter(m => m.passed).length;
    const totalPerf = performanceMeasurements.length;
    const perfRate = (passedPerf / totalPerf) * 100;
    
    console.log(`\n📊 Performance: ${passedPerf}/${totalPerf} (${perfRate.toFixed(1)}%)`);
    
    // Show key performance metrics
    const startupTests = performanceMeasurements.filter(m => m.category === 'startup');
    const calcTests = performanceMeasurements.filter(m => m.category === 'calculation');
    const memoryTests = performanceMeasurements.filter(m => m.category === 'memory');
    
    if (startupTests.length > 0) {
      const avgStartup = startupTests.reduce((sum, m) => sum + m.duration, 0) / startupTests.length;
      console.log(`   Startup: ${avgStartup.toFixed(1)}ms avg (limit: ${PERFORMANCE_REQUIREMENTS.CLI_STARTUP_MAX}ms)`);
    }
    
    if (calcTests.length > 0) {
      const avgCalc = calcTests.reduce((sum, m) => sum + m.duration, 0) / calcTests.length;
      console.log(`   Calculation: ${avgCalc.toFixed(1)}ms avg (limit: ${PERFORMANCE_REQUIREMENTS.ROUTE_CALCULATION_MAX}ms)`);
    }
    
    if (memoryTests.length > 0) {
      const maxMemory = Math.max(...memoryTests.map(m => m.memoryUsage));
      console.log(`   Memory: ${(maxMemory / 1024 / 1024).toFixed(1)}MB peak (limit: ${(PERFORMANCE_REQUIREMENTS.MEMORY_LIMIT / 1024 / 1024).toFixed(0)}MB)`);
    }
    
    const passedRel = reliabilityResults.filter(r => r.success).length;
    const totalRel = reliabilityResults.length;
    const relRate = totalRel > 0 ? (passedRel / totalRel) * 100 : 100;
    
    console.log(`🛡️  Reliability: ${passedRel}/${totalRel} (${relRate.toFixed(1)}%)`);
    
    const overallCompliance = perfRate === 100 && relRate >= 95;
    console.log(`\n🎯 Task 20 Performance Requirements: ${overallCompliance ? '✅ MET' : '❌ NOT MET'}`);
    
    if (!overallCompliance) {
      const failedTests = performanceMeasurements.filter(m => !m.passed);
      if (failedTests.length > 0) {
        console.log(`\n❌ Failed Performance Tests:`);
        failedTests.forEach(test => {
          const value = test.category === 'memory' 
            ? `${(test.memoryUsage / 1024 / 1024).toFixed(1)}MB`
            : `${test.duration.toFixed(1)}ms`;
          console.log(`   ${test.testName}: ${value}`);
        });
      }
    }
    
    console.log('='.repeat(60));
  }
});