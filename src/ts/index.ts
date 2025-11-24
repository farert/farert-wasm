/**
 * FARERT WASM - Main Entry Point
 * Japanese Railway Fare Calculation Library
 *
 * @packageDocumentation
 */

export {
  // Main initialization
  initFarert,

  // Main class
  Farert,

  // Database operations
  openDatabase,
  closeDatabase,
  databaseInfo,

  // UI Helper functions
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

  // Developer tools
  executeSql,
} from './wrapper/Farert';

// Re-export types
export type { Farert as FaretClass } from './types/farert';
export type { SqlResult, DatabaseInfo } from './wrapper/Farert';
