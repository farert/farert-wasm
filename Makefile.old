CC = emcc
CFLAGS = -O3 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["cwrap"]' -s ALLOW_MEMORY_GROWTH=1
SOURCE_DIR = src
BUILD_DIR = build
DIST_DIR = dist

SOURCES = $(wildcard $(SOURCE_DIR)/*.c)
TARGET = $(DIST_DIR)/main

.PHONY: all clean serve install-deps

all: $(TARGET).js $(TARGET).wasm

$(TARGET).js $(TARGET).wasm: $(SOURCES) | $(BUILD_DIR) $(DIST_DIR)
	$(CC) $(CFLAGS) $(SOURCES) -o $(TARGET).js

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

clean:
	rm -rf $(BUILD_DIR) $(DIST_DIR)

serve: all
	python3 -m http.server 8080

install-deps:
	@echo "Please install Emscripten SDK from https://emscripten.org/docs/getting_started/downloads.html"
	@echo "Or use: git clone https://github.com/emscripten-core/emsdk.git && cd emsdk && ./emsdk install latest && ./emsdk activate latest"

help:
	@echo "Available targets:"
	@echo "  all        - Build WASM module"
	@echo "  clean      - Remove build artifacts"
	@echo "  serve      - Start development server on port 8080"
	@echo "  install-deps - Show Emscripten installation instructions"