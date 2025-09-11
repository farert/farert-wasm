import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// Build configuration for component showcase
	build: {
		target: 'esnext',
		rollupOptions: {
			output: {
				manualChunks: {
					'vendor': ['svelte', 'lucide-svelte']
				}
			}
		}
	},
	
	// Development server configuration
	server: {
		fs: {
			allow: ['..', '../..', '../../..']
		}
	},
	
	// Optimize dependencies
	optimizeDeps: {
		include: ['lucide-svelte']
	}
});