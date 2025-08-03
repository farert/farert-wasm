#!/bin/bash
# Emscripten環境設定スクリプト
# 使用方法: source setup_env.sh

if [ -f ~/priv/farert.repos/emsdk/emsdk_env.sh ]; then
    echo "Emscripten環境を設定中..."
    source ~/priv/farert.repos/emsdk/emsdk_env.sh
    echo "✅ Emscripten環境が設定されました"
    echo "📍 em++パス: $(which em++)"
else
    echo "❌ Emscripten SDKが見つかりません: ~/priv/farert.repos/emsdk/emsdk_env.sh"
    exit 1
fi