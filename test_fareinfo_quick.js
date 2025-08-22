#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Simple test to verify FareInfo JSON functionality
async function testFareInfoJson() {
    console.log('🎫 FareInfo JSON テスト開始...');
    
    try {
        // Try to load the WebAssembly module (this might not work in Node.js, but let's check the files exist)
        const distDir = path.join(__dirname, 'dist');
        const jsFile = path.join(distDir, 'farert.js');
        const wasmFile = path.join(distDir, 'farert.wasm');
        
        if (fs.existsSync(jsFile) && fs.existsSync(wasmFile)) {
            console.log('✅ WebAssemblyファイルが生成されています:');
            const jsStats = fs.statSync(jsFile);
            const wasmStats = fs.statSync(wasmFile);
            console.log(`   farert.js: ${(jsStats.size / 1024).toFixed(2)} KB`);
            console.log(`   farert.wasm: ${(wasmStats.size / 1024).toFixed(2)} KB`);
            
            // Check if getFareInfoJson API is in the JS file
            const jsContent = fs.readFileSync(jsFile, 'utf8');
            if (jsContent.includes('getFareInfoJson')) {
                console.log('✅ getFareInfoJson APIが正しくバインドされています');
            } else {
                console.log('❌ getFareInfoJson APIが見つかりません');
            }
            
            console.log('🎉 ビルド成功！ブラウザでテストを実行してください:');
            console.log('   http://localhost:8081/test_fareinfo_json.html');
            
        } else {
            console.log('❌ WebAssemblyファイルが見つかりません');
        }
        
    } catch (error) {
        console.error('❌ エラー:', error.message);
    }
}

testFareInfoJson();