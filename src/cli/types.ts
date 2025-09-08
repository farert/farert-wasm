/**
 * TypeScript type definitions for Farert CLI
 * Based on CLAUDE.md Target requirements
 */

// WebAssembly module interface
export interface FarertModule {
  // Database operations
  openDatabase(): boolean;
  closeDatabase(): void;
  
  // Route operations
  createRoute(): number;
  destroyRoute(): void;
  addRouteBegin(stationId: number): number;  // 改名: addStation → addRouteBegin
  addRoute(lineId: number, stationId: number): number;  // 追加: 2引数版
  removeTail(): void;
  removeAll(): void;
  reverseRoute(): number;
  getRouteCount(): number;
  startStationId(): number;
  lastStationId(): number;
  isEnd(): number;
  calculateFare(): number;
  getFareString(): string;
  getFareInfoJson(): string;
  
  // Station operations
  getStationId(name: string): number;
  getStationName(id: number): string;
  
  // Line operations
  getLineId(name: string): number;  // 追加
  getLineName(id: number): string;
  
  // Route script operations
  setupRoute(route: string): number;
  getRouteScript(): string;
  
  // Route calculation configuration
  setLongRoute(flag: boolean): void;
  setStartAsCity(): void;
  setArriveAsCity(): void;
  
  // Station/Line utility functions
  isJunction(stationId: number): number;
  isSpecificJunction(lineId: number, stationId: number): number;
  getTerminalStationName(stationId: number): string;
  
  // Database utility functions
  getDatabaseVersion(): number;
  
  // Debug and test functions
  debugStations(): string;
  test(): number;
  
  // 6 Object Classes (CLAUDE.md Public API)
  cRoute: new() => RouteWrapper;
  cRouteList: new(route: RouteWrapper) => RouteListWrapper;
  cCalcRoute: new(route: RouteWrapper | RouteListWrapper) => CalcRouteWrapper;
  cRouteItem: new() => RouteItemWrapper;
  cRouteFlag: new() => RouteFlagWrapper;
  FareInfo: new() => FareInfoData;
  
  // Android-compatible Object Classes
  androidCompatibleRoute?: new() => AndroidCompatibleRouteWrapper;
  androidCompatibleCalcRoute?: new(route: AndroidCompatibleRouteWrapper) => AndroidCompatibleCalcRouteWrapper;
  androidCompatibleFareInfo?: new() => AndroidCompatibleFareInfoData;
  
  // Android utility methods
  androidRouteUtil?: AndroidRouteUtilCompat;
  androidSerializationHelper?: typeof AndroidSerializationHelper;
  
  // === Android Kotlin Compatibility Method Aliases ===
  
  /**
   * Android alias for getStationId - matches Android RouteHelper.getStationId()
   * @androidName findStationByName  
   * @kotlinType fun findStationByName(name: String): Int
   */
  findStationByName?: (name: string) => number;
  
  /**
   * Android alias for getStationName - matches Android RouteHelper.stationName()
   * @androidName getStationNameById
   * @kotlinType fun getStationNameById(id: Int): String
   */
  getStationNameById?: (id: number) => string;
  
  /**
   * Android alias for isJunction - matches Android RouteHelper.isJunction()
   * @androidName isJunctionStation
   * @kotlinType fun isJunctionStation(stationId: Int): Boolean
   */
  isJunctionStation?: (stationId: number) => boolean;
  
  /**
   * Get station reading in hiragana - matches Android RouteHelper.getKanaFromStationId()
   * @androidName getStationReading
   * @kotlinType fun getStationReading(id: Int): String
   */
  getStationReading?: (stationId: number) => string;
  
  /**
   * Get lines serving a station - matches Android RouteHelper.enumLineOfStationId()
   * @androidName getLinesAtStation
   * @kotlinType fun getLinesAtStation(stationId: Int): IntArray
   */
  getLinesAtStation?: (stationId: number) => number[];
  
  /**
   * Get stations on a line - matches Android RouteHelper.stationsIdsOfLineId()
   * @androidName getStationsOnLine
   * @kotlinType fun getStationsOnLine(lineId: Int): IntArray
   */
  getStationsOnLine?: (lineId: number) => number[];
  
  /**
   * Get JR company IDs - matches Android RouteHelper.getJRCompanys()
   * @androidName getJRCompanyIds
   * @kotlinType fun getJRCompanyIds(): IntArray
   */
  getJRCompanyIds?: () => number[];
  
  /**
   * Get prefecture IDs - matches Android RouteHelper.getPrefects()
   * @androidName getPrefectureIds
   * @kotlinType fun getPrefectureIds(): IntArray
   */
  getPrefectureIds?: () => number[];
  
  /**
   * Get company/prefecture name - matches Android RouteHelper.companyOrPrefectName()
   * @androidName getCompanyOrPrefectureName
   * @kotlinType fun getCompanyOrPrefectureName(id: Int): String
   */
  getCompanyOrPrefectureName?: (id: number) => string;
  
  /**
   * Create Android-compatible fare calculation
   * @androidName calculateFareAndroid
   * @kotlinType fun calculateFareAndroid(): FareInfo
   */
  calculateFareAndroid?: () => AndroidCompatibleFareInfoData;
  
  /**
   * Get Android-compatible fare info as JSON
   * @androidName getFareInfoJson
   * @kotlinType fun getFareInfoJson(): String
   */
  getFareInfoAndroidJson?: () => string;
  
  /**
   * Validate Android compatibility of current route
   * @androidName validateRouteCompatibility
   * @kotlinType fun validateRouteCompatibility(): ValidationResult
   */
  validateRouteCompatibility?: () => AndroidCompatibilityResult;
  
  /**
   * Android alias for setupRoute - matches Android RouteHelper.setupRoute()
   * @androidName setupRouteFromString
   * @kotlinType fun setupRouteFromString(routeString: String): Int
   */
  setupRouteFromString?: (routeString: string) => number;
  
  /**
   * Android alias for getRouteScript - matches Android RouteHelper.getRouteScript()
   * @androidName getRouteDescriptionText
   * @kotlinType fun getRouteDescriptionText(): String
   */
  getRouteDescriptionText?: () => string;
  
  /**
   * Get route items as Android-compatible array
   * @androidName getRouteItems
   * @kotlinType fun getRouteItems(): Array<RouteItem>
   */
  getRouteItems?: () => AndroidCompatibleRouteItemData[];
  
  /**
   * Convert current route to Android format
   * @androidName exportToAndroidFormat
   * @kotlinType fun exportToAndroidFormat(): String
   */
  exportToAndroidFormat?: () => string;
  
  /**
   * Import route from Android format
   * @androidName importFromAndroidFormat
   * @kotlinType fun importFromAndroidFormat(data: String): Boolean
   */
  importFromAndroidFormat?: (data: string) => boolean;

  // Utility functions
  [key: string]: any;
}

// Object class interfaces (inheritance: cCalcRoute < cRoute < cRouteList)

/**
 * RouteListWrapper - Base interface for route list operations
 * 
 * This is the foundation class in the inheritance hierarchy: cCalcRoute < cRoute < cRouteList.
 * Provides basic route container functionality with array-like operations for managing
 * collections of route segments.
 * 
 * @example Basic route list operations
 * ```typescript
 * // Create a new route list
 * const routeList = new module.cRouteList();
 * 
 * // Check route boundaries
 * const startId = routeList.startStationId();  // 東京駅: 1130101
 * const endId = routeList.lastStationId();     // 新大阪駅: 1160101
 * 
 * // Get route description
 * const description = routeList.routeScript(); // "東京 東海道線 新大阪"
 * 
 * // Array-like operations
 * const itemCount = routeList.count();        // Number of route segments
 * const firstItem = routeList.at(0);          // First route segment
 * routeList.remove(1);                        // Remove second segment
 * ```
 * 
 * @example Copying route lists
 * ```typescript
 * const originalRoute = new module.cRouteList();
 * const copyRoute = new module.cRouteList();
 * 
 * // Copy all route data from original to copy
 * copyRoute.assign(originalRoute);
 * ```
 * 
 * @interface RouteListWrapper
 * @since 1.0.0
 */
export interface RouteListWrapper {
  /**
   * Get the starting station ID of the route
   * 
   * @returns {number} Station ID of the first station in the route
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * // After building route: 東京 → 新大阪
   * const startId = route.startStationId(); // 1130101 (東京駅)
   * ```
   */
  startStationId(): number;
  
  /**
   * Get the ending station ID of the route
   * 
   * @returns {number} Station ID of the last station in the route
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * // After building route: 東京 → 新大阪
   * const endId = route.lastStationId(); // 1160101 (新大阪駅)
   * ```
   */
  lastStationId(): number;
  
  /**
   * Generate a human-readable description of the route
   * 
   * @returns {string} Route description showing stations and lines
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * // After building route: 東京 → 新大阪 via 東海道線
   * const script = route.routeScript(); // "東京 東海道線 新大阪"
   * 
   * // Complex route with multiple lines:
   * // 新宿 → 品川 → 新大阪
   * const complexScript = route.routeScript(); // "新宿 山手線 品川 東海道線 新大阪"
   * ```
   */
  routeScript(): string;
  
  // Essential RouteList operations (from CLAUDE.md specifications)
  
  /**
   * Remove all route segments from the list
   * 
   * Clears the entire route, resetting it to an empty state. This is equivalent
   * to creating a new route list.
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * // Build route: 東京 → 新大阪
   * route.addRoute(1130101); // 東京
   * route.addRoute(1160101); // 新大阪
   * 
   * console.log(route.count()); // 2
   * route.removeAll();
   * console.log(route.count()); // 0
   * ```
   */
  removeAll(): void;
  
  /**
   * Copy all route data from another RouteListWrapper
   * 
   * Performs a deep copy of all route segments, flags, and settings from the
   * source route list to this route list.
   * 
   * @param {RouteListWrapper} obj - Source route list to copy from
   * 
   * @example
   * ```typescript
   * const originalRoute = new module.cRouteList();
   * const copyRoute = new module.cRouteList();
   * 
   * // Build original route: 東京 → 大阪
   * originalRoute.setupRoute("東京 東海道線 大阪");
   * 
   * // Copy to new route
   * copyRoute.assign(originalRoute);
   * 
   * console.log(copyRoute.routeScript()); // "東京 東海道線 大阪"
   * ```
   */
  assign(obj: RouteListWrapper): void;
  
  // Enhanced array operations (Task 30 requirements)
  
  /**
   * Get the number of route segments in the list
   * 
   * @returns {number} Number of route segments (not stations)
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * 
   * // Single segment route: 東京 → 品川
   * route.setupRoute("東京 山手線 品川");
   * console.log(route.count()); // 1 (one segment)
   * 
   * // Multi-segment route: 新宿 → 品川 → 新大阪
   * route.setupRoute("新宿 山手線 品川 東海道線 新大阪");
   * console.log(route.count()); // 2 (two segments)
   * ```
   */
  count(): number;
  
  /**
   * Get route item at specified index with bounds checking
   * 
   * @param {number} index - Zero-based index of the route item to retrieve
   * @returns {RouteItemWrapper} Route item at the specified index
   * @throws {Error} When index is out of bounds
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * route.setupRoute("新宿 山手線 品川 東海道線 新大阪");
   * 
   * // Get first segment (新宿 → 品川 via 山手線)
   * const firstSegment = route.at(0);
   * console.log(firstSegment.lineId);    // 山手線のID
   * console.log(firstSegment.stationId); // 品川駅のID
   * 
   * // Get second segment (品川 → 新大阪 via 東海道線)
   * const secondSegment = route.at(1);
   * console.log(secondSegment.lineId);    // 東海道線のID
   * console.log(secondSegment.stationId); // 新大阪駅のID
   * ```
   */
  at(index: number): RouteItemWrapper;
  
  /**
   * Remove route item at specified index
   * 
   * @param {number} index - Zero-based index of the route item to remove
   * @throws {Error} When index is out of bounds
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * route.setupRoute("新宿 山手線 品川 東海道線 新大阪");
   * 
   * console.log(route.count()); // 2
   * route.remove(0); // Remove first segment (新宿 → 品川)
   * console.log(route.count()); // 1
   * console.log(route.routeScript()); // "品川 東海道線 新大阪"
   * ```
   */
  remove(index: number): void;
  
  /**
   * Insert route item at specified index
   * 
   * @param {number} index - Zero-based index where to insert the route item
   * @param {RouteItemWrapper} item - Route item to insert
   * @throws {Error} When index is out of bounds
   * 
   * @example
   * ```typescript
   * const route = new module.cRouteList();
   * const newItem = new module.cRouteItem();
   * newItem.stationId = 1130601; // 品川駅
   * newItem.lineId = 11302;      // 山手線
   * 
   * route.setupRoute("東京 東海道線 新大阪");
   * route.insert(0, newItem); // Insert at beginning
   * console.log(route.routeScript()); // Now includes 品川 segment
   * ```
   */
  insert(index: number, item: RouteItemWrapper): void;
}

/**
 * RouteWrapper - Enhanced route building and management interface
 * 
 * Extends RouteListWrapper with advanced route construction capabilities including
 * automatic routing, route reversal, and complex route setup from string descriptions.
 * This is the intermediate class in the hierarchy: cCalcRoute < cRoute < cRouteList.
 * 
 * @example Basic route construction
 * ```typescript
 * const route = new module.cRoute();
 * 
 * // Method 1: Add stations one by one
 * route.addRoute(1130101); // 東京駅
 * route.addRoute(1130601); // 品川駅
 * route.addRoute(1160101); // 新大阪駅
 * 
 * // Method 2: Add with specific line
 * route.addRouteWithLine(11301, 1130601); // 山手線で品川へ
 * 
 * console.log(route.routeScript()); // "東京 山手線 品川 東海道線 新大阪"
 * ```
 * 
 * @example Route setup from string
 * ```typescript
 * const route = new module.cRoute();
 * 
 * // Parse complete route description
 * route.setupRoute("新宿 山手線 品川 東海道線 新大阪");
 * 
 * console.log(route.getRouteCount());     // 2 segments
 * console.log(route.startStationId());    // 新宿駅ID
 * console.log(route.lastStationId());     // 新大阪駅ID
 * ```
 * 
 * @example Auto-routing and reversal
 * ```typescript
 * const route = new module.cRoute();
 * route.addRoute(1130101); // 東京
 * route.addRoute(1160101); // 新大阪
 * 
 * // Let system find optimal route
 * const autoResult = route.autoRoute();
 * if (autoResult === 0) {
 *   console.log("Auto-routing successful");
 *   console.log(route.routeScript());
 * }
 * 
 * // Reverse the route direction
 * if (route.isReverseAllow()) {
 *   route.reverseRoute();
 *   console.log("Reversed:", route.routeScript());
 * }
 * ```
 * 
 * @interface RouteWrapper
 * @extends RouteListWrapper
 * @since 1.0.0
 */
export interface RouteWrapper extends RouteListWrapper {
  /**
   * Add a station to the route using automatic line selection
   * 
   * Adds a station to the route allowing the system to automatically select
   * the most appropriate line connecting to the previous station. This is the
   * simplified version of route building.
   * 
   * @param {number} stationId - Station ID to add to the route
   * @returns {number} Result code (0 = success, non-zero = error)
   * 
   * @example Build route with automatic line selection
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Build route: 東京 → 品川 → 新大阪
   * let result = route.addRoute(1130101); // 東京駅
   * console.log(`東京追加: ${result}`);     // 0 (success)
   * 
   * result = route.addRoute(1130601);     // 品川駅 (system selects 山手線 or 東海道線)
   * console.log(`品川追加: ${result}`);     // 0 (success)
   * 
   * result = route.addRoute(1160101);     // 新大阪駅 (system selects 東海道線)
   * console.log(`新大阪追加: ${result}`);   // 0 (success)
   * 
   * console.log(route.routeScript());     // Shows selected route
   * ```
   * 
   * @example Error handling for unreachable stations
   * ```typescript
   * const route = new module.cRoute();
   * route.addRoute(1130101); // 東京駅
   * 
   * // Try to add unreachable station
   * const result = route.addRoute(9999999); // Invalid station ID
   * if (result !== 0) {
   *   console.log(`エラー: 駅を追加できませんでした (code: ${result})`);
   * }
   * ```
   */
  addRoute(stationId: number): number;
  
  /**
   * Add a station to the route using specific line selection
   * 
   * Adds a station to the route using the specified line ID. This method
   * provides precise control over the routing path when multiple lines
   * connect the same stations.
   * 
   * @param {number} lineId - Line ID to use for reaching the station
   * @param {number} stationId - Station ID to add to the route
   * @returns {number} Result code (0 = success, non-zero = error)
   * 
   * @example Precise route control with specific lines
   * ```typescript
   * const route = new module.cRoute();
   * route.addRoute(1130101); // 東京駅
   * 
   * // Force use of 山手線 to reach 品川 (instead of 東海道線)
   * let result = route.addRouteWithLine(11302, 1130601); // 山手線, 品川駅
   * console.log(`山手線経由品川: ${result}`);
   * 
   * // Then use 東海道線 to reach 新大阪
   * result = route.addRouteWithLine(11301, 1160101);     // 東海道線, 新大阪駅
   * console.log(`東海道線経由新大阪: ${result}`);
   * 
   * console.log(route.routeScript()); // "東京 山手線 品川 東海道線 新大阪"
   * ```
   * 
   * @example Compare routing options
   * ```typescript
   * const viaYamanote = new module.cRoute();
   * const viaTokaido = new module.cRoute();
   * 
   * // Route 1: 東京 → 品川 via 山手線
   * viaYamanote.addRoute(1130101);                        // 東京
   * viaYamanote.addRouteWithLine(11302, 1130601);         // 山手線 → 品川
   * 
   * // Route 2: 東京 → 品川 via 東海道線
   * viaTokaido.addRoute(1130101);                         // 東京
   * viaTokaido.addRouteWithLine(11301, 1130601);          // 東海道線 → 品川
   * 
   * console.log("山手線経由:", viaYamanote.routeScript());
   * console.log("東海道線経由:", viaTokaido.routeScript());
   * ```
   */
  addRouteWithLine(lineId: number, stationId: number): number;
  
  /**
   * Remove the last station from the route
   * 
   * Removes the final station and its connecting line segment from the route.
   * Useful for correcting mistakes or dynamically modifying routes.
   * 
   * @example Route correction
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Build route: 東京 → 品川 → 新大阪
   * route.addRoute(1130101); // 東京
   * route.addRoute(1130601); // 品川
   * route.addRoute(1160101); // 新大阪
   * 
   * console.log(route.getRouteCount());  // 2 segments
   * console.log(route.routeScript());    // "東京 ... 新大阪"
   * 
   * // Remove 新大阪, go to 横浜 instead
   * route.removeTail();
   * console.log(route.getRouteCount());  // 1 segment
   * 
   * route.addRoute(1130801);             // 横浜駅
   * console.log(route.routeScript());    // "東京 ... 横浜"
   * ```
   * 
   * @example Route building with backtracking
   * ```typescript
   * const route = new module.cRoute();
   * route.addRoute(1130101); // 東京
   * 
   * // Try different destinations
   * route.addRoute(1130601); // 品川
   * console.log("Route 1:", route.routeScript());
   * 
   * route.removeTail();      // Remove 品川
   * route.addRoute(1130701); // 渋谷
   * console.log("Route 2:", route.routeScript());
   * ```
   */
  removeTail(): void;
  
  /**
   * Automatically find the optimal route between start and end stations
   * 
   * Uses pathfinding algorithms to automatically determine the best route
   * between the first and last stations added to the route. This method
   * clears any intermediate stations and rebuilds the route optimally.
   * 
   * @returns {number} Result code (0 = success, non-zero = error)
   * 
   * @example Automatic route finding
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Set start and end points
   * route.addRoute(1130101); // 東京駅
   * route.addRoute(1160101); // 新大阪駅
   * 
   * // Let system find optimal route
   * const result = route.autoRoute();
   * if (result === 0) {
   *   console.log("自動経路探索成功");
   *   console.log(route.routeScript()); // Optimal route found
   *   console.log(`経路数: ${route.getRouteCount()}`);
   * } else {
   *   console.log(`自動経路探索失敗: ${result}`);
   * }
   * ```
   * 
   * @example Long-distance auto-routing
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Complex long-distance route
   * route.addRoute(1010101); // 札幌駅
   * route.addRoute(4610101); // 鹿児島中央駅
   * 
   * const result = route.autoRoute();
   * if (result === 0) {
   *   console.log("長距離自動経路:");
   *   console.log(route.routeScript());
   *   
   *   // Check each segment
   *   const count = route.getRouteCount();
   *   for (let i = 0; i < count; i++) {
   *     const item = route.getRouteItem(i);
   *     console.log(`区間${i+1}: Line${item.lineId} → Station${item.stationId}`);
   *   }
   * }
   * ```
   */
  autoRoute(): number;
  
  /**
   * Reverse the direction of the current route
   * 
   * Swaps the start and end stations and reverses all intermediate stations
   * to create the return journey route. Only works if the route is reversible.
   * 
   * @returns {number} Result code (0 = success, non-zero = error/not reversible)
   * 
   * @example Route reversal
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("東京 東海道線 新大阪");
   * 
   * console.log("往路:", route.routeScript()); // "東京 東海道線 新大阪"
   * 
   * if (route.isReverseAllow()) {
   *   const result = route.reverseRoute();
   *   if (result === 0) {
   *     console.log("復路:", route.routeScript()); // "新大阪 東海道線 東京"
   *   }
   * } else {
   *   console.log("この経路は復路作成できません");
   * }
   * ```
   * 
   * @example Complex route reversal
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("新宿 中央線 東京 東海道線 横浜");
   * 
   * console.log("往路:", route.routeScript());
   * 
   * const reverseResult = route.reverseRoute();
   * if (reverseResult === 0) {
   *   console.log("復路:", route.routeScript()); // "横浜 東海道線 東京 中央線 新宿"
   * }
   * ```
   */
  reverseRoute(): number;
  
  /**
   * Parse and setup route from string description
   * 
   * Parses a route description string in the format "駅名 路線名 駅名 路線名 駅名"
   * and builds the complete route automatically. This is the most convenient
   * method for creating routes from user input.
   * 
   * @param {string} route - Route description string in Japanese
   * @throws {Error} When route string format is invalid or stations/lines not found
   * 
   * @example Basic route setup
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Simple route: 東京 → 品川
   * route.setupRoute("東京 山手線 品川");
   * console.log(route.routeScript()); // "東京 山手線 品川"
   * console.log(route.getRouteCount()); // 1 segment
   * ```
   * 
   * @example Multi-segment route setup
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Complex route: 新宿 → 東京 → 横浜
   * route.setupRoute("新宿 中央線 東京 東海道線 横浜");
   * 
   * console.log(route.getRouteCount()); // 2 segments
   * console.log(route.startStationId()); // 新宿駅ID
   * console.log(route.lastStationId());  // 横浜駅ID
   * 
   * // Access individual segments
   * const segment1 = route.getRouteItem(0); // 新宿 → 東京 via 中央線
   * const segment2 = route.getRouteItem(1); // 東京 → 横浜 via 東海道線
   * ```
   * 
   * @example Error handling for invalid routes
   * ```typescript
   * const route = new module.cRoute();
   * 
   * try {
   *   // Invalid station name
   *   route.setupRoute("無効駅 山手線 東京");
   * } catch (error) {
   *   console.log(`経路設定エラー: ${error.message}`);
   * }
   * 
   * try {
   *   // Invalid line name
   *   route.setupRoute("東京 無効線 品川");
   * } catch (error) {
   *   console.log(`路線設定エラー: ${error.message}`);
   * }
   * ```
   */
  setupRoute(route: string): void;
  
  /**
   * Enable or disable detour routing
   * 
   * Controls whether the routing algorithm should consider detour paths
   * when building routes. When enabled, may find alternative routes that
   * avoid certain lines or stations.
   * 
   * @param {boolean} flag - true to enable detour routing, false to disable
   * 
   * @example Enable detour for alternative routing
   * ```typescript
   * const directRoute = new module.cRoute();
   * const detourRoute = new module.cRoute();
   * 
   * // Direct route
   * directRoute.setDetour(false);
   * directRoute.addRoute(1130101); // 東京
   * directRoute.addRoute(1160101); // 新大阪
   * directRoute.autoRoute();
   * console.log("直通:", directRoute.routeScript());
   * 
   * // Detour route (may find alternatives)
   * detourRoute.setDetour(true);
   * detourRoute.addRoute(1130101); // 東京
   * detourRoute.addRoute(1160101); // 新大阪
   * detourRoute.autoRoute();
   * console.log("迂回:", detourRoute.routeScript());
   * ```
   */
  setDetour(flag: boolean): void;
  
  /**
   * Enable or disable special fare rules processing
   * 
   * Controls whether special fare rules (Rule 88, Rule 114, etc.) should
   * be considered during route planning and fare calculation.
   * 
   * @param {boolean} flag - true to disable all rules, false to enable rules
   * 
   * @example Compare with and without special rules
   * ```typescript
   * const normalRoute = new module.cRoute();
   * const noRuleRoute = new module.cRoute();
   * 
   * // Normal route with special rules
   * normalRoute.setNoRule(false);
   * normalRoute.setupRoute("東京 東海道線 新大阪");
   * 
   * // Route without special rules
   * noRuleRoute.setNoRule(true);
   * noRuleRoute.setupRoute("東京 東海道線 新大阪");
   * 
   * console.log("通常ルール適用:", normalRoute.routeScript());
   * console.log("特別ルール無効:", noRuleRoute.routeScript());
   * ```
   */
  setNoRule(flag: boolean): void;
  
  /**
   * Get the total number of route segments
   * 
   * Returns the number of line segments in the current route. Each segment
   * represents a connection between two stations via a specific line.
   * 
   * @returns {number} Number of route segments (not stations)
   * 
   * @example Count route segments
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Single segment: 東京 → 品川
   * route.setupRoute("東京 山手線 品川");
   * console.log(route.getRouteCount()); // 1 segment
   * 
   * // Two segments: 新宿 → 東京 → 品川
   * route.setupRoute("新宿 中央線 東京 山手線 品川");
   * console.log(route.getRouteCount()); // 2 segments
   * 
   * // Three segments: 渋谷 → 新宿 → 東京 → 品川
   * route.setupRoute("渋谷 山手線 新宿 中央線 東京 山手線 品川");
   * console.log(route.getRouteCount()); // 3 segments
   * ```
   */
  getRouteCount(): number;
  
  /**
   * Get route item (segment) at specified index
   * 
   * Returns detailed information about a specific route segment including
   * station ID, line ID, and segment-specific data.
   * 
   * @param {number} index - Zero-based index of the route segment
   * @returns {RouteItemWrapper} Route item containing segment details
   * @throws {Error} When index is out of bounds
   * 
   * @example Access route segments
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("新宿 中央線 東京 東海道線 横浜");
   * 
   * const segmentCount = route.getRouteCount(); // 2
   * 
   * // Get first segment: 新宿 → 東京 via 中央線
   * const segment1 = route.getRouteItem(0);
   * console.log(`区間1: Line ${segment1.lineId} → Station ${segment1.stationId}`);
   * 
   * // Get second segment: 東京 → 横浜 via 東海道線
   * const segment2 = route.getRouteItem(1);
   * console.log(`区間2: Line ${segment2.lineId} → Station ${segment2.stationId}`);
   * ```
   * 
   * @example Iterate through all segments
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("渋谷 山手線 新宿 中央線 東京 東海道線 品川");
   * 
   * for (let i = 0; i < route.getRouteCount(); i++) {
   *   const item = route.getRouteItem(i);
   *   console.log(`区間${i+1}: ${item.getDisplayName()}`);
   * }
   * ```
   */
  getRouteItem(index: number): RouteItemWrapper;
  
  /**
   * Get the line ID of the last route segment
   * 
   * Returns the line ID used in the final segment of the route.
   * Useful for determining which line the route ends on.
   * 
   * @returns {number} Line ID of the last route segment
   * 
   * @example Check final line
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("新宿 中央線 東京 東海道線 品川");
   * 
   * const finalLineId = route.lastLineId();
   * console.log(`最終路線ID: ${finalLineId}`); // 東海道線のID
   * 
   * // Compare with first segment line
   * const firstItem = route.getRouteItem(0);
   * console.log(`最初路線ID: ${firstItem.lineId}`); // 中央線のID
   * ```
   */
  lastLineId(): number;
  
  /**
   * Check if the current route can be reversed
   * 
   * Determines whether the route is reversible based on the lines and
   * stations used. Some routes may not be reversible due to directional
   * restrictions or line configurations.
   * 
   * @returns {boolean} true if route can be reversed, false otherwise
   * 
   * @example Check route reversibility
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("東京 東海道線 新大阪");
   * 
   * if (route.isReverseAllow()) {
   *   console.log("この経路は復路作成可能");
   *   const reverseResult = route.reverseRoute();
   *   if (reverseResult === 0) {
   *     console.log("復路:", route.routeScript());
   *   }
   * } else {
   *   console.log("この経路は復路作成不可");
   * }
   * ```
   * 
   * @example Handle non-reversible routes
   * ```typescript
   * const route = new module.cRoute();
   * // Some complex routes may not be reversible
   * route.setupRoute("複雑な経路...");
   * 
   * if (!route.isReverseAllow()) {
   *   console.log("復路を手動で作成する必要があります");
   *   // Create return route manually
   * }
   * ```
   */
  isReverseAllow(): boolean;
  
  /**
   * Check if the route is complete/finalized
   * 
   * Determines whether the route building process is complete and
   * the route is ready for fare calculation.
   * 
   * @returns {boolean} true if route is complete, false if still building
   * 
   * @example Check route completion
   * ```typescript
   * const route = new module.cRoute();
   * 
   * console.log(route.isEnd()); // true (empty route is "ended")
   * 
   * route.addRoute(1130101); // 東京
   * console.log(route.isEnd()); // false (still building)
   * 
   * route.addRoute(1130601); // 品川
   * console.log(route.isEnd()); // false (could add more)
   * 
   * // After finalizing route somehow
   * // console.log(route.isEnd()); // true (route complete)
   * ```
   */
  isEnd(): boolean;
}

/**
 * CalcRouteWrapper - Advanced fare calculation and route optimization interface
 * 
 * The top-level interface in the inheritance hierarchy: cCalcRoute < cRoute < cRouteList.
 * Provides comprehensive fare calculation capabilities including special rules, discounts,
 * long-distance routing, and city-to-city pricing optimization.
 * 
 * @example Basic fare calculation
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * 
 * // Build route: 東京 → 新大阪 via 東海道線
 * calcRoute.setupRoute("東京 東海道線 新大阪");
 * 
 * // Calculate fare with default settings
 * const fareInfo = calcRoute.calcFare();
 * console.log(`運賃: ${fareInfo.fare}円`); // "運賃: 8910円"
 * 
 * // Display formatted fare information
 * const fareDisplay = calcRoute.showFare();
 * console.log(fareDisplay); // "東京→新大阪 8910円 (東海道線)"
 * ```
 * 
 * @example Long-distance route optimization
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * 
 * // Enable long-distance routing for complex routes
 * calcRoute.setLongRoute(true);
 * 
 * // Build complex route: 札幌 → 鹿児島中央
 * calcRoute.addRoute(1010101); // 札幌
 * calcRoute.addRoute(4610101); // 鹿児島中央
 * calcRoute.autoRoute();        // Auto-find optimal routing
 * 
 * console.log(`Long route enabled: ${calcRoute.isEnableLongRoute()}`); // true
 * 
 * const fareInfo = calcRoute.calcFare();
 * console.log(`長距離運賃: ${fareInfo.fare}円`);
 * console.log(`適用規則: Rule114=${fareInfo.isRule114Applied}`);
 * ```
 * 
 * @example City-to-city fare optimization
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * 
 * // Enable city-to-city pricing (特定都区市内)
 * calcRoute.setStartAsCity();  // 出発駅を都区市内扱い
 * calcRoute.setArriveAsCity(); // 到着駅を都区市内扱い
 * 
 * // Route: 東京都区内 → 大阪市内
 * calcRoute.setupRoute("東京 東海道線 新大阪");
 * 
 * const fareInfo = calcRoute.calcFare();
 * const fareJson = calcRoute.calcFareJson();
 * console.log(`都区市内運賃: ${fareInfo.fare}円`);
 * 
 * // JSON contains detailed fare breakdown
 * const parsed = JSON.parse(fareJson);
 * console.log(`特定都区市内適用: ${parsed.cityFareApplied}`);
 * ```
 * 
 * @example Stock discount and special fares
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * 
 * // Build route eligible for stock discounts
 * calcRoute.setupRoute("東京 東海道線 名古屋");
 * 
 * const fareInfo = calcRoute.calcFare();
 * 
 * // Check for available stock discounts
 * if (fareInfo.availCountForFareOfStockDiscount > 0) {
 *   console.log(`割引運賃数: ${fareInfo.availCountForFareOfStockDiscount}`);
 *   
 *   // Get specific discount fares
 *   for (let i = 0; i < fareInfo.availCountForFareOfStockDiscount; i++) {
 *     const discountFare = fareInfo.fareForStockDiscount(i);
 *     const discountTitle = fareInfo.fareForStockDiscountTitle(i);
 *     console.log(`${discountTitle}: ${discountFare}円`);
 *   }
 * }
 * ```
 * 
 * @interface CalcRouteWrapper
 * @extends RouteWrapper
 * @since 1.0.0
 */
export interface CalcRouteWrapper extends RouteWrapper {
  /**
   * Calculate the complete fare information for the current route
   * 
   * Executes comprehensive fare calculation including base fare, special rules,
   * stock discounts, and any applicable surcharges. This is the primary method
   * for obtaining detailed fare information.
   * 
   * @returns {FareInfoData} Complete fare calculation results with all details
   * 
   * @example Basic fare calculation
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("新宿 中央線 東京");
   * 
   * const fareInfo = calcRoute.calcFare();
   * console.log(`運賃: ${fareInfo.fare}円`);           // 160円
   * console.log(`計算結果: ${fareInfo.result}`);        // 0 (成功)
   * console.log(`出発駅: ${fareInfo.beginStationId}`);  // 新宿駅ID
   * console.log(`到着駅: ${fareInfo.endStationId}`);    // 東京駅ID
   * ```
   * 
   * @example Complex fare with special rules
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("品川 東海道線 熱海 東海道線 沼津");
   * 
   * const fareInfo = calcRoute.calcFare();
   * if (fareInfo.isRule114Applied) {
   *   console.log("Rule 114 (長距離逓減) が適用されました");
   * }
   * 
   * console.log(`経路: ${fareInfo.routeList}`);
   * ```
   */
  calcFare(): FareInfoData;
  
  /**
   * Calculate fare and return results as JSON string
   * 
   * Convenience method that performs fare calculation and returns the complete
   * results serialized as a JSON string. Useful for API responses and data storage.
   * 
   * @returns {string} JSON string containing complete fare calculation results
   * 
   * @example JSON fare calculation
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("渋谷 山手線 新橋 東海道線 川崎");
   * 
   * const fareJson = calcRoute.calcFareJson();
   * const fareData = JSON.parse(fareJson);
   * 
   * console.log(`運賃: ${fareData.fare}円`);
   * console.log(`経路: ${fareData.routeList}`);
   * console.log(`規則適用: ${fareData.isRule114Applied}`);
   * ```
   * 
   * @example API response usage
   * ```typescript
   * // Express.js API endpoint example
   * app.get('/api/fare/:route', (req, res) => {
   *   const calcRoute = new module.cCalcRoute();
   *   calcRoute.setupRoute(req.params.route);
   *   
   *   const fareJson = calcRoute.calcFareJson();
   *   res.setHeader('Content-Type', 'application/json');
   *   res.send(fareJson);
   * });
   * ```
   */
  calcFareJson(): string;
  
  /**
   * Generate human-readable fare display string
   * 
   * Creates a formatted string showing the route and fare information in a
   * user-friendly format suitable for display in applications.
   * 
   * @returns {string} Formatted fare display string in Japanese
   * 
   * @example Basic fare display
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("上野 山手線 東京");
   * 
   * const display = calcRoute.showFare();
   * console.log(display); // "上野→東京 160円 (山手線)"
   * ```
   * 
   * @example Complex route display
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("新宿 中央線 東京 東海道線 横浜");
   * 
   * const display = calcRoute.showFare();
   * console.log(display); // "新宿→横浜 550円 (中央線・東海道線)"
   * ```
   */
  showFare(): string;
  
  /**
   * Check if long-distance routing is currently enabled
   * 
   * Returns the current state of long-distance routing mode, which affects
   * how complex routes are calculated and optimized.
   * 
   * @returns {boolean} true if long-distance routing is enabled, false otherwise
   * 
   * @example Check long route status
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * console.log(calcRoute.isEnableLongRoute()); // false (default)
   * 
   * calcRoute.setLongRoute(true);
   * console.log(calcRoute.isEnableLongRoute()); // true
   * ```
   */
  isEnableLongRoute(): boolean;
  
  /**
   * Enable or disable long-distance routing optimization
   * 
   * Controls whether the route calculation should use long-distance optimization
   * algorithms. When enabled, the system can find more complex routing patterns
   * and apply long-distance fare rules like Rule 114.
   * 
   * @param {boolean} flag - true to enable long-distance routing, false to disable
   * 
   * @example Enable for cross-country routes
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * 
   * // For long routes like 東京 → 鹿児島, enable optimization
   * calcRoute.setLongRoute(true);
   * calcRoute.setupRoute("東京 東海道線 京都 山陽線 広島 鹿児島線 鹿児島中央");
   * 
   * const fareInfo = calcRoute.calcFare();
   * console.log(`長距離運賃: ${fareInfo.fare}円`);
   * ```
   * 
   * @example Disable for local routes
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * 
   * // For local routes, standard calculation is sufficient
   * calcRoute.setLongRoute(false);
   * calcRoute.setupRoute("渋谷 山手線 新宿");
   * 
   * const fareInfo = calcRoute.calcFare();
   * console.log(`近距離運賃: ${fareInfo.fare}円`); // 160円
   * ```
   */
  setLongRoute(flag: boolean): void;
  
  /**
   * Set departure station to be treated as city area (特定都区市内)
   * 
   * Enables special city-area pricing for the departure station. When enabled,
   * fares are calculated as if departing from the entire city area rather than
   * the specific station, often resulting in simplified pricing.
   * 
   * @example Tokyo Metropolitan Area departure
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * 
   * // Treat departure as "東京都区内" instead of specific station
   * calcRoute.setStartAsCity();
   * calcRoute.setupRoute("東京 東海道線 大阪");
   * 
   * const fareInfo = calcRoute.calcFare();
   * console.log("東京都区内発として計算されました");
   * console.log(`運賃: ${fareInfo.fare}円`);
   * ```
   * 
   * @example Compare city vs station pricing
   * ```typescript
   * const stationRoute = new module.cCalcRoute();
   * const cityRoute = new module.cCalcRoute();
   * 
   * // Station-specific pricing
   * stationRoute.setupRoute("品川 東海道線 新大阪");
   * const stationFare = stationRoute.calcFare();
   * 
   * // City-area pricing
   * cityRoute.setStartAsCity();
   * cityRoute.setupRoute("品川 東海道線 新大阪");
   * const cityFare = cityRoute.calcFare();
   * 
   * console.log(`駅発: ${stationFare.fare}円`);
   * console.log(`都区内発: ${cityFare.fare}円`);
   * ```
   */
  setStartAsCity(): void;
  
  /**
   * Set arrival station to be treated as city area (特定都区市内)
   * 
   * Enables special city-area pricing for the arrival station. When enabled,
   * fares are calculated as if arriving at the entire city area rather than
   * the specific station.
   * 
   * @example Osaka City Area arrival
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * 
   * // Treat arrival as "大阪市内" instead of specific station
   * calcRoute.setArriveAsCity();
   * calcRoute.setupRoute("東京 東海道線 新大阪");
   * 
   * const fareInfo = calcRoute.calcFare();
   * console.log("大阪市内着として計算されました");
   * console.log(`運賃: ${fareInfo.fare}円`);
   * ```
   * 
   * @example City-to-city pricing
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * 
   * // Enable both city area pricing
   * calcRoute.setStartAsCity();
   * calcRoute.setArriveAsCity();
   * calcRoute.setupRoute("東京 東海道線 新大阪");
   * 
   * const fareInfo = calcRoute.calcFare();
   * console.log("東京都区内→大阪市内として計算");
   * console.log(`都市間運賃: ${fareInfo.fare}円`);
   * ```
   */
  setArriveAsCity(): void;
}

/**
 * RouteItemWrapper - Individual route segment with detailed station and line information
 * 
 * Represents a single segment in a railway route containing station, line, fare, and
 * distance data. Based on CLAUDE.md specifications and C++ cRouteItem class.
 * This interface provides type-safe access to route segment information used in
 * fare calculations and route display.
 * 
 * @example Basic route item usage
 * ```typescript
 * const route = new module.cRoute();
 * route.setupRoute("東京 山手線 品川 東海道線 横浜");
 * 
 * // Get first segment: 東京 → 品川 via 山手線
 * const item1 = route.getRouteItem(0);
 * console.log(`駅ID: ${item1.stationId}`);     // 品川駅のID
 * console.log(`路線ID: ${item1.lineId}`);      // 山手線のID
 * console.log(`運賃: ${item1.fare}円`);        // 区間運賃
 * console.log(`距離: ${item1.salesKm}km`);     // 営業キロ
 * 
 * // Get display information
 * console.log(item1.getDisplayName());        // "品川 (山手線)"
 * console.log(item1.toString());              // Debug information
 * ```
 * 
 * @example Route analysis and debugging
 * ```typescript
 * const route = new module.cRoute();
 * route.setupRoute("新宿 中央線 東京 東海道線 新大阪");
 * 
 * console.log("Route Analysis:");
 * for (let i = 0; i < route.getRouteCount(); i++) {
 *   const item = route.getRouteItem(i);
 *   
 *   if (item.isValid()) {
 *     console.log(`区間 ${i+1}:`);
 *     console.log(`  到着駅: ${item.stationId}`);
 *     console.log(`  使用路線: ${item.lineId}`);
 *     console.log(`  区間運賃: ${item.fare}円`);
 *     console.log(`  営業キロ: ${item.salesKm}km`);
 *     console.log(`  フラグ: 0x${item.flag.toString(16)}`);
 *     console.log(`  表示名: ${item.getDisplayName()}`);
 *   } else {
 *     console.log(`区間 ${i+1}: 無効なデータ`);
 *   }
 * }
 * ```
 * 
 * @example Flag analysis for special conditions
 * ```typescript
 * const route = new module.cRoute();
 * route.setupRoute("東京 東海道線 新大阪"); // Long distance route
 * 
 * const item = route.getRouteItem(0);
 * 
 * // Check for special routing flags
 * if (item.flag & 0x01) console.log("特別ルール適用");
 * if (item.flag & 0x02) console.log("新幹線区間");
 * if (item.flag & 0x04) console.log("特定都区市内");
 * 
 * // Aggregate route analysis
 * if (item.indexOfAggregate >= 0) {
 *   console.log(`集約経路の一部 (index: ${item.indexOfAggregate})`);
 * }
 * ```
 * 
 * @interface RouteItemWrapper
 * @since 1.0.0
 */
export interface RouteItemWrapper {
  /**
   * Station ID at this route point
   * 
   * Identifies the destination station for this route segment. This is the station
   * ID where this segment ends (not where it starts).
   * 
   * @type {number} Station identifier from the railway database
   * 
   * @example Station ID usage
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("東京 山手線 品川");
   * 
   * const item = route.getRouteItem(0);
   * console.log(item.stationId); // 品川駅のID (1130601)
   * 
   * // Convert back to station name
   * const stationName = module.getStationName(item.stationId);
   * console.log(stationName); // "品川"
   * ```
   */
  stationId: number;
  
  /**
   * Line ID for this route segment
   * 
   * Identifies the railway line used to reach the destination station in this segment.
   * 
   * @type {number} Line identifier from the railway database
   * 
   * @example Line ID usage
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("新宿 中央線 東京");
   * 
   * const item = route.getRouteItem(0);
   * console.log(item.lineId); // 中央線のID (11303)
   * 
   * // Convert back to line name
   * const lineName = module.getLineName(item.lineId);
   * console.log(lineName); // "中央線"
   * ```
   */
  lineId: number;
  
  /**
   * Route-specific flags for this segment
   * 
   * Bitfield containing routing flags and special conditions that apply to this
   * specific route segment. Flags indicate special rules, route types, and
   * calculation modifiers.
   * 
   * @type {number} Bitfield containing routing flags and special conditions
   * 
   * @example Flag interpretation
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("東京 東海道線 新大阪");
   * 
   * const item = route.getRouteItem(0);
   * const flags = item.flag;
   * 
   * // Common flag interpretations (example values)
   * if (flags & 0x01) console.log("特別ルール適用");
   * if (flags & 0x02) console.log("新幹線利用可能");
   * if (flags & 0x04) console.log("特定都区市内適用");
   * if (flags & 0x08) console.log("長距離割引対象");
   * 
   * console.log(`フラグ値: 0x${flags.toString(16)}`);
   * ```
   */
  flag: number;
  
  /**
   * Calculated fare for this route segment
   * 
   * The fare amount in yen for this specific route segment. This may be a base
   * fare or include special rule modifications.
   * 
   * @type {number} Fare amount in yen for this segment
   * 
   * @example Fare analysis by segment
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("新宿 中央線 東京 東海道線 横浜");
   * 
   * let totalFare = 0;
   * for (let i = 0; i < route.getRouteCount(); i++) {
   *   const item = route.getRouteItem(i);
   *   console.log(`区間${i+1} 運賃: ${item.fare}円`);
   *   totalFare += item.fare;
   * }
   * 
   * console.log(`合計運賃: ${totalFare}円`);
   * 
   * // Compare with total calculation
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("新宿 中央線 東京 東海道線 横浜");
   * const fareInfo = calcRoute.calcFare();
   * console.log(`正式計算: ${fareInfo.fare}円`);
   * ```
   */
  fare: number;
  
  /**
   * Sales distance in kilometers for this segment
   * 
   * The distance used for fare calculation, which may differ from the actual
   * physical distance. This is the "営業キロ" (business kilometers) used by
   * Japanese railways for fare determination.
   * 
   * @type {number} Distance used for fare calculation (may differ from actual distance)
   * 
   * @example Distance analysis
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("東京 東海道線 新大阪");
   * 
   * const item = route.getRouteItem(0);
   * console.log(`営業キロ: ${item.salesKm}km`);
   * 
   * // Calculate fare per kilometer
   * if (item.salesKm > 0) {
   *   const farePerKm = item.fare / item.salesKm;
   *   console.log(`キロ単価: ${farePerKm.toFixed(2)}円/km`);
   * }
   * ```
   * 
   * @example Multi-segment distance
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("札幌 函館線 函館 津軽海峡線 本州");
   * 
   * let totalDistance = 0;
   * for (let i = 0; i < route.getRouteCount(); i++) {
   *   const item = route.getRouteItem(i);
   *   console.log(`区間${i+1}: ${item.salesKm}km`);
   *   totalDistance += item.salesKm;
   * }
   * 
   * console.log(`総距離: ${totalDistance}km`);
   * ```
   */
  salesKm: number;
  
  /**
   * Index in aggregate route calculation
   * 
   * Position index when this route item is part of an aggregate route calculation.
   * Used internally for complex route processing and fare rule applications.
   * 
   * @type {number} Position index when this item is part of an aggregate route
   * 
   * @example Aggregate route analysis
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("複雑な長距離経路...");
   * 
   * for (let i = 0; i < route.getRouteCount(); i++) {
   *   const item = route.getRouteItem(i);
   *   
   *   if (item.indexOfAggregate >= 0) {
   *     console.log(`区間${i+1}は集約経路の一部 (集約index: ${item.indexOfAggregate})`);
   *   } else {
   *     console.log(`区間${i+1}は独立区間`);
   *   }
   * }
   * ```
   */
  indexOfAggregate: number;
  
  /**
   * Check if this route item contains valid data
   * 
   * Validates that the route item has valid station and line IDs and can be
   * used for route calculations. Invalid items should not be used in fare
   * calculations or route display.
   * 
   * @returns {boolean} true if the route item has valid station and line IDs
   * 
   * @example Validate route items
   * ```typescript
   * const route = new module.cRoute();
   * 
   * try {
   *   route.setupRoute("東京 山手線 品川");
   *   
   *   for (let i = 0; i < route.getRouteCount(); i++) {
   *     const item = route.getRouteItem(i);
   *     
   *     if (item.isValid()) {
   *       console.log(`区間${i+1}: 有効 - ${item.getDisplayName()}`);
   *     } else {
   *       console.warn(`区間${i+1}: 無効なデータ`);
   *       console.warn(`  Station ID: ${item.stationId}`);
   *       console.warn(`  Line ID: ${item.lineId}`);
   *     }
   *   }
   * } catch (error) {
   *   console.error("経路設定エラー:", error.message);
   * }
   * ```
   * 
   * @example Error recovery with validation
   * ```typescript
   * const route = new module.cRoute();
   * 
   * // Build route with potential errors
   * route.addRoute(1130101); // 東京 (valid)
   * // Some error condition might create invalid items
   * 
   * // Filter valid items only
   * const validItems = [];
   * for (let i = 0; i < route.getRouteCount(); i++) {
   *   const item = route.getRouteItem(i);
   *   if (item.isValid()) {
   *     validItems.push(item);
   *   }
   * }
   * 
   * console.log(`有効区間数: ${validItems.length}`);
   * ```
   */
  isValid(): boolean;
  
  /**
   * Get display name for this route item
   * 
   * Returns a formatted display name showing station and line information
   * suitable for user interface display. The format typically includes
   * the station name and line name in a readable format.
   * 
   * @returns {string} Formatted display name showing station and line information
   * 
   * @example Display formatted route information
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("新宿 山手線 品川 東海道線 新大阪");
   * 
   * console.log("Route Display:");
   * for (let i = 0; i < route.getRouteCount(); i++) {
   *   const item = route.getRouteItem(i);
   *   console.log(`${i+1}. ${item.getDisplayName()}`);
   * }
   * 
   * // Example output:
   * // 1. 品川 (山手線)
   * // 2. 新大阪 (東海道線)
   * ```
   * 
   * @example Create route summary for UI
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("渋谷 山手線 新宿 中央線 東京");
   * 
   * const routeSummary = [];
   * routeSummary.push("渋谷"); // Starting station
   * 
   * for (let i = 0; i < route.getRouteCount(); i++) {
   *   const item = route.getRouteItem(i);
   *   routeSummary.push(`→ ${item.getDisplayName()}`);
   * }
   * 
   * console.log(routeSummary.join(" "));
   * // Output: "渋谷 → 新宿 (山手線) → 東京 (中央線)"
   * ```
   */
  getDisplayName(): string;
  
  /**
   * Get string representation of this route item
   * 
   * Returns a detailed string representation including all properties,
   * primarily intended for debugging and logging purposes. Contains
   * technical information about the route item state.
   * 
   * @returns {string} String representation for debugging and display purposes
   * 
   * @example Debug route items
   * ```typescript
   * const route = new module.cRoute();
   * route.setupRoute("東京 東海道線 新大阪");
   * 
   * const item = route.getRouteItem(0);
   * console.log("Route Item Debug Info:");
   * console.log(item.toString());
   * 
   * // Example output:
   * // RouteItem{stationId=1160101, lineId=11301, fare=8910, salesKm=515.4, flag=0x08, indexOfAggregate=-1}
   * ```
   * 
   * @example Log route construction process
   * ```typescript
   * const route = new module.cRoute();
   * 
   * console.log("Building route step by step:");
   * route.addRoute(1130101); // 東京
   * 
   * route.addRoute(1130601); // 品川
   * console.log("After adding 品川:");
   * console.log(route.getRouteItem(0).toString());
   * 
   * route.addRoute(1160101); // 新大阪
   * console.log("After adding 新大阪:");
   * console.log(route.getRouteItem(1).toString());
   * ```
   */
  toString(): string;
}

/**
 * RouteFlagWrapper interface for routing flags and fare calculation control
 * 
 * This interface provides type-safe access to the C++ RouteFlag class which
 * manages complex routing flags, special fare rules, and route calculation control.
 * All properties and methods correspond directly to the C++ implementation in alpdb.h.
 * 
 * @interface RouteFlagWrapper
 */
export interface RouteFlagWrapper {
  // === Boolean Properties (Route Flags) ===
  
  /**
   * Disable all special fare rules
   * @type {boolean} When true, disables all special rule processing
   */
  no_rule: boolean;
  
  /**
   * JR Tokai stock discount applied flag
   * @type {boolean} Indicates if JR Tokai stock discount has been applied
   */
  jrtokaistock_applied: boolean;
  
  /**
   * JR Tokai stock discount enable flag
   * @type {boolean} Enables JR Tokai stock discount calculation
   */
  jrtokaistock_enable: boolean;
  
  /**
   * Meihan city area flag
   * @type {boolean} Indicates route passes through Meihan city area
   */
  meihan_city_flag: boolean;
  
  /**
   * Rule 88 (special urban fare rule) applied
   * @type {boolean} Indicates if special urban area fare rule is applied
   */
  rule88: boolean;
  
  /**
   * Rule 69 (special connecting fare rule) applied
   * @type {boolean} Indicates if special connecting fare rule is applied
   */
  rule69: boolean;
  
  /**
   * Rule 70 (special route fare rule) applied
   * @type {boolean} Indicates if special route fare rule is applied
   */
  rule70: boolean;
  
  /**
   * Special fare enable flag
   * @type {boolean} Enables special fare calculation processing
   */
  special_fare_enable: boolean;
  
  /**
   * Rule 70 bullet train flag
   * @type {boolean} Special rule 70 application for bullet train routes
   */
  rule70bullet: boolean;
  
  /**
   * Rule 16-5 (special fare rule) applied
   * @type {boolean} Indicates if special fare rule 16-5 is applied
   */
  rule16_5: boolean;
  
  /**
   * Bullet line (Shinkansen) flag
   * @type {boolean} Indicates if route includes bullet train segments
   */
  bullet_line: boolean;
  
  /**
   * JR Tokai only route flag
   * @type {boolean} Indicates if route uses only JR Tokai lines
   */
  bJrTokaiOnly: boolean;
  
  /**
   * Meihan city enable flag
   * @type {boolean} Enables Meihan city area processing
   */
  meihan_city_enable: boolean;
  
  /**
   * Track mark control flag
   * @type {boolean} Controls special track marking processing
   */
  trackmarkctl: boolean;
  
  /**
   * Junction special route change flag
   * @type {boolean} Indicates special route change at junction
   */
  jctsp_route_change: boolean;
  
  /**
   * Terminal begin Osaka flag
   * @type {boolean} Indicates route begins at Osaka terminal
   */
  ter_begin_oosaka: boolean;
  
  /**
   * Terminal finish Osaka flag
   * @type {boolean} Indicates route ends at Osaka terminal
   */
  ter_fin_oosaka: boolean;
  
  /**
   * Company check flag
   * @type {boolean} Enables railway company boundary checking
   */
  compncheck: boolean;
  
  /**
   * Company pass flag
   * @type {boolean} Allows passing through different companies
   */
  compnpass: boolean;
  
  /**
   * Company DA (direct access) flag
   * @type {boolean} Enables direct access between companies
   */
  compnda: boolean;
  
  /**
   * Company begin flag
   * @type {boolean} Indicates route begins at company boundary
   */
  compnbegin: boolean;
  
  /**
   * Company end flag
   * @type {boolean} Indicates route ends at company boundary
   */
  compnend: boolean;
  
  /**
   * Company terminal flag
   * @type {boolean} Indicates route at company terminal station
   */
  compnterm: boolean;
  
  /**
   * Tokai Shinkansen flag
   * @type {boolean} Indicates route uses JR Tokai Shinkansen
   */
  tokai_shinkansen: boolean;
  
  /**
   * Not same Kokura-Hakata Shinzai flag
   * @type {boolean} Special flag for Kokura-Hakata route processing
   */
  notsamekokurahakatashinzai: boolean;
  
  /**
   * Route end flag
   * @type {boolean} Indicates if this is the end of the route
   */
  end: boolean;
  
  /**
   * Osaka Kanjo line one direction flag
   * @type {boolean} Indicates one-direction routing on Osaka loop line
   */
  osakakan_1dir: boolean;
  
  /**
   * Osaka Kanjo line two direction flag
   * @type {boolean} Indicates two-direction routing on Osaka loop line
   */
  osakakan_2dir: boolean;
  
  /**
   * Osaka Kanjo line detour flag
   * @type {boolean} Indicates detour routing on Osaka loop line
   */
  osakakan_detour: boolean;
  
  
  // === Numeric Properties ===
  
  /**
   * Rule 86/87 control flags
   * @type {number} Bitfield controlling rule 86 and 87 application (BYTE)
   */
  rule86or87: number;
  
  /**
   * Rule 115 control value
   * @type {number} Controls special rule 115 application (int8_t)
   */
  rule115: number;
  
  /**
   * Urban nearest station control
   * @type {number} Controls urban area nearest station logic (int8_t)
   */
  urban_neerest: number;
  
  /**
   * Osaka Kanjo line pass control
   * @type {number} Controls Osaka loop line pass-through logic (unsigned char)
   */
  osakaKanPass: number;
  
  
  // === Core Management Methods ===
  
  /**
   * Clear all routing flags to default state
   * Resets all boolean flags to false and numeric values to 0
   * @returns {void}
   */
  clear(): void;
  
  /**
   * Copy flags from another RouteFlag instance
   * @param {RouteFlagWrapper} other - Source RouteFlag to copy from
   * @returns {void}
   */
  setAnotherRouteFlag(other: RouteFlagWrapper): void;
  
  /**
   * Check if any special rules are enabled
   * @returns {boolean} true if special rules are active, false if disabled
   */
  rule_en(): boolean;
  
  /**
   * Enable or disable all special fare rules
   * @param {boolean} b_rule - true to disable rules, false to enable
   * @returns {void}
   */
  setNoRule(b_rule: boolean): void;
  
  // === Long Route Management ===
  
  /**
   * Check if long route calculation is enabled
   * @returns {boolean} true if long route calculation is enabled
   */
  isEnableLongRoute(): boolean;
  
  /**
   * Check if current route qualifies as long route
   * @returns {boolean} true if route is considered long route
   */
  isLongRoute(): boolean;
  
  /**
   * Enable or disable long route processing
   * @param {boolean} farflag - true to enable long route, false to disable
   * @returns {void}
   */
  setLongRoute(farflag: boolean): void;
  
  // === Rule 115 Management ===
  
  /**
   * Check if Rule 115 (special terminal rule) is enabled
   * @returns {boolean} true if Rule 115 is enabled
   */
  isEnableRule115(): boolean;
  
  /**
   * Check if Rule 115 applies to specific terminal
   * @returns {boolean} true if Rule 115 specific terminal is active
   */
  isRule115specificTerm(): boolean;
  
  /**
   * Enable or disable Rule 115 for specific terminal
   * @param {boolean} ena - true to enable specific terminal Rule 115
   * @returns {void}
   */
  setSpecificTermRule115(ena: boolean): void;
  
  // === City Area Management ===
  
  /**
   * Set starting station as city area station
   * Affects urban area fare calculation rules
   * @returns {void}
   */
  setStartAsCity(): void;
  
  /**
   * Set arrival station as city area station
   * Affects urban area fare calculation rules
   * @returns {void}
   */
  setArriveAsCity(): void;
  
  // === Rule 86/87 Management ===
  
  /**
   * Disable Rules 86 and 87 (special urban area rules)
   * @returns {void}
   */
  setDisableRule86or87(): void;
  
  /**
   * Enable Rules 86 and 87 (special urban area rules)
   * @returns {void}
   */
  setEnableRule86or87(): void;
  
  /**
   * Check if Rules 86/87 are enabled
   * @returns {boolean} true if Rules 86/87 are enabled
   */
  isEnableRule86or87(): boolean;
  
  // === Rule Availability Checks ===
  
  /**
   * Check if either Rule 86 or Rule 87 is available for application
   * @returns {boolean} true if Rule 86 or 87 can be applied
   */
  isAvailableRule86or87(): boolean;
  
  /**
   * Check if Rule 86 (Tokyo urban area special rule) is available
   * @returns {boolean} true if Rule 86 can be applied
   */
  isAvailableRule86(): boolean;
  
  /**
   * Check if Rule 87 (Osaka urban area special rule) is available
   * @returns {boolean} true if Rule 87 can be applied
   */
  isAvailableRule87(): boolean;
  
  /**
   * Check if Rule 88 (special urban fare rule) is available
   * @returns {boolean} true if Rule 88 can be applied
   */
  isAvailableRule88(): boolean;
  
  /**
   * Check if Rule 70 (special route fare rule) is available
   * @returns {boolean} true if Rule 70 can be applied
   */
  isAvailableRule70(): boolean;
  
  /**
   * Check if Rule 69 (special connecting fare rule) is available
   * @returns {boolean} true if Rule 69 can be applied
   */
  isAvailableRule69(): boolean;
  
  /**
   * Check if Rule 115 (special terminal rule) is available
   * @returns {boolean} true if Rule 115 can be applied
   */
  isAvailableRule115(): boolean;
  
  /**
   * Check if Rule 16-5 (special fare rule) is available
   * @returns {boolean} true if Rule 16-5 can be applied
   */
  isAvailableRule16_5(): boolean;
  
  // === Additional Utility Methods ===
  
  /**
   * Check if Meihan city area processing is enabled
   * @returns {boolean} true if Meihan city area is enabled
   */
  isMeihanCityEnable(): boolean;
  
  /**
   * Check if arrival station is set as city area
   * @returns {boolean} true if arrival station is city area
   */
  isArriveAsCity(): boolean;
  
  /**
   * Check if starting station is set as city area
   * @returns {boolean} true if starting station is city area
   */
  isStartAsCity(): boolean;
  
  // === Osaka Kanjo Line Management ===
  
  /**
   * Get Osaka Kanjo line pass value
   * @returns {number} Current Osaka Kanjo pass value
   */
  getOsakaKanPassValue(): number;
  
  /**
   * Check if route uses Osaka Kanjo line one-pass routing
   * @returns {boolean} true if one-pass routing is active
   */
  is_osakakan_1pass(): boolean;
  
  /**
   * Check if route uses Osaka Kanjo line two-pass routing
   * @returns {boolean} true if two-pass routing is active
   */
  is_osakakan_2pass(): boolean;
  
  /**
   * Check if route uses Osaka Kanjo line no-pass routing
   * @returns {boolean} true if no-pass routing is active
   */
  is_osakakan_nopass(): boolean;
  
  /**
   * Set Osaka Kanjo line pass configuration
   * @param {number} pass - Pass configuration value
   * @returns {void}
   */
  setOsakaKanPass(pass: number): void;
  
  /**
   * Get Osaka Kanjo line pass configuration
   * @returns {number} Current pass configuration
   */
  getOsakaKanPass(): number;
  
  /**
   * Set Osaka Kanjo flag from value
   * @param {number} flag - Flag value to set
   * @returns {void}
   */
  setOsakaKanFlag(flag: number): void;
  
  /**
   * Set Osaka Kanjo flag from another wrapper
   * @param {RouteFlagWrapper} other - Source wrapper to copy from
   * @returns {void}
   */
  setOsakaKanFlagFromWrapper(other: RouteFlagWrapper): void;
  
  /**
   * Set Osaka Kanjo pass value
   * @param {number} value - Pass value to set
   * @returns {void}
   */
  setOsakaKanPassValue(value: number): void;
  
  // === Route Analysis Methods ===
  
  /**
   * Check if route is a round trip
   * @returns {boolean} true if route is round trip
   */
  isRoundTrip(): boolean;
  
  /**
   * Check if route involves terminal city connections
   * @returns {boolean} true if terminal city connections are involved
   */
  isTerCity(): boolean;
  
  /**
   * Check if route uses bullet train (Shinkansen)
   * @returns {boolean} true if bullet train is used
   */
  isUseBullet(): boolean;
  
  /**
   * Check if route includes company line connections
   * @returns {boolean} true if company lines are included
   */
  isIncludeCompanyLine(): boolean;
  
  // === Reset Methods ===
  
  /**
   * Reset terminal city flags
   * @returns {void}
   */
  terCityReset(): void;
  
  /**
   * Reset option flags
   * @returns {void}
   */
  optionFlagReset(): void;
  
  // === Getter Methods for All Boolean Properties ===
  
  /**
   * Get no_rule flag value
   * @returns {boolean} Current no_rule flag value
   */
  getNoRule(): boolean;
  
  /**
   * Get JR Tokai stock applied flag value
   * @returns {boolean} Current jrtokaistock_applied flag value
   */
  getJrTokaiStockApplied(): boolean;
  
  /**
   * Get JR Tokai stock enable flag value
   * @returns {boolean} Current jrtokaistock_enable flag value
   */
  getJrTokaiStockEnable(): boolean;
  
  /**
   * Get Meihan city flag value
   * @returns {boolean} Current meihan_city_flag value
   */
  getMeihanCityFlag(): boolean;
  
  /**
   * Get Rule 88 flag value
   * @returns {boolean} Current rule88 flag value
   */
  getRule88(): boolean;
  
  /**
   * Get Rule 69 flag value
   * @returns {boolean} Current rule69 flag value
   */
  getRule69(): boolean;
  
  /**
   * Get Rule 70 flag value
   * @returns {boolean} Current rule70 flag value
   */
  getRule70(): boolean;
  
  /**
   * Get special fare enable flag value
   * @returns {boolean} Current special_fare_enable flag value
   */
  getSpecialFareEnable(): boolean;
  
  /**
   * Get Rule 70 bullet flag value
   * @returns {boolean} Current rule70bullet flag value
   */
  getRule70Bullet(): boolean;
  
  /**
   * Get Rule 16-5 flag value
   * @returns {boolean} Current rule16_5 flag value
   */
  getRule16_5(): boolean;
  
  /**
   * Get bullet line flag value
   * @returns {boolean} Current bullet_line flag value
   */
  getBulletLine(): boolean;
  
  /**
   * Get JR Tokai only flag value
   * @returns {boolean} Current bJrTokaiOnly flag value
   */
  getBJrTokaiOnly(): boolean;
  
  /**
   * Get Meihan city enable flag value
   * @returns {boolean} Current meihan_city_enable flag value
   */
  getMeihanCityEnable(): boolean;
  
  /**
   * Get track mark control flag value
   * @returns {boolean} Current trackmarkctl flag value
   */
  getTrackmarkctl(): boolean;
  
  /**
   * Get junction special route change flag value
   * @returns {boolean} Current jctsp_route_change flag value
   */
  getJctspRouteChange(): boolean;
  
  /**
   * Get terminal begin Osaka flag value
   * @returns {boolean} Current ter_begin_oosaka flag value
   */
  getTerBeginOosaka(): boolean;
  
  /**
   * Get terminal finish Osaka flag value
   * @returns {boolean} Current ter_fin_oosaka flag value
   */
  getTerFinOosaka(): boolean;
  
  /**
   * Get company check flag value
   * @returns {boolean} Current compncheck flag value
   */
  getCompncheck(): boolean;
  
  /**
   * Get company pass flag value
   * @returns {boolean} Current compnpass flag value
   */
  getCompnpass(): boolean;
  
  /**
   * Get company DA flag value
   * @returns {boolean} Current compnda flag value
   */
  getCompnda(): boolean;
  
  /**
   * Get company begin flag value
   * @returns {boolean} Current compnbegin flag value
   */
  getCompnbegin(): boolean;
  
  /**
   * Get company end flag value
   * @returns {boolean} Current compnend flag value
   */
  getCompnend(): boolean;
  
  /**
   * Get company terminal flag value
   * @returns {boolean} Current compnterm flag value
   */
  getCompnterm(): boolean;
  
  /**
   * Get Tokai Shinkansen flag value
   * @returns {boolean} Current tokai_shinkansen flag value
   */
  getTokaiShinkansen(): boolean;
  
  /**
   * Get not same Kokura-Hakata Shinzai flag value
   * @returns {boolean} Current notsamekokurahakatashinzai flag value
   */
  getNotsamekokurahakatashinzai(): boolean;
  
  /**
   * Get end flag value
   * @returns {boolean} Current end flag value
   */
  getEnd(): boolean;
  
  /**
   * Get Osaka Kanjo one direction flag value
   * @returns {boolean} Current osakakan_1dir flag value
   */
  getOsakakan1dir(): boolean;
  
  /**
   * Get Osaka Kanjo two direction flag value
   * @returns {boolean} Current osakakan_2dir flag value
   */
  getOsakakan2dir(): boolean;
  
  /**
   * Get Osaka Kanjo detour flag value
   * @returns {boolean} Current osakakan_detour flag value
   */
  getOsakakanDetour(): boolean;
  
  // === Getter Methods for Numeric Properties ===
  
  /**
   * Get Rule 86/87 control value
   * @returns {number} Current rule86or87 value
   */
  getRule86or87(): number;
  
  /**
   * Get Rule 115 control value
   * @returns {number} Current rule115 value
   */
  getRule115(): number;
  
  /**
   * Get urban nearest control value
   * @returns {number} Current urban_neerest value
   */
  getUrbanNeerest(): number;
  
  // === Setter Methods for All Boolean Properties ===
  
  /**
   * Set JR Tokai stock applied flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setJrTokaiStockApplied(value: boolean): void;
  
  /**
   * Set JR Tokai stock enable flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setJrTokaiStockEnable(value: boolean): void;
  
  /**
   * Set Meihan city flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setMeihanCityFlag(value: boolean): void;
  
  /**
   * Set Rule 88 flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setRule88(value: boolean): void;
  
  /**
   * Set Rule 69 flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setRule69(value: boolean): void;
  
  /**
   * Set Rule 70 flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setRule70(value: boolean): void;
  
  /**
   * Set special fare enable flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setSpecialFareEnable(value: boolean): void;
  
  /**
   * Set Rule 70 bullet flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setRule70Bullet(value: boolean): void;
  
  /**
   * Set Rule 16-5 flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setRule16_5(value: boolean): void;
  
  /**
   * Set bullet line flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setBulletLine(value: boolean): void;
  
  /**
   * Set JR Tokai only flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setBJrTokaiOnly(value: boolean): void;
  
  /**
   * Set Meihan city enable flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setMeihanCityEnable(value: boolean): void;
  
  /**
   * Set track mark control flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setTrackmarkctl(value: boolean): void;
  
  /**
   * Set junction special route change flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setJctspRouteChange(value: boolean): void;
  
  /**
   * Set terminal begin Osaka flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setTerBeginOosaka(value: boolean): void;
  
  /**
   * Set terminal finish Osaka flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setTerFinOosaka(value: boolean): void;
  
  /**
   * Set company check flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setCompncheck(value: boolean): void;
  
  /**
   * Set company pass flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setCompnpass(value: boolean): void;
  
  /**
   * Set company DA flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setCompnda(value: boolean): void;
  
  /**
   * Set company begin flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setCompnbegin(value: boolean): void;
  
  /**
   * Set company end flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setCompnend(value: boolean): void;
  
  /**
   * Set company terminal flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setCompnterm(value: boolean): void;
  
  /**
   * Set Tokai Shinkansen flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setTokaiShinkansen(value: boolean): void;
  
  /**
   * Set not same Kokura-Hakata Shinzai flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setNotsamekokurahakatashinzai(value: boolean): void;
  
  /**
   * Set end flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setEnd(value: boolean): void;
  
  /**
   * Set Osaka Kanjo one direction flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setOsakakan1dir(value: boolean): void;
  
  /**
   * Set Osaka Kanjo two direction flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setOsakakan2dir(value: boolean): void;
  
  /**
   * Set Osaka Kanjo detour flag
   * @param {boolean} value - Flag value to set
   * @returns {void}
   */
  setOsakakanDetour(value: boolean): void;
  
  // === Setter Methods for Numeric Properties ===
  
  /**
   * Set Rule 86/87 control value
   * @param {number} value - Control value to set
   * @returns {void}
   */
  setRule86or87(value: number): void;
  
  /**
   * Set Rule 115 control value
   * @param {number} value - Control value to set
   * @returns {void}
   */
  setRule115(value: number): void;
  
  /**
   * Set urban nearest control value
   * @param {number} value - Control value to set
   * @returns {void}
   */
  setUrbanNeerest(value: number): void;
}

/**
 * FareInfoData - Comprehensive fare calculation results and route information
 * 
 * Contains detailed results from fare calculations including the base fare,
 * special rules applied, discount information, and route details. This interface
 * represents the complete output of fare calculation operations.
 * 
 * @example Basic fare calculation result
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * calcRoute.setupRoute("東京 山手線 品川");
 * 
 * const fareInfo = calcRoute.calcFare();
 * console.log(`運賃: ${fareInfo.fare}円`);                    // 160円
 * console.log(`計算結果: ${fareInfo.result}`);                // 0 (成功)
 * console.log(`出発駅ID: ${fareInfo.beginStationId}`);        // 東京駅ID
 * console.log(`到着駅ID: ${fareInfo.endStationId}`);          // 品川駅ID
 * console.log(`経路: ${fareInfo.routeList}`);                 // "東京 山手線 品川"
 * ```
 * 
 * @example Long-distance route with special rules
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * calcRoute.setupRoute("東京 東海道線 新大阪");
 * 
 * const fareInfo = calcRoute.calcFare();
 * console.log(`長距離運賃: ${fareInfo.fare}円`);              // 8910円
 * 
 * if (fareInfo.isRule114Applied) {
 *   console.log("Rule 114 (長距離逓減制) が適用されました");
 * }
 * 
 * console.log(`計算コード: ${fareInfo.result}`);              // 0 = 正常終了
 * console.log(`経路詳細: ${fareInfo.routeList}`);
 * ```
 * 
 * @example Stock discount analysis
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * calcRoute.setupRoute("東京 東海道線 名古屋");
 * 
 * const fareInfo = calcRoute.calcFare();
 * 
 * // Check for available stock discounts
 * if (fareInfo.availCountForFareOfStockDiscount > 0) {
 *   console.log(`利用可能な割引運賃: ${fareInfo.availCountForFareOfStockDiscount}種類`);
 *   
 *   // Access stock discount methods (if available)
 *   if (typeof fareInfo.fareForStockDiscount === 'function') {
 *     for (let i = 0; i < fareInfo.availCountForFareOfStockDiscount; i++) {
 *       const discountFare = fareInfo.fareForStockDiscount(i);
 *       const discountTitle = fareInfo.fareForStockDiscountTitle(i);
 *       console.log(`${discountTitle}: ${discountFare}円`);
 *     }
 *   }
 * } else {
 *   console.log("割引運賃の設定はありません");
 * }
 * ```
 * 
 * @example Error handling for calculation failures
 * ```typescript
 * const calcRoute = new module.cCalcRoute();
 * 
 * try {
 *   calcRoute.setupRoute("無効な経路設定");
 *   const fareInfo = calcRoute.calcFare();
 *   
 *   if (fareInfo.result !== 0) {
 *     console.error(`運賃計算エラー (code: ${fareInfo.result})`);
 *     console.error(`経路: ${fareInfo.routeList}`);
 *   } else {
 *     console.log(`計算成功: ${fareInfo.fare}円`);
 *   }
 * } catch (error) {
 *   console.error("経路設定エラー:", error.message);
 * }
 * ```
 * 
 * @interface FareInfoData
 * @since 1.0.0
 */
export interface FareInfoData {
  /**
   * Calculation result code
   * 
   * Indicates the success or failure status of the fare calculation.
   * A value of 0 indicates successful calculation, while non-zero values
   * indicate various error conditions.
   * 
   * @type {number} Result code (0 = success, non-zero = error)
   * 
   * @example Check calculation result
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("東京 山手線 品川");
   * 
   * const fareInfo = calcRoute.calcFare();
   * 
   * switch (fareInfo.result) {
   *   case 0:
   *     console.log("運賃計算成功");
   *     console.log(`運賃: ${fareInfo.fare}円`);
   *     break;
   *   case -1:
   *     console.error("経路が見つかりません");
   *     break;
   *   case -2:
   *     console.error("駅データエラー");
   *     break;
   *   default:
   *     console.error(`計算エラー (code: ${fareInfo.result})`);
   * }
   * ```
   */
  result: number;
  
  /**
   * Calculated fare amount in yen
   * 
   * The total fare for the route in Japanese yen. This includes base fare
   * and any applicable special rules, discounts, or surcharges.
   * 
   * @type {number} Total fare amount in yen
   * 
   * @example Fare amount usage
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * 
   * // Local route fare
   * calcRoute.setupRoute("新宿 山手線 渋谷");
   * let fareInfo = calcRoute.calcFare();
   * console.log(`近距離運賃: ${fareInfo.fare}円`); // 160円
   * 
   * // Long-distance route fare
   * calcRoute.setupRoute("東京 東海道線 新大阪");
   * fareInfo = calcRoute.calcFare();
   * console.log(`長距離運賃: ${fareInfo.fare}円`); // 8910円
   * 
   * // Calculate fare per kilometer
   * const route = new module.cRoute();
   * route.setupRoute("東京 東海道線 新大阪");
   * const item = route.getRouteItem(0);
   * if (item.salesKm > 0) {
   *   const farePerKm = fareInfo.fare / item.salesKm;
   *   console.log(`キロ単価: ${farePerKm.toFixed(2)}円/km`);
   * }
   * ```
   */
  fare: number;
  
  /**
   * Rule 114 (long-distance reduction) application status
   * 
   * Indicates whether Rule 114 (長距離逓減制) was applied to the fare calculation.
   * This special rule provides fare reductions for long-distance travel exceeding
   * certain distance thresholds.
   * 
   * @type {boolean} true if Rule 114 was applied, false otherwise
   * 
   * @example Rule 114 detection
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * 
   * // Short route - Rule 114 not applicable
   * calcRoute.setupRoute("東京 山手線 品川");
   * let fareInfo = calcRoute.calcFare();
   * console.log(`短距離 Rule114: ${fareInfo.isRule114Applied}`); // false
   * 
   * // Long route - Rule 114 may be applied
   * calcRoute.setupRoute("東京 東海道線 京都 山陽線 広島");
   * fareInfo = calcRoute.calcFare();
   * if (fareInfo.isRule114Applied) {
   *   console.log("長距離逓減制が適用されました");
   *   console.log(`割引運賃: ${fareInfo.fare}円`);
   * } else {
   *   console.log("通常運賃が適用されました");
   * }
   * ```
   * 
   * @example Compare with and without Rule 114
   * ```typescript
   * const normalRoute = new module.cCalcRoute();
   * const noRuleRoute = new module.cCalcRoute();
   * 
   * const routeString = "東京 東海道線 新大阪";
   * 
   * // Normal calculation with rules
   * normalRoute.setupRoute(routeString);
   * const normalFare = normalRoute.calcFare();
   * 
   * // Calculation without special rules
   * noRuleRoute.setNoRule(true);
   * noRuleRoute.setupRoute(routeString);
   * const noRuleFare = noRuleRoute.calcFare();
   * 
   * console.log(`通常運賃: ${normalFare.fare}円 (Rule114: ${normalFare.isRule114Applied})`);
   * console.log(`ルール無効: ${noRuleFare.fare}円 (Rule114: ${noRuleFare.isRule114Applied})`);
   * ```
   */
  isRule114Applied: boolean;
  
  /**
   * Number of available stock discount fares
   * 
   * Indicates how many different stock discount fare options are available
   * for this route. Stock discounts are special promotional fares offered
   * by railway companies.
   * 
   * @type {number} Count of available stock discount options
   * 
   * @example Stock discount enumeration
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("東京 東海道線 名古屋");
   * 
   * const fareInfo = calcRoute.calcFare();
   * 
   * console.log(`通常運賃: ${fareInfo.fare}円`);
   * console.log(`利用可能割引数: ${fareInfo.availCountForFareOfStockDiscount}`);
   * 
   * if (fareInfo.availCountForFareOfStockDiscount > 0) {
   *   console.log("利用可能な割引運賃:");
   *   
   *   // Note: actual discount methods depend on implementation
   *   for (let i = 0; i < fareInfo.availCountForFareOfStockDiscount; i++) {
   *     console.log(`  割引${i+1}: 詳細は fareForStockDiscount() で取得`);
   *   }
   * } else {
   *   console.log("この経路には割引運賃の設定はありません");
   * }
   * ```
   * 
   * @example Filter routes with discounts
   * ```typescript
   * const routes = [
   *   "東京 山手線 品川",
   *   "東京 東海道線 名古屋",
   *   "新宿 中央線 立川"
   * ];
   * 
   * console.log("割引対象経路:");
   * routes.forEach((routeStr, index) => {
   *   const calcRoute = new module.cCalcRoute();
   *   calcRoute.setupRoute(routeStr);
   *   const fareInfo = calcRoute.calcFare();
   *   
   *   if (fareInfo.availCountForFareOfStockDiscount > 0) {
   *     console.log(`${index+1}. ${routeStr} (${fareInfo.availCountForFareOfStockDiscount}種類の割引)`);
   *   }
   * });
   * ```
   */
  availCountForFareOfStockDiscount: number;
  
  /**
   * Starting station ID for the calculated route
   * 
   * The station ID where the route begins. This corresponds to the first
   * station added to the route or parsed from the route string.
   * 
   * @type {number} Station ID of the departure station
   * 
   * @example Route endpoint analysis
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("新宿 中央線 東京 東海道線 横浜");
   * 
   * const fareInfo = calcRoute.calcFare();
   * 
   * // Get station names from IDs
   * const startName = module.getStationName(fareInfo.beginStationId);
   * const endName = module.getStationName(fareInfo.endStationId);
   * 
   * console.log(`${startName}駅(${fareInfo.beginStationId}) → ${endName}駅(${fareInfo.endStationId})`);
   * console.log(`運賃: ${fareInfo.fare}円`);
   * console.log(`経路: ${fareInfo.routeList}`);
   * ```
   * 
   * @example Validate route endpoints
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.addRoute(1130101); // 東京駅
   * calcRoute.addRoute(1130601); // 品川駅
   * 
   * const fareInfo = calcRoute.calcFare();
   * 
   * // Verify endpoints match expectations
   * const expectedStart = 1130101; // 東京駅ID
   * const expectedEnd = 1130601;   // 品川駅ID
   * 
   * if (fareInfo.beginStationId === expectedStart && fareInfo.endStationId === expectedEnd) {
   *   console.log("経路設定が正しく認識されました");
   * } else {
   *   console.warn("経路設定に問題があります");
   *   console.warn(`期待: ${expectedStart} → ${expectedEnd}`);
   *   console.warn(`実際: ${fareInfo.beginStationId} → ${fareInfo.endStationId}`);
   * }
   * ```
   */
  beginStationId: number;
  
  /**
   * Ending station ID for the calculated route
   * 
   * The station ID where the route ends. This corresponds to the last
   * station added to the route or parsed from the route string.
   * 
   * @type {number} Station ID of the arrival station
   * 
   * @example Route distance calculation
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("東京 東海道線 新大阪");
   * 
   * const fareInfo = calcRoute.calcFare();
   * 
   * console.log(`出発: ${module.getStationName(fareInfo.beginStationId)}`);
   * console.log(`到着: ${module.getStationName(fareInfo.endStationId)}`);
   * console.log(`運賃: ${fareInfo.fare}円`);
   * 
   * // Get route details for distance
   * const route = new module.cRoute();
   * route.setupRoute("東京 東海道線 新大阪");
   * const item = route.getRouteItem(0);
   * console.log(`距離: ${item.salesKm}km`);
   * ```
   */
  endStationId: number;
  
  /**
   * Detailed route description string
   * 
   * A string representation of the complete route including stations and lines.
   * This provides a human-readable description of the path taken for the
   * fare calculation.
   * 
   * @type {string} Human-readable route description
   * 
   * @example Route description usage
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("新宿 山手線 品川 東海道線 横浜");
   * 
   * const fareInfo = calcRoute.calcFare();
   * 
   * console.log("運賃計算結果:");
   * console.log(`経路: ${fareInfo.routeList}`);
   * console.log(`運賃: ${fareInfo.fare}円`);
   * console.log(`出発: ${module.getStationName(fareInfo.beginStationId)}`);
   * console.log(`到着: ${module.getStationName(fareInfo.endStationId)}`);
   * ```
   * 
   * @example Parse route information
   * ```typescript
   * const calcRoute = new module.cCalcRoute();
   * calcRoute.setupRoute("渋谷 山手線 新宿 中央線 東京");
   * 
   * const fareInfo = calcRoute.calcFare();
   * 
   * // Extract route components from description
   * const routeParts = fareInfo.routeList.split(' ');
   * console.log("経路分析:");
   * for (let i = 0; i < routeParts.length; i += 2) {
   *   const station = routeParts[i];
   *   const line = routeParts[i + 1];
   *   if (line) {
   *     console.log(`${station} → ${line}`);
   *   } else {
   *     console.log(`${station} (到着)`);
   *   }
   * }
   * ```
   * 
   * @example Route comparison
   * ```typescript
   * const routes = [
   *   "東京 山手線 品川",
   *   "東京 東海道線 品川"
   * ];
   * 
   * console.log("経路比較:");
   * routes.forEach((routeStr, index) => {
   *   const calcRoute = new module.cCalcRoute();
   *   calcRoute.setupRoute(routeStr);
   *   const fareInfo = calcRoute.calcFare();
   *   
   *   console.log(`${index+1}. ${fareInfo.routeList}`);
   *   console.log(`   運賃: ${fareInfo.fare}円`);
   * });
   * ```
   */
  routeList: string;
  
  /**
   * Additional properties for extended fare information
   * 
   * Allows for additional properties that may be added by specific implementations
   * or extensions. This provides flexibility for future enhancements without
   * breaking interface compatibility.
   * 
   * @type {Record<string, any>} Additional properties as key-value pairs
   */
  [key: string]: any;
}

// ===============================
// Android Kotlin Compatibility Layer
// Task 23: Android-compatible method signatures and data type mappings
// Requirements: REQ-OBJ-005
// ===============================

/**
 * Enhanced data type annotations for Android Kotlin compatibility
 * Maps TypeScript number types to appropriate Kotlin types with validation
 */
export interface AndroidDataTypeMapping {
  /** Station ID - maps to Kotlin Int (32-bit signed) */
  '@StationId': number;
  
  /** Line ID - maps to Kotlin Int (32-bit signed) */
  '@LineId': number;
  
  /** Company ID - maps to Kotlin Int (32-bit signed) */
  '@CompanyId': number;
  
  /** Prefecture ID - maps to Kotlin Int (32-bit signed) */
  '@PrefectureId': number;
  
  /** Fare amount in yen - maps to Kotlin Int (32-bit signed) */
  '@FareAmount': number;
  
  /** Distance in kilometers - maps to Kotlin Double (64-bit float) */
  '@DistanceKm': number;
  
  /** Route calculation result code - maps to Kotlin Int (32-bit signed) */
  '@ResultCode': number;
  
  /** Boolean flag - maps to Kotlin Boolean */
  '@BooleanFlag': boolean;
  
  /** Japanese text - maps to Kotlin String (UTF-8) */
  '@JapaneseText': string;
  
  /** Array of station IDs - maps to Kotlin IntArray */
  '@StationIdArray': number[];
  
  /** Array of line IDs - maps to Kotlin IntArray */
  '@LineIdArray': number[];
  
  /** Timestamp - maps to Kotlin Long (Unix timestamp in milliseconds) */
  '@Timestamp': number;
  
  /** Route segment flags - maps to Kotlin Int (bitfield) */
  '@RouteFlags': number;
  
  /** JSON object - maps to Kotlin Map<String, Any> */
  '@JsonObject': Record<string, any>;
  
  /** Optional nullable value - maps to Kotlin nullable types */
  '@Nullable': any;
  
  /** Enum value - maps to Kotlin enum ordinal Int */
  '@EnumValue': number;
  
  /** UUID string - maps to Kotlin String (UUID format) */
  '@UUID': string;
  
  /** Base64 encoded data - maps to Kotlin ByteArray */
  '@Base64Data': string;
  
  /** Error code - maps to Kotlin sealed class or enum */
  '@ErrorCode': string | number;
}

/**
 * Enhanced FareInfoData interface with Android Kotlin compatibility
 * Extends base interface with Android-compatible method signatures and serialization helpers
 */
export interface AndroidCompatibleFareInfoData extends FareInfoData {
  // === Android Kotlin Method Name Aliases ===
  
  /**
   * Android alias for fare property
   * @androidName fare
   * @kotlinType Int
   */
  getFare?(): number;
  
  /**
   * Android alias for result property  
   * @androidName result
   * @kotlinType Int
   */
  getResult?(): number;
  
  /**
   * Android alias for beginStationId property
   * @androidName beginStationId
   * @kotlinType Int
   */
  getBeginStationId?(): number;
  
  /**
   * Android alias for endStationId property
   * @androidName endStationId
   * @kotlinType Int
   */
  getEndStationId?(): number;
  
  /**
   * Android alias for isRule114Applied property
   * @androidName isRule114Applied  
   * @kotlinType Boolean
   */
  getIsRule114Applied?(): boolean;
  
  /**
   * Android alias for availCountForFareOfStockDiscount property
   * @androidName availCountForFareOfStockDiscount
   * @kotlinType Int
   */
  getAvailCountForFareOfStockDiscount?(): number;
  
  /**
   * Android alias for routeList property
   * @androidName routeList
   * @kotlinType String
   */
  getRouteList?(): string;
  
  // === Stock Discount Methods (Android FareInfo.kt compatible) ===
  
  /**
   * Get stock discount fare by index
   * Compatible with Android FareInfo.fareForStockDiscount(index)
   * @param index Discount index (0-3)
   * @androidName fareForStockDiscount
   * @kotlinType fun fareForStockDiscount(index: Int): Int
   */
  fareForStockDiscount?(index: number): number;
  
  /**
   * Get stock discount title by index
   * Compatible with Android FareInfo.fareForStockDiscountTitle(index)  
   * @param index Discount index (0-1)
   * @androidName fareForStockDiscountTitle
   * @kotlinType fun fareForStockDiscountTitle(index: Int): String
   */
  fareForStockDiscountTitle?(index: number): string;
  
  // === Cross-Platform Serialization Methods ===
  
  /**
   * Serialize to JSON format compatible with Android Kotlin
   * Ensures proper data type conversions for cross-platform exchange
   * @androidName toJson
   * @kotlinType fun toJson(): String
   */
  toAndroidJson?(): string;
  
  /**
   * Create instance from Android-compatible JSON
   * Handles data type mapping from Kotlin to TypeScript
   * @param json Android-compatible JSON string
   * @androidName fromJson
   * @kotlinType companion object { fun fromJson(json: String): FareInfo }
   */
  fromAndroidJson?(json: string): AndroidCompatibleFareInfoData;
  
  /**
   * Validate compatibility with Android data structure
   * @androidName validateCompatibility
   * @kotlinType fun validateCompatibility(): ValidationResult
   */
  validateAndroidCompatibility?(): AndroidCompatibilityResult;
}

/**
 * Android compatibility validation result
 * Matches Android ValidationResult structure
 */
export interface AndroidCompatibilityResult {
  /** Compatibility status - maps to Kotlin Boolean */
  isValid: boolean;
  
  /** Error messages array */
  errors: string[];
  
  /** Warning messages array */
  warnings: string[];
  
  /** Android-compatible error code - maps to Kotlin Int */
  errorCode?: number;
  
  /** Summary message - maps to Kotlin String */
  summary: string;
}

/**
 * Enhanced RouteWrapper interface with Android Kotlin compatibility
 * Adds method name aliases and data type annotations
 */
export interface AndroidCompatibleRouteWrapper extends RouteWrapper {
  // === Android RouteHelper.kt Method Name Aliases ===
  
  /**
   * Android alias for addRoute method
   * @androidName addStation
   * @kotlinType fun addStation(stationId: Int): Int
   */
  addStation?(stationId: number): number;
  
  /**
   * Android alias for addRouteWithLine method  
   * @androidName addRouteWithLine
   * @kotlinType fun addRouteWithLine(lineId: Int, stationId: Int): Int
   */
  addRouteWithLineId?(lineId: number, stationId: number): number;
  
  /**
   * Android alias for removeTail method
   * @androidName removeLast
   * @kotlinType fun removeLast(): Unit
   */
  removeLast?(): void;
  
  /**
   * Android alias for removeAll method
   * @androidName clear
   * @kotlinType fun clear(): Unit
   */
  clear?(): void;
  
  /**
   * Android alias for getRouteCount method
   * @androidName size
   * @kotlinType fun size(): Int
   */
  size?(): number;
  
  /**
   * Android alias for routeScript method
   * @androidName getRouteDescription
   * @kotlinType fun getRouteDescription(): String
   */
  getRouteDescription?(): string;
  
  /**
   * Android alias for startStationId method
   * @androidName getFirstStationId
   * @kotlinType fun getFirstStationId(): Int
   */
  getFirstStationId?(): number;
  
  /**
   * Android alias for lastStationId method  
   * @androidName getLastStationId
   * @kotlinType fun getLastStationId(): Int
   */
  getLastStationId?(): number;
  
  // === Android Data Type Annotations ===
  
  /**
   * Get route as Android-compatible station ID array
   * @androidName getStationIds
   * @kotlinType fun getStationIds(): IntArray
   */
  getStationIds?(): number[];
  
  /**
   * Get route as Android-compatible line ID array
   * @androidName getLineIds  
   * @kotlinType fun getLineIds(): IntArray
   */
  getLineIds?(): number[];
  
  // === Cross-Platform Serialization ===
  
  /**
   * Export route to Android-compatible format
   * @androidName toAndroidRoute
   * @kotlinType fun toAndroidRoute(): AndroidRoute
   */
  toAndroidRoute?(): AndroidRouteData;
  
  /**
   * Import route from Android-compatible format
   * @param androidRoute Android route data
   * @androidName fromAndroidRoute
   * @kotlinType companion object { fun fromAndroidRoute(route: AndroidRoute): Route }
   */
  fromAndroidRoute?(androidRoute: AndroidRouteData): void;
}

/**
 * Enhanced Android-compatible route data structure
 * Matches Android Route data class structure with additional metadata
 */
export interface AndroidRouteData {
  /** Array of station IDs - maps to Kotlin IntArray */
  stationIds: number[];
  
  /** Array of line IDs - maps to Kotlin IntArray */
  lineIds: number[];
  
  /** Route description text - maps to Kotlin String */
  description: string;
  
  /** Route flags - maps to Kotlin Int */
  flags: number;
  
  /** Route metadata - maps to Kotlin Map<String, Any> */
  metadata?: Record<string, any>;
  
  /** Route creation timestamp - maps to Kotlin Long */
  createdAt?: number;
  
  /** Route last modified timestamp - maps to Kotlin Long */
  modifiedAt?: number;
  
  /** Route version for compatibility checking - maps to Kotlin Int */
  version?: number;
  
  /** Route unique identifier - maps to Kotlin String */
  routeId?: string;
  
  /** Total route distance in kilometers - maps to Kotlin Double */
  totalDistanceKm?: number;
  
  /** Calculated fare amount - maps to Kotlin Int */
  calculatedFare?: number;
  
  /** Route validation status - maps to Kotlin Boolean */
  isValid?: boolean;
  
  /** Array of route segment details */
  segments?: AndroidRouteSegmentData[];
}

/**
 * Android-compatible route segment data
 */
export interface AndroidRouteSegmentData {
  /** Segment station ID - maps to Kotlin Int */
  stationId: number;
  
  /** Segment line ID - maps to Kotlin Int */
  lineId: number;
  
  /** Segment sequence number - maps to Kotlin Int */
  sequence: number;
  
  /** Segment distance in kilometers - maps to Kotlin Double */
  distanceKm?: number;
  
  /** Segment fare amount - maps to Kotlin Int */
  segmentFare?: number;
  
  /** Segment flags - maps to Kotlin Int */
  flags?: number;
}

/**
 * Android-compatible route item data
 */
export interface AndroidCompatibleRouteItemData {
  /** Station ID at this route point - maps to Kotlin Int */
  stationId: number;
  
  /** Line ID for this route segment - maps to Kotlin Int */
  lineId: number;
  
  /** Route-specific flags - maps to Kotlin Int */
  flag: number;
  
  /** Calculated fare for segment - maps to Kotlin Int */
  fare: number;
  
  /** Sales distance in kilometers - maps to Kotlin Double */
  salesKm: number;
  
  /** Index in aggregate route - maps to Kotlin Int */
  indexOfAggregate: number;
  
  /** Station name - maps to Kotlin String */
  stationName?: string;
  
  /** Line name - maps to Kotlin String */
  lineName?: string;
  
  /** Item validity status - maps to Kotlin Boolean */
  isValid?: boolean;
  
  /** Display name for UI - maps to Kotlin String */
  displayName?: string;
}

/**
 * Enhanced CalcRouteWrapper interface with Android compatibility
 * Adds fare calculation method aliases
 */
export interface AndroidCompatibleCalcRouteWrapper extends CalcRouteWrapper {
  // === Android FareCalculator Method Aliases ===
  
  /**
   * Android alias for calcFare method
   * @androidName calculateFare
   * @kotlinType fun calculateFare(): FareInfo
   */
  calculateFare?(): AndroidCompatibleFareInfoData;
  
  /**
   * Android alias for calcFareJson method
   * @androidName calculateFareJson
   * @kotlinType fun calculateFareJson(): String  
   */
  calculateFareJson?(): string;
  
  /**
   * Android alias for showFare method
   * @androidName getFareDisplay
   * @kotlinType fun getFareDisplay(): String
   */
  getFareDisplay?(): string;
  
  /**
   * Android alias for setLongRoute method
   * @androidName enableLongRoute
   * @kotlinType fun enableLongRoute(enable: Boolean): Unit
   */
  enableLongRoute?(enable: boolean): void;
  
  /**
   * Android alias for isEnableLongRoute method
   * @androidName isLongRouteEnabled
   * @kotlinType fun isLongRouteEnabled(): Boolean
   */
  isLongRouteEnabled?(): boolean;
  
  // === Android-specific Calculation Options ===
  
  /**
   * Set calculation mode for Android compatibility
   * @param mode Calculation mode
   * @androidName setCalculationMode
   * @kotlinType fun setCalculationMode(mode: CalculationMode): Unit
   */
  setCalculationMode?(mode: 'normal' | 'express' | 'discount'): void;
  
  /**
   * Get available calculation options
   * @androidName getCalculationOptions
   * @kotlinType fun getCalculationOptions(): List<String>
   */
  getCalculationOptions?(): string[];
}

/**
 * Android utility class compatibility interface
 * Maps to Android cRouteUtil static methods
 */
export interface AndroidRouteUtilCompat {
  // === Android RouteHelper.kt Static Method Aliases ===
  
  /**
   * Android alias for getStationId
   * @androidName findStationByName
   * @kotlinType fun findStationByName(name: String): Int
   */
  findStationByName(name: string): number;
  
  /**
   * Android alias for getStationName
   * @androidName getStationName
   * @kotlinType fun getStationName(id: Int): String
   */
  getStationNameById(id: number): string;
  
  /**
   * Android alias for getKanaFromStationId
   * @androidName getStationReading
   * @kotlinType fun getStationReading(id: Int): String
   */
  getStationReading(id: number): string;
  
  /**
   * Android alias for lineName
   * @androidName getLineName  
   * @kotlinType fun getLineName(id: Int): String
   */
  getLineNameById(id: number): string;
  
  /**
   * Android alias for isJunction
   * @androidName isJunctionStation
   * @kotlinType fun isJunctionStation(stationId: Int): Boolean
   */
  isJunctionStation(stationId: number): boolean;
  
  /**
   * Android alias for enumLineOfStationId
   * @androidName getLinesAtStation
   * @kotlinType fun getLinesAtStation(stationId: Int): IntArray
   */
  getLinesAtStation(stationId: number): number[];
  
  /**
   * Android alias for stationsIdsOfLineId
   * @androidName getStationsOnLine
   * @kotlinType fun getStationsOnLine(lineId: Int): IntArray
   */
  getStationsOnLine(lineId: number): number[];
  
  /**
   * Android alias for getJRCompanys
   * @androidName getJRCompanyIds
   * @kotlinType fun getJRCompanyIds(): IntArray
   */
  getJRCompanyIds(): number[];
  
  /**
   * Android alias for getPrefects
   * @androidName getPrefectureIds
   * @kotlinType fun getPrefectureIds(): IntArray
   */
  getPrefectureIds(): number[];
  
  /**
   * Android alias for companyOrPrefectName
   * @androidName getCompanyOrPrefectureName
   * @kotlinType fun getCompanyOrPrefectureName(id: Int): String
   */
  getCompanyOrPrefectureName(id: number): string;
  
  /**
   * Batch convert station names to IDs for improved performance
   * @androidName batchGetStationIds
   * @kotlinType fun batchGetStationIds(names: Array<String>): IntArray
   */
  batchGetStationIds(names: string[]): number[];
  
  /**
   * Batch convert station IDs to names for improved performance
   * @androidName batchGetStationNames
   * @kotlinType fun batchGetStationNames(ids: IntArray): Array<String>
   */
  batchGetStationNames(ids: number[]): string[];
  
  /**
   * Get detailed station information as Android-compatible object
   * @androidName getStationDetails
   * @kotlinType fun getStationDetails(id: Int): StationDetails
   */
  getStationDetails(id: number): AndroidStationDetails;
  
  /**
   * Get detailed line information as Android-compatible object
   * @androidName getLineDetails
   * @kotlinType fun getLineDetails(id: Int): LineDetails
   */
  getLineDetails(id: number): AndroidLineDetails;
  
  /**
   * Validate route segments for Android compatibility
   * @androidName validateRouteSegments
   * @kotlinType fun validateRouteSegments(segments: Array<RouteSegment>): ValidationResult
   */
  validateRouteSegments(segments: AndroidRouteSegmentData[]): AndroidCompatibilityResult;
  
  /**
   * Create optimized lookup cache for frequent operations
   * @androidName createLookupCache
   * @kotlinType fun createLookupCache(): Unit
   */
  createLookupCache(): void;
  
  /**
   * Clear lookup cache to free memory
   * @androidName clearLookupCache
   * @kotlinType fun clearLookupCache(): Unit
   */
  clearLookupCache(): void;
}

/**
 * Android-compatible station details structure
 */
export interface AndroidStationDetails {
  /** Station ID - maps to Kotlin Int */
  id: number;
  
  /** Station name - maps to Kotlin String */
  name: string;
  
  /** Station reading (hiragana) - maps to Kotlin String */
  reading?: string;
  
  /** Prefecture ID - maps to Kotlin Int */
  prefectureId?: number;
  
  /** Prefecture name - maps to Kotlin String */
  prefectureName?: string;
  
  /** Lines serving this station - maps to Kotlin IntArray */
  lineIds: number[];
  
  /** Is junction station - maps to Kotlin Boolean */
  isJunction: boolean;
  
  /** Latitude coordinate - maps to Kotlin Double */
  latitude?: number;
  
  /** Longitude coordinate - maps to Kotlin Double */
  longitude?: number;
}

/**
 * Android-compatible line details structure
 */
export interface AndroidLineDetails {
  /** Line ID - maps to Kotlin Int */
  id: number;
  
  /** Line name - maps to Kotlin String */
  name: string;
  
  /** Company ID - maps to Kotlin Int */
  companyId: number;
  
  /** Company name - maps to Kotlin String */
  companyName: string;
  
  /** Stations on this line - maps to Kotlin IntArray */
  stationIds: number[];
  
  /** Line color code - maps to Kotlin String */
  colorCode?: string;
  
  /** Line type (JR/Private/Subway) - maps to Kotlin String */
  lineType?: string;
  
  /** Total line distance - maps to Kotlin Double */
  totalDistanceKm?: number;
}

/**
 * Enhanced cross-platform serialization helper methods
 * Handles comprehensive data type conversions between TypeScript and Kotlin
 * with validation, error handling, and performance optimizations
 */
export class AndroidSerializationHelper {
  /**
   * Convert TypeScript number to Kotlin Int (32-bit signed integer)
   * Handles overflow/underflow by clamping to Int range
   */
  static toKotlinInt(value: number): number {
    const INT_MAX = 2147483647;
    const INT_MIN = -2147483648;
    return Math.max(INT_MIN, Math.min(INT_MAX, Math.floor(value)));
  }
  
  /**
   * Convert TypeScript number to Kotlin Long (64-bit signed integer)  
   * For large station/line IDs that exceed Int range
   */
  static toKotlinLong(value: number): number {
    // JavaScript number is already 64-bit, just ensure integer
    return Math.floor(value);
  }
  
  /**
   * Convert TypeScript number to Kotlin Double
   * For distance and fare calculations requiring decimal precision
   */
  static toKotlinDouble(value: number): number {
    return Number(value);
  }
  
  /**
   * Convert TypeScript boolean to Kotlin Boolean
   * Ensures proper boolean conversion
   */
  static toKotlinBoolean(value: any): boolean {
    return Boolean(value);
  }
  
  /**
   * Convert TypeScript string to Kotlin String
   * Handles null/undefined values
   */
  static toKotlinString(value: any): string {
    return String(value || '');
  }
  
  /**
   * Convert TypeScript number array to Kotlin IntArray
   * Converts each element to Kotlin Int with proper bounds checking
   */
  static toKotlinIntArray(values: number[]): number[] {
    return values.map(v => this.toKotlinInt(v));
  }
  
  /**
   * Create Android-compatible JSON with proper data type annotations
   * Ensures all numeric values are properly typed for Kotlin deserialization
   */
  static createAndroidCompatibleJson(data: Record<string, any>): string {
    const androidData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Apply data type conversions based on key patterns
      if (key.includes('StationId') || key.includes('LineId') || key.includes('CompanyId')) {
        androidData[key] = this.toKotlinInt(value);
      } else if (key.includes('Km') || key.includes('Distance')) {
        androidData[key] = this.toKotlinDouble(value);
      } else if (key.includes('fare') || key.includes('Fare')) {
        androidData[key] = this.toKotlinInt(value);
      } else if (typeof value === 'boolean') {
        androidData[key] = this.toKotlinBoolean(value);
      } else if (typeof value === 'string') {
        androidData[key] = this.toKotlinString(value);
      } else if (Array.isArray(value) && value.every(v => typeof v === 'number')) {
        androidData[key] = this.toKotlinIntArray(value);
      } else {
        androidData[key] = value;
      }
    }
    
    return JSON.stringify(androidData);
  }
  
  /**
   * Parse Android-compatible JSON with data type validation
   * Validates data types match expected Kotlin types
   */
  static parseAndroidCompatibleJson(json: string): Record<string, any> {
    try {
      const data = JSON.parse(json);
      
      // Validate and convert data types
      for (const [key, value] of Object.entries(data)) {
        if (key.includes('StationId') || key.includes('LineId') || key.includes('CompanyId')) {
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            throw new Error(`Invalid type for ${key}: expected integer, got ${typeof value}`);
          }
        }
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to parse Android-compatible JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Configuration management interfaces
export interface CLIConfiguration {
  debug: boolean;
  verbose: boolean;
  wasmPath?: string | undefined;
  platform: NodeJS.Platform;
  nodeVersion: string;
  memoryMonitoring: boolean;
  androidCompatibilityMode?: boolean;
  enableCaching?: boolean;
  maxCacheSize?: number;
  serializationFormat?: 'json' | 'binary' | 'compact';
  validateTypes?: boolean;
  includeTypeHints?: boolean;
}

export interface EnvironmentValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  configuration: CLIConfiguration;
  requiredFiles: RequiredFileInfo[];
}

export interface ValidationError {
  code: CLIErrorCode;
  message: string;
  filePath?: string;
  suggestions: string[];
}

export interface ValidationWarning {
  message: string;
  suggestion?: string;
}

export interface RequiredFileInfo {
  path: string;
  description: string;
  exists: boolean;
  readable: boolean;
  size?: number;
  lastModified?: Date;
}

export interface MemoryUsageStats {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface PlatformInfo {
  platform: NodeJS.Platform;
  arch: string;
  cpus: number;
  totalMemory: number;
  freeMemory: number;
  nodeVersion: string;
  setupInstructions: string[];
}

// CLI command options
export interface CLIOptions {
  exec?: boolean;
  verbose?: boolean;
  help?: boolean;
}

// Test execution result
export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  executionTime?: number;
}

// Test suite configuration
export interface TestSuite {
  name: string;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  description: string;
  execute: (module: FarertModule) => Promise<TestResult>;
}

// Error code classification system for robust error handling
// Based on requirements REQ-CLI-003.1, REQ-CLI-003.2, REQ-CLI-003.4
export enum CLIErrorCode {
  // Generic errors (1-9)
  GENERIC_ERROR = 1,
  INVALID_ARGUMENTS = 2,
  FILE_NOT_FOUND = 3,
  PERMISSION_DENIED = 4,
  
  // WebAssembly errors (10-19)
  WASM_MODULE_NOT_FOUND = 10,
  WASM_LOAD_FAILED = 11,
  WASM_INVALID_MODULE = 12,
  WASM_RUNTIME_ERROR = 13,
  WASM_MEMORY_ERROR = 14,
  
  // Database errors (20-29)
  DB_INIT_FAILED = 20,
  DB_CONNECTION_FAILED = 21,
  DB_CORRUPT = 22,
  DB_VERSION_MISMATCH = 23,
  DB_FILE_MISSING = 24,
  
  // Input validation errors (30-39)
  INVALID_STATION_NAME = 30,
  INVALID_LINE_NAME = 31,
  INVALID_ROUTE_FORMAT = 32,
  EMPTY_PARAMETER = 33,
  PARAMETER_COUNT_MISMATCH = 34,
  
  // System errors (40-49)
  NODE_VERSION_ERROR = 40,
  ENVIRONMENT_ERROR = 41,
  JAVASCRIPT_EXCEPTION = 42,
  UNHANDLED_REJECTION = 43,
  SYSTEM_RESOURCE_ERROR = 44,
  CONFIGURATION_ERROR = 45,
  
  // Test execution errors (50-59)
  TEST_SUITE_FAILED = 50,
  TEST_CASE_FAILED = 51,
  TEST_DATA_INVALID = 52,
  TEST_ASSERTION_ERROR = 53,
  
  // Route calculation errors (60-69)
  ROUTE_CALC_FAILED = 60,
  ROUTE_NOT_FOUND = 61,
  FARE_CALC_ERROR = 62,
  INVALID_ROUTE_DATA = 63
}

// Japanese error messages for specific error scenarios
export const ErrorMessages: Partial<Record<CLIErrorCode, {
  ja: string;
  en: string;
  suggestions: string[];
}>> = {
  // WebAssembly Module Loading (REQ-CLI-003.1)
  [CLIErrorCode.WASM_MODULE_NOT_FOUND]: {
    ja: 'WebAssemblyモジュールが見つかりません',
    en: 'WebAssembly module not found',
    suggestions: [
      'npm run build を実行してWebAssemblyモジュールをビルドしてください',
      'dist/farert.js と dist/farert.wasm ファイルが存在することを確認してください',
      'ファイルの権限を確認してください: chmod 644 dist/farert.*'
    ]
  },
  
  [CLIErrorCode.WASM_LOAD_FAILED]: {
    ja: 'WebAssemblyモジュールの読み込みに失敗しました',
    en: 'Failed to load WebAssembly module',
    suggestions: [
      'make clean && make all && npm run build を実行してください',
      'Node.js バージョンが14.0.0以上であることを確認してください',
      'Emscripten SDKが正しくインストールされていることを確認してください'
    ]
  },
  
  [CLIErrorCode.WASM_INVALID_MODULE]: {
    ja: 'WebAssemblyモジュールが無効です',
    en: 'Invalid WebAssembly module',
    suggestions: [
      'WebAssemblyファイルが破損している可能性があります',
      'make clean && make all を実行して再ビルドしてください',
      'dist/farert.wasm のファイルサイズを確認してください'
    ]
  },
  
  // Database Initialization (REQ-CLI-003.2)
  [CLIErrorCode.DB_INIT_FAILED]: {
    ja: 'データベース初期化に失敗しました',
    en: 'Database initialization failed',
    suggestions: [
      'data/jrdbnewest.db ファイルが存在することを確認してください',
      'データベースファイルの権限を確認してください: chmod 644 data/jrdbnewest.db',
      'データベースファイルの整合性を確認してください: file data/jrdbnewest.db'
    ]
  },
  
  [CLIErrorCode.DB_CONNECTION_FAILED]: {
    ja: 'データベース接続に失敗しました',
    en: 'Database connection failed',
    suggestions: [
      'SQLiteデータベースファイルが破損していないか確認してください',
      'メモリ不足が発生していないか確認してください',
      'WebAssemblyモジュールが正しくロードされているか確認してください'
    ]
  },
  
  [CLIErrorCode.DB_FILE_MISSING]: {
    ja: 'データベースファイルが見つかりません',
    en: 'Database file not found',
    suggestions: [
      'data/jrdbnewest.db ファイルをプロジェクトルートに配置してください',
      'データベースファイルのダウンロードが完了しているか確認してください',
      'ファイルパスが正しいことを確認してください'
    ]
  },
  
  // JavaScript Exceptions (REQ-CLI-003.4)
  [CLIErrorCode.JAVASCRIPT_EXCEPTION]: {
    ja: 'JavaScriptエラーが発生しました',
    en: 'JavaScript exception occurred',
    suggestions: [
      'エラーの詳細とスタックトレースを確認してください',
      '入力パラメータが正しい形式であることを確認してください',
      'メモリ不足が発生していないか確認してください'
    ]
  },
  
  [CLIErrorCode.UNHANDLED_REJECTION]: {
    ja: '未処理のPromiseエラーが発生しました',
    en: 'Unhandled promise rejection occurred',
    suggestions: [
      'エラーの発生箇所を特定してください',
      '非同期処理のエラーハンドリングを確認してください',
      'メモリリークが発生していないか確認してください'
    ]
  },
  
  // Input Validation
  [CLIErrorCode.INVALID_STATION_NAME]: {
    ja: '無効な駅名です',
    en: 'Invalid station name',
    suggestions: [
      '正確な日本語駅名を使用してください（例: 東京、新宿、大阪）',
      'ひらがな、カタカナ、英語表記は使用できません',
      '駅名は漢字で正確に入力してください'
    ]
  },
  
  [CLIErrorCode.INVALID_LINE_NAME]: {
    ja: '無効な路線名です',
    en: 'Invalid line name',
    suggestions: [
      '正式な路線名を使用してください（例: 東海道線、山手線、中央線）',
      '路線名は「〜線」の形式で入力してください',
      'JRや私鉄の正式名称を確認してください'
    ]
  },
  
  [CLIErrorCode.PARAMETER_COUNT_MISMATCH]: {
    ja: 'パラメータ数が正しくありません',
    en: 'Parameter count mismatch',
    suggestions: [
      '-5 コマンド: 正確に5個のパラメータが必要です',
      '直接ルート: 奇数個のパラメータ（3, 5, 7個など）',
      '自動ルート: 偶数個のパラメータ（2, 4, 6個など）'
    ]
  }
};

// Enhanced error classes with specific error codes and Japanese messages
export class CLIError extends Error {
  public readonly code: CLIErrorCode;
  public readonly suggestions: string[];
  public readonly context?: Record<string, any>;

  constructor(
    message: string, 
    code: CLIErrorCode = CLIErrorCode.GENERIC_ERROR, 
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CLIError';
    this.code = code;
    this.context = context || {};
    
    // Get suggestions from error code if available
    const errorInfo = ErrorMessages[code];
    this.suggestions = errorInfo?.suggestions || [];
    
    // Enhance stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CLIError);
    }
  }

  /**
   * Get localized error message
   */
  getLocalizedMessage(locale: 'ja' | 'en' = 'ja'): string {
    const errorInfo = ErrorMessages[this.code];
    if (errorInfo) {
      return errorInfo[locale];
    }
    return this.message;
  }

  /**
   * Format complete error message with suggestions
   */
  getFormattedMessage(locale: 'ja' | 'en' = 'ja'): string {
    let formatted = `❌ Error (${this.code}): ${this.getLocalizedMessage(locale)}\n`;
    
    if (this.message && this.message !== this.getLocalizedMessage(locale)) {
      formatted += `Details: ${this.message}\n`;
    }
    
    if (this.suggestions.length > 0) {
      formatted += '\n解決方法:\n';
      this.suggestions.forEach((suggestion, index) => {
        formatted += `  ${index + 1}. ${suggestion}\n`;
      });
    }
    
    if (this.context) {
      formatted += '\n追加情報:\n';
      Object.entries(this.context).forEach(([key, value]) => {
        formatted += `  ${key}: ${value}\n`;
      });
    }
    
    return formatted;
  }
}

export class WebAssemblyLoadError extends CLIError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, CLIErrorCode.WASM_LOAD_FAILED, context);
    this.name = 'WebAssemblyLoadError';
  }
}

export class DatabaseError extends CLIError {
  constructor(message: string, sqliteError?: string, context?: Record<string, any>) {
    super(message, CLIErrorCode.DB_INIT_FAILED, {
      ...context,
      sqliteError: sqliteError || 'Unknown SQLite error'
    });
    this.name = 'DatabaseError';
  }
}

export class InputValidationError extends CLIError {
  constructor(
    message: string, 
    invalidValue: string, 
    expectedType: 'station' | 'line' | 'route',
    suggestions: string[] = []
  ) {
    const code = expectedType === 'station' 
      ? CLIErrorCode.INVALID_STATION_NAME
      : expectedType === 'line'
      ? CLIErrorCode.INVALID_LINE_NAME
      : CLIErrorCode.INVALID_ROUTE_FORMAT;
      
    super(message, code, {
      invalidValue,
      expectedType,
      userSuggestions: suggestions
    });
    this.name = 'InputValidationError';
  }
}

export class TestExecutionError extends CLIError {
  constructor(message: string, testName: string, context?: Record<string, any>) {
    super(message, CLIErrorCode.TEST_CASE_FAILED, {
      ...context,
      testName
    });
    this.name = 'TestExecutionError';
  }
}

export class SystemError extends CLIError {
  constructor(message: string, systemError?: Error, context?: Record<string, any>) {
    super(message, CLIErrorCode.JAVASCRIPT_EXCEPTION, {
      ...context,
      originalError: systemError?.message,
      originalStack: systemError?.stack
    });
    this.name = 'SystemError';
  }
}

export class EnvironmentValidationError extends CLIError {
  public readonly validationResult: EnvironmentValidationResult;
  
  constructor(
    message: string,
    validationResult: EnvironmentValidationResult,
    context?: Record<string, any>
  ) {
    super(message, CLIErrorCode.ENVIRONMENT_ERROR, context);
    this.name = 'EnvironmentValidationError';
    this.validationResult = validationResult;
  }
  
  getDetailedReport(): string {
    let report = this.getFormattedMessage();
    
    if (this.validationResult.errors.length > 0) {
      report += '\n❌ Critical Issues:\n';
      this.validationResult.errors.forEach((error, index) => {
        report += `  ${index + 1}. ${error.message}\n`;
        if (error.filePath) {
          report += `     File: ${error.filePath}\n`;
        }
        if (error.suggestions.length > 0) {
          report += `     Solutions:\n`;
          error.suggestions.forEach(suggestion => {
            report += `       - ${suggestion}\n`;
          });
        }
      });
    }
    
    if (this.validationResult.warnings.length > 0) {
      report += '\n⚠️  Warnings:\n';
      this.validationResult.warnings.forEach((warning, index) => {
        report += `  ${index + 1}. ${warning.message}\n`;
        if (warning.suggestion) {
          report += `     Suggestion: ${warning.suggestion}\n`;
        }
      });
    }
    
    return report;
  }
}

// ===============================
// Enhanced Error Handling Interfaces
// Task 17: Enhanced Error Handling for Route Construction and Calculation
// Requirements: REQ-OBJ-002, REQ-OBJ-001
// ===============================

/**
 * Comprehensive validation result interface providing structured error information
 * with detailed error codes, messages, and actionable suggestions for troubleshooting.
 * 
 * This interface supports the enhanced object class functionality by providing
 * detailed error information for route construction and fare calculation failures.
 * 
 * @interface ValidationResult
 * @since Task 17 (Enhanced Error Handling)
 */
export interface ValidationResult {
  /**
   * Indicates whether the validation passed successfully
   * @type {boolean} true if validation passed, false if any errors occurred
   */
  isValid: boolean;

  /**
   * Specific error code for categorizing the type of validation failure
   * @type {RouteErrorCode | CLIErrorCode} Error code from the comprehensive error classification system
   */
  errorCode?: RouteErrorCode | CLIErrorCode;

  /**
   * Human-readable error message describing the validation failure
   * @type {string} Detailed error message for display and logging
   */
  errorMessage?: string;

  /**
   * Localized error message in Japanese for user interface display
   * @type {string} Japanese error message for native users
   */
  errorMessageJa?: string;

  /**
   * Array of actionable suggestions for resolving the validation error
   * @type {string[]} List of specific steps to fix the issue
   */
  suggestions: string[];

  /**
   * Additional context information about the validation failure
   * @type {Record<string, any>} Key-value pairs with debugging information
   */
  context?: Record<string, any>;

  /**
   * Input value that caused the validation failure
   * @type {any} The original input that failed validation
   */
  invalidValue?: any;

  /**
   * Expected format or type for the input value
   * @type {string} Description of the expected input format
   */
  expectedFormat?: string;

  /**
   * Severity level of the validation result
   * @type {'error' | 'warning' | 'info'} Classification of issue severity
   */
  severity?: 'error' | 'warning' | 'info';

  /**
   * Timestamp when the validation was performed
   * @type {Date} Date and time of validation execution
   */
  timestamp?: Date;

  /**
   * Related error codes that might also be relevant
   * @type {Array<RouteErrorCode | CLIErrorCode>} Additional error codes for comprehensive troubleshooting
   */
  relatedCodes?: Array<RouteErrorCode | CLIErrorCode>;
}

/**
 * Comprehensive route-specific error codes for detailed error classification
 * and troubleshooting in route construction and fare calculation operations.
 * 
 * Error codes are organized by functional area with specific ranges:
 * - ROUTE_ERR_001-010: Route initialization and setup errors
 * - ROUTE_ERR_011-020: Station and line validation errors
 * - ROUTE_ERR_021-030: Route construction and path building errors
 * - ROUTE_ERR_031-040: Fare calculation and rule application errors
 * - ROUTE_ERR_041-050: Database and data access errors
 * - ROUTE_ERR_051-060: WebAssembly integration errors
 * - ROUTE_ERR_061-070: Object lifecycle and memory management errors
 * - ROUTE_ERR_071-080: Configuration and environment errors
 * - ROUTE_ERR_081-090: Complex routing and special rules errors
 * - ROUTE_ERR_091-099: Critical system and recovery errors
 * 
 * @enum RouteErrorCode
 * @since Task 17 (Enhanced Error Handling)
 */
export enum RouteErrorCode {
  // Route Initialization and Setup (001-010)
  ROUTE_ERR_001 = 'ROUTE_ERR_001', // Route object initialization failed
  ROUTE_ERR_002 = 'ROUTE_ERR_002', // Route configuration invalid
  ROUTE_ERR_003 = 'ROUTE_ERR_003', // Route setup parameters missing
  ROUTE_ERR_004 = 'ROUTE_ERR_004', // Route object already initialized
  ROUTE_ERR_005 = 'ROUTE_ERR_005', // Route reset failed
  ROUTE_ERR_006 = 'ROUTE_ERR_006', // Route clone operation failed
  ROUTE_ERR_007 = 'ROUTE_ERR_007', // Route assignment failed
  ROUTE_ERR_008 = 'ROUTE_ERR_008', // Route validation failed
  ROUTE_ERR_009 = 'ROUTE_ERR_009', // Route string parsing failed
  ROUTE_ERR_010 = 'ROUTE_ERR_010', // Route format incompatible

  // Station and Line Validation (011-020)
  ROUTE_ERR_011 = 'ROUTE_ERR_011', // Invalid station ID
  ROUTE_ERR_012 = 'ROUTE_ERR_012', // Station name not found in database
  ROUTE_ERR_013 = 'ROUTE_ERR_013', // Invalid line ID
  ROUTE_ERR_014 = 'ROUTE_ERR_014', // Line name not found in database
  ROUTE_ERR_015 = 'ROUTE_ERR_015', // Station not on specified line
  ROUTE_ERR_016 = 'ROUTE_ERR_016', // Line does not connect to station
  ROUTE_ERR_017 = 'ROUTE_ERR_017', // Multiple stations with same name found
  ROUTE_ERR_018 = 'ROUTE_ERR_018', // Multiple lines with same name found
  ROUTE_ERR_019 = 'ROUTE_ERR_019', // Station-line combination invalid
  ROUTE_ERR_020 = 'ROUTE_ERR_020', // Geographic location mismatch

  // Route Construction and Path Building (021-030)
  ROUTE_ERR_021 = 'ROUTE_ERR_021', // Route path construction failed
  ROUTE_ERR_022 = 'ROUTE_ERR_022', // No valid path between stations
  ROUTE_ERR_023 = 'ROUTE_ERR_023', // Route exceeds maximum length
  ROUTE_ERR_024 = 'ROUTE_ERR_024', // Circular route detected
  ROUTE_ERR_025 = 'ROUTE_ERR_025', // Junction resolution failed
  ROUTE_ERR_026 = 'ROUTE_ERR_026', // Route segment invalid
  ROUTE_ERR_027 = 'ROUTE_ERR_027', // Route connection broken
  ROUTE_ERR_028 = 'ROUTE_ERR_028', // Auto-route generation failed
  ROUTE_ERR_029 = 'ROUTE_ERR_029', // Route reversal not allowed
  ROUTE_ERR_030 = 'ROUTE_ERR_030', // Route optimization failed

  // Fare Calculation and Rule Application (031-040)
  ROUTE_ERR_031 = 'ROUTE_ERR_031', // Fare calculation failed
  ROUTE_ERR_032 = 'ROUTE_ERR_032', // Special rule application failed
  ROUTE_ERR_033 = 'ROUTE_ERR_033', // Discount calculation error
  ROUTE_ERR_034 = 'ROUTE_ERR_034', // Long route fare calculation failed
  ROUTE_ERR_035 = 'ROUTE_ERR_035', // Urban area rule conflict
  ROUTE_ERR_036 = 'ROUTE_ERR_036', // Company boundary calculation error
  ROUTE_ERR_037 = 'ROUTE_ERR_037', // Terminal fare rule error
  ROUTE_ERR_038 = 'ROUTE_ERR_038', // Bullet train surcharge error
  ROUTE_ERR_039 = 'ROUTE_ERR_039', // Stock discount unavailable
  ROUTE_ERR_040 = 'ROUTE_ERR_040', // Fare info generation failed

  // Database and Data Access (041-050)
  ROUTE_ERR_041 = 'ROUTE_ERR_041', // Database query failed
  ROUTE_ERR_042 = 'ROUTE_ERR_042', // Station data retrieval failed
  ROUTE_ERR_043 = 'ROUTE_ERR_043', // Line data retrieval failed
  ROUTE_ERR_044 = 'ROUTE_ERR_044', // Fare data retrieval failed
  ROUTE_ERR_045 = 'ROUTE_ERR_045', // Database connection lost
  ROUTE_ERR_046 = 'ROUTE_ERR_046', // Data corruption detected
  ROUTE_ERR_047 = 'ROUTE_ERR_047', // Database version mismatch
  ROUTE_ERR_048 = 'ROUTE_ERR_048', // Index operation failed
  ROUTE_ERR_049 = 'ROUTE_ERR_049', // Transaction rollback required
  ROUTE_ERR_050 = 'ROUTE_ERR_050', // Database integrity check failed

  // WebAssembly Integration (051-060)
  ROUTE_ERR_051 = 'ROUTE_ERR_051', // WASM function call failed
  ROUTE_ERR_052 = 'ROUTE_ERR_052', // WASM memory allocation failed
  ROUTE_ERR_053 = 'ROUTE_ERR_053', // WASM object creation failed
  ROUTE_ERR_054 = 'ROUTE_ERR_054', // WASM parameter conversion failed
  ROUTE_ERR_055 = 'ROUTE_ERR_055', // WASM return value invalid
  ROUTE_ERR_056 = 'ROUTE_ERR_056', // WASM exception occurred
  ROUTE_ERR_057 = 'ROUTE_ERR_057', // WASM module not loaded
  ROUTE_ERR_058 = 'ROUTE_ERR_058', // WASM interface mismatch
  ROUTE_ERR_059 = 'ROUTE_ERR_059', // WASM execution timeout
  ROUTE_ERR_060 = 'ROUTE_ERR_060', // WASM stack overflow

  // Object Lifecycle and Memory Management (061-070)
  ROUTE_ERR_061 = 'ROUTE_ERR_061', // Object construction failed
  ROUTE_ERR_062 = 'ROUTE_ERR_062', // Object destruction failed
  ROUTE_ERR_063 = 'ROUTE_ERR_063', // Memory leak detected
  ROUTE_ERR_064 = 'ROUTE_ERR_064', // Reference counting error
  ROUTE_ERR_065 = 'ROUTE_ERR_065', // Object state invalid
  ROUTE_ERR_066 = 'ROUTE_ERR_066', // Inheritance chain broken
  ROUTE_ERR_067 = 'ROUTE_ERR_067', // Virtual method call failed
  ROUTE_ERR_068 = 'ROUTE_ERR_068', // Object serialization failed
  ROUTE_ERR_069 = 'ROUTE_ERR_069', // Object deserialization failed
  ROUTE_ERR_070 = 'ROUTE_ERR_070', // Garbage collection required

  // Configuration and Environment (071-080)
  ROUTE_ERR_071 = 'ROUTE_ERR_071', // Configuration file invalid
  ROUTE_ERR_072 = 'ROUTE_ERR_072', // Environment variable missing
  ROUTE_ERR_073 = 'ROUTE_ERR_073', // Runtime configuration error
  ROUTE_ERR_074 = 'ROUTE_ERR_074', // Feature flag disabled
  ROUTE_ERR_075 = 'ROUTE_ERR_075', // Locale setting invalid
  ROUTE_ERR_076 = 'ROUTE_ERR_076', // Resource limits exceeded
  ROUTE_ERR_077 = 'ROUTE_ERR_077', // Performance threshold exceeded
  ROUTE_ERR_078 = 'ROUTE_ERR_078', // Timeout configuration invalid
  ROUTE_ERR_079 = 'ROUTE_ERR_079', // Debug mode configuration error
  ROUTE_ERR_080 = 'ROUTE_ERR_080', // Platform compatibility issue

  // Complex Routing and Special Rules (081-090)
  ROUTE_ERR_081 = 'ROUTE_ERR_081', // Complex junction routing failed
  ROUTE_ERR_082 = 'ROUTE_ERR_082', // Special rule conflict detected
  ROUTE_ERR_083 = 'ROUTE_ERR_083', // Loop line routing error
  ROUTE_ERR_084 = 'ROUTE_ERR_084', // Multi-company route error
  ROUTE_ERR_085 = 'ROUTE_ERR_085', // Express service routing error
  ROUTE_ERR_086 = 'ROUTE_ERR_086', // Limited express surcharge error
  ROUTE_ERR_087 = 'ROUTE_ERR_087', // Reserved seat requirement error
  ROUTE_ERR_088 = 'ROUTE_ERR_088', // Seasonal fare adjustment error
  ROUTE_ERR_089 = 'ROUTE_ERR_089', // Peak hour surcharge error
  ROUTE_ERR_090 = 'ROUTE_ERR_090', // Route optimization conflict

  // Critical System and Recovery (091-099)
  ROUTE_ERR_091 = 'ROUTE_ERR_091', // System integrity compromised
  ROUTE_ERR_092 = 'ROUTE_ERR_092', // Fatal error recovery required
  ROUTE_ERR_093 = 'ROUTE_ERR_093', // Service unavailable
  ROUTE_ERR_094 = 'ROUTE_ERR_094', // Emergency shutdown required
  ROUTE_ERR_095 = 'ROUTE_ERR_095', // Data consistency violation
  ROUTE_ERR_096 = 'ROUTE_ERR_096', // Security violation detected
  ROUTE_ERR_097 = 'ROUTE_ERR_097', // License violation detected
  ROUTE_ERR_098 = 'ROUTE_ERR_098', // Audit trail corruption
  ROUTE_ERR_099 = 'ROUTE_ERR_099'  // Unrecoverable system error
}

/**
 * Enhanced error class specifically designed for route construction failures
 * with comprehensive error information and Japanese localization support.
 * 
 * This class extends the base CLIError with route-specific error codes and
 * provides detailed context about route construction issues including
 * invalid stations, lines, and routing parameters.
 * 
 * @class RouteConstructionError
 * @extends CLIError
 * @since Task 17 (Enhanced Error Handling)
 */
export class RouteConstructionError extends CLIError {
  public readonly routeErrorCode: RouteErrorCode;
  public readonly invalidStations?: string[];
  public readonly invalidLines?: string[];
  public readonly routeSegment?: number;
  public readonly validationResult?: ValidationResult;

  constructor(
    message: string,
    routeErrorCode: RouteErrorCode,
    options: {
      invalidStations?: string[];
      invalidLines?: string[];
      routeSegment?: number;
      validationResult?: ValidationResult;
      context?: Record<string, any>;
    } = {}
  ) {
    // Map route error code to appropriate CLI error code
    const cliErrorCode = RouteConstructionError.mapToCliErrorCode(routeErrorCode);
    
    super(message, cliErrorCode, {
      ...options.context,
      routeErrorCode,
      invalidStations: options.invalidStations,
      invalidLines: options.invalidLines,
      routeSegment: options.routeSegment
    });
    
    this.name = 'RouteConstructionError';
    this.routeErrorCode = routeErrorCode;
    this.invalidStations = options.invalidStations || [];
    this.invalidLines = options.invalidLines || [];
    this.routeSegment = options.routeSegment || 0;
    this.validationResult = options.validationResult || { 
      isValid: false, 
      suggestions: [],
      errorCode: routeErrorCode
    };
  }

  /**
   * Maps route error codes to appropriate CLI error codes for compatibility
   */
  private static mapToCliErrorCode(routeErrorCode: RouteErrorCode): CLIErrorCode {
    // Station and line validation errors
    if (routeErrorCode >= RouteErrorCode.ROUTE_ERR_011 && routeErrorCode <= RouteErrorCode.ROUTE_ERR_020) {
      if (routeErrorCode === RouteErrorCode.ROUTE_ERR_012 || 
          routeErrorCode === RouteErrorCode.ROUTE_ERR_017) {
        return CLIErrorCode.INVALID_STATION_NAME;
      }
      if (routeErrorCode === RouteErrorCode.ROUTE_ERR_014 || 
          routeErrorCode === RouteErrorCode.ROUTE_ERR_018) {
        return CLIErrorCode.INVALID_LINE_NAME;
      }
    }
    
    // Route construction errors
    if (routeErrorCode >= RouteErrorCode.ROUTE_ERR_021 && routeErrorCode <= RouteErrorCode.ROUTE_ERR_030) {
      return CLIErrorCode.INVALID_ROUTE_FORMAT;
    }
    
    // Fare calculation errors  
    if (routeErrorCode >= RouteErrorCode.ROUTE_ERR_031 && routeErrorCode <= RouteErrorCode.ROUTE_ERR_040) {
      return CLIErrorCode.ROUTE_CALC_FAILED;
    }
    
    // Database errors
    if (routeErrorCode >= RouteErrorCode.ROUTE_ERR_041 && routeErrorCode <= RouteErrorCode.ROUTE_ERR_050) {
      return CLIErrorCode.DB_INIT_FAILED;
    }
    
    // WebAssembly errors
    if (routeErrorCode >= RouteErrorCode.ROUTE_ERR_051 && routeErrorCode <= RouteErrorCode.ROUTE_ERR_060) {
      return CLIErrorCode.WASM_RUNTIME_ERROR;
    }
    
    return CLIErrorCode.GENERIC_ERROR;
  }

  /**
   * Get Japanese error message for the specific route error code
   */
  getJapaneseMessage(): string {
    const messages: Partial<Record<RouteErrorCode, string>> = {
      [RouteErrorCode.ROUTE_ERR_001]: 'ルートオブジェクトの初期化に失敗しました',
      [RouteErrorCode.ROUTE_ERR_002]: 'ルート設定が無効です',
      [RouteErrorCode.ROUTE_ERR_011]: '無効な駅IDです',
      [RouteErrorCode.ROUTE_ERR_012]: '駅名がデータベースに見つかりません',
      [RouteErrorCode.ROUTE_ERR_013]: '無効な路線IDです', 
      [RouteErrorCode.ROUTE_ERR_014]: '路線名がデータベースに見つかりません',
      [RouteErrorCode.ROUTE_ERR_021]: 'ルート経路の構築に失敗しました',
      [RouteErrorCode.ROUTE_ERR_022]: '駅間に有効な経路が見つかりません',
      [RouteErrorCode.ROUTE_ERR_031]: '運賃計算に失敗しました',
      [RouteErrorCode.ROUTE_ERR_032]: '特別ルールの適用に失敗しました'
    };
    
    return messages[this.routeErrorCode] || `ルートエラー: ${this.routeErrorCode}`;
  }

  /**
   * Get comprehensive error information including suggestions
   */
  getDetailedErrorInfo(): {
    errorCode: RouteErrorCode;
    message: string;
    japaneseMessage: string;
    suggestions: string[];
    context: Record<string, any>;
  } {
    const suggestions: string[] = [...this.suggestions];
    
    // Add specific suggestions based on error type
    if (this.invalidStations && this.invalidStations.length > 0) {
      suggestions.push(`無効な駅名: ${this.invalidStations.join(', ')}`);
      suggestions.push('正確な漢字表記の駅名を使用してください');
    }
    
    if (this.invalidLines && this.invalidLines.length > 0) {
      suggestions.push(`無効な路線名: ${this.invalidLines.join(', ')}`);
      suggestions.push('正式な路線名を「〜線」の形式で入力してください');
    }
    
    if (this.routeSegment !== undefined) {
      suggestions.push(`問題のあるルートセグメント: ${this.routeSegment + 1}`);
    }
    
    return {
      errorCode: this.routeErrorCode,
      message: this.message,
      japaneseMessage: this.getJapaneseMessage(),
      suggestions,
      context: this.context || {}
    };
  }
}

/**
 * Enhanced error class specifically designed for fare calculation failures
 * with detailed information about calculation context, applied rules, and
 * debugging information for fare calculation issues.
 * 
 * This class provides comprehensive error information for troubleshooting
 * complex fare calculation scenarios including special rules, discounts,
 * and company boundary calculations.
 * 
 * @class FareCalculationError
 * @extends CLIError
 * @since Task 17 (Enhanced Error Handling)
 */
export class FareCalculationError extends CLIError {
  public readonly routeErrorCode: RouteErrorCode;
  public readonly calculationContext?: {
    routeDistance?: number;
    companyCount?: number;
    appliedRules?: string[];
    fareComponents?: Array<{
      segment: string;
      fare: number;
      rule?: string;
    }>;
    specialConditions?: string[];
  };
  public readonly fareDetails?: {
    baseFare?: number;
    surcharges?: Record<string, number>;
    discounts?: Record<string, number>;
    finalFare?: number;
  };

  constructor(
    message: string,
    routeErrorCode: RouteErrorCode,
    options: {
      calculationContext?: FareCalculationError['calculationContext'];
      fareDetails?: FareCalculationError['fareDetails'];
      context?: Record<string, any>;
    } = {}
  ) {
    super(message, CLIErrorCode.FARE_CALC_ERROR, {
      ...options.context,
      routeErrorCode,
      calculationContext: options.calculationContext,
      fareDetails: options.fareDetails
    });
    
    this.name = 'FareCalculationError';
    this.routeErrorCode = routeErrorCode;
    this.calculationContext = options.calculationContext || {};
    this.fareDetails = options.fareDetails || {};
  }

  /**
   * Get detailed fare calculation debug information
   */
  getFareCalculationDebugInfo(): string {
    let debug = `運賃計算エラー詳細 (${this.routeErrorCode}):\n`;
    debug += `メッセージ: ${this.message}\n\n`;
    
    if (this.calculationContext) {
      debug += '計算コンテキスト:\n';
      if (this.calculationContext.routeDistance) {
        debug += `  営業キロ: ${this.calculationContext.routeDistance}km\n`;
      }
      if (this.calculationContext.companyCount) {
        debug += `  通過会社数: ${this.calculationContext.companyCount}\n`;
      }
      if (this.calculationContext.appliedRules) {
        debug += `  適用ルール: ${this.calculationContext.appliedRules.join(', ')}\n`;
      }
      if (this.calculationContext.specialConditions) {
        debug += `  特別条件: ${this.calculationContext.specialConditions.join(', ')}\n`;
      }
    }
    
    if (this.fareDetails) {
      debug += '\n運賃詳細:\n';
      if (this.fareDetails.baseFare) {
        debug += `  基本運賃: ${this.fareDetails.baseFare}円\n`;
      }
      if (this.fareDetails.surcharges) {
        debug += '  追加料金:\n';
        Object.entries(this.fareDetails.surcharges).forEach(([name, amount]) => {
          debug += `    ${name}: ${amount}円\n`;
        });
      }
      if (this.fareDetails.discounts) {
        debug += '  割引:\n';
        Object.entries(this.fareDetails.discounts).forEach(([name, amount]) => {
          debug += `    ${name}: -${amount}円\n`;
        });
      }
      if (this.fareDetails.finalFare) {
        debug += `  最終運賃: ${this.fareDetails.finalFare}円\n`;
      }
    }
    
    if (this.suggestions.length > 0) {
      debug += '\n解決方法:\n';
      this.suggestions.forEach((suggestion, index) => {
        debug += `  ${index + 1}. ${suggestion}\n`;
      });
    }
    
    return debug;
  }

  /**
   * Get simplified error message for user display
   */
  getUserFriendlyMessage(): string {
    const userMessages: Partial<Record<RouteErrorCode, string>> = {
      [RouteErrorCode.ROUTE_ERR_031]: '運賃を計算できませんでした。ルートを確認してください。',
      [RouteErrorCode.ROUTE_ERR_032]: '特別ルールの適用中にエラーが発生しました。',
      [RouteErrorCode.ROUTE_ERR_033]: '割引計算でエラーが発生しました。',
      [RouteErrorCode.ROUTE_ERR_034]: '長距離ルートの運賃計算に失敗しました。',
      [RouteErrorCode.ROUTE_ERR_035]: '都市部ルールの競合が発生しました。',
      [RouteErrorCode.ROUTE_ERR_036]: '会社境界での計算エラーが発生しました。'
    };
    
    return userMessages[this.routeErrorCode] || `運賃計算エラーが発生しました: ${this.routeErrorCode}`;
  }
}


// ===============================
// Android Compatibility Utility Functions
// Task 23: Comprehensive Android compatibility layer
// ===============================

/**
 * Comprehensive Android compatibility utility class
 * Provides centralized methods for cross-platform compatibility
 */
export class AndroidCompatibilityUtil {
  /**
   * Check if current environment supports Android compatibility features
   */
  static isAndroidCompatibilitySupported(): boolean {
    try {
      // Check for required APIs and features
      const hasJSON = typeof JSON !== 'undefined';
      const hasArrayMethods = typeof Array.isArray !== 'undefined' && typeof Array.prototype.map !== 'undefined';
      const hasNumberValidation = typeof Number.isInteger !== 'undefined';
      
      return hasJSON && hasArrayMethods && hasNumberValidation;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get Android compatibility information
   */
  static getCompatibilityInfo(): {
    supported: boolean;
    version: string;
    features: string[];
    limitations: string[];
  } {
    return {
      supported: this.isAndroidCompatibilitySupported(),
      version: '1.0.0',
      features: [
        'Data Type Mapping',
        'Method Name Aliases', 
        'JSON Serialization',
        'Batch Operations',
        'Type Validation',
        'Performance Optimization'
      ],
      limitations: [
        'JavaScript number precision (53-bit vs 64-bit Long)',
        'Unicode string handling differences',
        'Timezone handling variations'
      ]
    };
  }
  
  /**
   * Create Android-compatible configuration object
   */
  static createAndroidConfig(options: Partial<{
    enableBatching: boolean;
    cacheSize: number;
    strictValidation: boolean;
    includeDebugInfo: boolean;
    optimizePerformance: boolean;
  }> = {}): AndroidCompatibilityConfig {
    return {
      enableBatching: options.enableBatching ?? true,
      cacheSize: options.cacheSize ?? 1000,
      strictValidation: options.strictValidation ?? true,
      includeDebugInfo: options.includeDebugInfo ?? false,
      optimizePerformance: options.optimizePerformance ?? true,
      serialization: {
        includeTypeHints: options.includeDebugInfo ?? false,
        validateTypes: options.strictValidation ?? true,
        preserveNulls: false
      }
    };
  }
  
  /**
   * Convert WebAssembly module interface to Android-compatible format
   */
  static wrapModuleForAndroid(module: FarertModule): AndroidCompatibleModule {
    const androidModule: AndroidCompatibleModule = {
      // Core WebAssembly functions with Android aliases
      ...module,
      
      // Android-specific wrapper methods
      batchStationLookup: (names: string[]) => {
        return names.map(name => module.getStationId(name));
      },
      
      batchLineLookup: (names: string[]) => {
        return names.map(name => module.getLineId?.(name) ?? -1);
      },
      
      validateRoute: (stationIds: number[], lineIds: number[]) => {
        return {
          isValid: stationIds.length > 0 && stationIds.length === lineIds.length + 1,
          errors: [],
          warnings: [],
          summary: 'Route validation completed'
        };
      },
      
      exportData: () => {
        return AndroidSerializationHelper.createAndroidCompatibleJson({
          timestamp: Date.now(),
          version: '1.0.0',
          platform: 'WebAssembly'
        });
      }
    };
    
    return androidModule;
  }
}

/**
 * Android compatibility configuration interface
 */
export interface AndroidCompatibilityConfig {
  enableBatching: boolean;
  cacheSize: number;
  strictValidation: boolean;
  includeDebugInfo: boolean;
  optimizePerformance: boolean;
  serialization: {
    includeTypeHints: boolean;
    validateTypes: boolean;
    preserveNulls: boolean;
  };
}

/**
 * Android-compatible module interface with additional wrapper methods
 */
export interface AndroidCompatibleModule extends FarertModule {
  batchStationLookup: (names: string[]) => number[];
  batchLineLookup: (names: string[]) => number[];
  validateRoute: (stationIds: number[], lineIds: number[]) => AndroidCompatibilityResult;
  exportData: () => string;
}

/**
 * Type guard functions for Android compatibility
 */
export class AndroidTypeGuards {
  /**
   * Check if value is valid Kotlin Int (32-bit signed integer)
   */
  static isKotlinInt(value: any): value is number {
    return typeof value === 'number' && 
           Number.isInteger(value) && 
           value >= -2147483648 && 
           value <= 2147483647;
  }
  
  /**
   * Check if value is valid Kotlin Long (64-bit signed integer)
   */
  static isKotlinLong(value: any): value is number {
    return typeof value === 'number' && Number.isInteger(value);
  }
  
  /**
   * Check if value is valid Kotlin Double
   */
  static isKotlinDouble(value: any): value is number {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
  }
  
  /**
   * Check if value is valid Kotlin Boolean
   */
  static isKotlinBoolean(value: any): value is boolean {
    return typeof value === 'boolean';
  }
  
  /**
   * Check if value is valid Kotlin String
   */
  static isKotlinString(value: any): value is string {
    return typeof value === 'string';
  }
  
  /**
   * Check if array contains only valid Kotlin Ints
   */
  static isKotlinIntArray(value: any): value is number[] {
    return Array.isArray(value) && value.every(v => this.isKotlinInt(v));
  }
  
  /**
   * Check if object structure is Android-compatible
   */
  static isAndroidCompatible(obj: any): obj is Record<string, any> {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    // Check for circular references
    try {
      JSON.stringify(obj);
    } catch (error) {
      return false;
    }
    
    return true;
  }
}
