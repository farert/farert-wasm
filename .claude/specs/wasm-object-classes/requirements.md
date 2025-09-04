# 要件定義書 - WASMオブジェクトクラス実装

## はじめに

WASMオブジェクトクラス実装プロジェクトは、鉄道運賃計算システムへのオブジェクト指向アクセスを提供する6つのコアオブジェクトクラス（cRouteList, cRoute, cCalcRoute, FareInfo, cRouteItem, cRouteFlag）の既存部分実装を完成します。このプロジェクトは、現代的TypeScriptインターフェースを提供しながら、元のC++実装との**忠実な移植と100%互換性**に焦点を当てています。

**主要目的**: 不足している`cRouteItem`クラスと新規追加の`cRouteFlag`クラスを完成し、既存の全手続き型APIとの**完全な後方互換性**を維持し、元のC++システムと**同一の結果**を出力しながら配列操作を強化する。

このプロジェクトは継承階層 `cCalcRoute < cRoute < cRouteList` を実装します。cRouteListはcRouteItem配列を含んだ経路オブジェクトで、cRouteFlagはcRouteListから得られる経路オプション（運賃計算ルール設定）として、元のC++コードベースで確立された正確な動作パターンに従います。

この実装は、ステアリング文書で指定されているように、**完全なCLI移植**（`testmain.cpp` → TypeScript）と**同一のテスト結果**という主要目標をサポートします。

## 製品ビジョンとの整合性

この機能は、手続き型C++ APIから現代的なオブジェクト指向JavaScript/TypeScript使用パターンへのプロジェクトの移行を直接サポートします。オブジェクトクラスは以下として機能します：

- 現代的JavaScript/TypeScriptアプリケーションの主要インターフェース
- 複雑なC++鉄道計算ロジックの明確な抽象化層
- 一般的な統合エラーを防ぐ型安全オブジェクト
- CLAUDE.mdで記述されているReact/Vueフロントエンドアプリケーションの基盤

## 実装コンテキスト

### 既存コード統合

- オブジェクトクラスは`src/farert_wasm.cpp`（540-611行）の既存WebAssemblyバインディングを基盤とする
- TypeScriptインターフェースは`src/cli/types.ts`の現在の定義を拡張
- `src/cli/test_exec.ts`と`src/cli/test_wasm_extended.ts`の既存CLIテストスイートとの統合
- `src/core/route_interface.h`と`src/core/route_interface.cpp`のC++ラッパークラスが基盤を提供
- `route_interface.h`（13-163行）のFareInfoData構造がTypeScript FareInfoインターフェースにマップ

### 現在の実装状況

- **cRouteList (RouteListWrapper)**: 基本機能を持つベースコンテナクラス
- **cRoute (RouteWrapper)**: setupRoute, addRoute, getRouteCountを含む15+メソッド実装済み、cRouteListから継承
- **cCalcRoute (CalcRouteWrapper)**: calcFare、経路フラグ、継承メソッドで完成、cRouteから継承
- **FareInfo (FareInfoData)**: 25+プロパティと株式割引メソッド完全実装済み
- **cRouteItem**: 個別経路要素クラス（実装要）
- **cRouteFlag**: 経路フラグ管理クラス（新規追加、C++全publicメンバー公開）

### Inheritance Hierarchy (CLAUDE.md Specified)
```
cCalcRoute (most derived)
    ↳ cRoute 
        ↳ cRouteList (base class)
            ↳ contains array of cRouteItem
```

## 前提条件と制約

### 技術制約

- 既存WebAssemblyバインディングと全39手続き型API（CLAUDE.mdで指定）との後方互換性維持必須
- TypeScriptインターフェースはC++コード変更なしでC++実装機能を正確に反映必須
- オブジェクトライフサイクル管理は長時間実行アプリケーションでのメモリリーク防止必須
- メソッドシグネチャはCLIテストスイートの既存テスト実装との一貫性維持必須
- FareInfoオブジェクトプロパティは元のC++ FARE_INFO構造と完全一致（1:1マッピング）必須
- エラーハンドリングは手続き型APIコンシューマーへの既存エラー伝播を破綻させない必須
- FareInfo.ktとRouteHelper.kt統合でのAndroid Kotlin互換性提供必須
- 配列操作メソッドはC++演算子オーバーロードを明示的メソッド呼び出しで置換必須
- データベース操作はTypeScriptインターフェース層から完全隠蔽必須

### Business Constraints

- All existing functionality must continue to work without modification or performance degradation
- New features must integrate seamlessly with existing CLI and test infrastructure
- Documentation must be comprehensive enough for frontend developers without C++ knowledge
- Enhancement timeline must not interfere with CLI interface specification development

## Requirements

### REQ-OBJ-001: Enhanced Type Safety and Interface Completion

**User Story:** As a TypeScript developer, I want complete and accurate type definitions for all object classes, so that I can develop safely with full IDE support and compile-time error checking.

#### Acceptance Criteria

1. WHEN developer imports object classes in TypeScript THEN all methods SHALL have complete type annotations with parameter types and return types
2. WHEN developer accesses FareInfo properties THEN TypeScript SHALL provide autocomplete for all 25+ properties with correct data types
3. IF developer passes invalid parameters to object methods THEN TypeScript compiler SHALL show specific error messages indicating expected types
4. WHEN developer uses object inheritance (cCalcRoute extends cRoute) THEN TypeScript SHALL correctly recognize inherited methods and properties
5. IF optional parameters are provided THEN TypeScript interfaces SHALL clearly indicate which parameters are required vs optional

### REQ-OBJ-002: C++ Compatible Error Handling 

**User Story:** As a developer migrating from C++ CLI tools, I want object classes that handle errors identically to the original C++ implementation, so that results are consistent across platforms.

#### Error Handling Acceptance Criteria

1. WHEN invalid station names are provided to setupRoute() THEN object SHALL return the same error codes and behavior as original C++ `addRoute()` and `addStation()` functions
2. WHEN calcFare() encounters calculation errors THEN FareInfo object SHALL contain identical error information as original C++ FARE_INFO structure with result codes: -2 (empty route), -3 (calculation failure)
3. IF route construction fails THEN cRoute SHALL replicate exact error handling behavior from original C++ Route class methods
4. WHEN memory allocation fails THEN objects SHALL handle failures identically to original C++ memory management patterns
5. IF database connectivity issues occur THEN objects SHALL replicate original C++ database error handling without adding new error types or messages

### REQ-OBJ-003: cRouteItem Class and Array Operations (CLAUDE.md Required)

**User Story:** As a developer working with route collections, I want a complete cRouteItem class and array operation methods, so that I can manipulate route lists using explicit method calls instead of C++ operator overloading.

#### cRouteItem and Array Acceptance Criteria

1. WHEN working with cRouteItem objects THEN they SHALL provide access to fare, salesKm, and indexOfAggregate properties as specified in CLAUDE.md
2. WHEN accessing cRouteList elements THEN `routeList.at(index: number)` SHALL return individual cRouteItem objects with proper type safety
3. IF manipulating route collections THEN cRouteList SHALL provide `remove(index: number): cRouteItem`, `removeAll(): void`, `insert(obj: cRouteList, at: number): void`, and `assign(obj: cRouteList): void` methods
4. WHEN counting route elements THEN `routeList.count()` SHALL return the number of cRouteItem elements in the collection
5. IF array operations fail THEN methods SHALL throw specific errors with clear messages indicating invalid indices or operations

### REQ-OBJ-004: C++ Compatible Route Construction

**User Story:** As a developer migrating from original C++ code, I want route construction methods that work identically to the original C++ Route class, so that migration is straightforward and results are identical.

#### Route Construction Acceptance Criteria

1. WHEN building routes programmatically THEN cRoute SHALL provide the same methods as original C++ Route class: setupRoute(), addRoute(), addStation(), with identical parameter handling
2. WHEN route validation is needed THEN cRoute SHALL replicate the exact validation logic from original C++ Route class
3. IF route building fails THEN cRoute SHALL return identical error codes and states as original C++ implementation
4. WHEN handling multi-company routes THEN cRoute SHALL use the same fare calculation rules and company boundary logic as original C++
5. IF route methods are called THEN they SHALL produce identical results to calling equivalent functions in `testmain.cpp` and `test_exec.cpp`

### REQ-OBJ-005: Android Kotlin Compatibility (CLAUDE.md Required)

**User Story:** As a mobile developer working with Android applications, I want object classes that are compatible with Android Kotlin implementations, so that I can maintain consistency across platforms.

#### Android Compatibility Acceptance Criteria

1. WHEN implementing FareInfo objects THEN they SHALL be compatible with `/Users/ntake/priv/farert.repos/farert/app/Farert.android/app/src/main/java/org/sutezo/alps/FareInfo.kt` structure and methods
2. WHEN implementing RouteHelper functionality THEN it SHALL be compatible with `/Users/ntake/priv/farert.repos/farert/app/Farert.android/app/src/main/java/org/sutezo/alps/RouteHelper.kt` excluding saveParam, readParam, readParams, saveHistory, appendHistory, and isStrageInRoute methods
3. IF Android Farert project uses additional methods THEN those SHALL be implemented for cross-platform consistency in `/Users/ntake/priv/farert.repos/farert/app/Farert.android/app/src/main/java/org/sutezo/farert` directory
4. WHEN data structures are shared THEN TypeScript interfaces SHALL match Kotlin data class structures for seamless data exchange
5. IF method signatures differ between platforms THEN TypeScript implementations SHALL provide equivalent functionality with platform-appropriate naming conventions

### REQ-OBJ-006: Enhanced FareInfo Object Capabilities  

**User Story:** As a developer creating fare display interfaces, I want comprehensive fare information access, so that I can build rich user interfaces with detailed fare breakdowns.

#### Acceptance Criteria

1. WHEN accessing fare details THEN FareInfo SHALL provide fare breakdown by company, distance, and special rules
2. WHEN displaying route information THEN FareInfo SHALL include formatted route strings suitable for user display
3. IF discount calculations are needed THEN FareInfo SHALL provide all available discount types with calculated amounts
4. WHEN fare comparison is required THEN FareInfo SHALL support comparison methods between different route options
5. IF fare history is needed THEN FareInfo SHALL provide methods to export fare calculation history for debugging

### REQ-OBJ-007: Object Lifecycle Management and Memory Safety

**User Story:** As a developer building long-running applications, I want proper object lifecycle management, so that my application doesn't experience memory leaks or crashes.

#### Lifecycle Management Acceptance Criteria

1. WHEN objects are created and destroyed repeatedly THEN WebAssembly heap SHALL not grow indefinitely (memory leak prevention)
2. WHEN application runs for extended periods THEN object destruction SHALL properly cleanup C++ resources
3. IF garbage collection occurs THEN WebAssembly objects SHALL be properly finalized without causing crashes
4. WHEN multiple objects reference the same route data THEN reference counting SHALL prevent premature destruction
5. IF objects are used after destruction THEN system SHALL throw clear errors rather than causing undefined behavior

### REQ-OBJ-008: Developer Experience and Documentation Enhancements

**User Story:** As a new developer using the object classes, I want comprehensive examples and documentation, so that I can quickly understand how to use the objects effectively.

#### Documentation Acceptance Criteria

1. WHEN developer accesses object class documentation THEN examples SHALL show realistic Japanese station/line usage patterns
2. WHEN learning object relationships THEN documentation SHALL include UML-style diagrams showing class inheritance and composition
3. IF developer encounters common issues THEN documentation SHALL include troubleshooting section with solutions
4. WHEN exploring advanced features THEN examples SHALL demonstrate complex scenarios like multi-company routes and special fare rules
5. IF integration with React/Vue is needed THEN documentation SHALL provide framework-specific integration examples

---

## Non-Functional Requirements

### Performance

- Object method calls SHALL have **identical performance characteristics** to equivalent procedural API calls, maintaining the same calculation speed as original C++
- FareInfo object creation SHALL complete within the **same time bounds** as original C++ FARE_INFO structure creation for identical route inputs
- Route validation SHALL match the **exact performance profile** of original C++ Route class validation methods
- Memory usage per object instance SHALL **not exceed** the memory footprint of equivalent C++ objects, ensuring WebAssembly overhead remains minimal

### Security

- Object methods SHALL validate all input parameters to prevent buffer overflows or injection attacks
- Memory access SHALL be bounds-checked to prevent reading unauthorized WebAssembly memory regions
- Error messages SHALL not expose internal C++ memory addresses or sensitive database information
- Type coercion SHALL be explicit and safe, preventing unintended data type conversions

### Reliability

- Objects SHALL handle WebAssembly module reloading gracefully without hanging references
- Error conditions SHALL not corrupt object internal state or affect other object instances
- Long-running calculations SHALL be interruptible without leaving objects in inconsistent states
- Object destruction SHALL always complete successfully even if C++ destructors encounter errors

### Usability

- Method names SHALL follow JavaScript camelCase conventions consistently
- Error messages SHALL be developer-friendly with actionable suggestions for resolution
- Object behavior SHALL be predictable and consistent with JavaScript object model expectations
- TypeScript IntelliSense SHALL provide helpful parameter hints and documentation previews