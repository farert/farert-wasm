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
RouteItem* RouteWrapper::getRouteItem(int index) const {
    // TODO: Implement getRouteItem functionality
    return nullptr;
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