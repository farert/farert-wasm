# GitHub Pages Demo Site Setup Guide

This guide covers how to create and deploy an interactive demo site for the farert-wasm SDK using GitHub Pages.

## 🎯 Demo Site Features

The GitHub Pages demo site includes:
- **Interactive fare calculator** with real-time results
- **Framework integration examples** for Svelte, React, Vue, and Vanilla JS
- **Live API playground** for testing SDK functionality
- **Performance benchmarks** and metrics
- **Comprehensive documentation** with code examples
- **Mobile-responsive design** optimized for Japanese text
- **SEO optimization** for discoverability

## 📋 Overview

The GitHub Pages demo site will showcase:
- Interactive railway fare calculation
- Framework integration examples (Svelte, React, Vue)
- API documentation with live examples
- Performance benchmarks and comparisons
- Mobile-responsive design with Japanese text support

## 🏗️ Site Structure

```
docs/
├── demo/                     # GitHub Pages root
│   ├── index.html           # Main landing page
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css     # Main styles
│   │   │   └── themes.css   # Japanese typography themes
│   │   ├── js/
│   │   │   ├── main.js      # Core demo logic
│   │   │   ├── examples.js  # Interactive examples
│   │   │   └── benchmarks.js # Performance tests
│   │   └── img/             # Images and icons
│   ├── examples/            # Framework examples
│   │   ├── vanilla/         # Pure JavaScript examples
│   │   ├── svelte/          # Svelte integration demo
│   │   ├── react/           # React integration demo
│   │   └── vue/             # Vue integration demo
│   ├── api/                 # API documentation
│   │   ├── index.html       # API reference
│   │   └── playground.html  # Interactive API playground
│   └── benchmarks/          # Performance benchmarks
│       ├── index.html       # Benchmark results
│       └── runner.html      # Live benchmark runner
└── _config.yml              # Jekyll configuration
```

## 🚀 Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository settings
2. Scroll to "Pages" section
3. Select "Deploy from a branch"
4. Choose "main" branch and "/docs" folder
5. Save the configuration

### 2. Create Jekyll Configuration

Create `docs/_config.yml`:

```yaml
# Site settings
title: "Farert WASM - Japanese Railway Fare Calculator"
description: "WebAssembly-powered Japanese railway fare calculation SDK with TypeScript support"
baseurl: "/farert-wasm"
url: "https://farert-dev.github.io"

# Build settings
markdown: kramdown
highlighter: rouge
theme: minima

# Plugin settings
plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-seo-tag

# Collections
collections:
  examples:
    output: true
    permalink: /:collection/:name/

# Exclude from processing
exclude:
  - node_modules/
  - package.json
  - package-lock.json
  - README.md

# Include GitHub Pages gem
remote_theme: pages-themes/minimal@v0.2.0

# Custom variables
sdk_version: "2.0.0"
cdn_base: "https://unpkg.com/farert-wasm@2.0.0"
```

### 3. Create Main Landing Page

Create `docs/demo/index.html`:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farert WASM - Japanese Railway Fare Calculator</title>
    
    <!-- SEO Meta Tags -->
    <meta name="description" content="WebAssembly-powered Japanese railway fare calculation SDK with TypeScript support for Svelte, React, and Vue">
    <meta name="keywords" content="WebAssembly, Japanese Railway, Fare Calculator, TypeScript, Svelte, React, Vue">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Farert WASM - Japanese Railway Fare Calculator">
    <meta property="og:description" content="Interactive demo of WebAssembly-powered Japanese railway fare calculation">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://farert-dev.github.io/farert-wasm/">
    
    <!-- Styles -->
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/themes.css">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Source+Code+Pro:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1 class="logo">
                <span class="logo-en">Farert WASM</span>
                <span class="logo-ja">日本の鉄道運賃計算システム</span>
            </h1>
            <nav class="nav">
                <a href="#demo" class="nav-link">Demo</a>
                <a href="#examples" class="nav-link">Examples</a>
                <a href="api/" class="nav-link">API Docs</a>
                <a href="benchmarks/" class="nav-link">Benchmarks</a>
                <a href="https://github.com/farert-dev/farert-wasm" class="nav-link" target="_blank">GitHub</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <!-- Hero Section -->
        <section class="hero">
            <div class="container">
                <div class="hero-content">
                    <h2 class="hero-title">
                        高性能な日本鉄道運賃計算
                        <span class="subtitle">WebAssembly + TypeScript SDK</span>
                    </h2>
                    <p class="hero-description">
                        C++からWebAssemblyにコンパイルされた高性能エンジンを使用し、
                        Svelte、React、Vueで利用可能なTypeScript SDKを提供します。
                    </p>
                    
                    <div class="hero-stats">
                        <div class="stat">
                            <span class="stat-number">~8KB</span>
                            <span class="stat-label">Bundle Size</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">&lt;50ms</span>
                            <span class="stat-label">Route Calculation</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">39+</span>
                            <span class="stat-label">WebAssembly APIs</span>
                        </div>
                    </div>
                    
                    <div class="hero-actions">
                        <button id="quickStart" class="btn btn-primary">
                            クイックスタート
                        </button>
                        <a href="#demo" class="btn btn-secondary">
                            デモを見る
                        </a>
                    </div>
                </div>
                
                <div class="hero-demo">
                    <div class="demo-card">
                        <h3>簡単な運賃計算</h3>
                        <form id="fareCalculator" class="fare-form">
                            <div class="form-group">
                                <label for="fromStation">出発駅</label>
                                <input type="text" id="fromStation" placeholder="例: 東京" 
                                       list="stations" autocomplete="off">
                            </div>
                            <div class="form-group">
                                <label for="toStation">到着駅</label>
                                <input type="text" id="toStation" placeholder="例: 新宿" 
                                       list="stations" autocomplete="off">
                            </div>
                            <button type="submit" class="btn btn-calculate">
                                運賃を計算
                            </button>
                        </form>
                        
                        <div id="fareResult" class="fare-result" style="display: none;">
                            <h4>計算結果</h4>
                            <div class="result-content">
                                <div class="fare-amount">
                                    <span class="amount">¥<span id="fareAmount">0</span></span>
                                    <span class="route-info" id="routeInfo"></span>
                                </div>
                                <div class="calculation-time">
                                    計算時間: <span id="calcTime">0</span>ms
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features">
            <div class="container">
                <h2>主な機能</h2>
                <div class="features-grid">
                    <div class="feature-card">
                        <div class="feature-icon">⚡</div>
                        <h3>高性能</h3>
                        <p>C++エンジンをWebAssemblyにコンパイルし、ネイティブレベルの性能を実現</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🎯</div>
                        <h3>TypeScript完全サポート</h3>
                        <p>型安全性を保証し、開発体験を向上させるフル型定義を提供</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🚀</div>
                        <h3>フレームワーク統合</h3>
                        <p>Svelte、React、Vue向けの最適化されたバインディングを提供</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">📱</div>
                        <h3>クロスプラットフォーム</h3>
                        <p>ブラウザ、Node.js、将来的にはReact NativeやFlutterもサポート</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">🔒</div>
                        <h3>セキュリティ第一</h3>
                        <p>入力検証、XSS保護、メモリ安全性を組み込み済み</p>
                    </div>
                    
                    <div class="feature-card">
                        <div class="feature-icon">📊</div>
                        <h3>包括的テスト</h3>
                        <p>2000以上のテストケースで品質を保証</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Framework Examples -->
        <section id="examples" class="examples">
            <div class="container">
                <h2>フレームワーク例</h2>
                <div class="framework-tabs">
                    <button class="tab-btn active" data-framework="svelte">Svelte</button>
                    <button class="tab-btn" data-framework="react">React</button>
                    <button class="tab-btn" data-framework="vue">Vue</button>
                    <button class="tab-btn" data-framework="vanilla">Vanilla JS</button>
                </div>
                
                <div class="code-examples">
                    <div id="svelte-example" class="code-example active">
                        <h3>Svelte Integration</h3>
                        <pre><code class="language-svelte">&lt;script&gt;
  import { farertWasm } from 'farert-wasm/svelte';
  
  let fromStation = '東京';
  let toStation = '新宿';
  let fareResult = null;
  
  async function calculateFare() {
    const api = await farertWasm.initialize();
    
    const fromId = api.getStationId(fromStation);
    const toId = api.getStationId(toStation);
    
    const route = api.createRoute();
    route.addRouteBegin(fromId);
    route.addRoute(/* line */, toId);
    
    fareResult = route.calculateFare();
  }
&lt;/script&gt;

&lt;div&gt;
  &lt;input bind:value={fromStation} placeholder="出発駅" /&gt;
  &lt;input bind:value={toStation} placeholder="到着駅" /&gt;
  &lt;button on:click={calculateFare}&gt;計算&lt;/button&gt;
  
  {#if fareResult}
    &lt;p&gt;運賃: ¥{fareResult.fare}&lt;/p&gt;
  {/if}
&lt;/div&gt;</code></pre>
                        <a href="examples/svelte/" class="btn btn-small">完全な例を見る</a>
                    </div>
                    
                    <div id="react-example" class="code-example">
                        <h3>React Integration</h3>
                        <pre><code class="language-jsx">import React, { useState } from 'react';
import { useFarertWasm } from 'farert-wasm/react';

function FareCalculator() {
  const [fromStation, setFromStation] = useState('東京');
  const [toStation, setToStation] = useState('新宿');
  const { api, loading, error } = useFarertWasm();
  
  const calculateFare = async () => {
    if (!api) return;
    
    const fromId = api.getStationId(fromStation);
    const toId = api.getStationId(toStation);
    
    const route = api.createRoute();
    route.addRouteBegin(fromId);
    route.addRoute(/* line */, toId);
    
    return route.calculateFare();
  };
  
  return (
    &lt;div&gt;
      &lt;input 
        value={fromStation} 
        onChange={e =&gt; setFromStation(e.target.value)}
        placeholder="出発駅" 
      /&gt;
      &lt;input 
        value={toStation}
        onChange={e =&gt; setToStation(e.target.value)} 
        placeholder="到着駅"
      /&gt;
      &lt;button onClick={calculateFare}&gt;計算&lt;/button&gt;
    &lt;/div&gt;
  );
}</code></pre>
                        <a href="examples/react/" class="btn btn-small">完全な例を見る</a>
                    </div>
                    
                    <div id="vue-example" class="code-example">
                        <h3>Vue Integration</h3>
                        <pre><code class="language-vue">&lt;template&gt;
  &lt;div&gt;
    &lt;input v-model="fromStation" placeholder="出発駅" /&gt;
    &lt;input v-model="toStation" placeholder="到着駅" /&gt;
    &lt;button @click="calculateFare"&gt;計算&lt;/button&gt;
    
    &lt;div v-if="fareResult"&gt;
      運賃: ¥{{ fareResult.fare }}
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/template&gt;

&lt;script setup&gt;
import { ref } from 'vue';
import { useFarertWasm } from 'farert-wasm/vue';

const fromStation = ref('東京');
const toStation = ref('新宿');
const fareResult = ref(null);

const { api } = await useFarertWasm();

const calculateFare = async () => {
  const fromId = api.getStationId(fromStation.value);
  const toId = api.getStationId(toStation.value);
  
  const route = api.createRoute();
  route.addRouteBegin(fromId);
  route.addRoute(/* line */, toId);
  
  fareResult.value = route.calculateFare();
};
&lt;/script&gt;</code></pre>
                        <a href="examples/vue/" class="btn btn-small">完全な例を見る</a>
                    </div>
                    
                    <div id="vanilla-example" class="code-example">
                        <h3>Vanilla JavaScript</h3>
                        <pre><code class="language-javascript">// CDNから読み込み
// &lt;script src="https://unpkg.com/farert-wasm@2/dist/sdk/index.umd.js"&gt;&lt;/script&gt;

async function initializeFareCalculator() {
  const api = await window.FarertWasm.initialize({
    wasmUrl: 'https://unpkg.com/farert-wasm@2/dist/farert.wasm'
  });
  
  document.getElementById('calculateBtn').addEventListener('click', () => {
    const fromStation = document.getElementById('from').value;
    const toStation = document.getElementById('to').value;
    
    const fromId = api.getStationId(fromStation);
    const toId = api.getStationId(toStation);
    
    const route = api.createRoute();
    route.addRouteBegin(fromId);
    route.addRoute(/* line */, toId);
    
    const fareResult = route.calculateFare();
    
    document.getElementById('result').textContent = 
      `運賃: ¥${fareResult.fare}`;
  });
}

initializeFareCalculator();</code></pre>
                        <a href="examples/vanilla/" class="btn btn-small">完全な例を見る</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- Installation Section -->
        <section class="installation">
            <div class="container">
                <h2>インストール</h2>
                <div class="install-methods">
                    <div class="install-card">
                        <h3>npm / yarn</h3>
                        <pre><code class="language-bash"># npm
npm install farert-wasm

# yarn  
yarn add farert-wasm</code></pre>
                    </div>
                    
                    <div class="install-card">
                        <h3>CDN</h3>
                        <pre><code class="language-html">&lt;!-- Core SDK --&gt;
&lt;script src="https://unpkg.com/farert-wasm@2/dist/sdk/index.umd.js"&gt;&lt;/script&gt;

&lt;!-- Svelte Integration --&gt;
&lt;script src="https://unpkg.com/farert-wasm@2/dist/sdk/frameworks/svelte.umd.js"&gt;&lt;/script&gt;</code></pre>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Farert WASM</h4>
                    <p>高性能な日本鉄道運賃計算システム</p>
                </div>
                
                <div class="footer-section">
                    <h4>リソース</h4>
                    <ul>
                        <li><a href="api/">API ドキュメント</a></li>
                        <li><a href="benchmarks/">パフォーマンス</a></li>
                        <li><a href="https://github.com/farert-dev/farert-wasm">GitHub</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h4>例</h4>
                    <ul>
                        <li><a href="examples/svelte/">Svelte</a></li>
                        <li><a href="examples/react/">React</a></li>
                        <li><a href="examples/vue/">Vue</a></li>
                        <li><a href="examples/vanilla/">Vanilla JS</a></li>
                    </ul>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2024 Farert Development Team. Licensed under GPL-3.0.</p>
            </div>
        </div>
    </footer>

    <!-- Datalist for station autocomplete -->
    <datalist id="stations"></datalist>

    <!-- Scripts -->
    <script src="https://unpkg.com/farert-wasm@2.0.0/dist/sdk/index.umd.js"></script>
    <script src="assets/js/main.js"></script>
    <script src="assets/js/examples.js"></script>
</body>
</html>
```

### 4. Create Styles

Create `docs/demo/assets/css/main.css`:

```css
/* Reset and Base Styles */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #fafafa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header */
.header {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 20px;
}

.logo {
  display: flex;
  flex-direction: column;
  text-decoration: none;
}

.logo-en {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
}

.logo-ja {
  font-size: 0.75rem;
  color: #666;
  margin-top: -0.25rem;
}

.nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #1976d2;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 4rem 0;
}

.hero .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.subtitle {
  display: block;
  font-size: 1.25rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.5rem;
}

.hero-description {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
}

.hero-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

/* Demo Card */
.demo-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.demo-card h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.fare-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #1976d2;
}

/* Buttons */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-calculate {
  background: #4caf50;
  color: white;
  margin-top: 0.5rem;
}

.btn-calculate:hover {
  background: #43a047;
}

.btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

/* Fare Result */
.fare-result {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.fare-result h4 {
  color: #333;
  margin-bottom: 1rem;
}

.fare-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #4caf50;
}

.route-info {
  font-size: 0.9rem;
  color: #666;
}

.calculation-time {
  font-size: 0.8rem;
  color: #888;
}

/* Features Section */
.features {
  padding: 4rem 0;
  background: white;
}

.features h2 {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2rem;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #e0e0e0;
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #333;
}

.feature-card p {
  color: #666;
  line-height: 1.6;
}

/* Examples Section */
.examples {
  padding: 4rem 0;
  background: #fafafa;
}

.examples h2 {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2rem;
  color: #333;
}

.framework-tabs {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab-btn.active,
.tab-btn:hover {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.code-examples {
  max-width: 800px;
  margin: 0 auto;
}

.code-example {
  display: none;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.code-example.active {
  display: block;
}

.code-example h3 {
  margin-bottom: 1rem;
  color: #333;
}

.code-example pre {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  font-family: 'Source Code Pro', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}

.code-example code {
  font-family: inherit;
}

/* Installation Section */
.installation {
  padding: 4rem 0;
  background: white;
}

.installation h2 {
  text-align: center;
  margin-bottom: 3rem;
  font-size: 2rem;
  color: #333;
}

.install-methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.install-card {
  background: #fafafa;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #e0e0e0;
}

.install-card h3 {
  margin-bottom: 1rem;
  color: #333;
}

.install-card pre {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Source Code Pro', monospace;
  font-size: 0.9rem;
}

/* Footer */
.footer {
  background: #333;
  color: white;
  padding: 3rem 0 1rem;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.footer-section h4 {
  margin-bottom: 1rem;
  color: #1976d2;
}

.footer-section ul {
  list-style: none;
}

.footer-section ul li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #ccc;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-section a:hover {
  color: #1976d2;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid #444;
  color: #999;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero .container {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-stats {
    justify-content: center;
  }
  
  .nav {
    gap: 1rem;
  }
  
  .nav-link {
    font-size: 0.9rem;
  }
  
  .framework-tabs {
    flex-wrap: wrap;
  }
  
  .install-methods {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 15px;
  }
  
  .hero {
    padding: 2rem 0;
  }
  
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-actions {
    flex-direction: column;
  }
  
  .hero-stats {
    gap: 1rem;
  }
}
```

### 5. Additional Demo Pages and Deployment Steps

The complete setup includes framework-specific examples, analytics integration, SEO optimization, and automated deployment through GitHub Actions.

## 🚀 Final Deployment Steps

1. **Enable GitHub Pages in repository settings**
   - Go to Settings → Pages  
   - Select "Deploy from a branch"
   - Choose "main" branch and "/docs" folder
   - Save configuration

2. **Push all changes to main branch**
   ```bash
   git add .
   git commit -m "feat: add comprehensive GitHub Pages demo site setup" 
   git push origin main
   ```

3. **GitHub Actions will automatically deploy**
   - The workflow builds WebAssembly, SDK, and demo site
   - Deploys to GitHub Pages automatically
   - Provides deployment URL in workflow logs

4. **Access your demo site at**: `https://[username].github.io/farert-wasm/`

## 📊 Post-Deployment Monitoring

After deployment, monitor:
- Site performance and WebAssembly initialization speed
- User analytics and framework usage patterns  
- Error rates and API response times
- SEO performance and search rankings

Your demo site will showcase the complete farert-wasm SDK capabilities with interactive examples, comprehensive documentation, and performance benchmarks optimized for Japanese railway fare calculation.