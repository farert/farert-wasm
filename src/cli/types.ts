/**
 * TypeScript type definitions for Farert CLI
 * Based on CLAUDE.md Target requirements
 */

// WebAssembly module interface
export interface FarertModule {
  // Database operations
  openDatabase(): boolean;
  closeDatabase(): void;
  
  // Route operations
  createRoute(): number;
  destroyRoute(): void;
  addRouteBegin(stationId: number): number;  // 改名: addStation → addRouteBegin
  addRoute(lineId: number, stationId: number): number;  // 追加: 2引数版
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
  
  // Station operations
  getStationId(name: string): number;
  getStationName(id: number): string;
  
  // Line operations
  getLineId(name: string): number;  // 追加
  getLineName(id: number): string;
  
  // Route script operations
  setupRoute(route: string): number;
  getRouteScript(): string;
  
  // Route calculation configuration
  setLongRoute(flag: boolean): void;
  setStartAsCity(): void;
  setArriveAsCity(): void;
  
  // Station/Line utility functions
  isJunction(stationId: number): number;
  isSpecificJunction(lineId: number, stationId: number): number;
  getTerminalStationName(stationId: number): string;
  
  // Database utility functions
  getDatabaseVersion(): number;
  
  // Debug and test functions
  debugStations(): string;
  test(): number;
  
  // 6 Object Classes (CLAUDE.md Public API)
  cRoute: new() => RouteWrapper;
  cRouteList: new(route: RouteWrapper) => RouteListWrapper;
  cCalcRoute: new(route: RouteWrapper | RouteListWrapper) => CalcRouteWrapper;
  cRouteItem: new() => RouteItemWrapper;
  cRouteFlag: new() => RouteFlagWrapper;
  FareInfo: new() => FareInfoData;
  
  // Utility functions
  [key: string]: any;
}

// Object class interfaces (inheritance: cCalcRoute < cRoute < cRouteList)
export interface RouteListWrapper {
  startStationId(): number;
  lastStationId(): number;
  routeScript(): string;
  
  // Essential RouteList operations (from CLAUDE.md specifications)
  removeAll(): void;
  assign(obj: RouteListWrapper): void;
}

export interface RouteWrapper extends RouteListWrapper {
  addRoute(stationId: number): number;
  addRouteWithLine(lineId: number, stationId: number): number;
  removeTail(): void;
  autoRoute(): number;
  reverseRoute(): number;
  setupRoute(route: string): void;
  setDetour(flag: boolean): void;
  setNoRule(flag: boolean): void;
  getRouteCount(): number;
  lastLineId(): number;
  isReverseAllow(): boolean;
  isEnd(): boolean;
}

export interface CalcRouteWrapper extends RouteWrapper {
  calcFare(): FareInfoData;
  calcFareJson(): string;
  showFare(): string;
  isEnableLongRoute(): boolean;
  setLongRoute(flag: boolean): void;
  setStartAsCity(): void;
  setArriveAsCity(): void;
}

// New object class interfaces (CLAUDE.md update)
export interface RouteItemWrapper {
  stationId: number;
  lineId: number;
  flag: number;
  
  // Required properties from CLAUDE.md specifications
  fare: number;
  salesKm: number;
  indexOfAggregate: number;
}

export interface RouteFlagWrapper {
  // Boolean properties (route flags)
  no_rule: boolean;
  jrtokaistock_applied: boolean;
  jrtokaistock_enable: boolean;
  meihan_city_flag: boolean;
  rule88: boolean;
  rule69: boolean;
  rule70: boolean;
  special_fare_enable: boolean;
  rule70bullet: boolean;
  rule16_5: boolean;
  bullet_line: boolean;
  bJrTokaiOnly: boolean;
  meihan_city_enable: boolean;
  trackmarkctl: boolean;
  jctsp_route_change: boolean;
  ter_begin_oosaka: boolean;
  ter_fin_oosaka: boolean;
  compncheck: boolean;
  compnpass: boolean;
  compnda: boolean;
  compnbegin: boolean;
  compnend: boolean;
  compnterm: boolean;
  tokai_shinkansen: boolean;
  notsamekokurahakatashinzai: boolean;
  end: boolean;
  osakakan_1dir: boolean;
  osakakan_2dir: boolean;
  osakakan_detour: boolean;
  
  // Numeric properties  
  rule86or87: number; // BYTE
  rule115: number; // int8_t
  urban_neerest: number; // int8_t
  osakaKanPass: number; // unsigned char
  
  // Public methods
  clear(): void;
  setAnotherRouteFlag(other: RouteFlagWrapper): void;
  rule_en(): boolean;
  setNoRule(b_rule: boolean): void;
  isEnableLongRoute(): boolean;
  isLongRoute(): boolean;
  setLongRoute(farflag: boolean): void;
  isEnableRule115(): boolean;
  isRule115specificTerm(): boolean;
  setSpecificTermRule115(ena: boolean): void;
  setStartAsCity(): void;
  setArriveAsCity(): void;
  setDisableRule86or87(): void;
  setEnableRule86or87(): void;
  isEnableRule86or87(): boolean;
  isAvailableRule86or87(): boolean;
  isAvailableRule86(): boolean;
  isAvailableRule87(): boolean;
  isAvailableRule88(): boolean;
  isAvailableRule70(): boolean;
  isAvailableRule69(): boolean;
}

export interface FareInfoData {
  result: number;
  fare: number;
  isRule114Applied: boolean;
  availCountForFareOfStockDiscount: number;
  beginStationId: number;
  endStationId: number;
  routeList: string;
  [key: string]: any;
}

// CLI command options
export interface CLIOptions {
  exec?: boolean;
  verbose?: boolean;
  help?: boolean;
}

// Test execution result
export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  executionTime?: number;
}

// Test suite configuration
export interface TestSuite {
  name: string;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  description: string;
  execute: (module: FarertModule) => Promise<TestResult>;
}

// Error types
export class CLIError extends Error {
  constructor(message: string, public code: number = 1) {
    super(message);
    this.name = 'CLIError';
  }
}

export class WebAssemblyLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebAssemblyLoadError';
  }
}

export class TestExecutionError extends Error {
  constructor(message: string, public testName: string) {
    super(message);
    this.name = 'TestExecutionError';
  }
}

