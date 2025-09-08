#!/usr/bin/env node

/**
 * Basic Object Class Usage Examples
 * 
 * This file demonstrates the fundamental usage patterns for the 6 WASM Object Classes:
 * - cRouteList: Base route container and operations
 * - cRoute: Route construction and manipulation (extends cRouteList)
 * - cCalcRoute: Route calculation with fare rules (extends cRoute)
 * - cRouteItem: Individual route segment data
 * - cRouteFlag: Route flags and special conditions
 * - FareInfo: Fare calculation results and discount information
 * 
 * Requirements: REQ-OBJ-008 - Developer experience with comprehensive examples
 * Inheritance: cCalcRoute < cRoute < cRouteList
 */

import { wasmLoader } from '../wasm_loader';
import { 
    FarertModule, 
    RouteListWrapper, 
    RouteWrapper, 
    CalcRouteWrapper,
    RouteItemWrapper,
    RouteFlagWrapper,
    FareInfoData
} from '../types';

/**
 * Basic cRouteList Usage Example
 * 
 * cRouteList is the base class for all route operations.
 * It provides fundamental array-like operations for managing route segments.
 */
async function demonstrateRouteList(module: FarertModule): Promise<void> {
    console.log('=== cRouteList Basic Usage ===\n');
    
    try {
        // Create a new route list instance
        const routeList = new module.cRouteList();
        console.log('✅ Created cRouteList instance');
        
        // Check initial state
        console.log(`📊 Initial route count: ${routeList.count()}`);
        console.log(`🏁 Start station ID: ${routeList.startStationId()}`);
        console.log(`🎯 Last station ID: ${routeList.lastStationId()}`);
        
        // Demonstrate route script (description)
        const script = routeList.routeScript();
        console.log(`📝 Route script: "${script}"`);
        
        console.log('\n--- Array Operations ---');
        
        // Array operations are available but route list starts empty
        console.log(`📦 Array size: ${routeList.count()}`);
        
        // Try to access element (should handle bounds checking)
        try {
            const firstItem = routeList.at(0);
            if (firstItem) {
                console.log(`📍 First item: ${firstItem.getDisplayName()}`);
            }
        } catch (error) {
            console.log('ℹ️  No items in empty route list (expected)');
        }
        
        console.log('\n--- Route List Operations ---');
        
        // Demonstrate removeAll (clears the route)
        routeList.removeAll();
        console.log(`🧹 After removeAll(): count = ${routeList.count()}`);
        
        // Note: assign() requires another RouteList instance to copy from
        console.log('📋 assign() method available for copying from another route list');
        
    } catch (error) {
        console.error('❌ Error in cRouteList demonstration:', error);
    }
    
    console.log('\n');
}

/**
 * Basic cRoute Usage Example
 * 
 * cRoute extends cRouteList and provides route construction capabilities.
 * It allows building routes by adding stations and lines step by step.
 */
async function demonstrateRoute(module: FarertModule): Promise<void> {
    console.log('=== cRoute Basic Usage ===\n');
    
    try {
        // Create a new route instance
        const route = new module.cRoute();
        console.log('✅ Created cRoute instance (extends cRouteList)');
        
        console.log('\n--- Route Construction ---');
        
        // Example route: 東京 -> 品川 via 東海道線
        const tokyoId = module.getStationId('東京');
        const shinagawaId = module.getStationId('品川'); 
        const tokaidoLineId = module.getLineId('東海道線');
        
        console.log(`🚉 Tokyo Station ID: ${tokyoId}`);
        console.log(`🚉 Shinagawa Station ID: ${shinagawaId}`);
        console.log(`🚃 Tokaido Line ID: ${tokaidoLineId}`);
        
        if (tokyoId > 0 && shinagawaId > 0 && tokaidoLineId > 0) {
            // Build the route step by step
            const result1 = route.addRoute(tokyoId);  // Start station
            console.log(`➕ Added Tokyo as start: result = ${result1}`);
            
            const result2 = route.addRouteWithLine(tokaidoLineId, shinagawaId);
            console.log(`➕ Added Shinagawa via Tokaido Line: result = ${result2}`);
            
            // Check route state
            console.log(`📊 Route count: ${route.getRouteCount()}`);
            console.log(`🏁 Start station: ${module.getStationName(route.startStationId())}`);
            console.log(`🎯 End station: ${module.getStationName(route.lastStationId())}`);
            console.log(`🚃 Last line: ${module.getLineName(route.lastLineId())}`);
            
            // Generate route description
            const description = route.routeScript();
            console.log(`📝 Route description: "${description}"`);
            
        } else {
            console.log('⚠️  Could not find required stations/lines for demonstration');
        }
        
        console.log('\n--- Route String Setup ---');
        
        // Alternative: Setup route from string
        try {
            route.removeAll(); // Clear existing route
            route.setupRoute('東京 東海道線 品川');
            console.log('✅ Route setup from string: "東京 東海道線 品川"');
            console.log(`📝 New route script: "${route.routeScript()}"`);
        } catch (error) {
            console.log('⚠️  Route string setup not available or failed');
        }
        
        console.log('\n--- Route Manipulation ---');
        
        // Demonstrate route operations
        console.log(`🔄 Reverse allowed: ${route.isReverseAllow()}`);
        console.log(`🛑 Route complete: ${route.isEnd()}`);
        
        // Remove last segment
        route.removeTail();
        console.log(`✂️  After removeTail(): count = ${route.getRouteCount()}`);
        
        // Route flags and options
        route.setDetour(false);
        route.setNoRule(false);
        console.log('⚙️  Route options configured');
        
    } catch (error) {
        console.error('❌ Error in cRoute demonstration:', error);
    }
    
    console.log('\n');
}

/**
 * Basic cCalcRoute Usage Example
 * 
 * cCalcRoute extends cRoute and provides fare calculation capabilities.
 * This is the primary class for calculating Japanese railway fares.
 */
async function demonstrateCalcRoute(module: FarertModule): Promise<void> {
    console.log('=== cCalcRoute Basic Usage ===\n');
    
    try {
        // Create a new calc route instance
        const calcRoute = new module.cCalcRoute();
        console.log('✅ Created cCalcRoute instance (extends cRoute)');
        
        console.log('\n--- Fare Calculation Setup ---');
        
        // Setup a route for fare calculation
        // Example: 新宿 -> 東京 via 中央線 and 東海道線
        try {
            calcRoute.setupRoute('新宿 中央線 東京');
            console.log('✅ Route setup: "新宿 中央線 東京"');
            
            // Configure calculation options
            calcRoute.setLongRoute(false);
            console.log('⚙️  Long route calculation: disabled');
            
            calcRoute.setStartAsCity();
            calcRoute.setArriveAsCity();
            console.log('🏙️  Start/Arrive as city: enabled');
            
            console.log(`🔍 Long route enabled: ${calcRoute.isEnableLongRoute()}`);
            
        } catch (error) {
            console.log('⚠️  Route setup failed, creating manual route');
            
            // Manual route construction as fallback
            const shinjukuId = module.getStationId('新宿');
            const tokyoId = module.getStationId('東京');
            const chuoLineId = module.getLineId('中央線');
            
            if (shinjukuId > 0 && tokyoId > 0) {
                calcRoute.addRoute(shinjukuId);
                if (chuoLineId > 0) {
                    calcRoute.addRouteWithLine(chuoLineId, tokyoId);
                } else {
                    calcRoute.addRoute(tokyoId);
                }
                console.log('✅ Manual route construction completed');
            }
        }
        
        console.log('\n--- Fare Calculation ---');
        
        if (calcRoute.getRouteCount() > 1) {
            // Perform fare calculation
            const fareInfo = calcRoute.calcFare();
            console.log('💰 Fare calculation completed!');
            console.log(`💴 Calculated fare: ¥${fareInfo.fare}`);
            console.log(`📊 Result code: ${fareInfo.result}`);
            console.log(`📋 Rule 114 applied: ${fareInfo.isRule114Applied ? 'Yes' : 'No'}`);
            console.log(`🎫 Stock discount options: ${fareInfo.availCountForFareOfStockDiscount}`);
            
            // Get formatted fare display
            const fareDisplay = calcRoute.showFare();
            console.log(`📄 Formatted fare display:\n${fareDisplay}`);
            
            // Get fare info as JSON
            try {
                const fareJson = calcRoute.calcFareJson();
                const parsed = JSON.parse(fareJson);
                console.log('📋 Fare info JSON keys:', Object.keys(parsed).join(', '));
            } catch (error) {
                console.log('ℹ️  JSON fare info not available');
            }
            
        } else {
            console.log('⚠️  Route not properly constructed, skipping fare calculation');
        }
        
        console.log('\n--- Route Information ---');
        
        // Display route information
        console.log(`🚉 Start: ${module.getStationName(calcRoute.startStationId())}`);
        console.log(`🚉 End: ${module.getStationName(calcRoute.lastStationId())}`);
        console.log(`📝 Route: ${calcRoute.routeScript()}`);
        
    } catch (error) {
        console.error('❌ Error in cCalcRoute demonstration:', error);
    }
    
    console.log('\n');
}

/**
 * Main demonstration function
 * Initializes WebAssembly module and runs all basic object class examples
 */
async function runBasicObjectClassExamples(): Promise<void> {
    console.log('🚀 WASM Object Classes - Basic Usage Examples\n');
    console.log('Demonstrating the 6 core object classes with inheritance hierarchy:');
    console.log('cCalcRoute < cRoute < cRouteList\n');
    
    try {
        // Initialize WebAssembly module
        console.log('🔄 Initializing WebAssembly module...');
        const module = await wasmLoader.loadModule();
        await wasmLoader.initializeDatabase();
        console.log('✅ WebAssembly module initialized\n');
        
        // Run demonstrations in order of inheritance hierarchy
        await demonstrateRouteList(module);
        await demonstrateRoute(module);
        await demonstrateCalcRoute(module);
        
        console.log('🎉 All basic object class demonstrations completed successfully!');
        console.log('\n📚 Next steps:');
        console.log('   • See route-item-examples.ts for RouteItem and RouteFlag usage');
        console.log('   • See fareinfo-examples.ts for detailed FareInfo operations');
        console.log('   • See realistic-scenarios.ts for real-world Japanese railway examples');
        
        // Cleanup
        module.closeDatabase();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error running basic object class examples:', error);
        process.exit(1);
    }
}

// Execute demonstrations if run directly
if (require.main === module) {
    runBasicObjectClassExamples().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

// Export for use in other examples
export {
    demonstrateRouteList,
    demonstrateRoute, 
    demonstrateCalcRoute,
    runBasicObjectClassExamples
};