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

## 開発方法

1. C/C++コードを `src/` ディレクトリで編集
2. `make` でリビルド
3. ブラウザでテストページを再読み込みして動作確認

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