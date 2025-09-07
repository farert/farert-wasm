/**
 * Jest Setup for CLI Integration Tests - Task 15
 * Global setup and configuration for integration test execution
 */

import * as fs from 'fs';
import * as path from 'path';

// Global test configuration
const CLI_PATH = path.resolve(__dirname, '../../../src/cli/main.ts');
const REQUIRED_FILES = [
  path.resolve(__dirname, '../../../dist/farert.js'),
  path.resolve(__dirname, '../../../dist/farert.wasm'),
  path.resolve(__dirname, '../../../data/jrdbnewest.db')
];

// Extend Jest matchers for CLI testing
expect.extend({
  toHaveValidFare(received: number, tolerance: number = 0) {
    const pass = typeof received === 'number' && 
                 !isNaN(received) && 
                 received >= 0 && 
                 received <= 50000; // Reasonable fare range
    
    return {
      pass,
      message: () => pass 
        ? `Expected ${received} to be invalid fare`
        : `Expected ${received} to be a valid fare (0-50000 yen)`
    };
  },
  
  toHaveValidJapaneseText(received: string) {
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    const pass = japanesePattern.test(received);
    
    return {
      pass,
      message: () => pass
        ? `Expected "${received}" to not contain Japanese characters`
        : `Expected "${received}" to contain Japanese characters`
    };
  },
  
  toMeetPerformanceRequirement(received: number, limit: number, description: string) {
    const pass = received <= limit;
    
    return {
      pass,
      message: () => pass
        ? `Expected ${description} ${received}ms to exceed limit ${limit}ms`
        : `Expected ${description} ${received}ms to be ≤ ${limit}ms`
    };
  }
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidFare(tolerance?: number): R;
      toHaveValidJapaneseText(): R;
      toMeetPerformanceRequirement(limit: number, description: string): R;
    }
  }
}

// Global setup before all tests
beforeAll(async () => {
  console.log('\n🚀 Setting up CLI Integration Test Environment');
  
  // Verify CLI exists
  if (!fs.existsSync(CLI_PATH)) {
    throw new Error(`CLI not found at: ${CLI_PATH}`);
  }
  
  // Check required files
  const missingFiles: string[] = [];
  for (const file of REQUIRED_FILES) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    console.warn('⚠️  Warning: Missing required files:');
    missingFiles.forEach(file => console.warn(`   - ${file}`));
    console.warn('Some tests may fail. Run `npm run build` to generate missing files.');
  }
  
  // Display environment info
  console.log(`📂 CLI Path: ${CLI_PATH}`);
  console.log(`🔧 Node.js: ${process.version}`);
  console.log(`💻 Platform: ${process.platform}`);
  console.log(`⏱️  Test Timeout: ${global.CLI_TEST_TIMEOUT || 60000}ms`);
  console.log(`💾 Memory Limit: ${Math.round((global.CLI_TEST_MEMORY_LIMIT || (512 * 1024 * 1024)) / 1024 / 1024)}MB`);
});

// Global cleanup after all tests
afterAll(async () => {
  console.log('\n🧹 Cleaning up CLI Integration Test Environment');
  
  // Perform any necessary cleanup
  // For example, removing temporary files, clearing caches, etc.
  
  console.log('✅ Integration test cleanup completed');
});

export {};