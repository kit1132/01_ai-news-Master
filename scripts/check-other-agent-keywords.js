#!/usr/bin/env node
/**
 * 監視対象の Orca / TypeSafe が、複合見出しの下でも Cursor ページに残ること。
 * 2026-10-16 の「OpenAI / Google / その他エージェント」は OpenAI と Google
 * だけに当たり、語の無い TypeSafe / Orca がその日から消えていた。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const VIEWER = path.join(ROOT, 'index.html');
const DAILY_16 = path.resolve(
  ROOT, '..', '05_ai-news-daily', 'daily', '2026', 'ai-news-daily-2026-10-16.md',
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

const FIXTURE = `# AI News Daily Summary — 2026-10-16

## 今日のハイライト

### 1. [廃止] GitHub Copilot が 11/16 に Claude Opus 4.8 を廃止する — 差し替えが要る

**要点**: モデルを固定したワークフローは止まる。

## カテゴリ別まとめ

### GitHub Copilot / GitHub

- **Copilot の3モデル廃止**（ハイライト参照・1）

### OpenAI / Google / その他エージェント

- [新機能] **TypeSafe AI \`jev-1.14.0\`** — TypeSafe AI が 10/14 に Jev の新版を \`jev-preview\` で出した。
- [観測] **Orca \`v1.4.225\` のリリースが GitHub から消えた** — Stably AI の GitHub からタグが消えた。
- [据え置き] **Codex・OpenAI・Cursor・Google・MCP の定点** — OpenAI は Codex CLI 安定版を据え置き、Gemini API changelog は 10/13 のままである。

### オープンウェイト

- [新機能] **Meta Muse Spark Open** — Meta が重みを Hugging Face で公開した。
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
    catHeadingTarget('OpenAI / Google / その他エージェント'),
    '*',
    '見出しは複合のまま（独占にすると OpenAI / Google の項目が消える）',
  );
  assert.ok(
    catHeadingTarget('Cursor / xAI / Devin / その他エージェント') === 'cursor',
    'Cursor バケツにその他エージェントが付いても Cursor のまま',
  );
  assert.strictEqual(
    catClassifyText('TypeSafe AI jev-1.14.0 を jev-preview で出した'),
    'cursor',
  );
  assert.strictEqual(
    catClassifyText('Orca v1.4.225 のリリースが GitHub から消えた'),
    'cursor',
  );

  const cursor = extractCategoryDay(FIXTURE, 'cursor');
  const openWeight = extractCategoryDay(FIXTURE, 'open-weight');
  const cursorTitles = titles(cursor);

  assert.ok(cursor, 'TypeSafe / Orca がある日は Cursor ページから消えない');
  assert.ok(
    cursorTitles.some((t) => /TypeSafe/.test(t)),
    `TypeSafe が Cursor に無い: ${cursorTitles.join(' / ')}`,
  );
  assert.ok(
    cursorTitles.some((t) => /Orca/.test(t)),
    `Orca が Cursor に無い: ${cursorTitles.join(' / ')}`,
  );
  assert.ok(
    !cursorTitles.some((t) => /Muse Spark/.test(t)),
    'オープンウェイト項目を Cursor に流さない',
  );
  assert.ok(
    titles(openWeight).some((t) => /Muse Spark/.test(t)),
    'オープンウェイトは従来どおり残る',
  );
  const openaiTitles = titles(extractCategoryDay(FIXTURE, 'openai'));
  const googleTitles = titles(extractCategoryDay(FIXTURE, 'google'));
  assert.ok(
    !openaiTitles.some((t) => /TypeSafe|Orca/.test(t)),
    `TypeSafe / Orca を OpenAI に流さない: ${openaiTitles.join(' / ')}`,
  );
  assert.ok(
    !googleTitles.some((t) => /TypeSafe|Orca/.test(t)),
    `TypeSafe / Orca を Google に流さない: ${googleTitles.join(' / ')}`,
  );

  if (fs.existsSync(DAILY_16)) {
    const live = extractCategoryDay(fs.readFileSync(DAILY_16, 'utf8'), 'cursor');
    const liveTitles = titles(live);
    assert.ok(live, '本番 2026-10-16 の Cursor 日が消えている');
    assert.ok(
      liveTitles.some((t) => /TypeSafe/.test(t)),
      `本番 10-16 に TypeSafe が無い: ${liveTitles.join(' / ')}`,
    );
    assert.ok(
      liveTitles.some((t) => /Orca/.test(t)),
      `本番 10-16 に Orca が無い: ${liveTitles.join(' / ')}`,
    );
  }

  console.log('check-other-agent-keywords: 合格');
}

main();
