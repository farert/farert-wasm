#ifndef ROUTE_INTERFACE_H
#define ROUTE_INTERFACE_H

#include "common.h"
#include <map>
#include <set>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include <climits>
#include <mutex>       // For ObjectLifecycleManager thread safety
#include <memory>      // For enhanced memory management
#include <atomic>      // For thread-safe reference counting

// Forward declarations from alpdb.h
class Route;
class RouteList;
class CalcRoute;
class RouteItem;
class RouteFlag;

// Validation result structure for enhanced error reporting (Task 19)
struct ValidationResult {
    bool isValid;
    std::string errorMessage;
    std::string errorMessageJa;
    std::vector<std::string> suggestions;
    std::map<std::string, std::string> context;
    
    ValidationResult() : isValid(true) {}
    ValidationResult(bool valid) : isValid(valid) {}
};

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
        
        // Initialize error handling properties (Task 20)
        errorCode = 0;
        errorMessage = "";
        errorMessageJa = "";
        suggestedStations.clear();
    }
    
    // Enhanced error handling properties (Task 20: REQ-OBJ-002, REQ-OBJ-006)
    int errorCode;                          // Error code from fare calculation (0 = success, negative = error)
    std::string errorMessage;               // English error message for developers
    std::string errorMessageJa;             // Japanese error message for end users
    std::vector<std::string> suggestedStations; // Alternative station suggestions for invalid routes
    
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
    
    // Enhanced display methods (Task 20: REQ-OBJ-006)
    
    /**
     * Get formatted fare display with currency symbol and discount information
     * Provides user-friendly fare display for UI applications
     * 
     * @param includeCurrency Include yen symbol (¥) in output
     * @param includeDiscounts Show available discount options
     * @return Formatted fare string (e.g., "¥320 (IC: ¥315, 学割: ¥270)")
     */
    std::string getFormattedFare(bool includeCurrency = true, bool includeDiscounts = true) const {
        std::ostringstream result;
        
        // Handle error cases first
        if (errorCode != 0) {
            return errorMessage.empty() ? "計算エラー" : errorMessage;
        }
        
        if (fare <= 0) {
            return "運賃計算不可";
        }
        
        // Main fare display
        if (includeCurrency) {
            result << "¥" << fare;
        } else {
            result << fare;
        }
        
        // Add discount information if available and requested
        if (includeDiscounts) {
            std::vector<std::string> discounts;
            
            // IC card fare
            if (fareForIC > 0 && fareForIC != fare) {
                discounts.push_back(std::string("IC: ") + (includeCurrency ? "¥" : "") + std::to_string(fareForIC));
            }
            
            // Child fare
            if (childFare > 0) {
                discounts.push_back(std::string("小児: ") + (includeCurrency ? "¥" : "") + std::to_string(childFare));
            }
            
            // Academic discount
            if (academicFare > 0 && academicFare != fare) {
                discounts.push_back(std::string("学割: ") + (includeCurrency ? "¥" : "") + std::to_string(academicFare));
            }
            
            // Stock discounts
            for (int i = 0; i < availCountForFareOfStockDiscount && i < 2; i++) {
                if (fareForStockDiscounts[i] > 0 && fareForStockDiscounts[i] != fare) {
                    std::string title = fareForStockDiscountNames[i];
                    if (title.empty()) title = std::string("回数券") + std::to_string(i + 1);
                    discounts.push_back(title + ": " + (includeCurrency ? std::string("¥") : std::string("")) + std::to_string(fareForStockDiscounts[i]));
                }
            }
            
            // Rule 114 stock discounts
            if (isRule114Applied) {
                for (int i = 2; i < 4; i++) {
                    if (fareForStockDiscounts[i] > 0 && fareForStockDiscounts[i] != fare) {
                        discounts.push_back(std::string("回数券R114-") + std::to_string(i-1) + ": " + 
                                          (includeCurrency ? std::string("¥") : std::string("")) + std::to_string(fareForStockDiscounts[i]));
                    }
                }
            }
            
            // Format discount information
            if (!discounts.empty()) {
                result << " (";
                for (size_t i = 0; i < discounts.size(); i++) {
                    if (i > 0) result << ", ";
                    result << discounts[i];
                }
                result << ")";
            }
        }
        
        return result.str();
    }
    
    /**
     * Get detailed fare breakdown with distance and rule information
     * Provides comprehensive fare calculation details for debugging and user information
     * 
     * @return Multi-line string with detailed fare breakdown
     */
    std::string getFareBreakdown() const {
        std::ostringstream breakdown;
        
        // Handle error cases
        if (errorCode != 0) {
            breakdown << "エラー: " << errorMessage << "\n";
            if (!errorMessageJa.empty()) {
                breakdown << "詳細: " << errorMessageJa << "\n";
            }
            if (!suggestedStations.empty()) {
                breakdown << "推奨駅: ";
                for (size_t i = 0; i < suggestedStations.size(); i++) {
                    if (i > 0) breakdown << ", ";
                    breakdown << suggestedStations[i];
                }
                breakdown << "\n";
            }
            return breakdown.str();
        }
        
        // Basic fare information
        breakdown << "=== 運賃詳細 ===\n";
        breakdown << "基本運賃: ¥" << fare << "\n";
        
        // Distance information
        if (totalSalesKm > 0) {
            breakdown << "営業キロ: " << totalSalesKm << "km\n";
        }
        if (jrCalcKm > 0) {
            breakdown << "JR換算キロ: " << jrCalcKm << "km\n";
        }
        if (companySalesKm > 0) {
            breakdown << "会社線営業キロ: " << companySalesKm << "km\n";
        }
        
        // Rule applications
        std::vector<std::string> appliedRules;
        if (isRule114Applied) {
            appliedRules.push_back("規則114 (特定市内・区間)");
            breakdown << "規則114営業キロ: " << rule114_salesKm << "km\n";
            breakdown << "規則114換算キロ: " << rule114_calcKm << "km\n";
        }
        if (isSpecificFare) appliedRules.push_back("特定運賃");
        if (isRoundtrip) appliedRules.push_back("往復割引");
        if (isEnableLongRoute && isLongRoute) appliedRules.push_back("遠距離逓減");
        if (isEnableRule115 && isRule115specificTerm) appliedRules.push_back("規則115");
        
        if (!appliedRules.empty()) {
            breakdown << "適用規則: ";
            for (size_t i = 0; i < appliedRules.size(); i++) {
                if (i > 0) breakdown << ", ";
                breakdown << appliedRules[i];
            }
            breakdown << "\n";
        }
        
        // Regional distance breakdown
        if (salesKmForHokkaido > 0) {
            breakdown << "北海道内営業キロ: " << salesKmForHokkaido << "km";
            if (calcKmForHokkaido > 0) breakdown << " (換算: " << calcKmForHokkaido << "km)";
            breakdown << "\n";
        }
        if (salesKmForShikoku > 0) {
            breakdown << "四国内営業キロ: " << salesKmForShikoku << "km";
            if (calcKmForShikoku > 0) breakdown << " (換算: " << calcKmForShikoku << "km)";
            breakdown << "\n";
        }
        if (salesKmForKyusyu > 0) {
            breakdown << "九州内営業キロ: " << salesKmForKyusyu << "km";
            if (calcKmForKyusyu > 0) breakdown << " (換算: " << calcKmForKyusyu << "km)";
            breakdown << "\n";
        }
        
        // Special fares
        if (fareForIC > 0 && fareForIC != fare) {
            breakdown << "IC運賃: ¥" << fareForIC << "\n";
        }
        if (fareForBRT > 0) {
            breakdown << "BRT運賃: ¥" << fareForBRT;
            if (isBRTdiscount) breakdown << " (割引適用)";
            breakdown << "\n";
        }
        if (fareForCompanyline > 0) {
            breakdown << "会社線運賃: ¥" << fareForCompanyline << "\n";
        }
        
        // Child and academic fares
        if (childFare > 0) {
            breakdown << "小児運賃: ¥" << childFare << "\n";
        }
        if (academicFare > 0) {
            breakdown << "学割運賃: ¥" << academicFare << "\n";
        }
        
        // Stock discounts
        if (availCountForFareOfStockDiscount > 0) {
            breakdown << "回数券割引:\n";
            for (int i = 0; i < availCountForFareOfStockDiscount && i < 2; i++) {
                if (fareForStockDiscounts[i] > 0) {
                    breakdown << "  " << fareForStockDiscountNames[i] << ": ¥" << fareForStockDiscounts[i] << "\n";
                }
            }
            
            // Rule 114 stock discounts
            if (isRule114Applied) {
                for (int i = 2; i < 4; i++) {
                    if (fareForStockDiscounts[i] > 0) {
                        breakdown << "  規則114回数券" << (i-1) << ": ¥" << fareForStockDiscounts[i] << "\n";
                    }
                }
            }
        }
        
        // City area information
        if (isMeihanCityStartTerminalEnable) {
            breakdown << "都市圏特例: ";
            if (isMeihanCityStart) breakdown << "出発側都市内";
            if (isMeihanCityTerminal) breakdown << "到着側都市内";
            breakdown << "\n";
        }
        
        // Route information
        if (!routeList.empty()) {
            breakdown << "経由: " << routeList << "\n";
        }
        
        // Ticket validity
        if (ticketAvailDays > 0) {
            breakdown << "有効期間: " << ticketAvailDays << "日間\n";
        }
        
        return breakdown.str();
    }
    
    /**
     * Compare this fare calculation with another for route optimization
     * Provides comprehensive comparison for finding the best route option
     * 
     * @param other Another FareInfoData to compare against
     * @return Comparison result (-1: this is better, 0: equal, 1: other is better)
     */
    int compare(const FareInfoData& other) const {
        // Error handling: valid calculations are always better than errors
        if (errorCode != 0 && other.errorCode == 0) return 1;   // other is better
        if (errorCode == 0 && other.errorCode != 0) return -1;  // this is better
        if (errorCode != 0 && other.errorCode != 0) return 0;   // both have errors
        
        // Both calculations are valid, compare fares
        int thisFare = fare > 0 ? fare : INT_MAX;   // Invalid fare treated as worst case
        int otherFare = other.fare > 0 ? other.fare : INT_MAX;
        
        // Primary comparison: lower fare is better
        if (thisFare < otherFare) return -1;  // this is better
        if (thisFare > otherFare) return 1;   // other is better
        
        // Fares are equal, use secondary criteria
        
        // Prefer routes with fewer transfers (shorter route lists)
        int thisTransfers = routeList.empty() ? 0 : std::count(routeList.begin(), routeList.end(), ' ');
        int otherTransfers = other.routeList.empty() ? 0 : std::count(other.routeList.begin(), other.routeList.end(), ' ');
        
        if (thisTransfers < otherTransfers) return -1;  // this is better (fewer transfers)
        if (thisTransfers > otherTransfers) return 1;   // other is better
        
        // Prefer shorter total distance
        if (totalSalesKm > 0 && other.totalSalesKm > 0) {
            if (totalSalesKm < other.totalSalesKm) return -1;  // this is better (shorter)
            if (totalSalesKm > other.totalSalesKm) return 1;   // other is better
        }
        
        // Prefer routes with discounts available
        int thisDiscounts = availCountForFareOfStockDiscount;
        int otherDiscounts = other.availCountForFareOfStockDiscount;
        
        if (thisDiscounts > otherDiscounts) return -1;  // this is better (more discounts)
        if (thisDiscounts < otherDiscounts) return 1;   // other is better
        
        // Prefer IC card compatibility
        bool thisHasIC = (fareForIC > 0);
        bool otherHasIC = (other.fareForIC > 0);
        
        if (thisHasIC && !otherHasIC) return -1;  // this is better
        if (!thisHasIC && otherHasIC) return 1;   // other is better
        
        // All criteria are equal
        return 0;
    }
    
    // Error handling methods (Task 20: REQ-OBJ-002)
    
    /**
     * Set error information for failed fare calculations
     * 
     * @param code Error code (negative values indicate errors)
     * @param message English error message for developers
     * @param messageJa Japanese error message for end users
     */
    void setError(int code, const std::string& message, const std::string& messageJa = "") {
        errorCode = code;
        errorMessage = message;
        errorMessageJa = messageJa.empty() ? message : messageJa;
        
        // Clear fare data for error cases
        if (code != 0) {
            fare = 0;
            fareForIC = 0;
            childFare = 0;
            academicFare = 0;
            fareForCompanyline = 0;
            fareForBRT = 0;
        }
    }
    
    /**
     * Add suggested stations for route correction
     * 
     * @param stations Vector of suggested station names
     */
    void setSuggestedStations(const std::vector<std::string>& stations) {
        suggestedStations = stations;
    }
    
    /**
     * Add a single suggested station
     * 
     * @param station Station name to add as suggestion
     */
    void addSuggestedStation(const std::string& station) {
        // Avoid duplicates
        if (std::find(suggestedStations.begin(), suggestedStations.end(), station) == suggestedStations.end()) {
            suggestedStations.push_back(station);
        }
    }
    
    /**
     * Clear all error information and reset to valid state
     */
    void clearError() {
        errorCode = 0;
        errorMessage = "";
        errorMessageJa = "";
        suggestedStations.clear();
    }
    
    /**
     * Check if the fare calculation was successful
     * 
     * @return true if no errors occurred, false otherwise
     */
    bool isValid() const {
        return errorCode == 0 && fare > 0;
    }
    
    /**
     * Get error summary for logging and debugging
     * 
     * @return String containing error code and message
     */
    std::string getErrorSummary() const {
        if (errorCode == 0) return "No error";
        
        std::ostringstream summary;
        summary << "Error " << errorCode << ": " << errorMessage;
        if (!errorMessageJa.empty() && errorMessageJa != errorMessage) {
            summary << " (" << errorMessageJa << ")";
        }
        return summary.str();
    }
};

// Database management
class DatabaseManager {
public:
    static bool openDatabase(const std::string& dbPath);
    static void closeDatabase();
    static bool getDatabaseVersion(void* dbsys);
};

// Object lifecycle management system (Task 25: REQ-OBJ-007)
// Forward declarations for reference counting with enhanced lifecycle management

/**
 * Enhanced reference counter with WebAssembly-safe lifecycle management
 * Prevents indefinite heap growth and provides memory leak detection
 */
struct RefCounter {
    int count;
    bool isValidCounter;
    void* objectPtr;  // Track owning object for debugging
    
    RefCounter() : count(1), isValidCounter(true), objectPtr(nullptr) {}
    
    explicit RefCounter(void* ptr) : count(1), isValidCounter(true), objectPtr(ptr) {}
    
    // Safety check to prevent double-deletion
    bool canIncrement() const { 
        return isValidCounter && count > 0; 
    }
    
    // Safety check to prevent underflow
    bool canDecrement() const { 
        return isValidCounter && count > 0; 
    }
    
    // Mark counter as invalid to prevent further use
    void invalidate() { 
        isValidCounter = false; 
        objectPtr = nullptr;
    }
    
    // Get debug information about this counter
    std::string getDebugInfo() const {
        std::ostringstream info;
        info << "RefCounter{count=" << count 
             << ", valid=" << (isValidCounter ? "true" : "false")
             << ", ptr=" << objectPtr << "}";
        return info.str();
    }
};

/**
 * Memory safety validation helper with enhanced WebAssembly lifecycle support
 * Provides comprehensive object state tracking and validation for long-running applications
 */
class MemorySafetyValidator {
public:
    static const int MAGIC_VALUE_VALID = 0xDEADBEEF;
    static const int MAGIC_VALUE_DESTROYED = 0xDEADDEAD;
    static const int MAGIC_VALUE_CORRUPTED = 0xBADC0DE1;
    
    // Object state validation
    static bool isValid(int magicValue) {
        return magicValue == MAGIC_VALUE_VALID;
    }
    
    static bool isDestroyed(int magicValue) {
        return magicValue == MAGIC_VALUE_DESTROYED;
    }
    
    static bool isCorrupted(int magicValue) {
        return magicValue == MAGIC_VALUE_CORRUPTED;
    }
    
    // Comprehensive state check with detailed error information
    static int validateState(int magicValue, const RefCounter* refCounter) {
        if (magicValue == MAGIC_VALUE_DESTROYED) {
            return -200;  // Object was destroyed
        }
        if (magicValue == MAGIC_VALUE_CORRUPTED) {
            return -201;  // Object memory corrupted
        }
        if (!isValid(magicValue)) {
            return -202;  // Invalid magic value
        }
        if (refCounter == nullptr) {
            return -203;  // Reference counter is null
        }
        if (!refCounter->isValidCounter) {
            return -204;  // Reference counter invalidated
        }
        if (refCounter->count <= 0) {
            return -205;  // Invalid reference count
        }
        return 0;  // Valid state
    }
    
    // Get human-readable error message for validation results
    static std::string getValidationErrorMessage(int errorCode) {
        switch (errorCode) {
            case -200: return "Object was destroyed and cannot be used";
            case -201: return "Object memory has been corrupted";
            case -202: return "Object has invalid magic value (possible corruption)";
            case -203: return "Object reference counter is null";
            case -204: return "Object reference counter has been invalidated";
            case -205: return "Object has invalid reference count (possible double-free)";
            case 0: return "Object is valid";
            default: return "Unknown validation error";
        }
    }
    
    // WebAssembly-specific validation for heap management
    static bool isWebAssemblyMemorySafe(int magicValue, const RefCounter* refCounter) {
        // Additional checks for WebAssembly memory safety
        int result = validateState(magicValue, refCounter);
        if (result != 0) return false;
        
        // Check for suspicious reference count patterns that might indicate leaks
        if (refCounter->count > 1000) {
            // Extremely high reference count might indicate a leak
            return false;
        }
        
        return true;
    }
};

/**
 * Object lifecycle manager for automatic cleanup and leak prevention
 * Ensures proper resource management in long-running WebAssembly applications
 */
class ObjectLifecycleManager {
private:
    static std::set<void*> activeObjects;
    static std::mutex objectMutex;
    static size_t totalObjectsCreated;
    static size_t totalObjectsDestroyed;
    
public:
    // Register object creation for tracking
    static void registerObject(void* objectPtr) {
        std::lock_guard<std::mutex> lock(objectMutex);
        activeObjects.insert(objectPtr);
        totalObjectsCreated++;
    }
    
    // Register object destruction for tracking
    static void unregisterObject(void* objectPtr) {
        std::lock_guard<std::mutex> lock(objectMutex);
        auto it = activeObjects.find(objectPtr);
        if (it != activeObjects.end()) {
            activeObjects.erase(it);
            totalObjectsDestroyed++;
        }
    }
    
    // Check if object is registered (for validation)
    static bool isObjectRegistered(void* objectPtr) {
        std::lock_guard<std::mutex> lock(objectMutex);
        return activeObjects.find(objectPtr) != activeObjects.end();
    }
    
    // Get statistics for memory leak detection
    static size_t getActiveObjectCount() {
        std::lock_guard<std::mutex> lock(objectMutex);
        return activeObjects.size();
    }
    
    static size_t getTotalObjectsCreated() {
        return totalObjectsCreated;
    }
    
    static size_t getTotalObjectsDestroyed() {
        return totalObjectsDestroyed;
    }
    
    // Memory leak detection
    static bool hasMemoryLeaks() {
        return getActiveObjectCount() > 0;
    }
    
    // Force cleanup of all tracked objects (emergency cleanup)
    static void forceCleanupAll() {
        std::lock_guard<std::mutex> lock(objectMutex);
        activeObjects.clear();
        // Note: This doesn't actually delete objects, just removes tracking
        // Actual objects should implement their own cleanup
    }
    
    // Get detailed memory report
    static std::string getMemoryReport() {
        std::lock_guard<std::mutex> lock(objectMutex);
        std::ostringstream report;
        report << "=== Object Lifecycle Report ===\n";
        report << "Active objects: " << activeObjects.size() << "\n";
        report << "Total created: " << totalObjectsCreated << "\n";
        report << "Total destroyed: " << totalObjectsDestroyed << "\n";
        report << "Memory leaks detected: " << (hasMemoryLeaks() ? "YES" : "NO") << "\n";
        
        if (!activeObjects.empty()) {
            report << "Active object pointers:\n";
            for (void* ptr : activeObjects) {
                report << "  " << ptr << "\n";
            }
        }
        
        return report.str();
    }
};

// RouteItem wrapper structure (corresponds to cRouteItem)
struct RouteItemWrapper {
    // Core properties matching original C++ RouteItem class
    int stationId;      // Station ID for this route point
    int lineId;         // Line ID for this route segment
    int flag;           // Route-specific flags (SPECIFICFLAG from C++)
    
    // Additional properties for enhanced functionality (matching CLAUDE.md requirements)
    int fare;           // Fare amount for this segment
    int salesKm;        // Sales distance in kilometers
    int indexOfAggregate; // Index for aggregated calculations
    
    // Object lifecycle management (Task 25: REQ-OBJ-007)
    mutable int magicValue;             // Memory safety validation
    mutable RefCounter* refCounter;     // Reference counting for shared data
    
    // Enhanced constructor with lifecycle management (Task 25: REQ-OBJ-007)
    RouteItemWrapper() {
        stationId = 0;
        lineId = 0;
        flag = 0;
        fare = 0;
        salesKm = 0;
        indexOfAggregate = 0;
        
        // Initialize lifecycle management with comprehensive tracking
        magicValue = MemorySafetyValidator::MAGIC_VALUE_VALID;
        refCounter = new RefCounter(this);  // Pass this pointer for debugging
        
        // Register object for lifecycle tracking
        ObjectLifecycleManager::registerObject(this);
    }
    
    // Constructor from C++ RouteItem (implementation will be in .cpp file)
    RouteItemWrapper(const RouteItem* item);
    
    // Constructor from raw values (for direct creation from RouteItem data)
    RouteItemWrapper(int lineId_, int stationId_, int flag_, int fare_, int salesKm_, int indexOfAggregate_) {
        lineId = lineId_;
        stationId = stationId_;
        flag = flag_;
        fare = fare_;
        salesKm = salesKm_;
        indexOfAggregate = indexOfAggregate_;
    }
    
    // Constructor with basic parameters
    RouteItemWrapper(int lineId_, int stationId_, int flag_ = 0) {
        lineId = lineId_;
        stationId = stationId_;
        flag = flag_;
        fare = 0;
        salesKm = 0;
        indexOfAggregate = 0;
    }
    
    // Enhanced destructor with comprehensive RAII cleanup (Task 25: REQ-OBJ-007)
    ~RouteItemWrapper() {
        if (isValid()) {
            decrementRef();
        } else {
            // Handle case where object was already destroyed or corrupted
            // Still need to clean up reference counter if it exists
            if (refCounter && refCounter->isValidCounter) {
                refCounter->invalidate();
                delete refCounter;
                refCounter = nullptr;
            }
        }
        
        // Unregister from lifecycle manager
        ObjectLifecycleManager::unregisterObject(this);
        
        // Mark as destroyed for safety
        magicValue = MemorySafetyValidator::MAGIC_VALUE_DESTROYED;
    }
    
    // Enhanced copy constructor with comprehensive reference counting (Task 25: REQ-OBJ-007)
    RouteItemWrapper(const RouteItemWrapper& other) {
        // Copy data fields
        stationId = other.stationId;
        lineId = other.lineId;
        flag = other.flag;
        fare = other.fare;
        salesKm = other.salesKm;
        indexOfAggregate = other.indexOfAggregate;
        
        // Enhanced reference sharing with safety checks
        magicValue = other.magicValue;
        refCounter = other.refCounter;
        
        if (other.isValid() && refCounter && refCounter->canIncrement()) {
            refCounter->count++;
        } else {
            // Other object is invalid or corrupted, create new lifecycle
            magicValue = MemorySafetyValidator::MAGIC_VALUE_VALID;
            refCounter = new RefCounter(this);
        }
        
        // Register this new object for lifecycle tracking
        ObjectLifecycleManager::registerObject(this);
    }
    
    // Enhanced assignment operator with comprehensive reference counting (Task 25: REQ-OBJ-007)
    RouteItemWrapper& operator=(const RouteItemWrapper& other) {
        if (this != &other) {
            // Safely decrement current reference with enhanced checking
            if (isValid() && refCounter && refCounter->canDecrement()) {
                decrementRef();
            } else if (refCounter) {
                // Handle corrupted state - cleanup what we can
                refCounter->invalidate();
                if (refCounter->count == 1) {
                    delete refCounter;
                }
                refCounter = nullptr;
            }
            
            // Copy data fields
            stationId = other.stationId;
            lineId = other.lineId;
            flag = other.flag;
            fare = other.fare;
            salesKm = other.salesKm;
            indexOfAggregate = other.indexOfAggregate;
            
            // Enhanced reference sharing with safety validation
            magicValue = other.magicValue;
            refCounter = other.refCounter;
            
            if (other.isValid() && refCounter && refCounter->canIncrement()) {
                refCounter->count++;
            } else {
                // Other object is invalid, create new lifecycle
                magicValue = MemorySafetyValidator::MAGIC_VALUE_VALID;
                refCounter = new RefCounter(this);
            }
        }
        return *this;
    }
    
    // Equality operator
    bool operator==(const RouteItemWrapper& other) const {
        return lineId == other.lineId && 
               stationId == other.stationId &&
               flag == other.flag;
    }
    
    // Property accessors for TypeScript compatibility
    int getStationId() const { return stationId; }
    int getLineId() const { return lineId; }
    int getFlag() const { return flag; }
    int getFare() const { return fare; }
    int getSalesKm() const { return salesKm; }
    int getIndexOfAggregate() const { return indexOfAggregate; }
    
    // Property setters
    void setStationId(int id) { stationId = id; }
    void setLineId(int id) { lineId = id; }
    void setFlag(int f) { flag = f; }
    void setFare(int f) { fare = f; }
    void setSalesKm(int km) { salesKm = km; }
    void setIndexOfAggregate(int index) { indexOfAggregate = index; }
    
    // C++ RouteItem compatible methods
    
    // Refresh method (corresponding to C++ RouteItem::refresh())
    void refresh() {
        // Reset calculated values to force recalculation
        // This matches the C++ behavior where refresh() resets computed state
        fare = 0;
        salesKm = 0;
        indexOfAggregate = 0;
    }
    
    // Equality check method (corresponding to C++ RouteItem::is_equal())
    bool is_equal(const RouteItemWrapper& item) const {
        // Match exact C++ logic: compare lineId and stationId only (not flag)
        return lineId == item.lineId && stationId == item.stationId;
    }
    
    // Enhanced validation for REQ-OBJ-002 (C++ Compatible Error Handling)
    bool isValidData() const {
        // Station ID validation: must be positive (C++ convention)
        if (stationId <= 0) return false;
        
        // Line ID validation: must be non-negative (C++ convention) 
        if (lineId < 0) return false;
        
        // Flag validation: SPECIFICFLAG range check (match C++ behavior)
        // Flags should be within reasonable range for C++ SPECIFICFLAG
        if (flag < 0 || flag > 0xFFFF) return false;
        
        return true;
    }
    
    // Enhanced validation with error reporting
    int validateWithErrorCode() const {
        if (stationId <= 0) return -1;    // Invalid station ID
        if (lineId < 0) return -2;        // Invalid line ID  
        if (flag < 0 || flag > 0xFFFF) return -3;  // Invalid flag value
        return 0;  // Success
    }
    
    // Utility methods for array operations (REQ-OBJ-003 support)
    
    // Clear all values (enhanced version)
    void clear() {
        stationId = 0;
        lineId = 0;
        flag = 0;
        fare = 0;
        salesKm = 0;
        indexOfAggregate = 0;
    }
    
    // Initialize from basic parameters (array operations helper)
    void initialize(int lineId_, int stationId_, int flag_ = 0) {
        lineId = lineId_;
        stationId = stationId_;
        flag = flag_;
        fare = 0;
        salesKm = 0;
        indexOfAggregate = 0;
    }
    
    // Copy from another RouteItemWrapper (explicit copy method)
    void copyFrom(const RouteItemWrapper& other) {
        *this = other;
    }
    
    // Comparison methods for array operations
    
    // Compare by station and line (for array searching)
    bool matchesRoute(int lineId_, int stationId_) const {
        return lineId == lineId_ && stationId == stationId_;
    }
    
    // Compare only station ID (for station-based searches)
    bool matchesStation(int stationId_) const {
        return stationId == stationId_;
    }
    
    // Compare only line ID (for line-based searches)  
    bool matchesLine(int lineId_) const {
        return lineId == lineId_;
    }
    
    // Display and formatting methods
    
    // Convert to string representation (for debugging)
    std::string toString() const {
        std::string result = "RouteItem{";
        result += "lineId=" + std::to_string(lineId);
        result += ", stationId=" + std::to_string(stationId);
        result += ", flag=" + std::to_string(flag);
        if (fare > 0) result += ", fare=" + std::to_string(fare);
        if (salesKm > 0) result += ", salesKm=" + std::to_string(salesKm);
        result += "}";
        return result;
    }
    
    // Get route segment description (for UI display)
    std::string getRouteDescription() const;
    
    // State checking methods
    
    // Check if this is a valid route segment
    bool isValidRouteSegment() const {
        return isValid() && lineId > 0;  // Both line and station must be positive for route segment
    }
    
    // Check if this is a starting point (station only)
    bool isStartingPoint() const {
        return stationId > 0 && lineId == 0;  // Station defined, no line (route start)
    }
    
    // Check if this route item has calculated data
    bool hasCalculatedData() const {
        return fare > 0 || salesKm > 0;
    }
    
    // Flag manipulation methods (for special route handling)
    
    // Set specific flag bit
    void setFlagBit(int bit) {
        if (bit >= 0 && bit < 16) {  // SPECIFICFLAG is typically 16-bit
            flag |= (1 << bit);
        }
    }
    
    // Clear specific flag bit
    void clearFlagBit(int bit) {
        if (bit >= 0 && bit < 16) {
            flag &= ~(1 << bit);
        }
    }
    
    // Check specific flag bit
    bool isFlagBitSet(int bit) const {
        if (bit >= 0 && bit < 16) {
            return (flag & (1 << bit)) != 0;
        }
        return false;
    }
    
    // Advanced comparison for sorting (used by cRouteList array operations)
    
    // Less than operator for sorting by station ID
    bool operator<(const RouteItemWrapper& other) const {
        if (stationId != other.stationId) return stationId < other.stationId;
        if (lineId != other.lineId) return lineId < other.lineId;
        return flag < other.flag;
    }
    
    // Greater than operator
    bool operator>(const RouteItemWrapper& other) const {
        return other < *this;
    }
    
    // Less than or equal
    bool operator<=(const RouteItemWrapper& other) const {
        return !(other < *this);
    }
    
    // Greater than or equal
    bool operator>=(const RouteItemWrapper& other) const {
        return !(*this < other);
    }
    
    // Not equal operator
    bool operator!=(const RouteItemWrapper& other) const {
        return !(*this == other);
    }
    
    // Memory safety validation methods (Task 25: REQ-OBJ-007)
    
    /**
     * Check if this object is in a valid state (not destroyed)
     * Should be called before accessing any member data
     * 
     * @return true if object is valid, false if destroyed or corrupted
     */
    bool isValid() const {
        return MemorySafetyValidator::isValid(magicValue) && refCounter != nullptr;
    }
    
    /**
     * Check if this object has been destroyed
     * Used for debugging use-after-destruction scenarios
     * 
     * @return true if object was destroyed, false otherwise
     */
    bool isDestroyed() const {
        return MemorySafetyValidator::isDestroyed(magicValue);
    }
    
    /**
     * Get current reference count for this object's shared data
     * Used for debugging memory management issues
     * 
     * @return reference count, -1 if object is invalid
     */
    int getReferenceCount() const {
        if (!isValid()) return -1;
        return refCounter->count;
    }
    
    /**
     * Force validation of object state with detailed error reporting
     * Throws detailed error information for debugging
     * 
     * @return 0 if valid, negative error code otherwise
     */
    int validateObjectState() const {
        if (magicValue == MemorySafetyValidator::MAGIC_VALUE_DESTROYED) {
            return -100;  // Object was destroyed
        }
        if (!MemorySafetyValidator::isValid(magicValue)) {
            return -101;  // Object corrupted
        }
        if (refCounter == nullptr) {
            return -102;  // Reference counter is null
        }
        if (refCounter->count <= 0) {
            return -103;  // Invalid reference count
        }
        return 0;  // Valid
    }
    
private:
    // Reference counting implementation
    void decrementRef() {
        if (refCounter && refCounter->count > 0) {
            refCounter->count--;
            if (refCounter->count == 0) {
                delete refCounter;
                refCounter = nullptr;
            }
        }
        // Mark as destroyed
        magicValue = MemorySafetyValidator::MAGIC_VALUE_DESTROYED;
    }
    
public:
    // Additional validation methods (REQ-OBJ-002)
    int validateStationId(int stationId) const;
    int validateLineId(int lineId) const; 
    int validateFlag(int flag) const;
    
    // Enhanced setters with validation (REQ-OBJ-002)
    int setStationIdWithValidation(int id);
    int setLineIdWithValidation(int id);
    int setFlagWithValidation(int f);
    int setFareWithValidation(int f);
    int setSalesKmWithValidation(int km);
    int setIndexOfAggregateWithValidation(int index);
    
    // Enhanced route validation methods
    bool canConnectTo(const RouteItemWrapper& nextItem) const;
    bool isCompatibleWithLine(int targetLineId) const;
    
    // Enhanced state checking methods (task 3 requirements)
    bool isTransferPoint() const;
    bool isTerminalStation() const;
    bool hasSpecialFlags() const;
    
    // Enhanced comparison methods for array operations
    bool deepEquals(const RouteItemWrapper& other) const;
    int getSortKey() const;
    
    // Distance calculation helper (for route optimization)
    int estimateDistanceTo(const RouteItemWrapper& other) const;
};

// RouteFlag wrapper class (corresponds to cRouteFlag)
class RouteFlagWrapper {
private:
    // Object lifecycle management (Task 25: REQ-OBJ-007)
    mutable int magicValue;             // Memory safety validation
    mutable RefCounter* refCounter;     // Reference counting for shared data
    
public:
    // Osaka loop line pass constants (matching C++ RouteFlag::OSAKAKAN_PASS enum)
    enum OsakaKanPass {
        OSAKAKAN_NOPASS = 0,    // 初期状態(大阪環状線未通過)
        OSAKAKAN_1PASS = 1,     // 大阪環状線 1回通過
        OSAKAKAN_2PASS = 2      // 大阪環状線 2回通過
    };
    // 30+ Boolean Properties (based on RouteFlag class in alpdb.h lines 247-469)
    bool no_rule;                   // Disable fare calculation rules
    bool jrtokaistock_applied;      // JR Tokai stock discount applied
    bool jrtokaistock_enable;       // JR Tokai stock enable (system flag)
    bool meihan_city_flag;          // TRUE: departure only city area
    bool rule88;                    // Rule 88 application
    bool rule69;                    // Rule 69 application
    bool rule70;                    // Rule 70 application
    bool special_fare_enable;       // Enable special fare calculations
    bool rule70bullet;              // Rule 70 bullet train
    bool rule16_5;                  // Rule 16.5 application
    bool bullet_line;               // Shinkansen line usage
    bool bJrTokaiOnly;             // JR Tokai only route
    bool meihan_city_enable;        // Meihan city area enable
    bool trackmarkctl;              // Track mark control
    bool jctsp_route_change;        // Junction special route change
    bool ter_begin_oosaka;          // Terminal begin Osaka
    bool ter_fin_oosaka;            // Terminal finish Osaka
    bool compncheck;                // Company line pass check enable
    bool compnpass;                 // Pass company line transport
    bool compnda;                   // Pass company line transport invalid flag
    bool compnbegin;                // Start with company line
    bool compnend;                  // End with company line
    bool compnterm;                 // Company line pass transport terminal check
    bool tokai_shinkansen;          // Tokai Shinkansen usage
    bool notsamekokurahakatashinzai; // Kokura-Hakata different line handling
    bool end;                       // Arrive to end station
    bool osakakan_1dir;             // Osaka loop line 1st direction
    bool osakakan_2dir;             // Osaka loop line 2nd direction
    bool osakakan_detour;           // Osaka loop line 1st detour
    
    // 4 Numeric Properties
    unsigned char rule86or87;       // Rule 86 or 87 application (bit flags)
    int8_t rule115;                // Rule 115 application
    int8_t urban_neerest;          // Urban area nearest calculation
    unsigned char osakaKanPass;     // Osaka loop line pass count
    
    // Constructor with lifecycle management
    RouteFlagWrapper() {
        clear();
        
        // Initialize lifecycle management
        magicValue = MemorySafetyValidator::MAGIC_VALUE_VALID;
        refCounter = new RefCounter();
    }
    
    // Constructor from C++ RouteFlag (implementation will be in .cpp file)
    RouteFlagWrapper(const RouteFlag* flag);
    
    // Destructor with RAII cleanup (Task 25: REQ-OBJ-007)
    ~RouteFlagWrapper() {
        if (isValid()) {
            decrementRef();
        }
    }
    
    // Copy constructor with reference counting
    RouteFlagWrapper(const RouteFlagWrapper& other) {
        copyDataFrom(other);
        
        // Share reference counter
        magicValue = other.magicValue;
        refCounter = other.refCounter;
        if (other.isValid() && refCounter) {
            refCounter->count++;
        }
    }
    
    // Assignment operator with reference counting
    RouteFlagWrapper& operator=(const RouteFlagWrapper& other) {
        if (this != &other) {
            // Decrement current reference
            if (isValid()) {
                decrementRef();
            }
            
            // Copy data
            copyDataFrom(other);
            
            // Share reference counter
            magicValue = other.magicValue;
            refCounter = other.refCounter;
            if (other.isValid() && refCounter) {
                refCounter->count++;
            }
        }
        return *this;
    }
    
    // 15+ Management Methods (matching C++ RouteFlag class methods)
    
    // Clear all flags to default state
    void clear() {
        // Boolean properties initialization
        no_rule = false;
        jrtokaistock_applied = false;
        jrtokaistock_enable = false;
        meihan_city_flag = false;
        rule88 = false;
        rule69 = false;
        rule70 = false;
        special_fare_enable = false;
        rule70bullet = false;
        rule16_5 = false;
        bullet_line = false;
        bJrTokaiOnly = false;
        meihan_city_enable = false;
        trackmarkctl = false;
        jctsp_route_change = false;
        ter_begin_oosaka = false;
        ter_fin_oosaka = false;
        compncheck = false;
        compnpass = false;
        compnda = false;
        compnbegin = false;
        compnend = false;
        compnterm = false;
        tokai_shinkansen = false;
        notsamekokurahakatashinzai = false;
        end = false;
        osakakan_1dir = false;
        osakakan_2dir = false;
        osakakan_detour = false;
        
        // Numeric properties initialization
        rule86or87 = 0;
        rule115 = 0;
        urban_neerest = 0;
        osakaKanPass = 0;
    }
    
    // Set route flag from another RouteFlag
    void setAnotherRouteFlag(const RouteFlagWrapper& other) {
        *this = other;
    }
    
    // Rule enablement check
    bool rule_en() const {
        return (0x3f & rule86or87) ||
               rule88 ||
               rule69 ||
               rule70 ||
               special_fare_enable ||
               meihan_city_enable;
    }
    
    // Basic flag setters
    void setNoRule(bool b_rule) { 
        no_rule = b_rule; 
    }
    
    // Long route management
    bool isEnableLongRoute() const { 
        return !no_rule && 0 != urban_neerest; 
    }
    
    bool isLongRoute() const { 
        return urban_neerest < 0; 
    }
    
    void setLongRoute(bool farflag) {
        if (farflag) {
            urban_neerest = -1;
        } else {
            urban_neerest = 1;
        }
    }
    
    // Rule 115 management
    bool isEnableRule115() const { 
        return !no_rule && 0 != rule115; 
    }
    
    bool isRule115specificTerm() const { 
        return rule115 < 0; 
    }
    
    void setSpecificTermRule115(bool ena) {
        if (ena) {
            rule115 = -1;
        } else {
            rule115 = 1;
        }
    }
    
    // City area management
    void setStartAsCity() { 
        meihan_city_flag = true;    // 着駅=単駅、発駅市内駅
    }
    
    void setArriveAsCity() { 
        meihan_city_flag = false;   // 発駅=単駅、着駅市内駅
    }
    
    // Rule 86/87 management
    void setDisableRule86or87() { 
        rule86or87 |= 0x40; 
    }
    
    void setEnableRule86or87() { 
        rule86or87 &= 0x3f; 
    }
    
    bool isEnableRule86or87() const { 
        return 0 == (rule86or87 & 0x40); 
    }
    
    // Rule availability checks (15+ methods)
    bool isAvailableRule86or87() const { 
        return ((rule86or87 & 0x0f) != 0) && ((rule86or87 & 0x40) == 0); 
    }
    
    bool isAvailableRule86() const { 
        return (rule86or87 & 0x03) != 0; 
    }
    
    bool isAvailableRule87() const { 
        return (rule86or87 & 0x0c) != 0; 
    }
    
    bool isAvailableRule88() const { 
        return rule88; 
    }
    
    bool isAvailableRule70() const { 
        return rule70; 
    }
    
    bool isAvailableRule69() const { 
        return rule69; 
    }
    
    bool isAvailableRule115() const { 
        return 0 < rule115; 
    }
    
    bool isAvailableRule16_5() const { 
        return rule16_5; 
    }
    
    // City area checks
    bool isMeihanCityEnable() const {
        return !no_rule && meihan_city_enable;
    }
    
    bool isArriveAsCity() const { 
        return (meihan_city_enable == true) && (meihan_city_flag == false); 
    }
    
    bool isStartAsCity() const { 
        return (meihan_city_enable == true) && (meihan_city_flag == true); 
    }
    
    // Osaka loop line management
    int getOsakaKanPassValue() const { 
        return osakaKanPass; 
    }
    
    bool is_osakakan_1pass() const {
        return 1 == (osakaKanPass & 0x03);  // OSAKAKAN_1PASS
    }
    
    bool is_osakakan_2pass() const {
        return 2 == (osakaKanPass & 0x03);  // OSAKAKAN_2PASS
    }
    
    bool is_osakakan_nopass() const {
        return 0 == (osakaKanPass & 0x03);  // OSAKAKAN_NOPASS
    }
    
    void setOsakaKanPass(bool value) {
        if (value) {
            osakaKanPass |= (1 << 0);
        } else {
            osakaKanPass &= ~(1 << 0);
        }
    }
    
    bool getOsakaKanPass() const { 
        return 0 != (osakaKanPass & (1 << 0)); 
    }
    
    void setOsakaKanFlag(unsigned char pass) {
        this->osakaKanPass = pass;
    }
    
    void setOsakaKanFlag(const RouteFlagWrapper& lf) {
        this->osakaKanPass = lf.osakaKanPass;
        this->osakakan_1dir = lf.osakakan_1dir;
        this->osakakan_2dir = lf.osakakan_2dir;
    }
    
    // Route state checks
    bool isRoundTrip() const {
        return !end || compnda;
    }
    
    // Reset methods
    void terCityReset() {
        rule86or87 &= 0x40;
        ter_begin_oosaka = false;
        ter_fin_oosaka = false;
    }
    
    void optionFlagReset() {
        special_fare_enable = false;
        meihan_city_enable = false;
        rule88 = false;
        rule69 = false;
        rule70 = false;
        rule70bullet = false;
    }
    
    // Additional checks
    bool isTerCity() const {
        return (rule86or87 & 0x3f) ||
               ter_begin_oosaka ||
               ter_fin_oosaka;
    }
    
    bool isUseBullet() const { 
        return bullet_line || rule70bullet; 
    }
    
    bool isIncludeCompanyLine() const { 
        return compncheck; 
    }
    
    // Property accessors for TypeScript compatibility
    
    // Boolean property getters
    bool getNoRule() const { return no_rule; }
    bool getJrTokaiStockApplied() const { return jrtokaistock_applied; }
    bool getJrTokaiStockEnable() const { return jrtokaistock_enable; }
    bool getMeihanCityFlag() const { return meihan_city_flag; }
    bool getRule88() const { return rule88; }
    bool getRule69() const { return rule69; }
    bool getRule70() const { return rule70; }
    bool getSpecialFareEnable() const { return special_fare_enable; }
    bool getRule70Bullet() const { return rule70bullet; }
    bool getRule16_5() const { return rule16_5; }
    bool getBulletLine() const { return bullet_line; }
    bool getBJrTokaiOnly() const { return bJrTokaiOnly; }
    bool getMeihanCityEnable() const { return meihan_city_enable; }
    bool getTrackmarkctl() const { return trackmarkctl; }
    bool getJctspRouteChange() const { return jctsp_route_change; }
    bool getTerBeginOosaka() const { return ter_begin_oosaka; }
    bool getTerFinOosaka() const { return ter_fin_oosaka; }
    bool getCompncheck() const { return compncheck; }
    bool getCompnpass() const { return compnpass; }
    bool getCompnda() const { return compnda; }
    bool getCompnbegin() const { return compnbegin; }
    bool getCompnend() const { return compnend; }
    bool getCompnterm() const { return compnterm; }
    bool getTokaiShinkansen() const { return tokai_shinkansen; }
    bool getNotsamekokurahakatashinzai() const { return notsamekokurahakatashinzai; }
    bool getEnd() const { return end; }
    bool getOsakakan1dir() const { return osakakan_1dir; }
    bool getOsakakan2dir() const { return osakakan_2dir; }
    bool getOsakakanDetour() const { return osakakan_detour; }
    
    // Numeric property getters
    unsigned char getRule86or87() const { return rule86or87; }
    int8_t getRule115() const { return rule115; }
    int8_t getUrbanNeerest() const { return urban_neerest; }
    
    // Boolean property setters
    void setJrTokaiStockApplied(bool value) { jrtokaistock_applied = value; }
    void setJrTokaiStockEnable(bool value) { jrtokaistock_enable = value; }
    void setMeihanCityFlag(bool value) { meihan_city_flag = value; }
    void setRule88(bool value) { rule88 = value; }
    void setRule69(bool value) { rule69 = value; }
    void setRule70(bool value) { rule70 = value; }
    void setSpecialFareEnable(bool value) { special_fare_enable = value; }
    void setRule70Bullet(bool value) { rule70bullet = value; }
    void setRule16_5(bool value) { rule16_5 = value; }
    void setBulletLine(bool value) { bullet_line = value; }
    void setBJrTokaiOnly(bool value) { bJrTokaiOnly = value; }
    void setMeihanCityEnable(bool value) { meihan_city_enable = value; }
    void setTrackmarkctl(bool value) { trackmarkctl = value; }
    void setJctspRouteChange(bool value) { jctsp_route_change = value; }
    void setTerBeginOosaka(bool value) { ter_begin_oosaka = value; }
    void setTerFinOosaka(bool value) { ter_fin_oosaka = value; }
    void setCompncheck(bool value) { compncheck = value; }
    void setCompnpass(bool value) { compnpass = value; }
    void setCompnda(bool value) { compnda = value; }
    void setCompnbegin(bool value) { compnbegin = value; }
    void setCompnend(bool value) { compnend = value; }
    void setCompnterm(bool value) { compnterm = value; }
    void setTokaiShinkansen(bool value) { tokai_shinkansen = value; }
    void setNotsamekokurahakatashinzai(bool value) { notsamekokurahakatashinzai = value; }
    void setEnd(bool value) { end = value; }
    void setOsakakan1dir(bool value) { osakakan_1dir = value; }
    void setOsakakan2dir(bool value) { osakakan_2dir = value; }
    void setOsakakanDetour(bool value) { osakakan_detour = value; }
    
    // Numeric property setters
    void setRule86or87(unsigned char value) { rule86or87 = value; }
    void setRule115(int8_t value) { rule115 = value; }
    void setUrbanNeerest(int8_t value) { urban_neerest = value; }
    void setOsakaKanPassValue(unsigned char value) { osakaKanPass = value; }
    
    // Rule debugging and display methods
    
    // Show applied fare calculation rules (matching C++ RouteFlag::showAppliedRule())
    std::string showAppliedRule() const {
        std::string result;
        
        // Rule 86/87 (City area rules)
        if (rule86or87 & 0x3f) {
            if (!result.empty()) result += ", ";
            if (rule86or87 & 0x03) result += "Rule86";
            if (rule86or87 & 0x0c) result += "Rule87";
        }
        
        // Rule 115 (Long distance rules)
        if (rule115 > 0) {
            if (!result.empty()) result += ", ";
            result += "Rule115";
        }
        
        // Rule 88 (Special fare rules)
        if (rule88) {
            if (!result.empty()) result += ", ";
            result += "Rule88";
        }
        
        // Rule 69 (Terminal area rules)
        if (rule69) {
            if (!result.empty()) result += ", ";
            result += "Rule69";
        }
        
        // Rule 70 (Bullet train rules)
        if (rule70) {
            if (!result.empty()) result += ", ";
            result += "Rule70";
        }
        
        // Special fare enable
        if (special_fare_enable) {
            if (!result.empty()) result += ", ";
            result += "SpecialFare";
        }
        
        // Meihan city enable
        if (meihan_city_enable) {
            if (!result.empty()) result += ", ";
            result += "MeihanCity";
        }
        
        // Rule 16.5
        if (rule16_5) {
            if (!result.empty()) result += ", ";
            result += "Rule16.5";
        }
        
        if (result.empty()) {
            result = "NoRules";
        }
        
        return result;
    }
    
    // Enhanced parameter validation methods (REQ-OBJ-002)
    
    // Validate Rule 86/87 flag value
    int validateRule86or87(unsigned char value) const {
        // Rule 86/87 uses 6 bits for rule data plus 1 disable bit
        if (value > 0x7F) return -1;  // Invalid: exceeds 7-bit range
        return 0;  // Valid
    }
    
    // Validate Rule 115 value  
    int validateRule115(int8_t value) const {
        // Rule 115: -1=specific term, 0=disabled, 1=enabled
        if (value < -1 || value > 1) return -1;  // Invalid range
        return 0;  // Valid
    }
    
    // Validate urban nearest value
    int validateUrbanNeerest(int8_t value) const {
        // Urban nearest: -1=far, 0=N/A, 1=near
        if (value < -1 || value > 1) return -1;  // Invalid range
        return 0;  // Valid
    }
    
    // Validate Osaka loop line pass value
    int validateOsakaKanPass(unsigned char value) const {
        // Pass count should be reasonable (0-3 typical)
        if ((value & 0x03) > 2) return -1;  // Invalid: pass count too high
        return 0;  // Valid
    }
    
    // Comprehensive validation of all flag values
    int validateAllFlags() const {
        int result;
        
        result = validateRule86or87(rule86or87);
        if (result != 0) return result;
        
        result = validateRule115(rule115);
        if (result != 0) return result;
        
        result = validateUrbanNeerest(urban_neerest);
        if (result != 0) return result;
        
        result = validateOsakaKanPass(osakaKanPass);
        if (result != 0) return result;
        
        return 0;  // All valid
    }
    
    // Android Kotlin compatibility methods (REQ-OBJ-005)
    
    // Get rule state as integer flags (Android compatible)
    int getRuleStateFlags() const {
        int flags = 0;
        
        if (rule88) flags |= (1 << 0);
        if (rule69) flags |= (1 << 1);
        if (rule70) flags |= (1 << 2);
        if (special_fare_enable) flags |= (1 << 3);
        if (meihan_city_enable) flags |= (1 << 4);
        if (rule16_5) flags |= (1 << 5);
        if (bullet_line) flags |= (1 << 6);
        if (no_rule) flags |= (1 << 7);
        
        return flags;
    }
    
    // Set rule state from integer flags (Android compatible)
    void setRuleStateFlags(int flags) {
        rule88 = (flags & (1 << 0)) != 0;
        rule69 = (flags & (1 << 1)) != 0;
        rule70 = (flags & (1 << 2)) != 0;
        special_fare_enable = (flags & (1 << 3)) != 0;
        meihan_city_enable = (flags & (1 << 4)) != 0;
        rule16_5 = (flags & (1 << 5)) != 0;
        bullet_line = (flags & (1 << 6)) != 0;
        no_rule = (flags & (1 << 7)) != 0;
    }
    
    // Get company line state flags (Android compatible)
    int getCompanyLineFlags() const {
        int flags = 0;
        
        if (compncheck) flags |= (1 << 0);
        if (compnpass) flags |= (1 << 1);
        if (compnda) flags |= (1 << 2);
        if (compnbegin) flags |= (1 << 3);
        if (compnend) flags |= (1 << 4);
        if (compnterm) flags |= (1 << 5);
        
        return flags;
    }
    
    // Set company line state from flags (Android compatible)
    void setCompanyLineFlags(int flags) {
        compncheck = (flags & (1 << 0)) != 0;
        compnpass = (flags & (1 << 1)) != 0;
        compnda = (flags & (1 << 2)) != 0;
        compnbegin = (flags & (1 << 3)) != 0;
        compnend = (flags & (1 << 4)) != 0;
        compnterm = (flags & (1 << 5)) != 0;
    }
    
    // State management methods with error handling
    
    // Enhanced rule enable/disable with validation
    int setRule86or87WithValidation(unsigned char value) {
        int result = validateRule86or87(value);
        if (result == 0) {
            rule86or87 = value;
        }
        return result;
    }
    
    int setRule115WithValidation(int8_t value) {
        int result = validateRule115(value);
        if (result == 0) {
            rule115 = value;
        }
        return result;
    }
    
    int setUrbanNeerestWithValidation(int8_t value) {
        int result = validateUrbanNeerest(value);
        if (result == 0) {
            urban_neerest = value;
        }
        return result;
    }
    
    int setOsakaKanPassWithValidation(unsigned char value) {
        int result = validateOsakaKanPass(value);
        if (result == 0) {
            osakaKanPass = value;
        }
        return result;
    }
    
    // Enhanced reset methods with selective clearing
    
    // Reset only rule flags (preserving company/system flags)
    void resetRulesOnly() {
        rule86or87 = 0;
        rule115 = 0;
        rule88 = false;
        rule69 = false;
        rule70 = false;
        rule70bullet = false;
        rule16_5 = false;
        special_fare_enable = false;
    }
    
    // Reset only company line flags
    void resetCompanyFlags() {
        compncheck = false;
        compnpass = false;
        compnda = false;
        compnbegin = false;
        compnend = false;
        compnterm = false;
    }
    
    // Reset only Osaka loop line flags
    void resetOsakaFlags() {
        osakaKanPass = 0;
        osakakan_1dir = false;
        osakakan_2dir = false;
        osakakan_detour = false;
    }
    
    // Enhanced state inquiry methods
    
    // Check if any terminal city rules are active
    bool hasActiveCityRules() const {
        return (rule86or87 & 0x3f) || ter_begin_oosaka || ter_fin_oosaka;
    }
    
    // Check if any special rules are active
    bool hasActiveSpecialRules() const {
        return rule88 || rule69 || rule70 || special_fare_enable || rule16_5;
    }
    
    // Check if any company line rules are active
    bool hasActiveCompanyRules() const {
        return compncheck || compnpass || compnda;
    }
    
    // Check if Osaka loop line handling is active
    bool hasActiveOsakaRules() const {
        return osakaKanPass != 0 || osakakan_1dir || osakakan_2dir;
    }
    
    // Memory safety validation methods (Task 25: REQ-OBJ-007)
    
    /**
     * Check if this object is in a valid state (not destroyed)
     * Should be called before accessing any member data
     * 
     * @return true if object is valid, false if destroyed or corrupted
     */
    bool isValid() const {
        return MemorySafetyValidator::isValid(magicValue) && refCounter != nullptr;
    }
    
    /**
     * Check if this object has been destroyed
     * Used for debugging use-after-destruction scenarios
     * 
     * @return true if object was destroyed, false otherwise
     */
    bool isDestroyed() const {
        return MemorySafetyValidator::isDestroyed(magicValue);
    }
    
    /**
     * Get current reference count for this object's shared data
     * Used for debugging memory management issues
     * 
     * @return reference count, -1 if object is invalid
     */
    int getReferenceCount() const {
        if (!isValid()) return -1;
        return refCounter->count;
    }
    
    /**
     * Force validation of object state with detailed error reporting
     * Throws detailed error information for debugging
     * 
     * @return 0 if valid, negative error code otherwise
     */
    int validateObjectState() const {
        if (magicValue == MemorySafetyValidator::MAGIC_VALUE_DESTROYED) {
            return -100;  // Object was destroyed
        }
        if (!MemorySafetyValidator::isValid(magicValue)) {
            return -101;  // Object corrupted
        }
        if (refCounter == nullptr) {
            return -102;  // Reference counter is null
        }
        if (refCounter->count <= 0) {
            return -103;  // Invalid reference count
        }
        // Additional validation using comprehensive flag validation
        if (validateAllFlags() != 0) {
            return -104;  // Flag validation failed
        }
        return 0;  // Valid
    }
    
private:
    // Reference counting implementation
    void decrementRef() {
        if (refCounter && refCounter->count > 0) {
            refCounter->count--;
            if (refCounter->count == 0) {
                delete refCounter;
                refCounter = nullptr;
            }
        }
        // Mark as destroyed
        magicValue = MemorySafetyValidator::MAGIC_VALUE_DESTROYED;
    }
    
    // Helper method to copy all data properties
    void copyDataFrom(const RouteFlagWrapper& other) {
        // Boolean properties
        no_rule = other.no_rule;
        jrtokaistock_applied = other.jrtokaistock_applied;
        jrtokaistock_enable = other.jrtokaistock_enable;
        meihan_city_flag = other.meihan_city_flag;
        rule88 = other.rule88;
        rule69 = other.rule69;
        rule70 = other.rule70;
        special_fare_enable = other.special_fare_enable;
        rule70bullet = other.rule70bullet;
        rule16_5 = other.rule16_5;
        bullet_line = other.bullet_line;
        bJrTokaiOnly = other.bJrTokaiOnly;
        meihan_city_enable = other.meihan_city_enable;
        trackmarkctl = other.trackmarkctl;
        jctsp_route_change = other.jctsp_route_change;
        ter_begin_oosaka = other.ter_begin_oosaka;
        ter_fin_oosaka = other.ter_fin_oosaka;
        compncheck = other.compncheck;
        compnpass = other.compnpass;
        compnda = other.compnda;
        compnbegin = other.compnbegin;
        compnend = other.compnend;
        compnterm = other.compnterm;
        tokai_shinkansen = other.tokai_shinkansen;
        notsamekokurahakatashinzai = other.notsamekokurahakatashinzai;
        end = other.end;
        osakakan_1dir = other.osakakan_1dir;
        osakakan_2dir = other.osakakan_2dir;
        osakakan_detour = other.osakakan_detour;
        
        // Numeric properties
        rule86or87 = other.rule86or87;
        rule115 = other.rule115;
        urban_neerest = other.urban_neerest;
        osakaKanPass = other.osakaKanPass;
    }
    
public:
    
    // Equality operator
    bool operator==(const RouteFlagWrapper& other) const {
        return no_rule == other.no_rule &&
               jrtokaistock_applied == other.jrtokaistock_applied &&
               rule86or87 == other.rule86or87 &&
               rule115 == other.rule115 &&
               urban_neerest == other.urban_neerest &&
               osakaKanPass == other.osakaKanPass;
        // Note: Comparing all properties would be extensive, focusing on key ones
    }
};

// Route wrapper class (corresponds to cRoute)
class RouteWrapper {
private:
    // Object lifecycle management (Task 25: REQ-OBJ-007)
    mutable int magicValue;             // Memory safety validation
    mutable RefCounter* refCounter;     // Reference counting for shared data
    
public:
    Route* route;  // Made public for friend classes access
    
public:
    RouteWrapper();
    RouteWrapper(const RouteWrapper& source);
    RouteWrapper(const class RouteListWrapper& source);
    RouteWrapper(const RouteWrapper& source, int count);
    
    // Enhanced destructor with RAII cleanup (Task 25: REQ-OBJ-007)
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
    RouteItemWrapper getRouteItem(int index) const;
    RouteItem* getRouteItemPtr(int index) const;  // For internal C++ usage
    int startStationId() const;
    
    // Route item manipulation methods (REQ-OBJ-003, REQ-OBJ-004)
    void insertItem(int index, const RouteItemWrapper& item);
    void removeItem(int index);
    int lastStationId() const;
    int lastLineId() const;
    bool isReverseAllow() const;
    bool isEnd() const;
    bool isOsakakanDetourEnable() const;
    bool isOsakakanDetourShortcut() const;
    
    // Get route as string
    std::string routeScript() const;
    
    // Validation methods (Task 19: REQ-OBJ-002, REQ-OBJ-004)
    
    /**
     * Validate the current route for integrity and connectivity
     * Returns comprehensive validation result with detailed error reporting
     * and fuzzy matching suggestions for invalid components
     * 
     * @return ValidationResult containing validation status, error messages, and suggestions
     */
    ValidationResult validateRoute() const;
    
    /**
     * Validate route string components before calling setupRoute()
     * Provides detailed error reporting and fuzzy matching for invalid station/line names
     * 
     * @param routeString The route string to validate (format: "Station Line Station Line ...")
     * @return ValidationResult containing validation status and improvement suggestions
     */
    ValidationResult validateRouteString(const std::string& routeString) const;
    
    /**
     * Validate station name using RouteUtility methods (Task 19)
     * Provides fuzzy matching suggestions for invalid station names
     * REQ-OBJ-002, REQ-OBJ-004: C++ Compatible Input Validation
     * 
     * @param stationName The station name to validate
     * @return ValidationResult containing validation status and suggestions
     */
    ValidationResult validateStationName(const std::string& stationName) const;
    
    /**
     * Validate line name using RouteUtility methods (Task 19)
     * Provides fuzzy matching suggestions for invalid line names
     * REQ-OBJ-002, REQ-OBJ-004: C++ Compatible Input Validation
     * 
     * @param lineName The line name to validate
     * @return ValidationResult containing validation status and suggestions
     */
    ValidationResult validateLineName(const std::string& lineName) const;
    
    /**
     * Validate route connectivity between stations (Task 19)
     * REQ-OBJ-002, REQ-OBJ-004: C++ Compatible Route Construction Validation
     * 
     * @param fromStationId Starting station ID
     * @param lineId Line ID connecting the stations
     * @param toStationId Destination station ID
     * @return ValidationResult containing validation status and suggestions
     */
    ValidationResult validateRouteConnectivity(int fromStationId, int lineId, int toStationId) const;
    
    /**
     * Validate input parameters before route construction (Task 19)
     * REQ-OBJ-002: C++ Compatible Error Handling with identical error codes
     * 
     * @param stationId Station ID to validate
     * @param lineId Line ID to validate
     * @return Error code (0 for success, negative for errors matching C++ behavior)
     */
    int validateInputParameters(int stationId, int lineId) const;
    
    /**
     * Enhanced route addition validation (Task 19)
     * REQ-OBJ-004: C++ Compatible Route Construction with validation
     * 
     * @param stationId Station ID to add to route
     * @param lineId Line ID for route segment
     * @return ValidationResult containing validation status and detailed suggestions
     */
    ValidationResult validateAddRoute(int stationId, int lineId) const;
    
    // Memory safety validation methods (Task 25: REQ-OBJ-007)
    
    /**
     * Check if this object is in a valid state (not destroyed)
     * Should be called before accessing any member data
     * 
     * @return true if object is valid, false if destroyed or corrupted
     */
    bool isValid() const {
        return MemorySafetyValidator::isValid(magicValue) && refCounter != nullptr && route != nullptr;
    }
    
    /**
     * Check if this object has been destroyed
     * Used for debugging use-after-destruction scenarios
     * 
     * @return true if object was destroyed, false otherwise
     */
    bool isDestroyed() const {
        return MemorySafetyValidator::isDestroyed(magicValue);
    }
    
    /**
     * Get current reference count for this object's shared data
     * Used for debugging memory management issues
     * 
     * @return reference count, -1 if object is invalid
     */
    int getReferenceCount() const {
        if (!isValid()) return -1;
        return refCounter->count;
    }
    
    /**
     * Force validation of object state with detailed error reporting
     * Throws detailed error information for debugging
     * 
     * @return 0 if valid, negative error code otherwise
     */
    int validateObjectState() const {
        if (magicValue == MemorySafetyValidator::MAGIC_VALUE_DESTROYED) {
            return -100;  // Object was destroyed
        }
        if (!MemorySafetyValidator::isValid(magicValue)) {
            return -101;  // Object corrupted
        }
        if (refCounter == nullptr) {
            return -102;  // Reference counter is null
        }
        if (refCounter->count <= 0) {
            return -103;  // Invalid reference count
        }
        if (route == nullptr) {
            return -105;  // Route pointer is null
        }
        return 0;  // Valid
    }
    
private:
    // Reference counting implementation
    void incrementRef() const {
        if (refCounter) {
            refCounter->count++;
        }
    }
    
    void decrementRef() {
        if (refCounter && refCounter->count > 0) {
            refCounter->count--;
            if (refCounter->count == 0) {
                cleanupRoute();
                delete refCounter;
                refCounter = nullptr;
            }
        }
        // Mark as destroyed
        magicValue = MemorySafetyValidator::MAGIC_VALUE_DESTROYED;
    }
    
    void cleanupRoute();
    void initializeLifecycle();
    
    // Helper methods for validation
    std::vector<std::string> parseRouteString(const std::string& routeString) const;
    bool validateStationConnection(const RouteItem& from, const RouteItem& to) const;
    std::vector<std::string> generateStationNameSuggestions(const std::string& invalidName) const;
    std::vector<std::string> generateLineNameSuggestions(const std::string& invalidName) const;
};

// Route list wrapper class (corresponds to cRouteList)
class RouteListWrapper {
private:
    // Object lifecycle management (Task 25: REQ-OBJ-007)
    mutable int magicValue;             // Memory safety validation
    mutable RefCounter* refCounter;     // Reference counting for shared data
    
public:
    RouteList* routeList;  // Made public for friend classes access
    
public:
    RouteListWrapper(const RouteWrapper& source);
    
    // Enhanced destructor with RAII cleanup (Task 25: REQ-OBJ-007)
    ~RouteListWrapper();
    
    // Route list properties
    int startStationId() const;
    int lastStationId() const;
    std::string routeScript() const;
    
    // Array operations (REQ-OBJ-003)
    int count() const;                                      // Array size
    RouteItemWrapper at(int index) const;                   // Array element access with bounds checking
    void remove(int index);                                 // Remove element at index
    void removeAll();                                       // Clear all elements
    void insert(int index, const RouteItemWrapper& item);   // Insert element at index
    void assign(const RouteListWrapper& source);            // Copy from another RouteListWrapper
    
    // Route flag access methods
    RouteFlag getRouteFlag() const;                         // Get route flags
    void setRouteFlag(const RouteFlag& flag);               // Set route flags
    
    // Memory safety validation methods (Task 25: REQ-OBJ-007)
    
    /**
     * Check if this object is in a valid state (not destroyed)
     * Should be called before accessing any member data
     * 
     * @return true if object is valid, false if destroyed or corrupted
     */
    bool isValid() const {
        return MemorySafetyValidator::isValid(magicValue) && refCounter != nullptr && routeList != nullptr;
    }
    
    /**
     * Check if this object has been destroyed
     * Used for debugging use-after-destruction scenarios
     * 
     * @return true if object was destroyed, false otherwise
     */
    bool isDestroyed() const {
        return MemorySafetyValidator::isDestroyed(magicValue);
    }
    
    /**
     * Get current reference count for this object's shared data
     * Used for debugging memory management issues
     * 
     * @return reference count, -1 if object is invalid
     */
    int getReferenceCount() const {
        if (!isValid()) return -1;
        return refCounter->count;
    }
    
    /**
     * Force validation of object state with detailed error reporting
     * Throws detailed error information for debugging
     * 
     * @return 0 if valid, negative error code otherwise
     */
    int validateObjectState() const {
        if (magicValue == MemorySafetyValidator::MAGIC_VALUE_DESTROYED) {
            return -100;  // Object was destroyed
        }
        if (!MemorySafetyValidator::isValid(magicValue)) {
            return -101;  // Object corrupted
        }
        if (refCounter == nullptr) {
            return -102;  // Reference counter is null
        }
        if (refCounter->count <= 0) {
            return -103;  // Invalid reference count
        }
        if (routeList == nullptr) {
            return -106;  // RouteList pointer is null
        }
        return 0;  // Valid
    }
    
private:
    // Reference counting implementation
    void incrementRef() const {
        if (refCounter) {
            refCounter->count++;
        }
    }
    
    void decrementRef() {
        if (refCounter && refCounter->count > 0) {
            refCounter->count--;
            if (refCounter->count == 0) {
                cleanupRouteList();
                delete refCounter;
                refCounter = nullptr;
            }
        }
        // Mark as destroyed
        magicValue = MemorySafetyValidator::MAGIC_VALUE_DESTROYED;
    }
    
    void cleanupRouteList();
    void initializeLifecycle();
};

// Calculation wrapper class (corresponds to cCalcRoute)
class CalcRouteWrapper {
private:
    CalcRoute* calcRoute;
    int lastFareResult;  // Store last fare calculation result code
    
    // Object lifecycle management (Task 25: REQ-OBJ-007)
    mutable int magicValue;             // Memory safety validation
    mutable RefCounter* refCounter;     // Reference counting for shared data
    
public:
    CalcRouteWrapper(const RouteWrapper& route);
    CalcRouteWrapper(const RouteWrapper& route, int count);
    CalcRouteWrapper(const RouteListWrapper& routeList);
    
    // Enhanced destructor with RAII cleanup (Task 25: REQ-OBJ-007)
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
    
    // Memory safety validation methods (Task 25: REQ-OBJ-007)
    
    /**
     * Check if this object is in a valid state (not destroyed)
     * Should be called before accessing any member data
     * 
     * @return true if object is valid, false if destroyed or corrupted
     */
    bool isValid() const {
        return MemorySafetyValidator::isValid(magicValue) && refCounter != nullptr && calcRoute != nullptr;
    }
    
    /**
     * Check if this object has been destroyed
     * Used for debugging use-after-destruction scenarios
     * 
     * @return true if object was destroyed, false otherwise
     */
    bool isDestroyed() const {
        return MemorySafetyValidator::isDestroyed(magicValue);
    }
    
    /**
     * Get current reference count for this object's shared data
     * Used for debugging memory management issues
     * 
     * @return reference count, -1 if object is invalid
     */
    int getReferenceCount() const {
        if (!isValid()) return -1;
        return refCounter->count;
    }
    
    /**
     * Force validation of object state with detailed error reporting
     * Throws detailed error information for debugging
     * 
     * @return 0 if valid, negative error code otherwise
     */
    int validateObjectState() const {
        if (magicValue == MemorySafetyValidator::MAGIC_VALUE_DESTROYED) {
            return -100;  // Object was destroyed
        }
        if (!MemorySafetyValidator::isValid(magicValue)) {
            return -101;  // Object corrupted
        }
        if (refCounter == nullptr) {
            return -102;  // Reference counter is null
        }
        if (refCounter->count <= 0) {
            return -103;  // Invalid reference count
        }
        if (calcRoute == nullptr) {
            return -107;  // CalcRoute pointer is null
        }
        return 0;  // Valid
    }
    
private:
    // Reference counting implementation
    void incrementRef() const {
        if (refCounter) {
            refCounter->count++;
        }
    }
    
    void decrementRef() {
        if (refCounter && refCounter->count > 0) {
            refCounter->count--;
            if (refCounter->count == 0) {
                cleanupCalcRoute();
                delete refCounter;
                refCounter = nullptr;
            }
        }
        // Mark as destroyed
        magicValue = MemorySafetyValidator::MAGIC_VALUE_DESTROYED;
    }
    
    void cleanupCalcRoute();
    void initializeLifecycle();
};

// Utility functions for station/line lookup
class RouteUtility {
public:
    static int getStationId(const std::string& name);
    static std::string getStationName(int id);
    static std::string getLineName(int id);
    static int getLineIdFromName(const std::string& lineName);  // 追加
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
    
    // Android-compatible utility methods (matching RouteHelper.kt)
    // Based on RouteHelper.kt implementation patterns (REQ-OBJ-005)
    static std::vector<int> getJRCompanys();                        // JR company IDs (id < 0x10000)
    static std::vector<int> getPrefects();                          // Prefecture IDs (id >= 0x10000)
    static std::string companyOrPrefectName(int ident);            // Company/prefecture name lookup
    
    // Note: Storage methods excluded per CLAUDE.md specification:
    // - saveParam, readParam, readParams, saveHistory, appendHistory, isStrageInRoute
    // Reason: These require platform-specific storage implementation
    
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