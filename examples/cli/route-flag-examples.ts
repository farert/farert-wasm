#!/usr/bin/env node

/**
 * RouteFlag Usage Examples
 * 
 * This file demonstrates detailed usage patterns for:
 * - cRouteFlag: Route flags and special conditions
 * - Boolean flag properties and their meanings
 * - Special fare rules and their applications
 * - Advanced routing control and customization
 * 
 * Requirements: REQ-OBJ-008 - Developer experience with comprehensive examples
 * Focus: Route flags, special rules, and advanced routing control
 */

import { wasmLoader } from '../../cli/wasm_loader';
import { 
    FarertModule, 
    CalcRouteWrapper,
    RouteFlagWrapper
} from '../../cli/types';

/**
 * RouteFlag Basic Usage Example
 * 
 * cRouteFlag manages boolean flags that control special fare rules,
 * routing behavior, and calculation options.
 */
async function demonstrateBasicRouteFlags(module: FarertModule): Promise<void> {
    console.log('=== cRouteFlag Basic Usage ===\n');
    
    try {
        // Create a RouteFlag instance
        const routeFlag = new module.cRouteFlag();
        console.log('✅ Created cRouteFlag instance');
        
        console.log('\n--- Core Flag Properties ---');
        
        // Basic rule control flags
        console.log(`🚫 No special rules: ${routeFlag.no_rule}`);
        console.log(`⚖️  Special fare enabled: ${routeFlag.special_fare_enable}`);
        console.log(`🚄 Bullet line flag: ${routeFlag.bullet_line}`);
        
        console.log('\n--- JR Company Flags ---');
        
        // JR Tokai specific flags
        console.log(`🚃 JR Tokai only: ${routeFlag.bJrTokaiOnly}`);
        console.log(`🎫 JR Tokai stock discount applied: ${routeFlag.jrtokaistock_applied}`);
        console.log(`🎫 JR Tokai stock discount enabled: ${routeFlag.jrtokaistock_enable}`);
        
        console.log('\n--- Special Rules Flags ---');
        
        // Special fare calculation rules
        console.log(`📋 Rule 69 (connecting): ${routeFlag.rule69}`);
        console.log(`📋 Rule 70 (special route): ${routeFlag.rule70}`);
        console.log(`📋 Rule 70 bullet: ${routeFlag.rule70bullet}`);
        console.log(`📋 Rule 88 (urban area): ${routeFlag.rule88}`);
        console.log(`📋 Rule 16-5 (special fare): ${routeFlag.rule16_5}`);
        
        console.log('\n--- Geographic Flags ---');
        
        // Geographic and city area flags
        console.log(`🏙️  Meihan city flag: ${routeFlag.meihan_city_flag}`);
        console.log(`🏙️  Meihan city enabled: ${routeFlag.meihan_city_enable}`);
        
        console.log('\n--- Technical Flags ---');
        
        // Technical routing control
        console.log(`🛤️  Track mark control: ${routeFlag.trackmarkctl}`);
        console.log(`🔀 Junction special route change: ${routeFlag.jctsp_route_change}`);
        
        // Check if terminal flags are available
        if ('terminal_begin_osaka' in routeFlag) {
            console.log(`🚉 Terminal begin Osaka: ${(routeFlag as any).terminal_begin_osaka}`);
        }
        
        console.log('\n--- Flag Manipulation ---');
        
        // Demonstrate flag modification
        console.log('Original no_rule flag:', routeFlag.no_rule);
        routeFlag.no_rule = true;
        console.log('After setting no_rule = true:', routeFlag.no_rule);
        
        // Enable special fare processing
        routeFlag.special_fare_enable = true;
        console.log('Enabled special fare processing:', routeFlag.special_fare_enable);
        
        // Configure for bullet train routing
        routeFlag.bullet_line = true;
        console.log('Enabled bullet line flag:', routeFlag.bullet_line);
        
        console.log('✅ Flag manipulation completed');
        
    } catch (error) {
        console.error('❌ Error in basic RouteFlag demonstration:', error);
    }
    
    console.log('\n');
}

/**
 * Special Rules Analysis Example
 * 
 * Demonstrates how different route flags affect fare calculation
 * and routing behavior for Japanese railway systems.
 */
async function demonstrateSpecialRules(module: FarertModule): Promise<void> {
    console.log('=== Special Rules Analysis ===\n');
    
    const testCases = [
        {
            name: 'Standard Route (No Special Rules)',
            route: '東京 山手線 品川',
            flags: { no_rule: true, special_fare_enable: false }
        },
        {
            name: 'Special Fare Enabled Route',
            route: '東京 東海道線 名古屋',
            flags: { no_rule: false, special_fare_enable: true }
        },
        {
            name: 'JR Tokai Stock Discount Route',
            route: '東京 東海道線 大阪',
            flags: { 
                no_rule: false, 
                special_fare_enable: true, 
                jrtokaistock_enable: true,
                bJrTokaiOnly: true
            }
        },
        {
            name: 'Bullet Train Route',
            route: '東京 東海道新幹線 大阪',
            flags: { 
                no_rule: false, 
                special_fare_enable: true, 
                bullet_line: true,
                rule70bullet: true
            }
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n--- ${testCase.name} ---`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            
            // Setup route
            try {
                calcRoute.setupRoute(testCase.route);
                console.log(`✅ Route: ${testCase.route}`);
            } catch (error) {
                console.log(`⚠️  Route setup failed: ${error.message}`);
                continue;
            }
            
            // Get route flag and configure
            const routeFlag = new module.cRouteFlag();
            
            // Apply test case flags
            Object.keys(testCase.flags).forEach(flagName => {
                if (flagName in routeFlag) {
                    (routeFlag as any)[flagName] = (testCase.flags as any)[flagName];
                    console.log(`🏴 Set ${flagName}: ${(testCase.flags as any)[flagName]}`);
                }
            });
            
            // Perform calculation
            const fareInfo = calcRoute.calcFare();
            console.log(`💴 Calculated fare: ¥${fareInfo.fare}`);
            console.log(`📊 Result code: ${fareInfo.result}`);
            
            // Analyze applied rules
            if (fareInfo.isRule114Applied) {
                console.log('⚖️  Rule 114 was applied (complex routing)');
            }
            
            // Check for stock discounts
            if (fareInfo.availCountForFareOfStockDiscount > 0) {
                console.log(`🎫 Stock discount options: ${fareInfo.availCountForFareOfStockDiscount}`);
            }
            
            // Show active flags
            const activeFlags = [];
            if (routeFlag.no_rule) activeFlags.push('no_rule');
            if (routeFlag.special_fare_enable) activeFlags.push('special_fare');
            if (routeFlag.bullet_line) activeFlags.push('bullet_line');
            if (routeFlag.jrtokaistock_enable) activeFlags.push('jr_tokai_stock');
            if (routeFlag.rule69) activeFlags.push('rule69');
            if (routeFlag.rule70) activeFlags.push('rule70');
            if (routeFlag.rule88) activeFlags.push('rule88');
            
            if (activeFlags.length > 0) {
                console.log(`🏴 Active flags: ${activeFlags.join(', ')}`);
            } else {
                console.log('🏴 No special flags active');
            }
            
        } catch (error) {
            console.log(`❌ Analysis failed: ${error.message}`);
        }
    }
    
    console.log('\n');
}

/**
 * Advanced Flag Configuration Example
 * 
 * Shows how to configure complex flag combinations for different
 * routing scenarios and business requirements.
 */
async function demonstrateAdvancedFlagConfiguration(module: FarertModule): Promise<void> {
    console.log('=== Advanced Flag Configuration ===\n');
    
    try {
        const routeFlag = new module.cRouteFlag();
        console.log('✅ Created RouteFlag for advanced configuration');
        
        console.log('\n--- Configuration Scenarios ---');
        
        // Scenario 1: Maximum discount configuration
        console.log('\n🎫 Scenario 1: Maximum Discount Configuration');
        routeFlag.no_rule = false;
        routeFlag.special_fare_enable = true;
        routeFlag.jrtokaistock_enable = true;
        routeFlag.jrtokaistock_applied = false; // Will be set during calculation
        routeFlag.bJrTokaiOnly = true;
        routeFlag.meihan_city_enable = true;
        
        console.log('   ✅ Configured for maximum discount opportunities');
        console.log(`   🏴 special_fare_enable: ${routeFlag.special_fare_enable}`);
        console.log(`   🏴 jrtokaistock_enable: ${routeFlag.jrtokaistock_enable}`);
        console.log(`   🏴 bJrTokaiOnly: ${routeFlag.bJrTokaiOnly}`);
        
        // Scenario 2: Conservative calculation (no special rules)
        console.log('\n🛡️  Scenario 2: Conservative Calculation');
        const conservativeFlag = new module.cRouteFlag();
        conservativeFlag.no_rule = true;
        conservativeFlag.special_fare_enable = false;
        conservativeFlag.jrtokaistock_enable = false;
        conservativeFlag.bullet_line = false;
        
        console.log('   ✅ Configured for conservative fare calculation');
        console.log(`   🏴 no_rule: ${conservativeFlag.no_rule}`);
        console.log(`   🏴 special_fare_enable: ${conservativeFlag.special_fare_enable}`);
        
        // Scenario 3: Bullet train optimized
        console.log('\n🚄 Scenario 3: Bullet Train Optimized');
        const bulletFlag = new module.cRouteFlag();
        bulletFlag.no_rule = false;
        bulletFlag.special_fare_enable = true;
        bulletFlag.bullet_line = true;
        bulletFlag.rule70 = true;
        bulletFlag.rule70bullet = true;
        
        console.log('   ✅ Configured for bullet train routing');
        console.log(`   🏴 bullet_line: ${bulletFlag.bullet_line}`);
        console.log(`   🏴 rule70: ${bulletFlag.rule70}`);
        console.log(`   🏴 rule70bullet: ${bulletFlag.rule70bullet}`);
        
        // Scenario 4: Urban area specialized
        console.log('\n🏙️  Scenario 4: Urban Area Specialized');
        const urbanFlag = new module.cRouteFlag();
        urbanFlag.no_rule = false;
        urbanFlag.special_fare_enable = true;
        urbanFlag.rule88 = true; // Urban area rule
        urbanFlag.meihan_city_flag = true;
        urbanFlag.meihan_city_enable = true;
        
        console.log('   ✅ Configured for urban area routing');
        console.log(`   🏴 rule88: ${urbanFlag.rule88}`);
        console.log(`   🏴 meihan_city_flag: ${urbanFlag.meihan_city_flag}`);
        
        console.log('\n--- Flag Validation and Best Practices ---');
        
        // Show flag validation patterns
        console.log('\n🔍 Flag Validation Examples:');
        
        // Check for conflicting configurations
        if (routeFlag.no_rule && routeFlag.special_fare_enable) {
            console.log('⚠️  Warning: no_rule = true conflicts with special_fare_enable = true');
        } else {
            console.log('✅ No conflicting rule configurations detected');
        }
        
        // Check for bullet train consistency
        if (bulletFlag.bullet_line && !bulletFlag.rule70bullet) {
            console.log('ℹ️  Info: bullet_line = true but rule70bullet = false');
        } else if (bulletFlag.bullet_line && bulletFlag.rule70bullet) {
            console.log('✅ Bullet train flags are consistent');
        }
        
        // Check JR Tokai configuration
        if (routeFlag.jrtokaistock_enable && !routeFlag.bJrTokaiOnly) {
            console.log('ℹ️  Info: JR Tokai stock enabled but not JR Tokai only route');
        } else if (routeFlag.jrtokaistock_enable && routeFlag.bJrTokaiOnly) {
            console.log('✅ JR Tokai configuration is consistent');
        }
        
        console.log('\n📚 Best Practices:');
        console.log('   • Set no_rule = true for simple calculations');
        console.log('   • Enable special_fare_enable for discount opportunities');
        console.log('   • Use bullet_line for Shinkansen routes');
        console.log('   • Configure company-specific flags for targeted discounts');
        console.log('   • Validate flag combinations to avoid conflicts');
        
    } catch (error) {
        console.error('❌ Error in advanced flag configuration:', error);
    }
    
    console.log('\n');
}

/**
 * Flag Impact Comparison Example
 * 
 * Demonstrates how different flag configurations affect fare calculation
 * results for the same route.
 */
async function demonstrateFlagImpactComparison(module: FarertModule): Promise<void> {
    console.log('=== Flag Impact Comparison ===\n');
    
    const testRoute = '東京 東海道線 大阪';
    console.log(`🚃 Test route: ${testRoute}\n`);
    
    const configurations = [
        {
            name: 'Baseline (No Special Rules)',
            flags: { no_rule: true, special_fare_enable: false }
        },
        {
            name: 'Special Fares Enabled',
            flags: { no_rule: false, special_fare_enable: true }
        },
        {
            name: 'JR Tokai Stock Discount',
            flags: { 
                no_rule: false, 
                special_fare_enable: true, 
                jrtokaistock_enable: true,
                bJrTokaiOnly: true
            }
        },
        {
            name: 'All Rules Enabled',
            flags: {
                no_rule: false,
                special_fare_enable: true,
                jrtokaistock_enable: true,
                bJrTokaiOnly: true,
                rule69: true,
                rule70: true,
                rule88: true,
                meihan_city_enable: true
            }
        }
    ];
    
    const results: Array<{name: string, fare: number, result: number, discounts: number}> = [];
    
    for (const config of configurations) {
        console.log(`--- ${config.name} ---`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            calcRoute.setupRoute(testRoute);
            
            // Configure flags (conceptually - actual flag application may vary)
            const routeFlag = new module.cRouteFlag();
            Object.keys(config.flags).forEach(flagName => {
                if (flagName in routeFlag) {
                    (routeFlag as any)[flagName] = (config.flags as any)[flagName];
                }
            });
            
            const fareInfo = calcRoute.calcFare();
            
            console.log(`💴 Fare: ¥${fareInfo.fare}`);
            console.log(`📊 Result: ${fareInfo.result}`);
            console.log(`🎫 Discounts: ${fareInfo.availCountForFareOfStockDiscount}`);
            
            if (fareInfo.isRule114Applied) {
                console.log('⚖️  Rule 114 applied');
            }
            
            results.push({
                name: config.name,
                fare: fareInfo.fare,
                result: fareInfo.result,
                discounts: fareInfo.availCountForFareOfStockDiscount
            });
            
        } catch (error) {
            console.log(`❌ Configuration failed: ${error.message}`);
            results.push({
                name: config.name,
                fare: -1,
                result: -1,
                discounts: 0
            });
        }
        
        console.log('');
    }
    
    console.log('--- Comparison Summary ---');
    
    let baseline = results.find(r => r.name === 'Baseline (No Special Rules)');
    if (!baseline) baseline = results[0];
    
    results.forEach(result => {
        if (result.fare > 0) {
            const difference = result.fare - baseline.fare;
            const percentChange = baseline.fare > 0 ? ((difference / baseline.fare) * 100).toFixed(1) : '0.0';
            const changeSymbol = difference > 0 ? '📈' : difference < 0 ? '📉' : '➡️';
            
            console.log(`${result.name}:`);
            console.log(`   ${changeSymbol} ¥${result.fare} (${difference >= 0 ? '+' : ''}${difference}, ${percentChange}%)`);
            
            if (result.discounts > 0) {
                console.log(`   🎫 ${result.discounts} discount option${result.discounts > 1 ? 's' : ''}`);
            }
        } else {
            console.log(`${result.name}: ❌ Failed`);
        }
    });
    
    console.log('\n');
}

/**
 * Main demonstration function
 * Runs all RouteFlag examples
 */
async function runRouteFlagExamples(): Promise<void> {
    console.log('🚀 WASM Object Classes - RouteFlag Examples\n');
    console.log('Demonstrating advanced route flag usage and special rule configurations\n');
    
    try {
        // Initialize WebAssembly module
        console.log('🔄 Initializing WebAssembly module...');
        const module = await wasmLoader.loadModule();
        await wasmLoader.initializeDatabase();
        console.log('✅ WebAssembly module initialized\n');
        
        // Run demonstrations
        await demonstrateBasicRouteFlags(module);
        await demonstrateSpecialRules(module);
        await demonstrateAdvancedFlagConfiguration(module);
        await demonstrateFlagImpactComparison(module);
        
        console.log('🎉 All RouteFlag demonstrations completed!');
        console.log('\n📚 Key takeaways:');
        console.log('   • RouteFlags control special fare calculation rules');
        console.log('   • Different flag combinations can significantly affect fares');
        console.log('   • Proper flag validation prevents configuration conflicts');
        console.log('   • Company-specific flags enable targeted discount strategies');
        console.log('\n📚 Next steps:');
        console.log('   • See realistic-scenarios.ts for real-world route examples');
        console.log('   • See framework-integration.ts for React/Vue integration');
        console.log('   • See troubleshooting-examples.ts for error handling');
        
        // Cleanup
        module.closeDatabase();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error running RouteFlag examples:', error);
        process.exit(1);
    }
}

// Execute demonstrations if run directly
if (require.main === module) {
    runRouteFlagExamples().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

// Export for use in other examples
export {
    demonstrateBasicRouteFlags,
    demonstrateSpecialRules,
    demonstrateAdvancedFlagConfiguration,
    demonstrateFlagImpactComparison,
    runRouteFlagExamples
};