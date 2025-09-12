// Copyright (c) 2024 Farert Development Team
// Licensed under GPL-3.0

/// Represents a railway station with all associated metadata
///
/// This model provides a type-safe representation of Japanese railway
/// stations with support for internationalization and accessibility.
class Station {
  /// Unique numeric identifier for this station
  final int id;

  /// Official Japanese station name (e.g., "東京", "新宿")
  final String name;

  /// Hiragana reading for accessibility (e.g., "とうきょう", "しんじゅく")
  final String? kana;

  /// Extended name with disambiguation info (e.g., "東京(JR)")
  final String? nameEx;

  /// Prefecture where this station is located
  final String? prefecture;

  /// List of line IDs serving this station
  final List<int> lines;

  /// Indicates if this station is a major junction
  final bool isJunction;

  /// GPS coordinates if available
  final double? latitude;
  final double? longitude;

  /// Station type (e.g., "普通", "快速停車", "特急停車")
  final String? stationType;

  /// Company or operator information
  final String? operator;

  /// Creates a Station instance
  ///
  /// [id] is required and must be a positive integer.
  /// [name] is required and should be the official Japanese station name.
  /// All other parameters are optional but recommended for complete functionality.
  const Station({
    required this.id,
    required this.name,
    this.kana,
    this.nameEx,
    this.prefecture,
    this.lines = const [],
    this.isJunction = false,
    this.latitude,
    this.longitude,
    this.stationType,
    this.operator,
  });

  /// Creates a Station from JSON data
  ///
  /// This is used for deserializing station data from the WebAssembly layer
  /// or from cached/stored data.
  factory Station.fromJson(Map<String, dynamic> json) {
    return Station(
      id: json['id'] as int,
      name: json['name'] as String,
      kana: json['kana'] as String?,
      nameEx: json['nameEx'] as String?,
      prefecture: json['prefecture'] as String?,
      lines: (json['lines'] as List<dynamic>?)
              ?.map((e) => e as int)
              .toList() ??
          [],
      isJunction: json['isJunction'] as bool? ?? false,
      latitude: json['latitude'] as double?,
      longitude: json['longitude'] as double?,
      stationType: json['stationType'] as String?,
      operator: json['operator'] as String?,
    );
  }

  /// Converts this Station to JSON
  ///
  /// Used for serialization when caching data or sending to platform channels.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (kana != null) 'kana': kana,
      if (nameEx != null) 'nameEx': nameEx,
      if (prefecture != null) 'prefecture': prefecture,
      'lines': lines,
      'isJunction': isJunction,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (stationType != null) 'stationType': stationType,
      if (operator != null) 'operator': operator,
    };
  }

  /// Display name for UI purposes
  ///
  /// Returns [nameEx] if available, otherwise [name].
  /// This provides the most descriptive name for user interfaces.
  String get displayName => nameEx ?? name;

  /// Search-friendly text including name and kana
  ///
  /// Used for fuzzy matching and search functionality.
  String get searchText => '$name${kana != null ? ' $kana' : ''}';

  /// Indicates if this station has GPS coordinates
  bool get hasCoordinates => latitude != null && longitude != null;

  /// Calculates distance to another station (if both have coordinates)
  ///
  /// Returns distance in kilometers, or null if either station
  /// lacks coordinate information.
  double? distanceTo(Station other) {
    if (!hasCoordinates || !other.hasCoordinates) return null;

    const double earthRadius = 6371; // km
    final double lat1Rad = latitude! * (3.14159 / 180);
    final double lat2Rad = other.latitude! * (3.14159 / 180);
    final double deltaLatRad = (other.latitude! - latitude!) * (3.14159 / 180);
    final double deltaLngRad = (other.longitude! - longitude!) * (3.14159 / 180);

    final double a = (deltaLatRad / 2).sin() * (deltaLatRad / 2).sin() +
        lat1Rad.cos() *
            lat2Rad.cos() *
            (deltaLngRad / 2).sin() *
            (deltaLngRad / 2).sin();
    final double c = 2 * a.sqrt().asin();

    return earthRadius * c;
  }

  /// Checks if this station is served by a specific line
  bool isServedBy(int lineId) => lines.contains(lineId);

  /// Checks if this station shares any lines with another station
  bool sharesLineWith(Station other) =>
      lines.any((lineId) => other.lines.contains(lineId));

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! Station) return false;
    return other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'Station(id: $id, name: $name, kana: $kana, prefecture: $prefecture, '
        'lines: ${lines.length}, isJunction: $isJunction)';
  }

  /// Creates a copy of this station with modified values
  Station copyWith({
    int? id,
    String? name,
    String? kana,
    String? nameEx,
    String? prefecture,
    List<int>? lines,
    bool? isJunction,
    double? latitude,
    double? longitude,
    String? stationType,
    String? operator,
  }) {
    return Station(
      id: id ?? this.id,
      name: name ?? this.name,
      kana: kana ?? this.kana,
      nameEx: nameEx ?? this.nameEx,
      prefecture: prefecture ?? this.prefecture,
      lines: lines ?? this.lines,
      isJunction: isJunction ?? this.isJunction,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      stationType: stationType ?? this.stationType,
      operator: operator ?? this.operator,
    );
  }
}

/// Extension methods for working with lists of stations
extension StationListExtensions on List<Station> {
  /// Find station by ID
  Station? findById(int id) {
    try {
      return firstWhere((station) => station.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Find stations by name (exact match)
  List<Station> findByName(String name) {
    return where((station) => station.name == name).toList();
  }

  /// Search stations by partial name or kana
  List<Station> search(String query) {
    final lowerQuery = query.toLowerCase();
    return where((station) {
      return station.name.toLowerCase().contains(lowerQuery) ||
          (station.kana?.toLowerCase().contains(lowerQuery) ?? false) ||
          (station.nameEx?.toLowerCase().contains(lowerQuery) ?? false);
    }).toList();
  }

  /// Filter stations by prefecture
  List<Station> inPrefecture(String prefecture) {
    return where((station) => station.prefecture == prefecture).toList();
  }

  /// Filter junction stations only
  List<Station> get junctions {
    return where((station) => station.isJunction).toList();
  }

  /// Filter stations served by a specific line
  List<Station> onLine(int lineId) {
    return where((station) => station.isServedBy(lineId)).toList();
  }

  /// Sort stations by name (Japanese alphabetical order)
  List<Station> sortByName() {
    final sorted = List<Station>.from(this);
    sorted.sort((a, b) => a.name.compareTo(b.name));
    return sorted;
  }

  /// Sort stations by distance from a reference point
  List<Station> sortByDistanceFrom(double latitude, double longitude) {
    final sorted = List<Station>.from(this);
    sorted.sort((a, b) {
      final distA = a.hasCoordinates
          ? _calculateDistance(latitude, longitude, a.latitude!, a.longitude!)
          : double.infinity;
      final distB = b.hasCoordinates
          ? _calculateDistance(latitude, longitude, b.latitude!, b.longitude!)
          : double.infinity;
      return distA.compareTo(distB);
    });
    return sorted;
  }

  /// Helper method for distance calculation
  static double _calculateDistance(
      double lat1, double lng1, double lat2, double lng2) {
    const double earthRadius = 6371;
    final double lat1Rad = lat1 * (3.14159 / 180);
    final double lat2Rad = lat2 * (3.14159 / 180);
    final double deltaLatRad = (lat2 - lat1) * (3.14159 / 180);
    final double deltaLngRad = (lng2 - lng1) * (3.14159 / 180);

    final double a = (deltaLatRad / 2).sin() * (deltaLatRad / 2).sin() +
        lat1Rad.cos() *
            lat2Rad.cos() *
            (deltaLngRad / 2).sin() *
            (deltaLngRad / 2).sin();
    final double c = 2 * a.sqrt().asin();

    return earthRadius * c;
  }
}