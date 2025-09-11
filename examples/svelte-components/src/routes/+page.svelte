<script lang="ts">
	import { Package, Zap, Code, Globe } from 'lucide-svelte';
	
	const features = [
		{
			icon: Package,
			title: 'Complete Component Library',
			description: 'Pre-built Svelte components for Japanese railway fare calculation with TypeScript support'
		},
		{
			icon: Zap,
			title: 'WebAssembly Performance',
			description: 'Lightning-fast calculations powered by optimized C++ core and WebAssembly technology'
		},
		{
			icon: Code,
			title: 'TypeScript Integration',
			description: 'Full type safety and modern development experience with strict TypeScript support'
		},
		{
			icon: Globe,
			title: 'Production Ready',
			description: 'Battle-tested components used in real-world railway applications across Japan'
		}
	];
	
	const components = [
		{
			name: 'StationSelector',
			description: 'Intelligent station search with autocomplete and prefecture filtering',
			href: '/station-selector',
			features: ['Fuzzy search', 'Kanji/Hiragana support', 'Prefecture filtering', 'Junction detection']
		},
		{
			name: 'RouteBuilder',
			description: 'Drag-and-drop interface for building complex multi-segment routes',
			href: '/route-builder',
			features: ['Visual route building', 'Junction handling', 'Route validation', 'Real-time preview']
		},
		{
			name: 'FareDisplay',
			description: 'Comprehensive fare calculation results with discount options',
			href: '/fare-display',
			features: ['Multiple fare types', 'Discount calculations', 'Route alternatives', 'Detailed breakdown']
		},
		{
			name: 'LoadingSpinner',
			description: 'Customizable loading indicators for async operations',
			href: '/loading-spinner',
			features: ['Multiple styles', 'Size variants', 'Progress indication', 'Accessibility support']
		}
	];
</script>

<svelte:head>
	<title>Farert Svelte Components Showcase</title>
	<meta name="description" content="Interactive showcase of Svelte components for Japanese railway fare calculation using WebAssembly SDK" />
</svelte:head>

<div class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
	<!-- Hero Section -->
	<section class="relative py-20 px-4 sm:px-6 lg:px-8">
		<div class="max-w-7xl mx-auto text-center">
			<div class="bg-indigo-600 p-4 rounded-xl inline-block mb-6">
				<Package class="w-12 h-12 text-white" />
			</div>
			
			<h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
				Farert Svelte Components
			</h1>
			<p class="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
				Modern Svelte components for Japanese railway fare calculation applications,
				powered by WebAssembly and built with TypeScript.
			</p>
			
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
				<a
					href="/station-selector"
					class="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
				>
					Explore Components
				</a>
				<a
					href="/documentation"
					class="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
				>
					View Documentation
				</a>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 px-4 sm:px-6 lg:px-8">
		<div class="max-w-7xl mx-auto">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
				Why Choose Farert Components?
			</h2>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
				{#each features as feature}
					<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
						<div class="bg-indigo-100 p-3 rounded-lg inline-block mb-4">
							<svelte:component this={feature.icon} class="w-6 h-6 text-indigo-600" />
						</div>
						<h3 class="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
						<p class="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Components Preview Section -->
	<section class="py-16 px-4 sm:px-6 lg:px-8 bg-white">
		<div class="max-w-7xl mx-auto">
			<h2 class="text-3xl font-bold text-center text-gray-900 mb-4">
				Component Library
			</h2>
			<p class="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
				Each component is designed for real-world Japanese railway applications with
				comprehensive TypeScript support and WebAssembly integration.
			</p>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				{#each components as component}
					<a
						href={component.href}
						class="block bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-200 group"
					>
						<h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
							{component.name}
						</h3>
						<p class="text-gray-600 mb-4">{component.description}</p>
						
						<div class="space-y-2">
							<h4 class="text-sm font-medium text-gray-700">Key Features:</h4>
							<div class="flex flex-wrap gap-2">
								{#each component.features as feature}
									<span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
										{feature}
									</span>
								{/each}
							</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- Getting Started Section -->
	<section class="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
		<div class="max-w-4xl mx-auto text-center">
			<h2 class="text-3xl font-bold text-gray-900 mb-8">
				Get Started in Minutes
			</h2>
			
			<div class="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
				<div class="text-left">
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Installation</h3>
					<pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto mb-6"><code>npm install @farert/svelte-sdk</code></pre>
					
					<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Usage</h3>
					<pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto"><code>{`<script>
  import { StationSelector, RouteBuilder } from '@farert/svelte-sdk';
</script>

<StationSelector
  on:stationSelected={(event) => {
    console.log('Selected station:', event.detail);
  }}
/>

<RouteBuilder
  on:routeCalculated={(event) => {
    console.log('Calculated fare:', event.detail.fare);
  }}
/>`}</code></pre>
				</div>
			</div>
		</div>
	</section>

	<!-- Technical Details Section -->
	<section class="py-16 px-4 sm:px-6 lg:px-8">
		<div class="max-w-7xl mx-auto">
			<div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
					<div>
						<h2 class="text-3xl font-bold mb-4">Built for Performance</h2>
						<p class="text-indigo-100 mb-6 leading-relaxed">
							Our components leverage WebAssembly for lightning-fast fare calculations,
							providing the same reliability as desktop applications in your web browser.
						</p>
						<div class="space-y-3">
							<div class="flex items-center space-x-3">
								<div class="w-2 h-2 bg-green-400 rounded-full"></div>
								<span class="text-indigo-100">C++ core compiled to WebAssembly</span>
							</div>
							<div class="flex items-center space-x-3">
								<div class="w-2 h-2 bg-green-400 rounded-full"></div>
								<span class="text-indigo-100">TypeScript strict mode enabled</span>
							</div>
							<div class="flex items-center space-x-3">
								<div class="w-2 h-2 bg-green-400 rounded-full"></div>
								<span class="text-indigo-100">Complete JR database embedded</span>
							</div>
						</div>
					</div>
					
					<div class="bg-white/10 backdrop-blur rounded-xl p-6">
						<h3 class="text-xl font-semibold mb-4">Technical Stack</h3>
						<div class="grid grid-cols-2 gap-4 text-sm">
							<div>
								<div class="font-medium text-indigo-200">Frontend</div>
								<div class="text-indigo-100">Svelte 4 + TypeScript</div>
							</div>
							<div>
								<div class="font-medium text-indigo-200">Backend</div>
								<div class="text-indigo-100">C++ + WebAssembly</div>
							</div>
							<div>
								<div class="font-medium text-indigo-200">Database</div>
								<div class="text-indigo-100">SQLite3 + MEMFS</div>
							</div>
							<div>
								<div class="font-medium text-indigo-200">License</div>
								<div class="text-indigo-100">GPL-3.0</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	/* Ensure responsive text scaling */
	@media (max-width: 640px) {
		h1 {
			font-size: 2.5rem;
		}
	}
	
	/* Smooth scrolling for anchor links */
	:global(html) {
		scroll-behavior: smooth;
	}
	
	/* Code syntax highlighting */
	pre code {
		font-family: 'JetBrains Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
	}
	
	/* Grid auto-fit for responsive cards */
	.grid {
		display: grid;
	}
	
	.grid-cols-1 {
		grid-template-columns: repeat(1, minmax(0, 1fr));
	}
	
	@media (min-width: 768px) {
		.md\\:grid-cols-2 {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	
	@media (min-width: 1024px) {
		.lg\\:grid-cols-4 {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
</style>