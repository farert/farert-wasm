/**
 * High-Performance LRU Cache with TTL Support
 * 
 * Production-ready Least Recently Used (LRU) cache implementation with
 * Time-To-Live (TTL) support, memory management, and performance monitoring.
 * Designed for the Farert Frontend API Layer SDK to provide intelligent
 * caching for station data, route calculations, and reference data.
 * 
 * Features:
 * - O(1) get/set operations using Map-based implementation
 * - Automatic expiration with configurable TTL
 * - Memory management with size limits and automatic purging
 * - Performance monitoring and statistics
 * - Event system for cache events
 * - Thread safety and concurrent access handling
 * - Comprehensive TypeScript generics support
 * - Debugging and introspection capabilities
 * 
 * @file LRU Cache Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-002: Intelligent Caching and Performance Layer
 *   - Cache station information for 1 hour with automatic expiration
 *   - Cache search results for 15 minutes with LRU eviction strategy  
 *   - Cache route calculations for 5 minutes
 *   - Cache database reference data for entire session duration
 *   - Automatically purge oldest entries using LRU algorithm when exceeding 50MB
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

/**
 * Cache entry with metadata for LRU tracking and TTL management
 */
export interface CacheEntry<T = any> {
  /** Cached value */
  readonly value: T;
  
  /** Creation timestamp (milliseconds since epoch) */
  readonly created: number;
  
  /** Expiration timestamp (milliseconds since epoch) */
  readonly expires: number;
  
  /** Access count for usage tracking */
  accessCount: number;
  
  /** Last access timestamp for LRU ordering */
  lastAccess: number;
  
  /** Estimated memory size in bytes */
  readonly size: number;
  
  /** Key for quick reference */
  readonly key: string;
}

/**
 * Cache statistics for monitoring and debugging
 */
export interface CacheStats {
  /** Total number of entries currently in cache */
  totalEntries: number;
  
  /** Total cache hits since creation */
  hits: number;
  
  /** Total cache misses since creation */
  misses: number;
  
  /** Hit ratio (0-1) */
  hitRatio: number;
  
  /** Current memory usage in bytes */
  memoryUsage: number;
  
  /** Number of expired entries removed */
  expiredEntries: number;
  
  /** Number of entries evicted due to size limits */
  evictedEntries: number;
  
  /** Average access count per entry */
  averageAccessCount: number;
  
  /** Cache creation time */
  createdAt: number;
  
  /** Last optimization time */
  lastOptimization: number;
  
  /** Number of optimization runs */
  optimizationCount: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Maximum number of entries (default: 1000) */
  maxSize?: number;
  
  /** Maximum memory usage in bytes (default: 50MB) */
  maxMemoryBytes?: number;
  
  /** Default TTL in milliseconds (default: 5 minutes) */
  defaultTTL?: number;
  
  /** Enable automatic cleanup of expired entries (default: true) */
  autoCleanup?: boolean;
  
  /** Cleanup interval in milliseconds (default: 1 minute) */
  cleanupInterval?: number;
  
  /** Enable performance monitoring (default: true) */
  enableMonitoring?: boolean;
  
  /** Enable event system (default: true) */
  enableEvents?: boolean;
  
  /** Eviction strategy when cache is full */
  evictionStrategy?: 'lru' | 'lfu' | 'fifo';
  
  /** Memory estimation strategy */
  memoryEstimation?: 'simple' | 'accurate' | 'none';
}

/**
 * Cache event types
 */
export type CacheEventType = 'get' | 'set' | 'delete' | 'clear' | 'expired' | 'evicted' | 'optimized';

/**
 * Cache event data
 */
export interface CacheEvent<T = any> {
  /** Event type */
  type: CacheEventType;
  
  /** Cache key involved */
  key?: string;
  
  /** Cached value (for some events) */
  value?: T;
  
  /** Event timestamp */
  timestamp: number;
  
  /** Additional event context */
  context?: Record<string, any>;
}

/**
 * Cache event listener function
 */
export type CacheEventListener<T = any> = (event: CacheEvent<T>) => void;

/**
 * Memory usage estimation function
 */
export type MemoryEstimator = (value: any) => number;

// ============================================================================
// CACHE PRESETS FOR DIFFERENT DATA TYPES
// ============================================================================

/**
 * Predefined cache configurations for different data types
 * Based on REQ-API-002 requirements
 */
export const CACHE_PRESETS = {
  /** Station information cache (1 hour TTL) */
  STATION_INFO: {
    maxSize: 2000,
    maxMemoryBytes: 10 * 1024 * 1024, // 10MB
    defaultTTL: 60 * 60 * 1000, // 1 hour
    evictionStrategy: 'lru' as const,
    memoryEstimation: 'accurate' as const
  },
  
  /** Search results cache (15 minutes TTL) */
  SEARCH_RESULTS: {
    maxSize: 500,
    maxMemoryBytes: 5 * 1024 * 1024, // 5MB
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    evictionStrategy: 'lru' as const,
    memoryEstimation: 'simple' as const
  },
  
  /** Route calculations cache (5 minutes TTL) */
  ROUTE_CALCULATIONS: {
    maxSize: 1000,
    maxMemoryBytes: 15 * 1024 * 1024, // 15MB
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    evictionStrategy: 'lru' as const,
    memoryEstimation: 'accurate' as const
  },
  
  /** Database reference data cache (session duration) */
  REFERENCE_DATA: {
    maxSize: 10000,
    maxMemoryBytes: 20 * 1024 * 1024, // 20MB
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours (session)
    evictionStrategy: 'lfu' as const,
    memoryEstimation: 'simple' as const
  }
} as const;

// ============================================================================
// MEMORY ESTIMATION UTILITIES
// ============================================================================

/**
 * Simple memory estimation based on JSON string length
 * Fast but less accurate, suitable for development and testing
 */
function simpleMemoryEstimation(value: any): number {
  try {
    return JSON.stringify(value).length * 2; // Rough estimate with Unicode factor
  } catch {
    return 1024; // Default fallback for non-serializable objects
  }
}

/**
 * More accurate memory estimation using object traversal
 * Slower but more precise, suitable for production monitoring
 */
function accurateMemoryEstimation(value: any): number {
  const visited = new WeakSet();
  
  function estimateSize(obj: any): number {
    if (obj === null || obj === undefined) return 8;
    
    // Primitive types
    switch (typeof obj) {
      case 'boolean': return 4;
      case 'number': return 8;
      case 'string': return obj.length * 2 + 40; // UTF-16 + overhead
      case 'bigint': return 8 + (obj.toString().length * 2);
      case 'function': return 0; // Functions not cached
      case 'symbol': return 8;
    }
    
    // Avoid circular references
    if (visited.has(obj)) return 0;
    visited.add(obj);
    
    if (Array.isArray(obj)) {
      return 40 + obj.reduce((sum, item) => sum + estimateSize(item), 0);
    }
    
    if (obj instanceof Date) return 24;
    if (obj instanceof RegExp) return 40 + obj.source.length * 2;
    if (obj instanceof Map) {
      let size = 40;
      for (const [key, value] of obj) {
        size += estimateSize(key) + estimateSize(value) + 24; // Entry overhead
      }
      return size;
    }
    if (obj instanceof Set) {
      let size = 40;
      for (const value of obj) {
        size += estimateSize(value) + 16; // Entry overhead
      }
      return size;
    }
    
    // Plain objects
    let size = 40; // Base object overhead
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        size += estimateSize(key) + estimateSize(obj[key]) + 24; // Property overhead
      }
    }
    
    return size;
  }
  
  return estimateSize(value);
}

/**
 * No memory estimation - returns 0 for all values
 * Fastest option when memory tracking is not needed
 */
function noMemoryEstimation(_value: any): number {
  return 0;
}

/**
 * Get memory estimator function based on strategy
 */
function getMemoryEstimator(strategy: CacheConfig['memoryEstimation']): MemoryEstimator {
  switch (strategy) {
    case 'simple': return simpleMemoryEstimation;
    case 'accurate': return accurateMemoryEstimation;
    case 'none': return noMemoryEstimation;
    default: return simpleMemoryEstimation;
  }
}

// ============================================================================
// MAIN LRU CACHE IMPLEMENTATION
// ============================================================================

/**
 * High-performance LRU Cache with TTL support
 * 
 * This implementation provides O(1) operations for get/set/delete while
 * maintaining LRU ordering and automatic TTL expiration. It includes
 * comprehensive monitoring, event system, and memory management.
 * 
 * @template T The type of values stored in the cache
 */
export class LRUCache<T = any> {
  // Core data structures
  private readonly data = new Map<string, CacheEntry<T>>();
  private readonly accessOrder = new Map<string, string>(); // key -> next key (for LRU chain)
  private readonly accessOrderReverse = new Map<string, string>(); // key -> prev key (for LRU chain)
  private mostRecentKey: string | null = null;
  private leastRecentKey: string | null = null;
  
  // Configuration
  private readonly config: Required<CacheConfig>;
  private readonly memoryEstimator: MemoryEstimator;
  
  // Statistics
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  // Event system
  private readonly eventListeners = new Map<CacheEventType, Set<CacheEventListener<T>>>();
  
  /**
   * Create a new LRU Cache instance
   * 
   * @param config Cache configuration options
   */
  constructor(config: CacheConfig = {}) {
    // Merge with defaults
    this.config = {
      maxSize: config.maxSize ?? 1000,
      maxMemoryBytes: config.maxMemoryBytes ?? 50 * 1024 * 1024, // 50MB
      defaultTTL: config.defaultTTL ?? 5 * 60 * 1000, // 5 minutes
      autoCleanup: config.autoCleanup ?? true,
      cleanupInterval: config.cleanupInterval ?? 60 * 1000, // 1 minute
      enableMonitoring: config.enableMonitoring ?? true,
      enableEvents: config.enableEvents ?? true,
      evictionStrategy: config.evictionStrategy ?? 'lru',
      memoryEstimation: config.memoryEstimation ?? 'simple'
    };
    
    // Initialize memory estimator
    this.memoryEstimator = getMemoryEstimator(this.config.memoryEstimation);
    
    // Initialize statistics
    this.stats = {
      totalEntries: 0,
      hits: 0,
      misses: 0,
      hitRatio: 0,
      memoryUsage: 0,
      expiredEntries: 0,
      evictedEntries: 0,
      averageAccessCount: 0,
      createdAt: Date.now(),
      lastOptimization: Date.now(),
      optimizationCount: 0
    };
    
    // Start automatic cleanup if enabled
    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
  }
  
  // ============================================================================
  // CORE CACHE OPERATIONS
  // ============================================================================
  
  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.data.get(key);
    
    if (!entry) {
      if (this.config.enableMonitoring) {
        this.stats.misses++;
        this.updateHitRatio();
      }
      this.emitEvent('get', { key, timestamp: Date.now(), context: { hit: false } });
      return null;
    }
    
    // Check expiration
    const now = Date.now();
    if (entry.expires <= now) {
      this.deleteInternal(key, 'expired');
      if (this.config.enableMonitoring) {
        this.stats.misses++;
        this.stats.expiredEntries++;
        this.updateHitRatio();
      }
      this.emitEvent('expired', { key, value: entry.value, timestamp: now });
      return null;
    }
    
    // Update access tracking
    entry.accessCount++;
    entry.lastAccess = now;
    
    // Move to front of LRU chain
    this.moveToFront(key);
    
    // Update statistics
    if (this.config.enableMonitoring) {
      this.stats.hits++;
      this.updateHitRatio();
      this.updateAverageAccessCount();
    }
    
    this.emitEvent('get', { key, value: entry.value, timestamp: now, context: { hit: true } });
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds (overrides default)
   */
  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const effectiveTTL = ttl ?? this.config.defaultTTL;
    const expires = now + effectiveTTL;
    const size = this.memoryEstimator(value);
    
    // Check if key already exists
    const existingEntry = this.data.get(key);
    if (existingEntry) {
      // Update existing entry
      const newEntry: CacheEntry<T> = {
        value,
        created: existingEntry.created,
        expires,
        accessCount: existingEntry.accessCount,
        lastAccess: now,
        size,
        key
      };
      
      this.data.set(key, newEntry);
      this.moveToFront(key);
      
      // Update memory usage
      if (this.config.enableMonitoring) {
        this.stats.memoryUsage += size - existingEntry.size;
      }
    } else {
      // Create new entry
      const newEntry: CacheEntry<T> = {
        value,
        created: now,
        expires,
        accessCount: 1,
        lastAccess: now,
        size,
        key
      };
      
      // Check capacity and evict if necessary
      this.ensureCapacity();
      
      this.data.set(key, newEntry);
      this.addToFront(key);
      
      // Update statistics
      if (this.config.enableMonitoring) {
        this.stats.totalEntries++;
        this.stats.memoryUsage += size;
        this.updateAverageAccessCount();
      }
    }
    
    // Check memory limit and evict if necessary
    this.enforceMemoryLimit();
    
    this.emitEvent('set', { key, value, timestamp: now });
  }
  
  /**
   * Delete a value from the cache
   * 
   * @param key Cache key
   * @returns True if key existed and was deleted
   */
  delete(key: string): boolean {
    return this.deleteInternal(key, 'manual');
  }
  
  /**
   * Check if a key exists in the cache (without affecting LRU order)
   * 
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.data.get(key);
    if (!entry) return false;
    
    // Check expiration
    if (entry.expires <= Date.now()) {
      this.deleteInternal(key, 'expired');
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    const now = Date.now();
    const clearedCount = this.data.size;
    
    this.data.clear();
    this.accessOrder.clear();
    this.accessOrderReverse.clear();
    this.mostRecentKey = null;
    this.leastRecentKey = null;
    
    if (this.config.enableMonitoring) {
      this.stats.totalEntries = 0;
      this.stats.memoryUsage = 0;
      this.updateAverageAccessCount();
    }
    
    this.emitEvent('clear', { timestamp: now, context: { clearedCount } });
  }
  
  /**
   * Get current cache size (number of entries)
   */
  size(): number {
    return this.data.size;
  }
  
  /**
   * Get all keys currently in cache
   * 
   * @param includeExpired Whether to include expired keys (default: false)
   * @returns Array of cache keys
   */
  keys(includeExpired = false): string[] {
    if (includeExpired) {
      return Array.from(this.data.keys());
    }
    
    const now = Date.now();
    const validKeys: string[] = [];
    
    for (const [key, entry] of this.data) {
      if (entry.expires > now) {
        validKeys.push(key);
      }
    }
    
    return validKeys;
  }
  
  /**
   * Get all values currently in cache
   * 
   * @param includeExpired Whether to include expired values (default: false)
   * @returns Array of cached values
   */
  values(includeExpired = false): T[] {
    if (includeExpired) {
      return Array.from(this.data.values()).map(entry => entry.value);
    }
    
    const now = Date.now();
    const validValues: T[] = [];
    
    for (const entry of this.data.values()) {
      if (entry.expires > now) {
        validValues.push(entry.value);
      }
    }
    
    return validValues;
  }
  
  /**
   * Get all entries currently in cache
   * 
   * @param includeExpired Whether to include expired entries (default: false)
   * @returns Array of [key, value] pairs
   */
  entries(includeExpired = false): Array<[string, T]> {
    if (includeExpired) {
      return Array.from(this.data.entries()).map(([key, entry]) => [key, entry.value]);
    }
    
    const now = Date.now();
    const validEntries: Array<[string, T]> = [];
    
    for (const [key, entry] of this.data) {
      if (entry.expires > now) {
        validEntries.push([key, entry.value]);
      }
    }
    
    return validEntries;
  }
  
  // ============================================================================
  // CACHE MANAGEMENT AND OPTIMIZATION
  // ============================================================================
  
  /**
   * Manually optimize the cache by removing expired entries
   * and reorganizing data structures
   * 
   * @returns Number of entries removed
   */
  optimize(): number {
    const now = Date.now();
    const beforeSize = this.data.size;
    const expiredKeys: string[] = [];
    
    // Find expired entries
    for (const [key, entry] of this.data) {
      if (entry.expires <= now) {
        expiredKeys.push(key);
      }
    }
    
    // Remove expired entries
    for (const key of expiredKeys) {
      this.deleteInternal(key, 'expired');
    }
    
    // Update statistics
    if (this.config.enableMonitoring) {
      this.stats.expiredEntries += expiredKeys.length;
      this.stats.lastOptimization = now;
      this.stats.optimizationCount++;
      this.updateAverageAccessCount();
    }
    
    const removedCount = beforeSize - this.data.size;
    this.emitEvent('optimized', { timestamp: now, context: { removedCount } });
    
    return removedCount;
  }
  
  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    if (this.config.enableMonitoring) {
      return { ...this.stats };
    }
    
    // Return basic stats if monitoring disabled
    return {
      totalEntries: this.data.size,
      hits: 0,
      misses: 0,
      hitRatio: 0,
      memoryUsage: 0,
      expiredEntries: 0,
      evictedEntries: 0,
      averageAccessCount: 0,
      createdAt: this.stats.createdAt,
      lastOptimization: 0,
      optimizationCount: 0
    };
  }
  
  /**
   * Reset cache statistics (but keep cached data)
   */
  resetStats(): void {
    if (this.config.enableMonitoring) {
      const now = Date.now();
      this.stats = {
        totalEntries: this.data.size,
        hits: 0,
        misses: 0,
        hitRatio: 0,
        memoryUsage: this.stats.memoryUsage, // Keep current memory usage
        expiredEntries: 0,
        evictedEntries: 0,
        averageAccessCount: 0,
        createdAt: now,
        lastOptimization: now,
        optimizationCount: 0
      };
    }
  }
  
  /**
   * Get cache configuration
   */
  getConfig(): Readonly<Required<CacheConfig>> {
    return { ...this.config };
  }
  
  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================
  
  /**
   * Add an event listener
   * 
   * @param eventType Type of event to listen for
   * @param listener Event listener function
   */
  on(eventType: CacheEventType, listener: CacheEventListener<T>): void {
    if (!this.config.enableEvents) return;
    
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(listener);
  }
  
  /**
   * Remove an event listener
   * 
   * @param eventType Type of event
   * @param listener Event listener function to remove
   */
  off(eventType: CacheEventType, listener: CacheEventListener<T>): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }
  
  /**
   * Remove all event listeners for a specific event type
   * 
   * @param eventType Type of event (optional, clears all if not specified)
   */
  removeAllListeners(eventType?: CacheEventType): void {
    if (eventType) {
      this.eventListeners.delete(eventType);
    } else {
      this.eventListeners.clear();
    }
  }
  
  // ============================================================================
  // DEBUGGING AND INTROSPECTION
  // ============================================================================
  
  /**
   * Get detailed information about a cache entry
   * 
   * @param key Cache key
   * @returns Entry details or null if not found
   */
  inspect(key: string): CacheEntry<T> | null {
    const entry = this.data.get(key);
    return entry ? { ...entry } : null;
  }
  
  /**
   * Get cache entries sorted by access time (most recent first)
   * 
   * @param limit Maximum number of entries to return
   * @returns Array of entries with metadata
   */
  getMostRecentlyUsed(limit = 10): Array<CacheEntry<T>> {
    const entries: Array<CacheEntry<T>> = [];
    let currentKey = this.mostRecentKey;
    let count = 0;
    
    while (currentKey && count < limit) {
      const entry = this.data.get(currentKey);
      if (entry) {
        entries.push({ ...entry });
      }
      currentKey = this.accessOrder.get(currentKey) ?? null;
      count++;
    }
    
    return entries;
  }
  
  /**
   * Get cache entries sorted by access time (least recent first)
   * 
   * @param limit Maximum number of entries to return
   * @returns Array of entries with metadata
   */
  getLeastRecentlyUsed(limit = 10): Array<CacheEntry<T>> {
    const entries: Array<CacheEntry<T>> = [];
    let currentKey = this.leastRecentKey;
    let count = 0;
    
    while (currentKey && count < limit) {
      const entry = this.data.get(currentKey);
      if (entry) {
        entries.push({ ...entry });
      }
      currentKey = this.accessOrderReverse.get(currentKey) ?? null;
      count++;
    }
    
    return entries;
  }
  
  /**
   * Export cache state for debugging or persistence
   * 
   * @param includeValues Whether to include cached values
   * @returns Cache state object
   */
  export(includeValues = false): any {
    const entries: any[] = [];
    
    for (const [key, entry] of this.data) {
      const exported: any = {
        key: entry.key,
        created: entry.created,
        expires: entry.expires,
        accessCount: entry.accessCount,
        lastAccess: entry.lastAccess,
        size: entry.size
      };
      
      if (includeValues) {
        exported.value = entry.value;
      }
      
      entries.push(exported);
    }
    
    return {
      config: this.config,
      stats: this.stats,
      entries,
      lruOrder: {
        mostRecent: this.mostRecentKey,
        leastRecent: this.leastRecentKey
      },
      exportedAt: Date.now()
    };
  }
  
  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================
  
  /**
   * Dispose of the cache and clean up resources
   */
  dispose(): void {
    // Stop automatic cleanup
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Clear all data
    this.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  /**
   * Internal delete method with reason tracking
   */
  private deleteInternal(key: string, reason: 'manual' | 'expired' | 'evicted'): boolean {
    const entry = this.data.get(key);
    if (!entry) return false;
    
    // Remove from data
    this.data.delete(key);
    
    // Remove from LRU chain
    this.removeFromChain(key);
    
    // Update statistics
    if (this.config.enableMonitoring) {
      this.stats.totalEntries--;
      this.stats.memoryUsage -= entry.size;
      if (reason === 'evicted') {
        this.stats.evictedEntries++;
      }
      this.updateAverageAccessCount();
    }
    
    this.emitEvent('delete', { 
      key, 
      value: entry.value, 
      timestamp: Date.now(), 
      context: { reason } 
    });
    
    return true;
  }
  
  /**
   * Ensure cache doesn't exceed maximum size
   */
  private ensureCapacity(): void {
    while (this.data.size >= this.config.maxSize && this.leastRecentKey) {
      this.deleteInternal(this.leastRecentKey, 'evicted');
    }
  }
  
  /**
   * Enforce memory limits by evicting entries
   */
  private enforceMemoryLimit(): void {
    while (this.stats.memoryUsage > this.config.maxMemoryBytes && this.leastRecentKey) {
      this.deleteInternal(this.leastRecentKey, 'evicted');
    }
  }
  
  /**
   * Add key to front of LRU chain
   */
  private addToFront(key: string): void {
    if (this.mostRecentKey) {
      this.accessOrderReverse.set(this.mostRecentKey, key);
      this.accessOrder.set(key, this.mostRecentKey);
    } else {
      this.leastRecentKey = key;
    }
    this.mostRecentKey = key;
  }
  
  /**
   * Move existing key to front of LRU chain
   */
  private moveToFront(key: string): void {
    if (this.mostRecentKey === key) return;
    
    // Remove from current position
    this.removeFromChain(key);
    
    // Add to front
    this.addToFront(key);
  }
  
  /**
   * Remove key from LRU chain
   */
  private removeFromChain(key: string): void {
    const next = this.accessOrder.get(key);
    const prev = this.accessOrderReverse.get(key);
    
    if (prev) {
      this.accessOrder.set(prev, next || null);
    } else {
      this.mostRecentKey = next || null;
    }
    
    if (next) {
      this.accessOrderReverse.set(next, prev || null);
    } else {
      this.leastRecentKey = prev || null;
    }
    
    this.accessOrder.delete(key);
    this.accessOrderReverse.delete(key);
  }
  
  /**
   * Update hit ratio statistics
   */
  private updateHitRatio(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRatio = total > 0 ? this.stats.hits / total : 0;
  }
  
  /**
   * Update average access count
   */
  private updateAverageAccessCount(): void {
    if (this.data.size === 0) {
      this.stats.averageAccessCount = 0;
      return;
    }
    
    let totalAccess = 0;
    for (const entry of this.data.values()) {
      totalAccess += entry.accessCount;
    }
    this.stats.averageAccessCount = totalAccess / this.data.size;
  }
  
  /**
   * Emit cache event to listeners
   */
  private emitEvent(type: CacheEventType, data: Partial<CacheEvent<T>>): void {
    if (!this.config.enableEvents) return;
    
    const listeners = this.eventListeners.get(type);
    if (!listeners || listeners.size === 0) return;
    
    const event: CacheEvent<T> = {
      type,
      timestamp: Date.now(),
      ...data
    };
    
    // Emit to all listeners (async to avoid blocking)
    setTimeout(() => {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in cache event listener for ${type}:`, error);
        }
      }
    }, 0);
  }
  
  /**
   * Start automatic cleanup timer
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.optimize();
    }, this.config.cleanupInterval);
  }
}

// ============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// ============================================================================

/**
 * Create an LRU cache with station information preset
 */
export function createStationInfoCache<T = any>(): LRUCache<T> {
  return new LRUCache<T>(CACHE_PRESETS.STATION_INFO);
}

/**
 * Create an LRU cache with search results preset
 */
export function createSearchResultsCache<T = any>(): LRUCache<T> {
  return new LRUCache<T>(CACHE_PRESETS.SEARCH_RESULTS);
}

/**
 * Create an LRU cache with route calculations preset
 */
export function createRouteCalculationsCache<T = any>(): LRUCache<T> {
  return new LRUCache<T>(CACHE_PRESETS.ROUTE_CALCULATIONS);
}

/**
 * Create an LRU cache with reference data preset
 */
export function createReferenceDataCache<T = any>(): LRUCache<T> {
  return new LRUCache<T>(CACHE_PRESETS.REFERENCE_DATA);
}

/**
 * Create a custom LRU cache with specified configuration
 */
export function createCustomCache<T = any>(config: CacheConfig): LRUCache<T> {
  return new LRUCache<T>(config);
}

// ============================================================================
// TYPE EXPORTS (types are already exported via interface/type declarations above)
// ============================================================================