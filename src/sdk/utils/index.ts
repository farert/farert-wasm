/**
 * SDK Utilities Index
 * Framework-agnostic utilities for the Farert WebAssembly SDK
 * 
 * Provides comprehensive fare formatting, Japanese text handling,
 * and route validation utilities for use in any JavaScript framework
 * or vanilla JavaScript applications.
 */

// Export all fare formatting utilities
export {
  formatFare,
  formatFareSimple,
  formatFareBreakdown,
  formatStationName,
  formatRouteDescription,
  validateRoute,
  formatValidationErrors,
  createRouteBuilder,
  RouteBuilder,
  isFareReasonable,
  formatKilometers,
  compareFares,
  type LocaleOptions,
  type FareBreakdownOptions,
  type StationNameOptions,
  type RouteValidationResult,
  type RouteValidationError,
  type RouteValidationWarning,
  default as fareUtils
} from './fare-utils';

// Export all station utilities
export {
  formatStationName as formatStationNameAdvanced,
  formatStationWithPrefecture,
  formatStationWithKana,
  getStationDisplayName,
  fuzzySearchStations,
  searchStationsByReading,
  getStationSuggestions,
  filterStationsByPrefix,
  validateStationId,
  validateStationName,
  isJunctionStation,
  getStationLines,
  getStationMetadata,
  compareStations,
  groupStationsByPrefecture,
  getPopularStations,
  type StationFormatOptions,
  type EnhancedSearchOptions,
  type StationValidationResult,
  type StationValidationError,
  type StationMetadata,
  type StationComparison,
  type StationsByPrefecture,
  default as stationUtils
} from './station-utils';

// Export route building utilities
export {
  RouteBuilder,
  createRouteBuilder,
  validateRoute as validateRouteAdvanced,
  validateRouteConnection,
  validateRouteSegments,
  getRouteValidationErrors,
  suggestRouteCorrections,
  formatRoute as formatRouteAdvanced,
  formatRouteSegments,
  getRouteDescription,
  formatRouteWithLines,
  analyzeRoute,
  compareRoutes,
  optimizeRoute,
  calculateRouteMetrics,
  routeToString,
  routeFromString,
  routeToSegments,
  segmentsToRoute,
  type RouteBuilderOptions,
  type RouteValidationConfig,
  type RouteFormatOptions,
  type ConnectionValidationResult,
  type RouteSuggestion,
  type RouteOptimization,
  type RouteComparisonMetrics,
  default as routeUtils
} from './route-utils';

// Re-export types from CLI for convenience
export type { FareInfoData } from '../../cli/types';

/**
 * Utility collection for framework-agnostic operations
 */
export const utils = {
  fare: {
    format: (fare: number, options?: any) => import('./fare-utils').then(m => m.formatFare(fare, options)),
    formatSimple: (fare: number) => import('./fare-utils').then(m => m.formatFareSimple(fare)),
    formatBreakdown: (fareInfo: any, options?: any) => import('./fare-utils').then(m => m.formatFareBreakdown(fareInfo, options)),
    isReasonable: (fare: number) => import('./fare-utils').then(m => m.isFareReasonable(fare)),
    compare: (fare1: any, fare2: any, labels?: [string, string]) => import('./fare-utils').then(m => m.compareFares(fare1, fare2, labels))
  },
  
  station: {
    // Basic formatting (from fare-utils)
    formatName: (name: string, id?: number, options?: any) => import('./fare-utils').then(m => m.formatStationName(name, id, options)),
    
    // Advanced formatting (from station-utils)
    formatAdvanced: (station: any, options?: any) => import('./station-utils').then(m => m.formatStationName(station, options)),
    formatWithPrefecture: (station: any) => import('./station-utils').then(m => m.formatStationWithPrefecture(station)),
    formatWithKana: (station: any) => import('./station-utils').then(m => m.formatStationWithKana(station)),
    getDisplayName: (station: any, context?: string) => import('./station-utils').then(m => m.getStationDisplayName(station, context)),
    
    // Search and filtering
    fuzzySearch: (query: string, stations: any[], options?: any) => import('./station-utils').then(m => m.fuzzySearchStations(query, stations, options)),
    searchByReading: (reading: string, stations: any[], options?: any) => import('./station-utils').then(m => m.searchStationsByReading(reading, stations, options)),
    getSuggestions: (query: string, stations: any[], maxSuggestions?: number) => import('./station-utils').then(m => m.getStationSuggestions(query, stations, maxSuggestions)),
    filterByPrefix: (prefix: string, stations: any[], options?: any) => import('./station-utils').then(m => m.filterStationsByPrefix(prefix, stations, options)),
    
    // Validation
    validateId: (id: number) => import('./station-utils').then(m => m.validateStationId(id)),
    validateName: (name: string) => import('./station-utils').then(m => m.validateStationName(name)),
    isJunction: (station: any) => import('./station-utils').then(m => m.isJunctionStation(station)),
    getLines: (station: any, includeDetails?: boolean) => import('./station-utils').then(m => m.getStationLines(station, includeDetails)),
    
    // Information and organization
    getMetadata: (station: any) => import('./station-utils').then(m => m.getStationMetadata(station)),
    compare: (stationA: any, stationB: any, criteria?: string) => import('./station-utils').then(m => m.compareStations(stationA, stationB, criteria)),
    groupByPrefecture: (stations: any[]) => import('./station-utils').then(m => m.groupStationsByPrefecture(stations)),
    getPopular: (stations: any[], limit?: number) => import('./station-utils').then(m => m.getPopularStations(stations, limit))
  },
  
  route: {
    // Basic route utilities (from fare-utils)
    formatDescription: (routeList: string) => import('./fare-utils').then(m => m.formatRouteDescription(routeList)),
    validate: (routeString: string) => import('./fare-utils').then(m => m.validateRoute(routeString)),
    createBuilder: () => import('./fare-utils').then(m => m.createRouteBuilder()),
    
    // Advanced route utilities (from route-utils)
    formatRoute: (route: any, options?: any) => import('./route-utils').then(m => m.formatRoute(route, options)),
    formatSegments: (segments: any[], options?: any) => import('./route-utils').then(m => m.formatRouteSegments(segments, options)),
    getDescription: (route: any, options?: any) => import('./route-utils').then(m => m.getRouteDescription(route, options)),
    formatWithLines: (route: any, options?: any) => import('./route-utils').then(m => m.formatRouteWithLines(route, options)),
    
    // Route building and validation
    createAdvancedBuilder: (objectFactory?: any) => import('./route-utils').then(m => m.createRouteBuilder(objectFactory)),
    validateAdvanced: (route: any, config?: any) => import('./route-utils').then(m => m.validateRoute(route, config)),
    validateConnection: (fromStation: any, toStation: any) => import('./route-utils').then(m => m.validateRouteConnection(fromStation, toStation)),
    validateSegments: (segments: any[]) => import('./route-utils').then(m => m.validateRouteSegments(segments)),
    getValidationErrors: (route: any) => import('./route-utils').then(m => m.getRouteValidationErrors(route)),
    suggestCorrections: (route: any, errors: any[]) => import('./route-utils').then(m => m.suggestRouteCorrections(route, errors)),
    
    // Route analysis and optimization  
    analyze: (route: any) => import('./route-utils').then(m => m.analyzeRoute(route)),
    compare: (routes: any[]) => import('./route-utils').then(m => m.compareRoutes(routes)),
    optimize: (route: any, options?: any) => import('./route-utils').then(m => m.optimizeRoute(route, options)),
    calculateMetrics: (route: any) => import('./route-utils').then(m => m.calculateRouteMetrics(route)),
    
    // Route conversion utilities
    toString: (route: any) => import('./route-utils').then(m => m.routeToString(route)),
    fromString: (routeString: string) => import('./route-utils').then(m => m.routeFromString(routeString)),
    toSegments: (route: any) => import('./route-utils').then(m => m.routeToSegments(route)),
    segmentsToRoute: (segments: any[]) => import('./route-utils').then(m => m.segmentsToRoute(segments))
  },
  
  validation: {
    formatErrors: (validation: any, locale?: 'ja' | 'en') => import('./fare-utils').then(m => m.formatValidationErrors(validation, locale))
  },
  
  distance: {
    formatKilometers: (km: number) => import('./fare-utils').then(m => m.formatKilometers(km))
  }
};