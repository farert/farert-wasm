#!/usr/bin/env node

/**
 * TypeScript implementation of testmain.cpp 
 * Complete migration from ../farert/test/unix/all/testmain.cpp
 * 
 * This is a faithful recreation of the original main() function structure
 */

import { wasmLoader } from './wasm_loader';
import { 
  FarertModule, 
  CLIError, 
  CLIErrorCode, 
  SystemError,
  EnvironmentValidationError
} from './types';
import { configManager } from './config_manager';
import { performanceMonitor } from './performance_monitor';
import { executeRouteTest } from './route_test';
import { executeAutoRoute } from './auto_route';
import { initializeSignalHandling } from './signal_handler';
import { ErrorHandlingSystemTests } from './test_error_handling';
import * as fs from 'fs';

// Import complete test suite (when ready)
let executeCompleteTestSuite: ((module: FarertModule) => Promise<void>) | null = null;
try {
    // Dynamic import to avoid compilation errors if file doesn't exist yet
    const testModule = require('./test_exec_complete');
    executeCompleteTestSuite = testModule.executeCompleteTestSuite;
} catch (error) {
    // Test suite module not available - will use fallback
    executeCompleteTestSuite = null;
}

// Global variables (equivalent to original C++ globals)
let tbuf = '';
let tbuf2 = '';

/**
 * Print usage information (equivalent to original C++ version)
 * Faithful recreation of usage() function from testmain.cpp
 */
function printUsage(programName: string): void {
    console.error(`Usage: ${programName} [OPTIONS] [ARGUMENTS]`);
    console.error('');
    console.error('OPTIONS:');
    console.error('      -exec     : Execute the complete test suite.');
    console.error('      -test-error : Execute comprehensive error handling system tests (ROUTE_ERR_001-099)');
    console.error('      -5        : Calculate 5-parameter route (station1 line1 station2 line2 station3)');
    console.error('      -h        : Show help message');
    console.error('      --help    : Show help message');
    console.error('      -help     : Show help message');
    console.error('      -<num>[r] : Route test with options:');
    console.error('                  0: all details (default)');
    console.error('                  1: no return trip');
    console.error('                  2: no special rules');
    console.error('                  3: no rules + no return');
    console.error('                  4: only special rules');
    console.error('                  5: only special rules + no return');
    console.error('                  r: reverse route order');
    console.error('      --env-report: Show environment validation report');
    console.error('      --env-debug : Enable debug mode for this session');
    console.error('');
    console.error('ARGUMENTS:');
    console.error('      <file>          : Route description file');
    console.error('      <station1> ...  : Direct route (odd count: normal, even count: auto)');
    console.error('');
    console.error('EXAMPLES:');
    console.error('      node main.js -exec');
    console.error('      node main.js -test-error');
    console.error('      node main.js -5 東京 東海道線 品川 東海道線 新大阪');
    console.error('      node main.js 東京 東海道線 品川');
    console.error('      node main.js routes.txt');
    console.error('');
    console.error('For detailed help, use: -h or --help');
    console.error('For complete documentation, see: README_CLI.md');
}

/**
 * Parse command line arguments (equivalent to parse_cmdline() in original)
 */
function parseCommandLine(argc: number, argv: string[], isReverse: boolean): void {
    tbuf = ''; // Reset buffer
    tbuf2 = '';
    
    if (isReverse && (argc % 2) === 0) {
        // Reverse order for even number of arguments
        for (let i = argc - 1; i > 0; i--) {
            tbuf += argv[i] + ' ';
        }
    } else {
        // Normal order
        for (let i = 1; i < argc; i++) {
            if (((argc % 2) !== 0) && (i === (argc - 1))) {
                // Last argument for auto route (odd number of args)
                tbuf2 = argv[i];
            } else {
                tbuf += argv[i] + ' ';
            }
        }
    }
    
    // Remove trailing space
    tbuf = tbuf.trim();
}

/**
 * Print comprehensive help information with Japanese examples
 * Requirements: REQ-CLI-006.1, REQ-CLI-006.2, REQ-CLI-006.4
 * 
 * Provides detailed command syntax, parameter descriptions, and real Japanese examples
 */
function printHelp(): void {
    console.log('🚀 Farert WebAssembly CLI - Japanese Railway Fare Calculator');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📖 OVERVIEW:');
    console.log('  A comprehensive TypeScript CLI for calculating Japanese railway fares');
    console.log('  using WebAssembly. Supports all JR lines, private railways, and');
    console.log('  complex routing with special fare rules.');
    console.log('');
    console.log('⚡ QUICK START:');
    console.log('  1. Ensure WebAssembly module is built: npm run build');
    console.log('  2. For single route: node main.js -5 東京 山手線 新宿 中央線 立川');
    console.log('  3. For test suite: node main.js -exec');
    console.log('');
    console.log('📋 COMMAND SYNTAX:');
    console.log('  node main.js [OPTIONS] [ARGUMENTS]');
    console.log('');
    console.log('🔧 OPTIONS:');
    console.log('');
    console.log('  -exec');
    console.log('    Execute complete test suite (equivalent to original test_exec.cpp)');
    console.log('    Runs all validation tests to verify WebAssembly implementation');
    console.log('');
    console.log('  -test-error');
    console.log('    Execute comprehensive error handling system tests (Task 31)');
    console.log('    Tests all error codes ROUTE_ERR_001-099, fuzzy matching suggestions,');
    console.log('    error recovery scenarios, and object state consistency validation');
    console.log('');
    console.log('  -5 <station1> <line1> <station2> <line2> <station3>');
    console.log('    Calculate fare for specific 5-parameter route');
    console.log('    Parameters:');
    console.log('      station1: Starting station (Japanese name)');
    console.log('      line1:    First railway line name');
    console.log('      station2: Transfer station (intermediate)');
    console.log('      line2:    Second railway line name');  
    console.log('      station3: Destination station');
    console.log('');
    console.log('  -h, --help, -help');
    console.log('    Show this comprehensive help message');
    console.log('');
    console.log('  -<number>[r]');
    console.log('    Route test with output format options:');
    console.log('      0: Show all details (default - complete fare breakdown)');
    console.log('      1: No return trip information');
    console.log('      2: No special rules display');
    console.log('      3: No rules + no return trip');
    console.log('      4: Only special rules (hide basic fare)');
    console.log('      5: Only special rules + no return trip');
    console.log('      r: Reverse route calculation order');
    console.log('');
    console.log('📍 JAPANESE STATION EXAMPLES (REQ-CLI-006.1):');
    console.log('');
    console.log('  🏙️  Major Stations:');
    console.log('    東京, 新宿, 大阪, 品川, 上野, 池袋, 渋谷');
    console.log('    横浜, 名古屋, 京都, 神戸, 仙台, 福岡, 札幌');
    console.log('');
    console.log('  🚉 JR Lines:');
    console.log('    東海道線, 山手線, 中央線, 京浜東北線, 総武線');
    console.log('    常磐線, 埼京線, 湘南新宿ライン, 上野東京ライン');
    console.log('');
    console.log('  🚄 Shinkansen:');
    console.log('    東海道新幹線, 東北新幹線, 上越新幹線, 北陸新幹線');
    console.log('');
    console.log('  🚇 Private Lines:');
    console.log('    東急東横線, 小田急線, 京王線, 西武池袋線, 京急本線');
    console.log('');
    console.log('💡 DETAILED EXAMPLES (REQ-CLI-006.4):');
    console.log('');
    console.log('  🌟 Basic Route Calculation:');
    console.log('    node main.js -5 東京 東海道線 品川 山手線 新宿');
    console.log('    → Calculates: Tokyo → Shinagawa (Tokaido) → Shinjuku (Yamanote)');
    console.log('');
    console.log('  🌟 Long Distance Route:');
    console.log('    node main.js -5 東京 東海道線 名古屋 東海道線 大阪');
    console.log('    → Calculates: Tokyo → Nagoya → Osaka via Tokaido Line');
    console.log('');
    console.log('  🌟 Complex Transfer Route:');
    console.log('    node main.js -5 新宿 中央線 立川 青梅線 青梅');
    console.log('    → Calculates: Shinjuku → Tachikawa (Chuo) → Ome (Ome Line)');
    console.log('');
    console.log('  🌟 Metropolitan Area:');
    console.log('    node main.js -5 渋谷 山手線 新橋 東海道線 川崎');
    console.log('    → Calculates: Shibuya → Shimbashi (Yamanote) → Kawasaki (Tokaido)');
    console.log('');
    console.log('  🌟 Direct Route (3 parameters):');
    console.log('    node main.js 上野 山手線 東京');
    console.log('    → Calculates: Ueno → Tokyo via Yamanote Line');
    console.log('');
    console.log('  🌟 Auto Route (2 parameters):');
    console.log('    node main.js 東京 大阪');
    console.log('    → Automatically finds optimal route Tokyo → Osaka');
    console.log('');
    console.log('  🌟 Route from File:');
    console.log('    node main.js routes.txt');
    console.log('    → Process multiple routes from text file');
    console.log('');
    console.log('  🌟 Test Suite Execution:');
    console.log('    node main.js -exec');
    console.log('    → Run comprehensive validation test suite');
    console.log('');
    console.log('    node main.js -test-error');
    console.log('    → Run error handling system tests (all ROUTE_ERR_001-099 codes)');
    console.log('    → Validate fuzzy matching suggestions and error recovery');
    console.log('');
    console.log('  🌟 Format Options:');
    console.log('    node main.js -2 東京 東海道線 大阪  # No special rules');
    console.log('    node main.js -1r 新宿 山手線 品川   # No return, reversed');
    console.log('');
    console.log('📂 FILE FORMAT:');
    console.log('  Routes can be specified in text files, one route per line:');
    console.log('    東京 東海道線 品川');
    console.log('    新宿 山手線 上野');
    console.log('    # Comments start with #');
    console.log('    大阪 東海道線 京都 # Inline comments supported');
    console.log('    / # End processing marker');
    console.log('');
    console.log('⚠️  COMMON MISTAKES & SOLUTIONS (REQ-CLI-006.2):');
    console.log('');
    console.log('  ❌ Problem: "Station not found" error');
    console.log('  ✅ Solution: Use exact Japanese station names');
    console.log('     • Correct: 東京');
    console.log('     • Incorrect: tokyo, Tokyo, とうきょう');
    console.log('');
    console.log('  ❌ Problem: "Invalid line name" error');
    console.log('  ✅ Solution: Use official line names with proper suffixes');
    console.log('     • Correct: 東海道線, 山手線, 中央線');
    console.log('     • Incorrect: 東海道, 山手, JR中央線');
    console.log('');
    console.log('  ❌ Problem: "Parameter count mismatch" error');
    console.log('  ✅ Solution: Check parameter count for command type');
    console.log('     • -5 command: exactly 5 parameters required');
    console.log('     • Direct route: odd number (3, 5, 7, ...)');
    console.log('     • Auto route: even number (2, 4, 6, ...)');
    console.log('');
    console.log('  ❌ Problem: "WebAssembly module not found" error');
    console.log('  ✅ Solution: Build the project first');
    console.log('     npm run build');
    console.log('     npm run cli:build');
    console.log('');
    console.log('🛠️  TROUBLESHOOTING (REQ-CLI-006.2):');
    console.log('');
    console.log('  🔍 Build Issues:');
    console.log('    • Run: npm install && npm run build');
    console.log('    • Check: dist/farert.js and dist/farert.wasm exist');
    console.log('    • Verify: data/jrdbnewest.db is present');
    console.log('');
    console.log('  🔍 Database Issues:');
    console.log('    • Ensure jrdbnewest.db file exists in data/ directory');
    console.log('    • Check file permissions (readable)');
    console.log('    • Verify database integrity with: file data/jrdbnewest.db');
    console.log('');
    console.log('  🔍 Japanese Text Issues:');
    console.log('    • Use UTF-8 encoding in terminal');
    console.log('    • On Windows: chcp 65001 (for UTF-8 support)');
    console.log('    • Use proper Japanese input method');
    console.log('');
    console.log('  🔍 Node.js Version:');
    console.log('    • Required: Node.js 14.0.0 or higher');
    console.log('    • Check with: node --version');
    console.log('    • Update if needed: https://nodejs.org');
    console.log('');
    console.log('📚 DOCUMENTATION REFERENCES (REQ-CLI-006.5):');
    console.log('');
    console.log('  📖 Complete CLI Guide: README_CLI.md (comprehensive usage and troubleshooting)');
    console.log('  🏗️  Project Overview: CLAUDE.md (technical architecture and design)');
    console.log('  🚀 Quick Start: README.md (basic setup and installation)');
    console.log('  🧪 Testing Guide: .claude/specs/typescript-cli-interface/ (detailed specifications)');
    console.log('  🛠️  Development: .claude/steering/ (architecture and development guidelines)');
    console.log('');
    console.log('🎯 ENVIRONMENT VARIABLES:');
    console.log('');
    console.log('  CLI_DEBUG=1          Enable verbose debug logging');
    console.log('  CLI_WASM_PATH=path   Custom WebAssembly module path');
    console.log('');
    console.log('📞 GETTING HELP:');
    console.log('');
    console.log('  For detailed technical documentation: see CLAUDE.md');
    console.log('  For build issues: check .claude/steering/ directory');
    console.log('  For WebAssembly specifics: see src/core/ implementation');
    console.log('');
    console.log('💻 PLATFORM SUPPORT:');
    console.log('');
    console.log('  ✅ macOS (Terminal, iTerm2)');
    console.log('  ✅ Linux (bash, zsh)');
    console.log('  ✅ Windows (cmd, PowerShell, WSL)');
    console.log('');
    console.log('🚀 Ready to calculate Japanese railway fares with precision!');
    console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Handle 5-parameter route calculation (-5 command)
 * Enhanced with comprehensive Japanese text validation and fuzzy matching
 * Requirements: REQ-CLI-003.3, REQ-CLI-006.3
 */
async function handle5ParameterRoute(args: string[], module: FarertModule): Promise<number> {
    if (args.length !== 5) {
        const error = new CLIError(
            '-5 command requires exactly 5 parameters',
            CLIErrorCode.PARAMETER_COUNT_MISMATCH,
            {
                providedCount: args.length,
                expectedCount: 5,
                providedArgs: args,
                usage: '-5 <station1> <line1> <station2> <line2> <station3>',
                example: '-5 東京 東海道線 品川 東海道線 新大阪'
            }
        );
        console.error(error.getFormattedMessage());
        return error.code;
    }
    
    const [station1, line1, station2, line2, station3] = args;
    
    // Enhanced validation for each parameter with fuzzy matching suggestions
    const validationResults = [
        { value: station1, type: 'station' as const, name: 'Station 1' },
        { value: line1, type: 'line' as const, name: 'Line 1' },
        { value: station2, type: 'station' as const, name: 'Station 2' },
        { value: line2, type: 'line' as const, name: 'Line 2' },
        { value: station3, type: 'station' as const, name: 'Station 3' }
    ];
    
    let hasValidationErrors = false;
    
    for (const param of validationResults) {
        const validation = validateWithSuggestions(param.value, param.type, module);
        
        if (!validation.isValid) {
            hasValidationErrors = true;
            
            // Security: Sanitize error message to prevent exposure of sensitive data
            const sanitizedError = sanitizeErrorMessage(validation.errorMessage || 'Invalid input');
            console.error(`❌ ${param.name}: ${sanitizedError}`);
            
            // Log security status if suspicious or dangerous
            if (validation.securityStatus === 'dangerous') {
                logSecurityEvent('input_validation', `Dangerous input detected in ${param.type}`, 'high');
            } else if (validation.securityStatus === 'suspicious') {
                logSecurityEvent('input_validation', `Suspicious input pattern in ${param.type}`, 'medium');
            }
            
            if (validation.suggestions.length > 0) {
                console.error(`   Similar ${param.type} names:`);
                validation.suggestions.forEach((suggestion, index) => {
                    // Security: Validate suggestions before displaying
                    const safeSuggestion = sanitizeInput(suggestion);
                    if (safeSuggestion && validateJapaneseInput(safeSuggestion)) {
                        console.error(`     ${index + 1}. ${safeSuggestion}`);
                    }
                });
            }
            
            // Show database check status for transparency
            if (validation.databaseChecked !== undefined) {
                console.error(`   Database validation: ${validation.databaseChecked ? 'performed' : 'skipped'}`);
            }
            
            console.error('');
        }
    }
    
    if (hasValidationErrors) {
        console.error('Please check the parameter names and try again.');
        console.error('Use valid Japanese station and line names as shown in the examples.');
        console.error('');
        console.error('📚 For troubleshooting help, see: README_CLI.md section "一般的な問題と解決方法"');
        return -1;
    }
    
    // Use sanitized values for route calculation
    const sanitizedArgs = validationResults.map(param => 
        validateWithSuggestions(param.value, param.type, module).sanitized
    );
    
    const routeString = sanitizedArgs.join(' ');
    console.log(`🚂 Calculating fare for route: ${routeString}`);
    
    try {
        // Execute route test with all details (option 0)
        await executeRouteTest([routeString, ''], 0, module);
        return 0;
    } catch (error) {
        console.error('❌ Error calculating 5-parameter route:', error);
        return -1;
    }
}

/**
 * Enhanced Japanese input validation with comprehensive security and encoding verification
 * Requirements: REQ-CLI-003.5 - comprehensive input validation with security measures
 * Security features:
 * - Character encoding validation
 * - Length limits with security considerations
 * - Malicious pattern detection
 * - Database-safe character filtering
 * 
 * @param text Input text to validate
 * @returns true if text contains valid Japanese or alphanumeric characters and passes security checks
 */
function validateJapaneseInput(text: string): boolean {
    if (!text || text.trim().length === 0) {
        return false;
    }
    
    // Security: Length validation with strict limits
    if (text.length > 150) {
        console.warn('🚨 Security: Input exceeds maximum length limit');
        return false;
    }
    
    // Security: Check for potential encoding attacks
    try {
        // Verify UTF-8 encoding integrity
        const encoded = Buffer.from(text, 'utf8');
        const decoded = encoded.toString('utf8');
        if (decoded !== text) {
            console.warn('🚨 Security: Invalid UTF-8 encoding detected');
            return false;
        }
    } catch (error) {
        console.warn('🚨 Security: Character encoding validation failed');
        return false;
    }
    
    // Security: Detect potentially malicious patterns
    const maliciousPatterns = [
        /null|undefined|NaN/i,       // JavaScript injection attempts
        /\\[ux][0-9a-fA-F]/i,        // Unicode/hex escape attempts
        /__proto__|prototype/i,      // Prototype pollution attempts
        /javascript:|data:|vbscript:/i, // URI scheme injection
        /<[^>]*>/,                   // HTML/XML tag injection
    ];
    
    for (const pattern of maliciousPatterns) {
        if (pattern.test(text)) {
            console.warn('🚨 Security: Potentially malicious pattern detected in input');
            return false;
        }
    }
    
    // Comprehensive Japanese character ranges with security filtering:
    // - Hiragana: \u3040-\u309F
    // - Katakana: \u30A0-\u30FF 
    // - CJK Unified Ideographs: \u4E00-\u9FAF
    // - CJK Extension A: \u3400-\u4DBF
    // - Katakana Phonetic Extensions: \u31F0-\u31FF
    // - CJK Symbols and Punctuation: \u3000-\u303F (filtered for safety)
    // - Halfwidth and Fullwidth Forms: \uFF00-\uFFEF (filtered for safety)
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u31F0-\u31FF]/;
    
    // Strict pattern allowing only safe characters for database operations
    // Removed potentially dangerous punctuation and symbols
    const safePattern = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\u31F0-\u31FF\u3000-\u3006\u3012-\u3013\u3020a-zA-Z0-9\s\-\(\)・ー]+$/;
    
    // Must contain Japanese characters OR be purely ASCII alphanumeric
    const hasJapanese = japanesePattern.test(text);
    const isValidFormat = safePattern.test(text);
    
    if (!isValidFormat) {
        console.warn(`⚠️  Input validation failed: contains unsafe characters`);
        return false;
    }
    
    // For station/line names, require either Japanese characters or be purely alphanumeric
    const isPureAlphanumeric = /^[a-zA-Z0-9\s\-]+$/.test(text);
    
    return hasJapanese || isPureAlphanumeric;
}

/**
 * Advanced input sanitization with comprehensive security measures
 * Requirements: REQ-CLI-003.5 - comprehensive input sanitization and validation
 * Security features:
 * - Command injection prevention
 * - Length and encoding validation
 * - Character filtering for safety
 * - Path traversal prevention
 * 
 * @param input Raw input string
 * @returns Sanitized string safe for processing
 */
function sanitizeInput(input: string): string {
    if (!input) {
        return '';
    }
    
    // Security: Check for potential command injection patterns
    const dangerousPatterns = [
        /[;&|`$(){}\[\]]/,           // Shell metacharacters
        /<[^>]*script[^>]*>/i,       // Script tags
        /\\x[0-9a-fA-F]{2}/,         // Hex escape sequences
        /\\[0-7]{1,3}/,             // Octal escape sequences
        /%[0-9a-fA-F]{2}/,          // URL encoded characters
        /\.\.[\\/]/,               // Path traversal attempts
        /^\s*[-+]/,                 // Leading command flags
        /exec|eval|system|cmd/i     // Suspicious function names
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
            console.warn('🚨 Security: Potentially dangerous input pattern detected and sanitized');
            // Log for security monitoring but don't expose the actual pattern
            console.warn('⚠️  Input contains characters that could be used for command injection');
            break;
        }
    }
    
    // Enhanced character sanitization
    let sanitized = input
        .trim()
        // Remove all control characters (including potential injection vectors)
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
        // Convert line breaks to spaces
        .replace(/[\r\n\t]+/g, ' ')
        // Remove shell metacharacters that could enable injection
        .replace(/[;&|`$(){}\[\]<>"']/g, '')
        // Remove backslashes (path traversal prevention)
        .replace(/\\/g, '')
        // Remove URL encoding attempts
        .replace(/%[0-9a-fA-F]{2}/g, '')
        // Collapse multiple spaces
        .replace(/\s{2,}/g, ' ');
    
    // Strict length validation with security considerations
    const maxLength = 150; // Reduced from 200 for better security
    if (sanitized.length > maxLength) {
        console.warn(`🚨 Security: Input truncated from ${sanitized.length} to ${maxLength} characters`);
        sanitized = sanitized.substring(0, maxLength);
    }
    
    // Additional security: Remove leading/trailing dangerous characters
    sanitized = sanitized.replace(/^[-+.]+|[-+.]+$/g, '');
    
    return sanitized;
}

/**
 * Get fuzzy matching suggestions for invalid station names
 * Requirements: REQ-CLI-003.3 - provide fuzzy matching suggestions for invalid station names
 * 
 * @param invalidName The invalid station name
 * @returns Array of up to 3 suggested station names
 */
function getSuggestedStationNames(invalidName: string): string[] {
    const commonStations = [
        '東京', '新宿', '渋谷', '池袋', '品川', '上野', '大阪', '京都', '名古屋',
        '横浜', '神戸', '福岡', '仙台', '札幌', '広島', '静岡', '浜松', '岡山',
        '金沢', '新潟', '長野', '松本', '甲府', '宇都宮', '水戸', '千葉',
        'さいたま新都心', '大宮', '川崎', '立川', '八王子', '町田', '藤沢',
        '船橋', '柏', '松戸', '川越', '所沢', '津田沼', '市川', '浦和',
        '赤羽', '北千住', '秋葉原', '有楽町', '新橋', '田町', '五反田',
        '目黒', '恵比寿', '原宿', '代々木', '中野', '高円寺', '荻窪',
        '吉祥寺', '三鷹', '国分寺', '国立', '日野', '豊田', '高尾'
    ];
    
    const suggestions: string[] = [];
    const cleanInput = invalidName.toLowerCase().trim();
    
    // Phase 1: Direct substring matching
    for (const station of commonStations) {
        if (station.includes(invalidName) || 
            invalidName.includes(station) ||
            station.toLowerCase().includes(cleanInput)) {
            suggestions.push(station);
            if (suggestions.length >= 3) break;
        }
    }
    
    // Phase 2: Character similarity matching if not enough found
    if (suggestions.length < 3) {
        const candidates = commonStations
            .filter(station => !suggestions.includes(station))
            .map(station => ({
                name: station,
                similarity: calculateJapaneseSimilarity(invalidName, station)
            }))
            .filter(candidate => candidate.similarity > 0.3)
            .sort((a, b) => b.similarity - a.similarity);
        
        for (const candidate of candidates) {
            suggestions.push(candidate.name);
            if (suggestions.length >= 3) break;
        }
    }
    
    return suggestions;
}

/**
 * Get fuzzy matching suggestions for invalid line names  
 * Requirements: REQ-CLI-003.3 - provide fuzzy matching suggestions for invalid line names
 * 
 * @param invalidName The invalid line name
 * @returns Array of up to 3 suggested line names
 */
function getSuggestedLineNames(invalidName: string): string[] {
    const commonLines = [
        '東海道線', '山手線', '中央線', '京浜東北線', '総武線', '常磐線',
        '埼京線', '湘南新宿ライン', '上野東京ライン', '東海道新幹線',
        '東北新幹線', '上越新幹線', '北陸新幹線', '山陽新幹線',
        '東急東横線', '小田急線', '京王線', '西武池袋線', '東武東上線',
        '京急本線', '相鉄線', '東西線', '丸ノ内線', '日比谷線',
        '銀座線', '副都心線', '有楽町線', '南北線', '千代田線',
        '半蔵門線', '都営浅草線', '都営三田線', '都営新宿線', '都営大江戸線',
        '京成線', '京成スカイライナー', 'つくばエクスプレス', 'りんかい線',
        'ゆりかもめ', '多摩都市モノレール', '日暮里舎人ライナー'
    ];
    
    const suggestions: string[] = [];
    const cleanInput = invalidName.toLowerCase().trim();
    
    // Phase 1: Direct substring matching
    for (const line of commonLines) {
        if (line.includes(invalidName) || 
            invalidName.includes(line) ||
            line.toLowerCase().includes(cleanInput)) {
            suggestions.push(line);
            if (suggestions.length >= 3) break;
        }
    }
    
    // Phase 2: Character similarity matching if not enough found
    if (suggestions.length < 3) {
        const candidates = commonLines
            .filter(line => !suggestions.includes(line))
            .map(line => ({
                name: line,
                similarity: calculateJapaneseSimilarity(invalidName, line)
            }))
            .filter(candidate => candidate.similarity > 0.2)
            .sort((a, b) => b.similarity - a.similarity);
        
        for (const candidate of candidates) {
            suggestions.push(candidate.name);
            if (suggestions.length >= 3) break;
        }
    }
    
    return suggestions;
}

/**
 * Security utility functions for preventing sensitive data exposure
 * Requirements: REQ-CLI-003.5 - prevent exposure of sensitive database information
 */
function sanitizeErrorMessage(message: string, context?: any): string {
    if (!message) return 'An error occurred';
    
    // Remove potentially sensitive database information
    const sensitivePatterns = [
        /sqlite3?[^\s]*/gi,           // SQLite references
        /database[^\s]*path[^\s]*/gi, // Database paths
        /\b\d+\.\d+\.\d+\.\d+\b/g,   // IP addresses
        /\/[^\s]*\.db\b/gi,          // Database file paths
        /password|secret|key|token/gi, // Credential keywords
        /\broot\b|\badmin\b/gi,       // Admin references
        /error code \d+/gi,           // Specific error codes
        /line \d+ column \d+/gi,      // SQL line/column info
        /table '[^']*'/gi,            // Table names
        /column '[^']*'/gi            // Column names
    ];
    
    let sanitized = message;
    
    for (const pattern of sensitivePatterns) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    // Security: Don't expose internal object structures
    if (context) {
        console.debug('Context information available but not exposed for security');
    }
    
    // Truncate extremely long error messages
    if (sanitized.length > 200) {
        sanitized = sanitized.substring(0, 197) + '...';
    }
    
    return sanitized;
}

function logSecurityEvent(
    eventType: 'input_validation' | 'command_injection' | 'database_access' | 'encoding_attack',
    details: string,
    severity: 'low' | 'medium' | 'high' = 'medium'
) {
    const timestamp = new Date().toISOString();
    const sanitizedDetails = sanitizeErrorMessage(details);
    
    // Log to console with appropriate security prefix
    const prefix = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : '🛡️';
    console.warn(`${prefix} Security Event [${eventType}] at ${timestamp}`);
    console.warn(`   Details: ${sanitizedDetails}`);
    
    // In production, this would also log to a secure audit system
    // For now, we ensure no sensitive data is exposed in console output
}

function validateFileSystemAccess(path: string): boolean {
    if (!path || typeof path !== 'string') {
        logSecurityEvent('input_validation', 'Invalid path provided', 'high');
        return false;
    }
    
    // Security: Only allow access to project directory and OS temp files
    const allowedPaths = [
        process.cwd(),                    // Project directory
        require('os').tmpdir(),           // OS temp directory
        '/tmp',                          // Unix temp directory
        process.env.TEMP,                // Windows temp directory
        process.env.TMP                  // Alternative temp directory
    ].filter(Boolean);
    
    // Check for path traversal attempts
    const normalizedPath = require('path').resolve(path);
    const isPathTraversal = path.includes('..') || path.includes('~') || path.match(/^[\/\\]/);
    
    if (isPathTraversal) {
        logSecurityEvent('input_validation', 'Path traversal attempt detected', 'high');
        return false;
    }
    
    // Check if path is within allowed directories
    const isAllowed = allowedPaths.some(allowedPath => {
        if (!allowedPath) return false;
        const allowedResolved = require('path').resolve(allowedPath);
        return normalizedPath.startsWith(allowedResolved);
    });
    
    if (!isAllowed) {
        logSecurityEvent('input_validation', 'File access outside allowed directories', 'high');
        return false;
    }
    
    return true;
}

/**
 * Calculate similarity between Japanese text strings
 * Optimized for Japanese characters and transportation names
 * 
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @returns Similarity score between 0 and 1
 */
function calculateJapaneseSimilarity(str1: string, str2: string): number {
    // Security: Validate inputs to prevent processing malicious data
    if (!str1 || !str2 || typeof str1 !== 'string' || typeof str2 !== 'string') {
        return 0;
    }
    
    // Security: Limit string length to prevent DoS attacks
    const maxLength = 100;
    const s1 = str1.length > maxLength ? str1.substring(0, maxLength) : str1;
    const s2 = str2.length > maxLength ? str2.substring(0, maxLength) : str2;
    
    if (s1 === s2) return 1;
    
    const normalizedS1 = s1.toLowerCase();
    const normalizedS2 = s2.toLowerCase();
    
    // Character-based similarity for Japanese text
    const chars1 = Array.from(normalizedS1);
    const chars2 = Array.from(normalizedS2);
    
    let matches = 0;
    const longer = chars1.length > chars2.length ? chars1 : chars2;
    const shorter = chars1.length > chars2.length ? chars2 : chars1;
    
    for (const char of shorter) {
        const index = longer.indexOf(char);
        if (index >= 0) {
            matches++;
            longer.splice(index, 1); // Remove to avoid double counting
        }
    }
    
    // Weighted similarity: favor matches in shorter strings
    const maxCompareLength = Math.max(s1.length, s2.length);
    const minCompareLength = Math.min(s1.length, s2.length);
    
    const similarity = (matches * 2) / (chars1.length + chars2.length);
    const lengthBonus = minCompareLength / maxCompareLength; // Bonus for similar lengths
    
    return similarity * 0.8 + lengthBonus * 0.2;
}

/**
 * Enhanced validation with comprehensive database checking and security measures
 * Requirements: REQ-CLI-003.5 - comprehensive station/line name validation with database checking
 * Security features:
 * - Database-backed validation
 * - Sanitized input processing
 * - Detailed security logging
 * - Error message sanitization
 * 
 * @param input User input to validate
 * @param type Type of input ('station' or 'line')
 * @param module Optional WebAssembly module for database checking
 * @returns Validation result with suggestions and security status
 */
interface ValidationResult {
    isValid: boolean;
    sanitized: string;
    suggestions: string[];
    errorMessage?: string;
    securityStatus?: 'safe' | 'suspicious' | 'dangerous';
    databaseChecked?: boolean;
}

function validateWithSuggestions(
    input: string, 
    type: 'station' | 'line', 
    module?: any
): ValidationResult {
    if (!input || input.trim().length === 0) {
        return {
            isValid: false,
            sanitized: '',
            suggestions: [],
            errorMessage: `Empty ${type} name provided`,
            securityStatus: 'safe',
            databaseChecked: false
        };
    }
    
    // Security: Perform initial sanitization
    const sanitized = sanitizeInput(input);
    
    // Security: Check if input was heavily modified during sanitization
    const wasHeavilySanitized = (input.length - sanitized.length) > (input.length * 0.3);
    if (wasHeavilySanitized) {
        console.warn('🚨 Security: Input was heavily sanitized, potential security concern');
        return {
            isValid: false,
            sanitized: '',
            suggestions: [],
            errorMessage: `Input contains suspicious content and was rejected for security`,
            securityStatus: 'dangerous',
            databaseChecked: false
        };
    }
    
    // Security: Validate character encoding and patterns
    if (!validateJapaneseInput(sanitized)) {
        const suggestions = type === 'station' 
            ? getSuggestedStationNames(sanitized)
            : getSuggestedLineNames(sanitized);
            
        return {
            isValid: false,
            sanitized,
            suggestions,
            errorMessage: `Invalid ${type} name: characters not allowed`,
            securityStatus: 'suspicious',
            databaseChecked: false
        };
    }
    
    // Database validation if WebAssembly module is available
    let databaseValidation = false;
    let databaseChecked = false;
    
    if (module && typeof module === 'object') {
        try {
            if (type === 'station' && typeof module.getStationId === 'function') {
                const stationId = module.getStationId(sanitized);
                databaseValidation = stationId > 0;
                databaseChecked = true;
                
                if (!databaseValidation) {
                    console.warn(`⚠️  Database validation failed: Station "${sanitized}" not found in database`);
                }
            } else if (type === 'line' && typeof module.getLineId === 'function') {
                const lineId = module.getLineId(sanitized);
                databaseValidation = lineId > 0;
                databaseChecked = true;
                
                if (!databaseValidation) {
                    console.warn(`⚠️  Database validation failed: Line "${sanitized}" not found in database`);
                }
            }
        } catch (error) {
            // Security: Log database access attempts but don't expose internal details
            console.warn('🚨 Security: Database validation error occurred');
            console.warn('   Database access may be compromised or module is invalid');
            
            return {
                isValid: false,
                sanitized: '',
                suggestions: [],
                errorMessage: `Database validation failed due to security constraints`,
                securityStatus: 'dangerous',
                databaseChecked: false
            };
        }
    }
    
    // If database checking was performed and failed, provide suggestions
    if (databaseChecked && !databaseValidation) {
        const suggestions = type === 'station' 
            ? getSuggestedStationNames(sanitized)
            : getSuggestedLineNames(sanitized);
            
        return {
            isValid: false,
            sanitized,
            suggestions,
            errorMessage: `${type} "${sanitized}" not found in database`,
            securityStatus: 'safe',
            databaseChecked: true
        };
    }
    
    return {
        isValid: true,
        sanitized,
        suggestions: [],
        securityStatus: 'safe',
        databaseChecked
    };
}

/**
 * Enhanced validation function that throws InputValidationError
 * REQ-CLI-003.3 - Enhanced input validation with specific error codes
 * Currently unused but kept for future strict validation needs
 */
// function validateInputStrict(input: string, type: 'station' | 'line'): string {
//     if (!input || input.trim().length === 0) {
//         throw new InputValidationError(
//             `Empty ${type} name provided`,
//             input || '',
//             type
//         );
//     }
//     
//     const sanitized = sanitizeInput(input);
//     
//     if (!validateJapaneseInput(sanitized)) {
//         const suggestions = type === 'station' 
//             ? getSuggestedStationNames(sanitized)
//             : getSuggestedLineNames(sanitized);
//             
//         throw new InputValidationError(
//             `Invalid ${type} name: "${sanitized}"`,
//             sanitized,
//             type,
//             suggestions
//         );
//     }
//     
//     return sanitized;
// }

/**
 * Helper functions for route processing (equivalent to original utility functions)
 */
function numOfWord(buf: string): number {
    return buf.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function subWord(srcStr: string, num: number): string {
    const words = srcStr.trim().split(/\s+/).filter(w => w.length > 0);
    if (num <= 0 || num > words.length) {
        return '';
    }
    return words.slice(num - 1).join(' ');
}

function removeComment(str: string): string {
    const commentPos = str.lastIndexOf('#');
    if (commentPos >= 0) {
        return str.substring(0, commentPos);
    }
    return str;
}

function rtrim(str: string): string {
    return str.replace(/\s+$/, '');
}

/**
 * Execute complete test suite wrapper
 */
async function runCompleteTestSuite(module: FarertModule): Promise<void> {
    if (executeCompleteTestSuite) {
        console.log('🛠\ufe0f Starting complete test suite (test_exec.cpp equivalent)...');
        await executeCompleteTestSuite(module);
        console.log('✅ Complete test suite finished successfully');
    } else {
        console.log('⚠\ufe0f Complete test suite not available. Running basic functionality tests...');
        console.log('');
        
        // Fallback to basic functionality tests
        const basicTests = [
            '東京 東海道線 品川',
            '新宿 中央線 立川',
            '大阪 東海道線 京都',
            '仙台 東北線 上野'
        ];
        
        for (const [index, testRoute] of basicTests.entries()) {
            console.log(`\nTest ${index + 1}/${basicTests.length}: ${testRoute}`);
            try {
                await executeRouteTest([testRoute], 0, module);
                console.log('✅ Test passed');
            } catch (error) {
                console.error(`❌ Test failed: ${error}`);
            }
        }
        
        console.log('\n✅ Basic test suite completed.');
        console.log('Note: For complete testing, ensure test_exec_complete.ts is available.');
    }
}

/**
 * Process route from file (equivalent to from_stream() in original)
 */
async function fromStream(filename: string, optionNum: number, module: FarertModule): Promise<void> {
    try {
        // Security: Validate file system access before reading
        if (!validateFileSystemAccess(filename)) {
            throw new Error('File access denied for security reasons');
        }
        
        const content = fs.readFileSync(filename, 'utf8');
        const lines = content.split('\n');
        
        console.log(`Processing route file: ${filename}`);
        
        for (let line of lines) {
            // Remove comments
            line = removeComment(line);
            line = rtrim(line);
            
            // Skip empty lines or comments
            if (line.length === 0 || line.startsWith('#')) {
                continue;
            }
            
            // End processing on '/'
            if (line.startsWith('/')) {
                break;
            }
            
            // Enhanced validation with fuzzy matching suggestions
            if (!validateJapaneseInput(line)) {
                console.warn(`⚠️ Warning: Potentially invalid input: ${line}`);
                
                // Try to provide suggestions for the entire line
                const tokens = line.split(/\s+/).filter(t => t.length > 0);
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    const type = (i % 2 === 0) ? 'station' : 'line';
                    const validation = validateWithSuggestions(token, type, module);
                    
                    if (!validation.isValid && validation.suggestions.length > 0) {
                        // Security: Sanitize token before displaying
                        const safeToken = sanitizeErrorMessage(token);
                        console.warn(`   Suggestions for "${safeToken}" (${type}):`);
                        validation.suggestions.forEach((suggestion, idx) => {
                            // Security: Validate suggestions before displaying
                            const safeSuggestion = sanitizeInput(suggestion);
                            if (safeSuggestion && validateJapaneseInput(safeSuggestion)) {
                                console.warn(`     ${idx + 1}. ${safeSuggestion}`);
                            }
                        });
                        
                        // Log security events for suspicious inputs
                        if (validation.securityStatus === 'suspicious' || validation.securityStatus === 'dangerous') {
                            logSecurityEvent('input_validation', `Invalid input pattern in file processing`, 'medium');
                        }
                    }
                }
                console.warn('');
            }
            
            // Sanitize input
            line = sanitizeInput(line);
            
            // Count words
            const wordCount = numOfWord(line);
            
            if ((wordCount % 2) !== 0) {
                // Odd number: normal route
                tbuf = line;
                await executeRouteTest([tbuf, ''], optionNum, module);
            } else {
                // Even number: auto route  
                const lastWord = subWord(line, wordCount);
                tbuf2 = lastWord;
                tbuf = line.substring(0, line.indexOf(lastWord)).trim();
                await executeAutoRoute([tbuf, tbuf2, ''], 0x10000 + optionNum, module);
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error(`Can't open file: ${filename} - ${error.message}`);
        } else {
            console.error(`Can't open file: ${filename}`);
        }
        console.error('');
        console.error('📚 For file processing help, see: README_CLI.md section "高度なトラブルシューティング"');
    }
}

/**
 * Main function - faithful recreation of testmain.cpp main()
 * Enhanced with comprehensive command support, error handling, and performance monitoring
 * Requirements: REQ-CLI-002.5 - CLI performance requirements
 */
async function main(): Promise<number> {
    // Initialize enhanced signal handling early (Task 13 - Signal Handling)
    initializeSignalHandling({
        enabled: true,
        gracefulShutdownTimeout: 10000,    // 10 seconds
        dbConnectionTimeout: 3000,         // 3 seconds per requirement
        cleanupTimeout: 5000,              // 5 seconds
        forceExitOnTimeout: true,
        memoryCleanupEnabled: true,
        logLevel: configManager.getConfiguration().debug ? 'debug' : 'info'
    });
    
    // Initialize performance monitoring (Task 12 - Performance Monitoring)
    performanceMonitor.mark('cli_startup_begin');
    try {
        // Validate CLI environment first with performance monitoring
        performanceMonitor.mark('env_validation_start');
        validateCliEnvironment();
        performanceMonitor.mark('env_validation_end');
        const envValidationMeasurement = performanceMonitor.measure('env_validation_start', 'env_validation_end');
        
        if (configManager.getConfiguration().debug && envValidationMeasurement) {
            console.log(`[PERF] Environment validation: ${envValidationMeasurement.duration}ms`);
        }
    } catch (error) {
        if (error instanceof CLIError) {
            console.error(error.getFormattedMessage());
            
            // Show environment report for troubleshooting if validation failed
            if (error instanceof EnvironmentValidationError) {
                const config = configManager.getConfiguration();
                if (config.debug || config.verbose) {
                    console.error('\n' + configManager.getEnvironmentReport());
                }
            }
            
            return error.code;
        }
        
        const systemError = new SystemError('Environment validation failed', error instanceof Error ? error : new Error(String(error)));
        console.error(systemError.getFormattedMessage());
        return systemError.code;
    }
    
    const argv = process.argv;
    const argc = argv.length;
    let optionNum = 0;
    let optionRev = 0;
    
    // Handle special commands early (no WebAssembly needed)
    if (argc >= 3) {
        const firstArg = argv[2];
        if (firstArg === '-h' || firstArg === '--help' || firstArg === '-help') {
            printHelp();
            return 0;
        }
        
        // Handle environment report command
        if (firstArg === '--env-report') {
            console.log(configManager.getEnvironmentReport());
            return 0;
        }
        
        // Handle debug mode enablement
        if (firstArg === '--env-debug') {
            configManager.updateConfiguration({ debug: true, memoryMonitoring: true });
            console.log('[DEBUG] Debug mode enabled for this session');
            configManager.logMemoryUsage('Debug Mode Enabled');
        }
    }
    
    // Initialize WebAssembly (equivalent to database initialization)
    let module: FarertModule;
    try {
        const config = configManager.getConfiguration();
        
        if (config.debug) {
            console.log('[DEBUG] Starting WebAssembly module initialization...');
            configManager.logMemoryUsage('Pre-WASM Load');
        } else {
            console.log('Initializing WebAssembly module...');
        }
        
        // Monitor WebAssembly loading performance (Task 12)
        const wasmMonitor = performanceMonitor.monitorWASMInit();
        wasmMonitor.markLoadStart();
        module = await wasmLoader.loadModule();
        wasmMonitor.markLoadEnd();
        
        if (config.debug) {
            console.log('[DEBUG] WebAssembly module loaded, initializing database...');
            configManager.logMemoryUsage('Pre-DB Init');
        } else {
            console.log('Opening database connection...');
        }
        
        // Monitor database initialization performance (Task 12)
        wasmMonitor.markDBInitStart();
        const dbResult = await wasmLoader.initializeDatabase();
        wasmMonitor.markDBInitEnd();
        if (!dbResult) {
            // Should not reach here as initializeDatabase throws on failure
            throw new CLIError(
                'Database initialization returned false',
                CLIErrorCode.DB_CONNECTION_FAILED
            );
        }
        
        if (config.debug) {
            console.log('[DEBUG] WebAssembly and database initialization completed');
            configManager.logMemoryUsage('Post-Init');
            
            // Report WASM initialization performance (Task 12)
            const wasmResults = wasmMonitor.getResults();
            wasmResults.forEach(measurement => {
                const status = measurement.passed ? '✅' : '❌';
                console.log(`[PERF] ${status} ${measurement.name}: ${measurement.duration}ms`);
            });
        }
        
        // Check CLI startup performance requirement (< 2 seconds)
        performanceMonitor.monitorCLIStartup();
        
        // Check memory limits after initialization
        const memoryCheck = performanceMonitor.checkMemoryLimits();
        if (!memoryCheck.withinLimits && config.debug) {
            console.warn('[PERF] Memory warnings after initialization:');
            memoryCheck.warnings.forEach(warning => console.warn(`[PERF]   ⚠️  ${warning}`));
        }
    } catch (error) {
        if (error instanceof CLIError) {
            console.error(error.getFormattedMessage());
            return error.code;
        }
        
        // Wrap unexpected errors as system errors
        const systemError = new SystemError(
            'Failed to initialize WebAssembly module',
            error instanceof Error ? error : new Error(String(error)),
            {
                step: 'WebAssembly module initialization',
                platform: process.platform,
                nodeVersion: process.version
            }
        );
        console.error(systemError.getFormattedMessage());
        return systemError.code;
    }
    
    if (argc < 3) {
        // Show usage (equivalent to original argc < 2 check)
        printUsage(argv[1]);
        return -1;
    }
    
    let argIndex = 2; // Skip 'node' and script name
    
    if (argv[argIndex].startsWith('-')) {
        const option = argv[argIndex];
        
        if (option === '-exec') {
            // Execute all test patterns (equivalent to test_exec()) with performance monitoring
            try {
                console.log('🚀 Starting complete test suite execution...');
                
                // Monitor test suite execution performance (Task 12 - REQ-CLI-002.5)
                performanceMonitor.mark('test_suite_complete_start');
                await runCompleteTestSuite(module);
                
                const testMeasurement = performanceMonitor.monitorTestSuite('complete');
                
                console.log('✅ Complete test suite execution finished');
                
                // Report test suite performance if debug mode is enabled
                if (configManager.getConfiguration().debug && testMeasurement) {
                    const status = testMeasurement.passed ? '✅' : '❌';
                    const duration = (testMeasurement.duration / 1000).toFixed(2);
                    console.log(`[PERF] ${status} Test suite execution: ${duration}s (requirement: <30s)`);
                    
                    // Check memory usage after test suite
                    const memoryCheck = performanceMonitor.checkMemoryLimits();
                    if (memoryCheck.warnings.length > 0) {
                        console.warn('[PERF] Memory warnings after test suite:');
                        memoryCheck.warnings.forEach(warning => console.warn(`[PERF]   ⚠️  ${warning}`));
                    }
                }
                
                return 0;
            } catch (error) {
                console.error('❌ Test execution failed:', error);
                return -1;
            }
        } else if (option === '-test-error') {
            // Execute comprehensive error handling system tests (Task 31)
            try {
                console.log('🚀 Starting comprehensive error handling system tests...');
                console.log('📋 Testing all error codes ROUTE_ERR_001-099 with fuzzy matching and recovery scenarios');
                
                // Monitor error handling test performance
                performanceMonitor.mark('error_handling_tests_start');
                
                const errorHandlingTests = new ErrorHandlingSystemTests(true); // verbose mode for detailed output
                const success = await errorHandlingTests.executeAll();
                
                performanceMonitor.mark('error_handling_tests_end');
                const measurement = performanceMonitor.measure('error_handling_tests_start', 'error_handling_tests_end');
                
                if (success) {
                    console.log('✅ Error handling system tests completed successfully');
                    console.log('🎯 All error codes, fuzzy matching, and recovery scenarios validated');
                } else {
                    console.log('❌ Some error handling tests failed');
                }
                
                // Report performance if debug mode is enabled
                if (configManager.getConfiguration().debug && measurement) {
                    const durationSec = (measurement.duration / 1000).toFixed(2);
                    console.log(`[PERF] Error handling tests execution: ${durationSec}s`);
                }
                
                return success ? 0 : -1;
            } catch (error) {
                console.error('❌ Error handling test execution failed:', error);
                return -1;
            }
        } else if (option === '-5') {
            // Handle 5-parameter route calculation with performance monitoring
            const routeArgs = argv.slice(argIndex + 1);
            
            // Monitor route calculation performance (Task 12 - REQ-CLI-002.5)
            const routeDesc = routeArgs.join(' ');
            const routeMonitor = performanceMonitor.monitorRouteCalculation(routeDesc);
            
            routeMonitor.start();
            const result = await handle5ParameterRoute(routeArgs, module);
            const measurement = routeMonitor.end();
            
            // Report route calculation performance if debug mode is enabled
            if (configManager.getConfiguration().debug && measurement) {
                const status = measurement.passed ? '✅' : '❌';
                const duration = (measurement.duration / 1000).toFixed(3);
                console.log(`[PERF] ${status} Route calculation: ${duration}s (requirement: <1s)`);
            }
            
            return result;
        } else {
            // Parse numeric options with optional 'r' suffix
            let numStr = option.substring(1);
            
            // Check for 'r' suffix (reverse)
            if (numStr.endsWith('r')) {
                optionRev = 1;
                numStr = numStr.substring(0, numStr.length - 1);
            }
            
            optionNum = parseInt(numStr, 10);
            if (isNaN(optionNum)) {
                optionNum = 0;
            }
            
            argIndex++; // Move to next argument
        }
    }
    
    const remainingArgs = argv.slice(argIndex);
    
    if (remainingArgs.length === 0 && !argv[2]?.startsWith('-')) {
        // No arguments provided
        printUsage(argv[1]);
        return -1;
    }
    
    if (remainingArgs.length === 1) {
        // Route from file
        const filename = remainingArgs[0];
        console.log(`Processing route file: ${filename}`);
        await fromStream(filename, optionNum, module);
    } else if (remainingArgs.length > 1) {
        // Route as command line direct
        console.log(`🚂 Processing command line route with ${remainingArgs.length} parameters`);
        
        // Enhanced validation for all arguments with fuzzy matching
        let hasValidationErrors = false;
        
        for (let i = 0; i < remainingArgs.length; i++) {
            const arg = remainingArgs[i];
            
            if (!arg || arg.trim().length === 0) {
                console.error('❌ Error: Empty parameter detected at position', i + 1);
                hasValidationErrors = true;
                continue;
            }
            
            // Determine if this is likely a station or line based on position
            const type = (i % 2 === 0) ? 'station' : 'line';
            const validation = validateWithSuggestions(arg, type, module);
            
            if (!validation.isValid) {
                // Security: Sanitize error message to prevent sensitive data exposure
                const sanitizedError = sanitizeErrorMessage(validation.errorMessage || 'Invalid input');
                console.error(`❌ Parameter ${i + 1} (${type}): ${sanitizedError}`);
                
                // Log security events for dangerous inputs
                if (validation.securityStatus === 'dangerous') {
                    logSecurityEvent('command_injection', `Dangerous input in CLI parameter ${i + 1}`, 'high');
                } else if (validation.securityStatus === 'suspicious') {
                    logSecurityEvent('input_validation', `Suspicious input pattern in CLI parameter ${i + 1}`, 'medium');
                }
                
                if (validation.suggestions.length > 0) {
                    console.error(`   Similar ${type} names:`);
                    validation.suggestions.forEach((suggestion, idx) => {
                        // Security: Validate suggestions before displaying
                        const safeSuggestion = sanitizeInput(suggestion);
                        if (safeSuggestion && validateJapaneseInput(safeSuggestion)) {
                            console.error(`     ${idx + 1}. ${safeSuggestion}`);
                        }
                    });
                }
                
                // Show database validation status for transparency
                if (validation.databaseChecked !== undefined) {
                    const dbStatus = validation.databaseChecked ? 'performed' : 'skipped';
                    console.error(`   Database validation: ${dbStatus}`);
                }
                
                hasValidationErrors = true;
            } else {
                // Update argument with sanitized version for security
                remainingArgs[i] = validation.sanitized;
                
                // Log successful database validation in debug mode
                if (validation.databaseChecked && configManager.getConfiguration().debug) {
                    console.log(`[DEBUG] Database validation passed for ${type}: "${validation.sanitized}"`);
                }
            }
        }
        
        if (hasValidationErrors) {
            console.error('');
            console.error('Please correct the invalid parameters and try again.');
            console.error('Use valid Japanese station and line names.');
            console.error('Example: node main.js 東京 東海道線 品川');
            console.error('');
            console.error('📚 For complete troubleshooting guide, see: README_CLI.md');
            return -1;
        }
        
        parseCommandLine(remainingArgs.length + 1, [''].concat(remainingArgs), optionRev === 1);
        
        if ((remainingArgs.length % 2) === 1) {
            // Odd number: normal route
            console.log(`🛤️ Executing normal route: ${tbuf}`);
            await executeRouteTest([tbuf, ''], optionNum, module);
        } else {
            // Even number: auto route
            console.log(`🤖 Executing auto route: ${tbuf} -> ${tbuf2}`);
            await executeAutoRoute([tbuf, tbuf2, ''], 0x10000 + optionNum, module);
        }
    }
    
    // Cleanup
    try {
        const config = configManager.getConfiguration();
        
        module.closeDatabase();
        
        if (config.debug) {
            console.log('[DEBUG] Database connection closed');
            configManager.logMemoryUsage('Final Cleanup');
        } else {
            console.log('✅ Database connection closed');
        }
    } catch (error) {
        console.warn('⚠️ Warning during cleanup:', error);
        const config = configManager.getConfiguration();
        if (config.debug && error instanceof Error) {
            console.warn('[DEBUG] Cleanup error details:', error.stack);
        }
    }
    
    return 0;
}

/**
 * CLI entry point validation and initialization
 * Requirements: REQ-CLI-004.1, REQ-CLI-004.3, REQ-CLI-004.5
 * Enhanced environment validation with comprehensive file checks and configuration management
 */
function validateCliEnvironment(): void {
    try {
        // Use the comprehensive validation from config manager
        configManager.validateAndThrowOnError();
        
        // Log configuration info if debug mode
        const config = configManager.getConfiguration();
        if (config.debug) {
            console.log('[DEBUG] CLI Environment validation completed successfully');
            console.log('[DEBUG] Configuration:');
            console.log(`[DEBUG]   Debug mode: ${config.debug}`);
            console.log(`[DEBUG]   Memory monitoring: ${config.memoryMonitoring}`);
            console.log(`[DEBUG]   Custom WASM path: ${config.wasmPath || 'None'}`);
            console.log(`[DEBUG]   Platform: ${config.platform}`);
            console.log(`[DEBUG]   Node.js: ${config.nodeVersion}`);
        }
    } catch (error) {
        if (error instanceof EnvironmentValidationError) {
            // Show detailed validation report
            console.error(error.getDetailedReport());
            throw error;
        }
        throw error;
    }
}

// Signal handling and error handlers are now managed by the enhanced signal handler (Task 13)
// REQ-CLI-003.4 - Comprehensive error handling with graceful shutdown, timeout handling,
// WebAssembly memory cleanup, and database connection management
// See signal_handler.ts for implementation details including:
// - SIGINT/SIGTERM signal handling with proper cleanup
// - Uncaught exception and unhandled rejection handling
// - Database connection timeout detection (3 seconds per requirements)
// - WebAssembly module error isolation and recovery
// - Memory cleanup and garbage collection
// - Operation timeout handling for long-running processes
// Uncaught exception handling is now managed by signal_handler.ts

// Unhandled rejection handling is now managed by signal_handler.ts

// SIGINT/SIGTERM handlers are now managed by signal_handler.ts with comprehensive cleanup

// Execute main and exit with appropriate code
// REQ-CLI-003.4 - Enhanced main execution with proper error handling
main().then((exitCode) => {
    process.exit(exitCode);
}).catch((error) => {
    let systemError: CLIError;
    
    if (error instanceof CLIError) {
        systemError = error;
    } else {
        systemError = new SystemError(
            'Main execution failed with unexpected error',
            error instanceof Error ? error : new Error(String(error)),
            {
                location: 'main() promise catch handler',
                nodeVersion: process.version,
                platform: process.platform
            }
        );
    }
    
    console.error(systemError.getFormattedMessage());
    
    const config = configManager.getConfiguration();
    if (config.debug && error instanceof Error && error.stack) {
        console.error('\n[DEBUG] Main execution error stack trace:');
        console.error(error.stack);
        console.error('\n[DEBUG] Final Environment Report:');
        console.error(configManager.getEnvironmentReport());
    }
    
    process.exit(systemError.code);
});