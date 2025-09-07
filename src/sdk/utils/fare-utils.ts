/**
 * Fare Formatting Utilities for Farert WebAssembly SDK
 * Framework-agnostic utilities for Japanese railway fare calculations
 * Based on CLAUDE.md specifications and REQ-API-005 requirements
 */

import { FareInfoData } from '../../cli/types';

/**
 * Locale-specific formatting options
 */
export interface LocaleOptions {
  locale?: string;
  currency?: string;
  useGrouping?: boolean;
}

/**
 * Fare breakdown display options
 */
export interface FareBreakdownOptions {
  showDetails?: boolean;
  includeKilometers?: boolean;
  includeDiscounts?: boolean;
  includeRules?: boolean;
  locale?: string;
}

/**
 * Station name formatting options
 */
export interface StationNameOptions {
  includePrefecture?: boolean;
  includeKana?: boolean;
  fallbackToId?: boolean;
  maxLength?: number;
}

/**
 * Route validation result with detailed feedback
 */
export interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}

/**
 * Route validation error details
 */
export interface RouteValidationError {
  type: 'station_not_found' | 'line_not_found' | 'connection_invalid' | 'route_format_invalid';
  message: string;
  position?: number;
  value?: string;
  suggestions: string[];
}

/**
 * Route validation warning details
 */
export interface RouteValidationWarning {
  type: 'long_route' | 'expensive_fare' | 'complex_connection' | 'alternative_available';
  message: string;
  suggestion?: string;
}

/**
 * Fluent API builder for route construction
 */
export class RouteBuilder {
  private stations: string[] = [];
  private lines: string[] = [];

  /**
   * Start route from a station
   */
  from(stationName: string): this {
    this.stations = [stationName];
    this.lines = [];
    return this;
  }

  /**
   * Add a line and destination station
   */
  via(lineName: string, stationName: string): this {
    this.lines.push(lineName);
    this.stations.push(stationName);
    return this;
  }

  /**
   * Set final destination
   */
  to(stationName: string): this {
    if (this.stations.length === 0) {
      throw new Error('Must specify starting station with from() first');
    }
    if (this.lines.length === 0) {
      throw new Error('Must specify at least one line with via() before destination');
    }
    this.stations.push(stationName);
    return this;
  }

  /**
   * Build the route string
   */
  build(): string {
    if (this.stations.length < 2) {
      throw new Error('Route must have at least two stations');
    }
    if (this.lines.length !== this.stations.length - 1) {
      throw new Error('Number of lines must be one less than number of stations');
    }

    const parts: string[] = [];
    for (let i = 0; i < this.stations.length; i++) {
      parts.push(this.stations[i]);
      if (i < this.lines.length) {
        parts.push(this.lines[i]);
      }
    }
    return parts.join(' ');
  }

  /**
   * Get route as array format [station1, line1, station2, line2, ...]
   */
  buildArray(): string[] {
    const route = this.build();
    return route.split(' ');
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.stations = [];
    this.lines = [];
    return this;
  }
}

/**
 * Format fare amount with Japanese yen symbol and localization
 */
export function formatFare(
  fare: number,
  options: LocaleOptions = {}
): string {
  const {
    locale = 'ja-JP',
    currency = 'JPY',
    useGrouping = true
  } = options;

  if (fare <= 0) {
    return '¥0';
  }

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      useGrouping,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(fare);
  } catch (error) {
    // Fallback for unsupported locales
    const separator = useGrouping ? ',' : '';
    const formattedNumber = useGrouping 
      ? fare.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      : fare.toString();
    return `¥${formattedNumber}`;
  }
}

/**
 * Format fare with simple yen symbol (compatible with C++ implementation)
 */
export function formatFareSimple(fare: number): string {
  if (fare <= 0) return '¥0';
  return `¥${fare.toString()}`;
}

/**
 * Format fare breakdown with detailed information
 */
export function formatFareBreakdown(
  fareInfo: FareInfoData,
  options: FareBreakdownOptions = {}
): string {
  const {
    showDetails = true,
    includeKilometers = true,
    includeDiscounts = true,
    includeRules = true,
    locale = 'ja-JP'
  } = options;

  const lines: string[] = [];

  // Basic fare information
  lines.push(`運賃: ${formatFare(fareInfo.fare, { locale })}`);

  if (showDetails) {
    // Route information
    if (fareInfo.routeList) {
      lines.push(`経路: ${fareInfo.routeList}`);
    }

    // Distance information
    if (includeKilometers && fareInfo.totalSalesKm) {
      lines.push(`営業キロ: ${fareInfo.totalSalesKm}km`);
    }

    // Special fares
    if (fareInfo.childFare && fareInfo.childFare > 0) {
      lines.push(`こども運賃: ${formatFare(fareInfo.childFare, { locale })}`);
    }
    
    if (fareInfo.academicFare && fareInfo.academicFare > 0) {
      lines.push(`学割運賃: ${formatFare(fareInfo.academicFare, { locale })}`);
    }

    if (fareInfo.fareForIC && fareInfo.fareForIC !== fareInfo.fare) {
      lines.push(`IC運賃: ${formatFare(fareInfo.fareForIC, { locale })}`);
    }

    // Discount information
    if (includeDiscounts && fareInfo.availCountForFareOfStockDiscount > 0) {
      lines.push('割引運賃:');
      for (let i = 0; i < fareInfo.availCountForFareOfStockDiscount; i++) {
        const discountFare = (fareInfo as any).fareForStockDiscount?.(i);
        const discountTitle = (fareInfo as any).fareForStockDiscountTitle?.(i);
        if (discountFare && discountTitle) {
          lines.push(`  ${discountTitle}: ${formatFare(discountFare, { locale })}`);
        }
      }
    }

    // Rule applications
    if (includeRules) {
      if (fareInfo.isRule114Applied) {
        lines.push('適用規則: 規則第114条（長距離逓減）');
      }
      
      if (fareInfo.isRoundtrip) {
        lines.push('往復割引適用');
      }
      
      if (fareInfo.isSpecificFare) {
        lines.push('特定運賃適用');
      }
    }

    // Additional information
    if (fareInfo.ticketAvailDays > 0) {
      lines.push(`有効期間: ${fareInfo.ticketAvailDays}日間`);
    }
  }

  return lines.join('\n');
}

/**
 * Format Japanese station names with proper handling and fallbacks
 */
export function formatStationName(
  stationName: string,
  stationId?: number,
  options: StationNameOptions = {}
): string {
  const {
    includePrefecture = false,
    includeKana = false,
    fallbackToId = true,
    maxLength
  } = options;

  if (!stationName || stationName.trim().length === 0) {
    if (fallbackToId && stationId !== undefined) {
      return `駅ID:${stationId}`;
    }
    return '駅名不明';
  }

  let formatted = stationName.trim();

  // Handle Japanese character encoding
  try {
    // Ensure proper Unicode normalization for Japanese characters
    formatted = formatted.normalize('NFC');
  } catch (error) {
    // Fallback if normalization fails
    console.warn('Failed to normalize Japanese characters:', error);
  }

  // Add prefecture if requested and available
  if (includePrefecture) {
    // This would need to be implemented with actual prefecture lookup
    // For now, just return the station name as-is
  }

  // Add kana reading if requested
  if (includeKana) {
    // This would need to be implemented with actual kana lookup
    // For now, just return the station name as-is
  }

  // Truncate if max length specified
  if (maxLength && formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 1) + '…';
  }

  return formatted;
}

/**
 * Format route description in Japanese
 */
export function formatRouteDescription(routeList: string): string {
  if (!routeList || routeList.trim().length === 0) {
    return '経路情報なし';
  }

  // Split by common delimiters and format
  const parts = routeList.split(/[→\-\s]+/).filter(part => part.trim().length > 0);
  
  if (parts.length <= 1) {
    return routeList;
  }

  return parts.join(' → ');
}

/**
 * Validate route string format and connections
 */
export function validateRoute(routeString: string): RouteValidationResult {
  const result: RouteValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  if (!routeString || routeString.trim().length === 0) {
    result.isValid = false;
    result.errors.push({
      type: 'route_format_invalid',
      message: '経路文字列が空です',
      suggestions: ['有効な経路文字列を入力してください（例: "東京 東海道線 横浜"）']
    });
    return result;
  }

  const parts = routeString.trim().split(/\s+/);
  
  // Check for minimum parts (station + line + station)
  if (parts.length < 3) {
    result.isValid = false;
    result.errors.push({
      type: 'route_format_invalid',
      message: '経路は最低でも「出発駅 路線 到着駅」の形式である必要があります',
      position: 0,
      suggestions: ['正しい形式: "東京 東海道線 横浜"', '駅名と路線名の間にスペースを入れてください']
    });
    return result;
  }

  // Check for odd number of parts (station-line-station pattern)
  if (parts.length % 2 === 0) {
    result.isValid = false;
    result.errors.push({
      type: 'route_format_invalid',
      message: '経路の要素数が正しくありません。駅名と路線名を交互に指定してください',
      suggestions: ['正しい形式: "駅1 路線1 駅2 路線2 駅3"', '要素数は奇数である必要があります']
    });
    return result;
  }

  // Validate station names (odd positions)
  for (let i = 0; i < parts.length; i += 2) {
    const stationName = parts[i];
    if (!isValidStationName(stationName)) {
      result.errors.push({
        type: 'station_not_found',
        message: `駅名「${stationName}」が見つかりません`,
        position: i,
        value: stationName,
        suggestions: [
          '正確な漢字駅名を使用してください',
          'ひらがな・カタカナではなく漢字で入力してください',
          '駅名に「駅」を付けないでください'
        ]
      });
    }
  }

  // Validate line names (even positions, except last)
  for (let i = 1; i < parts.length; i += 2) {
    const lineName = parts[i];
    if (!isValidLineName(lineName)) {
      result.errors.push({
        type: 'line_not_found',
        message: `路線名「${lineName}」が見つかりません`,
        position: i,
        value: lineName,
        suggestions: [
          '正式な路線名を使用してください（例: 東海道線、山手線）',
          '路線名には「線」を付けてください',
          'JR・私鉄の正式名称を確認してください'
        ]
      });
    }
  }

  // Add warnings for long routes
  if (parts.length > 7) {
    result.warnings.push({
      type: 'long_route',
      message: '長距離経路です。計算に時間がかかる場合があります',
      suggestion: '中間駅を省略できる場合は省略してください'
    });
  }

  // Update validation result
  result.isValid = result.errors.length === 0;

  // Add suggestions if there are errors
  if (result.errors.length > 0) {
    result.suggestions.push(
      '駅名・路線名は正確な漢字表記を使用してください',
      '例: "東京 東海道線 横浜 根岸線 大船"',
      'スペースで区切って交互に駅名と路線名を指定してください'
    );
  }

  return result;
}

/**
 * Helper function to check if station name is valid format
 * (Basic validation - actual existence check would need database access)
 */
function isValidStationName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  
  // Basic Japanese character validation
  const trimmed = name.trim();
  
  // Check for common invalid patterns
  if (trimmed.endsWith('駅')) return false; // Station names shouldn't end with 駅
  if (trimmed.length > 10) return false; // Most station names are shorter
  if (/^[a-zA-Z]+$/.test(trimmed)) return false; // No pure English names
  
  // Should contain some Japanese characters
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(trimmed);
}

/**
 * Helper function to check if line name is valid format
 * (Basic validation - actual existence check would need database access)
 */
function isValidLineName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  
  const trimmed = name.trim();
  
  // Should contain Japanese characters
  if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(trimmed)) return false;
  
  // Common line name patterns
  if (trimmed.endsWith('線') || trimmed.endsWith('本線')) return true;
  if (trimmed.includes('新幹線')) return true;
  if (trimmed.includes('地下鉄')) return true;
  
  return false;
}

/**
 * Format error messages for user display
 */
export function formatValidationErrors(
  validation: RouteValidationResult,
  _locale: 'ja' | 'en' = 'ja'
): string {
  const lines: string[] = [];

  if (validation.errors.length > 0) {
    lines.push('❌ エラー:');
    validation.errors.forEach((error, index) => {
      lines.push(`  ${index + 1}. ${error.message}`);
      if (error.position !== undefined) {
        lines.push(`     位置: ${error.position + 1}番目の要素`);
      }
      if (error.value) {
        lines.push(`     値: "${error.value}"`);
      }
      if (error.suggestions.length > 0) {
        lines.push('     解決方法:');
        error.suggestions.forEach(suggestion => {
          lines.push(`       - ${suggestion}`);
        });
      }
    });
  }

  if (validation.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('⚠️  警告:');
    validation.warnings.forEach((warning, index) => {
      lines.push(`  ${index + 1}. ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`     提案: ${warning.suggestion}`);
      }
    });
  }

  if (validation.suggestions.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('💡 全般的な提案:');
    validation.suggestions.forEach((suggestion, index) => {
      lines.push(`  ${index + 1}. ${suggestion}`);
    });
  }

  return lines.join('\n');
}

/**
 * Create fluent route builder instance
 */
export function createRouteBuilder(): RouteBuilder {
  return new RouteBuilder();
}

/**
 * Utility function to check if fare amount is reasonable
 */
export function isFareReasonable(fare: number): { isReasonable: boolean; reason?: string } {
  if (fare <= 0) {
    return { isReasonable: false, reason: '運賃が0円以下です' };
  }
  
  if (fare < 140) {
    return { isReasonable: false, reason: '運賃が最低運賃未満です' };
  }
  
  if (fare > 50000) {
    return { isReasonable: false, reason: '運賃が異常に高額です' };
  }
  
  return { isReasonable: true };
}

/**
 * Format kilometers with appropriate units
 */
export function formatKilometers(km: number): string {
  if (km <= 0) return '0km';
  
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  
  if (km === Math.floor(km)) {
    return `${km}km`;
  }
  
  return `${km.toFixed(1)}km`;
}

/**
 * Compare two fare calculations and highlight differences
 */
export function compareFares(
  fare1: FareInfoData,
  fare2: FareInfoData,
  labels: [string, string] = ['A', 'B']
): string {
  const lines: string[] = [];
  
  lines.push(`運賃比較: ${labels[0]} vs ${labels[1]}`);
  lines.push(`${labels[0]}: ${formatFareSimple(fare1.fare)}`);
  lines.push(`${labels[1]}: ${formatFareSimple(fare2.fare)}`);
  
  const diff = fare2.fare - fare1.fare;
  if (diff !== 0) {
    const cheaper = diff < 0 ? labels[1] : labels[0];
    lines.push(`差額: ${formatFareSimple(Math.abs(diff))} (${cheaper}が安い)`);
  } else {
    lines.push('差額: なし（同額）');
  }
  
  // Route comparison
  if (fare1.routeList !== fare2.routeList) {
    lines.push('');
    lines.push('経路の違い:');
    lines.push(`${labels[0]}: ${fare1.routeList || '経路情報なし'}`);
    lines.push(`${labels[1]}: ${fare2.routeList || '経路情報なし'}`);
  }
  
  return lines.join('\n');
}

/**
 * Export all utility functions for tree-shaking support
 */
export default {
  formatFare,
  formatFareSimple,
  formatFareBreakdown,
  formatStationName,
  formatRouteDescription,
  validateRoute,
  formatValidationErrors,
  createRouteBuilder,
  RouteBuilder,
  isFareReasonable,
  formatKilometers,
  compareFares
};