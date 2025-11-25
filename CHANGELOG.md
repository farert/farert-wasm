# Changelog

すべての重要な変更がこのファイルに記録されます。

このプロジェクトは[Conventional Commits](https://www.conventionalcommits.org/)形式に従っています。

## [Unreleased]

### Added
- 初期リリース
- 開発者向けSQL実行インターフェース (`executeSql()`)
  - データベースへの直接SQLクエリ実行
  - JSON形式での結果取得
  - エラーハンドリング対応
- `Farert.assign()` メソッド
  - 別のFaretインスタンスからルートデータをコピー
  - 結果詳細ページと自動ルート試行に使用
- C++20からWebAssemblyへのコンパイル対応
- 完全なTypeScriptバインディング
- bundled SQLite3サポート（システムライブラリ不要）
- Emscripten embindを使用したWASMバインディング
- DevContainer環境
- 包括的なビルドスクリプト
- 日本語ドキュメント

### Technical Details
- Emscripten SDKを使用したWASMコンパイル
- オリジナルsqlite3ソース（../farert/app/win_mfc/fjr_mfc/lib/db/）を使用
- Windows互換性レイヤー（stubs/stdafx.h）
- C++20標準、-O3最適化
- 型安全TypeScript API
- PWA対応設計

### Build System
- CMake 3.20+
- Emscripten 3.1+
- Node.js 18+
- TypeScript 5.0+

### Files Modified for WASM Compatibility
- `src/cpp/core/azusa.h` - `build_route` の引数を `std::string&` から `std::string` に変更（Emscripten embind互換性のため）

### Files NOT Modified (as per CLAUDE.md)
- `src/cpp/core/db.cpp`
- `src/cpp/core/db.h`
- `src/cpp/core/alpdb.cpp`
- `src/cpp/core/alpdb.h`

### Known Issues
- 初回WASMロード時間: 約2-3秒
- WASMバイナリサイズ: 約5MB（データベース含む、sqlite3ソース含む）
- コンパイル時の警告: `memcpy`/`memset`の非trivially-copyable型への使用（元のコード由来、動作には影響なし）
