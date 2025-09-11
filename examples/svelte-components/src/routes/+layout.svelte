<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { Menu, X, Package, Github, ExternalLink } from 'lucide-svelte';
	
	let mobileMenuOpen = false;
	
	const navigationItems = [
		{ href: '/', label: 'Overview', description: 'Component library overview' },
		{ href: '/station-selector', label: 'StationSelector', description: 'Station search and selection' },
		{ href: '/route-builder', label: 'RouteBuilder', description: 'Drag-and-drop route building' },
		{ href: '/fare-display', label: 'FareDisplay', description: 'Fare calculation results' },
		{ href: '/loading-spinner', label: 'LoadingSpinner', description: 'Loading states and indicators' },
		{ href: '/documentation', label: 'Documentation', description: 'API reference and guides' }
	];
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
	
	onMount(() => {
		const handleResize = () => {
			if (window.innerWidth >= 768) {
				mobileMenuOpen = false;
			}
		};
		
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
	
	$: currentPath = $page.url.pathname;
</script>

<svelte:head>
	<title>{$page.data?.title || 'Farert Svelte Components Showcase'}</title>
	<meta name="description" content={$page.data?.description || 'Interactive showcase of Svelte components for Japanese railway fare calculation'} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<!-- Navigation Header -->
	<header class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
		<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16">
				<!-- Logo and Brand -->
				<div class="flex items-center space-x-3">
					<div class="bg-indigo-600 p-2 rounded-lg">
						<Package class="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 class="font-bold text-lg text-gray-900">Farert Components</h1>
						<p class="text-xs text-gray-600">Svelte UI Library</p>
					</div>
				</div>

				<!-- Desktop Navigation -->
				<div class="hidden md:flex items-center space-x-1">
					{#each navigationItems as item}
						<a
							href={item.href}
							class="nav-link {currentPath === item.href ? 'nav-link-active' : ''}"
							title={item.description}
						>
							{item.label}
						</a>
					{/each}
				</div>

				<!-- GitHub Link -->
				<div class="hidden md:flex items-center space-x-4">
					<a
						href="https://github.com/ntake/farert-wasm"
						target="_blank"
						rel="noopener noreferrer"
						class="text-gray-600 hover:text-gray-900 transition-colors"
						title="View on GitHub"
					>
						<Github class="w-5 h-5" />
					</a>
				</div>

				<!-- Mobile Menu Button -->
				<button
					class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
					on:click={toggleMobileMenu}
					aria-label="Toggle navigation menu"
				>
					{#if mobileMenuOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
			</div>
		</nav>

		<!-- Mobile Navigation -->
		{#if mobileMenuOpen}
			<div class="md:hidden border-t border-gray-200 bg-white">
				<div class="px-4 py-2 space-y-1">
					{#each navigationItems as item}
						<a
							href={item.href}
							class="mobile-nav-link {currentPath === item.href ? 'mobile-nav-link-active' : ''}"
							on:click={closeMobileMenu}
						>
							<div>
								<div class="font-medium">{item.label}</div>
								<div class="text-sm text-gray-600">{item.description}</div>
							</div>
						</a>
					{/each}
					
					<div class="pt-4 border-t border-gray-200">
						<a
							href="https://github.com/ntake/farert-wasm"
							target="_blank"
							rel="noopener noreferrer"
							class="mobile-nav-link"
							on:click={closeMobileMenu}
						>
							<Github class="w-5 h-5" />
							<div>
								<div class="font-medium">View on GitHub</div>
								<div class="text-sm text-gray-600">Source code and documentation</div>
							</div>
							<ExternalLink class="w-4 h-4" />
						</a>
					</div>
				</div>
			</div>
		{/if}
	</header>

	<!-- Main Content -->
	<main class="flex-1">
		<slot />
	</main>

	<!-- Footer -->
	<footer class="bg-gray-50 border-t border-gray-200">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- About -->
				<div>
					<h3 class="font-semibold text-gray-900 mb-3">Farert Svelte Components</h3>
					<p class="text-gray-600 text-sm leading-relaxed">
						A comprehensive library of Svelte components for Japanese railway fare calculation applications using WebAssembly technology.
					</p>
				</div>

				<!-- Links -->
				<div>
					<h3 class="font-semibold text-gray-900 mb-3">Resources</h3>
					<ul class="space-y-2">
						<li>
							<a href="/documentation" class="footer-link">
								Component Documentation
							</a>
						</li>
						<li>
							<a href="https://github.com/ntake/farert-wasm/tree/main/examples/sveltekit-example" target="_blank" rel="noopener noreferrer" class="footer-link">
								SvelteKit Example <ExternalLink class="w-3 h-3 inline ml-1" />
							</a>
						</li>
						<li>
							<a href="https://github.com/ntake/farert-wasm" target="_blank" rel="noopener noreferrer" class="footer-link">
								Main Repository <ExternalLink class="w-3 h-3 inline ml-1" />
							</a>
						</li>
					</ul>
				</div>

				<!-- Technical Info -->
				<div>
					<h3 class="font-semibold text-gray-900 mb-3">Technical Details</h3>
					<ul class="text-sm text-gray-600 space-y-1">
						<li><strong>Framework:</strong> Svelte 4 + SvelteKit</li>
						<li><strong>Language:</strong> TypeScript (strict mode)</li>
						<li><strong>Backend:</strong> WebAssembly (C++)</li>
						<li><strong>License:</strong> GPL-3.0</li>
					</ul>
				</div>
			</div>

			<div class="border-t border-gray-200 mt-8 pt-8 text-center">
				<p class="text-sm text-gray-500">
					© 2024 Farert WebAssembly SDK. Licensed under GPL-3.0.
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	.nav-link {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		text-decoration: none;
		color: #6b7280;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.2s ease-in-out;
	}

	.nav-link:hover {
		background: #f3f4f6;
		color: #1f2937;
	}

	.nav-link-active {
		background: #6366f1;
		color: white;
	}

	.nav-link-active:hover {
		background: #4f46e5;
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		text-decoration: none;
		color: #6b7280;
		transition: all 0.2s ease-in-out;
	}

	.mobile-nav-link:hover {
		background: #f3f4f6;
		color: #1f2937;
	}

	.mobile-nav-link-active {
		background: #eff6ff;
		color: #1d4ed8;
		border: 1px solid #dbeafe;
	}

	.footer-link {
		color: #6366f1;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease-in-out;
	}

	.footer-link:hover {
		color: #4f46e5;
		text-decoration: underline;
	}

	/* Utility classes */
	.flex { display: flex; }
	.flex-1 { flex: 1 1 0%; }
	.flex-col { flex-direction: column; }
	.items-center { align-items: center; }
	.justify-between { justify-content: space-between; }
	.space-x-1 > * + * { margin-left: 0.25rem; }
	.space-x-3 > * + * { margin-left: 0.75rem; }
	.space-x-4 > * + * { margin-left: 1rem; }
	.space-y-1 > * + * { margin-top: 0.25rem; }
	.space-y-2 > * + * { margin-top: 0.5rem; }
	.min-h-screen { min-height: 100vh; }
	.max-w-7xl { max-width: 80rem; }
	.mx-auto { margin-left: auto; margin-right: auto; }
	.px-4 { padding-left: 1rem; padding-right: 1rem; }
	.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
	.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
	.h-16 { height: 4rem; }
	.w-4 { width: 1rem; }
	.w-5 { width: 1.25rem; }
	.w-6 { width: 1.5rem; }
	.h-4 { height: 1rem; }
	.h-5 { height: 1.25rem; }
	.h-6 { height: 1.5rem; }
	.p-2 { padding: 0.5rem; }
	.rounded-lg { border-radius: 0.5rem; }
	.bg-white { background-color: white; }
	.bg-gray-50 { background-color: #f9fafb; }
	.bg-gray-100 { background-color: #f3f4f6; }
	.bg-indigo-600 { background-color: #4f46e5; }
	.text-white { color: white; }
	.text-gray-500 { color: #6b7280; }
	.text-gray-600 { color: #4b5563; }
	.text-gray-900 { color: #111827; }
	.text-xs { font-size: 0.75rem; }
	.text-sm { font-size: 0.875rem; }
	.text-lg { font-size: 1.125rem; }
	.font-bold { font-weight: 700; }
	.font-medium { font-weight: 500; }
	.font-semibold { font-weight: 600; }
	.border-b { border-bottom-width: 1px; }
	.border-t { border-top-width: 1px; }
	.border-gray-200 { border-color: #e5e7eb; }
	.sticky { position: sticky; }
	.top-0 { top: 0; }
	.z-50 { z-index: 50; }
	.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
	.transition-colors { transition-property: color, background-color, border-color; }
	.leading-relaxed { line-height: 1.625; }
	.grid { display: grid; }
	.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
	.gap-8 { gap: 2rem; }
	.mb-3 { margin-bottom: 0.75rem; }
	.mt-8 { margin-top: 2rem; }
	.pt-4 { padding-top: 1rem; }
	.pt-8 { padding-top: 2rem; }
	.text-center { text-align: center; }
	.inline { display: inline; }
	.ml-1 { margin-left: 0.25rem; }

	@media (min-width: 640px) {
		.sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
	}

	@media (min-width: 768px) {
		.md\\:hidden { display: none; }
		.md\\:flex { display: flex; }
		.md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
	}

	@media (min-width: 1024px) {
		.lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
	}
</style>