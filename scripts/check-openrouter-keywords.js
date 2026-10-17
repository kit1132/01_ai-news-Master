#!/usr/bin/env node
/**
 * 複合見出し「その他エージェント / 開発ツール」の下で、語の無い
 * OpenRouter Armor が全カテゴリ時系列から消えないこと。
 * 2026-10-17 は Cursor / xAI の日そのものが空になっていた。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const VIEWER = path.join(ROOT, 'index.html');
const DAILY_17 = path.resolve(
  ROOT, '..', '05_ai-news-daily', 'daily', '2026', 'ai-news-daily-2026-10-17.md',
);

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

const FIXTURE = `# AI News Daily Summary — 2026-10-17

## 今日のハイライト

### 1. [廃止+破壊的変更] Dataverse for Teams 環境の新規作成が 11/15 に止まる — 移行対象になった

**要点**: Teams 内で作ったアプリが移行対象になる。

## カテゴリ別まとめ

### Copilot Studio / Power Platform

- **Dataverse for Teams 環境の廃止**（ハイライト参照・1）

### その他エージェント / 開発ツール

- [新機能] **OpenRouter Armor（ベータ）** — OpenRouter が 10/16 に、エージェントの操作を別の AI で事前に検査し、ルール違反を自動で止める機能をベータ公開した。同日に Perplexity もエージェント用サンドボックス SPACE をオープンソース化した。
- [版更新] **Orca \`v1.4.227\`** — Stably AI が 10/16 に Orca を GitHub に出した。Codex チャットに Codex 0.136.0 以上が必要になった。
- [据え置き] **TypeSafe・Cursor・Google・MCP・Hugging Face の定点** — TypeSafe の \`jev-latest\` は \`jev-1.13.0\` のまま、Cursor の changelog は 10/13、Gemini API changelog は 10/13 のままである。

### オープンウェイト

- [新機能] **別件の重み公開** — Hugging Face で重みを公開した。
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
    catHeadingTarget('その他エージェント / 開発ツール'),
    '*',
    '見出しは複合のまま（独占にすると定点の Google / HF が消える）',
  );
  assert.strictEqual(
    catClassifyText('OpenRouter Armor（ベータ） OpenRouter がベータ公開した。Perplexity も SPACE を出した。'),
    'cursor',
  );

  const cursor = extractCategoryDay(FIXTURE, 'cursor');
  const openai = extractCategoryDay(FIXTURE, 'openai');
  const openWeight = extractCategoryDay(FIXTURE, 'open-weight');
  const cursorTitles = titles(cursor);

  assert.ok(cursor, 'OpenRouter Armor がある日は Cursor ページから消えない');
  assert.ok(
    cursorTitles.some((t) => /OpenRouter/.test(t)),
    `OpenRouter Armor が Cursor に無い: ${cursorTitles.join(' / ')}`,
  );
  assert.ok(
    !cursorTitles.some((t) => /Dataverse/.test(t)),
    'Studio 項目を Cursor に流さない',
  );
  const openaiTitles = titles(openai);
  assert.ok(
    !openaiTitles.some((t) => /OpenRouter/.test(t)),
    `OpenRouter を OpenAI に流さない: ${openaiTitles.join(' / ')}`,
  );
  assert.ok(
    titles(openWeight).some((t) => /重み公開/.test(t)),
    'オープンウェイトは従来どおり残る',
  );

  if (fs.existsSync(DAILY_17)) {
    const live = extractCategoryDay(fs.readFileSync(DAILY_17, 'utf8'), 'cursor');
    const liveTitles = titles(live);
    assert.ok(live, '本番 2026-10-17 の Cursor 日が消えている');
    assert.ok(
      liveTitles.some((t) => /OpenRouter/.test(t)),
      `本番 10-17 に OpenRouter Armor が無い: ${liveTitles.join(' / ')}`,
    );
  }

  console.log('check-openrouter-keywords: 合格');
}

main();
