// ビューア(index.html)の純粋関数(DOM 非依存)の回帰テスト。
//
// index.html は「1ファイル完結」の方針なので分割しない。代わりにこのテストが
// <script> ブロックを抽出し、Node の vm サンドボックスで評価して関数を取り出す。
// トップレベルの副作用は末尾の `if (typeof window !== 'undefined')` だけで、
// サンドボックスには window を渡さないため boot() は走らず、関数定義だけが得られる。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// src 属性のない <script> をすべて拾い、アプリ本体(parseEntry を含む塊)を選ぶ。
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
const appCode = inlineScripts.find((s) => s.includes('function parseEntry'));
assert.ok(appCode, 'index.html から parseEntry を含む <script> を抽出できませんでした');

const sandbox = {};
vm.createContext(sandbox);
// 末尾で必要な関数を globalThis(=sandbox) に露出する。const/function とも同一スコープなので参照できる。
vm.runInContext(
  appCode + '\n;globalThis.__test = { parseEntry, isoMonday, isoWeekOf, stripHiddenSections };',
  sandbox,
);
const { parseEntry, isoMonday, isoWeekOf, stripHiddenSections } = sandbox.__test;

const DAYS = ['日', '月', '火', '水', '木', '金', '土'];

test('parseEntry: 日付ファイルを date として解釈する', () => {
  const e = parseEntry('digests/2026/08/ai-news-2026-08-02.md');
  assert.equal(e.kind, 'date');
  assert.equal(e.id, '2026-08-02');
  assert.equal(e.ymd, '2026-08-02');
  assert.equal(e.bucket, '2026-08');
  assert.equal(e.sort, '20260802');
  const expected = DAYS[new Date(Date.UTC(2026, 7, 2)).getUTCDay()] + '曜日';
  assert.equal(e.sub, expected);
});

test('parseEntry: 04/05 形式(ai-news- を含まない/日次接頭辞つき)も date になる', () => {
  // 旧実装が全件スキップして 0 件表示になっていた回帰の防止
  assert.equal(parseEntry('daily/2026/ai-news-daily-2026-08-02.md').kind, 'date');
  assert.equal(parseEntry('weekly/2026/2026-08-02.md').kind, 'date');
});

test('parseEntry: 週次ファイルを week として解釈する', () => {
  const e = parseEntry('weekly/2026/ai-news-2026-W30.md');
  assert.equal(e.kind, 'week');
  assert.equal(e.y, 2026);
  assert.equal(e.wk, 30);
});

test('parseEntry: 判定不能なファイルは捨てず other にする', () => {
  const e = parseEntry('digests/README.md');
  assert.equal(e.kind, 'other');
  assert.equal(e.sort, '00000000');
});

test('isoMonday は必ず月曜(getUTCDay()===1)を返す', () => {
  for (const wk of [1, 15, 30, 52]) {
    assert.equal(isoMonday(2026, wk).getUTCDay(), 1, `week ${wk}`);
  }
});

test('isoWeekOf は 1..53 の妥当な週番号を返す', () => {
  const w = isoWeekOf(new Date(Date.UTC(2026, 6, 27)));
  assert.equal(w.year, 2026);
  assert.equal(typeof w.week, 'number');
  assert.ok(w.week >= 1 && w.week <= 53);
});

test('isoMonday と isoWeekOf は往復で整合する', () => {
  for (const wk of [1, 10, 30, 52]) {
    const mon = isoMonday(2026, wk);
    const back = isoWeekOf(mon);
    assert.equal(back.week, wk, `week ${wk}`);
  }
});

test('stripHiddenSections は「改善メモ」節を次の ## まで除去する', () => {
  const md = '# T\n\n本文\n\n## 改善メモ\n\n- x\n\n## 次の節\n\nのこす';
  const out = stripHiddenSections(md);
  assert.ok(!out.includes('改善メモ'), '改善メモ 節が残っている');
  assert.ok(out.includes('## 次の節'));
  assert.ok(out.includes('のこす'));
  assert.ok(out.includes('本文'));
});

test('stripHiddenSections は「欠損ファイル通知」節を除去する', () => {
  const md = '# T\n\n本文\n\n## ⚠️ 欠損ファイル通知\n\n- x\n\n## 次\n\nY';
  const out = stripHiddenSections(md);
  assert.ok(!out.includes('欠損ファイル通知'));
  assert.ok(out.includes('## 次'));
  assert.ok(out.includes('Y'));
});
