/**
 * Farert WebAssembly Unit Tests
 * 全ての関数の詳細なユニットテストスイート
 */

class FarertTestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };
        this.module = null;
        this.isReady = false;
    }

    /**
     * WebAssemblyモジュールを初期化
     */
    async initialize() {
        try {
            const moduleFactory = await import('../dist/farert.js');
            this.module = await moduleFactory.default();
            this.isReady = true;
            console.log('✅ Farert WebAssembly module loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load WebAssembly module:', error);
            return false;
        }
    }

    /**
     * テストケースを追加
     */
    addTest(name, testFunc, category = 'general') {
        this.tests.push({
            name,
            testFunc,
            category,
            status: 'pending'
        });
    }

    /**
     * アサーション関数
     */
    assert = {
        equals: (actual, expected, message = '') => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
            }
        },
        
        notEquals: (actual, expected, message = '') => {
            if (actual === expected) {
                throw new Error(`Expected not ${expected}, got ${actual}. ${message}`);
            }
        },
        
        isTrue: (value, message = '') => {
            if (value !== true) {
                throw new Error(`Expected true, got ${value}. ${message}`);
            }
        },
        
        isFalse: (value, message = '') => {
            if (value !== false) {
                throw new Error(`Expected false, got ${value}. ${message}`);
            }
        },
        
        isNumber: (value, message = '') => {
            if (typeof value !== 'number') {
                throw new Error(`Expected number, got ${typeof value}. ${message}`);
            }
        },
        
        isString: (value, message = '') => {
            if (typeof value !== 'string') {
                throw new Error(`Expected string, got ${typeof value}. ${message}`);
            }
        },
        
        isGreaterThan: (actual, expected, message = '') => {
            if (actual <= expected) {
                throw new Error(`Expected ${actual} > ${expected}. ${message}`);
            }
        },
        
        isGreaterThanOrEqual: (actual, expected, message = '') => {
            if (actual < expected) {
                throw new Error(`Expected ${actual} >= ${expected}. ${message}`);
            }
        },
        
        throws: (testFunc, message = '') => {
            try {
                testFunc();
                throw new Error(`Expected function to throw. ${message}`);
            } catch (error) {
                // 期待される動作
            }
        }
    };

    /**
     * 単一テストを実行
     */
    async runTest(test) {
        if (!this.isReady) {
            test.status = 'skipped';
            test.error = 'WebAssembly module not ready';
            return false;
        }

        try {
            await test.testFunc(this.module, this.assert);
            test.status = 'passed';
            this.results.passed++;
            console.log(`✅ ${test.name}`);
            return true;
        } catch (error) {
            test.status = 'failed';
            test.error = error.message;
            this.results.failed++;
            this.results.errors.push({ test: test.name, error: error.message });
            console.error(`❌ ${test.name}: ${error.message}`);
            return false;
        }
    }

    /**
     * 全テストを実行
     */
    async runAllTests() {
        console.log('🚀 Starting Farert WebAssembly Unit Tests...');
        
        this.results = {
            total: this.tests.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: []
        };

        for (const test of this.tests) {
            await this.runTest(test);
        }

        // 結果サマリー
        const passRate = this.results.total > 0 ? 
            (this.results.passed / this.results.total * 100).toFixed(1) : 0;
        
        console.log('\n📊 Test Results Summary:');
        console.log(`Total: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Skipped: ${this.results.skipped}`);
        console.log(`Pass Rate: ${passRate}%`);

        if (this.results.errors.length > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.errors.forEach(error => {
                console.log(`  - ${error.test}: ${error.error}`);
            });
        }

        return this.results;
    }

    /**
     * カテゴリ別テスト実行
     */
    async runTestsByCategory(category) {
        const categoryTests = this.tests.filter(test => test.category === category);
        console.log(`🔍 Running ${categoryTests.length} tests in category: ${category}`);
        
        for (const test of categoryTests) {
            await this.runTest(test);
        }
    }

    /**
     * テスト結果をHTMLで取得
     */
    getHtmlResults() {
        const categorizedTests = {};
        this.tests.forEach(test => {
            if (!categorizedTests[test.category]) {
                categorizedTests[test.category] = [];
            }
            categorizedTests[test.category].push(test);
        });

        let html = '<div class="test-results">';
        
        for (const [category, tests] of Object.entries(categorizedTests)) {
            html += `<div class="test-category">`;
            html += `<h3>${category}</h3>`;
            
            tests.forEach(test => {
                const statusClass = test.status === 'passed' ? 'pass' : 
                                  test.status === 'failed' ? 'fail' : 'skip';
                html += `<div class="test-result ${statusClass}">`;
                html += `<span class="test-name">${test.name}</span>`;
                html += `<span class="test-status">${test.status}</span>`;
                if (test.error) {
                    html += `<div class="test-error">${test.error}</div>`;
                }
                html += `</div>`;
            });
            
            html += `</div>`;
        }
        
        html += '</div>';
        return html;
    }
}

// テストケースの定義
function defineTests(testRunner) {
    // データベース管理テスト
    testRunner.addTest('DatabaseManager.openDatabase', (module, assert) => {
        const result = module.openDatabase();
        assert.equals(result, 1, 'openDatabase should return 1 on success');
    }, 'database');

    testRunner.addTest('DatabaseManager.closeDatabase', (module, assert) => {
        module.closeDatabase();
        // closeDatabase has no return value, so we just check it doesn't throw
    }, 'database');

    testRunner.addTest('Basic test function', (module, assert) => {
        const result = module.test();
        assert.equals(result, 42, 'test() should return 42');
    }, 'basic');

    // 駅・路線検索テスト
    testRunner.addTest('RouteUtility.getStationId - valid station', (module, assert) => {
        const stationId = module.getStationId('東京');
        assert.isNumber(stationId, 'getStationId should return a number');
        // Note: We can't assert specific ID without knowing the database
    }, 'search');

    testRunner.addTest('RouteUtility.getStationId - invalid station', (module, assert) => {
        const stationId = module.getStationId('存在しない駅名123');
        assert.isNumber(stationId, 'getStationId should return a number even for invalid stations');
    }, 'search');

    testRunner.addTest('RouteUtility.getStationName', (module, assert) => {
        const stationName = module.getStationName(1);
        assert.isString(stationName, 'getStationName should return a string');
    }, 'search');

    testRunner.addTest('RouteUtility.getLineName', (module, assert) => {
        const lineName = module.getLineName(1);
        assert.isString(lineName, 'getLineName should return a string');
    }, 'search');

    // 経路管理テスト
    testRunner.addTest('Route.createRoute', (module, assert) => {
        const result = module.createRoute();
        assert.equals(result, 1, 'createRoute should return 1 on success');
    }, 'route');

    testRunner.addTest('Route.destroyRoute', (module, assert) => {
        module.createRoute();
        module.destroyRoute();
        // destroyRoute has no return value, so we just check it doesn't throw
    }, 'route');

    testRunner.addTest('Route.addStation', (module, assert) => {
        module.createRoute();
        const result = module.addStation(1);
        assert.isNumber(result, 'addStation should return a number');
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.addRoute', (module, assert) => {
        module.createRoute();
        const result = module.addRoute(1, 2);
        assert.isNumber(result, 'addRoute should return a number');
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.getRouteCount', (module, assert) => {
        module.createRoute();
        const count = module.getRouteCount();
        assert.isNumber(count, 'getRouteCount should return a number');
        assert.isGreaterThanOrEqual(count, 0, 'Route count should be non-negative');
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.startStationId', (module, assert) => {
        module.createRoute();
        const stationId = module.startStationId();
        assert.isNumber(stationId, 'startStationId should return a number');
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.lastStationId', (module, assert) => {
        module.createRoute();
        const stationId = module.lastStationId();
        assert.isNumber(stationId, 'lastStationId should return a number');
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.isEnd', (module, assert) => {
        module.createRoute();
        const result = module.isEnd();
        assert.isNumber(result, 'isEnd should return a number (0 or 1)');
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.reverseRoute', (module, assert) => {
        module.createRoute();
        const result = module.reverseRoute();
        assert.isNumber(result, 'reverseRoute should return a number');
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.removeTail', (module, assert) => {
        module.createRoute();
        module.addStation(1);
        module.removeTail();
        // removeTail has no return value, so we just check it doesn't throw
        module.destroyRoute();
    }, 'route');

    testRunner.addTest('Route.removeAll', (module, assert) => {
        module.createRoute();
        module.addStation(1);
        module.removeAll();
        const count = module.getRouteCount();
        assert.equals(count, 0, 'Route count should be 0 after removeAll');
        module.destroyRoute();
    }, 'route');

    // 運賃計算テスト
    testRunner.addTest('CalcRoute.calculateFare', (module, assert) => {
        module.createRoute();
        module.addStation(1);
        module.addStation(2);
        const result = module.calculateFare();
        assert.isNumber(result, 'calculateFare should return a number');
        module.destroyRoute();
    }, 'fare');

    testRunner.addTest('CalcRoute.getFareString', (module, assert) => {
        module.createRoute();
        module.addStation(1);
        module.addStation(2);
        module.calculateFare();
        const fareString = module.getFareString();
        assert.isString(fareString, 'getFareString should return a string');
        module.destroyRoute();
    }, 'fare');

    testRunner.addTest('CalcRoute.setLongRoute', (module, assert) => {
        module.createRoute();
        module.calculateFare();
        module.setLongRoute(1);
        // setLongRoute has no return value, so we just check it doesn't throw
        module.destroyRoute();
    }, 'fare');

    testRunner.addTest('CalcRoute.setStartAsCity', (module, assert) => {
        module.createRoute();
        module.calculateFare();
        module.setStartAsCity();
        // setStartAsCity has no return value, so we just check it doesn't throw
        module.destroyRoute();
    }, 'fare');

    testRunner.addTest('CalcRoute.setArriveAsCity', (module, assert) => {
        module.createRoute();
        module.calculateFare();
        module.setArriveAsCity();
        // setArriveAsCity has no return value, so we just check it doesn't throw
        module.destroyRoute();
    }, 'fare');

    // デバッグ・ユーティリティテスト
    testRunner.addTest('Debug.debugStations', (module, assert) => {
        const result = module.debugStations();
        assert.isString(result, 'debugStations should return a string');
        assert.isGreaterThan(result.length, 0, 'debugStations should return non-empty string');
    }, 'debug');

    // エラーハンドリングテスト
    testRunner.addTest('Error handling - invalid station ID', (module, assert) => {
        const stationName = module.getStationName(-1);
        assert.isString(stationName, 'getStationName should handle invalid IDs gracefully');
    }, 'error-handling');

    testRunner.addTest('Error handling - invalid line ID', (module, assert) => {
        const lineName = module.getLineName(-1);
        assert.isString(lineName, 'getLineName should handle invalid IDs gracefully');
    }, 'error-handling');

    // メモリ管理テスト
    testRunner.addTest('Memory management - multiple create/destroy cycles', (module, assert) => {
        for (let i = 0; i < 5; i++) {
            const result = module.createRoute();
            assert.equals(result, 1, `createRoute should succeed in iteration ${i}`);
            module.destroyRoute();
        }
    }, 'memory');

    testRunner.addTest('Memory management - route operations', (module, assert) => {
        module.createRoute();
        
        // 複数回の操作
        for (let i = 1; i <= 5; i++) {
            module.addStation(i);
        }
        
        const count = module.getRouteCount();
        assert.equals(count, 5, 'Route should contain 5 stations');
        
        module.removeAll();
        const emptyCount = module.getRouteCount();
        assert.equals(emptyCount, 0, 'Route should be empty after removeAll');
        
        module.destroyRoute();
    }, 'memory');

    // 統合テスト
    testRunner.addTest('Integration - complete fare calculation flow', (module, assert) => {
        // データベース接続
        const dbResult = module.openDatabase();
        assert.equals(dbResult, 1, 'Database should open successfully');
        
        // 駅ID取得
        const tokyoId = module.getStationId('東京');
        assert.isNumber(tokyoId, 'Should get Tokyo station ID');
        
        // 経路作成
        const routeResult = module.createRoute();
        assert.equals(routeResult, 1, 'Route should be created successfully');
        
        // 駅追加
        module.addStation(1);
        module.addStation(2);
        
        // 運賃計算
        const fareResult = module.calculateFare();
        assert.isGreaterThanOrEqual(fareResult, 0, 'Fare calculation should succeed');
        
        // 運賃文字列取得
        const fareString = module.getFareString();
        assert.isString(fareString, 'Should get fare string');
        
        // クリーンアップ
        module.destroyRoute();
        module.closeDatabase();
    }, 'integration');
}

// グローバル関数としてテストランナーを作成・実行
let globalTestRunner = null;

async function initializeTests() {
    globalTestRunner = new FarertTestRunner();
    await globalTestRunner.initialize();
    defineTests(globalTestRunner);
    return globalTestRunner;
}

async function runAllUnitTests() {
    if (!globalTestRunner) {
        globalTestRunner = await initializeTests();
    }
    return await globalTestRunner.runAllTests();
}

async function runTestCategory(category) {
    if (!globalTestRunner) {
        globalTestRunner = await initializeTests();
    }
    return await globalTestRunner.runTestsByCategory(category);
}

// Node.js環境での実行サポート
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FarertTestRunner,
        defineTests,
        initializeTests,
        runAllUnitTests,
        runTestCategory
    };
}

// ブラウザ環境でのグローバル公開
if (typeof window !== 'undefined') {
    window.FarertTestRunner = FarertTestRunner;
    window.initializeTests = initializeTests;
    window.runAllUnitTests = runAllUnitTests;
    window.runTestCategory = runTestCategory;
}