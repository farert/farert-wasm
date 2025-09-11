
import root from '../root.svelte';
import { set_building, set_prerendering } from '__sveltekit/environment';
import { set_assets } from '__sveltekit/paths';
import { set_manifest, set_read_implementation } from '__sveltekit/server';
import { set_private_env, set_public_env } from '../../../node_modules/@sveltejs/kit/src/runtime/shared-server.js';

export const options = {
	app_template_contains_nonce: false,
	csp: {"mode":"auto","directives":{"upgrade-insecure-requests":false,"block-all-mixed-content":false},"reportOnly":{"upgrade-insecure-requests":false,"block-all-mixed-content":false}},
	csrf_check_origin: true,
	csrf_trusted_origins: [],
	embedded: false,
	env_public_prefix: 'PUBLIC_',
	env_private_prefix: '',
	hash_routing: false,
	hooks: null, // added lazily, via `get_hooks`
	preload_strategy: "modulepreload",
	root,
	service_worker: false,
	service_worker_options: undefined,
	templates: {
		app: ({ head, body, assets, nonce, env }) => "<!doctype html>\n<html lang=\"en\" class=\"h-full\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"" + assets + "/favicon.png\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t\n\t\t<!-- Primary Meta Tags -->\n\t\t<title>%sveltekit.title%</title>\n\t\t<meta name=\"title\" content=\"Farert Svelte Components Showcase\" />\n\t\t<meta name=\"description\" content=\"Interactive showcase of Svelte components for Japanese railway fare calculation using WebAssembly SDK\" />\n\t\t\n\t\t<!-- Open Graph / Facebook -->\n\t\t<meta property=\"og:type\" content=\"website\" />\n\t\t<meta property=\"og:url\" content=\"https://farert-svelte-components.vercel.app/\" />\n\t\t<meta property=\"og:title\" content=\"Farert Svelte Components Showcase\" />\n\t\t<meta property=\"og:description\" content=\"Interactive showcase of Svelte components for Japanese railway fare calculation using WebAssembly SDK\" />\n\t\t\n\t\t<!-- Twitter -->\n\t\t<meta property=\"twitter:card\" content=\"summary_large_image\" />\n\t\t<meta property=\"twitter:url\" content=\"https://farert-svelte-components.vercel.app/\" />\n\t\t<meta property=\"twitter:title\" content=\"Farert Svelte Components Showcase\" />\n\t\t<meta property=\"twitter:description\" content=\"Interactive showcase of Svelte components for Japanese railway fare calculation using WebAssembly SDK\" />\n\t\t\n\t\t<!-- Fonts for Japanese text support -->\n\t\t<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n\t\t<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n\t\t<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap\" rel=\"stylesheet\" />\n\t\t\n\t\t<!-- Base styles -->\n\t\t<style>\n\t\t\t*, *::before, *::after {\n\t\t\t\tbox-sizing: border-box;\n\t\t\t}\n\t\t\t\n\t\t\tbody {\n\t\t\t\tmargin: 0;\n\t\t\t\tfont-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n\t\t\t\tline-height: 1.6;\n\t\t\t\tcolor: #1f2937;\n\t\t\t\tbackground: #f9fafb;\n\t\t\t\tmin-height: 100vh;\n\t\t\t\tfont-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';\n\t\t\t}\n\t\t\t\n\t\t\t:lang(ja) {\n\t\t\t\tfont-family: 'Noto Sans JP', 'Inter', sans-serif;\n\t\t\t}\n\t\t\t\n\t\t\tcode, pre {\n\t\t\t\tfont-family: 'JetBrains Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;\n\t\t\t}\n\t\t\t\n\t\t\t.visually-hidden {\n\t\t\t\tposition: absolute !important;\n\t\t\t\twidth: 1px !important;\n\t\t\t\theight: 1px !important;\n\t\t\t\tpadding: 0 !important;\n\t\t\t\tmargin: -1px !important;\n\t\t\t\toverflow: hidden !important;\n\t\t\t\tclip: rect(0,0,0,0) !important;\n\t\t\t\twhite-space: nowrap !important;\n\t\t\t\tborder: 0 !important;\n\t\t\t}\n\t\t</style>\n\t\t\n\t\t" + head + "\n\t</head>\n\t<body data-sveltekit-preload-data=\"hover\" class=\"h-full\">\n\t\t<div id=\"app\" class=\"h-full\">" + body + "</div>\n\t</body>\n</html>",
		error: ({ status, message }) => "<!doctype html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<title>" + message + "</title>\n\n\t\t<style>\n\t\t\tbody {\n\t\t\t\t--bg: white;\n\t\t\t\t--fg: #222;\n\t\t\t\t--divider: #ccc;\n\t\t\t\tbackground: var(--bg);\n\t\t\t\tcolor: var(--fg);\n\t\t\t\tfont-family:\n\t\t\t\t\tsystem-ui,\n\t\t\t\t\t-apple-system,\n\t\t\t\t\tBlinkMacSystemFont,\n\t\t\t\t\t'Segoe UI',\n\t\t\t\t\tRoboto,\n\t\t\t\t\tOxygen,\n\t\t\t\t\tUbuntu,\n\t\t\t\t\tCantarell,\n\t\t\t\t\t'Open Sans',\n\t\t\t\t\t'Helvetica Neue',\n\t\t\t\t\tsans-serif;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tjustify-content: center;\n\t\t\t\theight: 100vh;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t.error {\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t\tmax-width: 32rem;\n\t\t\t\tmargin: 0 1rem;\n\t\t\t}\n\n\t\t\t.status {\n\t\t\t\tfont-weight: 200;\n\t\t\t\tfont-size: 3rem;\n\t\t\t\tline-height: 1;\n\t\t\t\tposition: relative;\n\t\t\t\ttop: -0.05rem;\n\t\t\t}\n\n\t\t\t.message {\n\t\t\t\tborder-left: 1px solid var(--divider);\n\t\t\t\tpadding: 0 0 0 1rem;\n\t\t\t\tmargin: 0 0 0 1rem;\n\t\t\t\tmin-height: 2.5rem;\n\t\t\t\tdisplay: flex;\n\t\t\t\talign-items: center;\n\t\t\t}\n\n\t\t\t.message h1 {\n\t\t\t\tfont-weight: 400;\n\t\t\t\tfont-size: 1em;\n\t\t\t\tmargin: 0;\n\t\t\t}\n\n\t\t\t@media (prefers-color-scheme: dark) {\n\t\t\t\tbody {\n\t\t\t\t\t--bg: #222;\n\t\t\t\t\t--fg: #ddd;\n\t\t\t\t\t--divider: #666;\n\t\t\t\t}\n\t\t\t}\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div class=\"error\">\n\t\t\t<span class=\"status\">" + status + "</span>\n\t\t\t<div class=\"message\">\n\t\t\t\t<h1>" + message + "</h1>\n\t\t\t</div>\n\t\t</div>\n\t</body>\n</html>\n"
	},
	version_hash: "1ip45dl"
};

export async function get_hooks() {
	let handle;
	let handleFetch;
	let handleError;
	let handleValidationError;
	let init;
	

	let reroute;
	let transport;
	

	return {
		handle,
		handleFetch,
		handleError,
		handleValidationError,
		init,
		reroute,
		transport
	};
}

export { set_assets, set_building, set_manifest, set_prerendering, set_private_env, set_public_env, set_read_implementation };
