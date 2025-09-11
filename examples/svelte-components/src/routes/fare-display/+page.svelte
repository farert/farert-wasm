<script lang="ts">
	import { Calculator, TrendingDown, Info, Clock, Copy, ChevronDown, ChevronUp } from 'lucide-svelte';
	
	// Mock fare calculation result
	let fareInfo = {
		fare: 1940,
		distance: 552,
		routeDescription: '東京 → (JR山手線) → 品川 → (JR東海道線) → 横浜',
		companies: ['JR東日本'],
		calculatedAt: new Date(),
		breakdown: [
			{ segment: '東京 → 品川', company: 'JR東日本', distance: 67, fare: 160, line: 'JR山手線' },
			{ segment: '品川 → 横浜', company: 'JR東日本', distance: 485, fare: 1780, line: 'JR東海道線' }
		],
		discounts: [
			{ name: 'IC カード割引', originalFare: 1940, discountedFare: 1940, savings: 0 },
			{ name: 'シニア割引 (65歳以上)', originalFare: 1940, discountedFare: 970, savings: 970 },
			{ name: '障がい者割引', originalFare: 1940, discountedFare: 970, savings: 970 }
		],
		alternativeRoutes: [
			{ description: '東京 → (JR京浜東北線) → 横浜', fare: 1940, time: '約35分', transfers: 0 },
			{ description: '東京 → (JR山手線) → 新橋 → (JR東海道線) → 横浜', fare: 1940, time: '約40分', transfers: 1 },
			{ description: '東京 → (東京メトロ銀座線) → 新橋 → (JR東海道線) → 横浜', fare: 2090, time: '約45分', transfers: 1 }
		]
	};
	
	let showBreakdown = false;
	let showDiscounts = false;
	let showAlternatives = false;
	let selectedDiscount = null;
	
	// Code examples
	const basicUsageCode = `<script>
  import { FareDisplay } from '@farert/svelte-sdk';
  
  let fareInfo = null;
<\/script>

<FareDisplay
  fareInfo={fareInfo}
  showBreakdown={true}
  currency="JPY"
  on:discountSelected={(event) => {
    console.log('Discount selected:', event.detail);
  }}
/>`;

	const advancedUsageCode = `<script>
  import { FareDisplay } from '@farert/svelte-sdk';
  
  let fareInfo = null;
  let showHistory = true;
<\/script>

<FareDisplay
  fareInfo={fareInfo}
  showBreakdown={true}
  showDiscounts={true}
  showAlternatives={true}
  showHistory={showHistory}
  currency="JPY"
  locale="ja-JP"
  on:discountSelected={handleDiscountSelect}
  on:alternativeSelected={handleAlternativeSelect}
  on:historyRequested={handleHistoryRequest}
/>`;

	let copiedCode = '';
	
	function copyCode(code: string, type: string) {
		navigator.clipboard.writeText(code);
		copiedCode = type;
		setTimeout(() => {
			copiedCode = '';
		}, 2000);
	}
	
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('ja-JP', {
			style: 'currency',
			currency: 'JPY'
		}).format(amount);
	}
	
	function selectDiscount(discount: any) {
		selectedDiscount = discount;
		// In real implementation, this would trigger fare recalculation
		alert(`${discount.name}が選択されました。運賃: ${formatCurrency(discount.discountedFare)}`);
	}
	
	function selectAlternative(route: any) {
		alert(`代替ルートが選択されました:\n${route.description}\n運賃: ${formatCurrency(route.fare)}`);
	}
</script>

<svelte:head>
	<title>FareDisplay - Farert Svelte Components</title>
	<meta name="description" content="Comprehensive fare calculation results display with discounts and alternatives for Japanese railway applications" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center space-x-3 mb-4">
			<div class="bg-purple-100 p-2 rounded-lg">
				<Calculator class="w-6 h-6 text-purple-600" />
			</div>
			<h1 class="text-3xl font-bold text-gray-900">FareDisplay</h1>
		</div>
		<p class="text-xl text-gray-600 max-w-3xl">
			Comprehensive fare calculation results display with detailed breakdown, discount options, 
			and alternative route suggestions for Japanese railway applications.
		</p>
	</div>

	<!-- Live Demo Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Interactive Demo</h2>
		
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="max-w-4xl mx-auto space-y-6">
				<!-- Main Fare Display -->
				<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
					<div class="flex items-center justify-between mb-4">
						<div>
							<h3 class="text-2xl font-bold text-gray-900">{formatCurrency(fareInfo.fare)}</h3>
							<p class="text-gray-600">総距離: {fareInfo.distance}km</p>
						</div>
						<div class="text-right">
							<div class="text-sm text-gray-500">計算日時</div>
							<div class="text-sm text-gray-700">{fareInfo.calculatedAt.toLocaleString('ja-JP')}</div>
						</div>
					</div>
					
					<div class="border-t border-blue-200 pt-4">
						<p class="font-medium text-gray-900 mb-2">ルート</p>
						<p class="text-gray-700">{fareInfo.routeDescription}</p>
					</div>
					
					<div class="flex flex-wrap gap-2 mt-3">
						{#each fareInfo.companies as company}
							<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
								{company}
							</span>
						{/each}
					</div>
				</div>

				<!-- Expandable Sections -->
				<div class="space-y-4">
					<!-- Fare Breakdown -->
					<div class="border border-gray-200 rounded-lg overflow-hidden">
						<button
							type="button"
							on:click={() => showBreakdown = !showBreakdown}
							class="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
						>
							<div class="flex items-center space-x-3">
								<Info class="w-5 h-5 text-gray-600" />
								<span class="font-medium text-gray-900">運賃詳細</span>
							</div>
							{#if showBreakdown}
								<ChevronUp class="w-5 h-5 text-gray-600" />
							{:else}
								<ChevronDown class="w-5 h-5 text-gray-600" />
							{/if}
						</button>
						
						{#if showBreakdown}
							<div class="px-6 py-4">
								<div class="overflow-x-auto">
									<table class="w-full">
										<thead>
											<tr class="border-b border-gray-200">
												<th class="text-left py-2 text-sm font-medium text-gray-700">区間</th>
												<th class="text-left py-2 text-sm font-medium text-gray-700">路線</th>
												<th class="text-right py-2 text-sm font-medium text-gray-700">距離</th>
												<th class="text-right py-2 text-sm font-medium text-gray-700">運賃</th>
											</tr>
										</thead>
										<tbody>
											{#each fareInfo.breakdown as item}
												<tr class="border-b border-gray-100">
													<td class="py-3 text-sm text-gray-900">{item.segment}</td>
													<td class="py-3 text-sm text-gray-600">{item.line}</td>
													<td class="py-3 text-sm text-gray-600 text-right">{item.distance}km</td>
													<td class="py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.fare)}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						{/if}
					</div>

					<!-- Discounts -->
					<div class="border border-gray-200 rounded-lg overflow-hidden">
						<button
							type="button"
							on:click={() => showDiscounts = !showDiscounts}
							class="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
						>
							<div class="flex items-center space-x-3">
								<TrendingDown class="w-5 h-5 text-green-600" />
								<span class="font-medium text-gray-900">割引オプション</span>
							</div>
							{#if showDiscounts}
								<ChevronUp class="w-5 h-5 text-gray-600" />
							{:else}
								<ChevronDown class="w-5 h-5 text-gray-600" />
							{/if}
						</button>
						
						{#if showDiscounts}
							<div class="px-6 py-4 space-y-3">
								{#each fareInfo.discounts as discount}
									<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
										on:click={() => selectDiscount(discount)}
										on:keydown={(e) => e.key === 'Enter' && selectDiscount(discount)}
										tabindex="0"
										role="button">
										<div>
											<p class="font-medium text-gray-900">{discount.name}</p>
											{#if discount.savings > 0}
												<p class="text-sm text-green-600">{formatCurrency(discount.savings)} お得</p>
											{:else}
												<p class="text-sm text-gray-500">割引なし</p>
											{/if}
										</div>
										<div class="text-right">
											<p class="font-bold text-lg text-gray-900">{formatCurrency(discount.discountedFare)}</p>
											{#if discount.savings > 0}
												<p class="text-sm text-gray-500 line-through">{formatCurrency(discount.originalFare)}</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Alternative Routes -->
					<div class="border border-gray-200 rounded-lg overflow-hidden">
						<button
							type="button"
							on:click={() => showAlternatives = !showAlternatives}
							class="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
						>
							<div class="flex items-center space-x-3">
								<Clock class="w-5 h-5 text-blue-600" />
								<span class="font-medium text-gray-900">代替ルート</span>
							</div>
							{#if showAlternatives}
								<ChevronUp class="w-5 h-5 text-gray-600" />
							{:else}
								<ChevronDown class="w-5 h-5 text-gray-600" />
							{/if}
						</button>
						
						{#if showAlternatives}
							<div class="px-6 py-4 space-y-3">
								{#each fareInfo.alternativeRoutes as route}
									<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
										on:click={() => selectAlternative(route)}
										on:keydown={(e) => e.key === 'Enter' && selectAlternative(route)}
										tabindex="0"
										role="button">
										<div class="flex-1">
											<p class="font-medium text-gray-900 text-sm">{route.description}</p>
											<div class="flex items-center space-x-4 mt-1">
												<span class="text-xs text-gray-500">{route.time}</span>
												<span class="text-xs text-gray-500">{route.transfers}回乗換</span>
											</div>
										</div>
										<div class="text-right">
											<p class="font-bold text-gray-900">{formatCurrency(route.fare)}</p>
											{#if route.fare !== fareInfo.fare}
												<p class="text-xs text-gray-500">
													{route.fare > fareInfo.fare ? '+' : ''}{formatCurrency(route.fare - fareInfo.fare)}
												</p>
											{:else}
												<p class="text-xs text-green-600">同額</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Usage Examples -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Usage Examples</h2>
		
		<div class="space-y-6">
			<!-- Basic Usage -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900">Basic Usage</h3>
						<button
							type="button"
							on:click={() => copyCode(basicUsageCode, 'basic')}
							class="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
						>
							<Copy class="w-4 h-4" />
							<span>{copiedCode === 'basic' ? 'Copied!' : 'Copy'}</span>
						</button>
					</div>
				</div>
				<div class="p-6">
					<pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto"><code>{basicUsageCode}</code></pre>
				</div>
			</div>
			
			<!-- Advanced Usage -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold text-gray-900">Advanced Usage</h3>
						<button
							type="button"
							on:click={() => copyCode(advancedUsageCode, 'advanced')}
							class="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
						>
							<Copy class="w-4 h-4" />
							<span>{copiedCode === 'advanced' ? 'Copied!' : 'Copy'}</span>
						</button>
					</div>
				</div>
				<div class="p-6">
					<pre class="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto"><code>{advancedUsageCode}</code></pre>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Key Features</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-blue-100 p-2 rounded-lg inline-block mb-4">
					<Calculator class="w-5 h-5 text-blue-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Detailed Breakdown</h3>
				<p class="text-gray-600 text-sm">
					Complete fare calculation breakdown by segment, line, and company.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-green-100 p-2 rounded-lg inline-block mb-4">
					<TrendingDown class="w-5 h-5 text-green-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Discount Options</h3>
				<p class="text-gray-600 text-sm">
					Display available discounts with savings calculations and easy selection.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-purple-100 p-2 rounded-lg inline-block mb-4">
					<Clock class="w-5 h-5 text-purple-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Alternative Routes</h3>
				<p class="text-gray-600 text-sm">
					Show alternative route options with time and cost comparisons.
				</p>
			</div>
		</div>
	</section>

	<!-- API Reference -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">API Reference</h2>
		
		<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
			<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
				<h3 class="text-lg font-semibold text-gray-900">Properties</h3>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
						</tr>
					</thead>
					<tbody class="bg-white divide-y divide-gray-200">
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">fareInfo</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">FareInfo</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">required</td>
							<td class="px-6 py-4 text-sm text-gray-600">Fare calculation result object</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">showBreakdown</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">boolean</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">false</td>
							<td class="px-6 py-4 text-sm text-gray-600">Show detailed fare breakdown section</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">showDiscounts</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">boolean</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">false</td>
							<td class="px-6 py-4 text-sm text-gray-600">Show available discount options</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">showAlternatives</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">boolean</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">false</td>
							<td class="px-6 py-4 text-sm text-gray-600">Show alternative route options</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">currency</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">string</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">"JPY"</td>
							<td class="px-6 py-4 text-sm text-gray-600">Currency format for fare display</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>
</div>