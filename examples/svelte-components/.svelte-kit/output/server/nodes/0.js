

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.DFf2mNbG.js","_app/immutable/chunks/BG9Hx8eb.js","_app/immutable/chunks/Z1kvhb-i.js","_app/immutable/chunks/DMYeqAF0.js"];
export const stylesheets = ["_app/immutable/assets/0.DGnr6vky.css"];
export const fonts = [];
