/**
 * Line-specific TypeScript interfaces for Farert WebAssembly Module
 *
 * Provides comprehensive typing for all line-related operations,
 * company classification, junction analysis, and connectivity mapping.
 */
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
export type LineType = 'conventional' | 'shinkansen' | 'subway' | 'monorail' | 'tram' | 'bus' | 'ferry' | 'private' | 'municipal';
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
export type ElectrificationType = 'ac' | 'dc' | 'dual' | 'diesel' | 'none';
export type LineStatus = 'active' | 'suspended' | 'abandoned' | 'construction' | 'planned';
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
export type CompanyType = 'JR' | 'PRIVATE' | 'MUNICIPAL' | 'THIRD_SECTOR' | 'GOVERNMENT';
export type CompanyRegion = 'hokkaido' | 'tohoku' | 'kanto' | 'chubu' | 'kansai' | 'chugoku' | 'shikoku' | 'kyushu' | 'nationwide';
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
export type PrefectureRegion = 'hokkaido' | 'tohoku' | 'kanto' | 'chubu' | 'kansai' | 'chugoku' | 'shikoku' | 'kyushu';
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
export type JunctionType = 'major' | 'interchange' | 'branch' | 'terminal' | 'cross' | 'merge';
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
export type TransferType = 'same_platform' | 'cross_platform' | 'underground' | 'street_level' | 'escalator' | 'long_walk';
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
export type LineSearchType = 'exact' | 'prefix' | 'contains' | 'fuzzy';
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
export type LineValidationErrorType = 'INVALID_ID' | 'INVALID_NAME' | 'INVALID_COMPANY' | 'INVALID_STATIONS' | 'LINE_NOT_FOUND' | 'INCONSISTENT_DATA';
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
export declare function isLine(obj: any): obj is Line;
export declare function isCompany(obj: any): obj is Company;
export declare function isPrefecture(obj: any): obj is Prefecture;
export declare function isJunctionInfo(obj: any): obj is JunctionInfo;
export declare function isValidLineId(id: number): boolean;
export declare function isValidCompanyId(id: number): boolean;
export declare function isJRCompany(companyId: number): boolean;
export declare function isPrefectureId(id: number): boolean;
export declare function isValidLineName(name: string): boolean;
export declare const LINE_CONSTANTS: {
    readonly MIN_LINE_ID: 1;
    readonly MAX_LINE_ID: 999999;
    readonly JR_COMPANY_ID_THRESHOLD: 65536;
    readonly MIN_PREFECTURE_ID: 65536;
    readonly MAX_LINE_NAME_LENGTH: 50;
    readonly MAX_COMPANY_NAME_LENGTH: 100;
    readonly DEFAULT_MAX_SEARCH_RESULTS: 100;
    readonly MAX_SEARCH_RESULTS: 1000;
    readonly MIN_JUNCTION_LINES: 2;
    readonly MAX_JUNCTION_LINES: 20;
    readonly DEFAULT_TRANSFER_TIME: 5;
    readonly SAME_PLATFORM_TRANSFER_TIME: 2;
    readonly CROSS_PLATFORM_TRANSFER_TIME: 5;
    readonly LONG_WALK_TRANSFER_TIME: 10;
    readonly DEFAULT_SEARCH_TIMEOUT: 3000;
    readonly DEFAULT_LOOKUP_TIMEOUT: 1000;
    readonly DEFAULT_ANALYSIS_TIMEOUT: 5000;
};
export type LineIdArray = number[];
export type CompanyIdArray = number[];
export type PrefectureIdArray = number[];
//# sourceMappingURL=line-types.d.ts.map