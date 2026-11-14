// 注目予定の ISO 日付（YYYY-MM-DD）に「以降」などの接尾辞が付いても日付列に残す。
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

state.activeId = '2026-11-14';
const digest = new Date(2026, 10, 14);

function classified(raw) {
  const parsed = parseScheduleLabel(raw);
  return { parsed, anchor: schedAnchor(parsed, digest) };
}

test('ISO 日付そのものは日付列と週トグルへ入る', () => {
  const { parsed, anchor } = classified('2027-03-08');
  assert.equal(parsed.day, '3/8');
  assert.equal(parsed.year, 2027);
  assert.equal(anchor.kind, 'day');
  assert.deepEqual({ y: anchor.y, m: anchor.m, d: anchor.d }, { y: 2027, m: 3, d: 8 });
});

test('2027-03-01 以降 は Gems 廃止日を時期トグルへ埋めない', () => {
  const { parsed, anchor } = classified('2027-03-01 以降');
  assert.equal(parsed.day, '3/1');
  assert.equal(parsed.year, 2027);
  assert.ok(parsed.quals.includes('以降'));
  assert.equal(anchor.kind, 'day');
  assert.deepEqual({ y: anchor.y, m: anchor.m, d: anchor.d }, { y: 2027, m: 3, d: 1 });
});

test('空白無しの 以降 と まで も日付を残す', () => {
  for (const [raw, extra] of [['2027-03-01以降', '以降'], ['2027-04-01 まで', 'まで']]) {
    const { parsed, anchor } = classified(raw);
    assert.equal(parsed.day, raw.startsWith('2027-03') ? '3/1' : '4/1', raw);
    assert.ok(parsed.quals.includes(extra), raw);
    assert.equal(anchor.kind, 'day', raw);
  }
});

test('波ダッシュ終わりの ISO 日付は従来どおり 以降 にする', () => {
  const { parsed, anchor } = classified('2027-03-01〜');
  assert.equal(parsed.day, '3/1');
  assert.ok(parsed.quals.includes('以降'));
  assert.equal(anchor.kind, 'day');
});

test('M/D の 以降 は従来どおり日付列に載る', () => {
  const { parsed, anchor } = classified('11/24 以降');
  assert.equal(parsed.day, '11/24');
  assert.ok(parsed.quals.includes('以降'));
  assert.equal(anchor.kind, 'day');
  assert.equal(anchor.y, 2026);
});
