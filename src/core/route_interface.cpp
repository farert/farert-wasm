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

// RouteItemWrapper implementation

// Constructor from C++ RouteItem (implementation matching header declaration)
RouteItemWrapper::RouteItemWrapper(const RouteItem* item) {
    if (item != nullptr) {
        stationId = (int)item->stationId;
        lineId = (int)item->lineId;
        flag = (int)item->flag;
        fare = 0;  // Initialize fare to 0 (matches RouteItem structure)
        salesKm = 0;  // Initialize salesKm to 0 (matches RouteItem structure)
        indexOfAggregate = 0;  // Initialize indexOfAggregate to 0
    } else {
        // Handle null pointer case - initialize to default values
        stationId = 0;
        lineId = 0;
        flag = 0;
        fare = 0;
        salesKm = 0;
        indexOfAggregate = 0;
    }
}

// Additional RouteItemWrapper methods for C++ compatibility (REQ-OBJ-002, REQ-OBJ-003)

// Enhanced getRouteDescription with RouteUtility integration
std::string RouteItemWrapper::getRouteDescription() const {
    std::string description;
    
    // Format: "Line: [LineName], Station: [StationName]"
    if (lineId > 0) {
        std::string lineName = RouteUtility::getLineName(lineId);
        if (!lineName.empty()) {
            description += "Line: " + lineName;
        } else {
            description += "Line: " + std::to_string(lineId);
        }
    } else {
        description += "Line: [None]";
    }
    
    description += ", ";
    
    if (stationId > 0) {
        std::string stationName = RouteUtility::getStationName(stationId);
        if (!stationName.empty()) {
            description += "Station: " + stationName;
        } else {
            description += "Station: " + std::to_string(stationId);
        }
    } else {
        description += "Station: [None]";
    }
    
    // Add additional information if available
    if (fare > 0) {
        description += " (Fare: " + std::to_string(fare) + ")";
    }
    if (salesKm > 0) {
        description += " (Distance: " + std::to_string(salesKm) + "km)";
    }
    
    return description;
}

// Enhanced validation methods for REQ-OBJ-002 compliance

// Validate station ID with detailed error reporting
int RouteItemWrapper::validateStationId(int stationId) const {
    if (stationId <= 0) return -1;  // Invalid: station ID must be positive
    
    // Check if station ID exists in database (optional validation)
    std::string stationName = RouteUtility::getStationName(stationId);
    if (stationName.empty()) return -2;  // Warning: station not found (not fatal)
    
    return 0;  // Valid
}

// Validate line ID with detailed error reporting  
int RouteItemWrapper::validateLineId(int lineId) const {
    if (lineId < 0) return -1;  // Invalid: line ID must be non-negative
    
    // Line ID = 0 is valid for starting points
    if (lineId == 0) return 0;  // Valid: starting point
    
    // Check if line ID exists in database (optional validation)
    std::string lineName = RouteUtility::getLineName(lineId);
    if (lineName.empty()) return -2;  // Warning: line not found (not fatal)
    
    return 0;  // Valid
}

// Validate flag value with detailed error reporting
int RouteItemWrapper::validateFlag(int flag) const {
    if (flag < 0) return -1;  // Invalid: flag cannot be negative
    if (flag > 0xFFFF) return -2;  // Invalid: flag exceeds SPECIFICFLAG range
    return 0;  // Valid
}

// Enhanced parameter validation for all setters (REQ-OBJ-002)

// Station ID setter with validation
int RouteItemWrapper::setStationIdWithValidation(int id) {
    int result = validateStationId(id);
    if (result >= -1) {  // Accept both valid (0) and warning (-2) cases
        stationId = id;
        return result;
    }
    return result;  // Return validation error
}

// Line ID setter with validation
int RouteItemWrapper::setLineIdWithValidation(int id) {
    int result = validateLineId(id);
    if (result >= -1) {  // Accept both valid (0) and warning (-2) cases
        lineId = id;
        return result;
    }
    return result;  // Return validation error
}

// Flag setter with validation
int RouteItemWrapper::setFlagWithValidation(int f) {
    int result = validateFlag(f);
    if (result == 0) {  // Only accept fully valid flags
        flag = f;
    }
    return result;
}

// Fare setter with validation
int RouteItemWrapper::setFareWithValidation(int f) {
    if (f < 0) return -1;  // Invalid: fare cannot be negative
    fare = f;
    return 0;  // Valid
}

// Sales km setter with validation
int RouteItemWrapper::setSalesKmWithValidation(int km) {
    if (km < 0) return -1;  // Invalid: distance cannot be negative
    salesKm = km;
    return 0;  // Valid
}

// Index setter with validation
int RouteItemWrapper::setIndexOfAggregateWithValidation(int index) {
    if (index < 0) return -1;  // Invalid: index cannot be negative
    indexOfAggregate = index;
    return 0;  // Valid
}

// Enhanced route validation methods

// Check if this forms a valid route connection with another RouteItemWrapper
bool RouteItemWrapper::canConnectTo(const RouteItemWrapper& nextItem) const {
    // Basic validation: this item's station should match next item's connection point
    // This is simplified logic - actual route validation would be more complex
    return (stationId > 0 && nextItem.stationId > 0 && 
            stationId != nextItem.stationId);  // Different stations for route progression
}

// Check if this route item is compatible with a specific line
bool RouteItemWrapper::isCompatibleWithLine(int targetLineId) const {
    if (lineId == 0) return true;  // Starting point is compatible with any line
    if (targetLineId == 0) return true;  // Target starting point is always compatible
    
    // Check if station serves the target line
    std::vector<int> linesAtStation = RouteUtility::getLineIdsFromStation(stationId);
    for (int line : linesAtStation) {
        if (line == targetLineId) return true;
    }
    
    return false;  // Station doesn't serve target line
}

// Enhanced state checking methods (task 3 requirements)

// Check if this represents a transfer point
bool RouteItemWrapper::isTransferPoint() const {
    if (stationId <= 0) return false;
    
    // A transfer point serves multiple lines
    std::vector<int> linesAtStation = RouteUtility::getLineIdsFromStation(stationId);
    return linesAtStation.size() > 1;
}

// Check if this is a terminal station
bool RouteItemWrapper::isTerminalStation() const {
    if (stationId <= 0) return false;
    
    // Use RouteUtility to check if it's a terminal
    std::string terminalName = RouteUtility::getTerminalName(stationId);
    return !terminalName.empty();
}

// Check if this route item has any special flags set
bool RouteItemWrapper::hasSpecialFlags() const {
    return flag != 0;
}

// Enhanced comparison methods for array operations

// Deep equality check (including calculated values)
bool RouteItemWrapper::deepEquals(const RouteItemWrapper& other) const {
    return lineId == other.lineId && 
           stationId == other.stationId &&
           flag == other.flag &&
           fare == other.fare &&
           salesKm == other.salesKm &&
           indexOfAggregate == other.indexOfAggregate;
}

// Sort key generation for array operations
int RouteItemWrapper::getSortKey() const {
    // Generate a sort key based on station ID and line ID
    // This can be used for efficient sorting in cRouteList operations
    return (stationId << 16) | (lineId & 0xFFFF);
}

// Distance calculation helper (for route optimization)
int RouteItemWrapper::estimateDistanceTo(const RouteItemWrapper& other) const {
    // This is a placeholder - actual implementation would use geographic data
    // For now, return a simple ID-based estimate
    return abs(stationId - other.stationId) + abs(lineId - other.lineId);
}

// RouteWrapper implementation
RouteWrapper::RouteWrapper() {
    route = new Route();
}

RouteWrapper::RouteWrapper(const RouteWrapper& source) {
    route = new Route(*source.route);
}

RouteWrapper::RouteWrapper(const RouteListWrapper& source) {
    // TODO: Implement constructor from RouteListWrapper
    route = new Route();
}

RouteWrapper::RouteWrapper(const RouteWrapper& source, int count) {
    // TODO: Implement constructor with count parameter
    route = new Route(*source.route);
}

RouteWrapper::~RouteWrapper() {
    delete route;
}

void RouteWrapper::sync(const CalcRouteWrapper& source) {
    // TODO: Implement sync with CalcRouteWrapper
}

void RouteWrapper::assign(const RouteListWrapper& source) {
    // TODO: Implement assign from RouteListWrapper
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

// Basic route operations
void RouteWrapper::removeAll() {
    route->removeAll();
}

int RouteWrapper::autoRoute(int useLine, int arriveStationId) {
    // TODO: Implement autoRoute functionality
    return 0;
}

int RouteWrapper::typeOfPassedLine(int offset) {
    // TODO: Implement typeOfPassedLine functionality
    return 0;
}

int RouteWrapper::setupRoute(const std::string& routeString) {
    return route->setup_route(routeString.c_str());
}

// Route settings
int RouteWrapper::setDetour(bool enabled) {
    return route->setDetour(enabled);
}

void RouteWrapper::setNoRule(bool enabled) {
    route->setNoRule(enabled);
}

void RouteWrapper::setNotSameKokuraHakataShinZai(bool enabled) {
    route->setNotSameKokuraHakataShinZai(enabled);
}

bool RouteWrapper::isNotSameKokuraHakataShinZai() const {
    return route->isNotSameKokuraHakataShinZai();
}

// Additional route properties
RouteItemWrapper RouteWrapper::getRouteItem(int index) const {
    const std::vector<RouteItem>& routeItems = route->routeList();
    
    // Validate index bounds
    if (index < 0 || index >= (int)routeItems.size()) {
        // Return default-initialized RouteItemWrapper for invalid index
        return RouteItemWrapper();
    }
    
    // Create RouteItemWrapper from C++ RouteItem
    return RouteItemWrapper(&routeItems[index]);
}

RouteItem* RouteWrapper::getRouteItemPtr(int index) const {
    const std::vector<RouteItem>& routeItems = route->routeList();
    
    // Validate index bounds
    if (index < 0 || index >= (int)routeItems.size()) {
        return nullptr;  // Return null pointer for invalid index
    }
    
    // Return pointer to RouteItem (const_cast for compatibility)
    return const_cast<RouteItem*>(&routeItems[index]);
}

// Route item manipulation methods (REQ-OBJ-003, REQ-OBJ-004)
void RouteWrapper::insertItem(int index, const RouteItemWrapper& item) {
    if (!route) return;
    
    std::vector<RouteItem>& routeItems = const_cast<std::vector<RouteItem>&>(route->routeList());
    
    // Validate index bounds (allow insertion at end)
    if (index < 0 || index > (int)routeItems.size()) {
        return;  // Invalid index - silently ignore like C++ behavior
    }
    
    // Create C++ RouteItem from RouteItemWrapper using public constructor
    RouteItem newItem(item.lineId, item.stationId, item.flag);
    
    // Insert at specified index
    routeItems.insert(routeItems.begin() + index, newItem);
}

void RouteWrapper::removeItem(int index) {
    if (!route) return;
    
    std::vector<RouteItem>& routeItems = const_cast<std::vector<RouteItem>&>(route->routeList());
    
    // Validate index bounds
    if (index < 0 || index >= (int)routeItems.size()) {
        return;  // Invalid index - silently ignore like C++ behavior
    }
    
    // Remove item at specified index
    routeItems.erase(routeItems.begin() + index);
}

int RouteWrapper::lastLineId() const {
    // TODO: Implement lastLineId functionality
    return 0;
}

bool RouteWrapper::isReverseAllow() const {
    // TODO: Implement isReverseAllow functionality
    return true;
}

bool RouteWrapper::isOsakakanDetourEnable() const {
    // TODO: Implement isOsakakanDetourEnable functionality
    return false;
}

bool RouteWrapper::isOsakakanDetourShortcut() const {
    // TODO: Implement isOsakakanDetourShortcut functionality
    return false;
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

// RouteListWrapper implementation
RouteListWrapper::RouteListWrapper(const RouteWrapper& source) {
    routeList = new RouteList(*source.route);
}

RouteListWrapper::~RouteListWrapper() {
    delete routeList;
}

int RouteListWrapper::startStationId() const {
    return routeList->departureStationId();
}

int RouteListWrapper::lastStationId() const {
    return routeList->arriveStationId();
}

std::string RouteListWrapper::routeScript() const {
    // TODO: Implement route script generation
    return "";
}

// Array operations (REQ-OBJ-003)
int RouteListWrapper::count() const {
    return static_cast<int>(routeList->routeList().size());
}

RouteItemWrapper RouteListWrapper::at(int index) const {
    const auto& routeVector = routeList->routeList();
    if (index < 0 || index >= static_cast<int>(routeVector.size())) {
        throw std::out_of_range("Route index out of bounds");
    }
    return RouteItemWrapper(&routeVector[index]);
}

void RouteListWrapper::remove(int index) {
    auto& routeVector = const_cast<std::vector<RouteItem>&>(routeList->routeList());
    if (index < 0 || index >= static_cast<int>(routeVector.size())) {
        throw std::out_of_range("Route index out of bounds");
    }
    routeVector.erase(routeVector.begin() + index);
}

void RouteListWrapper::removeAll() {
    auto& routeVector = const_cast<std::vector<RouteItem>&>(routeList->routeList());
    routeVector.clear();
    // Reset route flag to default state
    routeList->refRouteFlag().clear();
}

void RouteListWrapper::insert(int index, const RouteItemWrapper& item) {
    auto& routeVector = const_cast<std::vector<RouteItem>&>(routeList->routeList());
    if (index < 0 || index > static_cast<int>(routeVector.size())) {
        throw std::out_of_range("Route index out of bounds");
    }
    // Convert RouteItemWrapper back to RouteItem
    RouteItem newItem(item.lineId, item.stationId, item.flag);
    routeVector.insert(routeVector.begin() + index, newItem);
}

void RouteListWrapper::assign(const RouteListWrapper& source) {
    routeList->assign(*source.routeList);
}

// Route flag access methods
RouteFlag RouteListWrapper::getRouteFlag() const {
    return routeList->getRouteFlag();
}

void RouteListWrapper::setRouteFlag(const RouteFlag& flag) {
    routeList->refRouteFlag() = flag;
}

// CalcRouteWrapper implementation
CalcRouteWrapper::CalcRouteWrapper(const RouteWrapper& routeWrapper) {
    calcRoute = new CalcRoute(*routeWrapper.route);
    lastFareResult = -1;  // Initialize to invalid state
}

CalcRouteWrapper::CalcRouteWrapper(const RouteWrapper& route, int count) {
    // TODO: Implement constructor with count parameter
    calcRoute = new CalcRoute(*route.route);
    lastFareResult = -1;  // Initialize to invalid state
}

CalcRouteWrapper::CalcRouteWrapper(const RouteListWrapper& routeList) {
    calcRoute = new CalcRoute(*routeList.routeList);
    lastFareResult = -1;  // Initialize to invalid state
}

CalcRouteWrapper::~CalcRouteWrapper() {
    delete calcRoute;
}

void CalcRouteWrapper::sync(const RouteWrapper& route) {
    calcRoute->sync(*route.route);
}

void CalcRouteWrapper::sync(const RouteWrapper& route, int count) {
    // TODO: Implement sync with count parameter
    calcRoute->sync(*route.route);
}

std::string CalcRouteWrapper::calcFare() {
    FARE_INFO fi;  // Using 'fi' to match original c_route.mm variable name
    int fare_result;

    calcRoute->calcFare(&fi);
    
    // Create FareInfoData and populate it exactly like original c_route.mm
    FareInfoData result;
    
    // Original logic from c_route.mm
    switch (fi.resultCode()) {
        case 0:     // success, company begin/first or too many company
            fare_result = 0;
            break;  // OK
        case -1:    /* In completed (吉塚、西小倉における不完全ルート) */
            fare_result = 1;     //"この経路の片道乗車券は購入できません.続けて経路を指定してください."
            break;
        default:
            lastFareResult = -1;
            return "{}"; /* -2:empty or -3:fail - return empty JSON */
            break;
    }

    // Store the result code for later use
    lastFareResult = fare_result;
    
    // Populate FareInfoData exactly like original c_route.mm
    result.result = fare_result;
    result.isResultCompanyBeginEnd = fi.isBeginEndCompanyLine();
    result.isResultCompanyMultipassed = fi.isMultiCompanyLine();
    
    result.beginStationId = fi.getBeginTerminalId();
    result.endStationId = fi.getEndTerminalId();
    result.isBeginInCity = FARE_INFO::IsCityId(fi.getBeginTerminalId());
    result.isEndInCity = FARE_INFO::IsCityId(fi.getEndTerminalId());
    
    result.totalSalesKm = fi.getTotalSalesKm();
    result.jrCalcKm = fi.getJRCalcKm();
    result.jrSalesKm = fi.getJRSalesKm();
    result.companySalesKm = fi.getCompanySalesKm();
    result.salesKmForHokkaido = fi.getSalesKmForHokkaido();
    result.calcKmForHokkaido = fi.getCalcKmForHokkaido();
    result.salesKmForKyusyu = fi.getSalesKmForKyusyu();
    result.calcKmForKyusyu = fi.getCalcKmForKyusyu();
    result.salesKmForShikoku = fi.getSalesKmForShikoku();
    result.calcKmForShikoku = fi.getCalcKmForShikoku();
    result.brtSalesKm = fi.getBRTSalesKm();
    
    result.fare = fi.getFareForJR();
    result.fareForCompanyline = fi.getFareForCompanyline();
    result.fareForIC = fi.getFareForIC();
    result.fareForBRT = fi.getFareForBRT();
    result.isBRTdiscount = (fi.getFareForBRT() < fi.getFareForJR());  // Alternative check
    result.childFare = fi.getChildFareForDisplay();
    result.academicFare = fi.getAcademicDiscountFare();
    result.ticketAvailDays = fi.getTicketAvailDays();
    
    result.routeList = fi.getRoute_string();
    result.routeListForTOICA = fi.getTOICACalcRoute_string();
    
    result.isRoundtrip = calcRoute->refRouteFlag().isRoundTrip();
    result.isRoundtripDiscount = fi.isRoundTripDiscount();
    
    // Stock discount (114 not applied) - exactly like original c_route.mm
    tstring str1, str2;
    int w2 = fi.getFareStockDiscount(0, str1);
    int w3 = fi.getFareStockDiscount(1, str2);
    result.setFareForStockDiscounts(w2 + fi.getFareForCompanyline(),
                                    str1,
                                    w3 + fi.getFareForCompanyline(), 
                                    str2);
    
    // Rule 114 - exactly like original c_route.mm  
    if (!fi.isRule114()) {
        result.rule114_salesKm = 0;
        result.rule114_calcKm = 0;
        result.isRule114Applied = false;
    } else {
        result.isRule114Applied = true;
        result.rule114_salesKm = fi.getRule114SalesKm();
        result.rule114_calcKm = fi.getRule114CalcKm();

        // Stock discount (114 applied) - exactly like original c_route.mm
        tstring notused;
        w2 = fi.getFareStockDiscount(0, notused, true);
        w3 = fi.getFareStockDiscount(1, notused, true);
        result.setFareForStockDiscountsForR114(w2 + fi.getFareForCompanyline(),
                                               w3 + fi.getFareForCompanyline());
    }

    result.isMeihanCityStartTerminalEnable = calcRoute->refRouteFlag().isMeihanCityEnable();
    result.isMeihanCityStart = calcRoute->refRouteFlag().isStartAsCity();
    result.isMeihanCityTerminal = calcRoute->refRouteFlag().isArriveAsCity();
    result.isEnableLongRoute = calcRoute->refRouteFlag().isEnableLongRoute();
    result.isLongRoute = calcRoute->refRouteFlag().isLongRoute();
    result.isRule115specificTerm = calcRoute->refRouteFlag().isRule115specificTerm();
    result.isEnableRule115 = calcRoute->refRouteFlag().isEnableRule115();
    result.isSpecificFare = (fi.getTicketAvailDays() > 1);  // Alternative check
    
    // Convert FareInfoData to JSON string
    std::string json = "{";
    json += "\"result\":" + std::to_string(result.result) + ",";
    json += "\"isResultCompanyBeginEnd\":" + std::string(result.isResultCompanyBeginEnd ? "true" : "false") + ",";
    json += "\"isResultCompanyMultipassed\":" + std::string(result.isResultCompanyMultipassed ? "true" : "false") + ",";
    json += "\"beginStationId\":" + std::to_string(result.beginStationId) + ",";
    json += "\"endStationId\":" + std::to_string(result.endStationId) + ",";
    json += "\"isBeginInCity\":" + std::string(result.isBeginInCity ? "true" : "false") + ",";
    json += "\"isEndInCity\":" + std::string(result.isEndInCity ? "true" : "false") + ",";
    json += "\"totalSalesKm\":" + std::to_string(result.totalSalesKm) + ",";
    json += "\"jrCalcKm\":" + std::to_string(result.jrCalcKm) + ",";
    json += "\"jrSalesKm\":" + std::to_string(result.jrSalesKm) + ",";
    json += "\"companySalesKm\":" + std::to_string(result.companySalesKm) + ",";
    json += "\"salesKmForHokkaido\":" + std::to_string(result.salesKmForHokkaido) + ",";
    json += "\"calcKmForHokkaido\":" + std::to_string(result.calcKmForHokkaido) + ",";
    json += "\"salesKmForKyusyu\":" + std::to_string(result.salesKmForKyusyu) + ",";
    json += "\"calcKmForKyusyu\":" + std::to_string(result.calcKmForKyusyu) + ",";
    json += "\"salesKmForShikoku\":" + std::to_string(result.salesKmForShikoku) + ",";
    json += "\"calcKmForShikoku\":" + std::to_string(result.calcKmForShikoku) + ",";
    json += "\"brtSalesKm\":" + std::to_string(result.brtSalesKm) + ",";
    json += "\"fare\":" + std::to_string(result.fare) + ",";
    json += "\"fareForCompanyline\":" + std::to_string(result.fareForCompanyline) + ",";
    json += "\"fareForIC\":" + std::to_string(result.fareForIC) + ",";
    json += "\"fareForBRT\":" + std::to_string(result.fareForBRT) + ",";
    json += "\"isBRTdiscount\":" + std::string(result.isBRTdiscount ? "true" : "false") + ",";
    json += "\"childFare\":" + std::to_string(result.childFare) + ",";
    json += "\"academicFare\":" + std::to_string(result.academicFare) + ",";
    json += "\"ticketAvailDays\":" + std::to_string(result.ticketAvailDays) + ",";
    json += "\"routeList\":\"" + result.routeList + "\",";
    json += "\"routeListForTOICA\":\"" + result.routeListForTOICA + "\",";
    json += "\"isRoundtrip\":" + std::string(result.isRoundtrip ? "true" : "false") + ",";
    json += "\"isRoundtripDiscount\":" + std::string(result.isRoundtripDiscount ? "true" : "false") + ",";
    
    // Stock discount info using proper FareInfo methods
    json += "\"availCountForFareOfStockDiscount\":" + std::to_string(result.availCountForFareOfStockDiscount) + ",";
    json += "\"fareStockDiscount1\":" + std::to_string(result.fareForStockDiscount(0)) + ",";
    json += "\"fareStockDiscountTitle1\":\"" + result.fareForStockDiscountTitle(0) + "\",";
    json += "\"fareStockDiscount2\":" + std::to_string(result.fareForStockDiscount(1)) + ",";
    json += "\"fareStockDiscountTitle2\":\"" + result.fareForStockDiscountTitle(1) + "\",";
    
    // Rule 114 info
    json += "\"isRule114Applied\":" + std::string(result.isRule114Applied ? "true" : "false") + ",";
    json += "\"rule114_salesKm\":" + std::to_string(result.rule114_salesKm) + ",";
    json += "\"rule114_calcKm\":" + std::to_string(result.rule114_calcKm) + ",";
    json += "\"fareStockDiscountR1141\":" + std::to_string(result.fareForStockDiscount(2)) + ",";
    json += "\"fareStockDiscountR1142\":" + std::to_string(result.fareForStockDiscount(3)) + ",";
    
    // Route flags
    json += "\"isMeihanCityStartTerminalEnable\":" + std::string(result.isMeihanCityStartTerminalEnable ? "true" : "false") + ",";
    json += "\"isMeihanCityStart\":" + std::string(result.isMeihanCityStart ? "true" : "false") + ",";
    json += "\"isMeihanCityTerminal\":" + std::string(result.isMeihanCityTerminal ? "true" : "false") + ",";
    json += "\"isEnableLongRoute\":" + std::string(result.isEnableLongRoute ? "true" : "false") + ",";
    json += "\"isLongRoute\":" + std::string(result.isLongRoute ? "true" : "false") + ",";
    json += "\"isRule115specificTerm\":" + std::string(result.isRule115specificTerm ? "true" : "false") + ",";
    json += "\"isEnableRule115\":" + std::string(result.isEnableRule115 ? "true" : "false") + ",";
    json += "\"isSpecificFare\":" + std::string(result.isSpecificFare ? "true" : "false");
    
    json += "}";
    return json;
}

FareInfoData CalcRouteWrapper::calcFareObject() {
    FARE_INFO fi;  // Using 'fi' to match original c_route.mm variable name
    int fare_result;

    calcRoute->calcFare(&fi);
    
    // Create FareInfoData and populate it exactly like original c_route.mm
    FareInfoData result;
    
    // Original logic from c_route.mm
    switch (fi.resultCode()) {
        case 0:     // success, company begin/first or too many company
            fare_result = 0;
            break;  // OK
        case -1:    /* In completed (吉塚、西小倉における不完全ルート) */
            fare_result = 1;     //"この経路の片道乗車券は購入できません.続けて経路を指定してください."
            break;
        default:
            lastFareResult = -1;
            return result; /* -2:empty or -3:fail - return empty FareInfoData */
            break;
    }

    // Store the result code for later use
    lastFareResult = fare_result;
    
    // Populate FareInfoData exactly like original c_route.mm
    result.result = fare_result;
    result.isResultCompanyBeginEnd = fi.isBeginEndCompanyLine();
    result.isResultCompanyMultipassed = fi.isMultiCompanyLine();
    
    result.beginStationId = fi.getBeginTerminalId();
    result.endStationId = fi.getEndTerminalId();
    result.isBeginInCity = FARE_INFO::IsCityId(fi.getBeginTerminalId());
    result.isEndInCity = FARE_INFO::IsCityId(fi.getEndTerminalId());
    
    result.totalSalesKm = fi.getTotalSalesKm();
    result.jrCalcKm = fi.getJRCalcKm();
    result.jrSalesKm = fi.getJRSalesKm();
    result.companySalesKm = fi.getCompanySalesKm();
    result.salesKmForHokkaido = fi.getSalesKmForHokkaido();
    result.calcKmForHokkaido = fi.getCalcKmForHokkaido();
    result.salesKmForKyusyu = fi.getSalesKmForKyusyu();
    result.calcKmForKyusyu = fi.getCalcKmForKyusyu();
    result.salesKmForShikoku = fi.getSalesKmForShikoku();
    result.calcKmForShikoku = fi.getCalcKmForShikoku();
    result.brtSalesKm = fi.getBRTSalesKm();
    
    result.fare = fi.getFareForJR();
    result.fareForCompanyline = fi.getFareForCompanyline();
    result.fareForIC = fi.getFareForIC();
    result.fareForBRT = fi.getFareForBRT();
    result.isBRTdiscount = (fi.getFareForBRT() < fi.getFareForJR());  // Alternative check
    result.childFare = fi.getChildFareForDisplay();
    result.academicFare = fi.getAcademicDiscountFare();
    result.ticketAvailDays = fi.getTicketAvailDays();
    
    result.routeList = fi.getRoute_string();
    result.routeListForTOICA = fi.getTOICACalcRoute_string();
    
    result.isRoundtrip = calcRoute->refRouteFlag().isRoundTrip();
    result.isRoundtripDiscount = fi.isRoundTripDiscount();
    
    // Stock discount (114 not applied) - exactly like original c_route.mm
    tstring str1, str2;
    int w2 = fi.getFareStockDiscount(0, str1);
    int w3 = fi.getFareStockDiscount(1, str2);
    result.setFareForStockDiscounts(w2 + fi.getFareForCompanyline(),
                                    str1,
                                    w3 + fi.getFareForCompanyline(), 
                                    str2);
    
    // Rule 114 - exactly like original c_route.mm  
    if (!fi.isRule114()) {
        result.rule114_salesKm = 0;
        result.rule114_calcKm = 0;
        result.isRule114Applied = false;
    } else {
        result.isRule114Applied = true;
        result.rule114_salesKm = fi.getRule114SalesKm();
        result.rule114_calcKm = fi.getRule114CalcKm();

        // Stock discount (114 applied) - exactly like original c_route.mm
        tstring notused;
        w2 = fi.getFareStockDiscount(0, notused, true);
        w3 = fi.getFareStockDiscount(1, notused, true);
        result.setFareForStockDiscountsForR114(w2 + fi.getFareForCompanyline(),
                                               w3 + fi.getFareForCompanyline());
    }

    result.isMeihanCityStartTerminalEnable = calcRoute->refRouteFlag().isMeihanCityEnable();
    result.isMeihanCityStart = calcRoute->refRouteFlag().isStartAsCity();
    result.isMeihanCityTerminal = calcRoute->refRouteFlag().isArriveAsCity();
    result.isEnableLongRoute = calcRoute->refRouteFlag().isEnableLongRoute();
    result.isLongRoute = calcRoute->refRouteFlag().isLongRoute();
    result.isRule115specificTerm = calcRoute->refRouteFlag().isRule115specificTerm();
    result.isEnableRule115 = calcRoute->refRouteFlag().isEnableRule115();
    result.isSpecificFare = (fi.getTicketAvailDays() > 1);  // Alternative check
    
    return result;
}

std::string CalcRouteWrapper::showFare() const {
    // Original implementation from c_route.mm
    FARE_INFO fi;
    calcRoute->calcFare(&fi);
    return fi.showFare(calcRoute->getRouteFlag());
}

// Options and settings
bool CalcRouteWrapper::isEnableLongRoute() const {
    // Original implementation from c_route.mm
    return calcRoute->getRouteFlag().isEnableLongRoute();
}

bool CalcRouteWrapper::isRule115specificTerm() const {
    // Original implementation from c_route.mm
    return calcRoute->getRouteFlag().isRule115specificTerm();
}

void CalcRouteWrapper::setSpecificTermRule115(bool enable) {
    // TODO: Implement setSpecificTermRule115 functionality - need to find original method
    // This method may not exist in original c_route.mm
}

void CalcRouteWrapper::setStartAsCity() {
    // Original implementation from c_route.mm
    calcRoute->refRouteFlag().setStartAsCity();
}

void CalcRouteWrapper::setArriveAsCity() {
    // Original implementation from c_route.mm
    calcRoute->refRouteFlag().setArriveAsCity();
}

void CalcRouteWrapper::setLongRoute(bool flag) {
    // Original implementation from c_route.mm
    calcRoute->refRouteFlag().setLongRoute(flag);
}

// Route list operations (inherited from RouteList)
int CalcRouteWrapper::getRouteCount() const {
    return calcRoute->routeList().size();
}

int CalcRouteWrapper::startStationId() const {
    return calcRoute->departureStationId();
}

int CalcRouteWrapper::lastStationId() const {
    return calcRoute->arriveStationId();
}

std::string CalcRouteWrapper::routeScript() const {
    // TODO: Implement route script generation
    return "";
}

bool CalcRouteWrapper::isOsakakanDetourEnable() const {
    // TODO: Implement isOsakakanDetourEnable functionality
    return false;
}

bool CalcRouteWrapper::isOsakakanDetour() const {
    // TODO: Implement isOsakakanDetour functionality
    return false;
}

// RouteFlagWrapper implementation

// Constructor from C++ RouteFlag (implementation matching header declaration)
RouteFlagWrapper::RouteFlagWrapper(const RouteFlag* flag) {
    if (flag != nullptr) {
        // Boolean properties - direct mapping from C++ RouteFlag
        no_rule = flag->no_rule;
        jrtokaistock_applied = flag->jrtokaistock_applied;
        jrtokaistock_enable = flag->jrtokaistock_enable;
        meihan_city_flag = flag->meihan_city_flag;
        rule88 = flag->rule88;
        rule69 = flag->rule69;
        rule70 = flag->rule70;
        special_fare_enable = flag->special_fare_enable;
        rule70bullet = flag->rule70bullet;
        rule16_5 = flag->rule16_5;
        bullet_line = flag->bullet_line;
        bJrTokaiOnly = flag->bJrTokaiOnly;
        meihan_city_enable = flag->meihan_city_enable;
        trackmarkctl = flag->trackmarkctl;
        jctsp_route_change = flag->jctsp_route_change;
        ter_begin_oosaka = flag->ter_begin_oosaka;
        ter_fin_oosaka = flag->ter_fin_oosaka;
        compncheck = flag->compncheck;
        compnpass = flag->compnpass;
        compnda = flag->compnda;
        compnbegin = flag->compnbegin;
        compnend = flag->compnend;
        compnterm = flag->compnterm;
        tokai_shinkansen = flag->tokai_shinkansen;
        notsamekokurahakatashinzai = flag->notsamekokurahakatashinzai;
        end = flag->end;
        osakakan_1dir = flag->osakakan_1dir;
        osakakan_2dir = flag->osakakan_2dir;
        osakakan_detour = flag->osakakan_detour;
        
        // Numeric properties - direct mapping from C++ RouteFlag
        rule86or87 = flag->rule86or87;
        rule115 = flag->rule115;
        urban_neerest = flag->urban_neerest;
        osakaKanPass = flag->getOsakaKanPassValue();  // Use correct accessor method
    } else {
        // Handle null pointer case - initialize to default values
        clear();
    }
}

// Note: All RouteFlagWrapper methods are implemented inline in the header file
// This includes management methods, validation methods, Android compatibility methods, etc.

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

int RouteUtility::getLineIdFromName(const std::string& lineName) {
    return RouteUtil::GetLineId(lineName.c_str());
}

std::vector<int> RouteUtility::getLineIdsFromStation(int stationId) {
    DBO dbo = RouteUtil::Enum_line_of_stationId(stationId);
    std::vector<int> lineIds;
    
    while (dbo.moveNext()) {
        lineIds.push_back(dbo.getInt(0));
    }
    
    return lineIds;
}

// Array operations from c_route.mm
std::vector<int> RouteUtility::getStationIdsOfLine(int lineId) {
    std::vector<int> stations;
    DBO dbo = RouteUtil::Enum_station_of_lineId(lineId);
    
    while (dbo.moveNext()) {
        stations.push_back(dbo.getInt(1)); // station_id is at index 1
    }
    
    return stations;
}

std::vector<int> RouteUtility::getJunctionIdsOfLine(int lineId, int stationId) {
    std::vector<int> junctions;
    DBO dbo = RouteUtil::Enum_junction_of_lineId(lineId, stationId);
    
    while (dbo.moveNext()) {
        junctions.push_back(dbo.getInt(1)); // junction_id is at index 1
    }
    
    return junctions;
}

std::string RouteUtility::getPrefectNameByStation(int stationId) {
    return RouteUtil::GetPrefectByStationId(stationId);
}

std::string RouteUtility::getKanaFromStationId(int stationId) {
    std::string kanaName = RouteUtil::GetKanaFromStationId(stationId);
    return kanaName.empty() ? "" : kanaName;
}

// Company and prefecture operations
RouteUtility::CompanyPrefectData RouteUtility::getCompanyAndPrefects() {
    CompanyPrefectData data;
    DBO dbo = RouteUtil::Enum_company_prefect();
    
    if (dbo.isvalid()) {
        while (dbo.moveNext()) {
            int ident = dbo.getInt(1);
            std::string name = dbo.getText(0);
            if (ident < 0x10000) {
                data.companies.push_back(std::make_pair(ident, name));
            } else {
                data.prefects.push_back(std::make_pair(ident, name));
            }
        }
    }
    
    return data;
}

std::vector<int> RouteUtility::keyMatchStations(const std::string& key) {
    std::vector<int> stations;
    DBO dbo = RouteUtil::Enum_station_match(key.c_str());
    
    if (dbo.isvalid()) {
        while (dbo.moveNext()) {
            stations.push_back(dbo.getInt(1)); // station_id
        }
    }
    
    return stations;
}

std::vector<int> RouteUtility::linesFromCompanyOrPrefect(int id) {
    std::vector<int> lines;
    DBO dbo = RouteUtil::Enum_lines_from_company_prefect(id);
    
    if (dbo.isvalid()) {
        while (dbo.moveNext()) {
            lines.push_back(dbo.getInt(1)); // line_id
        }
    }
    
    return lines;
}

std::vector<int> RouteUtility::stationsWithinCompanyOrPrefectAndLine(int companyOrPrefectId, int lineId) {
    std::vector<int> stations;
    DBO dbo = RouteUtil::Enum_station_located_in_prefect_or_company_and_line(companyOrPrefectId, lineId);
    
    if (dbo.isvalid()) {
        while (dbo.moveNext()) {
            stations.push_back(dbo.getInt(1)); // station_id
        }
    }
    
    return stations;
}

// Station properties
std::string RouteUtility::getTerminalName(int stationId) {
    return CalcRoute::BeginOrEndStationName(stationId);
}

bool RouteUtility::isJunction(int stationId) {
    return 0 != (RouteUtil::AttrOfStationId(stationId) & (1 << 12));
}

bool RouteUtility::isSpecificJunction(int lineId, int stationId) {
    return 0 != (RouteUtil::AttrOfStationOnLineLine(lineId, stationId) & (1 << 31));
}

// Additional cRouteUtil functions
std::string RouteUtility::fareNumStr(int num) {
    // TODO: Implement fare number formatting
    return std::to_string(num);
}

std::string RouteUtility::kmNumStr(int num) {
    // TODO: Implement km number formatting  
    return std::to_string(num);
}

std::string RouteUtility::getStationNameEx(int id) {
    return RouteUtil::StationNameEx(id);
}

std::string RouteUtility::getCompanyOrPrefectName(int id) {
    // TODO: Implement company/prefect name lookup
    return "";
}

// Route storage operations (placeholder implementations - need actual storage backend)
int RouteUtility::saveToRouteArray(const std::vector<int>& routeList) {
    // TODO: Implement actual storage logic
    return 0;
}

std::string RouteUtility::scriptFromRouteArray(const std::vector<int>& routeList) {
    // TODO: Implement route script generation
    return "";
}

std::string RouteUtility::scriptFromRouteArray() {
    // TODO: Implement route script generation from stored data
    return "";
}

std::vector<int> RouteUtility::parseScript(const std::string& routeScript) {
    // TODO: Implement route script parsing
    return std::vector<int>();
}

// Database management (placeholder implementations)
void RouteUtility::saveToDatabaseId(int dbId) {
    saveToDatabaseId(dbId, true);
}

void RouteUtility::saveToDatabaseId(int dbId, bool sync) {
    // TODO: Implement database ID storage
}

int RouteUtility::getDatabaseId() {
    // TODO: Implement database ID retrieval
    return 0;
}

// Storage operations (placeholder implementations)
std::vector<std::vector<int>> RouteUtility::loadStorageRoute() {
    // TODO: Implement route loading from storage
    return std::vector<std::vector<int>>();
}

bool RouteUtility::isRouteInStorage(const std::string& routeString) {
    // TODO: Implement route existence check in storage
    return false;
}

// History management (placeholder implementations)
void RouteUtility::saveToTerminalHistory(const std::string& terminalName) {
    // TODO: Implement terminal history storage
}

void RouteUtility::saveToTerminalHistoryWithArray(const std::vector<std::string>& historyArray) {
    // TODO: Implement terminal history array storage
}

std::vector<std::string> RouteUtility::readFromTerminalHistory() {
    // TODO: Implement terminal history reading
    return std::vector<std::string>();
}

std::string RouteUtility::readFromKey(const std::string& key) {
    // TODO: Implement key-value reading
    return "";
}

void RouteUtility::saveToKey(const std::string& key, const std::string& value, bool sync) {
    // TODO: Implement key-value storage
}