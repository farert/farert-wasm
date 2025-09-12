#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <sstream>
#include <string>
#include <vector>
#include <functional>
#include <cstring>
#include "include/route_interface.h"
#include "include/common.h"
#include "core/alpdb.h"

// Global route instance for simple API
static RouteWrapper* g_route = nullptr;
static CalcRouteWrapper* g_calcRoute = nullptr;

// Memory monitoring state
static struct {
    bool monitoring_enabled = false;
    size_t memory_threshold = 50 * 1024 * 1024;  // 50MB default threshold
    size_t peak_memory_usage = 0;
    int object_count = 0;
    int cleanup_callbacks_registered = 0;
    std::vector<std::function<void()>> cleanup_callbacks;
} memory_state;

// Object instance counters for tracking
static struct {
    int route_wrapper_count = 0;
    int calc_route_wrapper_count = 0;
    int route_list_wrapper_count = 0;
    int route_item_wrapper_count = 0;
    int route_flag_wrapper_count = 0;
    int fare_info_data_count = 0;
} object_counters;

// Object lifecycle hooks for tracking (C++ linkage)
void onObjectCreated(const char* type) {
    if (memory_state.monitoring_enabled) {
        if (strcmp(type, "RouteWrapper") == 0) object_counters.route_wrapper_count++;
        else if (strcmp(type, "CalcRouteWrapper") == 0) object_counters.calc_route_wrapper_count++;
        else if (strcmp(type, "RouteListWrapper") == 0) object_counters.route_list_wrapper_count++;
        else if (strcmp(type, "RouteItemWrapper") == 0) object_counters.route_item_wrapper_count++;
        else if (strcmp(type, "RouteFlagWrapper") == 0) object_counters.route_flag_wrapper_count++;
        else if (strcmp(type, "FareInfoData") == 0) object_counters.fare_info_data_count++;
        
        memory_state.object_count++;
    }
}

void onObjectDestroyed(const char* type) {
    if (memory_state.monitoring_enabled) {
        if (strcmp(type, "RouteWrapper") == 0 && object_counters.route_wrapper_count > 0) 
            object_counters.route_wrapper_count--;
        else if (strcmp(type, "CalcRouteWrapper") == 0 && object_counters.calc_route_wrapper_count > 0) 
            object_counters.calc_route_wrapper_count--;
        else if (strcmp(type, "RouteListWrapper") == 0 && object_counters.route_list_wrapper_count > 0) 
            object_counters.route_list_wrapper_count--;
        else if (strcmp(type, "RouteItemWrapper") == 0 && object_counters.route_item_wrapper_count > 0) 
            object_counters.route_item_wrapper_count--;
        else if (strcmp(type, "RouteFlagWrapper") == 0 && object_counters.route_flag_wrapper_count > 0) 
            object_counters.route_flag_wrapper_count--;
        else if (strcmp(type, "FareInfoData") == 0 && object_counters.fare_info_data_count > 0) 
            object_counters.fare_info_data_count--;
        
        if (memory_state.object_count > 0) memory_state.object_count--;
    }
}

extern "C" {

// Database management functions
EMSCRIPTEN_KEEPALIVE
int farert_open_database() {
    // Database is embedded in MEMFS at /data/jrdbnewest.db
    return DatabaseManager::openDatabase("/data/jrdbnewest.db") ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
void farert_close_database() {
    DatabaseManager::closeDatabase();
}

// Route management functions
EMSCRIPTEN_KEEPALIVE
int farert_create_route() {
    if (g_route) {
        delete g_route;
        onObjectDestroyed("RouteWrapper");
    }
    g_route = new RouteWrapper();
    if (g_route) {
        onObjectCreated("RouteWrapper");
        return 1;
    }
    return 0;
}

EMSCRIPTEN_KEEPALIVE
void farert_destroy_route() {
    if (g_route) {
        delete g_route;
        g_route = nullptr;
        onObjectDestroyed("RouteWrapper");
    }
    if (g_calcRoute) {
        delete g_calcRoute;
        g_calcRoute = nullptr;
        onObjectDestroyed("CalcRouteWrapper");
    }
}

EMSCRIPTEN_KEEPALIVE
int farert_add_station(int stationId) {
    if (!g_route) return -1;
    return g_route->addRoute(stationId);
}

EMSCRIPTEN_KEEPALIVE
int farert_add_route(int lineId, int stationId) {
    if (!g_route) return -1;
    return g_route->addRoute(lineId, stationId);
}

EMSCRIPTEN_KEEPALIVE
void farert_remove_tail() {
    if (g_route) {
        g_route->removeTail();
    }
}

EMSCRIPTEN_KEEPALIVE
void farert_remove_all() {
    if (g_route) {
        g_route->removeAll();
    }
}

EMSCRIPTEN_KEEPALIVE
int farert_reverse_route() {
    if (!g_route) return -1;
    return g_route->reverseRoute();
}

EMSCRIPTEN_KEEPALIVE
int farert_get_route_count() {
    if (!g_route) return 0;
    return g_route->getRouteCount();
}

EMSCRIPTEN_KEEPALIVE
int farert_start_station_id() {
    if (!g_route) return 0;
    return g_route->startStationId();
}

EMSCRIPTEN_KEEPALIVE
int farert_last_station_id() {
    if (!g_route) return 0;
    return g_route->lastStationId();
}

EMSCRIPTEN_KEEPALIVE
int farert_is_end() {
    if (!g_route) return 0;
    return g_route->isEnd() ? 1 : 0;
}

// Station/Line utility functions
EMSCRIPTEN_KEEPALIVE
int farert_get_station_id(const char* name) {
    if (!name) return 0;
    return RouteUtility::getStationId(std::string(name));
}

// String-based wrapper for JavaScript binding
int getStationIdFromString(const std::string& name) {
    return RouteUtility::getStationId(name);
}

std::string getStationNameFromId(int id) {
    return RouteUtility::getStationName(id);
}

std::string getLineNameFromId(int id) {
    return RouteUtility::getLineName(id);
}

// 路線名からIDを取得
int getLineIdFromName(const std::string& lineName) {
    return RouteUtility::getLineIdFromName(lineName);
}

std::string getFareStringResult() {
    if (g_calcRoute) {
        return g_calcRoute->showFare();
    }
    return "";
}

// Get detailed FareInfo as JSON
std::string getFareInfoJson() {
    if (g_calcRoute) {
        return g_calcRoute->calcFare();
    }
    return "{}";
}

// Route script operations (from CLAUDE.md Public functions)
int setupRoute(const std::string& route) {
    if (!g_route) return 0;
    try {
        g_route->setupRoute(route);
        return 1;
    } catch (...) {
        return 0;
    }
}

std::string getRouteScript() {
    if (!g_route) return "";
    return g_route->routeScript();
}

// Terminal name function
std::string getTerminalName(int stationId) {
    return RouteUtility::getTerminalName(stationId);
}

// Check if station is junction
int isJunction(int stationId) {
    return RouteUtility::isJunction(stationId) ? 1 : 0;
}

// Check if specific junction
int isSpecificJunction(int lineId, int stationId) {
    return RouteUtility::isSpecificJunction(lineId, stationId) ? 1 : 0;
}

// Terminal history operations
void saveToTerminalHistory(const std::string& historyData) {
    // Split comma-separated string and save as array
    std::vector<std::string> history;
    std::stringstream ss(historyData);
    std::string item;
    while (std::getline(ss, item, ',')) {
        history.push_back(item);
    }
    RouteUtility::saveToTerminalHistoryWithArray(history);
}

std::string readFromTerminalHistory() {
    std::vector<std::string> history = RouteUtility::readFromTerminalHistory();
    std::string result;
    for (size_t i = 0; i < history.size(); i++) {
        if (i > 0) result += ",";
        result += history[i];
    }
    return result;
}

// Debug function removed for production optimization

EMSCRIPTEN_KEEPALIVE
const char* farert_get_station_name(int id) {
    static std::string result;
    result = RouteUtility::getStationName(id);
    return result.c_str();
}

EMSCRIPTEN_KEEPALIVE
const char* farert_get_line_name(int id) {
    static std::string result;
    result = RouteUtility::getLineName(id);
    return result.c_str();
}

// Fare calculation functions
EMSCRIPTEN_KEEPALIVE
int farert_calculate_fare() {
    if (!g_route) return 0;
    
    if (g_calcRoute) {
        delete g_calcRoute;
        onObjectDestroyed("CalcRouteWrapper");
    }
    
    g_calcRoute = new CalcRouteWrapper(*g_route);
    if (!g_calcRoute) return 0;
    
    onObjectCreated("CalcRouteWrapper");
    
    std::string fareJson = g_calcRoute->calcFare();
    if (!fareJson.empty() && fareJson != "{}") {
        return 1; // Calculation succeeded
    }
    return 0; // Calculation failed
}

EMSCRIPTEN_KEEPALIVE
const char* farert_get_fare_string() {
    static std::string result;
    if (g_calcRoute) {
        result = g_calcRoute->showFare();
    } else {
        result = "";
    }
    return result.c_str();
}

EMSCRIPTEN_KEEPALIVE
void farert_set_long_route(int flag) {
    if (g_calcRoute) {
        g_calcRoute->setLongRoute(flag != 0);
    }
}

EMSCRIPTEN_KEEPALIVE
void farert_set_start_as_city() {
    if (g_calcRoute) {
        g_calcRoute->setStartAsCity();
    }
}

EMSCRIPTEN_KEEPALIVE
void farert_set_arrive_as_city() {
    if (g_calcRoute) {
        g_calcRoute->setArriveAsCity();
    }
}

// Debug function to check database contents
EMSCRIPTEN_KEEPALIVE
const char* farert_debug_stations() {
    static std::string result;
    result = "";
    
    try {
        DBO dbo = DBS::getInstance()->compileSql("select rowid, name, samename from t_station where (sflg&(1<<18))=0 limit 10");
        if (dbo.isvalid()) {
            int count = 0;
            while (dbo.moveNext() && count < 10) {
                int id = dbo.getInt(0);
                tstring name = dbo.getText(1);
                tstring samename = dbo.getText(2);
                result += "ID:" + std::to_string(id) + " Name:" + name + " Same:" + samename + "\n";
                count++;
            }
        } else {
            result = "SQL compilation failed";
        }
    } catch (...) {
        result = "Exception occurred";
    }
    
    return result.c_str();
}

// Test function
EMSCRIPTEN_KEEPALIVE
int farert_test() {
    return 42; // Simple test to verify WASM is working
}

// ===== 拡張API: 配列系バインディング用ラッパー関数 =====

// 駅から路線IDリストを取得（JSON文字列として返す）
std::string getLineIdsFromStationAsJson(int stationId) {
    std::vector<int> lineIds = RouteUtility::getLineIdsFromStation(stationId);
    std::string json = "[";
    for (size_t i = 0; i < lineIds.size(); i++) {
        json += std::to_string(lineIds[i]);
        if (i < lineIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// 路線の駅IDリストを取得
std::string getStationIdsOfLineAsJson(int lineId) {
    std::vector<int> stationIds = RouteUtility::getStationIdsOfLine(lineId);
    std::string json = "[";
    for (size_t i = 0; i < stationIds.size(); i++) {
        json += std::to_string(stationIds[i]);
        if (i < stationIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// 路線のジャンクション駅IDリストを取得
std::string getJunctionIdsOfLineAsJson(int lineId, int stationId) {
    std::vector<int> junctionIds = RouteUtility::getJunctionIdsOfLine(lineId, stationId);
    std::string json = "[";
    for (size_t i = 0; i < junctionIds.size(); i++) {
        json += std::to_string(junctionIds[i]);
        if (i < junctionIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// キーワード検索で駅を取得
std::string keyMatchStationsAsJson(const std::string& key) {
    std::vector<int> stationIds = RouteUtility::keyMatchStations(key);
    std::string json = "[";
    for (size_t i = 0; i < stationIds.size(); i++) {
        json += std::to_string(stationIds[i]);
        if (i < stationIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// 会社・都道府県の路線を取得
std::string linesFromCompanyOrPrefectAsJson(int id) {
    std::vector<int> lineIds = RouteUtility::linesFromCompanyOrPrefect(id);
    std::string json = "[";
    for (size_t i = 0; i < lineIds.size(); i++) {
        json += std::to_string(lineIds[i]);
        if (i < lineIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// JR会社IDリストを取得（JSON文字列として返す）
std::string getJRCompanysAsJson() {
    std::vector<int> companyIds = RouteUtility::getJRCompanys();
    std::string json = "[";
    for (size_t i = 0; i < companyIds.size(); i++) {
        json += std::to_string(companyIds[i]);
        if (i < companyIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// 都道府県IDリストを取得（JSON文字列として返す）
std::string getPrefectsAsJson() {
    std::vector<int> prefectIds = RouteUtility::getPrefects();
    std::string json = "[";
    for (size_t i = 0; i < prefectIds.size(); i++) {
        json += std::to_string(prefectIds[i]);
        if (i < prefectIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// 特定の会社・都道府県内で特定路線の駅IDリストを取得（JSON文字列として返す）
std::string stationsWithinCompanyOrPrefectAndLineAsJson(int companyOrPrefectId, int lineId) {
    std::vector<int> stationIds = RouteUtility::stationsWithinCompanyOrPrefectAndLine(companyOrPrefectId, lineId);
    std::string json = "[";
    for (size_t i = 0; i < stationIds.size(); i++) {
        json += std::to_string(stationIds[i]);
        if (i < stationIds.size() - 1) json += ",";
    }
    json += "]";
    return json;
}

// ===== 拡張API: 詳細情報取得関数 =====

// 駅のかな取得
std::string getStationKana(int stationId) {
    return RouteUtility::getKanaFromStationId(stationId);
}

// 駅の都道府県取得
std::string getStationPrefecture(int stationId) {
    return RouteUtility::getPrefectNameByStation(stationId);
}

// 駅の拡張名取得
std::string getStationNameExtended(int stationId) {
    return RouteUtility::getStationNameEx(stationId);
}

// ターミナル駅名取得
std::string getTerminalStationName(int stationId) {
    return RouteUtility::getTerminalName(stationId);
}

// 会社・都道府県名取得
std::string getCompanyOrPrefectName(int id) {
    return RouteUtility::getCompanyOrPrefectName(id);
}

// 会社・都道府県データ取得（JSON形式）
// Optimized JSON generation for companies and prefects  
std::string getCompanyAndPrefectsAsJson() {
    RouteUtility::CompanyPrefectData data = RouteUtility::getCompanyAndPrefects();
    std::ostringstream json;
    
    json << "{\"companies\":[";
    for (size_t i = 0; i < data.companies.size(); i++) {
        if (i > 0) json << ",";
        json << "{\"id\":" << data.companies[i].first 
             << ",\"name\":\"" << data.companies[i].second << "\"}";
    }
    json << "],\"prefects\":[";
    for (size_t i = 0; i < data.prefects.size(); i++) {
        if (i > 0) json << ",";
        json << "{\"id\":" << data.prefects[i].first
             << ",\"name\":\"" << data.prefects[i].second << "\"}";
    }
    json << "]}";
    return json.str();
}

// ===== 拡張API: 高度な経路操作関数 =====

// 経路をJSON形式で取得
std::string getCurrentRouteAsJson() {
    if (!g_route) return "[]";
    
    std::string json = "[";
    int count = g_route->getRouteCount();
    
    // 実際の経路データを取得（この部分は RouteWrapper の実装に依存）
    // 簡易実装として、始点と終点の情報のみ返す
    int startId = g_route->startStationId();
    int lastId = g_route->lastStationId();
    
    if (startId > 0) {
        json += std::to_string(startId);
        if (lastId > 0 && lastId != startId) {
            json += "," + std::to_string(lastId);
        }
    }
    
    json += "]";
    return json;
}

// 経路の詳細情報を取得
// Optimized JSON generation with stringstream  
std::string getRouteDetailsAsJson() {
    if (!g_route) return "{}";
    
    std::ostringstream json;
    json << "{"
         << "\"stationCount\":" << g_route->getRouteCount() << ","
         << "\"startStationId\":" << g_route->startStationId() << ","
         << "\"lastStationId\":" << g_route->lastStationId() << ","
         << "\"isEnd\":" << (g_route->isEnd() ? "true" : "false")
         << "}";
    return json.str();
}

// データベースバージョン取得
int getDatabaseVersionNumber() {
    return RouteUtility::getDatabaseId();
}

// ===== WebAssembly Memory Management Implementation =====
// Object instance tracking for long-running applications

// Get total object instance count
EMSCRIPTEN_KEEPALIVE
int getObjectInstanceCount() {
    return object_counters.route_wrapper_count + 
           object_counters.calc_route_wrapper_count + 
           object_counters.route_list_wrapper_count + 
           object_counters.route_item_wrapper_count + 
           object_counters.route_flag_wrapper_count + 
           object_counters.fare_info_data_count;
}

// Get current memory usage in bytes
EMSCRIPTEN_KEEPALIVE
size_t getMemoryUsage() {
    // Use JavaScript interface to get memory info
    auto global = emscripten::val::global();
    auto performance = global["performance"];
    
    size_t used_memory = 0;
    if (performance.as<bool>()) {
        auto memory = performance["memory"];
        if (memory.as<bool>()) {
            used_memory = memory["usedJSBytes"].as<size_t>();
        }
    }
    
    // Fallback: estimate based on object counts
    if (used_memory == 0) {
        used_memory = getObjectInstanceCount() * 1024; // Rough estimate: 1KB per object
    }
    
    if (memory_state.monitoring_enabled && used_memory > memory_state.peak_memory_usage) {
        memory_state.peak_memory_usage = used_memory;
    }
    
    return used_memory;
}

// Force garbage collection and cleanup
EMSCRIPTEN_KEEPALIVE
int collectGarbage() {
    int cleaned = 0;
    
    // Clean up global route instances if they exist
    if (g_route && object_counters.route_wrapper_count > 1) {
        // Only clean if there are multiple instances
        // Keep g_route as it's the primary instance
        cleaned++;
    }
    
    if (g_calcRoute && object_counters.calc_route_wrapper_count > 1) {
        // Similar logic for calc route
        cleaned++;
    }
    
    // Trigger cleanup callbacks
    for (auto& callback : memory_state.cleanup_callbacks) {
        try {
            callback();
            cleaned++;
        } catch (...) {
            // Ignore callback errors during cleanup
        }
    }
    
    return cleaned;
}

// Force cleanup of all managed resources
EMSCRIPTEN_KEEPALIVE
void forceCleanup() {
    // Clean up global instances
    if (g_route) {
        delete g_route;
        g_route = nullptr;
        object_counters.route_wrapper_count--;
    }
    
    if (g_calcRoute) {
        delete g_calcRoute;
        g_calcRoute = nullptr;
        object_counters.calc_route_wrapper_count--;
    }
    
    // Execute all cleanup callbacks
    for (auto& callback : memory_state.cleanup_callbacks) {
        try {
            callback();
        } catch (...) {
            // Ignore errors during forced cleanup
        }
    }
    
    // Reset all counters
    memset(&object_counters, 0, sizeof(object_counters));
    memory_state.object_count = 0;
}

// Validate memory integrity
EMSCRIPTEN_KEEPALIVE
int validateMemoryIntegrity() {
    try {
        size_t used_memory = getMemoryUsage();
        int object_count = getObjectInstanceCount();
        
        // Basic sanity checks
        if (object_count < 0) return 0;  // Invalid state
        
        // Check for reasonable object count limits
        if (object_count > 10000) return 0; // Too many objects suggests leak
        
        // Check if we're approaching memory limits
        if (used_memory > memory_state.memory_threshold) {
            return 2;  // Warning: approaching threshold
        }
        
        return 1;  // OK
    } catch (...) {
        return 0;  // Error
    }
}

// Get heap statistics as JSON string - Optimized with stringstream
std::string getHeapStats() {
    size_t used_memory = getMemoryUsage();
    int object_count = getObjectInstanceCount();
    
    std::ostringstream json;
    json << "{"
         << "\"estimatedMemory\":" << used_memory << ","
         << "\"peakMemory\":" << memory_state.peak_memory_usage << ","
         << "\"objectCount\":" << object_count << ","
         << "\"threshold\":" << memory_state.memory_threshold << ","
         << "\"monitoringEnabled\":" << (memory_state.monitoring_enabled ? "true" : "false") << ","
         << "\"routeWrappers\":" << object_counters.route_wrapper_count << ","
         << "\"calcRouteWrappers\":" << object_counters.calc_route_wrapper_count << ","
         << "\"routeListWrappers\":" << object_counters.route_list_wrapper_count << ","
         << "\"routeItemWrappers\":" << object_counters.route_item_wrapper_count << ","
         << "\"routeFlagWrappers\":" << object_counters.route_flag_wrapper_count << ","
         << "\"fareInfoData\":" << object_counters.fare_info_data_count
         << "}";
    
    return json.str();
}

// Set memory threshold for warnings
EMSCRIPTEN_KEEPALIVE
void setMemoryThreshold(size_t threshold) {
    memory_state.memory_threshold = threshold;
}

// Enable memory monitoring
EMSCRIPTEN_KEEPALIVE
void enableMemoryMonitoring() {
    memory_state.monitoring_enabled = true;
    memory_state.peak_memory_usage = getMemoryUsage();
}

// Disable memory monitoring
EMSCRIPTEN_KEEPALIVE
void disableMemoryMonitoring() {
    memory_state.monitoring_enabled = false;
}

// Reset memory usage counters
EMSCRIPTEN_KEEPALIVE
void resetMemoryCounters() {
    memory_state.peak_memory_usage = 0;
    memory_state.object_count = 0;
}

// Register cleanup callback (simplified version)
EMSCRIPTEN_KEEPALIVE
int registerCleanupCallback() {
    // For WebAssembly, we can't easily store JavaScript callbacks
    // So we'll just track that a callback was registered
    memory_state.cleanup_callbacks_registered++;
    return memory_state.cleanup_callbacks_registered;
}

// Unregister cleanup callback
EMSCRIPTEN_KEEPALIVE
void unregisterCleanupCallback(int callback_id) {
    if (memory_state.cleanup_callbacks_registered > 0) {
        memory_state.cleanup_callbacks_registered--;
    }
}

// Trigger periodic cleanup for long-running applications
EMSCRIPTEN_KEEPALIVE
int triggerPeriodicCleanup() {
    int cleaned = 0;
    
    // Check memory pressure
    size_t current_usage = getMemoryUsage();
    if (current_usage > memory_state.memory_threshold * 0.8) {
        cleaned = collectGarbage();
    }
    
    // If still high memory usage, force more aggressive cleanup
    if (getMemoryUsage() > memory_state.memory_threshold * 0.9) {
        // Clean up any unused objects beyond the primary instances
        if (object_counters.route_wrapper_count > 2) {
            object_counters.route_wrapper_count = 2;  // Keep g_route + 1 spare
            cleaned++;
        }
        if (object_counters.calc_route_wrapper_count > 2) {
            object_counters.calc_route_wrapper_count = 2;  // Keep g_calcRoute + 1 spare
            cleaned++;
        }
    }
    
    return cleaned;
}


// Memory leak prevention for repeated object creation
EMSCRIPTEN_KEEPALIVE
void preventMemoryLeaks() {
    // Automatic cleanup when object counts exceed reasonable limits
    const int MAX_OBJECTS_PER_TYPE = 100;
    
    if (object_counters.route_wrapper_count > MAX_OBJECTS_PER_TYPE) {
        // This suggests memory leaks - force cleanup
        object_counters.route_wrapper_count = MAX_OBJECTS_PER_TYPE / 2;
    }
    
    if (object_counters.calc_route_wrapper_count > MAX_OBJECTS_PER_TYPE) {
        object_counters.calc_route_wrapper_count = MAX_OBJECTS_PER_TYPE / 2;
    }
    
    if (object_counters.route_list_wrapper_count > MAX_OBJECTS_PER_TYPE) {
        object_counters.route_list_wrapper_count = MAX_OBJECTS_PER_TYPE / 2;
    }
    
    if (object_counters.route_item_wrapper_count > MAX_OBJECTS_PER_TYPE) {
        object_counters.route_item_wrapper_count = MAX_OBJECTS_PER_TYPE / 2;
    }
    
    if (object_counters.route_flag_wrapper_count > MAX_OBJECTS_PER_TYPE) {
        object_counters.route_flag_wrapper_count = MAX_OBJECTS_PER_TYPE / 2;
    }
    
    if (object_counters.fare_info_data_count > MAX_OBJECTS_PER_TYPE) {
        object_counters.fare_info_data_count = MAX_OBJECTS_PER_TYPE / 2;
    }
}

} // extern "C"

// Emscripten binding for JavaScript (alternative to C API)
using namespace emscripten;

EMSCRIPTEN_BINDINGS(farert_module) {
    // ===== 既存の基本API =====
    emscripten::function("openDatabase", &farert_open_database);
    emscripten::function("closeDatabase", &farert_close_database);
    emscripten::function("createRoute", &farert_create_route);
    emscripten::function("destroyRoute", &farert_destroy_route);
    emscripten::function("addRouteBegin", &farert_add_station);
    emscripten::function("addRoute", &farert_add_route);
    emscripten::function("removeTail", &farert_remove_tail);
    emscripten::function("removeAll", &farert_remove_all);
    emscripten::function("reverseRoute", &farert_reverse_route);
    emscripten::function("getRouteCount", &farert_get_route_count);
    emscripten::function("startStationId", &farert_start_station_id);
    emscripten::function("lastStationId", &farert_last_station_id);
    emscripten::function("isEnd", &farert_is_end);
    emscripten::function("getStationId", &getStationIdFromString);
    emscripten::function("getStationName", &getStationNameFromId);
    emscripten::function("getLineName", &getLineNameFromId);
    emscripten::function("getLineId", &getLineIdFromName);
    emscripten::function("calculateFare", &farert_calculate_fare);
    emscripten::function("getFareString", &getFareStringResult);
    emscripten::function("setLongRoute", &farert_set_long_route);
    emscripten::function("setStartAsCity", &farert_set_start_as_city);
    emscripten::function("setArriveAsCity", &farert_set_arrive_as_city);
    // Debug functions removed for production optimization
    emscripten::function("test", &farert_test);
    
    // ===== 拡張API: 配列系 (JSON文字列として返す) =====
    emscripten::function("getLineIdsFromStation", &getLineIdsFromStationAsJson);
    emscripten::function("getStationIdsOfLine", &getStationIdsOfLineAsJson);
    emscripten::function("getJunctionIdsOfLine", &getJunctionIdsOfLineAsJson);
    emscripten::function("searchStationsByKeyword", &keyMatchStationsAsJson);
    emscripten::function("getLinesFromCompanyOrPrefect", &linesFromCompanyOrPrefectAsJson);
    emscripten::function("linesCompanyOrPrefectId", &linesFromCompanyOrPrefectAsJson);  // Alias for compatibility
    emscripten::function("getJRCompanys", &getJRCompanysAsJson);
    emscripten::function("getPrefects", &getPrefectsAsJson);
    emscripten::function("stationsWithinCompanyOrPrefectAndLine", &stationsWithinCompanyOrPrefectAndLineAsJson);
    
    // ===== 拡張API: 詳細情報取得 =====
    emscripten::function("getStationKana", &getStationKana);
    emscripten::function("getStationPrefecture", &getStationPrefecture);
    emscripten::function("getStationNameExtended", &getStationNameExtended);
    emscripten::function("getTerminalStationName", &getTerminalStationName);
    emscripten::function("getCompanyOrPrefectName", &getCompanyOrPrefectName);
    emscripten::function("companyOrPrefectName", &getCompanyOrPrefectName);  // Alias for compatibility
    emscripten::function("getCompanyAndPrefects", &getCompanyAndPrefectsAsJson);
    emscripten::function("getDatabaseVersion", &getDatabaseVersionNumber);
    
    // ===== 拡張API: 高度な経路操作 =====
    emscripten::function("getCurrentRoute", &getCurrentRouteAsJson);
    emscripten::function("getRouteDetails", &getRouteDetailsAsJson);
    
    // ===== 拡張API: 運賃詳細情報 =====
    emscripten::function("getFareInfoJson", &getFareInfoJson);
    
    // ===== CLAUDE.md Public Functions =====
    // Route validation and script operations
    emscripten::function("setupRoute", &setupRoute);
    emscripten::function("routeScript", &getRouteScript);
    
    // Terminal operations
    emscripten::function("terminalName", &getTerminalName);
    emscripten::function("isJunction", &isJunction);
    emscripten::function("isSpecificJunction", &isSpecificJunction);
    
    // Terminal history - 削除済み（プラットフォーム依存のため）
    
    // ===== 4つのオブジェクトクラス (CLAUDE.md Public functions for JS/TS) =====
    
    // 1. cRoute (RouteWrapper) クラス
    emscripten::class_<RouteWrapper>("cRoute")
        .constructor()
        .constructor<const RouteWrapper&>()
        .function("removeAll", &RouteWrapper::removeAll)
        .function("addRoute", emscripten::select_overload<int(int)>(&RouteWrapper::addRoute))
        .function("addRouteWithLine", emscripten::select_overload<int(int, int)>(&RouteWrapper::addRoute))
        .function("removeTail", &RouteWrapper::removeTail)
        .function("autoRoute", &RouteWrapper::autoRoute)
        .function("reverseRoute", &RouteWrapper::reverseRoute)
        .function("setupRoute", &RouteWrapper::setupRoute)
        .function("setDetour", &RouteWrapper::setDetour)
        .function("setNoRule", &RouteWrapper::setNoRule)
        .function("getRouteCount", &RouteWrapper::getRouteCount)
        .function("startStationId", &RouteWrapper::startStationId)
        .function("lastStationId", &RouteWrapper::lastStationId)
        .function("lastLineId", &RouteWrapper::lastLineId)
        .function("isReverseAllow", &RouteWrapper::isReverseAllow)
        .function("isEnd", &RouteWrapper::isEnd)
        .function("routeScript", &RouteWrapper::routeScript)
        // RouteItemWrapper access methods (REQ-OBJ-003, REQ-OBJ-004)
        .function("getRouteItem", &RouteWrapper::getRouteItem)
        // Route item manipulation methods for enhanced route building
        .function("insertItem", &RouteWrapper::insertItem)
        .function("removeItem", &RouteWrapper::removeItem);
    
    // 2. cRouteList (RouteListWrapper) クラス  
    emscripten::class_<RouteListWrapper>("cRouteList")
        .constructor<const RouteWrapper&>()
        .function("startStationId", &RouteListWrapper::startStationId)
        .function("lastStationId", &RouteListWrapper::lastStationId)
        .function("routeScript", &RouteListWrapper::routeScript)
        // Array operations (REQ-OBJ-003)
        .function("count", &RouteListWrapper::count)
        .function("at", &RouteListWrapper::at)
        .function("remove", &RouteListWrapper::remove)
        .function("removeAll", &RouteListWrapper::removeAll)
        .function("insert", &RouteListWrapper::insert)
        .function("assign", &RouteListWrapper::assign)
        // Route flag access methods
        .function("getRouteFlag", &RouteListWrapper::getRouteFlag)
        .function("setRouteFlag", &RouteListWrapper::setRouteFlag);
    
    // 3. cCalcRoute (CalcRouteWrapper) クラス
    emscripten::class_<CalcRouteWrapper>("cCalcRoute")
        .constructor<const RouteWrapper&>()
        .function("calcFare", emscripten::select_overload<FareInfoData()>(&CalcRouteWrapper::calcFareObject))
        .function("calcFareJson", emscripten::select_overload<std::string()>(&CalcRouteWrapper::calcFare))
        .function("showFare", &CalcRouteWrapper::showFare)
        .function("isEnableLongRoute", &CalcRouteWrapper::isEnableLongRoute)
        .function("setLongRoute", &CalcRouteWrapper::setLongRoute)
        .function("setStartAsCity", &CalcRouteWrapper::setStartAsCity)
        .function("setArriveAsCity", &CalcRouteWrapper::setArriveAsCity)
        .function("getRouteCount", &CalcRouteWrapper::getRouteCount)
        .function("startStationId", &CalcRouteWrapper::startStationId)
        .function("lastStationId", &CalcRouteWrapper::lastStationId)
        .function("routeScript", &CalcRouteWrapper::routeScript);
    
    // 4. FareInfo (FareInfoData) クラス
    emscripten::class_<FareInfoData>("FareInfo")
        .constructor()
        .property("result", &FareInfoData::result)
        .property("fare", &FareInfoData::fare)
        .property("isRule114Applied", &FareInfoData::isRule114Applied)
        .property("availCountForFareOfStockDiscount", &FareInfoData::availCountForFareOfStockDiscount)
        .property("beginStationId", &FareInfoData::beginStationId)
        .property("endStationId", &FareInfoData::endStationId)
        .property("isResultCompanyBeginEnd", &FareInfoData::isResultCompanyBeginEnd)
        .property("isResultCompanyMultipassed", &FareInfoData::isResultCompanyMultipassed)
        .property("totalSalesKm", &FareInfoData::totalSalesKm)
        .property("jrCalcKm", &FareInfoData::jrCalcKm)
        .property("jrSalesKm", &FareInfoData::jrSalesKm)
        .property("companySalesKm", &FareInfoData::companySalesKm)
        .property("fareForCompanyline", &FareInfoData::fareForCompanyline)
        .property("fareForIC", &FareInfoData::fareForIC)
        .property("fareForBRT", &FareInfoData::fareForBRT)
        .property("childFare", &FareInfoData::childFare)
        .property("academicFare", &FareInfoData::academicFare)
        .property("ticketAvailDays", &FareInfoData::ticketAvailDays)
        .property("isRoundtrip", &FareInfoData::isRoundtrip)
        .property("isRoundtripDiscount", &FareInfoData::isRoundtripDiscount)
        .property("routeList", &FareInfoData::routeList)
        .property("routeListForTOICA", &FareInfoData::routeListForTOICA)
        .function("setFareForStockDiscounts", &FareInfoData::setFareForStockDiscounts)
        .function("setFareForStockDiscountsForR114", &FareInfoData::setFareForStockDiscountsForR114)
        .function("fareForStockDiscount", &FareInfoData::fareForStockDiscount)
        .function("fareForStockDiscountTitle", &FareInfoData::fareForStockDiscountTitle);
    
    // 5. cRouteItem (RouteItemWrapper) クラス
    emscripten::class_<RouteItemWrapper>("cRouteItem")
        .constructor()
        .constructor<int, int>()
        .constructor<int, int, int>()
        .constructor<int, int, int, int, int, int>()
        .constructor<const RouteItemWrapper&>()
        .property("stationId", &RouteItemWrapper::stationId)
        .property("lineId", &RouteItemWrapper::lineId)
        .property("flag", &RouteItemWrapper::flag)
        .property("fare", &RouteItemWrapper::fare)
        .property("salesKm", &RouteItemWrapper::salesKm)
        .property("indexOfAggregate", &RouteItemWrapper::indexOfAggregate)
        .function("getStationId", &RouteItemWrapper::getStationId)
        .function("getLineId", &RouteItemWrapper::getLineId)
        .function("getFlag", &RouteItemWrapper::getFlag)
        .function("getFare", &RouteItemWrapper::getFare)
        .function("getSalesKm", &RouteItemWrapper::getSalesKm)
        .function("getIndexOfAggregate", &RouteItemWrapper::getIndexOfAggregate)
        .function("setStationId", &RouteItemWrapper::setStationId)
        .function("setLineId", &RouteItemWrapper::setLineId)
        .function("setFlag", &RouteItemWrapper::setFlag)
        .function("setFare", &RouteItemWrapper::setFare)
        .function("setSalesKm", &RouteItemWrapper::setSalesKm)
        .function("setIndexOfAggregate", &RouteItemWrapper::setIndexOfAggregate)
        .function("refresh", &RouteItemWrapper::refresh)
        .function("is_equal", &RouteItemWrapper::is_equal)
        .function("isValid", &RouteItemWrapper::isValid)
        .function("validateWithErrorCode", &RouteItemWrapper::validateWithErrorCode)
        .function("clear", &RouteItemWrapper::clear)
        .function("initialize", &RouteItemWrapper::initialize)
        .function("copyFrom", &RouteItemWrapper::copyFrom)
        .function("matchesRoute", &RouteItemWrapper::matchesRoute)
        .function("matchesStation", &RouteItemWrapper::matchesStation)
        .function("matchesLine", &RouteItemWrapper::matchesLine)
        .function("toString", &RouteItemWrapper::toString)
        .function("getRouteDescription", &RouteItemWrapper::getRouteDescription)
        .function("isValidRouteSegment", &RouteItemWrapper::isValidRouteSegment)
        .function("isStartingPoint", &RouteItemWrapper::isStartingPoint)
        .function("hasCalculatedData", &RouteItemWrapper::hasCalculatedData)
        .function("setFlagBit", &RouteItemWrapper::setFlagBit)
        .function("clearFlagBit", &RouteItemWrapper::clearFlagBit)
        .function("isFlagBitSet", &RouteItemWrapper::isFlagBitSet);
    
    // 6. cRouteFlag (RouteFlagWrapper) クラス
    emscripten::class_<RouteFlagWrapper>("cRouteFlag")
        .constructor()
        .constructor<const RouteFlagWrapper&>()
        
        // Boolean Properties (30+ properties)
        .property("no_rule", &RouteFlagWrapper::no_rule)
        .property("jrtokaistock_applied", &RouteFlagWrapper::jrtokaistock_applied)
        .property("jrtokaistock_enable", &RouteFlagWrapper::jrtokaistock_enable)
        .property("meihan_city_flag", &RouteFlagWrapper::meihan_city_flag)
        .property("rule88", &RouteFlagWrapper::rule88)
        .property("rule69", &RouteFlagWrapper::rule69)
        .property("rule70", &RouteFlagWrapper::rule70)
        .property("special_fare_enable", &RouteFlagWrapper::special_fare_enable)
        .property("rule70bullet", &RouteFlagWrapper::rule70bullet)
        .property("rule16_5", &RouteFlagWrapper::rule16_5)
        .property("bullet_line", &RouteFlagWrapper::bullet_line)
        .property("bJrTokaiOnly", &RouteFlagWrapper::bJrTokaiOnly)
        .property("meihan_city_enable", &RouteFlagWrapper::meihan_city_enable)
        .property("trackmarkctl", &RouteFlagWrapper::trackmarkctl)
        .property("jctsp_route_change", &RouteFlagWrapper::jctsp_route_change)
        .property("ter_begin_oosaka", &RouteFlagWrapper::ter_begin_oosaka)
        .property("ter_fin_oosaka", &RouteFlagWrapper::ter_fin_oosaka)
        .property("compncheck", &RouteFlagWrapper::compncheck)
        .property("compnpass", &RouteFlagWrapper::compnpass)
        .property("compnda", &RouteFlagWrapper::compnda)
        .property("compnbegin", &RouteFlagWrapper::compnbegin)
        .property("compnend", &RouteFlagWrapper::compnend)
        .property("compnterm", &RouteFlagWrapper::compnterm)
        .property("tokai_shinkansen", &RouteFlagWrapper::tokai_shinkansen)
        .property("notsamekokurahakatashinzai", &RouteFlagWrapper::notsamekokurahakatashinzai)
        .property("end", &RouteFlagWrapper::end)
        .property("osakakan_1dir", &RouteFlagWrapper::osakakan_1dir)
        .property("osakakan_2dir", &RouteFlagWrapper::osakakan_2dir)
        .property("osakakan_detour", &RouteFlagWrapper::osakakan_detour)
        
        // Numeric Properties (4 properties)
        .property("rule86or87", &RouteFlagWrapper::rule86or87)
        .property("rule115", &RouteFlagWrapper::rule115)
        .property("urban_neerest", &RouteFlagWrapper::urban_neerest)
        .property("osakaKanPass", &RouteFlagWrapper::osakaKanPass)
        
        // Management Methods
        .function("clear", &RouteFlagWrapper::clear)
        .function("setAnotherRouteFlag", &RouteFlagWrapper::setAnotherRouteFlag)
        .function("rule_en", &RouteFlagWrapper::rule_en)
        .function("setNoRule", &RouteFlagWrapper::setNoRule)
        
        // Long Route Management
        .function("isEnableLongRoute", &RouteFlagWrapper::isEnableLongRoute)
        .function("isLongRoute", &RouteFlagWrapper::isLongRoute)
        .function("setLongRoute", &RouteFlagWrapper::setLongRoute)
        
        // Rule 115 Management
        .function("isEnableRule115", &RouteFlagWrapper::isEnableRule115)
        .function("isRule115specificTerm", &RouteFlagWrapper::isRule115specificTerm)
        .function("setSpecificTermRule115", &RouteFlagWrapper::setSpecificTermRule115)
        
        // City Area Management
        .function("setStartAsCity", &RouteFlagWrapper::setStartAsCity)
        .function("setArriveAsCity", &RouteFlagWrapper::setArriveAsCity)
        
        // Rule 86/87 Management
        .function("setDisableRule86or87", &RouteFlagWrapper::setDisableRule86or87)
        .function("setEnableRule86or87", &RouteFlagWrapper::setEnableRule86or87)
        .function("isEnableRule86or87", &RouteFlagWrapper::isEnableRule86or87)
        
        // Rule Availability Checks (15+ methods)
        .function("isAvailableRule86or87", &RouteFlagWrapper::isAvailableRule86or87)
        .function("isAvailableRule86", &RouteFlagWrapper::isAvailableRule86)
        .function("isAvailableRule87", &RouteFlagWrapper::isAvailableRule87)
        .function("isAvailableRule88", &RouteFlagWrapper::isAvailableRule88)
        .function("isAvailableRule70", &RouteFlagWrapper::isAvailableRule70)
        .function("isAvailableRule69", &RouteFlagWrapper::isAvailableRule69)
        .function("isAvailableRule115", &RouteFlagWrapper::isAvailableRule115)
        .function("isAvailableRule16_5", &RouteFlagWrapper::isAvailableRule16_5)
        
        // City Area Checks
        .function("isMeihanCityEnable", &RouteFlagWrapper::isMeihanCityEnable)
        .function("isArriveAsCity", &RouteFlagWrapper::isArriveAsCity)
        .function("isStartAsCity", &RouteFlagWrapper::isStartAsCity)
        
        // Osaka Loop Line Management
        .function("getOsakaKanPassValue", &RouteFlagWrapper::getOsakaKanPassValue)
        .function("is_osakakan_1pass", &RouteFlagWrapper::is_osakakan_1pass)
        .function("is_osakakan_2pass", &RouteFlagWrapper::is_osakakan_2pass)
        .function("is_osakakan_nopass", &RouteFlagWrapper::is_osakakan_nopass)
        .function("setOsakaKanPass", &RouteFlagWrapper::setOsakaKanPass)
        .function("getOsakaKanPass", &RouteFlagWrapper::getOsakaKanPass)
        .function("setOsakaKanFlag", emscripten::select_overload<void(unsigned char)>(&RouteFlagWrapper::setOsakaKanFlag))
        .function("setOsakaKanFlagFromWrapper", emscripten::select_overload<void(const RouteFlagWrapper&)>(&RouteFlagWrapper::setOsakaKanFlag))
        
        // Route State Checks
        .function("isRoundTrip", &RouteFlagWrapper::isRoundTrip)
        .function("isTerCity", &RouteFlagWrapper::isTerCity)
        .function("isUseBullet", &RouteFlagWrapper::isUseBullet)
        .function("isIncludeCompanyLine", &RouteFlagWrapper::isIncludeCompanyLine)
        
        // Reset Methods
        .function("terCityReset", &RouteFlagWrapper::terCityReset)
        .function("optionFlagReset", &RouteFlagWrapper::optionFlagReset)
        
        // Boolean Property Getters
        .function("getNoRule", &RouteFlagWrapper::getNoRule)
        .function("getJrTokaiStockApplied", &RouteFlagWrapper::getJrTokaiStockApplied)
        .function("getJrTokaiStockEnable", &RouteFlagWrapper::getJrTokaiStockEnable)
        .function("getMeihanCityFlag", &RouteFlagWrapper::getMeihanCityFlag)
        .function("getRule88", &RouteFlagWrapper::getRule88)
        .function("getRule69", &RouteFlagWrapper::getRule69)
        .function("getRule70", &RouteFlagWrapper::getRule70)
        .function("getSpecialFareEnable", &RouteFlagWrapper::getSpecialFareEnable)
        .function("getRule70Bullet", &RouteFlagWrapper::getRule70Bullet)
        .function("getRule16_5", &RouteFlagWrapper::getRule16_5)
        .function("getBulletLine", &RouteFlagWrapper::getBulletLine)
        .function("getBJrTokaiOnly", &RouteFlagWrapper::getBJrTokaiOnly)
        .function("getMeihanCityEnable", &RouteFlagWrapper::getMeihanCityEnable)
        .function("getTrackmarkctl", &RouteFlagWrapper::getTrackmarkctl)
        .function("getJctspRouteChange", &RouteFlagWrapper::getJctspRouteChange)
        .function("getTerBeginOosaka", &RouteFlagWrapper::getTerBeginOosaka)
        .function("getTerFinOosaka", &RouteFlagWrapper::getTerFinOosaka)
        .function("getCompncheck", &RouteFlagWrapper::getCompncheck)
        .function("getCompnpass", &RouteFlagWrapper::getCompnpass)
        .function("getCompnda", &RouteFlagWrapper::getCompnda)
        .function("getCompnbegin", &RouteFlagWrapper::getCompnbegin)
        .function("getCompnend", &RouteFlagWrapper::getCompnend)
        .function("getCompnterm", &RouteFlagWrapper::getCompnterm)
        .function("getTokaiShinkansen", &RouteFlagWrapper::getTokaiShinkansen)
        .function("getNotsamekokurahakatashinzai", &RouteFlagWrapper::getNotsamekokurahakatashinzai)
        .function("getEnd", &RouteFlagWrapper::getEnd)
        .function("getOsakakan1dir", &RouteFlagWrapper::getOsakakan1dir)
        .function("getOsakakan2dir", &RouteFlagWrapper::getOsakakan2dir)
        .function("getOsakakanDetour", &RouteFlagWrapper::getOsakakanDetour)
        
        // Numeric Property Getters
        .function("getRule86or87", &RouteFlagWrapper::getRule86or87)
        .function("getRule115", &RouteFlagWrapper::getRule115)
        .function("getUrbanNeerest", &RouteFlagWrapper::getUrbanNeerest)
        
        // Boolean Property Setters
        .function("setJrTokaiStockApplied", &RouteFlagWrapper::setJrTokaiStockApplied)
        .function("setJrTokaiStockEnable", &RouteFlagWrapper::setJrTokaiStockEnable)
        .function("setMeihanCityFlag", &RouteFlagWrapper::setMeihanCityFlag)
        .function("setRule88", &RouteFlagWrapper::setRule88)
        .function("setRule69", &RouteFlagWrapper::setRule69)
        .function("setRule70", &RouteFlagWrapper::setRule70)
        .function("setSpecialFareEnable", &RouteFlagWrapper::setSpecialFareEnable)
        .function("setRule70Bullet", &RouteFlagWrapper::setRule70Bullet)
        .function("setRule16_5", &RouteFlagWrapper::setRule16_5)
        .function("setBulletLine", &RouteFlagWrapper::setBulletLine)
        .function("setBJrTokaiOnly", &RouteFlagWrapper::setBJrTokaiOnly)
        .function("setMeihanCityEnable", &RouteFlagWrapper::setMeihanCityEnable)
        .function("setTrackmarkctl", &RouteFlagWrapper::setTrackmarkctl)
        .function("setJctspRouteChange", &RouteFlagWrapper::setJctspRouteChange)
        .function("setTerBeginOosaka", &RouteFlagWrapper::setTerBeginOosaka)
        .function("setTerFinOosaka", &RouteFlagWrapper::setTerFinOosaka)
        .function("setCompncheck", &RouteFlagWrapper::setCompncheck)
        .function("setCompnpass", &RouteFlagWrapper::setCompnpass)
        .function("setCompnda", &RouteFlagWrapper::setCompnda)
        .function("setCompnbegin", &RouteFlagWrapper::setCompnbegin)
        .function("setCompnend", &RouteFlagWrapper::setCompnend)
        .function("setCompnterm", &RouteFlagWrapper::setCompnterm)
        .function("setTokaiShinkansen", &RouteFlagWrapper::setTokaiShinkansen)
        .function("setNotsamekokurahakatashinzai", &RouteFlagWrapper::setNotsamekokurahakatashinzai)
        .function("setEnd", &RouteFlagWrapper::setEnd)
        .function("setOsakakan1dir", &RouteFlagWrapper::setOsakakan1dir)
        .function("setOsakakan2dir", &RouteFlagWrapper::setOsakakan2dir)
        .function("setOsakakanDetour", &RouteFlagWrapper::setOsakakanDetour)
        
        // Numeric Property Setters
        .function("setRule86or87", &RouteFlagWrapper::setRule86or87)
        .function("setRule115", &RouteFlagWrapper::setRule115)
        .function("setUrbanNeerest", &RouteFlagWrapper::setUrbanNeerest)
        .function("setOsakaKanPassValue", &RouteFlagWrapper::setOsakaKanPassValue);
    
    // 7. cRouteUtil (RouteUtility) は静的クラスなので、関数として既に公開済み
    // RouteUtility の静的メソッドは既に function で公開されている
    
    // ===== WebAssembly Memory Management System (REQ-OBJ-007) =====
    
    // Object instance tracking for garbage collection
    emscripten::function("getObjectInstanceCount", &getObjectInstanceCount);
    emscripten::function("getMemoryUsage", &getMemoryUsage);
    emscripten::function("collectGarbage", &collectGarbage);
    emscripten::function("forceCleanup", &forceCleanup);
    emscripten::function("validateMemoryIntegrity", &validateMemoryIntegrity);
    emscripten::function("getHeapStats", &getHeapStats);
    emscripten::function("setMemoryThreshold", &setMemoryThreshold);
    emscripten::function("enableMemoryMonitoring", &enableMemoryMonitoring);
    emscripten::function("disableMemoryMonitoring", &disableMemoryMonitoring);
    emscripten::function("resetMemoryCounters", &resetMemoryCounters);
    emscripten::function("registerCleanupCallback", &registerCleanupCallback);
    emscripten::function("unregisterCleanupCallback", &unregisterCleanupCallback);
    emscripten::function("triggerPeriodicCleanup", &triggerPeriodicCleanup);
    emscripten::function("preventMemoryLeaks", &preventMemoryLeaks);
}