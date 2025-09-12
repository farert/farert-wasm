// Copyright (c) 2024 Farert Development Team
// Licensed under GPL-3.0

import 'package:plugin_platform_interface/plugin_platform_interface.dart';
import 'farert_wasm_method_channel.dart';
import 'models/station.dart';
import 'models/route.dart';
import 'models/fare_info.dart';

/// The interface that implementations of farert_wasm must implement.
///
/// Platform implementations should extend this class rather than implement it
/// as `FarertWasm` does not consider newly added methods to be breaking changes.
/// Extending this class (using `extends`) ensures that the subclass will get the
/// default implementation, while platform implementations that `implements` this
/// interface will be broken by newly added [FarertWasmPlatform] methods.
abstract class FarertWasmPlatform extends PlatformInterface {
  /// Constructs a FarertWasmPlatform.
  FarertWasmPlatform() : super(token: _token);

  static final Object _token = Object();

  static FarertWasmPlatform _instance = MethodChannelFarertWasm();

  /// The default instance of [FarertWasmPlatform] to use.
  ///
  /// Defaults to [MethodChannelFarertWasm].
  static FarertWasmPlatform get instance => _instance;

  /// Platform-specific implementations should set this with their own
  /// platform-specific class that extends [FarertWasmPlatform] when
  /// they register themselves.
  static set instance(FarertWasmPlatform instance) {
    PlatformInterface.verifyToken(instance, _token);
    _instance = instance;
  }

  /// Initialize the WebAssembly module
  ///
  /// [wasmPath] Optional path to the WebAssembly file. If null, uses default.
  /// [enableLogging] Enable debug logging for troubleshooting.
  /// 
  /// Returns true if initialization was successful.
  Future<bool> initialize({
    String? wasmPath,
    bool enableLogging = false,
  }) {
    throw UnimplementedError('initialize() has not been implemented.');
  }

  /// Dispose and clean up all resources
  Future<void> dispose() {
    throw UnimplementedError('dispose() has not been implemented.');
  }

  /// Get platform version for debugging
  Future<String?> getPlatformVersion() {
    throw UnimplementedError('getPlatformVersion() has not been implemented.');
  }

  /// Get WebAssembly module status
  Future<Map<String, dynamic>> getModuleStatus() {
    throw UnimplementedError('getModuleStatus() has not been implemented.');
  }

  // ===============================
  // Station API Methods
  // ===============================

  /// Get station ID from Japanese name
  ///
  /// [stationName] Japanese station name (e.g., "東京", "新宿")
  /// Returns station ID or -1 if not found
  Future<int> getStationId(String stationName) {
    throw UnimplementedError('getStationId() has not been implemented.');
  }

  /// Get station name from ID
  ///
  /// [stationId] Numeric station ID
  /// Returns Japanese station name or null if not found
  Future<String?> getStationName(int stationId) {
    throw UnimplementedError('getStationName() has not been implemented.');
  }

  /// Get extended station name with additional info
  ///
  /// [stationId] Numeric station ID  
  /// Returns extended name with disambiguation info
  Future<String?> getStationNameEx(int stationId) {
    throw UnimplementedError('getStationNameEx() has not been implemented.');
  }

  /// Get station reading in hiragana
  ///
  /// [stationId] Numeric station ID
  /// Returns hiragana reading for accessibility
  Future<String?> getStationKana(int stationId) {
    throw UnimplementedError('getStationKana() has not been implemented.');
  }

  /// Get station prefecture information
  ///
  /// [stationId] Numeric station ID
  /// Returns prefecture name or null
  Future<String?> getStationPrefecture(int stationId) {
    throw UnimplementedError('getStationPrefecture() has not been implemented.');
  }

  /// Search stations by name with fuzzy matching
  ///
  /// [query] Search query (supports partial matching)
  /// [limit] Maximum number of results (default: 10)
  /// Returns list of matching stations
  Future<List<Station>> searchStations(String query, {int limit = 10}) {
    throw UnimplementedError('searchStations() has not been implemented.');
  }

  /// Get all lines serving a station
  ///
  /// [stationId] Numeric station ID
  /// Returns list of line IDs serving this station
  Future<List<int>> getStationLines(int stationId) {
    throw UnimplementedError('getStationLines() has not been implemented.');
  }

  // ===============================
  // Line API Methods  
  // ===============================

  /// Get line name from ID
  ///
  /// [lineId] Numeric line ID
  /// Returns Japanese line name
  Future<String?> getLineName(int lineId) {
    throw UnimplementedError('getLineName() has not been implemented.');
  }

  /// Get all stations on a line
  ///
  /// [lineId] Numeric line ID
  /// Returns ordered list of station IDs on the line
  Future<List<int>> getLineStations(int lineId) {
    throw UnimplementedError('getLineStations() has not been implemented.');
  }

  /// Get lines by company or prefecture
  ///
  /// [companyOrPrefectId] Company/prefecture identifier
  /// Returns list of line IDs for the organization
  Future<List<int>> getLinesByCompany(int companyOrPrefectId) {
    throw UnimplementedError('getLinesByCompany() has not been implemented.');
  }

  /// Get junction stations for route planning
  ///
  /// [lineId] Line to search for junctions
  /// [stationId] Starting station
  /// Returns list of junction station IDs
  Future<List<int>> getJunctionStations(int lineId, int stationId) {
    throw UnimplementedError('getJunctionStations() has not been implemented.');
  }

  // ===============================
  // Route Building API Methods
  // ===============================

  /// Create a new empty route
  ///
  /// Returns unique route handle for subsequent operations
  Future<String> createRoute() {
    throw UnimplementedError('createRoute() has not been implemented.');
  }

  /// Set the starting station for route building
  ///
  /// [routeHandle] Route identifier from createRoute()
  /// [stationId] Starting station ID
  /// Returns 0 on success, error code on failure
  Future<int> addRouteBegin(String routeHandle, int stationId) {
    throw UnimplementedError('addRouteBegin() has not been implemented.');
  }

  /// Add a route segment (line + destination station)
  ///
  /// [routeHandle] Route identifier
  /// [lineId] Line to travel on
  /// [stationId] Destination station on that line
  /// Returns 0 on success, error code on failure  
  Future<int> addRoute(String routeHandle, int lineId, int stationId) {
    throw UnimplementedError('addRoute() has not been implemented.');
  }

  /// Get current route as structured data
  ///
  /// [routeHandle] Route identifier
  /// Returns route information with all segments
  Future<Route?> getRoute(String routeHandle) {
    throw UnimplementedError('getRoute() has not been implemented.');
  }

  /// Get route count (number of segments)
  ///
  /// [routeHandle] Route identifier
  /// Returns number of route segments
  Future<int> getRouteCount(String routeHandle) {
    throw UnimplementedError('getRouteCount() has not been implemented.');
  }

  /// Generate human-readable route description
  ///
  /// [routeHandle] Route identifier
  /// Returns Japanese route description
  Future<String> getRouteScript(String routeHandle) {
    throw UnimplementedError('getRouteScript() has not been implemented.');
  }

  /// Setup route from string description
  ///
  /// [routeHandle] Route identifier
  /// [routeString] Route in format "駅1 路線1 駅2 路線2 駅3"
  /// Returns 0 on success, error code on failure
  Future<int> setupRoute(String routeHandle, String routeString) {
    throw UnimplementedError('setupRoute() has not been implemented.');
  }

  // ===============================
  // Fare Calculation API Methods
  // ===============================

  /// Calculate fare for the current route
  ///
  /// [routeHandle] Route identifier with complete path
  /// Returns detailed fare information
  Future<FareInfo?> calculateFare(String routeHandle) {
    throw UnimplementedError('calculateFare() has not been implemented.');
  }

  /// Get formatted fare string for display
  ///
  /// [routeHandle] Route identifier
  /// Returns formatted fare text in Japanese
  Future<String> getFareString(String routeHandle) {
    throw UnimplementedError('getFareString() has not been implemented.');
  }

  /// Get fare info as JSON for complex processing
  ///
  /// [routeHandle] Route identifier
  /// Returns complete fare details as JSON string
  Future<String> getFareInfoJson(String routeHandle) {
    throw UnimplementedError('getFareInfoJson() has not been implemented.');
  }

  /// Set long route calculation mode
  ///
  /// [routeHandle] Route identifier
  /// [enabled] Enable long-distance fare rules
  Future<void> setLongRoute(String routeHandle, bool enabled) {
    throw UnimplementedError('setLongRoute() has not been implemented.');
  }

  /// Show formatted fare display
  ///
  /// [routeHandle] Route identifier
  /// Returns formatted fare information for UI display
  Future<String> showFare(String routeHandle) {
    throw UnimplementedError('showFare() has not been implemented.');
  }

  // ===============================
  // Utility API Methods
  // ===============================

  /// Get JR company IDs
  ///
  /// Returns list of JR company identifiers (id < 0x10000)
  Future<List<int>> getJRCompanies() {
    throw UnimplementedError('getJRCompanies() has not been implemented.');
  }

  /// Get prefecture IDs
  ///
  /// Returns list of prefecture identifiers (id >= 0x10000)
  Future<List<int>> getPrefectures() {
    throw UnimplementedError('getPrefectures() has not been implemented.');
  }

  /// Get company or prefecture name
  ///
  /// [id] Company or prefecture identifier
  /// Returns organization name in Japanese
  Future<String?> getCompanyOrPrefectName(int id) {
    throw UnimplementedError('getCompanyOrPrefectName() has not been implemented.');
  }

  /// Get company and prefects data as JSON
  ///
  /// Returns complete reference data for UI building
  Future<String> getCompanyAndPrefectsAsJson() {
    throw UnimplementedError('getCompanyAndPrefectsAsJson() has not been implemented.');
  }

  /// Check if station is a junction
  ///
  /// [stationId] Station to check
  /// Returns true if station connects multiple lines
  Future<bool> isJunction(int stationId) {
    throw UnimplementedError('isJunction() has not been implemented.');
  }

  /// Check if station is a specific junction for a line
  ///
  /// [lineId] Line to check
  /// [stationId] Station to check  
  /// Returns true if station is a junction for this line
  Future<bool> isSpecificJunction(int lineId, int stationId) {
    throw UnimplementedError('isSpecificJunction() has not been implemented.');
  }

  /// Get terminal station name
  ///
  /// [id] Terminal identifier
  /// Returns terminal station name
  Future<String?> getTerminalName(int id) {
    throw UnimplementedError('getTerminalName() has not been implemented.');
  }

  /// Clean up specific route handle
  ///
  /// [routeHandle] Route to clean up
  Future<void> disposeRoute(String routeHandle) {
    throw UnimplementedError('disposeRoute() has not been implemented.');
  }
}