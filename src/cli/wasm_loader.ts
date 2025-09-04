/**
 * WebAssembly Module Loader for Node.js Environment
 * Integrates with the existing farert.wasm built by Emscripten
 */

import * as fs from 'fs';
import * as path from 'path';
import { FarertModule, WebAssemblyLoadError } from './types';

export class WasmLoader {
  private module: FarertModule | null = null;
  private initialized: boolean = false;

  /**
   * Load WebAssembly module from dist directory
   */
  async loadModule(): Promise<FarertModule> {
    if (this.module && this.initialized) {
      return this.module;
    }

    try {
      // Get the project root directory
      const projectRoot = path.resolve(__dirname, '../../..');
      const wasmPath = path.join(projectRoot, 'dist', 'farert.wasm');
      const jsPath = path.join(projectRoot, 'dist', 'farert.js');

      // Check if files exist
      if (!fs.existsSync(wasmPath)) {
        throw new WebAssemblyLoadError(
          `WebAssembly file not found: ${wasmPath}\nPlease run 'npm run build' first.`
        );
      }

      if (!fs.existsSync(jsPath)) {
        throw new WebAssemblyLoadError(
          `JavaScript wrapper not found: ${jsPath}\nPlease run 'npm run build' first.`
        );
      }

      // Load the Emscripten-generated JavaScript wrapper
      // Use dynamic require for CommonJS compatibility
      delete require.cache[require.resolve(jsPath)];
      const jsModule = require(jsPath);
      const moduleFactory = jsModule.default || jsModule;

      if (typeof moduleFactory !== 'function') {
        throw new WebAssemblyLoadError(
          `WebAssembly module factory is not a function. Got: ${typeof moduleFactory}. ` +
          `Keys: ${Object.keys(jsModule)}. ` +
          `Make sure the WebAssembly build is complete and up-to-date.`
        );
      }

      // Load WebAssembly module
      this.module = await moduleFactory({
        // Provide the WASM binary path
        wasmBinary: fs.readFileSync(wasmPath),
        // Set up Node.js-specific configurations
        ENVIRONMENT: 'NODE',
        // Disable browser-specific features
        noInitialRun: false,
        // Custom print function for CLI output
        print: (text: string) => {
          console.log('[WASM]', text);
        },
        printErr: (text: string) => {
          console.error('[WASM ERROR]', text);
        }
      }) as FarertModule;

      this.initialized = true;
      
      // Verify that the module loaded correctly
      if (typeof this.module.openDatabase !== 'function') {
        throw new WebAssemblyLoadError('WebAssembly module loaded but API functions not available');
      }

      console.log('✅ WebAssembly module loaded successfully');
      return this.module;

    } catch (error) {
      if (error instanceof WebAssemblyLoadError) {
        throw error;
      }
      
      throw new WebAssemblyLoadError(
        `Failed to load WebAssembly module: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the loaded module (throws if not loaded)
   */
  getModule(): FarertModule {
    if (!this.module || !this.initialized) {
      throw new WebAssemblyLoadError('WebAssembly module not loaded. Call loadModule() first.');
    }
    return this.module;
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase(): Promise<boolean> {
    const module = await this.loadModule();
    
    try {
      const result = module.openDatabase();
      if (result) {
        console.log('✅ Database connection established');
      } else {
        console.error('❌ Failed to connect to database');
      }
      return result;
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      return false;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.module && this.initialized) {
      try {
        this.module.closeDatabase();
        console.log('✅ Database connection closed');
      } catch (error) {
        console.error('⚠️ Error closing database:', error);
      }
    }
    
    this.module = null;
    this.initialized = false;
  }

  /**
   * Check if module is loaded and ready
   */
  isReady(): boolean {
    return this.module !== null && this.initialized;
  }
}

// Singleton instance for global use
export const wasmLoader = new WasmLoader();