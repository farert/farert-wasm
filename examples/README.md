# Examples

FARERT WASMの使用例とテストファイル

## 📁 ファイル一覧

### test_sql.html

`executeSql()` 機能のブラウザ動作確認用HTMLファイル。

**使用方法:**

1. HTTPサーバーを起動（ルートディレクトリで実行）:
   ```bash
   # Python 3の場合
   python3 -m http.server 8000

   # または npx を使用
   npx serve .
   ```

2. ブラウザで開く:
   ```
   http://localhost:8000/examples/test_sql.html
   ```

**実行されるテスト:**
- テスト1: t_station テーブルから東京駅を検索
- テスト2: テーブル一覧を取得
- テスト3: t_station のレコード数を確認
- テスト4: 路線情報を取得
- テスト5: エラーハンドリングのテスト

### test_sql.mjs

`executeSql()` 機能のNode.js動作確認用スクリプト（ES Modules形式）。

**使用方法:**

```bash
# ルートディレクトリから実行
node examples/test_sql.mjs
```

**注意:** Node.js環境では、package.jsonに `"type": "module"` の設定が必要な場合があります。

## 🚀 その他の使用例

### 基本的な経路計算

```typescript
import { initFarert, Farert } from 'farert-wasm';

await initFarert();

const farert = new Farert();
farert.addStartRoute("東京");
farert.addRoute("東海道本線", "大阪");

console.log(farert.showFare());
```

### SQL実行によるデバッグ

```typescript
import { initFarert, executeSql } from 'farert-wasm';

await initFarert();

// データベースの内容を確認
const result = executeSql("SELECT * FROM t_station WHERE name='東京'");
const data = JSON.parse(result);

console.log('駅情報:', data.rows);
```

## 📚 詳細ドキュメント

- [API仕様](../docs/API.md)
- [トラブルシューティング](../docs/TROUBLESHOOTING.md)
- [README](../README.md)
