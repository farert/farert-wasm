/**
 * Performance Monitoring and Memory Usage Tracking System
 * Task 12 - typescript-cli-interface specification
 * 
 * This module provides comprehensive performance monitoring capabilities for the CLI,
 * leveraging existing showTime function and TestOutputWriter infrastructure.
 * 
 * Requirements:
 * - REQ-CLI-002.5: CLI performance requirements
 * - CLI startup time < 2 seconds
 * - Test suite execution < 30 seconds for full suite  
 * - Memory usage < 512MB including WebAssembly heap
 * - Route calculation < 1 second for typical routes (up to 5 stations)
 */

import { MemoryUsageStats } from './types';
import { TestOutputWriter } from '../tests/cli/test_output';
import { configManager } from './config_manager';

// Performance timing markers
export interface PerformanceMarker {
  name: string;
  timestamp: number;
  memoryUsage: MemoryUsageStats;
  context?: Record<string, any>;
}

// Performance measurement result
export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  startMemory: MemoryUsageStats;
  endMemory: MemoryUsageStats;
  memoryDelta: MemoryUsageStats;
  passed: boolean;
  threshold: number;
  context?: Record<string, any>;
}

// Performance benchmark thresholds (requirements)
export interface PerformanceThresholds {
  cliStartup: number;        // 2000ms - CLI startup time
  testSuiteExecution: number; // 30000ms - Full test suite
  routeCalculation: number;   // 1000ms - Typical route calculation
  memoryLimit: number;        // 512MB - Total memory limit
  wasmHeapLimit: number;      // 256MB - WebAssembly heap limit
}

// Performance monitoring configuration
export interface PerformanceConfig {
  enabled: boolean;
  thresholds: PerformanceThresholds;
  detailedLogging: boolean;
  memoryMonitoring: boolean;
  outputToFile: boolean;
  autoCleanup: boolean;
}

// Default performance thresholds based on requirements
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  cliStartup: 2000,        // 2 seconds
  testSuiteExecution: 30000, // 30 seconds  
  routeCalculation: 1000,   // 1 second
  memoryLimit: 512 * 1024 * 1024, // 512MB in bytes
  wasmHeapLimit: 256 * 1024 * 1024 // 256MB in bytes
};

/**
 * Main Performance Monitor Class
 * Integrates with existing CLI infrastructure and provides comprehensive monitoring
 */
export class PerformanceMonitor {
  private markers: Map<string, PerformanceMarker> = new Map();
  private measurements: PerformanceMeasurement[] = [];
  private config: PerformanceConfig;
  private startupTime: number = Date.now();
  private peakMemoryUsage: MemoryUsageStats | null = null;
  
  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enabled: configManager.getConfiguration().debug || false,
      thresholds: DEFAULT_THRESHOLDS,
      detailedLogging: configManager.getConfiguration().verbose || false,
      memoryMonitoring: configManager.getConfiguration().memoryMonitoring,
      outputToFile: true,
      autoCleanup: true,
      ...config
    };
    
    if (this.config.enabled) {
      this.startPerformanceMonitoring();
    }
  }

  /**
   * Initialize performance monitoring with startup marker
   */
  private startPerformanceMonitoring(): void {
    this.mark('cli_startup_begin');
    
    if (this.config.detailedLogging) {
      console.log('[PERF] Performance monitoring initialized');
      console.log('[PERF] Thresholds:', this.config.thresholds);
    }
  }

  /**
   * Create a performance marker at current time with memory snapshot
   * Leverages existing memory monitoring from configManager
   */
  mark(name: string, context?: Record<string, any>): void {
    if (!this.config.enabled) return;

    const marker: PerformanceMarker = {
      name,
      timestamp: Date.now(),
      memoryUsage: configManager.getMemoryUsageStats(),
      ...(context && { context })
    };

    this.markers.set(name, marker);
    
    // Track peak memory usage
    if (!this.peakMemoryUsage || marker.memoryUsage.rss > this.peakMemoryUsage.rss) {
      this.peakMemoryUsage = marker.memoryUsage;
    }

    if (this.config.detailedLogging) {
      console.log(`[PERF] Marker: ${name} @ ${marker.timestamp}`);
      if (this.config.memoryMonitoring) {
        console.log(`[PERF]   Memory: RSS=${marker.memoryUsage.rss}MB, Heap=${marker.memoryUsage.heapUsed}MB`);
      }
    }
  }

  /**
   * Measure performance between two markers
   * Returns measurement result with pass/fail status based on thresholds
   */
  measure(startMarker: string, endMarker: string, threshold?: number): PerformanceMeasurement | null {
    if (!this.config.enabled) return null;

    const start = this.markers.get(startMarker);
    const end = this.markers.get(endMarker);

    if (!start || !end) {
      console.warn(`[PERF] Missing marker(s) for measurement: ${startMarker} -> ${endMarker}`);
      return null;
    }

    const duration = end.timestamp - start.timestamp;
    const actualThreshold = threshold || this.getDefaultThreshold(startMarker, endMarker);
    
    const measurement: PerformanceMeasurement = {
      name: `${startMarker} -> ${endMarker}`,
      startTime: start.timestamp,
      endTime: end.timestamp,
      duration,
      startMemory: start.memoryUsage,
      endMemory: end.memoryUsage,
      memoryDelta: this.calculateMemoryDelta(start.memoryUsage, end.memoryUsage),
      passed: duration <= actualThreshold,
      threshold: actualThreshold,
      context: { ...start.context, ...end.context }
    };

    this.measurements.push(measurement);

    if (this.config.detailedLogging) {
      const status = measurement.passed ? '✅' : '❌';
      console.log(`[PERF] ${status} ${measurement.name}: ${duration}ms (threshold: ${actualThreshold}ms)`);
    }

    return measurement;
  }

  /**
   * Get default threshold for common measurement patterns
   */
  private getDefaultThreshold(startMarker: string, endMarker: string): number {
    const measurementName = `${startMarker} -> ${endMarker}`;
    
    if (measurementName.includes('startup')) {
      return this.config.thresholds.cliStartup;
    } else if (measurementName.includes('test_suite')) {
      return this.config.thresholds.testSuiteExecution;
    } else if (measurementName.includes('route_calc') || measurementName.includes('calculateFare')) {
      return this.config.thresholds.routeCalculation;
    }
    
    return 5000; // Default 5 second threshold
  }

  /**
   * Calculate memory usage delta between two snapshots
   */
  private calculateMemoryDelta(start: MemoryUsageStats, end: MemoryUsageStats): MemoryUsageStats {
    return {
      rss: end.rss - start.rss,
      heapTotal: end.heapTotal - start.heapTotal,
      heapUsed: end.heapUsed - start.heapUsed,
      external: end.external - start.external,
      arrayBuffers: end.arrayBuffers - start.arrayBuffers
    };
  }

  /**
   * Monitor CLI startup performance (REQ-CLI-002.5)
   */
  monitorCLIStartup(): void {
    this.mark('cli_startup_end');
    const measurement = this.measure('cli_startup_begin', 'cli_startup_end', this.config.thresholds.cliStartup);
    
    if (measurement && !measurement.passed) {
      console.warn(`⚠️  CLI startup time exceeded threshold: ${measurement.duration}ms > ${measurement.threshold}ms`);
    }
  }

  /**
   * Monitor test suite execution performance
   * Integrates with existing TestOutputWriter
   */
  monitorTestSuite(testSuiteName: string, output?: TestOutputWriter): PerformanceMeasurement | null {
    const startMarker = `test_suite_${testSuiteName}_start`;
    const endMarker = `test_suite_${testSuiteName}_end`;
    
    this.mark(endMarker);
    const measurement = this.measure(startMarker, endMarker, this.config.thresholds.testSuiteExecution);
    
    if (measurement && output) {
      this.writePerformanceToOutput(measurement, output);
    }
    
    return measurement;
  }

  /**
   * Monitor individual route calculation performance
   */
  monitorRouteCalculation(routeDesc: string): {
    start: () => void;
    end: () => PerformanceMeasurement | null;
  } {
    const startMarker = `route_calc_${routeDesc}_start`;
    const endMarker = `route_calc_${routeDesc}_end`;
    
    return {
      start: () => this.mark(startMarker, { route: routeDesc }),
      end: () => {
        this.mark(endMarker);
        return this.measure(startMarker, endMarker, this.config.thresholds.routeCalculation);
      }
    };
  }

  /**
   * Monitor WebAssembly initialization performance
   */
  monitorWASMInit(): {
    markLoadStart: () => void;
    markLoadEnd: () => void;
    markDBInitStart: () => void;
    markDBInitEnd: () => void;
    getResults: () => PerformanceMeasurement[];
  } {
    return {
      markLoadStart: () => this.mark('wasm_load_start'),
      markLoadEnd: () => this.mark('wasm_load_end'),
      markDBInitStart: () => this.mark('wasm_db_init_start'),
      markDBInitEnd: () => this.mark('wasm_db_init_end'),
      getResults: () => {
        const results: PerformanceMeasurement[] = [];
        
        const loadMeasurement = this.measure('wasm_load_start', 'wasm_load_end');
        if (loadMeasurement) results.push(loadMeasurement);
        
        const dbMeasurement = this.measure('wasm_db_init_start', 'wasm_db_init_end');
        if (dbMeasurement) results.push(dbMeasurement);
        
        return results;
      }
    };
  }

  /**
   * Check current memory usage against limits (REQ-CLI-002.5)
   */
  checkMemoryLimits(): { withinLimits: boolean; currentUsage: MemoryUsageStats; warnings: string[] } {
    const currentUsage = configManager.getMemoryUsageStats();
    const warnings: string[] = [];
    let withinLimits = true;

    // Convert MB to bytes for comparison
    const currentRSSBytes = currentUsage.rss * 1024 * 1024;
    const currentHeapBytes = currentUsage.heapUsed * 1024 * 1024;

    if (currentRSSBytes > this.config.thresholds.memoryLimit) {
      withinLimits = false;
      warnings.push(`RSS memory ${currentUsage.rss}MB exceeds limit ${Math.round(this.config.thresholds.memoryLimit / 1024 / 1024)}MB`);
    }

    if (currentHeapBytes > this.config.thresholds.wasmHeapLimit) {
      warnings.push(`Heap memory ${currentUsage.heapUsed}MB exceeds WASM limit ${Math.round(this.config.thresholds.wasmHeapLimit / 1024 / 1024)}MB`);
    }

    // Check for memory growth patterns
    if (this.measurements.length > 1) {
      const lastMeasurement = this.measurements[this.measurements.length - 1];
      if (lastMeasurement.memoryDelta.rss > 50) { // More than 50MB increase
        warnings.push(`Significant memory increase detected: +${lastMeasurement.memoryDelta.rss}MB RSS`);
      }
    }

    return { withinLimits, currentUsage, warnings };
  }

  /**
   * Write performance measurement to TestOutputWriter (leveraging existing infrastructure)
   */
  private writePerformanceToOutput(measurement: PerformanceMeasurement, output: TestOutputWriter): void {
    const status = measurement.passed ? 'PASS' : 'FAIL';
    const formattedDuration = (measurement.duration / 1000).toFixed(3);
    const thresholdSec = (measurement.threshold / 1000).toFixed(1);
    
    output.write(`\n--- Performance Measurement ---\n`);
    output.write(`Operation: ${measurement.name}\n`);
    output.write(`Duration: ${formattedDuration}s (threshold: ${thresholdSec}s)\n`);
    output.write(`Result: ${status}\n`);
    
    if (this.config.memoryMonitoring) {
      output.write(`Memory Start: RSS=${measurement.startMemory.rss}MB, Heap=${measurement.startMemory.heapUsed}MB\n`);
      output.write(`Memory End: RSS=${measurement.endMemory.rss}MB, Heap=${measurement.endMemory.heapUsed}MB\n`);
      output.write(`Memory Delta: RSS=${measurement.memoryDelta.rss}MB, Heap=${measurement.memoryDelta.heapUsed}MB\n`);
    }
    
    output.write('---\n');
  }

  /**
   * Generate comprehensive performance report
   * Uses existing showTime function pattern and TestOutputWriter integration
   */
  generateReport(output?: TestOutputWriter): string {
    const totalMeasurements = this.measurements.length;
    const passedMeasurements = this.measurements.filter(m => m.passed).length;
    const failedMeasurements = totalMeasurements - passedMeasurements;
    const successRate = totalMeasurements > 0 ? (passedMeasurements / totalMeasurements * 100).toFixed(1) : '0.0';

    const memoryCheck = this.checkMemoryLimits();
    // Unix timestamp for showTime compatibility (currently unused but available for future use)

    let report = '\n=== PERFORMANCE MONITORING REPORT ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Monitoring Duration: ${Math.round((Date.now() - this.startupTime) / 1000)}s\n\n`;

    // Performance Summary
    report += '📊 Performance Summary:\n';
    report += `  Total Measurements: ${totalMeasurements}\n`;
    report += `  Passed: ${passedMeasurements}\n`;
    report += `  Failed: ${failedMeasurements}\n`;
    report += `  Success Rate: ${successRate}%\n\n`;

    // Memory Status
    report += '💾 Memory Status:\n';
    report += `  Current RSS: ${memoryCheck.currentUsage.rss}MB\n`;
    report += `  Current Heap: ${memoryCheck.currentUsage.heapUsed}/${memoryCheck.currentUsage.heapTotal}MB\n`;
    report += `  Peak RSS: ${this.peakMemoryUsage?.rss || 'N/A'}MB\n`;
    report += `  Within Limits: ${memoryCheck.withinLimits ? '✅' : '❌'}\n`;
    
    if (memoryCheck.warnings.length > 0) {
      report += `  Warnings:\n`;
      memoryCheck.warnings.forEach(warning => {
        report += `    ⚠️  ${warning}\n`;
      });
    }
    report += '\n';

    // Detailed Measurements
    if (this.measurements.length > 0) {
      report += '⏱️  Detailed Measurements:\n';
      this.measurements.forEach((measurement, index) => {
        const status = measurement.passed ? '✅' : '❌';
        const duration = (measurement.duration / 1000).toFixed(3);
        const threshold = (measurement.threshold / 1000).toFixed(1);
        
        report += `  ${index + 1}. ${status} ${measurement.name}\n`;
        report += `     Duration: ${duration}s (threshold: ${threshold}s)\n`;
        
        if (this.config.memoryMonitoring && measurement.memoryDelta.rss !== 0) {
          report += `     Memory Delta: RSS=${measurement.memoryDelta.rss}MB, Heap=${measurement.memoryDelta.heapUsed}MB\n`;
        }
      });
      report += '\n';
    }

    // Requirements Compliance Check
    report += '✓ Requirements Compliance:\n';
    const cliStartupMeasurement = this.measurements.find(m => m.name.includes('startup'));
    const testSuiteMeasurement = this.measurements.find(m => m.name.includes('test_suite'));
    const routeMeasurements = this.measurements.filter(m => m.name.includes('route_calc'));
    
    report += `  CLI Startup < 2s: ${cliStartupMeasurement ? (cliStartupMeasurement.passed ? '✅' : '❌') : '⏳ Pending'}\n`;
    report += `  Test Suite < 30s: ${testSuiteMeasurement ? (testSuiteMeasurement.passed ? '✅' : '❌') : '⏳ Pending'}\n`;
    report += `  Route Calc < 1s: ${routeMeasurements.length > 0 ? (routeMeasurements.every(m => m.passed) ? '✅' : '❌') : '⏳ Pending'}\n`;
    report += `  Memory < 512MB: ${memoryCheck.withinLimits ? '✅' : '❌'}\n`;

    report += '\n=== END PERFORMANCE REPORT ===\n';

    // Write to output file if provided (leveraging TestOutputWriter)
    if (output) {
      output.write(report);
    }

    return report;
  }

  /**
   * Cleanup and final performance summary
   */
  cleanup(): void {
    if (!this.config.enabled) return;

    if (this.config.detailedLogging) {
      console.log('[PERF] Performance monitoring cleanup');
      console.log(this.generateReport());
    }

    if (this.config.autoCleanup) {
      this.markers.clear();
      this.measurements.length = 0; // Clear array but keep reference
    }
  }

  /**
   * Static factory method for easy integration
   */
  static create(config?: Partial<PerformanceConfig>): PerformanceMonitor {
    return new PerformanceMonitor(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (this.config.detailedLogging) {
      console.log('[PERF] Configuration updated:', updates);
    }
  }
}

/**
 * Global performance monitor instance for CLI-wide use
 * Automatically configured based on CLI configuration
 */
export const performanceMonitor = PerformanceMonitor.create();

/**
 * Utility functions for common performance monitoring patterns
 */
export class PerformanceUtils {
  /**
   * Time a function execution with automatic measurement
   */
  static async timeFunction<T>(
    fn: () => Promise<T> | T,
    name: string,
    threshold?: number
  ): Promise<{ result: T; measurement: PerformanceMeasurement | null }> {
    performanceMonitor.mark(`${name}_start`);
    
    try {
      const result = await fn();
      performanceMonitor.mark(`${name}_end`);
      const measurement = performanceMonitor.measure(`${name}_start`, `${name}_end`, threshold);
      
      return { result, measurement };
    } catch (error) {
      performanceMonitor.mark(`${name}_error`);
      performanceMonitor.measure(`${name}_start`, `${name}_error`, threshold);
      throw error;
    }
  }

  /**
   * Create a performance timing decorator for methods
   */
  static createTimingDecorator(threshold?: number) {
    return function <T extends (...args: any[]) => any>(
      target: any,
      propertyName: string,
      descriptor: TypedPropertyDescriptor<T>
    ) {
      const method = descriptor.value!;

      descriptor.value = async function (this: any, ...args: any[]) {
        const { result } = await PerformanceUtils.timeFunction(
          () => method.apply(this, args),
          `${target.constructor.name}.${propertyName}`,
          threshold
        );
        return result;
      } as any;

      return descriptor;
    };
  }

  /**
   * Monitor memory usage during a specific operation
   */
  static monitorMemoryDuringOperation<T>(
    operation: () => Promise<T> | T,
    operationName: string
  ): Promise<{ result: T; memoryDelta: MemoryUsageStats }> {
    return (async () => {
      try {
        const startMemory = configManager.getMemoryUsageStats();
        const result = await operation();
        const endMemory = configManager.getMemoryUsageStats();
        
        const memoryDelta = {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        };

        if (configManager.getConfiguration().debug) {
          console.log(`[PERF] Memory delta for ${operationName}:`, memoryDelta);
        }

        return { result, memoryDelta };
      } catch (error) {
        throw error;
      }
    })();
  }
}