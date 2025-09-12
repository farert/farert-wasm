// Copyright (c) 2024 Farert Development Team
// Licensed under GPL-3.0

/// Japanese Railway Fare Calculation WebAssembly plugin for Flutter
/// 
/// High-performance C++ engine compiled to WebAssembly with comprehensive
/// Dart bindings for seamless Flutter integration.
/// 
/// Features:
/// - 39+ WebAssembly APIs for complete fare calculation
/// - Object-oriented design with inheritance support
/// - Memory management with automatic cleanup
/// - Cross-platform support (Android, iOS, Web, Desktop)
/// - Type-safe Dart bindings with comprehensive error handling
/// - Japanese text optimization and Unicode normalization
library farert_wasm;

export 'src/farert_wasm_platform_interface.dart';
export 'src/farert_wasm_method_channel.dart';
export 'src/farert_wasm_web.dart';

export 'src/models/station.dart';
export 'src/models/route.dart';
export 'src/models/fare_info.dart';
export 'src/models/route_item.dart';

export 'src/api/farert_api.dart';
export 'src/api/route_api.dart';
export 'src/api/station_api.dart';
export 'src/api/fare_calculator.dart';

export 'src/widgets/fare_calculator_widget.dart';
export 'src/widgets/station_search_widget.dart';
export 'src/widgets/route_display_widget.dart';

export 'src/utils/japanese_text_utils.dart';
export 'src/utils/memory_manager.dart';
export 'src/utils/error_handler.dart';
export 'src/utils/logger.dart';

export 'src/exceptions/farert_exceptions.dart';