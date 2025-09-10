/**
 * Vitest Configuration for SvelteKit Integration Tests
 * 
 * Configures Vitest to work with SvelteKit SSR, static generation, and hydration testing.
 * Includes proper handling of Node.js environment simulation, DOM testing, and
 * WebAssembly module loading for comprehensive SvelteKit integration testing.
 * 
 * @file Vitest Configuration for SvelteKit Integration Tests
 * @version 1.0.0
 */

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment configuration for SvelteKit SSR/CSR testing
    environment: 'node', // Use Node.js environment for SSR testing
    globals: true, // Enable global test functions
    
    // Setup files for SvelteKit-specific testing
    setupFiles: [
      './setup.ts'
    ],
    
    // Test matching patterns
    include: [
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.spec.ts',
      '**/*.spec.js'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/setup.ts',
        '**/vitest.config.ts'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    
    // Extended timeouts for complex SSR/static generation tests
    testTimeout: 30000, // 30 seconds for complex integration tests
    hookTimeout: 30000,
    
    // Retry configuration for potentially flaky SSR tests
    retry: 3,
    
    // Reporter configuration
    reporter: process.env.CI ? ['json', 'github-actions'] : 'verbose',
    
    // Isolate each test file for clean SSR environment simulation
    isolate: true,
    
    // Pool configuration for SSR testing
    pool: 'forks', // Use forked processes for better isolation
    poolOptions: {
      forks: {
        singleFork: false, // Allow parallel test execution
        isolate: true
      }
    }
  },
  
  // Resolve configuration for SvelteKit imports
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../../src'),
      '@tests': resolve(__dirname, '../../'),
      '@sdk': resolve(__dirname, '../../../src/sdk'),
      '@sveltekit': resolve(__dirname, '../../../src/sdk/sveltekit'),
      '@components': resolve(__dirname, '../../../src/sdk/svelte/components'),
      '@stores': resolve(__dirname, '../../../src/sdk/svelte'),
      '@utils': resolve(__dirname, '../../../src/sdk/utils'),
      '@core': resolve(__dirname, '../../../src/sdk/core'),
      '@types': resolve(__dirname, '../../../src/sdk/types')
    },
    conditions: ['node'] // Prioritize Node.js conditions for SSR testing
  },
  
  // Define global constants for SvelteKit testing
  define: {
    __TEST__: true,
    __SVELTEKIT_SSR__: true,
    __DEV__: true,
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.VITEST': 'true'
  },
  
  // Optimizations for SvelteKit testing
  optimizeDeps: {
    include: [
      'vitest',
      'jsdom',
      '@testing-library/dom',
      'perf_hooks'
    ],
    exclude: [
      '@sveltejs/kit' // Exclude SvelteKit to avoid bundling issues in tests
    ]
  },
  
  // Build configuration for test environment
  build: {
    target: 'node16',
    lib: {
      entry: resolve(__dirname, '../../../src/sdk/sveltekit/index.ts'),
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        '@sveltejs/kit',
        'vitest',
        'jsdom',
        'http',
        'fs',
        'path',
        'perf_hooks'
      ]
    }
  },
  
  // Esbuild configuration for TypeScript handling
  esbuild: {
    target: 'node16'
  }
});