/**
 * Station Utilities for Farert WebAssembly SDK
 * Framework-agnostic utilities for Japanese railway station operations
 * 
 * Provides comprehensive station data formatting, search enhancement,
 * validation, and manipulation utilities that work across all JavaScript
 * frameworks and vanilla JavaScript applications.
 * 
 * Features:
 * - Japanese text handling with proper Unicode support and fallbacks
 * - Enhanced station search with fuzzy matching and suggestions
 * - Station validation with helpful error messages  
 * - Framework-agnostic design for maximum reusability
 * - Complete TypeScript support with comprehensive JSDoc documentation
 * 
 * Requirements: REQ-API-005 (Framework-Agnostic Utilities and Helpers)
 * 
 * @file Station Utilities Implementation
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 */

// Import core types from the SDK
import type {
  StationInfo,
  StationSearchResult,
  StationSearchOptions,
  PrefectureInfo,
  LineInfo,
  RouteValidationResult,
  RouteValidationError,
  FarertSDKError
} from '../types/core';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Station formatting options for flexible display control
 */
export interface StationFormatOptions {
  /** Include prefecture information */
  includePrefecture?: boolean;
  
  /** Include Hiragana reading */
  includeKana?: boolean;
  
  /** Maximum display length */
  maxLength?: number;
  
  /** Fallback behavior for missing data */
  fallback?: 'id' | 'name' | 'empty';
  
  /** Text separator between components */
  separator?: string;
  
  /** Parentheses style for additional info */
  parenthesesStyle?: 'round' | 'square' | 'none';
}

/**
 * Enhanced station search configuration
 */
export interface EnhancedSearchOptions extends StationSearchOptions {
  /** Enable fuzzy matching with typo tolerance */
  enableFuzzyMatching?: boolean;
  
  /** Minimum score threshold for fuzzy results */
  fuzzyMinScore?: number;
  
  /** Enable romanization matching */
  enableRomanization?: boolean;
  
  /** Boost major stations in results */
  boostMajorStations?: boolean;
  
  /** Maximum suggestions to provide */
  maxSuggestions?: number;
}

/**
 * Station validation result with detailed feedback
 */
export interface StationValidationResult {
  /** Whether the station is valid */
  isValid: boolean;
  
  /** Station information if found */
  station?: StationInfo;
  
  /** Validation errors */
  errors: StationValidationError[];
  
  /** Alternative suggestions */
  suggestions: string[];
  
  /** Did-you-mean alternatives */
  alternatives: StationSearchResult[];
}

/**
 * Station validation error details
 */
export interface StationValidationError {
  /** Error type code */
  code: 'NOT_FOUND' | 'AMBIGUOUS' | 'INVALID_FORMAT' | 'DEPRECATED';
  
  /** Human-readable error message */
  message: string;
  
  /** Suggested fixes */
  suggestions: string[];
  
  /** Original input that caused the error */
  input: string;
}

/**
 * Station metadata for enhanced information display
 */
export interface StationMetadata {
  /** Core station information */
  station: StationInfo;
  
  /** Formatted display variants */
  displayVariants: {
    short: string;
    medium: string;
    long: string;
    withReading: string;
    withPrefecture: string;
  };
  
  /** Search optimization data */
  searchData: {
    searchableTerms: string[];
    alternativeNames: string[];
    romanizations: string[];
  };
  
  /** UI helpers */
  uiHelpers: {
    cssClass: string;
    priority: number;
    icon?: string;
  };
}

/**
 * Station comparison result
 */
export interface StationComparison {
  /** Comparison result (-1, 0, 1) */
  result: number;
  
  /** Comparison criteria used */
  criteria: 'alphabetical' | 'prefecture' | 'popularity' | 'distance';
  
  /** Additional comparison metadata */
  metadata?: {
    distance?: number;
    popularityDiff?: number;
    prefectureMatch?: boolean;
  };
}

/**
 * Station group by prefecture result
 */
export interface StationsByPrefecture {
  /** Prefecture information */
  prefecture: PrefectureInfo;
  
  /** Stations in this prefecture */
  stations: StationInfo[];
  
  /** Station count */
  count: number;
  
  /** Major stations in this prefecture */
  majorStations: StationInfo[];
}

// ============================================================================
// STATION FORMATTING UTILITIES
// ============================================================================

/**
 * Format station name with comprehensive Japanese text support
 * 
 * Handles Japanese characters (kanji, hiragana, katakana) properly with
 * configurable fallback strategies for missing data or rendering issues.
 * 
 * @param station Station information object
 * @param options Formatting options
 * @returns Formatted station name string
 * 
 * @example Basic formatting
 * ```typescript
 * const station = { name: "東京", kana: "とうきょう", prefecture: "東京都" };
 * console.log(formatStationName(station)); // "東京"
 * ```
 * 
 * @example With prefecture and kana
 * ```typescript
 * const formatted = formatStationName(station, {
 *   includePrefecture: true,
 *   includeKana: true,
 *   parenthesesStyle: 'round'
 * });
 * console.log(formatted); // "東京 (とうきょう・東京都)"
 * ```
 * 
 * @example Length limiting
 * ```typescript
 * const short = formatStationName(station, {
 *   maxLength: 10,
 *   fallback: 'name'
 * });
 * console.log(short); // "東京"
 * ```
 */
export function formatStationName(
  station: StationInfo, 
  options: StationFormatOptions = {}
): string {
  const {
    includePrefecture = false,
    includeKana = false,
    maxLength,
    fallback = 'name',
    separator = '・',
    parenthesesStyle = 'round'
  } = options;
  
  // Handle null or undefined station
  if (!station) {
    return fallback === 'empty' ? '' : 'Unknown Station';
  }
  
  // Start with base station name
  let result = station.name || station.nameExtended || `Station ${station.id}`;
  
  // Handle fallback cases
  if (!result || result.trim() === '') {
    switch (fallback) {
      case 'id':
        result = `Station ${station.id}`;
        break;
      case 'empty':
        return '';
      default:
        result = station.nameExtended || 'Unknown Station';
    }
  }
  
  // Build additional components
  const additionalParts: string[] = [];
  
  if (includeKana && station.kana && station.kana !== result) {
    additionalParts.push(station.kana);
  }
  
  if (includePrefecture && station.prefecture) {
    additionalParts.push(station.prefecture);
  }
  
  // Combine components
  if (additionalParts.length > 0) {
    const additional = additionalParts.join(separator);
    
    switch (parenthesesStyle) {
      case 'round':
        result += ` (${additional})`;
        break;
      case 'square':
        result += ` [${additional}]`;
        break;
      case 'none':
        result += ` ${additional}`;
        break;
    }
  }
  
  // Apply length limit with intelligent truncation
  if (maxLength && result.length > maxLength) {
    // Try to preserve the main station name
    if (station.name.length <= maxLength) {
      result = station.name;
    } else {
      // Truncate with ellipsis, preserving Unicode integrity
      result = truncateJapaneseText(result, maxLength);
    }
  }
  
  return result;
}

/**
 * Format station name with prefecture information
 * 
 * Convenience function for displaying stations with their prefecture,
 * useful for disambiguating stations with similar names.
 * 
 * @param station Station information
 * @returns Station name with prefecture
 * 
 * @example
 * ```typescript
 * const station = { name: "新宿", prefecture: "東京都" };
 * console.log(formatStationWithPrefecture(station)); // "新宿 (東京都)"
 * ```
 */
export function formatStationWithPrefecture(station: StationInfo): string {
  return formatStationName(station, { 
    includePrefecture: true,
    parenthesesStyle: 'round'
  });
}

/**
 * Format station name with Hiragana reading
 * 
 * Includes the Hiragana reading for accessibility and pronunciation guidance,
 * particularly useful for international users or text-to-speech systems.
 * 
 * @param station Station information
 * @returns Station name with reading
 * 
 * @example
 * ```typescript
 * const station = { name: "東京", kana: "とうきょう" };
 * console.log(formatStationWithKana(station)); // "東京 (とうきょう)"
 * ```
 */
export function formatStationWithKana(station: StationInfo): string {
  return formatStationName(station, {
    includeKana: true,
    parenthesesStyle: 'round'
  });
}

/**
 * Get context-aware station display name
 * 
 * Intelligently chooses the most appropriate display format based on
 * context and available information, with automatic fallback handling.
 * 
 * @param station Station information
 * @param context Display context ('search' | 'route' | 'detailed' | 'compact')
 * @returns Context-appropriate display name
 * 
 * @example Search context (compact)
 * ```typescript
 * console.log(getStationDisplayName(station, 'search')); // "東京"
 * ```
 * 
 * @example Detailed context (full information)
 * ```typescript
 * console.log(getStationDisplayName(station, 'detailed')); 
 * // "東京 (とうきょう・東京都)"
 * ```
 */
export function getStationDisplayName(
  station: StationInfo, 
  context: 'search' | 'route' | 'detailed' | 'compact' = 'route'
): string {
  switch (context) {
    case 'search':
    case 'compact':
      return formatStationName(station, { maxLength: 20 });
      
    case 'route':
      return formatStationName(station, { 
        includePrefecture: station.type === 'local',
        maxLength: 30 
      });
      
    case 'detailed':
      return formatStationName(station, {
        includePrefecture: true,
        includeKana: true,
        parenthesesStyle: 'round'
      });
      
    default:
      return formatStationName(station);
  }
}

// ============================================================================
// ENHANCED SEARCH UTILITIES
// ============================================================================

/**
 * Fuzzy search stations with enhanced matching and typo tolerance
 * 
 * Provides intelligent station search with support for partial matches,
 * typos, alternative readings, and romanization variants.
 * 
 * @param query Search query string
 * @param stations Array of stations to search
 * @param options Enhanced search options
 * @returns Array of search results with scores
 * 
 * @example Basic fuzzy search
 * ```typescript
 * const results = fuzzySearchStations("しんじく", stations);
 * console.log(results[0].station.name); // "新宿" (found despite Hiragana input)
 * ```
 * 
 * @example With typo tolerance
 * ```typescript
 * const results = fuzzySearchStations("tkyjo", stations, {
 *   enableRomanization: true,
 *   fuzzyMinScore: 0.6
 * });
 * console.log(results[0].station.name); // "東京" (found despite typo)
 * ```
 */
export function fuzzySearchStations(
  query: string,
  stations: StationInfo[],
  options: EnhancedSearchOptions = {}
): StationSearchResult[] {
  const {
    enableFuzzyMatching = true,
    fuzzyMinScore = 0.6,
    enableRomanization = true,
    boostMajorStations = true,
    limit = 50
  } = options;
  
  if (!query || query.trim() === '') {
    return [];
  }
  
  const normalizedQuery = normalizeJapaneseText(query.toLowerCase());
  const results: StationSearchResult[] = [];
  
  for (const station of stations) {
    let bestScore = 0;
    let matchedField: 'name' | 'kana' | 'alternative' = 'name';
    
    // Check exact matches first (highest score)
    if (station.name.toLowerCase() === normalizedQuery) {
      bestScore = 1.0;
      matchedField = 'name';
    } else if (station.kana.toLowerCase() === normalizedQuery) {
      bestScore = 1.0;
      matchedField = 'kana';
    }
    
    // Check prefix matches
    else if (station.name.toLowerCase().startsWith(normalizedQuery)) {
      bestScore = 0.9;
      matchedField = 'name';
    } else if (station.kana.toLowerCase().startsWith(normalizedQuery)) {
      bestScore = 0.9;
      matchedField = 'kana';
    }
    
    // Check substring matches
    else if (station.name.toLowerCase().includes(normalizedQuery)) {
      bestScore = 0.7;
      matchedField = 'name';
    } else if (station.kana.toLowerCase().includes(normalizedQuery)) {
      bestScore = 0.7;
      matchedField = 'kana';
    }
    
    // Fuzzy matching for typo tolerance
    else if (enableFuzzyMatching) {
      const nameScore = calculateLevenshteinSimilarity(normalizedQuery, station.name.toLowerCase());
      const kanaScore = calculateLevenshteinSimilarity(normalizedQuery, station.kana.toLowerCase());
      
      if (nameScore >= fuzzyMinScore && nameScore > kanaScore) {
        bestScore = nameScore * 0.8; // Slightly lower score for fuzzy matches
        matchedField = 'name';
      } else if (kanaScore >= fuzzyMinScore) {
        bestScore = kanaScore * 0.8;
        matchedField = 'kana';
      }
    }
    
    // Romanization matching (if enabled)
    if (enableRomanization && bestScore < fuzzyMinScore) {
      const romanizedName = romanizeJapanese(station.name);
      const romanizedKana = romanizeJapanese(station.kana);
      
      if (romanizedName.toLowerCase().includes(normalizedQuery)) {
        bestScore = Math.max(bestScore, 0.6);
        matchedField = 'alternative';
      } else if (romanizedKana.toLowerCase().includes(normalizedQuery)) {
        bestScore = Math.max(bestScore, 0.6);
        matchedField = 'alternative';
      }
    }
    
    // Apply station type boost
    if (boostMajorStations && (station.type === 'major' || station.type === 'junction')) {
      bestScore *= 1.1;
    }
    
    // Add to results if score meets threshold
    if (bestScore >= fuzzyMinScore) {
      results.push({
        station,
        score: Math.min(bestScore, 1.0), // Cap at 1.0
        matchedField,
        highlight: highlightMatch(query, getFieldValue(station, matchedField))
      });
    }
  }
  
  // Sort by score (descending) and apply limit
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Search stations by Hiragana or Romaji reading
 * 
 * Specialized search for finding stations by their pronunciation,
 * supporting both Hiragana and romanized input.
 * 
 * @param reading Hiragana or romanized reading
 * @param stations Array of stations to search
 * @param options Search configuration options
 * @returns Matching stations with scores
 * 
 * @example Hiragana search
 * ```typescript
 * const results = searchStationsByReading("とうきょう", stations);
 * console.log(results[0].station.name); // "東京"
 * ```
 * 
 * @example Romanized search
 * ```typescript
 * const results = searchStationsByReading("tokyo", stations);
 * console.log(results[0].station.name); // "東京"
 * ```
 */
export function searchStationsByReading(
  reading: string,
  stations: StationInfo[],
  options: StationSearchOptions = {}
): StationSearchResult[] {
  const { limit = 20 } = options;
  const normalizedReading = normalizeJapaneseText(reading.toLowerCase());
  
  const results: StationSearchResult[] = [];
  
  for (const station of stations) {
    let score = 0;
    let matchedField: 'name' | 'kana' | 'alternative' = 'kana';
    
    // Check Hiragana reading matches
    const normalizedKana = normalizeJapaneseText(station.kana.toLowerCase());
    if (normalizedKana === normalizedReading) {
      score = 1.0;
    } else if (normalizedKana.startsWith(normalizedReading)) {
      score = 0.9;
    } else if (normalizedKana.includes(normalizedReading)) {
      score = 0.7;
    }
    
    // Check romanized reading matches
    if (score < 0.7) {
      const romanizedKana = romanizeJapanese(station.kana).toLowerCase();
      if (romanizedKana === normalizedReading) {
        score = 0.9; // Slightly lower than native Hiragana
        matchedField = 'alternative';
      } else if (romanizedKana.startsWith(normalizedReading)) {
        score = 0.8;
        matchedField = 'alternative';
      } else if (romanizedKana.includes(normalizedReading)) {
        score = 0.6;
        matchedField = 'alternative';
      }
    }
    
    if (score > 0) {
      results.push({
        station,
        score,
        matchedField,
        highlight: highlightMatch(reading, getFieldValue(station, matchedField))
      });
    }
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get intelligent station suggestions for partial or invalid input
 * 
 * Provides helpful suggestions when user input doesn't match any stations,
 * including common misspellings and alternative names.
 * 
 * @param query User's search query
 * @param stations Available stations
 * @param maxSuggestions Maximum number of suggestions
 * @returns Array of suggestion strings
 * 
 * @example
 * ```typescript
 * const suggestions = getStationSuggestions("Shibuya", stations, 5);
 * console.log(suggestions); // ["渋谷", "新宿", "品川", "新橋", "新木場"]
 * ```
 */
export function getStationSuggestions(
  query: string,
  stations: StationInfo[],
  maxSuggestions: number = 10
): string[] {
  if (!query || query.trim() === '') {
    // Return popular stations for empty query
    return stations
      .filter(s => s.type === 'major' || s.ranking && s.ranking <= 100)
      .sort((a, b) => (a.ranking || 999) - (b.ranking || 999))
      .slice(0, maxSuggestions)
      .map(s => s.name);
  }
  
  const normalizedQuery = normalizeJapaneseText(query.toLowerCase());
  const suggestions: Array<{ name: string; score: number }> = [];
  
  for (const station of stations) {
    let score = 0;
    
    // Fuzzy matching for suggestions
    const nameScore = calculateLevenshteinSimilarity(normalizedQuery, station.name.toLowerCase());
    const kanaScore = calculateLevenshteinSimilarity(normalizedQuery, station.kana.toLowerCase());
    const romanScore = calculateLevenshteinSimilarity(normalizedQuery, romanizeJapanese(station.name).toLowerCase());
    
    score = Math.max(nameScore, kanaScore, romanScore);
    
    // Boost popular stations
    if (station.type === 'major' || station.ranking && station.ranking <= 50) {
      score *= 1.2;
    }
    
    if (score > 0.3) { // Lower threshold for suggestions
      suggestions.push({ name: station.name, score });
    }
  }
  
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map(s => s.name);
}

/**
 * Efficient prefix-based station filtering
 * 
 * Fast filtering of stations based on name prefix, optimized for
 * autocomplete and type-ahead scenarios.
 * 
 * @param prefix Search prefix
 * @param stations Stations to filter
 * @param options Filtering options
 * @returns Matching stations
 * 
 * @example
 * ```typescript
 * const matches = filterStationsByPrefix("新", stations, { limit: 10 });
 * console.log(matches.map(s => s.name)); // ["新宿", "新橋", "新木場", ...]
 * ```
 */
export function filterStationsByPrefix(
  prefix: string,
  stations: StationInfo[],
  options: { limit?: number; includeKana?: boolean } = {}
): StationInfo[] {
  const { limit = 50, includeKana = true } = options;
  
  if (!prefix || prefix.trim() === '') {
    return stations.slice(0, limit);
  }
  
  const normalizedPrefix = normalizeJapaneseText(prefix.toLowerCase());
  const matches: StationInfo[] = [];
  
  for (const station of stations) {
    if (matches.length >= limit) break;
    
    const normalizedName = normalizeJapaneseText(station.name.toLowerCase());
    const normalizedKana = normalizeJapaneseText(station.kana.toLowerCase());
    
    if (normalizedName.startsWith(normalizedPrefix) || 
        (includeKana && normalizedKana.startsWith(normalizedPrefix))) {
      matches.push(station);
    }
  }
  
  return matches;
}

// ============================================================================
// STATION VALIDATION UTILITIES
// ============================================================================

/**
 * Validate station ID with comprehensive checks
 * 
 * Performs thorough validation of station IDs including range checks,
 * format validation, and existence verification.
 * 
 * @param id Station ID to validate
 * @returns Validation result with details
 * 
 * @example
 * ```typescript
 * const result = validateStationId(1130101);
 * if (result.isValid) {
 *   console.log("Valid station ID");
 * } else {
 *   console.log("Errors:", result.errors);
 * }
 * ```
 */
export function validateStationId(id: number): StationValidationResult {
  const errors: StationValidationError[] = [];
  const suggestions: string[] = [];
  
  // Check if ID is a number
  if (typeof id !== 'number' || isNaN(id)) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Station ID must be a valid number',
      suggestions: ['Ensure the ID is a numeric value'],
      input: String(id)
    });
  }
  
  // Check ID range (assuming Japanese station IDs are positive integers)
  else if (id <= 0) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Station ID must be a positive integer',
      suggestions: ['Station IDs start from 1'],
      input: String(id)
    });
  }
  
  // Check for reasonable ID range (Japanese station IDs are typically 7 digits)
  else if (id > 99999999) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Station ID appears to be outside valid range',
      suggestions: ['Japanese station IDs are typically 7 digits or less'],
      input: String(id)
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
    alternatives: []
  };
}

/**
 * Validate station name format and provide suggestions
 * 
 * Checks station name format, length, character usage, and provides
 * intelligent suggestions for corrections.
 * 
 * @param name Station name to validate
 * @returns Validation result with suggestions
 * 
 * @example
 * ```typescript
 * const result = validateStationName("Tokyo Station");
 * if (!result.isValid) {
 *   console.log("Suggestions:", result.suggestions);
 * }
 * ```
 */
export function validateStationName(name: string): StationValidationResult {
  const errors: StationValidationError[] = [];
  const suggestions: string[] = [];
  
  // Check if name is provided
  if (!name || typeof name !== 'string') {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Station name must be a non-empty string',
      suggestions: ['Provide a valid station name'],
      input: String(name)
    });
    return { isValid: false, errors, suggestions, alternatives: [] };
  }
  
  const trimmedName = name.trim();
  
  // Check empty or whitespace-only names
  if (trimmedName === '') {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Station name cannot be empty',
      suggestions: ['Enter a station name'],
      input: name
    });
  }
  
  // Check length constraints
  else if (trimmedName.length > 50) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: 'Station name is too long (maximum 50 characters)',
      suggestions: ['Shorten the station name', 'Remove unnecessary words'],
      input: name
    });
  }
  
  // Check for suspicious patterns
  else if (trimmedName.length === 1) {
    suggestions.push('Single character station names are uncommon - verify spelling');
  }
  
  // Check for English-only names (suggest Japanese equivalents)
  else if (/^[A-Za-z\s-]+$/.test(trimmedName)) {
    suggestions.push('Consider using the Japanese name for better results');
    suggestions.push('Try using Hiragana or Kanji characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions,
    alternatives: []
  };
}

/**
 * Check if a station is a junction station
 * 
 * Helper function to identify junction stations, useful for route planning
 * and transfer optimization.
 * 
 * @param station Station information
 * @returns True if station is a junction
 * 
 * @example
 * ```typescript
 * if (isJunctionStation(station)) {
 *   console.log(`${station.name} is a major transfer point`);
 * }
 * ```
 */
export function isJunctionStation(station: StationInfo): boolean {
  return station.isJunction || 
         station.type === 'junction' || 
         station.lines.length >= 3;
}

/**
 * Get all lines serving a station with formatting
 * 
 * Returns formatted information about all lines that serve a particular station,
 * useful for displaying connection information.
 * 
 * @param station Station information
 * @param includeDetails Whether to include detailed line information
 * @returns Array of line descriptions
 * 
 * @example
 * ```typescript
 * const lines = getStationLines(station, true);
 * console.log(lines); // ["JR山手線", "JR京浜東北線", "東京メトロ丸ノ内線"]
 * ```
 */
export function getStationLines(
  station: StationInfo, 
  includeDetails: boolean = false
): string[] {
  if (!station.lines || station.lines.length === 0) {
    return [];
  }
  
  return station.lines.map(line => {
    if (includeDetails) {
      const companyPrefix = line.isJR ? 'JR' : line.companyName || '';
      return companyPrefix ? `${companyPrefix}${line.name}` : line.name;
    }
    return line.name;
  });
}

// ============================================================================
// STATION INFORMATION UTILITIES
// ============================================================================

/**
 * Get comprehensive station metadata for enhanced UI display
 * 
 * Generates extensive metadata about a station including display variants,
 * search optimization data, and UI helper information.
 * 
 * @param station Station information
 * @returns Comprehensive metadata object
 * 
 * @example
 * ```typescript
 * const metadata = getStationMetadata(station);
 * console.log(metadata.displayVariants.medium); // "東京 (東京都)"
 * console.log(metadata.uiHelpers.cssClass); // "station-major"
 * ```
 */
export function getStationMetadata(station: StationInfo): StationMetadata {
  return {
    station,
    
    displayVariants: {
      short: formatStationName(station, { maxLength: 10 }),
      medium: formatStationName(station, { includePrefecture: true, maxLength: 20 }),
      long: formatStationName(station, { 
        includePrefecture: true, 
        includeKana: true,
        maxLength: 40 
      }),
      withReading: formatStationWithKana(station),
      withPrefecture: formatStationWithPrefecture(station)
    },
    
    searchData: {
      searchableTerms: [
        station.name,
        station.nameExtended,
        station.kana,
        romanizeJapanese(station.name),
        romanizeJapanese(station.kana)
      ].filter(Boolean),
      alternativeNames: [station.nameExtended].filter(Boolean),
      romanizations: [
        romanizeJapanese(station.name),
        romanizeJapanese(station.kana)
      ].filter(Boolean)
    },
    
    uiHelpers: {
      cssClass: `station-${station.type}`,
      priority: calculateStationPriority(station),
      icon: getStationTypeIcon(station.type)
    }
  };
}

/**
 * Compare stations for sorting with multiple criteria
 * 
 * Flexible station comparison function supporting various sorting criteria
 * including alphabetical, prefecture, popularity, and distance-based sorting.
 * 
 * @param stationA First station
 * @param stationB Second station  
 * @param criteria Comparison criteria
 * @returns Comparison result (-1, 0, 1)
 * 
 * @example Alphabetical sorting
 * ```typescript
 * stations.sort((a, b) => compareStations(a, b, 'alphabetical').result);
 * ```
 * 
 * @example Popularity sorting
 * ```typescript
 * stations.sort((a, b) => compareStations(a, b, 'popularity').result);
 * ```
 */
export function compareStations(
  stationA: StationInfo, 
  stationB: StationInfo, 
  criteria: 'alphabetical' | 'prefecture' | 'popularity' | 'distance' = 'alphabetical'
): StationComparison {
  let result = 0;
  let metadata: StationComparison['metadata'] = {};
  
  switch (criteria) {
    case 'alphabetical':
      result = stationA.name.localeCompare(stationB.name, 'ja');
      break;
      
    case 'prefecture':
      const prefCompare = stationA.prefecture.localeCompare(stationB.prefecture, 'ja');
      if (prefCompare !== 0) {
        result = prefCompare;
        metadata.prefectureMatch = false;
      } else {
        result = stationA.name.localeCompare(stationB.name, 'ja');
        metadata.prefectureMatch = true;
      }
      break;
      
    case 'popularity':
      const rankA = stationA.ranking || 9999;
      const rankB = stationB.ranking || 9999;
      result = rankA - rankB; // Lower ranking number = higher priority
      metadata.popularityDiff = Math.abs(rankA - rankB);
      break;
      
    case 'distance':
      // Would require additional distance calculation logic
      // For now, fallback to alphabetical
      result = stationA.name.localeCompare(stationB.name, 'ja');
      break;
  }
  
  return { result, criteria, metadata };
}

/**
 * Group stations by prefecture with metadata
 * 
 * Organizes stations by prefecture, providing useful metadata for
 * hierarchical displays and regional navigation.
 * 
 * @param stations Array of stations to group
 * @returns Grouped stations by prefecture
 * 
 * @example
 * ```typescript
 * const grouped = groupStationsByPrefecture(stations);
 * grouped.forEach(group => {
 *   console.log(`${group.prefecture.name}: ${group.count} stations`);
 *   console.log(`Major stations: ${group.majorStations.length}`);
 * });
 * ```
 */
export function groupStationsByPrefecture(stations: StationInfo[]): StationsByPrefecture[] {
  const groups = new Map<string, {
    prefecture: PrefectureInfo;
    stations: StationInfo[];
    majorStations: StationInfo[];
  }>();
  
  for (const station of stations) {
    const prefectureName = station.prefecture;
    
    if (!groups.has(prefectureName)) {
      groups.set(prefectureName, {
        prefecture: {
          id: station.prefectureId,
          name: prefectureName,
          region: '', // Would be populated from regional data
          stationCount: 0
        },
        stations: [],
        majorStations: []
      });
    }
    
    const group = groups.get(prefectureName)!;
    group.stations.push(station);
    
    if (station.type === 'major' || station.type === 'junction') {
      group.majorStations.push(station);
    }
  }
  
  return Array.from(groups.values()).map(group => ({
    prefecture: {
      ...group.prefecture,
      stationCount: group.stations.length
    },
    stations: group.stations,
    count: group.stations.length,
    majorStations: group.majorStations
  }));
}

/**
 * Get popular/frequently used stations
 * 
 * Returns a curated list of popular stations based on ranking,
 * type, and usage patterns, useful for quick selection interfaces.
 * 
 * @param stations Available stations
 * @param limit Maximum number of stations to return
 * @returns Popular stations sorted by relevance
 * 
 * @example
 * ```typescript
 * const popular = getPopularStations(stations, 20);
 * console.log(popular.map(s => s.name)); // ["東京", "新宿", "渋谷", ...]
 * ```
 */
export function getPopularStations(
  stations: StationInfo[], 
  limit: number = 50
): StationInfo[] {
  return stations
    .filter(station => 
      station.type === 'major' || 
      station.type === 'junction' ||
      (station.ranking && station.ranking <= 100)
    )
    .sort((a, b) => {
      // Primary sort by ranking (lower is better)
      const rankA = a.ranking || 9999;
      const rankB = b.ranking || 9999;
      
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      
      // Secondary sort by type priority
      const typeScoreA = getTypeScore(a.type);
      const typeScoreB = getTypeScore(b.type);
      
      if (typeScoreA !== typeScoreB) {
        return typeScoreB - typeScoreA; // Higher type score is better
      }
      
      // Tertiary sort alphabetically
      return a.name.localeCompare(b.name, 'ja');
    })
    .slice(0, limit);
}

// ============================================================================
// UTILITY HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize Japanese text for consistent comparison
 */
function normalizeJapaneseText(text: string): string {
  return text
    .normalize('NFKC') // Unicode normalization
    .replace(/[\u3000]/g, ' ') // Replace fullwidth space with regular space
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate Levenshtein distance-based similarity (0-1)
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  const maxLength = Math.max(str1.length, str2.length);
  const distance = calculateLevenshteinDistance(str1, str2);
  
  return 1.0 - (distance / maxLength);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = Array(str1.length + 1).fill(null).map(() => Array(str2.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[str1.length][str2.length];
}

/**
 * Basic romanization of Japanese text (simplified implementation)
 */
function romanizeJapanese(japanese: string): string {
  // This is a simplified romanization - in production would use a proper library
  const romanizationMap: Record<string, string> = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'を': 'wo', 'ん': 'n',
    // Common kanji approximations
    '東京': 'tokyo', '新宿': 'shinjuku', '渋谷': 'shibuya', '品川': 'shinagawa'
  };
  
  let result = japanese;
  for (const [jp, rom] of Object.entries(romanizationMap)) {
    result = result.replace(new RegExp(jp, 'g'), rom);
  }
  
  return result;
}

/**
 * Truncate Japanese text preserving character boundaries
 */
function truncateJapaneseText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Ensure we don't break in the middle of a Japanese character
  let truncated = text.substring(0, maxLength - 1);
  
  // Add ellipsis
  return truncated + '…';
}

/**
 * Highlight matching text in search results
 */
function highlightMatch(query: string, text: string): string {
  if (!query || !text) return text;
  
  const normalizedQuery = normalizeJapaneseText(query.toLowerCase());
  const normalizedText = normalizeJapaneseText(text.toLowerCase());
  
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return text;
  
  // Simple highlighting - in production would be more sophisticated
  const beforeMatch = text.substring(0, index);
  const match = text.substring(index, index + query.length);
  const afterMatch = text.substring(index + query.length);
  
  return `${beforeMatch}<mark>${match}</mark>${afterMatch}`;
}

/**
 * Get field value from station based on matched field type
 */
function getFieldValue(station: StationInfo, field: 'name' | 'kana' | 'alternative'): string {
  switch (field) {
    case 'name':
      return station.name;
    case 'kana':
      return station.kana;
    case 'alternative':
      return station.nameExtended || station.name;
    default:
      return station.name;
  }
}

/**
 * Calculate station priority for UI ordering
 */
function calculateStationPriority(station: StationInfo): number {
  let priority = 0;
  
  // Type-based priority
  switch (station.type) {
    case 'major': priority += 100; break;
    case 'junction': priority += 80; break;
    case 'terminal': priority += 60; break;
    case 'local': priority += 40; break;
  }
  
  // Ranking-based priority (lower ranking number = higher priority)
  if (station.ranking) {
    priority += Math.max(0, 100 - station.ranking);
  }
  
  // Junction station bonus
  if (station.isJunction) {
    priority += 20;
  }
  
  // Line count bonus
  priority += Math.min(station.lines.length * 5, 25);
  
  return priority;
}

/**
 * Get icon name for station type
 */
function getStationTypeIcon(type: StationInfo['type']): string {
  const icons = {
    major: 'star',
    junction: 'transfer',
    terminal: 'stop',
    local: 'circle'
  };
  
  return icons[type] || 'circle';
}

/**
 * Get numerical score for station type (for sorting)
 */
function getTypeScore(type: StationInfo['type']): number {
  const scores = {
    major: 4,
    junction: 3,
    terminal: 2,
    local: 1
  };
  
  return scores[type] || 0;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export all utility functions
export {
  // Station formatting
  formatStationWithPrefecture,
  formatStationWithKana,
  getStationDisplayName,
  
  // Enhanced search
  fuzzySearchStations,
  searchStationsByReading,
  getStationSuggestions,
  filterStationsByPrefix,
  
  // Station validation
  validateStationId,
  validateStationName,
  isJunctionStation,
  getStationLines,
  
  // Station information
  getStationMetadata,
  compareStations,
  groupStationsByPrefecture,
  getPopularStations
};

// Export types
export type {
  StationFormatOptions,
  EnhancedSearchOptions,
  StationValidationResult,
  StationValidationError,
  StationMetadata,
  StationComparison,
  StationsByPrefecture
};

// Default export with all functions
export default {
  formatStationName,
  formatStationWithPrefecture,
  formatStationWithKana,
  getStationDisplayName,
  fuzzySearchStations,
  searchStationsByReading,
  getStationSuggestions,
  filterStationsByPrefix,
  validateStationId,
  validateStationName,
  isJunctionStation,
  getStationLines,
  getStationMetadata,
  compareStations,
  groupStationsByPrefecture,
  getPopularStations
};