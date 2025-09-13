/**
 * Fare calculation TypeScript interfaces for Farert WebAssembly Module
 *
 * Provides comprehensive typing for fare calculation, special rules,
 * discount handling, and fare display functionality with 100% C++ compatibility.
 */

import { FarertErrorCode } from './farert';
import { RouteSegment } from './route-types';

// === Core Fare Information Interface (Complete FARE_INFO matching C++) ===

export interface FareInfo {
  // === Core Fare Data ===
  /** Base fare amount in yen */
  fare: number;

  /** Whether fare calculation was successful */
  fareInfoValid: boolean;

  /** Whether the fare calculation completed */
  isValid: boolean;

  // === Special Rule Applications ===
  /** Whether Rule 114 (特殊区間) was applied */
  isRule114Applied: boolean;

  /** Whether special fare rules were applied */
  isSpecialFareApplied: boolean;

  /** Whether long route calculation was used */
  isLongRouteApplied: boolean;

  /** Whether city-to-city calculation was used */
  isCityToCityApplied: boolean;

  // === Fare Components ===
  /** Basic fare (運賃) */
  basicFare: number;

  /** Express fare (急行料金) */
  expressFare: number;

  /** Limited express fare (特急料金) */
  limitedExpressFare: number;

  /** Reserved seat fare (指定席料金) */
  reservedSeatFare: number;

  /** Green car fare (グリーン車料金) */
  greenCarFare: number;

  /** Special express fare (特別急行料金) */
  specialExpressFare: number;

  // === Distance and Time Information ===
  /** Total route distance in kilometers */
  totalDistance: number;

  /** Estimated total travel time in minutes */
  totalTime: number;

  /** Number of transfers required */
  transferCount: number;

  /** Number of different operators used */
  operatorCount: number;

  // === Stock Discount Information ===
  /** Number of available stock discount options */
  availCountForFareOfStockDiscount: number;

  /** Get stock discount fare by index */
  fareForStockDiscount(index: number): number;

  /** Get stock discount title by index */
  fareForStockDiscountTitle(index: number): string;

  // === Detailed Fare Breakdown ===
  /** Detailed breakdown of fare components */
  fareBreakdown: FareBreakdownItem[];

  /** Rule-specific fare adjustments */
  ruleAdjustments: FareRuleAdjustment[];

  /** Distance-based fare segments */
  distanceSegments: FareDistanceSegment[];

  // === Validation and Display ===
  /** Validate fare calculation results */
  isValid(): boolean;

  /** Export fare information as JSON string */
  toJson(): string;

  /** Format fare for display */
  toString(): string;

  /** Get detailed fare explanation */
  getExplanation(): string;

  // === Memory Management ===
  /** Clean up WebAssembly memory */
  delete(): void;
}

// === Fare Breakdown and Components ===

export interface FareBreakdownItem {
  /** Description of fare component */
  description: string;

  /** Fare amount in yen */
  amount: number;

  /** Type of fare component */
  type: FareComponentType;

  /** Lines this component applies to */
  lineIds?: number[];

  /** Station range for this component */
  stationRange?: FareStationRange;

  /** Operator responsible for this component */
  operatorId?: number;

  /** Whether this component is optional */
  isOptional: boolean;

  /** Special rules applied to this component */
  appliedRules: string[];
}

export type FareComponentType =
  | 'basic'         // Basic fare (普通運賃)
  | 'express'       // Express surcharge (急行料金)
  | 'limited'       // Limited express (特急料金)
  | 'reserved'      // Reserved seat (指定席料金)
  | 'green'         // Green car (グリーン車料金)
  | 'special'       // Special fare (特別料金)
  | 'discount'      // Discount applied (割引)
  | 'surcharge'     // Additional surcharge (追加料金)
  | 'tax'           // Tax component (税金)
  | 'transfer';     // Transfer fee (乗り継ぎ料金)

export interface FareStationRange {
  /** Starting station ID */
  startStationId: number;

  /** Ending station ID */
  endStationId: number;

  /** Station names for reference */
  startStationName?: string;
  endStationName?: string;

  /** Distance of this segment */
  distance: number;
}

// === Fare Rule Processing ===

export interface FareRuleAdjustment {
  /** Rule identifier */
  ruleId: string;

  /** Rule name/description */
  ruleName: string;

  /** Fare adjustment amount (can be negative) */
  adjustment: number;

  /** Whether this rule was applied */
  applied: boolean;

  /** Condition that triggered this rule */
  condition: string;

  /** Lines affected by this rule */
  affectedLines: number[];

  /** Stations affected by this rule */
  affectedStations: number[];

  /** Rule category */
  category: FareRuleCategory;
}

export type FareRuleCategory =
  | 'distance'      // Distance-based rules
  | 'express'       // Express service rules
  | 'transfer'      // Transfer-related rules
  | 'operator'      // Operator-specific rules
  | 'special'       // Special fare zones
  | 'discount'      // Discount rules
  | 'surcharge'     // Surcharge rules
  | 'city'          // City-to-city rules
  | 'long_distance' // Long distance rules
  | 'regional';     // Regional fare rules

export interface FareDistanceSegment {
  /** Segment start distance (km) */
  startDistance: number;

  /** Segment end distance (km) */
  endDistance: number;

  /** Fare for this distance segment */
  segmentFare: number;

  /** Fare rate per km for this segment */
  ratePerKm: number;

  /** Distance bracket this segment falls into */
  distanceBracket: FareDistanceBracket;
}

export type FareDistanceBracket =
  | 'local'         // 0-30km
  | 'medium'        // 30-100km
  | 'long'          // 100-300km
  | 'very_long'     // 300km+
  | 'special';      // Special calculation zones

// === Stock Discount System ===

export interface StockDiscount {
  /** Discount identifier */
  id: string;

  /** Discount name */
  name: string;

  /** Detailed description */
  description: string;

  /** Discount amount in yen */
  discountAmount: number;

  /** Discount percentage (if applicable) */
  discountPercentage?: number;

  /** Minimum fare to apply discount */
  minimumFare?: number;

  /** Maximum discount amount */
  maximumDiscount?: number;

  /** Validity period */
  validity?: DiscountValidityPeriod;

  /** Conditions for applying discount */
  conditions: DiscountCondition[];

  /** Whether this discount is currently applicable */
  isApplicable: boolean;

  /** Priority for discount application */
  priority: number;
}

export interface DiscountValidityPeriod {
  /** Discount valid from date */
  validFrom: Date;

  /** Discount valid until date */
  validUntil: Date;

  /** Days of week discount is valid */
  validDaysOfWeek?: number[];

  /** Time periods when discount is valid */
  validTimePeriods?: TimeRange[];
}

export interface TimeRange {
  /** Start time (24-hour format) */
  startTime: string;

  /** End time (24-hour format) */
  endTime: string;
}

export interface DiscountCondition {
  /** Condition type */
  type: DiscountConditionType;

  /** Condition description */
  description: string;

  /** Condition parameters */
  parameters: Record<string, any>;

  /** Whether condition is currently met */
  isMet: boolean;
}

export type DiscountConditionType =
  | 'route_length'      // Route distance requirements
  | 'operator_count'    // Number of operators used
  | 'transfer_count'    // Number of transfers
  | 'time_of_day'      // Time-based conditions
  | 'day_of_week'      // Day-based conditions
  | 'season'           // Seasonal conditions
  | 'age'              // Age-based conditions
  | 'group_size'       // Group size requirements
  | 'frequency'        // Usage frequency
  | 'membership';      // Membership requirements

// === Fare Calculation Options ===

export interface FareCalculationOptions {
  /** Enable long route calculation */
  enableLongRoute?: boolean;

  /** Set start station as city representative */
  startAsCity?: boolean;

  /** Set arrival station as city representative */
  arriveAsCity?: boolean;

  /** Prefer express services */
  preferExpress?: boolean;

  /** Include reserved seat charges */
  includeReservedSeat?: boolean;

  /** Include Green car charges */
  includeGreenCar?: boolean;

  /** Apply available discounts */
  applyDiscounts?: boolean;

  /** Discount types to consider */
  discountTypes?: string[];

  /** Calculation date/time */
  calculationDateTime?: Date;

  /** Special calculation options */
  specialOptions?: FareSpecialOptions;
}

export interface FareSpecialOptions {
  /** Force specific rule application */
  forceRules?: string[];

  /** Ignore specific rules */
  ignoreRules?: string[];

  /** Override operator boundaries */
  ignoreOperatorBoundaries?: boolean;

  /** Use alternative fare calculation */
  useAlternativeCalculation?: boolean;

  /** Debug mode for detailed breakdown */
  debugMode?: boolean;
}

// === Fare Display and Formatting ===

export interface FareDisplayOptions {
  /** Currency format */
  currency: FareCurrency;

  /** Number format locale */
  locale?: string;

  /** Show breakdown details */
  showBreakdown?: boolean;

  /** Show discount information */
  showDiscounts?: boolean;

  /** Show rule explanations */
  showRules?: boolean;

  /** Display precision */
  precision?: number;

  /** Include symbols and units */
  includeSymbols?: boolean;
}

export type FareCurrency =
  | 'JPY'   // Japanese Yen (¥)
  | 'USD'   // US Dollars ($)
  | 'EUR'   // Euros (€)
  | 'KRW'   // Korean Won (₩)
  | 'CNY';  // Chinese Yuan (¥)

export interface FareDisplayResult {
  /** Formatted main fare string */
  mainFare: string;

  /** Formatted fare breakdown */
  breakdown: FareDisplayBreakdown[];

  /** Discount information */
  discounts: FareDisplayDiscount[];

  /** Rule explanations */
  ruleExplanations: string[];

  /** Total display string */
  totalDisplay: string;

  /** Summary information */
  summary: FareDisplaySummary;
}

export interface FareDisplayBreakdown {
  /** Component name */
  name: string;

  /** Formatted amount */
  amount: string;

  /** Component type */
  type: FareComponentType;

  /** Display order */
  order: number;
}

export interface FareDisplayDiscount {
  /** Discount name */
  name: string;

  /** Original amount */
  originalAmount: string;

  /** Discounted amount */
  discountedAmount: string;

  /** Savings amount */
  savings: string;

  /** Savings percentage */
  savingsPercentage: string;
}

export interface FareDisplaySummary {
  /** Total before discounts */
  subtotal: string;

  /** Total discounts applied */
  totalDiscounts: string;

  /** Final total */
  grandTotal: string;

  /** Calculation summary */
  calculationSummary: string;
}

// === Fare Validation and Analysis ===

export interface FareValidationOptions {
  /** Validate fare calculation consistency */
  validateCalculation?: boolean;

  /** Check rule applications */
  validateRules?: boolean;

  /** Verify discount applications */
  validateDiscounts?: boolean;

  /** Check against historical data */
  validateHistory?: boolean;

  /** Tolerance for fare variations */
  tolerance?: number;
}

export interface FareValidationResult {
  /** Whether fare calculation is valid */
  isValid: boolean;

  /** Validation errors found */
  errors: FareValidationError[];

  /** Validation warnings */
  warnings: FareValidationWarning[];

  /** Validation execution time */
  executionTime: number;

  /** Confidence score (0-100) */
  confidenceScore: number;
}

export interface FareValidationError {
  /** Error type */
  type: FareValidationErrorType;

  /** Error message */
  message: string;

  /** Expected value */
  expected?: number;

  /** Actual value */
  actual?: number;

  /** Affected component */
  component?: string;

  /** Severity level */
  severity: FareErrorSeverity;
}

export interface FareValidationWarning {
  /** Warning message */
  message: string;

  /** Related component */
  component?: string;

  /** Suggested action */
  suggestion?: string;
}

export type FareValidationErrorType =
  | 'CALCULATION_MISMATCH'
  | 'RULE_APPLICATION_ERROR'
  | 'DISCOUNT_ERROR'
  | 'BREAKDOWN_INCONSISTENCY'
  | 'DISTANCE_MISMATCH'
  | 'OPERATOR_ERROR'
  | 'HISTORICAL_DEVIATION';

export type FareErrorSeverity =
  | 'critical'  // Major calculation error
  | 'major'     // Significant discrepancy
  | 'minor'     // Small variation within tolerance
  | 'info';     // Informational only

// === Fare Comparison and Analysis ===

export interface FareComparison {
  /** Original fare calculation */
  originalFare: FareInfo;

  /** Comparison fare calculation */
  comparisonFare: FareInfo;

  /** Difference analysis */
  difference: FareDifference;

  /** Comparison metrics */
  metrics: FareComparisonMetrics;

  /** Recommendation */
  recommendation?: FareRecommendation;
}

export interface FareDifference {
  /** Total fare difference */
  totalDifference: number;

  /** Percentage difference */
  percentageDifference: number;

  /** Component differences */
  componentDifferences: FareComponentDifference[];

  /** Rule differences */
  ruleDifferences: FareRuleDifference[];

  /** Time/distance differences */
  routeDifferences: FareRouteDifference;
}

export interface FareComponentDifference {
  /** Component type */
  type: FareComponentType;

  /** Original amount */
  originalAmount: number;

  /** Comparison amount */
  comparisonAmount: number;

  /** Difference */
  difference: number;

  /** Percentage change */
  percentageChange: number;
}

export interface FareRuleDifference {
  /** Rule ID */
  ruleId: string;

  /** Applied in original */
  originallyApplied: boolean;

  /** Applied in comparison */
  comparisonApplied: boolean;

  /** Impact of difference */
  impact: number;
}

export interface FareRouteDifference {
  /** Distance difference */
  distanceDifference: number;

  /** Time difference */
  timeDifference: number;

  /** Transfer count difference */
  transferDifference: number;

  /** Route complexity difference */
  complexityDifference: number;
}

export interface FareComparisonMetrics {
  /** Which option is cheaper */
  cheaperOption: 'original' | 'comparison' | 'equal';

  /** Which option is faster */
  fasterOption: 'original' | 'comparison' | 'equal';

  /** Overall preference score */
  preferenceScore: number;

  /** Cost efficiency (yen per km) */
  costEfficiency: {
    original: number;
    comparison: number;
  };
}

export interface FareRecommendation {
  /** Recommended option */
  recommendation: 'original' | 'comparison';

  /** Reason for recommendation */
  reason: string;

  /** Key benefits */
  benefits: string[];

  /** Trade-offs */
  tradeOffs: string[];

  /** Confidence level */
  confidence: number;
}

// === Utility Types and Functions ===

// Type guards
export function isFareInfo(obj: any): obj is FareInfo {
  return obj &&
    typeof obj.fare === 'number' &&
    typeof obj.fareInfoValid === 'boolean' &&
    obj.fare >= 0;
}

export function isFareBreakdownItem(obj: any): obj is FareBreakdownItem {
  return obj &&
    typeof obj.description === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.type === 'string';
}

export function isStockDiscount(obj: any): obj is StockDiscount {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.discountAmount === 'number';
}

// Validation functions
export function isValidFareAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && amount <= 1000000;
}

export function isValidDiscountPercentage(percentage: number): boolean {
  return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100;
}

// === Constants ===

export const FARE_CONSTANTS = {
  // Fare limits
  MIN_FARE: 0,
  MAX_FARE: 1000000,
  DEFAULT_BASIC_FARE: 140,

  // Discount limits
  MAX_DISCOUNT_PERCENTAGE: 100,
  MAX_DISCOUNT_AMOUNT: 50000,

  // Distance brackets (km)
  LOCAL_DISTANCE_LIMIT: 30,
  MEDIUM_DISTANCE_LIMIT: 100,
  LONG_DISTANCE_LIMIT: 300,

  // Calculation timeouts
  DEFAULT_CALCULATION_TIMEOUT: 10000,
  COMPLEX_CALCULATION_TIMEOUT: 30000,

  // Validation tolerances
  DEFAULT_FARE_TOLERANCE: 10, // yen
  PERCENTAGE_TOLERANCE: 5,    // percent

  // Display formats
  DEFAULT_CURRENCY: 'JPY' as FareCurrency,
  DEFAULT_PRECISION: 0,
  DEFAULT_LOCALE: 'ja-JP'
} as const;

// === Export Collections ===
export type FareAmount = number;
export type DiscountAmount = number;
export type FarePercent = number;