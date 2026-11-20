// 更新タグの分解と、カテゴリ／ハイライトで出すチップを検査する。
// 実行: node --test tests/*.test.mjs
// 2026-11 のダイジェストは [新機能] を [料金+新機能] に直している。
// ビューアが副タグを落としたり、チップを出さない語を出したりすると、一覧の意味が変わる。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const { parseTagValue, visibleTags, deadlineFrom, pieceParsedTag, stripKnownTag, stripPieceToken } = Function(
  `${script}\nreturn { parseTagValue, visibleTags, deadlineFrom, pieceParsedTag, stripKnownTag, stripPieceToken };`,
)();

test('複合タグは主と副に分かれる。3語・未知語・空は無視する', () => {
  assert.deepEqual(parseTagValue('料金+新機能'), { primary: '料金', secondary: '新機能' });
  assert.deepEqual(parseTagValue('料金 + 新機能'), { primary: '料金', secondary: '新機能' });
  assert.deepEqual(parseTagValue('新機能'), { primary: '新機能', secondary: '' });
  assert.equal(parseTagValue('料金+新機能+仕様'), null);
  assert.equal(parseTagValue('不明'), null);
  assert.equal(parseTagValue(''), null);
});

test('カテゴリの [料金+新機能] は料金だけ。ハイライトは両方出す', () => {
  assert.deepEqual(visibleTags('料金', '新機能', 'category', false), ['料金']);
  assert.deepEqual(visibleTags('料金', '新機能', 'highlight', false), ['料金', '新機能']);
});

test('カテゴリの副タグは料金と破壊的変更だけ足す', () => {
  assert.deepEqual(visibleTags('破壊的変更', '料金', 'category', false), ['破壊的変更', '料金']);
  assert.deepEqual(visibleTags('新機能', '予定', 'category', false), ['新機能']);
  assert.deepEqual(visibleTags('新機能', '予定', 'category', true), ['新機能', '予定']);
});

test('チップを出さない語と、全タグオフの中立語は空', () => {
  assert.deepEqual(visibleTags('版更新', '', 'highlight', false), []);
  assert.deepEqual(visibleTags('据え置き', '観測', 'highlight', true), []);
  assert.deepEqual(visibleTags('仕様', '', 'category', false), []);
  assert.deepEqual(visibleTags('仕様', '', 'category', true), ['仕様']);
});

test('同じ語の副は重ねない', () => {
  assert.deepEqual(visibleTags('料金', '料金', 'highlight', false), ['料金']);
});

test('見出しと項目の先頭タグを読む。未知の括弧は残す', () => {
  assert.deepEqual(
    pieceParsedTag('### 1. [料金+新機能] MAI Code 2 — 従量課金になる'),
    { primary: '料金', secondary: '新機能' },
  );
  assert.deepEqual(pieceParsedTag('- [新機能] **Title** — body'), { primary: '新機能', secondary: '' });
  assert.equal(pieceParsedTag('タグの無い行'), null);
  assert.equal(stripKnownTag('  [料金+新機能] MAI Code 2'), 'MAI Code 2');
  assert.equal(stripKnownTag('[不明] 残す'), '[不明] 残す');
  assert.equal(stripPieceToken('- [料金+新機能] **MAI** — 本文'), '- **MAI** — 本文');
});

test('期限はファイル日より後の最も早い日。月だけの未来は1日', () => {
  assert.deepEqual(deadlineFrom('10月9日', '2026-10-01'), { ymd: '2026-10-09', precision: 'day' });
  assert.equal(deadlineFrom('10月9日', '2026-10-09'), null);
  assert.deepEqual(deadlineFrom('11月', '2026-10-05'), { ymd: '2026-11-01', precision: 'month' });
  assert.equal(deadlineFrom('10月', '2026-10-05'), null);
  assert.deepEqual(
    deadlineFrom('公開は 2026-11-17。説明は 10月9日', '2026-10-01'),
    { ymd: '2026-10-09', precision: 'day' },
  );
  assert.deepEqual(deadlineFrom('11/17 に開始', '2026-11-01'), { ymd: '2026-11-17', precision: 'day' });
  assert.equal(deadlineFrom('13/40', '2026-11-01'), null);
});

test('日の範囲は月だけの期限に潰さない', () => {
  // parseScheduleLabel が「10月29〜30日」の開始日を持つ。deadlineFrom は月へ落とさない。
  assert.equal(deadlineFrom('10月29〜30日', '2026-09-30'), null);
});
