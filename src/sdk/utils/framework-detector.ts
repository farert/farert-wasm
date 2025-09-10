/**
 * Framework Detection Utility for Farert SDK
 * 
 * Provides runtime framework detection and automatic optimization for different
 * JavaScript frameworks and environments. Enables intelligent loading strategies
 * and framework-specific optimizations.
 * 
 * Features:
 * - Runtime framework detection (Svelte, React, Vue, Angular, Vanilla)
 * - Environment detection (Browser, Node.js, SSR, Development)
 * - Dynamic import patterns for conditional framework loading
 * - Bundle size optimization through tree-shaking
 * - Performance optimization recommendations
 * 
 * Requirements: REQ-API-005
 * @fileoverview Framework Detection Utility for Frontend API Layer
 * @author Claude Code (claude.ai/code)
 * @version 1.0.0
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Supported JavaScript frameworks
 */
export type Framework = 
  | 'svelte' 
  | 'sveltekit' 
  | 'react' 
  | 'nextjs' 
  | 'vue' 
  | 'nuxtjs' 
  | 'angular' 
  | 'vanilla' 
  | 'unknown';

/**
 * Environment types
 */
export type Environment = 'browser' | 'node' | 'webworker' | 'unknown';

/**
 * Rendering mode detection
 */
export type RenderingMode = 'csr' | 'ssr' | 'ssg' | 'unknown';

/**
 * Module system types
 */
export type ModuleSystem = 'esm' | 'commonjs' | 'umd' | 'iife' | 'unknown';

/**
 * Framework detection confidence levels
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Framework detection result
 */
export interface FrameworkDetectionResult {
  /** Primary detected framework */
  framework: Framework;
  /** Detection confidence level */
  confidence: ConfidenceLevel;
  /** Framework version if available */
  version?: string;
  /** Additional framework features detected */
  features: string[];
  /** Meta-framework if applicable (e.g., Next.js for React) */
  metaFramework?: string;
  /** Environment information */
  environment: {
    type: Environment;
    renderingMode: RenderingMode;
    moduleSystem: ModuleSystem;
    isDevelopment: boolean;
    isSSR: boolean;
    isClient: boolean;
  };
  /** Performance recommendations */
  recommendations: {
    loadingStrategy: 'eager' | 'lazy' | 'conditional';
    bundleOptimization: string[];
    cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  };
}

/**
 * Framework-specific loading configuration
 */
export interface FrameworkLoadingConfig {
  /** Framework adapter module path */
  adapterPath: string;
  /** Required features for this framework */
  requiredFeatures: string[];
  /** Optional features that can be loaded conditionally */
  optionalFeatures: string[];
  /** Bundle optimization hints */
  optimizations: {
    treeshaking: boolean;
    sideEffects: boolean;
    dynamicImports: boolean;
  };
}

/**
 * Dynamic import result with error handling
 */
export interface DynamicImportResult<T = any> {
  success: boolean;
  module?: T;
  error?: Error;
  loadTime: number;
}

// ============================================================================
// FRAMEWORK DETECTION CORE
// ============================================================================

/**
 * Framework Detection Engine
 * 
 * Provides comprehensive framework and environment detection capabilities
 * with intelligent loading strategies and optimization recommendations.
 */
export class FrameworkDetector {
  private static instance: FrameworkDetector;
  private detectionCache: Map<string, FrameworkDetectionResult> = new Map();
  private loadingCache: Map<string, Promise<DynamicImportResult>> = new Map();
  
  /**
   * Get singleton instance
   */
  static getInstance(): FrameworkDetector {
    if (!FrameworkDetector.instance) {
      FrameworkDetector.instance = new FrameworkDetector();
    }
    return FrameworkDetector.instance;
  }

  /**
   * Perform comprehensive framework detection
   */
  async detect(options: {
    includeVersion?: boolean;
    includeFeatures?: boolean;
    useCache?: boolean;
  } = {}): Promise<FrameworkDetectionResult> {
    const { includeVersion = true, includeFeatures = true, useCache = true } = options;
    
    const cacheKey = `detection-${includeVersion}-${includeFeatures}`;
    if (useCache && this.detectionCache.has(cacheKey)) {
      return this.detectionCache.get(cacheKey)!;
    }

    const result = await this.performDetection(includeVersion, includeFeatures);
    
    if (useCache) {
      this.detectionCache.set(cacheKey, result);
    }
    
    return result;
  }

  /**
   * Internal detection implementation
   */
  private async performDetection(
    includeVersion: boolean, 
    includeFeatures: boolean
  ): Promise<FrameworkDetectionResult> {
    const environment = this.detectEnvironment();
    const framework = this.detectFramework();
    const confidence = this.calculateConfidence(framework);
    
    let version: string | undefined;
    if (includeVersion) {
      version = await this.detectVersion(framework);
    }
    
    let features: string[] = [];
    if (includeFeatures) {
      features = this.detectFeatures(framework);
    }
    
    const metaFramework = this.detectMetaFramework(framework);
    const recommendations = this.generateRecommendations(framework, environment);

    return {
      framework,
      confidence,
      version,
      features,
      metaFramework,
      environment,
      recommendations
    };
  }

  /**
   * Detect current environment (browser, Node.js, etc.)
   */
  private detectEnvironment(): FrameworkDetectionResult['environment'] {
    // Environment type detection
    let type: Environment = 'unknown';
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      type = 'browser';
    } else if (typeof global !== 'undefined' && typeof process !== 'undefined') {
      type = 'node';
    } else if (typeof self !== 'undefined' && typeof importScripts === 'function') {
      type = 'webworker';
    }

    // Rendering mode detection
    let renderingMode: RenderingMode = 'unknown';
    if (type === 'browser') {
      if (typeof window !== 'undefined' && (window as any).__PRERENDER_INJECTED) {
        renderingMode = 'ssg';
      } else if (typeof document !== 'undefined' && document.querySelector('script[data-sveltekit-hydrate]')) {
        renderingMode = 'ssr';
      } else {
        renderingMode = 'csr';
      }
    } else if (type === 'node') {
      renderingMode = 'ssr';
    }

    // Module system detection
    let moduleSystem: ModuleSystem = 'unknown';
    if (typeof module !== 'undefined' && module.exports) {
      moduleSystem = 'commonjs';
    } else if (typeof import !== 'undefined') {
      moduleSystem = 'esm';
    }

    // Development mode detection
    const isDevelopment = (
      typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
    ) || (
      typeof window !== 'undefined' && (window as any).__DEV__
    );

    const isSSR = type === 'node' || renderingMode === 'ssr';
    const isClient = type === 'browser' && renderingMode === 'csr';

    return {
      type,
      renderingMode,
      moduleSystem,
      isDevelopment,
      isSSR,
      isClient
    };
  }

  /**
   * Detect primary framework
   */
  private detectFramework(): Framework {
    // Check for Svelte/SvelteKit
    if (this.checkSvelte()) {
      return this.checkSvelteKit() ? 'sveltekit' : 'svelte';
    }
    
    // Check for React/Next.js
    if (this.checkReact()) {
      return this.checkNextJS() ? 'nextjs' : 'react';
    }
    
    // Check for Vue/Nuxt.js
    if (this.checkVue()) {
      return this.checkNuxtJS() ? 'nuxtjs' : 'vue';
    }
    
    // Check for Angular
    if (this.checkAngular()) {
      return 'angular';
    }
    
    // Check for framework indicators in DOM or globals
    if (typeof window !== 'undefined') {
      const frameworks = this.scanDOMForFrameworks();
      if (frameworks.length > 0) {
        return frameworks[0] as Framework;
      }
    }
    
    return 'vanilla';
  }

  /**
   * Check for Svelte presence
   */
  private checkSvelte(): boolean {
    try {
      // Check for Svelte compiler output
      if (typeof window !== 'undefined') {
        const scripts = Array.from(document.scripts);
        const hasCompilerOutput = scripts.some(script => 
          script.textContent?.includes('SvelteComponent') ||
          script.textContent?.includes('create_component')
        );
        if (hasCompilerOutput) return true;
      }
      
      // Check for Svelte runtime
      return typeof (globalThis as any).__SVELTE__ !== 'undefined' ||
             typeof (globalThis as any).svelte !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Check for SvelteKit presence
   */
  private checkSvelteKit(): boolean {
    try {
      return typeof (globalThis as any).__SVELTEKIT__ !== 'undefined' ||
             typeof (globalThis as any).sveltekit !== 'undefined' ||
             (typeof window !== 'undefined' && 
              document.querySelector('script[data-sveltekit-hydrate]') !== null);
    } catch {
      return false;
    }
  }

  /**
   * Check for React presence
   */
  private checkReact(): boolean {
    try {
      return typeof (globalThis as any).React !== 'undefined' ||
             typeof (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ||
             (typeof window !== 'undefined' && 
              document.querySelector('[data-reactroot]') !== null);
    } catch {
      return false;
    }
  }

  /**
   * Check for Next.js presence
   */
  private checkNextJS(): boolean {
    try {
      return typeof (globalThis as any).__NEXT_DATA__ !== 'undefined' ||
             typeof (globalThis as any).next !== 'undefined' ||
             (typeof window !== 'undefined' && 
              document.querySelector('#__next') !== null);
    } catch {
      return false;
    }
  }

  /**
   * Check for Vue presence
   */
  private checkVue(): boolean {
    try {
      return typeof (globalThis as any).Vue !== 'undefined' ||
             typeof (globalThis as any).__VUE__ !== 'undefined' ||
             (typeof window !== 'undefined' && 
              document.querySelector('[data-v-]') !== null);
    } catch {
      return false;
    }
  }

  /**
   * Check for Nuxt.js presence
   */
  private checkNuxtJS(): boolean {
    try {
      return typeof (globalThis as any).__NUXT__ !== 'undefined' ||
             typeof (globalThis as any).nuxt !== 'undefined' ||
             (typeof window !== 'undefined' && 
              document.querySelector('#__nuxt') !== null);
    } catch {
      return false;
    }
  }

  /**
   * Check for Angular presence
   */
  private checkAngular(): boolean {
    try {
      return typeof (globalThis as any).ng !== 'undefined' ||
             typeof (globalThis as any).getAllAngularRootElements !== 'undefined' ||
             (typeof window !== 'undefined' && 
              document.querySelector('[ng-version]') !== null);
    } catch {
      return false;
    }
  }

  /**
   * Scan DOM for framework indicators
   */
  private scanDOMForFrameworks(): string[] {
    if (typeof document === 'undefined') return [];
    
    const indicators = [
      { framework: 'svelte', selectors: ['[data-svelte-h]', '[data-svelte]'] },
      { framework: 'react', selectors: ['[data-reactroot]', '[data-reactid]'] },
      { framework: 'vue', selectors: ['[data-v-]', '[v-cloak]'] },
      { framework: 'angular', selectors: ['[ng-version]', '[ng-app]'] }
    ];
    
    return indicators
      .filter(({ selectors }) => 
        selectors.some(selector => document.querySelector(selector) !== null)
      )
      .map(({ framework }) => framework);
  }

  /**
   * Calculate detection confidence level
   */
  private calculateConfidence(framework: Framework): ConfidenceLevel {
    if (framework === 'unknown' || framework === 'vanilla') {
      return 'low';
    }
    
    // Multiple detection methods increase confidence
    const checks = [
      this.checkSvelte() || this.checkSvelteKit(),
      this.checkReact() || this.checkNextJS(),
      this.checkVue() || this.checkNuxtJS(),
      this.checkAngular()
    ].filter(Boolean).length;
    
    if (checks >= 2) return 'high';
    if (checks === 1) return 'medium';
    return 'low';
  }

  /**
   * Detect framework version
   */
  private async detectVersion(framework: Framework): Promise<string | undefined> {
    try {
      switch (framework) {
        case 'svelte':
        case 'sveltekit':
          return (globalThis as any).__SVELTE__?.version || 
                 (globalThis as any).__SVELTEKIT__?.version;
        
        case 'react':
        case 'nextjs':
          return (globalThis as any).React?.version;
        
        case 'vue':
        case 'nuxtjs':
          return (globalThis as any).Vue?.version;
        
        case 'angular':
          return (globalThis as any).ng?.VERSION?.full;
        
        default:
          return undefined;
      }
    } catch {
      return undefined;
    }
  }

  /**
   * Detect framework-specific features
   */
  private detectFeatures(framework: Framework): string[] {
    const features: string[] = [];
    
    try {
      switch (framework) {
        case 'svelte':
        case 'sveltekit':
          if (typeof (globalThis as any).__SVELTE_HMR__ !== 'undefined') {
            features.push('hmr');
          }
          if (framework === 'sveltekit') {
            features.push('ssr', 'routing', 'preloading');
          }
          break;
        
        case 'react':
        case 'nextjs':
          if (typeof (globalThis as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
            features.push('devtools');
          }
          if (framework === 'nextjs') {
            features.push('ssr', 'ssg', 'routing', 'api-routes');
          }
          break;
        
        case 'vue':
        case 'nuxtjs':
          if (typeof (globalThis as any).__VUE_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
            features.push('devtools');
          }
          if (framework === 'nuxtjs') {
            features.push('ssr', 'ssg', 'routing', 'modules');
          }
          break;
        
        case 'angular':
          features.push('typescript', 'routing', 'di', 'rxjs');
          break;
      }
    } catch {
      // Ignore errors in feature detection
    }
    
    return features;
  }

  /**
   * Detect meta-framework
   */
  private detectMetaFramework(framework: Framework): string | undefined {
    switch (framework) {
      case 'sveltekit':
        return 'SvelteKit';
      case 'nextjs':
        return 'Next.js';
      case 'nuxtjs':
        return 'Nuxt.js';
      default:
        return undefined;
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    framework: Framework, 
    environment: FrameworkDetectionResult['environment']
  ): FrameworkDetectionResult['recommendations'] {
    const recommendations = {
      loadingStrategy: 'lazy' as const,
      bundleOptimization: [] as string[],
      cacheStrategy: 'moderate' as const
    };

    // Framework-specific optimizations
    switch (framework) {
      case 'svelte':
      case 'sveltekit':
        recommendations.loadingStrategy = 'eager';
        recommendations.bundleOptimization.push('tree-shaking', 'component-splitting');
        recommendations.cacheStrategy = 'aggressive';
        break;
      
      case 'react':
      case 'nextjs':
        recommendations.loadingStrategy = 'lazy';
        recommendations.bundleOptimization.push('code-splitting', 'dynamic-imports');
        break;
      
      case 'vue':
      case 'nuxtjs':
        recommendations.loadingStrategy = 'lazy';
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

    // Environment-specific adjustments
    if (environment.isDevelopment) {
      recommendations.cacheStrategy = 'minimal';
    }
    
    if (environment.isSSR) {
      recommendations.bundleOptimization.push('ssr-optimization');
    }

    return recommendations;
  }
}

// ============================================================================
// DYNAMIC LOADING UTILITIES
// ============================================================================

/**
 * Framework-specific loading configurations
 */
const FRAMEWORK_CONFIGS: Record<Framework, FrameworkLoadingConfig | null> = {
  svelte: {
    adapterPath: '../svelte/index',
    requiredFeatures: ['stores', 'components'],
    optionalFeatures: ['context'],
    optimizations: {
      treeshaking: true,
      sideEffects: false,
      dynamicImports: true
    }
  },
  sveltekit: {
    adapterPath: '../svelte/sveltekit-adapter',
    requiredFeatures: ['stores', 'components', 'ssr'],
    optionalFeatures: ['context', 'preloading'],
    optimizations: {
      treeshaking: true,
      sideEffects: false,
      dynamicImports: true
    }
  },
  react: {
    adapterPath: '../react/react-adapter',
    requiredFeatures: ['hooks', 'context'],
    optionalFeatures: ['error-boundary'],
    optimizations: {
      treeshaking: true,
      sideEffects: false,
      dynamicImports: true
    }
  },
  nextjs: {
    adapterPath: '../react/react-adapter',
    requiredFeatures: ['hooks', 'context', 'ssr'],
    optionalFeatures: ['error-boundary'],
    optimizations: {
      treeshaking: true,
      sideEffects: false,
      dynamicImports: true
    }
  },
  vue: {
    adapterPath: '../vue/vue-adapter',
    requiredFeatures: ['composables', 'plugin'],
    optionalFeatures: ['reactivity'],
    optimizations: {
      treeshaking: true,
      sideEffects: false,
      dynamicImports: true
    }
  },
  nuxtjs: {
    adapterPath: '../vue/vue-adapter',
    requiredFeatures: ['composables', 'plugin', 'ssr'],
    optionalFeatures: ['reactivity'],
    optimizations: {
      treeshaking: true,
      sideEffects: false,
      dynamicImports: true
    }
  },
  angular: null, // Not implemented yet
  vanilla: null, // Uses core SDK directly
  unknown: null
};

/**
 * Dynamic framework adapter loader
 */
export class FrameworkLoader {
  private static instance: FrameworkLoader;
  private loadingPromises: Map<string, Promise<DynamicImportResult>> = new Map();
  
  /**
   * Get singleton instance
   */
  static getInstance(): FrameworkLoader {
    if (!FrameworkLoader.instance) {
      FrameworkLoader.instance = new FrameworkLoader();
    }
    return FrameworkLoader.instance;
  }

  /**
   * Load framework adapter dynamically
   */
  async loadFrameworkAdapter(framework: Framework): Promise<DynamicImportResult> {
    const cacheKey = `adapter-${framework}`;
    
    // Return cached promise if already loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }
    
    const loadingPromise = this.performLoad(framework);
    this.loadingPromises.set(cacheKey, loadingPromise);
    
    try {
      return await loadingPromise;
    } finally {
      // Remove from cache after completion (success or failure)
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * Internal loading implementation
   */
  private async performLoad(framework: Framework): Promise<DynamicImportResult> {
    const startTime = performance?.now?.() || Date.now();
    
    const config = FRAMEWORK_CONFIGS[framework];
    if (!config) {
      return {
        success: false,
        error: new Error(`No adapter available for framework: ${framework}`),
        loadTime: 0
      };
    }

    try {
      // Dynamic import with error handling
      const module = await import(config.adapterPath);
      const loadTime = (performance?.now?.() || Date.now()) - startTime;
      
      return {
        success: true,
        module,
        loadTime
      };
    } catch (error) {
      const loadTime = (performance?.now?.() || Date.now()) - startTime;
      
      return {
        success: false,
        error: error as Error,
        loadTime
      };
    }
  }

  /**
   * Check if framework adapter is available
   */
  isAdapterAvailable(framework: Framework): boolean {
    return FRAMEWORK_CONFIGS[framework] !== null;
  }

  /**
   * Get framework configuration
   */
  getFrameworkConfig(framework: Framework): FrameworkLoadingConfig | null {
    return FRAMEWORK_CONFIGS[framework];
  }

  /**
   * Preload framework adapter
   */
  async preloadAdapter(framework: Framework): Promise<void> {
    try {
      await this.loadFrameworkAdapter(framework);
    } catch {
      // Ignore preload errors
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick framework detection (cached)
 */
export async function detectFramework(): Promise<Framework> {
  const detector = FrameworkDetector.getInstance();
  const result = await detector.detect({ includeVersion: false, includeFeatures: false });
  return result.framework;
}

/**
 * Quick environment detection
 */
export function detectEnvironment(): Environment {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'browser';
  } else if (typeof global !== 'undefined' && typeof process !== 'undefined') {
    return 'node';
  } else if (typeof self !== 'undefined' && typeof importScripts === 'function') {
    return 'webworker';
  }
  return 'unknown';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return (
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
  ) || (
    typeof window !== 'undefined' && (window as any).__DEV__
  );
}

/**
 * Check if running in SSR context
 */
export function isSSR(): boolean {
  return typeof window === 'undefined' && typeof global !== 'undefined';
}

/**
 * Load optimal framework adapter based on detection
 */
export async function loadOptimalAdapter(): Promise<DynamicImportResult> {
  const framework = await detectFramework();
  const loader = FrameworkLoader.getInstance();
  return loader.loadFrameworkAdapter(framework);
}

/**
 * Get framework-specific optimization recommendations
 */
export async function getOptimizationRecommendations(): Promise<{
  loadingStrategy: string;
  bundleOptimizations: string[];
  cacheStrategy: string;
}> {
  const detector = FrameworkDetector.getInstance();
  const result = await detector.detect();
  return {
    loadingStrategy: result.recommendations.loadingStrategy,
    bundleOptimizations: result.recommendations.bundleOptimization,
    cacheStrategy: result.recommendations.cacheStrategy
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  FrameworkDetector,
  FrameworkLoader
};

// Default exports for convenience
export default {
  FrameworkDetector,
  FrameworkLoader,
  detectFramework,
  detectEnvironment,
  isDevelopment,
  isSSR,
  loadOptimalAdapter,
  getOptimizationRecommendations
};