/**
 * WebAssembly Module Loader for Node.js Environment
 * Integrates with the existing farert.wasm built by Emscripten
 * Supports CLI_WASM_PATH environment variable and robust file validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FarertModule, WebAssemblyLoadError } from './types';

export class WasmLoader {
  private module: FarertModule | null = null;
  private initialized: boolean = false;

  /**
   * Get platform-specific setup instructions
   */
  private getPlatformSetupInstructions(): string {
    const platform = os.platform();
    switch (platform) {
      case 'darwin': // macOS
        return 'macOS Setup:\n' +
               '1. Install Emscripten: brew install emscripten\n' +
               '2. Source environment: source setup_env.sh\n' +
               '3. Build project: make all && npm run build';
      case 'linux':
        return 'Linux Setup:\n' +
               '1. Install Emscripten: sudo apt install emscripten\n' +
               '2. Source environment: source setup_env.sh\n' +
               '3. Build project: make all && npm run build';
      case 'win32': // Windows
        return 'Windows Setup:\n' +
               '1. Install Emscripten via emsdk\n' +
               '2. Run: setup_env.bat\n' +
               '3. Build project: make all && npm run build';
      default:
        return 'Generic Setup:\n' +
               '1. Install Emscripten SDK\n' +
               '2. Source environment variables\n' +
               '3. Build project: make all && npm run build';
    }
  }

  /**
   * Validate file existence with detailed error messages
   */
  private validateFile(filePath: string, fileDescription: string): void {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      const fileName = path.basename(filePath);
      
      let errorMessage = `${fileDescription} not found: ${filePath}\n`;
      
      if (!fs.existsSync(dir)) {
        errorMessage += `Directory '${dir}' does not exist.\n`;
      } else {
        errorMessage += `Directory exists but '${fileName}' is missing.\n`;
      }
      
      errorMessage += '\nTroubleshooting:\n';
      errorMessage += '1. Run \'npm run build\' to compile WebAssembly modules\n';
      errorMessage += '2. Check file permissions in the dist/ directory\n';
      errorMessage += '3. Verify Emscripten compilation completed successfully\n\n';
      errorMessage += this.getPlatformSetupInstructions();
      
      throw new WebAssemblyLoadError(errorMessage);
    }
    
    // Check file permissions
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new WebAssemblyLoadError(
        `${fileDescription} exists but is not readable: ${filePath}\n` +
        `Please check file permissions: chmod 644 "${filePath}"`
      );
    }
  }

  /**
   * Resolve WebAssembly file paths with environment variable support
   */
  private resolveWasmPaths(): { jsPath: string; wasmPath: string; dbPath: string } {
    // Find project root from compiled location dist/cli/cli/
    const projectRoot = path.resolve(__dirname, '../../..');
    
    // Support CLI_WASM_PATH environment variable
    const customWasmPath = process.env.CLI_WASM_PATH;
    
    let jsPath: string;
    let wasmPath: string;
    
    if (customWasmPath) {
      // Use custom path from environment
      const customDir = path.resolve(customWasmPath);
      jsPath = path.join(customDir, 'farert.js');
      wasmPath = path.join(customDir, 'farert.wasm');
      
      if (process.env.CLI_DEBUG) {
        console.log(`[DEBUG] Using custom WASM path: ${customDir}`);
      }
    } else {
      // Use default paths
      jsPath = path.join(projectRoot, 'dist', 'farert.js');
      wasmPath = path.join(projectRoot, 'dist', 'farert.wasm');
    }
    
    // Database path is always relative to project root (not custom WASM path)
    const dbPath = path.join(projectRoot, 'data', 'jrdbnewest.db');
    
    return { jsPath, wasmPath, dbPath };
  }

  /**
   * Load WebAssembly module from dist directory
   */
  async loadModule(): Promise<FarertModule> {
    if (this.module && this.initialized) {
      return this.module;
    }

    try {
      const { jsPath, wasmPath, dbPath } = this.resolveWasmPaths();
      
      if (process.env.CLI_DEBUG) {
        console.log('[DEBUG] Validating required files:');
        console.log(`[DEBUG]   JS: ${jsPath}`);
        console.log(`[DEBUG]   WASM: ${wasmPath}`);
        console.log(`[DEBUG]   DB: ${dbPath}`);
      }

      // Validate all required files
      this.validateFile(jsPath, 'JavaScript wrapper');
      this.validateFile(wasmPath, 'WebAssembly module');
      this.validateFile(dbPath, 'Railway database');

      // Load the Emscripten-generated JavaScript wrapper
      // Use dynamic require for CommonJS compatibility
      delete require.cache[require.resolve(jsPath)];
      const jsModule = require(jsPath);
      const moduleFactory = jsModule.default || jsModule;

      if (typeof moduleFactory !== 'function') {
        throw new WebAssemblyLoadError(
          `WebAssembly module factory is not a function. Got: ${typeof moduleFactory}. ` +
          `Keys: ${Object.keys(jsModule)}. ` +
          `Make sure the WebAssembly build is complete and up-to-date.\n` +
          `Expected: Emscripten module factory function\n` +
          `Try: npm run build to regenerate WebAssembly files`
        );
      }

      if (process.env.CLI_DEBUG) {
        console.log('[DEBUG] Loading WebAssembly module...');
        const wasmStats = fs.statSync(wasmPath);
        console.log(`[DEBUG] WASM file size: ${wasmStats.size} bytes`);
      }

      // Load WebAssembly module
      this.module = await moduleFactory({
        // Provide the WASM binary path
        wasmBinary: fs.readFileSync(wasmPath),
        // Node.js-specific configurations
        noInitialRun: false,
        // Custom print function for CLI output
        print: (text: string) => {
          if (process.env.CLI_DEBUG) {
            console.log('[WASM]', text);
          }
        },
        printErr: (text: string) => {
          console.error('[WASM ERROR]', text);
        }
      }) as FarertModule;

      if (process.env.CLI_DEBUG) {
        console.log('[DEBUG] WebAssembly module loaded successfully');
        // Display memory usage statistics
        const memUsed = process.memoryUsage();
        console.log('[DEBUG] Memory usage:');
        console.log(`[DEBUG]   RSS: ${Math.round(memUsed.rss / 1024 / 1024)} MB`);
        console.log(`[DEBUG]   Heap Used: ${Math.round(memUsed.heapUsed / 1024 / 1024)} MB`);
        console.log(`[DEBUG]   External: ${Math.round(memUsed.external / 1024 / 1024)} MB`);
      }

      this.initialized = true;
      
      // Verify that the module loaded correctly
      if (typeof this.module.openDatabase !== 'function') {
        throw new WebAssemblyLoadError(
          'WebAssembly module loaded but API functions not available.\n' +
          'This indicates a problem with the WebAssembly compilation.\n' +
          'Try: make clean && make all && npm run build'
        );
      }

      if (!process.env.CLI_DEBUG) {
        console.log('✅ WebAssembly module loaded successfully');
      }
      return this.module;

    } catch (error) {
      if (error instanceof WebAssemblyLoadError) {
        throw error;
      }
      
      // Enhanced error reporting with context
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new WebAssemblyLoadError(
        `Failed to load WebAssembly module: ${errorMessage}\n\n` +
        'Common solutions:\n' +
        '1. Ensure all build dependencies are installed\n' +
        '2. Run complete build: make clean && make all && npm run build\n' +
        '3. Check Node.js version (requires 14.0.0+)\n' +
        '4. Verify Emscripten installation\n\n' +
        this.getPlatformSetupInstructions()
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
      // Verify database file exists before attempting to connect
      const { dbPath } = this.resolveWasmPaths();
      this.validateFile(dbPath, 'Railway database');
      
      if (process.env.CLI_DEBUG) {
        console.log('[DEBUG] Attempting database initialization...');
      }
      
      const result = module.openDatabase();
      if (result) {
        if (!process.env.CLI_DEBUG) {
          console.log('✅ Database connection established');
        } else {
          console.log('[DEBUG] Database connection established successfully');
        }
      } else {
        console.error('❌ Failed to connect to database');
        console.error('Database file exists but connection failed.');
        console.error('This may indicate database corruption or version mismatch.');
      }
      return result;
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      if (process.env.CLI_DEBUG && error instanceof Error) {
        console.error('[DEBUG] Stack trace:', error.stack);
      }
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
        if (process.env.CLI_DEBUG) {
          console.log('[DEBUG] Database connection closed');
        } else {
          console.log('✅ Database connection closed');
        }
      } catch (error) {
        console.error('⚠️ Error closing database:', error);
        if (process.env.CLI_DEBUG && error instanceof Error) {
          console.error('[DEBUG] Cleanup error stack:', error.stack);
        }
      }
    }
    
    this.module = null;
    this.initialized = false;
    
    if (process.env.CLI_DEBUG) {
      console.log('[DEBUG] WebAssembly loader cleanup completed');
    }
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