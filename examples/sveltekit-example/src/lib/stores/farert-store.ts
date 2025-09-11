/**
 * Farert Store for SvelteKit Example Application
 * Re-exports the main SDK store with example-specific configuration
 */

export {
	farertStore,
	isReady,
	isLoading,
	hasError,
	canRetry,
	currentError,
	wasmModule,
	autoInitializeFarert,
	farertInit
} from '$sdk/svelte/farert-store';

export type {
	FarertStoreState,
	FarertStoreConfig,
	StationSearchResult,
	LineInfo,
	RouteSegment,
	FareCalculationResult,
	FarertInitializationState
} from '$sdk/svelte/farert-store';

// Example-specific configuration
export const exampleConfig = {
	enableCache: true,
	cacheTimeout: 10 * 60 * 1000, // 10 minutes for demo
	debugMode: true, // Enable debug mode for development
	autoRetry: true,
	maxRetries: 3
};