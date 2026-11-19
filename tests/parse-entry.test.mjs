// ファイル一覧（parseEntry）と、本文から運用節を除く処理を検査する。
// 実行: node --test tests/*.test.mjs
// 旧正規表現は 04（ai-news- を含まない週次）と 05（ai-news-daily-）に一致せず、
// 一覧が無言で 0 件になっていた。判定不能なパスも捨てない。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const {
  parseEntry,
  isoMonday,
  weekBucketOf,
  sideWeekLabel,
  weekRangeLabel,
  badgeOf,
  stripHiddenSections,
} = Function(
  `${script}\nreturn { parseEntry, isoMonday, weekBucketOf, sideWeekLabel, weekRangeLabel, badgeOf, stripHiddenSections };`,
)();

const ymd = (d) => d.toISOString().slice(0, 10);

test('05 とダイジェストの日付パスを一覧に残す', () => {
  const daily = parseEntry('daily/2026/ai-news-daily-2026-11-19.md');
  assert.equal(daily.kind, 'date');
  assert.equal(daily.id, '2026-11-19');
  assert.equal(daily.ymd, '2026-11-19');
  assert.equal(daily.bucket, '2026-11');
  assert.equal(daily.label, '11/19 木');
  assert.equal(daily.sort, '20261119');

  const digest = parseEntry('digests/2026/11/ai-news-2026-11-19.md');
  assert.equal(digest.kind, 'date');
  assert.equal(digest.id, '2026-11-19');
  assert.equal(digest.label, '11/19 木');
});

test('週番号が1桁でも id はゼロ埋めで、年ディレクトリ直下だけを週として読む', () => {
  const now = Date.now;
  Date.now = () => Date.parse('2026-11-19T03:00:00Z');
  try {
    const week = parseEntry('weekly/2026/week-W46.md');
    assert.equal(week.kind, 'week');
    assert.equal(week.id, '2026-W46');
    assert.equal(week.fullLabel, '2026-W46');
    assert.equal(ymd(week.mon), '2026-11-09');
    assert.equal(week.bucket, '2026-11');
    assert.equal(week.sort, '20261109');

    const short = parseEntry('weekly/2026/week-W9.md');
    assert.equal(short.id, '2026-W09');
    assert.equal(ymd(short.mon), '2026-02-23');

    const nested = parseEntry('weekly/2026/notes/week-W46.md');
    assert.equal(nested.kind, 'other');
    assert.equal(nested.id, 'weekly/2026/notes/week-W46.md');
  } finally {
    Date.now = now;
  }
});

test('日付に見えないパスは捨てず、一覧の末尾に残す', () => {
  const other = parseEntry('notes/readme.md');
  assert.equal(other.kind, 'other');
  assert.equal(other.id, 'notes/readme.md');
  assert.equal(other.label, 'readme.md');
  assert.equal(other.sub, '日付を判定できません');
  assert.equal(other.sort, '00000000');
  assert.equal(other.bucket, 'unknown');
});

test('1日を含む週は、月曜が前月でもその月の1週になる', () => {
  const sep = isoMonday(2026, 36); // 2026-08-31、9/1 を含む
  assert.equal(ymd(sep), '2026-08-31');
  assert.equal(weekBucketOf(sep), '2026-09');
  assert.equal(sideWeekLabel(sep, '2026-09'), '1週');
  assert.equal(weekRangeLabel(sep), '8/31–9/6');

  const aug = isoMonday(2026, 31); // 2026-07-27、8/1 を含む
  assert.equal(ymd(aug), '2026-07-27');
  assert.equal(weekBucketOf(aug), '2026-08');
  assert.equal(sideWeekLabel(aug, '2026-08'), '1週');
  assert.equal(weekRangeLabel(aug), '7/27–8/2');

  const sepSecond = isoMonday(2026, 37);
  assert.equal(ymd(sepSecond), '2026-09-07');
  assert.equal(weekBucketOf(sepSecond), '2026-09');
  assert.equal(sideWeekLabel(sepSecond, '2026-09'), '2週');
});

test('ディレクトリ年が1年先の週だけを戻し、14日以内の次週は戻さない', () => {
  const now = Date.now;
  Date.now = () => Date.parse('2026-11-19T03:00:00Z');
  try {
    const next = parseEntry('weekly/2026/week-W48.md');
    assert.equal(next.id, '2026-W48');
    assert.equal(ymd(next.mon), '2026-11-23');
    assert.equal(next.bucket, '2026-11');

    const ahead = parseEntry('weekly/2027/week-W47.md');
    assert.equal(ahead.id, '2026-W47');
    assert.equal(ahead.y, 2026);
    assert.equal(ahead.wk, 47);
    assert.equal(ymd(ahead.mon), '2026-11-16');
    assert.equal(ahead.bucket, '2026-11');
  } finally {
    Date.now = now;
  }
});

test('今日バッジは日付の当日と、週の途中と日曜で分かれる', () => {
  const now = Date.now;
  try {
    Date.now = () => Date.parse('2026-11-19T03:00:00Z');
    const today = parseEntry('daily/2026/ai-news-daily-2026-11-19.md');
    const yesterday = parseEntry('daily/2026/ai-news-daily-2026-11-18.md');
    const thisWeek = parseEntry('weekly/2026/week-W47.md');
    const lastWeek = parseEntry('weekly/2026/week-W46.md');
    assert.deepEqual(badgeOf(today), { cls: 'b-today', text: '今日' });
    assert.equal(badgeOf(yesterday), null);
    assert.deepEqual(badgeOf(thisWeek), { cls: 'b-part', text: '今週(途中)' });
    assert.equal(badgeOf(lastWeek), null);

    Date.now = () => Date.parse('2026-11-21T16:00:00Z'); // 2026-11-22 01:00 JST
    assert.deepEqual(badgeOf(parseEntry('daily/2026/ai-news-daily-2026-11-22.md')), { cls: 'b-today', text: '今日' });
    assert.deepEqual(badgeOf(thisWeek), { cls: 'b-week', text: '今週' });
  } finally {
    Date.now = now;
  }
});

test('改善メモと欠損ファイル通知だけを除き、前後の節は残す', () => {
  const md = [
    '# AI News Daily Summary — 2026-11-19',
    '',
    '## 今日のハイライト',
    '',
    '- [新機能] **残す項目** — 本文。',
    '',
    '## 改善メモ',
    '',
    '- B-090 の内部メモは出さない',
    '',
    '## カテゴリ別まとめ',
    '',
    '- [新機能] **カテゴリも残す**',
    '',
    '## ⚠️ 欠損ファイル通知',
    '',
    '- daily/2026/missing.md',
    '',
    '## 末尾',
    '',
    '- 末尾も残す',
    '',
  ].join('\n');

  const got = stripHiddenSections(md);
  assert.match(got, /残す項目/);
  assert.match(got, /カテゴリも残す/);
  assert.match(got, /末尾も残す/);
  assert.doesNotMatch(got, /改善メモ/);
  assert.doesNotMatch(got, /B-090/);
  assert.doesNotMatch(got, /欠損ファイル通知/);
  assert.doesNotMatch(got, /missing\.md/);
  assert.match(got, /^## カテゴリ別まとめ/m);
  assert.match(got, /^## 末尾/m);
});

test('本文中の「改善メモ」と、末尾だけの運用節では本文を消さない', () => {
  const body = [
    '# 題',
    '',
    '本文に改善メモという言葉がある。',
    '',
    '## 通常',
    '',
    '残る。',
  ].join('\n');
  const kept = stripHiddenSections(body);
  assert.match(kept, /改善メモという言葉/);
  assert.match(kept, /^## 通常/m);
  assert.match(kept, /残る。/);

  const trailing = ['# 題', '', '本文。', '', '## 改善メモ', '', 'secret'].join('\n');
  const stripped = stripHiddenSections(trailing);
  assert.match(stripped, /本文。/);
  assert.doesNotMatch(stripped, /secret/);
  assert.doesNotMatch(stripped, /改善メモ/);

  const emoji = ['# 題', '', '## ⚠️欠損ファイル通知', '', 'gone', '', '## 次', '', 'stay'].join('\n');
  const after = stripHiddenSections(emoji);
  assert.doesNotMatch(after, /gone/);
  assert.match(after, /^## 次/m);
  assert.match(after, /stay/);
});
