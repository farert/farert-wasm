/**
 * Global Teardown for Cache Performance Tests
 * 
 * Global teardown configuration that runs once after all cache performance tests.
 * Collects performance metrics, generates reports, and cleans up test environment.
 * 
 * @file Global Test Teardown
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Global teardown function
 */
export default async function globalTeardown(): Promise<void> {
  console.log('🏁 Starting Cache Performance Test Suite Teardown...');
  
  try {
    // Collect final performance metrics
    await collectPerformanceMetrics();
    
    // Generate test summary report
    await generateTestSummary();
    
    // Clean up test artifacts
    await cleanupTestEnvironment();
    
    // Final memory cleanup
    performFinalCleanup();
    
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw to avoid masking test failures
  }
}

/**
 * Collect performance metrics from test run
 */
async function collectPerformanceMetrics(): Promise<void> {
  const metrics = {
    endTime: Date.now(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime(),
    heapStatistics: getHeapStatistics(),
    gcStatistics: getGCStatistics()
  };
  
  // Read start time from setup
  try {
    const configPath = join('tests/sdk/cache/artifacts', 'performance-config.json');
    const configData = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    metrics.totalDuration = metrics.endTime - config.startTime;
  } catch (error) {
    console.warn('Could not read start time from config');
  }
  
  // Write final metrics
  const metricsPath = join('tests/sdk/cache/artifacts', 'final-metrics.json');
  await writeFile(metricsPath, JSON.stringify(metrics, null, 2));
  
  console.log('📊 Performance metrics collected');
  console.log(`   - Memory used: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
  console.log(`   - Total duration: ${(metrics.totalDuration || 0 / 1000).toFixed(1)}s`);
}

/**
 * Generate comprehensive test summary report
 */
async function generateTestSummary(): Promise<void> {
  const summary = {
    testSuite: 'Cache Performance Tests',
    completedAt: new Date().toISOString(),
    requirements: {
      'REQ-API-002': {
        description: 'Intelligent Caching and Performance Layer',
        testAreas: [
          'Station information cached for 1 hour with automatic expiration',
          'Search results cached for 15 minutes with LRU eviction strategy',
          'Route calculations cached for 5 minutes',
          'Database reference data cached for entire session duration',
          'Automatic purge when exceeding 50MB using LRU algorithm'
        ],
        status: 'Tested'
      }
    },
    testCategories: {
      'LRU Eviction Tests': {
        description: 'Validate LRU eviction under memory pressure',
        keyTests: [
          'Memory limit enforcement',
          'Eviction priority ordering',
          'Performance during eviction'
        ]
      },
      'TTL Accuracy Tests': {
        description: 'Validate precise TTL expiration timing',
        keyTests: [
          'Category-specific TTL values',
          'Timing precision',
          'Absolute vs sliding expiration'
        ]
      },
      'Memory Management Tests': {
        description: '50MB global limit enforcement',
        keyTests: [
          'Emergency eviction triggers',
          'Memory distribution',
          'Automatic cleanup'
        ]
      },
      'Performance Benchmarks': {
        description: '<10ms requirement validation',
        keyTests: [
          'Cached lookup performance',
          'Concurrent access performance',
          'Cache vs non-cached comparison'
        ]
      },
      'Integration Tests': {
        description: 'End-to-end validation',
        keyTests: [
          'REQ-API-002 comprehensive validation',
          'Real-world usage patterns',
          'Edge case handling'
        ]
      }
    },
    performanceTargets: {
      'Cached Operations': '<10ms average',
      'Cache Hit Ratio': '>85%',
      'Memory Limit': '50MB global',
      'TTL Accuracy': '±00ms precision'
    },
    testEnvironment: {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memoryLimit: getMemoryLimit()
    }
  };
  
  const summaryPath = join('tests/sdk/cache/reports', 'test-summary.json');
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  // Generate human-readable report
  const readableReport = generateReadableReport(summary);
  const reportPath = join('tests/sdk/cache/reports', 'test-summary.md');
  await writeFile(reportPath, readableReport);
  
  console.log('📋 Test summary generated');
}

/**
 * Generate human-readable test report
 */
function generateReadableReport(summary: any): string {
  return `# Cache Performance Test Summary

## Test Suite: ${summary.testSuite}
**Completed:** ${summary.completedAt}

## Requirements Validation

### ${Object.keys(summary.requirements)[0]}
${summary.requirements['REQ-API-002'].description}

**Test Areas:**
${summary.requirements['REQ-API-002'].testAreas.map((area: string) => `- ${area}`).join('\n')}

## Test Categories

${Object.entries(summary.testCategories).map(([category, details]: [string, any]) => `
### ${category}
${details.description}

**Key Tests:**
${details.keyTests.map((test: string) => `- ${test}`).join('\n')}
`).join('\n')}

## Performance Targets

${Object.entries(summary.performanceTargets).map(([target, requirement]) => `- **${target}:** ${requirement}`).join('\n')}

## Test Environment

- **Node.js Version:** ${summary.testEnvironment.nodeVersion}
- **Platform:** ${summary.testEnvironment.platform}
- **Architecture:** ${summary.testEnvironment.architecture}
- **Memory Limit:** ${(summary.testEnvironment.memoryLimit / 1024 / 1024 / 1024).toFixed(1)}GB

## Files Generated

- \`performance-config.json\` - Test configuration
- \`final-metrics.json\` - Performance metrics
- \`test-summary.json\` - Detailed test summary
- \`test-report.html\` - HTML test report (if generated)

---
*Report generated by Farert WebAssembly Cache Performance Test Suite*
`;
}

/**
 * Clean up test environment and artifacts
 */
async function cleanupTestEnvironment(): Promise<void> {
  try {
    // Force garbage collection if available
    if (typeof global.gc === 'function') {
      global.gc();
      console.log('🗑️  Manual garbage collection triggered');
    }
    
    // Clear any remaining intervals/timeouts
    const highestIntervalId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
      clearTimeout(i);
    }
    
    console.log('🧹 Test environment cleaned up');
    
  } catch (error) {
    console.warn('Warning during cleanup:', error);
  }
}

/**
 * Perform final memory and resource cleanup
 */
function performFinalCleanup(): void {
  // Clear any global test utilities
  if (typeof global.testUtils !== 'undefined') {
    delete global.testUtils;
  }
  
  if (typeof global.performanceMonitor !== 'undefined') {
    delete global.performanceMonitor;
  }
  
  // Reset environment variables
  delete process.env.CACHE_TEST_MODE;
  
  console.log('♻️  Final cleanup completed');
}

/**
 * Get V8 heap statistics
 */
function getHeapStatistics(): any {
  try {
    const v8 = require('v8');
    return v8.getHeapStatistics();
  } catch (error) {
    return { error: 'V8 statistics not available' };
  }
}

/**
 * Get garbage collection statistics
 */
function getGCStatistics(): any {
  try {
    const v8 = require('v8');
    if (typeof v8.getHeapSpaceStatistics === 'function') {
      return {
        heapSpaces: v8.getHeapSpaceStatistics(),
        heapCodeStatistics: v8.getHeapCodeStatistics ? v8.getHeapCodeStatistics() : null
      };
    }
  } catch (error) {
    return { error: 'GC statistics not available' };
  }
  
  return { message: 'Basic cleanup only' };
}

/**
 * Get memory limit
 */
function getMemoryLimit(): number {
  try {
    const v8 = require('v8');
    const heapStats = v8.getHeapStatistics();
    return heapStats.heap_size_limit;
  } catch (error) {
    return 2 * 1024 * 1024 * 1024; // 2GB default
  }
}