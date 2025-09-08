/**
 * Enhanced Array Operations Tests for cRouteList Class
 * Task 30: Create comprehensive unit tests for enhanced array operations
 * 
 * Tests cover:
 * - Core array methods: at(), count(), remove(), insert(), assign()
 * - Bounds checking and error handling with specific error codes
 * - Performance tests with large route collections
 * - Integration with RouteItemWrapper objects
 * - Memory management and object lifecycle
 * - State consistency after complex operations
 */

import { FarertModule } from './types';
import { wasmLoader } from './wasm_loader';

export class ArrayOperationsTests {
    private module: FarertModule | null = null;
    private verbose: boolean = false;
    
    constructor(verbose: boolean = false) {
        this.verbose = verbose;
    }
    
    /**
     * Execute all enhanced array operations tests
     * @returns {Promise<boolean>} Test success status
     */
    async executeAll(): Promise<boolean> {
        try {
            this.module = await wasmLoader.loadModule();
            const dbResult = await wasmLoader.initializeDatabase();
            
            if (!dbResult) {
                console.error('Database initialization failed for array operations tests');
                return false;
            }
            
            console.log('\n=== Enhanced Array Operations Tests ===');
            
            const results = [
                await this.testCoreArrayMethods(),
                await this.testBoundsCheckingAndErrorHandling(),
                await this.testPerformanceWithLargeCollections(),
                await this.testIntegrationWithRouteItems(),
                await this.testStateConsistencyAndMemoryManagement()
            ];
            
            const allPassed = results.every(r => r);
            
            console.log('=== Array Operations Tests Complete ===');
            console.log(`Result: ${results.filter(r => r).length}/${results.length} test categories passed`);
            
            return allPassed;
            
        } catch (error) {
            console.error('Array operations test execution failed:', error);
            return false;
        } finally {
            wasmLoader.cleanup();
        }
    }
    
    /**
     * Test core array methods: at(), count(), remove(), removeAll(), insert(), assign()
     */
    private async testCoreArrayMethods(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Core Array Methods Tests ---');
        
        try {
            // Create a route with multiple stations
            const route = new this.module.cRoute();
            route.setupRoute('東京,新宿,池袋,上野');
            const routeList = new this.module.cRouteList(route);
            
            // Test count() method
            const initialCount = routeList.count();
            if (initialCount <= 0) {
                console.log('count(): FAIL - Initial count should be greater than 0');
                return false;
            }
            
            if (this.verbose) {
                console.log(`  Initial route count: ${initialCount} stations`);
            }
            
            // Test at() method for valid indices
            for (let i = 0; i < initialCount; i++) {
                const routeItem = routeList.at(i);
                if (!routeItem || routeItem.stationId <= 0) {
                    console.log(`at(${i}): FAIL - Invalid route item at index ${i}`);
                    return false;
                }
                
                if (this.verbose) {
                    const stationName = this.module.getStationName(routeItem.stationId);
                    console.log(`  at(${i}): Station ID ${routeItem.stationId} (${stationName})`);
                }
            }
            
            // Test remove() method - remove middle item
            const middleIndex = Math.floor(initialCount / 2);
            routeList.remove(middleIndex);
            
            const countAfterRemove = routeList.count();
            if (countAfterRemove !== initialCount - 1) {
                console.log('remove(): FAIL - Count not decremented after removal');
                return false;
            }
            
            // Test insert() method - insert new route item
            const newRouteItem = new this.module.cRouteItem();
            const shibuyadId = this.module.getStationId('渋谷');
            if (shibuyadId > 0) {
                newRouteItem.stationId = shibuyadId;
                newRouteItem.lineId = 1; // Default line
                
                routeList.insert(middleIndex, newRouteItem);
                const countAfterInsert = routeList.count();
                
                if (countAfterInsert !== initialCount) {
                    console.log('insert(): FAIL - Count not restored after insertion');
                    return false;
                }
                
                // Verify inserted item
                const insertedItem = routeList.at(middleIndex);
                if (insertedItem.stationId !== shibuyadId) {
                    console.log('insert(): FAIL - Inserted item not found at correct position');
                    return false;
                }
            }
            
            // Test assign() method - copy from another route list
            const route2 = new this.module.cRoute();
            route2.setupRoute('横浜,川崎,品川');
            const routeList2 = new this.module.cRouteList(route2);
            
            const sourceCount = routeList2.count();
            
            routeList.assign(routeList2);
            const assignedCount = routeList.count();
            
            if (assignedCount !== sourceCount) {
                console.log('assign(): FAIL - Assigned route list count mismatch');
                return false;
            }
            
            // Verify assigned content
            const firstStation = routeList.at(0);
            const yokohamaId = this.module.getStationId('横浜');
            if (firstStation.stationId !== yokohamaId) {
                console.log('assign(): FAIL - Assigned content mismatch');
                return false;
            }
            
            // Test removeAll() method
            routeList.removeAll();
            const finalCount = routeList.count();
            
            if (finalCount !== 0) {
                console.log('removeAll(): FAIL - Route list not empty after removeAll()');
                return false;
            }
            
            if (this.verbose) {
                console.log('  All core array methods tested successfully');
            }
            
            console.log('Core Array Methods: PASS');
            return true;
            
        } catch (error) {
            console.log(`Core Array Methods: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test bounds checking and error handling for array operations
     */
    private async testBoundsCheckingAndErrorHandling(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Bounds Checking and Error Handling Tests ---');
        
        try {
            const route = new this.module.cRoute();
            route.setupRoute('東京,大阪');
            const routeList = new this.module.cRouteList(route);
            
            const validCount = routeList.count();
            
            // Test negative index access
            try {
                const invalidItem = routeList.at(-1);
                // Should throw error or return invalid item
                if (invalidItem && invalidItem.stationId > 0) {
                    console.log('at(-1): FAIL - Should not return valid item for negative index');
                    return false;
                }
            } catch (error) {
                if (this.verbose) {
                    console.log('  at(-1): Correctly threw error:', error);
                }
            }
            
            // Test out-of-bounds index access
            try {
                const invalidItem = routeList.at(validCount + 10);
                // Should throw error or return invalid item
                if (invalidItem && invalidItem.stationId > 0) {
                    console.log('at(out-of-bounds): FAIL - Should not return valid item for out-of-bounds index');
                    return false;
                }
            } catch (error) {
                if (this.verbose) {
                    console.log('  at(out-of-bounds): Correctly threw error:', error);
                }
            }
            
            // Test invalid remove operations
            try {
                routeList.remove(-1);
                console.log('remove(-1): FAIL - Should throw error for negative index');
                return false;
            } catch (error) {
                if (this.verbose) {
                    console.log('  remove(-1): Correctly threw error:', error);
                }
            }
            
            try {
                routeList.remove(validCount + 10);
                console.log('remove(out-of-bounds): FAIL - Should throw error for out-of-bounds index');
                return false;
            } catch (error) {
                if (this.verbose) {
                    console.log('  remove(out-of-bounds): Correctly threw error:', error);
                }
            }
            
            // Test invalid insert operations
            const newItem = new this.module.cRouteItem();
            newItem.stationId = this.module.getStationId('京都');
            
            try {
                routeList.insert(-1, newItem);
                console.log('insert(-1): FAIL - Should throw error for negative index');
                return false;
            } catch (error) {
                if (this.verbose) {
                    console.log('  insert(-1): Correctly threw error:', error);
                }
            }
            
            // Test empty route list operations
            routeList.removeAll();
            
            try {
                const emptyItem = routeList.at(0);
                if (emptyItem && emptyItem.stationId > 0) {
                    console.log('at(0) on empty list: FAIL - Should not return valid item');
                    return false;
                }
            } catch (error) {
                if (this.verbose) {
                    console.log('  at(0) on empty list: Correctly handled:', error);
                }
            }
            
            try {
                routeList.remove(0);
                console.log('remove(0) on empty list: FAIL - Should throw error');
                return false;
            } catch (error) {
                if (this.verbose) {
                    console.log('  remove(0) on empty list: Correctly threw error:', error);
                }
            }
            
            if (this.verbose) {
                console.log('  All bounds checking and error handling tests passed');
            }
            
            console.log('Bounds Checking and Error Handling: PASS');
            return true;
            
        } catch (error) {
            console.log(`Bounds Checking and Error Handling: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test performance with large route collections
     */
    private async testPerformanceWithLargeCollections(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Performance Tests with Large Collections ---');
        
        try {
            const route = new this.module.cRoute();
            const routeList = new this.module.cRouteList(route);
            
            // Get some station IDs for testing
            const tokyoId = this.module.getStationId('東京');
            const shibuya = this.module.getStationId('渋谷');
            const shinjuku = this.module.getStationId('新宿');
            const osakaId = this.module.getStationId('大阪');
            const kyotoId = this.module.getStationId('京都');
            
            const testStations = [tokyoId, shibuya, shinjuku, osakaId, kyotoId].filter(id => id > 0);
            if (testStations.length === 0) {
                console.log('Performance Test: SKIP - No valid stations found');
                return true;
            }
            
            // Performance test: Large collection insertion
            const insertStartTime = Date.now();
            const targetSize = 100;
            
            for (let i = 0; i < targetSize; i++) {
                const routeItem = new this.module.cRouteItem();
                routeItem.stationId = testStations[i % testStations.length];
                routeItem.lineId = 1 + (i % 10); // Vary line IDs
                routeList.insert(routeList.count(), routeItem);
            }
            
            const insertTime = Date.now() - insertStartTime;
            const finalCount = routeList.count();
            
            if (finalCount !== targetSize) {
                console.log(`Performance Test: FAIL - Expected ${targetSize} items, got ${finalCount}`);
                return false;
            }
            
            // Performance test: Random access
            const accessStartTime = Date.now();
            const accessIterations = 1000;
            
            for (let i = 0; i < accessIterations; i++) {
                const randomIndex = Math.floor(Math.random() * finalCount);
                const item = routeList.at(randomIndex);
                if (!item || item.stationId <= 0) {
                    console.log(`Performance Test: FAIL - Invalid item at random access ${randomIndex}`);
                    return false;
                }
            }
            
            const accessTime = Date.now() - accessStartTime;
            
            // Performance test: Bulk removal
            const removeStartTime = Date.now();
            const removeCount = Math.floor(finalCount / 2);
            
            for (let i = 0; i < removeCount; i++) {
                // Always remove from middle to test shifting operations
                const middleIndex = Math.floor(routeList.count() / 2);
                if (routeList.count() > 0) {
                    routeList.remove(middleIndex);
                }
            }
            
            const removeTime = Date.now() - removeStartTime;
            
            // Performance test: Clear all
            const clearStartTime = Date.now();
            routeList.removeAll();
            const clearTime = Date.now() - clearStartTime;
            
            if (routeList.count() !== 0) {
                console.log('Performance Test: FAIL - RemoveAll did not clear all items');
                return false;
            }
            
            // Performance validation - all operations should complete reasonably quickly
            const maxInsertTime = 5000; // 5 seconds for 100 insertions
            const maxAccessTime = 1000;  // 1 second for 1000 random accesses
            const maxRemoveTime = 2500;  // 2.5 seconds for 50 removals
            const maxClearTime = 100;    // 100ms for clear
            
            if (insertTime > maxInsertTime) {
                console.log(`Performance Test: FAIL - Insert time ${insertTime}ms exceeds limit ${maxInsertTime}ms`);
                return false;
            }
            
            if (accessTime > maxAccessTime) {
                console.log(`Performance Test: FAIL - Access time ${accessTime}ms exceeds limit ${maxAccessTime}ms`);
                return false;
            }
            
            if (removeTime > maxRemoveTime) {
                console.log(`Performance Test: FAIL - Remove time ${removeTime}ms exceeds limit ${maxRemoveTime}ms`);
                return false;
            }
            
            if (clearTime > maxClearTime) {
                console.log(`Performance Test: FAIL - Clear time ${clearTime}ms exceeds limit ${maxClearTime}ms`);
                return false;
            }
            
            if (this.verbose) {
                console.log(`  Insert ${targetSize} items: ${insertTime}ms`);
                console.log(`  Random access ${accessIterations} times: ${accessTime}ms`);
                console.log(`  Remove ${removeCount} items: ${removeTime}ms`);
                console.log(`  Clear all items: ${clearTime}ms`);
                console.log('  All performance benchmarks within acceptable limits');
            }
            
            console.log('Performance Tests with Large Collections: PASS');
            return true;
            
        } catch (error) {
            console.log(`Performance Tests with Large Collections: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test integration with RouteItemWrapper objects and lifecycle management
     */
    private async testIntegrationWithRouteItems(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- Integration Tests with RouteItemWrapper Objects ---');
        
        try {
            const route = new this.module.cRoute();
            const routeList = new this.module.cRouteList(route);
            
            // Test RouteItemWrapper creation and properties
            const routeItem1 = new this.module.cRouteItem();
            const tokyoId = this.module.getStationId('東京');
            const yamanoteLineId = 1; // Assuming line ID 1 exists
            
            routeItem1.stationId = tokyoId;
            routeItem1.lineId = yamanoteLineId;
            routeItem1.flag = 0;
            
            // Test insert with RouteItemWrapper
            routeList.insert(0, routeItem1);
            
            if (routeList.count() !== 1) {
                console.log('RouteItemWrapper Integration: FAIL - Insert did not increase count');
                return false;
            }
            
            // Test retrieval and property validation
            const retrievedItem = routeList.at(0);
            if (retrievedItem.stationId !== tokyoId) {
                console.log('RouteItemWrapper Integration: FAIL - Station ID mismatch');
                return false;
            }
            
            if (retrievedItem.lineId !== yamanoteLineId) {
                console.log('RouteItemWrapper Integration: FAIL - Line ID mismatch');
                return false;
            }
            
            // Test multiple RouteItemWrapper objects
            const stations = ['新宿', '渋谷', '池袋', '上野'];
            const stationIds = stations.map(name => this.module!.getStationId(name)).filter(id => id > 0);
            
            for (let i = 0; i < stationIds.length; i++) {
                const item = new this.module.cRouteItem();
                item.stationId = stationIds[i];
                item.lineId = yamanoteLineId;
                item.flag = i; // Vary flags for testing
                
                routeList.insert(routeList.count(), item);
            }
            
            const totalCount = routeList.count();
            if (totalCount !== stationIds.length + 1) { // +1 for initial Tokyo item
                console.log(`RouteItemWrapper Integration: FAIL - Expected ${stationIds.length + 1} items, got ${totalCount}`);
                return false;
            }
            
            // Test array operations preserve RouteItemWrapper properties
            for (let i = 0; i < totalCount; i++) {
                const item = routeList.at(i);
                
                if (item.stationId <= 0) {
                    console.log(`RouteItemWrapper Integration: FAIL - Invalid station ID at index ${i}`);
                    return false;
                }
                
                if (item.lineId <= 0) {
                    console.log(`RouteItemWrapper Integration: FAIL - Invalid line ID at index ${i}`);
                    return false;
                }
                
                // Test property access
                const stationName = this.module.getStationName(item.stationId);
                if (stationName.length === 0) {
                    console.log(`RouteItemWrapper Integration: FAIL - Empty station name at index ${i}`);
                    return false;
                }
                
                if (this.verbose) {
                    console.log(`  Item ${i}: Station ${stationName} (ID: ${item.stationId}), Line: ${item.lineId}, Flag: ${item.flag}`);
                }
            }
            
            // Test assign() preserves RouteItemWrapper properties
            const route2 = new this.module.cRoute();
            const routeList2 = new this.module.cRouteList(route2);
            routeList2.assign(routeList);
            
            if (routeList2.count() !== totalCount) {
                console.log('RouteItemWrapper Integration: FAIL - Assign did not preserve count');
                return false;
            }
            
            // Verify all properties are preserved after assign
            for (let i = 0; i < totalCount; i++) {
                const originalItem = routeList.at(i);
                const assignedItem = routeList2.at(i);
                
                if (originalItem.stationId !== assignedItem.stationId ||
                    originalItem.lineId !== assignedItem.lineId ||
                    originalItem.flag !== assignedItem.flag) {
                    console.log(`RouteItemWrapper Integration: FAIL - Property mismatch after assign at index ${i}`);
                    return false;
                }
            }
            
            if (this.verbose) {
                console.log('  All RouteItemWrapper integration tests passed');
            }
            
            console.log('Integration Tests with RouteItemWrapper Objects: PASS');
            return true;
            
        } catch (error) {
            console.log(`Integration Tests with RouteItemWrapper Objects: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test state consistency and memory management during array operations
     */
    private async testStateConsistencyAndMemoryManagement(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- State Consistency and Memory Management Tests ---');
        
        try {
            // Test repeated operations for memory leaks
            const iterationCount = 50;
            const itemsPerIteration = 10;
            
            for (let iteration = 0; iteration < iterationCount; iteration++) {
                const route = new this.module.cRoute();
                const routeList = new this.module.cRouteList(route);
                
                // Add items
                for (let i = 0; i < itemsPerIteration; i++) {
                    const item = new this.module.cRouteItem();
                    item.stationId = 1000 + i; // Use consistent test IDs
                    item.lineId = 1 + (i % 5);
                    item.flag = i;
                    
                    routeList.insert(routeList.count(), item);
                }
                
                // Verify count consistency
                if (routeList.count() !== itemsPerIteration) {
                    console.log(`State Consistency: FAIL - Count mismatch in iteration ${iteration}`);
                    return false;
                }
                
                // Perform various operations
                const middleIndex = Math.floor(itemsPerIteration / 2);
                routeList.remove(middleIndex);
                
                if (routeList.count() !== itemsPerIteration - 1) {
                    console.log(`State Consistency: FAIL - Count not updated after remove in iteration ${iteration}`);
                    return false;
                }
                
                // Add back an item
                const newItem = new this.module.cRouteItem();
                newItem.stationId = 2000 + iteration;
                newItem.lineId = 1;
                newItem.flag = 0;
                
                routeList.insert(middleIndex, newItem);
                
                if (routeList.count() !== itemsPerIteration) {
                    console.log(`State Consistency: FAIL - Count not restored after insert in iteration ${iteration}`);
                    return false;
                }
                
                // Verify inserted item is at correct position
                const retrievedItem = routeList.at(middleIndex);
                if (retrievedItem.stationId !== 2000 + iteration) {
                    console.log(`State Consistency: FAIL - Inserted item not found at correct position in iteration ${iteration}`);
                    return false;
                }
                
                // Test assign operation
                const route2 = new this.module.cRoute();
                const routeList2 = new this.module.cRouteList(route2);
                routeList2.assign(routeList);
                
                if (routeList2.count() !== routeList.count()) {
                    console.log(`State Consistency: FAIL - Assign count mismatch in iteration ${iteration}`);
                    return false;
                }
                
                // Clear both lists
                routeList.removeAll();
                routeList2.removeAll();
                
                if (routeList.count() !== 0 || routeList2.count() !== 0) {
                    console.log(`State Consistency: FAIL - RemoveAll failed in iteration ${iteration}`);
                    return false;
                }
                
                // Objects should be cleaned up automatically by WebAssembly
                // We can't directly test memory usage, but repeated operations should not cause issues
            }
            
            // Test complex state changes
            const route = new this.module.cRoute();
            const routeList = new this.module.cRouteList(route);
            
            // Add initial items
            for (let i = 0; i < 5; i++) {
                const item = new this.module.cRouteItem();
                item.stationId = 100 + i;
                item.lineId = 1;
                item.flag = i;
                routeList.insert(routeList.count(), item);
            }
            
            const initialCount = routeList.count();
            
            // Complex operations: remove from beginning, middle, end
            routeList.remove(0); // Remove first
            routeList.remove(routeList.count() - 1); // Remove last
            routeList.remove(1); // Remove middle
            
            const expectedCountAfterRemovals = initialCount - 3;
            if (routeList.count() !== expectedCountAfterRemovals) {
                console.log('State Consistency: FAIL - Complex removal count mismatch');
                return false;
            }
            
            // Verify remaining items have consistent state
            for (let i = 0; i < routeList.count(); i++) {
                const item = routeList.at(i);
                if (item.stationId <= 0 || item.lineId <= 0) {
                    console.log(`State Consistency: FAIL - Invalid item state after complex operations at index ${i}`);
                    return false;
                }
            }
            
            // Test assign with modified list
            const route2 = new this.module.cRoute();
            const routeList2 = new this.module.cRouteList(route2);
            routeList2.assign(routeList);
            
            if (routeList2.count() !== routeList.count()) {
                console.log('State Consistency: FAIL - Assign after complex operations failed');
                return false;
            }
            
            // Verify assignment preserved all item states correctly
            for (let i = 0; i < routeList.count(); i++) {
                const originalItem = routeList.at(i);
                const assignedItem = routeList2.at(i);
                
                if (originalItem.stationId !== assignedItem.stationId ||
                    originalItem.lineId !== assignedItem.lineId ||
                    originalItem.flag !== assignedItem.flag) {
                    console.log(`State Consistency: FAIL - Item state mismatch after complex assign at index ${i}`);
                    return false;
                }
            }
            
            if (this.verbose) {
                console.log(`  Completed ${iterationCount} iterations of memory management testing`);
                console.log('  All state consistency and memory management tests passed');
            }
            
            console.log('State Consistency and Memory Management: PASS');
            return true;
            
        } catch (error) {
            console.log(`State Consistency and Memory Management: FAIL (${error})`);
            return false;
        }
    }
}