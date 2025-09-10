/**
 * Vitest Configuration for Svelte Integration Tests
 * 
 * Configures Vitest to work with Svelte components, TypeScript, and @testing-library/svelte
 * Includes proper handling of Japanese text, DOM environment, and module resolution
 * 
 * @file Vitest Configuration for Svelte Tests
 * @version 1.0.0
 */

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    svelte({
      hot: !process.env.VITEST,
      // Enable HMR in development but disable during tests
      compilerOptions: {
        // Enable accessibility warnings during tests
        a11y: {
          'aria-props': true,
          'autofocus': true,
          'click-events-have-key-events': true,
          'no-access-key': true,
          'no-distracting-elements': true,
          'no-redundant-roles': true,
          'role-has-required-aria-props': true,
          'tabindex-no-positive': true
        }
      }
    })
  ],
  
  test: {
    // Test environment configuration
    environment: 'happy-dom', // Lighter alternative to jsdom for DOM testing
    globals: true, // Enable global test functions (describe, test, expect, etc.)
    
    // Setup files
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
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000, // 10 seconds for complex component tests
    hookTimeout: 10000,
    
    // Retry configuration for flaky tests
    retry: 2,
    
    // Reporter configuration
    reporter: process.env.CI ? 'json' : 'verbose',
    
    // Test file transformations
    transformMode: {
      web: [/\.[jt]sx?$/, /\.svelte$/]
    }
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../../src'),
      '@tests': resolve(__dirname, '../../'),
      '@sdk': resolve(__dirname, '../../../src/sdk'),
      '@components': resolve(__dirname, '../../../src/sdk/svelte/components'),
      '@stores': resolve(__dirname, '../../../src/sdk/svelte'),
      '@utils': resolve(__dirname, '../../../src/sdk/utils')
    },
    conditions: process.env.VITEST ? ['browser'] : []
  },
  
  // Define global constants for tests
  define: {
    __TEST__: true,
    __DEV__: true,
    'process.env.NODE_ENV': JSON.stringify('test')
  },
  
  // Optimizations
  optimizeDeps: {
    include: [
      'svelte',
      '@testing-library/svelte',
      '@testing-library/jest-dom',
      'vitest'
    ]
  },
  
  // Build configuration for test environment
  build: {
    target: 'node14',
    lib: {
      entry: resolve(__dirname, '../../../src/sdk/svelte/index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      external: ['svelte', 'vitest']
    }
  }
});