# Cache Performance Test Suite

Comprehensive performance testing suite for the Farert Frontend API Layer SDK cache system, validating REQ-API-002: Intelligent Caching and Performance Layer requirements.

## Overview

This test suite provides thorough validation of:

- **LRU Eviction**: Tests cache eviction under memory pressure with realistic railway data
- **TTL Expiration**: Validates precise timing accuracy for different cache categories
- **Memory Management**: Enforces 50MB global limit with automatic cleanup
- **Performance Benchmarks**: Ensures <10ms response times for cached operations
- **Category-Specific Caching**: Tests different TTL values (stations 1h, search 15min, fares 5min, reference session)
- **Concurrent Access**: Validates thread safety and performance under load
- **REQ-API-002 Compliance**: End-to-end validation of all acceptance criteria

## Test Categories

### 1. LRU Eviction Under Memory Pressure
- **File**: `cache-performance.test.ts` - Lines 430-550
- **Purpose**: Validates that least recently used entries are evicted when memory limits are exceeded
- **Key Tests**:
  - Memory limit enforcement with eviction priority
  - Performance maintenance during memory pressure
  - Cache manager emergency eviction ordering

### 2. TTL Expiration Timing Accuracy
- **File**: `cache-performance.test.ts` - Lines 560-680
- **Purpose**: Ensures precise TTL expiration timing across cache categories
- **Key Tests**:
  - Station info (1 hour), Search (15min), Fare (5min), Reference (24h) TTL validation
  - Absolute vs sliding expiration behavior
  - Timing precision within ±10ms tolerance

### 3. Cache Hit/Miss Ratios with Railway Data
- **File**: `cache-performance.test.ts` - Lines 690-850
- **Purpose**: Tests realistic Japanese railway access patterns for optimal cache efficiency
- **Key Tests**:
  - 80/20 rule validation (popular stations accessed more frequently)
  - Search result caching effectiveness
  - Hit ratio stability under varying load patterns

### 4. 50MB Memory Limit Enforcement
- **File**: `cache-performance.test.ts` - Lines 860-1050
- **Purpose**: Validates global memory limit with emergency eviction
- **Key Tests**:
  - Emergency eviction triggers at 90% threshold
  - Memory distribution across cache categories
  - Automatic cleanup mechanisms

### 5. Performance Benchmarks (<10ms Requirement)
- **File**: `cache-performance.test.ts` - Lines 1060-1280
- **Purpose**: Ensures cached operations meet <10ms performance requirement
- **Key Tests**:
  - Cached station lookup performance (avg <10ms, p95 <15ms, p99 <25ms)
  - Concurrent access performance validation
  - Cache vs non-cached operation comparison (>10x speedup)

### 6. REQ-API-002 Comprehensive Validation
- **File**: `cache-performance.test.ts` - Lines 1290-1450
- **Purpose**: End-to-end validation of all REQ-API-002 acceptance criteria
- **Key Tests**:
  - Integrated scenario testing all cache categories
  - Performance requirements across mixed operations
  - Real-world usage pattern simulation

## Running the Tests

### Quick Start

```bash
# Run all cache performance tests
npm test -- tests/sdk/cache/cache-performance.test.ts

# Run with verbose output
npm test -- tests/sdk/cache/cache-performance.test.ts --verbose

# Run with coverage
npm test -- tests/sdk/cache/cache-performance.test.ts --coverage
```

### Advanced Options

```bash
# Run specific test suite
npm test -- --testNamePattern="LRU Eviction Under Memory Pressure"

# Run with custom timeout (for slower systems)
npm test -- tests/sdk/cache/cache-performance.test.ts --testTimeout=120000

# Run with memory profiling
NODE_OPTIONS="--max-old-space-size=4096 --expose-gc" npm test -- tests/sdk/cache/cache-performance.test.ts

# Generate HTML report
npm test -- tests/sdk/cache/cache-performance.test.ts --reporters=default --reporters=jest-html-reporters
```

### Configuration

The test suite uses a custom Jest configuration optimized for performance testing:

```javascript
// tests/sdk/cache/jest.config.js
module.exports = {
  testTimeout: 60000,        // 60 second timeout for comprehensive tests
  maxWorkers: 2,             // Limit workers for memory-intensive tests
  runInBand: true,           // Sequential execution for memory consistency
  detectOpenHandles: true,   // Detect memory leaks
  forceExit: true           // Clean exit after tests
};
```

## Test Data

The test suite uses realistic Japanese railway data patterns:

### Station Data
- Major stations: Tokyo, Shinjuku, Shibuya (high access frequency)
- Regular stations: Yokohama, Osaka, Kyoto (medium access)
- Local stations: Various regional stations (low access)

### Access Patterns
- **80/20 Rule**: 80% of accesses to 20% of popular stations
- **Search Patterns**: Common queries like "東京", "新宿", "渋谷"
- **Fare Calculations**: Realistic route combinations
- **Reference Data**: Company and prefecture information

## Performance Targets

### Response Time Requirements
- **Cached Operations**: Average <10ms, P95 <15ms, P99 <25ms
- **Cache Hit Ratio**: >85% overall, >90% for popular stations
- **Concurrent Performance**: <15ms average under concurrent load
- **Memory Efficiency**: >10x speedup vs uncached operations

### Memory Requirements  
- **Global Limit**: 50MB total across all cache categories
- **Category Distribution**:
  - Station Info: 10MB limit, 1-hour TTL
  - Search Results: 5MB limit, 15-minute TTL
  - Fare Calculations: 15MB limit, 5-minute TTL
  - Reference Data: 20MB limit, 24-hour TTL

### Reliability Requirements
- **TTL Accuracy**: ±10ms precision for expiration timing
- **Emergency Eviction**: Triggers at 90% memory threshold
- **Cache Consistency**: Thread-safe concurrent access
- **Error Handling**: Graceful degradation under failure conditions

## Output Files

After running tests, the following files are generated:

### Reports Directory (`tests/sdk/cache/reports/`)
- `test-report.html` - Comprehensive HTML test report
- `test-summary.json` - Detailed JSON summary
- `test-summary.md` - Human-readable markdown report

### Artifacts Directory (`tests/sdk/cache/artifacts/`)
- `performance-config.json` - Test configuration metadata
- `final-metrics.json` - Performance metrics and statistics
- `test-metadata.json` - Test suite information

## Troubleshooting

### Common Issues

**Memory Errors**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

**Test Timeouts**
```bash
# Increase timeout for slower systems
npm test -- --testTimeout=120000
```

**Inconsistent Results**
```bash
# Run with garbage collection for consistent results
NODE_OPTIONS="--expose-gc" npm test
```

### Performance Debugging

Enable detailed performance monitoring:

```bash
# Enable performance debugging
CACHE_DEBUG=true npm test -- tests/sdk/cache/cache-performance.test.ts
```

Monitor memory usage during tests:

```bash
# Memory profiling
node --inspect --expose-gc ./node_modules/.bin/jest tests/sdk/cache/cache-performance.test.ts
```

## Integration with CI/CD

### GitHub Actions

```yaml
- name: Run Cache Performance Tests
  run: |
    NODE_OPTIONS="--max-old-space-size=4096 --expose-gc" \
    npm test -- tests/sdk/cache/cache-performance.test.ts \
    --coverage --ci --maxWorkers=2
  
- name: Upload Performance Reports
  uses: actions/upload-artifact@v3
  with:
    name: cache-performance-reports
    path: tests/sdk/cache/reports/
```

### Local Development

Add to `package.json`:

```json
{
  "scripts": {
    "test:cache": "jest tests/sdk/cache/cache-performance.test.ts",
    "test:cache:watch": "jest tests/sdk/cache/cache-performance.test.ts --watch",
    "test:cache:coverage": "jest tests/sdk/cache/cache-performance.test.ts --coverage",
    "test:cache:debug": "NODE_OPTIONS='--inspect --expose-gc' jest tests/sdk/cache/cache-performance.test.ts"
  }
}
```

## Contributing

When adding new cache performance tests:

1. **Follow existing patterns** for data generation and performance measurement
2. **Use realistic railway data** to ensure representative testing
3. **Include performance assertions** with appropriate tolerances
4. **Test edge cases** and error conditions
5. **Document test purpose** and expected outcomes
6. **Validate REQ-API-002** compliance for new features

## Related Documentation

- [REQ-API-002: Intelligent Caching and Performance Layer](../../../.claude/specs/frontend-api-layer/requirements.md)
- [Cache Manager Implementation](../../../src/sdk/cache/cache-manager.ts)
- [LRU Cache Implementation](../../../src/sdk/cache/lru-cache.ts)
- [Frontend API Layer Design](../../../.claude/specs/frontend-api-layer/design.md)

---

**Task 29 Implementation Status**: ✅ Complete  
**REQ-API-002 Validation**: ✅ Comprehensive test coverage  
**Performance Benchmarks**: ✅ <10ms requirement validated  
**Memory Management**: ✅ 50MB limit enforcement tested