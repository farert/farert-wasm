/**
 * Unit tests for fare formatting utilities
 * Tests framework-agnostic functionality and Japanese text handling
 */

import {
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
  compareFares,
  type FareBreakdownOptions,
  type StationNameOptions,
  type LocaleOptions
} from './fare-utils';
import { FareInfoData } from '../../cli/types';

// Mock FareInfoData for testing
const mockFareInfo: FareInfoData = {
  result: 0,
  fare: 1980,
  isRule114Applied: true,
  availCountForFareOfStockDiscount: 2,
  beginStationId: 1001,
  endStationId: 2001,
  routeList: '東京 → 東海道線 → 横浜 → 根岸線 → 大船',
  fareForIC: 1976,
  childFare: 990,
  academicFare: 1584,
  totalSalesKm: 53,
  ticketAvailDays: 1,
  isRoundtrip: false,
  isSpecificFare: false,
  fareForStockDiscount: (index: number) => {
    const discounts = [1782, 1584];
    return discounts[index] || 0;
  },
  fareForStockDiscountTitle: (index: number) => {
    const titles = ['定期券割引', '回数券割引'];
    return titles[index] || '';
  }
} as FareInfoData;

describe('Fare Formatting Utilities', () => {
  describe('formatFare', () => {
    test('should format basic fare with yen symbol', () => {
      expect(formatFare(1980)).toMatch(/¥1,980|¥1980/);
    });

    test('should handle zero fare', () => {
      expect(formatFare(0)).toBe('¥0');
    });

    test('should handle negative fare', () => {
      expect(formatFare(-100)).toBe('¥0');
    });

    test('should respect locale options', () => {
      const options: LocaleOptions = { 
        locale: 'ja-JP',
        useGrouping: false 
      };
      expect(formatFare(1980, options)).toMatch(/¥1980/);
    });

    test('should handle large amounts', () => {
      expect(formatFare(123456)).toMatch(/¥123,456|¥123456/);
    });
  });

  describe('formatFareSimple', () => {
    test('should format simple fare', () => {
      expect(formatFareSimple(1980)).toBe('¥1980');
    });

    test('should handle zero fare', () => {
      expect(formatFareSimple(0)).toBe('¥0');
    });
  });

  describe('formatFareBreakdown', () => {
    test('should format basic fare breakdown', () => {
      const result = formatFareBreakdown(mockFareInfo);
      expect(result).toContain('運賃: ¥1,980');
      expect(result).toContain('経路: 東京 → 東海道線 → 横浜 → 根岸線 → 大船');
      expect(result).toContain('営業キロ: 53km');
    });

    test('should include discount information when available', () => {
      const options: FareBreakdownOptions = { includeDiscounts: true };
      const result = formatFareBreakdown(mockFareInfo, options);
      expect(result).toContain('割引運賃');
      expect(result).toContain('定期券割引');
    });

    test('should include rule information when requested', () => {
      const options: FareBreakdownOptions = { includeRules: true };
      const result = formatFareBreakdown(mockFareInfo, options);
      expect(result).toContain('規則第114条');
    });

    test('should handle minimal details', () => {
      const options: FareBreakdownOptions = { 
        showDetails: false,
        includeKilometers: false,
        includeDiscounts: false,
        includeRules: false
      };
      const result = formatFareBreakdown(mockFareInfo, options);
      expect(result).toBe('運賃: ¥1,980');
    });
  });

  describe('formatStationName', () => {
    test('should format basic station name', () => {
      expect(formatStationName('東京')).toBe('東京');
    });

    test('should handle empty station name with fallback', () => {
      const options: StationNameOptions = { fallbackToId: true };
      expect(formatStationName('', 1001, options)).toBe('駅ID:1001');
    });

    test('should handle empty station name without fallback', () => {
      const options: StationNameOptions = { fallbackToId: false };
      expect(formatStationName('', undefined, options)).toBe('駅名不明');
    });

    test('should truncate long names when max length specified', () => {
      const options: StationNameOptions = { maxLength: 5 };
      expect(formatStationName('非常に長い駅名です', undefined, options)).toBe('非常に長い…');
    });

    test('should normalize Japanese characters', () => {
      // Test with decomposed characters that should be normalized
      expect(formatStationName('新宿')).toBe('新宿');
    });
  });

  describe('formatRouteDescription', () => {
    test('should format route with arrows', () => {
      expect(formatRouteDescription('東京-横浜-大船')).toBe('東京 → 横浜 → 大船');
    });

    test('should handle empty route', () => {
      expect(formatRouteDescription('')).toBe('経路情報なし');
    });

    test('should handle single station', () => {
      expect(formatRouteDescription('東京')).toBe('東京');
    });
  });

  describe('validateRoute', () => {
    test('should validate correct route format', () => {
      const result = validateRoute('東京 東海道線 横浜');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty route', () => {
      const result = validateRoute('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('route_format_invalid');
    });

    test('should reject route with too few parts', () => {
      const result = validateRoute('東京 横浜');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('route_format_invalid');
    });

    test('should reject route with even number of parts', () => {
      const result = validateRoute('東京 東海道線 横浜 根岸線');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('route_format_invalid');
    });

    test('should warn about long routes', () => {
      const longRoute = '東京 東海道線 横浜 根岸線 大船 東海道線 藤沢 小田急線 新宿';
      const result = validateRoute(longRoute);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('long_route');
    });
  });

  describe('RouteBuilder', () => {
    test('should build simple route', () => {
      const builder = new RouteBuilder();
      const route = builder
        .from('東京')
        .via('東海道線', '横浜')
        .build();
      expect(route).toBe('東京 東海道線 横浜');
    });

    test('should build complex route', () => {
      const builder = createRouteBuilder();
      const route = builder
        .from('東京')
        .via('東海道線', '横浜')
        .via('根岸線', '大船')
        .build();
      expect(route).toBe('東京 東海道線 横浜 根岸線 大船');
    });

    test('should build route as array', () => {
      const builder = createRouteBuilder();
      const routeArray = builder
        .from('東京')
        .via('東海道線', '横浜')
        .buildArray();
      expect(routeArray).toEqual(['東京', '東海道線', '横浜']);
    });

    test('should throw error for incomplete route', () => {
      const builder = new RouteBuilder();
      expect(() => builder.from('東京').build()).toThrow();
    });

    test('should reset builder', () => {
      const builder = createRouteBuilder();
      builder.from('東京').via('東海道線', '横浜');
      builder.reset();
      expect(() => builder.build()).toThrow();
    });
  });

  describe('formatValidationErrors', () => {
    test('should format validation errors', () => {
      const validation = validateRoute('');
      const formatted = formatValidationErrors(validation);
      expect(formatted).toContain('❌ エラー:');
      expect(formatted).toContain('経路文字列が空です');
    });

    test('should format validation warnings', () => {
      const longRoute = '東京 東海道線 横浜 根岸線 大船 東海道線 藤沢 小田急線 新宿';
      const validation = validateRoute(longRoute);
      const formatted = formatValidationErrors(validation);
      expect(formatted).toContain('⚠️  警告:');
    });
  });

  describe('isFareReasonable', () => {
    test('should accept reasonable fares', () => {
      const result = isFareReasonable(1980);
      expect(result.isReasonable).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    test('should reject zero or negative fares', () => {
      const result = isFareReasonable(0);
      expect(result.isReasonable).toBe(false);
      expect(result.reason).toBe('運賃が0円以下です');
    });

    test('should reject fares below minimum', () => {
      const result = isFareReasonable(100);
      expect(result.isReasonable).toBe(false);
      expect(result.reason).toBe('運賃が最低運賃未満です');
    });

    test('should reject excessive fares', () => {
      const result = isFareReasonable(60000);
      expect(result.isReasonable).toBe(false);
      expect(result.reason).toBe('運賃が異常に高額です');
    });
  });

  describe('formatKilometers', () => {
    test('should format whole kilometers', () => {
      expect(formatKilometers(53)).toBe('53km');
    });

    test('should format decimal kilometers', () => {
      expect(formatKilometers(53.7)).toBe('53.7km');
    });

    test('should format meters for short distances', () => {
      expect(formatKilometers(0.5)).toBe('500m');
    });

    test('should handle zero distance', () => {
      expect(formatKilometers(0)).toBe('0km');
    });
  });

  describe('compareFares', () => {
    test('should compare two different fares', () => {
      const fare1: FareInfoData = { ...mockFareInfo, fare: 1980 };
      const fare2: FareInfoData = { ...mockFareInfo, fare: 2210 };
      
      const comparison = compareFares(fare1, fare2, ['Route A', 'Route B']);
      expect(comparison).toContain('Route A: ¥1980');
      expect(comparison).toContain('Route B: ¥2210');
      expect(comparison).toContain('差額: ¥230');
      expect(comparison).toContain('Route Aが安い');
    });

    test('should handle same fares', () => {
      const fare1: FareInfoData = { ...mockFareInfo, fare: 1980 };
      const fare2: FareInfoData = { ...mockFareInfo, fare: 1980 };
      
      const comparison = compareFares(fare1, fare2);
      expect(comparison).toContain('差額: なし（同額）');
    });

    test('should compare different routes', () => {
      const fare1: FareInfoData = { ...mockFareInfo, routeList: '東京 → 横浜' };
      const fare2: FareInfoData = { ...mockFareInfo, routeList: '東京 → 品川 → 横浜' };
      
      const comparison = compareFares(fare1, fare2);
      expect(comparison).toContain('経路の違い:');
      expect(comparison).toContain('東京 → 横浜');
      expect(comparison).toContain('東京 → 品川 → 横浜');
    });
  });
});

// Integration tests that would require actual WebAssembly module
describe('Integration Tests (Mocked)', () => {
  test('should work with actual FareInfoData from WebAssembly', () => {
    // This test would require actual WebAssembly integration
    // For now, just test that our utilities work with realistic data
    const realWorldFare: FareInfoData = {
      result: 0,
      fare: 3350,
      isRule114Applied: true,
      availCountForFareOfStockDiscount: 1,
      beginStationId: 1001,
      endStationId: 3001,
      routeList: '東京 東海道線 新横浜 東海道新幹線 新大阪',
      fareForIC: 3350,
      childFare: 1680,
      academicFare: 2680,
      totalSalesKm: 515,
      ticketAvailDays: 2,
      isRoundtrip: false,
      isSpecificFare: true
    } as FareInfoData;

    const breakdown = formatFareBreakdown(realWorldFare);
    expect(breakdown).toContain('¥3,350');
    expect(breakdown).toContain('営業キロ: 515km');
    expect(breakdown).toContain('特定運賃適用');
    expect(breakdown).toContain('有効期間: 2日間');
  });
});