/**
 * FARERT WASM - Main Entry Point
 * Japanese Railway Fare Calculation Library
 *
 * @packageDocumentation
 */

// Main initialization and class
export {
  initFarert,
  Farert,
} from './wrapper/Farert.js';

// Database operations
export {
  openDatabase,
  closeDatabase,
  databaseInfo,
} from './wrapper/Farert.js';

// UI Helper functions
export {
  getPrefects,
  getCompanys,
  getLinesByPrefect,
  getLinesByCompany,
  getLinesByStation,
  getStationsByCompanyAndLine,
  getStationsByPrefectureAndLine,
  getPrefectureByStation,
  getKanaByStation,
  searchStationByKeyword,
  getBranchStationsByLine,
  getStationsByLine,
  getPrefectId,
  getCompanyId,
} from './wrapper/Farert.js';

// Developer tools
export { executeSql } from './wrapper/Farert.js';

// Re-export types
export type { Farert as FaretClass } from './types/farert';
export type { SqlResult, DatabaseInfo, BuildRouteResult } from './wrapper/Farert.js';
