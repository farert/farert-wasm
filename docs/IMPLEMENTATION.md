# 実装の詳細

## アーキテクチャ概要

```
┌─────────────────────────────────────────────┐
│         TypeScript/JavaScript層              │
│  (Farert.ts, 型定義, PWAラッパー)            │
└─────────────────┬───────────────────────────┘
                  │
                  ↓ Emscripten embind
┌─────────────────────────────────────────────┐
│         WASM Bindings層                      │
│  (wasm_bindings.cpp - C++からJSへの橋渡し)   │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│         C++ Core層                           │
│  ┌─────────────────────────────────────┐    │
│  │ azusa.cpp/h  - メインAPI            │    │
│  │ (経路計算、運賃計算の統合インターフェース)│    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ alpdb.cpp/h  - JR運賃計算ロジック   │    │
│  │ (ルール処理、運賃テーブル、経路構築) │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ db.cpp/h     - データベース操作      │    │
│  │ (SQLite3ラッパー、クエリ実行)        │    │
│  └─────────────────────────────────────┘    │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│         SQLite3層                            │
│  (sqlite3.c - bundled SQLite3)              │
│  ├─ jrdbNewest.db (MEMFS埋め込み)           │
│  └─ 駅・路線・運賃マスタデータ              │
└─────────────────────────────────────────────┘
```

## 主要コンポーネント

### 1. C++ Core層

#### azusa.cpp/h
- **役割**: メインAPI、ユーザーインターフェース
- **主な機能**:
  - 経路計算インターフェース
  - 運賃計算統合
  - JSON変換
- **WASM互換性**: `build_route`メソッドの引数を値渡しに変更

#### alpdb.cpp/h
- **役割**: JR運賃計算の核心ロジック
- **主な機能**:
  - 運賃ルール適用
  - 特定区間処理
  - 経路最適化
- **変更不可**: CLAUDE.mdにより変更禁止

#### db.cpp/h
- **役割**: SQLite3データベース操作
- **主な機能**:
  - SQL実行
  - 結果セット管理
  - ステートメントキャッシュ
- **変更不可**: CLAUDE.mdにより変更禁止

### 2. WASM Bindings層

#### wasm_bindings.cpp
- **役割**: C++ ↔ JavaScript橋渡し
- **技術**: Emscripten embind
- **主な処理**:
  ```cpp
  EMSCRIPTEN_BINDINGS(farert_module) {
      // クラスバインディング
      class_<az_route>("Farert")
          .constructor<>()
          .function("addStartRoute", &az_route::add_start_route)
          // ...

      // 関数バインディング
      emscripten::function("openDatabase", &open_database);
      // ...
  }
  ```

### 3. Windows互換性層

#### src/cpp/stubs/stdafx.h
- **役割**: Windows固有APIのPOSIX互換実装
- **提供機能**:
  - 型定義: `TCHAR`, `LPCTSTR`, `BYTE`, etc.
  - 文字列関数: `_tcscpy_s`, `_tcscat_s`, `_tcslen`, etc.
  - マクロ: `_T`, `ASSERT`, `TRACE`, `NumOf`
  - グローバル変数: `g_tax`
- **重要**: db.hをインクルードしてDBOクラスを可視化

#### src/cpp/stubs/sqlite3.h
- **役割**: bundled sqlite3.hへのフォワード
- **パス**: `../core/sqlite3.h`

### 4. TypeScript層

#### src/ts/wrapper/Farert.ts
- **役割**: WASMモジュールの初期化とラッパー
- **主な機能**:
  - `initFarert()` - WASM初期化
  - `Farert` クラス - C++ `az_route`のラッパー
  - ヘルパー関数 - 駅・路線検索

#### src/ts/types/
- **farert.d.ts**: Faretクラスの型定義
- **emscripten.d.ts**: Emscriptenモジュールの型定義

## ビルドプロセス

### 1. ソースファイルコピー
```bash
scripts/copy-sources.sh
```
- `../farert`からソースをコピー
- sqlite3.c/h/ext.h（8.9MB）
- db.cpp/h, alpdb.cpp/h, azusa.cpp/h
- jrdbNewest.db

### 2. WASMコンパイル
```bash
scripts/build.sh
```

1. **CMake設定**:
   ```
   emcmake cmake ..
   ```

2. **コンパイルフラグ**:
   - C++: `-O3 -fno-char8_t`
   - C: `-DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_ENABLE_FTS5`

3. **リンクオプション**:
   ```
   -sWASM=1
   -sMODULARIZE=1
   -sEXPORT_ES6=1
   -sALLOW_MEMORY_GROWTH=1
   --preload-file jrdbNewest.db@/data/jrdbNewest.db
   ```

4. **出力**:
   - `dist/farert.js` - WASMローダー
   - `dist/farert.wasm` - バイナリ
   - `dist/farert.data` - 埋め込みDB

### 3. TypeScriptコンパイル
```bash
tsc
```
- `src/ts/**/*` → `dist/`

## メモリ管理

### C++側
- **RAII**: 自動リソース管理
- **スマートポインタ**: 必要に応じて使用
- **SQLite3**: ステートメントキャッシュで最適化

### WASM側
- **自動ガベージコレクション**: embindが管理
- **メモリ成長**: `-sALLOW_MEMORY_GROWTH=1`
- **初期メモリ**: 32MB
- **最大メモリ**: 2GB

## データベース

### 埋め込み方式
- **ファイル**: `jrdbNewest.db`
- **サイズ**: 約XXX MB
- **格納**: MEMFSに埋め込み
- **パス**: `/data/jrdbNewest.db`

### アクセス
```cpp
// C++側
DBS::getInstance()->open("/data/jrdbNewest.db");

// JavaScript側（自動）
// initFarert()がopenDatabase()を呼び出す
```

## パフォーマンス最適化

### コンパイル時
- `-O3` 最適化
- SQLite3機能の選択的無効化
- 不要な機能の削除

### 実行時
- ステートメントキャッシュ
- JSON文字列の効率的な変換
- メモリプールの使用（alpdb.cpp）

## セキュリティ考慮事項

### SQLインジェクション対策
- プリペアドステートメント使用
- バインドパラメータ

### メモリ安全性
- C++20標準ライブラリ使用
- バッファオーバーフロー対策

### サンドボックス
- WASM環境による隔離
- ファイルシステムアクセス制限（MEMFS）

## 制限事項

### 変更不可ファイル
- `db.cpp`, `db.h`
- `alpdb.cpp`, `alpdb.h`
- **理由**: CLAUDE.md仕様

### 変更可能ファイル
- `azusa.cpp`, `azusa.h`
- **変更内容**: `build_route`の引数型のみ

### 警告
- memcpy/memset非trivially-copyable型
- **影響**: なし（元のコード由来）

## デバッグ

### WASMデバッグ
```bash
# デバッグビルド
cmake .. -DCMAKE_BUILD_TYPE=Debug
```

### ログ出力
```cpp
// C++側
TRACE("Debug message: %d\n", value);

// JavaScript側
console.log('[FARERT]', message);
```

### メモリリーク検出
```javascript
// Emscripten提供のツール
Module.printErr = console.error;
```

## 今後の改善案

1. **サイズ削減**:
   - 不要なSQLite3機能の削除
   - 圧縮の適用

2. **パフォーマンス**:
   - Web Workerでの非同期処理
   - インデックス最適化

3. **機能追加**:
   - リアルタイムSQL実行インターフェース
   - より詳細なエラーメッセージ

4. **開発体験**:
   - 自動テスト拡充
   - CI/CD統合
