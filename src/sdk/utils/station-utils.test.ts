/**
 * Station Utilities Test Suite
 * Comprehensive tests for station formatting, search, validation, and utility functions
 */

import {
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
  getPopularStations,
  type StationFormatOptions,
  type EnhancedSearchOptions
} from './station-utils';

import type { StationInfo, LineInfo } from '../types/core';

// Mock station data for testing
const mockStations: StationInfo[] = [
  {
    id: 1130101,
    name: '東京',
    nameExtended: '東京駅',
    kana: 'とうきょう',
    prefecture: '東京都',
    prefectureId: 13,
    isJunction: true,
    type: 'major',
    ranking: 1,
    lines: [
      { id: 1001, name: '山手線', companyId: 1, companyName: 'JR東日本', isJR: true, isPrivate: false, stations: [], type: 'jr' },
      { id: 1002, name: '東海道線', companyId: 1, companyName: 'JR東日本', isJR: true, isPrivate: false, stations: [], type: 'jr' }
    ]
  },
  {
    id: 1130201,
    name: '新宿',
    nameExtended: '新宿駅',
    kana: 'しんじゅく',
    prefecture: '東京都',
    prefectureId: 13,
    isJunction: true,
    type: 'major',
    ranking: 2,
    lines: [
      { id: 1001, name: '山手線', companyId: 1, companyName: 'JR東日本', isJR: true, isPrivate: false, stations: [], type: 'jr' },
      { id: 1003, name: '中央線', companyId: 1, companyName: 'JR東日本', isJR: true, isPrivate: false, stations: [], type: 'jr' }
    ]
  },
  {
    id: 2741002,
    name: '大阪',
    nameExtended: '大阪駅',
    kana: 'おおさか',
    prefecture: '大阪府',
    prefectureId: 27,
    isJunction: true,
    type: 'major',
    ranking: 10,
    lines: [
      { id: 2001, name: '東海道本線', companyId: 2, companyName: 'JR西日本', isJR: true, isPrivate: false, stations: [], type: 'jr' }
    ]
  },
  {
    id: 1139999,
    name: 'テスト駅',
    nameExtended: 'テスト駅（試験）',
    kana: 'てすとえき',
    prefecture: '東京都',
    prefectureId: 13,
    isJunction: false,
    type: 'local',
    lines: [
      { id: 9999, name: 'テスト線', companyId: 99, companyName: 'テスト鉄道', isJR: false, isPrivate: true, stations: [], type: 'private' }
    ]
  }
];

describe('Station Formatting Utilities', () => {
  describe('formatStationName', () => {
    test('formats basic station name', () => {
      const result = formatStationName(mockStations[0]);
      expect(result).toBe('東京');
    });

    test('formats with prefecture', () => {
      const options: StationFormatOptions = { includePrefecture: true };
      const result = formatStationName(mockStations[0], options);
      expect(result).toBe('東京 (東京都)');
    });

    test('formats with kana reading', () => {
      const options: StationFormatOptions = { includeKana: true };
      const result = formatStationName(mockStations[0], options);
      expect(result).toBe('東京 (とうきょう)');
    });

    test('formats with both prefecture and kana', () => {
      const options: StationFormatOptions = { 
        includePrefecture: true, 
        includeKana: true,
        separator: '・'
      };
      const result = formatStationName(mockStations[0], options);
      expect(result).toBe('東京 (とうきょう・東京都)');
    });

    test('respects maxLength constraint', () => {
      const options: StationFormatOptions = { 
        includePrefecture: true, 
        includeKana: true,
        maxLength: 10
      };
      const result = formatStationName(mockStations[0], options);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    test('handles missing station gracefully', () => {
      const result = formatStationName(null as any);
      expect(result).toBe('Unknown Station');
    });
  });

  describe('formatStationWithPrefecture', () => {
    test('includes prefecture in parentheses', () => {
      const result = formatStationWithPrefecture(mockStations[2]);
      expect(result).toBe('大阪 (大阪府)');
    });
  });

  describe('formatStationWithKana', () => {
    test('includes kana reading in parentheses', () => {
      const result = formatStationWithKana(mockStations[1]);
      expect(result).toBe('新宿 (しんじゅく)');
    });
  });

  describe('getStationDisplayName', () => {
    test('returns compact name for search context', () => {
      const result = getStationDisplayName(mockStations[0], 'search');
      expect(result).toBe('東京');
    });

    test('returns detailed name for detailed context', () => {
      const result = getStationDisplayName(mockStations[0], 'detailed');
      expect(result).toBe('東京 (とうきょう・東京都)');
    });

    test('handles route context appropriately', () => {
      const result = getStationDisplayName(mockStations[3], 'route');
      expect(result).toContain('テスト駅');
    });
  });
});

describe('Enhanced Search Utilities', () => {
  describe('fuzzySearchStations', () => {
    test('finds exact matches with high score', () => {
      const results = fuzzySearchStations('東京', mockStations);
      expect(results).toHaveLength(1);
      expect(results[0].station.name).toBe('東京');
      expect(results[0].score).toBe(1.0);
    });

    test('finds kana matches', () => {
      const results = fuzzySearchStations('しんじゅく', mockStations);
      expect(results).toHaveLength(1);
      expect(results[0].station.name).toBe('新宿');
      expect(results[0].matchedField).toBe('kana');
    });

    test('finds partial matches', () => {
      const results = fuzzySearchStations('新', mockStations);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].station.name).toBe('新宿');
    });

    test('respects limit option', () => {
      const options: EnhancedSearchOptions = { limit: 1 };
      const results = fuzzySearchStations('テ', mockStations, options);
      expect(results).toHaveLength(1);
    });

    test('handles empty query', () => {
      const results = fuzzySearchStations('', mockStations);
      expect(results).toHaveLength(0);
    });

    test('handles non-matching query', () => {
      const results = fuzzySearchStations('存在しない駅', mockStations);
      expect(results).toHaveLength(0);
    });
  });

  describe('searchStationsByReading', () => {
    test('finds stations by hiragana reading', () => {
      const results = searchStationsByReading('とうきょう', mockStations);
      expect(results).toHaveLength(1);
      expect(results[0].station.name).toBe('東京');
    });

    test('finds partial reading matches', () => {
      const results = searchStationsByReading('しん', mockStations);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].station.name).toBe('新宿');
    });
  });

  describe('getStationSuggestions', () => {
    test('returns suggestions for partial input', () => {
      const suggestions = getStationSuggestions('東', mockStations, 5);
      expect(suggestions).toContain('東京');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    test('returns popular stations for empty input', () => {
      const suggestions = getStationSuggestions('', mockStations, 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
      expect(suggestions).toContain('東京'); // Should be included as major station
    });

    test('handles non-matching input', () => {
      const suggestions = getStationSuggestions('xyz', mockStations);
      expect(suggestions).toEqual(expect.any(Array));
    });
  });

  describe('filterStationsByPrefix', () => {
    test('filters by name prefix', () => {
      const results = filterStationsByPrefix('新', mockStations);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('新宿');
    });

    test('filters by kana prefix', () => {
      const results = filterStationsByPrefix('しん', mockStations, { includeKana: true });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('新宿');
    });

    test('respects limit option', () => {
      const results = filterStationsByPrefix('', mockStations, { limit: 2 });
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});

describe('Station Validation Utilities', () => {
  describe('validateStationId', () => {
    test('validates correct station ID', () => {
      const result = validateStationId(1130101);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects invalid station ID types', () => {
      const result = validateStationId(NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    test('rejects negative station IDs', () => {
      const result = validateStationId(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    test('warns about very large station IDs', () => {
      const result = validateStationId(999999999);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });
  });

  describe('validateStationName', () => {
    test('validates correct station name', () => {
      const result = validateStationName('東京');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects empty station name', () => {
      const result = validateStationName('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    test('rejects null/undefined station name', () => {
      const result = validateStationName(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    test('warns about very long station names', () => {
      const longName = 'a'.repeat(60);
      const result = validateStationName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_FORMAT');
    });

    test('provides suggestions for English-only names', () => {
      const result = validateStationName('Tokyo');
      expect(result.isValid).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('isJunctionStation', () => {
    test('identifies junction station correctly', () => {
      expect(isJunctionStation(mockStations[0])).toBe(true); // Tokyo
      expect(isJunctionStation(mockStations[3])).toBe(false); // Test station
    });

    test('considers stations with many lines as junctions', () => {
      const multiLineStation: StationInfo = {
        ...mockStations[3],
        lines: new Array(4).fill(mockStations[3].lines[0])
      };
      expect(isJunctionStation(multiLineStation)).toBe(true);
    });
  });

  describe('getStationLines', () => {
    test('returns line names without details', () => {
      const lines = getStationLines(mockStations[0], false);
      expect(lines).toContain('山手線');
      expect(lines).toContain('東海道線');
    });

    test('returns line names with company details', () => {
      const lines = getStationLines(mockStations[0], true);
      expect(lines).toContain('JR山手線');
      expect(lines).toContain('JR東海道線');
    });

    test('handles stations with no lines', () => {
      const stationNoLines: StationInfo = {
        ...mockStations[0],
        lines: []
      };
      const lines = getStationLines(stationNoLines);
      expect(lines).toHaveLength(0);
    });
  });
});

describe('Station Information Utilities', () => {
  describe('getStationMetadata', () => {
    test('generates comprehensive metadata', () => {
      const metadata = getStationMetadata(mockStations[0]);
      
      expect(metadata.station).toBe(mockStations[0]);
      expect(metadata.displayVariants.short).toBeDefined();
      expect(metadata.displayVariants.medium).toBeDefined();
      expect(metadata.displayVariants.long).toBeDefined();
      expect(metadata.displayVariants.withReading).toBeDefined();
      expect(metadata.displayVariants.withPrefecture).toBeDefined();
      
      expect(metadata.searchData.searchableTerms).toContain('東京');
      expect(metadata.searchData.searchableTerms).toContain('とうきょう');
      
      expect(metadata.uiHelpers.cssClass).toBe('station-major');
      expect(metadata.uiHelpers.priority).toBeGreaterThan(0);
    });
  });

  describe('compareStations', () => {
    test('compares stations alphabetically', () => {
      const comparison = compareStations(mockStations[0], mockStations[1], 'alphabetical');
      expect(comparison.criteria).toBe('alphabetical');
      expect(comparison.result).toBeLessThan(0); // 東京 < 新宿 alphabetically
    });

    test('compares stations by popularity', () => {
      const comparison = compareStations(mockStations[0], mockStations[1], 'popularity');
      expect(comparison.criteria).toBe('popularity');
      expect(comparison.result).toBeLessThan(0); // Tokyo (rank 1) < Shinjuku (rank 2)
    });

    test('compares stations by prefecture', () => {
      const comparison = compareStations(mockStations[0], mockStations[2], 'prefecture');
      expect(comparison.criteria).toBe('prefecture');
      expect(comparison.metadata?.prefectureMatch).toBe(false);
    });
  });

  describe('groupStationsByPrefecture', () => {
    test('groups stations by prefecture', () => {
      const grouped = groupStationsByPrefecture(mockStations);
      
      expect(grouped.length).toBe(2); // Tokyo and Osaka prefectures
      
      const tokyoGroup = grouped.find(g => g.prefecture.name === '東京都');
      expect(tokyoGroup).toBeDefined();
      expect(tokyoGroup!.count).toBe(3);
      expect(tokyoGroup!.stations.length).toBe(3);
      
      const osakaGroup = grouped.find(g => g.prefecture.name === '大阪府');
      expect(osakaGroup).toBeDefined();
      expect(osakaGroup!.count).toBe(1);
    });
  });

  describe('getPopularStations', () => {
    test('returns popular stations sorted by ranking', () => {
      const popular = getPopularStations(mockStations, 10);
      
      expect(popular.length).toBeGreaterThan(0);
      expect(popular[0].name).toBe('東京'); // Should be first (rank 1)
      
      // Check that they're sorted by ranking
      for (let i = 1; i < popular.length; i++) {
        const currentRank = popular[i].ranking || 9999;
        const prevRank = popular[i-1].ranking || 9999;
        expect(currentRank).toBeGreaterThanOrEqual(prevRank);
      }
    });

    test('respects limit parameter', () => {
      const popular = getPopularStations(mockStations, 2);
      expect(popular.length).toBeLessThanOrEqual(2);
    });

    test('filters out non-popular stations when limit is restrictive', () => {
      const popular = getPopularStations(mockStations, 1);
      expect(popular).toHaveLength(1);
      expect(popular[0].type).toMatch(/major|junction/);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  test('handles empty station arrays gracefully', () => {
    const emptyResults = fuzzySearchStations('test', []);
    expect(emptyResults).toHaveLength(0);
    
    const emptySuggestions = getStationSuggestions('test', []);
    expect(emptySuggestions).toHaveLength(0);
    
    const emptyFiltered = filterStationsByPrefix('test', []);
    expect(emptyFiltered).toHaveLength(0);
    
    const emptyGrouped = groupStationsByPrefecture([]);
    expect(emptyGrouped).toHaveLength(0);
    
    const emptyPopular = getPopularStations([]);
    expect(emptyPopular).toHaveLength(0);
  });

  test('handles malformed station data gracefully', () => {
    const malformedStation: Partial<StationInfo> = {
      id: 999,
      name: '不正駅',
      // Missing required fields
    };

    expect(() => {
      formatStationName(malformedStation as StationInfo);
    }).not.toThrow();

    expect(() => {
      isJunctionStation(malformedStation as StationInfo);
    }).not.toThrow();
  });

  test('handles special characters in search queries', () => {
    const specialQueries = ['東京!', '新宿@#$', 'テスト　駅', ''];
    
    specialQueries.forEach(query => {
      expect(() => {
        fuzzySearchStations(query, mockStations);
      }).not.toThrow();
      
      expect(() => {
        getStationSuggestions(query, mockStations);
      }).not.toThrow();
    });
  });
});