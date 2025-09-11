import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Development server configuration
	server: {
		port: 3000,
		host: true,
		fs: {
			allow: ['..', '../..'] // Allow access to parent directories for SDK
		}
	},

	// Build configuration
	build: {
		target: 'es2020',
		rollupOptions: {
			output: {
				manualChunks: {
					// Separate WASM module for better caching
					'farert-wasm': ['../../src/sdk/core/farert-sdk'],
					// Separate large UI components
					'ui-components': ['lucide-svelte']
				}
			}
		}
	},

	// WASM and Web Workers support
	optimizeDeps: {
		exclude: ['@farert/wasm-sdk'],
		include: ['clsx', 'lucide-svelte']
	},

	// Path resolution
	resolve: {
		alias: {
			'$farert': '../../src/sdk',
			'$farert-core': '../../src/sdk/core',
			'$farert-svelte': '../../src/sdk/svelte',
			'$farert-sveltekit': '../../src/sdk/sveltekit'
		}
	},

	// Environment variables
	define: {
		'__FARERT_VERSION__': JSON.stringify(process.env.npm_package_version || '1.0.0'),
		'__BUILD_TIME__': JSON.stringify(new Date().toISOString()),
		'__DEMO_MODE__': JSON.stringify(true)
	},

	// Worker configuration for Web Workers and WASM
	worker: {
		format: 'es'
	}
});