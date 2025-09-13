/**
 * Line Operations API Example - Complete Coverage
 * 路線操作APIサンプル - 完全網羅版
 *
 * This example demonstrates COMPLETE line-related API functionality including:
 * - Line name ⇔ ID conversion using getLineId and getLineName
 * - Station lists on lines with getStationIdsOfLine
 * - Junction detection using getJunctionIdsOfLine and isJunction
 * - Company/prefecture queries with linesCompanyOrPrefectId
 * - Line classification by company and prefecture
 * - Service type analysis (JR lines vs private railways)
 * - Regional line mapping across prefectures
 * - Line intersection discovery between railway systems
 * - Terminal station identification for each line
 * - Station-to-line mapping using getLineIdsFromStation
 * - Company information using getJRCompanys() and getPrefects()
 * - Multi-line route analysis showing connections
 * - Performance testing with batch line operations
 *
 * このサンプルは以下の路線関連API機能の完全な使用方法を示します：
 * - getLineId と getLineName による路線名とIDの相互変換
 * - getStationIdsOfLine による路線上の駅リスト
 * - getJunctionIdsOfLine と isJunction による分岐駅検出
 * - linesCompanyOrPrefectId による会社・都道府県クエリ
 * - 会社・都道府県による路線分類
 * - サービス種別解析（JR線 対 私鉄）
 * - 都道府県を跨ぐ地域路線マッピング
 * - 鉄道システム間の路線交差発見
 * - 各路線の終端駅識別
 * - getLineIdsFromStation による駅-路線マッピング
 * - getJRCompanys() と getPrefects() による会社情報
 * - 接続を示すマルチ路線解析
 * - バッチ路線操作によるパフォーマンステスト
 *
 * Key API Functions Demonstrated / 実演される主要API関数:
 * - getLineId(name) - Line name to ID conversion
 * - getLineName(id) - Line ID to name conversion
 * - getStationIdsOfLine(lineId) - Get all stations on a line
 * - getJunctionIdsOfLine(lineId) - Get junction stations
 * - getLineIdsFromStation(stationId) - Get lines serving a station
 * - linesCompanyOrPrefectId(id) - Get lines by company/prefecture
 * - getJRCompanys() - Get JR company IDs
 * - getPrefects() - Get prefecture IDs
 * - companyOrPrefectName(id) - Get company/prefecture name
 * - isJunction(stationId) - Check if station is a junction
 * - isSpecificJunction(lineId, stationId) - Check specific junction
 *
 * Execution / 実行方法:
 * node examples/api/basic/line-operations.js
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

/**
 * Demonstrates basic line name to ID conversion
 * 基本的な路線名→ID変換のデモンストレーション
 */
async function demonstrateLineNameToId(module) {
    console.log("=== Line Name → ID Conversion (路線名→ID変換) ===");

    // List of major JR lines for testing
    // テスト用の主要JR路線リスト
    const lineNames = [
        "山手線",        // Yamanote Line - Tokyo's famous loop line
        "東海道線",      // Tokaido Line - Major trunk line
        "中央線",        // Chuo Line - Central Tokyo line
        "京浜東北線",    // Keihin-Tohoku Line - North-South line
        "総武線",        // Sobu Line - East-West Tokyo line
        "横浜線",        // Yokohama Line - Kanagawa regional line
        "存在しない路線"  // Non-existent line for error handling
    ];

    console.log("Testing line name → ID conversion for major JR lines:");
    console.log("主要JR路線の路線名→ID変換をテスト中:\n");

    for (const lineName of lineNames) {
        try {
            // Core API call: getLineId converts line name to unique numeric ID
            // コアAPI呼び出し: getLineIdは路線名を一意の数値IDに変換します
            const lineId = module.getLineId(lineName);

            if (lineId > 0) {
                console.log(`✅ ${lineName} → Line ID: ${lineId}`);
            } else {
                console.log(`❌ ${lineName} → Line not found (ID: ${lineId})`);
            }
        } catch (error) {
            console.log(`⚠️ ${lineName} → Error: ${error.message}`);
        }
    }
    console.log();
}

/**
 * Demonstrates line ID to name conversion with verification
 * 検証付きの路線ID→名前変換のデモンストレーション
 */
async function demonstrateLineIdToName(module) {
    console.log("=== Line ID → Name Conversion (路線ID→路線名変換) ===");

    // Get line IDs from previous conversion for testing
    // テスト用に前の変換から路線IDを取得
    const testLines = [
        { name: "山手線", id: null },
        { name: "東海道線", id: null },
        { name: "中央線", id: null }
    ];

    // First get the IDs
    // まずIDを取得
    for (const line of testLines) {
        line.id = module.getLineId(line.name);
    }

    console.log("Demonstrating ID → name conversion with verification:");
    console.log("検証付きのID→名前変換をデモンストレーション:\n");

    for (const line of testLines) {
        if (line.id > 0) {
            try {
                // Core API call: getLineName converts line ID back to name
                // コアAPI呼び出し: getLineNameは路線IDを路線名に変換し戻します
                const retrievedName = module.getLineName(line.id);

                // Verify round-trip conversion accuracy
                // 往復変換の精度を検証
                const isAccurate = retrievedName === line.name;
                const statusIcon = isAccurate ? "✅" : "⚠️";

                console.log(`${statusIcon} Line ID ${line.id}:`);
                console.log(`  Original Name: ${line.name}`);
                console.log(`  Retrieved Name: ${retrievedName}`);
                console.log(`  Round-trip Accurate: ${isAccurate}`);
                console.log();

            } catch (error) {
                console.log(`⚠️ Line ID ${line.id} → Error: ${error.message}`);
            }
        }
    }
}

/**
 * Demonstrates retrieving all stations on specific lines
 * 特定路線上の全駅取得のデモンストレーション
 */
async function demonstrateLineStations(module) {
    console.log("=== Line Stations Retrieval (路線駅取得) ===");

    // Test with well-known lines that should have good data
    // 良好なデータを持つであろう既知の路線でテスト
    const linesToAnalyze = ["山手線", "横浜線", "東海道線"];

    console.log("Retrieving complete station lists for major lines:");
    console.log("主要路線の完全な駅リストを取得中:\n");

    for (const lineName of linesToAnalyze) {
        try {
            const lineId = module.getLineId(lineName);

            if (lineId <= 0) {
                console.log(`❌ ${lineName} → Line not found`);
                continue;
            }

            console.log(`=== ${lineName} (Line ID: ${lineId}) ===`);

            // Core API call: getStationIdsOfLine retrieves all stations on a line
            // コアAPI呼び出し: getStationIdsOfLineは路線上の全駅を取得します
            const stationsResult = module.getStationIdsOfLine
                ? module.getStationIdsOfLine(lineId)
                : "[]";

            let stationIds = [];
            try {
                // Parse the result which might be JSON or comma-separated
                // JSON形式またはカンマ区切りの結果を解析
                stationIds = JSON.parse(stationsResult);
            } catch (e) {
                // Try manual parsing if JSON fails
                // JSONが失敗した場合は手動解析を試行
                const cleaned = stationsResult.replace(/[\[\]]/g, '');
                stationIds = cleaned.length > 0
                    ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                    : [];
            }

            if (stationIds.length === 0) {
                console.log(`  No stations found for ${lineName}`);
                console.log();
                continue;
            }

            console.log(`  Total stations: ${stationIds.length}`);
            console.log(`  Station list:`);

            // Display each station with its name
            // 各駅を名前と共に表示
            stationIds.forEach((stationId, index) => {
                const stationName = module.getStationName(stationId);
                const displayNumber = String(index + 1).padStart(2);
                console.log(`    ${displayNumber}: ${stationName} (ID: ${stationId})`);
            });

            console.log();

        } catch (error) {
            console.error(`Error processing ${lineName}:`, error.message);
        }
    }
}

/**
 * Demonstrates junction station detection on lines
 * 路線上の分岐駅検出のデモンストレーション
 */
async function demonstrateJunctionDetection(module) {
    console.log("=== Junction Station Detection (分岐駅検出) ===");

    // Test junction detection on major lines
    // 主要路線で分岐駅検出をテスト
    const linesForJunctionAnalysis = ["山手線", "東海道線", "中央線"];

    console.log("Analyzing junction stations on major lines:");
    console.log("主要路線の分岐駅を解析中:\n");

    for (const lineName of linesForJunctionAnalysis) {
        try {
            const lineId = module.getLineId(lineName);

            if (lineId <= 0) {
                console.log(`❌ ${lineName} → Line not found`);
                continue;
            }

            console.log(`=== ${lineName} Junction Analysis ===`);

            // Core API call: getJunctionIdsOfLine retrieves junction stations
            // コアAPI呼び出し: getJunctionIdsOfLineは分岐駅を取得します
            let junctionIds = [];

            if (module.getJunctionIdsOfLine) {
                const junctionsResult = module.getJunctionIdsOfLine(lineId);
                try {
                    junctionIds = JSON.parse(junctionsResult);
                } catch (e) {
                    const cleaned = junctionsResult.replace(/[\[\]]/g, '');
                    junctionIds = cleaned.length > 0
                        ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        : [];
                }
            } else {
                // Fallback: check each station manually with isJunction
                // フォールバック: 各駅をisJunctionで手動チェック
                const stationsResult = module.getStationIdsOfLine(lineId);
                let allStations = [];
                try {
                    allStations = JSON.parse(stationsResult);
                } catch (e) {
                    const cleaned = stationsResult.replace(/[\[\]]/g, '');
                    allStations = cleaned.length > 0
                        ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        : [];
                }

                // Check each station for junction status
                // 各駅の分岐駅状態をチェック
                for (const stationId of allStations) {
                    const isJunction = module.isJunction(stationId);
                    if (isJunction === 1 || isJunction === true) {
                        junctionIds.push(stationId);
                    }
                }
            }

            if (junctionIds.length === 0) {
                console.log(`  No junction stations found on ${lineName}`);
            } else {
                console.log(`  Found ${junctionIds.length} junction stations:`);

                junctionIds.forEach((stationId, index) => {
                    const stationName = module.getStationName(stationId);
                    console.log(`    ${index + 1}: ${stationName} (ID: ${stationId})`);
                });
            }

            console.log();

        } catch (error) {
            console.error(`Error analyzing junctions for ${lineName}:`, error.message);
        }
    }
}

/**
 * Demonstrates company and prefecture-based line queries
 * 会社および都道府県ベースの路線クエリのデモンストレーション
 */
async function demonstrateCompanyPrefectureLines(module) {
    console.log("=== Company & Prefecture Line Queries (会社・都道府県路線クエリ) ===");

    console.log("Analyzing lines by company and prefecture organization:");
    console.log("会社および都道府県による路線編成を解析中:\n");

    try {
        // First, get all available prefecture IDs
        // まず、利用可能な全都道府県IDを取得
        if (!module.getPrefects) {
            console.log("❌ getPrefects function not available");
            console.log("getPrefects関数が利用できません");
            return;
        }

        const prefectsResult = module.getPrefects();
        let prefectIds = [];
        try {
            prefectIds = JSON.parse(prefectsResult);
        } catch (e) {
            const cleaned = prefectsResult.replace(/[\[\]]/g, '');
            prefectIds = cleaned.length > 0
                ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                : [];
        }

        console.log(`Total prefectures/companies found: ${prefectIds.length}\n`);

        // Analyze a few key prefectures for line distribution
        // 路線分布のためにいくつかの主要都道府県を解析
        const targetPrefectures = ["東京", "神奈川", "大阪"];

        for (const prefectureName of targetPrefectures) {
            // Find prefecture ID by name
            // 名前で都道府県IDを検索
            let prefectureId = null;
            for (const id of prefectIds) {
                if (id >= 0x10000) { // Prefecture IDs are >= 0x10000
                    const name = module.companyOrPrefectName(id);
                    if (name && name.includes(prefectureName)) {
                        prefectureId = id;
                        break;
                    }
                }
            }

            if (!prefectureId) {
                console.log(`❌ ${prefectureName} prefecture not found`);
                continue;
            }

            console.log(`=== ${prefectureName} Prefecture Lines ===`);
            console.log(`Prefecture ID: ${prefectureId}`);

            // Core API call: linesCompanyOrPrefectId gets lines by prefecture
            // コアAPI呼び出し: linesCompanyOrPrefectIdは都道府県による路線を取得します
            if (!module.linesCompanyOrPrefectId) {
                console.log("  linesCompanyOrPrefectId function not available");
                console.log();
                continue;
            }

            const linesResult = module.linesCompanyOrPrefectId(prefectureId);
            let lineIds = [];
            try {
                lineIds = JSON.parse(linesResult);
            } catch (e) {
                const cleaned = linesResult.replace(/[\[\]]/g, '');
                lineIds = cleaned.length > 0
                    ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                    : [];
            }

            if (lineIds.length === 0) {
                console.log(`  No lines found for ${prefectureName}`);
            } else {
                console.log(`  Lines in ${prefectureName}: ${lineIds.length}`);

                // Show first few lines as examples
                // 例として最初のいくつかの路線を表示
                const linesToShow = lineIds.slice(0, 5);
                linesToShow.forEach((lineId, index) => {
                    const lineName = module.getLineName(lineId);
                    console.log(`    ${index + 1}: ${lineName} (ID: ${lineId})`);
                });

                if (lineIds.length > 5) {
                    console.log(`    ... and ${lineIds.length - 5} more lines`);
                }
            }

            console.log();
        }

    } catch (error) {
        console.error("Error in company/prefecture analysis:", error.message);
    }
}

/**
 * Demonstrates advanced line connectivity analysis
 * 高度な路線接続性解析のデモンストレーション
 */
async function demonstrateLineConnectivity(module) {
    console.log("=== Line Connectivity Analysis (路線接続性解析) ===");

    // Analyze connectivity between major lines through shared stations
    // 共有駅を通じた主要路線間の接続性を解析
    const majorLines = ["山手線", "中央線", "東海道線"];

    console.log("Analyzing connectivity between major lines:");
    console.log("主要路線間の接続性を解析中:\n");

    for (let i = 0; i < majorLines.length; i++) {
        for (let j = i + 1; j < majorLines.length; j++) {
            const line1 = majorLines[i];
            const line2 = majorLines[j];

            try {
                const line1Id = module.getLineId(line1);
                const line2Id = module.getLineId(line2);

                if (line1Id <= 0 || line2Id <= 0) {
                    console.log(`❌ Cannot analyze ${line1} ↔ ${line2}: Line not found`);
                    continue;
                }

                console.log(`=== ${line1} ↔ ${line2} Connectivity ===`);

                // Get stations for both lines
                // 両路線の駅を取得
                const line1StationsResult = module.getStationIdsOfLine(line1Id);
                const line2StationsResult = module.getStationIdsOfLine(line2Id);

                let line1Stations = [];
                let line2Stations = [];

                try {
                    line1Stations = JSON.parse(line1StationsResult);
                    line2Stations = JSON.parse(line2StationsResult);
                } catch (e) {
                    // Manual parsing fallback
                    // 手動解析フォールバック
                    const clean1 = line1StationsResult.replace(/[\[\]]/g, '');
                    const clean2 = line2StationsResult.replace(/[\[\]]/g, '');
                    line1Stations = clean1.length > 0
                        ? clean1.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        : [];
                    line2Stations = clean2.length > 0
                        ? clean2.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        : [];
                }

                // Find intersection stations (direct connections)
                // 交差駅を検索（直接接続）
                const intersection = line1Stations.filter(stationId =>
                    line2Stations.includes(stationId)
                );

                if (intersection.length > 0) {
                    console.log(`  Direct connections: ${intersection.length} stations`);
                    intersection.forEach(stationId => {
                        const stationName = module.getStationName(stationId);
                        console.log(`    - ${stationName} (ID: ${stationId})`);
                    });
                } else {
                    console.log(`  No direct connections between ${line1} and ${line2}`);
                }

                console.log();

            } catch (error) {
                console.error(`Error analyzing ${line1} ↔ ${line2}:`, error.message);
            }
        }
    }
}

/**
 * Demonstrates station-to-line mapping using getLineIdsFromStation
 * getLineIdsFromStationを使用した駅-路線マッピングのデモンストレーション
 */
async function demonstrateStationLineMapping(module) {
    console.log("=== Station-to-Line Mapping (駅-路線マッピング) ===");

    // Test with major junction stations
    // 主要分岐駅でテスト
    const majorStations = ["東京", "新宿", "池袋", "品川", "上野"];

    console.log("Analyzing lines serving major stations:");
    console.log("主要駅にサービスする路線を解析中:\n");

    for (const stationName of majorStations) {
        try {
            const stationId = module.getStationId(stationName);

            if (stationId <= 0) {
                console.log(`❌ ${stationName} → Station not found`);
                continue;
            }

            console.log(`=== ${stationName} Station (ID: ${stationId}) ===`);

            // Core API call: getLineIdsFromStation retrieves all lines serving a station
            // コアAPI呼び出し: getLineIdsFromStationは駅にサービスする全路線を取得します
            if (module.getLineIdsFromStation) {
                const linesResult = module.getLineIdsFromStation(stationId);
                let lineIds = [];

                try {
                    lineIds = JSON.parse(linesResult);
                } catch (e) {
                    const cleaned = linesResult.replace(/[\[\]]/g, '');
                    lineIds = cleaned.length > 0
                        ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        : [];
                }

                // Filter out invalid line IDs
                // 無効な路線IDをフィルタ
                const validLineIds = lineIds.filter(id => id > 0);

                if (validLineIds.length > 0) {
                    console.log(`  Lines serving station: ${validLineIds.length}`);

                    validLineIds.forEach((lineId, index) => {
                        const lineName = module.getLineName(lineId);
                        if (lineName && lineName.length > 0) {
                            console.log(`    ${index + 1}: ${lineName} (ID: ${lineId})`);
                        }
                    });
                } else {
                    console.log(`  No valid lines found for ${stationName}`);
                }
            } else {
                console.log(`  ❌ getLineIdsFromStation function not available`);
            }

            // Additional check: verify junction status
            // 追加チェック: 分岐駅状態を検証
            const isJunction = module.isJunction(stationId);
            const junctionStatus = (isJunction === 1 || isJunction === true) ? "Yes" : "No";
            console.log(`  Junction station: ${junctionStatus}`);

            console.log();

        } catch (error) {
            console.error(`Error analyzing ${stationName}:`, error.message);
        }
    }
}

/**
 * Demonstrates JR company analysis using getJRCompanys()
 * getJRCompanys()を使用したJR会社解析のデモンストレーション
 */
async function demonstrateJRCompanyAnalysis(module) {
    console.log("=== JR Company Analysis (JR会社解析) ===");

    console.log("Analyzing JR companies and their lines:");
    console.log("JR会社とその路線を解析中:\n");

    try {
        // Core API call: getJRCompanys retrieves all JR company IDs
        // コアAPI呼び出し: getJRCompanysは全JR会社IDを取得します
        if (!module.getJRCompanys) {
            console.log("❌ getJRCompanys function not available");
            return;
        }

        const jrCompanysResult = module.getJRCompanys();
        let jrCompanyIds = [];

        try {
            jrCompanyIds = JSON.parse(jrCompanysResult);
        } catch (e) {
            const cleaned = jrCompanysResult.replace(/[\[\]]/g, '');
            jrCompanyIds = cleaned.length > 0
                ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                : [];
        }

        console.log(`Total JR companies found: ${jrCompanyIds.length}\n`);

        // Analyze each JR company
        // 各JR会社を解析
        for (let i = 0; i < Math.min(jrCompanyIds.length, 5); i++) {
            const companyId = jrCompanyIds[i];

            try {
                console.log(`=== JR Company ${i + 1} (ID: ${companyId}) ===`);

                // Get company name
                // 会社名を取得
                const companyName = module.companyOrPrefectName(companyId);
                console.log(`  Company Name: ${companyName}`);

                // Get lines for this JR company
                // このJR会社の路線を取得
                if (module.linesCompanyOrPrefectId) {
                    const linesResult = module.linesCompanyOrPrefectId(companyId);
                    let lineIds = [];

                    try {
                        lineIds = JSON.parse(linesResult);
                    } catch (e) {
                        const cleaned = linesResult.replace(/[\[\]]/g, '');
                        lineIds = cleaned.length > 0
                            ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                            : [];
                    }

                    console.log(`  Lines operated: ${lineIds.length}`);

                    // Show first few lines as examples
                    // 例として最初のいくつかの路線を表示
                    const linesToShow = lineIds.slice(0, 3);
                    linesToShow.forEach((lineId, index) => {
                        const lineName = module.getLineName(lineId);
                        console.log(`    ${index + 1}: ${lineName} (ID: ${lineId})`);
                    });

                    if (lineIds.length > 3) {
                        console.log(`    ... and ${lineIds.length - 3} more lines`);
                    }
                } else {
                    console.log(`  ❌ Cannot retrieve lines (linesCompanyOrPrefectId not available)`);
                }

                console.log();

            } catch (error) {
                console.error(`Error analyzing JR company ${companyId}:`, error.message);
            }
        }

        if (jrCompanyIds.length > 5) {
            console.log(`... and ${jrCompanyIds.length - 5} more JR companies\n`);
        }

    } catch (error) {
        console.error("Error in JR company analysis:", error.message);
    }
}

/**
 * Demonstrates terminal station identification
 * 終端駅識別のデモンストレーション
 */
async function demonstrateTerminalStations(module) {
    console.log("=== Terminal Station Identification (終端駅識別) ===");

    // Analyze terminal stations on selected lines
    // 選択した路線の終端駅を解析
    const linesToAnalyze = ["山手線", "東海道線", "中央線", "横浜線"];

    console.log("Identifying terminal stations on major lines:");
    console.log("主要路線の終端駅を識別中:\n");

    for (const lineName of linesToAnalyze) {
        try {
            const lineId = module.getLineId(lineName);

            if (lineId <= 0) {
                console.log(`❌ ${lineName} → Line not found`);
                continue;
            }

            console.log(`=== ${lineName} Terminal Analysis ===`);

            // Get all stations on the line
            // 路線上の全駅を取得
            const stationsResult = module.getStationIdsOfLine(lineId);
            let stationIds = [];

            try {
                stationIds = JSON.parse(stationsResult);
            } catch (e) {
                const cleaned = stationsResult.replace(/[\[\]]/g, '');
                stationIds = cleaned.length > 0
                    ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                    : [];
            }

            if (stationIds.length === 0) {
                console.log(`  No stations found for ${lineName}`);
                console.log();
                continue;
            }

            // For linear lines, first and last stations are typically terminals
            // 線形路線では、最初と最後の駅が通常終端駅です
            const firstStation = stationIds[0];
            const lastStation = stationIds[stationIds.length - 1];

            console.log(`  Total stations: ${stationIds.length}`);

            if (lineName === "山手線") {
                // Yamanote Line is circular, no traditional terminals
                // 山手線は環状線のため、従来の終端駅はありません
                console.log(`  Line type: Circular (no terminals)`);
            } else {
                console.log(`  Potential terminal stations:`);

                const firstStationName = module.getStationName(firstStation);
                const lastStationName = module.getStationName(lastStation);

                console.log(`    Start: ${firstStationName} (ID: ${firstStation})`);
                console.log(`    End: ${lastStationName} (ID: ${lastStation})`);

                // Check if terminals are junction stations
                // 終端駅が分岐駅かどうかをチェック
                const firstIsJunction = module.isJunction(firstStation);
                const lastIsJunction = module.isJunction(lastStation);

                console.log(`    Start station is junction: ${firstIsJunction === 1 || firstIsJunction === true ? "Yes" : "No"}`);
                console.log(`    End station is junction: ${lastIsJunction === 1 || lastIsJunction === true ? "Yes" : "No"}`);
            }

            console.log();

        } catch (error) {
            console.error(`Error analyzing terminals for ${lineName}:`, error.message);
        }
    }
}

/**
 * Demonstrates specific junction validation using isSpecificJunction
 * isSpecificJunctionを使用した特定分岐駅検証のデモンストレーション
 */
async function demonstrateSpecificJunctionValidation(module) {
    console.log("=== Specific Junction Validation (特定分岐駅検証) ===");

    console.log("Testing specific junction validation for known junction stations:");
    console.log("既知の分岐駅に対する特定分岐駅検証をテスト中:\n");

    // Test combinations of lines and known junction stations
    // 路線と既知の分岐駅の組み合わせをテスト
    const testCases = [
        { line: "山手線", station: "新宿" },
        { line: "山手線", station: "東京" },
        { line: "東海道線", station: "東京" },
        { line: "中央線", station: "新宿" },
        { line: "横浜線", station: "町田" }
    ];

    for (const testCase of testCases) {
        try {
            const lineId = module.getLineId(testCase.line);
            const stationId = module.getStationId(testCase.station);

            if (lineId <= 0) {
                console.log(`❌ Line ${testCase.line} not found`);
                continue;
            }

            if (stationId <= 0) {
                console.log(`❌ Station ${testCase.station} not found`);
                continue;
            }

            console.log(`=== ${testCase.station} on ${testCase.line} ===`);

            // Core API call: isSpecificJunction checks if a station is a junction for a specific line
            // コアAPI呼び出し: isSpecificJunctionは駅が特定路線の分岐駅かどうかをチェックします
            if (module.isSpecificJunction) {
                const isSpecificJunction = module.isSpecificJunction(lineId, stationId);
                const specificJunctionStatus = (isSpecificJunction === 1 || isSpecificJunction === true) ? "Yes" : "No";
                console.log(`  Is specific junction for ${testCase.line}: ${specificJunctionStatus}`);
            } else {
                console.log(`  ❌ isSpecificJunction function not available`);
            }

            // Compare with general junction status
            // 一般的な分岐駅状態と比較
            const isGeneralJunction = module.isJunction(stationId);
            const generalJunctionStatus = (isGeneralJunction === 1 || isGeneralJunction === true) ? "Yes" : "No";
            console.log(`  Is general junction: ${generalJunctionStatus}`);

            console.log();

        } catch (error) {
            console.error(`Error validating ${testCase.station} on ${testCase.line}:`, error.message);
        }
    }
}

/**
 * Demonstrates performance testing with batch line operations
 * バッチ路線操作によるパフォーマンステストのデモンストレーション
 */
async function demonstratePerformanceTesting(module) {
    console.log("=== Performance Testing (パフォーマンステスト) ===");

    console.log("Testing performance with batch line operations:");
    console.log("バッチ路線操作によるパフォーマンスをテスト中:\n");

    try {
        // Test 1: Batch line name to ID conversion
        // テスト1: バッチ路線名→ID変換
        const lineNames = [
            "山手線", "中央線", "東海道線", "京浜東北線", "総武線",
            "横浜線", "南武線", "京王線", "小田急線", "東急東横線"
        ];

        console.log("Test 1: Batch Line Name → ID Conversion");
        console.log("テスト1: バッチ路線名→ID変換");

        const startTime1 = Date.now();
        let successCount = 0;

        for (const lineName of lineNames) {
            const lineId = module.getLineId(lineName);
            if (lineId > 0) {
                successCount++;
            }
        }

        const endTime1 = Date.now();
        const duration1 = endTime1 - startTime1;

        console.log(`  Processed: ${lineNames.length} lines`);
        console.log(`  Successful conversions: ${successCount}`);
        console.log(`  Duration: ${duration1}ms`);
        console.log(`  Average per conversion: ${(duration1 / lineNames.length).toFixed(2)}ms\n`);

        // Test 2: Batch station retrieval
        // テスト2: バッチ駅取得
        console.log("Test 2: Batch Station Retrieval");
        console.log("テスト2: バッチ駅取得");

        const testLines = ["山手線", "中央線", "東海道線"];
        const startTime2 = Date.now();
        let totalStations = 0;

        for (const lineName of testLines) {
            const lineId = module.getLineId(lineName);
            if (lineId > 0) {
                const stationsResult = module.getStationIdsOfLine(lineId);
                let stationIds = [];

                try {
                    stationIds = JSON.parse(stationsResult);
                } catch (e) {
                    const cleaned = stationsResult.replace(/[\[\]]/g, '');
                    stationIds = cleaned.length > 0
                        ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                        : [];
                }

                totalStations += stationIds.length;
            }
        }

        const endTime2 = Date.now();
        const duration2 = endTime2 - startTime2;

        console.log(`  Lines processed: ${testLines.length}`);
        console.log(`  Total stations retrieved: ${totalStations}`);
        console.log(`  Duration: ${duration2}ms`);
        console.log(`  Average per line: ${(duration2 / testLines.length).toFixed(2)}ms\n`);

        // Test 3: Memory usage estimation
        // テスト3: メモリ使用量推定
        console.log("Test 3: Memory Usage Estimation");
        console.log("テスト3: メモリ使用量推定");

        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            console.log(`  RSS (Resident Set Size): ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
            console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
            console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log(`  Memory usage information not available`);
        }

        console.log();

    } catch (error) {
        console.error("Error in performance testing:", error.message);
    }
}

/**
 * Main execution function that runs all line operations demonstrations
 * 全ての路線操作デモンストレーションを実行するメイン関数
 */
async function main() {
    console.log("Line Operations API Examples");
    console.log("============================");
    console.log("This example demonstrates comprehensive line operations functionality");
    console.log("using the Farert WebAssembly module.\n");

    console.log("このサンプルはFarert WebAssemblyモジュールを使用した");
    console.log("包括的な路線操作機能をデモンストレーションします。\n");

    try {
        // Initialize WebAssembly module
        // WebAssemblyモジュールを初期化
        console.log("Initializing WebAssembly module...");
        console.log("WebAssemblyモジュールを初期化中...");
        const module = await wasmLoader.loadModule();
        console.log("WebAssembly module loaded successfully.\n");
        console.log("WebAssemblyモジュールが正常に読み込まれました。\n");

        // Initialize database connection
        // データベース接続を初期化
        console.log("Initializing database connection...");
        console.log("データベース接続を初期化中...");
        module.openDatabase();
        console.log("Database connection established.\n");
        console.log("データベース接続が確立されました。\n");

        // Execute all line operations demonstrations
        // 全ての路線操作デモンストレーションを実行
        await demonstrateLineNameToId(module);
        await demonstrateLineIdToName(module);
        await demonstrateLineStations(module);
        await demonstrateJunctionDetection(module);
        await demonstrateCompanyPrefectureLines(module);
        await demonstrateLineConnectivity(module);

        // Execute enhanced line operations demonstrations
        // 拡張された路線操作デモンストレーションを実行
        await demonstrateStationLineMapping(module);
        await demonstrateJRCompanyAnalysis(module);
        await demonstrateTerminalStations(module);
        await demonstrateSpecificJunctionValidation(module);
        await demonstratePerformanceTesting(module);

        console.log("=== Line Operations Examples Complete ===");
        console.log("=== 路線操作サンプル完了 ===");

    } catch (error) {
        console.error("Fatal error occurred during execution:");
        console.error("実行中に致命的なエラーが発生しました:");
        console.error(error);
        process.exit(1);
    }
}

// Export functions for individual testing
// 個別テスト用に関数をエクスポート
module.exports = {
    demonstrateLineNameToId,
    demonstrateLineIdToName,
    demonstrateLineStations,
    demonstrateJunctionDetection,
    demonstrateCompanyPrefectureLines,
    demonstrateLineConnectivity,
    demonstrateStationLineMapping,
    demonstrateJRCompanyAnalysis,
    demonstrateTerminalStations,
    demonstrateSpecificJunctionValidation,
    demonstratePerformanceTesting
};

// Execute if run directly
// 直接実行された場合に実行
if (require.main === module) {
    main().catch(console.error);
}