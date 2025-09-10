/**
 * Svelte Station Search Store for Farert WebAssembly SDK
 * 
 * Provides comprehensive, debounced station search functionality with intelligent
 * caching, error handling, and Japanese text support optimized for Svelte applications.
 * 
 * Features:
 * - Debounced search with configurable delays and smart batching
 * - Advanced fuzzy matching with typo tolerance and romanization support
 * - LRU caching with TTL expiration and memory management
 * - Japanese text normalization and accessibility features
 * - Comprehensive error boundaries with user-friendly messages
 * - Context integration with automatic SDK lifecycle management
 * - Autocomplete and suggestion functionality with popularity ranking
 * - Search history tracking with persistence and privacy controls
 * - Performance monitoring and metrics collection
 * 
 * Requirements:
 * - REQ-API-003: Svelte Reactive Stores and Components
 *   - Debounced search with reactive loading states
 *   - Context integration for SDK access
 *   - Error boundaries with graceful fallbacks
 *   - Japanese text support and accessibility
 * 
 * @file Station Search Store Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// IMPORTS AND DEPENDENCIES
// ============================================================================

// Svelte imports with fallbacks for non-Svelte environments
let writable: any, derived: any, readable: any, get: any;
let Writable: any, Readable: any, Derived: any;

try {
  ({ writable, derived, readable, get } = require('svelte/store'));
  const svelteStoreTypes = require('svelte/store');
  Writable = svelteStoreTypes.Writable;
  Readable = svelteStoreTypes.Readable;
  Derived = svelteStoreTypes.Derived;
} catch {
  // Fallback implementations for non-Svelte environments
  writable = (value: any) => ({ 
    subscribe: (fn: any) => { fn(value); return () => {}; }, 
    set: () => {}, 
    update: () => {} 
  });
  derived = (stores: any, fn: any) => writable(fn(get(stores)));
  readable = (value: any) => ({ subscribe: writable(value).subscribe });
  get = (store: any) => store.value || null;
  
  // Type fallbacks
  Writable = any;
  Readable = any;
  Derived = any;
}

// SDK imports
import { getSDK, requireSDK, getSDKStores } from './context';
import type {
  StationInfo,
  StationSearchResult,
  StationSearchOptions,
  FarertSDKError,
  FarertSDKErrorCode
} from '../types/core';

// Utility imports
import {
  fuzzySearchStations,
  searchStationsByReading,
  getStationSuggestions,
  filterStationsByPrefix,
  formatStationName,
  getStationDisplayName,
  getPopularStations,
  validateStationName,
  type EnhancedSearchOptions,
  type StationValidationResult
} from '../utils/station-utils';

// Cache and error handling
import { LRUCache } from '../cache/lru-cache';
import { ErrorManager } from '../errors/error-manager';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Station search store state
 */
export interface StationSearchState {
  // Search state
  /** Current search query */
  query: string;
  
  /** Search results */
  results: StationSearchResult[];
  
  /** Whether search is in progress */
  isLoading: boolean;
  
  /** Current search error */
  error: FarertSDKError | null;
  
  /** Search suggestions */
  suggestions: string[];
  
  /** Popular stations cache */
  popularStations: StationInfo[];
  
  // History and caching
  /** Recent search queries */
  searchHistory: string[];
  
  /** Cache statistics */
  cacheStats: {
    hits: number;
    misses: number;
    size: number;
  };
  
  // Configuration
  /** Search configuration */
  config: StationSearchConfig;
  
  // Metadata
  /** Last search timestamp */
  lastSearchTime: number;
  
  /** Total search count */
  searchCount: number;
  
  /** Performance metrics */
  metrics: {
    averageSearchTime: number;
    fastestSearch: number;
    slowestSearch: number;
    lastSearchTime: number;
  };
}

/**
 * Station search configuration options
 */
export interface StationSearchConfig {
  /** Debounce delay in milliseconds */
  debounceMs: number;
  
  /** Minimum query length for search */
  minQueryLength: number;
  
  /** Maximum number of results */
  maxResults: number;
  
  /** Maximum number of suggestions */
  maxSuggestions: number;
  
  /** Maximum search history entries */
  maxHistorySize: number;
  
  /** Cache configuration */
  cache: {
    enabled: boolean;
    maxSize: number;
    ttlMs: number; // Time to live in milliseconds
  };
  
  /** Fuzzy search options */
  fuzzySearch: {
    enabled: boolean;
    minScore: number;
    enableRomanization: boolean;
    enableTypoTolerance: boolean;
  };
  
  /** Advanced search features */
  features: {
    enableHistory: boolean;
    enableSuggestions: boolean;
    enablePopularStations: boolean;
    enableMetrics: boolean;
  };
  
  /** Search behavior */
  behavior: {
    searchOnFocus: boolean;
    clearOnBlur: boolean;
    persistHistory: boolean;
    boostMajorStations: boolean;
  };
  
  /** Error handling */
  errorHandling: {
    enableRetry: boolean;
    maxRetries: number;
    retryDelay: number;
    showUserFriendlyMessages: boolean;
  };
}

/**
 * Station search store interface
 */
export interface StationSearchStore extends Readable<StationSearchState> {
  // Core search operations
  search(query: string): Promise<void>;
  searchImmediate(query: string): Promise<void>;
  clear(): void;
  clearResults(): void;
  
  // Autocomplete and suggestions
  getSuggestions(partial: string): Promise<string[]>;
  getPopularStations(): Promise<StationInfo[]>;
  updateSuggestions(query: string): Promise<void>;
  
  // History and cache management
  getSearchHistory(): string[];
  addToHistory(query: string): void;
  clearHistory(): void;
  clearCache(): void;
  
  // Configuration and lifecycle
  configure(options: Partial<StationSearchConfig>): void;
  getConfig(): StationSearchConfig;
  dispose(): void;
  
  // Error handling
  retry(): Promise<void>;
  clearError(): void;
  
  // Performance and metrics
  getMetrics(): StationSearchState['metrics'];
  resetMetrics(): void;
}

/**
 * Search operation context
 */
interface SearchContext {
  query: string;
  startTime: number;
  abortController: AbortController;
  retryCount: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default station search configuration
 */
const DEFAULT_SEARCH_CONFIG: StationSearchConfig = {
  debounceMs: 300,
  minQueryLength: 1,
  maxResults: 50,
  maxSuggestions: 10,
  maxHistorySize: 20,
  
  cache: {
    enabled: true,
    maxSize: 500,
    ttlMs: 15 * 60 * 1000 // 15 minutes (per REQ-API-002)
  },
  
  fuzzySearch: {
    enabled: true,
    minScore: 0.6,
    enableRomanization: true,
    enableTypoTolerance: true
  },
  
  features: {
    enableHistory: true,
    enableSuggestions: true,
    enablePopularStations: true,
    enableMetrics: true
  },
  
  behavior: {
    searchOnFocus: false,
    clearOnBlur: false,
    persistHistory: true,
    boostMajorStations: true
  },
  
  errorHandling: {
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
    showUserFriendlyMessages: true
  }
};

/**
 * Default station search state
 */
const DEFAULT_SEARCH_STATE: StationSearchState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  suggestions: [],
  popularStations: [],
  searchHistory: [],
  cacheStats: {
    hits: 0,
    misses: 0,
    size: 0
  },
  config: DEFAULT_SEARCH_CONFIG,
  lastSearchTime: 0,
  searchCount: 0,
  metrics: {
    averageSearchTime: 0,
    fastestSearch: Infinity,
    slowestSearch: 0,
    lastSearchTime: 0
  }
};

// ============================================================================
// STATION SEARCH STORE FACTORY
// ============================================================================

/**
 * Create a new station search store
 * 
 * @param options Configuration options
 * @returns Station search store instance
 */
export function createStationSearchStore(
  options: Partial<StationSearchConfig> = {}
): StationSearchStore {
  // Merge configuration
  const config: StationSearchConfig = {
    ...DEFAULT_SEARCH_CONFIG,
    ...options,
    cache: {
      ...DEFAULT_SEARCH_CONFIG.cache,
      ...options.cache
    },
    fuzzySearch: {
      ...DEFAULT_SEARCH_CONFIG.fuzzySearch,
      ...options.fuzzySearch
    },
    features: {
      ...DEFAULT_SEARCH_CONFIG.features,
      ...options.features
    },
    behavior: {
      ...DEFAULT_SEARCH_CONFIG.behavior,
      ...options.behavior
    },
    errorHandling: {
      ...DEFAULT_SEARCH_CONFIG.errorHandling,
      ...options.errorHandling
    }
  };
  
  // Create base store
  const { subscribe, set, update } = writable<StationSearchState>({
    ...DEFAULT_SEARCH_STATE,
    config
  });
  
  // Internal state
  let searchTimeout: NodeJS.Timeout | null = null;
  let currentSearchContext: SearchContext | null = null;
  let cache: LRUCache<string, StationSearchResult[]> | null = null;
  let suggestionCache: LRUCache<string, string[]> | null = null;
  let errorManager: ErrorManager | null = null;
  let disposed = false;
  
  // Initialize caches if enabled
  if (config.cache.enabled) {
    cache = new LRUCache({
      maxSize: config.cache.maxSize,
      ttl: config.cache.ttlMs
    });
    
    suggestionCache = new LRUCache({
      maxSize: Math.floor(config.cache.maxSize / 2),
      ttl: config.cache.ttlMs
    });
  }
  
  // Initialize error manager
  if (config.errorHandling.showUserFriendlyMessages) {
    errorManager = new ErrorManager({
      enableFuzzyMatching: config.fuzzySearch.enabled,
      maxRetries: config.errorHandling.maxRetries,
      retryDelay: config.errorHandling.retryDelay
    });
  }
  
  // Load persisted search history
  if (config.behavior.persistHistory && config.features.enableHistory) {
    try {
      const savedHistory = localStorage?.getItem('farert-search-history');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        update(state => ({
          ...state,
          searchHistory: Array.isArray(history) 
            ? history.slice(0, config.maxHistorySize)
            : []
        }));
      }
    } catch (error) {
      console.warn('[StationSearchStore] Failed to load search history:', error);
    }
  }
  
  // =========================================================================
  // INTERNAL HELPER FUNCTIONS
  // =========================================================================
  
  /**
   * Update cache statistics
   */
  const updateCacheStats = () => {
    if (!cache) return;
    
    update(state => ({
      ...state,
      cacheStats: {
        hits: state.cacheStats.hits,
        misses: state.cacheStats.misses,
        size: cache!.size()
      }
    }));
  };
  
  /**
   * Update search metrics
   */
  const updateMetrics = (searchTime: number) => {
    if (!config.features.enableMetrics) return;
    
    update(state => {
      const newCount = state.searchCount + 1;
      const newAverage = ((state.metrics.averageSearchTime * state.searchCount) + searchTime) / newCount;
      
      return {
        ...state,
        searchCount: newCount,
        metrics: {
          averageSearchTime: newAverage,
          fastestSearch: Math.min(state.metrics.fastestSearch, searchTime),
          slowestSearch: Math.max(state.metrics.slowestSearch, searchTime),
          lastSearchTime: searchTime
        }
      };
    });
  };
  
  /**
   * Add query to search history
   */
  const addToSearchHistory = (query: string) => {
    if (!config.features.enableHistory || !query.trim()) return;
    
    update(state => {
      const newHistory = [
        query,
        ...state.searchHistory.filter(item => item !== query)
      ].slice(0, config.maxHistorySize);
      
      // Persist to localStorage if enabled
      if (config.behavior.persistHistory) {
        try {
          localStorage?.setItem('farert-search-history', JSON.stringify(newHistory));
        } catch (error) {
          console.warn('[StationSearchStore] Failed to persist search history:', error);
        }
      }
      
      return {
        ...state,
        searchHistory: newHistory
      };
    });
  };
  
  /**
   * Create user-friendly error message
   */
  const createUserFriendlyError = (error: any, query: string): FarertSDKError => {
    if (errorManager) {
      return errorManager.createUserFriendlyError(error, { query });
    }
    
    // Fallback error handling
    const message = error instanceof Error 
      ? error.message 
      : `Station search failed for "${query}"`;
    
    return {
      name: 'FarertSDKError',
      message,
      code: 'STATION_SEARCH_FAILED' as FarertSDKErrorCode,
      context: { query, originalError: error },
      timestamp: Date.now(),
      retryable: true
    } as FarertSDKError;
  };
  
  /**
   * Perform actual station search
   */
  const performSearch = async (
    query: string,
    context: SearchContext
  ): Promise<StationSearchResult[]> => {
    const sdk = requireSDK();
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery || trimmedQuery.length < config.minQueryLength) {
      return [];
    }
    
    // Check cache first
    if (cache && cache.has(trimmedQuery)) {
      update(state => ({
        ...state,
        cacheStats: { ...state.cacheStats, hits: state.cacheStats.hits + 1 }
      }));
      return cache.get(trimmedQuery)!;
    }
    
    // Update cache miss statistics
    if (cache) {
      update(state => ({
        ...state,
        cacheStats: { ...state.cacheStats, misses: state.cacheStats.misses + 1 }
      }));
    }
    
    // Check if search was aborted
    if (context.abortController.signal.aborted) {
      throw new Error('Search aborted');
    }
    
    // Get all available stations
    const allStations = await sdk.getAllStations();
    
    // Prepare enhanced search options
    const searchOptions: EnhancedSearchOptions = {
      enableFuzzyMatching: config.fuzzySearch.enabled,
      fuzzyMinScore: config.fuzzySearch.minScore,
      enableRomanization: config.fuzzySearch.enableRomanization,
      boostMajorStations: config.behavior.boostMajorStations,
      limit: config.maxResults
    };
    
    // Perform fuzzy search
    const results = fuzzySearchStations(trimmedQuery, allStations, searchOptions);
    
    // Cache results if caching is enabled
    if (cache) {
      cache.set(trimmedQuery, results);
      updateCacheStats();
    }
    
    return results;
  };
  
  /**
   * Handle search operation with error recovery
   */
  const handleSearch = async (query: string, immediate = false): Promise<void> => {
    if (disposed) return;
    
    const startTime = Date.now();
    
    // Abort previous search if running
    if (currentSearchContext) {
      currentSearchContext.abortController.abort();
    }
    
    // Clear previous timeout if not immediate
    if (searchTimeout && !immediate) {
      clearTimeout(searchTimeout);
      searchTimeout = null;
    }
    
    // Create new search context
    currentSearchContext = {
      query,
      startTime,
      abortController: new AbortController(),
      retryCount: 0
    };
    
    // Execute search (with debounce if not immediate)
    const executeSearch = async () => {
      if (disposed || !currentSearchContext) return;
      
      const context = currentSearchContext;
      
      try {
        // Set loading state
        update(state => ({
          ...state,
          isLoading: true,
          error: null,
          query
        }));
        
        // Perform search
        const results = await performSearch(query, context);
        
        // Check if this search context is still current
        if (context !== currentSearchContext || context.abortController.signal.aborted) {
          return;
        }
        
        // Update results
        const searchTime = Date.now() - startTime;
        update(state => ({
          ...state,
          results,
          isLoading: false,
          error: null,
          lastSearchTime: Date.now()
        }));
        
        // Add to history and update metrics
        addToSearchHistory(query);
        updateMetrics(searchTime);
        
      } catch (error) {
        // Check if search was aborted
        if (context.abortController.signal.aborted) {
          return;
        }
        
        const farertError = createUserFriendlyError(error, query);
        
        update(state => ({
          ...state,
          isLoading: false,
          error: farertError,
          results: []
        }));
        
        // Attempt retry if configured
        if (config.errorHandling.enableRetry && 
            context.retryCount < config.errorHandling.maxRetries) {
          setTimeout(() => {
            if (context === currentSearchContext && !disposed) {
              context.retryCount++;
              executeSearch();
            }
          }, config.errorHandling.retryDelay);
        }
      }
    };
    
    // Execute immediately or with debounce
    if (immediate) {
      executeSearch();
    } else {
      searchTimeout = setTimeout(executeSearch, config.debounceMs);
    }
  };
  
  // =========================================================================
  // PUBLIC API IMPLEMENTATION
  // =========================================================================
  
  const storeAPI: StationSearchStore = {
    subscribe,
    
    /**
     * Search stations with debouncing
     */
    async search(query: string): Promise<void> {
      return handleSearch(query, false);
    },
    
    /**
     * Search stations immediately (no debouncing)
     */
    async searchImmediate(query: string): Promise<void> {
      return handleSearch(query, true);
    },
    
    /**
     * Clear current search and results
     */
    clear(): void {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }
      
      if (currentSearchContext) {
        currentSearchContext.abortController.abort();
        currentSearchContext = null;
      }
      
      update(state => ({
        ...state,
        query: '',
        results: [],
        isLoading: false,
        error: null,
        suggestions: []
      }));
    },
    
    /**
     * Clear search results only
     */
    clearResults(): void {
      update(state => ({
        ...state,
        results: [],
        error: null,
        suggestions: []
      }));
    },
    
    /**
     * Get intelligent suggestions for partial input
     */
    async getSuggestions(partial: string): Promise<string[]> {
      if (!config.features.enableSuggestions || !partial.trim()) {
        return [];
      }
      
      const trimmedPartial = partial.trim();
      
      // Check suggestion cache
      if (suggestionCache && suggestionCache.has(trimmedPartial)) {
        return suggestionCache.get(trimmedPartial)!;
      }
      
      try {
        const sdk = requireSDK();
        const allStations = await sdk.getAllStations();
        const suggestions = getStationSuggestions(
          trimmedPartial, 
          allStations, 
          config.maxSuggestions
        );
        
        // Cache suggestions
        if (suggestionCache) {
          suggestionCache.set(trimmedPartial, suggestions);
        }
        
        return suggestions;
        
      } catch (error) {
        console.warn('[StationSearchStore] Failed to get suggestions:', error);
        return [];
      }
    },
    
    /**
     * Get popular stations
     */
    async getPopularStations(): Promise<StationInfo[]> {
      if (!config.features.enablePopularStations) {
        return [];
      }
      
      const currentState = get({ subscribe });
      if (currentState.popularStations.length > 0) {
        return currentState.popularStations;
      }
      
      try {
        const sdk = requireSDK();
        const allStations = await sdk.getAllStations();
        const popular = getPopularStations(allStations, 20);
        
        update(state => ({
          ...state,
          popularStations: popular
        }));
        
        return popular;
        
      } catch (error) {
        console.warn('[StationSearchStore] Failed to get popular stations:', error);
        return [];
      }
    },
    
    /**
     * Update suggestions for current query
     */
    async updateSuggestions(query: string): Promise<void> {
      if (!config.features.enableSuggestions) return;
      
      try {
        const suggestions = await storeAPI.getSuggestions(query);
        update(state => ({
          ...state,
          suggestions
        }));
      } catch (error) {
        console.warn('[StationSearchStore] Failed to update suggestions:', error);
      }
    },
    
    /**
     * Get search history
     */
    getSearchHistory(): string[] {
      const currentState = get({ subscribe });
      return [...currentState.searchHistory];
    },
    
    /**
     * Add query to search history
     */
    addToHistory(query: string): void {
      addToSearchHistory(query);
    },
    
    /**
     * Clear search history
     */
    clearHistory(): void {
      update(state => ({
        ...state,
        searchHistory: []
      }));
      
      // Clear persisted history
      if (config.behavior.persistHistory) {
        try {
          localStorage?.removeItem('farert-search-history');
        } catch (error) {
          console.warn('[StationSearchStore] Failed to clear persisted history:', error);
        }
      }
    },
    
    /**
     * Clear all caches
     */
    clearCache(): void {
      if (cache) {
        cache.clear();
      }
      
      if (suggestionCache) {
        suggestionCache.clear();
      }
      
      updateCacheStats();
    },
    
    /**
     * Update store configuration
     */
    configure(options: Partial<StationSearchConfig>): void {
      const newConfig = {
        ...config,
        ...options,
        cache: {
          ...config.cache,
          ...options.cache
        },
        fuzzySearch: {
          ...config.fuzzySearch,
          ...options.fuzzySearch
        },
        features: {
          ...config.features,
          ...options.features
        },
        behavior: {
          ...config.behavior,
          ...options.behavior
        },
        errorHandling: {
          ...config.errorHandling,
          ...options.errorHandling
        }
      };
      
      Object.assign(config, newConfig);
      
      update(state => ({
        ...state,
        config: newConfig
      }));
      
      // Reinitialize caches if configuration changed
      if (options.cache) {
        if (newConfig.cache.enabled && !cache) {
          cache = new LRUCache({
            maxSize: newConfig.cache.maxSize,
            ttl: newConfig.cache.ttlMs
          });
          suggestionCache = new LRUCache({
            maxSize: Math.floor(newConfig.cache.maxSize / 2),
            ttl: newConfig.cache.ttlMs
          });
        } else if (!newConfig.cache.enabled && cache) {
          cache = null;
          suggestionCache = null;
        }
      }
    },
    
    /**
     * Get current configuration
     */
    getConfig(): StationSearchConfig {
      return { ...config };
    },
    
    /**
     * Retry last failed search
     */
    async retry(): Promise<void> {
      const currentState = get({ subscribe });
      if (currentState.query && currentState.error) {
        return storeAPI.searchImmediate(currentState.query);
      }
    },
    
    /**
     * Clear current error
     */
    clearError(): void {
      update(state => ({
        ...state,
        error: null
      }));
    },
    
    /**
     * Get performance metrics
     */
    getMetrics(): StationSearchState['metrics'] {
      const currentState = get({ subscribe });
      return { ...currentState.metrics };
    },
    
    /**
     * Reset performance metrics
     */
    resetMetrics(): void {
      update(state => ({
        ...state,
        searchCount: 0,
        metrics: {
          averageSearchTime: 0,
          fastestSearch: Infinity,
          slowestSearch: 0,
          lastSearchTime: 0
        }
      }));
    },
    
    /**
     * Dispose store and clean up resources
     */
    dispose(): void {
      disposed = true;
      
      if (searchTimeout) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }
      
      if (currentSearchContext) {
        currentSearchContext.abortController.abort();
        currentSearchContext = null;
      }
      
      if (cache) {
        cache.clear();
        cache = null;
      }
      
      if (suggestionCache) {
        suggestionCache.clear();
        suggestionCache = null;
      }
      
      errorManager = null;
    }
  };
  
  return storeAPI;
}

// ============================================================================
// CONVENIENCE STORE INSTANCES
// ============================================================================

/**
 * Default station search store instance
 */
export const stationSearchStore = createStationSearchStore();

/**
 * Quick search store optimized for fast, lightweight searches
 */
export const quickSearchStore = createStationSearchStore({
  debounceMs: 150,
  maxResults: 20,
  maxSuggestions: 5,
  cache: {
    enabled: true,
    maxSize: 200,
    ttlMs: 5 * 60 * 1000 // 5 minutes
  },
  features: {
    enableHistory: false,
    enableSuggestions: true,
    enablePopularStations: false,
    enableMetrics: false
  }
});

/**
 * Autocomplete store optimized for real-time input assistance
 */
export const autocompleteStore = createStationSearchStore({
  debounceMs: 100,
  minQueryLength: 1,
  maxResults: 10,
  maxSuggestions: 8,
  cache: {
    enabled: true,
    maxSize: 300,
    ttlMs: 10 * 60 * 1000 // 10 minutes
  },
  fuzzySearch: {
    enabled: true,
    minScore: 0.7, // Higher threshold for autocomplete
    enableRomanization: true,
    enableTypoTolerance: false // Less aggressive for autocomplete
  },
  features: {
    enableHistory: false,
    enableSuggestions: true,
    enablePopularStations: true,
    enableMetrics: false
  },
  behavior: {
    searchOnFocus: true,
    clearOnBlur: true,
    persistHistory: false,
    boostMajorStations: true
  }
});

// ============================================================================
// DERIVED STORES AND UTILITIES
// ============================================================================

/**
 * Derived store for search loading state
 */
export const isSearching: Readable<boolean> = derived(
  stationSearchStore,
  $store => $store.isLoading
);

/**
 * Derived store for search results
 */
export const searchResults: Readable<StationSearchResult[]> = derived(
  stationSearchStore,
  $store => $store.results
);

/**
 * Derived store for search error state
 */
export const searchError: Readable<FarertSDKError | null> = derived(
  stationSearchStore,
  $store => $store.error
);

/**
 * Derived store for search suggestions
 */
export const searchSuggestions: Readable<string[]> = derived(
  stationSearchStore,
  $store => $store.suggestions
);

/**
 * Derived store for popular stations
 */
export const popularStations: Readable<StationInfo[]> = derived(
  stationSearchStore,
  $store => $store.popularStations
);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a station search store with SDK integration
 * 
 * @param config Store configuration
 * @returns Station search store with SDK context awareness
 */
export function createContextAwareStationSearchStore(
  config: Partial<StationSearchConfig> = {}
): StationSearchStore {
  const store = createStationSearchStore(config);
  
  // Initialize popular stations when SDK becomes ready
  const sdkStores = getSDKStores();
  if (sdkStores) {
    const unsubscribe = sdkStores.isReady.subscribe(isReady => {
      if (isReady && config.features?.enablePopularStations !== false) {
        store.getPopularStations().catch(error => {
          console.warn('[StationSearchStore] Failed to load popular stations:', error);
        });
      }
    });
    
    // Clean up subscription when store is disposed
    const originalDispose = store.dispose;
    store.dispose = () => {
      unsubscribe();
      originalDispose();
    };
  }
  
  return store;
}

/**
 * Validate station search input
 * 
 * @param input Search input string
 * @returns Validation result
 */
export function validateSearchInput(input: string): StationValidationResult {
  return validateStationName(input);
}

/**
 * Format station search result for display
 * 
 * @param result Search result
 * @param context Display context
 * @returns Formatted display string
 */
export function formatSearchResult(
  result: StationSearchResult,
  context: 'search' | 'autocomplete' | 'detailed' = 'search'
): string {
  return getStationDisplayName(result.station, context);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export all types
export type {
  StationSearchState,
  StationSearchConfig,
  StationSearchStore
};

// Default export
export default stationSearchStore;