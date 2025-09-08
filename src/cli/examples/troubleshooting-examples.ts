#!/usr/bin/env node

/**
 * Error Handling and Troubleshooting Examples
 * 
 * This file demonstrates comprehensive error handling patterns for WASM Object Classes:
 * - Common error scenarios and their solutions
 * - Input validation and sanitization
 * - Recovery strategies for failed operations
 * - Memory management and cleanup
 * - Debugging techniques and diagnostics
 * - Performance troubleshooting
 * 
 * Requirements: REQ-OBJ-008 - Troubleshooting scenarios for common issues
 * Focus: Error prevention, detection, handling, and recovery patterns
 */

import { wasmLoader } from '../wasm_loader';
import { 
    FarertModule, 
    CalcRouteWrapper,
    CLIError,
    CLIErrorCode
} from '../types';

/**
 * Input Validation and Sanitization Examples
 * 
 * Demonstrates proper validation of Japanese text input and
 * handling of malformed or invalid data.
 */
async function demonstrateInputValidation(module: FarertModule): Promise<void> {
    console.log('=== Input Validation and Sanitization ===\n');
    
    const testInputs = [
        {
            name: 'Valid Japanese Station Names',
            inputs: ['東京', '新宿', '品川', '大阪'],
            expectValid: true
        },
        {
            name: 'Invalid Characters',
            inputs: ['<script>alert("xss")</script>', '../../etc/passwd', 'SELECT * FROM stations'],
            expectValid: false
        },
        {
            name: 'Empty or Null Inputs',
            inputs: ['', '   ', '\t\n', null as any, undefined as any],
            expectValid: false
        },
        {
            name: 'Mixed Valid/Invalid',
            inputs: ['東京123', 'To東京kyo', '東京!@#'],
            expectValid: false
        },
        {
            name: 'Long Input Strings',
            inputs: ['東京'.repeat(100), 'a'.repeat(500)],
            expectValid: false
        },
        {
            name: 'Unicode Edge Cases',
            inputs: ['\u0000東京', '東京\uFFFF', '東京\u200B'],
            expectValid: false
        }
    ];
    
    for (const testCase of testInputs) {
        console.log(`--- ${testCase.name} ---`);
        
        for (const input of testCase.inputs) {
            console.log(`🔍 Testing input: ${JSON.stringify(input)}`);
            
            try {
                // Test station ID lookup
                if (input && typeof input === 'string') {
                    // Basic input validation
                    if (input.trim().length === 0) {
                        console.log('   ❌ Empty input detected');
                        continue;
                    }
                    
                    // Character validation
                    const hasValidChars = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u31F0-\u31FF\u3000-\u3006\u3012-\u3013\u3020a-zA-Z0-9\s\-\(\)・ー]+$/.test(input);
                    if (!hasValidChars) {
                        console.log('   ❌ Invalid characters detected');
                        continue;
                    }
                    
                    // Length validation
                    if (input.length > 50) {
                        console.log('   ❌ Input too long (max 50 characters)');
                        continue;
                    }
                    
                    // Try database lookup
                    const stationId = module.getStationId(input);
                    if (stationId > 0) {
                        const stationName = module.getStationName(stationId);
                        console.log(`   ✅ Valid station: ${stationName} (ID: ${stationId})`);
                    } else {
                        console.log(`   ⚠️  Station not found in database`);
                        
                        // Provide suggestions for similar names
                        const suggestions = getSimilarStationNames(input, module);
                        if (suggestions.length > 0) {
                            console.log(`   💡 Similar stations: ${suggestions.slice(0, 3).join(', ')}`);
                        }
                    }
                } else {
                    console.log(`   ❌ Invalid input type: ${typeof input}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error processing input: ${error.message}`);
                
                // Log error details for debugging
                if (error instanceof Error && error.stack) {
                    console.log(`   📋 Stack trace available (use debug mode)`);
                }
            }
        }
        
        console.log('');
    }
    
    console.log('🛡️  Input Validation Best Practices:');
    console.log('   • Always validate input length and character set');
    console.log('   • Sanitize input before database operations');
    console.log('   • Provide meaningful error messages with suggestions');
    console.log('   • Log security events for suspicious inputs');
    console.log('   • Use try-catch blocks around all external data processing');
    console.log('\n');
}

/**
 * Route Construction Error Handling
 * 
 * Demonstrates error handling during route construction with
 * invalid stations, lines, or route combinations.
 */
async function demonstrateRouteConstructionErrors(module: FarertModule): Promise<void> {
    console.log('=== Route Construction Error Handling ===\n');
    
    const errorScenarios = [
        {
            name: 'Invalid Station Names',
            description: 'Attempting to use non-existent stations',
            routeData: ['NonExistentStation', '東海道線', '東京'],
            expectedError: 'Station not found'
        },
        {
            name: 'Invalid Line Names', 
            description: 'Using non-existent or misspelled line names',
            routeData: ['東京', 'NonExistentLine', '品川'],
            expectedError: 'Line not found'
        },
        {
            name: 'Impossible Route Connections',
            description: 'Stations not connected by specified line',
            routeData: ['東京', '山手線', '大阪'], // Yamanote line doesn't go to Osaka
            expectedError: 'Route connection not possible'
        },
        {
            name: 'Empty Route Components',
            description: 'Missing required route components',
            routeData: ['東京', '', '品川'],
            expectedError: 'Empty route component'
        },
        {
            name: 'Single Station Route',
            description: 'Trying to create route with only one station',
            routeData: ['東京'],
            expectedError: 'Insufficient route data'
        },
        {
            name: 'Circular Route Error',
            description: 'Same start and end station with invalid path',
            routeData: ['東京', '東海道線', '東京'],
            expectedError: 'Circular route validation needed'
        }
    ];
    
    for (const scenario of errorScenarios) {
        console.log(`--- ${scenario.name} ---`);
        console.log(`📍 ${scenario.description}`);
        console.log(`🚃 Route data: [${scenario.routeData.join(', ')}]`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            
            // Method 1: String-based route setup
            try {
                const routeString = scenario.routeData.join(' ');
                calcRoute.setupRoute(routeString);
                console.log(`✅ String setup succeeded: "${routeString}"`);
                
                // Try to calculate fare
                const fareInfo = calcRoute.calcFare();
                console.log(`💴 Calculated fare: ¥${fareInfo.fare}`);
                
                if (fareInfo.result !== 0) {
                    console.log(`⚠️  Calculation result code: ${fareInfo.result} (may indicate issues)`);
                }
                
            } catch (stringError) {
                console.log(`❌ String setup failed: ${stringError.message}`);
                
                // Method 2: Manual route construction with validation
                console.log('🔧 Attempting manual route construction...');
                
                try {
                    calcRoute.removeAll(); // Clear any partial route
                    
                    // Validate and add stations step by step
                    for (let i = 0; i < scenario.routeData.length; i += 2) {
                        const stationName = scenario.routeData[i];
                        const lineName = scenario.routeData[i + 1];
                        
                        if (!stationName || stationName.trim().length === 0) {
                            throw new Error(`Empty station name at position ${i}`);
                        }
                        
                        const stationId = module.getStationId(stationName);
                        if (stationId <= 0) {
                            throw new Error(`Station "${stationName}" not found`);
                        }
                        
                        if (i === 0) {
                            // First station - just add as starting point
                            const result = calcRoute.addRoute(stationId);
                            console.log(`   ✅ Added start station: ${stationName} (result: ${result})`);
                        } else {
                            // Subsequent stations - need line information
                            if (!lineName || lineName.trim().length === 0) {
                                throw new Error(`Empty line name for segment to ${stationName}`);
                            }
                            
                            const lineId = module.getLineId(lineName);
                            if (lineId <= 0) {
                                throw new Error(`Line "${lineName}" not found`);
                            }
                            
                            const result = calcRoute.addRouteWithLine(lineId, stationId);
                            console.log(`   ✅ Added station: ${stationName} via ${lineName} (result: ${result})`);
                        }
                    }
                    
                    // If we got here, manual construction succeeded
                    console.log('✅ Manual route construction succeeded');
                    
                    const fareInfo = calcRoute.calcFare();
                    console.log(`💴 Calculated fare: ¥${fareInfo.fare}`);
                    
                } catch (manualError) {
                    console.log(`❌ Manual construction failed: ${manualError.message}`);
                    
                    // Provide recovery suggestions
                    provideTroubleshootingSuggestions(scenario.routeData, manualError.message, module);
                }
            }
            
        } catch (error) {
            console.log(`❌ Route construction failed: ${error.message}`);
            
            // Provide specific error analysis
            analyzeRouteError(error, scenario.routeData, module);
        }
        
        console.log('');
    }
    
    console.log('🔧 Route Construction Best Practices:');
    console.log('   • Validate each station and line before adding to route');
    console.log('   • Use setupRoute() for simple routes, manual construction for complex ones');
    console.log('   • Always clear routes (removeAll()) before building new ones');
    console.log('   • Check addRoute() return values for success/failure indication');
    console.log('   • Provide meaningful error messages with suggested corrections');
    console.log('\n');
}

/**
 * WebAssembly and Memory Management Issues
 * 
 * Demonstrates handling of WebAssembly-specific errors and
 * proper memory management practices.
 */
async function demonstrateWebAssemblyIssues(module: FarertModule): Promise<void> {
    console.log('=== WebAssembly and Memory Management ===\n');
    
    console.log('--- Memory Monitoring ---');
    
    // Monitor memory usage during operations
    const initialMemory = process.memoryUsage();
    console.log(`📊 Initial memory usage:`);
    console.log(`   Heap used: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Heap total: ${(initialMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    
    try {
        console.log('\n--- Stress Testing Object Creation ---');
        
        const routes: CalcRouteWrapper[] = [];
        
        // Create multiple route objects to test memory management
        for (let i = 0; i < 10; i++) {
            try {
                const calcRoute = new module.cCalcRoute();
                calcRoute.setupRoute('東京 東海道線 品川');
                routes.push(calcRoute);
                
                if (i % 5 === 0) {
                    const currentMemory = process.memoryUsage();
                    const heapIncrease = (currentMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
                    console.log(`   Route ${i + 1}: Heap increase: +${heapIncrease.toFixed(2)} MB`);
                }
                
            } catch (error) {
                console.log(`❌ Failed to create route ${i + 1}: ${error.message}`);
                break;
            }
        }
        
        console.log(`✅ Created ${routes.length} route objects successfully`);
        
        console.log('\n--- Testing Route Calculations Under Load ---');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < routes.length; i++) {
            try {
                const fareInfo = routes[i].calcFare();
                if (fareInfo && fareInfo.fare > 0) {
                    successCount++;
                } else {
                    console.log(`⚠️  Route ${i + 1}: Invalid fare result`);
                    errorCount++;
                }
            } catch (error) {
                console.log(`❌ Route ${i + 1} calculation failed: ${error.message}`);
                errorCount++;
            }
        }
        
        console.log(`📊 Calculation results: ${successCount} success, ${errorCount} errors`);
        
        console.log('\n--- Memory Cleanup Testing ---');
        
        // Clear routes and test garbage collection
        routes.length = 0; // Clear array references
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            console.log('🧹 Forced garbage collection');
        } else {
            console.log('ℹ️  Garbage collection not available (run with --expose-gc for testing)');
        }
        
        const finalMemory = process.memoryUsage();
        const memoryDiff = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
        console.log(`📊 Final memory difference: ${memoryDiff >= 0 ? '+' : ''}${memoryDiff.toFixed(2)} MB`);
        
        if (memoryDiff > 50) {
            console.log('⚠️  Significant memory increase detected - possible leak');
        } else {
            console.log('✅ Memory usage within acceptable range');
        }
        
    } catch (error) {
        console.error('❌ Memory management test failed:', error);
    }
    
    console.log('\n--- WebAssembly Error Simulation ---');
    
    const wasmErrorTests = [
        {
            name: 'Invalid Function Call',
            test: () => {
                // Try to call a non-existent function
                if ('nonExistentFunction' in module) {
                    (module as any).nonExistentFunction();
                } else {
                    throw new Error('Function not found in WASM module');
                }
            }
        },
        {
            name: 'Invalid Parameter Types',
            test: () => {
                // Try to pass invalid parameters
                module.getStationId(123 as any); // Should be string
            }
        },
        {
            name: 'Database Access After Close',
            test: () => {
                // This test is conceptual - normally we wouldn't close DB mid-operation
                console.log('ℹ️  Database closure test skipped to maintain session integrity');
            }
        }
    ];
    
    for (const test of wasmErrorTests) {
        console.log(`Testing: ${test.name}`);
        
        try {
            test.test();
            console.log('   ⚠️  Test unexpectedly succeeded');
        } catch (error) {
            console.log(`   ✅ Expected error caught: ${error.message}`);
        }
    }
    
    console.log('\n🧠 Memory Management Best Practices:');
    console.log('   • Monitor memory usage in long-running applications');
    console.log('   • Clear route objects when no longer needed');
    console.log('   • Use try-catch blocks around all WASM function calls');
    console.log('   • Validate parameter types before WASM calls');
    console.log('   • Implement proper cleanup in finally blocks');
    console.log('\n');
}

/**
 * Performance Troubleshooting Examples
 * 
 * Demonstrates techniques for identifying and resolving
 * performance issues in route calculations.
 */
async function demonstratePerformanceTroubleshooting(module: FarertModule): Promise<void> {
    console.log('=== Performance Troubleshooting ===\n');
    
    const performanceTests = [
        {
            name: 'Simple Route',
            route: '東京 山手線 品川',
            expectedTime: 100 // ms
        },
        {
            name: 'Medium Complexity',
            route: '新宿 中央線 東京 東海道線 名古屋',
            expectedTime: 200 // ms
        },
        {
            name: 'Complex Route',
            route: '札幌 函館線 函館 津軽海峡線 本州 東海道線 大阪',
            expectedTime: 500 // ms
        },
        {
            name: 'Very Long Route String',
            route: '東京 山手線 品川 東海道線 横浜 東海道線 小田原 東海道線 熱海 東海道線 沼津',
            expectedTime: 300 // ms
        }
    ];
    
    console.log('--- Route Calculation Performance ---');
    
    for (const test of performanceTests) {
        console.log(`\n🏃 Testing: ${test.name}`);
        console.log(`📝 Route: ${test.route}`);
        console.log(`⏱️  Expected max time: ${test.expectedTime}ms`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            
            // Warm up - first calculation might be slower
            const startWarmup = Date.now();
            calcRoute.setupRoute(test.route);
            calcRoute.calcFare();
            const warmupTime = Date.now() - startWarmup;
            console.log(`🔥 Warmup time: ${warmupTime}ms`);
            
            // Actual performance test
            calcRoute.removeAll();
            const startTime = Date.now();
            
            calcRoute.setupRoute(test.route);
            const setupTime = Date.now();
            
            const fareInfo = calcRoute.calcFare();
            const endTime = Date.now();
            
            const setupDuration = setupTime - startTime;
            const calcDuration = endTime - setupTime;
            const totalDuration = endTime - startTime;
            
            console.log(`⚙️  Setup time: ${setupDuration}ms`);
            console.log(`💰 Calculation time: ${calcDuration}ms`);
            console.log(`📊 Total time: ${totalDuration}ms`);
            console.log(`💴 Fare result: ¥${fareInfo.fare}`);
            
            // Performance analysis
            if (totalDuration <= test.expectedTime) {
                console.log('✅ Performance within expected range');
            } else {
                console.log(`⚠️  Performance slower than expected (${totalDuration - test.expectedTime}ms over)`);
                
                // Provide optimization suggestions
                if (setupDuration > calcDuration) {
                    console.log('💡 Optimization: Route setup is bottleneck - consider caching parsed routes');
                } else {
                    console.log('💡 Optimization: Calculation is bottleneck - consider simpler routing');
                }
            }
            
            // Memory efficiency check
            const routeCount = calcRoute.getRouteCount();
            if (routeCount > 0) {
                const timePerSegment = totalDuration / routeCount;
                console.log(`📈 Time per route segment: ${timePerSegment.toFixed(1)}ms`);
                
                if (timePerSegment > 50) {
                    console.log('⚠️  High time per segment - route may be overly complex');
                }
            }
            
        } catch (error) {
            console.log(`❌ Performance test failed: ${error.message}`);
            
            // Analyze performance failure
            if (error.message.includes('timeout')) {
                console.log('💡 Suggestion: Route calculation timed out - try simpler route or increase timeout');
            } else if (error.message.includes('memory')) {
                console.log('💡 Suggestion: Memory issue - reduce route complexity or restart application');
            } else {
                console.log('💡 Suggestion: Check route validity and retry with simplified route');
            }
        }
    }
    
    console.log('\n--- Batch Processing Performance ---');
    
    const batchRoutes = [
        '東京 山手線 品川',
        '新宿 中央線 立川', 
        '大阪 東海道線 京都',
        '仙台 東北線 上野',
        '名古屋 東海道線 静岡'
    ];
    
    console.log(`🔄 Processing ${batchRoutes.length} routes in batch...`);
    
    const batchStartTime = Date.now();
    let batchSuccess = 0;
    let batchErrors = 0;
    
    for (const [index, route] of batchRoutes.entries()) {
        try {
            const calcRoute = new module.cCalcRoute();
            const startTime = Date.now();
            
            calcRoute.setupRoute(route);
            const fareInfo = calcRoute.calcFare();
            
            const duration = Date.now() - startTime;
            console.log(`   ${index + 1}. ${route}: ¥${fareInfo.fare} (${duration}ms)`);
            batchSuccess++;
            
        } catch (error) {
            console.log(`   ${index + 1}. ${route}: ❌ Failed - ${error.message}`);
            batchErrors++;
        }
    }
    
    const totalBatchTime = Date.now() - batchStartTime;
    console.log(`📊 Batch results: ${batchSuccess} success, ${batchErrors} errors in ${totalBatchTime}ms`);
    
    if (batchSuccess > 0) {
        const avgTimePerRoute = totalBatchTime / batchSuccess;
        console.log(`⚡ Average time per successful route: ${avgTimePerRoute.toFixed(1)}ms`);
    }
    
    console.log('\n⚡ Performance Optimization Tips:');
    console.log('   • Cache frequently used route calculations');
    console.log('   • Batch similar routes together for better memory locality');
    console.log('   • Monitor calculation time and implement timeouts');
    console.log('   • Consider route simplification for very complex paths');
    console.log('   • Use performance.now() for high-precision timing in browsers');
    console.log('\n');
}

/**
 * Utility function to find similar station names
 */
function getSimilarStationNames(input: string, module: FarertModule): string[] {
    const commonStations = [
        '東京', '新宿', '渋谷', '池袋', '品川', '上野', '大阪', '京都', '名古屋',
        '横浜', '神戸', '福岡', '仙台', '札幌', '広島', '静岡', '浜松', '岡山'
    ];
    
    return commonStations
        .filter(station => {
            const similarity = calculateSimilarity(input, station);
            return similarity > 0.3;
        })
        .slice(0, 3);
}

/**
 * Simple similarity calculation for Japanese text
 */
function calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const chars1 = Array.from(str1.toLowerCase());
    const chars2 = Array.from(str2.toLowerCase());
    
    let matches = 0;
    const longer = chars1.length > chars2.length ? chars1 : chars2;
    const shorter = chars1.length > chars2.length ? chars2 : chars1;
    
    for (const char of shorter) {
        const index = longer.indexOf(char);
        if (index >= 0) {
            matches++;
            longer.splice(index, 1);
        }
    }
    
    return (matches * 2) / (chars1.length + chars2.length);
}

/**
 * Provide troubleshooting suggestions based on route data and error
 */
function provideTroubleshootingSuggestions(routeData: string[], errorMessage: string, module: FarertModule): void {
    console.log('\n🔧 Troubleshooting Suggestions:');
    
    if (errorMessage.includes('Station') && errorMessage.includes('not found')) {
        console.log('   • Check station name spelling (use exact Japanese characters)');
        console.log('   • Verify station exists in the database');
        console.log('   • Try alternative station names (some have multiple names)');
        
        // Try to find similar stations for each station in the route
        routeData.forEach((item, index) => {
            if (index % 2 === 0) { // Station names are at even indices
                const suggestions = getSimilarStationNames(item, module);
                if (suggestions.length > 0) {
                    console.log(`   • Similar to "${item}": ${suggestions.join(', ')}`);
                }
            }
        });
    }
    
    if (errorMessage.includes('Line') && errorMessage.includes('not found')) {
        console.log('   • Check line name spelling and format');
        console.log('   • Use official line names (e.g., "東海道線" not "東海道")');
        console.log('   • Some lines have multiple names - try alternatives');
    }
    
    if (errorMessage.includes('connection') || errorMessage.includes('Route')) {
        console.log('   • Verify the specified line actually connects the stations');
        console.log('   • Check if transfer is required (add intermediate station)');
        console.log('   • Consider alternative routing through major stations');
    }
    
    console.log('   • Use setupRoute() for simple routes, manual construction for complex ones');
    console.log('   • Check the database connectivity and module initialization');
}

/**
 * Analyze route errors and provide specific diagnostics
 */
function analyzeRouteError(error: Error, routeData: string[], module: FarertModule): void {
    console.log('\n🔍 Error Analysis:');
    
    console.log(`   Error type: ${error.constructor.name}`);
    console.log(`   Error message: ${error.message}`);
    
    // Check each component
    console.log('\n   Component Analysis:');
    routeData.forEach((component, index) => {
        if (!component || component.trim().length === 0) {
            console.log(`   ${index + 1}. Empty component`);
            return;
        }
        
        const type = index % 2 === 0 ? 'Station' : 'Line';
        
        try {
            if (type === 'Station') {
                const id = module.getStationId(component);
                if (id > 0) {
                    console.log(`   ${index + 1}. ${type} "${component}": ✅ Valid (ID: ${id})`);
                } else {
                    console.log(`   ${index + 1}. ${type} "${component}": ❌ Not found`);
                }
            } else {
                const id = module.getLineId(component);
                if (id > 0) {
                    console.log(`   ${index + 1}. ${type} "${component}": ✅ Valid (ID: ${id})`);
                } else {
                    console.log(`   ${index + 1}. ${type} "${component}": ❌ Not found`);
                }
            }
        } catch (componentError) {
            console.log(`   ${index + 1}. ${type} "${component}": ❌ Error: ${componentError.message}`);
        }
    });
}

/**
 * Main demonstration function
 * Runs all troubleshooting examples
 */
async function runTroubleshootingExamples(): Promise<void> {
    console.log('🚀 WASM Object Classes - Troubleshooting Examples\n');
    console.log('Comprehensive error handling and troubleshooting patterns\n');
    
    try {
        // Initialize WebAssembly module
        console.log('🔄 Initializing WebAssembly module...');
        const module = await wasmLoader.loadModule();
        await wasmLoader.initializeDatabase();
        console.log('✅ WebAssembly module initialized\n');
        
        // Run all troubleshooting demonstrations
        await demonstrateInputValidation(module);
        await demonstrateRouteConstructionErrors(module);
        await demonstrateWebAssemblyIssues(module);
        await demonstratePerformanceTroubleshooting(module);
        
        console.log('🎉 All troubleshooting demonstrations completed!');
        console.log('\n🛠️  Key Troubleshooting Strategies:');
        console.log('   • Always validate inputs before processing');
        console.log('   • Implement proper error handling with meaningful messages');
        console.log('   • Monitor memory usage and performance metrics');
        console.log('   • Provide suggestions and alternatives for failed operations');
        console.log('   • Use defensive programming practices for WebAssembly interactions');
        console.log('\n📚 Next steps:');
        console.log('   • See framework-integration.ts for React/Vue error handling');
        console.log('   • See performance-optimization.ts for advanced optimization techniques');
        console.log('   • Review logs and implement monitoring in production systems');
        
        // Cleanup
        module.closeDatabase();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error running troubleshooting examples:', error);
        console.error('\n🚨 Recovery Strategies:');
        console.error('   • Check WebAssembly module build and file accessibility');
        console.error('   • Verify database file exists and is readable');
        console.error('   • Restart application to clear any corrupted state');
        console.error('   • Check system memory and resources');
        process.exit(1);
    }
}

// Execute demonstrations if run directly
if (require.main === module) {
    runTroubleshootingExamples().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

// Export for use in other examples
export {
    demonstrateInputValidation,
    demonstrateRouteConstructionErrors,
    demonstrateWebAssemblyIssues,
    demonstratePerformanceTroubleshooting,
    runTroubleshootingExamples
};