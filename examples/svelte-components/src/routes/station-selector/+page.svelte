<script lang="ts">
	import { Search, MapPin, Info, Code2, Copy } from 'lucide-svelte';
	import { onMount } from 'svelte';
	
	// Mock data for demonstration - in real implementation this would come from the WebAssembly SDK
	let searchQuery = '';
	let selectedStation: any = null;
	let searchResults: any[] = [];
	let showResults = false;
	let isLoading = false;
	
	// Demo station data
	const mockStations = [
		{ id: 1001, name: '東京', kana: 'とうきょう', prefecture: '東京都', lines: ['JR山手線', 'JR東海道線', 'JR中央線'] },
		{ id: 1002, name: '新宿', kana: 'しんじゅく', prefecture: '東京都', lines: ['JR山手線', 'JR中央線', 'JR総武線'] },
		{ id: 1003, name: '横浜', kana: 'よこはま', prefecture: '神奈川県', lines: ['JR東海道線', 'JR京浜東北線'] },
		{ id: 1004, name: '大阪', kana: 'おおさか', prefecture: '大阪府', lines: ['JR東海道線', 'JR大阪環状線'] },
		{ id: 1005, name: '名古屋', kana: 'なごや', prefecture: '愛知県', lines: ['JR東海道線', 'JR中央線'] },
		{ id: 1006, name: '京都', kana: 'きょうと', prefecture: '京都府', lines: ['JR東海道線', 'JR奈良線'] },
		{ id: 1007, name: '品川', kana: 'しながわ', prefecture: '東京都', lines: ['JR山手線', 'JR東海道線'] },
		{ id: 1008, name: '渋谷', kana: 'しぶや', prefecture: '東京都', lines: ['JR山手線', 'JR埼京線'] }
	];
	
	// Mock search function
	function searchStations(query: string) {
		if (!query.trim()) {
			searchResults = [];
			showResults = false;
			return;
		}
		
		isLoading = true;
		
		// Simulate API delay
		setTimeout(() => {
			searchResults = mockStations.filter(station => 
				station.name.includes(query) || 
				station.kana.includes(query) ||
				station.prefecture.includes(query)
			);
			showResults = true;
			isLoading = false;
		}, 300);
	}
	
	function selectStation(station: any) {
		selectedStation = station;
		searchQuery = station.name;
		showResults = false;
	}
	
	function clearSelection() {
		selectedStation = null;
		searchQuery = '';
		searchResults = [];
		showResults = false;
	}
	
	// Demo code examples
	const basicUsageCode = `<script>
  import { StationSelector } from '@farert/svelte-sdk';
  
  let selectedStation = null;
<\/script>

<StationSelector
  bind:selectedStation
  placeholder="駅名を入力してください"
  on:stationSelected={(event) => {
    console.log('Selected:', event.detail);
  }}
/>`;

	const advancedUsageCode = `<script>
  import { StationSelector } from '@farert/svelte-sdk';
  
  let selectedStation = null;
  let searchQuery = '';
  let filterByPrefecture = '東京都';
<\/script>

<StationSelector
  bind:selectedStation
  bind:searchQuery
  filterByPrefecture={filterByPrefecture}
  showPrefecture={true}
  showLines={true}
  fuzzySearch={true}
  maxResults={10}
  on:stationSelected={handleStationSelect}
  on:searchStarted={() => console.log('Search started')}
  on:searchCompleted={() => console.log('Search completed')}
/>`;

	const propsTableData = [
		{ prop: 'selectedStation', type: 'Station | null', default: 'null', description: 'Currently selected station object' },
		{ prop: 'searchQuery', type: 'string', default: '""', description: 'Current search input value' },
		{ prop: 'placeholder', type: 'string', default: '"駅名を入力"', description: 'Input placeholder text' },
		{ prop: 'filterByPrefecture', type: 'string | null', default: 'null', description: 'Filter results by prefecture' },
		{ prop: 'showPrefecture', type: 'boolean', default: 'true', description: 'Show prefecture in results' },
		{ prop: 'showLines', type: 'boolean', default: 'true', description: 'Show railway lines in results' },
		{ prop: 'fuzzySearch', type: 'boolean', default: 'true', description: 'Enable fuzzy search matching' },
		{ prop: 'maxResults', type: 'number', default: '20', description: 'Maximum number of search results' }
	];
	
	const eventsTableData = [
		{ event: 'stationSelected', detail: 'Station', description: 'Fired when a station is selected from the results' },
		{ event: 'searchStarted', detail: 'string', description: 'Fired when user starts typing in search input' },
		{ event: 'searchCompleted', detail: 'Station[]', description: 'Fired when search results are returned' },
		{ event: 'cleared', detail: 'null', description: 'Fired when selection is cleared' }
	];
	
	let copiedCode = '';
	
	function copyCode(code: string, type: string) {
		navigator.clipboard.writeText(code);
		copiedCode = type;
		setTimeout(() => {
			copiedCode = '';
		}, 2000);
	}
</script>

<svelte:head>
	<title>StationSelector - Farert Svelte Components</title>
	<meta name="description" content="Interactive station search component with autocomplete and prefecture filtering for Japanese railway applications" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center space-x-3 mb-4">
			<div class="bg-blue-100 p-2 rounded-lg">
				<Search class="w-6 h-6 text-blue-600" />
			</div>
			<h1 class="text-3xl font-bold text-gray-900">StationSelector</h1>
		</div>
		<p class="text-xl text-gray-600 max-w-3xl">
			Intelligent station search component with autocomplete, fuzzy matching, and prefecture filtering.
			Perfect for building railway fare calculation applications.
		</p>
	</div>

	<!-- Live Demo Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Interactive Demo</h2>
		
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="max-w-md mx-auto">
				<!-- Demo StationSelector Component -->
				<div class="relative">
					<label for="station-search" class="block text-sm font-medium text-gray-700 mb-2">
						駅名検索
					</label>
					<div class="relative">
						<input
							id="station-search"
							type="text"
							bind:value={searchQuery}
							on:input={() => searchStations(searchQuery)}
							placeholder="駅名を入力してください（例：東京、とうきょう）"
							class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							autocomplete="off"
						/>
						<Search class="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
						
						{#if isLoading}
							<div class="absolute right-3 top-3.5">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
							</div>
						{/if}
					</div>
					
					<!-- Search Results Dropdown -->
					{#if showResults && searchResults.length > 0}
						<div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
							{#each searchResults as station}
								<button
									type="button"
									class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
									on:click={() => selectStation(station)}
								>
									<div class="flex items-center justify-between">
										<div>
											<div class="font-medium text-gray-900">{station.name}</div>
											<div class="text-sm text-gray-500">{station.kana} • {station.prefecture}</div>
										</div>
										<MapPin class="w-4 h-4 text-gray-400" />
									</div>
									<div class="text-xs text-gray-400 mt-1">
										{station.lines.join(', ')}
									</div>
								</button>
							{/each}
						</div>
					{/if}
					
					{#if showResults && searchResults.length === 0 && !isLoading}
						<div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
							検索結果が見つかりませんでした
						</div>
					{/if}
				</div>
				
				<!-- Selected Station Display -->
				{#if selectedStation}
					<div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
						<div class="flex items-start justify-between">
							<div>
								<h3 class="font-semibold text-blue-900">{selectedStation.name}</h3>
								<p class="text-sm text-blue-700">{selectedStation.kana}</p>
								<p class="text-sm text-blue-600 mt-1">{selectedStation.prefecture}</p>
								<div class="mt-2">
									<p class="text-xs text-blue-600 font-medium">利用可能路線:</p>
									<div class="flex flex-wrap gap-1 mt-1">
										{#each selectedStation.lines as line}
											<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
												{line}
											</span>
										{/each}
									</div>
								</div>
							</div>
							<button
								type="button"
								on:click={clearSelection}
								class="text-blue-600 hover:text-blue-800 text-sm font-medium"
							>
								クリア
							</button>
						</div>
					</div>
				{/if}
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

	<!-- API Reference -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">API Reference</h2>
		
		<div class="space-y-8">
			<!-- Props -->
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
							{#each propsTableData as row}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{row.prop}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{row.type}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{row.default}</td>
									<td class="px-6 py-4 text-sm text-gray-600">{row.description}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			
			<!-- Events -->
			<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
					<h3 class="text-lg font-semibold text-gray-900">Events</h3>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail Type</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each eventsTableData as row}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{row.event}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">{row.detail}</td>
									<td class="px-6 py-4 text-sm text-gray-600">{row.description}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Key Features</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-green-100 p-2 rounded-lg inline-block mb-4">
					<Search class="w-5 h-5 text-green-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Fuzzy Search</h3>
				<p class="text-gray-600 text-sm">
					Intelligent search that matches partial Kanji, Hiragana, or Romaji input with error tolerance.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-blue-100 p-2 rounded-lg inline-block mb-4">
					<MapPin class="w-5 h-5 text-blue-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Prefecture Filtering</h3>
				<p class="text-gray-600 text-sm">
					Filter search results by prefecture to narrow down options for common station names.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-purple-100 p-2 rounded-lg inline-block mb-4">
					<Info class="w-5 h-5 text-purple-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Rich Information</h3>
				<p class="text-gray-600 text-sm">
					Display station names, pronunciations, prefectures, and available railway lines.
				</p>
			</div>
		</div>
	</section>
</div>

<style>
	/* Custom scrollbar for dropdown */
	.overflow-y-auto::-webkit-scrollbar {
		width: 6px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 3px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 3px;
	}
	
	.overflow-y-auto::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}
	
	/* Animation for loading spinner */
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>