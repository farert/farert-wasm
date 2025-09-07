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
    formatName: (name: string, id?: number, options?: any) => import('./fare-utils').then(m => m.formatStationName(name, id, options))
  },
  
  route: {
    formatDescription: (routeList: string) => import('./fare-utils').then(m => m.formatRouteDescription(routeList)),
    validate: (routeString: string) => import('./fare-utils').then(m => m.validateRoute(routeString)),
    createBuilder: () => import('./fare-utils').then(m => m.createRouteBuilder())
  },
  
  validation: {
    formatErrors: (validation: any, locale?: 'ja' | 'en') => import('./fare-utils').then(m => m.formatValidationErrors(validation, locale))
  },
  
  distance: {
    formatKilometers: (km: number) => import('./fare-utils').then(m => m.formatKilometers(km))
  }
};