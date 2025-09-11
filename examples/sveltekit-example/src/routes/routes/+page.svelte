<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Train, MapPin, Calculator, ArrowRight, Plus, X, Loader2, Clock, DollarSign } from 'lucide-svelte';
	import { farertStore, isReady, isLoading } from '$lib/stores/farert-store';
	import type { StationSearchResult, RouteSegment, FareCalculationResult } from '$lib/stores/farert-store';

	// Route building state
	let fromStation: StationSearchResult | null = null;
	let toStation: StationSearchResult | null = null;
	let intermediateStations: StationSearchResult[] = [];
	
	// Search state
	let fromQuery = '';
	let toQuery = '';
	let fromResults: StationSearchResult[] = [];
	let toResults: StationSearchResult[] = [];
	let isSearchingFrom = false;
	let isSearchingTo = false;

	// Calculation state
	let fareResult: FareCalculationResult | null = null;
	let isCalculating = false;
	let calculationError = '';

	// Popular routes for quick testing
	const popularRoutes = [
		{ from: '東京', to: '大阪', fromId: 1130101, toId: 2720101 },
		{ from: '新宿', to: '渋谷', fromId: 1130222, toId: 1130301 },
		{ from: '横浜', to: '品川', fromId: 1130123, toId: 1130107 },
		{ from: '名古屋', to: '京都', fromId: 2301101, toId: 2610101 }
	];

	// Search functions
	async function searchFromStation() {
		if (!$isReady || !fromQuery.trim()) return;

		isSearchingFrom = true;
		try {
			fromResults = await farertStore.searchStations(fromQuery.trim());
		} catch (error) {
			console.error('From station search failed:', error);
			fromResults = [];
		} finally {
			isSearchingFrom = false;
		}
	}

	async function searchToStation() {
		if (!$isReady || !toQuery.trim()) return;

		isSearchingTo = true;
		try {
			toResults = await farertStore.searchStations(toQuery.trim());
		} catch (error) {
			console.error('To station search failed:', error);
			toResults = [];
		} finally {
			isSearchingTo = false;
		}
	}

	function selectFromStation(station: StationSearchResult) {
		fromStation = station;
		fromQuery = station.name;
		fromResults = [];
	}

	function selectToStation(station: StationSearchResult) {
		toStation = station;
		toQuery = station.name;
		toResults = [];
	}

	function addIntermediateStation() {
		intermediateStations = [...intermediateStations, { id: 0, name: '', nameEx: '', kana: '', prefecture: '' }];
	}

	function removeIntermediateStation(index: number) {
		intermediateStations = intermediateStations.filter((_, i) => i !== index);
	}

	async function calculateRoute() {
		if (!$isReady || !fromStation || !toStation) return;

		isCalculating = true;
		calculationError = '';
		fareResult = null;

		try {
			// Build route segments
			const route: RouteSegment[] = [
				{ stationId: fromStation.id, stationName: fromStation.name }
			];

			// Add intermediate stations if any
			for (const station of intermediateStations) {
				if (station.id > 0) {
					route.push({ stationId: station.id, stationName: station.name });
				}
			}

			// Add destination
			route.push({ stationId: toStation.id, stationName: toStation.name });

			// Calculate fare
			const result = await farertStore.calculateFare(route);
			fareResult = result;

		} catch (error) {
			calculationError = error instanceof Error ? error.message : '計算中にエラーが発生しました。';
		} finally {
			isCalculating = false;
		}
	}

	function loadPopularRoute(route: typeof popularRoutes[0]) {
		fromQuery = route.from;
		toQuery = route.to;
		fromStation = { id: route.fromId, name: route.from, nameEx: route.from, kana: '', prefecture: '' };
		toStation = { id: route.toId, name: route.to, nameEx: route.to, kana: '', prefecture: '' };
		intermediateStations = [];
		fareResult = null;
		calculationError = '';
	}

	function swapStations() {
		if (fromStation && toStation) {
			const temp = fromStation;
			fromStation = toStation;
			toStation = temp;
			
			const tempQuery = fromQuery;
			fromQuery = toQuery;
			toQuery = tempQuery;
			
			fareResult = null;
			calculationError = '';
		}
	}

	function clearRoute() {
		fromStation = null;
		toStation = null;
		fromQuery = '';
		toQuery = '';
		intermediateStations = [];
		fromResults = [];
		toResults = [];
		fareResult = null;
		calculationError = '';
	}

	function formatFare(fare: number): string {
		return fare.toLocaleString('ja-JP');
	}

	function formatTime(ms: number): string {
		if (ms < 1000) return `${ms.toFixed(1)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	onMount(() => {
		// Check for URL parameters
		const fromId = $page.url.searchParams.get('from');
		const toId = $page.url.searchParams.get('to');
		
		if (fromId || toId) {
			// Load stations from URL parameters
			Promise.all([
				fromId ? farertStore.getStationById(parseInt(fromId)) : null,
				toId ? farertStore.getStationById(parseInt(toId)) : null
			]).then(([from, to]) => {
				if (from) {
					fromStation = from;
					fromQuery = from.name;
				}
				if (to) {
					toStation = to;
					toQuery = to.name;
				}
			}).catch(error => {
				console.error('Failed to load stations from URL:', error);
			});
		}
	});
</script>

<svelte:head>
	<title>ルート検索 - Route Planning | Farert SDK</title>
	<meta name="description" content="出発駅と到着駅を指定して、最適なルートと運賃を計算できます。複数の経由駅にも対応しています。" />
</svelte:head>

<div class="routes-page">
	<div class="container py-8">
		<!-- Page Header -->
		<div class="page-header">
			<h1 class="page-title">
				<Train class="w-8 h-8" />
				ルート検索・運賃計算
			</h1>
			<p class="page-description">
				出発駅と到着駅を選択して、最適なルートと正確な運賃を計算します。
			</p>
		</div>

		<!-- Popular Routes -->
		<div class="popular-routes">
			<h3 class="popular-title">人気のルート例</h3>
			<div class="popular-grid">
				{#each popularRoutes as route}
					<button
						type="button"
						on:click={() => loadPopularRoute(route)}
						disabled={!$isReady}
						class="popular-route-btn"
					>
						<span class="route-text">{route.from} → {route.to}</span>
						<ArrowRight class="w-4 h-4" />
					</button>
				{/each}
			</div>
		</div>

		<!-- Route Builder -->
		<div class="route-builder">
			<div class="route-header">
				<h2 class="route-title">ルート設定</h2>
				<div class="route-actions">
					<button
						type="button"
						on:click={swapStations}
						disabled={!fromStation || !toStation}
						class="btn btn-sm btn-secondary"
						title="出発駅と到着駅を入れ替え"
					>
						<ArrowRight class="w-4 h-4 transform rotate-90" />
					</button>
					<button
						type="button"
						on:click={clearRoute}
						class="btn btn-sm btn-secondary"
						title="ルートをクリア"
					>
						<X class="w-4 h-4" />
					</button>
				</div>
			</div>

			<!-- From Station -->
			<div class="station-input-group">
				<label class="station-label">
					<MapPin class="w-4 h-4" />
					出発駅
				</label>
				<div class="station-search-container">
					<input
						type="text"
						bind:value={fromQuery}
						on:input={searchFromStation}
						placeholder="出発駅を入力"
						class="station-input"
						disabled={!$isReady}
					/>
					{#if isSearchingFrom}
						<Loader2 class="search-spinner" />
					{/if}
					
					{#if fromResults.length > 0}
						<div class="search-results">
							{#each fromResults as station}
								<button
									type="button"
									on:click={() => selectFromStation(station)}
									class="search-result-item"
								>
									<span class="result-name">{station.name}</span>
									{#if station.nameEx && station.nameEx !== station.name}
										<span class="result-name-ex">{station.nameEx}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Intermediate Stations -->
			{#if intermediateStations.length > 0}
				{#each intermediateStations as station, index}
					<div class="station-input-group intermediate">
						<label class="station-label">
							<MapPin class="w-4 h-4" />
							経由駅 {index + 1}
						</label>
						<div class="station-search-container">
							<input
								type="text"
								bind:value={station.name}
								placeholder="経由駅を入力"
								class="station-input"
								disabled={!$isReady}
							/>
							<button
								type="button"
								on:click={() => removeIntermediateStation(index)}
								class="remove-station-btn"
								title="経由駅を削除"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					</div>
				{/each}
			{/if}

			<!-- Add Intermediate Station -->
			<div class="add-station-container">
				<button
					type="button"
					on:click={addIntermediateStation}
					disabled={!$isReady || intermediateStations.length >= 5}
					class="add-station-btn"
				>
					<Plus class="w-4 h-4" />
					経由駅を追加
				</button>
			</div>

			<!-- To Station -->
			<div class="station-input-group">
				<label class="station-label">
					<MapPin class="w-4 h-4" />
					到着駅
				</label>
				<div class="station-search-container">
					<input
						type="text"
						bind:value={toQuery}
						on:input={searchToStation}
						placeholder="到着駅を入力"
						class="station-input"
						disabled={!$isReady}
					/>
					{#if isSearchingTo}
						<Loader2 class="search-spinner" />
					{/if}
					
					{#if toResults.length > 0}
						<div class="search-results">
							{#each toResults as station}
								<button
									type="button"
									on:click={() => selectToStation(station)}
									class="search-result-item"
								>
									<span class="result-name">{station.name}</span>
									{#if station.nameEx && station.nameEx !== station.name}
										<span class="result-name-ex">{station.nameEx}</span>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Calculate Button -->
			<div class="calculate-container">
				<button
					type="button"
					on:click={calculateRoute}
					disabled={!$isReady || !fromStation || !toStation || isCalculating}
					class="calculate-btn"
				>
					{#if isCalculating}
						<Loader2 class="w-5 h-5 animate-spin" />
						計算中...
					{:else}
						<Calculator class="w-5 h-5" />
						運賃を計算する
					{/if}
				</button>
			</div>
		</div>

		<!-- Calculation Error -->
		{#if calculationError}
			<div class="error-message">
				<p>{calculationError}</p>
			</div>
		{/if}

		<!-- Fare Result -->
		{#if fareResult}
			<div class="fare-result">
				<div class="result-header">
					<h2 class="result-title">
						<DollarSign class="w-6 h-6" />
						運賃計算結果
					</h2>
				</div>

				<div class="result-content">
					<!-- Fare Display -->
					<div class="fare-display">
						<div class="fare-amount">¥{formatFare(fareResult.fareInfo.fare)}</div>
						<div class="fare-label">総運賃</div>
					</div>

					<!-- Route Summary -->
					<div class="route-summary">
						<h3 class="summary-title">ルート詳細</h3>
						<div class="route-path">
							{#each fareResult.route as segment, index}
								<span class="route-station">{segment.stationName}</span>
								{#if index < fareResult.route.length - 1}
									<ArrowRight class="w-4 h-4 text-gray-400" />
								{/if}
							{/each}
						</div>
					</div>

					<!-- Calculation Details -->
					<div class="calculation-details">
						<div class="details-grid">
							<div class="detail-item">
								<span class="detail-label">計算時間</span>
								<span class="detail-value">{formatTime(fareResult.calculationTimeMs)}</span>
							</div>
							
							{#if fareResult.fareInfo.distance}
								<div class="detail-item">
									<span class="detail-label">距離</span>
									<span class="detail-value">{fareResult.fareInfo.distance}km</span>
								</div>
							{/if}
							
							<div class="detail-item">
								<span class="detail-label">計算日時</span>
								<span class="detail-value">{fareResult.calculatedAt.toLocaleString('ja-JP')}</span>
							</div>
							
							<div class="detail-item">
								<span class="detail-label">駅数</span>
								<span class="detail-value">{fareResult.route.length}駅</span>
							</div>
						</div>
					</div>

					<!-- Additional Fare Information -->
					{#if fareResult.fareInfo.rule114Applied || fareResult.fareInfo.availCountForFareOfStockDiscount > 0}
						<div class="additional-info">
							<h3 class="info-title">割引・特別料金情報</h3>
							
							{#if fareResult.fareInfo.rule114Applied}
								<div class="info-item">
									<span class="info-badge rule114">特定運賃適用</span>
									<span class="info-text">規則114が適用されています</span>
								</div>
							{/if}
							
							{#if fareResult.fareInfo.availCountForFareOfStockDiscount > 0}
								<div class="info-item">
									<span class="info-badge discount">割引運賃</span>
									<span class="info-text">{fareResult.fareInfo.availCountForFareOfStockDiscount}種類の割引が利用可能</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.routes-page {
		min-height: calc(100vh - 200px);
		background: #f9fafb;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-title {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.page-description {
		font-size: 1.125rem;
		color: #6b7280;
		max-width: 600px;
		margin: 0 auto;
	}

	/* Popular Routes */
	.popular-routes {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.popular-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
		text-align: center;
	}

	.popular-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.popular-route-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.popular-route-btn:hover:not(:disabled) {
		background: #f3f4f6;
		border-color: #6366f1;
	}

	.popular-route-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.route-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f2937;
	}

	/* Route Builder */
	.route-builder {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.route-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.route-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.route-actions {
		display: flex;
		gap: 0.5rem;
	}

	.station-input-group {
		margin-bottom: 1.5rem;
		position: relative;
	}

	.station-input-group.intermediate {
		border-left: 3px solid #6366f1;
		padding-left: 1rem;
		margin-left: 1rem;
	}

	.station-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.station-search-container {
		position: relative;
	}

	.station-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s ease-in-out;
	}

	.station-input:focus {
		border-color: #6366f1;
	}

	.station-input:disabled {
		background: #f9fafb;
		color: #9ca3af;
		cursor: not-allowed;
	}

	.search-spinner {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		width: 1rem;
		height: 1rem;
		color: #6366f1;
		animation: spin 1s linear infinite;
	}

	.remove-station-btn {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		padding: 0.25rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
	}

	.remove-station-btn:hover {
		background: #dc2626;
	}

	.search-results {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #e5e7eb;
		border-top: none;
		border-radius: 0 0 0.5rem 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		z-index: 10;
		max-height: 200px;
		overflow-y: auto;
	}

	.search-result-item {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		border: none;
		background: white;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
	}

	.search-result-item:hover {
		background: #f9fafb;
	}

	.result-name {
		display: block;
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f2937;
	}

	.result-name-ex {
		display: block;
		font-size: 0.75rem;
		color: #6b7280;
	}

	.add-station-container {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
	}

	.add-station-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #f3f4f6;
		color: #374151;
		border: 2px dashed #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.add-station-btn:hover:not(:disabled) {
		background: #e5e7eb;
		border-color: #6366f1;
	}

	.add-station-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.calculate-container {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}

	.calculate-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background: #6366f1;
		color: white;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
	}

	.calculate-btn:hover:not(:disabled) {
		background: #4f46e5;
	}

	.calculate-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	/* Fare Result */
	.fare-result {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.result-header {
		margin-bottom: 2rem;
	}

	.result-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.fare-display {
		text-align: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 1rem;
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.fare-amount {
		font-size: 3rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.fare-label {
		font-size: 1.125rem;
		opacity: 0.9;
	}

	.route-summary {
		margin-bottom: 2rem;
	}

	.summary-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.route-path {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.5rem;
	}

	.route-station {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f2937;
		padding: 0.5rem 1rem;
		background: white;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
	}

	.calculation-details {
		margin-bottom: 2rem;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: #f9fafb;
		border-radius: 0.375rem;
	}

	.detail-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.detail-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 600;
	}

	.additional-info {
		border-top: 1px solid #e5e7eb;
		padding-top: 2rem;
	}

	.info-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.info-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.info-badge.rule114 {
		background: #dbeafe;
		color: #1e40af;
	}

	.info-badge.discount {
		background: #dcfce7;
		color: #166534;
	}

	.info-text {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.5rem;
		padding: 1rem;
		text-align: center;
		color: #dc2626;
		margin-bottom: 2rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}

		.popular-grid {
			grid-template-columns: 1fr;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}

		.route-path {
			flex-direction: column;
		}

		.fare-amount {
			font-size: 2rem;
		}
	}
</style>