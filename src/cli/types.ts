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
export interface RouteListWrapper {
  startStationId(): number;
  lastStationId(): number;
  routeScript(): string;
  
  // Essential RouteList operations (from CLAUDE.md specifications)
  removeAll(): void;
  assign(obj: RouteListWrapper): void;
  
  // Enhanced array operations (Task 30 requirements)
  count(): number;                                        // Array size
  at(index: number): RouteItemWrapper;                    // Array element access with bounds checking
  remove(index: number): void;                            // Remove element at index
  insert(index: number, item: RouteItemWrapper): void;    // Insert element at index
}

export interface RouteWrapper extends RouteListWrapper {
  addRoute(stationId: number): number;
  addRouteWithLine(lineId: number, stationId: number): number;
  removeTail(): void;
  autoRoute(): number;
  reverseRoute(): number;
  setupRoute(route: string): void;
  setDetour(flag: boolean): void;
  setNoRule(flag: boolean): void;
  getRouteCount(): number;
  getRouteItem(index: number): RouteItemWrapper;
  lastLineId(): number;
  isReverseAllow(): boolean;
  isEnd(): boolean;
}

export interface CalcRouteWrapper extends RouteWrapper {
  calcFare(): FareInfoData;
  calcFareJson(): string;
  showFare(): string;
  isEnableLongRoute(): boolean;
  setLongRoute(flag: boolean): void;
  setStartAsCity(): void;
  setArriveAsCity(): void;
}

/**
 * RouteItemWrapper interface representing a single route item/segment
 * Based on CLAUDE.md specifications and C++ cRouteItem class
 * 
 * This interface wraps the C++ cRouteItem class and provides type-safe access
 * to route segment information including station, line, fare, and distance data.
 */
export interface RouteItemWrapper {
  /**
   * Station ID at this route point
   * @type {number} Station identifier from database
   */
  stationId: number;
  
  /**
   * Line ID for this route segment
   * @type {number} Line identifier from database
   */
  lineId: number;
  
  /**
   * Route-specific flags for this segment
   * @type {number} Bitfield containing routing flags and special conditions
   */
  flag: number;
  
  /**
   * Calculated fare for this route segment
   * @type {number} Fare amount in yen for this segment
   */
  fare: number;
  
  /**
   * Sales distance in kilometers for this segment
   * @type {number} Distance used for fare calculation (may differ from actual distance)
   */
  salesKm: number;
  
  /**
   * Index in aggregate route calculation
   * @type {number} Position index when this item is part of an aggregate route
   */
  indexOfAggregate: number;
  
  /**
   * Check if this route item contains valid data
   * @returns {boolean} true if the route item has valid station and line IDs
   */
  isValid(): boolean;
  
  /**
   * Get display name for this route item
   * @returns {string} Formatted display name showing station and line information
   */
  getDisplayName(): string;
  
  /**
   * Get string representation of this route item
   * @returns {string} String representation for debugging and display purposes
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

export interface FareInfoData {
  result: number;
  fare: number;
  isRule114Applied: boolean;
  availCountForFareOfStockDiscount: number;
  beginStationId: number;
  endStationId: number;
  routeList: string;
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
