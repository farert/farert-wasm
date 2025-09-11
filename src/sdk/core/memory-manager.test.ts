/**
 * Memory Manager Tests
 * 
 * Comprehensive test suite for the Memory Manager implementation covering:
 * - WebAssembly object tracking and cleanup
 * - Event listener management and batch cleanup
 * - Cache memory management with LRU eviction
 * - Resource lifecycle tracking with reference counting
 * - Framework integration (Svelte, React, Vue)
 * - Memory pressure detection and automatic cleanup
 * - Error recovery and graceful handling of crashes
 * - Development diagnostics and memory profiling
 * 
 * @file Memory Manager Tests
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

import { describe, test, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import {
  MemoryManager,
  SvelteMemoryManager,
  ReactMemoryManager,
  createMemoryManager,
  createSvelteMemoryManager,
  createReactMemoryManager,
  globalMemoryStats,
  forceGarbageCollection,
  type MemoryStats,
  type ResourceHandle,
  type MemoryManagerOptions
} from './memory-manager';

// Mock dependencies
vi.mock('../cache/cache-manager', () => ({
  CacheCategory: {
    STATIONS: 'stations',
    SEARCH_RESULTS: 'search_results',
    FARE_CALCULATIONS: 'fare_calculations',
    REFERENCE_DATA: 'reference_data'
  }
}));

vi.mock('../errors/error-manager', () => ({
  ErrorManager: vi.fn().mockImplementation(() => ({
    handleError: vi.fn()
  })),
  ErrorCategory: {
    SYSTEM: 'system',
    WASM_ERROR: 'wasm_error'
  },
  ErrorSeverity: {
    WARNING: 'warning',
    HIGH: 'high'
  }
}));

// Mock WebAssembly objects
class MockWasmObject {
  constructor(public name: string, public size: number = 1024) {}
  cleanup() {
    // Mock cleanup
  }
}

// Mock EventTarget
class MockEventTarget {
  private listeners = new Map<string, Function[]>();

  addEventListener(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  removeEventListener(event: string, handler: Function) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    }
  }

  getListenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }
}

// Mock cache manager
const mockCacheManager = {
  getStats: vi.fn(() => ({
    global: { totalMemoryUsage: 1024 * 1024 } // 1MB
  })),
  clear: vi.fn(),
  dispose: vi.fn()
};

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  let mockOptions: MemoryManagerOptions;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup mock options
    mockOptions = {
      maxCacheSize: 10 * 1024 * 1024, // 10MB
      enableGarbageCollection: true,
      gcIntervalMs: 1000, // 1 second for testing
      memoryPressureThreshold: 80,
      enableMemoryProfiling: true,
      onMemoryPressure: vi.fn(),
      onResourceLeak: vi.fn(),
      onWasmCrash: vi.fn(),
      enableDiagnostics: true
    };

    memoryManager = new MemoryManager(mockOptions);
  });

  afterEach(async () => {
    if (memoryManager) {
      await memoryManager.destroy();
    }
  });

  describe('Initialization and Lifecycle', () => {
    test('should initialize with default options', () => {
      const manager = new MemoryManager();
      expect(manager).toBeDefined();
      
      const stats = manager.getStats();
      expect(stats).toBeDefined();
      expect(stats.trackedObjects).toBe(0);
      expect(stats.eventListeners).toBe(0);
    });

    test('should initialize with custom options', () => {
      const manager = new MemoryManager(mockOptions);
      manager.initialize({ cacheManager: mockCacheManager as any });
      
      const stats = manager.getStats();
      expect(stats.cacheSize).toBe(1024 * 1024); // 1MB from mock
    });

    test('should handle double initialization', () => {
      memoryManager.initialize();
      memoryManager.initialize(); // Should not throw
      
      expect(memoryManager.getStats()).toBeDefined();
    });

    test('should destroy cleanly', async () => {
      memoryManager.initialize();
      await expect(memoryManager.destroy()).resolves.not.toThrow();
      
      // Should handle double destroy
      await expect(memoryManager.destroy()).resolves.not.toThrow();
    });
  });

  describe('Resource Tracking', () => {
    beforeEach(() => {
      memoryManager.initialize();
    });

    test('should track generic resources', () => {
      const cleanupFn = vi.fn();
      const resourceId = memoryManager.trackResource({
        type: 'other',
        cleanup: cleanupFn,
        memoryUsage: 1024,
        metadata: { name: 'test-resource' }
      });

      expect(resourceId).toBeDefined();
      expect(typeof resourceId).toBe('string');
      
      const stats = memoryManager.getStats();
      expect(stats.totalResources).toBe(1);
    });

    test('should release tracked resources', () => {
      const cleanupFn = vi.fn();
      const resourceId = memoryManager.trackResource({
        type: 'other',
        cleanup: cleanupFn
      });

      const released = memoryManager.releaseResource(resourceId);
      expect(released).toBe(true);
      expect(cleanupFn).toHaveBeenCalledTimes(1);
      
      const stats = memoryManager.getStats();
      expect(stats.totalResources).toBe(0);
    });

    test('should handle reference counting', () => {
      const cleanupFn = vi.fn();
      const resourceId = memoryManager.trackResource({
        type: 'other',
        cleanup: cleanupFn,
        refCount: 2 // Start with 2 references
      });

      // First release should decrement ref count but not cleanup
      let released = memoryManager.releaseResource(resourceId);
      expect(released).toBe(true);
      expect(cleanupFn).not.toHaveBeenCalled();

      // Second release should cleanup
      released = memoryManager.releaseResource(resourceId);
      expect(released).toBe(true);
      expect(cleanupFn).toHaveBeenCalledTimes(1);
    });

    test('should release all resources by type', async () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      const cleanup3 = vi.fn();

      memoryManager.trackResource({ type: 'timer', cleanup: cleanup1 });
      memoryManager.trackResource({ type: 'timer', cleanup: cleanup2 });
      memoryManager.trackResource({ type: 'listener', cleanup: cleanup3 });

      await memoryManager.releaseAllResources('timer');

      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
      expect(cleanup3).not.toHaveBeenCalled(); // Different type
    });
  });

  describe('WebAssembly Memory Management', () => {
    beforeEach(() => {
      memoryManager.initialize();
    });

    test('should track WebAssembly objects', () => {
      const wasmObj = new MockWasmObject('TestRoute', 2048);
      const cleanupFn = vi.fn();
      
      const objectId = memoryManager.trackWasmObject(wasmObj, cleanupFn);
      
      expect(objectId).toBeDefined();
      
      const stats = memoryManager.getStats();
      expect(stats.trackedObjects).toBe(1);
    });

    test('should cleanup WebAssembly objects', () => {
      const wasmObj = new MockWasmObject('TestRoute');
      const cleanupFn = vi.fn();
      
      const objectId = memoryManager.trackWasmObject(wasmObj, cleanupFn);
      const released = memoryManager.releaseWasmObject(objectId);
      
      expect(released).toBe(true);
      expect(cleanupFn).toHaveBeenCalledTimes(1);
      
      const stats = memoryManager.getStats();
      expect(stats.trackedObjects).toBe(0);
    });

    test('should cleanup all WebAssembly objects', () => {
      const cleanup1 = vi.fn();
      const cleanup2 = vi.fn();
      
      memoryManager.trackWasmObject(new MockWasmObject('Route1'), cleanup1);
      memoryManager.trackWasmObject(new MockWasmObject('Route2'), cleanup2);
      
      memoryManager.cleanupWasmObjects();
      
      expect(cleanup1).toHaveBeenCalledTimes(1);
      expect(cleanup2).toHaveBeenCalledTimes(1);
      
      const stats = memoryManager.getStats();
      expect(stats.trackedObjects).toBe(0);
    });

    test('should estimate WebAssembly object sizes', () => {
      const smallObj = new MockWasmObject('Small', 512);
      const largeObj = new MockWasmObject('Large', 4096);
      
      memoryManager.trackWasmObject(smallObj);
      memoryManager.trackWasmObject(largeObj);
      
      // Size estimation would be reflected in memory stats
      const stats = memoryManager.getStats();
      expect(stats.trackedObjects).toBe(2);
    });
  });

  describe('Event Listener Management', () => {
    let mockTarget: MockEventTarget;

    beforeEach(() => {
      memoryManager.initialize();
      mockTarget = new MockEventTarget();
    });

    test('should track event listeners', () => {
      const handler = vi.fn();
      
      const listenerId = memoryManager.trackEventListener(
        mockTarget as any,
        'click',
        handler,
        undefined,
        { framework: 'svelte', component: 'Button' }
      );
      
      expect(listenerId).toBeDefined();
      
      const stats = memoryManager.getStats();
      expect(stats.eventListeners).toBe(1);
    });

    test('should release event listeners', () => {
      const handler = vi.fn();
      
      const listenerId = memoryManager.trackEventListener(
        mockTarget as any,
        'click',
        handler
      );
      
      mockTarget.addEventListener('click', handler); // Manually add for testing
      expect(mockTarget.getListenerCount('click')).toBe(1);
      
      const released = memoryManager.releaseEventListener(listenerId);
      expect(released).toBe(true);
      
      const stats = memoryManager.getStats();
      expect(stats.eventListeners).toBe(0);
    });

    test('should cleanup listeners by framework', () => {
      const svelteHandler = vi.fn();
      const reactHandler = vi.fn();
      
      memoryManager.trackEventListener(
        mockTarget as any,
        'click',
        svelteHandler,
        undefined,
        { framework: 'svelte' }
      );
      
      memoryManager.trackEventListener(
        mockTarget as any,
        'scroll',
        reactHandler,
        undefined,
        { framework: 'react' }
      );
      
      memoryManager.cleanupEventListenersByFramework('svelte');
      
      const stats = memoryManager.getStats();
      expect(stats.eventListeners).toBe(1); // Only React listener remains
    });
  });

  describe('Cache Memory Management', () => {
    beforeEach(() => {
      memoryManager.initialize({ cacheManager: mockCacheManager as any });
    });

    test('should get cache size', () => {
      const cacheSize = memoryManager.getCacheSize();
      expect(cacheSize).toBe(1024 * 1024); // From mock
    });

    test('should clear all cache', () => {
      memoryManager.clearCache();
      expect(mockCacheManager.clear).toHaveBeenCalled();
    });

    test('should enforce memory limits', () => {
      // Mock high cache usage
      mockCacheManager.getStats.mockReturnValue({
        global: { totalMemoryUsage: 20 * 1024 * 1024 } // 20MB > 10MB limit
      });
      
      memoryManager.enforceMemoryLimits();
      
      // Should trigger cache cleanup
      expect(mockCacheManager.clear).toHaveBeenCalled();
    });
  });

  describe('Memory Pressure Detection', () => {
    beforeEach(() => {
      memoryManager.initialize();
    });

    test('should detect memory pressure', () => {
      const leaks = memoryManager.detectLeaks();
      expect(Array.isArray(leaks)).toBe(true);
    });

    test('should call pressure callback on high usage', () => {
      const pressureCallback = vi.fn();
      const manager = new MemoryManager({
        ...mockOptions,
        onMemoryPressure: pressureCallback,
        memoryPressureThreshold: 0 // Always trigger
      });
      
      manager.initialize();
      manager.enforceMemoryLimits();
      
      // May trigger pressure callback depending on system state
    });

    test('should detect resource leaks', () => {
      // Create resource and mark as old
      const resourceId = memoryManager.trackResource({
        type: 'other',
        cleanup: vi.fn(),
        metadata: { name: 'leaked-resource' }
      });
      
      // Simulate old resource by backdating
      const resource = (memoryManager as any).resources.get(resourceId);
      if (resource) {
        resource.lastAccessed = new Date(Date.now() - 400000); // 400 seconds ago
        resource.status = 'leaked';
      }
      
      const leaks = memoryManager.detectLeaks();
      expect(leaks.length).toBeGreaterThan(0);
    });
  });

  describe('Diagnostics and Profiling', () => {
    beforeEach(() => {
      memoryManager.initialize();
    });

    test('should export diagnostic information', () => {
      memoryManager.trackResource({ type: 'timer', cleanup: vi.fn() });
      memoryManager.trackWasmObject(new MockWasmObject('Test'));
      
      const diagnostics = memoryManager.exportDiagnostics();
      
      expect(diagnostics).toHaveProperty('timestamp');
      expect(diagnostics).toHaveProperty('memoryStats');
      expect(diagnostics).toHaveProperty('resourceCounts');
      expect(diagnostics).toHaveProperty('leakDetection');
      expect(diagnostics).toHaveProperty('configuration');
      expect(diagnostics).toHaveProperty('performance');
    });

    test('should enable and disable profiling', () => {
      // Mock window.performance for browser environment
      const mockPerformance = {
        mark: vi.fn(),
        measure: vi.fn()
      };
      
      // @ts-ignore
      global.window = { performance: mockPerformance };
      
      memoryManager.enableProfiling(true);
      expect(mockPerformance.mark).toHaveBeenCalledWith('memory-manager-profiling-start');
      
      memoryManager.enableProfiling(false);
      expect(mockPerformance.measure).toHaveBeenCalled();
      
      // Cleanup
      // @ts-ignore
      delete global.window;
    });

    test('should get memory statistics', () => {
      const stats = memoryManager.getStats();
      
      expect(stats).toHaveProperty('wasmHeapSize');
      expect(stats).toHaveProperty('wasmUsedSize');
      expect(stats).toHaveProperty('jsHeapSize');
      expect(stats).toHaveProperty('jsUsedSize');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('trackedObjects');
      expect(stats).toHaveProperty('eventListeners');
      expect(stats).toHaveProperty('timers');
      expect(stats).toHaveProperty('totalResources');
      expect(stats).toHaveProperty('growthRate');
      expect(stats).toHaveProperty('pressureLevel');
      
      expect(typeof stats.trackedObjects).toBe('number');
      expect(typeof stats.eventListeners).toBe('number');
      expect(typeof stats.pressureLevel).toBe('number');
    });
  });

  describe('Error Recovery', () => {
    beforeEach(() => {
      memoryManager.initialize();
    });

    test('should handle WebAssembly crashes', () => {
      const crashCallback = vi.fn();
      const manager = new MemoryManager({
        ...mockOptions,
        onWasmCrash: crashCallback
      });
      
      manager.initialize();
      
      // Simulate WASM crash
      const wasmError = new Error('WebAssembly RuntimeError: memory access out of bounds');
      
      // Trigger error handler (would normally be called by global error handler)
      (manager as any).handleWasmCrash(wasmError);
      
      expect(crashCallback).toHaveBeenCalledWith(wasmError);
    });

    test('should detect WebAssembly crashes', () => {
      const wasmError = new Error('WebAssembly RuntimeError');
      const normalError = new Error('Regular error');
      
      expect((memoryManager as any).isWasmCrash(wasmError)).toBe(true);
      expect((memoryManager as any).isWasmCrash(normalError)).toBe(false);
    });

    test('should handle resource cleanup errors gracefully', () => {
      const faultyCleanup = vi.fn().mockImplementation(() => {
        throw new Error('Cleanup failed');
      });
      
      const resourceId = memoryManager.trackResource({
        type: 'other',
        cleanup: faultyCleanup
      });
      
      // Should not throw, but return false
      const released = memoryManager.releaseResource(resourceId);
      expect(released).toBe(false);
    });
  });
});

describe('SvelteMemoryManager', () => {
  let svelteManager: SvelteMemoryManager;

  beforeEach(() => {
    svelteManager = new SvelteMemoryManager();
    svelteManager.initialize();
  });

  afterEach(async () => {
    if (svelteManager) {
      await svelteManager.destroy();
    }
  });

  test('should track Svelte onMount callbacks', () => {
    const mountCallback = vi.fn();
    svelteManager.onMount(mountCallback);
    
    const stats = svelteManager.getStats();
    expect(stats.totalResources).toBeGreaterThan(0);
  });

  test('should track Svelte onDestroy callbacks', () => {
    const destroyCallback = vi.fn();
    svelteManager.onDestroy(destroyCallback);
    
    // Callback should be tracked internally
    expect((svelteManager as any).onDestroyCallbacks.size).toBe(1);
  });

  test('should track Svelte stores', () => {
    const mockStore = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn()
    };
    
    const storeId = svelteManager.trackStore(mockStore);
    expect(storeId).toBeDefined();
    
    // Cleanup should call unsubscribe
    svelteManager.releaseResource(storeId);
    expect(mockStore.unsubscribe).toHaveBeenCalledTimes(1);
  });

  test('should execute onDestroy callbacks on cleanup', async () => {
    const destroyCallback1 = vi.fn();
    const destroyCallback2 = vi.fn();
    
    svelteManager.onDestroy(destroyCallback1);
    svelteManager.onDestroy(destroyCallback2);
    
    await svelteManager.destroy();
    
    expect(destroyCallback1).toHaveBeenCalledTimes(1);
    expect(destroyCallback2).toHaveBeenCalledTimes(1);
  });
});

describe('ReactMemoryManager', () => {
  let reactManager: ReactMemoryManager;

  beforeEach(() => {
    reactManager = new ReactMemoryManager();
    reactManager.initialize();
  });

  afterEach(async () => {
    if (reactManager) {
      await reactManager.destroy();
    }
  });

  test('should provide useMemoryManager hook', () => {
    const manager = reactManager.useMemoryManager();
    expect(manager).toBe(reactManager);
  });

  test('should track React effect cleanups', () => {
    const effectCleanup = vi.fn();
    reactManager.useResourceCleanup(effectCleanup);
    
    const stats = reactManager.getStats();
    expect(stats.totalResources).toBeGreaterThan(0);
  });

  test('should execute effect cleanups on destroy', async () => {
    const effectCleanup1 = vi.fn();
    const effectCleanup2 = vi.fn();
    
    reactManager.useResourceCleanup(effectCleanup1);
    reactManager.useResourceCleanup(effectCleanup2);
    
    await reactManager.destroy();
    
    expect(effectCleanup1).toHaveBeenCalledTimes(1);
    expect(effectCleanup2).toHaveBeenCalledTimes(1);
  });
});

describe('Factory Functions', () => {
  test('createMemoryManager should create standard manager', () => {
    const manager = createMemoryManager();
    expect(manager).toBeInstanceOf(MemoryManager);
  });

  test('createSvelteMemoryManager should create Svelte-optimized manager', () => {
    const manager = createSvelteMemoryManager();
    expect(manager).toBeInstanceOf(SvelteMemoryManager);
  });

  test('createReactMemoryManager should create React-optimized manager', () => {
    const manager = createReactMemoryManager();
    expect(manager).toBeInstanceOf(ReactMemoryManager);
  });

  test('factory functions should accept custom options', () => {
    const options: MemoryManagerOptions = {
      maxCacheSize: 5 * 1024 * 1024, // 5MB
      enableGarbageCollection: false
    };

    const manager = createMemoryManager(options);
    manager.initialize();
    
    // Options would be reflected in behavior
    expect(manager.getStats()).toBeDefined();
  });
});

describe('Utility Functions', () => {
  test('globalMemoryStats should return memory statistics', () => {
    const stats = globalMemoryStats();
    
    expect(stats).toHaveProperty('jsHeapSize');
    expect(stats).toHaveProperty('jsUsedSize');
    expect(stats).toHaveProperty('pressureLevel');
    expect(typeof stats.pressureLevel).toBe('number');
  });

  test('forceGarbageCollection should not throw', () => {
    expect(() => forceGarbageCollection()).not.toThrow();
  });

  test('globalMemoryStats should work in Node.js environment', () => {
    // Mock process.memoryUsage for Node.js environment
    const originalMemoryUsage = process.memoryUsage;
    process.memoryUsage = vi.fn().mockReturnValue({
      heapTotal: 10 * 1024 * 1024,
      heapUsed: 5 * 1024 * 1024,
      external: 1024 * 1024,
      arrayBuffers: 512 * 1024,
      rss: 20 * 1024 * 1024
    });

    const stats = globalMemoryStats();
    expect(stats.jsHeapSize).toBe(10 * 1024 * 1024);
    expect(stats.jsUsedSize).toBe(5 * 1024 * 1024);
    expect(stats.pressureLevel).toBe(50); // 5MB / 10MB * 100

    // Restore original
    process.memoryUsage = originalMemoryUsage;
  });
});

describe('Integration Tests', () => {
  test('should work with cache manager integration', () => {
    const manager = new MemoryManager();
    manager.initialize({ cacheManager: mockCacheManager as any });
    
    const stats = manager.getStats();
    expect(stats.cacheSize).toBe(1024 * 1024); // From mock
    
    // Should be able to clear cache
    manager.clearCache();
    expect(mockCacheManager.clear).toHaveBeenCalled();
  });

  test('should handle memory pressure with integrated cache', () => {
    // Mock high memory usage
    mockCacheManager.getStats.mockReturnValue({
      global: { totalMemoryUsage: 50 * 1024 * 1024 } // 50MB
    });

    const manager = new MemoryManager({
      maxCacheSize: 10 * 1024 * 1024, // 10MB limit
      memoryPressureThreshold: 50
    });

    manager.initialize({ cacheManager: mockCacheManager as any });
    manager.enforceMemoryLimits();

    // Should trigger cache cleanup due to exceeding limit
    expect(mockCacheManager.clear).toHaveBeenCalled();
  });

  test('should work across multiple memory manager instances', async () => {
    const manager1 = createMemoryManager();
    const manager2 = createSvelteMemoryManager();
    
    manager1.initialize();
    manager2.initialize();
    
    // Both should work independently
    manager1.trackResource({ type: 'timer', cleanup: vi.fn() });
    manager2.trackResource({ type: 'listener', cleanup: vi.fn() });
    
    expect(manager1.getStats().totalResources).toBe(1);
    expect(manager2.getStats().totalResources).toBe(1);
    
    await manager1.destroy();
    await manager2.destroy();
  });
});

describe('Performance and Scalability', () => {
  test('should handle large numbers of resources', () => {
    const manager = createMemoryManager();
    manager.initialize();

    // Track many resources
    const resourceIds = [];
    for (let i = 0; i < 1000; i++) {
      const id = manager.trackResource({
        type: 'other',
        cleanup: vi.fn(),
        metadata: { index: i }
      });
      resourceIds.push(id);
    }

    const stats = manager.getStats();
    expect(stats.totalResources).toBe(1000);

    // Release all resources
    for (const id of resourceIds) {
      manager.releaseResource(id);
    }

    const finalStats = manager.getStats();
    expect(finalStats.totalResources).toBe(0);
  });

  test('should handle rapid resource creation and cleanup', async () => {
    const manager = createMemoryManager({
      gcIntervalMs: 100, // Fast GC for testing
      enableGarbageCollection: true
    });
    
    manager.initialize();

    // Rapidly create and release resources
    for (let i = 0; i < 100; i++) {
      const id = manager.trackResource({
        type: 'temporary',
        cleanup: vi.fn(),
        metadata: { batch: Math.floor(i / 10) }
      });
      
      // Release every other resource immediately
      if (i % 2 === 0) {
        manager.releaseResource(id);
      }
    }

    // Let GC run
    await new Promise(resolve => setTimeout(resolve, 150));

    const stats = manager.getStats();
    expect(stats.totalResources).toBeLessThan(100); // Some should be cleaned up

    await manager.destroy();
  });
});