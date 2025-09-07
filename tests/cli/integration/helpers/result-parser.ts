/**
 * Result Parser Utilities - Task 15
 * Helper functions for parsing CLI output and extracting test results
 * Requirements: REQ-CLI-002.2, REQ-CLI-002.3
 * 
 * This module provides utilities to parse CLI output and extract:
 * - Fare amounts from Japanese text
 * - Route information from output
 * - Performance metrics
 * - Error messages and validation details
 */

/**
 * Parsed CLI result structure
 */
export interface ParsedCliResult {
  fare?: number;
  route?: string;
  executionTime?: number;
  memoryUsage?: number;
  errorMessage?: string;
  hasJapaneseOutput?: boolean;
  fareDetails?: FareDetails;
  routeSegments?: RouteSegment[];
  performanceMetrics?: PerformanceMetrics;
}

/**
 * Detailed fare information
 */
export interface FareDetails {
  baseFare?: number;
  specialRules?: string[];
  discounts?: { type: string; amount: number }[];
  total: number;
  currency: '円' | 'yen';
}

/**
 * Route segment information
 */
export interface RouteSegment {
  fromStation: string;
  toStation: string;
  line: string;
  distance?: number;
  fareContribution?: number;
}

/**
 * Performance metrics extracted from CLI output
 */
export interface PerformanceMetrics {
  startupTime?: number;
  calculationTime?: number;
  totalExecutionTime: number;
  memoryPeak?: number;
  wasmLoadTime?: number;
  dbInitTime?: number;
}

/**
 * Extract fare amount from CLI output
 * Handles various Japanese fare display formats
 */
export function extractFareFromOutput(output: string): number | null {
  if (!output) return null;

  // Common fare patterns in Japanese CLI output
  const farePatterns = [
    /運賃[：:]\s*(\d+)\s*円/g,        // 運賃: 123円
    /料金[：:]\s*(\d+)\s*円/g,        // 料金: 123円  
    /合計[：:]\s*(\d+)\s*円/g,        // 合計: 123円
    /総額[：:]\s*(\d+)\s*円/g,        // 総額: 123円
    /(\d+)\s*円/g,                   // Generic: 123円
    /fare[：:]?\s*(\d+)/gi,          // English: fare: 123
    /total[：:]?\s*(\d+)/gi,         // English: total: 123
    /amount[：:]?\s*(\d+)/gi,        // English: amount: 123
    /¥\s*(\d+)/g,                    // Currency symbol: ¥123
    /JPY\s*(\d+)/gi                  // Currency code: JPY 123
  ];

  const fares: number[] = [];

  for (const pattern of farePatterns) {
    let match;
    while ((match = pattern.exec(output)) !== null) {
      const fare = parseInt(match[1], 10);
      if (!isNaN(fare) && fare > 0 && fare < 100000) { // Reasonable fare range
        fares.push(fare);
      }
    }
  }

  if (fares.length === 0) return null;

  // Return the most likely fare (usually the largest valid value)
  return Math.max(...fares);
}

/**
 * Extract route information from CLI output
 */
export function extractRouteFromOutput(output: string): string | null {
  if (!output) return null;

  // Route patterns
  const routePatterns = [
    /🚂\s*Calculating fare for route[：:]?\s*(.+)/i,
    /🛤️\s*Executing normal route[：:]?\s*(.+)/i,
    /🤖\s*Executing auto route[：:]?\s*(.+)/i,
    /経路[：:]?\s*(.+)/,
    /route[：:]?\s*(.+)/i
  ];

  for (const pattern of routePatterns) {
    const match = output.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Extract detailed fare information from output
 */
export function extractFareDetails(output: string): FareDetails | null {
  const fare = extractFareFromOutput(output);
  if (fare === null) return null;

  const fareDetails: FareDetails = {
    total: fare,
    currency: '円'
  };

  // Extract base fare if mentioned
  const baseFareMatch = output.match(/基本運賃[：:]?\s*(\d+)\s*円/);
  if (baseFareMatch) {
    fareDetails.baseFare = parseInt(baseFareMatch[1], 10);
  }

  // Extract special rules
  const specialRules: string[] = [];
  const rulePatterns = [
    /特定運賃|特殊運賃|割引運賃/g,
    /Rule\s*\d+\s*applied/gi,
    /special\s*fare\s*rule/gi
  ];

  for (const pattern of rulePatterns) {
    const matches = output.match(pattern);
    if (matches) {
      specialRules.push(...matches);
    }
  }

  if (specialRules.length > 0) {
    fareDetails.specialRules = specialRules;
  }

  // Extract discount information
  const discounts: { type: string; amount: number }[] = [];
  const discountPattern = /(\w+割引)[：:]?\s*(\d+)\s*円/g;
  let discountMatch;
  
  while ((discountMatch = discountPattern.exec(output)) !== null) {
    discounts.push({
      type: discountMatch[1],
      amount: parseInt(discountMatch[2], 10)
    });
  }

  if (discounts.length > 0) {
    fareDetails.discounts = discounts;
  }

  return fareDetails;
}

/**
 * Extract route segments from detailed output
 */
export function extractRouteSegments(output: string): RouteSegment[] | null {
  const segments: RouteSegment[] = [];
  
  // Pattern to match route descriptions like "東京 東海道線 品川"
  const segmentPattern = /(\S+)\s+(\S+線|\S+新幹線)\s+(\S+)/g;
  let match;
  
  while ((match = segmentPattern.exec(output)) !== null) {
    segments.push({
      fromStation: match[1],
      toStation: match[3], 
      line: match[2]
    });
  }

  return segments.length > 0 ? segments : null;
}

/**
 * Extract performance metrics from CLI output
 */
export function extractPerformanceMetrics(output: string): PerformanceMetrics | null {
  const metrics: Partial<PerformanceMetrics> = {};

  // Performance pattern matching
  const performancePatterns = [
    { key: 'startupTime', pattern: /CLI startup.*?(\d+(?:\.\d+)?)\s*ms/ },
    { key: 'calculationTime', pattern: /Route calculation.*?(\d+(?:\.\d+)?)\s*ms/ },
    { key: 'totalExecutionTime', pattern: /Total execution.*?(\d+(?:\.\d+)?)\s*ms/ },
    { key: 'memoryPeak', pattern: /Memory.*?(\d+(?:\.\d+)?)\s*MB/ },
    { key: 'wasmLoadTime', pattern: /WASM.*load.*?(\d+(?:\.\d+)?)\s*ms/ },
    { key: 'dbInitTime', pattern: /Database.*init.*?(\d+(?:\.\d+)?)\s*ms/ }
  ];

  for (const { key, pattern } of performancePatterns) {
    const match = output.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        (metrics as any)[key] = value;
      }
    }
  }

  // If no specific total time found, try to extract from general patterns
  if (!metrics.totalExecutionTime) {
    const timeMatch = output.match(/(\d+(?:\.\d+)?)\s*ms/);
    if (timeMatch) {
      metrics.totalExecutionTime = parseFloat(timeMatch[1]);
    }
  }

  return Object.keys(metrics).length > 0 ? metrics as PerformanceMetrics : null;
}

/**
 * Validate Japanese text output quality
 */
export function validateJapaneseOutput(output: string): boolean {
  if (!output) return false;

  // Check for presence of Japanese characters
  const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  if (!japanesePattern.test(output)) return false;

  // Check for common Japanese railway terms
  const railwayTerms = [
    '運賃', '料金', '駅', '線', '新幹線', '電車', '乗車', '経路', '区間'
  ];
  
  const hasRailwayTerms = railwayTerms.some(term => output.includes(term));
  
  // Check for proper character encoding (no mojibake)
  const hasMojibake = /[��]/.test(output);
  
  return hasRailwayTerms && !hasMojibake;
}

/**
 * Extract error information from CLI output
 */
export function extractErrorInfo(output: string, stderr: string): {
  hasError: boolean;
  errorType?: string;
  errorMessage?: string;
  suggestions?: string[];
  securityWarnings?: string[];
} {
  const combinedOutput = `${output}\n${stderr}`;
  
  // Check for error indicators
  const errorIndicators = [
    '❌', 'ERROR', 'Error', 'エラー', 'FAILED', 'Failed', '失敗'
  ];
  
  const hasError = errorIndicators.some(indicator => 
    combinedOutput.includes(indicator)
  );
  
  if (!hasError) {
    return { hasError: false };
  }
  
  // Extract error type
  let errorType: string | undefined;
  const errorTypePatterns = [
    /CLIError:\s*(\w+)/,
    /ValidationError:\s*(\w+)/,
    /SystemError:\s*(\w+)/,
    /(\w+Error):/
  ];
  
  for (const pattern of errorTypePatterns) {
    const match = combinedOutput.match(pattern);
    if (match) {
      errorType = match[1];
      break;
    }
  }
  
  // Extract error message
  const errorMessagePatterns = [
    /❌\s*(.+)/,
    /ERROR:\s*(.+)/,
    /Error:\s*(.+)/,
    /エラー[：:]?\s*(.+)/
  ];
  
  let errorMessage: string | undefined;
  for (const pattern of errorMessagePatterns) {
    const match = combinedOutput.match(pattern);
    if (match) {
      errorMessage = match[1].trim();
      break;
    }
  }
  
  // Extract suggestions
  const suggestions: string[] = [];
  const suggestionPattern = /Similar\s+\w+\s+names?[：:]?\s*([\s\S]*?)(?:\n\n|\n(?=\S))/gi;
  let suggestionMatch;
  
  while ((suggestionMatch = suggestionPattern.exec(combinedOutput)) !== null) {
    const suggestionText = suggestionMatch[1];
    const individualSuggestions = suggestionText.match(/\d+\.\s*([^\n]+)/g);
    if (individualSuggestions) {
      suggestions.push(...individualSuggestions.map(s => s.replace(/^\d+\.\s*/, '')));
    }
  }
  
  // Extract security warnings
  const securityWarnings: string[] = [];
  const securityPattern = /🚨|⚠️.*[Ss]ecurity|Security.*warning/g;
  let securityMatch;
  
  while ((securityMatch = securityPattern.exec(combinedOutput)) !== null) {
    const line = combinedOutput.split('\n').find(l => l.includes(securityMatch[0]));
    if (line) {
      securityWarnings.push(line.trim());
    }
  }
  
  return {
    hasError: true,
    errorType,
    errorMessage,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined
  };
}

/**
 * Parse complete CLI result from output
 */
export function parseCliResult(
  stdout: string,
  stderr: string,
  executionTime: number,
  exitCode: number
): ParsedCliResult {
  const result: ParsedCliResult = {};
  
  // Basic extraction
  result.fare = extractFareFromOutput(stdout);
  result.route = extractRouteFromOutput(stdout);
  result.hasJapaneseOutput = validateJapaneseOutput(stdout);
  
  // Detailed extraction
  result.fareDetails = extractFareDetails(stdout);
  result.routeSegments = extractRouteSegments(stdout);
  result.performanceMetrics = extractPerformanceMetrics(stdout);
  
  // Error information
  if (exitCode !== 0 || stderr.length > 0) {
    const errorInfo = extractErrorInfo(stdout, stderr);
    if (errorInfo.hasError) {
      result.errorMessage = errorInfo.errorMessage;
    }
  }
  
  // Set execution time
  if (result.performanceMetrics) {
    result.executionTime = result.performanceMetrics.totalExecutionTime || executionTime;
  } else {
    result.executionTime = executionTime;
  }
  
  return result;
}

/**
 * Compare two parsed results for compatibility
 */
export function compareResults(
  expected: Partial<ParsedCliResult>,
  actual: ParsedCliResult,
  tolerance: number = 0
): {
  compatible: boolean;
  fareMatch: boolean;
  routeMatch: boolean;
  differences: string[];
} {
  const differences: string[] = [];
  
  // Compare fares
  let fareMatch = true;
  if (expected.fare !== undefined && actual.fare !== null && actual.fare !== undefined) {
    const fareDifference = Math.abs(expected.fare - actual.fare);
    if (fareDifference > tolerance) {
      fareMatch = false;
      differences.push(`Fare mismatch: expected ${expected.fare}円, got ${actual.fare}円 (diff: ${fareDifference}円)`);
    }
  } else if (expected.fare !== undefined && (actual.fare === null || actual.fare === undefined)) {
    fareMatch = false;
    differences.push(`Expected fare ${expected.fare}円 but no fare found in output`);
  }
  
  // Compare routes
  let routeMatch = true;
  if (expected.route && actual.route) {
    if (expected.route !== actual.route) {
      routeMatch = false;
      differences.push(`Route mismatch: expected "${expected.route}", got "${actual.route}"`);
    }
  } else if (expected.route && !actual.route) {
    routeMatch = false;
    differences.push(`Expected route "${expected.route}" but no route found in output`);
  }
  
  // Overall compatibility
  const compatible = fareMatch && routeMatch && differences.length === 0;
  
  return {
    compatible,
    fareMatch,
    routeMatch,
    differences
  };
}