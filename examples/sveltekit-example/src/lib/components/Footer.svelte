<script lang="ts">
	import { Github, ExternalLink, Heart } from 'lucide-svelte';

	const currentYear = new Date().getFullYear();

	const links = {
		project: [
			{ label: 'Source Code', href: 'https://github.com/ntake/farert-wasm', external: true },
			{ label: 'Documentation', href: '/docs' },
			{ label: 'Examples', href: '/examples' },
			{ label: 'Performance', href: '/performance' }
		],
		resources: [
			{ label: 'WebAssembly Guide', href: '/docs/webassembly', external: false },
			{ label: 'TypeScript API', href: '/docs/typescript', external: false },
			{ label: 'SvelteKit Integration', href: '/docs/sveltekit', external: false },
			{ label: 'Railway Data Source', href: 'https://www.mlit.go.jp/', external: true }
		],
		tools: [
			{ label: 'Station Search', href: '/stations' },
			{ label: 'Route Planning', href: '/routes' },
			{ label: 'Fare Calculator', href: '/examples/calculator' },
			{ label: 'Performance Monitor', href: '/performance' }
		]
	};
</script>

<footer class="bg-gray-50 border-t border-gray-200 mt-auto">
	<div class="container py-12">
		<!-- Main Footer Content -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
			<!-- Brand Section -->
			<div>
				<div class="flex items-center space-x-2 mb-4">
					<div class="bg-indigo-600 p-2 rounded-lg">
						<Github class="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 class="font-bold text-lg text-gray-900">Farert WebAssembly SDK</h3>
						<p class="text-sm text-gray-600">SvelteKit Example</p>
					</div>
				</div>
				<p class="text-gray-600 text-sm mb-4">
					Comprehensive Japanese railway fare calculation using WebAssembly technology with modern TypeScript APIs.
				</p>
				<div class="flex items-center text-sm text-gray-500">
					<span>Made with</span>
					<Heart class="w-4 h-4 mx-1 text-red-500" />
					<span>for developers</span>
				</div>
			</div>

			<!-- Project Links -->
			<div>
				<h4 class="font-semibold text-gray-900 mb-4">Project</h4>
				<ul class="space-y-2">
					{#each links.project as link}
						<li>
							<a
								href={link.href}
								class="footer-link"
								class:external={link.external}
								target={link.external ? '_blank' : undefined}
								rel={link.external ? 'noopener noreferrer' : undefined}
							>
								{link.label}
								{#if link.external}
									<ExternalLink class="w-3 h-3" />
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Resources -->
			<div>
				<h4 class="font-semibold text-gray-900 mb-4">Resources</h4>
				<ul class="space-y-2">
					{#each links.resources as link}
						<li>
							<a
								href={link.href}
								class="footer-link"
								class:external={link.external}
								target={link.external ? '_blank' : undefined}
								rel={link.external ? 'noopener noreferrer' : undefined}
							>
								{link.label}
								{#if link.external}
									<ExternalLink class="w-3 h-3" />
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Tools -->
			<div>
				<h4 class="font-semibold text-gray-900 mb-4">Tools</h4>
				<ul class="space-y-2">
					{#each links.tools as link}
						<li>
							<a href={link.href} class="footer-link">
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<!-- Bottom Section -->
		<div class="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
			<div class="text-sm text-gray-600 mb-4 md:mb-0">
				<p>© {currentYear} Farert WebAssembly SDK. All rights reserved.</p>
				<p class="mt-1">
					Licensed under 
					<a 
						href="https://www.gnu.org/licenses/gpl-3.0.html" 
						class="text-indigo-600 hover:text-indigo-800 underline"
						target="_blank"
						rel="noopener noreferrer"
					>
						GPL-3.0
					</a>
				</p>
			</div>

			<div class="flex items-center space-x-4">
				<a
					href="https://github.com/ntake/farert-wasm"
					class="text-gray-600 hover:text-gray-900 transition-colors"
					target="_blank"
					rel="noopener noreferrer"
					aria-label="View source on GitHub"
				>
					<Github class="w-5 h-5" />
				</a>
				
				<div class="text-sm text-gray-500">
					Built with <span class="font-medium">SvelteKit</span> + <span class="font-medium">WebAssembly</span>
				</div>
			</div>
		</div>

		<!-- Technical Information -->
		<div class="mt-6 pt-6 border-t border-gray-200">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
				<div>
					<strong>WebAssembly Module:</strong> farert.wasm (C++ compiled)
				</div>
				<div>
					<strong>Database:</strong> SQLite3 embedded via MEMFS
				</div>
				<div>
					<strong>Performance:</strong> Native speed route calculations
				</div>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: #6b7280;
		text-decoration: none;
		font-size: 0.875rem;
		transition: color 0.2s ease-in-out;
	}

	.footer-link:hover {
		color: #4f46e5;
	}

	.footer-link.external {
		color: #6b7280;
	}

	.footer-link.external:hover {
		color: #4f46e5;
	}
</style>