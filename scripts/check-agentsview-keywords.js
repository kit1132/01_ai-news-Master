#!/usr/bin/env node
/**
 * 複合見出し「その他エージェント / 開発ツール」の下で、語の無い
 * AgentsView が全カテゴリ時系列から消えないこと。
 * 2026-10-18 は Claude / Codex / Cursor / Gemini の同点で null になり、
 * Cursor / xAI に Environments API だけが残っていた。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const VIEWER = path.join(ROOT, 'index.html');
const DAILY_18 = path.resolve(
  ROOT, '..', '05_ai-news-daily', 'daily', '2026', 'ai-news-daily-2026-10-18.md',
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

const FIXTURE = `# AI News Daily Summary — 2026-10-18

## 今日のハイライト

### 1. [破壊的変更+新機能] Anthropic が Claude Code \`2.1.302\` で既定動作を変えた — 無人実行の前提が変わった

**要点**: fork サブエージェントが既定オンになる。

## カテゴリ別まとめ

### Claude / Anthropic

- **Claude Code \`2.1.302\`**（ハイライト参照・1）

### その他エージェント / 開発ツール

- [新機能] **Cursor cloud agent の Environments API（ベータ）** — Cursor が cloud agent の実行環境を API で作れるようにした。
- [新機能] **AgentsView** — GIGAZINE が紹介した OSS の AgentsView は、Claude Code・Codex・Cursor・Copilot・Gemini などのローカル履歴を集め、利用量と費用を表示する。
- [据え置き] **TypeSafe・Google・MCP の定点** — Gemini API changelog は 10/13 のままである。

### オープンウェイト

- [新機能] **DeepSeek V4.1-Flash-1017** — Hugging Face で重みを公開した。
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
    catClassifyText('AgentsView は Claude Code・Codex・Cursor・Copilot・Gemini の履歴を集める'),
    'cursor',
  );

  const cursor = extractCategoryDay(FIXTURE, 'cursor');
  const claude = extractCategoryDay(FIXTURE, 'claude');
  const openai = extractCategoryDay(FIXTURE, 'openai');
  const google = extractCategoryDay(FIXTURE, 'google');
  const openWeight = extractCategoryDay(FIXTURE, 'open-weight');
  const cursorTitles = titles(cursor);

  assert.ok(cursor, 'AgentsView がある日は Cursor ページから消えない');
  assert.ok(
    cursorTitles.some((t) => /AgentsView/.test(t)),
    `AgentsView が Cursor に無い: ${cursorTitles.join(' / ')}`,
  );
  assert.ok(
    cursorTitles.some((t) => /Environments API/.test(t)),
    'Cursor 本体の項目は残る',
  );
  assert.ok(
    !cursorTitles.some((t) => /DeepSeek|2\\.1\\.302/.test(t)),
    '他カテゴリの項目を Cursor に流さない',
  );
  assert.ok(
    !titles(claude).some((t) => /AgentsView/.test(t)),
    `AgentsView を Claude に流さない: ${titles(claude).join(' / ')}`,
  );
  assert.ok(
    !titles(openai).some((t) => /AgentsView/.test(t)),
    `AgentsView を OpenAI に流さない: ${titles(openai).join(' / ')}`,
  );
  assert.ok(
    !titles(google).some((t) => /AgentsView/.test(t)),
    `AgentsView を Google に流さない: ${titles(google).join(' / ')}`,
  );
  assert.ok(
    titles(openWeight).some((t) => /DeepSeek/.test(t)),
    'オープンウェイトは従来どおり残る',
  );

  if (fs.existsSync(DAILY_18)) {
    const live = extractCategoryDay(fs.readFileSync(DAILY_18, 'utf8'), 'cursor');
    const liveTitles = titles(live);
    assert.ok(live, '本番 2026-10-18 の Cursor 日が消えている');
    assert.ok(
      liveTitles.some((t) => /AgentsView/.test(t)),
      `本番 10-18 に AgentsView が無い: ${liveTitles.join(' / ')}`,
    );
  }

  console.log('check-agentsview-keywords: 合格');
}

main();
