#ifndef ROUTE_INTERFACE_H
#define ROUTE_INTERFACE_H

#include "common.h"

// Forward declarations from alpdb.h
class Route;
class RouteList;
class CalcRoute;
class RouteItem;

// FareInfo equivalent structure (matching original FareInfo.h/FareInfo.m)
struct FareInfoData {
    // Member variables matching original FareInfo
    int fareForStockDiscounts[2*2];  // [4] array: [0,1]=normal, [2,3]=rule114
    std::string fareForStockDiscountNames[2];  // [0,1] titles
    
    // Properties from FareInfo.h
    int result;
    bool isResultCompanyBeginEnd;
    bool isResultCompanyMultipassed;
    int beginStationId;
    int endStationId;
    bool isBeginInCity;
    bool isEndInCity;
    int availCountForFareOfStockDiscount;
    int rule114_salesKm;
    int rule114_calcKm;
    bool isRule114Applied;
    bool isSpecificFare;
    int totalSalesKm;
    int jrCalcKm;
    int jrSalesKm;
    int companySalesKm;
    int salesKmForHokkaido;
    int calcKmForHokkaido;
    int brtSalesKm;
    int salesKmForShikoku;
    int calcKmForShikoku;
    int salesKmForKyusyu;
    int calcKmForKyusyu;
    bool isRoundtrip;
    bool isRoundtripDiscount;
    int fareForCompanyline;
    int fare;
    int fareForBRT;
    bool isBRTdiscount;
    int fareForIC;
    int childFare;
    int academicFare;
    int ticketAvailDays;
    std::string routeList;
    std::string routeListForTOICA;
    bool isMeihanCityStartTerminalEnable;
    bool isMeihanCityStart;
    bool isMeihanCityTerminal;
    bool isEnableLongRoute;
    bool isLongRoute;
    bool isRule115specificTerm;
    bool isEnableRule115;
    
    // Constructor
    FareInfoData() {
        // Initialize arrays
        for (int i = 0; i < 4; i++) fareForStockDiscounts[i] = 0;
        for (int i = 0; i < 2; i++) fareForStockDiscountNames[i] = "";
        
        // Initialize all other members to default values
        result = -1;
        isResultCompanyBeginEnd = false;
        isResultCompanyMultipassed = false;
        beginStationId = 0;
        endStationId = 0;
        isBeginInCity = false;
        isEndInCity = false;
        availCountForFareOfStockDiscount = 0;
        rule114_salesKm = 0;
        rule114_calcKm = 0;
        isRule114Applied = false;
        isSpecificFare = false;
        totalSalesKm = 0;
        jrCalcKm = 0;
        jrSalesKm = 0;
        companySalesKm = 0;
        salesKmForHokkaido = 0;
        calcKmForHokkaido = 0;
        brtSalesKm = 0;
        salesKmForShikoku = 0;
        calcKmForShikoku = 0;
        salesKmForKyusyu = 0;
        calcKmForKyusyu = 0;
        isRoundtrip = false;
        isRoundtripDiscount = false;
        fareForCompanyline = 0;
        fare = 0;
        fareForBRT = 0;
        isBRTdiscount = false;
        fareForIC = 0;
        childFare = 0;
        academicFare = 0;
        ticketAvailDays = 0;
        routeList = "";
        routeListForTOICA = "";
        isMeihanCityStartTerminalEnable = false;
        isMeihanCityStart = false;
        isMeihanCityTerminal = false;
        isEnableLongRoute = false;
        isLongRoute = false;
        isRule115specificTerm = false;
        isEnableRule115 = false;
    }
    
    // Methods matching original FareInfo.m
    void setFareForStockDiscounts(int discount1, const std::string& title1, int discount2, const std::string& title2) {
        if (discount1 <= 0) {
            availCountForFareOfStockDiscount = 0;
            fareForStockDiscountNames[0] = "";
            fareForStockDiscountNames[1] = "";
            fareForStockDiscounts[0] = 0;
            fareForStockDiscounts[1] = 0;
        } else {
            if (discount2 <= 0) {
                availCountForFareOfStockDiscount = 1;
                fareForStockDiscounts[1] = 0;
                fareForStockDiscountNames[1] = "";
            } else {
                availCountForFareOfStockDiscount = 2;
                fareForStockDiscounts[1] = discount2;
                fareForStockDiscountNames[1] = title2;
            }
            fareForStockDiscounts[0] = discount1;
            fareForStockDiscountNames[0] = title1;
        }
        fareForStockDiscounts[2] = 0;
        fareForStockDiscounts[3] = 0;
    }
    
    void setFareForStockDiscountsForR114(int discount1, int discount2) {
        fareForStockDiscounts[2] = discount1;
        fareForStockDiscounts[3] = discount2;
    }
    
    int fareForStockDiscount(int index) {
        if (index >= 4) return 0;
        return fareForStockDiscounts[index];
    }
    
    std::string fareForStockDiscountTitle(int index) {
        if (index >= 2) return "";
        return fareForStockDiscountNames[index];
    }
};

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
    std::string calcFare();  // Returns FareInfo as JSON string
    FareInfoData calcFareObject();  // Returns FareInfo as object (for CLAUDE.md compatibility)
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
        std::vector<std::pair<int, std::string>> companies;
        std::vector<std::pair<int, std::string>> prefects;
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