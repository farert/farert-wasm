<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { BarChart3, Zap, Clock, TrendingUp, Database, Play, Pause, RotateCcw } from 'lucide-svelte';
	import { farertStore, isReady } from '$lib/stores/farert-store';

	// Performance metrics
	interface PerformanceMetric {
		timestamp: number;
		operation: string;
		duration: number;
		success: boolean;
		cacheHit?: boolean;
	}

	let metrics: PerformanceMetric[] = [];
	let isMonitoring = false;
	let monitoringInterval: NodeJS.Timeout | null = null;

	// Real-time stats
	let currentStats = {
		totalOperations: 0,
		averageTime: 0,
		successRate: 0,
		cacheHitRate: 0,
		operationsPerSecond: 0
	};

	// Test scenarios
	const testScenarios = [
		{
			name: '基本的な駅検索',
			description: '単一駅の検索性能',
			operation: async () => {
				const queries = ['東京', '新宿', '渋谷', '横浜', '大阪'];
				const query = queries[Math.floor(Math.random() * queries.length)];
				const start = performance.now();
				const result = await farertStore.searchStations(query);
				const end = performance.now();
				return {
					duration: end - start,
					operation: `駅検索: ${query}`,
					success: result.length > 0
				};
			}
		},
		{
			name: '運賃計算',
			description: '2駅間の運賃計算性能',
			operation: async () => {
				const routes = [
					[{ stationId: 1130101, stationName: '東京' }, { stationId: 1130123, stationName: '横浜' }],
					[{ stationId: 1130222, stationName: '新宿' }, { stationId: 1130301, stationName: '渋谷' }],
					[{ stationId: 1130107, stationName: '品川' }, { stationId: 1130222, stationName: '新宿' }]
				];
				const route = routes[Math.floor(Math.random() * routes.length)];
				const start = performance.now();
				const result = await farertStore.calculateFare(route);
				const end = performance.now();
				return {
					duration: end - start,
					operation: `運賃計算: ${route[0].stationName}→${route[1].stationName}`,
					success: result.fareInfo.fare > 0
				};
			}
		},
		{
			name: '複雑なルート計算',
			description: '複数経由駅を含むルート計算',
			operation: async () => {
				const route = [
					{ stationId: 1130101, stationName: '東京' },
					{ stationId: 1130222, stationName: '新宿' },
					{ stationId: 1130301, stationName: '渋谷' },
					{ stationId: 1130123, stationName: '横浜' }
				];
				const start = performance.now();
				const result = await farertStore.calculateFare(route);
				const end = performance.now();
				return {
					duration: end - start,
					operation: '複雑ルート計算',
					success: result.fareInfo.fare > 0
				};
			}
		}
	];

	let selectedScenario = testScenarios[0];
	let testRunning = false;
	let batchTestRunning = false;

	// Chart data for visualization
	$: chartData = metrics.slice(-50).map((metric, index) => ({
		x: index,
		y: metric.duration,
		operation: metric.operation,
		success: metric.success
	}));

	// Calculate statistics
	$: {
		if (metrics.length > 0) {
			const recentMetrics = metrics.slice(-100);
			const successfulMetrics = recentMetrics.filter(m => m.success);
			
			currentStats = {
				totalOperations: metrics.length,
				averageTime: successfulMetrics.reduce((sum, m) => sum + m.duration, 0) / (successfulMetrics.length || 1),
				successRate: (successfulMetrics.length / recentMetrics.length) * 100,
				cacheHitRate: (recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length) * 100,
				operationsPerSecond: calculateOpsPerSecond()
			};
		}
	}

	function calculateOpsPerSecond(): number {
		if (metrics.length < 2) return 0;
		
		const now = Date.now();
		const oneSecondAgo = now - 1000;
		const recentOps = metrics.filter(m => m.timestamp > oneSecondAgo);
		
		return recentOps.length;
	}

	async function runSingleTest() {
		if (!$isReady || testRunning) return;

		testRunning = true;
		try {
			const result = await selectedScenario.operation();
			addMetric({
				...result,
				timestamp: Date.now()
			});
		} catch (error) {
			addMetric({
				timestamp: Date.now(),
				operation: selectedScenario.name,
				duration: 0,
				success: false
			});
		} finally {
			testRunning = false;
		}
	}

	async function runBatchTest() {
		if (!$isReady || batchTestRunning) return;

		batchTestRunning = true;
		const batchSize = 10;
		const delay = 100; // ms between operations

		try {
			for (let i = 0; i < batchSize; i++) {
				if (!batchTestRunning) break;

				// Rotate through scenarios
				const scenario = testScenarios[i % testScenarios.length];
				try {
					const result = await scenario.operation();
					addMetric({
						...result,
						timestamp: Date.now()
					});
				} catch (error) {
					addMetric({
						timestamp: Date.now(),
						operation: scenario.name,
						duration: 0,
						success: false
					});
				}

				if (i < batchSize - 1) {
					await new Promise(resolve => setTimeout(resolve, delay));
				}
			}
		} finally {
			batchTestRunning = false;
		}
	}

	function startMonitoring() {
		if (isMonitoring || !$isReady) return;

		isMonitoring = true;
		monitoringInterval = setInterval(async () => {
			if (!isMonitoring) return;

			// Run a random test scenario
			const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
			try {
				const result = await scenario.operation();
				addMetric({
					...result,
					timestamp: Date.now()
				});
			} catch (error) {
				console.error('Monitoring test failed:', error);
			}
		}, 2000); // Run test every 2 seconds
	}

	function stopMonitoring() {
		isMonitoring = false;
		if (monitoringInterval) {
			clearInterval(monitoringInterval);
			monitoringInterval = null;
		}
	}

	function clearMetrics() {
		metrics = [];
		currentStats = {
			totalOperations: 0,
			averageTime: 0,
			successRate: 0,
			cacheHitRate: 0,
			operationsPerSecond: 0
		};
	}

	function addMetric(metric: PerformanceMetric) {
		metrics = [...metrics, metric];
		
		// Keep only last 1000 metrics
		if (metrics.length > 1000) {
			metrics = metrics.slice(-1000);
		}
	}

	function formatTime(ms: number): string {
		if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
		if (ms < 1000) return `${ms.toFixed(1)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	function formatRate(rate: number): string {
		return `${rate.toFixed(1)}%`;
	}

	onDestroy(() => {
		stopMonitoring();
	});
</script>

<svelte:head>
	<title>Performance Monitoring | Farert SDK</title>
	<meta name="description" content="Farert WebAssembly SDKのパフォーマンス監視とベンチマーク。リアルタイムでの性能測定と分析。" />
</svelte:head>

<div class="performance-page">
	<div class="container py-8">
		<!-- Page Header -->
		<div class="page-header">
			<h1 class="page-title">
				<BarChart3 class="w-8 h-8" />
				Performance Monitoring
			</h1>
			<p class="page-description">
				Farert WebAssembly SDKのパフォーマンスをリアルタイムで監視・分析します。
			</p>
		</div>

		<!-- Stats Dashboard -->
		<div class="stats-dashboard">
			<div class="stat-card">
				<div class="stat-icon">
					<Zap class="w-6 h-6 text-blue-600" />
				</div>
				<div class="stat-content">
					<div class="stat-value">{formatTime(currentStats.averageTime)}</div>
					<div class="stat-label">平均実行時間</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">
					<TrendingUp class="w-6 h-6 text-green-600" />
				</div>
				<div class="stat-content">
					<div class="stat-value">{formatRate(currentStats.successRate)}</div>
					<div class="stat-label">成功率</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">
					<Database class="w-6 h-6 text-purple-600" />
				</div>
				<div class="stat-content">
					<div class="stat-value">{formatRate(currentStats.cacheHitRate)}</div>
					<div class="stat-label">キャッシュヒット率</div>
				</div>
			</div>

			<div class="stat-card">
				<div class="stat-icon">
					<Clock class="w-6 h-6 text-orange-600" />
				</div>
				<div class="stat-content">
					<div class="stat-value">{currentStats.operationsPerSecond.toFixed(1)}</div>
					<div class="stat-label">操作/秒</div>
				</div>
			</div>
		</div>

		<!-- Controls -->
		<div class="controls-section">
			<div class="control-group">
				<h3 class="control-title">テストシナリオ</h3>
				<div class="scenario-selector">
					{#each testScenarios as scenario}
						<button
							type="button"
							on:click={() => selectedScenario = scenario}
							class="scenario-btn {selectedScenario === scenario ? 'active' : ''}"
						>
							<div class="scenario-name">{scenario.name}</div>
							<div class="scenario-description">{scenario.description}</div>
						</button>
					{/each}
				</div>
			</div>

			<div class="control-group">
				<h3 class="control-title">テスト実行</h3>
				<div class="test-controls">
					<button
						type="button"
						on:click={runSingleTest}
						disabled={!$isReady || testRunning}
						class="test-btn primary"
					>
						{#if testRunning}
							<Clock class="w-4 h-4 animate-spin" />
							実行中...
						{:else}
							<Play class="w-4 h-4" />
							単発テスト
						{/if}
					</button>

					<button
						type="button"
						on:click={runBatchTest}
						disabled={!$isReady || batchTestRunning}
						class="test-btn secondary"
					>
						{#if batchTestRunning}
							<Clock class="w-4 h-4 animate-spin" />
							実行中...
						{:else}
							<Play class="w-4 h-4" />
							バッチテスト (10回)
						{/if}
					</button>

					<button
						type="button"
						on:click={isMonitoring ? stopMonitoring : startMonitoring}
						disabled={!$isReady}
						class="test-btn {isMonitoring ? 'danger' : 'success'}"
					>
						{#if isMonitoring}
							<Pause class="w-4 h-4" />
							監視停止
						{:else}
							<Play class="w-4 h-4" />
							連続監視
						{/if}
					</button>

					<button
						type="button"
						on:click={clearMetrics}
						class="test-btn secondary"
					>
						<RotateCcw class="w-4 h-4" />
						クリア
					</button>
				</div>
			</div>
		</div>

		<!-- Performance Chart -->
		{#if chartData.length > 0}
			<div class="chart-section">
				<h3 class="chart-title">実行時間の推移（直近50件）</h3>
				<div class="chart-container">
					<svg class="performance-chart" viewBox="0 0 800 300">
						<!-- Grid lines -->
						{#each Array(5) as _, i}
							<line
								x1="50"
								y1={50 + i * 50}
								x2="750"
								y2={50 + i * 50}
								stroke="#e5e7eb"
								stroke-width="1"
							/>
						{/each}

						<!-- Data points -->
						{#each chartData as point, i}
							{@const x = 50 + (i / (chartData.length - 1 || 1)) * 700}
							{@const maxTime = Math.max(...chartData.map(p => p.y))}
							{@const y = 250 - (point.y / (maxTime || 1)) * 200}
							
							<circle
								cx={x}
								cy={y}
								r="3"
								fill={point.success ? '#10b981' : '#ef4444'}
								class="chart-point"
							>
								<title>{point.operation}: {formatTime(point.y)}</title>
							</circle>

							{#if i > 0}
								{@const prevX = 50 + ((i - 1) / (chartData.length - 1 || 1)) * 700}
								{@const prevY = 250 - (chartData[i - 1].y / (maxTime || 1)) * 200}
								<line
									x1={prevX}
									y1={prevY}
									x2={x}
									y2={y}
									stroke={point.success ? '#10b981' : '#ef4444'}
									stroke-width="2"
									opacity="0.6"
								/>
							{/if}
						{/each}

						<!-- Y-axis labels -->
						{#each Array(6) as _, i}
							{@const maxTime = Math.max(...chartData.map(p => p.y))}
							{@const value = (maxTime / 5) * (5 - i)}
							<text
								x="45"
								y={50 + i * 40 + 5}
								text-anchor="end"
								font-size="12"
								fill="#6b7280"
							>
								{formatTime(value)}
							</text>
						{/each}

						<!-- Axis labels -->
						<text x="400" y="290" text-anchor="middle" font-size="14" fill="#374151">時系列</text>
						<text x="20" y="150" text-anchor="middle" font-size="14" fill="#374151" transform="rotate(-90 20 150)">実行時間</text>
					</svg>
				</div>

				<div class="chart-legend">
					<div class="legend-item">
						<div class="legend-color success"></div>
						<span>成功</span>
					</div>
					<div class="legend-item">
						<div class="legend-color error"></div>
						<span>失敗</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Recent Results -->
		{#if metrics.length > 0}
			<div class="results-section">
				<h3 class="results-title">最新の実行結果</h3>
				<div class="results-table">
					<div class="table-header">
						<div class="header-cell">時刻</div>
						<div class="header-cell">操作</div>
						<div class="header-cell">実行時間</div>
						<div class="header-cell">状態</div>
					</div>
					{#each metrics.slice(-20).reverse() as metric}
						<div class="table-row">
							<div class="table-cell">
								{new Date(metric.timestamp).toLocaleTimeString('ja-JP')}
							</div>
							<div class="table-cell">{metric.operation}</div>
							<div class="table-cell font-mono">{formatTime(metric.duration)}</div>
							<div class="table-cell">
								<span class="status-badge {metric.success ? 'success' : 'error'}">
									{metric.success ? '成功' : '失敗'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Performance Tips -->
		<div class="tips-section">
			<h3 class="tips-title">パフォーマンス最適化のコツ</h3>
			<div class="tips-grid">
				<div class="tip-item">
					<h4>🚀 初回実行時間</h4>
					<p>WebAssemblyモジュールの初回読み込みには時間がかかります。アプリケーション起動時に事前初期化を検討してください。</p>
				</div>
				<div class="tip-item">
					<h4>💾 キャッシュ活用</h4>
					<p>同じクエリの繰り返し実行はキャッシュされ、大幅に高速化されます。ユーザーの検索パターンを考慮してください。</p>
				</div>
				<div class="tip-item">
					<h4>⚡ バッチ処理</h4>
					<p>複数の操作を並行実行することで、全体のスループットを向上させることができます。</p>
				</div>
				<div class="tip-item">
					<h4>📊 監視の重要性</h4>
					<p>本番環境では継続的な性能監視により、パフォーマンスの劣化を早期発見できます。</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.performance-page {
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

	/* Stats Dashboard */
	.stats-dashboard {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: white;
		border-radius: 0.75rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.stat-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: #f3f4f6;
		border-radius: 0.5rem;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		line-height: 1.2;
	}

	.stat-label {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	/* Controls */
	.controls-section {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}

	.control-group {
		margin-bottom: 2rem;
	}

	.control-group:last-child {
		margin-bottom: 0;
	}

	.control-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.scenario-selector {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}

	.scenario-btn {
		padding: 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		text-align: left;
	}

	.scenario-btn:hover {
		border-color: #6366f1;
	}

	.scenario-btn.active {
		border-color: #6366f1;
		background: #eff6ff;
	}

	.scenario-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.scenario-description {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.test-controls {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.test-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.test-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.test-btn.primary {
		background: #6366f1;
		color: white;
	}

	.test-btn.primary:hover:not(:disabled) {
		background: #4f46e5;
	}

	.test-btn.secondary {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
	}

	.test-btn.secondary:hover:not(:disabled) {
		background: #e5e7eb;
	}

	.test-btn.success {
		background: #10b981;
		color: white;
	}

	.test-btn.success:hover:not(:disabled) {
		background: #059669;
	}

	.test-btn.danger {
		background: #ef4444;
		color: white;
	}

	.test-btn.danger:hover:not(:disabled) {
		background: #dc2626;
	}

	/* Chart */
	.chart-section {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}

	.chart-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	.chart-container {
		width: 100%;
		height: 300px;
		margin-bottom: 1rem;
	}

	.performance-chart {
		width: 100%;
		height: 100%;
	}

	.chart-point {
		cursor: pointer;
	}

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.legend-color {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
	}

	.legend-color.success {
		background: #10b981;
	}

	.legend-color.error {
		background: #ef4444;
	}

	/* Results Table */
	.results-section {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}

	.results-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
	}

	.results-table {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr 1fr;
		gap: 0;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.table-header {
		display: contents;
	}

	.header-cell {
		background: #f9fafb;
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		border-bottom: 1px solid #e5e7eb;
	}

	.table-row {
		display: contents;
	}

	.table-row:hover .table-cell {
		background: #f9fafb;
	}

	.table-cell {
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: #1f2937;
		border-bottom: 1px solid #f3f4f6;
	}

	.status-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.status-badge.success {
		background: #dcfce7;
		color: #166534;
	}

	.status-badge.error {
		background: #fef2f2;
		color: #dc2626;
	}

	/* Tips */
	.tips-section {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.tips-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.tips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.tip-item {
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}

	.tip-item h4 {
		font-size: 1rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.75rem;
	}

	.tip-item p {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.6;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}

		.stats-dashboard {
			grid-template-columns: repeat(2, 1fr);
		}

		.test-controls {
			flex-direction: column;
		}

		.results-table {
			grid-template-columns: 1fr;
		}

		.header-cell:nth-child(n+2),
		.table-cell:nth-child(n+2) {
			display: none;
		}
	}
</style>