#!/bin/bash
# Script to copy source files from ../farert to farert-wasm

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FARERT_ROOT="$PROJECT_ROOT/../farert"

echo -e "${GREEN}=== Copying source files from farert ===${NC}"

# Check if farert directory exists
if [ ! -d "$FARERT_ROOT" ]; then
    echo -e "${RED}ERROR: farert directory not found at $FARERT_ROOT${NC}"
    exit 1
fi

# Function to copy file
copy_file() {
    local src="$1"
    local dest="$2"

    if [ ! -f "$src" ]; then
        echo -e "${RED}ERROR: Source file not found: $src${NC}"
        return 1
    fi

    echo -e "${YELLOW}Copying: $(basename $src) -> $dest${NC}"
    cp "$src" "$dest"
    echo -e "${GREEN}✓ Copied: $(basename $src)${NC}"
}

# Copy db.* (no modifications)
echo -e "\n${GREEN}[1/6] Copying db.cpp and db.h (no modifications)${NC}"
copy_file "$FARERT_ROOT/app/win_mfc/fjr_mfc/lib/db/db.cpp" "$PROJECT_ROOT/src/cpp/core/db.cpp"
copy_file "$FARERT_ROOT/app/win_mfc/fjr_mfc/lib/db/db.h" "$PROJECT_ROOT/src/cpp/core/db.h"

# Copy alpdb.* (no modifications)
echo -e "\n${GREEN}[2/6] Copying alpdb.cpp and alpdb.h (no modifications)${NC}"
copy_file "$FARERT_ROOT/app/alps/alpdb.cpp" "$PROJECT_ROOT/src/cpp/core/alpdb.cpp"
copy_file "$FARERT_ROOT/app/alps/alpdb.h" "$PROJECT_ROOT/src/cpp/core/alpdb.h"

# Copy azusa.* (may need modifications)
echo -e "\n${GREEN}[3/6] Copying azusa.cpp and azusa.h (may need modifications)${NC}"
copy_file "$FARERT_ROOT/app/alps/azusa.cpp" "$PROJECT_ROOT/src/cpp/core/azusa.cpp"
copy_file "$FARERT_ROOT/app/alps/azusa.h" "$PROJECT_ROOT/src/cpp/core/azusa.h"

# Copy test files
echo -e "\n${GREEN}[4/6] Copying test files${NC}"
if [ -f "$FARERT_ROOT/test/unix/all/test_azusa.cpp" ]; then
    copy_file "$FARERT_ROOT/test/unix/all/test_azusa.cpp" "$PROJECT_ROOT/tests/cpp/test_azusa.cpp"
else
    echo -e "${YELLOW}WARNING: test_azusa.cpp not found, skipping${NC}"
fi

# Copy documentation
echo -e "\n${GREEN}[5/6] Copying documentation${NC}"
if [ -f "$FARERT_ROOT/test/unix/all/README_test_azusa.md" ]; then
    copy_file "$FARERT_ROOT/test/unix/all/README_test_azusa.md" "$PROJECT_ROOT/docs/test_azusa.md"
else
    echo -e "${YELLOW}WARNING: README_test_azusa.md not found, skipping${NC}"
fi

# Copy database
echo -e "\n${GREEN}[6/6] Copying database file${NC}"
if [ -f "$FARERT_ROOT/db/jrdbNewest.db" ]; then
    copy_file "$FARERT_ROOT/db/jrdbNewest.db" "$PROJECT_ROOT/src/assets/jrdbNewest.db"
else
    echo -e "${YELLOW}WARNING: jrdbNewest.db not found, skipping${NC}"
fi

echo -e "\n${GREEN}=== Source files copied successfully ===${NC}"
echo -e "${YELLOW}Note: db.cpp, db.h, alpdb.cpp, alpdb.h were copied WITHOUT modifications${NC}"
echo -e "${YELLOW}Note: azusa.cpp and azusa.h may need WASM-specific adjustments${NC}"
