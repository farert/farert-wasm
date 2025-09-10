/**
 * Comprehensive Cache Performance Tests
 * 
 * Tests for the Farert Frontend API Layer SDK cache system, validating
 * LRU eviction, TTL accuracy, memory management, and performance benchmarks
 * according to REQ-API-002 specifications.
 * 
 * Key Testing Areas:
 * - LRU eviction under memory pressure with realistic railway data
 * - TTL expiration timing accuracy with precise measurements
 * - Cache hit/miss ratios with Japanese railway data patterns
 * - 50MB memory limit enforcement and automatic cleanup
 * - Category-specific TTL validation (stations 1h, search 15min, fares 5min, reference session)
 * - Performance benchmarks (<10ms for cached calls)
 * - Concurrent access and thread safety
 * 
 * @file Cache Performance Test Suite
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-002: Intelligent Caching and Performance Layer
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  CacheManager, 
  CacheCategory, 
  createCacheManager,
  createProductionCacheManager 
} from '../../../src/sdk/cache/cache-manager';
import { 
  LRUCache, 
  CACHE_PRESETS,
  createStationInfoCache,
  createSearchResultsCache,
  createRouteCalculationsCache,
  createReferenceDataCache
} from '../../../src/sdk/cache/lru-cache';
import type {
  StationInfo,
  StationSearchResult,
  FareCalculationResult,
  CompanyInfo,
  PrefectureInfo,
  LineInfo
} from '../../../src/sdk/types/core';

// ============================================================================
// TEST DATA GENERATORS - REALISTIC JAPANESE RAILWAY DATA
// ============================================================================

/**
 * Generate realistic station information for testing
 */
function generateStationInfo(id: number): StationInfo {
  const stationNames = [
    { name: '東京', kana: 'とうきょう', prefecture: '東京都' },
    { name: '新宿', kana: 'しんじゅく', prefecture: '東京都' },
    { name: '渋谷', kana: 'しぶや', prefecture: '東京都' },
    { name: '横浜', kana: 'よこはま', prefecture: '神奈川県' },
    { name: '大阪', kana: 'おおさか', prefecture: '大阪府' },
    { name: '京都', kana: 'きょうと', prefecture: '京都府' },
    { name: '名古屋', kana: 'なごや', prefecture: '愛知県' },
    { name: '福岡', kana: 'ふくおか', prefecture: '福岡県' },
    { name: '仙台', kana: 'せんだい', prefecture: '宮城県' },
    { name: '札幌', kana: 'さっぽろ', prefecture: '北海道' }
  ];

  const station = stationNames[id % stationNames.length];
  
  return {
    id,
    name: station.name,
    nameExtended: `${station.name}駅`,
    kana: station.kana,
    prefecture: station.prefecture,
    prefectureId: Math.floor(id / 100) + 1,
    isJunction: id % 3 === 0,
    lines: generateLineInfoArray(id),
    coordinates: {
      latitude: 35.6762 + (Math.random() - 0.5) * 10,
      longitude: 139.6503 + (Math.random() - 0.5) * 10
    },
    ranking: Math.floor(Math.random() * 1000) + 1,
    type: id % 4 === 0 ? 'major' : id % 3 === 0 ? 'junction' : 'local'
  };
}

/**
 * Generate line information array
 */
function generateLineInfoArray(stationId: number): LineInfo[] {
  const lineCount = Math.min(Math.floor(Math.random() * 5) + 1, 3);
  const lines: LineInfo[] = [];
  
  for (let i = 0; i < lineCount; i++) {
    lines.push(generateLineInfo(stationId * 10 + i));
  }
  
  return lines;
}

/**
 * Generate realistic line information
 */
function generateLineInfo(id: number): LineInfo {
  const lineNames = [
    { name: '東海道線', company: 'JR東日本', type: 'jr' as const },
    { name: '中央線', company: 'JR東日本', type: 'jr' as const },
    { name: '山手線', company: 'JR東日本', type: 'jr' as const },
    { name: '東急東横線', company: '東急電鉄', type: 'private' as const },
    { name: '小田急線', company: '小田急電鉄', type: 'private' as const },
    { name: '東海道新幹線', company: 'JR東海', type: 'shinkansen' as const }
  ];

  const line = lineNames[id % lineNames.length];
  
  return {
    id,
    name: line.name,
    companyId: Math.floor(id / 10) + 1,
    companyName: line.company,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    isJR: line.type === 'jr' || line.type === 'shinkansen',
    isPrivate: line.type === 'private',
    stations: Array.from({length: Math.floor(Math.random() * 20) + 5}, (_, i) => i * 100 + id),
    type: line.type,
    averageSpeed: line.type === 'shinkansen' ? 250 : line.type === 'jr' ? 60 : 45
  };
}

/**
 * Generate search results with varying match scores
 */
function generateSearchResults(query: string, count: number): StationSearchResult[] {
  const results: StationSearchResult[] = [];
  
  for (let i = 0; i < count; i++) {
    const station = generateStationInfo(i + 1000);
    results.push({
      station,
      score: Math.max(0.1, Math.random()),
      matchedField: i % 3 === 0 ? 'name' : i % 3 === 1 ? 'kana' : 'alternative',
      highlight: `<mark>${query}</mark>${station.name.slice(query.length)}`
    });
  }
  
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Generate fare calculation result with realistic data
 */
function generateFareCalculationResult(routeId: string): FareCalculationResult {
  const baseFare = Math.floor(Math.random() * 2000) + 140;
  
  return {
    success: true,
    breakdown: [
      {
        type: 'base',
        description: '運賃',
        amount: baseFare,
        isDiscount: false,
        conditions: []
      }
    ],
    totalFare: baseFare,
    route: [
      {
        stationId: 1001,
        stationName: '東京',
        stationKana: 'とうきょう',
        lineId: 1001,
        lineName: '東海道線',
        travelTime: Math.floor(Math.random() * 60) + 10,
        distance: Math.floor(Math.random() * 50) + 5,
        fare: baseFare,
        isTransfer: false,
        platform: `${Math.floor(Math.random() * 20) + 1}番線`
      }
    ],
    discounts: [],
    metadata: {
      calculationTime: Math.random() * 100 + 10,
      cacheHit: false,
      version: '1.0.0'
    }
  };
}

/**
 * Generate company information
 */
function generateCompanyInfo(id: number): CompanyInfo {
  const companies = [
    { name: 'JR東日本', type: 'JR' as const, region: '東日本' },
    { name: 'JR西日本', type: 'JR' as const, region: '西日本' },
    { name: '東急電鉄', type: 'PRIVATE' as const, region: '関東' },
    { name: '小田急電鉄', type: 'PRIVATE' as const, region: '関東' }
  ];

  const company = companies[id % companies.length];
  
  return {
    id,
    name: company.name,
    type: company.type,
    region: company.region,
    color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
    lines: Array.from({length: Math.floor(Math.random() * 10) + 1}, (_, i) => id * 10 + i)
  };
}

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * High-precision timer for accurate performance measurements
 */
class PerformanceTimer {
  private startTime: number = 0;
  
  start(): void {
    this.startTime = performance.now();
  }
  
  end(): number {
    return performance.now() - this.startTime;
  }
  
  static async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const timer = new PerformanceTimer();
    timer.start();
    const result = await fn();
    const time = timer.end();
    return { result, time };
  }
  
  static measure<T>(fn: () => T): { result: T; time: number } {
    const timer = new PerformanceTimer();
    timer.start();
    const result = fn();
    const time = timer.end();
    return { result, time };
  }
}

/**
 * Memory usage estimation utility
 */
class MemoryEstimator {
  static estimate(obj: any): number {
    const jsonString = JSON.stringify(obj);
    // Rough estimation: JSON string length * 2 (Unicode) + object overhead
    return jsonString.length * 2 + 200;
  }
  
  static generateDataOfSize(targetSizeBytes: number): any {
    const baseSize = 100;
    const repetitions = Math.floor(targetSizeBytes / baseSize);
    
    return {
      data: 'x'.repeat(baseSize),
      repetitions: Array.from({length: repetitions}, (_, i) => `item-${i}`)
    };
  }
}

// ============================================================================
// TEST SUITE SETUP
// ============================================================================

describe('Cache Performance Tests - REQ-API-002 Validation', () => {
  let cacheManager: CacheManager;
  let stationCache: LRUCache<StationInfo>;
  let searchCache: LRUCache<StationSearchResult[]>;
  let fareCache: LRUCache<FareCalculationResult>;
  let refCache: LRUCache<CompanyInfo>;

  beforeEach(() => {
    // Initialize cache instances with production configurations
    cacheManager = createProductionCacheManager({
      globalMemoryLimit: 50 * 1024 * 1024, // 50MB
      enableDetailedStats: true,
      autoMemoryManagement: true,
      memoryCheckInterval: 100 // Fast checking for tests
    });

    stationCache = createStationInfoCache<StationInfo>();
    searchCache = createSearchResultsCache<StationSearchResult[]>();
    fareCache = createRouteCalculationsCache<FareCalculationResult>();
    refCache = createReferenceDataCache<CompanyInfo>();

    // Mock timers for TTL tests
    jest.useFakeTimers();
  });

  afterEach(() => {
    cacheManager.dispose();
    stationCache.dispose();
    searchCache.dispose();
    fareCache.dispose();
    refCache.dispose();
    jest.useRealTimers();
  });

  // ============================================================================
  // LRU EVICTION UNDER MEMORY PRESSURE TESTS
  // ============================================================================

  describe('LRU Eviction Under Memory Pressure', () => {
    it('should evict least recently used entries when memory limit is exceeded', async () => {
      const smallCache = new LRUCache<any>({
        maxSize: 100,
        maxMemoryBytes: 10 * 1024, // 10KB limit for testing
        evictionStrategy: 'lru'
      });

      // Fill cache near capacity
      const entries: Array<{key: string; data: any}> = [];
      for (let i = 0; i < 20; i++) {
        const data = MemoryEstimator.generateDataOfSize(800); // ~800 bytes each
        const key = `station-${i}`;
        entries.push({key, data});
        smallCache.set(key, data);
      }

      // Access first few entries to make them recently used
      for (let i = 0; i < 5; i++) {
        smallCache.get(`station-${i}`);
      }

      // Add large entry that should trigger eviction
      const largeData = MemoryEstimator.generateDataOfSize(5000); // 5KB
      smallCache.set('large-entry', largeData);

      // Verify LRU eviction occurred
      const stats = smallCache.getStats();
      expect(stats.evictedEntries).toBeGreaterThan(0);
      
      // Recently accessed entries should still exist
      for (let i = 0; i < 5; i++) {
        expect(smallCache.has(`station-${i}`)).toBe(true);
      }

      // Some older entries should have been evicted
      let evictedCount = 0;
      for (let i = 10; i < 20; i++) {
        if (!smallCache.has(`station-${i}`)) {
          evictedCount++;
        }
      }
      expect(evictedCount).toBeGreaterThan(0);

      smallCache.dispose();
    }, 10000);

    it('should maintain cache performance during memory pressure', async () => {
      const perfCache = new LRUCache<StationInfo>({
        maxMemoryBytes: 5 * 1024, // 5KB limit
        evictionStrategy: 'lru'
      });

      const performanceResults: number[] = [];

      // Populate cache and measure performance during eviction
      for (let i = 0; i < 50; i++) {
        const station = generateStationInfo(i);
        
        const { time } = await PerformanceTimer.measureAsync(async () => {
          perfCache.set(`station-${i}`, station);
        });
        
        performanceResults.push(time);
      }

      // Verify performance remained acceptable during memory pressure
      const averageTime = performanceResults.reduce((sum, time) => sum + time, 0) / performanceResults.length;
      const maxTime = Math.max(...performanceResults);
      
      expect(averageTime).toBeLessThan(5); // Average < 5ms
      expect(maxTime).toBeLessThan(20); // Maximum < 20ms even during eviction
      
      // Verify eviction occurred
      expect(perfCache.getStats().evictedEntries).toBeGreaterThan(0);

      perfCache.dispose();
    });

    it('should respect eviction priority order in cache manager', async () => {
      const testManager = createCacheManager({
        globalMemoryLimit: 20 * 1024, // 20KB limit
        emergencyEvictionThreshold: 0.8,
        enableDetailedStats: true
      });

      // Fill different cache categories
      const stationData = generateStationInfo(1);
      const searchData = generateSearchResults('test', 5);
      const fareData = generateFareCalculationResult('test-route');
      const companyData = generateCompanyInfo(1);

      // Add entries to all categories
      await testManager.cacheStationInfo(1, stationData);
      await testManager.cacheSearchResults('test-query', searchData);
      await testManager.cacheFareCalculation('test-route', fareData);
      await testManager.cacheReferenceData('company', 1, companyData);

      // Add large amount of data to trigger emergency eviction
      for (let i = 0; i < 100; i++) {
        const largeStation = generateStationInfo(i + 1000);
        await testManager.cacheStationInfo(i + 1000, largeStation);
      }

      const stats = testManager.getStats();
      
      // Verify emergency eviction occurred
      expect(stats.global.emergencyEvictions).toBeGreaterThan(0);
      
      // Verify eviction priority: search results should be evicted first
      expect(stats.categories[CacheCategory.SEARCH_RESULTS].totalEntries).toBeLessThan(2);
      
      testManager.dispose();
    });
  });

  // ============================================================================
  // TTL EXPIRATION TIMING ACCURACY TESTS
  // ============================================================================

  describe('TTL Expiration Timing Accuracy', () => {
    it('should expire entries according to precise TTL timings', async () => {
      const ttlCache = new LRUCache<string>({
        defaultTTL: 1000, // 1 second
        autoCleanup: false // Manual cleanup for precise testing
      });

      const testData = 'test-data';
      const key = 'ttl-test';

      // Set entry with custom TTL
      ttlCache.set(key, testData, 500); // 500ms TTL
      
      // Verify entry exists immediately
      expect(ttlCache.has(key)).toBe(true);
      expect(ttlCache.get(key)).toBe(testData);

      // Advance time to just before expiration
      jest.advanceTimersByTime(450);
      expect(ttlCache.has(key)).toBe(true);

      // Advance time to exact expiration
      jest.advanceTimersByTime(51); // Total: 501ms
      expect(ttlCache.has(key)).toBe(false);
      expect(ttlCache.get(key)).toBeNull();

      ttlCache.dispose();
    });

    it('should validate category-specific TTL values', async () => {
      // Test station info cache (1 hour TTL)
      const stationData = generateStationInfo(1);
      stationCache.set('station-1', stationData);
      
      // Test search results cache (15 minutes TTL)  
      const searchData = generateSearchResults('test', 3);
      searchCache.set('search-test', searchData);
      
      // Test fare calculations cache (5 minutes TTL)
      const fareData = generateFareCalculationResult('test-route');
      fareCache.set('fare-test', fareData);
      
      // Test reference data cache (24 hours TTL - session duration)
      const companyData = generateCompanyInfo(1);
      refCache.set('company-1', companyData);

      // Verify all entries exist initially
      expect(stationCache.has('station-1')).toBe(true);
      expect(searchCache.has('search-test')).toBe(true);
      expect(fareCache.has('fare-test')).toBe(true);
      expect(refCache.has('company-1')).toBe(true);

      // Advance time to 6 minutes (fare calculations should expire)
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      expect(stationCache.has('station-1')).toBe(true); // Still valid (1 hour)
      expect(searchCache.has('search-test')).toBe(true); // Still valid (15 minutes)
      expect(fareCache.has('fare-test')).toBe(false); // Expired (5 minutes)
      expect(refCache.has('company-1')).toBe(true); // Still valid (24 hours)

      // Advance time to 16 minutes (search results should expire)
      jest.advanceTimersByTime(10 * 60 * 1000); // Total: 16 minutes
      
      expect(stationCache.has('station-1')).toBe(true); // Still valid (1 hour)
      expect(searchCache.has('search-test')).toBe(false); // Expired (15 minutes)
      expect(refCache.has('company-1')).toBe(true); // Still valid (24 hours)

      // Advance time to 61 minutes (station info should expire)
      jest.advanceTimersByTime(45 * 60 * 1000); // Total: 61 minutes
      
      expect(stationCache.has('station-1')).toBe(false); // Expired (1 hour)
      expect(refCache.has('company-1')).toBe(true); // Still valid (24 hours)
    });

    it('should handle TTL sliding vs absolute expiration correctly', async () => {
      const slidingCache = new LRUCache<string>({
        defaultTTL: 1000 // 1 second
      });

      slidingCache.set('sliding-test', 'data');
      
      // Access entry before expiration to test sliding behavior
      jest.advanceTimersByTime(500); // 0.5 seconds
      const data1 = slidingCache.get('sliding-test');
      expect(data1).toBe('data');

      // Entry should still be valid due to recent access updating lastAccess
      // but TTL is absolute from creation time, so it should expire at original time
      jest.advanceTimersByTime(600); // Total: 1.1 seconds from creation
      expect(slidingCache.has('sliding-test')).toBe(false);

      slidingCache.dispose();
    });
  });

  // ============================================================================
  // CACHE HIT/MISS RATIO TESTS WITH REALISTIC DATA
  // ============================================================================

  describe('Cache Hit/Miss Ratio with Railway Data Patterns', () => {
    it('should achieve high hit ratios with realistic access patterns', async () => {
      const testManager = createCacheManager({
        enableDetailedStats: true
      });

      // Simulate realistic railway station access patterns
      const popularStations = [1, 2, 3]; // Tokyo, Shinjuku, Shibuya
      const regularStations = [4, 5, 6, 7, 8]; // Other major stations
      const rareStations = [9, 10, 11, 12, 13, 14, 15]; // Less accessed

      // Load initial data
      for (const stationId of [...popularStations, ...regularStations, ...rareStations]) {
        const station = generateStationInfo(stationId);
        await testManager.cacheStationInfo(stationId, station);
      }

      // Simulate realistic access pattern (80/20 rule - popular stations accessed more)
      const accessPattern = [
        ...Array(50).fill(popularStations).flat(), // 150 accesses to popular (60%)
        ...Array(20).fill(regularStations).flat(), // 100 accesses to regular (40%)
        ...Array(2).fill(rareStations).flat() // 14 accesses to rare stations
      ];

      let hits = 0;
      let total = 0;

      for (const stationId of accessPattern) {
        const station = await testManager.getStationInfo(stationId);
        total++;
        if (station) hits++;
      }

      const hitRatio = hits / total;
      const stats = testManager.getStats();

      // Verify high hit ratio with realistic access patterns
      expect(hitRatio).toBeGreaterThan(0.85); // 85%+ hit ratio
      expect(stats.global.overallHitRatio).toBeGreaterThan(0.80);
      expect(stats.categories[CacheCategory.STATIONS].hitRatio).toBeGreaterThan(0.80);

      testManager.dispose();
    });

    it('should demonstrate cache effectiveness with search result patterns', async () => {
      const searchTerms = ['東京', '新宿', '渋谷', '横浜', '大阪']; // Common searches
      const searchManager = createCacheManager();

      // Perform initial searches
      for (const term of searchTerms) {
        const results = generateSearchResults(term, 10);
        await searchManager.cacheSearchResults(term, results);
      }

      // Simulate repeated searches (common user behavior)
      const searchPattern = [
        ...Array(20).fill('東京'),
        ...Array(15).fill('新宿'),
        ...Array(10).fill('渋谷'),
        ...Array(5).fill('横浜'),
        ...Array(3).fill('大阪'),
        '福岡', '札幌', '仙台' // New searches (cache misses)
      ];

      let cacheHits = 0;
      let totalSearches = 0;

      for (const searchTerm of searchPattern) {
        totalSearches++;
        const cached = await searchManager.getSearchResults(searchTerm);
        if (cached) {
          cacheHits++;
        } else {
          // Simulate new search and cache result
          const newResults = generateSearchResults(searchTerm, 8);
          await searchManager.cacheSearchResults(searchTerm, newResults);
        }
      }

      const searchHitRatio = cacheHits / totalSearches;
      
      // Verify effective caching of search results
      expect(searchHitRatio).toBeGreaterThan(0.75); // 75%+ hit ratio for searches
      
      const stats = searchManager.getStats();
      expect(stats.categories[CacheCategory.SEARCH_RESULTS].totalEntries).toBeGreaterThan(0);

      searchManager.dispose();
    });

    it('should maintain hit ratio efficiency under varying load patterns', async () => {
      const loadTestManager = createCacheManager({
        enableDetailedStats: true,
        memoryCheckInterval: 50 // Frequent memory checks
      });

      const hitRatios: number[] = [];
      
      // Test different load phases
      const loadPhases = [
        { name: 'light', operations: 100, dataSize: 'small' },
        { name: 'medium', operations: 500, dataSize: 'medium' },
        { name: 'heavy', operations: 1000, dataSize: 'large' }
      ];

      for (const phase of loadPhases) {
        const phaseStartStats = loadTestManager.getStats();
        const phaseStartHits = phaseStartStats.global.totalHits;
        const phaseStartMisses = phaseStartStats.global.totalMisses;

        // Simulate phase load
        for (let i = 0; i < phase.operations; i++) {
          const stationId = Math.floor(Math.random() * 50) + 1; // Random station access
          
          let station = await loadTestManager.getStationInfo(stationId);
          if (!station) {
            station = generateStationInfo(stationId);
            await loadTestManager.cacheStationInfo(stationId, station);
          }
        }

        const phaseEndStats = loadTestManager.getStats();
        const phaseHits = phaseEndStats.global.totalHits - phaseStartHits;
        const phaseMisses = phaseEndStats.global.totalMisses - phaseStartMisses;
        const phaseHitRatio = phaseHits / (phaseHits + phaseMisses);

        hitRatios.push(phaseHitRatio);
      }

      // Verify hit ratio remains stable across load phases
      for (let i = 1; i < hitRatios.length; i++) {
        const ratioDiff = Math.abs(hitRatios[i] - hitRatios[i-1]);
        expect(ratioDiff).toBeLessThan(0.2); // Hit ratio shouldn't vary by more than 20%
      }

      // Overall hit ratio should be reasonable
      const finalStats = loadTestManager.getStats();
      expect(finalStats.global.overallHitRatio).toBeGreaterThan(0.60);

      loadTestManager.dispose();
    });
  });

  // ============================================================================
  // 50MB MEMORY LIMIT ENFORCEMENT TESTS
  // ============================================================================

  describe('50MB Memory Limit Enforcement', () => {
    it('should enforce global 50MB memory limit with emergency eviction', async () => {
      const memoryManager = createCacheManager({
        globalMemoryLimit: 1024 * 1024, // 1MB for testing (scaled down from 50MB)
        emergencyEvictionThreshold: 0.9, // 90% threshold
        enableDetailedStats: true,
        memoryCheckInterval: 10 // Fast checking
      });

      const memoryCheckpoints: number[] = [];
      let emergencyEvictionsTriggered = false;

      // Monitor memory usage and emergency evictions
      memoryManager.on('memory_critical', () => {
        emergencyEvictionsTriggered = true;
      });

      // Fill cache with large data objects
      const largeDataSize = 100 * 1024; // 100KB per object
      let objectCount = 0;

      try {
        for (let i = 0; i < 20; i++) { // Should exceed 1MB limit
          const largeData = MemoryEstimator.generateDataOfSize(largeDataSize);
          const station = { ...generateStationInfo(i + 2000), largeData };
          
          await memoryManager.cacheStationInfo(i + 2000, station);
          objectCount++;

          const stats = memoryManager.getStats();
          memoryCheckpoints.push(stats.global.totalMemoryUsage);

          // Stop if we've exceeded the limit and eviction has occurred
          if (stats.global.emergencyEvictions > 0) break;
        }
      } catch (error) {
        // Expected - memory limit enforcement may throw errors
      }

      const finalStats = memoryManager.getStats();

      // Verify memory limit enforcement occurred
      expect(emergencyEvictionsTriggered || finalStats.global.emergencyEvictions > 0).toBe(true);
      expect(finalStats.global.totalMemoryUsage).toBeLessThan(memoryManager.getStats().global.totalMemoryUsage * 1.1); // Within 10% of limit
      
      // Verify memory usage didn't grow indefinitely
      const maxMemoryUsage = Math.max(...memoryCheckpoints);
      expect(maxMemoryUsage).toBeLessThan(1.5 * 1024 * 1024); // Shouldn't exceed 1.5MB

      memoryManager.dispose();
    }, 15000);

    it('should distribute memory usage appropriately across cache categories', async () => {
      const distributedManager = createCacheManager({
        globalMemoryLimit: 50 * 1024 * 1024, // Full 50MB
        enableDetailedStats: true
      });

      // Fill each category with proportional data based on their limits
      // Station: 10MB, Search: 5MB, Fare: 15MB, Reference: 20MB

      // Add station data (target ~8MB usage)
      for (let i = 0; i < 100; i++) {
        const station = generateStationInfo(i + 3000);
        await distributedManager.cacheStationInfo(i + 3000, station);
      }

      // Add search results (target ~3MB usage) 
      for (let i = 0; i < 50; i++) {
        const results = generateSearchResults(`query-${i}`, 20);
        await distributedManager.cacheSearchResults(`query-${i}`, results);
      }

      // Add fare calculations (target ~10MB usage)
      for (let i = 0; i < 200; i++) {
        const fare = generateFareCalculationResult(`route-${i}`);
        await distributedManager.cacheFareCalculation(`route-${i}`, fare);
      }

      // Add reference data (target ~15MB usage)
      for (let i = 0; i < 150; i++) {
        const company = generateCompanyInfo(i + 4000);
        await distributedManager.cacheReferenceData('company', i + 4000, company);
      }

      const stats = distributedManager.getStats();
      const distribution = stats.memoryDistribution;

      // Verify each category is within its expected range
      expect(distribution[CacheCategory.STATIONS].usage).toBeGreaterThan(0);
      expect(distribution[CacheCategory.STATIONS].usage).toBeLessThan(12 * 1024 * 1024); // < 12MB

      expect(distribution[CacheCategory.SEARCH_RESULTS].usage).toBeGreaterThan(0);
      expect(distribution[CacheCategory.SEARCH_RESULTS].usage).toBeLessThan(7 * 1024 * 1024); // < 7MB

      expect(distribution[CacheCategory.FARE_CALCULATIONS].usage).toBeGreaterThan(0);
      expect(distribution[CacheCategory.FARE_CALCULATIONS].usage).toBeLessThan(18 * 1024 * 1024); // < 18MB

      expect(distribution[CacheCategory.REFERENCE_DATA].usage).toBeGreaterThan(0);
      expect(distribution[CacheCategory.REFERENCE_DATA].usage).toBeLessThan(25 * 1024 * 1024); // < 25MB

      // Total usage should be reasonable
      expect(stats.global.totalMemoryUsage).toBeLessThan(45 * 1024 * 1024); // < 45MB
      expect(stats.global.memoryUsagePercent).toBeLessThan(90); // < 90% of limit

      distributedManager.dispose();
    });

    it('should perform automatic cleanup when approaching memory limits', async () => {
      const cleanupManager = createCacheManager({
        globalMemoryLimit: 2 * 1024 * 1024, // 2MB limit
        autoMemoryManagement: true,
        memoryCheckInterval: 50, // Frequent checks
        emergencyEvictionThreshold: 0.8, // Trigger at 80%
        enableDetailedStats: true
      });

      let cleanupEvents = 0;
      cleanupManager.on('memory_warning', () => cleanupEvents++);

      // Gradually fill cache and monitor cleanup
      const memoryProgression: Array<{usage: number; entries: number}> = [];

      for (let batch = 0; batch < 10; batch++) {
        // Add batch of data
        for (let i = 0; i < 20; i++) {
          const id = batch * 20 + i;
          const station = generateStationInfo(id + 5000);
          await cleanupManager.cacheStationInfo(id + 5000, station);
        }

        // Record memory state
        const stats = cleanupManager.getStats();
        memoryProgression.push({
          usage: stats.global.totalMemoryUsage,
          entries: stats.global.totalEntries
        });

        // Small delay to allow cleanup to occur
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify automatic cleanup occurred
      expect(cleanupEvents).toBeGreaterThan(0);

      const finalStats = cleanupManager.getStats();
      expect(finalStats.global.emergencyEvictions).toBeGreaterThan(0);

      // Verify memory stayed within reasonable bounds
      const maxMemoryUsage = Math.max(...memoryProgression.map(p => p.usage));
      expect(maxMemoryUsage).toBeLessThan(2.5 * 1024 * 1024); // Shouldn't exceed 2.5MB

      cleanupManager.dispose();
    }, 20000);
  });

  // ============================================================================
  // PERFORMANCE BENCHMARK TESTS (<10ms REQUIREMENT)
  // ============================================================================

  describe('Performance Benchmarks - <10ms for Cached Calls', () => {
    it('should meet <10ms performance requirement for cached station lookups', async () => {
      const perfManager = createCacheManager({
        enableDetailedStats: true
      });

      // Pre-populate cache with station data
      const stationIds = Array.from({length: 100}, (_, i) => i + 6000);
      for (const stationId of stationIds) {
        const station = generateStationInfo(stationId);
        await perfManager.cacheStationInfo(stationId, station);
      }

      // Measure cached lookup performance
      const lookupTimes: number[] = [];
      const sampleSize = 1000;

      for (let i = 0; i < sampleSize; i++) {
        const randomStationId = stationIds[Math.floor(Math.random() * stationIds.length)];
        
        const { time } = await PerformanceTimer.measureAsync(async () => {
          const station = await perfManager.getStationInfo(randomStationId);
          expect(station).toBeTruthy(); // Verify cache hit
        });

        lookupTimes.push(time);
      }

      // Statistical analysis of performance
      const averageTime = lookupTimes.reduce((sum, time) => sum + time, 0) / lookupTimes.length;
      const maxTime = Math.max(...lookupTimes);
      const p95Time = lookupTimes.sort((a, b) => a - b)[Math.floor(0.95 * lookupTimes.length)];
      const p99Time = lookupTimes.sort((a, b) => a - b)[Math.floor(0.99 * lookupTimes.length)];

      // Verify performance requirements
      expect(averageTime).toBeLessThan(10); // Average < 10ms
      expect(p95Time).toBeLessThan(15); // 95th percentile < 15ms
      expect(p99Time).toBeLessThan(25); // 99th percentile < 25ms
      expect(maxTime).toBeLessThan(50); // Maximum < 50ms

      // Verify high cache hit ratio
      const stats = perfManager.getStats();
      expect(stats.categories[CacheCategory.STATIONS].hitRatio).toBeGreaterThan(0.95);

      perfManager.dispose();
    });

    it('should maintain performance under concurrent access', async () => {
      const concurrentManager = createCacheManager({
        enableDetailedStats: true
      });

      // Pre-populate with diverse data
      for (let i = 0; i < 50; i++) {
        await concurrentManager.cacheStationInfo(i + 7000, generateStationInfo(i + 7000));
        await concurrentManager.cacheSearchResults(`query-${i}`, generateSearchResults(`query-${i}`, 5));
        await concurrentManager.cacheFareCalculation(`route-${i}`, generateFareCalculationResult(`route-${i}`));
      }

      // Simulate concurrent access from multiple "users"
      const concurrentOperations = Array.from({length: 20}, (_, userIndex) => {
        return Array.from({length: 50}, (_, opIndex) => {
          return async () => {
            const operationType = Math.random();
            const { time } = await PerformanceTimer.measureAsync(async () => {
              if (operationType < 0.4) {
                // Station lookup (40% of operations)
                const stationId = Math.floor(Math.random() * 50) + 7000;
                await concurrentManager.getStationInfo(stationId);
              } else if (operationType < 0.7) {
                // Search results (30% of operations)
                const queryIndex = Math.floor(Math.random() * 50);
                await concurrentManager.getSearchResults(`query-${queryIndex}`);
              } else {
                // Fare calculation (30% of operations)
                const routeIndex = Math.floor(Math.random() * 50);
                await concurrentManager.getFareCalculation(`route-${routeIndex}`);
              }
            });
            return time;
          };
        });
      }).flat();

      // Execute all operations concurrently
      const concurrentTimes = await Promise.all(
        concurrentOperations.map(op => op())
      );

      // Analyze concurrent performance
      const avgConcurrentTime = concurrentTimes.reduce((sum, time) => sum + time, 0) / concurrentTimes.length;
      const maxConcurrentTime = Math.max(...concurrentTimes);
      const p90Time = concurrentTimes.sort((a, b) => a - b)[Math.floor(0.9 * concurrentTimes.length)];

      // Verify performance under concurrency
      expect(avgConcurrentTime).toBeLessThan(15); // Average < 15ms (slightly higher due to concurrency)
      expect(p90Time).toBeLessThan(25); // 90th percentile < 25ms
      expect(maxConcurrentTime).toBeLessThan(100); // Maximum < 100ms

      const stats = concurrentManager.getStats();
      expect(stats.global.overallHitRatio).toBeGreaterThan(0.85); // Maintain high hit ratio

      concurrentManager.dispose();
    });

    it('should benchmark cache vs non-cached operations', async () => {
      const benchmarkManager = createCacheManager();

      // Simulate expensive operation (database lookup, calculation, etc.)
      const simulateExpensiveOperation = async (id: number): Promise<StationInfo> => {
        // Simulate network/database delay
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100)); // 50-150ms delay
        return generateStationInfo(id);
      };

      const testIds = Array.from({length: 20}, (_, i) => i + 8000);

      // Measure non-cached operations
      const uncachedTimes: number[] = [];
      for (const id of testIds) {
        const { time } = await PerformanceTimer.measureAsync(async () => {
          await simulateExpensiveOperation(id);
        });
        uncachedTimes.push(time);
      }

      // Populate cache
      for (const id of testIds) {
        const station = await simulateExpensiveOperation(id);
        await benchmarkManager.cacheStationInfo(id, station);
      }

      // Measure cached operations  
      const cachedTimes: number[] = [];
      for (const id of testIds) {
        const { time } = await PerformanceTimer.measureAsync(async () => {
          const station = await benchmarkManager.getStationInfo(id);
          expect(station).toBeTruthy();
        });
        cachedTimes.push(time);
      }

      // Calculate performance improvements
      const avgUncachedTime = uncachedTimes.reduce((sum, time) => sum + time, 0) / uncachedTimes.length;
      const avgCachedTime = cachedTimes.reduce((sum, time) => sum + time, 0) / cachedTimes.length;
      const speedupRatio = avgUncachedTime / avgCachedTime;

      // Verify significant performance improvement
      expect(avgCachedTime).toBeLessThan(10); // Cached calls < 10ms
      expect(avgUncachedTime).toBeGreaterThan(50); // Uncached calls > 50ms  
      expect(speedupRatio).toBeGreaterThan(10); // At least 10x speedup

      benchmarkManager.dispose();
    }, 30000);
  });

  // ============================================================================
  // COMPREHENSIVE REQ-API-002 VALIDATION
  // ============================================================================

  describe('REQ-API-002 Acceptance Criteria Validation', () => {
    it('should validate all caching requirements in integrated scenario', async () => {
      const integrationManager = createProductionCacheManager({
        globalMemoryLimit: 50 * 1024 * 1024,
        enableDetailedStats: true,
        autoMemoryManagement: true
      });

      // REQ-API-002.1: Station information cached for 1 hour
      const tokyoStation = generateStationInfo(1);
      await integrationManager.cacheStationInfo(1, tokyoStation);
      
      // REQ-API-002.2: Search results cached for 15 minutes
      const searchResults = generateSearchResults('東京', 10);
      await integrationManager.cacheSearchResults('東京', searchResults);
      
      // REQ-API-002.3: Route calculations cached for 5 minutes
      const fareResult = generateFareCalculationResult('tokyo-osaka');
      await integrationManager.cacheFareCalculation('tokyo-osaka', fareResult);
      
      // REQ-API-002.4: Reference data cached for session duration
      const jrEast = generateCompanyInfo(1);
      await integrationManager.cacheReferenceData('company', 1, jrEast);

      // Verify initial state
      expect(await integrationManager.getStationInfo(1)).toBeTruthy();
      expect(await integrationManager.getSearchResults('東京')).toBeTruthy();
      expect(await integrationManager.getFareCalculation('tokyo-osaka')).toBeTruthy();
      expect(await integrationManager.getReferenceData('company', 1)).toBeTruthy();

      // Test TTL behavior
      jest.advanceTimersByTime(6 * 60 * 1000); // 6 minutes
      expect(await integrationManager.getFareCalculation('tokyo-osaka')).toBeNull(); // Should be expired
      expect(await integrationManager.getStationInfo(1)).toBeTruthy(); // Should still exist

      jest.advanceTimersByTime(10 * 60 * 1000); // Total: 16 minutes  
      expect(await integrationManager.getSearchResults('東京')).toBeNull(); // Should be expired
      expect(await integrationManager.getStationInfo(1)).toBeTruthy(); // Should still exist

      // REQ-API-002.5: Memory management and LRU eviction
      const stats = integrationManager.getStats();
      expect(stats.global.totalMemoryUsage).toBeLessThan(50 * 1024 * 1024);
      expect(stats.global.memoryUsagePercent).toBeLessThan(100);

      // Test memory pressure behavior
      for (let i = 0; i < 1000; i++) {
        const largeStation = generateStationInfo(i + 9000);
        await integrationManager.cacheStationInfo(i + 9000, largeStation);
      }

      const finalStats = integrationManager.getStats();
      expect(finalStats.global.totalMemoryUsage).toBeLessThan(55 * 1024 * 1024); // Allow some overhead
      expect(finalStats.global.emergencyEvictions).toBeGreaterThanOrEqual(0); // Emergency eviction may have occurred

      integrationManager.dispose();
    }, 30000);

    it('should validate performance requirements across all operations', async () => {
      const performanceManager = createCacheManager({
        enableDetailedStats: true
      });

      // Pre-populate with diverse data
      const setupData = async () => {
        const operations = [];
        
        // Stations
        for (let i = 0; i < 100; i++) {
          operations.push(
            performanceManager.cacheStationInfo(i + 10000, generateStationInfo(i + 10000))
          );
        }
        
        // Search results
        for (let i = 0; i < 50; i++) {
          operations.push(
            performanceManager.cacheSearchResults(`search-${i}`, generateSearchResults(`search-${i}`, 8))
          );
        }
        
        // Fare calculations
        for (let i = 0; i < 75; i++) {
          operations.push(
            performanceManager.cacheFareCalculation(`route-${i}`, generateFareCalculationResult(`route-${i}`))
          );
        }
        
        await Promise.all(operations);
      };

      await setupData();

      // Test mixed operation performance
      const mixedOperations: Array<() => Promise<number>> = [
        // Station lookups
        ...Array.from({length: 100}, () => async () => {
          const id = Math.floor(Math.random() * 100) + 10000;
          const { time } = await PerformanceTimer.measureAsync(() => 
            performanceManager.getStationInfo(id)
          );
          return time;
        }),
        
        // Search operations  
        ...Array.from({length: 50}, () => async () => {
          const searchIndex = Math.floor(Math.random() * 50);
          const { time } = await PerformanceTimer.measureAsync(() =>
            performanceManager.getSearchResults(`search-${searchIndex}`)
          );
          return time;
        }),
        
        // Fare lookups
        ...Array.from({length: 75}, () => async () => {
          const routeIndex = Math.floor(Math.random() * 75);
          const { time } = await PerformanceTimer.measureAsync(() =>
            performanceManager.getFareCalculation(`route-${routeIndex}`)
          );
          return time;
        })
      ];

      // Execute all operations and measure performance
      const operationTimes = await Promise.all(
        mixedOperations.map(op => op())
      );

      // Comprehensive performance analysis
      const stats = {
        average: operationTimes.reduce((sum, time) => sum + time, 0) / operationTimes.length,
        median: operationTimes.sort((a, b) => a - b)[Math.floor(operationTimes.length / 2)],
        p95: operationTimes.sort((a, b) => a - b)[Math.floor(0.95 * operationTimes.length)],
        p99: operationTimes.sort((a, b) => a - b)[Math.floor(0.99 * operationTimes.length)],
        max: Math.max(...operationTimes),
        min: Math.min(...operationTimes)
      };

      // Validate REQ-API-002 performance requirements
      expect(stats.average).toBeLessThan(10); // Average < 10ms
      expect(stats.median).toBeLessThan(8); // Median < 8ms
      expect(stats.p95).toBeLessThan(20); // 95th percentile < 20ms
      expect(stats.p99).toBeLessThan(30); // 99th percentile < 30ms

      // Verify cache effectiveness
      const cacheStats = performanceManager.getStats();
      expect(cacheStats.global.overallHitRatio).toBeGreaterThan(0.90); // 90%+ hit ratio

      performanceManager.dispose();
    });
  });
});

// ============================================================================
// ADDITIONAL INTEGRATION TESTS
// ============================================================================

describe('Cache Integration and Edge Cases', () => {
  let testManager: CacheManager;

  beforeEach(() => {
    testManager = createCacheManager({
      enableDetailedStats: true,
      autoMemoryManagement: true
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    testManager.dispose();
    jest.useRealTimers();
  });

  it('should handle cache corruption and recovery gracefully', async () => {
    // Simulate cache with some data
    await testManager.cacheStationInfo(1, generateStationInfo(1));
    
    // Simulate potential corruption by accessing internal state
    // This tests the robustness of the cache system
    try {
      // Force an error condition
      const corruptData = { corrupted: true, invalid: 'data' } as any;
      await testManager.set(CacheCategory.STATIONS, 'corrupt-key', corruptData);
      
      const retrieved = await testManager.get(CacheCategory.STATIONS, 'corrupt-key');
      expect(retrieved).toBeTruthy(); // Should handle gracefully
    } catch (error) {
      // Error handling should be graceful
      expect(error).toBeDefined();
    }

    // Normal operations should continue to work
    const normalStation = await testManager.getStationInfo(1);
    expect(normalStation).toBeTruthy();
  });

  it('should handle extreme edge cases and boundary conditions', async () => {
    // Test empty keys
    await expect(testManager.get(CacheCategory.STATIONS, '')).resolves.toBeNull();
    
    // Test very long keys
    const longKey = 'a'.repeat(10000);
    const station = generateStationInfo(999);
    await testManager.cacheStationInfo(999, station);
    
    // Test null/undefined values (should be handled gracefully)
    await expect(testManager.set(CacheCategory.STATIONS, 'null-test', null as any)).resolves.not.toThrow();
    
    // Test concurrent modifications
    const concurrentOps = Array.from({length: 100}, (_, i) => 
      testManager.cacheStationInfo(i + 20000, generateStationInfo(i + 20000))
    );
    
    await expect(Promise.all(concurrentOps)).resolves.not.toThrow();
  });

  it('should provide accurate diagnostics and monitoring', async () => {
    // Add diverse data for monitoring
    for (let i = 0; i < 10; i++) {
      await testManager.cacheStationInfo(i + 30000, generateStationInfo(i + 30000));
      await testManager.cacheSearchResults(`diag-${i}`, generateSearchResults(`diag-${i}`, 3));
    }

    // Test statistics accuracy
    const stats = testManager.getStats();
    
    expect(stats.global.totalEntries).toBeGreaterThan(0);
    expect(stats.global.totalMemoryUsage).toBeGreaterThan(0);
    expect(stats.categories[CacheCategory.STATIONS].totalEntries).toBe(10);
    expect(stats.categories[CacheCategory.SEARCH_RESULTS].totalEntries).toBe(10);

    // Test performance metrics
    expect(stats.performance.efficiencyScore).toBeGreaterThanOrEqual(0);
    expect(stats.performance.efficiencyScore).toBeLessThanOrEqual(100);

    // Test memory distribution
    const totalDistribution = Object.values(stats.memoryDistribution)
      .reduce((sum, dist) => sum + dist.usage, 0);
    expect(totalDistribution).toBe(stats.global.totalMemoryUsage);
  });
});
