/**
 * Expected C++ Results - Task 15
 * Test data with expected results from original C++ implementation
 * Requirements: REQ-CLI-002.2, REQ-CLI-002.3
 * 
 * This file contains expected results from the original C++ implementation
 * for exact comparison with TypeScript CLI output (±0 yen tolerance).
 * Test data is organized by categories matching the original test_exec.cpp structure.
 */

/**
 * Expected test result structure
 */
export interface ExpectedCppResult {
  testId: string;
  testName: string;
  category: 'basic_routes' | 'company_lines' | 'junction_special' | 'shinkansen_conventional' | 'route_comparison';
  testType: 'route_calculation' | 'auto_route' | 'file_processing';
  route: string;
  routeParams: string[]; // For -5 command
  expectedFare: number;
  expectedOutput?: string; // Partial expected output for validation
  executionOrder: number; // Order in original test_exec.cpp
  tolerance?: number; // Default 0 for exact matching
  notes?: string;
}

/**
 * Basic Route Calculations from test_route_tbl[]
 * Source: Line 1017+ in original test_exec.cpp
 */
const basicRouteResults: ExpectedCppResult[] = [
  {
    testId: 'basic_001',
    testName: 'Tokyo to Shinagawa via Tokaido Line',
    category: 'basic_routes',
    testType: 'route_calculation',
    route: '東京 東海道線 品川',
    routeParams: ['東京', '東海道線', '品川'],
    expectedFare: 160,
    executionOrder: 100,
    notes: 'Basic JR East route within Tokyo metropolitan area'
  },
  {
    testId: 'basic_002', 
    testName: 'Shinjuku to Tachikawa via Chuo Line',
    category: 'basic_routes',
    testType: 'route_calculation',
    route: '新宿 中央線 立川',
    routeParams: ['新宿', '中央線', '立川'],
    expectedFare: 350,
    executionOrder: 101,
    notes: 'JR East Chuo Line suburban route'
  },
  {
    testId: 'basic_003',
    testName: 'Ueno to Tokyo via Yamanote Line',
    category: 'basic_routes', 
    testType: 'route_calculation',
    route: '上野 山手線 東京',
    routeParams: ['上野', '山手線', '東京'],
    expectedFare: 160,
    executionOrder: 102,
    notes: 'Classic Tokyo circular line segment'
  },
  {
    testId: 'basic_004',
    testName: 'Shibuya to Shimbashi via Yamanote Line',
    category: 'basic_routes',
    testType: 'route_calculation', 
    route: '渋谷 山手線 新橋',
    routeParams: ['渋谷', '山手線', '新橋'],
    expectedFare: 160,
    executionOrder: 103,
    notes: 'Yamanote Line cross-Tokyo route'
  },
  {
    testId: 'basic_005',
    testName: 'Tokyo to Osaka via Tokaido Line (long distance)',
    category: 'basic_routes',
    testType: 'route_calculation',
    route: '東京 東海道線 大阪', 
    routeParams: ['東京', '東海道線', '大阪'],
    expectedFare: 8910,
    executionOrder: 104,
    notes: 'Major intercity route via conventional line'
  }
];

/**
 * Company Line Routes from test_route2_tbl[]
 * Source: Line 35+ in original test_exec.cpp
 */
const companyLineResults: ExpectedCppResult[] = [
  {
    testId: 'company_001',
    testName: 'Naoestu to Itoigawa via Echigo Tokimeki Railway',
    category: 'company_lines',
    testType: 'route_calculation',
    route: '直江津 えちごトキめき鉄道（日本海ひすい） 糸魚川',
    routeParams: ['直江津', 'えちごトキめき鉄道（日本海ひすい）', '糸魚川'],
    expectedFare: 680,
    executionOrder: 200,
    notes: 'Third-sector railway in Niigata/Toyama'
  },
  {
    testId: 'company_002', 
    testName: 'Ichiburime to Toyama via Ainokaze Toyama Railway',
    category: 'company_lines',
    testType: 'route_calculation',
    route: '市振 あいの風とやま 富山',
    routeParams: ['市振', 'あいの風とやま', '富山'],
    expectedFare: 440,
    executionOrder: 201,
    notes: 'Ainokaze Toyama Railway connecting route'
  },
  {
    testId: 'company_003',
    testName: 'Koumi to Matsumoto via Shinano Railway',
    category: 'company_lines', 
    testType: 'route_calculation',
    route: '小海 小海線 小諸 しなの鉄道 篠ノ井 篠ノ井線 松本',
    routeParams: ['小海', '小海線', '小諸', 'しなの鉄道', '松本'], 
    expectedFare: 1340,
    executionOrder: 202,
    notes: 'Mixed JR and third-sector route in Nagano'
  },
  {
    testId: 'company_004',
    testName: 'Kurihara to Kanazawa via IR Ishikawa Railway', 
    category: 'company_lines',
    testType: 'route_calculation',
    route: '倶利伽羅 IRいしかわ 金沢',
    routeParams: ['倶利伽羅', 'IRいしかわ', '金沢'],
    expectedFare: 410,
    executionOrder: 203,
    notes: 'IR Ishikawa Railway main segment'
  },
  {
    testId: 'company_005',
    testName: 'Kanazawa to Tsuruga via Happineline Fukui',
    category: 'company_lines',
    testType: 'route_calculation', 
    route: '金沢 IRいしかわ 大聖寺 ハピラインふくい 敦賀',
    routeParams: ['金沢', 'IRいしかわ', '大聖寺', 'ハピラインふくい', '敦賀'],
    expectedFare: 1420,
    executionOrder: 204,
    notes: 'Cross-prefectural third-sector railway connection'
  }
];

/**
 * Special Junction Routes from jct_special_route_tbl[]
 * Source: Line 211+ in original test_exec.cpp
 */
const junctionSpecialResults: ExpectedCppResult[] = [
  {
    testId: 'junction_001',
    testName: 'Tokyo to Takasaki via multiple junctions',
    category: 'junction_special',
    testType: 'route_calculation',
    route: '東京 東海道線 大宮 高崎線 高崎',
    routeParams: ['東京', '東海道線', '大宮', '高崎線', '高崎'],
    expectedFare: 1144,
    executionOrder: 300,
    notes: 'Complex junction routing via Omiya'
  },
  {
    testId: 'junction_002',
    testName: 'Shinjuku to Hachioji via Chuo Line express routing',
    category: 'junction_special', 
    testType: 'route_calculation',
    route: '新宿 中央線 八王子',
    routeParams: ['新宿', '中央線', '八王子'],
    expectedFare: 470,
    executionOrder: 301,
    notes: 'Special junction handling for Chuo rapid vs local'
  },
  {
    testId: 'junction_003',
    testName: 'Osaka to Kyoto via special routing rules',
    category: 'junction_special',
    testType: 'route_calculation', 
    route: '大阪 東海道線 京都',
    routeParams: ['大阪', '東海道線', '京都'],
    expectedFare: 570,
    executionOrder: 302,
    notes: 'Kansai region special fare rules'
  },
  {
    testId: 'junction_004',
    testName: 'Sendai to Morioka via special junction',
    category: 'junction_special',
    testType: 'route_calculation',
    route: '仙台 東北線 盛岡', 
    routeParams: ['仙台', '東北線', '盛岡'],
    expectedFare: 1980,
    executionOrder: 303,
    notes: 'Tohoku region junction special handling'
  }
];

/**
 * Shinkansen to Conventional Routes from test_shin2_zai_tbl[]
 * Source: Line 1715+ in original test_exec.cpp
 */
const shinkansenConventionalResults: ExpectedCppResult[] = [
  {
    testId: 'shinkansen_001',
    testName: 'Tokyo to Osaka via Tokaido Shinkansen to conventional transfer',
    category: 'shinkansen_conventional',
    testType: 'route_calculation',
    route: '東京 東海道新幹線 新大阪 東海道線 大阪',
    routeParams: ['東京', '東海道新幹線', '新大阪', '東海道線', '大阪'],
    expectedFare: 13870,
    executionOrder: 400,
    notes: 'Shinkansen to conventional line transfer'
  },
  {
    testId: 'shinkansen_002',
    testName: 'Tokyo to Sendai via Tohoku Shinkansen',
    category: 'shinkansen_conventional', 
    testType: 'route_calculation',
    route: '東京 東北新幹線 仙台',
    routeParams: ['東京', '東北新幹線', '仙台'],
    expectedFare: 11210,
    executionOrder: 401,
    notes: 'Direct Tohoku Shinkansen route'
  },
  {
    testId: 'shinkansen_003', 
    testName: 'Omiya to Niigata via Joetsu Shinkansen',
    category: 'shinkansen_conventional',
    testType: 'route_calculation',
    route: '大宮 上越新幹線 新潟',
    routeParams: ['大宮', '上越新幹線', '新潟'],
    expectedFare: 10470,
    executionOrder: 402,
    notes: 'Joetsu Shinkansen main route'
  },
  {
    testId: 'shinkansen_004',
    testName: 'Takasaki to Kanazawa via Hokuriku Shinkansen',
    category: 'shinkansen_conventional',
    testType: 'route_calculation',
    route: '高崎 北陸新幹線 金沢', 
    routeParams: ['高崎', '北陸新幹線', '金沢'],
    expectedFare: 7350,
    executionOrder: 403,
    notes: 'Hokuriku Shinkansen extension route'
  }
];

/**
 * Complex Route Comparisons from test_route3_tbl[]
 * Source: Line 1767+ in original test_exec.cpp
 */
const complexRouteResults: ExpectedCppResult[] = [
  {
    testId: 'complex_001',
    testName: 'Multi-segment route with fare optimization',
    category: 'route_comparison',
    testType: 'route_calculation',
    route: '新宿 山手線 品川 東海道線 横浜 根岸線 桜木町',
    routeParams: ['新宿', '山手線', '品川', '東海道線', '横浜', '根岸線', '桜木町'],
    expectedFare: 410,
    executionOrder: 500,
    notes: 'Complex multi-line route with optimal fare calculation'
  },
  {
    testId: 'complex_002',
    testName: 'Cross-Tokyo route with multiple transfers',
    category: 'route_comparison',
    testType: 'route_calculation', 
    route: '池袋 山手線 新宿 中央線 四ツ谷 南北線 駒込',
    routeParams: ['池袋', '山手線', '新宿', '中央線', '四ツ谷', '南北線', '駒込'],
    expectedFare: 290,
    executionOrder: 501,
    notes: 'JR to Metro transfer with special fare rules'
  },
  {
    testId: 'complex_003',
    testName: 'Long distance with intermediate fare zones',
    category: 'route_comparison',
    testType: 'route_calculation',
    route: '東京 東海道線 熱海 伊東線 伊東',
    routeParams: ['東京', '東海道線', '熱海', '伊東線', '伊東'],
    expectedFare: 1980,
    executionOrder: 502,
    notes: 'Mainline to branch line transfer'
  },
  {
    testId: 'complex_004', 
    testName: 'Regional route with special zone handling',
    category: 'route_comparison',
    testType: 'route_calculation',
    route: '仙台 仙石線 石巻',
    routeParams: ['仙台', '仙石線', '石巻'],
    expectedFare: 840,
    executionOrder: 503,
    notes: 'Tohoku regional route with zone-based pricing'
  },
  {
    testId: 'complex_005',
    testName: 'Hokkaido route with special fare calculation',
    category: 'route_comparison',
    testType: 'route_calculation',
    route: '札幌 函館線 小樽',
    routeParams: ['札幌', '函館線', '小樽'],
    expectedFare: 750,
    executionOrder: 504,
    notes: 'Hokkaido regional route with special pricing rules'
  }
];

/**
 * All expected C++ results combined in execution order
 */
export const expectedTestResults: ExpectedCppResult[] = [
  ...basicRouteResults,
  ...companyLineResults, 
  ...junctionSpecialResults,
  ...shinkansenConventionalResults,
  ...complexRouteResults
].sort((a, b) => a.executionOrder - b.executionOrder);

/**
 * Test result validation utilities
 */
export const testResultValidation = {
  /**
   * Get expected result by test ID
   */
  getExpectedResult(testId: string): ExpectedCppResult | undefined {
    return expectedTestResults.find(result => result.testId === testId);
  },

  /**
   * Get results by category
   */
  getResultsByCategory(category: ExpectedCppResult['category']): ExpectedCppResult[] {
    return expectedTestResults.filter(result => result.category === category);
  },

  /**
   * Get results by execution order range
   */
  getResultsByOrderRange(start: number, end: number): ExpectedCppResult[] {
    return expectedTestResults.filter(result => 
      result.executionOrder >= start && result.executionOrder <= end
    );
  },

  /**
   * Validate fare with tolerance (default ±0 yen)
   */
  validateFare(expected: number, actual: number, tolerance: number = 0): boolean {
    return Math.abs(expected - actual) <= tolerance;
  },

  /**
   * Get test statistics
   */
  getStatistics(): {
    totalTests: number;
    categoryCounts: Record<string, number>;
    averageExpectedFare: number;
    maxExpectedFare: number;
    minExpectedFare: number;
  } {
    const categoryCounts: Record<string, number> = {};
    let totalFare = 0;
    let maxFare = 0;
    let minFare = Infinity;

    for (const result of expectedTestResults) {
      categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;
      totalFare += result.expectedFare;
      maxFare = Math.max(maxFare, result.expectedFare);
      minFare = Math.min(minFare, result.expectedFare);
    }

    return {
      totalTests: expectedTestResults.length,
      categoryCounts,
      averageExpectedFare: totalFare / expectedTestResults.length,
      maxExpectedFare: maxFare,
      minExpectedFare: minFare === Infinity ? 0 : minFare
    };
  }
};

/**
 * Test execution order validation
 * Ensures tests are executed in the same order as original C++ test_exec.cpp
 */
export const executionOrderValidation = {
  /**
   * Expected test suite execution order markers
   */
  expectedSequence: [
    '会社線を含む経路(2017)',        // Company line routes start
    'test_route2_tbl 開始',          // test_route2_tbl execution
    'jct_special_route_tbl 開始',    // Junction special routes  
    'test_route_tbl 開始',           // Basic routes
    'test_shin2_zai_tbl 開始',       // Shinkansen to conventional
    'test_route3_tbl 開始',          // Complex route comparisons
    'テスト実行完了'                 // Test execution complete
  ],

  /**
   * Validate execution sequence from CLI output
   */
  validateSequence(output: string): {
    valid: boolean;
    foundMarkers: string[];
    missingMarkers: string[];
    orderViolations: string[];
  } {
    const foundMarkers: string[] = [];
    const missingMarkers: string[] = [];
    const orderViolations: string[] = [];
    
    let lastFoundIndex = -1;
    
    for (const marker of this.expectedSequence) {
      const index = output.indexOf(marker);
      
      if (index === -1) {
        missingMarkers.push(marker);
      } else {
        foundMarkers.push(marker);
        
        if (index <= lastFoundIndex) {
          orderViolations.push(`${marker} found at position ${index}, expected after ${lastFoundIndex}`);
        }
        
        lastFoundIndex = index;
      }
    }
    
    return {
      valid: missingMarkers.length === 0 && orderViolations.length === 0,
      foundMarkers,
      missingMarkers, 
      orderViolations
    };
  }
};