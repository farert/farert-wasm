#!/usr/bin/env node

/**
 * Cache Performance Test Runner
 * 
 * Convenient script to run cache performance tests with optimal configuration
 * and performance monitoring for REQ-API-002 validation.
 * 
 * @file Cache Test Runner
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

const { spawn } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_CONFIG = {
  testFile: 'tests/sdk/cache/cache-performance.test.ts',
  jestConfig: 'tests/sdk/cache/jest.config.js',
  timeout: 120000, // 2 minutes
  maxWorkers: 2,
  nodeOptions: [
    '--max-old-space-size=4096',
    '--expose-gc',
    '--optimize-for-size'
  ]
};

const REPORT_DIRS = [
  'tests/sdk/cache/reports',
  'tests/sdk/cache/artifacts',
  'tests/sdk/cache/snapshots'
];

// ============================================================================
// UTILITY FUNCTIONS  
// ============================================================================

/**
 * Print colored console output
 */
function print(message, color = 'white') {
  const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title) {
  const border = '='.repeat(60);
  print(border, 'cyan');
  print(`  ${title}`, 'cyan');
  print(border, 'cyan');
}

/**
 * Create required directories
 */
function createDirectories() {
  print('📁 Creating test directories...', 'blue');
  
  for (const dir of REPORT_DIRS) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      print(`   ✅ Created: ${dir}`, 'green');
    } else {
      print(`   ℹ️  Exists: ${dir}`, 'yellow');
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    verbose: false,
    coverage: false,
    watch: false,
    debug: false,
    quick: false,
    pattern: null
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--debug':
      case '-d':
        options.debug = true;
        break;
      case '--quick':
      case '-q':
        options.quick = true;
        break;
      case '--pattern':
      case '-p':
        options.pattern = args[i + 1];
        i++;
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  printHeader('Cache Performance Test Runner');
  
  console.log(`
Usage: node run-cache-tests.js [options]

Options:
  -v, --verbose     Enable verbose output
  -c, --coverage    Generate coverage reports
  -w, --watch       Run in watch mode
  -d, --debug       Enable debug mode with inspector
  -q, --quick       Run quick test suite (subset)
  -p, --pattern     Run specific test pattern
  -h, --help        Show this help message

Examples:
  node run-cache-tests.js                    # Run all cache performance tests
  node run-cache-tests.js --verbose          # Run with verbose output
  node run-cache-tests.js --coverage         # Run with coverage report
  node run-cache-tests.js --pattern "LRU"    # Run only LRU-related tests
  node run-cache-tests.js --debug            # Run with Node.js inspector
  node run-cache-tests.js --quick            # Run quick test subset

Performance Requirements Tested:
  - REQ-API-002: Intelligent Caching and Performance Layer
  - <10ms average response time for cached operations
  - 50MB global memory limit enforcement
  - LRU eviction under memory pressure
  - TTL expiration timing accuracy
  - Cache hit/miss ratio optimization

Report Generation:
  - HTML report: tests/sdk/cache/reports/test-report.html
  - JSON summary: tests/sdk/cache/reports/test-summary.json
  - Performance metrics: tests/sdk/cache/artifacts/final-metrics.json
`);
}

/**
 * Build Jest command arguments
 */
function buildJestArgs(options) {
  const args = [
    TEST_CONFIG.testFile,
    '--config', TEST_CONFIG.jestConfig,
    '--testTimeout', TEST_CONFIG.timeout.toString(),
    '--maxWorkers', TEST_CONFIG.maxWorkers.toString(),
    '--runInBand'
  ];
  
  if (options.verbose) {
    args.push('--verbose');
  }
  
  if (options.coverage) {
    args.push('--coverage');
    args.push('--coverageDirectory', 'tests/sdk/cache/coverage');
  }
  
  if (options.watch) {
    args.push('--watch');
  }
  
  if (options.pattern) {
    args.push('--testNamePattern', options.pattern);
  }
  
  if (options.quick) {
    args.push('--testNamePattern', 'should validate all caching requirements|should meet.*performance requirement');
  }
  
  // Always generate reports
  args.push('--reporters', 'default');
  
  return args;
}

/**
 * Build Node.js options
 */
function buildNodeOptions(options) {
  let nodeOptions = [...TEST_CONFIG.nodeOptions];
  
  if (options.debug) {
    nodeOptions.push('--inspect');
  }
  
  return nodeOptions.join(' ');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

/**
 * Main execution function
 */
async function main() {
  try {
    const options = parseArguments();
    
    printHeader('Farert Cache Performance Test Suite');
    
    print('🚀 Starting cache performance tests...', 'green');
    print(`   Test file: ${TEST_CONFIG.testFile}`, 'blue');
    print(`   Configuration: ${TEST_CONFIG.jestConfig}`, 'blue');
    print(`   Timeout: ${TEST_CONFIG.timeout / 1000}s`, 'blue');
    print(`   Max workers: ${TEST_CONFIG.maxWorkers}`, 'blue');
    
    if (options.debug) {
      print('   🐛 Debug mode enabled', 'yellow');
    }
    
    if (options.quick) {
      print('   ⚡ Quick mode - running subset of tests', 'yellow');
    }
    
    if (options.pattern) {
      print(`   🔍 Pattern filter: ${options.pattern}`, 'yellow');
    }
    
    // Create directories
    createDirectories();
    
    // Build command
    const jestArgs = buildJestArgs(options);
    const nodeOptions = buildNodeOptions(options);
    
    print('\\n📋 Test execution details:', 'blue');
    print(`   Node options: ${nodeOptions}`, 'cyan');
    print(`   Jest command: npx jest ${jestArgs.join(' ')}`, 'cyan');
    
    // Set environment
    const env = {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      NODE_ENV: 'test',
      CACHE_TEST_MODE: 'performance'
    };
    
    print('\\n🏃 Running tests...', 'green');
    
    // Execute Jest
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      env,
      cwd: process.cwd()
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        print('\\n✅ All cache performance tests passed!', 'green');
        print('\\n📊 Generated reports:', 'blue');
        print('   - HTML Report: tests/sdk/cache/reports/test-report.html', 'cyan');
        print('   - JSON Summary: tests/sdk/cache/reports/test-summary.json', 'cyan');
        print('   - Performance Metrics: tests/sdk/cache/artifacts/final-metrics.json', 'cyan');
        
        if (options.coverage) {
          print('   - Coverage Report: tests/sdk/cache/coverage/index.html', 'cyan');
        }
        
        print('\\n🎯 REQ-API-002 validation completed successfully!', 'green');
        
      } else {
        print('\\n❌ Some tests failed. Check the output above for details.', 'red');
        print('\\n🔧 Troubleshooting tips:', 'yellow');
        print('   - Increase memory: NODE_OPTIONS="--max-old-space-size=8192"', 'yellow');
        print('   - Run specific tests: --pattern "LRU Eviction"', 'yellow');
        print('   - Enable debug mode: --debug', 'yellow');
      }
      
      process.exit(code);
    });
    
    jest.on('error', (error) => {
      print(`\\n❌ Failed to start test runner: ${error.message}`, 'red');
      process.exit(1);
    });
    
  } catch (error) {
    print(`\\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  print('\\n🛑 Test execution interrupted', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  print('\\n🛑 Test execution terminated', 'yellow');
  process.exit(143);
});

// Execute main function
if (require.main === module) {
  main().catch(error => {
    print(`\\nUnexpected error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, parseArguments, buildJestArgs };