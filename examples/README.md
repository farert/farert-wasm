# Farert WebAssembly Examples

このディレクトリには、Farert WebAssemblyモジュールの使用例とサンプルコードが含まれています。

## 📂 サンプル分類

### 🔧 [api/](./api/) - 一般的なAPI使用例
- **[railway_query_examples.js](./api/railway_query_examples.js)** - WebAssembly API直接使用例
  - 山手線の駅一覧取得
  - 県別路線検索
  - 駅の接続路線表示
  - 基本的なクエリパターン

### ⚡ [cli/](./cli/) - CLIツール使用例
- **[basic-object-classes.ts](./cli/basic-object-classes.ts)** - オブジェクトクラス基本使用法
- **[route-flag-examples.ts](./cli/route-flag-examples.ts)** - ルートフラグと特殊条件
- **[realistic-scenarios.ts](./cli/realistic-scenarios.ts)** - 実際の日本の鉄道ルート例
- **[framework-integration.ts](./cli/framework-integration.ts)** - React/Vue/Svelte統合例

### 🎨 [svelte-components/](./svelte-components/) - Svelteコンポーネント
- インタラクティブなUI要素
- リアクティブな運賃計算
- ステーション検索

### 🌐 [sveltekit-example/](./sveltekit-example/) - SvelteKitアプリケーション
- フルスタックアプリケーション例
- SSRサポート
- 完全なルート計算UI

## 🚀 実行方法

### 1. プロジェクトビルド
```bash
npm run build
```

### 2. 各サンプル実行

#### API使用例
```bash
node examples/api/railway_query_examples.js
```

#### CLI使用例
```bash
node examples/cli/basic-object-classes.ts
node examples/cli/realistic-scenarios.ts
```

#### フロントエンド例
```bash
# Svelte コンポーネント
cd examples/svelte-components && npm run dev

# SvelteKit アプリケーション  
cd examples/sveltekit-example && npm run dev
```

## 📚 学習の順序

1. **[api/railway_query_examples.js](./api/railway_query_examples.js)** - 基本的なAPI理解
2. **[cli/basic-object-classes.ts](./cli/basic-object-classes.ts)** - オブジェクト指向パターン
3. **[cli/realistic-scenarios.ts](./cli/realistic-scenarios.ts)** - 実用的なルート計算
4. **[svelte-components/](./svelte-components/)** - UI開発
5. **[sveltekit-example/](./sveltekit-example/)** - フルアプリケーション

## 💡 ヒント

- 全てのサンプルは実際のJR路線データベースを使用
- サポート路線は229線（主にJRと第三セクター）
- 私鉄線は現在未対応（つくばエクスプレス、小田急線等）
- TypeScriptサンプルは`tsx`を使用すると便利

## 🔗 関連ドキュメント

- [API リファレンス](../docs/api-reference.md)
- [プロジェクト概要](../README.md)
- [技術仕様](../CLAUDE.md)