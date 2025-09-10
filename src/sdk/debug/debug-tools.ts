/**
 * Debug Tools for Farert Frontend API Layer SDK
 * 
 * Comprehensive debugging utilities for troubleshooting SDK issues, performance optimization,
 * and understanding internal behavior during development and production troubleshooting.
 * 
 * This debugging suite provides complete visibility into:
 * - Cache behavior inspection and performance analysis
 * - WebAssembly memory usage tracking and leak detection
 * - Performance monitoring with bottleneck identification 
 * - SDK state inspection and validation tools
 * - Error tracking and analysis utilities
 * - Diagnostic information export for support cases
 * - Development-mode profiling and optimization recommendations
 * 
 * Features:
 * - Real-time cache performance monitoring with detailed statistics
 * - WebAssembly memory usage tracking with leak detection
 * - Performance profiling with operation timing and bottleneck analysis
 * - SDK state validation and consistency checking
 * - Error pattern analysis and recovery recommendations
 * - Production-safe debugging with configurable verbosity levels
 * - Export utilities for diagnostic reports and support cases
 * - Development-mode helpers with performance optimization suggestions
 * 
 * @file Debug Tools Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-006: Development Experience and Documentation
 *   - Cache inspection utilities for debugging cache behavior
 *   - Performance monitoring tools for SDK operations
 *   - WebAssembly memory usage tracking and analysis
 *   - Diagnostic information export for troubleshooting
 *   - Development-mode debugging helpers and profilers
 *   - SDK state inspection and validation tools
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

// Cache system integration
import type {
  CacheManager,
  CacheCategory,
  CacheManagerStats,
  CacheManagerEvent,
  CacheManagerEventType
} from '../cache/cache-manager';

// Error management integration  
import type {
  ErrorManager,
  ErrorCategory,
  ErrorSeverity,
  UserFriendlyError,
  ErrorContext,
  RetryConfig
} from '../errors/error-manager';

// Core SDK types
import type {
  StationInfo,
  FareCalculationResult,
  RouteInfo,
  ValidationResult,
  FarertSDKError
} from '../types/core';

// WebAssembly integration (referenced from CLI types)
import type {
  FarertModule,
  FareInfoData,
  WebAssemblyLoadError
} from '../../cli/types';

// ============================================================================
// DEBUG CONFIGURATION AND INTERFACES
// ============================================================================

/**
 * Debug mode levels for controlling verbosity and performance impact
 */
export enum DebugLevel {
  /** No debug output (production) */
  NONE = 0,
  /** Basic error and warning information */
  BASIC = 1,
  /** Include performance metrics and cache statistics */
  PERFORMANCE = 2,
  /** Full debug mode with detailed tracing */
  VERBOSE = 3,
  /** Development mode with all debugging features */
  DEVELOPMENT = 4
}

/**
 * Debug tool configuration
 */
export interface DebugConfig {
  /** Debug level (controls verbosity and overhead) */
  level: DebugLevel;
  
  /** Enable cache inspection tools */
  enableCacheInspection?: boolean;
  
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  
  /** Enable WebAssembly memory tracking */
  enableMemoryTracking?: boolean;
  
  /** Enable error tracking and analysis */
  enableErrorTracking?: boolean;
  
  /** Maximum number of performance samples to keep */
  maxPerformanceSamples?: number;
  
  /** Maximum number of error events to track */
  maxErrorEvents?: number;
  
  /** Memory usage sampling interval (ms) */
  memorySamplingInterval?: number;
  
  /** Enable real-time monitoring dashboard */
  enableRealtimeDashboard?: boolean;
  
  /** Console output prefix for debug messages */
  consolePrefix?: string;
  
  /** Save debug logs to localStorage key */
  localStorageKey?: string;
}

/**
 * Cache inspection result
 */
export interface CacheInspectionResult {
  /** Cache statistics by category */
  stats: Record<CacheCategory, {
    entries: number;
    memoryUsage: number;
    hitRatio: number;
    averageAge: number;
    oldestEntry: number;
    newestEntry: number;
  }>;
  
  /** Cache performance analysis */
  performance: {
    totalOperations: number;
    averageResponseTime: number;
    slowestOperations: Array<{
      category: CacheCategory;
      operation: string;
      duration: number;
      timestamp: number;
    }>;
    cacheEfficiency: number;
  };
  
  /** Memory distribution analysis */
  memoryAnalysis: {
    totalMemoryUsage: number;
    memoryLimit: number;
    utilizationPercent: number;
    categoryDistribution: Record<CacheCategory, {
      usage: number;
      percentage: number;
    }>;
    fragmentationScore: number;
  };
  
  /** Cache health recommendations */
  recommendations: Array<{
    type: 'optimization' | 'configuration' | 'warning';
    category?: CacheCategory;
    message: string;
    severity: 'low' | 'medium' | 'high';
    action?: string;
  }>;
}

/**
 * Performance monitoring data
 */
export interface PerformanceMonitoringData {
  /** Operation timing statistics */
  operationTimings: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    recentSamples: number[];
  }>;
  
  /** Performance bottlenecks */
  bottlenecks: Array<{
    operation: string;
    averageTime: number;
    frequency: number;
    impact: 'low' | 'medium' | 'high';
    suggestions: string[];
  }>;
  
  /** Resource utilization */
  resourceUtilization: {
    cacheMemoryUsage: number;
    wasmMemoryUsage?: number;
    operationsPerSecond: number;
    errorRate: number;
  };
  
  /** Performance trends */
  trends: {
    performanceScore: number; // 0-100
    trend: 'improving' | 'stable' | 'degrading';
    trendDuration: number;
    predictedIssues: string[];
  };
}

/**
 * WebAssembly memory analysis
 */
export interface WebAssemblyMemoryAnalysis {
  /** Current memory statistics */
  current: {
    heapSize: number;
    usedHeapSize: number;
    availableHeapSize: number;
    utilizationPercent: number;
  };
  
  /** Memory usage history */
  history: Array<{
    timestamp: number;
    heapSize: number;
    usedHeapSize: number;
  }>;
  
  /** Memory leak detection */
  leakDetection: {
    possibleLeaks: boolean;
    growthRate: number; // bytes per second
    suspiciousPatterns: string[];
    recommendations: string[];
  };
  
  /** Module status */
  moduleStatus: {
    isLoaded: boolean;
    loadTime?: number;
    version?: string;
    capabilities: string[];
  };
}

/**
 * SDK state snapshot
 */
export interface SDKStateSnapshot {
  /** Timestamp of snapshot */
  timestamp: number;
  
  /** Cache state */
  cacheState: {
    totalEntries: number;
    memoryUsage: number;
    hitRatio: number;
    categories: Record<CacheCategory, number>;
  };
  
  /** Error state */
  errorState: {
    totalErrors: number;
    recentErrors: UserFriendlyError[];
    errorRatePerMinute: number;
    criticalErrors: number;
  };
  
  /** Performance state */
  performanceState: {
    averageResponseTime: number;
    operationsPerSecond: number;
    slowOperationsCount: number;
  };
  
  /** WebAssembly state */
  wasmState?: {
    memoryUsage: number;
    moduleLoaded: boolean;
    activeObjects: number;
  };
  
  /** Configuration state */
  configState: {
    debugLevel: DebugLevel;
    featuresEnabled: string[];
    memoryLimits: Record<string, number>;
  };
}

/**
 * Diagnostic report for troubleshooting
 */
export interface DiagnosticReport {
  /** Report metadata */
  metadata: {
    generatedAt: number;
    sdkVersion: string;
    userAgent?: string;
    debugLevel: DebugLevel;
    sessionDuration: number;
  };
  
  /** System information */
  systemInfo: {
    platform?: string;
    memoryAvailable?: number;
    storageAvailable?: number;
    webAssemblySupported: boolean;
  };
  
  /** Cache analysis */
  cacheAnalysis: CacheInspectionResult;
  
  /** Performance analysis */
  performanceAnalysis: PerformanceMonitoringData;
  
  /** Memory analysis */
  memoryAnalysis?: WebAssemblyMemoryAnalysis;
  
  /** Error analysis */
  errorAnalysis: {
    errorCount: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentCriticalErrors: UserFriendlyError[];
    errorPatterns: string[];
  };
  
  /** Configuration analysis */
  configurationAnalysis: {
    currentConfig: Record<string, any>;
    configurationIssues: string[];
    recommendedChanges: Array<{
      setting: string;
      currentValue: any;
      recommendedValue: any;
      reason: string;
    }>;
  };
  
  /** Overall health score and recommendations */
  healthScore: number; // 0-100
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    issue: string;
    solution: string;
    impact?: string;
  }>;
}

// ============================================================================
// DEBUG TOOLS IMPLEMENTATION
// ============================================================================

/**
 * Comprehensive debugging toolkit for the Farert SDK
 * 
 * Provides cache inspection, performance monitoring, memory tracking,
 * error analysis, and diagnostic reporting capabilities.
 * 
 * @class DebugTools
 */
export class DebugTools {
  private readonly config: Required<DebugConfig>;
  private readonly startTime = Date.now();
  
  // Component references
  private cacheManager?: CacheManager;
  private errorManager?: ErrorManager;
  private wasmModule?: FarertModule;
  
  // Performance monitoring
  private operationTimings = new Map<string, number[]>();
  private performanceSamples: Array<{
    timestamp: number;
    operation: string;
    duration: number;
  }> = [];
  
  // Memory tracking
  private memoryHistory: Array<{
    timestamp: number;
    heapSize: number;
    usedHeapSize: number;
  }> = [];
  private memoryTimer?: NodeJS.Timeout;
  
  // Error tracking
  private errorEvents: Array<{
    timestamp: number;
    error: UserFriendlyError;
    context?: ErrorContext;
  }> = [];
  
  // Real-time monitoring
  private realtimeListeners = new Set<(data: any) => void>();
  private cacheEventListeners = new Map<CacheManagerEventType, (event: CacheManagerEvent) => void>();
  
  /**
   * Create a new DebugTools instance
   * 
   * @param config Debug configuration
   */
  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {
      level: config.level ?? DebugLevel.NONE,
      enableCacheInspection: config.enableCacheInspection ?? true,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      enableMemoryTracking: config.enableMemoryTracking ?? true,
      enableErrorTracking: config.enableErrorTracking ?? true,
      maxPerformanceSamples: config.maxPerformanceSamples ?? 1000,
      maxErrorEvents: config.maxErrorEvents ?? 100,
      memorySamplingInterval: config.memorySamplingInterval ?? 5000,
      enableRealtimeDashboard: config.enableRealtimeDashboard ?? false,
      consolePrefix: config.consolePrefix ?? '[Farert Debug]',
      localStorageKey: config.localStorageKey ?? 'farert-debug-logs'
    };
    
    // Initialize based on debug level
    if (this.config.level > DebugLevel.NONE) {
      this.initialize();
    }
  }
  
  // ============================================================================
  // INITIALIZATION AND SETUP
  // ============================================================================
  
  /**
   * Initialize debugging components
   */
  private initialize(): void {
    this.log('Debug tools initialized', 'info');
    
    // Start memory monitoring if enabled
    if (this.config.enableMemoryTracking) {
      this.startMemoryMonitoring();
    }
    
    // Initialize real-time dashboard if enabled
    if (this.config.enableRealtimeDashboard) {
      this.initializeRealtimeDashboard();
    }
  }
  
  /**
   * Attach to SDK components for monitoring
   * 
   * @param cacheManager Cache manager instance
   * @param errorManager Error manager instance  
   * @param wasmModule WebAssembly module instance
   */
  attachToSDK(
    cacheManager?: CacheManager,
    errorManager?: ErrorManager,
    wasmModule?: FarertModule
  ): void {
    this.cacheManager = cacheManager;
    this.errorManager = errorManager;
    this.wasmModule = wasmModule;
    
    // Attach cache event listeners
    if (cacheManager && this.config.enableCacheInspection) {
      this.attachCacheListeners(cacheManager);
    }
    
    // Attach error event listeners
    if (errorManager && this.config.enableErrorTracking) {
      this.attachErrorListeners(errorManager);
    }
    
    this.log('Attached to SDK components', 'info');
  }
  
  // ============================================================================
  // CACHE INSPECTION UTILITIES
  // ============================================================================
  
  /**
   * Inspect cache performance and behavior
   * 
   * @returns Comprehensive cache analysis
   */
  inspectCache(): CacheInspectionResult | null {
    if (!this.config.enableCacheInspection || !this.cacheManager) {
      this.log('Cache inspection not available', 'warning');
      return null;
    }
    
    const startTime = performance.now();
    
    try {
      const stats = this.cacheManager.getStats();
      
      // Analyze cache statistics
      const cacheStats: Record<string, any> = {};
      const slowestOps: Array<any> = [];
      
      for (const [category, categoryStats] of Object.entries(stats.categories)) {
        cacheStats[category] = {
          entries: categoryStats.totalEntries,
          memoryUsage: categoryStats.memoryUsage,
          hitRatio: categoryStats.hitRatio,
          averageAge: this.calculateAverageEntryAge(category as CacheCategory),
          oldestEntry: Date.now() - categoryStats.createdAt,
          newestEntry: Date.now() - categoryStats.lastOptimization
        };
      }
      
      // Generate recommendations
      const recommendations = this.generateCacheRecommendations(stats);
      
      const result: CacheInspectionResult = {
        stats: cacheStats,
        performance: {
          totalOperations: stats.global.totalHits + stats.global.totalMisses,
          averageResponseTime: this.calculateAverageResponseTime(),
          slowestOperations: slowestOps,
          cacheEfficiency: stats.performance.efficiencyScore
        },
        memoryAnalysis: {
          totalMemoryUsage: stats.global.totalMemoryUsage,
          memoryLimit: 50 * 1024 * 1024, // 50MB default
          utilizationPercent: stats.global.memoryUsagePercent,
          categoryDistribution: Object.fromEntries(
            Object.entries(stats.memoryDistribution).map(([cat, dist]) => [
              cat,
              { usage: dist.usage, percentage: dist.percentage }
            ])
          ),
          fragmentationScore: stats.performance.fragmentation
        },
        recommendations
      };
      
      this.recordPerformance('cache_inspection', performance.now() - startTime);
      this.log(`Cache inspection completed in ${performance.now() - startTime}ms`, 'performance');
      
      return result;
    } catch (error) {
      this.log(`Cache inspection failed: ${error}`, 'error');
      return null;
    }
  }
  
  /**
   * Monitor cache operations in real-time
   * 
   * @param callback Callback for cache events
   * @returns Unsubscribe function
   */
  monitorCacheOperations(callback: (event: CacheManagerEvent) => void): () => void {
    if (!this.cacheManager || !this.config.enableCacheInspection) {
      return () => {}; // No-op unsubscribe
    }
    
    // Attach to all cache events
    const eventTypes: CacheManagerEventType[] = [
      'memory_warning',
      'memory_critical', 
      'emergency_eviction',
      'optimization_complete',
      'cache_cleared',
      'category_added',
      'stats_updated'
    ];
    
    for (const eventType of eventTypes) {
      this.cacheManager.on(eventType, callback);
    }
    
    this.log('Cache operation monitoring started', 'info');
    
    return () => {
      if (this.cacheManager) {
        for (const eventType of eventTypes) {
          this.cacheManager.off(eventType, callback);
        }
      }
      this.log('Cache operation monitoring stopped', 'info');
    };
  }
  
  // ============================================================================
  // PERFORMANCE MONITORING TOOLS
  // ============================================================================
  
  /**
   * Record operation performance timing
   * 
   * @param operation Operation name
   * @param duration Duration in milliseconds
   * @param context Additional context
   */
  recordPerformance(operation: string, duration: number, context?: any): void {
    if (!this.config.enablePerformanceMonitoring || this.config.level < DebugLevel.PERFORMANCE) {
      return;
    }
    
    // Record timing
    if (!this.operationTimings.has(operation)) {
      this.operationTimings.set(operation, []);
    }
    
    const timings = this.operationTimings.get(operation)!;
    timings.push(duration);
    
    // Keep only recent samples
    if (timings.length > this.config.maxPerformanceSamples) {
      timings.shift();
    }
    
    // Record detailed sample
    this.performanceSamples.push({
      timestamp: Date.now(),
      operation,
      duration
    });
    
    // Maintain sample limit
    if (this.performanceSamples.length > this.config.maxPerformanceSamples) {
      this.performanceSamples.shift();
    }
    
    // Notify real-time listeners
    this.notifyRealtimeListeners('performance', {
      operation,
      duration,
      context,
      timestamp: Date.now()
    });
    
    // Log slow operations
    if (duration > 100 && this.config.level >= DebugLevel.VERBOSE) {
      this.log(`Slow operation detected: ${operation} took ${duration}ms`, 'warning');
    }
  }
  
  /**
   * Get comprehensive performance monitoring data
   * 
   * @returns Performance analysis
   */
  getPerformanceData(): PerformanceMonitoringData {
    const operationTimings: Record<string, any> = {};
    const bottlenecks: Array<any> = [];
    
    // Process operation timings
    for (const [operation, timings] of Array.from(this.operationTimings.entries())) {
      if (timings.length === 0) continue;
      
      const totalTime = timings.reduce((sum, time) => sum + time, 0);
      const averageTime = totalTime / timings.length;
      const minTime = Math.min(...timings);
      const maxTime = Math.max(...timings);
      
      operationTimings[operation] = {
        count: timings.length,
        totalTime,
        averageTime,
        minTime,
        maxTime,
        recentSamples: timings.slice(-10) // Last 10 samples
      };
      
      // Identify bottlenecks
      if (averageTime > 50 && timings.length > 10) {
        bottlenecks.push({
          operation,
          averageTime,
          frequency: timings.length,
          impact: averageTime > 200 ? 'high' : averageTime > 100 ? 'medium' : 'low',
          suggestions: this.generatePerformanceSuggestions(operation, averageTime)
        });
      }
    }
    
    // Calculate resource utilization
    const resourceUtilization = {
      cacheMemoryUsage: this.cacheManager?.getStats().global.totalMemoryUsage ?? 0,
      wasmMemoryUsage: this.getWebAssemblyMemoryUsage()?.current.usedHeapSize,
      operationsPerSecond: this.calculateOperationsPerSecond(),
      errorRate: this.calculateErrorRate()
    };
    
    // Calculate performance trends
    const trends = this.calculatePerformanceTrends();
    
    return {
      operationTimings,
      bottlenecks,
      resourceUtilization,
      trends
    };
  }
  
  /**
   * Start performance profiling session
   * 
   * @param duration Duration in milliseconds
   * @returns Profiling results promise
   */
  async startPerformanceProfiling(duration: number = 30000): Promise<PerformanceMonitoringData> {
    this.log(`Starting performance profiling for ${duration}ms`, 'info');
    
    const startTime = Date.now();
    const initialData = this.getPerformanceData();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const endData = this.getPerformanceData();
        this.log('Performance profiling completed', 'info');
        resolve(endData);
      }, duration);
    });
  }
  
  // ============================================================================
  // WEBASSEMBLY MEMORY TRACKING
  // ============================================================================
  
  /**
   * Get WebAssembly memory usage analysis
   * 
   * @returns Memory analysis or null if not available
   */
  getWebAssemblyMemoryUsage(): WebAssemblyMemoryAnalysis | null {
    if (!this.config.enableMemoryTracking || !this.wasmModule) {
      return null;
    }
    
    try {
      // Get current memory statistics (mock implementation)
      const heapSize = (performance as any).memory?.totalJSHeapSize ?? 0;
      const usedHeapSize = (performance as any).memory?.usedJSHeapSize ?? 0;
      const availableHeapSize = heapSize - usedHeapSize;
      
      // Calculate growth rate
      const growthRate = this.calculateMemoryGrowthRate();
      
      return {
        current: {
          heapSize,
          usedHeapSize,
          availableHeapSize,
          utilizationPercent: heapSize > 0 ? (usedHeapSize / heapSize) * 100 : 0
        },
        history: [...this.memoryHistory],
        leakDetection: {
          possibleLeaks: growthRate > 1024, // 1KB/s growth considered suspicious
          growthRate,
          suspiciousPatterns: this.detectSuspiciousMemoryPatterns(),
          recommendations: this.generateMemoryRecommendations(growthRate)
        },
        moduleStatus: {
          isLoaded: !!this.wasmModule,
          loadTime: undefined, // Could be tracked during initialization
          version: undefined, // Could be extracted from module
          capabilities: [] // Could list available functions
        }
      };
    } catch (error) {
      this.log(`Memory analysis failed: ${error}`, 'error');
      return null;
    }
  }
  
  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (!this.config.enableMemoryTracking) return;
    
    this.memoryTimer = setInterval(() => {
      const heapSize = (performance as any).memory?.totalJSHeapSize ?? 0;
      const usedHeapSize = (performance as any).memory?.usedJSHeapSize ?? 0;
      
      this.memoryHistory.push({
        timestamp: Date.now(),
        heapSize,
        usedHeapSize
      });
      
      // Keep only recent history (last hour)
      const cutoff = Date.now() - 60 * 60 * 1000;
      this.memoryHistory = this.memoryHistory.filter(entry => entry.timestamp > cutoff);
      
      // Notify real-time listeners
      this.notifyRealtimeListeners('memory', {
        heapSize,
        usedHeapSize,
        timestamp: Date.now()
      });
      
    }, this.config.memorySamplingInterval);
    
    this.log('Memory monitoring started', 'info');
  }
  
  // ============================================================================
  // ERROR TRACKING AND ANALYSIS
  // ============================================================================
  
  /**
   * Record error event for tracking and analysis
   * 
   * @param error Error information
   * @param context Error context
   */
  recordError(error: UserFriendlyError, context?: ErrorContext): void {
    if (!this.config.enableErrorTracking) return;
    
    this.errorEvents.push({
      timestamp: Date.now(),
      error,
      context
    });
    
    // Maintain event limit
    if (this.errorEvents.length > this.config.maxErrorEvents) {
      this.errorEvents.shift();
    }
    
    // Log critical errors
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.FATAL) {
      this.log(`Critical error recorded: ${error.title}`, 'error');
    }
    
    // Notify real-time listeners
    this.notifyRealtimeListeners('error', {
      error,
      context,
      timestamp: Date.now()
    });
  }
  
  /**
   * Get error analysis and patterns
   * 
   * @returns Error analysis
   */
  getErrorAnalysis(): {
    errorCount: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentCriticalErrors: UserFriendlyError[];
    errorPatterns: string[];
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const recentCriticalErrors: UserFriendlyError[] = [];
    const errorPatterns: string[] = [];
    
    // Analyze error events
    for (const event of this.errorEvents) {
      const { error } = event;
      
      // Count by category
      const category = error.category || 'unknown';
      errorsByCategory[category] = (errorsByCategory[category] || 0) + 1;
      
      // Count by severity
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      
      // Collect recent critical errors
      if (
        (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.FATAL) &&
        event.timestamp > Date.now() - 60 * 60 * 1000 // Last hour
      ) {
        recentCriticalErrors.push(error);
      }
    }
    
    // Detect error patterns
    const patterns = this.detectErrorPatterns();
    
    return {
      errorCount: this.errorEvents.length,
      errorsByCategory: errorsByCategory as Record<ErrorCategory, number>,
      errorsBySeverity: errorsBySeverity as Record<ErrorSeverity, number>,
      recentCriticalErrors,
      errorPatterns: patterns
    };
  }
  
  // ============================================================================
  // SDK STATE INSPECTION
  // ============================================================================
  
  /**
   * Create comprehensive SDK state snapshot
   * 
   * @returns Current SDK state
   */
  createStateSnapshot(): SDKStateSnapshot {
    const cacheStats = this.cacheManager?.getStats();
    const errorAnalysis = this.getErrorAnalysis();
    const performanceData = this.getPerformanceData();
    const memoryAnalysis = this.getWebAssemblyMemoryUsage();
    
    return {
      timestamp: Date.now(),
      cacheState: {
        totalEntries: cacheStats?.global.totalEntries ?? 0,
        memoryUsage: cacheStats?.global.totalMemoryUsage ?? 0,
        hitRatio: cacheStats?.global.overallHitRatio ?? 0,
        categories: Object.fromEntries(
          Object.entries(cacheStats?.categories ?? {}).map(([cat, stats]) => [cat, stats.totalEntries])
        )
      },
      errorState: {
        totalErrors: errorAnalysis.errorCount,
        recentErrors: errorAnalysis.recentCriticalErrors.slice(-5),
        errorRatePerMinute: this.calculateErrorRate() * 60,
        criticalErrors: errorAnalysis.errorsBySeverity[ErrorSeverity.CRITICAL] ?? 0
      },
      performanceState: {
        averageResponseTime: performanceData.operationTimings['average'] || 0,
        operationsPerSecond: performanceData.resourceUtilization.operationsPerSecond,
        slowOperationsCount: performanceData.bottlenecks.length
      },
      wasmState: memoryAnalysis ? {
        memoryUsage: memoryAnalysis.current.usedHeapSize,
        moduleLoaded: memoryAnalysis.moduleStatus.isLoaded,
        activeObjects: 0 // Could be tracked if needed
      } : undefined,
      configState: {
        debugLevel: this.config.level,
        featuresEnabled: this.getEnabledFeatures(),
        memoryLimits: {
          cache: cacheStats?.global.totalMemoryUsage ?? 0,
          wasm: memoryAnalysis?.current.heapSize ?? 0
        }
      }
    };
  }
  
  /**
   * Validate SDK state consistency
   * 
   * @returns Validation results
   */
  validateSDKState(): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    
    // Check cache state
    if (this.cacheManager) {
      const stats = this.cacheManager.getStats();
      if (stats.global.memoryUsagePercent > 90) {
        issues.push('Cache memory usage exceeds 90%');
      }
      if (stats.global.overallHitRatio < 0.5) {
        warnings.push('Cache hit ratio is below 50%');
      }
    }
    
    // Check error state
    const errorAnalysis = this.getErrorAnalysis();
    if (errorAnalysis.recentCriticalErrors.length > 5) {
      issues.push(`${errorAnalysis.recentCriticalErrors.length} critical errors in the last hour`);
    }
    
    // Check performance state
    const performanceData = this.getPerformanceData();
    if (performanceData.bottlenecks.some(b => b.impact === 'high')) {
      warnings.push('High-impact performance bottlenecks detected');
    }
    
    // Check memory state
    const memoryAnalysis = this.getWebAssemblyMemoryUsage();
    if (memoryAnalysis?.leakDetection.possibleLeaks) {
      issues.push('Possible memory leaks detected');
    }
    
    return {
      isValid: issues.length === 0,
      errors: issues,
      warnings,
      score: Math.max(0, 100 - (issues.length * 20) - (warnings.length * 5))
    };
  }
  
  // ============================================================================
  // DIAGNOSTIC REPORT GENERATION
  // ============================================================================
  
  /**
   * Generate comprehensive diagnostic report
   * 
   * @returns Diagnostic report for troubleshooting
   */
  generateDiagnosticReport(): DiagnosticReport {
    this.log('Generating diagnostic report', 'info');
    
    const cacheAnalysis = this.inspectCache();
    const performanceAnalysis = this.getPerformanceData();
    const memoryAnalysis = this.getWebAssemblyMemoryUsage();
    const errorAnalysis = this.getErrorAnalysis();
    const stateSnapshot = this.createStateSnapshot();
    const validation = this.validateSDKState();
    
    // Generate recommendations based on analysis
    const recommendations = this.generateRecommendations(
      cacheAnalysis,
      performanceAnalysis,
      memoryAnalysis,
      errorAnalysis,
      validation
    );
    
    const report: DiagnosticReport = {
      metadata: {
        generatedAt: Date.now(),
        sdkVersion: '1.0.0', // Should be extracted from package.json
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        debugLevel: this.config.level,
        sessionDuration: Date.now() - this.startTime
      },
      systemInfo: {
        platform: typeof navigator !== 'undefined' ? navigator.platform : undefined,
        memoryAvailable: (performance as any).memory?.totalJSHeapSize,
        storageAvailable: undefined, // Could check localStorage quota
        webAssemblySupported: typeof WebAssembly !== 'undefined'
      },
      cacheAnalysis: cacheAnalysis!,
      performanceAnalysis,
      memoryAnalysis: memoryAnalysis ?? undefined,
      errorAnalysis,
      configurationAnalysis: {
        currentConfig: { ...this.config },
        configurationIssues: this.detectConfigurationIssues(),
        recommendedChanges: this.getRecommendedConfigChanges()
      },
      healthScore: this.calculateOverallHealthScore(validation, performanceAnalysis, errorAnalysis),
      recommendations
    };
    
    this.log('Diagnostic report generated', 'info');
    
    // Save to localStorage if configured
    if (this.config.localStorageKey && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.config.localStorageKey, JSON.stringify(report));
      } catch (error) {
        this.log(`Failed to save diagnostic report: ${error}`, 'warning');
      }
    }
    
    return report;
  }
  
  /**
   * Export diagnostic data for support cases
   * 
   * @param format Export format
   * @returns Formatted diagnostic data
   */
  exportDiagnostics(format: 'json' | 'text' | 'csv' = 'json'): string {
    const report = this.generateDiagnosticReport();
    
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'text':
        return this.formatDiagnosticsAsText(report);
      
      case 'csv':
        return this.formatDiagnosticsAsCSV(report);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  // ============================================================================
  // REAL-TIME MONITORING DASHBOARD
  // ============================================================================
  
  /**
   * Initialize real-time monitoring dashboard
   */
  private initializeRealtimeDashboard(): void {
    if (!this.config.enableRealtimeDashboard) return;
    
    this.log('Real-time dashboard initialized', 'info');
    
    // Could initialize WebSocket connection or other real-time transport
    // For now, we use the event system for real-time updates
  }
  
  /**
   * Subscribe to real-time monitoring updates
   * 
   * @param callback Update callback
   * @returns Unsubscribe function
   */
  subscribeToRealtimeUpdates(callback: (data: any) => void): () => void {
    this.realtimeListeners.add(callback);
    
    return () => {
      this.realtimeListeners.delete(callback);
    };
  }
  
  /**
   * Notify real-time listeners
   */
  private notifyRealtimeListeners(type: string, data: any): void {
    if (!this.config.enableRealtimeDashboard) return;
    
    for (const listener of Array.from(this.realtimeListeners)) {
      try {
        listener({ type, data, timestamp: Date.now() });
      } catch (error) {
        this.log(`Real-time listener error: ${error}`, 'error');
      }
    }
  }
  
  // ============================================================================
  // LIFECYCLE AND CLEANUP
  // ============================================================================
  
  /**
   * Dispose of debug tools and clean up resources
   */
  dispose(): void {
    // Stop memory monitoring
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = undefined;
    }
    
    // Clear event listeners
    this.cacheEventListeners.clear();
    this.realtimeListeners.clear();
    
    // Clear data
    this.operationTimings.clear();
    this.performanceSamples.length = 0;
    this.memoryHistory.length = 0;
    this.errorEvents.length = 0;
    
    this.log('Debug tools disposed', 'info');
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  /**
   * Log debug message with appropriate level filtering
   */
  private log(message: string, level: 'info' | 'warning' | 'error' | 'performance' = 'info'): void {
    if (this.config.level === DebugLevel.NONE) return;
    
    const shouldLog = 
      (level === 'error') ||
      (level === 'warning' && this.config.level >= DebugLevel.BASIC) ||
      (level === 'performance' && this.config.level >= DebugLevel.PERFORMANCE) ||
      (level === 'info' && this.config.level >= DebugLevel.VERBOSE);
    
    if (shouldLog && typeof console !== 'undefined') {
      const timestamp = new Date().toISOString();
      const prefix = `${this.config.consolePrefix} [${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'error':
          console.error(`${prefix} ${message}`);
          break;
        case 'warning':
          console.warn(`${prefix} ${message}`);
          break;
        default:
          console.log(`${prefix} ${message}`);
          break;
      }
    }
  }
  
  /**
   * Attach cache event listeners
   */
  private attachCacheListeners(cacheManager: CacheManager): void {
    // Implementation would attach to cache manager events
    this.log('Cache listeners attached', 'info');
  }
  
  /**
   * Attach error event listeners
   */
  private attachErrorListeners(errorManager: ErrorManager): void {
    // Implementation would attach to error manager events  
    this.log('Error listeners attached', 'info');
  }
  
  /**
   * Calculate average entry age for a cache category
   */
  private calculateAverageEntryAge(category: CacheCategory): number {
    // Mock implementation - would calculate based on cache entry timestamps
    return Date.now() - (30 * 60 * 1000); // 30 minutes ago
  }
  
  /**
   * Calculate average response time across all operations
   */
  private calculateAverageResponseTime(): number {
    let totalTime = 0;
    let totalOps = 0;
    
    for (const timings of Array.from(this.operationTimings.values())) {
      totalTime += timings.reduce((sum, time) => sum + time, 0);
      totalOps += timings.length;
    }
    
    return totalOps > 0 ? totalTime / totalOps : 0;
  }
  
  /**
   * Generate cache optimization recommendations
   */
  private generateCacheRecommendations(stats: any): Array<any> {
    const recommendations: Array<any> = [];
    
    if (stats.global.memoryUsagePercent > 80) {
      recommendations.push({
        type: 'optimization',
        message: 'Cache memory usage is high, consider increasing memory limits or reducing TTL',
        severity: 'medium',
        action: 'Optimize cache configuration'
      });
    }
    
    if (stats.global.overallHitRatio < 0.6) {
      recommendations.push({
        type: 'configuration',
        message: 'Cache hit ratio is low, consider increasing cache sizes or TTL values',
        severity: 'medium',
        action: 'Review caching strategy'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Generate performance suggestions for an operation
   */
  private generatePerformanceSuggestions(operation: string, averageTime: number): string[] {
    const suggestions: string[] = [];
    
    if (operation.includes('cache') && averageTime > 100) {
      suggestions.push('Consider optimizing cache lookup algorithms');
      suggestions.push('Check for cache fragmentation');
    }
    
    if (operation.includes('wasm') && averageTime > 200) {
      suggestions.push('Consider WebAssembly module optimization');
      suggestions.push('Check for memory allocation patterns');
    }
    
    return suggestions;
  }
  
  /**
   * Calculate operations per second
   */
  private calculateOperationsPerSecond(): number {
    const recentSamples = this.performanceSamples.filter(
      sample => sample.timestamp > Date.now() - 60 * 1000 // Last minute
    );
    return recentSamples.length / 60;
  }
  
  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const recentErrors = this.errorEvents.filter(
      event => event.timestamp > Date.now() - 60 * 1000 // Last minute
    );
    return recentErrors.length / 60;
  }
  
  /**
   * Calculate performance trends
   */
  private calculatePerformanceTrends(): any {
    // Mock implementation - would analyze performance over time
    return {
      performanceScore: 85,
      trend: 'stable' as const,
      trendDuration: 30 * 60 * 1000, // 30 minutes
      predictedIssues: []
    };
  }
  
  /**
   * Calculate memory growth rate
   */
  private calculateMemoryGrowthRate(): number {
    if (this.memoryHistory.length < 2) return 0;
    
    const recent = this.memoryHistory.slice(-10); // Last 10 samples
    if (recent.length < 2) return 0;
    
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const memoryDiff = recent[recent.length - 1].usedHeapSize - recent[0].usedHeapSize;
    
    return timeSpan > 0 ? (memoryDiff / timeSpan) * 1000 : 0; // bytes per second
  }
  
  /**
   * Detect suspicious memory patterns
   */
  private detectSuspiciousMemoryPatterns(): string[] {
    const patterns: string[] = [];
    
    if (this.memoryHistory.length > 10) {
      const recent = this.memoryHistory.slice(-10);
      const isGrowingMonotonically = recent.every((entry, i) => 
        i === 0 || entry.usedHeapSize >= recent[i - 1].usedHeapSize
      );
      
      if (isGrowingMonotonically) {
        patterns.push('Monotonic memory growth detected');
      }
    }
    
    return patterns;
  }
  
  /**
   * Generate memory optimization recommendations
   */
  private generateMemoryRecommendations(growthRate: number): string[] {
    const recommendations: string[] = [];
    
    if (growthRate > 1024) {
      recommendations.push('High memory growth rate detected - check for leaks');
      recommendations.push('Consider implementing memory pooling');
    }
    
    if (growthRate > 10240) {
      recommendations.push('Critical memory growth rate - immediate investigation required');
    }
    
    return recommendations;
  }
  
  /**
   * Detect error patterns
   */
  private detectErrorPatterns(): string[] {
    const patterns: string[] = [];
    
    // Group errors by type and look for patterns
    const errorGroups = new Map<string, number>();
    for (const event of this.errorEvents) {
      const key = `${event.error.category}:${event.error.code}`;
      errorGroups.set(key, (errorGroups.get(key) || 0) + 1);
    }
    
    // Detect frequent errors
    for (const [errorType, count] of Array.from(errorGroups.entries())) {
      if (count > 5) {
        patterns.push(`Frequent ${errorType} errors (${count} occurrences)`);
      }
    }
    
    return patterns;
  }
  
  /**
   * Get list of enabled debug features
   */
  private getEnabledFeatures(): string[] {
    const features: string[] = [];
    
    if (this.config.enableCacheInspection) features.push('cache_inspection');
    if (this.config.enablePerformanceMonitoring) features.push('performance_monitoring');
    if (this.config.enableMemoryTracking) features.push('memory_tracking');
    if (this.config.enableErrorTracking) features.push('error_tracking');
    if (this.config.enableRealtimeDashboard) features.push('realtime_dashboard');
    
    return features;
  }
  
  /**
   * Generate comprehensive recommendations
   */
  private generateRecommendations(
    cacheAnalysis: any,
    performanceAnalysis: any,
    memoryAnalysis: any,
    errorAnalysis: any,
    validation: any
  ): Array<any> {
    const recommendations: Array<any> = [];
    
    // Add cache recommendations
    if (cacheAnalysis?.recommendations) {
      recommendations.push(...cacheAnalysis.recommendations.map((rec: any) => ({
        ...rec,
        priority: rec.severity === 'high' ? 'high' : 'medium',
        category: 'cache'
      })));
    }
    
    // Add performance recommendations
    for (const bottleneck of performanceAnalysis.bottlenecks) {
      if (bottleneck.impact === 'high') {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          issue: `Slow operation: ${bottleneck.operation}`,
          solution: bottleneck.suggestions.join(', '),
          impact: `${bottleneck.averageTime}ms average response time`
        });
      }
    }
    
    // Add memory recommendations  
    if (memoryAnalysis?.leakDetection.possibleLeaks) {
      recommendations.push({
        priority: 'high',
        category: 'memory',
        issue: 'Possible memory leaks detected',
        solution: memoryAnalysis.leakDetection.recommendations.join(', '),
        impact: 'Memory usage may grow over time'
      });
    }
    
    // Add error recommendations
    if (errorAnalysis.recentCriticalErrors.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'errors',
        issue: `${errorAnalysis.recentCriticalErrors.length} critical errors occurred`,
        solution: 'Investigate error patterns and implement fixes',
        impact: 'Application stability may be compromised'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate overall health score
   */
  private calculateOverallHealthScore(validation: any, performance: any, errors: any): number {
    let score = 100;
    
    // Deduct for validation issues
    score -= validation.errors.length * 20;
    score -= validation.warnings.length * 5;
    
    // Deduct for performance issues
    score -= performance.bottlenecks.filter((b: any) => b.impact === 'high').length * 15;
    score -= performance.bottlenecks.filter((b: any) => b.impact === 'medium').length * 5;
    
    // Deduct for errors
    score -= errors.recentCriticalErrors.length * 10;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Detect configuration issues
   */
  private detectConfigurationIssues(): string[] {
    const issues: string[] = [];
    
    if (this.config.level === DebugLevel.DEVELOPMENT && typeof window !== 'undefined') {
      issues.push('Development debug level enabled in browser environment');
    }
    
    if (this.config.maxPerformanceSamples > 10000) {
      issues.push('Performance sample limit is very high, may impact memory usage');
    }
    
    return issues;
  }
  
  /**
   * Get recommended configuration changes
   */
  private getRecommendedConfigChanges(): Array<any> {
    const changes: Array<any> = [];
    
    if (this.config.level > DebugLevel.BASIC && typeof window !== 'undefined') {
      changes.push({
        setting: 'level',
        currentValue: this.config.level,
        recommendedValue: DebugLevel.BASIC,
        reason: 'Reduce debug overhead in production'
      });
    }
    
    return changes;
  }
  
  /**
   * Format diagnostic report as text
   */
  private formatDiagnosticsAsText(report: DiagnosticReport): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(80));
    lines.push('FARERT SDK DIAGNOSTIC REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    
    lines.push(`Generated: ${new Date(report.metadata.generatedAt).toISOString()}`);
    lines.push(`SDK Version: ${report.metadata.sdkVersion}`);
    lines.push(`Debug Level: ${report.metadata.debugLevel}`);
    lines.push(`Session Duration: ${Math.round(report.metadata.sessionDuration / 1000)}s`);
    lines.push('');
    
    lines.push('HEALTH SCORE');
    lines.push('-'.repeat(40));
    lines.push(`Overall Score: ${report.healthScore}/100`);
    lines.push('');
    
    lines.push('CACHE ANALYSIS');
    lines.push('-'.repeat(40));
    lines.push(`Memory Usage: ${report.cacheAnalysis.memoryAnalysis.totalMemoryUsage} bytes`);
    lines.push(`Utilization: ${report.cacheAnalysis.memoryAnalysis.utilizationPercent.toFixed(1)}%`);
    lines.push(`Cache Efficiency: ${report.cacheAnalysis.performance.cacheEfficiency}`);
    lines.push('');
    
    lines.push('ERROR ANALYSIS');
    lines.push('-'.repeat(40));
    lines.push(`Total Errors: ${report.errorAnalysis.errorCount}`);
    lines.push(`Critical Errors: ${report.errorAnalysis.recentCriticalErrors.length}`);
    lines.push('');
    
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(40));
    for (const rec of report.recommendations.slice(0, 5)) {
      lines.push(`[${rec.priority.toUpperCase()}] ${rec.issue}`);
      lines.push(`  Solution: ${rec.solution}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Format diagnostic report as CSV
   */
  private formatDiagnosticsAsCSV(report: DiagnosticReport): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Category,Metric,Value,Unit');
    
    // Basic metrics
    lines.push(`General,Health Score,${report.healthScore},points`);
    lines.push(`General,Session Duration,${report.metadata.sessionDuration},ms`);
    
    // Cache metrics
    lines.push(`Cache,Memory Usage,${report.cacheAnalysis.memoryAnalysis.totalMemoryUsage},bytes`);
    lines.push(`Cache,Utilization,${report.cacheAnalysis.memoryAnalysis.utilizationPercent.toFixed(1)},%`);
    lines.push(`Cache,Efficiency,${report.cacheAnalysis.performance.cacheEfficiency},score`);
    
    // Error metrics
    lines.push(`Errors,Total Count,${report.errorAnalysis.errorCount},count`);
    lines.push(`Errors,Critical Count,${report.errorAnalysis.recentCriticalErrors.length},count`);
    
    // Performance metrics
    lines.push(`Performance,Operations/sec,${report.performanceAnalysis.resourceUtilization.operationsPerSecond},ops/sec`);
    lines.push(`Performance,Error Rate,${report.performanceAnalysis.resourceUtilization.errorRate},errors/sec`);
    
    return lines.join('\n');
  }
}

// ============================================================================
// FACTORY FUNCTIONS AND EXPORTS
// ============================================================================

/**
 * Create debug tools for development environment
 */
export function createDevelopmentDebugTools(config?: Partial<DebugConfig>): DebugTools {
  return new DebugTools({
    level: DebugLevel.DEVELOPMENT,
    enableCacheInspection: true,
    enablePerformanceMonitoring: true,
    enableMemoryTracking: true,
    enableErrorTracking: true,
    enableRealtimeDashboard: true,
    ...config
  });
}

/**
 * Create debug tools for production environment
 */
export function createProductionDebugTools(config?: Partial<DebugConfig>): DebugTools {
  return new DebugTools({
    level: DebugLevel.BASIC,
    enableCacheInspection: false,
    enablePerformanceMonitoring: false,
    enableMemoryTracking: false,
    enableErrorTracking: true,
    enableRealtimeDashboard: false,
    ...config
  });
}

/**
 * Create debug tools optimized for performance monitoring
 */
export function createPerformanceDebugTools(config?: Partial<DebugConfig>): DebugTools {
  return new DebugTools({
    level: DebugLevel.PERFORMANCE,
    enableCacheInspection: true,
    enablePerformanceMonitoring: true,
    enableMemoryTracking: true,
    enableErrorTracking: false,
    maxPerformanceSamples: 5000,
    memorySamplingInterval: 1000,
    ...config
  });
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  DebugConfig,
  CacheInspectionResult,
  PerformanceMonitoringData,
  WebAssemblyMemoryAnalysis,
  SDKStateSnapshot,
  DiagnosticReport
};

export { DebugLevel };