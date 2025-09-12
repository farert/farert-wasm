# Farert WebAssembly - Japanese Railway Fare Calculation System

Complete WebAssembly implementation of C++ railway fare calculation engine with modern TypeScript SDK. Provides CLI tools and frontend framework integrations for building Japanese railway applications.

## 🎯 Project Goals

Provides modern WebAssembly APIs and Frontend SDK while maintaining **100% compatibility** with the original C++ implementation:

- ✅ **Complete Migration**: `testmain.cpp` → TypeScript CLI with identical results
- ✅ **Frontend API Layer SDK**: Production-ready Svelte/React/Vue/vanilla JS integration  
- ✅ **Type Safety**: Full TypeScript support with strict mode
- ✅ **Cross-Platform**: Browser, Node.js, and SvelteKit SSR support
- ✅ **Performance**: <150KB bundle, <2s initialization, <500ms calculations

## ⚠️ Current Database Coverage

**Supported Railways** (229 lines in database):
- ✅ **JR Lines**: All JR companies (East, Central, West, Hokkaido, Shikoku, Kyushu)
- ✅ **Third Sector**: IGR Iwate Galaxy, IR Ishikawa, Ainokaze Toyama, Echigo Tokimeki Railway, etc.
- ❌ **Major Private Railways**: Currently not supported
  - Tsukuba Express (つくばエクスプレス)  
  - Odakyu Line (小田急線)
  - Tokyu Lines (東急線各線)
  - Keikyu Line (京急線)
  - Seibu Lines (西武線各線) 
  - Tobu Lines (東武線各線)
  - Most metropolitan private railways

**Database**: Based on `jrdbnewest.db` (last updated 2025-08-03, 660KB)

## 🚀 Quick Start

### Prerequisites

```bash
# Emscripten SDK (required)
~/priv/farert.repos/emsdk/

# Node.js 14.0.0+
node --version

# Recommended: TypeScript
npm install -g typescript
```

### Build and Run CLI

```bash
# 1. Environment setup + WebAssembly build
source setup_env.sh && make node

# 2. TypeScript CLI compilation
npm run cli:build

# 3. Fare calculation test (choose one method)  
node dist/cli/cli/main.js -5 "東京" "東海道線" "品川" "山手線" "新宿"    # Direct (recommended)
npm run cli -- -5 "東京" "東海道線" "品川" "山手線" "新宿"             # Via npm (may show warnings)

# 4. Full test suite execution
npm run cli:exec
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
│   └── svelte-components/    # Svelte component showcase
├── tests/integration/ # Full-stack integration tests
├── build/             # Build configuration
├── data/              # SQLite database
├── .claude/           # Claude Code specifications
└── third_party/       # SQLite3 source
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Emscripten Environment Error

```bash
❌ em++ command not found

# Solution
source setup_env.sh && make
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
