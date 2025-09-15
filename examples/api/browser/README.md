# Browser Integration Examples

🌐 **Complete browser-based integration examples for the Farert Railway WebAssembly API**

## 📋 Overview

This directory contains comprehensive examples demonstrating how to integrate the Farert WebAssembly railway fare calculation module into modern web browsers. The examples showcase real-time station lookups, route building, fare calculations, and advanced railway data queries in a fully interactive web application.

## 🗂️ Files

| File | Description | Purpose |
|------|-------------|---------|
| [`browser-integration.html`](browser-integration.html) | Complete interactive web application | Comprehensive demo with all API features |
| [`browser-integration-enhanced.html`](browser-integration-enhanced.html) | **Enhanced SDK integration demo** | Modern ES6+ patterns with SDK utilities and lazy loading |
| [`adaptive-framework-module.js`](adaptive-framework-module.js) | **🆕 Adaptive framework module** | Framework detection, performance monitoring, error recovery |
| [`adaptive-framework-demo.html`](adaptive-framework-demo.html) | **🆕 Adaptive framework demo** | Interactive showcase of adaptive loading and framework detection |
| [`enhanced-sdk-module.js`](enhanced-sdk-module.js) | **ES6 module with SDK wrapper** | Reusable module for production integration |
| [`test-compatibility.js`](test-compatibility.js) | Browser compatibility testing | Cross-browser validation |
| [`README.md`](README.md) | This documentation file | Setup and usage instructions |

## 🚀 Quick Start

### 1. Prerequisites

Ensure the WebAssembly module is built and available:

```bash
# From project root
npm run build
# OR
source setup_env.sh && make all
```

### 2. File Structure Required

The browser example expects the following file structure:

```
farert-wasm/
├── examples/api/browser/
│   └── browser-integration.html
└── dist/
    ├── farert.js      # Emscripten JavaScript wrapper
    └── farert.wasm    # WebAssembly module
```

### 3. Running the Examples

#### Option A: Local HTTP Server (Recommended)

```bash
# From project root - serve the entire project
npx serve . -p 8080

# Open browser to:
# Standard Integration:
# http://localhost:8080/examples/api/browser/browser-integration.html

# Enhanced SDK Integration:
# http://localhost:8080/examples/api/browser/browser-integration-enhanced.html

# 🆕 Adaptive Framework Integration:
# http://localhost:8080/examples/api/browser/adaptive-framework-demo.html
```

#### Option B: Python HTTP Server

```bash
# From project root
python3 -m http.server 8080

# Open browser to:
# http://localhost:8080/examples/api/browser/browser-integration.html
```

#### Option C: Node.js HTTP Server

```bash
# From project root
npx http-server . -p 8080 -c-1

# Open browser to:
# http://localhost:8080/examples/api/browser/browser-integration.html
```

### 4. Cross-Browser Compatibility

✅ **Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

❌ **Not Supported:**
- Internet Explorer (any version)
- Browsers without WebAssembly support

## 🎯 Integration Approaches

### 📦 Standard Integration (`browser-integration.html`)
Traditional WebAssembly integration with:
- Inline JavaScript implementation
- Direct WebAssembly API calls
- Comprehensive UI/UX demonstration
- Cross-browser compatibility

### ⚡ Enhanced SDK Integration (`browser-integration-enhanced.html`)
Modern ES6+ patterns with SDK utilities:
- **SDK Browser Utilities** - Input validation, formatting, and parsing
- **Lazy Loading** - Progressive module loading with performance optimization
- **Framework Detection** - Automatic environment and framework detection
- **ES6 Module Patterns** - Dynamic imports and module bundling
- **Enhanced Error Handling** - Graceful degradation and user feedback
- **Performance Monitoring** - Memory usage and loading metrics

### 🆕 **Adaptive Framework Integration** (`adaptive-framework-demo.html`)
**Advanced integration with automatic framework detection and adaptive loading:**
- **🔍 Framework Detection** - Automatic detection of Svelte, React, Vue, Angular, or vanilla environments
- **⚡ Adaptive Loading Strategies** - Optimized loading based on detected framework and environment
- **📊 Performance Monitoring** - Real-time metrics including memory usage, load times, and cache efficiency
- **🔄 Error Recovery** - Comprehensive error handling with automatic retry and fallback strategies
- **🎯 Intelligent Caching** - Framework-specific caching strategies (aggressive, moderate, minimal)
- **🛠️ Production Ready** - Enterprise-grade patterns for complex application scenarios

**Key Features:**
- **Automatic Environment Detection** - Browser, Node.js, SSR, development mode detection
- **Confidence-Based Detection** - High/medium/low confidence scoring for framework identification
- **Adaptive Recommendations** - Loading strategy optimization based on framework characteristics
- **Memory Management** - Automatic cleanup, garbage collection, and memory leak prevention
- **Cross-Browser Support** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ with feature detection

### 🔧 Reusable Module (`enhanced-sdk-module.js`)
Production-ready ES6 module for integration:
- `EnhancedFarertAPI` class wrapper
- Browser compatibility checking
- Progressive enhancement detection
- Memory management and cleanup
- Framework-agnostic design

## 🎯 Features Demonstrated

### 🔍 Station Search
- **Real-time station lookup** by Japanese name
- **Station information display** including ID, reading (kana), and junction status
- **Connecting lines discovery** showing all lines serving the station
- **Error handling** for non-existent stations with user-friendly messages

### 🚈 Line Information
- **Line search** by Japanese name (路線名)
- **Complete station listing** for any line with pagination
- **Junction station highlighting** within line displays
- **Performance optimization** for lines with many stations

### 🗺️ Route Builder & Fare Calculator
- **Interactive route construction** with start station, via line, and end station
- **Real-time fare calculation** using the WebAssembly API
- **Route validation** ensuring all components exist in the database
- **Visual route display** with step-by-step breakdown

### 🏢 Prefecture-Based Queries
- **Dynamic prefecture dropdown** populated from the database
- **Prefecture line listing** showing all lines within a selected prefecture
- **Company vs. prefecture differentiation** using ID ranges

### ⚗️ Advanced Demonstrations
- **Junction station discovery** showing major transfer points
- **Company line analysis** demonstrating JR company structure
- **Memory usage monitoring** for long-running applications

## 🔧 Technical Implementation

### Enhanced SDK Integration Example

The enhanced integration demonstrates modern ES6+ patterns:

```javascript
// Import SDK utilities using ES6 modules
import {
    formatStationName,
    validateStationId,
    createRouteValidator,
    detectFramework
} from '../../../src/sdk/utils/browser.js';

import {
    LazyLoader,
    createFrameworkLazyLoader
} from '../../../src/sdk/core/lazy-loader.js';

// Enhanced API wrapper with SDK utilities
class EnhancedFarertAPI {
    constructor() {
        this.lazyLoader = createFrameworkLazyLoader('vanilla');
        this.validators = {
            station: createStationValidator(),
            route: createRouteValidator()
        };
    }

    async searchStation(stationName) {
        // Use SDK formatting and validation
        const formattedName = formatStationName(stationName);
        const stationId = this.wasmModule.getStationId(formattedName);

        if (stationId > 0) {
            const isValid = validateStationId(stationId);
            return { stationId, isValid, formatted: formattedName };
        }
        return { found: false };
    }
}
```

### Lazy Loading Implementation

```javascript
// Progressive module loading
const loader = new LazyLoader({
    strategy: 'lazy',
    cacheEnabled: true,
    performanceMonitoring: true
});

// Load modules conditionally
const svelteModule = await loader.loadSvelteModule('stores');
const reactModule = await loader.loadReactModule('hooks');

// Monitor performance
const metrics = loader.getMetrics();
console.log(`Cache hit ratio: ${metrics.cacheHitRatio * 100}%`);
```

### WebAssembly Module Loading

```javascript
class BrowserWasmLoader {
    async loadModule() {
        // 1. Fetch the Emscripten-generated JavaScript
        const response = await fetch('../../dist/farert.js');
        const jsContent = await response.text();

        // 2. Execute in browser context
        const script = document.createElement('script');
        script.textContent = jsContent;
        document.head.appendChild(script);

        // 3. Initialize with browser-specific configuration
        this.module = await new Promise((resolve, reject) => {
            Module({
                locateFile: (path, prefix) => {
                    if (path.endsWith('.wasm')) {
                        return '../../dist/farert.wasm';
                    }
                    return prefix + path;
                },
                onRuntimeInitialized: () => resolve(Module),
                onAbort: (error) => reject(new Error(`WASM aborted: ${error}`))
            });
        });

        return this.module;
    }
}
```

### Error Handling Strategy

The browser integration implements comprehensive error handling:

1. **WebAssembly Loading Errors**
   - Missing files detection with specific error messages
   - Network failure handling with retry suggestions
   - Browser compatibility checks

2. **Database Connection Errors**
   - Database file validation
   - Connection status monitoring
   - Graceful degradation for failed operations

3. **API Call Errors**
   - Input validation before WebAssembly calls
   - Result validation and type checking
   - User-friendly error messages in Japanese and English

4. **Memory Management**
   - Automatic memory usage monitoring
   - Page visibility change handling
   - Memory leak prevention for long-running sessions

## 🎨 UI/UX Features

### Real-Time Feedback
- **Loading indicators** for all asynchronous operations
- **Status panels** showing WebAssembly and database connection status
- **Progressive enhancement** gracefully handling missing API functions

### Responsive Design
- **Mobile-friendly layout** with responsive grid system
- **Touch-optimized controls** for mobile devices
- **Accessibility considerations** with proper ARIA labels and keyboard navigation

### Visual Design
- **Modern gradient backgrounds** and glassmorphism effects
- **Status indicators** with color-coded system states
- **Interactive animations** for user engagement
- **Japanese typography** optimized display

## 📊 API Function Coverage

The browser integration demonstrates these WebAssembly APIs:

### Core Functions ✅
```javascript
// Station operations
getStationId(name: string): number
getStationName(id: number): string
getKanaFromStationId(id: number): string    // Reading display
isJunction(stationId: number): boolean

// Line operations
getLineId(name: string): number
getLineName(id: number): string
getStationIdsOfLine(lineId: number): number[]
getLineIdsFromStation(stationId: number): number[]

// Route building
addRouteBegin(stationId: number): boolean
addRoute(lineId: number, stationId: number): boolean
calculateFare(): number
routeScript(): string

// Geographic queries
getPrefects(): number[]
getJRCompanys(): number[]
companyOrPrefectName(id: number): string
linesCompanyOrPrefectId(id: number): number[]
```

### Optional Functions ⚠️
```javascript
// Advanced functionality (may not be available in all builds)
getJunctionIdsOfLine(lineId: number): number[]
stationsWithinCompanyOrPrefectAndLine(prefectId: number, lineId: number): number[]
```

## 🔍 Example Use Cases

### 1. Station Information Lookup
```javascript
// Search for Tokyo Station
const tokyoId = wasmModule.getStationId("東京");
const stationName = wasmModule.getStationName(tokyoId);
const isJunction = wasmModule.isJunction(tokyoId);
const connectingLines = wasmModule.getLineIdsFromStation(tokyoId);
```

### 2. Route and Fare Calculation
```javascript
// Build route: Tokyo → Yokohama via Tokaido Line
const tokyoId = wasmModule.getStationId("東京");
const tokaidoId = wasmModule.getLineId("東海道線");
const yokohamaId = wasmModule.getStationId("横浜");

wasmModule.addRouteBegin(tokyoId);
wasmModule.addRoute(tokaidoId, yokohamaId);
const fare = wasmModule.calculateFare(); // Returns fare in yen
```

### 3. Prefecture Line Discovery
```javascript
// Get all lines in Kanagawa Prefecture
const prefects = JSON.parse(wasmModule.getPrefects());
const kanagawaId = prefects.find(id =>
    wasmModule.companyOrPrefectName(id).includes('神奈川')
);
const lines = JSON.parse(wasmModule.linesCompanyOrPrefectId(kanagawaId));
```

## ⚠️ Important Considerations

### CORS Policy
When running locally, ensure your HTTP server supports CORS or serves from the same origin:

```bash
# Serve from project root to avoid CORS issues
npx serve . -p 8080
# NOT: npx serve examples/api/browser -p 8080
```

### File Paths
The example uses relative paths to access WebAssembly files:
- `../../dist/farert.js` - Emscripten JavaScript wrapper
- `../../dist/farert.wasm` - WebAssembly binary

### Memory Management
For production use, implement proper cleanup:

```javascript
// Monitor memory usage
function checkMemoryUsage() {
    if (performance.memory) {
        const used = performance.memory.usedJSHeapSize;
        const total = performance.memory.totalJSHeapSize;
        console.log(`Memory: ${(used/1024/1024).toFixed(2)}MB / ${(total/1024/1024).toFixed(2)}MB`);
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (wasmModule && wasmModule.closeDatabase) {
        wasmModule.closeDatabase();
    }
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. "Failed to fetch farert.js"
```
Error: Failed to fetch farert.js: 404 Not Found
```
**Solution:** Ensure the WebAssembly module is built and served from the correct path:
```bash
npm run build  # Build the WASM module
npx serve . -p 8080  # Serve from project root
```

#### 2. "WebAssembly module aborted"
```
Error: WebAssembly module aborted: RuntimeError
```
**Possible causes:**
- Database file missing or corrupted
- Insufficient browser memory
- Incompatible WebAssembly binary

**Solution:**
```bash
# Rebuild the WebAssembly module
source setup_env.sh && make clean && make all
```

#### 3. "Module is not defined"
```
ReferenceError: Module is not defined
```
**Solution:** Check that the Emscripten JavaScript is loading correctly and the script execution order is maintained.

#### 4. Station/Line Not Found
```
Station "東京" not found (ID: 0)
```
**Common fixes:**
- Use exact Japanese characters: `東京` not `东京`
- Check for full-width vs half-width characters
- Verify station exists in JR database scope
- Try alternative spellings: `御茶ノ水` not `お茶の水`

### Performance Optimization

#### For Large Datasets
```javascript
// Implement pagination for long lists
function displayStationsWithPagination(stations, pageSize = 20) {
    const totalPages = Math.ceil(stations.length / pageSize);
    // Display only current page...
}

// Use requestAnimationFrame for smooth updates
function updateDisplay(data) {
    requestAnimationFrame(() => {
        // Update DOM with new data
    });
}
```

#### Memory Management
```javascript
// Periodic memory cleanup
setInterval(() => {
    if (window.gc) {
        window.gc(); // Chrome with --js-flags="--expose-gc"
    }
    checkMemoryUsage();
}, 30000); // Every 30 seconds
```

## 📚 Integration Patterns

### For React Applications
```jsx
import { useEffect, useState } from 'react';

function useWasmModule() {
    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadWasm() {
            const loader = new BrowserWasmLoader();
            const wasmModule = await loader.loadModule();
            await loader.initializeDatabase();
            setModule(wasmModule);
            setLoading(false);
        }
        loadWasm();
    }, []);

    return { module, loading };
}
```

### For Vue.js Applications
```javascript
import { ref, onMounted } from 'vue';

export function useWasmModule() {
    const module = ref(null);
    const loading = ref(true);

    onMounted(async () => {
        const loader = new BrowserWasmLoader();
        module.value = await loader.loadModule();
        await loader.initializeDatabase();
        loading.value = false;
    });

    return { module, loading };
}
```

### For Svelte Applications
```javascript
import { writable } from 'svelte/store';

export const wasmModule = writable(null);
export const wasmLoading = writable(true);

export async function initializeWasm() {
    const loader = new BrowserWasmLoader();
    const module = await loader.loadModule();
    await loader.initializeDatabase();

    wasmModule.set(module);
    wasmLoading.set(false);
}
```

## 🚀 Next Steps

1. **Production Integration:** Adapt the browser loading patterns for your framework
2. **Error Handling:** Implement application-specific error handling and recovery
3. **Performance:** Add caching layers for frequently accessed data
4. **User Experience:** Customize the UI/UX to match your application design
5. **Testing:** Implement comprehensive cross-browser testing suite

## 📖 Related Documentation

- [API Reference](../../../docs/api-reference.md) - Complete API documentation
- [Basic Examples](../basic/) - Simpler API usage examples
- [TypeScript Examples](../typescript/) - Type-safe integration patterns
- [Project CLAUDE.md](../../../CLAUDE.md) - Complete project overview

---

**Note:** This browser integration serves as a comprehensive reference implementation. For production use, consider implementing proper state management, caching strategies, and error recovery mechanisms appropriate for your specific use case.