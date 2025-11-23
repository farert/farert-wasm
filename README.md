**本リポジトリは多くはAIによりコーディングされ、ドキュメントを出力しています。そのため、一部の情報について、ハルシネーションがあることをご了承の上、ご参照ください.**
- 本リポジトリは全面リニューアルする予定です（今度はLLMに過度に頼りません）

# Farert WebAssembly -  経路運賃営業キロ計算アプリ

Complete WebAssembly implementation of C++ railway fare calculation engine with modern TypeScript SDK. Provides CLI tools and frontend framework integrations for building 経路運賃営業キロ計算アプリ.

## 🎯 プロジェクトの目標

元のC++実装との100%の互換性を維持しつつ、最新のWebAssembly APIとフロントエンドSDKを提供することです。

- ✅ **Complete Migration**: `testmain.cpp` → TypeScript CLI with identical results
- ✅ **Frontend API Layer SDK**: Production-ready Svelte/React/Vue/vanilla JS integration  
- ✅ **Type Safety**: Full TypeScript support with strict mode
- ✅ **Cross-Platform**: Browser, Node.js, and SvelteKit SSR support
- ✅ **Performance**: <150KB bundle, <2s initialization, <500ms calculations

## ⚠️ Current Database Coverage

**Supported Railways** (229 lines in database):
- ✅ **JR Lines**: All JR companies (East, Central, West, Hokkaido, Shikoku, Kyushu)
- ✅ **Third Sector**: IGR Iwate Galaxy, IR Ishikawa, Ainokaze Toyama, Echigo Tokimeki Railway, etc.

**Database**: Based on `jrdbnewest.db` (last updated 2025-08-03, 660KB)

## 🚀 Quick Start

### Method 1: DevContainer (Recommended) 🐳

最も簡単で確実な方法です。必要な全てのツールが自動的にセットアップされます：
Windows なかたはWSL経由以外でしたらこれしか選択肢はないでしょう。

**前提条件:**
- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker Desktop](https://www.docker.com/get-started/)
- Dev Containers拡張機能 (VSCode内でインストール)

**セットアップ:**
```bash
# 1. プロジェクトをクローン
git clone https://github.com/your-org/farert-wasm.git
cd farert-wasm

# 2. VSCodeで開く
code .

# 3. DevContainerで開く
# Command Palette (Cmd/Ctrl+Shift+P) → "Dev Containers: Reopen in Container"
# または左下の緑アイコンをクリック → "Reopen in Container"

# 4. 自動セットアップ完了後、すぐに開発開始！
make node           # WebAssembly build
npm run cli:build   # TypeScript CLI build
npm run cli:exec    # Test execution
```

すべてのツール（Node.js、Emscripten、TypeScript等）が自動的にインストール・設定されます。

### Method 2: ローカル環境セットアップ

#### Required Dependencies

```bash
# Node.js 16.0.0+ (or latest LTS)
node --version

# TypeScript (推奨)
npm install -g typescript

# Git (for Emscripten SDK installation)
git --version
```

#### Emscripten SDK Installation

Choose one of the following installation methods:

##### Method 1: Project-local Installation (Recommended)

Install Emscripten SDK in your project directory or a dedicated tools folder:

```bash
# Option A: Install in project directory
cd /path/to/your/farert-wasm
mkdir -p tools
cd tools
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Option B: Install in user tools directory
mkdir -p ~/tools
cd ~/tools
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# Install and activate latest stable version
./emsdk install latest
./emsdk activate latest

# Set up environment (run each time you need Emscripten)
source ./emsdk_env.sh

# Verify installation
emcc --version
em++ --version
```

##### Method 2: System-wide Installation

```bash
# macOS (Homebrew)
brew install emscripten

# Ubuntu/Debian
sudo apt-get install emscripten

# Arch Linux
sudo pacman -S emscripten

# Verify installation
emcc --version
```

##### Method 3: VSCode DevContainer (Easiest)

Use our pre-configured development environment:

```bash
# 1. Install VSCode and Docker
# 2. Install "Dev Containers" extension in VSCode
# 3. Open project in VSCode
# 4. Press F1 → "Dev Containers: Reopen in Container"
# 5. Everything is automatically configured!
```

#### Environment Setup

For project-local installation, create a setup script:

```bash
# Create setup_emscripten.sh in your project root
cat > setup_emscripten.sh << 'EOF'
#!/bin/bash
# Auto-detect Emscripten installation
if [ -d "./tools/emsdk" ]; then
    export EMSDK_ROOT="./tools/emsdk"
elif [ -d "~/tools/emsdk" ]; then
    export EMSDK_ROOT="~/tools/emsdk"
elif [ -d "../emsdk" ]; then
    export EMSDK_ROOT="../emsdk"
else
    echo "❌ Emscripten SDK not found. Please install it first."
    exit 1
fi

source "$EMSDK_ROOT/emsdk_env.sh"
echo "✅ Emscripten environment activated: $(emcc --version | head -1)"
EOF

chmod +x setup_emscripten.sh

# Use the setup script
source setup_emscripten.sh
```

### Build and Run CLI

#### Quick Start (with existing Emscripten)

```bash
# Method 1: Use auto-detection script (recommended)
source setup_emscripten.sh && make node

# Method 2: Use provided setup script
source setup_env.sh && make node

# Method 3: Manual Emscripten setup (adjust path as needed)
source ./tools/emsdk/emsdk_env.sh && make node
# or
source ~/tools/emsdk/emsdk_env.sh && make node

# TypeScript CLI compilation
npm run cli:build

# Test fare calculation (choose one method)
node dist/cli/cli/main.js -5 "東京" "東海道線" "品川" "山手線" "新宿"    # Direct (recommended)
npm run cli -- -5 "東京" "東海道線" "品川" "山手線" "新宿"             # Via npm (may show warnings)

# Full test suite execution
npm run cli:exec
```

#### First-time Setup (Complete Installation)

Choose your preferred method:

##### Option 1: DevContainer (Recommended for new users)

```bash
# 1. Install requirements
# - VSCode: https://code.visualstudio.com/
# - Docker: https://www.docker.com/get-started/
# - Dev Containers extension in VSCode

# 2. Open project and start container
code .
# Press F1 → "Dev Containers: Reopen in Container"

# 3. Build and test (everything is pre-configured)
make node
npm run cli:build
npm run cli:exec
```

##### Option 2: Local Installation

```bash
# 1. Install Emscripten SDK locally
mkdir -p tools
cd tools
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
cd ../..

# 2. Build WebAssembly module
source tools/emsdk/emsdk_env.sh
make node

# 3. Install npm dependencies and build CLI
npm install
npm run cli:build

# 4. Test the installation
node dist/cli/cli/main.js -5 "東京" "東海道線" "品川"
```

##### Option 3: System-wide Emscripten

```bash
# 1. Install Emscripten system-wide (see installation methods above)
brew install emscripten  # macOS
# or apt-get install emscripten  # Ubuntu

# 2. Build and test
make node
npm install
npm run cli:build
node dist/cli/cli/main.js -5 "東京" "東海道線" "品川"
```

> **Note**: For CLI route calculations, we recommend using direct Node.js execution (`node dist/cli/cli/main.js`) instead of `npm run cli` to avoid npm configuration warnings.

### Frontend SDK Quick Start

```bash
# Build production-ready SDK
npm run build:sdk:prod

# Analyze bundle size
npm run build:sdk:analyze
```

#### Svelte/SvelteKit Integration

```typescript
import { createFarertSDK } from '@farert/sdk';

// Initialize SDK with Svelte stores
const sdk = await createFarertSDK();
const { stationSearch, fareCalculation } = sdk.stores;

// Reactive station search
stationSearch.search('東京');
```

#### React Integration  

```typescript
import { createFarertSDK, useMemoryManager } from '@farert/sdk';

function RouteCalculator() {
  const memoryManager = useMemoryManager();
  
  const calculateFare = async () => {
    const fare = await sdk.calculateFare({
      segments: [
        { stationId: 1130101, stationName: '東京' },
        { stationId: 1130133, stationName: '横浜' }
      ]
    });
    return fare;
  };
}
```

#### Vanilla JavaScript

```typescript
import { createFarertSDK } from '@farert/sdk';

const sdk = await createFarertSDK();
const fare = await sdk.calculateFare({
  segments: [
    { stationId: 1130101, stationName: '東京' },
    { stationId: 1130133, stationName: '横浜' }
  ]
});

console.log(`Fare: ${fare.fare} yen`);
```

### Development Server

```bash
# Start development server with auto port selection
source setup_env.sh && make serve

# Open browser at http://localhost:8080
```

## 🏗️ Architecture

```text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ TypeScript CLI  │ -> │ 6 Object Classes │ -> │ 39+ WASM APIs   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                |                         |
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Modern Frontend  │    │ C++ Core Logic  │
                       │ React/Vue/Svelte │    │ + SQLite3 DB    │
                       └──────────────────┘    └─────────────────┘
```

### Core Technology Stack

- **WebAssembly**: Compiled with Emscripten
- **C++17**: Optimization level `-O3`
- **TypeScript**: Strict mode required
- **SQLite3**: Embedded via MEMFS
- **Database**: `jrdbnewest.db` (All Japanese stations/lines data)

## 📋 Available Commands

### Make Commands

```bash
make node          # Node.js compatible WebAssembly build
make all           # Browser WebAssembly build  
make serve         # Start development server
make clean         # Remove build artifacts
make status        # Check project status
make help          # Show all commands
```

### npm Scripts

```bash
# Core Build Commands
npm run build      # Complete build (WASM + TypeScript)
npm run cli:build  # TypeScript CLI only
npm run cli:exec   # Execute full test suite
npm run cli   # CLI execution with parameters
npm run dev        # Development mode
npm run clean      # Cleanup

# Frontend API Layer SDK Commands
npm run build:sdk:dev      # Development SDK build
npm run build:sdk:prod     # Production SDK build with optimization
npm run build:sdk:analyze  # Bundle size analysis and reporting
npm run build:sdk:perf     # Performance validation
npm run build:sdk:types    # TypeScript declaration generation
```

## 🧪 Testing and Verification

### CLI Test Execution

```bash
# Full test suite (verify identical results with C++ version)
npm run cli:exec

# Individual route calculation (choose one method)
# Method 1: Direct execution (recommended, no warnings) 
node dist/cli/cli/main.js -5 "東京" "東海道線" "品川" "山手線" "新宿"

# Method 2: Via npm (may show harmless warnings)
npm run cli -- -5 "東京" "東海道線" "品川" "山手線" "新宿"

# Complex route calculation example
node dist/cli/cli/main.js -5 "茂市" "山田線" "盛岡" "田沢湖線" "大曲" "奥羽線" "新庄" "陸羽西線" "余目" "羽越線" "新津" "信越線(直江津-新潟)" "宮内" "上越線" "越後川口" "飯山線" "豊野" "しなの鉄道(北)" "長野"
```

### Programming Usage Example

```typescript
import { wasmLoader } from './src/cli/wasm_loader';

const module = await wasmLoader.loadModule();
const dbResult = module.openDatabase();  // Database connection

// Get station IDs
const tokyoId = module.getStationId('東京');
const yokohamaId = module.getStationId('横浜'); 

// Create route and calculate fare
module.createRoute();
module.addRouteBegin(tokyoId);
module.addRoute(0, yokohamaId);  // lineId=0 for auto-route
const fare = module.calculateFare();

console.log(`Fare: ${fare} yen`);
```

## 🎨 Object-Oriented API

### 6 Class Hierarchy

```typescript
// Inheritance: cCalcRoute < cRoute < cRouteList
const route = new module.cRoute();
route.setupRoute("東京 東海道線 横浜");

const calcRoute = new module.cCalcRoute(route);
const fareInfo = calcRoute.calcFare();

console.log(`Fare: ${fareInfo.fare} yen`);
console.log(`Route: ${fareInfo.routeList}`);
```

### Complete Object Classes

- `cRouteList`: Basic route container
- `cRoute`: Route construction features
- `cCalcRoute`: Fare calculation features  
- `cRouteItem`: Route elements
- `cRouteFlag`: Route flag management
- `FareInfo`: Detailed fare information

## 📁 Project Structure

```text
farert-wasm/
├── src/
│   ├── core/           # C++ implementation (route_interface.cpp, alpdb.cpp)
│   ├── include/        # C++ headers (route_interface.h)
│   ├── cli/           # TypeScript CLI implementation
│   ├── sdk/           # Frontend API Layer SDK
│   │   ├── core/       # Core SDK with memory management and security
│   │   ├── svelte/     # Svelte stores and components
│   │   ├── react/      # React hooks and utilities
│   │   ├── vue/        # Vue composables and utilities
│   │   └── utils/      # Framework-agnostic utilities
│   ├── db/            # Database operations
│   └── farert_wasm.cpp # WebAssembly bindings
├── dist/              # Build outputs
│   ├── farert.js/.wasm       # Browser version
│   ├── farert_node.js/.wasm  # Node.js version
│   └── sdk/                  # SDK build outputs (ESM, CJS, UMD, IIFE)
├── docs/              # API documentation and examples
├── examples/          # Framework integration examples
│   ├── cli/               # CLI usage examples and demos
│   └── svelte-components/ # Svelte component showcase
├── tests/             # Testing infrastructure
│   ├── cli/               # CLI tests and validation
│   └── integration/       # Full-stack integration tests
├── build/             # Build configuration
├── data/              # SQLite database
├── .claude/           # Claude Code specifications
└── third_party/       # SQLite3 source
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Emscripten Environment Errors

##### em++ command not found

```bash
❌ em++ command not found
❌ emcc: command not found

# Solution 1: Use setup script (recommended)
source setup_env.sh && make

# Solution 2: Manual environment setup
source ~/priv/farert.repos/emsdk/emsdk_env.sh
make

# Solution 3: Check Emscripten installation
cd ~/priv/farert.repos/emsdk
./emsdk list
./emsdk install latest
./emsdk activate latest
```

##### Emscripten SDK Missing

```bash
❌ No such file or directory: ./tools/emsdk/ or ~/tools/emsdk/

# Solution 1: Use DevContainer (recommended)
# Open project in VSCode → "Reopen in Container"

# Solution 2: Install Emscripten SDK locally
mkdir -p tools
cd tools
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

# Solution 3: System-wide installation
brew install emscripten  # macOS
# or sudo apt-get install emscripten  # Ubuntu
```

##### Version Compatibility Issues

```bash
❌ emcc: error: unsupported option: --bind

# Solution: Update to compatible Emscripten version
# If using local installation:
cd tools/emsdk  # or ~/tools/emsdk
./emsdk install 3.1.45  # Known compatible version
./emsdk activate 3.1.45
source ./emsdk_env.sh

# If using system installation:
brew upgrade emscripten  # macOS
# or sudo apt-get update && sudo apt-get upgrade emscripten  # Ubuntu

# Verify version
emcc --version  # Should show 3.1.45 or newer
```

##### Python Dependencies

```bash
❌ python: command not found (required for Emscripten)

# Solution: Install Python (Emscripten requires Python 3.6+)
# macOS
brew install python

# Ubuntu/Debian
sudo apt-get install python3 python3-pip

# Verify
python3 --version
```

#### 2. WebAssembly File Not Found

```bash
❌ WebAssembly file not found

# Solution  
make node  # Build Node.js version
# or
make all   # Build browser version
```

#### 3. TypeScript Compilation Error

```bash
# Build with skipLibCheck
npx tsc --skipLibCheck

# or compile individual files
npx tsc --target es2020 --module commonjs --outDir dist/cli src/cli/main.ts
```

#### 4. Japanese Station Name Issues

```bash
❌ Station not found: 'お茶の水' or '茅ヶ崎'

# Solution: Use correct database conventions
✅ 正解: node dist/cli/cli/main.js -5 "東京" "中央線" "御茶ノ水"
❌ 間違い: node dist/cli/cli/main.js -5 "東京" "中央線" "お茶の水"

✅ 正解: node dist/cli/cli/main.js -5 "藤沢" "東海道線" "茅ケ崎"
❌ 間違い: node dist/cli/cli/main.js -5 "藤沢" "東海道線" "茅ヶ崎"

# Key Rules:
# - 御茶ノ水 (not お茶の水)
# - 茅ケ崎 (not 茅ヶ崎)
# - 櫛ケ浜 (not 櫛ヶ浜)
# Reference: https://farert.blogspot.com/p/detail.html
```

### Debug Mode

```bash
# Show detailed logs
export CLI_DEBUG=1
npm run cli:exec

# Show WebAssembly memory statistics (choose one method)
export CLI_DEBUG=1
node dist/cli/cli/main.js -5 "東京" "山手線" "新宿"              # Direct (recommended)
npm run cli -- -5 "東京" "山手線" "新宿"                       # Via npm (with warnings)
```

## 📚 Detailed Documentation

### Project Documentation

- **[CLAUDE.md](./CLAUDE.md)**: Complete project guidelines and API specifications
- **[README_CLI.md](./README_CLI.md)**: 詳細な日本語CLI使用マニュアル
- **[.claude/specs/](./claude/specs/)**: Technical specifications and design documents

### API Documentation

- **[docs/api-reference.md](./docs/api-reference.md)**: Complete API reference with framework examples
- **[examples/svelte-components/](./examples/svelte-components/)**: Interactive Svelte component showcase

### Build System

- **[build/sdk-build.js](./build/sdk-build.js)**: Production build configuration
- **[Makefile](./Makefile)**: WebAssembly build system details

## 🤝 Development Guidelines

### Commit Conventions

```bash
feat: add new feature
fix: bug fix  
docs: documentation update
refactor: code refactoring
```

### Code Quality

- **TypeScript Strict Mode**: Required
- **C++17 Standard**: `-O3` optimization
- **Error Handling**: Preserve original C++ error codes
- **Memory Management**: WebAssembly automatic cleanup

## 📄 License

GPL-3.0 - See [LICENSE](./LICENSE) for details

---

**Success Metric**: 100% compatibility with C++ implementation - All implementations must accurately reproduce the behavior of the original C++ code.
