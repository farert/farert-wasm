/**
 * Framework Detector Usage Examples
 * 
 * Demonstrates how to use the framework detection utility for optimal
 * SDK loading and performance optimization across different environments.
 * 
 * @file Framework Detector Examples
 * @version 1.0.0
 */

import {
  FrameworkDetector,
  detectFramework,
  getOptimizedSDKLoader,
  getFrameworkConfig,
  isFrameworkSupported,
  createFrameworkDetector,
  type DetectionRule,
  type ConditionalLoadingConfig
} from './framework-detector';

// ============================================================================
// BASIC USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Basic Framework Detection
 * Detect the current framework and log details
 */
export async function basicDetectionExample(): Promise<void> {
  console.log('🔍 Detecting current framework...');
  
  const detection = await detectFramework();
  
  console.log('Framework Detection Results:');
  console.log(`- Primary Framework: ${detection.framework}`);
  console.log(`- Meta Framework: ${detection.metaFramework || 'none'}`);
  console.log(`- Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
  console.log(`- Version: ${detection.version || 'unknown'}`);
  console.log(`- Component-based: ${detection.details.isComponentBased}`);
  console.log(`- Has Virtual DOM: ${detection.details.hasVirtualDOM}`);
  console.log(`- Supports SSR: ${detection.details.supportsSSR}`);
  
  if (detection.details.bundler) {
    console.log(`- Bundler: ${detection.details.bundler.type}`);
    console.log(`- HMR Available: ${detection.details.bundler.hasHMR}`);
  }
}

/**
 * Example 2: Optimized SDK Loading
 * Automatically load the best SDK adapter for the detected framework
 */
export async function optimizedLoadingExample(): Promise<void> {
  console.log('📦 Loading optimized SDK...');
  
  try {
    // Get the optimized loader for current environment
    const loader = await getOptimizedSDKLoader();
    
    // Load the framework-specific SDK
    const sdk = await loader();
    
    console.log('✅ SDK loaded successfully with framework-specific optimizations');
    console.log('Available SDK methods:', Object.keys(sdk));
    
    return sdk;
  } catch (error) {
    console.error('❌ Failed to load optimized SDK:', error);
    
    // Fallback to core SDK
    const { FarertSDK } = await import('../core');
    console.log('🔄 Falling back to core SDK');
    return FarertSDK;
  }
}

/**
 * Example 3: Framework-Specific Configuration
 * Get configuration tailored to the detected framework
 */
export async function frameworkConfigExample(): Promise<void> {
  console.log('⚙️ Getting framework-specific configuration...');
  
  const config = await getFrameworkConfig();
  
  console.log('Framework Configuration:');
  console.log('- Framework:', config.framework);
  console.log('- Detected Environment:', config.detection.framework);
  console.log('- Recommendations:');
  config.recommendations.forEach((rec: string, index: number) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
  
  // Use configuration for SDK initialization
  if (config.framework === 'svelte') {
    console.log('🟢 Svelte detected - using stores and reactive patterns');
  } else if (config.framework === 'react') {
    console.log('🔵 React detected - using hooks and context patterns');
  } else if (config.framework === 'vue') {
    console.log('🟡 Vue detected - using composables and reactivity API');
  }
}

// ============================================================================
// ADVANCED USAGE EXAMPLES
// ============================================================================

/**
 * Example 4: Custom Detection Rules
 * Add custom detection logic for specialized environments
 */
export async function customDetectionExample(): Promise<void> {
  console.log('🛠️ Setting up custom framework detection...');
  
  const customRules: DetectionRule[] = [
    {
      name: 'electron-app',
      detect: () => typeof (globalThis as any).require === 'function' && 
                   typeof (globalThis as any).process?.versions?.electron !== 'undefined',
      framework: 'vanilla',
      metaFramework: 'electron',
      confidence: 0.95,
      priority: 100
    },
    {
      name: 'capacitor-app',
      detect: () => typeof (globalThis as any).Capacitor !== 'undefined',
      framework: 'vanilla',
      metaFramework: 'capacitor',
      confidence: 0.9,
      priority: 90
    },
    {
      name: 'tauri-app',
      detect: () => typeof (globalThis as any).__TAURI__ !== 'undefined',
      framework: 'vanilla',
      metaFramework: 'tauri',
      confidence: 0.9,
      priority: 90
    }
  ];

  const detector = createFrameworkDetector({
    customDetectionRules: customRules,
    preloadDetectedAdapters: true
  });

  const detection = await detector.detectFramework();
  
  console.log('Custom Detection Results:');
  console.log(`- Framework: ${detection.framework}`);
  console.log(`- Meta Framework: ${detection.metaFramework}`);
  console.log(`- Running in native app: ${['electron', 'capacitor', 'tauri'].includes(detection.metaFramework || '')}`);
}

/**
 * Example 5: Conditional Loading with Fallbacks
 * Implement smart loading with graceful degradation
 */
export async function conditionalLoadingExample(): Promise<any> {
  console.log('🎯 Implementing conditional loading...');
  
  const config: ConditionalLoadingConfig = {
    enableLazyLoading: true,
    preloadDetectedAdapters: true,
    cacheDetection: true,
    cacheTimeout: 10 * 60 * 1000, // 10 minutes
    fallbackStrategy: 'vanilla'
  };

  const detector = createFrameworkDetector(config);
  const detection = await detector.detectFramework();
  
  try {
    // Try to load framework-specific adapter
    const adapter = await detector.getAdapter(detection.framework);
    
    if (await adapter.isCompatible()) {
      console.log(`✅ Loading ${detection.framework} adapter`);
      return await adapter.loadSDK();
    } else {
      throw new Error('Framework adapter not compatible');
    }
  } catch (error) {
    console.warn(`⚠️ Framework adapter failed, falling back: ${error}`);
    
    // Fallback to core SDK
    const fallbackAdapter = await detector.getAdapter('vanilla');
    return await fallbackAdapter.loadSDK();
  }
}

/**
 * Example 6: Performance Monitoring
 * Monitor detection performance and optimize for your environment
 */
export async function performanceMonitoringExample(): Promise<void> {
  console.log('📊 Monitoring framework detection performance...');
  
  const detector = createFrameworkDetector({
    cacheDetection: true,
    preloadDetectedAdapters: true
  });

  // Benchmark detection performance
  const iterations = 5;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    detector.clearCache(); // Fresh detection each time
    
    const start = performance.now();
    await detector.detectFramework();
    const end = performance.now();
    
    times.push(end - start);
  }
  
  const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log('Performance Metrics:');
  console.log(`- Average detection time: ${averageTime.toFixed(2)}ms`);
  console.log(`- Fastest detection: ${minTime.toFixed(2)}ms`);
  console.log(`- Slowest detection: ${maxTime.toFixed(2)}ms`);
  
  // Test cache performance
  const cachedStart = performance.now();
  await detector.detectFramework(); // Should use cache
  const cachedEnd = performance.now();
  
  console.log(`- Cached detection time: ${(cachedEnd - cachedStart).toFixed(2)}ms`);
  console.log(`- Cache speedup: ${(averageTime / (cachedEnd - cachedStart)).toFixed(1)}x`);
}

/**
 * Example 7: Development Debugging
 * Use development utilities for debugging and optimization
 */
export async function developmentDebuggingExample(): Promise<void> {
  console.log('🐛 Development debugging example...');
  
  // Only run in development mode
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.log('⚠️ Development utilities are disabled in production');
    return;
  }

  const { dev } = await import('./framework-detector');
  
  // Log comprehensive detection information
  console.log('--- Detection Information ---');
  await dev.logDetectionInfo();
  
  // Force re-detection (clears cache)
  console.log('\n--- Forced Re-detection ---');
  const freshDetection = await dev.forceRedetection();
  console.log('Fresh detection result:', freshDetection.framework);
  
  // Benchmark detection performance
  console.log('\n--- Performance Benchmark ---');
  const avgTime = await dev.benchmarkDetection(10);
  console.log(`Average detection time: ${avgTime.toFixed(2)}ms`);
  
  // Test custom rules
  console.log('\n--- Custom Rules Test ---');
  const testRules: DetectionRule[] = [
    {
      name: 'test-rule',
      detect: () => true,
      framework: 'react',
      confidence: 1.0,
      priority: 1
    }
  ];
  
  const matchingRules = await dev.testCustomRules(testRules);
  console.log(`Matching rules: ${matchingRules.length}`);
}

// ============================================================================
// REAL-WORLD INTEGRATION EXAMPLES
// ============================================================================

/**
 * Example 8: SDK Initialization with Auto-Detection
 * Complete example of SDK initialization with framework detection
 */
export async function sdkInitializationExample(): Promise<any> {
  console.log('🚀 Initializing SDK with auto-detection...');
  
  try {
    // 1. Detect current framework
    const detection = await detectFramework();
    console.log(`Detected: ${detection.framework}${detection.metaFramework ? ` (${detection.metaFramework})` : ''}`);
    
    // 2. Check framework support
    const isSupported = await isFrameworkSupported(detection.framework);
    if (!isSupported) {
      console.warn(`⚠️ ${detection.framework} adapter not fully supported, using fallback`);
    }
    
    // 3. Get optimized configuration
    const config = await getFrameworkConfig();
    
    // 4. Load framework-specific SDK
    const loader = await getOptimizedSDKLoader();
    const sdk = await loader();
    
    // 5. Initialize with framework-specific patterns
    let initializedSDK;
    
    if (detection.framework === 'svelte') {
      // Svelte-specific initialization
      initializedSDK = await sdk.createStoreCollection({
        enableReactivity: true,
        autoCleanup: true
      });
      console.log('✅ Svelte SDK initialized with reactive stores');
    } else if (detection.framework === 'react') {
      // React-specific initialization
      initializedSDK = sdk; // React hooks are available immediately
      console.log('✅ React SDK initialized with hooks and context');
    } else if (detection.framework === 'vue') {
      // Vue-specific initialization
      initializedSDK = sdk; // Vue composables are available immediately
      console.log('✅ Vue SDK initialized with composables');
    } else {
      // Vanilla/fallback initialization
      initializedSDK = await sdk.create({
        caching: true,
        errorHandling: true
      });
      console.log('✅ Core SDK initialized');
    }
    
    // 6. Apply framework-specific optimizations
    if (detection.details.bundler?.hasTreeShaking) {
      console.log('🌳 Tree shaking detected - enabling modular imports');
    }
    
    if (detection.details.bundler?.hasHMR) {
      console.log('🔥 HMR detected - enabling development optimizations');
    }
    
    return {
      sdk: initializedSDK,
      detection,
      config
    };
    
  } catch (error) {
    console.error('❌ SDK initialization failed:', error);
    
    // Fallback initialization
    const { FarertSDK } = await import('../core');
    return {
      sdk: await FarertSDK.create(),
      detection: null,
      config: { framework: 'vanilla' }
    };
  }
}

/**
 * Example 9: Bundle Size Optimization
 * Demonstrate how framework detection enables smaller bundles
 */
export async function bundleOptimizationExample(): Promise<void> {
  console.log('📦 Bundle size optimization example...');
  
  const detection = await detectFramework();
  
  // Only import what's needed based on detected framework
  console.log(`Framework detected: ${detection.framework}`);
  console.log('Loading only necessary adapters...');
  
  const imports: Record<string, () => Promise<any>> = {};
  
  // Conditional imports based on detection
  if (detection.framework === 'svelte') {
    imports.svelteSDK = () => import('../svelte');
    console.log('- Svelte adapter will be loaded');
  }
  
  if (detection.framework === 'react') {
    imports.reactSDK = () => import('../react');
    console.log('- React adapter will be loaded');
  }
  
  if (detection.framework === 'vue') {
    imports.vueSDK = () => import('../vue');
    console.log('- Vue adapter will be loaded');
  }
  
  // Always include core
  imports.coreSDK = () => import('../core');
  console.log('- Core SDK will be loaded');
  
  console.log(`Total adapters to load: ${Object.keys(imports).length}`);
  console.log('Bundle optimization achieved by avoiding unused framework adapters');
  
  // In a real application, only the detected framework adapter would be bundled
  // Example webpack.config.js:
  /*
  module.exports = {
    resolve: {
      alias: {
        '@farert/react': detection.framework === 'react' ? 'src/sdk/react' : 'src/sdk/core',
        '@farert/vue': detection.framework === 'vue' ? 'src/sdk/vue' : 'src/sdk/core',
        '@farert/svelte': detection.framework === 'svelte' ? 'src/sdk/svelte' : 'src/sdk/core',
      }
    }
  };
  */
}

/**
 * Example 10: SSR/SSG Optimization
 * Handle server-side rendering scenarios
 */
export async function ssrOptimizationExample(): Promise<void> {
  console.log('🖥️ SSR/SSG optimization example...');
  
  const detection = await detectFramework();
  const isSSR = typeof window === 'undefined';
  
  console.log(`Environment: ${isSSR ? 'Server' : 'Client'}`);
  console.log(`Framework: ${detection.framework}`);
  console.log(`Supports SSR: ${detection.details.supportsSSR}`);
  
  if (isSSR) {
    console.log('Running on server - optimizing for SSR...');
    
    // Server-side optimizations
    const detector = createFrameworkDetector({
      enableLazyLoading: false, // Load everything upfront on server
      preloadDetectedAdapters: true,
      cacheDetection: true,
      cacheTimeout: 60 * 60 * 1000 // 1 hour cache on server
    });
    
    if (detection.metaFramework === 'nextjs') {
      console.log('Next.js SSR detected - using static generation optimizations');
    } else if (detection.metaFramework === 'nuxtjs') {
      console.log('Nuxt.js SSR detected - using universal mode optimizations');
    } else if (detection.metaFramework === 'sveltekit') {
      console.log('SvelteKit SSR detected - using adapter optimizations');
    }
  } else {
    console.log('Running on client - optimizing for hydration...');
    
    // Client-side optimizations
    const detector = createFrameworkDetector({
      enableLazyLoading: true, // Lazy load on client
      preloadDetectedAdapters: false, // Don't preload to save bandwidth
      cacheDetection: true,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes cache on client
    });
    
    // Handle hydration
    if (detection.details.supportsSSR) {
      console.log('Framework supports SSR - preparing for hydration');
    }
  }
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export const examples = {
  basic: {
    detection: basicDetectionExample,
    loading: optimizedLoadingExample,
    configuration: frameworkConfigExample
  },
  advanced: {
    customDetection: customDetectionExample,
    conditionalLoading: conditionalLoadingExample,
    performanceMonitoring: performanceMonitoringExample,
    developmentDebugging: developmentDebuggingExample
  },
  integration: {
    sdkInitialization: sdkInitializationExample,
    bundleOptimization: bundleOptimizationExample,
    ssrOptimization: ssrOptimizationExample
  }
};

/**
 * Run all examples in sequence
 */
export async function runAllExamples(): Promise<void> {
  console.log('🎯 Running all framework detector examples...\n');
  
  const exampleGroups = Object.entries(examples);
  
  for (const [groupName, group] of exampleGroups) {
    console.log(`\n=== ${groupName.toUpperCase()} EXAMPLES ===`);
    
    const exampleEntries = Object.entries(group);
    for (const [exampleName, exampleFn] of exampleEntries) {
      console.log(`\n--- ${exampleName} ---`);
      try {
        await exampleFn();
      } catch (error) {
        console.error(`❌ Example ${exampleName} failed:`, error);
      }
    }
  }
  
  console.log('\n✅ All examples completed!');
}

// Auto-run examples if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
  runAllExamples().catch(console.error);
}