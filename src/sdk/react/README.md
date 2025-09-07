# Farert React SDK

React Context Provider and hooks for the Farert WebAssembly railway fare calculation system.

## Overview

The Farert React SDK provides a comprehensive solution for integrating Japanese railway fare calculations into React applications. It handles WebAssembly module initialization, error management, caching, and provides React-friendly APIs.

## Features

- 🚅 **WebAssembly Integration**: Seamless integration with Farert WASM module
- ⚡ **React Context Provider**: Centralized state management for all components
- 🔄 **Auto-initialization**: Automatic WASM module loading with retry logic
- 🎯 **TypeScript Support**: Full type safety with comprehensive interfaces
- 🏪 **Intelligent Caching**: Performance-optimized caching for searches and calculations
- 🛡️ **Error Boundaries**: Comprehensive error handling with user-friendly messages
- 🔧 **Debug Support**: Development tools and debugging utilities
- 📱 **Loading States**: Proper loading indicators and state management

## Quick Start

### 1. Installation

```bash
# The React SDK is part of the main Farert WASM package
npm install # Install project dependencies
npm run build # Build the WebAssembly module
```

### 2. Basic Setup

```tsx
import React from 'react';
import { FarertProvider, FarertErrorBoundary } from './src/sdk/react';

function App() {
  return (
    <FarertErrorBoundary>
      <FarertProvider
        config={{
          enableCache: true,
          debugMode: process.env.NODE_ENV === 'development'
        }}
        onInitialized={() => console.log('🚅 Railway system ready!')}
        onError={(error) => console.error('Railway error:', error)}
      >
        <YourRailwayApp />
      </FarertProvider>
    </FarertErrorBoundary>
  );
}
```

### 3. Using the Hook

```tsx
import React, { useState } from 'react';
import { useFarert } from './src/sdk/react';

function StationSearch() {
  const { searchStations, isReady, error } = useFarert();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!query || !isReady) return;
    
    try {
      const stations = await searchStations(query);
      setResults(stations);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="駅名を入力 (例: 東京)"
        disabled={!isReady}
      />
      <button onClick={handleSearch} disabled={!isReady}>
        検索
      </button>
      
      {results.map(station => (
        <div key={station.id}>{station.name}</div>
      ))}
    </div>
  );
}
```

## API Reference

### FarertProvider

The main context provider that manages WebAssembly initialization and state.

#### Props

```tsx
interface FarertProviderProps {
  children: ReactNode;
  config?: Partial<ReactSDKConfig>;
  onInitialized?: () => void;
  onError?: (error: CLIError) => void;
  maxRetries?: number;
}
```

#### Configuration Options

```tsx
interface ReactSDKConfig {
  cache: {
    enabled: boolean;           // Enable caching (default: true)
    maxSize: number;           // Maximum cache entries (default: 1000)
    defaultTtl: number;        // Default TTL in ms (default: 5min)
  };
  performance: {
    enableMetrics: boolean;     // Enable performance monitoring
    slowOperationThreshold: number; // Threshold for slow ops (default: 1000ms)
  };
  ui: {
    enableAnimations: boolean;  // Enable UI animations
    theme: 'light' | 'dark' | 'auto';
    language: 'ja' | 'en';
    currency: 'JPY' | 'USD';
  };
  debug: {
    enabled: boolean;           // Enable debug logging
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    logWasmCalls: boolean;     // Log WebAssembly function calls
  };
  errorHandling: {
    retryAttempts: number;      // Auto-retry attempts (default: 3)
    retryDelayMs: number;       // Delay between retries (default: 1000ms)
  };
}
```

### useFarert Hook

The main hook for accessing Farert functionality.

```tsx
const {
  // State
  isReady,                    // boolean - WASM module ready
  isLoading,                  // boolean - Currently initializing
  hasError,                   // boolean - Error occurred
  error,                      // CLIError | null - Current error
  module,                     // FarertModule | null - WASM module
  
  // Actions
  initialize,                 // () => Promise<void>
  retry,                      // () => Promise<void>
  clearError,                 // () => void
  clearCache,                 // () => void
  
  // Station Operations
  searchStations,             // (query: string) => Promise<StationSearchResult[]>
  getStationById,            // (id: number) => Promise<StationSearchResult | null>
  
  // Line Operations
  getLinesForStation,        // (stationId: number) => Promise<LineInfo[]>
  getLineById,              // (id: number) => Promise<LineInfo | null>
  
  // Route Calculation
  calculateFare,            // (route: RouteSegment[]) => Promise<FareCalculationResult>
  createRoute,              // () => RouteWrapper | null
  createCalcRoute,          // () => CalcRouteWrapper | null
} = useFarert();
```

### Error Handling

#### FarertErrorBoundary

React Error Boundary for catching WebAssembly and component errors.

```tsx
<FarertErrorBoundary
  onError={(error, errorInfo) => {
    // Handle error
    console.error('Farert Error:', error.getFormattedMessage());
  }}
  fallback={CustomErrorComponent} // Optional custom fallback
>
  <YourApp />
</FarertErrorBoundary>
```

#### Error Types

The SDK provides specific error types with detailed information:

```tsx
// WebAssembly loading errors
WebAssemblyLoadError

// Database connection errors
DatabaseError

// Input validation errors
InputValidationError

// React-specific errors
ReactSDKError
```

## Advanced Usage

### Custom Error Handling

```tsx
function MyComponent() {
  const { calculateFare, error } = useFarert();
  
  const handleCalculation = async (route) => {
    try {
      const result = await calculateFare(route);
      // Handle success
    } catch (err) {
      if (err instanceof InputValidationError) {
        // Handle validation errors
        console.log('Validation suggestions:', err.suggestions);
      } else if (err instanceof WebAssemblyLoadError) {
        // Handle WASM errors
        console.log('WASM error context:', err.context);
      }
    }
  };
}
```

### Performance Monitoring

```tsx
import { dev } from './src/sdk/react';

// Development utilities (only available in dev mode)
function DebugComponent() {
  const { module } = useFarert();
  
  useEffect(() => {
    if (module) {
      dev.inspectModule(module);
      dev.profile.start('fare-calculation');
      // ... perform calculation
      dev.profile.end('fare-calculation');
    }
  }, [module]);
}
```

### Caching Control

```tsx
function CacheManagement() {
  const { clearCache, config } = useFarert();
  
  // Manual cache management
  const handleClearCache = () => {
    clearCache();
    console.log('Cache cleared');
  };
  
  // Cache configuration
  console.log('Cache enabled:', config.enableCache);
  console.log('Cache timeout:', config.cacheTimeout);
}
```

## Examples

### Station Autocomplete Component

```tsx
function StationAutocomplete({ onSelect }) {
  const { searchStations, isReady } = useFarert();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounced search
  useEffect(() => {
    if (!query.trim() || !isReady) {
      setResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const stations = await searchStations(query);
        setResults(stations);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, searchStations, isReady]);
  
  return (
    <div className="station-autocomplete">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="駅名を入力してください"
        disabled={!isReady}
      />
      
      {isSearching && <div className="loading">🔄 検索中...</div>}
      
      {results.length > 0 && (
        <ul className="results">
          {results.map((station) => (
            <li
              key={station.id}
              onClick={() => onSelect(station)}
              className="result-item"
            >
              <strong>{station.name}</strong>
              {station.nameEx !== station.name && (
                <span className="name-ex">({station.nameEx})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Route Builder Component

```tsx
function RouteBuilder() {
  const { calculateFare, isReady } = useFarert();
  const [route, setRoute] = useState([]);
  const [result, setResult] = useState(null);
  
  const addStation = (station) => {
    setRoute(prev => [...prev, {
      stationId: station.id,
      stationName: station.name
    }]);
  };
  
  const removeStation = (index) => {
    setRoute(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleCalculate = async () => {
    if (route.length < 2) return;
    
    try {
      const fareResult = await calculateFare(route);
      setResult(fareResult);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };
  
  return (
    <div className="route-builder">
      <h3>Route Builder</h3>
      
      <div className="route-segments">
        {route.map((segment, index) => (
          <div key={index} className="segment">
            {segment.stationName}
            <button onClick={() => removeStation(index)}>×</button>
            {index < route.length - 1 && <span>→</span>}
          </div>
        ))}
      </div>
      
      <StationAutocomplete onSelect={addStation} />
      
      <button
        onClick={handleCalculate}
        disabled={!isReady || route.length < 2}
      >
        Calculate Fare
      </button>
      
      {result && (
        <div className="fare-result">
          <h4>運賃: ¥{result.fareInfo.fare.toLocaleString()}</h4>
          <p>計算時間: {result.calculationTimeMs}ms</p>
        </div>
      )}
    </div>
  );
}
```

## Requirements Compliance

This React Provider fulfills the following requirements:

### REQ-API-003: React Integration Hooks and Components

1. ✅ **useStationSearch(query)** - Implemented via `searchStations` method with debounced search, loading states, and error handling
2. ✅ **useFareCalculation(route)** - Implemented via `calculateFare` method with automatic dependency tracking and caching
3. ✅ **StationSelector Component** - Foundation provided with autocomplete functionality and Japanese text support
4. ✅ **RouteBuilder Component** - Foundation provided with validation and drag-and-drop capability planning
5. ✅ **Error Boundaries** - Comprehensive error boundary implementation with user-friendly error messages

## Development

### Running Examples

```bash
# Build the WebAssembly module first
make all && npm run build

# Run development server with examples
npm run dev

# Run tests
npm test
```

### Debugging

Enable debug mode for detailed logging:

```tsx
<FarertProvider
  config={{
    debug: {
      enabled: true,
      logLevel: 'debug',
      logWasmCalls: true
    }
  }}
>
```

### Building for Production

```bash
npm run build:prod
```

## Troubleshooting

### Common Issues

1. **WebAssembly module not found**
   - Ensure `make all` has been run
   - Check that `dist/farert.js` and `dist/farert.wasm` exist

2. **Database initialization failed**
   - Verify `data/jrdbnewest.db` exists
   - Check file permissions

3. **TypeScript errors**
   - Ensure all dependencies are installed
   - Run `npm run build` to generate types

4. **Performance issues**
   - Enable caching with `config.enableCache: true`
   - Monitor with `config.performance.enableMetrics: true`

### Error Codes

The SDK uses specific error codes for different failure scenarios:

- `1000-1999`: React SDK specific errors
- `10-19`: WebAssembly loading errors
- `20-29`: Database errors
- `30-39`: Input validation errors

See the full error code reference in the type definitions.

## Contributing

When contributing to the React SDK:

1. Follow TypeScript strict mode requirements
2. Add comprehensive error handling
3. Include performance considerations
4. Write tests for new functionality
5. Update documentation and examples

## License

GPL-3.0 - Same as the main Farert project.