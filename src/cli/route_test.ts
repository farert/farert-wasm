/**
 * Route testing functionality
 * Equivalent to test_route() functionality in original C++ test_exec.cpp
 * 
 * This module handles normal route testing with various option flags
 */

import { FarertModule } from './types';
import { TestOutputWriter } from './test_output';

/**
 * Setup route from string definition (equivalent to test_setup_route in original)
 */
function setupRouteFromString(buffer: string, module: FarertModule): boolean {
    try {
        // Create new route
        module.createRoute();
        
        // Parse route string (format: "station1 line1 station2 line2 station3 ...")
        const tokens = buffer.trim().split(/\\s+/).filter(t => t.length > 0);
        
        if (tokens.length < 1) {
            return false;
        }
        
        // Process tokens in pairs: station, line, station, line, ...
        let stationAdded = false;
        
        for (let i = 0; i < tokens.length; i++) {
            if (i % 2 === 0) {
                // Even index: station
                const stationName = tokens[i];
                const stationId = module.getStationId(stationName);
                
                if (stationId <= 0) {
                    console.error(`Station not found: ${stationName}`);
                    return false;
                }
                
                if (!stationAdded) {
                    // First station - use addRouteBegin
                    const result = module.addRouteBegin(stationId);
                    if (result <= 0) {
                        console.error(`Failed to add starting station: ${stationName}`);
                        return false;
                    }
                    stationAdded = true;
                } else {
                    // Subsequent stations need line information
                    if (i === 0) continue; // Skip if this is somehow first
                    
                    const prevLineName = i > 1 ? tokens[i - 1] : '';
                    let lineId = 0;
                    
                    if (prevLineName && prevLineName.length > 0) {
                        lineId = module.getLineId ? module.getLineId(prevLineName) : 0;
                    }
                    
                    const result = module.addRoute(lineId, stationId);
                    if (result <= 0) {
                        console.error(`Failed to add station: ${stationName} via ${prevLineName}`);
                        return false;
                    }
                }
            }
            // Odd index: line name (processed with next station)
        }
        
        return true;
        
    } catch (error) {
        console.error('Error setting up route:', error);
        return false;
    }
}

/**
 * Calculate fare and get results
 */
function calculateAndGetResults(module: FarertModule): {
    success: boolean;
    fare: number;
    fareString: string;
    route: string;
} {
    try {
        // Calculate fare
        const calcResult = module.calculateFare();
        
        if (calcResult !== 1) {
            return {
                success: false,
                fare: 0,
                fareString: '',
                route: ''
            };
        }
        
        // Get fare amount and details
        const fareString = module.getFareString();
        const routeString = module.getRouteScript ? module.getRouteScript() : '';
        
        // Extract fare amount from fareString (basic parsing)
        let fare = 0;
        const fareMatch = fareString.match(/(\\d+)/);
        if (fareMatch) {
            fare = parseInt(fareMatch[1], 10);
        }
        
        return {
            success: true,
            fare: fare,
            fareString: fareString,
            route: routeString
        };
        
    } catch (error) {
        console.error('Error calculating fare:', error);
        return {
            success: false,
            fare: 0,
            fareString: '',
            route: ''
        };
    }
}

/**
 * Remove CR characters (equivalent to cr_remove in original)
 */
function crRemove(s: string): string {
    return s.replace(/\\r/g, ' ');
}

/**
 * Execute route test (equivalent to test_route in original C++)
 * 
 * @param routeDef Array with route definition and additional parameters
 * @param round Option flags for result format (0=all, 1=no return, 2=no rule, etc.)
 * @param module WebAssembly module instance
 * @param output Optional output writer for file output
 */
export async function executeRouteTest(
    routeDef: string[], 
    round: number, 
    module: FarertModule,
    output?: TestOutputWriter
): Promise<void> {
    
    const routeDefinition = routeDef[0] || '';
    
    if (routeDefinition.length === 0) {
        if (output) {
            output.writeError('RouteTest', 'Empty route definition');
        }
        return;
    }
    
    // Clean route definition
    const cleanRoute = crRemove(routeDefinition);
    
    // Write test header
    if (output) {
        output.writeRouteTestHeader('Route Test', cleanRoute);
    }
    
    // Setup route
    const setupSuccess = setupRouteFromString(cleanRoute, module);
    if (!setupSuccess) {
        const errorMsg = `Failed to setup route: ${cleanRoute}`;
        if (output) {
            output.writeError('RouteTest', errorMsg);
        } else {
            console.error(errorMsg);
        }
        return;
    }
    
    // Calculate fare
    const result = calculateAndGetResults(module);
    
    if (!result.success) {
        const errorMsg = `Failed to calculate fare for route: ${cleanRoute}`;
        if (output) {
            output.writeError('RouteTest', errorMsg);
        } else {
            console.error(errorMsg);
        }
        return;
    }
    
    // Apply round options (result format filtering)
    let shouldShowResult = true;
    let resultString = result.fareString;
    
    switch (round) {
        case 1: // no return
            // Filter out return trip information
            resultString = resultString.replace(/往復[^\\n]*/g, '');
            break;
        case 2: // no rule  
            // Filter out special rule information
            resultString = resultString.replace(/特例[^\\n]*/g, '');
            break;
        case 3: // no rule + no return
            resultString = resultString.replace(/往復[^\\n]*/g, '');
            resultString = resultString.replace(/特例[^\\n]*/g, '');
            break;
        case 4: // no no_rule
            // Show only special rule applications
            break;
        case 5: // no no_rule + no return
            resultString = resultString.replace(/往復[^\\n]*/g, '');
            break;
        default: // 0 or other: show all
            break;
    }
    
    if (shouldShowResult) {
        if (output) {
            output.writeRouteTestResult(
                cleanRoute,
                result.fare,
                0, // distance - would need additional calculation
                [], // companies - would need additional extraction
                resultString
            );
        } else {
            console.log(`Route: ${cleanRoute}`);
            console.log(`Fare: ¥${result.fare}`);
            console.log(`Details: ${resultString}`);
            console.log('---');
        }
    }
}