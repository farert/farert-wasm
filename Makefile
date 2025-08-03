# Emscripten環境の確認と設定
EMSDK_ENV = ~/priv/farert.repos/emsdk/emsdk_env.sh

# Emscripten環境チェック
check_emsdk:
	@if [ ! -f $(EMSDK_ENV) ]; then \
		echo "❌ Emscripten SDKが見つかりません: $(EMSDK_ENV)"; \
		echo "💡 以下のコマンドを実行してください:"; \
		echo "   source setup_env.sh && make"; \
		exit 1; \
	fi
	@if ! command -v em++ >/dev/null 2>&1; then \
		echo "❌ em++コマンドが見つかりません"; \
		echo "💡 以下のコマンドを実行してください:"; \
		echo "   source setup_env.sh && make"; \
		exit 1; \
	fi
	@echo "✅ Emscripten環境が設定されています"

CC = emcc
CXX = em++
CFLAGS = -O3 -DDEBUG
CXXFLAGS = -O3 -std=c++17 -DDEBUG
LDFLAGS = -O3 -s WASM=1 -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall"]' -s ALLOW_MEMORY_GROWTH=1 \
          -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME="'FarertModule'" \
          --embed-file data/jrdbnewest.db@/data/jrdbnewest.db \
          --bind

SOURCE_DIR = src
BUILD_DIR = build
DIST_DIR = dist
THIRD_PARTY_DIR = third_party

# Source files
CORE_SOURCES = $(SOURCE_DIR)/core/alpdb.cpp \
               $(SOURCE_DIR)/core/utils.cpp \
               $(SOURCE_DIR)/core/route_interface.cpp
               
DB_SOURCES = $(SOURCE_DIR)/db/db.cpp

MAIN_SOURCE = $(SOURCE_DIR)/farert_wasm.cpp

SQLITE_SOURCE = $(THIRD_PARTY_DIR)/sqlite3.c

# All sources
SOURCES = $(CORE_SOURCES) $(DB_SOURCES) $(MAIN_SOURCE) $(SQLITE_SOURCE)

# Object files
OBJECTS = $(SOURCES:%.cpp=$(BUILD_DIR)/%.o)
OBJECTS := $(OBJECTS:%.c=$(BUILD_DIR)/%.o)

TARGET = $(DIST_DIR)/farert

.PHONY: all clean serve install-deps test kill-server status

all: check_emsdk $(TARGET).js $(TARGET).wasm

$(TARGET).js $(TARGET).wasm: $(OBJECTS) | $(DIST_DIR)
	$(CXX) $(CXXFLAGS) $(OBJECTS) -o $(TARGET).js $(LDFLAGS)

# C++ object files
$(BUILD_DIR)/%.o: %.cpp | $(BUILD_DIR)
	@mkdir -p $(dir $@)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# C object files  
$(BUILD_DIR)/%.o: %.c | $(BUILD_DIR)
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)/$(SOURCE_DIR)/core
	mkdir -p $(BUILD_DIR)/$(SOURCE_DIR)/db
	mkdir -p $(BUILD_DIR)/$(THIRD_PARTY_DIR)

$(DIST_DIR):
	mkdir -p $(DIST_DIR)

clean:
	rm -rf $(BUILD_DIR) $(DIST_DIR)

serve: all
	@echo "🚀 開発サーバーを起動中..."
	@port=8080; \
	while lsof -ti:$$port >/dev/null 2>&1; do \
		echo "⚠️  ポート$$portは使用中です。次のポートを試します..."; \
		port=$$((port + 1)); \
	done; \
	echo "✅ ポート$$portでサーバーを起動します"; \
	echo "🌐 ブラウザで http://localhost:$$port/farert_test.html を開いてください"; \
	python3 -m http.server $$port

test: all
	@echo "🧪 WebAssemblyモジュールをテスト中..."
	@echo "🌐 ブラウザで http://localhost:8080/farert_test.html を開いてテストしてください"

kill-server:
	@echo "🔥 開発サーバーを停止中..."
	@for port in $$(seq 8080 8090); do \
		pid=$$(lsof -ti:$$port 2>/dev/null); \
		if [ -n "$$pid" ]; then \
			echo "💀 ポート$$portのプロセス(PID:$$pid)を終了します"; \
			kill -9 $$pid 2>/dev/null || true; \
		fi; \
	done
	@echo "✅ サーバーを停止しました"

status:
	@echo "📊 プロジェクトステータス:"
	@echo "================================="
	@if [ -f "$(TARGET).js" ] && [ -f "$(TARGET).wasm" ]; then \
		echo "✅ ビルド: 完了"; \
		echo "📁 ファイルサイズ:"; \
		ls -lh $(TARGET).js $(TARGET).wasm | awk '{print "   " $$9 ": " $$5}'; \
	else \
		echo "❌ ビルド: 未完了"; \
	fi
	@echo ""
	@echo "🔌 ポート使用状況:"
	@for port in $$(seq 8080 8085); do \
		if lsof -ti:$$port >/dev/null 2>&1; then \
			echo "   ポート$$port: 🔴 使用中"; \
		else \
			echo "   ポート$$port: 🟢 利用可能"; \
		fi; \
	done

install-deps:
	@echo "📦 依存関係の状況:"
	@echo "1. Emscripten SDK: $(if $(shell command -v em++ 2>/dev/null),✅ インストール済み,❌ 未インストール)"
	@echo "2. SQLite3: ✅ third_party/に含まれています"
	@echo "3. データベースファイル: $(if $(shell test -f data/jrdbnewest.db && echo 1),✅ 準備済み,❌ 未準備)"
	@echo ""
	@echo "💡 Emscripten環境の設定:"
	@echo "   source setup_env.sh"

help:
	@echo "🚊 Farert WebAssembly プロジェクト"
	@echo "=================================="
	@echo "📋 利用可能なコマンド:"
	@echo "  all          - WebAssemblyモジュールをビルド"
	@echo "  clean        - ビルド成果物を削除"
	@echo "  serve        - 開発サーバーを起動（自動ポート選択）"
	@echo "  kill-server  - 開発サーバーを停止"
	@echo "  test         - テスト情報を表示"
	@echo "  status       - プロジェクトの状況を表示"
	@echo "  install-deps - 依存関係の情報を表示"
	@echo "  help         - このヘルプを表示"
	@echo ""
	@echo "🚀 クイックスタート:"
	@echo "  source setup_env.sh && make serve"