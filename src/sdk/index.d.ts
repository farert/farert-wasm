/**
 * TypeScript Declaration File for Farert WebAssembly SDK
 * 
 * This file provides comprehensive TypeScript IntelliSense support for the
 * Farert WebAssembly Frontend API Layer SDK. It includes all public interfaces,
 * types, and classes exposed by the SDK.
 * 
 * The SDK provides a Svelte-first TypeScript interface to 39+ WebAssembly APIs
 * and 6 Object Classes for Japanese railway fare calculations, with secondary
 * support for React, Vue, and framework-agnostic usage.
 * 
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements: REQ-API-006 - Frontend SDK Development Experience
 */

// ============================================================================
// CORE SDK EXPORTS
// ============================================================================

/**
 * Main FarertSDK class - Primary entry point for SDK functionality
 */
export interface FarertSDK {
  /** WebAssembly module instance */
  readonly wasmModule: FarertModule | null;
  
  /** Current initialization state */
  readonly state: SDKState;
  
  /** SDK configuration */
  readonly config: SDKConfig;
  
  // Core lifecycle methods
  initialize(): Promise<void>;
  dispose(): Promise<void>;
  
  // Object class factories
  createRouteList(): RouteListWrapper;
  createRoute(): RouteWrapper;
  createCalcRoute(): CalcRouteWrapper;
  createRouteItem(): RouteItemWrapper;
  createRouteFlag(): RouteFlagWrapper;
  
  // Utility methods
  getStationInfo(idOrName: number | string): Promise<StationInfo | null>;
  searchStations(query: string, options?: StationSearchOptions): Promise<StationSearchResult[]>;
  getLineInfo(lineId: number): Promise<LineInfo | null>;
  getCompanyInfo(companyId: number): Promise<CompanyInfo | null>;
  
  // Route building and calculation
  calculateFare(route: RouteSpec): Promise<FareCalculationResult>;
  validateRoute(route: RouteSpec): Promise<RouteValidationResult>;
  buildOptimalRoute(startStation: string, endStation: string): Promise<RoutePlanResult>;
  
  // Caching and performance
  readonly cache: CacheManager;
  readonly metrics: PerformanceTracker;
  
  // Event handling
  addEventListener<T extends keyof FarertSDKEventMap>(
    type: T,
    listener: (event: FarertSDKEventMap[T]) => void
  ): void;
  removeEventListener<T extends keyof FarertSDKEventMap>(
    type: T,
    listener: (event: FarertSDKEventMap[T]) => void
  ): void;
}

/**
 * FarertSDK factory functions
 */
export declare function createFarertSDK(config?: Partial<SDKConfig>): FarertSDK;
export declare function createDevelopmentSDK(): FarertSDK;
export declare function createProductionSDK(): FarertSDK;

// ============================================================================
// WEBASSEMBLY MODULE TYPES
// ============================================================================

/**
 * WebAssembly module interface
 */
export interface FarertModule {
  // WebAssembly memory and utility functions
  _malloc(size: number): number;
  _free(ptr: number): void;
  HEAP8: Int8Array;
  HEAP32: Int32Array;
  UTF8ToString(ptr: number): string;
  stringToUTF8(str: string, outPtr: number, maxBytesToWrite: number): void;
  lengthBytesUTF8(str: string): number;
  
  // Core WebAssembly API functions (39+ APIs)
  farert_get_station_id(name: string): number;
  farert_station_name(id: number): string;
  farert_station_name_ex(id: number): string;
  farert_get_kana_from_station_id(id: number): string;
  farert_company_or_prefect_name(id: number): string;
  farert_get_jr_companys(): number;
  farert_get_prefects(): number;
  farert_enum_line_of_station_id(id: number): number;
  farert_line_name(id: number): string;
  farert_lines_company_or_prefect_id(id: number): number;
  farert_stations_ids_of_line_id(id: number): number;
  farert_junction_ids_of_line_id(lineId: number, stationId: number): number;
  farert_is_junction(id: number): boolean;
  farert_is_specific_junction(lineId: number, stationId: number): boolean;
  farert_terminal_name(id: number): string;
  farert_route_script(): string;
  
  // Object class constructors and methods
  farert_create_route_list(): number;
  farert_create_route(): number;
  farert_create_calc_route(): number;
  farert_create_route_item(): number;
  farert_create_route_flag(): number;
  farert_delete_object(ptr: number): void;
  
  // Route operations
  farert_route_add_route_begin(routePtr: number, stationId: number): number;
  farert_route_add_route(routePtr: number, lineId: number, stationId: number): number;
  farert_route_setup_route(routePtr: number, routeString: string): number;
  farert_route_get_route_count(routePtr: number): number;
  farert_route_script(routePtr: number): string;
  
  // Fare calculation
  farert_calc_route_calc_fare(calcRoutePtr: number): number;
  farert_calc_route_set_long_route(calcRoutePtr: number, flag: boolean): void;
  farert_calc_route_show_fare(calcRoutePtr: number): string;
  farert_calc_route_get_fare_info(calcRoutePtr: number): number;
  
  // Route list operations
  farert_route_list_assign(listPtr: number, sourcePtr: number): void;
  farert_route_list_size(listPtr: number): number;
  farert_route_list_get(listPtr: number, index: number): number;
  farert_route_list_push_back(listPtr: number, itemPtr: number): void;
  farert_route_list_clear(listPtr: number): void;
  
  // Route item operations
  farert_route_item_get_station_id(itemPtr: number): number;
  farert_route_item_set_station_id(itemPtr: number, stationId: number): void;
  farert_route_item_get_line_id(itemPtr: number): number;
  farert_route_item_set_line_id(itemPtr: number, lineId: number): void;
  farert_route_item_get_flag(itemPtr: number): number;
  farert_route_item_set_flag(itemPtr: number, flag: number): void;
  
  // Fare info operations
  farert_fare_info_get_fare(fareInfoPtr: number): number;
  farert_fare_info_get_is_rule114_applied(fareInfoPtr: number): boolean;
  farert_fare_info_get_avail_count_for_fare_of_stock_discount(fareInfoPtr: number): number;
  farert_fare_info_fare_for_stock_discount(fareInfoPtr: number, index: number): number;
  farert_fare_info_fare_for_stock_discount_title(fareInfoPtr: number, index: number): string;
  farert_fare_info_as_json(fareInfoPtr: number): string;
  
  // Enhanced JSON APIs
  farert_get_fare_info_json(): string;
  farert_get_company_and_prefects_as_json(): string;
  farert_get_current_route_as_json(): string;
}

/**
 * Enhanced Fare Info Data interface
 */
export interface FareInfoData {
  fare: number;
  isRule114Applied: boolean;
  availCountForFareOfStockDiscount: number;
  fareForStockDiscount: number[];
  fareForStockDiscountTitle: string[];
  
  // Extended properties for enhanced display
  baseFare?: number;
  expressFare?: number;
  greenCarFare?: number;
  totalDistance?: number;
  estimatedTime?: number;
  routeComplexity?: 'simple' | 'moderate' | 'complex';
  applicableDiscounts?: FareDiscount[];
}

// ============================================================================
// OBJECT CLASS WRAPPERS
// ============================================================================

/**
 * Enhanced RouteList wrapper with array operations
 */
export interface RouteListWrapper {
  readonly ptr: number;
  
  // Core operations
  assign(obj: RouteListWrapper): void;
  size(): number;
  get(index: number): RouteItemWrapper;
  pushBack(item: RouteItemWrapper): void;
  clear(): void;
  
  // Enhanced array operations
  forEach(callback: (item: RouteItemWrapper, index: number) => void): void;
  map<T>(callback: (item: RouteItemWrapper, index: number) => T): T[];
  filter(predicate: (item: RouteItemWrapper, index: number) => boolean): RouteItemWrapper[];
  find(predicate: (item: RouteItemWrapper, index: number) => boolean): RouteItemWrapper | undefined;
  
  // Utility methods
  isEmpty(): boolean;
  toArray(): RouteItemWrapper[];
  clone(): RouteListWrapper;
  
  // Memory management
  dispose(): void;
}

/**
 * Enhanced Route wrapper with fluent API
 */
export interface RouteWrapper extends RouteListWrapper {
  // Route construction
  setupRoute(routeString: string): number;
  addRoute(lineId: number, stationId: number): number;
  addRouteBegin(stationId: number): number;
  getRouteCount(): number;
  routeScript(): string;
  
  // Enhanced route building
  from(stationName: string): RouteWrapper;
  to(stationName: string): RouteWrapper;
  via(stationName: string): RouteWrapper;
  line(lineName: string): RouteWrapper;
  
  // Validation and analysis
  isValid(): boolean;
  getErrors(): string[];
  getWarnings(): string[];
  
  // Conversion
  toRouteSpec(): RouteSpec;
  toString(): string;
}

/**
 * Enhanced CalcRoute wrapper with fare calculation
 */
export interface CalcRouteWrapper extends RouteWrapper {
  // Fare calculation
  calcFare(): number;
  setLongRoute(flag: boolean): void;
  showFare(): string;
  getFareInfo(): FareInfoData;
  getFareInfoJson(): string;
  
  // Enhanced calculation methods
  calculateFareAdvanced(): Promise<FareCalculationResult>;
  calculateWithDiscounts(): Promise<FareCalculationResult>;
  
  // Configuration
  setCalculationOptions(options: FareCalculationOptions): void;
  getCalculationMetrics(): CalculationMetrics;
}

/**
 * Enhanced RouteItem wrapper
 */
export interface RouteItemWrapper {
  readonly ptr: number;
  
  // Properties
  stationId: number;
  lineId: number;
  flag: number;
  
  // Enhanced properties
  stationName?: string;
  lineName?: string;
  isTransfer?: boolean;
  
  // Methods
  getStationId(): number;
  setStationId(stationId: number): void;
  getLineId(): number;
  setLineId(lineId: number): void;
  getFlag(): number;
  setFlag(flag: number): void;
  
  // Enhanced methods
  getStationInfo(): Promise<StationInfo>;
  getLineInfo(): Promise<LineInfo>;
  
  // Utility methods
  toString(): string;
  toJSON(): object;
  clone(): RouteItemWrapper;
  
  // Memory management
  dispose(): void;
}

/**
 * Enhanced RouteFlag wrapper
 */
export interface RouteFlagWrapper {
  readonly ptr: number;
  
  // Flag operations
  hasFlag(flag: RouteFlagType): boolean;
  setFlag(flag: RouteFlagType, value: boolean): void;
  clearAll(): void;
  
  // Enhanced operations
  getFlagNames(): string[];
  toString(): string;
  
  // Memory management
  dispose(): void;
}

// ============================================================================
// ENHANCED DATA MODELS
// ============================================================================

/**
 * Enhanced station information with complete metadata
 */
export interface StationInfo {
  /** Station ID */
  id: number;
  
  /** Primary station name */
  name: string;
  
  /** Extended name with disambiguators */
  nameExtended: string;
  
  /** Hiragana reading */
  kana: string;
  
  /** Prefecture name */
  prefecture: string;
  
  /** Prefecture ID */
  prefectureId: number;
  
  /** Whether this is a junction station */
  isJunction: boolean;
  
  /** Lines serving this station */
  lines: LineInfo[];
  
  /** Geographic coordinates (if available) */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  /** Station popularity/usage ranking */
  ranking?: number;
  
  /** Station type classification */
  type: 'major' | 'junction' | 'terminal' | 'local';
  
  /** Company operating this station */
  company?: CompanyInfo;
  
  /** Transfer information */
  transfers?: {
    availableLines: LineInfo[];
    walkingTime?: number;
    transferType: 'platform' | 'gate' | 'station';
  };
}

/**
 * Enhanced line information with operational details
 */
export interface LineInfo {
  /** Line ID */
  id: number;
  
  /** Line name */
  name: string;
  
  /** Operating company ID */
  companyId: number;
  
  /** Operating company name */
  companyName: string;
  
  /** Line color (hex code) */
  color?: string;
  
  /** Whether this is a JR line */
  isJR: boolean;
  
  /** Whether this is a private railway */
  isPrivate: boolean;
  
  /** List of station IDs on this line */
  stations: number[];
  
  /** Line type */
  type: 'shinkansen' | 'jr' | 'private' | 'subway' | 'monorail' | 'other';
  
  /** Average speed (km/h) */
  averageSpeed?: number;
  
  /** Operating hours */
  operatingHours?: {
    firstTrain: string;
    lastTrain: string;
  };
  
  /** Service patterns */
  servicePatterns?: {
    local: boolean;
    rapid: boolean;
    express: boolean;
    limitedExpress: boolean;
  };
}

/**
 * Enhanced company information
 */
export interface CompanyInfo {
  /** Company ID */
  id: number;
  
  /** Company name */
  name: string;
  
  /** Company type */
  type: 'JR' | 'PRIVATE' | 'MUNICIPAL';
  
  /** Geographic region */
  region?: string;
  
  /** Brand color */
  color?: string;
  
  /** Lines operated by this company */
  lines: number[];
  
  /** Company website */
  website?: string;
  
  /** Headquarters location */
  headquarters?: string;
}

/**
 * Enhanced prefecture information
 */
export interface PrefectureInfo {
  /** Prefecture ID */
  id: number;
  
  /** Prefecture name */
  name: string;
  
  /** Geographic region */
  region: string;
  
  /** Number of stations in prefecture */
  stationCount: number;
  
  /** Major cities in prefecture */
  majorCities?: string[];
  
  /** Prefecture capital */
  capital: string;
  
  /** Major railway companies */
  majorCompanies?: CompanyInfo[];
}

// ============================================================================
// ROUTE SPECIFICATIONS AND RESULTS
// ============================================================================

/**
 * Flexible route specification supporting multiple input formats
 */
export type RouteSpec = 
  | string                    // "東京 東海道線 横浜"
  | RouteSegment[]           // Array of segments
  | {                        // Object format
      start: string | number;
      end: string | number;
      via?: Array<string | number>;
    };

/**
 * Enhanced route segment with complete information
 */
export interface RouteSegment {
  /** Station ID */
  stationId: number;
  
  /** Station name */
  stationName: string;
  
  /** Station Hiragana */
  stationKana: string;
  
  /** Line ID for this segment (optional for start/end) */
  lineId?: number;
  
  /** Line name */
  lineName?: string;
  
  /** Estimated travel time in minutes */
  travelTime?: number;
  
  /** Distance in kilometers */
  distance?: number;
  
  /** Segment fare */
  fare?: number;
  
  /** Whether this is a transfer point */
  isTransfer: boolean;
  
  /** Available transfer lines */
  transferLines?: LineInfo[];
  
  /** Platform or track information */
  platform?: string;
  
  /** Arrival time */
  arrivalTime?: string;
  
  /** Departure time */
  departureTime?: string;
  
  /** Train type (local, express, etc.) */
  trainType?: string;
}

/**
 * Comprehensive fare calculation result
 */
export interface FareCalculationResult {
  /** Calculation success status */
  success: boolean;
  
  /** Error information if calculation failed */
  error?: FarertSDKError;
  
  /** Base fare information */
  fareInfo?: FareInfoData;
  
  /** Enhanced fare breakdown */
  breakdown: FareBreakdownItem[];
  
  /** Total calculated fare */
  totalFare: number;
  
  /** Route segments */
  route: RouteSegment[];
  
  /** Available discount options */
  discounts: FareDiscount[];
  
  /** Alternative routes */
  alternatives?: AlternativeRoute[];
  
  /** Calculation metadata */
  metadata: {
    calculationTime: number; // milliseconds
    cacheHit: boolean;
    version: string;
    calculationId: string;
  };
  
  /** Route analysis */
  analysis?: RouteAnalysis;
}

/**
 * Fare breakdown item with detailed information
 */
export interface FareBreakdownItem {
  /** Item type */
  type: 'base' | 'express' | 'green' | 'discount' | 'surcharge';
  
  /** Description */
  description: string;
  
  /** Amount */
  amount: number;
  
  /** Whether this is a discount (negative amount) */
  isDiscount: boolean;
  
  /** Applicable conditions */
  conditions?: string[];
  
  /** Calculation basis */
  basis?: {
    distance?: number;
    stations?: number;
    timeOfDay?: string;
  };
}

/**
 * Fare discount option with availability
 */
export interface FareDiscount {
  /** Discount ID */
  id: string;
  
  /** Discount name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Discount amount */
  amount: number;
  
  /** Percentage discount */
  percentage?: number;
  
  /** Validity conditions */
  conditions: string[];
  
  /** Whether currently available */
  available: boolean;
  
  /** Expiration date */
  expiresAt?: Date;
  
  /** Usage restrictions */
  restrictions?: string[];
}

/**
 * Alternative route with comparison metrics
 */
export interface AlternativeRoute {
  /** Route segments */
  route: RouteSegment[];
  
  /** Total fare */
  fare: number;
  
  /** Total time */
  time: number;
  
  /** Route description */
  description: string;
  
  /** Why this alternative might be preferred */
  advantages: string[];
  
  /** Potential drawbacks */
  disadvantages: string[];
  
  /** Comparison score (higher is better) */
  score: number;
  
  /** Route characteristics */
  characteristics: {
    transferCount: number;
    usesShinkansen: boolean;
    usesPrivateRailway: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

// ============================================================================
// SEARCH AND VALIDATION
// ============================================================================

/**
 * Station search options with filtering
 */
export interface StationSearchOptions {
  /** Maximum number of results */
  limit?: number;
  
  /** Prefecture filter */
  prefecture?: string | number;
  
  /** Company filter */
  company?: string | number;
  
  /** Line filter */
  line?: string | number;
  
  /** Search in Hiragana readings */
  includeKana?: boolean;
  
  /** Include alternative names */
  includeAlternatives?: boolean;
  
  /** Fuzzy matching threshold (0-1) */
  fuzzyThreshold?: number;
  
  /** Sort by popularity */
  sortByPopularity?: boolean;
  
  /** Include geographic data */
  includeCoordinates?: boolean;
}

/**
 * Station search result with match information
 */
export interface StationSearchResult {
  /** Station information */
  station: StationInfo;
  
  /** Match score (0-1) */
  score: number;
  
  /** Which field matched */
  matchedField: 'name' | 'kana' | 'alternative';
  
  /** Highlighted match text */
  highlight: string;
  
  /** Search context */
  context?: {
    query: string;
    searchTime: number;
    totalResults: number;
  };
}

/**
 * Route validation result with detailed feedback
 */
export interface RouteValidationResult {
  /** Overall validation status */
  isValid: boolean;
  
  /** Validation errors */
  errors: RouteValidationError[];
  
  /** Validation warnings */
  warnings: RouteValidationWarning[];
  
  /** Suggested corrections */
  suggestions: RouteSuggestion[];
  
  /** Validated route (if fixable) */
  correctedRoute?: RouteSpec;
  
  /** Validation metadata */
  metadata: {
    validationTime: number;
    rulesApplied: string[];
    confidence: number;
  };
}

/**
 * Route validation error with correction suggestions
 */
export interface RouteValidationError {
  /** Error code */
  code: RouteValidationErrorCode;
  
  /** Human-readable message */
  message: string;
  
  /** Position in route where error occurred */
  position?: number;
  
  /** Suggested fixes */
  suggestions: string[];
  
  /** Error severity */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Route validation warning
 */
export interface RouteValidationWarning {
  /** Warning type */
  type: 'long_route' | 'expensive' | 'complex' | 'slow';
  
  /** Warning message */
  message: string;
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high';
  
  /** Recommendations */
  recommendations: string[];
}

/**
 * Route suggestion with confidence scoring
 */
export interface RouteSuggestion {
  /** Suggested route */
  route: RouteSpec;
  
  /** Reason for suggestion */
  reason: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Expected improvements */
  improvements: string[];
}

// ============================================================================
// CONFIGURATION AND STATE
// ============================================================================

/**
 * SDK state enumeration
 */
export enum SDKState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed'
}

/**
 * Comprehensive SDK configuration
 */
export interface SDKConfig {
  /** WebAssembly module path */
  wasmPath?: string;
  
  /** Enable caching */
  caching: {
    enabled: boolean;
    maxSize: number;
    ttl: number; // Time to live in milliseconds
    categories: {
      stations: number;
      routes: number;
      fares: number;
      reference: number;
    };
  };
  
  /** Performance monitoring */
  performance: {
    enabled: boolean;
    trackingLevel: 'basic' | 'detailed' | 'verbose';
    metricsCollection: boolean;
  };
  
  /** Error handling */
  errorHandling: {
    retryAttempts: number;
    retryDelay: number; // Milliseconds
    enableFuzzyMatching: boolean;
    circuitBreaker: boolean;
  };
  
  /** Localization */
  locale: {
    language: 'ja' | 'en';
    currency: 'JPY';
    numberFormat: Intl.NumberFormatOptions;
  };
  
  /** Development mode */
  development: boolean;
  
  /** Feature flags */
  features: {
    enhancedValidation: boolean;
    alternativeRoutes: boolean;
    realTimeUpdates: boolean;
    analytics: boolean;
  };
}

/**
 * Default SDK configuration
 */
export declare const DEFAULT_SDK_CONFIG: SDKConfig;

// ============================================================================
// CACHING AND PERFORMANCE
// ============================================================================

/**
 * Cache manager interface with category-specific caching
 */
export interface CacheManager {
  /** Get cached value */
  get<T>(key: string): Promise<T | null>;
  
  /** Set cached value */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  /** Remove cached value */
  delete(key: string): Promise<void>;
  
  /** Clear all cache */
  clear(): Promise<void>;
  
  /** Clear specific category */
  clearCategory(category: CacheCategory): Promise<void>;
  
  /** Get cache statistics */
  getStats(): CacheStats;
  
  /** Optimize cache (remove expired entries) */
  optimize(): Promise<void>;
  
  /** Pre-warm cache with common data */
  preWarm(data: PreWarmData): Promise<void>;
}

/**
 * Cache categories for different types of data
 */
export enum CacheCategory {
  STATIONS = 'stations',
  ROUTES = 'routes',
  FARES = 'fares',
  REFERENCE = 'reference'
}

/**
 * Cache statistics with detailed metrics
 */
export interface CacheStats {
  /** Total entries */
  totalEntries: number;
  
  /** Cache hits */
  hits: number;
  
  /** Cache misses */
  misses: number;
  
  /** Hit ratio (0-1) */
  hitRatio: number;
  
  /** Memory usage (bytes) */
  memoryUsage: number;
  
  /** Expired entries */
  expiredEntries: number;
  
  /** Category breakdown */
  categories: Record<CacheCategory, {
    entries: number;
    memory: number;
    hitRatio: number;
  }>;
}

/**
 * Performance tracker for monitoring SDK operations
 */
export interface PerformanceTracker {
  /** Start timing operation */
  startTimer(operationName: string): string;
  
  /** End timing operation */
  endTimer(timerId: string): number;
  
  /** Record custom metric */
  recordMetric(name: string, value: number, unit?: string): void;
  
  /** Get performance metrics */
  getMetrics(): PerformanceMetrics;
  
  /** Reset metrics */
  reset(): void;
  
  /** Export metrics for analysis */
  export(): PerformanceReport;
}

/**
 * Performance metrics with detailed breakdown
 */
export interface PerformanceMetrics {
  /** Operation timings */
  timings: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  }>;
  
  /** Custom metrics */
  metrics: Record<string, {
    value: number;
    unit: string;
    timestamp: number;
  }>;
  
  /** Memory usage */
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  
  /** Error counts */
  errors: Record<string, number>;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * SDK-specific error class with enhanced context
 */
export declare class FarertSDKError extends Error {
  public readonly code: FarertSDKErrorCode;
  public readonly context: Record<string, any>;
  public readonly timestamp: number;
  public readonly retryable: boolean;
  
  constructor(
    message: string,
    code: FarertSDKErrorCode,
    context?: Record<string, any>,
    retryable?: boolean
  );
}

/**
 * SDK error codes with comprehensive coverage
 */
export enum FarertSDKErrorCode {
  // Initialization errors
  WASM_LOAD_FAILED = 'WASM_LOAD_FAILED',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  
  // Runtime errors
  INVALID_ROUTE = 'INVALID_ROUTE',
  CALCULATION_FAILED = 'CALCULATION_FAILED',
  STATION_NOT_FOUND = 'STATION_NOT_FOUND',
  LINE_NOT_FOUND = 'LINE_NOT_FOUND',
  
  // Cache errors
  CACHE_ERROR = 'CACHE_ERROR',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Configuration errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  
  // State errors
  INVALID_STATE = 'INVALID_STATE',
  NOT_INITIALIZED = 'NOT_INITIALIZED'
}

/**
 * Route validation error codes
 */
export enum RouteValidationErrorCode {
  STATION_NOT_FOUND = 'STATION_NOT_FOUND',
  LINE_NOT_FOUND = 'LINE_NOT_FOUND',
  INVALID_CONNECTION = 'INVALID_CONNECTION',
  CIRCULAR_ROUTE = 'CIRCULAR_ROUTE',
  EMPTY_ROUTE = 'EMPTY_ROUTE',
  MALFORMED_INPUT = 'MALFORMED_INPUT'
}

// ============================================================================
// SVELTE INTEGRATION
// ============================================================================

/**
 * Svelte store state for reactive UI development
 */
export interface FarertStoreState {
  /** SDK initialization status */
  isReady: boolean;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Error state */
  hasError: boolean;
  
  /** Current error */
  currentError: FarertSDKError | null;
  
  /** Whether retry is possible */
  canRetry: boolean;
  
  /** WebAssembly module instance */
  wasmModule: FarertModule | null;
  
  /** SDK configuration */
  config: SDKConfig;
  
  /** Performance metrics */
  metrics: PerformanceMetrics;
  
  /** Cache statistics */
  cacheStats: CacheStats;
}

/**
 * Svelte stores for reactive state management
 */
export interface FarertStores {
  /** Main SDK store */
  farertStore: import('svelte/store').Readable<FarertStoreState>;
  
  /** Initialization status */
  isReady: import('svelte/store').Readable<boolean>;
  
  /** Loading status */
  isLoading: import('svelte/store').Readable<boolean>;
  
  /** Error status */
  hasError: import('svelte/store').Readable<boolean>;
  
  /** Current error */
  currentError: import('svelte/store').Readable<FarertSDKError | null>;
  
  /** Retry capability */
  canRetry: import('svelte/store').Readable<boolean>;
  
  /** WebAssembly module */
  wasmModule: import('svelte/store').Readable<FarertModule | null>;
}

// ============================================================================
// REACT INTEGRATION
// ============================================================================

/**
 * React SDK Context value
 */
export interface FarertSDKContextValue {
  sdk: FarertSDK | null;
  state: FarertStoreState;
  initialize: () => Promise<void>;
  retry: () => Promise<void>;
}

/**
 * React hooks for SDK integration
 */
export interface ReactHooks {
  useFarertSDK(): FarertSDKContextValue;
  useStationSearch(query: string, options?: StationSearchOptions): UseStationSearchResult;
  useFareCalculation(route: RouteSpec): UseFareCalculationResult;
  useRouteBuilder(initial?: RouteSpec): UseRouteBuilderResult;
  useReferenceData(): UseReferenceDataResult;
}

// ============================================================================
// VUE INTEGRATION
// ============================================================================

/**
 * Vue composables for SDK integration
 */
export interface VueComposables {
  useFarertSDK(): VueUseFarertSDKResult;
  useStationSearch(query: import('vue').Ref<string>, options?: StationSearchOptions): VueUseStationSearchResult;
  useFareCalculation(route: import('vue').Ref<RouteSpec>): VueUseFareCalculationResult;
  useRouteBuilder(initial?: RouteSpec): VueUseRouteBuilderResult;
  useReferenceData(): VueUseReferenceDataResult;
}

// ============================================================================
// UTILITIES AND HELPERS
// ============================================================================

/**
 * Framework-agnostic utilities
 */
export interface FarertUtilities {
  // Formatting utilities
  formatFare(fare: number, options?: FareFormatOptions): string;
  formatStationName(station: StationInfo, options?: StationNameOptions): string;
  formatRouteDescription(route: RouteSegment[], options?: RouteDescriptionOptions): string;
  
  // Validation utilities
  validateRoute(route: RouteSpec): Promise<RouteValidationResult>;
  validateStation(station: string | number): Promise<boolean>;
  
  // Route building utilities
  buildRoute(segments: RouteSegment[]): RouteSpec;
  optimizeRoute(route: RouteSpec, options?: RouteOptimizationOptions): Promise<RouteSpec>;
  
  // Search utilities
  searchStations(query: string, options?: StationSearchOptions): Promise<StationSearchResult[]>;
  findShortestRoute(start: string, end: string): Promise<RoutePlanResult>;
  
  // Analysis utilities
  analyzeRoute(route: RouteSpec): Promise<RouteAnalysis>;
  compareFares(routes: RouteSpec[]): Promise<FareComparison>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard functions for runtime type checking
 */
export declare function isStationInfo(obj: any): obj is StationInfo;
export declare function isRouteSegment(obj: any): obj is RouteSegment;
export declare function isFareCalculationResult(obj: any): obj is FareCalculationResult;
export declare function isFarertSDKError(error: any): error is FarertSDKError;

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * SDK version and metadata
 */
export declare const SDK_VERSION: string;
export declare const SUPPORTED_FEATURES: Record<string, boolean>;
export declare const LIMITS: Record<string, number>;
export declare const TIMEOUTS: Record<string, number>;
export declare const ERROR_MESSAGES: Record<string, string>;

/**
 * SDK information object
 */
export declare const SDK_INFO: {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  repository: string;
  documentation: string;
  compatibility: Record<string, string>;
  features: Record<string, boolean>;
  apiCoverage: Record<string, number>;
};

// ============================================================================
// QUICK START FUNCTIONS
// ============================================================================

/**
 * Quick start function for simple applications
 */
export declare function quickStart(config?: Partial<SDKConfig>): Promise<{
  sdk: FarertSDK;
  utils: FarertUtilities;
  version: string;
}>;

/**
 * Create a minimal fare calculator instance
 */
export declare function createCalculator(): Promise<{
  initialize(): Promise<void>;
  calculate(startStation: string, endStation: string): Promise<number>;
  calculateAdvanced(startStation: string, endStation: string): Promise<FareCalculationResult>;
  searchStations(query: string): Promise<StationSearchResult[]>;
  routeBuilder: any;
  sdk: FarertSDK;
}>;

// ============================================================================
// MAIN MODULE EXPORTS
// ============================================================================

/**
 * Main module exports - Primary entry points for different use cases
 */

// Core SDK
export { FarertSDK, createFarertSDK, createDevelopmentSDK, createProductionSDK };

// Svelte integration (Primary)
export * from './svelte';

// React integration (Secondary)
export * from './react';

// Vue integration (Secondary)
export * from './vue';

// Core functionality
export * from './core';
export * from './cache';
export * from './errors';
export * from './utils';

// Type definitions
export * from './types';

// Quick start utilities
export { quickStart, createCalculator };

/**
 * Default export for convenience
 */
declare const _default: {
  SDK: {
    create: Promise<typeof createFarertSDK>;
    createDevelopment: Promise<typeof createDevelopmentSDK>;
    createProduction: Promise<typeof createProductionSDK>;
  };
  stores: {
    farert: Promise<any>;
    routeBuilder: Promise<any>;
  };
  utils: {
    fare: Promise<FarertUtilities>;
    route: Promise<any>;
  };
  quickStart: typeof quickStart;
  createCalculator: typeof createCalculator;
  version: string;
  info: typeof SDK_INFO;
  dev: any;
};

export default _default;

// ============================================================================
// MODULE AUGMENTATION FOR FRAMEWORK SUPPORT
// ============================================================================

/**
 * Module augmentation for Svelte
 */
declare module 'svelte/store' {
  interface Readable<T> {
    // Ensure compatibility with Svelte stores
  }
  
  interface Writable<T> extends Readable<T> {
    // Ensure compatibility with Svelte stores
  }
}

/**
 * Module augmentation for Vue
 */
declare module 'vue' {
  interface ComponentCustomProperties {
    $farertSDK: FarertSDK;
  }
}

/**
 * Module augmentation for React
 */
declare module 'react' {
  interface Component {
    // React component augmentation if needed
  }
}

// ============================================================================
// SUPPORTING TYPE DEFINITIONS
// ============================================================================

/**
 * Supporting interfaces and types used throughout the SDK
 */

export interface FareCalculationOptions {
  includeLongRoute?: boolean;
  includeAlternatives?: boolean;
  maxAlternatives?: number;
  includeDiscounts?: boolean;
  calculationTimeout?: number;
}

export interface CalculationMetrics {
  calculationTime: number;
  cacheHitRatio: number;
  alternativesConsidered: number;
  discountsApplied: number;
}

export interface RouteAnalysis {
  complexity: number;
  estimatedTime: number;
  costEfficiency: number;
  transfers: {
    count: number;
    locations: StationInfo[];
    averageWaitTime: number;
  };
  lineUsage: Array<{
    line: LineInfo;
    distance: number;
    time: number;
    fare: number;
  }>;
  recommendations: string[];
}

export interface FareComparison {
  routes: Array<{
    route: RouteSpec;
    fare: number;
    time: number;
    complexity: number;
    rank: number;
  }>;
  best: {
    cheapest: RouteSpec;
    fastest: RouteSpec;
    simplest: RouteSpec;
    recommended: RouteSpec;
  };
  metrics: {
    fareRange: { min: number; max: number };
    timeRange: { min: number; max: number };
    averageFare: number;
    averageTime: number;
  };
}

export interface RoutePlanResult {
  route: RouteSegment[];
  totalFare: number;
  totalTime: number;
  totalDistance: number;
  alternatives: AlternativeRoute[];
  characteristics: {
    transferCount: number;
    usesShinkansen: boolean;
    usesPrivateRailway: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

export enum RouteFlagType {
  TRANSFER = 'transfer',
  EXPRESS = 'express',
  LIMITED_EXPRESS = 'limited_express',
  SHINKANSEN = 'shinkansen',
  GREEN_CAR = 'green_car'
}

export interface FareFormatOptions {
  locale?: string;
  currency?: string;
  includeCurrency?: boolean;
  rounding?: 'floor' | 'ceil' | 'round';
}

export interface StationNameOptions {
  includePrefecture?: boolean;
  includeKana?: boolean;
  style?: 'short' | 'medium' | 'long';
}

export interface RouteDescriptionOptions {
  includeTime?: boolean;
  includeFare?: boolean;
  language?: 'ja' | 'en';
  detail?: 'minimal' | 'standard' | 'detailed';
}

export interface RouteOptimizationOptions {
  criteria: 'time' | 'cost' | 'comfort' | 'balanced';
  allowAlternatives?: boolean;
  maxOptimizationTime?: number;
}

export interface PreWarmData {
  popularStations: number[];
  commonRoutes: RouteSpec[];
  referenceData: boolean;
}

export interface PerformanceReport {
  summary: {
    totalOperations: number;
    averageResponseTime: number;
    errorRate: number;
    cacheEfficiency: number;
  };
  detailed: PerformanceMetrics;
  recommendations: string[];
}

// Hook result types
export interface UseStationSearchResult {
  results: StationSearchResult[];
  loading: boolean;
  error: FarertSDKError | null;
  search: (query: string) => void;
}

export interface UseFareCalculationResult {
  result: FareCalculationResult | null;
  loading: boolean;
  error: FarertSDKError | null;
  calculate: (route: RouteSpec) => void;
}

export interface UseRouteBuilderResult {
  route: RouteSpec | null;
  isValid: boolean;
  errors: RouteValidationError[];
  addSegment: (segment: RouteSegment) => void;
  removeSegment: (index: number) => void;
  clear: () => void;
}

export interface UseReferenceDataResult {
  companies: CompanyInfo[];
  prefectures: PrefectureInfo[];
  loading: boolean;
  error: FarertSDKError | null;
}

// Vue-specific types
export interface VueUseFarertSDKResult {
  sdk: import('vue').Ref<FarertSDK | null>;
  state: import('vue').Ref<FarertStoreState>;
  initialize: () => Promise<void>;
  retry: () => Promise<void>;
}

export interface VueUseStationSearchResult {
  results: import('vue').Ref<StationSearchResult[]>;
  loading: import('vue').Ref<boolean>;
  error: import('vue').Ref<FarertSDKError | null>;
  search: (query: string) => void;
}

export interface VueUseFareCalculationResult {
  result: import('vue').Ref<FareCalculationResult | null>;
  loading: import('vue').Ref<boolean>;
  error: import('vue').Ref<FarertSDKError | null>;
  calculate: (route: RouteSpec) => void;
}

export interface VueUseRouteBuilderResult {
  route: import('vue').Ref<RouteSpec | null>;
  isValid: import('vue').Ref<boolean>;
  errors: import('vue').Ref<RouteValidationError[]>;
  addSegment: (segment: RouteSegment) => void;
  removeSegment: (index: number) => void;
  clear: () => void;
}

export interface VueUseReferenceDataResult {
  companies: import('vue').Ref<CompanyInfo[]>;
  prefectures: import('vue').Ref<PrefectureInfo[]>;
  loading: import('vue').Ref<boolean>;
  error: import('vue').Ref<FarertSDKError | null>;
}

// Event system
export interface FarertSDKEventMap {
  'initialized': FarertSDKInitializedEvent;
  'error': FarertSDKErrorEvent;
  'stationSelected': StationSelectedEvent;
  'routeCalculated': RouteCalculatedEvent;
  'cacheUpdated': CacheUpdatedEvent;
}

export interface FarertSDKEvent {
  type: string;
  timestamp: number;
  source: 'sdk' | 'user' | 'system';
}

export interface FarertSDKInitializedEvent extends FarertSDKEvent {
  type: 'initialized';
  data: {
    initializationTime: number;
    version: string;
    features: string[];
  };
}

export interface FarertSDKErrorEvent extends FarertSDKEvent {
  type: 'error';
  error: FarertSDKError;
  recoveryStrategy?: ErrorRecoveryStrategy;
}

export interface StationSelectedEvent extends FarertSDKEvent {
  type: 'stationSelected';
  station: StationInfo;
  selectionContext: 'start' | 'end' | 'via';
}

export interface RouteCalculatedEvent extends FarertSDKEvent {
  type: 'routeCalculated';
  result: FareCalculationResult;
  route: RouteSpec;
}

export interface CacheUpdatedEvent extends FarertSDKEvent {
  type: 'cacheUpdated';
  stats: CacheStats;
}

export interface ErrorRecoveryStrategy {
  canRetry: boolean;
  retryDelay: number;
  maxRetries: number;
  recoveryActions: Array<() => Promise<void>>;
  fallback?: () => Promise<void>;
}