/**
 * Route-building TypeScript interfaces for Farert WebAssembly Module
 *
 * Provides comprehensive typing for route construction, validation,
 * optimization, and performance monitoring functionality.
 */

import { FarertErrorCode } from './farert';
import { Station } from './station-types';
import { Line } from './line-types';

// === Core Route Building Interfaces ===

export interface RouteSegment {
  /** Station ID at this point in the route */
  stationId: number;

  /** Station name for display */
  stationName: string;

  /** Hiragana reading of station name */
  stationKana?: string;

  /** Line ID used to reach this station (undefined for starting station) */
  lineId?: number;

  /** Line name used to reach this station */
  lineName?: string;

  /** Whether this is a transfer point */
  isTransfer: boolean;

  /** Lines available for transfer at this station */
  transferLines?: number[];

  /** Segment-specific flags and metadata */
  flags?: RouteSegmentFlags;

  /** Performance metrics for this segment */
  metrics?: RouteSegmentMetrics;
}

export interface RouteSegmentFlags {
  /** This segment uses express service */
  isExpress?: boolean;

  /** This segment uses limited express */
  isLimitedExpress?: boolean;

  /** This segment requires reserved seating */
  requiresReservation?: boolean;

  /** This segment has special fare rules */
  hasSpecialFare?: boolean;

  /** This is the starting segment */
  isStart?: boolean;

  /** This is the ending segment */
  isEnd?: boolean;
}

export interface RouteSegmentMetrics {
  /** Distance of this segment in kilometers */
  distance?: number;

  /** Travel time for this segment in minutes */
  travelTime?: number;

  /** Base fare for this segment */
  segmentFare?: number;

  /** Express fare for this segment */
  expressFare?: number;
}

// === Route Construction Interfaces ===

export interface RouteBuilder {
  /** Current route segments */
  segments: RouteSegment[];

  /** Route building options */
  options: RouteBuildingOptions;

  /** Current route validation status */
  validation: RouteValidationResult;

  /** Whether the route is complete and valid */
  isComplete: boolean;

  /** Whether the route has been modified */
  isDirty: boolean;

  /** Build performance metrics */
  performance: RouteBuildingMetrics;
}

export interface RouteBuildingOptions {
  /** Prefer express services when available */
  preferExpress?: boolean;

  /** Avoid transfers when possible */
  avoidTransfers?: boolean;

  /** Maximum number of transfers allowed */
  maxTransfers?: number;

  /** Maximum number of stations in route */
  maxStations?: number;

  /** Optimization strategy */
  optimizeFor?: RouteOptimizationTarget;

  /** Enable long-distance routing */
  enableLongRoute?: boolean;

  /** Set departure station as city representative */
  startAsCity?: boolean;

  /** Set arrival station as city representative */
  arriveAsCity?: boolean;

  /** Time constraints */
  timeConstraints?: RouteTimeConstraints;
}

export type RouteOptimizationTarget =
  | 'time'        // Minimize travel time
  | 'cost'        // Minimize fare cost
  | 'comfort'     // Minimize transfers and walking
  | 'distance'    // Minimize travel distance
  | 'balanced';   // Balance all factors

export interface RouteTimeConstraints {
  /** Desired departure time */
  departureTime?: Date;

  /** Latest acceptable arrival time */
  latestArrival?: Date;

  /** Preferred travel duration */
  maxTravelTime?: number; // minutes
}

export interface RouteBuildingMetrics {
  /** Route construction time */
  buildTime: number;

  /** Validation execution time */
  validationTime: number;

  /** Memory usage during building */
  memoryUsage: number;

  /** Number of build iterations */
  iterations: number;

  /** Optimization attempts */
  optimizationAttempts: number;
}

// === Route Validation Interfaces ===

export interface RouteValidationOptions {
  /** Check station connectivity */
  validateConnections?: boolean;

  /** Verify all stations exist */
  validateStations?: boolean;

  /** Verify all lines exist */
  validateLines?: boolean;

  /** Check transfer feasibility */
  validateTransfers?: boolean;

  /** Validate route length limits */
  validateLength?: boolean;

  /** Deep validation with database checks */
  deepValidation?: boolean;
}

export interface RouteValidationResult {
  /** Whether route is valid */
  isValid: boolean;

  /** Critical errors that prevent route use */
  errors: RouteValidationError[];

  /** Non-critical warnings */
  warnings: RouteValidationWarning[];

  /** Suggestions for improvement */
  suggestions: string[];

  /** Validation execution time */
  executionTime: number;

  /** Detailed validation report */
  report: RouteValidationReport;
}

export interface RouteValidationError {
  /** Error type code */
  type: RouteValidationErrorType;

  /** Human-readable error message */
  message: string;

  /** Segment position where error occurred */
  segmentIndex?: number;

  /** Station ID related to error */
  stationId?: number;

  /** Line ID related to error */
  lineId?: number;

  /** Current invalid value */
  value?: any;

  /** Suggestions for fixing the error */
  suggestions?: string[];

  /** Error severity level */
  severity: RouteErrorSeverity;
}

export interface RouteValidationWarning {
  /** Warning message */
  message: string;

  /** Related segment */
  segmentIndex?: number;

  /** Suggested improvement */
  suggestion?: string;

  /** Warning category */
  category: RouteWarningCategory;
}

export type RouteValidationErrorType =
  | 'STATION_NOT_FOUND'
  | 'LINE_NOT_FOUND'
  | 'CONNECTION_INVALID'
  | 'TRANSFER_IMPOSSIBLE'
  | 'ROUTE_TOO_LONG'
  | 'ROUTE_TOO_COMPLEX'
  | 'CIRCULAR_ROUTE'
  | 'MISSING_REQUIRED_SEGMENT'
  | 'INCONSISTENT_DATA';

export type RouteErrorSeverity =
  | 'critical'    // Route cannot be used
  | 'major'       // Route may fail or produce incorrect results
  | 'minor'       // Route will work but may be suboptimal
  | 'info';       // Informational only

export type RouteWarningCategory =
  | 'performance' // Performance-related warnings
  | 'usability'   // User experience warnings
  | 'cost'        // Cost-related warnings
  | 'time'        // Time-related warnings
  | 'comfort';    // Comfort-related warnings

export interface RouteValidationReport {
  /** Summary statistics */
  summary: RouteValidationSummary;

  /** Detailed segment analysis */
  segmentAnalysis: RouteSegmentAnalysis[];

  /** Connection analysis */
  connectionAnalysis: RouteConnectionAnalysis;

  /** Performance analysis */
  performanceAnalysis: RoutePerformanceAnalysis;
}

export interface RouteValidationSummary {
  /** Total segments validated */
  totalSegments: number;

  /** Valid segments */
  validSegments: number;

  /** Segments with errors */
  errorSegments: number;

  /** Segments with warnings */
  warningSegments: number;

  /** Overall route score (0-100) */
  overallScore: number;
}

export interface RouteSegmentAnalysis {
  /** Segment index */
  index: number;

  /** Segment validation status */
  isValid: boolean;

  /** Station existence check */
  stationExists: boolean;

  /** Line existence check */
  lineExists: boolean;

  /** Connection validity */
  connectionValid: boolean;

  /** Transfer feasibility */
  transferFeasible: boolean;

  /** Performance score for this segment */
  performanceScore: number;
}

export interface RouteConnectionAnalysis {
  /** All connections are valid */
  allConnectionsValid: boolean;

  /** Number of valid connections */
  validConnections: number;

  /** Number of invalid connections */
  invalidConnections: number;

  /** Connection details */
  connections: RouteConnectionDetail[];
}

export interface RouteConnectionDetail {
  /** Source station ID */
  fromStation: number;

  /** Destination station ID */
  toStation: number;

  /** Line used for connection */
  lineId: number;

  /** Whether connection is valid */
  isValid: boolean;

  /** Connection type */
  connectionType: RouteConnectionType;

  /** Connection quality score */
  qualityScore: number;
}

export type RouteConnectionType =
  | 'direct'      // Direct connection on same line
  | 'transfer'    // Transfer between different lines
  | 'walk'        // Walking connection
  | 'impossible'; // No valid connection

export interface RoutePerformanceAnalysis {
  /** Estimated total travel time */
  estimatedTravelTime: number;

  /** Estimated total distance */
  estimatedDistance: number;

  /** Number of transfers required */
  transferCount: number;

  /** Route complexity score */
  complexityScore: number;

  /** Performance optimization suggestions */
  optimizationSuggestions: string[];
}

// === Route Optimization Interfaces ===

export interface RouteOptimizationOptions {
  /** Optimization target */
  target: RouteOptimizationTarget;

  /** Maximum optimization iterations */
  maxIterations?: number;

  /** Optimization timeout in milliseconds */
  timeout?: number;

  /** Whether to consider alternative routes */
  considerAlternatives?: boolean;

  /** Optimization constraints */
  constraints?: RouteOptimizationConstraints;
}

export interface RouteOptimizationConstraints {
  /** Must use specific stations */
  requiredStations?: number[];

  /** Must avoid specific stations */
  avoidStations?: number[];

  /** Must use specific lines */
  requiredLines?: number[];

  /** Must avoid specific lines */
  avoidLines?: number[];

  /** Maximum acceptable fare */
  maxFare?: number;

  /** Maximum acceptable time */
  maxTime?: number;
}

export interface RouteOptimizationResult {
  /** Original route before optimization */
  originalRoute: RouteSegment[];

  /** Optimized route */
  optimizedRoute: RouteSegment[];

  /** Optimization performance metrics */
  metrics: RouteOptimizationMetrics;

  /** Whether optimization improved the route */
  improved: boolean;

  /** Improvement details */
  improvements: RouteImprovement[];

  /** Alternative routes considered */
  alternatives: RouteAlternative[];
}

export interface RouteOptimizationMetrics {
  /** Optimization execution time */
  executionTime: number;

  /** Number of iterations performed */
  iterations: number;

  /** Number of alternatives considered */
  alternativesConsidered: number;

  /** Memory usage during optimization */
  memoryUsage: number;

  /** Optimization success rate */
  successRate: number;
}

export interface RouteImprovement {
  /** Type of improvement made */
  type: RouteImprovementType;

  /** Description of improvement */
  description: string;

  /** Quantified benefit */
  benefit: RouteImprovementBenefit;

  /** Segments affected by improvement */
  affectedSegments: number[];
}

export type RouteImprovementType =
  | 'time_reduction'
  | 'cost_reduction'
  | 'transfer_elimination'
  | 'distance_reduction'
  | 'express_upgrade'
  | 'connection_improvement';

export interface RouteImprovementBenefit {
  /** Time savings in minutes */
  timeSavings?: number;

  /** Cost savings in yen */
  costSavings?: number;

  /** Distance savings in kilometers */
  distanceSavings?: number;

  /** Transfers eliminated */
  transfersEliminated?: number;

  /** Comfort improvement score */
  comfortImprovement?: number;
}

export interface RouteAlternative {
  /** Alternative route segments */
  route: RouteSegment[];

  /** Comparison metrics with original */
  comparison: RouteComparison;

  /** Why this alternative was not chosen */
  rejectionReason?: string;

  /** Alternative feasibility score */
  feasibilityScore: number;
}

export interface RouteComparison {
  /** Time difference (positive = faster) */
  timeDifference: number;

  /** Cost difference (positive = cheaper) */
  costDifference: number;

  /** Distance difference (positive = shorter) */
  distanceDifference: number;

  /** Transfer difference (positive = fewer transfers) */
  transferDifference: number;

  /** Overall preference score */
  preferenceScore: number;
}

// === Route Export/Import Interfaces ===

export interface RouteExportOptions {
  /** Export format */
  format: RouteExportFormat;

  /** Include metadata */
  includeMetadata?: boolean;

  /** Include validation results */
  includeValidation?: boolean;

  /** Include performance metrics */
  includeMetrics?: boolean;

  /** Compression level */
  compressionLevel?: number;
}

export type RouteExportFormat =
  | 'json'        // JSON format
  | 'xml'         // XML format
  | 'csv'         // CSV format
  | 'text'        // Human-readable text
  | 'binary';     // Binary format

export interface RouteExportResult {
  /** Exported data */
  data: string | ArrayBuffer;

  /** Export format used */
  format: RouteExportFormat;

  /** Export size in bytes */
  size: number;

  /** Export execution time */
  executionTime: number;

  /** Export metadata */
  metadata: RouteExportMetadata;
}

export interface RouteExportMetadata {
  /** Export timestamp */
  timestamp: Date;

  /** Route version */
  version: string;

  /** Number of segments exported */
  segmentCount: number;

  /** Validation status at export */
  validationStatus: boolean;
}

// === Utility Types and Functions ===

export type RouteSegmentArray = RouteSegment[];
export type RouteString = string;

// Type guards
export function isRouteSegment(obj: any): obj is RouteSegment {
  return obj &&
    typeof obj.stationId === 'number' &&
    typeof obj.stationName === 'string' &&
    typeof obj.isTransfer === 'boolean';
}

export function isRouteValidationResult(obj: any): obj is RouteValidationResult {
  return obj &&
    typeof obj.isValid === 'boolean' &&
    Array.isArray(obj.errors) &&
    Array.isArray(obj.warnings);
}

export function isRouteBuilder(obj: any): obj is RouteBuilder {
  return obj &&
    Array.isArray(obj.segments) &&
    obj.options &&
    obj.validation &&
    typeof obj.isComplete === 'boolean';
}

// Validation functions
export function isValidRouteLength(segments: RouteSegment[]): boolean {
  return segments.length >= 2 && segments.length <= 50;
}

export function hasValidConnections(segments: RouteSegment[]): boolean {
  for (let i = 1; i < segments.length; i++) {
    if (!segments[i].lineId) {
      return false; // Missing line for non-start segments
    }
  }
  return true;
}

// === Constants ===

export const ROUTE_CONSTANTS = {
  // Route length limits
  MIN_ROUTE_SEGMENTS: 2,
  MAX_ROUTE_SEGMENTS: 50,

  // Transfer limits
  MAX_TRANSFERS: 10,
  DEFAULT_TRANSFER_TIME: 5, // minutes

  // Optimization limits
  DEFAULT_MAX_ITERATIONS: 1000,
  DEFAULT_OPTIMIZATION_TIMEOUT: 30000, // 30 seconds
  MAX_ALTERNATIVES_TO_CONSIDER: 100,

  // Performance thresholds
  SLOW_ROUTE_BUILD_THRESHOLD: 5000, // 5 seconds
  MEMORY_WARNING_THRESHOLD: 50 * 1024 * 1024, // 50MB

  // Scoring
  MAX_PERFORMANCE_SCORE: 100,
  MIN_FEASIBILITY_SCORE: 0,
  MAX_FEASIBILITY_SCORE: 100,

  // Timeouts
  DEFAULT_VALIDATION_TIMEOUT: 10000,
  DEFAULT_BUILD_TIMEOUT: 30000,
  DEFAULT_OPTIMIZATION_TIMEOUT_SHORT: 5000
} as const;

// === Export Collections ===
export interface RouteTypeCollection {
  RouteSegment: RouteSegment;
  RouteBuilder: RouteBuilder;
  RouteValidationResult: RouteValidationResult;
  RouteOptimizationResult: RouteOptimizationResult;
}

export type RouteTypes = keyof RouteTypeCollection;