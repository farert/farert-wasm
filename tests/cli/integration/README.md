# CLI Integration Tests - Task 15

Comprehensive integration tests with exact C++ result comparison for the TypeScript CLI implementation.

## Overview

This test suite validates the complete CLI implementation against the original C++ version with **±0 yen tolerance** for fare calculations and comprehensive compatibility testing.

### Requirements Validated

- **REQ-CLI-002.2**: CLI result accuracy (±0 yen tolerance)
- **REQ-CLI-002.3**: Complete C++ compatibility 
- **REQ-CLI-002.5**: Performance requirements (startup ≤2s, calculation ≤1s)
- **REQ-CLI-003.4**: Error handling and graceful shutdown
- **REQ-CLI-003.5**: Input validation and security

## Test Categories

### 1. CLI Integration Tests (`cli-integration.test.ts`)
- **Purpose**: Basic CLI command functionality
- **Coverage**: All CLI commands (-exec, -5, -h, -help)
- **Performance**: Startup time and memory usage validation
- **Error Handling**: Invalid arguments and edge cases

### 2. C++ Compatibility Tests (`cpp-comparison.test.ts`) 
- **Purpose**: Exact result matching with C++ implementation
- **Coverage**: All route calculation scenarios from original test_exec.cpp
- **Tolerance**: ±0 yen (exact matching required)
- **Test Order**: Matches original C++ test execution sequence

### 3. Performance Validation Tests (`performance-validation.test.ts`)
- **Purpose**: Performance requirement verification
- **Coverage**: Startup, calculation, memory, and test suite performance
- **Limits**: 2s startup, 1s calculation, 512MB memory, 30s test suite
- **Monitoring**: Real-time performance metrics and violation reporting

### 4. Error Scenario Tests (`error-scenarios.test.ts`)
- **Purpose**: Comprehensive error handling validation  
- **Coverage**: Invalid inputs, security threats, resource limits
- **Security**: Command injection, XSS, path traversal protection
- **Recovery**: Error state recovery and cleanup validation

## Test Data Structure

### Expected C++ Results (`test-data/cpp-expected-results.ts`)
```typescript
interface ExpectedCppResult {
  testId: string;
  testName: string;
  category: 'basic_routes' | 'company_lines' | 'junction_special' | 'shinkansen_conventional' | 'route_comparison';
  route: string;
  routeParams: string[];
  expectedFare: number;
  executionOrder: number; // Matches original test_exec.cpp order
  tolerance?: number;     // Default: 0 (exact matching)
}
```

### Test Categories by C++ Source
- **Basic Routes**: `test_route_tbl[]` (Line 1017+)
- **Company Lines**: `test_route2_tbl[]` (Line 35+) 
- **Junction Special**: `jct_special_route_tbl[]` (Line 211+)
- **Shinkansen Conventional**: `test_shin2_zai_tbl[]` (Line 1715+)
- **Route Comparison**: `test_route3_tbl[]` (Line 1767+)

## Helper Utilities

### Result Parser (`helpers/result-parser.ts`)
- Extracts fare amounts from Japanese CLI output
- Parses route information and performance metrics
- Validates Japanese text encoding and formatting
- Provides fuzzy matching suggestions for invalid inputs

### Test Executor (`helpers/test-executor.ts`)
- Safe CLI execution with timeout and monitoring
- Memory usage tracking and limit enforcement
- Performance measurement and validation
- Batch test execution with resource management

## Running the Tests

### Prerequisites
```bash
# Build the project first
npm run build

# Ensure required files exist
ls -la dist/farert.js dist/farert.wasm data/jrdbnewest.db
```

### Run All Integration Tests
```bash
# Run complete integration test suite
cd tests/cli/integration
npx jest --config jest.config.js

# Run with verbose output
npx jest --config jest.config.js --verbose

# Run with debug output
CLI_DEBUG=1 npx jest --config jest.config.js
```

### Run Specific Test Categories
```bash
# CLI command tests only
npx jest cli-integration.test.ts

# C++ compatibility tests only  
npx jest cpp-comparison.test.ts

# Performance tests only
npx jest performance-validation.test.ts

# Error scenario tests only
npx jest error-scenarios.test.ts
```

### Environment Variables

#### Test Configuration
- `CLI_DEBUG=1` - Enable detailed debug output
- `CLI_TEST_TIMEOUT=60000` - Test timeout in milliseconds  
- `CLI_TEST_MEMORY_LIMIT=536870912` - Memory limit in bytes (512MB)

#### CLI Behavior Control
- `CLI_WASM_PATH=/path/to/farert.wasm` - Custom WebAssembly module path
- `CLI_DB_PATH=/path/to/database.db` - Custom database path
- `NODE_ENV=test` - Test environment mode

## Test Execution Flow

### 1. Environment Setup
- Validate CLI and required files exist
- Configure test timeouts and memory limits
- Set up Japanese locale and UTF-8 encoding
- Initialize performance monitoring

### 2. Test Sequencing (Custom Sequencer)
1. **Quick Tests**: Help commands, environment validation
2. **Compatibility Tests**: C++ result comparison  
3. **Error Tests**: Invalid inputs and security validation
4. **Performance Tests**: Resource usage and timing (run last)

### 3. Result Validation
- **Exit Code**: Must match expected values
- **Fare Accuracy**: ±0 yen tolerance for C++ compatibility  
- **Performance**: Must meet timing and memory requirements
- **Error Handling**: Proper error messages and suggestions
- **Security**: Threat detection and safe input handling

## Performance Requirements

### Timing Requirements (REQ-CLI-002.5)
- **CLI Startup**: ≤2 seconds
- **Route Calculation**: ≤1 second per route
- **Complete Test Suite**: ≤30 seconds  
- **Error Handling**: ≤500ms for invalid inputs

### Memory Requirements
- **Normal Operation**: ≤512MB heap usage
- **Test Suite Execution**: ≤512MB peak usage
- **Error Scenarios**: ≤256MB (reduced limit)

### Compatibility Requirements (REQ-CLI-002.2)
- **Fare Calculation**: Exact match with C++ (±0 yen)
- **Test Execution Order**: Match original test_exec.cpp sequence
- **Output Format**: Compatible Japanese text formatting
- **Error Codes**: Match original error behavior

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Rebuild WebAssembly and TypeScript
npm run clean
npm run build
npm run cli:build
```

#### Missing Files
```bash
# Check required files
ls -la dist/farert.js dist/farert.wasm data/jrdbnewest.db

# Regenerate if missing  
npm run build
```

#### Test Timeouts
```bash
# Increase timeout for slow systems
CLI_TEST_TIMEOUT=120000 npx jest --config jest.config.js
```

#### Memory Issues
```bash
# Increase Node.js heap size
node --max-old-space-size=2048 $(which jest) --config jest.config.js
```

#### Japanese Text Issues
```bash
# Ensure UTF-8 encoding
export LANG=ja_JP.UTF-8
export LC_ALL=ja_JP.UTF-8
```

### Debug Information

#### Enable Debug Mode
```bash
CLI_DEBUG=1 npx jest --config jest.config.js --verbose
```

#### Performance Monitoring
```bash
# Monitor memory usage
CLI_DEBUG=1 npx jest performance-validation.test.ts --verbose

# Check specific test performance  
CLI_DEBUG=1 npx jest --testNamePattern="should calculate.*route correctly"
```

#### Error Analysis
```bash
# Focus on error handling
npx jest error-scenarios.test.ts --verbose

# Test specific error conditions
npx jest --testNamePattern="invalid.*parameters"
```

## Test Reports

### HTML Report
Tests generate an HTML report: `integration-test-report.html`

### Console Output
- ✅ **Passed tests**: Green checkmark with timing
- ❌ **Failed tests**: Red X with detailed error information  
- ⚠️ **Performance violations**: Warning with metrics
- 🚨 **Security issues**: Security warning with threat details

### Summary Statistics
- Total tests executed and pass rate
- Performance requirement compliance
- C++ compatibility percentage  
- Memory usage statistics
- Error handling success rate

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run CLI Integration Tests
  run: |
    npm run build
    cd tests/cli/integration
    npx jest --config jest.config.js --ci --coverage --watchAll=false
  env:
    CLI_TEST_TIMEOUT: 120000
    NODE_ENV: test
```

### Test Quality Gates
- **100% C++ compatibility required**
- **All performance requirements must pass**
- **Zero security vulnerabilities allowed**
- **All error scenarios must be handled properly**

## Contributing

When adding new integration tests:

1. **Follow naming conventions**: `*.test.ts` files
2. **Update expected results**: Add to `cpp-expected-results.ts`
3. **Document test purpose**: Include requirement references
4. **Validate performance**: Ensure tests meet timing requirements
5. **Test error scenarios**: Include both positive and negative cases

## Support

For issues with integration tests:
1. Check troubleshooting section above
2. Verify build environment is correct
3. Ensure all dependencies are installed
4. Review test logs for specific error details
5. Check C++ compatibility data is up-to-date