/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Farert brand colors
				farert: {
					50: '#f0f9ff',
					100: '#e0f2fe',
					200: '#bae6fd',
					300: '#7dd3fc',
					400: '#38bdf8',
					500: '#0ea5e9',
					600: '#0284c7',
					700: '#0369a1',
					800: '#075985',
					900: '#0c4a6e'
				},
				// Japanese railway company colors
				jr: {
					east: '#00a650',
					central: '#00aaff',
					west: '#0072bc',
					kyushu: '#ff4d00',
					shikoku: '#00a0e6',
					hokkaido: '#7cb342'
				},
				// Station type colors
				station: {
					start: '#10b981',
					via: '#06b6d4',
					end: '#dc2626',
					junction: '#f59e0b'
				}
			},
			fontFamily: {
				// Japanese typography
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'"Segoe UI"',
					'Roboto',
					'"Hiragino Sans"',
					'"Noto Sans CJK JP"',
					'sans-serif'
				],
				mono: [
					'"SF Mono"',
					'Monaco',
					'"Cascadia Code"',
					'"Fira Code"',
					'Consolas',
					'monospace'
				]
			},
			animation: {
				'fade-in': 'fade-in 0.5s ease-in-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'slide-down': 'slide-down 0.3s ease-out',
				'pulse-slow': 'pulse 3s infinite'
			},
			keyframes: {
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { transform: 'translateY(100%)' },
					'100%': { transform: 'translateY(0)' }
				},
				'slide-down': {
					'0%': { transform: 'translateY(-100%)' },
					'100%': { transform: 'translateY(0)' }
				}
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem'
			},
			maxWidth: {
				'8xl': '88rem',
				'9xl': '96rem'
			}
		}
	},
	plugins: [
		// Add typography plugin for better text styling
		function({ addUtilities }) {
			const newUtilities = {
				'.text-balance': {
					'text-wrap': 'balance'
				},
				'.scrollbar-hide': {
					'-ms-overflow-style': 'none',
					'scrollbar-width': 'none',
					'&::-webkit-scrollbar': {
						display: 'none'
					}
				}
			}
			addUtilities(newUtilities)
		}
	]
};