# 貢献ガイド

FARERT WASMへの貢献を歓迎します！このドキュメントでは、プロジェクトへの貢献方法について説明します。

## 目次

- [行動規範](#行動規範)
- [開発環境のセットアップ](#開発環境のセットアップ)
- [ブランチ戦略](#ブランチ戦略)
- [コミットメッセージ規約](#コミットメッセージ規約)
- [コーディング規約](#コーディング規約)
- [プルリクエストのガイドライン](#プルリクエストのガイドライン)
- [テスト](#テスト)
- [ドキュメント](#ドキュメント)

## 行動規範

このプロジェクトに参加するすべての人は、敬意を持ち、協力的な態度で臨むことが期待されます。

## 開発環境のセットアップ

### 1. リポジトリのフォークとクローン

```bash
# あなたのアカウントでフォーク
# https://github.com/farert/farert-wasm でForkボタンをクリック

# クローン
git clone https://github.com/YOUR_USERNAME/farert-wasm.git
cd farert-wasm

# upstream を追加
git remote add upstream https://github.com/farert/farert-wasm.git
```

### 2. Dev Container（推奨）

```bash
# VS Codeで開く
code .

# F1 → "Dev Containers: Reopen in Container"
```

Dev Containerには全ての依存関係が含まれています。

### 3. ローカル環境

**必要なツール:**
- Node.js 18+
- Emscripten SDK 3.1+
- CMake 3.20+
- Git

```bash
# 依存関係のインストール
npm install

# Emscripten SDKのセットアップ（README.md参照）
cd ../emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ../farert-wasm

# ソースファイルのコピー
bash scripts/copy-sources.sh

# ビルド
npm run build
```

## ブランチ戦略

### メインブランチ

- `main`: 安定版リリース
- `develop`: 開発版（将来的に使用予定）

### フィーチャーブランチ

新機能や修正には、以下の命名規則でブランチを作成：

```bash
# 新機能
git checkout -b feat/your-feature-name

# バグ修正
git checkout -b fix/bug-description

# ドキュメント
git checkout -b docs/what-you-document

# リファクタリング
git checkout -b refactor/what-you-refactor
```

## コミットメッセージ規約

**Conventional Commits** 形式を使用します：

### 形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（空白、フォーマット等）
- `refactor`: バグ修正でも機能追加でもないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

### Scope（オプション）

- `wasm`: WASMビルド関連
- `ts`: TypeScript関連
- `bindings`: C++バインディング
- `core`: C++コア
- `docs`: ドキュメント
- `build`: ビルドシステム

### 例

```bash
# 良い例
git commit -m "feat(ts): add fare calculation helper function"
git commit -m "fix(wasm): resolve memory leak in route calculation"
git commit -m "docs(api): add examples for Farert class methods"

# 避けるべき例
git commit -m "update"
git commit -m "fix bug"
git commit -m "WIP"
```

### 詳細なコミットメッセージ

```
feat(ts): add fare calculation helper function

Add a new helper function `calculateDetailedFare()` that returns
a structured object with itemized fare breakdown.

Closes #123
```

## コーディング規約

### TypeScript

```typescript
// ✅ 良い例
export async function initFarert(): Promise<void> {
  if (wasmModule) {
    return;
  }
  // ...
}

// ❌ 悪い例
export async function initFarert() {
  if (wasmModule) return;
  // ...
}
```

**規約:**
- 明示的な型アノテーション
- `async/await` を使用（Promiseチェーンより）
- 関数は1つのことだけ行う
- 早期リターンを使用
- エラーハンドリングを忘れずに

### C++

```cpp
// ✅ 良い例
class Farert {
public:
    int addStartRoute(const std::string& station);

private:
    std::string m_currentStation;
};

// ❌ 悪い例
class Farert {
public:
    int addStartRoute(std::string station);
private:
    std::string currentStation;
};
```

**規約:**
- C++20標準に従う
- const参照を積極的に使用
- RAIIパターンを使用
- メンバー変数には `m_` プレフィックス
- **重要**: `db.cpp`, `db.h`, `alpdb.cpp`, `alpdb.h` は変更しない（CLAUDE.md）

### ファイル構成

```
src/
├── cpp/
│   ├── core/        # コアロジック（変更制限あり）
│   ├── bindings/    # WASMバインディング
│   └── stubs/       # 互換性レイヤー
├── ts/
│   ├── types/       # 型定義
│   └── wrapper/     # TypeScriptラッパー
└── assets/          # リソース
```

## プルリクエストのガイドライン

### 1. 作成前の確認

```bash
# 最新のmainブランチと同期
git checkout main
git pull upstream main

# フィーチャーブランチにマージ
git checkout feat/your-feature
git merge main

# ビルドとテストが通ることを確認
npm run build
npm test
npm run typecheck
```

### 2. PR作成

**PRタイトル:** Conventional Commits形式

```
feat(ts): add detailed fare calculation
```

**PR説明テンプレート:**

```markdown
## 概要
この変更の目的を簡潔に説明

## 変更内容
- 追加した機能
- 修正したバグ
- 変更したファイル

## テスト
- [ ] ローカルでビルド成功
- [ ] テストが全て通過
- [ ] 手動テスト実施

## 関連Issue
Closes #123

## スクリーンショット（該当する場合）

## チェックリスト
- [ ] コーディング規約に従っている
- [ ] ドキュメントを更新した
- [ ] コミットメッセージがConventional Commits形式
- [ ] db.cpp/h, alpdb.cpp/h を変更していない（該当する場合）
```

### 3. レビュー対応

- レビューコメントには24時間以内に返信
- 建設的なフィードバックを受け入れる
- 必要に応じてコードを修正

### 4. マージ前の最終確認

```bash
# コードフォーマット
npm run format  # 将来的に追加予定

# Lint
npm run lint    # 将来的に追加予定

# ビルド
npm run build

# テスト
npm test
```

## テスト

### テストの書き方

```typescript
// tests/wrapper/Farert.test.ts
import { describe, it, expect, beforeAll } from '@jest/globals';
import { initFarert, Farert } from '../../src/ts/wrapper/Farert';

describe('Farert', () => {
  beforeAll(async () => {
    await initFarert();
  });

  it('should calculate fare correctly', () => {
    const farert = new Farert();
    farert.addStartRoute('東京');
    farert.addRoute('東海道線', '大阪');

    const fare = farert.showFare();
    expect(fare).toContain('円');
  });
});
```

### テスト実行

```bash
# 全テスト
npm test

# 特定ファイル
npm test -- Farert.test.ts

# watchモード
npm test -- --watch
```

## ドキュメント

### 更新が必要なドキュメント

新機能や変更を追加する場合、以下を更新：

1. **README.md** - 使用例やクイックスタート
2. **docs/API.md** - API仕様
3. **CHANGELOG.md** - 変更履歴
4. **docs/IMPLEMENTATION.md** - 実装詳細（該当する場合）

### ドキュメントの書き方

```markdown
## 関数名

簡潔な説明

**パラメータ:**
- `param1`: 説明

**戻り値:**
- 説明

**使用例:**
\`\`\`typescript
const result = functionName(param1);
\`\`\`
```

## 変更してはいけないファイル

**CLAUDE.md** の規定により、以下のファイルは変更禁止：

- `src/cpp/core/db.cpp`
- `src/cpp/core/db.h`
- `src/cpp/core/alpdb.cpp`
- `src/cpp/core/alpdb.h`

これらのファイルを変更する必要がある場合は、Issue で相談してください。

## 変更可能なファイル

- `src/cpp/core/azusa.cpp`
- `src/cpp/core/azusa.h`
- `src/cpp/bindings/*`
- `src/cpp/stubs/*`
- `src/ts/**/*`
- ドキュメント
- テスト
- ビルドスクリプト

## よくある質問

### Q: ビルドが失敗する

A: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) を参照

### Q: 新しい駅・路線データを追加したい

A: データベースファイル（`jrdbNewest.db`）は別リポジトリで管理されています。データ更新については Issue で相談してください。

### Q: パフォーマンス問題を見つけた

A: Issue を開いて、再現手順と期待される動作を記載してください。

## サポート

質問や問題がある場合：

1. [Issue](https://github.com/farert/farert-wasm/issues) を検索
2. 既存のIssueがなければ新規作成
3. できるだけ詳細な情報を提供

## ライセンス

貢献したコードは GPL-3.0 ライセンスの下で公開されます。

---

貢献ありがとうございます！ 🚀
