#!/usr/bin/env node
/**
 * 別名1件に独占された複合バケツから、別カテゴリの項目が消えないこと。
 * 2026-10-06 の「Cursor / AWS / その他エージェント」は Cursor だけに
 * 当たり、中の Reflection AI（オープンウェイト）がその日から消えていた。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const VIEWER = path.join(ROOT, 'index.html');

function loadViewer() {
  const html = fs.readFileSync(VIEWER, 'utf8');
  const start = html.lastIndexOf('<script>');
  const end = html.lastIndexOf('</script>');
  if (start < 0 || end < 0 || end <= start) {
    throw new Error('index.html からスクリプトを抜けない');
  }
  const script = html.slice(start + '<script>'.length, end);
  return Function(`${script}\nreturn { extractCategoryDay, catHeadingTarget, catClassifyText };`)();
}

const FIXTURE = `# AI News Daily Summary — 2026-10-06

## 今日のハイライト

### 1. [新機能] OpenAI が EU 域内の ChatGPT に透かしを入れ始める — 生成物の前提が変わる

**要点**: EU 向けの生成物は透かし入りが前提になる。

## カテゴリ別まとめ

### OpenAI / Codex / ChatGPT

- **EU テキスト透かし**（ハイライト参照・1）

### Cursor / AWS / その他エージェント

- [新機能] **Strands Decider 2B** — AWS が文章を生成せず選択だけ返す 2B モデルを公開した。
- [新機能] **Pi 1.0** — Earendil がターミナル型エージェント Pi の安定版を出し、MCP にネイティブ対応した。Anthropic モデル向けのキャッシュ温めもある。
- [予定] **Reflection AI のオープンウェイトモデル** — Nvidia が出資する Reflection AI が初のオープンウェイトモデルを近く公開すると報じられた。Hugging Face に該当リポジトリは見つからない。
- [据え置き] **Cursor・MCP・Apple・Hugging Face** — Cursor の changelog は 9/23 が最上位のままである。

### Claude / Anthropic

- [新機能] **Models API の line フィールド** — Anthropic がモデル系統を返すようになった。
`;

function titles(extracted) {
  if (!extracted) return [];
  return extracted.items.map((md) => {
    const m = md.match(/\*\*([^*]+)\*\*/);
    return m ? m[1] : md.slice(0, 40);
  });
}

function main() {
  const { extractCategoryDay, catHeadingTarget, catClassifyText } = loadViewer();

  assert.strictEqual(
    catHeadingTarget('Cursor / AWS / その他エージェント'),
    'cursor',
    '見出し自体は Cursor のまま（独占を * にすると語の無い項目が消える）',
  );
  assert.strictEqual(
    catClassifyText('Reflection AI のオープンウェイトモデル Hugging Face'),
    'open-weight',
  );

  const cursor = extractCategoryDay(FIXTURE, 'cursor');
  const openWeight = extractCategoryDay(FIXTURE, 'open-weight');
  const claude = extractCategoryDay(FIXTURE, 'claude');
  const mcp = extractCategoryDay(FIXTURE, 'mcp');

  const cursorTitles = titles(cursor);
  const openTitles = titles(openWeight);

  assert.ok(cursor, 'Cursor 側まで空になっている');
  assert.ok(cursorTitles.includes('Strands Decider 2B'), 'Strands が Cursor から消えている');
  assert.ok(cursorTitles.includes('Pi 1.0'), 'Pi 1.0 が Cursor から消えている');
  assert.ok(
    cursorTitles.includes('Reflection AI のオープンウェイトモデル'),
    'Reflection AI が Cursor からも消えている',
  );

  assert.ok(openWeight, 'オープンウェイトから 2026-10-06 が消えている');
  assert.ok(
    openTitles.includes('Reflection AI のオープンウェイトモデル'),
    'Reflection AI がオープンウェイトから消えている',
  );
  assert.ok(!openTitles.includes('Strands Decider 2B'), 'Strands がオープンウェイトへ漏れている');
  assert.ok(!openTitles.includes('Pi 1.0'), 'Pi 1.0 がオープンウェイトへ漏れている');

  assert.ok(!titles(claude).includes('Reflection AI のオープンウェイトモデル'), 'Claude へ漏れている');
  assert.ok(!titles(mcp).includes('Pi 1.0'), '同点の Pi を MCP へ拾っている');

  const real = path.join(ROOT, '..', '05_ai-news-daily', 'daily', '2026', 'ai-news-daily-2026-10-06.md');
  if (fs.existsSync(real)) {
    const md = fs.readFileSync(real, 'utf8');
    const got = titles(extractCategoryDay(md, 'open-weight'));
    if (!got.some((t) => t.includes('Reflection AI'))) {
      throw new Error('実ファイル 10-06 のオープンウェイトから Reflection AI が消えている');
    }
    const cursorGot = titles(extractCategoryDay(md, 'cursor'));
    if (!cursorGot.some((t) => t.includes('Pi 1.0'))) {
      throw new Error('実ファイル 10-06 の Cursor から Pi 1.0 が消えている');
    }
  }

  console.log('合格: 独占バケツ内のオープンウェイト項目は時系列に残る');
}

main();
