# Implementation Plan

## Task Overview
Complete the 6-class WebAssembly object system (cRouteList, cRoute, cCalcRoute, FareInfo, cRouteItem, cRouteFlag) with full inheritance hierarchy, missing class implementations, enhanced array operations, comprehensive error handling, and Android Kotlin compatibility. This implementation provides modern TypeScript interfaces while maintaining 100% backward compatibility with existing procedural APIs and identical results to the original C++ implementation.

## Steering Document Compliance
Tasks follow CLAUDE.md architecture patterns with inheritance hierarchy `cCalcRoute < cRoute < cRouteList`, maintain complete backward compatibility with 39 existing procedural APIs, integrate with existing CLI test infrastructure in `src/cli/test_wasm_extended.ts`, and ensure Android Kotlin compatibility as specified in the requirements. Database operations remain completely hidden at the interface layer, following the established WebAssembly architecture.

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
- Reference requirements using: `_Requirements: REQ-OBJ-XXX_`
- Reference existing code to leverage using: `_Leverage: path/to/file.ts, path/to/component.tsx_`
- Focus only on coding tasks (no deployment, user testing, etc.)
- **Avoid broad terms**: No "system", "integration", "complete" in task titles

## Tasks

### Phase 1: C++ Wrapper Classes Foundation

- [ ] 1. Create RouteItemWrapper class in src/include/route_interface.h
  - File: src/include/route_interface.h (modify existing)
  - Add RouteItemWrapper class with stationId, lineId, flag properties
  - Implement constructors, copy constructor, assignment operator
  - Add property accessors matching RouteItem C++ class from alpdb.h
  - _Requirements: REQ-OBJ-003_
  - _Leverage: existing FareInfoData structure in route_interface.h_

- [ ] 2. Create RouteFlagWrapper class in src/include/route_interface.h
  - File: src/include/route_interface.h (modify existing)
  - Add RouteFlagWrapper class exposing all RouteFlag public members
  - Implement 30+ boolean properties (no_rule, rule88, rule69, etc.)
  - Add 4 numeric properties (rule86or87, rule115, urban_neerest, osakaKanPass)
  - _Requirements: REQ-OBJ-003_
  - _Leverage: RouteFlag class definition in src/core/alpdb.h lines 247-469_

- [ ] 3. Add RouteItemWrapper methods in src/include/route_interface.h  
  - File: src/include/route_interface.h (continue from task 1)
  - Implement isValid(), getDisplayName(), refresh() methods
  - Add equality operators (==, is_equal) matching C++ RouteItem
  - Add property validation and bounds checking
  - _Requirements: REQ-OBJ-003, REQ-OBJ-002_
  - _Leverage: RouteItem class methods in src/core/alpdb.h lines 491-528_

- [ ] 4. Add RouteFlagWrapper management methods in src/include/route_interface.h
  - File: src/include/route_interface.h (continue from task 2)
  - Implement 15+ flag management methods (setLongRoute, setStartAsCity, etc.)
  - Add availability check methods (isAvailable*, isEnable*)
  - Add clear(), setAnotherRouteFlag() methods from C++ RouteFlag
  - _Requirements: REQ-OBJ-003, REQ-OBJ-005_
  - _Leverage: RouteFlag public methods in src/core/alpdb.h lines 351-419_

- [ ] 5. Implement RouteItemWrapper class in src/core/route_interface.cpp
  - File: src/core/route_interface.cpp (modify existing)
  - Implement all RouteItemWrapper constructors and methods
  - Add proper initialization and validation logic
  - Implement property accessors with bounds checking
  - _Requirements: REQ-OBJ-003, REQ-OBJ-002_
  - _Leverage: existing RouteWrapper implementation patterns in route_interface.cpp_

- [ ] 6. Implement RouteFlagWrapper class in src/core/route_interface.cpp
  - File: src/core/route_interface.cpp (modify existing)
  - Implement all RouteFlagWrapper constructors and management methods  
  - Add proper flag state management and validation
  - Implement all availability and enable check methods
  - _Requirements: REQ-OBJ-003, REQ-OBJ-005_
  - _Leverage: existing CalcRouteWrapper implementation patterns in route_interface.cpp_

### Phase 2: Enhanced Array Operations for cRouteList

- [ ] 7. Add array operation methods to RouteListWrapper in src/include/route_interface.h
  - File: src/include/route_interface.h (modify existing RouteListWrapper)
  - Add at(index), count(), remove(index), removeAll(), insert(), assign() methods
  - Add bounds checking and error validation for array operations
  - Add getRouteFlag(), setRouteFlag() for route flag management
  - _Requirements: REQ-OBJ-003_
  - _Leverage: existing RouteListWrapper structure lines 212-224_

- [ ] 8. Implement enhanced array operations in src/core/route_interface.cpp
  - File: src/core/route_interface.cpp (modify existing RouteListWrapper implementation)
  - Implement all array methods with proper bounds checking
  - Add RouteItemWrapper access via at() method with type safety
  - Implement explicit array manipulation replacing C++ operator overloading
  - _Requirements: REQ-OBJ-003, REQ-OBJ-002_
  - _Leverage: existing RouteWrapper array access patterns_

- [ ] 9. Add RouteItemWrapper array access to RouteWrapper class
  - File: src/include/route_interface.h (modify existing RouteWrapper)
  - Enhance getRouteItem() to return RouteItemWrapper instead of RouteItem*
  - Add array-style access methods compatible with cRouteList
  - Add route item manipulation methods (insertItem, removeItem)
  - _Requirements: REQ-OBJ-003, REQ-OBJ-004_
  - _Leverage: existing getRouteItem method in RouteWrapper lines 198_

### Phase 3: WebAssembly Bindings Integration

- [ ] 10. Add cRouteItem WebAssembly bindings in src/farert_wasm.cpp
  - File: src/farert_wasm.cpp (modify existing, add after line 611)
  - Add emscripten class binding for RouteItemWrapper as cRouteItem
  - Expose all properties (stationId, lineId, flag) and methods
  - Add constructors and property accessors for JavaScript access
  - _Requirements: REQ-OBJ-003_
  - _Leverage: existing FareInfoData bindings pattern lines 584-611_

- [ ] 11. Add cRouteFlag WebAssembly bindings in src/farert_wasm.cpp
  - File: src/farert_wasm.cpp (modify existing, add after cRouteItem)
  - Add emscripten class binding for RouteFlagWrapper as cRouteFlag
  - Expose all 30+ boolean properties and 4 numeric properties
  - Add all flag management methods for JavaScript access
  - _Requirements: REQ-OBJ-003_
  - _Leverage: existing cRoute bindings pattern lines 541-559_

- [ ] 12. Enhance cRouteList bindings with array operations in src/farert_wasm.cpp
  - File: src/farert_wasm.cpp (modify existing cRouteList bindings lines 562-566)
  - Add array operation methods (at, count, remove, removeAll, insert, assign)
  - Add route flag access methods (getRouteFlag, setRouteFlag)
  - Add enhanced property access with error handling
  - _Requirements: REQ-OBJ-003_
  - _Leverage: existing cRouteList binding structure lines 562-566_

- [ ] 13. Add RouteItemWrapper access to cRoute bindings in src/farert_wasm.cpp
  - File: src/farert_wasm.cpp (modify existing cRoute bindings lines 541-559)
  - Add getRouteItem method returning RouteItemWrapper
  - Add route item manipulation methods for enhanced route building
  - Ensure inheritance compatibility with cRouteList operations
  - _Requirements: REQ-OBJ-003, REQ-OBJ-004_
  - _Leverage: existing cRoute method bindings pattern_

### Phase 4: TypeScript Interface Enhancement

- [ ] 14. Update RouteItemWrapper interface in src/cli/types.ts
  - File: src/cli/types.ts (modify existing RouteItemWrapper lines 61-65)
  - Add fare, salesKm, indexOfAggregate properties per CLAUDE.md spec
  - Add isValid(), getDisplayName() methods
  - Add complete type annotations and JSDoc documentation
  - _Requirements: REQ-OBJ-001, REQ-OBJ-003_
  - _Leverage: existing interface structure in types.ts_

- [ ] 15. Complete RouteFlagWrapper interface in src/cli/types.ts
  - File: src/cli/types.ts (modify existing RouteFlagWrapper lines 67-127)
  - Add missing boolean properties (osakakan_1dir, osakakan_2dir, osakakan_detour)
  - Add all availability check methods (isAvailableRule*, isEnable*)  
  - Add complete method signatures with parameter types and return types
  - _Requirements: REQ-OBJ-001, REQ-OBJ-003_
  - _Leverage: existing RouteFlagWrapper interface structure_

- [x] 16. Essential RouteList operations for cRouteList in src/cli/types.ts
  - File: src/cli/types.ts (modify existing RouteListWrapper)
  - Add removeAll(): void method for clearing all route segments
  - Add assign(obj: RouteListWrapper): void method for copying route data
  - Remove unnecessary array-like operations (at, count, remove, insert)
  - _Requirements: REQ-OBJ-001, REQ-OBJ-003_
  - _Leverage: existing RouteListWrapper interface_

- [ ] 17. Add enhanced error handling interfaces in src/cli/types.ts
  - File: src/cli/types.ts (add new interfaces after line 187)
  - Add ValidationResult interface with error codes and suggestions
  - Add RouteErrorCode enum with ROUTE_ERR_001-099 codes
  - Add enhanced error classes for route construction and calculation
  - _Requirements: REQ-OBJ-002, REQ-OBJ-001_
  - _Leverage: existing error classes CLIError, WebAssemblyLoadError_

### Phase 5: Comprehensive Error Handling System

- [ ] 18. Create error handling utilities in src/cli/error_handling.ts
  - File: src/cli/error_handling.ts (create new)
  - Implement RouteConstructionError, RouteCalculationError classes
  - Add fuzzy matching for invalid station names with 3 suggestions
  - Add error code classification and user-friendly messages
  - _Requirements: REQ-OBJ-002_
  - _Leverage: RouteUtility.keyMatchStations method from route_interface.h_

- [ ] 19. Add validation methods to RouteWrapper class in src/core/route_interface.cpp
  - File: src/core/route_interface.cpp (modify existing RouteWrapper)
  - Add validateRoute() method returning ValidationResult
  - Add input validation for setupRoute() with detailed error reporting
  - Add station name fuzzy matching for setupRoute errors
  - _Requirements: REQ-OBJ-002, REQ-OBJ-004_
  - _Leverage: existing RouteUtility station lookup methods_

- [ ] 20. Enhance FareInfoData with error details in src/include/route_interface.h
  - File: src/include/route_interface.h (modify existing FareInfoData)
  - Add errorCode, errorMessage, suggestedStations properties
  - Add enhanced display methods (getFormattedFare, getFareBreakdown)
  - Add compare() method for fare comparison
  - _Requirements: REQ-OBJ-002, REQ-OBJ-006_
  - _Leverage: existing FareInfoData structure lines 13-152_

- [ ] 21. Implement enhanced error handling in calcFare methods
  - File: src/core/route_interface.cpp (modify CalcRouteWrapper::calcFareObject)
  - Add detailed error information to FareInfoData on calculation failures
  - Add specific error codes for different failure types (-2, -3, etc.)
  - Preserve C++ error behavior while adding descriptive messages
  - _Requirements: REQ-OBJ-002, REQ-OBJ-006_
  - _Leverage: existing calcFareObject implementation_

### Phase 6: Android Kotlin Compatibility

- [ ] 22. Create Android compatibility validation in src/cli/android_compat.ts
  - File: src/cli/android_compat.ts (create new)
  - Implement interfaces matching Android FareInfo.kt structure
  - Add RouteHelper.kt compatibility layer for utility methods
  - Add data serialization compatibility tests
  - _Requirements: REQ-OBJ-005_
  - _Leverage: existing FareInfoData interface structure_

- [ ] 23. Add Android-compatible method signatures in src/cli/types.ts
  - File: src/cli/types.ts (modify existing interfaces)
  - Add method name aliases for Android Kotlin compatibility
  - Add data type mappings (TypeScript number -> Kotlin Int/Long)
  - Add serialization helper methods for cross-platform data exchange
  - _Requirements: REQ-OBJ-005_
  - _Leverage: existing FareInfoData and RouteWrapper interfaces_

- [ ] 24. Implement Android-compatible utility methods in RouteUtility class
  - File: src/core/route_interface.cpp (modify existing RouteUtility methods)
  - Add getJRCompanys(), getPrefects() methods matching RouteHelper.kt
  - Add getKanaFromStationId(), companyOrPrefectName() methods
  - Exclude storage methods (saveParam, readParam) as specified in requirements
  - _Requirements: REQ-OBJ-005_
  - _Leverage: existing RouteUtility implementation in route_interface.cpp_

### Phase 7: Memory Management and Object Lifecycle

- [ ] 25. Add object lifecycle management in src/include/route_interface.h
  - File: src/include/route_interface.h (modify all wrapper classes)
  - Add proper destructors with RAII cleanup for all wrapper classes
  - Add reference counting for shared route data
  - Add memory safety validation methods
  - _Requirements: REQ-OBJ-007_
  - _Leverage: existing destructor patterns in RouteWrapper, CalcRouteWrapper_

- [ ] 26. Implement WebAssembly memory management in src/farert_wasm.cpp
  - File: src/farert_wasm.cpp (add memory management section after bindings)
  - Add proper cleanup methods for long-running applications
  - Implement garbage collection callbacks for object destruction
  - Add memory leak prevention for repeated object creation
  - _Requirements: REQ-OBJ-007_
  - _Leverage: existing WebAssembly binding patterns_

- [ ] 27. Add object state validation in src/core/route_interface.cpp
  - File: src/core/route_interface.cpp (modify all wrapper class methods)
  - Add use-after-destruction protection for all object methods
  - Add clear error messages for invalid object state access
  - Implement graceful error handling for WebAssembly module reloading
  - _Requirements: REQ-OBJ-007_
  - _Leverage: existing error handling patterns in route_interface.cpp_

### Phase 8: Comprehensive Testing Implementation

- [ ] 28. Create cRouteItem unit tests in src/cli/test_route_item.ts
  - File: src/cli/test_route_item.ts (create new)
  - Write tests for property access, validation, and lifecycle
  - Test integration with cRouteList array operations
  - Add memory management and error handling tests
  - _Requirements: REQ-OBJ-003, REQ-OBJ-007_
  - _Leverage: existing test patterns in test_wasm_extended.ts_

- [ ] 29. Create cRouteFlag unit tests in src/cli/test_route_flag.ts  
  - File: src/cli/test_route_flag.ts (create new)
  - Write tests for all flag properties and management methods
  - Test availability and enable check methods functionality
  - Add flag state consistency and validation tests
  - _Requirements: REQ-OBJ-003_
  - _Leverage: existing test patterns in test_wasm_extended.ts_

- [ ] 30. Create enhanced array operations tests in src/cli/test_array_ops.ts
  - File: src/cli/test_array_ops.ts (create new)
  - Write tests for at(), count(), remove(), insert(), assign() methods
  - Test bounds checking and error handling for array operations
  - Add performance tests with large route collections
  - _Requirements: REQ-OBJ-003, REQ-OBJ-002_
  - _Leverage: existing array operation patterns in test_wasm_extended.ts_

- [ ] 31. Create error handling system tests in src/cli/test_error_handling.ts
  - File: src/cli/test_error_handling.ts (create new)
  - Write tests for all error codes ROUTE_ERR_001-099  
  - Test fuzzy matching suggestions for invalid station names
  - Add error recovery and object state consistency tests
  - _Requirements: REQ-OBJ-002_
  - _Leverage: existing error testing patterns in test_wasm_extended.ts_

- [ ] 32. Create Android compatibility tests in src/cli/test_android_compat.ts
  - File: src/cli/test_android_compat.ts (create new)
  - Write tests for TypeScript-Kotlin data structure compatibility
  - Test method name consistency and parameter types
  - Add data serialization compatibility validation
  - _Requirements: REQ-OBJ-005_
  - _Leverage: android_compat.ts compatibility layer_

- [ ] 33. Add object lifecycle tests in src/cli/test_lifecycle.ts
  - File: src/cli/test_lifecycle.ts (create new)
  - Write tests for memory management and object cleanup
  - Test repeated object creation without memory leaks
  - Add WebAssembly heap monitoring and validation
  - _Requirements: REQ-OBJ-007_
  - _Leverage: existing memory management patterns_

- [ ] 34. Integrate all tests into main test suite in src/cli/test_wasm_extended.ts
  - File: src/cli/test_wasm_extended.ts (modify existing)
  - Add imports and execution of all new test modules
  - Add comprehensive integration testing scenarios  
  - Add performance benchmarking for object vs procedural API
  - _Requirements: All REQ-OBJ-*_
  - _Leverage: existing test execution framework in test_wasm_extended.ts_

### Phase 9: Documentation and Examples

- [ ] 35. Create object class usage examples in src/cli/examples/
  - File: src/cli/examples/object_usage.ts (create new file and directory)
  - Create realistic Japanese route examples using object classes
  - Show inheritance hierarchy usage (cCalcRoute extends cRoute)
  - Demonstrate error handling and recovery patterns
  - _Requirements: REQ-OBJ-008_
  - _Leverage: existing CLI patterns in main.ts_

- [ ] 36. Add comprehensive JSDoc documentation to all interfaces
  - File: src/cli/types.ts (modify all interfaces)
  - Add detailed JSDoc comments for all object class interfaces
  - Include usage examples and parameter descriptions
  - Add cross-references between related classes and methods
  - _Requirements: REQ-OBJ-008, REQ-OBJ-001_
  - _Leverage: existing JSDoc patterns in types.ts_

- [ ] 37. Create integration examples for React/Vue frameworks
  - File: src/cli/examples/framework_integration.ts (create new)
  - Show object class usage in React hooks and Vue composables
  - Demonstrate state management and lifecycle integration
  - Add error boundary and loading state examples
  - _Requirements: REQ-OBJ-008_
  - _Leverage: existing TypeScript patterns and object interfaces_

### Phase 10: Final Integration and Validation

- [ ] 38. Run comprehensive compatibility validation
  - Files: src/cli/test_exec_complete.ts (modify to include object class tests)
  - Validate all object class results match procedural API results
  - Test CLI compatibility with existing test suite execution
  - Verify no regression in existing procedural API functionality
  - _Requirements: All REQ-OBJ-*, backward compatibility_
  - _Leverage: existing CLI test execution in test_exec_complete.ts_

- [ ] 39. Final code cleanup and optimization
  - Files: All modified files in src/include/, src/core/, src/cli/
  - Remove debug code and optimize performance hotpaths
  - Ensure consistent code style and documentation
  - Add final validation that all 6 object classes work correctly
  - _Requirements: All REQ-OBJ-*_
  - _Leverage: Complete implementation from all previous tasks_