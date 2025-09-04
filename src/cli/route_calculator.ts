/**
 * 経路計算実行機能
 * CLIの -5 オプションでの経路指定・運賃計算を実行
 */

import { FarertModule } from './types';
import { wasmLoader } from './wasm_loader';

export class RouteCalculator {
    private module: FarertModule | null = null;
    
    /**
     * -5 オプション用の経路計算実行
     * @param station1 最初の駅名
     * @param line1 最初の路線名
     * @param station2 2番目の駅名
     * @param line2 2番目の路線名
     * @param station3 3番目の駅名
     * @returns 実行成功の可否
     */
    async executeRouteCalculation(
        station1: string, 
        line1: string, 
        station2: string, 
        line2: string, 
        station3: string
    ): Promise<boolean> {
        
        try {
            // WebAssemblyモジュール初期化
            this.module = await wasmLoader.loadModule();
            const dbResult = await wasmLoader.initializeDatabase();
            
            if (!dbResult) {
                console.error('Database initialization failed');
                return false;
            }
            
            console.log('=== 経路計算実行 ===');
            console.log(`経路: ${station1} --[${line1}]--> ${station2} --[${line2}]--> ${station3}`);
            
            // 1. 駅名→ID変換
            const station1Id = this.module.getStationId(station1);
            const station2Id = this.module.getStationId(station2);
            const station3Id = this.module.getStationId(station3);
            
            if (station1Id <= 0) {
                console.error(`駅が見つかりません: ${station1}`);
                return false;
            }
            if (station2Id <= 0) {
                console.error(`駅が見つかりません: ${station2}`);
                return false;
            }
            if (station3Id <= 0) {
                console.error(`駅が見つかりません: ${station3}`);
                return false;
            }
            
            console.log(`駅ID: ${station1}(${station1Id}) -> ${station2}(${station2Id}) -> ${station3}(${station3Id})`);
            
            // 2. 路線名→ID変換
            const line1Id = this.module.getLineId(line1);
            const line2Id = this.module.getLineId(line2);
            
            if (line1Id <= 0) {
                console.error(`路線が見つかりません: ${line1}`);
                return false;
            }
            if (line2Id <= 0) {
                console.error(`路線が見つかりません: ${line2}`);
                return false;
            }
            
            console.log(`路線ID: ${line1}(${line1Id}), ${line2}(${line2Id})`);
            
            // 3. 経路構築
            this.module.createRoute();
            
            // 最初の駅を追加（開始駅設定）
            const result1 = this.module.addRouteBegin(station1Id);
            if (result1 <= 0) {
                console.error(`経路開始設定に失敗: ${station1} (結果: ${result1})`);
                return false;
            }
            
            // 2番目の駅を路線指定で追加
            const result2 = this.module.addRoute(line1Id, station2Id);
            if (result2 <= 0) {
                console.error(`経路追加に失敗: ${station1} --[${line1}]--> ${station2} (結果: ${result2})`);
                return false;
            }
            
            // 3番目の駅を路線指定で追加  
            const result3 = this.module.addRoute(line2Id, station3Id);
            if (result3 <= 0) {
                console.error(`経路追加に失敗: ${station2} --[${line2}]--> ${station3} (結果: ${result3})`);
                return false;
            }
            
            console.log('経路構築完了');
            
            // 4. 運賃計算
            const calcResult = this.module.calculateFare();
            if (calcResult !== 1) {
                console.error(`運賃計算に失敗 (結果: ${calcResult})`);
                return false;
            }
            
            // 5. 結果表示
            const fareString = this.module.getFareString();
            console.log('\n=== 運賃計算結果 ===');
            console.log(fareString);
            
            // 詳細情報（JSON形式）
            try {
                const fareInfoJson = this.module.getFareInfoJson();
                const fareData = JSON.parse(fareInfoJson);
                
                console.log('\n=== 詳細情報 ===');
                console.log(`運賃: ¥${fareData.fare}`);
                console.log(`総営業キロ: ${fareData.totalSalesKm}km`);
                console.log(`Rule114適用: ${fareData.isRule114Applied ? 'あり' : 'なし'}`);
                if (fareData.routeList) {
                    console.log(`経路詳細: ${fareData.routeList}`);
                }
                
            } catch (jsonError) {
                console.log('詳細情報の解析に失敗:', jsonError);
            }
            
            return true;
            
        } catch (error) {
            console.error('経路計算実行エラー:', error);
            return false;
            
        } finally {
            // クリーンアップ
            if (this.module) {
                wasmLoader.cleanup();
            }
        }
    }
}

/**
 * メイン関数から呼び出される経路計算実行
 */
export async function executeRouteCalculation(
    station1: string, 
    line1: string, 
    station2: string, 
    line2: string, 
    station3: string
): Promise<number> {
    
    const calculator = new RouteCalculator();
    const success = await calculator.executeRouteCalculation(station1, line1, station2, line2, station3);
    
    return success ? 0 : 1;  // 成功: 0, 失敗: 1 (C++スタイル)
}