# Flutter WebAssembly Plugin Implementation Tasks

## Task Overview

This document outlines the complete implementation plan for the Flutter WebAssembly plugin that provides Japanese railway fare calculation capabilities. The implementation follows a layered architecture with platform-specific implementations that converge on a unified Dart API surface, supporting Android, iOS, Web, Windows, Linux, and macOS platforms.

The tasks are organized to build upon the existing 39+ WebAssembly APIs from `src/core/route_interface.cpp` and leverage proven patterns from the established SDK implementations in `src/sdk/core/`, `src/sdk/cache/`, and `src/sdk/utils/`.

## Steering Document Compliance

This implementation follows established technical patterns from the farert-wasm project:
- **WebAssembly Core Integration**: Utilizes existing `route_interface.cpp` for consistent behavior across platforms
- **Object-Oriented Design**: Implements the 6-class inheritance hierarchy through Dart wrappers
- **Memory Management**: Adopts RAII patterns with automatic WebAssembly cleanup through Dart finalizers
- **Error Handling**: Preserves original C++ error codes and established error management patterns
- **Cross-Platform Architecture**: Follows proven platform detection and abstraction patterns from existing SDK modules

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

### Foundation and Platform Interface Layer

- [ ] 1. Create platform interface abstract class in lib/src/platform/farert_wasm_platform_interface.dart
  - File: src/sdk/flutter/lib/src/platform/farert_wasm_platform_interface.dart
  - Define abstract base class with all 39+ WebAssembly API method signatures
  - Include platform detection and initialization methods
  - Add error handling interfaces for platform-specific exceptions
  - Purpose: Establish unified API contract across all Flutter platforms
  - _Leverage: src/sdk/core/memory-manager.ts, src/sdk/errors/error-manager.ts_
  - _Requirements: 1.1, 1.5_

- [ ] 2. Create method channel platform implementation in lib/src/platform/farert_wasm_method_channel.dart
  - File: src/sdk/flutter/lib/src/platform/farert_wasm_method_channel.dart
  - Implement MethodChannel-based platform interface for Android/iOS
  - Add platform channel method mapping for all WebAssembly APIs
  - Include platform-specific initialization and error conversion
  - Purpose: Enable mobile platform integration through platform channels
  - _Leverage: src/sdk/errors/error-manager.ts_
  - _Requirements: 1.2, 1.6_

- [ ] 3. Create web platform implementation in lib/src/platform/farert_wasm_web.dart
  - File: src/sdk/flutter/lib/src/platform/farert_wasm_web.dart
  - Implement direct WebAssembly loading for web platform using js interop
  - Add web-specific memory management and module initialization
  - Include CORS handling and progressive loading capabilities
  - Purpose: Enable direct WebAssembly integration in web browsers
  - _Leverage: src/sdk/core/wasm-loader.ts, src/sdk/utils/platform-detector.ts_
  - _Requirements: 1.3, 4.3_

- [ ] 4. Create desktop FFI platform implementation in lib/src/platform/farert_wasm_desktop.dart
  - File: src/sdk/flutter/lib/src/platform/farert_wasm_desktop.dart
  - Implement FFI-based platform interface for Windows/Linux/macOS
  - Add dynamic library loading and C API bridge integration
  - Include platform-specific memory management through native finalizers
  - Purpose: Enable desktop platform integration through FFI
  - _Leverage: src/sdk/core/memory-manager.ts_
  - _Requirements: 1.4, 4.5_

### Exception Hierarchy and Error Handling

- [ ] 5. Create exception hierarchy in lib/src/exceptions/farert_exceptions.dart
  - File: src/sdk/flutter/lib/src/exceptions/farert_exceptions.dart
  - Define FarertException base class and specific exception subclasses
  - Include InvalidStationException, RouteCalculationException, PlatformInitializationException
  - Add error context, codes, and platform-specific error conversion utilities
  - Purpose: Provide comprehensive error handling with detailed diagnostic information
  - _Leverage: src/sdk/errors/error-manager.ts_
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 6. Create error handler utility in lib/src/utils/error_handler.dart
  - File: src/sdk/flutter/lib/src/utils/error_handler.dart
  - Implement platform exception conversion to FarertException subclasses
  - Add error logging, debugging context, and resolution guidance
  - Include C++ error code preservation for compatibility
  - Purpose: Centralize error handling and provide consistent error experience
  - _Leverage: src/sdk/errors/error-manager.ts, src/sdk/debug/debug-logger.ts_
  - _Requirements: 6.3, 6.4, 6.6_

### Core Data Models

- [ ] 7. Create StationInfo model in lib/src/models/station_info.dart
  - File: src/sdk/flutter/lib/src/models/station_info.dart
  - Define StationInfo class with id, name, nameKana, prefecture, lineIds, isJunction
  - Add JSON serialization, equality operators, and validation methods
  - Include copyWith method and toString for debugging
  - Purpose: Provide type-safe station data representation
  - _Leverage: src/sdk/types/station.ts_
  - _Requirements: 2.3, 3.7_

- [ ] 8. Create RouteItem model in lib/src/models/route_item.dart
  - File: src/sdk/flutter/lib/src/models/route_item.dart
  - Define RouteItem class matching C++ cRouteItem structure
  - Add stationId, lineId, flag, fare, salesKm, indexOfAggregate properties
  - Include validation methods and route connectivity checking
  - Purpose: Provide type-safe route segment representation
  - _Leverage: src/core/route_interface.cpp RouteItemWrapper_
  - _Requirements: 2.1, 2.5_

- [ ] 9. Create FareInfo model in lib/src/models/fare_info.dart
  - File: src/sdk/flutter/lib/src/models/fare_info.dart
  - Define FareInfo class with fare, isRule114Applied, availCountForFareOfStockDiscount
  - Add totalDistance, segments, calculatedAt properties
  - Include stock discount methods (fareForStockDiscount, fareForStockDiscountTitle)
  - Purpose: Provide comprehensive fare calculation result representation
  - _Leverage: src/sdk/types/fare.ts_
  - _Requirements: 2.1, 4.1_

- [ ] 10. Create LineInfo model in lib/src/models/line_info.dart
  - File: src/sdk/flutter/lib/src/models/line_info.dart
  - Define LineInfo class with id, name, nameKana, companyId, companyName, type, stationIds
  - Add LineType enum (jr, private, subway, monorail, other)
  - Include validation and company classification methods
  - Purpose: Provide type-safe line and company data representation
  - _Leverage: src/sdk/types/line.ts_
  - _Requirements: 2.3, 3.7_

- [ ] 11. Create RouteSegment model in lib/src/models/route_segment.dart
  - File: src/sdk/flutter/lib/src/models/route_segment.dart
  - Define RouteSegment class with fromStation, toStation, line, segmentFare, distance
  - Add transferTime property for junction handling
  - Include route validation and display formatting methods
  - Purpose: Provide detailed route breakdown for UI display
  - _Leverage: src/sdk/types/route.ts_
  - _Requirements: 3.3, 3.5_

### Object Lifecycle and Memory Management

- [ ] 12. Create memory manager in lib/src/utils/memory_manager.dart
  - File: src/sdk/flutter/lib/src/utils/memory_manager.dart
  - Implement MemoryManager class with object registration and automatic cleanup
  - Add ObjectLifecycle wrapper class with Dart finalizers
  - Include memory pressure monitoring and cleanup strategies
  - Purpose: Ensure automatic WebAssembly memory management and prevent leaks
  - _Leverage: src/sdk/core/memory-manager.ts_
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 13. Create object wrapper base class in lib/src/wrappers/base_wrapper.dart
  - File: src/sdk/flutter/lib/src/wrappers/base_wrapper.dart
  - Define BaseWrapper abstract class with lifecycle management
  - Add WebAssembly pointer tracking and automatic disposal
  - Include isDisposed checking and safe method call patterns
  - Purpose: Provide foundation for all WebAssembly object wrappers
  - _Leverage: src/sdk/core/memory-manager.ts_
  - _Requirements: 2.4, 5.3_

### Object-Oriented Wrapper Classes

- [ ] 14. Create RouteListWrapper in lib/src/wrappers/route_list_wrapper.dart
  - File: src/sdk/flutter/lib/src/wrappers/route_list_wrapper.dart
  - Implement RouteListWrapper extending BaseWrapper with array operations
  - Add assign, count, at, remove, removeAll, insert methods
  - Include route flag management (getRouteFlag, setRouteFlag)
  - Purpose: Provide base route container operations with automatic memory management
  - _Leverage: src/core/route_interface.cpp RouteListWrapper, src/sdk/flutter/lib/src/wrappers/base_wrapper.dart_
  - _Requirements: 2.1, 2.5_

- [ ] 15. Create RouteWrapper in lib/src/wrappers/route_wrapper.dart
  - File: src/sdk/flutter/lib/src/wrappers/route_wrapper.dart
  - Implement RouteWrapper extending RouteListWrapper with route construction
  - Add addRoute, setupRoute, routeScript, validateRoute methods
  - Include route manipulation (removeTail, autoRoute, reverseRoute)
  - Purpose: Provide route building and manipulation with inheritance
  - _Leverage: src/core/route_interface.cpp RouteWrapper, src/sdk/flutter/lib/src/wrappers/route_list_wrapper.dart_
  - _Requirements: 2.1, 2.2_

- [ ] 16. Create CalcRouteWrapper in lib/src/wrappers/calc_route_wrapper.dart
  - File: src/sdk/flutter/lib/src/wrappers/calc_route_wrapper.dart
  - Implement CalcRouteWrapper extending RouteWrapper with fare calculation
  - Add calcFare, showFare, setLongRoute, setSpecificTermRule115 methods
  - Include advanced calculation options and Osaka detour handling
  - Purpose: Provide complete fare calculation with all C++ features
  - _Leverage: src/core/route_interface.cpp CalcRouteWrapper, src/sdk/flutter/lib/src/wrappers/route_wrapper.dart_
  - _Requirements: 2.1, 4.1_

### Core API Implementation

- [ ] 17. Create core API class in lib/src/api/farert_api.dart
  - File: src/sdk/flutter/lib/src/api/farert_api.dart
  - Implement FarertApi class with platform abstraction and initialization
  - Add all 39+ WebAssembly API methods with validation and caching
  - Include platform detection, module loading, and lifecycle management
  - Purpose: Provide main API interface with platform abstraction
  - _Leverage: src/sdk/core/api.ts, src/sdk/flutter/lib/src/platform/farert_wasm_platform_interface.dart_
  - _Requirements: 1.1, 2.1, 2.6_

- [ ] 18. Add station and line utility methods to farert_api.dart
  - File: src/sdk/flutter/lib/src/api/farert_api.dart (continue from task 17)
  - Implement getStationId, getStationName, getStationKana, getLineIdsFromStation
  - Add line information methods (getLineName, getLineIdFromName, getStationIdsOfLine)
  - Include company and prefecture data access (getJRCompanys, getPrefects)
  - Purpose: Complete station and line information API surface
  - _Leverage: src/core/route_interface.cpp RouteUtility, src/sdk/utils/station-utils.ts_
  - _Requirements: 2.1, 2.3_

- [ ] 19. Add route creation and management methods to farert_api.dart
  - File: src/sdk/flutter/lib/src/api/farert_api.dart (continue from task 18)
  - Implement createRoute, createCalcRoute, calculateFare methods
  - Add route validation, parsing, and suggestion generation
  - Include memory management integration for object lifecycle
  - Purpose: Complete route building and calculation API surface
  - _Leverage: src/core/route_interface.cpp, src/sdk/flutter/lib/src/utils/memory_manager.dart_
  - _Requirements: 2.2, 5.4_

### Japanese Text Utilities

- [ ] 20. Create Japanese text utilities in lib/src/utils/japanese_text_utils.dart
  - File: src/sdk/flutter/lib/src/utils/japanese_text_utils.dart
  - Implement normalizeStationName, toHiragana, isValidJapaneseText methods
  - Add fuzzy matching for station names with suggestion generation
  - Include UTF-8 normalization and text encoding validation
  - Purpose: Handle Japanese text processing for station search and display
  - _Leverage: src/sdk/utils/text-utils.ts_
  - _Requirements: 2.3, 3.7_

### Input Validation and Security

- [ ] 21. Create input validator in lib/src/utils/input_validator.dart
  - File: src/sdk/flutter/lib/src/utils/input_validator.dart
  - Implement validation for station names, line IDs, route data, and API parameters
  - Add sanitization methods to prevent injection attacks
  - Include bounds checking and format validation for all input types
  - Purpose: Ensure API input safety and provide meaningful validation errors
  - _Leverage: src/sdk/security/input-validator.ts_
  - _Requirements: 2.6, 6.3_

### Caching and Performance

- [ ] 22. Create cache manager in lib/src/cache/cache_manager.dart
  - File: src/sdk/flutter/lib/src/cache/cache_manager.dart
  - Implement LRU cache for station data, line information, and fare calculations
  - Add cache expiration, memory pressure handling, and statistics tracking
  - Include cache warming for frequently accessed data
  - Purpose: Optimize performance with intelligent caching of API responses
  - _Leverage: src/sdk/cache/lru-cache.ts_
  - _Requirements: 5.3, 5.6_

### Widget Components Foundation

- [ ] 23. Create widget base class in lib/src/widgets/base_farert_widget.dart
  - File: src/sdk/flutter/lib/src/widgets/base_farert_widget.dart
  - Define BaseFarertWidget with common functionality and error handling
  - Add Japanese text support, theme integration, and accessibility features
  - Include loading states, error display, and debugging utilities
  - Purpose: Provide foundation for all Flutter widgets with consistent behavior
  - _Leverage: src/sdk/flutter/lib/src/utils/error_handler.dart_
  - _Requirements: 3.4, 3.6_

- [ ] 24. Create FareCalculatorWidget in lib/src/widgets/fare_calculator_widget.dart
  - File: src/sdk/flutter/lib/src/widgets/fare_calculator_widget.dart
  - Implement complete fare calculation interface with route building
  - Add station selection, route validation, and fare display
  - Include advanced options (long route, special rules) and error handling
  - Purpose: Provide complete fare calculation widget for Flutter applications
  - _Leverage: src/sdk/flutter/lib/src/widgets/base_farert_widget.dart, src/sdk/flutter/lib/src/api/farert_api.dart_
  - _Requirements: 3.1, 3.4, 3.5_

- [ ] 25. Create StationSearchWidget in lib/src/widgets/station_search_widget.dart
  - File: src/sdk/flutter/lib/src/widgets/station_search_widget.dart
  - Implement autocomplete search with fuzzy matching for Japanese station names
  - Add suggestion filtering, hiragana input support, and selection handling
  - Include loading states, empty states, and accessibility support
  - Purpose: Provide intuitive station search widget with Japanese text support
  - _Leverage: src/sdk/flutter/lib/src/widgets/base_farert_widget.dart, src/sdk/flutter/lib/src/utils/japanese_text_utils.dart_
  - _Requirements: 3.2, 3.7_

- [ ] 26. Create RouteDisplayWidget in lib/src/widgets/route_display_widget.dart
  - File: src/sdk/flutter/lib/src/widgets/route_display_widget.dart
  - Implement formatted route information display with line names and transfers
  - Add fare breakdown, transfer points, and responsive layout support
  - Include Japanese text formatting and accessibility features
  - Purpose: Provide comprehensive route visualization widget
  - _Leverage: src/sdk/flutter/lib/src/widgets/base_farert_widget.dart, src/sdk/flutter/lib/src/models/route_segment.dart_
  - _Requirements: 3.3, 3.5, 3.7_

### Main Library Integration

- [ ] 27. Update main library file in lib/farert_wasm.dart
  - File: src/sdk/flutter/lib/farert_wasm.dart
  - Export all public API classes, models, widgets, and exceptions
  - Add library documentation with usage examples and getting started guide
  - Include version information and compatibility notes
  - Purpose: Provide single import point for all plugin functionality
  - _Leverage: existing lib structure_
  - _Requirements: 7.1, 7.5_

### Native Platform Implementation (Android)

- [ ] 28. Create Android native implementation in android/src/main/kotlin/FarertWasmPlugin.kt
  - File: src/sdk/flutter/android/src/main/kotlin/com/farert/wasm/FarertWasmPlugin.kt
  - Implement MethodCallHandler for Android platform channel integration
  - Add WebAssembly module loading and JNI bridge setup
  - Include Android-specific memory management and error handling
  - Purpose: Enable Android platform integration through platform channels
  - _Leverage: existing Android platform patterns_
  - _Requirements: 1.2, 4.4_

- [ ] 29. Create iOS native implementation in ios/Classes/FarertWasmPlugin.swift
  - File: src/sdk/flutter/ios/Classes/FarertWasmPlugin.swift
  - Implement FlutterPlugin for iOS platform channel integration
  - Add WebAssembly module loading and native memory management
  - Include iOS-specific error handling and lifecycle management
  - Purpose: Enable iOS platform integration through platform channels
  - _Leverage: existing iOS platform patterns_
  - _Requirements: 1.2, 4.4_

### Unit Testing Foundation

- [ ] 30. Create test utilities in test/utils/test_utils.dart
  - File: src/sdk/flutter/test/utils/test_utils.dart
  - Implement mock platform implementations and test data generators
  - Add WebAssembly module mocking and memory management testing utilities
  - Include Japanese text test data and validation helpers
  - Purpose: Provide foundation for comprehensive unit testing
  - _Leverage: src/cli/test_exec_complete.ts test data_
  - _Requirements: 8.1, 8.6_

- [ ] 31. Create API unit tests in test/api/farert_api_test.dart
  - File: src/sdk/flutter/test/api/farert_api_test.dart
  - Write comprehensive tests for all API methods with success and error scenarios
  - Add parameter validation testing and platform abstraction verification
  - Include memory management and caching behavior tests
  - Purpose: Ensure API reliability and compatibility with C++ implementation
  - _Leverage: src/sdk/flutter/test/utils/test_utils.dart_
  - _Requirements: 8.1, 8.2_

- [ ] 32. Create wrapper class unit tests in test/wrappers/wrapper_test.dart
  - File: src/sdk/flutter/test/wrappers/wrapper_test.dart
  - Write tests for RouteListWrapper, RouteWrapper, CalcRouteWrapper classes
  - Add lifecycle management testing and inheritance relationship verification
  - Include memory cleanup and disposal testing
  - Purpose: Ensure object wrapper reliability and proper memory management
  - _Leverage: src/sdk/flutter/test/utils/test_utils.dart_
  - _Requirements: 8.1, 8.4_

- [ ] 33. Create model unit tests in test/models/model_test.dart
  - File: src/sdk/flutter/test/models/model_test.dart
  - Write tests for all data models (StationInfo, RouteItem, FareInfo, etc.)
  - Add serialization, validation, and equality operation testing
  - Include edge cases and boundary value testing
  - Purpose: Ensure data model reliability and serialization correctness
  - _Leverage: src/sdk/flutter/test/utils/test_utils.dart_
  - _Requirements: 8.1_

### Widget Testing

- [ ] 34. Create widget test utilities in test/widgets/widget_test_utils.dart
  - File: src/sdk/flutter/test/widgets/widget_test_utils.dart
  - Implement widget testing helpers and mock data providers
  - Add accessibility testing utilities and Japanese text input simulation
  - Include responsive layout testing and error state verification
  - Purpose: Provide foundation for comprehensive widget testing
  - _Leverage: Flutter testing framework_
  - _Requirements: 8.3, 3.6_

- [ ] 35. Create FareCalculatorWidget tests in test/widgets/fare_calculator_widget_test.dart
  - File: src/sdk/flutter/test/widgets/fare_calculator_widget_test.dart
  - Write widget tests for user interaction flows and error states
  - Add accessibility testing and responsive layout verification
  - Include fare calculation result display and validation testing
  - Purpose: Ensure fare calculator widget reliability and user experience
  - _Leverage: src/sdk/flutter/test/widgets/widget_test_utils.dart_
  - _Requirements: 8.3, 3.4_

- [ ] 36. Create StationSearchWidget tests in test/widgets/station_search_widget_test.dart
  - File: src/sdk/flutter/test/widgets/station_search_widget_test.dart
  - Write tests for autocomplete functionality and Japanese text input
  - Add fuzzy matching verification and suggestion display testing
  - Include accessibility and keyboard navigation testing
  - Purpose: Ensure station search widget reliability and Japanese text support
  - _Leverage: src/sdk/flutter/test/widgets/widget_test_utils.dart_
  - _Requirements: 8.3, 3.7_

### Integration and Compatibility Testing

- [ ] 37. Create C++ compatibility tests in test/integration/cpp_compatibility_test.dart
  - File: src/sdk/flutter/test/integration/cpp_compatibility_test.dart
  - Implement tests comparing Flutter results with C++ test suite output
  - Add fare calculation verification against testmain.cpp test cases
  - Include route building and validation compatibility testing
  - Purpose: Ensure 100% compatibility with original C++ implementation
  - _Leverage: src/cli/test_exec_complete.ts_
  - _Requirements: 8.2, 8.6_

- [ ] 38. Create platform integration tests in test/integration/platform_test.dart
  - File: src/sdk/flutter/test/integration/platform_test.dart
  - Write integration tests for all supported platforms (Android, iOS, Web, Desktop)
  - Add platform-specific initialization and error handling verification
  - Include memory management and performance testing across platforms
  - Purpose: Ensure consistent behavior across all Flutter platforms
  - _Leverage: src/sdk/flutter/test/utils/test_utils.dart_
  - _Requirements: 8.5, 4.1_

### Performance and Memory Testing

- [ ] 39. Create performance tests in test/performance/performance_test.dart
  - File: src/sdk/flutter/test/performance/performance_test.dart
  - Implement performance benchmarks for initialization and API response times
  - Add memory usage monitoring and leak detection testing
  - Include battery impact and CPU usage measurement on mobile platforms
  - Purpose: Validate performance requirements and optimize resource usage
  - _Leverage: existing performance testing patterns_
  - _Requirements: 8.4, 5.6_

### Documentation and Examples

- [ ] 40. Create example Flutter app in example/lib/main.dart
  - File: src/sdk/flutter/example/lib/main.dart
  - Implement comprehensive example app demonstrating all plugin features
  - Add real-world usage scenarios with actual station and line data
  - Include error handling examples and performance best practices
  - Purpose: Provide developers with practical implementation guidance
  - _Leverage: all implemented widgets and APIs_
  - _Requirements: 7.2, 7.5_

- [ ] 41. Create API documentation in lib/src/api/farert_api.dart
  - File: src/sdk/flutter/lib/src/api/farert_api.dart (add dartdoc comments)
  - Add comprehensive dartdoc comments with parameter descriptions and examples
  - Include usage examples for common scenarios and error handling patterns
  - Add migration guides and compatibility information
  - Purpose: Provide complete API reference with inline documentation
  - _Leverage: existing API implementation_
  - _Requirements: 7.1, 7.6_

### Final Integration and Validation

- [ ] 42. Update pubspec.yaml with final dependencies and metadata
  - File: src/sdk/flutter/pubspec.yaml
  - Add all required dependencies (plugin_platform_interface, ffi, js)
  - Update plugin metadata, version information, and platform support
  - Include development dependencies for testing and example app
  - Purpose: Complete plugin configuration for publication
  - _Leverage: existing pubspec.yaml_
  - _Requirements: 1.1, 7.6_

- [ ] 43. Create plugin registration in lib/src/platform/platform_registry.dart
  - File: src/sdk/flutter/lib/src/platform/platform_registry.dart
  - Implement automatic platform detection and registration
  - Add fallback mechanisms and platform capability detection
  - Include debug logging and platform-specific optimization selection
  - Purpose: Ensure seamless platform integration and optimal performance
  - _Leverage: src/sdk/utils/platform-detector.ts, all platform implementations_
  - _Requirements: 1.5, 4.2_