#!/usr/bin/env node

/**
 * RouteItem and FareInfo Usage Examples
 * 
 * This file demonstrates detailed usage patterns for:
 * - cRouteItem: Individual route segment data and operations
 * - FareInfo: Comprehensive fare calculation results and discount information
 * - Stock discount methods and fare breakdown analysis
 * 
 * Requirements: REQ-OBJ-008 - Developer experience with comprehensive examples
 * Focus: Individual route segments and detailed fare information
 */

import { wasmLoader } from '../wasm_loader';
import { 
    FarertModule, 
    CalcRouteWrapper,
    RouteItemWrapper,
    FareInfoData
} from '../types';

/**
 * RouteItem Detailed Usage Example
 * 
 * cRouteItem represents individual route segments with station, line, fare, and distance data.
 * This demonstrates how to access and work with individual route segments.
 */
async function demonstrateRouteItem(module: FarertModule): Promise<void> {
    console.log('=== cRouteItem Detailed Usage ===\n');
    
    try {
        // Create a route with multiple segments for demonstration
        const calcRoute = new module.cCalcRoute();
        console.log('✅ Created cCalcRoute for RouteItem demonstration');
        
        // Setup a multi-segment route: 東京 -> 品川 -> 新大阪
        try {
            calcRoute.setupRoute('東京 東海道線 品川 東海道線 新大阪');
            console.log('✅ Route setup: "東京 東海道線 品川 東海道線 新大阪"');
        } catch (error) {
            console.log('⚠️  String setup failed, building route manually');
            
            // Manual construction fallback
            const tokyoId = module.getStationId('東京');
            const shinagawaId = module.getStationId('品川');
            const shinosakaId = module.getStationId('新大阪');
            const tokaidoLineId = module.getLineId('東海道線');
            
            if (tokyoId > 0 && shinagawaId > 0) {
                calcRoute.addRoute(tokyoId);
                if (tokaidoLineId > 0) {
                    calcRoute.addRouteWithLine(tokaidoLineId, shinagawaId);
                    if (shinosakaId > 0) {
                        calcRoute.addRouteWithLine(tokaidoLineId, shinosakaId);
                    }
                } else {
                    calcRoute.addRoute(shinagawaId);
                }
                console.log('✅ Manual route construction completed');
            }
        }
        
        console.log('\n--- RouteItem Analysis ---');
        
        const routeCount = calcRoute.getRouteCount();
        console.log(`📊 Total route segments: ${routeCount}`);
        
        if (routeCount > 0) {
            // Analyze each route item
            for (let i = 0; i < routeCount; i++) {
                console.log(`\n🔍 Route Item ${i + 1}:`);
                
                try {
                    const routeItem = calcRoute.getRouteItem(i);
                    
                    if (routeItem && routeItem.isValid()) {
                        console.log(`   📍 Station ID: ${routeItem.stationId}`);
                        console.log(`   🚃 Line ID: ${routeItem.lineId}`);
                        console.log(`   🏴 Flags: ${routeItem.flag} (0x${routeItem.flag.toString(16)})`);
                        console.log(`   💴 Segment fare: ¥${routeItem.fare}`);
                        console.log(`   📏 Sales distance: ${routeItem.salesKm} km`);
                        console.log(`   📊 Aggregate index: ${routeItem.indexOfAggregate}`);
                        
                        // Get display information
                        const displayName = routeItem.getDisplayName();
                        console.log(`   📋 Display: "${displayName}"`);
                        
                        // Get station and line names if available
                        try {
                            const stationName = module.getStationName(routeItem.stationId);
                            const lineName = module.getLineName(routeItem.lineId);
                            console.log(`   🚉 Station: ${stationName}`);
                            console.log(`   🚃 Line: ${lineName}`);
                        } catch (error) {
                            console.log('   ℹ️  Station/Line name lookup not available');
                        }
                        
                    } else {
                        console.log('   ❌ Invalid route item');
                    }
                } catch (error) {
                    console.log(`   ⚠️  Could not access route item ${i}: ${error.message}`);
                }
            }
        }
        
        console.log('\n--- RouteItem Creation ---');
        
        // Demonstrate creating a standalone RouteItem
        try {
            const newItem = new module.cRouteItem();
            console.log('✅ Created standalone cRouteItem');
            
            // Set basic properties (if available)
            const tokyoId = module.getStationId('東京');
            const tokaidoLineId = module.getLineId('東海道線');
            
            if (tokyoId > 0) {
                newItem.stationId = tokyoId;
                console.log(`📍 Set station ID: ${newItem.stationId}`);
            }
            
            if (tokaidoLineId > 0) {
                newItem.lineId = tokaidoLineId;
                console.log(`🚃 Set line ID: ${newItem.lineId}`);
            }
            
            newItem.flag = 0;
            newItem.fare = 0;
            newItem.salesKm = 0.0;
            newItem.indexOfAggregate = 0;
            
            console.log(`✅ RouteItem configured: ${newItem.isValid() ? 'Valid' : 'Invalid'}`);
            console.log(`📋 Display: "${newItem.getDisplayName()}"`);
            
        } catch (error) {
            console.log('⚠️  Standalone RouteItem creation not available');
        }
        
    } catch (error) {
        console.error('❌ Error in RouteItem demonstration:', error);
    }
    
    console.log('\n');
}

/**
 * FareInfo Detailed Usage Example
 * 
 * FareInfo contains comprehensive fare calculation results including discounts,
 * special rules, and detailed breakdown information.
 */
async function demonstrateFareInfo(module: FarertModule): Promise<void> {
    console.log('=== FareInfo Detailed Usage ===\n');
    
    try {
        // Create a route for fare calculation
        const calcRoute = new module.cCalcRoute();
        console.log('✅ Created cCalcRoute for FareInfo demonstration');
        
        console.log('\n--- Fare Calculation Setup ---');
        
        // Setup a route that might have discounts: 東京 -> 大阪 (long distance)
        try {
            calcRoute.setupRoute('東京 東海道線 大阪');
            console.log('✅ Route setup: "東京 東海道線 大阪" (long distance)');
        } catch (error) {
            // Fallback to a shorter route
            calcRoute.setupRoute('東京 東海道線 品川');
            console.log('✅ Route setup: "東京 東海道線 品川" (fallback)');
        }
        
        // Configure for maximum fare information
        calcRoute.setLongRoute(true);
        calcRoute.setStartAsCity();
        calcRoute.setArriveAsCity();
        console.log('⚙️  Configured for comprehensive fare calculation');
        
        console.log('\n--- Fare Calculation Results ---');
        
        // Perform fare calculation
        const fareInfo = calcRoute.calcFare();
        console.log('💰 Fare calculation completed!');
        
        // Basic fare information
        console.log(`💴 Base fare: ¥${fareInfo.fare}`);
        console.log(`📊 Result code: ${fareInfo.result}`);
        console.log(`🏁 Begin station ID: ${fareInfo.beginStationId}`);
        console.log(`🎯 End station ID: ${fareInfo.endStationId}`);
        
        // Try to get station names
        try {
            const beginStation = module.getStationName(fareInfo.beginStationId);
            const endStation = module.getStationName(fareInfo.endStationId);
            console.log(`🚉 Route: ${beginStation} → ${endStation}`);
        } catch (error) {
            console.log('ℹ️  Station name lookup not available');
        }
        
        console.log(`📋 Route list: "${fareInfo.routeList}"`);
        
        console.log('\n--- Special Rules and Discounts ---');
        
        // Rule 114 (special fare calculation rule)
        console.log(`⚖️  Rule 114 applied: ${fareInfo.isRule114Applied ? 'Yes' : 'No'}`);
        if (fareInfo.isRule114Applied) {
            console.log('   ℹ️  Rule 114: Special fare calculation for complex routes');
        }
        
        // Stock discount information
        const discountCount = fareInfo.availCountForFareOfStockDiscount;
        console.log(`🎫 Available discount options: ${discountCount}`);
        
        if (discountCount > 0) {
            console.log('\n--- Stock Discount Analysis ---');
            
            // Demonstrate stock discount methods if available
            for (let i = 0; i < Math.min(discountCount, 5); i++) {
                try {
                    // These methods might be available on the FareInfo object
                    if (typeof fareInfo.fareForStockDiscount === 'function') {
                        const discountFare = fareInfo.fareForStockDiscount(i);
                        console.log(`   🎫 Discount ${i + 1}: ¥${discountFare}`);
                        
                        if (typeof fareInfo.fareForStockDiscountTitle === 'function') {
                            const discountTitle = fareInfo.fareForStockDiscountTitle(i);
                            console.log(`      📋 Title: "${discountTitle}"`);
                        }
                        
                        const savings = fareInfo.fare - discountFare;
                        if (savings > 0) {
                            console.log(`      💰 Savings: ¥${savings}`);
                        }
                        
                    } else {
                        console.log(`   🎫 Discount option ${i + 1} available (methods not accessible)`);
                    }
                } catch (error) {
                    console.log(`   ⚠️  Could not access discount ${i}: ${error.message}`);
                }
            }
        } else {
            console.log('   ℹ️  No discount options available for this route');
        }
        
        console.log('\n--- Additional FareInfo Properties ---');
        
        // Display all available properties
        const fareProperties = Object.keys(fareInfo);
        console.log(`📋 Available FareInfo properties (${fareProperties.length}):`);
        
        fareProperties.forEach(key => {
            if (key !== 'fare' && key !== 'result' && key !== 'routeList') {
                const value = fareInfo[key];
                const type = typeof value;
                
                if (type === 'number' || type === 'string' || type === 'boolean') {
                    console.log(`   ${key}: ${value} (${type})`);
                } else if (type === 'object' && value !== null) {
                    console.log(`   ${key}: [object] (${type})`);
                } else {
                    console.log(`   ${key}: ${value} (${type})`);
                }
            }
        });
        
        console.log('\n--- Formatted Fare Display ---');
        
        // Get comprehensive fare display
        const fareDisplay = calcRoute.showFare();
        console.log('📄 Complete fare breakdown:');
        console.log(fareDisplay);
        
        console.log('\n--- JSON Serialization ---');
        
        // Try to get JSON representation
        try {
            const fareJson = calcRoute.calcFareJson();
            const parsed = JSON.parse(fareJson);
            
            console.log('📋 FareInfo as JSON:');
            console.log(`   Keys: ${Object.keys(parsed).join(', ')}`);
            console.log(`   JSON size: ${fareJson.length} characters`);
            
            // Show a few sample properties
            if (parsed.fare !== undefined) {
                console.log(`   Sample - fare: ¥${parsed.fare}`);
            }
            if (parsed.result !== undefined) {
                console.log(`   Sample - result: ${parsed.result}`);
            }
            
        } catch (error) {
            console.log('⚠️  JSON serialization not available');
        }
        
    } catch (error) {
        console.error('❌ Error in FareInfo demonstration:', error);
    }
    
    console.log('\n');
}

/**
 * Advanced FareInfo Analysis Example
 * 
 * Demonstrates how to analyze fare information for different route types
 * and extract meaningful business intelligence from the results.
 */
async function demonstrateAdvancedFareAnalysis(module: FarertModule): Promise<void> {
    console.log('=== Advanced FareInfo Analysis ===\n');
    
    const testRoutes = [
        { desc: 'Short urban route', route: '新宿 山手線 品川' },
        { desc: 'Medium intercity route', route: '東京 東海道線 名古屋' },
        { desc: 'Complex transfer route', route: '渋谷 山手線 新橋 東海道線 川崎' }
    ];
    
    for (const testCase of testRoutes) {
        console.log(`\n--- ${testCase.desc}: ${testCase.route} ---`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            calcRoute.setupRoute(testCase.route);
            calcRoute.setLongRoute(true);
            
            const fareInfo = calcRoute.calcFare();
            
            // Calculate fare efficiency metrics
            const routeScript = calcRoute.routeScript();
            const segmentCount = calcRoute.getRouteCount();
            
            console.log(`💴 Fare: ¥${fareInfo.fare}`);
            console.log(`📊 Segments: ${segmentCount}`);
            
            if (segmentCount > 0) {
                const farePerSegment = Math.round(fareInfo.fare / segmentCount);
                console.log(`📈 Fare per segment: ¥${farePerSegment}`);
            }
            
            // Discount analysis
            if (fareInfo.availCountForFareOfStockDiscount > 0) {
                console.log(`🎫 Discount options: ${fareInfo.availCountForFareOfStockDiscount}`);
                
                // Calculate potential savings if discount methods available
                try {
                    if (typeof fareInfo.fareForStockDiscount === 'function') {
                        const bestDiscount = fareInfo.fareForStockDiscount(0);
                        const savings = fareInfo.fare - bestDiscount;
                        const savingsPercent = ((savings / fareInfo.fare) * 100).toFixed(1);
                        console.log(`💰 Best discount: ¥${bestDiscount} (${savingsPercent}% savings)`);
                    }
                } catch (error) {
                    console.log('ℹ️  Discount calculation not accessible');
                }
            }
            
            // Special rules analysis
            if (fareInfo.isRule114Applied) {
                console.log('⚖️  Special Rule 114 applied (complex routing)');
            }
            
            // Result code analysis
            if (fareInfo.result === 0) {
                console.log('✅ Calculation successful');
            } else {
                console.log(`⚠️  Calculation result: ${fareInfo.result}`);
            }
            
        } catch (error) {
            console.log(`❌ Analysis failed: ${error.message}`);
        }
    }
    
    console.log('\n');
}

/**
 * Main demonstration function
 * Runs all RouteItem and FareInfo examples
 */
async function runRouteItemFareInfoExamples(): Promise<void> {
    console.log('🚀 WASM Object Classes - RouteItem & FareInfo Examples\n');
    console.log('Demonstrating detailed usage of RouteItem and FareInfo classes\n');
    
    try {
        // Initialize WebAssembly module
        console.log('🔄 Initializing WebAssembly module...');
        const module = await wasmLoader.loadModule();
        await wasmLoader.initializeDatabase();
        console.log('✅ WebAssembly module initialized\n');
        
        // Run demonstrations
        await demonstrateRouteItem(module);
        await demonstrateFareInfo(module);
        await demonstrateAdvancedFareAnalysis(module);
        
        console.log('🎉 All RouteItem and FareInfo demonstrations completed!');
        console.log('\n📚 Next steps:');
        console.log('   • See route-flag-examples.ts for RouteFlag usage patterns');
        console.log('   • See realistic-scenarios.ts for real-world applications');
        console.log('   • See framework-integration.ts for React/Vue examples');
        
        // Cleanup
        module.closeDatabase();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error running RouteItem/FareInfo examples:', error);
        process.exit(1);
    }
}

// Execute demonstrations if run directly
if (require.main === module) {
    runRouteItemFareInfoExamples().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

// Export for use in other examples
export {
    demonstrateRouteItem,
    demonstrateFareInfo,
    demonstrateAdvancedFareAnalysis,
    runRouteItemFareInfoExamples
};