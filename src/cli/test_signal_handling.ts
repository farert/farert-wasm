#!/usr/bin/env node
/**
 * Signal Handling Test Script
 * Task 13 - typescript-cli-interface specification
 * 
 * This script demonstrates and tests the enhanced signal handling capabilities
 * including graceful shutdown, timeout handling, and WebAssembly cleanup.
 */

import { signalHandler, initializeSignalHandling } from './signal_handler';
import { wasmLoader } from './wasm_loader';
import { configManager } from './config_manager';

/**
 * Test graceful shutdown with various scenarios
 */
async function testSignalHandling(): Promise<void> {
    console.log('🧪 Signal Handling Test Suite');
    console.log('============================\n');

    // Initialize signal handling with debug mode
    initializeSignalHandling({
        enabled: true,
        gracefulShutdownTimeout: 5000,     // 5 seconds for testing
        dbConnectionTimeout: 3000,         // 3 seconds per requirement
        cleanupTimeout: 2000,              // 2 seconds for cleanup
        forceExitOnTimeout: true,
        memoryCleanupEnabled: true,
        logLevel: 'debug'
    });

    console.log('✅ Signal handling initialized with debug configuration');
    console.log(`   - Graceful shutdown timeout: 5 seconds`);
    console.log(`   - Database timeout: 3 seconds (per REQ-CLI-003.4)`);
    console.log(`   - Cleanup timeout: 2 seconds`);
    console.log(`   - Memory cleanup: enabled`);
    console.log(`   - Log level: debug\n`);

    // Test 1: Normal operation without WebAssembly
    console.log('📋 Test 1: Signal handler status check');
    console.log(`   - Signal handlers registered: ${signalHandler.getConfig().enabled}`);
    console.log(`   - Current shutdown state: ${signalHandler.isShutdownInProgress() ? 'IN PROGRESS' : 'NORMAL'}`);
    console.log(`   - Configuration: ${JSON.stringify(signalHandler.getConfig(), null, 2)}\n`);

    // Test 2: WebAssembly initialization and cleanup test
    console.log('📋 Test 2: WebAssembly initialization and signal handling');
    try {
        console.log('   Loading WebAssembly module...');
        const module = await wasmLoader.loadModule();
        
        console.log('   Initializing database...');
        const dbResult = await wasmLoader.initializeDatabase();
        
        if (dbResult) {
            console.log('   ✅ Database initialized successfully');
            
            // Simulate some operations
            console.log('   Performing test database operations...');
            
            // Test station lookup to verify database works
            if (typeof module.getStationId === 'function') {
                const tokyoId = module.getStationId('東京');
                if (tokyoId > 0) {
                    console.log(`   ✅ Station lookup test passed: 東京 = ${tokyoId}`);
                } else {
                    console.log('   ⚠️  Station lookup returned invalid ID');
                }
            }
            
            // Test cleanup manually
            console.log('   Testing manual cleanup...');
            wasmLoader.cleanup();
            console.log('   ✅ Manual cleanup completed successfully');
            
        } else {
            console.log('   ❌ Database initialization failed');
        }
    } catch (error) {
        console.error('   ❌ WebAssembly test failed:', error);
        
        if (error instanceof Error) {
            console.error(`   Error details: ${error.message}`);
            if (error.stack) {
                console.error('   Stack trace (first 3 lines):');
                const stackLines = error.stack.split('\n').slice(0, 3);
                stackLines.forEach(line => console.error(`     ${line}`));
            }
        }
    }

    // Test 3: Memory and environment status
    console.log('\n📋 Test 3: Environment and memory status');
    try {
        const memoryStats = configManager.getMemoryUsageStats();
        console.log(`   - RSS Memory: ${memoryStats.rss.toFixed(2)}MB`);
        console.log(`   - Heap Used: ${memoryStats.heapUsed.toFixed(2)}MB`);
        console.log(`   - Heap Total: ${memoryStats.heapTotal.toFixed(2)}MB`);
        console.log(`   - External: ${memoryStats.external.toFixed(2)}MB`);
    } catch (error) {
        console.error('   ❌ Memory stats error:', error);
    }

    // Test 4: Configuration validation
    console.log('\n📋 Test 4: Configuration validation');
    try {
        const config = configManager.getConfiguration();
        console.log(`   - Debug mode: ${config.debug}`);
        console.log(`   - Memory monitoring: ${config.memoryMonitoring}`);
        console.log(`   - Platform: ${config.platform}`);
        console.log(`   - Node.js version: ${config.nodeVersion}`);
        console.log(`   - Custom WASM path: ${config.wasmPath || 'None'}`);
    } catch (error) {
        console.error('   ❌ Configuration error:', error);
    }

    console.log('\n🎯 Signal Handling Test Instructions');
    console.log('=====================================');
    console.log('To test graceful shutdown:');
    console.log('1. Run this script: node dist/cli/cli/test_signal_handling.js');
    console.log('2. Press Ctrl+C (SIGINT) to trigger graceful shutdown');
    console.log('3. Observe the cleanup sequence in debug output');
    console.log('4. Check that WebAssembly memory is properly cleaned up');
    console.log('');
    console.log('Expected behavior:');
    console.log('✅ Signal received message');
    console.log('✅ Graceful shutdown initiated');
    console.log('✅ Performance monitoring cleanup');
    console.log('✅ WebAssembly module cleanup');
    console.log('✅ Database connection cleanup (within 3 seconds)');
    console.log('✅ Memory cleanup and garbage collection');
    console.log('✅ Configuration cleanup');
    console.log('✅ Process exit with code 0');
    console.log('');
    console.log('⚠️  If cleanup times out (>5 seconds), process will be forcefully terminated');
    console.log('');

    // Keep the process alive for manual testing
    console.log('🔄 Process is now running. Press Ctrl+C to test graceful shutdown...');
    console.log('   (This process will continue running until manually interrupted)\n');
    
    // Simulate long-running process
    const startTime = Date.now();
    const intervalId = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        if (elapsed % 10 === 0) {  // Log every 10 seconds
            console.log(`⏱️  Process running for ${elapsed} seconds - Press Ctrl+C to test shutdown`);
        }
    }, 1000);

    // Cleanup interval on shutdown
    process.on('exit', () => {
        clearInterval(intervalId);
    });
}

// Handle errors in test script itself
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Test script unhandled rejection:', reason);
    console.error('   Promise:', promise);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Test script uncaught exception:', error);
    process.exit(1);
});

// Run the test
if (require.main === module) {
    console.log('Starting signal handling test suite...\n');
    testSignalHandling().catch((error) => {
        console.error('💥 Test suite failed:', error);
        process.exit(1);
    });
}