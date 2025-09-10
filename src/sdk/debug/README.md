# Debug Tools for Farert SDK

Comprehensive debugging utilities for troubleshooting SDK issues, performance optimization, and understanding internal behavior during development and production troubleshooting.

## Features

- **Cache Inspection**: Real-time cache performance monitoring with detailed statistics
- **Performance Monitoring**: Operation timing, bottleneck identification, and trend analysis
- **WebAssembly Memory Tracking**: Memory usage analysis with leak detection
- **Error Analysis**: Pattern detection and recovery recommendations
- **SDK State Inspection**: Complete state validation and consistency checking
- **Diagnostic Reports**: Comprehensive troubleshooting reports with recommendations
- **Real-time Dashboard**: Live monitoring for development environments

## Quick Start

### Development Environment

```typescript
import { createDevelopmentDebugTools } from '@farert/sdk/debug';

// Create debug tools with full features enabled
const debugTools = createDevelopmentDebugTools({
  level: DebugLevel.DEVELOPMENT,
  enableRealtimeDashboard: true
});

// Attach to SDK components
debugTools.attachToSDK(cacheManager, errorManager, wasmModule);

// Inspect cache performance
const cacheAnalysis = debugTools.inspectCache();
console.log('Cache hit ratio:', cacheAnalysis?.performance.cacheEfficiency);

// Monitor performance
debugTools.recordPerformance('station_search', 45.2);
const performanceData = debugTools.getPerformanceData();

// Generate diagnostic report
const report = debugTools.generateDiagnosticReport();
console.log('System health score:', report.healthScore);
```

### Production Environment

```typescript
import { createProductionDebugTools } from '@farert/sdk/debug';

// Create minimal debug tools for production
const debugTools = createProductionDebugTools({
  level: DebugLevel.BASIC,
  enableErrorTracking: true
});

// Record errors for analysis
debugTools.recordError({
  code: 'WASM_001',
  title: 'WebAssembly initialization failed',
  severity: ErrorSeverity.CRITICAL,
  category: ErrorCategory.WEBASSEMBLY
});

// Export diagnostic data for support
const diagnostics = debugTools.exportDiagnostics('json');
```

## Debug Levels

### DebugLevel.NONE (Production)
- No debug output or performance overhead
- Minimal resource usage

### DebugLevel.BASIC (Production Monitoring)
- Error tracking and critical warnings
- Basic diagnostic capabilities

### DebugLevel.PERFORMANCE (Performance Analysis)
- Operation timing and bottleneck detection
- Cache performance monitoring
- Memory usage tracking

### DebugLevel.VERBOSE (Development)
- Detailed debug logging
- Complete state inspection
- Performance profiling

### DebugLevel.DEVELOPMENT (Full Debug)
- All debugging features enabled
- Real-time monitoring dashboard
- Comprehensive diagnostic reports

## Cache Inspection

```typescript
// Monitor cache operations in real-time
const unsubscribe = debugTools.monitorCacheOperations((event) => {
  if (event.type === 'memory_critical') {
    console.warn('Cache memory usage critical:', event.context);
  }
});

// Get cache analysis
const analysis = debugTools.inspectCache();
if (analysis) {
  console.log('Cache Statistics:');
  console.log('- Total memory usage:', analysis.memoryAnalysis.totalMemoryUsage, 'bytes');
  console.log('- Hit ratio:', analysis.performance.cacheEfficiency, '%');
  console.log('- Recommendations:', analysis.recommendations.length);
  
  // Handle recommendations
  for (const rec of analysis.recommendations) {
    if (rec.severity === 'high') {
      console.warn(`Cache Issue: ${rec.message}`);
      console.log(`Action: ${rec.action}`);
    }
  }
}
```

## Performance Monitoring

```typescript
// Record operation performance
debugTools.recordPerformance('fare_calculation', 125.5, {
  route: 'Tokyo to Osaka',
  cacheHit: false
});

// Start profiling session
const profilingResults = await debugTools.startPerformanceProfiling(30000); // 30 seconds

// Analyze bottlenecks
const performanceData = debugTools.getPerformanceData();
for (const bottleneck of performanceData.bottlenecks) {
  if (bottleneck.impact === 'high') {
    console.warn(`Performance Bottleneck: ${bottleneck.operation}`);
    console.log(`Average time: ${bottleneck.averageTime}ms`);
    console.log('Suggestions:', bottleneck.suggestions);
  }
}
```

## WebAssembly Memory Tracking

```typescript
// Get memory analysis
const memoryAnalysis = debugTools.getWebAssemblyMemoryUsage();
if (memoryAnalysis) {
  console.log('WebAssembly Memory:');
  console.log('- Heap size:', memoryAnalysis.current.heapSize, 'bytes');
  console.log('- Used heap:', memoryAnalysis.current.usedHeapSize, 'bytes');
  console.log('- Utilization:', memoryAnalysis.current.utilizationPercent.toFixed(1), '%');
  
  // Check for memory leaks
  if (memoryAnalysis.leakDetection.possibleLeaks) {
    console.warn('Possible memory leaks detected!');
    console.log('Growth rate:', memoryAnalysis.leakDetection.growthRate, 'bytes/sec');
    console.log('Recommendations:', memoryAnalysis.leakDetection.recommendations);
  }
}
```

## Real-time Monitoring

```typescript
// Subscribe to real-time updates
const unsubscribe = debugTools.subscribeToRealtimeUpdates((data) => {
  switch (data.type) {
    case 'performance':
      if (data.data.duration > 100) {
        console.warn(`Slow operation: ${data.data.operation} (${data.data.duration}ms)`);
      }
      break;
      
    case 'memory':
      const usagePercent = (data.data.usedHeapSize / data.data.heapSize) * 100;
      if (usagePercent > 80) {
        console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
      }
      break;
      
    case 'error':
      if (data.data.error.severity === 'critical') {
        console.error('Critical error:', data.data.error);
      }
      break;
  }
});

// Clean up subscription
window.addEventListener('beforeunload', unsubscribe);
```

## SDK State Validation

```typescript
// Create state snapshot
const snapshot = debugTools.createStateSnapshot();
console.log('SDK State Snapshot:');
console.log('- Cache entries:', snapshot.cacheState.totalEntries);
console.log('- Error count:', snapshot.errorState.totalErrors);
console.log('- Operations/sec:', snapshot.performanceState.operationsPerSecond);

// Validate SDK state consistency
const validation = debugTools.validateSDKState();
if (!validation.isValid) {
  console.error('SDK state validation failed:');
  validation.errors.forEach(error => console.error('- Error:', error));
  validation.warnings.forEach(warning => console.warn('- Warning:', warning));
}
console.log('SDK health score:', validation.score, '/100');
```

## Diagnostic Reports

```typescript
// Generate comprehensive diagnostic report
const report = debugTools.generateDiagnosticReport();

console.log('Diagnostic Report:');
console.log('- Generated at:', new Date(report.metadata.generatedAt));
console.log('- SDK version:', report.metadata.sdkVersion);
console.log('- Session duration:', Math.round(report.metadata.sessionDuration / 1000), 'seconds');
console.log('- Overall health score:', report.healthScore, '/100');

// Export for support cases
const jsonReport = debugTools.exportDiagnostics('json');
const textReport = debugTools.exportDiagnostics('text');
const csvReport = debugTools.exportDiagnostics('csv');

// Save to file or send to support
localStorage.setItem('farert-diagnostic-report', jsonReport);
```

## Integration with SDK Components

```typescript
import { 
  createFarertSDK, 
  createDevelopmentDebugTools 
} from '@farert/sdk';

// Create SDK with debug tools
const sdk = createFarertSDK();
const debugTools = createDevelopmentDebugTools();

// Initialize SDK
await sdk.initialize();

// Attach debug tools to SDK components
debugTools.attachToSDK(
  sdk.cacheManager,
  sdk.errorManager,
  sdk.wasmModule
);

// Use SDK with monitoring
const station = await sdk.getStationById('東京');
const analysis = debugTools.inspectCache();
```

## Configuration Options

```typescript
const debugTools = new DebugTools({
  level: DebugLevel.DEVELOPMENT,
  enableCacheInspection: true,
  enablePerformanceMonitoring: true,
  enableMemoryTracking: true,
  enableErrorTracking: true,
  maxPerformanceSamples: 1000,
  maxErrorEvents: 100,
  memorySamplingInterval: 5000, // 5 seconds
  enableRealtimeDashboard: true,
  consolePrefix: '[Farert Debug]',
  localStorageKey: 'farert-debug-logs'
});
```

## TypeScript Support

All debug tools are fully typed with comprehensive TypeScript definitions:

```typescript
import type {
  DebugConfig,
  CacheInspectionResult,
  PerformanceMonitoringData,
  WebAssemblyMemoryAnalysis,
  SDKStateSnapshot,
  DiagnosticReport
} from '@farert/sdk/debug';

// Type-safe configuration
const config: DebugConfig = {
  level: DebugLevel.PERFORMANCE,
  enableCacheInspection: true
};

// Type-safe results
const analysis: CacheInspectionResult | null = debugTools.inspectCache();
const performanceData: PerformanceMonitoringData = debugTools.getPerformanceData();
```

## Best Practices

### Development
1. Use `DebugLevel.DEVELOPMENT` for comprehensive debugging
2. Enable real-time dashboard for interactive development
3. Monitor cache performance and memory usage actively
4. Generate diagnostic reports for complex issues

### Production
1. Use `DebugLevel.BASIC` or `DebugLevel.NONE` for minimal overhead
2. Enable error tracking for production monitoring
3. Export diagnostic reports for support cases
4. Use performance monitoring sparingly

### Performance Analysis
1. Use `createPerformanceDebugTools()` for focused performance work
2. Monitor operation timings and identify bottlenecks
3. Track memory usage patterns over time
4. Use profiling sessions for detailed analysis

## Error Handling

All debug operations are designed to fail gracefully and not impact the main SDK functionality:

```typescript
// Debug operations never throw exceptions
const analysis = debugTools.inspectCache(); // Returns null on error
const report = debugTools.generateDiagnosticReport(); // Returns minimal report on error

// Check debug tool availability
if (debugTools.config.level > DebugLevel.NONE) {
  // Debug operations are available
}
```

## Cleanup

```typescript
// Always dispose of debug tools when done
debugTools.dispose();

// This cleans up:
// - Memory monitoring timers
// - Event listeners
// - Real-time subscriptions
// - Performance data
```

## Integration Examples

### Svelte Application

```svelte
<script>
  import { onMount } from 'svelte';
  import { createDevelopmentDebugTools } from '@farert/sdk/debug';
  
  let debugTools;
  let healthScore = 0;
  
  onMount(async () => {
    debugTools = createDevelopmentDebugTools();
    
    // Subscribe to real-time updates
    debugTools.subscribeToRealtimeUpdates((data) => {
      if (data.type === 'performance') {
        // Update UI with performance data
      }
    });
    
    // Update health score periodically
    setInterval(() => {
      const report = debugTools.generateDiagnosticReport();
      healthScore = report.healthScore;
    }, 30000);
  });
</script>

<div class="debug-panel">
  <h3>SDK Health: {healthScore}/100</h3>
  <!-- Debug UI components -->
</div>
```

### React Application

```tsx
import React, { useEffect, useState } from 'react';
import { createDevelopmentDebugTools } from '@farert/sdk/debug';
import type { DiagnosticReport } from '@farert/sdk/debug';

export function DebugPanel() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [debugTools] = useState(() => createDevelopmentDebugTools());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setReport(debugTools.generateDiagnosticReport());
    }, 10000);
    
    return () => {
      clearInterval(interval);
      debugTools.dispose();
    };
  }, [debugTools]);
  
  if (!report) return <div>Loading debug data...</div>;
  
  return (
    <div className="debug-panel">
      <h3>SDK Health Score: {report.healthScore}/100</h3>
      <div>Session Duration: {Math.round(report.metadata.sessionDuration / 1000)}s</div>
      {/* Additional debug UI */}
    </div>
  );
}
```