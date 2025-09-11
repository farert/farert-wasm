<!--
  Performance Monitor Component
  
  Placeholder performance monitor component for development.
  
  @component PerformanceMonitor
  @author Farert SvelteKit Example
  @version 1.0.0
-->

<script lang="ts">
	export let data = null;
</script>

{#if import.meta.env.DEV}
	<div class="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
		Performance Monitor
		{#if data}
			<div>Load: {data.loadTime}ms</div>
		{/if}
	</div>
{/if}