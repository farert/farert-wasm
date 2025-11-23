/**
 * Farert Railway API - Enhanced SDK Module
 *
 * Modern ES6+ module demonstrating proper SDK integration patterns
 * with lazy loading, browser utilities, and progressive enhancement.
 *
 * This module showcases:
 * - ES6 module patterns with dynamic imports
 * - SDK utility integration
 * - Lazy loading with performance optimization
 * - Browser compatibility detection
 * - Error handling with graceful degradation
 * - Memory management and cleanup
 *
 * @fileoverview Enhanced SDK Module for Browser Integration
 * @author Claude Code (claude.ai/code)
 * @version 1.0.0
 */

// ============================================================================
// DYNAMIC IMPORTS AND MODULE LOADING
// ============================================================================

/**
 * Lazy load SDK utilities with fallback handling
 */
async function loadSDKUtilities() {
  try {
    // Dynamic import with error handling
    const utilsModule = await import('../../../src/sdk/utils/browser.js');
    const lazyLoaderModule = await import('../../../src/sdk/core/lazy-loader.js');

    return {
      utils: utilsModule,
      lazyLoader: lazyLoaderModule,
      loaded: true,
      error: null
    };
  } catch (error) {
    console.warn('Failed to load SDK modules, falling back to basic functionality:', error);
    return {
      utils: null,
      lazyLoader: null,
      loaded: false,
      error: error.message
    };
  }
}

/**
 * Progressive WebAssembly loading with SDK integration
 */
async function loadWebAssemblyWithSDK(sdkModules) {
  if (!sdkModules.loaded) {
    // Fallback to traditional loading
    return loadWebAssemblyFallback();
  }

  try {
    const { LazyLoader, createFrameworkLazyLoader } = sdkModules.lazyLoader;
    const loader = createFrameworkLazyLoader('vanilla');

    // Use lazy loader for WebAssembly
    const wasmResult = await loader.loadWebAssemblyModule('farert');

    // For now, still need traditional loading as backup
    const traditionalModule = await loadWebAssemblyFallback();

    return {
      module: traditionalModule,
      loader: loader,
      enhanced: true,
      metrics: loader.getMetrics()
    };

  } catch (error) {
    console.warn('Enhanced WebAssembly loading failed, using fallback:', error);
    const traditionalModule = await loadWebAssemblyFallback();
    return {
      module: traditionalModule,
      loader: null,
      enhanced: false,
      metrics: null
    };
  }
}

/**
 * Fallback WebAssembly loading (traditional method)
 */
async function loadWebAssemblyFallback() {
  const response = await fetch('../../dist/farert.js');
  if (!response.ok) {
    throw new Error(`Failed to fetch farert.js: ${response.status} ${response.statusText}`);
  }

  const jsContent = await response.text();
  const script = document.createElement('script');
  script.textContent = jsContent;
  document.head.appendChild(script);

  // Wait for Module to be available
  let attempts = 0;
  while (typeof Module === 'undefined' && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (typeof Module === 'undefined') {
    throw new Error('Emscripten Module not available after loading');
  }

  return new Promise((resolve, reject) => {
    Module({
      locateFile: (path, prefix) => {
        if (path.endsWith('.wasm')) {
          return '../../dist/farert.wasm';
        }
        return prefix + path;
      },
      onRuntimeInitialized: () => {
        resolve(Module);
      },
      onAbort: (error) => {
        reject(new Error(`WebAssembly module aborted: ${error}`));
      },
      print: (text) => {
        console.log('[WASM]', text);
      },
      printErr: (text) => {
        console.error('[WASM ERROR]', text);
      }
    });
  });
}

// ============================================================================
// ENHANCED API WRAPPER CLASS
// ============================================================================

/**
 * Enhanced Farert API wrapper with SDK integration
 */
export class EnhancedFarertAPI {
  constructor() {
    this.wasmModule = null;
    this.sdkModules = null;
    this.lazyLoader = null;
    this.initialized = false;
    this.validators = {
      station: null,
      line: null,
      route: null
    };
    this.routeBuilder = null;
    this.performanceMetrics = {
      initTime: 0,
      apiCalls: 0,
      cacheHits: 0,
      errors: 0
    };
  }

  /**
   * Initialize the enhanced API with SDK integration
   */
  async initialize() {
    const startTime = performance.now();

    try {
      // Step 1: Load SDK modules
      console.log('🔄 Loading SDK modules...');
      this.sdkModules = await loadSDKUtilities();

      // Step 2: Load WebAssembly with SDK enhancement
      console.log('🔄 Loading WebAssembly module...');
      const wasmResult = await loadWebAssemblyWithSDK(this.sdkModules);
      this.wasmModule = wasmResult.module;
      this.lazyLoader = wasmResult.loader;

      // Step 3: Initialize database
      console.log('🔄 Initializing database...');
      const dbResult = this.wasmModule.openDatabase();
      if (!dbResult) {
        throw new Error('Database initialization failed');
      }

      // Step 4: Setup SDK utilities if available
      if (this.sdkModules.loaded) {
        this.setupSDKUtilities();
      }

      this.initialized = true;
      this.performanceMetrics.initTime = performance.now() - startTime;

      console.log('✅ Enhanced Farert API initialized successfully');
      console.log(`⚡ Initialization time: ${this.performanceMetrics.initTime.toFixed(2)}ms`);
      console.log(`🔧 SDK utilities: ${this.sdkModules.loaded ? 'Loaded' : 'Fallback mode'}`);

      return {
        success: true,
        initTime: this.performanceMetrics.initTime,
        sdkLoaded: this.sdkModules.loaded,
        enhanced: wasmResult.enhanced
      };

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Farert API:', error);
      throw error;
    }
  }

  /**
   * Setup SDK utilities and validators
   */
  setupSDKUtilities() {
    if (!this.sdkModules.loaded) return;

    try {
      const { utils } = this.sdkModules;

      // Initialize validators
      this.validators.station = utils.createStationValidator();
      this.validators.line = utils.createLineValidator();
      this.validators.route = utils.createRouteValidator();

      // Initialize route builder
      this.routeBuilder = utils.createRouteBuilder();

      console.log('🔧 SDK utilities configured successfully');
    } catch (error) {
      console.warn('⚠️ Failed to setup SDK utilities:', error);
    }
  }

  /**
   * Enhanced station search with SDK utilities
   */
  async searchStation(stationName) {
    this.performanceMetrics.apiCalls++;

    if (!this.initialized) {
      throw new Error('API not initialized');
    }

    try {
      let formattedName = stationName;
      let parsedName = null;

      // Use SDK formatting if available
      if (this.sdkModules.loaded) {
        formattedName = this.sdkModules.utils.formatStationName(stationName);
        parsedName = this.sdkModules.utils.parseStationName(formattedName);
      }

      const stationId = this.wasmModule.getStationId(formattedName);

      if (stationId <= 0) {
        return {
          found: false,
          original: stationName,
          formatted: formattedName,
          parsed: parsedName,
          message: 'Station not found'
        };
      }

      // Validate station ID if SDK is available
      let isValid = true;
      if (this.validators.station) {
        isValid = this.sdkModules.utils.validateStationId(stationId);
      }

      const stationNameFromId = this.wasmModule.getStationName(stationId);
      const isJunction = this.wasmModule.isJunction ? this.wasmModule.isJunction(stationId) : false;

      // Get additional information
      let kanaName = '';
      if (this.wasmModule.getKanaFromStationId) {
        kanaName = this.wasmModule.getKanaFromStationId(stationId);
      }

      let connectingLines = [];
      if (this.wasmModule.getLineIdsFromStation) {
        try {
          const linesResult = this.wasmModule.getLineIdsFromStation(stationId);
          if (typeof linesResult === 'string') {
            connectingLines = JSON.parse(linesResult);
          } else if (Array.isArray(linesResult)) {
            connectingLines = linesResult;
          }
        } catch (e) {
          console.warn('Failed to get connecting lines:', e);
        }
      }

      this.performanceMetrics.cacheHits++;

      return {
        found: true,
        stationId,
        name: stationNameFromId,
        kana: kanaName,
        isJunction,
        isValid,
        connectingLines: connectingLines.filter(id => id > 0),
        original: stationName,
        formatted: formattedName,
        parsed: parsedName,
        enhanced: this.sdkModules.loaded
      };

    } catch (error) {
      this.performanceMetrics.errors++;
      throw error;
    }
  }

  /**
   * Enhanced line search with SDK utilities
   */
  async searchLine(lineName) {
    this.performanceMetrics.apiCalls++;

    if (!this.initialized) {
      throw new Error('API not initialized');
    }

    try {
      let formattedName = lineName;
      let parsedName = null;

      // Use SDK formatting if available
      if (this.sdkModules.loaded) {
        formattedName = this.sdkModules.utils.formatLineName(lineName);
        parsedName = this.sdkModules.utils.parseLineName(formattedName);
      }

      const lineId = this.wasmModule.getLineId(formattedName);

      if (lineId <= 0) {
        return {
          found: false,
          original: lineName,
          formatted: formattedName,
          parsed: parsedName,
          message: 'Line not found'
        };
      }

      // Validate line ID if SDK is available
      let isValid = true;
      if (this.validators.line) {
        isValid = this.sdkModules.utils.validateLineId(lineId);
      }

      const lineNameFromId = this.wasmModule.getLineName(lineId);

      // Get stations on line
      let stations = [];
      if (this.wasmModule.getStationIdsOfLine) {
        try {
          const stationsResult = this.wasmModule.getStationIdsOfLine(lineId);
          if (typeof stationsResult === 'string') {
            stations = JSON.parse(stationsResult);
          } else if (Array.isArray(stationsResult)) {
            stations = stationsResult;
          }
        } catch (e) {
          console.warn('Failed to get line stations:', e);
        }
      }

      this.performanceMetrics.cacheHits++;

      return {
        found: true,
        lineId,
        name: lineNameFromId,
        isValid,
        stations: stations.filter(id => id > 0),
        stationCount: stations.filter(id => id > 0).length,
        original: lineName,
        formatted: formattedName,
        parsed: parsedName,
        enhanced: this.sdkModules.loaded
      };

    } catch (error) {
      this.performanceMetrics.errors++;
      throw error;
    }
  }

  /**
   * Enhanced route building with SDK utilities
   */
  async buildRoute(routeConfig) {
    this.performanceMetrics.apiCalls++;

    if (!this.initialized) {
      throw new Error('API not initialized');
    }

    try {
      const { start, via, end } = routeConfig;

      // Validate route configuration if SDK is available
      let routeValidation = { isValid: true, errors: [] };
      if (this.validators.route) {
        routeValidation = this.sdkModules.utils.validateRoute(routeConfig);
      }

      // Format route if SDK is available
      let formattedRoute = `${start} → ${via} → ${end}`;
      if (this.sdkModules.loaded) {
        formattedRoute = this.sdkModules.utils.formatRoute(routeConfig);
      }

      // Get station and line IDs with formatting
      const startStationId = this.wasmModule.getStationId(
        this.sdkModules.loaded ? this.sdkModules.utils.formatStationName(start) : start
      );
      const lineId = this.wasmModule.getLineId(
        this.sdkModules.loaded ? this.sdkModules.utils.formatLineName(via) : via
      );
      const endStationId = this.wasmModule.getStationId(
        this.sdkModules.loaded ? this.sdkModules.utils.formatStationName(end) : end
      );

      // Validate IDs
      if (startStationId <= 0) throw new Error(`Start station "${start}" not found`);
      if (lineId <= 0) throw new Error(`Line "${via}" not found`);
      if (endStationId <= 0) throw new Error(`End station "${end}" not found`);

      // Build route using SDK RouteBuilder if available
      if (this.routeBuilder) {
        this.routeBuilder.reset();
        this.routeBuilder.setStart(startStationId);
        this.routeBuilder.addSegment(lineId, endStationId);
      }

      // Execute route building with WebAssembly
      let routeResult = this.wasmModule.addRouteBegin(startStationId);
      if (!routeResult) throw new Error('Failed to start route');

      routeResult = this.wasmModule.addRoute(lineId, endStationId);
      if (!routeResult) throw new Error('Failed to add route segment');

      // Calculate fare
      const fare = this.wasmModule.calculateFare();
      const formattedFare = this.sdkModules.loaded ?
        this.sdkModules.utils.formatFare(fare) : `¥${fare}`;

      // Get route description
      let routeDescription = '';
      if (this.wasmModule.routeScript) {
        routeDescription = this.wasmModule.routeScript();
      }

      this.performanceMetrics.cacheHits++;

      return {
        success: true,
        validation: routeValidation,
        route: {
          startStationId,
          lineId,
          endStationId,
          fare,
          formattedFare,
          description: routeDescription,
          formatted: formattedRoute
        },
        enhanced: this.sdkModules.loaded
      };

    } catch (error) {
      this.performanceMetrics.errors++;
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = {
      ...this.performanceMetrics,
      cacheHitRatio: this.performanceMetrics.apiCalls > 0 ?
        (this.performanceMetrics.cacheHits / this.performanceMetrics.apiCalls) * 100 : 0
    };

    if (this.lazyLoader) {
      metrics.lazyLoader = this.lazyLoader.getMetrics();
    }

    return metrics;
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    const info = {
      initialized: this.initialized,
      sdkLoaded: this.sdkModules?.loaded || false,
      wasmLoaded: !!this.wasmModule,
      validators: {
        station: !!this.validators.station,
        line: !!this.validators.line,
        route: !!this.validators.route
      },
      routeBuilder: !!this.routeBuilder,
      lazyLoader: !!this.lazyLoader
    };

    if (this.sdkModules?.loaded) {
      try {
        const frameworkInfo = this.sdkModules.utils.getFrameworkInfo();
        info.framework = frameworkInfo;
      } catch (e) {
        info.framework = { name: 'unknown', version: 'unknown' };
      }
    }

    return info;
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.lazyLoader) {
      this.lazyLoader.dispose();
    }

    this.wasmModule = null;
    this.sdkModules = null;
    this.lazyLoader = null;
    this.initialized = false;
    this.validators = { station: null, line: null, route: null };
    this.routeBuilder = null;

    console.log('🧹 Enhanced Farert API disposed');
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create an enhanced API instance with initialization
 */
export async function createEnhancedFarertAPI() {
  const api = new EnhancedFarertAPI();
  await api.initialize();
  return api;
}

/**
 * Browser compatibility check
 */
export function checkBrowserCompatibility() {
  const checks = {
    webAssembly: typeof WebAssembly !== 'undefined',
    esModules: typeof import !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    promises: typeof Promise !== 'undefined',
    arrow: (() => { try { eval('(() => {})'); return true; } catch (e) { return false; } })(),
    templateLiterals: (() => { try { eval('`test`'); return true; } catch (e) { return false; } })()
  };

  const compatible = Object.values(checks).every(Boolean);

  return {
    compatible,
    checks,
    recommendations: compatible ? [] : [
      'Update to a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)',
      'Enable JavaScript if disabled',
      'Check for browser extensions that might block WebAssembly'
    ]
  };
}

/**
 * Progressive enhancement detector
 */
export function detectProgressiveEnhancement() {
  const features = {
    basicJS: typeof document !== 'undefined',
    es6Modules: typeof import !== 'undefined',
    webAssembly: typeof WebAssembly !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    webWorkers: typeof Worker !== 'undefined'
  };

  const enhancementLevel = Object.values(features).filter(Boolean).length;

  return {
    level: enhancementLevel,
    maxLevel: Object.keys(features).length,
    percentage: (enhancementLevel / Object.keys(features).length) * 100,
    features,
    recommendation: enhancementLevel >= 4 ? 'full' : enhancementLevel >= 2 ? 'partial' : 'basic'
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default EnhancedFarertAPI;

// ============================================================================
// BROWSER GLOBAL EXPOSURE (for non-module environments)
// ============================================================================

if (typeof window !== 'undefined') {
  window.EnhancedFarertAPI = EnhancedFarertAPI;
  window.createEnhancedFarertAPI = createEnhancedFarertAPI;
  window.checkBrowserCompatibility = checkBrowserCompatibility;
  window.detectProgressiveEnhancement = detectProgressiveEnhancement;
}