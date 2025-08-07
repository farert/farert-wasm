# 拡張WebAssembly API リファレンス

## 概要

Farert WebAssemblyモジュールに**12個の新しいAPI**を追加し、基本的な27個のAPIと合わせて**合計39個のAPI**が利用可能になりました。

## 新規追加API一覧

### 🔢 配列系API (JSON形式返却)

これらのAPIは、C++の`std::vector<int>`をJSON配列文字列として返します。JavaScriptで`JSON.parse()`して利用してください。

#### `getLineIdsFromStation(stationId: number): string`
**説明:** 指定された駅IDから接続している路線IDのリストを取得  
**引数:** `stationId` - 駅ID  
**戻り値:** JSON配列文字列 `"[1,2,3]"`  
**使用例:**
```javascript
const lineIds = JSON.parse(FarertModule.getLineIdsFromStation(123));
console.log('東京駅の路線:', lineIds); // [1, 2, 5, 8]
```

#### `getStationIdsOfLine(lineId: number): string`
**説明:** 指定された路線IDに属する駅IDのリストを取得  
**引数:** `lineId` - 路線ID  
**戻り値:** JSON配列文字列  
**使用例:**
```javascript
const stationIds = JSON.parse(FarertModule.getStationIdsOfLine(1));
console.log('東海道線の駅:', stationIds); // [100, 101, 102, ...]
```

#### `getJunctionIdsOfLine(lineId: number, stationId: number): string`
**説明:** 指定された路線・駅のジャンクション（乗り換え可能駅）IDを取得  
**引数:** `lineId` - 路線ID, `stationId` - 基準駅ID  
**戻り値:** JSON配列文字列  

#### `searchStationsByKeyword(keyword: string): string`
**説明:** キーワードで駅を検索し、マッチする駅IDのリストを取得  
**引数:** `keyword` - 検索キーワード（駅名の一部）  
**戻り値:** JSON配列文字列  
**使用例:**
```javascript
const results = JSON.parse(FarertModule.searchStationsByKeyword('新宿'));
console.log('新宿を含む駅:', results); // [200, 201, 202]
```

#### `getLinesFromCompanyOrPrefect(id: number): string`
**説明:** 指定された会社IDまたは都道府県IDの路線リストを取得  
**引数:** `id` - 会社IDまたは都道府県ID  
**戻り値:** JSON配列文字列  

### 📋 詳細情報取得API

#### `getStationKana(stationId: number): string`
**説明:** 駅IDから駅名のかな（ひらがな・カタカナ）を取得  
**引数:** `stationId` - 駅ID  
**戻り値:** かな文字列  
**使用例:**
```javascript
const kana = FarertModule.getStationKana(123);
console.log('東京駅のかな:', kana); // "とうきょう"
```

#### `getStationPrefecture(stationId: number): string`
**説明:** 駅IDから所属都道府県名を取得  
**引数:** `stationId` - 駅ID  
**戻り値:** 都道府県名  

#### `getStationNameExtended(stationId: number): string`
**説明:** 駅IDから拡張駅名（詳細情報含む）を取得  
**引数:** `stationId` - 駅ID  
**戻り値:** 拡張駅名文字列  

#### `getTerminalStationName(stationId: number): string`
**説明:** 駅IDからターミナル駅名を取得  
**引数:** `stationId` - 駅ID  
**戻り値:** ターミナル駅名  

#### `getCompanyOrPrefectName(id: number): string`
**説明:** 会社IDまたは都道府県IDから名称を取得  
**引数:** `id` - 会社IDまたは都道府県ID  
**戻り値:** 名称文字列  

#### `getCompanyAndPrefects(): string`
**説明:** 全ての会社・都道府県データをJSON形式で取得  
**戻り値:** JSON文字列（会社リストと都道府県リスト）  
**使用例:**
```javascript
const data = JSON.parse(FarertModule.getCompanyAndPrefects());
console.log('会社データ:', data.companies);
console.log('都道府県データ:', data.prefects);
// {
//   "companies": [{"id": 1, "name": "JR東日本"}, ...],
//   "prefects": [{"id": 1, "name": "東京都"}, ...]
// }
```

#### `getDatabaseVersion(): number`
**説明:** データベースのバージョン番号を取得  
**戻り値:** バージョン番号（整数）  

### 🎯 高度な経路操作API

#### `getCurrentRoute(): string`
**説明:** 現在構築中の経路をJSON配列として取得  
**戻り値:** 駅IDの配列をJSON文字列で返す  
**使用例:**
```javascript
const route = JSON.parse(FarertModule.getCurrentRoute());
console.log('現在の経路:', route); // [123, 456, 789]
```

#### `getRouteDetails(): string`
**説明:** 現在の経路の詳細情報をJSON形式で取得  
**戻り値:** 経路詳細情報のJSON文字列  
**使用例:**
```javascript
const details = JSON.parse(FarertModule.getRouteDetails());
console.log('経路詳細:', details);
// {
//   "stationCount": 3,
//   "startStationId": 123,
//   "lastStationId": 789,
//   "isEnd": true
// }
```

## 利用方法

### 基本的な使用パターン

```javascript
// 1. モジュールロード
const module = await import('./dist/farert.js');
const FarertModule = await module.default();

// 2. データベース接続
FarertModule.openDatabase();

// 3. 拡張APIの利用
const tokyoId = FarertModule.getStationId('東京');
const lineIds = JSON.parse(FarertModule.getLineIdsFromStation(tokyoId));
const kana = FarertModule.getStationKana(tokyoId);
const prefecture = FarertModule.getStationPrefecture(tokyoId);

console.log(`東京駅 (${kana}, ${prefecture})`);
console.log('接続路線:', lineIds);
```

### 複合的な検索例

```javascript
// キーワードで駅を検索し、詳細情報を取得
async function searchStationDetails(keyword) {
    const stationIds = JSON.parse(FarertModule.searchStationsByKeyword(keyword));
    
    const results = [];
    for (const stationId of stationIds.slice(0, 10)) { // 最初の10件
        const name = FarertModule.getStationName(stationId);
        const kana = FarertModule.getStationKana(stationId);
        const prefecture = FarertModule.getStationPrefecture(stationId);
        const lineIds = JSON.parse(FarertModule.getLineIdsFromStation(stationId));
        
        results.push({ stationId, name, kana, prefecture, lineIds });
    }
    
    return results;
}

// 使用例
const shinjukuStations = await searchStationDetails('新宿');
console.table(shinjukuStations);
```

## テスト方法

拡張APIのテストは以下のページで実行できます：

```bash
# サーバー起動
npm run serve

# ブラウザでアクセス
http://localhost:8080/test_extended_api.html
```

### 利用可能なテストページ

1. **test_extended_api.html** - 拡張API専用テストページ
2. **test_route_detailed.html** - 詳細経路テスト
3. **farert_test.html** - 基本動作テスト
4. **verify_enhancement.html** - 拡張機能確認

## 注意事項

### JSON形式の戻り値について
- 配列系APIは全てJSON文字列として戻り値を返します
- JavaScriptで利用する際は必ず`JSON.parse()`を使用してください
- エラー時は空配列`"[]"`または空オブジェクト`"{}"`が返されます

### パフォーマンスについて  
- 大量の駅・路線データを扱う場合は、適切にページングしてください
- JSON文字列の解析にはわずかなオーバーヘッドがあります

### エラーハンドリング
```javascript
try {
    const lineIds = JSON.parse(FarertModule.getLineIdsFromStation(stationId));
    // 正常処理
} catch (error) {
    console.error('JSON解析エラー:', error);
    // エラー処理
}
```

## まとめ

この拡張により、Farert WebAssemblyモジュールはより高度な鉄道データ処理が可能になりました：

- **配列データの直接取得** - 複数の路線・駅情報を一度に取得可能
- **詳細情報の充実** - かな、都道府県、拡張名など豊富な駅情報
- **高度な経路操作** - JSON形式での経路データ操作
- **検索機能の強化** - キーワード検索、会社・都道府県絞り込み

全39個のAPIを活用して、より高機能な鉄道運賃計算Webアプリケーションの開発が可能です。