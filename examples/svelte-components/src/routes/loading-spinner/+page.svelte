<script lang="ts">
	import { Loader, Circle, MoreHorizontal, RotateCw, Copy } from 'lucide-svelte';
	
	let selectedSpinner = 'default';
	let selectedSize = 'medium';
	let selectedColor = 'blue';
	let showText = true;
	let customText = 'ルートを計算しています...';
	
	const spinnerTypes = [
		{ id: 'default', name: 'Default', description: 'Standard rotating spinner' },
		{ id: 'dots', name: 'Dots', description: 'Three bouncing dots animation' },
		{ id: 'pulse', name: 'Pulse', description: 'Pulsing circle animation' },
		{ id: 'bars', name: 'Bars', description: 'Animated bars loading indicator' }
	];
	
	const sizes = [
		{ id: 'small', name: 'Small', class: 'w-4 h-4' },
		{ id: 'medium', name: 'Medium', class: 'w-8 h-8' },
		{ id: 'large', name: 'Large', class: 'w-12 h-12' }
	];
	
	const colors = [
		{ id: 'blue', name: 'Blue', class: 'text-blue-600' },
		{ id: 'green', name: 'Green', class: 'text-green-600' },
		{ id: 'purple', name: 'Purple', class: 'text-purple-600' },
		{ id: 'gray', name: 'Gray', class: 'text-gray-600' }
	];
	
	// Code examples
	const basicUsageCode = `<script>
  import { LoadingSpinner } from '@farert/svelte-sdk';
  
  let isLoading = false;
<\/script>

{#if isLoading}
  <LoadingSpinner text="ルートを計算しています..." />
{/if}`;

	const advancedUsageCode = `<script>
  import { LoadingSpinner } from '@farert/svelte-sdk';
  
  let isLoading = false;
  let progress = 0;
<\/script>

<LoadingSpinner
  type="pulse"
  size="large"
  color="blue"
  text="駅情報を読み込み中..."
  showProgress={true}
  progress={progress}
  overlay={true}
  on:timeout={() => console.log('Loading timeout')}
/>`;

	let copiedCode = '';
	
	function copyCode(code: string, type: string) {
		navigator.clipboard.writeText(code);
		copiedCode = type;
		setTimeout(() => {
			copiedCode = '';
		}, 2000);
	}
	
	function getSpinnerClass() {
		const size = sizes.find(s => s.id === selectedSize)?.class || 'w-8 h-8';
		const color = colors.find(c => c.id === selectedColor)?.class || 'text-blue-600';
		return `${size} ${color}`;
	}
</script>

<svelte:head>
	<title>LoadingSpinner - Farert Svelte Components</title>
	<meta name="description" content="Customizable loading spinners and indicators for Japanese railway fare calculation applications" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center space-x-3 mb-4">
			<div class="bg-orange-100 p-2 rounded-lg">
				<Loader class="w-6 h-6 text-orange-600" />
			</div>
			<h1 class="text-3xl font-bold text-gray-900">LoadingSpinner</h1>
		</div>
		<p class="text-xl text-gray-600 max-w-3xl">
			Customizable loading indicators with multiple styles, sizes, and colors. 
			Perfect for providing visual feedback during WebAssembly calculations and data loading.
		</p>
	</div>

	<!-- Live Demo Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">Interactive Demo</h2>
		
		<div class="bg-white rounded-xl border border-gray-200 p-6">
			<div class="max-w-4xl mx-auto">
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					<!-- Controls -->
					<div class="space-y-6">
						<h3 class="text-lg font-semibold text-gray-900">設定</h3>
						
						<!-- Spinner Type -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">スピナーの種類</label>
							<div class="space-y-2">
								{#each spinnerTypes as type}
									<label class="flex items-center space-x-3">
										<input
											type="radio"
											bind:group={selectedSpinner}
											value={type.id}
											class="text-blue-600 focus:ring-blue-500"
										/>
										<div>
											<span class="font-medium text-gray-900">{type.name}</span>
											<p class="text-sm text-gray-500">{type.description}</p>
										</div>
									</label>
								{/each}
							</div>
						</div>
						
						<!-- Size -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">サイズ</label>
							<div class="flex space-x-4">
								{#each sizes as size}
									<label class="flex items-center space-x-2">
										<input
											type="radio"
											bind:group={selectedSize}
											value={size.id}
											class="text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm text-gray-900">{size.name}</span>
									</label>
								{/each}
							</div>
						</div>
						
						<!-- Color -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">カラー</label>
							<div class="flex space-x-4">
								{#each colors as color}
									<label class="flex items-center space-x-2">
										<input
											type="radio"
											bind:group={selectedColor}
											value={color.id}
											class="text-blue-600 focus:ring-blue-500"
										/>
										<span class="text-sm text-gray-900">{color.name}</span>
									</label>
								{/each}
							</div>
						</div>
						
						<!-- Text Options -->
						<div>
							<label class="flex items-center space-x-2 mb-3">
								<input
									type="checkbox"
									bind:checked={showText}
									class="text-blue-600 focus:ring-blue-500 rounded"
								/>
								<span class="text-sm font-medium text-gray-700">テキストを表示</span>
							</label>
							
							{#if showText}
								<input
									type="text"
									bind:value={customText}
									placeholder="ローディングテキスト..."
									class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
								/>
							{/if}
						</div>
					</div>
					
					<!-- Preview -->
					<div class="flex items-center justify-center">
						<div class="bg-gray-50 rounded-xl p-12 min-h-[300px] flex flex-col items-center justify-center">
							<div class="flex flex-col items-center space-y-4">
								<!-- Spinner Display -->
								{#if selectedSpinner === 'default'}
									<Loader class="{getSpinnerClass()} animate-spin" />
								{:else if selectedSpinner === 'dots'}
									<div class="flex space-x-1">
										<div class="w-2 h-2 {colors.find(c => c.id === selectedColor)?.class || 'text-blue-600'} bg-current rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
										<div class="w-2 h-2 {colors.find(c => c.id === selectedColor)?.class || 'text-blue-600'} bg-current rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
										<div class="w-2 h-2 {colors.find(c => c.id === selectedColor)?.class || 'text-blue-600'} bg-current rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
									</div>
								{:else if selectedSpinner === 'pulse'}
									<Circle class="{getSpinnerClass()} animate-pulse" />
								{:else if selectedSpinner === 'bars'}
									<div class="flex items-end space-x-1">
										<div class="w-1 h-8 {colors.find(c => c.id === selectedColor)?.class || 'text-blue-600'} bg-current animate-pulse" style="animation-delay: 0ms;"></div>
										<div class="w-1 h-6 {colors.find(c => c.id === selectedColor)?.class || 'text-blue-600'} bg-current animate-pulse" style="animation-delay: 150ms;"></div>
										<div class="w-1 h-4 {colors.find(c => c.id === selectedColor)?.class || 'text-blue-600'} bg-current animate-pulse" style="animation-delay: 300ms;"></div>
										<div class="w-1 h-6 {colors.find(c => c.id === selectedColor)?.class || 'text-blue-600'} bg-current animate-pulse" style="animation-delay: 450ms;"></div>
									</div>
								{/if}
								
								{#if showText && customText}
									<p class="text-gray-700 text-center mt-4">{customText}</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Loading States Examples -->
	<section class="mb-12">
		<h2 class="text-2xl font-semibold text-gray-900 mb-6">利用シーン</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			<!-- Station Search -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="flex items-center space-x-3 mb-4">
					<div class="bg-blue-100 p-2 rounded-lg">
						<Loader class="w-5 h-5 text-blue-600 animate-spin" />
					</div>
					<h3 class="font-semibold text-gray-900">駅検索中</h3>
				</div>
				<p class="text-gray-600 text-sm mb-3">
					ユーザーが駅名を入力した際の検索処理中に表示
				</p>
				<div class="bg-gray-50 p-3 rounded-lg">
					<p class="text-sm text-gray-700">駅を検索しています...</p>
				</div>
			</div>
			
			<!-- Route Calculation -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="flex items-center space-x-3 mb-4">
					<div class="bg-green-100 p-2 rounded-lg">
						<RotateCw class="w-5 h-5 text-green-600 animate-spin" />
					</div>
					<h3 class="font-semibold text-gray-900">運賃計算中</h3>
				</div>
				<p class="text-gray-600 text-sm mb-3">
					WebAssemblyでの運賃計算処理中に表示
				</p>
				<div class="bg-gray-50 p-3 rounded-lg">
					<p class="text-sm text-gray-700">ルートを計算しています...</p>
				</div>
			</div>
			
			<!-- Data Loading -->
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="flex items-center space-x-3 mb-4">
					<div class="bg-purple-100 p-2 rounded-lg">
						<Circle class="w-5 h-5 text-purple-600 animate-pulse" />
					</div>
					<h3 class="font-semibold text-gray-900">データ読み込み中</h3>
				</div>
				<p class="text-gray-600 text-sm mb-3">
					データベースからの路線・駅情報読み込み中に表示
				</p>
				<div class="bg-gray-50 p-3 rounded-lg">
					<p class="text-sm text-gray-700">路線データを読み込んでいます...</p>
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
					<Loader class="w-5 h-5 text-blue-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Multiple Styles</h3>
				<p class="text-gray-600 text-sm">
					Choose from various spinner styles: default, dots, pulse, and bars animations.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-green-100 p-2 rounded-lg inline-block mb-4">
					<Circle class="w-5 h-5 text-green-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Customizable</h3>
				<p class="text-gray-600 text-sm">
					Adjust size, color, and text to match your application's design system.
				</p>
			</div>
			
			<div class="bg-white p-6 rounded-xl border border-gray-200">
				<div class="bg-purple-100 p-2 rounded-lg inline-block mb-4">
					<MoreHorizontal class="w-5 h-5 text-purple-600" />
				</div>
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Accessibility</h3>
				<p class="text-gray-600 text-sm">
					Built-in ARIA labels and screen reader support for inclusive experiences.
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
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">type</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">'default' | 'dots' | 'pulse' | 'bars'</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">'default'</td>
							<td class="px-6 py-4 text-sm text-gray-600">Loading spinner animation style</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">size</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">'small' | 'medium' | 'large'</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">'medium'</td>
							<td class="px-6 py-4 text-sm text-gray-600">Size of the spinner</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">color</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">string</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">'blue'</td>
							<td class="px-6 py-4 text-sm text-gray-600">Color theme for the spinner</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">text</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">string</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">null</td>
							<td class="px-6 py-4 text-sm text-gray-600">Loading text to display below spinner</td>
						</tr>
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">overlay</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-600">boolean</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">false</td>
							<td class="px-6 py-4 text-sm text-gray-600">Show as full-screen overlay</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>
</div>

<style>
	/* Custom animation timing for dots */
	.animate-bounce {
		animation: bounce 1.4s infinite;
	}
	
	@keyframes bounce {
		0%, 80%, 100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-10px);
		}
	}
	
	/* Pulse animation variation */
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>