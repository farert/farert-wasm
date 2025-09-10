/**
 * Test Setup for SvelteKit Integration Tests
 * 
 * Configures the testing environment for SvelteKit SSR, static generation,
 * and hydration testing. Sets up DOM environment simulation, Node.js mocks,
 * and SvelteKit-specific utilities for comprehensive integration testing.
 * 
 * @file SvelteKit Integration Test Setup
 * @version 1.0.0
 */

import { vi, beforeAll, afterAll } from 'vitest';
import { JSDOM } from 'jsdom';

// ============================================================================
// GLOBAL TEST ENVIRONMENT SETUP
// ============================================================================

/**
 * Setup global environment for SvelteKit testing
 */
beforeAll(async () => {
  // Mock SvelteKit modules to avoid import errors in Node.js environment
  vi.mock('@sveltejs/kit', () => ({
    error: (status: number, message: string) => ({ status, message }),
    redirect: (status: number, location: string) => ({ status, location }),
    json: (data: any) => ({ data }),
    dev: false,
    building: false
  }));

  // Mock browser-specific APIs for SSR testing
  vi.stubGlobal('fetch', vi.fn());
  
  // Mock performance API for performance testing
  vi.stubGlobal('performance', {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => [])
  });

  // Mock WebAssembly for fallback testing
  vi.stubGlobal('WebAssembly', {
    Module: vi.fn(),
    Instance: vi.fn(),
    Memory: vi.fn(),
    Table: vi.fn(),
    instantiate: vi.fn().mockRejectedValue(new Error('WebAssembly not supported in test environment')),
    instantiateStreaming: vi.fn().mockRejectedValue(new Error('WebAssembly streaming not supported')),
    compile: vi.fn().mockRejectedValue(new Error('WebAssembly compilation not supported')),
    compileStreaming: vi.fn().mockRejectedValue(new Error('WebAssembly compile streaming not supported'))
  });

  // Mock crypto for request ID generation
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => 'test-uuid-12345'),
    getRandomValues: vi.fn((arr: any) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  });

  // Mock process for Node.js environment detection
  vi.stubGlobal('process', {
    env: {
      NODE_ENV: 'test',
      VITEST: 'true'
    },
    memoryUsage: vi.fn(() => ({
      rss: 1024 * 1024 * 50,      // 50MB
      heapTotal: 1024 * 1024 * 30, // 30MB
      heapUsed: 1024 * 1024 * 20,  // 20MB
      external: 1024 * 1024 * 5,   // 5MB
      arrayBuffers: 1024 * 1024    // 1MB
    })),
    version: 'v18.0.0',
    platform: 'linux',
    arch: 'x64'
  });

  // Mock file system for static generation testing
  const mockFS = {
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('{}'),
    readdirSync: vi.fn().mockReturnValue([]),
    statSync: vi.fn().mockReturnValue({
      isDirectory: vi.fn().mockReturnValue(false),
      isFile: vi.fn().mockReturnValue(true),
      size: 1024,
      mtime: new Date()
    })
  };
  
  vi.mock('fs', () => mockFS);

  // Mock path module for cross-platform testing
  vi.mock('path', async () => {
    const actual = await vi.importActual('path');
    return {
      ...actual,
      join: vi.fn((...paths: string[]) => paths.filter(p => p).join('/')),
      resolve: vi.fn((...paths: string[]) => paths.filter(p => p).join('/')),
      dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/') || '/'),
      basename: vi.fn((path: string) => path.split('/').pop() || '')
    };
  });

  // Mock HTTP server for middleware testing
  vi.mock('http', () => ({
    createServer: vi.fn((handler) => ({
      listen: vi.fn((port, callback) => {
        if (callback) callback();
      }),
      address: vi.fn(() => ({ port: 3000 })),
      close: vi.fn((callback) => {
        if (callback) callback();
      })
    }))
  }));

  // Setup console methods for test logging
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  };

  console.log('🧪 SvelteKit integration test environment initialized');
});

/**
 * Cleanup after all tests
 */
afterAll(() => {
  // Restore all mocks
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  
  console.log('🧹 SvelteKit integration test environment cleaned up');
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a mock DOM environment for hydration testing
 */
export function createMockDOM(html: string = '<!DOCTYPE html><div id="app"></div>') {
  const dom = new JSDOM(html, {
    url: 'http://localhost:3000/',
    pretendToBeVisual: true,
    resources: 'usable',
    runScripts: 'dangerously'
  });

  return {
    window: dom.window,
    document: dom.window.document,
    cleanup: () => {
      dom.window.close();
    }
  };
}

/**
 * Simulate server-side rendering environment
 */
export function mockSSREnvironment() {
  const originalWindow = (global as any).window;
  const originalDocument = (global as any).document;
  
  // Remove window and document to simulate Node.js SSR
  delete (global as any).window;
  delete (global as any).document;
  
  return () => {
    // Restore browser globals
    if (originalWindow) (global as any).window = originalWindow;
    if (originalDocument) (global as any).document = originalDocument;
  };
}

/**
 * Simulate client-side hydration environment
 */
export function mockClientEnvironment() {
  const dom = createMockDOM();
  
  (global as any).window = dom.window;
  (global as any).document = dom.document;
  
  return () => {
    dom.cleanup();
    delete (global as any).window;
    delete (global as any).document;
  };
}

/**
 * Mock SvelteKit request object
 */
export function createMockRequest(url: string, options: RequestInit = {}) {
  return new Request(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 (Test Environment)',
      ...options.headers
    },
    ...options
  });
}

/**
 * Mock SvelteKit event object
 */
export function createMockSvelteKitEvent(url: string, options: any = {}) {
  const request = createMockRequest(url, options);
  
  return {
    request,
    url: new URL(url),
    params: options.params || {},
    locals: options.locals || {},
    clientAddress: options.clientAddress || '127.0.0.1',
    setHeaders: vi.fn(),
    cookies: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      serialize: vi.fn()
    },
    fetch: vi.fn(),
    getClientAddress: vi.fn(() => '127.0.0.1'),
    platform: options.platform || null,
    route: {
      id: options.routeId || '/test'
    },
    isDataRequest: options.isDataRequest || false
  };
}

/**
 * Mock SvelteKit load context
 */
export function createMockLoadContext(params: Record<string, string> = {}, searchParams: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/test');
  
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return {
    params,
    url,
    request: createMockRequest(url.toString()),
    route: { id: '/test' },
    isDataRequest: false,
    depends: vi.fn(),
    parent: vi.fn(),
    fetch: vi.fn()
  };
}

/**
 * Mock performance timing for load testing
 */
export class MockPerformanceTiming {
  private marks = new Map<string, number>();
  private measures = new Map<string, number>();

  mark(name: string): void {
    this.marks.set(name, Date.now());
  }

  measure(name: string, startMark?: string, endMark?: string): void {
    const start = startMark ? this.marks.get(startMark) || 0 : 0;
    const end = endMark ? this.marks.get(endMark) || Date.now() : Date.now();
    this.measures.set(name, end - start);
  }

  getEntriesByName(name: string): Array<{ name: string; duration: number }> {
    const duration = this.measures.get(name);
    return duration ? [{ name, duration }] : [];
  }

  getEntriesByType(type: string): Array<{ name: string; duration: number }> {
    if (type === 'measure') {
      return Array.from(this.measures.entries()).map(([name, duration]) => ({ name, duration }));
    }
    return [];
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Create mock performance timer
 */
export function createMockPerformanceTimer() {
  const timing = new MockPerformanceTiming();
  
  return {
    timing,
    now: vi.fn(() => Date.now()),
    mark: (name: string) => timing.mark(name),
    measure: (name: string, start?: string, end?: string) => timing.measure(name, start, end),
    getEntriesByName: (name: string) => timing.getEntriesByName(name),
    getEntriesByType: (type: string) => timing.getEntriesByType(type),
    clearMarks: () => timing.clear(),
    clearMeasures: () => timing.clear()
  };
}

/**
 * Mock cache for testing cache functionality
 */
export class MockCache<K, V> extends Map<K, V> {
  private ttl = new Map<K, number>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    super();
    this.maxSize = maxSize;
  }

  set(key: K, value: V, ttlMs?: number): this {
    if (this.size >= this.maxSize && !this.has(key)) {
      // Remove oldest entry
      const firstKey = this.keys().next().value;
      if (firstKey !== undefined) {
        this.delete(firstKey);
      }
    }

    super.set(key, value);
    
    if (ttlMs) {
      this.ttl.set(key, Date.now() + ttlMs);
    }
    
    return this;
  }

  get(key: K): V | undefined {
    const ttlTime = this.ttl.get(key);
    if (ttlTime && Date.now() > ttlTime) {
      this.delete(key);
      return undefined;
    }
    
    return super.get(key);
  }

  delete(key: K): boolean {
    this.ttl.delete(key);
    return super.delete(key);
  }

  clear(): void {
    super.clear();
    this.ttl.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, ttlTime] of this.ttl) {
      if (now > ttlTime) {
        this.delete(key);
      }
    }
  }
}

/**
 * Wait for a specified time (for testing async operations)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock WebAssembly module
 */
export function createMockWasm() {
  return {
    instance: {
      exports: {
        memory: new ArrayBuffer(1024 * 1024), // 1MB
        init: vi.fn(),
        search_stations: vi.fn(),
        calculate_fare: vi.fn(),
        validate_route: vi.fn()
      }
    },
    module: {}
  };
}

// Export commonly used mocks
export const mocks = {
  createMockDOM,
  mockSSREnvironment,
  mockClientEnvironment,
  createMockRequest,
  createMockSvelteKitEvent,
  createMockLoadContext,
  createMockPerformanceTimer,
  MockCache,
  delay,
  createMockWasm
};