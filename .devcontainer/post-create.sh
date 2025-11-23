#!/bin/bash
# Post-create script for DevContainer

set -e

echo "=== FARERT WASM DevContainer Post-Create Setup ==="

# Activate Emscripten
if [ -d "/emsdk" ]; then
    echo "Activating Emscripten SDK..."
    source /emsdk/emsdk_env.sh

    # Add to bashrc
    echo 'source /emsdk/emsdk_env.sh' >> ~/.bashrc
fi

# Install npm dependencies
if [ -f "package.json" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Make scripts executable
if [ -d "scripts" ]; then
    echo "Making scripts executable..."
    chmod +x scripts/*.sh
fi

echo "=== Setup complete! ==="
echo ""
echo "You can now:"
echo "  - Run 'npm run build' to build the project"
echo "  - Run 'npm test' to run tests"
echo ""
