<!--
  FareDisplay.svelte - Comprehensive Fare Information Display Component
  
  A detailed fare display component with interactive breakdown visualization,
  discount applications, and comprehensive formatting for Japanese railway fares.
  
  Features:
  - Comprehensive fare breakdown with visual representation
  - Interactive discount application and management
  - Multiple fare calculation types and special rules
  - Accessible data visualization with ARIA support
  - Currency formatting with localization
  - Performance optimized rendering with virtualization
  - Responsive design with mobile-friendly layouts
  - Export functionality for fare information
  - Animation and transition effects for better UX
  - Theme support with dark mode compatibility
  
  Requirements: REQ-API-003
  @component
  @version 1.0.0
  @author Farert WebAssembly Project
  @license GPL-3.0
-->

<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import type { RoutePlanResult, UseFareCalculationResult, FareDiscount } from '../../types';
  
  // ============================================================================
  // COMPONENT PROPS AND TYPES
  // ============================================================================
  
  /**
   * Fare display configuration and appearance options
   */
  interface FareDisplayProps {
    /** Fare calculation result to display */
    fareResult?: RoutePlanResult | UseFareCalculationResult | null;
    /** Show detailed fare breakdown */
    showBreakdown?: boolean;
    /** Show discount information */
    showDiscounts?: boolean;
    /** Show route information */
    showRoute?: boolean;
    /** Available discount options */
    availableDiscounts?: FareDiscount[];
    /** Applied discounts */
    appliedDiscounts?: FareDiscount[];
    /** Display format variant */
    format?: 'simple' | 'detailed' | 'summary' | 'compact';
    /** Layout orientation */
    layout?: 'vertical' | 'horizontal' | 'card';
    /** Currency display options */
    currency?: {
      locale?: string;
      currency?: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    };
    /** Loading state */
    loading?: boolean;
    /** Error state and message */
    error?: string | null;
    /** Custom CSS class */
    class?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Show export options */
    showExport?: boolean;
    /** Show animations */
    animate?: boolean;
    /** Color theme */
    theme?: 'default' | 'success' | 'info' | 'warning';
    /** Interactive mode for discount application */
    interactive?: boolean;
  }
  
  // Props with defaults
  export let fareResult: RoutePlanResult | FareCalculationResult | null = null;
  export let showBreakdown: boolean = true;
  export let showDiscounts: boolean = true;
  export let showRoute: boolean = true;
  export let availableDiscounts: FareDiscount[] = [];
  export let appliedDiscounts: FareDiscount[] = [];
  export let format: 'simple' | 'detailed' | 'summary' | 'compact' = 'detailed';
  export let layout: 'vertical' | 'horizontal' | 'card' = 'vertical';
  export let currency = {
    locale: 'ja-JP',
    currency: 'JPY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  };
  export let loading: boolean = false;
  export let error: string | null = null;
  export let className: string = '';
  export { className as class };
  export let disabled: boolean = false;
  export let showExport: boolean = false;
  export let animate: boolean = true;
  export let theme: 'default' | 'success' | 'info' | 'warning' = 'default';
  export let interactive: boolean = false;
  
  // ============================================================================
  // EVENT DISPATCHER AND COMPONENT STATE
  // ============================================================================
  
  const dispatch = createEventDispatcher<{
    discountApply: { discount: FareDiscount };
    discountRemove: { discount: FareDiscount };
    export: { format: 'json' | 'csv' | 'text' };
    refresh: void;
    detailToggle: { section: string; expanded: boolean };
  }>();
  
  // Component state
  let componentId: string = `fare-display-${Math.random().toString(36).substr(2, 9)}`;
  let isClient: boolean = false;
  let breakdownExpanded: boolean = true;
  let discountExpanded: boolean = false;
  let routeExpanded: boolean = false;
  let animationEnabled: boolean = animate;
  
  // Reactive computations
  $: hasResult = !!fareResult && !loading && !error;
  $: totalFare = hasResult ? (fareResult!.totalFare || 0) : 0;
  $: fareBreakdown = hasResult ? (fareResult!.fareBreakdown || []) : [];
  $: routeInfo = hasResult && 'route' in fareResult! ? fareResult!.route : null;
  $: transferCount = hasResult ? (fareResult!.transfers || 0) : 0;
  $: distance = hasResult ? (fareResult!.totalDistance || 0) : 0;
  $: estimatedTime = hasResult ? (fareResult!.totalTime || 0) : 0;
  
  // Discount calculations
  $: totalDiscountAmount = appliedDiscounts.reduce((sum, discount) => sum + (discount.amount || 0), 0);
  $: finalFare = Math.max(0, totalFare - totalDiscountAmount);
  $: discountPercentage = totalFare > 0 ? (totalDiscountAmount / totalFare) * 100 : 0;
  
  // ============================================================================
  // COMPONENT LIFECYCLE
  // ============================================================================
  
  onMount(async () => {
    isClient = true;
    await tick();
  });
  
  // ============================================================================
  // FORMATTING AND UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Format currency amount with localization
   */
  function formatCurrency(amount: number, options?: Partial<typeof currency>): string {
    const opts = { ...currency, ...options };
    try {
      return new Intl.NumberFormat(opts.locale, {
        style: 'currency',
        currency: opts.currency,
        minimumFractionDigits: opts.minimumFractionDigits,
        maximumFractionDigits: opts.maximumFractionDigits
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `¥${amount.toLocaleString('ja-JP')}`;
    }
  }
  
  /**
   * Format distance with appropriate units
   */
  function formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }
  
  /**
   * Format time duration
   */
  function formatTime(minutes: number): string {
    if (minutes < 60) {
      return `${Math.round(minutes)}分`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}時間${mins > 0 ? mins + '分' : ''}`;
  }
  
  /**
   * Get breakdown item color based on type
   */
  function getBreakdownColor(type: string): string {
    switch (type) {
      case 'base': return 'var(--info-color)';
      case 'tax': return 'var(--warning-color)';
      case 'discount': return 'var(--success-color)';
      case 'surcharge': return 'var(--error-color)';
      default: return 'var(--text-secondary)';
    }
  }
  
  /**
   * Get breakdown item icon
   */
  function getBreakdownIcon(type: string): string {
    switch (type) {
      case 'base': return 'M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z';
      case 'tax': return 'M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z';
      case 'discount': return 'M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z';
      case 'surcharge': return 'M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z';
      default: return 'M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z';
    }
  }
  
  // ============================================================================
  // DISCOUNT MANAGEMENT
  // ============================================================================
  
  /**
   * Apply a discount
   */
  function applyDiscount(discount: FareDiscount): void {
    if (!interactive || disabled) return;
    
    // Check if discount is already applied
    if (appliedDiscounts.some(d => d.id === discount.id)) {
      return;
    }
    
    dispatch('discountApply', { discount });
  }
  
  /**
   * Remove a discount
   */
  function removeDiscount(discount: FareDiscount): void {
    if (!interactive || disabled) return;
    
    dispatch('discountRemove', { discount });
  }
  
  /**
   * Check if discount is applicable
   */
  function isDiscountApplicable(discount: FareDiscount): boolean {
    if (!fareResult) return false;
    
    // Check minimum fare requirement
    if (discount.minimumFare && totalFare < discount.minimumFare) {
      return false;
    }
    
    // Check maximum fare requirement
    if (discount.maximumFare && totalFare > discount.maximumFare) {
      return false;
    }
    
    // Check if already applied
    return !appliedDiscounts.some(d => d.id === discount.id);
  }
  
  // ============================================================================
  // EXPORT FUNCTIONS
  // ============================================================================
  
  /**
   * Export fare information in specified format
   */
  function exportData(format: 'json' | 'csv' | 'text'): void {
    if (!fareResult) return;
    
    dispatch('export', { format });
  }
  
  /**
   * Generate export data
   */
  function generateExportData(format: 'json' | 'csv' | 'text'): string {
    if (!fareResult) return '';
    
    const data = {
      totalFare,
      finalFare,
      appliedDiscounts: appliedDiscounts.map(d => ({ name: d.name, amount: d.amount })),
      breakdown: fareBreakdown.map(b => ({ description: b.description, amount: b.amount, type: b.type })),
      transferCount,
      distance,
      estimatedTime,
      timestamp: new Date().toISOString()
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        const headers = ['項目', '金額', '種別'];
        const rows = fareBreakdown.map(b => [b.description, b.amount, b.type]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      case 'text':
        return `運賃計算結果
総額: ${formatCurrency(totalFare)}
割引後: ${formatCurrency(finalFare)}
乗換: ${transferCount}回
距離: ${formatDistance(distance)}
時間: ${formatTime(estimatedTime)}

内訳:
${fareBreakdown.map(b => `- ${b.description}: ${formatCurrency(b.amount)}`).join('\n')}

適用割引:
${appliedDiscounts.map(d => `- ${d.name}: -${formatCurrency(d.amount || 0)}`).join('\n')}`;
      default:
        return '';
    }
  }
  
  // ============================================================================
  // UI INTERACTION HANDLERS
  // ============================================================================
  
  /**
   * Toggle section expansion
   */
  function toggleSection(section: 'breakdown' | 'discount' | 'route'): void {
    switch (section) {
      case 'breakdown':
        breakdownExpanded = !breakdownExpanded;
        break;
      case 'discount':
        discountExpanded = !discountExpanded;
        break;
      case 'route':
        routeExpanded = !routeExpanded;
        break;
    }
    
    dispatch('detailToggle', { section, expanded: 
      section === 'breakdown' ? breakdownExpanded :
      section === 'discount' ? discountExpanded :
      routeExpanded 
    });
  }
  
  /**
   * Refresh fare calculation
   */
  function refreshFare(): void {
    dispatch('refresh');
  }
</script>

<!-- ============================================================================ -->
<!-- COMPONENT TEMPLATE -->
<!-- ============================================================================ -->

<div 
  class="fare-display {className}" 
  class:loading 
  class:disabled 
  class:has-error={!!error}
  data-format={format}
  data-layout={layout}
  data-theme={theme}
>
  <!-- Loading state -->
  {#if loading}
    <div class="loading-container">
      <div class="loading-spinner" aria-hidden="true">
        <div class="spinner"></div>
      </div>
      <div class="loading-text">運賃を計算中...</div>
    </div>
  {/if}
  
  <!-- Error state -->
  {#if error}
    <div class="error-container" role="alert">
      <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" class="error-icon">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
      </svg>
      <div class="error-content">
        <div class="error-title">運賃計算エラー</div>
        <div class="error-message">{error}</div>
        <button type="button" class="retry-button" on:click={refreshFare}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
            <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
          </svg>
          再試行
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Main content -->
  {#if hasResult}
    <div class="fare-content">
      <!-- Header with total fare -->
      <div class="fare-header">
        <div class="total-fare-container">
          <div class="fare-label">
            {#if appliedDiscounts.length > 0}
              割引適用後運賃
            {:else}
              総運賃
            {/if}
          </div>
          <div 
            class="total-fare" 
            class:discounted={appliedDiscounts.length > 0}
            class:animate={animationEnabled}
          >
            {formatCurrency(finalFare)}
          </div>
          {#if appliedDiscounts.length > 0}
            <div class="original-fare">
              <span class="fare-strikethrough">{formatCurrency(totalFare)}</span>
              <span class="discount-amount">(-{formatCurrency(totalDiscountAmount)})</span>
            </div>
          {/if}
        </div>
        
        <!-- Actions -->
        <div class="fare-actions">
          {#if showExport}
            <div class="export-menu">
              <button type="button" class="action-button" disabled={disabled}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
                エクスポート
              </button>
            </div>
          {/if}
          
          <button 
            type="button" 
            class="action-button refresh-button"
            on:click={refreshFare}
            disabled={disabled}
            aria-label="運賃を再計算"
            title="運賃を再計算"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
              <path fill-rule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Quick stats -->
      {#if format !== 'compact'}
        <div class="fare-stats">
          {#if transferCount > 0}
            <div class="stat-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="stat-icon">
                <path d="M7 14s-3-2-3-5 3-5 3-5 3 2 3 5-3 5-3 5z"/>
                <path d="M7 14s-3-2-3-5 3-5 3-5 3 2 3 5-3 5-3 5zM9 14s3-2 3-5-3-5-3-5-3 2-3 5 3 5 3 5z"/>
              </svg>
              <span class="stat-value">{transferCount}</span>
              <span class="stat-label">回乗換</span>
            </div>
          {/if}
          
          {#if distance > 0}
            <div class="stat-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="stat-icon">
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
              </svg>
              <span class="stat-value">{formatDistance(distance)}</span>
              <span class="stat-label">距離</span>
            </div>
          {/if}
          
          {#if estimatedTime > 0}
            <div class="stat-item">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="stat-icon">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
              </svg>
              <span class="stat-value">{formatTime(estimatedTime)}</span>
              <span class="stat-label">所要時間</span>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Fare breakdown -->
      {#if showBreakdown && fareBreakdown.length > 0}
        <div class="breakdown-section">
          <button
            type="button"
            class="section-header"
            on:click={() => toggleSection('breakdown')}
            aria-expanded={breakdownExpanded}
            aria-controls="{componentId}-breakdown"
          >
            <span class="header-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="chevron" class:rotated={breakdownExpanded}>
                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </span>
            <span class="header-title">運賃内訳</span>
            <span class="header-count">({fareBreakdown.length}項目)</span>
          </button>
          
          {#if breakdownExpanded}
            <div class="breakdown-content" id="{componentId}-breakdown">
              <div class="breakdown-list">
                {#each fareBreakdown as item, index (item.description + index)}
                  <div 
                    class="breakdown-item" 
                    class:animate={animationEnabled}
                    style="animation-delay: {index * 0.1}s"
                  >
                    <div class="item-info">
                      <div class="item-icon" style="color: {getBreakdownColor(item.type)}">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d={getBreakdownIcon(item.type)}/>
                        </svg>
                      </div>
                      <div class="item-details">
                        <div class="item-description">{item.description}</div>
                        <div class="item-type">{item.type === 'base' ? '基本運賃' : item.type === 'tax' ? '税込' : item.type === 'discount' ? '割引' : item.type === 'surcharge' ? '追加料金' : '他'}</div>
                      </div>
                    </div>
                    <div class="item-amount" style="color: {getBreakdownColor(item.type)}">
                      {#if item.type === 'discount'}
                        -{formatCurrency(Math.abs(item.amount))}
                      {:else}
                        {formatCurrency(item.amount)}
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
              
              <!-- Breakdown visualization -->
              {#if format === 'detailed'}
                <div class="breakdown-chart" aria-hidden="true">
                  <div class="chart-container">
                    {#each fareBreakdown as item, index}
                      {@const percentage = totalFare > 0 ? (Math.abs(item.amount) / totalFare) * 100 : 0}
                      <div 
                        class="chart-segment"
                        style="width: {percentage}%; background-color: {getBreakdownColor(item.type)}; opacity: 0.7"
                        title="{item.description}: {formatCurrency(item.amount)}"
                      ></div>
                    {/each}
                  </div>
                  <div class="chart-legend">
                    {#each fareBreakdown as item}
                      <div class="legend-item">
                        <div class="legend-color" style="background-color: {getBreakdownColor(item.type)}"></div>
                        <span class="legend-label">{item.description}</span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Discount management -->
      {#if showDiscounts && (availableDiscounts.length > 0 || appliedDiscounts.length > 0)}
        <div class="discount-section">
          <button
            type="button"
            class="section-header"
            on:click={() => toggleSection('discount')}
            aria-expanded={discountExpanded}
            aria-controls="{componentId}-discount"
          >
            <span class="header-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="chevron" class:rotated={discountExpanded}>
                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </span>
            <span class="header-title">割引・特典</span>
            <span class="header-count">
              {#if appliedDiscounts.length > 0}
                ({appliedDiscounts.length}件適用中)
              {:else}
                ({availableDiscounts.length}件利用可能)
              {/if}
            </span>
          </button>
          
          {#if discountExpanded}
            <div class="discount-content" id="{componentId}-discount">
              <!-- Applied discounts -->
              {#if appliedDiscounts.length > 0}
                <div class="applied-discounts">
                  <h4 class="discount-subtitle">適用中の割引</h4>
                  <div class="discount-list">
                    {#each appliedDiscounts as discount}
                      <div class="discount-item applied">
                        <div class="discount-info">
                          <div class="discount-name">{discount.name}</div>
                          <div class="discount-description">{discount.description || ''}</div>
                          <div class="discount-amount">-{formatCurrency(discount.amount || 0)}</div>
                        </div>
                        {#if interactive && !disabled}
                          <button
                            type="button"
                            class="discount-remove"
                            on:click={() => removeDiscount(discount)}
                            aria-label="{discount.name}を削除"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                            </svg>
                          </button>
                        {/if}
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- Available discounts -->
              {#if interactive && availableDiscounts.length > 0}
                <div class="available-discounts">
                  <h4 class="discount-subtitle">利用可能な割引</h4>
                  <div class="discount-list">
                    {#each availableDiscounts as discount}
                      {@const applicable = isDiscountApplicable(discount)}
                      <div class="discount-item available" class:disabled={!applicable}>
                        <div class="discount-info">
                          <div class="discount-name">{discount.name}</div>
                          <div class="discount-description">{discount.description || ''}</div>
                          <div class="discount-amount">-{formatCurrency(discount.amount || 0)}</div>
                          {#if !applicable}
                            <div class="discount-reason">条件を満たしていません</div>
                          {/if}
                        </div>
                        <button
                          type="button"
                          class="discount-apply"
                          disabled={!applicable || disabled}
                          on:click={() => applyDiscount(discount)}
                          aria-label="{discount.name}を適用"
                        >
                          適用
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
              
              <!-- Discount summary -->
              {#if appliedDiscounts.length > 0}
                <div class="discount-summary">
                  <div class="summary-line">
                    <span class="summary-label">割引合計:</span>
                    <span class="summary-value discount-color">-{formatCurrency(totalDiscountAmount)}</span>
                  </div>
                  <div class="summary-line">
                    <span class="summary-label">割引率:</span>
                    <span class="summary-value">{discountPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Route information -->
      {#if showRoute && routeInfo && routeInfo.length > 0}
        <div class="route-section">
          <button
            type="button"
            class="section-header"
            on:click={() => toggleSection('route')}
            aria-expanded={routeExpanded}
            aria-controls="{componentId}-route"
          >
            <span class="header-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="chevron" class:rotated={routeExpanded}>
                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </span>
            <span class="header-title">ルート詳細</span>
            <span class="header-count">({routeInfo.length}駅)</span>
          </button>
          
          {#if routeExpanded}
            <div class="route-content" id="{componentId}-route">
              <div class="route-list">
                {#each routeInfo as segment, index}
                  <div class="route-item" class:animate={animationEnabled} style="animation-delay: {index * 0.05}s">
                    <div class="route-indicator" data-type={index === 0 ? 'start' : index === routeInfo.length - 1 ? 'end' : 'via'}>
                      <div class="indicator-dot"></div>
                      {#if index < routeInfo.length - 1}
                        <div class="indicator-line"></div>
                      {/if}
                    </div>
                    <div class="route-station">
                      <div class="station-name">{segment.stationName}</div>
                      {#if segment.lineName}
                        <div class="line-name">{segment.lineName}</div>
                      {/if}
                      {#if segment.stationKana}
                        <div class="station-kana">{segment.stationKana}</div>
                      {/if}
                    </div>
                    <div class="route-type">
                      {index === 0 ? '出発' : index === routeInfo.length - 1 ? '到着' : `経由${index}`}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Empty state -->
  {#if !hasResult && !loading && !error}
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" class="empty-icon">
        <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
        <path fill-rule="evenodd" d="M13.5 5a.5.5 0 0 1 .5.5V7h1.5a.5.5 0 0 1 0 1H14v1.5a.5.5 0 0 1-1 0V8h-1.5a.5.5 0 0 1 0-1H13V5.5a.5.5 0 0 1 .5-.5z"/>
      </svg>
      <div class="empty-text">運賃情報がありません</div>
      <div class="empty-hint">ルートを作成して運賃を計算してください</div>
    </div>
  {/if}
</div>

<!-- ============================================================================ -->
<!-- COMPONENT STYLES -->
<!-- ============================================================================ -->

<style>
  /* CSS Custom Properties for theming */
  .fare-display {
    --bg-primary: var(--farert-bg-primary, #ffffff);
    --bg-secondary: var(--farert-bg-secondary, #f8f9fa);
    --bg-tertiary: var(--farert-bg-tertiary, #e9ecef);
    --text-primary: var(--farert-text-primary, #212529);
    --text-secondary: var(--farert-text-secondary, #6c757d);
    --text-muted: var(--farert-text-muted, #adb5bd);
    --border-color: var(--farert-border-color, #dee2e6);
    --border-focus: var(--farert-border-focus, #0d6efd);
    --success-color: var(--farert-success-color, #198754);
    --warning-color: var(--farert-warning-color, #fd7e14);
    --error-color: var(--farert-error-color, #dc3545);
    --info-color: var(--farert-info-color, #0dcaf0);
    --shadow: var(--farert-shadow, 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075));
    --shadow-lg: var(--farert-shadow-lg, 0 0.5rem 1rem rgba(0, 0, 0, 0.15));
    --radius: var(--farert-radius, 0.375rem);
    --transition: var(--farert-transition, 0.15s ease-in-out);
  }
  
  /* Component root */
  .fare-display {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans CJK JP', sans-serif;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    overflow: hidden;
    position: relative;
  }
  
  /* Theme variants */
  .fare-display[data-theme="success"] {
    border-color: var(--success-color);
    background-color: color-mix(in srgb, var(--success-color) 5%, var(--bg-primary));
  }
  
  .fare-display[data-theme="info"] {
    border-color: var(--info-color);
    background-color: color-mix(in srgb, var(--info-color) 5%, var(--bg-primary));
  }
  
  .fare-display[data-theme="warning"] {
    border-color: var(--warning-color);
    background-color: color-mix(in srgb, var(--warning-color) 5%, var(--bg-primary));
  }
  
  /* Loading state */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
  }
  
  .loading-spinner {
    margin-bottom: 1rem;
  }
  
  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--text-muted);
    border-top-color: var(--border-focus);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loading-text {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  /* Error state */
  .error-container {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1.5rem;
    background-color: color-mix(in srgb, var(--error-color) 10%, var(--bg-primary));
    border: 1px solid var(--error-color);
    color: var(--error-color);
  }
  
  .error-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  
  .error-content {
    flex: 1;
  }
  
  .error-title {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .error-message {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
  }
  
  .retry-button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--error-color);
    border: none;
    border-radius: var(--radius);
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color var(--transition);
  }
  
  .retry-button:hover {
    background-color: color-mix(in srgb, var(--error-color) 90%, black);
  }
  
  /* Fare content */
  .fare-content {
    padding: 1.5rem;
  }
  
  /* Fare header */
  .fare-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
  }
  
  .total-fare-container {
    flex: 1;
  }
  
  .fare-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  
  .total-fare {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.2;
    transition: all var(--transition);
  }
  
  .total-fare.discounted {
    color: var(--success-color);
  }
  
  .total-fare.animate {
    animation: fareUpdate 0.5s ease-out;
  }
  
  @keyframes fareUpdate {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
  
  .original-fare {
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .fare-strikethrough {
    text-decoration: line-through;
    color: var(--text-muted);
  }
  
  .discount-amount {
    color: var(--success-color);
    font-weight: 500;
  }
  
  /* Fare actions */
  .fare-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all var(--transition);
  }
  
  .action-button:hover:not(:disabled) {
    background-color: var(--bg-tertiary);
    border-color: var(--text-secondary);
  }
  
  .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Quick stats */
  .fare-stats {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: var(--bg-secondary);
    border-radius: var(--radius);
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .stat-icon {
    color: var(--text-muted);
  }
  
  .stat-value {
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  /* Section styling */
  .breakdown-section,
  .discount-section,
  .route-section {
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
  }
  
  .section-header {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background-color var(--transition);
    gap: 0.5rem;
  }
  
  .section-header:hover {
    background-color: var(--bg-secondary);
  }
  
  .header-icon {
    flex-shrink: 0;
  }
  
  .chevron {
    transition: transform var(--transition);
  }
  
  .chevron.rotated {
    transform: rotate(90deg);
  }
  
  .header-title {
    flex: 1;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .header-count {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  /* Breakdown styles */
  .breakdown-content {
    border-top: 1px solid var(--border-color);
    padding: 1rem;
  }
  
  .breakdown-list {
    margin-bottom: 1rem;
  }
  
  .breakdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--bg-tertiary);
  }
  
  .breakdown-item:last-child {
    border-bottom: none;
  }
  
  .breakdown-item.animate {
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-1rem);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .item-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .item-icon {
    flex-shrink: 0;
    padding: 0.375rem;
    background-color: var(--bg-secondary);
    border-radius: 50%;
  }
  
  .item-details {
    flex: 1;
  }
  
  .item-description {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.125rem;
  }
  
  .item-type {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  .item-amount {
    font-size: 1.125rem;
    font-weight: 600;
    text-align: right;
  }
  
  /* Breakdown chart */
  .breakdown-chart {
    margin-top: 1rem;
  }
  
  .chart-container {
    display: flex;
    height: 0.75rem;
    border-radius: calc(var(--radius) * 0.5);
    overflow: hidden;
    margin-bottom: 0.75rem;
  }
  
  .chart-segment {
    flex: none;
    transition: opacity var(--transition);
  }
  
  .chart-segment:hover {
    opacity: 1 !important;
  }
  
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
  }
  
  .legend-color {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 2px;
    flex-shrink: 0;
  }
  
  .legend-label {
    color: var(--text-secondary);
  }
  
  /* Discount styles */
  .discount-content {
    border-top: 1px solid var(--border-color);
    padding: 1rem;
  }
  
  .discount-subtitle {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.75rem 0;
  }
  
  .discount-list {
    margin-bottom: 1rem;
  }
  
  .discount-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    margin-bottom: 0.5rem;
  }
  
  .discount-item:last-child {
    margin-bottom: 0;
  }
  
  .discount-item.applied {
    background-color: color-mix(in srgb, var(--success-color) 10%, var(--bg-secondary));
    border-color: var(--success-color);
  }
  
  .discount-item.disabled {
    opacity: 0.6;
  }
  
  .discount-info {
    flex: 1;
  }
  
  .discount-name {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }
  
  .discount-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
  }
  
  .discount-amount {
    font-weight: 600;
    color: var(--success-color);
  }
  
  .discount-reason {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-style: italic;
  }
  
  .discount-apply,
  .discount-remove {
    padding: 0.375rem 0.75rem;
    border: none;
    border-radius: var(--radius);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color var(--transition);
  }
  
  .discount-apply {
    background-color: var(--info-color);
    color: white;
  }
  
  .discount-apply:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--info-color) 90%, black);
  }
  
  .discount-remove {
    background-color: var(--error-color);
    color: white;
  }
  
  .discount-remove:hover {
    background-color: color-mix(in srgb, var(--error-color) 90%, black);
  }
  
  .discount-apply:disabled {
    background-color: var(--text-muted);
    cursor: not-allowed;
  }
  
  /* Discount summary */
  .discount-summary {
    padding: 0.75rem;
    background-color: var(--bg-tertiary);
    border-radius: var(--radius);
    margin-top: 0.75rem;
  }
  
  .summary-line {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }
  
  .summary-line:last-child {
    margin-bottom: 0;
  }
  
  .summary-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .summary-value {
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .summary-value.discount-color {
    color: var(--success-color);
  }
  
  /* Route styles */
  .route-content {
    border-top: 1px solid var(--border-color);
    padding: 1rem;
  }
  
  .route-list {
    position: relative;
  }
  
  .route-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    position: relative;
  }
  
  .route-item.animate {
    animation: fadeInUp 0.3s ease-out;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .route-indicator {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 1;
  }
  
  .indicator-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background-color: var(--info-color);
    border: 2px solid var(--bg-primary);
  }
  
  .route-indicator[data-type="start"] .indicator-dot {
    background-color: var(--success-color);
  }
  
  .route-indicator[data-type="end"] .indicator-dot {
    background-color: var(--error-color);
  }
  
  .indicator-line {
    width: 2px;
    height: 2rem;
    background-color: var(--border-color);
    margin-top: 0.25rem;
  }
  
  .route-station {
    flex: 1;
  }
  
  .station-name {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.125rem;
  }
  
  .line-name {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.125rem;
  }
  
  .station-kana {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  .route-type {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    background-color: var(--bg-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: calc(var(--radius) * 0.5);
  }
  
  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
    color: var(--text-muted);
  }
  
  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  .empty-text {
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  .empty-hint {
    font-size: 0.875rem;
  }
  
  /* Layout variants */
  .fare-display[data-layout="horizontal"] {
    /* TODO: Implement horizontal layout */
  }
  
  .fare-display[data-layout="card"] {
    box-shadow: var(--shadow-lg);
    border-radius: calc(var(--radius) * 1.5);
  }
  
  /* Format variants */
  .fare-display[data-format="compact"] .fare-content {
    padding: 1rem;
  }
  
  .fare-display[data-format="compact"] .fare-header {
    margin-bottom: 1rem;
  }
  
  .fare-display[data-format="compact"] .total-fare {
    font-size: 1.5rem;
  }
  
  .fare-display[data-format="compact"] .fare-stats {
    display: none;
  }
  
  .fare-display[data-format="simple"] .breakdown-chart {
    display: none;
  }
  
  /* Disabled state */
  .fare-display.disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  /* Mobile optimization */
  @media (max-width: 768px) {
    .fare-header {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .fare-actions {
      align-self: stretch;
    }
    
    .fare-stats {
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .total-fare {
      font-size: 1.75rem;
    }
    
    .breakdown-item,
    .discount-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .item-amount {
      align-self: flex-end;
    }
    
    .chart-legend {
      flex-direction: column;
      gap: 0.5rem;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .fare-display * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .fare-display {
      --border-color: #000000;
      --text-muted: #333333;
    }
  }
</style>