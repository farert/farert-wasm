# DevContainer Development Environment

このディレクトリには、Farert WebAssemblyプロジェクトの完全な開発環境を提供するDevContainer設定が含まれています。

## 🎯 含まれる開発ツール

### コアツール
- **Node.js 18** (LTS版)
- **Emscripten SDK** (最新安定版)
- **TypeScript** (グローバルインストール)
- **Python 3.11** (Emscriptenの要求)

### 開発用ツール
- **C++ Build Tools** (GCC, CMake, Ninja)
- **SQLite3** (データベース操作用)
- **Git** (バージョン管理)
- **ESLint & Prettier** (コード品質)

### エディタ拡張機能
- TypeScript/JavaScript開発用拡張機能
- Svelte開発サポート
- C++開発ツール
- Markdown、YAML、JSONサポート
- Prettier自動フォーマット

## 🚀 使用方法

### 1. 前提条件

以下がインストールされている必要があります：

- **Visual Studio Code** ([ダウンロード](https://code.visualstudio.com/))
- **Docker Desktop** ([ダウンロード](https://www.docker.com/get-started/))
- **Dev Containers拡張機能** (VSCode内でインストール)

### 2. DevContainer起動

```bash
# プロジェクトをVSCodeで開く
code .

# コマンドパレットを開く (Cmd/Ctrl + Shift + P)
# "Dev Containers: Reopen in Container" を選択

# または、左下の緑色アイコンをクリック → "Reopen in Container"
```

### 3. 自動セットアップ

コンテナ起動時に以下が自動実行されます：

1. 全ての依存関係インストール
2. Emscripten環境のセットアップ
3. プロジェクト依存関係のインストール (`npm install`)
4. WebAssemblyモジュールのビルド (可能な場合)
5. TypeScript CLIのビルド (可能な場合)

### 4. 開発開始

```bash
# WebAssemblyモジュールをビルド
make node

# TypeScript CLIをビルド
npm run cli:build

# テストを実行
npm run cli:exec

# 開発サーバー起動
npm run dev
```

## 🛠️ 便利なコマンド

### エイリアス
DevContainer内で以下のエイリアスが使用できます：

```bash
build-wasm      # WebAssemblyをビルド (Emscripten環境込み)
build-cli       # TypeScript CLIをビルド
test-cli        # CLIテストを実行
emscripten-env  # Emscripten環境を手動でアクティベート
```

### ポートフォワーディング
以下のポートが自動的にフォワードされます：

- **8080**: 開発サーバー
- **3000**: React/Next.js
- **5173**: Vite/Svelte

## 📁 コンテナ内の構造

```
/workspace/                 # プロジェクトディレクトリ (マウント)
/home/vscode/emsdk/        # Emscripten SDK
/home/vscode/.bashrc       # 環境設定とエイリアス
```

## 🔧 カスタマイズ

### 拡張機能の追加
`devcontainer.json`の`extensions`セクションに拡張機能IDを追加：

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "your-extension-id"
      ]
    }
  }
}
```

### ポートの追加
`devcontainer.json`の`forwardPorts`にポート番号を追加：

```json
{
  "forwardPorts": [8080, 3000, 5173, "your-port"]
}
```

### パッケージの追加
`Dockerfile`の`npm install -g`セクションにグローバルパッケージを追加：

```dockerfile
RUN npm install -g \
    your-package-name
```

## 🐛 トラブルシューティング

### コンテナのリビルド
設定を変更した場合：

1. Cmd/Ctrl + Shift + P
2. "Dev Containers: Rebuild Container" を選択

### 権限エラー
Dockerの権限エラーが発生した場合：

```bash
# macOS/Linux
sudo usermod -aG docker $USER
# ログアウト/ログインが必要

# Windows
# Docker Desktopを管理者権限で実行
```

### メモリ不足
Dockerのメモリ制限を増やす：

1. Docker Desktop設定を開く
2. Resources → Memory を8GB以上に設定

## 📚 参考資料

- [DevContainers公式ドキュメント](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker公式ドキュメント](https://docs.docker.com/)
- [Emscripten公式ドキュメント](https://emscripten.org/)