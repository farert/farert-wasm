import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	
	// WebAssembly support
	optimizeDeps: {
		exclude: ['$sdk']
	},
	
	// Development server configuration
	server: {
		fs: {
			// Allow serving files from parent directories
			allow: ['..', '../..']
		}
	},
	
	// Build configuration
	build: {
		// Ensure WebAssembly files are properly handled
		assetsInlineLimit: 0,
		rollupOptions: {
			external: (id) => id.includes('.wasm')
		}
	}
});