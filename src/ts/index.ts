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
} from './wrapper/Farert';

// Re-export types
export type { Farert as FaretClass } from './types/farert';
