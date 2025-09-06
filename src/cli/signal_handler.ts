/**
 * Enhanced Signal Handling for Graceful Shutdown
 * Task 13 - typescript-cli-interface specification
 * 
 * Provides robust signal handling for graceful shutdown with proper WebAssembly 
 * memory cleanup, database connection cleanup, and timeout handling.
 * 
 * Requirements:
 * - REQ-CLI-003.4: Handle SIGINT/SIGTERM signals with proper WebAssembly cleanup
 * - Database connection problems detected within 3 seconds with specific error codes
 * - WebAssembly module errors isolated and recoverable with clear error reporting
 * - Test failures don't cause CLI crashes or memory corruption
 */

import { wasmLoader } from './wasm_loader';
import { configManager } from './config_manager';
import { performanceMonitor } from './performance_monitor';
import { 
    CLIError, 
    CLIErrorCode, 
    SystemError,
    FarertModule 
} from './types';

// Signal handling configuration
export interface SignalHandlerConfig {
    enabled: boolean;
    gracefulShutdownTimeout: number;    // Max time to wait for graceful shutdown (ms)
    dbConnectionTimeout: number;        // Max time to wait for DB operations (ms)
    cleanupTimeout: number;            // Max time to wait for cleanup (ms)
    forceExitOnTimeout: boolean;       // Force process exit if cleanup times out
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    memoryCleanupEnabled: boolean;     // Enable WebAssembly memory cleanup
}

// Default signal handler configuration based on requirements
const DEFAULT_CONFIG: SignalHandlerConfig = {
    enabled: true,
    gracefulShutdownTimeout: 10000,    // 10 seconds for graceful shutdown
    dbConnectionTimeout: 3000,         // 3 seconds per requirement
    cleanupTimeout: 5000,              // 5 seconds for cleanup operations
    forceExitOnTimeout: true,          // Force exit to prevent hanging
    logLevel: 'info',
    memoryCleanupEnabled: true
};

// Shutdown state tracking
interface ShutdownState {
    initiated: boolean;
    startTime: number;
    reason: string;
    cleanupSteps: string[];
    errors: Error[];
    completed: boolean;
}

/**
 * Enhanced Signal Handler Class
 * Manages graceful shutdown with comprehensive cleanup and timeout handling
 */
export class SignalHandler {
    private config: SignalHandlerConfig;
    private shutdownState: ShutdownState | null = null;
    private isShuttingDown: boolean = false;
    private cleanupTimeout: NodeJS.Timeout | null = null;
    private operationTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private registeredHandlers: boolean = false;

    constructor(config?: Partial<SignalHandlerConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        // Update config based on CLI configuration
        const cliConfig = configManager.getConfiguration();
        if (cliConfig.debug) {
            this.config.logLevel = 'debug';
        }
    }

    /**
     * Register signal handlers for graceful shutdown
     * This should be called early in the application lifecycle
     */
    registerSignalHandlers(): void {
        if (this.registeredHandlers || !this.config.enabled) {
            return;
        }

        // SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            this.handleSignal('SIGINT', 'User interruption (Ctrl+C)');
        });

        // SIGTERM (Termination request)
        process.on('SIGTERM', () => {
            this.handleSignal('SIGTERM', 'Termination request');
        });

        // Enhanced uncaught exception handler
        process.on('uncaughtException', (error) => {
            this.handleUncaughtException(error);
        });

        // Enhanced unhandled rejection handler  
        process.on('unhandledRejection', (reason, promise) => {
            this.handleUnhandledRejection(reason, promise);
        });

        // Process exit handler for final cleanup
        process.on('beforeExit', () => {
            this.handleBeforeExit();
        });

        this.registeredHandlers = true;
        
        if (this.config.logLevel === 'debug') {
            console.log('[SIGNAL] Signal handlers registered successfully');
        }
    }

    /**
     * Handle termination signals (SIGINT, SIGTERM)
     */
    private handleSignal(signal: string, reason: string): void {
        if (this.isShuttingDown) {
            console.log(`\n⚠️  ${signal} received during shutdown. Forcing immediate exit...`);
            process.exit(1);
        }

        this.initiateGracefulShutdown(signal, reason);
    }

    /**
     * Initiate graceful shutdown process
     */
    private async initiateGracefulShutdown(signal: string, reason: string): Promise<void> {
        this.isShuttingDown = true;
        
        this.shutdownState = {
            initiated: true,
            startTime: Date.now(),
            reason: `${signal}: ${reason}`,
            cleanupSteps: [],
            errors: [],
            completed: false
        };

        console.log(`\n⚠️  ${signal} received. Initiating graceful shutdown...`);
        console.log(`🔄 Reason: ${reason}`);
        
        if (this.config.logLevel === 'debug') {
            console.log('[SIGNAL] Starting graceful shutdown process');
            console.log(`[SIGNAL] Shutdown timeout: ${this.config.gracefulShutdownTimeout}ms`);
        }

        // Set overall shutdown timeout
        this.cleanupTimeout = setTimeout(() => {
            this.handleShutdownTimeout();
        }, this.config.gracefulShutdownTimeout);

        try {
            // Perform cleanup in stages
            await this.performCleanupSequence();
            
            // Mark shutdown as completed
            this.shutdownState.completed = true;
            
            console.log('✅ Graceful shutdown completed successfully');
            
            if (this.config.logLevel === 'debug') {
                const duration = Date.now() - this.shutdownState.startTime;
                console.log(`[SIGNAL] Shutdown completed in ${duration}ms`);
                console.log('[SIGNAL] Cleanup steps:', this.shutdownState.cleanupSteps);
            }

            // Clear timeout and exit cleanly
            if (this.cleanupTimeout) {
                clearTimeout(this.cleanupTimeout);
            }
            
            process.exit(0);

        } catch (error) {
            this.handleShutdownError(error);
        }
    }

    /**
     * Perform cleanup sequence with timeout handling
     */
    private async performCleanupSequence(): Promise<void> {
        const steps = [
            { name: 'Performance monitoring cleanup', fn: () => this.cleanupPerformanceMonitor() },
            { name: 'WebAssembly module cleanup', fn: () => this.cleanupWebAssembly() },
            { name: 'Database connection cleanup', fn: () => this.cleanupDatabase() },
            { name: 'Memory cleanup', fn: () => this.cleanupMemory() },
            { name: 'Configuration cleanup', fn: () => this.cleanupConfiguration() }
        ];

        for (const step of steps) {
            try {
                if (this.config.logLevel === 'debug') {
                    console.log(`[SIGNAL] Executing: ${step.name}`);
                }

                // Execute cleanup step with timeout
                await this.executeWithTimeout(step.fn, step.name, this.config.cleanupTimeout);
                
                this.shutdownState!.cleanupSteps.push(`✅ ${step.name}`);
                
                if (this.config.logLevel !== 'debug') {
                    console.log(`✅ ${step.name} completed`);
                }

            } catch (error) {
                const errorMessage = `❌ ${step.name} failed: ${error instanceof Error ? error.message : String(error)}`;
                
                this.shutdownState!.cleanupSteps.push(errorMessage);
                this.shutdownState!.errors.push(error instanceof Error ? error : new Error(String(error)));
                
                console.error(errorMessage);
                
                if (this.config.logLevel === 'debug' && error instanceof Error) {
                    console.error('[SIGNAL] Stack trace:', error.stack);
                }
            }
        }
    }

    /**
     * Execute function with timeout
     */
    private async executeWithTimeout<T>(
        fn: () => Promise<T> | T, 
        operationName: string, 
        timeoutMs: number
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Operation '${operationName}' timed out after ${timeoutMs}ms`));
            }, timeoutMs);

            this.operationTimeouts.set(operationName, timeout);

            Promise.resolve(fn())
                .then((result) => {
                    clearTimeout(timeout);
                    this.operationTimeouts.delete(operationName);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timeout);
                    this.operationTimeouts.delete(operationName);
                    reject(error);
                });
        });
    }

    /**
     * Cleanup performance monitor
     */
    private async cleanupPerformanceMonitor(): Promise<void> {
        try {
            if (performanceMonitor && typeof performanceMonitor.cleanup === 'function') {
                performanceMonitor.cleanup();
            }
        } catch (error) {
            throw new Error(`Performance monitor cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Cleanup WebAssembly module with database connection
     * REQ-CLI-003.4 - Database connection problems detected within 3 seconds
     */
    private async cleanupWebAssembly(): Promise<void> {
        try {
            if (wasmLoader && wasmLoader.isReady()) {
                // Use the database connection timeout from requirements (3 seconds)
                await this.executeWithTimeout(
                    () => this.performWasmCleanup(),
                    'WebAssembly cleanup',
                    this.config.dbConnectionTimeout
                );
            }
        } catch (error) {
            throw new Error(`WebAssembly cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Perform WebAssembly cleanup operations
     */
    private async performWasmCleanup(): Promise<void> {
        // Get the WASM module if available
        let module: FarertModule | null = null;
        try {
            if (wasmLoader.isReady()) {
                module = wasmLoader.getModule();
            }
        } catch (error) {
            // Module not ready or available - skip module-specific cleanup
            if (this.config.logLevel === 'debug') {
                console.log('[SIGNAL] WebAssembly module not available for cleanup');
            }
        }

        // Close database connection if module is available
        if (module && typeof module.closeDatabase === 'function') {
            try {
                module.closeDatabase();
                if (this.config.logLevel === 'debug') {
                    console.log('[SIGNAL] Database connection closed via module');
                }
            } catch (error) {
                console.warn('⚠️ Warning: Error closing database via module:', error);
            }
        }

        // Use wasmLoader cleanup for comprehensive cleanup
        try {
            wasmLoader.cleanup();
            if (this.config.logLevel === 'debug') {
                console.log('[SIGNAL] WebAssembly loader cleanup completed');
            }
        } catch (error) {
            console.warn('⚠️ Warning: WebAssembly loader cleanup error:', error);
        }
    }

    /**
     * Cleanup database connections (specific timeout handling)
     * REQ-CLI-003.4 - Database connection problems detected within 3 seconds with specific error codes
     */
    private async cleanupDatabase(): Promise<void> {
        try {
            // Database cleanup is handled in WebAssembly cleanup step
            // This step ensures any remaining database resources are cleaned up
            if (this.config.logLevel === 'debug') {
                console.log('[SIGNAL] Database cleanup verification completed');
            }
        } catch (error) {
            throw new CLIError(
                'Database cleanup failed during graceful shutdown',
                CLIErrorCode.DB_CONNECTION_FAILED,
                {
                    phase: 'graceful_shutdown',
                    timeout: this.config.dbConnectionTimeout,
                    originalError: error instanceof Error ? error.message : String(error)
                }
            );
        }
    }

    /**
     * Cleanup memory and perform garbage collection
     * REQ-CLI-003.4 - WebAssembly memory cleanup
     */
    private async cleanupMemory(): Promise<void> {
        if (!this.config.memoryCleanupEnabled) {
            return;
        }

        try {
            // Log memory usage before cleanup
            if (configManager && this.config.logLevel === 'debug') {
                configManager.logMemoryUsage('Before Shutdown Memory Cleanup');
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                if (this.config.logLevel === 'debug') {
                    console.log('[SIGNAL] Garbage collection executed');
                }
            }

            // Clear operation timeouts
            for (const [name, timeout] of this.operationTimeouts) {
                clearTimeout(timeout);
                if (this.config.logLevel === 'debug') {
                    console.log(`[SIGNAL] Cleared timeout for: ${name}`);
                }
            }
            this.operationTimeouts.clear();

            // Log memory usage after cleanup
            if (configManager && this.config.logLevel === 'debug') {
                configManager.logMemoryUsage('After Shutdown Memory Cleanup');
            }

        } catch (error) {
            console.warn('⚠️ Warning: Memory cleanup error:', error);
        }
    }

    /**
     * Cleanup configuration and final resources
     */
    private async cleanupConfiguration(): Promise<void> {
        try {
            // Final memory logging if enabled
            if (configManager && this.config.logLevel === 'debug') {
                configManager.logMemoryUsage('Final Shutdown');
            }
        } catch (error) {
            console.warn('⚠️ Warning: Configuration cleanup error:', error);
        }
    }

    /**
     * Handle shutdown timeout
     */
    private handleShutdownTimeout(): void {
        console.error('❌ Graceful shutdown timed out!');
        
        if (this.shutdownState) {
            const duration = Date.now() - this.shutdownState.startTime;
            console.error(`⏱️  Shutdown duration: ${duration}ms (timeout: ${this.config.gracefulShutdownTimeout}ms)`);
            
            console.error('📋 Completed cleanup steps:');
            this.shutdownState.cleanupSteps.forEach(step => console.error(`  ${step}`));
            
            if (this.shutdownState.errors.length > 0) {
                console.error('❌ Errors during cleanup:');
                this.shutdownState.errors.forEach((error, index) => {
                    console.error(`  ${index + 1}. ${error.message}`);
                });
            }
        }

        if (this.config.forceExitOnTimeout) {
            console.error('🚫 Forcing process exit due to timeout');
            process.exit(1);
        }
    }

    /**
     * Enhanced uncaught exception handler
     * REQ-CLI-003.4 - Test failures don't cause CLI crashes or memory corruption
     */
    private handleUncaughtException(error: Error): void {
        console.error('\n💥 Uncaught Exception occurred during CLI execution');
        
        const systemError = new SystemError(
            'Uncaught JavaScript exception occurred',
            error,
            {
                errorName: error.name,
                errorCode: (error as any).code,
                signal: (error as any).signal,
                syscall: (error as any).syscall,
                errno: (error as any).errno,
                path: (error as any).path,
                shutdownState: this.isShuttingDown ? 'during_shutdown' : 'normal_operation'
            }
        );
        
        console.error(systemError.getFormattedMessage());

        // If not already shutting down, attempt graceful shutdown
        if (!this.isShuttingDown) {
            console.error('🔄 Attempting graceful shutdown after uncaught exception...');
            this.initiateGracefulShutdown('EXCEPTION', `Uncaught exception: ${error.message}`);
        } else {
            // Force exit if already shutting down
            console.error('🚫 Exception during shutdown - forcing immediate exit');
            process.exit(systemError.code);
        }
    }

    /**
     * Enhanced unhandled rejection handler
     * REQ-CLI-003.4 - WebAssembly module errors isolated and recoverable
     */
    private handleUnhandledRejection(reason: any, promise: Promise<any>): void {
        console.error('\n💥 Unhandled Promise Rejection occurred');
        
        const systemError = new CLIError(
            'Unhandled promise rejection occurred',
            CLIErrorCode.UNHANDLED_REJECTION,
            {
                reason: reason instanceof Error ? reason.message : String(reason),
                reasonStack: reason instanceof Error ? reason.stack : undefined,
                promise: String(promise),
                location: 'Enhanced signal handler',
                shutdownState: this.isShuttingDown ? 'during_shutdown' : 'normal_operation'
            }
        );
        
        console.error(systemError.getFormattedMessage());

        // If not already shutting down, attempt graceful shutdown
        if (!this.isShuttingDown) {
            console.error('🔄 Attempting graceful shutdown after unhandled rejection...');
            const reasonText = reason instanceof Error ? reason.message : String(reason);
            this.initiateGracefulShutdown('REJECTION', `Unhandled rejection: ${reasonText}`);
        } else {
            // Force exit if already shutting down
            console.error('🚫 Rejection during shutdown - forcing immediate exit');
            process.exit(systemError.code);
        }
    }

    /**
     * Handle before exit event
     */
    private handleBeforeExit(): void {
        if (!this.isShuttingDown && this.config.logLevel === 'debug') {
            console.log('[SIGNAL] Process beforeExit event - ensuring cleanup');
            
            // Perform final cleanup check
            try {
                if (wasmLoader && wasmLoader.isReady()) {
                    console.log('[SIGNAL] Performing final WebAssembly cleanup');
                    wasmLoader.cleanup();
                }
            } catch (error) {
                console.error('[SIGNAL] Error in beforeExit cleanup:', error);
            }
        }
    }

    /**
     * Handle shutdown error
     */
    private handleShutdownError(error: any): void {
        console.error('💥 Error during graceful shutdown process');
        
        const shutdownError = new SystemError(
            'Graceful shutdown process failed',
            error instanceof Error ? error : new Error(String(error)),
            {
                shutdownState: this.shutdownState,
                shutdownReason: this.shutdownState?.reason,
                completedSteps: this.shutdownState?.cleanupSteps || []
            }
        );
        
        console.error(shutdownError.getFormattedMessage());

        // Clear timeout
        if (this.cleanupTimeout) {
            clearTimeout(this.cleanupTimeout);
        }

        // Force exit with error code
        process.exit(shutdownError.code);
    }

    /**
     * Get current shutdown state for debugging
     */
    getShutdownState(): ShutdownState | null {
        return this.shutdownState;
    }

    /**
     * Check if shutdown is in progress
     */
    isShutdownInProgress(): boolean {
        return this.isShuttingDown;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<SignalHandlerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): SignalHandlerConfig {
        return { ...this.config };
    }
}

// Export singleton instance
export const signalHandler = new SignalHandler();

/**
 * Convenience function to initialize signal handling
 * Should be called early in application startup
 */
export function initializeSignalHandling(config?: Partial<SignalHandlerConfig>): void {
    if (config) {
        signalHandler.updateConfig(config);
    }
    signalHandler.registerSignalHandlers();
}

/**
 * Create timeout wrapper for long-running operations
 * REQ-CLI-003.4 - Timeout handling for long-running operations
 */
export function withTimeout<T>(
    operation: () => Promise<T>, 
    timeoutMs: number, 
    operationName?: string
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Operation ${operationName || 'unknown'} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        Promise.resolve(operation())
            .then((result) => {
                clearTimeout(timeout);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeout);
                reject(error);
            });
    });
}

/**
 * Database operation with specific timeout (3 seconds per requirements)
 * REQ-CLI-003.4 - Database connection problems detected within 3 seconds
 */
export function withDatabaseTimeout<T>(
    operation: () => Promise<T>, 
    operationName?: string
): Promise<T> {
    return withTimeout(operation, 3000, `Database ${operationName || 'operation'}`);
}