/**
 * Vitest Setup File for Svelte Integration Tests
 * 
 * Configures the testing environment for Svelte components and stores:
 * - DOM environment setup with happy-dom
 * - @testing-library/jest-dom matchers
 * - Mock WebAssembly module for testing
 * - Japanese text encoding support
 * - Global test utilities and helpers
 * 
 * @file Test environment setup
 * @version 1.0.0
 */

import { beforeEach, afterEach, vi } from 'vitest';
import '@testing-library/jest-dom';

// Global test utilities
global.structuredClone = global.structuredClone || ((obj: any) => JSON.parse(JSON.stringify(obj)));

// Mock WebAssembly for tests
global.WebAssembly = {
  ...global.WebAssembly,
  instantiate: vi.fn().mockResolvedValue({
    instance: {
      exports: {}
    }
  }),
  compile: vi.fn().mockResolvedValue({}),
  compileStreaming: vi.fn().mockResolvedValue({})
} as any;

// Mock fetch for WebAssembly loading
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
} as any);

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  },
  writable: true
});

// Mock window.matchMedia for accessibility tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
});

// Mock IntersectionObserver for component visibility tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver for responsive component tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  // Allow error and warn for debugging, but silence info and log in tests
  log: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  warn: originalConsole.warn,
  error: originalConsole.error
};

// Japanese text encoding support
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Setup and cleanup for each test
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Clear any existing timers
  vi.clearAllTimers();
  
  // Reset DOM state
  document.head.innerHTML = '';
  document.body.innerHTML = '';
  
  // Reset any global state
  if (global.window) {
    global.window.location.href = 'http://localhost:3000';
    global.window.history.replaceState(null, '', '/');
  }
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
  vi.clearAllTimers();
  
  // Clear any pending promises
  return new Promise(resolve => setTimeout(resolve, 0));
});

// Configure test environment for Japanese text
process.env.LANG = 'ja_JP.UTF-8';
process.env.LC_ALL = 'ja_JP.UTF-8';

// Export test utilities for use in tests
export const testUtils = {
  /**
   * Wait for multiple ticks to ensure all reactive updates complete
   */
  waitForTicks: async (count: number = 3) => {
    for (let i = 0; i < count; i++) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  },
  
  /**
   * Create a mock event object
   */
  createMockEvent: (type: string, data: any = {}) => ({
    type,
    target: { value: '', ...data.target },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...data
  }),
  
  /**
   * Create a mock KeyboardEvent
   */
  createMockKeyboardEvent: (key: string, data: any = {}) => ({
    type: 'keydown',
    key,
    code: `Key${key.toUpperCase()}`,
    keyCode: key.charCodeAt(0),
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...data
  }),
  
  /**
   * Mock Japanese input method for testing
   */
  createJapaneseInputEvent: (value: string, composition: boolean = false) => ({
    type: composition ? 'compositionend' : 'input',
    target: { value },
    data: value,
    isComposing: composition,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn()
  }),
  
  /**
   * Mock file for drag and drop tests
   */
  createMockFile: (name: string, content: string = '', type: string = 'text/plain') => ({
    name,
    type,
    size: content.length,
    text: () => Promise.resolve(content),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(content.length))
  }),
  
  /**
   * Mock DataTransfer for drag and drop tests
   */
  createMockDataTransfer: (files: any[] = []) => ({
    files,
    items: files.map(file => ({ getAsFile: () => file })),
    types: ['Files'],
    getData: vi.fn(() => ''),
    setData: vi.fn(),
    clearData: vi.fn(),
    setDragImage: vi.fn()
  })
};

// Make test utilities globally available
declare global {
  var testUtils: typeof testUtils;
}

global.testUtils = testUtils;