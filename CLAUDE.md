# CLAUDE.md - FARERT WASM project

## 🎯 Project Vision & Mission

- C++20 ソースをWebAssembly化して、Webアプリケーションから使用できるようにする。
- Webアプリケーションは、PWAを想定する。
- フレームワークは、Svelte、React、VueJS を想定する.

- PWA の設計書は以下に配置しています。
 - ../farert-pwa/specs/

### Core Development Requirements
1. **WebAssembly Compilation**: C++ → WASM with Emscripten toolchain
2. **TypeScript Interfaces**: Complete type-safe bindings for all WASM APIs and object classes

## 🚀 Implementation Status

- 移植するソースは、../farert/test/unix/common/Makefile 内のソースとする。
  - ../farert/app/win_mfc/fjr_mfc/lib/db.cpp
  - ../farert/app/win_mfc/fjr_mfc/lib/db.h
  - ../farert/app/alps/alpdb.cpp
  - ../farert/app/alps/alpdb.h
  - ../farert/app/alps/azusa.cpp
  - ../farert/app/alps/azusa.h
- DBは、../farert/db/jrdbNewest.db
- WASM として、TS/JSへ公開する関数、オブジェクトは、以下のファイルの全てとする。
  - ../farert/app/alps/azusa.h
- ../farert/test/unix/all/test_azusa.cpp は、テストコード
- ../farert/test/unix/all/README_test_azusa.md はドキュメント

**⚠️ 重要**: Emscripten SDK required at `../emsdk/`

### Git & Version Control
- **Commit Format**: Conventional Commits形式必須 (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Branch Strategy**: `main` branch for stable releases, feature branches for development
- **License**: GPL-3.0 for all source code

### Code Quality Standards
- **TypeScript**: Strict mode enabled (`"strict": true`) for all TypeScript files
- **C++ Standard**: C++20 with standard library, `-O3` optimization
- **Error Handling**: Replicate original C++ error codes without adding new types
- **Memory Management**: RAII patterns, WebAssembly automatic cleanup

### Database Layer (Completely Hidden)

- **SQLite3**: Read-only embedded database via MEMFS
- **Single file**: `jrdbNewest.db` (embedded at compile time)
- **No direct access**: TypeScript never sees database objects
- データベースはTS/JSから隠蔽されているが、開発者向けにSQLインターフェースを提供する。
  - sql 文を実行して結果を文字列で返すだけのものでよい。

### WebAssembly Interface Layer

- オブジェクトは、1つのみもち、ステートレスではない。状態をもつ。
- DevContainer 環境で開発環境を作ってください