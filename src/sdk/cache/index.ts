/**
 * Cache Module Export
 * 
 * Exports the LRU cache implementation, cache manager, and related utilities
 * for the Farert Frontend API Layer SDK.
 * 
 * @file Cache Module Exports
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// LRU Cache exports
export {
  LRUCache,
  CACHE_PRESETS,
  createStationInfoCache,
  createSearchResultsCache,
  createRouteCalculationsCache,
  createReferenceDataCache,
  createCustomCache
} from './lru-cache';

export type {
  CacheEntry,
  CacheStats,
  CacheConfig,
  CacheEvent,
  CacheEventType,
  CacheEventListener,
  MemoryEstimator
} from './lru-cache';

// Cache Manager exports
export {
  CacheManager,
  CacheCategory,
  createCacheManager,
  createSvelteCacheManager,
  createProductionCacheManager
} from './cache-manager';

export type {
  CacheManagerConfig,
  CacheManagerStats,
  CacheManagerEvent,
  CacheManagerEventType,
  CacheKeyOptions
} from './cache-manager';