#!/usr/bin/env node

/**
 * Svelte Integration Test Runner
 * 
 * Simple test runner to validate Svelte integration test structure
 * without requiring full vitest installation in the main project.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Svelte Integration Test Validation\n');

// Test files to check
const testFiles = [
  'svelte-integration.test.ts',
  'setup.ts',
  'vitest.config.ts'
];

// Check if test files exist and have content
let allFilesValid = true;

testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Missing: ${file}`);
    allFilesValid = false;
  } else {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const size = (content.length / 1024).toFixed(1);
    console.log(`✅ Present: ${file} (${lines} lines, ${size}KB)`);
  }
});

console.log();

// Validate test structure by checking key test patterns
const testFile = path.join(__dirname, 'svelte-integration.test.ts');
if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf-8');
  
  console.log('📋 Test Coverage Analysis:');
  
  const checks = [
    { name: 'REQ-API-003 Station Search Store', pattern: /createStationSearchStore|stationSearchStore|debounced.*search/i },
    { name: 'REQ-API-003 Fare Calculation Store', pattern: /createFareCalculationStore|fareCalculationStore|auto.*calculation/i },
    { name: 'REQ-API-003 StationSelector Component', pattern: /StationSelector.*autocomplete|render\(StationSelector/i },
    { name: 'REQ-API-003 RouteBuilder Component', pattern: /RouteBuilder.*drag|render\(RouteBuilder/i },
    { name: 'REQ-API-003 Error Handling', pattern: /error.*boundaries|error.*handling|catch.*display/i },
    { name: 'Japanese Text Support', pattern: /japanese|日本語|東京|大阪|とうきょう|kana/i },
    { name: 'Accessibility Features', pattern: /aria|accessibility|screen.*reader/i },
    { name: 'Keyboard Navigation', pattern: /keyboard.*nav|keydown|keyup|ArrowDown|ArrowUp|Enter|Escape/i },
    { name: 'Component Lifecycle', pattern: /mount|unmount|lifecycle|destroy|\$destroy/i },
    { name: 'Store Reactivity', pattern: /reactive|subscribe|writable|readable|get\(.*subscribe/i }
  ];
  
  checks.forEach(check => {
    const found = check.pattern.test(content);
    console.log(`${found ? '✅' : '⚠️ '} ${check.name}`);
    if (!found && check.name.includes('REQ-API-003')) {
      allFilesValid = false;
    }
  });
  
  console.log();
  
  // Count test cases
  const testCases = content.match(/test\(/g) || [];
  const describeBlocks = content.match(/describe\(/g) || [];
  
  console.log(`📊 Test Statistics:`);
  console.log(`   • ${describeBlocks.length} test suites`);
  console.log(`   • ${testCases.length} test cases`);
  console.log(`   • ${(content.length / 1024).toFixed(1)}KB total test code`);
}

console.log();

// Validate setup file
const setupFile = path.join(__dirname, 'setup.ts');
if (fs.existsSync(setupFile)) {
  const setupContent = fs.readFileSync(setupFile, 'utf-8');
  
  const setupChecks = [
    'webassembly',
    'dom',
    'japanese',
    'test.*utilit'
  ];
  
  console.log('⚙️  Setup File Validation:');
  const setupCheckDetails = [
    { name: 'WebAssembly mock', pattern: /webassembly/i },
    { name: 'DOM environment', pattern: /dom|happy-dom/i },
    { name: 'Japanese text encoding', pattern: /japanese|utf.*8|textencoder/i },
    { name: 'Test utilities', pattern: /testutils|test.*utilit/i }
  ];
  
  setupCheckDetails.forEach(check => {
    const found = check.pattern.test(setupContent);
    console.log(`${found ? '✅' : '❌'} ${check.name}`);
  });
}

console.log('\n' + '='.repeat(50));

if (allFilesValid) {
  console.log('🎉 All Svelte integration tests are properly structured!');
  console.log('✅ Ready for REQ-API-003 compliance testing');
  process.exit(0);
} else {
  console.log('❌ Some tests need attention');
  console.log('💡 Please review the missing requirements above');
  process.exit(1);
}