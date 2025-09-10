/**
 * Lazy Loading Utilities for Farert SDK
 * 
 * Provides dynamic import patterns, conditional loading, and performance optimization
 * for frontend framework integrations. Reduces initial bundle size through
 * on-demand module loading with intelligent caching and fallback mechanisms.
 * 
 * Features:
 * - Dynamic import patterns for framework modules
 * - Conditional loading based on framework detection
 * - Bundle size optimization through lazy loading
 * - Error handling and fallback mechanisms
 * - Performance monitoring and optimization
 * - Memory management for loaded modules
 * 
 * Requirements: Performance requirements
 * @fileoverview Lazy Loading Utilities for Frontend API Layer
 * @author Claude Code (claude.ai/code)
 * @version 1.0.0
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Lazy loading strategy types
 */
export type LoadingStrategy = 'immediate' | 'lazy' | 'preload' | 'prefetch';

/**
 * Module loading priority levels
 */
export type LoadingPriority = 'high' | 'medium' | 'low';

/**
 * Framework module types for conditional loading
 */
export type ModuleType = 
  | 'core' 
  | 'svelte' 
  | 'react' 
  | 'vue' 
  | 'angular'
  | 'components'
  | 'stores'
  | 'utils'
  | 'webassembly';

/**
 * Loading state for modules
 */
export interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  error?: Error;
  loadTime?: number;
  retryCount: number;
}

/**
 * Module metadata for optimization
 */
export interface ModuleMetadata {
  name: string;
  type: ModuleType;
  size?: number;
  dependencies: string[];
  priority: LoadingPriority;
  strategy: LoadingStrategy;
  framework?: string;
  version?: string;
}

/**
 * Lazy loading configuration
 */
export interface LazyLoadConfig {
  strategy: LoadingStrategy;
  priority: LoadingPriority;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  preloadThreshold: number;
  cacheEnabled: boolean;
  performanceMonitoring: boolean;
}

/**
 * Loading result with performance metrics
 */
export interface LoadingResult<T = any> {
  module: T;
  metadata: ModuleMetadata;
  loadTime: number;
  fromCache: boolean;
  bundleSize?: number;
}

/**
 * Performance metrics for loaded modules
 */
export interface LoadingMetrics {
  totalModules: number;
  loadedModules: number;
  failedModules: number;
  averageLoadTime: number;
  totalBundleSize: number;
  cacheHitRatio: number;
  memoryUsage: number;
}

/**
 * Preloading hint for optimization
 */
export interface PreloadHint {
  moduleId: string;
  priority: LoadingPriority;
  condition?: () => boolean;
  delay?: number;
}

// ============================================================================
// LAZY LOADER CLASS
// ============================================================================

/**
 * Main lazy loading utility class for Farert SDK
 */
export class LazyLoader {
  private moduleCache = new Map<string, any>();
  private loadingStates = new Map<string, LoadingState>();
  private moduleMetadata = new Map<string, ModuleMetadata>();
  private loadingPromises = new Map<string, Promise<any>>();
  private performanceMetrics: LoadingMetrics;
  private preloadHints: PreloadHint[] = [];
  private config: LazyLoadConfig;

  constructor(config: Partial<LazyLoadConfig> = {}) {
    this.config = {
      strategy: 'lazy',
      priority: 'medium',
      timeout: 10000, // 10 seconds
      retryAttempts: 3,
      retryDelay: 1000,
      preloadThreshold: 100, // preload if likely to be used within 100ms
      cacheEnabled: true,
      performanceMonitoring: true,
      ...config,
    };

    this.performanceMetrics = {
      totalModules: 0,
      loadedModules: 0,
      failedModules: 0,
      averageLoadTime: 0,
      totalBundleSize: 0,
      cacheHitRatio: 0,
      memoryUsage: 0,
    };

    this.initializePreloading();
  }

  /**
   * Load a module with dynamic import and caching
   */
  async loadModule<T = any>(
    moduleId: string,
    importPath: string,
    metadata?: Partial<ModuleMetadata>
  ): Promise<LoadingResult<T>> {
    const startTime = performance.now();

    // Check cache first
    if (this.config.cacheEnabled && this.moduleCache.has(moduleId)) {
      const module = this.moduleCache.get(moduleId);
      return {
        module,
        metadata: this.moduleMetadata.get(moduleId)!,
        loadTime: 0,
        fromCache: true,
      };
    }

    // Check if already loading
    if (this.loadingPromises.has(moduleId)) {
      const module = await this.loadingPromises.get(moduleId)!;
      return {
        module,
        metadata: this.moduleMetadata.get(moduleId)!,
        loadTime: performance.now() - startTime,
        fromCache: false,
      };
    }

    // Initialize loading state
    this.setLoadingState(moduleId, {
      isLoading: true,
      isLoaded: false,
      hasError: false,
      retryCount: 0,
    });

    // Store metadata
    if (metadata) {
      this.moduleMetadata.set(moduleId, {
        name: moduleId,
        type: 'core',
        dependencies: [],
        priority: this.config.priority,
        strategy: this.config.strategy,
        ...metadata,
      });
    }

    // Create loading promise with retry logic
    const loadingPromise = this.loadWithRetry<T>(moduleId, importPath);
    this.loadingPromises.set(moduleId, loadingPromise);

    try {
      const module = await loadingPromise;
      const loadTime = performance.now() - startTime;

      // Cache the module
      if (this.config.cacheEnabled) {
        this.moduleCache.set(moduleId, module);
      }

      // Update loading state
      this.setLoadingState(moduleId, {
        isLoading: false,
        isLoaded: true,
        hasError: false,
        loadTime,
        retryCount: this.getLoadingState(moduleId).retryCount,
      });

      // Update metrics
      this.updateMetrics(moduleId, loadTime);

      // Clean up loading promise
      this.loadingPromises.delete(moduleId);

      return {
        module,
        metadata: this.moduleMetadata.get(moduleId)!,
        loadTime,
        fromCache: false,
      };

    } catch (error) {
      // Update loading state with error
      this.setLoadingState(moduleId, {
        isLoading: false,
        isLoaded: false,
        hasError: true,
        error: error as Error,
        retryCount: this.getLoadingState(moduleId).retryCount,
      });

      // Update metrics
      this.performanceMetrics.failedModules++;

      // Clean up loading promise
      this.loadingPromises.delete(moduleId);

      throw error;
    }
  }

  /**
   * Load Svelte-specific modules with optimization
   */
  async loadSvelteModule<T = any>(moduleName: string): Promise<LoadingResult<T>> {
    const importPath = this.getSvelteImportPath(moduleName);
    return this.loadModule<T>(`svelte-${moduleName}`, importPath, {
      type: 'svelte',
      framework: 'svelte',
      priority: 'high',
      dependencies: ['svelte'],
    });
  }

  /**
   * Load React-specific modules with optimization
   */
  async loadReactModule<T = any>(moduleName: string): Promise<LoadingResult<T>> {
    const importPath = this.getReactImportPath(moduleName);
    return this.loadModule<T>(`react-${moduleName}`, importPath, {
      type: 'react',
      framework: 'react',
      priority: 'medium',
      dependencies: ['react'],
    });
  }

  /**
   * Load Vue-specific modules with optimization
   */
  async loadVueModule<T = any>(moduleName: string): Promise<LoadingResult<T>> {
    const importPath = this.getVueImportPath(moduleName);
    return this.loadModule<T>(`vue-${moduleName}`, importPath, {
      type: 'vue',
      framework: 'vue',
      priority: 'medium',
      dependencies: ['vue'],
    });
  }

  /**
   * Load WebAssembly modules with special handling
   */
  async loadWebAssemblyModule<T = any>(moduleName: string): Promise<LoadingResult<T>> {
    const importPath = this.getWebAssemblyImportPath(moduleName);
    return this.loadModule<T>(`wasm-${moduleName}`, importPath, {
      type: 'webassembly',
      priority: 'high',
      strategy: 'immediate',
      dependencies: [],
    });
  }

  /**
   * Preload modules based on framework detection
   */
  async preloadFrameworkModules(framework: string): Promise<void> {
    const frameworkModules = this.getFrameworkModules(framework);
    
    const preloadPromises = frameworkModules.map(async (moduleInfo) => {
      try {
        await this.loadModule(
          moduleInfo.id,
          moduleInfo.path,
          moduleInfo.metadata
        );
      } catch (error) {
        // Log error but don't fail preloading
        console.warn(`Failed to preload module ${moduleInfo.id}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Conditionally load modules based on environment
   */
  async loadConditionally<T = any>(
    moduleId: string,
    importPath: string,
    condition: () => boolean,
    fallbackPath?: string
  ): Promise<LoadingResult<T> | null> {
    if (!condition()) {
      if (fallbackPath) {
        return this.loadModule<T>(`${moduleId}-fallback`, fallbackPath);
      }
      return null;
    }

    return this.loadModule<T>(moduleId, importPath);
  }

  /**
   * Load modules in batches for performance optimization
   */
  async loadBatch<T = any>(
    modules: Array<{ id: string; path: string; metadata?: Partial<ModuleMetadata> }>
  ): Promise<LoadingResult<T>[]> {
    const loadingPromises = modules.map(module =>
      this.loadModule<T>(module.id, module.path, module.metadata)
    );

    const results = await Promise.allSettled(loadingPromises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<LoadingResult<T>> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  }

  /**
   * Add preload hints for optimization
   */
  addPreloadHint(hint: PreloadHint): void {
    this.preloadHints.push(hint);
  }

  /**
   * Get loading state for a module
   */
  getLoadingState(moduleId: string): LoadingState {
    return this.loadingStates.get(moduleId) || {
      isLoading: false,
      isLoaded: false,
      hasError: false,
      retryCount: 0,
    };
  }

  /**
   * Check if module is loaded
   */
  isModuleLoaded(moduleId: string): boolean {
    return this.getLoadingState(moduleId).isLoaded;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): LoadingMetrics {
    this.updateCacheHitRatio();
    this.updateMemoryUsage();
    return { ...this.performanceMetrics };
  }

  /**
   * Clear module cache
   */
  clearCache(): void {
    this.moduleCache.clear();
    this.loadingStates.clear();
    this.loadingPromises.clear();
    this.performanceMetrics.loadedModules = 0;
    this.performanceMetrics.cacheHitRatio = 0;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.clearCache();
    this.moduleMetadata.clear();
    this.preloadHints = [];
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Load module with retry logic
   */
  private async loadWithRetry<T>(moduleId: string, importPath: string): Promise<T> {
    let lastError: Error;
    const maxRetries = this.config.retryAttempts;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout wrapper
        const loadPromise = this.createTimeoutPromise(
          import(importPath),
          this.config.timeout
        );

        const module = await loadPromise;
        
        // Handle different module formats
        return this.normalizeModule<T>(module);

      } catch (error) {
        lastError = error as Error;
        
        // Update retry count
        const currentState = this.getLoadingState(moduleId);
        this.setLoadingState(moduleId, {
          ...currentState,
          retryCount: attempt + 1,
        });

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Create a promise with timeout
   */
  private createTimeoutPromise<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Module loading timed out after ${timeout}ms`));
      }, timeout);

      promise
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Normalize different module export formats
   */
  private normalizeModule<T>(module: any): T {
    // Handle ES6 default exports
    if (module && typeof module === 'object' && 'default' in module) {
      return module.default;
    }
    
    // Handle CommonJS exports
    if (module && typeof module === 'object' && Object.keys(module).length === 1) {
      const key = Object.keys(module)[0];
      if (key !== 'default') {
        return module[key];
      }
    }

    return module;
  }

  /**
   * Set loading state for a module
   */
  private setLoadingState(moduleId: string, state: LoadingState): void {
    this.loadingStates.set(moduleId, state);
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(moduleId: string, loadTime: number): void {
    this.performanceMetrics.totalModules++;
    this.performanceMetrics.loadedModules++;
    
    // Update average load time
    const totalTime = this.performanceMetrics.averageLoadTime * 
      (this.performanceMetrics.loadedModules - 1) + loadTime;
    this.performanceMetrics.averageLoadTime = totalTime / this.performanceMetrics.loadedModules;
  }

  /**
   * Update cache hit ratio
   */
  private updateCacheHitRatio(): void {
    if (this.performanceMetrics.totalModules === 0) {
      this.performanceMetrics.cacheHitRatio = 0;
      return;
    }

    const cacheHits = this.moduleCache.size;
    this.performanceMetrics.cacheHitRatio = cacheHits / this.performanceMetrics.totalModules;
  }

  /**
   * Update memory usage estimation
   */
  private updateMemoryUsage(): void {
    // Rough estimation of memory usage
    let memoryUsage = 0;
    
    for (const [key, value] of this.moduleCache) {
      // Estimate size based on serialization (rough approximation)
      try {
        const serialized = JSON.stringify(value);
        memoryUsage += serialized.length * 2; // UTF-16 characters
      } catch {
        // For non-serializable objects, use a default estimate
        memoryUsage += 1024; // 1KB estimate
      }
    }

    this.performanceMetrics.memoryUsage = memoryUsage;
  }

  /**
   * Get Svelte import path
   */
  private getSvelteImportPath(moduleName: string): string {
    const pathMap: Record<string, string> = {
      'context': '../svelte/context',
      'stores': '../svelte/stores',
      'components': '../svelte/components',
      'sveltekit-adapter': '../svelte/sveltekit-adapter',
      'station-search-store': '../svelte/station-search-store',
      'route-builder-store': '../svelte/route-builder-store',
    };

    return pathMap[moduleName] || `../svelte/${moduleName}`;
  }

  /**
   * Get React import path
   */
  private getReactImportPath(moduleName: string): string {
    const pathMap: Record<string, string> = {
      'adapter': '../react/react-adapter',
      'hooks': '../react/hooks',
      'components': '../react/components',
      'context': '../react/context',
    };

    return pathMap[moduleName] || `../react/${moduleName}`;
  }

  /**
   * Get Vue import path
   */
  private getVueImportPath(moduleName: string): string {
    const pathMap: Record<string, string> = {
      'adapter': '../vue/vue-adapter',
      'composables': '../vue/composables',
      'components': '../vue/components',
      'plugin': '../vue/plugin',
    };

    return pathMap[moduleName] || `../vue/${moduleName}`;
  }

  /**
   * Get WebAssembly import path
   */
  private getWebAssemblyImportPath(moduleName: string): string {
    const pathMap: Record<string, string> = {
      'wrapper': './wasm-wrapper',
      'object-classes': './object-classes',
      'core': './farert-sdk',
    };

    return pathMap[moduleName] || `./wasm-${moduleName}`;
  }

  /**
   * Get framework-specific modules to preload
   */
  private getFrameworkModules(framework: string): Array<{
    id: string;
    path: string;
    metadata: Partial<ModuleMetadata>;
  }> {
    const moduleMap: Record<string, Array<any>> = {
      svelte: [
        {
          id: 'svelte-stores',
          path: this.getSvelteImportPath('stores'),
          metadata: { type: 'stores' as ModuleType, priority: 'high' as LoadingPriority },
        },
        {
          id: 'svelte-components',
          path: this.getSvelteImportPath('components'),
          metadata: { type: 'components' as ModuleType, priority: 'medium' as LoadingPriority },
        },
      ],
      react: [
        {
          id: 'react-adapter',
          path: this.getReactImportPath('adapter'),
          metadata: { type: 'react' as ModuleType, priority: 'high' as LoadingPriority },
        },
      ],
      vue: [
        {
          id: 'vue-adapter',
          path: this.getVueImportPath('adapter'),
          metadata: { type: 'vue' as ModuleType, priority: 'high' as LoadingPriority },
        },
      ],
    };

    return moduleMap[framework] || [];
  }

  /**
   * Initialize preloading based on hints
   */
  private initializePreloading(): void {
    // Preload critical modules immediately
    if (typeof window !== 'undefined') {
      // Browser environment - can preload
      setTimeout(() => {
        this.processPreloadHints();
      }, 100);
    }
  }

  /**
   * Process preload hints
   */
  private async processPreloadHints(): Promise<void> {
    for (const hint of this.preloadHints) {
      try {
        if (!hint.condition || hint.condition()) {
          if (hint.delay) {
            await this.sleep(hint.delay);
          }
          
          // Note: This would need actual module paths to work
          // For now, just mark as processed
          console.debug(`Processing preload hint for ${hint.moduleId}`);
        }
      } catch (error) {
        console.warn(`Failed to process preload hint for ${hint.moduleId}:`, error);
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a lazy loader with optimal configuration for Svelte
 */
export function createSvelteLazyLoader(): LazyLoader {
  return new LazyLoader({
    strategy: 'preload',
    priority: 'high',
    timeout: 5000,
    retryAttempts: 2,
    retryDelay: 500,
    preloadThreshold: 50,
    cacheEnabled: true,
    performanceMonitoring: true,
  });
}

/**
 * Create a lazy loader with optimal configuration for React
 */
export function createReactLazyLoader(): LazyLoader {
  return new LazyLoader({
    strategy: 'lazy',
    priority: 'medium',
    timeout: 8000,
    retryAttempts: 3,
    retryDelay: 1000,
    preloadThreshold: 100,
    cacheEnabled: true,
    performanceMonitoring: true,
  });
}

/**
 * Create a lazy loader with optimal configuration for Vue
 */
export function createVueLazyLoader(): LazyLoader {
  return new LazyLoader({
    strategy: 'lazy',
    priority: 'medium',
    timeout: 8000,
    retryAttempts: 3,
    retryDelay: 1000,
    preloadThreshold: 100,
    cacheEnabled: true,
    performanceMonitoring: true,
  });
}

/**
 * Create a lazy loader with minimal configuration for vanilla JS
 */
export function createVanillaLazyLoader(): LazyLoader {
  return new LazyLoader({
    strategy: 'immediate',
    priority: 'high',
    timeout: 10000,
    retryAttempts: 1,
    retryDelay: 2000,
    preloadThreshold: 0,
    cacheEnabled: false,
    performanceMonitoring: false,
  });
}

/**
 * Framework-aware lazy loader factory
 */
export function createFrameworkLazyLoader(framework: string): LazyLoader {
  switch (framework.toLowerCase()) {
    case 'svelte':
    case 'sveltekit':
      return createSvelteLazyLoader();
    case 'react':
    case 'nextjs':
      return createReactLazyLoader();
    case 'vue':
    case 'nuxtjs':
      return createVueLazyLoader();
    default:
      return createVanillaLazyLoader();
  }
}

/**
 * Global lazy loader instance
 */
let globalLazyLoader: LazyLoader | null = null;

/**
 * Get or create global lazy loader instance
 */
export function getGlobalLazyLoader(): LazyLoader {
  if (!globalLazyLoader) {
    globalLazyLoader = new LazyLoader();
  }
  return globalLazyLoader;
}

/**
 * Set global lazy loader instance
 */
export function setGlobalLazyLoader(loader: LazyLoader): void {
  globalLazyLoader = loader;
}

/**
 * Convenience function to load a module using global loader
 */
export async function loadModule<T = any>(
  moduleId: string,
  importPath: string,
  metadata?: Partial<ModuleMetadata>
): Promise<LoadingResult<T>> {
  const loader = getGlobalLazyLoader();
  return loader.loadModule<T>(moduleId, importPath, metadata);
}

// Export the main class as default
export { LazyLoader as default };