/**
 * WebAssembly Module Loader for Node.js Environment
 * Integrates with the existing farert.wasm built by Emscripten
 * Supports CLI_WASM_PATH environment variable and robust file validation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { 
  FarertModule, 
  DatabaseError, 
  CLIError, 
  CLIErrorCode,
  CLIConfiguration 
} from './types';
import { configManager } from './config_manager';

export class WasmLoader {
  private module: FarertModule | null = null;
  private initialized: boolean = false;
  private config: CLIConfiguration;

  constructor() {
    this.config = configManager.getConfiguration();
  }

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
   * REQ-CLI-003.1, REQ-CLI-003.2 - Specific error handling for WebAssembly and database files
   */
  private validateFile(filePath: string, fileDescription: string): void {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      const fileName = path.basename(filePath);
      
      // Determine appropriate error code based on file type
      let errorCode: CLIErrorCode;
      if (fileName.endsWith('.wasm') || fileName.endsWith('.js')) {
        errorCode = CLIErrorCode.WASM_MODULE_NOT_FOUND;
      } else if (fileName.endsWith('.db')) {
        errorCode = CLIErrorCode.DB_FILE_MISSING;
      } else {
        errorCode = CLIErrorCode.FILE_NOT_FOUND;
      }
      
      let errorMessage = `${fileDescription} not found: ${filePath}`;
      
      const context: Record<string, any> = {
        filePath,
        fileName,
        directory: dir,
        directoryExists: fs.existsSync(dir),
        platform: os.platform()
      };
      
      if (!fs.existsSync(dir)) {
        context.issue = `Directory '${dir}' does not exist`;
      } else {
        context.issue = `Directory exists but '${fileName}' is missing`;
      }
      
      throw new CLIError(errorMessage, errorCode, context);
    }
    
    // Check file permissions
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      const permissionError = error instanceof Error ? error.message : String(error);
      throw new CLIError(
        `${fileDescription} exists but is not readable`,
        CLIErrorCode.PERMISSION_DENIED,
        {
          filePath,
          permissionError,
          suggestedFix: `chmod 644 "${filePath}"`
        }
      );
    }
  }

  /**
   * Resolve WebAssembly file paths with environment variable support
   * Requirements: REQ-CLI-004.3 - CLI_WASM_PATH environment variable support
   */
  private resolveWasmPaths(): { jsPath: string; wasmPath: string; dbPath: string } {
    // Get configuration from config manager
    this.config = configManager.getConfiguration();
    
    // Find project root from compiled location dist/cli/cli/
    const projectRoot = path.resolve(__dirname, '../../..');
    
    let jsPath: string;
    let wasmPath: string;
    
    if (this.config.wasmPath) {
      // Use custom path from environment
      const customDir = path.resolve(this.config.wasmPath);
      jsPath = path.join(customDir, 'farert.js');
      wasmPath = path.join(customDir, 'farert.wasm');
      
      if (this.config.debug) {
        console.log(`[DEBUG] Using custom WASM path: ${customDir}`);
      }
    } else {
      // Use default paths
      jsPath = path.join(projectRoot, 'dist', 'farert.js');
      wasmPath = path.join(projectRoot, 'dist', 'farert.wasm');
      
      if (this.config.debug) {
        console.log(`[DEBUG] Using default WASM path: ${path.join(projectRoot, 'dist')}`);
      }
    }
    
    // Database path is always relative to project root (not custom WASM path)
    const dbPath = path.join(projectRoot, 'data', 'jrdbnewest.db');
    
    if (this.config.debug) {
      console.log('[DEBUG] Resolved paths:');
      console.log(`[DEBUG]   JS: ${jsPath}`);
      console.log(`[DEBUG]   WASM: ${wasmPath}`);
      console.log(`[DEBUG]   DB: ${dbPath}`);
    }
    
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
      // Get latest configuration
      this.config = configManager.getConfiguration();
      
      const { jsPath, wasmPath, dbPath } = this.resolveWasmPaths();
      
      if (this.config.debug) {
        console.log('[DEBUG] Loading WebAssembly module with configuration:');
        console.log(`[DEBUG]   Debug: ${this.config.debug}`);
        console.log(`[DEBUG]   Memory monitoring: ${this.config.memoryMonitoring}`);
        console.log(`[DEBUG]   Custom WASM path: ${this.config.wasmPath || 'None'}`);
        configManager.logMemoryUsage('Before WASM Load');
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
        throw new CLIError(
          `WebAssembly module factory is not a function. Got: ${typeof moduleFactory}`,
          CLIErrorCode.WASM_INVALID_MODULE,
          {
            actualType: typeof moduleFactory,
            availableKeys: Object.keys(jsModule),
            jsPath,
            expected: 'Emscripten module factory function'
          }
        );
      }

      if (this.config.debug) {
        console.log('[DEBUG] Loading WebAssembly module...');
        const wasmStats = fs.statSync(wasmPath);
        console.log(`[DEBUG] WASM file size: ${(wasmStats.size / 1024 / 1024).toFixed(2)} MB`);
      }

      // Load WebAssembly module
      this.module = await moduleFactory({
        // Provide the WASM binary path
        wasmBinary: fs.readFileSync(wasmPath),
        // Node.js-specific configurations
        noInitialRun: false,
        // Custom print function for CLI output
        print: (text: string) => {
          if (this.config.debug) {
            console.log('[WASM]', text);
          }
        },
        printErr: (text: string) => {
          console.error('[WASM ERROR]', text);
        }
      }) as FarertModule;

      if (this.config.debug) {
        console.log('[DEBUG] WebAssembly module loaded successfully');
        configManager.logMemoryUsage('After WASM Load');
      }

      this.initialized = true;
      
      // Verify that the module loaded correctly
      if (typeof this.module.openDatabase !== 'function') {
        throw new CLIError(
          'WebAssembly module loaded but API functions not available',
          CLIErrorCode.WASM_INVALID_MODULE,
          {
            availableKeys: Object.keys(this.module),
            missingFunction: 'openDatabase',
            moduleType: typeof this.module
          }
        );
      }

      if (!this.config.debug) {
        console.log('✅ WebAssembly module loaded successfully');
      }
      return this.module;

    } catch (error) {
      if (error instanceof CLIError) {
        throw error;
      }
      
      // Enhanced error reporting with context
      const errorMessage = error instanceof Error ? error.message : String(error);
      const originalStack = error instanceof Error ? error.stack : undefined;
      
      throw new CLIError(
        `Failed to load WebAssembly module: ${errorMessage}`,
        CLIErrorCode.WASM_LOAD_FAILED,
        {
          originalError: errorMessage,
          originalStack,
          platform: os.platform(),
          nodeVersion: process.version,
          platformInstructions: this.getPlatformSetupInstructions()
        }
      );
    }
  }

  /**
   * Get the loaded module (throws if not loaded)
   */
  getModule(): FarertModule {
    if (!this.module || !this.initialized) {
      throw new CLIError(
        'WebAssembly module not loaded. Call loadModule() first.',
        CLIErrorCode.WASM_RUNTIME_ERROR,
        {
          moduleExists: this.module !== null,
          initialized: this.initialized
        }
      );
    }
    return this.module;
  }

  /**
   * Initialize database connection
   * REQ-CLI-003.2 - Database initialization error handling with SQLite-specific messages
   */
  async initializeDatabase(): Promise<boolean> {
    const module = await this.loadModule();
    
    try {
      // Verify database file exists before attempting to connect
      const { dbPath } = this.resolveWasmPaths();
      this.validateFile(dbPath, 'Railway database');
      
      if (this.config.debug) {
        console.log('[DEBUG] Attempting database initialization...');
        configManager.logMemoryUsage('Before DB Init');
      }
      
      const result = module.openDatabase();
      if (result) {
        if (this.config.debug) {
          console.log('[DEBUG] Database connection established successfully');
          configManager.logMemoryUsage('After DB Init');
        } else {
          console.log('✅ Database connection established');
        }
        return true;
      } else {
        // Database connection failed - provide specific error with troubleshooting
        throw new DatabaseError(
          'Database connection failed despite file existence',
          'SQLite connection returned false',
          {
            dbPath,
            fileExists: fs.existsSync(dbPath),
            fileSize: fs.statSync(dbPath).size,
            platform: os.platform(),
            possibleCauses: [
              'Database file corruption',
              'Version mismatch between database and WebAssembly module',
              'Insufficient memory for database operations',
              'WebAssembly module initialization incomplete'
            ]
          }
        );
      }
    } catch (error) {
      if (error instanceof CLIError) {
        // Re-throw CLI errors as-is (includes validation errors)
        throw error;
      }
      
      // Wrap other errors as database initialization errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const originalStack = error instanceof Error ? error.stack : undefined;
      
      throw new DatabaseError(
        'Database initialization failed with exception',
        errorMessage,
        {
          originalError: errorMessage,
          originalStack,
          platform: os.platform(),
          nodeVersion: process.version
        }
      );
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.module && this.initialized) {
      try {
        this.module.closeDatabase();
        if (this.config && this.config.debug) {
          console.log('[DEBUG] Database connection closed');
          configManager.logMemoryUsage('After Cleanup');
        } else {
          console.log('✅ Database connection closed');
        }
      } catch (error) {
        console.error('⚠️ Error closing database:', error);
        if (this.config && this.config.debug && error instanceof Error) {
          console.error('[DEBUG] Cleanup error stack:', error.stack);
        }
      }
    }
    
    this.module = null;
    this.initialized = false;
    
    if (this.config && this.config.debug) {
      console.log('[DEBUG] WebAssembly loader cleanup completed');
    }
  }

  /**
   * Check if module is loaded and ready
   */
  isReady(): boolean {
    return this.module !== null && this.initialized;
  }
  
  /**
   * Get current configuration
   */
  getConfiguration(): CLIConfiguration {
    return configManager.getConfiguration();
  }
  
  /**
   * Log memory usage statistics (wrapper for config manager)
   * Requirements: REQ-CLI-004.3 - WebAssembly memory usage statistics
   */
  logMemoryUsage(context?: string): void {
    configManager.logMemoryUsage(context);
  }
  
  /**
   * Get environment status report
   */
  getEnvironmentReport(): string {
    return configManager.getEnvironmentReport();
  }
}

// Singleton instance for global use
export const wasmLoader = new WasmLoader();