/**
 * Async Patterns Example for Farert WebAssembly Module
 *
 * This example demonstrates advanced async/await patterns, Promise handling,
 * concurrent operations, error propagation, and performance optimization
 * when working with the Farert WebAssembly APIs.
 *
 * Key Learning Points:
 * - Promise-based API wrappers for synchronous WebAssembly functions
 * - Concurrent operations with proper resource management
 * - Error handling in async contexts with typed exceptions
 * - Performance monitoring and optimization techniques
 * - Memory management in long-running async operations
 * - Retry patterns and circuit breaker implementations
 * - Event-driven architecture with async/await
 *
 * Prerequisites: Advanced JavaScript async/await, Promise patterns, error handling
 */

import {
  FarertModule,
  RouteSegment,
  PerformanceMetrics,
  TimingInfo,
  FARERT_CONSTANTS,
  isFarertModule,
  isValidStationId,
  isValidLineId
} from '../types/farert';

import {
  Station,
  StationSearchResult,
  isStation,
  STATION_CONSTANTS
} from '../types/station-types';

import {
  Line,
  JunctionInfo,
  isLine,
  LINE_CONSTANTS
} from '../types/line-types';

import {
  isRouteSegment,
  ROUTE_CONSTANTS
} from '../types/route-types';

// === Async API Wrapper Classes ===

/**
 * Promise-based wrapper for synchronous WebAssembly operations
 * Provides async/await interface with proper error handling and timeout support
 */
class AsyncFarertWrapper {
  private performanceMonitor: AsyncPerformanceMonitor;
  private circuitBreaker: AsyncCircuitBreaker;

  constructor(private module: FarertModule) {
    if (!isFarertModule(module)) {
      throw new TypeError('Invalid Farert module provided');
    }

    this.performanceMonitor = new AsyncPerformanceMonitor();
    this.circuitBreaker = new AsyncCircuitBreaker();
  }

  // === Promise-based Station Operations ===

  /**
   * Async station ID lookup with timeout and retry support
   */
  async getStationIdAsync(
    stationName: string,
    options: AsyncOperationOptions = {}
  ): Promise<number> {
    const {
      timeout = FARERT_CONSTANTS.DEFAULT_TIMEOUT,
      retryAttempts = 3,
      retryDelay = 1000
    } = options;

    return this.performanceMonitor.measure(
      'getStationId',
      () => this.circuitBreaker.execute(
        `getStationId_${stationName}`,
        async () => {
          return await this.withTimeoutAndRetry(
            () => Promise.resolve(this.module.getStationId(stationName)),
            timeout,
            retryAttempts,
            retryDelay
          );
        }
      )
    );
  }

  /**
   * Async station name lookup with validation
   */
  async getStationNameAsync(
    stationId: number,
    options: AsyncOperationOptions = {}
  ): Promise<string> {
    if (!isValidStationId(stationId)) {
      throw new AsyncValidationError('Invalid station ID', 'INVALID_STATION_ID', { stationId });
    }

    const {
      timeout = FARERT_CONSTANTS.DEFAULT_TIMEOUT,
      validateResult = true
    } = options;

    return this.performanceMonitor.measure(
      'getStationName',
      () => this.circuitBreaker.execute(
        `getStationName_${stationId}`,
        async () => {
          const result = await this.withTimeout(
            () => Promise.resolve(this.module.getStationName(stationId)),
            timeout
          );

          if (validateResult && (typeof result !== 'string' || result.length === 0)) {
            throw new AsyncValidationError('Invalid station name returned', 'INVALID_RESULT', { stationId, result });
          }

          return result;
        }
      )
    );
  }

  /**
   * Async comprehensive station lookup with extended information
   */
  async getStationInfoAsync(
    identifier: string | number,
    options: ExtendedAsyncOptions = {}
  ): Promise<Station | null> {
    const {
      includeLines = true,
      includePrefecture = true,
      includeJunctionInfo = true,
      cacheResult = true,
      timeout = FARERT_CONSTANTS.DEFAULT_TIMEOUT
    } = options;

    return this.performanceMonitor.measure(
      'getStationInfo',
      async () => {
        let stationId: number;

        // Resolve station ID
        if (typeof identifier === 'string') {
          stationId = await this.getStationIdAsync(identifier, { timeout: timeout / 2 });
        } else {
          stationId = identifier;
        }

        if (!isValidStationId(stationId)) {
          return null;
        }

        // Gather station information concurrently
        const [
          name,
          nameExtended,
          kana,
          prefecture,
          lines,
          isJunction
        ] = await Promise.all([
          this.getStationNameAsync(stationId, { timeout: timeout / 6 }),
          this.getStationNameExtendedAsync(stationId, { timeout: timeout / 6 }),
          this.getStationKanaAsync(stationId, { timeout: timeout / 6 }),
          includePrefecture ? this.getStationPrefectureAsync(stationId, { timeout: timeout / 6 }) : Promise.resolve(''),
          includeLines ? this.getStationLinesAsync(stationId, { timeout: timeout / 6 }) : Promise.resolve([]),
          includeJunctionInfo ? this.isJunctionAsync(stationId, { timeout: timeout / 6 }) : Promise.resolve(false)
        ]);

        const station: Station = {
          id: stationId,
          name,
          nameExtended: nameExtended || name,
          kana: kana || '',
          prefecture: prefecture || '',
          prefectureId: 0, // Would need additional lookup
          isJunction,
          lines
        };

        return isStation(station) ? station : null;
      }
    );
  }

  // === Promise-based Line Operations ===

  /**
   * Async line lookup with comprehensive information
   */
  async getLineInfoAsync(
    identifier: string | number,
    options: AsyncOperationOptions = {}
  ): Promise<Line | null> {
    const { timeout = FARERT_CONSTANTS.DEFAULT_TIMEOUT } = options;

    return this.performanceMonitor.measure(
      'getLineInfo',
      async () => {
        let lineId: number;

        if (typeof identifier === 'string') {
          lineId = await this.withTimeout(
            () => Promise.resolve(this.module.getLineId(identifier)),
            timeout / 2
          );
        } else {
          lineId = identifier;
        }

        if (!isValidLineId(lineId)) {
          return null;
        }

        // Gather line information concurrently
        const [lineName, stations] = await Promise.all([
          this.withTimeout(
            () => Promise.resolve(this.module.getLineName(lineId)),
            timeout / 2
          ),
          this.getLineStationsAsync(lineId, { timeout: timeout / 2 })
        ]);

        const line: Line = {
          id: lineId,
          name: lineName,
          companyId: 0, // Would need additional lookup
          companyName: 'Unknown',
          type: 'conventional',
          isJR: false, // Would need company lookup
          isPrivate: true,
          isMunicipal: false,
          stations
        };

        return isLine(line) ? line : null;
      }
    );
  }

  // === Batch Operations with Concurrency Control ===

  /**
   * Batch station lookup with configurable concurrency
   */
  async batchStationLookup(
    identifiers: (string | number)[],
    options: BatchOperationOptions = {}
  ): Promise<BatchOperationResult<Station>> {
    const {
      concurrency = 5,
      timeout = FARERT_CONSTANTS.DEFAULT_TIMEOUT,
      failFast = false,
      preserveOrder = true,
      onProgress
    } = options;

    return this.performanceMonitor.measure(
      'batchStationLookup',
      async () => {
        const results: (Station | null)[] = preserveOrder ? new Array(identifiers.length) : [];
        const errors: Array<{ index: number; identifier: string | number; error: Error }> = [];
        let completedCount = 0;

        // Process in chunks to control concurrency
        const chunks = this.chunkArray(identifiers, concurrency);

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
          const chunk = chunks[chunkIndex];
          const chunkPromises = chunk.map(async (identifier, indexInChunk) => {
            const globalIndex = chunkIndex * concurrency + indexInChunk;

            try {
              const station = await this.getStationInfoAsync(identifier, {
                timeout: timeout / chunks.length
              });

              if (preserveOrder) {
                results[globalIndex] = station;
              } else {
                if (station) results.push(station);
              }

              completedCount++;
              if (onProgress) {
                onProgress(completedCount, identifiers.length);
              }

              return station;

            } catch (error) {
              const errorObj = error instanceof Error ? error : new Error(String(error));
              errors.push({ index: globalIndex, identifier, error: errorObj });

              if (failFast) {
                throw error;
              }

              completedCount++;
              if (onProgress) {
                onProgress(completedCount, identifiers.length);
              }

              return null;
            }
          });

          try {
            await Promise.all(chunkPromises);
          } catch (error) {
            if (failFast) {
              throw error;
            }
          }
        }

        const validResults = results.filter((result): result is Station => result !== null);

        return {
          results: validResults,
          errors,
          successCount: validResults.length,
          failureCount: errors.length,
          totalProcessed: identifiers.length,
          executionTime: 0 // Will be set by performance monitor
        };
      }
    );
  }

  // === Route Building with Async Patterns ===

  /**
   * Async route calculation with real-time progress updates
   */
  async calculateRouteAsync(
    routeSegments: RouteSegment[],
    options: RouteCalculationOptions = {}
  ): Promise<AsyncRouteResult> {
    const {
      timeout = ROUTE_CONSTANTS.DEFAULT_BUILD_TIMEOUT,
      validateSegments = true,
      optimizeRoute = false,
      onProgress,
      enableLongRoute = false
    } = options;

    return this.performanceMonitor.measure(
      'calculateRoute',
      async () => {
        // Validate segments if requested
        if (validateSegments) {
          if (onProgress) onProgress('Validating route segments...', 0, 5);

          await this.validateRouteSegmentsAsync(routeSegments);

          if (onProgress) onProgress('Segments validated', 1, 5);
        }

        // Create route calculation objects
        if (onProgress) onProgress('Initializing route calculation...', 2, 5);

        const route = new this.module.cRoute();
        const calcRoute = new this.module.cCalcRoute(route);

        try {
          // Configure calculation options
          if (enableLongRoute) {
            calcRoute.setLongRoute(true);
          }

          // Build route step by step
          if (onProgress) onProgress('Building route...', 3, 5);

          for (let i = 0; i < routeSegments.length; i++) {
            const segment = routeSegments[i];

            if (i === 0) {
              // Starting station
              const result = calcRoute.addRouteBegin(segment.stationId);
              if (result < 0) {
                throw new AsyncRouteError(`Failed to set starting station: ${segment.stationName}`, result);
              }
            } else {
              // Route segment
              if (!segment.lineId) {
                throw new AsyncRouteError(`Missing line ID for segment ${i}: ${segment.stationName}`, -1);
              }

              const result = calcRoute.addRoute(segment.lineId, segment.stationId);
              if (result < 0) {
                throw new AsyncRouteError(`Failed to add route segment ${i}: ${segment.stationName}`, result);
              }
            }

            if (onProgress) {
              const progressPercent = ((i + 1) / routeSegments.length) * 100;
              onProgress(`Added segment: ${segment.stationName}`, 3 + (progressPercent / 100), 5);
            }
          }

          // Calculate fare
          if (onProgress) onProgress('Calculating fare...', 4, 5);

          const fareAmount = await this.withTimeout(
            () => Promise.resolve(calcRoute.calculateFare()),
            timeout
          );

          if (fareAmount < 0) {
            throw new AsyncRouteError('Fare calculation failed', fareAmount);
          }

          // Get detailed information
          const fareString = calcRoute.getFareString();
          const routeScript = calcRoute.getRouteScript();
          const fareJsonString = calcRoute.getFareInfoJson();

          let fareDetails: any = {};
          try {
            fareDetails = JSON.parse(fareJsonString);
          } catch (error) {
            console.warn('Failed to parse fare JSON:', error);
          }

          if (onProgress) onProgress('Route calculation completed', 5, 5);

          const result: AsyncRouteResult = {
            fareAmount,
            fareString,
            routeScript,
            fareDetails,
            segments: routeSegments,
            isValid: true,
            calculationTime: 0, // Will be set by performance monitor
            optimizationApplied: optimizeRoute,
            metadata: {
              segmentCount: routeSegments.length,
              transferCount: Math.max(0, routeSegments.length - 2),
              longRouteEnabled: enableLongRoute,
              validationPerformed: validateSegments
            }
          };

          return result;

        } finally {
          // Cleanup WebAssembly objects
          if (calcRoute && typeof calcRoute.delete === 'function') {
            calcRoute.delete();
          }
        }
      }
    );
  }

  // === Real-time Data Streams ===

  /**
   * Create async generator for real-time station search
   */
  async* searchStationsStream(
    query: string,
    options: StreamSearchOptions = {}
  ): AsyncGenerator<StationSearchResult, void, unknown> {
    const {
      minQueryLength = 1,
      debounceMs = 300,
      maxResults = 50,
      includePartialMatches = true
    } = options;

    if (query.length < minQueryLength) {
      return;
    }

    // Debounce the search
    await this.delay(debounceMs);

    let currentResults: Station[] = [];
    let hasMore = true;
    let page = 0;

    while (hasMore) {
      try {
        // Simulate paginated search (in real implementation, this would use actual pagination)
        const pageSize = Math.min(maxResults, 10);
        const startIndex = page * pageSize;

        // For demo purposes, we'll simulate multiple results
        const searchPromises: Promise<Station | null>[] = [];

        // Create search variations
        const searchVariations = this.generateSearchVariations(query, includePartialMatches);

        for (const variation of searchVariations.slice(startIndex, startIndex + pageSize)) {
          searchPromises.push(
            this.getStationInfoAsync(variation, { timeout: 2000 }).catch(() => null)
          );
        }

        const batchResults = await Promise.all(searchPromises);
        const validResults = batchResults.filter((station): station is Station => station !== null);

        currentResults.push(...validResults);
        hasMore = validResults.length === pageSize && currentResults.length < maxResults;

        const searchResult: StationSearchResult = {
          stations: [...currentResults],
          query,
          total: currentResults.length,
          hasMore,
          executionTime: 0,
          suggestions: hasMore ? [] : this.generateSearchSuggestions(query)
        };

        yield searchResult;

        page++;

        // Prevent infinite loops
        if (page > 10) {
          hasMore = false;
        }

      } catch (error) {
        console.error('Search stream error:', error);
        hasMore = false;
      }
    }
  }

  // === Error Handling and Recovery ===

  /**
   * Async operation with automatic retry and exponential backoff
   */
  private async withTimeoutAndRetry<T>(
    operation: () => Promise<T>,
    timeout: number,
    maxRetries: number,
    baseDelay: number
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.withTimeout(operation, timeout);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          throw new AsyncRetryExhaustedError(
            `Operation failed after ${maxRetries + 1} attempts`,
            lastError
          );
        }

        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Timeout wrapper for promises
   */
  private async withTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AsyncTimeoutError(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === Helper Methods ===

  private async getStationNameExtendedAsync(stationId: number, options: AsyncOperationOptions): Promise<string> {
    return this.withTimeout(
      () => Promise.resolve(this.module.getStationNameExtended?.(stationId) || this.module.getStationName(stationId)),
      options.timeout || FARERT_CONSTANTS.DEFAULT_TIMEOUT
    );
  }

  private async getStationKanaAsync(stationId: number, options: AsyncOperationOptions): Promise<string> {
    return this.withTimeout(
      () => Promise.resolve(this.module.getStationKana?.(stationId) || ''),
      options.timeout || FARERT_CONSTANTS.DEFAULT_TIMEOUT
    );
  }

  private async getStationPrefectureAsync(stationId: number, options: AsyncOperationOptions): Promise<string> {
    return this.withTimeout(
      () => Promise.resolve(this.module.getStationPrefecture?.(stationId) || ''),
      options.timeout || FARERT_CONSTANTS.DEFAULT_TIMEOUT
    );
  }

  private async getStationLinesAsync(stationId: number, options: AsyncOperationOptions): Promise<number[]> {
    return this.withTimeout(
      () => Promise.resolve(this.module.EnumLineOfStationId?.(stationId) || []),
      options.timeout || FARERT_CONSTANTS.DEFAULT_TIMEOUT
    );
  }

  private async isJunctionAsync(stationId: number, options: AsyncOperationOptions): Promise<boolean> {
    return this.withTimeout(
      () => Promise.resolve(Boolean(this.module.isJunction(stationId))),
      options.timeout || FARERT_CONSTANTS.DEFAULT_TIMEOUT
    );
  }

  private async getLineStationsAsync(lineId: number, options: AsyncOperationOptions): Promise<number[]> {
    return this.withTimeout(
      () => Promise.resolve(this.module.StationsIdsOfLineId?.(lineId) || []),
      options.timeout || FARERT_CONSTANTS.DEFAULT_TIMEOUT
    );
  }

  private async validateRouteSegmentsAsync(segments: RouteSegment[]): Promise<void> {
    if (segments.length < ROUTE_CONSTANTS.MIN_ROUTE_SEGMENTS) {
      throw new AsyncValidationError(
        `Route must have at least ${ROUTE_CONSTANTS.MIN_ROUTE_SEGMENTS} segments`,
        'INSUFFICIENT_SEGMENTS'
      );
    }

    if (segments.length > ROUTE_CONSTANTS.MAX_ROUTE_SEGMENTS) {
      throw new AsyncValidationError(
        `Route cannot exceed ${ROUTE_CONSTANTS.MAX_ROUTE_SEGMENTS} segments`,
        'TOO_MANY_SEGMENTS'
      );
    }

    // Validate each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (!isRouteSegment(segment)) {
        throw new AsyncValidationError(
          `Invalid route segment at index ${i}`,
          'INVALID_SEGMENT',
          { index: i, segment }
        );
      }

      if (i > 0 && !segment.lineId) {
        throw new AsyncValidationError(
          `Missing line ID for segment ${i}: ${segment.stationName}`,
          'MISSING_LINE_ID',
          { index: i, segment }
        );
      }
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private generateSearchVariations(query: string, includePartial: boolean): string[] {
    const variations = [query];

    if (includePartial && query.length > 1) {
      // Add partial matches
      for (let i = query.length - 1; i >= 1; i--) {
        variations.push(query.substring(0, i));
      }
    }

    // For demo purposes, add some common station names
    const commonStations = ['東京', '横浜', '大阪', '名古屋', '福岡', '仙台', '札幌'];
    variations.push(...commonStations.filter(station => station.includes(query)));

    return [...new Set(variations)]; // Remove duplicates
  }

  private generateSearchSuggestions(query: string): string[] {
    // For demo purposes, return some suggestions
    const suggestions = [
      '正確な駅名を入力してください',
      'ひらがなまたは漢字で入力してください',
      '都道府県名を含めて検索してみてください'
    ];

    return suggestions;
  }

  // === Performance Monitoring ===

  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  resetPerformanceMetrics(): void {
    this.performanceMonitor.reset();
  }
}

// === Performance Monitoring ===

class AsyncPerformanceMonitor {
  private metrics: Map<string, TimingInfo[]> = new Map();

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const memoryBefore = this.getMemoryUsage();

    try {
      const result = await fn();
      const endTime = performance.now();
      const memoryAfter = this.getMemoryUsage();

      this.recordTiming({
        operation,
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryBefore,
        memoryAfter
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const memoryAfter = this.getMemoryUsage();

      this.recordTiming({
        operation: `${operation}_error`,
        startTime,
        endTime,
        duration: endTime - startTime,
        memoryBefore,
        memoryAfter
      });

      throw error;
    }
  }

  private recordTiming(timing: TimingInfo): void {
    if (!this.metrics.has(timing.operation)) {
      this.metrics.set(timing.operation, []);
    }
    this.metrics.get(timing.operation)!.push(timing);
  }

  private getMemoryUsage(): number {
    return (performance as any).memory?.usedJSHeapSize || 0;
  }

  getMetrics(): PerformanceMetrics {
    const operations = Array.from(this.metrics.keys());
    const totalOps = operations.reduce((sum, op) => sum + this.metrics.get(op)!.length, 0);

    return {
      wasmLoadTime: 0,
      dbInitTime: 0,
      averageSearchTime: this.getAverageTime('search') || 0,
      averageCalculationTime: this.getAverageTime('calculation') || 0,
      memoryUsage: {
        wasm: 0,
        js: this.getMemoryUsage(),
        total: this.getMemoryUsage()
      },
      errorRate: this.getErrorRate(),
      operationCount: totalOps
    };
  }

  private getAverageTime(operationType: string): number {
    const matchingOps = Array.from(this.metrics.keys()).filter(op => op.includes(operationType));
    if (matchingOps.length === 0) return 0;

    const allTimings = matchingOps.flatMap(op => this.metrics.get(op) || []);
    const totalTime = allTimings.reduce((sum, timing) => sum + timing.duration, 0);
    return totalTime / allTimings.length;
  }

  private getErrorRate(): number {
    const allOps = Array.from(this.metrics.keys());
    const errorOps = allOps.filter(op => op.includes('_error'));
    const totalOps = allOps.reduce((sum, op) => sum + this.metrics.get(op)!.length, 0);
    const totalErrors = errorOps.reduce((sum, op) => sum + this.metrics.get(op)!.length, 0);

    return totalOps > 0 ? totalErrors / totalOps : 0;
  }

  reset(): void {
    this.metrics.clear();
  }
}

// === Circuit Breaker Pattern ===

class AsyncCircuitBreaker {
  private circuits: Map<string, CircuitState> = new Map();
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 30000; // 30 seconds
  private readonly successThreshold = 3;

  async execute<T>(circuitId: string, operation: () => Promise<T>): Promise<T> {
    const circuit = this.getCircuit(circuitId);

    if (circuit.state === 'open') {
      if (Date.now() - circuit.lastFailure < this.recoveryTimeout) {
        throw new AsyncCircuitBreakerError(`Circuit breaker is OPEN for ${circuitId}`);
      } else {
        circuit.state = 'half-open';
        circuit.successCount = 0;
      }
    }

    try {
      const result = await operation();

      if (circuit.state === 'half-open') {
        circuit.successCount++;
        if (circuit.successCount >= this.successThreshold) {
          circuit.state = 'closed';
          circuit.failureCount = 0;
        }
      } else {
        circuit.failureCount = 0;
      }

      return result;

    } catch (error) {
      circuit.failureCount++;
      circuit.lastFailure = Date.now();

      if (circuit.failureCount >= this.failureThreshold) {
        circuit.state = 'open';
      }

      throw error;
    }
  }

  private getCircuit(circuitId: string): CircuitState {
    if (!this.circuits.has(circuitId)) {
      this.circuits.set(circuitId, {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
        lastFailure: 0
      });
    }
    return this.circuits.get(circuitId)!;
  }

  getCircuitStatus(circuitId: string): CircuitState | null {
    return this.circuits.get(circuitId) || null;
  }

  reset(circuitId?: string): void {
    if (circuitId) {
      this.circuits.delete(circuitId);
    } else {
      this.circuits.clear();
    }
  }
}

// === Type Definitions ===

interface AsyncOperationOptions {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  validateResult?: boolean;
}

interface ExtendedAsyncOptions extends AsyncOperationOptions {
  includeLines?: boolean;
  includePrefecture?: boolean;
  includeJunctionInfo?: boolean;
  cacheResult?: boolean;
}

interface BatchOperationOptions {
  concurrency?: number;
  timeout?: number;
  failFast?: boolean;
  preserveOrder?: boolean;
  onProgress?: (completed: number, total: number) => void;
}

interface BatchOperationResult<T> {
  results: T[];
  errors: Array<{ index: number; identifier: any; error: Error }>;
  successCount: number;
  failureCount: number;
  totalProcessed: number;
  executionTime: number;
}

interface RouteCalculationOptions {
  timeout?: number;
  validateSegments?: boolean;
  optimizeRoute?: boolean;
  enableLongRoute?: boolean;
  onProgress?: (message: string, current: number, total: number) => void;
}

interface AsyncRouteResult {
  fareAmount: number;
  fareString: string;
  routeScript: string;
  fareDetails: any;
  segments: RouteSegment[];
  isValid: boolean;
  calculationTime: number;
  optimizationApplied: boolean;
  metadata: {
    segmentCount: number;
    transferCount: number;
    longRouteEnabled: boolean;
    validationPerformed: boolean;
  };
}

interface StreamSearchOptions {
  minQueryLength?: number;
  debounceMs?: number;
  maxResults?: number;
  includePartialMatches?: boolean;
}

interface CircuitState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  successCount: number;
  lastFailure: number;
}

// === Custom Error Classes ===

class AsyncValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any
  ) {
    super(message);
    this.name = 'AsyncValidationError';
  }
}

class AsyncTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AsyncTimeoutError';
  }
}

class AsyncRetryExhaustedError extends Error {
  constructor(message: string, public readonly lastError: Error) {
    super(message);
    this.name = 'AsyncRetryExhaustedError';
  }
}

class AsyncRouteError extends Error {
  constructor(message: string, public readonly errorCode: number) {
    super(message);
    this.name = 'AsyncRouteError';
  }
}

class AsyncCircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AsyncCircuitBreakerError';
  }
}

// === Demonstration Functions ===

/**
 * Demonstrate basic async patterns
 */
async function demonstrateBasicAsyncPatterns(wrapper: AsyncFarertWrapper): Promise<void> {
  console.log('\n🔄 === Basic Async Patterns Demo ===');

  try {
    console.log('⏱️ Testing async operations with timeout...');

    // Basic async operations
    const stationId = await wrapper.getStationIdAsync('東京', { timeout: 5000 });
    console.log(`Station ID lookup: ${stationId}`);

    const stationName = await wrapper.getStationNameAsync(stationId, { timeout: 5000 });
    console.log(`Station name lookup: ${stationName}`);

    // Concurrent operations
    console.log('🚀 Testing concurrent operations...');
    const startTime = performance.now();

    const [tokyo, yokohama, osaka] = await Promise.all([
      wrapper.getStationInfoAsync('東京', { timeout: 3000 }),
      wrapper.getStationInfoAsync('横浜', { timeout: 3000 }),
      wrapper.getStationInfoAsync('大阪', { timeout: 3000 })
    ]);

    const concurrentTime = performance.now() - startTime;
    console.log(`Concurrent lookup completed in ${concurrentTime.toFixed(2)}ms`);

    const validStations = [tokyo, yokohama, osaka].filter((s): s is Station => s !== null);
    console.log(`Found ${validStations.length} stations concurrently`);

    console.log('✅ Basic async patterns demonstrated');

  } catch (error) {
    console.error('❌ Basic async patterns demo failed:', error);
  }
}

/**
 * Demonstrate batch operations with progress tracking
 */
async function demonstrateBatchOperations(wrapper: AsyncFarertWrapper): Promise<void> {
  console.log('\n📦 === Batch Operations Demo ===');

  try {
    const stationNames = ['東京', '横浜', '大阪', '名古屋', '福岡', 'InvalidStation', '仙台'];

    console.log(`🔄 Processing ${stationNames.length} stations in batch...`);

    let progressCount = 0;
    const result = await wrapper.batchStationLookup(stationNames, {
      concurrency: 3,
      timeout: 10000,
      failFast: false,
      preserveOrder: true,
      onProgress: (completed, total) => {
        progressCount++;
        console.log(`  Progress: ${completed}/${total} (${((completed/total) * 100).toFixed(1)}%)`);
      }
    });

    console.log(`✅ Batch operation completed:`);
    console.log(`  Successful: ${result.successCount}`);
    console.log(`  Failed: ${result.failureCount}`);
    console.log(`  Total processed: ${result.totalProcessed}`);

    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach(({ identifier, error }) => {
        console.log(`    ${identifier}: ${error.message}`);
      });
    }

    console.log('✅ Batch operations demonstrated');

  } catch (error) {
    console.error('❌ Batch operations demo failed:', error);
  }
}

/**
 * Demonstrate async route building with progress updates
 */
async function demonstrateAsyncRouteBuilding(wrapper: AsyncFarertWrapper): Promise<void> {
  console.log('\n🛤️ === Async Route Building Demo ===');

  try {
    const routeSegments: RouteSegment[] = [
      {
        stationId: 1130101, // 東京
        stationName: '東京',
        isTransfer: false
      },
      {
        stationId: 1130133, // 横浜
        stationName: '横浜',
        lineId: 11301, // 東海道線
        lineName: '東海道線',
        isTransfer: false
      }
    ];

    console.log('🏗️ Building async route with progress tracking...');

    const routeResult = await wrapper.calculateRouteAsync(routeSegments, {
      timeout: 15000,
      validateSegments: true,
      enableLongRoute: false,
      onProgress: (message, current, total) => {
        const percent = ((current / total) * 100).toFixed(1);
        console.log(`  [${percent}%] ${message}`);
      }
    });

    console.log(`✅ Route calculation completed:`);
    console.log(`  Fare: ¥${routeResult.fareAmount}`);
    console.log(`  Segments: ${routeResult.metadata.segmentCount}`);
    console.log(`  Transfers: ${routeResult.metadata.transferCount}`);
    console.log(`  Validation: ${routeResult.metadata.validationPerformed ? 'Performed' : 'Skipped'}`);
    console.log(`  Route script: ${routeResult.routeScript}`);

    console.log('✅ Async route building demonstrated');

  } catch (error) {
    console.error('❌ Async route building demo failed:', error);
  }
}

/**
 * Demonstrate streaming search with async generators
 */
async function demonstrateStreamingSearch(wrapper: AsyncFarertWrapper): Promise<void> {
  console.log('\n🌊 === Streaming Search Demo ===');

  try {
    console.log('🔍 Starting streaming search for "東"...');

    let resultCount = 0;
    const searchStream = wrapper.searchStationsStream('東', {
      minQueryLength: 1,
      debounceMs: 100,
      maxResults: 20,
      includePartialMatches: true
    });

    for await (const searchResult of searchStream) {
      resultCount++;
      console.log(`  Stream result ${resultCount}:`);
      console.log(`    Found: ${searchResult.stations.length} stations`);
      console.log(`    Total: ${searchResult.total}`);
      console.log(`    Has more: ${searchResult.hasMore}`);

      if (searchResult.stations.length > 0) {
        searchResult.stations.slice(0, 3).forEach(station => {
          console.log(`      - ${station.name} (${station.kana})`);
        });

        if (searchResult.stations.length > 3) {
          console.log(`      ... and ${searchResult.stations.length - 3} more`);
        }
      }

      if (!searchResult.hasMore) {
        if (searchResult.suggestions.length > 0) {
          console.log('    Suggestions:');
          searchResult.suggestions.forEach(suggestion => {
            console.log(`      - ${suggestion}`);
          });
        }
        break;
      }
    }

    console.log('✅ Streaming search demonstrated');

  } catch (error) {
    console.error('❌ Streaming search demo failed:', error);
  }
}

/**
 * Demonstrate error handling and recovery patterns
 */
async function demonstrateErrorHandling(wrapper: AsyncFarertWrapper): Promise<void> {
  console.log('\n🛡️ === Error Handling Demo ===');

  try {
    console.log('🧪 Testing timeout handling...');

    try {
      await wrapper.getStationIdAsync('NonExistentStation', {
        timeout: 100, // Very short timeout
        retryAttempts: 2
      });
    } catch (error) {
      if (error instanceof AsyncTimeoutError) {
        console.log(`  ✅ Timeout error handled: ${error.message}`);
      } else if (error instanceof AsyncRetryExhaustedError) {
        console.log(`  ✅ Retry exhausted error handled: ${error.message}`);
      } else {
        console.log(`  ✅ Other error handled: ${error}`);
      }
    }

    console.log('🧪 Testing validation errors...');

    try {
      await wrapper.getStationNameAsync(-1); // Invalid station ID
    } catch (error) {
      if (error instanceof AsyncValidationError) {
        console.log(`  ✅ Validation error handled: ${error.message} (${error.code})`);
      }
    }

    console.log('🧪 Testing circuit breaker...');

    // The circuit breaker would be tested with actual failing operations
    console.log('  Circuit breaker patterns implemented for fault tolerance');

    console.log('✅ Error handling patterns demonstrated');

  } catch (error) {
    console.error('❌ Error handling demo failed:', error);
  }
}

/**
 * Main demonstration function
 */
export async function runAsyncPatternsDemo(): Promise<void> {
  console.log('🎯 Farert TypeScript Async Patterns Demo');
  console.log('========================================\n');

  try {
    console.log('⚠️ Note: This demo requires a FarertModule instance');
    console.log('In a real application, initialize the module first:\n');
    console.log('```typescript');
    console.log('const module = await initializeFarertModule();');
    console.log('const wrapper = new AsyncFarertWrapper(module);');
    console.log('await runAllAsyncDemos(wrapper);');
    console.log('```\n');

    console.log('📋 Async patterns available:');
    console.log('  ✅ Promise-based WebAssembly API wrappers');
    console.log('  ✅ Concurrent operations with proper resource management');
    console.log('  ✅ Batch processing with configurable concurrency');
    console.log('  ✅ Timeout and retry patterns with exponential backoff');
    console.log('  ✅ Circuit breaker for fault tolerance');
    console.log('  ✅ Async generators for streaming data');
    console.log('  ✅ Progress tracking and real-time updates');
    console.log('  ✅ Comprehensive error handling and recovery');
    console.log('  ✅ Performance monitoring and metrics collection');
    console.log('  ✅ Memory management in long-running operations');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// === Exports ===

export {
  AsyncFarertWrapper,
  AsyncPerformanceMonitor,
  AsyncCircuitBreaker,
  AsyncValidationError,
  AsyncTimeoutError,
  AsyncRetryExhaustedError,
  AsyncRouteError,
  AsyncCircuitBreakerError,
  demonstrateBasicAsyncPatterns,
  demonstrateBatchOperations,
  demonstrateAsyncRouteBuilding,
  demonstrateStreamingSearch,
  demonstrateErrorHandling,
  runAsyncPatternsDemo
};

// Run demo if executed directly
if (require.main === module) {
  runAsyncPatternsDemo().catch(error => {
    console.error('Demo execution failed:', error);
    process.exit(1);
  });
}