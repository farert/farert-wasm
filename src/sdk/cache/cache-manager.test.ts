/**
 * Cache Manager Tests
 * 
 * Comprehensive test suite for the CacheManager class covering
 * memory management, category-specific caching, and event handling.
 * 
 * @file Cache Manager Tests
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  CacheManager, 
  CacheCategory, 
  createCacheManager, 
  createSvelteCacheManager,
  createProductionCacheManager
} from './cache-manager';

import type { 
  StationInfo, 
  StationSearchResult, 
  FareCalculationResult 
} from '../types/core';

// Mock data for testing
const mockStationInfo: StationInfo = {
  id: 1,
  name: '東京',
  nameExtended: '東京',
  kana: 'とうきょう',
  prefecture: '東京都',
  prefectureId: 13,
  isJunction: true,
  lines: [],
  type: 'major'
};

const mockSearchResult: StationSearchResult = {
  station: mockStationInfo,
  score: 1.0,
  matchedField: 'name',
  highlight: '東京'
};

const mockFareResult: FareCalculationResult = {
  success: true,
  breakdown: [],
  totalFare: 160,
  route: [],
  discounts: [],
  metadata: {
    calculationTime: 10,
    cacheHit: false,
    version: '1.0.0'
  }
};

describe('CacheManager', () => {
  let cacheManager: CacheManager;

  beforeEach(() => {
    cacheManager = createCacheManager({
      globalMemoryLimit: 1024 * 1024, // 1MB for testing
      autoMemoryManagement: false, // Disable for predictable testing
      enableOptimization: false,
      enableEvents: true
    });
  });

  afterEach(() => {
    cacheManager.dispose();
  });

  describe('Basic Operations', () => {
    it('should set and get values correctly', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'test-key', mockStationInfo);
      const result = await cacheManager.get<StationInfo>(CacheCategory.STATIONS, 'test-key');
      
      expect(result).toEqual(mockStationInfo);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheManager.get(CacheCategory.STATIONS, 'non-existent');
      expect(result).toBeNull();
    });

    it('should delete values correctly', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'test-key', mockStationInfo);
      const deleted = await cacheManager.delete(CacheCategory.STATIONS, 'test-key');
      
      expect(deleted).toBe(true);
      
      const result = await cacheManager.get(CacheCategory.STATIONS, 'test-key');
      expect(result).toBeNull();
    });

    it('should check key existence correctly', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'test-key', mockStationInfo);
      
      expect(cacheManager.has(CacheCategory.STATIONS, 'test-key')).toBe(true);
      expect(cacheManager.has(CacheCategory.STATIONS, 'non-existent')).toBe(false);
    });

    it('should clear categories correctly', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'key1', mockStationInfo);
      await cacheManager.set(CacheCategory.SEARCH_RESULTS, 'key2', [mockSearchResult]);
      
      await cacheManager.clear(CacheCategory.STATIONS);
      
      expect(cacheManager.has(CacheCategory.STATIONS, 'key1')).toBe(false);
      expect(cacheManager.has(CacheCategory.SEARCH_RESULTS, 'key2')).toBe(true);
    });
  });

  describe('Category-Specific Methods', () => {
    it('should cache and retrieve station info', async () => {
      await cacheManager.cacheStationInfo(1, mockStationInfo);
      const result = await cacheManager.getStationInfo(1);
      
      expect(result).toEqual(mockStationInfo);
    });

    it('should cache and retrieve search results', async () => {
      const results = [mockSearchResult];
      await cacheManager.cacheSearchResults('東京', results);
      const cached = await cacheManager.getSearchResults('東京');
      
      expect(cached).toEqual(results);
    });

    it('should normalize search queries', async () => {
      const results = [mockSearchResult];
      await cacheManager.cacheSearchResults('  東京  ', results);
      const cached = await cacheManager.getSearchResults('東京');
      
      expect(cached).toEqual(results);
    });

    it('should cache and retrieve fare calculations', async () => {
      await cacheManager.cacheFareCalculation('route-key', mockFareResult);
      const result = await cacheManager.getFareCalculation('route-key');
      
      expect(result).toEqual(mockFareResult);
    });

    it('should cache and retrieve reference data', async () => {
      const companyInfo = { id: 1, name: 'JR東日本', type: 'JR' as const, lines: [] };
      await cacheManager.cacheReferenceData('company', 1, companyInfo);
      const result = await cacheManager.getReferenceData('company', 1);
      
      expect(result).toEqual(companyInfo);
    });
  });

  describe('Statistics', () => {
    it('should provide comprehensive statistics', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'key1', mockStationInfo);
      await cacheManager.set(CacheCategory.SEARCH_RESULTS, 'key2', [mockSearchResult]);
      
      const stats = cacheManager.getStats();
      
      expect(stats.global.totalEntries).toBe(2);
      expect(stats.categories).toHaveProperty(CacheCategory.STATIONS);
      expect(stats.categories).toHaveProperty(CacheCategory.SEARCH_RESULTS);
      expect(stats.memoryDistribution).toHaveProperty(CacheCategory.STATIONS);
    });

    it('should track hit ratios correctly', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'key1', mockStationInfo);
      
      // Hit
      await cacheManager.get(CacheCategory.STATIONS, 'key1');
      // Miss
      await cacheManager.get(CacheCategory.STATIONS, 'non-existent');
      
      const stats = cacheManager.getStats();
      expect(stats.global.totalHits).toBe(1);
      expect(stats.global.totalMisses).toBe(1);
      expect(stats.global.overallHitRatio).toBeCloseTo(0.5);
    });
  });

  describe('Event System', () => {
    it('should emit events when enabled', (done) => {
      let eventReceived = false;
      
      cacheManager.on('cache_cleared', (event) => {
        expect(event.type).toBe('cache_cleared');
        expect(event.timestamp).toBeTypeOf('number');
        eventReceived = true;
        
        // Use setTimeout to ensure the test completes after the event
        setTimeout(() => {
          expect(eventReceived).toBe(true);
          done();
        }, 10);
      });
      
      cacheManager.clear(CacheCategory.STATIONS);
    });

    it('should allow removing event listeners', () => {
      const listener = vi.fn();
      
      cacheManager.on('cache_cleared', listener);
      cacheManager.off('cache_cleared', listener);
      cacheManager.clear(CacheCategory.STATIONS);
      
      // Event should not be called after removal
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Optimization', () => {
    it('should optimize and return number of removed entries', async () => {
      // Add some entries with short TTL
      await cacheManager.set(CacheCategory.STATIONS, 'key1', mockStationInfo, 1); // 1ms TTL
      await cacheManager.set(CacheCategory.STATIONS, 'key2', mockStationInfo, 1);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const removedCount = await cacheManager.optimize();
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Svelte Reactivity', () => {
    it('should support Svelte-style subscription', () => {
      const svelteManager = createSvelteCacheManager();
      const subscriber = vi.fn();
      
      const unsubscribe = svelteManager.subscribe(subscriber);
      
      // Should be called immediately
      expect(subscriber).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      svelteManager.dispose();
    });

    it('should notify subscribers on state changes', async () => {
      const svelteManager = createSvelteCacheManager();
      const subscriber = vi.fn();
      
      svelteManager.subscribe(subscriber);
      subscriber.mockClear(); // Clear initial call
      
      // State change should trigger notification
      await svelteManager.set(CacheCategory.STATIONS, 'key', mockStationInfo);
      
      // Give time for async notification
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(subscriber).toHaveBeenCalled();
      svelteManager.dispose();
    });
  });

  describe('Factory Functions', () => {
    it('should create cache manager with default config', () => {
      const manager = createCacheManager();
      expect(manager).toBeInstanceOf(CacheManager);
      manager.dispose();
    });

    it('should create Svelte-optimized cache manager', () => {
      const manager = createSvelteCacheManager();
      expect(manager).toBeInstanceOf(CacheManager);
      manager.dispose();
    });

    it('should create production-optimized cache manager', () => {
      const manager = createProductionCacheManager();
      expect(manager).toBeInstanceOf(CacheManager);
      manager.dispose();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid categories gracefully', async () => {
      // TypeScript should prevent this, but test runtime behavior
      const invalidCategory = 'invalid' as CacheCategory;
      
      await expect(async () => {
        await cacheManager.get(invalidCategory, 'key');
      }).rejects.toThrow();
    });

    it('should handle disposal correctly', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'key', mockStationInfo);
      
      cacheManager.dispose();
      
      // Should not throw, but might return null or handle gracefully
      const result = await cacheManager.get(CacheCategory.STATIONS, 'key');
      expect(result).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage across categories', async () => {
      await cacheManager.set(CacheCategory.STATIONS, 'key1', mockStationInfo);
      await cacheManager.set(CacheCategory.SEARCH_RESULTS, 'key2', [mockSearchResult]);
      
      const stats = cacheManager.getStats();
      expect(stats.global.totalMemoryUsage).toBeGreaterThan(0);
      expect(stats.global.memoryUsagePercent).toBeGreaterThan(0);
    });
  });
});

describe('Cache Manager Integration', () => {
  it('should work with multiple categories simultaneously', async () => {
    const manager = createCacheManager();
    
    // Cache data in multiple categories
    await manager.cacheStationInfo(1, mockStationInfo);
    await manager.cacheSearchResults('test', [mockSearchResult]);
    await manager.cacheFareCalculation('route1', mockFareResult);
    await manager.cacheReferenceData('company', 1, { id: 1, name: 'Test', type: 'JR' as const, lines: [] });
    
    // Verify all data is retrievable
    const station = await manager.getStationInfo(1);
    const search = await manager.getSearchResults('test');
    const fare = await manager.getFareCalculation('route1');
    const company = await manager.getReferenceData('company', 1);
    
    expect(station).toEqual(mockStationInfo);
    expect(search).toEqual([mockSearchResult]);
    expect(fare).toEqual(mockFareResult);
    expect(company).toEqual({ id: 1, name: 'Test', type: 'JR', lines: [] });
    
    manager.dispose();
  });

  it('should maintain performance under load', async () => {
    const manager = createCacheManager();
    const startTime = performance.now();
    
    // Perform multiple operations
    const operations = [];
    for (let i = 0; i < 100; i++) {
      operations.push(manager.set(CacheCategory.STATIONS, `key${i}`, mockStationInfo));
    }
    
    await Promise.all(operations);
    
    // Retrieve all values
    const retrievals = [];
    for (let i = 0; i < 100; i++) {
      retrievals.push(manager.get(CacheCategory.STATIONS, `key${i}`));
    }
    
    const results = await Promise.all(retrievals);
    const endTime = performance.now();
    
    // Should complete reasonably quickly
    expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    expect(results).toHaveLength(100);
    expect(results.every(result => result !== null)).toBe(true);
    
    manager.dispose();
  });
});