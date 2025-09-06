# Requirements Document - Frontend API Layer (Svelte Focus)

## Introduction

The Frontend API Layer project creates a comprehensive, Svelte-first JavaScript/TypeScript SDK that wraps the existing WebAssembly APIs to provide an optimized developer experience for Svelte/SvelteKit applications with secondary support for other frontend frameworks. **This layer builds upon the completed C++ migration and object class implementation** while adding caching, type safety, reactive patterns, and Svelte-specific integration helpers.

The project focuses on creating modern Svelte development patterns around the existing 45+ WebAssembly APIs, object classes, and JSON endpoints to enable rapid development of railway fare calculation applications **while maintaining complete compatibility with the original C++ implementation results**.

## Alignment with Product Vision

This frontend API layer directly enables the project's goal of supporting modern JavaScript/TypeScript applications by:

- Providing Svelte-first SDK with reactive stores and components
- Enabling rapid development of railway fare calculation UIs and SvelteKit applications  
- Supporting the transition from C++ desktop applications to modern web-based solutions
- Creating reusable Svelte components and patterns for railway-related UI development
- Offering framework-agnostic utilities for React, Vue, Angular as secondary targets

## Implementation Context

### Existing API Foundation

- **39+ WebAssembly APIs** already implemented in `src/farert_wasm.cpp` covering all core functionality
- **JSON APIs** for frontend consumption: `getFareInfoJson()`, `getCompanyAndPrefectsAsJson()`, `getCurrentRouteAsJson()`
- **6 Object Classes** (cRouteItem, cRoute, cRouteList, cCalcRoute, FareInfo, cRouteFlag) fully functional with WebAssembly bindings
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

1. WHEN developer imports the SDK THEN all 39+ WebAssembly APIs SHALL be available through a single, well-organized TypeScript interface
2. WHEN calling any API method THEN SDK SHALL provide complete TypeScript types for parameters and return values with JSDoc documentation
3. IF WebAssembly module loading fails THEN SDK SHALL provide clear error messages and retry mechanisms with exponential backoff
4. WHEN working with object classes (cRoute, cCalcRoute, cRouteFlag, etc.) THEN SDK SHALL provide typed wrapper classes with lifecycle management
5. IF database connection issues occur THEN SDK SHALL detect problems and provide specific guidance for resolution

### REQ-API-002: Intelligent Caching and Performance Layer

**User Story:** As a frontend developer building responsive UIs, I want intelligent caching of station data and route calculations, so that my application performs well without redundant API calls.

#### Caching Layer Acceptance Criteria

1. WHEN requesting station information (names, kana, prefectures) THEN SDK SHALL cache results for 1 hour with automatic expiration
2. WHEN searching stations by keyword THEN SDK SHALL cache search results for 15 minutes with LRU eviction strategy
3. IF route calculations are requested for identical routes THEN SDK SHALL return cached FareInfo objects for 5 minutes
4. WHEN database reference data is accessed (companies, prefectures) THEN SDK SHALL cache for entire session duration
5. IF cache memory usage exceeds 50MB THEN SDK SHALL automatically purge oldest entries using LRU algorithm

### REQ-API-003: Svelte Reactive Stores and Components

**User Story:** As a Svelte developer, I want reactive stores and components for railway fare calculations, so that I can quickly build responsive UIs with Svelte's reactivity system.

#### Svelte Integration Acceptance Criteria

1. WHEN using `stationSearchStore(query)` THEN it SHALL provide debounced search results with reactive loading states and error handling
2. WHEN using `fareCalculationStore` THEN it SHALL automatically calculate fares when route changes with proper Svelte reactivity
3. IF using `<StationSelector>` component THEN it SHALL provide autocomplete functionality with Japanese text support and accessibility features  
4. WHEN using `<RouteBuilder>` component THEN it SHALL provide drag-and-drop interface for building multi-segment routes with validation
5. IF errors occur in any store THEN Svelte error boundaries SHALL catch and display user-friendly error messages

### REQ-API-004: SvelteKit SSR and Hydration Support

**User Story:** As a SvelteKit developer, I want server-side rendering support for railway data, so that I can build SEO-friendly applications with fast initial loading.

#### SvelteKit Integration Acceptance Criteria

1. WHEN using `load` functions THEN SDK SHALL provide server-side station data loading with proper hydration
2. WHEN building SvelteKit pages THEN stores SHALL properly serialize/deserialize state during SSR
3. IF using SvelteKit routing THEN route calculations SHALL work in both server and client environments
4. WHEN deploying to static adapters THEN SDK SHALL support static site generation for reference data
5. IF WebAssembly loading occurs during SSR THEN proper fallbacks SHALL be provided for Node.js environments

### REQ-API-005: Framework-Agnostic Utilities and Helpers

**User Story:** As a developer using any JavaScript framework or vanilla JS, I want utility functions and helpers for common railway data operations, so that I can integrate fare calculations regardless of my framework choice.

#### Utilities Acceptance Criteria

1. WHEN formatting station names for display THEN utility functions SHALL handle Japanese characters correctly with proper fallbacks
2. WHEN validating route connections THEN helper functions SHALL provide detailed validation results with suggestions for fixes
3. IF building route strings programmatically THEN utilities SHALL support fluent API patterns for complex route construction
4. WHEN handling fare calculation results THEN formatters SHALL provide localized currency display and breakdown information
5. IF integrating with non-Svelte frameworks THEN utilities SHALL work in React, Vue, Angular, or vanilla JavaScript environments

### REQ-API-006: Development Experience and Documentation

**User Story:** As a developer learning to use the railway APIs, I want comprehensive documentation with examples, so that I can quickly understand and implement fare calculation features.

#### Documentation Acceptance Criteria

1. WHEN developer accesses SDK documentation THEN it SHALL include complete API reference with examples for Svelte, SvelteKit, and vanilla JS
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