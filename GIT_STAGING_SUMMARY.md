# Gitステージング整理サマリー

## 実施内容

### 1. `.gitignore` の更新

以下のファイル/ディレクトリを無視対象に追加しました：

#### コピーされたソースファイル（`scripts/copy-sources.sh`でコピー）
- `src/cpp/core/sqlite3.c` (8.9MB)
- `src/cpp/core/sqlite3.h`
- `src/cpp/core/sqlite3ext.h`
- `src/cpp/core/db.cpp`
- `src/cpp/core/db.h`
- `src/cpp/core/alpdb.cpp`
- `src/cpp/core/alpdb.h`
- `src/assets/jrdbNewest.db` (704KB)

#### OS固有ファイル
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- その他OS固有の一時ファイル

#### IDE/エディタファイル
- `.idea/` (IntelliJ IDEA)
- `.vscode/settings.json`, `.vscode/launch.json` (個人設定)
- `*.swp`, `*.swo` (Vim)
- その他エディタ固有ファイル

#### バックアップ/一時ディレクトリ
- `old-claude/`
- `backup/`
- `*.backup`

### 2. Git追跡からの削除

以前に誤ってコミットされていた以下のファイルを、Git追跡から削除しました（ファイル自体は残ります）：

```
D  src/assets/jrdbNewest.db
D  src/cpp/core/alpdb.cpp
D  src/cpp/core/alpdb.h
D  src/cpp/core/db.cpp
D  src/cpp/core/db.h
```

これらのファイルは `.gitignore` に追加されているため、今後は追跡されません。

---

## 現在のステージング状況

### ✅ コミットすべき変更済みファイル (Modified)

```
M  .gitignore                        # .gitignore更新
M  CMakeLists.txt                    # ビルド設定
M  README.md                         # ドキュメント更新
M  scripts/copy-sources.sh           # スクリプト更新
M  src/cpp/bindings/wasm_bindings.cpp # バインディング
M  src/cpp/core/azusa.cpp            # WASM互換性修正
M  src/cpp/core/azusa.h              # WASM互換性修正
M  src/ts/wrapper/Farert.ts          # TypeScript更新
```

### ✅ コミットすべき新規ファイル (Untracked)

```
?? CHANGELOG.md                      # 変更履歴
?? CLAUDE.md                         # プロジェクト指示書
?? CONTRIBUTING.md                   # 貢献ガイド
?? docs/GIT_WORKFLOW.md              # Gitワークフローガイド
?? docs/IMPLEMENTATION.md            # 実装詳細
?? docs/TROUBLESHOOTING.md           # トラブルシューティング
?? src/cpp/stubs/                    # Windows互換性レイヤー
?? src/ts/types/emscripten.d.ts      # 型定義
```

### ✅ Git追跡から削除 (Deleted)

```
D  src/assets/jrdbNewest.db          # コピーファイル（追跡解除）
D  src/cpp/core/alpdb.cpp            # コピーファイル（追跡解除）
D  src/cpp/core/alpdb.h              # コピーファイル（追跡解除）
D  src/cpp/core/db.cpp               # コピーファイル（追跡解除）
D  src/cpp/core/db.h                 # コピーファイル（追跡解除）
```

**注意**: これらのファイルはディスク上には残っており、`.gitignore`により無視されます。

---

## 推奨コミット手順

### 1. 全ての変更をステージング

```bash
# 全てのファイルをステージング
git add .

# または個別に
git add .gitignore
git add CMakeLists.txt
git add README.md
git add scripts/copy-sources.sh
git add src/cpp/bindings/wasm_bindings.cpp
git add src/cpp/core/azusa.cpp
git add src/cpp/core/azusa.h
git add src/ts/wrapper/Farert.ts
git add CHANGELOG.md
git add CLAUDE.md
git add CONTRIBUTING.md
git add docs/
git add src/cpp/stubs/
git add src/ts/types/emscripten.d.ts
```

### 2. ステージング内容の確認

```bash
git status
```

期待される出力:
```
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   .gitignore
	new file:   CHANGELOG.md
	new file:   CLAUDE.md
	modified:   CMakeLists.txt
	new file:   CONTRIBUTING.md
	modified:   README.md
	new file:   docs/GIT_WORKFLOW.md
	new file:   docs/IMPLEMENTATION.md
	new file:   docs/TROUBLESHOOTING.md
	modified:   scripts/copy-sources.sh
	deleted:    src/assets/jrdbNewest.db
	modified:   src/cpp/bindings/wasm_bindings.cpp
	deleted:    src/cpp/core/alpdb.cpp
	deleted:    src/cpp/core/alpdb.h
	modified:   src/cpp/core/azusa.cpp
	modified:   src/cpp/core/azusa.h
	deleted:    src/cpp/core/db.cpp
	deleted:    src/cpp/core/db.h
	new file:   src/cpp/stubs/stdafx.h
	new file:   src/ts/types/emscripten.d.ts
	modified:   src/ts/wrapper/Farert.ts
```

### 3. コミット（Conventional Commits形式）

```bash
git commit -m "$(cat <<'EOF'
chore: reorganize git tracking and update documentation

- Update .gitignore to exclude copied source files
- Remove db.cpp/h, alpdb.cpp/h, jrdbNewest.db from tracking
- Add comprehensive documentation (CHANGELOG, CONTRIBUTING, etc.)
- Add TypeScript type definitions (emscripten.d.ts)
- Add Windows compatibility layer (stubs/stdafx.h)
- Update build scripts and documentation

Copied files from ../farert are now ignored and managed by
scripts/copy-sources.sh. Documentation has been expanded to
include API reference, implementation details, troubleshooting,
and git workflow guide.
EOF
)"
```

---

## 確認事項

### ✅ コピーファイルが無視されているか確認

```bash
git check-ignore -v src/cpp/core/sqlite3.c
git check-ignore -v src/cpp/core/db.cpp
git check-ignore -v src/cpp/core/alpdb.cpp
git check-ignore -v src/assets/jrdbNewest.db
```

期待される出力:
```
.gitignore:71:src/cpp/core/sqlite3.c	src/cpp/core/sqlite3.c
.gitignore:76:src/cpp/core/db.cpp	src/cpp/core/db.cpp
.gitignore:80:src/cpp/core/alpdb.cpp	src/cpp/core/alpdb.cpp
.gitignore:84:src/assets/jrdbNewest.db	src/assets/jrdbNewest.db
```

### ✅ ファイルが実際に存在するか確認

```bash
ls -lh src/cpp/core/sqlite3.c
ls -lh src/cpp/core/db.cpp
ls -lh src/cpp/core/alpdb.cpp
ls -lh src/assets/jrdbNewest.db
```

これらのファイルは存在しますが、Gitでは追跡されません。

---

## 今後の運用

### ビルド前に必ず実行

```bash
bash scripts/copy-sources.sh
```

これにより、`../farert` から必要なファイルがコピーされます。

### 新しい開発者のセットアップ

1. リポジトリをクローン
   ```bash
   git clone https://github.com/farert/farert-wasm.git
   cd farert-wasm
   ```

2. ソースファイルをコピー
   ```bash
   bash scripts/copy-sources.sh
   ```

3. ビルド
   ```bash
   npm install
   npm run build
   ```

---

## 参考ドキュメント

- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) - 詳細なGitワークフロー
- [CONTRIBUTING.md](CONTRIBUTING.md) - 貢献ガイド
- [CLAUDE.md](CLAUDE.md) - プロジェクト指示書
- [README.md](README.md) - プロジェクト概要

---

## 注意事項

### ⚠️ azusa.cpp / azusa.h について

これらのファイルは `../farert` からコピーされますが、**WASM互換性のために修正されている**ため、Gitで追跡されます：

- 変更内容: `build_route` メソッドの引数を `std::string&` → `std::string` に変更
- 理由: Emscripten embindは参照渡しをサポートしていない

詳細: [CHANGELOG.md](CHANGELOG.md#files-modified-for-wasm-compatibility)

### ⚠️ 変更禁止ファイル

CLAUDE.mdの指定により、以下のファイルは**変更禁止**です：

- `src/cpp/core/db.cpp`
- `src/cpp/core/db.h`
- `src/cpp/core/alpdb.cpp`
- `src/cpp/core/alpdb.h`

これらのファイルはGit追跡から除外されており、`scripts/copy-sources.sh`で自動的にコピーされます。
