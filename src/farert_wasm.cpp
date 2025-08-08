#include <emscripten.h>
#include <emscripten/bind.h>
#include "include/route_interface.h"
#include "include/common.h"
#include "core/alpdb.h"

// Global route instance for simple API
static RouteWrapper* g_route = nullptr;
static CalcRouteWrapper* g_calcRoute = nullptr;

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
    }
    g_route = new RouteWrapper();
    return g_route ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE
void farert_destroy_route() {
    if (g_route) {
        delete g_route;
        g_route = nullptr;
    }
    if (g_calcRoute) {
        delete g_calcRoute;
        g_calcRoute = nullptr;
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

std::string getFareStringResult() {
    if (g_calcRoute) {
        return g_calcRoute->showFare();
    }
    return "";
}

std::string debugStationsResult() {
    std::string result = "";
    
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
    
    return result;
}

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
    }
    
    g_calcRoute = new CalcRouteWrapper(*g_route);
    if (!g_calcRoute) return 0;
    
    FARE_INFO* fareInfo = g_calcRoute->calcFare();
    if (fareInfo != nullptr) {
        // Return result based on original calcFare logic
        // 0: success, 1: incomplete route, negative: error
        int resultCode = fareInfo->resultCode();
        delete fareInfo; // Clean up memory
        return (resultCode >= 0) ? 1 : 0; // 1 for success or recoverable, 0 for failure
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
std::string getCompanyAndPrefectsAsJson() {
    CompanyPrefectData data = RouteUtility::getCompanyAndPrefects();
    std::string json = "{";
    json += "\"companies\":[";
    for (size_t i = 0; i < data.companies.size(); i++) {
        json += "{\"id\":" + std::to_string(data.companies[i].first) + 
                ",\"name\":\"" + data.companies[i].second + "\"}";
        if (i < data.companies.size() - 1) json += ",";
    }
    json += "],\"prefects\":[";
    for (size_t i = 0; i < data.prefects.size(); i++) {
        json += "{\"id\":" + std::to_string(data.prefects[i].first) + 
                ",\"name\":\"" + data.prefects[i].second + "\"}";
        if (i < data.prefects.size() - 1) json += ",";
    }
    json += "]}";
    return json;
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
std::string getRouteDetailsAsJson() {
    if (!g_route) return "{}";
    
    std::string json = "{";
    json += "\"stationCount\":" + std::to_string(g_route->getRouteCount()) + ",";
    json += "\"startStationId\":" + std::to_string(g_route->startStationId()) + ",";
    json += "\"lastStationId\":" + std::to_string(g_route->lastStationId()) + ",";
    json += "\"isEnd\":" + (g_route->isEnd() ? "true" : "false");
    json += "}";
    return json;
}

// データベースバージョン取得
int getDatabaseVersionNumber() {
    return RouteUtility::getDatabaseId();
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
    emscripten::function("addStation", &farert_add_station);
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
    emscripten::function("calculateFare", &farert_calculate_fare);
    emscripten::function("getFareString", &getFareStringResult);
    emscripten::function("setLongRoute", &farert_set_long_route);
    emscripten::function("setStartAsCity", &farert_set_start_as_city);
    emscripten::function("setArriveAsCity", &farert_set_arrive_as_city);
    emscripten::function("debugStations", &debugStationsResult);
    emscripten::function("test", &farert_test);
    
    // ===== 拡張API: 配列系 (JSON文字列として返す) =====
    emscripten::function("getLineIdsFromStation", &getLineIdsFromStationAsJson);
    emscripten::function("getStationIdsOfLine", &getStationIdsOfLineAsJson);
    emscripten::function("getJunctionIdsOfLine", &getJunctionIdsOfLineAsJson);
    emscripten::function("searchStationsByKeyword", &keyMatchStationsAsJson);
    emscripten::function("getLinesFromCompanyOrPrefect", &linesFromCompanyOrPrefectAsJson);
    
    // ===== 拡張API: 詳細情報取得 =====
    emscripten::function("getStationKana", &getStationKana);
    emscripten::function("getStationPrefecture", &getStationPrefecture);
    emscripten::function("getStationNameExtended", &getStationNameExtended);
    emscripten::function("getTerminalStationName", &getTerminalStationName);
    emscripten::function("getCompanyOrPrefectName", &getCompanyOrPrefectName);
    emscripten::function("getCompanyAndPrefects", &getCompanyAndPrefectsAsJson);
    emscripten::function("getDatabaseVersion", &getDatabaseVersionNumber);
    
    // ===== 拡張API: 高度な経路操作 =====
    emscripten::function("getCurrentRoute", &getCurrentRouteAsJson);
    emscripten::function("getRouteDetails", &getRouteDetailsAsJson);
}