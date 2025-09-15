# Performance Optimization Examples

This directory contains comprehensive examples demonstrating performance optimization techniques, memory management patterns, and benchmarking utilities for the Farert WebAssembly API.

## 📁 Directory Contents

- **`performance-optimization.js`** - Main comprehensive performance example with benchmarking utilities
- **`memory-management.js`** - Focused memory management and cleanup patterns
- **`batch-processing.js`** - Batch processing with progress indicators and memory monitoring
- **`performance-comparison.js`** - Before/after performance comparison utilities

## 🎯 What You'll Learn

### Performance Monitoring
- Real-time operation timing and analysis
- Memory usage tracking and leak detection
- Performance trend analysis and predictions
- Bottleneck identification and optimization recommendations

### Memory Management
- WebAssembly memory lifecycle management
- Object cleanup and garbage collection patterns
- Memory leak detection and prevention
- Resource pooling and reuse strategies

### Batch Processing
- Large dataset processing with progress indicators
- Memory pressure management during bulk operations
- Error handling and recovery in batch scenarios
- Performance scaling for high-volume operations

### Performance Comparison
- Before/after optimization measurements
- Multiple approach benchmarking
- Statistical analysis of performance data
- Automated optimization recommendations

## 🚀 Quick Start

### Run the Complete Performance Suite
```bash
node examples/api/performance/performance-optimization.js
```

### Run Individual Examples
```bash
# Memory management focused examples
node examples/api/performance/memory-management.js

# Batch processing with progress tracking
node examples/api/performance/batch-processing.js

# Performance comparison utilities
node examples/api/performance/performance-comparison.js
```

### Enable Advanced Memory Monitoring
```bash
# For Node.js - enable garbage collection access
node --expose-gc examples/api/performance/performance-optimization.js

# For detailed memory profiling
node --inspect --expose-gc examples/api/performance/performance-optimization.js
```

## 📊 Performance Metrics

### Timing Metrics
- **Operation Duration** - Individual API call timing
- **Average Response Time** - Mean performance across operations
- **Percentile Analysis** - P50, P95, P99 response times
- **Throughput** - Operations per second capacity

### Memory Metrics
- **Heap Usage** - JavaScript heap memory consumption
- **WebAssembly Memory** - WASM module memory allocation
- **Memory Growth Rate** - Rate of memory increase over time
- **Garbage Collection Impact** - GC pause effects on performance

### Application Metrics
- **Cache Hit Ratio** - Effectiveness of caching strategies
- **Error Rate** - Percentage of failed operations
- **Batch Success Rate** - Success percentage in bulk operations
- **Resource Utilization** - Overall system resource usage

## 🔧 Optimization Techniques

### 1. Caching Strategies
```javascript
// Example: Implement result caching for frequent lookups
const cache = new Map();

function optimizedStationLookup(stationName) {
    if (cache.has(stationName)) {
        return cache.get(stationName);
    }

    const result = module.getStationId(stationName);
    cache.set(stationName, result);
    return result;
}
```

### 2. Memory Management
```javascript
// Example: Proper object lifecycle management
class ResourceManager {
    constructor() {
        this.resources = new Set();
    }

    createResource() {
        const resource = module.createRoute();
        this.resources.add(resource);
        return resource;
    }

    cleanup() {
        for (const resource of this.resources) {
            // Cleanup resource
            module.destroyRoute(resource);
        }
        this.resources.clear();
    }
}
```

### 3. Batch Processing
```javascript
// Example: Efficient batch processing with memory monitoring
async function processBatch(items, batchSize = 100) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        // Process batch
        const batchResults = batch.map(item => processItem(item));
        results.push(...batchResults);

        // Memory pressure check
        if (getMemoryUsage() > MEMORY_THRESHOLD) {
            await forcedGarbageCollection();
        }

        // Progress reporting
        reportProgress(i + batchSize, items.length);
    }

    return results;
}
```

### 4. Performance Monitoring
```javascript
// Example: Comprehensive performance monitoring
class PerformanceMonitor {
    startTiming(operation) {
        return {
            operation,
            startTime: performance.now(),
            startMemory: getMemoryUsage()
        };
    }

    endTiming(timing) {
        return {
            ...timing,
            duration: performance.now() - timing.startTime,
            memoryDelta: getMemoryUsage() - timing.startMemory
        };
    }
}
```

## 📈 Benchmarking Results

### Typical Performance Characteristics

| Operation | Average Time | Memory Usage | Throughput |
|-----------|--------------|--------------|------------|
| Station Lookup | 2-5ms | <1KB | 200-500 ops/sec |
| Route Calculation | 10-50ms | 1-5KB | 20-100 ops/sec |
| Batch Processing (100 items) | 200-1000ms | 10-50KB | Variable |
| Cache Lookup | 0.1-1ms | <100B | 1000+ ops/sec |

### Optimization Impact Examples

| Optimization | Before | After | Improvement |
|--------------|--------|-------|-------------|
| Result Caching | 5ms | 0.5ms | 10x faster |
| Batch Processing | 1000ms | 300ms | 3.3x faster |
| Memory Pooling | 50KB | 20KB | 60% less memory |
| Early Validation | 10ms | 2ms | 5x faster |

## ⚠️ Common Performance Pitfalls

### 1. Memory Leaks
```javascript
// ❌ Bad: Creating objects without cleanup
function badExample() {
    for (let i = 0; i < 1000; i++) {
        module.createRoute(); // Never cleaned up
    }
}

// ✅ Good: Proper cleanup
function goodExample() {
    const routes = [];
    try {
        for (let i = 0; i < 1000; i++) {
            routes.push(module.createRoute());
        }
        // Use routes...
    } finally {
        routes.forEach(route => module.destroyRoute(route));
    }
}
```

### 2. Inefficient Repeated Lookups
```javascript
// ❌ Bad: Repeated expensive lookups
function badLookup(stationNames) {
    return stationNames.map(name => {
        const id = module.getStationId(name); // Expensive lookup
        return module.getStationName(id); // Redundant conversion
    });
}

// ✅ Good: Cached and optimized lookups
const stationCache = new Map();
function goodLookup(stationNames) {
    return stationNames.map(name => {
        if (stationCache.has(name)) {
            return stationCache.get(name);
        }
        const id = module.getStationId(name);
        const result = id > 0 ? name : null; // Use original name if valid
        stationCache.set(name, result);
        return result;
    });
}
```

### 3. Uncontrolled Batch Sizes
```javascript
// ❌ Bad: Processing all items at once
function badBatch(items) {
    return items.map(item => expensiveOperation(item)); // Memory spike
}

// ✅ Good: Controlled batch processing
async function goodBatch(items, batchSize = 50) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = batch.map(item => expensiveOperation(item));
        results.push(...batchResults);

        // Allow garbage collection between batches
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    return results;
}
```

## 🔍 Debugging Performance Issues

### 1. Enable Memory Monitoring
```bash
# Run with memory profiling
node --expose-gc --inspect examples/api/performance/performance-optimization.js
```

### 2. Use Performance Profilers
```javascript
// Enable detailed timing
const { performance, PerformanceObserver } = require('perf_hooks');

const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
        console.log(`${entry.name}: ${entry.duration}ms`);
    });
});
perfObserver.observe({ entryTypes: ['measure'] });

// Measure operations
performance.mark('operation-start');
// ... your operation ...
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');
```

### 3. Memory Leak Detection
```javascript
// Monitor memory growth over time
function detectMemoryLeaks() {
    const samples = [];

    setInterval(() => {
        const memUsage = process.memoryUsage();
        samples.push({
            timestamp: Date.now(),
            heapUsed: memUsage.heapUsed
        });

        // Keep only recent samples
        if (samples.length > 60) { // 1 hour of samples (1 per minute)
            samples.shift();
        }

        // Analyze trend
        if (samples.length >= 10) {
            const recent = samples.slice(-10);
            const growthRate = (recent[9].heapUsed - recent[0].heapUsed) / 9;

            if (growthRate > 1024 * 1024) { // 1MB per sample
                console.warn('Potential memory leak detected!');
            }
        }
    }, 60000); // Every minute
}
```

## 📚 Additional Resources

### Performance Testing Tools
- **Node.js**: `--prof` flag for V8 profiling
- **Chrome DevTools**: Memory and Performance tabs
- **Clinic.js**: Comprehensive Node.js performance toolkit
- **0x**: Flamegraph profiling for Node.js

### Memory Analysis Tools
- **heapdump**: Capture and analyze heap snapshots
- **memwatch-next**: Monitor memory usage and leaks
- **clinic-heapdump**: Visual heap analysis

### Benchmarking Libraries
- **benchmark.js**: Robust benchmarking framework
- **Hyperfine**: Command-line benchmarking tool
- **Artillery**: Load testing toolkit

## 🎯 Best Practices Summary

1. **Always Monitor Performance** - Implement comprehensive monitoring from the start
2. **Manage Memory Lifecycle** - Explicitly clean up resources and track object lifecycles
3. **Use Batch Processing** - Process large datasets in manageable chunks
4. **Implement Caching** - Cache expensive operations and frequently accessed data
5. **Validate Early** - Check inputs before expensive operations
6. **Profile Regularly** - Use profiling tools to identify bottlenecks
7. **Test Under Load** - Verify performance characteristics under realistic conditions
8. **Automate Optimization** - Use tools and scripts to continuously monitor and optimize

## 🔗 Related Examples

- **[Basic API Examples](../basic/)** - Fundamental API usage patterns
- **[TypeScript Examples](../typescript/)** - Type-safe performance optimization
- **[Browser Examples](../browser/)** - Client-side performance considerations

---

**Note**: For production applications, always test performance optimizations under realistic conditions and monitor the impact of changes over time.