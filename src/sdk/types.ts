/**
 * TypeScript type definitions for Farert SDK
 * Re-exports CLI types and adds React-specific extensions
 * Based on CLAUDE.md and REQ-API-003 requirements
 */

// Re-export all CLI types for convenience
export * from '../cli/types';

// Import specific types for extension
import {
  FarertModule as BaseFarertModule,
  FareInfoData as BaseFareInfoData,
  RouteWrapper as BaseRouteWrapper,
  CalcRouteWrapper as BaseCalcRouteWrapper,
  CLIError,
  CLIErrorCode
} from '../cli/types';

// Extended interfaces for React SDK
export interface ExtendedFarertModule extends BaseFarertModule {
  // Additional methods that might be available in React context
  getVersion?(): string;
  getStationKana?(stationId: number): string;
  getStationPrefecture?(stationId: number): string;
  getCompanyName?(companyId: number): string;
  
  // Enhanced utility methods
  searchStationsByName?(query: string): number[];
  searchStationsByKana?(kanaQuery: string): number[];
  getStationsByPrefecture?(prefectureId: number): number[];
  
  // Route optimization methods
  findOptimalRoute?(startStationId: number, endStationId: number): number[];
  getAlternativeRoutes?(startStationId: number, endStationId: number): number[][];
}

// Enhanced station information for UI components
export interface StationInfo {
  id: number;
  name: string;
  nameExtended: string;
  kana: string;
  prefecture: string;
  prefectureId: number;
  isJunction: boolean;
  lines: LineInfo[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Line information for UI components
export interface LineInfo {
  id: number;
  name: string;
  companyId: number;
  companyName: string;
  color?: string;
  isJR: boolean;
  isPrivate: boolean;
  stations: number[];
}

// Company information
export interface CompanyInfo {
  id: number;
  name: string;
  type: 'JR' | 'PRIVATE' | 'MUNICIPAL';
  region?: string;
  color?: string;
}

// Prefecture information
export interface PrefectureInfo {
  id: number;
  name: string;
  region: string;
  stationCount: number;
}

// Enhanced route segment for React components
export interface RouteSegmentInfo {
  stationId: number;
  stationName: string;
  stationKana: string;
  lineId?: number;
  lineName?: string;
  travelTime?: number; // minutes
  distance?: number; // kilometers
  fare?: number;
  isTransfer: boolean;
  transferLines?: LineInfo[];
}

// Route planning result
export interface RoutePlanResult {
  route: RouteSegmentInfo[];
  totalFare: number;
  totalTime: number;
  totalDistance: number;
  transfers: number;
  fareBreakdown: FareBreakdownItem[];
  alternatives?: RoutePlanResult[];
}

// Fare breakdown for detailed display
export interface FareBreakdownItem {
  description: string;
  amount: number;
  type: 'base' | 'express' | 'reserved' | 'discount' | 'special';
  lineIds?: number[];
  stationRange?: {
    start: number;
    end: number;
  };
}

// Search filters for stations and routes
export interface StationSearchFilters {
  prefecture?: string;
  company?: string;
  isJunction?: boolean;
  hasExpress?: boolean;
  includeInactive?: boolean;
}

export interface RouteSearchOptions {
  preferExpress?: boolean;
  avoidTransfers?: boolean;
  maxTransfers?: number;
  includePremium?: boolean;
  departureTime?: Date;
  optimizeFor?: 'time' | 'cost' | 'comfort';
}

// Validation schemas for forms
export interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}

export interface RouteValidationError {
  field: 'startStation' | 'endStation' | 'viaStations' | 'route';
  message: string;
  code: string;
  value?: any;
}

export interface RouteValidationWarning {
  message: string;
  suggestion?: string;
  affectedSegment?: number;
}

// Caching interfaces
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
}

// Performance monitoring
export interface PerformanceMetrics {
  wasmLoadTime: number;
  dbInitTime: number;
  averageSearchTime: number;
  averageCalculationTime: number;
  memoryUsage: {
    wasm: number;
    js: number;
    total: number;
  };
  errorRate: number;
  cacheHitRate: number;
}

// Event interfaces for React components
export interface FarertEvent<T = any> {
  type: string;
  data: T;
  timestamp: Date;
  source: 'user' | 'system' | 'wasm';
}

export interface StationSelectedEvent extends FarertEvent<StationInfo> {
  type: 'station:selected';
}

export interface RouteCalculatedEvent extends FarertEvent<RoutePlanResult> {
  type: 'route:calculated';
}

export interface ErrorEvent extends FarertEvent<CLIError> {
  type: 'error:occurred';
}

// Hook return types
export interface UseStationSearchResult {
  results: StationInfo[];
  isLoading: boolean;
  error: CLIError | null;
  query: string;
  hasMore: boolean;
  loadMore: () => void;
  clear: () => void;
}

export interface UseFareCalculationResult {
  result: RoutePlanResult | null;
  isCalculating: boolean;
  error: CLIError | null;
  calculate: (route: RouteSegmentInfo[]) => Promise<void>;
  clear: () => void;
  recalculate: () => Promise<void>;
}

export interface UseRouteBuildingResult {
  segments: RouteSegmentInfo[];
  validation: RouteValidationResult;
  fareResult: RoutePlanResult | null;
  isValid: boolean;
  isLoading: boolean;
  isDirty: boolean;
  errorMessage: string | null;
  
  // Actions
  addStation: (stationId: number, lineId?: number) => Promise<void>;
  removeStation: (index: number) => void;
  moveStation: (fromIndex: number, toIndex: number) => void;
  clear: () => void;
  optimize: () => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Drag and Drop
  onDragStart?: (index: number) => void;
  onDragOver?: (index: number) => void;
  onDragEnd?: () => void;
  dragState: {
    isDragging: boolean;
    dragIndex: number;
    dragOverIndex: number;
  };
  
  // Utilities
  validateRoute: (segments: RouteSegmentInfo[]) => Promise<RouteValidationResult>;
  calculateFare: (segments: RouteSegmentInfo[]) => Promise<RoutePlanResult | null>;
  getStationInfo: (stationId: number) => Promise<StationInfo | null>;
  getLineInfo: (lineId: number) => Promise<LineInfo | null>;
  routeBuilder: any; // RouteBuilder from fare-utils
}

// Configuration interfaces for React provider
export interface ReactSDKConfig {
  // Cache configuration
  cache: {
    enabled: boolean;
    maxSize: number;
    defaultTtl: number;
    stationSearchTtl: number;
    fareCalculationTtl: number;
  };
  
  // Performance configuration  
  performance: {
    enableMetrics: boolean;
    metricsSampleRate: number;
    slowOperationThreshold: number;
  };
  
  // UI configuration
  ui: {
    enableAnimations: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: 'ja' | 'en';
    currency: 'JPY' | 'USD';
  };
  
  // Debug configuration
  debug: {
    enabled: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logWasmCalls: boolean;
    logPerformance: boolean;
  };
  
  // Error handling
  errorHandling: {
    retryAttempts: number;
    retryDelayMs: number;
    enableUserErrorReporting: boolean;
  };
}

// Component prop interfaces
export interface StationSelectorProps {
  value?: StationInfo | null;
  onChange: (station: StationInfo | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  filters?: StationSearchFilters;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
  onValidation?: (result: RouteValidationResult) => void;
}

export interface RouteBuilderProps {
  value: RouteSegmentInfo[];
  onChange: (route: RouteSegmentInfo[]) => void;
  options?: RouteSearchOptions;
  disabled?: boolean;
  error?: string;
  className?: string;
  enableDragDrop?: boolean;
  maxStations?: number;
  onValidation?: (result: RouteValidationResult) => void;
  onCalculate?: (result: RoutePlanResult) => void;
}

export interface FareDisplayProps {
  result: RoutePlanResult | null;
  showBreakdown?: boolean;
  showAlternatives?: boolean;
  className?: string;
  currency?: 'JPY' | 'USD';
  precision?: number;
  loading?: boolean;
  error?: CLIError | null;
}

// Utility type guards
export function isStationInfo(obj: any): obj is StationInfo {
  return obj && 
         typeof obj.id === 'number' && 
         typeof obj.name === 'string' &&
         typeof obj.kana === 'string';
}

export function isRouteSegmentInfo(obj: any): obj is RouteSegmentInfo {
  return obj && 
         typeof obj.stationId === 'number' && 
         typeof obj.stationName === 'string' &&
         typeof obj.isTransfer === 'boolean';
}

export function isRoutePlanResult(obj: any): obj is RoutePlanResult {
  return obj && 
         Array.isArray(obj.route) &&
         typeof obj.totalFare === 'number' &&
         typeof obj.totalTime === 'number';
}

// Error codes specific to React SDK
export enum ReactSDKErrorCode {
  COMPONENT_INIT_FAILED = 1000,
  HOOK_MISUSE = 1001,
  CONTEXT_NOT_FOUND = 1002,
  CACHE_OPERATION_FAILED = 1003,
  VALIDATION_FAILED = 1004,
  UI_RENDERING_ERROR = 1005,
  EVENT_HANDLER_ERROR = 1006,
  PERFORMANCE_THRESHOLD_EXCEEDED = 1007
}

// Extended error class for React-specific errors
export class ReactSDKError extends CLIError {
  constructor(
    message: string,
    code: ReactSDKErrorCode | CLIErrorCode = ReactSDKErrorCode.COMPONENT_INIT_FAILED,
    context?: Record<string, any>
  ) {
    super(message, code as CLIErrorCode, context);
    this.name = 'ReactSDKError';
  }
}

// Default configuration
export const defaultReactSDKConfig: ReactSDKConfig = {
  cache: {
    enabled: true,
    maxSize: 1000,
    defaultTtl: 5 * 60 * 1000, // 5 minutes
    stationSearchTtl: 10 * 60 * 1000, // 10 minutes
    fareCalculationTtl: 2 * 60 * 1000  // 2 minutes
  },
  performance: {
    enableMetrics: false,
    metricsSampleRate: 0.1,
    slowOperationThreshold: 1000 // 1 second
  },
  ui: {
    enableAnimations: true,
    theme: 'auto',
    language: 'ja',
    currency: 'JPY'
  },
  debug: {
    enabled: false,
    logLevel: 'warn',
    logWasmCalls: false,
    logPerformance: false
  },
  errorHandling: {
    retryAttempts: 3,
    retryDelayMs: 1000,
    enableUserErrorReporting: false
  }
};