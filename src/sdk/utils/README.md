# Farert SDK Utilities

Framework-agnostic utilities for Japanese railway fare calculations, formatting, and runtime framework detection. These utilities are designed to work with React, Vue, Angular, Svelte, or vanilla JavaScript applications.

## Features

- 🎯 **Framework-agnostic**: Works in any JavaScript environment
- 🇯🇵 **Japanese text support**: Proper handling of Japanese station names and routes
- 💰 **Comprehensive fare formatting**: Currency display, breakdowns, and comparisons
- ✅ **Route validation**: Detailed validation with helpful error messages
- 🔧 **Fluent API**: Easy-to-use route builder pattern
- 🚀 **Framework detection**: Runtime detection for optimal SDK loading
- 📱 **Environment detection**: Browser, Node.js, SSR, bundler detection
- 🌳 **Tree-shakeable**: Import only what you need

## Quick Start

```typescript
import { 
  formatFare, 
  validateRoute, 
  createRouteBuilder,
  formatFareBreakdown,
  // Station utilities
  formatStationName,
  fuzzySearchStations,
  validateStationId,
  getStationDisplayName,
  // Framework detection
  detectFramework,
  getOptimizedSDKLoader,
  FrameworkDetector
} from '@farert/sdk/utils';

// Format fare with Japanese yen
const formattedFare = formatFare(1980); // "¥1,980"

// Validate route format
const validation = validateRoute('東京 東海道線 横浜');
if (!validation.isValid) {
  console.error(formatValidationErrors(validation));
}

// Build routes fluently
const route = createRouteBuilder()
  .from('東京')
  .via('東海道線', '横浜')
  .via('根岸線', '大船')
  .build(); // "東京 東海道線 横浜 根岸線 大船"

// Format detailed fare breakdown
const breakdown = formatFareBreakdown(fareInfoData, {
  showDetails: true,
  includeDiscounts: true
});

// Detect current framework and optimize loading
const detection = await detectFramework();
console.log(`Detected: ${detection.framework}`); // "svelte", "react", "vue", etc.

const loader = await getOptimizedSDKLoader();
const sdk = await loader(); // Loads framework-specific adapter
```

## API Reference

### Fare Formatting

#### `formatFare(fare: number, options?: LocaleOptions): string`

Format fare amount with Japanese yen symbol and localization.

```typescript
formatFare(1980); // "¥1,980"
formatFare(1980, { locale: 'ja-JP', useGrouping: false }); // "¥1980"
formatFare(1980, { locale: 'en-US' }); // "$19.80" (if currency changed)
```

**Options:**
- `locale?: string` - Locale for number formatting (default: 'ja-JP')
- `currency?: string` - Currency code (default: 'JPY')  
- `useGrouping?: boolean` - Use thousands separators (default: true)

#### `formatFareSimple(fare: number): string`

Format fare with simple yen symbol (C++ compatible).

```typescript
formatFareSimple(1980); // "¥1980"
```

#### `formatFareBreakdown(fareInfo: FareInfoData, options?: FareBreakdownOptions): string`

Format detailed fare breakdown with route, discounts, and rules.

```typescript
const breakdown = formatFareBreakdown(fareInfo, {
  showDetails: true,
  includeKilometers: true,
  includeDiscounts: true,
  includeRules: true
});

/* Output:
運賃: ¥1,980
経路: 東京 → 東海道線 → 横浜 → 根岸線 → 大船
営業キロ: 53km
こども運賃: ¥990
IC運賃: ¥1,976
割引運賃:
  定期券割引: ¥1,782
  回数券割引: ¥1,584
適用規則: 規則第114条（長距離逓減）
*/
```

### Station and Route Formatting

#### `formatStationName(stationName: string, stationId?: number, options?: StationNameOptions): string`

Format Japanese station names with proper handling and fallbacks.

```typescript
formatStationName('新宿'); // "新宿"
formatStationName('', 1001, { fallbackToId: true }); // "駅ID:1001"
formatStationName('非常に長い駅名です', undefined, { maxLength: 5 }); // "非常に長い…"
```

#### `formatRouteDescription(routeList: string): string`

Format route description in Japanese with proper arrows.

```typescript
formatRouteDescription('東京-横浜-大船'); // "東京 → 横浜 → 大船"
```

### Route Validation

#### `validateRoute(routeString: string): RouteValidationResult`

Validate route string format with detailed feedback.

```typescript
const validation = validateRoute('東京 東海道線 横浜');

if (validation.isValid) {
  console.log('Route is valid!');
} else {
  console.error('Validation errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

**Result structure:**
```typescript
interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}
```

#### `formatValidationErrors(validation: RouteValidationResult, locale?: 'ja' | 'en'): string`

Format validation errors for user display.

```typescript
const formatted = formatValidationErrors(validation);
/* Output:
❌ エラー:
  1. 駅名「tokyo」が見つかりません
     位置: 1番目の要素
     値: "tokyo"
     解決方法:
       - 正確な漢字駅名を使用してください
       - ひらがな・カタカナではなく漢字で入力してください
*/
```

### Route Builder

#### `createRouteBuilder(): RouteBuilder`

Create a fluent API builder for route construction.

```typescript
const builder = createRouteBuilder();

// Simple route
const route1 = builder
  .from('東京')
  .via('東海道線', '横浜')
  .build();

// Complex route
const route2 = builder
  .reset()
  .from('東京')
  .via('東海道線', '横浜')
  .via('根岸線', '大船')
  .via('東海道線', '藤沢')
  .build();

// Get as array
const routeArray = builder.buildArray(); // ['東京', '東海道線', '横浜', ...]
```

### Station Utilities

Advanced station handling utilities for Japanese railway stations with comprehensive formatting, search, and validation capabilities.

#### `formatStationName(station: StationInfo, options?: StationFormatOptions): string`

Format station information with flexible display options and Japanese text support.

```typescript
const station = {
  name: '東京',
  nameExtended: '東京駅', 
  kana: 'とうきょう',
  prefecture: '東京都'
};

// Basic formatting
formatStationName(station); // "東京"

// With prefecture
formatStationName(station, { includePrefecture: true }); // "東京 (東京都)"

// With kana reading
formatStationName(station, { includeKana: true }); // "東京 (とうきょう)"

// With both
formatStationName(station, { 
  includePrefecture: true, 
  includeKana: true 
}); // "東京 (とうきょう・東京都)"

// Length limiting
formatStationName(station, { maxLength: 10 }); // "東京"
```

**Options:**
- `includePrefecture?: boolean` - Include prefecture information
- `includeKana?: boolean` - Include Hiragana reading
- `maxLength?: number` - Maximum display length with intelligent truncation
- `fallback?: 'id' | 'name' | 'empty'` - Fallback behavior for missing data
- `separator?: string` - Text separator between components (default: '・')
- `parenthesesStyle?: 'round' | 'square' | 'none'` - Parentheses style for additional info

#### `getStationDisplayName(station: StationInfo, context?: string): string`

Get context-aware station display name with automatic format selection.

```typescript
// Different contexts
getStationDisplayName(station, 'search'); // "東京" (compact)
getStationDisplayName(station, 'route'); // "東京" or "東京 (東京都)" for locals
getStationDisplayName(station, 'detailed'); // "東京 (とうきょう・東京都)"
getStationDisplayName(station, 'compact'); // "東京"
```

#### `fuzzySearchStations(query: string, stations: StationInfo[], options?: EnhancedSearchOptions): StationSearchResult[]`

Intelligent station search with fuzzy matching, typo tolerance, and multiple language support.

```typescript
// Exact match
const results1 = fuzzySearchStations('東京', stations);
// [{ station: {...}, score: 1.0, matchedField: 'name' }]

// Hiragana input
const results2 = fuzzySearchStations('しんじゅく', stations);
// [{ station: {...}, score: 1.0, matchedField: 'kana' }]

// Typo tolerance
const results3 = fuzzySearchStations('Tokyio', stations, {
  enableRomanization: true,
  fuzzyMinScore: 0.7
});

// With options
const results4 = fuzzySearchStations('新', stations, {
  limit: 10,
  boostMajorStations: true,
  enableFuzzyMatching: true
});
```

**Options:**
- `enableFuzzyMatching?: boolean` - Enable typo tolerance
- `fuzzyMinScore?: number` - Minimum similarity score (0-1)
- `enableRomanization?: boolean` - Enable romanization matching
- `boostMajorStations?: boolean` - Boost major stations in results
- `limit?: number` - Maximum results to return

#### `searchStationsByReading(reading: string, stations: StationInfo[], options?: StationSearchOptions): StationSearchResult[]`

Search stations by Hiragana or romanized pronunciation.

```typescript
// Hiragana search
const results1 = searchStationsByReading('とうきょう', stations);

// Romanized search
const results2 = searchStationsByReading('tokyo', stations);

// Partial reading
const results3 = searchStationsByReading('しん', stations, { limit: 5 });
```

#### `getStationSuggestions(query: string, stations: StationInfo[], maxSuggestions?: number): string[]`

Get intelligent suggestions for partial or invalid station input.

```typescript
// Partial input suggestions
const suggestions1 = getStationSuggestions('新', stations, 10);
// ["新宿", "新橋", "新木場", "新大久保", "新小岩", ...]

// Empty input returns popular stations
const suggestions2 = getStationSuggestions('', stations, 5);
// ["東京", "新宿", "渋谷", "池袋", "品川"]

// Typo suggestions
const suggestions3 = getStationSuggestions('Shibuya', stations);
// ["渋谷", "新宿", "品川", ...]
```

#### `filterStationsByPrefix(prefix: string, stations: StationInfo[], options?: object): StationInfo[]`

Efficient prefix-based filtering for autocomplete scenarios.

```typescript
// Name prefix
const matches1 = filterStationsByPrefix('新', stations, { limit: 10 });

// Kana prefix
const matches2 = filterStationsByPrefix('しん', stations, { 
  includeKana: true,
  limit: 5 
});
```

#### `validateStationId(id: number): StationValidationResult`

Comprehensive station ID validation with detailed feedback.

```typescript
// Valid ID
const result1 = validateStationId(1130101);
// { isValid: true, errors: [], suggestions: [] }

// Invalid ID
const result2 = validateStationId(-1);
// { 
//   isValid: false, 
//   errors: [{ 
//     code: 'INVALID_FORMAT', 
//     message: 'Station ID must be a positive integer',
//     suggestions: ['Station IDs start from 1']
//   }]
// }
```

#### `validateStationName(name: string): StationValidationResult`

Validate station name format with helpful suggestions.

```typescript
// Valid name
const result1 = validateStationName('東京');
// { isValid: true, errors: [], suggestions: [] }

// English name (valid but with suggestions)
const result2 = validateStationName('Tokyo');
// { 
//   isValid: true, 
//   errors: [], 
//   suggestions: ['Consider using the Japanese name for better results']
// }

// Empty name
const result3 = validateStationName('');
// { 
//   isValid: false,
//   errors: [{ code: 'INVALID_FORMAT', message: 'Station name cannot be empty' }]
// }
```

#### `getStationMetadata(station: StationInfo): StationMetadata`

Generate comprehensive metadata for enhanced UI display.

```typescript
const metadata = getStationMetadata(station);

// Access display variants
console.log(metadata.displayVariants.short); // "東京"
console.log(metadata.displayVariants.withPrefecture); // "東京 (東京都)"

// Search optimization data
console.log(metadata.searchData.searchableTerms); 
// ["東京", "東京駅", "とうきょう", "tokyo", ...]

// UI helpers
console.log(metadata.uiHelpers.cssClass); // "station-major"
console.log(metadata.uiHelpers.priority); // 150
```

#### `groupStationsByPrefecture(stations: StationInfo[]): StationsByPrefecture[]`

Organize stations by prefecture with metadata for hierarchical displays.

```typescript
const grouped = groupStationsByPrefecture(stations);

grouped.forEach(group => {
  console.log(`${group.prefecture.name}: ${group.count} stations`);
  console.log(`Major stations: ${group.majorStations.length}`);
  
  group.stations.forEach(station => {
    console.log(`  - ${station.name}`);
  });
});

/*
東京都: 150 stations
Major stations: 25
  - 東京
  - 新宿
  - 渋谷
  ...

大阪府: 87 stations  
Major stations: 12
  - 大阪
  - 梅田
  - 難波
  ...
*/
```

#### `getPopularStations(stations: StationInfo[], limit?: number): StationInfo[]`

Get curated list of popular stations sorted by relevance.

```typescript
// Top 10 popular stations
const popular = getPopularStations(stations, 10);
console.log(popular.map(s => s.name)); 
// ["東京", "新宿", "渋谷", "池袋", "品川", "新橋", "上野", "大阪", "梅田", "難波"]

// All major/junction stations
const allPopular = getPopularStations(stations);
```

#### Utility Helper Functions

```typescript
// Check if station is a junction
isJunctionStation(station); // true/false

// Get formatted line information
getStationLines(station); // ["山手線", "東海道線"]
getStationLines(station, true); // ["JR山手線", "JR東海道線"] (with company)

// Compare stations for sorting
const comparison = compareStations(stationA, stationB, 'popularity');
stations.sort((a, b) => compareStations(a, b, 'alphabetical').result);

// Convenience formatting functions
formatStationWithPrefecture(station); // "東京 (東京都)"
formatStationWithKana(station); // "東京 (とうきょう)"
```

### Utility Functions

#### `isFareReasonable(fare: number): { isReasonable: boolean; reason?: string }`

Check if fare amount is within reasonable bounds.

```typescript
isFareReasonable(1980); // { isReasonable: true }
isFareReasonable(100); // { isReasonable: false, reason: '運賃が最低運賃未満です' }
isFareReasonable(60000); // { isReasonable: false, reason: '運賃が異常に高額です' }
```

#### `formatKilometers(km: number): string`

Format distance with appropriate units.

```typescript
formatKilometers(53); // "53km"
formatKilometers(53.7); // "53.7km" 
formatKilometers(0.5); // "500m"
```

#### `compareFares(fare1: FareInfoData, fare2: FareInfoData, labels?: [string, string]): string`

Compare two fare calculations and highlight differences.

```typescript
const comparison = compareFares(fareA, fareB, ['Direct Route', 'Express Route']);
/* Output:
運賃比較: Direct Route vs Express Route
Direct Route: ¥1980
Express Route: ¥2210
差額: ¥230 (Direct Routeが安い)
*/
```

## Framework Integration Examples

### React

```tsx
import React from 'react';
import { formatFare, formatFareBreakdown, validateRoute } from '@farert/sdk/utils';

function FareDisplay({ fareInfo }: { fareInfo: FareInfoData }) {
  const formattedFare = formatFare(fareInfo.fare);
  const breakdown = formatFareBreakdown(fareInfo, { showDetails: true });
  
  return (
    <div>
      <h3>運賃: {formattedFare}</h3>
      <pre>{breakdown}</pre>
    </div>
  );
}

function RouteInput({ onRouteChange }: { onRouteChange: (route: string) => void }) {
  const [route, setRoute] = React.useState('');
  const [validation, setValidation] = React.useState(null);
  
  const handleRouteChange = (value: string) => {
    setRoute(value);
    const validation = validateRoute(value);
    setValidation(validation);
    
    if (validation.isValid) {
      onRouteChange(value);
    }
  };
  
  return (
    <div>
      <input 
        value={route}
        onChange={(e) => handleRouteChange(e.target.value)}
        placeholder="東京 東海道線 横浜"
      />
      {validation && !validation.isValid && (
        <div className="error">
          {formatValidationErrors(validation)}
        </div>
      )}
    </div>
  );
}
```

### Vue 3

```vue
<template>
  <div>
    <h3>運賃: {{ formattedFare }}</h3>
    <pre>{{ breakdown }}</pre>
    
    <input 
      v-model="route"
      @input="validateRoute"
      placeholder="東京 東海道線 横浜"
    />
    <div v-if="!routeValid" class="error">
      {{ validationErrors }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  formatFare, 
  formatFareBreakdown, 
  validateRoute as validateRouteUtil,
  formatValidationErrors 
} from '@farert/sdk/utils';

const props = defineProps<{ fareInfo: FareInfoData }>();
const route = ref('');
const validation = ref(null);

const formattedFare = computed(() => formatFare(props.fareInfo.fare));
const breakdown = computed(() => formatFareBreakdown(props.fareInfo, { showDetails: true }));
const routeValid = computed(() => validation.value?.isValid ?? true);
const validationErrors = computed(() => 
  validation.value ? formatValidationErrors(validation.value) : ''
);

function validateRoute() {
  validation.value = validateRouteUtil(route.value);
}
</script>
```

### Svelte

```svelte
<script lang="ts">
  import { 
    formatFare, 
    formatFareBreakdown, 
    validateRoute,
    formatValidationErrors 
  } from '@farert/sdk/utils';
  
  export let fareInfo: FareInfoData;
  
  let route = '';
  $: validation = validateRoute(route);
  $: formattedFare = formatFare(fareInfo.fare);
  $: breakdown = formatFareBreakdown(fareInfo, { showDetails: true });
</script>

<div>
  <h3>運賃: {formattedFare}</h3>
  <pre>{breakdown}</pre>
  
  <input 
    bind:value={route}
    placeholder="東京 東海道線 横浜"
  />
  
  {#if !validation.isValid}
    <div class="error">
      <pre>{formatValidationErrors(validation)}</pre>
    </div>
  {/if}
</div>
```

### Angular

```typescript
// fare-display.component.ts
import { Component, Input } from '@angular/core';
import { 
  formatFare, 
  formatFareBreakdown, 
  validateRoute,
  formatValidationErrors,
  type FareInfoData,
  type RouteValidationResult
} from '@farert/sdk/utils';

@Component({
  selector: 'app-fare-display',
  template: `
    <div>
      <h3>運賃: {{ formattedFare }}</h3>
      <pre>{{ breakdown }}</pre>
      
      <input 
        [(ngModel)]="route"
        (input)="onRouteChange()"
        placeholder="東京 東海道線 横浜"
      />
      
      <div *ngIf="!validation?.isValid" class="error">
        <pre>{{ validationErrors }}</pre>
      </div>
    </div>
  `
})
export class FareDisplayComponent {
  @Input() fareInfo!: FareInfoData;
  
  route = '';
  validation: RouteValidationResult | null = null;
  
  get formattedFare(): string {
    return formatFare(this.fareInfo.fare);
  }
  
  get breakdown(): string {
    return formatFareBreakdown(this.fareInfo, { showDetails: true });
  }
  
  get validationErrors(): string {
    return this.validation ? formatValidationErrors(this.validation) : '';
  }
  
  onRouteChange(): void {
    this.validation = validateRoute(this.route);
  }
}
```

### Vanilla JavaScript

```javascript
import { 
  formatFare, 
  formatFareBreakdown, 
  validateRoute,
  formatValidationErrors,
  createRouteBuilder 
} from '@farert/sdk/utils';

// Format fare
const fareElement = document.getElementById('fare');
fareElement.textContent = formatFare(1980);

// Route builder
const builder = createRouteBuilder();
const route = builder
  .from('東京')
  .via('東海道線', '横浜')
  .build();

// Validate route input
const routeInput = document.getElementById('route-input');
const errorDiv = document.getElementById('validation-errors');

routeInput.addEventListener('input', (e) => {
  const validation = validateRoute(e.target.value);
  
  if (validation.isValid) {
    errorDiv.style.display = 'none';
    routeInput.classList.remove('error');
  } else {
    errorDiv.style.display = 'block';
    errorDiv.textContent = formatValidationErrors(validation);
    routeInput.classList.add('error');
  }
});

// Display fare breakdown
function displayFareBreakdown(fareInfo) {
  const breakdown = formatFareBreakdown(fareInfo, {
    showDetails: true,
    includeDiscounts: true,
    includeRules: true
  });
  
  document.getElementById('fare-breakdown').textContent = breakdown;
}
```

### Framework Detection

#### `detectFramework(): Promise<FrameworkDetectionResult>`

Detect the current JavaScript framework and environment with comprehensive analysis.

```typescript
const detection = await detectFramework();

console.log('Framework:', detection.framework); // "svelte", "react", "vue", "angular", "vanilla"
console.log('Meta-framework:', detection.metaFramework); // "sveltekit", "nextjs", "nuxtjs", etc.
console.log('Confidence:', detection.confidence); // 0.0 - 1.0
console.log('Version:', detection.version); // Framework version if detectable

// Environment details
console.log('Runtime:', detection.details.bundler?.type); // "vite", "webpack", "rollup"
console.log('Has HMR:', detection.details.bundler?.hasHMR); // true/false
console.log('Supports SSR:', detection.details.supportsSSR); // true/false
console.log('Has Virtual DOM:', detection.details.hasVirtualDOM); // true/false

// Optimization recommendations
console.log('Recommendations:', detection.details.optimizationHints);
/*
[
  "Use Svelte stores for reactive state management",
  "Leverage compile-time optimizations", 
  "Use context API for dependency injection"
]
*/
```

#### `getOptimizedSDKLoader(): Promise<() => Promise<any>>`

Get an optimized SDK loader function for the detected framework.

```typescript
// Automatically loads the best SDK adapter
const loader = await getOptimizedSDKLoader();
const sdk = await loader();

// Uses Svelte adapter if Svelte detected
// Uses React adapter if React detected  
// Falls back to core SDK for vanilla JS
```

#### `getFrameworkConfig(): Promise<Record<string, any>>`

Get framework-specific configuration and recommendations.

```typescript
const config = await getFrameworkConfig();

console.log('Framework:', config.framework);
console.log('Detection result:', config.detection);
console.log('Recommendations:', config.recommendations);

// Example output for Svelte:
/*
{
  framework: "svelte",
  useStores: true,
  detection: { framework: "svelte", confidence: 0.95, ... },
  recommendations: [
    "Use Svelte stores for reactive state management",
    "Leverage compile-time optimizations",
    "Use context API for component communication"
  ]
}
*/
```

#### `isFrameworkSupported(framework: FrameworkType): Promise<boolean>`

Check if a specific framework adapter is available and compatible.

```typescript
const reactSupported = await isFrameworkSupported('react');
const vueSupported = await isFrameworkSupported('vue');

if (reactSupported) {
  // Load React-specific features
} else {
  // Fallback to core SDK
}
```

#### `FrameworkDetector` Class

Advanced framework detection with custom rules and caching.

```typescript
import { FrameworkDetector, type DetectionRule } from '@farert/sdk/utils';

// Create detector with custom configuration
const detector = new FrameworkDetector({
  enableLazyLoading: true,
  preloadDetectedAdapters: true,
  cacheDetection: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  fallbackStrategy: 'vanilla'
});

// Add custom detection rules
const customRules: DetectionRule[] = [
  {
    name: 'electron-app',
    detect: () => typeof (globalThis as any).require === 'function' && 
                  typeof process?.versions?.electron !== 'undefined',
    framework: 'vanilla',
    metaFramework: 'electron',
    confidence: 0.95,
    priority: 100
  }
];

const customDetector = new FrameworkDetector({
  customDetectionRules: customRules
});

// Perform detection
const result = await detector.detectFramework();

// Get framework adapter
const adapter = await detector.getAdapter('react');

// Clear cache
detector.clearCache();

// Get debug information
const debugInfo = await detector.getDebugInfo();
```

#### Development Utilities

Debug and optimize framework detection in development mode.

```typescript
import { frameworkDetectorDev } from '@farert/sdk/utils';

// Only available in development mode
if (process.env.NODE_ENV === 'development') {
  // Log comprehensive detection information
  await frameworkDetectorDev.logDetectionInfo();
  
  // Force fresh detection (clears cache)
  const freshResult = await frameworkDetectorDev.forceRedetection();
  
  // Benchmark detection performance
  const avgTime = await frameworkDetectorDev.benchmarkDetection(10);
  console.log(`Average detection time: ${avgTime}ms`);
  
  // Test custom detection rules
  const testRules = [/* custom rules */];
  const matchingRules = await frameworkDetectorDev.testCustomRules(testRules);
}
```

### Framework Detection Types

```typescript
interface FrameworkDetectionResult {
  framework: FrameworkType; // Primary framework
  metaFramework?: MetaFrameworkType; // Meta-framework (Next.js, Nuxt.js, etc.)
  version?: string; // Framework version
  confidence: number; // Detection confidence (0-1)
  details: FrameworkDetails; // Environment and optimization details
}

type FrameworkType = 
  | 'svelte' | 'react' | 'vue' | 'angular' | 'vanilla' | 'unknown';

type MetaFrameworkType = 
  | 'sveltekit' | 'nextjs' | 'nuxtjs' | 'gatsby' | 'remix' 
  | 'quasar' | 'ionic' | 'electron' | 'tauri' | 'none';

interface FrameworkDetails {
  hasVirtualDOM: boolean;
  supportsSSR: boolean;  
  isComponentBased: boolean;
  hasReactiveState: boolean;
  optimizationHints: string[];
  bundler?: BundlerInfo;
}

interface BundlerInfo {
  type: 'vite' | 'webpack' | 'rollup' | 'parcel' | 'unknown';
  version?: string;
  hasHMR: boolean;
  hasTreeShaking: boolean;
}
```

### Use Cases

**Automatic SDK Optimization:**
```typescript
// Automatically load optimal SDK configuration
const detection = await detectFramework();
const loader = await getOptimizedSDKLoader();
const sdk = await loader();

if (detection.framework === 'svelte') {
  // Use Svelte stores and reactivity
  const stores = await sdk.createStoreCollection();
} else if (detection.framework === 'react') {
  // Use React hooks and context
  const { useFareCalculation } = sdk;
}
```

**Conditional Feature Loading:**
```typescript
const detection = await detectFramework();

// Load only framework-specific features
if (detection.framework === 'react') {
  await import('../react/hooks');
} else if (detection.framework === 'vue') {
  await import('../vue/composables');
}
```

**Bundle Size Optimization:**
```typescript
// Dynamic imports based on detected framework
const imports = {
  core: () => import('../core'),
  ...(detection.framework === 'svelte' && {
    svelte: () => import('../svelte')
  }),
  ...(detection.framework === 'react' && {
    react: () => import('../react')
  })
};
```

**Development Tools Integration:**
```typescript
if (detection.details.bundler?.hasHMR) {
  console.log('🔥 HMR detected - enabling development optimizations');
}

if (detection.details.bundler?.hasTreeShaking) {
  console.log('🌳 Tree shaking enabled - using modular imports');
}
```

## Best Practices

1. **Use TypeScript**: All utilities are fully typed for better development experience
2. **Tree-shake imports**: Import only what you need to minimize bundle size
3. **Handle Japanese text carefully**: Use the provided formatting utilities for proper display
4. **Validate user input**: Always validate route strings before processing
5. **Provide user feedback**: Use formatted error messages for better UX
6. **Cache results**: Consider caching formatted results for better performance

## Error Handling

The utilities are designed to fail gracefully:

- Invalid inputs return safe fallback values
- Validation functions provide detailed error messages
- Japanese text normalization includes fallbacks
- All functions handle edge cases (empty strings, null values, etc.)

```typescript
// Safe fallbacks
formatFare(0); // "¥0" (not an error)
formatStationName(''); // "駅名不明" 
validateRoute('invalid').isValid; // false (with helpful errors)
```

## Performance Considerations

- All utilities are synchronous and lightweight
- String operations are optimized for Japanese text
- Number formatting uses native `Intl` APIs when available
- Validation is performed client-side for immediate feedback
- Functions are designed to be called frequently without performance issues

## Contributing

When extending these utilities:

1. Maintain framework-agnostic design
2. Add comprehensive TypeScript types  
3. Include JSDoc documentation
4. Add unit tests for new functionality
5. Follow the existing naming conventions
6. Ensure Japanese text handling is correct