/**
 * Farert SDK Browser Entry Point
 * 
 * Browser-compatible build that excludes Node.js-specific dependencies
 * and CLI components. Optimized for frontend frameworks and web applications.
 */

// Core SDK components (browser-compatible)
export * from './core/farert-sdk';
export * from './core/object-classes';
export * from './core/wasm-wrapper';
export * from './core/lazy-loader';
export * from './core/memory-manager';

// Caching system
export * from './cache';

// Security and validation
export * from './security';

// Utilities (browser-compatible only)
export {
  createStationValidator,
  createLineValidator,
  createRouteValidator,
  formatFare,
  formatDistance,
  formatTime,
  calculateDistance,
  calculateTravelTime,
  estimateTransferTime,
  RouteBuilder,
  createRouteBuilder,
} from './utils';

// Error management
export * from './errors';

// Types
export * from './types';

// Framework adapters
export * from './svelte';
export * from './react';
export * from './vue';

// SvelteKit utilities
export * from './sveltekit';

// Debug tools (development only)
export * from './debug';

// Build information
export const SDK_VERSION = '1.0.0';
export const BUILD_TARGET = 'browser';
export const BUILD_DATE = new Date().toISOString();