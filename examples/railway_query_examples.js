/**
 * Railway Information Query Examples
 * 鉄道情報クエリサンプル
 * 
 * This script demonstrates how to query specific railway information using
 * the Farert WebAssembly module APIs.
 * 
 * 実行方法 (Execution Method):
 * 
 * 1. プロジェクトをビルド (Build the project):
 *    npm run build
 * 
 * 2. サンプルスクリプトを実行 (Run the sample script):
 *    node examples/railway_query_examples.js
 * 
 * 3. 個別の関数をテスト (Test individual functions):
 *    node -e "require('./examples/railway_query_examples.js').queryYamanoteStations()"
 * 
 * 機能 (Features):
 * - 山手線の各駅表示 (Display all Yamanote Line stations)
 * - 山手線の分岐駅表示 (Display Yamanote Line junction stations)  
 * - 神奈川県の路線表示 (Display Kanagawa prefecture lines)
 * - 横浜線の駅表示 (Display Yokohama Line stations)
 * - 大宮の接続路線表示 (Display Omiya station connections)
 */

const path = require('path');
const { wasmLoader } = require('../dist/cli/cli/wasm_loader.js');

/**
 * Query Yamanote Line stations
 */
async function queryYamanoteStations(module) {
    console.log("=== 山手線の各駅 (Yamanote Line Stations) ===");
    
    try {
        
        const yamanoteLineId = module.getLineId("山手線");
        if (yamanoteLineId <= 0) {
            console.log("山手線が見つかりません");
            return;
        }
        
        console.log(`山手線 ID: ${yamanoteLineId}`);
        
        const stationsResult = module.getStationIdsOfLine ? module.getStationIdsOfLine(yamanoteLineId) : "[]";
        let stations = [];
        try {
            // Parse the string result as array
            stations = JSON.parse(stationsResult);
        } catch (e) {
            // Try manual parsing if JSON fails
            const cleaned = stationsResult.replace(/[\[\]]/g, '');
            stations = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        }
        
        if (stations.length === 0) {
            console.log("山手線の駅情報を取得できませんでした");
            return;
        }
        
        console.log(`駅数: ${stations.length}駅\n`);
        stations.forEach((stationId, index) => {
            const stationName = module.getStationName(stationId);
            console.log(`${String(index + 1).padStart(2)}: ${stationName} (ID: ${stationId})`);
        });
        
    } catch (error) {
        console.error("山手線駅情報取得エラー:", error.message);
    }
}

/**
 * Query Yamanote Line junction/branch stations
 */
async function queryYamanoteBranchStations(module) {
    console.log("\n=== 山手線の分岐駅 (Yamanote Line Branch Stations) ===");
    
    try {
        
        const yamanoteLineId = module.getLineId("山手線");
        if (yamanoteLineId <= 0) {
            console.log("山手線が見つかりません");
            return;
        }
        
        // Use the proper C++ function to get junction stations directly
        const junctionsResult = module.getJunctionIdsOfLine ? module.getJunctionIdsOfLine(yamanoteLineId) : "[]";
        let junctionStationIds = [];
        try {
            junctionStationIds = JSON.parse(junctionsResult);
        } catch (e) {
            const cleaned = junctionsResult.replace(/[\[\]]/g, '');
            junctionStationIds = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        }
        
        if (junctionStationIds.length === 0) {
            console.log("山手線にジャンクション駅が見つかりませんでした");
            return;
        }
        
        const branchStations = [];
        
        // Get connecting lines using a simple search approach
        const findConnectingLines = (stationId, stationName) => {
            const connectingLines = [];
            
            // Cannot discover connecting lines reliably without getLinesAtStation or similar function
            
            return connectingLines;
        };
        
        // Process each junction station
        junctionStationIds.forEach(stationId => {
            const stationName = module.getStationName(stationId);
            
            // Get actual connecting lines by searching database
            const actualConnectingLines = findConnectingLines(stationId, stationName);
            
            branchStations.push({
                id: stationId,
                name: stationName,
                lineCount: actualConnectingLines.length + 1, // +1 for Yamanote line itself
                connectingLines: actualConnectingLines
            });
        });
        
        console.log(`分岐駅数: ${branchStations.length}駅\n`);
        branchStations.forEach((station, index) => {
            // Display station with connecting lines in parentheses
            const linesDisplay = station.connectingLines.length > 0 
                ? ` (${station.connectingLines.join('/')})`
                : ` (${station.lineCount}路線接続)`;
            
            console.log(`${index + 1}: ${station.name}${linesDisplay}`);
        });
        
    } catch (error) {
        console.error("山手線分岐駅情報取得エラー:", error.message);
    }
}

/**
 * Query Kanagawa prefecture railway lines using getPrefects, companyOrPrefectName, linesCompanyOrPrefectId
 */
async function queryKanagawaLines(module) {
    console.log("\n=== 神奈川県の路線 (Kanagawa Prefecture Lines) ===");
    
    try {
        
        console.log("データベースから神奈川県の路線を検索中...\n");
        
        // Step 1: Get all prefecture IDs (id >= 0x10000)
        if (!module.getPrefects) {
            console.log('❌ getPrefects関数が利用できません');
            return;
        }
        
        const prefectsResult = module.getPrefects();
        let prefectIds = [];
        try {
            prefectIds = JSON.parse(prefectsResult);
        } catch (e) {
            const cleaned = prefectsResult.replace(/[\[\]]/g, '');
            prefectIds = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        }
        
        console.log(`取得された都道府県数: ${prefectIds.length}`);
        
        // Step 2: Find Kanagawa prefecture ID by searching names
        let kanagawaId = null;
        for (const prefectId of prefectIds) {
            // Only check prefecture IDs (>= 0x10000)
            if (prefectId >= 0x10000) {
                const prefectName = module.companyOrPrefectName(prefectId);
                if (prefectName.includes('神奈川')) {
                    kanagawaId = prefectId;
                    console.log(`神奈川県ID発見: ${kanagawaId} (名前: ${prefectName})`);
                    break;
                }
            }
        }
        
        if (!kanagawaId) {
            console.log('❌ 神奈川県のIDが見つかりませんでした');
            console.log('利用可能な都道府県:');
            prefectIds.filter(id => id >= 0x10000).slice(0, 10).forEach(id => {
                const name = module.companyOrPrefectName(id);
                console.log(`  ID: ${id} → ${name}`);
            });
            return;
        }
        
        // Step 3: Get lines for Kanagawa prefecture
        if (!module.linesCompanyOrPrefectId) {
            console.log('❌ linesCompanyOrPrefectId関数が利用できません');
            return;
        }
        
        const linesResult = module.linesCompanyOrPrefectId(kanagawaId);
        let lineIds = [];
        try {
            lineIds = JSON.parse(linesResult);
        } catch (e) {
            const cleaned = linesResult.replace(/[\[\]]/g, '');
            lineIds = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        }
        
        if (lineIds.length === 0) {
            console.log('❌ 神奈川県の路線が見つかりませんでした');
            return;
        }
        
        console.log(`\n神奈川県の路線数: ${lineIds.length}路線\n`);
        
        // Display all Kanagawa lines
        lineIds.forEach((lineId, index) => {
            const lineName = module.getLineName(lineId);
            console.log(`${String(index + 1).padStart(2)}: ${lineName} (ID: ${lineId})`);
        });
        
    } catch (error) {
        console.error("神奈川県路線情報取得エラー:", error.message);
    }
}

/**
 * Query Yokohama Line stations AND Kanagawa prefecture stations using stationsWithinCompanyOrPrefectAndLine
 */
async function queryYokohamaAndKanagawaStations(module) {
    console.log("\n=== 横浜線 AND 神奈川県の駅 (Yokohama Line AND Kanagawa Prefecture Stations) ===");
    
    try {
        // Get Yokohama Line ID
        const yokohamaLineId = module.getLineId("横浜線");
        if (yokohamaLineId <= 0) {
            console.log("横浜線が見つかりません");
            return;
        }
        console.log(`横浜線 ID: ${yokohamaLineId}`);
        
        // Get Kanagawa prefecture ID (already found: 983040)
        const kanagawaId = 983040;  // From previous query
        console.log(`神奈川県 ID: ${kanagawaId}`);
        
        // Use stationsWithinCompanyOrPrefectAndLine for efficient query
        if (!module.stationsWithinCompanyOrPrefectAndLine) {
            console.log('❌ stationsWithinCompanyOrPrefectAndLine関数が利用できません');
            console.log('従来の方法で処理を続行します...\n');
            
            // Fallback to previous implementation
            const stationsResult = module.getStationIdsOfLine(yokohamaLineId);
            let yokohamaStations = [];
            try {
                yokohamaStations = JSON.parse(stationsResult);
            } catch (e) {
                const cleaned = stationsResult.replace(/[\[\]]/g, '');
                yokohamaStations = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
            }
            
            console.log(`横浜線総駅数: ${yokohamaStations.length}駅`);
            return;
        }
        
        // Get stations that are both on Yokohama Line AND in Kanagawa prefecture
        const kanagawaYokohamaStationsResult = module.stationsWithinCompanyOrPrefectAndLine(kanagawaId, yokohamaLineId);
        let kanagawaYokohamaStations = [];
        try {
            kanagawaYokohamaStations = JSON.parse(kanagawaYokohamaStationsResult);
        } catch (e) {
            const cleaned = kanagawaYokohamaStationsResult.replace(/[\[\]]/g, '');
            kanagawaYokohamaStations = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        }
        
        // Get all Yokohama Line stations for comparison
        const allYokohamaStationsResult = module.getStationIdsOfLine(yokohamaLineId);
        let allYokohamaStations = [];
        try {
            allYokohamaStations = JSON.parse(allYokohamaStationsResult);
        } catch (e) {
            const cleaned = allYokohamaStationsResult.replace(/[\[\]]/g, '');
            allYokohamaStations = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
        }
        
        // Calculate Tokyo stations (total - Kanagawa)
        const tokyoYokohamaStations = allYokohamaStations.filter(id => !kanagawaYokohamaStations.includes(id));
        
        console.log(`横浜線総駅数: ${allYokohamaStations.length}駅`);
        console.log(`神奈川県内の横浜線駅数: ${kanagawaYokohamaStations.length}駅`);
        console.log(`東京都内の横浜線駅数: ${tokyoYokohamaStations.length}駅`);
        
        console.log(`\n=== 横浜線かつ神奈川県内の駅 (${kanagawaYokohamaStations.length}駅) ===`);
        
        kanagawaYokohamaStations.forEach((stationId, index) => {
            const stationName = module.getStationName(stationId);
            const isJunction = module.isJunction(stationId);
            const junctionMark = (isJunction === 1 || isJunction === true) ? " [分岐]" : "";
            console.log(`${String(index + 1).padStart(2)}: ${stationName}${junctionMark} (ID: ${stationId})`);
        });
        
        // Show Tokyo stations for reference
        if (tokyoYokohamaStations.length > 0) {
            console.log(`\n--- 参考：横浜線の東京都内の駅 (${tokyoYokohamaStations.length}駅) ---`);
            tokyoYokohamaStations.forEach((stationId, index) => {
                const stationName = module.getStationName(stationId);
                const isJunction = module.isJunction(stationId);
                const junctionMark = (isJunction === 1 || isJunction === true) ? " [分岐]" : "";
                console.log(`${String(index + 1).padStart(2)}: ${stationName}${junctionMark} (ID: ${stationId}) [東京都]`);
            });
        }
        
    } catch (error) {
        console.error("横浜線AND神奈川県駅情報取得エラー:", error.message);
    }
}

/**
 * Query Omiya station connecting lines
 */
async function queryOmiyaConnections(module) {
    console.log("\n=== 大宮の接続路線 (Omiya Station Connections) ===");
    
    try {
        
        const omiyaStationId = module.getStationId("大宮");
        if (omiyaStationId <= 0) {
            console.log("大宮駅が見つかりません");
            return;
        }
        
        console.log(`大宮駅 ID: ${omiyaStationId}`);
        console.log("\n大宮に接続している路線を検索中...");
        
        // Use getLineIdsFromStation to get connecting lines
        if (module.getLineIdsFromStation) {
            const linesResult = module.getLineIdsFromStation(omiyaStationId);
            let lineIds = [];
            try {
                lineIds = JSON.parse(linesResult);
            } catch (e) {
                const cleaned = linesResult.replace(/[\[\]]/g, '');
                lineIds = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : [];
            }
            
            // Filter out zero/invalid IDs
            const validLineIds = lineIds.filter(id => id > 0);
            
            if (validLineIds.length > 0) {
                console.log(`接続路線数: ${validLineIds.length}路線\n`);
                
                const connectingLines = [];
                validLineIds.forEach(lineId => {
                    const lineName = module.getLineName(lineId);
                    if (lineName && lineName.length > 0) {
                        connectingLines.push({ id: lineId, name: lineName });
                    }
                });
                
                connectingLines.forEach((line, index) => {
                    console.log(`${index + 1}: ${line.name} (ID: ${line.id})`);
                });
            } else {
                console.log('getLineIdsFromStation関数は存在しますが、有効な路線情報を返しません。');
                console.log('この関数は正しく実装されていない可能性があります。');
            }
        } else {
            console.log('getLineIdsFromStation関数が利用できません。');
        }
        
    } catch (error) {
        console.error("大宮駅接続路線情報取得エラー:", error.message);
    }
}

/**
 * Display available WebAssembly functions for reference
 */
function displayAvailableFunctions(module) {
    console.log("\n=== 利用可能なWebAssembly関数 (Available Functions) ===");
    
    const functions = [
        'getStationId', 'getStationName', 'getLineId', 'getLineName',
        'isJunction', 'getStationIdsOfLine', 'getLineIdsFromStation',
        'getCompanyAndPrefects', 'getCompanyOrPrefectName', 'companyOrPrefectName',
        'getPrefects', 'getJRCompanys', 'getJunctionIdsOfLine', 
        'linesCompanyOrPrefectId', 'getLinesFromCompanyOrPrefect',
        'stationsWithinCompanyOrPrefectAndLine',
        'getStationPrefecture', 'searchStationsByKeyword'
    ];
    
    functions.forEach(funcName => {
        const available = typeof module[funcName] === 'function' ? '✅' : '❌';
        console.log(`${available} ${funcName}`);
    });
    
    // Also check other potential function names
    console.log('\nその他の関数チェック:');
    const otherFunctions = ['EnumLineOfStationId', 'getLinesAtStation', 'getAllLineIds'];
    otherFunctions.forEach(funcName => {
        const available = typeof module[funcName] === 'function' ? '✅' : '❌';
        console.log(`${available} ${funcName}`);
    });
}

/**
 * Main execution function
 */
async function main() {
    console.log("Railway Information Query Examples");
    console.log("==================================\n");
    
    try {
        console.log("WebAssemblyモジュールを初期化中...");
        const module = await wasmLoader.loadModule();
        console.log("初期化完了\n");
        
        // Initialize database connection once
        console.log("データベース接続を初期化中...");
        module.openDatabase();
        console.log("データベース接続完了\n");
        
        // Display available functions first
        displayAvailableFunctions(module);
        
        // Execute all queries
        await queryYamanoteStations(module);
        await queryYamanoteBranchStations(module);
        await queryKanagawaLines(module);
        await queryYokohamaAndKanagawaStations(module);
        await queryOmiyaConnections(module);
        
        console.log("\n=== 完了 ===");
        
    } catch (error) {
        console.error("エラーが発生しました:", error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    queryYamanoteStations,
    queryYamanoteBranchStations,
    queryKanagawaLines,
    queryYokohamaAndKanagawaStations,
    queryOmiyaConnections
};