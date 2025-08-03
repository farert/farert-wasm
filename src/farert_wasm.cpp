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
    
    FARE_INFO fareInfo;
    return g_calcRoute->calculateFare(&fareInfo) ? 1 : 0;
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

} // extern "C"

// Emscripten binding for JavaScript (alternative to C API)
using namespace emscripten;

EMSCRIPTEN_BINDINGS(farert_module) {
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
    emscripten::function("getStationName", select_overload<const char*(int)>(&farert_get_station_name), allow_raw_pointers());
    emscripten::function("getLineName", select_overload<const char*(int)>(&farert_get_line_name), allow_raw_pointers());
    emscripten::function("calculateFare", &farert_calculate_fare);
    emscripten::function("getFareString", select_overload<const char*()>(&farert_get_fare_string), allow_raw_pointers());
    emscripten::function("setLongRoute", &farert_set_long_route);
    emscripten::function("setStartAsCity", &farert_set_start_as_city);
    emscripten::function("setArriveAsCity", &farert_set_arrive_as_city);
    emscripten::function("debugStations", select_overload<const char*()>(&farert_debug_stations), allow_raw_pointers());
    emscripten::function("test", &farert_test);
}