"use strict";
/**
 * Line-specific TypeScript interfaces for Farert WebAssembly Module
 *
 * Provides comprehensive typing for all line-related operations,
 * company classification, junction analysis, and connectivity mapping.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LINE_CONSTANTS = void 0;
exports.isLine = isLine;
exports.isCompany = isCompany;
exports.isPrefecture = isPrefecture;
exports.isJunctionInfo = isJunctionInfo;
exports.isValidLineId = isValidLineId;
exports.isValidCompanyId = isValidCompanyId;
exports.isJRCompany = isJRCompany;
exports.isPrefectureId = isPrefectureId;
exports.isValidLineName = isValidLineName;
// === Type Guards ===
function isLine(obj) {
    return obj &&
        typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        typeof obj.companyId === 'number' &&
        obj.id > 0;
}
function isCompany(obj) {
    return obj &&
        typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        Array.isArray(obj.lines);
}
function isPrefecture(obj) {
    return obj &&
        typeof obj.id === 'number' &&
        typeof obj.name === 'string' &&
        obj.id >= 0x10000;
}
function isJunctionInfo(obj) {
    return obj &&
        typeof obj.stationId === 'number' &&
        Array.isArray(obj.lines) &&
        typeof obj.allowsTransfer === 'boolean';
}
// === Validation Functions ===
function isValidLineId(id) {
    return Number.isInteger(id) && id > 0 && id < 1000000;
}
function isValidCompanyId(id) {
    return Number.isInteger(id) && id > 0;
}
function isJRCompany(companyId) {
    return companyId < 0x10000;
}
function isPrefectureId(id) {
    return id >= 0x10000;
}
function isValidLineName(name) {
    return typeof name === 'string' &&
        name.length > 0 &&
        name.length <= 50;
}
// === Constants ===
exports.LINE_CONSTANTS = {
    // ID validation ranges
    MIN_LINE_ID: 1,
    MAX_LINE_ID: 999999,
    JR_COMPANY_ID_THRESHOLD: 0x10000,
    MIN_PREFECTURE_ID: 0x10000,
    // Name length limits
    MAX_LINE_NAME_LENGTH: 50,
    MAX_COMPANY_NAME_LENGTH: 100,
    // Search limits
    DEFAULT_MAX_SEARCH_RESULTS: 100,
    MAX_SEARCH_RESULTS: 1000,
    // Junction analysis
    MIN_JUNCTION_LINES: 2,
    MAX_JUNCTION_LINES: 20,
    // Transfer times (minutes)
    DEFAULT_TRANSFER_TIME: 5,
    SAME_PLATFORM_TRANSFER_TIME: 2,
    CROSS_PLATFORM_TRANSFER_TIME: 5,
    LONG_WALK_TRANSFER_TIME: 10,
    // Timeouts
    DEFAULT_SEARCH_TIMEOUT: 3000,
    DEFAULT_LOOKUP_TIMEOUT: 1000,
    DEFAULT_ANALYSIS_TIMEOUT: 5000
};
//# sourceMappingURL=line-types.js.map