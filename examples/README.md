# Railway Query Examples

鉄道情報クエリの使用例とサンプルコード

## 📋 概要

このディレクトリには、Farert WebAssemblyモジュールを使用して特定の鉄道情報を取得する方法を示すサンプルコードが含まれています。

## 🚀 実行方法

### 1. プロジェクトのビルド

```bash
# WebAssemblyモジュールとTypeScriptをビルド
npm run build
```

### 2. サンプルスクリプトの実行

```bash
# 全ての機能を実行
node examples/railway_query_examples.js
```

### 3. 個別機能のテスト

```bash
# 山手線の駅一覧
node -e "
const { queryYamanoteStations } = require('./examples/railway_query_examples.js');
const { wasmLoader } = require('./dist/cli/cli/wasm_loader.js');
wasmLoader.loadModule().then(queryYamanoteStations);
"

# 大宮の接続路線
node -e "
const { queryOmiyaConnections } = require('./examples/railway_query_examples.js');
const { wasmLoader } = require('./dist/cli/cli/wasm_loader.js');
wasmLoader.loadModule().then(queryOmiyaConnections);
"
```

## 📝 利用可能な機能

### `railway_query_examples.js`

| 機能 | 説明 |
|------|------|
| `queryYamanoteStations()` | 山手線の全駅を表示 |
| `queryYamanoteBranchStations()` | 山手線の分岐駅（他路線との接続駅）を表示 |
| `queryKanagawaLines()` | 神奈川県内のJR路線を表示 |
| `queryYokohamaAndKanagawaStations()` | 横浜線かつ神奈川県内の駅のみを表示（集合の積） |
| `queryOmiyaConnections()` | 大宮駅に接続する全路線を表示 |

## 🔧 WebAssembly API 関数

使用される主要なWebAssembly関数：

```typescript
// 基本的な名前⇔ID変換
getStationId(name: string): number      // 駅名 → ID
getStationName(id: number): string      // 駅ID → 駅名
getLineId(name: string): number         // 路線名 → ID  
getLineName(id: number): string         // 路線ID → 路線名

// 路線・駅の関係性
getStationsOnLine(lineId: number): number[]     // 路線上の全駅
getLinesAtStation(stationId: number): number[]  // 駅の全接続路線
isJunction(stationId: number): number          // 分岐駅判定

// 地域情報
getPrefectureIds(): number[]                        // 都道府県ID一覧
getCompanyOrPrefectureName(id: number): string     // 会社・都道府県名
```

## 💡 使用例コード

### 駅の接続路線を調べる

```javascript
const { wasmLoader } = require('./dist/cli/cli/wasm_loader.js');

async function getStationConnections(stationName) {
    const module = await wasmLoader.loadModule();
    
    // 駅IDを取得
    const stationId = module.getStationId(stationName);
    if (stationId <= 0) {
        console.log(`${stationName}が見つかりません`);
        return;
    }
    
    // 接続路線を取得
    const lines = module.getLinesAtStation(stationId);
    console.log(`${stationName}の接続路線:`);
    
    lines.forEach(lineId => {
        const lineName = module.getLineName(lineId);
        console.log(`- ${lineName} (ID: ${lineId})`);
    });
}

// 使用例
getStationConnections("新宿");
getStationConnections("東京");
```

### 路線の全駅を取得する

```javascript
async function getLineStations(lineName) {
    const module = await wasmLoader.loadModule();
    
    const lineId = module.getLineId(lineName);
    if (lineId <= 0) {
        console.log(`${lineName}が見つかりません`);
        return;
    }
    
    const stations = module.getStationsOnLine(lineId);
    console.log(`${lineName}の駅 (${stations.length}駅):`);
    
    stations.forEach((stationId, index) => {
        const stationName = module.getStationName(stationId);
        console.log(`${index + 1}: ${stationName}`);
    });
}

// 使用例
getLineStations("中央線");
getLineStations("東海道線");
```

## ⚠️ 注意事項

1. **データベース範囲**: JR各線と一部の第三セクター鉄道のみ対応
2. **私鉄未対応**: 東急、小田急、西武、東武などの大手私鉄は含まれません
3. **エラーハンドリング**: 存在しない駅・路線名を指定すると0またはエラーが返されます

## 🐛 トラブルシューティング

### よくあるエラー

```bash
# WebAssemblyモジュール読み込みエラー
Error: Cannot find module './dist/cli/wasm_loader.js'
→ 解決: npm run build を実行してください

# 駅・路線が見つからない
駅ID: 0, 路線ID: 0 が返される
→ 解決: 駅名・路線名の表記を確認してください（ひらがな・カタカナ・漢字）

# メモリエラー
WebAssembly memory allocation failed
→ 解決: Node.jsを再起動してください
```

### デバッグモード

詳細なログを表示するには：

```bash
CLI_DEBUG=1 node examples/railway_query_examples.js
```

## 📚 参考資料

- [API Documentation](../docs/api-reference.md)
- [TypeScript CLI Interface](../src/cli/types.ts)
- [WebAssembly Interface](../src/core/route_interface.cpp)