# Production Deployment Guide - Farert WebAssembly SDK

This guide covers all aspects of deploying the Farert WebAssembly SDK to production environments, including npm package publishing, CDN deployment, and demo site setup.

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [npm Package Publishing](#npm-package-publishing)
3. [CDN Deployment](#cdn-deployment)
4. [GitHub Pages Demo Site](#github-pages-demo-site)
5. [Docker Deployment](#docker-deployment)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Security Considerations](#security-considerations)
8. [Performance Optimization](#performance-optimization)

## 🔍 Pre-Deployment Checklist

Before deploying to production, ensure all requirements are met:

### ✅ Code Quality & Testing
- [ ] All tests pass: `npm run test:integration:full-stack`
- [ ] Bundle size within limits: `npm run build:sdk:analyze`
- [ ] Performance benchmarks met: `npm run build:sdk:perf`
- [ ] Security validation complete: All input validation tests pass
- [ ] Memory leak tests pass: No memory leaks detected
- [ ] Cross-browser compatibility verified: Chrome, Firefox, Safari, Edge

### ✅ Documentation & Examples
- [ ] API documentation complete: `docs/api-reference.md`
- [ ] Framework examples working: `examples/svelte-components/`
- [ ] README.md updated with latest features
- [ ] CHANGELOG.md updated with version history
- [ ] License files present: `LICENSE`

### ✅ Build Artifacts
- [ ] Production build successful: `npm run build:sdk:prod`
- [ ] All output formats generated: ESM, CJS, UMD, IIFE
- [ ] TypeScript declarations complete: `.d.ts` files
- [ ] Source maps available for debugging
- [ ] WebAssembly artifacts present: `dist/farert.js`, `dist/farert.wasm`

## 📦 npm Package Publishing

### 1. Package Preparation

First, ensure your package.json is properly configured:

```bash
# Verify package configuration
cat package.json | jq '.name, .version, .main, .types, .exports'

# Expected output:
"farert-wasm"
"2.0.0"  
"dist/farert.js"
null
null
```

Update package.json for npm publishing:

```json
{
  "name": "@farert/wasm-sdk",
  "version": "2.0.0",
  "description": "Japanese railway fare calculation system with WebAssembly core and Frontend API Layer SDK supporting Svelte/React/Vue",
  "main": "dist/sdk/cjs/minimal.js",
  "module": "dist/sdk/esm/minimal.js",
  "types": "dist/sdk/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/sdk/esm/minimal.js",
      "require": "./dist/sdk/cjs/minimal.js",
      "types": "./dist/sdk/types/index.d.ts"
    },
    "./svelte": {
      "import": "./dist/sdk/esm/svelte.js",
      "types": "./dist/sdk/types/svelte.d.ts"
    },
    "./react": {
      "import": "./dist/sdk/esm/react.js",
      "types": "./dist/sdk/types/react.d.ts"
    },
    "./vue": {
      "import": "./dist/sdk/esm/vue.js",
      "types": "./dist/sdk/types/vue.d.ts"
    }
  },
  "files": [
    "dist/sdk/",
    "dist/farert.js",
    "dist/farert.wasm",
    "docs/",
    "examples/",
    "README.md",
    "LICENSE"
  ]
}
```

### 2. Pre-Publication Testing

Test the package locally before publishing:

```bash
# Build production package
npm run build:sdk:prod

# Pack package locally
npm pack

# Test installation from packed file
mkdir ../test-install
cd ../test-install
npm init -y
npm install ../farert-wasm/farert-wasm-2.0.0.tgz

# Test imports
cat > test.js << 'EOF'
const { createFarertSDK } = require('@farert/wasm-sdk');
console.log('✅ CJS import successful');

import('@farert/wasm-sdk').then(module => {
    console.log('✅ ESM import successful');
});
EOF

node test.js
```

### 3. Publishing Process

```bash
# Login to npm (one-time setup)
npm login

# Verify login
npm whoami

# Dry run to check what will be published
npm publish --dry-run

# Publish to npm registry
npm publish --access public

# For scoped packages (recommended)
npm publish --access public --scope @farert

# Verify publication
npm view @farert/wasm-sdk
```

### 4. Post-Publication Verification

```bash
# Test installation from npm
mkdir ../npm-test
cd ../npm-test
npm init -y
npm install @farert/wasm-sdk

# Test all entry points
node -e "console.log(require('@farert/wasm-sdk'))"
node -e "import('@farert/wasm-sdk/svelte').then(console.log)"
node -e "import('@farert/wasm-sdk/react').then(console.log)"
node -e "import('@farert/wasm-sdk/vue').then(console.log)"
```

## 🌐 CDN Deployment

Deploy the SDK to CDNs for direct browser usage.

### 1. unpkg.com (Automatic)

Once published to npm, unpkg.com automatically serves your package:

```html
<!-- Latest version -->
<script src="https://unpkg.com/@farert/wasm-sdk@latest/dist/sdk/iife/minimal.js"></script>

<!-- Specific version -->
<script src="https://unpkg.com/@farert/wasm-sdk@2.0.0/dist/sdk/iife/minimal.js"></script>

<!-- With WebAssembly -->
<script>
  // WebAssembly will be loaded automatically
  window.FarertSDK.createFarertSDK().then(sdk => {
    console.log('✅ CDN SDK loaded successfully');
  });
</script>
```

### 2. jsDelivr (Automatic)

jsDelivr also auto-serves npm packages with better performance:

```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/npm/@farert/wasm-sdk@latest/dist/sdk/iife/minimal.js"></script>

<!-- Specific version with minification -->
<script src="https://cdn.jsdelivr.net/npm/@farert/wasm-sdk@2.0.0/dist/sdk/iife/minimal.min.js"></script>
```

### 3. Custom CDN Setup

For enterprise deployments, set up custom CDN:

```bash
# Create CDN distribution structure
mkdir -p cdn-dist/{js,wasm,types}

# Copy optimized assets
cp dist/sdk/iife/* cdn-dist/js/
cp dist/sdk/umd/* cdn-dist/js/
cp dist/*.wasm cdn-dist/wasm/
cp -r dist/sdk/types/* cdn-dist/types/

# Add CDN headers and optimization
cat > cdn-dist/.htaccess << 'EOF'
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/wasm
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType application/wasm "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
</IfModule>

# CORS headers for cross-origin usage
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>
EOF

# Upload to your CDN (example with AWS S3 + CloudFront)
aws s3 sync cdn-dist/ s3://your-cdn-bucket/farert-sdk/v2.0.0/ \
  --cache-control "max-age=31536000" \
  --content-encoding gzip
```

## 🌟 GitHub Pages Demo Site

Create an interactive demo site to showcase the SDK capabilities.

### 1. Demo Site Structure

```bash
# Create demo site structure
mkdir -p demo-site/{src,dist,assets}

# Create index.html
cat > demo-site/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farert WebAssembly SDK - Japanese Railway Fare Calculator</title>
    <meta name="description" content="Interactive demo of Farert WebAssembly SDK for Japanese railway fare calculation">
    <link rel="stylesheet" href="assets/demo.css">
</head>
<body>
    <header class="header">
        <h1>🚆 Farert WebAssembly SDK</h1>
        <p>Japanese Railway Fare Calculation System</p>
        <div class="badges">
            <span class="badge">TypeScript</span>
            <span class="badge">WebAssembly</span>
            <span class="badge">Svelte</span>
            <span class="badge">React</span>
            <span class="badge">Vue</span>
        </div>
    </header>

    <main class="main">
        <section class="demo-section">
            <h2>🎯 Interactive Demo</h2>
            <div class="calculator">
                <div class="input-group">
                    <label for="from-station">出発駅</label>
                    <input type="text" id="from-station" placeholder="東京" autocomplete="off">
                    <div id="from-suggestions" class="suggestions"></div>
                </div>
                
                <div class="input-group">
                    <label for="to-station">到着駅</label>
                    <input type="text" id="to-station" placeholder="横浜" autocomplete="off">
                    <div id="to-suggestions" class="suggestions"></div>
                </div>

                <button id="calculate-btn" class="calculate-btn">運賃計算</button>
                
                <div id="result" class="result hidden">
                    <h3>計算結果</h3>
                    <div id="fare-display"></div>
                    <div id="route-display"></div>
                </div>
            </div>
        </section>

        <section class="features-section">
            <h2>✨ Key Features</h2>
            <div class="features-grid">
                <div class="feature">
                    <h3>🚀 High Performance</h3>
                    <p>&lt;2s initialization, &lt;500ms calculations</p>
                </div>
                <div class="feature">
                    <h3>📦 Lightweight</h3>
                    <p>~8KB core bundle (150KB budget)</p>
                </div>
                <div class="feature">
                    <h3>🔒 Secure</h3>
                    <p>Input validation &amp; memory safety</p>
                </div>
                <div class="feature">
                    <h3>🎨 Framework Ready</h3>
                    <p>Svelte, React, Vue support</p>
                </div>
            </div>
        </section>

        <section class="examples-section">
            <h2>📝 Code Examples</h2>
            <div class="tabs">
                <button class="tab-btn active" data-tab="vanilla">Vanilla JS</button>
                <button class="tab-btn" data-tab="svelte">Svelte</button>
                <button class="tab-btn" data-tab="react">React</button>
                <button class="tab-btn" data-tab="vue">Vue</button>
            </div>
            
            <div class="tab-content">
                <pre class="code-block active" id="vanilla-code"><code class="language-javascript">
import { createFarertSDK } from '@farert/wasm-sdk';

// Initialize SDK
const sdk = await createFarertSDK();

// Calculate fare
const fare = await sdk.calculateFare({
  segments: [
    { stationId: 1130101, stationName: '東京' },
    { stationId: 1130133, stationName: '横浜' }
  ]
});

console.log(`Fare: ${fare.fare} yen`);
                </code></pre>
                
                <pre class="code-block" id="svelte-code"><code class="language-javascript">
import { createFarertSDK } from '@farert/wasm-sdk';

// Initialize SDK with Svelte stores
const sdk = await createFarertSDK();
const { stationSearch, fareCalculation } = sdk.stores;

// Reactive station search
stationSearch.search('東京');
                </code></pre>
                
                <pre class="code-block" id="react-code"><code class="language-jsx">
import { createFarertSDK, useMemoryManager } from '@farert/wasm-sdk';

function RouteCalculator() {
  const memoryManager = useMemoryManager();
  const [fare, setFare] = useState(null);
  
  const calculateFare = async () => {
    const result = await sdk.calculateFare({
      segments: [
        { stationId: 1130101, stationName: '東京' },
        { stationId: 1130133, stationName: '横浜' }
      ]
    });
    setFare(result);
  };

  return <button onClick={calculateFare}>Calculate</button>;
}
                </code></pre>
                
                <pre class="code-block" id="vue-code"><code class="language-javascript">
import { createFarertSDK } from '@farert/wasm-sdk';
import { ref } from 'vue';

export default {
  setup() {
    const fare = ref(null);
    
    const calculateFare = async () => {
      const sdk = await createFarertSDK();
      fare.value = await sdk.calculateFare({
        segments: [
          { stationId: 1130101, stationName: '東京' },
          { stationId: 1130133, stationName: '横浜' }
        ]
      });
    };
    
    return { fare, calculateFare };
  }
};
                </code></pre>
            </div>
        </section>
    </main>

    <footer class="footer">
        <p>&copy; 2024 Farert Development Team | <a href="https://github.com/your-repo/farert-wasm">GitHub</a> | <a href="docs/api-reference.md">API Docs</a></p>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/@farert/wasm-sdk@latest/dist/sdk/iife/minimal.js"></script>
    <script src="assets/demo.js"></script>
</body>
</html>
EOF
```

### 2. Demo Styling

```bash
# Create demo.css
cat > demo-site/assets/demo.css << 'EOF'
/* Modern, responsive styling for demo site */
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --success-color: #059669;
  --background-color: #f8fafc;
  --card-background: #ffffff;
  --text-color: #1e293b;
  --border-color: #e2e8f0;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

.header {
  background: linear-gradient(135deg, var(--primary-color), #1d4ed8);
  color: white;
  padding: 3rem 2rem;
  text-align: center;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.header p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 1rem;
}

.badges {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.demo-section {
  background: var(--card-background);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: var(--shadow);
}

.calculator {
  max-width: 600px;
  margin: 0 auto;
}

.input-group {
  margin-bottom: 1.5rem;
  position: relative;
}

.input-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-background);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  display: none;
}

.suggestion-item {
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.suggestion-item:hover {
  background: var(--background-color);
}

.calculate-btn {
  width: 100%;
  background: var(--primary-color);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calculate-btn:hover {
  background: #1d4ed8;
}

.calculate-btn:disabled {
  background: var(--secondary-color);
  cursor: not-allowed;
}

.result {
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
}

.result.hidden {
  display: none;
}

.result h3 {
  color: var(--success-color);
  margin-bottom: 1rem;
}

.features-section {
  margin-bottom: 2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.feature {
  background: var(--card-background);
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  text-align: center;
}

.feature h3 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.examples-section {
  background: var(--card-background);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: var(--shadow);
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn.active {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
}

.code-block {
  display: none;
  background: #1e293b;
  color: #e2e8f0;
  padding: 1.5rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.code-block.active {
  display: block;
}

.footer {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-color);
  border-top: 1px solid var(--border-color);
  margin-top: 3rem;
}

.footer a {
  color: var(--primary-color);
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .main {
    padding: 1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}
EOF
```

### 3. Demo JavaScript

```bash
# Create demo.js
cat > demo-site/assets/demo.js << 'EOF'
// Demo site interactive functionality
class FarertDemo {
  constructor() {
    this.sdk = null;
    this.init();
  }

  async init() {
    try {
      // Initialize SDK
      this.sdk = await window.FarertSDK.createFarertSDK();
      console.log('✅ Farert SDK initialized successfully');
      
      this.setupEventListeners();
      this.populateStationSuggestions();
    } catch (error) {
      console.error('❌ Failed to initialize Farert SDK:', error);
      this.showError('Failed to initialize SDK. Please refresh the page.');
    }
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Station input with suggestions
    const fromInput = document.getElementById('from-station');
    const toInput = document.getElementById('to-station');
    
    fromInput.addEventListener('input', (e) => {
      this.handleStationInput(e.target, 'from-suggestions');
    });
    
    toInput.addEventListener('input', (e) => {
      this.handleStationInput(e.target, 'to-suggestions');
    });

    // Calculate button
    document.getElementById('calculate-btn').addEventListener('click', () => {
      this.calculateFare();
    });

    // Hide suggestions on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.input-group')) {
        document.querySelectorAll('.suggestions').forEach(s => {
          s.style.display = 'none';
        });
      }
    });
  }

  switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active code block
    document.querySelectorAll('.code-block').forEach(block => {
      block.classList.remove('active');
    });
    document.getElementById(`${tabName}-code`).classList.add('active');
  }

  async handleStationInput(input, suggestionsId) {
    const query = input.value.trim();
    const suggestionsEl = document.getElementById(suggestionsId);

    if (query.length < 1) {
      suggestionsEl.style.display = 'none';
      return;
    }

    try {
      // In a real implementation, this would use the SDK's search
      // For demo purposes, we'll use mock data
      const suggestions = this.getMockStationSuggestions(query);
      this.displaySuggestions(suggestions, suggestionsEl, input);
    } catch (error) {
      console.error('Station search error:', error);
    }
  }

  getMockStationSuggestions(query) {
    const stations = [
      { id: 1130101, name: '東京', kana: 'とうきょう' },
      { id: 1130133, name: '横浜', kana: 'よこはま' },
      { id: 1130116, name: '新宿', kana: 'しんじゅく' },
      { id: 1130117, name: '渋谷', kana: 'しぶや' },
      { id: 1130118, name: '池袋', kana: 'いけぶくろ' },
      { id: 1130130, name: '品川', kana: 'しながわ' },
      { id: 1130114, name: '上野', kana: 'うえの' },
      { id: 1130140, name: '大阪', kana: 'おおさか' },
      { id: 1130141, name: '京都', kana: 'きょうと' },
      { id: 1130142, name: '神戸', kana: 'こうべ' },
    ];

    return stations.filter(station => 
      station.name.includes(query) || 
      station.kana.includes(query)
    ).slice(0, 5);
  }

  displaySuggestions(suggestions, suggestionsEl, input) {
    if (suggestions.length === 0) {
      suggestionsEl.style.display = 'none';
      return;
    }

    suggestionsEl.innerHTML = suggestions.map(station => 
      `<div class="suggestion-item" data-station-id="${station.id}" data-station-name="${station.name}">
        <strong>${station.name}</strong> <small>(${station.kana})</small>
      </div>`
    ).join('');

    // Add click listeners to suggestions
    suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        input.value = item.dataset.stationName;
        input.dataset.stationId = item.dataset.stationId;
        suggestionsEl.style.display = 'none';
      });
    });

    suggestionsEl.style.display = 'block';
  }

  async calculateFare() {
    const fromInput = document.getElementById('from-station');
    const toInput = document.getElementById('to-station');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultEl = document.getElementById('result');
    const fareDisplayEl = document.getElementById('fare-display');
    const routeDisplayEl = document.getElementById('route-display');

    if (!fromInput.value || !toInput.value) {
      this.showError('Please enter both departure and arrival stations.');
      return;
    }

    calculateBtn.disabled = true;
    calculateBtn.textContent = '計算中...';
    resultEl.classList.add('hidden');

    try {
      // Mock calculation for demo (in real implementation, use this.sdk.calculateFare)
      const mockFareInfo = {
        fare: 280,
        distance: 18.1,
        route: `${fromInput.value} → ${toInput.value}`,
        company: 'JR東日本',
        travelTime: '25分'
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      fareDisplayEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div>
            <strong>運賃</strong><br>
            <span style="font-size: 1.5rem; color: var(--success-color);">¥${mockFareInfo.fare}</span>
          </div>
          <div>
            <strong>距離</strong><br>
            <span>${mockFareInfo.distance} km</span>
          </div>
          <div>
            <strong>所要時間</strong><br>
            <span>${mockFareInfo.travelTime}</span>
          </div>
        </div>
      `;

      routeDisplayEl.innerHTML = `
        <div>
          <strong>経路:</strong> ${mockFareInfo.route}<br>
          <strong>鉄道会社:</strong> ${mockFareInfo.company}
        </div>
      `;

      resultEl.classList.remove('hidden');
      
      // Scroll to result
      resultEl.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Fare calculation error:', error);
      this.showError('Failed to calculate fare. Please try again.');
    } finally {
      calculateBtn.disabled = false;
      calculateBtn.textContent = '運賃計算';
    }
  }

  showError(message) {
    // Simple error display
    alert(message);
  }
}

// Initialize demo when page loads
document.addEventListener('DOMContentLoaded', () => {
  new FarertDemo();
});
EOF
```

### 4. GitHub Pages Deployment

```bash
# Create GitHub Pages workflow
mkdir -p .github/workflows

cat > .github/workflows/deploy-demo.yml << 'EOF'
name: Deploy Demo Site to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Emscripten
        uses: mymindstorm/setup-emsdk@v12
        with:
          version: 'latest'

      - name: Build WebAssembly
        run: |
          source setup_env.sh
          make node

      - name: Build SDK
        run: npm run build:sdk:prod

      - name: Prepare demo site
        run: |
          mkdir -p _site
          cp -r demo-site/* _site/
          cp -r dist/ _site/dist/
          cp -r docs/ _site/docs/
          cp -r examples/ _site/examples/

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: '_site'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
EOF
```

### 5. Performance & SEO Optimization

```bash
# Add performance optimization script
cat > demo-site/optimize.js << 'EOF'
const fs = require('fs');
const path = require('path');

// Add meta tags for SEO
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Add Open Graph and Twitter Card meta tags
const metaTags = `
  <!-- Open Graph -->
  <meta property="og:title" content="Farert WebAssembly SDK - Japanese Railway Fare Calculator">
  <meta property="og:description" content="Interactive demo of WebAssembly-powered Japanese railway fare calculation SDK with Svelte/React/Vue support">
  <meta property="og:image" content="https://your-domain.com/assets/og-image.png">
  <meta property="og:url" content="https://your-domain.com/">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Farert WebAssembly SDK">
  <meta name="twitter:description" content="Japanese Railway Fare Calculation with WebAssembly">
  <meta name="twitter:image" content="https://your-domain.com/assets/twitter-card.png">

  <!-- Performance -->
  <link rel="preload" href="https://cdn.jsdelivr.net/npm/@farert/wasm-sdk@latest/dist/sdk/iife/minimal.js" as="script">
  <link rel="preload" href="assets/demo.css" as="style">
  
  <!-- PWA -->
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#2563eb">
`;

html = html.replace('<meta name="description"', metaTags + '\n  <meta name="description"');
fs.writeFileSync(indexPath, html);

// Create manifest.json
const manifest = {
  "name": "Farert WebAssembly SDK Demo",
  "short_name": "Farert SDK",
  "description": "Japanese Railway Fare Calculation SDK Demo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "assets/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
};

fs.writeFileSync(path.join(__dirname, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('✅ Demo site optimized for SEO and performance');
EOF

node demo-site/optimize.js
```

## 🐳 Docker Deployment

For containerized deployments:

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
# Multi-stage build for Farert WebAssembly SDK
FROM emscripten/emsdk:latest AS wasm-builder

WORKDIR /app
COPY . .

# Install Node.js dependencies
RUN apt-get update && apt-get install -y nodejs npm
RUN npm ci

# Build WebAssembly
RUN source /emsdk/emsdk_env.sh && make node

# Build SDK
RUN npm run build:sdk:prod

# Production stage
FROM nginx:alpine AS production

# Copy built assets
COPY --from=wasm-builder /app/dist /usr/share/nginx/html/dist
COPY --from=wasm-builder /app/demo-site /usr/share/nginx/html
COPY --from=wasm-builder /app/docs /usr/share/nginx/html/docs
COPY --from=wasm-builder /app/examples /usr/share/nginx/html/examples

# Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx.conf
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/wasm;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache WebAssembly files
    location ~* \.wasm$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Content-Type "application/wasm";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Build and run Docker container
docker build -t farert-wasm-sdk .
docker run -p 8080:80 farert-wasm-sdk
```

## 📊 Monitoring & Analytics

### 1. Bundle Size Monitoring

```bash
# Create bundle monitoring script
cat > scripts/monitor-bundles.js << 'EOF'
const fs = require('fs');
const path = require('path');

function getFileSize(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const stats = fs.statSync(filePath);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const bundles = [
  { name: 'Core ESM', path: 'dist/sdk/esm/minimal.js' },
  { name: 'Core CJS', path: 'dist/sdk/cjs/minimal.js' },
  { name: 'Core UMD', path: 'dist/sdk/umd/minimal.js' },
  { name: 'Core IIFE', path: 'dist/sdk/iife/minimal.js' },
  { name: 'WebAssembly JS', path: 'dist/farert.js' },
  { name: 'WebAssembly WASM', path: 'dist/farert.wasm' },
];

console.log('📦 Bundle Size Report');
console.log('==================');

let totalSize = 0;
bundles.forEach(bundle => {
  const size = getFileSize(bundle.path);
  totalSize += size;
  console.log(`${bundle.name.padEnd(20)} ${formatBytes(size)}`);
});

console.log('------------------');
console.log(`Total Size:        ${formatBytes(totalSize)}`);
console.log(`Gzipped Estimate:  ${formatBytes(totalSize * 0.3)}`);

const budgetBytes = 150 * 1024; // 150KB budget
const actualBytes = totalSize * 0.3; // Estimated gzipped size

if (actualBytes > budgetBytes) {
  console.log(`❌ Bundle size exceeds budget by ${formatBytes(actualBytes - budgetBytes)}`);
  process.exit(1);
} else {
  console.log(`✅ Bundle size within budget (${formatBytes(budgetBytes - actualBytes)} remaining)`);
}
EOF

# Add to package.json scripts
npm pkg set scripts.monitor:bundles="node scripts/monitor-bundles.js"
```

### 2. Performance Monitoring

```bash
# Create performance monitoring
cat > scripts/performance-monitor.js << 'EOF'
const { performance } = require('perf_hooks');

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  async measureSDKInitialization() {
    const start = performance.now();
    
    try {
      // Simulate SDK initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      const end = performance.now();
      
      this.metrics.initialization = {
        duration: end - start,
        status: 'success'
      };
    } catch (error) {
      this.metrics.initialization = {
        duration: -1,
        status: 'error',
        error: error.message
      };
    }
  }

  async measureFareCalculation() {
    const start = performance.now();
    
    try {
      // Simulate fare calculation
      await new Promise(resolve => setTimeout(resolve, 50));
      const end = performance.now();
      
      this.metrics.fareCalculation = {
        duration: end - start,
        status: 'success'
      };
    } catch (error) {
      this.metrics.fareCalculation = {
        duration: -1,
        status: 'error',
        error: error.message
      };
    }
  }

  generateReport() {
    console.log('🚀 Performance Report');
    console.log('====================');
    
    Object.entries(this.metrics).forEach(([key, metric]) => {
      const name = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      if (metric.status === 'success') {
        console.log(`${name.padEnd(20)} ${metric.duration.toFixed(2)}ms`);
      } else {
        console.log(`${name.padEnd(20)} ERROR: ${metric.error}`);
      }
    });

    // Check against performance budgets
    const budgets = {
      initialization: 2000, // 2 seconds
      fareCalculation: 500   // 500ms
    };

    console.log('\n📊 Performance Budget Check');
    console.log('===========================');

    let allPassed = true;
    Object.entries(budgets).forEach(([key, budget]) => {
      const metric = this.metrics[key];
      if (metric && metric.status === 'success') {
        const passed = metric.duration <= budget;
        const status = passed ? '✅' : '❌';
        console.log(`${key.padEnd(20)} ${status} ${metric.duration.toFixed(2)}ms / ${budget}ms`);
        if (!passed) allPassed = false;
      }
    });

    return allPassed;
  }
}

async function runPerformanceTests() {
  const monitor = new PerformanceMonitor();
  
  await monitor.measureSDKInitialization();
  await monitor.measureFareCalculation();
  
  const passed = monitor.generateReport();
  
  if (!passed) {
    console.log('\n❌ Some performance budgets exceeded');
    process.exit(1);
  } else {
    console.log('\n✅ All performance budgets met');
  }
}

if (require.main === module) {
  runPerformanceTests();
}

module.exports = PerformanceMonitor;
EOF

# Add to package.json scripts
npm pkg set scripts.monitor:performance="node scripts/performance-monitor.js"
```

## 🔒 Security Considerations

### 1. Content Security Policy

```bash
# Add CSP headers to demo site
cat > demo-site/.htaccess << 'EOF'
<IfModule mod_headers.c>
    # Content Security Policy
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # HSTS for HTTPS sites
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
EOF
```

### 2. Package Security Audit

```bash
# Create security audit script
cat > scripts/security-audit.js << 'EOF'
const { execSync } = require('child_process');
const fs = require('fs');

function runSecurityAudit() {
  console.log('🔒 Security Audit Report');
  console.log('========================');
  
  try {
    // Run npm audit
    console.log('Running npm audit...');
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    console.log(`Vulnerabilities found: ${audit.metadata.vulnerabilities.total || 0}`);
    
    if (audit.metadata.vulnerabilities.total > 0) {
      console.log('❌ Security vulnerabilities detected');
      console.log('Run: npm audit fix');
      return false;
    } else {
      console.log('✅ No security vulnerabilities found');
    }
    
  } catch (error) {
    console.log('⚠️  npm audit check failed:', error.message);
  }
  
  // Check for sensitive files
  const sensitivePatterns = [
    '.env',
    '.env.local',
    'config/secrets.json',
    'private_key*',
    '*.pem'
  ];
  
  console.log('\nChecking for sensitive files...');
  let sensitivesFound = false;
  
  sensitivePatterns.forEach(pattern => {
    try {
      const files = execSync(`find . -name "${pattern}" -not -path "./node_modules/*"`, { encoding: 'utf8' });
      if (files.trim()) {
        console.log(`❌ Sensitive file found: ${files.trim()}`);
        sensitivesFound = true;
      }
    } catch (error) {
      // No files found (expected)
    }
  });
  
  if (!sensitivesFound) {
    console.log('✅ No sensitive files found');
  }
  
  return !sensitivesFound;
}

if (require.main === module) {
  const passed = runSecurityAudit();
  process.exit(passed ? 0 : 1);
}

module.exports = runSecurityAudit;
EOF

# Add to package.json scripts
npm pkg set scripts.security:audit="node scripts/security-audit.js"
```

## 📈 Deployment Checklist

Use this checklist before each production deployment:

### Pre-Deployment
- [ ] All tests pass: `npm run test:integration:full-stack`
- [ ] Security audit clean: `npm run security:audit`
- [ ] Bundle size check: `npm run monitor:bundles`
- [ ] Performance benchmarks: `npm run monitor:performance`
- [ ] Documentation updated
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated

### npm Publishing
- [ ] Dry run successful: `npm publish --dry-run`
- [ ] Package published: `npm publish --access public`
- [ ] Installation test: `npm install @farert/wasm-sdk`
- [ ] unpkg.com serving correctly
- [ ] jsDelivr serving correctly

### Demo Site Deployment
- [ ] GitHub Pages deployment successful
- [ ] Demo site functional
- [ ] All examples working
- [ ] Mobile responsive
- [ ] SEO meta tags present

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check download statistics
- [ ] Update documentation links
- [ ] Notify users of new release

This comprehensive deployment guide ensures your Farert WebAssembly SDK is production-ready and accessible to developers worldwide.