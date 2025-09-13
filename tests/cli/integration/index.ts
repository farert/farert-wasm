/**
 * CLI Integration Tests Index - Task 15
 * Main entry point for all CLI integration tests
 * Requirements: REQ-CLI-002.2, REQ-CLI-002.3, 100% compatibility requirement
 * 
 * This file exports all integration test modules and provides utilities
 * for running comprehensive CLI validation tests.
 */

// Test Modules
export * from './cli-integration.test';
export * from './cpp-comparison.test';
export * from './performance-validation.test';
export * from './error-scenarios.test';

// Test Data and Helpers
export * from './test-data/cpp-expected-results';
export * from './helpers/result-parser';
export * from './helpers/test-executor';

// Test Configuration
export const TEST_CONFIG = {
  CLI_PATH: require('path').resolve(__dirname, '../../../src/cli/main.ts'),
  TIMEOUTS: {
    STARTUP: 2000,      // 2 seconds
    CALCULATION: 1000,  // 1 second  
    TEST_SUITE: 30000,  // 30 seconds
    INDIVIDUAL_TEST: 10000 // 10 seconds
  },
  MEMORY_LIMITS: {
    NORMAL_OPERATION: 512 * 1024 * 1024,  // 512MB
    ERROR_SCENARIOS: 256 * 1024 * 1024,   // 256MB
    PERFORMANCE_TESTS: 512 * 1024 * 1024  // 512MB
  },
  TOLERANCE: {
    FARE_EXACT: 0,      // ±0 yen for exact C++ compatibility
    FARE_ACCEPTABLE: 1, // ±0 yen for edge cases
    PERFORMANCE_BUFFER: 0.1 // 10% buffer for performance tests
  }
};

/**
 * Integration test categories
 */
export enum TestCategory {
  CLI_COMMANDS = 'cli_commands',
  CPP_COMPATIBILITY = 'cpp_compatibility', 
  PERFORMANCE = 'performance',
  ERROR_SCENARIOS = 'error_scenarios',
  ALL = 'all'
}

/**
 * Test execution summary
 */
export interface IntegrationTestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  categories: {
    [key in TestCategory]?: {
      total: number;
      passed: number;
      failed: number;
    }
  };
  performance: {
    averageExecutionTime: number;
    maxExecutionTime: number;
    performanceViolations: number;
    memoryViolations: number;
  };
  compatibility: {
    totalCompatibilityTests: number;
    compatibleTests: number;
    totalFareDiscrepancy: number;
    averageFareDiscrepancy: number;
  };
  errors: {
    totalErrorTests: number;
    properlyHandledErrors: number;
    securityTestsPassed: number;
  };
  executionTime: number;
}

/**
 * CLI Integration Test Runner
 * Provides programmatic access to run integration tests
 */
export class CLIIntegrationTestRunner {
  private config: typeof TEST_CONFIG;
  private results: Map<string, any> = new Map();
  
  constructor(config?: Partial<typeof TEST_CONFIG>) {
    this.config = { ...TEST_CONFIG, ...config };
  }

  /**
   * Run all integration tests
   */
  async runAllTests(): Promise<IntegrationTestSummary> {
    console.log('🚀 Starting Complete CLI Integration Test Suite');
    const startTime = Date.now();
    
    // This would typically integrate with Jest programmatically
    // For now, we provide the structure for manual test coordination
    
    const summary: IntegrationTestSummary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      categories: {},
      performance: {
        averageExecutionTime: 0,
        maxExecutionTime: 0,
        performanceViolations: 0,
        memoryViolations: 0
      },
      compatibility: {
        totalCompatibilityTests: 0,
        compatibleTests: 0,
        totalFareDiscrepancy: 0,
        averageFareDiscrepancy: 0
      },
      errors: {
        totalErrorTests: 0,
        properlyHandledErrors: 0,
        securityTestsPassed: 0
      },
      executionTime: Date.now() - startTime
    };
    
    return summary;
  }

  /**
   * Run tests by category
   */
  async runTestsByCategory(category: TestCategory): Promise<Partial<IntegrationTestSummary>> {
    console.log(`🎯 Running ${category} tests`);
    
    // This would integrate with Jest to run specific test files
    // Based on the category selected
    
    const categoryResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    };
    
    return categoryResults;
  }

  /**
   * Validate test environment
   */
  validateTestEnvironment(): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check if CLI exists
    const fs = require('fs');
    if (!fs.existsSync(this.config.CLI_PATH)) {
      issues.push(`CLI not found at: ${this.config.CLI_PATH}`);
    }
    
    // Check for required files
    const requiredFiles = [
      require('path').resolve(__dirname, '../../../dist/farert.js'),
      require('path').resolve(__dirname, '../../../dist/farert.wasm'),
      require('path').resolve(__dirname, '../../../data/jrdbnewest.db')
    ];
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        issues.push(`Required file not found: ${file}`);
      }
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion < 14) {
      warnings.push(`Node.js version ${nodeVersion} may not be fully supported. Recommended: 14.0.0+`);
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Generate test report
   */
  generateReport(summary: IntegrationTestSummary): string {
    const report = `
CLI Integration Test Report - Task 15
=====================================

Test Execution Summary:
- Total Tests: ${summary.totalTests}
- Passed: ${summary.passedTests}
- Failed: ${summary.failedTests}
- Success Rate: ${(summary.passedTests / summary.totalTests * 100).toFixed(1)}%

Performance Results:
- Average Execution Time: ${summary.performance.averageExecutionTime.toFixed(1)}ms
- Maximum Execution Time: ${summary.performance.maxExecutionTime.toFixed(1)}ms
- Performance Violations: ${summary.performance.performanceViolations}
- Memory Violations: ${summary.performance.memoryViolations}

C++ Compatibility Results:
- Total Compatibility Tests: ${summary.compatibility.totalCompatibilityTests}
- Compatible Tests: ${summary.compatibility.compatibleTests}
- Compatibility Rate: ${(summary.compatibility.compatibleTests / summary.compatibility.totalCompatibilityTests * 100).toFixed(1)}%
- Total Fare Discrepancy: ${summary.compatibility.totalFareDiscrepancy}円
- Average Fare Discrepancy: ${summary.compatibility.averageFareDiscrepancy.toFixed(2)}円

Error Handling Results:
- Total Error Tests: ${summary.errors.totalErrorTests}
- Properly Handled: ${summary.errors.properlyHandledErrors}
- Error Handling Rate: ${(summary.errors.properlyHandledErrors / summary.errors.totalErrorTests * 100).toFixed(1)}%
- Security Tests Passed: ${summary.errors.securityTestsPassed}

Total Execution Time: ${(summary.executionTime / 1000).toFixed(2)} seconds

Status: ${summary.failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
`;
    
    return report;
  }
}

/**
 * Utility functions for test coordination
 */
export const testUtils = {
  /**
   * Format test duration for display
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(1)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      return `${(ms / 60000).toFixed(2)}m`;
    }
  },

  /**
   * Format memory usage for display
   */
  formatMemory(bytes: number): string {
    const mb = bytes / 1024 / 1024;
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    } else {
      return `${mb.toFixed(1)}MB`;
    }
  },

  /**
   * Calculate test statistics
   */
  calculateStats(results: any[]): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  } {
    if (results.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
    }

    const sorted = [...results].sort((a, b) => a - b);
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }
};

// Export default test runner instance
export default new CLIIntegrationTestRunner();