# Farert WebAssembly SDK - API Reference

A comprehensive Svelte-first TypeScript SDK for Japanese railway fare calculations, built on top of the industry-proven C++ implementation used by major transit planning applications.

## 🎯 Overview

The Farert WebAssembly SDK provides a modern TypeScript interface to 39+ WebAssembly APIs and 5 Object Classes for calculating Japanese railway fares with 100% compatibility to the original C++ implementation. This SDK offers:

- **Svelte-first design** with reactive stores and components
- **SvelteKit SSR** support with static generation
- **Framework-agnostic utilities** for React, Vue, Angular, and vanilla JavaScript
- **Complete TypeScript type safety** with strict mode
- **Intelligent caching layer** for optimal performance
- **Comprehensive error handling** with retry logic

## 📋 Table of Contents

1. [Installation & Quick Start](#installation--quick-start)
2. [Core SDK Interface](#core-sdk-interface)
3. [Svelte Integration](#svelte-integration)
4. [SvelteKit SSR Integration](#sveltekit-ssr-integration)
5. [Object Classes](#object-classes)
6. [Station & Route Operations](#station--route-operations)
7. [Caching & Performance](#caching--performance)
8. [Framework-Agnostic Utilities](#framework-agnostic-utilities)
9. [Error Handling](#error-handling)
10. [Real-World Examples](#real-world-examples)
11. [Troubleshooting](#troubleshooting)
12. [Best Practices](#best-practices)

---

## Installation & Quick Start

### Installation

```bash
# Install the SDK
npm install @farert/sdk

# For Svelte projects
npm install @farert/sdk svelte

# For SvelteKit projects
npm install @farert/sdk @sveltejs/kit
```

### Quick Start - Vanilla JavaScript/TypeScript

```typescript
import { createFarertSDK } from '@farert/sdk';

// Create and initialize the SDK
const sdk = createFarertSDK();
await sdk.initialize();

// Calculate fare for Tokyo to Yokohama
const fareResult = await sdk.calculateFare({
  start: "東京",
  end: "横浜"
});

console.log(`Fare: ¥${fareResult.totalFare}`);
```

### Quick Start - Svelte

```typescript
// App.svelte
<script lang="ts">
  import { farertStore, isReady } from '@farert/sdk';
  import { onMount } from 'svelte';

  onMount(async () => {
    await farertStore.initialize();
  });

  let startStation = "東京";
  let endStation = "横浜";
  
  async function calculateFare() {
    if ($isReady) {
      const result = await farertStore.calculateFare({
        start: startStation,
        end: endStation
      });
      console.log(`Fare: ¥${result.totalFare}`);
    }
  }
</script>

{#if $isReady}
  <button on:click={calculateFare}>Calculate Fare</button>
{:else}
  <p>Loading...</p>
{/if}
```

### Quick Start - SvelteKit

```typescript
// src/routes/fare/+page.ts
import type { PageLoad } from './$types';
import { createFarertSDK } from '@farert/sdk';

export const load: PageLoad = async ({ params }) => {
  const sdk = createFarertSDK();
  await sdk.initialize();
  
  const popularStations = await sdk.getPopularStations();
  
  return {
    popularStations,
    sdk: sdk.getState() // Serializable state for hydration
  };
};
```

---

## Core SDK Interface

### FarertSDK Class

The main SDK class provides unified access to all functionality:

```typescript
import { FarertSDK, createFarertSDK } from '@farert/sdk';

// Create SDK with default configuration
const sdk = createFarertSDK();

// Create SDK with custom configuration
const sdk = createFarertSDK({
  caching: {
    enabled: true,
    stationCacheTTL: 3600000, // 1 hour
    fareCacheTTL: 300000      // 5 minutes
  },
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000
  }
});
```

### Core SDK Methods

#### Initialization

```typescript
interface FarertSDK {
  // Initialize the WebAssembly module and database
  initialize(): Promise<void>;
  
  // Check if SDK is ready for use
  isReady(): boolean;
  
  // Get SDK version and capabilities
  getVersion(): string;
  getCapabilities(): SDKCapabilities;
}
```

#### Station Operations

```typescript
interface FarertSDK {
  // Get station by ID
  getStationById(id: number): Promise<StationInfo>;
  
  // Get station by name (exact match)
  getStationByName(name: string): Promise<StationInfo>;
  
  // Search stations by partial name or kana
  searchStations(query: string, options?: SearchOptions): Promise<StationInfo[]>;
  
  // Get station with extended information
  getStationExtended(id: number): Promise<ExtendedStationInfo>;
}
```

#### Route and Fare Calculation

```typescript
interface FarertSDK {
  // Calculate fare for a simple route
  calculateFare(route: RouteInput): Promise<FareCalculationResult>;
  
  // Validate route before calculation
  validateRoute(route: RouteInput): RouteValidationResult;
  
  // Get alternative routes
  getAlternativeRoutes(start: string, end: string): Promise<RouteOption[]>;
}
```

### Configuration Options

```typescript
interface SDKConfig {
  // Caching configuration
  caching?: {
    enabled: boolean;
    stationCacheTTL: number;      // Station data cache (default: 1 hour)
    fareCacheTTL: number;         // Fare calculation cache (default: 5 minutes)
    searchCacheTTL: number;       // Search results cache (default: 15 minutes)
    maxCacheSize: number;         // Maximum cache size in MB (default: 50)
  };
  
  // Error handling configuration
  errorHandling?: {
    retryAttempts: number;        // Number of retry attempts (default: 3)
    retryDelay: number;           // Delay between retries in ms (default: 1000)
    enableCircuitBreaker: boolean; // Enable circuit breaker pattern
  };
  
  // Performance configuration
  performance?: {
    enablePreloading: boolean;    // Preload common station data
    enableWebWorker: boolean;     // Use Web Worker for calculations
    maxConcurrentRequests: number; // Limit concurrent requests
  };
}
```

---

## Svelte Integration

### Reactive Stores

The SDK provides reactive Svelte stores for seamless integration:

```typescript
import { 
  farertStore, 
  isReady, 
  isLoading, 
  hasError,
  createStationSearchStore,
  createRouteBuilderStore 
} from '@farert/sdk';
```

#### Main Farert Store

```typescript
// Reactive store for main SDK state
const farertStore: Readable<FarertStoreState>;

// Derived stores for common states
const isReady: Readable<boolean>;
const isLoading: Readable<boolean>;
const hasError: Readable<boolean>;
const currentError: Readable<Error | null>;
```

#### Station Search Store

```typescript
// Create a station search store with debouncing
const stationSearch = createStationSearchStore({
  debounceMs: 300,
  maxResults: 20
});

// Use in component
<script lang="ts">
  import { createStationSearchStore } from '@farert/sdk';
  
  const stationSearch = createStationSearchStore();
  
  function handleSearch(query: string) {
    stationSearch.search(query);
  }
</script>

{#each $stationSearch.results as station}
  <div class="station-item">
    {station.name} ({station.prefecture})
  </div>
{/each}
```

#### Route Builder Store

```typescript
// Create a route builder store with undo/redo support
const routeBuilder = createRouteBuilderStore({
  enableUndo: true,
  maxHistory: 50,
  validateOnChange: true
});

// Add stations to route
routeBuilder.addStation("東京");
routeBuilder.addStation("品川");
routeBuilder.addStation("横浜");

// Calculate fare for current route
const fareResult = await routeBuilder.calculateFare();
```

### Svelte Components

Pre-built Svelte components for common use cases:

#### StationSelector Component

```svelte
<!-- StationSelector.svelte -->
<script lang="ts">
  import { StationSelector } from '@farert/sdk/svelte';
  
  let selectedStation: StationInfo | null = null;
  
  function handleStationSelect(station: StationInfo) {
    selectedStation = station;
    console.log('Selected:', station.name);
  }
</script>

<StationSelector
  placeholder="Search stations..."
  maxResults={10}
  showPrefecture={true}
  showKana={true}
  on:select={handleStationSelect}
  class="my-station-selector"
/>
```

#### RouteBuilder Component

```svelte
<!-- RouteBuilder.svelte -->
<script lang="ts">
  import { RouteBuilder } from '@farert/sdk/svelte';
  
  let route: RouteSegment[] = [];
  
  function handleRouteChange(newRoute: RouteSegment[]) {
    route = newRoute;
  }
</script>

<RouteBuilder
  bind:route
  enableDragDrop={true}
  enableUndo={true}
  maxStations={10}
  on:change={handleRouteChange}
  class="route-builder"
/>
```

#### FareDisplay Component

```svelte
<!-- FareDisplay.svelte -->
<script lang="ts">
  import { FareDisplay } from '@farert/sdk/svelte';
  
  export let fareInfo: FareCalculationResult;
</script>

<FareDisplay
  {fareInfo}
  showBreakdown={true}
  showDiscounts={true}
  currency="JPY"
  locale="ja-JP"
  class="fare-display"
/>
```

### Store Configuration

```typescript
// Configure stores with custom options
import { createStoreCollection } from '@farert/sdk';

const stores = createStoreCollection({
  // Station search configuration
  stationSearch: {
    debounceMs: 300,
    maxResults: 20,
    enableHistory: true
  },
  
  // Route builder configuration
  routeBuilder: {
    enableUndo: true,
    maxHistory: 50,
    autoValidate: true,
    enableDragDrop: true
  },
  
  // Fare calculation configuration
  fareCalculation: {
    autoCalculate: true,
    enableCache: true,
    showProgress: true
  }
});
```

---

## SvelteKit SSR Integration

### Page Load Functions

```typescript
// src/routes/stations/[id]/+page.ts
import type { PageLoad } from './$types';
import { createFarertSDK } from '@farert/sdk';

export const load: PageLoad = async ({ params, fetch }) => {
  const sdk = createFarertSDK();
  await sdk.initialize();
  
  try {
    const station = await sdk.getStationById(parseInt(params.id));
    const nearbyStations = await sdk.getNearbyStations(station.id, 10);
    
    return {
      station,
      nearbyStations,
      seo: {
        title: `${station.name}駅の運賃情報`,
        description: `${station.name}駅（${station.prefecture}）からの運賃を計算`
      }
    };
  } catch (error) {
    throw error(404, 'Station not found');
  }
};
```

### Server-Side Route Calculation

```typescript
// src/routes/api/fare/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createFarertSDK } from '@farert/sdk';

export const GET: RequestHandler = async ({ url }) => {
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');
  
  if (!start || !end) {
    return json({ error: 'Missing start or end station' }, { status: 400 });
  }
  
  try {
    const sdk = createFarertSDK();
    await sdk.initialize();
    
    const result = await sdk.calculateFare({ start, end });
    
    return json({
      fare: result.totalFare,
      route: result.routeDescription,
      duration: result.estimatedDuration,
      alternatives: result.alternatives
    });
  } catch (error) {
    return json({ error: 'Calculation failed' }, { status: 500 });
  }
};
```

### Static Site Generation

```typescript
// src/routes/stations/[id]/+page.ts
export const prerender = true;

export async function entries() {
  const sdk = createFarertSDK();
  await sdk.initialize();
  
  // Pre-generate pages for major stations
  const majorStations = await sdk.getMajorStations();
  
  return majorStations.map(station => ({
    id: station.id.toString()
  }));
}
```

### SvelteKit Adapter Utilities

```typescript
import { SvelteKitAdapter } from '@farert/sdk/sveltekit';

// Create adapter for SvelteKit-specific features
const adapter = new SvelteKitAdapter({
  enableSSR: true,
  enableStaticGeneration: true,
  preloadStrategies: ['popular-routes', 'major-stations']
});

// Use in load functions
export const load = adapter.createPageLoad(async ({ params, sdk }) => {
  const station = await sdk.getStationById(params.id);
  return { station };
});
```

---

## Object Classes

The SDK provides enhanced object classes with fluent APIs and lifecycle management:

### Enhanced Route Classes

#### cRouteList - Base Route Container

```typescript
import { ObjectClassFactory } from '@farert/sdk';

const factory = new ObjectClassFactory();
const routeList = factory.createRouteList();

// Array-like operations
routeList.push(stationId);
routeList.pop();
routeList.clear();

// Enhanced methods
routeList.assign(otherRouteList);
routeList.toArray();
routeList.fromArray([1001, 1002, 1003]); // Station IDs
```

#### cRoute - Route Construction

```typescript
const route = factory.createRoute();

// String-based route setup
route.setupRoute("東京 東海道線 品川 東海道線 横浜");

// Manual route construction
route.addRouteBegin(1001); // Tokyo Station ID
route.addRoute(11001, 1002); // Tokaido Line, Shinagawa Station
route.addRoute(11001, 1003); // Tokaido Line, Yokohama Station

// Route information
const segmentCount = route.getRouteCount();
const description = route.routeScript();
```

#### cCalcRoute - Fare Calculation

```typescript
const calcRoute = factory.createCalcRoute();

// Setup route
calcRoute.setupRoute("東京 東海道線 新大阪 東海道新幹線 京都");

// Configure calculation options
calcRoute.setLongRoute(true); // Enable long-distance rules
calcRoute.setRouteFlag(routeFlag); // Apply specific routing flags

// Calculate fare
const fareInfo = calcRoute.calcFare();
console.log(`Total Fare: ¥${fareInfo.fare}`);

// Get detailed breakdown
const breakdown = fareInfo.getFareBreakdown();
const discounts = fareInfo.getAvailableDiscounts();
```

### Route Items and Flags

#### cRouteItem - Individual Route Segments

```typescript
const routeItem = factory.createRouteItem();

// Set segment properties
routeItem.stationId = 1001;
routeItem.lineId = 11001;
routeItem.flag = 0; // Standard routing

// Analysis methods
const isValid = routeItem.isValidSegment();
const connectionInfo = routeItem.getConnectionInfo();
```

#### cRouteFlag - Special Routing Rules

```typescript
const routeFlag = factory.createRouteFlag();

// Configure special rules
routeFlag.isTokutei = true;      // Special fare rule
routeFlag.isRule114Applied = true; // Rule 114 application
routeFlag.isJRDiscount = true;   // JR company discount
routeFlag.rule69Flag = false;    // Rule 69 application
routeFlag.rule70Flag = true;     // Rule 70 application

// Apply to calculation
calcRoute.setRouteFlag(routeFlag);
```

### FareInfo - Comprehensive Results

```typescript
interface FareInfo {
  // Basic fare information
  fare: number;                    // Total calculated fare
  basicFare: number;              // Base fare amount
  totalFare: number;              // Including all additions
  
  // Route details
  totalDistance: number;           // Total distance in km
  routeDescription: string;        // Human-readable route
  
  // Special rules and discounts
  isRule114Applied: boolean;       // Special rule application
  availCountForFareOfStockDiscount: number; // Available discounts
  
  // Advanced fare information
  getFareBreakdown(): FareBreakdownItem[];
  getAvailableDiscounts(): FareDiscount[];
  getRouteAnalysis(): RouteAnalysis;
  
  // Stock discount methods (from C++ implementation)
  fareForStockDiscount(index: number): number;
  fareForStockDiscountTitle(index: number): string;
}
```

### Object Lifecycle Management

```typescript
import { ObjectLifecycleManager } from '@farert/sdk';

// Create lifecycle manager
const lifecycle = new ObjectLifecycleManager();

// Create and track objects
const calcRoute = lifecycle.createCalcRoute();
const routeFlag = lifecycle.createRouteFlag();

// Automatic cleanup when done
lifecycle.cleanup(); // Cleans up all tracked objects
```

---

## Station & Route Operations

### Station Search and Information

#### Basic Station Operations

```typescript
// Get station by exact name
const tokyoStation = await sdk.getStationByName("東京");

// Get station by ID
const station = await sdk.getStationById(1001);

// Search stations with options
const searchResults = await sdk.searchStations("新宿", {
  maxResults: 10,
  includePrefecture: true,
  includeKana: true,
  sortBy: 'relevance'
});
```

#### Advanced Station Information

```typescript
// Get extended station information
const extendedInfo = await sdk.getStationExtended(1001);

console.log(`
  Station: ${extendedInfo.name}
  Kana: ${extendedInfo.kana}
  Prefecture: ${extendedInfo.prefecture}
  Lines: ${extendedInfo.lines.map(l => l.name).join(', ')}
  Is Junction: ${extendedInfo.isJunction}
  Coordinates: ${extendedInfo.coordinates?.latitude}, ${extendedInfo.coordinates?.longitude}
`);

// Get stations by prefecture
const tokyoStations = await sdk.getStationsByPrefecture("東京都");

// Get nearby stations
const nearbyStations = await sdk.getNearbyStations(1001, 5); // Within 5km
```

#### Station Utilities

```typescript
import { formatStationName, isJunctionStation } from '@farert/sdk';

// Format station name for display
const displayName = formatStationName(station, {
  includePrefecture: true,
  includeKana: false,
  preferExtended: true
});

// Check if station is a major junction
const isJunction = isJunctionStation(station.id);
```

### Route Operations

#### Route Validation

```typescript
// Validate route before calculation
const validation = sdk.validateRoute({
  start: "東京",
  end: "横浜",
  via: ["品川"]
});

if (validation.isValid) {
  console.log("Route is valid");
} else {
  console.log("Validation errors:", validation.errors);
  console.log("Suggestions:", validation.suggestions);
}
```

#### Route Building

```typescript
import { createRouteBuilder } from '@farert/sdk';

// Create route builder with fluent API
const builder = createRouteBuilder();

const route = builder
  .from("東京")
  .via("品川", "東海道線")
  .to("横浜")
  .withOptions({
    preferFastRoute: true,
    maxTransfers: 2
  })
  .build();

// Calculate fare for built route
const fareResult = await sdk.calculateFare(route);
```

#### Alternative Routes

```typescript
// Get alternative routes between stations
const alternatives = await sdk.getAlternativeRoutes("東京", "大阪");

alternatives.forEach((route, index) => {
  console.log(`Route ${index + 1}:`);
  console.log(`  Path: ${route.description}`);
  console.log(`  Fare: ¥${route.estimatedFare}`);
  console.log(`  Duration: ${route.estimatedDuration} minutes`);
  console.log(`  Transfers: ${route.transferCount}`);
});
```

### Complex Multi-Segment Routes

```typescript
// Build complex route with multiple segments
const complexRoute = {
  segments: [
    { station: "東京", line: "東海道線" },
    { station: "品川", line: "東海道線" },
    { station: "横浜", line: "根岸線" },
    { station: "大船", line: "東海道線" },
    { station: "小田原" }
  ],
  options: {
    preferCheapRoute: true,
    avoidLines: [12001], // Avoid specific line
    allowSpecialRules: true
  }
};

const result = await sdk.calculateFare(complexRoute);
```

---

## Caching & Performance

### Cache Configuration

```typescript
import { createCacheManager, CacheCategory } from '@farert/sdk';

// Create cache manager with custom configuration
const cacheManager = createCacheManager({
  // Station information cache (long-term)
  [CacheCategory.STATION_INFO]: {
    ttl: 3600000,    // 1 hour
    maxSize: 1000    // Maximum 1000 entries
  },
  
  // Search results cache (medium-term)
  [CacheCategory.SEARCH_RESULTS]: {
    ttl: 900000,     // 15 minutes
    maxSize: 500
  },
  
  // Fare calculations cache (short-term)
  [CacheCategory.FARE_CALCULATION]: {
    ttl: 300000,     // 5 minutes
    maxSize: 200
  },
  
  // Reference data cache (session-long)
  [CacheCategory.REFERENCE_DATA]: {
    ttl: 0,          // No expiration
    maxSize: 100
  }
});
```

### Cache Management

```typescript
// Manual cache operations
cacheManager.set('station:1001', stationData, CacheCategory.STATION_INFO);
const cachedStation = cacheManager.get('station:1001', CacheCategory.STATION_INFO);

// Cache statistics
const stats = cacheManager.getStats();
console.log(`
  Total Size: ${stats.totalSize} KB
  Hit Rate: ${stats.hitRate}%
  Memory Usage: ${stats.memoryUsage} MB
`);

// Cache maintenance
cacheManager.cleanup(); // Remove expired entries
cacheManager.clear(CacheCategory.FARE_CALCULATION); // Clear specific category
cacheManager.clearAll(); // Clear all caches
```

### Performance Optimization

```typescript
// Enable preloading for common data
const sdk = createFarertSDK({
  performance: {
    enablePreloading: true,
    preloadStrategies: [
      'major-stations',    // Preload Tokyo, Osaka, etc.
      'popular-routes',    // Preload common routes
      'reference-data'     // Preload companies, prefectures
    ]
  }
});

// Monitor performance
const performanceMonitor = sdk.getPerformanceMonitor();

performanceMonitor.on('slowQuery', (event) => {
  console.warn(`Slow query detected: ${event.operation} took ${event.duration}ms`);
});

performanceMonitor.on('cacheHit', (event) => {
  console.log(`Cache hit: ${event.key} in ${event.category}`);
});
```

### Memory Management

```typescript
// Monitor memory usage
const memoryStats = sdk.getMemoryStats();
console.log(`
  WebAssembly Memory: ${memoryStats.wasmMemory} MB
  Cache Memory: ${memoryStats.cacheMemory} MB
  Total Memory: ${memoryStats.totalMemory} MB
`);

// Configure memory limits
const sdk = createFarertSDK({
  memory: {
    maxCacheMemory: 50,     // 50 MB cache limit
    maxWasmMemory: 100,     // 100 MB WebAssembly limit
    enableGC: true,         // Enable garbage collection
    gcThreshold: 80         // GC when 80% memory used
  }
});
```

---

## Framework-Agnostic Utilities

### Fare Formatting

```typescript
import { formatFare, formatFareBreakdown } from '@farert/sdk';

// Basic fare formatting
const formatted = formatFare(320, {
  locale: 'ja-JP',
  currency: 'JPY',
  showSymbol: true
});
// Result: "¥320"

// Advanced formatting with breakdown
const breakdown = formatFareBreakdown(fareInfo, {
  showBaseFare: true,
  showDiscounts: true,
  showTaxes: true,
  locale: 'ja-JP'
});
```

### Route Utilities

```typescript
import { 
  validateRoute, 
  formatRouteDescription,
  calculateRouteDistance 
} from '@farert/sdk';

// Route validation
const validation = validateRoute("東京 東海道線 横浜");
if (validation.isValid) {
  console.log("Route is valid");
} else {
  console.log("Errors:", validation.errors);
}

// Route description formatting
const description = formatRouteDescription(route, {
  includeLines: true,
  includeDistance: true,
  includeTime: true,
  locale: 'ja'
});

// Distance calculation
const distance = calculateRouteDistance(route);
console.log(`Total distance: ${distance} km`);
```

### Station Utilities

```typescript
import { 
  formatStationName,
  searchStationsByKana,
  getStationsByPrefecture 
} from '@farert/sdk';

// Station name formatting
const displayName = formatStationName(station, {
  style: 'full',        // 'short' | 'full' | 'extended'
  includePrefecture: true,
  includeKana: false
});

// Search by reading (kana)
const stations = await searchStationsByKana("しんじゅく");

// Get stations by prefecture
const osakaStations = await getStationsByPrefecture("大阪府");
```

### Framework Detection

```typescript
import { detectFramework, getOptimizedSDKLoader } from '@farert/sdk';

// Detect current framework environment
const framework = detectFramework();
console.log(`Running in: ${framework.type} ${framework.version}`);

// Get optimized loader for detected framework
const loader = getOptimizedSDKLoader(framework);
const sdk = await loader.createSDK();
```

### React Integration (Secondary Support)

```typescript
import { FarertSDKProvider, useFarertSDK } from '@farert/sdk/react';

// Provider setup
function App() {
  return (
    <FarertSDKProvider config={{ caching: { enabled: true } }}>
      <FareCalculator />
    </FarertSDKProvider>
  );
}

// Hook usage
function FareCalculator() {
  const { sdk, isReady, error } = useFarertSDK();
  const [fare, setFare] = useState<number | null>(null);
  
  const calculateFare = async () => {
    if (isReady) {
      const result = await sdk.calculateFare({ start: "東京", end: "横浜" });
      setFare(result.totalFare);
    }
  };
  
  return (
    <div>
      {isReady ? (
        <button onClick={calculateFare}>Calculate</button>
      ) : (
        <div>Loading...</div>
      )}
      {fare && <div>Fare: ¥{fare}</div>}
    </div>
  );
}
```

### Vue 3 Integration (Secondary Support)

```typescript
import { createApp } from 'vue';
import { FarertSDKPlugin } from '@farert/sdk/vue';

// Plugin setup
const app = createApp(App);
app.use(FarertSDKPlugin, {
  caching: { enabled: true }
});

// Composable usage
import { useFarertSDK } from '@farert/sdk/vue';

export default {
  setup() {
    const { sdk, isReady, error } = useFarertSDK();
    const fare = ref<number | null>(null);
    
    const calculateFare = async () => {
      if (isReady.value) {
        const result = await sdk.value.calculateFare({ 
          start: "東京", 
          end: "横浜" 
        });
        fare.value = result.totalFare;
      }
    };
    
    return { isReady, fare, calculateFare };
  }
};
```

---

## Error Handling

### Error Types and Management

```typescript
import { 
  ErrorManager, 
  CLIError, 
  WebAssemblyLoadError,
  isManagedError 
} from '@farert/sdk';

// Create error manager with retry logic
const errorManager = new ErrorManager({
  retryAttempts: 3,
  retryDelay: 1000,
  enableCircuitBreaker: true,
  userFriendlyMessages: true
});

// Handle specific error types
try {
  const result = await sdk.calculateFare(route);
} catch (error) {
  if (error instanceof CLIError) {
    console.error(`SDK Error: ${error.message} (Code: ${error.code})`);
  } else if (error instanceof WebAssemblyLoadError) {
    console.error('WebAssembly module failed to load:', error.message);
  } else if (isManagedError(error)) {
    console.error('Managed error:', error.userMessage);
    // Show retry options
    if (error.canRetry) {
      await error.retry();
    }
  }
}
```

### Error Recovery Strategies

```typescript
// Configure error recovery
const sdk = createFarertSDK({
  errorHandling: {
    retryAttempts: 3,
    retryStrategies: {
      'NetworkError': 'exponential-backoff',
      'TimeoutError': 'linear-backoff',
      'ValidationError': 'no-retry'
    },
    fallbackStrategies: {
      'station-search': 'use-cache',
      'fare-calculation': 'approximate'
    }
  }
});
```

### Svelte Error Handling

```svelte
<script lang="ts">
  import { farertStore, hasError, currentError, canRetry } from '@farert/sdk';
  
  async function retryOperation() {
    if ($canRetry) {
      await farertStore.retry();
    }
  }
</script>

{#if $hasError}
  <div class="error-container">
    <p>Error: {$currentError?.message}</p>
    {#if $canRetry}
      <button on:click={retryOperation}>Retry</button>
    {/if}
  </div>
{/if}
```

---

## Real-World Examples

### Commuter Route Calculator

```typescript
// Daily commute optimization
import { createFarertSDK, formatFare } from '@farert/sdk';

async function createCommuterCalculator() {
  const sdk = createFarertSDK({
    caching: { enabled: true },
    performance: { enablePreloading: true }
  });
  
  await sdk.initialize();
  
  return {
    // Calculate monthly commute cost
    async calculateMonthlyCost(home: string, office: string, workingDays = 20) {
      const dailyFare = await sdk.calculateFare({ start: home, end: office });
      const monthlyTotal = dailyFare.totalFare * 2 * workingDays; // Round trip
      
      return {
        dailyFare: dailyFare.totalFare,
        monthlyTotal,
        formatted: formatFare(monthlyTotal, { locale: 'ja-JP' }),
        route: dailyFare.routeDescription
      };
    },
    
    // Find cheapest route with time constraints
    async findOptimalRoute(home: string, office: string, maxTime: number) {
      const alternatives = await sdk.getAlternativeRoutes(home, office);
      
      return alternatives
        .filter(route => route.estimatedDuration <= maxTime)
        .sort((a, b) => a.estimatedFare - b.estimatedFare)[0];
    }
  };
}

// Usage
const calculator = await createCommuterCalculator();
const monthlyCost = await calculator.calculateMonthlyCost("新宿", "東京");
console.log(`Monthly commute cost: ${monthlyCost.formatted}`);
```

### Tourism Route Planner

```typescript
// Multi-destination tourism route planning
async function createTourismPlanner() {
  const sdk = createFarertSDK();
  await sdk.initialize();
  
  return {
    // Plan multi-city tour with JR Pass analysis
    async planTour(destinations: string[], startCity: string) {
      const routes = [];
      let totalFare = 0;
      
      for (let i = 0; i < destinations.length; i++) {
        const from = i === 0 ? startCity : destinations[i - 1];
        const to = destinations[i];
        
        const route = await sdk.calculateFare({ start: from, end: to });
        routes.push({
          from,
          to,
          fare: route.totalFare,
          duration: route.estimatedDuration,
          description: route.routeDescription
        });
        
        totalFare += route.totalFare;
      }
      
      // JR Pass analysis
      const jrPassPrice = 29650; // 7-day JR Pass price
      const jrPassSavings = totalFare - jrPassPrice;
      
      return {
        routes,
        totalFare,
        jrPassPrice,
        savings: jrPassSavings,
        recommendJRPass: jrPassSavings > 0,
        formatted: formatFare(totalFare, { locale: 'ja-JP' })
      };
    }
  };
}

// Usage - Classic Golden Route
const planner = await createTourismPlanner();
const tour = await planner.planTour(
  ["京都", "大阪", "奈良", "神戸", "姫路"], 
  "東京"
);

if (tour.recommendJRPass) {
  console.log(`JR Pass recommended! Save ¥${tour.savings}`);
}
```

### Business Travel Optimizer

```typescript
// Business travel cost and time optimization
async function createBusinessTravelOptimizer() {
  const sdk = createFarertSDK();
  await sdk.initialize();
  
  return {
    // Compare time vs cost for business travel
    async optimizeBusinessTrip(from: string, to: string, priority: 'time' | 'cost') {
      const alternatives = await sdk.getAlternativeRoutes(from, to);
      
      if (priority === 'time') {
        // Prioritize fastest route
        return alternatives.sort((a, b) => a.estimatedDuration - b.estimatedDuration);
      } else {
        // Prioritize cheapest route
        return alternatives.sort((a, b) => a.estimatedFare - b.estimatedFare);
      }
    },
    
    // Calculate expense report data
    async generateExpenseReport(trips: Array<{from: string; to: string; date: string}>) {
      const expenses = [];
      let totalCost = 0;
      
      for (const trip of trips) {
        const fare = await sdk.calculateFare({ start: trip.from, end: trip.to });
        const expense = {
          date: trip.date,
          route: `${trip.from} → ${trip.to}`,
          fare: fare.totalFare,
          description: fare.routeDescription
        };
        
        expenses.push(expense);
        totalCost += fare.totalFare;
      }
      
      return {
        expenses,
        totalCost,
        formatted: formatFare(totalCost, { locale: 'ja-JP' })
      };
    }
  };
}
```

### Real-Time Fare Comparison Service

```typescript
// Create a real-time fare comparison API
async function createFareComparisonAPI() {
  const sdk = createFarertSDK({
    caching: { enabled: true, fareCacheTTL: 300000 }, // 5-minute cache
    performance: { maxConcurrentRequests: 10 }
  });
  
  await sdk.initialize();
  
  return {
    // Compare multiple route options
    async compareRoutes(from: string, to: string) {
      const [directRoute, alternatives] = await Promise.all([
        sdk.calculateFare({ start: from, end: to }),
        sdk.getAlternativeRoutes(from, to)
      ]);
      
      const allRoutes = [directRoute, ...alternatives];
      
      return {
        fastest: allRoutes.sort((a, b) => a.estimatedDuration - b.estimatedDuration)[0],
        cheapest: allRoutes.sort((a, b) => a.estimatedFare - b.estimatedFare)[0],
        recommended: allRoutes.sort((a, b) => {
          // Score based on time + cost ratio
          const scoreA = a.estimatedDuration / 60 + a.estimatedFare / 100;
          const scoreB = b.estimatedDuration / 60 + b.estimatedFare / 100;
          return scoreA - scoreB;
        })[0],
        all: allRoutes
      };
    }
  };
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### WebAssembly Module Loading Issues

```typescript
// Issue: WebAssembly module fails to load
// Solution: Check module path and implement fallback

import { createFarertSDK, WebAssemblyLoadError } from '@farert/sdk';

try {
  const sdk = createFarertSDK({
    wasmPath: './custom/path/farert.wasm', // Custom path
    fallbackEnabled: true // Enable fallback loading
  });
  
  await sdk.initialize();
} catch (error) {
  if (error instanceof WebAssemblyLoadError) {
    console.error('WebAssembly loading failed:', error.message);
    
    // Try alternative loading method
    const sdk = createFarertSDK({
      loadingStrategy: 'streaming' // or 'fetch'
    });
    
    await sdk.initialize();
  }
}
```

#### Memory and Performance Issues

```typescript
// Issue: Memory leaks in long-running applications
// Solution: Implement proper cleanup and monitoring

const sdk = createFarertSDK({
  memory: {
    enableGC: true,
    gcInterval: 60000, // Run GC every minute
    maxMemoryUsage: 100 // 100MB limit
  }
});

// Monitor memory usage
const monitor = sdk.getMemoryMonitor();
monitor.on('memoryWarning', (usage) => {
  console.warn(`High memory usage: ${usage.percent}%`);
  sdk.performCleanup(); // Manual cleanup
});

// Cleanup when done
process.on('exit', () => {
  sdk.cleanup();
});
```

#### Database Connection Issues

```typescript
// Issue: Database initialization fails
// Solution: Verify database file and implement retry logic

const sdk = createFarertSDK({
  database: {
    path: './data/jrdbnewest.db',
    retryAttempts: 3,
    retryDelay: 1000,
    validateOnLoad: true
  }
});

try {
  await sdk.initialize();
} catch (error) {
  console.error('Database initialization failed:', error);
  
  // Check if database file exists
  const fs = await import('fs');
  if (!fs.existsSync('./data/jrdbnewest.db')) {
    console.error('Database file not found. Please run build process.');
  }
}
```

#### Japanese Text Encoding Issues

```typescript
// Issue: Japanese characters not displaying correctly
// Solution: Ensure proper UTF-8 encoding

const sdk = createFarertSDK({
  encoding: {
    input: 'utf-8',
    output: 'utf-8',
    fallback: 'ascii' // Fallback for unsupported characters
  }
});

// Validate Japanese text input
function validateJapaneseInput(text: string): boolean {
  // Check for valid Japanese characters
  const japaneseRegex = /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF]+$/;
  return japaneseRegex.test(text);
}

// Sanitize input
function sanitizeStationName(name: string): string {
  return name.trim().normalize('NFC'); // Unicode normalization
}
```

### Performance Debugging

```typescript
// Enable performance debugging
const sdk = createFarertSDK({
  debug: {
    enabled: true,
    logLevel: 'info',
    performanceMonitoring: true
  }
});

// Use debug tools
import { createDevelopmentDebugTools } from '@farert/sdk/debug';

const debugTools = createDevelopmentDebugTools(sdk);

// Performance analysis
const analysis = await debugTools.analyzePerformance({
  testCases: [
    { start: "東京", end: "横浜" },
    { start: "大阪", end: "京都" },
    { start: "名古屋", end: "静岡" }
  ],
  iterations: 100
});

console.log(`Average calculation time: ${analysis.averageTime}ms`);
console.log(`Cache hit rate: ${analysis.cacheHitRate}%`);
```

### Error Diagnostics

```typescript
// Comprehensive error diagnostics
import { DebugTools } from '@farert/sdk/debug';

const debugTools = new DebugTools(sdk);

// Generate diagnostic report
const report = await debugTools.generateDiagnosticReport();

console.log(`
  SDK Version: ${report.sdkVersion}
  WebAssembly Status: ${report.wasmStatus}
  Database Status: ${report.databaseStatus}
  Memory Usage: ${report.memoryUsage}MB
  Cache Status: ${report.cacheStatus}
  Recent Errors: ${report.recentErrors.length}
`);

// Export diagnostic data
const diagnosticData = debugTools.exportDiagnosticData();
// Send to support or log for analysis
```

---

## Best Practices

### Performance Optimization

#### Efficient SDK Usage

```typescript
// ✅ Good: Reuse SDK instance
const sdk = createFarertSDK();
await sdk.initialize();

// Use the same instance for multiple operations
const fare1 = await sdk.calculateFare({ start: "東京", end: "横浜" });
const fare2 = await sdk.calculateFare({ start: "大阪", end: "京都" });

// ❌ Bad: Create new instance for each operation
const sdk1 = createFarertSDK();
await sdk1.initialize();
const fare1 = await sdk1.calculateFare({ start: "東京", end: "横浜" });

const sdk2 = createFarertSDK(); // Unnecessary initialization
await sdk2.initialize();
const fare2 = await sdk2.calculateFare({ start: "大阪", end: "京都" });
```

#### Optimal Caching Strategy

```typescript
// ✅ Good: Configure appropriate cache TTLs
const sdk = createFarertSDK({
  caching: {
    enabled: true,
    stationCacheTTL: 3600000,    // 1 hour - station data changes rarely
    fareCacheTTL: 300000,        // 5 minutes - fare rules may change
    searchCacheTTL: 900000,      // 15 minutes - search results
    referenceCacheTTL: 0         // No expiration - companies/prefectures
  }
});

// ✅ Good: Preload common data
await sdk.preloadCommonStations(['東京', '大阪', '名古屋', '福岡']);
await sdk.preloadReferenceData();
```

#### Memory Management

```typescript
// ✅ Good: Monitor and cleanup
const sdk = createFarertSDK({
  memory: {
    enableGC: true,
    maxMemoryUsage: 100, // 100MB limit
    cleanupInterval: 300000 // Cleanup every 5 minutes
  }
});

// ✅ Good: Cleanup when done
process.on('beforeExit', () => {
  sdk.cleanup();
});

// ✅ Good: Use object pooling for frequent operations
const routePool = sdk.createObjectPool('CalcRoute', { maxSize: 10 });
const calcRoute = routePool.acquire();
// Use calcRoute...
routePool.release(calcRoute);
```

### Error Handling Best Practices

```typescript
// ✅ Good: Comprehensive error handling
async function calculateFareWithRetry(route: RouteInput, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sdk.calculateFare(route);
    } catch (error) {
      if (error instanceof ValidationError) {
        // Don't retry validation errors
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

// ✅ Good: User-friendly error messages
function handleError(error: unknown): string {
  if (error instanceof CLIError) {
    switch (error.code) {
      case CLIErrorCode.STATION_NOT_FOUND:
        return "指定された駅が見つかりませんでした。駅名を確認してください。";
      case CLIErrorCode.INVALID_ROUTE:
        return "無効なルートです。経路を確認してください。";
      default:
        return "システムエラーが発生しました。しばらく待ってから再試行してください。";
    }
  }
  return "予期しないエラーが発生しました。";
}
```

### Svelte/SvelteKit Best Practices

#### Svelte Store Usage

```svelte
<!-- ✅ Good: Reactive store usage -->
<script lang="ts">
  import { farertStore, isReady } from '@farert/sdk';
  import { onMount } from 'svelte';
  
  let startStation = '';
  let endStation = '';
  
  // Reactive statement for automatic calculation
  $: if ($isReady && startStation && endStation) {
    calculateFare();
  }
  
  async function calculateFare() {
    try {
      const result = await farertStore.calculateFare({
        start: startStation,
        end: endStation
      });
      // Handle result...
    } catch (error) {
      console.error('Calculation failed:', error);
    }
  }
</script>

{#if $isReady}
  <input bind:value={startStation} placeholder="出発駅" />
  <input bind:value={endStation} placeholder="到着駅" />
{:else}
  <div>読み込み中...</div>
{/if}
```

#### SvelteKit SSR Optimization

```typescript
// ✅ Good: Efficient SSR data loading
export const load: PageLoad = async ({ params, fetch }) => {
  const sdk = createFarertSDK();
  await sdk.initialize();
  
  // Parallel data loading
  const [station, nearbyStations, popularRoutes] = await Promise.all([
    sdk.getStationById(params.id),
    sdk.getNearbyStations(params.id, 5),
    sdk.getPopularRoutesFrom(params.id)
  ]);
  
  return {
    station,
    nearbyStations,
    popularRoutes,
    // Include only serializable data
    seo: {
      title: `${station.name}駅 - 運賃計算`,
      description: `${station.name}駅からの運賃を計算`
    }
  };
};
```

### TypeScript Best Practices

```typescript
// ✅ Good: Use strict types
interface RouteRequest {
  start: string;
  end: string;
  via?: string[];
  options?: RouteOptions;
}

interface RouteOptions {
  preferFastRoute?: boolean;
  preferCheapRoute?: boolean;
  maxTransfers?: number;
  avoidLines?: number[];
}

// ✅ Good: Type guards for runtime safety
function isValidStationName(name: unknown): name is string {
  return typeof name === 'string' && 
         name.length > 0 && 
         name.length <= 20;
}

// ✅ Good: Proper error typing
async function calculateFareTyped(
  route: RouteRequest
): Promise<FareCalculationResult> {
  if (!isValidStationName(route.start)) {
    throw new ValidationError('Invalid start station name');
  }
  
  if (!isValidStationName(route.end)) {
    throw new ValidationError('Invalid end station name');
  }
  
  return await sdk.calculateFare(route);
}
```

### Production Deployment

```typescript
// ✅ Good: Production configuration
const sdk = createFarertSDK({
  // Optimize for production
  caching: {
    enabled: true,
    maxCacheSize: 100, // 100MB for production
    enablePersistence: true // Persist cache across sessions
  },
  
  // Error handling for production
  errorHandling: {
    retryAttempts: 3,
    enableCircuitBreaker: true,
    reportErrors: true // Enable error reporting
  },
  
  // Performance optimization
  performance: {
    enablePreloading: true,
    enableWebWorker: false, // Disable in Node.js environments
    maxConcurrentRequests: 5
  },
  
  // Security
  security: {
    validateInputs: true,
    sanitizeOutputs: true,
    enableCSP: true // Content Security Policy
  }
});

// ✅ Good: Environment-specific initialization
const isProduction = process.env.NODE_ENV === 'production';
const config = isProduction ? productionConfig : developmentConfig;
const sdk = createFarertSDK(config);
```

### Bundle Optimization

```typescript
// ✅ Good: Tree-shaking friendly imports
import { createFarertSDK } from '@farert/sdk';
import { formatFare } from '@farert/sdk/utils';
import { StationSelector } from '@farert/sdk/svelte/components';

// ❌ Bad: Full SDK import
import * as FarertSDK from '@farert/sdk';

// ✅ Good: Dynamic imports for code splitting
async function loadAdvancedFeatures() {
  const { AdvancedRouteBuilder } = await import('@farert/sdk/advanced');
  return new AdvancedRouteBuilder();
}

// ✅ Good: Conditional loading
if (typeof window !== 'undefined') {
  // Browser-only features
  const { BrowserOptimizations } = await import('@farert/sdk/browser');
}
```

---

## API Reference Summary

### Core Classes and Interfaces

| Class/Interface | Purpose | Key Methods |
|----------------|---------|-------------|
| `FarertSDK` | Main SDK class | `initialize()`, `calculateFare()`, `getStationById()` |
| `WasmWrapper` | WebAssembly interface | `loadModule()`, `callAPI()`, `cleanup()` |
| `CacheManager` | Intelligent caching | `get()`, `set()`, `clear()`, `getStats()` |
| `ErrorManager` | Error handling | `handleError()`, `retry()`, `getRecoveryOptions()` |

### Object Classes (Enhanced)

| Class | Extends | Purpose | Key Features |
|-------|---------|---------|-------------|
| `cRouteList` | - | Route container | Array operations, serialization |
| `cRoute` | `cRouteList` | Route building | String parsing, manual construction |
| `cCalcRoute` | `cRoute` | Fare calculation | Special rules, long routes |
| `cRouteItem` | - | Route segment | Station/line data, flags |
| `cRouteFlag` | - | Special rules | Boolean flags, rule configuration |
| `FareInfo` | - | Calculation results | Fare breakdown, discounts |

### Framework Integrations

| Framework | Package | Key Exports |
|-----------|---------|-------------|
| Svelte | `@farert/sdk/svelte` | Stores, components, context |
| SvelteKit | `@farert/sdk/sveltekit` | Load helpers, SSR adapters |
| React | `@farert/sdk/react` | Hooks, provider, error boundary |
| Vue | `@farert/sdk/vue` | Composables, plugin, reactive |

### Utility Functions

| Category | Functions | Purpose |
|----------|-----------|---------|
| Fare Formatting | `formatFare()`, `formatFareBreakdown()` | Display formatting |
| Station Utils | `formatStationName()`, `searchStationsByKana()` | Station operations |
| Route Utils | `validateRoute()`, `formatRouteDescription()` | Route validation |
| Framework Detection | `detectFramework()`, `getOptimizedSDKLoader()` | Environment detection |

---

This comprehensive API reference provides everything needed to effectively use the Farert WebAssembly SDK in your applications. For additional examples and advanced usage patterns, refer to the [examples directory](../src/cli/examples/) and the [troubleshooting guide](#troubleshooting).

For the latest updates and community support, visit our [GitHub repository](https://github.com/farert/farert-wasm) or check the [project documentation](https://farert.github.io/farert-wasm).