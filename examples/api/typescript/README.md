# TypeScript Integration Examples

Complete TypeScript integration examples for the Farert WebAssembly Module - Japanese Railway Fare Calculation system. This directory demonstrates how to build robust, type-safe applications using the Farert WebAssembly APIs with full compile-time type checking and runtime validation.

## 🎯 Overview

The Farert TypeScript integration provides:

- **Complete Type Definitions**: Comprehensive typing for all 39+ WebAssembly APIs and 6-class inheritance system
- **Type Safety**: Compile-time error prevention with strict TypeScript configuration
- **Modern Patterns**: Async/await, Promise handling, generic programming, and advanced TypeScript features
- **Performance Optimization**: Memory management, caching, and performance monitoring
- **Error Handling**: Robust error handling with typed exceptions and recovery patterns
- **Production Ready**: Enterprise-grade patterns suitable for production applications

## 📁 Directory Structure

```
typescript/
├── types/                      # Type definitions
│   ├── farert.d.ts            # Complete WebAssembly module types
│   ├── station-types.ts       # Station-specific interfaces
│   ├── line-types.ts          # Line-specific interfaces
│   ├── route-types.ts         # Route-building interfaces
│   └── fare-types.ts          # Fare calculation interfaces
├── examples/                   # TypeScript examples
│   ├── basic-usage.ts         # Basic TypeScript integration
│   ├── type-safety-demo.ts    # Type safety demonstrations
│   └── async-patterns.ts      # Async/await patterns
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ with npm/yarn
- TypeScript 5.0+
- Farert WebAssembly module compiled and available

### Installation

1. **Navigate to the TypeScript examples directory:**
   ```bash
   cd examples/api/typescript
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Compile TypeScript examples:**
   ```bash
   npm run build
   ```

4. **Run examples:**
   ```bash
   # Run all examples
   npm run example:all

   # Or run individual examples
   npm run example:basic
   npm run example:type-safety
   npm run example:async
   ```

### Development Mode

For development with live compilation:

```bash
# Compile and watch for changes
npm run build:watch

# Or run directly with ts-node
npm run dev:basic
npm run dev:type-safety
npm run dev:async
```

## 📚 Examples Overview

### 1. Basic Usage (`examples/basic-usage.ts`)

**Purpose**: Fundamental TypeScript integration patterns with the Farert WebAssembly module.

**Key Features**:
- Type-safe WebAssembly module initialization
- Station and line operations with proper typing
- Route building with memory management
- Performance monitoring and debugging
- Error handling with specific error codes

**Example Usage**:
```typescript
import { initializeFarertModule, demonstrateStationOperations } from './basic-usage';

// Initialize module with type safety
const module = await initializeFarertModule();

// Type-safe station operations
await demonstrateStationOperations(module);
```

**Learning Points**:
- Module loading with timeout and validation
- Type guards and runtime type checking
- Memory cleanup and resource management
- Performance monitoring patterns

### 2. Type Safety Demo (`examples/type-safety-demo.ts`)

**Purpose**: Advanced TypeScript features for compile-time and runtime type safety.

**Key Features**:
- Compile-time type checking and error prevention
- Runtime type validation with comprehensive error reporting
- Generic programming patterns with type preservation
- Type-safe route builder with fluent interface
- Advanced error handling with typed exceptions

**Example Usage**:
```typescript
import { TypeSafeFarertWrapper, TypeSafeRouteBuilder } from './type-safety-demo';

const wrapper = new TypeSafeFarertWrapper(module);

// Generic station lookup with type preservation
const stationId: number = await wrapper.lookupStation('東京', false);
const stationInfo: Station | null = await wrapper.lookupStation('東京', true);

// Type-safe route building
const builder = wrapper.createRouteBuilder()
  .startFrom('東京')
  .via('東海道線', '横浜');

const fareInfo = await builder.calculateFare();
```

**Learning Points**:
- Generic functions with conditional return types
- Type guards and validation patterns
- Builder pattern with type state management
- Compile-time vs runtime type checking

### 3. Async Patterns (`examples/async-patterns.ts`)

**Purpose**: Advanced async/await patterns, Promise handling, and concurrent operations.

**Key Features**:
- Promise-based API wrappers for synchronous WebAssembly functions
- Concurrent operations with proper resource management
- Batch processing with configurable concurrency
- Async generators for streaming data
- Circuit breaker and retry patterns
- Real-time progress tracking

**Example Usage**:
```typescript
import { AsyncFarertWrapper } from './async-patterns';

const wrapper = new AsyncFarertWrapper(module);

// Async operations with timeout and retry
const stationId = await wrapper.getStationIdAsync('東京', {
  timeout: 5000,
  retryAttempts: 3
});

// Batch operations with progress tracking
const result = await wrapper.batchStationLookup(stationNames, {
  concurrency: 3,
  onProgress: (completed, total) => console.log(`${completed}/${total}`)
});

// Streaming search with async generators
for await (const searchResult of wrapper.searchStationsStream('東')) {
  console.log(`Found: ${searchResult.stations.length} stations`);
}
```

**Learning Points**:
- Converting synchronous APIs to async patterns
- Concurrency control and resource management
- Error handling in async contexts
- Performance monitoring and optimization

## 🔧 Type Definitions

### Core Module Types (`types/farert.d.ts`)

The main WebAssembly module interface with complete typing:

```typescript
interface FarertModule {
  // Database operations
  openDatabase(): boolean;
  closeDatabase(): void;

  // Station operations
  getStationId(name: string): number;
  getStationName(id: number): string;
  getStationKana(id: number): string;

  // Route operations
  calculateFare(): number;
  getFareString(): string;

  // Object class constructors
  cRoute: new() => RouteWrapper;
  cCalcRoute: new(route: RouteWrapper) => CalcRouteWrapper;

  // 35+ additional APIs...
}
```

### Station Types (`types/station-types.ts`)

Comprehensive station-related interfaces:

```typescript
interface Station {
  id: number;
  name: string;
  nameExtended: string;
  kana: string;
  prefecture: string;
  prefectureId: number;
  isJunction: boolean;
  lines: number[];
  coordinates?: StationCoordinates;
  metadata?: StationMetadata;
}
```

### Route Building Types (`types/route-types.ts`)

Type-safe route construction and validation:

```typescript
interface RouteSegment {
  stationId: number;
  stationName: string;
  lineId?: number;
  lineName?: string;
  isTransfer: boolean;
  flags?: RouteSegmentFlags;
}

interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}
```

### Fare Calculation Types (`types/fare-types.ts`)

Complete fare calculation interfaces matching C++ implementation:

```typescript
interface FareInfo {
  fare: number;
  fareInfoValid: boolean;
  isRule114Applied: boolean;
  basicFare: number;
  expressFare: number;
  totalDistance: number;
  transferCount: number;
  // 20+ additional properties...
}
```

## ⚙️ TypeScript Configuration

### Strict Mode Configuration

Our `tsconfig.json` enforces strict type checking:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Path Mapping

Convenient imports with path mapping:

```json
{
  "paths": {
    "@types/*": ["./types/*"],
    "@examples/*": ["./examples/*"],
    "@farert/*": ["../../../src/*"]
  }
}
```

### Modern JavaScript Target

Targeting ES2020 for Node.js 14+ compatibility:

```json
{
  "target": "ES2020",
  "module": "CommonJS",
  "lib": ["ES2020", "DOM"]
}
```

## 🛠️ Development Workflow

### Available Scripts

```bash
# Compilation
npm run build              # Compile TypeScript
npm run build:watch        # Watch and compile
npm run clean              # Clean dist directory

# Type Checking
npm run compile            # Type check without emit
npm run type-check         # Pretty type checking
npm run compile:watch      # Watch type checking

# Examples
npm run example:basic      # Run basic usage example
npm run example:type-safety # Run type safety demo
npm run example:async      # Run async patterns demo
npm run example:all        # Run all examples

# Development
npm run dev                # Run with ts-node
npm run dev:basic          # Dev mode basic example
npm run dev:type-safety    # Dev mode type safety
npm run dev:async          # Dev mode async patterns

# Code Quality
npm run lint               # ESLint checking
npm run lint:fix           # Fix linting issues
npm run format             # Format with Prettier
npm run validate           # Full validation

# Testing
npm run test               # Run Jest tests
npm run test:watch         # Watch mode testing
npm run test:coverage      # Coverage report
npm run test:types         # Type checking tests

# Documentation
npm run docs               # Generate TypeDoc
npm run docs:serve         # Watch and serve docs
```

### Development Tips

1. **Use TypeScript Strict Mode**: Enables maximum type safety
2. **Leverage Type Guards**: Validate data at runtime
3. **Implement Proper Error Handling**: Use typed exceptions
4. **Monitor Performance**: Use built-in performance monitoring
5. **Clean Up Resources**: Always dispose WebAssembly objects

## 🔍 Type Safety Best Practices

### 1. Compile-time Type Checking

```typescript
// ✅ Good: Type-safe function calls
const stationId: number = module.getStationId('東京');
const fareAmount: number = calcRoute.calculateFare();

// ❌ Bad: Would be caught at compile time
// const wrongType: string = module.calculateFare(); // Type error!
```

### 2. Runtime Type Validation

```typescript
// ✅ Good: Validate data at runtime
function processStation(data: unknown): Station | null {
  if (!isStation(data)) {
    return null;
  }
  return data; // TypeScript knows this is Station
}
```

### 3. Generic Type Preservation

```typescript
// ✅ Good: Generic functions with type preservation
async function safeLookup<T extends boolean>(
  name: string,
  extended: T
): Promise<T extends true ? Station | null : number> {
  // Implementation preserves type based on parameter
}
```

### 4. Error Handling with Types

```typescript
// ✅ Good: Typed error handling
try {
  const result = await operation();
} catch (error) {
  if (error instanceof AsyncValidationError) {
    console.log(`Validation failed: ${error.code}`);
  } else if (error instanceof AsyncTimeoutError) {
    console.log('Operation timed out');
  }
}
```

## 🎯 Integration Patterns

### Module Initialization Pattern

```typescript
async function initializeTypedModule(): Promise<FarertModule> {
  const module = await loadWebAssemblyModule();

  // Type safety check
  if (!isFarertModule(module)) {
    throw new TypeError('Invalid Farert module');
  }

  // Database initialization
  if (!module.openDatabase()) {
    throw new Error('Failed to initialize database');
  }

  return module;
}
```

### Resource Management Pattern

```typescript
class TypedRouteCalculator {
  private calcRoute: CalcRouteWrapper | null = null;

  constructor(private module: FarertModule) {}

  async calculate(): Promise<FareInfo> {
    const route = new this.module.cRoute();
    this.calcRoute = new this.module.cCalcRoute(route);

    try {
      // Perform calculations
      return await this.performCalculation();
    } finally {
      // Always clean up
      this.dispose();
    }
  }

  dispose(): void {
    if (this.calcRoute) {
      this.calcRoute.delete();
      this.calcRoute = null;
    }
  }
}
```

### Async Wrapper Pattern

```typescript
class AsyncAPIWrapper {
  constructor(private module: FarertModule) {}

  async getStationAsync(name: string): Promise<Station | null> {
    return new Promise((resolve, reject) => {
      try {
        const id = this.module.getStationId(name);
        if (!isValidStationId(id)) {
          resolve(null);
          return;
        }

        const station = this.buildStation(id);
        resolve(station);
      } catch (error) {
        reject(error);
      }
    });
  }
}
```

## 📈 Performance Considerations

### Memory Management

- Always call `delete()` on WebAssembly objects
- Use try/finally blocks to ensure cleanup
- Monitor memory usage with performance APIs
- Implement object pooling for frequently created objects

### Async Operations

- Use appropriate concurrency limits for batch operations
- Implement timeout and retry patterns
- Monitor operation performance with built-in metrics
- Use circuit breakers for fault tolerance

### Type Checking

- Prefer compile-time type checking over runtime validation
- Use type guards efficiently to avoid repeated validation
- Cache validation results when appropriate
- Balance type safety with performance requirements

## 🔧 Troubleshooting

### Common Issues

1. **Module Loading Failures**
   ```typescript
   // Check module validity
   if (!isFarertModule(module)) {
     throw new Error('Invalid module - check WebAssembly compilation');
   }
   ```

2. **Type Errors**
   ```bash
   # Run type checking
   npm run type-check

   # Check specific file
   npx tsc --noEmit examples/basic-usage.ts
   ```

3. **Runtime Validation Failures**
   ```typescript
   // Add detailed logging
   if (!isStation(data)) {
     console.error('Station validation failed:', data);
     return null;
   }
   ```

4. **Memory Leaks**
   ```typescript
   // Always dispose objects
   try {
     const result = calcRoute.calculateFare();
     return result;
   } finally {
     calcRoute.delete(); // Cleanup WebAssembly memory
   }
   ```

### Debugging Tips

- Enable source maps for better debugging experience
- Use TypeScript's `--noEmitOnError` to prevent running invalid code
- Leverage IDE TypeScript integration for real-time error checking
- Use `console.trace()` to track object creation and disposal

## 📖 Additional Resources

### TypeScript Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Advanced Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)

### WebAssembly Integration
- [WebAssembly JavaScript API](https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface)
- [Emscripten Documentation](https://emscripten.org/docs/)

### Farert Project
- [Main Documentation](../../../README.md)
- [CLI Examples](../../cli/README.md)
- [API Reference](../../../docs/api-reference.md)

## 🤝 Contributing

When contributing to the TypeScript examples:

1. **Follow TypeScript strict mode**: All code must compile with strict type checking
2. **Add comprehensive type annotations**: Document return types and parameter types
3. **Include proper error handling**: Use typed exceptions and validation
4. **Write meaningful examples**: Focus on practical, real-world usage patterns
5. **Update documentation**: Keep README and inline documentation current

### Code Style

- Use Prettier for consistent formatting
- Follow ESLint rules for code quality
- Write JSDoc comments for public APIs
- Use descriptive variable and function names

## 📄 License

This project is licensed under GPL-3.0. See the [LICENSE](../../../LICENSE) file for details.

## 🆘 Support

For support and questions:

1. Check the [troubleshooting section](#-troubleshooting) above
2. Review the [main project documentation](../../../README.md)
3. Open an issue on [GitHub](https://github.com/farert/farert-wasm/issues)
4. Join our community discussions

---

**Happy coding with TypeScript and Farert! 🚀**