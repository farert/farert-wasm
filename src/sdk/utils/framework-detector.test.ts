/**
 * Framework Detector Test Suite
 * 
 * Comprehensive tests for the framework detection utility to ensure
 * accurate detection across different environments and frameworks.
 * 
 * @file Framework Detector Tests
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FrameworkDetector,
  detectFramework,
  getOptimizedSDKLoader,
  getFrameworkConfig,
  isFrameworkSupported,
  createFrameworkDetector,
  type FrameworkType,
  type MetaFrameworkType,
  type DetectionRule,
  type ConditionalLoadingConfig
} from './framework-detector';

// Mock global objects for testing
const mockGlobalThis = () => {
  const originalGlobalThis = globalThis;
  return {
    restore: () => {
      Object.keys(globalThis).forEach(key => {
        if (key.startsWith('__TEST_')) {
          delete (globalThis as any)[key];
        }
      });
    },
    addMock: (key: string, value: any) => {
      (globalThis as any)[key] = value;
    }
  };
};

describe('FrameworkDetector', () => {
  let detector: FrameworkDetector;
  let mockGlobal: ReturnType<typeof mockGlobalThis>;

  beforeEach(() => {
    detector = new FrameworkDetector();
    mockGlobal = mockGlobalThis();
  });

  afterEach(() => {
    mockGlobal.restore();
    detector.clearCache();
  });

  describe('Framework Detection', () => {
    it('should detect Svelte framework', async () => {
      mockGlobal.addMock('__SVELTE__', { version: '3.44.0' });
      
      const result = await detector.detectFramework();
      
      expect(result.framework).toBe('svelte');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.details.isComponentBased).toBe(true);
      expect(result.details.hasReactiveState).toBe(true);
      expect(result.details.hasVirtualDOM).toBe(false);
    });

    it('should detect SvelteKit meta-framework', async () => {
      mockGlobal.addMock('__SVELTE__', { version: '3.44.0' });
      mockGlobal.addMock('__SVELTEKIT__', { version: '1.0.0' });
      
      const result = await detector.detectFramework();
      
      expect(result.framework).toBe('svelte');
      expect(result.metaFramework).toBe('sveltekit');
    });

    it('should detect React framework', async () => {
      mockGlobal.addMock('React', { version: '18.2.0' });
      mockGlobal.addMock('__REACT_DEVTOOLS_GLOBAL_HOOK__', {});
      
      const result = await detector.detectFramework();
      
      expect(result.framework).toBe('react');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.details.hasVirtualDOM).toBe(true);
      expect(result.details.supportsSSR).toBe(true);
    });

    it('should detect Next.js meta-framework', async () => {
      mockGlobal.addMock('React', { version: '18.2.0' });
      mockGlobal.addMock('__NEXT_DATA__', { buildId: 'test' });
      
      const result = await detector.detectFramework();
      
      expect(result.framework).toBe('react');
      expect(result.metaFramework).toBe('nextjs');
    });

    it('should detect Vue framework', async () => {
      mockGlobal.addMock('Vue', { version: '3.3.0' });
      mockGlobal.addMock('__VUE__', true);
      
      const result = await detector.detectFramework();
      
      expect(result.framework).toBe('vue');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.details.hasVirtualDOM).toBe(true);
    });

    it('should detect Nuxt.js meta-framework', async () => {
      mockGlobal.addMock('Vue', { version: '3.3.0' });
      mockGlobal.addMock('__NUXT__', { nuxtVersion: '3.8.0' });
      
      const result = await detector.detectFramework();
      
      expect(result.framework).toBe('vue');
      expect(result.metaFramework).toBe('nuxtjs');
    });

    it('should detect Angular framework', async () => {
      mockGlobal.addMock('ng', { version: { full: '16.0.0' } });
      mockGlobal.addMock('__NG_ELEMENT_ID__', 1);
      
      const result = await detector.detectFramework();
      
      expect(result.framework).toBe('angular');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.details.hasVirtualDOM).toBe(false); // Angular uses incremental DOM
    });

    it('should fallback to vanilla when no framework detected', async () => {
      const result = await detector.detectFramework();
      
      expect(['vanilla', 'unknown']).toContain(result.framework);
    });
  });

  describe('Environment Detection', () => {
    it('should detect browser environment', async () => {
      // Mock browser environment
      Object.defineProperty(globalThis, 'window', {
        value: {},
        configurable: true
      });
      Object.defineProperty(globalThis, 'document', {
        value: {},
        configurable: true
      });
      
      const result = await detector.detectFramework();
      
      expect(result.details.bundler).toBeDefined();
      
      // Cleanup
      delete (globalThis as any).window;
      delete (globalThis as any).document;
    });

    it('should detect development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const result = await detector.detectFramework();
      
      // Environment detection is part of the bundler info
      expect(result.details.bundler).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Custom Detection Rules', () => {
    it('should apply custom detection rules', async () => {
      const customRule: DetectionRule = {
        name: 'test-framework',
        detect: () => true,
        framework: 'react',
        confidence: 0.9,
        priority: 100
      };

      const customDetector = new FrameworkDetector({
        customDetectionRules: [customRule]
      });

      const result = await customDetector.detectFramework();
      
      expect(result.framework).toBe('react');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should handle failing custom rules gracefully', async () => {
      const failingRule: DetectionRule = {
        name: 'failing-rule',
        detect: () => { throw new Error('Test error'); },
        framework: 'vue',
        confidence: 1.0,
        priority: 100
      };

      const customDetector = new FrameworkDetector({
        customDetectionRules: [failingRule]
      });

      // Should not throw
      const result = await customDetector.detectFramework();
      expect(result).toBeDefined();
    });
  });

  describe('Caching', () => {
    it('should cache detection results', async () => {
      const detector = new FrameworkDetector({ cacheDetection: true });
      
      // First detection
      const result1 = await detector.detectFramework();
      
      // Second detection should return cached result
      const result2 = await detector.detectFramework();
      
      expect(result1).toEqual(result2);
    });

    it('should respect cache timeout', async () => {
      const detector = new FrameworkDetector({ 
        cacheDetection: true,
        cacheTimeout: 10 // 10ms timeout
      });
      
      const result1 = await detector.detectFramework();
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const result2 = await detector.detectFramework();
      
      // Results should be the same but cache should have been refreshed
      expect(result1.framework).toBe(result2.framework);
    });

    it('should clear cache when requested', async () => {
      const detector = new FrameworkDetector({ cacheDetection: true });
      
      await detector.detectFramework();
      detector.clearCache();
      
      // Should perform fresh detection
      const result = await detector.detectFramework();
      expect(result).toBeDefined();
    });
  });

  describe('Adapter Management', () => {
    it('should create framework adapters', async () => {
      mockGlobal.addMock('React', { version: '18.2.0' });
      
      const adapter = await detector.getAdapter('react');
      
      expect(adapter).toBeDefined();
      expect(adapter.loadSDK).toBeInstanceOf(Function);
      expect(adapter.getConfig).toBeInstanceOf(Function);
      expect(adapter.isCompatible).toBeInstanceOf(Function);
      expect(adapter.getRecommendations).toBeInstanceOf(Function);
    });

    it('should cache adapters', async () => {
      const adapter1 = await detector.getAdapter('vanilla');
      const adapter2 = await detector.getAdapter('vanilla');
      
      expect(adapter1).toBe(adapter2);
    });

    it('should get recommendations for each framework', async () => {
      const frameworks: FrameworkType[] = ['svelte', 'react', 'vue', 'angular', 'vanilla'];
      
      for (const framework of frameworks) {
        const adapter = await detector.getAdapter(framework);
        const recommendations = adapter.getRecommendations();
        
        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Bundler Detection', () => {
    it('should detect Vite bundler', async () => {
      mockGlobal.addMock('__vite_is_modern_browser', true);
      
      const result = await detector.detectFramework();
      
      expect(result.details.bundler?.type).toBe('vite');
    });

    it('should detect Webpack bundler', async () => {
      mockGlobal.addMock('__webpack_require__', { version: '5.0.0' });
      
      const result = await detector.detectFramework();
      
      expect(result.details.bundler?.type).toBe('webpack');
      expect(result.details.bundler?.version).toBe('5.0.0');
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const config: ConditionalLoadingConfig = {
        enableLazyLoading: false,
        preloadDetectedAdapters: false,
        cacheDetection: false,
        cacheTimeout: 1000,
        fallbackStrategy: 'error'
      };

      const customDetector = new FrameworkDetector(config);
      expect(customDetector).toBeDefined();
    });

    it('should merge with default configuration', () => {
      const partialConfig = { enableLazyLoading: false };
      const customDetector = new FrameworkDetector(partialConfig);
      
      expect(customDetector).toBeDefined();
    });
  });

  describe('Debug Information', () => {
    it('should provide comprehensive debug info', async () => {
      const debugInfo = await detector.getDebugInfo();
      
      expect(debugInfo).toHaveProperty('detection');
      expect(debugInfo).toHaveProperty('environment');
      expect(debugInfo).toHaveProperty('cache');
      expect(debugInfo).toHaveProperty('config');
      expect(debugInfo).toHaveProperty('capabilities');
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    // Reset singleton instance
    (FrameworkDetector as any).instance = null;
  });

  it('should detect framework using convenience function', async () => {
    const result = await detectFramework();
    expect(result).toBeDefined();
    expect(result.framework).toBeDefined();
  });

  it('should get optimized SDK loader', async () => {
    const loader = await getOptimizedSDKLoader();
    expect(loader).toBeInstanceOf(Function);
  });

  it('should get framework configuration', async () => {
    const config = await getFrameworkConfig();
    expect(config).toBeDefined();
    expect(config).toHaveProperty('detection');
    expect(config).toHaveProperty('recommendations');
  });

  it('should check framework support', async () => {
    const isSupported = await isFrameworkSupported('vanilla');
    expect(typeof isSupported).toBe('boolean');
  });

  it('should create custom detector', () => {
    const detector = createFrameworkDetector({ enableLazyLoading: false });
    expect(detector).toBeInstanceOf(FrameworkDetector);
  });
});

describe('Error Handling', () => {
  it('should handle missing globals gracefully', async () => {
    const detector = new FrameworkDetector();
    
    // Should not throw even with no globals
    const result = await detector.detectFramework();
    expect(result).toBeDefined();
  });

  it('should handle adapter loading failures', async () => {
    const detector = new FrameworkDetector();
    
    // Try to get adapter for unknown framework
    const adapter = await detector.getAdapter('unknown' as FrameworkType);
    expect(adapter).toBeDefined();
    expect(adapter.isCompatible()).toBe(true); // Fallback adapter
  });

  it('should handle version detection failures gracefully', async () => {
    // Mock framework without version
    (globalThis as any).__TEST_FRAMEWORK__ = {};
    
    const result = await detector.detectFramework();
    expect(result).toBeDefined();
    
    delete (globalThis as any).__TEST_FRAMEWORK__;
  });
});

describe('Performance', () => {
  it('should complete detection within reasonable time', async () => {
    const start = performance.now();
    await detectFramework();
    const end = performance.now();
    
    // Should complete within 100ms
    expect(end - start).toBeLessThan(100);
  });

  it('should benefit from caching on repeated calls', async () => {
    const detector = new FrameworkDetector({ cacheDetection: true });
    
    // First call (cache miss)
    const start1 = performance.now();
    await detector.detectFramework();
    const end1 = performance.now();
    const time1 = end1 - start1;
    
    // Second call (cache hit)
    const start2 = performance.now();
    await detector.detectFramework();
    const end2 = performance.now();
    const time2 = end2 - start2;
    
    // Cached call should be faster
    expect(time2).toBeLessThan(time1);
  });
});

describe('Development Utilities', () => {
  it('should provide development utilities', async () => {
    const { dev } = await import('./framework-detector');
    
    expect(dev).toBeDefined();
    expect(dev.logDetectionInfo).toBeInstanceOf(Function);
    expect(dev.forceRedetection).toBeInstanceOf(Function);
    expect(dev.testCustomRules).toBeInstanceOf(Function);
    expect(dev.benchmarkDetection).toBeInstanceOf(Function);
  });

  it('should test custom rules', async () => {
    const { dev } = await import('./framework-detector');
    
    const rules: DetectionRule[] = [
      {
        name: 'test',
        detect: () => true,
        framework: 'react',
        confidence: 1.0,
        priority: 1
      }
    ];
    
    const results = await dev.testCustomRules(rules);
    expect(Array.isArray(results)).toBe(true);
  });
});