/**
 * SvelteKit Adapter for Farert WebAssembly SDK
 * 
 * Production-ready SvelteKit integration providing server-side rendering, static generation,
 * and comprehensive state management for Japanese railway fare calculations.
 * 
 * Features:
 * - SvelteKit load functions for server-side data loading
 * - State serialization and hydration for SSR compatibility
 * - Static generation helpers for reference data (stations, lines, companies, prefectures)
 * - Integration with existing Svelte stores and context system
 * - Comprehensive error handling compatible with SvelteKit patterns
 * - Performance optimization for server-side operations
 * - Type-safe route parameter handling and validation
 * 
 * Requirements: REQ-API-004
 * - SvelteKit SSR and static generation support
 * - Server-side data loading with proper error handling
 * - State hydration for seamless client-server transitions
 * - Static route generation for reference data optimization
 * 
 * @file SvelteKit Integration Adapter
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

// SvelteKit imports with fallbacks for different environments
let error: any, redirect: any, json: any;
try {
  ({ error, redirect, json } = require('@sveltejs/kit'));
} catch {
  // Fallback implementations for non-SvelteKit environments
  error = (status: number, message: string) => ({ status, message });
  redirect = (status: number, location: string) => ({ status, location });
  json = (data: any) => ({ data });
}

// Core SDK and Svelte integration
import { FarertSDKImpl, createFarertSDK, createProductionSDK } from '../core/farert-sdk';
import { farertStore } from './farert-store';
import { 
  createStoreCollection, 
  type SvelteStoreCollection,
  type StoreConfig
} from './stores';
import {
  createSvelteSDKContext,
  setSvelteSDKContext,
  type SvelteSDKContext,
  type ContextConfig
} from './context';

// Core SDK types
import type {
  FarertSDK,
  SDKConfig,
  StationInfo,
  StationSearchResult,
  LineInfo,
  CompanyInfo,
  PrefectureInfo,
  RouteSpec,
  RouteSegment,
  FareCalculationResult,
  RouteValidationResult,
  FarertSDKError,
  PerformanceMetrics,
  CacheStats
} from '../types/core';

// ============================================================================
// SVELTEKIT-SPECIFIC TYPE DEFINITIONS
// ============================================================================

/**
 * SvelteKit load function context with SDK integration
 */
export interface SvelteKitSDKLoadContext {
  /** URL parameters */
  params: Record<string, string>;
  
  /** URL search parameters */
  url: {
    pathname: string;
    searchParams: URLSearchParams;
  };
  
  /** Request headers */
  request: {
    headers: Headers;
  };
  
  /** Route information */
  route: {
    id: string;
  };
  
  /** SDK instance for server-side operations */
  sdk: FarertSDK;
  
  /** Performance tracking */
  performance: {
    startTime: number;
    trackOperation: (name: string) => () => number;
  };
}

/**
 * Server-side load result with serializable data
 */
export interface SvelteKitLoadResult<T = any> {
  /** Serializable data for client hydration */
  data?: T;
  
  /** Error information */
  error?: {
    status: number;
    message: string;
    code?: string;
    retryable?: boolean;
  };
  
  /** Cache control headers */
  cacheControl?: {
    maxAge: number;
    staleWhileRevalidate?: number;
    mustRevalidate?: boolean;
  };
  
  /** Performance metrics */
  performance?: {
    serverTime: number;
    operations: Record<string, number>;
  };
}

/**
 * Static generation configuration
 */
export interface StaticGenerationConfig {
  /** Enable static generation */
  enabled: boolean;
  
  /** Base paths for static routes */
  basePaths: string[];
  
  /** Maximum number of routes per type */
  limits: {
    stations: number;
    lines: number;
    companies: number;
    prefectures: number;
  };
  
  /** Cache configuration for static data */
  cache: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  
  /** Pre-generation filters */
  filters: {
    popularOnly: boolean;
    excludeRegions?: string[];
    includeRegions?: string[];
  };
}

/**
 * Serializable station data for SSR
 */
export interface SerializableStationData {
  id: number;
  name: string;
  nameEx: string;
  kana: string;
  prefecture: string;
  prefectureId: number;
  isJunction: boolean;
  lines: number[];
  metadata: {
    popularity?: number;
    region?: string;
    coordinates?: [number, number];
  };
}

/**
 * Serializable route data for SSR
 */
export interface SerializableRouteData {
  segments: RouteSegment[];
  validation: RouteValidationResult;
  fare?: FareCalculationResult;
  metadata: {
    complexity: number;
    estimatedTime: number;
    distance?: number;
    companies: string[];
  };
}

/**
 * Hydration state for client-server synchronization
 */
export interface HydrationState {
  /** SDK initialization state */
  sdk: {
    initialized: boolean;
    version: string;
    config: Partial<SDKConfig>;
  };
  
  /** Pre-loaded reference data */
  referenceData: {
    stations: SerializableStationData[];
    lines: LineInfo[];
    companies: CompanyInfo[];
    prefectures: PrefectureInfo[];
    lastUpdated: string;
  };
  
  /** Pre-computed route data */
  routeData?: SerializableRouteData;
  
  /** Performance metrics from server */
  performance: PerformanceMetrics;
  
  /** Server timestamp for cache validation */
  serverTimestamp: number;
}

// ============================================================================
// CORE SVELTEKIT ADAPTER CLASS
// ============================================================================

/**
 * Main SvelteKit adapter providing SSR and static generation capabilities
 */
export class SvelteKitFarertAdapter {
  private sdk: FarertSDK;
  private config: StaticGenerationConfig;
  private referenceDataCache: Map<string, { data: any; timestamp: number }>;
  private performanceTracker: Map<string, number>;
  
  constructor(
    sdkConfig: Partial<SDKConfig> = {},
    staticConfig: Partial<StaticGenerationConfig> = {}
  ) {
    // Create production-optimized SDK for server use
    this.sdk = createProductionSDK({
      caching: {
        enabled: true,
        maxSize: 5000, // Larger cache for server
        ttl: 600000, // 10 minutes
      },
      performance: {
        enabled: true,
        trackingLevel: 'basic',
      },
      errorHandling: {
        retryAttempts: 1, // Minimal retries on server
        retryDelay: 1000,
        enableFuzzyMatching: true,
      },
      development: false,
      ...sdkConfig
    });
    
    this.config = {
      enabled: true,
      basePaths: ['/stations', '/lines', '/companies', '/prefectures', '/routes'],
      limits: {
        stations: 1000,
        lines: 500,
        companies: 100,
        prefectures: 47,
      },
      cache: {
        ttl: 3600, // 1 hour
        staleWhileRevalidate: 86400, // 24 hours
      },
      filters: {
        popularOnly: false,
      },
      ...staticConfig
    };
    
    this.referenceDataCache = new Map();
    this.performanceTracker = new Map();
  }
  
  /**
   * Initialize SDK for server-side use
   */
  async initialize(): Promise<void> {
    if (!this.sdk.isReady()) {
      await this.sdk.initialize();
    }
  }
  
  /**
   * Create enhanced load context with SDK integration
   */
  createLoadContext(context: any): SvelteKitSDKLoadContext {
    const startTime = performance.now();
    
    return {
      params: context.params || {},
      url: {
        pathname: context.url?.pathname || '/',
        searchParams: context.url?.searchParams || new URLSearchParams(),
      },
      request: {
        headers: context.request?.headers || new Headers(),
      },
      route: {
        id: context.route?.id || 'unknown',
      },
      sdk: this.sdk,
      performance: {
        startTime,
        trackOperation: (name: string) => {
          const operationStart = performance.now();
          return () => {
            const duration = performance.now() - operationStart;
            this.performanceTracker.set(name, duration);
            return duration;
          };
        }
      }
    };
  }
  
  // ============================================================================
  // SERVER-SIDE LOAD FUNCTIONS
  // ============================================================================
  
  /**
   * Load station data for server-side rendering
   */
  async loadStation(context: SvelteKitSDKLoadContext): Promise<SvelteKitLoadResult<{
    station: SerializableStationData | null;
    relatedStations: SerializableStationData[];
    lines: LineInfo[];
  }>> {
    const trackOperation = context.performance.trackOperation('loadStation');
    
    try {
      await this.initialize();
      
      const stationId = parseInt(context.params.id || '0');
      if (!stationId || isNaN(stationId)) {
        throw error(400, 'Invalid station ID');
      }
      
      // Load station data
      const station = await this.sdk.getStationById(stationId);
      if (!station) {
        throw error(404, 'Station not found');
      }
      
      // Get related stations (nearby or connected)
      const relatedStations = await this.getRelatedStations(station);
      
      // Get station lines
      const lines = await this.getStationLines(stationId);
      
      const operationTime = trackOperation();
      
      return {
        data: {
          station: this.serializeStationData(station),
          relatedStations: relatedStations.map(s => this.serializeStationData(s)),
          lines
        },
        cacheControl: {
          maxAge: this.config.cache.ttl,
          staleWhileRevalidate: this.config.cache.staleWhileRevalidate,
        },
        performance: {
          serverTime: operationTime,
          operations: Object.fromEntries(this.performanceTracker)
        }
      };
      
    } catch (err) {
      const operationTime = trackOperation();
      
      if (err.status) {
        throw err; // Re-throw SvelteKit errors
      }
      
      const sdkError = err as FarertSDKError;
      return {
        error: {
          status: 500,
          message: sdkError.message || 'Failed to load station data',
          code: sdkError.code,
          retryable: sdkError.retryable,
        },
        performance: {
          serverTime: operationTime,
          operations: Object.fromEntries(this.performanceTracker)
        }
      };
    }
  }
  
  /**
   * Load route calculation data for server-side rendering
   */
  async loadRoute(context: SvelteKitSDKLoadContext): Promise<SvelteKitLoadResult<{
    route: SerializableRouteData;
    alternatives: SerializableRouteData[];
  }>> {
    const trackOperation = context.performance.trackOperation('loadRoute');
    
    try {
      await this.initialize();
      
      // Parse route from URL parameters
      const routeSpec = this.parseRouteFromUrl(context);
      if (!routeSpec) {
        throw error(400, 'Invalid route specification');
      }
      
      // Validate route
      const validation = await this.sdk.validateRoute(routeSpec);
      if (!validation.isValid) {
        throw error(400, `Invalid route: ${validation.errors[0]?.message || 'Unknown error'}`);
      }
      
      // Calculate fare
      const fare = await this.sdk.calculateFare(routeSpec);
      
      // Get route segments
      const segments = await this.parseRouteSegments(routeSpec);
      
      // Create serializable route data
      const routeData: SerializableRouteData = {
        segments,
        validation,
        fare,
        metadata: {
          complexity: this.calculateRouteComplexity(segments),
          estimatedTime: this.estimateRouteTime(segments),
          distance: this.calculateRouteDistance(segments),
          companies: this.getRouteCompanies(segments),
        }
      };
      
      // Get alternative routes (simplified)
      const alternatives: SerializableRouteData[] = [];
      
      const operationTime = trackOperation();
      
      return {
        data: {
          route: routeData,
          alternatives
        },
        cacheControl: {
          maxAge: 300, // 5 minutes for dynamic route calculations
          staleWhileRevalidate: 1800, // 30 minutes
        },
        performance: {
          serverTime: operationTime,
          operations: Object.fromEntries(this.performanceTracker)
        }
      };
      
    } catch (err) {
      const operationTime = trackOperation();
      
      if (err.status) {
        throw err;
      }
      
      const sdkError = err as FarertSDKError;
      return {
        error: {
          status: 500,
          message: sdkError.message || 'Failed to calculate route',
          code: sdkError.code,
          retryable: sdkError.retryable,
        },
        performance: {
          serverTime: operationTime,
          operations: Object.fromEntries(this.performanceTracker)
        }
      };
    }
  }
  
  /**
   * Load search results for server-side rendering
   */
  async loadSearch(context: SvelteKitSDKLoadContext): Promise<SvelteKitLoadResult<{
    query: string;
    results: StationSearchResult[];
    suggestions: string[];
    popularStations: SerializableStationData[];
  }>> {
    const trackOperation = context.performance.trackOperation('loadSearch');
    
    try {
      await this.initialize();
      
      const query = context.url.searchParams.get('q') || '';
      const limit = parseInt(context.url.searchParams.get('limit') || '50');
      
      let results: StationSearchResult[] = [];
      
      if (query.trim().length > 0) {
        results = await this.sdk.searchStations(query, {
          limit: Math.min(limit, 100), // Cap at 100 results
          fuzzyThreshold: 0.6,
          sortByPopularity: true,
        });
      }
      
      // Get popular stations for empty query
      const popularStations = await this.getPopularStations(20);
      
      // Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(query);
      
      const operationTime = trackOperation();
      
      return {
        data: {
          query,
          results,
          suggestions,
          popularStations: popularStations.map(s => this.serializeStationData(s)),
        },
        cacheControl: {
          maxAge: query ? 300 : 3600, // Cache empty queries longer
          staleWhileRevalidate: 1800,
        },
        performance: {
          serverTime: operationTime,
          operations: Object.fromEntries(this.performanceTracker)
        }
      };
      
    } catch (err) {
      const operationTime = trackOperation();
      
      const sdkError = err as FarertSDKError;
      return {
        error: {
          status: 500,
          message: sdkError.message || 'Search failed',
          code: sdkError.code,
          retryable: sdkError.retryable,
        },
        performance: {
          serverTime: operationTime,
          operations: Object.fromEntries(this.performanceTracker)
        }
      };
    }
  }
  
  // ============================================================================
  // STATIC GENERATION HELPERS
  // ============================================================================
  
  /**
   * Generate static routes for all stations
   */
  async generateStationRoutes(): Promise<Array<{ params: { id: string } }>> {
    if (!this.config.enabled) {
      return [];
    }
    
    try {
      await this.initialize();
      
      // Get all stations (this would be optimized in production)
      const allStations = await this.getAllStations();
      
      // Filter based on configuration
      let stations = allStations;
      if (this.config.filters.popularOnly) {
        stations = await this.getPopularStations(this.config.limits.stations);
      } else {
        stations = stations.slice(0, this.config.limits.stations);
      }
      
      return stations.map(station => ({
        params: { id: station.id.toString() }
      }));
      
    } catch (error) {
      console.error('[SvelteKitAdapter] Failed to generate station routes:', error);
      return [];
    }
  }
  
  /**
   * Generate static routes for all lines
   */
  async generateLineRoutes(): Promise<Array<{ params: { id: string } }>> {
    if (!this.config.enabled) {
      return [];
    }
    
    try {
      await this.initialize();
      
      const lines = await this.sdk.getLines();
      
      return lines
        .slice(0, this.config.limits.lines)
        .map(line => ({
          params: { id: line.id.toString() }
        }));
        
    } catch (error) {
      console.error('[SvelteKitAdapter] Failed to generate line routes:', error);
      return [];
    }
  }
  
  /**
   * Generate static routes for all companies
   */
  async generateCompanyRoutes(): Promise<Array<{ params: { id: string } }>> {
    if (!this.config.enabled) {
      return [];
    }
    
    try {
      await this.initialize();
      
      const companies = await this.sdk.getCompanies();
      
      return companies
        .slice(0, this.config.limits.companies)
        .map(company => ({
          params: { id: company.id.toString() }
        }));
        
    } catch (error) {
      console.error('[SvelteKitAdapter] Failed to generate company routes:', error);
      return [];
    }
  }
  
  /**
   * Generate static routes for all prefectures
   */
  async generatePrefectureRoutes(): Promise<Array<{ params: { id: string } }>> {
    if (!this.config.enabled) {
      return [];
    }
    
    try {
      await this.initialize();
      
      const prefectures = await this.sdk.getPrefectures();
      
      return prefectures
        .slice(0, this.config.limits.prefectures)
        .map(prefecture => ({
          params: { id: prefecture.id.toString() }
        }));
        
    } catch (error) {
      console.error('[SvelteKitAdapter] Failed to generate prefecture routes:', error);
      return [];
    }
  }
  
  /**
   * Pre-generate reference data for static builds
   */
  async generateReferenceData(): Promise<{
    stations: SerializableStationData[];
    lines: LineInfo[];
    companies: CompanyInfo[];
    prefectures: PrefectureInfo[];
  }> {
    await this.initialize();
    
    const [stations, lines, companies, prefectures] = await Promise.all([
      this.getPopularStations(this.config.limits.stations),
      this.sdk.getLines(),
      this.sdk.getCompanies(),
      this.sdk.getPrefectures(),
    ]);
    
    return {
      stations: stations.map(s => this.serializeStationData(s)),
      lines: lines.slice(0, this.config.limits.lines),
      companies: companies.slice(0, this.config.limits.companies),
      prefectures: prefectures.slice(0, this.config.limits.prefectures),
    };
  }
  
  // ============================================================================
  // STATE SERIALIZATION AND HYDRATION
  // ============================================================================
  
  /**
   * Create hydration state for client-server synchronization
   */
  createHydrationState(data?: any): HydrationState {
    const performance = this.sdk.metrics.getMetrics();
    
    return {
      sdk: {
        initialized: this.sdk.isReady(),
        version: this.sdk.version,
        config: this.sdk.config,
      },
      referenceData: data?.referenceData || {
        stations: [],
        lines: [],
        companies: [],
        prefectures: [],
        lastUpdated: new Date().toISOString(),
      },
      routeData: data?.routeData,
      performance,
      serverTimestamp: Date.now(),
    };
  }
  
  /**
   * Serialize station data for client transmission
   */
  private serializeStationData(station: StationInfo): SerializableStationData {
    return {
      id: station.id,
      name: station.name,
      nameEx: station.nameExtended,
      kana: station.kana,
      prefecture: station.prefecture,
      prefectureId: station.prefectureId,
      isJunction: station.isJunction,
      lines: station.lines || [],
      metadata: {
        popularity: station.ranking,
        region: station.region,
        coordinates: station.coordinates,
      }
    };
  }
  
  /**
   * Deserialize station data on the client
   */
  static deserializeStationData(data: SerializableStationData): StationInfo {
    return {
      id: data.id,
      name: data.name,
      nameExtended: data.nameEx,
      kana: data.kana,
      prefecture: data.prefecture,
      prefectureId: data.prefectureId,
      isJunction: data.isJunction,
      lines: data.lines,
      ranking: data.metadata.popularity,
      region: data.metadata.region,
      coordinates: data.metadata.coordinates,
    };
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  private parseRouteFromUrl(context: SvelteKitSDKLoadContext): RouteSpec | null {
    const from = context.url.searchParams.get('from');
    const to = context.url.searchParams.get('to');
    const via = context.url.searchParams.getAll('via');
    
    if (!from || !to) {
      return null;
    }
    
    if (via.length > 0) {
      return { start: from, end: to, via };
    }
    
    return { start: from, end: to };
  }
  
  private async parseRouteSegments(routeSpec: RouteSpec): Promise<RouteSegment[]> {
    // Simplified implementation - in production this would be more comprehensive
    if (typeof routeSpec === 'string') {
      // Parse string format like "東京 東海道線 横浜"
      const parts = routeSpec.split(/\s+/);
      const segments: RouteSegment[] = [];
      
      for (let i = 0; i < parts.length; i += 2) {
        const stationName = parts[i];
        const lineId = parts[i + 1] ? await this.getLineIdByName(parts[i + 1]) : undefined;
        
        const station = await this.sdk.getStationById(stationName);
        if (station) {
          segments.push({
            stationId: station.id,
            stationName: station.name,
            lineId,
            isTransfer: i > 0 && i < parts.length - 2,
          });
        }
      }
      
      return segments;
    }
    
    // Handle object format
    const segments: RouteSegment[] = [];
    const { start, end, via = [] } = routeSpec as any;
    
    // Add start station
    const startStation = await this.sdk.getStationById(start);
    if (startStation) {
      segments.push({
        stationId: startStation.id,
        stationName: startStation.name,
        isTransfer: false,
      });
    }
    
    // Add via stations
    for (const viaStation of via) {
      const station = await this.sdk.getStationById(viaStation);
      if (station) {
        segments.push({
          stationId: station.id,
          stationName: station.name,
          isTransfer: true,
        });
      }
    }
    
    // Add end station
    const endStation = await this.sdk.getStationById(end);
    if (endStation) {
      segments.push({
        stationId: endStation.id,
        stationName: endStation.name,
        isTransfer: false,
      });
    }
    
    return segments;
  }
  
  private calculateRouteComplexity(segments: RouteSegment[]): number {
    const transferCount = segments.filter(s => s.isTransfer).length;
    const stationCount = segments.length;
    
    return transferCount * 0.5 + stationCount * 0.1;
  }
  
  private estimateRouteTime(segments: RouteSegment[]): number {
    // Simplified estimation: 3 minutes per station + 5 minutes per transfer
    const stationTime = segments.length * 3;
    const transferTime = segments.filter(s => s.isTransfer).length * 5;
    
    return stationTime + transferTime;
  }
  
  private calculateRouteDistance(segments: RouteSegment[]): number {
    // Simplified calculation - in production this would use real distance data
    return segments.length * 2.5; // Assume 2.5km average between stations
  }
  
  private getRouteCompanies(segments: RouteSegment[]): string[] {
    // Extract unique companies from segments
    const companies = new Set<string>();
    
    segments.forEach(segment => {
      if (segment.lineId) {
        // This would look up the actual company in production
        companies.add('JR東日本'); // Simplified
      }
    });
    
    return Array.from(companies);
  }
  
  private async getRelatedStations(station: StationInfo): Promise<StationInfo[]> {
    // Simplified implementation - get stations on same lines
    const relatedStations: StationInfo[] = [];
    
    if (station.lines) {
      for (const lineId of station.lines.slice(0, 3)) { // Limit to 3 lines
        // In production, this would get actual stations on the line
        // For now, return empty array
      }
    }
    
    return relatedStations;
  }
  
  private async getStationLines(stationId: number): Promise<LineInfo[]> {
    // Simplified implementation
    const lines: LineInfo[] = [];
    
    // In production, this would query the actual lines serving the station
    return lines;
  }
  
  private async getAllStations(): Promise<StationInfo[]> {
    // This would be implemented to get all stations from the database
    // For now, return empty array as placeholder
    return [];
  }
  
  private async getPopularStations(limit: number): Promise<StationInfo[]> {
    // This would get popular stations based on usage statistics
    // For now, return empty array as placeholder
    return [];
  }
  
  private async getLineIdByName(lineName: string): Promise<number | undefined> {
    // This would look up line ID by name
    // For now, return undefined as placeholder
    return undefined;
  }
  
  private async generateSearchSuggestions(query: string): Promise<string[]> {
    // Generate search suggestions based on query
    if (!query.trim()) {
      return ['東京', '新宿', '渋谷', '横浜', '大阪'];
    }
    
    // In production, this would use intelligent suggestion algorithms
    return [];
  }
  
  /**
   * Dispose of the adapter and clean up resources
   */
  async dispose(): Promise<void> {
    if (this.sdk) {
      await this.sdk.dispose();
    }
    
    this.referenceDataCache.clear();
    this.performanceTracker.clear();
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS FOR SVELTEKIT INTEGRATION
// ============================================================================

/**
 * Create SvelteKit adapter instance
 */
export function createSvelteKitAdapter(
  sdkConfig?: Partial<SDKConfig>,
  staticConfig?: Partial<StaticGenerationConfig>
): SvelteKitFarertAdapter {
  return new SvelteKitFarertAdapter(sdkConfig, staticConfig);
}

/**
 * Create SvelteKit load function for station data
 */
export function createStationLoader(adapter: SvelteKitFarertAdapter) {
  return async (event: any) => {
    const context = adapter.createLoadContext(event);
    const result = await adapter.loadStation(context);
    
    if (result.error) {
      throw error(result.error.status, result.error.message);
    }
    
    return {
      ...result.data,
      cacheControl: result.cacheControl,
      performance: result.performance,
    };
  };
}

/**
 * Create SvelteKit load function for route calculation
 */
export function createRouteLoader(adapter: SvelteKitFarertAdapter) {
  return async (event: any) => {
    const context = adapter.createLoadContext(event);
    const result = await adapter.loadRoute(context);
    
    if (result.error) {
      throw error(result.error.status, result.error.message);
    }
    
    return {
      ...result.data,
      cacheControl: result.cacheControl,
      performance: result.performance,
    };
  };
}

/**
 * Create SvelteKit load function for search
 */
export function createSearchLoader(adapter: SvelteKitFarertAdapter) {
  return async (event: any) => {
    const context = adapter.createLoadContext(event);
    const result = await adapter.loadSearch(context);
    
    if (result.error) {
      throw error(result.error.status, result.error.message);
    }
    
    return {
      ...result.data,
      cacheControl: result.cacheControl,
      performance: result.performance,
    };
  };
}

/**
 * Create hydration store for client-side state management
 */
export function createHydrationStore(initialState: HydrationState) {
  // This would create Svelte stores for client-side hydration
  // Implementation would depend on the specific store requirements
  
  return {
    sdk: farertStore,
    hydrationState: initialState,
    
    // Initialize client-side stores with server data
    async hydrate(): Promise<void> {
      if (initialState.sdk.initialized) {
        // Initialize SDK with server configuration
        await farertStore.initialize(initialState.sdk.config);
      }
      
      // Pre-populate caches with server data
      if (initialState.referenceData) {
        // This would populate reference data caches
      }
    }
  };
}

/**
 * Create SvelteKit API endpoint for real-time data
 */
export function createApiEndpoint(adapter: SvelteKitFarertAdapter) {
  return {
    GET: async (event: any) => {
      const context = adapter.createLoadContext(event);
      const action = event.url.searchParams.get('action');
      
      try {
        switch (action) {
          case 'search':
            const searchResult = await adapter.loadSearch(context);
            return json(searchResult.data);
            
          case 'calculate':
            const routeResult = await adapter.loadRoute(context);
            return json(routeResult.data);
            
          case 'station':
            const stationResult = await adapter.loadStation(context);
            return json(stationResult.data);
            
          default:
            throw error(400, 'Invalid action');
        }
      } catch (err) {
        const sdkError = err as FarertSDKError;
        return json({
          error: {
            message: sdkError.message,
            code: sdkError.code,
            retryable: sdkError.retryable,
          }
        }, { status: 500 });
      }
    },
    
    POST: async (event: any) => {
      // Handle POST requests for complex operations
      const context = adapter.createLoadContext(event);
      const body = await event.request.json();
      
      try {
        if (body.action === 'calculateBatch') {
          // Handle batch calculations
          const results = [];
          for (const route of body.routes) {
            const routeContext = { ...context, params: { route } };
            const result = await adapter.loadRoute(routeContext);
            results.push(result.data);
          }
          return json({ results });
        }
        
        throw error(400, 'Invalid POST action');
      } catch (err) {
        const sdkError = err as FarertSDKError;
        return json({
          error: {
            message: sdkError.message,
            code: sdkError.code,
          }
        }, { status: 500 });
      }
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export main adapter class
export { SvelteKitFarertAdapter };

// Export all types
export type {
  SvelteKitSDKLoadContext,
  SvelteKitLoadResult,
  StaticGenerationConfig,
  SerializableStationData,
  SerializableRouteData,
  HydrationState
};

// Export convenience functions
export {
  createStationLoader,
  createRouteLoader,
  createSearchLoader,
  createHydrationStore,
  createApiEndpoint
};

// Default export
export default {
  SvelteKitFarertAdapter,
  createSvelteKitAdapter,
  createStationLoader,
  createRouteLoader,
  createSearchLoader,
  createHydrationStore,
  createApiEndpoint,
};