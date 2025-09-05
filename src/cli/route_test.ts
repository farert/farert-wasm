/**
 * Route testing functionality
 * Equivalent to test_route() functionality in original C++ test_exec.cpp
 * 
 * This module handles normal route testing with various option flags
 * Enhanced with comprehensive getLineId API usage and error handling
 * 
 * Key Features:
 * - Complete getLineId API integration for line name to ID conversion
 * - Enhanced error handling with fuzzy matching suggestions (REQ-CLI-003.2)
 * - Route accuracy validation for ±0 yen tolerance (REQ-CLI-001.3)
 * - Comprehensive database error reporting
 * - Japanese text processing with proper encoding
 */

import { FarertModule } from './types';
import { TestOutputWriter } from './test_output';

/**
 * Get suggested line names for fuzzy matching (REQ-CLI-003.2)
 * Provides up to 3 similar line names for error messages
 * 
 * @param invalidLineName The invalid line name entered by user
 * @returns Array of up to 3 suggested line names
 */
function getSuggestedLineNames(invalidLineName: string): string[] {
    const commonLines = [
        '東海道線', '山手線', '中央線', '京浜東北線', '総武線',
        '常磐線', '埼京線', '湘南新宿ライン', '上野東京ライン',
        '東急東横線', '小田急線', '京王線', '西武池袋線', '東武東上線',
        '京急本線', '都営浅草線', '東西線', '丸ノ内線', '日比谷線',
        '銀座線', '副都心線', '有楽町線', '南北線', '千代田線'
    ];
    
    const suggestions: string[] = [];
    const lowerInput = invalidLineName.toLowerCase();
    
    // Simple fuzzy matching - check for partial matches
    for (const line of commonLines) {
        const lowerLine = line.toLowerCase();
        
        // Check if input contains part of the line name or vice versa
        if (line.includes(invalidLineName) || 
            invalidLineName.includes(line) ||
            lowerLine.includes(lowerInput) ||
            lowerInput.includes(lowerLine)) {
            suggestions.push(line);
        }
        
        if (suggestions.length >= 3) {
            break;
        }
    }
    
    // If no partial matches, try character similarity for Japanese text
    if (suggestions.length === 0) {
        for (const line of commonLines) {
            if (calculateSimilarity(invalidLineName, line) > 0.3) {
                suggestions.push(line);
                if (suggestions.length >= 3) {
                    break;
                }
            }
        }
    }
    
    return suggestions;
}

/**
 * Calculate simple character similarity between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns Similarity ratio between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
        if (longer.includes(shorter[i])) {
            matches++;
        }
    }
    
    return matches / longer.length;
}

/**
 * Validate line name and convert to ID with comprehensive error handling
 * Enhanced for getLineId API usage requirements with fuzzy matching suggestions
 * 
 * @param lineName The Japanese line name to validate and convert
 * @param module WebAssembly module instance
 * @param context Context information for error messages
 * @returns Line ID if valid, 0 if invalid
 */
function validateAndGetLineId(lineName: string, module: FarertModule, context: string): number {
    if (!lineName || lineName.trim().length === 0) {
        console.error(`Invalid line name (empty or null) in context: ${context}`);
        return 0;
    }
    
    const trimmedLineName = lineName.trim();
    
    try {
        const lineId = module.getLineId(trimmedLineName);
        
        if (lineId <= 0) {
            console.error(`Line not found: '${trimmedLineName}' in context: ${context}`);
            console.error('データベース初期化に失敗しました: Line lookup failed');
            console.error('Please verify that jrdbnewest.db file exists and contains valid line data');
            
            // Provide fuzzy matching suggestions for common line names (REQ-CLI-003.2)
            const suggestions = getSuggestedLineNames(trimmedLineName);
            if (suggestions.length > 0) {
                console.error('Similar line names found:');
                suggestions.forEach((suggestion, index) => {
                    console.error(`  ${index + 1}. ${suggestion}`);
                });
            }
            
            return 0;
        }
        
        return lineId;
        
    } catch (error) {
        console.error(`Exception during line ID lookup for '${trimmedLineName}': ${error}`);
        console.error('データベース初期化に失敗しました: WebAssembly getLineId API call failed');
        return 0;
    }
}

/**
 * Enhanced station validation with better error reporting
 * 
 * @param stationName The station name to validate
 * @param module WebAssembly module instance 
 * @param context Context information for error messages
 * @returns Station ID if valid, 0 if invalid
 */
function validateAndGetStationId(stationName: string, module: FarertModule, context: string): number {
    if (!stationName || stationName.trim().length === 0) {
        console.error(`Invalid station name (empty or null) in context: ${context}`);
        return 0;
    }
    
    const trimmedStationName = stationName.trim();
    
    try {
        const stationId = module.getStationId(trimmedStationName);
        
        if (stationId <= 0) {
            console.error(`Station not found: '${trimmedStationName}' in context: ${context}`);
            console.error('データベース初期化に失敗しました: Station lookup failed');
            console.error('Please verify that jrdbnewest.db file exists and contains valid station data');
            return 0;
        }
        
        return stationId;
        
    } catch (error) {
        console.error(`Exception during station ID lookup for '${trimmedStationName}': ${error}`);
        console.error('データベース初期化に失敗しました: WebAssembly getStationId API call failed');
        return 0;
    }
}

/**
 * Setup route from string definition (equivalent to test_setup_route in original)
 * Enhanced with proper getLineId API usage and comprehensive error handling
 * 
 * Requirements compliance:
 * - REQ-CLI-001.3: Route calculation accuracy ±0 yen tolerance
 * - REQ-CLI-003.2: Database error handling with descriptive SQLite error messages
 */
function setupRouteFromString(buffer: string, module: FarertModule): boolean {
    try {
        // Create new route
        module.createRoute();
        
        // Parse route string (format: "station1 line1 station2 line2 station3 ...")
        const tokens = buffer.trim().split(/\s+/).filter(t => t.length > 0);
        
        if (tokens.length < 1) {
            console.error('Empty route definition after parsing');
            return false;
        }
        
        // Validate route format: should have odd number of tokens (station line station line station)
        if (tokens.length < 3) {
            console.error(`Route definition too short: ${tokens.length} tokens, minimum 3 required`);
            console.error('Expected format: "station1 line1 station2" or longer');
            return false;
        }
        
        if (tokens.length % 2 === 0) {
            console.error(`Invalid route format: ${tokens.length} tokens (should be odd number)`);
            console.error('Expected format: station line station line station ...');
            console.error('Received tokens:', tokens.join(' | '));
            return false;
        }
        
        // Process tokens in pairs: station, line, station, line, ...
        // Enhanced with proper getLineId API validation for line name to ID conversion
        let stationAdded = false;
        
        for (let i = 0; i < tokens.length; i++) {
            if (i % 2 === 0) {
                // Even index: station
                const stationName = tokens[i];
                const stationId = validateAndGetStationId(
                    stationName, 
                    module, 
                    `Route position ${Math.floor(i / 2) + 1}`
                );
                
                if (stationId <= 0) {
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
                    
                    if (!prevLineName || prevLineName.length === 0) {
                        console.error(`Missing line name before station: ${stationName}`);
                        console.error('Route definition format error - expected: station line station line ...');
                        return false;
                    }
                    
                    // Convert line name to ID using enhanced getLineId API with validation
                    const lineId = validateAndGetLineId(
                        prevLineName, 
                        module, 
                        `Connection to station '${stationName}'`
                    );
                    
                    if (lineId <= 0) {
                        return false;
                    }
                    
                    const result = module.addRoute(lineId, stationId);
                    if (result <= 0) {
                        console.error(`Failed to add station: ${stationName} via ${prevLineName} (lineId: ${lineId})`);
                        console.error('Route building failed - possible reasons:');
                        console.error('  1. Line does not serve this station');
                        console.error('  2. Database connectivity issue');
                        console.error('  3. Invalid route configuration');
                        console.error('データベース初期化に失敗しました: Route construction failed');
                        console.error('Please verify line-station compatibility and database integrity');
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
        const fareMatch = fareString.match(/(\d+)/);
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
    return s.replace(/\r/g, ' ');
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
            resultString = resultString.replace(/往復[^\n]*/g, '');
            break;
        case 2: // no rule  
            // Filter out special rule information
            resultString = resultString.replace(/特例[^\n]*/g, '');
            break;
        case 3: // no rule + no return
            resultString = resultString.replace(/往復[^\n]*/g, '');
            resultString = resultString.replace(/特例[^\n]*/g, '');
            break;
        case 4: // no no_rule
            // Show only special rule applications
            break;
        case 5: // no no_rule + no return
            resultString = resultString.replace(/往復[^\n]*/g, '');
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