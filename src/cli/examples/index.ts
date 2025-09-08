#!/usr/bin/env node

/**
 * WASM Object Classes Usage Examples - Comprehensive Index
 * 
 * This is the main entry point for all object class usage examples.
 * It provides a unified interface to run individual examples or complete demonstration suites.
 * 
 * Requirements: REQ-OBJ-008 - Developer experience and documentation enhancements
 * 
 * Example Categories:
 * 1. Basic Object Classes - Fundamental usage patterns for cRouteList, cRoute, cCalcRoute
 * 2. RouteItem & FareInfo - Detailed segment analysis and fare information
 * 3. RouteFlag Examples - Advanced routing flags and special rules
 * 4. Realistic Scenarios - Real-world Japanese railway route examples
 * 5. Troubleshooting - Error handling and performance optimization
 * 6. Framework Integration - React, Vue, Svelte, and TypeScript patterns
 * 
 * Usage:
 *   node examples/index.js                    # Run all examples
 *   node examples/index.js basic              # Run basic object class examples
 *   node examples/index.js realistic          # Run realistic scenario examples
 *   node examples/index.js troubleshooting    # Run troubleshooting examples
 *   node examples/index.js frameworks         # Show framework integration patterns
 *   node examples/index.js --help             # Show detailed help
 */

import { wasmLoader } from '../wasm_loader';
import { FarertModule } from '../types';

// Import all example modules
import { runBasicObjectClassExamples } from './basic-object-classes';
import { runRouteItemFareInfoExamples } from './route-item-fareinfo-examples';
import { runRouteFlagExamples } from './route-flag-examples';
import { runRealisticScenarios } from './realistic-scenarios';
import { runTroubleshootingExamples } from './troubleshooting-examples';
import { runFrameworkIntegrationExamples } from './framework-integration';

/**
 * Available example categories with descriptions
 */
const EXAMPLE_CATEGORIES = {
    'all': {
        name: 'All Examples',
        description: 'Run complete demonstration suite covering all object classes and usage patterns',
        runner: runAllExamples
    },
    'basic': {
        name: 'Basic Object Classes',
        description: 'Fundamental usage patterns for cRouteList, cRoute, and cCalcRoute',
        runner: runBasicObjectClassExamples
    },
    'routeitem': {
        name: 'RouteItem & FareInfo',  
        description: 'Detailed route segment analysis and comprehensive fare information',
        runner: runRouteItemFareInfoExamples
    },
    'flags': {
        name: 'RouteFlag Examples',
        description: 'Advanced routing flags, special rules, and calculation customization',
        runner: runRouteFlagExamples
    },
    'realistic': {
        name: 'Realistic Scenarios',
        description: 'Real-world Japanese railway routes for commuting, business, and tourism',
        runner: runRealisticScenarios
    },
    'troubleshooting': {
        name: 'Troubleshooting',
        description: 'Error handling, performance optimization, and debugging techniques',
        runner: runTroubleshootingExamples
    },
    'frameworks': {
        name: 'Framework Integration',
        description: 'React, Vue, Svelte, and TypeScript integration patterns (code examples)',
        runner: runFrameworkIntegrationExamples
    }
} as const;

/**
 * Display comprehensive help information
 */
function displayHelp(): void {
    console.log('🚀 WASM Object Classes - Usage Examples\n');
    console.log('Complete demonstration suite for Japanese railway fare calculation object classes\n');
    
    console.log('📋 USAGE:');
    console.log('  node examples/index.js [CATEGORY] [OPTIONS]\n');
    
    console.log('📚 AVAILABLE CATEGORIES:\n');
    
    Object.entries(EXAMPLE_CATEGORIES).forEach(([key, category]) => {
        console.log(`  ${key.padEnd(15)} ${category.name}`);
        console.log(`  ${' '.repeat(15)} ${category.description}\n`);
    });
    
    console.log('🔧 OPTIONS:');
    console.log('  --help, -h    Show this help message');
    console.log('  --quiet, -q   Suppress verbose output (not implemented in examples)');
    console.log('  --debug, -d   Enable debug mode with detailed logging\n');
    
    console.log('💡 EXAMPLES:');
    console.log('  node examples/index.js                    # Run all examples');
    console.log('  node examples/index.js basic              # Basic object class usage');  
    console.log('  node examples/index.js realistic          # Real-world scenarios');
    console.log('  node examples/index.js troubleshooting    # Error handling patterns');
    console.log('  node examples/index.js frameworks         # Framework integration');
    console.log('');
    
    console.log('🎯 OBJECT CLASSES COVERED:');
    console.log('  • cRouteList    - Base route container with array operations');
    console.log('  • cRoute        - Route construction and manipulation (extends cRouteList)');
    console.log('  • cCalcRoute    - Fare calculation with special rules (extends cRoute)');
    console.log('  • cRouteItem    - Individual route segment data and operations');
    console.log('  • cRouteFlag    - Route flags and special calculation conditions');
    console.log('  • FareInfo      - Comprehensive fare results and discount information\n');
    
    console.log('🏗️  INHERITANCE HIERARCHY:');
    console.log('  cCalcRoute < cRoute < cRouteList\n');
    
    console.log('🌐 FRAMEWORK SUPPORT:');
    console.log('  • React        - Custom hooks, context providers, components');
    console.log('  • Vue 3        - Composition API, reactive stores, components');
    console.log('  • Svelte       - Stores, reactive statements, components');
    console.log('  • TypeScript   - Framework-agnostic service patterns\n');
    
    console.log('📖 For detailed implementation guides, see individual example files in src/cli/examples/');
}

/**
 * Run all example categories in sequence
 */
async function runAllExamples(): Promise<void> {
    console.log('🚀 Running Complete WASM Object Classes Example Suite\n');
    console.log('This will demonstrate all object classes with comprehensive usage patterns\n');
    
    const categories = Object.entries(EXAMPLE_CATEGORIES).filter(([key]) => key !== 'all');
    
    for (const [index, [key, category]] of categories.entries()) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎯 EXAMPLE CATEGORY ${index + 1}/${categories.length}: ${category.name.toUpperCase()}`);
        console.log(`📋 ${category.description}`);
        console.log(`${'='.repeat(80)}\n`);
        
        try {
            await category.runner();
            console.log(`✅ ${category.name} examples completed successfully\n`);
        } catch (error) {
            console.error(`❌ ${category.name} examples failed:`, error);
            console.error('Continuing with remaining examples...\n');
        }
        
        // Add pause between categories for better readability
        if (index < categories.length - 1) {
            console.log('⏳ Pausing 2 seconds before next category...\n');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('🎉 COMPLETE EXAMPLE SUITE FINISHED');
    console.log(`${'='.repeat(80)}\n`);
    
    console.log('📚 SUMMARY OF DEMONSTRATED CONCEPTS:');
    console.log('   ✅ Object class inheritance and polymorphism');
    console.log('   ✅ Japanese railway fare calculation algorithms');
    console.log('   ✅ Route construction and manipulation');
    console.log('   ✅ Error handling and input validation');
    console.log('   ✅ Performance optimization techniques');
    console.log('   ✅ Framework integration patterns');
    console.log('   ✅ Real-world usage scenarios');
    console.log('');
    
    console.log('🎯 NEXT STEPS FOR DEVELOPERS:');
    console.log('   1. Choose relevant examples for your use case');
    console.log('   2. Copy and adapt code patterns to your project');
    console.log('   3. Implement proper error handling and validation');
    console.log('   4. Consider caching strategies for frequently used routes');
    console.log('   5. Test with real Japanese station and line names');
    console.log('   6. Monitor performance and memory usage in production');
    console.log('');
    
    console.log('📖 For implementation details, see individual example files:');
    console.log('   • basic-object-classes.ts - Core object usage patterns');  
    console.log('   • route-item-fareinfo-examples.ts - Detailed segment analysis');
    console.log('   • route-flag-examples.ts - Advanced routing configuration');
    console.log('   • realistic-scenarios.ts - Real-world Japanese railway examples');
    console.log('   • troubleshooting-examples.ts - Error handling and optimization');
    console.log('   • framework-integration.ts - Modern web framework patterns');
}

/**
 * Display quick start guide
 */
function displayQuickStart(): void {
    console.log('🚀 WASM Object Classes - Quick Start Guide\n');
    
    console.log('1️⃣  INITIALIZE THE MODULE:');
    console.log(`
import { wasmLoader } from './wasm_loader';
import { FarertModule, CalcRouteWrapper } from './types';

async function initialize() {
  const module = await wasmLoader.loadModule();
  await wasmLoader.initializeDatabase();
  return module;
}`);
    
    console.log('\n2️⃣  BASIC FARE CALCULATION:');
    console.log(`
async function calculateFare(module: FarertModule) {
  const calcRoute = new module.cCalcRoute();
  calcRoute.setupRoute('東京 東海道線 品川');
  const fareInfo = calcRoute.calcFare();
  console.log(\`Fare: ¥\${fareInfo.fare}\`);
}`);
    
    console.log('\n3️⃣  MANUAL ROUTE CONSTRUCTION:');  
    console.log(`
async function buildRouteManually(module: FarertModule) {
  const calcRoute = new module.cCalcRoute();
  
  const tokyoId = module.getStationId('東京');
  const shinagawaId = module.getStationId('品川');
  const tokaidoLineId = module.getLineId('東海道線');
  
  calcRoute.addRoute(tokyoId);
  calcRoute.addRouteWithLine(tokaidoLineId, shinagawaId);
  
  const fareInfo = calcRoute.calcFare();
  return fareInfo;
}`);
    
    console.log('\n4️⃣  ERROR HANDLING:');
    console.log(`
try {
  const calcRoute = new module.cCalcRoute();
  calcRoute.setupRoute('Invalid Station Name');
  const fareInfo = calcRoute.calcFare();
} catch (error) {
  console.error('Route calculation failed:', error);
  // Provide user-friendly error message
  // Suggest alternative station names
}`);
    
    console.log('\n5️⃣  CLEANUP:');
    console.log(`
// Always close database connection when done
module.closeDatabase();
`);
    
    console.log('📚 For complete examples, run: node examples/index.js basic');
}

/**
 * Parse command line arguments
 */
function parseArguments(): { category: string; options: Record<string, boolean> } {
    const args = process.argv.slice(2);
    
    const options: Record<string, boolean> = {
        help: false,
        quiet: false,
        debug: false
    };
    
    let category = 'all';
    
    for (const arg of args) {
        if (arg === '--help' || arg === '-h') {
            options.help = true;
        } else if (arg === '--quiet' || arg === '-q') {
            options.quiet = true;
        } else if (arg === '--debug' || arg === '-d') {
            options.debug = true;
        } else if (arg === '--quick-start') {
            category = 'quick-start';
        } else if (!arg.startsWith('-')) {
            category = arg.toLowerCase();
        }
    }
    
    return { category, options };
}

/**
 * Validate example category
 */
function validateCategory(category: string): boolean {
    return category === 'quick-start' || category in EXAMPLE_CATEGORIES;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
    const { category, options } = parseArguments();
    
    // Handle help
    if (options.help) {
        displayHelp();
        return;
    }
    
    // Handle quick start
    if (category === 'quick-start') {
        displayQuickStart();
        return;
    }
    
    // Validate category
    if (!validateCategory(category)) {
        console.error(`❌ Invalid example category: ${category}\n`);
        console.error('Valid categories:');
        Object.keys(EXAMPLE_CATEGORIES).forEach(key => {
            console.error(`  • ${key}`);
        });
        console.error('\nUse --help for detailed information');
        process.exit(1);
    }
    
    // Run examples
    try {
        const selectedCategory = EXAMPLE_CATEGORIES[category as keyof typeof EXAMPLE_CATEGORIES];
        
        console.log(`🎯 Starting: ${selectedCategory.name}`);
        console.log(`📋 ${selectedCategory.description}\n`);
        
        await selectedCategory.runner();
        
        console.log(`\n✅ ${selectedCategory.name} examples completed successfully!`);
        
    } catch (error) {
        console.error('\n❌ Example execution failed:', error);
        
        if (error instanceof Error && error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        
        console.error('\n🔧 Troubleshooting tips:');
        console.error('   • Ensure WebAssembly module is built: npm run build');
        console.error('   • Check that jrdbnewest.db exists in data/ directory');
        console.error('   • Verify Node.js version is 14.0.0 or higher');
        console.error('   • Try running: npm install && npm run build');
        console.error('   • For detailed debugging: run examples/troubleshooting-examples.ts');
        
        process.exit(1);
    }
}

// Handle uncaught errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled promise rejection:', reason);
    console.error('Promise:', promise);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
});

// Execute main function if this file is run directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Fatal error in main:', error);
        process.exit(1);
    });
}

// Export for use as a module
export {
    EXAMPLE_CATEGORIES,
    runAllExamples,
    displayHelp,
    displayQuickStart,
    main as runExamples
};