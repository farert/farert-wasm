

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/documentation/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.me9eXOY1.js","_app/immutable/chunks/BG9Hx8eb.js"];
export const stylesheets = [];
export const fonts = [];
