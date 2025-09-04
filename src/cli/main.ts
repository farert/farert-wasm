#!/usr/bin/env node

/**
 * TypeScript implementation of testmain.cpp 
 * Complete migration from ../farert/test/unix/all/testmain.cpp
 * 
 * This is a faithful recreation of the original main() function structure
 */

import { wasmLoader } from './wasm_loader';
import { FarertModule } from './types';
import { executeRouteTest } from './route_test';
import { executeAutoRoute } from './auto_route';
import * as fs from 'fs';

// Import complete test suite (when ready)
let executeCompleteTestSuite: ((module: FarertModule) => Promise<void>) | null = null;
try {
    // Dynamic import to avoid compilation errors if file doesn't exist yet
    const testModule = require('./test_exec_complete');
    executeCompleteTestSuite = testModule.executeCompleteTestSuite;
} catch (error) {
    // Test suite module not available - will use fallback
    executeCompleteTestSuite = null;
}

// Global variables (equivalent to original C++ globals)
let tbuf = '';
let tbuf2 = '';

/**
 * Print usage information (equivalent to original C++ version)
 * Faithful recreation of usage() function from testmain.cpp
 */
function printUsage(programName: string): void {
    console.error(`Usage: ${programName} [OPTIONS] [ARGUMENTS]`);
    console.error('');
    console.error('OPTIONS:');
    console.error('      -exec     : Execute the complete test suite.');
    console.error('      -5        : Calculate 5-parameter route (station1 line1 station2 line2 station3)');
    console.error('      -h        : Show help message');
    console.error('      --help    : Show help message');
    console.error('      -help     : Show help message');
    console.error('      -<num>[r] : Route test with options:');
    console.error('                  0: all details (default)');
    console.error('                  1: no return trip');
    console.error('                  2: no special rules');
    console.error('                  3: no rules + no return');
    console.error('                  4: only special rules');
    console.error('                  5: only special rules + no return');
    console.error('                  r: reverse route order');
    console.error('');
    console.error('ARGUMENTS:');
    console.error('      <file>          : Route description file');
    console.error('      <station1> ...  : Direct route (odd count: normal, even count: auto)');
    console.error('');
    console.error('EXAMPLES:');
    console.error('      node main.js -exec');
    console.error('      node main.js -5 東京 東海道線 品川 東海道線 新大阪');
    console.error('      node main.js 東京 東海道線 品川');
    console.error('      node main.js routes.txt');
    console.error('');
    console.error('For detailed help, use: -h or --help');
}

/**
 * Parse command line arguments (equivalent to parse_cmdline() in original)
 */
function parseCommandLine(argc: number, argv: string[], isReverse: boolean): void {
    tbuf = ''; // Reset buffer
    tbuf2 = '';
    
    if (isReverse && (argc % 2) === 0) {
        // Reverse order for even number of arguments
        for (let i = argc - 1; i > 0; i--) {
            tbuf += argv[i] + ' ';
        }
    } else {
        // Normal order
        for (let i = 1; i < argc; i++) {
            if (((argc % 2) !== 0) && (i === (argc - 1))) {
                // Last argument for auto route (odd number of args)
                tbuf2 = argv[i];
            } else {
                tbuf += argv[i] + ' ';
            }
        }
    }
    
    // Remove trailing space
    tbuf = tbuf.trim();
}

/**
 * Print comprehensive help information (equivalent to C++ help display)
 * Includes Japanese examples as specified in requirements
 */
function printHelp(): void {
    console.log('Farert WebAssembly CLI - Japanese Railway Fare Calculator');
    console.log('========================================================');
    console.log('');
    console.log('USAGE:');
    console.log('  node main.js [OPTIONS] [ARGUMENTS]');
    console.log('');
    console.log('OPTIONS:');
    console.log('  -exec                Execute complete test suite (equivalent to test_exec.cpp)');
    console.log('  -h, --help, -help    Show this help message');
    console.log('  -5 <station1> <line1> <station2> <line2> <station3>');
    console.log('                      Calculate fare for 5-parameter route');
    console.log('  -<num>[r]           Route test with format options:');
    console.log('                      0: all details (default)');
    console.log('                      1: no return trip info');
    console.log('                      2: no special rules');
    console.log('                      3: no rules + no return');
    console.log('                      4: only special rules');
    console.log('                      5: only special rules + no return');
    console.log('                      r: reverse route order');
    console.log('');
    console.log('EXAMPLES:');
    console.log('  # Execute complete test suite');
    console.log('  node main.js -exec');
    console.log('');
    console.log('  # Calculate fare for Tokyo to Osaka via Tokaido Line');
    console.log('  node main.js -5 東京 東海道線 品川 東海道線 新大阪');
    console.log('');
    console.log('  # Direct route calculation (normal format)');
    console.log('  node main.js 東京 東海道線 品川');
    console.log('');
    console.log('  # Route from file');
    console.log('  node main.js route_file.txt');
    console.log('');
    console.log('  # Auto route calculation (even number of parameters)');
    console.log('  node main.js 東京 大阪');
    console.log('');
    console.log('For more information, see CLAUDE.md in the project root.');
    console.log('');
}

/**
 * Handle 5-parameter route calculation (-5 command)
 */
async function handle5ParameterRoute(args: string[], module: FarertModule): Promise<number> {
    if (args.length !== 5) {
        console.error('Error: -5 command requires exactly 5 parameters:');
        console.error('Usage: -5 <station1> <line1> <station2> <line2> <station3>');
        console.error('Example: -5 東京 東海道線 品川 東海道線 新大阪');
        return -1;
    }
    
    const [station1, line1, station2, line2, station3] = args;
    const routeString = `${station1} ${line1} ${station2} ${line2} ${station3}`;
    
    console.log(`Calculating fare for route: ${routeString}`);
    
    try {
        // Execute route test with all details (option 0)
        await executeRouteTest([routeString, ''], 0, module);
        return 0;
    } catch (error) {
        console.error('Error calculating 5-parameter route:', error);
        return -1;
    }
}

/**
 * Validate Japanese text input
 */
function validateJapaneseInput(text: string): boolean {
    // Check for common Japanese characters (Hiragana, Katakana, Kanji)
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]/;
    return japanesePattern.test(text) || /^[a-zA-Z0-9\s\-]+$/.test(text);
}

/**
 * Sanitize and validate station/line names
 */
function sanitizeInput(input: string): string {
    // Remove potentially problematic characters while preserving Japanese
    return input.trim().replace(/[\r\n\t]+/g, ' ');
}

/**
 * Helper functions for route processing (equivalent to original utility functions)
 */
function numOfWord(buf: string): number {
    return buf.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function subWord(srcStr: string, num: number): string {
    const words = srcStr.trim().split(/\s+/).filter(w => w.length > 0);
    if (num <= 0 || num > words.length) {
        return '';
    }
    return words.slice(num - 1).join(' ');
}

function removeComment(str: string): string {
    const commentPos = str.lastIndexOf('#');
    if (commentPos >= 0) {
        return str.substring(0, commentPos);
    }
    return str;
}

function rtrim(str: string): string {
    return str.replace(/\s+$/, '');
}

/**
 * Execute complete test suite wrapper
 */
async function runCompleteTestSuite(module: FarertModule): Promise<void> {
    if (executeCompleteTestSuite) {
        console.log('🛠\ufe0f Starting complete test suite (test_exec.cpp equivalent)...');
        await executeCompleteTestSuite(module);
        console.log('✅ Complete test suite finished successfully');
    } else {
        console.log('⚠\ufe0f Complete test suite not available. Running basic functionality tests...');
        console.log('');
        
        // Fallback to basic functionality tests
        const basicTests = [
            '東京 東海道線 品川',
            '新宿 中央線 立川',
            '大阪 東海道線 京都',
            '仙台 東北線 上野'
        ];
        
        for (const [index, testRoute] of basicTests.entries()) {
            console.log(`\nTest ${index + 1}/${basicTests.length}: ${testRoute}`);
            try {
                await executeRouteTest([testRoute], 0, module);
                console.log('✅ Test passed');
            } catch (error) {
                console.error(`❌ Test failed: ${error}`);
            }
        }
        
        console.log('\n✅ Basic test suite completed.');
        console.log('Note: For complete testing, ensure test_exec_complete.ts is available.');
    }
}

/**
 * Process route from file (equivalent to from_stream() in original)
 */
async function fromStream(filename: string, optionNum: number, module: FarertModule): Promise<void> {
    try {
        const content = fs.readFileSync(filename, 'utf8');
        const lines = content.split('\n');
        
        console.log(`Processing route file: ${filename}`);
        
        for (let line of lines) {
            // Remove comments
            line = removeComment(line);
            line = rtrim(line);
            
            // Skip empty lines or comments
            if (line.length === 0 || line.startsWith('#')) {
                continue;
            }
            
            // End processing on '/'
            if (line.startsWith('/')) {
                break;
            }
            
            // Validate Japanese input
            if (!validateJapaneseInput(line)) {
                console.warn(`Warning: Potentially invalid input: ${line}`);
            }
            
            // Sanitize input
            line = sanitizeInput(line);
            
            // Count words
            const wordCount = numOfWord(line);
            
            if ((wordCount % 2) !== 0) {
                // Odd number: normal route
                tbuf = line;
                await executeRouteTest([tbuf, ''], optionNum, module);
            } else {
                // Even number: auto route  
                const lastWord = subWord(line, wordCount);
                tbuf2 = lastWord;
                tbuf = line.substring(0, line.indexOf(lastWord)).trim();
                await executeAutoRoute([tbuf, tbuf2, ''], 0x10000 + optionNum, module);
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Can't open file: ${filename} - ${error.message}`);
        } else {
            console.error(`Can't open file: ${filename}`);
        }
    }
}

/**
 * Main function - faithful recreation of testmain.cpp main()
 * Enhanced with comprehensive command support and error handling
 */
async function main(): Promise<number> {
    // Validate CLI environment first
    if (!validateCliEnvironment()) {
        return -1;
    }
    
    const argv = process.argv;
    const argc = argv.length;
    let optionNum = 0;
    let optionRev = 0;
    
    // Handle help commands early (no WebAssembly needed)
    if (argc >= 3) {
        const firstArg = argv[2];
        if (firstArg === '-h' || firstArg === '--help' || firstArg === '-help') {
            printHelp();
            return 0;
        }
    }
    
    // Initialize WebAssembly (equivalent to database initialization)
    let module: FarertModule;
    try {
        console.log('Initializing WebAssembly module...');
        module = await wasmLoader.loadModule();
        
        console.log('Opening database connection...');
        const dbResult = module.openDatabase();
        if (!dbResult) {
            console.error('❌ Cannot open database');
            console.error('Please ensure the WebAssembly build is complete with: npm run build');
            return -1;
        }
        console.log('✅ Database connection established');
    } catch (error) {
        console.error('❌ Failed to initialize WebAssembly module:');
        if (error instanceof Error) {
            console.error('   ', error.message);
        }
        console.error('Please run: npm run build');
        return -1;
    }
    
    if (argc < 3) {
        // Show usage (equivalent to original argc < 2 check)
        printUsage(argv[1]);
        return -1;
    }
    
    let argIndex = 2; // Skip 'node' and script name
    
    if (argv[argIndex].startsWith('-')) {
        const option = argv[argIndex];
        
        if (option === '-exec') {
            // Execute all test patterns (equivalent to test_exec())
            try {
                console.log('🚀 Starting complete test suite execution...');
                await runCompleteTestSuite(module);
                console.log('✅ Complete test suite execution finished');
                return 0;
            } catch (error) {
                console.error('❌ Test execution failed:', error);
                return -1;
            }
        } else if (option === '-5') {
            // Handle 5-parameter route calculation
            const routeArgs = argv.slice(argIndex + 1);
            return await handle5ParameterRoute(routeArgs, module);
        } else {
            // Parse numeric options with optional 'r' suffix
            let numStr = option.substring(1);
            
            // Check for 'r' suffix (reverse)
            if (numStr.endsWith('r')) {
                optionRev = 1;
                numStr = numStr.substring(0, numStr.length - 1);
            }
            
            optionNum = parseInt(numStr, 10);
            if (isNaN(optionNum)) {
                optionNum = 0;
            }
            
            argIndex++; // Move to next argument
        }
    }
    
    const remainingArgs = argv.slice(argIndex);
    
    if (remainingArgs.length === 0 && !argv[2]?.startsWith('-')) {
        // No arguments provided
        printUsage(argv[1]);
        return -1;
    }
    
    if (remainingArgs.length === 1) {
        // Route from file
        const filename = remainingArgs[0];
        console.log(`Processing route file: ${filename}`);
        await fromStream(filename, optionNum, module);
    } else if (remainingArgs.length > 1) {
        // Route as command line direct
        console.log(`🚂 Processing command line route with ${remainingArgs.length} parameters`);
        
        // Validate Japanese input for all arguments
        for (const arg of remainingArgs) {
            if (!arg || arg.trim().length === 0) {
                console.error('❌ Error: Empty parameter detected');
                return -1;
            }
            if (!validateJapaneseInput(arg)) {
                console.warn(`⚠️ Warning: Potentially invalid input: ${arg}`);
            }
        }
        
        parseCommandLine(remainingArgs.length + 1, [''].concat(remainingArgs), optionRev === 1);
        
        if ((remainingArgs.length % 2) === 1) {
            // Odd number: normal route
            console.log(`🛤️ Executing normal route: ${tbuf}`);
            await executeRouteTest([tbuf, ''], optionNum, module);
        } else {
            // Even number: auto route
            console.log(`🤖 Executing auto route: ${tbuf} -> ${tbuf2}`);
            await executeAutoRoute([tbuf, tbuf2, ''], 0x10000 + optionNum, module);
        }
    }
    
    // Cleanup
    try {
        module.closeDatabase();
        console.log('✅ Database connection closed');
    } catch (error) {
        console.warn('⚠️ Warning during cleanup:', error);
    }
    
    return 0;
}

/**
 * CLI entry point validation and initialization
 */
function validateCliEnvironment(): boolean {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
    
    if (majorVersion < 14) {
        console.error('❌ Error: Node.js 14.0.0 or higher is required');
        console.error(`Current version: ${nodeVersion}`);
        return false;
    }
    
    return true;
}

// Error handlers (equivalent to C++ exception handling)
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
    console.log('\n\u26a0\ufe0f Received SIGINT. Cleaning up...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\u26a0\ufe0f Received SIGTERM. Cleaning up...');
    process.exit(0);
});

// Execute main and exit with appropriate code
main().then((exitCode) => {
    process.exit(exitCode);
}).catch((error) => {
    console.error('\u274c Main execution failed:', error);
    if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
    }
    process.exit(1);
});