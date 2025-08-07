# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a C/C++ to WebAssembly migration project that converts a Japanese railway fare calculation system from native C/C++/Objective-C++ to WASM for use in TypeScript/JavaScript applications.

## Build Commands

**重要**: ビルド前にEmscripten環境を設定する必要があります。

### 方法1: 環境設定スクリプトを使用（推奨）
```bash
source setup_env.sh && make          # ビルド
source setup_env.sh && make serve    # 開発サーバー起動
```

### 方法2: npm scriptsを使用
```bash
npm run build       # ビルド（環境設定込み）
npm run dev         # ビルド + サーバー起動
npm run clean       # クリーンアップ
```

### 方法3: 手動で環境設定
```bash
source ~/priv/farert.repos/emsdk/emsdk_env.sh
make                # ビルド
make serve          # 開発サーバー起動
make help           # ヘルプ表示
```

## Development Environment Setup

q../- コミットメッセージは conventional commits 形式で書いてください

1. Emscripten SDK is installed at `~/priv/farert.repos/emsdk/`
2. Use `setup_env.sh` script to activate environment automatically
3. Build outputs to `dist/` directory

## Core Architecture

### Migration Source Files (`migration_source/`) - ✅ COMPLETED
- **`alpdb.cpp/alpdb.h`** - Core railway fare calculation logic (✅ migrated to `src/core/`)
- **~~`c_route.h/c_route.mm`~~** - ✅ **FULLY MIGRATED** to `route_interface.h/cpp` (Objective-C++ → C++)
- **`db.cpp/db.h`** - SQLite3 database operations (✅ migrated to `src/core/`)
- **`jrdbnewest.db`** - Railway database (✅ integrated with MEMFS)
- **~~`stdafx.h/stdafx.cpp`~~** - ✅ Windows headers removed (WebAssembly compatible)

### Key Classes and Components
- `Route` - Main route building class with junction logic
- `RouteList` - Base route container
- `CalcRoute` - Route calculation with fare rules
- `FARE_INFO` - Comprehensive fare calculation results
- `RouteFlag` - Complex routing flags and special cases
- `DBS/DBO` - SQLite database wrapper classes

### Global Variables and Constants
- `g_tax` - Global tax variable (convert to `#define TAX`)
- Multiple fare calculation constants and junction definitions
- City/urban area definitions for special fare rules

## Database
- Uses SQLite3 (read-only database)
- Single database file: `jrdbnewest.db`
- Remove database switching logic from original code
- Use MEMFS for WebAssembly deployment

## Migration Status - ✅ COMPLETED

### ✅ Completed Migration Tasks
1. **Platform Optimization**: ✅ Windows-specific code removed, WebAssembly optimized
2. **Character Encoding**: ✅ UTF-8 exclusively implemented  
3. **Objective-C++ Conversion**: ✅ `c_route.mm` → `route_interface.cpp` (pure C++)
4. **File Organization**: ✅ All files organized in `src/core/`, `src/include/` structure
5. **Dependencies**: ✅ SQLite3 integrated with WebAssembly MEMFS

### 🚀 WebAssembly API Status
- **Total APIs**: 39 functions (27 basic + 12 extended)
- **All original c_route.h functionality**: ✅ Fully implemented in route_interface.h
- **WebAssembly bindings**: ✅ Complete with JSON array support
- **Test coverage**: ✅ Comprehensive test suites implemented

## Testing
The project includes a test HTML file (`index.html`) for validating WASM functions in the browser.