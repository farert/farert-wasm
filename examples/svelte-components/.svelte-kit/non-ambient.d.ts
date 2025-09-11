
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/documentation" | "/fare-display" | "/loading-spinner" | "/route-builder" | "/station-selector";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/documentation": Record<string, never>;
			"/fare-display": Record<string, never>;
			"/loading-spinner": Record<string, never>;
			"/route-builder": Record<string, never>;
			"/station-selector": Record<string, never>
		};
		Pathname(): "/" | "/documentation" | "/documentation/" | "/fare-display" | "/fare-display/" | "/loading-spinner" | "/loading-spinner/" | "/route-builder" | "/route-builder/" | "/station-selector" | "/station-selector/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}