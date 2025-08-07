#!/usr/bin/env node

/**
 * Farert WebAssembly Unit Tests - Command Line Runner
 * Node.js環境でユニットテストを実行するスクリプト
 */

const fs = require('fs');
const path = require('path');

// WebAssembly環境のセットアップ（Node.js用）
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

// テストランナーのインポート
const { FarertTestRunner, defineTests } = require('./unit_tests.js');

async function runTests() {
    console.log('🚀 Farert WebAssembly Unit Tests (Node.js)');
    console.log('==========================================\n');

    // WebAssemblyファイルの存在確認
    const wasmPath = path.join(__dirname, '..', 'dist', 'farert.wasm');
    const jsPath = path.join(__dirname, '..', 'dist', 'farert.js');
    
    if (!fs.existsSync(wasmPath)) {
        console.error('❌ WebAssemblyファイルが見つかりません:', wasmPath);
        console.error('   先にプロジェクトをビルドしてください: make build');
        process.exit(1);
    }
    
    if (!fs.existsSync(jsPath)) {
        console.error('❌ JavaScriptバインディングファイルが見つかりません:', jsPath);
        console.error('   先にプロジェクトをビルドしてください: make build');
        process.exit(1);
    }

    try {
        // テストランナーを初期化
        const testRunner = new FarertTestRunner();
        
        // Node.js用のWebAssemblyローダーを設定
        testRunner.initialize = async function() {
            try {
                // Node.js環境でのWebAssembly読み込み
                const moduleExports = require(jsPath);
                const moduleFactory = moduleExports.default || moduleExports;
                
                if (typeof moduleFactory !== 'function') {
                    throw new Error('Module factory is not a function. Check Emscripten build settings.');
                }
                
                this.module = await moduleFactory();
                this.isReady = true;
                console.log('✅ Farert WebAssembly module loaded successfully\n');
                return true;
            } catch (error) {
                console.error('❌ Failed to load WebAssembly module:', error.message);
                console.error('   This might be due to Emscripten ES6 module format.');
                console.error('   Try running browser tests instead: npm run test:browser');
                return false;
            }
        };

        // モジュール初期化
        const initialized = await testRunner.initialize();
        if (!initialized) {
            console.error('❌ WebAssemblyモジュールの初期化に失敗しました');
            process.exit(1);
        }

        // テストケースを定義
        defineTests(testRunner);

        // コマンドライン引数の処理
        const args = process.argv.slice(2);
        let results;

        if (args.length > 0) {
            const category = args[0];
            console.log(`🔍 Running tests in category: ${category}\n`);
            results = await testRunner.runTestsByCategory(category);
        } else {
            console.log('🧪 Running all unit tests...\n');
            results = await testRunner.runAllTests();
        }

        // 結果の出力
        console.log('\n' + '='.repeat(50));
        console.log('📊 Final Test Results:');
        console.log('='.repeat(50));
        
        const passRate = results.total > 0 ? 
            (results.passed / results.total * 100).toFixed(1) : 0;
        
        console.log(`Total Tests:    ${results.total}`);
        console.log(`✅ Passed:      ${results.passed}`);
        console.log(`❌ Failed:      ${results.failed}`);
        console.log(`⏭️  Skipped:     ${results.skipped}`);
        console.log(`📈 Pass Rate:   ${passRate}%`);

        if (results.errors.length > 0) {
            console.log('\n❌ Failed Test Details:');
            results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.test}`);
                console.log(`   Error: ${error.error}\n`);
            });
        }

        // 成功・失敗に応じた終了コード
        if (results.failed > 0) {
            console.log('❌ Some tests failed');
            process.exit(1);
        } else {
            console.log('✅ All tests passed!');
            process.exit(0);
        }

    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 使用方法の表示
function showUsage() {
    console.log('Usage: node run_tests.js [category]');
    console.log('');
    console.log('Categories:');
    console.log('  basic         - Basic functionality tests');
    console.log('  database      - Database management tests');
    console.log('  search        - Station/line search tests');
    console.log('  route         - Route management tests');
    console.log('  fare          - Fare calculation tests');
    console.log('  debug         - Debug and utility tests');
    console.log('  error-handling - Error handling tests');
    console.log('  memory        - Memory management tests');
    console.log('  integration   - Integration tests');
    console.log('');
    console.log('Examples:');
    console.log('  node run_tests.js           # Run all tests');
    console.log('  node run_tests.js database  # Run only database tests');
    console.log('  node run_tests.js fare      # Run only fare calculation tests');
}

// ヘルプオプションの処理
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    process.exit(0);
}

// メイン実行
if (require.main === module) {
    runTests().catch(error => {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    });
}