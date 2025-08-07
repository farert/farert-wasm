# Farert WebAssembly Project

日本の鉄道運賃計算システムのWebAssembly移植版です。

## プロジェクト概要

このプロジェクトは、C/C++で実装された鉄道運賃計算システム「Farert」をWebAssemblyに移植し、ブラウザで動作させるものです。

## プロジェクト構造

```
farert-wasm/
├── src/
│   ├── core/               # コアロジック（alpdb.cpp等）
│   ├── db/                 # データベース操作（SQLite3）
│   ├── include/            # ヘッダファイル
│   └── farert_wasm.cpp     # WebAssembly エクスポート関数
├── data/
│   └── jrdbnewest.db      # 鉄道データベース（読み取り専用）
├── third_party/
│   └── sqlite3.c          # SQLite3ライブラリ
├── build/                 # ビルド成果物
├── dist/                  # 出力されるWASMファイル
├── farert_test.html       # テストページ
├── Makefile              # ビルド設定
├── package.json          # NPMスクリプト
├── setup_env.sh          # Emscripten環境設定
└── CLAUDE.md             # 開発者向け詳細ドキュメント
```

## 前提条件

- Emscripten SDK が `~/priv/farert.repos/emsdk/` にインストール済み
- Python 3.x（開発サーバー用）

## セットアップ

1. **Emscripten環境の設定:**
   ```bash
   source setup_env.sh
   ```

2. **プロジェクトのビルド:**
   ```bash
   make
   # または
   npm run build
   ```

3. **開発サーバーの起動:**
   ```bash
   make serve
   # または
   npm run dev
   ```

4. **ブラウザでテスト:**
   `http://localhost:8080/farert_test.html` を開いてWebAssemblyモジュールをテスト

## 利用可能な機能

WebAssemblyモジュールは以下の機能を提供します：

### データベース機能
- `openDatabase()` - データベース接続
- `closeDatabase()` - データベース切断

### 経路管理機能  
- `createRoute()` - 経路オブジェクト作成
- `destroyRoute()` - 経路オブジェクト破棄
- `addStation(stationId)` - 駅を経路に追加
- `addRoute(lineId, stationId)` - 路線と駅を経路に追加
- `reverseRoute()` - 経路を逆転

### 駅・路線検索機能
- `getStationId(name)` - 駅名からIDを取得
- `getStationName(id)` - IDから駅名を取得
- `getLineName(id)` - IDから路線名を取得

### 運賃計算機能
- `calculateFare()` - 運賃計算実行
- `getFareString()` - 運賃情報の文字列取得

### デバッグ機能
- `test()` - 基本動作テスト
- `debugStations()` - データベース内容確認

## Makeコマンド

- `make` - WebAssemblyモジュールをビルド
- `make clean` - ビルド成果物を削除
- `make serve` - 開発サーバーを起動（自動ポート選択）
- `make status` - プロジェクトの状況を表示
- `make help` - 利用可能なコマンド一覧

## NPMスクリプト

- `npm run build` - プロジェクトをビルド
- `npm run clean` - ビルド成果物を削除
- `npm run serve` - 開発サーバーを起動
- `npm run dev` - ビルドして開発サーバーを起動
- `npm test` - 全ユニットテストを実行
- `npm run test:database` - データベース関連テストのみ実行
- `npm run test:route` - 経路管理テストのみ実行
- `npm run test:fare` - 運賃計算テストのみ実行
- `npm run test:browser` - ブラウザ用テストページの案内表示

## 開発方法

1. C/C++コードを `src/` ディレクトリで編集
2. `make` でリビルド
3. ブラウザでテストページを再読み込みして動作確認

## テスト手順

WebAssemblyモジュールの動作確認を行うための詳細な手順：

### 1. 基本セットアップ
```bash
# 1. Emscripten環境の設定
source setup_env.sh

# 2. プロジェクトビルド
make

# 3. 開発サーバー起動
make serve
```

### 2. ブラウザテスト
1. ブラウザで `http://localhost:8080/farert_test.html` を開く
2. 以下のテストを順番に実行：

#### 基本機能テスト
- **データベース接続テスト**: SQLite3データベースの接続確認
- **簡単な経路テスト**: 基本機能の動作確認（戻り値42のテスト）
- **駅名検索テスト**: 文字列バインディングと駅名検索の動作確認

#### 経路計算テスト  
- **基本経路作成**: 経路オブジェクトの作成とメモリ管理
- **運賃計算**: 経路から運賃計算までの完全フロー
- **経路逆転**: 経路の逆順変換機能

#### 詳細機能テスト
- **モジュールデバッグ**: 全関数の存在確認とデータベース内容表示

### 3. 期待される結果
すべてのテストで以下の結果が表示されることを確認：

```
✅ データベース接続成功
🧪 基本テスト結果: 42 (期待値: 42)
🚉 駅検索: 東京 → ID:XXX → 名前:東京
✅ 経路オブジェクト作成成功
💰 運賃計算テスト結果: 成功
🗃️ データベース内容 (最初の10駅): [駅リスト表示]
```

### 4. コンソールテスト
ブラウザの開発者ツールコンソールで直接APIを呼び出すことも可能：

```javascript
// 基本テスト
FarertModule.test()                          // → 42

// データベース操作
FarertModule.openDatabase()                  // → 1 (成功)
FarertModule.debugStations()                 // → 駅リスト文字列

// 駅・路線検索
FarertModule.getStationId("東京")             // → 駅ID
FarertModule.getStationName(1)               // → "駅名"
FarertModule.getLineName(1)                  // → "路線名"

// 経路・運賃計算
FarertModule.createRoute()                   // → 1 (成功)
FarertModule.addStation(1)                   // → 結果コード
FarertModule.calculateFare()                 // → 1 (成功)
FarertModule.getFareString()                 // → 運賃情報文字列
```

## ユニットテスト

プロジェクトには包括的なユニットテストスイートが含まれています：

### コマンドラインテスト（Node.js）

```bash
# 全テストを実行
npm test

# カテゴリ別テスト実行
npm run test:database    # データベース機能のテスト
npm run test:route       # 経路管理機能のテスト  
npm run test:fare        # 運賃計算機能のテスト
npm run test:integration # 統合テスト

# 直接実行（より詳細な制御）
node tests/run_tests.js                 # 全テスト
node tests/run_tests.js database        # データベーステストのみ
node tests/run_tests.js --help          # 使用方法表示
```

### ブラウザテスト

```bash
# 開発サーバーを起動
npm run serve

# ブラウザで以下のURLを開く
# http://localhost:8080/test_unit.html     # 詳細なユニットテストUI  
# http://localhost:8080/farert_test.html   # 基本的な動作テスト
```

### テストカテゴリ

- **basic** - 基本機能テスト
- **database** - データベース接続・管理テスト
- **search** - 駅・路線検索機能テスト
- **route** - 経路作成・管理テスト
- **fare** - 運賃計算テスト
- **debug** - デバッグ・ユーティリティテスト
- **error-handling** - エラーハンドリングテスト
- **memory** - メモリ管理テスト
- **integration** - 統合テスト（全機能の連携確認）

### テスト結果の例

```
🧪 Running all unit tests...

✅ basic - Basic test function
✅ database - DatabaseManager.openDatabase  
✅ search - RouteUtility.getStationId - valid station
✅ route - Route.createRoute
✅ fare - CalcRoute.calculateFare
✅ integration - complete fare calculation flow

📊 Final Test Results:
==================================================
Total Tests:    25
✅ Passed:      23
❌ Failed:      0  
⏭️  Skipped:     2
📈 Pass Rate:   92.0%
```

## 使用例

```javascript
// ブラウザのコンソールで実行例
const result = FarertModule.test();                    // 42が返される
const isOpen = FarertModule.openDatabase();           // データベース接続
const stationId = FarertModule.getStationId("東京");   // 駅IDを取得
const stationName = FarertModule.getStationName(1);   // 駅名を取得
const routeCreated = FarertModule.createRoute();      // 経路作成
const fareCalculated = FarertModule.calculateFare();  // 運賃計算
```

## 技術仕様

- **言語**: C/C++17
- **WebAssembly**: Emscripten
- **データベース**: SQLite3 (MEMFS)
- **文字エンコーディング**: UTF-8
- **ターゲット**: モダンブラウザ（ES6対応）

## トラブルシューティング

### よくある問題

1. **`em++: No such file or directory`**
   ```bash
   source setup_env.sh
   ```

2. **ポートが使用中**
   - Makefileが自動で別ポートを選択します

3. **WebAssemblyモジュールが読み込めない**
   - ブラウザの開発者ツールでエラーを確認
   - `make status` でビルド状況を確認

## ライセンス

GPL-3.0 License

## 開発者向け詳細情報

詳細な開発情報については `CLAUDE.md` を参照してください。