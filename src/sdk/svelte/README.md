# Farert Svelte SDK

Svelte store and components for the Farert WebAssembly railway fare calculation system.

## Overview

The Farert Svelte SDK provides a comprehensive solution for integrating Japanese railway fare calculations into Svelte applications. It handles WebAssembly module initialization, error management, caching, and provides Svelte-friendly reactive stores.

## Features

- 🚅 **WebAssembly Integration**: Seamless integration with Farert WASM module
- ⚡ **Svelte Stores**: Reactive state management with built-in stores
- 🔄 **Auto-initialization**: Automatic WASM module loading with retry logic
- 🎯 **TypeScript Support**: Full type safety with comprehensive interfaces
- 🏪 **Intelligent Caching**: Performance-optimized caching for searches and calculations
- 🛡️ **Error Handling**: Comprehensive error management with reactive error states
- 🔧 **Debug Support**: Development tools and debugging utilities
- 📱 **Loading States**: Proper loading indicators and reactive state management

## Quick Start

### 1. Installation

```bash
# The Svelte SDK is part of the main Farert WASM package
npm install # Install project dependencies
npm run build # Build the WebAssembly module
```

### 2. Basic Setup

```svelte
<script>
  import { farertStore, isReady, hasError, currentError } from './src/sdk/svelte';
  import { onMount } from 'svelte';

  onMount(() => {
    farertStore.initialize({
      enableCache: true,
      debugMode: import.meta.env.DEV,
      onInitialized: () => console.log('🚅 Railway system ready!'),
      onError: (error) => console.error('Railway error:', error)
    });
  });
</script>

{#if $hasError}
  <div class="error">
    Error: {$currentError?.message}
  </div>
{:else if !$isReady}
  <div class="loading">🔄 Loading railway system...</div>
{:else}
  <YourRailwayApp />
{/if}
```

### 3. Using the Store

```svelte
<script>
  import { farertStore, isReady } from './src/sdk/svelte';
  
  let query = '';
  let results = [];

  async function handleSearch() {
    if (!query || !$isReady) return;
    
    try {
      results = await farertStore.searchStations(query);
    } catch (err) {
      console.error('Search failed:', err);
    }
  }
</script>

<div>
  <input
    bind:value={query}
    placeholder="駅名を入力 (例: 東京)"
    disabled={!$isReady}
  />
  <button on:click={handleSearch} disabled={!$isReady}>
    検索
  </button>
  
  {#each results as station (station.id)}
    <div>{station.name}</div>
  {/each}
</div>
```

## API Reference

### Main Store

```typescript
import { farertStore } from './src/sdk/svelte';

// Actions
await farertStore.initialize(config);
await farertStore.retry();
farertStore.clearError();
farertStore.clearCache();

// Station Operations
const stations = await farertStore.searchStations(query);
const station = await farertStore.getStationById(id);

// Line Operations
const lines = await farertStore.getLinesForStation(stationId);
const line = await farertStore.getLineById(id);

// Route Calculation
const result = await farertStore.calculateFare(route);
const routeWrapper = farertStore.createRoute();
const calcRouteWrapper = farertStore.createCalcRoute();
```

### Derived Stores

```typescript
import { 
  isReady,      // Readable<boolean> - WASM module ready
  isLoading,    // Readable<boolean> - Currently initializing
  hasError,     // Readable<boolean> - Error occurred
  canRetry,     // Readable<boolean> - Can retry initialization
  currentError, // Readable<CLIError | null> - Current error
  wasmModule    // Readable<FarertModule | null> - WASM module
} from './src/sdk/svelte';
```

### Configuration

```typescript
interface FarertStoreConfig {
  enableCache?: boolean;
  cacheTimeout?: number;
  debugMode?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  onInitialized?: () => void;
  onError?: (error: CLIError) => void;
}
```

### Auto-initialization Utilities

```svelte
<script>
  import { autoInitializeFarert, farertInit } from './src/sdk/svelte';
  
  // Method 1: Programmatic auto-initialization
  onMount(() => {
    const cleanup = autoInitializeFarert({
      enableCache: true,
      debugMode: import.meta.env.DEV
    });
    
    return cleanup;
  });
</script>

<!-- Method 2: Using Svelte action -->
<div use:farertInit={{ enableCache: true }}>
  <YourApp />
</div>
```

## Examples

### Station Autocomplete Component

```svelte
<script>
  import { farertStore, isReady } from './src/sdk/svelte';
  import { createEventDispatcher } from 'svelte';
  
  export let placeholder = '駅名を入力してください';
  
  const dispatch = createEventDispatcher();
  
  let query = '';
  let results = [];
  let isSearching = false;
  let searchTimeout;

  $: if (query.trim() && $isReady) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 300);
  } else {
    results = [];
  }

  async function handleSearch() {
    if (!query.trim() || !$isReady) return;
    
    isSearching = true;
    try {
      results = await farertStore.searchStations(query);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      isSearching = false;
    }
  }

  function selectStation(station) {
    dispatch('select', station);
    query = station.name;
    results = [];
  }
</script>

<div class="station-autocomplete">
  <input
    type="text"
    bind:value={query}
    {placeholder}
    disabled={!$isReady}
  />
  
  {#if isSearching}
    <div class="loading">🔄 検索中...</div>
  {/if}
  
  {#if results.length > 0}
    <ul class="results">
      {#each results as station (station.id)}
        <li
          class="result-item"
          on:click={() => selectStation(station)}
          on:keydown={(e) => e.key === 'Enter' && selectStation(station)}
          tabindex="0"
        >
          <strong>{station.name}</strong>
          {#if station.nameEx !== station.name}
            <span class="name-ex">({station.nameEx})</span>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .station-autocomplete {
    position: relative;
  }
  
  .results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 10;
  }
  
  .result-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
  }
  
  .result-item:hover,
  .result-item:focus {
    background-color: #f5f5f5;
  }
  
  .name-ex {
    color: #666;
    font-size: 0.9em;
  }
  
  .loading {
    padding: 8px;
    color: #666;
    font-style: italic;
  }
</style>
```

### Route Builder Component

```svelte
<script>
  import { farertStore, isReady } from './src/sdk/svelte';
  import StationAutocomplete from './StationAutocomplete.svelte';
  
  let route = [];
  let result = null;
  let isCalculating = false;

  function addStation(event) {
    const station = event.detail;
    route = [...route, {
      stationId: station.id,
      stationName: station.name
    }];
  }

  function removeStation(index) {
    route = route.filter((_, i) => i !== index);
  }

  async function handleCalculate() {
    if (route.length < 2 || !$isReady) return;
    
    isCalculating = true;
    try {
      result = await farertStore.calculateFare(route);
    } catch (error) {
      console.error('Calculation error:', error);
      result = null;
    } finally {
      isCalculating = false;
    }
  }

  $: canCalculate = $isReady && route.length >= 2 && !isCalculating;
</script>

<div class="route-builder">
  <h3>Route Builder</h3>
  
  <div class="route-segments">
    {#each route as segment, index (segment.stationId)}
      <div class="segment">
        <span class="station-name">{segment.stationName}</span>
        <button on:click={() => removeStation(index)}>×</button>
        {#if index < route.length - 1}
          <span class="arrow">→</span>
        {/if}
      </div>
    {/each}
  </div>
  
  <StationAutocomplete on:select={addStation} />
  
  <button
    on:click={handleCalculate}
    disabled={!canCalculate}
    class:loading={isCalculating}
  >
    {isCalculating ? '計算中...' : '運賃を計算'}
  </button>
  
  {#if result}
    <div class="fare-result">
      <h4>運賃: ¥{result.fareInfo.fare.toLocaleString()}</h4>
      <p>計算時間: {result.calculationTimeMs}ms</p>
      <p>計算日時: {result.calculatedAt.toLocaleString()}</p>
    </div>
  {/if}
</div>

<style>
  .route-builder {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .route-segments {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0;
  }
  
  .segment {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f0f8ff;
    border: 1px solid #b0d4ff;
    border-radius: 4px;
  }
  
  .station-name {
    font-weight: bold;
  }
  
  .arrow {
    color: #666;
    margin: 0 4px;
  }
  
  button {
    padding: 10px 20px;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  button.loading {
    background: #999;
  }
  
  .fare-result {
    margin-top: 20px;
    padding: 16px;
    background: #e8f5e8;
    border: 1px solid #4caf50;
    border-radius: 4px;
  }
  
  .fare-result h4 {
    margin: 0 0 8px 0;
    color: #2e7d32;
  }
  
  .fare-result p {
    margin: 4px 0;
    color: #555;
    font-size: 0.9em;
  }
</style>
```

### Error Handling Component

```svelte
<script>
  import { hasError, currentError, canRetry, farertStore } from './src/sdk/svelte';
  
  function handleRetry() {
    farertStore.retry();
  }
  
  function handleClearError() {
    farertStore.clearError();
  }
</script>

{#if $hasError}
  <div class="error-container">
    <h3>🚫 Railway System Error</h3>
    
    <p>{$currentError?.message || 'An unexpected error occurred'}</p>
    
    {#if $currentError?.suggestions?.length > 0}
      <div class="suggestions">
        <strong>Suggestions:</strong>
        <ul>
          {#each $currentError.suggestions as suggestion}
            <li>{suggestion}</li>
          {/each}
        </ul>
      </div>
    {/if}
    
    <div class="error-actions">
      {#if $canRetry}
        <button on:click={handleRetry}>
          🔄 Retry
        </button>
      {/if}
      <button on:click={handleClearError}>
        ❌ Dismiss
      </button>
    </div>
  </div>
{/if}

<style>
  .error-container {
    padding: 20px;
    border: 1px solid #ff6b6b;
    border-radius: 4px;
    background-color: #ffebee;
    margin: 10px 0;
  }
  
  .error-container h3 {
    color: #c62828;
    margin: 0 0 10px 0;
  }
  
  .suggestions {
    margin: 10px 0;
  }
  
  .suggestions ul {
    margin: 5px 0 0 0;
    padding-left: 20px;
  }
  
  .suggestions li {
    margin: 2px 0;
  }
  
  .error-actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
  }
  
  .error-actions button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .error-actions button:first-child {
    background: #4caf50;
    color: white;
  }
  
  .error-actions button:last-child {
    background: #f44336;
    color: white;
  }
</style>
```

## Requirements Compliance

This Svelte Store fulfills the following requirements:

### REQ-API-003: Svelte Integration Stores and Components

1. ✅ **Reactive Stores** - Comprehensive store system with derived stores for common state queries
2. ✅ **Station Search** - Implemented via `searchStations` method with reactive caching and error handling
3. ✅ **Fare Calculation** - Implemented via `calculateFare` method with automatic dependency tracking and caching
4. ✅ **Station Selector Component** - Foundation provided with autocomplete functionality and Japanese text support
5. ✅ **Route Builder Component** - Complete implementation with validation and interactive UI
6. ✅ **Error Handling** - Reactive error state management with user-friendly error messages

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
   - Enable caching with `enableCache: true`
   - Use derived stores to avoid unnecessary reactivity

### Error Codes

The SDK uses specific error codes for different failure scenarios:

- `1000-1999`: Svelte SDK specific errors
- `10-19`: WebAssembly loading errors
- `20-29`: Database errors  
- `30-39`: Input validation errors

See the full error code reference in the type definitions.

## Contributing

When contributing to the Svelte SDK:

1. Follow TypeScript strict mode requirements
2. Add comprehensive error handling
3. Include performance considerations
4. Write tests for new functionality
5. Update documentation and examples
6. Follow Svelte best practices for reactivity

## License

GPL-3.0 - Same as the main Farert project.