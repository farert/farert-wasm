#!/bin/bash
# Post-create script for Farert WebAssembly DevContainer
# This script runs after the container is created to set up the development environment

set -e

echo "🚀 Setting up Farert WebAssembly development environment..."

# Ensure Emscripten environment is activated
source /home/vscode/emsdk/emsdk_env.sh

# Verify tools are available
echo "📋 Verifying development tools..."
node --version
npm --version
emcc --version
python3 --version

# Install/update project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create local Emscripten setup script for convenience
echo "🔧 Creating local setup scripts..."
cat > setup_emscripten.sh << 'EOF'
#!/bin/bash
# Auto-setup script for Emscripten environment
export EMSDK="/home/vscode/emsdk"
source "$EMSDK/emsdk_env.sh"
echo "✅ Emscripten environment activated: $(emcc --version | head -1)"
EOF
chmod +x setup_emscripten.sh

# Build WebAssembly module (if Makefile exists)
if [ -f "Makefile" ]; then
    echo "🔨 Building WebAssembly module..."
    make node || echo "⚠️  Build failed - you may need to run 'make node' manually"
fi

# Build TypeScript CLI (if tsconfig exists)
if [ -f "src/cli/tsconfig.json" ] || [ -f "tsconfig.json" ]; then
    echo "📝 Building TypeScript CLI..."
    npm run cli:build || echo "⚠️  TypeScript build failed - you may need to run 'npm run cli:build' manually"
fi

# Display helpful information
echo ""
echo "🎉 DevContainer setup complete!"
echo ""
echo "📚 Quick commands to get started:"
echo "  make node           # Build WebAssembly module"
echo "  npm run cli:build   # Build TypeScript CLI"
echo "  npm run cli:exec    # Run full test suite"
echo "  npm run dev         # Start development server"
echo ""
echo "💡 Useful aliases:"
echo "  build-wasm          # Build WebAssembly (with Emscripten setup)"
echo "  build-cli           # Build TypeScript CLI"
echo "  test-cli            # Run CLI tests"
echo "  emscripten-env      # Activate Emscripten environment"
echo ""
echo "🐳 Happy coding in your containerized environment!"