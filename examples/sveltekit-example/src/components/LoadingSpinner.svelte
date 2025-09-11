<!--
  Loading Spinner Component
  
  A reusable loading spinner with multiple sizes and customization options.
  Provides visual feedback during asynchronous operations.
  
  @component LoadingSpinner
  @author Farert SvelteKit Example
  @version 1.0.0
-->

<script lang="ts">
	/**
	 * Size variant for the spinner
	 */
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
	
	/**
	 * Color variant for the spinner
	 */
	export let variant: 'primary' | 'secondary' | 'white' | 'gray' = 'primary';
	
	/**
	 * Additional CSS class names
	 */
	export let className: string = '';
	
	/**
	 * Accessible label for screen readers
	 */
	export let label: string = '読み込み中...';
	
	/**
	 * Whether to show the loading text
	 */
	export let showLabel: boolean = false;
	
	// Export class prop as 'class' attribute
	export { className as class };
	
	// Size configurations
	const sizeClasses = {
		xs: 'w-3 h-3 border',
		sm: 'w-4 h-4 border',
		md: 'w-6 h-6 border-2',
		lg: 'w-8 h-8 border-2',
		xl: 'w-12 h-12 border-4'
	};
	
	// Color configurations
	const colorClasses = {
		primary: 'border-farert-200 border-t-farert-600',
		secondary: 'border-gray-200 border-t-gray-600',
		white: 'border-white/30 border-t-white',
		gray: 'border-gray-300 border-t-gray-700 dark:border-gray-600 dark:border-t-gray-300'
	};
	
	// Reactive computed classes
	$: spinnerClasses = [
		'animate-spin rounded-full',
		sizeClasses[size],
		colorClasses[variant],
		className
	].join(' ');
</script>

<div class="inline-flex items-center space-x-2">
	<div
		class={spinnerClasses}
		role="status"
		aria-label={label}
		aria-live="polite"
	></div>
	
	{#if showLabel}
		<span class="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
			{label}
		</span>
	{/if}
</div>

<!-- Provide screen reader only text if label is not shown -->
{#if !showLabel}
	<span class="sr-only">{label}</span>
{/if}