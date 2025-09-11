

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/route-builder/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/6.D9x4uKiN.js","_app/immutable/chunks/BG9Hx8eb.js"];
export const stylesheets = ["_app/immutable/assets/6.DeNEMKk9.css"];
export const fonts = [];
