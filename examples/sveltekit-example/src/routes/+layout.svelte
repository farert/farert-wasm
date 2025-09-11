<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { farertStore } from '$lib/stores/farert-store';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';

	// Initialize the Farert SDK on mount
	onMount(async () => {
		try {
			await farertStore.initialize();
		} catch (error) {
			console.error('Failed to initialize Farert SDK:', error);
		}
	});

	// Reactive statements for page metadata
	$: title = getPageTitle($page.route.id);
	$: description = getPageDescription($page.route.id);

	function getPageTitle(routeId: string | null): string {
		const titles: Record<string, string> = {
			'/': 'Farert WebAssembly SDK - SvelteKit Example',
			'/stations': '駅検索 - Station Search',
			'/routes': 'ルート検索 - Route Planning',
			'/examples': 'SDK Examples',
			'/docs': 'Documentation',
			'/performance': 'Performance Monitoring'
		};
		return titles[routeId || '/'] || 'Farert WebAssembly SDK';
	}

	function getPageDescription(routeId: string | null): string {
		const descriptions: Record<string, string> = {
			'/': 'Comprehensive SvelteKit example demonstrating Japanese railway fare calculation using WebAssembly SDK',
			'/stations': 'Search Japanese railway stations with real-time results and detailed information',
			'/routes': 'Plan railway routes between stations with fare calculations and travel time estimates',
			'/examples': 'Interactive examples showcasing advanced SDK features and capabilities',
			'/docs': 'Complete documentation and tutorials for the Farert WebAssembly SDK',
			'/performance': 'Monitor SDK performance metrics and optimization insights'
		};
		return descriptions[routeId || '/'] || 'Japanese railway fare calculation with WebAssembly';
	}
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<!-- Navigation -->
	<Navigation />
	
	<!-- Main Content Area -->
	<main class="flex-1 relative">
		<ErrorBoundary>
			<!-- Loading Overlay for SDK Initialization -->
			{#if $farertStore.loading}
				<LoadingOverlay message="Initializing Farert WebAssembly SDK..." />
			{/if}
			
			<!-- Page Content -->
			<slot />
		</ErrorBoundary>
	</main>
	
	<!-- Footer -->
	<Footer />
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	
	:global(body) {
		font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
	}
	
	/* Tailwind CSS-inspired utility classes */
	:global(.container) {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}
	
	:global(.btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s ease-in-out;
		cursor: pointer;
		border: none;
		font-size: 0.875rem;
		line-height: 1.25rem;
	}
	
	:global(.btn-primary) {
		background: #6366f1;
		color: white;
	}
	
	:global(.btn-primary:hover) {
		background: #4f46e5;
	}
	
	:global(.btn-secondary) {
		background: #e5e7eb;
		color: #374151;
	}
	
	:global(.btn-secondary:hover) {
		background: #d1d5db;
	}
	
	:global(.card) {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		padding: 1.5rem;
	}
	
	:global(.input) {
		display: block;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		line-height: 1.25rem;
	}
	
	:global(.input:focus) {
		outline: 2px solid #6366f1;
		outline-offset: 2px;
		border-color: #6366f1;
	}
	
	/* Grid utilities */
	:global(.grid) {
		display: grid;
	}
	
	:global(.grid-cols-1) {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	
	:global(.grid-cols-2) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	
	:global(.grid-cols-3) {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	
	:global(.gap-4) {
		gap: 1rem;
	}
	
	:global(.gap-6) {
		gap: 1.5rem;
	}
	
	/* Flexbox utilities */
	:global(.flex) {
		display: flex;
	}
	
	:global(.flex-col) {
		flex-direction: column;
	}
	
	:global(.flex-1) {
		flex: 1 1 0%;
	}
	
	:global(.items-center) {
		align-items: center;
	}
	
	:global(.justify-center) {
		justify-content: center;
	}
	
	:global(.justify-between) {
		justify-content: space-between;
	}
	
	/* Spacing utilities */
	:global(.p-4) {
		padding: 1rem;
	}
	
	:global(.p-6) {
		padding: 1.5rem;
	}
	
	:global(.px-4) {
		padding-left: 1rem;
		padding-right: 1rem;
	}
	
	:global(.py-2) {
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}
	
	:global(.py-4) {
		padding-top: 1rem;
		padding-bottom: 1rem;
	}
	
	:global(.mb-4) {
		margin-bottom: 1rem;
	}
	
	:global(.mb-6) {
		margin-bottom: 1.5rem;
	}
	
	:global(.mt-8) {
		margin-top: 2rem;
	}
	
	/* Text utilities */
	:global(.text-xl) {
		font-size: 1.25rem;
		line-height: 1.75rem;
	}
	
	:global(.text-2xl) {
		font-size: 1.5rem;
		line-height: 2rem;
	}
	
	:global(.text-3xl) {
		font-size: 1.875rem;
		line-height: 2.25rem;
	}
	
	:global(.font-bold) {
		font-weight: 700;
	}
	
	:global(.font-medium) {
		font-weight: 500;
	}
	
	:global(.text-gray-600) {
		color: #4b5563;
	}
	
	:global(.text-gray-800) {
		color: #1f2937;
	}
	
	/* Responsive utilities */
	@media (min-width: 768px) {
		:global(.md\\:grid-cols-2) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		
		:global(.md\\:grid-cols-3) {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	
	@media (min-width: 1024px) {
		:global(.lg\\:grid-cols-3) {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
		
		:global(.lg\\:grid-cols-4) {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>