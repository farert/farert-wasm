# C/C++ WebAssembly Project

A simple C/C++ WebAssembly development environment using Emscripten.

## Project Structure

```
farert-wasm/
├── src/
│   └── main.c          # C source code with exported functions
├── build/              # Build artifacts (created during build)
├── dist/               # Output WASM files (created during build)
├── index.html          # Test page with interactive demos
├── Makefile            # Build configuration
├── package.json        # NPM scripts
└── README.md           # This file
```

## Prerequisites

Emscripten SDK is installed at `~/priv/farert.repos/emsdk/`

## Setup

1. **Activate Emscripten environment:**
   ```bash
   source ~/priv/farert.repos/emsdk/emsdk_env.sh
   ```

2. **Build the project:**
   ```bash
   make
   # or
   npm run build
   ```

3. **Start development server:**
   ```bash
   make serve
   # or
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:8080` to test the WASM functions

## Available Functions

The C code exports the following functions to WebAssembly:

- `add(a, b)` - Add two integers
- `multiply(a, b)` - Multiply two integers  
- `hello_world()` - Print hello message to console
- `calculate_pi_approximation(iterations)` - Calculate π using Leibniz formula

## Make Commands

- `make` - Build WASM module
- `make clean` - Remove build artifacts
- `make serve` - Start development server on port 8080
- `make help` - Show available targets

## NPM Scripts

- `npm run build` - Build the project
- `npm run clean` - Clean build artifacts
- `npm run serve` - Start development server
- `npm run dev` - Build and serve

## Development

1. Edit C code in `src/main.c`
2. Rebuild with `make`
3. Refresh browser to test changes

## Example Usage

```javascript
// In browser console after loading the page
const result = addFunction(5, 3);        // Returns 8
const product = multiplyFunction(4, 7);  // Returns 28
helloWorldFunction();                    // Prints to console
const pi = piFunction(1000000);          // Approximates π
```
