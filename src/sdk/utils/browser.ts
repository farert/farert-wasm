/**
 * Farert SDK Utilities - Browser Entry Point
 * 
 * Minimal utilities build for browser environments.
 * Excludes Node.js dependencies and provides only essential functions.
 */

// Browser-compatible utilities only
export {
  // Station utilities (browser-safe)
  formatStationName,
  parseStationName,
  validateStationId,
  createStationValidator,
  
  // Route utilities (browser-safe)
  formatRoute,
  parseRoute,
  validateRoute,
  createRouteValidator,
  RouteBuilder,
  createRouteBuilder,
  
  // Fare utilities (all browser-safe)
  formatFare,
  formatDistance,
  formatTime,
  calculateDistance,
  calculateTravelTime,
  estimateTransferTime,
  
  // Framework detection (browser-safe)
  detectFramework,
  getFrameworkInfo,
  isFrameworkAvailable,
  
  // Line utilities (browser-safe)
  formatLineName,
  parseLineName,
  validateLineId,
  createLineValidator,
} from './index';

// Build information
export const SDK_VERSION = '1.0.0';
export const BUILD_TARGET = 'browser-utils';
export const BUILD_DATE = new Date().toISOString();