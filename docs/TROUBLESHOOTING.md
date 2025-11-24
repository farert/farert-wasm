# トラブルシューティング

FARERT WASMの一般的な問題と解決方法

## 目次

- [ビルドエラー](#ビルドエラー)
- [実行時エラー](#実行時エラー)
- [パフォーマンス問題](#パフォーマンス問題)
- [開発環境の問題](#開発環境の問題)
- [よくある質問](#よくある質問)

---

## ビルドエラー

### エラー: `emcc: command not found`

**原因:** Emscripten SDKの環境変数が設定されていません。

**解決方法:**

```bash
# Emscripten環境変数を設定
source ../emsdk/emsdk_env.sh

# または、シェル起動時に自動設定
echo 'source ~/path/to/emsdk/emsdk_env.sh' >> ~/.bashrc
# zshの場合
echo 'source ~/path/to/emsdk/emsdk_env.sh' >> ~/.zshrc
```

**確認:**
```bash
emcc --version
# 出力例: emcc (Emscripten gcc/clang-like replacement) 3.1.x
```

---

### エラー: `CMake configuration failed`

**原因:** CMakeキャッシュが破損しているか、設定エラー

**解決方法:**

```bash
# ビルドディレクトリを完全削除
rm -rf build

# 再ビルド
npm run build:wasm
```

**それでも失敗する場合:**

```bash
# CMakeバージョン確認
cmake --version
# 3.20以上であることを確認

# Emscripten SDKを再セットアップ
cd ../emsdk
git pull
./emsdk install latest
./emsdk activate latest
```

---

### エラー: `fatal error: 'sqlite3.h' file not found`

**原因:** bundled SQLite3ソースファイルがコピーされていません。

**解決方法:**

```bash
# ソースファイルをコピー
bash scripts/copy-sources.sh

# コピーされたことを確認
ls -la src/cpp/core/sqlite3.*
# 以下が存在するはず:
# sqlite3.c
# sqlite3.h
# sqlite3ext.h

# 再ビルド
npm run build:wasm
```

---

### エラー: `unknown type name 'DBO'` または `unknown type name 'DBS'`

**原因:** ヘッダーのインクルード順序の問題

**解決方法:**

```bash
# stubs/stdafx.h が正しく設定されているか確認
cat src/cpp/stubs/stdafx.h | grep "db.h"
# "#include "../core/db.h" が含まれているべき

# 含まれていない場合、再度ソースをコピー
bash scripts/copy-sources.sh
npm run build:wasm
```

---

### エラー: `error: functions that differ only in their return type`

**原因:** 関数の重複定義（通常は修正済み）

**解決方法:**

```bash
# クリーンビルド
npm run clean
npm run build
```

---

### エラー: `wasm-ld: error: undefined symbol: g_tax`

**原因:** グローバル変数 `g_tax` が未定義

**解決方法:**

この問題は通常発生しないはずです（`src/cpp/stubs/stdafx.h` で定義済み）。

```bash
# stdafx.h を確認
grep "g_tax" src/cpp/stubs/stdafx.h
# "int g_tax = 10;" が含まれているべき

# 含まれていない場合、ファイルを再生成
# または、GitHubのIssueを作成
```

---

### エラー: TypeScript型エラー `Cannot find name 'EmscriptenModule'`

**原因:** 型定義ファイルが見つからない

**解決方法:**

```bash
# 型定義ファイルが存在するか確認
ls src/ts/types/emscripten.d.ts

# 存在しない場合、Gitから取得
git checkout src/ts/types/emscripten.d.ts

# TypeScriptを再ビルド
npm run build:ts
```

---

## 実行時エラー

### エラー: `FARERT WASM not initialized`

**原因:** `initFarert()` を呼び出さずに `Farert` クラスを使用

**解決方法:**

```typescript
// ❌ 間違い
const farert = new Farert(); // エラー！

// ✅ 正しい
await initFarert();
const farert = new Farert();
```

**React での正しい使用例:**

```typescript
function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initFarert().then(() => setInitialized(true));
  }, []);

  if (!initialized) {
    return <div>Loading WASM...</div>;
  }

  // ここで Farert を使用
  const farert = new Farert();
  // ...
}
```

---

### エラー: `Failed to initialize FARERT WASM`

**原因:** WASMファイルのロード失敗

**解決方法:**

1. **WASMファイルの存在確認:**
   ```bash
   ls dist/farert.wasm
   ls dist/farert.js
   ls dist/farert.data
   ```

2. **ビルドの再実行:**
   ```bash
   npm run build:wasm
   ```

3. **ブラウザコンソールでエラー確認:**
   ```
   F12 → Console タブ
   ```

4. **ネットワークタブでファイルロード確認:**
   ```
   F12 → Network タブ
   farert.wasm, farert.data が 200 OK で返ってくるか確認
   ```

---

### エラー: データベースクエリが失敗する

**原因:** データベースファイルが埋め込まれていない

**解決方法:**

```bash
# データベースファイルの存在確認
ls src/assets/jrdbNewest.db

# 存在しない場合、コピースクリプトを実行
bash scripts/copy-sources.sh

# WASMを再ビルド（データベースが埋め込まれる）
npm run build:wasm
```

**ブラウザコンソールで確認:**

```javascript
// データベースが開いているか確認
import { openDatabase } from 'farert-wasm';
await initFarert();
const status = openDatabase();
console.log(status); // "Database opened successfully" など
```

---

### エラー: 経路が見つからない（`addRoute` が失敗）

**原因:** 駅名や路線名の表記が正しくない

**デバッグ方法:**

```typescript
import { searchStationByKeyword, getStationsByLine } from 'farert-wasm';

// 駅名を検索
const stations = JSON.parse(searchStationByKeyword('東京'));
console.log(stations);

// 路線の駅一覧を確認
const lineStations = JSON.parse(getStationsByLine('東海道本線'));
console.log(lineStations);

// 正確な駅名を使用
farert.addStartRoute(stations[0]); // 検索結果から取得
```

**注意:**
- 駅名の表記は完全一致が必要
- 全角・半角、スペースに注意
- 例: "東京" ○ / "ﾄｳｷｮｳ" ×

---

## パフォーマンス問題

### 問題: 初回ロードが遅い（3秒以上）

**原因:** WASMバイナリとデータベースのサイズが大きい

**改善方法:**

1. **gzip圧縮を有効化:**
   ```nginx
   # nginx設定例
   gzip on;
   gzip_types application/wasm application/javascript;
   ```

2. **CDNを使用:**
   - CloudFlare
   - AWS CloudFront
   など

3. **プリロード:**
   ```html
   <link rel="preload" href="/dist/farert.wasm" as="fetch" crossorigin>
   <link rel="preload" href="/dist/farert.data" as="fetch" crossorigin>
   ```

4. **Service Worker でキャッシュ:**
   ```typescript
   // PWA Service Worker
   self.addEventListener('install', (event) => {
     event.waitUntil(
       caches.open('farert-v1').then((cache) => {
         return cache.addAll([
           '/dist/farert.js',
           '/dist/farert.wasm',
           '/dist/farert.data'
         ]);
       })
     );
   });
   ```

---

### 問題: メモリ使用量が多い

**原因:** Farertインスタンスの作り過ぎ

**解決方法:**

```typescript
// ❌ 避けるべき
function calculateFare(from: string, to: string) {
  const farert = new Farert(); // 毎回作成
  farert.addStartRoute(from);
  farert.addRoute('東海道本線', to);
  return farert.showFare();
}

// ✅ 推奨
class FareCalculator {
  private farert: Farert;

  constructor() {
    this.farert = new Farert();
  }

  calculateFare(from: string, to: string) {
    this.farert.removeAll(); // 再利用
    this.farert.addStartRoute(from);
    this.farert.addRoute('東海道本線', to);
    return this.farert.showFare();
  }
}
```

---

## 開発環境の問題

### Dev Container が起動しない

**原因1:** Dockerが起動していない

**解決方法:**
```bash
# Dockerを起動
docker ps

# エラーが出る場合、Docker Desktopを起動
```

---

**原因2:** emsdkディレクトリが見つからない

**解決方法:**
```bash
# emsdkをクローン
cd ..
git clone https://github.com/emscripten-core/emsdk.git
cd farert-wasm

# VS Codeを再起動
```

---

**原因3:** Dev Container拡張機能がインストールされていない

**解決方法:**
```
VS Code → Extensions → "Dev Containers" で検索してインストール
```

---

### ホットリロードが動作しない

**原因:** WASMはホットリロード非対応

**解決方法:**

WASMを変更した場合、ブラウザを手動でリロード：

```bash
# WASMビルド後
npm run build:wasm

# ブラウザで Ctrl+Shift+R (強制リロード)
```

TypeScriptのみの変更ならホットリロード可能:

```bash
npm run build:ts -- --watch
```

---

## よくある質問

### Q: `farert.wasm` のサイズを小さくできますか？

**A:** 可能です。いくつかの方法があります：

1. **未使用機能の削除** (上級者向け)
   ```cmake
   # CMakeLists.txt
   add_compile_definitions(
     SQLITE_OMIT_DEPRECATED
     SQLITE_OMIT_PROGRESS_CALLBACK
     # など
   )
   ```

2. **最適化レベルの変更**
   ```cmake
   set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Oz")  # -O3 から -Oz に
   ```

3. **gzip圧縮** (最も効果的)
   - サーバー側で自動圧縮
   - 約50-70%削減

---

### Q: TypeScriptの型が効かない

**A:** 型定義ファイルを確認：

```bash
# 型定義ファイルが存在するか
ls src/ts/types/*.d.ts

# tsconfig.json を確認
cat tsconfig.json
# "strict": true が設定されているか
```

再ビルド:
```bash
npm run build:ts
```

---

### Q: Safari/iOS で動作しない

**A:** Safari はWASMをサポートしていますが、古いバージョンでは一部機能が制限されます。

**確認:**
- Safari 11.1+ が必要
- iOS 11.3+ が必要

**デバッグ:**
```javascript
// Safari Web Inspector で確認
console.log(typeof WebAssembly); // "object" であるべき
```

---

### Q: 複数の経路を同時に計算したい

**A:** 複数の `Farert` インスタンスを作成可能：

```typescript
await initFarert();

const route1 = new Farert();
route1.addStartRoute('東京');
route1.addRoute('東海道本線', '大阪');

const route2 = new Farert();
route2.addStartRoute('大阪');
route2.addRoute('東海道本線', '東京');

console.log(route1.showFare());
console.log(route2.showFare());
```

---

### Q: 本番環境でエラーログを収集したい

**A:** エラーハンドリングを追加：

```typescript
try {
  await initFarert();
} catch (error) {
  // エラーログサービスに送信
  console.error('WASM init failed:', error);
  // Sentry, LogRocket など
}
```

---

## サポート

上記で解決しない場合：

1. **GitHub Issue を作成:**
   https://github.com/farert/farert-wasm/issues

2. **以下の情報を含めてください:**
   - OS/ブラウザバージョン
   - Node.jsバージョン (`node --version`)
   - Emscriptenバージョン (`emcc --version`)
   - エラーメッセージ全文
   - 再現手順

3. **既存のIssueを検索:**
   同じ問題が報告されていないか確認

---

## デバッグTips

### WASMデバッグビルド

```bash
# CMakeLists.txt に追加
set(CMAKE_BUILD_TYPE Debug)
set(CMAKE_CXX_FLAGS_DEBUG "-g -O0")

# リビルド
rm -rf build
npm run build:wasm
```

### ブラウザDevToolsでデバッグ

```javascript
// C++関数を直接呼び出す
const module = await import('./dist/farert.js');
const wasmModule = await module.default();

// WASM関数を実行
wasmModule._some_cpp_function();
```

### メモリ使用量の確認

```javascript
if (performance.memory) {
  console.log('Used:', performance.memory.usedJSHeapSize);
  console.log('Total:', performance.memory.totalJSHeapSize);
}
```

### SQLデバッグ（開発者向け）

データベースの内容を直接確認できます：

```typescript
import { executeSql } from 'farert-wasm';

// テーブル一覧を確認
const tables = executeSql("SELECT name FROM sqlite_master WHERE type='table'");
console.log(JSON.parse(tables));

// 駅データを確認
const stations = executeSql("SELECT * FROM t_station WHERE name='東京'");
console.log(JSON.parse(stations));

// テーブルスキーマを確認
const schema = executeSql("PRAGMA table_info(t_station)");
console.log(JSON.parse(schema));

// レコード数を確認
const count = executeSql("SELECT COUNT(*) FROM t_station");
console.log('Total stations:', JSON.parse(count).rows[0][0]);
```

**主要テーブル:**
- `t_station` - 駅マスタ
- `t_line` - 路線マスタ
- `t_company` - JR会社マスタ
- `t_prefecture` - 都道府県マスタ

詳細は [docs/API.md](API.md#開発者ツール) を参照してください。
