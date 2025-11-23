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
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3")

# Define platform for conditional compilation
add_compile_definitions(
    __EMSCRIPTEN__
    EMSCRIPTEN_BUILD
    UNIX
)

# Source files
set(FARERT_SOURCES
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
)

# SQLite3 linking
target_link_libraries(farert
    sqlite3
)

# Emscripten-specific settings
set_target_properties(farert PROPERTIES
    SUFFIX ".js"
    OUTPUT_NAME "farert"
)

# Emscripten link flags
target_link_options(farert PRIVATE
    -lembind
    -s WASM=1
    -s MODULARIZE=1
    -s EXPORT_ES6=1
    -s EXPORT_NAME=createFaretModule
    -s ALLOW_MEMORY_GROWTH=1
    -s INITIAL_MEMORY=33554432
    -s MAXIMUM_MEMORY=2147483648
    --bind
    --preload-file ${CMAKE_SOURCE_DIR}/src/assets/jrdbNewest.db@/data/jrdbNewest.db
    -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap']
    -s ENVIRONMENT=web,worker
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
