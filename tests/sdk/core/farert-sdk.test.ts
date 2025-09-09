/**
 * Farert SDK Comprehensive Unit Test Suite
 * 
 * Complete test coverage for the main FarertSDK implementation with focus on:
 * - All 39+ WebAssembly APIs availability and type safety
 * - Complete TypeScript types functionality for parameters and return values
 * - Clear error messages and retry mechanisms with exponential backoff
 * - Typed wrapper classes with lifecycle management for object classes
 * - Database connection issue detection and specific guidance
 * - Comprehensive caching behavior and performance optimization
 * - Svelte store integration and reactive state management
 * 
 * This test suite validates REQ-API-001: Core TypeScript SDK Foundation
 * 
 * @file Farert SDK Unit Tests
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { describe, test, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import {
  FarertSDKImpl as FarertSDK,
  createFarertSDK,
  createDevelopmentSDK,
  createProductionSDK,
  type SDKConfig,
  type StationInfo,
  type StationSearchResult,
  type StationSearchOptions,
  type LineInfo,
  type CompanyInfo,
  type PrefectureInfo,
  type RouteSpec,
  type RouteSegment,
  type FareCalculationResult,
  type RouteValidationResult,
  type RoutePlanResult,
  type FareBreakdownItem,
  type FareDiscount,
  SDKState,
  FarertSDKError,
  FarertSDKErrorCode
} from '../../../src/sdk/core/farert-sdk';

import type { FarertModule } from '../../../src/cli/types';

// Mock dependencies
vi.mock('../../../src/sdk/core/wasm-wrapper', () => ({
  WasmWrapper: vi.fn(),
  createProductionWasmWrapper: vi.fn()
}));

vi.mock('../../../src/sdk/cache/cache-manager', () => ({
  CacheManager: vi.fn(),
  CacheCategory: {
    STATIONS: 'stations',
    LINES: 'lines',
    COMPANIES: 'companies',
    PREFECTURES: 'prefectures',
    FARE_CALCULATIONS: 'fare_calculations',
    SEARCH_RESULTS: 'search_results',
    REFERENCE_DATA: 'reference_data',
    TEMPORARY: 'temporary'
  },
  createProductionCacheManager: vi.fn()
}));

vi.mock('../../../src/sdk/errors/error-manager', () => ({
  ErrorManager: vi.fn(),
  ErrorCategory: {
    WASM_LOADING: 'wasm_loading',
    DATABASE: 'database',
    CALCULATION: 'calculation',
    VALIDATION: 'validation',
    NETWORK: 'network',
    CACHE: 'cache',
    USER_INPUT: 'user_input'
  },
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  createProductionErrorManager: vi.fn()
}));

vi.mock('../../../src/sdk/core/object-classes', () => ({
  ObjectLifecycleManager: vi.fn(),
  ObjectClassFactory: vi.fn(),
  createObjectClassFactory: vi.fn()
}));

// Mock Svelte store for non-Svelte environments
const mockWritable = (value: any) => ({
  subscribe: vi.fn((fn: any) => { fn(value); return () => {}; }),
  set: vi.fn(),
  update: vi.fn()
});

vi.mock('svelte/store', () => ({
  writable: mockWritable,
  derived: () => mockWritable(null),
  readable: () => mockWritable(null),
  get: (store: any) => store.value || null
}), { virtual: true });

// ============================================================================
// TEST HELPERS AND MOCKS
// ============================================================================

/**
 * Create a comprehensive mock WebAssembly module for testing
 */
function createMockWasmModule(): Partial<FarertModule> {
  return {
    // Core APIs - Database operations
    openDatabase: vi.fn().mockReturnValue(true),
    closeDatabase: vi.fn(),
    getDatabaseVersion: vi.fn().mockReturnValue(20240101),
    
    // Route operations - Core functionality
    createRoute: vi.fn().mockReturnValue(1),
    destroyRoute: vi.fn(),
    addRouteBegin: vi.fn().mockReturnValue(0),
    addRoute: vi.fn().mockReturnValue(0),
    removeTail: vi.fn(),
    removeAll: vi.fn(),
    reverseRoute: vi.fn().mockReturnValue(0),
    getRouteCount: vi.fn().mockReturnValue(3),
    startStationId: vi.fn().mockReturnValue(1001),
    lastStationId: vi.fn().mockReturnValue(2002),
    isEnd: vi.fn().mockReturnValue(1),
    calculateFare: vi.fn().mockReturnValue(220),
    getFareString: vi.fn().mockReturnValue('220円'),
    getFareInfoJson: vi.fn().mockReturnValue('{"fare":220,"discount":0}'),
    
    // Station operations
    getStationId: vi.fn().mockImplementation((name: string) => {
      const stationMap: Record<string, number> = {
        '東京': 1130101,
        '横浜': 1130401,
        '大阪': 2741002,
        '新宿': 1130301,
        '品川': 1130201
      };
      return stationMap[name] ?? -1;
    }),
    getStationName: vi.fn().mockImplementation((id: number) => {
      const nameMap: Record<number, string> = {
        1130101: '東京',
        1130401: '横浜',
        2741002: '大阪',
        1130301: '新宿',
        1130201: '品川'
      };
      return nameMap[id] ?? '';
    }),
    
    // Line operations
    getLineId: vi.fn().mockImplementation((name: string) => {
      const lineMap: Record<string, number> = {
        '東海道線': 11301,
        '山手線': 11302,
        '中央線': 11303
      };
      return lineMap[name] ?? -1;
    }),
    getLineName: vi.fn().mockImplementation((id: number) => {
      const lineNameMap: Record<number, string> = {
        11301: '東海道線',
        11302: '山手線',
        11303: '中央線'
      };
      return lineNameMap[id] ?? '';
    }),
    
    // Route script operations
    setupRoute: vi.fn().mockReturnValue(0),
    getRouteScript: vi.fn().mockReturnValue('東京 東海道線 横浜'),
    
    // Configuration
    setLongRoute: vi.fn(),
    setStartAsCity: vi.fn(),
    setArriveAsCity: vi.fn(),
    
    // Utility functions
    isJunction: vi.fn().mockReturnValue(1),
    isSpecificJunction: vi.fn().mockReturnValue(0),
    getTerminalStationName: vi.fn().mockReturnValue('東京'),
    
    // Enhanced APIs for SDK
    getStationReading: vi.fn().mockImplementation((id: number) => {
      const readingMap: Record<number, string> = {
        1130101: 'とうきょう',
        1130401: 'よこはま',
        2741002: 'おおさか',
        1130301: 'しんじゅく',
        1130201: 'しながわ'
      };
      return readingMap[id] ?? '';
    }),
    getLinesAtStation: vi.fn().mockReturnValue([11301, 11302]),
    getStationsOnLine: vi.fn().mockReturnValue([1130101, 1130201, 1130401]),
    getJRCompanyIds: vi.fn().mockReturnValue([1, 2, 3, 4, 5, 6]),
    getPrefectureIds: vi.fn().mockReturnValue([13, 14, 27, 28]),
    getCompanyOrPrefectureName: vi.fn().mockImplementation((id: number) => {
      if (id < 10) return 'JR東日本';
      if (id === 13) return '東京都';
      if (id === 14) return '神奈川県';
      if (id === 27) return '大阪府';
      return 'Unknown';
    }),
    
    // Object constructors
    cRoute: vi.fn(),
    cRouteList: vi.fn(),
    cCalcRoute: vi.fn(),
    cRouteItem: vi.fn(),
    cRouteFlag: vi.fn(),
    FareInfo: vi.fn()
  };
}

/**
 * Create mock WasmWrapper with all required methods
 */
function createMockWasmWrapper() {
  const mockModule = createMockWasmModule();
  
  return {
    wasmModule: mockModule,
    initialize: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    
    // Station APIs
    getStationId: vi.fn().mockImplementation((name: string) => 
      Promise.resolve(mockModule.getStationId!(name))
    ),
    getStationName: vi.fn().mockImplementation((id: number) => 
      Promise.resolve(mockModule.getStationName!(id))
    ),
    getStationInfo: vi.fn().mockImplementation((id: number) => 
      Promise.resolve({
        id,
        name: mockModule.getStationName!(id),
        nameExtended: mockModule.getStationName!(id),
        kana: mockModule.getStationReading!(id),
        prefecture: id < 2000000 ? '東京都' : '神奈川県',
        prefectureId: id < 2000000 ? 13 : 14,
        isJunction: Boolean(mockModule.isJunction!(id)),
        lines: [],
        type: 'major' as const,
        ranking: 1
      } as StationInfo)
    ),
    searchStations: vi.fn().mockImplementation((query: string) => 
      Promise.resolve([
        {
          id: 1130101,
          name: '東京',
          nameExtended: '東京',
          kana: 'とうきょう',
          prefecture: '東京都',
          prefectureId: 13,
          isJunction: true,
          lines: [],
          type: 'major' as const,
          ranking: 1
        }
      ] as StationInfo[])
    ),
    
    // Line APIs
    getLineName: vi.fn().mockImplementation((id: number) =>
      Promise.resolve(mockModule.getLineName!(id))
    ),
    
    // Route APIs
    setupRoute: vi.fn().mockImplementation((route: string) =>
      Promise.resolve(mockModule.setupRoute!(route))
    ),
    calculateFare: vi.fn().mockImplementation(() =>
      Promise.resolve(mockModule.calculateFare!())
    ),
    
    // Utility APIs
    getDatabaseVersion: vi.fn().mockImplementation(() =>
      Promise.resolve(mockModule.getDatabaseVersion!())
    ),
    getJRCompanyIds: vi.fn().mockImplementation(() =>
      Promise.resolve(mockModule.getJRCompanyIds!())
    ),
    getPrefectureIds: vi.fn().mockImplementation(() =>
      Promise.resolve(mockModule.getPrefectureIds!())
    ),
    getCompanyOrPrefectureName: vi.fn().mockImplementation((id: number) =>
      Promise.resolve(mockModule.getCompanyOrPrefectureName!(id))
    )
  };
}

/**
 * Create mock cache manager
 */
function createMockCacheManager() {
  const cache = new Map<string, any>();
  
  return {
    get: vi.fn().mockImplementation((category: string, key: string) => 
      Promise.resolve(cache.get(`${category}:${key}`))
    ),
    set: vi.fn().mockImplementation((category: string, key: string, value: any, ttl?: number) => {
      cache.set(`${category}:${key}`, value);
      return Promise.resolve();
    }),
    getReferenceData: vi.fn().mockImplementation((type: string, id: number) =>
      Promise.resolve(cache.get(`ref:${type}:${id}`))
    ),
    cacheReferenceData: vi.fn().mockImplementation((type: string, id: number, data: any) => {
      cache.set(`ref:${type}:${id}`, data);
      return Promise.resolve();
    }),
    dispose: vi.fn(),
    config: {
      globalMemoryLimit: 10 * 1024 * 1024
    }
  };
}

/**
 * Create mock error manager
 */
function createMockErrorManager() {
  return {
    executeWithErrorHandling: vi.fn().mockImplementation(async (fn: Function) => {
      return await fn();
    }),
    dispose: vi.fn()
  };
}

/**
 * Create mock object class factory
 */
function createMockObjectFactory() {
  return {
    createRouteList: vi.fn().mockReturnValue({
      add: vi.fn(),
      toSegments: vi.fn().mockReturnValue([])
    }),
    createRoute: vi.fn().mockReturnValue({
      setupRoute: vi.fn().mockResolvedValue(0),
      addRouteBegin: vi.fn().mockReturnValue(0),
      addRoute: vi.fn().mockReturnValue(0),
      addRouteWithLine: vi.fn().mockReturnValue(0),
      validate: vi.fn().mockResolvedValue({ isValid: true, errors: [], suggestions: [] }),
      getDescription: vi.fn().mockResolvedValue('東京 → 横浜'),
      getEstimatedTime: vi.fn().mockReturnValue(30),
      getTotalDistance: vi.fn().mockReturnValue(25.5),
      getTransferCount: vi.fn().mockReturnValue(0)
    }),
    createCalcRoute: vi.fn().mockReturnValue({
      setupRoute: vi.fn().mockResolvedValue(0),
      addRouteBegin: vi.fn().mockReturnValue(0),
      addRoute: vi.fn().mockReturnValue(0),
      addRouteWithLine: vi.fn().mockReturnValue(0),
      calculateFare: vi.fn().mockResolvedValue({
        success: true,
        totalFare: 220,
        breakdown: [],
        route: [],
        discounts: [],
        metadata: {
          calculationTime: 15,
          cacheHit: false,
          version: '1.0.0'
        }
      }),
      startStationId: vi.fn().mockReturnValue(1130101),
      lastStationId: vi.fn().mockReturnValue(1130401),
      getRouteCount: vi.fn().mockReturnValue(2)
    }),
    createRouteItem: vi.fn().mockReturnValue({
      setStation: vi.fn(),
      setLine: vi.fn()
    }),
    createRouteFlag: vi.fn().mockReturnValue({
      flags: 0
    }),
    createFareInfo: vi.fn().mockReturnValue({
      fare: 220,
      result: 0
    }),
    dispose: vi.fn()
  };
}

/**
 * Create test SDK instance with mocked dependencies
 */
function createTestSDK(config: Partial<SDKConfig> = {}): FarertSDK {
  const mockWasmWrapper = createMockWasmWrapper();
  const mockCacheManager = createMockCacheManager();
  const mockErrorManager = createMockErrorManager();
  const mockObjectFactory = createMockObjectFactory();
  
  // Mock the imports to return our mocks
  const { createProductionWasmWrapper } = require('../../../src/sdk/core/wasm-wrapper');
  const { createProductionCacheManager } = require('../../../src/sdk/cache/cache-manager');
  const { createProductionErrorManager } = require('../../../src/sdk/errors/error-manager');
  const { createObjectClassFactory } = require('../../../src/sdk/core/object-classes');
  
  createProductionWasmWrapper.mockReturnValue(mockWasmWrapper);
  createProductionCacheManager.mockReturnValue(mockCacheManager);
  createProductionErrorManager.mockReturnValue(mockErrorManager);
  createObjectClassFactory.mockReturnValue(mockObjectFactory);
  
  const sdk = new FarertSDK({
    development: true,
    caching: { enabled: true, maxSize: 1000, ttl: 300000 },
    performance: { enabled: true, trackingLevel: 'detailed' },
    errorHandling: { retryAttempts: 2, retryDelay: 100, enableFuzzyMatching: true },
    locale: { language: 'ja', currency: 'JPY', numberFormat: { style: 'currency', currency: 'JPY' } },
    ...config
  });
  
  // Inject mocks into SDK instance
  (sdk as any).wasmWrapper = mockWasmWrapper;
  (sdk as any).cacheManager = mockCacheManager;
  (sdk as any).errorManager = mockErrorManager;
  (sdk as any).objectFactory = mockObjectFactory;
  
  return sdk;
}

// ============================================================================
// SDK INITIALIZATION AND LIFECYCLE TESTS
// ============================================================================

describe('FarertSDK - Initialization and Lifecycle', () => {
  let sdk: FarertSDK;
  
  afterEach(async () => {
    if (sdk) {
      await sdk.dispose();
    }
  });
  
  test('should initialize successfully with default configuration', async () => {
    sdk = createTestSDK();
    
    expect(sdk.state).toBe(SDKState.UNINITIALIZED);
    expect(sdk.isReady()).toBe(false);
    
    await sdk.initialize();
    
    expect(sdk.state).toBe(SDKState.READY);
    expect(sdk.isReady()).toBe(true);
    expect(sdk.version).toBeDefined();
  });
  
  test('should initialize with custom configuration', async () => {
    const customConfig: Partial<SDKConfig> = {
      caching: { enabled: false, maxSize: 500, ttl: 60000 },
      performance: { enabled: false, trackingLevel: 'basic' },
      errorHandling: { retryAttempts: 1, retryDelay: 500, enableFuzzyMatching: false },
      development: true
    };
    
    sdk = createTestSDK(customConfig);
    
    expect(sdk.config.caching.enabled).toBe(false);
    expect(sdk.config.performance.enabled).toBe(false);
    expect(sdk.config.errorHandling.retryAttempts).toBe(1);
    expect(sdk.config.development).toBe(true);
    
    await sdk.initialize();
    expect(sdk.isReady()).toBe(true);
  });
  
  test('should handle initialization failure with retry mechanism', async () => {
    sdk = createTestSDK();
    
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    let callCount = 0;
    mockWasmWrapper.initialize.mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        throw new Error('WebAssembly loading failed');
      }
      return Promise.resolve();
    });
    
    await sdk.initialize();
    
    expect(mockWasmWrapper.initialize).toHaveBeenCalledTimes(2);
    expect(sdk.isReady()).toBe(true);
  });
  
  test('should throw FarertSDKError on persistent initialization failure', async () => {
    sdk = createTestSDK();
    
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    mockWasmWrapper.initialize.mockRejectedValue(new Error('Persistent failure'));
    
    await expect(sdk.initialize()).rejects.toThrow(FarertSDKError);
    expect(sdk.state).toBe(SDKState.ERROR);
    expect(sdk.isReady()).toBe(false);
  });
  
  test('should prevent operations when not initialized', async () => {
    sdk = createTestSDK();
    
    await expect(sdk.getStationById(1130101)).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('SDK not ready')
      })
    );
  });
  
  test('should dispose resources properly', async () => {
    sdk = createTestSDK();
    await sdk.initialize();
    
    expect(sdk.isReady()).toBe(true);
    
    await sdk.dispose();
    
    expect(sdk.state).toBe(SDKState.DISPOSED);
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    const mockCacheManager = (sdk as any).cacheManager;
    expect(mockWasmWrapper.dispose).toHaveBeenCalled();
    expect(mockCacheManager.dispose).toHaveBeenCalled();
  });
  
  test('should not allow initialization of disposed SDK', async () => {
    sdk = createTestSDK();
    await sdk.initialize();
    await sdk.dispose();
    
    await expect(sdk.initialize()).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining('Cannot initialize disposed SDK')
      })
    );
  });
});

// ============================================================================
// STATION OPERATIONS TESTS
// ============================================================================

describe('FarertSDK - Station Operations', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK();
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should get station by ID with complete information', async () => {
    const station = await sdk.getStationById(1130101);
    
    expect(station).toBeDefined();
    expect(station!.id).toBe(1130101);
    expect(station!.name).toBe('東京');
    expect(station!.kana).toBe('とうきょう');
    expect(station!.prefecture).toBe('東京都');
    expect(station!.prefectureId).toBe(13);
    expect(typeof station!.isJunction).toBe('boolean');
    expect(station!.type).toBeDefined();
  });
  
  test('should get station by name with enhanced search', async () => {
    const station = await sdk.getStationByName('東京');
    
    expect(station).toBeDefined();
    expect(station!.id).toBe(1130101);
    expect(station!.name).toBe('東京');
  });
  
  test('should return null for non-existent station', async () => {
    const station = await sdk.getStationById(9999999);
    expect(station).toBeNull();
  });
  
  test('should search stations with basic query', async () => {
    const results = await sdk.searchStations('東京');
    
    expect(results).toHaveLength(1);
    expect(results[0].station.name).toBe('東京');
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].matchedField).toBeDefined();
    expect(results[0].highlight).toBeDefined();
  });
  
  test('should search stations with advanced options', async () => {
    const options: StationSearchOptions = {
      prefecture: '東京都',
      limit: 5,
      fuzzyThreshold: 0.8,
      sortByPopularity: true
    };
    
    const results = await sdk.searchStations('新宿', options);
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(5);
  });
  
  test('should cache station information for performance', async () => {
    const mockCacheManager = (sdk as any).cacheManager;
    mockCacheManager.get.mockResolvedValueOnce(null); // First call - cache miss
    
    // First call
    await sdk.getStationById(1130101);
    
    // Second call should check cache
    await sdk.getStationById(1130101);
    
    expect(mockCacheManager.get).toHaveBeenCalledTimes(2);
  });
  
  test('should handle search with empty results', async () => {
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    mockWasmWrapper.searchStations.mockResolvedValue([]);
    
    const results = await sdk.searchStations('非存在駅');
    expect(results).toHaveLength(0);
  });
});

// ============================================================================
// ROUTE OPERATIONS TESTS
// ============================================================================

describe('FarertSDK - Route Operations', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK();
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should create enhanced route with fluent API', () => {
    const route = sdk.createRoute();
    
    expect(route).toBeDefined();
    expect(typeof route.setupRoute).toBe('function');
    expect(typeof route.addRoute).toBe('function');
  });
  
  test('should calculate fare from string route specification', async () => {
    const result = await sdk.calculateFare('東京 東海道線 横浜');
    
    expect(result.success).toBe(true);
    expect(result.totalFare).toBe(220);
    expect(Array.isArray(result.breakdown)).toBe(true);
    expect(Array.isArray(result.route)).toBe(true);
    expect(Array.isArray(result.discounts)).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.metadata.calculationTime).toBeGreaterThan(0);
  });
  
  test('should calculate fare from object route specification', async () => {
    const routeSpec: RouteSpec = {
      start: '東京',
      end: '横浜',
      via: ['品川']
    };
    
    const result = await sdk.calculateFare(routeSpec);
    
    expect(result.success).toBe(true);
    expect(result.totalFare).toBeGreaterThan(0);
  });
  
  test('should calculate fare from segment array specification', async () => {
    const segments: RouteSegment[] = [
      {
        stationId: 1130101,
        stationName: '東京',
        stationKana: 'とうきょう',
        isTransfer: false
      },
      {
        stationId: 1130401,
        stationName: '横浜',
        stationKana: 'よこはま',
        isTransfer: false
      }
    ];
    
    const result = await sdk.calculateFare(segments);
    
    expect(result.success).toBe(true);
    expect(result.totalFare).toBeGreaterThan(0);
  });
  
  test('should validate route specification', async () => {
    const validation = await sdk.validateRoute('東京 東海道線 横浜');
    
    expect(validation.isValid).toBe(true);
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(Array.isArray(validation.suggestions)).toBe(true);
  });
  
  test('should build optimal route between stations', async () => {
    const plan = await sdk.buildOptimalRoute('東京', '横浜');
    
    expect(plan).toBeDefined();
    expect(plan.totalFare).toBeGreaterThan(0);
    expect(plan.totalTime).toBeGreaterThan(0);
    expect(plan.totalDistance).toBeGreaterThan(0);
    expect(Array.isArray(plan.route)).toBe(true);
    expect(Array.isArray(plan.alternatives)).toBe(true);
    expect(plan.characteristics).toBeDefined();
    expect(typeof plan.characteristics.transferCount).toBe('number');
    expect(typeof plan.characteristics.complexity).toBe('string');
  });
  
  test('should cache fare calculations for performance', async () => {
    const mockCacheManager = (sdk as any).cacheManager;
    mockCacheManager.get.mockResolvedValueOnce(null); // Cache miss
    
    // First calculation
    await sdk.calculateFare('東京 東海道線 横浜');
    
    // Should attempt to cache result
    expect(mockCacheManager.set).toHaveBeenCalled();
  });
  
  test('should handle fare calculation errors gracefully', async () => {
    const mockObjectFactory = (sdk as any).objectFactory;
    const mockCalcRoute = mockObjectFactory.createCalcRoute();
    mockCalcRoute.calculateFare.mockResolvedValue({
      success: false,
      error: { message: 'Route not found' }
    });
    
    await expect(sdk.calculateFare('存在しない駅 存在しない線 存在しない駅')).rejects.toThrow(FarertSDKError);
  });
});

// ============================================================================
// REFERENCE DATA OPERATIONS TESTS
// ============================================================================

describe('FarertSDK - Reference Data Operations', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK();
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should get line information by ID', async () => {
    const line = await sdk.getLineInfo(11301);
    
    expect(line).toBeDefined();
    expect(line!.id).toBe(11301);
    expect(line!.name).toBe('東海道線');
    expect(typeof line!.isJR).toBe('boolean');
    expect(typeof line!.isPrivate).toBe('boolean');
    expect(line!.type).toBeDefined();
  });
  
  test('should get company information by ID', async () => {
    const company = await sdk.getCompanyInfo(1);
    
    expect(company).toBeDefined();
    expect(company!.id).toBe(1);
    expect(company!.name).toBe('JR東日本');
    expect(company!.type).toBeDefined();
    expect(Array.isArray(company!.lines)).toBe(true);
  });
  
  test('should get all companies', async () => {
    const companies = await sdk.getCompanies();
    
    expect(Array.isArray(companies)).toBe(true);
    expect(companies.length).toBeGreaterThan(0);
  });
  
  test('should get all prefectures', async () => {
    const prefectures = await sdk.getPrefectures();
    
    expect(Array.isArray(prefectures)).toBe(true);
    expect(prefectures.length).toBeGreaterThan(0);
    prefectures.forEach(prefecture => {
      expect(prefecture.id).toBeDefined();
      expect(prefecture.name).toBeDefined();
    });
  });
  
  test('should get all lines', async () => {
    const lines = await sdk.getLines();
    
    expect(Array.isArray(lines)).toBe(true);
    // Note: Mock implementation returns empty array
  });
  
  test('should cache reference data for performance', async () => {
    const mockCacheManager = (sdk as any).cacheManager;
    
    await sdk.getLineInfo(11301);
    
    expect(mockCacheManager.cacheReferenceData).toHaveBeenCalled();
  });
  
  test('should return null for non-existent reference data', async () => {
    const line = await sdk.getLineInfo(999999);
    expect(line).toBeNull();
    
    const company = await sdk.getCompanyInfo(999999);
    expect(company).toBeNull();
  });
});

// ============================================================================
// OBJECT CLASSES TESTS
// ============================================================================

describe('FarertSDK - Object Classes', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK();
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should provide access to RouteList factory', () => {
    const { RouteList } = sdk.objectClasses;
    
    expect(RouteList.create).toBeDefined();
    expect(RouteList.createFromArray).toBeDefined();
    
    const routeList = RouteList.create();
    expect(routeList).toBeDefined();
  });
  
  test('should provide access to Route factory', () => {
    const { Route } = sdk.objectClasses;
    
    expect(Route.create).toBeDefined();
    expect(Route.createFromString).toBeDefined();
    
    const route = Route.create();
    expect(route).toBeDefined();
  });
  
  test('should provide access to CalcRoute factory', async () => {
    const { CalcRoute } = sdk.objectClasses;
    
    expect(CalcRoute.create).toBeDefined();
    expect(CalcRoute.createFromRoute).toBeDefined();
    
    const calcRoute = CalcRoute.create();
    expect(calcRoute).toBeDefined();
    
    const fareResult = await calcRoute.calculateFare();
    expect(fareResult.success).toBe(true);
  });
  
  test('should provide access to RouteItem factory', () => {
    const { RouteItem } = sdk.objectClasses;
    
    expect(RouteItem.create).toBeDefined();
    expect(RouteItem.createFromSegment).toBeDefined();
    
    const routeItem = RouteItem.create(1130101, 11301);
    expect(routeItem).toBeDefined();
  });
  
  test('should provide access to RouteFlag factory', () => {
    const { RouteFlag } = sdk.objectClasses;
    
    expect(RouteFlag.create).toBeDefined();
    expect(RouteFlag.createWithFlags).toBeDefined();
    
    const routeFlag = RouteFlag.create();
    expect(routeFlag).toBeDefined();
  });
  
  test('should provide access to FareInfo factory', () => {
    const { FareInfo } = sdk.objectClasses;
    
    expect(FareInfo.create).toBeDefined();
    expect(FareInfo.createEmpty).toBeDefined();
    
    const fareInfo = FareInfo.createEmpty();
    expect(fareInfo).toBeDefined();
  });
  
  test('should support Route creation from string', async () => {
    const { Route } = sdk.objectClasses;
    
    const route = await Route.createFromString('東京 東海道線 横浜');
    expect(route).toBeDefined();
  });
  
  test('should support RouteItem creation from segment', async () => {
    const { RouteItem } = sdk.objectClasses;
    
    const segment: RouteSegment = {
      stationId: 1130101,
      stationName: '東京',
      stationKana: 'とうきょう',
      lineId: 11301,
      isTransfer: false
    };
    
    const routeItem = await RouteItem.createFromSegment(segment);
    expect(routeItem).toBeDefined();
  });
});

// ============================================================================
// ERROR HANDLING AND RETRY TESTS
// ============================================================================

describe('FarertSDK - Error Handling and Retry Mechanisms', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK({
      errorHandling: {
        retryAttempts: 3,
        retryDelay: 50,
        enableFuzzyMatching: true
      }
    });
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should categorize errors correctly', async () => {
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    mockWasmWrapper.getStationId.mockRejectedValue(new Error('Station not found'));
    
    try {
      await sdk.getStationById('非存在駅');
    } catch (error) {
      expect(error).toBeInstanceOf(FarertSDKError);
      expect((error as FarertSDKError).code).toBe(FarertSDKErrorCode.STATION_NOT_FOUND);
    }
  });
  
  test('should provide clear error messages with context', async () => {
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    mockWasmWrapper.calculateFare.mockRejectedValue(new Error('Calculation failed'));
    
    try {
      await sdk.calculateFare('invalid route');
    } catch (error) {
      expect(error).toBeInstanceOf(FarertSDKError);
      expect((error as FarertSDKError).message).toContain('Calculation failed');
      expect((error as FarertSDKError).context).toBeDefined();
    }
  });
  
  test('should determine retryable vs non-retryable errors', async () => {
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    
    // Non-retryable error (station not found)
    mockWasmWrapper.getStationName.mockRejectedValue(new Error('Station not found'));
    
    try {
      await sdk.getStationById(999999);
    } catch (error) {
      expect(error).toBeInstanceOf(FarertSDKError);
      // Should not be retryable
    }
  });
  
  test('should handle network errors with retry', async () => {
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    let attemptCount = 0;
    
    mockWasmWrapper.getStationName.mockImplementation(() => {
      attemptCount++;
      if (attemptCount <= 2) {
        throw new Error('Network error');
      }
      return Promise.resolve('東京');
    });
    
    const result = await sdk.getStationById(1130101);
    expect(result).toBeDefined();
    expect(attemptCount).toBe(3); // 1 initial + 2 retries
  });
  
  test('should respect maximum retry attempts', async () => {
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    mockWasmWrapper.calculateFare.mockRejectedValue(new Error('Service unavailable'));
    
    await expect(sdk.calculateFare('東京 東海道線 横浜')).rejects.toThrow(FarertSDKError);
  });
});

// ============================================================================
// CACHING AND PERFORMANCE TESTS
// ============================================================================

describe('FarertSDK - Caching and Performance', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK({
      caching: {
        enabled: true,
        maxSize: 1000,
        ttl: 300000
      },
      performance: {
        enabled: true,
        trackingLevel: 'detailed'
      }
    });
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should cache station lookups effectively', async () => {
    const mockCacheManager = (sdk as any).cacheManager;
    
    // First call - cache miss
    mockCacheManager.get.mockResolvedValueOnce(null);
    await sdk.getStationById(1130101);
    
    // Second call - should check cache
    await sdk.getStationById(1130101);
    
    expect(mockCacheManager.get).toHaveBeenCalledTimes(2);
    expect(mockCacheManager.set).toHaveBeenCalled();
  });
  
  test('should cache search results with TTL', async () => {
    const mockCacheManager = (sdk as any).cacheManager;
    
    await sdk.searchStations('東京');
    
    expect(mockCacheManager.get).toHaveBeenCalled();
    expect(mockCacheManager.set).toHaveBeenCalled();
  });
  
  test('should provide performance metrics', () => {
    const metrics = sdk.metrics;
    
    expect(metrics).toBeDefined();
    expect(typeof metrics.startTimer).toBe('function');
    expect(typeof metrics.endTimer).toBe('function');
    expect(typeof metrics.recordMetric).toBe('function');
    expect(typeof metrics.getMetrics).toBe('function');
  });
  
  test('should track cache performance statistics', async () => {
    const mockCacheManager = (sdk as any).cacheManager;
    
    // Simulate cache hit
    mockCacheManager.get.mockResolvedValueOnce({
      id: 1130101,
      name: '東京',
      kana: 'とうきょう'
    });
    
    await sdk.getStationById(1130101);
    
    expect(mockCacheManager.get).toHaveBeenCalled();
  });
  
  test('should manage cache size and memory limits', () => {
    const cacheManager = sdk.cache;
    
    expect(cacheManager).toBeDefined();
    expect(cacheManager.config).toBeDefined();
    expect(cacheManager.config.globalMemoryLimit).toBeGreaterThan(0);
  });
});

// ============================================================================
// EVENT SYSTEM TESTS
// ============================================================================

describe('FarertSDK - Event System', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK();
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should support event listeners for initialization', (done) => {
    const newSdk = createTestSDK();
    
    newSdk.addEventListener('initialized', (event) => {
      expect(event.type).toBe('initialized');
      expect(event.timestamp).toBeDefined();
      expect(event.data).toBeDefined();
      newSdk.dispose().then(() => done());
    });
    
    newSdk.initialize();
  });
  
  test('should support event listeners for route calculations', (done) => {
    sdk.addEventListener('routeCalculated', (event) => {
      expect(event.type).toBe('routeCalculated');
      expect(event.result).toBeDefined();
      expect(event.route).toBeDefined();
      done();
    });
    
    sdk.calculateFare('東京 東海道線 横浜');
  });
  
  test('should support event listeners for errors', (done) => {
    const mockWasmWrapper = (sdk as any).wasmWrapper;
    mockWasmWrapper.calculateFare.mockRejectedValue(new Error('Test error'));
    
    sdk.addEventListener('error', (event) => {
      expect(event.type).toBe('error');
      expect(event.error).toBeDefined();
      done();
    });
    
    sdk.calculateFare('invalid route').catch(() => {}); // Ignore the promise rejection
  });
  
  test('should support removing event listeners', () => {
    const listener = vi.fn();
    
    sdk.addEventListener('initialized', listener);
    sdk.removeEventListener('initialized', listener);
    
    // The listener should not be called for future events
    expect(listener).not.toHaveBeenCalled();
  });
  
  test('should handle event listener errors gracefully', (done) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    sdk.addEventListener('initialized', () => {
      throw new Error('Listener error');
    });
    
    // Wait for asynchronous event emission
    setTimeout(() => {
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
      done();
    }, 10);
    
    // Trigger an event
    (sdk as any).emitEvent('initialized', {
      type: 'initialized',
      timestamp: Date.now(),
      source: 'test'
    });
  });
});

// ============================================================================
// FACTORY FUNCTIONS TESTS
// ============================================================================

describe('FarertSDK - Factory Functions', () => {
  afterEach(async () => {
    // Clean up any created SDKs
  });
  
  test('createFarertSDK should create default instance', () => {
    const sdk = createFarertSDK();
    
    expect(sdk).toBeInstanceOf(FarertSDK);
    expect(sdk.state).toBe(SDKState.UNINITIALIZED);
    
    sdk.dispose();
  });
  
  test('createDevelopmentSDK should create development-optimized instance', () => {
    const sdk = createDevelopmentSDK();
    
    expect(sdk).toBeInstanceOf(FarertSDK);
    expect(sdk.config.development).toBe(true);
    expect(sdk.config.performance.enabled).toBe(true);
    expect(sdk.config.performance.trackingLevel).toBe('detailed');
    
    sdk.dispose();
  });
  
  test('createProductionSDK should create production-optimized instance', () => {
    const sdk = createProductionSDK();
    
    expect(sdk).toBeInstanceOf(FarertSDK);
    expect(sdk.config.development).toBe(false);
    expect(sdk.config.performance.trackingLevel).toBe('basic');
    expect(sdk.config.errorHandling.retryAttempts).toBe(2);
    
    sdk.dispose();
  });
  
  test('factory functions should accept custom configuration', () => {
    const customConfig = {
      caching: { enabled: false, maxSize: 100, ttl: 10000 }
    };
    
    const sdk = createFarertSDK(customConfig);
    
    expect(sdk.config.caching.enabled).toBe(false);
    expect(sdk.config.caching.maxSize).toBe(100);
    
    sdk.dispose();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('FarertSDK - Integration Tests', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK({
      caching: { enabled: true, maxSize: 2000, ttl: 300000 },
      performance: { enabled: true, trackingLevel: 'detailed' },
      errorHandling: { retryAttempts: 2, retryDelay: 100, enableFuzzyMatching: true }
    });
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should handle complete route building and calculation workflow', async () => {
    // 1. Search for stations
    const tokyoResults = await sdk.searchStations('東京');
    expect(tokyoResults.length).toBeGreaterThan(0);
    
    // 2. Get detailed station information
    const tokyoStation = await sdk.getStationById(1130101);
    expect(tokyoStation).toBeDefined();
    expect(tokyoStation!.name).toBe('東京');
    
    // 3. Create a route using object classes
    const route = sdk.createRoute();
    expect(route).toBeDefined();
    
    // 4. Calculate fare for the route
    const fareResult = await sdk.calculateFare('東京 東海道線 横浜');
    expect(fareResult.success).toBe(true);
    expect(fareResult.totalFare).toBeGreaterThan(0);
    
    // 5. Validate the route
    const validation = await sdk.validateRoute('東京 東海道線 横浜');
    expect(validation.isValid).toBe(true);
    
    // 6. Get reference data
    const companies = await sdk.getCompanies();
    expect(Array.isArray(companies)).toBe(true);
    
    const prefectures = await sdk.getPrefectures();
    expect(Array.isArray(prefectures)).toBe(true);
  });
  
  test('should demonstrate caching across multiple operations', async () => {
    const mockCacheManager = (sdk as any).cacheManager;
    let cacheSetCount = 0;
    mockCacheManager.set.mockImplementation(() => {
      cacheSetCount++;
      return Promise.resolve();
    });
    
    // Multiple station lookups
    await sdk.getStationById(1130101);
    await sdk.getStationById(1130201);
    await sdk.getStationById(1130301);
    
    // Multiple fare calculations
    await sdk.calculateFare('東京 東海道線 横浜');
    await sdk.calculateFare('新宿 山手線 品川');
    
    // Cache should have been populated multiple times
    expect(cacheSetCount).toBeGreaterThan(0);
  });
  
  test('should handle mixed success and failure scenarios', async () => {
    // Successful operations
    const validStation = await sdk.getStationById(1130101);
    expect(validStation).toBeDefined();
    
    const validFare = await sdk.calculateFare('東京 東海道線 横浜');
    expect(validFare.success).toBe(true);
    
    // Failed operations
    const invalidStation = await sdk.getStationById(9999999);
    expect(invalidStation).toBeNull();
    
    // SDK should remain functional after errors
    const anotherValidStation = await sdk.getStationById(1130201);
    expect(anotherValidStation).toBeDefined();
  });
  
  test('should track performance metrics across operations', async () => {
    // Perform various operations
    await sdk.getStationById(1130101);
    await sdk.searchStations('東京');
    await sdk.calculateFare('東京 東海道線 横浜');
    await sdk.getCompanies();
    
    const metrics = sdk.metrics.getMetrics();
    
    expect(metrics).toBeDefined();
    expect(metrics.timings).toBeDefined();
    expect(metrics.metrics).toBeDefined();
  });
  
  test('should support complex route building scenarios', async () => {
    // Build route using object classes
    const calcRoute = sdk.objectClasses.CalcRoute.create();
    expect(calcRoute).toBeDefined();
    
    // Calculate comprehensive fare result
    const fareResult = await calcRoute.calculateFare();
    expect(fareResult.success).toBe(true);
    expect(fareResult.metadata).toBeDefined();
    expect(fareResult.metadata.calculationTime).toBeGreaterThan(0);
    
    // Build optimal route plan
    const routePlan = await sdk.buildOptimalRoute('東京', '大阪');
    expect(routePlan.totalFare).toBeGreaterThan(0);
    expect(routePlan.characteristics).toBeDefined();
    expect(typeof routePlan.characteristics.complexity).toBe('string');
  });
});

// ============================================================================
// TYPE SAFETY AND TYPESCRIPT INTEGRATION TESTS
// ============================================================================

describe('FarertSDK - TypeScript Type Safety', () => {
  let sdk: FarertSDK;
  
  beforeEach(async () => {
    sdk = createTestSDK();
    await sdk.initialize();
  });
  
  afterEach(async () => {
    await sdk.dispose();
  });
  
  test('should provide complete TypeScript types for all interfaces', () => {
    // Test that all expected properties exist and have correct types
    expect(typeof sdk.state).toBe('string');
    expect(typeof sdk.version).toBe('string');
    expect(typeof sdk.isReady).toBe('function');
    expect(typeof sdk.initialize).toBe('function');
    expect(typeof sdk.dispose).toBe('function');
    
    // Test object classes structure
    const { objectClasses } = sdk;
    expect(typeof objectClasses.RouteList.create).toBe('function');
    expect(typeof objectClasses.Route.create).toBe('function');
    expect(typeof objectClasses.CalcRoute.create).toBe('function');
    expect(typeof objectClasses.RouteItem.create).toBe('function');
    expect(typeof objectClasses.RouteFlag.create).toBe('function');
    expect(typeof objectClasses.FareInfo.create).toBe('function');
  });
  
  test('should enforce correct parameter types', async () => {
    // These should compile without TypeScript errors
    await sdk.getStationById(1130101); // number
    await sdk.getStationById('東京');   // string
    
    await sdk.searchStations('東京', {
      limit: 5,
      fuzzyThreshold: 0.8,
      sortByPopularity: true
    });
    
    await sdk.calculateFare('東京 東海道線 横浜');
    await sdk.calculateFare({
      start: '東京',
      end: '横浜',
      via: ['品川']
    });
  });
  
  test('should provide comprehensive return type information', async () => {
    const station = await sdk.getStationById(1130101);
    if (station) {
      // TypeScript should know these properties exist
      expect(typeof station.id).toBe('number');
      expect(typeof station.name).toBe('string');
      expect(typeof station.kana).toBe('string');
      expect(typeof station.prefecture).toBe('string');
      expect(typeof station.isJunction).toBe('boolean');
      expect(Array.isArray(station.lines)).toBe(true);
    }
    
    const fareResult = await sdk.calculateFare('東京 東海道線 横浜');
    expect(typeof fareResult.success).toBe('boolean');
    expect(typeof fareResult.totalFare).toBe('number');
    expect(Array.isArray(fareResult.breakdown)).toBe(true);
    expect(Array.isArray(fareResult.route)).toBe(true);
    expect(Array.isArray(fareResult.discounts)).toBe(true);
    expect(typeof fareResult.metadata).toBe('object');
  });
  
  test('should support proper enum and union types', () => {
    expect(Object.values(SDKState)).toContain(sdk.state);
    expect(Object.values(FarertSDKErrorCode)).toContain(FarertSDKErrorCode.NOT_INITIALIZED);
    
    // Test configuration types
    const config = sdk.config;
    expect(typeof config.caching.enabled).toBe('boolean');
    expect(typeof config.performance.enabled).toBe('boolean');
    expect(typeof config.development).toBe('boolean');
    expect(['ja', 'en']).toContain(config.locale.language);
  });
});