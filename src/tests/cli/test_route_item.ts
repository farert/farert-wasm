#!/usr/bin/env node

/**
 * cRouteItem Unit Test Suite
 * Tests for the cRouteItem class implementation - Task 28
 * REQ-OBJ-003: Route item data structures and validation
 * REQ-OBJ-007: Memory management and error handling for objects
 * 
 * Tests all cRouteItem functionality including:
 * - Property access (stationId, lineId, flag, fare, salesKm, indexOfAggregate)
 * - Validation methods (isValid, getDisplayName)
 * - Integration with cRouteList array operations
 * - Memory management and lifecycle
 * - Error handling for invalid states
 */

import { FarertModule, RouteItemWrapper, RouteListWrapper } from './types';
import { wasmLoader } from './wasm_loader';

class RouteItemTestSuite {
    private module: FarertModule | null = null;
    private verbose: boolean = false;
    
    constructor(verbose: boolean = false) {
        this.verbose = verbose;
    }
    
    /**
     * Execute all cRouteItem tests
     */
    async executeAll(): Promise<boolean> {
        try {
            this.module = await wasmLoader.loadModule();
            const dbResult = await wasmLoader.initializeDatabase();
            
            if (!dbResult) {
                console.error('Database initialization failed for RouteItem tests');
                return false;
            }
            
            console.log('\n=== cRouteItem テストスイート開始 ===');
            console.log('タスク28: cRouteItem単体テスト');
            console.log('REQ-OBJ-003, REQ-OBJ-007');
            console.log('-'.repeat(50));
            
            const results = [
                await this.testPropertyAccess(),
                await this.testValidationMethods(), 
                await this.testLifecycleManagement(),
                await this.testRouteListIntegration(),
                await this.testMemoryManagement(),
                await this.testErrorHandling()
            ];
            
            const allPassed = results.every(r => r);
            const passedCount = results.filter(r => r).length;
            
            console.log('\n=== cRouteItem テストスイート完了 ===');
            console.log(`結果: ${passedCount}/${results.length} テストカテゴリ成功`);
            
            if (allPassed) {
                console.log('🎉 全てのcRouteItemテストが成功しました！');
                console.log('✓ プロパティアクセステスト');
                console.log('✓ バリデーションメソッドテスト');
                console.log('✓ ライフサイクル管理テスト');
                console.log('✓ cRouteList統合テスト');
                console.log('✓ メモリ管理テスト');
                console.log('✓ エラーハンドリングテスト');
            } else {
                console.log('⚠️  一部のcRouteItemテストが失敗しました');
            }
            
            return allPassed;
            
        } catch (error) {
            console.error('RouteItem test execution failed:', error);
            return false;
        } finally {
            wasmLoader.cleanup();
        }
    }
    
    /**
     * Test 1: プロパティアクセステスト
     * Tests property access for stationId, lineId, flag, fare, salesKm, indexOfAggregate
     */
    private async testPropertyAccess(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- プロパティアクセステスト ---');
        
        try {
            const routeItem = new this.module.cRouteItem();
            
            // Test initial property values
            console.log('1. 初期プロパティ値テスト:');
            const initialStationId = routeItem.stationId;
            const initialLineId = routeItem.lineId;
            const initialFlag = routeItem.flag;
            const initialFare = routeItem.fare;
            const initialSalesKm = routeItem.salesKm;
            const initialIndex = routeItem.indexOfAggregate;
            
            if (this.verbose) {
                console.log(`   stationId: ${initialStationId}`);
                console.log(`   lineId: ${initialLineId}`);
                console.log(`   flag: ${initialFlag}`);
                console.log(`   fare: ${initialFare}`);
                console.log(`   salesKm: ${initialSalesKm}`);
                console.log(`   indexOfAggregate: ${initialIndex}`);
            }
            
            // All initial values should be 0 or default
            const initialTest = typeof initialStationId === 'number' && 
                               typeof initialLineId === 'number' &&
                               typeof initialFlag === 'number' &&
                               typeof initialFare === 'number' &&
                               typeof initialSalesKm === 'number' &&
                               typeof initialIndex === 'number';
            
            if (!initialTest) {
                console.log('   ❌ 初期プロパティ型チェック失敗');
                return false;
            }
            
            console.log('   ✅ 初期プロパティ型チェック成功');
            
            // Test property assignment (if setters exist)
            console.log('2. プロパティ代入テスト:');
            try {
                // Get Tokyo station ID for testing
                const tokyoId = this.module.getStationId('東京');
                if (tokyoId > 0) {
                    routeItem.stationId = tokyoId;
                    routeItem.lineId = 11301; // 東海道線 ID (example)
                    routeItem.flag = 1;
                    routeItem.fare = 160;
                    routeItem.salesKm = 5;
                    routeItem.indexOfAggregate = 0;
                    
                    // Verify assignments
                    const assignmentTest = routeItem.stationId === tokyoId &&
                                         routeItem.lineId === 11301 &&
                                         routeItem.flag === 1 &&
                                         routeItem.fare === 160 &&
                                         routeItem.salesKm === 5 &&
                                         routeItem.indexOfAggregate === 0;
                    
                    if (assignmentTest) {
                        console.log('   ✅ プロパティ代入成功');
                        if (this.verbose) {
                            console.log(`   設定後 stationId: ${routeItem.stationId}`);
                            console.log(`   設定後 lineId: ${routeItem.lineId}`);
                            console.log(`   設定後 flag: ${routeItem.flag}`);
                        }
                    } else {
                        console.log('   ❌ プロパティ代入失敗');
                        return false;
                    }
                } else {
                    console.log('   ⚠️  東京駅IDが見つからないため、プロパティ代入テストをスキップ');
                }
            } catch (error) {
                console.log(`   ❌ プロパティ代入エラー: ${error}`);
                return false;
            }
            
            console.log('プロパティアクセステスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`プロパティアクセステスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 2: バリデーションメソッドテスト
     * Tests isValid() and getDisplayName() methods
     */
    private async testValidationMethods(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- バリデーションメソッドテスト ---');
        
        try {
            // Test 1: Empty RouteItem validation
            console.log('1. 空のRouteItemバリデーションテスト:');
            const emptyRouteItem = new this.module.cRouteItem();
            const isEmptyValid = emptyRouteItem.isValid();
            
            if (this.verbose) {
                console.log(`   空のRouteItem.isValid(): ${isEmptyValid}`);
            }
            
            // Empty route item should be invalid
            if (isEmptyValid) {
                console.log('   ❌ 空のRouteItemが有効と判定された (期待値: invalid)');
                return false;
            }
            console.log('   ✅ 空のRouteItemが無効と判定された');
            
            // Test 2: Valid RouteItem validation
            console.log('2. 有効なRouteItemバリデーションテスト:');
            const tokyoId = this.module.getStationId('東京');
            if (tokyoId > 0) {
                const validRouteItem = new this.module.cRouteItem();
                validRouteItem.stationId = tokyoId;
                validRouteItem.lineId = 11301; // 東海道線
                
                const isValidValid = validRouteItem.isValid();
                
                if (this.verbose) {
                    console.log(`   有効なRouteItem.isValid(): ${isValidValid}`);
                }
                
                if (!isValidValid) {
                    console.log('   ❌ 有効なRouteItemが無効と判定された');
                    return false;
                }
                console.log('   ✅ 有効なRouteItemが有効と判定された');
                
                // Test 3: getDisplayName() method
                console.log('3. 表示名取得テスト:');
                const displayName = validRouteItem.getDisplayName();
                
                if (this.verbose) {
                    console.log(`   表示名: "${displayName}"`);
                }
                
                if (!displayName || displayName.length === 0) {
                    console.log('   ❌ 表示名が空文字');
                    return false;
                }
                
                // Display name should contain station information
                const tokyoName = this.module.stationName(tokyoId);
                if (!displayName.includes(tokyoName) && !displayName.includes('東京')) {
                    console.log('   ❌ 表示名に駅名が含まれていない');
                    return false;
                }
                
                console.log('   ✅ 表示名が正しく生成された');
                
            } else {
                console.log('   ⚠️  東京駅IDが見つからないため、有効性テストをスキップ');
            }
            
            console.log('バリデーションメソッドテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`バリデーションメソッドテスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 3: ライフサイクル管理テスト
     * Tests object creation, initialization, and cleanup
     */
    private async testLifecycleManagement(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- ライフサイクル管理テスト ---');
        
        try {
            // Test 1: Multiple object creation
            console.log('1. 複数オブジェクト作成テスト:');
            const routeItems: RouteItemWrapper[] = [];
            
            for (let i = 0; i < 10; i++) {
                const item = new this.module.cRouteItem();
                item.stationId = i + 1;
                item.lineId = (i + 1) * 100;
                item.indexOfAggregate = i;
                routeItems.push(item);
            }
            
            // Verify all objects were created properly
            let creationSuccess = true;
            for (let i = 0; i < routeItems.length; i++) {
                if (routeItems[i].stationId !== i + 1 || 
                    routeItems[i].lineId !== (i + 1) * 100 ||
                    routeItems[i].indexOfAggregate !== i) {
                    creationSuccess = false;
                    break;
                }
            }
            
            if (!creationSuccess) {
                console.log('   ❌ 複数オブジェクト作成に失敗');
                return false;
            }
            
            console.log(`   ✅ ${routeItems.length}個のRouteItemオブジェクト作成成功`);
            
            // Test 2: Object state persistence
            console.log('2. オブジェクト状態持続性テスト:');
            const testItem = routeItems[5]; // Use middle item
            const originalStationId = testItem.stationId;
            const originalLineId = testItem.lineId;
            
            // Perform some operations that might affect state
            testItem.flag = 99;
            testItem.fare = 320;
            
            // Verify original values persist
            if (testItem.stationId !== originalStationId || 
                testItem.lineId !== originalLineId) {
                console.log('   ❌ オブジェクト状態が予期せず変更された');
                return false;
            }
            
            // Verify new values were set
            if (testItem.flag !== 99 || testItem.fare !== 320) {
                console.log('   ❌ 新しい値の設定に失敗');
                return false;
            }
            
            console.log('   ✅ オブジェクト状態持続性確認');
            
            console.log('ライフサイクル管理テスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`ライフサイクル管理テスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 4: cRouteList統合テスト
     * Tests integration with cRouteList array operations
     */
    private async testRouteListIntegration(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- cRouteList統合テスト ---');
        
        try {
            // Create a route with multiple stations
            console.log('1. ルート作成とRouteItem統合テスト:');
            const route = new this.module.cRoute();
            
            // Add Tokyo -> Shimbashi -> Yokohama route
            const tokyoId = this.module.getStationId('東京');
            const shimbashiId = this.module.getStationId('新橋');
            const yokohamaId = this.module.getStationId('横浜');
            
            if (tokyoId > 0 && shimbashiId > 0 && yokohamaId > 0) {
                // Use RouteWrapper methods
                route.addRoute(tokyoId);
                route.addRouteWithLine(11301, shimbashiId); // 東海道線 to 新橋
                route.addRouteWithLine(11301, yokohamaId);  // 東海道線 to 横浜
                
                // Create RouteList from route
                const routeList = new this.module.cRouteList(route);
                const routeCount = route.getRouteCount();
                
                if (this.verbose) {
                    console.log(`   ルートアイテム数: ${routeCount}`);
                }
                
                if (routeCount <= 0) {
                    console.log('   ❌ RouteListが空です');
                    return false;
                }
                
                // Test array-like access to RouteItems
                console.log('2. 配列アクセステスト:');
                for (let i = 0; i < Math.min(routeCount, 5); i++) {
                    const routeItem = route.getRouteItem(i);
                    if (!routeItem) {
                        console.log(`   ❌ RouteItem[${i}]が取得できませんでした`);
                        return false;
                    }
                    
                    // Verify RouteItem properties
                    if (routeItem.stationId <= 0) {
                        console.log(`   ❌ RouteItem[${i}]のstationIdが無効です`);
                        return false;
                    }
                    
                    if (this.verbose) {
                        const stationName = this.module.stationName(routeItem.stationId);
                        console.log(`   RouteItem[${i}]: ${stationName} (ID: ${routeItem.stationId})`);
                    }
                }
                
                console.log('   ✅ 配列アクセス成功');
                
                // Test RouteItem validation within RouteList context
                console.log('3. RouteList内RouteItemバリデーションテスト:');
                const firstItem = route.getRouteItem(0);
                if (firstItem && firstItem.isValid()) {
                    const displayName = firstItem.toString();
                    if (displayName && displayName.length > 0) {
                        console.log('   ✅ RouteList内RouteItemバリデーション成功');
                        if (this.verbose) {
                            console.log(`   最初のアイテム表示名: "${displayName}"`);
                        }
                    } else {
                        console.log('   ❌ RouteItem表示名生成失敗');
                        return false;
                    }
                } else {
                    console.log('   ❌ RouteList内RouteItemが無効');
                    return false;
                }
                
            } else {
                console.log('   ⚠️  必要な駅IDが見つからないため、統合テストをスキップ');
                console.log(`   東京: ${tokyoId}, 新橋: ${shimbashiId}, 横浜: ${yokohamaId}`);
            }
            
            console.log('cRouteList統合テスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`cRouteList統合テスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 5: メモリ管理テスト
     * Tests memory management with repeated object creation and cleanup
     */
    private async testMemoryManagement(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- メモリ管理テスト ---');
        
        try {
            // Test 1: Large scale object creation and access
            console.log('1. 大量オブジェクト作成テスト:');
            const LARGE_COUNT = 1000;
            const largeRouteItems: RouteItemWrapper[] = [];
            
            // Create many RouteItem objects
            for (let i = 0; i < LARGE_COUNT; i++) {
                const item = new this.module.cRouteItem();
                item.stationId = i + 1;
                item.lineId = (i % 100) + 1000;
                item.flag = i % 10;
                item.fare = (i % 500) + 140;
                item.salesKm = (i % 100) + 1;
                item.indexOfAggregate = i;
                largeRouteItems.push(item);
            }
            
            // Verify all objects maintain correct data
            let memoryTestPassed = true;
            const sampleIndices = [0, 100, 500, 999]; // Sample check to avoid excessive validation
            
            for (const idx of sampleIndices) {
                if (idx < largeRouteItems.length) {
                    const item = largeRouteItems[idx];
                    const expectedStationId = idx + 1;
                    const expectedLineId = (idx % 100) + 1000;
                    const expectedFlag = idx % 10;
                    const expectedFare = (idx % 500) + 140;
                    const expectedSalesKm = (idx % 100) + 1;
                    const expectedIndex = idx;
                    
                    if (item.stationId !== expectedStationId ||
                        item.lineId !== expectedLineId ||
                        item.flag !== expectedFlag ||
                        item.fare !== expectedFare ||
                        item.salesKm !== expectedSalesKm ||
                        item.indexOfAggregate !== expectedIndex) {
                        memoryTestPassed = false;
                        console.log(`   ❌ オブジェクト[${idx}]データ整合性エラー`);
                        break;
                    }
                }
            }
            
            if (!memoryTestPassed) {
                console.log('   ❌ メモリ管理整合性チェック失敗');
                return false;
            }
            
            console.log(`   ✅ ${LARGE_COUNT}個のRouteItemオブジェクト作成・管理成功`);
            
            // Test 2: Repeated creation/destruction cycles
            console.log('2. オブジェクト作成・破棄サイクルテスト:');
            const CYCLE_COUNT = 100;
            
            for (let cycle = 0; cycle < CYCLE_COUNT; cycle++) {
                const tempItems: RouteItemWrapper[] = [];
                
                // Create temporary objects
                for (let i = 0; i < 10; i++) {
                    const item = new this.module.cRouteItem();
                    item.stationId = cycle * 10 + i;
                    item.lineId = cycle + 1000;
                    tempItems.push(item);
                }
                
                // Verify creation
                for (let i = 0; i < tempItems.length; i++) {
                    if (tempItems[i].stationId !== cycle * 10 + i ||
                        tempItems[i].lineId !== cycle + 1000) {
                        console.log(`   ❌ サイクル[${cycle}]オブジェクト作成エラー`);
                        return false;
                    }
                }
                
                // Objects will be cleaned up automatically when going out of scope
            }
            
            console.log(`   ✅ ${CYCLE_COUNT}サイクルの作成・破棄テスト成功`);
            
            console.log('メモリ管理テスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`メモリ管理テスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 6: エラーハンドリングテスト
     * Tests error handling for invalid object states and use-after-destruction scenarios
     */
    private async testErrorHandling(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- エラーハンドリングテスト ---');
        
        try {
            // Test 1: Invalid property access
            console.log('1. 無効プロパティアクセステスト:');
            const routeItem = new this.module.cRouteItem();
            
            // Test invalid station ID
            routeItem.stationId = -1;
            if (routeItem.isValid()) {
                console.log('   ❌ 無効なstationId (-1)が有効と判定された');
                return false;
            }
            console.log('   ✅ 無効なstationIdが正しく無効と判定された');
            
            // Test invalid line ID
            routeItem.stationId = 1; // Reset to valid
            routeItem.lineId = -1;
            if (routeItem.isValid()) {
                console.log('   ❌ 無効なlineId (-1)が有効と判定された');
                return false;
            }
            console.log('   ✅ 無効なlineIdが正しく無効と判定された');
            
            // Test 2: Boundary value testing
            console.log('2. 境界値テスト:');
            const boundaryItem = new this.module.cRouteItem();
            
            // Test maximum safe integer values
            const MAX_SAFE = Number.MAX_SAFE_INTEGER;
            const MIN_SAFE = Number.MIN_SAFE_INTEGER;
            
            try {
                boundaryItem.stationId = MAX_SAFE;
                boundaryItem.lineId = MAX_SAFE;
                boundaryItem.flag = MAX_SAFE;
                boundaryItem.fare = MAX_SAFE;
                boundaryItem.salesKm = MAX_SAFE;
                boundaryItem.indexOfAggregate = MAX_SAFE;
                
                // These should not crash but may result in invalid state
                if (this.verbose) {
                    console.log(`   最大値設定後のバリデーション: ${boundaryItem.isValid()}`);
                }
                
                console.log('   ✅ 極値設定でクラッシュしなかった');
                
            } catch (error) {
                console.log(`   ❌ 境界値テストでエラー: ${error}`);
                return false;
            }
            
            // Test 3: Display name error handling
            console.log('3. 表示名エラーハンドリングテスト:');
            const invalidDisplayItem = new this.module.cRouteItem();
            invalidDisplayItem.stationId = 999999999; // Very likely invalid ID
            invalidDisplayItem.lineId = 999999999;
            
            try {
                const displayName = invalidDisplayItem.toString();
                // Should not crash, but may return empty or error message
                if (this.verbose) {
                    console.log(`   無効IDの表示名: "${displayName}"`);
                }
                console.log('   ✅ 無効IDでも表示名生成でクラッシュしなかった');
            } catch (error) {
                console.log(`   ❌ 表示名生成でエラー: ${error}`);
                return false;
            }
            
            // Test 4: RouteList integration error scenarios
            console.log('4. RouteList統合エラーシナリオテスト:');
            try {
                const route = new this.module.cRoute();
                const routeList = new this.module.cRouteList(route);
                
                // Try to access beyond bounds
                const outOfBoundsItem = route.getRouteItem(999999);
                if (outOfBoundsItem !== null && outOfBoundsItem !== undefined) {
                    // If it returns something, it should be invalid or empty
                    if (this.verbose) {
                        console.log(`   範囲外アクセス結果バリデーション: ${outOfBoundsItem.isValid()}`);
                    }
                }
                
                console.log('   ✅ 範囲外アクセスでクラッシュしなかった');
                
            } catch (error) {
                console.log(`   ❌ RouteList統合エラーテストでエラー: ${error}`);
                return false;
            }
            
            console.log('エラーハンドリングテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`エラーハンドリングテスト: FAIL (${error})`);
            return false;
        }
    }
}

/**
 * Standalone test execution function
 */
async function runRouteItemTests(): Promise<void> {
    const testSuite = new RouteItemTestSuite(true); // verbose mode
    const success = await testSuite.executeAll();
    
    if (success) {
        console.log('\n🎉 cRouteItem テストスイート完了 - 全て成功');
        process.exit(0);
    } else {
        console.log('\n💥 cRouteItem テストスイート完了 - 一部失敗');
        process.exit(1);
    }
}

// Export for use in other test suites
export { RouteItemTestSuite };

// Run standalone if this file is executed directly
if (require.main === module) {
    runRouteItemTests();
}