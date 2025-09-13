"use strict";
/**
 * Station-specific TypeScript interfaces for Farert WebAssembly Module
 *
 * Provides comprehensive typing for all station-related operations,
 * search functionality, validation, and metadata handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATION_CONSTANTS = void 0;
exports.isStation = isStation;
exports.isStationSearchResult = isStationSearchResult;
exports.isStationValidationResult = isStationValidationResult;
exports.isValidStationId = isValidStationId;
exports.isValidStationName = isValidStationName;
exports.isValidStationKana = isValidStationKana;
// Type guards for station-related interfaces
function isStation(obj) {
    return obj &&
        typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        typeof obj.kana === 'string' &&
        obj.id > 0;
}
function isStationSearchResult(obj) {
    return obj &&
        Array.isArray(obj.stations) &&
        typeof obj.query === 'string' &&
        typeof obj.total === 'number';
}
function isStationValidationResult(obj) {
    return obj &&
        typeof obj.isValid === 'boolean' &&
        Array.isArray(obj.errors) &&
        Array.isArray(obj.warnings);
}
// Station ID validation
function isValidStationId(id) {
    return Number.isInteger(id) &&
        id >= 1000000 &&
        id <= 9999999;
}
// Station name validation
function isValidStationName(name) {
    return typeof name === 'string' &&
        name.length > 0 &&
        name.length <= 50 &&
        /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\uFF65-\uFF9F\u3000-\u303F]+$/.test(name);
}
// Station kana validation
function isValidStationKana(kana) {
    return typeof kana === 'string' &&
        kana.length > 0 &&
        /^[\u3040-\u309F\u30FC\u3000]+$/.test(kana);
}
// === Constants ===
exports.STATION_CONSTANTS = {
    // ID validation ranges
    MIN_STATION_ID: 1000000,
    MAX_STATION_ID: 9999999,
    // Name length limits
    MAX_STATION_NAME_LENGTH: 50,
    MAX_KANA_LENGTH: 50,
    // Search limits
    DEFAULT_MAX_SEARCH_RESULTS: 100,
    MAX_SEARCH_RESULTS: 1000,
    // Fuzzy matching
    DEFAULT_FUZZY_TOLERANCE: 0.7,
    MIN_FUZZY_TOLERANCE: 0.0,
    MAX_FUZZY_TOLERANCE: 1.0,
    // Timeouts
    DEFAULT_SEARCH_TIMEOUT: 3000,
    DEFAULT_LOOKUP_TIMEOUT: 1000,
    DEFAULT_VALIDATION_TIMEOUT: 2000
};
//# sourceMappingURL=station-types.js.map