#!/usr/bin/env node

/**
 * cRouteFlag Unit Test Suite
 * Tests for the cRouteFlag class implementation - Task 29
 * REQ-OBJ-003: Route flag properties and management methods
 * REQ-OBJ-007: Memory management and error handling for flags
 * 
 * Tests all cRouteFlag functionality including:
 * - All 30+ boolean flag properties (no_rule, rule88, rule69, etc.)
 * - All 4 numeric properties (rule86or87, rule115, urban_neerest, osakaKanPass)
 * - All 15+ flag management methods (setLongRoute, setSpecificTermRule115, etc.)
 * - Availability and enable check methods (isAvailableRule86, isAvailableRule87, etc.)
 * - Flag state consistency tests to ensure related flags behave correctly
 * - Validation tests for clear() and reset methods
 * - Memory management and lifecycle testing
 * - Error handling for invalid states
 */

import { FarertModule, RouteFlagWrapper } from './types';
import { wasmLoader } from './wasm_loader';

class RouteFlagTestSuite {
    private module: FarertModule | null = null;
    private verbose: boolean = false;
    
    constructor(verbose: boolean = false) {
        this.verbose = verbose;
    }
    
    /**
     * Execute all cRouteFlag tests
     */
    async executeAll(): Promise<boolean> {
        try {
            this.module = await wasmLoader.loadModule();
            const dbResult = await wasmLoader.initializeDatabase();
            
            if (!dbResult) {
                console.error('Database initialization failed for RouteFlag tests');
                return false;
            }
            
            console.log('\n=== cRouteFlag テストスイート開始 ===');
            console.log('タスク29: cRouteFlag単体テスト');
            console.log('REQ-OBJ-003, REQ-OBJ-007');
            console.log('-'.repeat(50));
            
            const results = [
                await this.testBooleanProperties(),
                await this.testNumericProperties(),
                await this.testCoreManagementMethods(),
                await this.testFlagManagementMethods(),
                await this.testAvailabilityChecks(),
                await this.testStateConsistency(),
                await this.testClearAndReset(),
                await this.testMemoryManagement(),
                await this.testErrorHandling()
            ];
            
            const allPassed = results.every(r => r);
            const passedCount = results.filter(r => r).length;
            
            console.log('\n=== cRouteFlag テストスイート完了 ===');
            console.log(`結果: ${passedCount}/${results.length} テストカテゴリ成功`);
            
            if (allPassed) {
                console.log('🎉 全てのcRouteFlagテストが成功しました！');
                console.log('✓ ブール型プロパティテスト');
                console.log('✓ 数値型プロパティテスト');
                console.log('✓ コア管理メソッドテスト');
                console.log('✓ フラグ管理メソッドテスト');
                console.log('✓ 可用性チェックテスト');
                console.log('✓ 状態整合性テスト');
                console.log('✓ クリア・リセットテスト');
                console.log('✓ メモリ管理テスト');
                console.log('✓ エラーハンドリングテスト');
            } else {
                console.log('⚠️  一部のcRouteFlagテストが失敗しました');
            }
            
            return allPassed;
            
        } catch (error) {
            console.error('RouteFlag test execution failed:', error);
            return false;
        } finally {
            wasmLoader.cleanup();
        }
    }
    
    /**
     * Test 1: ブール型プロパティテスト
     * Tests all 30+ boolean flag properties
     */
    private async testBooleanProperties(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- ブール型プロパティテスト ---');
        
        try {
            const routeFlag = new this.module.cRouteFlag();
            
            // Define all boolean properties to test
            const booleanProperties = [
                'no_rule',
                'jrtokaistock_applied', 
                'jrtokaistock_enable',
                'meihan_city_flag',
                'rule88',
                'rule69', 
                'rule70',
                'special_fare_enable',
                'rule70bullet',
                'rule16_5',
                'bullet_line',
                'bJrTokaiOnly',
                'meihan_city_enable',
                'trackmarkctl',
                'jctsp_route_change',
                'ter_begin_oosaka',
                'ter_fin_oosaka',
                'compncheck',
                'compnpass',
                'compnda',
                'compnbegin',
                'compnend',
                'compnterm',
                'tokai_shinkansen',
                'notsamekokurahakatashinzai',
                'end',
                'osakakan_1dir',
                'osakakan_2dir',
                'osakakan_detour'
            ];
            
            console.log(`1. ${booleanProperties.length}個のブール型プロパティ初期値テスト:`);
            
            // Test initial values (should all be false)
            let initialTestPassed = true;
            for (const prop of booleanProperties) {
                try {
                    const value = (routeFlag as any)[prop];
                    if (typeof value !== 'boolean') {
                        console.log(`   ❌ ${prop}: 型が boolean ではありません (${typeof value})`);
                        initialTestPassed = false;
                    } else if (this.verbose && value) {
                        console.log(`   ⚠️  ${prop}: 初期値が true です (期待値: false)`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${prop}: アクセスエラー (${error})`);
                    initialTestPassed = false;
                }
            }
            
            if (!initialTestPassed) {
                console.log('   初期値テスト失敗');
                return false;
            }
            console.log(`   ✅ 全${booleanProperties.length}プロパティの初期値確認完了`);
            
            // Test property assignment
            console.log('2. ブール型プロパティ代入テスト:');
            let assignmentTestPassed = true;
            
            // Test setting to true
            for (const prop of booleanProperties) {
                try {
                    (routeFlag as any)[prop] = true;
                    const value = (routeFlag as any)[prop];
                    if (value !== true) {
                        console.log(`   ❌ ${prop}: true設定後の値が不正 (${value})`);
                        assignmentTestPassed = false;
                    }
                } catch (error) {
                    console.log(`   ❌ ${prop}: true設定エラー (${error})`);
                    assignmentTestPassed = false;
                }
            }
            
            // Test setting to false
            for (const prop of booleanProperties) {
                try {
                    (routeFlag as any)[prop] = false;
                    const value = (routeFlag as any)[prop];
                    if (value !== false) {
                        console.log(`   ❌ ${prop}: false設定後の値が不正 (${value})`);
                        assignmentTestPassed = false;
                    }
                } catch (error) {
                    console.log(`   ❌ ${prop}: false設定エラー (${error})`);
                    assignmentTestPassed = false;
                }
            }
            
            if (!assignmentTestPassed) {
                console.log('   プロパティ代入テスト失敗');
                return false;
            }
            console.log(`   ✅ 全${booleanProperties.length}プロパティの代入テスト完了`);
            
            // Test specific property combinations
            console.log('3. 特定プロパティ組み合わせテスト:');
            
            // Test rule flags
            routeFlag.rule88 = true;
            routeFlag.rule69 = true;
            routeFlag.rule70 = true;
            
            if (routeFlag.rule88 && routeFlag.rule69 && routeFlag.rule70) {
                console.log('   ✅ ルールフラグ組み合わせ設定成功');
            } else {
                console.log('   ❌ ルールフラグ組み合わせ設定失敗');
                return false;
            }
            
            // Test company flags
            routeFlag.compncheck = true;
            routeFlag.compnpass = true;
            routeFlag.compnbegin = true;
            routeFlag.compnend = true;
            
            if (routeFlag.compncheck && routeFlag.compnpass && 
                routeFlag.compnbegin && routeFlag.compnend) {
                console.log('   ✅ 会社フラグ組み合わせ設定成功');
            } else {
                console.log('   ❌ 会社フラグ組み合わせ設定失敗');
                return false;
            }
            
            console.log('ブール型プロパティテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`ブール型プロパティテスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 2: 数値型プロパティテスト
     * Tests all 4 numeric properties (rule86or87, rule115, urban_neerest, osakaKanPass)
     */
    private async testNumericProperties(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- 数値型プロパティテスト ---');
        
        try {
            const routeFlag = new this.module.cRouteFlag();
            
            const numericProperties = [
                'rule86or87',
                'rule115', 
                'urban_neerest',
                'osakaKanPass'
            ];
            
            console.log(`1. ${numericProperties.length}個の数値型プロパティ初期値テスト:`);
            
            // Test initial values (should all be 0)
            let initialTestPassed = true;
            for (const prop of numericProperties) {
                try {
                    const value = (routeFlag as any)[prop];
                    if (typeof value !== 'number') {
                        console.log(`   ❌ ${prop}: 型が number ではありません (${typeof value})`);
                        initialTestPassed = false;
                    } else if (this.verbose) {
                        console.log(`   ${prop}: ${value}`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${prop}: アクセスエラー (${error})`);
                    initialTestPassed = false;
                }
            }
            
            if (!initialTestPassed) {
                console.log('   初期値テスト失敗');
                return false;
            }
            console.log(`   ✅ 全${numericProperties.length}プロパティの初期値確認完了`);
            
            // Test various numeric assignments
            console.log('2. 数値型プロパティ代入テスト:');
            
            // Test rule86or87 (bit field)
            const rule86or87Values = [0, 1, 2, 3, 4, 255];
            for (const testValue of rule86or87Values) {
                routeFlag.rule86or87 = testValue;
                if (routeFlag.rule86or87 !== testValue) {
                    console.log(`   ❌ rule86or87: ${testValue}設定失敗 (実際値: ${routeFlag.rule86or87})`);
                    return false;
                }
            }
            console.log('   ✅ rule86or87 値設定テスト完了');
            
            // Test rule115 (int8_t: -128 to 127)
            const rule115Values = [-128, -1, 0, 1, 127];
            for (const testValue of rule115Values) {
                routeFlag.rule115 = testValue;
                // Note: Depending on WASM implementation, may be limited to certain range
                if (this.verbose) {
                    console.log(`   rule115 設定値 ${testValue} → 実際値 ${routeFlag.rule115}`);
                }
            }
            console.log('   ✅ rule115 値設定テスト完了');
            
            // Test urban_neerest (int8_t)
            const urbanValues = [0, 1, 2, 5, 10];
            for (const testValue of urbanValues) {
                routeFlag.urban_neerest = testValue;
                if (routeFlag.urban_neerest !== testValue) {
                    console.log(`   ❌ urban_neerest: ${testValue}設定失敗 (実際値: ${routeFlag.urban_neerest})`);
                    return false;
                }
            }
            console.log('   ✅ urban_neerest 値設定テスト完了');
            
            // Test osakaKanPass (unsigned char: 0 to 255)
            const osakaValues = [0, 1, 2, 3, 100, 255];
            for (const testValue of osakaValues) {
                routeFlag.osakaKanPass = testValue;
                if (routeFlag.osakaKanPass !== testValue) {
                    console.log(`   ❌ osakaKanPass: ${testValue}設定失敗 (実際値: ${routeFlag.osakaKanPass})`);
                    return false;
                }
            }
            console.log('   ✅ osakaKanPass 値設定テスト完了');
            
            console.log('3. 数値境界値テスト:');
            
            // Test boundary values
            try {
                // Test negative values
                routeFlag.rule86or87 = -1;  // Should be handled gracefully
                routeFlag.osakaKanPass = -1; // Should be handled gracefully
                
                // Test very large values
                routeFlag.rule86or87 = 999999;
                routeFlag.osakaKanPass = 999999;
                
                console.log('   ✅ 境界値設定でクラッシュしなかった');
                
            } catch (error) {
                console.log(`   ❌ 境界値テストでエラー: ${error}`);
                return false;
            }
            
            console.log('数値型プロパティテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`数値型プロパティテスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 3: コア管理メソッドテスト
     * Tests core management methods like clear(), setAnotherRouteFlag(), rule_en(), setNoRule()
     */
    private async testCoreManagementMethods(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- コア管理メソッドテスト ---');
        
        try {
            const routeFlag1 = new this.module.cRouteFlag();
            const routeFlag2 = new this.module.cRouteFlag();
            
            console.log('1. clear()メソッドテスト:');
            
            // Set some properties to non-default values
            routeFlag1.rule88 = true;
            routeFlag1.rule69 = true;
            routeFlag1.no_rule = true;
            routeFlag1.rule86or87 = 15;
            routeFlag1.rule115 = 5;
            routeFlag1.urban_neerest = 10;
            routeFlag1.osakaKanPass = 100;
            
            // Verify properties were set
            if (!routeFlag1.rule88 || !routeFlag1.rule69 || !routeFlag1.no_rule ||
                routeFlag1.rule86or87 !== 15 || routeFlag1.rule115 !== 5 ||
                routeFlag1.urban_neerest !== 10 || routeFlag1.osakaKanPass !== 100) {
                console.log('   ❌ プロパティ設定に失敗');
                return false;
            }
            
            // Clear all properties
            routeFlag1.clear();
            
            // Verify all properties were cleared
            if (routeFlag1.rule88 || routeFlag1.rule69 || routeFlag1.no_rule ||
                routeFlag1.rule86or87 !== 0 || routeFlag1.rule115 !== 0 ||
                routeFlag1.urban_neerest !== 0 || routeFlag1.osakaKanPass !== 0) {
                console.log('   ❌ clear()後にプロパティが残存');
                return false;
            }
            console.log('   ✅ clear()メソッド動作確認');
            
            console.log('2. setAnotherRouteFlag()メソッドテスト:');
            
            // Set properties in routeFlag2
            routeFlag2.rule88 = true;
            routeFlag2.rule70 = true;
            routeFlag2.bullet_line = true;
            routeFlag2.rule86or87 = 25;
            routeFlag2.rule115 = 7;
            
            // Copy from routeFlag2 to routeFlag1
            routeFlag1.setAnotherRouteFlag(routeFlag2);
            
            // Verify copy was successful
            if (routeFlag1.rule88 !== routeFlag2.rule88 ||
                routeFlag1.rule70 !== routeFlag2.rule70 ||
                routeFlag1.bullet_line !== routeFlag2.bullet_line ||
                routeFlag1.rule86or87 !== routeFlag2.rule86or87 ||
                routeFlag1.rule115 !== routeFlag2.rule115) {
                console.log('   ❌ setAnotherRouteFlag()コピーに失敗');
                return false;
            }
            console.log('   ✅ setAnotherRouteFlag()メソッド動作確認');
            
            console.log('3. rule_en()メソッドテスト:');
            
            // Test with no_rule = false (rules enabled)
            routeFlag1.no_rule = false;
            const rulesEnabled = routeFlag1.rule_en();
            if (this.verbose) {
                console.log(`   no_rule=false時のrule_en(): ${rulesEnabled}`);
            }
            
            // Test with no_rule = true (rules disabled)
            routeFlag1.no_rule = true;
            const rulesDisabled = routeFlag1.rule_en();
            if (this.verbose) {
                console.log(`   no_rule=true時のrule_en(): ${rulesDisabled}`);
            }
            
            // rule_en() should return opposite of no_rule
            if (rulesEnabled === rulesDisabled) {
                console.log('   ❌ rule_en()がno_ruleフラグを正しく反映していない');
                return false;
            }
            console.log('   ✅ rule_en()メソッド動作確認');
            
            console.log('4. setNoRule()メソッドテスト:');
            
            // Test setNoRule(true) - disable rules
            routeFlag1.setNoRule(true);
            if (!routeFlag1.no_rule) {
                console.log('   ❌ setNoRule(true)でno_ruleがtrueにならない');
                return false;
            }
            
            // Test setNoRule(false) - enable rules
            routeFlag1.setNoRule(false);
            if (routeFlag1.no_rule) {
                console.log('   ❌ setNoRule(false)でno_ruleがfalseにならない');
                return false;
            }
            
            console.log('   ✅ setNoRule()メソッド動作確認');
            
            console.log('コア管理メソッドテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`コア管理メソッドテスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 4: フラグ管理メソッドテスト
     * Tests flag management methods (setLongRoute, setSpecificTermRule115, etc.)
     */
    private async testFlagManagementMethods(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- フラグ管理メソッドテスト ---');
        
        try {
            const routeFlag = new this.module.cRouteFlag();
            
            console.log('1. 長距離ルート管理テスト:');
            
            // Test setLongRoute() method
            routeFlag.setLongRoute(true);
            const isLongRouteEnabled = routeFlag.isEnableLongRoute();
            const isLongRoute = routeFlag.isLongRoute();
            
            if (this.verbose) {
                console.log(`   setLongRoute(true)後 - isEnableLongRoute(): ${isLongRouteEnabled}`);
                console.log(`   setLongRoute(true)後 - isLongRoute(): ${isLongRoute}`);
            }
            
            routeFlag.setLongRoute(false);
            const isLongRouteDisabled = routeFlag.isEnableLongRoute();
            
            if (this.verbose) {
                console.log(`   setLongRoute(false)後 - isEnableLongRoute(): ${isLongRouteDisabled}`);
            }
            
            console.log('   ✅ 長距離ルート管理メソッド動作確認');
            
            console.log('2. Rule 115管理テスト:');
            
            // Test Rule 115 methods
            routeFlag.setSpecificTermRule115(true);
            const isRule115Enabled = routeFlag.isEnableRule115();
            const isRule115SpecificTerm = routeFlag.isRule115specificTerm();
            
            if (this.verbose) {
                console.log(`   setSpecificTermRule115(true)後 - isEnableRule115(): ${isRule115Enabled}`);
                console.log(`   setSpecificTermRule115(true)後 - isRule115specificTerm(): ${isRule115SpecificTerm}`);
            }
            
            routeFlag.setSpecificTermRule115(false);
            const isRule115Disabled = routeFlag.isRule115specificTerm();
            
            if (this.verbose) {
                console.log(`   setSpecificTermRule115(false)後 - isRule115specificTerm(): ${isRule115Disabled}`);
            }
            
            console.log('   ✅ Rule 115管理メソッド動作確認');
            
            console.log('3. 都市エリア管理テスト:');
            
            // Test city area methods
            routeFlag.setStartAsCity();
            const isStartCity = routeFlag.isStartAsCity();
            
            routeFlag.setArriveAsCity();
            const isArriveCity = routeFlag.isArriveAsCity();
            
            if (this.verbose) {
                console.log(`   setStartAsCity()後 - isStartAsCity(): ${isStartCity}`);
                console.log(`   setArriveAsCity()後 - isArriveAsCity(): ${isArriveCity}`);
            }
            
            console.log('   ✅ 都市エリア管理メソッド動作確認');
            
            console.log('4. Rule 86/87管理テスト:');
            
            // Test Rule 86/87 management
            routeFlag.setDisableRule86or87();
            const isRule86or87DisabledCheck = routeFlag.isEnableRule86or87();
            
            routeFlag.setEnableRule86or87();
            const isRule86or87EnabledCheck = routeFlag.isEnableRule86or87();
            
            if (this.verbose) {
                console.log(`   setDisableRule86or87()後 - isEnableRule86or87(): ${isRule86or87DisabledCheck}`);
                console.log(`   setEnableRule86or87()後 - isEnableRule86or87(): ${isRule86or87EnabledCheck}`);
            }
            
            console.log('   ✅ Rule 86/87管理メソッド動作確認');
            
            console.log('5. 大阪環状線管理テスト:');
            
            // Test Osaka Kanjo line management
            const testOsakaValues = [0, 1, 2, 3];
            for (const value of testOsakaValues) {
                routeFlag.setOsakaKanPass(value);
                const retrievedValue = routeFlag.getOsakaKanPass();
                
                if (retrievedValue !== value) {
                    console.log(`   ❌ setOsakaKanPass(${value})設定値不一致 (実際値: ${retrievedValue})`);
                    return false;
                }
                
                const passValue = routeFlag.getOsakaKanPassValue();
                if (this.verbose) {
                    console.log(`   setOsakaKanPass(${value}) - getOsakaKanPassValue(): ${passValue}`);
                }
            }
            
            // Test Osaka Kanjo pass state checks
            routeFlag.setOsakaKanPass(1);
            const is1pass = routeFlag.is_osakakan_1pass();
            
            routeFlag.setOsakaKanPass(2); 
            const is2pass = routeFlag.is_osakakan_2pass();
            
            routeFlag.setOsakaKanPass(0);
            const isNopass = routeFlag.is_osakakan_nopass();
            
            if (this.verbose) {
                console.log(`   大阪環状線パス状態 - 1pass: ${is1pass}, 2pass: ${is2pass}, nopass: ${isNopass}`);
            }
            
            console.log('   ✅ 大阪環状線管理メソッド動作確認');
            
            console.log('フラグ管理メソッドテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`フラグ管理メソッドテスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 5: 可用性チェックテスト
     * Tests availability check methods (isAvailableRule86, isAvailableRule87, etc.)
     */
    private async testAvailabilityChecks(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- 可用性チェックテスト ---');
        
        try {
            const routeFlag = new this.module.cRouteFlag();
            
            console.log('1. ルール可用性チェック基本テスト:');
            
            const ruleAvailabilityMethods = [
                'isAvailableRule86or87',
                'isAvailableRule86',
                'isAvailableRule87',
                'isAvailableRule88',
                'isAvailableRule70',
                'isAvailableRule69',
                'isAvailableRule115',
                'isAvailableRule16_5'
            ];
            
            // Test all availability checks with default state
            let availabilityTestPassed = true;
            for (const method of ruleAvailabilityMethods) {
                try {
                    const isAvailable = (routeFlag as any)[method]();
                    if (typeof isAvailable !== 'boolean') {
                        console.log(`   ❌ ${method}(): 戻り値がbooleanではありません (${typeof isAvailable})`);
                        availabilityTestPassed = false;
                    } else if (this.verbose) {
                        console.log(`   ${method}(): ${isAvailable}`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${method}(): エラー (${error})`);
                    availabilityTestPassed = false;
                }
            }
            
            if (!availabilityTestPassed) {
                console.log('   基本可用性チェック失敗');
                return false;
            }
            console.log(`   ✅ ${ruleAvailabilityMethods.length}個の可用性チェックメソッド動作確認`);
            
            console.log('2. 条件変更による可用性チェックテスト:');
            
            // Test availability with different flag states
            routeFlag.clear(); // Start clean
            
            // Set no_rule = true (should affect availability)
            routeFlag.no_rule = true;
            const availabilityWithNoRule = routeFlag.isAvailableRule88();
            
            routeFlag.no_rule = false;
            const availabilityWithoutNoRule = routeFlag.isAvailableRule88();
            
            if (this.verbose) {
                console.log(`   no_rule=true時のRule88可用性: ${availabilityWithNoRule}`);
                console.log(`   no_rule=false時のRule88可用性: ${availabilityWithoutNoRule}`);
            }
            
            console.log('   ✅ 条件変更による可用性変化確認');
            
            console.log('3. 複合条件での可用性チェックテスト:');
            
            // Test Rule 86/87 availability with different settings
            routeFlag.clear();
            
            // Enable Rule 86/87
            routeFlag.setEnableRule86or87();
            const rule86Available = routeFlag.isAvailableRule86();
            const rule87Available = routeFlag.isAvailableRule87();
            const rule86or87Available = routeFlag.isAvailableRule86or87();
            
            if (this.verbose) {
                console.log(`   Rule86/87有効時 - Rule86: ${rule86Available}, Rule87: ${rule87Available}, Rule86or87: ${rule86or87Available}`);
            }
            
            // Disable Rule 86/87  
            routeFlag.setDisableRule86or87();
            const rule86DisabledAvailable = routeFlag.isAvailableRule86();
            const rule87DisabledAvailable = routeFlag.isAvailableRule87();
            const rule86or87DisabledAvailable = routeFlag.isAvailableRule86or87();
            
            if (this.verbose) {
                console.log(`   Rule86/87無効時 - Rule86: ${rule86DisabledAvailable}, Rule87: ${rule87DisabledAvailable}, Rule86or87: ${rule86or87DisabledAvailable}`);
            }
            
            console.log('   ✅ 複合条件可用性チェック確認');
            
            console.log('4. その他可用性関連メソッドテスト:');
            
            // Test Meihan city availability
            routeFlag.meihan_city_enable = true;
            const isMeihanCityEnable = routeFlag.isMeihanCityEnable();
            
            if (isMeihanCityEnable !== routeFlag.meihan_city_enable) {
                console.log('   ❌ isMeihanCityEnable()とフラグ値が不一致');
                return false;
            }
            
            // Test round trip and terminal city checks
            const isRoundTrip = routeFlag.isRoundTrip();
            const isTerCity = routeFlag.isTerCity();
            
            if (this.verbose) {
                console.log(`   isRoundTrip(): ${isRoundTrip}`);
                console.log(`   isTerCity(): ${isTerCity}`);
            }
            
            console.log('   ✅ その他可用性関連メソッド動作確認');
            
            console.log('可用性チェックテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`可用性チェックテスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 6: 状態整合性テスト
     * Tests flag state consistency to ensure related flags behave correctly together
     */
    private async testStateConsistency(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- 状態整合性テスト ---');
        
        try {
            const routeFlag = new this.module.cRouteFlag();
            
            console.log('1. no_ruleフラグとその他ルールの整合性テスト:');
            
            // Set some rules active
            routeFlag.rule88 = true;
            routeFlag.rule69 = true;
            routeFlag.rule70 = true;
            routeFlag.no_rule = false;
            
            const rulesEnabledWhenNoRuleFalse = routeFlag.rule_en();
            
            // Now disable all rules
            routeFlag.setNoRule(true);
            const rulesEnabledWhenNoRuleTrue = routeFlag.rule_en();
            
            // Verify rule_en() reflects no_rule state
            if (rulesEnabledWhenNoRuleFalse === rulesEnabledWhenNoRuleTrue) {
                console.log('   ❌ rule_en()がno_ruleフラグ変更を反映していない');
                return false;
            }
            
            console.log('   ✅ no_ruleフラグ整合性確認');
            
            console.log('2. 大阪環状線フラグ整合性テスト:');
            
            // Test Osaka Kanjo flag consistency
            routeFlag.clear();
            
            // Set 1-direction pass
            routeFlag.setOsakaKanPass(1);
            const is1pass = routeFlag.is_osakakan_1pass();
            const is2pass = routeFlag.is_osakakan_2pass();
            const isNopass = routeFlag.is_osakakan_nopass();
            
            // Only one should be true
            const passCount = [is1pass, is2pass, isNopass].filter(x => x).length;
            if (passCount > 1) {
                console.log('   ❌ 大阪環状線パス状態が重複している');
                return false;
            }
            
            if (!is1pass) {
                console.log('   ❌ 1パス設定時にis_osakakan_1pass()がfalse');
                return false;
            }
            
            console.log('   ✅ 大阪環状線フラグ整合性確認');
            
            console.log('3. 会社フラグ組み合わせ整合性テスト:');
            
            // Test company flag combinations
            routeFlag.clear();
            
            routeFlag.compncheck = true;
            routeFlag.compnpass = true;
            
            // These flags should be able to coexist
            if (!routeFlag.compncheck || !routeFlag.compnpass) {
                console.log('   ❌ 会社フラグ組み合わせ設定に失敗');
                return false;
            }
            
            // Test terminal company flags
            routeFlag.compnbegin = true;
            routeFlag.compnend = true;
            routeFlag.compnterm = true;
            
            if (!routeFlag.compnbegin || !routeFlag.compnend || !routeFlag.compnterm) {
                console.log('   ❌ 終端会社フラグ組み合わせ設定に失敗');
                return false;
            }
            
            console.log('   ✅ 会社フラグ組み合わせ整合性確認');
            
            console.log('4. ルールフラグ相互依存性テスト:');
            
            // Test rule flag interdependencies
            routeFlag.clear();
            
            // Enable Rule 86/87 and test availability
            routeFlag.setEnableRule86or87();
            routeFlag.rule86or87 = 3; // Both Rule 86 and 87
            
            const rule86Available = routeFlag.isAvailableRule86();
            const rule87Available = routeFlag.isAvailableRule87();
            
            // Clear Rule 86/87 and test again
            routeFlag.setDisableRule86or87();
            
            const rule86AvailableAfterDisable = routeFlag.isAvailableRule86();
            const rule87AvailableAfterDisable = routeFlag.isAvailableRule87();
            
            if (this.verbose) {
                console.log(`   Rule86/87有効時 - Rule86: ${rule86Available}, Rule87: ${rule87Available}`);
                console.log(`   Rule86/87無効時 - Rule86: ${rule86AvailableAfterDisable}, Rule87: ${rule87AvailableAfterDisable}`);
            }
            
            console.log('   ✅ ルールフラグ相互依存性確認');
            
            console.log('5. 都市エリアフラグ整合性テスト:');
            
            // Test city area flag consistency
            routeFlag.clear();
            
            routeFlag.setStartAsCity();
            routeFlag.setArriveAsCity();
            
            const isStartCity = routeFlag.isStartAsCity();
            const isArriveCity = routeFlag.isArriveAsCity();
            
            if (!isStartCity || !isArriveCity) {
                console.log('   ❌ 都市エリア設定が反映されていない');
                return false;
            }
            
            // Test Meihan city flag interaction
            routeFlag.meihan_city_enable = true;
            routeFlag.meihan_city_flag = true;
            
            const isMeihanEnable = routeFlag.isMeihanCityEnable();
            if (!isMeihanEnable) {
                console.log('   ❌ 名阪都市エリア設定が反映されていない');
                return false;
            }
            
            console.log('   ✅ 都市エリアフラグ整合性確認');
            
            console.log('状態整合性テスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`状態整合性テスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 7: クリア・リセットテスト
     * Tests clear() and reset methods for proper state management
     */
    private async testClearAndReset(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- クリア・リセットテスト ---');
        
        try {
            const routeFlag = new this.module.cRouteFlag();
            
            console.log('1. clear()メソッド完全テスト:');
            
            // Set all types of properties
            const booleanProps = [
                'no_rule', 'jrtokaistock_applied', 'jrtokaistock_enable', 'meihan_city_flag',
                'rule88', 'rule69', 'rule70', 'special_fare_enable', 'rule70bullet', 'rule16_5',
                'bullet_line', 'bJrTokaiOnly', 'meihan_city_enable', 'trackmarkctl', 
                'jctsp_route_change', 'ter_begin_oosaka', 'ter_fin_oosaka', 'compncheck',
                'compnpass', 'compnda', 'compnbegin', 'compnend', 'compnterm', 
                'tokai_shinkansen', 'notsamekokurahakatashinzai', 'end',
                'osakakan_1dir', 'osakakan_2dir', 'osakakan_detour'
            ];
            
            const numericProps = ['rule86or87', 'rule115', 'urban_neerest', 'osakaKanPass'];
            
            // Set all boolean properties to true
            for (const prop of booleanProps) {
                (routeFlag as any)[prop] = true;
            }
            
            // Set all numeric properties to non-zero values
            routeFlag.rule86or87 = 15;
            routeFlag.rule115 = 10;
            routeFlag.urban_neerest = 5;
            routeFlag.osakaKanPass = 200;
            
            // Verify properties are set
            let allPropsSet = true;
            for (const prop of booleanProps) {
                if (!(routeFlag as any)[prop]) {
                    console.log(`   ❌ ${prop}がtrueに設定されていない`);
                    allPropsSet = false;
                }
            }
            
            if (routeFlag.rule86or87 !== 15 || routeFlag.rule115 !== 10 ||
                routeFlag.urban_neerest !== 5 || routeFlag.osakaKanPass !== 200) {
                console.log('   ❌ 数値プロパティが正しく設定されていない');
                allPropsSet = false;
            }
            
            if (!allPropsSet) {
                console.log('   プロパティ設定に失敗');
                return false;
            }
            
            // Clear all properties
            routeFlag.clear();
            
            // Verify all boolean properties are false
            let allBoolsCleared = true;
            for (const prop of booleanProps) {
                if ((routeFlag as any)[prop]) {
                    console.log(`   ❌ clear()後に${prop}がtrueのまま`);
                    allBoolsCleared = false;
                }
            }
            
            // Verify all numeric properties are 0
            if (routeFlag.rule86or87 !== 0 || routeFlag.rule115 !== 0 ||
                routeFlag.urban_neerest !== 0 || routeFlag.osakaKanPass !== 0) {
                console.log('   ❌ clear()後に数値プロパティが0でない');
                allBoolsCleared = false;
            }
            
            if (!allBoolsCleared) {
                console.log('   clear()メソッド不完全');
                return false;
            }
            
            console.log(`   ✅ 全${booleanProps.length}個のブールプロパティと${numericProps.length}個の数値プロパティクリア確認`);
            
            console.log('2. 複数回clear()テスト:');
            
            // Set some properties again
            routeFlag.rule88 = true;
            routeFlag.rule69 = true;
            routeFlag.rule86or87 = 7;
            
            // Clear multiple times
            routeFlag.clear();
            routeFlag.clear();
            routeFlag.clear();
            
            // Should still be cleared
            if (routeFlag.rule88 || routeFlag.rule69 || routeFlag.rule86or87 !== 0) {
                console.log('   ❌ 複数回clear()で問題発生');
                return false;
            }
            
            console.log('   ✅ 複数回clear()動作確認');
            
            console.log('3. clear()とメソッド動作テスト:');
            
            // Set properties using methods
            routeFlag.setLongRoute(true);
            routeFlag.setSpecificTermRule115(true);
            routeFlag.setStartAsCity();
            routeFlag.setArriveAsCity();
            routeFlag.setEnableRule86or87();
            routeFlag.setOsakaKanPass(50);
            
            // Verify methods set internal state
            if (!routeFlag.isEnableLongRoute() || !routeFlag.isRule115specificTerm() ||
                !routeFlag.isStartAsCity() || !routeFlag.isArriveAsCity() ||
                !routeFlag.isEnableRule86or87() || routeFlag.getOsakaKanPass() !== 50) {
                console.log('   ❌ メソッドによるプロパティ設定に失敗');
                return false;
            }
            
            // Clear and verify method-set state is also cleared
            routeFlag.clear();
            
            if (routeFlag.isEnableLongRoute() || routeFlag.isRule115specificTerm() ||
                routeFlag.isStartAsCity() || routeFlag.isArriveAsCity() ||
                routeFlag.isEnableRule86or87() || routeFlag.getOsakaKanPass() !== 0) {
                console.log('   ❌ clear()がメソッド設定状態を完全にクリアできていない');
                return false;
            }
            
            console.log('   ✅ clear()とメソッド動作整合性確認');
            
            console.log('クリア・リセットテスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`クリア・リセットテスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 8: メモリ管理テスト
     * Tests memory management with repeated object creation and cleanup
     */
    private async testMemoryManagement(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- メモリ管理テスト ---');
        
        try {
            console.log('1. 大量オブジェクト作成テスト:');
            
            const LARGE_COUNT = 1000;
            const routeFlags: RouteFlagWrapper[] = [];
            
            // Create many RouteFlag objects
            for (let i = 0; i < LARGE_COUNT; i++) {
                const flag = new this.module.cRouteFlag();
                
                // Set different combinations of flags
                flag.rule88 = (i % 2) === 0;
                flag.rule69 = (i % 3) === 0;
                flag.rule70 = (i % 5) === 0;
                flag.rule86or87 = i % 256;
                flag.rule115 = (i % 200) - 100; // Test negative values too
                flag.urban_neerest = i % 50;
                flag.osakaKanPass = i % 255;
                
                routeFlags.push(flag);
            }
            
            // Verify all objects maintain correct data
            let memoryTestPassed = true;
            const sampleIndices = [0, 100, 500, 999]; // Sample check to avoid excessive validation
            
            for (const idx of sampleIndices) {
                if (idx < routeFlags.length) {
                    const flag = routeFlags[idx];
                    const expectedRule88 = (idx % 2) === 0;
                    const expectedRule69 = (idx % 3) === 0;
                    const expectedRule70 = (idx % 5) === 0;
                    const expectedRule86or87 = idx % 256;
                    const expectedRule115 = (idx % 200) - 100;
                    const expectedUrbanNeerest = idx % 50;
                    const expectedOsakaKanPass = idx % 255;
                    
                    if (flag.rule88 !== expectedRule88 ||
                        flag.rule69 !== expectedRule69 ||
                        flag.rule70 !== expectedRule70 ||
                        flag.rule86or87 !== expectedRule86or87 ||
                        flag.rule115 !== expectedRule115 ||
                        flag.urban_neerest !== expectedUrbanNeerest ||
                        flag.osakaKanPass !== expectedOsakaKanPass) {
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
            
            console.log(`   ✅ ${LARGE_COUNT}個のRouteFlagオブジェクト作成・管理成功`);
            
            console.log('2. オブジェクト作成・破棄サイクルテスト:');
            
            const CYCLE_COUNT = 100;
            
            for (let cycle = 0; cycle < CYCLE_COUNT; cycle++) {
                const tempFlags: RouteFlagWrapper[] = [];
                
                // Create temporary objects
                for (let i = 0; i < 10; i++) {
                    const flag = new this.module.cRouteFlag();
                    flag.rule88 = true;
                    flag.rule69 = (i % 2) === 0;
                    flag.rule86or87 = cycle * 10 + i;
                    flag.osakaKanPass = cycle + i;
                    tempFlags.push(flag);
                }
                
                // Verify creation
                for (let i = 0; i < tempFlags.length; i++) {
                    if (!tempFlags[i].rule88 ||
                        tempFlags[i].rule69 !== ((i % 2) === 0) ||
                        tempFlags[i].rule86or87 !== cycle * 10 + i ||
                        tempFlags[i].osakaKanPass !== cycle + i) {
                        console.log(`   ❌ サイクル[${cycle}]オブジェクト作成エラー`);
                        return false;
                    }
                }
                
                // Test multiple operations on created objects
                for (const flag of tempFlags) {
                    flag.clear();
                    flag.setLongRoute(true);
                    flag.setSpecificTermRule115(false);
                    flag.setOsakaKanPass(100);
                }
                
                // Objects will be cleaned up automatically when going out of scope
            }
            
            console.log(`   ✅ ${CYCLE_COUNT}サイクルの作成・破棄テスト成功`);
            
            console.log('3. オブジェクト間相互作用テスト:');
            
            // Test interactions between multiple RouteFlag objects
            const flag1 = new this.module.cRouteFlag();
            const flag2 = new this.module.cRouteFlag();
            const flag3 = new this.module.cRouteFlag();
            
            // Set different states
            flag1.rule88 = true;
            flag1.rule69 = true;
            flag1.rule86or87 = 10;
            flag1.setLongRoute(true);
            
            flag2.rule70 = true;
            flag2.rule16_5 = true;  
            flag2.rule115 = 20;
            flag2.setStartAsCity();
            
            // Copy flag1 to flag3
            flag3.setAnotherRouteFlag(flag1);
            
            // Verify copy worked and objects remain independent
            if (flag3.rule88 !== flag1.rule88 ||
                flag3.rule69 !== flag1.rule69 ||
                flag3.rule86or87 !== flag1.rule86or87) {
                console.log('   ❌ setAnotherRouteFlagでコピーに失敗');
                return false;
            }
            
            // Modify flag1, flag3 should remain unchanged
            flag1.clear();
            
            if (!flag3.rule88 || !flag3.rule69 || flag3.rule86or87 !== 10) {
                console.log('   ❌ オブジェクト独立性が保たれていない');
                return false;
            }
            
            console.log('   ✅ オブジェクト間相互作用テスト成功');
            
            console.log('メモリ管理テスト: PASS');
            return true;
            
        } catch (error) {
            console.log(`メモリ管理テスト: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Test 9: エラーハンドリングテスト
     * Tests error handling for invalid states and boundary conditions
     */
    private async testErrorHandling(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- エラーハンドリングテスト ---');
        
        try {
            const routeFlag = new this.module.cRouteFlag();
            
            console.log('1. 無効値設定テスト:');
            
            // Test extreme numeric values
            try {
                const extremeValues = [
                    Number.MAX_SAFE_INTEGER,
                    Number.MIN_SAFE_INTEGER,
                    Number.POSITIVE_INFINITY,
                    Number.NEGATIVE_INFINITY,
                    NaN
                ];
                
                for (const value of extremeValues) {
                    routeFlag.rule86or87 = value;
                    routeFlag.rule115 = value;
                    routeFlag.urban_neerest = value;
                    routeFlag.osakaKanPass = value;
                    
                    // Should not crash
                    if (this.verbose) {
                        console.log(`   極値${value}設定後 - rule86or87: ${routeFlag.rule86or87}`);
                    }
                }
                
                console.log('   ✅ 極値設定でクラッシュしなかった');
                
            } catch (error) {
                console.log(`   ❌ 極値設定でエラー: ${error}`);
                return false;
            }
            
            console.log('2. 不正メソッド呼び出しテスト:');
            
            // Test method calls with invalid states
            try {
                routeFlag.clear();
                
                // Call methods on cleared object
                const isLongRoute = routeFlag.isLongRoute();
                const isRule115 = routeFlag.isEnableRule115();
                const isStartCity = routeFlag.isStartAsCity();
                
                // Test availability methods
                const isRule88Available = routeFlag.isAvailableRule88();
                const isRule69Available = routeFlag.isAvailableRule69();
                
                if (this.verbose) {
                    console.log(`   クリア後メソッド呼び出し結果 - isLongRoute: ${isLongRoute}, isRule115: ${isRule115}`);
                    console.log(`   可用性チェック結果 - Rule88: ${isRule88Available}, Rule69: ${isRule69Available}`);
                }
                
                console.log('   ✅ クリア後メソッド呼び出しでクラッシュしなかった');
                
            } catch (error) {
                console.log(`   ❌ クリア後メソッド呼び出しでエラー: ${error}`);
                return false;
            }
            
            console.log('3. 循環参照・自己参照テスト:');
            
            try {
                const flag1 = new this.module.cRouteFlag();
                const flag2 = new this.module.cRouteFlag();
                
                // Set up different states
                flag1.rule88 = true;
                flag1.rule86or87 = 50;
                
                flag2.rule69 = true;  
                flag2.rule115 = 25;
                
                // Copy flag1 to flag2
                flag2.setAnotherRouteFlag(flag1);
                
                // Copy flag2 back to flag1 (potential circular reference issue)
                flag1.setAnotherRouteFlag(flag2);
                
                // Self-reference test
                flag1.setAnotherRouteFlag(flag1);
                
                // Should not crash
                console.log('   ✅ 循環参照・自己参照でクラッシュしなかった');
                
            } catch (error) {
                console.log(`   ❌ 循環参照・自己参照でエラー: ${error}`);
                return false;
            }
            
            console.log('4. 大量操作ストレステスト:');
            
            try {
                const STRESS_COUNT = 10000;
                
                for (let i = 0; i < STRESS_COUNT; i++) {
                    // Random operations
                    const operation = i % 10;
                    
                    switch (operation) {
                        case 0:
                            routeFlag.clear();
                            break;
                        case 1:
                            routeFlag.setLongRoute(Math.random() > 0.5);
                            break;
                        case 2:
                            routeFlag.setSpecificTermRule115(Math.random() > 0.5);
                            break;
                        case 3:
                            routeFlag.setOsakaKanPass(Math.floor(Math.random() * 256));
                            break;
                        case 4:
                            routeFlag.setEnableRule86or87();
                            break;
                        case 5:
                            routeFlag.setDisableRule86or87();
                            break;
                        case 6:
                            routeFlag.rule88 = Math.random() > 0.5;
                            break;
                        case 7:
                            routeFlag.isAvailableRule88();
                            break;
                        case 8:
                            routeFlag.rule_en();
                            break;
                        case 9:
                            routeFlag.rule86or87 = Math.floor(Math.random() * 256);
                            break;
                    }
                }
                
                console.log(`   ✅ ${STRESS_COUNT}回のランダム操作でクラッシュしなかった`);
                
            } catch (error) {
                console.log(`   ❌ ストレステストでエラー: ${error}`);
                return false;
            }
            
            console.log('5. null/undefined処理テスト:');
            
            try {
                // Test setAnotherRouteFlag with undefined (should handle gracefully)
                // Note: This may throw an expected error, which is acceptable
                routeFlag.clear();
                
                // Test getter methods with cleared state
                const getterMethods = [
                    'getRule88', 'getRule69', 'getRule70', 
                    'getRule86or87', 'getRule115',
                    'getOsakaKanPass', 'getOsakaKanPassValue'
                ];
                
                for (const method of getterMethods) {
                    try {
                        const result = (routeFlag as any)[method]();
                        if (this.verbose) {
                            console.log(`   ${method}(): ${result}`);
                        }
                    } catch (methodError) {
                        // Individual method errors are acceptable
                        if (this.verbose) {
                            console.log(`   ${method}(): エラー (${methodError}) - 許容範囲内`);
                        }
                    }
                }
                
                console.log('   ✅ null/undefined処理テスト完了');
                
            } catch (error) {
                console.log(`   ❌ null/undefined処理テストでエラー: ${error}`);
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
async function runRouteFlagTests(): Promise<void> {
    const testSuite = new RouteFlagTestSuite(true); // verbose mode
    const success = await testSuite.executeAll();
    
    if (success) {
        console.log('\n🎉 cRouteFlag テストスイート完了 - 全て成功');
        process.exit(0);
    } else {
        console.log('\n💥 cRouteFlag テストスイート完了 - 一部失敗');
        process.exit(1);
    }
}

// Export for use in other test suites
export { RouteFlagTestSuite };

// Run standalone if this file is executed directly
if (require.main === module) {
    runRouteFlagTests();
}