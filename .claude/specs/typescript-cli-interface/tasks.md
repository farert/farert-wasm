# Implementation Plan

## Task Overview
The TypeScript CLI Interface implementation is approximately 70% complete with a solid foundation. The WebAssembly build is functional, core CLI structure exists, and basic route calculation works. Key remaining work includes fixing TypeScript compilation issues, completing the test suite with exact C++ compatibility, implementing missing API functions, and enhancing error handling with Japanese text support.

## Steering Document Compliance
These tasks follow CLAUDE.md requirements for 100% C++ compatibility, maintain the existing TypeScript strict mode configuration, use the established WebAssembly API patterns from src/farert_wasm.cpp, and integrate with the current npm script workflow defined in package.json.

## Atomic Task Requirements
**Each task must meet these criteria for optimal agent execution:**
- **File Scope**: Touches 1-3 related files maximum
- **Time Boxing**: Completable in 15-30 minutes
- **Single Purpose**: One testable outcome per task
- **Specific Files**: Must specify exact files to create/modify
- **Agent-Friendly**: Clear input/output with minimal context switching

## Task Format Guidelines
- Use checkbox format: `- [ ] Task number. Task description`
- **Specify files**: Always include exact file paths to create/modify
- **Include implementation details** as bullet points
- Reference requirements using: `_Requirements: X.Y, Z.A_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

- [x] 1. Fix TypeScript compilation issues in test_exec_complete.ts
  - File: src/cli/test_exec_complete.ts
  - Remove unused variable warnings by using parameters or marking with underscore
  - Fix the 'module' parameter usage in executeCompleteTestSuite function
  - Ensure all declared functions are properly used or commented out
  - Purpose: Enable clean TypeScript compilation without warnings
  - _Leverage: existing TypeScript strict mode configuration in tsconfig.json_
  - _Requirements: REQ-CLI-005.1_

- [x] 2. Fix WebAssembly loader file path resolution in wasm_loader.ts
  - File: src/cli/wasm_loader.ts
  - Update loadModule() method to correctly resolve farert_node.wasm and farert_node.js paths
  - Add fallback logic for both Node.js targets (farert_node.*) and browser targets (farert.*)
  - Verify file existence with better error messages pointing to correct build commands
  - Purpose: Ensure reliable WebAssembly module loading in Node.js environment
  - _Leverage: existing file existence checking logic, dist/ directory structure_
  - _Requirements: REQ-CLI-001.1, REQ-CLI-003.1_

- [x] 3. Add missing WebAssembly API functions to types.ts FarertModule interface
  - File: src/cli/types.ts
  - Add getLineId(name: string): number method definition
  - Add getRouteScript(): string method definition  
  - Add setLongRoute(flag: boolean): void method definition
  - Add setStartAsCity(flag: boolean): void method definition
  - Add setArriveAsCity(flag: boolean): void method definition
  - Purpose: Provide complete TypeScript interface for all used WebAssembly functions
  - _Leverage: existing FarertModule interface structure, src/farert_wasm.cpp API definitions_
  - _Requirements: REQ-CLI-001.1, REQ-CLI-001.2_

- [x] 4. Create test data tables file for complete test suite execution
  - File: src/cli/test_data.ts
  - Define testRoute2Tbl array with main route test patterns
  - Define jctSpecialRouteTbl array with special junction test patterns
  - Define hzlRouteDef and hzlDefTbl arrays with HZL test patterns
  - Define autoRouteDef array with auto route test patterns
  - Define testRouteTbl and testRoute3Tbl arrays with specific route patterns
  - Purpose: Provide structured test data for complete test suite matching C++ version
  - _Leverage: existing test patterns in test_exec_complete.ts, original C++ test data_
  - _Requirements: REQ-CLI-002.1, REQ-CLI-002.2_

- [x] 5. Complete test suite implementation in test_exec_complete.ts
  - File: src/cli/test_exec_complete.ts
  - Uncomment and implement all 8 test suites in exact C++ execution order
  - Import test data from test_data.ts and use in respective test functions
  - Enable testRoute, testShinkansen, testJunctionSpecial, testHzl, testHzl2, testAutoroute functions
  - Ensure exact same test execution sequence as original C++ test_exec.cpp
  - Purpose: Restore complete test suite functionality with C++ compatibility
  - _Leverage: existing test function implementations, TestOutputWriter, test data structure_
  - _Requirements: REQ-CLI-002.1, REQ-CLI-002.2, REQ-CLI-002.3_

- [x] 6. Enhance route_test.ts with missing getLineId API usage
  - File: src/cli/route_test.ts
  - Fix setupRouteFromString function to properly use module.getLineId() API
  - Add proper error handling for line ID resolution failures
  - Improve route parsing logic to handle edge cases with missing line information
  - Purpose: Enable reliable route parsing and setup for all test scenarios
  - _Leverage: existing setupRouteFromString logic, FarertModule interface_
  - _Requirements: REQ-CLI-001.3, REQ-CLI-003.2_

- [x] 7. Add Japanese text validation and fuzzy matching in main.ts
  - File: src/cli/main.ts
  - Enhance validateJapaneseInput function with comprehensive character set support
  - Implement fuzzy matching for station name suggestions when station not found
  - Add Japanese text normalization for consistent input processing
  - Purpose: Improve user experience with Japanese station names and error recovery
  - _Leverage: existing validateJapaneseInput function, sanitizeInput function_
  - _Requirements: REQ-CLI-003.3, REQ-CLI-006.3_

- [ ] 8. Create comprehensive CLI help system with Japanese examples
  - File: src/cli/main.ts
  - Enhance printHelp() function with detailed Japanese station and line examples
  - Add troubleshooting section with common error scenarios and solutions
  - Include platform-specific setup instructions for macOS/Linux/Windows
  - Purpose: Provide comprehensive user guidance matching requirements
  - _Leverage: existing printHelp() function structure_
  - _Requirements: REQ-CLI-006.1, REQ-CLI-006.2, REQ-CLI-006.4_

- [ ] 9. Implement robust error handling with specific error codes
  - File: src/cli/types.ts, src/cli/main.ts
  - Create CLIErrorCode enum with specific error codes for different failure scenarios
  - Implement ErrorHandler class with Japanese text support and error formatting
  - Add specific error messages for WebAssembly, database, and input validation failures
  - Purpose: Provide clear, actionable error messages with Japanese text support
  - _Leverage: existing CLIError class, error handling patterns in main.ts_
  - _Requirements: REQ-CLI-003.1, REQ-CLI-003.2, REQ-CLI-003.4_

- [ ] 10. Add CLI environment validation and configuration management
  - File: src/cli/main.ts
  - Enhance validateCliEnvironment() with comprehensive dependency checking
  - Add CLI_DEBUG and CLI_WASM_PATH environment variable support
  - Implement platform detection and provide platform-specific error messages
  - Purpose: Ensure reliable CLI execution across different environments
  - _Leverage: existing validateCliEnvironment function, Node.js version checking_
  - _Requirements: REQ-CLI-004.1, REQ-CLI-004.3, REQ-CLI-004.5_

- [ ] 11. Fix npm scripts and build integration paths
  - File: package.json
  - Update cli:exec script to use correct output path dist/cli/main.js
  - Add cli:debug script with CLI_DEBUG environment variable
  - Fix cli:build script dependencies and output verification
  - Purpose: Enable seamless build system integration and CI/CD compatibility
  - _Leverage: existing npm scripts structure, TypeScript compilation setup_
  - _Requirements: REQ-CLI-005.1, REQ-CLI-005.2, REQ-CLI-005.4_

- [ ] 12. Create performance monitoring and memory usage tracking
  - File: src/cli/test_exec_complete.ts
  - Add execution time tracking for individual test suites
  - Implement WebAssembly memory usage monitoring during test execution
  - Add performance summary reporting matching C++ test execution format
  - Purpose: Monitor CLI performance and ensure it meets requirements
  - _Leverage: existing showTime function, TestOutputWriter_
  - _Requirements: REQ-CLI-002.5, CLI performance requirements_

- [ ] 13. Implement signal handling for graceful shutdown
  - File: src/cli/main.ts  
  - Enhance existing SIGINT/SIGTERM handlers with WebAssembly memory cleanup
  - Add proper database connection cleanup on process termination
  - Implement timeout handling for long-running operations
  - Purpose: Ensure reliable resource cleanup and prevent memory leaks
  - _Leverage: existing process signal handlers, wasmLoader cleanup methods_
  - _Requirements: REQ-CLI-003.4, reliability requirements_

- [ ] 14. Add comprehensive input sanitization and validation
  - File: src/cli/main.ts
  - Enhance sanitizeInput function with command injection prevention
  - Add input length validation and character encoding verification  
  - Implement comprehensive station/line name validation with database checking
  - Purpose: Prevent security issues and ensure robust input handling
  - _Leverage: existing sanitizeInput and validateJapaneseInput functions_
  - _Requirements: REQ-CLI-003.5, security requirements_

- [ ] 15. Create CLI integration tests with exact C++ result comparison
  - File: src/cli/test_integration.ts
  - Implement automated comparison of CLI output with expected C++ results
  - Add test cases for all CLI commands (-exec, -5, -h, file input, direct route)
  - Create tolerance checking for fare calculations (±0 yen requirement)
  - Purpose: Validate 100% compatibility with original C++ implementation
  - _Leverage: existing test execution patterns, CLI command implementations_
  - _Requirements: REQ-CLI-002.2, REQ-CLI-002.3, 100% compatibility requirement_

- [ ] 16. Enhance test output formatting to match C++ format exactly
  - File: src/cli/test_output.ts
  - Update writeRouteTestResult method to match exact C++ output format
  - Add timestamp formatting to match original test_exec.cpp format
  - Implement proper section headers and separators matching C++ version
  - Purpose: Ensure test output format compatibility for result comparison
  - _Leverage: existing TestOutputWriter methods, showTime function_
  - _Requirements: REQ-CLI-002.2, REQ-CLI-002.5_

- [ ] 17. Add comprehensive CLI documentation and usage examples  
  - File: README_CLI.md
  - Create step-by-step installation and build instructions
  - Document all CLI commands with Japanese examples using real station names
  - Add troubleshooting section with common error scenarios and solutions
  - Purpose: Provide complete user documentation for CLI interface
  - _Leverage: existing help text in main.ts, CLAUDE.md project documentation_
  - _Requirements: REQ-CLI-006.2, REQ-CLI-006.4, REQ-CLI-006.5_

- [ ] 18. Optimize WebAssembly loading and database initialization performance
  - File: src/cli/wasm_loader.ts
  - Add caching for repeated WebAssembly module loads
  - Implement connection pooling for database operations
  - Add startup time monitoring and optimization
  - Purpose: Meet CLI startup time requirements (2 seconds maximum)
  - _Leverage: existing WasmLoader class, database initialization logic_
  - _Requirements: Performance requirements, REQ-CLI-004.1_

- [ ] 19. Create automated CLI testing pipeline integration
  - File: src/cli/test_cli.ts  
  - Implement automated CLI command execution and output validation
  - Add CI/CD pipeline integration with proper exit codes
  - Create test result comparison with baseline C++ outputs
  - Purpose: Enable automated testing in continuous integration
  - _Leverage: existing test execution patterns, npm script integration_
  - _Requirements: REQ-CLI-005.2, REQ-CLI-005.4_

- [ ] 20. Final CLI integration testing and compatibility validation
  - File: src/cli/main.ts, src/cli/test_exec_complete.ts
  - Run complete test suite and verify all outputs match C++ results exactly
  - Test all CLI commands with various input scenarios and edge cases
  - Validate memory usage, performance, and error handling across platforms
  - Purpose: Ensure complete CLI functionality and C++ compatibility
  - _Leverage: all implemented CLI components, complete test suite_
  - _Requirements: All requirements, 100% C++ compatibility mandate_