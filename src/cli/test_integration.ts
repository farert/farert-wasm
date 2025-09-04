#!/usr/bin/env node

/**
 * テスト統合スクリプト
 * オリジナル移植テストとWebAssembly独自テストを統合実行
 */

import { executeTestSuite } from './test_exec_original';
import { WebAssemblyExtendedTests } from './test_wasm_extended';

async function runIntegratedTests(): Promise<void> {
    console.log('🚄 Farert 統合テストスイート実行');
    console.log('=' .repeat(60));
    
    let totalSuccess = true;
    
    try {
        // Phase 1: オリジナル移植テスト (A群API)
        console.log('\n📋 Phase 1: オリジナル移植テスト (test_exec.cpp完全移植)');
        console.log('-' .repeat(50));
        
        const originalSuccess = await executeTestSuite(false);
        
        if (originalSuccess) {
            console.log('✅ オリジナル移植テスト: 全て成功');
        } else {
            console.log('❌ オリジナル移植テスト: 失敗あり');
            totalSuccess = false;
        }
        
        // Phase 2: WebAssembly独自テスト (B群・C群API)
        console.log('\n📋 Phase 2: WebAssembly独自テスト (フロントエンド・拡張機能)');
        console.log('-' .repeat(50));
        
        const extendedTests = new WebAssemblyExtendedTests(false);
        const extendedSuccess = await extendedTests.executeAll();
        
        if (extendedSuccess) {
            console.log('✅ WebAssembly独自テスト: 全て成功');
        } else {
            console.log('❌ WebAssembly独自テスト: 失敗あり');
            totalSuccess = false;
        }
        
        // 総合結果
        console.log('\n' + '=' .repeat(60));
        console.log('📊 総合テスト結果');
        console.log('-' .repeat(30));
        console.log(`オリジナル移植: ${originalSuccess ? '✅ 成功' : '❌ 失敗'}`);
        console.log(`WebAssembly独自: ${extendedSuccess ? '✅ 成功' : '❌ 失敗'}`);
        
        if (totalSuccess) {
            console.log('\n🎉 全てのテストが成功しました！');
            console.log('✓ testmain.cpp + test_exec.cpp 完全移植');
            console.log('✓ WebAssembly独自機能の品質保証');
            console.log('✓ フロントエンド用APIの動作確認');
            process.exit(0);
        } else {
            console.log('\n⚠️  一部のテストが失敗しました');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n💥 統合テスト実行エラー:', error);
        process.exit(1);
    }
}

// 実行
runIntegratedTests();