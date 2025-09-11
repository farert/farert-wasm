<script lang="ts">
	import { Route, Plus, Trash2, GripVertical, ArrowRight, MapPin, Code2, Copy } from 'lucide-svelte';
	
	// Mock data for demonstration
	let routeSegments = [
		{ id: 1, stationId: 1001, stationName: '東京', lineId: 101, lineName: 'JR山手線', order: 0 },
		{ id: 2, stationId: 1007, stationName: '品川', lineId: 102, lineName: 'JR東海道線', order: 1 },
		{ id: 3, stationId: 1003, stationName: '横浜', lineId: null, lineName: null, order: 2 }
	];
	
	let draggedIndex = -1;
	let dropTargetIndex = -1;
	let showAddStation = false;
	let newStationQuery = '';
	let searchResults: any[] = [];
	
	const mockStations = [
		{ id: 1001, name: '東京', kana: 'とうきょう', prefecture: '東京都' },
		{ id: 1002, name: '新宿', kana: 'しんじゅく', prefecture: '東京都' },
		{ id: 1003, name: '横浜', kana: 'よこはま', prefecture: '神奈川県' },
		{ id: 1004, name: '大阪', kana: 'おおさか', prefecture: '大阪府' },
		{ id: 1005, name: '名古屋', kana: 'なごや', prefecture: '愛知県' },
		{ id: 1007, name: '品川', kana: 'しながわ', prefecture: '東京都' },
		{ id: 1008, name: '渋谷', kana: 'しぶや', prefecture: '東京都' }
	];
	
	function handleDragStart(event: DragEvent, index: number) {
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', '');
		}
		draggedIndex = index;
	}
	
	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dropTargetIndex = index;
	}
	
	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();
		
		if (draggedIndex !== -1 && draggedIndex !== dropIndex) {
			const draggedItem = routeSegments[draggedIndex];
			routeSegments.splice(draggedIndex, 1);
			
			const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
			routeSegments.splice(adjustedDropIndex, 0, draggedItem);
			
			// Update order values
			routeSegments = routeSegments.map((segment, index) => ({
				...segment,
				order: index
			}));
		}
		
		draggedIndex = -1;
		dropTargetIndex = -1;
	}
	
	function removeStation(index: number) {
		routeSegments = routeSegments.filter((_, i) => i !== index);
		// Update order values
		routeSegments = routeSegments.map((segment, index) => ({
			...segment,
			order: index
		}));
	}
	
	function searchStations(query: string) {
		if (!query.trim()) {
			searchResults = [];
			return;
		}
		
		searchResults = mockStations.filter(station => 
			station.name.includes(query) || 
			station.kana.includes(query)
		).slice(0, 5);
	}
	
	function addStation(station: any) {
		const newId = Math.max(...routeSegments.map(s => s.id), 0) + 1;
		const newSegment = {
			id: newId,
			stationId: station.id,
			stationName: station.name,
			lineId: null,
			lineName: null,
			order: routeSegments.length
		};
		
		routeSegments = [...routeSegments, newSegment];
		newStationQuery = '';
		searchResults = [];
		showAddStation = false;
	}
	
	function calculateRoute() {
		alert('Route calculation would be performed here using the WebAssembly SDK!');
	}
	
	// Code examples
	const basicUsageCode = `<script>
  import { RouteBuilder } from '@farert/svelte-sdk';
  
  let routeSegments = [];
  let fareResult = null;
<\/script>

<RouteBuilder
  bind:routeSegments
  on:routeChanged={(event) => {
    console.log('Route updated:', event.detail);
  }}
  on:fareCalculated={(event) => {
    fareResult = event.detail;
  }}
/>`;

	const advancedUsageCode = `<script>
  import { RouteBuilder } from '@farert/svelte-sdk';
  
  let routeSegments = [];
  let enableDragDrop = true;
  let maxStations = 10;
<\/script>

<RouteBuilder
  bind:routeSegments
  enableDragDrop={enableDragDrop}
  maxStations={maxStations}
  enableUndo={true}
  autoCalculate={true}
  on:routeChanged={handleRouteChange}
  on:fareCalculated={handleFareCalculated}
  on:validationError={handleValidationError}
/>`;

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
	<title>RouteBuilder - Farert Svelte Components</title>
	<meta name="description" content="Drag-and-drop route building component for Japanese railway fare calculation applications" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center space-x-3 mb-4">
			<div class="bg-green-100 p-2 rounded-lg">
				<Route class="w-6 h-6 text-green-600" />
			</div>
			<h1 class="text-3xl font-bold text-gray-900">RouteBuilder</h1>
		</div>
		<p class="text-xl text-gray-600 max-w-3xl">
			Interactive drag-and-drop route building component with visual feedback, validation, 
			and support for complex multi-segment railway journeys.
		</p>
	</div>

	<!-- Live Demo Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Interactive Demo</h2>
		
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="max-w-3xl mx-auto">
				<!-- Route Builder Interface -->
				<div class="space-y-4">
					<!-- Route Segments -->
					{#each routeSegments as segment, index}
						<div 
							class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
							class:border-blue-400={dropTargetIndex === index}
							draggable="true"
							on:dragstart={(event) => handleDragStart(event, index)}
							on:dragover={(event) => handleDragOver(event, index)}
							on:drop={(event) => handleDrop(event, index)}
						>
							<!-- Drag Handle -->
							<div class="text-gray-400 cursor-move">
								<GripVertical class="w-5 h-5" />
							</div>
							
							<!-- Station Info -->
							<div class="flex-1">
								<div class="flex items-center space-x-3">
									<div class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
										{index + 1}
									</div>
									<div>
										<h3 class="font-semibold text-gray-900">{segment.stationName}</h3>
										{#if segment.lineName}
											<p class="text-sm text-gray-600">{segment.lineName}</p>
										{:else}
											<p class="text-sm text-amber-600">路線未選択</p>
										{/if}
									</div>
								</div>
							</div>
							
							<!-- Arrow (except for last item) -->
							{#if index < routeSegments.length - 1}
								<ArrowRight class="w-5 h-5 text-gray-400" />
							{/if}
							
							<!-- Remove Button -->
							<button
								type="button"
								on:click={() => removeStation(index)}
								class="text-red-500 hover:text-red-700 p-1"
								title="駅を削除"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</div>
					{/each}
					
					<!-- Add Station -->
					{#if showAddStation}
						<div class="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
							<div class="space-y-3">
								<label class="block text-sm font-medium text-blue-900">
									駅を追加
								</label>
								<div class="relative">
									<input
										type="text"
										bind:value={newStationQuery}
										on:input={() => searchStations(newStationQuery)}
										placeholder="駅名を入力してください"
										class="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
									
									{#if searchResults.length > 0}
										<div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
											{#each searchResults as station}
												<button
													type="button"
													class="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
													on:click={() => addStation(station)}
												>
													<div class="font-medium text-gray-900">{station.name}</div>
													<div class="text-sm text-gray-500">{station.kana} • {station.prefecture}</div>
												</button>
											{/each}
										</div>
									{/if}
								</div>
								<div class="flex space-x-2">
									<button
										type="button"
										on:click={() => showAddStation = false}
										class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
									>
										キャンセル
									</button>
								</div>
							</div>
						</div>
					{:else}
						<button
							type="button"
							on:click={() => showAddStation = true}
							class="flex items-center justify-center space-x-2 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors"
						>
							<Plus class="w-5 h-5 text-gray-500" />
							<span class="text-gray-600 font-medium">駅を追加</span>
						</button>
					{/if}
				</div>
				
				<!-- Route Summary and Actions -->
				{#if routeSegments.length >= 2}
					<div class="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="font-semibold text-green-900">ルート概要</h3>
								<p class="text-sm text-green-700">
									{routeSegments[0].stationName} → {routeSegments[routeSegments.length - 1].stationName}
									（{routeSegments.length} 駅）
								</p>
							</div>
							<button
								type="button"
								on:click={calculateRoute}
								class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
							>
								運賃計算
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

	<!-- Features Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Key Features</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-blue-100 p-2 rounded-lg inline-block mb-4">
					<GripVertical class="w-5 h-5 text-blue-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Drag & Drop</h3>
				<p class="text-gray-600 text-sm">
					Intuitive drag-and-drop interface for reordering stations in your route.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-green-100 p-2 rounded-lg inline-block mb-4">
					<Plus class="w-5 h-5 text-green-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Dynamic Adding</h3>
				<p class="text-gray-600 text-sm">
					Add stations to your route with real-time search and autocomplete.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-purple-100 p-2 rounded-lg inline-block mb-4">
					<MapPin class="w-5 h-5 text-purple-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Visual Feedback</h3>
				<p class="text-gray-600 text-sm">
					Clear visual indicators for route progress, validation status, and interactions.
				</p>
			</div>
		</div>
	</section>

	<!-- API Reference Section -->
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
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">routeSegments</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">RouteSegment[]</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">[]</td>
							<td class="px-6 py-4 text-sm text-gray-600">Array of route segments representing the journey</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">enableDragDrop</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">boolean</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">true</td>
							<td class="px-6 py-4 text-sm text-gray-600">Enable drag and drop reordering of stations</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">maxStations</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">number</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">20</td>
							<td class="px-6 py-4 text-sm text-gray-600">Maximum number of stations allowed in route</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">enableUndo</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">boolean</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">false</td>
							<td class="px-6 py-4 text-sm text-gray-600">Enable undo/redo functionality for route changes</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">autoCalculate</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">boolean</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">false</td>
							<td class="px-6 py-4 text-sm text-gray-600">Automatically calculate fare when route changes</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>
</div>

<style>
	/* Drag and drop visual feedback */
	[draggable="true"] {
		cursor: grab;
	}
	
	[draggable="true"]:active {
		cursor: grabbing;
	}
	
	/* Custom scrollbar */
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
</style>