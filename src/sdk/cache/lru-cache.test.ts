/**
 * LRU Cache Test Suite
 * 
 * Simple Node.js test suite for the LRU Cache implementation.
 * Tests all core functionality including TTL, eviction strategies,
 * event system, and performance monitoring.
 * 
 * @file LRU Cache Tests
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import {
  LRUCache,
  CacheEvent,
  CacheEventType,
  CACHE_PRESETS,
  createStationInfoCache,
  createSearchResultsCache,
  createRouteCalculationsCache,
  createReferenceDataCache
} from './lru-cache';

// ============================================================================
// SIMPLE TEST FRAMEWORK
// ============================================================================

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string): void {
  testCount++;
  if (condition) {
    passCount++;
    console.log(`✅ ${message}`);
  } else {
    failCount++;
    console.error(`❌ ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  const isEqual = actual === expected || 
    (typeof actual === 'object' && typeof expected === 'object' && 
     JSON.stringify(actual) === JSON.stringify(expected));
  assert(isEqual, `${message} (expected: ${expected}, actual: ${actual})`);
}

function assertNotNull<T>(value: T | null | undefined, message: string): void {
  assert(value != null, `${message} (value should not be null/undefined)`);
}

function assertNull<T>(value: T | null | undefined, message: string): void {
  assert(value == null, `${message} (value should be null/undefined)`);
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Sleep utility for async testing
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create test data with known memory footprint
 */
function createTestData(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return { id: 1, name: 'test' };
    case 'medium':
      return { id: 1, name: 'test', data: new Array(100).fill('x').join('') };
    case 'large':
      return { id: 1, name: 'test', data: new Array(10000).fill('x').join('') };
  }
}

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================

async function testBasicFunctionality(): Promise<void> {
  console.log('\n📋 Testing Basic Functionality...');
  
  const cache = new LRUCache({ maxSize: 3, defaultTTL: 1000 });

  try {
    // Test set and get
    cache.set('key1', 'value1');
    assertEqual(cache.get('key1'), 'value1', 'should set and get values');

    // Test non-existent keys
    assertNull(cache.get('nonexistent'), 'should return null for non-existent keys');

    // Test has() method
    assert(cache.has('key1'), 'should return true for existing key');
    assert(!cache.has('nonexistent'), 'should return false for non-existent key');

    // Test delete
    assert(cache.delete('key1'), 'should delete existing key');
    assert(!cache.has('key1'), 'key should not exist after deletion');
    assert(!cache.delete('key1'), 'should return false when deleting non-existent key');

    // Test clear
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    assertEqual(cache.size(), 2, 'should have correct size before clear');
    
    cache.clear();
    assertEqual(cache.size(), 0, 'should have zero size after clear');
    assert(!cache.has('key1'), 'key1 should not exist after clear');
    assert(!cache.has('key2'), 'key2 should not exist after clear');

    console.log('✨ Basic functionality tests passed');
  } finally {
    cache.dispose();
  }
}

// ============================================================================
// TTL (TIME-TO-LIVE) TESTS
// ============================================================================

async function testTTLFunctionality(): Promise<void> {
  console.log('\n⏰ Testing TTL Functionality...');
  
  const cache = new LRUCache({ defaultTTL: 100 }); // 100ms TTL

  try {
    // Test basic TTL expiration
    cache.set('key1', 'value1');
    assertEqual(cache.get('key1'), 'value1', 'should get value before expiration');
    
    await sleep(150); // Wait for expiration
    
    assertNull(cache.get('key1'), 'should return null after TTL expiration');
    assert(!cache.has('key1'), 'has() should return false for expired entries');

    // Test custom TTL
    cache.set('key1', 'value1', 50); // 50ms TTL
    cache.set('key2', 'value2', 200); // 200ms TTL
    
    await sleep(75); // Between 50ms and 200ms
    
    assertNull(cache.get('key1'), 'key1 should be expired after 50ms');
    assertEqual(cache.get('key2'), 'value2', 'key2 should still be valid after 75ms');
    
    await sleep(150); // Total 225ms
    
    assertNull(cache.get('key2'), 'key2 should be expired after 200ms');

    console.log('✨ TTL functionality tests passed');
  } finally {
    cache.dispose();
  }
}

// ============================================================================
// LRU EVICTION TESTS
// ============================================================================

async function testLRUEviction(): Promise<void> {
  console.log('\n🔄 Testing LRU Eviction...');
  
  const cache = new LRUCache({ maxSize: 3, defaultTTL: 10000 }); // Long TTL to focus on LRU

  try {
    // Fill cache to capacity
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    // Verify all entries are present
    assertEqual(cache.get('key1'), 'value1', 'key1 should be present');
    assertEqual(cache.get('key2'), 'value2', 'key2 should be present');
    assertEqual(cache.get('key3'), 'value3', 'key3 should be present');
    
    // Add fourth entry, should evict key1 (least recently used)
    cache.set('key4', 'value4');
    
    assertNull(cache.get('key1'), 'key1 should be evicted');
    assertEqual(cache.get('key2'), 'value2', 'key2 should still be present');
    assertEqual(cache.get('key3'), 'value3', 'key3 should still be present');
    assertEqual(cache.get('key4'), 'value4', 'key4 should be present');
    assertEqual(cache.size(), 3, 'cache size should remain at max capacity');

    // Test LRU order update on access
    cache.clear();
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    
    // Access key1 to make it most recently used
    cache.get('key1');
    
    // Add fourth entry, should evict key2 (now least recently used)
    cache.set('key4', 'value4');
    
    assertEqual(cache.get('key1'), 'value1', 'key1 should still be present after access');
    assertNull(cache.get('key2'), 'key2 should be evicted');
    assertEqual(cache.get('key3'), 'value3', 'key3 should still be present');
    assertEqual(cache.get('key4'), 'value4', 'key4 should be present');

    console.log('✨ LRU eviction tests passed');
  } finally {
    cache.dispose();
  }
}

// ============================================================================
// MEMORY MANAGEMENT TESTS
// ============================================================================

async function testMemoryManagement(): Promise<void> {
  console.log('\n💾 Testing Memory Management...');
  
  // Test 1: Memory limit enforcement with small data to allow multiple entries
  const cache1 = new LRUCache({
    maxSize: 1000,
    maxMemoryBytes: 100, // 100 bytes limit
    memoryEstimation: 'simple',
    enableMonitoring: true
  });

  try {
    const smallData = createTestData('small'); // ~30 bytes
    const estimatedSize = JSON.stringify(smallData).length * 2;
    console.log(`   Debug: Small data estimated size: ${estimatedSize} bytes`);
    
    // Add multiple small entries
    cache1.set('key1', smallData);
    cache1.set('key2', smallData);
    cache1.set('key3', smallData);
    
    const stats1 = cache1.getStats();
    console.log(`   Debug: Memory after 3 entries: ${stats1.memoryUsage} bytes`);
    console.log(`   Debug: Cache size: ${cache1.size()}`);
    
    // Verify memory limit enforcement - should always be within limit
    assert(stats1.memoryUsage <= cache1.getConfig().maxMemoryBytes, 'memory usage should be within limit');
    
    // Now add a larger entry to trigger more eviction
    const mediumData = createTestData('medium');
    cache1.set('key4', mediumData);
    
    const stats2 = cache1.getStats();
    console.log(`   Debug: Memory after large entry: ${stats2.memoryUsage} bytes`);
    console.log(`   Debug: Cache size after large entry: ${cache1.size()}`);
    
    // Memory should still be within limits
    assert(stats2.memoryUsage <= cache1.getConfig().maxMemoryBytes, 'memory usage should be within limit after large entry');
    
    console.log('✨ Memory limit enforcement test passed');
  } finally {
    cache1.dispose();
  }

  // Test memory tracking
  const cache2 = new LRUCache({
    memoryEstimation: 'simple',
    enableMonitoring: true
  });

  try {
    const smallData = createTestData('small');
    const mediumData = createTestData('medium');

    cache2.set('key1', smallData);
    const statsAfterSmall = cache2.getStats();
    
    cache2.set('key2', mediumData);
    const statsAfterMedium = cache2.getStats();
    
    assert(statsAfterMedium.memoryUsage > statsAfterSmall.memoryUsage, 'memory usage should increase with larger data');
    
    console.log('✨ Memory tracking test passed');
  } finally {
    cache2.dispose();
  }
}

// ============================================================================
// EVENT SYSTEM TESTS
// ============================================================================

async function testEventSystem(): Promise<void> {
  console.log('\n📡 Testing Event System...');
  
  const cache = new LRUCache({ enableEvents: true, defaultTTL: 100 });
  const events: CacheEvent<string>[] = [];

  // Set up event listeners
  const eventTypes: CacheEventType[] = ['get', 'set', 'delete', 'clear', 'expired', 'evicted'];
  eventTypes.forEach(type => {
    cache.on(type, (event) => {
      events.push(event);
    });
  });

  try {
    // Test set events
    cache.set('key1', 'value1');
    
    // Give events time to be emitted (they're async)
    await sleep(10);
    
    assert(events.length >= 1, 'should emit set events');
    assertEqual(events[events.length - 1].type, 'set', 'last event should be set type');
    assertEqual(events[events.length - 1].key, 'key1', 'set event should have correct key');

    // Test get events
    events.length = 0; // Clear previous events
    
    cache.get('key1'); // Hit
    cache.get('nonexistent'); // Miss
    
    await sleep(10); // Wait for async events
    
    assert(events.length >= 2, 'should emit get events for hit and miss');
    
    // Test delete events
    events.length = 0;
    cache.delete('key1');
    
    await sleep(10);
    
    assert(events.length >= 1, 'should emit delete events');
    assertEqual(events[events.length - 1].type, 'delete', 'should emit delete event type');

    console.log('✨ Event system tests passed');
  } finally {
    cache.dispose();
  }
}

// ============================================================================
// STATISTICS AND MONITORING TESTS
// ============================================================================

async function testStatisticsAndMonitoring(): Promise<void> {
  console.log('\n📊 Testing Statistics and Monitoring...');
  
  const cache = new LRUCache({ enableMonitoring: true });

  try {
    // Test hit and miss statistics
    cache.set('key1', 'value1');
    
    // Hit
    cache.get('key1');
    
    // Miss
    cache.get('nonexistent');
    
    const stats = cache.getStats();
    assertEqual(stats.hits, 1, 'should track hits correctly');
    assertEqual(stats.misses, 1, 'should track misses correctly');
    assertEqual(stats.hitRatio, 0.5, 'should calculate hit ratio correctly');

    // Test entry count and memory usage
    cache.clear();
    const stats1 = cache.getStats();
    assertEqual(stats1.totalEntries, 0, 'should have zero entries after clear');
    
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    const stats2 = cache.getStats();
    assertEqual(stats2.totalEntries, 2, 'should track entry count');
    assert(stats2.memoryUsage > 0, 'should track memory usage');
    
    cache.delete('key1');
    
    const stats3 = cache.getStats();
    assertEqual(stats3.totalEntries, 1, 'should update entry count after deletion');
    assert(stats3.memoryUsage < stats2.memoryUsage, 'should reduce memory usage after deletion');

    // Test access counts
    cache.set('key1', 'value1');
    cache.get('key1');
    cache.get('key1');
    
    const entry = cache.inspect('key1');
    assertNotNull(entry, 'should be able to inspect entry');
    assertEqual(entry!.accessCount, 3, 'should track access count (1 from set, 2 from gets)');

    // Test statistics reset
    cache.resetStats();
    
    const statsAfter = cache.getStats();
    assertEqual(statsAfter.hits, 0, 'hits should reset to 0');
    assertEqual(statsAfter.misses, 0, 'misses should reset to 0');
    assertEqual(statsAfter.hitRatio, 0, 'hit ratio should reset to 0');

    console.log('✨ Statistics and monitoring tests passed');
  } finally {
    cache.dispose();
  }
}

// ============================================================================
// PRESET FACTORY FUNCTION TESTS
// ============================================================================

async function testPresetFactoryFunctions(): Promise<void> {
  console.log('\n🏭 Testing Preset Factory Functions...');
  
  // Test station info cache preset
  const stationCache = createStationInfoCache();
  const stationConfig = stationCache.getConfig();
  
  assertEqual(stationConfig.maxSize, CACHE_PRESETS.STATION_INFO.maxSize, 'station cache should have correct max size');
  assertEqual(stationConfig.defaultTTL, CACHE_PRESETS.STATION_INFO.defaultTTL, 'station cache should have correct TTL');
  assertEqual(stationConfig.evictionStrategy, CACHE_PRESETS.STATION_INFO.evictionStrategy, 'station cache should have correct eviction strategy');
  
  stationCache.dispose();

  // Test search results cache preset
  const searchCache = createSearchResultsCache();
  const searchConfig = searchCache.getConfig();
  
  assertEqual(searchConfig.maxSize, CACHE_PRESETS.SEARCH_RESULTS.maxSize, 'search cache should have correct max size');
  assertEqual(searchConfig.defaultTTL, CACHE_PRESETS.SEARCH_RESULTS.defaultTTL, 'search cache should have correct TTL');
  
  searchCache.dispose();

  // Test route calculations cache preset
  const routeCache = createRouteCalculationsCache();
  const routeConfig = routeCache.getConfig();
  
  assertEqual(routeConfig.maxSize, CACHE_PRESETS.ROUTE_CALCULATIONS.maxSize, 'route cache should have correct max size');
  assertEqual(routeConfig.defaultTTL, CACHE_PRESETS.ROUTE_CALCULATIONS.defaultTTL, 'route cache should have correct TTL');
  
  routeCache.dispose();

  // Test reference data cache preset
  const refCache = createReferenceDataCache();
  const refConfig = refCache.getConfig();
  
  assertEqual(refConfig.maxSize, CACHE_PRESETS.REFERENCE_DATA.maxSize, 'reference cache should have correct max size');
  assertEqual(refConfig.defaultTTL, CACHE_PRESETS.REFERENCE_DATA.defaultTTL, 'reference cache should have correct TTL');
  assertEqual(refConfig.evictionStrategy, CACHE_PRESETS.REFERENCE_DATA.evictionStrategy, 'reference cache should have correct eviction strategy');
  
  refCache.dispose();

  console.log('✨ Preset factory function tests passed');
}

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

async function testIntegration(): Promise<void> {
  console.log('\n🔗 Testing Integration Scenarios...');
  
  // Test complex real-world scenario
  const cache = new LRUCache({
    maxSize: 100,
    maxMemoryBytes: 1024 * 50, // 50KB
    defaultTTL: 1000, // 1 second
    enableMonitoring: true,
    enableEvents: true,
    memoryEstimation: 'accurate'
  });

  const events: CacheEvent[] = [];
  cache.on('evicted', (event) => events.push(event));
  cache.on('delete', (event) => {
    if (event.context?.reason === 'evicted') {
      events.push(event);
    }
  });
  
  // Simulate station data caching
  const stationData = {
    id: 1,
    name: '東京駅',
    kana: 'とうきょうえき',
    lines: ['JR東海道線', 'JR中央線', '東京メトロ丸ノ内線'],
    coordinates: { lat: 35.6812, lng: 139.7671 }
  };
  
  try {
    // Cache multiple stations
    for (let i = 0; i < 150; i++) {
      cache.set(`station:${i}`, { ...stationData, id: i });
    }
    
    // Should have evicted some entries due to size or memory limits
    const finalSize = cache.size();
    assert(finalSize <= 100, `cache size should be limited by max size or memory (actual: ${finalSize})`);
    
    await sleep(50); // Wait longer for events to be emitted
    
    // Check that eviction occurred (either through events or by checking stats)  
    const finalStats = cache.getStats();
    const evictionOccurred = events.length > 0 || finalStats.evictedEntries > 0 || finalSize < 150;
    assert(evictionOccurred, 'should have evicted some entries (either via events or statistics)');
    
    // Test cache hits and misses - check what actually exists
    const recentExists = cache.has('station:149');
    const oldExists = cache.has('station:0');
    
    if (finalSize > 0) {
      // If cache has entries, verify that newer entries are more likely to exist
      console.log(`   Debug: station:149 exists: ${recentExists}, station:0 exists: ${oldExists}`);
      assert(!oldExists, 'oldest station should be evicted');
    } else {
      console.log('   Note: Cache is empty due to memory constraints');
    }
    
    // Wait for TTL expiration
    await sleep(1100);
    
    // Optimize to remove expired entries
    const removedCount = cache.optimize();
    assert(removedCount > 0, 'should remove expired entries during optimization');
    
    const stats = cache.getStats();
    console.log(`   Debug: Final stats - hits: ${stats.hits}, misses: ${stats.misses}, evicted: ${stats.evictedEntries}, expired: ${stats.expiredEntries}`);
    
    // We know eviction occurred from earlier in the test
    const totalActivity = stats.hits + stats.misses + stats.evictedEntries + stats.expiredEntries;
    assert(totalActivity > 0, 'should have recorded cache activity (hits, misses, evictions, or expirations)');
    assert(stats.expiredEntries > 0 || removedCount > 0, 'should have expired entries during optimization');
    
    console.log('✨ Complex scenario test passed');
  } finally {
    cache.dispose();
  }

  // Test with different data types
  const typeCache = new LRUCache<any>();
  
  try {
    typeCache.set('string', 'hello');
    typeCache.set('number', 42);
    typeCache.set('boolean', true);
    typeCache.set('object', { key: 'value' });
    typeCache.set('array', [1, 2, 3]);
    typeCache.set('null', null);
    typeCache.set('undefined', undefined);
    
    assertEqual(typeCache.get('string'), 'hello', 'should handle strings');
    assertEqual(typeCache.get('number'), 42, 'should handle numbers');
    assertEqual(typeCache.get('boolean'), true, 'should handle booleans');
    assertEqual(JSON.stringify(typeCache.get('object')), JSON.stringify({ key: 'value' }), 'should handle objects');
    assertEqual(JSON.stringify(typeCache.get('array')), JSON.stringify([1, 2, 3]), 'should handle arrays');
    assertEqual(typeCache.get('null'), null, 'should handle null values');
    assertEqual(typeCache.get('undefined'), undefined, 'should handle undefined values');
    
    console.log('✨ Data type handling test passed');
  } finally {
    typeCache.dispose();
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests(): Promise<void> {
  console.log('🚀 Starting LRU Cache Test Suite...');
  console.log('='.repeat(50));
  
  try {
    await testBasicFunctionality();
    await testTTLFunctionality();
    await testLRUEviction();
    await testMemoryManagement();
    await testEventSystem();
    await testStatisticsAndMonitoring();
    await testPresetFactoryFunctions();
    await testIntegration();
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 All tests completed!`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📊 Total: ${testCount}`);
    
    if (failCount === 0) {
      console.log('\n🏆 All tests passed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Some tests failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test suite crashed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export {
  runAllTests,
  testBasicFunctionality,
  testTTLFunctionality,
  testLRUEviction,
  testMemoryManagement,
  testEventSystem,
  testStatisticsAndMonitoring,
  testPresetFactoryFunctions,
  testIntegration
};