/**
 * Cache Manager for Farert Frontend API Layer SDK
 * 
 * Central caching coordination system that manages multiple LRU cache instances
 * for different data types with specific TTL values and memory limits.
 * 
 * This implementation provides intelligent caching across different data categories:
 * - Station information (1 hour TTL, 10MB limit)
 * - Search results (15 minutes TTL, 5MB limit) 
 * - Fare calculations (5 minutes TTL, 15MB limit)
 * - Reference data (session duration, 20MB limit)
 * 
 * Features:
 * - Category-specific cache instances with optimized configurations
 * - Global 50MB memory limit with intelligent LRU eviction
 * - Comprehensive performance monitoring and statistics
 * - Event-driven cache coordination and optimization
 * - Svelte-reactive state management support
 * - Production-ready error handling and recovery
 * 
 * @file Cache Manager Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-002: Intelligent Caching and Performance Layer
 *   - Global 50MB memory limit with LRU eviction strategy
 *   - Category-specific TTL values and cache policies
 *   - Cross-cache coordination and optimization
 *   - Real-time memory usage monitoring
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

import { 
  LRUCache, 
  CACHE_PRESETS,
  createStationInfoCache,
  createSearchResultsCache,
  createRouteCalculationsCache,
  createReferenceDataCache
} from './lru-cache';

import type {
  CacheEntry,
  CacheStats,
  CacheConfig,
  CacheEvent,
  CacheEventType,
  CacheEventListener
} from './lru-cache';

import type {
  StationInfo,
  StationSearchResult,
  FareCalculationResult,
  CompanyInfo,
  PrefectureInfo,
  LineInfo
} from '../types/core';

// ============================================================================
// CACHE MANAGER INTERFACES
// ============================================================================

/**
 * Cache category enumeration
 * 
 * Defines the different categories of data that can be cached.
 */
export enum CacheCategory {
  STATIONS = 'stations',
  SEARCH_RESULTS = 'search_results', 
  FARE_CALCULATIONS = 'fare_calculations',
  REFERENCE_DATA = 'reference_data'
}

/**
 * Cache manager configuration
 * 
 * Global configuration for the cache manager and its sub-caches.
 */
export interface CacheManagerConfig {
  /** Global memory limit in bytes (default: 50MB) */
  globalMemoryLimit?: number;
  
  /** Enable automatic memory management */
  autoMemoryManagement?: boolean;
  
  /** Memory check interval in milliseconds */
  memoryCheckInterval?: number;
  
  /** Enable cross-cache optimization */
  enableOptimization?: boolean;
  
  /** Optimization interval in milliseconds */
  optimizationInterval?: number;
  
  /** Enable detailed statistics */
  enableDetailedStats?: boolean;
  
  /** Enable event system */
  enableEvents?: boolean;
  
  /** Custom cache configurations by category */
  categoryConfigs?: Partial<Record<CacheCategory, CacheConfig>>;
  
  /** Emergency eviction threshold (percentage of global limit) */
  emergencyEvictionThreshold?: number;
  
  /** Enable Svelte reactivity */
  svelteReactive?: boolean;
}

/**
 * Cache manager statistics
 * 
 * Comprehensive statistics across all cache categories.
 */
export interface CacheManagerStats {
  /** Global statistics */
  global: {
    /** Total memory usage across all caches */
    totalMemoryUsage: number;
    
    /** Memory usage percentage of global limit */
    memoryUsagePercent: number;
    
    /** Total entries across all caches */
    totalEntries: number;
    
    /** Total hits across all caches */
    totalHits: number;
    
    /** Total misses across all caches */
    totalMisses: number;
    
    /** Overall hit ratio */
    overallHitRatio: number;
    
    /** Number of emergency evictions */
    emergencyEvictions: number;
    
    /** Number of optimization runs */
    optimizationRuns: number;
    
    /** Last optimization time */
    lastOptimization: number;
    
    /** Cache creation time */
    createdAt: number;
  };
  
  /** Statistics by category */
  categories: Record<CacheCategory, CacheStats>;
  
  /** Memory distribution by category */
  memoryDistribution: Record<CacheCategory, {
    usage: number;
    percentage: number;
    limit: number;
  }>;
  
  /** Performance metrics */
  performance: {
    /** Average operation time by category */
    averageOperationTime: Record<CacheCategory, number>;
    
    /** Cache efficiency score (0-100) */
    efficiencyScore: number;
    
    /** Memory fragmentation indicator */
    fragmentation: number;
  };
}

/**
 * Cache manager event types
 */
export type CacheManagerEventType = 
  | 'memory_warning'
  | 'memory_critical'
  | 'emergency_eviction'
  | 'optimization_complete'
  | 'cache_cleared'
  | 'category_added'
  | 'stats_updated';

/**
 * Cache manager event data
 */
export interface CacheManagerEvent {
  /** Event type */
  type: CacheManagerEventType;
  
  /** Event timestamp */
  timestamp: number;
  
  /** Affected category (if applicable) */
  category?: CacheCategory;
  
  /** Event context data */
  context: Record<string, any>;
}

/**
 * Cache key generation options
 */
export interface CacheKeyOptions {
  /** Include parameters in key */
  includeParams?: boolean;
  
  /** Custom key prefix */
  prefix?: string;
  
  /** Key expiration behavior */
  expiration?: 'none' | 'sliding' | 'absolute';
  
  /** Namespace for key collision prevention */
  namespace?: string;
}

// ============================================================================
// CACHE MANAGER IMPLEMENTATION
// ============================================================================

/**
 * Central cache manager for the Farert SDK
 * 
 * Coordinates multiple LRU cache instances with intelligent memory management,
 * cross-cache optimization, and comprehensive monitoring capabilities.
 * 
 * @class CacheManager
 */
export class CacheManager {
  // Cache instances by category
  private readonly caches = new Map<CacheCategory, LRUCache<any>>();
  
  // Configuration
  private readonly config: Required<CacheManagerConfig>;
  
  // Statistics tracking
  private readonly stats: CacheManagerStats;
  
  // Event system
  private readonly eventListeners = new Map<CacheManagerEventType, Set<(event: CacheManagerEvent) => void>>();
  
  // Timers for automatic operations
  private memoryCheckTimer: NodeJS.Timeout | null = null;
  private optimizationTimer: NodeJS.Timeout | null = null;
  
  // Performance tracking
  private readonly operationTimings = new Map<string, number[]>();
  
  // Svelte reactivity support
  private svelteSubscribers = new Set<() => void>();
  
  /**
   * Create a new CacheManager instance
   * 
   * @param config Cache manager configuration
   */
  constructor(config: CacheManagerConfig = {}) {
    // Merge configuration with defaults
    this.config = {
      globalMemoryLimit: config.globalMemoryLimit ?? 50 * 1024 * 1024, // 50MB
      autoMemoryManagement: config.autoMemoryManagement ?? true,
      memoryCheckInterval: config.memoryCheckInterval ?? 30 * 1000, // 30 seconds
      enableOptimization: config.enableOptimization ?? true,
      optimizationInterval: config.optimizationInterval ?? 5 * 60 * 1000, // 5 minutes
      enableDetailedStats: config.enableDetailedStats ?? true,
      enableEvents: config.enableEvents ?? true,
      categoryConfigs: config.categoryConfigs ?? {},
      emergencyEvictionThreshold: config.emergencyEvictionThreshold ?? 0.9, // 90%
      svelteReactive: config.svelteReactive ?? true
    };
    
    // Initialize statistics
    this.stats = this.initializeStats();
    
    // Initialize cache instances
    this.initializeCaches();
    
    // Start automatic operations
    if (this.config.autoMemoryManagement) {
      this.startMemoryMonitoring();
    }
    
    if (this.config.enableOptimization) {
      this.startOptimization();
    }
  }
  
  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================
  
  /**
   * Get a cached value by key and category
   * 
   * @param category Cache category
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(category: CacheCategory, key: string): Promise<T | null> {
    const startTime = this.config.enableDetailedStats ? performance.now() : 0;
    
    try {
      const cache = this.getCache<T>(category);
      const result = cache.get(key);
      
      if (this.config.enableDetailedStats) {
        this.recordOperationTiming('get', performance.now() - startTime);
        this.updateStats();
      }
      
      return result;
    } catch (error) {
      this.emitEvent('memory_warning', {
        category,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
  
  /**
   * Set a cached value by key and category
   * 
   * @param category Cache category
   * @param key Cache key  
   * @param value Value to cache
   * @param ttl Optional TTL override in milliseconds
   */
  async set<T>(category: CacheCategory, key: string, value: T, ttl?: number): Promise<void> {
    const startTime = this.config.enableDetailedStats ? performance.now() : 0;
    
    try {
      // Check global memory limit before setting
      if (this.config.autoMemoryManagement) {
        await this.ensureMemoryLimit();
      }
      
      const cache = this.getCache<T>(category);
      cache.set(key, value, ttl);
      
      if (this.config.enableDetailedStats) {
        this.recordOperationTiming('set', performance.now() - startTime);
        this.updateStats();
        this.notifySubscribers();
      }
    } catch (error) {
      this.emitEvent('memory_critical', {
        category,
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Remove a cached value by key and category
   * 
   * @param category Cache category
   * @param key Cache key
   * @returns True if key existed and was deleted
   */
  async delete(category: CacheCategory, key: string): Promise<boolean> {
    const startTime = this.config.enableDetailedStats ? performance.now() : 0;
    
    try {
      const cache = this.getCache(category);
      const result = cache.delete(key);
      
      if (this.config.enableDetailedStats) {
        this.recordOperationTiming('delete', performance.now() - startTime);
        this.updateStats();
        this.notifySubscribers();
      }
      
      return result;
    } catch (error) {
      console.error(`Failed to delete cache key ${key} in category ${category}:`, error);
      return false;
    }
  }
  
  /**
   * Clear all entries in a specific category
   * 
   * @param category Cache category to clear
   */
  async clear(category?: CacheCategory): Promise<void> {
    try {
      if (category) {
        const cache = this.getCache(category);
        cache.clear();
        this.emitEvent('cache_cleared', { category });
      } else {
        // Clear all caches
        for (const [cat, cache] of Array.from(this.caches.entries())) {
          cache.clear();
          this.emitEvent('cache_cleared', { category: cat });
        }
      }
      
      if (this.config.enableDetailedStats) {
        this.updateStats();
        this.notifySubscribers();
      }
    } catch (error) {
      console.error(`Failed to clear cache category ${category}:`, error);
    }
  }
  
  /**
   * Check if a key exists in the specified category
   * 
   * @param category Cache category
   * @param key Cache key
   * @returns True if key exists and is not expired
   */
  has(category: CacheCategory, key: string): boolean {
    try {
      const cache = this.getCache(category);
      return cache.has(key);
    } catch (error) {
      console.error(`Failed to check cache key ${key} in category ${category}:`, error);
      return false;
    }
  }
  
  /**
   * Get comprehensive cache statistics
   * 
   * @returns Current cache manager statistics
   */
  getStats(): CacheManagerStats {
    if (this.config.enableDetailedStats) {
      this.updateStats();
    }
    return JSON.parse(JSON.stringify(this.stats));
  }
  
  /**
   * Manually trigger cache optimization
   * 
   * @returns Number of entries removed across all caches
   */
  async optimize(): Promise<number> {
    const startTime = performance.now();
    let totalRemoved = 0;
    
    try {
      // Optimize each cache individually
      for (const [category, cache] of Array.from(this.caches.entries())) {
        const removed = cache.optimize();
        totalRemoved += removed;
      }
      
      // Update statistics
      this.stats.global.optimizationRuns++;
      this.stats.global.lastOptimization = Date.now();
      
      // Emit optimization event
      this.emitEvent('optimization_complete', {
        entriesRemoved: totalRemoved,
        optimizationTime: performance.now() - startTime
      });
      
      if (this.config.enableDetailedStats) {
        this.updateStats();
        this.notifySubscribers();
      }
      
      return totalRemoved;
    } catch (error) {
      console.error('Cache optimization failed:', error);
      return 0;
    }
  }
  
  // ============================================================================
  // CATEGORY-SPECIFIC CONVENIENCE METHODS
  // ============================================================================
  
  /**
   * Cache station information
   */
  async cacheStationInfo(stationId: number, stationInfo: StationInfo): Promise<void> {
    const key = `station:${stationId}`;
    await this.set(CacheCategory.STATIONS, key, stationInfo);
  }
  
  /**
   * Get cached station information
   */
  async getStationInfo(stationId: number): Promise<StationInfo | null> {
    const key = `station:${stationId}`;
    return await this.get<StationInfo>(CacheCategory.STATIONS, key);
  }
  
  /**
   * Cache search results
   */
  async cacheSearchResults(query: string, results: StationSearchResult[]): Promise<void> {
    const key = `search:${this.normalizeSearchQuery(query)}`;
    await this.set(CacheCategory.SEARCH_RESULTS, key, results);
  }
  
  /**
   * Get cached search results
   */
  async getSearchResults(query: string): Promise<StationSearchResult[] | null> {
    const key = `search:${this.normalizeSearchQuery(query)}`;
    return await this.get<StationSearchResult[]>(CacheCategory.SEARCH_RESULTS, key);
  }
  
  /**
   * Cache fare calculation result
   */
  async cacheFareCalculation(routeKey: string, result: FareCalculationResult): Promise<void> {
    const key = `fare:${routeKey}`;
    await this.set(CacheCategory.FARE_CALCULATIONS, key, result);
  }
  
  /**
   * Get cached fare calculation
   */
  async getFareCalculation(routeKey: string): Promise<FareCalculationResult | null> {
    const key = `fare:${routeKey}`;
    return await this.get<FareCalculationResult>(CacheCategory.FARE_CALCULATIONS, key);
  }
  
  /**
   * Cache reference data (companies, prefectures, lines)
   */
  async cacheReferenceData(type: 'company' | 'prefecture' | 'line', id: number, data: any): Promise<void> {
    const key = `${type}:${id}`;
    await this.set(CacheCategory.REFERENCE_DATA, key, data);
  }
  
  /**
   * Get cached reference data
   */
  async getReferenceData<T = CompanyInfo | PrefectureInfo | LineInfo>(
    type: 'company' | 'prefecture' | 'line', 
    id: number
  ): Promise<T | null> {
    const key = `${type}:${id}`;
    return await this.get<T>(CacheCategory.REFERENCE_DATA, key);
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
  on(eventType: CacheManagerEventType, listener: (event: CacheManagerEvent) => void): void {
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
  off(eventType: CacheManagerEventType, listener: (event: CacheManagerEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(eventType);
      }
    }
  }
  
  // ============================================================================
  // SVELTE REACTIVITY SUPPORT
  // ============================================================================
  
  /**
   * Subscribe to cache manager state changes (Svelte-compatible)
   * 
   * @param subscriber Function to call on state changes
   * @returns Unsubscribe function
   */
  subscribe(subscriber: () => void): () => void {
    if (!this.config.svelteReactive) {
      return () => {}; // No-op unsubscribe
    }
    
    this.svelteSubscribers.add(subscriber);
    
    // Call subscriber immediately with current state
    subscriber();
    
    // Return unsubscribe function
    return () => {
      this.svelteSubscribers.delete(subscriber);
    };
  }
  
  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================
  
  /**
   * Dispose of the cache manager and clean up resources
   */
  dispose(): void {
    // Stop timers
    if (this.memoryCheckTimer) {
      clearInterval(this.memoryCheckTimer);
      this.memoryCheckTimer = null;
    }
    
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
    
    // Dispose of all caches
    for (const cache of Array.from(this.caches.values())) {
      cache.dispose();
    }
    this.caches.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear Svelte subscribers
    this.svelteSubscribers.clear();
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  /**
   * Initialize cache instances with optimized configurations
   */
  private initializeCaches(): void {
    // Station information cache (1 hour TTL, 10MB limit)
    const stationConfig = { 
      ...CACHE_PRESETS.STATION_INFO, 
      ...this.config.categoryConfigs?.[CacheCategory.STATIONS] 
    };
    this.caches.set(CacheCategory.STATIONS, new LRUCache(stationConfig));
    
    // Search results cache (15 minutes TTL, 5MB limit)
    const searchConfig = { 
      ...CACHE_PRESETS.SEARCH_RESULTS, 
      ...this.config.categoryConfigs?.[CacheCategory.SEARCH_RESULTS] 
    };
    this.caches.set(CacheCategory.SEARCH_RESULTS, new LRUCache(searchConfig));
    
    // Route calculations cache (5 minutes TTL, 15MB limit)
    const routeConfig = { 
      ...CACHE_PRESETS.ROUTE_CALCULATIONS, 
      ...this.config.categoryConfigs?.[CacheCategory.FARE_CALCULATIONS] 
    };
    this.caches.set(CacheCategory.FARE_CALCULATIONS, new LRUCache(routeConfig));
    
    // Reference data cache (session duration, 20MB limit)
    const refConfig = { 
      ...CACHE_PRESETS.REFERENCE_DATA, 
      ...this.config.categoryConfigs?.[CacheCategory.REFERENCE_DATA] 
    };
    this.caches.set(CacheCategory.REFERENCE_DATA, new LRUCache(refConfig));
  }
  
  /**
   * Initialize statistics structure
   */
  private initializeStats(): CacheManagerStats {
    const now = Date.now();
    return {
      global: {
        totalMemoryUsage: 0,
        memoryUsagePercent: 0,
        totalEntries: 0,
        totalHits: 0,
        totalMisses: 0,
        overallHitRatio: 0,
        emergencyEvictions: 0,
        optimizationRuns: 0,
        lastOptimization: now,
        createdAt: now
      },
      categories: {
        [CacheCategory.STATIONS]: this.createEmptyStats(),
        [CacheCategory.SEARCH_RESULTS]: this.createEmptyStats(),
        [CacheCategory.FARE_CALCULATIONS]: this.createEmptyStats(),
        [CacheCategory.REFERENCE_DATA]: this.createEmptyStats()
      },
      memoryDistribution: {
        [CacheCategory.STATIONS]: { usage: 0, percentage: 0, limit: CACHE_PRESETS.STATION_INFO.maxMemoryBytes! },
        [CacheCategory.SEARCH_RESULTS]: { usage: 0, percentage: 0, limit: CACHE_PRESETS.SEARCH_RESULTS.maxMemoryBytes! },
        [CacheCategory.FARE_CALCULATIONS]: { usage: 0, percentage: 0, limit: CACHE_PRESETS.ROUTE_CALCULATIONS.maxMemoryBytes! },
        [CacheCategory.REFERENCE_DATA]: { usage: 0, percentage: 0, limit: CACHE_PRESETS.REFERENCE_DATA.maxMemoryBytes! }
      },
      performance: {
        averageOperationTime: {
          [CacheCategory.STATIONS]: 0,
          [CacheCategory.SEARCH_RESULTS]: 0,
          [CacheCategory.FARE_CALCULATIONS]: 0,
          [CacheCategory.REFERENCE_DATA]: 0
        },
        efficiencyScore: 100,
        fragmentation: 0
      }
    };
  }
  
  /**
   * Create empty cache statistics
   */
  private createEmptyStats(): CacheStats {
    return {
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
  }
  
  /**
   * Get cache instance for a specific category
   */
  private getCache<T>(category: CacheCategory): LRUCache<T> {
    const cache = this.caches.get(category);
    if (!cache) {
      throw new Error(`Cache category ${category} not initialized`);
    }
    return cache as LRUCache<T>;
  }
  
  /**
   * Update comprehensive statistics
   */
  private updateStats(): void {
    if (!this.config.enableDetailedStats) return;
    
    let totalMemory = 0;
    let totalEntries = 0;
    let totalHits = 0;
    let totalMisses = 0;
    
    // Aggregate statistics from all caches
    for (const [category, cache] of Array.from(this.caches.entries())) {
      const stats = cache.getStats();
      this.stats.categories[category] = stats;
      
      totalMemory += stats.memoryUsage;
      totalEntries += stats.totalEntries;
      totalHits += stats.hits;
      totalMisses += stats.misses;
      
      // Update memory distribution
      this.stats.memoryDistribution[category].usage = stats.memoryUsage;
      this.stats.memoryDistribution[category].percentage = 
        totalMemory > 0 ? (stats.memoryUsage / totalMemory) * 100 : 0;
    }
    
    // Update global statistics
    this.stats.global.totalMemoryUsage = totalMemory;
    this.stats.global.memoryUsagePercent = (totalMemory / this.config.globalMemoryLimit) * 100;
    this.stats.global.totalEntries = totalEntries;
    this.stats.global.totalHits = totalHits;
    this.stats.global.totalMisses = totalMisses;
    this.stats.global.overallHitRatio = 
      (totalHits + totalMisses) > 0 ? totalHits / (totalHits + totalMisses) : 0;
    
    // Calculate efficiency score
    this.stats.performance.efficiencyScore = this.calculateEfficiencyScore();
  }
  
  /**
   * Calculate overall cache efficiency score (0-100)
   */
  private calculateEfficiencyScore(): number {
    const hitRatio = this.stats.global.overallHitRatio;
    const memoryEfficiency = 1 - (this.stats.global.memoryUsagePercent / 100);
    const optimizationFactor = this.stats.global.optimizationRuns > 0 ? 1 : 0.8;
    
    return Math.round((hitRatio * 60 + memoryEfficiency * 30 + optimizationFactor * 10) * 100);
  }
  
  /**
   * Ensure global memory limit is not exceeded
   */
  private async ensureMemoryLimit(): Promise<void> {
    const currentMemory = this.getCurrentMemoryUsage();
    const threshold = this.config.globalMemoryLimit * this.config.emergencyEvictionThreshold;
    
    if (currentMemory > threshold) {
      this.emitEvent('memory_critical', {
        currentUsage: currentMemory,
        limit: this.config.globalMemoryLimit,
        threshold
      });
      
      await this.performEmergencyEviction();
    }
  }
  
  /**
   * Get current total memory usage across all caches
   */
  private getCurrentMemoryUsage(): number {
    let totalMemory = 0;
    for (const cache of Array.from(this.caches.values())) {
      totalMemory += cache.getStats().memoryUsage;
    }
    return totalMemory;
  }
  
  /**
   * Perform emergency eviction to free memory
   */
  private async performEmergencyEviction(): Promise<void> {
    const target = this.config.globalMemoryLimit * 0.7; // Target 70% usage
    let currentMemory = this.getCurrentMemoryUsage();
    
    // Evict entries from caches in priority order (least important first)
    const evictionOrder: CacheCategory[] = [
      CacheCategory.SEARCH_RESULTS,
      CacheCategory.FARE_CALCULATIONS,
      CacheCategory.STATIONS,
      CacheCategory.REFERENCE_DATA
    ];
    
    for (const category of evictionOrder) {
      if (currentMemory <= target) break;
      
      const cache = this.getCache(category);
      const leastUsed = cache.getLeastRecentlyUsed(50); // Get 50 least used entries
      
      for (const entry of leastUsed) {
        cache.delete(entry.key);
        currentMemory -= entry.size;
        this.stats.global.emergencyEvictions++;
        
        if (currentMemory <= target) break;
      }
    }
    
    this.emitEvent('emergency_eviction', {
      memoryFreed: this.getCurrentMemoryUsage() - currentMemory,
      newMemoryUsage: this.getCurrentMemoryUsage()
    });
  }
  
  /**
   * Start automatic memory monitoring
   */
  private startMemoryMonitoring(): void {
    this.memoryCheckTimer = setInterval(() => {
      this.ensureMemoryLimit().catch(error => {
        console.error('Memory monitoring error:', error);
      });
    }, this.config.memoryCheckInterval);
  }
  
  /**
   * Start automatic optimization
   */
  private startOptimization(): void {
    this.optimizationTimer = setInterval(() => {
      this.optimize().catch(error => {
        console.error('Automatic optimization error:', error);
      });
    }, this.config.optimizationInterval);
  }
  
  /**
   * Record operation timing for performance analysis
   */
  private recordOperationTiming(operation: string, time: number): void {
    if (!this.operationTimings.has(operation)) {
      this.operationTimings.set(operation, []);
    }
    
    const timings = this.operationTimings.get(operation)!;
    timings.push(time);
    
    // Keep only recent timings (last 100)
    if (timings.length > 100) {
      timings.shift();
    }
  }
  
  /**
   * Normalize search query for consistent caching
   */
  private normalizeSearchQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }
  
  /**
   * Emit cache manager event
   */
  private emitEvent(type: CacheManagerEventType, context: Record<string, any>): void {
    if (!this.config.enableEvents) return;
    
    const listeners = this.eventListeners.get(type);
    if (!listeners || listeners.size === 0) return;
    
    const event: CacheManagerEvent = {
      type,
      timestamp: Date.now(),
      context
    };
    
    // Emit to all listeners asynchronously
    setTimeout(() => {
      for (const listener of Array.from(listeners)) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in cache manager event listener for ${type}:`, error);
        }
      }
    }, 0);
  }
  
  /**
   * Notify Svelte subscribers of state changes
   */
  private notifySubscribers(): void {
    if (!this.config.svelteReactive) return;
    
    for (const subscriber of Array.from(this.svelteSubscribers)) {
      try {
        subscriber();
      } catch (error) {
        console.error('Error notifying Svelte subscriber:', error);
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// ============================================================================

/**
 * Create a default cache manager instance
 */
export function createCacheManager(config?: CacheManagerConfig): CacheManager {
  return new CacheManager(config);
}

/**
 * Create a cache manager optimized for Svelte applications
 */
export function createSvelteCacheManager(config?: CacheManagerConfig): CacheManager {
  return new CacheManager({
    ...config,
    svelteReactive: true,
    enableEvents: true,
    enableDetailedStats: true
  });
}

/**
 * Create a cache manager optimized for production use
 */
export function createProductionCacheManager(config?: CacheManagerConfig): CacheManager {
  return new CacheManager({
    ...config,
    autoMemoryManagement: true,
    enableOptimization: true,
    enableDetailedStats: false, // Reduce overhead in production
    emergencyEvictionThreshold: 0.85 // More conservative threshold
  });
}

// ============================================================================
// TYPE EXPORTS (types are already exported via interface/enum declarations above)
// ============================================================================