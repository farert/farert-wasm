# FARERT WASM

JR運賃計算ライブラリのWebAssembly版

## 🎯 概要

FARERT WASMは、JR運賃計算を行うC++20ライブラリをWebAssemblyにコンパイルしたものです。経路計算、運賃計算、駅・路線検索のための完全な型安全TypeScriptインターフェースを提供します。

### 主な機能

- ✅ **経路計算**: 複雑な多区間経路の構築
- ✅ **運賃計算**: 特別ルールを含む正確なJR運賃計算
- ✅ **駅・路線検索**: 10,000以上の駅を検索・参照
- ✅ **型安全API**: 完全なTypeScript型定義
- ✅ **埋め込みデータベース**: コンパイル時にSQLite3データベースを埋め込み（bundled SQLite3使用）
- ✅ **PWA対応**: Progressive Web Appsに最適化
- ✅ **フレームワーク非依存**: Svelte、React、Vue、vanilla JSで動作
- ✅ **外部依存なし**: SQLite3がC++ソースとして組み込まれているため、システムライブラリ不要

## 📦 インストール

```bash
npm install farert-wasm
```

## 🚀 クイックスタート

```typescript
import { initFarert, Farert } from 'farert-wasm';

// WASMモジュールの初期化
await initFarert();

// 経路計算インスタンスの作成
const farert = new Farert();

// 経路の構築: 東京 → 大阪
farert.addStartRoute("東京");
farert.addRoute("東海道本線", "大阪");

// 運賃計算
const fare = farert.showFare();
console.log(fare);

// 経路情報をJSONで取得
const routeJson = farert.getRoutesJson();
console.log(JSON.parse(routeJson));
```

## 🏗️ ソースからビルド

### 前提条件

- Node.js 18+
- Emscripten SDK 3.1以上
- CMake 3.20+
- Git

### セットアップ方法（2つのオプション）

#### オプション1: Dev Containerを使用（推奨）

すべての依存関係が自動的にセットアップされます。[Dev Container](#dev-container推奨)セクションを参照してください。

#### オプション2: ローカル環境でセットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/farert/farert-wasm.git
   cd farert-wasm
   ```

2. **Emscripten SDKのセットアップ**
   ```bash
   # emsdkをクローン（親ディレクトリに）
   cd ..
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk

   # 最新版をインストール
   ./emsdk install latest

   # アクティベート
   ./emsdk activate latest

   # 環境変数を設定（現在のシェルセッション用）
   source ./emsdk_env.sh

   # プロジェクトディレクトリに戻る
   cd ../farert-wasm
   ```

   **重要**: シェルを開くたびに `source ../emsdk/emsdk_env.sh` を実行する必要があります。

   または、`.bashrc` / `.zshrc` に追加して自動化：
   ```bash
   echo 'source ~/path/to/emsdk/emsdk_env.sh' >> ~/.bashrc
   # または
   echo 'source ~/path/to/emsdk/emsdk_env.sh' >> ~/.zshrc
   ```

3. **依存関係のインストール**
   ```bash
   npm install
   ```

4. **ソースファイルのコピー**（未実行の場合）
   ```bash
   bash scripts/copy-sources.sh
   ```

   このスクリプトは以下をコピーします：
   - `sqlite3.c`, `sqlite3.h`, `sqlite3ext.h` - bundled SQLite3ソース
   - `db.cpp`, `db.h` - データベース操作層
   - `alpdb.cpp`, `alpdb.h` - JR運賃計算ロジック
   - `azusa.cpp`, `azusa.h` - メインAPI
   - `jrdbNewest.db` - JRデータベース

5. **WASMのビルド**
   ```bash
   npm run build:wasm
   ```

6. **TypeScriptのビルド**
   ```bash
   npm run build:ts
   ```

または一括ビルド：
```bash
npm run build
```

### Emscriptenのバージョン確認

```bash
emcc --version
```

期待される出力例：
```
emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 3.1.x
```

### Dev Container（推奨）

一貫した開発環境を構築するには、VS Code DevContainerを使用してください：

```bash
# VS Codeで開く
code .

# F1キーを押して "Dev Containers: Reopen in Container" を選択
```

DevContainerには以下が含まれます：
- Emscripten SDKプリインストール済み
- すべてのビルドツールが設定済み
- SQLite3サポート

### トラブルシューティング

#### Emscripten関連のエラー

**エラー: `emcc: command not found`**

```bash
# Emscripten環境変数が設定されていません
source ../emsdk/emsdk_env.sh

# または、emsdkが正しくインストールされているか確認
cd ../emsdk
./emsdk install latest
./emsdk activate latest
```

**エラー: `emscripten: error: LLVM version appears incorrect`**

```bash
# emsdkを最新版に更新
cd ../emsdk
git pull
./emsdk install latest
./emsdk activate latest
```

#### ビルドエラー

**エラー: `CMake configuration failed`**

```bash
# ビルドディレクトリをクリーン
npm run clean

# 再ビルド
npm run build
```

**エラー: `fatal error: 'sqlite3.h' file not found`**

```bash
# bundled SQLite3ソースが不足しています
# ソースファイルコピースクリプトを実行
bash scripts/copy-sources.sh

# これにより以下がコピーされます：
# - sqlite3.c, sqlite3.h, sqlite3ext.h (bundled SQLite3)
# - db.cpp, db.h
# - alpdb.cpp, alpdb.h
# - azusa.cpp, azusa.h
# - jrdbNewest.db

# その後、再ビルド
npm run build:wasm
```

#### データベースファイルが見つからない

```bash
# ソースファイルのコピースクリプトを実行
bash scripts/copy-sources.sh

# jrdbNewest.dbが存在することを確認
ls -la src/assets/jrdbNewest.db
```

#### DevContainerが起動しない

1. Dockerが起動しているか確認
   ```bash
   docker ps
   ```

2. emsdkディレクトリが存在するか確認
   ```bash
   ls -la ../emsdk
   ```

3. VS Code Dev Containers拡張機能がインストールされているか確認

## 📚 APIドキュメント

### 初期化

```typescript
import { initFarert } from 'farert-wasm';

// すべてのFarert機能を使用する前に呼び出す必要があります
await initFarert();
```

### 主要クラス

#### `Farert` - 経路計算

```typescript
const farert = new Farert();

// 経路セグメントの追加
farert.addStartRoute("東京");
farert.addRoute("東海道本線", "新大阪");

// 自動経路探索
farert.autoRoute(1, "博多"); // 1 = 新幹線を使用

// 運賃の取得
const fare = farert.showFare();

// 経路の操作
farert.reverse();      // 往復反転
farert.removeTail();   // 末尾削除
farert.removeAll();    // 全削除
```

### ヘルパー関数

#### 駅・路線検索

```typescript
import {
  getPrefects,
  getLinesByPrefect,
  searchStationByKeyword,
  getStationsByLine
} from 'farert-wasm';

// すべての都道府県を取得
const prefects = JSON.parse(getPrefects());

// 駅を検索
const stations = JSON.parse(searchStationByKeyword("東京"));

// 路線上の駅を取得
const stationsOnLine = JSON.parse(getStationsByLine("山手線"));
```

## 🔧 開発

### プロジェクト構造

```
farert-wasm/
├── src/
│   ├── cpp/              # C++ソースコード
│   │   ├── core/         # コアライブラリ（db, alpdb, azusa）
│   │   └── bindings/     # WASMバインディング（embind）
│   ├── ts/               # TypeScriptラッパー
│   │   ├── types/        # 型定義
│   │   └── wrapper/      # WASMモジュールラッパー
│   └── assets/           # jrdbNewest.db
├── dist/                 # ビルド出力
├── docs/                 # ドキュメント
├── scripts/              # ビルドスクリプト
└── tests/                # テストファイル
```

### ビルドコマンド

```bash
npm run build:wasm      # C++をWASMにビルド
npm run build:ts        # TypeScriptをコンパイル
npm run build           # すべてをビルド
npm run clean           # ビルド成果物をクリーン
npm run typecheck       # 型チェックのみ
```

### テスト

```bash
npm test
```

## 🌐 フレームワーク別の使用例

### React

```tsx
import { useEffect, useState } from 'react';
import { initFarert, Farert } from 'farert-wasm';

function FareCalculator() {
  const [fare, setFare] = useState('');

  useEffect(() => {
    initFarert().then(() => {
      const farert = new Farert();
      farert.addStartRoute("東京");
      farert.addRoute("東海道本線", "大阪");
      setFare(farert.showFare());
    });
  }, []);

  return <div>{fare}</div>;
}
```

### Svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { initFarert, Farert } from 'farert-wasm';

  let fare = '';

  onMount(async () => {
    await initFarert();
    const farert = new Farert();
    farert.addStartRoute("東京");
    farert.addRoute("東海道本線", "大阪");
    fare = farert.showFare();
  });
</script>

<div>{fare}</div>
```

### Vue

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { initFarert, Farert } from 'farert-wasm';

const fare = ref('');

onMounted(async () => {
  await initFarert();
  const farert = new Farert();
  farert.addStartRoute("東京");
  farert.addRoute("東海道本線", "大阪");
  fare.value = farert.showFare();
});
</script>

<template>
  <div>{{ fare }}</div>
</template>
```

## 📄 ライセンス

GPL-3.0 - 詳細はLICENSEファイルを参照してください

## 🤝 貢献

貢献を歓迎します！Conventional Commits形式に従ってください：

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント変更
- `refactor:` コードリファクタリング

## 📖 関連プロジェクト

- [farert-pwa](../farert-pwa) - このライブラリを使用したPWAアプリケーション
- [farert](../farert) - オリジナルのC++実装

## ⚠️ 重要な注意事項

- データベースファイル（`jrdbNewest.db`）はコンパイル時に埋め込まれます
- WASM初回ロード時間：約2-3秒
- WASMバイナリサイズ：約5MB（データベース含む）
- すべての文字列はUTF-8エンコードされています

## 📞 サポート

問題や質問がある場合は、GitHubのIssueを開いてください。
