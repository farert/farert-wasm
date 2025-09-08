/**
 * WebAssembly独自テスト実装
 * B群・C群API（フロントエンド用・WebAssembly独自API）のテスト
 * 4オブジェクトクラスの包括的テスト
 * 
 * これらはオリジナルのC++にない機能のため、TypeScript独自のテストロジックで実装
 */

import { FarertModule } from './types';
import { wasmLoader } from './wasm_loader';
import { ArrayOperationsTests } from './test_array_ops';

export class WebAssemblyExtendedTests {
    private module: FarertModule | null = null;
    private verbose: boolean = false;
    
    constructor(verbose: boolean = false) {
        this.verbose = verbose;
    }
    
    /**
     * 全WebAssembly独自テストの実行
     */
    async executeAll(): Promise<boolean> {
        try {
            this.module = await wasmLoader.loadModule();
            const dbResult = await wasmLoader.initializeDatabase();
            
            if (!dbResult) {
                console.error('Database initialization failed for extended tests');
                return false;
            }
            
            console.log('\n=== WebAssembly独自テスト開始 ===');
            
            const results = [
                await this.testFrontendAPIs(),
                await this.testObjectClasses(),
                await this.testJSONAPIs(),
                await this.testCLAUDEmdPublicAPIs(),
                await this.testEnhancedArrayOperations()
            ];
            
            const allPassed = results.every(r => r);
            
            console.log('=== WebAssembly独自テスト完了 ===');
            console.log(`結果: ${results.filter(r => r).length}/${results.length} カテゴリ成功`);
            
            return allPassed;
            
        } catch (error) {
            console.error('Extended test execution failed:', error);
            return false;
        } finally {
            wasmLoader.cleanup();
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
}