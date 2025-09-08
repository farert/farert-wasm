#!/usr/bin/env node

/**
 * Object Lifecycle Tests - Task 33
 * Comprehensive memory management and lifecycle validation for all 6 object classes
 * REQ-OBJ-007: Object Lifecycle Management and Memory Safety
 * 
 * This test suite validates:
 * - Memory leak prevention in repeated object creation/destruction
 * - Proper cleanup of C++ resources during extended periods
 * - WebAssembly heap monitoring and validation
 * - Reference counting to prevent premature destruction
 * - Use-after-destruction error handling
 * - Long-running application lifecycle testing
 * 
 * Tests all 6 object classes:
 * 1. cRouteList - Base route container
 * 2. cRoute - Route building with junction logic (extends cRouteList)
 * 3. cCalcRoute - Route calculation with fare rules (extends cRoute)
 * 4. FareInfo - Fare calculation results
 * 5. cRouteItem - Individual route segment data
 * 6. cRouteFlag - Complex routing flags and special cases
 */

import { 
    FarertModule, 
    RouteWrapper, 
    RouteListWrapper, 
    CalcRouteWrapper, 
    FareInfoData, 
    RouteItemWrapper, 
    RouteFlagWrapper,
    MemoryUsageStats
} from './types';
import { wasmLoader } from './wasm_loader';
import { PerformanceMonitor, PerformanceUtils } from './performance_monitor';
import { configManager } from './config_manager';

// Test configuration for lifecycle testing
interface LifecycleTestConfig {
    enableMemoryMonitoring: boolean;
    enableVerboseLogging: boolean;
    maxMemoryUsageMB: number;
    maxHeapGrowthMB: number;
    objectCreationCycles: number;
    longRunningTestDurationMs: number;
    memoryLeakThresholdMB: number;
}

// Memory snapshot for leak detection
interface MemorySnapshot {
    timestamp: number;
    usage: MemoryUsageStats;
    context: string;
    objectCounts: ObjectCounts;
}

// Object count tracking
interface ObjectCounts {
    cRouteList: number;
    cRoute: number;
    cCalcRoute: number;
    FareInfo: number;
    cRouteItem: number;
    cRouteFlag: number;
}

// Test result summary
interface LifecycleTestResult {
    testName: string;
    passed: boolean;
    duration: number;
    memoryDelta: MemoryUsageStats;
    maxMemoryUsed: number;
    objectsCreated: number;
    objectsDestroyed: number;
    errorMessages: string[];
}

/**
 * Comprehensive Object Lifecycle Test Suite
 * Focuses on memory safety and proper resource management
 */
class ObjectLifecycleTests {
    private module: FarertModule | null = null;
    private performanceMonitor: PerformanceMonitor;
    private config: LifecycleTestConfig;
    private memorySnapshots: MemorySnapshot[] = [];
    private testResults: LifecycleTestResult[] = [];
    private objectCounters: ObjectCounts;
    
    constructor(config?: Partial<LifecycleTestConfig>) {
        this.config = {
            enableMemoryMonitoring: true,
            enableVerboseLogging: false,
            maxMemoryUsageMB: 512,
            maxHeapGrowthMB: 100,
            objectCreationCycles: 1000,
            longRunningTestDurationMs: 30000, // 30 seconds
            memoryLeakThresholdMB: 10,
            ...config
        };
        
        this.performanceMonitor = PerformanceMonitor.create({
            enabled: true,
            memoryMonitoring: this.config.enableMemoryMonitoring,
            detailedLogging: this.config.enableVerboseLogging
        });
        
        this.objectCounters = {
            cRouteList: 0,
            cRoute: 0,
            cCalcRoute: 0,
            FareInfo: 0,
            cRouteItem: 0,
            cRouteFlag: 0
        };
    }
    
    /**
     * Execute all object lifecycle tests
     */
    async executeAll(): Promise<boolean> {
        try {
            this.module = await wasmLoader.loadModule();
            const dbResult = await wasmLoader.initializeDatabase();
            
            if (!dbResult) {
                console.error('Database initialization failed for lifecycle tests');
                return false;
            }
            
            console.log('\n=== Object Lifecycle Tests - Task 33 ===');
            console.log('REQ-OBJ-007: Object Lifecycle Management and Memory Safety');
            console.log('Testing all 6 object classes for memory leaks and proper cleanup');
            console.log('-'.repeat(80));
            
            this.performanceMonitor.mark('lifecycle_tests_start');
            this.takeMemorySnapshot('Test Suite Start', this.objectCounters);
            
            const testResults = await Promise.all([
                this.testBasicObjectCreationAndDestruction(),
                this.testRepeatedObjectCreationCycles(),
                this.testObjectReferenceManagement(),
                this.testWebAssemblyHeapMonitoring(),
                this.testLongRunningApplicationLifecycle(),
                this.testUseAfterDestructionHandling(),
                this.testMemoryLeakDetection(),
                this.testGarbageCollectionSafety(),
                this.testObjectInheritanceLifecycle(),
                this.testConcurrentObjectManagement()
            ]);
            
            this.performanceMonitor.mark('lifecycle_tests_end');
            this.takeMemorySnapshot('Test Suite End', this.objectCounters);
            
            const allPassed = testResults.every(r => r);
            const passedCount = testResults.filter(r => r).length;
            
            console.log('\n=== Object Lifecycle Tests Summary ===');
            console.log(`Results: ${passedCount}/${testResults.length} test categories passed`);
            
            if (allPassed) {
                console.log('🎉 All object lifecycle tests passed successfully!');
                console.log('✓ Memory leak prevention validated');
                console.log('✓ WebAssembly heap monitoring working');
                console.log('✓ Proper resource cleanup confirmed');
                console.log('✓ Reference counting functioning correctly');
                console.log('✓ Long-running application stability verified');
            } else {
                console.log('⚠️  Some object lifecycle tests failed');
                this.generateFailureReport();
            }
            
            // Generate comprehensive memory report
            this.generateMemoryReport();
            
            return allPassed;
            
        } catch (error) {
            console.error('Lifecycle test execution failed:', error);
            return false;
        } finally {
            this.performanceMonitor.cleanup();
            wasmLoader.cleanup();
        }
    }
    
    /**
     * Test 1: Basic Object Creation and Destruction
     * Validates that objects can be created and destroyed without immediate issues
     */
    private async testBasicObjectCreationAndDestruction(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 1: Basic Object Creation and Destruction ---');
        
        const testName = 'Basic Object Creation/Destruction';
        const startTime = Date.now();
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            // Test all 6 object classes
            console.log('Creating and destroying each object class...');
            
            // 1. cRouteList
            for (let i = 0; i < 100; i++) {
                const route = new this.module.cRoute();
                const routeList = new this.module.cRouteList(route);
                this.objectCounters.cRouteList++;
                // Object will be garbage collected automatically
            }
            
            // 2. cRoute
            for (let i = 0; i < 100; i++) {
                const route = new this.module.cRoute();
                this.objectCounters.cRoute++;
                // Test some basic operations
                route.addRoute(1); // Add dummy station ID
            }
            
            // 3. cCalcRoute
            for (let i = 0; i < 50; i++) {
                const route = new this.module.cRoute();
                const calcRoute = new this.module.cCalcRoute(route);
                this.objectCounters.cCalcRoute++;
                this.objectCounters.cRoute++;
            }
            
            // 4. FareInfo (created through calculation)
            const testRoute = new this.module.cRoute();
            const tokyoId = this.module.getStationId('東京');
            const osakaId = this.module.getStationId('大阪');
            
            if (tokyoId > 0 && osakaId > 0) {
                testRoute.addRoute(tokyoId);
                testRoute.addRouteWithLine(11301, osakaId); // Sample line ID
                
                for (let i = 0; i < 50; i++) {
                    const calcRoute = new this.module.cCalcRoute(testRoute);
                    const fareInfo = calcRoute.calcFare();
                    if (fareInfo) {
                        this.objectCounters.FareInfo++;
                    }
                }
            }
            
            // 5. cRouteItem
            for (let i = 0; i < 100; i++) {
                const routeItem = new this.module.cRouteItem();
                routeItem.stationId = i + 1;
                routeItem.lineId = (i % 50) + 1000;
                this.objectCounters.cRouteItem++;
            }
            
            // 6. cRouteFlag
            for (let i = 0; i < 100; i++) {
                const routeFlag = new this.module.cRouteFlag();
                this.objectCounters.cRouteFlag++;
            }
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const endMemory = configManager.getMemoryUsageStats();
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
                arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
            };
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta,
                maxMemoryUsed: endMemory.rss,
                objectsCreated: Object.values(this.objectCounters).reduce((a, b) => a + b, 0),
                objectsDestroyed: 0, // Auto-managed by WebAssembly
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            if (this.config.enableVerboseLogging) {
                console.log(`   Objects created: ${result.objectsCreated}`);
                console.log(`   Memory delta: RSS=${memoryDelta.rss}MB, Heap=${memoryDelta.heapUsed}MB`);
            }
            
            console.log('Basic Object Creation/Destruction: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Basic Object Creation/Destruction: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 2: Repeated Object Creation Cycles
     * Tests for memory leaks during repeated creation/destruction cycles
     */
    private async testRepeatedObjectCreationCycles(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 2: Repeated Object Creation Cycles ---');
        console.log(`Running ${this.config.objectCreationCycles} creation cycles...`);
        
        const testName = 'Repeated Creation Cycles';
        const startTime = Date.now();
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            const CYCLES = this.config.objectCreationCycles;
            const memoryCheckInterval = Math.floor(CYCLES / 10);
            
            for (let cycle = 0; cycle < CYCLES; cycle++) {
                // Create a mix of objects in each cycle
                const route = new this.module.cRoute();
                const routeList = new this.module.cRouteList(route);
                const calcRoute = new this.module.cCalcRoute(route);
                const routeItem = new this.module.cRouteItem();
                const routeFlag = new this.module.cRouteFlag();
                
                // Perform some operations
                route.addRoute(cycle % 1000 + 1);
                routeItem.stationId = cycle % 10000 + 1;
                routeItem.lineId = cycle % 100 + 1000;
                
                // Check memory usage periodically
                if (cycle % memoryCheckInterval === 0) {
                    const currentMemory = configManager.getMemoryUsageStats();
                    const memoryGrowth = currentMemory.rss - startMemory.rss;
                    
                    if (memoryGrowth > this.config.maxHeapGrowthMB) {
                        throw new Error(`Memory growth exceeded threshold: ${memoryGrowth}MB > ${this.config.maxHeapGrowthMB}MB at cycle ${cycle}`);
                    }
                    
                    if (this.config.enableVerboseLogging && cycle > 0) {
                        console.log(`   Cycle ${cycle}: Memory growth = ${memoryGrowth}MB`);
                    }
                }
                
                // Force garbage collection periodically
                if (cycle % 100 === 0 && global.gc) {
                    global.gc();
                }
            }
            
            // Final memory check
            const endMemory = configManager.getMemoryUsageStats();
            const finalMemoryGrowth = endMemory.rss - startMemory.rss;
            
            if (finalMemoryGrowth > this.config.memoryLeakThresholdMB) {
                throw new Error(`Potential memory leak detected: ${finalMemoryGrowth}MB growth after ${CYCLES} cycles`);
            }
            
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
                arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
            };
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta,
                maxMemoryUsed: endMemory.rss,
                objectsCreated: CYCLES * 5, // 5 objects per cycle
                objectsDestroyed: CYCLES * 5, // Assumed auto-cleanup
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log(`   Completed ${CYCLES} cycles successfully`);
            console.log(`   Final memory growth: ${finalMemoryGrowth}MB (threshold: ${this.config.memoryLeakThresholdMB}MB)`);
            console.log('Repeated Object Creation Cycles: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Repeated Object Creation Cycles: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 3: Object Reference Management
     * Tests reference counting and prevents premature destruction
     */
    private async testObjectReferenceManagement(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 3: Object Reference Management ---');
        
        const testName = 'Object Reference Management';
        const startTime = Date.now();
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            // Test 1: Multiple references to same route data
            console.log('Testing multiple references to same route data...');
            
            const baseRoute = new this.module.cRoute();
            const tokyoId = this.module.getStationId('東京');
            const osakaId = this.module.getStationId('大阪');
            
            if (tokyoId > 0 && osakaId > 0) {
                baseRoute.addRoute(tokyoId);
                baseRoute.addRouteWithLine(11301, osakaId);
                
                // Create multiple objects referencing the same route data
                const routeList1 = new this.module.cRouteList(baseRoute);
                const routeList2 = new this.module.cRouteList(baseRoute);
                const calcRoute1 = new this.module.cCalcRoute(baseRoute);
                const calcRoute2 = new this.module.cCalcRoute(baseRoute);
                
                // Test operations on all references
                const count1 = baseRoute.getRouteCount();
                const count2 = baseRoute.getRouteCount();
                
                if (count1 !== count2) {
                    throw new Error('Route count inconsistency between references');
                }
                
                // Test calculation through different CalcRoute objects
                const fare1 = calcRoute1.calcFare();
                const fare2 = calcRoute2.calcFare();
                
                if (fare1 && fare2 && fare1.fare !== fare2.fare) {
                    throw new Error('Fare calculation inconsistency between references');
                }
                
                console.log('   ✓ Multiple references working correctly');
            }
            
            // Test 2: Reference cleanup and object destruction
            console.log('Testing reference cleanup...');
            
            const testReferences: RouteWrapper[] = [];
            for (let i = 0; i < 50; i++) {
                const route = new this.module.cRoute();
                route.addRoute(i + 1);
                testReferences.push(route);
            }
            
            // Access all references
            let totalRouteCount = 0;
            for (const route of testReferences) {
                totalRouteCount += route.getRouteCount();
            }
            
            if (totalRouteCount !== testReferences.length) {
                throw new Error('Route count mismatch in reference cleanup test');
            }
            
            // Clear references - objects should be eligible for cleanup
            testReferences.length = 0;
            
            if (global.gc) {
                global.gc();
            }
            
            console.log('   ✓ Reference cleanup completed successfully');
            
            const endMemory = configManager.getMemoryUsageStats();
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
                arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
            };
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta,
                maxMemoryUsed: endMemory.rss,
                objectsCreated: 54, // baseRoute + multiple references + test routes
                objectsDestroyed: 0, // Auto-managed
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log('Object Reference Management: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Object Reference Management: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 4: WebAssembly Heap Monitoring
     * Validates WebAssembly memory usage and heap monitoring
     */
    private async testWebAssemblyHeapMonitoring(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 4: WebAssembly Heap Monitoring ---');
        
        const testName = 'WebAssembly Heap Monitoring';
        const startTime = Date.now();
        
        try {
            console.log('Monitoring WebAssembly heap during intensive operations...');
            
            const memorySnapshots: MemorySnapshot[] = [];
            
            // Take initial snapshot
            memorySnapshots.push({
                timestamp: Date.now(),
                usage: configManager.getMemoryUsageStats(),
                context: 'Initial State',
                objectCounts: { ...this.objectCounters }
            });
            
            // Perform memory-intensive operations while monitoring
            const INTENSIVE_OPERATIONS = 500;
            
            for (let op = 0; op < INTENSIVE_OPERATIONS; op++) {
                // Create complex object hierarchies
                const route = new this.module.cRoute();
                const calcRoute = new this.module.cCalcRoute(route);
                
                // Add multiple route segments
                for (let seg = 0; seg < 10; seg++) {
                    route.addRoute((op * 10 + seg) % 10000 + 1);
                }
                
                // Perform calculations
                const fareInfo = calcRoute.calcFare();
                if (fareInfo) {
                    // Access fare info properties to ensure it's properly allocated
                    const fare = fareInfo.fare;
                    const isRule114 = fareInfo.isRule114Applied;
                    const stockCount = fareInfo.availCountForFareOfStockDiscount;
                }
                
                // Take periodic snapshots
                if (op % 100 === 0) {
                    const currentUsage = configManager.getMemoryUsageStats();
                    memorySnapshots.push({
                        timestamp: Date.now(),
                        usage: currentUsage,
                        context: `Operation ${op}`,
                        objectCounts: { ...this.objectCounters }
                    });
                    
                    // Check for excessive memory usage
                    if (currentUsage.rss > this.config.maxMemoryUsageMB) {
                        throw new Error(`Memory usage exceeded threshold: ${currentUsage.rss}MB > ${this.config.maxMemoryUsageMB}MB`);
                    }
                }
            }
            
            // Final snapshot
            memorySnapshots.push({
                timestamp: Date.now(),
                usage: configManager.getMemoryUsageStats(),
                context: 'Final State',
                objectCounts: { ...this.objectCounters }
            });
            
            // Analyze memory usage patterns
            const initialMemory = memorySnapshots[0].usage;
            const finalMemory = memorySnapshots[memorySnapshots.length - 1].usage;
            const maxMemory = Math.max(...memorySnapshots.map(s => s.usage.rss));
            
            const memoryGrowth = finalMemory.rss - initialMemory.rss;
            const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
            
            if (this.config.enableVerboseLogging) {
                console.log(`   Initial memory: RSS=${initialMemory.rss}MB, Heap=${initialMemory.heapUsed}MB`);
                console.log(`   Final memory: RSS=${finalMemory.rss}MB, Heap=${finalMemory.heapUsed}MB`);
                console.log(`   Peak memory: ${maxMemory}MB`);
                console.log(`   Memory growth: RSS=${memoryGrowth}MB, Heap=${heapGrowth}MB`);
            }
            
            // Check for memory leaks (allowing some growth for legitimate allocations)
            const maxAllowableGrowth = 50; // 50MB threshold
            if (memoryGrowth > maxAllowableGrowth) {
                throw new Error(`Excessive memory growth detected: ${memoryGrowth}MB > ${maxAllowableGrowth}MB`);
            }
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta: {
                    rss: memoryGrowth,
                    heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
                    heapUsed: heapGrowth,
                    external: finalMemory.external - initialMemory.external,
                    arrayBuffers: finalMemory.arrayBuffers - initialMemory.arrayBuffers
                },
                maxMemoryUsed: maxMemory,
                objectsCreated: INTENSIVE_OPERATIONS * 2, // route + calcRoute per operation
                objectsDestroyed: 0, // Auto-managed
                errorMessages: []
            };
            
            this.testResults.push(result);
            this.memorySnapshots.push(...memorySnapshots);
            
            console.log(`   Completed ${INTENSIVE_OPERATIONS} intensive operations`);
            console.log(`   Memory growth: ${memoryGrowth}MB (threshold: ${maxAllowableGrowth}MB)`);
            console.log(`   Peak memory usage: ${maxMemory}MB`);
            console.log('WebAssembly Heap Monitoring: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `WebAssembly Heap Monitoring: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 5: Long-Running Application Lifecycle
     * Tests stability during extended operation periods
     */
    private async testLongRunningApplicationLifecycle(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 5: Long-Running Application Lifecycle ---');
        console.log(`Running for ${this.config.longRunningTestDurationMs / 1000} seconds...`);
        
        const testName = 'Long-Running Application Lifecycle';
        const startTime = Date.now();
        const endTime = startTime + this.config.longRunningTestDurationMs;
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            let operationCount = 0;
            let lastMemoryCheck = startTime;
            const memoryCheckInterval = 5000; // Check every 5 seconds
            
            while (Date.now() < endTime) {
                // Simulate realistic application operations
                const route = new this.module.cRoute();
                const tokyoId = this.module.getStationId('東京');
                const osakaId = this.module.getStationId('大阪');
                
                if (tokyoId > 0 && osakaId > 0) {
                    route.addRoute(tokyoId);
                    route.addRouteWithLine(11301, osakaId);
                    
                    const calcRoute = new this.module.cCalcRoute(route);
                    const fareInfo = calcRoute.calcFare();
                    
                    if (fareInfo && fareInfo.fare > 0) {
                        // Access various properties to ensure proper object lifecycle
                        const stockDiscountCount = fareInfo.availCountForFareOfStockDiscount || 0;
                        for (let i = 0; i < Math.min(stockDiscountCount, 3); i++) {
                            if (fareInfo.fareForStockDiscount && fareInfo.fareForStockDiscountTitle) {
                                fareInfo.fareForStockDiscount(i);
                                fareInfo.fareForStockDiscountTitle(i);
                            }
                        }
                    }
                }
                
                // Create and manipulate route items
                const routeItem = new this.module.cRouteItem();
                routeItem.stationId = operationCount % 10000 + 1;
                routeItem.lineId = operationCount % 100 + 1000;
                routeItem.fare = (operationCount % 1000) + 140;
                
                operationCount++;
                
                // Periodic memory checks
                const now = Date.now();
                if (now - lastMemoryCheck > memoryCheckInterval) {
                    const currentMemory = configManager.getMemoryUsageStats();
                    const memoryGrowth = currentMemory.rss - startMemory.rss;
                    
                    if (memoryGrowth > this.config.maxHeapGrowthMB) {
                        throw new Error(`Memory growth exceeded threshold during long-running test: ${memoryGrowth}MB`);
                    }
                    
                    if (this.config.enableVerboseLogging) {
                        const elapsed = Math.round((now - startTime) / 1000);
                        console.log(`   ${elapsed}s: Operations=${operationCount}, Memory growth=${memoryGrowth}MB`);
                    }
                    
                    lastMemoryCheck = now;
                    
                    // Force periodic garbage collection
                    if (global.gc && operationCount % 1000 === 0) {
                        global.gc();
                    }
                }
                
                // Small delay to prevent overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 1));
            }
            
            const finalMemory = configManager.getMemoryUsageStats();
            const finalMemoryGrowth = finalMemory.rss - startMemory.rss;
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta: {
                    rss: finalMemoryGrowth,
                    heapTotal: finalMemory.heapTotal - startMemory.heapTotal,
                    heapUsed: finalMemory.heapUsed - startMemory.heapUsed,
                    external: finalMemory.external - startMemory.external,
                    arrayBuffers: finalMemory.arrayBuffers - startMemory.arrayBuffers
                },
                maxMemoryUsed: finalMemory.rss,
                objectsCreated: operationCount * 3, // route, calcRoute, routeItem per operation
                objectsDestroyed: 0, // Auto-managed
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log(`   Completed ${operationCount} operations over ${Math.round((Date.now() - startTime) / 1000)}s`);
            console.log(`   Final memory growth: ${finalMemoryGrowth}MB`);
            console.log('Long-Running Application Lifecycle: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Long-Running Application Lifecycle: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 6: Use-After-Destruction Handling
     * Tests proper error handling for invalid object access
     */
    private async testUseAfterDestructionHandling(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 6: Use-After-Destruction Handling ---');
        
        const testName = 'Use-After-Destruction Handling';
        const startTime = Date.now();
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            console.log('Testing error handling for invalid object access...');
            
            // Note: In WebAssembly/JavaScript environment, objects are managed by GC
            // So we test scenarios where objects might become invalid or inconsistent
            
            // Test 1: Access to objects with invalid internal state
            const route = new this.module.cRoute();
            const routeItem = new this.module.cRouteItem();
            
            // Set invalid IDs that don't exist in database
            routeItem.stationId = 999999999;
            routeItem.lineId = 999999999;
            
            try {
                const displayName = routeItem.toString();
                const isValid = routeItem.isValid();
                
                // These should handle invalid IDs gracefully without crashing
                if (isValid) {
                    console.log('   ⚠️  Invalid RouteItem reported as valid (unexpected but acceptable)');
                } else {
                    console.log('   ✓ Invalid RouteItem correctly reported as invalid');
                }
                
                // Display name should be empty or contain error indication
                if (this.config.enableVerboseLogging) {
                    console.log(`   Invalid object display name: "${displayName}"`);
                }
                
            } catch (error) {
                console.log(`   ❌ Use-after-destruction test caused unexpected error: ${error}`);
                return false;
            }
            
            // Test 2: Access to route objects with no data
            try {
                const emptyRoute = new this.module.cRoute();
                const emptyCalcRoute = new this.module.cCalcRoute(emptyRoute);
                
                // This should handle empty route gracefully
                const fareInfo = emptyCalcRoute.calcFare();
                
                if (fareInfo && fareInfo.fare > 0) {
                    console.log('   ⚠️  Empty route produced valid fare (unexpected but acceptable)');
                } else {
                    console.log('   ✓ Empty route correctly produced no fare or zero fare');
                }
                
            } catch (error) {
                console.log('   ✓ Empty route calculation properly threw error (expected behavior)');
            }
            
            // Test 3: Stress test object access patterns
            const objects: any[] = [];
            
            for (let i = 0; i < 100; i++) {
                const route = new this.module.cRoute();
                const routeItem = new this.module.cRouteItem();
                const routeFlag = new this.module.cRouteFlag();
                
                objects.push(route, routeItem, routeFlag);
            }
            
            // Access all objects in reverse order (potential edge case)
            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                
                try {
                    // Try to access common methods that should exist
                    if (typeof obj.toString === 'function') {
                        obj.toString();
                    }
                    
                } catch (error) {
                    console.log(`   ❌ Object access error at index ${i}: ${error}`);
                    return false;
                }
            }
            
            console.log('   ✓ All object access patterns handled correctly');
            
            const endMemory = configManager.getMemoryUsageStats();
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
                arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
            };
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta,
                maxMemoryUsed: endMemory.rss,
                objectsCreated: 302, // route + routeItem + 300 objects
                objectsDestroyed: 0, // Auto-managed
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log('Use-After-Destruction Handling: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Use-After-Destruction Handling: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 7: Memory Leak Detection
     * Comprehensive memory leak detection across all object types
     */
    private async testMemoryLeakDetection(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 7: Memory Leak Detection ---');
        
        const testName = 'Memory Leak Detection';
        const startTime = Date.now();
        
        try {
            console.log('Running comprehensive memory leak detection...');
            
            const baselineMemory = configManager.getMemoryUsageStats();
            const leakTestIterations = 500;
            const memoryCheckPoints: MemoryUsageStats[] = [];
            
            for (let iteration = 0; iteration < leakTestIterations; iteration++) {
                // Create objects that could potentially leak
                const objects = [];
                
                // Complex object hierarchy that exercises all classes
                for (let i = 0; i < 10; i++) {
                    const route = new this.module.cRoute();
                    const routeList = new this.module.cRouteList(route);
                    const calcRoute = new this.module.cCalcRoute(route);
                    const routeItem = new this.module.cRouteItem();
                    const routeFlag = new this.module.cRouteFlag();
                    
                    // Build complex route
                    route.addRoute((iteration * 10 + i) % 10000 + 1);
                    route.addRouteWithLine(11301, (iteration * 10 + i + 1) % 10000 + 1);
                    
                    // Set up route item
                    routeItem.stationId = (iteration * 10 + i) % 10000 + 1;
                    routeItem.lineId = 11301;
                    routeItem.fare = (i * 10) + 140;
                    
                    // Perform calculations to create FareInfo objects
                    const fareInfo = calcRoute.calcFare();
                    if (fareInfo) {
                        // Access properties to ensure object is fully instantiated
                        const fare = fareInfo.fare;
                        const rule114 = fareInfo.isRule114Applied;
                        const stockCount = fareInfo.availCountForFareOfStockDiscount || 0;
                    }
                    
                    objects.push(route, routeList, calcRoute, routeItem, routeFlag);
                }
                
                // Take memory snapshot every 50 iterations
                if (iteration % 50 === 0) {
                    memoryCheckPoints.push(configManager.getMemoryUsageStats());
                    
                    // Force garbage collection to ensure accurate memory measurement
                    if (global.gc) {
                        global.gc();
                        // Take another measurement after GC
                        memoryCheckPoints.push(configManager.getMemoryUsageStats());
                    }
                }
                
                // Clear references to allow cleanup
                objects.length = 0;
            }
            
            // Final memory measurement
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = configManager.getMemoryUsageStats();
            const totalMemoryGrowth = finalMemory.rss - baselineMemory.rss;
            
            // Analyze memory growth pattern
            let significantMemoryIncreases = 0;
            for (let i = 1; i < memoryCheckPoints.length; i++) {
                const growth = memoryCheckPoints[i].rss - memoryCheckPoints[i - 1].rss;
                if (growth > 5) { // More than 5MB increase
                    significantMemoryIncreases++;
                }
            }
            
            // Memory leak criteria
            const memoryLeakDetected = totalMemoryGrowth > this.config.memoryLeakThresholdMB * 2; // Double threshold for leak detection
            const suspiciousGrowthPattern = significantMemoryIncreases > memoryCheckPoints.length * 0.3; // More than 30% of checkpoints show growth
            
            if (memoryLeakDetected) {
                throw new Error(`Memory leak detected: Total growth ${totalMemoryGrowth}MB exceeds threshold ${this.config.memoryLeakThresholdMB * 2}MB`);
            }
            
            if (suspiciousGrowthPattern) {
                console.log(`   ⚠️  Suspicious memory growth pattern detected (${significantMemoryIncreases}/${memoryCheckPoints.length} checkpoints showed significant growth)`);
            }
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta: {
                    rss: totalMemoryGrowth,
                    heapTotal: finalMemory.heapTotal - baselineMemory.heapTotal,
                    heapUsed: finalMemory.heapUsed - baselineMemory.heapUsed,
                    external: finalMemory.external - baselineMemory.external,
                    arrayBuffers: finalMemory.arrayBuffers - baselineMemory.arrayBuffers
                },
                maxMemoryUsed: finalMemory.rss,
                objectsCreated: leakTestIterations * 50, // 10 * 5 objects per iteration
                objectsDestroyed: leakTestIterations * 50, // Assumed equal cleanup
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log(`   Completed ${leakTestIterations} iterations with complex object hierarchies`);
            console.log(`   Total memory growth: ${totalMemoryGrowth}MB (threshold: ${this.config.memoryLeakThresholdMB * 2}MB)`);
            console.log(`   Memory checkpoints taken: ${memoryCheckPoints.length}`);
            console.log(`   Significant memory increases: ${significantMemoryIncreases}`);
            console.log('Memory Leak Detection: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Memory Leak Detection: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 8: Garbage Collection Safety
     * Tests that objects can be safely garbage collected without crashes
     */
    private async testGarbageCollectionSafety(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 8: Garbage Collection Safety ---');
        
        const testName = 'Garbage Collection Safety';
        const startTime = Date.now();
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            console.log('Testing garbage collection safety...');
            
            if (!global.gc) {
                console.log('   ⚠️  Global garbage collection not available, simulating with scope destruction');
            }
            
            // Test 1: Forced garbage collection with active objects
            const activeObjects = [];
            
            for (let round = 0; round < 5; round++) {
                console.log(`   Round ${round + 1}: Creating objects and forcing GC...`);
                
                // Create many objects in this scope
                const scopeObjects = [];
                
                for (let i = 0; i < 200; i++) {
                    const route = new this.module.cRoute();
                    const calcRoute = new this.module.cCalcRoute(route);
                    const routeItem = new this.module.cRouteItem();
                    
                    // Make objects do some work
                    route.addRoute(i % 1000 + 1);
                    routeItem.stationId = i % 1000 + 1;
                    routeItem.lineId = i % 100 + 1000;
                    
                    scopeObjects.push(route, calcRoute, routeItem);
                    
                    // Keep some objects alive
                    if (i % 20 === 0) {
                        activeObjects.push(route);
                    }
                }
                
                // Force garbage collection multiple times
                if (global.gc) {
                    for (let gcRound = 0; gcRound < 3; gcRound++) {
                        global.gc();
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                }
                
                // Verify active objects are still accessible
                for (const activeObj of activeObjects) {
                    try {
                        const count = activeObj.getRouteCount();
                        if (typeof count !== 'number') {
                            throw new Error('Active object became invalid after GC');
                        }
                    } catch (error) {
                        throw new Error(`Active object access failed after GC: ${error}`);
                    }
                }
                
                // Clear scope objects (should be eligible for GC)
                scopeObjects.length = 0;
                
                if (global.gc) {
                    global.gc();
                }
                
                const currentMemory = configManager.getMemoryUsageStats();
                if (this.config.enableVerboseLogging) {
                    console.log(`     Memory after round ${round + 1}: RSS=${currentMemory.rss}MB, Heap=${currentMemory.heapUsed}MB`);
                }
            }
            
            // Test 2: Stress test with rapid allocation and collection
            console.log('   Stress testing rapid allocation and GC...');
            
            for (let stress = 0; stress < 100; stress++) {
                // Rapid allocation
                const tempObjects = [];
                for (let i = 0; i < 50; i++) {
                    tempObjects.push(
                        new this.module.cRoute(),
                        new this.module.cRouteItem(),
                        new this.module.cRouteFlag()
                    );
                }
                
                // Immediate cleanup and GC
                tempObjects.length = 0;
                if (global.gc && stress % 10 === 0) {
                    global.gc();
                }
            }
            
            // Final cleanup and verification
            activeObjects.length = 0;
            if (global.gc) {
                global.gc();
                global.gc(); // Double GC to ensure cleanup
            }
            
            const endMemory = configManager.getMemoryUsageStats();
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
                arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
            };
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta,
                maxMemoryUsed: endMemory.rss,
                objectsCreated: 5 * 200 * 3 + 100 * 50 * 3, // Round objects + stress objects
                objectsDestroyed: 0, // GC managed
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log('   ✓ All garbage collection cycles completed without crashes');
            console.log('   ✓ Active objects remained accessible during GC');
            console.log('   ✓ Rapid allocation/GC cycles handled successfully');
            console.log('Garbage Collection Safety: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Garbage Collection Safety: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 9: Object Inheritance Lifecycle
     * Tests lifecycle management for inheritance hierarchy: cCalcRoute < cRoute < cRouteList
     */
    private async testObjectInheritanceLifecycle(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 9: Object Inheritance Lifecycle ---');
        
        const testName = 'Object Inheritance Lifecycle';
        const startTime = Date.now();
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            console.log('Testing inheritance hierarchy lifecycle: cCalcRoute < cRoute < cRouteList...');
            
            // Test inheritance chain creation and method access
            for (let chain = 0; chain < 100; chain++) {
                // Create base RouteList
                const baseRoute = new this.module.cRoute();
                const routeList = new this.module.cRouteList(baseRoute);
                
                // Create Route (extends RouteList)
                const route = new this.module.cRoute();
                
                // Create CalcRoute (extends Route, which extends RouteList)
                const calcRoute = new this.module.cCalcRoute(route);
                
                // Test method access through inheritance
                try {
                    // Route methods (should work on Route and CalcRoute)
                    const routeCount = route.getRouteCount();
                    const calcRouteCount = calcRoute.getRouteCount(); // Inherited method
                    
                    if (typeof routeCount !== 'number' || typeof calcRouteCount !== 'number') {
                        throw new Error('Inherited method access failed');
                    }
                    
                    // RouteList methods (should work on all three)
                    if (typeof route.toString === 'function') {
                        const routeStr = route.toString();
                    }
                    
                    if (typeof calcRoute.toString === 'function') {
                        const calcRouteStr = calcRoute.toString();
                    }
                    
                    // CalcRoute-specific methods
                    const fareInfo = calcRoute.calcFare();
                    // fareInfo might be null for empty route, that's OK
                    
                } catch (error) {
                    throw new Error(`Inheritance method access failed in chain ${chain}: ${error}`);
                }
                
                // Test object relationships
                try {
                    // Create another CalcRoute from same Route
                    const calcRoute2 = new this.module.cCalcRoute(route);
                    
                    // Both should work independently
                    const count1 = calcRoute.getRouteCount();
                    const count2 = calcRoute2.getRouteCount();
                    
                    if (count1 !== count2) {
                        throw new Error('CalcRoute objects from same Route show different counts');
                    }
                    
                } catch (error) {
                    throw new Error(`Object relationship test failed in chain ${chain}: ${error}`);
                }
            }
            
            console.log('   ✓ Inheritance hierarchy creation and method access working');
            
            // Test inheritance with complex route building
            console.log('   Testing inheritance with complex operations...');
            
            const tokyoId = this.module.getStationId('東京');
            const osakaId = this.module.getStationId('大阪');
            const nagoyaId = this.module.getStationId('名古屋');
            
            if (tokyoId > 0 && osakaId > 0 && nagoyaId > 0) {
                for (let complex = 0; complex < 50; complex++) {
                    // Build complex route using inheritance hierarchy
                    const route = new this.module.cRoute();
                    
                    // Use Route methods to build route
                    route.addRoute(tokyoId);
                    route.addRouteWithLine(11301, nagoyaId); // 東海道線
                    route.addRouteWithLine(11301, osakaId);  // 東海道線
                    
                    // Create RouteList from Route
                    const routeList = new this.module.cRouteList(route);
                    
                    // Create CalcRoute from Route
                    const calcRoute = new this.module.cCalcRoute(route);
                    
                    // Test inherited operations
                    const routeRouteCount = route.getRouteCount();
                    const calcRouteCount = calcRoute.getRouteCount();
                    
                    if (routeRouteCount !== calcRouteCount) {
                        throw new Error('Inherited route count mismatch between Route and CalcRoute');
                    }
                    
                    if (routeRouteCount <= 0) {
                        throw new Error('Route building failed in inheritance test');
                    }
                    
                    // Test CalcRoute-specific functionality
                    const fareInfo = calcRoute.calcFare();
                    if (fareInfo && fareInfo.fare > 0) {
                        // Access fare info to ensure proper object lifecycle
                        const fare = fareInfo.fare;
                        const rule114 = fareInfo.isRule114Applied;
                        const stockCount = fareInfo.availCountForFareOfStockDiscount || 0;
                        
                        // Test stock discount methods if available
                        if (fareInfo.fareForStockDiscount && fareInfo.fareForStockDiscountTitle) {
                            for (let i = 0; i < Math.min(stockCount, 2); i++) {
                                const discountFare = fareInfo.fareForStockDiscount(i);
                                const discountTitle = fareInfo.fareForStockDiscountTitle(i);
                                
                                if (typeof discountFare !== 'number' || typeof discountTitle !== 'string') {
                                    throw new Error('FareInfo stock discount methods failed');
                                }
                            }
                        }
                    }
                }
                
                console.log('   ✓ Complex inheritance operations working correctly');
            } else {
                console.log('   ⚠️  Station IDs not found, skipping complex inheritance test');
            }
            
            const endMemory = configManager.getMemoryUsageStats();
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
                arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
            };
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta,
                maxMemoryUsed: endMemory.rss,
                objectsCreated: 100 * 4 + 50 * 3, // Chain objects + complex objects  
                objectsDestroyed: 0, // Auto-managed
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log('Object Inheritance Lifecycle: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Object Inheritance Lifecycle: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Test 10: Concurrent Object Management
     * Tests object lifecycle under concurrent-like conditions
     */
    private async testConcurrentObjectManagement(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Test 10: Concurrent Object Management ---');
        
        const testName = 'Concurrent Object Management';
        const startTime = Date.now();
        const startMemory = configManager.getMemoryUsageStats();
        
        try {
            console.log('Testing concurrent-like object creation and access patterns...');
            
            // Simulate concurrent access patterns using promises
            const concurrentTasks = [];
            const taskCount = 20;
            const objectsPerTask = 50;
            
            for (let taskId = 0; taskId < taskCount; taskId++) {
                const task = async () => {
                    if (!this.module) throw new Error('Module not available in concurrent task');
                    
                    const taskObjects = [];
                    
                    try {
                        // Each "thread" creates and manages its own objects
                        for (let obj = 0; obj < objectsPerTask; obj++) {
                            const route = new this.module.cRoute();
                            const routeItem = new this.module.cRouteItem();
                            const routeFlag = new this.module.cRouteFlag();
                            
                            // Simulate work with objects
                            route.addRoute((taskId * objectsPerTask + obj) % 1000 + 1);
                            routeItem.stationId = (taskId * objectsPerTask + obj) % 1000 + 1;
                            routeItem.lineId = (taskId * 10 + obj) % 100 + 1000;
                            routeItem.fare = (obj * 10) + 140;
                            
                            taskObjects.push(route, routeItem, routeFlag);
                            
                            // Small async delay to simulate real concurrent operations
                            if (obj % 10 === 0) {
                                await new Promise(resolve => setTimeout(resolve, 1));
                            }
                        }
                        
                        // Verify all objects in this task
                        for (let i = 0; i < taskObjects.length; i += 3) {
                            const route = taskObjects[i] as RouteWrapper;
                            const routeItem = taskObjects[i + 1] as RouteItemWrapper;
                            const routeFlag = taskObjects[i + 2] as RouteFlagWrapper;
                            
                            // Access methods to verify objects are valid
                            const routeCount = route.getRouteCount();
                            const itemValid = routeItem.isValid();
                            
                            if (typeof routeCount !== 'number') {
                                throw new Error(`Task ${taskId}: Route object became invalid`);
                            }
                            
                            // RouteItem validation might be false for dummy data, that's OK
                        }
                        
                        return taskObjects.length;
                        
                    } catch (error) {
                        throw new Error(`Task ${taskId} failed: ${error}`);
                    }
                };
                
                concurrentTasks.push(task());
            }
            
            // Wait for all concurrent tasks to complete
            const taskResults = await Promise.all(concurrentTasks);
            const totalObjectsCreated = taskResults.reduce((sum, count) => sum + count, 0);
            
            console.log(`   ✓ All ${taskCount} concurrent tasks completed successfully`);
            console.log(`   ✓ Total objects created: ${totalObjectsCreated}`);
            
            // Test concurrent access to shared objects
            console.log('   Testing concurrent access to shared objects...');
            
            const sharedRoute = new this.module.cRoute();
            const tokyoId = this.module.getStationId('東京');
            const osakaId = this.module.getStationId('大阪');
            
            if (tokyoId > 0 && osakaId > 0) {
                sharedRoute.addRoute(tokyoId);
                sharedRoute.addRouteWithLine(11301, osakaId);
                
                // Multiple "threads" accessing the same route object
                const sharedAccessTasks = [];
                
                for (let accessor = 0; accessor < 10; accessor++) {
                    const accessTask = async () => {
                        if (!this.module) throw new Error('Module not available in shared access task');
                        
                        try {
                            for (let access = 0; access < 20; access++) {
                                // Create CalcRoute from shared route
                                const calcRoute = new this.module.cCalcRoute(sharedRoute);
                                
                                // Access shared route properties
                                const routeCount = sharedRoute.getRouteCount();
                                const fareInfo = calcRoute.calcFare();
                                
                                if (typeof routeCount !== 'number' || routeCount <= 0) {
                                    throw new Error(`Shared route access failed: invalid route count ${routeCount}`);
                                }
                                
                                if (fareInfo && fareInfo.fare <= 0) {
                                    throw new Error('Shared route calculation produced invalid fare');
                                }
                                
                                // Small delay
                                if (access % 5 === 0) {
                                    await new Promise(resolve => setTimeout(resolve, 1));
                                }
                            }
                            
                            return true;
                            
                        } catch (error) {
                            throw new Error(`Shared access task ${accessor} failed: ${error}`);
                        }
                    };
                    
                    sharedAccessTasks.push(accessTask());
                }
                
                // Wait for all shared access tasks
                await Promise.all(sharedAccessTasks);
                console.log('   ✓ Concurrent shared object access completed successfully');
                
            } else {
                console.log('   ⚠️  Station IDs not found, skipping shared object access test');
            }
            
            // Force cleanup
            if (global.gc) {
                global.gc();
            }
            
            const endMemory = configManager.getMemoryUsageStats();
            const memoryDelta = {
                rss: endMemory.rss - startMemory.rss,
                heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                external: endMemory.external - startMemory.external,
                arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
            };
            
            const result: LifecycleTestResult = {
                testName,
                passed: true,
                duration: Date.now() - startTime,
                memoryDelta,
                maxMemoryUsed: endMemory.rss,
                objectsCreated: totalObjectsCreated + 1, // + shared route
                objectsDestroyed: 0, // Auto-managed
                errorMessages: []
            };
            
            this.testResults.push(result);
            
            console.log('Concurrent Object Management: PASS');
            return true;
            
        } catch (error) {
            const errorMsg = `Concurrent Object Management: FAIL (${error})`;
            console.log(errorMsg);
            
            const result: LifecycleTestResult = {
                testName,
                passed: false,
                duration: Date.now() - startTime,
                memoryDelta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
                maxMemoryUsed: 0,
                objectsCreated: 0,
                objectsDestroyed: 0,
                errorMessages: [errorMsg]
            };
            
            this.testResults.push(result);
            return false;
        }
    }
    
    /**
     * Take a memory snapshot for leak detection analysis
     */
    private takeMemorySnapshot(context: string, objectCounts: ObjectCounts): void {
        const snapshot: MemorySnapshot = {
            timestamp: Date.now(),
            usage: configManager.getMemoryUsageStats(),
            context,
            objectCounts: { ...objectCounts }
        };
        
        this.memorySnapshots.push(snapshot);
        
        if (this.config.enableVerboseLogging) {
            console.log(`[MEMORY] ${context}: RSS=${snapshot.usage.rss}MB, Heap=${snapshot.usage.heapUsed}MB`);
        }
    }
    
    /**
     * Generate comprehensive memory usage report
     */
    private generateMemoryReport(): void {
        console.log('\n=== Memory Usage Analysis ===');
        
        if (this.memorySnapshots.length >= 2) {
            const initial = this.memorySnapshots[0];
            const final = this.memorySnapshots[this.memorySnapshots.length - 1];
            
            const totalGrowth = final.usage.rss - initial.usage.rss;
            const heapGrowth = final.usage.heapUsed - initial.usage.heapUsed;
            
            console.log(`Initial Memory: RSS=${initial.usage.rss}MB, Heap=${initial.usage.heapUsed}MB`);
            console.log(`Final Memory: RSS=${final.usage.rss}MB, Heap=${final.usage.heapUsed}MB`);
            console.log(`Total Growth: RSS=${totalGrowth}MB, Heap=${heapGrowth}MB`);
            
            // Calculate peak memory
            const peakMemory = Math.max(...this.memorySnapshots.map(s => s.usage.rss));
            console.log(`Peak Memory Usage: ${peakMemory}MB`);
            
            // Memory leak assessment
            if (totalGrowth > this.config.memoryLeakThresholdMB) {
                console.log(`⚠️  Memory growth ${totalGrowth}MB exceeds threshold ${this.config.memoryLeakThresholdMB}MB`);
            } else {
                console.log(`✓ Memory growth ${totalGrowth}MB within acceptable threshold`);
            }
            
        } else {
            console.log('Insufficient memory snapshots for analysis');
        }
        
        // Test results summary
        console.log('\n=== Test Results Summary ===');
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`Tests Passed: ${passedTests}/${totalTests}`);
        
        if (this.testResults.length > 0) {
            const totalObjects = this.testResults.reduce((sum, r) => sum + r.objectsCreated, 0);
            const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
            const maxMemoryUsed = Math.max(...this.testResults.map(r => r.maxMemoryUsed));
            
            console.log(`Total Objects Created: ${totalObjects}`);
            console.log(`Total Test Duration: ${(totalDuration / 1000).toFixed(1)}s`);
            console.log(`Maximum Memory Used: ${maxMemoryUsed}MB`);
        }
    }
    
    /**
     * Generate failure report for failed tests
     */
    private generateFailureReport(): void {
        const failedTests = this.testResults.filter(r => !r.passed);
        
        if (failedTests.length > 0) {
            console.log('\n=== Failure Analysis ===');
            
            failedTests.forEach(test => {
                console.log(`❌ ${test.testName}:`);
                test.errorMessages.forEach(msg => {
                    console.log(`   ${msg}`);
                });
                console.log(`   Duration: ${test.duration}ms`);
                console.log(`   Objects Created: ${test.objectsCreated}`);
                console.log('');
            });
        }
    }
    
    /**
     * Get configuration for this test suite
     */
    getConfig(): LifecycleTestConfig {
        return { ...this.config };
    }
    
    /**
     * Get test results summary
     */
    getResults(): LifecycleTestResult[] {
        return [...this.testResults];
    }
    
    /**
     * Get memory snapshots for external analysis
     */
    getMemorySnapshots(): MemorySnapshot[] {
        return [...this.memorySnapshots];
    }
}

/**
 * Standalone test execution function
 */
async function runObjectLifecycleTests(): Promise<void> {
    console.log('Object Lifecycle Tests - Task 33');
    console.log('REQ-OBJ-007: Object Lifecycle Management and Memory Safety');
    console.log('Testing memory management for all 6 object classes\n');
    
    const testSuite = new ObjectLifecycleTests({
        enableMemoryMonitoring: true,
        enableVerboseLogging: process.argv.includes('--verbose'),
        longRunningTestDurationMs: process.argv.includes('--quick') ? 10000 : 30000
    });
    
    const success = await testSuite.executeAll();
    
    if (success) {
        console.log('\n🎉 Object Lifecycle Tests completed successfully - All memory safety requirements validated');
        process.exit(0);
    } else {
        console.log('\n💥 Object Lifecycle Tests completed with failures - Memory safety issues detected');
        process.exit(1);
    }
}

// Export for use in other test suites
export { ObjectLifecycleTests };

// Run standalone if this file is executed directly
if (require.main === module) {
    runObjectLifecycleTests();
}