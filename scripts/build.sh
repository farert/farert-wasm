#!/bin/bash
# Build script for FARERT WASM project
# Compiles C++ to WebAssembly using Emscripten

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/build"
EMSDK_PATH="${EMSDK_PATH:-$PROJECT_ROOT/../emsdk}"
EM_CACHE_DIR="$PROJECT_ROOT/.emscripten_cache"

echo -e "${GREEN}=== FARERT WASM Build Script ===${NC}\n"

# Check for Emscripten SDK
if [ ! -d "$EMSDK_PATH" ]; then
    echo -e "${RED}ERROR: Emscripten SDK not found at $EMSDK_PATH${NC}"
    echo -e "${YELLOW}Please install Emscripten SDK:${NC}"
    echo -e "  git clone https://github.com/emscripten-core/emsdk.git ../emsdk"
    echo -e "  cd ../emsdk"
    echo -e "  ./emsdk install latest"
    echo -e "  ./emsdk activate latest"
    exit 1
fi

# Activate Emscripten
echo -e "${BLUE}[1/5] Activating Emscripten SDK...${NC}"
source "$EMSDK_PATH/emsdk_env.sh"
mkdir -p "$EM_CACHE_DIR"
export EM_CACHE="$EM_CACHE_DIR"

# Check if emcmake is available
if ! command -v emcmake &> /dev/null; then
    echo -e "${RED}ERROR: emcmake not found. Please activate Emscripten.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Emscripten SDK activated${NC}\n"

# Clean and create build directory
echo -e "${BLUE}[2/5] Preparing build directory...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$PROJECT_ROOT/dist"
echo -e "${GREEN}✓ Build directory ready${NC}\n"

# Configure with CMake
echo -e "${BLUE}[3/5] Configuring with CMake...${NC}"
cd "$BUILD_DIR"
emcmake cmake .. || {
    echo -e "${RED}ERROR: CMake configuration failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ CMake configuration complete${NC}\n"

# Build
echo -e "${BLUE}[4/5] Building WASM module...${NC}"
emmake make -j$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4) || {
    echo -e "${RED}ERROR: Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✓ Build complete${NC}\n"

# Copy artifacts to dist
echo -e "${BLUE}[5/5] Copying artifacts to dist/...${NC}"
cp farert.js "$PROJECT_ROOT/dist/" 2>/dev/null || echo -e "${YELLOW}Warning: farert.js not found${NC}"
cp farert.wasm "$PROJECT_ROOT/dist/" 2>/dev/null || echo -e "${YELLOW}Warning: farert.wasm not found${NC}"
cp farert.data "$PROJECT_ROOT/dist/" 2>/dev/null || echo -e "${YELLOW}Warning: farert.data not found${NC}"

# Strip the build machine's absolute path that emcc embeds as the .data
# package name (PACKAGE_NAME / run-dependency ids). dist/farert.js is
# published as-is, so local paths must not leak into it. Runtime fetching
# uses REMOTE_PACKAGE_BASE ("farert.data"), so this is metadata-only.
perl -i -pe "s|\Q$PROJECT_ROOT/dist/\E||g" "$PROJECT_ROOT/dist/farert.js"
if grep -q "$PROJECT_ROOT" "$PROJECT_ROOT/dist/farert.js"; then
    echo -e "${RED}ERROR: local absolute path still present in dist/farert.js${NC}"
    exit 1
fi

# List generated files
echo -e "\n${GREEN}=== Build artifacts ===${NC}"
ls -lh "$PROJECT_ROOT/dist/"

echo -e "\n${GREEN}=== Build successful! ===${NC}"
echo -e "${YELLOW}Output files:${NC}"
echo -e "  - dist/farert.js     (Emscripten glue code)"
echo -e "  - dist/farert.wasm   (WebAssembly binary)"
echo -e "  - dist/farert.data   (Embedded database)"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "  - Run 'npm run build:ts' to compile TypeScript"
echo -e "  - Run 'npm test' to run tests"
