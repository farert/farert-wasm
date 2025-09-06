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

// Configuration management interfaces
export interface CLIConfiguration {
  debug: boolean;
  verbose: boolean;
  wasmPath?: string | undefined;
  platform: NodeJS.Platform;
  nodeVersion: string;
  memoryMonitoring: boolean;
}

export interface EnvironmentValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  configuration: CLIConfiguration;
  requiredFiles: RequiredFileInfo[];
}

export interface ValidationError {
  code: CLIErrorCode;
  message: string;
  filePath?: string;
  suggestions: string[];
}

export interface ValidationWarning {
  message: string;
  suggestion?: string;
}

export interface RequiredFileInfo {
  path: string;
  description: string;
  exists: boolean;
  readable: boolean;
  size?: number;
  lastModified?: Date;
}

export interface MemoryUsageStats {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface PlatformInfo {
  platform: NodeJS.Platform;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  nodeVersion: string;
  setupInstructions: string[];
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

// Error code classification system for robust error handling
// Based on requirements REQ-CLI-003.1, REQ-CLI-003.2, REQ-CLI-003.4
export enum CLIErrorCode {
  // Generic errors (1-9)
  GENERIC_ERROR = 1,
  INVALID_ARGUMENTS = 2,
  FILE_NOT_FOUND = 3,
  PERMISSION_DENIED = 4,
  
  // WebAssembly errors (10-19)
  WASM_MODULE_NOT_FOUND = 10,
  WASM_LOAD_FAILED = 11,
  WASM_INVALID_MODULE = 12,
  WASM_RUNTIME_ERROR = 13,
  WASM_MEMORY_ERROR = 14,
  
  // Database errors (20-29)
  DB_INIT_FAILED = 20,
  DB_CONNECTION_FAILED = 21,
  DB_CORRUPT = 22,
  DB_VERSION_MISMATCH = 23,
  DB_FILE_MISSING = 24,
  
  // Input validation errors (30-39)
  INVALID_STATION_NAME = 30,
  INVALID_LINE_NAME = 31,
  INVALID_ROUTE_FORMAT = 32,
  EMPTY_PARAMETER = 33,
  PARAMETER_COUNT_MISMATCH = 34,
  
  // System errors (40-49)
  NODE_VERSION_ERROR = 40,
  ENVIRONMENT_ERROR = 41,
  JAVASCRIPT_EXCEPTION = 42,
  UNHANDLED_REJECTION = 43,
  SYSTEM_RESOURCE_ERROR = 44,
  CONFIGURATION_ERROR = 45,
  
  // Test execution errors (50-59)
  TEST_SUITE_FAILED = 50,
  TEST_CASE_FAILED = 51,
  TEST_DATA_INVALID = 52,
  TEST_ASSERTION_ERROR = 53,
  
  // Route calculation errors (60-69)
  ROUTE_CALC_FAILED = 60,
  ROUTE_NOT_FOUND = 61,
  FARE_CALC_ERROR = 62,
  INVALID_ROUTE_DATA = 63
}

// Japanese error messages for specific error scenarios
export const ErrorMessages: Partial<Record<CLIErrorCode, {
  ja: string;
  en: string;
  suggestions: string[];
}>> = {
  // WebAssembly Module Loading (REQ-CLI-003.1)
  [CLIErrorCode.WASM_MODULE_NOT_FOUND]: {
    ja: 'WebAssemblyモジュールが見つかりません',
    en: 'WebAssembly module not found',
    suggestions: [
      'npm run build を実行してWebAssemblyモジュールをビルドしてください',
      'dist/farert.js と dist/farert.wasm ファイルが存在することを確認してください',
      'ファイルの権限を確認してください: chmod 644 dist/farert.*'
    ]
  },
  
  [CLIErrorCode.WASM_LOAD_FAILED]: {
    ja: 'WebAssemblyモジュールの読み込みに失敗しました',
    en: 'Failed to load WebAssembly module',
    suggestions: [
      'make clean && make all && npm run build を実行してください',
      'Node.js バージョンが14.0.0以上であることを確認してください',
      'Emscripten SDKが正しくインストールされていることを確認してください'
    ]
  },
  
  [CLIErrorCode.WASM_INVALID_MODULE]: {
    ja: 'WebAssemblyモジュールが無効です',
    en: 'Invalid WebAssembly module',
    suggestions: [
      'WebAssemblyファイルが破損している可能性があります',
      'make clean && make all を実行して再ビルドしてください',
      'dist/farert.wasm のファイルサイズを確認してください'
    ]
  },
  
  // Database Initialization (REQ-CLI-003.2)
  [CLIErrorCode.DB_INIT_FAILED]: {
    ja: 'データベース初期化に失敗しました',
    en: 'Database initialization failed',
    suggestions: [
      'data/jrdbnewest.db ファイルが存在することを確認してください',
      'データベースファイルの権限を確認してください: chmod 644 data/jrdbnewest.db',
      'データベースファイルの整合性を確認してください: file data/jrdbnewest.db'
    ]
  },
  
  [CLIErrorCode.DB_CONNECTION_FAILED]: {
    ja: 'データベース接続に失敗しました',
    en: 'Database connection failed',
    suggestions: [
      'SQLiteデータベースファイルが破損していないか確認してください',
      'メモリ不足が発生していないか確認してください',
      'WebAssemblyモジュールが正しくロードされているか確認してください'
    ]
  },
  
  [CLIErrorCode.DB_FILE_MISSING]: {
    ja: 'データベースファイルが見つかりません',
    en: 'Database file not found',
    suggestions: [
      'data/jrdbnewest.db ファイルをプロジェクトルートに配置してください',
      'データベースファイルのダウンロードが完了しているか確認してください',
      'ファイルパスが正しいことを確認してください'
    ]
  },
  
  // JavaScript Exceptions (REQ-CLI-003.4)
  [CLIErrorCode.JAVASCRIPT_EXCEPTION]: {
    ja: 'JavaScriptエラーが発生しました',
    en: 'JavaScript exception occurred',
    suggestions: [
      'エラーの詳細とスタックトレースを確認してください',
      '入力パラメータが正しい形式であることを確認してください',
      'メモリ不足が発生していないか確認してください'
    ]
  },
  
  [CLIErrorCode.UNHANDLED_REJECTION]: {
    ja: '未処理のPromiseエラーが発生しました',
    en: 'Unhandled promise rejection occurred',
    suggestions: [
      'エラーの発生箇所を特定してください',
      '非同期処理のエラーハンドリングを確認してください',
      'メモリリークが発生していないか確認してください'
    ]
  },
  
  // Input Validation
  [CLIErrorCode.INVALID_STATION_NAME]: {
    ja: '無効な駅名です',
    en: 'Invalid station name',
    suggestions: [
      '正確な日本語駅名を使用してください（例: 東京、新宿、大阪）',
      'ひらがな、カタカナ、英語表記は使用できません',
      '駅名は漢字で正確に入力してください'
    ]
  },
  
  [CLIErrorCode.INVALID_LINE_NAME]: {
    ja: '無効な路線名です',
    en: 'Invalid line name',
    suggestions: [
      '正式な路線名を使用してください（例: 東海道線、山手線、中央線）',
      '路線名は「〜線」の形式で入力してください',
      'JRや私鉄の正式名称を確認してください'
    ]
  },
  
  [CLIErrorCode.PARAMETER_COUNT_MISMATCH]: {
    ja: 'パラメータ数が正しくありません',
    en: 'Parameter count mismatch',
    suggestions: [
      '-5 コマンド: 正確に5個のパラメータが必要です',
      '直接ルート: 奇数個のパラメータ（3, 5, 7個など）',
      '自動ルート: 偶数個のパラメータ（2, 4, 6個など）'
    ]
  }
};

// Enhanced error classes with specific error codes and Japanese messages
export class CLIError extends Error {
  public readonly code: CLIErrorCode;
  public readonly suggestions: string[];
  public readonly context?: Record<string, any>;

  constructor(
    message: string, 
    code: CLIErrorCode = CLIErrorCode.GENERIC_ERROR, 
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
    this.context = context || {};
    
    // Get suggestions from error code if available
    const errorInfo = ErrorMessages[code];
    this.suggestions = errorInfo?.suggestions || [];
    
    // Enhance stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CLIError);
    }
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(locale: 'ja' | 'en' = 'ja'): string {
    const errorInfo = ErrorMessages[this.code];
    if (errorInfo) {
      return errorInfo[locale];
    }
    return this.message;
  }

  /**
   * Format complete error message with suggestions
   */
  getFormattedMessage(locale: 'ja' | 'en' = 'ja'): string {
    let formatted = `❌ Error (${this.code}): ${this.getLocalizedMessage(locale)}\n`;
    
    if (this.message && this.message !== this.getLocalizedMessage(locale)) {
      formatted += `Details: ${this.message}\n`;
    }
    
    if (this.suggestions.length > 0) {
      formatted += '\n解決方法:\n';
      this.suggestions.forEach((suggestion, index) => {
        formatted += `  ${index + 1}. ${suggestion}\n`;
      });
    }
    
    if (this.context) {
      formatted += '\n追加情報:\n';
      Object.entries(this.context).forEach(([key, value]) => {
        formatted += `  ${key}: ${value}\n`;
      });
    }
    
    return formatted;
  }
}

export class WebAssemblyLoadError extends CLIError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, CLIErrorCode.WASM_LOAD_FAILED, context);
    this.name = 'WebAssemblyLoadError';
  }
}

export class DatabaseError extends CLIError {
  constructor(message: string, sqliteError?: string, context?: Record<string, any>) {
    super(message, CLIErrorCode.DB_INIT_FAILED, {
      ...context,
      sqliteError: sqliteError || 'Unknown SQLite error'
    });
    this.name = 'DatabaseError';
  }
}

export class InputValidationError extends CLIError {
  constructor(
    message: string, 
    invalidValue: string, 
    expectedType: 'station' | 'line' | 'route',
    suggestions: string[] = []
  ) {
    const code = expectedType === 'station' 
      ? CLIErrorCode.INVALID_STATION_NAME
      : expectedType === 'line'
      ? CLIErrorCode.INVALID_LINE_NAME
      : CLIErrorCode.INVALID_ROUTE_FORMAT;
      
    super(message, code, {
      invalidValue,
      expectedType,
      userSuggestions: suggestions
    });
    this.name = 'InputValidationError';
  }
}

export class TestExecutionError extends CLIError {
  constructor(message: string, testName: string, context?: Record<string, any>) {
    super(message, CLIErrorCode.TEST_CASE_FAILED, {
      ...context,
      testName
    });
    this.name = 'TestExecutionError';
  }
}

export class SystemError extends CLIError {
  constructor(message: string, systemError?: Error, context?: Record<string, any>) {
    super(message, CLIErrorCode.JAVASCRIPT_EXCEPTION, {
      ...context,
      originalError: systemError?.message,
      originalStack: systemError?.stack
    });
    this.name = 'SystemError';
  }
}

export class EnvironmentValidationError extends CLIError {
  public readonly validationResult: EnvironmentValidationResult;
  
  constructor(
    message: string,
    validationResult: EnvironmentValidationResult,
    context?: Record<string, any>
  ) {
    super(message, CLIErrorCode.ENVIRONMENT_ERROR, context);
    this.name = 'EnvironmentValidationError';
    this.validationResult = validationResult;
  }
  
  getDetailedReport(): string {
    let report = this.getFormattedMessage();
    
    if (this.validationResult.errors.length > 0) {
      report += '\n❌ Critical Issues:\n';
      this.validationResult.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error.message}\n`;
        if (error.filePath) {
          report += `     File: ${error.filePath}\n`;
        }
        if (error.suggestions.length > 0) {
          report += `     Solutions:\n`;
          error.suggestions.forEach(suggestion => {
            report += `       - ${suggestion}\n`;
          });
        }
      });
    }
    
    if (this.validationResult.warnings.length > 0) {
      report += '\n⚠️  Warnings:\n';
      this.validationResult.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning.message}\n`;
        if (warning.suggestion) {
          report += `     Suggestion: ${warning.suggestion}\n`;
        }
      });
    }
    
    return report;
  }
}

