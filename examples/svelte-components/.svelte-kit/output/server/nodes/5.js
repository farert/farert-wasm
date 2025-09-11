

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/loading-spinner/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.Duoq0uc8.js","_app/immutable/chunks/BG9Hx8eb.js"];
export const stylesheets = ["_app/immutable/assets/5.DCyTFpbm.css"];
export const fonts = [];
