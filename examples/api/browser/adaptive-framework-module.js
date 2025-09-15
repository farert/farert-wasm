/**
 * Adaptive Framework Module for Farert WebAssembly API
 *
 * A comprehensive browser JavaScript module that demonstrates advanced integration
 * patterns using framework detection and browser-specific optimizations.
 *
 * Features:
 * - Automatic framework detection (React, Vue, Svelte, Angular, Vanilla)
 * - Adaptive loading strategies based on environment
 * - Performance monitoring and optimization
 * - Comprehensive error handling with graceful degradation
 * - Memory management and cleanup
 * - Cross-browser compatibility
 *
 * Requirements: 3.3, 3.4, 3.5
 * Leverages: src/sdk/utils/framework-detector.ts, src/sdk/browser.ts
 *
 * @author Claude Code (claude.ai/code)
 * @version 1.0.0
 */

// ============================================================================
// MODULE METADATA AND CONFIGURATION
// ============================================================================

const MODULE_INFO = {
  name: 'Adaptive Framework Module',
  version: '1.0.0',
  description: 'Advanced browser integration with framework detection',
  compatibility: ['Chrome 90+', 'Firefox 88+', 'Safari 14+', 'Edge 90+'],
  features: ['framework-detection', 'adaptive-loading', 'performance-monitoring', 'error-recovery']
};

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
  enableMetrics: true,
  trackMemory: true,
  trackLoadTimes: true,
  cacheHitRatio: true,
  adaptiveThresholds: {
    loadTime: 5000,    // 5 seconds max load time
    memoryUsage: 100,  // 100MB max memory usage
    errorRate: 0.05    // 5% max error rate
  }
};

// ============================================================================
// FRAMEWORK DETECTION AND ADAPTATION
// ============================================================================

/**
 * Simplified Framework Detector
 * Based on src/sdk/utils/framework-detector.ts patterns
 */
class BrowserFrameworkDetector {
  constructor() {
    this.cache = new Map();
    this.detectionScore = new Map();
  }

  /**
   * Detect current framework environment
   */
  async detectFramework() {
    if (this.cache.has('framework')) {
      return this.cache.get('framework');
    }

    const framework = this.performDetection();
    const confidence = this.calculateConfidence(framework);

    const result = {
      framework,
      confidence,
      environment: this.detectEnvironment(),
      features: this.detectFeatures(framework),
      recommendations: this.generateRecommendations(framework)
    };

    this.cache.set('framework', result);
    return result;
  }

  /**
   * Internal framework detection logic
   */
  performDetection() {
    const detectors = {
      svelte: () => this.checkSvelte(),
      sveltekit: () => this.checkSvelteKit(),
      react: () => this.checkReact(),
      nextjs: () => this.checkNextJS(),
      vue: () => this.checkVue(),
      nuxtjs: () => this.checkNuxtJS(),
      angular: () => this.checkAngular()
    };

    for (const [framework, detector] of Object.entries(detectors)) {
      if (detector()) {
        this.detectionScore.set(framework, this.getDetectionScore(framework));
        return framework;
      }
    }

    // Check DOM for framework indicators
    const domFramework = this.scanDOMForFrameworks();
    if (domFramework) return domFramework;

    return 'vanilla';
  }

  /**
   * Framework-specific detection methods
   */
  checkSvelte() {
    return typeof globalThis.__SVELTE__ !== 'undefined' ||
           (typeof document !== 'undefined' &&
            document.querySelector('[data-svelte-h]') !== null);
  }

  checkSvelteKit() {
    return typeof globalThis.__SVELTEKIT__ !== 'undefined' ||
           (typeof document !== 'undefined' &&
            document.querySelector('script[data-sveltekit-hydrate]') !== null);
  }

  checkReact() {
    return typeof globalThis.React !== 'undefined' ||
           typeof globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ||
           (typeof document !== 'undefined' &&
            document.querySelector('[data-reactroot]') !== null);
  }

  checkNextJS() {
    return typeof globalThis.__NEXT_DATA__ !== 'undefined' ||
           (typeof document !== 'undefined' &&
            document.querySelector('#__next') !== null);
  }

  checkVue() {
    return typeof globalThis.Vue !== 'undefined' ||
           typeof globalThis.__VUE__ !== 'undefined' ||
           (typeof document !== 'undefined' &&
            document.querySelector('[data-v-]') !== null);
  }

  checkNuxtJS() {
    return typeof globalThis.__NUXT__ !== 'undefined' ||
           (typeof document !== 'undefined' &&
            document.querySelector('#__nuxt') !== null);
  }

  checkAngular() {
    return typeof globalThis.ng !== 'undefined' ||
           (typeof document !== 'undefined' &&
            document.querySelector('[ng-version]') !== null);
  }

  /**
   * Scan DOM for framework indicators
   */
  scanDOMForFrameworks() {
    if (typeof document === 'undefined') return null;

    const indicators = [
      { framework: 'svelte', selectors: ['[data-svelte-h]', '[data-svelte]'] },
      { framework: 'react', selectors: ['[data-reactroot]', '[data-reactid]'] },
      { framework: 'vue', selectors: ['[data-v-]', '[v-cloak]'] },
      { framework: 'angular', selectors: ['[ng-version]', '[ng-app]'] }
    ];

    for (const { framework, selectors } of indicators) {
      if (selectors.some(selector => document.querySelector(selector))) {
        return framework;
      }
    }

    return null;
  }

  /**
   * Detect environment details
   */
  detectEnvironment() {
    let type = 'unknown';
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      type = 'browser';
    } else if (typeof global !== 'undefined' && typeof process !== 'undefined') {
      type = 'node';
    } else if (typeof self !== 'undefined' && typeof importScripts === 'function') {
      type = 'webworker';
    }

    const isDevelopment = (
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
    ) || (
      typeof window !== 'undefined' && window.__DEV__
    );

    const isSSR = type === 'node' || typeof window === 'undefined';

    return { type, isDevelopment, isSSR };
  }

  /**
   * Detect framework-specific features
   */
  detectFeatures(framework) {
    const features = [];

    switch (framework) {
      case 'svelte':
      case 'sveltekit':
        if (typeof globalThis.__SVELTE_HMR__ !== 'undefined') features.push('hmr');
        if (framework === 'sveltekit') features.push('ssr', 'routing');
        break;
      case 'react':
      case 'nextjs':
        if (typeof globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') features.push('devtools');
        if (framework === 'nextjs') features.push('ssr', 'ssg', 'routing');
        break;
      case 'vue':
      case 'nuxtjs':
        if (typeof globalThis.__VUE_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') features.push('devtools');
        if (framework === 'nuxtjs') features.push('ssr', 'routing');
        break;
      case 'angular':
        features.push('typescript', 'routing', 'di');
        break;
    }

    return features;
  }

  /**
   * Calculate detection confidence
   */
  calculateConfidence(framework) {
    if (framework === 'vanilla' || framework === 'unknown') return 'low';

    const score = this.detectionScore.get(framework) || 0;
    if (score >= 3) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Get detection score for framework
   */
  getDetectionScore(framework) {
    let score = 0;

    // Global object detection
    const globalChecks = {
      svelte: () => typeof globalThis.__SVELTE__ !== 'undefined',
      react: () => typeof globalThis.React !== 'undefined',
      vue: () => typeof globalThis.Vue !== 'undefined',
      angular: () => typeof globalThis.ng !== 'undefined'
    };

    if (globalChecks[framework] && globalChecks[framework]()) score++;

    // DOM detection
    if (typeof document !== 'undefined') {
      const domChecks = {
        svelte: () => document.querySelector('[data-svelte-h]') !== null,
        react: () => document.querySelector('[data-reactroot]') !== null,
        vue: () => document.querySelector('[data-v-]') !== null,
        angular: () => document.querySelector('[ng-version]') !== null
      };

      if (domChecks[framework] && domChecks[framework]()) score++;
    }

    // DevTools detection
    const devtoolsChecks = {
      react: () => typeof globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined',
      vue: () => typeof globalThis.__VUE_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined'
    };

    if (devtoolsChecks[framework] && devtoolsChecks[framework]()) score++;

    return score;
  }

  /**
   * Generate framework-specific recommendations
   */
  generateRecommendations(framework) {
    const recommendations = {
      loadingStrategy: 'lazy',
      bundleOptimization: [],
      cacheStrategy: 'moderate'
    };

    switch (framework) {
      case 'svelte':
      case 'sveltekit':
        recommendations.loadingStrategy = 'eager';
        recommendations.bundleOptimization.push('tree-shaking', 'component-splitting');
        recommendations.cacheStrategy = 'aggressive';
        break;
      case 'react':
      case 'nextjs':
        recommendations.bundleOptimization.push('code-splitting', 'dynamic-imports');
        break;
      case 'vue':
      case 'nuxtjs':
        recommendations.bundleOptimization.push('async-components', 'code-splitting');
        break;
      case 'angular':
        recommendations.loadingStrategy = 'conditional';
        recommendations.bundleOptimization.push('lazy-loading', 'bundle-splitting');
        break;
      case 'vanilla':
        recommendations.loadingStrategy = 'eager';
        recommendations.cacheStrategy = 'minimal';
        break;
    }

    return recommendations;
  }
}

// ============================================================================
// PERFORMANCE MONITORING SYSTEM
// ============================================================================

/**
 * Performance Monitor
 * Tracks loading times, memory usage, and cache efficiency
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTimes: [],
      memoryUsage: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      totalOperations: 0
    };
    this.startTime = performance.now();
    this.memoryCheckInterval = null;
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (PERFORMANCE_CONFIG.trackMemory && typeof performance.memory !== 'undefined') {
      this.memoryCheckInterval = setInterval(() => {
        this.recordMemoryUsage();
      }, 5000); // Check every 5 seconds
    }
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * Record operation timing
   */
  recordTiming(operation, duration) {
    if (!PERFORMANCE_CONFIG.trackLoadTimes) return;

    this.metrics.loadTimes.push({
      operation,
      duration,
      timestamp: Date.now()
    });
    this.metrics.totalOperations++;
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    if (typeof performance.memory === 'undefined') return;

    const memory = {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024), // MB
      timestamp: Date.now()
    };

    this.metrics.memoryUsage.push(memory);

    // Keep only last 100 measurements
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage.shift();
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheEvent(isHit) {
    if (!PERFORMANCE_CONFIG.cacheHitRatio) return;

    if (isHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Record error
   */
  recordError() {
    this.metrics.errors++;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const totalCacheEvents = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRatio = totalCacheEvents > 0 ? this.metrics.cacheHits / totalCacheEvents : 0;
    const averageLoadTime = this.metrics.loadTimes.length > 0
      ? this.metrics.loadTimes.reduce((sum, item) => sum + item.duration, 0) / this.metrics.loadTimes.length
      : 0;
    const errorRate = this.metrics.totalOperations > 0 ? this.metrics.errors / this.metrics.totalOperations : 0;

    const currentMemory = this.metrics.memoryUsage.length > 0
      ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
      : null;

    return {
      uptime: Math.round(performance.now() - this.startTime),
      loadTimes: {
        average: Math.round(averageLoadTime),
        count: this.metrics.loadTimes.length,
        recent: this.metrics.loadTimes.slice(-5)
      },
      memory: currentMemory ? {
        used: currentMemory.used,
        total: currentMemory.total,
        percentage: Math.round((currentMemory.used / currentMemory.total) * 100)
      } : null,
      cache: {
        hitRatio: Math.round(cacheHitRatio * 100),
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses
      },
      errors: {
        count: this.metrics.errors,
        rate: Math.round(errorRate * 100)
      },
      health: this.getHealthStatus()
    };
  }

  /**
   * Get overall health status
   */
  getHealthStatus() {
    const summary = this.getSummary();

    // Check against thresholds
    const checks = {
      loadTime: summary.loadTimes.average < PERFORMANCE_CONFIG.adaptiveThresholds.loadTime,
      memory: !summary.memory || summary.memory.used < PERFORMANCE_CONFIG.adaptiveThresholds.memoryUsage,
      errors: summary.errors.rate < (PERFORMANCE_CONFIG.adaptiveThresholds.errorRate * 100)
    };

    const healthyCount = Object.values(checks).filter(Boolean).length;

    if (healthyCount === 3) return 'excellent';
    if (healthyCount === 2) return 'good';
    if (healthyCount === 1) return 'warning';
    return 'critical';
  }
}

// ============================================================================
// ADAPTIVE WASM LOADER
// ============================================================================

/**
 * Adaptive WebAssembly Loader
 * Optimizes loading strategy based on framework detection
 */
class AdaptiveWasmLoader {
  constructor(options = {}) {
    this.options = {
      wasmPath: '../../../dist/farert.wasm',
      jsPath: '../../../dist/farert.js',
      enableCache: true,
      retryAttempts: 3,
      retryDelay: 1000,
      ...options
    };

    this.cache = new Map();
    this.loadingPromises = new Map();
    this.performanceMonitor = new PerformanceMonitor();
    this.frameworkDetector = new BrowserFrameworkDetector();
  }

  /**
   * Initialize the loader with framework detection
   */
  async initialize() {
    const startTime = performance.now();

    try {
      // Start performance monitoring
      this.performanceMonitor.start();

      // Detect framework and adapt loading strategy
      const detection = await this.frameworkDetector.detectFramework();
      console.log('Framework Detection Result:', detection);

      // Adapt loading strategy based on framework
      this.adaptLoadingStrategy(detection);

      const duration = performance.now() - startTime;
      this.performanceMonitor.recordTiming('initialization', duration);

      return {
        success: true,
        framework: detection,
        initTime: Math.round(duration)
      };
    } catch (error) {
      this.performanceMonitor.recordError();
      const duration = performance.now() - startTime;
      this.performanceMonitor.recordTiming('initialization_failed', duration);

      return {
        success: false,
        error: error.message,
        initTime: Math.round(duration)
      };
    }
  }

  /**
   * Adapt loading strategy based on framework
   */
  adaptLoadingStrategy(detection) {
    const { framework, recommendations } = detection;

    // Adjust options based on framework recommendations
    switch (recommendations.loadingStrategy) {
      case 'eager':
        this.options.preload = true;
        this.options.priority = 'high';
        break;
      case 'lazy':
        this.options.preload = false;
        this.options.priority = 'normal';
        break;
      case 'conditional':
        this.options.preload = detection.environment.isDevelopment;
        this.options.priority = 'low';
        break;
    }

    // Adjust cache strategy
    switch (recommendations.cacheStrategy) {
      case 'aggressive':
        this.options.enableCache = true;
        this.options.cacheTimeout = 3600000; // 1 hour
        break;
      case 'moderate':
        this.options.enableCache = true;
        this.options.cacheTimeout = 1800000; // 30 minutes
        break;
      case 'minimal':
        this.options.enableCache = false;
        break;
    }

    console.log(`Adapted loading strategy for ${framework}:`, {
      strategy: recommendations.loadingStrategy,
      cacheStrategy: recommendations.cacheStrategy,
      options: this.options
    });
  }

  /**
   * Load WebAssembly module with adaptive strategy
   */
  async loadWasm() {
    const cacheKey = 'wasm-module';

    // Check cache first
    if (this.options.enableCache && this.cache.has(cacheKey)) {
      this.performanceMonitor.recordCacheEvent(true);
      return this.cache.get(cacheKey);
    }

    // Check if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Start loading
    const loadingPromise = this.performLoad();
    this.loadingPromises.set(cacheKey, loadingPromise);

    try {
      const result = await loadingPromise;

      // Cache result if successful
      if (this.options.enableCache && result.success) {
        this.cache.set(cacheKey, result);

        // Set cache timeout
        if (this.options.cacheTimeout) {
          setTimeout(() => {
            this.cache.delete(cacheKey);
          }, this.options.cacheTimeout);
        }
      }

      this.performanceMonitor.recordCacheEvent(false);
      return result;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Internal loading implementation with retry logic
   */
  async performLoad() {
    let lastError;

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      const startTime = performance.now();

      try {
        console.log(`Loading WebAssembly module (attempt ${attempt}/${this.options.retryAttempts})`);

        // Check if files exist (browser-compatible way)
        await this.checkFileAvailability();

        // Load the JavaScript wrapper
        const module = await this.loadJavaScriptModule();

        // Initialize WebAssembly
        const wasmModule = await this.initializeWasm(module);

        const duration = performance.now() - startTime;
        this.performanceMonitor.recordTiming('wasm_load_success', duration);

        console.log(`WebAssembly module loaded successfully in ${Math.round(duration)}ms`);

        return {
          success: true,
          module: wasmModule,
          loadTime: Math.round(duration),
          attempt
        };
      } catch (error) {
        lastError = error;
        const duration = performance.now() - startTime;
        this.performanceMonitor.recordTiming('wasm_load_failed', duration);
        this.performanceMonitor.recordError();

        console.warn(`Loading attempt ${attempt} failed:`, error.message);

        if (attempt < this.options.retryAttempts) {
          console.log(`Retrying in ${this.options.retryDelay}ms...`);
          await this.delay(this.options.retryDelay);
          this.options.retryDelay *= 1.5; // Exponential backoff
        }
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: this.options.retryAttempts
    };
  }

  /**
   * Check file availability
   */
  async checkFileAvailability() {
    const files = [this.options.jsPath, this.options.wasmPath];

    for (const file of files) {
      try {
        const response = await fetch(file, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`File not found: ${file} (${response.status})`);
        }
      } catch (error) {
        throw new Error(`Cannot access ${file}: ${error.message}`);
      }
    }
  }

  /**
   * Load JavaScript module
   */
  async loadJavaScriptModule() {
    try {
      // Dynamic import for ES modules
      if (this.options.jsPath.startsWith('http') || this.options.jsPath.startsWith('/')) {
        return await import(this.options.jsPath);
      } else {
        // For relative paths, we need to use a different approach
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = this.options.jsPath;
          script.onload = () => {
            if (typeof Module !== 'undefined') {
              resolve({ default: Module });
            } else {
              reject(new Error('Module not found after script load'));
            }
          };
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    } catch (error) {
      throw new Error(`Failed to load JavaScript module: ${error.message}`);
    }
  }

  /**
   * Initialize WebAssembly module
   */
  async initializeWasm(jsModule) {
    const ModuleFactory = jsModule.default || jsModule;

    if (typeof ModuleFactory !== 'function') {
      throw new Error('Invalid module factory');
    }

    const wasmModule = await ModuleFactory({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          return this.options.wasmPath;
        }
        return path;
      }
    });

    // Verify the module has the expected functions
    const requiredFunctions = ['getStationId', 'getStationName', 'addRoute', 'calculateFare'];
    for (const func of requiredFunctions) {
      if (typeof wasmModule[func] !== 'function') {
        throw new Error(`Required function ${func} not found in WebAssembly module`);
      }
    }

    return wasmModule;
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getSummary();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.performanceMonitor.stop();
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// ============================================================================
// ERROR HANDLING AND RECOVERY
// ============================================================================

/**
 * Error Handler with Recovery Strategies
 */
class ErrorHandler {
  constructor() {
    this.errorCount = 0;
    this.errorHistory = [];
    this.recoveryStrategies = new Map();

    this.setupRecoveryStrategies();
  }

  /**
   * Setup error recovery strategies
   */
  setupRecoveryStrategies() {
    this.recoveryStrategies.set('network', {
      strategy: 'retry',
      maxRetries: 3,
      delay: 1000
    });

    this.recoveryStrategies.set('wasm', {
      strategy: 'fallback',
      fallbackUrl: 'https://cdn.jsdelivr.net/npm/farert-wasm/dist/'
    });

    this.recoveryStrategies.set('memory', {
      strategy: 'cleanup',
      forceGC: true
    });

    this.recoveryStrategies.set('compatibility', {
      strategy: 'graceful-degradation',
      minimumFeatures: ['station-lookup', 'basic-calc']
    });
  }

  /**
   * Handle error with appropriate recovery strategy
   */
  async handleError(error, context = {}) {
    this.errorCount++;

    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    this.errorHistory.push(errorInfo);

    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }

    console.error('Error handled:', errorInfo);

    // Determine error type and apply recovery strategy
    const errorType = this.categorizeError(error);
    const strategy = this.recoveryStrategies.get(errorType);

    if (strategy) {
      try {
        const result = await this.applyRecoveryStrategy(errorType, strategy, error, context);
        console.log(`Recovery strategy '${strategy.strategy}' applied for ${errorType} error`);
        return result;
      } catch (recoveryError) {
        console.error('Recovery strategy failed:', recoveryError);
      }
    }

    // If no strategy worked, provide user-friendly error message
    return this.createUserFriendlyError(error, errorType);
  }

  /**
   * Categorize error type
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('404')) {
      return 'network';
    }

    if (message.includes('wasm') || message.includes('module') || message.includes('instantiate')) {
      return 'wasm';
    }

    if (message.includes('memory') || message.includes('heap')) {
      return 'memory';
    }

    if (message.includes('browser') || message.includes('support') || message.includes('compatibility')) {
      return 'compatibility';
    }

    return 'unknown';
  }

  /**
   * Apply recovery strategy
   */
  async applyRecoveryStrategy(errorType, strategy, originalError, context) {
    switch (strategy.strategy) {
      case 'retry':
        return this.retryOperation(context.operation, strategy);

      case 'fallback':
        return this.useFallbackResource(strategy, context);

      case 'cleanup':
        return this.performCleanup(strategy);

      case 'graceful-degradation':
        return this.enableGracefulDegradation(strategy);

      default:
        throw new Error(`Unknown recovery strategy: ${strategy.strategy}`);
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  async retryOperation(operation, strategy) {
    if (!operation || typeof operation !== 'function') {
      throw new Error('No operation provided for retry');
    }

    let delay = strategy.delay;

    for (let i = 0; i < strategy.maxRetries; i++) {
      try {
        await this.delay(delay);
        return await operation();
      } catch (error) {
        if (i === strategy.maxRetries - 1) throw error;
        delay *= 1.5; // Exponential backoff
      }
    }
  }

  /**
   * Use fallback resource
   */
  async useFallbackResource(strategy, context) {
    console.log(`Using fallback resource: ${strategy.fallbackUrl}`);

    // Update context with fallback URL
    if (context.loader) {
      context.loader.options.jsPath = strategy.fallbackUrl + 'farert.js';
      context.loader.options.wasmPath = strategy.fallbackUrl + 'farert.wasm';
      return context.loader.loadWasm();
    }

    throw new Error('No loader context provided for fallback');
  }

  /**
   * Perform memory cleanup
   */
  async performCleanup(strategy) {
    console.log('Performing memory cleanup...');

    // Clear caches
    if (typeof window !== 'undefined' && window.caches) {
      const cacheNames = await window.caches.keys();
      await Promise.all(cacheNames.map(name => window.caches.delete(name)));
    }

    // Force garbage collection if available
    if (strategy.forceGC && typeof window !== 'undefined' && window.gc) {
      window.gc();
    }

    return { success: true, action: 'cleanup' };
  }

  /**
   * Enable graceful degradation
   */
  async enableGracefulDegradation(strategy) {
    console.log('Enabling graceful degradation mode...');

    return {
      success: true,
      action: 'graceful-degradation',
      availableFeatures: strategy.minimumFeatures
    };
  }

  /**
   * Create user-friendly error message
   */
  createUserFriendlyError(error, errorType) {
    const userMessages = {
      network: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
      wasm: 'WebAssemblyモジュールの読み込みに失敗しました。ブラウザがWebAssemblyをサポートしているか確認してください。',
      memory: 'メモリ不足です。他のタブを閉じて再試行してください。',
      compatibility: 'お使いのブラウザはサポートされていません。Chrome 90+、Firefox 88+、Safari 14+、Edge 90+をご利用ください。',
      unknown: '予期しないエラーが発生しました。ページを再読み込みして再試行してください。'
    };

    return {
      success: false,
      error: {
        type: errorType,
        userMessage: userMessages[errorType] || userMessages.unknown,
        technicalMessage: error.message,
        timestamp: new Date().toISOString(),
        canRetry: ['network', 'memory'].includes(errorType)
      }
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const last24Hours = this.errorHistory.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000);

    return {
      total: this.errorCount,
      last24Hours: last24Hours.length,
      types: this.errorHistory.reduce((acc, error) => {
        const type = this.categorizeError({ message: error.message });
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      recent: this.errorHistory.slice(-5)
    };
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// MAIN API CLASS
// ============================================================================

/**
 * Adaptive Farert API
 * Main class that integrates all components
 */
class AdaptiveFarertAPI {
  constructor(options = {}) {
    this.options = {
      enableFrameworkDetection: true,
      enablePerformanceMonitoring: true,
      enableErrorRecovery: true,
      enableAdaptiveLoading: true,
      ...options
    };

    this.loader = new AdaptiveWasmLoader(options);
    this.errorHandler = new ErrorHandler();
    this.wasmModule = null;
    this.initialized = false;
    this.frameworkInfo = null;
  }

  /**
   * Initialize the API
   */
  async initialize() {
    if (this.initialized) {
      return { success: true, cached: true };
    }

    try {
      console.log('Initializing Adaptive Farert API...');

      // Initialize loader with framework detection
      const initResult = await this.loader.initialize();
      if (!initResult.success) {
        throw new Error(initResult.error);
      }

      this.frameworkInfo = initResult.framework;

      // Load WebAssembly module
      const loadResult = await this.loader.loadWasm();
      if (!loadResult.success) {
        throw new Error(loadResult.error?.message || 'Failed to load WebAssembly module');
      }

      this.wasmModule = loadResult.module;
      this.initialized = true;

      console.log('Adaptive Farert API initialized successfully');

      return {
        success: true,
        framework: this.frameworkInfo,
        loadTime: loadResult.loadTime,
        performance: this.loader.getPerformanceMetrics()
      };
    } catch (error) {
      const recoveryResult = await this.errorHandler.handleError(error, {
        operation: () => this.initialize(),
        loader: this.loader
      });

      if (recoveryResult.success) {
        return recoveryResult;
      }

      throw error;
    }
  }

  /**
   * Get station ID by name
   */
  async getStationId(stationName) {
    await this.ensureInitialized();

    try {
      const result = this.wasmModule.getStationId(stationName);
      this.loader.performanceMonitor.recordTiming('getStationId', 1);
      return result;
    } catch (error) {
      return this.errorHandler.handleError(error, { operation: 'getStationId', input: stationName });
    }
  }

  /**
   * Get station name by ID
   */
  async getStationName(stationId) {
    await this.ensureInitialized();

    try {
      const result = this.wasmModule.getStationName(stationId);
      this.loader.performanceMonitor.recordTiming('getStationName', 1);
      return result;
    } catch (error) {
      return this.errorHandler.handleError(error, { operation: 'getStationName', input: stationId });
    }
  }

  /**
   * Calculate fare between stations
   */
  async calculateFare(fromStationId, toStationId) {
    await this.ensureInitialized();

    try {
      const startTime = performance.now();

      // Add route segments
      this.wasmModule.addRouteBegin(fromStationId);
      const result = this.wasmModule.calculateFare();

      const duration = performance.now() - startTime;
      this.loader.performanceMonitor.recordTiming('calculateFare', duration);

      return result;
    } catch (error) {
      return this.errorHandler.handleError(error, {
        operation: 'calculateFare',
        input: { fromStationId, toStationId }
      });
    }
  }

  /**
   * Get comprehensive API status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      framework: this.frameworkInfo,
      performance: this.loader.getPerformanceMetrics(),
      errors: this.errorHandler.getErrorStats(),
      moduleInfo: MODULE_INFO,
      capabilities: this.getCapabilities()
    };
  }

  /**
   * Get API capabilities
   */
  getCapabilities() {
    if (!this.wasmModule) {
      return { available: false };
    }

    const functions = [
      'getStationId', 'getStationName', 'getKanaFromStationId',
      'getLineId', 'getLineName', 'getStationIdsOfLine',
      'addRouteBegin', 'addRoute', 'calculateFare',
      'getPrefects', 'getJRCompanys', 'companyOrPrefectName'
    ];

    const available = functions.filter(func => typeof this.wasmModule[func] === 'function');

    return {
      available: true,
      totalFunctions: functions.length,
      availableFunctions: available.length,
      functions: available
    };
  }

  /**
   * Ensure API is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.loader.cleanup();
    this.wasmModule = null;
    this.initialized = false;
    this.frameworkInfo = null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS AND EXPORTS
// ============================================================================

/**
 * Create API instance with automatic initialization
 */
async function createAdaptiveAPI(options = {}) {
  const api = new AdaptiveFarertAPI(options);
  await api.initialize();
  return api;
}

/**
 * Quick framework detection function
 */
async function detectFramework() {
  const detector = new BrowserFrameworkDetector();
  return detector.detectFramework();
}

/**
 * Browser compatibility check
 */
function checkBrowserCompatibility() {
  const checks = {
    webassembly: typeof WebAssembly !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    promise: typeof Promise !== 'undefined',
    es6: typeof Symbol !== 'undefined',
    modules: typeof import !== 'undefined'
  };

  const supported = Object.values(checks).every(Boolean);

  return {
    supported,
    checks,
    recommendation: supported ? 'Compatible' : 'Please update your browser'
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

// For ES6 modules
export {
  AdaptiveFarertAPI,
  AdaptiveWasmLoader,
  BrowserFrameworkDetector,
  PerformanceMonitor,
  ErrorHandler,
  createAdaptiveAPI,
  detectFramework,
  checkBrowserCompatibility,
  MODULE_INFO,
  PERFORMANCE_CONFIG
};

// For CommonJS/UMD compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AdaptiveFarertAPI,
    AdaptiveWasmLoader,
    BrowserFrameworkDetector,
    PerformanceMonitor,
    ErrorHandler,
    createAdaptiveAPI,
    detectFramework,
    checkBrowserCompatibility,
    MODULE_INFO,
    PERFORMANCE_CONFIG
  };
}

// For global/window object
if (typeof window !== 'undefined') {
  window.FarertAdaptiveAPI = {
    AdaptiveFarertAPI,
    AdaptiveWasmLoader,
    BrowserFrameworkDetector,
    PerformanceMonitor,
    ErrorHandler,
    createAdaptiveAPI,
    detectFramework,
    checkBrowserCompatibility,
    MODULE_INFO,
    PERFORMANCE_CONFIG
  };
}

// Default export for convenience
export default AdaptiveFarertAPI;