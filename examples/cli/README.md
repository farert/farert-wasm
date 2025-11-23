# WASM Object Classes Usage Examples

This directory contains comprehensive examples demonstrating the usage of all 6 WASM Object Classes for Japanese railway fare calculation.

## 🎯 Overview

The examples cover the complete object class hierarchy and real-world usage patterns:

```
cCalcRoute < cRoute < cRouteList
```

- **cRouteList**: Base route container with array operations
- **cRoute**: Route construction and manipulation (extends cRouteList)
- **cCalcRoute**: Fare calculation with special rules (extends cRoute)
- **cRouteItem**: Individual route segment data
- **cRouteFlag**: Route flags and special conditions
- **FareInfo**: Comprehensive fare results and discounts

## 📚 Example Categories

### 1. Basic Object Classes (`basic-object-classes.ts`)
Fundamental usage patterns for the core object classes.

**Topics Covered:**
- Object creation and initialization
- Inheritance hierarchy demonstration
- Basic route construction
- Simple fare calculations
- Object lifecycle management

**Run:** `node examples/basic-object-classes.js`

### 2. RouteItem & FareInfo (`route-item-fareinfo-examples.ts`)
Detailed analysis of route segments and fare information.

**Topics Covered:**
- Individual route segment analysis
- Fare breakdown and discount information
- Stock discount methods
- Special rule application (Rule 114)
- JSON serialization of fare data

**Run:** `node examples/route-item-fareinfo-examples.js`

### 3. RouteFlag Examples (`route-flag-examples.ts`)
Advanced routing flags and special calculation rules.

**Topics Covered:**
- Boolean flag properties and meanings
- Special fare rules (Rule 69, 70, 88, 16-5)
- JR company-specific discounts
- Flag configuration scenarios
- Impact analysis of different flag combinations

**Run:** `node examples/route-flag-examples.js`

### 4. Realistic Scenarios (`realistic-scenarios.ts`)
Real-world Japanese railway usage patterns.

**Topics Covered:**
- Daily commuting routes (Tokyo, Kansai areas)
- Long-distance travel (Shinkansen, regular lines)
- Complex multi-transfer journeys
- Business travel optimization
- Tourism route planning
- Cost comparison and analysis

**Run:** `node examples/realistic-scenarios.js`

### 5. Troubleshooting (`troubleshooting-examples.ts`)
Error handling and performance optimization.

**Topics Covered:**
- Input validation and sanitization
- Route construction error handling
- WebAssembly memory management
- Performance monitoring and optimization
- Common error scenarios and solutions
- Debug techniques and diagnostics

**Run:** `node examples/troubleshooting-examples.js`

### 6. Framework Integration (`framework-integration.ts`)
Modern web framework integration patterns.

**Topics Covered:**
- React integration (hooks, components, context)
- Vue 3 integration (Composition API, stores)
- Svelte integration (stores, reactive statements)
- TypeScript service patterns
- State management strategies
- Error boundaries and loading states

**Run:** `node examples/framework-integration.js` (shows code examples)

## 🚀 Quick Start

### Run All Examples
```bash
node examples/index.js
```

### Run Specific Category
```bash
node examples/index.js basic              # Basic object class usage
node examples/index.js realistic          # Real-world scenarios
node examples/index.js troubleshooting    # Error handling patterns
```

### Get Help
```bash
node examples/index.js --help
```

### Quick Start Guide
```bash
node examples/index.js --quick-start
```

## 🏗️ Basic Usage Pattern

```typescript
import { wasmLoader } from '../wasm_loader';
import { FarertModule, CalcRouteWrapper } from '../types';

async function basicExample() {
  // 1. Initialize WebAssembly module
  const module = await wasmLoader.loadModule();
  await wasmLoader.initializeDatabase();
  
  // 2. Create calculation route
  const calcRoute = new module.cCalcRoute();
  
  // 3. Setup route (string method)
  calcRoute.setupRoute('東京 東海道線 品川');
  
  // 4. Calculate fare
  const fareInfo = calcRoute.calcFare();
  console.log(`Fare: ¥${fareInfo.fare}`);
  
  // 5. Cleanup
  module.closeDatabase();
}
```

## 📋 Prerequisites

### Required Files
- WebAssembly module: `dist/farert.js` and `dist/farert.wasm`
- Database: `data/jrdbnewest.db`
- TypeScript compilation: `npm run build`

### Build Commands
```bash
# Build WebAssembly module
npm run build

# Build TypeScript CLI
npm run cli:build

# Complete build
npm run build && npm run cli:build
```

### Environment Requirements
- Node.js 14.0.0 or higher
- TypeScript for development
- UTF-8 support for Japanese text

## 🎯 Example Structure

Each example file follows this pattern:

```typescript
// 1. Import dependencies
import { wasmLoader } from '../wasm_loader';
import { FarertModule, /* specific types */ } from '../types';

// 2. Demonstration functions
async function demonstrateFeature(module: FarertModule): Promise<void> {
  // Example implementation
}

// 3. Main runner function
async function runExamples(): Promise<void> {
  // Initialize module
  // Run demonstrations
  // Cleanup resources
}

// 4. Direct execution support
if (require.main === module) {
  runExamples();
}

// 5. Export for composition
export { demonstrateFeature, runExamples };
```

## 🌐 Framework Integration

### React Hook Example
```typescript
import { useState, useEffect } from 'react';
import { wasmLoader } from '../wasm_loader';

export const useFarertCalculator = () => {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    wasmLoader.loadModule().then(setModule);
  }, []);
  
  const calculateFare = async (route: string) => {
    const calcRoute = new module.cCalcRoute();
    calcRoute.setupRoute(route);
    return calcRoute.calcFare();
  };
  
  return { module, loading, calculateFare };
};
```

### Vue 3 Composable Example
```typescript
import { ref, onMounted } from 'vue';
import { wasmLoader } from '../wasm_loader';

export const useFarert = () => {
  const module = ref(null);
  const loading = ref(true);
  
  onMounted(async () => {
    module.value = await wasmLoader.loadModule();
    loading.value = false;
  });
  
  return { module, loading };
};
```

## 🔧 Common Issues

### WebAssembly Module Not Found
```bash
# Build the module first
npm run build
```

### Database Connection Failed
```bash
# Check database file exists
ls -la data/jrdbnewest.db

# Verify file permissions
chmod 644 data/jrdbnewest.db
```

### Japanese Text Issues
```bash
# Ensure UTF-8 encoding in terminal
export LC_ALL=en_US.UTF-8

# On Windows, set code page
chcp 65001
```

### Station Name Conventions
- Use exact database conventions: 御茶ノ水 (not お茶の水)
- Must input ケ not ヶ: 茅ケ崎 (not 茅ヶ崎), 櫛ケ浜 (not 櫛ヶ浜)
- **Reference**: [Farert詳細仕様](https://farert.blogspot.com/p/detail.html)

### Memory Issues
```bash
# Run with increased memory limit
node --max-old-space-size=4096 examples/index.js

# Enable garbage collection for testing
node --expose-gc examples/index.js troubleshooting
```

## 📊 Performance Guidelines

### Optimization Tips
- Cache frequently calculated routes
- Reuse CalcRoute objects when possible
- Monitor memory usage in long-running apps
- Use string-based route setup for simple routes
- Implement manual construction for complex routes

### Memory Management
- Always call `module.closeDatabase()` when done
- Clear route objects with `removeAll()` before reuse
- Monitor heap usage with `process.memoryUsage()`
- Use `global.gc()` for testing (with `--expose-gc`)

## 🎯 Real-World Applications

### Commuter Route Calculator
Perfect for daily commute cost analysis and optimization.

### Business Travel Planner  
Optimize routes for cost vs. time efficiency in business scenarios.

### Tourist Route Assistant
Help tourists plan cost-effective sightseeing routes with JR Pass analysis.

### Transportation API Service
Build backend services for mobile apps and web applications.

## 📚 Further Reading

- **Project Overview**: `CLAUDE.md` - Complete project documentation
- **CLI Usage**: `README_CLI.md` - Command-line interface guide
- **Technical Architecture**: `.claude/steering/` - Development guidelines
- **API Documentation**: `src/cli/types.ts` - Complete type definitions
- **Build System**: `Makefile` and `package.json` - Build configuration

## 💡 Contributing

When adding new examples:

1. Follow the established file naming pattern
2. Include comprehensive TypeScript types
3. Provide both simple and advanced usage patterns
4. Add proper error handling examples
5. Include performance considerations
6. Update this README with new example descriptions
7. Test examples with real Japanese station/line names (follow database conventions: 御茶ノ水, 茅ケ崎)

## 🎉 Success Stories

These examples demonstrate:

- ✅ **100% C++ Compatibility** - All examples produce identical results to the original C++ implementation
- ✅ **Type Safety** - Complete TypeScript coverage with strict mode
- ✅ **Performance** - Route calculations complete within required timeframes
- ✅ **Memory Safety** - No WebAssembly memory leaks in long-running applications
- ✅ **Real-World Usage** - Practical examples covering actual Japanese railway scenarios

Start with `basic-object-classes.ts` for fundamental concepts, then explore specific areas based on your use case!