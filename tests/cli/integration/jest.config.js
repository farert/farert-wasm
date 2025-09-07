/**
 * Jest Configuration for CLI Integration Tests - Task 15
 * Requirements: REQ-CLI-002.2, REQ-CLI-002.3, 100% compatibility requirement
 * 
 * Specialized Jest configuration for running comprehensive CLI integration tests
 * with appropriate timeouts, parallel execution control, and detailed reporting.
 */

module.exports = {
  // Test environment and setup
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/**/*.test.ts'
  ],
  
  // File extensions and transformation
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // TypeScript configuration
  preset: 'ts-jest',
  tsconfig: {
    compilerOptions: {
      target: 'ES2020',
      module: 'commonjs',
      lib: ['ES2020'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true
    }
  },
  
  // Test execution configuration
  maxConcurrency: 2, // Limit concurrent tests to avoid resource conflicts
  maxWorkers: 2,     // Limit worker processes
  
  // Timeout configuration for long-running integration tests
  testTimeout: 60000, // 60 seconds per test (some tests run full test suite)
  
  // Coverage configuration (optional for integration tests)
  collectCoverage: false, // Integration tests focus on behavior, not coverage
  
  // Test result reporting
  verbose: true,
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'CLI Integration Test Results - Task 15',
        outputPath: './integration-test-report.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        dateFormat: 'yyyy-mm-dd HH:MM:ss'
      }
    ]
  ],
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/setup.ts'],
  
  // Module resolution
  moduleNameMapping: {
    '^@test-helpers/(.*)$': '<rootDir>/helpers/$1',
    '^@test-data/(.*)$': '<rootDir>/test-data/$1'
  },
  
  // Test execution order and grouping
  testSequencer: '<rootDir>/custom-sequencer.js',
  
  // Error handling and debugging
  bail: 0, // Don't stop on first failure - run all tests
  errorOnDeprecated: true,
  
  // Performance monitoring
  logHeapUsage: true,
  detectOpenHandles: true,
  
  // Global test configuration
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        target: 'ES2020'
      }
    },
    // Test environment variables
    CLI_TEST_TIMEOUT: 60000,
    CLI_TEST_MEMORY_LIMIT: 512 * 1024 * 1024,
    CLI_DEBUG: false
  },
  
  // Test categorization and filtering
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Custom test environment variables
  setupFiles: ['<rootDir>/env-setup.js']
};