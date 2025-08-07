# Farert WebAssembly Project

**✅ 移植完了** - 日本の鉄道運賃計算システムの完全WebAssembly実装

## 🎯 プロジェクト概要

Objective-C++/Cで実装された鉄道運賃計算システム「Farert」を**完全にWebAssemblyへ移植完了**。**39個のAPI**でブラウザ・Node.js両環境で動作します。

### ✨ 主要機能

- 🚄 **高精度運賃計算** - JR全線、私鉄対応
- 🗾 **全国鉄道データベース** - SQLite3 + MEMFS実装  
- 🔍 **高度な駅・路線検索** - キーワード、都道府県、会社別
- 📊 **JSON API** - 配列データの効率的な転送
- 🧪 **包括的テストスイート** - ブラウザ・Node.js対応

## 📂 プロジェクト構造

```text
farert-wasm/
├── src/
│   ├── core/                    # コアロジック（完全移植済み）
│   │   ├── alpdb.cpp/.h         # 鉄道運賃計算エンジン
│   │   └── route_interface.cpp  # 統合インターフェース実装
│   ├── db/                      # データベース操作
│   ├── include/
│   │   └── route_interface.h    # メインAPIヘッダー（39個の関数）
│   └── farert_wasm.cpp          # WebAssemblyバインディング
├── data/jrdbnewest.db           # 全国鉄道データベース
├── test_*.html                  # テストページ群
├── tests/                       # Unit test framework
└── docs/                        # API documentation
```

## 🚀 クイックスタート

### 前提条件

- Emscripten SDK が `~/priv/farert.repos/emsdk/` にインストール済み
- Python 3.x（開発サーバー用）

### セットアップ & 実行

```bash
# 1. 環境設定 & ビルド & サーバー起動
npm run dev

# または個別実行
source setup_env.sh  # Emscripten環境設定
make                 # WebAssemblyビルド  
make serve          # 開発サーバー起動
```

### テスト実行

ブラウザで以下のURLを開いてテスト：

- **http://localhost:8080/test_extended_api.html** - 39個API総合テスト
- **http://localhost:8080/test_route_detailed.html** - 詳細経路テスト  
- **http://localhost:8080/farert_test.html** - 基本動作テスト

## 📋 利用可能なAPI（39個）

### 🏗️ 基本API（27個）

#### データベース管理
- `openDatabase()` - データベース接続
- `closeDatabase()` - データベース切断
- `test()` - 基本動作テスト

#### 経路操作
- `createRoute()` - 経路オブジェクト作成
- `destroyRoute()` - 経路オブジェクト破棄
- `addStation(stationId)` - 駅追加
- `addRoute(lineId, stationId)` - 路線指定駅追加
- `removeAll()` - 全駅削除
- `removeTail()` - 末尾駅削除
- `reverseRoute()` - 経路逆転

#### 駅・路線情報
- `getStationId(name)` - 駅名→ID
- `getStationName(id)` - ID→駅名  
- `getLineName(id)` - ID→路線名
- `getRouteCount()` - 経路駅数
- `startStationId()` - 始点駅ID
- `lastStationId()` - 終点駅ID
- `isEnd()` - 経路終端判定

#### 運賃計算
- `calculateFare()` - 運賃計算実行
- `getFareString()` - 運賃情報取得
- `setLongRoute(flag)` - 長距離設定
- `setStartAsCity()` - 始点都市内設定
- `setArriveAsCity()` - 終点都市内設定

### ✨ 拡張API（12個）

#### 配列系API（JSON形式）
- `getLineIdsFromStation(stationId)` - 駅の接続路線一覧
- `getStationIdsOfLine(lineId)` - 路線の駅一覧
- `getJunctionIdsOfLine(lineId, stationId)` - ジャンクション駅一覧
- `searchStationsByKeyword(keyword)` - キーワード駅検索
- `getLinesFromCompanyOrPrefect(id)` - 会社・都道府県路線一覧

#### 詳細情報API
- `getStationKana(stationId)` - 駅名かな
- `getStationPrefecture(stationId)` - 駅都道府県
- `getStationNameExtended(stationId)` - 駅拡張名
- `getTerminalStationName(stationId)` - ターミナル駅名
- `getCompanyAndPrefects()` - 会社・都道府県データ

#### 高度経路操作
- `getCurrentRoute()` - 現在経路JSON
- `getRouteDetails()` - 経路詳細情報JSON

## 💻 基本的な使用方法

### JavaScript での利用

```javascript
// WebAssemblyモジュール読み込み
const module = await import('./dist/farert.js');
const FarertModule = await module.default();

// データベース接続
FarertModule.openDatabase();

// 駅検索 & 経路作成
const tokyoId = FarertModule.getStationId('東京');
const osakaId = FarertModule.getStationId('大阪');

FarertModule.createRoute();
FarertModule.addStation(tokyoId);
FarertModule.addStation(osakaId);

// 運賃計算
const result = FarertModule.calculateFare();
const fareInfo = FarertModule.getFareString();
console.log('運賃情報:', fareInfo);

// 拡張API：配列データの取得
const lineIds = JSON.parse(FarertModule.getLineIdsFromStation(tokyoId));
console.log('東京駅の接続路線:', lineIds);
```

### 高度な使用例：経路検索

```javascript
// キーワード検索で候補駅を取得
const stations = JSON.parse(FarertModule.searchStationsByKeyword('新宿'));

// 各駅の詳細情報を取得
for (const stationId of stations.slice(0, 5)) {
    const name = FarertModule.getStationName(stationId);
    const kana = FarertModule.getStationKana(stationId);
    const prefecture = FarertModule.getStationPrefecture(stationId);
    console.log(`${name} (${kana}) - ${prefecture}`);
}
```

## 🧪 テストスイート

### ブラウザテスト

```bash
# サーバー起動後、ブラウザでアクセス
npm run serve
```

- **総合テスト**: `test_extended_api.html` - 39個API動作確認
- **詳細テスト**: `test_route_detailed.html` - 経路作成詳細テスト
- **基本テスト**: `farert_test.html` - 基本機能テスト

### Node.js テスト

```bash
# 簡単な動作確認
npm test

# 詳細なユニットテスト  
npm run test:unit
```

## 🛠️ 開発者向け情報

### Make コマンド

```bash
make          # WebAssemblyビルド
make clean    # ビルド成果物削除  
make serve    # 開発サーバー起動
make help     # ヘルプ表示
```

### NPM スクリプト

```bash
npm run build       # ビルド（環境設定込み）
npm run dev         # ビルド + サーバー起動
npm run clean       # クリーンアップ
npm run test        # テスト実行
```

### 設定ファイル

- **CLAUDE.md** - 詳細開発ガイド
- **EXTENDED_API_REFERENCE.md** - API完全リファレンス  
- **MIGRATION_COMPLETION_SUMMARY.md** - 移植完了サマリー

## 📊 移植完了状況

| 元のクラス | 移植先 | メソッド数 | 状態 |
|------------|--------|------------|------|
| `cRouteUtil` | `RouteUtility` | 25個 | ✅ 完全移植 |
| `cRoute` | `RouteWrapper` | 20個 | ✅ 完全移植 |
| `cRouteList` | `RouteListWrapper` | 8個 | ✅ 完全移植 |
| `cCalcRoute` | `CalcRouteWrapper` | 15個 | ✅ 完全移植 |

**移植率**: **100%** - 元のObjective-C++機能がすべてC++/WebAssemblyで利用可能

## 🏗️ アーキテクチャ

```text
┌─────────────────────────────────────────┐
│              JavaScript                 │
│        (Browser / Node.js)              │
└─────────────────┬───────────────────────┘
                  │ 39 APIs
┌─────────────────▼───────────────────────┐
│           WebAssembly                   │
│     (farert.wasm + bindings)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              C++ Core                   │
│   route_interface.cpp + alpdb.cpp       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           SQLite3 Database              │
│        (MEMFS embedded)                 │
└─────────────────────────────────────────┘
```

## 🤝 貢献・ライセンス

- **ライセンス**: GPL-3.0
- **貢献**: Issue・PRをお待ちしています
- **ドキュメント**: 詳細は `CLAUDE.md` を参照

---

**Farert WebAssembly** - 高性能・高精度な日本の鉄道運賃計算システム 🚄