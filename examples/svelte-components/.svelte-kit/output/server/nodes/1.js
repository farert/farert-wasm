

export const index = 1;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/error.svelte.js')).default;
export const imports = ["_app/immutable/nodes/1.ET3ey3IB.js","_app/immutable/chunks/BG9Hx8eb.js","_app/immutable/chunks/Z1kvhb-i.js","_app/immutable/chunks/DMYeqAF0.js"];
export const stylesheets = [];
export const fonts = [];
