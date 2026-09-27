# Changelog

すべての重要な変更がこのファイルに記録されます。

このプロジェクトは[Conventional Commits](https://www.conventionalcommits.org/)形式に従っています。

## [Unreleased]

### Fixed
- `getFareInfoObjectJson()` の `messages` に大都市近郊区間の注記
  （「近郊区間内ですので最安運賃の経路にしました(途中下車不可、有効日数当日限り)」等）が
  特例適用時に含まれなかった問題を修正（判定条件が `no_rule` で反転していた。iOS/Android と同じ
  `isRuleApplied` 基準に統一）
- 上記注記の文言を alpdb（showFare）と同じ「(途中下車不可、有効日数当日限り)」付きに変更
- 会社線を含む経路では上記注記を出さないよう修正（最安経路の再計算対象外のため。
  alpdb の showFare と同じく `isIncludeCompanyLine()` で除外）

### Changed
- `getFareInfoObjectJson()` の距離系フィールド（`totalSalesKm` など15項目）を
  1/10km 単位の整数から km 単位の小数（0.1km 精度）に変更
  - 例: `1046` -> `104.6`
  - クライアント側の ÷10 換算が不要になる破壊的変更

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
