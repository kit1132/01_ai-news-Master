// ハイライト参照の2表記を検査する。
// 2026-10-19: 規約の「（ハイライトN参照）」に加え、生成側の「（ハイライト参照・N）」も
// カテゴリページへの取り込みと、参照行へのタグ継承の対象になった。
// 実行: node --test tests/highlight-ref.test.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const { extractCategoryDay, catHlRefs, stubNum } = Function(
  `${script}\nreturn { extractCategoryDay, catHlRefs, stubNum };`,
)();

// ハイライト本文にカテゴリ語を置かない。参照が無いと、どのカテゴリページにも出ない。
function digest(item) {
  return `# AI News Daily Summary — 2026-10-19

## 今日のハイライト

### 1. [仕様] 棚番の付け方を変える — 現場の手順

**要点**: 来月から棚番の付け方を変える。関係者は手順書を読み直す。

## カテゴリ別まとめ

### Cursor

- ${item}
`;
}

function hlTitles(day) {
  if (!day) return [];
  return day.highlights.map((md) => (md.match(/^###\s*\d+\.\s*(?:\[[^\]]*\]\s*)?(.+?)\s+—/m) || [])[1] || '');
}

// タグ除去後の li。strong は題、残りのテキストが参照行。
function li(parts) {
  const children = parts.map((p) => ({ ...p, removed: false }));
  return {
    cloneNode() {
      const kids = children.map((c) => ({ ...c }));
      return {
        querySelectorAll(sel) {
          if (sel !== 'strong') return [];
          return kids.filter((k) => k.strong).map((k) => ({
            remove() { k.removed = true; },
          }));
        },
        get textContent() {
          return kids.filter((k) => !k.removed).map((k) => k.text).join('');
        },
      };
    },
  };
}

test('catHlRefs は両方の表記と全角数字を読み、同じ番号は1回だけ返す', () => {
  assert.deepEqual(catHlRefs('**棚番の案内**（ハイライト参照・1）'), ['1']);
  assert.deepEqual(catHlRefs('**棚番の案内**（ハイライト1参照）'), ['1']);
  assert.deepEqual(catHlRefs('（ハイライト参照・１）'), ['1']);
  assert.deepEqual(catHlRefs('（ハイライト２参照）'), ['2']);
  assert.deepEqual(catHlRefs('（ハイライト参照・10）'), ['10']);
  assert.deepEqual(catHlRefs('（ハイライト12参照）'), ['12']);
  assert.deepEqual(catHlRefs('（ハイライト参照・1）（ハイライト1参照）'), ['1']);
  assert.deepEqual(catHlRefs('（ハイライト1参照）と（ハイライト参照・2）'), ['1', '2']);
});

test('番号の無い「ハイライト参照」や、数字が離れた文は参照にしない', () => {
  assert.deepEqual(catHlRefs('（ハイライト参照）'), []);
  assert.deepEqual(catHlRefs('（ハイライト参照・）'), []);
  assert.deepEqual(catHlRefs('ハイライト参照。詳細は1を見よ'), []);
  assert.deepEqual(catHlRefs(''), []);
});

test('「（ハイライト参照・N）」だけの項目は、語が無くてもそのハイライトをカテゴリへ出す', () => {
  const day = extractCategoryDay(digest('**棚番の案内**（ハイライト参照・1）'), 'cursor');
  assert.deepEqual(hlTitles(day), ['棚番の付け方を変える']);
  assert.ok(day.items.some((md) => md.includes('棚番の案内')));
  assert.equal(extractCategoryDay(digest('**棚番の案内**（ハイライト参照・1）'), 'apple'), null);
});

test('規約の「（ハイライトN参照）」と全角数字も、同じハイライトを出す', () => {
  for (const item of [
    '**棚番の案内**（ハイライト1参照）',
    '**棚番の案内**（ハイライト参照・１）',
    '**棚番の案内**（ハイライト１参照）',
  ]) {
    assert.deepEqual(hlTitles(extractCategoryDay(digest(item), 'cursor')), ['棚番の付け方を変える'], item);
  }
});

test('存在しない番号や番号なしではハイライトを足さない', () => {
  const missing = extractCategoryDay(digest('**棚番の案内**（ハイライト参照・10）'), 'cursor');
  assert.deepEqual(missing.highlights, []);
  assert.ok(missing.items.some((md) => md.includes('棚番の案内')));

  const bare = extractCategoryDay(digest('**棚番の案内**（ハイライト参照）'), 'cursor');
  assert.deepEqual(bare.highlights, []);
});

test('子行の参照でも親項目のカテゴリへハイライトを出す', () => {
  const item = '**棚番の案内** — 手順の要約\n  - 詳細は（ハイライト参照・1）';
  assert.deepEqual(hlTitles(extractCategoryDay(digest(item), 'cursor')), ['棚番の付け方を変える']);
});

test('stubNum は題を除いた参照行だけを番号にし、説明文は継承しない', () => {
  const ref = (text) => li([{ strong: true, text: '棚番の案内' }, { strong: false, text }]);
  assert.equal(stubNum(ref('（ハイライト参照・1）')), '1');
  assert.equal(stubNum(ref('（ハイライト1参照）')), '1');
  assert.equal(stubNum(ref('（ハイライト参照・２）')), '2');
  assert.equal(stubNum(ref('（ハイライト１２参照）')), '12');
  assert.equal(stubNum(ref(' （ハイライト参照・1） ')), '1');
  assert.equal(stubNum(ref('（ハイライト参照・1）。追加の説明')), '');
  assert.equal(stubNum(ref('（ハイライト参照）')), '');
  assert.equal(stubNum(li([{ strong: false, text: '通常の本文' }])), '');
});
