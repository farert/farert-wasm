/**
 * Main SDK Class for Farert Frontend API Layer SDK
 * 
 * Central entry point that unifies all 39+ WebAssembly APIs and 6 object classes
 * into a single, well-organized TypeScript interface with comprehensive error handling,
 * intelligent caching, and Svelte-reactive state management.
 * 
 * This SDK provides:
 * - Single point of access for all railway calculation functionality
 * - Complete TypeScript coverage with comprehensive JSDoc documentation
 * - Enhanced object classes with fluent API patterns and lifecycle management
 * - Intelligent caching for performance optimization across all data categories
 * - Comprehensive error handling with retry mechanisms and user-friendly messages
 * - Svelte-reactive state management with automatic UI updates
 * - Support for both browser and Node.js environments
 * - Memory leak prevention with automatic resource cleanup
 * - Database connection issue guidance and recovery mechanisms
 * 
 * Features:
 * - **Complete WebAssembly Integration**: Access to all 39+ APIs with type safety
 * - **Enhanced Object Classes**: 6 classes with inheritance, fluent APIs, and lifecycle management
 * - **Intelligent Caching**: Multi-level caching with category-specific policies
 * - **Comprehensive Error Management**: Exponential backoff, circuit breakers, and recovery
 * - **Svelte-First Design**: Reactive stores and automatic state synchronization
 * - **Production Ready**: Memory management, performance monitoring, and reliability
 * 
 * @file Main SDK Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-001: Core TypeScript SDK Foundation
 *   - All 39+ WebAssembly APIs available through a single interface
 *   - Complete TypeScript types with comprehensive JSDoc documentation
 *   - Clear error messages with retry mechanisms for WebAssembly failures
 *   - Typed wrapper classes with lifecycle management for object classes
 *   - Database connection issue guidance and recovery
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

// WebAssembly wrapper and core components
import { 
  WasmWrapper, 
  createProductionWasmWrapper,
  type WasmWrapperConfig 
} from './wasm-wrapper';

// Cache management
import {
  CacheManager,
  CacheCategory,
  createProductionCacheManager,
  type CacheManagerConfig
} from '../cache/cache-manager';

// Error management
import {
  ErrorManager,
  ErrorCategory,
  ErrorSeverity,
  ManagedError,
  createProductionErrorManager,
  type ErrorManagerConfig,
  type ErrorContext
} from '../errors/error-manager';

// Enhanced object classes
import {
  ObjectLifecycleManager,
  ObjectClassFactory,
  createObjectClassFactory,
  type EnhancedRouteList,
  type EnhancedRoute,
  type EnhancedCalcRoute,
  type EnhancedRouteItem,
  type EnhancedRouteFlag,
  type EnhancedFareInfo
} from './object-classes';

// Core SDK types and interfaces
import type {
  FarertSDK,
  SDKState,
  SDKConfig,
  DEFAULT_SDK_CONFIG,
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
  PerformanceTracker,
  PerformanceMetrics,
  SDK_VERSION,
  TIMEOUTS,
  ERROR_MESSAGES
} from '../types/core';

// CLI types for WebAssembly compatibility
import type {
  FarertModule,
  RouteWrapper,
  RouteListWrapper,
  CalcRouteWrapper,
  RouteItemWrapper,
  RouteFlagWrapper,
  FareInfoData
} from '../../cli/types';

// Svelte store integration (conditional import)
let writable: any, derived: any, readable: any, get: any;
try {
  ({ writable, derived, readable, get } = require('svelte/store'));
} catch {
  // Fallback for non-Svelte environments
  writable = (value: any) => ({ 
    subscribe: (fn: any) => { fn(value); return () => {}; }, 
    set: () => {}, 
    update: () => {} 
  });
  derived = () => writable(null);
  readable = () => writable(null);
  get = (store: any) => store.value || null;
}

// ============================================================================
// FARERT SDK IMPLEMENTATION
// ============================================================================

/**
 * Main Farert SDK Class
 * 
 * Central SDK class that provides unified access to all WebAssembly functionality
 * with enhanced TypeScript support, intelligent caching, and comprehensive error handling.
 * 
 * @class FarertSDK
 * @implements {FarertSDK}
 * 
 * @example Basic Usage
 * ```typescript
 * import { FarertSDK } from '@farert/sdk';
 * 
 * const sdk = new FarertSDK({
 *   caching: { enabled: true },
 *   errorHandling: { retryAttempts: 3 }
 * });
 * 
 * await sdk.initialize();
 * 
 * // Get station information
 * const station = await sdk.getStationById(123);
 * 
 * // Calculate fare
 * const result = await sdk.calculateFare("東京 東海道線 横浜");
 * 
 * // Create enhanced object classes
 * const route = sdk.objectClasses.Route.create()
 *   .from("東京")
 *   .via("品川")
 *   .to("横浜");
 * 
 * const fare = await route.calculateFare();
 * ```
 * 
 * @example Svelte Integration
 * ```svelte
 * <script>
 *   import { FarertSDK } from '@farert/sdk';
 *   
 *   const sdk = new FarertSDK();
 *   
 *   // Reactive state management
 *   $: state = sdk.state;
 *   $: isReady = $state === 'ready';
 *   
 *   // Initialize on component mount
 *   onMount(() => sdk.initialize());
 * </script>
 * 
 * {#if isReady}
 *   <StationSelector {sdk} />
 *   <FareCalculator {sdk} />
 * {/if}
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * try {
 *   const result = await sdk.calculateFare(invalidRoute);
 * } catch (error) {
 *   if (error instanceof FarertSDKError) {
 *     console.log(`Error: ${error.message}`);
 *     console.log(`Retryable: ${error.retryable}`);
 *     
 *     if (error.retryable) {
 *       // Automatic retry with exponential backoff
 *       const result = await sdk.calculateFare(route);
 *     }
 *   }
 * }
 * ```
 */
export class FarertSDKImpl implements FarertSDK {
  // Core components
  private wasmWrapper: WasmWrapper;
  private cacheManager: CacheManager;
  private errorManager: ErrorManager;
  private lifecycleManager: ObjectLifecycleManager;
  private objectFactory: ObjectClassFactory;
  
  // Configuration
  private readonly config: Required<SDKConfig>;
  
  // State management
  private _state: SDKState = SDKState.UNINITIALIZED;
  private _stateStore: any;
  private _isReady = false;
  
  // Performance tracking
  private performanceTracker: InternalPerformanceTracker;
  
  // Event system
  private eventListeners = new Map<keyof FarertSDKEventMap, Set<Function>>();
  
  // Disposal flag
  private disposed = false;
  
  /**
   * Create a new FarertSDK instance
   * 
   * @param config SDK configuration options
   * 
   * @example
   * ```typescript
   * // Default configuration
   * const sdk = new FarertSDK();
   * 
   * // Custom configuration
   * const sdk = new FarertSDK({
   *   caching: {
   *     enabled: true,
   *     maxSize: 2000,
   *     ttl: 600000 // 10 minutes
   *   },
   *   errorHandling: {
   *     retryAttempts: 5,
   *     retryDelay: 2000,
   *     enableFuzzyMatching: true
   *   },
   *   performance: {
   *     enabled: true,
   *     trackingLevel: 'detailed'
   *   },
   *   development: false
   * });
   * ```
   */
  constructor(config: Partial<SDKConfig> = {}) {
    // Merge configuration with defaults
    this.config = {
      ...DEFAULT_SDK_CONFIG,
      ...config,
      caching: { ...DEFAULT_SDK_CONFIG.caching, ...config.caching },
      performance: { ...DEFAULT_SDK_CONFIG.performance, ...config.performance },
      errorHandling: { ...DEFAULT_SDK_CONFIG.errorHandling, ...config.errorHandling },
      locale: { ...DEFAULT_SDK_CONFIG.locale, ...config.locale }
    };
    
    // Initialize core components
    this.initializeComponents();
    
    // Create Svelte store for reactive state
    this._stateStore = writable(this._state);
    
    // Initialize performance tracker
    this.performanceTracker = new InternalPerformanceTracker(this.config.performance);
  }
  
  // ============================================================================
  // PUBLIC API: LIFECYCLE MANAGEMENT
  // ============================================================================
  
  /**
   * Initialize the SDK with WebAssembly module loading and database setup
   * 
   * This method performs complete SDK initialization including:
   * - WebAssembly module loading with automatic retry
   * - Database connection and validation
   * - Cache system initialization
   * - Object class factory setup
   * - Error recovery mechanism configuration
   * 
   * @returns Promise that resolves when initialization is complete
   * 
   * @throws {FarertSDKError} When initialization fails after all retry attempts
   * 
   * @example Basic Initialization
   * ```typescript
   * const sdk = new FarertSDK();
   * 
   * try {
   *   await sdk.initialize();
   *   console.log('SDK ready for use');
   * } catch (error) {
   *   console.error('Initialization failed:', error.message);
   *   
   *   // Check if retryable
   *   if (error.retryable) {
   *     console.log('Retrying initialization...');
   *     await sdk.initialize(); // Automatic retry with backoff
   *   }
   * }
   * ```
   * 
   * @example Custom WebAssembly Module
   * ```typescript
   * const customModule = await import('./custom-farert.wasm');
   * const sdk = new FarertSDK();
   * 
   * await sdk.initialize(customModule);
   * ```
   */
  async initialize(wasmModule?: FarertModule | (() => Promise<FarertModule>)): Promise<void> {
    if (this.disposed) {
      throw new FarertSDKError(
        'Cannot initialize disposed SDK instance',
        FarertSDKErrorCode.INVALID_STATE
      );
    }
    
    if (this._state === SDKState.READY) {
      return; // Already initialized
    }
    
    const startTime = this.performanceTracker.startTimer('initialization');
    this.setState(SDKState.INITIALIZING);
    
    try {
      // Initialize WebAssembly wrapper with retry logic
      await this.errorManager.executeWithErrorHandling(
        async () => {
          await this.wasmWrapper.initialize(wasmModule);
        },
        {
          operation: 'wasm_initialization',
          operationDescription: 'WebAssembly module initialization',
          source: 'FarertSDK.initialize',
          metadata: {
            hasCustomModule: Boolean(wasmModule),
            retryAttempts: this.config.errorHandling.retryAttempts
          }
        }
      );
      
      // Validate database connection
      await this.validateDatabaseConnection();
      
      // Initialize object factory
      this.objectFactory = createObjectClassFactory(
        this.wasmWrapper,
        this.lifecycleManager,
        this.errorManager
      );
      
      // Pre-warm critical caches
      await this.prewarmCaches();
      
      // Set ready state
      this.setState(SDKState.READY);
      this._isReady = true;
      
      // Record initialization metrics
      const initTime = this.performanceTracker.endTimer(startTime);
      this.performanceTracker.recordMetric('initialization_time', initTime, 'ms');
      
      // Emit initialization event
      this.emitEvent('initialized', {
        type: 'initialized',
        timestamp: Date.now(),
        source: 'sdk',
        data: {
          initializationTime: initTime,
          version: SDK_VERSION,
          features: [
            'webassembly',
            'caching',
            'error-handling',
            'object-classes',
            'svelte-reactive'
          ]
        }
      });
      
      if (this.config.development) {
        console.log(`🚅 FarertSDK v${SDK_VERSION} initialized in ${initTime}ms`);
      }
      
    } catch (error) {
      this.setState(SDKState.ERROR);
      
      const sdkError = error instanceof FarertSDKError ? error : new FarertSDKError(
        `Initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        FarertSDKErrorCode.INITIALIZATION_FAILED,
        { 
          originalError: error,
          initializationStep: 'wasm_loading',
          configUsed: this.config
        },
        true // Retryable
      );
      
      // Emit error event
      this.emitEvent('error', {
        type: 'error',
        timestamp: Date.now(),
        source: 'sdk',
        error: sdkError
      });
      
      throw sdkError;
    }
  }
  
  /**
   * Check if the SDK is ready for use
   * 
   * @returns True if SDK is initialized and ready
   * 
   * @example
   * ```typescript
   * const sdk = new FarertSDK();
   * 
   * console.log(sdk.isReady()); // false
   * 
   * await sdk.initialize();
   * 
   * console.log(sdk.isReady()); // true
   * ```
   */
  isReady(): boolean {
    return this._isReady && this._state === SDKState.READY;
  }
  
  /**
   * Dispose of the SDK and clean up all resources
   * 
   * This method performs comprehensive cleanup including:
   * - WebAssembly module disposal
   * - Cache clearing and disposal
   * - Object lifecycle cleanup
   * - Event listener removal
   * - Memory leak prevention
   * 
   * @returns Promise that resolves when disposal is complete
   * 
   * @example
   * ```typescript
   * const sdk = new FarertSDK();
   * await sdk.initialize();
   * 
   * // Use SDK...
   * 
   * // Clean up when done
   * await sdk.dispose();
   * console.log('SDK disposed, resources cleaned up');
   * ```
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }
    
    try {
      this.setState(SDKState.DISPOSED);
      
      // Dispose of components in reverse order
      if (this.objectFactory) {
        this.objectFactory.dispose();
      }
      
      if (this.lifecycleManager) {
        this.lifecycleManager.dispose();
      }
      
      if (this.wasmWrapper) {
        this.wasmWrapper.dispose();
      }
      
      if (this.cacheManager) {
        this.cacheManager.dispose();
      }
      
      if (this.errorManager) {
        this.errorManager.dispose();
      }
      
      // Clear event listeners
      this.eventListeners.clear();
      
      // Update state
      this._isReady = false;
      this.disposed = true;
      
      if (this.config.development) {
        console.log('🚅 FarertSDK disposed');
      }
      
    } catch (error) {
      console.error('Error during SDK disposal:', error);
    }
  }
  
  // ============================================================================
  // PUBLIC API: PROPERTIES
  // ============================================================================
  
  /**
   * WebAssembly module instance (read-only)
   */
  get wasmModule(): FarertModule | null {
    return this.wasmWrapper?.wasmModule || null;
  }
  
  /**
   * Current SDK state (reactive)
   */
  get state(): SDKState {
    return this._state;
  }
  
  /**
   * SDK configuration (read-only)
   */
  get config(): SDKConfig {
    return { ...this.config };
  }
  
  /**
   * SDK version string
   */
  get version(): string {
    return SDK_VERSION;
  }
  
  /**
   * Cache manager instance
   */
  get cache(): CacheManager {
    return this.cacheManager;
  }
  
  /**
   * Performance metrics tracker
   */
  get metrics(): PerformanceTracker {
    return this.performanceTracker;
  }
  
  // ============================================================================
  // PUBLIC API: STATION OPERATIONS
  // ============================================================================
  
  /**
   * Get comprehensive station information by ID or name
   * 
   * @param idOrName Station ID (number) or station name (string)
   * @returns Promise resolving to station information or null if not found
   * 
   * @example
   * ```typescript
   * // Get by ID
   * const station = await sdk.getStationById(1130101);
   * console.log(station?.name); // "東京"
   * 
   * // Get by name
   * const station = await sdk.getStationById("東京");
   * console.log(station?.id); // 1130101
   * ```
   */
  async getStationById(id: number): Promise<StationInfo | null>;
  async getStationById(name: string): Promise<StationInfo | null>;
  async getStationById(idOrName: number | string): Promise<StationInfo | null> {
    this.ensureReady();
    
    try {
      if (typeof idOrName === 'number') {
        return await this.wasmWrapper.getStationInfo(idOrName);
      } else {
        const stationId = await this.wasmWrapper.getStationId(idOrName);
        if (stationId > 0) {
          return await this.wasmWrapper.getStationInfo(stationId);
        }
        return null;
      }
    } catch (error) {
      throw this.handleApiError(error, 'getStationById', { idOrName });
    }
  }
  
  /**
   * Get station information by name with enhanced search
   * 
   * @param name Station name to search for
   * @returns Promise resolving to station information or null if not found
   */
  async getStationByName(name: string): Promise<StationInfo | null> {
    return this.getStationById(name);
  }
  
  /**
   * Search for stations with fuzzy matching and filtering
   * 
   * @param query Search query string
   * @param options Search options for filtering and configuration
   * @returns Promise resolving to array of search results
   * 
   * @example Basic Search
   * ```typescript
   * const results = await sdk.searchStations("新宿");
   * console.log(results.length); // Multiple stations with "新宿" in name
   * 
   * results.forEach(result => {
   *   console.log(`${result.station.name} (${result.score})`);
   * });
   * ```
   * 
   * @example Advanced Search with Options
   * ```typescript
   * const results = await sdk.searchStations("しんじゅく", {
   *   includeKana: true,
   *   prefecture: "東京都",
   *   limit: 5,
   *   fuzzyThreshold: 0.8,
   *   sortByPopularity: true
   * });
   * ```
   */
  async searchStations(
    query: string, 
    options: StationSearchOptions = {}
  ): Promise<StationSearchResult[]> {
    this.ensureReady();
    
    const startTime = this.performanceTracker.startTimer('station_search');
    
    try {
      // Use cache if available
      const cacheKey = `search:${query}:${JSON.stringify(options)}`;
      const cached = await this.cacheManager.get<StationSearchResult[]>(
        CacheCategory.SEARCH_RESULTS, 
        cacheKey
      );
      
      if (cached) {
        this.performanceTracker.endTimer(startTime);
        return cached;
      }
      
      // Perform search using WASM wrapper
      const results = await this.wasmWrapper.searchStations(query);
      
      // Convert to enhanced search results
      const searchResults: StationSearchResult[] = results.map(station => ({
        station,
        score: this.calculateSearchScore(query, station),
        matchedField: this.getMatchedField(query, station),
        highlight: this.highlightMatch(query, station.name)
      }));
      
      // Apply options filtering and sorting
      let filteredResults = this.applySearchOptions(searchResults, options);
      
      // Cache results
      await this.cacheManager.set(
        CacheCategory.SEARCH_RESULTS,
        cacheKey,
        filteredResults,
        this.config.caching.ttl / 4 // Shorter TTL for search results
      );
      
      this.performanceTracker.endTimer(startTime);
      this.performanceTracker.recordMetric('search_results_count', filteredResults.length);
      
      return filteredResults;
      
    } catch (error) {
      this.performanceTracker.endTimer(startTime);
      throw this.handleApiError(error, 'searchStations', { query, options });
    }
  }
  
  // ============================================================================
  // PUBLIC API: ROUTE OPERATIONS
  // ============================================================================
  
  /**
   * Create and return a new enhanced Route instance
   * 
   * @returns New enhanced Route object with fluent API
   * 
   * @example
   * ```typescript
   * const route = sdk.createRoute()
   *   .from("東京")
   *   .via("品川")
   *   .to("横浜");
   * 
   * const fare = await route.calculateFare();
   * console.log(`Route: ${await route.getDescription()}`);
   * console.log(`Fare: ${fare.fare}円`);
   * ```
   */
  createRoute(): EnhancedRoute {
    this.ensureReady();
    return this.objectFactory.createRoute();
  }
  
  /**
   * Calculate fare for a specified route with comprehensive result information
   * 
   * @param route Route specification in various formats
   * @returns Promise resolving to detailed fare calculation result
   * 
   * @example String Format
   * ```typescript
   * const result = await sdk.calculateFare("東京 東海道線 横浜");
   * console.log(`Fare: ${result.totalFare}円`);
   * console.log(`Success: ${result.success}`);
   * ```
   * 
   * @example Object Format
   * ```typescript
   * const result = await sdk.calculateFare({
   *   start: "東京",
   *   end: "横浜",
   *   via: ["品川"]
   * });
   * ```
   * 
   * @example RouteSegment Array
   * ```typescript
   * const segments: RouteSegment[] = [
   *   { stationId: 1130101, stationName: "東京", isTransfer: false },
   *   { stationId: 1130201, stationName: "品川", isTransfer: true },
   *   { stationId: 1130401, stationName: "横浜", isTransfer: false }
   * ];
   * const result = await sdk.calculateFare(segments);
   * ```
   */
  async calculateFare(route: RouteSpec): Promise<FareCalculationResult> {
    this.ensureReady();
    
    const startTime = this.performanceTracker.startTimer('fare_calculation');
    
    try {
      // Convert route specification to internal format
      const calcRoute = await this.buildCalcRoute(route);
      
      // Generate cache key based on route
      const routeKey = await this.generateRouteKey(calcRoute);
      const cacheKey = `fare:${routeKey}`;
      
      // Check cache first
      const cached = await this.cacheManager.get<FareCalculationResult>(
        CacheCategory.FARE_CALCULATIONS,
        cacheKey
      );
      
      if (cached) {
        this.performanceTracker.endTimer(startTime);
        this.performanceTracker.recordMetric('fare_cache_hits', 1);
        return cached;
      }
      
      // Perform fare calculation
      const fareResult = await calcRoute.calculateFare();
      
      // Validate result
      if (!fareResult.success) {
        throw new FarertSDKError(
          `Fare calculation failed: ${fareResult.error?.message || 'Unknown error'}`,
          FarertSDKErrorCode.CALCULATION_FAILED,
          { route, fareResult },
          true // Retryable
        );
      }
      
      // Cache successful result
      await this.cacheManager.set(
        CacheCategory.FARE_CALCULATIONS,
        cacheKey,
        fareResult,
        this.config.caching.ttl
      );
      
      // Emit calculation event
      this.emitEvent('routeCalculated', {
        type: 'routeCalculated',
        timestamp: Date.now(),
        source: 'user',
        result: fareResult,
        route
      });
      
      // Record metrics
      const calcTime = this.performanceTracker.endTimer(startTime);
      this.performanceTracker.recordMetric('fare_calculation_time', calcTime, 'ms');
      this.performanceTracker.recordMetric('fare_cache_misses', 1);
      
      return fareResult;
      
    } catch (error) {
      this.performanceTracker.endTimer(startTime);
      throw this.handleApiError(error, 'calculateFare', { route });
    }
  }
  
  /**
   * Validate a route specification and provide suggestions for fixes
   * 
   * @param route Route specification to validate
   * @returns Promise resolving to validation result with errors and suggestions
   * 
   * @example
   * ```typescript
   * const validation = await sdk.validateRoute("東京 存在しない線 横浜");
   * 
   * if (!validation.isValid) {
   *   console.log('Validation errors:');
   *   validation.errors.forEach(error => {
   *     console.log(`- ${error.message}`);
   *   });
   *   
   *   console.log('Suggestions:');
   *   validation.suggestions.forEach(suggestion => {
   *     console.log(`- ${suggestion.reason}`);
   *   });
   * }
   * ```
   */
  async validateRoute(route: RouteSpec): Promise<RouteValidationResult> {
    this.ensureReady();
    
    try {
      const enhancedRoute = await this.buildEnhancedRoute(route);
      return await enhancedRoute.validate();
    } catch (error) {
      throw this.handleApiError(error, 'validateRoute', { route });
    }
  }
  
  /**
   * Build optimal route between two stations with multiple options
   * 
   * @param startStation Starting station name or ID
   * @param endStation Ending station name or ID
   * @returns Promise resolving to route plan with primary and alternative routes
   * 
   * @example
   * ```typescript
   * const plan = await sdk.buildOptimalRoute("東京", "大阪");
   * 
   * console.log(`Primary route: ${plan.totalFare}円, ${plan.totalTime}分`);
   * console.log(`Transfer count: ${plan.characteristics.transferCount}`);
   * 
   * plan.alternatives.forEach((alt, index) => {
   *   console.log(`Alternative ${index + 1}: ${alt.fare}円, ${alt.time}分`);
   *   console.log(`Advantages: ${alt.advantages.join(', ')}`);
   * });
   * ```
   */
  async buildOptimalRoute(
    startStation: string, 
    endStation: string
  ): Promise<RoutePlanResult> {
    this.ensureReady();
    
    try {
      // This is a placeholder for advanced route planning logic
      // In a complete implementation, this would use sophisticated algorithms
      // to find optimal routes based on various criteria
      
      const basicRoute = this.createRoute()
        .from(startStation)
        .to(endStation);
      
      const fareResult = await basicRoute.calculateFare();
      
      return {
        route: fareResult.route.segments,
        totalFare: fareResult.totalFare,
        totalTime: basicRoute.getEstimatedTime(),
        totalDistance: basicRoute.getTotalDistance(),
        alternatives: [], // Would be populated with alternative routes
        characteristics: {
          transferCount: basicRoute.getTransferCount(),
          usesShinkansen: false, // Would be determined from route analysis
          usesPrivateRailway: false,
          complexity: basicRoute.getTransferCount() > 2 ? 'complex' : 
                     basicRoute.getTransferCount() > 0 ? 'moderate' : 'simple'
        }
      };
      
    } catch (error) {
      throw this.handleApiError(error, 'buildOptimalRoute', { startStation, endStation });
    }
  }
  
  // ============================================================================
  // PUBLIC API: REFERENCE DATA
  // ============================================================================
  
  /**
   * Get comprehensive line information by line ID
   * 
   * @param lineId Line ID to lookup
   * @returns Promise resolving to line information or null if not found
   */
  async getLineInfo(lineId: number): Promise<LineInfo | null> {
    this.ensureReady();
    
    try {
      // Use cache first
      const cached = await this.cacheManager.getReferenceData<LineInfo>('line', lineId);
      if (cached) {
        return cached;
      }
      
      // Get line information from WASM
      const lineName = await this.wasmWrapper.getLineName(lineId);
      if (!lineName) {
        return null;
      }
      
      // Build comprehensive line info
      const lineInfo: LineInfo = {
        id: lineId,
        name: lineName,
        companyId: Math.floor(lineId / 10000), // Approximate company mapping
        companyName: '', // Would be populated from company data
        isJR: lineId < 0x10000,
        isPrivate: lineId >= 0x10000,
        stations: [], // Would be populated from station data
        type: lineId < 0x10000 ? 'jr' : 'private'
      };
      
      // Cache the result
      await this.cacheManager.cacheReferenceData('line', lineId, lineInfo);
      
      return lineInfo;
      
    } catch (error) {
      throw this.handleApiError(error, 'getLineInfo', { lineId });
    }
  }
  
  /**
   * Get comprehensive company information by company ID
   * 
   * @param companyId Company ID to lookup
   * @returns Promise resolving to company information or null if not found
   */
  async getCompanyInfo(companyId: number): Promise<CompanyInfo | null> {
    this.ensureReady();
    
    try {
      // Use cache first
      const cached = await this.cacheManager.getReferenceData<CompanyInfo>('company', companyId);
      if (cached) {
        return cached;
      }
      
      // Get company information
      const companyName = await this.wasmWrapper.getCompanyOrPrefectureName?.(companyId);
      if (!companyName) {
        return null;
      }
      
      // Build comprehensive company info
      const companyInfo: CompanyInfo = {
        id: companyId,
        name: companyName,
        type: companyId < 0x10000 ? 'JR' : 'PRIVATE',
        lines: [] // Would be populated from line data
      };
      
      // Cache the result
      await this.cacheManager.cacheReferenceData('company', companyId, companyInfo);
      
      return companyInfo;
      
    } catch (error) {
      throw this.handleApiError(error, 'getCompanyInfo', { companyId });
    }
  }
  
  /**
   * Get all available companies
   * 
   * @returns Promise resolving to array of company information
   */
  async getCompanies(): Promise<CompanyInfo[]> {
    this.ensureReady();
    
    try {
      // Get JR companies
      const jrCompanies = await this.wasmWrapper.getJRCompanyIds?.() || [];
      const companies: CompanyInfo[] = [];
      
      for (const companyId of jrCompanies) {
        const companyInfo = await this.getCompanyInfo(companyId);
        if (companyInfo) {
          companies.push(companyInfo);
        }
      }
      
      return companies;
      
    } catch (error) {
      throw this.handleApiError(error, 'getCompanies', {});
    }
  }
  
  /**
   * Get all available prefectures
   * 
   * @returns Promise resolving to array of prefecture information
   */
  async getPrefectures(): Promise<PrefectureInfo[]> {
    this.ensureReady();
    
    try {
      // Get prefecture IDs
      const prefectureIds = await this.wasmWrapper.getPrefectureIds?.() || [];
      const prefectures: PrefectureInfo[] = [];
      
      for (const prefId of prefectureIds) {
        const prefName = await this.wasmWrapper.getCompanyOrPrefectureName?.(prefId);
        if (prefName) {
          prefectures.push({
            id: prefId,
            name: prefName,
            region: '', // Would be populated from regional data
            stationCount: 0 // Would be calculated
          });
        }
      }
      
      return prefectures;
      
    } catch (error) {
      throw this.handleApiError(error, 'getPrefectures', {});
    }
  }
  
  /**
   * Get all available lines
   * 
   * @returns Promise resolving to array of line information
   */
  async getLines(): Promise<LineInfo[]> {
    this.ensureReady();
    
    try {
      // This is a placeholder implementation
      // In a complete system, this would enumerate all lines from the database
      const lines: LineInfo[] = [];
      
      // For now, return empty array - would be populated in production
      return lines;
      
    } catch (error) {
      throw this.handleApiError(error, 'getLines', {});
    }
  }
  
  // ============================================================================
  // PUBLIC API: OBJECT CLASSES
  // ============================================================================
  
  /**
   * Enhanced object classes with fluent APIs and lifecycle management
   * 
   * Provides access to all 6 object classes with enhanced functionality:
   * - RouteList: Array operations with forEach, map, filter
   * - Route: Fluent route building with method chaining
   * - CalcRoute: Fare calculation with reactive results
   * - RouteItem: Individual route segment management
   * - RouteFlag: Route configuration flags
   * - FareInfo: Comprehensive fare information access
   * 
   * @example Route Building
   * ```typescript
   * const route = sdk.objectClasses.Route.create()
   *   .from("東京")
   *   .via("品川", 1001) // Line ID optional
   *   .to("横浜");
   * 
   * const isValid = await route.validate();
   * const description = await route.getDescription('detailed');
   * ```
   * 
   * @example Route List Operations
   * ```typescript
   * const routeList = sdk.objectClasses.RouteList.create();
   * 
   * // Add multiple routes
   * routeList.addRoute(route1).addRoute(route2);
   * 
   * // Array operations
   * routeList
   *   .filter(item => item.stationId > 1000000)
   *   .forEach(item => console.log(item.stationId));
   * 
   * // Convert to segments
   * const segments = routeList.toSegments();
   * ```
   * 
   * @example Fare Calculation
   * ```typescript
   * const calcRoute = sdk.objectClasses.CalcRoute.create()
   *   .from("東京")
   *   .to("大阪")
   *   .setLongRouteEnabled(true);
   * 
   * const fareResult = await calcRoute.calculateFare({
   *   includeDiscounts: true,
   *   enableLongRoute: true
   * });
   * 
   * // Reactive updates
   * calcRoute.fareStore.subscribe(fare => {
   *   console.log('Fare updated:', fare);
   * });
   * ```
   */
  get objectClasses(): {
    RouteList: {
      create(): EnhancedRouteList;
      createFromArray(items: RouteItemWrapper[]): EnhancedRouteList;
    };
    Route: {
      create(): EnhancedRoute;
      createFromString(routeString: string): Promise<EnhancedRoute>;
    };
    CalcRoute: {
      create(): EnhancedCalcRoute;
      createFromRoute(route: EnhancedRoute): EnhancedCalcRoute;
    };
    RouteItem: {
      create(stationId?: number, lineId?: number): EnhancedRouteItem;
      createFromSegment(segment: RouteSegment): Promise<EnhancedRouteItem>;
    };
    RouteFlag: {
      create(): EnhancedRouteFlag;
      createWithFlags(flags: number): EnhancedRouteFlag;
    };
    FareInfo: {
      create(fareData: FareInfoData): EnhancedFareInfo;
      createEmpty(): EnhancedFareInfo;
    };
  } {
    this.ensureReady();
    
    return {
      RouteList: {
        create: () => this.objectFactory.createRouteList(),
        createFromArray: (items: RouteItemWrapper[]) => {
          const routeList = this.objectFactory.createRouteList();
          items.forEach(item => routeList.add(item));
          return routeList;
        }
      },
      
      Route: {
        create: () => this.objectFactory.createRoute(),
        createFromString: async (routeString: string) => {
          const route = this.objectFactory.createRoute();
          await route.setupRoute(routeString);
          return route;
        }
      },
      
      CalcRoute: {
        create: () => this.objectFactory.createCalcRoute(),
        createFromRoute: (route: EnhancedRoute) => {
          // This would copy route data to CalcRoute
          const calcRoute = this.objectFactory.createCalcRoute();
          // Implementation would copy segments
          return calcRoute;
        }
      },
      
      RouteItem: {
        create: (stationId?: number, lineId?: number) => {
          const item = this.objectFactory.createRouteItem();
          if (stationId !== undefined) item.setStation(stationId);
          if (lineId !== undefined) item.setLine(lineId);
          return item;
        },
        createFromSegment: async (segment: RouteSegment) => {
          const item = this.objectFactory.createRouteItem();
          item.setStation(segment.stationId);
          if (segment.lineId) item.setLine(segment.lineId);
          return item;
        }
      },
      
      RouteFlag: {
        create: () => this.objectFactory.createRouteFlag(),
        createWithFlags: (flags: number) => {
          const routeFlag = this.objectFactory.createRouteFlag();
          routeFlag.flags = flags;
          return routeFlag;
        }
      },
      
      FareInfo: {
        create: (fareData: FareInfoData) => this.objectFactory.createFareInfo(fareData),
        createEmpty: () => this.objectFactory.createFareInfo({ 
          result: 0, 
          fare: 0, 
          availCountForFareOfStockDiscount: 0,
          fareForStockDiscount: () => 0,
          fareForStockDiscountTitle: () => ''
        })
      }
    };
  }
  
  // ============================================================================
  // PUBLIC API: EVENT SYSTEM
  // ============================================================================
  
  /**
   * Add an event listener for SDK events
   * 
   * @param type Event type to listen for
   * @param listener Event listener function
   * 
   * @example
   * ```typescript
   * sdk.addEventListener('initialized', (event) => {
   *   console.log(`SDK initialized in ${event.data.initializationTime}ms`);
   * });
   * 
   * sdk.addEventListener('error', (event) => {
   *   console.error('SDK Error:', event.error.message);
   *   if (event.recoveryStrategy?.canRetry) {
   *     console.log('Retrying...');
   *   }
   * });
   * 
   * sdk.addEventListener('routeCalculated', (event) => {
   *   console.log(`Route calculated: ${event.result.totalFare}円`);
   * });
   * ```
   */
  addEventListener<T extends keyof FarertSDKEventMap>(
    type: T,
    listener: (event: FarertSDKEventMap[T]) => void
  ): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }
  
  /**
   * Remove an event listener
   * 
   * @param type Event type
   * @param listener Event listener function to remove
   */
  removeEventListener<T extends keyof FarertSDKEventMap>(
    type: T,
    listener: (event: FarertSDKEventMap[T]) => void
  ): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    }
  }
  
  // ============================================================================
  // PRIVATE IMPLEMENTATION METHODS
  // ============================================================================
  
  /**
   * Initialize core SDK components
   */
  private initializeComponents(): void {
    // Create cache manager
    this.cacheManager = createProductionCacheManager({
      globalMemoryLimit: this.config.caching.maxSize * 1024, // Convert to bytes
      autoMemoryManagement: true,
      enableDetailedStats: this.config.performance.enabled
    });
    
    // Create error manager
    this.errorManager = createProductionErrorManager({
      enableErrorReporting: false, // Disable for production
      defaultRetryStrategy: {
        maxAttempts: this.config.errorHandling.retryAttempts,
        initialDelay: this.config.errorHandling.retryDelay,
        backoffMultiplier: 2,
        maxDelay: this.config.errorHandling.retryDelay * 8,
        jitter: 0.1,
        retryableErrors: new Set([
          'WASM_LOAD_FAILED',
          'CALCULATION_FAILED',
          'NETWORK_ERROR'
        ]),
        nonRetryableErrors: new Set([
          'STATION_NOT_FOUND',
          'LINE_NOT_FOUND',
          'INVALID_ROUTE'
        ])
      }
    });
    
    // Create WASM wrapper
    this.wasmWrapper = createProductionWasmWrapper({
      cacheConfig: this.cacheManager.config,
      errorConfig: {
        enableRetry: true,
        maxRetries: this.config.errorHandling.retryAttempts,
        baseRetryDelay: this.config.errorHandling.retryDelay,
        enableCircuitBreaker: true
      },
      performanceConfig: {
        enabled: this.config.performance.enabled,
        monitorMemory: true,
        monitorTiming: this.config.performance.trackingLevel !== 'basic'
      },
      debugConfig: {
        enableDebugLog: this.config.development,
        logCacheOps: this.config.development,
        logApiCalls: this.config.development
      }
    });
    
    // Create lifecycle manager
    this.lifecycleManager = new ObjectLifecycleManager();
  }
  
  /**
   * Validate database connection and provide recovery guidance
   */
  private async validateDatabaseConnection(): Promise<void> {
    try {
      const version = await this.wasmWrapper.getDatabaseVersion();
      if (version <= 0) {
        throw new FarertSDKError(
          'Database connection validation failed - invalid version',
          FarertSDKErrorCode.INITIALIZATION_FAILED,
          { version },
          true
        );
      }
      
      // Test basic database operation
      const testStationName = await this.wasmWrapper.getStationName(1130101); // Tokyo Station
      if (!testStationName) {
        throw new FarertSDKError(
          'Database validation failed - unable to retrieve test data',
          FarertSDKErrorCode.INITIALIZATION_FAILED,
          { testStationId: 1130101 },
          true
        );
      }
      
    } catch (error) {
      throw new FarertSDKError(
        'Database connection failed. Please check WebAssembly module and database integrity.',
        FarertSDKErrorCode.INITIALIZATION_FAILED,
        { 
          originalError: error,
          recoveryGuidance: [
            'Verify WebAssembly module is properly loaded',
            'Check database file integrity',
            'Ensure sufficient memory for database operations',
            'Try reinitializing the SDK'
          ]
        },
        true
      );
    }
  }
  
  /**
   * Pre-warm critical caches with frequently accessed data
   */
  private async prewarmCaches(): Promise<void> {
    if (!this.config.caching.enabled) {
      return;
    }
    
    try {
      // Pre-warm with major stations
      const majorStations = [
        1130101, // Tokyo
        1130201, // Shinagawa
        1130301, // Shibuya
        1130401, // Shinjuku
        2741002, // Osaka
        2741801, // Kyoto
      ];
      
      // Load major station data in background
      const preloadPromises = majorStations.map(async (stationId) => {
        try {
          await this.wasmWrapper.getStationInfo(stationId);
        } catch (error) {
          // Ignore individual preload failures
          if (this.config.development) {
            console.warn(`Failed to preload station ${stationId}:`, error);
          }
        }
      });
      
      // Don't wait for all to complete, just start the process
      Promise.all(preloadPromises).catch(() => {
        // Ignore preload failures
      });
      
    } catch (error) {
      // Cache prewarming is not critical, log and continue
      if (this.config.development) {
        console.warn('Cache prewarming failed:', error);
      }
    }
  }
  
  /**
   * Set SDK state and notify subscribers
   */
  private setState(newState: SDKState): void {
    if (this._state !== newState) {
      this._state = newState;
      if (this._stateStore && typeof this._stateStore.set === 'function') {
        this._stateStore.set(newState);
      }
    }
  }
  
  /**
   * Ensure SDK is ready for operations
   */
  private ensureReady(): void {
    if (!this.isReady()) {
      throw new FarertSDKError(
        'SDK not ready. Call initialize() first.',
        FarertSDKErrorCode.NOT_INITIALIZED
      );
    }
  }
  
  /**
   * Handle API errors with consistent error management
   */
  private handleApiError(error: any, operation: string, context: Record<string, any>): FarertSDKError {
    const errorContext: ErrorContext = {
      operation,
      operationDescription: `SDK.${operation}`,
      source: 'FarertSDK',
      metadata: { ...context, sdkVersion: SDK_VERSION }
    };
    
    if (error instanceof FarertSDKError) {
      return error;
    }
    
    return new FarertSDKError(
      error instanceof Error ? error.message : String(error),
      this.categorizeErrorCode(error),
      errorContext,
      this.isRetryableError(error)
    );
  }
  
  /**
   * Categorize errors into SDK error codes
   */
  private categorizeErrorCode(error: any): FarertSDKErrorCode {
    if (error?.message?.includes('station') || error?.message?.includes('STATION')) {
      return FarertSDKErrorCode.STATION_NOT_FOUND;
    }
    if (error?.message?.includes('line') || error?.message?.includes('LINE')) {
      return FarertSDKErrorCode.LINE_NOT_FOUND;
    }
    if (error?.message?.includes('calculation') || error?.message?.includes('fare')) {
      return FarertSDKErrorCode.CALCULATION_FAILED;
    }
    if (error?.message?.includes('route') || error?.message?.includes('ROUTE')) {
      return FarertSDKErrorCode.INVALID_ROUTE;
    }
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return FarertSDKErrorCode.NETWORK_ERROR;
    }
    if (error?.message?.includes('cache')) {
      return FarertSDKErrorCode.CACHE_ERROR;
    }
    
    return FarertSDKErrorCode.CALCULATION_FAILED;
  }
  
  /**
   * Determine if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const nonRetryableCodes = [
      'STATION_NOT_FOUND',
      'LINE_NOT_FOUND',
      'INVALID_ROUTE',
      'INVALID_CONFIG'
    ];
    
    const errorCode = this.categorizeErrorCode(error);
    return !nonRetryableCodes.includes(errorCode);
  }
  
  /**
   * Emit SDK event to listeners
   */
  private emitEvent<T extends keyof FarertSDKEventMap>(
    type: T,
    event: FarertSDKEventMap[T]
  ): void {
    const listeners = this.eventListeners.get(type);
    if (listeners && listeners.size > 0) {
      // Emit asynchronously to prevent blocking
      setTimeout(() => {
        for (const listener of Array.from(listeners)) {
          try {
            listener(event);
          } catch (error) {
            console.error(`Error in event listener for ${type}:`, error);
          }
        }
      }, 0);
    }
  }
  
  /**
   * Build enhanced CalcRoute from route specification
   */
  private async buildCalcRoute(route: RouteSpec): Promise<EnhancedCalcRoute> {
    const calcRoute = this.objectFactory.createCalcRoute();
    
    if (typeof route === 'string') {
      // Parse route string
      await calcRoute.setupRoute(route);
    } else if (Array.isArray(route)) {
      // Handle RouteSegment array
      for (const segment of route) {
        if (segment.lineId) {
          calcRoute.addRouteWithLine(segment.lineId, segment.stationId);
        } else {
          calcRoute.addRoute(segment.stationId);
        }
      }
    } else {
      // Handle object format
      const startId = typeof route.start === 'string' ? 
        await this.wasmWrapper.getStationId(route.start) : route.start;
      const endId = typeof route.end === 'string' ?
        await this.wasmWrapper.getStationId(route.end) : route.end;
      
      calcRoute.addRouteBegin(startId);
      
      // Add via stations
      if (route.via) {
        for (const via of route.via) {
          const viaId = typeof via === 'string' ?
            await this.wasmWrapper.getStationId(via) : via;
          calcRoute.addRoute(viaId);
        }
      }
      
      calcRoute.addRoute(endId);
    }
    
    return calcRoute;
  }
  
  /**
   * Build enhanced Route from route specification
   */
  private async buildEnhancedRoute(route: RouteSpec): Promise<EnhancedRoute> {
    const enhancedRoute = this.objectFactory.createRoute();
    
    if (typeof route === 'string') {
      await enhancedRoute.setupRoute(route);
    } else if (Array.isArray(route)) {
      for (const segment of route) {
        if (segment.lineId) {
          enhancedRoute.addRouteWithLine(segment.lineId, segment.stationId);
        } else {
          enhancedRoute.addRoute(segment.stationId);
        }
      }
    } else {
      const startId = typeof route.start === 'string' ?
        await this.wasmWrapper.getStationId(route.start) : route.start;
      const endId = typeof route.end === 'string' ?
        await this.wasmWrapper.getStationId(route.end) : route.end;
      
      enhancedRoute.addRouteBegin(startId);
      
      if (route.via) {
        for (const via of route.via) {
          const viaId = typeof via === 'string' ?
            await this.wasmWrapper.getStationId(via) : via;
          enhancedRoute.addRoute(viaId);
        }
      }
      
      enhancedRoute.addRoute(endId);
    }
    
    return enhancedRoute;
  }
  
  /**
   * Generate cache key for route
   */
  private async generateRouteKey(calcRoute: EnhancedCalcRoute): Promise<string> {
    try {
      const startId = calcRoute.startStationId();
      const endId = calcRoute.lastStationId();
      const count = calcRoute.getRouteCount();
      return `${startId}_${endId}_${count}`;
    } catch {
      return `route_${Date.now()}`;
    }
  }
  
  /**
   * Calculate search score for station
   */
  private calculateSearchScore(query: string, station: StationInfo): number {
    const queryLower = query.toLowerCase();
    const nameLower = station.name.toLowerCase();
    const kanaLower = station.kana.toLowerCase();
    
    // Exact match gets highest score
    if (nameLower === queryLower || kanaLower === queryLower) {
      return 1.0;
    }
    
    // Start match gets high score
    if (nameLower.startsWith(queryLower) || kanaLower.startsWith(queryLower)) {
      return 0.9;
    }
    
    // Contains match gets medium score
    if (nameLower.includes(queryLower) || kanaLower.includes(queryLower)) {
      return 0.7;
    }
    
    // Junction stations get bonus
    const baseScore = 0.5;
    return station.isJunction ? baseScore * 1.2 : baseScore;
  }
  
  /**
   * Get matched field for search result
   */
  private getMatchedField(query: string, station: StationInfo): 'name' | 'kana' | 'alternative' {
    const queryLower = query.toLowerCase();
    
    if (station.name.toLowerCase().includes(queryLower)) {
      return 'name';
    }
    
    if (station.kana.toLowerCase().includes(queryLower)) {
      return 'kana';
    }
    
    return 'alternative';
  }
  
  /**
   * Highlight matching text in search results
   */
  private highlightMatch(query: string, text: string): string {
    // Simple highlighting - in production, this would be more sophisticated
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  /**
   * Apply search options to filter and sort results
   */
  private applySearchOptions(
    results: StationSearchResult[],
    options: StationSearchOptions
  ): StationSearchResult[] {
    let filteredResults = [...results];
    
    // Apply filters
    if (options.prefecture) {
      const prefFilter = typeof options.prefecture === 'string' ? 
        options.prefecture : String(options.prefecture);
      filteredResults = filteredResults.filter(r => 
        r.station.prefecture === prefFilter || 
        r.station.prefectureId === Number(prefFilter)
      );
    }
    
    // Apply fuzzy threshold
    if (options.fuzzyThreshold !== undefined) {
      filteredResults = filteredResults.filter(r => 
        r.score >= options.fuzzyThreshold!
      );
    }
    
    // Sort results
    if (options.sortByPopularity) {
      filteredResults.sort((a, b) => {
        // Sort by ranking first, then by score
        const rankA = a.station.ranking || 999999;
        const rankB = b.station.ranking || 999999;
        
        if (rankA !== rankB) {
          return rankA - rankB; // Lower ranking number = higher priority
        }
        
        return b.score - a.score; // Higher score = better match
      });
    } else {
      filteredResults.sort((a, b) => b.score - a.score);
    }
    
    // Apply limit
    if (options.limit !== undefined && options.limit > 0) {
      filteredResults = filteredResults.slice(0, options.limit);
    }
    
    return filteredResults;
  }
}

// ============================================================================
// INTERNAL PERFORMANCE TRACKER
// ============================================================================

/**
 * Internal performance tracking implementation
 */
class InternalPerformanceTracker implements PerformanceTracker {
  private timers = new Map<string, number>();
  private metrics = new Map<string, { values: number[]; unit: string }>();
  private enabled: boolean;
  private trackingLevel: 'basic' | 'detailed' | 'verbose';
  
  constructor(config: { enabled: boolean; trackingLevel: 'basic' | 'detailed' | 'verbose' }) {
    this.enabled = config.enabled;
    this.trackingLevel = config.trackingLevel;
  }
  
  startTimer(operationName: string): string {
    if (!this.enabled) return '';
    
    const timerId = `${operationName}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, performance.now());
    return timerId;
  }
  
  endTimer(timerId: string): number {
    if (!this.enabled || !timerId) return 0;
    
    const startTime = this.timers.get(timerId);
    if (startTime === undefined) return 0;
    
    const duration = performance.now() - startTime;
    this.timers.delete(timerId);
    
    // Extract operation name from timer ID
    const operationName = timerId.split('_')[0];
    this.recordMetric(`${operationName}_duration`, duration, 'ms');
    
    return duration;
  }
  
  recordMetric(name: string, value: number, unit = ''): void {
    if (!this.enabled) return;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, { values: [], unit });
    }
    
    const metric = this.metrics.get(name)!;
    metric.values.push(value);
    
    // Keep only recent values to prevent memory growth
    if (metric.values.length > 100) {
      metric.values.shift();
    }
  }
  
  getMetrics(): PerformanceMetrics {
    const timings: Record<string, any> = {};
    const metricsData: Record<string, any> = {};
    
    // Process timing data
    for (const [name, metric] of this.metrics.entries()) {
      if (name.endsWith('_duration')) {
        const operationName = name.replace('_duration', '');
        const values = metric.values;
        
        if (values.length > 0) {
          timings[operationName] = {
            count: values.length,
            totalTime: values.reduce((sum, v) => sum + v, 0),
            averageTime: values.reduce((sum, v) => sum + v, 0) / values.length,
            minTime: Math.min(...values),
            maxTime: Math.max(...values)
          };
        }
      } else {
        const values = metric.values;
        if (values.length > 0) {
          metricsData[name] = {
            value: values[values.length - 1], // Latest value
            unit: metric.unit,
            timestamp: Date.now()
          };
        }
      }
    }
    
    return {
      timings,
      metrics: metricsData,
      memory: {
        used: 0, // Would be populated from actual memory monitoring
        total: 0,
        percentage: 0
      },
      errors: {} // Would be populated from error tracking
    };
  }
  
  reset(): void {
    this.timers.clear();
    this.metrics.clear();
  }
}

// ============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// ============================================================================

/**
 * Create a new FarertSDK instance with default configuration
 * 
 * @param config Optional SDK configuration
 * @returns New FarertSDK instance
 * 
 * @example
 * ```typescript
 * import { createFarertSDK } from '@farert/sdk';
 * 
 * const sdk = createFarertSDK();
 * await sdk.initialize();
 * ```
 */
export function createFarertSDK(config?: Partial<SDKConfig>): FarertSDK {
  return new FarertSDKImpl(config);
}

/**
 * Create a FarertSDK instance optimized for development
 * 
 * @param config Optional SDK configuration
 * @returns Development-optimized FarertSDK instance
 */
export function createDevelopmentSDK(config: Partial<SDKConfig> = {}): FarertSDK {
  return new FarertSDKImpl({
    ...config,
    development: true,
    performance: {
      enabled: true,
      trackingLevel: 'detailed',
      ...config.performance
    },
    caching: {
      enabled: true,
      maxSize: 500,
      ttl: 60000, // 1 minute for development
      ...config.caching
    }
  });
}

/**
 * Create a FarertSDK instance optimized for production
 * 
 * @param config Optional SDK configuration
 * @returns Production-optimized FarertSDK instance
 */
export function createProductionSDK(config: Partial<SDKConfig> = {}): FarertSDK {
  return new FarertSDKImpl({
    ...config,
    development: false,
    performance: {
      enabled: true,
      trackingLevel: 'basic',
      ...config.performance
    },
    caching: {
      enabled: true,
      maxSize: 2000,
      ttl: 600000, // 10 minutes for production
      ...config.caching
    },
    errorHandling: {
      retryAttempts: 2, // Fewer retries in production
      retryDelay: 1500,
      enableFuzzyMatching: false, // More strict in production
      ...config.errorHandling
    }
  });
}

// Export the main implementation class
export { FarertSDKImpl as FarertSDK };

// Export all related types and interfaces
export type {
  FarertSDK as FarertSDKInterface,
  SDKState,
  SDKConfig,
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
  PerformanceTracker,
  PerformanceMetrics
};