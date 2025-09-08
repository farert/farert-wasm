/**
 * Android Compatibility Validation Layer
 * Task 22: Create Android compatibility validation in src/cli/android_compat.ts
 * 
 * This module provides comprehensive Android compatibility validation ensuring
 * data structures and method signatures are compatible between the TypeScript
 * WebAssembly implementation and the Android Kotlin implementation.
 * 
 * Requirements: REQ-OBJ-005 (Cross-platform compatibility)
 * Reference: Android FareInfo.kt and RouteHelper.kt
 * 
 * @fileoverview Android compatibility layer for seamless cross-platform development
 * @version 1.0.0
 * @author Claude Code (claude.ai/code)
 */

import { FareInfoData } from './types';

// ===============================
// Android FareInfo.kt Compatible Interface
// ===============================

/**
 * Android FareInfo compatible interface matching the structure
 * from `/farert/app/Farert.android/app/src/main/java/org/sutezo/alps/FareInfo.kt`
 * 
 * This interface ensures 100% compatibility with Android Kotlin implementation
 * for seamless data exchange between platforms.
 */
export interface AndroidFareInfo {
  // === Core Fare Information ===
  /** Calculation result code (0 = success, negative = error) */
  result: number;
  
  /** Indicates if calculation involved company boundary rules */
  isResultCompanyBeginEnd: boolean;
  
  /** Indicates if route passes through multiple companies */
  isResultCompanyMultipassed: boolean;
  
  /** Starting station ID */
  beginStationId: number;
  
  /** Ending station ID */
  endStationId: number;
  
  /** True if departure is from city area */
  isBeginInCity: boolean;
  
  /** True if arrival is to city area */
  isEndInCity: boolean;
  
  // === Discount Information ===
  /** Number of available stock discount options (0-2) */
  availCountForFareOfStockDiscount: number;
  
  /** Stock discount fare amounts [normal1, normal2, rule114_1, rule114_2] */
  fareForStockDiscounts: number[];
  
  /** Stock discount titles ["title1", "title2"] */
  fareForStockDiscountNames: string[];
  
  // === Rule 114 Information ===
  /** Sales kilometers under Rule 114 */
  rule114_salesKm: number;
  
  /** Calculation kilometers under Rule 114 */
  rule114_calcKm: number;
  
  /** True if Rule 114 (city area special rule) is applied */
  isRule114Applied: boolean;
  
  // === Distance and Calculation Details ===
  /** True if specific fare table is used */
  isSpecificFare: boolean;
  
  /** Total sales kilometers */
  totalSalesKm: number;
  
  /** JR calculation kilometers */
  jrCalcKm: number;
  
  /** JR sales kilometers */
  jrSalesKm: number;
  
  /** Company line sales kilometers */
  companySalesKm: number;
  
  // === Regional Distance Information ===
  /** Sales kilometers within Hokkaido */
  salesKmForHokkaido: number;
  
  /** Calculation kilometers for Hokkaido */
  calcKmForHokkaido: number;
  
  /** BRT (Bus Rapid Transit) sales kilometers */
  brtSalesKm: number;
  
  /** Sales kilometers within Shikoku */
  salesKmForShikoku: number;
  
  /** Calculation kilometers for Shikoku */
  calcKmForShikoku: number;
  
  /** Sales kilometers within Kyushu */
  salesKmForKyusyu: number;
  
  /** Calculation kilometers for Kyushu */
  calcKmForKyusyu: number;
  
  // === Fare Information ===
  /** True if route qualifies for round trip */
  isRoundtrip: boolean;
  
  /** True if round trip discount is applied */
  isRoundtripDiscount: boolean;
  
  /** Company line fare amount */
  fareForCompanyline: number;
  
  /** Base fare amount (in yen) */
  fare: number;
  
  /** BRT fare amount */
  fareForBRT: number;
  
  /** True if BRT discount is applied */
  isBRTdiscount: boolean;
  
  /** IC card fare (typically 1 yen less than cash fare) */
  fareForIC: number;
  
  /** Child fare (half of adult fare, rounded up) */
  childFare: number;
  
  /** Academic discount fare (20% discount for students) */
  academicFare: number;
  
  /** Ticket validity period in days */
  ticketAvailDays: number;
  
  // === Route Information ===
  /** Human-readable route description */
  routeList: string;
  
  /** TOICA-compatible route description */
  routeListForTOICA: string;
  
  // === Special Rule Flags ===
  /** True if Meihan city start terminal rule is enabled */
  isMeihanCityStartTerminalEnable: boolean;
  
  /** True if route starts from Meihan city area */
  isMeihanCityStart: boolean;
  
  /** True if route ends at Meihan city terminal */
  isMeihanCityTerminal: boolean;
  
  /** True if long route calculation is enabled */
  isEnableLongRoute: boolean;
  
  /** True if route qualifies as long route */
  isLongRoute: boolean;
  
  /** True if Rule 115 specific terminal is applied */
  isRule115specificTerm: boolean;
  
  /** True if Rule 115 is enabled */
  isEnableRule115: boolean;
  
  // === Error Handling (Enhanced in TypeScript version) ===
  /** Error code (0 = success, negative = error) */
  errorCode?: number;
  
  /** English error message for developers */
  errorMessage?: string;
  
  /** Japanese error message for end users */
  errorMessageJa?: string;
  
  /** Suggested station names for correction */
  suggestedStations?: string[];
}

/**
 * Android RouteHelper.kt compatible interface providing utility methods
 * for station, line, and route operations. Excludes persistence methods
 * as specified in CLAUDE.md (saveParam, readParam, etc.)
 * 
 * Reference: `/farert/app/Farert.android/app/src/main/java/org/sutezo/alps/RouteHelper.kt`
 */
export interface AndroidRouteHelper {
  // === Core Station Operations ===
  /** Get station ID from Japanese station name */
  getStationId(stationName: string): number;
  
  /** Get station name from station ID */
  stationName(stationId: number): string;
  
  /** Get extended station name with prefecture info for disambiguation */
  stationNameEx(stationId: number): string;
  
  /** Get station reading in hiragana */
  getKanaFromStationId(stationId: number): string;
  
  // === Line Operations ===
  /** Get line name from line ID */
  lineName(lineId: number): string;
  
  /** Get all line IDs serving a specific station */
  enumLineOfStationId(stationId: number): number[];
  
  /** Get all station IDs on a specific line */
  stationsIdsOfLineId(lineId: number): number[];
  
  /** Get junction station IDs for a line at a specific station */
  junctionIdsOfLineId(lineId: number, stationId: number): number[];
  
  // === Company and Prefecture Operations ===
  /** Get all JR company IDs (company ID < 0x10000) */
  getJRCompanys(): number[];
  
  /** Get all prefecture IDs (ID >= 0x10000) */
  getPrefects(): number[];
  
  /** Get company or prefecture name from ID */
  companyOrPrefectName(companyOrPrefectId: number): string;
  
  /** Get line IDs belonging to a company or prefecture */
  linesCompanyOrPrefectId(companyOrPrefectId: number): number[];
  
  // === Station Classification ===
  /** Check if station is a junction (connecting multiple lines) */
  isJunction(stationId: number): boolean;
  
  /** Check if station is a specific junction for a line */
  isSpecificJunction(lineId: number, stationId: number): boolean;
  
  /** Get terminal station name (for city area rules) */
  terminalName(stationId: number): string;
  
  // === Route Script Generation ===
  /** Generate human-readable route description */
  routeScript(): string;
}

// ===============================
// Data Serialization Compatibility
// ===============================

/**
 * Serialization format compatibility validator ensuring data can be
 * exchanged between TypeScript and Android Kotlin implementations
 */
export class AndroidSerializationCompat {
  /**
   * Convert TypeScript FareInfoData to Android-compatible format
   * 
   * @param fareInfo TypeScript FareInfoData object
   * @returns Android-compatible FareInfo object
   */
  static toAndroidFareInfo(fareInfo: FareInfoData): AndroidFareInfo {
    // Ensure stock discount arrays are properly formatted
    const stockDiscounts = new Array(4).fill(0);
    const stockTitles = new Array(2).fill('');
    
    // Copy basic properties with type safety
    const androidFareInfo: AndroidFareInfo = {
      // Core fare information
      result: fareInfo.result || -1,
      isResultCompanyBeginEnd: Boolean(fareInfo.isResultCompanyBeginEnd),
      isResultCompanyMultipassed: Boolean(fareInfo.isResultCompanyMultipassed),
      beginStationId: Number(fareInfo.beginStationId) || 0,
      endStationId: Number(fareInfo.endStationId) || 0,
      isBeginInCity: Boolean(fareInfo.isBeginInCity),
      isEndInCity: Boolean(fareInfo.isEndInCity),
      
      // Discount information
      availCountForFareOfStockDiscount: Number(fareInfo.availCountForFareOfStockDiscount) || 0,
      fareForStockDiscounts: stockDiscounts,
      fareForStockDiscountNames: stockTitles,
      
      // Rule 114 information
      rule114_salesKm: Number(fareInfo.rule114_salesKm) || 0,
      rule114_calcKm: Number(fareInfo.rule114_calcKm) || 0,
      isRule114Applied: Boolean(fareInfo.isRule114Applied),
      
      // Distance and calculation details
      isSpecificFare: Boolean(fareInfo.isSpecificFare),
      totalSalesKm: Number(fareInfo.totalSalesKm) || 0,
      jrCalcKm: Number(fareInfo.jrCalcKm) || 0,
      jrSalesKm: Number(fareInfo.jrSalesKm) || 0,
      companySalesKm: Number(fareInfo.companySalesKm) || 0,
      
      // Regional information
      salesKmForHokkaido: Number(fareInfo.salesKmForHokkaido) || 0,
      calcKmForHokkaido: Number(fareInfo.calcKmForHokkaido) || 0,
      brtSalesKm: Number(fareInfo.brtSalesKm) || 0,
      salesKmForShikoku: Number(fareInfo.salesKmForShikoku) || 0,
      calcKmForShikoku: Number(fareInfo.calcKmForShikoku) || 0,
      salesKmForKyusyu: Number(fareInfo.salesKmForKyusyu) || 0,
      calcKmForKyusyu: Number(fareInfo.calcKmForKyusyu) || 0,
      
      // Fare information
      isRoundtrip: Boolean(fareInfo.isRoundtrip),
      isRoundtripDiscount: Boolean(fareInfo.isRoundtripDiscount),
      fareForCompanyline: Number(fareInfo.fareForCompanyline) || 0,
      fare: Number(fareInfo.fare) || 0,
      fareForBRT: Number(fareInfo.fareForBRT) || 0,
      isBRTdiscount: Boolean(fareInfo.isBRTdiscount),
      fareForIC: Number(fareInfo.fareForIC) || 0,
      childFare: Number(fareInfo.childFare) || 0,
      academicFare: Number(fareInfo.academicFare) || 0,
      ticketAvailDays: Number(fareInfo.ticketAvailDays) || 0,
      
      // Route information
      routeList: String(fareInfo.routeList || ''),
      routeListForTOICA: String(fareInfo.routeListForTOICA || ''),
      
      // Special rule flags
      isMeihanCityStartTerminalEnable: Boolean(fareInfo.isMeihanCityStartTerminalEnable),
      isMeihanCityStart: Boolean(fareInfo.isMeihanCityStart),
      isMeihanCityTerminal: Boolean(fareInfo.isMeihanCityTerminal),
      isEnableLongRoute: Boolean(fareInfo.isEnableLongRoute),
      isLongRoute: Boolean(fareInfo.isLongRoute),
      isRule115specificTerm: Boolean(fareInfo.isRule115specificTerm),
      isEnableRule115: Boolean(fareInfo.isEnableRule115),
      
      // Error handling
      errorCode: Number(fareInfo.errorCode) || 0,
      errorMessage: String(fareInfo.errorMessage || ''),
      errorMessageJa: String(fareInfo.errorMessageJa || ''),
      suggestedStations: Array.isArray(fareInfo.suggestedStations) ? fareInfo.suggestedStations : []
    };
    
    // Handle stock discount data with proper array initialization
    if (typeof fareInfo === 'object' && fareInfo !== null) {
      // Extract stock discount data using property access or method calls
      const availCount = androidFareInfo.availCountForFareOfStockDiscount;
      
      // Copy stock discount fares (support both array and method access)
      for (let i = 0; i < 4; i++) {
        if (typeof fareInfo.fareForStockDiscount === 'function') {
          androidFareInfo.fareForStockDiscounts[i] = fareInfo.fareForStockDiscount(i) || 0;
        } else if (Array.isArray((fareInfo as any).fareForStockDiscounts)) {
          androidFareInfo.fareForStockDiscounts[i] = (fareInfo as any).fareForStockDiscounts[i] || 0;
        }
      }
      
      // Copy stock discount titles (support both array and method access)
      for (let i = 0; i < 2; i++) {
        if (typeof fareInfo.fareForStockDiscountTitle === 'function') {
          androidFareInfo.fareForStockDiscountNames[i] = fareInfo.fareForStockDiscountTitle(i) || '';
        } else if (Array.isArray((fareInfo as any).fareForStockDiscountNames)) {
          androidFareInfo.fareForStockDiscountNames[i] = (fareInfo as any).fareForStockDiscountNames[i] || '';
        }
      }
    }
    
    return androidFareInfo;
  }
  
  /**
   * Convert Android-compatible FareInfo to TypeScript format
   * 
   * @param androidFareInfo Android-compatible FareInfo object
   * @returns TypeScript FareInfoData object
   */
  static fromAndroidFareInfo(androidFareInfo: AndroidFareInfo): FareInfoData {
    const tsObject: FareInfoData = {
      // Map all properties from Android format to TypeScript format
      result: androidFareInfo.result,
      fare: androidFareInfo.fare,
      isRule114Applied: androidFareInfo.isRule114Applied,
      availCountForFareOfStockDiscount: androidFareInfo.availCountForFareOfStockDiscount,
      beginStationId: androidFareInfo.beginStationId,
      endStationId: androidFareInfo.endStationId,
      routeList: androidFareInfo.routeList,
      
      // Include additional properties as needed
      isResultCompanyBeginEnd: androidFareInfo.isResultCompanyBeginEnd,
      isResultCompanyMultipassed: androidFareInfo.isResultCompanyMultipassed,
      isBeginInCity: androidFareInfo.isBeginInCity,
      isEndInCity: androidFareInfo.isEndInCity,
      rule114_salesKm: androidFareInfo.rule114_salesKm,
      rule114_calcKm: androidFareInfo.rule114_calcKm,
      isSpecificFare: androidFareInfo.isSpecificFare,
      totalSalesKm: androidFareInfo.totalSalesKm,
      jrCalcKm: androidFareInfo.jrCalcKm,
      jrSalesKm: androidFareInfo.jrSalesKm,
      companySalesKm: androidFareInfo.companySalesKm,
      salesKmForHokkaido: androidFareInfo.salesKmForHokkaido,
      calcKmForHokkaido: androidFareInfo.calcKmForHokkaido,
      brtSalesKm: androidFareInfo.brtSalesKm,
      salesKmForShikoku: androidFareInfo.salesKmForShikoku,
      calcKmForShikoku: androidFareInfo.calcKmForShikoku,
      salesKmForKyusyu: androidFareInfo.salesKmForKyusyu,
      calcKmForKyusyu: androidFareInfo.calcKmForKyusyu,
      isRoundtrip: androidFareInfo.isRoundtrip,
      isRoundtripDiscount: androidFareInfo.isRoundtripDiscount,
      fareForCompanyline: androidFareInfo.fareForCompanyline,
      fareForBRT: androidFareInfo.fareForBRT,
      isBRTdiscount: androidFareInfo.isBRTdiscount,
      fareForIC: androidFareInfo.fareForIC,
      childFare: androidFareInfo.childFare,
      academicFare: androidFareInfo.academicFare,
      ticketAvailDays: androidFareInfo.ticketAvailDays,
      routeListForTOICA: androidFareInfo.routeListForTOICA,
      isMeihanCityStartTerminalEnable: androidFareInfo.isMeihanCityStartTerminalEnable,
      isMeihanCityStart: androidFareInfo.isMeihanCityStart,
      isMeihanCityTerminal: androidFareInfo.isMeihanCityTerminal,
      isEnableLongRoute: androidFareInfo.isEnableLongRoute,
      isLongRoute: androidFareInfo.isLongRoute,
      isRule115specificTerm: androidFareInfo.isRule115specificTerm,
      isEnableRule115: androidFareInfo.isEnableRule115,
      
      // Add any additional properties from the base interface
      ...({} as any) // Allow additional properties
    };
    
    // Add stock discount method compatibility if needed
    (tsObject as any).fareForStockDiscount = (index: number) => {
      return androidFareInfo.fareForStockDiscounts[index] || 0;
    };
    
    (tsObject as any).fareForStockDiscountTitle = (index: number) => {
      return androidFareInfo.fareForStockDiscountNames[index] || '';
    };
    
    return tsObject;
  }
  
  /**
   * Validate serialization compatibility between formats
   * 
   * @param original Original FareInfoData object
   * @param converted Converted object after round-trip serialization
   * @returns Validation result with detailed comparison
   */
  static validateSerializationCompatibility(
    original: FareInfoData, 
    converted: FareInfoData
  ): AndroidCompatibilityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Core fare validation
    if (original.fare !== converted.fare) {
      errors.push(`Fare mismatch: original=${original.fare}, converted=${converted.fare}`);
    }
    
    if (original.result !== converted.result) {
      errors.push(`Result code mismatch: original=${original.result}, converted=${converted.result}`);
    }
    
    // Station ID validation
    if (original.beginStationId !== converted.beginStationId) {
      errors.push(`Begin station ID mismatch: original=${original.beginStationId}, converted=${converted.beginStationId}`);
    }
    
    if (original.endStationId !== converted.endStationId) {
      errors.push(`End station ID mismatch: original=${original.endStationId}, converted=${converted.endStationId}`);
    }
    
    // Boolean flag validation
    const booleanFlags = [
      'isRule114Applied', 'isBeginInCity', 'isEndInCity', 'isSpecificFare',
      'isRoundtrip', 'isRoundtripDiscount', 'isBRTdiscount', 'isEnableLongRoute',
      'isLongRoute', 'isRule115specificTerm', 'isEnableRule115'
    ];
    
    for (const flag of booleanFlags) {
      const origVal = (original as any)[flag];
      const convVal = (converted as any)[flag];
      if (Boolean(origVal) !== Boolean(convVal)) {
        warnings.push(`Boolean flag ${flag} mismatch: original=${origVal}, converted=${convVal}`);
      }
    }
    
    // Distance validation
    const distanceFields = [
      'totalSalesKm', 'jrCalcKm', 'jrSalesKm', 'companySalesKm',
      'salesKmForHokkaido', 'calcKmForHokkaido', 'brtSalesKm',
      'salesKmForShikoku', 'calcKmForShikoku', 'salesKmForKyusyu', 'calcKmForKyusyu'
    ];
    
    for (const field of distanceFields) {
      const origVal = (original as any)[field] || 0;
      const convVal = (converted as any)[field] || 0;
      if (origVal !== convVal) {
        warnings.push(`Distance field ${field} mismatch: original=${origVal}, converted=${convVal}`);
      }
    }
    
    // Route information validation
    if (original.routeList !== converted.routeList) {
      warnings.push(`Route list mismatch: lengths original=${original.routeList?.length}, converted=${converted.routeList?.length}`);
    }
    
    return {
      isCompatible: errors.length === 0,
      errors,
      warnings,
      summary: errors.length === 0 
        ? `Serialization compatible with ${warnings.length} warnings`
        : `Serialization incompatible: ${errors.length} errors, ${warnings.length} warnings`
    };
  }
}

// ===============================
// Android Method Compatibility Layer
// ===============================

/**
 * RouteHelper compatibility layer providing Android Kotlin compatible methods
 * Based on Android RouteHelper.kt methods, excluding persistence operations
 * as specified in CLAUDE.md
 */
export class AndroidRouteHelperCompat implements AndroidRouteHelper {
  // Note: This class provides the interface specification.
  // Actual implementation will delegate to existing WebAssembly functions
  // when integrated with the main farert WebAssembly module.
  
  /**
   * Get station ID from Japanese station name
   * Compatible with Android RouteHelper.getStationId()
   */
  getStationId(stationName: string): number {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get station name from station ID
   * Compatible with Android RouteHelper.stationName()
   */
  stationName(stationId: number): string {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get extended station name with disambiguation info
   * Compatible with Android RouteHelper.stationNameEx()
   */
  stationNameEx(stationId: number): string {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get station reading in hiragana
   * Compatible with Android RouteHelper.getKanaFromStationId()
   */
  getKanaFromStationId(stationId: number): string {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get line name from line ID
   * Compatible with Android RouteHelper.lineName()
   */
  lineName(lineId: number): string {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get all line IDs serving a specific station
   * Compatible with Android RouteHelper.enumLineOfStationId()
   */
  enumLineOfStationId(stationId: number): number[] {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get all station IDs on a specific line
   * Compatible with Android RouteHelper.stationsIdsOfLineId()
   */
  stationsIdsOfLineId(lineId: number): number[] {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get junction station IDs for a line at a specific station
   * Compatible with Android RouteHelper.junctionIdsOfLineId()
   */
  junctionIdsOfLineId(lineId: number, stationId: number): number[] {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get all JR company IDs
   * Compatible with Android RouteHelper.getJRCompanys()
   */
  getJRCompanys(): number[] {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get all prefecture IDs
   * Compatible with Android RouteHelper.getPrefects()
   */
  getPrefects(): number[] {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get company or prefecture name from ID
   * Compatible with Android RouteHelper.companyOrPrefectName()
   */
  companyOrPrefectName(companyOrPrefectId: number): string {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get line IDs belonging to a company or prefecture
   * Compatible with Android RouteHelper.linesCompanyOrPrefectId()
   */
  linesCompanyOrPrefectId(companyOrPrefectId: number): number[] {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Check if station is a junction
   * Compatible with Android RouteHelper.isJunction()
   */
  isJunction(stationId: number): boolean {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Check if station is a specific junction for a line
   * Compatible with Android RouteHelper.isSpecificJunction()
   */
  isSpecificJunction(lineId: number, stationId: number): boolean {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Get terminal station name
   * Compatible with Android RouteHelper.terminalName()
   */
  terminalName(stationId: number): string {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
  
  /**
   * Generate human-readable route description
   * Compatible with Android RouteHelper.routeScript()
   */
  routeScript(): string {
    // Implementation will be provided by WebAssembly module integration
    throw new Error('Method must be implemented by WebAssembly module integration');
  }
}

// ===============================
// Data Serialization Compatibility Tests
// ===============================

/**
 * Result interface for Android compatibility validation
 */
export interface AndroidCompatibilityValidationResult {
  /** True if data structures are fully compatible */
  isCompatible: boolean;
  
  /** Array of critical compatibility errors */
  errors: string[];
  
  /** Array of compatibility warnings (non-critical) */
  warnings: string[];
  
  /** Summary of validation results */
  summary: string;
}

/**
 * Comprehensive Android compatibility validation test suite
 * Ensures data structures can be exchanged between platforms
 */
export class AndroidCompatibilityValidator {
  /**
   * Validate FareInfo structure compatibility with Android
   * 
   * @param fareInfo FareInfo object to validate
   * @returns Detailed validation result
   */
  static validateFareInfoCompatibility(fareInfo: FareInfoData): AndroidCompatibilityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required field validation
    const requiredFields = [
      'result', 'fare', 'beginStationId', 'endStationId', 
      'availCountForFareOfStockDiscount', 'isRule114Applied'
    ];
    
    for (const field of requiredFields) {
      if (!(field in fareInfo) || (fareInfo as any)[field] === undefined) {
        errors.push(`Required field '${field}' is missing or undefined`);
      }
    }
    
    // Type validation
    if (typeof fareInfo.fare !== 'number') {
      errors.push(`Fare must be a number, got ${typeof fareInfo.fare}`);
    }
    
    if (typeof fareInfo.result !== 'number') {
      errors.push(`Result must be a number, got ${typeof fareInfo.result}`);
    }
    
    if (typeof fareInfo.isRule114Applied !== 'boolean') {
      warnings.push(`isRule114Applied should be boolean, got ${typeof fareInfo.isRule114Applied}`);
    }
    
    // Range validation
    if (fareInfo.fare < 0) {
      warnings.push(`Fare is negative: ${fareInfo.fare}`);
    }
    
    if (fareInfo.beginStationId <= 0) {
      errors.push(`Invalid begin station ID: ${fareInfo.beginStationId}`);
    }
    
    if (fareInfo.endStationId <= 0) {
      errors.push(`Invalid end station ID: ${fareInfo.endStationId}`);
    }
    
    // Stock discount validation
    const discountCount = fareInfo.availCountForFareOfStockDiscount;
    if (discountCount < 0 || discountCount > 2) {
      warnings.push(`Stock discount count out of range: ${discountCount} (expected 0-2)`);
    }
    
    // Distance field validation
    const distanceFields = ['totalSalesKm', 'jrCalcKm', 'jrSalesKm'];
    for (const field of distanceFields) {
      const value = (fareInfo as any)[field];
      if (value !== undefined && (typeof value !== 'number' || value < 0)) {
        warnings.push(`Distance field ${field} invalid: ${value}`);
      }
    }
    
    return {
      isCompatible: errors.length === 0,
      errors,
      warnings,
      summary: errors.length === 0 
        ? `FareInfo compatible with ${warnings.length} warnings`
        : `FareInfo incompatible: ${errors.length} errors, ${warnings.length} warnings`
    };
  }
  
  /**
   * Test serialization round-trip compatibility
   * 
   * @param originalFareInfo Original FareInfo object
   * @returns Round-trip validation result
   */
  static testSerializationRoundTrip(originalFareInfo: FareInfoData): AndroidCompatibilityValidationResult {
    try {
      // Convert to Android format
      const androidFormat = AndroidSerializationCompat.toAndroidFareInfo(originalFareInfo);
      
      // Convert back to TypeScript format
      const backToTs = AndroidSerializationCompat.fromAndroidFareInfo(androidFormat);
      
      // Validate compatibility
      return AndroidSerializationCompat.validateSerializationCompatibility(originalFareInfo, backToTs);
      
    } catch (error) {
      return {
        isCompatible: false,
        errors: [`Serialization failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        summary: 'Serialization round-trip test failed'
      };
    }
  }
  
  /**
   * Validate method signature compatibility with Android RouteHelper
   * 
   * @param helperInstance AndroidRouteHelper implementation
   * @returns Method compatibility validation result
   */
  static validateMethodCompatibility(helperInstance: AndroidRouteHelper): AndroidCompatibilityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required method validation
    const requiredMethods = [
      'getStationId', 'stationName', 'stationNameEx', 'getKanaFromStationId',
      'lineName', 'enumLineOfStationId', 'stationsIdsOfLineId', 'junctionIdsOfLineId',
      'getJRCompanys', 'getPrefects', 'companyOrPrefectName', 'linesCompanyOrPrefectId',
      'isJunction', 'isSpecificJunction', 'terminalName', 'routeScript'
    ];
    
    for (const method of requiredMethods) {
      if (typeof (helperInstance as any)[method] !== 'function') {
        errors.push(`Required method '${method}' is missing or not a function`);
      }
    }
    
    // Method signature validation (basic checks)
    try {
      // Test parameter counts by checking function length property
      const getStationId = helperInstance.getStationId;
      if (getStationId.length !== 1) {
        warnings.push(`getStationId expects 1 parameter, signature indicates ${getStationId.length}`);
      }
      
      const enumLineOfStationId = helperInstance.enumLineOfStationId;
      if (enumLineOfStationId.length !== 1) {
        warnings.push(`enumLineOfStationId expects 1 parameter, signature indicates ${enumLineOfStationId.length}`);
      }
      
      const junctionIdsOfLineId = helperInstance.junctionIdsOfLineId;
      if (junctionIdsOfLineId.length !== 2) {
        warnings.push(`junctionIdsOfLineId expects 2 parameters, signature indicates ${junctionIdsOfLineId.length}`);
      }
      
    } catch (error) {
      warnings.push(`Method signature validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return {
      isCompatible: errors.length === 0,
      errors,
      warnings,
      summary: errors.length === 0 
        ? `Method signatures compatible with ${warnings.length} warnings`
        : `Method signatures incompatible: ${errors.length} errors, ${warnings.length} warnings`
    };
  }
  
  /**
   * Run comprehensive Android compatibility validation suite
   * 
   * @param fareInfo FareInfo object to test
   * @param routeHelper RouteHelper implementation to test
   * @returns Comprehensive validation result
   */
  static runFullCompatibilityTest(
    fareInfo: FareInfoData,
    routeHelper?: AndroidRouteHelper
  ): AndroidCompatibilityValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    // Test FareInfo compatibility
    const fareInfoResult = this.validateFareInfoCompatibility(fareInfo);
    allErrors.push(...fareInfoResult.errors);
    allWarnings.push(...fareInfoResult.warnings);
    
    // Test serialization round-trip
    const serializationResult = this.testSerializationRoundTrip(fareInfo);
    allErrors.push(...serializationResult.errors);
    allWarnings.push(...serializationResult.warnings);
    
    // Test RouteHelper compatibility if provided
    if (routeHelper) {
      const methodResult = this.validateMethodCompatibility(routeHelper);
      allErrors.push(...methodResult.errors);
      allWarnings.push(...methodResult.warnings);
    }
    
    return {
      isCompatible: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      summary: allErrors.length === 0 
        ? `Full Android compatibility verified with ${allWarnings.length} warnings`
        : `Android compatibility issues found: ${allErrors.length} errors, ${allWarnings.length} warnings`
    };
  }
}

// ===============================
// Example Usage and Integration
// ===============================

/**
 * Example usage demonstrating Android compatibility validation
 */
export class AndroidCompatExample {
  /**
   * Demonstrate FareInfo compatibility validation
   */
  static exampleFareInfoValidation(): void {
    // Example FareInfo data
    const sampleFareInfo: FareInfoData = {
      result: 0,
      fare: 320,
      isRule114Applied: false,
      availCountForFareOfStockDiscount: 1,
      beginStationId: 1130101,  // 東京
      endStationId: 1130224,    // 横浜
      routeList: '東京 東海道線 横浜'
    };
    
    // Validate Android compatibility
    const validationResult = AndroidCompatibilityValidator.validateFareInfoCompatibility(sampleFareInfo);
    
    console.log('Android FareInfo Compatibility:', validationResult.summary);
    if (validationResult.errors.length > 0) {
      console.error('Errors:', validationResult.errors);
    }
    if (validationResult.warnings.length > 0) {
      console.warn('Warnings:', validationResult.warnings);
    }
  }
  
  /**
   * Demonstrate serialization compatibility testing
   */
  static exampleSerializationTest(): void {
    const originalFareInfo: FareInfoData = {
      result: 0,
      fare: 420,
      isRule114Applied: true,
      availCountForFareOfStockDiscount: 2,
      beginStationId: 1130101,
      endStationId: 2770001,
      routeList: '東京 東海道線 名古屋',
      childFare: 210,
      fareForIC: 419
    };
    
    // Test round-trip serialization
    const roundTripResult = AndroidCompatibilityValidator.testSerializationRoundTrip(originalFareInfo);
    
    console.log('Serialization Round-trip:', roundTripResult.summary);
    console.log('Compatibility:', roundTripResult.isCompatible ? 'PASS' : 'FAIL');
  }
  
  /**
   * Demonstrate full compatibility validation
   */
  static exampleFullValidation(): void {
    const testFareInfo: FareInfoData = {
      result: 0,
      fare: 680,
      isRule114Applied: false,
      availCountForFareOfStockDiscount: 0,
      beginStationId: 1130101,  // 東京
      endStationId: 4600101,    // 大阪
      routeList: '東京 東海道線 熱海 東海道線 大阪'
    };
    
    // Create mock RouteHelper for testing
    const mockHelper: AndroidRouteHelper = new AndroidRouteHelperCompat();
    
    try {
      // Run full compatibility test
      const fullResult = AndroidCompatibilityValidator.runFullCompatibilityTest(testFareInfo, mockHelper);
      
      console.log('=== Full Android Compatibility Test ===');
      console.log('Status:', fullResult.isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE');
      console.log('Summary:', fullResult.summary);
      
      if (fullResult.errors.length > 0) {
        console.log('\n❌ Critical Errors:');
        fullResult.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      if (fullResult.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        fullResult.warnings.forEach((warning, index) => {
          console.log(`  ${index + 1}. ${warning}`);
        });
      }
      
    } catch (error) {
      console.error('Full validation test failed:', error);
    }
  }
}

// ===============================
// Exports
// ===============================

// Export types and classes are already exported individually above
// Removing duplicate exports to fix TypeScript compilation conflicts