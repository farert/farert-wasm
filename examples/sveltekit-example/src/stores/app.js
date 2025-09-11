/**
 * Application State Store
 * 
 * Central state management for the application including:
 * - Initialization status
 * - Global error handling
 * - Performance tracking
 * - User preferences
 * 
 * @author Farert SvelteKit Example
 * @version 1.0.0
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// ============================================================================
// STATE INTERFACES
// ============================================================================

/**
 * @typedef {Object} AppState
 * @property {boolean} initialized - Whether the app is initialized
 * @property {boolean} loading - Whether the app is loading
 * @property {string|null} error - Current error message
 * @property {Object} performance - Performance tracking data
 * @property {Object} user - User preferences and settings
 */

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
	initialized: false,
	loading: false,
	error: null,
	performance: {
		startTime: Date.now(),
		loadTime: null,
		navigationCount: 0,
		errors: []
	},
	user: {
		preferences: {
			theme: 'system',
			language: 'ja',
			enableAnimations: true,
			enableSounds: false
		},
		session: {
			id: null,
			startTime: Date.now(),
			lastActivity: Date.now()
		}
	}
};

// ============================================================================
// STORES
// ============================================================================

export const appState = writable(initialState);

// ============================================================================
// DERIVED STORES
// ============================================================================

export const isInitialized = derived(appState, $state => $state.initialized);
export const isLoading = derived(appState, $state => $state.loading);
export const hasError = derived(appState, $state => !!$state.error);
export const currentError = derived(appState, $state => $state.error);
export const performanceData = derived(appState, $state => $state.performance);
export const userPreferences = derived(appState, $state => $state.user.preferences);

// ============================================================================
// STORE ACTIONS
// ============================================================================

/**
 * Create app state store with actions
 */
export function createAppStateStore() {
	const { subscribe, set, update } = appState;
	
	return {
		subscribe,
		
		/**
		 * Set initialization status
		 */
		setInitialized: (initialized) => {
			update(state => ({
				...state,
				initialized,
				loading: false,
				...(initialized && {
					performance: {
						...state.performance,
						loadTime: Date.now() - state.performance.startTime
					}
				})
			}));
		},
		
		/**
		 * Set loading status
		 */
		setLoading: (loading) => {
			update(state => ({
				...state,
				loading
			}));
		},
		
		/**
		 * Set error message
		 */
		setError: (error) => {
			update(state => ({
				...state,
				error,
				loading: false,
				performance: {
					...state.performance,
					errors: [...state.performance.errors, {
						message: error,
						timestamp: Date.now()
					}]
				}
			}));
		},
		
		/**
		 * Clear error
		 */
		clearError: () => {
			update(state => ({
				...state,
				error: null
			}));
		},
		
		/**
		 * Track navigation
		 */
		trackNavigation: (path) => {
			update(state => ({
				...state,
				performance: {
					...state.performance,
					navigationCount: state.performance.navigationCount + 1
				},
				user: {
					...state.user,
					session: {
						...state.user.session,
						lastActivity: Date.now()
					}
				}
			}));
		},
		
		/**
		 * Update user preferences
		 */
		updatePreferences: (preferences) => {
			update(state => ({
				...state,
				user: {
					...state.user,
					preferences: {
						...state.user.preferences,
						...preferences
					}
				}
			}));
			
			// Persist to localStorage if available
			if (browser) {
				try {
					localStorage.setItem('farert-preferences', JSON.stringify(preferences));
				} catch (error) {
					console.warn('Failed to save preferences:', error);
				}
			}
		},
		
		/**
		 * Initialize session
		 */
		initializeSession: () => {
			const sessionId = generateSessionId();
			
			update(state => ({
				...state,
				user: {
					...state.user,
					session: {
						...state.user.session,
						id: sessionId
					}
				}
			}));
			
			// Load saved preferences
			if (browser) {
				try {
					const saved = localStorage.getItem('farert-preferences');
					if (saved) {
						const preferences = JSON.parse(saved);
						update(state => ({
							...state,
							user: {
								...state.user,
								preferences: {
									...state.user.preferences,
									...preferences
								}
							}
						}));
					}
				} catch (error) {
					console.warn('Failed to load preferences:', error);
				}
			}
		},
		
		/**
		 * Reset state to initial values
		 */
		reset: () => {
			set({
				...initialState,
				performance: {
					...initialState.performance,
					startTime: Date.now()
				},
				user: {
					...initialState.user,
					session: {
						...initialState.user.session,
						startTime: Date.now(),
						lastActivity: Date.now()
					}
				}
			});
		},
		
		/**
		 * Get current state snapshot
		 */
		getSnapshot: () => {
			let snapshot;
			subscribe(state => snapshot = state)();
			return snapshot;
		}
	};
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique session ID
 */
function generateSessionId() {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2);
	return `farert_${timestamp}_${random}`;
}

/**
 * Format performance data for display
 */
export function formatPerformanceData(perfData) {
	return {
		loadTime: perfData.loadTime ? `${perfData.loadTime}ms` : 'N/A',
		navigationCount: perfData.navigationCount,
		errorCount: perfData.errors.length,
		uptime: Date.now() - perfData.startTime,
		averageNavigationTime: perfData.navigationCount > 0 
			? Math.round((Date.now() - perfData.startTime) / perfData.navigationCount)
			: 0
	};
}

/**
 * Check if user has been active recently
 */
export function isUserActive(sessionData, timeoutMs = 300000) { // 5 minutes
	return Date.now() - sessionData.lastActivity < timeoutMs;
}

// ============================================================================
// STORE INSTANCE
// ============================================================================

// Create and export default app state store instance
export const defaultAppState = createAppStateStore();

// Initialize session on module load (browser only)
if (browser) {
	defaultAppState.initializeSession();
}