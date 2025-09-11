import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),
		
		// Alias for SDK components
		alias: {
			$components: '../../src/sdk/svelte/components',
			$stores: '../../src/sdk/svelte',
			$lib: './src/lib'
		},
		
		// Enable TypeScript strict mode
		typescript: {
			config: (config) => {
				config.compilerOptions.strict = true;
				return config;
			}
		},
		
		// Static site generation
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn',
			entries: ['*']
		}
	}
};

export default config;