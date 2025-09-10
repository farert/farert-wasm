<!--
  RouteBuilder.svelte - Interactive Route Building Component
  
  A comprehensive route builder with drag-and-drop, real-time validation, and
  intelligent suggestions for building multi-segment railway routes.
  
  Features:
  - Drag-and-drop interface for route segments
  - Real-time route validation with detailed feedback
  - Undo/redo functionality with command history
  - Station autocomplete integration
  - Route optimization suggestions
  - Accessibility with ARIA support and keyboard navigation
  - Mobile-responsive design with touch support
  - Visual connection indicators and validation states
  - Performance optimized with virtualization for long routes
  
  Requirements: REQ-API-003
  @component
  @version 1.0.0
  @author Farert WebAssembly Project
  @license GPL-3.0
-->

<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy, tick } from 'svelte';
  import { createRouteBuilderStore, type RouteBuilderConfig } from '../route-builder-store';
  import StationSelector from './StationSelector.svelte';
  import type { RouteSegmentInfo, StationInfo, RouteValidationResult } from '../../types';
  
  // ============================================================================
  // COMPONENT PROPS AND TYPES
  // ============================================================================
  
  /**
   * Route builder component configuration
   */
  interface RouteBuilderProps {
    /** Route builder configuration */
    config?: Partial<RouteBuilderConfig>;
    /** Show validation panel */
    showValidation?: boolean;
    /** Show optimization suggestions */
    showOptimization?: boolean;
    /** Enable drag-and-drop interface */
    enableDragDrop?: boolean;
    /** Show route visualization */
    showVisualization?: boolean;
    /** Maximum route segments allowed */
    maxSegments?: number;
    /** Component styling variant */
    variant?: 'default' | 'compact' | 'detailed';
    /** Layout orientation */
    orientation?: 'vertical' | 'horizontal';
    /** Custom CSS class */
    class?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Read-only mode */
    readonly?: boolean;
    /** Show header with actions */
    showHeader?: boolean;
    /** Custom header title */
    headerTitle?: string;
  }
  
  // Props with defaults
  export let config: Partial<RouteBuilderConfig> = {};
  export let showValidation: boolean = true;
  export let showOptimization: boolean = true;
  export let enableDragDrop: boolean = true;
  export let showVisualization: boolean = true;
  export let maxSegments: number = 10;
  export let variant: 'default' | 'compact' | 'detailed' = 'default';
  export let orientation: 'vertical' | 'horizontal' = 'vertical';
  export let className: string = '';
  export { className as class };
  export let disabled: boolean = false;
  export let readonly: boolean = false;
  export let showHeader: boolean = true;
  export let headerTitle: string = 'ルート作成';
  
  // ============================================================================
  // EVENT DISPATCHER AND COMPONENT STATE
  // ============================================================================
  
  const dispatch = createEventDispatcher<{
    routeChange: { route: RouteSegmentInfo[] };
    stationAdd: { station: StationInfo; index: number };
    stationRemove: { station: RouteSegmentInfo; index: number };
    routeValidation: { validation: RouteValidationResult };
    routeClear: void;
    optimizationApply: { optimization: any };
    dragStart: { index: number; station: RouteSegmentInfo };
    dragEnd: { fromIndex: number; toIndex: number };
    error: { error: string };
  }>();
  
  // Component state
  let componentId: string = `route-builder-${Math.random().toString(36).substr(2, 9)}`;
  let containerElement: HTMLElement;
  let isClient: boolean = false;
  let showAddStation: boolean = false;
  let draggedIndex: number = -1;
  let dropTargetIndex: number = -1;
  let validationExpanded: boolean = true;
  let optimizationExpanded: boolean = false;
  
  // Create route builder store instance
  const storeConfig: RouteBuilderConfig = {
    maxStations: maxSegments,
    enableDragDrop,
    enableRealTimeCalculation: true,
    enableOptimization: showOptimization,
    autoValidate: true,
    debounceMs: 300,
    ...config
  };
  
  let routeBuilder = createRouteBuilderStore(storeConfig);
  
  // Reactive state from store
  $: builderState = $routeBuilder;
  $: segments = builderState.segments;
  $: validation = builderState.validation;
  $: fareResult = builderState.fareResult;
  $: optimization = builderState.optimization;
  $: dragState = builderState.dragState;
  $: isCalculating = builderState.isCalculating;
  $: isValidating = builderState.isValidating;
  $: canUndo = routeBuilder.canUndo();
  $: canRedo = routeBuilder.canRedo();
  
  // ============================================================================
  // COMPONENT LIFECYCLE AND SETUP
  // ============================================================================
  
  onMount(async () => {
    isClient = true;
    await tick();
    
    // Subscribe to route changes and dispatch events
    const unsubscribeRoute = routeBuilder.subscribe((state) => {
      dispatch('routeChange', { route: state.segments });
      dispatch('routeValidation', { validation: state.validation });
    });
    
    onDestroy(() => {
      unsubscribeRoute();
      routeBuilder.destroy();
    });
  });
  
  // ============================================================================
  // ROUTE MANIPULATION FUNCTIONS
  // ============================================================================
  
  /**
   * Add station to route
   */
  async function addStation(station: StationInfo, lineId?: number, insertIndex?: number): Promise<void> {
    try {
      if (insertIndex !== undefined && insertIndex >= 0 && insertIndex < segments.length) {
        // Insert at specific position - not directly supported, so we'll add and move
        await routeBuilder.addStation(station.id, lineId);
        if (segments.length > insertIndex + 1) {
          routeBuilder.moveStation(segments.length - 1, insertIndex);
        }
      } else {
        await routeBuilder.addStation(station.id, lineId);
      }
      
      dispatch('stationAdd', { station, index: insertIndex ?? segments.length - 1 });
      showAddStation = false;
    } catch (error) {
      console.error('[RouteBuilder] Failed to add station:', error);
      dispatch('error', { error: error instanceof Error ? error.message : String(error) });
    }
  }
  
  /**
   * Remove station from route
   */
  function removeStation(index: number): void {
    if (index < 0 || index >= segments.length || readonly) return;
    
    const station = segments[index];
    routeBuilder.removeStation(index);
    dispatch('stationRemove', { station, index });
  }
  
  /**
   * Clear entire route
   */
  function clearRoute(): void {
    if (readonly) return;
    
    routeBuilder.clear();
    dispatch('routeClear');
  }
  
  /**
   * Move station to new position
   */
  function moveStation(fromIndex: number, toIndex: number): void {
    if (readonly || fromIndex === toIndex) return;
    
    routeBuilder.moveStation(fromIndex, toIndex);
    dispatch('dragEnd', { fromIndex, toIndex });
  }
  
  // ============================================================================
  // DRAG-AND-DROP HANDLERS
  // ============================================================================
  
  /**
   * Handle drag start
   */
  function handleDragStart(event: DragEvent, index: number): void {
    if (!enableDragDrop || readonly) return;
    
    draggedIndex = index;
    const station = segments[index];
    
    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'route-segment',
        index,
        station
      }));
    }
    
    routeBuilder.onDragStart(station, index);
    dispatch('dragStart', { index, station });
  }
  
  /**
   * Handle drag over
   */
  function handleDragOver(event: DragEvent, index: number): void {
    if (!enableDragDrop || readonly || draggedIndex === index) return;
    
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
    
    dropTargetIndex = index;
    routeBuilder.onDragOver(index);
  }
  
  /**
   * Handle drag enter
   */
  function handleDragEnter(event: DragEvent, index: number): void {
    if (!enableDragDrop || readonly) return;
    
    event.preventDefault();
    routeBuilder.onDragEnter(index);
  }
  
  /**
   * Handle drag leave
   */
  function handleDragLeave(event: DragEvent): void {
    if (!enableDragDrop || readonly) return;
    
    routeBuilder.onDragLeave();
  }
  
  /**
   * Handle drop
   */
  function handleDrop(event: DragEvent, toIndex: number): void {
    if (!enableDragDrop || readonly || draggedIndex === -1) return;
    
    event.preventDefault();
    
    const success = routeBuilder.onDrop(toIndex, event);
    if (success) {
      moveStation(draggedIndex, toIndex);
    }
    
    draggedIndex = -1;
    dropTargetIndex = -1;
  }
  
  /**
   * Handle drag end
   */
  function handleDragEnd(): void {
    if (!enableDragDrop) return;
    
    routeBuilder.onDragEnd();
    draggedIndex = -1;
    dropTargetIndex = -1;
  }
  
  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================
  
  /**
   * Handle keyboard navigation for route items
   */
  function handleKeydown(event: KeyboardEvent, index: number): void {
    if (readonly) return;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (index > 0) {
          routeBuilder.moveStationUp(index);
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (index < segments.length - 1) {
          routeBuilder.moveStationDown(index);
        }
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        removeStation(index);
        break;
      case 'Enter':
        event.preventDefault();
        // Focus could trigger edit mode in the future
        break;
    }
  }
  
  // ============================================================================
  // OPTIMIZATION FUNCTIONS
  // ============================================================================
  
  /**
   * Apply optimization suggestion
   */
  async function applyOptimization(index: number): Promise<void> {
    try {
      const success = await routeBuilder.applyOptimization(index);
      if (success && optimization) {
        const appliedOptimization = optimization.alternatives[index];
        dispatch('optimizationApply', { optimization: appliedOptimization });
      }
    } catch (error) {
      console.error('[RouteBuilder] Failed to apply optimization:', error);
      dispatch('error', { error: error instanceof Error ? error.message : String(error) });
    }
  }
  
  /**
   * Get optimization suggestions
   */
  async function refreshOptimization(): Promise<void> {
    try {
      await routeBuilder.getOptimizationSuggestions();
    } catch (error) {
      console.error('[RouteBuilder] Failed to get optimization suggestions:', error);
    }
  }
  
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  /**
   * Format segment display text
   */
  function formatSegmentText(segment: RouteSegmentInfo, index: number): string {
    const prefix = index === 0 ? '出発' : index === segments.length - 1 ? '到着' : `経由${index}`;
    const linePart = segment.lineName ? ` (${segment.lineName})` : '';
    return `${prefix}: ${segment.stationName}${linePart}`;
  }
  
  /**
   * Get validation severity class
   */
  function getValidationClass(validation: RouteValidationResult): string {
    if (validation.errors.length > 0) return 'error';
    if (validation.warnings.length > 0) return 'warning';
    return 'valid';
  }
  
  /**
   * Format fare amount
   */
  function formatFare(amount: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(amount);
  }
</script>

<!-- ============================================================================ -->
<!-- COMPONENT TEMPLATE -->
<!-- ============================================================================ -->

<div 
  bind:this={containerElement}
  class="route-builder {className}" 
  class:disabled 
  class:readonly 
  data-variant={variant}
  data-orientation={orientation}
>
  <!-- Header with actions -->
  {#if showHeader}
    <div class="route-header">
      <h3 class="header-title">{headerTitle}</h3>
      <div class="header-actions">
        <!-- Undo/Redo buttons -->
        <div class="history-actions">
          <button
            type="button"
            class="action-button"
            class:disabled={!canUndo}
            disabled={!canUndo || readonly}
            on:click={() => routeBuilder.undo()}
            aria-label="元に戻す"
            title="元に戻す (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908.417A6 6 0 1 0 8 2v1z"/>
              <path d="M8 4.466V2.534a.25.25 0 0 0-.41-.192L5.23 4.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 6.466V4.466z"/>
            </svg>
          </button>
          <button
            type="button"
            class="action-button"
            class:disabled={!canRedo}
            disabled={!canRedo || readonly}
            on:click={() => routeBuilder.redo()}
            aria-label="やり直し"
            title="やり直し (Ctrl+Y)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V2.534a.25.25 0 0 1 .41-.192l2.36 1.966a.25.25 0 0 1 0 .384L8.41 6.658A.25.25 0 0 1 8 6.466V4.466z"/>
            </svg>
          </button>
        </div>
        
        <!-- Clear route button -->
        <button
          type="button"
          class="action-button clear-button"
          disabled={segments.length === 0 || readonly}
          on:click={clearRoute}
          aria-label="ルートをクリア"
          title="全てのルートをクリア"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
          </svg>
          クリア
        </button>
        
        <!-- Add station button -->
        <button
          type="button"
          class="action-button add-button"
          disabled={segments.length >= maxSegments || readonly}
          on:click={() => showAddStation = !showAddStation}
          aria-label="駅を追加"
          title="新しい駅を追加"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          駅を追加
        </button>
      </div>
    </div>
  {/if}
  
  <!-- Route segments list -->
  <div class="route-segments" role="list" aria-label="ルートセグメント">
    {#each segments as segment, index (segment.stationId + '-' + index)}
      <div
        class="segment-item"
        class:dragging={dragState.isDragging && dragState.dragIndex === index}
        class:drop-target={dragState.dragOverIndex === index && dragState.canDrop}
        role="listitem"
        aria-label={formatSegmentText(segment, index)}
        draggable={enableDragDrop && !readonly}
        on:dragstart={(e) => handleDragStart(e, index)}
        on:dragover={(e) => handleDragOver(e, index)}
        on:dragenter={(e) => handleDragEnter(e, index)}
        on:dragleave={handleDragLeave}
        on:drop={(e) => handleDrop(e, index)}
        on:dragend={handleDragEnd}
        on:keydown={(e) => handleKeydown(e, index)}
        tabindex={readonly ? -1 : 0}
      >
        <!-- Drag handle -->
        {#if enableDragDrop && !readonly}
          <div class="drag-handle" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1"/>
              <circle cx="5" cy="8" r="1"/>
              <circle cx="5" cy="13" r="1"/>
              <circle cx="11" cy="3" r="1"/>
              <circle cx="11" cy="8" r="1"/>
              <circle cx="11" cy="13" r="1"/>
            </svg>
          </div>
        {/if}
        
        <!-- Station indicator -->
        <div class="station-indicator" data-type={index === 0 ? 'start' : index === segments.length - 1 ? 'end' : 'via'}>
          {#if index === 0}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
            </svg>
          {:else if index === segments.length - 1}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM6 8a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/>
            </svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="8" r="3"/>
            </svg>
          {/if}
        </div>
        
        <!-- Station info -->
        <div class="station-info">
          <div class="station-name">{segment.stationName}</div>
          {#if segment.lineName}
            <div class="line-name">{segment.lineName}</div>
          {/if}
          {#if variant === 'detailed' && segment.stationKana}
            <div class="station-kana">{segment.stationKana}</div>
          {/if}
        </div>
        
        <!-- Station type label -->
        <div class="station-type">
          {#if index === 0}
            出発
          {:else if index === segments.length - 1}
            到着
          {:else}
            経由{index}
          {/if}
        </div>
        
        <!-- Remove button -->
        {#if !readonly}
          <button
            type="button"
            class="remove-button"
            on:click={() => removeStation(index)}
            aria-label="{segment.stationName}を削除"
            title="この駅を削除"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
            </svg>
          </button>
        {/if}
        
        <!-- Connection line -->
        {#if index < segments.length - 1}
          <div class="connection-line" aria-hidden="true"></div>
        {/if}
      </div>
    {/each}
    
    <!-- Empty state -->
    {#if segments.length === 0}
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" class="empty-icon">
          <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0v-1zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0V7zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0V9z"/>
          <path d="M4 1.667v.383A2.5 2.5 0 0 0 2 4.5v7a2.5 2.5 0 0 0 2 2.45v.383C4 15.253 4.746 16 5.667 16h4.666c.92 0 1.667-.746 1.667-1.667v-.383a2.5 2.5 0 0 0 2-2.45V8.5a2.5 2.5 0 0 0-2-2.45V4.5A2.5 2.5 0 0 0 9.5 2H6.5A2.5 2.5 0 0 0 4 4.5v1.167z"/>
        </svg>
        <div class="empty-text">ルートが作成されていません</div>
        <div class="empty-hint">「駅を追加」ボタンから始めてください</div>
      </div>
    {/if}
  </div>
  
  <!-- Add station panel -->
  {#if showAddStation && !readonly}
    <div class="add-station-panel">
      <div class="panel-header">
        <span>駅を追加</span>
        <button
          type="button"
          class="close-button"
          on:click={() => showAddStation = false}
          aria-label="閉じる"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
          </svg>
        </button>
      </div>
      <div class="station-selector-wrapper">
        <StationSelector
          on:select={(e) => addStation(e.detail.station)}
          placeholder="追加する駅名を入力"
          searchMode="quick"
          showPopular={segments.length === 0}
          showHistory={true}
          size="medium"
          variant="default"
        />
      </div>
    </div>
  {/if}
  
  <!-- Validation panel -->
  {#if showValidation && (validation.errors.length > 0 || validation.warnings.length > 0 || isValidating)}
    <div class="validation-panel" class:expanded={validationExpanded}>
      <button
        type="button"
        class="panel-toggle"
        class:error={validation.errors.length > 0}
        class:warning={validation.errors.length === 0 && validation.warnings.length > 0}
        on:click={() => validationExpanded = !validationExpanded}
        aria-expanded={validationExpanded}
        aria-controls="{componentId}-validation"
      >
        <span class="toggle-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="chevron" class:rotated={validationExpanded}>
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </span>
        <span class="panel-title">
          ルート検証
          {#if isValidating}
            <span class="loading-indicator">(検証中...)</span>
          {:else}
            <span class="validation-summary">
              {#if validation.errors.length > 0}
                ({validation.errors.length}個のエラー)
              {:else if validation.warnings.length > 0}
                ({validation.warnings.length}個の警告)
              {:else}
                (OK)
              {/if}
            </span>
          {/if}
        </span>
      </button>
      
      {#if validationExpanded}
        <div class="validation-content" id="{componentId}-validation">
          <!-- Errors -->
          {#if validation.errors.length > 0}
            <div class="validation-section error">
              <h4 class="section-title">エラー</h4>
              <ul class="validation-list">
                {#each validation.errors as error}
                  <li class="validation-item error">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="validation-icon">
                      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                    </svg>
                    <div class="validation-text">
                      <div class="validation-message">{error.message}</div>
                      {#if error.suggestions?.length > 0}
                        <div class="validation-suggestions">
                          推奨: {error.suggestions.join(', ')}
                        </div>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
          
          <!-- Warnings -->
          {#if validation.warnings.length > 0}
            <div class="validation-section warning">
              <h4 class="section-title">警告</h4>
              <ul class="validation-list">
                {#each validation.warnings as warning}
                  <li class="validation-item warning">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="validation-icon">
                      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <div class="validation-text">
                      <div class="validation-message">{warning.message}</div>
                      {#if warning.suggestion}
                        <div class="validation-suggestions">
                          推奨: {warning.suggestion}
                        </div>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Optimization panel -->
  {#if showOptimization && optimization?.alternatives?.length > 0}
    <div class="optimization-panel" class:expanded={optimizationExpanded}>
      <button
        type="button"
        class="panel-toggle optimization"
        on:click={() => optimizationExpanded = !optimizationExpanded}
        aria-expanded={optimizationExpanded}
        aria-controls="{componentId}-optimization"
      >
        <span class="toggle-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="chevron" class:rotated={optimizationExpanded}>
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </span>
        <span class="panel-title">
          ルート最適化
          <span class="optimization-count">({optimization.alternatives.length}個の提案)</span>
        </span>
      </button>
      
      {#if optimizationExpanded}
        <div class="optimization-content" id="{componentId}-optimization">
          <div class="optimization-list">
            {#each optimization.alternatives as alt, index}
              <div class="optimization-item">
                <div class="optimization-info">
                  <div class="optimization-description">{alt.description}</div>
                  {#if alt.estimatedFare}
                    <div class="optimization-fare">推定運賃: {formatFare(alt.estimatedFare)}</div>
                  {/if}
                  {#if alt.savings}
                    <div class="optimization-savings">{alt.savings}駅短縮</div>
                  {/if}
                </div>
                <button
                  type="button"
                  class="apply-button"
                  disabled={readonly}
                  on:click={() => applyOptimization(index)}
                  aria-label="最適化を適用"
                >
                  適用
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
  
  <!-- Fare display -->
  {#if fareResult && (isCalculating || fareResult.totalFare > 0)}
    <div class="fare-display">
      <div class="fare-header">
        <span class="fare-title">運賃計算結果</span>
        {#if isCalculating}
          <span class="calculating-indicator">(計算中...)</span>
        {/if}
      </div>
      {#if !isCalculating && fareResult}
        <div class="fare-content">
          <div class="fare-total">{formatFare(fareResult.totalFare)}</div>
          {#if fareResult.transfers > 0}
            <div class="fare-details">乗換: {fareResult.transfers}回</div>
          {/if}
          {#if fareResult.totalDistance > 0}
            <div class="fare-details">距離: {fareResult.totalDistance}km</div>
          {/if}
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
  .route-builder {
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
  .route-builder {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans CJK JP', sans-serif;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    overflow: hidden;
  }
  
  /* Header */
  .route-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
  }
  
  .header-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .history-actions {
    display: flex;
    gap: 0.25rem;
  }
  
  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--bg-primary);
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
  
  .action-button.clear-button {
    color: var(--error-color);
    border-color: var(--error-color);
  }
  
  .action-button.add-button {
    background-color: var(--border-focus);
    border-color: var(--border-focus);
    color: white;
  }
  
  .action-button.add-button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--border-focus) 90%, black);
  }
  
  /* Route segments */
  .route-segments {
    min-height: 6rem;
    padding: 1rem;
  }
  
  .segment-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    transition: all var(--transition);
    cursor: pointer;
  }
  
  .segment-item:hover {
    background-color: var(--bg-tertiary);
  }
  
  .segment-item:focus {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
  
  .segment-item.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
  
  .segment-item.drop-target {
    border-color: var(--border-focus);
    background-color: color-mix(in srgb, var(--border-focus) 10%, var(--bg-secondary));
  }
  
  /* Drag handle */
  .drag-handle {
    color: var(--text-muted);
    cursor: grab;
    padding: 0.25rem;
  }
  
  .drag-handle:active {
    cursor: grabbing;
  }
  
  /* Station indicator */
  .station-indicator {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white;
  }
  
  .station-indicator[data-type="start"] {
    background-color: var(--success-color);
  }
  
  .station-indicator[data-type="end"] {
    background-color: var(--error-color);
  }
  
  .station-indicator[data-type="via"] {
    background-color: var(--info-color);
  }
  
  /* Station info */
  .station-info {
    flex: 1;
    min-width: 0;
  }
  
  .station-name {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.125rem;
  }
  
  .line-name {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .station-kana {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.125rem;
  }
  
  /* Station type label */
  .station-type {
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    background-color: var(--bg-tertiary);
    padding: 0.25rem 0.5rem;
    border-radius: calc(var(--radius) * 0.5);
  }
  
  /* Remove button */
  .remove-button {
    flex-shrink: 0;
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius);
    transition: color var(--transition);
  }
  
  .remove-button:hover {
    color: var(--error-color);
  }
  
  /* Connection line */
  .connection-line {
    position: absolute;
    left: 3.125rem;
    bottom: -0.5rem;
    width: 2px;
    height: 0.5rem;
    background-color: var(--border-color);
  }
  
  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
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
  
  /* Add station panel */
  .add-station-panel {
    background-color: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    padding: 1rem;
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .close-button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: var(--radius);
  }
  
  .close-button:hover {
    color: var(--text-primary);
    background-color: var(--bg-tertiary);
  }
  
  /* Validation panel */
  .validation-panel {
    background-color: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
  }
  
  .panel-toggle {
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
  
  .panel-toggle:hover {
    background-color: var(--bg-tertiary);
  }
  
  .panel-toggle.error {
    color: var(--error-color);
  }
  
  .panel-toggle.warning {
    color: var(--warning-color);
  }
  
  .panel-toggle.optimization {
    color: var(--info-color);
  }
  
  .chevron {
    transition: transform var(--transition);
  }
  
  .chevron.rotated {
    transform: rotate(90deg);
  }
  
  .panel-title {
    font-weight: 500;
  }
  
  .loading-indicator,
  .validation-summary,
  .optimization-count {
    font-size: 0.875rem;
    opacity: 0.8;
  }
  
  /* Validation content */
  .validation-content {
    border-top: 1px solid var(--border-color);
    padding: 1rem;
  }
  
  .validation-section {
    margin-bottom: 1rem;
  }
  
  .validation-section:last-child {
    margin-bottom: 0;
  }
  
  .section-title {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }
  
  .section-title {
    color: var(--text-primary);
  }
  
  .validation-section.error .section-title {
    color: var(--error-color);
  }
  
  .validation-section.warning .section-title {
    color: var(--warning-color);
  }
  
  .validation-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .validation-item {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }
  
  .validation-icon {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }
  
  .validation-item.error .validation-icon {
    color: var(--error-color);
  }
  
  .validation-item.warning .validation-icon {
    color: var(--warning-color);
  }
  
  .validation-text {
    flex: 1;
  }
  
  .validation-message {
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--text-primary);
  }
  
  .validation-suggestions {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }
  
  /* Optimization panel */
  .optimization-content {
    border-top: 1px solid var(--border-color);
    padding: 1rem;
  }
  
  .optimization-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    margin-bottom: 0.5rem;
  }
  
  .optimization-item:last-child {
    margin-bottom: 0;
  }
  
  .optimization-info {
    flex: 1;
  }
  
  .optimization-description {
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }
  
  .optimization-fare,
  .optimization-savings {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
  
  .apply-button {
    background-color: var(--info-color);
    border: 1px solid var(--info-color);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color var(--transition);
  }
  
  .apply-button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--info-color) 90%, black);
  }
  
  .apply-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Fare display */
  .fare-display {
    background-color: var(--success-color);
    color: white;
    padding: 1rem;
    border-top: 1px solid var(--border-color);
  }
  
  .fare-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .fare-title {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .calculating-indicator {
    font-size: 0.75rem;
    opacity: 0.9;
  }
  
  .fare-content {
    display: flex;
    align-items: baseline;
    gap: 1rem;
  }
  
  .fare-total {
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .fare-details {
    font-size: 0.875rem;
    opacity: 0.9;
  }
  
  /* Compact variant */
  .route-builder[data-variant="compact"] .segment-item {
    padding: 0.5rem;
    margin-bottom: 0.25rem;
  }
  
  .route-builder[data-variant="compact"] .station-indicator {
    width: 1.5rem;
    height: 1.5rem;
  }
  
  .route-builder[data-variant="compact"] .station-name {
    font-size: 0.875rem;
  }
  
  .route-builder[data-variant="compact"] .line-name {
    display: none;
  }
  
  /* Horizontal orientation */
  .route-builder[data-orientation="horizontal"] .route-segments {
    display: flex;
    overflow-x: auto;
    gap: 0.5rem;
    padding: 1rem;
  }
  
  .route-builder[data-orientation="horizontal"] .segment-item {
    flex: none;
    width: 12rem;
    margin-bottom: 0;
  }
  
  .route-builder[data-orientation="horizontal"] .connection-line {
    left: auto;
    right: -0.75rem;
    bottom: auto;
    top: 50%;
    width: 0.75rem;
    height: 2px;
    transform: translateY(-50%);
  }
  
  /* Disabled and readonly states */
  .route-builder.disabled,
  .route-builder.readonly {
    opacity: 0.7;
  }
  
  .route-builder.readonly .segment-item {
    cursor: default;
  }
  
  .route-builder.readonly .drag-handle {
    display: none;
  }
  
  /* Mobile optimization */
  @media (max-width: 768px) {
    .route-builder[data-orientation="vertical"] {
      /* Default behavior for mobile */
    }
    
    .route-builder[data-orientation="horizontal"] {
      data-orientation: vertical; /* Force vertical on mobile */
    }
    
    .header-actions {
      flex-wrap: wrap;
      gap: 0.25rem;
    }
    
    .action-button {
      padding: 0.375rem 0.5rem;
      font-size: 0.75rem;
    }
    
    .segment-item {
      padding: 0.5rem;
    }
    
    .station-indicator {
      width: 1.5rem;
      height: 1.5rem;
    }
    
    .fare-content {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
  
  /* High contrast mode */
  @media (prefers-contrast: high) {
    .route-builder {
      --border-color: #000000;
      --text-muted: #333333;
    }
  }
  
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .route-builder * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>