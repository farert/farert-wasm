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
- `line` - Line name (e.g., "東海道本線")
- `station` - Station name

**Returns:** Status code (0 = success)

**Example:**
```typescript
farert.addRoute("東海道本線", "新大阪");
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

| Code | Description |
|------|-------------|
| 0 | Success |
| -1 | General error |
| -2 | Invalid station name |
| -3 | Invalid line name |
| -4 | Route not found |
| -5 | Cannot reverse route |

---

## JSON Response Formats

### Route Record

```json
{
  "index": 0,
  "line": "東海道本線",
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
    "lines": ["山手線", "中央線", "東海道本線"]
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
  farert.addRoute("東海道本線", "京都");

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
