

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/fare-display/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/4.DxCysrYh.js","_app/immutable/chunks/BG9Hx8eb.js"];
export const stylesheets = [];
export const fonts = [];
