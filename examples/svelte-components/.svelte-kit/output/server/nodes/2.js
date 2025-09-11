

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/2.6rVyc12V.js","_app/immutable/chunks/BG9Hx8eb.js"];
export const stylesheets = ["_app/immutable/assets/2.BFwqPWC9.css"];
export const fonts = [];
