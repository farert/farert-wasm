# Gitワークフロー

FARERT WASMプロジェクトのGitワークフローとファイル管理ガイド

## 📋 目次

- [コミットすべきファイル](#コミットすべきファイル)
- [コミットすべきでないファイル](#コミットすべきでないファイル)
- [特殊なケース](#特殊なケース)
- [ブランチ戦略](#ブランチ戦略)
- [コミット前のチェックリスト](#コミット前のチェックリスト)

---

## コミットすべきファイル

### ✅ プロジェクト設定・ビルド関連

```
CMakeLists.txt              # CMakeビルド設定
package.json                # npm設定
package-lock.json           # npm依存関係ロック
tsconfig.json               # TypeScript設定
.gitignore                  # Git無視設定
.npmrc                      # npm設定
```

### ✅ ソースコード

```
src/cpp/bindings/           # WASMバインディング
  └── wasm_bindings.cpp     # Emscripten embind定義

src/cpp/stubs/              # Windows互換性レイヤー
  └── stdafx.h              # POSIX互換実装

src/cpp/core/               # C++コア（一部のみ）
  ├── azusa.cpp             # メインAPI（WASM互換性のため修正）
  └── azusa.h               # メインAPI（WASM互換性のため修正）

src/ts/                     # TypeScriptソース
  ├── types/                # 型定義
  │   ├── farert.d.ts
  │   └── emscripten.d.ts
  └── wrapper/              # WASMラッパー
      └── Farert.ts
```

**重要**: `azusa.cpp` と `azusa.h` はWASM互換性のために修正されているため、コミット対象です。

### ✅ スクリプト

```
scripts/
├── copy-sources.sh         # ソースコピースクリプト
├── build.sh                # WASMビルドスクリプト
└── clean.sh                # クリーンアップスクリプト
```

### ✅ ドキュメント

```
README.md                   # プロジェクト概要
CLAUDE.md                   # プロジェクト指示書
CHANGELOG.md                # 変更履歴
CONTRIBUTING.md             # 貢献ガイド
LICENSE                     # ライセンス

docs/
├── API.md                  # API仕様書
├── IMPLEMENTATION.md       # 実装詳細
├── TROUBLESHOOTING.md      # トラブルシューティング
└── GIT_WORKFLOW.md         # このファイル
```

### ✅ 開発環境設定

```
.devcontainer/
├── devcontainer.json       # DevContainer設定
└── Dockerfile              # Dockerイメージ定義

.vscode/                    # VS Code設定（共有設定のみ）
├── extensions.json         # 推奨拡張機能
└── tasks.json              # タスク定義
```

---

## コミットすべきでないファイル

### ❌ ビルド成果物

```
dist/                       # 全体が無視対象
build/                      # CMakeビルドディレクトリ
*.o                         # オブジェクトファイル
*.wasm                      # WASMバイナリ
*.data                      # Emscriptenデータ
*.js.map                    # ソースマップ
*.wasm.map                  # WASMソースマップ
```

**理由**: ビルドで生成されるため、ソースから再現可能

### ❌ 依存関係

```
node_modules/               # npm依存関係
```

**理由**: `package.json` から `npm install` で復元可能

### ❌ ../farert からコピーされたファイル

```
src/cpp/core/
├── sqlite3.c               # bundled SQLite3ソース（8.9MB）
├── sqlite3.h               # SQLite3ヘッダー
├── sqlite3ext.h            # SQLite3拡張ヘッダー
├── db.cpp                  # データベース層（変更禁止）
├── db.h                    # データベース層（変更禁止）
├── alpdb.cpp               # JR運賃計算層（変更禁止）
└── alpdb.h                 # JR運賃計算層（変更禁止）

src/assets/
└── jrdbNewest.db           # JRデータベース（704KB）
```

**理由**:
- `scripts/copy-sources.sh` で自動コピーされる
- オリジナルは `../farert` プロジェクトで管理
- CLAUDE.mdにより変更禁止（azusaを除く）

### ❌ OS固有ファイル

```
.DS_Store                   # macOS
.DS_Store?
._*
.Spotlight-V100
.Trashes
Thumbs.db                   # Windows
ehthumbs.db
Desktop.ini
*~                          # Linux/Unix
```

**理由**: 各開発者のOS環境に依存

### ❌ IDE/エディタ固有ファイル

```
.idea/                      # IntelliJ IDEA
.vscode/settings.json       # VS Code個人設定
.vscode/launch.json         # VS Code個人設定
*.swp                       # Vim
*.swo
*.swn
.project                    # Eclipse
.classpath
.settings/
```

**理由**: 開発者ごとの個人設定

### ❌ バックアップ・一時ファイル

```
old-claude/                 # 旧バックアップ
backup/
*.backup
.temp/
.tmp/
*.log                       # ログファイル
```

**理由**: 一時的なファイル、またはバックアップ

### ❌ 環境変数ファイル

```
.env
.env.development
.env.test
.env.production
```

**理由**: 環境依存の設定、機密情報が含まれる可能性

---

## 特殊なケース

### ⚠️ azusa.cpp / azusa.h

**状態**: ✅ コミット対象

**理由**:
- オリジナル（`../farert`）から**コピー後に修正**
- `build_route` メソッドは現在 `std::string build_route(const std::string& route_str)` を返し、結果は JSON 文字列で扱う
- この修正はWASM化に必須のため、Gitで管理

**変更履歴**:
```cpp
// 現在の build_route シグネチャ
std::string build_route(const std::string& route_str);
```

詳細: [CHANGELOG.md](../CHANGELOG.md), [CLAUDE.md](../CLAUDE.md)

### ⚠️ dist/farert.d.ts

**状態**: ❌ 現在はdist/配下にあるため無視対象

**推奨**: 将来的には `src/ts/types/farert-module.d.ts` に移動してコミット対象にすべき

---

## ブランチ戦略

### メインブランチ

- **`main`**: 安定版リリース
- **`develop`**: 開発版（将来使用予定）

### フィーチャーブランチ

新機能・修正時は以下のプレフィックスを使用：

```bash
feat/your-feature-name      # 新機能
fix/bug-description         # バグ修正
docs/what-you-document      # ドキュメント
refactor/what-you-refactor  # リファクタリング
```

---

## コミット前のチェックリスト

### 1. ビルドが通るか確認

```bash
npm run build
```

### 2. TypeScript型チェック

```bash
npm run typecheck
```

### 3. テストが通るか確認

```bash
npm test
```

### 4. コピーされたファイルが含まれていないか確認

```bash
# ステージングされたファイルを確認
git status

# 以下のファイルがステージングされていないことを確認
# - src/cpp/core/sqlite3.*
# - src/cpp/core/db.*
# - src/cpp/core/alpdb.*
# - src/assets/jrdbNewest.db
```

### 5. .gitignore で無視されているか確認

```bash
# 特定ファイルが無視されているか確認
git check-ignore -v src/cpp/core/sqlite3.c
git check-ignore -v src/cpp/core/db.cpp
git check-ignore -v src/assets/jrdbNewest.db

# 期待される出力例:
# .gitignore:71:src/cpp/core/sqlite3.c	src/cpp/core/sqlite3.c
```

### 6. コミットメッセージの確認

Conventional Commits形式に従っているか確認：

```
<type>(<scope>): <subject>

<body>

<footer>
```

例:
```bash
feat(wasm): add new route calculation function

Add calculateOptimalRoute() function that finds the cheapest
route between two stations.

Closes #123
```

---

## クイックリファレンス

### ✅ コミットすべき（一般的なケース）

- プロジェクト設定ファイル
- ソースコード（`src/cpp/bindings/`, `src/cpp/stubs/`, `src/ts/`）
- **azusa.cpp, azusa.h**（WASM修正版）
- スクリプト（`scripts/`）
- ドキュメント（`docs/`, README.md, etc.）
- 開発環境設定（`.devcontainer/`, `.vscode/extensions.json`）

### ❌ コミットすべきでない（一般的なケース）

- ビルド成果物（`dist/`, `build/`, `*.wasm`）
- 依存関係（`node_modules/`）
- **コピーされたファイル**（`sqlite3.*`, `db.*`, `alpdb.*`, `jrdbNewest.db`）
- OS/IDE固有ファイル（`.DS_Store`, `.idea/`, `.vscode/settings.json`）
- バックアップ・一時ファイル（`old-claude/`, `*.log`）

---

## トラブルシューティング

### Q: 誤ってコピーファイルをコミットしてしまった

```bash
# ステージングから削除（ファイルは残す）
git reset HEAD src/cpp/core/sqlite3.c
git reset HEAD src/cpp/core/db.cpp
git reset HEAD src/cpp/core/alpdb.cpp
git reset HEAD src/assets/jrdbNewest.db
```

### Q: 既にコミット済みのコピーファイルを履歴から削除したい

```bash
# 注意: 履歴を書き換えるため、チームと調整が必要
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch src/cpp/core/sqlite3.c' \
  --prune-empty --tag-name-filter cat -- --all
```

**推奨**: 新しいコミットで削除し、.gitignoreに追加する方が安全です。

### Q: .gitignore が効かない

```bash
# Gitキャッシュをクリア
git rm -r --cached .
git add .
git commit -m "chore: update .gitignore"
```

---

## 参考

- [Conventional Commits](https://www.conventionalcommits.org/)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [CLAUDE.md](../CLAUDE.md)
