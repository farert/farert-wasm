/**
 * Environment Setup for CLI Integration Tests - Task 15
 * Sets up environment variables and configuration for test execution
 */

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.CLI_TEST_MODE = '1';

// Configure test timeouts and limits
process.env.CLI_TEST_TIMEOUT = '60000';
process.env.CLI_TEST_MEMORY_LIMIT = String(512 * 1024 * 1024);

// Disable certain features for testing stability
process.env.CLI_DISABLE_COLORS = '1'; // Disable colored output for consistent parsing
process.env.CLI_QUIET_MODE = '0';     // Keep output for validation

// Configure debugging (can be overridden by individual tests)
if (!process.env.CLI_DEBUG) {
  process.env.CLI_DEBUG = '0';
}

// Set locale for consistent Japanese text handling
process.env.LANG = 'ja_JP.UTF-8';
process.env.LC_ALL = 'ja_JP.UTF-8';

// Configure memory and performance monitoring
process.env.NODE_OPTIONS = '--max-old-space-size=1024'; // 1GB for Node.js heap

// Prevent interference from user configuration
delete process.env.CLI_CONFIG_PATH;
delete process.env.CLI_CUSTOM_PATH;

console.log('🔧 Integration test environment configured');