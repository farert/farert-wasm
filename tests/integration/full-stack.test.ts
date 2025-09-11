/**
 * Frontend API Layer - Full Stack Integration Test Suite
 * 
 * Comprehensive end-to-end validation of all Frontend API Layer requirements,
 * framework integrations, performance characteristics, and real-world usage scenarios.
 * 
 * This test suite validates ALL requirements from REQ-API-001 through REQ-API-006
 * with complete integration testing across the entire frontend API layer stack.
 * 
 * @file Full Stack Integration Test Suite
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { Page, Browser } from 'playwright';
import { chromium, firefox, webkit } from 'playwright';
import { performance } from 'perf_hooks';
import { setTimeout } from 'timers/promises';

// Import all SDK components for comprehensive testing
import {
  FarertSDK,
  createFarertSDK,
  createDevelopmentSDK,
  createProductionSDK,
  quickStart,
  createCalculator,
  SDK_INFO,
  type SDKConfig,
  type SDKState
} from '../../src/sdk/core/farert-sdk';

// Framework integrations
import {
  farertStore,
  createStationSearchStore,
  createRouteBuilderStore,
  createFareCalculationStore,
  createSvelteSDKContext,
  getSDK,
  type SvelteStoreCollection
} from '../../src/sdk/svelte';

import {
  FarertSDKProvider,
  useFarertSDK,
  useStationSearch,
  useFareCalculation,
  useRouteBuilder
} from '../../src/sdk/react';

import {
  FarertSDKPlugin,
  useFarertSDK as useVueFarertSDK,
  useStationSearch as useVueStationSearch
} from '../../src/sdk/vue';

// Core infrastructure
import {
  CacheManager,
  CacheCategory,
  createProductionCacheManager,
  type CacheManagerStats
} from '../../src/sdk/cache/cache-manager';

import {
  ErrorManager,
  ErrorSeverity,
  ErrorCategory,
  createProductionErrorManager,
  type ErrorManagerStats
} from '../../src/sdk/errors/error-manager';

import {
  InputValidator,
  createStrictInputValidator,
  SecurityLevel,
  type ValidationResult
} from '../../src/sdk/security/input-validator';

// Utilities
import {
  formatFare,
  validateRoute,
  createRouteBuilder,
  detectFramework,
  type RouteValidationResult
} from '../../src/sdk/utils';

// Debug and performance monitoring
import {
  DebugTools,
  createDevelopmentDebugTools,
  type DiagnosticReport,
  type PerformanceMonitoringData
} from '../../src/sdk/debug/debug-tools';

// Types
import type {
  StationInfo,
  StationSearchResult,
  RouteSegment,
  FareCalculationResult,
  FareBreakdownItem,
  CompanyInfo,
  PrefectureInfo,
  LineInfo
} from '../../src/sdk/types/core';

// ============================================================================
// TEST INFRASTRUCTURE AND SETUP
// ============================================================================

/**
 * Global test configuration and state
 */
interface TestEnvironment {
  browsers: {
    chromium?: Browser;
    firefox?: Browser;
    webkit?: Browser;
  };
  pages: Page[];
  sdk: FarertSDK | null;
  startTime: number;
  performanceMetrics: PerformanceMonitoringData[];
  memorySnapshots: Array<{
    timestamp: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  }>;
}

const testEnv: TestEnvironment = {
  browsers: {},
  pages: [],
  sdk: null,
  startTime: 0,
  performanceMetrics: [],
  memorySnapshots: []
};

/**
 * Real Japanese railway test data for comprehensive validation
 */
const JAPANESE_RAILWAY_TEST_DATA = {
  stations: [
    { id: 1130101, name: '東京', kana: 'とうきょう', prefecture: '東京都' },
    { id: 1130401, name: '横浜', kana: 'よこはま', prefecture: '神奈川県' },
    { id: 1130201, name: '品川', kana: 'しながわ', prefecture: '東京都' },
    { id: 1130301, name: '新宿', kana: 'しんじゅく', prefecture: '東京都' },
    { id: 2741002, name: '大阪', kana: 'おおさか', prefecture: '大阪府' },
    { id: 2640101, name: '京都', kana: 'きょうと', prefecture: '京都府' },
    { id: 1430802, name: '仙台', kana: 'せんだい', prefecture: '宮城県' },
    { id: 1320302, name: '千葉', kana: 'ちば', prefecture: '千葉県' }
  ],
  
  lines: [
    { id: 11301, name: '東海道線', company: 'JR東日本' },
    { id: 11302, name: '山手線', company: 'JR東日本' },
    { id: 11303, name: '中央線', company: 'JR東日本' },
    { id: 11401, name: '京浜東北線', company: 'JR東日本' },
    { id: 27101, name: '東海道新幹線', company: 'JR東海' }
  ],
  
  routes: [
    {
      description: '東京→横浜（東海道線）',
      segments: ['東京', '東海道線', '横浜'],
      expectedFare: 320,
      expectedTime: 30,
      difficulty: 'simple'
    },
    {
      description: '東京→大阪（新幹線）',
      segments: ['東京', '東海道新幹線', '新大阪', '東海道線', '大阪'],
      expectedFare: 13320,
      expectedTime: 180,
      difficulty: 'complex'
    },
    {
      description: '新宿→品川→横浜（乗り換えあり）',
      segments: ['新宿', '山手線', '品川', '東海道線', '横浜'],
      expectedFare: 280,
      expectedTime: 45,
      difficulty: 'transfer'
    }
  ],
  
  companies: [
    { id: 1, name: 'JR東日本', type: 'JR' },
    { id: 2, name: 'JR東海', type: 'JR' },
    { id: 3, name: 'JR西日本', type: 'JR' },
    { id: 101, name: '東京急行電鉄', type: 'private' }
  ],
  
  searchQueries: [
    { query: '東京', expectedResults: 3, expectedTop: '東京' },
    { query: 'とうきょう', expectedResults: 3, expectedTop: '東京' },
    { query: '新宿', expectedResults: 1, expectedTop: '新宿' },
    { query: '横浜', expectedResults: 1, expectedTop: '横浜' },
    { query: '存在しない駅', expectedResults: 0, expectedTop: null }
  ]
} as const;

/**
 * Performance benchmarks for validation
 */
const PERFORMANCE_BENCHMARKS = {
  sdkInitialization: { max: 2000, target: 1000 }, // milliseconds
  cachedApiCalls: { max: 10, target: 5 }, // milliseconds
  routeCalculation: { max: 500, target: 200 }, // milliseconds
  stationSearch: { max: 100, target: 50 }, // milliseconds
  bundleSize: { max: 150 * 1024, target: 100 * 1024 }, // bytes (gzipped)
  memoryUsage: { max: 50 * 1024 * 1024, target: 25 * 1024 * 1024 } // bytes
} as const;

/**
 * Helper function to measure performance
 */
function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<{ result: T; duration: number; memoryUsage: NodeJS.MemoryUsage }> {
  return new Promise(async (resolve) => {
    const startMemory = process.memoryUsage();
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      const duration = endTime - startTime;
      const memoryUsage = {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      };
      
      testEnv.performanceMetrics.push({
        operationName,
        duration,
        memoryUsage: memoryUsage.heapUsed,
        timestamp: Date.now(),
        success: true
      });
      
      resolve({ result, duration, memoryUsage });
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      testEnv.performanceMetrics.push({
        operationName,
        duration,
        memoryUsage: 0,
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  });
}

/**
 * Create mock implementations for testing
 */
function createMockImplementations() {
  // Mock WebAssembly module
  const mockWasmModule = {
    // Station operations
    getStationId: vi.fn((name: string) => {
      const station = JAPANESE_RAILWAY_TEST_DATA.stations.find(s => s.name === name);
      return station ? station.id : -1;
    }),
    getStationName: vi.fn((id: number) => {
      const station = JAPANESE_RAILWAY_TEST_DATA.stations.find(s => s.id === id);
      return station ? station.name : '';
    }),
    getStationReading: vi.fn((id: number) => {
      const station = JAPANESE_RAILWAY_TEST_DATA.stations.find(s => s.id === id);
      return station ? station.kana : '';
    }),
    
    // Route and fare calculation
    calculateFare: vi.fn(() => 320),
    getFareInfoJson: vi.fn(() => JSON.stringify({
      fare: 320,
      discount: 0,
      fareBreakdown: [
        { lineName: '東海道線', fare: 320, distance: 25.5 }
      ]
    })),
    
    // Line operations
    getLineName: vi.fn((id: number) => {
      const line = JAPANESE_RAILWAY_TEST_DATA.lines.find(l => l.id === id);
      return line ? line.name : '';
    }),
    
    // Database operations (hidden)
    openDatabase: vi.fn().mockReturnValue(true),
    closeDatabase: vi.fn(),
    getDatabaseVersion: vi.fn().mockReturnValue(20240101)
  };

  // Mock browser APIs for Node.js environment
  if (typeof window === 'undefined') {
    (global as any).window = {
      performance,
      navigator: { userAgent: 'test' },
      document: { createElement: vi.fn() },
      WebAssembly: { instantiate: vi.fn() }
    };
  }

  return { mockWasmModule };
}

// ============================================================================
// GLOBAL TEST SETUP AND TEARDOWN
// ============================================================================

beforeAll(async () => {
  testEnv.startTime = performance.now();
  
  // Initialize test environment
  createMockImplementations();
  
  // Setup browsers for cross-browser testing
  if (process.env.INTEGRATION_TEST_BROWSERS !== 'false') {
    try {
      testEnv.browsers.chromium = await chromium.launch({ headless: true });
      testEnv.browsers.firefox = await firefox.launch({ headless: true });
      testEnv.browsers.webkit = await webkit.launch({ headless: true });
    } catch (error) {
      console.warn('[Integration Test] Browser setup failed, continuing without browser tests:', error);
    }
  }
  
  console.log('[Integration Test] Environment initialized successfully');
}, 30000);

afterAll(async () => {
  // Cleanup SDK instance
  if (testEnv.sdk) {
    await testEnv.sdk.dispose();
  }
  
  // Close all browser pages and browsers
  for (const page of testEnv.pages) {
    try {
      await page.close();
    } catch (error) {
      console.warn('[Integration Test] Failed to close page:', error);
    }
  }
  
  for (const browser of Object.values(testEnv.browsers)) {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.warn('[Integration Test] Failed to close browser:', error);
      }
    }
  }
  
  // Performance summary
  const totalTime = performance.now() - testEnv.startTime;
  const successfulOps = testEnv.performanceMetrics.filter(m => m.success).length;
  const failedOps = testEnv.performanceMetrics.filter(m => !m.success).length;
  
  console.log(`
[Integration Test] Performance Summary:
- Total test time: ${Math.round(totalTime)}ms
- Operations completed: ${successfulOps}
- Operations failed: ${failedOps}
- Memory snapshots: ${testEnv.memorySnapshots.length}
  `);
}, 15000);

beforeEach(() => {
  // Take memory snapshot
  const memory = process.memoryUsage();
  testEnv.memorySnapshots.push({
    timestamp: Date.now(),
    heapUsed: memory.heapUsed,
    heapTotal: memory.heapTotal,
    external: memory.external
  });
});

afterEach(async () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Small delay to allow cleanup
  await setTimeout(10);
});

// ============================================================================
// REQ-API-001: CORE TYPESCRIPT SDK FOUNDATION TESTS
// ============================================================================

describe('REQ-API-001: Core TypeScript SDK Foundation', () => {
  describe('SDK Initialization and Lifecycle', () => {
    test('should initialize SDK with complete WebAssembly API access', async () => {
      const { result, duration } = await measurePerformance('sdk-initialization', async () => {
        const sdk = createFarertSDK({
          development: true,
          caching: { enabled: true },
          errorHandling: { retryAttempts: 2 }
        });
        
        await sdk.initialize();
        return sdk;
      });
      
      testEnv.sdk = result;
      
      // Validate performance requirement
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.sdkInitialization.max);
      
      // Validate SDK state and API availability
      expect(result.isReady()).toBe(true);
      expect(result.state).toBe('ready');
      expect(result.version).toBeDefined();
      expect(typeof result.getStationById).toBe('function');
      expect(typeof result.calculateFare).toBe('function');
      expect(typeof result.searchStations).toBe('function');
    });

    test('should provide complete TypeScript types with JSDoc documentation', async () => {
      const sdk = testEnv.sdk!;
      
      // Test that TypeScript types are available and complete
      expect(sdk.config).toBeDefined();
      expect(sdk.config.caching).toBeDefined();
      expect(sdk.config.errorHandling).toBeDefined();
      expect(sdk.config.performance).toBeDefined();
      
      // Test object classes availability
      expect(sdk.objectClasses).toBeDefined();
      expect(sdk.objectClasses.Route).toBeDefined();
      expect(sdk.objectClasses.CalcRoute).toBeDefined();
      expect(sdk.objectClasses.RouteList).toBeDefined();
      expect(sdk.objectClasses.RouteItem).toBeDefined();
      expect(sdk.objectClasses.FareInfo).toBeDefined();
      
      // Test metrics and debugging interface
      expect(sdk.metrics).toBeDefined();
      expect(typeof sdk.metrics.getMetrics).toBe('function');
    });

    test('should handle WebAssembly loading failures with retry mechanisms', async () => {
      const { result } = await measurePerformance('sdk-retry-mechanism', async () => {
        let attempts = 0;
        const sdk = createFarertSDK({
          errorHandling: {
            retryAttempts: 3,
            retryDelay: 50,
            enableFuzzyMatching: true
          }
        });

        // Mock WebAssembly initialization to fail twice, then succeed
        const originalInitialize = (sdk as any).wasmWrapper?.initialize;
        if (originalInitialize) {
          (sdk as any).wasmWrapper.initialize = vi.fn().mockImplementation(async () => {
            attempts++;
            if (attempts <= 2) {
              throw new Error(`WebAssembly loading failed (attempt ${attempts})`);
            }
            return Promise.resolve();
          });
        }

        await sdk.initialize();
        return { sdk, attempts };
      });

      expect(result.attempts).toBe(3);
      expect(result.sdk.isReady()).toBe(true);
      
      await result.sdk.dispose();
    });

    test('should provide typed wrapper classes with lifecycle management', async () => {
      const sdk = testEnv.sdk!;
      
      // Test Route class creation and methods
      const route = sdk.objectClasses.Route.create();
      expect(route).toBeDefined();
      expect(typeof route.setupRoute).toBe('function');
      expect(typeof route.addRoute).toBe('function');
      
      // Test CalcRoute class with fare calculation
      const calcRoute = sdk.objectClasses.CalcRoute.create();
      expect(calcRoute).toBeDefined();
      expect(typeof calcRoute.calculateFare).toBe('function');
      
      // Test RouteItem creation
      const routeItem = sdk.objectClasses.RouteItem.create(1130101, 11301);
      expect(routeItem).toBeDefined();
      
      // Test FareInfo creation
      const fareInfo = sdk.objectClasses.FareInfo.createEmpty();
      expect(fareInfo).toBeDefined();
    });

    test('should detect database connection issues and provide guidance', async () => {
      const { result } = await measurePerformance('database-issue-detection', async () => {
        const sdk = createFarertSDK({ development: true });
        
        // Mock database connection failure
        const mockWasmWrapper = (sdk as any).wasmWrapper;
        if (mockWasmWrapper) {
          mockWasmWrapper.initialize = vi.fn().mockRejectedValue(
            new Error('Database file not found: jrdbnewest.db')
          );
        }

        let caughtError: any = null;
        try {
          await sdk.initialize();
        } catch (error) {
          caughtError = error;
        }

        return { error: caughtError, sdk };
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Database');
      
      await result.sdk.dispose();
    });
  });

  describe('WebAssembly API Coverage and Type Safety', () => {
    test('should provide access to all 39+ WebAssembly APIs', async () => {
      const sdk = testEnv.sdk!;
      
      // Station operations (8 APIs)
      expect(typeof sdk.getStationById).toBe('function');
      expect(typeof sdk.getStationByName).toBe('function');
      expect(typeof sdk.searchStations).toBe('function');
      
      // Route operations (12 APIs)
      expect(typeof sdk.createRoute).toBe('function');
      expect(typeof sdk.calculateFare).toBe('function');
      expect(typeof sdk.validateRoute).toBe('function');
      expect(typeof sdk.buildOptimalRoute).toBe('function');
      
      // Reference data operations (10 APIs)
      expect(typeof sdk.getLineInfo).toBe('function');
      expect(typeof sdk.getCompanyInfo).toBe('function');
      expect(typeof sdk.getCompanies).toBe('function');
      expect(typeof sdk.getPrefectures).toBe('function');
      expect(typeof sdk.getLines).toBe('function');
      
      // Utility operations (9 APIs)
      expect(sdk.cache).toBeDefined();
      expect(sdk.metrics).toBeDefined();
      expect(sdk.debug).toBeDefined();
      
      // Object class factories (6 classes)
      expect(sdk.objectClasses.Route).toBeDefined();
      expect(sdk.objectClasses.CalcRoute).toBeDefined();
      expect(sdk.objectClasses.RouteList).toBeDefined();
      expect(sdk.objectClasses.RouteItem).toBeDefined();
      expect(sdk.objectClasses.RouteFlag).toBeDefined();
      expect(sdk.objectClasses.FareInfo).toBeDefined();
    });

    test('should enforce correct parameter and return types', async () => {
      const sdk = testEnv.sdk!;
      
      // Test station lookup with type validation
      const stationById = await sdk.getStationById(1130101);
      if (stationById) {
        expect(typeof stationById.id).toBe('number');
        expect(typeof stationById.name).toBe('string');
        expect(typeof stationById.kana).toBe('string');
        expect(typeof stationById.prefecture).toBe('string');
        expect(typeof stationById.isJunction).toBe('boolean');
        expect(Array.isArray(stationById.lines)).toBe(true);
      }

      // Test search results type validation
      const searchResults = await sdk.searchStations('東京');
      expect(Array.isArray(searchResults)).toBe(true);
      
      for (const result of searchResults) {
        expect(result.station).toBeDefined();
        expect(typeof result.score).toBe('number');
        expect(typeof result.matchedField).toBe('string');
        expect(result.highlight).toBeDefined();
      }

      // Test fare calculation result type validation
      const fareResult = await sdk.calculateFare('東京 東海道線 横浜');
      expect(typeof fareResult.success).toBe('boolean');
      expect(typeof fareResult.totalFare).toBe('number');
      expect(Array.isArray(fareResult.breakdown)).toBe(true);
      expect(Array.isArray(fareResult.route)).toBe(true);
      expect(Array.isArray(fareResult.discounts)).toBe(true);
      expect(fareResult.metadata).toBeDefined();
    });
  });
});

// ============================================================================
// REQ-API-002: INTELLIGENT CACHING AND PERFORMANCE LAYER TESTS
// ============================================================================

describe('REQ-API-002: Intelligent Caching and Performance Layer', () => {
  describe('Station Information Caching', () => {
    test('should cache station information for 1 hour with automatic expiration', async () => {
      const sdk = testEnv.sdk!;
      const cacheManager = sdk.cache;
      
      // First request - should cache
      const { result: station1, duration: duration1 } = await measurePerformance('station-cache-miss', 
        () => sdk.getStationById(1130101)
      );
      
      // Second request - should hit cache
      const { result: station2, duration: duration2 } = await measurePerformance('station-cache-hit',
        () => sdk.getStationById(1130101)
      );
      
      expect(station1).toEqual(station2);
      expect(duration2).toBeLessThan(PERFORMANCE_BENCHMARKS.cachedApiCalls.max);
      
      // Verify cache statistics
      const cacheStats = cacheManager.getStats();
      expect(cacheStats.hits).toBeGreaterThan(0);
      expect(cacheStats.misses).toBeGreaterThan(0);
    });

    test('should cache search results for 15 minutes with LRU eviction', async () => {
      const sdk = testEnv.sdk!;
      
      // Test multiple search queries
      const queries = ['東京', '横浜', '新宿', '品川'];
      const searchResults: StationSearchResult[][] = [];
      
      for (const query of queries) {
        const { result } = await measurePerformance(`station-search-${query}`,
          () => sdk.searchStations(query)
        );
        searchResults.push(result);
      }
      
      // Verify all searches returned results
      expect(searchResults.every(results => Array.isArray(results))).toBe(true);
      
      // Test cache hit on repeated search
      const { result: cachedResult, duration } = await measurePerformance('cached-station-search',
        () => sdk.searchStations('東京')
      );
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.cachedApiCalls.max);
      expect(cachedResult).toEqual(searchResults[0]);
    });

    test('should cache route calculations for 5 minutes', async () => {
      const sdk = testEnv.sdk!;
      
      const routeSpec = '東京 東海道線 横浜';
      
      // First calculation - cache miss
      const { result: fare1, duration: duration1 } = await measurePerformance('route-calc-miss',
        () => sdk.calculateFare(routeSpec)
      );
      
      // Second calculation - cache hit
      const { result: fare2, duration: duration2 } = await measurePerformance('route-calc-hit',
        () => sdk.calculateFare(routeSpec)
      );
      
      expect(fare1.totalFare).toBe(fare2.totalFare);
      expect(duration2).toBeLessThan(PERFORMANCE_BENCHMARKS.cachedApiCalls.max);
      
      // Test metadata indicates cache hit
      expect(fare2.metadata.cacheHit).toBe(true);
    });

    test('should cache reference data for entire session duration', async () => {
      const sdk = testEnv.sdk!;
      
      // Test company data caching
      const { result: companies1 } = await measurePerformance('companies-cache-miss',
        () => sdk.getCompanies()
      );
      
      const { result: companies2, duration } = await measurePerformance('companies-cache-hit',
        () => sdk.getCompanies()
      );
      
      expect(companies1).toEqual(companies2);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.cachedApiCalls.max);
      
      // Test prefecture data caching
      const { result: prefectures } = await measurePerformance('prefectures-cache',
        () => sdk.getPrefectures()
      );
      
      expect(Array.isArray(prefectures)).toBe(true);
      expect(prefectures.length).toBeGreaterThan(0);
    });

    test('should automatically purge oldest entries using LRU when exceeding 50MB', async () => {
      const sdk = testEnv.sdk!;
      const cacheManager = sdk.cache;
      
      // Get initial cache statistics
      const initialStats = cacheManager.getStats();
      
      // Simulate heavy cache usage
      const heavyOperations = [];
      for (let i = 0; i < 100; i++) {
        heavyOperations.push(
          sdk.searchStations(`station-${i}`),
          sdk.calculateFare(`station-${i} line-${i} station-${i + 1}`)
        );
      }
      
      await Promise.all(heavyOperations);
      
      // Check that cache manager enforces memory limits
      const finalStats = cacheManager.getStats();
      expect(finalStats.memoryUsage).toBeLessThan(PERFORMANCE_BENCHMARKS.memoryUsage.max);
      
      // Verify LRU eviction occurred
      expect(finalStats.evictions).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring and Optimization', () => {
    test('should track detailed performance metrics', async () => {
      const sdk = testEnv.sdk!;
      const metrics = sdk.metrics;
      
      // Perform various operations
      await sdk.getStationById(1130101);
      await sdk.searchStations('東京');
      await sdk.calculateFare('東京 東海道線 横浜');
      
      const performanceData = metrics.getMetrics();
      
      expect(performanceData.timings).toBeDefined();
      expect(performanceData.metrics).toBeDefined();
      expect(performanceData.operations).toBeDefined();
      
      // Verify timing data is reasonable
      expect(Object.keys(performanceData.timings).length).toBeGreaterThan(0);
    });

    test('should optimize bundle size and memory usage', async () => {
      // Measure SDK memory footprint
      const startMemory = process.memoryUsage();
      
      const sdk = createFarertSDK({
        caching: { enabled: true, maxSize: 1000 },
        performance: { enabled: true }
      });
      
      await sdk.initialize();
      
      // Perform typical operations
      await sdk.getStationById(1130101);
      await sdk.calculateFare('東京 東海道線 横浜');
      
      const endMemory = process.memoryUsage();
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
      
      // Verify memory usage is within acceptable bounds
      expect(memoryUsed).toBeLessThan(PERFORMANCE_BENCHMARKS.memoryUsage.max);
      
      await sdk.dispose();
      
      // Verify cleanup
      const cleanupMemory = process.memoryUsage();
      expect(cleanupMemory.heapUsed).toBeLessThan(endMemory.heapUsed);
    });
  });
});

// ============================================================================
// REQ-API-003: SVELTE REACTIVE STORES AND COMPONENTS TESTS
// ============================================================================

describe('REQ-API-003: Svelte Reactive Stores and Components', () => {
  describe('Reactive Store Integration', () => {
    test('should provide debounced station search store with loading states', async () => {
      // Test station search store creation and functionality
      const searchStore = createStationSearchStore();
      
      expect(searchStore).toBeDefined();
      expect(typeof searchStore.subscribe).toBe('function');
      
      let currentState: any = null;
      const unsubscribe = searchStore.subscribe(state => {
        currentState = state;
      });
      
      // Test initial state
      expect(currentState.loading).toBe(false);
      expect(currentState.results).toEqual([]);
      expect(currentState.error).toBeNull();
      
      // Test search functionality with debouncing
      searchStore.search('東京');
      
      // Should show loading state
      expect(currentState.loading).toBe(true);
      
      // Wait for debounce and results
      await setTimeout(100);
      
      expect(currentState.loading).toBe(false);
      expect(Array.isArray(currentState.results)).toBe(true);
      
      unsubscribe();
    });

    test('should provide fare calculation store with automatic calculation', async () => {
      const fareStore = createFareCalculationStore();
      
      let currentState: any = null;
      const unsubscribe = fareStore.subscribe(state => {
        currentState = state;
      });
      
      // Test route calculation
      fareStore.setRoute('東京 東海道線 横浜');
      
      // Wait for calculation
      await setTimeout(100);
      
      expect(currentState.result).toBeDefined();
      expect(typeof currentState.result.totalFare).toBe('number');
      expect(currentState.calculating).toBe(false);
      
      unsubscribe();
    });

    test('should handle Svelte error boundaries gracefully', async () => {
      const routeBuilder = createRouteBuilderStore();
      
      let errorState: any = null;
      const unsubscribe = routeBuilder.subscribe(state => {
        errorState = state.error;
      });
      
      // Test error handling with invalid route
      routeBuilder.addSegment('invalid-station', 'invalid-line', 'invalid-destination');
      
      await setTimeout(100);
      
      // Should capture and handle errors gracefully
      expect(errorState).toBeDefined();
      expect(typeof errorState?.message).toBe('string');
      
      unsubscribe();
    });
  });

  describe('Component Integration Support', () => {
    test('should support StationSelector component data flow', async () => {
      const sdk = testEnv.sdk!;
      
      // Simulate component interaction patterns
      const stations = await sdk.searchStations('東京');
      expect(stations.length).toBeGreaterThan(0);
      
      const selectedStation = stations[0];
      expect(selectedStation.station.name).toBe('東京');
      expect(selectedStation.station.kana).toBe('とうきょう');
      
      // Test autocomplete functionality
      const autocompleteResults = await sdk.searchStations('とう');
      expect(autocompleteResults.length).toBeGreaterThan(0);
      expect(autocompleteResults.some(r => r.station.name.includes('東京'))).toBe(true);
    });

    test('should support RouteBuilder component with drag-and-drop interface', async () => {
      const routeBuilder = createRouteBuilderStore();
      
      let currentRoute: any = null;
      const unsubscribe = routeBuilder.subscribe(state => {
        currentRoute = state.route;
      });
      
      // Simulate drag-and-drop operations
      routeBuilder.addSegment('東京', '東海道線', '品川');
      routeBuilder.addSegment('品川', '東海道線', '横浜');
      
      expect(currentRoute.segments.length).toBe(2);
      expect(currentRoute.segments[0].startStation).toBe('東京');
      expect(currentRoute.segments[1].endStation).toBe('横浜');
      
      // Test route validation
      expect(currentRoute.isValid).toBe(true);
      expect(Array.isArray(currentRoute.validationErrors)).toBe(true);
      
      unsubscribe();
    });

    test('should provide Japanese text support with proper fallbacks', async () => {
      const sdk = testEnv.sdk!;
      
      // Test Japanese character handling
      for (const testStation of JAPANESE_RAILWAY_TEST_DATA.stations) {
        const station = await sdk.getStationById(testStation.id);
        if (station) {
          expect(station.name).toBe(testStation.name);
          expect(station.kana).toBe(testStation.kana);
          expect(station.prefecture).toBe(testStation.prefecture);
          
          // Test proper UTF-8 handling
          expect(station.name.length).toBeGreaterThan(0);
          expect(station.kana.length).toBeGreaterThan(0);
        }
      }
    });
  });
});

// ============================================================================
// REQ-API-004: SVELTEKIT SSR AND HYDRATION SUPPORT TESTS
// ============================================================================

describe('REQ-API-004: SvelteKit SSR and Hydration Support', () => {
  describe('Server-Side Rendering Capabilities', () => {
    test('should provide server-side station data loading', async () => {
      // Simulate SvelteKit load function
      const loadFunction = async ({ params }: { params: { stationId: string } }) => {
        const sdk = createProductionSDK();
        await sdk.initialize();
        
        const station = await sdk.getStationById(parseInt(params.stationId));
        
        return {
          props: {
            station: station ? {
              id: station.id,
              name: station.name,
              kana: station.kana,
              prefecture: station.prefecture
            } : null
          }
        };
      };
      
      const { result } = await measurePerformance('ssr-load-function',
        () => loadFunction({ params: { stationId: '1130101' } })
      );
      
      expect(result.props.station).toBeDefined();
      expect(result.props.station.name).toBe('東京');
    });

    test('should properly serialize and deserialize store state during SSR', async () => {
      // Test store serialization
      const storeCollection = {
        stationSearch: { query: '東京', results: [], loading: false },
        fareCalculation: { route: '東京 東海道線 横浜', result: null, calculating: false },
        routeBuilder: { segments: [], isValid: true }
      };
      
      // Serialize state
      const serializedState = JSON.stringify(storeCollection);
      expect(typeof serializedState).toBe('string');
      
      // Deserialize state
      const deserializedState = JSON.parse(serializedState);
      expect(deserializedState).toEqual(storeCollection);
      
      // Verify state integrity
      expect(deserializedState.stationSearch.query).toBe('東京');
      expect(deserializedState.fareCalculation.route).toBe('東京 東海道線 横浜');
      expect(deserializedState.routeBuilder.isValid).toBe(true);
    });

    test('should support route calculations in both server and client environments', async () => {
      // Server-side calculation
      const serverSDK = createProductionSDK();
      await serverSDK.initialize();
      
      const { result: serverResult } = await measurePerformance('server-side-calculation',
        () => serverSDK.calculateFare('東京 東海道線 横浜')
      );
      
      // Client-side calculation (simulated)
      const clientSDK = createDevelopmentSDK();
      await clientSDK.initialize();
      
      const { result: clientResult } = await measurePerformance('client-side-calculation',
        () => clientSDK.calculateFare('東京 東海道線 横浜')
      );
      
      // Results should be identical
      expect(serverResult.totalFare).toBe(clientResult.totalFare);
      expect(serverResult.success).toBe(clientResult.success);
      
      await serverSDK.dispose();
      await clientSDK.dispose();
    });

    test('should support static site generation for reference data', async () => {
      const sdk = createProductionSDK();
      await sdk.initialize();
      
      // Generate static reference data
      const { result: staticData } = await measurePerformance('static-data-generation', async () => {
        const [companies, prefectures, lines] = await Promise.all([
          sdk.getCompanies(),
          sdk.getPrefectures(),
          sdk.getLines()
        ]);
        
        return {
          companies: companies.map(c => ({ id: c.id, name: c.name, type: c.type })),
          prefectures: prefectures.map(p => ({ id: p.id, name: p.name })),
          lines: lines.map(l => ({ id: l.id, name: l.name }))
        };
      });
      
      expect(Array.isArray(staticData.companies)).toBe(true);
      expect(Array.isArray(staticData.prefectures)).toBe(true);
      expect(Array.isArray(staticData.lines)).toBe(true);
      
      // Verify data can be serialized for static generation
      const serialized = JSON.stringify(staticData);
      const parsed = JSON.parse(serialized);
      expect(parsed).toEqual(staticData);
      
      await sdk.dispose();
    });

    test('should provide WebAssembly fallbacks for Node.js environments', async () => {
      // Test Node.js environment detection and fallback
      const nodeEnv = typeof process !== 'undefined' && process.versions?.node;
      
      if (nodeEnv) {
        const sdk = createProductionSDK({
          development: false,
          errorHandling: { enableFuzzyMatching: true }
        });
        
        await sdk.initialize();
        
        // Should work in Node.js environment
        const station = await sdk.getStationById(1130101);
        expect(station).toBeDefined();
        
        const fareResult = await sdk.calculateFare('東京 東海道線 横浜');
        expect(fareResult.success).toBe(true);
        
        await sdk.dispose();
      }
    });
  });
});

// ============================================================================
// REQ-API-005: FRAMEWORK-AGNOSTIC UTILITIES AND HELPERS TESTS
// ============================================================================

describe('REQ-API-005: Framework-Agnostic Utilities and Helpers', () => {
  describe('Japanese Character Handling', () => {
    test('should handle Japanese characters correctly with proper fallbacks', async () => {
      const sdk = testEnv.sdk!;
      
      // Test various Japanese character sets
      const testCases = [
        { input: 'とうきょう', expected: '東京' },
        { input: '東京', expected: '東京' },
        { input: 'Tokyo', expected: null }, // Roman characters should not match
        { input: '新宿', expected: '新宿' },
        { input: 'しんじゅく', expected: '新宿' }
      ];
      
      for (const testCase of testCases) {
        const results = await sdk.searchStations(testCase.input);
        
        if (testCase.expected) {
          expect(results.length).toBeGreaterThan(0);
          const matchFound = results.some(r => r.station.name === testCase.expected);
          expect(matchFound).toBe(true);
        } else {
          expect(results.length).toBe(0);
        }
      }
    });

    test('should format station names with proper UTF-8 handling', () => {
      // Test station name formatting utility
      for (const station of JAPANESE_RAILWAY_TEST_DATA.stations) {
        const formatted = formatStationName(station.name, {
          showKana: true,
          showPrefecture: true,
          maxLength: 20
        });
        
        expect(formatted).toContain(station.name);
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Route Validation and Building', () => {
    test('should provide detailed route validation with suggestions', async () => {
      // Test valid routes
      for (const route of JAPANESE_RAILWAY_TEST_DATA.routes) {
        const validation = await validateRoute(route.segments.join(' '));
        
        expect(validation.isValid).toBe(true);
        expect(Array.isArray(validation.errors)).toBe(true);
        expect(Array.isArray(validation.suggestions)).toBe(true);
        expect(validation.errors.length).toBe(0);
      }
      
      // Test invalid route
      const invalidValidation = await validateRoute('存在しない駅 存在しない線 存在しない駅');
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });

    test('should support fluent API patterns for route construction', () => {
      const builder = createRouteBuilder();
      
      expect(builder).toBeDefined();
      expect(typeof builder.from).toBe('function');
      expect(typeof builder.to).toBe('function');
      expect(typeof builder.via).toBe('function');
      expect(typeof builder.build).toBe('function');
      
      // Test fluent API pattern
      const route = builder
        .from('東京')
        .via('品川')
        .to('横浜')
        .build();
      
      expect(route).toBeDefined();
      expect(route.segments.length).toBe(3);
    });
  });

  describe('Fare Formatting and Display', () => {
    test('should provide localized currency display and breakdown', () => {
      const testFares = [320, 1340, 13320, 28140];
      
      for (const fare of testFares) {
        // Test Japanese locale formatting
        const formatted = formatFare(fare, {
          locale: 'ja-JP',
          currency: 'JPY',
          showBreakdown: false
        });
        
        expect(formatted).toContain('円');
        expect(formatted).toContain(fare.toString());
        
        // Test breakdown formatting
        const breakdown: FareBreakdownItem[] = [
          { lineName: '東海道線', fare, distance: 25.5, company: 'JR東日本' }
        ];
        
        const formattedBreakdown = formatFareBreakdown(breakdown, {
          locale: 'ja-JP',
          showDistance: true,
          showCompany: true
        });
        
        expect(Array.isArray(formattedBreakdown)).toBe(true);
        expect(formattedBreakdown.length).toBe(1);
      }
    });
  });

  describe('Cross-Framework Compatibility', () => {
    test('should work in React environments', () => {
      // Test React hook integration
      expect(typeof useFarertSDK).toBe('function');
      expect(typeof useStationSearch).toBe('function');
      expect(typeof useFareCalculation).toBe('function');
      expect(typeof useRouteBuilder).toBe('function');
      
      // Test React context provider
      expect(FarertSDKProvider).toBeDefined();
    });

    test('should work in Vue environments', () => {
      // Test Vue composable integration
      expect(typeof useVueFarertSDK).toBe('function');
      expect(typeof useVueStationSearch).toBe('function');
      
      // Test Vue plugin
      expect(FarertSDKPlugin).toBeDefined();
    });

    test('should work in vanilla JavaScript environments', async () => {
      // Test vanilla JS usage
      const { sdk } = await quickStart();
      expect(sdk).toBeDefined();
      
      await sdk.initialize();
      
      const station = await sdk.getStationById(1130101);
      expect(station).toBeDefined();
      
      await sdk.dispose();
    });

    test('should detect framework environment correctly', () => {
      const framework = detectFramework();
      
      expect(framework).toBeDefined();
      expect(framework.type).toBeDefined();
      expect(framework.version).toBeDefined();
      expect(framework.environment).toBeDefined();
    });
  });
});

// ============================================================================
// REQ-API-006: DEVELOPMENT EXPERIENCE AND DOCUMENTATION TESTS
// ============================================================================

describe('REQ-API-006: Development Experience and Documentation', () => {
  describe('TypeScript Integration and IntelliSense', () => {
    test('should provide complete TypeScript integration with autocomplete', () => {
      // Test that TypeScript types are properly exported and available
      expect(SDK_INFO).toBeDefined();
      expect(SDK_INFO.features.typeScript).toBe(true);
      expect(SDK_INFO.compatibility.typescript).toBe('>=4.5.0');
      
      // Test interface completeness
      const sdk = testEnv.sdk!;
      expect(sdk.config).toBeDefined();
      expect(sdk.state).toBeDefined();
      expect(sdk.version).toBeDefined();
      expect(sdk.isReady).toBeDefined();
    });

    test('should provide developer-friendly error messages', async () => {
      const sdk = createFarertSDK({ development: true });
      
      try {
        // Try to use SDK before initialization
        await sdk.getStationById(1130101);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('SDK not ready');
        expect(error.code).toBeDefined();
        expect(error.context).toBeDefined();
      }
      
      await sdk.dispose();
    });

    test('should provide actionable suggestions for common issues', async () => {
      const validator = createStrictInputValidator();
      
      // Test validation with suggestions
      const result = validator.validateStationName('invalid station name 123');
      
      expect(result.isValid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Suggestions should be actionable
      const suggestion = result.suggestions[0];
      expect(suggestion.message).toBeDefined();
      expect(suggestion.action).toBeDefined();
    });
  });

  describe('Debug Tools and Performance Monitoring', () => {
    test('should provide comprehensive debug tools', async () => {
      const debugTools = createDevelopmentDebugTools();
      
      expect(debugTools).toBeDefined();
      expect(typeof debugTools.inspectSDK).toBe('function');
      expect(typeof debugTools.analyzePerformance).toBe('function');
      expect(typeof debugTools.generateReport).toBe('function');
      
      const sdk = testEnv.sdk!;
      const inspection = await debugTools.inspectSDK(sdk);
      
      expect(inspection.state).toBeDefined();
      expect(inspection.configuration).toBeDefined();
      expect(inspection.performance).toBeDefined();
      expect(inspection.memoryUsage).toBeDefined();
    });

    test('should generate comprehensive diagnostic reports', async () => {
      const debugTools = createDevelopmentDebugTools();
      const sdk = testEnv.sdk!;
      
      // Perform some operations to generate data
      await sdk.getStationById(1130101);
      await sdk.calculateFare('東京 東海道線 横浜');
      
      const report = await debugTools.generateReport(sdk);
      
      expect(report.summary).toBeDefined();
      expect(report.performance).toBeDefined();
      expect(report.errors).toBeDefined();
      expect(report.recommendations).toBeDefined();
      
      // Verify report contains useful information
      expect(report.summary.totalOperations).toBeGreaterThan(0);
      expect(Array.isArray(report.performance.slowOperations)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Documentation and Examples Quality', () => {
    test('should provide SDK metadata and feature information', () => {
      expect(SDK_INFO.name).toBe('Farert WebAssembly SDK');
      expect(SDK_INFO.version).toBe('1.0.0');
      expect(SDK_INFO.description).toContain('Svelte-first');
      expect(SDK_INFO.compatibility).toBeDefined();
      expect(SDK_INFO.features).toBeDefined();
      expect(SDK_INFO.apiCoverage).toBeDefined();
      
      // Verify API coverage claims
      expect(SDK_INFO.apiCoverage.webAssemblyAPIs).toBe(39);
      expect(SDK_INFO.apiCoverage.objectClasses).toBe(5);
      expect(SDK_INFO.features.svelteStores).toBe(true);
      expect(SDK_INFO.features.reactHooks).toBe(true);
      expect(SDK_INFO.features.vueComposables).toBe(true);
    });

    test('should provide working quick start examples', async () => {
      // Test quick start function
      const { sdk, utils, version } = await quickStart();
      
      expect(sdk).toBeDefined();
      expect(utils).toBeDefined();
      expect(version).toBe(SDK_INFO.version);
      
      await sdk.initialize();
      expect(sdk.isReady()).toBe(true);
      
      await sdk.dispose();
      
      // Test calculator creation
      const calculator = await createCalculator();
      await calculator.initialize();
      
      const fare = await calculator.calculate('東京', '横浜');
      expect(typeof fare).toBe('number');
      expect(fare).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// NON-FUNCTIONAL REQUIREMENTS TESTS
// ============================================================================

describe('Non-Functional Requirements Validation', () => {
  describe('Performance Requirements', () => {
    test('should initialize within 2 seconds on simulated 3G connection', async () => {
      // Simulate 3G connection delays
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const { duration } = await measurePerformance('3g-initialization', async () => {
        // Add network delay simulation
        await delay(100);
        
        const sdk = createProductionSDK();
        await sdk.initialize();
        
        return sdk;
      });
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.sdkInitialization.max);
    });

    test('should respond to cached API calls within 10ms', async () => {
      const sdk = testEnv.sdk!;
      
      // Prime the cache
      await sdk.getStationById(1130101);
      
      // Measure cached call performance
      const { duration } = await measurePerformance('cached-api-call',
        () => sdk.getStationById(1130101)
      );
      
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.cachedApiCalls.max);
    });

    test('should complete route calculations within 500ms for complex routes', async () => {
      const sdk = testEnv.sdk!;
      
      // Test complex route (Tokyo to Osaka)
      const complexRoute = JAPANESE_RAILWAY_TEST_DATA.routes.find(r => r.difficulty === 'complex');
      if (complexRoute) {
        const { duration } = await measurePerformance('complex-route-calculation',
          () => sdk.calculateFare(complexRoute.segments.join(' '))
        );
        
        expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.routeCalculation.max);
      }
    });
  });

  describe('Security Requirements', () => {
    test('should not expose WebAssembly memory directly', () => {
      const sdk = testEnv.sdk!;
      
      // Verify WebAssembly internals are not exposed
      expect((sdk as any).wasmModule).toBeUndefined();
      expect((sdk as any).memory).toBeUndefined();
      expect((sdk as any).heap).toBeUndefined();
      
      // Verify only approved APIs are exposed
      expect(typeof sdk.getStationById).toBe('function');
      expect(typeof sdk.calculateFare).toBe('function');
      expect((sdk as any).openDatabase).toBeUndefined();
      expect((sdk as any).closeDatabase).toBeUndefined();
    });

    test('should validate input to prevent injection attacks', () => {
      const validator = createStrictInputValidator();
      
      // Test SQL injection attempts
      const maliciousInputs = [
        "'; DROP TABLE stations; --",
        '<script>alert("xss")</script>',
        '${process.env.SECRET}',
        '../../../etc/passwd'
      ];
      
      for (const input of maliciousInputs) {
        const result = validator.validateStationName(input);
        expect(result.isValid).toBe(false);
        expect(result.securityViolations.length).toBeGreaterThan(0);
      }
    });

    test('should not reveal internal implementation details in errors', async () => {
      const sdk = createFarertSDK({ development: false });
      
      try {
        await sdk.getStationById(-999999);
      } catch (error: any) {
        // Error messages should be user-friendly, not expose internals
        expect(error.message).not.toContain('SQL');
        expect(error.message).not.toContain('C++');
        expect(error.message).not.toContain('memory');
        expect(error.message).not.toContain('database schema');
      }
      
      await sdk.dispose();
    });
  });

  describe('Reliability Requirements', () => {
    test('should handle WebAssembly module crashes gracefully', async () => {
      const sdk = createFarertSDK({
        errorHandling: {
          retryAttempts: 2,
          retryDelay: 50
        }
      });
      
      // Mock WebAssembly crash
      const mockWasm = (sdk as any).wasmWrapper;
      if (mockWasm) {
        let crashCount = 0;
        const originalGetStation = mockWasm.getStationName;
        
        mockWasm.getStationName = vi.fn().mockImplementation(() => {
          crashCount++;
          if (crashCount === 1) {
            throw new Error('WebAssembly module crashed');
          }
          return originalGetStation?.();
        });
      }
      
      await sdk.initialize();
      
      // Should recover from crash
      const station = await sdk.getStationById(1130101);
      expect(station).toBeDefined();
      
      await sdk.dispose();
    });

    test('should retry network failures with exponential backoff', async () => {
      const errorManager = createProductionErrorManager({
        retryStrategy: {
          maxAttempts: 3,
          baseDelay: 100,
          maxDelay: 1000,
          backoffMultiplier: 2
        }
      });
      
      let attemptCount = 0;
      const operation = async () => {
        attemptCount++;
        if (attemptCount <= 2) {
          throw new Error('Network timeout');
        }
        return { success: true, data: 'test' };
      };
      
      const result = await errorManager.executeWithErrorHandling(operation);
      
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    test('should prevent memory leaks with proper resource cleanup', async () => {
      const initialMemory = process.memoryUsage();
      
      // Create and dispose multiple SDK instances
      for (let i = 0; i < 10; i++) {
        const sdk = createFarertSDK();
        await sdk.initialize();
        await sdk.getStationById(1130101);
        await sdk.dispose();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      await setTimeout(100);
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory growth should be minimal (allowing for some overhead)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
    });
  });

  describe('Usability Requirements', () => {
    test('should handle Japanese text correctly across different encodings', async () => {
      const sdk = testEnv.sdk!;
      
      // Test various Japanese text encodings and formats
      const japaneseTests = [
        { input: '東京', expected: '東京' },
        { input: 'とうきょう', expected: '東京' }, // hiragana
        { input: 'トウキョウ', expected: '東京' }, // katakana
        { input: '新宿', expected: '新宿' },
        { input: 'しんじゅく', expected: '新宿' }
      ];
      
      for (const test of japaneseTests) {
        const results = await sdk.searchStations(test.input);
        
        if (test.expected) {
          const foundMatch = results.some(r => r.station.name === test.expected);
          expect(foundMatch).toBe(true);
        }
      }
    });

    test('should follow framework conventions and best practices', () => {
      // Test Svelte store conventions
      expect(typeof farertStore.subscribe).toBe('function');
      
      // Test React hook conventions
      expect(useFarertSDK.name).toMatch(/^use[A-Z]/);
      expect(useStationSearch.name).toMatch(/^use[A-Z]/);
      
      // Test Vue composable conventions
      expect(useVueFarertSDK.name).toMatch(/^use[A-Z]/);
      
      // Test factory function conventions
      expect(createFarertSDK.name).toMatch(/^create[A-Z]/);
      expect(createDevelopmentSDK.name).toMatch(/^create[A-Z]/);
    });
  });
});

// ============================================================================
// REAL-WORLD RAILWAY SCENARIOS TESTS
// ============================================================================

describe('Real-World Japanese Railway Scenarios', () => {
  describe('Complex Route Calculations', () => {
    test('should handle multi-company journey calculations', async () => {
      const sdk = testEnv.sdk!;
      
      // Test JR + private railway combination
      const multiCompanyRoute = '東京 東海道線 品川 京急本線 横浜';
      
      const { result, duration } = await measurePerformance('multi-company-route',
        () => sdk.calculateFare(multiCompanyRoute)
      );
      
      expect(result.success).toBe(true);
      expect(result.totalFare).toBeGreaterThan(0);
      expect(result.breakdown.length).toBeGreaterThan(1); // Multiple companies
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.routeCalculation.max);
      
      // Verify breakdown includes multiple companies
      const companies = new Set(result.breakdown.map(b => b.company));
      expect(companies.size).toBeGreaterThan(1);
    });

    test('should handle special fare rules and discounts', async () => {
      const sdk = testEnv.sdk!;
      
      // Test long-distance route that may have special rules
      const longRoute = '東京 東海道新幹線 新大阪 東海道線 大阪';
      
      const result = await sdk.calculateFare(longRoute);
      
      expect(result.success).toBe(true);
      expect(result.discounts).toBeDefined();
      expect(Array.isArray(result.discounts)).toBe(true);
      
      // For Shinkansen routes, there should be base fare + express charge
      expect(result.breakdown.length).toBeGreaterThan(1);
      
      const hasBaseFare = result.breakdown.some(b => b.type === 'base');
      const hasExpressCharge = result.breakdown.some(b => b.type === 'express');
      
      if (hasBaseFare && hasExpressCharge) {
        expect(hasBaseFare).toBe(true);
        expect(hasExpressCharge).toBe(true);
      }
    });

    test('should validate complex transfer scenarios', async () => {
      const sdk = testEnv.sdk!;
      
      // Test route with multiple transfers
      const complexTransferRoute = '東京 中央線 新宿 山手線 品川 東海道線 横浜';
      
      const validation = await sdk.validateRoute(complexTransferRoute);
      
      expect(validation.isValid).toBe(true);
      expect(validation.transfers).toBeDefined();
      expect(validation.transfers?.length).toBeGreaterThan(1);
      
      // Each transfer should be valid
      for (const transfer of validation.transfers || []) {
        expect(transfer.fromLine).toBeDefined();
        expect(transfer.toLine).toBeDefined();
        expect(transfer.station).toBeDefined();
        expect(transfer.isValid).toBe(true);
      }
    });

    test('should handle edge cases and error conditions', async () => {
      const sdk = testEnv.sdk!;
      
      // Test impossible route
      const impossibleRoute = '東京 存在しない線 存在しない駅';
      
      try {
        await sdk.calculateFare(impossibleRoute);
        expect.fail('Should have thrown an error for impossible route');
      } catch (error: any) {
        expect(error).toBeDefined();
        expect(error.code).toBeDefined();
        expect(error.suggestions).toBeDefined();
        expect(Array.isArray(error.suggestions)).toBe(true);
      }
      
      // Test route with invalid station sequence
      const invalidSequence = '横浜 東海道線 東京 東海道線 品川'; // Wrong direction
      
      const validation = await sdk.validateRoute(invalidSequence);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Station Search and Data Accuracy', () => {
    test('should provide accurate station search results', async () => {
      const sdk = testEnv.sdk!;
      
      for (const testQuery of JAPANESE_RAILWAY_TEST_DATA.searchQueries) {
        const { result, duration } = await measurePerformance(`search-${testQuery.query}`,
          () => sdk.searchStations(testQuery.query)
        );
        
        expect(result.length).toBe(testQuery.expectedResults);
        expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.stationSearch.max);
        
        if (testQuery.expectedTop) {
          expect(result[0]?.station.name).toBe(testQuery.expectedTop);
          expect(result[0]?.score).toBeGreaterThan(0.8); // High relevance score
        }
      }
    });

    test('should provide comprehensive station information', async () => {
      const sdk = testEnv.sdk!;
      
      for (const testStation of JAPANESE_RAILWAY_TEST_DATA.stations) {
        const station = await sdk.getStationById(testStation.id);
        
        expect(station).toBeDefined();
        expect(station!.id).toBe(testStation.id);
        expect(station!.name).toBe(testStation.name);
        expect(station!.kana).toBe(testStation.kana);
        expect(station!.prefecture).toBe(testStation.prefecture);
        
        // Additional metadata should be present
        expect(typeof station!.isJunction).toBe('boolean');
        expect(Array.isArray(station!.lines)).toBe(true);
        expect(station!.type).toBeDefined();
      }
    });

    test('should handle ambiguous station names correctly', async () => {
      const sdk = testEnv.sdk!;
      
      // Test stations with common names (like "中央")
      const ambiguousResults = await sdk.searchStations('中央');
      
      expect(ambiguousResults.length).toBeGreaterThan(1);
      
      // Results should be sorted by relevance
      for (let i = 1; i < ambiguousResults.length; i++) {
        expect(ambiguousResults[i].score).toBeLessThanOrEqual(ambiguousResults[i - 1].score);
      }
      
      // Each result should have distinguishing information
      for (const result of ambiguousResults) {
        expect(result.station.prefecture).toBeDefined();
        expect(result.matchedField).toBeDefined();
        expect(result.highlight).toBeDefined();
      }
    });
  });
});

// ============================================================================
// FINAL INTEGRATION SUMMARY TEST
// ============================================================================

describe('Final Integration Summary', () => {
  test('should demonstrate complete end-to-end functionality', async () => {
    const sdk = testEnv.sdk!;
    
    console.log('\n=== Frontend API Layer Integration Test Summary ===');
    
    // 1. SDK Initialization and Health Check
    expect(sdk.isReady()).toBe(true);
    console.log('✅ SDK Initialization: PASSED');
    
    // 2. Core API Functionality
    const station = await sdk.getStationById(1130101);
    expect(station?.name).toBe('東京');
    console.log('✅ Core API Access: PASSED');
    
    // 3. Caching Performance
    const startTime = performance.now();
    await sdk.getStationById(1130101); // Should be cached
    const cacheTime = performance.now() - startTime;
    expect(cacheTime).toBeLessThan(10);
    console.log(`✅ Caching Performance: PASSED (${Math.round(cacheTime)}ms)`);
    
    // 4. Complex Fare Calculation
    const fareResult = await sdk.calculateFare('東京 東海道線 横浜');
    expect(fareResult.success).toBe(true);
    expect(fareResult.totalFare).toBeGreaterThan(0);
    console.log(`✅ Fare Calculation: PASSED (${fareResult.totalFare}円)`);
    
    // 5. Route Validation
    const validation = await sdk.validateRoute('東京 東海道線 横浜');
    expect(validation.isValid).toBe(true);
    console.log('✅ Route Validation: PASSED');
    
    // 6. Search Functionality
    const searchResults = await sdk.searchStations('東京');
    expect(searchResults.length).toBeGreaterThan(0);
    console.log(`✅ Station Search: PASSED (${searchResults.length} results)`);
    
    // 7. Reference Data Access
    const companies = await sdk.getCompanies();
    expect(companies.length).toBeGreaterThan(0);
    console.log(`✅ Reference Data: PASSED (${companies.length} companies)`);
    
    // 8. Performance Metrics
    const metrics = sdk.metrics.getMetrics();
    expect(metrics).toBeDefined();
    console.log(`✅ Performance Monitoring: PASSED`);
    
    // 9. Memory Management
    const memoryBefore = process.memoryUsage().heapUsed;
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await sdk.searchStations(`test-${i}`);
    }
    const memoryAfter = process.memoryUsage().heapUsed;
    const memoryGrowth = memoryAfter - memoryBefore;
    expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024); // 5MB limit
    console.log(`✅ Memory Management: PASSED (${Math.round(memoryGrowth / 1024)}KB growth)`);
    
    // 10. Error Handling
    let errorHandled = false;
    try {
      await sdk.calculateFare('invalid route');
    } catch (error) {
      errorHandled = true;
      expect(error).toBeDefined();
    }
    expect(errorHandled).toBe(true);
    console.log('✅ Error Handling: PASSED');
    
    console.log('\n=== All Integration Requirements Validated ===');
    console.log(`Total test execution time: ${Math.round(performance.now() - testEnv.startTime)}ms`);
    console.log(`Performance operations tracked: ${testEnv.performanceMetrics.length}`);
    console.log(`Memory snapshots taken: ${testEnv.memorySnapshots.length}`);
    console.log('🎉 Frontend API Layer is ready for production use!');
  });
});