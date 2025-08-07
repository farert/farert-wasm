// Node.js Simple Test Runner
// ES6 modules import issue workaround

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Farert WebAssembly Simple Test Runner');
console.log('==========================================\n');

// Check if WebAssembly files exist
const distDir = path.join(__dirname, 'dist');
const wasmFile = path.join(distDir, 'farert.wasm');
const jsFile = path.join(distDir, 'farert.js');

if (!fs.existsSync(wasmFile) || !fs.existsSync(jsFile)) {
    console.error('❌ WebAssembly files not found. Please run: make build');
    process.exit(1);
}

console.log('✅ WebAssembly files found');
console.log(`   - ${path.basename(wasmFile)}: ${(fs.statSync(wasmFile).size / 1024 / 1024).toFixed(2)}MB`);
console.log(`   - ${path.basename(jsFile)}: ${(fs.statSync(jsFile).size / 1024).toFixed(2)}KB`);

// Check if server is running
const http = require('http');

function checkServer() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:8080/test_unit.html', (res) => {
            resolve(true);
        });
        req.on('error', () => {
            resolve(false);
        });
        req.setTimeout(1000);
    });
}

async function runTests() {
    const serverRunning = await checkServer();
    
    if (serverRunning) {
        console.log('\n✅ Test server is running');
        console.log('🌐 Browser tests available at:');
        console.log('   - http://localhost:8080/test_unit.html (詳細ユニットテスト)');
        console.log('   - http://localhost:8080/farert_test.html (基本動作テスト)');
        
        console.log('\n📋 Manual Test Instructions:');
        console.log('1. ブラウザで上記URLを開く');
        console.log('2. "🚀 全テスト実行" ボタンをクリック');
        console.log('3. 結果を確認');
        
        console.log('\n💡 Expected Results:');
        console.log('   ✅ データベース接続成功');
        console.log('   🧪 基本テスト結果: 42 (期待値: 42)');
        console.log('   🚉 駅検索: 東京 → ID:XXX → 名前:東京');
        console.log('   ✅ 経路オブジェクト作成成功');
        console.log('   💰 運賃計算テスト結果: 成功');
        
    } else {
        console.log('\n❌ Test server is not running');
        console.log('💡 Start the server with: npm run serve');
        console.log('   Then run this test again');
    }
    
    // File integrity checks
    console.log('\n🔍 File Integrity Checks:');
    
    try {
        const jsContent = fs.readFileSync(jsFile, 'utf8');
        
        // Check for key exports
        const hasModuleExports = jsContent.includes('FarertModule');
        const hasWasmBinary = jsContent.includes('wasmBinaryFile') || jsContent.includes('.wasm');
        const hasBindings = jsContent.includes('_embind_register');
        
        console.log(`   ✅ Module exports: ${hasModuleExports ? 'Found' : '❌ Missing'}`);
        console.log(`   ✅ WASM reference: ${hasWasmBinary ? 'Found' : '❌ Missing'}`);
        console.log(`   ✅ Emscripten bindings: ${hasBindings ? 'Found' : '❌ Missing'}`);
        
    } catch (error) {
        console.log(`   ❌ File analysis failed: ${error.message}`);
    }
    
    console.log('\n📊 Test Status: Manual browser testing required');
    console.log('   Node.js testing temporarily disabled due to ES6 module compatibility');
}

runTests().catch(console.error);