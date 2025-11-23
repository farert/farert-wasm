/**
 * FARERT WASM TypeScript Type Definitions
 * Auto-generated from azusa.h
 */

/**
 * Main Farert class for route calculation and fare information
 * Maps to az_route in C++
 */
export declare class Farert {
  constructor();

  // Route building methods
  /**
   * Add starting station to the route
   * @param station - Station name
   * @returns Status code (0 = success)
   */
  addStartRoute(station: string): number;

  /**
   * Add a line and station to the route
   * @param line - Line name
   * @param station - Station name
   * @returns Status code (0 = success)
   */
  addRoute(line: string, station: string): number;

  /**
   * Auto-calculate route to destination
   * @param useBulletTrain - Whether to use bullet train (0 = no, 1 = yes)
   * @param destinationStation - Destination station name
   * @returns Status code (0 = success)
   */
  autoRoute(useBulletTrain: number, destinationStation: string): number;

  /**
   * Get the number of routes in the current route list
   */
  getRouteCount(): number;

  /**
   * Get departure station name
   */
  departureStationName(): string;

  /**
   * Get arrival station name
   */
  arrivevalStationName(): string;

  /**
   * Build route from script string
   * @param routeStr - Route script string
   * @returns Status code
   */
  buildRoute(routeStr: string): number;

  /**
   * Get route as script string
   */
  routeScript(): string;

  // Route manipulation
  /**
   * Remove all routes
   */
  removeAll(): void;

  /**
   * Remove the last route segment
   */
  removeTail(): void;

  /**
   * Reverse the route direction
   * @returns Status code
   */
  reverse(): number;

  // Route configuration
  /**
   * Get type of passed line at offset
   * @param offset - Offset in route
   */
  typeOfPassedLine(offset: number): number;

  /**
   * Enable/disable detour
   * @param enabled - True to enable
   * @returns Status code
   */
  setDetour(enabled: boolean): number;

  /**
   * Set no-rule mode
   * @param noRule - True to disable rules
   */
  setNoRule(noRule: boolean): void;

  // Fare calculation
  /**
   * Calculate and show fare information
   * @returns Fare information as formatted string
   */
  showFare(): string;

  // Route flags
  /**
   * Set long-distance route flag
   */
  setLongRoute(flag: boolean): void;

  /**
   * Set JR Tokai stock application flag
   */
  setJrTokaiStockApply(flag: boolean): void;

  /**
   * Set starting station as city
   */
  setStartAsCity(): void;

  /**
   * Set arrival station as city
   */
  setArrivalAsCity(): void;

  /**
   * Set specific term rule 115 flag
   */
  setSpecificTermRule115(flag: boolean): void;

  // Route status checks
  /**
   * Check if Kokura-Hakata-Shin are not same
   */
  isNotSameKokuraHakataShinZai(): boolean;

  /**
   * Check if reverse is available
   */
  isAvailableReverse(): boolean;

  /**
   * Check if Osaka-kan detour is enabled
   */
  isOsakakanDetourEnable(): boolean;

  /**
   * Check if Osaka-kan detour is active
   */
  isOsakakanDetour(): boolean;

  /**
   * Set Kokura-Hakata-Shin not same flag
   */
  setNotSameKokuraHakataShinZai(enabled: boolean): void;

  // JSON serialization
  /**
   * Get fare info object as JSON string
   */
  getFareInfoObjectJson(): string;

  /**
   * Get all routes as JSON string
   */
  getRoutesJson(): string;

  /**
   * Get route record at index as JSON
   * @param index - Route index
   */
  getRouteRecord(index: number): string;
}

/**
 * Database operations
 */

/**
 * Open the embedded database
 * @returns Status message
 */
export declare function openDatabase(): string;

/**
 * Close the database
 */
export declare function closeDatabase(): void;

/**
 * UI Helper Functions (fare_ui namespace)
 */

/**
 * Get list of prefectures as JSON array
 */
export declare function getPrefects(): string;

/**
 * Get list of JR companies as JSON array
 */
export declare function getCompanys(): string;

/**
 * Get lines by prefecture
 * @param prefecture - Prefecture name
 */
export declare function getLinesByPrefect(prefecture: string): string;

/**
 * Get lines by JR company
 * @param company - Company name
 */
export declare function getLinesByCompany(company: string): string;

/**
 * Get lines by station
 * @param station - Station name
 */
export declare function getLinesByStation(station: string): string;

/**
 * Get stations by company and line
 * @param jrgroup - JR company name
 * @param lineName - Line name
 */
export declare function getStationsByCompanyAndLine(jrgroup: string, lineName: string): string;

/**
 * Get stations by prefecture and line
 * @param prefecture - Prefecture name
 * @param lineName - Line name
 */
export declare function getStationsByPrefectureAndLine(prefecture: string, lineName: string): string;

/**
 * Get prefecture by station name
 * @param stationName - Station name
 */
export declare function getPrefectureByStation(stationName: string): string;

/**
 * Get kana reading of station name
 * @param stationName - Station name
 */
export declare function getKanaByStation(stationName: string): string;

/**
 * Search stations by keyword
 * @param keyword - Search keyword
 */
export declare function searchStationByKeyword(keyword: string): string;

/**
 * Get branch stations on a line
 * @param lineName - Line name
 * @param stationName - Station name
 */
export declare function getBranchStationsByLine(lineName: string, stationName: string): string;

/**
 * Get all stations on a line
 * @param lineName - Line name
 */
export declare function getStationsByLine(lineName: string): string;

/**
 * Get prefecture ID
 * @param prefecture - Prefecture name
 */
export declare function getPrefectId(prefecture: string): number;

/**
 * Get company ID
 * @param company - Company name
 */
export declare function getCompanyId(company: string): number;
