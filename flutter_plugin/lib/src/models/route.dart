// Copyright (c) 2024 Farert Development Team
// Licensed under GPL-3.0

import 'route_item.dart';
import 'station.dart';

/// Represents a complete railway route with all segments and metadata
///
/// This model encapsulates a journey from origin to destination, including
/// all intermediate transfers and line changes. It provides comprehensive
/// information for fare calculation and route display.
class Route {
  /// Unique identifier for this route instance
  final String id;

  /// List of route segments (each containing line and station information)
  final List<RouteItem> items;

  /// Origin station information
  final Station? origin;

  /// Final destination station information
  final Station? destination;

  /// Total estimated travel time in minutes
  final int? totalMinutes;

  /// Total distance in kilometers
  final double? totalDistance;

  /// Number of transfers required
  final int transferCount;

  /// Route creation timestamp
  final DateTime createdAt;

  /// Whether this route uses long-distance fare rules
  final bool isLongRoute;

  /// Route priority/preference score for ranking multiple routes
  final double? score;

  /// Human-readable route description in Japanese
  final String? description;

  /// Additional route metadata and flags
  final Map<String, dynamic> metadata;

  /// Creates a Route instance
  ///
  /// [id] is required and should be unique for each route.
  /// [items] contains the sequence of route segments.
  /// [transferCount] is calculated automatically if not provided.
  const Route({
    required this.id,
    required this.items,
    this.origin,
    this.destination,
    this.totalMinutes,
    this.totalDistance,
    int? transferCount,
    DateTime? createdAt,
    this.isLongRoute = false,
    this.score,
    this.description,
    this.metadata = const {},
  })  : transferCount = transferCount ?? (items.length > 1 ? items.length - 1 : 0),
        createdAt = createdAt ?? DateTime.now();

  /// Creates a Route from JSON data
  ///
  /// Used for deserializing route data from WebAssembly or storage.
  factory Route.fromJson(Map<String, dynamic> json) {
    return Route(
      id: json['id'] as String,
      items: (json['items'] as List<dynamic>)
          .map((item) => RouteItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      origin: json['origin'] != null
          ? Station.fromJson(json['origin'] as Map<String, dynamic>)
          : null,
      destination: json['destination'] != null
          ? Station.fromJson(json['destination'] as Map<String, dynamic>)
          : null,
      totalMinutes: json['totalMinutes'] as int?,
      totalDistance: json['totalDistance'] as double?,
      transferCount: json['transferCount'] as int?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
      isLongRoute: json['isLongRoute'] as bool? ?? false,
      score: json['score'] as double?,
      description: json['description'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
    );
  }

  /// Converts this Route to JSON
  ///
  /// Used for serialization when caching or sending to platform channels.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'items': items.map((item) => item.toJson()).toList(),
      if (origin != null) 'origin': origin!.toJson(),
      if (destination != null) 'destination': destination!.toJson(),
      if (totalMinutes != null) 'totalMinutes': totalMinutes,
      if (totalDistance != null) 'totalDistance': totalDistance,
      'transferCount': transferCount,
      'createdAt': createdAt.toIso8601String(),
      'isLongRoute': isLongRoute,
      if (score != null) 'score': score,
      if (description != null) 'description': description,
      if (metadata.isNotEmpty) 'metadata': metadata,
    };
  }

  /// Checks if this route is valid for fare calculation
  bool get isValid => items.isNotEmpty && items.first.stationId > 0;

  /// Checks if this route is empty
  bool get isEmpty => items.isEmpty;

  /// Checks if this route has multiple segments (requires transfers)
  bool get hasTransfers => items.length > 1;

  /// Gets all unique line IDs used in this route
  List<int> get lineIds => items.map((item) => item.lineId).toSet().toList();

  /// Gets all station IDs in this route
  List<int> get stationIds => items.map((item) => item.stationId).toList();

  /// Gets the first station ID (origin)
  int? get originStationId => items.isNotEmpty ? items.first.stationId : null;

  /// Gets the last station ID (destination)
  int? get destinationStationId => items.isNotEmpty ? items.last.stationId : null;

  /// Gets transfer stations (stations where line changes occur)
  List<int> get transferStations {
    if (items.length < 2) return [];

    List<int> transfers = [];
    for (int i = 0; i < items.length - 1; i++) {
      if (items[i].lineId != items[i + 1].lineId) {
        // The station where we transfer is the destination of the current segment
        // and the origin of the next segment (they should be the same)
        transfers.add(items[i + 1].stationId);
      }
    }
    return transfers;
  }

  /// Gets estimated travel time formatted as string
  String get formattedTravelTime {
    if (totalMinutes == null) return '不明';
    
    final hours = totalMinutes! ~/ 60;
    final minutes = totalMinutes! % 60;
    
    if (hours > 0) {
      return '${hours}時間${minutes}分';
    } else {
      return '${minutes}分';
    }
  }

  /// Gets formatted distance as string
  String get formattedDistance {
    if (totalDistance == null) return '不明';
    
    if (totalDistance! >= 1.0) {
      return '${totalDistance!.toStringAsFixed(1)}km';
    } else {
      return '${(totalDistance! * 1000).toInt()}m';
    }
  }

  /// Gets a short summary description of the route
  String get summary {
    if (description != null) return description!;
    
    if (isEmpty) return '空のルート';
    
    final originName = origin?.name ?? 'ID:$originStationId';
    final destName = destination?.name ?? 'ID:$destinationStationId';
    
    if (transferCount == 0) {
      return '$originName → $destName (直通)';
    } else {
      return '$originName → $destName ($transferCount回乗換)';
    }
  }

  /// Validates route consistency
  ///
  /// Checks that the route segments connect properly and
  /// that line changes occur at appropriate stations.
  RouteValidationResult validate() {
    if (isEmpty) {
      return RouteValidationResult(
        isValid: false,
        errors: ['ルートが空です'],
      );
    }

    List<String> errors = [];
    List<String> warnings = [];

    // Check for invalid station/line IDs
    for (int i = 0; i < items.length; i++) {
      final item = items[i];
      if (item.stationId <= 0) {
        errors.add('項目${i + 1}: 無効な駅ID (${item.stationId})');
      }
      if (item.lineId <= 0) {
        errors.add('項目${i + 1}: 無効な路線ID (${item.lineId})');
      }
    }

    // Check route connectivity
    for (int i = 0; i < items.length - 1; i++) {
      final current = items[i];
      final next = items[i + 1];
      
      // If different lines, check if there's a valid transfer
      if (current.lineId != next.lineId) {
        // Note: Full validation would require checking if these lines
        // actually connect at this station. For now, we just warn.
        warnings.add('項目${i + 1}から${i + 2}: 路線変更 (${current.lineId} → ${next.lineId})');
      }
    }

    // Check for extremely long routes
    if (items.length > 20) {
      warnings.add('非常に長いルートです (${items.length}セグメント)');
    }

    return RouteValidationResult(
      isValid: errors.isEmpty,
      errors: errors,
      warnings: warnings,
    );
  }

  /// Creates a simplified route with only essential segments
  ///
  /// This can be useful for fare calculation when intermediate
  /// waypoints aren't necessary.
  Route simplify() {
    if (items.length <= 2) return this;

    return copyWith(
      items: [items.first, items.last],
      transferCount: 0,
      description: '${description ?? summary} (簡略化)',
    );
  }

  /// Reverses the route direction
  ///
  /// Creates a new route going from destination back to origin.
  Route reverse() {
    if (isEmpty) return this;

    final reversedItems = items.reversed.map((item) {
      // Note: Reversing a route is complex because we need to
      // adjust the line/station relationships. This is a simplified version.
      return item.copyWith(
        // In a full implementation, we'd need to determine the correct
        // line for the reverse direction
      );
    }).toList();

    return copyWith(
      id: '${id}_reversed',
      items: reversedItems,
      origin: destination,
      destination: origin,
      description: '${summary} (復路)',
      createdAt: DateTime.now(),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! Route) return false;
    return other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'Route(id: $id, items: ${items.length}, transfers: $transferCount, '
        'summary: $summary)';
  }

  /// Creates a copy of this route with modified values
  Route copyWith({
    String? id,
    List<RouteItem>? items,
    Station? origin,
    Station? destination,
    int? totalMinutes,
    double? totalDistance,
    int? transferCount,
    DateTime? createdAt,
    bool? isLongRoute,
    double? score,
    String? description,
    Map<String, dynamic>? metadata,
  }) {
    return Route(
      id: id ?? this.id,
      items: items ?? this.items,
      origin: origin ?? this.origin,
      destination: destination ?? this.destination,
      totalMinutes: totalMinutes ?? this.totalMinutes,
      totalDistance: totalDistance ?? this.totalDistance,
      transferCount: transferCount ?? this.transferCount,
      createdAt: createdAt ?? this.createdAt,
      isLongRoute: isLongRoute ?? this.isLongRoute,
      score: score ?? this.score,
      description: description ?? this.description,
      metadata: metadata ?? this.metadata,
    );
  }
}

/// Result of route validation
class RouteValidationResult {
  final bool isValid;
  final List<String> errors;
  final List<String> warnings;

  const RouteValidationResult({
    required this.isValid,
    this.errors = const [],
    this.warnings = const [],
  });

  bool get hasWarnings => warnings.isNotEmpty;
  bool get hasErrors => errors.isNotEmpty;

  @override
  String toString() {
    final parts = <String>[];
    if (isValid) {
      parts.add('有効');
    } else {
      parts.add('無効');
    }
    
    if (hasErrors) {
      parts.add('エラー: ${errors.length}個');
    }
    
    if (hasWarnings) {
      parts.add('警告: ${warnings.length}個');
    }
    
    return parts.join(', ');
  }
}