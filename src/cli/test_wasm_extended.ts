/**
 * WebAssembly独自テスト実装 - 統合テストスイート (Task 34)
 * B群・C群API（フロントエンド用・WebAssembly独自API）のテスト
 * 6オブジェクトクラスの包括的テスト
 * 
 * 統合されたテストカテゴリ:
 * - フロントエンド用APIテスト (B群)
 * - 6オブジェクトクラステスト (C群) 
 * - JSON形式APIテスト (B群)
 * - CLAUDE.md Public APIテスト (C群)
 * - Enhanced Array Operationsテスト (Task 30)
 * - Route Flag Systemテスト (Task 29) 
 * - Error Handling Systemテスト (Task 31)
 * - Android Compatibilityテスト (Task 32)
 * - Object Lifecycle Managementテスト (Task 33)
 * 
 * これらはオリジナルのC++にない機能のため、TypeScript独自のテストロジックで実装
 * 全てのREQ-OBJ-*要件を満たし、メモリ管理・エラーハンドリング・互換性を包括的に検証
 */

import { FarertModule } from './types';
import { wasmLoader } from './wasm_loader';
import { ArrayOperationsTests } from './test_array_ops';
import { RouteFlagTestSuite } from './test_route_flag';
import { ErrorHandlingSystemTests } from './test_error_handling';
import { AndroidCompatibilityTests } from './test_android_compat';
import { ObjectLifecycleTests } from './test_lifecycle';

class WebAssemblyExtendedTests {
    private module: FarertModule | null = null;
    private verbose: boolean = false;
    
    constructor(verbose: boolean = false) {
        this.verbose = verbose;
    }
    
    /**
     * 全WebAssembly独自テストの実行
     */
    async executeAll(): Promise<boolean> {
        const overallStartTime = Date.now();
        let testCount = 0;
        let passedCount = 0;
        const testResults: { name: string; passed: boolean; duration: number; error?: string }[] = [];
        
        try {
            this.module = await wasmLoader.loadModule();
            const dbResult = await wasmLoader.initializeDatabase();
            
            if (!dbResult) {
                console.error('Database initialization failed for extended tests');
                return false;
            }
            
            console.log('\n=== WebAssembly独自テスト開始 ===');
            console.log('Task 34: 統合テストスイート実行');
            console.log('-'.repeat(60));
            
            // Define all test cases with metadata
            const testCases = [
                { name: 'Frontend APIs', method: () => this.testFrontendAPIs() },
                { name: 'Object Classes', method: () => this.testObjectClasses() },
                { name: 'JSON APIs', method: () => this.testJSONAPIs() },
                { name: 'CLAUDE.md Public APIs', method: () => this.testCLAUDEmdPublicAPIs() },
                { name: 'Enhanced Array Operations (Task 30)', method: () => this.testEnhancedArrayOperations() },
                { name: 'Route Flag System (Task 29)', method: () => this.testRouteFlagSystem() },
                { name: 'Error Handling System (Task 31)', method: () => this.testErrorHandlingSystem() },
                { name: 'Android Compatibility (Task 32)', method: () => this.testAndroidCompatibility() },
                { name: 'Object Lifecycle Management (Task 33)', method: () => this.testObjectLifecycleManagement() }
            ];
            
            // Execute each test with performance monitoring and error isolation
            for (const testCase of testCases) {
                const testStartTime = Date.now();
                let passed = false;
                let errorMessage: string | undefined;
                
                try {
                    console.log(`\n実行中: ${testCase.name}...`);
                    passed = await testCase.method();
                    passedCount += passed ? 1 : 0;
                } catch (error) {
                    console.error(`${testCase.name} で予期しないエラー:`, error);
                    errorMessage = error instanceof Error ? error.message : String(error);
                    passed = false;
                }
                
                const testDuration = Date.now() - testStartTime;
                testResults.push({
                    name: testCase.name,
                    passed,
                    duration: testDuration,
                    error: errorMessage
                });
                
                testCount++;
                
                // Performance monitoring for long-running tests
                if (testDuration > 30000) { // 30 seconds
                    console.log(`⚠️  ${testCase.name} took ${testDuration}ms (>30s) - consider optimization`);
                } else if (this.verbose) {
                    console.log(`  実行時間: ${testDuration}ms`);
                }
            }
            
            const overallDuration = Date.now() - overallStartTime;
            const allPassed = passedCount === testCount;
            
            // Comprehensive test summary
            console.log('\n' + '='.repeat(60));
            console.log('=== WebAssembly独自テスト完了 ===');
            console.log(`結果: ${passedCount}/${testCount} カテゴリ成功`);
            console.log(`総実行時間: ${overallDuration}ms`);
            
            if (allPassed) {
                console.log('🎉 全てのWebAssembly独自テストが成功しました！');
                console.log('✓ フロントエンド用APIテスト');
                console.log('✓ 6オブジェクトクラステスト');
                console.log('✓ JSON形式APIテスト');
                console.log('✓ CLAUDE.md Public APIテスト');
                console.log('✓ Enhanced Array Operationsテスト (Task 30)');
                console.log('✓ Route Flag Systemテスト (Task 29)');
                console.log('✓ Error Handling Systemテスト (Task 31)');
                console.log('✓ Android Compatibilityテスト (Task 32)');
                console.log('✓ Object Lifecycle Managementテスト (Task 33)');
                console.log('');
                console.log('📊 Performance Summary:');
                testResults.forEach(result => {
                    console.log(`  ${result.name}: ${result.duration}ms ${result.passed ? '✅' : '❌'}`);
                });
            } else {
                console.log('⚠️  一部のWebAssembly独自テストが失敗しました');
                console.log('');
                console.log('❌ Failed Tests:');
                testResults.filter(r => !r.passed).forEach(result => {
                    console.log(`  ${result.name}: ${result.error || '不明なエラー'}`);
                });
                console.log('');
                console.log('✅ Passed Tests:');
                testResults.filter(r => r.passed).forEach(result => {
                    console.log(`  ${result.name}: ${result.duration}ms`);
                });
            }
            
            return allPassed;
            
        } catch (error) {
            console.error('Extended test execution failed:', error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`\n💥 Critical Error: ${errorMsg}`);
            console.log(`Tests completed: ${passedCount}/${testCount}`);
            return false;
        } finally {
            // Enhanced cleanup with error handling
            try {
                wasmLoader.cleanup();
                console.log('\n🧹 WebAssembly cleanup completed');
            } catch (cleanupError) {
                console.error('Warning: Cleanup failed:', cleanupError);
            }
        }
    }
    
    /**
     * B群: フロントエンド用APIテスト
     */
    private async testFrontendAPIs(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- フロントエンド用APIテスト ---');
        
        try {
            // UI表示用API
            const tokyoId = this.module.getStationId('東京');
            if (tokyoId <= 0) return false;
            
            const kana = this.module.getStationKana(tokyoId);
            const prefecture = this.module.getStationPrefecture(tokyoId);
            const extended = this.module.getStationNameExtended(tokyoId);
            
            if (this.verbose) {
                console.log(`  東京駅: かな=${kana}, 都道府県=${prefecture}, 拡張=${extended}`);
            }
            
            // 基本検証: 空文字でないこと
            const success = kana.length > 0 && prefecture.length > 0 && extended.length > 0;
            
            console.log(`フロントエンド用API: ${success ? 'PASS' : 'FAIL'}`);
            return success;
            
        } catch (error) {
            console.log(`フロントエンド用API: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * C群: 4オブジェクトクラステスト
     */
    private async testObjectClasses(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- 4オブジェクトクラステスト ---');
        
        try {
            // 1. cRoute テスト
            const route = new this.module.cRoute();
            route.setupRoute('東京,新宿,渋谷');
            
            const routeCount = route.getRouteCount();
            if (routeCount <= 0) {
                console.log('cRoute: FAIL (route count invalid)');
                return false;
            }
            
            // 2. cRouteList テスト
            const routeList = new this.module.cRouteList(route);
            const startId = routeList.startStationId();
            const lastId = routeList.lastStationId();
            
            if (startId <= 0 || lastId <= 0) {
                console.log('cRouteList: FAIL (station IDs invalid)');
                return false;
            }
            
            // 3. cCalcRoute テスト
            const calcRoute = new this.module.cCalcRoute(routeList);
            const fareInfo = calcRoute.calcFare();
            
            if (!fareInfo || !fareInfo.fare || fareInfo.fare <= 0) {
                console.log('cCalcRoute: FAIL (fare calculation failed)');
                return false;
            }
            
            // 4. FareInfo テスト
            const hasRule114 = typeof fareInfo.isRule114Applied === 'boolean';
            const hasStockCount = typeof fareInfo.availCountForFareOfStockDiscount === 'number';
            
            if (!hasRule114 || !hasStockCount) {
                console.log('FareInfo: FAIL (properties missing)');
                return false;
            }
            
            if (this.verbose) {
                console.log(`  経路: ${routeCount}駅, 運賃: ¥${fareInfo.fare}, Rule114: ${fareInfo.isRule114Applied}`);
            }
            
            console.log('4オブジェクトクラス: PASS');
            return true;
            
        } catch (error) {
            console.log(`4オブジェクトクラス: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * B群: JSON形式APIテスト
     */
    private async testJSONAPIs(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- JSON形式APIテスト ---');
        
        try {
            // 運賃詳細情報JSON
            this.module.createRoute();
            const tokyoId = this.module.getStationId('東京');
            const osakaId = this.module.getStationId('大阪');
            
            this.module.addRouteBegin(tokyoId);
            this.module.addRoute(0, osakaId);
            this.module.calculateFare();
            
            const fareInfoJson = this.module.getFareInfoJson();
            const fareData = JSON.parse(fareInfoJson);
            
            if (!fareData.fare || fareData.fare <= 0) {
                console.log('JSON API: FAIL (fare data invalid)');
                return false;
            }
            
            // 会社・都道府県一覧JSON
            const companyData = this.module.getCompanyAndPrefects();
            const companies = JSON.parse(companyData);
            
            if (!companies.companies || !companies.prefects) {
                console.log('JSON API: FAIL (company data invalid)');
                return false;
            }
            
            // 経路詳細JSON
            const routeDetails = this.module.getRouteDetails();
            const details = JSON.parse(routeDetails);
            
            if (!details.stationCount || details.stationCount <= 0) {
                console.log('JSON API: FAIL (route details invalid)');
                return false;
            }
            
            if (this.verbose) {
                console.log(`  運賃: ¥${fareData.fare}, 会社数: ${companies.companies.length}, 都道府県数: ${companies.prefects.length}`);
            }
            
            console.log('JSON形式API: PASS');
            return true;
            
        } catch (error) {
            console.log(`JSON形式API: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * C群: CLAUDE.md Public APIテスト
     */
    private async testCLAUDEmdPublicAPIs(): Promise<boolean> {
        if (!this.module) return false;
        
        console.log('\n--- CLAUDE.md Public APIテスト ---');
        
        try {
            // setupRoute テスト
            const route = new this.module.cRoute();
            route.setupRoute('東京,大阪');
            
            const routeScript = this.module.routeScript();
            if (routeScript.length === 0) {
                console.log('CLAUDE.md API: FAIL (routeScript empty)');
                return false;
            }
            
            // 分岐駅判定テスト
            const tokyoId = this.module.getStationId('東京');
            const isJunction = this.module.isJunction(tokyoId);
            const isSpecific = this.module.isSpecificJunction(1, tokyoId);
            
            // terminalNameテスト
            const terminalName = this.module.terminalName(tokyoId);
            if (terminalName.length === 0) {
                console.log('CLAUDE.md API: FAIL (terminalName empty)');
                return false;
            }
            
            if (this.verbose) {
                console.log(`  経路スクリプト: ${routeScript.substring(0, 50)}...`);
                console.log(`  東京駅: 分岐=${isJunction}, 特定分岐=${isSpecific}, ターミナル名=${terminalName}`);
            }
            
            console.log('CLAUDE.md Public API: PASS');
            return true;
            
        } catch (error) {
            console.log(`CLAUDE.md Public API: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Enhanced Array Operations Tests (Task 30)
     */
    private async testEnhancedArrayOperations(): Promise<boolean> {
        console.log('\n--- Enhanced Array Operations Tests ---');
        
        try {
            const arrayTests = new ArrayOperationsTests(this.verbose);
            const result = await arrayTests.executeAll();
            
            console.log(`Enhanced Array Operations: ${result ? 'PASS' : 'FAIL'}`);
            return result;
            
        } catch (error) {
            console.log(`Enhanced Array Operations: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Route Flag System Tests (Task 29)
     * Tests for the cRouteFlag class implementation
     */
    private async testRouteFlagSystem(): Promise<boolean> {
        console.log('\n--- Route Flag System Tests ---');
        
        try {
            const routeFlagTests = new RouteFlagTestSuite(this.verbose);
            const result = await routeFlagTests.executeAll();
            
            console.log(`Route Flag System: ${result ? 'PASS' : 'FAIL'}`);
            return result;
            
        } catch (error) {
            console.log(`Route Flag System: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Error Handling System Tests (Task 31)
     * Tests comprehensive error handling covering all error codes ROUTE_ERR_001-099
     */
    private async testErrorHandlingSystem(): Promise<boolean> {
        console.log('\n--- Error Handling System Tests ---');
        
        try {
            const errorHandlingTests = new ErrorHandlingSystemTests(this.verbose);
            const result = await errorHandlingTests.executeAll();
            
            console.log(`Error Handling System: ${result ? 'PASS' : 'FAIL'}`);
            return result;
            
        } catch (error) {
            console.log(`Error Handling System: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Android Compatibility Tests (Task 32)
     * Tests TypeScript interface compatibility with Android Kotlin implementations
     */
    private async testAndroidCompatibility(): Promise<boolean> {
        console.log('\n--- Android Compatibility Tests ---');
        
        try {
            const androidCompatTests = new AndroidCompatibilityTests(this.verbose);
            const result = await androidCompatTests.executeAll();
            
            console.log(`Android Compatibility: ${result ? 'PASS' : 'FAIL'}`);
            return result;
            
        } catch (error) {
            console.log(`Android Compatibility: FAIL (${error})`);
            return false;
        }
    }
    
    /**
     * Object Lifecycle Management Tests (Task 33)
     * Tests memory management and lifecycle validation for all 6 object classes
     */
    private async testObjectLifecycleManagement(): Promise<boolean> {
        console.log('\n--- Object Lifecycle Management Tests ---');
        
        try {
            const lifecycleTests = new ObjectLifecycleTests();
            const result = await lifecycleTests.executeAll();
            
            console.log(`Object Lifecycle Management: ${result ? 'PASS' : 'FAIL'}`);
            return result;
            
        } catch (error) {
            console.log(`Object Lifecycle Management: FAIL (${error})`);
            return false;
        }
    }
}

// Export for use in other modules and CLI execution
export { WebAssemblyExtendedTests };

/**
 * Standalone execution for CLI usage
 */
async function runExtendedTests(): Promise<void> {
    const args = process.argv.slice(2);
    const verbose = args.includes('-v') || args.includes('--verbose');
    
    console.log('🚀 WebAssembly独自テストスイート開始');
    console.log('Task 34: 統合テストスイート');
    console.log('=' .repeat(60));
    
    const testSuite = new WebAssemblyExtendedTests(verbose);
    const success = await testSuite.executeAll();
    
    if (success) {
        console.log('\n🎉 WebAssembly独自テストスイート完了 - 全て成功');
        console.log('Task 34 Integration: ✅ COMPLETED');
        process.exit(0);
    } else {
        console.log('\n💥 WebAssembly独自テストスイート完了 - 一部失敗');
        console.log('Task 34 Integration: ❌ NEEDS ATTENTION');
        process.exit(1);
    }
}

// Run standalone if this file is executed directly
if (require.main === module) {
    runExtendedTests().catch(error => {
        console.error('Fatal error in test execution:', error);
        process.exit(1);
    });
}