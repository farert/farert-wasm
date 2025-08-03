#include "../include/route_interface.h"
#include "../db/db.h"
#include "alpdb.h"

// DatabaseManager implementation
bool DatabaseManager::openDatabase(const std::string& dbPath) {
    return DBS::getInstance()->open(dbPath.c_str());
}

void DatabaseManager::closeDatabase() {
    DBS::getInstance()->close();
}

bool DatabaseManager::getDatabaseVersion(void* dbsys) {
    return RouteUtil::DbVer((DBsys*)dbsys);
}

// RouteWrapper implementation
RouteWrapper::RouteWrapper() {
    route = new Route();
}

RouteWrapper::~RouteWrapper() {
    delete route;
}

int RouteWrapper::addRoute(int stationId) {
    return route->add(stationId);
}

int RouteWrapper::addRoute(int lineId, int stationId) {
    return route->add(lineId, stationId);
}

void RouteWrapper::removeTail() {
    route->removeTail();
}

void RouteWrapper::removeAll() {
    route->removeAll();
}

int RouteWrapper::reverseRoute() {
    return route->reverse();
}

int RouteWrapper::getRouteCount() const {
    return route->routeList().size();
}

int RouteWrapper::startStationId() const {
    return route->departureStationId();
}

int RouteWrapper::lastStationId() const {
    return route->arriveStationId();
}

bool RouteWrapper::isEnd() const {
    return route->isEnd();
}

std::string RouteWrapper::routeScript() const {
    return route->route_script();
}

// CalcRouteWrapper implementation
CalcRouteWrapper::CalcRouteWrapper(const RouteWrapper& routeWrapper) {
    // Note: This needs to access the private Route* from RouteWrapper
    // For now, we'll create a new CalcRoute. In a full implementation,
    // we'd need friend classes or a different design.
    calcRoute = nullptr; // Placeholder
}

CalcRouteWrapper::~CalcRouteWrapper() {
    delete calcRoute;
}

bool CalcRouteWrapper::calculateFare(FARE_INFO* fareInfo) {
    if (!calcRoute) return false;
    return calcRoute->calcFare(fareInfo) >= 0;
}

std::string CalcRouteWrapper::showFare() const {
    if (!calcRoute) return "";
    // This would return formatted fare information
    return ""; // Placeholder
}

void CalcRouteWrapper::setLongRoute(bool flag) {
    if (calcRoute) {
        calcRoute->refRouteFlag().setLongRoute(flag);
    }
}

void CalcRouteWrapper::setStartAsCity() {
    if (calcRoute) {
        calcRoute->refRouteFlag().setStartAsCity();
    }
}

void CalcRouteWrapper::setArriveAsCity() {
    if (calcRoute) {
        calcRoute->refRouteFlag().setArriveAsCity();
    }
}

// RouteUtility implementation
int RouteUtility::getStationId(const std::string& name) {
    return RouteUtil::GetStationId(name.c_str());
}

std::string RouteUtility::getStationName(int id) {
    return RouteUtil::StationName(id);
}

std::string RouteUtility::getLineName(int id) {
    return RouteUtil::LineName(id);
}

std::vector<int> RouteUtility::getLineIdsFromStation(int stationId) {
    DBO dbo = RouteUtil::Enum_line_of_stationId(stationId);
    std::vector<int> lineIds;
    
    while (dbo.moveNext()) {
        lineIds.push_back(dbo.getInt(0));
    }
    
    return lineIds;
}