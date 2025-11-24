cmake_minimum_required(VERSION 3.20)
project(farert-wasm)

# Emscripten toolchain required
if(NOT EMSCRIPTEN)
    message(FATAL_ERROR "This project requires Emscripten. Please use emcmake.")
endif()

# C++20 Standard
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimization flags
# -fno-char8_t: Disable char8_t to keep u8"" as const char* for compatibility
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -fno-char8_t")

# SQLite3 compile flags (for bundled sqlite3.c)
set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -DSQLITE_OMIT_LOAD_EXTENSION -DSQLITE_ENABLE_FTS5")

# Define platform for conditional compilation
add_compile_definitions(
    __EMSCRIPTEN__
    EMSCRIPTEN_BUILD
    UNIX
)

# Source files
set(FARERT_SOURCES
    src/cpp/core/sqlite3.c
    src/cpp/core/db.cpp
    src/cpp/core/alpdb.cpp
    src/cpp/core/azusa.cpp
    src/cpp/bindings/wasm_bindings.cpp
)

# Create executable (will be WASM)
add_executable(farert ${FARERT_SOURCES})

# Include directories
target_include_directories(farert PRIVATE
    ${CMAKE_SOURCE_DIR}/src/cpp/core
    ${CMAKE_SOURCE_DIR}/src/cpp/bindings
    ${CMAKE_SOURCE_DIR}/src/cpp/stubs
)

# No external SQLite3 library needed - using bundled sqlite3.c

# Emscripten-specific settings
set_target_properties(farert PROPERTIES
    SUFFIX ".js"
    OUTPUT_NAME "farert"
)

# Emscripten link flags
target_link_options(farert PRIVATE
    -lembind
    -sWASM=1
    -sMODULARIZE=1
    -sEXPORT_ES6=1
    -sEXPORT_NAME=createFaretModule
    -sALLOW_MEMORY_GROWTH=1
    -sINITIAL_MEMORY=33554432
    -sMAXIMUM_MEMORY=2147483648
    --bind
    --preload-file ${CMAKE_SOURCE_DIR}/src/assets/jrdbNewest.db@/data/jrdbNewest.db
    -sEXPORTED_RUNTIME_METHODS=['ccall','cwrap']
    -sENVIRONMENT=web,worker
)

# Output to dist directory
set_target_properties(farert PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY "${CMAKE_SOURCE_DIR}/dist"
)

# Install rules
install(TARGETS farert
    RUNTIME DESTINATION ${CMAKE_SOURCE_DIR}/dist
)

# Copy .wasm and .data files to dist
install(FILES
    "${CMAKE_BINARY_DIR}/farert.wasm"
    "${CMAKE_BINARY_DIR}/farert.data"
    DESTINATION ${CMAKE_SOURCE_DIR}/dist
    OPTIONAL
)
