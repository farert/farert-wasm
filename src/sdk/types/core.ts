/**
 * Core SDK interfaces for Farert WebAssembly Frontend API Layer
 * 
 * This file provides the foundational TypeScript interfaces for the Frontend API Layer SDK.
 * The SDK wraps the existing 39+ WebAssembly APIs and 6 Object Classes to provide
 * a comprehensive, Svelte-first TypeScript SDK with secondary support for other frameworks.
 * 
 * Architecture:
 * - Svelte-first design with reactive stores
 * - Framework-agnostic utilities for reuse
 * - Complete TypeScript type safety
 * - SvelteKit SSR and static generation support
 * - Intelligent caching and performance optimization
 * - Comprehensive error handling with retry mechanisms
 * 
 * @file Core SDK Foundation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-001: Core TypeScript SDK Foundation
 * - REQ-API-006: Frontend SDK Development Experience
 */

// ============================================================================
// IMPORTS AND RE-EXPORTS
// ============================================================================

// Import base types from CLI implementation
import type {
  FarertModule,
  FareInfoData,
  RouteWrapper,
  CalcRouteWrapper,
  RouteListWrapper,
  RouteItemWrapper,
  RouteFlagWrapper,
  CLIError,
  CLIErrorCode,
  DatabaseError
} from '../../cli/types';

// Re-export CLI types for compatibility
export type {
  FarertModule,
  FareInfoData,
  RouteWrapper,
  CalcRouteWrapper,
  RouteListWrapper,
  RouteItemWrapper,
  RouteFlagWrapper,
  CLIError,
  CLIErrorCode,
  DatabaseError
} from '../../cli/types';

// ============================================================================
// CORE SDK INTERFACE
// ============================================================================

/**
 * Main SDK interface that wraps all WebAssembly functionality
 * 
 * This interface provides the primary entry point for SDK functionality,
 * encapsulating all 39+ WebAssembly APIs and 6 object classes with
 * enhanced TypeScript support and error handling.
 * 
 * @interface FarertSDK
 * @since 1.0.0
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

// ============================================================================
// SDK STATE AND CONFIGURATION
// ============================================================================

/**
 * SDK state enumeration
 * 
 * Represents the current lifecycle state of the SDK.
 */
export enum SDKState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed'
}

/**
 * SDK configuration interface
 * 
 * Configuration options for SDK initialization and behavior.
 */
export interface SDKConfig {
  /** WebAssembly module path */
  wasmPath?: string;
  
  /** Enable caching */
  caching: {
    enabled: boolean;
    maxSize: number;
    ttl: number; // Time to live in milliseconds
  };
  
  /** Performance monitoring */
  performance: {
    enabled: boolean;
    trackingLevel: 'basic' | 'detailed' | 'verbose';
  };
  
  /** Error handling */
  errorHandling: {
    retryAttempts: number;
    retryDelay: number; // Milliseconds
    enableFuzzyMatching: boolean;
  };
  
  /** Localization */
  locale: {
    language: 'ja' | 'en';
    currency: 'JPY';
    numberFormat: Intl.NumberFormatOptions;
  };
  
  /** Development mode */
  development: boolean;
}

/**
 * Default SDK configuration
 */
export const DEFAULT_SDK_CONFIG: SDKConfig = {
  caching: {
    enabled: true,
    maxSize: 1000,
    ttl: 300000 // 5 minutes
  },
  performance: {
    enabled: true,
    trackingLevel: 'basic'
  },
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000,
    enableFuzzyMatching: true
  },
  locale: {
    language: 'ja',
    currency: 'JPY',
    numberFormat: {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }
  },
  development: false
};

// ============================================================================
// STATION AND ROUTE DATA MODELS
// ============================================================================

/**
 * Enhanced station information
 * 
 * Comprehensive station data for UI components and route building.
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
}

/**
 * Line information
 * 
 * Details about railway lines for route planning.
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
}

/**
 * Company information
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
}

/**
 * Prefecture information
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
}

// ============================================================================
// ROUTE BUILDING AND CALCULATION
// ============================================================================

/**
 * Route specification
 * 
 * Flexible route definition supporting multiple input formats.
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
 * Route segment information
 * 
 * Details about a segment of a route.
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
}

/**
 * Fare calculation result
 * 
 * Comprehensive fare calculation results with breakdown.
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
  
  /** Calculation metadata */
  metadata: {
    calculationTime: number; // milliseconds
    cacheHit: boolean;
    version: string;
  };
}

/**
 * Fare breakdown item
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
}

/**
 * Fare discount option
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
}

/**
 * Route plan result
 * 
 * Result of route planning with multiple options.
 */
export interface RoutePlanResult {
  /** Primary recommended route */
  route: RouteSegment[];
  
  /** Total fare for primary route */
  totalFare: number;
  
  /** Total travel time in minutes */
  totalTime: number;
  
  /** Total distance in kilometers */
  totalDistance: number;
  
  /** Alternative routes */
  alternatives: AlternativeRoute[];
  
  /** Route characteristics */
  characteristics: {
    transferCount: number;
    usesShinkansen: boolean;
    usesPrivateRailway: boolean;
    complexity: 'simple' | 'moderate' | 'complex';
  };
}

/**
 * Alternative route option
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
}

// ============================================================================
// SEARCH AND FILTERING
// ============================================================================

/**
 * Station search options
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
}

/**
 * Station search result
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
}

/**
 * Route search options
 */
export interface RouteSearchOptions {
  /** Prefer faster routes */
  preferFaster?: boolean;
  
  /** Prefer cheaper routes */
  preferCheaper?: boolean;
  
  /** Avoid transfers */
  avoidTransfers?: boolean;
  
  /** Maximum number of transfers */
  maxTransfers?: number;
  
  /** Allowed line types */
  allowedLineTypes?: LineInfo['type'][];
  
  /** Prohibited lines */
  prohibitedLines?: number[];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Route validation result
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
}

/**
 * Route validation error
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
 * Route suggestion
 */
export interface RouteSuggestion {
  /** Suggested route */
  route: RouteSpec;
  
  /** Reason for suggestion */
  reason: string;
  
  /** Confidence score (0-1) */
  confidence: number;
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
// SVELTE STORE INTERFACES
// ============================================================================

/**
 * Svelte store state for Farert SDK
 * 
 * Reactive state management for Svelte applications.
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
 * Farert store configuration
 */
export interface FarertStoreConfig extends SDKConfig {
  /** Auto-initialize on store creation */
  autoInitialize?: boolean;
  
  /** Custom WASM loader */
  customLoader?: () => Promise<FarertModule>;
  
  /** Store update throttling (ms) */
  updateThrottle?: number;
}

/**
 * Initialization state for loading indicators
 */
export interface FarertInitializationState {
  /** Current step */
  step: InitializationStep;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Step description */
  description: string;
  
  /** Whether step completed successfully */
  success: boolean;
  
  /** Error if step failed */
  error?: FarertSDKError;
}

/**
 * Initialization steps
 */
export enum InitializationStep {
  LOADING_WASM = 'loading_wasm',
  INITIALIZING_DATABASE = 'initializing_database',
  VALIDATING_DATA = 'validating_data',
  SETTING_UP_CACHE = 'setting_up_cache',
  READY = 'ready'
}

// ============================================================================
// SVELTEKIT ADAPTER INTERFACES
// ============================================================================

/**
 * SvelteKit server-side adapter
 * 
 * Enables SSR support for the Farert SDK.
 */
export interface SvelteKitAdapter {
  /** Initialize for server-side rendering */
  initializeSSR(): Promise<void>;
  
  /** Serialize state for hydration */
  serializeState(): string;
  
  /** Deserialize state from SSR */
  deserializeState(serialized: string): FarertStoreState;
  
  /** Pre-cache common station data */
  preloadStations(stationIds: number[]): Promise<void>;
  
  /** Generate static fare data */
  generateStaticFares(routes: RouteSpec[]): Promise<Map<string, FareCalculationResult>>;
  
  /** Check if running in server context */
  isServerSide(): boolean;
}

/**
 * Static generation options
 */
export interface StaticGenerationOptions {
  /** Routes to pre-calculate */
  routes: RouteSpec[];
  
  /** Stations to pre-load */
  stations: Array<string | number>;
  
  /** Output format */
  format: 'json' | 'javascript' | 'typescript';
  
  /** Include metadata */
  includeMetadata: boolean;
  
  /** Compression options */
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli';
  };
}

// ============================================================================
// CACHING AND PERFORMANCE
// ============================================================================

/**
 * Cache manager interface
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
  
  /** Get cache statistics */
  getStats(): CacheStats;
  
  /** Optimize cache (remove expired entries) */
  optimize(): Promise<void>;
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  /** Cached value */
  value: T;
  
  /** Creation timestamp */
  created: number;
  
  /** Expiration timestamp */
  expires: number;
  
  /** Access count */
  accessCount: number;
  
  /** Last access timestamp */
  lastAccess: number;
}

/**
 * Cache statistics
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
}

/**
 * Performance tracker
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
}

/**
 * Performance metrics
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
 * SDK-specific error class
 */
export class FarertSDKError extends Error {
  public readonly code: FarertSDKErrorCode;
  public readonly context: Record<string, any>;
  public readonly timestamp: number;
  public readonly retryable: boolean;
  
  constructor(
    message: string,
    code: FarertSDKErrorCode,
    context: Record<string, any> = {},
    retryable = false
  ) {
    super(message);
    this.name = 'FarertSDKError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    this.retryable = retryable;
  }
}

/**
 * SDK error codes
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
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  /** Whether this error can be retried */
  canRetry: boolean;
  
  /** Retry delay in milliseconds */
  retryDelay: number;
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Recovery actions */
  recoveryActions: Array<() => Promise<void>>;
  
  /** Fallback behavior */
  fallback?: () => Promise<void>;
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

/**
 * SDK event map
 */
export interface FarertSDKEventMap {
  'initialized': FarertSDKInitializedEvent;
  'error': FarertSDKErrorEvent;
  'stationSelected': StationSelectedEvent;
  'routeCalculated': RouteCalculatedEvent;
  'cacheUpdated': CacheUpdatedEvent;
}

/**
 * Base SDK event
 */
export interface FarertSDKEvent {
  /** Event type */
  type: string;
  
  /** Event timestamp */
  timestamp: number;
  
  /** Event source */
  source: 'sdk' | 'user' | 'system';
}

/**
 * SDK initialized event
 */
export interface FarertSDKInitializedEvent extends FarertSDKEvent {
  type: 'initialized';
  data: {
    initializationTime: number;
    version: string;
    features: string[];
  };
}

/**
 * SDK error event
 */
export interface FarertSDKErrorEvent extends FarertSDKEvent {
  type: 'error';
  error: FarertSDKError;
  recoveryStrategy?: ErrorRecoveryStrategy;
}

/**
 * Station selected event
 */
export interface StationSelectedEvent extends FarertSDKEvent {
  type: 'stationSelected';
  station: StationInfo;
  selectionContext: 'start' | 'end' | 'via';
}

/**
 * Route calculated event
 */
export interface RouteCalculatedEvent extends FarertSDKEvent {
  type: 'routeCalculated';
  result: FareCalculationResult;
  route: RouteSpec;
}

/**
 * Cache updated event
 */
export interface CacheUpdatedEvent extends FarertSDKEvent {
  type: 'cacheUpdated';
  stats: CacheStats;
}

// ============================================================================
// FRAMEWORK-AGNOSTIC UTILITIES
// ============================================================================

/**
 * Utility collection interface
 * 
 * Framework-agnostic utilities for fare formatting, validation, and route building.
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

/**
 * Fare formatting options
 */
export interface FareFormatOptions {
  /** Locale for number formatting */
  locale?: string;
  
  /** Currency display */
  currency?: string;
  
  /** Include currency symbol */
  includeCurrency?: boolean;
  
  /** Rounding mode */
  rounding?: 'floor' | 'ceil' | 'round';
}

/**
 * Station name formatting options
 */
export interface StationNameOptions {
  /** Include prefecture */
  includePrefecture?: boolean;
  
  /** Include Hiragana reading */
  includeKana?: boolean;
  
  /** Format style */
  style?: 'short' | 'medium' | 'long';
}

/**
 * Route description formatting options
 */
export interface RouteDescriptionOptions {
  /** Include travel time */
  includeTime?: boolean;
  
  /** Include fare information */
  includeFare?: boolean;
  
  /** Language */
  language?: 'ja' | 'en';
  
  /** Detail level */
  detail?: 'minimal' | 'standard' | 'detailed';
}

/**
 * Route optimization options
 */
export interface RouteOptimizationOptions {
  /** Optimization criteria */
  criteria: 'time' | 'cost' | 'comfort' | 'balanced';
  
  /** Allow alternative routes */
  allowAlternatives?: boolean;
  
  /** Maximum optimization time (ms) */
  maxOptimizationTime?: number;
}

/**
 * Route analysis result
 */
export interface RouteAnalysis {
  /** Route complexity score (1-10) */
  complexity: number;
  
  /** Estimated travel time */
  estimatedTime: number;
  
  /** Cost efficiency rating */
  costEfficiency: number;
  
  /** Transfer analysis */
  transfers: {
    count: number;
    locations: StationInfo[];
    averageWaitTime: number;
  };
  
  /** Line usage breakdown */
  lineUsage: Array<{
    line: LineInfo;
    distance: number;
    time: number;
    fare: number;
  }>;
  
  /** Recommendations */
  recommendations: string[];
}

/**
 * Fare comparison result
 */
export interface FareComparison {
  /** Route comparisons */
  routes: Array<{
    route: RouteSpec;
    fare: number;
    time: number;
    complexity: number;
    rank: number;
  }>;
  
  /** Best route by criteria */
  best: {
    cheapest: RouteSpec;
    fastest: RouteSpec;
    simplest: RouteSpec;
    recommended: RouteSpec;
  };
  
  /** Comparison metrics */
  metrics: {
    fareRange: { min: number; max: number };
    timeRange: { min: number; max: number };
    averageFare: number;
    averageTime: number;
  };
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

/**
 * Station selector component props
 */
export interface StationSelectorProps {
  /** Selected station */
  value?: StationInfo | null;
  
  /** Selection change handler */
  onSelect?: (station: StationInfo) => void;
  
  /** Search placeholder text */
  placeholder?: string;
  
  /** Search options */
  searchOptions?: StationSearchOptions;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Error state */
  error?: string;
  
  /** Required field */
  required?: boolean;
  
  /** Custom CSS classes */
  class?: string;
}

/**
 * Route builder component props
 */
export interface RouteBuilderProps {
  /** Initial route */
  initialRoute?: RouteSpec;
  
  /** Route change handler */
  onRouteChange?: (route: RouteSpec) => void;
  
  /** Calculation complete handler */
  onCalculationComplete?: (result: FareCalculationResult) => void;
  
  /** Allow automatic calculation */
  autoCalculate?: boolean;
  
  /** Show alternative routes */
  showAlternatives?: boolean;
  
  /** Maximum alternatives to show */
  maxAlternatives?: number;
  
  /** Custom CSS classes */
  class?: string;
  
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Fare display component props
 */
export interface FareDisplayProps {
  /** Fare calculation result */
  result: FareCalculationResult;
  
  /** Display options */
  options?: FareDisplayOptions;
  
  /** Show breakdown */
  showBreakdown?: boolean;
  
  /** Show discounts */
  showDiscounts?: boolean;
  
  /** Custom CSS classes */
  class?: string;
}

/**
 * Fare display options
 */
export interface FareDisplayOptions {
  /** Format style */
  style?: 'compact' | 'detailed' | 'breakdown';
  
  /** Include metadata */
  includeMetadata?: boolean;
  
  /** Highlight savings */
  highlightSavings?: boolean;
  
  /** Currency format */
  currencyFormat?: FareFormatOptions;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if an object is a StationInfo
 */
export function isStationInfo(obj: any): obj is StationInfo {
  return obj && 
         typeof obj.id === 'number' &&
         typeof obj.name === 'string' &&
         typeof obj.kana === 'string' &&
         typeof obj.prefecture === 'string' &&
         typeof obj.isJunction === 'boolean' &&
         Array.isArray(obj.lines);
}

/**
 * Type guard to check if an object is a RouteSegment
 */
export function isRouteSegment(obj: any): obj is RouteSegment {
  return obj &&
         typeof obj.stationId === 'number' &&
         typeof obj.stationName === 'string' &&
         typeof obj.isTransfer === 'boolean';
}

/**
 * Type guard to check if an object is a FareCalculationResult
 */
export function isFareCalculationResult(obj: any): obj is FareCalculationResult {
  return obj &&
         typeof obj.success === 'boolean' &&
         typeof obj.totalFare === 'number' &&
         Array.isArray(obj.breakdown) &&
         Array.isArray(obj.route);
}

/**
 * Type guard to check if an error is a FarertSDKError
 */
export function isFarertSDKError(error: any): error is FarertSDKError {
  return error instanceof FarertSDKError ||
         (error && 
          error.name === 'FarertSDKError' &&
          typeof error.code === 'string' &&
          typeof error.context === 'object');
}

// ============================================================================
// CONSTANTS AND DEFAULTS
// ============================================================================

/**
 * SDK version
 */
export const SDK_VERSION = '1.0.0';

/**
 * Supported features
 */
export const SUPPORTED_FEATURES = {
  webAssembly: true,
  svelteStores: true,
  reactHooks: false, // Future
  vueComposables: false, // Future
  angularServices: false, // Future
  caching: true,
  ssr: true,
  staticGeneration: true,
  typeScript: true,
  i18n: true
} as const;

/**
 * Maximum values for validation
 */
export const LIMITS = {
  MAX_ROUTE_SEGMENTS: 20,
  MAX_SEARCH_RESULTS: 100,
  MAX_ALTERNATIVES: 10,
  MAX_STATION_NAME_LENGTH: 50,
  MAX_CACHE_SIZE: 10000,
  MAX_RETRY_ATTEMPTS: 5
} as const;

/**
 * Default timeouts (milliseconds)
 */
export const TIMEOUTS = {
  WASM_LOAD: 30000,
  ROUTE_CALCULATION: 5000,
  STATION_SEARCH: 3000,
  CACHE_OPERATION: 1000
} as const;

/**
 * Default error messages
 */
export const ERROR_MESSAGES = {
  WASM_LOAD_FAILED: 'Failed to load WebAssembly module',
  INITIALIZATION_FAILED: 'SDK initialization failed',
  INVALID_ROUTE: 'Invalid route specification',
  CALCULATION_FAILED: 'Fare calculation failed',
  STATION_NOT_FOUND: 'Station not found',
  NOT_INITIALIZED: 'SDK not initialized'
} as const;