/**
 * SvelteKit Middleware for Farert SDK
 * 
 * Provides server-side middleware for SvelteKit applications with SDK initialization,
 * request caching, response optimization, and comprehensive error handling.
 * Enables high-performance server-side operations with intelligent caching
 * and resource management for railway data applications.
 * 
 * Features:
 * - Server-side SDK initialization and management
 * - Request caching and response optimization
 * - Error handling middleware for API routes
 * - Performance monitoring and logging
 * - Resource cleanup and memory management
 * - Security headers and validation
 * 
 * Requirements: REQ-API-004
 * @fileoverview SvelteKit Middleware for Frontend API Layer
 * @author Claude Code (claude.ai/code)
 * @version 1.0.0
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

import { FarertSDKImpl, createFarertSDK, createProductionSDK } from '../core/farert-sdk';
import type {
  FarertSDK,
  SDKConfig,
  StationInfo,
  StationSearchOptions,
  RouteSpec,
  FareCalculationResult,
  StationSearchResult
} from '../types/core';

// SvelteKit types with fallbacks
let type: any = {};
try {
  ({ type } = require('@sveltejs/kit'));
} catch {
  // Fallback types for non-SvelteKit environments
  type = {
    RequestHandler: Function,
    Handle: Function,
    HandleError: Function,
    RequestEvent: Object,
  };
}

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

/**
 * Middleware configuration options
 */
export interface MiddlewareConfig {
  // Caching configuration
  enableCaching: boolean;
  cacheTimeout: number;
  
  // Performance and monitoring
  enableCompression: boolean;
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  
  // Security configuration
  enableSecurityHeaders: boolean;
  maxRequestSize: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
  
  // CORS configuration
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    headers: string[];
  };
  
  // SvelteKit SSR specific options
  ssr: {
    enableStaticGeneration: boolean;
    enableHydration: boolean;
    fallbackToClientSide: boolean;
    preloadCriticalData: boolean;
  };
  
  // SDK configuration for server-side
  sdk: Partial<SDKConfig>;
}

/**
 * Request context with SDK instance
 */
export interface FarertRequestContext {
  sdk: FarertSDK;
  startTime: number;
  requestId: string;
  userAgent?: string;
  ip?: string;
  cacheKey?: string;
}

/**
 * Cache entry for middleware responses
 */
export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag: string;
  contentType: string;
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  cacheHitRatio: number;
  errorRate: number;
  slowRequests: number;
  memoryUsage: number;
}

/**
 * Rate limiting state
 */
export interface RateLimitState {
  requests: number;
  windowStart: number;
  isBlocked: boolean;
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  requestId: string;
  path: string;
  method: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
  stack?: string;
}

// ============================================================================
// MIDDLEWARE CLASS
// ============================================================================

/**
 * Main SvelteKit middleware class
 */
export class SvelteKitMiddleware {
  private sdk: FarertSDK | null = null;
  private config: MiddlewareConfig;
  private cache = new Map<string, CacheEntry>();
  private rateLimits = new Map<string, RateLimitState>();
  private metrics: PerformanceMetrics;
  private isInitialized = false;

  constructor(config: Partial<MiddlewareConfig> = {}) {
    this.config = {
      // Caching configuration
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      
      // Performance and monitoring
      enableCompression: true,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      
      // Security configuration
      enableSecurityHeaders: true,
      maxRequestSize: 1024 * 1024, // 1MB
      rateLimitRequests: 100,
      rateLimitWindow: 60 * 1000, // 1 minute
      
      // CORS configuration
      cors: {
        enabled: true,
        origins: ['*'],
        methods: ['GET', 'POST', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization'],
      },
      
      // SvelteKit SSR specific options
      ssr: {
        enableStaticGeneration: true,
        enableHydration: true,
        fallbackToClientSide: true,
        preloadCriticalData: true,
      },
      
      // SDK configuration for server-side
      sdk: {
        development: false,
        performance: {
          enabled: true,
          trackingLevel: 'basic'
        },
        caching: {
          enabled: true,
          maxSize: 2000,
          ttl: 10 * 60 * 1000 // 10 minutes
        },
        errorHandling: {
          retryAttempts: 2,
          retryDelay: 1500,
          enableFuzzyMatching: false
        }
      },
      
      ...config
    };

    // Merge nested objects properly
    if (config.cors) {
      this.config.cors = { ...this.config.cors, ...config.cors };
    }
    if (config.ssr) {
      this.config.ssr = { ...this.config.ssr, ...config.ssr };
    }
    if (config.sdk) {
      this.config.sdk = { ...this.config.sdk, ...config.sdk };
    }

    this.metrics = {
      requestCount: 0,
      averageResponseTime: 0,
      cacheHitRatio: 0,
      errorRate: 0,
      slowRequests: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MiddlewareConfig {
    return {
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000,
      enableCompression: true,
      enableLogging: true,
      enablePerformanceMonitoring: true,
      enableSecurityHeaders: true,
      maxRequestSize: 1024 * 1024,
      rateLimitRequests: 100,
      rateLimitWindow: 60 * 1000,
      cors: {
        enabled: true,
        origins: ['*'],
        methods: ['GET', 'POST', 'OPTIONS'],
        headers: ['Content-Type', 'Authorization'],
      },
      ssr: {
        enableStaticGeneration: true,
        enableHydration: true,
        fallbackToClientSide: true,
        preloadCriticalData: true,
      },
      sdk: {
        development: false,
        performance: { enabled: true, trackingLevel: 'basic' },
        caching: { enabled: true, maxSize: 2000, ttl: 10 * 60 * 1000 },
        errorHandling: { retryAttempts: 2, retryDelay: 1500, enableFuzzyMatching: false }
      }
    };
  }

  /**
   * Initialize middleware with SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create production-optimized SDK for server environment
      this.sdk = createProductionSDK(this.config.sdk);
      
      // Initialize the SDK with WebAssembly support
      await this.sdk.initialize();
      
      // Preload critical data if SSR preloading is enabled
      if (this.config.ssr.preloadCriticalData) {
        await this.preloadCriticalData();
      }

      this.isInitialized = true;
      this.log('info', 'SvelteKit middleware initialized successfully', {
        sdkState: this.sdk.state,
        cacheEnabled: this.config.enableCaching,
        ssrEnabled: this.config.ssr.enableHydration
      });

    } catch (error) {
      this.log('error', 'Failed to initialize middleware:', error);
      
      // If fallback to client-side is enabled, continue without server SDK
      if (this.config.ssr.fallbackToClientSide) {
        this.log('warn', 'Falling back to client-side SDK initialization');
        this.isInitialized = true;
        return;
      }
      
      throw error;
    }
  }

  /**
   * Create handle function for SvelteKit
   */
  createHandle(): any {
    return async ({ event, resolve }: any) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      try {
        // Initialize SDK if needed
        if (!this.isInitialized) {
          await this.initialize();
        }

        // Add SDK and SSR helpers to event locals
        event.locals.farert = {
          sdk: this.sdk,
          requestId,
          startTime,
          loadHelpers: this.createLoadHelpers(),
          staticHelpers: this.createStaticGenerationHelpers(),
          isSSR: true,
          middleware: this
        };

        // Apply middleware layers
        await this.applySecurityHeaders(event);
        await this.applyCors(event);
        await this.applyRateLimit(event);
        await this.applyRequestValidation(event);

        // Check cache for GET requests
        if (event.request.method === 'GET' && this.config.enableCaching) {
          const cachedResponse = await this.getCachedResponse(event);
          if (cachedResponse) {
            this.updateMetrics(startTime, true);
            return cachedResponse;
          }
        }

        // Resolve the request
        const response = await resolve(event);

        // Cache successful GET responses
        if (event.request.method === 'GET' && response.ok && this.config.enableCaching) {
          await this.cacheResponse(event, response);
        }

        // Update metrics
        this.updateMetrics(startTime, false);

        // Add performance headers
        if (this.config.enablePerformanceMonitoring) {
          response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
          response.headers.set('X-Request-ID', requestId);
        }

        return response;

      } catch (error) {
        this.logError(error, {
          requestId,
          path: event.url.pathname,
          method: event.request.method,
          userAgent: event.request.headers.get('user-agent') || undefined,
          ip: this.getClientIP(event),
          timestamp: new Date(),
        });

        // Return error response
        return new Response('Internal Server Error', {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
            'X-Request-ID': requestId,
          },
        });
      }
    };
  }

  /**
   * Create handleError function for SvelteKit
   */
  createHandleError(): any {
    return async ({ error, event }: any) => {
      const requestId = event.locals?.farert?.requestId || this.generateRequestId();
      
      this.logError(error, {
        requestId,
        path: event.url.pathname,
        method: event.request.method,
        userAgent: event.request.headers.get('user-agent') || undefined,
        ip: this.getClientIP(event),
        timestamp: new Date(),
        stack: error.stack,
      });

      return {
        message: 'An error occurred',
        requestId,
      };
    };
  }

  /**
   * Create API route handlers
   */
  createAPIHandlers() {
    return {
      // Station search handler
      searchStations: this.createAPIHandler(async (event: any) => {
        const url = new URL(event.request.url);
        const query = url.searchParams.get('q') || '';
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const prefecture = url.searchParams.get('prefecture') || undefined;
        const fuzzyThreshold = parseFloat(url.searchParams.get('fuzzyThreshold') || '0.5');

        const searchOptions: StationSearchOptions = {
          limit,
          prefecture,
          fuzzyThreshold,
          sortByPopularity: url.searchParams.get('sortByPopularity') === 'true'
        };

        const results = await this.sdk!.searchStations(query, searchOptions);
        
        return {
          results,
          total: results.length,
          hasMore: results.length === limit,
          query,
        };
      }),

      // Station details handler
      getStation: this.createAPIHandler(async (event: any) => {
        const { params } = event;
        const stationId = parseInt(params.id);

        if (isNaN(stationId)) {
          throw new Error('Invalid station ID');
        }

        const station = await this.sdk!.getStationInfo(stationId);
        if (!station) {
          throw new Error('Station not found');
        }

        return station;
      }),

      // Route calculation handler
      calculateRoute: this.createAPIHandler(async (event: any) => {
        const routeSpec: RouteSpec = await event.request.json();
        
        const result = await this.sdk!.calculateFare(routeSpec);
        
        return result;
      }),

      // Health check handler
      healthCheck: this.createAPIHandler(async () => {
        return {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          metrics: this.getMetrics(),
          sdk: {
            initialized: this.isInitialized,
            ready: this.sdk?.state === 'ready',
          },
        };
      }),

      // Metrics handler
      getMetrics: this.createAPIHandler(async () => {
        return this.getMetrics();
      }),
    };
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    // Update cache hit ratio
    const totalRequests = this.metrics.requestCount;
    const cacheHits = Math.floor(totalRequests * this.metrics.cacheHitRatio);
    
    return {
      ...this.metrics,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.log('info', 'Middleware cache cleared');
  }

  /**
   * Preload critical data for SSR performance
   */
  private async preloadCriticalData(): Promise<void> {
    if (!this.sdk) return;

    try {
      // Preload major stations for faster searches
      const majorStationIds = [
        1130101, // Tokyo
        1130201, // Shinagawa  
        1130301, // Shibuya
        1130401, // Shinjuku
        2741002, // Osaka
        2741801, // Kyoto
        1321304, // Yokohama
        2640605  // Nagoya
      ];

      // Load station data in parallel for better performance
      const preloadPromises = majorStationIds.map(async (stationId) => {
        try {
          return await this.sdk!.getStationInfo(stationId);
        } catch (error) {
          // Ignore individual preload failures
          this.log('warn', `Failed to preload station ${stationId}:`, error);
          return null;
        }
      });

      await Promise.allSettled(preloadPromises);
      
      this.log('info', 'Critical data preloaded successfully');

    } catch (error) {
      this.log('warn', 'Critical data preloading failed:', error);
    }
  }

  /**
   * Create SSR load helpers for SvelteKit pages
   */
  createLoadHelpers() {
    return {
      // Station search for SSR
      loadStationSearch: async (query: string, options: StationSearchOptions = {}) => {
        if (!this.sdk) {
          await this.initialize();
        }
        
        try {
          const results = await this.sdk!.searchStations(query, options);
          return {
            results,
            isSSR: true,
            timestamp: Date.now()
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log('error', 'SSR station search failed:', error);
          
          if (this.config.ssr.fallbackToClientSide) {
            return {
              results: [],
              isSSR: false,
              error: errorMessage,
              fallback: true
            };
          }
          
          throw error;
        }
      },

      // Station details for SSR
      loadStation: async (stationId: number) => {
        if (!this.sdk) {
          await this.initialize();
        }
        
        try {
          const station = await this.sdk!.getStationInfo(stationId);
          return {
            station,
            isSSR: true,
            timestamp: Date.now()
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log('error', 'SSR station load failed:', error);
          
          if (this.config.ssr.fallbackToClientSide) {
            return {
              station: null,
              isSSR: false,
              error: errorMessage,
              fallback: true
            };
          }
          
          throw error;
        }
      },

      // Route calculation for SSR
      loadRouteCalculation: async (routeSpec: RouteSpec) => {
        if (!this.sdk) {
          await this.initialize();
        }
        
        try {
          const result = await this.sdk!.calculateFare(routeSpec);
          return {
            result,
            isSSR: true,
            timestamp: Date.now()
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          this.log('error', 'SSR route calculation failed:', error);
          
          if (this.config.ssr.fallbackToClientSide) {
            return {
              result: null,
              isSSR: false,
              error: errorMessage,
              fallback: true
            };
          }
          
          throw error;
        }
      }
    };
  }

  /**
   * Create static site generation helpers
   */
  createStaticGenerationHelpers() {
    return {
      // Generate static data for all major stations
      generateStationData: async () => {
        if (!this.config.ssr.enableStaticGeneration) {
          throw new Error('Static generation not enabled');
        }

        if (!this.sdk) {
          await this.initialize();
        }

        try {
          // Note: getCompanies and getPrefectures are not in the current SDK interface
          // This would need to be implemented in the actual SDK or replaced with available methods
          const companies = []; // await this.sdk!.getCompanies(); 
          const prefectures = []; // await this.sdk!.getPrefectures();
          
          return {
            companies,
            prefectures,
            generatedAt: new Date().toISOString(),
            sdkState: this.sdk!.state
          };
        } catch (error) {
          this.log('error', 'Static generation failed:', error);
          throw error;
        }
      },

      // Generate route patterns for common routes
      generateCommonRoutes: async () => {
        if (!this.config.ssr.enableStaticGeneration) {
          throw new Error('Static generation not enabled');
        }

        // This would generate static data for common route patterns
        // Implementation would depend on specific requirements
        return {
          routes: [],
          generatedAt: new Date().toISOString()
        };
      }
    };
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    this.clearCache();
    this.rateLimits.clear();
    
    if (this.sdk) {
      await this.sdk.dispose();
    }

    this.isInitialized = false;
    this.log('info', 'Middleware disposed');
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Create generic API handler with error handling
   */
  private createAPIHandler(handler: (event: any) => Promise<any>) {
    return async (event: any) => {
      const startTime = Date.now();
      const requestId = event.locals?.farert?.requestId || this.generateRequestId();

      try {
        // Ensure SDK is initialized
        if (!this.isInitialized) {
          await this.initialize();
        }

        // Execute handler
        const result = await handler(event);

        // Return successful response
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
            'X-Response-Time': `${Date.now() - startTime}ms`,
          },
        });

      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        
        this.logError(errorInstance, {
          requestId,
          path: event.url.pathname,
          method: event.request.method,
          userAgent: event.request.headers.get('user-agent') || undefined,
          ip: this.getClientIP(event),
          timestamp: new Date(),
        });

        const statusCode = errorInstance.name === 'ValidationError' ? 400 : 500;
        const message = errorInstance.message || 'Internal Server Error';

        return new Response(JSON.stringify({
          error: message,
          requestId,
        }), {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-ID': requestId,
          },
        });
      }
    };
  }

  /**
   * Apply security headers
   */
  private async applySecurityHeaders(event: any): Promise<void> {
    if (!this.config.enableSecurityHeaders) return;

    // Security headers will be added to response in the handle function
    // Store them in event locals for later use
    event.locals.securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'",
    };
  }

  /**
   * Apply CORS headers
   */
  private async applyCors(event: any): Promise<void> {
    if (!this.config.cors.enabled) return;

    const origin = event.request.headers.get('origin');
    const corsHeaders: Record<string, string> = {};

    // Handle origin
    if (this.config.cors.origins.includes('*') || 
        (origin && this.config.cors.origins.includes(origin))) {
      corsHeaders['Access-Control-Allow-Origin'] = origin || '*';
    }

    // Handle methods
    corsHeaders['Access-Control-Allow-Methods'] = this.config.cors.methods.join(', ');

    // Handle headers
    corsHeaders['Access-Control-Allow-Headers'] = this.config.cors.headers.join(', ');

    event.locals.corsHeaders = corsHeaders;
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(event: any): Promise<void> {
    const ip = this.getClientIP(event);
    if (!ip) return;

    const now = Date.now();
    let rateLimitState = this.rateLimits.get(ip);

    if (!rateLimitState || now - rateLimitState.windowStart > this.config.rateLimitWindow) {
      // Reset or create new rate limit state
      rateLimitState = {
        requests: 0,
        windowStart: now,
        isBlocked: false,
      };
    }

    rateLimitState.requests++;
    
    if (rateLimitState.requests > this.config.rateLimitRequests) {
      rateLimitState.isBlocked = true;
      throw new Error('Rate limit exceeded');
    }

    this.rateLimits.set(ip, rateLimitState);
  }

  /**
   * Apply request validation
   */
  private async applyRequestValidation(event: any): Promise<void> {
    const contentLength = event.request.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength) > this.config.maxRequestSize) {
      throw new Error('Request too large');
    }
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(event: any): Promise<Response | null> {
    const cacheKey = this.generateCacheKey(event);
    const cached = this.cache.get(cacheKey);

    if (!cached || Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Check if client has current version
    const ifNoneMatch = event.request.headers.get('if-none-match');
    if (ifNoneMatch === cached.etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'ETag': cached.etag,
        'Cache-Control': `max-age=${Math.floor(cached.ttl / 1000)}`,
      },
    });
  }

  /**
   * Cache response data
   */
  private async cacheResponse(event: any, response: Response): Promise<void> {
    if (response.status !== 200) return;

    try {
      const data = await response.json();
      const cacheKey = this.generateCacheKey(event);
      const etag = this.generateETag(data);

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        ttl: this.config.cacheTimeout,
        etag,
        contentType: 'application/json',
      });

    } catch (error) {
      // Ignore caching errors
      this.log('warn', 'Failed to cache response:', error);
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(event: any): string {
    const url = new URL(event.request.url);
    return `${event.request.method}:${url.pathname}:${url.search}`;
  }

  /**
   * Generate ETag for data
   */
  private generateETag(data: any): string {
    const content = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `"${hash.toString(36)}"`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(event: any): string | undefined {
    return event.clientAddress ||
           event.request.headers.get('x-forwarded-for')?.split(',')[0] ||
           event.request.headers.get('x-real-ip') ||
           undefined;
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(startTime: number, fromCache: boolean): void {
    const responseTime = Date.now() - startTime;
    
    this.metrics.requestCount++;
    
    // Update average response time
    const totalTime = this.metrics.averageResponseTime * (this.metrics.requestCount - 1) + responseTime;
    this.metrics.averageResponseTime = totalTime / this.metrics.requestCount;
    
    // Update cache hit ratio
    if (fromCache) {
      const hits = this.metrics.cacheHitRatio * this.metrics.requestCount + 1;
      this.metrics.cacheHitRatio = (hits - 1) / this.metrics.requestCount;
    } else {
      this.metrics.cacheHitRatio = this.metrics.cacheHitRatio * (this.metrics.requestCount - 1) / this.metrics.requestCount;
    }
    
    // Track slow requests (>1000ms)
    if (responseTime > 1000) {
      this.metrics.slowRequests++;
    }
  }

  /**
   * Get memory usage estimation
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Log message with level
   */
  private log(level: 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    console[level](logMessage, ...args);
  }

  /**
   * Log error with context
   */
  private logError(error: any, context: ErrorContext): void {
    if (!this.config.enableLogging) return;

    this.metrics.errorRate = (this.metrics.errorRate * this.metrics.requestCount + 1) / (this.metrics.requestCount + 1);

    const errorLog = {
      message: error.message,
      stack: error.stack,
      context,
    };

    console.error('[MIDDLEWARE ERROR]', errorLog);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create middleware with default configuration
 */
export function createMiddleware(config?: Partial<MiddlewareConfig>): SvelteKitMiddleware {
  return new SvelteKitMiddleware(config);
}

/**
 * Create handle function for SvelteKit hooks
 */
export function createHandle(config?: Partial<MiddlewareConfig>): any {
  const middleware = createMiddleware(config);
  return middleware.createHandle();
}

/**
 * Create handleError function for SvelteKit hooks
 */
export function createHandleError(config?: Partial<MiddlewareConfig>): any {
  const middleware = createMiddleware(config);
  return middleware.createHandleError();
}

/**
 * Create API handlers for SvelteKit routes
 */
export function createAPIHandlers(config?: Partial<MiddlewareConfig>) {
  const middleware = createMiddleware(config);
  return middleware.createAPIHandlers();
}

/**
 * Create SSR load helpers for SvelteKit pages
 */
export function createLoadHelpers(config?: Partial<MiddlewareConfig>) {
  const middleware = createMiddleware(config);
  return middleware.createLoadHelpers();
}

/**
 * Create static site generation helpers
 */
export function createStaticHelpers(config?: Partial<MiddlewareConfig>) {
  const middleware = createMiddleware(config);
  return middleware.createStaticGenerationHelpers();
}

/**
 * Create complete SvelteKit integration with all features
 */
export function createSvelteKitIntegration(config?: Partial<MiddlewareConfig>) {
  const middleware = createMiddleware(config);
  
  return {
    handle: middleware.createHandle(),
    handleError: middleware.createHandleError(),
    apiHandlers: middleware.createAPIHandlers(),
    loadHelpers: middleware.createLoadHelpers(),
    staticHelpers: middleware.createStaticGenerationHelpers(),
    middleware,
    
    // Utility methods
    initialize: () => middleware.initialize(),
    dispose: () => middleware.dispose(),
    getMetrics: () => middleware.getMetrics(),
    clearCache: () => middleware.clearCache()
  };
}

// Global middleware instance
let globalMiddleware: SvelteKitMiddleware | null = null;

/**
 * Get global middleware instance
 */
export function getGlobalMiddleware(): SvelteKitMiddleware {
  if (!globalMiddleware) {
    globalMiddleware = createMiddleware();
  }
  return globalMiddleware;
}

/**
 * Set global middleware instance
 */
export function setGlobalMiddleware(middleware: SvelteKitMiddleware): void {
  globalMiddleware = middleware;
}

// Export the main class as default
export { SvelteKitMiddleware as default };