# FARERT WASM API Documentation

Complete API reference for the FARERT WebAssembly library.

## Table of Contents

- [Initialization](#initialization)
- [Farert Class](#farert-class)
- [Global Functions](#global-functions)
- [Error Codes](#error-codes)
- [JSON Response Formats](#json-response-formats)

## Initialization

### `initFarert(): Promise<void>`

Initializes the WASM module and loads the embedded database. **Must be called before using any other API functions.**

```typescript
import { initFarert } from 'farert-wasm';

await initFarert();
```

**Note**: This function is idempotent - calling it multiple times is safe.

---

## Farert Class

Main class for route calculation and fare computation.

### Constructor

```typescript
const farert = new Farert();
```

Creates a new route calculator instance. Each instance maintains its own route state.

### Route Building Methods

#### `addStartRoute(station: string): number`

Sets the starting station for a route.

**Parameters:**
- `station` - Station name (Japanese)

**Returns:** Status code (0 = success)

**Example:**
```typescript
farert.addStartRoute("東京");
```

#### `addRoute(line: string, station: string): number`

Adds a line and station to the route.

**Parameters:**
- `line` - Line name (e.g., "東海道線")
- `station` - Station name

**Returns:** Status code (0 = success)

**Example:**
```typescript
farert.addRoute("東海道線", "新大阪");
```

#### `autoRoute(useBulletTrain: number, destinationStation: string): number`

Automatically calculates the optimal route to a destination.

**Parameters:**
- `useBulletTrain` - 0 = don't use, 1 = use bullet trains
- `destinationStation` - Destination station name

**Returns:** Status code (0 = success)

**Example:**
```typescript
farert.autoRoute(1, "博多");
```

### Route Manipulation

#### `removeAll(): void`

Removes all route segments, resetting the route.

#### `removeTail(): void`

Removes the last route segment.

#### `reverse(): number`

Reverses the route direction (swaps departure and arrival).

**Returns:** Status code (0 = success, -1 = cannot reverse)

#### `assign(sourceRoute: Farert, count: number): void`

Assigns (copies) route data from another Farert instance to this instance. Used for result details page and try auto route functionality.

**Parameters:**
- `sourceRoute` - The source Farert instance to copy from
- `count` - Number of route items to copy (-1 to copy all)

**Example:**
```typescript
const route1 = new Farert();
route1.addStartRoute("東京");
route1.addRoute("東海道本線", "品川");
route1.addRoute("東海道本線", "横浜");

const route2 = new Farert();
// Copy all routes from route1 to route2
route2.assign(route1, -1);

// Copy only first 2 route items
const route3 = new Farert();
route3.assign(route1, 2);
```

### Fare Calculation

#### `showFare(): string`

Calculates and returns fare information as a formatted string.

**Returns:** Multi-line string with fare breakdown

**Example:**
```typescript
const fare = farert.showFare();
console.log(fare);
// Output:
// 乗車券 8,360円
// 特急券 4,960円
// 合計   13,320円
```

#### `getFareInfoObjectJson(): string`

Returns fare information as JSON object.

**Returns:** JSON string with detailed fare information

**Example:**
```typescript
const fareJson = JSON.parse(farert.getFareInfoObjectJson());
console.log(fareJson.totalFare); // 13320
```

### Route Information

#### `getRouteCount(): number`

Returns the number of route segments.

#### `departureStationName(): string`

Returns the departure station name.

#### `arrivevalStationName(): string`

Returns the arrival station name.

#### `routeScript(): string`

Returns the route as a script string (for serialization).

#### `buildRoute(routeStr: string): number`

Builds a route from a script string.

**Parameters:**
- `routeStr` - Route script (from `routeScript()`)

**Returns:** Status code

#### `getRoutesJson(): string`

Returns all route segments as JSON array.

**Returns:** JSON string

**Example:**
```typescript
const routes = JSON.parse(farert.getRoutesJson());
routes.forEach(r => {
  console.log(`${r.line}: ${r.station}`);
});
```

#### `getRouteRecord(index: number): string`

Returns a specific route segment as JSON.

**Parameters:**
- `index` - Route segment index (0-based)

**Returns:** JSON string

### Route Configuration Flags

#### `setLongRoute(flag: boolean): void`

Enables/disables long-distance route calculation rules.

#### `setJrTokaiStockApply(flag: boolean): void`

Enables/disables JR Tokai stock application rules.

#### `setStartAsCity(): void`

Treats the starting station as a city (affects fare calculation).

#### `setArrivalAsCity(): void`

Treats the arrival station as a city.

#### `setSpecificTermRule115(flag: boolean): void`

Enables/disables specific fare rule 115.

#### `setDetour(enabled: boolean): number`

Enables/disables detour routing.

**Returns:** Status code

#### `setNoRule(noRule: boolean): void`

Disables fare calculation rules (for testing).

#### `setNotSameKokuraHakataShinZai(enabled: boolean): void`

Sets the Kokura-Hakata-Shin route rule.

### Route Status Checks

#### `isAvailableReverse(): boolean`

Checks if the current route can be reversed.

#### `isOsakakanDetourEnable(): boolean`

Checks if Osaka-area detour is enabled.

#### `isOsakakanDetour(): boolean`

Checks if current route uses Osaka-area detour.

#### `isNotSameKokuraHakataShinZai(): boolean`

Checks Kokura-Hakata-Shin route status.

#### `typeOfPassedLine(offset: number): number`

Returns the type of line at the given offset.

**Returns:** Line type code

---

## Global Functions

### Database Operations

#### `openDatabase(): string`

Opens the embedded database. Called automatically by `initFarert()`.

**Returns:** Status message

#### `closeDatabase(): void`

Closes the database. Generally not needed as cleanup is automatic.

### Prefecture Functions

#### `getPrefects(): string`

Returns all Japanese prefectures as JSON array.

**Returns:** JSON string

**Example:**
```typescript
const prefects = JSON.parse(getPrefects());
// ["北海道", "青森", "岩手", ...]
```

#### `getPrefectId(prefecture: string): number`

Returns the internal ID for a prefecture.

**Parameters:**
- `prefecture` - Prefecture name

**Returns:** Prefecture ID

### Company Functions

#### `getCompanys(): string`

Returns all JR companies as JSON array.

**Returns:** JSON string

**Example:**
```typescript
const companies = JSON.parse(getCompanys());
// ["JR北海道", "JR東日本", "JR東海", ...]
```

#### `getCompanyId(company: string): number`

Returns the internal ID for a company.

### Line Functions

#### `getLinesByPrefect(prefecture: string): string`

Returns all railway lines in a prefecture.

**Parameters:**
- `prefecture` - Prefecture name

**Returns:** JSON array of line names

#### `getLinesByCompany(company: string): string`

Returns all lines operated by a company.

**Parameters:**
- `company` - Company name (e.g., "JR東日本")

**Returns:** JSON array of line names

#### `getLinesByStation(station: string): string`

Returns all lines serving a station.

**Parameters:**
- `station` - Station name

**Returns:** JSON array of line names

#### `getBranchStationsByLine(lineName: string, stationName: string): string`

Returns branch stations on a line.

**Parameters:**
- `lineName` - Line name
- `stationName` - Starting station

**Returns:** JSON array of station names

#### `getStationsByLine(lineName: string): string`

Returns all stations on a line.

**Parameters:**
- `lineName` - Line name

**Returns:** JSON array of station names

### Station Functions

#### `getStationsByCompanyAndLine(jrgroup: string, lineName: string): string`

Returns stations filtered by company and line.

**Parameters:**
- `jrgroup` - JR company name
- `lineName` - Line name

**Returns:** JSON array of station names

#### `getStationsByPrefectureAndLine(prefecture: string, lineName: string): string`

Returns stations filtered by prefecture and line.

**Parameters:**
- `prefecture` - Prefecture name
- `lineName` - Line name

**Returns:** JSON array of station names

#### `getPrefectureByStation(stationName: string): string`

Returns the prefecture containing a station.

**Parameters:**
- `stationName` - Station name

**Returns:** Prefecture name

#### `getKanaByStation(stationName: string): string`

Returns the kana reading of a station name.

**Parameters:**
- `stationName` - Station name

**Returns:** Kana reading

**Example:**
```typescript
getKanaByStation("東京"); // "とうきょう"
```

### Search Functions

#### `searchStationByKeyword(keyword: string): string`

Searches for stations matching a keyword.

**Parameters:**
- `keyword` - Search keyword (partial match)

**Returns:** JSON array of matching station names

**Example:**
```typescript
const results = JSON.parse(searchStationByKeyword("新宿"));
// ["新宿", "西新宿", "東新宿", ...]
```

---

## Error Codes
- addRoute()
- addStartRoute()
- buildRoute()

| Code | Description |
|------|-------------|
| 0 | Success(終端到達-追加不可) |
| 1 | Success(OK-継続可能) |
| 2 | 
| 4 | Success(会社線制限により終端) |
| 5 | Success(すでに終了している) |
| -1 | 復乗エラー（重複エラー） |
| -2 | 不正な駅指定 |
| -3 | 開始駅未設定 |
| -4 | 会社線通過連絡不許可 |
| -5 | Cannot reverse route |
|-200|駅名不正|
|-300|路線名不正|

---

## JSON Response Formats

### Route Record

```json
{
  "index": 0,
  "line": "東海道線",
  "station": "品川",
  "lineType": 1,
  "distance": 6.8
}
```

### Fare Information

```json
{
  "basicFare": 8360,
  "expressCharge": 4960,
  "totalFare": 13320,
  "distance": 552.6,
  "details": {
    "hasExpress": true,
    "hasLimitedExpress": true
  }
}
```

### Station Search Result

```json
[
  {
    "name": "東京",
    "kana": "とうきょう",
    "prefecture": "東京",
    "lines": ["山手線", "中央線", "東海道線"]
  }
]
```

---

## Best Practices

1. **Always initialize first**: Call `initFarert()` before any other API usage
2. **Error handling**: Check return codes from route building functions
3. **Memory management**: WASM handles cleanup automatically
4. **JSON parsing**: Always parse JSON strings before use
5. **Station names**: Use exact Japanese station names (kanji)

---

## Example: Complete Route Calculation

```typescript
import { initFarert, Farert } from 'farert-wasm';

async function calculateFare() {
  // Initialize
  await initFarert();

  // Create calculator
  const farert = new Farert();

  // Build route: Tokyo -> Osaka -> Kyoto
  if (farert.addStartRoute("東京") !== 0) {
    throw new Error("Invalid starting station");
  }

  farert.addRoute("東海道新幹線", "新大阪");
  farert.addRoute("東海道線", "京都");

  // Get fare
  const fare = farert.showFare();
  console.log("Fare:", fare);

  // Get route details
  const routes = JSON.parse(farert.getRoutesJson());
  console.log("Route segments:", routes.length);

  // Get fare as JSON
  const fareInfo = JSON.parse(farert.getFareInfoObjectJson());
  console.log("Total:", fareInfo.totalFare, "円");
}

calculateFare().catch(console.error);
```

---

## 開発者ツール

### executeSql()

SQLを直接実行してデータベースをデバッグ・検索できます。

**シグネチャ:**
```typescript
function executeSql(sql: string): string
```

**パラメータ:**
- `sql` (string) - 実行するSQL文

**戻り値:**
- JSON文字列（`SqlResult` 型）

**型定義:**
```typescript
interface SqlResult {
  columns: string[];   // カラム名の配列（"col0", "col1", ...）
  rows: any[][];       // データ行の配列
  rowCount: number;    // 行数
  error?: string;      // エラーメッセージ（エラー時のみ）
}
```

**使用例:**

```typescript
import { initFarert, executeSql, type SqlResult } from 'farert-wasm';

await initFarert();

// 基本的な使用
const result = executeSql("SELECT * FROM t_station WHERE name='東京'");
const data: SqlResult = JSON.parse(result);

if (data.error) {
  console.error('SQL Error:', data.error);
} else {
  console.log('Columns:', data.columns);
  console.log('Rows:', data.rows);
  console.log('Row count:', data.rowCount);
}

// テーブル一覧を取得
const tables = executeSql("SELECT name FROM sqlite_master WHERE type='table'");
const tableList: SqlResult = JSON.parse(tables);
tableList.rows.forEach(row => {
  console.log('Table:', row[0]);
});

// レコード数を確認
const count = executeSql("SELECT COUNT(*) FROM t_station");
const countData: SqlResult = JSON.parse(count);
console.log('Total stations:', countData.rows[0][0]);
```

**主要テーブル:**

| テーブル名 | 説明 |
|-----------|------|
| `t_station` | 駅マスタ（name, kana, prefecture_id, etc.） |
| `t_line` | 路線マスタ（name, company_id, etc.） |
| `t_company` | JR会社マスタ（name, code, etc.） |
| `t_prefecture` | 都道府県マスタ（name, code, etc.） |
| `t_fare` | 運賃テーブル |
| `t_section` | 区間情報 |

**使用例: スキーマ確認**

```typescript
// テーブルのカラム情報を取得
const schema = executeSql("PRAGMA table_info(t_station)");
const schemaData: SqlResult = JSON.parse(schema);

schemaData.rows.forEach(col => {
  console.log(`Column: ${col[1]}, Type: ${col[2]}`);
});
```

**注意事項:**

1. **読み取り専用**: データベースは読み取り専用です。INSERT/UPDATE/DELETE は使用できません。
2. **開発専用**: この機能は開発・デバッグ目的です。本番環境での使用は避けてください。
3. **パフォーマンス**: 大量のデータを取得すると遅くなる可能性があります。LIMIT句を使用してください。
4. **SQLインジェクション**: ユーザー入力を直接SQLに埋め込まないでください。

**エラーハンドリング:**

```typescript
function safeExecuteSql(sql: string): SqlResult | null {
  try {
    const result = executeSql(sql);
    const data: SqlResult = JSON.parse(result);

    if (data.error) {
      console.error('SQL Error:', data.error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('Failed to execute SQL:', e);
    return null;
  }
}

// 使用例
const stations = safeExecuteSql("SELECT * FROM t_station LIMIT 10");
if (stations) {
  console.log('Found', stations.rowCount, 'stations');
}
```

---

## セキュリティ考慮事項

1. **SQLインジェクション**: `executeSql()` はプリペアドステートメントを使用していません。ユーザー入力を直接使用しないでください。
2. **データベースアクセス**: データベースは読み取り専用です。
3. **WASM サンドボックス**: WASMはブラウザのサンドボックス内で実行されます。

---
