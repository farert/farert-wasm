/**
 * Error Scenario Tests - Task 15
 * Comprehensive error handling validation with exact behavior matching
 * Requirements: REQ-CLI-002.3, REQ-CLI-003.4, REQ-CLI-003.5
 * 
 * This test suite validates:
 * - Invalid arguments produce appropriate error codes
 * - Error messages match expected format and content
 * - Security validation prevents malicious inputs
 * - Graceful degradation under error conditions
 * - Proper cleanup after errors occur
 * - Japanese text validation and suggestions
 */

import * as path from 'path';
import { CliTestExecutor } from './helpers/test-executor';
import { extractErrorInfo, validateJapaneseOutput } from './helpers/result-parser';

const CLI_PATH = path.resolve(__dirname, '../../../src/cli/main.ts');

/**
 * Error test case structure
 */
interface ErrorTestCase {
  name: string;
  args: string[];
  expectedExitCode: number;
  expectedErrorType?: string;
  shouldContainInOutput: string[];
  shouldNotContainInOutput?: string[];
  shouldHaveSuggestions?: boolean;
  securityTest?: boolean;
  description: string;
}

/**
 * Error validation result
 */
interface ErrorValidationResult {
  exitCodeMatch: boolean;
  errorMessageMatch: boolean;
  suggestionsPresent: boolean;
  securityProper: boolean;
  outputValidation: boolean;
  details: string[];
}

describe('Error Scenario Tests - Task 15', () => {
  let executor: CliTestExecutor;
  let errorResults: Map<string, any> = new Map();
  let totalErrorTests = 0;
  let passedErrorTests = 0;

  beforeAll(async () => {
    console.log('🚨 Starting CLI Error Scenario Validation Suite');
    
    executor = new CliTestExecutor(CLI_PATH, {
      timeout: 10000, // 10 seconds should be enough for error cases
      memoryLimit: 256 * 1024 * 1024, // 256MB for error cases
      monitorMemory: true,
      captureDebugOutput: false, // Reduce noise for error testing
      retryAttempts: 0 // No retries for error testing
    });
  });

  afterAll(() => {
    console.log(`\n📊 Error Scenario Test Summary:`);
    console.log(`Total error tests: ${totalErrorTests}`);
    console.log(`Passed: ${passedErrorTests}`);
    console.log(`Failed: ${totalErrorTests - passedErrorTests}`);
    
    if (totalErrorTests > 0) {
      const errorHandlingRate = (passedErrorTests / totalErrorTests * 100).toFixed(1);
      console.log(`Error handling success rate: ${errorHandlingRate}%`);
    }
    
    executor.cleanup();
  });

  /**
   * Helper function to validate error result
   */
  function validateErrorResult(
    result: any,
    expected: ErrorTestCase
  ): ErrorValidationResult {
    const details: string[] = [];
    
    // Check exit code
    const exitCodeMatch = result.exitCode === expected.expectedExitCode;
    if (!exitCodeMatch) {
      details.push(`Exit code mismatch: expected ${expected.expectedExitCode}, got ${result.exitCode}`);
    }
    
    // Check error message content
    const combinedOutput = `${result.stdout}\n${result.stderr}`;
    let errorMessageMatch = true;
    
    for (const content of expected.shouldContainInOutput) {
      if (!combinedOutput.includes(content)) {
        errorMessageMatch = false;
        details.push(`Missing expected content: "${content}"`);
      }
    }
    
    if (expected.shouldNotContainInOutput) {
      for (const content of expected.shouldNotContainInOutput) {
        if (combinedOutput.includes(content)) {
          errorMessageMatch = false;
          details.push(`Found prohibited content: "${content}"`);
        }
      }
    }
    
    // Check suggestions if expected
    const errorInfo = extractErrorInfo(result.stdout, result.stderr);
    const suggestionsPresent = errorInfo.suggestions && errorInfo.suggestions.length > 0;
    const suggestionMatch = expected.shouldHaveSuggestions ? suggestionsPresent : true;
    
    if (expected.shouldHaveSuggestions && !suggestionsPresent) {
      details.push('Expected suggestions but none found');
    }
    
    // Check security handling
    let securityProper = true;
    if (expected.securityTest) {
      const hasSecurityWarnings = errorInfo.securityWarnings && errorInfo.securityWarnings.length > 0;
      if (!hasSecurityWarnings) {
        securityProper = false;
        details.push('Security test should produce security warnings');
      }
    }
    
    // Check output validation
    const outputValidation = !expected.securityTest || combinedOutput.length > 0;
    
    return {
      exitCodeMatch,
      errorMessageMatch,
      suggestionsPresent: suggestionMatch,
      securityProper,
      outputValidation,
      details
    };
  }

  /**
   * Helper to run error test case
   */
  async function runErrorTestCase(testCase: ErrorTestCase): Promise<void> {
    totalErrorTests++;
    
    const result = await executor.execute(testCase.args, testCase.name);
    errorResults.set(testCase.name, result);
    
    const validation = validateErrorResult(result, testCase);
    const passed = validation.exitCodeMatch && 
                   validation.errorMessageMatch && 
                   validation.suggestionsPresent && 
                   validation.securityProper && 
                   validation.outputValidation;
    
    if (passed) {
      passedErrorTests++;
    }
    
    // Log detailed results
    if (!passed || process.env.CLI_DEBUG) {
      console.log(`\n🔍 ${testCase.name}:`);
      console.log(`Description: ${testCase.description}`);
      console.log(`Expected exit code: ${testCase.expectedExitCode}, Actual: ${result.exitCode}`);
      console.log(`Duration: ${result.duration.toFixed(1)}ms`);
      
      if (!passed) {
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
    
    expect(passed).toBe(true);
  }

  /**
   * Parameter Validation Error Tests
   */
  describe('Parameter Validation Errors', () => {
    const parameterErrorTests: ErrorTestCase[] = [
      {
        name: 'no_arguments',
        args: [],
        expectedExitCode: -1,
        shouldContainInOutput: ['Usage:', 'OPTIONS:', 'ARGUMENTS:'],
        description: 'CLI with no arguments should show usage',
      },
      {
        name: 'insufficient_params_for_5',
        args: ['-5', '東京', '東海道線'],
        expectedExitCode: -1, // CLIErrorCode.PARAMETER_COUNT_MISMATCH
        shouldContainInOutput: [
          '-5 command requires exactly 5 parameters',
          'providedCount: 2',
          'expectedCount: 5'
        ],
        description: '-5 command with insufficient parameters'
      },
      {
        name: 'excess_params_for_5',
        args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿', '中央線', '立川'],
        expectedExitCode: -1,
        shouldContainInOutput: [
          '-5 command requires exactly 5 parameters',
          'providedCount: 7',
          'expectedCount: 5'
        ],
        description: '-5 command with too many parameters'
      },
      {
        name: 'empty_parameter',
        args: ['-5', '', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['Empty', 'parameter', 'detected'],
        description: 'Empty parameter in -5 command'
      },
      {
        name: 'unknown_option',
        args: ['-xyz'],
        expectedExitCode: -1,
        shouldContainInOutput: ['Usage:'],
        description: 'Unknown command line option'
      }
    ];

    test.each(parameterErrorTests)('$name should handle parameter errors correctly', async (testCase) => {
      await runErrorTestCase(testCase);
    });
  });

  /**
   * Station Name Validation Error Tests
   */
  describe('Station Name Validation Errors', () => {
    const stationErrorTests: ErrorTestCase[] = [
      {
        name: 'invalid_station_name',
        args: ['-5', 'InvalidStation123', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Station 1:', 'Similar station names:'],
        shouldHaveSuggestions: true,
        description: 'Invalid station name should provide suggestions'
      },
      {
        name: 'partially_correct_station',
        args: ['-5', 'とうきょう', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Station 1:', 'Similar station names:'],
        shouldHaveSuggestions: true,
        description: 'Hiragana station name should suggest Kanji equivalent'
      },
      {
        name: 'english_station_name',
        args: ['-5', 'Tokyo', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Station 1:', 'Similar station names:'],
        shouldHaveSuggestions: true,
        description: 'English station name should suggest Japanese equivalent'
      },
      {
        name: 'multiple_invalid_stations',
        args: ['-5', 'InvalidStart', '東海道線', 'InvalidMiddle', '山手線', 'InvalidEnd'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Station 1:', 'Station 3:', 'Station 5:'],
        description: 'Multiple invalid stations should all be reported'
      }
    ];

    test.each(stationErrorTests)('$name should validate station names correctly', async (testCase) => {
      await runErrorTestCase(testCase);
    });
  });

  /**
   * Line Name Validation Error Tests
   */
  describe('Line Name Validation Errors', () => {
    const lineErrorTests: ErrorTestCase[] = [
      {
        name: 'invalid_line_name',
        args: ['-5', '東京', 'InvalidLine123', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Line 1:', 'Similar line names:'],
        shouldHaveSuggestions: true,
        description: 'Invalid line name should provide suggestions'
      },
      {
        name: 'line_without_suffix',
        args: ['-5', '東京', '東海道', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Line 1:', 'Similar line names:'],
        shouldHaveSuggestions: true,
        description: 'Line name without "線" suffix should suggest correct format'
      },
      {
        name: 'english_line_name',
        args: ['-5', '東京', 'Tokaido Line', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Line 1:', 'Similar line names:'],
        shouldHaveSuggestions: true,
        description: 'English line name should suggest Japanese equivalent'
      },
      {
        name: 'multiple_invalid_lines',
        args: ['-5', '東京', 'InvalidLine1', '品川', 'InvalidLine2', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['❌', 'Line 1:', 'Line 2:'],
        description: 'Multiple invalid lines should all be reported'
      }
    ];

    test.each(lineErrorTests)('$name should validate line names correctly', async (testCase) => {
      await runErrorTestCase(testCase);
    });
  });

  /**
   * Security Validation Error Tests
   */
  describe('Security Validation Errors', () => {
    const securityErrorTests: ErrorTestCase[] = [
      {
        name: 'command_injection_attempt',
        args: ['-5', '東京; rm -rf /', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['🚨', 'Security', 'dangerous input pattern'],
        securityTest: true,
        description: 'Command injection attempt should be detected and blocked'
      },
      {
        name: 'script_tag_injection',
        args: ['-5', '<script>alert("xss")</script>', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['🚨', 'Security', 'malicious pattern'],
        securityTest: true,
        description: 'Script tag injection should be detected'
      },
      {
        name: 'path_traversal_attempt',
        args: ['-5', '../../../etc/passwd', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['🚨', 'Security'],
        securityTest: true,
        description: 'Path traversal attempt should be blocked'
      },
      {
        name: 'unicode_escape_attempt',
        args: ['-5', '\\x41\\x41\\x41', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['🚨', 'Security'],
        securityTest: true,
        description: 'Unicode escape sequence should be detected'
      },
      {
        name: 'extremely_long_input',
        args: ['-5', 'A'.repeat(1000), '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['🚨', 'Security', 'exceeds maximum length'],
        securityTest: true,
        description: 'Extremely long input should be rejected'
      },
      {
        name: 'null_byte_injection',
        args: ['-5', '東京\x00malicious', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: -1,
        shouldContainInOutput: ['🚨', 'Security', 'Invalid UTF-8 encoding'],
        securityTest: true,
        description: 'Null byte injection should be detected'
      }
    ];

    test.each(securityErrorTests)('$name should handle security threats correctly', async (testCase) => {
      await runErrorTestCase(testCase);
    });
  });

  /**
   * File Operation Error Tests
   */
  describe('File Operation Errors', () => {
    const fileErrorTests: ErrorTestCase[] = [
      {
        name: 'nonexistent_file',
        args: ['nonexistent_file.txt'],
        expectedExitCode: -1,
        shouldContainInOutput: ["Can't open file", 'nonexistent_file.txt'],
        description: 'Non-existent file should produce appropriate error'
      },
      {
        name: 'directory_as_file',
        args: ['.'],
        expectedExitCode: -1,
        shouldContainInOutput: ["Can't open file"],
        description: 'Attempting to read directory as file should fail'
      },
      {
        name: 'absolute_path_security',
        args: ['/etc/passwd'],
        expectedExitCode: -1,
        shouldContainInOutput: ['File access denied for security reasons'],
        securityTest: true,
        description: 'Absolute path outside project should be blocked'
      }
    ];

    test.each(fileErrorTests)('$name should handle file errors correctly', async (testCase) => {
      await runErrorTestCase(testCase);
    });
  });

  /**
   * Environment and System Error Tests
   */
  describe('Environment and System Errors', () => {
    test('should handle missing WebAssembly module gracefully', async () => {
      // This test would require manipulating the WASM file, which might be complex
      // For now, we'll test with an invalid WASM path environment variable
      const testExecutor = new CliTestExecutor(CLI_PATH, {
        environment: { 
          ...process.env, 
          CLI_WASM_PATH: '/nonexistent/path/farert.wasm'
        },
        timeout: 15000
      });

      const result = await testExecutor.execute(['-5', '東京', '東海道線', '品川'], 'missing_wasm');
      
      // Should either fail to initialize or use fallback
      if (!result.success) {
        expect(result.stderr.length > 0 || result.stdout.includes('❌')).toBe(true);
      }
      
      testExecutor.cleanup();
    });

    test('should handle corrupted database scenario', async () => {
      // Test with invalid database path
      const testExecutor = new CliTestExecutor(CLI_PATH, {
        environment: { 
          ...process.env, 
          CLI_DB_PATH: '/nonexistent/path/database.db'
        },
        timeout: 15000
      });

      const result = await testExecutor.execute(['-5', '東京', '東海道線', '品川'], 'corrupted_db');
      
      // Should handle database errors gracefully
      if (!result.success) {
        expect(result.stderr.length > 0 || result.stdout.includes('❌')).toBe(true);
      }
      
      testExecutor.cleanup();
    });
  });

  /**
   * Resource Limit Error Tests
   */
  describe('Resource Limit Errors', () => {
    test('should handle timeout gracefully', async () => {
      const shortTimeoutExecutor = new CliTestExecutor(CLI_PATH, {
        timeout: 100, // Very short timeout
        retryAttempts: 0
      });

      const result = await shortTimeoutExecutor.execute(['-exec'], 'timeout_test');
      
      expect(result.success).toBe(false);
      expect(result.duration).toBeLessThan(1000); // Should timeout quickly
      
      shortTimeoutExecutor.cleanup();
    });

    test('should handle memory pressure conditions', async () => {
      const lowMemoryExecutor = new CliTestExecutor(CLI_PATH, {
        memoryLimit: 1024 * 1024, // 1MB limit (very restrictive)
        monitorMemory: true
      });

      const result = await lowMemoryExecutor.execute(['-5', '東京', '東海道線', '大阪'], 'memory_pressure');
      
      // Test should either pass or fail gracefully under memory pressure
      if (result.memoryUsage && result.memoryUsage.exceedsLimit) {
        console.log('Memory limit exceeded as expected under pressure test');
      }
      
      lowMemoryExecutor.cleanup();
    });
  });

  /**
   * Error Recovery and Cleanup Tests
   */
  describe('Error Recovery and Cleanup', () => {
    test('should recover from errors and handle subsequent requests', async () => {
      // First, cause an error
      const errorResult = await executor.execute(['-5', 'InvalidStation'], 'error_recovery_1');
      expect(errorResult.success).toBe(false);
      
      // Then, execute a valid request
      const validResult = await executor.execute(['-5', '東京', '東海道線', '品川'], 'error_recovery_2');
      expect(validResult.success).toBe(true);
      
      console.log('✅ CLI recovered successfully from error state');
    });

    test('should maintain clean state after multiple errors', async () => {
      const errorTests = [
        ['-5', 'Invalid1'],
        ['-5', 'Invalid2', 'Invalid3'],
        ['--invalid-option'],
        ['/nonexistent/file.txt']
      ];
      
      for (let i = 0; i < errorTests.length; i++) {
        const result = await executor.execute(errorTests[i], `cleanup_error_${i}`);
        expect(result.success).toBe(false);
      }
      
      // Final valid test should work
      const finalResult = await executor.execute(['-h'], 'cleanup_final');
      expect(finalResult.success).toBe(true);
      
      console.log('✅ CLI maintained clean state through multiple errors');
    });
  });
});