#!/usr/bin/env node

/**
 * Realistic Japanese Railway Scenarios
 * 
 * This file demonstrates real-world usage patterns with actual Japanese railway routes:
 * - Daily commuting routes (Tokyo area, Kansai area)
 * - Long-distance travel (Tokyo-Osaka, Tokyo-Kyoto)
 * - Complex multi-transfer journeys
 * - Special fare rules in practice
 * - Business travel optimization
 * - Tourism route planning
 * 
 * Requirements: REQ-OBJ-008 - Realistic Japanese station/line usage patterns
 * Focus: Real-world applications and practical usage scenarios
 */

import { wasmLoader } from '../wasm_loader';
import { 
    FarertModule, 
    CalcRouteWrapper
} from '../types';

/**
 * Daily Commuting Scenarios
 * 
 * Demonstrates typical commuting routes in major metropolitan areas
 * with fare calculation and optimization strategies.
 */
async function demonstrateCommutingScenarios(module: FarertModule): Promise<void> {
    console.log('=== Daily Commuting Scenarios ===\n');
    
    const commutingRoutes = [
        {
            name: 'Tokyo Suburbs to Central Tokyo',
            description: 'Typical salary worker commute from Tachikawa to Tokyo Station',
            route: '立川 中央線 東京',
            tips: 'Consider JR pass for daily usage, peak hour timing affects comfort but not fare'
        },
        {
            name: 'Cross-Tokyo Commute',
            description: 'Complex route crossing multiple JR lines',
            route: '新宿 山手線 品川 東海道線 川崎',
            tips: 'Transfer at major hubs like Shimbashi or Tokyo for better connections'
        },
        {
            name: 'Kansai Commuting',
            description: 'Osaka area commuting via JR lines',
            route: '大阪 東海道線 京都',
            tips: 'JR West area - consider regional passes for frequent travel'
        },
        {
            name: 'Yokohama to Tokyo Business District',
            description: 'Popular business route',
            route: '横浜 東海道線 新橋',
            tips: 'Alternative: Keihin-Tohoku line for local stops'
        },
        {
            name: 'Saitama to Tokyo',
            description: 'Northern suburb commute',
            route: '大宮 京浜東北線 上野',
            tips: 'Major hub connection through Ueno for further Tokyo access'
        }
    ];
    
    for (const scenario of commutingRoutes) {
        console.log(`--- ${scenario.name} ---`);
        console.log(`📍 ${scenario.description}`);
        console.log(`🚃 Route: ${scenario.route}`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            calcRoute.setupRoute(scenario.route);
            
            // Calculate standard fare
            const fareInfo = calcRoute.calcFare();
            console.log(`💴 One-way fare: ¥${fareInfo.fare}`);
            
            // Calculate round trip cost
            const roundTrip = fareInfo.fare * 2;
            console.log(`🔄 Round trip: ¥${roundTrip}`);
            
            // Monthly commuting cost (22 working days)
            const monthlyCommute = roundTrip * 22;
            console.log(`📅 Monthly cost (22 days): ¥${monthlyCommute.toLocaleString()}`);
            
            // Check for available discounts
            if (fareInfo.availCountForFareOfStockDiscount > 0) {
                console.log(`🎫 Available discounts: ${fareInfo.availCountForFareOfStockDiscount} options`);
                
                // Calculate potential savings
                try {
                    if (typeof fareInfo.fareForStockDiscount === 'function') {
                        const discountFare = fareInfo.fareForStockDiscount(0);
                        const savings = fareInfo.fare - discountFare;
                        const monthlySavings = savings * 2 * 22;
                        console.log(`💰 Best discount: ¥${discountFare} (save ¥${monthlySavings.toLocaleString()}/month)`);
                    }
                } catch (error) {
                    console.log('ℹ️  Discount calculation details not available');
                }
            }
            
            console.log(`💡 Tip: ${scenario.tips}`);
            
        } catch (error) {
            console.log(`❌ Route calculation failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('💼 Commuting Optimization Tips:');
    console.log('   • Consider monthly passes for routes over ¥10,000/month');
    console.log('   • JR Pass may be cost-effective for long commutes');
    console.log('   • Check private railway alternatives for better pricing');
    console.log('   • Off-peak travel same fare but more comfortable');
    console.log('\n');
}

/**
 * Long-Distance Travel Scenarios
 * 
 * Demonstrates intercity travel with Shinkansen and regular lines,
 * including fare comparisons and travel time considerations.
 */
async function demonstrateLongDistanceTravel(module: FarertModule): Promise<void> {
    console.log('=== Long-Distance Travel Scenarios ===\n');
    
    const longDistanceRoutes = [
        {
            name: 'Tokyo to Osaka - Regular Lines',
            route: '東京 東海道線 大阪',
            description: 'Budget option using regular JR lines',
            travelTime: '8-9 hours',
            pros: 'Cheapest option, scenic route',
            cons: 'Very long travel time, multiple transfers likely'
        },
        {
            name: 'Tokyo to Osaka - Shinkansen',
            route: '東京 東海道新幹線 新大阪',
            description: 'High-speed bullet train option',
            travelTime: '2.5-3 hours',
            pros: 'Fastest option, comfortable, frequent departures',
            cons: 'Most expensive, requires seat reservation for busy periods'
        },
        {
            name: 'Tokyo to Kyoto via Shinkansen',
            route: '東京 東海道新幹線 京都',
            description: 'Tourist-friendly bullet train route',
            travelTime: '2 hours 15 minutes',
            pros: 'Direct to Kyoto, perfect for tourism',
            cons: 'Premium pricing'
        },
        {
            name: 'Tokyo to Sendai',
            route: '東京 東北新幹線 仙台',
            description: 'Northern Japan via Tohoku Shinkansen',
            travelTime: '1.5-2 hours',
            pros: 'Efficient connection to Tohoku region',
            cons: 'Limited alternative routes'
        },
        {
            name: 'Cross-Country Alternative Route',
            route: '東京 中央線 松本 篠ノ井線 長野',
            description: 'Scenic mountain route to central Japan',
            travelTime: '4-5 hours',
            pros: 'Beautiful mountain scenery, cultural stops',
            cons: 'Longer travel time, weather dependent'
        }
    ];
    
    for (const journey of longDistanceRoutes) {
        console.log(`--- ${journey.name} ---`);
        console.log(`📍 ${journey.description}`);
        console.log(`🚃 Route: ${journey.route}`);
        console.log(`⏱️  Travel time: ${journey.travelTime}`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            calcRoute.setLongRoute(true); // Enable long route calculation
            calcRoute.setupRoute(journey.route);
            
            const fareInfo = calcRoute.calcFare();
            console.log(`💴 One-way fare: ¥${fareInfo.fare.toLocaleString()}`);
            
            // Show route details
            const routeDescription = calcRoute.routeScript();
            if (routeDescription && routeDescription.trim()) {
                console.log(`📝 Route details: ${routeDescription}`);
            }
            
            // Calculate travel costs for different scenarios
            const roundTrip = fareInfo.fare * 2;
            console.log(`🔄 Round trip: ¥${roundTrip.toLocaleString()}`);
            
            // Business trip cost (including potential return flexibility)
            const businessTrip = Math.round(roundTrip * 1.1); // 10% buffer for changes
            console.log(`💼 Business trip budget: ¥${businessTrip.toLocaleString()}`);
            
            // Check for special rules or discounts
            if (fareInfo.isRule114Applied) {
                console.log('⚖️  Special fare rule 114 applied (complex routing)');
            }
            
            if (fareInfo.availCountForFareOfStockDiscount > 0) {
                console.log(`🎫 Discount options available: ${fareInfo.availCountForFareOfStockDiscount}`);
            }
            
            console.log(`✅ Pros: ${journey.pros}`);
            console.log(`⚠️  Cons: ${journey.cons}`);
            
        } catch (error) {
            console.log(`❌ Route calculation failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('🚄 Long-Distance Travel Tips:');
    console.log('   • JR Pass cost-effective for multiple long-distance trips');
    console.log('   • Book Shinkansen seats in advance during peak seasons');
    console.log('   • Consider overnight buses for budget travel');
    console.log('   • Regular lines may require multiple transfers');
    console.log('   • Check weather conditions for mountain routes');
    console.log('\n');
}

/**
 * Complex Multi-Transfer Journey Scenarios
 * 
 * Demonstrates sophisticated routing with multiple transfers,
 * showcasing the system's ability to handle complex itineraries.
 */
async function demonstrateComplexJourneys(module: FarertModule): Promise<void> {
    console.log('=== Complex Multi-Transfer Journeys ===\n');
    
    const complexRoutes = [
        {
            name: 'Cross-Tokyo with Multiple Transfers',
            description: 'Navigating Tokyo\'s complex rail network',
            route: '渋谷 山手線 新橋 東海道線 品川 山手線 上野',
            scenario: 'Tourist visiting multiple attractions in one day',
            difficulty: 'Medium',
            tips: 'IC card recommended for easy transfers'
        },
        {
            name: 'Suburban to Airport Route',
            description: 'Getting to Narita from western Tokyo',
            route: '立川 中央線 東京 総武線 成田',
            scenario: 'International departure from suburban location',
            difficulty: 'Medium',
            tips: 'Allow extra time for transfers, check airport express alternatives'
        },
        {
            name: 'Regional Sightseeing Circuit',
            description: 'Multi-city tour in central Japan',
            route: '東京 東海道線 熱海 東海道線 沼津 御殿場線 国府津',
            scenario: 'Hot spring and Mt. Fuji sightseeing tour',
            difficulty: 'High',
            tips: 'Check local train schedules, some lines have limited service'
        },
        {
            name: 'Business District Hopping',
            description: 'Multiple business meetings across Tokyo',
            route: '新宿 中央線 東京 山手線 品川 京浜東北線 浜松町',
            scenario: 'Sales representative visiting multiple offices',
            difficulty: 'Medium',
            tips: 'Peak hours add travel time but not cost'
        },
        {
            name: 'University Campus Tour',
            description: 'Visiting multiple universities in Tokyo area',
            route: '池袋 山手線 新宿 中央線 国分寺 武蔵野線 南浦和',
            scenario: 'Student exploring university options',
            difficulty: 'High',
            tips: 'Some university campuses are far from main stations'
        }
    ];
    
    for (const journey of complexRoutes) {
        console.log(`--- ${journey.name} ---`);
        console.log(`📍 ${journey.description}`);
        console.log(`🎭 Scenario: ${journey.scenario}`);
        console.log(`📊 Difficulty: ${journey.difficulty}`);
        console.log(`🚃 Route: ${journey.route}`);
        
        try {
            const calcRoute = new module.cCalcRoute();
            calcRoute.setupRoute(journey.route);
            
            // Analyze the route complexity
            const routeCount = calcRoute.getRouteCount();
            console.log(`🔄 Transfer points: ${Math.max(0, routeCount - 1)}`);
            
            // Calculate fare
            const fareInfo = calcRoute.calcFare();
            console.log(`💴 Total fare: ¥${fareInfo.fare}`);
            
            // Analyze route segments
            if (routeCount > 1) {
                console.log(`📊 Route analysis:`);
                
                // Try to show individual segments
                for (let i = 0; i < Math.min(routeCount, 5); i++) {
                    try {
                        const routeItem = calcRoute.getRouteItem(i);
                        if (routeItem && routeItem.isValid()) {
                            const stationName = module.getStationName(routeItem.stationId);
                            const lineName = module.getLineName(routeItem.lineId);
                            console.log(`   ${i + 1}. ${stationName} via ${lineName} (¥${routeItem.fare})`);
                        }
                    } catch (error) {
                        console.log(`   ${i + 1}. Segment analysis not available`);
                    }
                }
                
                if (routeCount > 5) {
                    console.log(`   ... and ${routeCount - 5} more segments`);
                }
            }
            
            // Calculate time and cost efficiency
            const farePerSegment = routeCount > 0 ? Math.round(fareInfo.fare / routeCount) : 0;
            console.log(`📈 Avg fare per segment: ¥${farePerSegment}`);
            
            // Check for optimal routing
            if (fareInfo.isRule114Applied) {
                console.log('⚖️  Complex routing rule applied - system found optimal path');
            }
            
            // Practical advice
            console.log(`💡 Tips: ${journey.tips}`);
            
            // Estimate travel time (rough calculation based on segments)
            const estimatedTime = routeCount * 25 + Math.max(0, routeCount - 1) * 10; // 25 min per segment + 10 min transfer
            console.log(`⏱️  Estimated travel time: ~${estimatedTime} minutes`);
            
        } catch (error) {
            console.log(`❌ Route calculation failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    console.log('🗺️  Complex Journey Planning Tips:');
    console.log('   • Use IC card (Suica/Pasmo) for seamless transfers');
    console.log('   • Check last train times for return journeys');
    console.log('   • Download offline maps for backup navigation');
    console.log('   • Allow buffer time for unexpected delays');
    console.log('   • Consider taxi for final segments if cost-effective');
    console.log('\n');
}

/**
 * Business Travel Optimization Scenarios
 * 
 * Demonstrates cost optimization strategies for business travelers
 * with different priorities and constraints.
 */
async function demonstrateBusinessTravelOptimization(module: FarertModule): Promise<void> {
    console.log('=== Business Travel Optimization ===\n');
    
    const businessScenarios = [
        {
            name: 'Executive Same-Day Return',
            description: 'High-priority meeting requiring same-day return',
            routes: ['東京 東海道新幹線 大阪', '大阪 東海道新幹線 東京'],
            priority: 'Speed over cost',
            considerations: 'Flexibility, comfort, time efficiency'
        },
        {
            name: 'Sales Team Regional Tour',
            description: 'Multiple cities in one trip',
            routes: ['東京 東海道新幹線 名古屋', '名古屋 東海道新幹線 京都', '京都 東海道新幹線 東京'],
            priority: 'Route optimization',
            considerations: 'Multiple destinations, luggage handling'
        },
        {
            name: 'Budget-Conscious Startup',
            description: 'Cost-effective travel for small company',
            routes: ['東京 東海道線 大阪'],
            priority: 'Minimum cost',
            considerations: 'Long travel time acceptable, overnight possible'
        },
        {
            name: 'Conference Attendance',
            description: 'Multi-day conference with accommodation',
            routes: ['東京 東海道新幹線 京都'],
            priority: 'Balanced cost/convenience',
            considerations: 'One-way optimization, local transportation needs'
        }
    ];
    
    for (const scenario of businessScenarios) {
        console.log(`--- ${scenario.name} ---`);
        console.log(`📍 ${scenario.description}`);
        console.log(`🎯 Priority: ${scenario.priority}`);
        console.log(`📋 Considerations: ${scenario.considerations}`);
        
        let totalCost = 0;
        let totalSavings = 0;
        
        for (const [index, route] of scenario.routes.entries()) {
            console.log(`\n🚃 Route ${index + 1}: ${route}`);
            
            try {
                const calcRoute = new module.cCalcRoute();
                calcRoute.setLongRoute(true);
                calcRoute.setupRoute(route);
                
                const fareInfo = calcRoute.calcFare();
                console.log(`   💴 Fare: ¥${fareInfo.fare.toLocaleString()}`);
                totalCost += fareInfo.fare;
                
                // Check for business discounts
                if (fareInfo.availCountForFareOfStockDiscount > 0) {
                    console.log(`   🎫 ${fareInfo.availCountForFareOfStockDiscount} discount options available`);
                    
                    try {
                        if (typeof fareInfo.fareForStockDiscount === 'function') {
                            const discountFare = fareInfo.fareForStockDiscount(0);
                            const savings = fareInfo.fare - discountFare;
                            totalSavings += savings;
                            console.log(`   💰 Best discount: ¥${discountFare.toLocaleString()} (save ¥${savings})`);
                        }
                    } catch (error) {
                        console.log('   ℹ️  Discount details not accessible');
                    }
                }
                
                // Special rules analysis
                if (fareInfo.isRule114Applied) {
                    console.log('   ⚖️  Optimal routing rule applied');
                }
                
            } catch (error) {
                console.log(`   ❌ Route calculation failed: ${error.message}`);
            }
        }
        
        console.log(`\n💼 Trip Summary:`);
        console.log(`   Total cost: ¥${totalCost.toLocaleString()}`);
        if (totalSavings > 0) {
            console.log(`   Potential savings: ¥${totalSavings.toLocaleString()}`);
            console.log(`   Optimized cost: ¥${(totalCost - totalSavings).toLocaleString()}`);
        }
        
        // Business travel recommendations
        console.log(`\n📊 Business Analysis:`);
        if (scenario.priority === 'Speed over cost') {
            console.log('   ✅ Shinkansen recommended despite higher cost');
            console.log('   ⏱️  Time savings justify expense');
        } else if (scenario.priority === 'Minimum cost') {
            console.log('   💰 Regular lines provide significant savings');
            console.log('   📅 Consider overnight travel to save accommodation');
        } else {
            console.log('   ⚖️  Balanced approach: moderate speed with reasonable cost');
        }
        
        console.log('');
    }
    
    console.log('💼 Business Travel Best Practices:');
    console.log('   • Book refundable tickets for meeting schedule changes');
    console.log('   • Consider corporate discounts and bulk purchasing');
    console.log('   • Factor in productivity during travel (Shinkansen WiFi)');
    console.log('   • Account for local transportation at destination');
    console.log('   • Track expenses for tax and reimbursement purposes');
    console.log('\n');
}

/**
 * Tourism Route Planning Scenarios
 * 
 * Demonstrates route planning for tourists with focus on
 * sightseeing, cultural experiences, and cost-effective travel.
 */
async function demonstrateTourismRouting(module: FarertModule): Promise<void> {
    console.log('=== Tourism Route Planning ===\n');
    
    const touristRoutes = [
        {
            name: 'Classic Golden Route',
            description: 'Tokyo → Mt. Fuji → Kyoto → Osaka circuit',
            routes: ['東京 東海道線 熱海', '熱海 東海道線 京都', '京都 東海道線 大阪'],
            duration: '7-10 days',
            highlights: 'Traditional culture, modern cities, scenic beauty',
            jrPassRecommended: true
        },
        {
            name: 'Tokyo Day Trip Circuit',
            description: 'Multiple Tokyo attractions in one day',
            routes: ['新宿 山手線 渋谷', '渋谷 山手線 上野', '上野 山手線 東京'],
            duration: '1 day',
            highlights: 'Urban exploration, shopping, museums',
            jrPassRecommended: false
        },
        {
            name: 'Kansai Cultural Tour',
            description: 'Historical cities of western Japan',
            routes: ['大阪 東海道線 京都', '京都 奈良線 奈良', '奈良 関西線 大阪'],
            duration: '4-5 days',
            highlights: 'Temples, traditional architecture, ancient capital',
            jrPassRecommended: true
        },
        {
            name: 'Northern Japan Adventure',
            description: 'Tohoku region exploration',
            routes: ['東京 東北新幹線 仙台', '仙台 東北線 松島', '松島 東北線 仙台'],
            duration: '3-4 days',
            highlights: 'Scenic coastline, hot springs, regional cuisine',
            jrPassRecommended: true
        }
    ];
    
    for (const tour of touristRoutes) {
        console.log(`--- ${tour.name} ---`);
        console.log(`🎌 ${tour.description}`);
        console.log(`📅 Duration: ${tour.duration}`);
        console.log(`🏯 Highlights: ${tour.highlights}`);
        console.log(`🎫 JR Pass recommended: ${tour.jrPassRecommended ? 'Yes' : 'No'}`);
        
        let totalCost = 0;
        let jrPassValue = 0;
        
        for (const [index, route] of tour.routes.entries()) {
            console.log(`\n🚃 Day ${index + 1} route: ${route}`);
            
            try {
                const calcRoute = new module.cCalcRoute();
                calcRoute.setLongRoute(true);
                calcRoute.setupRoute(route);
                
                const fareInfo = calcRoute.calcFare();
                console.log(`   💴 Segment cost: ¥${fareInfo.fare.toLocaleString()}`);
                totalCost += fareInfo.fare;
                
                // For JR Pass calculation, assume JR lines are covered
                if (route.includes('新幹線') || route.includes('東海道線') || route.includes('東北線')) {
                    jrPassValue += fareInfo.fare;
                }
                
                // Tourist-specific information
                const routeScript = calcRoute.routeScript();
                if (routeScript && routeScript.trim()) {
                    console.log(`   📝 Route: ${routeScript}`);
                }
                
                // Check for tourist discounts
                if (fareInfo.availCountForFareOfStockDiscount > 0) {
                    console.log(`   🎁 Tourist discounts may be available`);
                }
                
            } catch (error) {
                console.log(`   ❌ Route calculation failed: ${error.message}`);
            }
        }
        
        console.log(`\n🧮 Tour Cost Analysis:`);
        console.log(`   Total individual tickets: ¥${totalCost.toLocaleString()}`);
        
        if (tour.jrPassRecommended) {
            // Rough JR Pass pricing (example values)
            const jrPass7Day = 29110; // Approximate 7-day JR Pass price
            const jrPass14Day = 46390; // Approximate 14-day JR Pass price
            
            console.log(`   JR Pass coverage value: ¥${jrPassValue.toLocaleString()}`);
            
            if (jrPassValue > jrPass7Day) {
                const savings = jrPassValue - jrPass7Day;
                console.log(`   💰 7-day JR Pass savings: ¥${savings.toLocaleString()}`);
                console.log('   ✅ JR Pass highly recommended!');
            } else {
                const difference = jrPass7Day - jrPassValue;
                console.log(`   💸 JR Pass would cost ¥${difference.toLocaleString()} more`);
                console.log('   ⚠️  Individual tickets may be better value');
            }
        }
        
        // Tourism-specific recommendations
        console.log(`\n🎒 Tourist Tips:`);
        if (tour.duration === '1 day') {
            console.log('   • Use IC card for easy transfers within city');
            console.log('   • Consider day passes for multiple short trips');
        } else {
            console.log('   • JR Pass provides flexibility for spontaneous trips');
            console.log('   • Book accommodation near major JR stations');
        }
        
        if (tour.routes.some(route => route.includes('新幹線'))) {
            console.log('   • Reserve Shinkansen seats during peak seasons');
            console.log('   • Enjoy station bento boxes for authentic experience');
        }
        
        console.log('   • Download offline maps and translation apps');
        console.log('   • Keep ticket stubs for expense tracking and memories');
        
        console.log('');
    }
    
    console.log('🗾 Tourism Planning Best Practices:');
    console.log('   • JR Pass cost-effective for 2+ long-distance trips');
    console.log('   • Book popular routes in advance (especially Shinkansen)');
    console.log('   • Consider regional passes for specific areas');
    console.log('   • Allow extra time for navigation and exploration');
    console.log('   • Combine efficient transport with local experiences');
    console.log('\n');
}

/**
 * Main demonstration function
 * Runs all realistic scenario examples
 */
async function runRealisticScenarios(): Promise<void> {
    console.log('🚀 WASM Object Classes - Realistic Japanese Railway Scenarios\n');
    console.log('Demonstrating real-world applications with actual Japanese routes and stations\n');
    
    try {
        // Initialize WebAssembly module
        console.log('🔄 Initializing WebAssembly module...');
        const module = await wasmLoader.loadModule();
        await wasmLoader.initializeDatabase();
        console.log('✅ WebAssembly module initialized\n');
        
        // Run all scenario demonstrations
        await demonstrateCommutingScenarios(module);
        await demonstrateLongDistanceTravel(module);
        await demonstrateComplexJourneys(module);
        await demonstrateBusinessTravelOptimization(module);
        await demonstrateTourismRouting(module);
        
        console.log('🎉 All realistic scenario demonstrations completed!');
        console.log('\n🎯 Key insights:');
        console.log('   • Route complexity significantly affects calculation time and accuracy');
        console.log('   • Discount availability varies greatly by route and operator');
        console.log('   • Special fare rules often apply to long-distance and complex routes');
        console.log('   • Business vs. tourism priorities require different optimization strategies');
        console.log('   • IC cards and JR Passes provide different value propositions');
        console.log('\n📚 Next steps:');
        console.log('   • See troubleshooting-examples.ts for error handling patterns');
        console.log('   • See framework-integration.ts for React/Vue implementation');
        console.log('   • See performance-optimization.ts for large-scale usage patterns');
        
        // Cleanup
        module.closeDatabase();
        console.log('✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error running realistic scenario examples:', error);
        process.exit(1);
    }
}

// Execute demonstrations if run directly
if (require.main === module) {
    runRealisticScenarios().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

// Export for use in other examples
export {
    demonstrateCommutingScenarios,
    demonstrateLongDistanceTravel,
    demonstrateComplexJourneys,
    demonstrateBusinessTravelOptimization,
    demonstrateTourismRouting,
    runRealisticScenarios
};