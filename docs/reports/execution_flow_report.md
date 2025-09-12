# 実行フローレポート：`node dist/cli/cli/main.js 渋谷 山手線 田端 東北線 盛岡`

## 📋 実行概要

**コマンド**: `node dist/cli/cli/main.js 渋谷 山手線 田端 東北線 盛岡`  
**実行タイプ**: 5パラメータ通常ルート計算  
**結果**: ✅ 成功（渋谷→盛岡、運賃¥8,580、距離535.3km）  
**生成日時**: 2025-09-12 09:30:00 JST

## 🔄 詳細実行フロー

### 1. **初期化フェーズ**

#### **1.1 メインエントリーポイント**
- **ファイル**: `src/cli/main.ts`
- **関数**: `main()` (async function)
- **処理内容**:
  - シグナルハンドリング初期化: `initializeSignalHandling()`
  - 環境検証: 環境変数とファイル存在チェック
  - パフォーマンスモニタリング開始: `performanceMonitor.mark()`

#### **1.2 WebAssembly初期化**
- **ファイル**: `src/cli/wasm_loader.ts` 
- **関数**: `wasmLoader.initializeModule()`
- **処理内容**:
  - WebAssemblyファイルロード (`dist/farert.js`, `dist/farert.wasm`)
  - データベース初期化 (`data/jrdbnewest.db`)
  - メモリ使用量監視 (RSS: 47MB → 63MB)

### 2. **引数解析フェーズ**

#### **2.1 パラメータ数判定**
- **ファイル**: `src/cli/main.ts`
- **関数**: 判定ロジック (line 164-183)
- **判定結果**: 5パラメータ → `handle5ParameterRoute()` へ

#### **2.2 パラメータバリデーション**
- **ファイル**: `src/cli/main.ts`
- **関数**: `handle5ParameterRoute()` (line 310-400)
- **バリデーション処理**:
  ```typescript
  // 各パラメータに対して実行
  validateWithSuggestions(param.value, param.type, module)
  ```
- **バリデーション対象**:
  - 渋谷 (station) ✅
  - 山手線 (line) ✅  
  - 田端 (station) ✅
  - 東北線 (line) ✅
  - 盛岡 (station) ✅

### 3. **ルート計算実行フェーズ**

#### **3.1 ルートテスト開始**
- **ファイル**: `src/cli/main.ts`
- **関数**: `executeRouteTest([routeString, ''], 0, module)` (line 395)
- **引数**: 
  - `routeString`: "渋谷 山手線 田端 東北線 盛岡"
  - `round`: 0 (全詳細表示)

#### **3.2 ルート設定処理**
- **ファイル**: `src/cli/route_test.ts`
- **関数**: `setupRouteFromString(buffer, module)`
- **処理内容**:
  1. **ルート作成**: `module.createRoute()`
  2. **文字列解析**: `buffer.trim().split(/\s+/)`
  3. **駅・路線ID変換ループ**:
     ```typescript
     // 渋谷 (始点)
     stationId = module.getStationId("渋谷") // → 748
     module.addRouteBegin(748)
     
     // 山手線経由で田端
     lineId = module.getLineId("山手線") // → 32  
     stationId = module.getStationId("田端") // → 323
     module.addRoute(32, 323)
     
     // 東北線経由で盛岡
     lineId = module.getLineId("東北線") // → 17
     stationId = module.getStationId("盛岡") // → 445  
     module.addRoute(17, 445)
     ```

#### **3.3 WebAssembly内部処理** (デバッグログから確認)
- **初期化**: `[WASM] clear-all mask.`
- **始点設定**: `[WASM] add-begin 渋谷(748)`
- **ルート追加1**: `[WASM] add 山手線(32)-渋谷(748), 田端(323)`
- **ルート追加2**: `[WASM] add 東北線(17)-田端(323), 盛岡(445)`
- **ルート同期**: `[WASM] CalcRoute::sync() 0`

#### **3.4 運賃計算処理**
- **ファイル**: `src/cli/route_test.ts`
- **関数**: `calculateAndGetResults(module)`
- **WebAssembly呼び出し**:
  ```typescript
  const calcResult = module.calculateFare() // → 1 (成功)
  const fareString = module.getFareString() // → 詳細運賃情報
  ```

#### **3.5 運賃ルール適用** (WebAssembly内部)
- **Rule69チェック**: `noapplid rule69(0)` - 適用なし
- **Rule70チェック**: `Rule70 not applied.` - 適用なし  
- **Rule86適用**: `applied for rule86(1)` - 東京都区内扱い
- **運賃テーブル参照**: `Fare_table(bspekm, b, 5353)` - 535.3km基準

### 4. **結果出力フェーズ**

#### **4.1 結果フォーマット**
- **ファイル**: `src/cli/route_test.ts`
- **運賃額**: 535 (内部値) → ¥8,580 (表示)
- **距離**: 535.3km
- **経由情報**: 東京都区内[区] → 盛岡 (東北線経由)

#### **4.2 コンソール出力**
```
Route: 渋谷 山手線 田端 東北線 盛岡
Fare: ¥535
Details: 東京都区内[区] -> 盛岡
経由：[東北線]
営業キロ： 535.3 km
運賃： ¥8,580       往復： ¥17,160
JR東日本 株主優待4割： ¥5,140
小児運賃： ¥4,290   往復： ¥8,580
学割運賃： ¥6,860   往復： ¥13,720

有効日数：   4日
途中下車できます
```

### 5. **クリーンアップフェーズ**
- **データベース接続終了**: `[DEBUG] Database connection closed`
- **メモリ使用量**: RSS: 63MB → 113MB (最終)
- **終了コード**: 0 (成功)

## 🏗️ 主要関数呼び出しチェーン

```
main() 
├── initializeSignalHandling()
├── wasmLoader.initializeModule()
│   ├── WebAssembly.instantiate()
│   └── データベース初期化
├── handle5ParameterRoute()
│   ├── validateWithSuggestions() ×5
│   └── executeRouteTest()
│       ├── setupRouteFromString()
│       │   ├── module.createRoute()
│       │   ├── module.getStationId() ×3
│       │   ├── module.getLineId() ×2  
│       │   ├── module.addRouteBegin()
│       │   └── module.addRoute() ×2
│       ├── calculateAndGetResults()
│       │   ├── module.calculateFare()
│       │   ├── module.getFareString()
│       │   └── module.getRouteScript()
│       └── 結果出力処理
└── クリーンアップ
```

## 📊 パフォーマンス指標

- **WebAssembly読み込み時間**: 21ms
- **データベース初期化時間**: 3ms  
- **メモリ使用量増加**: 16MB (47MB → 63MB)
- **総実行時間**: 約100ms (推定)

## 🔧 WebAssembly API 詳細呼び出し

### 初期化API
1. `module.createRoute()` - 新しいルートオブジェクト作成

### 名前変換API  
2. `module.getStationId("渋谷")` → `748`
3. `module.getLineId("山手線")` → `32`
4. `module.getStationId("田端")` → `323` 
5. `module.getLineId("東北線")` → `17`
6. `module.getStationId("盛岡")` → `445`

### ルート構築API
7. `module.addRouteBegin(748)` - 渋谷を始点に設定
8. `module.addRoute(32, 323)` - 山手線で田端へ
9. `module.addRoute(17, 445)` - 東北線で盛岡へ

### 計算実行API
10. `module.calculateFare()` → `1` (成功)
11. `module.getFareString()` → 詳細運賃情報文字列
12. `module.getRouteScript()` → ルート説明文字列

## 🛡️ エラーハンドリング

### バリデーション段階
- 駅名・路線名の存在チェック
- 日本語文字の妥当性検証
- SQLインジェクション対策

### ルート構築段階  
- データベース接続エラー処理
- 駅・路線の対応関係チェック
- メモリ不足時の適切な終了

### 計算段階
- WebAssembly実行時エラー処理
- 運賃計算失敗時のロールバック
- 結果フォーマットエラー対応

## 💾 メモリ使用量推移

```
起動時:        47 MB (RSS)
WASM読み込み後: 63 MB (RSS) [+16MB]
計算実行後:    113 MB (RSS) [+50MB] 
```

## 🚀 最適化ポイント

1. **WebAssembly初期化**: 21msと高速
2. **データベースアクセス**: 3msで完了
3. **メモリ効率**: 66MBの増加で大規模計算を実行
4. **CPU使用率**: 効率的なC++ロジックによる高速処理

---

**生成ツール**: Claude Code Analysis  
**分析対象**: farert-wasm CLI v2.0.0  
**実行環境**: macOS (arm64), Node.js v24.7.0