// wasm_bindings.cpp
// Emscripten bindings for FARERT WASM
// Maps C++ azusa API to TypeScript Farert API

#include <emscripten/bind.h>
#include "../core/azusa.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(farert_module) {
    // Global functions - Database operations
    function("openDatabase", &open_database);
    function("closeDatabase", &close_database);

    // Main Route Class: az_route -> Farert
    class_<az_route>("Farert")
        // Constructor
        .constructor<>()

        // Main view - Route building
        .function("addStartRoute", &az_route::add_start_route)
        .function("addRoute", &az_route::add_route)
        .function("autoRoute", &az_route::auto_route)
        .function("getRouteCount", &az_route::get_route_count)
        .function("departureStationName", &az_route::departure_station_name)
        .function("arrivevalStationName", &az_route::arriveval_station_name)
        .function("buildRoute", &az_route::build_route)
        .function("routeScript", &az_route::route_script)

        // Route manipulation
        .function("removeAll", &az_route::remove_all)
        .function("removeTail", &az_route::remove_tail)
        .function("reverse", &az_route::reverse)

        // Route configuration
        .function("typeOfPassedLine", &az_route::type_of_passed_line)
        .function("setDetour", &az_route::set_detour)
        .function("setNoRule", &az_route::set_no_rule)

        // Fare calculation
        .function("showFare", &az_route::show_fare)

        // Route flags
        .function("setLongRoute", &az_route::set_long_route)
        .function("setJrTokaiStockApply", &az_route::set_jr_tokai_stock_apply)
        .function("setStartAsCity", &az_route::set_start_as_city)
        .function("setArrivalAsCity", &az_route::set_arrival_as_city)
        .function("setSpecificTermRule115", &az_route::set_specific_term_rule115)

        // Route status checks
        .function("isNotSameKokuraHakataShinZai", &az_route::is_not_same_kokura_hakata_shin_zai)
        .function("isAvailableReverse", &az_route::is_available_reverse)
        .function("isOsakakanDetourEnable", &az_route::is_osakakan_detour_enable)
        .function("isOsakakanDetour", &az_route::is_osakakan_detour)
        .function("setNotSameKokuraHakataShinZai", &az_route::set_not_same_kokura_hakata_shin_zai)

        // JSON serialization
        .function("getFareInfoObjectJson", &az_route::get_fare_info_object_json)
        .function("getRoutesJson", &az_route::get_routes_json)
        .function("getRouteRecord", &az_route::get_route_record)
        ;

    // fare_ui namespace functions
    // Global UI functions
    function("getPrefects", &fare_ui::get_prefects);
    function("getCompanys", &fare_ui::get_companys);

    // Line selection functions
    function("getLinesByPrefect", &fare_ui::get_lines_by_prefect);
    function("getLinesByCompany", &fare_ui::get_lines_by_company);
    function("getLinesByStation", &fare_ui::get_lines_by_station);
    function("getStationsByCompanyAndLine", &fare_ui::get_stations_by_company_and_line);
    function("getStationsByPrefectureAndLine", &fare_ui::get_stations_by_prefecture_and_line);

    // Station/Prefecture queries
    function("getPrefectureByStation", &fare_ui::get_prefecture_by_station);
    function("getKanaByStation", &fare_ui::get_kana_by_station);

    // Search functions
    function("searchStationByKeyword", &fare_ui::search_station_by_keyword);
    function("getBranchStationsByLine", &fare_ui::get_branch_stations_by_line);
    function("getStationsByLine", &fare_ui::get_stations_by_line);

    // ID getters
    function("getPrefectId", &fare_ui::get_prefect_id);
    function("getCompanyId", &fare_ui::get_company_id);
}
