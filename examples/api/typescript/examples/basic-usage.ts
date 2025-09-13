/**
 * Basic TypeScript Usage Example for Farert WebAssembly Module
 *
 * This example demonstrates fundamental TypeScript integration patterns
 * with the Farert WebAssembly module, showcasing type safety, proper
 * error handling, and memory management.
 *
 * Key Learning Points:
 * - Type-safe WebAssembly module initialization
 * - Proper async/await patterns with error handling
 * - Memory management with automatic cleanup
 * - Type guards and validation
 * - Performance monitoring and debugging
 *
 * Prerequisites: Basic TypeScript knowledge, understanding of async/await
 */

import {
  FarertModule,
  FarertError,
  StationInfo,
  LineInfo,
  RouteSegment,
  FareInfo,
  PerformanceMetrics,
  FARERT_CONSTANTS,
  isFarertModule,
  isValidStationId,
  isValidLineId
} from '../types/farert';
import { Station, isStation } from '../types/station-types';
import { Line, isLine } from '../types/line-types';
import { RouteValidationResult, isRouteSegment } from '../types/route-types';

// === Module Loading and Initialization ===

/**
 * Load and initialize the Farert WebAssembly module with proper type safety
 *
 * This function demonstrates:
 * - Proper module loading with timeout handling
 * - Type checking and validation
 * - Performance monitoring
 * - Error handling with specific error types
 */
async function initializeFarertModule(): Promise<FarertModule> {
  console.log('🚀 Initializing Farert WebAssembly Module...');

  const startTime = performance.now();
  let module: any;

  try {
    // Dynamically import the module (adjust path as needed for your setup)
    const moduleFactory = await import('../../../cli/dist/farert.js');

    // Initialize WebAssembly module with timeout
    const initPromise = moduleFactory.default();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Module initialization timeout')), FARERT_CONSTANTS.DEFAULT_TIMEOUT);
    });

    module = await Promise.race([initPromise, timeoutPromise]);

    // Type safety check - ensure we have a valid Farert module
    if (!isFarertModule(module)) {
      throw new Error('Invalid Farert module - missing required functions');
    }

    // Initialize database
    const dbInitialized = module.openDatabase();
    if (!dbInitialized) {
      throw new Error('Failed to initialize railway database');
    }

    const loadTime = performance.now() - startTime;
    console.log(`✅ Module initialized successfully in ${loadTime.toFixed(2)}ms`);

    // Log module information
    const dbVersion = module.getDatabaseVersion();
    console.log(`📊 Database version: ${dbVersion}`);

    return module;

  } catch (error) {
    const loadTime = performance.now() - startTime;
    console.error(`❌ Module initialization failed after ${loadTime.toFixed(2)}ms:`, error);

    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('💡 Try checking your network connection or increasing the timeout');
      } else if (error.message.includes('WebAssembly')) {
        console.error('💡 Ensure your environment supports WebAssembly');
      }
    }

    throw error;
  }
}

// === Station Operations with Type Safety ===

/**
 * Demonstrate type-safe station lookup operations
 *
 * Features:
 * - Input validation with type guards
 * - Multiple lookup methods (ID → name, name → ID)
 * - Error handling with specific error codes
 * - Return type annotations for better IntelliSense
 */
async function demonstrateStationOperations(module: FarertModule): Promise<void> {
  console.log('\n🚉 === Station Operations Demo ===');

  try {
    // Station name to ID lookup with validation
    const stationName = '東京';
    console.log(`🔍 Looking up station ID for: ${stationName}`);

    const stationId = module.getStationId(stationName);

    // Type-safe validation
    if (!isValidStationId(stationId)) {
      const error: FarertError = new Error(`Station not found: ${stationName}`) as FarertError;
      error.code = FARERT_CONSTANTS.STATION_NOT_FOUND;
      throw error;
    }

    console.log(`📍 Station ID: ${stationId}`);

    // ID to name lookup with extended information
    const foundStationName = module.getStationName(stationId);
    const stationKana = module.getStationKana?.(stationId) || 'N/A';
    const stationPrefecture = module.getStationPrefecture?.(stationId) || 'N/A';

    // Create properly typed station object
    const station: Station = {
      id: stationId,
      name: foundStationName,
      nameExtended: module.getStationNameExtended?.(stationId) || foundStationName,
      kana: stationKana,
      prefecture: stationPrefecture,
      prefectureId: 0, // Would need additional lookup
      isJunction: Boolean(module.isJunction(stationId)),
      lines: module.EnumLineOfStationId?.(stationId) || []
    };

    // Verify our station object is properly typed
    if (isStation(station)) {
      console.log(`✅ Station Details:`);
      console.log(`   Name: ${station.name} (${station.kana})`);
      console.log(`   Prefecture: ${station.prefecture}`);
      console.log(`   Junction: ${station.isJunction ? 'Yes' : 'No'}`);
      console.log(`   Lines: ${station.lines.length} lines`);
    }

    // Demonstrate batch operations with proper typing
    const testStations = ['横浜', '大阪', '名古屋'];
    const stationResults: (Station | null)[] = await Promise.all(
      testStations.map(async (name): Promise<Station | null> => {
        try {
          const id = module.getStationId(name);
          if (!isValidStationId(id)) return null;

          return {
            id,
            name: module.getStationName(id),
            nameExtended: module.getStationNameExtended?.(id) || module.getStationName(id),
            kana: module.getStationKana?.(id) || '',
            prefecture: module.getStationPrefecture?.(id) || '',
            prefectureId: 0,
            isJunction: Boolean(module.isJunction(id)),
            lines: module.EnumLineOfStationId?.(id) || []
          };
        } catch (error) {
          console.warn(`⚠️ Failed to lookup station: ${name}`, error);
          return null;
        }
      })
    );

    const validStations = stationResults.filter((s): s is Station => s !== null);
    console.log(`📊 Batch lookup completed: ${validStations.length}/${testStations.length} found`);

  } catch (error) {
    console.error('❌ Station operations failed:', error);

    // Type-safe error handling
    if (error instanceof Error && 'code' in error) {
      const fareError = error as FarertError;
      switch (fareError.code) {
        case FARERT_CONSTANTS.STATION_NOT_FOUND:
          console.error('💡 Try using exact Japanese station names');
          break;
        case FARERT_CONSTANTS.DATABASE_ERROR:
          console.error('💡 Database may not be properly initialized');
          break;
        default:
          console.error('💡 Unexpected error occurred');
      }
    }
  }
}

// === Route Building with Type Safety ===

/**
 * Demonstrate type-safe route construction and fare calculation
 *
 * Features:
 * - Step-by-step route building with validation
 * - Type-safe route segments
 * - Fare calculation with detailed breakdown
 * - Performance monitoring
 * - Memory management
 */
async function demonstrateRouteBuilding(module: FarertModule): Promise<void> {
  console.log('\n🛤️ === Route Building Demo ===');

  let calcRoute: any = null;
  const performanceStart = performance.now();

  try {
    // Create route calculation object with type safety
    const route = new module.cRoute();
    calcRoute = new module.cCalcRoute(route);

    console.log('🏗️ Building route: 東京 → 東海道線 → 横浜');

    // Step 1: Set starting station
    const tokyoId = module.getStationId('東京');
    if (!isValidStationId(tokyoId)) {
      throw new Error('Invalid starting station: 東京');
    }

    const result1 = calcRoute.addRouteBegin(tokyoId);
    if (result1 < 0) {
      throw new Error(`Failed to set starting station (error: ${result1})`);
    }
    console.log(`✅ Starting station set: 東京 (${tokyoId})`);

    // Step 2: Add route segment
    const tokaido = module.getLineId('東海道線');
    const yokohamaId = module.getStationId('横浜');

    if (!isValidLineId(tokaido) || !isValidStationId(yokohamaId)) {
      throw new Error('Invalid line or destination station');
    }

    const result2 = calcRoute.addRoute(tokaido, yokohamaId);
    if (result2 < 0) {
      throw new Error(`Failed to add route segment (error: ${result2})`);
    }
    console.log(`✅ Route segment added: 東海道線 to 横浜 (${yokohamaId})`);

    // Step 3: Calculate fare with performance monitoring
    const calcStart = performance.now();
    const fareAmount = calcRoute.calculateFare();
    const calcTime = performance.now() - calcStart;

    if (fareAmount < 0) {
      throw new Error(`Fare calculation failed (error: ${fareAmount})`);
    }

    console.log(`💰 Fare calculated: ¥${fareAmount} (${calcTime.toFixed(2)}ms)`);

    // Get detailed fare information
    const fareString = calcRoute.getFareString();
    const fareJsonString = calcRoute.getFareInfoJson();

    console.log(`📋 Fare details: ${fareString}`);

    // Parse and display JSON fare information with type safety
    try {
      const fareInfo = JSON.parse(fareJsonString);
      console.log(`📊 Detailed fare information available (${Object.keys(fareInfo).length} properties)`);

      if (fareInfo.isRule114Applied) {
        console.log('⚠️ Special fare rule 114 was applied');
      }

      if (fareInfo.availCountForFareOfStockDiscount > 0) {
        console.log(`🎫 ${fareInfo.availCountForFareOfStockDiscount} discount options available`);
      }
    } catch (jsonError) {
      console.warn('⚠️ Failed to parse fare JSON:', jsonError);
    }

    // Get route description
    const routeDescription = calcRoute.getRouteScript();
    console.log(`🗺️ Route description: ${routeDescription}`);

    const totalTime = performance.now() - performanceStart;
    console.log(`⏱️ Total route building time: ${totalTime.toFixed(2)}ms`);

  } catch (error) {
    console.error('❌ Route building failed:', error);

    if (error instanceof Error) {
      // Provide helpful suggestions based on error
      if (error.message.includes('station')) {
        console.error('💡 Verify station names are in Japanese');
      } else if (error.message.includes('line')) {
        console.error('💡 Check if the line connects the stations');
      } else if (error.message.includes('fare')) {
        console.error('💡 Route may be invalid or too complex');
      }
    }
  } finally {
    // Proper memory cleanup
    if (calcRoute && typeof calcRoute.delete === 'function') {
      calcRoute.delete();
      console.log('🧹 Memory cleaned up');
    }
  }
}

// === Advanced Type Safety Demonstrations ===

/**
 * Advanced type safety features and best practices
 *
 * Features:
 * - Custom type guards
 * - Union type handling
 * - Generic type parameters
 * - Conditional types
 * - Error boundary patterns
 */
async function demonstrateAdvancedTyping(module: FarertModule): Promise<void> {
  console.log('\n🧠 === Advanced TypeScript Features Demo ===');

  try {
    // Generic function for safe API calls
    async function safeApiCall<T>(
      operation: () => T,
      validator: (value: any) => value is T,
      fallback: T
    ): Promise<T> {
      try {
        const result = operation();
        return validator(result) ? result : fallback;
      } catch (error) {
        console.warn('API call failed, using fallback:', error);
        return fallback;
      }
    }

    // Type-safe station lookup with fallback
    const stationId = await safeApiCall(
      () => module.getStationId('東京'),
      (value): value is number => isValidStationId(value),
      -1
    );

    console.log(`🔧 Safe station lookup result: ${stationId}`);

    // Union type handling for multiple API versions
    type ApiResult = number | string | null;

    function processApiResult(result: ApiResult): string {
      if (typeof result === 'number') {
        return `Numeric result: ${result}`;
      } else if (typeof result === 'string') {
        return `String result: ${result}`;
      } else {
        return 'No result available';
      }
    }

    // Demonstrate type narrowing
    const apiResult: ApiResult = module.getStationName(stationId);
    console.log(`🎯 Processed API result: ${processApiResult(apiResult)}`);

    // Conditional type for flexible return values
    type ConditionalResult<T extends boolean> = T extends true ? Station : number;

    function flexibleStationLookup<T extends boolean>(
      name: string,
      fullInfo: T
    ): ConditionalResult<T> {
      const id = module.getStationId(name);

      if (fullInfo) {
        return {
          id,
          name: module.getStationName(id),
          nameExtended: module.getStationNameExtended?.(id) || module.getStationName(id),
          kana: module.getStationKana?.(id) || '',
          prefecture: module.getStationPrefecture?.(id) || '',
          prefectureId: 0,
          isJunction: Boolean(module.isJunction(id)),
          lines: module.EnumLineOfStationId?.(id) || []
        } as ConditionalResult<T>;
      } else {
        return id as ConditionalResult<T>;
      }
    }

    // Usage with type inference
    const stationInfo: Station = flexibleStationLookup('東京', true);
    const stationIdOnly: number = flexibleStationLookup('東京', false);

    console.log(`🧩 Flexible lookup - Full info: ${stationInfo.name}, ID only: ${stationIdOnly}`);

    // Error boundary pattern with types
    class TypedError extends Error {
      constructor(
        message: string,
        public readonly code: number,
        public readonly context?: Record<string, any>
      ) {
        super(message);
        this.name = 'TypedError';
      }
    }

    function withErrorBoundary<T>(operation: () => T): T | TypedError {
      try {
        return operation();
      } catch (error) {
        if (error instanceof Error) {
          return new TypedError(error.message, -1, { originalError: error });
        }
        return new TypedError('Unknown error occurred', -1);
      }
    }

    const boundaryResult = withErrorBoundary(() => module.getStationId('NonExistentStation'));

    if (boundaryResult instanceof TypedError) {
      console.log(`🛡️ Error boundary caught: ${boundaryResult.message} (code: ${boundaryResult.code})`);
    } else {
      console.log(`🛡️ Operation succeeded: ${boundaryResult}`);
    }

    console.log('✅ Advanced typing demonstration completed');

  } catch (error) {
    console.error('❌ Advanced typing demo failed:', error);
  }
}

// === Performance Monitoring and Debugging ===

/**
 * Performance monitoring utilities with type safety
 */
class TypedPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${operation}_error`, duration);
      throw error;
    }
  }

  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }

  getMetrics(): PerformanceMetrics {
    const operations = Array.from(this.metrics.keys());
    const totalOperations = operations.reduce(
      (sum, op) => sum + this.metrics.get(op)!.length,
      0
    );

    const averageTimes = new Map<string, number>();
    operations.forEach(op => {
      const times = this.metrics.get(op)!;
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      averageTimes.set(op, average);
    });

    return {
      wasmLoadTime: 0, // Would be set during initialization
      dbInitTime: 0,   // Would be set during initialization
      averageSearchTime: averageTimes.get('search') || 0,
      averageCalculationTime: averageTimes.get('calculation') || 0,
      memoryUsage: {
        wasm: 0,
        js: (performance as any).memory?.usedJSHeapSize || 0,
        total: (performance as any).memory?.totalJSHeapSize || 0
      },
      errorRate: 0,
      operationCount: totalOperations
    };
  }

  reset(): void {
    this.metrics.clear();
  }
}

// === Main Demo Function ===

/**
 * Main demonstration function that orchestrates all examples
 */
async function runBasicUsageDemo(): Promise<void> {
  console.log('🎯 Farert TypeScript Basic Usage Demo');
  console.log('=====================================\n');

  const monitor = new TypedPerformanceMonitor();

  try {
    // Initialize module
    const module = await monitor.measure('initialization', async () => {
      return await initializeFarertModule();
    });

    // Run demonstrations
    await monitor.measure('station_operations', async () => {
      await demonstrateStationOperations(module);
    });

    await monitor.measure('route_building', async () => {
      await demonstrateRouteBuilding(module);
    });

    await monitor.measure('advanced_typing', async () => {
      await demonstrateAdvancedTyping(module);
    });

    // Show performance metrics
    console.log('\n📊 === Performance Summary ===');
    const metrics = monitor.getMetrics();
    console.log(`Total operations: ${metrics.operationCount}`);
    console.log(`Average search time: ${metrics.averageSearchTime.toFixed(2)}ms`);
    console.log(`Average calculation time: ${metrics.averageCalculationTime.toFixed(2)}ms`);

    if (metrics.memoryUsage.js > 0) {
      console.log(`JS memory usage: ${(metrics.memoryUsage.js / 1024 / 1024).toFixed(2)}MB`);
    }

    // Cleanup
    if (module && typeof module.closeDatabase === 'function') {
      module.closeDatabase();
      console.log('🧹 Database connection closed');
    }

    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);

    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    console.log('\n📋 Final metrics:');
    const finalMetrics = monitor.getMetrics();
    Object.entries(finalMetrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        console.log(`  ${key}: ${value}`);
      }
    });
  }
}

// === Export for use in other modules ===

export {
  initializeFarertModule,
  demonstrateStationOperations,
  demonstrateRouteBuilding,
  demonstrateAdvancedTyping,
  TypedPerformanceMonitor,
  runBasicUsageDemo
};

// Run demo if this file is executed directly
if (require.main === module) {
  runBasicUsageDemo().catch(error => {
    console.error('Demo execution failed:', error);
    process.exit(1);
  });
}