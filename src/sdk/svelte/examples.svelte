<!--
  Example usage of Farert Svelte Store
  Demonstrates basic patterns and best practices
  
  Requirements: REQ-API-003 - Svelte Integration Examples
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import {
    farertStore,
    isReady,
    isLoading,
    hasError,
    currentError,
    createRouteBuilderStore,
    createRouteBuilderDerivedStores,
    type StationSearchResult,
    type RouteSegmentInfo,
    type FareCalculationResult
  } from './index';

  // Initialize Farert store on mount
  onMount(() => {
    farertStore.initialize({
      enableCache: true,
      debugMode: true,
      autoRetry: true,
      maxRetries: 3,
      onInitialized: () => {
        console.log('✅ Farert SDK initialized successfully');
      },
      onError: (error) => {
        console.error('❌ Farert initialization error:', error.message);
      }
    });
  });

  // Station search state
  let searchQuery = '';
  let searchResults: StationSearchResult[] = [];
  let isSearching = false;

  // Route builder
  const routeBuilder = createRouteBuilderStore({
    maxStations: 8,
    enableRealTimeCalculation: true
  });

  const {
    segments,
    fareResult,
    isValid,
    canCalculate
  } = createRouteBuilderDerivedStores(routeBuilder);

  // Search stations with debouncing
  let searchTimeout: NodeJS.Timeout;
  $: if (searchQuery.trim() && $isReady) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 300);
  } else {
    searchResults = [];
  }

  async function handleSearch() {
    if (!searchQuery.trim() || !$isReady) return;

    isSearching = true;
    try {
      searchResults = await farertStore.searchStations(searchQuery);
    } catch (error) {
      console.error('Search error:', error);
      searchResults = [];
    } finally {
      isSearching = false;
    }
  }

  async function addStationToRoute(station: StationSearchResult) {
    try {
      await routeBuilder.addStation(station.id);
      searchQuery = '';
      searchResults = [];
    } catch (error) {
      console.error('Failed to add station:', error);
    }
  }

  function removeStationFromRoute(index: number) {
    try {
      routeBuilder.removeStation(index);
    } catch (error) {
      console.error('Failed to remove station:', error);
    }
  }

  function clearRoute() {
    routeBuilder.clear();
  }
</script>

<div class="farert-app">
  <h1>Japanese Railway Fare Calculator</h1>
  
  {#if $hasError}
    <!-- Error State -->
    <div class="error-container">
      <h2>🚫 Railway System Error</h2>
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
        <button on:click={() => farertStore.retry()}>
          🔄 Retry
        </button>
        <button on:click={() => farertStore.clearError()}>
          ❌ Dismiss
        </button>
      </div>
    </div>
  
  {:else if !$isReady}
    <!-- Loading State -->
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>🔄 Loading railway system...</p>
    </div>
  
  {:else}
    <!-- Main Application -->
    <div class="app-content">
      
      <!-- Station Search Section -->
      <section class="station-search">
        <h2>Station Search</h2>
        
        <div class="search-input-container">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="駅名を入力してください (例: 東京)"
            disabled={!$isReady}
            class="search-input"
          />
          
          {#if isSearching}
            <div class="search-loading">🔄</div>
          {/if}
        </div>
        
        {#if searchResults.length > 0}
          <ul class="search-results">
            {#each searchResults as station (station.id)}
              <li class="search-result-item">
                <div class="station-info">
                  <strong>{station.name}</strong>
                  {#if station.nameEx !== station.name}
                    <span class="name-ex">({station.nameEx})</span>
                  {/if}
                  {#if station.kana}
                    <span class="kana">{station.kana}</span>
                  {/if}
                </div>
                <button 
                  class="add-button"
                  on:click={() => addStationToRoute(station)}
                >
                  追加
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
      
      <!-- Route Builder Section -->
      <section class="route-builder">
        <h2>Route Builder</h2>
        
        <div class="route-actions">
          <button 
            on:click={clearRoute}
            disabled={$segments.length === 0}
            class="clear-button"
          >
            🗑️ Clear Route
          </button>
          
          <button 
            on:click={() => routeBuilder.undo()}
            disabled={!routeBuilder.canUndo()}
            class="undo-button"
          >
            ↶ Undo
          </button>
          
          <button 
            on:click={() => routeBuilder.redo()}
            disabled={!routeBuilder.canRedo()}
            class="redo-button"
          >
            ↷ Redo
          </button>
        </div>
        
        {#if $segments.length > 0}
          <div class="route-segments">
            {#each $segments as segment, index (segment.stationId)}
              <div class="route-segment">
                <div class="segment-info">
                  <span class="station-name">{segment.stationName}</span>
                  {#if segment.lineName}
                    <span class="line-name">via {segment.lineName}</span>
                  {/if}
                  {#if segment.isTransfer}
                    <span class="transfer-badge">乗換</span>
                  {/if}
                </div>
                
                <button 
                  class="remove-button"
                  on:click={() => removeStationFromRoute(index)}
                >
                  ×
                </button>
                
                {#if index < $segments.length - 1}
                  <div class="route-arrow">→</div>
                {/if}
              </div>
            {/each}
          </div>
        {:else}
          <div class="empty-route">
            <p>ルートを構築するために駅を追加してください</p>
          </div>
        {/if}
      </section>
      
      <!-- Fare Result Section -->
      {#if $fareResult}
        <section class="fare-result">
          <h2>Fare Calculation</h2>
          
          <div class="fare-summary">
            <div class="total-fare">
              <span class="label">運賃:</span>
              <span class="amount">¥{$fareResult.totalFare.toLocaleString()}</span>
            </div>
            
            {#if $fareResult.totalDistance > 0}
              <div class="distance">
                <span class="label">距離:</span>
                <span class="value">{$fareResult.totalDistance.toFixed(1)} km</span>
              </div>
            {/if}
            
            {#if $fareResult.transfers > 0}
              <div class="transfers">
                <span class="label">乗換:</span>
                <span class="value">{$fareResult.transfers}回</span>
              </div>
            {/if}
          </div>
          
          {#if $fareResult.fareBreakdown.length > 1}
            <div class="fare-breakdown">
              <h3>運賃内訳</h3>
              {#each $fareResult.fareBreakdown as item}
                <div class="breakdown-item">
                  <span class="description">{item.description}</span>
                  <span class="amount">¥{item.amount.toLocaleString()}</span>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      {/if}
      
      <!-- Validation Messages -->
      {#if !$isValid}
        <section class="validation-messages">
          <h3>⚠️ Route Issues</h3>
          <!-- Add validation error display here -->
        </section>
      {/if}
      
    </div>
  {/if}
</div>

<style>
  .farert-app {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 2rem;
  }

  h2 {
    color: #34495e;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  /* Error Styles */
  .error-container {
    background: #ffebee;
    border: 1px solid #f44336;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
  }

  .error-container h2 {
    color: #c62828;
    margin-top: 0;
  }

  .suggestions ul {
    margin: 10px 0;
    padding-left: 20px;
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
    font-size: 14px;
  }

  .error-actions button:first-child {
    background: #4caf50;
    color: white;
  }

  .error-actions button:last-child {
    background: #f44336;
    color: white;
  }

  /* Loading Styles */
  .loading-container {
    text-align: center;
    padding: 60px 20px;
  }

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #e3f2fd;
    border-top: 4px solid #2196f3;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* App Content Styles */
  .app-content {
    display: grid;
    gap: 30px;
  }

  /* Station Search Styles */
  .search-input-container {
    position: relative;
    margin-bottom: 15px;
  }

  .search-input {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.3s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3498db;
  }

  .search-loading {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
  }

  .search-results {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid #ddd;
    border-radius: 6px;
    max-height: 300px;
    overflow-y: auto;
  }

  .search-result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
    transition: background-color 0.2s;
  }

  .search-result-item:hover {
    background-color: #f8f9fa;
  }

  .search-result-item:last-child {
    border-bottom: none;
  }

  .station-info {
    flex: 1;
  }

  .name-ex {
    color: #666;
    font-size: 0.9em;
    margin-left: 8px;
  }

  .kana {
    color: #888;
    font-size: 0.8em;
    display: block;
  }

  .add-button {
    background: #3498db;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.2s;
  }

  .add-button:hover {
    background: #2980b9;
  }

  /* Route Builder Styles */
  .route-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .route-actions button {
    padding: 8px 16px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .route-actions button:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #3498db;
  }

  .route-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .clear-button {
    background: #e74c3c !important;
    color: white !important;
    border-color: #e74c3c !important;
  }

  .clear-button:hover:not(:disabled) {
    background: #c0392b !important;
  }

  .route-segments {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    min-height: 80px;
  }

  .route-segment {
    display: flex;
    align-items: center;
    gap: 8px;
    background: white;
    padding: 10px 15px;
    border: 2px solid #3498db;
    border-radius: 20px;
    position: relative;
  }

  .segment-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .station-name {
    font-weight: bold;
    color: #2c3e50;
  }

  .line-name {
    font-size: 0.8em;
    color: #7f8c8d;
  }

  .transfer-badge {
    background: #f39c12;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.7em;
  }

  .remove-button {
    background: #e74c3c;
    color: white;
    border: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }

  .remove-button:hover {
    background: #c0392b;
  }

  .route-arrow {
    color: #3498db;
    font-size: 18px;
    font-weight: bold;
    margin: 0 5px;
  }

  .empty-route {
    text-align: center;
    padding: 40px 20px;
    color: #7f8c8d;
    background: #f8f9fa;
    border-radius: 8px;
  }

  /* Fare Result Styles */
  .fare-result {
    background: #e8f5e8;
    padding: 20px;
    border-radius: 8px;
    border: 2px solid #4caf50;
  }

  .fare-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .total-fare .amount {
    font-size: 1.8em;
    font-weight: bold;
    color: #2e7d32;
  }

  .fare-summary > div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label {
    font-size: 0.9em;
    color: #555;
  }

  .value {
    font-weight: bold;
    color: #2c3e50;
  }

  .fare-breakdown {
    border-top: 1px solid #4caf50;
    padding-top: 15px;
  }

  .breakdown-item {
    display: flex;
    justify-content: space-between;
    padding: 5px 0;
  }

  .breakdown-item:nth-child(even) {
    background: rgba(76, 175, 80, 0.1);
    margin: 0 -10px;
    padding-left: 10px;
    padding-right: 10px;
  }

  /* Validation Messages */
  .validation-messages {
    background: #fff3cd;
    border: 1px solid #ffeeba;
    border-radius: 8px;
    padding: 15px;
  }

  .validation-messages h3 {
    margin-top: 0;
    color: #856404;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .farert-app {
      padding: 15px;
    }

    .route-actions {
      flex-wrap: wrap;
    }

    .route-segments {
      flex-direction: column;
      align-items: stretch;
    }

    .route-segment {
      justify-content: space-between;
      border-radius: 6px;
    }

    .fare-summary {
      grid-template-columns: 1fr;
    }

    .search-result-item {
      flex-direction: column;
      gap: 10px;
      align-items: stretch;
    }

    .add-button {
      align-self: flex-end;
    }
  }
</style>