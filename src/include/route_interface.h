#ifndef ROUTE_INTERFACE_H
#define ROUTE_INTERFACE_H

#include "common.h"

// Forward declarations from alpdb.h
class Route;
class RouteList;
class CalcRoute;
class FARE_INFO;
class RouteItem;

// Database management
class DatabaseManager {
public:
    static bool openDatabase(const std::string& dbPath);
    static void closeDatabase();
    static bool getDatabaseVersion(void* dbsys);
};

// Route wrapper class
class RouteWrapper {
private:
    Route* route;
    
public:
    RouteWrapper();
    ~RouteWrapper();
    
    // Basic route operations
    int addRoute(int stationId);
    int addRoute(int lineId, int stationId);
    void removeTail();
    void removeAll();
    int reverseRoute();
    
    // Route properties
    int getRouteCount() const;
    int startStationId() const;
    int lastStationId() const;
    bool isEnd() const;
    
    // Get route as string
    std::string routeScript() const;
};

// Calculation wrapper class
class CalcRouteWrapper {
private:
    CalcRoute* calcRoute;
    
public:
    CalcRouteWrapper(const RouteWrapper& route);
    ~CalcRouteWrapper();
    
    // Fare calculation
    bool calculateFare(FARE_INFO* fareInfo);
    std::string showFare() const;
    
    // Options
    void setLongRoute(bool flag);
    void setStartAsCity();
    void setArriveAsCity();
};

// Utility functions for station/line lookup
class RouteUtility {
public:
    static int getStationId(const std::string& name);
    static std::string getStationName(int id);
    static std::string getLineName(int id);
    static std::vector<int> getLineIdsFromStation(int stationId);
};

#endif // ROUTE_INTERFACE_H