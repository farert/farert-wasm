/**
 * Station-specific TypeScript interfaces for Farert WebAssembly Module
 *
 * Provides comprehensive typing for all station-related operations,
 * search functionality, validation, and metadata handling.
 */
import { FarertErrorCode } from './farert';
export interface Station {
    /** Unique station identifier (7-digit number) */
    id: number;
    /** Station name in Japanese */
    name: string;
    /** Extended station name with disambiguating information */
    nameExtended: string;
    /** Station name in hiragana reading */
    kana: string;
    /** Prefecture name where station is located */
    prefecture: string;
    /** Prefecture ID (>= 0x10000) */
    prefectureId: number;
    /** Whether this station is a junction (connects multiple lines) */
    isJunction: boolean;
    /** Array of line IDs serving this station */
    lines: number[];
    /** Optional GPS coordinates */
    coordinates?: StationCoordinates;
    /** Additional station metadata */
    metadata?: StationMetadata;
}
export interface StationCoordinates {
    /** Latitude in decimal degrees */
    latitude: number;
    /** Longitude in decimal degrees */
    longitude: number;
    /** Accuracy of coordinates in meters */
    accuracy?: number;
}
export interface StationMetadata {
    /** Station category (major, local, etc.) */
    category?: StationCategory;
    /** Whether station has express services */
    hasExpress?: boolean;
    /** Whether station has limited express services */
    hasLimitedExpress?: boolean;
    /** Station establishment date */
    establishedDate?: Date;
    /** Whether station is currently active */
    isActive?: boolean;
    /** Alternative names for the station */
    alternativeNames?: string[];
    /** Station facilities */
    facilities?: StationFacility[];
}
export type StationCategory = 'major' | 'junction' | 'local' | 'express' | 'terminal' | 'transfer';
export type StationFacility = 'elevator' | 'escalator' | 'barrier_free' | 'parking' | 'bicycle_parking' | 'shops' | 'restaurants' | 'tourist_info' | 'wifi';
export interface StationSearchQuery {
    /** Search term (station name or reading) */
    query: string;
    /** Search options and filters */
    options?: StationSearchOptions;
}
export interface StationSearchOptions {
    /** Maximum number of results to return */
    maxResults?: number;
    /** Search type preference */
    searchType?: StationSearchType;
    /** Filter by prefecture */
    prefecture?: string;
    /** Filter by company */
    company?: string;
    /** Only return junction stations */
    junctionOnly?: boolean;
    /** Include stations with express services */
    hasExpress?: boolean;
    /** Include inactive stations */
    includeInactive?: boolean;
    /** Fuzzy matching tolerance (0.0 to 1.0) */
    fuzzyTolerance?: number;
}
export type StationSearchType = 'exact' | 'prefix' | 'contains' | 'fuzzy' | 'kana' | 'mixed';
export interface StationSearchResult {
    /** Array of matching stations */
    stations: Station[];
    /** Original search query */
    query: string;
    /** Total number of matches found */
    total: number;
    /** Whether more results are available */
    hasMore: boolean;
    /** Search execution time in milliseconds */
    executionTime: number;
    /** Suggested alternative queries if no results */
    suggestions: string[];
    /** Search metadata */
    metadata: StationSearchMetadata;
}
export interface StationSearchMetadata {
    /** Search type that was used */
    searchType: StationSearchType;
    /** Whether fuzzy matching was applied */
    fuzzyMatchingUsed: boolean;
    /** Number of stations considered */
    stationsConsidered: number;
    /** Filters that were applied */
    filtersApplied: string[];
}
export interface StationValidationOptions {
    /** Validate station name format */
    validateName?: boolean;
    /** Validate hiragana reading */
    validateKana?: boolean;
    /** Check if station exists in database */
    checkExists?: boolean;
    /** Validate station ID format */
    validateId?: boolean;
    /** Check prefecture consistency */
    validatePrefecture?: boolean;
}
export interface StationValidationResult {
    /** Whether station data is valid */
    isValid: boolean;
    /** Validation errors found */
    errors: StationValidationError[];
    /** Non-critical warnings */
    warnings: StationValidationWarning[];
    /** Suggestions for fixing issues */
    suggestions: string[];
    /** Validation execution time */
    executionTime: number;
}
export interface StationValidationError {
    /** Error type code */
    type: StationValidationErrorType;
    /** Human-readable error message */
    message: string;
    /** Field that caused the error */
    field: keyof Station;
    /** Current invalid value */
    value: any;
    /** Expected value format or range */
    expected?: string;
    /** Suggestions for fixing */
    suggestions?: string[];
}
export interface StationValidationWarning {
    /** Warning message */
    message: string;
    /** Field related to warning */
    field?: keyof Station;
    /** Suggestion for improvement */
    suggestion?: string;
}
export type StationValidationErrorType = 'INVALID_ID' | 'INVALID_NAME' | 'INVALID_KANA' | 'INVALID_PREFECTURE' | 'STATION_NOT_FOUND' | 'INCONSISTENT_DATA' | 'MISSING_REQUIRED_FIELD';
export interface StationLookupOptions {
    /** Include extended station information */
    includeExtended?: boolean;
    /** Include station metadata */
    includeMetadata?: boolean;
    /** Include line information */
    includeLines?: boolean;
    /** Include prefecture details */
    includePrefecture?: boolean;
    /** Cache lookup results */
    useCache?: boolean;
}
export interface StationLookupResult {
    /** Found station or null if not found */
    station: Station | null;
    /** Whether station was found */
    found: boolean;
    /** Lookup execution time */
    executionTime: number;
    /** Whether result came from cache */
    fromCache?: boolean;
    /** Error if lookup failed */
    error?: StationLookupError;
}
export interface StationLookupError {
    /** Error code from C++ layer */
    code: FarertErrorCode;
    /** Human-readable error message */
    message: string;
    /** Station ID or name that caused error */
    input: string | number;
    /** Suggested alternatives */
    suggestions?: string[];
}
export interface StationComparison {
    /** First station in comparison */
    station1: Station;
    /** Second station in comparison */
    station2: Station;
    /** Distance between stations (if available) */
    distance?: number;
    /** Travel time between stations (if available) */
    travelTime?: number;
    /** Common lines serving both stations */
    commonLines: number[];
    /** Whether stations are directly connected */
    directlyConnected: boolean;
    /** Shortest path between stations */
    shortestPath?: StationPath;
}
export interface StationPath {
    /** Stations in the path */
    stations: number[];
    /** Lines used in the path */
    lines: number[];
    /** Total distance */
    totalDistance: number;
    /** Total travel time */
    totalTime: number;
    /** Number of transfers required */
    transfers: number;
}
export interface StationGroup {
    /** Group identifier */
    id: string;
    /** Group name */
    name: string;
    /** Grouping criteria */
    criteria: StationGroupingCriteria;
    /** Stations in this group */
    stations: number[];
    /** Group statistics */
    statistics: StationGroupStatistics;
}
export interface StationGroupingCriteria {
    /** Group by prefecture */
    byPrefecture?: boolean;
    /** Group by company */
    byCompany?: boolean;
    /** Group by line */
    byLine?: boolean;
    /** Group by station category */
    byCategory?: boolean;
    /** Custom grouping function */
    customGrouping?: (station: Station) => string;
}
export interface StationGroupStatistics {
    /** Number of stations in group */
    stationCount: number;
    /** Number of lines serving group */
    lineCount: number;
    /** Average stations per line */
    averageStationsPerLine: number;
    /** Number of junction stations */
    junctionCount: number;
    /** Most common prefecture in group */
    dominantPrefecture?: string;
}
export type StationIdArray = number[];
export type StationNameArray = string[];
export declare function isStation(obj: any): obj is Station;
export declare function isStationSearchResult(obj: any): obj is StationSearchResult;
export declare function isStationValidationResult(obj: any): obj is StationValidationResult;
export declare function isValidStationId(id: number): boolean;
export declare function isValidStationName(name: string): boolean;
export declare function isValidStationKana(kana: string): boolean;
export interface StationTypeCollection {
    Station: Station;
    StationSearchQuery: StationSearchQuery;
    StationSearchResult: StationSearchResult;
    StationValidationResult: StationValidationResult;
    StationLookupResult: StationLookupResult;
    StationComparison: StationComparison;
    StationGroup: StationGroup;
}
export type StationTypes = keyof StationTypeCollection;
export declare const STATION_CONSTANTS: {
    readonly MIN_STATION_ID: 1000000;
    readonly MAX_STATION_ID: 9999999;
    readonly MAX_STATION_NAME_LENGTH: 50;
    readonly MAX_KANA_LENGTH: 50;
    readonly DEFAULT_MAX_SEARCH_RESULTS: 100;
    readonly MAX_SEARCH_RESULTS: 1000;
    readonly DEFAULT_FUZZY_TOLERANCE: 0.7;
    readonly MIN_FUZZY_TOLERANCE: 0;
    readonly MAX_FUZZY_TOLERANCE: 1;
    readonly DEFAULT_SEARCH_TIMEOUT: 3000;
    readonly DEFAULT_LOOKUP_TIMEOUT: 1000;
    readonly DEFAULT_VALIDATION_TIMEOUT: 2000;
};
//# sourceMappingURL=station-types.d.ts.map