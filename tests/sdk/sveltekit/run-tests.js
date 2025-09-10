#!/usr/bin/env node
/**
 * SvelteKit Integration Tests Runner
 * 
 * Executes the comprehensive SvelteKit integration test suite for REQ-API-004
 * with proper environment setup, performance monitoring, and detailed reporting.
 * 
 * @file SvelteKit Integration Test Runner
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  timeout: 300000, // 5 minutes
  retries: 2,
  concurrent: true,
  coverage: true
};

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Print colored output
 */
function print(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Print test header
 */
function printHeader() {
  print('\n' + '='.repeat(80), colors.cyan);
  print('🧪 SVELTEKIT INTEGRATION TESTS - REQ-API-004', colors.bright + colors.cyan);
  print('   SvelteKit SSR and Hydration Support', colors.cyan);
  print('='.repeat(80), colors.cyan);
  print(`📁 Test Directory: ${__dirname}`, colors.blue);
  print(`⏱️  Test Timeout: ${TEST_CONFIG.timeout}ms`, colors.blue);
  print(`🔄 Retries: ${TEST_CONFIG.retries}`, colors.blue);
  print(`📊 Coverage: ${TEST_CONFIG.coverage ? 'Enabled' : 'Disabled'}`, colors.blue);
  print('='.repeat(80), colors.cyan);
}

/**
 * Run vitest with specified arguments
 */
function runVitest(args = []) {
  return new Promise((resolve, reject) => {
    const vitestPath = join(process.cwd(), 'node_modules/.bin/vitest');
    
    // Build vitest command arguments
    const vitestArgs = [
      '--config', join(__dirname, 'vitest.config.ts'),
      '--run', // Don't watch, just run once
      '--reporter=verbose',
      '--reporter=json',
      '--outputFile=test-results.json',
      ...args
    ];

    if (TEST_CONFIG.coverage) {
      vitestArgs.push('--coverage');
    }

    if (TEST_CONFIG.retries > 0) {
      vitestArgs.push('--retry', TEST_CONFIG.retries.toString());
    }

    print(`\n🚀 Running: vitest ${vitestArgs.join(' ')}`, colors.blue);
    print('-'.repeat(80), colors.blue);

    const child = spawn('npx', ['vitest', ...vitestArgs], {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: TEST_CONFIG.timeout,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        VITEST: 'true',
        FORCE_COLOR: '1'
      }
    });

    let timeout;
    if (TEST_CONFIG.timeout) {
      timeout = setTimeout(() => {
        print(`\n⏰ Test timeout (${TEST_CONFIG.timeout}ms) reached`, colors.yellow);
        child.kill('SIGTERM');
        reject(new Error(`Tests timed out after ${TEST_CONFIG.timeout}ms`));
      }, TEST_CONFIG.timeout);
    }

    child.on('close', (code) => {
      if (timeout) clearTimeout(timeout);
      
      if (code === 0) {
        print('\n✅ All tests passed!', colors.green);
        resolve({ success: true, code });
      } else {
        print(`\n❌ Tests failed with exit code: ${code}`, colors.red);
        reject(new Error(`Tests failed with exit code: ${code}`));
      }
    });

    child.on('error', (error) => {
      if (timeout) clearTimeout(timeout);
      print(`\n💥 Test execution error: ${error.message}`, colors.red);
      reject(error);
    });
  });
}

/**
 * Run specific test categories
 */
async function runTestCategories() {
  const categories = [
    {
      name: 'Load Functions & SSR',
      pattern: 'Load Functions',
      description: 'Server-side data loading and SSR support'
    },
    {
      name: 'Static Generation', 
      pattern: 'Static Site Generation',
      description: 'Prerendering and build-time optimization'
    },
    {
      name: 'Hydration Process',
      pattern: 'Hydration',
      description: 'Client-side state hydration and synchronization'
    },
    {
      name: 'Performance & Caching',
      pattern: 'Performance',
      description: 'Load optimization and caching mechanisms'
    },
    {
      name: 'WebAssembly Fallbacks',
      pattern: 'WebAssembly',
      description: 'Node.js environment fallback handling'
    },
    {
      name: 'Route Calculations',
      pattern: 'Route Calculations',
      description: 'Cross-environment route processing'
    },
    {
      name: 'SEO Optimization',
      pattern: 'SEO',
      description: 'Metadata generation and sitemap creation'
    },
    {
      name: 'Error Handling',
      pattern: 'Error Handling',
      description: 'Fallback mechanisms and error recovery'
    }
  ];

  for (const category of categories) {
    print(`\n📋 Running ${category.name} Tests`, colors.magenta);
    print(`   ${category.description}`, colors.blue);
    print('-'.repeat(50), colors.blue);

    try {
      await runVitest(['--grep', category.pattern]);
      print(`✅ ${category.name} tests completed`, colors.green);
    } catch (error) {
      print(`❌ ${category.name} tests failed: ${error.message}`, colors.red);
      throw error;
    }
  }
}

/**
 * Generate test report
 */
async function generateReport() {
  print('\n📊 Generating Test Report...', colors.blue);
  
  try {
    const fs = await import('fs');
    const resultsPath = join(__dirname, 'test-results.json');
    
    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      print('\n📈 Test Summary:', colors.bright);
      print(`   Total Tests: ${results.numTotalTests || 'N/A'}`, colors.blue);
      print(`   Passed: ${results.numPassedTests || 'N/A'}`, colors.green);
      print(`   Failed: ${results.numFailedTests || 0}`, results.numFailedTests > 0 ? colors.red : colors.green);
      print(`   Duration: ${results.testResults?.[0]?.perfStats?.runtime || 'N/A'}ms`, colors.blue);
      
      if (results.coverageMap) {
        print(`   Coverage: Available in coverage/ directory`, colors.blue);
      }
    }
  } catch (error) {
    print(`⚠️  Could not generate detailed report: ${error.message}`, colors.yellow);
  }
}

/**
 * Main test execution function
 */
async function main() {
  const args = process.argv.slice(2);
  
  try {
    printHeader();

    if (args.includes('--help') || args.includes('-h')) {
      print('\n📚 SvelteKit Integration Test Runner Usage:', colors.bright);
      print('  npm test                    # Run all tests', colors.blue);
      print('  npm test -- --watch         # Run in watch mode', colors.blue);
      print('  npm test -- --coverage      # Run with coverage', colors.blue);
      print('  npm test -- --grep "SSR"    # Run specific pattern', colors.blue);
      print('  npm test -- --categories    # Run by categories', colors.blue);
      print('  npm test -- --help          # Show this help', colors.blue);
      return;
    }

    const startTime = Date.now();

    if (args.includes('--categories')) {
      print('🎯 Running tests by category...', colors.yellow);
      await runTestCategories();
    } else {
      print('🏃 Running all SvelteKit integration tests...', colors.yellow);
      await runVitest(args);
    }

    const duration = Date.now() - startTime;
    
    await generateReport();
    
    print('\n' + '='.repeat(80), colors.green);
    print('🎉 SVELTEKIT INTEGRATION TESTS COMPLETED', colors.bright + colors.green);
    print(`⏱️  Total Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`, colors.green);
    print('='.repeat(80), colors.green);
    
    // REQ-API-004 validation summary
    print('\n✅ REQ-API-004 Validation Summary:', colors.bright + colors.green);
    print('   ✓ Load functions provide server-side data loading', colors.green);
    print('   ✓ Stores serialize/deserialize state during SSR', colors.green);
    print('   ✓ Route calculations work in server/client environments', colors.green);
    print('   ✓ SDK supports static site generation', colors.green);
    print('   ✓ WebAssembly fallbacks for Node.js environments', colors.green);
    print('\n🚀 All SvelteKit SSR and Hydration requirements validated!', colors.bright + colors.green);

  } catch (error) {
    print('\n' + '='.repeat(80), colors.red);
    print('💥 SVELTEKIT INTEGRATION TESTS FAILED', colors.bright + colors.red);
    print(`❌ Error: ${error.message}`, colors.red);
    print('='.repeat(80), colors.red);
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  print(`\n💥 Uncaught Exception: ${error.message}`, colors.red);
  print(error.stack || '', colors.red);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  print(`\n💥 Unhandled Rejection at: ${promise}`, colors.red);
  print(`Reason: ${reason}`, colors.red);
  process.exit(1);
});

// Execute main function
main().catch((error) => {
  print(`\n💥 Execution Error: ${error.message}`, colors.red);
  process.exit(1);
});