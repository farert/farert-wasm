/**
 * Route Building API Example
 * 経路構築APIサンプル
 *
 * This example demonstrates comprehensive route construction functionality for:
 * - Step-by-step route building using addRoute APIs
 * - Route validation and connectivity checking
 * - Fare calculation with calculateFare
 * - Route description generation and display
 *
 * このサンプルは以下の経路構築機能の包括的な使用方法を示します：
 * - addRoute APIを使用したステップ別経路構築
 * - 経路検証と接続性チェック
 * - calculateFareによる運賃計算
 * - 経路説明の生成と表示
 *
 * Execution / 実行方法:
 * node examples/api/basic/route-building.js
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

/**
 * Demonstrates basic route construction using addRoute API
 * addRoute APIを使用した基本的な経路構築のデモンストレーション
 */
async function demonstrateBasicRouteBuilding(module) {
    console.log("=== Basic Route Building (基本経路構築) ===");

    console.log("Building a simple route: Tokyo → Shimbashi → Yokohama");
    console.log("簡単な経路を構築中: 東京 → 新橋 → 横浜\n");

    try {
        // Step 1: Get station and line IDs for the route
        // ステップ1: 経路の駅と路線IDを取得
        const tokyoId = module.getStationId("東京");
        const shimbashiId = module.getStationId("新橋");
        const yokohamaId = module.getStationId("横浜");
        const tokaidoLineId = module.getLineId("東海道線");

        console.log("Station and Line IDs:");
        console.log(`  Tokyo (東京): ${tokyoId}`);
        console.log(`  Shimbashi (新橋): ${shimbashiId}`);
        console.log(`  Yokohama (横浜): ${yokohamaId}`);
        console.log(`  Tokaido Line (東海道線): ${tokaidoLineId}\n`);

        if (tokyoId <= 0 || shimbashiId <= 0 || yokohamaId <= 0 || tokaidoLineId <= 0) {
            console.log("❌ Cannot build route: Some stations or lines not found");
            return;
        }

        // Step 2: Initialize route building
        // ステップ2: 経路構築を初期化
        console.log("Step 1: Setting route starting point (経路開始点を設定)");

        // Core API call: addRouteBegin sets the starting station
        // コアAPI呼び出し: addRouteBeginは開始駅を設定します
        const beginResult = module.addRouteBegin
            ? module.addRouteBegin(tokyoId)
            : module.addRoute ? module.addRoute(0, tokyoId) : -1;

        if (beginResult < 0) {
            console.log(`❌ Failed to set starting station: ${beginResult}`);
            return;
        }

        console.log(`✅ Route started at Tokyo (result: ${beginResult})`);

        // Step 3: Add route segments
        // ステップ3: 経路セグメントを追加
        console.log("\nStep 2: Adding route segments (経路セグメントを追加)");

        // Core API call: addRoute adds a line-station segment to the route
        // コアAPI呼び出し: addRouteは路線-駅セグメントを経路に追加します
        const segment1Result = module.addRoute(tokaidoLineId, shimbashiId);
        console.log(`  Tokyo → Shimbashi via Tokaido Line: ${segment1Result}`);

        const segment2Result = module.addRoute(tokaidoLineId, yokohamaId);
        console.log(`  Shimbashi → Yokohama via Tokaido Line: ${segment2Result}`);

        if (segment1Result < 0 || segment2Result < 0) {
            console.log("❌ Failed to build complete route");
            return;
        }

        console.log("✅ Route construction completed successfully\n");

        // Step 4: Generate route description
        // ステップ4: 経路説明を生成
        console.log("Step 3: Generating route description (経路説明を生成)");

        if (module.routeScript) {
            // Core API call: routeScript generates human-readable route description
            // コアAPI呼び出し: routeScriptは人間が読める経路説明を生成します
            const routeDescription = module.routeScript();
            console.log(`Route Description: ${routeDescription}\n`);
        } else {
            console.log("Route description function not available\n");
        }

        // Step 5: Calculate fare for the route
        // ステップ5: 経路の運賃を計算
        console.log("Step 4: Calculating route fare (経路運賃を計算)");

        // Core API call: calculateFare computes the total fare for the built route
        // コアAPI呼び出し: calculateFareは構築された経路の総運賃を計算します
        const fareResult = module.calculateFare();
        console.log(`Calculated Fare: ¥${fareResult}`);

        // Get detailed fare information if available
        // 利用可能な場合は詳細運賃情報を取得
        if (module.getFareString) {
            const fareDetails = module.getFareString();
            console.log(`Fare Details: ${fareDetails}`);
        }

        console.log();

    } catch (error) {
        console.error("Error in basic route building:", error.message);
    }
}

/**
 * Demonstrates multi-line route construction with transfers
 * 乗り換えありの複数路線経路構築のデモンストレーション
 */
async function demonstrateComplexRouteBuilding(module) {
    console.log("=== Complex Route with Transfers (乗り換えあり複雑経路) ===");

    console.log("Building complex route: Shinjuku → Tokyo → Yokohama");
    console.log("複雑な経路を構築中: 新宿 → 東京 → 横浜");
    console.log("Using: Yamanote Line + Tokaido Line\n");

    try {
        // Get all required IDs
        // 必要なIDを全て取得
        const shinjukuId = module.getStationId("新宿");
        const tokyoId = module.getStationId("東京");
        const yokohamaId = module.getStationId("横浜");
        const yamanoteLineId = module.getLineId("山手線");
        const tokaidoLineId = module.getLineId("東海道線");

        console.log("Station and Line IDs for complex route:");
        console.log(`  Shinjuku (新宿): ${shinjukuId}`);
        console.log(`  Tokyo (東京): ${tokyoId}`);
        console.log(`  Yokohama (横浜): ${yokohamaId}`);
        console.log(`  Yamanote Line (山手線): ${yamanoteLineId}`);
        console.log(`  Tokaido Line (東海道線): ${tokaidoLineId}\n`);

        if (shinjukuId <= 0 || tokyoId <= 0 || yokohamaId <= 0 ||
            yamanoteLineId <= 0 || tokaidoLineId <= 0) {
            console.log("❌ Cannot build complex route: Some stations or lines not found");
            return;
        }

        // Initialize route at Shinjuku
        // 新宿で経路を初期化
        console.log("Building route step by step:");

        const beginResult = module.addRouteBegin
            ? module.addRouteBegin(shinjukuId)
            : module.addRoute ? module.addRoute(0, shinjukuId) : -1;

        console.log(`1. Started at Shinjuku (result: ${beginResult})`);

        // First segment: Shinjuku → Tokyo via Yamanote Line
        // 第1セグメント: 新宿 → 東京 (山手線)
        const segment1 = module.addRoute(yamanoteLineId, tokyoId);
        console.log(`2. Added Shinjuku → Tokyo via Yamanote Line (result: ${segment1})`);

        // Second segment: Tokyo → Yokohama via Tokaido Line
        // 第2セグメント: 東京 → 横浜 (東海道線)
        const segment2 = module.addRoute(tokaidoLineId, yokohamaId);
        console.log(`3. Added Tokyo → Yokohama via Tokaido Line (result: ${segment2})`);

        if (segment1 < 0 || segment2 < 0) {
            console.log("❌ Failed to build complex route");
            return;
        }

        console.log("✅ Complex route with transfer built successfully\n");

        // Generate route description
        // 経路説明を生成
        if (module.routeScript) {
            const complexRouteDescription = module.routeScript();
            console.log(`Complex Route Description: ${complexRouteDescription}`);
        }

        // Calculate fare with transfer
        // 乗り換えありの運賃を計算
        const complexFare = module.calculateFare();
        console.log(`Complex Route Fare: ¥${complexFare}`);

        if (module.getFareString) {
            const complexFareDetails = module.getFareString();
            console.log(`Complex Fare Details: ${complexFareDetails}`);
        }

        console.log();

    } catch (error) {
        console.error("Error in complex route building:", error.message);
    }
}

/**
 * Demonstrates route validation and error handling
 * 経路検証とエラーハンドリングのデモンストレーション
 */
async function demonstrateRouteValidation(module) {
    console.log("=== Route Validation & Error Handling (経路検証・エラーハンドリング) ===");

    console.log("Testing route validation with invalid connections:");
    console.log("無効な接続での経路検証をテスト中:\n");

    try {
        // Test 1: Attempt invalid line-station combination
        // テスト1: 無効な路線-駅の組み合わせを試行
        console.log("Test 1: Invalid line-station combination");
        console.log("テスト1: 無効な路線-駅の組み合わせ");

        const tokyoId = module.getStationId("東京");
        const osakaId = module.getStationId("大阪");
        const yamanoteLineId = module.getLineId("山手線");

        console.log(`  Tokyo ID: ${tokyoId}`);
        console.log(`  Osaka ID: ${osakaId}`);
        console.log(`  Yamanote Line ID: ${yamanoteLineId}`);

        if (tokyoId > 0 && osakaId > 0 && yamanoteLineId > 0) {
            // Start route at Tokyo
            // 東京で経路開始
            const beginResult = module.addRouteBegin
                ? module.addRouteBegin(tokyoId)
                : module.addRoute ? module.addRoute(0, tokyoId) : -1;

            console.log(`  Route begin result: ${beginResult}`);

            // Try to go from Tokyo to Osaka via Yamanote Line (should fail)
            // 山手線で東京から大阪に行こうとする（失敗するはず）
            const invalidResult = module.addRoute(yamanoteLineId, osakaId);
            console.log(`  Invalid route result: ${invalidResult}`);

            if (invalidResult < 0) {
                console.log("  ✅ Correctly rejected invalid route connection");
            } else {
                console.log("  ⚠️ Invalid route was accepted (unexpected)");
            }
        }

        console.log();

        // Test 2: Route building without initialization
        // テスト2: 初期化なしでの経路構築
        console.log("Test 2: Route building without initialization");
        console.log("テスト2: 初期化なしでの経路構築");

        // Try to add route segment without calling addRouteBegin first
        // 最初にaddRouteBeginを呼ばずに経路セグメントを追加しようとする
        const uninitializedResult = module.addRoute(yamanoteLineId, tokyoId);
        console.log(`  Uninitialized route result: ${uninitializedResult}`);

        if (uninitializedResult < 0) {
            console.log("  ✅ Correctly rejected uninitialized route building");
        } else {
            console.log("  ⚠️ Uninitialized route was accepted (unexpected)");
        }

        console.log();

    } catch (error) {
        console.error("Error in route validation:", error.message);
    }
}

/**
 * Demonstrates route comparison and alternatives
 * 経路比較と代替経路のデモンストレーション
 */
async function demonstrateRouteComparison(module) {
    console.log("=== Route Comparison & Alternatives (経路比較・代替経路) ===");

    console.log("Comparing different routes between Tokyo and Yokohama:");
    console.log("東京-横浜間の異なる経路を比較中:\n");

    const routes = [
        {
            name: "Direct Tokaido Line",
            description: "東京 → 横浜 (東海道線直通)",
            segments: [
                { startStation: "東京", line: "東海道線", endStation: "横浜" }
            ]
        },
        {
            name: "Via Shinbashi",
            description: "東京 → 新橋 → 横浜 (東海道線経由)",
            segments: [
                { startStation: "東京", line: "東海道線", endStation: "新橋" },
                { startStation: "新橋", line: "東海道線", endStation: "横浜" }
            ]
        }
    ];

    for (const route of routes) {
        console.log(`=== ${route.name} (${route.description}) ===`);

        try {
            let routeBuildingSuccess = true;
            let totalFare = 0;

            // Build the route step by step
            // ステップ別に経路を構築
            for (let i = 0; i < route.segments.length; i++) {
                const segment = route.segments[i];

                const startStationId = module.getStationId(segment.startStation);
                const endStationId = module.getStationId(segment.endStation);
                const lineId = module.getLineId(segment.line);

                if (startStationId <= 0 || endStationId <= 0 || lineId <= 0) {
                    console.log(`  ❌ Cannot find: ${segment.startStation}(${startStationId}) → ${segment.endStation}(${endStationId}) via ${segment.line}(${lineId})`);
                    routeBuildingSuccess = false;
                    break;
                }

                if (i === 0) {
                    // Initialize route with first station
                    // 最初の駅で経路を初期化
                    const beginResult = module.addRouteBegin
                        ? module.addRouteBegin(startStationId)
                        : module.addRoute ? module.addRoute(0, startStationId) : -1;

                    if (beginResult < 0) {
                        console.log(`  ❌ Failed to start route at ${segment.startStation}`);
                        routeBuildingSuccess = false;
                        break;
                    }
                }

                // Add route segment
                // 経路セグメントを追加
                const segmentResult = module.addRoute(lineId, endStationId);
                if (segmentResult < 0) {
                    console.log(`  ❌ Failed to add segment: ${segment.startStation} → ${segment.endStation} via ${segment.line}`);
                    routeBuildingSuccess = false;
                    break;
                }

                console.log(`  ✅ Added: ${segment.startStation} → ${segment.endStation} via ${segment.line}`);
            }

            if (routeBuildingSuccess) {
                // Calculate fare for this route
                // この経路の運賃を計算
                totalFare = module.calculateFare();
                console.log(`  Total Fare: ¥${totalFare}`);

                // Generate route description
                // 経路説明を生成
                if (module.routeScript) {
                    const routeDesc = module.routeScript();
                    console.log(`  Route: ${routeDesc}`);
                }

                console.log(`  ✅ ${route.name} completed successfully`);
            } else {
                console.log(`  ❌ ${route.name} failed to build`);
            }

        } catch (error) {
            console.error(`  Error building ${route.name}:`, error.message);
        }

        console.log();
    }
}

/**
 * Demonstrates long-distance route building
 * 長距離経路構築のデモンストレーション
 */
async function demonstrateLongDistanceRoute(module) {
    console.log("=== Long Distance Route Building (長距離経路構築) ===");

    console.log("Building long-distance route: Tokyo → Osaka");
    console.log("長距離経路を構築中: 東京 → 大阪\n");

    try {
        const tokyoId = module.getStationId("東京");
        const osakaId = module.getStationId("大阪");
        const tokaidoLineId = module.getLineId("東海道線");

        console.log(`Tokyo Station ID: ${tokyoId}`);
        console.log(`Osaka Station ID: ${osakaId}`);
        console.log(`Tokaido Line ID: ${tokaidoLineId}\n`);

        if (tokyoId <= 0 || osakaId <= 0 || tokaidoLineId <= 0) {
            console.log("❌ Cannot build long-distance route: Required stations/lines not found");
            return;
        }

        // Enable long route calculation if available
        // 利用可能な場合は長距離経路計算を有効化
        if (module.setLongRoute) {
            module.setLongRoute(true);
            console.log("✅ Long route calculation enabled");
        }

        // Build the long-distance route
        // 長距離経路を構築
        const beginResult = module.addRouteBegin
            ? module.addRouteBegin(tokyoId)
            : module.addRoute ? module.addRoute(0, tokyoId) : -1;

        if (beginResult < 0) {
            console.log(`❌ Failed to start long-distance route: ${beginResult}`);
            return;
        }

        const longSegmentResult = module.addRoute(tokaidoLineId, osakaId);

        if (longSegmentResult < 0) {
            console.log(`❌ Failed to add long-distance segment: ${longSegmentResult}`);
            return;
        }

        console.log("✅ Long-distance route built successfully");

        // Calculate long-distance fare
        // 長距離運賃を計算
        const longFare = module.calculateFare();
        console.log(`Long Distance Fare: ¥${longFare}`);

        if (module.getFareString) {
            const longFareDetails = module.getFareString();
            console.log(`Long Distance Fare Details: ${longFareDetails}`);
        }

        if (module.routeScript) {
            const longRouteDesc = module.routeScript();
            console.log(`Long Distance Route: ${longRouteDesc}`);
        }

        console.log();

    } catch (error) {
        console.error("Error in long-distance route building:", error.message);
    }
}

/**
 * Main execution function that runs all route building demonstrations
 * 全ての経路構築デモンストレーションを実行するメイン関数
 */
async function main() {
    console.log("Route Building API Examples");
    console.log("===========================");
    console.log("This example demonstrates comprehensive route construction functionality");
    console.log("using the Farert WebAssembly module.\n");

    console.log("このサンプルはFarert WebAssemblyモジュールを使用した");
    console.log("包括的な経路構築機能をデモンストレーションします。\n");

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

        // Execute all route building demonstrations
        // 全ての経路構築デモンストレーションを実行
        await demonstrateBasicRouteBuilding(module);
        await demonstrateComplexRouteBuilding(module);
        await demonstrateRouteValidation(module);
        await demonstrateRouteComparison(module);
        await demonstrateLongDistanceRoute(module);

        console.log("=== Route Building Examples Complete ===");
        console.log("=== 経路構築サンプル完了 ===");

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
    demonstrateBasicRouteBuilding,
    demonstrateComplexRouteBuilding,
    demonstrateRouteValidation,
    demonstrateRouteComparison,
    demonstrateLongDistanceRoute
};

// Execute if run directly
// 直接実行された場合に実行
if (require.main === module) {
    main().catch(console.error);
}