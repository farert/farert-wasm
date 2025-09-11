<script lang="ts">
	import { page } from '$app/stores';
	import { Menu, X, Train, MapPin, BookOpen, BarChart3 } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let mobileMenuOpen = false;

	const navigationItems = [
		{ href: '/', label: 'ホーム', icon: Train, description: 'Home' },
		{ href: '/stations', label: '駅検索', icon: MapPin, description: 'Station Search' },
		{ href: '/routes', label: 'ルート検索', icon: Train, description: 'Route Planning' },
		{ href: '/examples', label: 'Examples', icon: BookOpen, description: 'SDK Examples' },
		{ href: '/docs', label: 'Documentation', icon: BookOpen, description: 'Docs' },
		{ href: '/performance', label: 'Performance', icon: BarChart3, description: 'Monitoring' }
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

<nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
	<div class="container">
		<div class="flex justify-between items-center py-4">
			<!-- Logo and Brand -->
			<div class="flex items-center space-x-3">
				<div class="bg-indigo-600 p-2 rounded-lg">
					<Train class="w-6 h-6 text-white" />
				</div>
				<div>
					<h1 class="font-bold text-xl text-gray-900">Farert SDK</h1>
					<p class="text-sm text-gray-600">SvelteKit Example</p>
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
						<svelte:component this={item.icon} class="w-4 h-4" />
						<span>{item.label}</span>
					</a>
				{/each}
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
	</div>

	<!-- Mobile Navigation -->
	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-gray-200 bg-white">
			<div class="container py-2">
				{#each navigationItems as item}
					<a
						href={item.href}
						class="mobile-nav-link {currentPath === item.href ? 'mobile-nav-link-active' : ''}"
						on:click={closeMobileMenu}
					>
						<svelte:component this={item.icon} class="w-5 h-5" />
						<div>
							<div class="font-medium">{item.label}</div>
							<div class="text-sm text-gray-600">{item.description}</div>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</nav>

<style>
	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		text-decoration: none;
		color: #4b5563;
		font-weight: 500;
		transition: all 0.2s ease-in-out;
		font-size: 0.875rem;
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
		padding: 0.75rem 1rem;
		margin: 0.25rem 0;
		border-radius: 0.5rem;
		text-decoration: none;
		color: #4b5563;
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

	.mobile-nav-link-active:hover {
		background: #dbeafe;
	}
</style>