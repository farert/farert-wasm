# React Compatibility Layer

React hooks and components for the Farert Frontend API Layer SDK. This compatibility layer provides React-native patterns and developer experience while leveraging the existing Svelte-first SDK architecture.

## Features

- **React Context System**: Share SDK instance across component tree
- **Comprehensive Hooks**: Station search, fare calculation, route building, reference data
- **Error Boundary Integration**: Graceful handling of WebAssembly failures
- **Performance Optimizations**: Debouncing, caching, automatic cleanup
- **TypeScript-First**: Complete type safety with excellent IntelliSense
- **React 16.8+ Support**: Works with modern React versions including React 18+

## Quick Start

### 1. Setup Provider

```tsx
import React from 'react';
import { FarertSDKProvider, FarertErrorBoundary } from '@farert/sdk/react';

function App() {
  return (
    <FarertErrorBoundary>
      <FarertSDKProvider autoInitialize>
        <MyRailwayApp />
      </FarertSDKProvider>
    </FarertErrorBoundary>
  );
}
```

### 2. Use Hooks in Components

```tsx
import { 
  useFarertSDK, 
  useStationSearch, 
  useFareCalculation 
} from '@farert/sdk/react';

function StationSelector() {
  const { isReady } = useFarertSDK();
  const { 
    query, 
    setQuery, 
    results, 
    isLoading 
  } = useStationSearch('', { limit: 10 });

  if (!isReady) {
    return <div>SDK initializing...</div>;
  }

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="駅名を入力..."
      />
      
      {isLoading && <div>検索中...</div>}
      
      <ul>
        {results.map(result => (
          <li key={result.station.id}>
            {result.station.name} ({result.station.prefecture})
          </li>
        ))}
      </ul>
    </div>
  );
}

function FareCalculator() {
  const { calculateFare, result, isCalculating, error } = useFareCalculation();

  const handleCalculate = async () => {
    await calculateFare("東京 東海道線 横浜");
  };

  return (
    <div>
      <button onClick={handleCalculate} disabled={isCalculating}>
        運賃計算
      </button>
      
      {isCalculating && <div>計算中...</div>}
      {error && <div>エラー: {error.message}</div>}
      {result && (
        <div>運賃: {result.totalFare}円</div>
      )}
    </div>
  );
}
```

## API Reference

### Context and Provider

#### `FarertSDKProvider`

Main provider component that manages SDK lifecycle and shares instance across components.

**Props:**
- `children`: ReactNode - Child components
- `config?`: Partial<SDKConfig> - SDK configuration
- `development?`: boolean - Use development SDK
- `production?`: boolean - Use production SDK
- `autoInitialize?`: boolean - Auto-initialize on mount (default: true)
- `onInitialized?`: (sdk: FarertSDK) => void - Initialization callback
- `onError?`: (error: FarertSDKError) => void - Error callback

**Example:**
```tsx
<FarertSDKProvider 
  development
  config={{
    caching: { ttl: 60000 },
    performance: { trackingLevel: 'detailed' }
  }}
  onInitialized={(sdk) => console.log('Ready!')}
>
  <App />
</FarertSDKProvider>
```

### Core Hooks

#### `useFarertSDK()`

Access the SDK instance and its state.

**Returns:**
```typescript
{
  sdk: FarertSDK | null;
  state: SDKState;
  error: FarertSDKError | null;
  isReady: boolean;
  isLoading: boolean;
  reinitialize: () => Promise<void>;
  config: SDKConfig | null;
}
```

#### `useStationSearch(initialQuery?, options?)`

Station search with debouncing and caching.

**Parameters:**
- `initialQuery`: string - Initial search query
- `options`: UseStationSearchOptions - Search configuration

**Options:**
```typescript
{
  debounceMs?: number;          // Debounce delay (default: 300ms)
  autoSearch?: boolean;         // Auto-search on query change (default: true)
  minQueryLength?: number;      // Minimum query length (default: 1)
  limit?: number;               // Results limit (default: 20)
  prefecture?: string | number; // Filter by prefecture
  fuzzyThreshold?: number;      // Fuzzy matching threshold
  sortByPopularity?: boolean;   // Sort by station popularity
}
```

**Returns:**
```typescript
{
  query: string;
  setQuery: (query: string) => void;
  results: StationSearchResult[];
  isLoading: boolean;
  error: FarertSDKError | null;
  hasMore: boolean;
  totalCount: number;
  loadMore: () => Promise<void>;
  clearResults: () => void;
  search: (newQuery?: string) => Promise<void>;
}
```

#### `useFareCalculation()`

Fare calculation with validation and caching.

**Returns:**
```typescript
{
  calculateFare: (route: RouteSpec) => Promise<FareCalculationResult | null>;
  result: FareCalculationResult | null;
  isCalculating: boolean;
  error: FarertSDKError | null;
  validate: (route: RouteSpec) => Promise<RouteValidationResult>;
  clearResult: () => void;
  history: FareCalculationResult[];
  clearHistory: () => void;
}
```

#### `useRouteBuilder()`

Interactive route building with validation.

**Returns:**
```typescript
{
  segments: RouteSegment[];
  addStation: (stationId: number, lineId?: number) => Promise<void>;
  removeStation: (index: number) => void;
  insertStation: (index: number, stationId: number, lineId?: number) => Promise<void>;
  clearRoute: () => void;
  validate: () => Promise<RouteValidationResult>;
  getOptimizationSuggestions: () => Promise<string[]>;
  isValidating: boolean;
  validation: RouteValidationResult | null;
  toRouteSpec: () => RouteSpec;
  fromRouteSpec: (route: RouteSpec) => Promise<void>;
}
```

#### `useReferenceData()`

Access railway reference data (companies, prefectures, lines).

**Returns:**
```typescript
{
  companies: CompanyInfo[];
  prefectures: PrefectureInfo[];
  lines: LineInfo[];
  isLoading: boolean;
  error: FarertSDKError | null;
  refresh: () => Promise<void>;
  getCompany: (companyId: number) => CompanyInfo | null;
  getPrefecture: (prefectureId: number) => PrefectureInfo | null;
  getLine: (lineId: number) => LineInfo | null;
}
```

### Error Boundary

#### `FarertErrorBoundary`

Error boundary for WebAssembly failures with recovery mechanisms.

**Props:**
- `children`: ReactNode - Child components
- `fallback?`: ComponentType<{error: Error, resetError: () => void}> - Custom error component
- `onError?`: (error: Error, errorInfo: ErrorInfo) => void - Error callback
- `enableAutoRecovery?`: boolean - Enable automatic recovery
- `recoveryDelay?`: number - Recovery delay in ms (default: 3000)
- `maxRecoveryAttempts?`: number - Max recovery attempts (default: 3)

**Example:**
```tsx
const CustomErrorFallback = ({ error, resetError }) => (
  <div className="error-container">
    <h2>Railway System Error</h2>
    <p>{error.message}</p>
    <button onClick={resetError}>Try Again</button>
  </div>
);

<FarertErrorBoundary
  fallback={CustomErrorFallback}
  onError={(error, errorInfo) => {
    console.error('Farert error:', error);
    // Send to error reporting service
  }}
  enableAutoRecovery={true}
>
  <App />
</FarertErrorBoundary>
```

## Advanced Usage Examples

### Station Search with Autocomplete

```tsx
function StationAutocomplete() {
  const { 
    query, 
    setQuery, 
    results, 
    isLoading 
  } = useStationSearch('', {
    debounceMs: 300,
    limit: 5,
    sortByPopularity: true
  });

  return (
    <div className="autocomplete">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="駅名を入力..."
      />
      
      {query && (
        <div className="dropdown">
          {isLoading && <div>検索中...</div>}
          {results.map(result => (
            <div 
              key={result.station.id}
              className="result-item"
              onClick={() => setQuery(result.station.name)}
            >
              <div className="station-name">{result.station.name}</div>
              <div className="station-info">
                {result.station.prefecture} | {result.station.lines.length}路線
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Interactive Route Builder

```tsx
function RouteBuilder() {
  const {
    segments,
    addStation,
    removeStation,
    validation,
    isValidating
  } = useRouteBuilder();
  
  const { results } = useStationSearch('', { limit: 10 });

  return (
    <div className="route-builder">
      <div className="current-route">
        <h3>現在のルート</h3>
        {segments.map((segment, index) => (
          <div key={index} className="segment">
            <span>{segment.stationName}</span>
            <button onClick={() => removeStation(index)}>削除</button>
          </div>
        ))}
      </div>
      
      <div className="station-picker">
        <h3>駅を追加</h3>
        {results.map(result => (
          <button
            key={result.station.id}
            onClick={() => addStation(result.station.id)}
          >
            {result.station.name}
          </button>
        ))}
      </div>
      
      {isValidating && <div>検証中...</div>}
      {validation && !validation.isValid && (
        <div className="validation-errors">
          {validation.errors.map((error, index) => (
            <div key={index} className="error">
              {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Comprehensive Fare Calculator

```tsx
function FareCalculator() {
  const { calculateFare, result, isCalculating, history } = useFareCalculation();
  const { segments } = useRouteBuilder();
  
  const handleCalculate = async () => {
    if (segments.length < 2) {
      alert('少なくとも2つの駅を選択してください');
      return;
    }
    
    await calculateFare(segments);
  };

  return (
    <div className="fare-calculator">
      <button 
        onClick={handleCalculate} 
        disabled={isCalculating || segments.length < 2}
      >
        {isCalculating ? '計算中...' : '運賃計算'}
      </button>
      
      {result && (
        <div className="fare-result">
          <h3>計算結果</h3>
          <div className="total-fare">
            合計運賃: {result.totalFare}円
          </div>
          
          {result.discounts && result.discounts.length > 0 && (
            <div className="discounts">
              <h4>利用可能な割引</h4>
              {result.discounts.map((discount, index) => (
                <div key={index} className="discount">
                  {discount.name}: -{discount.discountAmount}円
                </div>
              ))}
            </div>
          )}
          
          <div className="route-details">
            <h4>経路詳細</h4>
            {result.route.segments.map((segment, index) => (
              <div key={index} className="route-segment">
                {segment.stationName}
                {segment.isTransfer && <span className="transfer"> (乗換)</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {history.length > 0 && (
        <div className="calculation-history">
          <h3>計算履歴</h3>
          {history.slice(0, 5).map((calc, index) => (
            <div key={index} className="history-item">
              {calc.totalFare}円 - {calc.route.segments.length}駅
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Performance Considerations

### Debouncing and Caching

The React adapter automatically handles:
- **Search debouncing**: Prevents excessive API calls during typing
- **Result caching**: Caches search results and calculations
- **Memory management**: Automatic cleanup of unused data
- **Request cancellation**: Cancels in-flight requests when component unmounts

### Optimization Tips

1. **Use proper dependencies**: Only include necessary dependencies in useEffect
2. **Memoize expensive computations**: Use useMemo for complex calculations
3. **Cleanup subscriptions**: The hooks handle this automatically
4. **Limit result sets**: Use appropriate limits for search results

## Error Handling

The React adapter provides comprehensive error handling:

- **Network errors**: Automatic retry with exponential backoff
- **WebAssembly errors**: Graceful recovery and user feedback
- **Validation errors**: Clear error messages with suggestions
- **Memory errors**: Automatic cleanup and resource management

## TypeScript Support

Full TypeScript support with:
- Complete type definitions for all hooks and components
- Generic types for customization
- Strict type checking for route specifications
- IntelliSense support in VS Code

## Testing

Example testing setup with React Testing Library:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { FarertSDKProvider } from '@farert/sdk/react';
import { createTestSDK } from '@farert/sdk/test-utils';

const TestWrapper = ({ children }) => (
  <FarertSDKProvider customSDK={createTestSDK()}>
    {children}
  </FarertSDKProvider>
);

test('station search works', async () => {
  render(<StationSearch />, { wrapper: TestWrapper });
  
  // Test implementation...
});
```

## Migration from Core SDK

If you're migrating from direct core SDK usage:

```tsx
// Before (direct SDK usage)
const sdk = createFarertSDK();
await sdk.initialize();
const results = await sdk.searchStations('東京');

// After (React hooks)
function MyComponent() {
  const { results } = useStationSearch('東京');
  // Results are automatically managed with loading states
}
```

## License

GPL-3.0 - See project LICENSE file for details.