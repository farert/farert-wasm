<script lang="ts">
	import { onMount } from 'svelte';
	import { Code, Play, Copy, CheckCircle, BarChart3, Clock, Zap, Database } from 'lucide-svelte';
	import { farertStore, isReady } from '$lib/stores/farert-store';

	// Example categories
	const exampleCategories = [
		{
			id: 'basic',
			title: '基本的な使用例',
			icon: Code,
			description: 'SDKの基本機能を学ぶための簡単な例'
		},
		{
			id: 'advanced',
			title: '高度な機能',
			icon: Zap,
			description: 'パフォーマンス最適化と複雑な計算例'
		},
		{
			id: 'performance',
			title: 'パフォーマンス測定',
			icon: BarChart3,
			description: 'SDK の性能評価と最適化テクニック'
		}
	];

	// Code examples with executable demos
	const codeExamples = [
		{
			category: 'basic',
			title: '駅情報の取得',
			description: '駅IDから駅情報を取得する基本的な例',
			code: `// 駅IDから駅情報を取得
const stationId = 1130101; // 東京駅
const station = await farertStore.getStationById(stationId);

console.log('駅名:', station.name);
console.log('正式名称:', station.nameEx);
console.log('読み方:', station.kana);
console.log('所在地:', station.prefecture);`,
			executable: true,
			demoFunction: async () => {
				const station = await farertStore.getStationById(1130101);
				return {
					result: station,
					output: `駅名: ${station?.name}\n正式名称: ${station?.nameEx}\n読み方: ${station?.kana}\n所在地: ${station?.prefecture}`
				};
			}
		},
		{
			category: 'basic',
			title: '駅名検索',
			description: '駅名から候補を検索する例',
			code: `// 駅名で検索
const query = '新宿';
const stations = await farertStore.searchStations(query);

console.log(\`"\${query}"の検索結果: \${stations.length}件\`);
stations.forEach(station => {
  console.log(\`- \${station.name} (ID: \${station.id})\`);
});`,
			executable: true,
			demoFunction: async () => {
				const stations = await farertStore.searchStations('新宿');
				return {
					result: stations,
					output: `"新宿"の検索結果: ${stations.length}件\n${stations.map(s => `- ${s.name} (ID: ${s.id})`).join('\n')}`
				};
			}
		},
		{
			category: 'basic',
			title: '基本的な運賃計算',
			description: '2駅間の運賃を計算する例',
			code: `// 東京→横浜の運賃計算
const route = [
  { stationId: 1130101, stationName: '東京' },
  { stationId: 1130123, stationName: '横浜' }
];

const result = await farertStore.calculateFare(route);
console.log(\`運賃: ¥\${result.fareInfo.fare}\`);
console.log(\`計算時間: \${result.calculationTimeMs}ms\`);`,
			executable: true,
			demoFunction: async () => {
				const route = [
					{ stationId: 1130101, stationName: '東京' },
					{ stationId: 1130123, stationName: '横浜' }
				];
				const result = await farertStore.calculateFare(route);
				return {
					result: result,
					output: `運賃: ¥${result.fareInfo.fare}\n計算時間: ${result.calculationTimeMs.toFixed(2)}ms\n距離: ${result.fareInfo.distance || 'N/A'}km`
				};
			}
		},
		{
			category: 'advanced',
			title: '複数経由駅のルート計算',
			description: '複数の経由駅を含む複雑なルート',
			code: `// 東京→新宿→渋谷→横浜のルート
const complexRoute = [
  { stationId: 1130101, stationName: '東京' },
  { stationId: 1130222, stationName: '新宿' },
  { stationId: 1130301, stationName: '渋谷' },
  { stationId: 1130123, stationName: '横浜' }
];

const result = await farertStore.calculateFare(complexRoute);
console.log(\`総運賃: ¥\${result.fareInfo.fare}\`);
console.log(\`経由駅数: \${complexRoute.length - 2}\`);`,
			executable: true,
			demoFunction: async () => {
				const route = [
					{ stationId: 1130101, stationName: '東京' },
					{ stationId: 1130222, stationName: '新宿' },
					{ stationId: 1130301, stationName: '渋谷' },
					{ stationId: 1130123, stationName: '横浜' }
				];
				const result = await farertStore.calculateFare(route);
				return {
					result: result,
					output: `総運賃: ¥${result.fareInfo.fare}\n経由駅数: ${route.length - 2}\n計算時間: ${result.calculationTimeMs.toFixed(2)}ms`
				};
			}
		},
		{
			category: 'performance',
			title: 'バッチ処理性能測定',
			description: '複数の計算を連続実行して性能を測定',
			code: `// 複数ルートの連続計算でパフォーマンス測定
const routes = [
  [{ stationId: 1130101, stationName: '東京' }, { stationId: 1130123, stationName: '横浜' }],
  [{ stationId: 1130222, stationName: '新宿' }, { stationId: 1130301, stationName: '渋谷' }],
  [{ stationId: 1130107, stationName: '品川' }, { stationId: 1130222, stationName: '新宿' }]
];

const startTime = performance.now();
const results = await Promise.all(
  routes.map(route => farertStore.calculateFare(route))
);
const totalTime = performance.now() - startTime;

console.log(\`\${routes.length}件の計算完了\`);
console.log(\`総時間: \${totalTime.toFixed(2)}ms\`);
console.log(\`平均時間: \${(totalTime / routes.length).toFixed(2)}ms\`);`,
			executable: true,
			demoFunction: async () => {
				const routes = [
					[{ stationId: 1130101, stationName: '東京' }, { stationId: 1130123, stationName: '横浜' }],
					[{ stationId: 1130222, stationName: '新宿' }, { stationId: 1130301, stationName: '渋谷' }],
					[{ stationId: 1130107, stationName: '品川' }, { stationId: 1130222, stationName: '新宿' }]
				];

				const startTime = performance.now();
				const results = await Promise.all(
					routes.map(route => farertStore.calculateFare(route))
				);
				const totalTime = performance.now() - startTime;

				return {
					result: results,
					output: `${routes.length}件の計算完了\n総時間: ${totalTime.toFixed(2)}ms\n平均時間: ${(totalTime / routes.length).toFixed(2)}ms\n最大運賃: ¥${Math.max(...results.map(r => r.fareInfo.fare))}`
				};
			}
		}
	];

	// State
	let selectedCategory = 'basic';
	let runningExample: string | null = null;
	let exampleResults: Record<string, { output: string; success: boolean; time: number }> = {};
	let copiedCode: string | null = null;

	// Filter examples by category
	$: filteredExamples = codeExamples.filter(example => example.category === selectedCategory);

	async function runExample(example: typeof codeExamples[0]) {
		if (!$isReady || !example.executable) return;

		runningExample = example.title;
		const startTime = performance.now();

		try {
			const result = await example.demoFunction();
			const endTime = performance.now();

			exampleResults[example.title] = {
				output: result.output,
				success: true,
				time: endTime - startTime
			};
		} catch (error) {
			const endTime = performance.now();
			exampleResults[example.title] = {
				output: `エラー: ${error instanceof Error ? error.message : String(error)}`,
				success: false,
				time: endTime - startTime
			};
		} finally {
			runningExample = null;
		}
	}

	async function copyCode(code: string) {
		try {
			await navigator.clipboard.writeText(code);
			copiedCode = code;
			setTimeout(() => {
				copiedCode = null;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy code:', error);
		}
	}

	function formatTime(ms: number): string {
		if (ms < 1000) return `${ms.toFixed(1)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}
</script>

<svelte:head>
	<title>SDK Examples | Farert SDK</title>
	<meta name="description" content="Farert WebAssembly SDKの使用例とパフォーマンス測定。実際にコードを実行して結果を確認できます。" />
</svelte:head>

<div class="examples-page">
	<div class="container py-8">
		<!-- Page Header -->
		<div class="page-header">
			<h1 class="page-title">
				<Code class="w-8 h-8" />
				SDK Examples
			</h1>
			<p class="page-description">
				Farert WebAssembly SDKの機能を実際のコード例で学びましょう。
				各例は実行可能で、リアルタイムで結果を確認できます。
			</p>
		</div>

		<!-- Category Navigation -->
		<div class="category-nav">
			{#each exampleCategories as category}
				<button
					type="button"
					on:click={() => selectedCategory = category.id}
					class="category-btn {selectedCategory === category.id ? 'active' : ''}"
				>
					<svelte:component this={category.icon} class="w-5 h-5" />
					<div class="category-info">
						<div class="category-title">{category.title}</div>
						<div class="category-description">{category.description}</div>
					</div>
				</button>
			{/each}
		</div>

		<!-- SDK Status -->
		{#if !$isReady}
			<div class="sdk-status">
				<Clock class="w-5 h-5 animate-spin" />
				<span>WebAssembly SDKの初期化中...</span>
			</div>
		{/if}

		<!-- Examples Grid -->
		<div class="examples-grid">
			{#each filteredExamples as example}
				<div class="example-card">
					<div class="example-header">
						<div class="example-info">
							<h3 class="example-title">{example.title}</h3>
							<p class="example-description">{example.description}</p>
						</div>
						
						<div class="example-actions">
							{#if example.executable}
								<button
									type="button"
									on:click={() => runExample(example)}
									disabled={!$isReady || runningExample === example.title}
									class="action-btn run-btn"
									title="コードを実行"
								>
									{#if runningExample === example.title}
										<Clock class="w-4 h-4 animate-spin" />
									{:else}
										<Play class="w-4 h-4" />
									{/if}
								</button>
							{/if}
							
							<button
								type="button"
								on:click={() => copyCode(example.code)}
								class="action-btn copy-btn"
								title="コードをコピー"
							>
								{#if copiedCode === example.code}
									<CheckCircle class="w-4 h-4 text-green-500" />
								{:else}
									<Copy class="w-4 h-4" />
								{/if}
							</button>
						</div>
					</div>

					<div class="code-container">
						<pre class="code-block"><code>{example.code}</code></pre>
					</div>

					{#if exampleResults[example.title]}
						<div class="result-container">
							<div class="result-header">
								<span class="result-label">実行結果</span>
								<span class="result-time">
									{formatTime(exampleResults[example.title].time)}
								</span>
							</div>
							<div class="result-output {exampleResults[example.title].success ? 'success' : 'error'}">
								{exampleResults[example.title].output}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Performance Tips -->
		{#if selectedCategory === 'performance'}
			<div class="performance-tips">
				<h2 class="tips-title">
					<Zap class="w-6 h-6" />
					パフォーマンス最適化のヒント
				</h2>
				
				<div class="tips-grid">
					<div class="tip-card">
						<Database class="w-8 h-8 text-blue-600" />
						<h3>キャッシュ活用</h3>
						<p>同じ駅やルートの検索結果はキャッシュされます。連続した検索では大幅な性能向上が期待できます。</p>
					</div>
					
					<div class="tip-card">
						<BarChart3 class="w-8 h-8 text-green-600" />
						<h3>バッチ処理</h3>
						<p>複数の計算を並行実行することで、全体の処理時間を短縮できます。Promise.allを活用しましょう。</p>
					</div>
					
					<div class="tip-card">
						<Clock class="w-8 h-8 text-purple-600" />
						<h3>レスポンス最適化</h3>
						<p>UI更新前にローディング状態を表示し、WebAssembly計算の完了を待つことでUXを向上させます。</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Integration Guide -->
		<div class="integration-guide">
			<h2 class="guide-title">SvelteKitプロジェクトへの組み込み</h2>
			
			<div class="guide-steps">
				<div class="step">
					<div class="step-number">1</div>
					<div class="step-content">
						<h3>SDKのインポート</h3>
						<pre class="step-code"><code>import &#123; farertStore, isReady &#125; from '$lib/stores/farert-store';</code></pre>
					</div>
				</div>
				
				<div class="step">
					<div class="step-number">2</div>
					<div class="step-content">
						<h3>初期化状態の監視</h3>
						<pre class="step-code"><code>$: if ($isReady) &#123;
  // SDK準備完了後の処理
&#125;</code></pre>
					</div>
				</div>
				
				<div class="step">
					<div class="step-number">3</div>
					<div class="step-content">
						<h3>非同期関数の実行</h3>
						<pre class="step-code"><code>async function searchStation() &#123;
  const results = await farertStore.searchStations(query);
  // 結果の処理
&#125;</code></pre>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.examples-page {
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
		line-height: 1.7;
	}

	/* Category Navigation */
	.category-nav {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 3rem;
	}

	.category-btn {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		text-align: left;
	}

	.category-btn:hover {
		border-color: #6366f1;
		transform: translateY(-2px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.category-btn.active {
		border-color: #6366f1;
		background: #eff6ff;
	}

	.category-info {
		flex: 1;
	}

	.category-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.category-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
	}

	/* SDK Status */
	.sdk-status {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1rem;
		background: #fef3c7;
		border: 1px solid #f59e0b;
		border-radius: 0.5rem;
		color: #92400e;
		margin-bottom: 2rem;
		font-size: 0.875rem;
	}

	/* Examples Grid */
	.examples-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.example-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.example-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.example-info {
		flex: 1;
	}

	.example-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.5rem;
	}

	.example-description {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.5;
	}

	.example-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.action-btn:hover {
		background: #f9fafb;
	}

	.run-btn {
		color: #059669;
		border-color: #059669;
	}

	.run-btn:hover:not(:disabled) {
		background: #ecfdf5;
	}

	.run-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.copy-btn {
		color: #6b7280;
	}

	.copy-btn:hover {
		color: #374151;
	}

	.code-container {
		background: #1f2937;
		padding: 1.5rem;
	}

	.code-block {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #d1d5db;
		margin: 0;
		overflow-x: auto;
	}

	.result-container {
		border-top: 1px solid #e5e7eb;
	}

	.result-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: #f9fafb;
		border-bottom: 1px solid #e5e7eb;
	}

	.result-label {
		font-size: 0.875rem;
		font-weight: 500;
		color: #374151;
	}

	.result-time {
		font-size: 0.75rem;
		color: #6b7280;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
	}

	.result-output {
		padding: 1rem 1.5rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	.result-output.success {
		background: #f0fdf4;
		color: #166534;
		border-left: 4px solid #22c55e;
	}

	.result-output.error {
		background: #fef2f2;
		color: #dc2626;
		border-left: 4px solid #ef4444;
	}

	/* Performance Tips */
	.performance-tips {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		margin-bottom: 3rem;
	}

	.tips-title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 2rem;
	}

	.tips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.tip-card {
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.75rem;
		text-align: center;
	}

	.tip-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin: 1rem 0 0.75rem 0;
	}

	.tip-card p {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.6;
	}

	/* Integration Guide */
	.integration-guide {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
	}

	.guide-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 2rem;
		text-align: center;
	}

	.guide-steps {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.step {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		background: #6366f1;
		color: white;
		border-radius: 50%;
		font-weight: 600;
		flex-shrink: 0;
	}

	.step-content {
		flex: 1;
	}

	.step-content h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 0.75rem;
	}

	.step-code {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.375rem;
		padding: 1rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		color: #374151;
		margin: 0;
		overflow-x: auto;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}

		.examples-grid {
			grid-template-columns: 1fr;
		}

		.category-nav {
			grid-template-columns: 1fr;
		}

		.example-header {
			flex-direction: column;
			gap: 1rem;
		}

		.step {
			flex-direction: column;
			text-align: center;
		}
	}
</style>