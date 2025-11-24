/**
 * executeSql() 動作確認スクリプト
 */

import { initFarert, executeSql } from '../dist/index.js';

console.log('=== FARERT WASM - executeSql Test ===\n');

// 初期化
console.log('初期化中...');
await initFarert();
console.log('✓ 初期化完了\n');

// テスト1: t_station テーブルから東京駅を検索
console.log('【テスト1】 t_station テーブルから東京駅を検索');
console.log('SQL: SELECT * FROM t_station WHERE name=\'東京\' LIMIT 3');
const result1 = executeSql("SELECT * FROM t_station WHERE name='東京' LIMIT 3");
const data1 = JSON.parse(result1);
console.log('結果:');
console.log('  Columns:', data1.columns);
console.log('  Rows:', data1.rows);
console.log('  Row count:', data1.rowCount);
console.log('');

// テスト2: テーブル一覧を取得
console.log('【テスト2】 テーブル一覧を取得');
console.log('SQL: SELECT name FROM sqlite_master WHERE type=\'table\' LIMIT 10');
const result2 = executeSql("SELECT name FROM sqlite_master WHERE type='table' LIMIT 10");
const data2 = JSON.parse(result2);
console.log('テーブル一覧:');
data2.rows.forEach(row => {
  console.log('  -', row[0]);
});
console.log('');

// テスト3: t_station のレコード数を確認
console.log('【テスト3】 t_station のレコード数を確認');
console.log('SQL: SELECT COUNT(*) FROM t_station');
const result3 = executeSql("SELECT COUNT(*) FROM t_station");
const data3 = JSON.parse(result3);
console.log('t_station レコード数:', data3.rows[0][0]);
console.log('');

// テスト4: エラーケース（不正なSQL）
console.log('【テスト4】 エラーケース（不正なSQL）');
console.log('SQL: SELEC * FROM t_station');
const result4 = executeSql("SELEC * FROM t_station");
const data4 = JSON.parse(result4);
if (data4.error) {
  console.log('✓ エラーが正しく返されました:', data4.error);
} else {
  console.log('✗ エラーが返されませんでした');
}
console.log('');

console.log('=== テスト完了 ===');
