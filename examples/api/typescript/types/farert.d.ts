/**
 * Complete TypeScript type definitions for Farert WebAssembly Module
 *
 * This file provides comprehensive typing for all 39+ WebAssembly APIs
 * and the 6-class inheritance system, ensuring type safety and excellent
 * developer experience when integrating with the Farert railway calculation engine.
 *
 * Based on CLAUDE.md specifications and maintaining 100% C++ compatibility.
 */

// Core WebAssembly Module Interface
export interface FarertModule {
  // Database operations (hidden in interface layer)
  openDatabase(): boolean;
  closeDatabase(): void;

  // === Core Route Operations ===
  createRoute(): number;
  destroyRoute(): void;
  addRouteBegin(stationId: number): number;
  addRoute(lineId: number, stationId: number): number;
  removeTail(): void;
  removeAll(): void;
  reverseRoute(): number;
  getRouteCount(): number;
  startStationId(): number;
  lastStationId(): number;
  isEnd(): number;
  calculateFare(): number;
  getFareString(): string;
  getFareInfoJson(): string;

  // === Station Operations ===
  getStationId(name: string): number;
  getStationName(id: number): string;
  getStationKana(id: number): string;
  getStationPrefecture(id: number): string;
  getStationNameExtended(id: number): string;

  // === Line Operations ===
  getLineId(name: string): number;
  getLineName(id: number): string;
  EnumLineOfStationId(stationId: number): number[];
  StationsIdsOfLineId(lineId: number): number[];
  JunctionIdsOfLineId(lineId: number, stationId: number): number[];
  linesCompanyOrPrefectId(id: number): number[];

  // === Route Building & Validation ===
  setupRoute(route: string): number;
  getRouteScript(): string;
  routeScript(): string;

  // === Route Configuration ===
  setLongRoute(flag: boolean): void;
  setStartAsCity(): void;
  setArriveAsCity(): void;

  // === Utility Functions ===
  isJunction(stationId: number): number;
  isSpecificJunction(lineId: number, stationId: number): number;
  getTerminalStationName(stationId: number): string;
  terminalName(id: number): string;

  // === Company & Prefecture Operations ===
  getJRCompanys(): number[];
  getPrefects(): number[];
  companyOrPrefectName(companyOrPrefect: number): string;
  getCompanyAndPrefectsAsJson(): string;

  // === Advanced Queries ===
  stationsWithinCompanyOrPrefectAndLine(companyOrPrefectId: number, lineId: number): number[];
  getCurrentRouteAsJson(): string;

  // === Database Information ===
  getDatabaseVersion(): number;

  // === Debug & Test Functions ===
  debugStations(): string;
  test(): number;

  // === Object Class Constructors ===
  cRoute: new() => RouteWrapper;
  cRouteList: new(route?: RouteWrapper) => RouteListWrapper;
  cCalcRoute: new(route: RouteWrapper | RouteListWrapper) => CalcRouteWrapper;
  cRouteItem: new() => RouteItemWrapper;
  cRouteFlag: new() => RouteFlagWrapper;
  FareInfo: new() => FareInfoData;

  // WebAssembly Module Metadata
  ready: Promise<void>;
  HEAP8: Int8Array;
  HEAP16: Int16Array;
  HEAP32: Int32Array;
  HEAPU8: Uint8Array;
  HEAPU16: Uint16Array;
  HEAPU32: Uint32Array;
  HEAPF32: Float32Array;
  HEAPF64: Float64Array;

  // Memory management
  _malloc(size: number): number;
  _free(ptr: number): void;
  getValue(ptr: number, type: string): number;
  setValue(ptr: number, value: number, type: string): void;
  UTF8ToString(ptr: number): string;
  stringToUTF8(str: string, outPtr: number, maxBytesToWrite: number): void;
  lengthBytesUTF8(str: string): number;

  // Additional utility properties
  [key: string]: any;
}

// === Object Class Interfaces (Inheritance: cCalcRoute < cRoute < cRouteList) ===

export interface RouteListWrapper {
  // Array operations (C++ operator overloading → explicit methods)
  assign(obj: RouteListWrapper): void;
  getSize(): number;
  isEmpty(): boolean;
  clear(): void;

  // Memory management
  delete(): void;
}

export interface RouteWrapper extends RouteListWrapper {
  // Route construction (matching C++ Route class exactly)
  setupRoute(routeString: string): number;
  addRoute(lineId: number, stationId: number): number;
  addRouteBegin(stationId: number): number;
  getRouteCount(): number;
  routeScript(): string;

  // Route information
  startStationId(): number;
  lastStationId(): number;
  isEnd(): number;

  // Route manipulation
  removeTail(): void;
  removeAll(): void;
  reverseRoute(): number;
}

export interface CalcRouteWrapper extends RouteWrapper {
  // Fare calculation (matching C++ CalcRoute class exactly)
  calcFare(): FareInfoData;
  calculateFare(): number;
  setLongRoute(flag: boolean): void;
  showFare(): string;
  getFareString(): string;
  getFareInfoJson(): string;

  // Route configuration
  setStartAsCity(): void;
  setArriveAsCity(): void;
}

export interface RouteItemWrapper {
  // Route segment data (matching C++ cRouteItem class exactly)
  stationId: number;
  lineId: number;
  flag: number;

  // Memory management
  delete(): void;
}

export interface RouteFlagWrapper {
  // Complex routing flags and special cases
  flag: number;

  // Memory management
  delete(): void;
}

// === Fare Information Interface (Complete FARE_INFO matching C++) ===
export interface FareInfoData {
  // Core fare information
  fare: number;
  fareInfoValid: boolean;

  // Fare calculation flags
  isRule114Applied: boolean;
  isSpecialFareApplied: boolean;
  isLongRouteApplied: boolean;

  // Stock discount information
  availCountForFareOfStockDiscount: number;
  fareForStockDiscount(index: number): number;
  fareForStockDiscountTitle(index: number): string;

  // Route information
  totalDistance: number;
  totalTime: number;
  transferCount: number;

  // Special fare components
  basicFare: number;
  expressFare: number;
  reservedSeatFare: number;
  specialExpressFare: number;

  // Fare breakdown
  fareBreakdown: FareBreakdownItem[];

  // Validation methods
  isValid(): boolean;

  // JSON export
  toJson(): string;

  // Memory management
  delete(): void;
}

// === Supporting Type Definitions ===

export interface FareBreakdownItem {
  description: string;
  amount: number;
  type: 'basic' | 'express' | 'reserved' | 'special' | 'discount';
  lineIds?: number[];
  stationRange?: {
    start: number;
    end: number;
  };
}

// === Station Type Definitions ===
export interface StationInfo {
  id: number;
  name: string;
  nameExtended: string;
  kana: string;
  prefecture: string;
  prefectureId: number;
  isJunction: boolean;
  lines: number[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface StationSearchResult {
  stations: StationInfo[];
  query: string;
  total: number;
  hasMore: boolean;
}

// === Line Type Definitions ===
export interface LineInfo {
  id: number;
  name: string;
  companyId: number;
  companyName: string;
  isJR: boolean;
  isPrivate: boolean;
  stations: number[];
  prefecture?: string;
}

export interface CompanyInfo {
  id: number;
  name: string;
  type: 'JR' | 'PRIVATE' | 'MUNICIPAL';
  region?: string;
  lines: number[];
}

export interface PrefectureInfo {
  id: number;
  name: string;
  region: string;
  stationCount: number;
  companies: number[];
}

// === Route Building Types ===
export interface RouteSegment {
  stationId: number;
  stationName: string;
  lineId?: number;
  lineName?: string;
  isTransfer: boolean;
  transferLines?: number[];
}

export interface RouteBuildingOptions {
  preferExpress?: boolean;
  avoidTransfers?: boolean;
  maxTransfers?: number;
  optimizeFor?: 'time' | 'cost' | 'comfort';
}

export interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}

export interface RouteValidationError {
  type: 'STATION_NOT_FOUND' | 'LINE_NOT_FOUND' | 'CONNECTION_INVALID' | 'ROUTE_TOO_LONG';
  message: string;
  position?: number;
  stationId?: number;
  lineId?: number;
  suggestions?: string[];
}

export interface RouteValidationWarning {
  message: string;
  suggestion?: string;
  affectedSegment?: number;
}

// === Error Handling Types ===
export type FarertErrorCode =
  | -1    // Station not found
  | -2    // Line not found
  | -3    // Connection not possible
  | -4    // Database error
  | -5    // Memory error
  | -6    // Invalid parameter
  | -7    // Route too complex
  | -8    // Calculation failed
  | 0     // Success
  | number; // Other C++ error codes

export interface FarertError extends Error {
  code: FarertErrorCode;
  context?: Record<string, any>;
  stationId?: number;
  lineId?: number;
  route?: string;
}

// === Performance & Monitoring Types ===
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
  operationCount: number;
}

export interface TimingInfo {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
}

// === Async Pattern Types ===
export interface AsyncFarertModule extends FarertModule {
  // Async versions of core operations
  getStationIdAsync(name: string): Promise<number>;
  getStationNameAsync(id: number): Promise<string>;
  calculateFareAsync(): Promise<number>;
  setupRouteAsync(route: string): Promise<number>;

  // Batch operations
  getMultipleStationIds(names: string[]): Promise<number[]>;
  getMultipleStationNames(ids: number[]): Promise<string[]>;
  validateRouteConnections(segments: RouteSegment[]): Promise<RouteValidationResult>;

  // Advanced async operations
  findOptimalRoute(startStationId: number, endStationId: number): Promise<RouteSegment[]>;
  calculateMultipleRoutes(routes: string[]): Promise<FareInfoData[]>;
}

// === Type Guards ===
export function isFarertModule(obj: any): obj is FarertModule {
  return obj &&
    typeof obj.openDatabase === 'function' &&
    typeof obj.getStationId === 'function' &&
    typeof obj.calculateFare === 'function';
}

export function isStationInfo(obj: any): obj is StationInfo {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.kana === 'string';
}

export function isFareInfoData(obj: any): obj is FareInfoData {
  return obj &&
    typeof obj.fare === 'number' &&
    typeof obj.fareInfoValid === 'boolean';
}

export function isValidStationId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

export function isValidLineId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

// === Utility Type Helpers ===
export type StationIdArray = number[];
export type LineIdArray = number[];
export type RouteString = string;

// === Module Loading Types ===
export interface ModuleLoadOptions {
  wasmPath?: string;
  dbPath?: string;
  enableLogging?: boolean;
  memoryInitialPages?: number;
  memoryMaximumPages?: number;
  optimizeForSize?: boolean;
}

export interface LoadResult {
  module: FarertModule;
  loadTime: number;
  memoryUsage: number;
  version: string;
  dbVersion: number;
}

// === Constants ===
export const FARERT_CONSTANTS = {
  // Station ID ranges
  STATION_ID_MIN: 1000000,
  STATION_ID_MAX: 9999999,

  // Line ID ranges
  LINE_ID_MIN: 10000,
  LINE_ID_MAX: 99999,

  // Company ID ranges
  JR_COMPANY_ID_MAX: 0x10000,
  PREFECTURE_ID_MIN: 0x10000,

  // Error codes
  SUCCESS: 0,
  STATION_NOT_FOUND: -1,
  LINE_NOT_FOUND: -2,
  CONNECTION_INVALID: -3,
  DATABASE_ERROR: -4,
  MEMORY_ERROR: -5,
  INVALID_PARAMETER: -6,
  ROUTE_TOO_COMPLEX: -7,
  CALCULATION_FAILED: -8,

  // Limits
  MAX_ROUTE_SEGMENTS: 50,
  MAX_TRANSFERS: 10,
  MAX_SEARCH_RESULTS: 1000,

  // Timeouts (milliseconds)
  DEFAULT_TIMEOUT: 5000,
  CALCULATION_TIMEOUT: 10000,
  SEARCH_TIMEOUT: 3000
} as const;

// === Export all types ===
export default FarertModule;