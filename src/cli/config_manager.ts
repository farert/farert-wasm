/**
 * CLI Configuration Management and Environment Validation
 * Comprehensive system for validating CLI environment and managing configuration
 * Requirements: REQ-CLI-004.1, REQ-CLI-004.3, REQ-CLI-004.5
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { 
  CLIConfiguration, 
  EnvironmentValidationResult, 
  ValidationError, 
  ValidationWarning, 
  RequiredFileInfo, 
  MemoryUsageStats, 
  PlatformInfo,
  CLIErrorCode,
  EnvironmentValidationError
} from './types';

export class ConfigManager {
  private config: CLIConfiguration;
  private projectRoot: string;

  constructor() {
    this.projectRoot = this.findProjectRoot();
    this.config = this.loadConfiguration();
  }

  /**
   * Find project root directory from any location
   */
  private findProjectRoot(): string {
    let currentDir = __dirname;
    
    // Look for package.json or CLAUDE.md to identify project root
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      const claudeMdPath = path.join(currentDir, 'CLAUDE.md');
      
      if (fs.existsSync(packageJsonPath) || fs.existsSync(claudeMdPath)) {
        return currentDir;
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    // Fallback: assume we're in src/cli/
    return path.resolve(__dirname, '../../..');
  }

  /**
   * Load configuration from environment variables and defaults
   * Requirements: REQ-CLI-004.3 - CLI_DEBUG environment variable support
   */
  private loadConfiguration(): CLIConfiguration {
    const wasmPath = process.env.CLI_WASM_PATH;
    return {
      debug: process.env.CLI_DEBUG === '1' || process.env.CLI_DEBUG === 'true',
      verbose: process.env.CLI_VERBOSE === '1' || process.env.CLI_VERBOSE === 'true',
      wasmPath: wasmPath || undefined,
      platform: process.platform,
      nodeVersion: process.version,
      memoryMonitoring: process.env.CLI_DEBUG === '1' || process.env.CLI_DEBUG === 'true'
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): CLIConfiguration {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  updateConfiguration(updates: Partial<CLIConfiguration>): void {
    this.config = { ...this.config, ...updates };
    
    if (this.config.debug) {
      console.log('[DEBUG] Configuration updated:', updates);
    }
  }

  /**
   * Get platform-specific information and setup instructions
   * Requirements: REQ-CLI-004.5 - platform-specific setup instructions
   */
  getPlatformInfo(): PlatformInfo {
    const platform = os.platform();
    const cpus = os.cpus();
    
    let setupInstructions: string[];
    
    switch (platform) {
      case 'darwin': // macOS
        setupInstructions = [
          'Install Emscripten: brew install emscripten',
          'Source environment: source ~/priv/farert.repos/emsdk/emsdk_env.sh',
          'Or use project script: source setup_env.sh',
          'Build project: make all && npm run build',
          'Verify files exist: ls -la dist/farert.* data/jrdbnewest.db'
        ];
        break;
        
      case 'linux':
        setupInstructions = [
          'Install Emscripten: sudo apt-get install emscripten (Ubuntu/Debian)',
          'Or download emsdk: git clone https://github.com/emscripten-core/emsdk.git',
          'Source environment: source emsdk/emsdk_env.sh',
          'Build project: make all && npm run build',
          'Check permissions: chmod 755 dist/ && chmod 644 dist/farert.*'
        ];
        break;
        
      case 'win32': // Windows
        setupInstructions = [
          'Install Emscripten via emsdk:',
          '  git clone https://github.com/emscripten-core/emsdk.git',
          '  cd emsdk && .\\emsdk install latest',
          '  .\\emsdk activate latest',
          'Run setup script: setup_env.bat',
          'Build project: make all && npm run build'
        ];
        break;
        
      default:
        setupInstructions = [
          'Install Emscripten SDK from https://emscripten.org',
          'Source environment variables as per Emscripten documentation',
          'Build project: make all && npm run build',
          'Ensure all required files are present and readable'
        ];
    }

    return {
      platform,
      arch: process.arch,
      cpus: cpus.length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      nodeVersion: process.version,
      setupInstructions
    };
  }

  /**
   * Get memory usage statistics for WebAssembly monitoring
   * Requirements: REQ-CLI-004.3 - WebAssembly memory usage statistics
   */
  getMemoryUsageStats(): MemoryUsageStats {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    };
  }

  /**
   * Log memory usage statistics if debug mode is enabled
   */
  logMemoryUsage(context?: string): void {
    if (!this.config.debug) {
      return;
    }

    const stats = this.getMemoryUsageStats();
    const prefix = context ? `[DEBUG:${context}]` : '[DEBUG]';
    
    console.log(`${prefix} Memory Usage:`);
    console.log(`${prefix}   RSS: ${stats.rss} MB`);
    console.log(`${prefix}   Heap Used: ${stats.heapUsed} MB / ${stats.heapTotal} MB`);
    console.log(`${prefix}   External: ${stats.external} MB`);
    console.log(`${prefix}   Array Buffers: ${stats.arrayBuffers} MB`);
  }

  /**
   * Get required file paths for validation
   */
  getRequiredFiles(): string[] {
    const wasmDir = this.config.wasmPath 
      ? path.resolve(this.config.wasmPath)
      : path.join(this.projectRoot, 'dist');
    
    return [
      path.join(wasmDir, 'farert.js'),
      path.join(wasmDir, 'farert.wasm'),
      path.join(this.projectRoot, 'data', 'jrdbnewest.db')
    ];
  }

  /**
   * Validate a single file and return detailed information
   */
  private validateFile(filePath: string, description: string): RequiredFileInfo {
    const info: RequiredFileInfo = {
      path: filePath,
      description,
      exists: false,
      readable: false
    };

    try {
      const stats = fs.statSync(filePath);
      info.exists = true;
      info.size = stats.size;
      info.lastModified = stats.mtime;

      // Check readability
      fs.accessSync(filePath, fs.constants.R_OK);
      info.readable = true;
    } catch (error) {
      // File doesn't exist or not readable
      if (this.config.debug) {
        console.log(`[DEBUG] File validation failed for ${filePath}:`, error);
      }
    }

    return info;
  }

  /**
   * Comprehensive environment validation
   * Requirements: REQ-CLI-004.1 - validate required files existence
   */
  validateEnvironment(): EnvironmentValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const requiredFiles: RequiredFileInfo[] = [];

    // 1. Node.js version validation
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    
    if (majorVersion < 14) {
      errors.push({
        code: CLIErrorCode.NODE_VERSION_ERROR,
        message: `Node.js ${nodeVersion} is not supported. Required: 14.0.0+`,
        suggestions: [
          'Update Node.js to version 14.0.0 or higher',
          'Visit https://nodejs.org to download the latest LTS version',
          `Current version: ${nodeVersion}, Required: 14.0.0+`
        ]
      });
    } else if (majorVersion < 16) {
      warnings.push({
        message: `Node.js ${nodeVersion} works but LTS version 16+ is recommended`,
        suggestion: 'Consider updating to Node.js LTS for better performance and security'
      });
    }

    // 2. Required files validation
    const filesToValidate = [
      { path: this.getRequiredFiles()[0], description: 'JavaScript wrapper (farert.js)' },
      { path: this.getRequiredFiles()[1], description: 'WebAssembly module (farert.wasm)' },
      { path: this.getRequiredFiles()[2], description: 'Railway database (jrdbnewest.db)' }
    ];

    for (const file of filesToValidate) {
      const info = this.validateFile(file.path, file.description);
      requiredFiles.push(info);

      if (!info.exists) {
        const fileName = path.basename(file.path);
        const dir = path.dirname(file.path);
        
        let errorCode: CLIErrorCode;
        if (fileName.endsWith('.wasm') || fileName.endsWith('.js')) {
          errorCode = CLIErrorCode.WASM_MODULE_NOT_FOUND;
        } else if (fileName.endsWith('.db')) {
          errorCode = CLIErrorCode.DB_FILE_MISSING;
        } else {
          errorCode = CLIErrorCode.FILE_NOT_FOUND;
        }

        const platformInfo = this.getPlatformInfo();
        
        errors.push({
          code: errorCode,
          message: `${file.description} not found: ${file.path}`,
          filePath: file.path,
          suggestions: [
            'Run: npm run build to build the project',
            'Check: make all && npm run build completes successfully',
            `Verify directory exists: ls -la ${dir}`,
            ...platformInfo.setupInstructions.slice(0, 3)
          ]
        });
      } else if (!info.readable) {
        errors.push({
          code: CLIErrorCode.PERMISSION_DENIED,
          message: `${file.description} exists but is not readable`,
          filePath: file.path,
          suggestions: [
            `chmod 644 "${file.path}"`,
            'Check file ownership and permissions',
            'Ensure you have read access to the file'
          ]
        });
      } else if (info.size && info.size < 100) {
        warnings.push({
          message: `${file.description} seems unusually small (${info.size} bytes)`,
          suggestion: 'File may be incomplete. Try rebuilding the project.'
        });
      }
    }

    // 3. Environment variables validation
    if (this.config.wasmPath && !fs.existsSync(this.config.wasmPath)) {
      warnings.push({
        message: `Custom WASM path CLI_WASM_PATH="${this.config.wasmPath}" does not exist`,
        suggestion: 'Unset CLI_WASM_PATH to use default path or provide valid directory'
      });
    }

    // 4. Memory and system resource checks
    const freeMemory = os.freemem();
    
    if (freeMemory < 512 * 1024 * 1024) { // Less than 512MB free
      warnings.push({
        message: `Low free memory: ${Math.round(freeMemory / 1024 / 1024)} MB`,
        suggestion: 'Close other applications to free up memory before running WebAssembly'
      });
    }

    // 5. Platform-specific validations
    const platformInfo = this.getPlatformInfo();
    if (platformInfo.platform === 'win32') {
      warnings.push({
        message: 'Windows platform detected - ensure UTF-8 support is enabled',
        suggestion: 'Run: chcp 65001 in Command Prompt for proper Japanese text support'
      });
    }

    const result: EnvironmentValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      configuration: this.config,
      requiredFiles
    };

    if (this.config.debug) {
      console.log('[DEBUG] Environment validation completed:');
      console.log(`[DEBUG]   Errors: ${errors.length}`);
      console.log(`[DEBUG]   Warnings: ${warnings.length}`);
      console.log(`[DEBUG]   Required files: ${requiredFiles.length}`);
    }

    return result;
  }

  /**
   * Validate environment and throw detailed error if validation fails
   * This is the main function called from CLI startup
   */
  validateAndThrowOnError(): void {
    const result = this.validateEnvironment();
    
    if (!result.valid) {
      throw new EnvironmentValidationError(
        'CLI environment validation failed',
        result,
        {
          platform: this.config.platform,
          nodeVersion: this.config.nodeVersion,
          wasmPath: this.config.wasmPath,
          debug: this.config.debug
        }
      );
    }
    
    // Show warnings even if validation passed
    if (result.warnings.length > 0 && (this.config.debug || this.config.verbose)) {
      console.warn('⚠️  Environment validation warnings:');
      result.warnings.forEach((warning, index) => {
        console.warn(`  ${index + 1}. ${warning.message}`);
        if (warning.suggestion) {
          console.warn(`     💡 ${warning.suggestion}`);
        }
      });
    }
    
    if (this.config.debug) {
      console.log('[DEBUG] ✅ Environment validation passed');
      this.logMemoryUsage('Startup');
    }
  }

  /**
   * Get environment status report for troubleshooting
   */
  getEnvironmentReport(): string {
    const result = this.validateEnvironment();
    const platformInfo = this.getPlatformInfo();
    const memoryStats = this.getMemoryUsageStats();
    
    let report = '🔧 CLI Environment Report\n';
    report += '═'.repeat(50) + '\n\n';
    
    // System Information
    report += '💻 System Information:\n';
    report += `  Platform: ${platformInfo.platform} (${platformInfo.arch})\n`;
    report += `  Node.js: ${platformInfo.nodeVersion}\n`;
    report += `  CPUs: ${platformInfo.cpus}\n`;
    report += `  Memory: ${Math.round(platformInfo.totalMemory / 1024 / 1024 / 1024)} GB total, `;
    report += `${Math.round(platformInfo.freeMemory / 1024 / 1024 / 1024)} GB free\n\n`;
    
    // Configuration
    report += '⚙️  Configuration:\n';
    report += `  Debug Mode: ${this.config.debug ? '✅' : '❌'}\n`;
    report += `  Verbose Mode: ${this.config.verbose ? '✅' : '❌'}\n`;
    report += `  Custom WASM Path: ${this.config.wasmPath || 'None (using default)'}\n`;
    report += `  Memory Monitoring: ${this.config.memoryMonitoring ? '✅' : '❌'}\n\n`;
    
    // Memory Usage
    report += '📊 Current Memory Usage:\n';
    report += `  RSS: ${memoryStats.rss} MB\n`;
    report += `  Heap: ${memoryStats.heapUsed} / ${memoryStats.heapTotal} MB\n`;
    report += `  External: ${memoryStats.external} MB\n`;
    report += `  Array Buffers: ${memoryStats.arrayBuffers} MB\n\n`;
    
    // File Status
    report += '📂 Required Files:\n';
    result.requiredFiles.forEach((file, index) => {
      const status = file.exists && file.readable ? '✅' : '❌';
      report += `  ${index + 1}. ${status} ${file.description}\n`;
      report += `     Path: ${file.path}\n`;
      
      if (file.exists && file.size) {
        report += `     Size: ${Math.round(file.size / 1024)} KB`;
        if (file.lastModified) {
          report += `, Modified: ${file.lastModified.toISOString()}`;
        }
        report += '\n';
      }
    });
    
    report += '\n';
    
    // Validation Results
    if (result.valid) {
      report += '✅ Validation Status: PASSED\n';
    } else {
      report += '❌ Validation Status: FAILED\n\n';
      report += '🚨 Critical Issues:\n';
      result.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error.message}\n`;
        if (error.filePath) {
          report += `     File: ${error.filePath}\n`;
        }
        if (error.suggestions.length > 0) {
          report += `     Solutions:\n`;
          error.suggestions.forEach(suggestion => {
            report += `       - ${suggestion}\n`;
          });
        }
      });
    }
    
    if (result.warnings.length > 0) {
      report += '\n⚠️  Warnings:\n';
      result.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning.message}\n`;
        if (warning.suggestion) {
          report += `     💡 ${warning.suggestion}\n`;
        }
      });
    }
    
    // Platform-Specific Setup
    if (!result.valid) {
      report += '\n🛠️  Platform-Specific Setup Instructions:\n';
      platformInfo.setupInstructions.forEach((instruction, index) => {
        report += `  ${index + 1}. ${instruction}\n`;
      });
    }
    
    return report;
  }
}

// Singleton instance for global use
export const configManager = new ConfigManager();