// 注目予定の日付が、週トグル・月トグル・時期トグルのどれに入るかを検査する。
// 実行: node --test tests/*.test.mjs
// scripts/test-schedule-labels.py は「N月N日」の正規表現が汎用の「N月」より前にあることだけを見る。
// parseScheduleLabel / schedAnchor 自体は呼ばないので、ISO や M/D の戻りが壊れても合格してしまう。
// ここは index.html の関数をそのまま呼び、日付列とトグル種別がずれないことを固定する。
// 「2027年1月14日」「2027-03-01 以降」は別 PR の未修正なので、ここでは期待値にしない。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const {
  parseScheduleLabel, schedAnchor, deadlineFrom, looksLikeScheduleLabel, weekTitle, state,
} = Function(
  `${script}\nreturn { parseScheduleLabel, schedAnchor, deadlineFrom, looksLikeScheduleLabel, weekTitle, state };`,
)();

const DIGEST_ID = '2026-11-18';
const DIGEST = new Date(2026, 10, 18);

function placed(raw, activeId = DIGEST_ID) {
  state.activeId = activeId;
  const parsed = parseScheduleLabel(raw);
  const [y, m, d] = activeId.slice(0, 10).split('-').map(Number);
  return { parsed, anchor: schedAnchor(parsed, new Date(y, m - 1, d)) };
}

test('ISO と M/D の日付は週トグルに入る日として残る', () => {
  const cases = [
    ['2026-03-01', { day: '3/1', quals: [], year: 2026 }, { kind: 'day', y: 2026, m: 3, d: 1 }],
    ['2027-03-01', { day: '3/1', quals: ['2027'], year: 2027 }, { kind: 'day', y: 2027, m: 3, d: 1 }],
    ['2027-03-01〜', { day: '3/1', quals: ['2027', '以降'], year: 2027 }, { kind: 'day', y: 2027, m: 3, d: 1 }],
    ['2026-11-12 〜 ・ 11-19 〜', { day: '11/12', quals: ['以降', '・11/19'], year: 2026 }, { kind: 'day', y: 2026, m: 11, d: 12 }],
    ['11/24', { day: '11/24', quals: [], year: null }, { kind: 'day', y: 2026, m: 11, d: 24 }],
    ['11/24〜', { day: '11/24', quals: ['以降'], year: null }, { kind: 'day', y: 2026, m: 11, d: 24 }],
    ['11/24 以降', { day: '11/24', quals: ['以降'], year: null }, { kind: 'day', y: 2026, m: 11, d: 24 }],
    ['11/24–11/30', { day: '11/24', quals: ['–11/30'], year: null }, { kind: 'day', y: 2026, m: 11, d: 24 }],
    ['11/24-30', { day: '11/24', quals: ['–11/30'], year: null }, { kind: 'day', y: 2026, m: 11, d: 24 }],
    ['10月9日', { day: '10/9', quals: [], year: null }, { kind: 'day', y: 2026, m: 10, d: 9 }],
    ['10月9日〜', { day: '10/9', quals: ['以降'], year: null }, { kind: 'day', y: 2026, m: 10, d: 9 }],
    ['10月29〜30日', { day: '10/29', quals: ['–10/30'], year: null }, { kind: 'day', y: 2026, m: 10, d: 29 }],
  ];
  for (const [raw, parsed, anchor] of cases) {
    assert.deepEqual(placed(raw), { parsed, anchor }, raw);
  }
});

test('月・年・時期だけのラベルは週トグルに入らない', () => {
  const cases = [
    ['10月', { kind: 'month', y: 2026, m: 10 }],
    ['11月末', { kind: 'month', y: 2026, m: 11 }],
    ['2026-11', { kind: 'month', y: 2026, m: 11 }],
    ['2026-11〜', { kind: 'month', y: 2026, m: 11 }],
    ['2027年1月', { kind: 'month', y: 2027, m: 1 }],
    ['2027年1月中旬〜下旬', { kind: 'month', y: 2027, m: 1 }],
    ['2027', { kind: 'year', y: 2027 }],
    ['2027年末', { kind: 'year', y: 2027 }],
    ['今冬', { kind: 'period', y: 2026, label: '今冬' }],
    ['年内', { kind: 'period', y: 2026, label: '年内' }],
    ['', { kind: 'period', y: 2026, label: '時期' }],
  ];
  for (const [raw, anchor] of cases) {
    const got = placed(raw);
    assert.equal(got.parsed.day, '', raw);
    assert.deepEqual(got.anchor, anchor, raw);
  }
});

test('週の見出しはダイジェストの週からの距離で決まる', () => {
  const titles = [
    ['2026-11-16', '今週'],
    ['2026-11-23', '来週'],
    ['2026-11-30', '再来週'],
    ['2026-11-09', '先週'],
    ['2026-12-14', '12/14–12/20'],
    ['2027-01-04', '2027 1/4–1/10'],
  ];
  for (const [iso, title] of titles) {
    const [y, m, d] = iso.split('-').map(Number);
    assert.equal(weekTitle(new Date(y, m - 1, d), DIGEST), title, iso);
  }
});

test('週次の「日付: 本文」だけを日付ラベルとみなす', () => {
  for (const s of ['9/21', '2027-03-01', '10月9日', 'Q1', '今冬']) {
    assert.equal(looksLikeScheduleLabel(s), true, s);
  }
  for (const s of ['Gemini', 'ハイライト', '']) {
    assert.equal(looksLikeScheduleLabel(s), false, s);
  }
});

test('期限チップはファイル日より後の最も早い日を採る', () => {
  assert.deepEqual(deadlineFrom('12/1 と 2027-03-01', '2026-11-18'), { ymd: '2026-12-01', precision: 'day' });
  assert.deepEqual(deadlineFrom('2026-12-01 と 2026-11-20', '2026-11-18'), { ymd: '2026-11-20', precision: 'day' });
  assert.deepEqual(deadlineFrom('11月30日と 12月', '2026-11-18'), { ymd: '2026-11-30', precision: 'day' });
  assert.deepEqual(deadlineFrom('10/22 は過ぎた。12月に再開', '2026-11-18'), { ymd: '2026-12-01', precision: 'month' });
  assert.deepEqual(deadlineFrom('12/1 と 12月', '2026-11-18'), { ymd: '2026-12-01', precision: 'day' });
  assert.equal(deadlineFrom('3月1日', '2026-11-18'), null);
  assert.equal(deadlineFrom('v1.4.230 のみ', '2026-11-18'), null);
  assert.equal(deadlineFrom('13/40 は無効。11月は今月', '2026-11-18'), null);
  assert.equal(deadlineFrom('12/1', ''), null);
});
