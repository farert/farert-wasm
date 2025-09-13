/**
 * Line-specific TypeScript interfaces for Farert WebAssembly Module
 *
 * Provides comprehensive typing for all line-related operations,
 * company classification, junction analysis, and connectivity mapping.
 */

import { FarertErrorCode } from './farert';
import { Station } from './station-types';

// === Core Line Interfaces ===

export interface Line {
  /** Unique line identifier */
  id: number;

  /** Line name in Japanese */
  name: string;

  /** Company or organization operating this line */
  companyId: number;

  /** Company name */
  companyName: string;

  /** Line type classification */
  type: LineType;

  /** Whether this is a JR line (companyId < 0x10000) */
  isJR: boolean;

  /** Whether this is a private railway line */
  isPrivate: boolean;

  /** Whether this is a municipal/subway line */
  isMunicipal: boolean;

  /** Array of station IDs served by this line */
  stations: number[];

  /** Primary prefecture this line operates in */
  prefecture?: string;

  /** Line color for display (hex code) */
  color?: string;

  /** Line metadata */
  metadata?: LineMetadata;
}

export type LineType =
  | 'conventional'    // Conventional railway
  | 'shinkansen'     // High-speed rail
  | 'subway'         // Subway/metro
  | 'monorail'       // Monorail system
  | 'tram'           // Tram/streetcar
  | 'bus'            // Bus rapid transit
  | 'ferry'          // Ferry service
  | 'private'        // Private railway
  | 'municipal';     // Municipal transportation

export interface LineMetadata {
  /** Line length in kilometers */
  length?: number;

  /** Number of stations */
  stationCount?: number;

  /** Electrification type */
  electrification?: ElectrificationType;

  /** Track gauge in millimeters */
  gauge?: number;

  /** Maximum operating speed */
  maxSpeed?: number;

  /** Line opening date */
  openingDate?: Date;

  /** Alternative names for the line */
  alternativeNames?: string[];

  /** Line status */
  status?: LineStatus;
}

export type ElectrificationType =
  | 'ac'           // AC electrification
  | 'dc'           // DC electrification
  | 'dual'         // Dual voltage
  | 'diesel'       // Diesel operation
  | 'none';        // Non-electrified

export type LineStatus =
  | 'active'       // Currently operational
  | 'suspended'    // Temporarily suspended
  | 'abandoned'    // Permanently closed
  | 'construction' // Under construction
  | 'planned';     // Planned for construction

// === Company and Organization Interfaces ===

export interface Company {
  /** Company identifier */
  id: number;

  /** Company name in Japanese */
  name: string;

  /** Company type classification */
  type: CompanyType;

  /** Operating region */
  region?: CompanyRegion;

  /** Lines operated by this company */
  lines: number[];

  /** Company color theme */
  color?: string;

  /** Company metadata */
  metadata?: CompanyMetadata;
}

export type CompanyType =
  | 'JR'           // Japan Railways Group
  | 'PRIVATE'      // Private railway company
  | 'MUNICIPAL'    // Municipal transportation
  | 'THIRD_SECTOR' // Third-sector railway
  | 'GOVERNMENT';  // Government-operated

export type CompanyRegion =
  | 'hokkaido'
  | 'tohoku'
  | 'kanto'
  | 'chubu'
  | 'kansai'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu'
  | 'nationwide';

export interface CompanyMetadata {
  /** Company establishment date */
  establishedDate?: Date;

  /** Parent company */
  parentCompany?: string;

  /** Total route length */
  totalLength?: number;

  /** Total number of stations */
  totalStations?: number;

  /** Annual ridership */
  annualRidership?: number;
}

// === Prefecture Information ===

export interface Prefecture {
  /** Prefecture identifier (>= 0x10000) */
  id: number;

  /** Prefecture name in Japanese */
  name: string;

  /** Geographic region */
  region: PrefectureRegion;

  /** Companies operating in this prefecture */
  companies: number[];

  /** Lines operating in this prefecture */
  lines: number[];

  /** Number of railway stations */
  stationCount: number;

  /** Prefecture metadata */
  metadata?: PrefectureMetadata;
}

export type PrefectureRegion =
  | 'hokkaido'
  | 'tohoku'
  | 'kanto'
  | 'chubu'
  | 'kansai'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu';

export interface PrefectureMetadata {
  /** Prefecture area in square kilometers */
  area?: number;

  /** Prefecture population */
  population?: number;

  /** Capital city */
  capital?: string;

  /** Major railway hubs */
  majorHubs?: string[];
}

// === Junction Analysis Interfaces ===

export interface JunctionInfo {
  /** Station ID of the junction */
  stationId: number;

  /** Station name */
  stationName: string;

  /** Lines that meet at this junction */
  lines: number[];

  /** Junction type classification */
  type: JunctionType;

  /** Whether this junction allows transfers */
  allowsTransfer: boolean;

  /** Transfer capabilities between lines */
  transfers: JunctionTransfer[];

  /** Junction importance score */
  importance: number;
}

export type JunctionType =
  | 'major'        // Major hub with multiple operators
  | 'interchange'  // Interchange between different services
  | 'branch'       // Branch point on single line
  | 'terminal'     // Terminal station with multiple lines
  | 'cross'        // Lines crossing at same station
  | 'merge';       // Lines merging/splitting

export interface JunctionTransfer {
  /** Source line ID */
  fromLine: number;

  /** Destination line ID */
  toLine: number;

  /** Transfer type */
  type: TransferType;

  /** Transfer time in minutes */
  transferTime?: number;

  /** Whether transfer requires ticket change */
  requiresReTicketing: boolean;
}

export type TransferType =
  | 'same_platform'   // Same platform transfer
  | 'cross_platform'  // Across platform transfer
  | 'underground'     // Underground passage
  | 'street_level'    // Street level transfer
  | 'escalator'       // Escalator connection
  | 'long_walk';      // Long walking distance

// === Line Connectivity Analysis ===

export interface LineConnectivity {
  /** Line being analyzed */
  lineId: number;

  /** Stations on this line */
  stations: number[];

  /** Connected lines at each station */
  connections: LineConnection[];

  /** Junction points */
  junctions: number[];

  /** Connectivity metrics */
  metrics: ConnectivityMetrics;
}

export interface LineConnection {
  /** Station where connection occurs */
  stationId: number;

  /** Lines available at this station */
  availableLines: number[];

  /** Connection quality score */
  quality: number;

  /** Transfer information */
  transfers: JunctionTransfer[];
}

export interface ConnectivityMetrics {
  /** Total number of connections */
  totalConnections: number;

  /** Number of unique connected lines */
  uniqueConnections: number;

  /** Average connections per station */
  averageConnectionsPerStation: number;

  /** Connectivity density (0.0 to 1.0) */
  density: number;

  /** Network centrality score */
  centralityScore: number;
}

// === Line Search and Lookup Interfaces ===

export interface LineSearchQuery {
  /** Search term (line name or partial name) */
  query: string;

  /** Search options */
  options?: LineSearchOptions;
}

export interface LineSearchOptions {
  /** Maximum number of results */
  maxResults?: number;

  /** Search type */
  searchType?: LineSearchType;

  /** Filter by company type */
  companyType?: CompanyType;

  /** Filter by prefecture */
  prefecture?: string;

  /** Filter by line type */
  lineType?: LineType;

  /** Only return lines serving specific station */
  servingStation?: number;

  /** Include inactive lines */
  includeInactive?: boolean;
}

export type LineSearchType =
  | 'exact'        // Exact name match
  | 'prefix'       // Name starts with query
  | 'contains'     // Name contains query
  | 'fuzzy';       // Fuzzy matching

export interface LineSearchResult {
  /** Found lines */
  lines: Line[];

  /** Original search query */
  query: string;

  /** Total matches found */
  total: number;

  /** Whether more results available */
  hasMore: boolean;

  /** Search execution time */
  executionTime: number;

  /** Alternative suggestions */
  suggestions: string[];
}

// === Line Validation ===

export interface LineValidationOptions {
  /** Validate line name format */
  validateName?: boolean;

  /** Check if line exists in database */
  checkExists?: boolean;

  /** Validate company association */
  validateCompany?: boolean;

  /** Validate station list */
  validateStations?: boolean;
}

export interface LineValidationResult {
  /** Whether line data is valid */
  isValid: boolean;

  /** Validation errors */
  errors: LineValidationError[];

  /** Non-critical warnings */
  warnings: LineValidationWarning[];

  /** Improvement suggestions */
  suggestions: string[];

  /** Validation execution time */
  executionTime: number;
}

export interface LineValidationError {
  /** Error type */
  type: LineValidationErrorType;

  /** Error message */
  message: string;

  /** Field that caused error */
  field: keyof Line;

  /** Invalid value */
  value: any;

  /** Expected format */
  expected?: string;
}

export interface LineValidationWarning {
  /** Warning message */
  message: string;

  /** Related field */
  field?: keyof Line;

  /** Improvement suggestion */
  suggestion?: string;
}

export type LineValidationErrorType =
  | 'INVALID_ID'
  | 'INVALID_NAME'
  | 'INVALID_COMPANY'
  | 'INVALID_STATIONS'
  | 'LINE_NOT_FOUND'
  | 'INCONSISTENT_DATA';

// === Utility Interfaces ===

export interface LineStatistics {
  /** Total number of lines */
  totalLines: number;

  /** Lines by type */
  linesByType: Record<LineType, number>;

  /** Lines by company type */
  linesByCompanyType: Record<CompanyType, number>;

  /** Average stations per line */
  averageStationsPerLine: number;

  /** Most connected line */
  mostConnectedLine: Line;

  /** Line with most stations */
  longestLine: Line;
}

export interface LineNetwork {
  /** All lines in network */
  lines: Line[];

  /** All companies */
  companies: Company[];

  /** All prefectures */
  prefectures: Prefecture[];

  /** Network connectivity matrix */
  connectivityMatrix: number[][];

  /** Network statistics */
  statistics: LineStatistics;
}

// === Type Guards ===

export function isLine(obj: any): obj is Line {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.companyId === 'number' &&
    obj.id > 0;
}

export function isCompany(obj: any): obj is Company {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.lines);
}

export function isPrefecture(obj: any): obj is Prefecture {
  return obj &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    obj.id >= 0x10000;
}

export function isJunctionInfo(obj: any): obj is JunctionInfo {
  return obj &&
    typeof obj.stationId === 'number' &&
    Array.isArray(obj.lines) &&
    typeof obj.allowsTransfer === 'boolean';
}

// === Validation Functions ===

export function isValidLineId(id: number): boolean {
  return Number.isInteger(id) && id > 0 && id < 1000000;
}

export function isValidCompanyId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}

export function isJRCompany(companyId: number): boolean {
  return companyId < 0x10000;
}

export function isPrefectureId(id: number): boolean {
  return id >= 0x10000;
}

export function isValidLineName(name: string): boolean {
  return typeof name === 'string' &&
         name.length > 0 &&
         name.length <= 50;
}

// === Constants ===

export const LINE_CONSTANTS = {
  // ID validation ranges
  MIN_LINE_ID: 1,
  MAX_LINE_ID: 999999,
  JR_COMPANY_ID_THRESHOLD: 0x10000,
  MIN_PREFECTURE_ID: 0x10000,

  // Name length limits
  MAX_LINE_NAME_LENGTH: 50,
  MAX_COMPANY_NAME_LENGTH: 100,

  // Search limits
  DEFAULT_MAX_SEARCH_RESULTS: 100,
  MAX_SEARCH_RESULTS: 1000,

  // Junction analysis
  MIN_JUNCTION_LINES: 2,
  MAX_JUNCTION_LINES: 20,

  // Transfer times (minutes)
  DEFAULT_TRANSFER_TIME: 5,
  SAME_PLATFORM_TRANSFER_TIME: 2,
  CROSS_PLATFORM_TRANSFER_TIME: 5,
  LONG_WALK_TRANSFER_TIME: 10,

  // Timeouts
  DEFAULT_SEARCH_TIMEOUT: 3000,
  DEFAULT_LOOKUP_TIMEOUT: 1000,
  DEFAULT_ANALYSIS_TIMEOUT: 5000
} as const;

// === Export Collections ===

export type LineIdArray = number[];
export type CompanyIdArray = number[];
export type PrefectureIdArray = number[];