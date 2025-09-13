/**
 * Station Lookup API Example
 * 駅検索APIサンプル
 *
 * This example demonstrates how to use station-related API functions for:
 * - Converting between station names and IDs
 * - Retrieving station information including hiragana readings
 * - Looking up prefecture data for stations
 *
 * このサンプルは以下の駅関連API機能の使用方法を示します：
 * - 駅名とIDの相互変換
 * - ひらがな読みを含む駅情報の取得
 * - 駅の都道府県データの検索
 *
 * Execution / 実行方法:
 * node examples/api/basic/station-lookup.js
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

/**
 * Demonstrates basic station name to ID conversion
 * 基本的な駅名→ID変換のデモンストレーション
 */
async function demonstrateStationNameToId(module) {
    console.log("=== Station Name → ID Conversion (駅名→ID変換) ===");

    // List of common station names to test
    // テスト用の一般的な駅名リスト
    const stationNames = [
        "東京",      // Tokyo - Major JR hub station
        "新宿",      // Shinjuku - Busiest station in the world
        "横浜",      // Yokohama - Major city station in Kanagawa
        "大阪",      // Osaka - Major Kansai region hub
        "名古屋",    // Nagoya - Major Chubu region hub
        "京都",      // Kyoto - Historic city station
        "存在しない駅" // Non-existent station for error handling demo
    ];

    console.log("Testing station name → ID conversion for major stations:");
    console.log("主要駅の駅名→ID変換をテスト中:\n");

    for (const stationName of stationNames) {
        try {
            // Core API call: getStationId converts station name to unique numeric ID
            // コアAPI呼び出し: getStationIdは駅名を一意の数値IDに変換します
            const stationId = module.getStationId(stationName);

            if (stationId > 0) {
                console.log(`✅ ${stationName} → Station ID: ${stationId}`);
            } else {
                console.log(`❌ ${stationName} → Station not found (ID: ${stationId})`);
            }
        } catch (error) {
            console.log(`⚠️ ${stationName} → Error: ${error.message}`);
        }
    }
    console.log();
}

/**
 * Demonstrates station ID to name conversion with detailed information
 * 詳細情報付きの駅ID→名前変換のデモンストレーション
 */
async function demonstrateStationIdToName(module) {
    console.log("=== Station ID → Name Conversion (駅ID→駅名変換) ===");

    // Get station IDs from previous conversion for testing
    // テスト用に前の変換から駅IDを取得
    const testStations = [
        { name: "東京", id: null },
        { name: "新宿", id: null },
        { name: "横浜", id: null }
    ];

    // First get the IDs
    // まずIDを取得
    for (const station of testStations) {
        station.id = module.getStationId(station.name);
    }

    console.log("Demonstrating ID → name conversion with station details:");
    console.log("駅詳細情報付きのID→名前変換をデモンストレーション:\n");

    for (const station of testStations) {
        if (station.id > 0) {
            try {
                // Core API call: getStationName converts station ID back to name
                // コアAPI呼び出し: getStationNameは駅IDを駅名に変換し戻します
                const retrievedName = module.getStationName(station.id);

                // Additional API: getStationNameExtended for detailed name with disambiguators
                // 追加API: 曖昧さ回避付きの詳細名前用のgetStationNameExtended
                const extendedName = module.getStationNameExtended
                    ? module.getStationNameExtended(station.id)
                    : retrievedName + " (拡張名前関数利用不可)";

                console.log(`Station ID ${station.id}:`);
                console.log(`  Standard Name: ${retrievedName}`);
                console.log(`  Extended Name: ${extendedName}`);
                console.log();

            } catch (error) {
                console.log(`⚠️ Station ID ${station.id} → Error: ${error.message}`);
            }
        }
    }
}

/**
 * Demonstrates hiragana reading retrieval for stations
 * 駅のひらがな読み取得のデモンストレーション
 */
async function demonstrateStationKanaReading(module) {
    console.log("=== Station Hiragana Reading (駅ひらがな読み) ===");

    // Test stations with interesting reading patterns
    // 興味深い読みパターンを持つテスト駅
    const stationsForKana = [
        "東京",    // とうきょう
        "新宿",    // しんじゅく
        "横浜",    // よこはま
        "渋谷",    // しぶや
        "池袋",    // いけぶくろ
        "上野"     // うえの
    ];

    console.log("Retrieving hiragana readings for station names:");
    console.log("駅名のひらがな読みを取得中:\n");

    for (const stationName of stationsForKana) {
        try {
            const stationId = module.getStationId(stationName);

            if (stationId > 0) {
                // Core API call: getKanaFromStationId retrieves hiragana reading
                // コアAPI呼び出し: getKanaFromStationIdはひらがな読みを取得します
                let kanaReading = "読み取得不可";

                if (module.getKanaFromStationId) {
                    kanaReading = module.getKanaFromStationId(stationId) || "読み不明";
                } else if (module.getStationKana) {
                    // Alternative API name that might be available
                    // 利用可能かもしれない代替API名
                    kanaReading = module.getStationKana(stationId) || "読み不明";
                }

                console.log(`${stationName} (${kanaReading}) → ID: ${stationId}`);
            } else {
                console.log(`❌ ${stationName} → Station not found`);
            }

        } catch (error) {
            console.log(`⚠️ ${stationName} → Error: ${error.message}`);
        }
    }
    console.log();
}

/**
 * Demonstrates prefecture lookup for stations
 * 駅の都道府県検索のデモンストレーション
 */
async function demonstrateStationPrefectureLookup(module) {
    console.log("=== Station Prefecture Information (駅都道府県情報) ===");

    // Stations from different prefectures for testing
    // 異なる都道府県のテスト用駅
    const stationsAcrossPrefectures = [
        "東京",      // Tokyo (Tokyo)
        "横浜",      // Yokohama (Kanagawa)
        "大阪",      // Osaka (Osaka)
        "名古屋",    // Nagoya (Aichi)
        "札幌",      // Sapporo (Hokkaido)
        "福岡"       // Fukuoka (Fukuoka)
    ];

    console.log("Looking up prefecture information for stations across Japan:");
    console.log("日本全国の駅の都道府県情報を検索中:\n");

    for (const stationName of stationsAcrossPrefectures) {
        try {
            const stationId = module.getStationId(stationName);

            if (stationId > 0) {
                let prefectureInfo = "都道府県情報取得不可";

                // Try different API function names that might be available
                // 利用可能かもしれない異なるAPI関数名を試行
                if (module.getStationPrefecture) {
                    prefectureInfo = module.getStationPrefecture(stationId) || "都道府県不明";
                } else if (module.stationPrefecture) {
                    prefectureInfo = module.stationPrefecture(stationId) || "都道府県不明";
                } else {
                    // If direct prefecture function isn't available, we could try
                    // analyzing the station ID or using other methods
                    // 直接的な都道府県関数が利用できない場合は、
                    // 駅IDを分析するか他の方法を使用できます
                    prefectureInfo = "都道府県API利用不可";
                }

                console.log(`${stationName} (ID: ${stationId})`);
                console.log(`  Prefecture: ${prefectureInfo}`);
                console.log();

            } else {
                console.log(`❌ ${stationName} → Station not found in database`);
            }

        } catch (error) {
            console.log(`⚠️ ${stationName} → Error: ${error.message}`);
        }
    }
}

/**
 * Demonstrates junction station detection and analysis
 * 分岐駅検出と分析のデモンストレーション
 */
async function demonstrateJunctionDetection(module) {
    console.log("=== Junction Station Detection (分岐駅検出) ===");

    // Major stations to test for junction status
    // 分岐駅状況をテストする主要駅
    const testStations = [
        "東京",      // Tokyo - Major JR hub with multiple lines
        "新宿",      // Shinjuku - Major junction in Tokyo
        "横浜",      // Yokohama - Major junction in Kanagawa
        "大阪",      // Osaka - Major junction in Kansai
        "名古屋",    // Nagoya - Major junction in Chubu
        "京都",      // Kyoto - Major junction in Kansai
        "大宮",      // Omiya - Major junction in Saitama
        "上野",      // Ueno - Tokyo station with multiple lines
        "品川",      // Shinagawa - Major southern Tokyo junction
        "渋谷"       // Shibuya - Tokyo junction station
    ];

    console.log("Analyzing junction status for major stations:");
    console.log("主要駅の分岐駅状況を分析中:\n");

    const junctionStations = [];
    const regularStations = [];

    for (const stationName of testStations) {
        try {
            const stationId = module.getStationId(stationName);

            if (stationId > 0) {
                // Core API call: isJunction determines if station is a junction
                // コアAPI呼び出し: isJunctionは駅が分岐駅かどうかを判定します
                const isJunctionResult = module.isJunction(stationId);
                const isJunctionStation = (isJunctionResult === 1 || isJunctionResult === true);

                // Get additional station information
                // 追加の駅情報を取得
                const stationKana = module.getKanaFromStationId ?
                    module.getKanaFromStationId(stationId) || "読み不明" : "読み取得不可";

                const prefectureInfo = module.getStationPrefecture ?
                    module.getStationPrefecture(stationId) || "都道府県不明" : "都道府県取得不可";

                const stationInfo = {
                    name: stationName,
                    id: stationId,
                    kana: stationKana,
                    prefecture: prefectureInfo,
                    isJunction: isJunctionStation
                };

                if (isJunctionStation) {
                    junctionStations.push(stationInfo);
                    console.log(`🚄 ${stationName} (${stationKana}) → Junction Station (分岐駅)`);
                } else {
                    regularStations.push(stationInfo);
                    console.log(`🚉 ${stationName} (${stationKana}) → Regular Station (通常駅)`);
                }

                console.log(`   ID: ${stationId}, Prefecture: ${prefectureInfo}`);

            } else {
                console.log(`❌ ${stationName} → Station not found in database`);
            }

        } catch (error) {
            console.log(`⚠️ ${stationName} → Error: ${error.message}`);
        }

        console.log();
    }

    // Summary of junction analysis
    // 分岐駅分析の要約
    console.log("=== Junction Analysis Summary (分岐駅分析要約) ===");
    console.log(`Junction stations found: ${junctionStations.length} out of ${testStations.length} tested`);
    console.log(`発見された分岐駅: ${junctionStations.length}駅/${testStations.length}駅中\n`);

    if (junctionStations.length > 0) {
        console.log("Major Junction Stations (主要分岐駅):");
        junctionStations.forEach((station, index) => {
            console.log(`${index + 1}. ${station.name} (${station.kana}) - ${station.prefecture}`);
        });
        console.log();
    }
}

/**
 * Demonstrates comprehensive station information retrieval
 * 包括的な駅情報取得のデモンストレーション
 */
async function demonstrateComprehensiveStationInfo(module) {
    console.log("=== Comprehensive Station Information (包括的駅情報) ===");

    // Select stations from different regions for comprehensive analysis
    // 包括的分析のため異なる地域から駅を選択
    const stationsForAnalysis = [
        "東京",      // Tokyo - Capital region
        "横浜",      // Yokohama - Kanagawa prefecture
        "大阪",      // Osaka - Kansai region
        "名古屋",    // Nagoya - Chubu region
        "札幌",      // Sapporo - Hokkaido region
        "福岡",      // Fukuoka - Kyushu region (might not exist in DB)
        "京都"       // Kyoto - Historical city
    ];

    console.log("Retrieving comprehensive information for selected stations:");
    console.log("選択された駅の包括的情報を取得中:\n");

    for (const stationName of stationsForAnalysis) {
        try {
            const stationId = module.getStationId(stationName);

            if (stationId > 0) {
                console.log(`📍 Station: ${stationName} (駅)`);
                console.log("─".repeat(50));

                // Basic information
                // 基本情報
                console.log("Basic Information (基本情報):");
                console.log(`  Station ID: ${stationId}`);
                console.log(`  Station Name: ${module.getStationName(stationId)}`);

                // Extended name if available
                // 拡張名前が利用可能な場合
                const extendedName = module.getStationNameExtended ?
                    module.getStationNameExtended(stationId) : "拡張名前利用不可";
                console.log(`  Extended Name: ${extendedName}`);

                // Hiragana reading
                // ひらがな読み
                const kanaReading = module.getKanaFromStationId ?
                    module.getKanaFromStationId(stationId) || "読み不明" : "読み取得不可";
                console.log(`  Kana Reading: ${kanaReading}`);

                // Prefecture information
                // 都道府県情報
                const prefecture = module.getStationPrefecture ?
                    module.getStationPrefecture(stationId) || "都道府県不明" : "都道府県取得不可";
                console.log(`  Prefecture: ${prefecture}`);

                // Junction status
                // 分岐駅状況
                const isJunctionResult = module.isJunction(stationId);
                const isJunctionStation = (isJunctionResult === 1 || isJunctionResult === true);
                console.log(`  Junction Status: ${isJunctionStation ? "Junction (分岐駅)" : "Regular (通常駅)"}`);

                // Line information if available
                // 路線情報が利用可能な場合
                console.log("\nLine Information (路線情報):");
                if (module.getLineIdsFromStation) {
                    try {
                        const linesResult = module.getLineIdsFromStation(stationId);
                        let lineIds = [];
                        try {
                            lineIds = JSON.parse(linesResult);
                        } catch (e) {
                            const cleaned = linesResult.replace(/[\[\]]/g, '');
                            lineIds = cleaned.length > 0 ? cleaned.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0) : [];
                        }

                        if (lineIds.length > 0) {
                            console.log(`  Connected Lines: ${lineIds.length} lines`);
                            lineIds.slice(0, 5).forEach((lineId, index) => { // Show max 5 lines
                                const lineName = module.getLineName ? module.getLineName(lineId) : `Line ${lineId}`;
                                console.log(`    ${index + 1}. ${lineName} (ID: ${lineId})`);
                            });
                            if (lineIds.length > 5) {
                                console.log(`    ... and ${lineIds.length - 5} more lines`);
                            }
                        } else {
                            console.log("  No line information available");
                        }
                    } catch (error) {
                        console.log(`  Line information error: ${error.message}`);
                    }
                } else {
                    console.log("  Line information API not available");
                }

            } else {
                console.log(`❌ Station "${stationName}" not found in database`);
            }

        } catch (error) {
            console.log(`⚠️ Error retrieving information for ${stationName}: ${error.message}`);
        }

        console.log("\n" + "=".repeat(60) + "\n");
    }
}

/**
 * Demonstrates advanced station search by partial matching and multiple criteria
 * 部分マッチングと複数条件による高度な駅検索のデモンストレーション
 */
async function demonstrateAdvancedStationSearch(module) {
    console.log("=== Advanced Station Search & Filtering (高度な駅検索・フィルタリング) ===");

    // Demonstrate different search approaches
    // 異なる検索アプローチをデモンストレーション

    console.log("1. Partial Name Matching (部分名前マッチング):");
    console.log("─".repeat(40));

    const searchTerms = [
        { kanji: "新", reading: "しん", meaning: "New/Shin" },
        { kanji: "東", reading: "ひがし", meaning: "East" },
        { kanji: "駅", reading: "えき", meaning: "Station" }
    ];

    for (const term of searchTerms) {
        console.log(`\nSearching for stations containing '${term.kanji}' (${term.reading} - ${term.meaning}):`);
        console.log(`'${term.kanji}'を含む駅を検索 (${term.reading} - ${term.meaning}):`);

        try {
            // Use built-in search API if available
            // 内蔵検索APIが利用可能な場合は使用
            if (module.searchStationsByKeyword) {
                const searchResults = module.searchStationsByKeyword(term.kanji);
                console.log(`  WebAssembly search results: ${searchResults}`);

                // If results are returned as array/string, parse and display sample
                // 結果が配列/文字列で返される場合、解析してサンプルを表示
                if (typeof searchResults === 'string' && searchResults.startsWith('[')) {
                    try {
                        const stationIds = JSON.parse(searchResults);
                        if (Array.isArray(stationIds) && stationIds.length > 0) {
                            console.log(`  Found ${stationIds.length} matching stations. First 5:`);
                            stationIds.slice(0, 5).forEach((id, index) => {
                                const name = module.getStationName(id);
                                const kana = module.getKanaFromStationId ? module.getKanaFromStationId(id) || "読み不明" : "読み取得不可";
                                console.log(`    ${index + 1}. ${name} (${kana}) - ID: ${id}`);
                            });
                        }
                    } catch (parseError) {
                        console.log(`  Search returned data but parsing failed: ${searchResults.substring(0, 100)}...`);
                    }
                }
            } else {
                // Fallback: manual search with known candidates
                // フォールバック: 既知の候補での手動検索
                const candidates = term.kanji === "新" ?
                    ["新宿", "新橋", "新横浜", "新大阪", "新神戸"] :
                    term.kanji === "東" ?
                    ["東京", "東神奈川", "東戸塚", "東海", "東松山"] :
                    ["駅前", "中央駅", "北駅", "南駅", "西駅"];

                console.log(`  Using manual search with ${candidates.length} candidates:`);
                const foundStations = [];

                for (const candidate of candidates) {
                    const stationId = module.getStationId(candidate);
                    if (stationId > 0) {
                        const kana = module.getKanaFromStationId ?
                            module.getKanaFromStationId(stationId) || "読み不明" : "読み取得不可";
                        foundStations.push({ name: candidate, id: stationId, kana });
                    }
                }

                if (foundStations.length > 0) {
                    foundStations.forEach((station, index) => {
                        console.log(`    ${index + 1}. ${station.name} (${station.kana}) - ID: ${station.id}`);
                    });
                } else {
                    console.log(`    No matching stations found among candidates`);
                }
            }

        } catch (error) {
            console.log(`  ⚠️ Search error: ${error.message}`);
        }
    }

    console.log("\n2. Prefecture-based Filtering (都道府県ベースフィルタリング):");
    console.log("─".repeat(50));

    // Demonstrate prefecture-based station filtering
    // 都道府県ベースの駅フィルタリングをデモンストレーション
    const targetPrefectures = ["東京都", "神奈川県", "大阪府"];

    for (const prefecture of targetPrefectures) {
        console.log(`\nStations in ${prefecture} (${prefecture}の駅):`);

        // Test a few major stations that should be in each prefecture
        // 各都道府県にあるはずの主要駅をいくつかテスト
        const testStations = prefecture === "東京都" ?
            ["東京", "新宿", "渋谷", "上野", "品川"] :
            prefecture === "神奈川県" ?
            ["横浜", "川崎", "藤沢", "相模原"] :
            ["大阪", "梅田", "難波", "天王寺"];

        let foundInPrefecture = 0;
        for (const stationName of testStations) {
            const stationId = module.getStationId(stationName);
            if (stationId > 0) {
                const stationPrefecture = module.getStationPrefecture ?
                    module.getStationPrefecture(stationId) : "都道府県取得不可";

                if (stationPrefecture.includes(prefecture.substring(0, 2))) { // Match prefix
                    foundInPrefecture++;
                    const kana = module.getKanaFromStationId ?
                        module.getKanaFromStationId(stationId) || "読み不明" : "読み取得不可";
                    console.log(`  ✅ ${stationName} (${kana}) - ID: ${stationId}`);
                } else {
                    console.log(`  ❓ ${stationName} - Expected ${prefecture}, got ${stationPrefecture}`);
                }
            } else {
                console.log(`  ❌ ${stationName} - Not found in database`);
            }
        }
        console.log(`  Found ${foundInPrefecture}/${testStations.length} expected stations in ${prefecture}`);
    }
}

/**
 * Demonstrates comprehensive error handling and input validation
 * 包括的エラーハンドリングと入力検証のデモンストレーション
 */
async function demonstrateErrorHandlingAndValidation(module) {
    console.log("=== Error Handling & Input Validation (エラーハンドリング・入力検証) ===");

    console.log("1. Invalid Station ID Handling (無効な駅IDの処理):");
    console.log("─".repeat(45));

    // Test various invalid station IDs
    // 様々な無効な駅IDをテスト
    const invalidIds = [
        -1,         // Negative ID
        0,          // Zero ID
        999999,     // Very large ID
        null,       // Null value
        undefined,  // Undefined value
        "invalid",  // String instead of number
        3.14159     // Float instead of integer
    ];

    for (const invalidId of invalidIds) {
        try {
            console.log(`\nTesting invalid station ID: ${invalidId} (type: ${typeof invalidId})`);
            console.log(`無効な駅ID ${invalidId} をテスト中 (型: ${typeof invalidId}):`);

            if (typeof invalidId !== 'number' || invalidId === null || invalidId === undefined) {
                console.log(`  ⚠️ Input validation: Invalid type, skipping API call`);
                continue;
            }

            const stationName = module.getStationName(invalidId);
            if (stationName && stationName.length > 0) {
                console.log(`  ✅ Unexpectedly found: ${stationName}`);
            } else {
                console.log(`  ✅ Expected result: No station found (empty or null name)`);
            }

        } catch (error) {
            console.log(`  ✅ Expected error caught: ${error.message}`);
        }
    }

    console.log("\n2. Invalid Station Name Handling (無効な駅名の処理):");
    console.log("─".repeat(50));

    // Test various invalid station names
    // 様々な無効な駅名をテスト
    const invalidNames = [
        "",             // Empty string
        "   ",          // Whitespace only
        "非存在駅名123456", // Long non-existent name
        "ABC123",       // ASCII characters
        "駅駅駅駅駅駅駅駅駅駅駅駅駅駅駅", // Repetitive characters
        "特殊文字!@#$%", // Special characters
        null,           // Null
        undefined,      // Undefined
        123,            // Number instead of string
        "🚄🚃🚂"       // Emoji characters
    ];

    for (const invalidName of invalidNames) {
        try {
            console.log(`\nTesting invalid station name: "${invalidName}" (type: ${typeof invalidName})`);
            console.log(`無効な駅名 "${invalidName}" をテスト中 (型: ${typeof invalidName}):`);

            if (typeof invalidName !== 'string' || invalidName === null || invalidName === undefined) {
                console.log(`  ⚠️ Input validation: Invalid type, skipping API call`);
                continue;
            }

            if (invalidName.trim().length === 0) {
                console.log(`  ⚠️ Input validation: Empty string after trimming`);
                continue;
            }

            const stationId = module.getStationId(invalidName);
            if (stationId > 0) {
                console.log(`  ⚠️ Unexpectedly found station ID: ${stationId}`);
                // Double-check by getting name back
                const retrievedName = module.getStationName(stationId);
                console.log(`  Retrieved name: ${retrievedName}`);
            } else {
                console.log(`  ✅ Expected result: No station found (ID: ${stationId})`);
            }

        } catch (error) {
            console.log(`  ✅ Expected error caught: ${error.message}`);
        }
    }

    console.log("\n3. API Function Availability Validation (API関数利用可能性検証):");
    console.log("─".repeat(60));

    // Test availability of various station-related functions
    // 様々な駅関連関数の利用可能性をテスト
    const stationApiFunctions = [
        'getStationId',
        'getStationName',
        'getStationNameExtended',
        'getKanaFromStationId',
        'getStationPrefecture',
        'isJunction',
        'getLineIdsFromStation',
        'searchStationsByKeyword',
        'getStationsByPrefix',
        'validateStationId',
        'validateStationName'
    ];

    console.log("Checking API function availability:");
    console.log("API関数の利用可能性をチェック中:\n");

    const availableFunctions = [];
    const unavailableFunctions = [];

    stationApiFunctions.forEach(funcName => {
        if (typeof module[funcName] === 'function') {
            availableFunctions.push(funcName);
            console.log(`  ✅ ${funcName} - Available`);
        } else {
            unavailableFunctions.push(funcName);
            console.log(`  ❌ ${funcName} - Not available`);
        }
    });

    console.log(`\nSummary: ${availableFunctions.length}/${stationApiFunctions.length} functions available`);
    console.log(`要約: ${availableFunctions.length}/${stationApiFunctions.length} 関数が利用可能\n`);

    console.log("4. Memory and Performance Validation (メモリ・パフォーマンス検証):");
    console.log("─".repeat(55));

    // Test performance and memory usage with bulk operations
    // 一括操作でパフォーマンスとメモリ使用量をテスト
    const testStations = ["東京", "新宿", "横浜", "大阪", "名古屋"];
    const iterations = 100;

    console.log(`Performing ${iterations} iterations of station lookups for performance testing:`);
    console.log(`パフォーマンステストのため ${iterations} 回の駅検索を実行中:\n`);

    const startTime = Date.now();
    let successfulLookups = 0;
    let errors = 0;

    for (let i = 0; i < iterations; i++) {
        for (const station of testStations) {
            try {
                const stationId = module.getStationId(station);
                if (stationId > 0) {
                    const retrievedName = module.getStationName(stationId);
                    const kana = module.getKanaFromStationId ? module.getKanaFromStationId(stationId) : null;
                    successfulLookups++;
                }
            } catch (error) {
                errors++;
            }
        }
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const totalOperations = iterations * testStations.length;

    console.log(`Performance Results:`);
    console.log(`パフォーマンス結果:`);
    console.log(`  Total operations: ${totalOperations}`);
    console.log(`  Successful lookups: ${successfulLookups}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Total time: ${totalTime}ms`);
    console.log(`  Average time per operation: ${(totalTime / totalOperations).toFixed(2)}ms`);
    console.log(`  Operations per second: ${(totalOperations / (totalTime / 1000)).toFixed(0)}`);

    if (totalTime < 5000 && errors === 0) {
        console.log(`  ✅ Performance test passed (under 5 seconds, no errors)`);
    } else {
        console.log(`  ⚠️ Performance concerns detected`);
    }
}

/**
 * Main execution function that runs all station lookup demonstrations
 * 全ての駅検索デモンストレーションを実行するメイン関数
 */
async function main() {
    console.log("Comprehensive Station Lookup API Examples");
    console.log("==========================================");
    console.log("This example demonstrates comprehensive station lookup functionality");
    console.log("using the Farert WebAssembly module with extensive API coverage.\n");

    console.log("このサンプルはFarert WebAssemblyモジュールを使用した");
    console.log("包括的な駅検索機能を広範囲なAPIカバレッジでデモンストレーションします。\n");

    try {
        // Initialize WebAssembly module
        // WebAssemblyモジュールを初期化
        console.log("🔧 Initializing WebAssembly module...");
        console.log("🔧 WebAssemblyモジュールを初期化中...");
        const module = await wasmLoader.loadModule();
        console.log("✅ WebAssembly module loaded successfully");
        console.log("✅ WebAssemblyモジュールが正常に読み込まれました\n");

        // Initialize database connection
        // データベース接続を初期化
        console.log("🗄️ Initializing database connection...");
        console.log("🗄️ データベース接続を初期化中...");
        module.openDatabase();
        console.log("✅ Database connection established");
        console.log("✅ データベース接続が確立されました\n");

        // Execute comprehensive station lookup demonstrations
        // 包括的な駅検索デモンストレーションを実行
        console.log("🚀 Starting comprehensive API demonstrations...");
        console.log("🚀 包括的APIデモンストレーションを開始中...\n");

        // Core station API demonstrations
        // コア駅API デモンストレーション
        await demonstrateStationNameToId(module);
        await demonstrateStationIdToName(module);
        await demonstrateStationKanaReading(module);
        await demonstrateStationPrefectureLookup(module);

        // Advanced station functionality demonstrations
        // 高度な駅機能デモンストレーション
        await demonstrateJunctionDetection(module);
        await demonstrateComprehensiveStationInfo(module);
        await demonstrateAdvancedStationSearch(module);

        // Error handling and validation demonstrations
        // エラーハンドリングと検証デモンストレーション
        await demonstrateErrorHandlingAndValidation(module);

        console.log("🎉 === Comprehensive Station Lookup Examples Complete ===");
        console.log("🎉 === 包括的駅検索サンプル完了 ===");
        console.log("\n📊 Summary of demonstrated APIs:");
        console.log("📊 デモンストレーションされたAPIの要約:");
        console.log("  • Station name ⇄ ID conversion (駅名⇄ID変換)");
        console.log("  • Hiragana reading retrieval (ひらがな読み取得)");
        console.log("  • Prefecture information lookup (都道府県情報検索)");
        console.log("  • Junction station detection (分岐駅検出)");
        console.log("  • Line information retrieval (路線情報取得)");
        console.log("  • Advanced search capabilities (高度な検索機能)");
        console.log("  • Comprehensive error handling (包括的エラーハンドリング)");
        console.log("  • Input validation & performance testing (入力検証・パフォーマンステスト)");

    } catch (error) {
        console.error("💥 Fatal error occurred during execution:");
        console.error("💥 実行中に致命的なエラーが発生しました:");
        console.error(error);
        process.exit(1);
    }
}

// Export functions for individual testing
// 個別テスト用に関数をエクスポート
module.exports = {
    // Core station API demonstrations
    // コア駅APIデモンストレーション
    demonstrateStationNameToId,
    demonstrateStationIdToName,
    demonstrateStationKanaReading,
    demonstrateStationPrefectureLookup,

    // Advanced station functionality demonstrations
    // 高度な駅機能デモンストレーション
    demonstrateJunctionDetection,
    demonstrateComprehensiveStationInfo,
    demonstrateAdvancedStationSearch,

    // Error handling and validation demonstrations
    // エラーハンドリングと検証デモンストレーション
    demonstrateErrorHandlingAndValidation,

    // Main execution function
    // メイン実行関数
    main
};

// Execute if run directly
// 直接実行された場合に実行
if (require.main === module) {
    main().catch(console.error);
}