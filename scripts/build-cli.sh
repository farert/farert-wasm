#!/bin/bash

# Build script for Farert CLI tool
# Builds both WebAssembly and TypeScript CLI components

set -e  # Exit on any error

echo "🚄 Building Farert CLI Tool"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build WebAssembly module
echo "📦 Step 1: Building WebAssembly module..."
if [ -f "setup_env.sh" ]; then
    source setup_env.sh && make
else
    echo "⚠️  setup_env.sh not found, trying direct make..."
    make
fi

# Check if WASM files were created
if [ ! -f "dist/farert.wasm" ] || [ ! -f "dist/farert.js" ]; then
    echo "❌ WebAssembly build failed - dist files not found"
    exit 1
fi

echo "✅ WebAssembly build completed"

# Step 2: Install Node.js dependencies if needed
echo "📦 Step 2: Installing Node.js dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Node.js dependencies already installed"
fi

# Step 3: Build TypeScript CLI
echo "📦 Step 3: Building TypeScript CLI..."
npx tsc

# Check if CLI was compiled
if [ ! -f "dist/cli/cli/main.js" ]; then
    echo "❌ TypeScript CLI build failed"
    exit 1
fi

echo "✅ TypeScript CLI build completed"

# Step 4: Make CLI executable
echo "🔧 Step 4: Setting up CLI executable..."
chmod +x dist/cli/cli/main.js

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "Usage:"
echo "  npm run cli:exec     # Run test suite"
echo "  npm run cli -- info  # Show system info"
echo "  npm run cli -- --help # Show help"
echo ""
echo "Or run directly:"
echo "  node dist/cli/cli/main.js --exec"
echo ""