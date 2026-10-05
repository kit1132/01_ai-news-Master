#!/usr/bin/env node
/**
 * 「業界・政策」見出しを市場・企業の時系列から落とさないこと。
 * 2026-10-05 の ThinkingBox と Super Intelligence Force は、
 * 別名にも正規表現にも当たらず heading が null になり、その日の
 * 市場・企業ページが空になっていた。
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
  return Function(`${script}\nreturn { extractCategoryDay, catHeadingTarget };`)();
}

const FIXTURE = `# AI News Daily Summary — 2026-10-05

## 今日のハイライト

### 1. [破壊的変更+料金] Google が Gemini アプリの無料ユーザーを絞ると報じられた — 無料枠の前提が消える

**要点**: 無料ユーザーは Flash-Lite のみになる。

## カテゴリ別まとめ

### Google

- **Gemini アプリ無料枠の Flash-Lite 限定**（ハイライト参照・1）

### 業界・政策

- [動向] **ThinkingBox** — Microsoft が Hugging Face と、エージェント実行後の業務レコードを採点するベンチマークを公開した（10/3）。
- [動向] **Super Intelligence Force** — トランプ大統領が、AI で米国の主導を保つための連邦政府の調整組織を新設した（10/4）。
- [据え置き] **市場データ** — IDC Japan・Similarweb は新規公表が無い。
`;

function main() {
  const { extractCategoryDay, catHeadingTarget } = loadViewer();
  assert.strictEqual(catHeadingTarget('業界・政策'), 'market');
  assert.strictEqual(catHeadingTarget('規制・政策 / 市場'), 'market');

  const market = extractCategoryDay(FIXTURE, 'market');
  assert.ok(market, '市場・企業から 2026-10-05 が消えている');
  const text = [...market.highlights, ...market.items].join('\n');
  assert.match(text, /ThinkingBox/, 'ThinkingBox が市場・企業から消えている');
  assert.match(text, /Super Intelligence Force/, 'Super Intelligence Force が市場・企業から消えている');

  const google = extractCategoryDay(FIXTURE, 'google');
  assert.ok(google, 'Google 側まで空になっている');
  const googleText = [...google.highlights, ...google.items].join('\n');
  assert.doesNotMatch(googleText, /ThinkingBox/, '業界項目が Google へ漏れている');

  console.log('合格: 業界・政策見出しは市場・企業に載る');
}

main();
