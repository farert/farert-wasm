<script lang="ts">
	import { Book, Code, Download, Github, ExternalLink, ArrowRight } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Documentation - Farert Svelte Components</title>
	<meta name="description" content="Complete documentation and guides for Farert WebAssembly SDK Svelte components" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center space-x-3 mb-4">
			<div class="bg-indigo-100 p-2 rounded-lg">
				<Book class="w-6 h-6 text-indigo-600" />
			</div>
			<h1 class="text-3xl font-bold text-gray-900">Documentation</h1>
		</div>
		<p class="text-xl text-gray-600 max-w-3xl">
			Complete documentation, guides, and examples for integrating Farert WebAssembly SDK 
			components into your Svelte and SvelteKit applications.
		</p>
	</div>

	<!-- Quick Start Section -->
	<section class="mb-12">
		<div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
			<h2 class="text-2xl font-semibold text-gray-900 mb-4">Quick Start</h2>
			
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-3">インストール</h3>
					<div class="bg-gray-900 rounded-lg p-4 mb-4">
						<code class="text-green-400 text-sm">npm install @farert/svelte-sdk</code>
					</div>
					
					<h3 class="text-lg font-semibold text-gray-900 mb-3">基本的な使用方法</h3>
					<div class="bg-gray-900 rounded-lg p-4">
						<code class="text-green-400 text-sm whitespace-pre">{`<script>
  import { StationSelector } from '@farert/svelte-sdk';
  
  let selectedStation = null;
</script>

<StationSelector
  bind:selectedStation
  on:stationSelected={(event) => {
    console.log('Selected:', event.detail);
  }}
/>`}</code>
					</div>
				</div>
				
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-3">主要な機能</h3>
					<ul class="space-y-2">
						<li class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-blue-600 rounded-full"></div>
							<span class="text-gray-700">駅検索・選択コンポーネント</span>
						</li>
						<li class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-blue-600 rounded-full"></div>
							<span class="text-gray-700">ドラッグ＆ドロップ ルートビルダー</span>
						</li>
						<li class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-blue-600 rounded-full"></div>
							<span class="text-gray-700">詳細な運賃計算結果表示</span>
						</li>
						<li class="flex items-center space-x-2">
							<div class="w-2 h-2 bg-blue-600 rounded-full"></div>
							<span class="text-gray-700">カスタマイズ可能なローディング状態</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<!-- Documentation Sections -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">ドキュメント</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Component Guides -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="flex items-center space-x-3 mb-4">
					<div class="bg-green-100 p-2 rounded-lg">
						<Code class="w-5 h-5 text-green-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900">Component Guides</h3>
				</div>
				
				<div class="space-y-3">
					<a href="/station-selector" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
						<div>
							<h4 class="font-medium text-gray-900">StationSelector</h4>
							<p class="text-sm text-gray-600">駅検索・選択コンポーネント</p>
						</div>
						<ArrowRight class="w-4 h-4 text-gray-400" />
					</a>
					
					<a href="/route-builder" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
						<div>
							<h4 class="font-medium text-gray-900">RouteBuilder</h4>
							<p class="text-sm text-gray-600">ルート作成インターフェース</p>
						</div>
						<ArrowRight class="w-4 h-4 text-gray-400" />
					</a>
					
					<a href="/fare-display" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
						<div>
							<h4 class="font-medium text-gray-900">FareDisplay</h4>
							<p class="text-sm text-gray-600">運賃計算結果表示</p>
						</div>
						<ArrowRight class="w-4 h-4 text-gray-400" />
					</a>
					
					<a href="/loading-spinner" class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
						<div>
							<h4 class="font-medium text-gray-900">LoadingSpinner</h4>
							<p class="text-sm text-gray-600">ローディング状態表示</p>
						</div>
						<ArrowRight class="w-4 h-4 text-gray-400" />
					</a>
				</div>
			</div>
			
			<!-- Integration Guides -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="flex items-center space-x-3 mb-4">
					<div class="bg-blue-100 p-2 rounded-lg">
						<Book class="w-5 h-5 text-blue-600" />
					</div>
					<h3 class="text-lg font-semibold text-gray-900">Integration Guides</h3>
				</div>
				
				<div class="space-y-3">
					<div class="p-3 border border-gray-200 rounded-lg">
						<h4 class="font-medium text-gray-900 mb-1">SvelteKit Integration</h4>
						<p class="text-sm text-gray-600 mb-2">SvelteKitプロジェクトでの使用方法</p>
						<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Coming Soon</span>
					</div>
					
					<div class="p-3 border border-gray-200 rounded-lg">
						<h4 class="font-medium text-gray-900 mb-1">TypeScript Configuration</h4>
						<p class="text-sm text-gray-600 mb-2">TypeScript環境での設定方法</p>
						<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Coming Soon</span>
					</div>
					
					<div class="p-3 border border-gray-200 rounded-lg">
						<h4 class="font-medium text-gray-900 mb-1">WebAssembly Setup</h4>
						<p class="text-sm text-gray-600 mb-2">WebAssemblyモジュール初期化</p>
						<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Coming Soon</span>
					</div>
					
					<div class="p-3 border border-gray-200 rounded-lg">
						<h4 class="font-medium text-gray-900 mb-1">Customization Guide</h4>
						<p class="text-sm text-gray-600 mb-2">スタイルとテーマのカスタマイズ</p>
						<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Coming Soon</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Examples and Resources -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Examples & Resources</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Example App -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-purple-100 p-2 rounded-lg inline-block mb-4">
					<Code class="w-5 h-5 text-purple-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Example App</h3>
				<p class="text-gray-600 text-sm mb-4">
					完全なサンプルアプリケーションでコンポーネントの実用例を確認
				</p>
				<a
					href="https://github.com/ntake/farert-wasm/tree/main/examples/sveltekit-example"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-800 font-medium"
				>
					<span>View on GitHub</span>
					<ExternalLink class="w-4 h-4" />
				</a>
			</div>
			
			<!-- API Reference -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-orange-100 p-2 rounded-lg inline-block mb-4">
					<Book class="w-5 h-5 text-orange-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">API Reference</h3>
				<p class="text-gray-600 text-sm mb-4">
					TypeScript型定義と詳細なAPI仕様書
				</p>
				<div class="text-gray-500 font-medium">
					<span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Coming Soon</span>
				</div>
			</div>
			
			<!-- GitHub Repository -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-gray-100 p-2 rounded-lg inline-block mb-4">
					<Github class="w-5 h-5 text-gray-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Source Code</h3>
				<p class="text-gray-600 text-sm mb-4">
					GitHubリポジトリでソースコードを確認・貢献
				</p>
				<a
					href="https://github.com/ntake/farert-wasm"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium"
				>
					<span>View Repository</span>
					<ExternalLink class="w-4 h-4" />
				</a>
			</div>
		</div>
	</section>

	<!-- Technical Architecture -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">技術アーキテクチャ</h2>
		
		<div class="bg-white rounded-xl border border-gray-200 p-8">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-4">技術スタック</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between py-2">
							<span class="text-gray-700">Frontend Framework</span>
							<span class="font-medium text-gray-900">Svelte 4 + SvelteKit</span>
						</div>
						<div class="flex items-center justify-between py-2">
							<span class="text-gray-700">Type Safety</span>
							<span class="font-medium text-gray-900">TypeScript (strict mode)</span>
						</div>
						<div class="flex items-center justify-between py-2">
							<span class="text-gray-700">Backend Core</span>
							<span class="font-medium text-gray-900">C++ + WebAssembly</span>
						</div>
						<div class="flex items-center justify-between py-2">
							<span class="text-gray-700">Database</span>
							<span class="font-medium text-gray-900">SQLite3 + MEMFS</span>
						</div>
						<div class="flex items-center justify-between py-2">
							<span class="text-gray-700">Build System</span>
							<span class="font-medium text-gray-900">Vite + Emscripten</span>
						</div>
					</div>
				</div>
				
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-4">主要機能</h3>
					<div class="space-y-3">
						<div class="flex items-start space-x-3">
							<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
							<div>
								<p class="font-medium text-gray-900">高速運賃計算</p>
								<p class="text-sm text-gray-600">WebAssemblyによる最適化されたC++コア</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
							<div>
								<p class="font-medium text-gray-900">全国路線データ</p>
								<p class="text-sm text-gray-600">埋め込まれたJR・私鉄データベース</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
							<div>
								<p class="font-medium text-gray-900">リアクティブUI</p>
								<p class="text-sm text-gray-600">Svelteの反応的データバインディング</p>
							</div>
						</div>
						<div class="flex items-start space-x-3">
							<div class="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
							<div>
								<p class="font-medium text-gray-900">型安全性</p>
								<p class="text-sm text-gray-600">完全なTypeScriptサポート</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Support Section -->
	<section class="mb-12">
		<div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8">
			<div class="text-center">
				<h2 class="text-2xl font-semibold text-gray-900 mb-4">サポート・コミュニティ</h2>
				<p class="text-gray-600 mb-6 max-w-2xl mx-auto">
					質問、バグレポート、機能リクエストはGitHubリポジトリのIssuesページで受け付けています。
					コミュニティでの議論も歓迎します。
				</p>
				
				<div class="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href="https://github.com/ntake/farert-wasm/issues"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center justify-center space-x-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
					>
						<Github class="w-5 h-5" />
						<span>Report Issues</span>
					</a>
					<a
						href="https://github.com/ntake/farert-wasm/discussions"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
					>
						<Book class="w-5 h-5" />
						<span>Join Discussions</span>
					</a>
				</div>
			</div>
		</div>
	</section>
</div>