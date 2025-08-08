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

// Forward declaration for RouteItem
class RouteItem;

// Route wrapper class (corresponds to cRoute)
class RouteWrapper {
public:
    Route* route;  // Made public for friend classes access
    
public:
    RouteWrapper();
    RouteWrapper(const RouteWrapper& source);
    RouteWrapper(const class RouteListWrapper& source);
    RouteWrapper(const RouteWrapper& source, int count);
    ~RouteWrapper();
    
    void sync(const class CalcRouteWrapper& source);
    void assign(const class RouteListWrapper& source);
    
    // Basic route operations
    void removeAll();
    int addRoute(int stationId);
    int addRoute(int lineId, int stationId);
    void removeTail();
    int autoRoute(int useLine, int arriveStationId);
    int typeOfPassedLine(int offset);
    int reverseRoute();
    int setupRoute(const std::string& routeString);
    
    // Route settings
    int setDetour(bool enabled);
    void setNoRule(bool enabled);
    void setNotSameKokuraHakataShinZai(bool enabled);
    bool isNotSameKokuraHakataShinZai() const;
    
    // Route properties
    int getRouteCount() const;
    RouteItem* getRouteItem(int index) const;
    int startStationId() const;
    int lastStationId() const;
    int lastLineId() const;
    bool isReverseAllow() const;
    bool isEnd() const;
    bool isOsakakanDetourEnable() const;
    bool isOsakakanDetourShortcut() const;
    
    // Get route as string
    std::string routeScript() const;
};

// Route list wrapper class (corresponds to cRouteList)
class RouteListWrapper {
public:
    RouteList* routeList;  // Made public for friend classes access
    
public:
    RouteListWrapper(const RouteWrapper& source);
    ~RouteListWrapper();
    
    // Route list properties
    int startStationId() const;
    int lastStationId() const;
    std::string routeScript() const;
};

// Calculation wrapper class (corresponds to cCalcRoute)
class CalcRouteWrapper {
private:
    CalcRoute* calcRoute;
    int lastFareResult;  // Store last fare calculation result code
    
public:
    CalcRouteWrapper(const RouteWrapper& route);
    CalcRouteWrapper(const RouteWrapper& route, int count);
    CalcRouteWrapper(const RouteListWrapper& routeList);
    ~CalcRouteWrapper();
    
    void sync(const RouteWrapper& route);
    void sync(const RouteWrapper& route, int count);
    
    // Fare calculation
    FARE_INFO* calcFare();
    std::string showFare() const;
    
    // Options and settings
    bool isEnableLongRoute() const;
    bool isRule115specificTerm() const;
    void setSpecificTermRule115(bool enable);
    void setStartAsCity();
    void setArriveAsCity();
    void setLongRoute(bool flag);
    
    // Route list operations (inherited from RouteList)
    int getRouteCount() const;
    int startStationId() const;
    int lastStationId() const;
    std::string routeScript() const;
    bool isOsakakanDetourEnable() const;
    bool isOsakakanDetour() const;
};

// Utility functions for station/line lookup
class RouteUtility {
public:
    static int getStationId(const std::string& name);
    static std::string getStationName(int id);
    static std::string getLineName(int id);
    static std::vector<int> getLineIdsFromStation(int stationId);
    
    // Array operations from c_route.mm
    static std::vector<int> getStationIdsOfLine(int lineId);
    static std::vector<int> getJunctionIdsOfLine(int lineId, int stationId);
    static std::string getPrefectNameByStation(int stationId);
    static std::string getKanaFromStationId(int stationId);
    
    // Company and prefecture operations
    struct CompanyPrefectData {
        std::vector<int> companies;
        std::vector<int> prefects;
    };
    static CompanyPrefectData getCompanyAndPrefects();
    static std::vector<int> keyMatchStations(const std::string& key);
    static std::vector<int> linesFromCompanyOrPrefect(int id);
    static std::vector<int> stationsWithinCompanyOrPrefectAndLine(int companyOrPrefectId, int lineId);
    
    // Station properties
    static std::string getTerminalName(int stationId);
    static bool isJunction(int stationId);
    static bool isSpecificJunction(int lineId, int stationId);
    
    // Additional cRouteUtil functions
    static std::string fareNumStr(int num);
    static std::string kmNumStr(int num);
    static std::string getStationNameEx(int id);
    static std::string getCompanyOrPrefectName(int id);
    
    // Route storage operations
    static int saveToRouteArray(const std::vector<int>& routeList);
    static std::string scriptFromRouteArray(const std::vector<int>& routeList);
    static std::string scriptFromRouteArray();
    static std::vector<int> parseScript(const std::string& routeScript);
    
    // Database management
    static void saveToDatabaseId(int dbId);
    static void saveToDatabaseId(int dbId, bool sync);
    static int getDatabaseId();
    
    // Storage operations
    static std::vector<std::vector<int>> loadStorageRoute();
    static bool isRouteInStorage(const std::string& routeString);
    
    // History management
    static void saveToTerminalHistory(const std::string& terminalName);
    static void saveToTerminalHistoryWithArray(const std::vector<std::string>& historyArray);
    static std::vector<std::string> readFromTerminalHistory();
    static std::string readFromKey(const std::string& key);
    static void saveToKey(const std::string& key, const std::string& value, bool sync);
};

#endif // ROUTE_INTERFACE_H