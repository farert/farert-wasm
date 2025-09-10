/**
 * Global Setup for Cache Performance Tests
 * 
 * Global setup configuration that runs once before all cache performance tests.
 * Initializes test environment, configures memory monitoring, and prepares
 * performance measurement infrastructure.
 * 
 * @file Global Test Setup
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

/**
 * Global setup function
 */
export default async function globalSetup(): Promise<void> {
  console.log('🚀 Starting Cache Performance Test Suite Setup...');
  
  try {
    // Create test output directories
    await createTestDirectories();
    
    // Initialize performance monitoring
    await initializePerformanceMonitoring();
    
    // Configure Node.js for optimal testing
    configureNodeEnvironment();
    
    // Create test metadata file
    await createTestMetadata();
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

/**
 * Create necessary test directories
 */
async function createTestDirectories(): Promise<void> {
  const directories = [
    'tests/sdk/cache/reports',
    'tests/sdk/cache/artifacts',
    'tests/sdk/cache/snapshots'
  ];
  
  for (const dir of directories) {
    try {
      await mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }
}

/**
 * Initialize performance monitoring infrastructure
 */
async function initializePerformanceMonitoring(): Promise<void> {
  // Set up performance monitoring globals
  const performanceConfig = {
    startTime: Date.now(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    memoryLimit: getMemoryLimit(),
    cpuCount: require('os').cpus().length,
    testConfiguration: {
      globalMemoryLimit: 50 * 1024 * 1024, // 50MB
      testTimeout: 60000, // 60 seconds
      maxWorkers: 2,
      runInBand: true
    }
  };
  
  // Write performance config to file for reference
  const configPath = join('tests/sdk/cache/artifacts', 'performance-config.json');
  await writeFile(configPath, JSON.stringify(performanceConfig, null, 2));
  
  console.log('📊 Performance monitoring initialized');
  console.log(`   - Memory limit: ${(performanceConfig.memoryLimit / 1024 / 1024).toFixed(0)}MB`);
  console.log(`   - CPU cores: ${performanceConfig.cpuCount}`);
  console.log(`   - Platform: ${performanceConfig.platform} (${performanceConfig.architecture})`);
}

/**
 * Configure Node.js environment for optimal testing
 */
function configureNodeEnvironment(): void {
  // Set optimal garbage collection flags
  if (!process.env.NODE_OPTIONS) {
    process.env.NODE_OPTIONS = '';
  }
  
  const gcFlags = [
    '--max-old-space-size=2048', // 2GB heap limit
    '--expose-gc', // Allow manual GC
    '--optimize-for-size' // Optimize for memory usage
  ];
  
  for (const flag of gcFlags) {
    if (!process.env.NODE_OPTIONS.includes(flag)) {
      process.env.NODE_OPTIONS += ` ${flag}`;
    }
  }
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.CACHE_TEST_MODE = 'performance';
  
  // Configure timers for better precision
  if (typeof process.hrtime.bigint === 'function') {
    console.log('⏱️  High-resolution timer available');
  }
  
  console.log('⚙️  Node.js environment configured for testing');
}

/**
 * Create test metadata file
 */
async function createTestMetadata(): Promise<void> {
  const metadata = {
    testSuiteVersion: '1.0.0',
    framework: 'Jest',
    testType: 'Cache Performance',
    requirements: ['REQ-API-002'],
    testCategories: [
      'LRU Eviction',
      'TTL Expiration',
      'Memory Management', 
      'Performance Benchmarks',
      'Concurrent Access',
      'Edge Cases'
    ],
    expectedDuration: '10-15 minutes',
    createdAt: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryLimit: getMemoryLimit()
    }
  };
  
  const metadataPath = join('tests/sdk/cache/artifacts', 'test-metadata.json');
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  console.log('📝 Test metadata created');
}

/**
 * Get current memory limit
 */
function getMemoryLimit(): number {
  try {
    // Try to get V8 heap statistics
    const v8 = require('v8');
    const heapStats = v8.getHeapStatistics();
    return heapStats.heap_size_limit;
  } catch (error) {
    // Fallback to approximate value
    return 2 * 1024 * 1024 * 1024; // 2GB default
  }
}

/**
 * Validate test environment
 */
function validateTestEnvironment(): boolean {
  const requiredFeatures = [
    () => typeof performance !== 'undefined',
    () => typeof global !== 'undefined',
    () => process.version.startsWith('v'),
    () => require('fs').existsSync
  ];
  
  for (const check of requiredFeatures) {
    if (!check()) {
      return false;
    }
  }
  
  return true;
}

// Validate environment before proceeding
if (!validateTestEnvironment()) {
  throw new Error('Test environment validation failed');
}