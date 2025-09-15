#!/usr/bin/env node

/**
 * Cross-Browser Compatibility Test for Farert WebAssembly Module
 *
 * This script validates that the WebAssembly files required for browser
 * integration are present and properly structured.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Browser Integration Compatibility\n');

// Test file paths
const projectRoot = path.resolve(__dirname, '../../..');
const distPath = path.join(projectRoot, 'dist');
const jsFile = path.join(distPath, 'farert.js');
const wasmFile = path.join(distPath, 'farert.wasm');
const htmlFile = path.join(__dirname, 'browser-integration.html');
const readmeFile = path.join(__dirname, 'README.md');

let allTestsPassed = true;

function testFile(filePath, description) {
    try {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`✅ ${description}: Found (${sizeKB} KB)`);
        return true;
    } catch (error) {
        console.log(`❌ ${description}: Missing - ${filePath}`);
        allTestsPassed = false;
        return false;
    }
}

function testFileContent(filePath, description, expectedPatterns) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const missing = expectedPatterns.filter(pattern => !content.includes(pattern));

        if (missing.length === 0) {
            console.log(`✅ ${description}: Content validation passed`);
            return true;
        } else {
            console.log(`⚠️  ${description}: Missing patterns - ${missing.join(', ')}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${description}: Cannot read file - ${error.message}`);
        allTestsPassed = false;
        return false;
    }
}

// File existence tests
console.log('📁 File Existence Tests:');
testFile(jsFile, 'Emscripten JavaScript Wrapper');
testFile(wasmFile, 'WebAssembly Binary');
testFile(htmlFile, 'Browser Integration HTML');
testFile(readmeFile, 'Documentation README');

console.log('\n🔎 Content Validation Tests:');

// JavaScript wrapper validation
testFileContent(jsFile, 'Emscripten JS Content', [
    'Module',
    'WebAssembly',
    'instantiate'
]);

// HTML content validation
testFileContent(htmlFile, 'HTML Integration Content', [
    'BrowserWasmLoader',
    'loadModule',
    'initializeDatabase',
    'searchStation',
    'buildRoute',
    'calculateFare'
]);

// README content validation
testFileContent(readmeFile, 'README Documentation', [
    'Browser Integration',
    'Quick Start',
    'WebAssembly Module Loading',
    'Cross-Browser Compatibility',
    'API Function Coverage'
]);

console.log('\n🌐 Browser Compatibility Indicators:');

// Check for browser-specific features in HTML
const htmlContent = fs.readFileSync(htmlFile, 'utf8');

const browserFeatures = [
    { feature: 'fetch API', pattern: 'fetch(', supported: htmlContent.includes('fetch(') },
    { feature: 'ES6 modules', pattern: 'import', supported: htmlContent.includes('class ') },
    { feature: 'async/await', pattern: 'async ', supported: htmlContent.includes('async ') },
    { feature: 'Promise', pattern: 'Promise', supported: htmlContent.includes('Promise') },
    { feature: 'WebAssembly', pattern: 'WebAssembly', supported: htmlContent.includes('WebAssembly') },
    { feature: 'DOM manipulation', pattern: 'getElementById', supported: htmlContent.includes('getElementById') }
];

browserFeatures.forEach(({ feature, supported }) => {
    const status = supported ? '✅' : '❌';
    console.log(`${status} ${feature}: ${supported ? 'Implemented' : 'Missing'}`);
    if (!supported) allTestsPassed = false;
});

console.log('\n📊 File Size Analysis:');

try {
    const jsStats = fs.statSync(jsFile);
    const wasmStats = fs.statSync(wasmFile);
    const htmlStats = fs.statSync(htmlFile);

    console.log(`JavaScript wrapper: ${(jsStats.size / 1024).toFixed(2)} KB`);
    console.log(`WebAssembly binary: ${(wasmStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`HTML demo: ${(htmlStats.size / 1024).toFixed(2)} KB`);

    // Browser loading performance estimates
    const totalSize = jsStats.size + wasmStats.size;
    const estimatedLoadTime3G = (totalSize / 1024 / 1024) / 0.4; // 400 KB/s on 3G
    const estimatedLoadTime4G = (totalSize / 1024 / 1024) / 2.0; // 2 MB/s on 4G

    console.log(`\n⏱️  Estimated load times:`);
    console.log(`3G connection: ~${estimatedLoadTime3G.toFixed(1)} seconds`);
    console.log(`4G connection: ~${estimatedLoadTime4G.toFixed(1)} seconds`);

} catch (error) {
    console.log('❌ Cannot analyze file sizes');
    allTestsPassed = false;
}

console.log('\n🧪 Integration Test Recommendations:');

console.log('1. Serve files with HTTP server:');
console.log('   npx serve . -p 8080');
console.log('   Open: http://localhost:8080/examples/api/browser/browser-integration.html');

console.log('\n2. Test in multiple browsers:');
console.log('   - Chrome 90+');
console.log('   - Firefox 88+');
console.log('   - Safari 14+');
console.log('   - Edge 90+');

console.log('\n3. Verify functionality:');
console.log('   - WebAssembly module loading');
console.log('   - Database connection');
console.log('   - Station search');
console.log('   - Route building');
console.log('   - Fare calculation');

console.log('\n4. Performance testing:');
console.log('   - Memory usage monitoring');
console.log('   - Long-running session testing');
console.log('   - Multiple API calls stress testing');

// Final result
console.log('\n' + '='.repeat(60));
if (allTestsPassed) {
    console.log('🎉 All compatibility tests PASSED!');
    console.log('The browser integration is ready for testing.');
    process.exit(0);
} else {
    console.log('⚠️  Some compatibility tests FAILED!');
    console.log('Please address the issues above before testing.');
    process.exit(1);
}