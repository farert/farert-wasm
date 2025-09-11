/**
 * Main JavaScript for Farert WASM Demo Site
 */

// Global state
let farertApi = null;
let stationsCache = [];
let isInitializing = false;

// DOM elements
const fareCalculator = document.getElementById('fareCalculator');
const fromStationInput = document.getElementById('fromStation');
const toStationInput = document.getElementById('toStation');
const fareResult = document.getElementById('fareResult');
const fareAmount = document.getElementById('fareAmount');
const routeInfo = document.getElementById('routeInfo');
const calcTime = document.getElementById('calcTime');
const quickStartBtn = document.getElementById('quickStart');
const stationsDatalist = document.getElementById('stations');

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Farert WASM Demo Site initializing...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize framework tabs
    initializeFrameworkTabs();
    
    // Load Farert WASM
    await initializeFarertWasm();
    
    console.log('✅ Demo site ready!');
});

/**
 * Initialize Farert WASM SDK
 */
async function initializeFarertWasm() {
    if (isInitializing || farertApi) return farertApi;
    
    isInitializing = true;
    
    try {
        console.log('📦 Loading Farert WASM...');
        
        // Initialize the SDK
        farertApi = await window.FarertWasm.initialize({
            wasmUrl: 'https://unpkg.com/farert-wasm@2.0.0/dist/farert.wasm',
            enableLogging: true
        });
        
        console.log('✅ Farert WASM initialized successfully');
        
        // Load popular stations for autocomplete
        await loadStationsAutocomplete();
        
        // Enable form
        if (fareCalculator) {
            fareCalculator.querySelector('button[type="submit"]').disabled = false;
        }
        
        return farertApi;
        
    } catch (error) {
        console.error('❌ Failed to initialize Farert WASM:', error);
        showError('WebAssemblyの初期化に失敗しました。ページをリロードしてください。');
        throw error;
    } finally {
        isInitializing = false;
    }
}

/**
 * Load stations for autocomplete
 */
async function loadStationsAutocomplete() {
    try {
        // Common Japanese stations for demo
        const popularStations = [
            '東京', '新宿', '渋谷', '池袋', '上野', '品川', '秋葉原',
            '大阪', '京都', '神戸', '名古屋', '横浜', '大宮', '千葉',
            '立川', '八王子', '町田', '川崎', '藤沢', '浦和', '船橋'
        ];
        
        // Add to datalist
        stationsDatalist.innerHTML = '';
        popularStations.forEach(station => {
            const option = document.createElement('option');
            option.value = station;
            stationsDatalist.appendChild(option);
        });
        
        stationsCache = popularStations;
        console.log(`📍 Loaded ${popularStations.length} stations for autocomplete`);
        
    } catch (error) {
        console.error('⚠️ Failed to load stations:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Fare calculation form
    if (fareCalculator) {
        fareCalculator.addEventListener('submit', handleFareCalculation);
    }
    
    // Quick start button
    if (quickStartBtn) {
        quickStartBtn.addEventListener('click', scrollToDemo);
    }
    
    // Station input suggestions
    if (fromStationInput) {
        fromStationInput.addEventListener('input', handleStationInput);
    }
    
    if (toStationInput) {
        toStationInput.addEventListener('input', handleStationInput);
    }
}

/**
 * Handle fare calculation form submission
 */
async function handleFareCalculation(event) {
    event.preventDefault();
    
    const fromStation = fromStationInput.value.trim();
    const toStation = toStationInput.value.trim();
    
    if (!fromStation || !toStation) {
        showError('出発駅と到着駅を入力してください。');
        return;
    }
    
    if (fromStation === toStation) {
        showError('出発駅と到着駅が同じです。');
        return;
    }
    
    await calculateFare(fromStation, toStation);
}

/**
 * Calculate fare between two stations
 */
async function calculateFare(fromStation, toStation) {
    try {
        // Ensure API is initialized
        if (!farertApi) {
            await initializeFarertWasm();
        }
        
        if (!farertApi) {
            throw new Error('API not initialized');
        }
        
        console.log(`🚇 Calculating fare: ${fromStation} → ${toStation}`);
        
        const startTime = performance.now();
        
        // Get station IDs
        const fromId = farertApi.getStationId(fromStation);
        const toId = farertApi.getStationId(toStation);
        
        if (fromId === -1) {
            throw new Error(`出発駅 "${fromStation}" が見つかりません。`);
        }
        
        if (toId === -1) {
            throw new Error(`到着駅 "${toStation}" が見つかりません。`);
        }
        
        // Create route and calculate fare
        const route = farertApi.createRoute();
        route.addRouteBegin(fromId);
        
        // For demo purposes, we'll use a simple route calculation
        // In a real implementation, you'd need to determine the line(s)
        const lines = farertApi.getStationLines(fromId);
        if (lines && lines.length > 0) {
            route.addRoute(lines[0], toId);
        }
        
        const fareResult = route.calculateFare();
        const endTime = performance.now();
        
        // Display results
        displayFareResult(fareResult, fromStation, toStation, endTime - startTime);
        
        console.log('✅ Fare calculation completed:', fareResult);
        
    } catch (error) {
        console.error('❌ Fare calculation failed:', error);
        showError(error.message || '運賃計算中にエラーが発生しました。');
    }
}

/**
 * Display fare calculation result
 */
function displayFareResult(result, fromStation, toStation, calculationTime) {
    if (!result || typeof result.fare === 'undefined') {
        showError('運賃計算に失敗しました。');
        return;
    }
    
    // Update result display
    fareAmount.textContent = result.fare.toLocaleString('ja-JP');
    routeInfo.textContent = `${fromStation} → ${toStation}`;
    calcTime.textContent = Math.round(calculationTime);
    
    // Show result section
    fareResult.style.display = 'block';
    
    // Smooth scroll to result
    fareResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Show error message
 */
function showError(message) {
    // Create or update error display
    let errorDiv = document.getElementById('errorMessage');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMessage';
        errorDiv.className = 'error-message';
        fareCalculator.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="error-icon">⚠️</span>
            <span class="error-text">${message}</span>
        </div>
    `;
    
    errorDiv.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }, 5000);
}

/**
 * Handle station input for autocomplete suggestions
 */
function handleStationInput(event) {
    const value = event.target.value;
    
    // Basic validation for Japanese characters
    if (value && !/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\uFF00-\uFFEF]*$/.test(value)) {
        showError('駅名は日本語で入力してください。');
    }
}

/**
 * Scroll to demo section
 */
function scrollToDemo() {
    const demoSection = document.getElementById('demo') || fareCalculator;
    if (demoSection) {
        demoSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Initialize framework tabs
 */
function initializeFrameworkTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const codeExamples = document.querySelectorAll('.code-example');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const framework = button.dataset.framework;
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Show corresponding example
            codeExamples.forEach(example => {
                example.classList.remove('active');
                if (example.id === `${framework}-example`) {
                    example.classList.add('active');
                }
            });
        });
    });
}

/**
 * Utility functions
 */
const utils = {
    /**
     * Format number as Japanese currency
     */
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY'
        }).format(amount);
    },
    
    /**
     * Validate Japanese text input
     */
    isJapaneseText: (text) => {
        return /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\uFF00-\uFFEF\s]*$/.test(text);
    },
    
    /**
     * Debounce function for input handling
     */
    debounce: (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    }
};

// Export for use in other scripts
window.FarertDemo = {
    api: () => farertApi,
    calculateFare,
    utils
};

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`📊 Page load time: ${Math.round(loadTime)}ms`);
        
        // Send analytics if available
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                value: Math.round(loadTime),
                custom_parameter: 'demo_site'
            });
        }
    });
}