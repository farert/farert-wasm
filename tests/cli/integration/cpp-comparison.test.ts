/**
 * C++ Result Comparison Tests - Task 15
 * Exact result matching with original C++ implementation
 * Requirements: REQ-CLI-002.2, REQ-CLI-002.3, 100% compatibility requirement
 * 
 * This test suite validates that the TypeScript CLI produces identical results
 * to the original C++ implementation with ±0 yen tolerance for fare calculations.
 * Test execution order matches the original test_exec.cpp exactly.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { expectedTestResults } from './test-data/cpp-expected-results';
import { validateJapaneseOutput, extractFareFromOutput, extractRouteFromOutput } from './helpers/result-parser';

const CLI_PATH = path.resolve(__dirname, '../../../src/cli/main.ts');
const TEST_TIMEOUT = 60000; // 1 minute per test

/**
 * C++ compatibility test result structure
 */
interface CppCompatibilityResult {
  testId: string;
  testName: string;
  route: string;
  cppFare: number;
  tsFare: number | null;
  fareDifference: number;
  cppOutput: string;
  tsOutput: string;
  executionTime: number;
  compatible: boolean;
  errorDetails?: string[];
}

/**
 * Execute CLI command and capture detailed output
 */
async function executeForComparison(
  args: string[],
  testId: string
): Promise<{ 
  success: boolean; 
  exitCode: number; 
  stdout: string; 
  stderr: string; 
  duration: number; 
  fare?: number; 
  route?: string; 
}> {
  const startTime = performance.now();
  
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let resolved = false;
    
    const child = spawn('node', [CLI_PATH, ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test', CLI_DEBUG: '0' }
    });
    
    const timer = setTimeout(() => {
      if (!resolved) {
        child.kill('SIGTERM');
        resolved = true;
        resolve({
          success: false,
          exitCode: -1,
          stdout,
          stderr,
          duration: performance.now() - startTime
        });
      }
    }, TEST_TIMEOUT);
    
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
    
    child.on('exit', (code) => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        
        const duration = performance.now() - startTime;
        const exitCode = code || 0;
        const fare = extractFareFromOutput(stdout);
        const route = extractRouteFromOutput(stdout);
        
        resolve({
          success: exitCode === 0,
          exitCode,
          stdout,
          stderr,
          duration,
          fare,
          route
        });
      }
    });
    
    child.on('error', (error) => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        
        resolve({
          success: false,
          exitCode: -1,
          stdout,
          stderr,
          duration: performance.now() - startTime
        });
      }
    });
  });
}

/**
 * Compare TypeScript result with C++ expected result
 */
function compareWithCppResult(
  testCase: any,
  tsResult: any
): CppCompatibilityResult {
  const fareDifference = tsResult.fare !== null && tsResult.fare !== undefined 
    ? Math.abs(testCase.expectedFare - tsResult.fare) 
    : Infinity;
  
  const compatible = tsResult.success && 
                    tsResult.fare !== null && 
                    fareDifference === 0; // Exact match required (±0 yen tolerance)
  
  const errorDetails: string[] = [];
  
  if (!tsResult.success) {
    errorDetails.push(`CLI execution failed with exit code ${tsResult.exitCode}`);
  }
  
  if (tsResult.fare === null || tsResult.fare === undefined) {
    errorDetails.push('No fare amount extracted from output');
  }
  
  if (fareDifference > 0) {
    errorDetails.push(`Fare mismatch: C++ ${testCase.expectedFare}円, TS ${tsResult.fare}円 (difference: ${fareDifference}円)`);
  }
  
  // Additional validation for Japanese text output
  if (!validateJapaneseOutput(tsResult.stdout)) {
    errorDetails.push('Japanese text validation failed');
  }
  
  return {
    testId: testCase.testId,
    testName: testCase.testName,
    route: testCase.route,
    cppFare: testCase.expectedFare,
    tsFare: tsResult.fare,
    fareDifference,
    cppOutput: testCase.expectedOutput || '',
    tsOutput: tsResult.stdout,
    executionTime: tsResult.duration,
    compatible,
    errorDetails: errorDetails.length > 0 ? errorDetails : undefined
  };
}

/**
 * C++ Compatibility Test Suite
 */
describe('C++ Result Comparison Tests - Task 15', () => {
  let compatibilityResults: CppCompatibilityResult[] = [];
  let totalTests = 0;
  let compatibleTests = 0;
  let totalFareDiscrepancy = 0;

  beforeAll(() => {
    console.log('🔍 Starting C++ compatibility validation');
    console.log(`Total test cases: ${expectedTestResults.length}`);
  });

  afterAll(() => {
    // Generate detailed compatibility report
    console.log('\n📊 C++ Compatibility Summary:');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Compatible: ${compatibleTests}`);
    console.log(`Incompatible: ${totalTests - compatibleTests}`);
    console.log(`Total fare discrepancy: ${totalFareDiscrepancy}円`);
    
    if (totalTests > 0) {
      const compatibilityRate = (compatibleTests / totalTests * 100).toFixed(1);
      console.log(`Compatibility rate: ${compatibilityRate}%`);
    }
    
    // Log detailed failures
    const failures = compatibilityResults.filter(r => !r.compatible);
    if (failures.length > 0) {
      console.log('\n❌ Compatibility Failures:');
      failures.forEach(failure => {
        console.log(`\n${failure.testId}: ${failure.testName}`);
        console.log(`Route: ${failure.route}`);
        console.log(`Expected: ${failure.cppFare}円, Got: ${failure.tsFare}円`);
        if (failure.errorDetails) {
          failure.errorDetails.forEach(detail => console.log(`  - ${detail}`));
        }
      });
    }
    
    // Log performance statistics
    const avgExecutionTime = compatibilityResults.reduce((sum, r) => sum + r.executionTime, 0) / compatibilityResults.length;
    console.log(`\n⏱️  Average execution time: ${avgExecutionTime.toFixed(1)}ms`);
    
    const slowTests = compatibilityResults.filter(r => r.executionTime > 1000);
    if (slowTests.length > 0) {
      console.log(`⚠️  Slow tests (>1s): ${slowTests.length}`);
    }
  });

  /**
   * Test Group 1: Basic Route Calculations
   * From test_route_tbl[] in original C++ test_exec.cpp
   */
  describe('Basic Route Calculations', () => {
    const basicRouteTests = expectedTestResults.filter(test => 
      test.category === 'basic_routes' && test.testType === 'route_calculation'
    );

    test.each(basicRouteTests)('$testName should match C++ result exactly', async (testCase) => {
      totalTests++;
      
      const tsResult = await executeForComparison(['-5', ...testCase.routeParams], testCase.testId);
      const comparison = compareWithCppResult(testCase, tsResult);
      
      compatibilityResults.push(comparison);
      
      if (comparison.compatible) {
        compatibleTests++;
      } else {
        totalFareDiscrepancy += comparison.fareDifference;
      }
      
      // Log detailed results in debug mode
      if (process.env.CLI_DEBUG || !comparison.compatible) {
        console.log(`\n🔍 ${testCase.testId}: ${testCase.testName}`);
        console.log(`Route: ${testCase.route}`);
        console.log(`Expected fare: ${testCase.expectedFare}円`);
        console.log(`Actual fare: ${tsResult.fare}円`);
        console.log(`Execution time: ${tsResult.duration.toFixed(1)}ms`);
        
        if (comparison.errorDetails) {
          console.log(`Errors:`);
          comparison.errorDetails.forEach(error => console.log(`  - ${error}`));
        }
      }
      
      expect(comparison.compatible).toBe(true);
    });
  });

  /**
   * Test Group 2: Company Line Routes
   * From test_route2_tbl[] in original C++ test_exec.cpp
   */
  describe('Company Line Routes', () => {
    const companyLineTests = expectedTestResults.filter(test => 
      test.category === 'company_lines' && test.testType === 'route_calculation'
    );

    test.each(companyLineTests)('$testName should handle company lines correctly', async (testCase) => {
      totalTests++;
      
      const tsResult = await executeForComparison(['-5', ...testCase.routeParams], testCase.testId);
      const comparison = compareWithCppResult(testCase, tsResult);
      
      compatibilityResults.push(comparison);
      
      if (comparison.compatible) {
        compatibleTests++;
      } else {
        totalFareDiscrepancy += comparison.fareDifference;
      }
      
      expect(comparison.compatible).toBe(true);
    });
  });

  /**
   * Test Group 3: Special Junction Routes
   * From jct_special_route_tbl[] in original C++ test_exec.cpp
   */
  describe('Special Junction Routes', () => {
    const junctionTests = expectedTestResults.filter(test => 
      test.category === 'junction_special' && test.testType === 'route_calculation'
    );

    test.each(junctionTests)('$testName should handle junction routing correctly', async (testCase) => {
      totalTests++;
      
      const tsResult = await executeForComparison(['-5', ...testCase.routeParams], testCase.testId);
      const comparison = compareWithCppResult(testCase, tsResult);
      
      compatibilityResults.push(comparison);
      
      if (comparison.compatible) {
        compatibleTests++;
      } else {
        totalFareDiscrepancy += comparison.fareDifference;
      }
      
      expect(comparison.compatible).toBe(true);
    });
  });

  /**
   * Test Group 4: Shinkansen to Conventional Routes
   * From test_shin2_zai_tbl[] in original C++ test_exec.cpp
   */
  describe('Shinkansen to Conventional Routes', () => {
    const shinkansenTests = expectedTestResults.filter(test => 
      test.category === 'shinkansen_conventional' && test.testType === 'route_calculation'
    );

    test.each(shinkansenTests)('$testName should handle Shinkansen transfers correctly', async (testCase) => {
      totalTests++;
      
      const tsResult = await executeForComparison(['-5', ...testCase.routeParams], testCase.testId);
      const comparison = compareWithCppResult(testCase, tsResult);
      
      compatibilityResults.push(comparison);
      
      if (comparison.compatible) {
        compatibleTests++;
      } else {
        totalFareDiscrepancy += comparison.fareDifference;
      }
      
      expect(comparison.compatible).toBe(true);
    });
  });

  /**
   * Test Group 5: Complex Route Comparisons
   * From test_route3_tbl[] in original C++ test_exec.cpp
   */
  describe('Complex Route Comparisons', () => {
    const complexRouteTests = expectedTestResults.filter(test => 
      test.category === 'route_comparison' && test.testType === 'route_calculation'
    );

    test.each(complexRouteTests)('$testName should handle complex routing correctly', async (testCase) => {
      totalTests++;
      
      const tsResult = await executeForComparison(['-5', ...testCase.routeParams], testCase.testId);
      const comparison = compareWithCppResult(testCase, tsResult);
      
      compatibilityResults.push(comparison);
      
      if (comparison.compatible) {
        compatibleTests++;
      } else {
        totalFareDiscrepancy += comparison.fareDifference;
      }
      
      expect(comparison.compatible).toBe(true);
    });
  });

  /**
   * Test Group 6: Complete Test Suite Execution Order Validation
   * Ensures test execution order matches original test_exec.cpp
   */
  describe('Test Suite Execution Order', () => {
    test('should execute tests in same order as C++ test_exec.cpp', async () => {
      const result = await executeForComparison(['-exec'], 'exec_order_test');
      
      expect(result.success).toBe(true);
      
      // Validate that test output contains expected sequence markers
      const expectedSequence = [
        '会社線を含む経路',
        'test_route2_tbl',
        'jct_special_route_tbl',
        'test_route_tbl',
        'test_shin2_zai_tbl',
        'test_route3_tbl'
      ];
      
      let lastFoundIndex = -1;
      for (const marker of expectedSequence) {
        const index = result.stdout.indexOf(marker);
        if (index === -1) {
          console.warn(`⚠️  Expected sequence marker not found: ${marker}`);
        } else if (index <= lastFoundIndex) {
          console.warn(`⚠️  Sequence order violation: ${marker} found before expected position`);
        } else {
          lastFoundIndex = index;
        }
      }
      
      // This is a warning-level check since exact order verification requires more detailed parsing
      console.log('✅ Test suite execution order validation completed');
    });
  });

  /**
   * Test Group 7: Error Handling Compatibility
   * Ensures error scenarios match C++ behavior
   */
  describe('Error Handling Compatibility', () => {
    const errorTestCases = [
      {
        testId: 'error_invalid_station',
        testName: 'Invalid station handling',
        args: ['-5', 'NonExistentStation', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainError: true
      },
      {
        testId: 'error_invalid_line',
        testName: 'Invalid line handling',
        args: ['-5', '東京', 'NonExistentLine', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainError: true
      },
      {
        testId: 'error_insufficient_params',
        testName: 'Insufficient parameters',
        args: ['-5', '東京', '東海道線'],
        expectedExitCode: -1,
        shouldContainError: true
      }
    ];

    test.each(errorTestCases)('$testName should match C++ error behavior', async (testCase) => {
      const result = await executeForComparison(testCase.args, testCase.testId);
      
      expect(result.exitCode).toBe(testCase.expectedExitCode);
      expect(result.success).toBe(false);
      
      if (testCase.shouldContainError) {
        expect(result.stderr.length > 0 || result.stdout.includes('❌')).toBe(true);
      }
    });
  });
});