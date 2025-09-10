<!--
  StationSelector.svelte - Station Search and Selection Component
  
  A comprehensive station selector with autocomplete, accessibility, and Japanese text support.
  Integrates with station search stores for reactive search and intelligent suggestions.
  
  Features:
  - Fuzzy search with debounced input
  - Japanese text support (hiragana, katakana, kanji)
  - ARIA-compliant autocomplete interface
  - Keyboard navigation (Arrow keys, Enter, Escape)
  - Popular stations quick selection
  - Search history with persistence
  - Loading states and error handling
  - Responsive design with mobile optimization
  - Theme support via CSS custom properties
  
  Requirements: REQ-API-003
  @component
  @version 1.0.0
  @author Farert WebAssembly Project
  @license GPL-3.0
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { stationSearchStore, quickSearchStore, autocompleteStore } from '../station-search-store';
  import type { StationSearchResult, StationInfo } from '../../types';
  
  // ============================================================================
  // COMPONENT PROPS AND TYPES
  // ============================================================================
  
  /**
   * Station selector configuration and appearance options
   */
  interface StationSelectorProps {
    /** Current selected station */
    selected?: StationInfo | null;
    /** Placeholder text for search input */
    placeholder?: string;
    /** Search store variant to use */
    searchMode?: 'default' | 'quick' | 'autocomplete';
    /** Show popular stations section */
    showPopular?: boolean;
    /** Show search history */
    showHistory?: boolean;
    /** Maximum number of results to display */
    maxResults?: number;
    /** Enable keyboard navigation */
    keyboardNav?: boolean;
    /** Input field size variant */
    size?: 'small' | 'medium' | 'large';
    /** Component styling variant */
    variant?: 'default' | 'compact' | 'detailed';
    /** Disabled state */
    disabled?: boolean;
    /** Required field indicator */
    required?: boolean;
    /** Error state and message */
    error?: string | null;
    /** Loading state override */
    loading?: boolean;
    /** Custom CSS class */
    class?: string;
    /** Accessibility label */
    ariaLabel?: string;
    /** Autocomplete behavior */
    autocomplete?: 'off' | 'on';
  }
  
  // Props with defaults
  export let selected: StationInfo | null = null;
  export let placeholder: string = '駅名を入力してください';
  export let searchMode: 'default' | 'quick' | 'autocomplete' = 'default';
  export let showPopular: boolean = true;
  export let showHistory: boolean = true;
  export let maxResults: number = 10;
  export let keyboardNav: boolean = true;
  export let size: 'small' | 'medium' | 'large' = 'medium';
  export let variant: 'default' | 'compact' | 'detailed' = 'default';
  export let disabled: boolean = false;
  export let required: boolean = false;
  export let error: string | null = null;
  export let loading: boolean = false;
  export let className: string = '';
  export { className as class };
  export let ariaLabel: string = '駅選択';
  export let autocomplete: 'off' | 'on' = 'off';
  
  // ============================================================================
  // EVENT DISPATCHER AND COMPONENT STATE
  // ============================================================================
  
  const dispatch = createEventDispatcher<{
    select: { station: StationInfo };
    clear: void;
    search: { query: string };
    focus: { element: HTMLElement };
    blur: { element: HTMLElement };
    error: { error: string };
  }>();
  
  // Component state
  let inputElement: HTMLInputElement;
  let dropdownElement: HTMLElement;
  let query: string = selected?.name || '';
  let isOpen: boolean = false;
  let highlightedIndex: number = -1;
  let componentId: string = `station-selector-${Math.random().toString(36).substr(2, 9)}`;
  let isClient: boolean = false;
  
  // Search store selection
  $: searchStore = searchMode === 'quick' ? quickSearchStore 
                 : searchMode === 'autocomplete' ? autocompleteStore 
                 : stationSearchStore;
  
  // Reactive state from store
  $: searchState = $searchStore;
  $: results = searchState.results.slice(0, maxResults);
  $: isSearching = searchState.isLoading || loading;
  $: searchError = error || searchState.error?.message || null;
  $: suggestions = searchState.suggestions;
  $: popularStations = searchState.popularStations;
  $: searchHistory = showHistory ? searchState.searchHistory.slice(0, 5) : [];
  
  // ============================================================================
  // COMPONENT LIFECYCLE AND SETUP
  // ============================================================================
  
  onMount(async () => {
    isClient = true;
    
    // Load popular stations if enabled
    if (showPopular && searchStore.getPopularStations) {
      try {
        await searchStore.getPopularStations();
      } catch (err) {
        console.warn('[StationSelector] Failed to load popular stations:', err);
      }
    }
    
    // Set initial query if station is pre-selected
    if (selected) {
      query = selected.name;
    }
    
    // Set up global click handler for dropdown close
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleGlobalClick);
    }
  });
  
  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', handleGlobalClick);
    }
  });
  
  // ============================================================================
  // SEARCH AND SELECTION LOGIC
  // ============================================================================
  
  /**
   * Handle search input with debouncing and validation
   */
  async function handleSearch(newQuery: string): Promise<void> {
    query = newQuery;
    
    if (!isClient) return;
    
    dispatch('search', { query: newQuery });
    
    // Clear selection if query doesn't match selected station
    if (selected && selected.name !== newQuery) {
      selected = null;
      dispatch('clear');
    }
    
    // Perform search if query is not empty
    if (newQuery.trim()) {
      try {
        await searchStore.search(newQuery);
        isOpen = true;
        highlightedIndex = 0;
      } catch (err) {
        console.error('[StationSelector] Search failed:', err);
        dispatch('error', { error: err instanceof Error ? err.message : String(err) });
      }
    } else {
      isOpen = showPopular && popularStations.length > 0;
      highlightedIndex = -1;
    }
  }
  
  /**
   * Select a station from search results or popular stations
   */
  function selectStation(station: StationInfo | StationSearchResult): void {
    const stationInfo: StationInfo = 'station' in station ? station.station : {
      id: station.id,
      name: station.name || station.nameEx,
      nameExtended: station.nameEx || station.name,
      kana: station.kana || '',
      prefecture: station.prefecture || '',
      prefectureId: 0,
      isJunction: false,
      lines: []
    };
    
    selected = stationInfo;
    query = stationInfo.name;
    isOpen = false;
    highlightedIndex = -1;
    
    // Add to search history
    if (searchStore.addToHistory) {
      searchStore.addToHistory(query);
    }
    
    dispatch('select', { station: stationInfo });
    
    // Return focus to input
    if (inputElement) {
      inputElement.blur();
    }
  }
  
  /**
   * Clear current selection
   */
  function clearSelection(): void {
    selected = null;
    query = '';
    isOpen = false;
    highlightedIndex = -1;
    
    dispatch('clear');
    
    if (inputElement) {
      inputElement.focus();
    }
  }
  
  // ============================================================================
  // KEYBOARD AND INTERACTION HANDLERS
  // ============================================================================
  
  /**
   * Handle keyboard navigation and shortcuts
   */
  function handleKeydown(event: KeyboardEvent): void {
    if (!keyboardNav) return;
    
    const allItems = [
      ...results,
      ...(showHistory ? searchHistory.map(h => ({ query: h, type: 'history' })) : []),
      ...(showPopular && !query ? popularStations.map(p => ({ station: p, type: 'popular' })) : [])
    ];
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          isOpen = true;
          highlightedIndex = 0;
        } else {
          highlightedIndex = Math.min(highlightedIndex + 1, allItems.length - 1);
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, 0);
        break;
        
      case 'Enter':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0 && allItems[highlightedIndex]) {
          const item = allItems[highlightedIndex];
          
          if ('station' in item) {
            selectStation(item.station);
          } else if ('query' in item) {
            handleSearch(item.query);
          } else {
            selectStation(item);
          }
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        isOpen = false;
        highlightedIndex = -1;
        if (inputElement) {
          inputElement.blur();
        }
        break;
        
      case 'Tab':
        isOpen = false;
        highlightedIndex = -1;
        break;
    }
  }
  
  /**
   * Handle input focus
   */
  function handleFocus(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    dispatch('focus', { element: target });
    
    // Show dropdown on focus if there are results or popular stations
    if (results.length > 0 || (showPopular && popularStations.length > 0 && !query)) {
      isOpen = true;
    }
  }
  
  /**
   * Handle input blur
   */
  function handleBlur(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    dispatch('blur', { element: target });
    
    // Delay closing to allow for dropdown clicks
    setTimeout(() => {
      if (!dropdownElement?.contains(document.activeElement)) {
        isOpen = false;
        highlightedIndex = -1;
      }
    }, 150);
  }
  
  /**
   * Handle global click for dropdown close
   */
  function handleGlobalClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (
      !inputElement?.contains(target) && 
      !dropdownElement?.contains(target)
    ) {
      isOpen = false;
      highlightedIndex = -1;
    }
  }
  
  /**
   * Handle dropdown item click
   */
  function handleItemClick(item: any, index: number): void {
    highlightedIndex = index;
    
    if ('station' in item) {
      selectStation(item.station);
    } else if ('query' in item) {
      handleSearch(item.query);
    } else {
      selectStation(item);
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Format station display name based on variant
   */
  function formatStationName(station: StationInfo | StationSearchResult): string {
    const name = 'station' in station ? station.station.name : station.name || station.nameEx;
    const prefecture = 'station' in station ? station.station.prefecture : station.prefecture;
    
    switch (variant) {
      case 'detailed':
        return prefecture ? `${name} (${prefecture})` : name;
      case 'compact':
        return name;
      default:
        return name;
    }
  }
  
  /**
   * Get appropriate ARIA attributes for accessibility
   */
  function getAriaAttributes() {
    return {
      'aria-label': ariaLabel,
      'aria-expanded': isOpen.toString(),
      'aria-haspopup': 'listbox',
      'aria-activedescendant': highlightedIndex >= 0 ? `${componentId}-option-${highlightedIndex}` : undefined,
      'aria-describedby': searchError ? `${componentId}-error` : undefined,
      'aria-required': required.toString(),
      'role': 'combobox'
    };
  }
</script>

<!-- ============================================================================ -->
<!-- COMPONENT TEMPLATE -->
<!-- ============================================================================ -->

<div class="station-selector {className}" class:disabled class:error={!!searchError} data-size={size} data-variant={variant}>
  <!-- Input field with loading indicator and clear button -->
  <div class="input-container">
    <input
      bind:this={inputElement}
      bind:value={query}
      on:input={(e) => handleSearch(e.target.value)}
      on:keydown={handleKeydown}
      on:focus={handleFocus}
      on:blur={handleBlur}
      {placeholder}
      {disabled}
      {autocomplete}
      {...getAriaAttributes()}
      class="search-input"
      class:has-value={!!query}
      class:loading={isSearching}
    />
    
    <!-- Loading spinner -->
    {#if isSearching}
      <div class="loading-spinner" aria-hidden="true">
        <div class="spinner"></div>
      </div>
    {/if}
    
    <!-- Clear button -->
    {#if query && !disabled}
      <button
        type="button"
        class="clear-button"
        on:click={clearSelection}
        aria-label="クリア"
        tabindex="-1"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
        </svg>
      </button>
    {/if}
    
    <!-- Required indicator -->
    {#if required}
      <span class="required-indicator" aria-hidden="true">*</span>
    {/if}
  </div>
  
  <!-- Error message -->
  {#if searchError}
    <div class="error-message" id="{componentId}-error" role="alert">
      {searchError}
    </div>
  {/if}
  
  <!-- Dropdown results -->
  {#if isOpen && isClient}
    <div
      bind:this={dropdownElement}
      class="dropdown"
      role="listbox"
      aria-label="検索結果"
    >
      <!-- Search results -->
      {#if results.length > 0}
        <div class="results-section">
          <div class="section-header">検索結果</div>
          {#each results as result, index}
            <button
              type="button"
              class="dropdown-item result-item"
              class:highlighted={index === highlightedIndex}
              id="{componentId}-option-{index}"
              role="option"
              aria-selected={index === highlightedIndex}
              on:click={() => handleItemClick(result, index)}
              on:mouseenter={() => highlightedIndex = index}
            >
              <div class="station-info">
                <div class="station-name">{formatStationName(result)}</div>
                {#if variant === 'detailed' && result.kana}
                  <div class="station-kana">{result.kana}</div>
                {/if}
              </div>
              {#if variant === 'detailed' && result.prefecture}
                <div class="station-prefecture">{result.prefecture}</div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
      
      <!-- Search history -->
      {#if showHistory && searchHistory.length > 0 && query.length < 2}
        <div class="results-section">
          <div class="section-header">検索履歴</div>
          {#each searchHistory as historyItem, index}
            {@const itemIndex = results.length + index}
            <button
              type="button"
              class="dropdown-item history-item"
              class:highlighted={itemIndex === highlightedIndex}
              id="{componentId}-option-{itemIndex}"
              role="option"
              aria-selected={itemIndex === highlightedIndex}
              on:click={() => handleItemClick({ query: historyItem, type: 'history' }, itemIndex)}
              on:mouseenter={() => highlightedIndex = itemIndex}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" class="history-icon">
                <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V6.75a.5.5 0 0 1-.854.353L5.854 5.811a.5.5 0 0 1 0-.707L7.146 3.811A.5.5 0 0 1 8 4.466z"/>
              </svg>
              <span>{historyItem}</span>
            </button>
          {/each}
        </div>
      {/if}
      
      <!-- Popular stations -->
      {#if showPopular && popularStations.length > 0 && !query}
        <div class="results-section">
          <div class="section-header">人気駅</div>
          {#each popularStations.slice(0, 5) as station, index}
            {@const itemIndex = results.length + searchHistory.length + index}
            <button
              type="button"
              class="dropdown-item popular-item"
              class:highlighted={itemIndex === highlightedIndex}
              id="{componentId}-option-{itemIndex}"
              role="option"
              aria-selected={itemIndex === highlightedIndex}
              on:click={() => handleItemClick({ station, type: 'popular' }, itemIndex)}
              on:mouseenter={() => highlightedIndex = itemIndex}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" class="popular-icon">
                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
              </svg>
              <span>{formatStationName(station)}</span>
            </button>
          {/each}
        </div>
      {/if}
      
      <!-- No results message -->
      {#if results.length === 0 && query && !isSearching}
        <div class="no-results">
          <div class="no-results-text">該当する駅が見つかりません</div>
          <div class="no-results-hint">別の読み方や漢字で検索してみてください</div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- ============================================================================ -->
<!-- COMPONENT STYLES -->
<!-- ============================================================================ -->

<style>
  /* CSS Custom Properties for theming */
  .station-selector {
    --bg-primary: var(--farert-bg-primary, #ffffff);
    --bg-secondary: var(--farert-bg-secondary, #f8f9fa);
    --bg-tertiary: var(--farert-bg-tertiary, #e9ecef);
    --text-primary: var(--farert-text-primary, #212529);
    --text-secondary: var(--farert-text-secondary, #6c757d);
    --text-muted: var(--farert-text-muted, #adb5bd);
    --border-color: var(--farert-border-color, #dee2e6);
    --border-focus: var(--farert-border-focus, #0d6efd);
    --error-color: var(--farert-error-color, #dc3545);
    --success-color: var(--farert-success-color, #198754);
    --shadow: var(--farert-shadow, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075));
    --shadow-lg: var(--farert-shadow-lg, 0 0.5rem 1rem rgba(0, 0, 0, 0.15));
    --radius: var(--farert-radius, 0.375rem);
    --transition: var(--farert-transition, 0.15s ease-in-out);
  }
  
  /* Dark theme support */
  .station-selector[data-theme="dark"] {
    --bg-primary: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-tertiary: #404040;
    --text-primary: #ffffff;
    --text-secondary: #cccccc;
    --text-muted: #999999;
    --border-color: #404040;
    --border-focus: #0d6efd;
  }
  
  /* High contrast support */
  @media (prefers-contrast: high) {
    .station-selector {
      --border-color: #000000;
      --text-secondary: #000000;
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .station-selector * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* Component root */
  .station-selector {
    position: relative;
    width: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans CJK JP', sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }
  
  /* Input container */
  .input-container {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  /* Search input */
  .search-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: inherit;
    line-height: inherit;
    transition: border-color var(--transition), box-shadow var(--transition);
    outline: none;
  }
  
  /* Input sizing */
  .station-selector[data-size="small"] .search-input {
    padding: 0.25rem 0.5rem;
    font-size: 13px;
  }
  
  .station-selector[data-size="large"] .search-input {
    padding: 0.75rem 1rem;
    font-size: 16px;
  }
  
  /* Input states */
  .search-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
  }
  
  .search-input:disabled {
    background-color: var(--bg-tertiary);
    color: var(--text-muted);
    cursor: not-allowed;
  }
  
  .search-input.loading {
    padding-right: 2.5rem;
  }
  
  .search-input.has-value {
    padding-right: 2rem;
  }
  
  .search-input.has-value.loading {
    padding-right: 4rem;
  }
  
  /* Error state */
  .station-selector.error .search-input {
    border-color: var(--error-color);
  }
  
  .station-selector.error .search-input:focus {
    box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  }
  
  /* Disabled state */
  .station-selector.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  /* Loading spinner */
  .loading-spinner {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--text-muted);
    border-top-color: var(--border-focus);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  /* Clear button */
  .clear-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius);
    transition: color var(--transition);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .clear-button:hover {
    color: var(--text-secondary);
  }
  
  .clear-button:focus {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
  
  .loading-spinner + .clear-button {
    right: 2.25rem;
  }
  
  /* Required indicator */
  .required-indicator {
    position: absolute;
    right: 0.25rem;
    top: 0.25rem;
    color: var(--error-color);
    font-weight: bold;
    pointer-events: none;
  }
  
  /* Error message */
  .error-message {
    margin-top: 0.25rem;
    color: var(--error-color);
    font-size: 12px;
    line-height: 1.4;
  }
  
  /* Dropdown */
  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    max-height: 16rem;
    overflow-y: auto;
    margin-top: 0.25rem;
  }
  
  /* Results section */
  .results-section {
    padding: 0.5rem 0;
  }
  
  .results-section + .results-section {
    border-top: 1px solid var(--border-color);
  }
  
  /* Section header */
  .section-header {
    padding: 0.25rem 0.75rem;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.05em;
  }
  
  /* Dropdown items */
  .dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: none;
    border: none;
    text-align: left;
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color var(--transition);
    gap: 0.5rem;
  }
  
  .dropdown-item:hover,
  .dropdown-item.highlighted {
    background-color: var(--bg-secondary);
  }
  
  .dropdown-item:focus {
    outline: 2px solid var(--border-focus);
    outline-offset: -2px;
  }
  
  /* Station info */
  .station-info {
    flex: 1;
    min-width: 0;
  }
  
  .station-name {
    font-weight: 500;
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .station-kana {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 0.125rem;
  }
  
  .station-prefecture {
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  
  /* History and popular item icons */
  .history-icon,
  .popular-icon {
    flex-shrink: 0;
    color: var(--text-muted);
  }
  
  .history-item {
    font-size: 13px;
  }
  
  .popular-item {
    font-size: 13px;
  }
  
  /* No results */
  .no-results {
    padding: 1rem 0.75rem;
    text-align: center;
  }
  
  .no-results-text {
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  
  .no-results-hint {
    font-size: 12px;
    color: var(--text-muted);
  }
  
  /* Compact variant */
  .station-selector[data-variant="compact"] .dropdown {
    max-height: 12rem;
  }
  
  .station-selector[data-variant="compact"] .dropdown-item {
    padding: 0.375rem 0.75rem;
  }
  
  .station-selector[data-variant="compact"] .section-header {
    display: none;
  }
  
  /* Mobile optimization */
  @media (max-width: 768px) {
    .search-input {
      font-size: 16px; /* Prevent zoom on iOS */
    }
    
    .dropdown {
      max-height: 50vh;
    }
    
    .dropdown-item {
      padding: 0.75rem;
    }
    
    .station-selector[data-size="small"] .search-input {
      font-size: 16px;
    }
  }
</style>