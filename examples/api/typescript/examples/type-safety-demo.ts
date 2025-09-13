/**
 * TypeScript Type Safety Demonstration for Farert WebAssembly Module
 *
 * This example showcases advanced TypeScript features for type-safe
 * WebAssembly integration, demonstrating compile-time error prevention,
 * runtime type validation, and robust error handling patterns.
 *
 * Key Learning Points:
 * - Compile-time type checking and error prevention
 * - Runtime type validation and guards
 * - Generic programming patterns
 * - Union types and type narrowing
 * - Advanced error handling with typed exceptions
 * - Type-safe API wrappers and builders
 *
 * Prerequisites: Intermediate TypeScript knowledge, generics, advanced types
 */

import {
  FarertModule,
  FareInfo,
  RouteSegment,
  StationInfo,
  LineInfo,
  FarertError,
  FARERT_CONSTANTS,
  isFarertModule,
  isValidStationId,
  isValidLineId
} from '../types/farert';

import {
  Station,
  StationSearchResult,
  StationValidationResult,
  StationValidationError,
  isStation,
  isValidStationName,
  isValidStationKana,
  STATION_CONSTANTS
} from '../types/station-types';

import {
  Line,
  Company,
  Prefecture,
  JunctionInfo,
  isLine,
  isCompany,
  isPrefecture,
  isJRCompany,
  isValidLineId as isValidLineIdFromTypes,
  LINE_CONSTANTS
} from '../types/line-types';

import {
  RouteBuilder,
  RouteBuildingOptions,
  RouteValidationResult,
  RouteValidationError,
  RouteOptimizationResult,
  isRouteSegment,
  isRouteBuilder,
  hasValidConnections,
  ROUTE_CONSTANTS
} from '../types/route-types';

import {
  FareDisplayOptions,
  FareDisplayResult,
  StockDiscount,
  FareValidationResult,
  isFareInfo,
  isValidFareAmount,
  FARE_CONSTANTS
} from '../types/fare-types';

// === Type-Safe API Wrapper Classes ===

/**
 * Type-safe wrapper for Farert WebAssembly module with compile-time guarantees
 */
class TypeSafeFarertWrapper {
  constructor(private module: FarertModule) {
    if (!isFarertModule(module)) {
      throw new TypeError('Invalid Farert module provided');
    }
  }

  // === Compile-time Type Safety Examples ===

  /**
   * Station lookup with strict typing and validation
   * Demonstrates: Generic return types, type narrowing, error handling
   */
  async lookupStation<T extends boolean = false>(
    identifier: string | number,
    extended?: T
  ): Promise<T extends true ? Station | null : number> {
    // Compile-time validation of parameter types
    if (typeof identifier !== 'string' && typeof identifier !== 'number') {
      // This would be caught at compile time, but we handle it for runtime safety
      throw new TypeError('Station identifier must be string or number');
    }

    let stationId: number;

    if (typeof identifier === 'string') {
      // Type narrowing - TypeScript knows identifier is string here
      if (!isValidStationName(identifier)) {
        throw new TypeError(`Invalid station name format: ${identifier}`);
      }
      stationId = this.module.getStationId(identifier);
    } else {
      // Type narrowing - TypeScript knows identifier is number here
      if (!isValidStationId(identifier)) {
        throw new TypeError(`Invalid station ID: ${identifier}`);
      }
      stationId = identifier;
    }

    // Validate lookup result
    if (!isValidStationId(stationId)) {
      if (extended) {
        return null as T extends true ? Station | null : number;
      } else {
        return FARERT_CONSTANTS.STATION_NOT_FOUND as T extends true ? Station | null : number;
      }
    }

    // Return appropriate type based on generic parameter
    if (extended) {
      const station: Station = {
        id: stationId,
        name: this.module.getStationName(stationId),
        nameExtended: this.module.getStationNameExtended?.(stationId) || this.module.getStationName(stationId),
        kana: this.module.getStationKana?.(stationId) || '',
        prefecture: this.module.getStationPrefecture?.(stationId) || '',
        prefectureId: 0, // Would need additional lookup
        isJunction: Boolean(this.module.isJunction(stationId)),
        lines: this.module.EnumLineOfStationId?.(stationId) || []
      };

      // Runtime type validation
      if (!isStation(station)) {
        throw new TypeError('Failed to create valid station object');
      }

      return station as T extends true ? Station | null : number;
    } else {
      return stationId as T extends true ? Station | null : number;
    }
  }

  /**
   * Type-safe line lookup with comprehensive validation
   * Demonstrates: Union types, type guards, error accumulation
   */
  async lookupLine(identifier: string | number): Promise<Line | null> {
    const errors: string[] = [];

    try {
      let lineId: number;

      if (typeof identifier === 'string') {
        if (identifier.trim().length === 0) {
          errors.push('Line name cannot be empty');
        }
        lineId = this.module.getLineId(identifier);
      } else {
        if (!isValidLineIdFromTypes(identifier)) {
          errors.push(`Invalid line ID: ${identifier}`);
        }
        lineId = identifier;
      }

      if (errors.length > 0) {
        throw new TypeError(`Line lookup validation failed: ${errors.join(', ')}`);
      }

      if (!isValidLineId(lineId)) {
        return null;
      }

      const line: Line = {
        id: lineId,
        name: this.module.getLineName(lineId),
        companyId: 0, // Would need additional lookup
        companyName: 'Unknown',
        type: 'conventional',
        isJR: isJRCompany(0), // Would use actual company ID
        isPrivate: !isJRCompany(0),
        isMunicipal: false,
        stations: this.module.StationsIdsOfLineId?.(lineId) || []
      };

      return isLine(line) ? line : null;

    } catch (error) {
      console.error('Line lookup failed:', error);
      return null;
    }
  }

  // === Runtime Type Validation Examples ===

  /**
   * Validates station data with comprehensive type checking
   * Demonstrates: Type predicates, validation patterns, error accumulation
   */
  validateStationData(data: unknown): StationValidationResult {
    const errors: StationValidationError[] = [];
    const warnings: string[] = [];
    const startTime = performance.now();

    // Type guard check
    if (!isStation(data)) {
      errors.push({
        type: 'MISSING_REQUIRED_FIELD',
        message: 'Data is not a valid station object',
        field: 'id', // Default field
        value: data
      });

      return {
        isValid: false,
        errors,
        warnings: warnings.map(w => ({ message: w })),
        suggestions: ['Ensure data has all required station fields'],
        executionTime: performance.now() - startTime
      };
    }

    const station = data as Station;

    // ID validation
    if (!isValidStationId(station.id)) {
      errors.push({
        type: 'INVALID_ID',
        message: `Station ID must be between ${STATION_CONSTANTS.MIN_STATION_ID} and ${STATION_CONSTANTS.MAX_STATION_ID}`,
        field: 'id',
        value: station.id,
        expected: `${STATION_CONSTANTS.MIN_STATION_ID}-${STATION_CONSTANTS.MAX_STATION_ID}`
      });
    }

    // Name validation
    if (!isValidStationName(station.name)) {
      errors.push({
        type: 'INVALID_NAME',
        message: 'Station name must be valid Japanese text',
        field: 'name',
        value: station.name,
        expected: 'Japanese characters (hiragana, katakana, kanji)'
      });
    }

    // Kana validation
    if (!isValidStationKana(station.kana)) {
      if (station.kana.length === 0) {
        warnings.push('Station kana reading is empty');
      } else {
        errors.push({
          type: 'INVALID_KANA',
          message: 'Station kana must contain only hiragana characters',
          field: 'kana',
          value: station.kana,
          expected: 'Hiragana characters only'
        });
      }
    }

    // Prefecture validation
    if (typeof station.prefecture !== 'string' || station.prefecture.length === 0) {
      warnings.push('Station prefecture information is missing');
    }

    // Lines validation
    if (!Array.isArray(station.lines)) {
      errors.push({
        type: 'INVALID_NAME', // Using existing type
        message: 'Station lines must be an array',
        field: 'lines' as keyof Station,
        value: station.lines,
        expected: 'Array of line IDs'
      });
    } else {
      const invalidLines = station.lines.filter(lineId => !isValidLineIdFromTypes(lineId));
      if (invalidLines.length > 0) {
        warnings.push(`Invalid line IDs found: ${invalidLines.join(', ')}`);
      }
    }

    const executionTime = performance.now() - startTime;
    const isValid = errors.length === 0;

    return {
      isValid,
      errors,
      warnings: warnings.map(w => ({ message: w })),
      suggestions: isValid ? [] : [
        'Check station data against Japanese railway standards',
        'Ensure all required fields are properly formatted',
        'Validate station exists in current database'
      ],
      executionTime
    };
  }

  // === Advanced Generic Patterns ===

  /**
   * Generic batch operations with type preservation
   * Demonstrates: Generics, mapped types, conditional returns
   */
  async batchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    options: {
      concurrency?: number;
      failFast?: boolean;
      validateResults?: (result: R) => boolean;
    } = {}
  ): Promise<{
    results: R[];
    errors: Array<{ item: T; error: Error }>;
    successCount: number;
    failureCount: number;
    executionTime: number;
  }> {
    const startTime = performance.now();
    const {
      concurrency = 5,
      failFast = false,
      validateResults
    } = options;

    const results: R[] = [];
    const errors: Array<{ item: T; error: Error }> = [];
    let successCount = 0;
    let failureCount = 0;

    // Process items in batches to respect concurrency limits
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);

      const batchPromises = batch.map(async item => {
        try {
          const result = await operation(item);

          // Runtime validation if validator provided
          if (validateResults && !validateResults(result)) {
            throw new Error('Result failed validation');
          }

          results.push(result);
          successCount++;
          return result;
        } catch (error) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          errors.push({ item, error: errorObj });
          failureCount++;

          if (failFast) {
            throw error;
          }

          return null;
        }
      });

      try {
        await Promise.all(batchPromises);
      } catch (error) {
        if (failFast) {
          break;
        }
      }
    }

    return {
      results,
      errors,
      successCount,
      failureCount,
      executionTime: performance.now() - startTime
    };
  }

  // === Type-Safe Route Builder ===

  /**
   * Creates a type-safe route builder with fluent interface
   * Demonstrates: Builder pattern, method chaining, type state management
   */
  createRouteBuilder(options: RouteBuildingOptions = {}): TypeSafeRouteBuilder {
    return new TypeSafeRouteBuilder(this.module, options);
  }
}

/**
 * Type-safe route builder with compile-time validation
 */
class TypeSafeRouteBuilder {
  private segments: RouteSegment[] = [];
  private validation: RouteValidationResult | null = null;
  private calcRoute: any = null;

  constructor(
    private module: FarertModule,
    private options: RouteBuildingOptions
  ) {
    // Initialize C++ route objects
    const route = new module.cRoute();
    this.calcRoute = new module.cCalcRoute(route);
  }

  /**
   * Add starting station with type validation
   */
  startFrom(stationIdentifier: string | number): this {
    let stationId: number;
    let stationName: string;

    if (typeof stationIdentifier === 'string') {
      if (!isValidStationName(stationIdentifier)) {
        throw new TypeError(`Invalid station name: ${stationIdentifier}`);
      }
      stationId = this.module.getStationId(stationIdentifier);
      stationName = stationIdentifier;
    } else {
      if (!isValidStationId(stationIdentifier)) {
        throw new TypeError(`Invalid station ID: ${stationIdentifier}`);
      }
      stationId = stationIdentifier;
      stationName = this.module.getStationName(stationId);
    }

    if (!isValidStationId(stationId)) {
      throw new Error(`Station not found: ${stationIdentifier}`);
    }

    // Add to C++ route
    const result = this.calcRoute.addRouteBegin(stationId);
    if (result < 0) {
      throw new Error(`Failed to set starting station (error: ${result})`);
    }

    // Add to TypeScript route tracking
    const segment: RouteSegment = {
      stationId,
      stationName,
      stationKana: this.module.getStationKana?.(stationId) || '',
      isTransfer: false,
      flags: { isStart: true }
    };

    if (isRouteSegment(segment)) {
      this.segments = [segment];
    } else {
      throw new TypeError('Failed to create valid route segment');
    }

    return this;
  }

  /**
   * Add route segment with comprehensive validation
   */
  via(lineIdentifier: string | number, stationIdentifier: string | number): this {
    if (this.segments.length === 0) {
      throw new Error('Must set starting station first');
    }

    // Validate and resolve line
    let lineId: number;
    let lineName: string;

    if (typeof lineIdentifier === 'string') {
      lineId = this.module.getLineId(lineIdentifier);
      lineName = lineIdentifier;
    } else {
      if (!isValidLineIdFromTypes(lineIdentifier)) {
        throw new TypeError(`Invalid line ID: ${lineIdentifier}`);
      }
      lineId = lineIdentifier;
      lineName = this.module.getLineName(lineId);
    }

    // Validate and resolve station
    let stationId: number;
    let stationName: string;

    if (typeof stationIdentifier === 'string') {
      if (!isValidStationName(stationIdentifier)) {
        throw new TypeError(`Invalid station name: ${stationIdentifier}`);
      }
      stationId = this.module.getStationId(stationIdentifier);
      stationName = stationIdentifier;
    } else {
      if (!isValidStationId(stationIdentifier)) {
        throw new TypeError(`Invalid station ID: ${stationIdentifier}`);
      }
      stationId = stationIdentifier;
      stationName = this.module.getStationName(stationId);
    }

    // Validate connection
    if (!isValidLineId(lineId) || !isValidStationId(stationId)) {
      throw new Error(`Invalid line or station: ${lineIdentifier} -> ${stationIdentifier}`);
    }

    // Add to C++ route
    const result = this.calcRoute.addRoute(lineId, stationId);
    if (result < 0) {
      throw new Error(`Failed to add route segment (error: ${result})`);
    }

    // Create typed segment
    const segment: RouteSegment = {
      stationId,
      stationName,
      stationKana: this.module.getStationKana?.(stationId) || '',
      lineId,
      lineName,
      isTransfer: this.segments.length > 1, // More than just start station
      transferLines: this.module.EnumLineOfStationId?.(stationId) || []
    };

    if (isRouteSegment(segment)) {
      this.segments.push(segment);
    } else {
      throw new TypeError('Failed to create valid route segment');
    }

    return this;
  }

  /**
   * Calculate fare with type-safe result
   */
  async calculateFare(): Promise<FareInfo> {
    if (this.segments.length < 2) {
      throw new Error('Route must have at least 2 stations');
    }

    // Apply options
    if (this.options.enableLongRoute) {
      this.calcRoute.setLongRoute(true);
    }

    if (this.options.startAsCity) {
      this.calcRoute.setStartAsCity();
    }

    if (this.options.arriveAsCity) {
      this.calcRoute.setArriveAsCity();
    }

    // Calculate fare
    const fareAmount = this.calcRoute.calculateFare();
    if (fareAmount < 0) {
      throw new Error(`Fare calculation failed (error: ${fareAmount})`);
    }

    // Get detailed fare information
    const fareString = this.calcRoute.getFareString();
    const fareJsonString = this.calcRoute.getFareInfoJson();

    // Parse and validate JSON
    let fareDetails: any = {};
    try {
      fareDetails = JSON.parse(fareJsonString);
    } catch (error) {
      console.warn('Failed to parse fare JSON:', error);
    }

    // Create type-safe fare info
    const fareInfo: FareInfo = {
      fare: fareAmount,
      fareInfoValid: true,
      isValid: () => fareAmount > 0,
      isRule114Applied: Boolean(fareDetails.isRule114Applied),
      isSpecialFareApplied: Boolean(fareDetails.isSpecialFareApplied),
      isLongRouteApplied: Boolean(this.options.enableLongRoute),
      isCityToCityApplied: Boolean(this.options.startAsCity || this.options.arriveAsCity),
      basicFare: fareAmount, // Simplified for demo
      expressFare: 0,
      limitedExpressFare: 0,
      reservedSeatFare: 0,
      greenCarFare: 0,
      specialExpressFare: 0,
      totalDistance: 0, // Would be calculated
      totalTime: 0,     // Would be calculated
      transferCount: Math.max(0, this.segments.length - 2),
      operatorCount: 1, // Simplified
      availCountForFareOfStockDiscount: fareDetails.availCountForFareOfStockDiscount || 0,
      fareForStockDiscount: (index: number) => 0, // Would be implemented
      fareForStockDiscountTitle: (index: number) => '', // Would be implemented
      fareBreakdown: [], // Would be populated
      ruleAdjustments: [], // Would be populated
      distanceSegments: [], // Would be populated
      toJson: () => fareJsonString,
      toString: () => fareString,
      getExplanation: () => `Route fare: ¥${fareAmount}`,
      delete: () => {
        if (this.calcRoute && typeof this.calcRoute.delete === 'function') {
          this.calcRoute.delete();
        }
      }
    };

    // Validate fare info
    if (!isFareInfo(fareInfo)) {
      throw new TypeError('Failed to create valid fare info object');
    }

    return fareInfo;
  }

  /**
   * Get current route with validation
   */
  getRoute(): RouteSegment[] {
    if (!hasValidConnections(this.segments)) {
      throw new Error('Route has invalid connections');
    }

    return [...this.segments]; // Return copy to prevent mutation
  }

  /**
   * Validate current route
   */
  validate(): RouteValidationResult {
    const startTime = performance.now();
    const errors: RouteValidationError[] = [];
    const warnings: string[] = [];

    // Check minimum segments
    if (this.segments.length < ROUTE_CONSTANTS.MIN_ROUTE_SEGMENTS) {
      errors.push({
        type: 'MISSING_REQUIRED_SEGMENT',
        message: `Route must have at least ${ROUTE_CONSTANTS.MIN_ROUTE_SEGMENTS} segments`,
        severity: 'critical'
      });
    }

    // Check maximum segments
    if (this.segments.length > ROUTE_CONSTANTS.MAX_ROUTE_SEGMENTS) {
      errors.push({
        type: 'ROUTE_TOO_LONG',
        message: `Route cannot exceed ${ROUTE_CONSTANTS.MAX_ROUTE_SEGMENTS} segments`,
        severity: 'critical'
      });
    }

    // Validate connections
    for (let i = 1; i < this.segments.length; i++) {
      const segment = this.segments[i];
      if (!segment.lineId) {
        errors.push({
          type: 'CONNECTION_INVALID',
          message: `Missing line for segment ${i}`,
          segmentIndex: i,
          severity: 'major'
        });
      }
    }

    // Check for circular routes
    const stationIds = this.segments.map(s => s.stationId);
    const uniqueStations = new Set(stationIds);
    if (uniqueStations.size < stationIds.length) {
      warnings.push('Route contains duplicate stations (circular route)');
    }

    this.validation = {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.map(w => ({
        message: w,
        category: 'usability' as const
      })),
      suggestions: errors.length > 0 ? [
        'Check route connections',
        'Verify all stations and lines exist',
        'Ensure route is not too complex'
      ] : [],
      executionTime: performance.now() - startTime,
      report: {
        summary: {
          totalSegments: this.segments.length,
          validSegments: this.segments.filter(s => isRouteSegment(s)).length,
          errorSegments: errors.length,
          warningSegments: warnings.length,
          overallScore: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
        },
        segmentAnalysis: [], // Would be populated
        connectionAnalysis: {
          allConnectionsValid: errors.length === 0,
          validConnections: Math.max(0, this.segments.length - 1 - errors.length),
          invalidConnections: errors.length,
          connections: [] // Would be populated
        },
        performanceAnalysis: {
          estimatedTravelTime: 0,
          estimatedDistance: 0,
          transferCount: Math.max(0, this.segments.length - 2),
          complexityScore: this.segments.length,
          optimizationSuggestions: []
        }
      }
    };

    return this.validation;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.calcRoute && typeof this.calcRoute.delete === 'function') {
      this.calcRoute.delete();
      this.calcRoute = null;
    }
  }
}

// === Demonstration Functions ===

/**
 * Demonstrate compile-time type safety features
 */
async function demonstrateCompileTimeSafety(wrapper: TypeSafeFarertWrapper): Promise<void> {
  console.log('\n🛡️ === Compile-Time Type Safety Demo ===');

  try {
    // Type-safe station lookup with generic return types
    console.log('🔍 Testing generic station lookup...');

    // This returns a number (compile-time guaranteed)
    const stationId: number = await wrapper.lookupStation('東京', false);
    console.log(`Station ID lookup: ${stationId}`);

    // This returns Station | null (compile-time guaranteed)
    const stationInfo: Station | null = await wrapper.lookupStation('東京', true);
    if (stationInfo) {
      console.log(`Station info: ${stationInfo.name} (${stationInfo.kana})`);
    }

    // TypeScript would catch these errors at compile time:
    // const invalidCall1 = await wrapper.lookupStation(123, true, "extra-param"); // Too many params
    // const invalidCall2 = await wrapper.lookupStation(); // Missing required param
    // const wrongType: string = await wrapper.lookupStation('東京', false); // Wrong type assignment

    console.log('✅ Compile-time type safety demonstrated');

  } catch (error) {
    console.error('❌ Compile-time safety demo failed:', error);
  }
}

/**
 * Demonstrate runtime type validation
 */
async function demonstrateRuntimeValidation(wrapper: TypeSafeFarertWrapper): Promise<void> {
  console.log('\n🔬 === Runtime Type Validation Demo ===');

  try {
    // Test valid station data
    const validStation: Station = {
      id: 1130101,
      name: '東京',
      nameExtended: '東京',
      kana: 'とうきょう',
      prefecture: '東京都',
      prefectureId: 13,
      isJunction: true,
      lines: [11301, 11302, 11303]
    };

    console.log('🧪 Validating correct station data...');
    const validResult = wrapper.validateStationData(validStation);
    console.log(`Validation result: ${validResult.isValid ? 'PASS' : 'FAIL'}`);
    console.log(`Execution time: ${validResult.executionTime.toFixed(2)}ms`);

    if (validResult.warnings.length > 0) {
      console.log(`Warnings: ${validResult.warnings.map(w => w.message).join(', ')}`);
    }

    // Test invalid station data
    const invalidStation = {
      id: -1, // Invalid ID
      name: '', // Empty name
      kana: 'invalid123', // Invalid kana
      prefecture: null, // Wrong type
      lines: 'not-an-array' // Wrong type
    };

    console.log('🧪 Validating incorrect station data...');
    const invalidResult = wrapper.validateStationData(invalidStation);
    console.log(`Validation result: ${invalidResult.isValid ? 'PASS' : 'FAIL'}`);
    console.log(`Errors found: ${invalidResult.errors.length}`);

    invalidResult.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.type}: ${error.message}`);
    });

    console.log('✅ Runtime type validation demonstrated');

  } catch (error) {
    console.error('❌ Runtime validation demo failed:', error);
  }
}

/**
 * Demonstrate advanced generic patterns
 */
async function demonstrateGenericPatterns(wrapper: TypeSafeFarertWrapper): Promise<void> {
  console.log('\n🧬 === Advanced Generic Patterns Demo ===');

  try {
    // Batch station lookups with type preservation
    const stationNames = ['東京', '横浜', '大阪', 'NonExistent'];

    console.log('🔄 Running batch station lookups...');

    const batchResult = await wrapper.batchOperation(
      stationNames,
      async (name: string): Promise<Station | null> => {
        return await wrapper.lookupStation(name, true);
      },
      {
        concurrency: 2,
        failFast: false,
        validateResults: (result: Station | null): boolean => {
          return result === null || isStation(result);
        }
      }
    );

    console.log(`✅ Batch operation completed:`);
    console.log(`  Successful lookups: ${batchResult.successCount}`);
    console.log(`  Failed lookups: ${batchResult.failureCount}`);
    console.log(`  Execution time: ${batchResult.executionTime.toFixed(2)}ms`);

    // Display successful results
    const validStations = batchResult.results.filter((s): s is Station => s !== null);
    validStations.forEach(station => {
      console.log(`  Found: ${station.name} (ID: ${station.id})`);
    });

    // Display errors
    if (batchResult.errors.length > 0) {
      console.log('  Errors:');
      batchResult.errors.forEach(({ item, error }) => {
        console.log(`    ${item}: ${error.message}`);
      });
    }

    console.log('✅ Generic patterns demonstrated');

  } catch (error) {
    console.error('❌ Generic patterns demo failed:', error);
  }
}

/**
 * Demonstrate type-safe route building
 */
async function demonstrateTypeSafeRouteBuilding(wrapper: TypeSafeFarertWrapper): Promise<void> {
  console.log('\n🛤️ === Type-Safe Route Building Demo ===');

  let builder: TypeSafeRouteBuilder | null = null;

  try {
    console.log('🏗️ Building route with fluent interface...');

    // Create type-safe route builder
    builder = wrapper.createRouteBuilder({
      enableLongRoute: false,
      startAsCity: false,
      arriveAsCity: false,
      optimizeFor: 'cost'
    });

    // Build route with method chaining (all type-checked)
    const fareInfo = await builder
      .startFrom('東京')        // Type-safe station setting
      .via('東海道線', '横浜')    // Type-safe line/station combination
      .calculateFare();         // Type-safe fare calculation

    console.log(`✅ Route built successfully:`);
    console.log(`  Total fare: ¥${fareInfo.fare}`);
    console.log(`  Rule 114 applied: ${fareInfo.isRule114Applied ? 'Yes' : 'No'}`);
    console.log(`  Transfers: ${fareInfo.transferCount}`);

    // Get route details
    const route = builder.getRoute();
    console.log(`  Route segments: ${route.length}`);

    route.forEach((segment, index) => {
      const prefix = segment.flags?.isStart ? '🚩' : segment.isTransfer ? '🔄' : '📍';
      const line = segment.lineName ? ` via ${segment.lineName}` : '';
      console.log(`    ${index + 1}. ${prefix} ${segment.stationName}${line}`);
    });

    // Validate route
    const validation = builder.validate();
    console.log(`📋 Route validation: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`   Overall score: ${validation.report.summary.overallScore}/100`);

    if (validation.errors.length > 0) {
      console.log('   Errors:');
      validation.errors.forEach(error => {
        console.log(`     - ${error.message}`);
      });
    }

    if (validation.warnings.length > 0) {
      console.log('   Warnings:');
      validation.warnings.forEach(warning => {
        console.log(`     - ${warning.message}`);
      });
    }

    console.log('✅ Type-safe route building demonstrated');

  } catch (error) {
    console.error('❌ Route building demo failed:', error);

    // TypeScript ensures we handle the right error types
    if (error instanceof TypeError) {
      console.error('🔧 Type error - check parameter types');
    } else if (error instanceof Error) {
      console.error('⚠️ Runtime error:', error.message);
    }
  } finally {
    // Proper cleanup with null checking
    if (builder) {
      builder.dispose();
    }
  }
}

// === Main Demo Function ===

/**
 * Main demonstration orchestrator
 */
export async function runTypeSafetyDemo(): Promise<void> {
  console.log('🎯 Farert TypeScript Type Safety Demo');
  console.log('====================================\n');

  try {
    // Initialize module - this would be provided in real usage
    console.log('⚠️ Note: This demo requires a FarertModule instance');
    console.log('In a real application, initialize the module first:\n');
    console.log('```typescript');
    console.log('const module = await initializeFarertModule();');
    console.log('const wrapper = new TypeSafeFarertWrapper(module);');
    console.log('await runAllDemos(wrapper);');
    console.log('```\n');

    console.log('📝 This demo showcases TypeScript patterns that would be used with a real module.');

    // Create mock demos for documentation purposes
    await demonstrateMockTypeSafety();

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

/**
 * Mock demonstrations for documentation purposes
 */
async function demonstrateMockTypeSafety(): Promise<void> {
  console.log('🎭 === Mock Type Safety Demonstrations ===\n');

  console.log('✅ Compile-time type checking:');
  console.log('  - Generic return types based on parameters');
  console.log('  - Method chaining with type preservation');
  console.log('  - Union type handling and type narrowing');
  console.log('  - Parameter validation at compile time\n');

  console.log('✅ Runtime type validation:');
  console.log('  - Type guards for WebAssembly objects');
  console.log('  - Data structure validation');
  console.log('  - Input sanitization and bounds checking');
  console.log('  - Error accumulation and reporting\n');

  console.log('✅ Advanced TypeScript features:');
  console.log('  - Conditional types for flexible APIs');
  console.log('  - Generic constraints and type parameters');
  console.log('  - Builder pattern with type state');
  console.log('  - Mapped types and utility types\n');

  console.log('✅ Error handling patterns:');
  console.log('  - Typed exceptions with error codes');
  console.log('  - Result types with success/failure states');
  console.log('  - Validation result accumulation');
  console.log('  - Recovery and fallback strategies\n');

  console.log('🎓 Type safety benefits demonstrated:');
  console.log('  - Prevents runtime errors through compile-time checking');
  console.log('  - Provides excellent IntelliSense and autocomplete');
  console.log('  - Enables refactoring with confidence');
  console.log('  - Documents API contracts in the type system');
  console.log('  - Improves code maintainability and reliability');
}

// === Exports ===

export {
  TypeSafeFarertWrapper,
  TypeSafeRouteBuilder,
  demonstrateCompileTimeSafety,
  demonstrateRuntimeValidation,
  demonstrateGenericPatterns,
  demonstrateTypeSafeRouteBuilding,
  runTypeSafetyDemo
};

// Run demo if executed directly
if (require.main === module) {
  runTypeSafetyDemo().catch(error => {
    console.error('Demo execution failed:', error);
    process.exit(1);
  });
}