<script lang="ts">
	import { onMount } from 'svelte';
	import { Search, MapPin, Train, ArrowRight, Loader2 } from 'lucide-svelte';
	import { farertStore, isReady, isLoading } from '$lib/stores/farert-store';
	import type { StationSearchResult, LineInfo } from '$lib/stores/farert-store';

	// Search state
	let searchQuery = '';
	let searchResults: StationSearchResult[] = [];
	let selectedStation: StationSearchResult | null = null;
	let stationLines: LineInfo[] = [];
	let isSearching = false;
	let searchError = '';
	let loadingLines = false;

	// Popular stations for quick access
	const popularStations = [
		{ name: '東京', id: 1130101 },
		{ name: '新宿', id: 1130222 },
		{ name: '渋谷', id: 1130301 },
		{ name: '横浜', id: 1130123 },
		{ name: '大阪', id: 2720101 },
		{ name: '京都', id: 2610101 },
		{ name: '名古屋', id: 2301101 },
		{ name: '福岡', id: 8201101 }
	];

	async function handleSearch() {
		if (!$isReady || !searchQuery.trim()) {
			return;
		}

		isSearching = true;
		searchError = '';
		searchResults = [];

		try {
			const results = await farertStore.searchStations(searchQuery.trim());
			searchResults = results;
			
			if (results.length === 0) {
				searchError = '該当する駅が見つかりませんでした。';
			}
		} catch (error) {
			searchError = error instanceof Error ? error.message : '検索中にエラーが発生しました。';
		} finally {
			isSearching = false;
		}
	}

	async function selectStation(station: StationSearchResult) {
		selectedStation = station;
		loadingLines = true;
		stationLines = [];

		try {
			const lines = await farertStore.getLinesForStation(station.id);
			stationLines = lines;
		} catch (error) {
			console.error('Failed to load lines:', error);
		} finally {
			loadingLines = false;
		}
	}

	async function searchPopularStation(name: string, id: number) {
		searchQuery = name;
		await handleSearch();
		
		// Auto-select if found
		const found = searchResults.find(r => r.id === id);
		if (found) {
			await selectStation(found);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleSearch();
		}
	}

	onMount(() => {
		// Focus search input on mount
		const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
		if (searchInput) {
			searchInput.focus();
		}
	});
</script>

<svelte:head>
	<title>駅検索 - Station Search | Farert SDK</title>
	<meta name="description" content="日本全国の鉄道駅を検索できます。駅名、路線情報、所在地などの詳細情報を表示します。" />
</svelte:head>

<div class="stations-page">
	<div class="container py-8">
		<!-- Page Header -->
		<div class="page-header">
			<h1 class="page-title">
				<MapPin class="w-8 h-8" />
				駅検索
			</h1>
			<p class="page-description">
				日本全国の鉄道駅を検索して、詳細情報や運行路線を確認できます。
			</p>
		</div>

		<!-- Search Section -->
		<div class="search-section">
			<div class="search-container">
				<div class="search-input-group">
					<Search class="search-icon" />
					<input
						type="search"
						bind:value={searchQuery}
						on:keydown={handleKeydown}
						placeholder="駅名を入力してください（例：東京、新宿、渋谷）"
						class="search-input"
						disabled={!$isReady || isSearching}
					/>
					<button
						type="button"
						on:click={handleSearch}
						disabled={!$isReady || !searchQuery.trim() || isSearching}
						class="search-button"
					>
						{#if isSearching}
							<Loader2 class="w-4 h-4 animate-spin" />
						{:else}
							検索
						{/if}
					</button>
				</div>

				{#if !$isReady}
					<p class="search-status">
						WebAssembly SDKを読み込み中...
					</p>
				{:else if $isLoading}
					<p class="search-status">
						システム初期化中...
					</p>
				{/if}
			</div>

			<!-- Popular Stations -->
			<div class="popular-stations">
				<h3 class="popular-title">人気の駅</h3>
				<div class="popular-grid">
					{#each popularStations as station}
						<button
							type="button"
							on:click={() => searchPopularStation(station.name, station.id)}
							disabled={!$isReady}
							class="popular-station-btn"
						>
							{station.name}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Search Results -->
		{#if searchError}
			<div class="error-message">
				<p>{searchError}</p>
			</div>
		{:else if searchResults.length > 0}
			<div class="results-section">
				<h2 class="results-title">検索結果 ({searchResults.length}件)</h2>
				
				<div class="results-grid">
					{#each searchResults as station}
						<div 
							class="station-card {selectedStation?.id === station.id ? 'selected' : ''}"
							on:click={() => selectStation(station)}
							on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectStation(station)}
							role="button"
							tabindex="0"
						>
							<div class="station-card-header">
								<h3 class="station-name">{station.name}</h3>
								{#if station.nameEx && station.nameEx !== station.name}
									<p class="station-name-ex">{station.nameEx}</p>
								{/if}
							</div>
							
							<div class="station-card-info">
								{#if station.kana}
									<p class="station-kana">{station.kana}</p>
								{/if}
								{#if station.prefecture}
									<p class="station-prefecture">{station.prefecture}</p>
								{/if}
							</div>

							<div class="station-card-footer">
								<span class="station-id">ID: {station.id}</span>
								<ArrowRight class="w-4 h-4 text-gray-400" />
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Station Details -->
		{#if selectedStation}
			<div class="station-details">
				<div class="station-details-header">
					<h2 class="station-details-title">
						<Train class="w-6 h-6" />
						{selectedStation.name} の詳細情報
					</h2>
				</div>

				<div class="station-info-grid">
					<div class="info-card">
						<h3 class="info-card-title">基本情報</h3>
						<div class="info-list">
							<div class="info-item">
								<span class="info-label">駅名</span>
								<span class="info-value">{selectedStation.name}</span>
							</div>
							{#if selectedStation.nameEx && selectedStation.nameEx !== selectedStation.name}
								<div class="info-item">
									<span class="info-label">正式名称</span>
									<span class="info-value">{selectedStation.nameEx}</span>
								</div>
							{/if}
							{#if selectedStation.kana}
								<div class="info-item">
									<span class="info-label">読み方</span>
									<span class="info-value">{selectedStation.kana}</span>
								</div>
							{/if}
							{#if selectedStation.prefecture}
								<div class="info-item">
									<span class="info-label">所在地</span>
									<span class="info-value">{selectedStation.prefecture}</span>
								</div>
							{/if}
							<div class="info-item">
								<span class="info-label">駅ID</span>
								<span class="info-value font-mono">{selectedStation.id}</span>
							</div>
						</div>
					</div>

					<div class="info-card">
						<h3 class="info-card-title">運行路線</h3>
						{#if loadingLines}
							<div class="loading-lines">
								<Loader2 class="w-4 h-4 animate-spin" />
								<span>路線情報を読み込み中...</span>
							</div>
						{:else if stationLines.length > 0}
							<div class="lines-list">
								{#each stationLines as line}
									<div class="line-item">
										<div class="line-name">{line.name}</div>
										<div class="line-id">ID: {line.id}</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="no-lines">路線情報が利用できません</p>
						{/if}
					</div>
				</div>

				<!-- Actions -->
				<div class="station-actions">
					<a href="/routes?from={selectedStation.id}" class="btn btn-primary">
						<Train class="w-4 h-4" />
						この駅からのルート検索
					</a>
					<a href="/routes?to={selectedStation.id}" class="btn btn-secondary">
						<MapPin class="w-4 h-4" />
						この駅へのルート検索
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.stations-page {
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

	/* Search Section */
	.search-section {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 2rem;
	}

	.search-container {
		margin-bottom: 2rem;
	}

	.search-input-group {
		display: flex;
		align-items: center;
		max-width: 600px;
		margin: 0 auto;
		position: relative;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		width: 1.25rem;
		height: 1.25rem;
		color: #6b7280;
		z-index: 1;
	}

	.search-input {
		flex: 1;
		padding: 1rem 1rem 1rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem 0 0 0.5rem;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s ease-in-out;
	}

	.search-input:focus {
		border-color: #6366f1;
	}

	.search-input:disabled {
		background: #f9fafb;
		color: #9ca3af;
		cursor: not-allowed;
	}

	.search-button {
		padding: 1rem 1.5rem;
		background: #6366f1;
		color: white;
		border: none;
		border-radius: 0 0.5rem 0.5rem 0;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.search-button:hover:not(:disabled) {
		background: #4f46e5;
	}

	.search-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	.search-status {
		text-align: center;
		color: #6b7280;
		font-size: 0.875rem;
		margin-top: 0.5rem;
	}

	/* Popular Stations */
	.popular-stations {
		text-align: center;
	}

	.popular-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.popular-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		justify-content: center;
	}

	.popular-station-btn {
		padding: 0.5rem 1rem;
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.popular-station-btn:hover:not(:disabled) {
		background: #e5e7eb;
		transform: translateY(-1px);
	}

	.popular-station-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Results Section */
	.results-section {
		margin-bottom: 2rem;
	}

	.results-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	.results-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem;
	}

	.station-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.station-card:hover {
		border-color: #6366f1;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.station-card.selected {
		border-color: #6366f1;
		background: #eff6ff;
	}

	.station-card-header {
		margin-bottom: 1rem;
	}

	.station-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.station-name-ex {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.station-card-info {
		margin-bottom: 1rem;
	}

	.station-kana {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 0.25rem 0;
	}

	.station-prefecture {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
	}

	.station-card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.station-id {
		font-size: 0.75rem;
		color: #9ca3af;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	/* Station Details */
	.station-details {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.station-details-header {
		margin-bottom: 2rem;
	}

	.station-details-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
	}

	.station-info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.info-card {
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.info-card-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.info-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		font-size: 0.875rem;
		color: #6b7280;
		font-weight: 500;
	}

	.info-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
	}

	.loading-lines {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.lines-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.line-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: #f9fafb;
		border-radius: 0.25rem;
	}

	.line-name {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
	}

	.line-id {
		font-size: 0.75rem;
		color: #6b7280;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.no-lines {
		color: #6b7280;
		font-size: 0.875rem;
		font-style: italic;
	}

	.station-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
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

	/* Responsive Design */
	@media (max-width: 768px) {
		.search-input-group {
			flex-direction: column;
		}

		.search-input {
			border-radius: 0.5rem;
			padding-left: 3rem;
			margin-bottom: 0.5rem;
		}

		.search-button {
			border-radius: 0.5rem;
			justify-content: center;
		}

		.station-info-grid {
			grid-template-columns: 1fr;
		}

		.station-actions {
			flex-direction: column;
		}

		.page-title {
			font-size: 2rem;
		}
	}
</style>