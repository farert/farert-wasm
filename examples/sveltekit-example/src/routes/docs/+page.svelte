<script lang="ts">
	import { BookOpen, Code, Download, ExternalLink, CheckCircle, ArrowRight } from 'lucide-svelte';

	// Documentation sections
	const documentationSections = [
		{
			id: 'getting-started',
			title: 'はじめに',
			description: 'SDKの基本的なセットアップと初期化',
			sections: [
				{
					title: 'インストール',
					content: `
# npm
npm install farert-wasm-sdk

# yarn
yarn add farert-wasm-sdk

# pnpm
pnpm add farert-wasm-sdk`
				},
				{
					title: 'SvelteKitでの基本セットアップ',
					content: `// app.html
<script>
  // WebAssembly サポートの確認
  if (typeof WebAssembly === 'undefined') {
    console.error('WebAssembly is not supported in this browser');
  }
</script>

// +layout.svelte
<script>
  import { farertStore } from '$lib/stores/farert-store';
  import { onMount } from 'svelte';

  onMount(async () => {
    await farertStore.initialize({
      enableCache: true,
      debugMode: false
    });
  });
</script>`
				}
			]
		},
		{
			id: 'api-reference',
			title: 'API リファレンス',
			description: 'すべてのSDK関数とメソッドの詳細',
			sections: [
				{
					title: 'farertStore',
					content: `// SDK の初期化
await farertStore.initialize(config?: FarertStoreConfig)

// 駅検索
const stations = await farertStore.searchStations(query: string)

// 駅情報取得
const station = await farertStore.getStationById(id: number)

// ルート計算
const result = await farertStore.calculateFare(route: RouteSegment[])

// キャッシュクリア
farertStore.clearCache()

// エラー状態クリア
farertStore.clearError()`
				},
				{
					title: 'Reactive Stores',
					content: `import { 
  isReady,     // boolean - SDK準備完了状態
  isLoading,   // boolean - 初期化中状態
  hasError,    // boolean - エラー発生状態
  currentError // CLIError | null - 現在のエラー
} from '$lib/stores/farert-store';

// 使用例
$: if ($isReady) {
  console.log('SDK is ready to use');
}

$: if ($hasError) {
  console.error('SDK error:', $currentError?.message);
}`
				}
			]
		},
		{
			id: 'types',
			title: '型定義',
			description: 'TypeScript型定義とインターフェース',
			sections: [
				{
					title: 'StationSearchResult',
					content: `interface StationSearchResult {
  id: number;           // 駅ID
  name: string;         // 駅名
  nameEx: string;       // 正式駅名
  kana: string;         // ひらがな読み
  prefecture: string;   // 都道府県
}`
				},
				{
					title: 'RouteSegment',
					content: `interface RouteSegment {
  stationId: number;    // 駅ID
  stationName: string;  // 駅名
  lineId?: number;      // 路線ID（オプショナル）
  lineName?: string;    // 路線名（オプショナル）
}`
				},
				{
					title: 'FareCalculationResult',
					content: `interface FareCalculationResult {
  fareInfo: FareInfoData;        // 運賃詳細情報
  route: RouteSegment[];         // 使用されたルート
  calculatedAt: Date;            // 計算実行日時
  calculationTimeMs: number;     // 計算にかかった時間（ミリ秒）
}

interface FareInfoData {
  fare: number;                  // 運賃
  distance?: number;             // 距離（km）
  rule114Applied?: boolean;      // 特定運賃規則適用
  availCountForFareOfStockDiscount: number; // 割引運賃の種類数
  // その他の運賃計算詳細...
}`
				}
			]
		},
		{
			id: 'examples',
			title: '実用例',
			description: '一般的な使用パターンとベストプラクティス',
			sections: [
				{
					title: '駅検索フォーム',
					content: `<script>
  import { farertStore, isReady } from '$lib/stores/farert-store';
  
  let query = '';
  let results = [];
  let searching = false;

  async function searchStations() {
    if (!$isReady || !query.trim()) return;
    
    searching = true;
    try {
      results = await farertStore.searchStations(query);
    } catch (error) {
      console.error('Search failed:', error);
      results = [];
    } finally {
      searching = false;
    }
  }
</script>

<input 
  bind:value={query}
  on:input={searchStations}
  placeholder="駅名を入力"
  disabled={!$isReady}
/>

{#if searching}
  <p>検索中...</p>
{:else if results.length > 0}
  <ul>
    {#each results as station}
      <li>{station.name} ({station.prefecture})</li>
    {/each}
  </ul>
{/if}`
				},
				{
					title: 'ルート計算コンポーネント',
					content: `<script>
  import { farertStore, isReady } from '$lib/stores/farert-store';
  
  let fromStation = null;
  let toStation = null;
  let fareResult = null;
  let calculating = false;

  async function calculateFare() {
    if (!fromStation || !toStation) return;
    
    calculating = true;
    try {
      const route = [
        { stationId: fromStation.id, stationName: fromStation.name },
        { stationId: toStation.id, stationName: toStation.name }
      ];
      
      fareResult = await farertStore.calculateFare(route);
    } catch (error) {
      console.error('Calculation failed:', error);
    } finally {
      calculating = false;
    }
  }
</script>

<!-- 駅選択UI -->
<div>
  <StationSelector bind:station={fromStation} placeholder="出発駅" />
  <StationSelector bind:station={toStation} placeholder="到着駅" />
  
  <button 
    on:click={calculateFare}
    disabled={!$isReady || !fromStation || !toStation || calculating}
  >
    {calculating ? '計算中...' : '運賃計算'}
  </button>
</div>

<!-- 結果表示 -->
{#if fareResult}
  <div class="result">
    <h3>運賃: ¥{fareResult.fareInfo.fare}</h3>
    <p>計算時間: {fareResult.calculationTimeMs.toFixed(2)}ms</p>
  </div>
{/if}`
				}
			]
		},
		{
			id: 'performance',
			title: 'パフォーマンス',
			description: '最適化とベストプラクティス',
			sections: [
				{
					title: 'キャッシュ戦略',
					content: `// キャッシュを有効にして初期化
await farertStore.initialize({
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5分
});

// 同じクエリは自動的にキャッシュされる
const result1 = await farertStore.searchStations('東京');
const result2 = await farertStore.searchStations('東京'); // キャッシュから高速取得

// 手動でキャッシュをクリア
farertStore.clearCache();`
				},
				{
					title: 'バッチ処理',
					content: `// 複数の計算を並行実行
const routes = [
  [{ stationId: 1, stationName: '東京' }, { stationId: 2, stationName: '横浜' }],
  [{ stationId: 3, stationName: '新宿' }, { stationId: 4, stationName: '渋谷' }]
];

const results = await Promise.all(
  routes.map(route => farertStore.calculateFare(route))
);

console.log('すべての計算完了:', results);`
				},
				{
					title: 'エラーハンドリング',
					content: `import { currentError, hasError } from '$lib/stores/farert-store';

// グローバルエラー監視
$: if ($hasError) {
  console.error('SDK Error:', $currentError?.message);
  // ユーザーにエラーを表示
  showErrorToast($currentError?.message);
}

// 個別処理でのエラーハンドリング
try {
  const result = await farertStore.calculateFare(route);
} catch (error) {
  if (error.code === 'INVALID_STATION_NAME') {
    // 駅名が無効
  } else if (error.code === 'ROUTE_CALC_FAILED') {
    // ルート計算失敗
  }
}`
				}
			]
		}
	];

	let activeSection = 'getting-started';

	function scrollToSection(sectionId: string) {
		activeSection = sectionId;
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<svelte:head>
	<title>Documentation | Farert SDK</title>
	<meta name="description" content="Farert WebAssembly SDKの包括的なドキュメント。API リファレンス、使用例、ベストプラクティスを提供します。" />
</svelte:head>

<div class="docs-page">
	<div class="docs-layout">
		<!-- Sidebar Navigation -->
		<nav class="docs-nav">
			<div class="nav-header">
				<BookOpen class="w-5 h-5" />
				<h2>Documentation</h2>
			</div>
			
			<div class="nav-sections">
				{#each documentationSections as section}
					<button
						type="button"
						on:click={() => scrollToSection(section.id)}
						class="nav-item {activeSection === section.id ? 'active' : ''}"
					>
						<div class="nav-item-content">
							<div class="nav-item-title">{section.title}</div>
							<div class="nav-item-description">{section.description}</div>
						</div>
						<ArrowRight class="w-4 h-4 nav-arrow" />
					</button>
				{/each}
			</div>

			<!-- Quick Links -->
			<div class="quick-links">
				<h3>クイックリンク</h3>
				<a href="/examples" class="quick-link">
					<Code class="w-4 h-4" />
					ライブ例
				</a>
				<a href="https://github.com/ntake/farert-wasm" target="_blank" rel="noopener noreferrer" class="quick-link">
					<ExternalLink class="w-4 h-4" />
					GitHub リポジトリ
				</a>
				<a href="/performance" class="quick-link">
					<CheckCircle class="w-4 h-4" />
					パフォーマンス
				</a>
			</div>
		</nav>

		<!-- Main Content -->
		<main class="docs-content">
			{#each documentationSections as section}
				<section id={section.id} class="content-section">
					<div class="section-header">
						<h1 class="section-title">{section.title}</h1>
						<p class="section-description">{section.description}</p>
					</div>

					{#each section.sections as subsection}
						<div class="subsection">
							<h2 class="subsection-title">{subsection.title}</h2>
							<div class="code-block-container">
								<pre class="code-block"><code>{subsection.content.trim()}</code></pre>
								<button 
									type="button"
									on:click={() => navigator.clipboard.writeText(subsection.content.trim())}
									class="copy-button"
									title="コードをコピー"
								>
									<Code class="w-4 h-4" />
								</button>
							</div>
						</div>
					{/each}
				</section>
			{/each}

			<!-- Footer -->
			<footer class="docs-footer">
				<div class="footer-content">
					<h3>追加リソース</h3>
					<div class="footer-links">
						<a href="/examples" class="footer-link">
							実行可能な例を見る
						</a>
						<a href="/performance" class="footer-link">
							パフォーマンス測定
						</a>
						<a href="https://github.com/ntake/farert-wasm/issues" target="_blank" rel="noopener noreferrer" class="footer-link">
							問題を報告
						</a>
					</div>
					
					<div class="footer-note">
						<p>
							このSDKは日本の鉄道運賃計算のためのWebAssemblyベースのソリューションです。
							詳細な技術仕様や貢献方法については、GitHubリポジトリをご覧ください。
						</p>
					</div>
				</div>
			</footer>
		</main>
	</div>
</div>

<style>
	.docs-page {
		min-height: calc(100vh - 200px);
		background: #f9fafb;
	}

	.docs-layout {
		display: grid;
		grid-template-columns: 300px 1fr;
		max-width: 1400px;
		margin: 0 auto;
		gap: 2rem;
		padding: 2rem;
	}

	/* Navigation Sidebar */
	.docs-nav {
		background: white;
		border-radius: 1rem;
		padding: 1.5rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		height: fit-content;
		position: sticky;
		top: 2rem;
	}

	.nav-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.nav-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0;
	}

	.nav-sections {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 2rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 1rem;
		border: none;
		border-radius: 0.5rem;
		background: transparent;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
		text-align: left;
	}

	.nav-item:hover {
		background: #f3f4f6;
	}

	.nav-item.active {
		background: #eff6ff;
		border: 1px solid #dbeafe;
	}

	.nav-item-content {
		flex: 1;
	}

	.nav-item-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.nav-item-description {
		font-size: 0.75rem;
		color: #6b7280;
		line-height: 1.4;
	}

	.nav-arrow {
		color: #9ca3af;
		transition: transform 0.2s ease-in-out;
	}

	.nav-item.active .nav-arrow {
		transform: rotate(90deg);
		color: #6366f1;
	}

	/* Quick Links */
	.quick-links {
		border-top: 1px solid #e5e7eb;
		padding-top: 1rem;
	}

	.quick-links h3 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 1rem;
	}

	.quick-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		border-radius: 0.375rem;
		transition: all 0.2s ease-in-out;
		margin-bottom: 0.25rem;
	}

	.quick-link:hover {
		background: #f3f4f6;
		color: #374151;
	}

	/* Main Content */
	.docs-content {
		background: white;
		border-radius: 1rem;
		padding: 3rem;
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
		min-height: calc(100vh - 300px);
	}

	.content-section {
		margin-bottom: 4rem;
		scroll-margin-top: 2rem;
	}

	.content-section:last-child {
		margin-bottom: 2rem;
	}

	.section-header {
		margin-bottom: 3rem;
		padding-bottom: 1.5rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.section-description {
		font-size: 1.125rem;
		color: #6b7280;
		line-height: 1.6;
	}

	.subsection {
		margin-bottom: 3rem;
	}

	.subsection-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.code-block-container {
		position: relative;
		background: #1f2937;
		border-radius: 0.75rem;
		overflow: hidden;
	}

	.code-block {
		padding: 2rem;
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #d1d5db;
		margin: 0;
		overflow-x: auto;
	}

	.copy-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 0.375rem;
		color: #d1d5db;
		cursor: pointer;
		transition: all 0.2s ease-in-out;
	}

	.copy-button:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	/* Footer */
	.docs-footer {
		margin-top: 4rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.footer-content h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin-bottom: 1rem;
	}

	.footer-links {
		display: flex;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.footer-link {
		color: #6366f1;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 500;
		transition: color 0.2s ease-in-out;
	}

	.footer-link:hover {
		color: #4f46e5;
		text-decoration: underline;
	}

	.footer-note {
		background: #f9fafb;
		border-radius: 0.5rem;
		padding: 1.5rem;
		border: 1px solid #e5e7eb;
	}

	.footer-note p {
		font-size: 0.875rem;
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.docs-layout {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.docs-nav {
			position: static;
			order: 2;
		}

		.docs-content {
			order: 1;
			padding: 2rem;
		}

		.section-title {
			font-size: 2rem;
		}
	}

	@media (max-width: 768px) {
		.docs-layout {
			padding: 1rem;
		}

		.docs-content {
			padding: 1.5rem;
		}

		.section-title {
			font-size: 1.75rem;
		}

		.footer-links {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>