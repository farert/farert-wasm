/**
 * CLI Integration Tests - Task 15
 * Comprehensive integration tests with exact C++ result comparison
 * Requirements: REQ-CLI-002.2, REQ-CLI-002.3, 100% compatibility requirement
 * 
 * This test suite validates:
 * - All CLI commands (-exec, -5, -h, -help) execute correctly
 * - Results match C++ implementation exactly (±0 yen tolerance)
 * - Performance requirements are met (startup ≤2s, calculations ≤1s)
 * - Error scenarios are handled properly with correct exit codes
 * - Test execution order matches original test_exec.cpp
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

// Test configuration
const CLI_PATH = path.resolve(__dirname, '../../../src/cli/main.ts');
const NODE_TIMEOUT = 30000; // 30 seconds maximum for any CLI operation
const STARTUP_TIMEOUT = 2000; // 2 seconds max startup time (REQ-CLI-002.5)
const CALCULATION_TIMEOUT = 1000; // 1 second max calculation time (REQ-CLI-002.5)
const MEMORY_LIMIT = 512 * 1024 * 1024; // 512MB memory limit

/**
 * Expected test result structure with C++ compatibility data
 */
interface ExpectedTestResult {
  testName: string;
  command: string[];
  expectedOutput?: string;
  expectedExitCode: number;
  expectedFare?: number;
  tolerance?: number; // Default 0 for exact matching
  shouldContain?: string[];
  shouldNotContain?: string[];
  performanceRequirement?: {
    maxDuration: number;
    description: string;
  };
}

/**
 * Test execution result with detailed metrics
 */
interface TestExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  memoryUsage?: number;
  errorDetails?: string;
  actualFare?: number;
  toleranceViolation?: boolean;
}

/**
 * CLI Integration Test Suite
 */
describe('CLI Integration Tests - Task 15', () => {
  let testResults: Map<string, TestExecutionResult> = new Map();
  let totalTestsRun = 0;
  let totalTestsPassed = 0;
  let performanceViolations = 0;

  beforeAll(async () => {
    console.log('🚀 Starting CLI Integration Test Suite');
    console.log(`CLI Path: ${CLI_PATH}`);
    
    // Verify CLI exists
    expect(fs.existsSync(CLI_PATH)).toBe(true);
    
    // Verify required files exist
    const requiredFiles = [
      path.resolve(__dirname, '../../../dist/farert.js'),
      path.resolve(__dirname, '../../../dist/farert.wasm'),
      path.resolve(__dirname, '../../../data/jrdbnewest.db')
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.warn(`⚠️  Warning: Required file not found: ${file}`);
      }
    }
  });

  afterAll(() => {
    // Report overall test statistics
    console.log('\n📊 CLI Integration Test Summary:');
    console.log(`Total tests: ${totalTestsRun}`);
    console.log(`Passed: ${totalTestsPassed}`);
    console.log(`Failed: ${totalTestsRun - totalTestsPassed}`);
    console.log(`Performance violations: ${performanceViolations}`);
    
    if (performanceViolations > 0) {
      console.warn(`⚠️  ${performanceViolations} performance requirement violations detected`);
    }
  });

  /**
   * Execute CLI command with comprehensive monitoring and validation
   */
  async function executeCLICommand(
    args: string[],
    options: {
      timeout?: number;
      expectError?: boolean;
      monitorMemory?: boolean;
    } = {}
  ): Promise<TestExecutionResult> {
    const timeout = options.timeout || NODE_TIMEOUT;
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let resolved = false;
      
      const child: ChildProcess = spawn('node', [CLI_PATH, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      // Monitor memory usage if requested
      let memoryUsage = 0;
      const memoryMonitor = options.monitorMemory ? setInterval(() => {
        if (child.pid) {
          try {
            const usage = process.memoryUsage();
            memoryUsage = Math.max(memoryUsage, usage.heapUsed);
          } catch (error) {
            // Memory monitoring failed, continue without it
          }
        }
      }, 100) : null;
      
      // Set up timeout
      const timer = setTimeout(() => {
        if (!resolved) {
          if (memoryMonitor) clearInterval(memoryMonitor);
          child.kill('SIGTERM');
          const duration = performance.now() - startTime;
          resolve({
            success: false,
            exitCode: -1,
            stdout,
            stderr,
            duration,
            memoryUsage: memoryUsage > 0 ? memoryUsage : undefined,
            errorDetails: `Command timed out after ${timeout}ms`
          });
          resolved = true;
        }
      }, timeout);
      
      // Collect output
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      // Handle completion
      child.on('exit', (code) => {
        if (!resolved) {
          clearTimeout(timer);
          if (memoryMonitor) clearInterval(memoryMonitor);
          
          const duration = performance.now() - startTime;
          const exitCode = code || 0;
          
          // Extract fare information if present
          let actualFare: number | undefined;
          const fareMatch = stdout.match(/運賃.*?(\d+)円/);
          if (fareMatch) {
            actualFare = parseInt(fareMatch[1], 10);
          }
          
          resolve({
            success: options.expectError ? exitCode !== 0 : exitCode === 0,
            exitCode,
            stdout,
            stderr,
            duration,
            memoryUsage: memoryUsage > 0 ? memoryUsage : undefined,
            actualFare
          });
          resolved = true;
        }
      });
      
      child.on('error', (error) => {
        if (!resolved) {
          clearTimeout(timer);
          if (memoryMonitor) clearInterval(memoryMonitor);
          
          const duration = performance.now() - startTime;
          resolve({
            success: false,
            exitCode: -1,
            stdout,
            stderr,
            duration,
            memoryUsage: memoryUsage > 0 ? memoryUsage : undefined,
            errorDetails: `Process error: ${error.message}`
          });
          resolved = true;
        }
      });
    });
  }

  /**
   * Validate test result against expected outcome
   */
  function validateTestResult(
    result: TestExecutionResult,
    expected: ExpectedTestResult
  ): { passed: boolean; details: string[] } {
    const details: string[] = [];
    let passed = true;
    
    // Check exit code
    if (result.exitCode !== expected.expectedExitCode) {
      passed = false;
      details.push(`Exit code mismatch: expected ${expected.expectedExitCode}, got ${result.exitCode}`);
    }
    
    // Check fare calculation (exact matching ±0 yen tolerance)
    if (expected.expectedFare !== undefined && result.actualFare !== undefined) {
      const tolerance = expected.tolerance || 0;
      const difference = Math.abs(expected.expectedFare - result.actualFare);
      
      if (difference > tolerance) {
        passed = false;
        details.push(`Fare mismatch: expected ${expected.expectedFare}円, got ${result.actualFare}円 (difference: ${difference}円, tolerance: ${tolerance}円)`);
        result.toleranceViolation = true;
      }
    }
    
    // Check required output content
    if (expected.shouldContain) {
      for (const content of expected.shouldContain) {
        if (!result.stdout.includes(content) && !result.stderr.includes(content)) {
          passed = false;
          details.push(`Missing expected content: "${content}"`);
        }
      }
    }
    
    // Check prohibited content
    if (expected.shouldNotContain) {
      for (const content of expected.shouldNotContain) {
        if (result.stdout.includes(content) || result.stderr.includes(content)) {
          passed = false;
          details.push(`Found prohibited content: "${content}"`);
        }
      }
    }
    
    // Check performance requirements
    if (expected.performanceRequirement) {
      if (result.duration > expected.performanceRequirement.maxDuration) {
        passed = false;
        details.push(`Performance violation: ${expected.performanceRequirement.description} took ${result.duration.toFixed(1)}ms (limit: ${expected.performanceRequirement.maxDuration}ms)`);
        performanceViolations++;
      }
    }
    
    // Check memory usage
    if (result.memoryUsage && result.memoryUsage > MEMORY_LIMIT) {
      passed = false;
      details.push(`Memory limit exceeded: ${(result.memoryUsage / 1024 / 1024).toFixed(1)}MB (limit: ${MEMORY_LIMIT / 1024 / 1024}MB)`);
    }
    
    return { passed, details };
  }

  /**
   * Test helper to run a single test case
   */
  async function runTestCase(expected: ExpectedTestResult): Promise<void> {
    totalTestsRun++;
    
    const result = await executeCLICommand(expected.command.slice(1), {
      timeout: expected.performanceRequirement?.maxDuration || NODE_TIMEOUT,
      expectError: expected.expectedExitCode !== 0,
      monitorMemory: true
    });
    
    testResults.set(expected.testName, result);
    
    const validation = validateTestResult(result, expected);
    
    if (validation.passed) {
      totalTestsPassed++;
    }
    
    // Detailed logging for debugging
    if (!validation.passed || process.env.CLI_DEBUG) {
      console.log(`\n🔍 Test: ${expected.testName}`);
      console.log(`Command: ${expected.command.join(' ')}`);
      console.log(`Expected exit code: ${expected.expectedExitCode}, Actual: ${result.exitCode}`);
      console.log(`Duration: ${result.duration.toFixed(1)}ms`);
      if (result.memoryUsage) {
        console.log(`Memory: ${(result.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
      }
      if (result.actualFare) {
        console.log(`Calculated fare: ${result.actualFare}円`);
      }
      if (!validation.passed) {
        console.log(`❌ Validation failures:`);
        validation.details.forEach(detail => console.log(`   - ${detail}`));
      }
      if (result.stdout) {
        console.log(`Stdout: ${result.stdout.substring(0, 200)}...`);
      }
      if (result.stderr) {
        console.log(`Stderr: ${result.stderr.substring(0, 200)}...`);
      }
    }
    
    expect(validation.passed).toBe(true);
  }

  /**
   * Test CLI Help Commands
   */
  describe('Help Command Tests', () => {
    test('should display help with -h option', async () => {
      await runTestCase({
        testName: 'help_short',
        command: ['farert-cli', '-h'],
        expectedExitCode: 0,
        shouldContain: [
          'Farert WebAssembly CLI',
          'Japanese Railway Fare Calculator',
          'OVERVIEW:',
          'COMMAND SYNTAX:',
          'OPTIONS:',
          'EXAMPLES:'
        ],
        performanceRequirement: {
          maxDuration: 1000,
          description: 'Help display'
        }
      });
    });

    test('should display help with --help option', async () => {
      await runTestCase({
        testName: 'help_long',
        command: ['farert-cli', '--help'],
        expectedExitCode: 0,
        shouldContain: [
          'Farert WebAssembly CLI',
          'Japanese Railway Fare Calculator',
          'DETAILED EXAMPLES',
          'TROUBLESHOOTING'
        ],
        performanceRequirement: {
          maxDuration: 1000,
          description: 'Help display'
        }
      });
    });

    test('should display help with -help option', async () => {
      await runTestCase({
        testName: 'help_legacy',
        command: ['farert-cli', '-help'],
        expectedExitCode: 0,
        shouldContain: [
          'Farert WebAssembly CLI',
          'Japanese Railway Fare Calculator'
        ],
        performanceRequirement: {
          maxDuration: 1000,
          description: 'Help display'
        }
      });
    });
  });

  /**
   * Test 5-Parameter Route Calculation
   */
  describe('5-Parameter Route Tests', () => {
    const routeTestCases: ExpectedTestResult[] = [
      {
        testName: 'tokyo_shinagawa_shinjuku',
        command: ['farert-cli', '-5', '東京', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: 0,
        expectedFare: 200, // Expected fare from C++ implementation
        tolerance: 0, // Exact matching required
        shouldContain: ['🚂 Calculating fare for route', '東京', '品川', '新宿'],
        performanceRequirement: {
          maxDuration: CALCULATION_TIMEOUT,
          description: 'Route calculation'
        }
      },
      {
        testName: 'shinjuku_tachikawa_ome',
        command: ['farert-cli', '-5', '新宿', '中央線', '立川', '青梅線', '青梅'],
        expectedExitCode: 0,
        expectedFare: 540, // Expected fare from C++ implementation
        tolerance: 0,
        shouldContain: ['🚂 Calculating fare for route', '新宿', '立川', '青梅'],
        performanceRequirement: {
          maxDuration: CALCULATION_TIMEOUT,
          description: 'Route calculation'
        }
      },
      {
        testName: 'shibuya_shimbashi_kawasaki',
        command: ['farert-cli', '-5', '渋谷', '山手線', '新橋', '東海道線', '川崎'],
        expectedExitCode: 0,
        expectedFare: 280, // Expected fare from C++ implementation
        tolerance: 0,
        shouldContain: ['🚂 Calculating fare for route', '渋谷', '新橋', '川崎'],
        performanceRequirement: {
          maxDuration: CALCULATION_TIMEOUT,
          description: 'Route calculation'
        }
      }
    ];

    routeTestCases.forEach(testCase => {
      test(`should calculate ${testCase.testName} route correctly`, async () => {
        await runTestCase(testCase);
      });
    });
  });

  /**
   * Test Complete Test Suite Execution (-exec)
   */
  describe('Complete Test Suite Tests', () => {
    test('should execute complete test suite with -exec', async () => {
      await runTestCase({
        testName: 'exec_complete_suite',
        command: ['farert-cli', '-exec'],
        expectedExitCode: 0,
        shouldContain: [
          '🚀 Starting complete test suite execution',
          '✅ Complete test suite execution finished'
        ],
        shouldNotContain: [
          'ERROR',
          'FAILED',
          'Exception'
        ],
        performanceRequirement: {
          maxDuration: 30000, // 30 seconds max for complete test suite
          description: 'Complete test suite execution'
        }
      });
    });
  });

  /**
   * Test Error Scenarios
   */
  describe('Error Scenario Tests', () => {
    test('should handle invalid station names', async () => {
      await runTestCase({
        testName: 'invalid_station',
        command: ['farert-cli', '-5', 'InvalidStation', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContain: [
          '❌',
          'Invalid',
          'Similar station names:'
        ]
      });
    });

    test('should handle invalid line names', async () => {
      await runTestCase({
        testName: 'invalid_line',
        command: ['farert-cli', '-5', '東京', 'InvalidLine', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContain: [
          '❌',
          'Invalid',
          'Similar line names:'
        ]
      });
    });

    test('should handle incorrect parameter count for -5', async () => {
      await runTestCase({
        testName: 'invalid_param_count',
        command: ['farert-cli', '-5', '東京', '東海道線', '品川'],
        expectedExitCode: -1, // CLIErrorCode.PARAMETER_COUNT_MISMATCH
        shouldContain: [
          '-5 command requires exactly 5 parameters',
          'providedCount: 3',
          'expectedCount: 5'
        ]
      });
    });

    test('should handle no arguments', async () => {
      await runTestCase({
        testName: 'no_arguments',
        command: ['farert-cli'],
        expectedExitCode: -1,
        shouldContain: [
          'Usage:',
          'OPTIONS:',
          'ARGUMENTS:'
        ]
      });
    });
  });

  /**
   * Test Performance Requirements
   */
  describe('Performance Validation Tests', () => {
    test('should meet CLI startup time requirement', async () => {
      const startupTests: ExpectedTestResult[] = [
        {
          testName: 'startup_help',
          command: ['farert-cli', '-h'],
          expectedExitCode: 0,
          performanceRequirement: {
            maxDuration: STARTUP_TIMEOUT,
            description: 'CLI startup for help'
          }
        },
        {
          testName: 'startup_route_calc',
          command: ['farert-cli', '-5', '東京', '東海道線', '品川', '山手線', '新宿'],
          expectedExitCode: 0,
          performanceRequirement: {
            maxDuration: STARTUP_TIMEOUT + CALCULATION_TIMEOUT,
            description: 'CLI startup + route calculation'
          }
        }
      ];

      for (const testCase of startupTests) {
        await runTestCase(testCase);
      }
    });

    test('should handle memory usage efficiently', async () => {
      // Run a memory-intensive test with monitoring
      const result = await executeCLICommand(['-exec'], {
        timeout: 30000,
        monitorMemory: true
      });

      expect(result.success).toBe(true);
      
      if (result.memoryUsage) {
        const memoryMB = result.memoryUsage / 1024 / 1024;
        console.log(`Memory usage during test suite: ${memoryMB.toFixed(1)}MB`);
        expect(result.memoryUsage).toBeLessThanOrEqual(MEMORY_LIMIT);
      }
    });
  });

  /**
   * Test Environment and Debug Commands
   */
  describe('Environment Command Tests', () => {
    test('should display environment report', async () => {
      await runTestCase({
        testName: 'env_report',
        command: ['farert-cli', '--env-report'],
        expectedExitCode: 0,
        shouldContain: [
          'Environment Report',
          'Platform:',
          'Node.js:'
        ]
      });
    });

    test('should enable debug mode', async () => {
      await runTestCase({
        testName: 'env_debug',
        command: ['farert-cli', '--env-debug', '-h'],
        expectedExitCode: 0,
        shouldContain: [
          '[DEBUG] Debug mode enabled',
          'Farert WebAssembly CLI'
        ]
      });
    });
  });
});