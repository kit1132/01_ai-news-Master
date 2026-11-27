// 注目予定の日付ラベルが週トグルに残ることを検査する。
// 実行: node --test tests/*.test.mjs
// 2026-11-27 のダイジェストは「2027-03-01 以降」を使う。
// 「YYYY-MM-DD〜」だけを日として読むと、この行は日付が消え、
// 2026年末の時期トグルへ埋まる。
// 「YYYY年M月D日」も汎用の「YYYY年M月」に吸われると日が落ち、月トグルになる。
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

function placed(raw, activeId = '2026-11-27') {
  state.activeId = activeId;
  const parsed = parseScheduleLabel(raw);
  const [y, m, d] = activeId.slice(0, 10).split('-').map(Number);
  return { parsed, anchor: schedAnchor(parsed, new Date(y, m - 1, d)) };
}

test('ISO の「以降」は波ダッシュと同じく日として残る', () => {
  const day = { day: '3/1', quals: ['2027', '以降'], year: 2027 };
  const anchor = { kind: 'day', y: 2027, m: 3, d: 1 };
  for (const raw of ['2027-03-01 以降', '2027-03-01以降', '2027-03-01〜']) {
    assert.deepEqual(placed(raw), { parsed: day, anchor }, raw);
  }
});

test('年付きの「N月N日」は月トグルに潰さない', () => {
  assert.deepEqual(placed('2027年1月14日'), {
    parsed: { day: '1/14', quals: ['2027'], year: 2027 },
    anchor: { kind: 'day', y: 2027, m: 1, d: 14 },
  });
  assert.deepEqual(placed('2027年1月14日〜'), {
    parsed: { day: '1/14', quals: ['2027', '以降'], year: 2027 },
    anchor: { kind: 'day', y: 2027, m: 1, d: 14 },
  });
  assert.deepEqual(placed('2026年11月30日'), {
    parsed: { day: '11/30', quals: [], year: 2026 },
    anchor: { kind: 'day', y: 2026, m: 11, d: 30 },
  });
});

test('日の無い年月ラベルは月トグルのまま', () => {
  assert.equal(placed('2026年11月中').parsed.day, '');
  assert.deepEqual(placed('2026年11月中').anchor, { kind: 'month', y: 2026, m: 11 });
  assert.equal(placed('2027年2月').parsed.day, '');
  assert.deepEqual(placed('2027年2月').anchor, { kind: 'month', y: 2027, m: 2 });
});
