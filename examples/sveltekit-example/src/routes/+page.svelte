<script lang="ts">
	import { onMount } from 'svelte';
	import { Train, MapPin, Calculator, Zap, Code, Database } from 'lucide-svelte';
	import { farertStore, isReady, isLoading, hasError, currentError } from '$lib/stores/farert-store';
	import type { FareCalculationResult, RouteSegment } from '$lib/stores/farert-store';

	// Demo state
	let demoResult: FareCalculationResult | null = null;
	let demoLoading = false;
	let demoError = '';

	// Quick demo route: Tokyo → Yokohama
	const demoRoute: RouteSegment[] = [
		{ stationId: 1130101, stationName: '東京', lineId: 11301, lineName: '東海道線' },
		{ stationId: 1130123, stationName: '横浜' }
	];

	// Features showcase data
	const features = [
		{
			icon: Train,
			title: 'Japanese Railway Data',
			description: 'Complete database of JR and private railway stations, lines, and fare rules',
			stats: '10,000+ stations, 1,000+ lines'
		},
		{
			icon: Zap,
			title: 'WebAssembly Performance',
			description: 'Native C++ performance in the browser with sub-millisecond calculations',
			stats: '< 1ms calculation time'
		},
		{
			icon: Code,
			title: 'TypeScript APIs',
			description: 'Type-safe APIs with comprehensive error handling and caching',
			stats: '39+ WebAssembly APIs'
		},
		{
			icon: Database,
			title: 'Embedded Database',
			description: 'SQLite3 database embedded via MEMFS with zero external dependencies',
			stats: 'Single WASM file'
		}
	];

	// Sample code examples
	const codeExamples = [
		{
			title: 'Basic Fare Calculation',
			language: 'typescript',
			code: `import { farertStore } from '$lib/stores/farert-store';

// Calculate fare from Tokyo to Yokohama
const route = [
  { stationId: 1130101, stationName: '東京' },
  { stationId: 1130123, stationName: '横浜' }
];

const result = await farertStore.calculateFare(route);
console.log(\`Fare: ¥\${result.fareInfo.fare}\`);`
		},
		{
			title: 'Station Search',
			language: 'typescript',
			code: `// Search for stations by name
const stations = await farertStore.searchStations('新宿');

// Get station details
const station = await farertStore.getStationById(1130222);
console.log(station.name); // "新宿"`
		},
		{
			title: 'Svelte Integration',
			language: 'svelte',
			code: `<script>
  import { farertStore, isReady } from '$lib/stores/farert-store';
  
  $: if ($isReady) {
    console.log('SDK ready for use!');
  }
</script>

{#if $isReady}
  <FareCalculator />
{:else}
  <LoadingSpinner />
{/if}`
		}
	];

	async function runDemo() {
		if (!$isReady) return;

		demoLoading = true;
		demoError = '';
		demoResult = null;

		try {
			const startTime = performance.now();
			const result = await farertStore.calculateFare(demoRoute);
			const endTime = performance.now();
			
			demoResult = {
				...result,
				calculationTimeMs: endTime - startTime
			};
		} catch (error) {
			demoError = error instanceof Error ? error.message : String(error);
		} finally {
			demoLoading = false;
		}
	}

	onMount(() => {
		// Auto-run demo when SDK is ready
		const unsubscribe = isReady.subscribe(ready => {
			if (ready && !demoResult && !demoLoading) {
				runDemo();
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>Farert WebAssembly SDK - SvelteKit Example</title>
</svelte:head>

<div class="homepage">
	<!-- Hero Section -->
	<section class="hero">
		<div class="container">
			<div class="hero-content">
				<div class="hero-text">
					<h1 class="hero-title">
						Japanese Railway Fare Calculation
						<span class="hero-highlight">in WebAssembly</span>
					</h1>
					<p class="hero-description">
						Modern TypeScript APIs for Japanese railway fare calculation powered by WebAssembly. 
						Complete JR and private railway data with native C++ performance in the browser.
					</p>
					
					<div class="hero-stats">
						<div class="stat">
							<div class="stat-number">10,000+</div>
							<div class="stat-label">Railway Stations</div>
						</div>
						<div class="stat">
							<div class="stat-number">1,000+</div>
							<div class="stat-label">Railway Lines</div>
						</div>
						<div class="stat">
							<div class="stat-number">&lt; 1ms</div>
							<div class="stat-label">Calculation Time</div>
						</div>
					</div>

					<div class="hero-actions">
						<a href="/stations" class="btn btn-primary">
							<MapPin class="w-4 h-4" />
							Try Station Search
						</a>
						<a href="/routes" class="btn btn-secondary">
							<Train class="w-4 h-4" />
							Plan a Route
						</a>
					</div>
				</div>

				<!-- Live Demo -->
				<div class="demo-panel">
					<div class="demo-header">
						<h3 class="demo-title">
							<Calculator class="w-5 h-5" />
							Live Demo
						</h3>
						<p class="demo-subtitle">Tokyo → Yokohama fare calculation</p>
					</div>

					<div class="demo-content">
						{#if $isLoading}
							<div class="demo-loading">
								<div class="loading-spinner" />
								<span>Loading WebAssembly SDK...</span>
							</div>
						{:else if $hasError}
							<div class="demo-error">
								<p>SDK Error: {$currentError?.message || 'Unknown error'}</p>
								<button class="btn btn-secondary" on:click={() => farertStore.retry()}>
									Retry
								</button>
							</div>
						{:else if demoLoading}
							<div class="demo-loading">
								<div class="loading-spinner" />
								<span>Calculating fare...</span>
							</div>
						{:else if demoError}
							<div class="demo-error">
								<p>Demo Error: {demoError}</p>
								<button class="btn btn-secondary" on:click={runDemo}>
									Try Again
								</button>
							</div>
						{:else if demoResult}
							<div class="demo-result">
								<div class="fare-display">
									<div class="fare-amount">¥{demoResult.fareInfo.fare}</div>
									<div class="fare-label">Total Fare</div>
								</div>
								
								<div class="demo-details">
									<div class="detail-row">
										<span class="detail-label">Calculation Time:</span>
										<span class="detail-value">{demoResult.calculationTimeMs.toFixed(2)}ms</span>
									</div>
									<div class="detail-row">
										<span class="detail-label">Distance:</span>
										<span class="detail-value">{demoResult.fareInfo.distance || 'N/A'}km</span>
									</div>
									<div class="detail-row">
										<span class="detail-label">Route:</span>
										<span class="detail-value">
											{demoRoute.map(r => r.stationName).join(' → ')}
										</span>
									</div>
								</div>

								<button class="btn btn-primary btn-sm" on:click={runDemo}>
									Run Again
								</button>
							</div>
						{:else}
							<div class="demo-placeholder">
								<button class="btn btn-primary" on:click={runDemo} disabled={!$isReady}>
									Calculate Fare
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="features">
		<div class="container">
			<h2 class="section-title">Why Choose Farert WebAssembly SDK?</h2>
			
			<div class="features-grid">
				{#each features as feature}
					<div class="feature-card">
						<div class="feature-icon">
							<svelte:component this={feature.icon} class="w-6 h-6" />
						</div>
						<h3 class="feature-title">{feature.title}</h3>
						<p class="feature-description">{feature.description}</p>
						<div class="feature-stats">{feature.stats}</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Code Examples Section -->
	<section class="code-examples">
		<div class="container">
			<h2 class="section-title">Get Started in Minutes</h2>
			<p class="section-subtitle">
				Simple TypeScript APIs that just work. No complex setup, no external dependencies.
			</p>

			<div class="examples-grid">
				{#each codeExamples as example}
					<div class="example-card">
						<div class="example-header">
							<h3 class="example-title">{example.title}</h3>
							<span class="example-language">{example.language}</span>
						</div>
						<pre class="example-code"><code>{example.code}</code></pre>
					</div>
				{/each}
			</div>

			<div class="examples-actions">
				<a href="/examples" class="btn btn-primary">
					<Code class="w-4 h-4" />
					View All Examples
				</a>
				<a href="/docs" class="btn btn-secondary">
					Read Documentation
				</a>
			</div>
		</div>
	</section>

	<!-- Getting Started Section -->
	<section class="getting-started">
		<div class="container">
			<div class="getting-started-content">
				<h2 class="section-title">Ready to Build?</h2>
				<p class="section-subtitle">
					Explore the complete SvelteKit example and start building your own railway applications.
				</p>

				<div class="getting-started-grid">
					<a href="/stations" class="getting-started-card">
						<MapPin class="w-8 h-8 text-indigo-600" />
						<h3>Station Search</h3>
						<p>Search and explore Japanese railway stations with real-time results.</p>
					</a>

					<a href="/routes" class="getting-started-card">
						<Train class="w-8 h-8 text-indigo-600" />
						<h3>Route Planning</h3>
						<p>Plan complex routes with automatic fare calculation and optimization.</p>
					</a>

					<a href="/examples" class="getting-started-card">
						<Calculator class="w-8 h-8 text-indigo-600" />
						<h3>SDK Examples</h3>
						<p>Interactive examples showcasing advanced SDK features and capabilities.</p>
					</a>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.homepage {
		overflow-x: hidden;
	}

	/* Hero Section */
	.hero {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 4rem 0;
		min-height: 80vh;
		display: flex;
		align-items: center;
	}

	.hero-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
	}

	.hero-title {
		font-size: 3rem;
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 1.5rem;
	}

	.hero-highlight {
		background: linear-gradient(45deg, #ffd700, #ffed4e);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-description {
		font-size: 1.25rem;
		line-height: 1.7;
		margin-bottom: 2rem;
		opacity: 0.95;
	}

	.hero-stats {
		display: flex;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.stat {
		text-align: center;
	}

	.stat-number {
		font-size: 2rem;
		font-weight: 700;
		color: #ffd700;
	}

	.stat-label {
		font-size: 0.875rem;
		opacity: 0.9;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
	}

	/* Demo Panel */
	.demo-panel {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 1.5rem;
	}

	.demo-header {
		margin-bottom: 1.5rem;
	}

	.demo-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.demo-subtitle {
		opacity: 0.8;
		font-size: 0.875rem;
	}

	.demo-content {
		min-height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.demo-loading, .demo-error, .demo-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}

	.demo-result {
		width: 100%;
	}

	.fare-display {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.fare-amount {
		font-size: 2.5rem;
		font-weight: 700;
		color: #ffd700;
	}

	.fare-label {
		opacity: 0.8;
		font-size: 0.875rem;
	}

	.demo-details {
		background: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}

	.detail-row:last-child {
		margin-bottom: 0;
	}

	.detail-label {
		opacity: 0.8;
		font-size: 0.875rem;
	}

	.detail-value {
		font-weight: 500;
		font-size: 0.875rem;
	}

	/* Features Section */
	.features {
		padding: 4rem 0;
		background: #f9fafb;
	}

	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		text-align: center;
		margin-bottom: 3rem;
		color: #1f2937;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
	}

	.feature-card {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		text-align: center;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease-in-out;
	}

	.feature-card:hover {
		transform: translateY(-2px);
	}

	.feature-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: #6366f1;
		color: white;
		border-radius: 50%;
		margin-bottom: 1rem;
	}

	.feature-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #1f2937;
	}

	.feature-description {
		color: #6b7280;
		line-height: 1.6;
		margin-bottom: 1rem;
	}

	.feature-stats {
		font-weight: 600;
		color: #6366f1;
		font-size: 0.875rem;
	}

	/* Code Examples Section */
	.code-examples {
		padding: 4rem 0;
	}

	.section-subtitle {
		text-align: center;
		color: #6b7280;
		font-size: 1.125rem;
		margin-bottom: 3rem;
	}

	.examples-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.example-card {
		background: #1f2937;
		border-radius: 1rem;
		overflow: hidden;
		border: 1px solid #374151;
	}

	.example-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: #374151;
		border-bottom: 1px solid #4b5563;
	}

	.example-title {
		color: white;
		font-size: 1rem;
		font-weight: 600;
	}

	.example-language {
		background: #6366f1;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.example-code {
		padding: 1.5rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #d1d5db;
		overflow-x: auto;
		margin: 0;
	}

	.examples-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	/* Getting Started Section */
	.getting-started {
		padding: 4rem 0;
		background: #f9fafb;
	}

	.getting-started-content {
		text-align: center;
	}

	.getting-started-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		margin-top: 3rem;
	}

	.getting-started-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		text-decoration: none;
		color: inherit;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease-in-out;
	}

	.getting-started-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
	}

	.getting-started-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 1rem 0 0.5rem 0;
		color: #1f2937;
	}

	.getting-started-card p {
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.hero-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.hero-title {
			font-size: 2rem;
		}

		.hero-stats {
			justify-content: center;
		}

		.section-title {
			font-size: 2rem;
		}

		.examples-grid {
			grid-template-columns: 1fr;
		}

		.hero-actions {
			justify-content: center;
		}
	}
</style>