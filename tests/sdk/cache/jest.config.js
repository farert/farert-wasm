/**
 * Jest Configuration for Cache Performance Tests
 * 
 * Specialized configuration for running comprehensive cache performance tests
 * with proper timeout handling, memory management, and realistic testing environment.
 * 
 * @file Jest Cache Test Configuration
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/cache-performance.test.ts',
    '**/cache-manager.test.ts',
    '**/lru-cache.test.ts'
  ],
  
  // TypeScript support
  preset: 'ts-jest',
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/sdk/cache/setup.ts'],
  
  // Timeout configuration for performance tests
  testTimeout: 60000, // 60 seconds for comprehensive performance tests
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/sdk/cache/**/*.ts',
    '!src/sdk/cache/**/*.d.ts',
    '!src/sdk/cache/**/*.test.ts'
  ],
  coverageDirectory: 'coverage/cache',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Performance and memory settings
  maxWorkers: 2, // Limit workers for memory-intensive tests
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  
  // Test sequencing for memory-sensitive tests
  runInBand: true, // Run tests in sequence to avoid memory conflicts
  
  // Global setup/teardown
  globalSetup: '<rootDir>/tests/sdk/cache/global-setup.ts',
  globalTeardown: '<rootDir>/tests/sdk/cache/global-teardown.ts',
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      pageTitle: 'Cache Performance Test Report',
      outputPath: 'tests/sdk/cache/reports/test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          resolveJsonModule: true
        }
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Watch mode configuration
  watchman: false, // Disable watchman for consistent CI/CD behavior
  
  // Memory management
  workerIdleMemoryLimit: '1GB',
  
  // Custom environment variables for tests
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};