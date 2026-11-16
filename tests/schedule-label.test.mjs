// 注目予定の日付ラベル（parseScheduleLabel / schedAnchor）。
// 実行: node --test tests/*.test.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const { parseScheduleLabel, schedAnchor, state } = Function(
  `${script}\nreturn { parseScheduleLabel, schedAnchor, state };`,
)();

state.activeId = '2026-11-06';
const digest = new Date(2026, 10, 6);

function classified(raw) {
  const parsed = parseScheduleLabel(raw);
  return { parsed, anchor: schedAnchor(parsed, digest) };
}

test('年付きの N月N日 は日付列に日を残し、週トグルへ入れる', () => {
  const { parsed, anchor } = classified('2027年1月14日');
  assert.equal(parsed.day, '1/14');
  assert.equal(parsed.year, 2027);
  assert.equal(anchor.kind, 'day');
  assert.deepEqual({ y: anchor.y, m: anchor.m, d: anchor.d }, { y: 2027, m: 1, d: 14 });
});

test('industry 11-06 の API 廃止日が月トグルへ埋まらない', () => {
  const cases = [
    ['2027年1月14日', 1, 14],
    ['2027年1月30日', 1, 30],
    ['2027年2月1日', 2, 1],
  ];
  for (const [raw, month, day] of cases) {
    const { parsed, anchor } = classified(raw);
    assert.equal(parsed.day, `${month}/${day}`, raw);
    assert.equal(anchor.kind, 'day', raw);
    assert.equal(anchor.m, month, raw);
    assert.equal(anchor.d, day, raw);
  }
});

test('年付きの N月N〜M日 も日付列に日を残す', () => {
  const { parsed, anchor } = classified('2027年1月14〜16日');
  assert.equal(parsed.day, '1/14');
  assert.ok(parsed.quals.includes('–1/16'));
  assert.equal(anchor.kind, 'day');
  assert.equal(anchor.d, 14);
});

test('年付きの月だけ・月の中旬はこれまで通り月トグル', () => {
  assert.equal(classified('2027年1月').anchor.kind, 'month');
  assert.equal(classified('2027年1月').parsed.day, '');
  assert.equal(classified('2027年1月中旬〜下旬').anchor.kind, 'month');
  assert.equal(classified('2027年1月中旬〜下旬').parsed.day, '');
});

test('年の無い N月N日 は従来どおり日付列に載る', () => {
  const { parsed, anchor } = classified('11月9日');
  assert.equal(parsed.day, '11/9');
  assert.equal(anchor.kind, 'day');
  assert.equal(anchor.y, 2026);
  assert.equal(anchor.d, 9);
});
