/**
 * Memory Manager Integration Examples
 * 
 * Comprehensive examples showing how to integrate the Memory Manager
 * with different frameworks and usage patterns:
 * 
 * - Svelte component lifecycle integration
 * - React hooks and component patterns
 * - Vue composition API integration
 * - Vanilla JavaScript usage
 * - SvelteKit SSR considerations
 * - Production deployment patterns
 * - Memory profiling and debugging
 * 
 * @file Memory Manager Examples
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// ============================================================================
// SVELTE INTEGRATION EXAMPLES
// ============================================================================

/**
 * Svelte Component with Memory Manager Integration
 * 
 * Example showing how to use SvelteMemoryManager in Svelte components
 * with proper lifecycle management and store tracking.
 */

// Example Svelte Component (RouteCalculator.svelte)
/*
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable, type Writable } from 'svelte/store';
  import { createSvelteMemoryManager, type MemoryStats } from './memory-manager';
  import { createWasmWrapper } from './wasm-wrapper';

  // Props
  export let startStation = '';
  export let endStation = '';

  // Svelte stores
  const fareResult: Writable<number | null> = writable(null);
  const isCalculating: Writable<boolean> = writable(false);
  const memoryStats: Writable<MemoryStats> = writable({} as MemoryStats);

  // Memory manager instance
  let memoryManager = createSvelteMemoryManager({
    maxCacheSize: 20 * 1024 * 1024, // 20MB
    enableGarbageCollection: true,
    gcIntervalMs: 30000, // 30 seconds
    enableDiagnostics: import.meta.env.DEV,
    onMemoryPressure: (stats) => {
      console.warn('Memory pressure detected:', stats.pressureLevel);
      // Could trigger UI notification or cleanup
    },
    onResourceLeak: (handle) => {
      console.error('Resource leak detected:', handle.id, handle.type);
    }
  });

  // WASM wrapper instance
  let wasmWrapper: any;

  onMount(async () => {
    try {
      // Initialize memory manager
      memoryManager.initialize();

      // Track the memory manager itself for cleanup
      memoryManager.trackResource({
        type: 'other',
        cleanup: async () => await memoryManager.destroy(),
        metadata: { name: 'memory-manager' }
      });

      // Create and initialize WASM wrapper
      wasmWrapper = createWasmWrapper();
      await wasmWrapper.initialize();

      // Track WASM wrapper
      memoryManager.trackResource({
        type: 'wasm',
        cleanup: () => wasmWrapper.dispose(),
        metadata: { name: 'wasm-wrapper' }
      });

      // Setup event listeners with memory tracking
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          calculateFare();
        }
      };

      document.addEventListener('keydown', handleKeydown);
      memoryManager.trackEventListener(
        document,
        'keydown',
        handleKeydown,
        undefined,
        { framework: 'svelte', component: 'RouteCalculator' }
      );

      // Setup memory monitoring
      const memoryMonitor = setInterval(() => {
        memoryStats.set(memoryManager.getStats());
      }, 5000); // Update every 5 seconds

      memoryManager.trackResource({
        type: 'timer',
        cleanup: () => clearInterval(memoryMonitor),
        metadata: { name: 'memory-monitor' }
      });

      // Track Svelte stores
      memoryManager.trackStore(fareResult);
      memoryManager.trackStore(isCalculating);
      memoryManager.trackStore(memoryStats);

    } catch (error) {
      console.error('Failed to initialize RouteCalculator:', error);
    }
  });

  onDestroy(async () => {
    // Svelte-specific cleanup will be handled automatically
    // by SvelteMemoryManager's destroy method
    await memoryManager.destroy();
  });

  async function calculateFare() {
    if (!wasmWrapper || !startStation || !endStation) return;

    try {
      isCalculating.set(true);

      // Get station IDs
      const startId = await wasmWrapper.getStationId(startStation);
      const endId = await wasmWrapper.getStationId(endStation);

      if (startId <= 0 || endId <= 0) {
        throw new Error('Invalid station names');
      }

      // Build route
      await wasmWrapper.removeAll();
      await wasmWrapper.addRouteBegin(startId);
      await wasmWrapper.addRoute(0, endId); // Simplified routing

      // Calculate fare
      const fare = await wasmWrapper.calculateFare();
      fareResult.set(fare);

    } catch (error) {
      console.error('Fare calculation failed:', error);
      fareResult.set(null);
    } finally {
      isCalculating.set(false);
    }
  }
</script>

<div class="route-calculator">
  <h2>Route Calculator</h2>
  
  <div class="inputs">
    <input 
      bind:value={startStation} 
      placeholder="Start Station"
      disabled={$isCalculating}
    />
    <input 
      bind:value={endStation} 
      placeholder="End Station"
      disabled={$isCalculating}
    />
    <button on:click={calculateFare} disabled={$isCalculating}>
      {$isCalculating ? 'Calculating...' : 'Calculate Fare'}
    </button>
  </div>

  {#if $fareResult !== null}
    <div class="result">
      Fare: ¥{$fareResult}
    </div>
  {/if}

  {#if import.meta.env.DEV}
    <div class="memory-stats">
      <h3>Memory Statistics</h3>
      <p>Tracked Objects: {$memoryStats.trackedObjects || 0}</p>
      <p>Event Listeners: {$memoryStats.eventListeners || 0}</p>
      <p>Cache Size: {Math.round(($memoryStats.cacheSize || 0) / 1024)}KB</p>
      <p>Memory Pressure: {($memoryStats.pressureLevel || 0).toFixed(1)}%</p>
    </div>
  {/if}
</div>

<style>
  .route-calculator {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  .inputs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .result {
    font-size: 1.2em;
    font-weight: bold;
    color: #0066cc;
  }
  
  .memory-stats {
    margin-top: 1rem;
    padding: 0.5rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.8em;
  }
</style>
*/

// ============================================================================
// REACT INTEGRATION EXAMPLES
// ============================================================================

/**
 * React Component with Memory Manager Integration
 * 
 * Example showing how to use ReactMemoryManager with React hooks
 * and component lifecycle management.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { createReactMemoryManager, createWasmWrapper } from './memory-manager';

// Custom React hook for memory management
export function useMemoryManager() {
  const memoryManagerRef = useRef(null);

  useEffect(() => {
    // Initialize memory manager
    if (!memoryManagerRef.current) {
      memoryManagerRef.current = createReactMemoryManager({
        maxCacheSize: 30 * 1024 * 1024, // 30MB for React apps
        enableGarbageCollection: true,
        gcIntervalMs: 20000, // 20 seconds - more frequent for React
        enableDiagnostics: process.env.NODE_ENV === 'development',
        onMemoryPressure: (stats) => {
          console.warn('Memory pressure in React app:', stats.pressureLevel);
        }
      });
      
      memoryManagerRef.current.initialize();
    }

    return () => {
      // Cleanup on unmount
      if (memoryManagerRef.current) {
        memoryManagerRef.current.destroy();
        memoryManagerRef.current = null;
      }
    };
  }, []);

  return memoryManagerRef.current;
}

// React component example
export function RouteCalculatorReact({ onFareCalculated }) {
  const [startStation, setStartStation] = useState('');
  const [endStation, setEndStation] = useState('');
  const [fareResult, setFareResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [memoryStats, setMemoryStats] = useState({});

  // Memory management
  const memoryManager = useMemoryManager();
  const wasmWrapperRef = useRef(null);

  // Initialize WASM wrapper
  useEffect(() => {
    let mounted = true;

    async function initializeWasm() {
      if (!memoryManager || wasmWrapperRef.current) return;

      try {
        const wasmWrapper = createWasmWrapper();
        await wasmWrapper.initialize();
        
        if (mounted) {
          wasmWrapperRef.current = wasmWrapper;
          
          // Track WASM wrapper with memory manager
          memoryManager.trackResource({
            type: 'wasm',
            cleanup: () => wasmWrapper.dispose(),
            metadata: { name: 'react-wasm-wrapper' }
          });
        }
      } catch (error) {
        console.error('Failed to initialize WASM wrapper:', error);
      }
    }

    initializeWasm();

    return () => {
      mounted = false;
    };
  }, [memoryManager]);

  // Memory monitoring
  useEffect(() => {
    if (!memoryManager) return;

    const interval = setInterval(() => {
      const stats = memoryManager.getStats();
      setMemoryStats(stats);
    }, 5000);

    // Track interval with memory manager
    memoryManager.useResourceCleanup(() => clearInterval(interval));

    return () => clearInterval(interval);
  }, [memoryManager]);

  // Event handlers
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !isCalculating) {
      calculateFare();
    }
  }, [isCalculating]);

  useEffect(() => {
    document.addEventListener('keypress', handleKeyPress);
    
    // Track event listener
    if (memoryManager) {
      memoryManager.trackEventListener(
        document,
        'keypress',
        handleKeyPress,
        undefined,
        { framework: 'react', component: 'RouteCalculatorReact' }
      );
    }

    return () => {
      document.removeEventListener('keypress', handleKeyPress);
    };
  }, [handleKeyPress, memoryManager]);

  const calculateFare = async () => {
    if (!wasmWrapperRef.current || !startStation || !endStation) return;

    try {
      setIsCalculating(true);
      setFareResult(null);

      const wasmWrapper = wasmWrapperRef.current;

      // Get station IDs
      const startId = await wasmWrapper.getStationId(startStation);
      const endId = await wasmWrapper.getStationId(endStation);

      if (startId <= 0 || endId <= 0) {
        throw new Error('Invalid station names');
      }

      // Build route and calculate fare
      await wasmWrapper.removeAll();
      await wasmWrapper.addRouteBegin(startId);
      await wasmWrapper.addRoute(0, endId);

      const fare = await wasmWrapper.calculateFare();
      setFareResult(fare);
      
      // Notify parent component
      onFareCalculated?.(fare);

    } catch (error) {
      console.error('Fare calculation failed:', error);
      setFareResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="route-calculator">
      <h2>Route Calculator (React)</h2>
      
      <div className="inputs">
        <input
          value={startStation}
          onChange={(e) => setStartStation(e.target.value)}
          placeholder="Start Station"
          disabled={isCalculating}
          onKeyPress={handleKeyPress}
        />
        <input
          value={endStation}
          onChange={(e) => setEndStation(e.target.value)}
          placeholder="End Station"
          disabled={isCalculating}
          onKeyPress={handleKeyPress}
        />
        <button onClick={calculateFare} disabled={isCalculating}>
          {isCalculating ? 'Calculating...' : 'Calculate Fare'}
        </button>
      </div>

      {fareResult !== null && (
        <div className="result">
          Fare: ¥{fareResult}
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="memory-stats">
          <h3>Memory Statistics</h3>
          <pre>{JSON.stringify(memoryStats, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VUE INTEGRATION EXAMPLES
// ============================================================================

/**
 * Vue Composition API with Memory Manager Integration
 */

import { ref, onMounted, onUnmounted, watch } from 'vue';
import { createMemoryManager, createWasmWrapper } from './memory-manager';

// Vue composable for memory management
export function useMemoryManager() {
  const memoryManager = ref(null);
  const memoryStats = ref({});

  onMounted(() => {
    memoryManager.value = createMemoryManager({
      maxCacheSize: 25 * 1024 * 1024, // 25MB
      enableGarbageCollection: true,
      frameworkConfig: {
        vue: {
          trackComposables: true,
          trackComponents: true
        }
      }
    });

    memoryManager.value.initialize();

    // Start memory monitoring
    const interval = setInterval(() => {
      if (memoryManager.value) {
        memoryStats.value = memoryManager.value.getStats();
      }
    }, 5000);

    // Track interval
    memoryManager.value.trackResource({
      type: 'timer',
      cleanup: () => clearInterval(interval),
      metadata: { name: 'vue-memory-monitor' }
    });
  });

  onUnmounted(async () => {
    if (memoryManager.value) {
      await memoryManager.value.destroy();
    }
  });

  return {
    memoryManager: memoryManager,
    memoryStats: memoryStats
  };
}

// Vue composable for fare calculation
export function useFareCalculator() {
  const { memoryManager } = useMemoryManager();
  
  const startStation = ref('');
  const endStation = ref('');
  const fareResult = ref(null);
  const isCalculating = ref(false);
  const wasmWrapper = ref(null);

  onMounted(async () => {
    if (!memoryManager.value) return;

    try {
      // Initialize WASM wrapper
      const wrapper = createWasmWrapper();
      await wrapper.initialize();
      
      wasmWrapper.value = wrapper;

      // Track with memory manager
      memoryManager.value.trackResource({
        type: 'wasm',
        cleanup: () => wrapper.dispose(),
        metadata: { name: 'vue-wasm-wrapper' }
      });

    } catch (error) {
      console.error('Failed to initialize WASM wrapper:', error);
    }
  });

  const calculateFare = async () => {
    if (!wasmWrapper.value || !startStation.value || !endStation.value) {
      return;
    }

    try {
      isCalculating.value = true;
      fareResult.value = null;

      const startId = await wasmWrapper.value.getStationId(startStation.value);
      const endId = await wasmWrapper.value.getStationId(endStation.value);

      if (startId <= 0 || endId <= 0) {
        throw new Error('Invalid station names');
      }

      await wasmWrapper.value.removeAll();
      await wasmWrapper.value.addRouteBegin(startId);
      await wasmWrapper.value.addRoute(0, endId);

      const fare = await wasmWrapper.value.calculateFare();
      fareResult.value = fare;

    } catch (error) {
      console.error('Fare calculation failed:', error);
    } finally {
      isCalculating.value = false;
    }
  };

  return {
    startStation,
    endStation,
    fareResult,
    isCalculating,
    calculateFare
  };
}

// ============================================================================
// VANILLA JAVASCRIPT EXAMPLES
// ============================================================================

/**
 * Vanilla JavaScript with Memory Manager
 * 
 * Example for use in plain JavaScript applications without frameworks.
 */

export class FareCalculatorVanilla {
  constructor(container) {
    this.container = container;
    this.memoryManager = null;
    this.wasmWrapper = null;
    this.elements = {};
    this.eventListeners = [];
  }

  async initialize() {
    try {
      // Create memory manager
      this.memoryManager = createMemoryManager({
        maxCacheSize: 15 * 1024 * 1024, // 15MB
        enableGarbageCollection: true,
        enableDiagnostics: true,
        onMemoryPressure: this.handleMemoryPressure.bind(this),
        onResourceLeak: this.handleResourceLeak.bind(this)
      });

      this.memoryManager.initialize();

      // Create WASM wrapper
      this.wasmWrapper = createWasmWrapper();
      await this.wasmWrapper.initialize();

      // Track WASM wrapper
      this.memoryManager.trackResource({
        type: 'wasm',
        cleanup: () => this.wasmWrapper.dispose(),
        metadata: { name: 'vanilla-wasm-wrapper' }
      });

      // Create UI
      this.createUI();
      this.attachEventListeners();

      // Start memory monitoring
      this.startMemoryMonitoring();

    } catch (error) {
      console.error('Failed to initialize FareCalculatorVanilla:', error);
      throw error;
    }
  }

  createUI() {
    this.container.innerHTML = `
      <div class="fare-calculator-vanilla">
        <h2>Route Calculator (Vanilla JS)</h2>
        
        <div class="inputs">
          <input id="start-station" placeholder="Start Station" />
          <input id="end-station" placeholder="End Station" />
          <button id="calculate-btn">Calculate Fare</button>
        </div>
        
        <div id="result" class="result" style="display: none;"></div>
        <div id="memory-stats" class="memory-stats"></div>
      </div>
    `;

    // Cache DOM elements
    this.elements = {
      startStation: this.container.querySelector('#start-station'),
      endStation: this.container.querySelector('#end-station'),
      calculateBtn: this.container.querySelector('#calculate-btn'),
      result: this.container.querySelector('#result'),
      memoryStats: this.container.querySelector('#memory-stats')
    };
  }

  attachEventListeners() {
    // Calculate button click
    const handleCalculateClick = this.calculateFare.bind(this);
    this.elements.calculateBtn.addEventListener('click', handleCalculateClick);
    
    this.memoryManager.trackEventListener(
      this.elements.calculateBtn,
      'click',
      handleCalculateClick,
      undefined,
      { framework: 'vanilla', component: 'FareCalculatorVanilla' }
    );

    // Enter key handling
    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        this.calculateFare();
      }
    };

    this.elements.startStation.addEventListener('keypress', handleKeyPress);
    this.elements.endStation.addEventListener('keypress', handleKeyPress);

    this.memoryManager.trackEventListener(
      this.elements.startStation,
      'keypress',
      handleKeyPress
    );

    this.memoryManager.trackEventListener(
      this.elements.endStation,
      'keypress',
      handleKeyPress
    );
  }

  async calculateFare() {
    if (!this.wasmWrapper) return;

    const startStation = this.elements.startStation.value.trim();
    const endStation = this.elements.endStation.value.trim();

    if (!startStation || !endStation) {
      this.showResult('Please enter both stations');
      return;
    }

    try {
      this.elements.calculateBtn.disabled = true;
      this.elements.calculateBtn.textContent = 'Calculating...';

      // Get station IDs
      const startId = await this.wasmWrapper.getStationId(startStation);
      const endId = await this.wasmWrapper.getStationId(endStation);

      if (startId <= 0 || endId <= 0) {
        throw new Error('Invalid station names');
      }

      // Calculate fare
      await this.wasmWrapper.removeAll();
      await this.wasmWrapper.addRouteBegin(startId);
      await this.wasmWrapper.addRoute(0, endId);

      const fare = await this.wasmWrapper.calculateFare();
      this.showResult(`Fare: ¥${fare}`);

    } catch (error) {
      console.error('Fare calculation failed:', error);
      this.showResult('Calculation failed: ' + error.message);
    } finally {
      this.elements.calculateBtn.disabled = false;
      this.elements.calculateBtn.textContent = 'Calculate Fare';
    }
  }

  showResult(message) {
    this.elements.result.textContent = message;
    this.elements.result.style.display = 'block';
  }

  startMemoryMonitoring() {
    const updateMemoryStats = () => {
      if (!this.memoryManager) return;

      const stats = this.memoryManager.getStats();
      this.elements.memoryStats.innerHTML = `
        <h3>Memory Statistics</h3>
        <p>Tracked Objects: ${stats.trackedObjects}</p>
        <p>Event Listeners: ${stats.eventListeners}</p>
        <p>Cache Size: ${Math.round(stats.cacheSize / 1024)}KB</p>
        <p>Memory Pressure: ${stats.pressureLevel.toFixed(1)}%</p>
      `;
    };

    const interval = setInterval(updateMemoryStats, 3000);
    
    this.memoryManager.trackResource({
      type: 'timer',
      cleanup: () => clearInterval(interval),
      metadata: { name: 'vanilla-memory-monitor' }
    });

    // Initial update
    updateMemoryStats();
  }

  handleMemoryPressure(stats) {
    console.warn('Memory pressure detected in vanilla app:', stats.pressureLevel);
    
    // Could implement UI notification
    const notification = document.createElement('div');
    notification.textContent = `Memory pressure: ${stats.pressureLevel.toFixed(1)}%`;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: orange;
      color: white;
      padding: 10px;
      border-radius: 4px;
      z-index: 1000;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  handleResourceLeak(handle) {
    console.error('Resource leak detected:', handle);
    
    if (console.table) {
      console.table({
        'Resource ID': handle.id,
        'Type': handle.type,
        'Created': handle.created.toISOString(),
        'Memory Usage': `${Math.round(handle.memoryUsage / 1024)}KB`,
        'Status': handle.status
      });
    }
  }

  async destroy() {
    if (this.memoryManager) {
      await this.memoryManager.destroy();
      this.memoryManager = null;
    }

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// ============================================================================
// SVELTEKIT SSR CONSIDERATIONS
// ============================================================================

/**
 * SvelteKit SSR Memory Management
 * 
 * Special considerations for Server-Side Rendering with memory management.
 */

// +page.server.ts example
export async function load({ url, params }) {
  // Server-side memory manager for SSR
  const serverMemoryManager = createMemoryManager({
    maxCacheSize: 100 * 1024 * 1024, // 100MB on server
    enableGarbageCollection: true,
    gcIntervalMs: 60000, // 1 minute on server
    enableDiagnostics: false // Disable in production
  });

  try {
    serverMemoryManager.initialize();

    // Initialize WASM wrapper for server-side calculation
    const wasmWrapper = createWasmWrapper();
    await wasmWrapper.initialize();

    serverMemoryManager.trackResource({
      type: 'wasm',
      cleanup: () => wasmWrapper.dispose(),
      metadata: { context: 'ssr-load' }
    });

    // Perform server-side calculations if needed
    const preCalculatedData = {};
    
    if (url.searchParams.has('calculate')) {
      const startStation = url.searchParams.get('start');
      const endStation = url.searchParams.get('end');
      
      if (startStation && endStation) {
        try {
          const startId = await wasmWrapper.getStationId(startStation);
          const endId = await wasmWrapper.getStationId(endStation);
          
          if (startId > 0 && endId > 0) {
            await wasmWrapper.removeAll();
            await wasmWrapper.addRouteBegin(startId);
            await wasmWrapper.addRoute(0, endId);
            
            preCalculatedData.fare = await wasmWrapper.calculateFare();
            preCalculatedData.startStation = startStation;
            preCalculatedData.endStation = endStation;
          }
        } catch (error) {
          console.error('SSR calculation failed:', error);
        }
      }
    }

    return {
      preCalculatedData
    };

  } finally {
    // Always cleanup server-side resources
    await serverMemoryManager.destroy();
  }
}

// ============================================================================
// PRODUCTION DEPLOYMENT PATTERNS
// ============================================================================

/**
 * Production Memory Manager Configuration
 * 
 * Recommended configuration for production deployments.
 */

export function createProductionMemoryManager(framework = 'vanilla') {
  const baseConfig = {
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    enableGarbageCollection: true,
    gcIntervalMs: 45000, // 45 seconds
    memoryPressureThreshold: 85, // 85% threshold
    enableMemoryProfiling: false, // Disabled in production
    enableDiagnostics: false, // Disabled in production
    maxLeakedResources: 50, // Lower threshold in production
    resourceTimeoutMs: 600000, // 10 minutes
    
    // Production error handling
    onMemoryPressure: (stats) => {
      // Send to monitoring service (e.g., Sentry, DataDog)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'memory_pressure', {
          pressure_level: stats.pressureLevel,
          cache_size: stats.cacheSize,
          tracked_objects: stats.trackedObjects
        });
      }
    },
    
    onResourceLeak: (handle) => {
      // Log to monitoring service
      console.error('Production resource leak:', {
        id: handle.id,
        type: handle.type,
        age: Date.now() - handle.created.getTime(),
        metadata: handle.metadata
      });
    },
    
    onWasmCrash: async (error) => {
      // Critical error handling for production
      console.error('WebAssembly crash in production:', error);
      
      // Could trigger application reload or fallback mode
      if (typeof window !== 'undefined') {
        // Show user-friendly error message
        const errorDialog = document.createElement('div');
        errorDialog.innerHTML = `
          <div style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="
              background: white; padding: 2rem; border-radius: 8px;
              max-width: 400px; text-align: center;
            ">
              <h3>System Error</h3>
              <p>A technical error occurred. The page will reload automatically.</p>
              <button onclick="window.location.reload()">Reload Now</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(errorDialog);
        
        // Auto-reload after 5 seconds
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    }
  };

  // Framework-specific configurations
  switch (framework) {
    case 'svelte':
      return createSvelteMemoryManager({
        ...baseConfig,
        gcIntervalMs: 30000, // More frequent for reactive updates
        frameworkConfig: {
          svelte: {
            trackStores: true,
            trackComponents: true
          }
        }
      });
      
    case 'react':
      return createReactMemoryManager({
        ...baseConfig,
        gcIntervalMs: 20000, // Most frequent for effect-heavy apps
        frameworkConfig: {
          react: {
            trackHooks: true,
            trackComponents: true
          }
        }
      });
      
    default:
      return createMemoryManager(baseConfig);
  }
}

// ============================================================================
// DEVELOPMENT AND DEBUG PATTERNS
// ============================================================================

/**
 * Development Memory Manager with Enhanced Debugging
 */

export function createDevelopmentMemoryManager() {
  return createMemoryManager({
    maxCacheSize: 100 * 1024 * 1024, // Generous in development
    enableGarbageCollection: true,
    gcIntervalMs: 10000, // Frequent GC for testing
    memoryPressureThreshold: 70, // Lower threshold for early warning
    enableMemoryProfiling: true,
    enableDiagnostics: true,
    
    // Enhanced development callbacks
    onMemoryPressure: (stats) => {
      console.group('🚨 Memory Pressure Detected');
      console.log('Pressure Level:', stats.pressureLevel.toFixed(1) + '%');
      console.log('Total Resources:', stats.totalResources);
      console.log('Cache Size:', Math.round(stats.cacheSize / 1024) + 'KB');
      console.log('Growth Rate:', stats.growthRate.toFixed(2) + ' bytes/sec');
      console.groupEnd();
      
      // Create console table of resource breakdown
      const breakdown = {
        'WebAssembly Objects': stats.trackedObjects,
        'Event Listeners': stats.eventListeners,
        'Timers': stats.timers,
        'Cache Size (KB)': Math.round(stats.cacheSize / 1024),
        'JS Heap (MB)': Math.round(stats.jsUsedSize / 1024 / 1024)
      };
      
      console.table(breakdown);
    },
    
    onResourceLeak: (handle) => {
      console.group('🔍 Resource Leak Detected');
      console.log('Resource ID:', handle.id);
      console.log('Type:', handle.type);
      console.log('Created:', handle.created.toISOString());
      console.log('Age:', Math.round((Date.now() - handle.created.getTime()) / 1000) + 's');
      console.log('Memory Usage:', Math.round(handle.memoryUsage / 1024) + 'KB');
      console.log('Status:', handle.status);
      console.log('Metadata:', handle.metadata);
      console.groupEnd();
      
      // Add stack trace if available
      if (handle.error && handle.error.stack) {
        console.log('Stack Trace:', handle.error.stack);
      }
    },
    
    onWasmCrash: (error) => {
      console.group('💥 WebAssembly Crash');
      console.error('Error:', error);
      console.log('Type:', error.constructor.name);
      console.log('Message:', error.message);
      if (error.stack) {
        console.log('Stack:', error.stack);
      }
      console.groupEnd();
      
      // Don't auto-reload in development
      alert('WebAssembly crash detected. Check console for details.');
    }
  });
}

// Export examples for documentation
export const examples = {
  SvelteMemoryManager,
  ReactMemoryManager,
  FareCalculatorVanilla,
  createProductionMemoryManager,
  createDevelopmentMemoryManager
};