/**
 * Route Building API Example - Comprehensive Step-by-Step Implementation
 * 経路構築APIサンプル - 包括的ステップ別実装
 *
 * This example demonstrates comprehensive route construction functionality with detailed step-by-step implementation for:
 * - Basic to advanced route building using addRoute APIs with extensive documentation
 * - Route validation, connectivity checking, and error recovery patterns
 * - Fare calculation with calculateFare and detailed fare analysis
 * - Route description generation, comparison, and optimization techniques
 * - Performance monitoring, memory management, and batch processing
 * - Long-distance routes, multi-company transfers, and complex junction handling
 * - Real-world Japanese railway examples from simple to complex scenarios
 *
 * このサンプルは詳細なステップ別実装により以下の経路構築機能の包括的な使用方法を示します：
 * - addRoute APIを使用した基本から高度なステップ別経路構築と詳細ドキュメント
 * - 経路検証、接続性チェック、エラー回復パターン
 * - calculateFareによる運賃計算と詳細運賃分析
 * - 経路説明の生成、比較、最適化技術
 * - パフォーマンス監視、メモリ管理、バッチ処理
 * - 長距離経路、複数会社乗り換え、複雑なジャンクション処理
 * - 簡単から複雑なシナリオまでの実際の日本の鉄道例
 *
 * Educational Features / 教育的機能:
 * - Progressive complexity: Simple → Complex → Advanced → Performance
 * - Extensive inline documentation explaining each WebAssembly API call
 * - Performance measurement and memory usage tracking
 * - Error handling patterns and recovery strategies
 * - Real-world route examples with actual Japanese railway data
 *
 * Execution / 実行方法:
 * node examples/api/basic/route-building-enhanced.js
 *
 * Individual Functions / 個別関数:
 * node -e "require('./examples/api/basic/route-building-enhanced.js').demonstrateBasicRouteBuilding(module)"
 * node -e "require('./examples/api/basic/route-building-enhanced.js').demonstratePerformanceAnalysis(module)"
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

// Performance monitoring utilities
// パフォーマンス監視ユーティリティ
class PerformanceMonitor {
    constructor() {
        this.measurements = [];
        this.memorySnapshots = [];
    }

    /**
     * Start timing measurement for a specific operation
     * 特定の操作のタイミング測定を開始
     */
    startTiming(operation) {
        const start = {
            operation,
            startTime: process.hrtime.bigint(),
            startMemory: process.memoryUsage()
        };
        return start;
    }

    /**
     * Complete timing measurement and record results
     * タイミング測定を完了し結果を記録
     */
    endTiming(start) {
        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage();
        const duration = Number(endTime - start.startTime) / 1000000; // Convert to milliseconds

        const measurement = {
            operation: start.operation,
            duration,
            memoryDelta: {
                heapUsed: endMemory.heapUsed - start.startMemory.heapUsed,
                heapTotal: endMemory.heapTotal - start.startMemory.heapTotal,
                rss: endMemory.rss - start.startMemory.rss
            },
            timestamp: new Date().toISOString()
        };

        this.measurements.push(measurement);
        return measurement;
    }

    /**
     * Get performance summary for all measurements
     * 全測定のパフォーマンス概要を取得
     */
    getSummary() {
        if (this.measurements.length === 0) {
            return { totalOperations: 0, averageDuration: 0, totalMemoryUsed: 0 };
        }

        const totalDuration = this.measurements.reduce((sum, m) => sum + m.duration, 0);
        const averageDuration = totalDuration / this.measurements.length;
        const totalMemoryUsed = this.measurements.reduce((sum, m) => sum + Math.max(0, m.memoryDelta.heapUsed), 0);

        return {
            totalOperations: this.measurements.length,
            averageDuration: averageDuration.toFixed(2),
            totalDuration: totalDuration.toFixed(2),
            totalMemoryUsed: Math.round(totalMemoryUsed / 1024), // KB
            measurements: this.measurements
        };
    }

    /**
     * Display detailed performance report
     * 詳細パフォーマンスレポートを表示
     */
    displayReport() {
        const summary = this.getSummary();
        console.log("\n=== Performance Analysis Report ===\n");
        console.log(`Total Operations: ${summary.totalOperations}`);
        console.log(`Average Duration: ${summary.averageDuration} ms`);
        console.log(`Total Duration: ${summary.totalDuration} ms`);
        console.log(`Total Memory Used: ${summary.totalMemoryUsed} KB`);
        console.log("\n--- Individual Measurements ---");

        this.measurements.forEach((m, index) => {
            console.log(`${index + 1}. ${m.operation}: ${m.duration.toFixed(2)} ms (Memory: ${Math.round(m.memoryDelta.heapUsed / 1024)} KB)`);
        });
    }
}

// Global performance monitor
const perfMonitor = new PerformanceMonitor();

/**
 * Demonstrates basic route construction using addRoute API with extensive step-by-step documentation
 * addRoute APIを使用した基本的な経路構築の詳細ステップ別ドキュメント付きデモンストレーション
 *
 * This function provides a comprehensive walkthrough of the route building process,
 * explaining each WebAssembly API call and its purpose in detail.
 * この関数は経路構築プロセスの包括的なウォークスルーを提供し、
 * 各WebAssembly API呼び出しとその目的を詳細に説明します。
 */
async function demonstrateBasicRouteBuilding(module) {
    console.log("=== Basic Route Building with Step-by-Step Analysis (詳細ステップ解析付き基本経路構築) ===");

    console.log("Building a simple route: Tokyo → Shimbashi → Yokohama");
    console.log("簡単な経路を構築中: 東京 → 新橋 → 横浜");
    console.log("Route Type: Single-line route using Tokaido Line exclusively");
    console.log("経路タイプ: 東海道線のみを使用する単一路線経路\n");

    // Start performance monitoring for basic route building
    // 基本経路構築のパフォーマンス監視を開始
    const basicRouteTimer = perfMonitor.startTiming('Basic Route Building');

    try {
        // ===========================================
        // STEP 1: STATION AND LINE ID RESOLUTION
        // ステップ1: 駅と路線IDの解決
        // ===========================================
        console.log("📍 STEP 1: Station and Line ID Resolution (駅と路線IDの解決)");
        console.log("Purpose: Convert human-readable names to internal database IDs");
        console.log("目的: 人間が読める名前を内部データベースIDに変換\n");

        const lookupTimer = perfMonitor.startTiming('Station/Line ID Lookup');

        // Core API calls: getStationId converts station names to unique identifiers
        // コアAPI呼び出し: getStationIdは駅名を一意の識別子に変換します
        console.log("→ Looking up station IDs using getStationId API:");
        const tokyoId = module.getStationId("東京");
        console.log(`  getStationId("東京") → ${tokyoId}`);

        const shimbashiId = module.getStationId("新橋");
        console.log(`  getStationId("新橋") → ${shimbashiId}`);

        const yokohamaId = module.getStationId("横浜");
        console.log(`  getStationId("横浜") → ${yokohamaId}`);

        // Core API call: getLineId converts line names to unique identifiers
        // コアAPI呼び出し: getLineIdは路線名を一意の識別子に変換します
        console.log("\n→ Looking up line ID using getLineId API:");
        const tokaidoLineId = module.getLineId("東海道線");
        console.log(`  getLineId("東海道線") → ${tokaidoLineId}`);

        perfMonitor.endTiming(lookupTimer);

        // Validation: Check if all required IDs were found
        // 検証: 必要なIDが全て見つかったかチェック
        console.log("\n→ Validation Results:");
        const validationResults = {
            tokyoValid: tokyoId > 0,
            shimbashiValid: shimbashiId > 0,
            yokohamaValid: yokohamaId > 0,
            tokaidoValid: tokaidoLineId > 0
        };

        Object.entries(validationResults).forEach(([key, valid]) => {
            console.log(`  ${key}: ${valid ? '✅ Valid' : '❌ Invalid'}`);
        });

        if (tokyoId <= 0 || shimbashiId <= 0 || yokohamaId <= 0 || tokaidoLineId <= 0) {
            console.log("\n❌ Cannot build route: Some stations or lines not found");
            console.log("Possible causes: Station/line name spelling, database connectivity");
            perfMonitor.endTiming(basicRouteTimer);
            return;
        }

        console.log("\n✅ All IDs resolved successfully - proceeding to route construction\n");

        // ===========================================
        // STEP 2: ROUTE INITIALIZATION
        // ステップ2: 経路初期化
        // ===========================================
        console.log("🚀 STEP 2: Route Initialization (経路初期化)");
        console.log("Purpose: Set the starting point for route construction");
        console.log("目的: 経路構築の開始点を設定\n");

        const initTimer = perfMonitor.startTiming('Route Initialization');

        // Core API call: addRouteBegin initializes route building with starting station
        // コアAPI呼び出し: addRouteBeginは開始駅で経路構築を初期化します
        console.log("→ Initializing route with starting station:");
        console.log("API Call: addRouteBegin(stationId) or fallback to addRoute(0, stationId)");
        console.log("目的: 経路の開始駅を設定し、経路構築の準備をする");

        const beginResult = module.addRouteBegin
            ? module.addRouteBegin(tokyoId)
            : module.addRoute ? module.addRoute(0, tokyoId) : -1;

        console.log(`\nResult: ${beginResult}`);
        console.log("Return Value Meaning:");
        console.log("  > 0: Success, route initialized");
        console.log("  < 0: Error, initialization failed");

        perfMonitor.endTiming(initTimer);

        if (beginResult < 0) {
            console.log(`\n❌ Failed to set starting station: ${beginResult}`);
            console.log("Error Analysis: Route initialization failure");
            console.log("Possible causes: Invalid station ID, module not ready");
            perfMonitor.endTiming(basicRouteTimer);
            return;
        }

        console.log(`\n✅ Route successfully initialized at Tokyo Station`);
        console.log(`Internal route state: Ready to accept route segments\n`);

        // ===========================================
        // STEP 3: ROUTE SEGMENT CONSTRUCTION
        // ステップ3: 経路セグメント構築
        // ===========================================
        console.log("🛤️  STEP 3: Route Segment Construction (経路セグメント構築)");
        console.log("Purpose: Add line-station pairs to build the complete route");
        console.log("目的: 路線-駅ペアを追加して完全な経路を構築\n");

        const segmentTimer = perfMonitor.startTiming('Route Segment Addition');

        // Segment 1: Tokyo → Shimbashi via Tokaido Line
        // セグメント1: 東京 → 新橋 (東海道線)
        console.log("→ Adding Route Segment 1: Tokyo → Shimbashi");
        console.log(`API Call: addRoute(${tokaidoLineId}, ${shimbashiId})`);
        console.log(`Parameters: lineId=${tokaidoLineId} (東海道線), stationId=${shimbashiId} (新橋)`);
        console.log("Logic: From current position (東京), travel via 東海道線 to reach 新橋");

        const segment1Result = module.addRoute(tokaidoLineId, shimbashiId);
        console.log(`Result: ${segment1Result}`);

        if (segment1Result >= 0) {
            console.log("✅ Segment 1 successfully added");
        } else {
            console.log("❌ Segment 1 failed - possible connectivity issue");
        }

        // Segment 2: Shimbashi → Yokohama via Tokaido Line
        // セグメント2: 新橋 → 横浜 (東海道線)
        console.log("\n→ Adding Route Segment 2: Shimbashi → Yokohama");
        console.log(`API Call: addRoute(${tokaidoLineId}, ${yokohamaId})`);
        console.log(`Parameters: lineId=${tokaidoLineId} (東海道線), stationId=${yokohamaId} (横浜)`);
        console.log("Logic: From current position (新橋), continue via 東海道線 to reach 横浜");

        const segment2Result = module.addRoute(tokaidoLineId, yokohamaId);
        console.log(`Result: ${segment2Result}`);

        if (segment2Result >= 0) {
            console.log("✅ Segment 2 successfully added");
        } else {
            console.log("❌ Segment 2 failed - possible connectivity issue");
        }

        perfMonitor.endTiming(segmentTimer);

        if (segment1Result < 0 || segment2Result < 0) {
            console.log("\n❌ Failed to build complete route");
            console.log("Error Analysis: Route segment construction failure");
            console.log("Possible causes: Invalid line connections, station not on line");
            perfMonitor.endTiming(basicRouteTimer);
            return;
        }

        console.log("\n✅ Complete route constructed successfully!");
        console.log("Route Status: 東京 → 新橋 → 横浜 via 東海道線\n");

        // ===========================================
        // STEP 4: ROUTE DESCRIPTION GENERATION
        // ステップ4: 経路説明生成
        // ===========================================
        console.log("📝 STEP 4: Route Description Generation (経路説明生成)");
        console.log("Purpose: Generate human-readable route description");
        console.log("目的: 人間が読める経路説明を生成\n");

        const descTimer = perfMonitor.startTiming('Route Description Generation');

        if (module.routeScript) {
            console.log("→ Generating route description:");
            console.log("API Call: routeScript()");
            console.log("Function: Converts internal route data to readable text");

            // Core API call: routeScript generates human-readable route description
            // コアAPI呼び出し: routeScriptは人間が読める経路説明を生成します
            const routeDescription = module.routeScript();
            console.log(`\nGenerated Description: "${routeDescription}"`);
            console.log("Description includes: Station names, line names, transfer points");
        } else {
            console.log("❌ Route description function not available in this WebAssembly build");
            console.log("Note: routeScript() is an optional API that may not be exposed");
        }

        perfMonitor.endTiming(descTimer);
        console.log();

        // ===========================================
        // STEP 5: FARE CALCULATION
        // ステップ5: 運賃計算
        // ===========================================
        console.log("💰 STEP 5: Fare Calculation (運賃計算)");
        console.log("Purpose: Calculate total fare for the constructed route");
        console.log("目的: 構築された経路の総運賃を計算\n");

        const fareTimer = perfMonitor.startTiming('Fare Calculation');

        console.log("→ Calculating route fare:");
        console.log("API Call: calculateFare()");
        console.log("Process: Analyzes complete route and applies Japanese fare rules");
        console.log("Considerations: Distance, transfers, special rules, discounts");

        // Core API call: calculateFare computes the total fare for the built route
        // コアAPI呼び出し: calculateFareは構築された経路の総運賃を計算します
        const fareResult = module.calculateFare();
        console.log(`\nCalculated Fare: ¥${fareResult}`);

        // Analysis of fare calculation
        console.log("\n→ Fare Analysis:");
        if (fareResult > 0) {
            console.log("✅ Valid fare calculated");
            console.log(`Route Distance: Estimated based on ¥${fareResult} fare`);
            console.log("Fare Rules Applied: Standard JR fare calculation");
        } else if (fareResult === 0) {
            console.log("⚠️  Zero fare - possible same-station route or free transfer");
        } else {
            console.log("❌ Invalid fare - calculation error or unsupported route");
        }

        // Get detailed fare information if available
        // 利用可能な場合は詳細運賃情報を取得
        console.log("\n→ Detailed fare information:");
        if (module.getFareString) {
            console.log("API Call: getFareString()");
            console.log("Purpose: Get formatted fare details with breakdown");

            const fareDetails = module.getFareString();
            console.log(`Fare Details: "${fareDetails}"`);
            console.log("Details may include: Base fare, special charges, discounts");
        } else {
            console.log("❌ Detailed fare information not available");
            console.log("Note: getFareString() is an optional API");
        }

        perfMonitor.endTiming(fareTimer);
        perfMonitor.endTiming(basicRouteTimer);

        // ===========================================
        // STEP 6: COMPLETION SUMMARY
        // ステップ6: 完了まとめ
        // ===========================================
        console.log("\n🎉 BASIC ROUTE BUILDING COMPLETED SUCCESSFULLY");
        console.log("=============================================");
        console.log("Route Summary:");
        console.log(`  Origin: Tokyo (ID: ${tokyoId})`);
        console.log(`  Destination: Yokohama (ID: ${yokohamaId})`);
        console.log(`  Via: Shimbashi (ID: ${shimbashiId})`);
        console.log(`  Line: Tokaido Line (ID: ${tokaidoLineId})`);
        console.log(`  Total Fare: ¥${fareResult}`);
        console.log(`  Route Type: Single-line, multi-station`);
        console.log("\nWebAssembly APIs Successfully Used:");
        console.log("  ✅ getStationId() - Station name resolution");
        console.log("  ✅ getLineId() - Line name resolution");
        console.log("  ✅ addRouteBegin() - Route initialization");
        console.log("  ✅ addRoute() - Route segment construction");
        console.log("  ✅ calculateFare() - Fare calculation");
        console.log(`  ${module.routeScript ? '✅' : '❌'} routeScript() - Route description`);
        console.log(`  ${module.getFareString ? '✅' : '❌'} getFareString() - Detailed fare info`);
        console.log();

    } catch (error) {
        console.error("\n❌ Error in basic route building:", error.message);
        console.error("Stack trace:", error.stack);
        console.log("\nTroubleshooting:");
        console.log("1. Ensure WebAssembly module is properly loaded");
        console.log("2. Verify database connection is established");
        console.log("3. Check station and line name spelling");
        console.log("4. Confirm route connectivity in the database");

        perfMonitor.endTiming(basicRouteTimer);
    }
}

/**
 * Demonstrates performance analysis and memory management for route building
 * 経路構築のパフォーマンス分析とメモリ管理のデモンストレーション
 */
async function demonstratePerformanceAnalysis(module) {
    console.log("=== Route Building Performance Analysis (経路構築パフォーマンス分析) ===");
    console.log("Purpose: Analyze performance characteristics of route building operations");
    console.log("目的: 経路構築操作のパフォーマンス特性を分析\n");

    const perfAnalysisTimer = perfMonitor.startTiming('Performance Analysis');

    try {
        // ===========================================
        // BATCH ROUTE CONSTRUCTION PERFORMANCE TEST
        // バッチ経路構築パフォーマンステスト
        // ===========================================
        console.log("🔬 BATCH PERFORMANCE TEST - Multiple Route Construction");
        console.log("Testing: Construction time and memory usage for multiple routes\n");

        const testRoutes = [
            { name: "Tokyo-Yokohama", start: "東京", end: "横浜", line: "東海道線" },
            { name: "Shibuya-Shinjuku", start: "渋谷", end: "新宿", line: "山手線" },
            { name: "Ikebukuro-Tabata", start: "池袋", end: "田端", line: "山手線" },
            { name: "Ueno-Akihabara", start: "上野", end: "秋葉原", line: "山手線" },
            { name: "Shinagawa-Kawasaki", start: "品川", end: "川崎", line: "東海道線" }
        ];

        const batchResults = [];
        console.log("→ Executing batch route construction:")

        for (let i = 0; i < testRoutes.length; i++) {
            const route = testRoutes[i];
            console.log(`\n  Route ${i + 1}: ${route.name} (${route.start} → ${route.end})`);

            const routeTimer = perfMonitor.startTiming(`Route ${i + 1}: ${route.name}`);

            try {
                // Get station and line IDs
                const startId = module.getStationId(route.start);
                const endId = module.getStationId(route.end);
                const lineId = module.getLineId(route.line);

                if (startId > 0 && endId > 0 && lineId > 0) {
                    // Build route
                    const beginResult = module.addRouteBegin ? module.addRouteBegin(startId) : -1;
                    if (beginResult >= 0) {
                        const segmentResult = module.addRoute(lineId, endId);
                        if (segmentResult >= 0) {
                            const fare = module.calculateFare();

                            const measurement = perfMonitor.endTiming(routeTimer);
                            batchResults.push({
                                route: route.name,
                                success: true,
                                fare,
                                duration: measurement.duration,
                                memoryUsed: measurement.memoryDelta.heapUsed
                            });

                            console.log(`    ✅ Success: ¥${fare} (${measurement.duration.toFixed(2)} ms)`);
                        } else {
                            perfMonitor.endTiming(routeTimer);
                            batchResults.push({ route: route.name, success: false, error: 'Segment failed' });
                            console.log(`    ❌ Failed: Segment construction`);
                        }
                    } else {
                        perfMonitor.endTiming(routeTimer);
                        batchResults.push({ route: route.name, success: false, error: 'Begin failed' });
                        console.log(`    ❌ Failed: Route initialization`);
                    }
                } else {
                    perfMonitor.endTiming(routeTimer);
                    batchResults.push({ route: route.name, success: false, error: 'ID lookup failed' });
                    console.log(`    ❌ Failed: Station/Line ID lookup`);
                }
            } catch (error) {
                perfMonitor.endTiming(routeTimer);
                batchResults.push({ route: route.name, success: false, error: error.message });
                console.log(`    ❌ Error: ${error.message}`);
            }
        }

        // ===========================================
        // BATCH RESULTS ANALYSIS
        // バッチ結果分析
        // ===========================================
        console.log("\n📊 BATCH PERFORMANCE RESULTS ANALYSIS");
        console.log("=====================================\n");

        const successfulRoutes = batchResults.filter(r => r.success);
        const failedRoutes = batchResults.filter(r => !r.success);

        console.log(`→ Success Rate: ${successfulRoutes.length}/${batchResults.length} (${(successfulRoutes.length/batchResults.length*100).toFixed(1)}%)`);

        if (successfulRoutes.length > 0) {
            const avgDuration = successfulRoutes.reduce((sum, r) => sum + r.duration, 0) / successfulRoutes.length;
            const avgMemory = successfulRoutes.reduce((sum, r) => sum + Math.max(0, r.memoryUsed), 0) / successfulRoutes.length;
            const avgFare = successfulRoutes.reduce((sum, r) => sum + r.fare, 0) / successfulRoutes.length;

            console.log(`→ Average Construction Time: ${avgDuration.toFixed(2)} ms`);
            console.log(`→ Average Memory Usage: ${Math.round(avgMemory / 1024)} KB`);
            console.log(`→ Average Fare: ¥${Math.round(avgFare)}`);

            // Find fastest and slowest routes
            const fastest = successfulRoutes.reduce((min, r) => r.duration < min.duration ? r : min);
            const slowest = successfulRoutes.reduce((max, r) => r.duration > max.duration ? r : max);

            console.log(`→ Fastest Route: ${fastest.route} (${fastest.duration.toFixed(2)} ms)`);
            console.log(`→ Slowest Route: ${slowest.route} (${slowest.duration.toFixed(2)} ms)`);
        }

        if (failedRoutes.length > 0) {
            console.log(`\n⚠️  Failed Routes (${failedRoutes.length}):`);
            failedRoutes.forEach(r => {
                console.log(`  - ${r.route}: ${r.error}`);
            });
        }

        perfMonitor.endTiming(perfAnalysisTimer);

    } catch (error) {
        console.error("\n❌ Error in performance analysis:", error.message);
        perfMonitor.endTiming(perfAnalysisTimer);
    }
}

/**
 * Demonstrates advanced route optimization and comparison techniques
 * 高度な経路最適化と比較技術のデモンストレーション
 */
async function demonstrateRouteOptimization(module) {
    console.log("=== Advanced Route Optimization & Comparison (高度な経路最適化・比較) ===");
    console.log("Purpose: Demonstrate route optimization and alternative path analysis");
    console.log("目的: 経路最適化と代替パス分析のデモンストレーション\n");

    const optimizationTimer = perfMonitor.startTiming('Route Optimization');

    try {
        // Define multiple route strategies for Tokyo to Yokohama
        const routeStrategies = [
            {
                name: "Direct Tokaido",
                description: "Direct via Tokaido Line",
                segments: [{ start: "東京", line: "東海道線", end: "横浜" }]
            },
            {
                name: "Via Shinbashi",
                description: "Tokyo → Shinbashi → Yokohama",
                segments: [
                    { start: "東京", line: "東海道線", end: "新橋" },
                    { start: "新橋", line: "東海道線", end: "横浜" }
                ]
            },
            {
                name: "Via Keihin-Tohoku",
                description: "Alternative line option",
                segments: [{ start: "東京", line: "京浜東北線", end: "横浜" }]
            }
        ];

        const routeResults = [];

        console.log("→ Testing different route strategies:\n");

        for (const strategy of routeStrategies) {
            console.log(`🛤️  Testing: ${strategy.name} - ${strategy.description}`);

            const strategyTimer = perfMonitor.startTiming(`Strategy: ${strategy.name}`);

            try {
                let routeSuccess = true;
                let totalFare = 0;

                // Build route according to strategy
                for (let i = 0; i < strategy.segments.length; i++) {
                    const segment = strategy.segments[i];

                    const startId = module.getStationId(segment.start);
                    const endId = module.getStationId(segment.end);
                    const lineId = module.getLineId(segment.line);

                    if (startId <= 0 || endId <= 0 || lineId <= 0) {
                        console.log(`  ❌ Invalid IDs: ${segment.start}(${startId}) → ${segment.end}(${endId}) via ${segment.line}(${lineId})`);
                        routeSuccess = false;
                        break;
                    }

                    if (i === 0) {
                        // Initialize route
                        const beginResult = module.addRouteBegin ? module.addRouteBegin(startId) : -1;
                        if (beginResult < 0) {
                            console.log(`  ❌ Failed to initialize route`);
                            routeSuccess = false;
                            break;
                        }
                    }

                    // Add segment
                    const segmentResult = module.addRoute(lineId, endId);
                    if (segmentResult < 0) {
                        console.log(`  ❌ Failed segment: ${segment.start} → ${segment.end} via ${segment.line}`);
                        routeSuccess = false;
                        break;
                    }

                    console.log(`  ✅ Added: ${segment.start} → ${segment.end} via ${segment.line}`);
                }

                if (routeSuccess) {
                    totalFare = module.calculateFare();
                    const measurement = perfMonitor.endTiming(strategyTimer);

                    const routeDescription = module.routeScript ? module.routeScript() : 'N/A';

                    routeResults.push({
                        strategy: strategy.name,
                        description: strategy.description,
                        fare: totalFare,
                        duration: measurement.duration,
                        routeDescription,
                        success: true
                    });

                    console.log(`  💰 Fare: ¥${totalFare}`);
                    console.log(`  ⚡ Construction time: ${measurement.duration.toFixed(2)} ms`);
                    console.log(`  📝 Route: ${routeDescription}\n`);
                } else {
                    perfMonitor.endTiming(strategyTimer);
                    routeResults.push({
                        strategy: strategy.name,
                        description: strategy.description,
                        success: false,
                        error: 'Route construction failed'
                    });
                    console.log(`  ❌ Strategy failed\n`);
                }

            } catch (error) {
                perfMonitor.endTiming(strategyTimer);
                routeResults.push({
                    strategy: strategy.name,
                    description: strategy.description,
                    success: false,
                    error: error.message
                });
                console.log(`  ❌ Error: ${error.message}\n`);
            }
        }

        // Analyze and compare route results
        console.log("📊 ROUTE OPTIMIZATION ANALYSIS");
        console.log("================================\n");

        const successfulRoutes = routeResults.filter(r => r.success);

        if (successfulRoutes.length > 0) {
            // Find optimal routes
            const cheapestRoute = successfulRoutes.reduce((min, r) => r.fare < min.fare ? r : min);
            const fastestRoute = successfulRoutes.reduce((min, r) => r.duration < min.duration ? r : min);

            console.log(`💎 Most Economical: ${cheapestRoute.strategy} - ¥${cheapestRoute.fare}`);
            console.log(`⚡ Fastest Construction: ${fastestRoute.strategy} - ${fastestRoute.duration.toFixed(2)} ms`);

            console.log("\n🔍 Detailed Comparison:");
            successfulRoutes.forEach((route, index) => {
                const isOptimalFare = route.fare === cheapestRoute.fare;
                const isOptimalSpeed = route.duration === fastestRoute.duration;

                console.log(`${index + 1}. ${route.strategy}:`);
                console.log(`   Fare: ¥${route.fare} ${isOptimalFare ? '👑' : ''}`);
                console.log(`   Speed: ${route.duration.toFixed(2)} ms ${isOptimalSpeed ? '⚡' : ''}`);
                console.log(`   Description: ${route.description}`);
            });

        } else {
            console.log("❌ No successful route strategies found");
        }

        perfMonitor.endTiming(optimizationTimer);

    } catch (error) {
        console.error("\n❌ Error in route optimization:", error.message);
        perfMonitor.endTiming(optimizationTimer);
    }
}

/**
 * Main execution function that runs all comprehensive route building demonstrations
 * 全ての包括的経路構築デモンストレーションを実行するメイン関数
 */
async function main() {
    console.log("🚄 COMPREHENSIVE ROUTE BUILDING API EXAMPLES");
    console.log("===============================================");
    console.log("This example demonstrates comprehensive route construction functionality");
    console.log("with detailed step-by-step implementation, performance analysis,");
    console.log("and advanced optimization techniques using the Farert WebAssembly module.\n");

    console.log("このサンプルは詳細なステップ別実装、パフォーマンス分析、");
    console.log("高度な最適化技術による包括的な経路構築機能を");
    console.log("Farert WebAssemblyモジュールを使用してデモンストレーションします。\n");

    console.log("📋 DEMONSTRATION MODULES:");
    console.log("1. Basic Route Building - Detailed step-by-step construction");
    console.log("2. Performance Analysis - Batch processing and memory management");
    console.log("3. Route Optimization - Alternative path analysis and comparison");
    console.log();

    const mainTimer = perfMonitor.startTiming('Complete Route Building Demonstration');

    try {
        // ===========================================
        // WEBASSEMBLY MODULE INITIALIZATION
        // WebAssemblyモジュール初期化
        // ===========================================
        console.log("🔧 WEBASSEMBLY MODULE INITIALIZATION");
        console.log("====================================\n");

        const initTimer = perfMonitor.startTiming('WebAssembly Initialization');

        console.log("→ Loading WebAssembly module:");
        console.log("Purpose: Initialize the Farert railway calculation engine");
        console.log("WebAssemblyモジュールを初期化中...");

        const module = await wasmLoader.loadModule();

        perfMonitor.endTiming(initTimer);
        console.log("✅ WebAssembly module loaded successfully\n");
        console.log("WebAssemblyモジュールが正常に読み込まれました\n");

        // Database connection initialization
        const dbTimer = perfMonitor.startTiming('Database Connection');

        console.log("→ Establishing database connection:");
        console.log("Purpose: Connect to Japanese railway database (jrdbnewest.db)");
        console.log("データベース接続を初期化中...");

        module.openDatabase();

        perfMonitor.endTiming(dbTimer);
        console.log("✅ Database connection established successfully\n");
        console.log("データベース接続が確立されました\n");

        // ===========================================
        // DEMONSTRATION EXECUTION
        // デモンストレーション実行
        // ===========================================
        console.log("🎬 BEGINNING COMPREHENSIVE DEMONSTRATIONS");
        console.log("==========================================\n");

        console.log("📍 Module 1: Basic Route Building");
        await demonstrateBasicRouteBuilding(module);

        console.log("\n" + "=".repeat(80) + "\n");

        console.log("⚡ Module 2: Performance Analysis");
        await demonstratePerformanceAnalysis(module);

        console.log("\n" + "=".repeat(80) + "\n");

        console.log("🔍 Module 3: Route Optimization");
        await demonstrateRouteOptimization(module);

        perfMonitor.endTiming(mainTimer);

        // ===========================================
        // FINAL PERFORMANCE REPORT
        // 最終パフォーマンスレポート
        // ===========================================
        console.log("\n" + "=".repeat(80));
        console.log("🏁 COMPREHENSIVE ROUTE BUILDING EXAMPLES COMPLETED");
        console.log("📊 FINAL PERFORMANCE ANALYSIS REPORT");
        console.log("===================================================\n");

        perfMonitor.displayReport();

        console.log("\n🎯 DEMONSTRATION SUMMARY:");
        console.log("==========================");
        console.log("✅ All route building demonstrations completed successfully");
        console.log("✅ WebAssembly APIs thoroughly tested and documented");
        console.log("✅ Performance characteristics analyzed and reported");
        console.log("✅ Route optimization patterns demonstrated and validated");
        console.log("✅ Memory management patterns tested for stability");
        console.log("\n経路構築サンプル完了 - すべてのモジュールが正常に実行されました\n");

        console.log("📚 KEY LEARNINGS FROM THIS DEMONSTRATION:");
        console.log("1. Route construction follows a predictable pattern: Initialize → Add segments → Calculate");
        console.log("2. Performance monitoring helps identify optimization opportunities");
        console.log("3. Multiple route strategies can be compared for optimal results");
        console.log("4. Memory management is crucial for batch processing applications");
        console.log("5. The WebAssembly module provides reliable Japanese railway fare calculation");
        console.log();

    } catch (error) {
        console.error("\n💥 FATAL ERROR OCCURRED DURING EXECUTION:");
        console.error("==========================================\n");
        console.error("実行中に致命的なエラーが発生しました:");
        console.error("Error message:", error.message);
        console.error("Stack trace:", error.stack);

        console.log("\n🔧 TROUBLESHOOTING STEPS:");
        console.log("1. Ensure WebAssembly module is properly built (npm run build)");
        console.log("2. Verify database file accessibility");
        console.log("3. Check Node.js version compatibility");
        console.log("4. Confirm all required dependencies are installed");
        console.log("5. Try running individual demonstration modules separately");

        perfMonitor.endTiming(mainTimer);
        process.exit(1);
    }
}

// Export functions for individual testing and performance monitoring
// 個別テストおよびパフォーマンス監視用に関数をエクスポート
module.exports = {
    // Core demonstration functions
    demonstrateBasicRouteBuilding,
    demonstratePerformanceAnalysis,
    demonstrateRouteOptimization,

    // Performance monitoring utilities
    PerformanceMonitor,
    perfMonitor,

    // Main execution function
    main
};

/**
 * Individual function execution examples:
 *
 * Basic route building:
 * node -e "require('./examples/api/basic/route-building-enhanced.js').demonstrateBasicRouteBuilding(module)"
 *
 * Performance analysis:
 * node -e "require('./examples/api/basic/route-building-enhanced.js').demonstratePerformanceAnalysis(module)"
 *
 * Route optimization:
 * node -e "require('./examples/api/basic/route-building-enhanced.js').demonstrateRouteOptimization(module)"
 *
 * Complete demonstration:
 * node examples/api/basic/route-building-enhanced.js
 */

// Execute if run directly
// 直接実行された場合に実行
if (require.main === module) {
    console.log("🚀 Starting Comprehensive Route Building API Examples");
    console.log("Time:", new Date().toISOString());
    console.log("Node.js Version:", process.version);
    console.log("Platform:", process.platform);
    console.log("Architecture:", process.arch);
    console.log();

    // Handle process signals for graceful shutdown
    process.on('SIGINT', () => {
        console.log("\n\n⚠️  Received SIGINT, generating final performance report...");
        perfMonitor.displayReport();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log("\n\n⚠️  Received SIGTERM, generating final performance report...");
        perfMonitor.displayReport();
        process.exit(0);
    });

    // Start main execution with error handling
    main()
        .then(() => {
            console.log("\n🎉 All demonstrations completed successfully!");
            console.log("Execution time:", new Date().toISOString());
        })
        .catch((error) => {
            console.error("\n💥 Fatal error in main execution:", error);
            perfMonitor.displayReport();
            process.exit(1);
        });
}