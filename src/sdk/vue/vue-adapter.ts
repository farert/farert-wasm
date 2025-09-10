/**
 * Vue Compatibility Layer for Farert Frontend API Layer SDK
 * 
 * Provides Vue 3 composables and plugin system that wrap the core SDK functionality,
 * creating a Vue-native development experience while leveraging the existing
 * Svelte-first SDK architecture.
 * 
 * This compatibility layer provides:
 * - Vue 3 Composition API integration with reactive state management
 * - Vue composables that wrap core SDK functionality  
 * - Plugin system for SDK instance registration and global access
 * - Proper Vue reactivity with ref, reactive, and computed
 * - Performance optimizations with debouncing and request cancellation
 * - TypeScript-first design with complete type safety for Vue 3+
 * - Automatic cleanup and lifecycle management with onUnmounted
 * 
 * @file Vue Adapter Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-005: Vue compatibility layer using core SDK
 * - Support Vue 3.0+ with Composition API
 * - Leverage existing src/sdk/core/farert-sdk.ts
 * - Secondary support layer (Svelte is primary)
 */

// ============================================================================
// IMPORTS AND DEPENDENCIES
// ============================================================================

import {
  ref,
  reactive,
  computed,
  watch,
  watchEffect,
  onMounted,
  onUnmounted,
  nextTick,
  inject,
  provide,
  toRefs,
  unref,
  isRef,
  type Ref,
  type ComputedRef,
  type WatchStopHandle,
  type App,
  type Plugin,
  type InjectionKey
} from 'vue';

// Core SDK imports
import { 
  createFarertSDK,
  createDevelopmentSDK,
  createProductionSDK,
  type FarertSDK,
  type SDKState,
  type SDKConfig
} from '../core/farert-sdk';

// Type imports
import type {
  StationInfo,
  StationSearchResult,
  StationSearchOptions,
  LineInfo,
  CompanyInfo,
  PrefectureInfo,
  RouteSpec,
  RouteSegment,
  FareCalculationResult,
  RouteValidationResult,
  RoutePlanResult,
  FareBreakdownItem,
  FareDiscount,
  FarertSDKError,
  FarertSDKErrorCode,
  FarertSDKEventMap,
  PerformanceMetrics
} from '../types/core';

// Utility imports
import { debounce } from '../utils/station-utils';
import { formatFare, calculateDiscountPercentage } from '../utils/fare-utils';
import { validateRouteSegments, optimizeRoute } from '../utils/route-utils';

// ============================================================================
// VUE PLUGIN SYSTEM
// ============================================================================

/**
 * Configuration for the FarertSDK Vue plugin
 */
export interface FarertSDKPluginOptions {
  /** SDK configuration */
  config?: Partial<SDKConfig>;
  
  /** Whether to use development optimized SDK */
  development?: boolean;
  
  /** Whether to use production optimized SDK */
  production?: boolean;
  
  /** Custom SDK instance (for testing) */
  customSDK?: FarertSDK;
  
  /** Whether to automatically initialize on plugin install */
  autoInitialize?: boolean;
  
  /** Global property name for accessing SDK */
  globalPropertyName?: string;
  
  /** Callback when SDK initialization completes */
  onInitialized?: (sdk: FarertSDK) => void;
  
  /** Callback when SDK initialization fails */
  onError?: (error: FarertSDKError) => void;
}

/**
 * Vue plugin state interface
 */
export interface VueSDKState {
  /** SDK instance (null when not initialized) */
  sdk: FarertSDK | null;
  
  /** Current initialization state */
  state: SDKState;
  
  /** Initialization error if any */
  error: FarertSDKError | null;
  
  /** Whether SDK is ready for use */
  isReady: boolean;
  
  /** Whether SDK is currently initializing */
  isLoading: boolean;
  
  /** SDK configuration */
  config: SDKConfig | null;
}

/**
 * Injection key for Vue dependency injection
 */
export const FarertSDKKey: InjectionKey<VueSDKState> = Symbol('FarertSDK');

/**
 * Vue 3 plugin for FarertSDK integration
 * 
 * Provides global SDK instance access and automatic initialization.
 * Registers the SDK as both an injected dependency and a global property.
 * 
 * @example Basic Plugin Registration
 * ```ts
 * import { createApp } from 'vue';
 * import { FarertSDKPlugin } from '@farert/sdk/vue';
 * import App from './App.vue';
 * 
 * const app = createApp(App);
 * 
 * app.use(FarertSDKPlugin, {
 *   autoInitialize: true,
 *   development: true
 * });
 * 
 * app.mount('#app');
 * ```
 * 
 * @example Custom Configuration
 * ```ts
 * app.use(FarertSDKPlugin, {
 *   config: {
 *     caching: { enabled: true, ttl: 600000 },
 *     performance: { trackingLevel: 'detailed' }
 *   },
 *   production: true,
 *   globalPropertyName: '$railway',
 *   onInitialized: (sdk) => console.log('Railway SDK ready'),
 *   onError: (error) => console.error('SDK error:', error)
 * });
 * ```
 * 
 * @example Component Usage
 * ```vue
 * <script setup>
 * import { useFarertSDK } from '@farert/sdk/vue';
 * 
 * const { sdk, isReady, error } = useFarertSDK();
 * 
 * // Or use global property
 * import { getCurrentInstance } from 'vue';
 * const instance = getCurrentInstance();
 * const sdk = instance?.appContext.config.globalProperties.$farert;
 * </script>
 * ```
 */
export const FarertSDKPlugin: Plugin<FarertSDKPluginOptions> = {
  install(app: App, options: FarertSDKPluginOptions = {}) {
    const {
      config,
      development = false,
      production = false,
      customSDK,
      autoInitialize = true,
      globalPropertyName = '$farert',
      onInitialized,
      onError
    } = options;

    // Create reactive state
    const state = reactive<VueSDKState>({
      sdk: customSDK || null,
      state: SDKState.UNINITIALIZED,
      error: null,
      isReady: false,
      isLoading: false,
      config: null
    });

    // SDK initialization function
    let initializationPromise: Promise<void> | null = null;
    
    const initializeSDK = async (): Promise<void> => {
      if (initializationPromise) {
        return initializationPromise;
      }

      try {
        state.state = SDKState.INITIALIZING;
        state.isLoading = true;
        state.error = null;

        // Create SDK instance
        let sdkInstance: FarertSDK;

        if (customSDK) {
          sdkInstance = customSDK;
        } else if (development) {
          sdkInstance = createDevelopmentSDK(config);
        } else if (production) {
          sdkInstance = createProductionSDK(config);
        } else {
          sdkInstance = createFarertSDK(config);
        }

        // Initialize SDK
        initializationPromise = sdkInstance.initialize();
        await initializationPromise;

        // Update state
        state.sdk = sdkInstance;
        state.state = SDKState.READY;
        state.isReady = true;
        state.isLoading = false;
        state.config = sdkInstance.config;

        // Call success callback
        if (onInitialized) {
          onInitialized(sdkInstance);
        }

      } catch (err) {
        const sdkError = err instanceof FarertSDKError ? err : new FarertSDKError(
          `SDK initialization failed: ${err instanceof Error ? err.message : String(err)}`,
          FarertSDKErrorCode.INITIALIZATION_FAILED,
          { originalError: err },
          true
        );

        state.state = SDKState.ERROR;
        state.error = sdkError;
        state.isLoading = false;

        if (onError) {
          onError(sdkError);
        }
      } finally {
        initializationPromise = null;
      }
    };

    // Provide state through dependency injection
    app.provide(FarertSDKKey, state);

    // Register global property
    app.config.globalProperties[globalPropertyName] = computed(() => state.sdk);

    // Auto-initialize if requested
    if (autoInitialize && !customSDK) {
      // Initialize after app mount
      app.mixin({
        mounted() {
          if (state.state === SDKState.UNINITIALIZED) {
            initializeSDK().catch((error) => {
              console.error('Failed to auto-initialize FarertSDK:', error);
            });
          }
        }
      });
    }

    // Cleanup on app unmount
    app.mixin({
      unmounted() {
        if (state.sdk) {
          state.sdk.dispose().catch((error) => {
            console.error('Error disposing SDK:', error);
          });
        }
      }
    });

    // Expose initialization function
    app.config.globalProperties.$initializeFarertSDK = initializeSDK;
  }
};

// ============================================================================
// CORE VUE COMPOSABLES
// ============================================================================

/**
 * Main composable to access the FarertSDK instance
 * 
 * Provides reactive access to the SDK instance and its current state.
 * Must be used within a component that has the FarertSDK plugin installed.
 * 
 * @returns Reactive SDK state and methods
 * 
 * @example Basic Usage
 * ```vue
 * <script setup>
 * import { useFarertSDK } from '@farert/sdk/vue';
 * 
 * const { sdk, isReady, error, isLoading, reinitialize } = useFarertSDK();
 * 
 * // Reactive computed properties
 * const canCalculate = computed(() => isReady.value && !error.value);
 * </script>
 * 
 * <template>
 *   <div v-if="isLoading">Loading railway system...</div>
 *   <div v-else-if="error" class="error">
 *     Error: {{ error.message }}
 *     <button @click="reinitialize">Retry</button>
 *   </div>
 *   <div v-else-if="isReady">
 *     Railway system ready!
 *   </div>
 * </template>
 * ```
 * 
 * @example Watching State Changes
 * ```vue
 * <script setup>
 * const { sdk, state, isReady } = useFarertSDK();
 * 
 * // Watch for SDK readiness
 * watch(isReady, (ready) => {
 *   if (ready) {
 *     console.log('SDK is now ready for use');
 *     // Initialize component state that depends on SDK
 *   }
 * }, { immediate: true });
 * 
 * // Watch for state changes
 * watch(state, (newState, oldState) => {
 *   console.log(`SDK state changed: ${oldState} -> ${newState}`);
 * });
 * </script>
 * ```
 */
export interface UseFarertSDKResult {
  /** Reactive SDK instance */
  readonly sdk: ComputedRef<FarertSDK | null>;
  
  /** Reactive initialization state */
  readonly state: ComputedRef<SDKState>;
  
  /** Reactive error state */
  readonly error: ComputedRef<FarertSDKError | null>;
  
  /** Reactive ready state */
  readonly isReady: ComputedRef<boolean>;
  
  /** Reactive loading state */
  readonly isLoading: ComputedRef<boolean>;
  
  /** SDK configuration */
  readonly config: ComputedRef<SDKConfig | null>;
  
  /** Reinitialize the SDK */
  reinitialize: () => Promise<void>;
}

export const useFarertSDK = (): UseFarertSDKResult => {
  const state = inject(FarertSDKKey);
  
  if (!state) {
    throw new Error(
      'useFarertSDK must be used within a component that has the FarertSDKPlugin installed. ' +
      'Please install the plugin with app.use(FarertSDKPlugin).'
    );
  }

  // Convert reactive state to computed refs for better reactivity
  const sdk = computed(() => state.sdk);
  const sdkState = computed(() => state.state);
  const error = computed(() => state.error);
  const isReady = computed(() => state.isReady);
  const isLoading = computed(() => state.isLoading);
  const config = computed(() => state.config);

  // Reinitialize function
  const reinitialize = async (): Promise<void> => {
    if (state.sdk) {
      await state.sdk.dispose();
      state.sdk = null;
      state.state = SDKState.UNINITIALIZED;
      state.error = null;
      state.isReady = false;
      state.isLoading = false;
    }

    // Re-trigger initialization
    // This would typically be handled by the plugin's initialization logic
    throw new Error('Reinitialize not implemented - please recreate the Vue app with the plugin');
  };

  return {
    sdk,
    state: sdkState,
    error,
    isReady,
    isLoading,
    config,
    reinitialize
  };
};

/**
 * Composable for station search with debounced queries and Vue reactivity
 * 
 * Provides reactive station search functionality with automatic debouncing,
 * error handling, and result caching optimized for Vue's reactivity system.
 * 
 * @param initialQuery Initial search query (can be reactive)
 * @param options Search configuration options
 * @returns Reactive station search state and methods
 * 
 * @example Basic Search
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { useStationSearch } from '@farert/sdk/vue';
 * 
 * const searchQuery = ref('');
 * 
 * const { 
 *   results, 
 *   isLoading, 
 *   error,
 *   hasMore,
 *   totalCount,
 *   loadMore,
 *   clearResults
 * } = useStationSearch(searchQuery, {
 *   debounceMs: 300,
 *   limit: 10,
 *   autoSearch: true
 * });
 * </script>
 * 
 * <template>
 *   <div>
 *     <input 
 *       v-model="searchQuery" 
 *       placeholder="駅名を入力..."
 *       class="station-search-input"
 *     />
 *     
 *     <div v-if="isLoading" class="loading">検索中...</div>
 *     <div v-if="error" class="error">エラー: {{ error.message }}</div>
 *     
 *     <div v-if="results.length > 0" class="results">
 *       <div class="result-count">{{ totalCount }}件中{{ results.length }}件表示</div>
 *       
 *       <ul class="station-list">
 *         <li 
 *           v-for="result in results" 
 *           :key="result.station.id"
 *           class="station-item"
 *         >
 *           <span class="station-name">{{ result.station.name }}</span>
 *           <span class="prefecture">({{ result.station.prefecture }})</span>
 *           <span class="score">{{ (result.score * 100).toFixed(0) }}%</span>
 *         </li>
 *       </ul>
 *       
 *       <button 
 *         v-if="hasMore" 
 *         @click="loadMore" 
 *         class="load-more"
 *         :disabled="isLoading"
 *       >
 *         さらに読み込む
 *       </button>
 *     </div>
 *     
 *     <button @click="clearResults" class="clear-button">
 *       検索結果をクリア
 *     </button>
 *   </div>
 * </template>
 * ```
 * 
 * @example Advanced Search with Filters
 * ```vue
 * <script setup>
 * const query = ref('新宿');
 * const prefecture = ref('東京都');
 * 
 * const searchOptions = computed(() => ({
 *   prefecture: prefecture.value,
 *   includeKana: true,
 *   fuzzyThreshold: 0.8,
 *   sortByPopularity: true,
 *   limit: 20
 * }));
 * 
 * const { results, isLoading, error } = useStationSearch(query, searchOptions);
 * 
 * // Watch for specific result patterns
 * watch(results, (newResults) => {
 *   console.log(`Found ${newResults.length} stations`);
 *   
 *   // Auto-select if exact match
 *   const exactMatch = newResults.find(r => r.score === 1.0);
 *   if (exactMatch && newResults.length === 1) {
 *     selectedStation.value = exactMatch.station;
 *   }
 * });
 * </script>
 * ```
 */
export interface UseStationSearchOptions extends StationSearchOptions {
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  
  /** Whether to search automatically when query changes */
  autoSearch?: boolean;
  
  /** Minimum query length to trigger search */
  minQueryLength?: number;
}

export interface UseStationSearchResult {
  /** Reactive search results */
  readonly results: Ref<StationSearchResult[]>;
  
  /** Reactive loading state */
  readonly isLoading: Ref<boolean>;
  
  /** Reactive error state */
  readonly error: Ref<FarertSDKError | null>;
  
  /** Reactive more results available state */
  readonly hasMore: Ref<boolean>;
  
  /** Reactive total count */
  readonly totalCount: Ref<number>;
  
  /** Load more results */
  loadMore: () => Promise<void>;
  
  /** Clear search results */
  clearResults: () => void;
  
  /** Manually trigger search */
  search: (newQuery?: string) => Promise<void>;
}

export const useStationSearch = (
  query: Ref<string> | string,
  options: UseStationSearchOptions | Ref<UseStationSearchOptions> = {}
): UseStationSearchResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // Normalize inputs
  const queryRef = isRef(query) ? query : ref(query);
  const optionsRef = isRef(options) ? options : ref(options);
  
  // Options with defaults
  const finalOptions = computed(() => {
    const opts = unref(optionsRef);
    return {
      debounceMs: 300,
      autoSearch: true,
      minQueryLength: 1,
      limit: 20,
      ...opts
    };
  });
  
  // State management
  const results = ref<StationSearchResult[]>([]);
  const isLoading = ref(false);
  const error = ref<FarertSDKError | null>(null);
  const hasMore = ref(false);
  const totalCount = ref(0);
  const currentOffset = ref(0);
  
  // Cache for results
  const cache = new Map<string, { results: StationSearchResult[], timestamp: number }>();
  
  // Abort controller for request cancellation
  let abortController: AbortController | null = null;
  
  // Search function
  const performSearch = async (searchQuery: string, offset = 0, append = false): Promise<void> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      return;
    }
    
    const opts = unref(finalOptions);
    
    if (searchQuery.length < opts.minQueryLength) {
      results.value = [];
      hasMore.value = false;
      totalCount.value = 0;
      return;
    }
    
    // Cancel previous search
    if (abortController) {
      abortController.abort();
    }
    
    abortController = new AbortController();
    isLoading.value = true;
    error.value = null;
    
    try {
      // Check cache first
      const cacheKey = `${searchQuery}:${offset}:${JSON.stringify(opts)}`;
      const cached = cache.get(cacheKey);
      const cacheValidMs = 60000; // 1 minute cache
      
      if (cached && Date.now() - cached.timestamp < cacheValidMs) {
        if (append) {
          results.value = [...results.value, ...cached.results];
        } else {
          results.value = cached.results;
        }
        hasMore.value = cached.results.length === opts.limit;
        totalCount.value = append ? totalCount.value + cached.results.length : cached.results.length;
        isLoading.value = false;
        return;
      }
      
      // Perform search with pagination
      const searchResults = await currentSdk.searchStations(searchQuery, {
        ...opts,
        limit: opts.limit
      });
      
      // Simple pagination simulation (in production, this would be handled by the backend)
      const paginatedResults = searchResults.slice(offset, offset + opts.limit);
      const hasMoreResults = searchResults.length > offset + opts.limit;
      
      // Cache results
      cache.set(cacheKey, {
        results: paginatedResults,
        timestamp: Date.now()
      });
      
      // Update state
      if (append) {
        results.value = [...results.value, ...paginatedResults];
        totalCount.value = Math.max(totalCount.value, searchResults.length);
      } else {
        results.value = paginatedResults;
        totalCount.value = searchResults.length;
        currentOffset.value = offset;
      }
      
      hasMore.value = hasMoreResults;
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Search was cancelled
      }
      
      const searchError = err instanceof FarertSDKError ? err : new FarertSDKError(
        `Station search failed: ${err instanceof Error ? err.message : String(err)}`,
        FarertSDKErrorCode.SEARCH_FAILED,
        { query: searchQuery, options: opts },
        true
      );
      
      error.value = searchError;
      
      if (!append) {
        results.value = [];
        hasMore.value = false;
        totalCount.value = 0;
      }
    } finally {
      isLoading.value = false;
    }
  };
  
  // Create debounced search function
  let debouncedSearch: ((searchQuery: string) => void) & { cancel: () => void };
  
  watchEffect(() => {
    const opts = unref(finalOptions);
    debouncedSearch = debounce((searchQuery: string) => {
      performSearch(searchQuery, 0, false);
    }, opts.debounceMs);
  });
  
  // Manual search function
  const search = async (newQuery?: string): Promise<void> => {
    const searchQuery = newQuery ?? unref(queryRef);
    await performSearch(searchQuery, 0, false);
  };
  
  // Load more function
  const loadMore = async (): Promise<void> => {
    if (!unref(hasMore) || unref(isLoading)) {
      return;
    }
    
    const opts = unref(finalOptions);
    const nextOffset = currentOffset.value + opts.limit;
    await performSearch(unref(queryRef), nextOffset, true);
    currentOffset.value = nextOffset;
  };
  
  // Clear results function
  const clearResults = (): void => {
    results.value = [];
    hasMore.value = false;
    totalCount.value = 0;
    currentOffset.value = 0;
    error.value = null;
    
    if (abortController) {
      abortController.abort();
    }
  };
  
  // Auto-search effect
  watchEffect(() => {
    const opts = unref(finalOptions);
    const currentQuery = unref(queryRef);
    const ready = unref(isReady);
    
    if (opts.autoSearch && ready) {
      if (currentQuery.length >= opts.minQueryLength) {
        debouncedSearch(currentQuery);
      } else {
        clearResults();
      }
    }
  });
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (abortController) {
      abortController.abort();
    }
    if (debouncedSearch) {
      debouncedSearch.cancel();
    }
  });
  
  return {
    results,
    isLoading,
    error,
    hasMore,
    totalCount,
    loadMore,
    clearResults,
    search
  };
};

/**
 * Composable for fare calculations with Vue reactivity and caching
 * 
 * Provides reactive fare calculation functionality with automatic validation,
 * caching, and comprehensive error handling optimized for Vue components.
 * 
 * @example Basic Usage
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { useFareCalculation } from '@farert/sdk/vue';
 * 
 * const route = ref("東京 東海道線 横浜");
 * 
 * const { 
 *   calculateFare, 
 *   result, 
 *   isCalculating, 
 *   error,
 *   validate,
 *   history,
 *   clearResult
 * } = useFareCalculation();
 * 
 * const handleCalculate = async () => {
 *   const validation = await validate(route.value);
 *   
 *   if (validation.isValid) {
 *     await calculateFare(route.value);
 *   } else {
 *     console.error('Invalid route:', validation.errors);
 *   }
 * };
 * 
 * // Watch for calculation results
 * watch(result, (newResult) => {
 *   if (newResult) {
 *     console.log(`Calculated fare: ${newResult.totalFare}円`);
 *   }
 * });
 * </script>
 * 
 * <template>
 *   <div>
 *     <input v-model="route" placeholder="ルートを入力..." />
 *     
 *     <button 
 *       @click="handleCalculate" 
 *       :disabled="isCalculating || !route"
 *       class="calculate-button"
 *     >
 *       {{ isCalculating ? '計算中...' : '運賃計算' }}
 *     </button>
 *     
 *     <div v-if="error" class="error">
 *       エラー: {{ error.message }}
 *     </div>
 *     
 *     <div v-if="result" class="result">
 *       <h3>計算結果</h3>
 *       <p>運賃: {{ formatFare(result.totalFare) }}円</p>
 *       <p>距離: {{ result.route.totalDistance }}km</p>
 *       <p>所要時間: {{ result.route.estimatedTime }}分</p>
 *       
 *       <button @click="clearResult">結果をクリア</button>
 *     </div>
 *     
 *     <div v-if="history.length > 0" class="history">
 *       <h3>計算履歴 ({{ history.length }}件)</h3>
 *       <ul>
 *         <li v-for="(item, index) in history" :key="index">
 *           {{ item.route.description }} - {{ formatFare(item.totalFare) }}円
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export interface UseFareCalculationResult {
  /** Calculate fare for route */
  calculateFare: (route: RouteSpec) => Promise<FareCalculationResult | null>;
  
  /** Reactive latest calculation result */
  readonly result: Ref<FareCalculationResult | null>;
  
  /** Reactive calculation in progress state */
  readonly isCalculating: Ref<boolean>;
  
  /** Reactive calculation error state */
  readonly error: Ref<FarertSDKError | null>;
  
  /** Validate route before calculation */
  validate: (route: RouteSpec) => Promise<RouteValidationResult>;
  
  /** Clear current result */
  clearResult: () => void;
  
  /** Reactive calculation history */
  readonly history: Ref<FareCalculationResult[]>;
  
  /** Clear calculation history */
  clearHistory: () => void;
}

export const useFareCalculation = (): UseFareCalculationResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // State management
  const result = ref<FareCalculationResult | null>(null);
  const isCalculating = ref(false);
  const error = ref<FarertSDKError | null>(null);
  const history = ref<FareCalculationResult[]>([]);
  
  // Calculate fare function
  const calculateFare = async (route: RouteSpec): Promise<FareCalculationResult | null> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      throw new Error('SDK not ready for fare calculation');
    }
    
    isCalculating.value = true;
    error.value = null;
    
    try {
      const calculationResult = await currentSdk.calculateFare(route);
      
      result.value = calculationResult;
      history.value = [calculationResult, ...history.value.slice(0, 9)]; // Keep last 10 results
      
      return calculationResult;
      
    } catch (err) {
      const fareError = err instanceof FarertSDKError ? err : new FarertSDKError(
        `Fare calculation failed: ${err instanceof Error ? err.message : String(err)}`,
        FarertSDKErrorCode.CALCULATION_FAILED,
        { route },
        true
      );
      
      error.value = fareError;
      return null;
      
    } finally {
      isCalculating.value = false;
    }
  };
  
  // Validate route function
  const validate = async (route: RouteSpec): Promise<RouteValidationResult> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      throw new Error('SDK not ready for route validation');
    }
    
    try {
      return await currentSdk.validateRoute(route);
    } catch (err) {
      // Return validation failure result
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_FAILED',
          message: err instanceof Error ? err.message : String(err),
          field: 'route',
          severity: 'error'
        }],
        warnings: [],
        suggestions: []
      };
    }
  };
  
  // Clear result function
  const clearResult = (): void => {
    result.value = null;
    error.value = null;
  };
  
  // Clear history function
  const clearHistory = (): void => {
    history.value = [];
  };
  
  return {
    calculateFare,
    result,
    isCalculating,
    error,
    validate,
    clearResult,
    history,
    clearHistory
  };
};

/**
 * Composable for building routes with Vue reactivity and validation
 * 
 * Provides reactive route building functionality with step-by-step validation,
 * optimization suggestions, and real-time feedback optimized for Vue components.
 * 
 * @example Route Builder Component
 * ```vue
 * <script setup>
 * import { ref, computed } from 'vue';
 * import { useRouteBuilder } from '@farert/sdk/vue';
 * 
 * const { 
 *   segments, 
 *   addStation, 
 *   removeStation, 
 *   insertStation,
 *   clearRoute, 
 *   validate, 
 *   validation,
 *   isValidating,
 *   getOptimizationSuggestions,
 *   toRouteSpec,
 *   fromRouteSpec
 * } = useRouteBuilder();
 * 
 * const newStationId = ref('');
 * const newLineId = ref('');
 * 
 * const isValidRoute = computed(() => 
 *   validation.value?.isValid ?? false
 * );
 * 
 * const handleAddStation = async () => {
 *   if (newStationId.value) {
 *     await addStation(
 *       parseInt(newStationId.value), 
 *       newLineId.value ? parseInt(newLineId.value) : undefined
 *     );
 *     newStationId.value = '';
 *     newLineId.value = '';
 *   }
 * };
 * 
 * const handleOptimize = async () => {
 *   const suggestions = await getOptimizationSuggestions();
 *   console.log('Optimization suggestions:', suggestions);
 * };
 * 
 * // Watch for route changes and auto-validate
 * watch(segments, () => {
 *   if (segments.value.length >= 2) {
 *     validate();
 *   }
 * }, { deep: true });
 * </script>
 * 
 * <template>
 *   <div class="route-builder">
 *     <h2>ルート作成</h2>
 *     
 *     <!-- Route segments display -->
 *     <div v-if="segments.length > 0" class="current-route">
 *       <h3>現在のルート</h3>
 *       <ol class="route-segments">
 *         <li 
 *           v-for="(segment, index) in segments" 
 *           :key="index"
 *           class="route-segment"
 *         >
 *           <span class="station-name">{{ segment.stationName }}</span>
 *           <span v-if="segment.isTransfer" class="transfer-indicator">乗換</span>
 *           <button @click="removeStation(index)" class="remove-button">削除</button>
 *         </li>
 *       </ol>
 *       
 *       <div class="route-actions">
 *         <button @click="clearRoute" class="clear-button">ルートをクリア</button>
 *         <button @click="handleOptimize" class="optimize-button">最適化提案</button>
 *       </div>
 *     </div>
 *     
 *     <!-- Add station form -->
 *     <div class="add-station">
 *       <h3>駅を追加</h3>
 *       <div class="form-group">
 *         <input 
 *           v-model="newStationId" 
 *           type="number" 
 *           placeholder="駅ID"
 *           class="station-input"
 *         />
 *         <input 
 *           v-model="newLineId" 
 *           type="number" 
 *           placeholder="路線ID (任意)"
 *           class="line-input"
 *         />
 *         <button 
 *           @click="handleAddStation"
 *           :disabled="!newStationId"
 *           class="add-button"
 *         >
 *           追加
 *         </button>
 *       </div>
 *     </div>
 *     
 *     <!-- Validation results -->
 *     <div v-if="validation" class="validation">
 *       <div v-if="isValidating" class="validating">検証中...</div>
 *       
 *       <div v-else-if="validation.isValid" class="valid">
 *         ✅ 有効なルートです
 *       </div>
 *       
 *       <div v-else class="invalid">
 *         ❌ 無効なルートです
 *         <ul class="errors">
 *           <li v-for="error in validation.errors" :key="error.code">
 *             {{ error.message }}
 *           </li>
 *         </ul>
 *         
 *         <div v-if="validation.suggestions.length > 0" class="suggestions">
 *           <h4>提案:</h4>
 *           <ul>
 *             <li v-for="suggestion in validation.suggestions" :key="suggestion">
 *               {{ suggestion }}
 *             </li>
 *           </ul>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export interface UseRouteBuilderResult {
  /** Reactive route segments */
  readonly segments: Ref<RouteSegment[]>;
  
  /** Add station to route */
  addStation: (stationId: number, lineId?: number) => Promise<void>;
  
  /** Remove station from route */
  removeStation: (index: number) => void;
  
  /** Insert station at specific position */
  insertStation: (index: number, stationId: number, lineId?: number) => Promise<void>;
  
  /** Clear all segments */
  clearRoute: () => void;
  
  /** Validate current route */
  validate: () => Promise<RouteValidationResult>;
  
  /** Get route optimization suggestions */
  getOptimizationSuggestions: () => Promise<string[]>;
  
  /** Reactive validation in progress state */
  readonly isValidating: Ref<boolean>;
  
  /** Reactive current validation result */
  readonly validation: Ref<RouteValidationResult | null>;
  
  /** Convert to route specification */
  toRouteSpec: () => RouteSpec;
  
  /** Build from route specification */
  fromRouteSpec: (route: RouteSpec) => Promise<void>;
}

export const useRouteBuilder = (): UseRouteBuilderResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // State management
  const segments = ref<RouteSegment[]>([]);
  const isValidating = ref(false);
  const validation = ref<RouteValidationResult | null>(null);
  
  // Add station function
  const addStation = async (stationId: number, lineId?: number): Promise<void> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      return;
    }
    
    try {
      const stationInfo = await currentSdk.getStationById(stationId);
      if (!stationInfo) {
        throw new Error(`Station with ID ${stationId} not found`);
      }
      
      const newSegment: RouteSegment = {
        stationId,
        stationName: stationInfo.name,
        lineId,
        isTransfer: segments.value.length > 0 // First station is not a transfer
      };
      
      segments.value.push(newSegment);
      
    } catch (err) {
      console.error('Failed to add station:', err);
    }
  };
  
  // Remove station function
  const removeStation = (index: number): void => {
    segments.value.splice(index, 1);
  };
  
  // Insert station function
  const insertStation = async (index: number, stationId: number, lineId?: number): Promise<void> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      return;
    }
    
    try {
      const stationInfo = await currentSdk.getStationById(stationId);
      if (!stationInfo) {
        throw new Error(`Station with ID ${stationId} not found`);
      }
      
      const newSegment: RouteSegment = {
        stationId,
        stationName: stationInfo.name,
        lineId,
        isTransfer: index > 0 // First station is not a transfer
      };
      
      segments.value.splice(index, 0, newSegment);
      
    } catch (err) {
      console.error('Failed to insert station:', err);
    }
  };
  
  // Clear route function
  const clearRoute = (): void => {
    segments.value = [];
    validation.value = null;
  };
  
  // Validate route function
  const validate = async (): Promise<RouteValidationResult> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      const result = {
        isValid: false,
        errors: [{ code: 'SDK_NOT_READY', message: 'SDK not ready', field: 'sdk', severity: 'error' as const }],
        warnings: [],
        suggestions: []
      };
      validation.value = result;
      return result;
    }
    
    if (segments.value.length < 2) {
      const result = {
        isValid: false,
        errors: [{ code: 'INSUFFICIENT_STATIONS', message: 'At least 2 stations required', field: 'segments', severity: 'error' as const }],
        warnings: [],
        suggestions: ['Add more stations to create a valid route']
      };
      validation.value = result;
      return result;
    }
    
    isValidating.value = true;
    
    try {
      const result = await currentSdk.validateRoute(segments.value);
      validation.value = result;
      return result;
      
    } catch (err) {
      const result = {
        isValid: false,
        errors: [{ code: 'VALIDATION_ERROR', message: String(err), field: 'route', severity: 'error' as const }],
        warnings: [],
        suggestions: []
      };
      validation.value = result;
      return result;
      
    } finally {
      isValidating.value = false;
    }
  };
  
  // Get optimization suggestions function
  const getOptimizationSuggestions = async (): Promise<string[]> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready || segments.value.length < 2) {
      return [];
    }
    
    try {
      // This would use the SDK to analyze the route and provide suggestions
      // For now, return basic suggestions based on route characteristics
      const suggestions: string[] = [];
      
      if (segments.value.length > 5) {
        suggestions.push('Consider using express trains for long-distance segments');
      }
      
      if (segments.value.some(s => s.isTransfer)) {
        suggestions.push('Review transfer stations for optimization opportunities');
      }
      
      return suggestions;
      
    } catch (err) {
      console.error('Failed to get optimization suggestions:', err);
      return [];
    }
  };
  
  // Convert to route spec function
  const toRouteSpec = (): RouteSpec => {
    return segments.value;
  };
  
  // Build from route spec function
  const fromRouteSpec = async (route: RouteSpec): Promise<void> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      return;
    }
    
    try {
      if (typeof route === 'string') {
        // Parse route string - this would need to be implemented based on the expected format
        // For now, just clear the route
        clearRoute();
        return;
      }
      
      if (Array.isArray(route)) {
        segments.value = [...route];
        return;
      }
      
      // Handle object format
      const newSegments: RouteSegment[] = [];
      
      // Add start station
      const startStationInfo = await currentSdk.getStationById(
        typeof route.start === 'string' ? route.start : route.start
      );
      if (startStationInfo) {
        newSegments.push({
          stationId: startStationInfo.id,
          stationName: startStationInfo.name,
          isTransfer: false
        });
      }
      
      // Add via stations
      if (route.via) {
        for (const via of route.via) {
          const viaStationInfo = await currentSdk.getStationById(
            typeof via === 'string' ? via : via
          );
          if (viaStationInfo) {
            newSegments.push({
              stationId: viaStationInfo.id,
              stationName: viaStationInfo.name,
              isTransfer: true
            });
          }
        }
      }
      
      // Add end station
      const endStationInfo = await currentSdk.getStationById(
        typeof route.end === 'string' ? route.end : route.end
      );
      if (endStationInfo) {
        newSegments.push({
          stationId: endStationInfo.id,
          stationName: endStationInfo.name,
          isTransfer: newSegments.length > 0
        });
      }
      
      segments.value = newSegments;
      
    } catch (err) {
      console.error('Failed to build route from spec:', err);
    }
  };
  
  // Auto-validate when segments change
  let validationTimeout: NodeJS.Timeout | null = null;
  
  watch(segments, () => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    if (segments.value.length >= 2) {
      validationTimeout = setTimeout(() => {
        validate();
      }, 500); // Debounce validation
    } else {
      validation.value = null;
    }
  }, { deep: true });
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
  });
  
  return {
    segments,
    addStation,
    removeStation,
    insertStation,
    clearRoute,
    validate,
    getOptimizationSuggestions,
    isValidating,
    validation,
    toRouteSpec,
    fromRouteSpec
  };
};

/**
 * Composable for accessing reference data (companies, prefectures, lines)
 * 
 * Provides cached access to railway reference data with automatic loading,
 * refresh capabilities, and Vue reactivity.
 * 
 * @example Basic Usage
 * ```vue
 * <script setup>
 * import { computed } from 'vue';
 * import { useReferenceData } from '@farert/sdk/vue';
 * 
 * const { 
 *   companies, 
 *   prefectures, 
 *   lines,
 *   isLoading,
 *   error,
 *   refresh,
 *   getCompany,
 *   getPrefecture,
 *   getLine
 * } = useReferenceData();
 * 
 * // Computed derived data
 * const jrCompanies = computed(() => 
 *   companies.value.filter(c => c.type === 'JR')
 * );
 * 
 * const privateCompanies = computed(() => 
 *   companies.value.filter(c => c.type === 'PRIVATE')
 * );
 * 
 * // Get specific data
 * const getCompanyName = (id: number) => {
 *   return getCompany(id)?.name || 'Unknown Company';
 * };
 * </script>
 * 
 * <template>
 *   <div class="reference-data">
 *     <div v-if="isLoading">Loading reference data...</div>
 *     <div v-else-if="error">Error: {{ error.message }}</div>
 *     <div v-else>
 *       <section class="companies">
 *         <h2>Railway Companies ({{ companies.length }})</h2>
 *         
 *         <div class="company-section">
 *           <h3>JR Companies ({{ jrCompanies.length }})</h3>
 *           <ul>
 *             <li v-for="company in jrCompanies" :key="company.id">
 *               {{ company.name }} ({{ company.lines.length }} lines)
 *             </li>
 *           </ul>
 *         </div>
 *         
 *         <div class="company-section">
 *           <h3>Private Companies ({{ privateCompanies.length }})</h3>
 *           <ul>
 *             <li v-for="company in privateCompanies" :key="company.id">
 *               {{ company.name }} ({{ company.lines.length }} lines)
 *             </li>
 *           </ul>
 *         </div>
 *       </section>
 *       
 *       <section class="prefectures">
 *         <h2>Prefectures ({{ prefectures.length }})</h2>
 *         <ul>
 *           <li v-for="prefecture in prefectures" :key="prefecture.id">
 *             {{ prefecture.name }} - {{ prefecture.stationCount }} stations
 *           </li>
 *         </ul>
 *       </section>
 *       
 *       <button @click="refresh" :disabled="isLoading">
 *         Refresh Data
 *       </button>
 *     </div>
 *   </div>
 * </template>
 * ```
 */
export interface UseReferenceDataResult {
  /** Reactive companies list */
  readonly companies: Ref<CompanyInfo[]>;
  
  /** Reactive prefectures list */
  readonly prefectures: Ref<PrefectureInfo[]>;
  
  /** Reactive lines list */
  readonly lines: Ref<LineInfo[]>;
  
  /** Reactive loading state */
  readonly isLoading: Ref<boolean>;
  
  /** Reactive error state */
  readonly error: Ref<FarertSDKError | null>;
  
  /** Refresh all data */
  refresh: () => Promise<void>;
  
  /** Get company by ID */
  getCompany: (companyId: number) => CompanyInfo | null;
  
  /** Get prefecture by ID */
  getPrefecture: (prefectureId: number) => PrefectureInfo | null;
  
  /** Get line by ID */
  getLine: (lineId: number) => LineInfo | null;
}

export const useReferenceData = (): UseReferenceDataResult => {
  const { sdk, isReady } = useFarertSDK();
  
  // State management
  const companies = ref<CompanyInfo[]>([]);
  const prefectures = ref<PrefectureInfo[]>([]);
  const lines = ref<LineInfo[]>([]);
  const isLoading = ref(false);
  const error = ref<FarertSDKError | null>(null);
  
  // Load data function
  const loadData = async (): Promise<void> => {
    const currentSdk = unref(sdk);
    const ready = unref(isReady);
    
    if (!currentSdk || !ready) {
      return;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const [companiesData, prefecturesData, linesData] = await Promise.all([
        currentSdk.getCompanies(),
        currentSdk.getPrefectures(),
        currentSdk.getLines()
      ]);
      
      companies.value = companiesData;
      prefectures.value = prefecturesData;
      lines.value = linesData;
      
    } catch (err) {
      const referenceError = err instanceof FarertSDKError ? err : new FarertSDKError(
        `Failed to load reference data: ${err instanceof Error ? err.message : String(err)}`,
        FarertSDKErrorCode.DATA_LOAD_FAILED,
        { operation: 'loadReferenceData' },
        true
      );
      
      error.value = referenceError;
      
    } finally {
      isLoading.value = false;
    }
  };
  
  // Refresh function
  const refresh = async (): Promise<void> => {
    await loadData();
  };
  
  // Get company function
  const getCompany = (companyId: number): CompanyInfo | null => {
    return companies.value.find(c => c.id === companyId) || null;
  };
  
  // Get prefecture function
  const getPrefecture = (prefectureId: number): PrefectureInfo | null => {
    return prefectures.value.find(p => p.id === prefectureId) || null;
  };
  
  // Get line function
  const getLine = (lineId: number): LineInfo | null => {
    return lines.value.find(l => l.id === lineId) || null;
  };
  
  // Load data when SDK becomes ready
  watchEffect(() => {
    const ready = unref(isReady);
    if (ready && 
        companies.value.length === 0 && 
        prefectures.value.length === 0 && 
        lines.value.length === 0 && 
        !isLoading.value) {
      loadData();
    }
  });
  
  return {
    companies,
    prefectures,
    lines,
    isLoading,
    error,
    refresh,
    getCompany,
    getPrefecture,
    getLine
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  FarertSDKPluginOptions,
  VueSDKState,
  UseFarertSDKResult,
  UseStationSearchOptions,
  UseStationSearchResult,
  UseFareCalculationResult,
  UseRouteBuilderResult,
  UseReferenceDataResult
};

// Default export for convenience
export default FarertSDKPlugin;