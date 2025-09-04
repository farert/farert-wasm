/**
 * Auto route functionality  
 * Equivalent to test_autoroute() functionality in original C++ test_exec.cpp
 * 
 * This module handles automatic route finding between stations
 */

import { FarertModule } from './types';
import { TestOutputWriter } from './test_output';

/**
 * Parse auto route options from option number
 */
function parseAutoRouteOptions(option: number): {
    zairaisen: boolean;
    shinkansen: boolean;
    companyLine: boolean;
    ruleAppliedOnly: boolean;
} {
    const baseOption = option & 0xFFFF;
    const ruleAppliedOnly = (option & 0x10000) !== 0;
    
    return {
        zairaisen: baseOption === 1 || baseOption === 0,
        shinkansen: baseOption === 2 || baseOption === 4 || baseOption === 0,
        companyLine: baseOption === 3 || baseOption === 4 || baseOption === 0, 
        ruleAppliedOnly: ruleAppliedOnly
    };
}

/**
 * Setup auto route (equivalent to auto route setup in original)
 */
function setupAutoRoute(fromStation: string, toStation: string, module: FarertModule): boolean {
    try {
        // Get station IDs
        const fromId = module.getStationId(fromStation);
        const toId = module.getStationId(toStation);
        
        if (fromId <= 0) {
            console.error(`From station not found: ${fromStation}`);
            return false;
        }
        
        if (toId <= 0) {
            console.error(`To station not found: ${toStation}`);
            return false;
        }
        
        // Create route and add stations for auto routing
        module.createRoute();
        
        // Add starting station
        const result1 = module.addRouteBegin(fromId);
        if (result1 <= 0) {
            console.error(`Failed to add starting station: ${fromStation}`);
            return false;
        }
        
        // Add destination station (with lineId=0 for auto-routing)
        const result2 = module.addRoute(0, toId);
        if (result2 <= 0) {
            console.error(`Failed to add destination station: ${toStation}`);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error setting up auto route:', error);
        return false;
    }
}

/**
 * Apply route options (equivalent to route option setting in original)
 */
function applyRouteOptions(options: {
    zairaisen: boolean;
    shinkansen: boolean; 
    companyLine: boolean;
    ruleAppliedOnly: boolean;
}, module: FarertModule): void {
    
    try {
        // Set long route option if needed
        if (module.setLongRoute) {
            module.setLongRoute(false); // Default to shortest route
        }
        
        // Set start/arrive as city options if available
        if (module.setStartAsCity) {
            module.setStartAsCity(false);
        }
        
        if (module.setArriveAsCity) {
            module.setArriveAsCity(false);
        }
        
        // Note: The original C++ had complex route option settings
        // that would need to be implemented based on the specific
        // WebAssembly API capabilities
        
    } catch (error) {
        console.error('Error applying route options:', error);
    }
}

/**
 * Execute auto route test (equivalent to test_autoroute in original C++)
 * 
 * @param routeDef Array with from station, to station, and additional parameters
 * @param option Option flags for route preferences and result format
 * @param module WebAssembly module instance  
 * @param output Optional output writer for file output
 */
export async function executeAutoRoute(
    routeDef: string[],
    option: number,
    module: FarertModule, 
    output?: TestOutputWriter
): Promise<void> {
    
    const fromStation = routeDef[0] || '';
    const toStation = routeDef[1] || '';
    
    if (fromStation.length === 0 || toStation.length === 0) {
        if (output) {
            output.writeError('AutoRoute', 'Missing from or to station');
        }
        return;
    }
    
    // Parse route options
    const routeOptions = parseAutoRouteOptions(option);
    
    // Write test header
    if (output) {
        output.writeSectionHeader(`Auto Route: ${fromStation} -> ${toStation}`);
    }
    
    // Setup auto route
    const setupSuccess = setupAutoRoute(fromStation, toStation, module);
    if (!setupSuccess) {
        const errorMsg = `Failed to setup auto route: ${fromStation} -> ${toStation}`;
        if (output) {
            output.writeError('AutoRoute', errorMsg);
        } else {
            console.error(errorMsg);
        }
        return;
    }
    
    // Apply route options
    applyRouteOptions(routeOptions, module);
    
    // Calculate route
    try {
        const calcResult = module.calculateFare();
        
        if (calcResult !== 1) {
            const errorMsg = `Failed to calculate auto route: ${fromStation} -> ${toStation}`;
            if (output) {
                output.writeError('AutoRoute', errorMsg);
            } else {
                console.error(errorMsg);
            }
            return;
        }
        
        // Get results
        const fareString = module.getFareString();
        const routeString = module.getRouteScript ? module.getRouteScript() : '';
        
        // Extract fare amount
        let fare = 0;
        const fareMatch = fareString.match(/(\\d+)/);
        if (fareMatch) {
            fare = parseInt(fareMatch[1], 10);
        }
        
        // Format options for display
        const optionsStr = [];
        if (routeOptions.zairaisen) optionsStr.push('zairaisen');
        if (routeOptions.shinkansen) optionsStr.push('shinkansen');
        if (routeOptions.companyLine) optionsStr.push('company-line');
        if (routeOptions.ruleAppliedOnly) optionsStr.push('rule-applied-only');
        
        // Output results
        if (output) {
            output.writeAutoRouteResult(
                fromStation,
                toStation,
                routeString,
                fare,
                optionsStr.join(', ')
            );
        } else {
            console.log(`Auto Route: ${fromStation} -> ${toStation}`);
            console.log(`Selected: ${routeString}`);
            console.log(`Fare: ¥${fare}`);
            console.log(`Options: ${optionsStr.join(', ')}`);
            console.log('---');
        }
        
    } catch (error) {
        const errorMsg = `Error calculating auto route: ${error}`;
        if (output) {
            output.writeError('AutoRoute', errorMsg);
        } else {
            console.error(errorMsg);
        }
    }
}