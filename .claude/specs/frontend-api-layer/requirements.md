# Requirements Document - Frontend API Layer

## Introduction

The Frontend API Layer project creates a comprehensive, framework-agnostic JavaScript/TypeScript SDK that wraps the existing WebAssembly APIs to provide an optimized developer experience for React, Vue, and other frontend frameworks. **This layer builds upon the completed C++ migration and object class implementation** while adding caching, type safety, reactive patterns, and framework-specific integration helpers.

The project focuses on creating modern frontend development patterns around the existing 45+ WebAssembly APIs, object classes, and JSON endpoints to enable rapid development of railway fare calculation applications **while maintaining complete compatibility with the original C++ implementation results**.

## Alignment with Product Vision

This frontend API layer directly enables the project's goal of supporting modern JavaScript/TypeScript applications by:

- Providing framework-agnostic SDK that works with React, Vue, Angular, and vanilla TypeScript
- Enabling rapid development of railway fare calculation UIs and mobile applications
- Supporting the transition from C++ desktop applications to modern web-based solutions
- Creating reusable components and patterns for railway-related UI development

## Implementation Context

### Existing API Foundation

- **39 WebAssembly APIs** already implemented in `src/farert_wasm.cpp` covering all core functionality
- **JSON APIs** for frontend consumption: `getFareInfoJson()`, `getCompanyAndPrefectsAsJson()`, `getCurrentRouteAsJson()`
- **5 Object Classes** (cRouteItem, cRoute, cRouteList, cCalcRoute, FareInfo) fully functional with WebAssembly bindings
- **UI Display APIs** implemented: `getStationKana()`, `getStationPrefecture()`, `getStationNameExtended()`
- **Search and utility APIs**: Station search, company/prefecture data, route building helpers

### Current Integration Status

- TypeScript interfaces defined in `src/cli/types.ts` but focused on CLI usage
- Test coverage exists in `src/cli/test_wasm_extended.ts` for frontend APIs (B群)
- WebAssembly module loading handled by `src/cli/wasm_loader.ts`
- No framework-specific integration helpers or SDKs currently exist

## Assumptions and Constraints

### Technical Constraints

- Must build upon existing WebAssembly APIs without modifying C++ code
- Framework integrations must be optional and not require specific framework versions
- Caching layer must not interfere with real-time fare calculation requirements
- TypeScript SDK must provide complete type safety for all 39 APIs and object classes
- Error handling must gracefully handle WebAssembly module loading failures and database issues

### Business Constraints

- Cannot break existing WebAssembly API consumers (CLI, test suites, object classes)
- Database operations must be completely hidden from TypeScript interface layer as specified in CLAUDE.md
- Must support both Node.js and browser environments seamlessly
- Framework-specific features must not create vendor lock-in for developers
- API layer must be lightweight and not significantly impact bundle size for frontend applications

## Requirements

### REQ-API-001: Core TypeScript SDK Foundation

**User Story:** As a frontend developer, I want a comprehensive TypeScript SDK that wraps all WebAssembly APIs, so that I can develop applications with full type safety and modern JavaScript patterns.

#### Core SDK Acceptance Criteria

1. WHEN developer imports the SDK THEN all 39 WebAssembly APIs SHALL be available through a single, well-organized TypeScript interface
2. WHEN calling any API method THEN SDK SHALL provide complete TypeScript types for parameters and return values with JSDoc documentation
3. IF WebAssembly module loading fails THEN SDK SHALL provide clear error messages and retry mechanisms with exponential backoff
4. WHEN working with object classes (cRoute, cCalcRoute, etc.) THEN SDK SHALL provide typed wrapper classes with lifecycle management
5. IF database connection issues occur THEN SDK SHALL detect problems and provide specific guidance for resolution

### REQ-API-002: Intelligent Caching and Performance Layer

**User Story:** As a frontend developer building responsive UIs, I want intelligent caching of station data and route calculations, so that my application performs well without redundant API calls.

#### Caching Layer Acceptance Criteria

1. WHEN requesting station information (names, kana, prefectures) THEN SDK SHALL cache results for 1 hour with automatic expiration
2. WHEN searching stations by keyword THEN SDK SHALL cache search results for 15 minutes with LRU eviction strategy
3. IF route calculations are requested for identical routes THEN SDK SHALL return cached FareInfo objects for 5 minutes
4. WHEN database reference data is accessed (companies, prefectures) THEN SDK SHALL cache for entire session duration
5. IF cache memory usage exceeds 50MB THEN SDK SHALL automatically purge oldest entries using LRU algorithm

### REQ-API-003: React Integration Hooks and Components

**User Story:** As a React developer, I want custom hooks and components for railway fare calculations, so that I can quickly build responsive UIs with proper state management.

#### React Integration Acceptance Criteria

1. WHEN using `useStationSearch(query)` hook THEN it SHALL provide debounced search results with loading states and error handling
2. WHEN using `useFareCalculation(route)` hook THEN it SHALL automatically calculate fares when route changes with proper dependency tracking
3. IF using `<StationSelector>` component THEN it SHALL provide autocomplete functionality with Japanese text support and accessibility features
4. WHEN using `<RouteBuilder>` component THEN it SHALL provide drag-and-drop interface for building multi-segment routes with validation
5. IF errors occur in any hook THEN React error boundaries SHALL catch and display user-friendly error messages

### REQ-API-004: Vue Composition API Integration

**User Story:** As a Vue developer, I want composables that integrate with Vue's reactivity system, so that I can build reactive railway applications with minimal boilerplate.

#### Vue Integration Acceptance Criteria

1. WHEN using `useStationData(stationId)` composable THEN it SHALL provide reactive refs that update when stationId changes
2. WHEN using `useRouteCalculator()` composable THEN it SHALL integrate with Vue's reactivity system for automatic recalculation
3. IF using `useFareHistory()` composable THEN it SHALL maintain reactive history of fare calculations with undo/redo functionality
4. WHEN building forms with `useStationValidator()` THEN it SHALL provide reactive validation with Japanese text support
5. IF WebAssembly loading state changes THEN all composables SHALL update their loading states reactively

### REQ-API-005: Framework-Agnostic Utilities and Helpers

**User Story:** As a developer using any JavaScript framework or vanilla JS, I want utility functions and helpers for common railway data operations, so that I can integrate fare calculations regardless of my framework choice.

#### Utilities Acceptance Criteria

1. WHEN formatting station names for display THEN utility functions SHALL handle Japanese characters correctly with proper fallbacks
2. WHEN validating route connections THEN helper functions SHALL provide detailed validation results with suggestions for fixes
3. IF building route strings programmatically THEN utilities SHALL support fluent API patterns for complex route construction
4. WHEN handling fare calculation results THEN formatters SHALL provide localized currency display and breakdown information
5. IF integrating with non-React/Vue frameworks THEN utilities SHALL work in Angular, Svelte, or vanilla JavaScript environments

### REQ-API-006: Development Experience and Documentation

**User Story:** As a developer learning to use the railway APIs, I want comprehensive documentation with examples, so that I can quickly understand and implement fare calculation features.

#### Documentation Acceptance Criteria

1. WHEN developer accesses SDK documentation THEN it SHALL include complete API reference with examples for React, Vue, and vanilla JS
2. WHEN learning framework integration THEN guides SHALL provide step-by-step tutorials for common use cases with realistic Japanese station data
3. IF developer encounters integration issues THEN troubleshooting guides SHALL cover common problems with specific solutions
4. WHEN exploring advanced features THEN documentation SHALL include examples for multi-company routes, special fare rules, and complex scenarios
5. IF seeking performance guidance THEN documentation SHALL provide best practices for caching, bundle optimization, and memory management

---

## Non-Functional Requirements

### Performance

- SDK initialization SHALL complete within 2 seconds in browser environments on 3G connections
- Cached API calls SHALL respond within 10ms for station lookups and reference data
- Route calculations SHALL complete within 500ms for routes up to 10 stations including network overhead
- Bundle size for framework integrations SHALL not exceed 150KB gzipped including all dependencies

### Security

- SDK SHALL not expose WebAssembly memory directly to prevent unauthorized access to calculation internals
- API keys or authentication tokens SHALL be handled securely without logging sensitive information
- Error messages SHALL not reveal internal C++ implementation details or database schema information
- Input validation SHALL prevent injection attacks through station names or route parameters

### Reliability

- SDK SHALL handle WebAssembly module crashes gracefully without affecting the entire application
- Network failures SHALL trigger automatic retry with exponential backoff up to 3 attempts
- Memory leaks SHALL be prevented through proper cleanup of WebAssembly resources and event listeners
- Framework integrations SHALL not interfere with framework-specific development tools or hot reloading

### Usability

- TypeScript IntelliSense SHALL provide helpful autocomplete for all API methods with parameter hints
- Error messages SHALL be developer-friendly with actionable suggestions and links to documentation
- Japanese text SHALL be handled correctly across all browsers with proper encoding and display
- Framework integrations SHALL follow each framework's conventions and best practices consistently