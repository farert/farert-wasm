/**
 * Theme Store
 * 
 * Manages application theming including:
 * - Dark/light mode switching
 * - System preference detection
 * - Persistence across sessions
 * - CSS class management
 * 
 * @author Farert SvelteKit Example
 * @version 1.0.0
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * @typedef {'light' | 'dark' | 'system'} ThemeMode
 */

/**
 * @typedef {Object} ThemeState
 * @property {ThemeMode} mode - Current theme mode setting
 * @property {boolean} isDarkMode - Whether dark mode is currently active
 * @property {boolean} systemPrefersDark - System dark mode preference
 * @property {boolean} initialized - Whether theme system is initialized
 */

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialThemeState = {
	mode: 'system',
	isDarkMode: false,
	systemPrefersDark: false,
	initialized: false
};

// ============================================================================
// STORES
// ============================================================================

export const themeState = writable(initialThemeState);

// ============================================================================
// DERIVED STORES
// ============================================================================

export const isDarkMode = derived(themeState, $state => $state.isDarkMode);
export const themeMode = derived(themeState, $state => $state.mode);
export const systemPrefersDark = derived(themeState, $state => $state.systemPrefersDark);
export const isInitialized = derived(themeState, $state => $state.initialized);

// ============================================================================
// THEME STORE ACTIONS
// ============================================================================

/**
 * Create theme store with actions
 */
export function createThemeStore() {
	const { subscribe, set, update } = themeState;
	
	let mediaQuery;
	let unsubscribeMediaQuery;
	
	/**
	 * Update system preference
	 */
	function updateSystemPreference() {
		if (!browser) return;
		
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		
		update(state => ({
			...state,
			systemPrefersDark: prefersDark,
			...(state.mode === 'system' && { isDarkMode: prefersDark })
		}));
	}
	
	/**
	 * Apply theme to document
	 */
	function applyTheme(isDark) {
		if (!browser) return;
		
		const htmlElement = document.documentElement;
		
		if (isDark) {
			htmlElement.classList.add('dark');
		} else {
			htmlElement.classList.remove('dark');
		}
		
		// Update theme-color meta tag
		const themeColorMeta = document.querySelector('meta[name="theme-color"]');
		if (themeColorMeta) {
			themeColorMeta.setAttribute('content', isDark ? '#1f2937' : '#0ea5e9');
		}
		
		// Dispatch custom event for other components
		window.dispatchEvent(new CustomEvent('theme-change', {
			detail: { isDarkMode: isDark }
		}));
	}
	
	/**
	 * Save theme preference to localStorage
	 */
	function saveThemePreference(mode) {
		if (!browser) return;
		
		try {
			localStorage.setItem('farert-theme', mode);
		} catch (error) {
			console.warn('Failed to save theme preference:', error);
		}
	}
	
	/**
	 * Load theme preference from localStorage
	 */
	function loadThemePreference() {
		if (!browser) return 'system';
		
		try {
			const saved = localStorage.getItem('farert-theme');
			return saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
		} catch (error) {
			console.warn('Failed to load theme preference:', error);
			return 'system';
		}
	}
	
	/**
	 * Calculate effective dark mode state
	 */
	function calculateDarkMode(mode, systemPrefersDark) {
		switch (mode) {
			case 'dark':
				return true;
			case 'light':
				return false;
			case 'system':
			default:
				return systemPrefersDark;
		}
	}
	
	return {
		subscribe,
		
		/**
		 * Initialize theme system
		 */
		async initialize() {
			if (!browser) {
				update(state => ({ ...state, initialized: true }));
				return;
			}
			
			// Load saved preference
			const savedMode = loadThemePreference();
			
			// Detect system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			
			// Calculate initial dark mode state
			const isDark = calculateDarkMode(savedMode, prefersDark);
			
			// Update state
			update(state => ({
				...state,
				mode: savedMode,
				systemPrefersDark: prefersDark,
				isDarkMode: isDark,
				initialized: true
			}));
			
			// Apply theme immediately
			applyTheme(isDark);
			
			// Set up system preference monitoring
			mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			
			// Modern browsers
			if (mediaQuery.addEventListener) {
				mediaQuery.addEventListener('change', updateSystemPreference);
				unsubscribeMediaQuery = () => {
					mediaQuery.removeEventListener('change', updateSystemPreference);
				};
			}
			// Legacy browsers
			else if (mediaQuery.addListener) {
				mediaQuery.addListener(updateSystemPreference);
				unsubscribeMediaQuery = () => {
					mediaQuery.removeListener(updateSystemPreference);
				};
			}
		},
		
		/**
		 * Set theme mode
		 */
		setMode(mode) {
			update(state => {
				const isDark = calculateDarkMode(mode, state.systemPrefersDark);
				
				applyTheme(isDark);
				saveThemePreference(mode);
				
				return {
					...state,
					mode,
					isDarkMode: isDark
				};
			});
		},
		
		/**
		 * Toggle between light and dark mode
		 */
		toggle() {
			update(state => {
				let newMode;
				
				if (state.mode === 'system') {
					// If system, toggle to opposite of current system preference
					newMode = state.systemPrefersDark ? 'light' : 'dark';
				} else {
					// If explicitly set, toggle to opposite
					newMode = state.mode === 'dark' ? 'light' : 'dark';
				}
				
				const isDark = calculateDarkMode(newMode, state.systemPrefersDark);
				
				applyTheme(isDark);
				saveThemePreference(newMode);
				
				return {
					...state,
					mode: newMode,
					isDarkMode: isDark
				};
			});
		},
		
		/**
		 * Force dark mode
		 */
		setDark() {
			this.setMode('dark');
		},
		
		/**
		 * Force light mode
		 */
		setLight() {
			this.setMode('light');
		},
		
		/**
		 * Use system preference
		 */
		setSystem() {
			this.setMode('system');
		},
		
		/**
		 * Get current theme state snapshot
		 */
		getSnapshot() {
			let snapshot;
			subscribe(state => snapshot = state)();
			return snapshot;
		},
		
		/**
		 * Destroy theme store (cleanup)
		 */
		destroy() {
			if (unsubscribeMediaQuery) {
				unsubscribeMediaQuery();
				unsubscribeMediaQuery = null;
			}
		}
	};
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get theme mode label for UI
 */
export function getThemeModeLabel(mode) {
	const labels = {
		light: 'ライトモード',
		dark: 'ダークモード',
		system: 'システム設定'
	};
	
	return labels[mode] || '不明';
}

/**
 * Get theme mode icon name
 */
export function getThemeModeIcon(mode) {
	const icons = {
		light: 'Sun',
		dark: 'Moon',
		system: 'Monitor'
	};
	
	return icons[mode] || 'Monitor';
}

/**
 * Get all available theme modes
 */
export function getThemeModes() {
	return [
		{ mode: 'light', label: getThemeModeLabel('light'), icon: getThemeModeIcon('light') },
		{ mode: 'dark', label: getThemeModeLabel('dark'), icon: getThemeModeIcon('dark') },
		{ mode: 'system', label: getThemeModeLabel('system'), icon: getThemeModeIcon('system') }
	];
}

// ============================================================================
// STORE INSTANCE
// ============================================================================

// Create and export default theme store instance
export const defaultThemeStore = createThemeStore();

// Auto-initialize in browser
if (browser) {
	defaultThemeStore.initialize();
}