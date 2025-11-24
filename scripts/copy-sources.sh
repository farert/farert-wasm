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

# Copy sqlite3.* (bundled SQLite3)
echo -e "\n${GREEN}[1/7] Copying sqlite3.c, sqlite3.h, and sqlite3ext.h (bundled SQLite3)${NC}"
copy_file "$FARERT_ROOT/app/win_mfc/fjr_mfc/lib/db/sqlite3.c" "$PROJECT_ROOT/src/cpp/core/sqlite3.c"
copy_file "$FARERT_ROOT/app/win_mfc/fjr_mfc/lib/db/sqlite3.h" "$PROJECT_ROOT/src/cpp/core/sqlite3.h"
copy_file "$FARERT_ROOT/app/win_mfc/fjr_mfc/lib/db/sqlite3ext.h" "$PROJECT_ROOT/src/cpp/core/sqlite3ext.h"

# Copy db.* (no modifications)
echo -e "\n${GREEN}[2/7] Copying db.cpp and db.h (no modifications)${NC}"
copy_file "$FARERT_ROOT/app/win_mfc/fjr_mfc/lib/db/db.cpp" "$PROJECT_ROOT/src/cpp/core/db.cpp"
copy_file "$FARERT_ROOT/app/win_mfc/fjr_mfc/lib/db/db.h" "$PROJECT_ROOT/src/cpp/core/db.h"

# Copy alpdb.* (no modifications)
echo -e "\n${GREEN}[3/7] Copying alpdb.cpp and alpdb.h (no modifications)${NC}"
copy_file "$FARERT_ROOT/app/alps/alpdb.cpp" "$PROJECT_ROOT/src/cpp/core/alpdb.cpp"
copy_file "$FARERT_ROOT/app/alps/alpdb.h" "$PROJECT_ROOT/src/cpp/core/alpdb.h"

# Copy azusa.* (may need modifications)
echo -e "\n${GREEN}[4/7] Copying azusa.cpp and azusa.h (may need modifications)${NC}"
copy_file "$FARERT_ROOT/app/alps/azusa.cpp" "$PROJECT_ROOT/src/cpp/core/azusa.cpp"
copy_file "$FARERT_ROOT/app/alps/azusa.h" "$PROJECT_ROOT/src/cpp/core/azusa.h"

# Copy test files
echo -e "\n${GREEN}[5/7] Copying test files${NC}"
if [ -f "$FARERT_ROOT/test/unix/all/test_azusa.cpp" ]; then
    copy_file "$FARERT_ROOT/test/unix/all/test_azusa.cpp" "$PROJECT_ROOT/tests/cpp/test_azusa.cpp"
else
    echo -e "${YELLOW}WARNING: test_azusa.cpp not found, skipping${NC}"
fi

# Copy documentation
echo -e "\n${GREEN}[6/7] Copying documentation${NC}"
if [ -f "$FARERT_ROOT/test/unix/all/README_test_azusa.md" ]; then
    copy_file "$FARERT_ROOT/test/unix/all/README_test_azusa.md" "$PROJECT_ROOT/docs/test_azusa.md"
else
    echo -e "${YELLOW}WARNING: README_test_azusa.md not found, skipping${NC}"
fi

# Copy database
echo -e "\n${GREEN}[7/7] Copying database file${NC}"
if [ -f "$FARERT_ROOT/db/jrdbNewest.db" ]; then
    copy_file "$FARERT_ROOT/db/jrdbNewest.db" "$PROJECT_ROOT/src/assets/jrdbNewest.db"
else
    echo -e "${YELLOW}WARNING: jrdbNewest.db not found, skipping${NC}"
fi

echo -e "\n${GREEN}=== Source files copied successfully ===${NC}"
echo -e "${YELLOW}Files copied:${NC}"
echo -e "  - sqlite3.c, sqlite3.h, sqlite3ext.h (bundled SQLite3)"
echo -e "  - db.cpp, db.h (DO NOT MODIFY)"
echo -e "  - alpdb.cpp, alpdb.h (DO NOT MODIFY)"
echo -e "  - azusa.cpp, azusa.h (can be adjusted for WASM)"
echo -e "  - test files and documentation"
echo -e "  - jrdbNewest.db (database)"
