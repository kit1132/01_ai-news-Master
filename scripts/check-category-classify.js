#!/usr/bin/env node
/**
 * カテゴリ分類が同点で項目を捨てないこと。
 * 2026-09-26 の日次で、ハイライト1（GitHub の 10/22 既定ポリシー）が
 * github-copilot と MCP で同点になり、全カテゴリ時系列から消えた。
 */
'use strict';

const fs = require('fs');
const path = require('path');

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
  // ビューアはトップレベル const。eval の strict スコープに閉じ込めない。
  return Function(`${script}\nreturn { extractCategoryDay, catClassifySlugs, CATEGORIES };`)();
}

const HL1 = `### 1. [破壊的変更] GitHub が Copilot Business / Enterprise の未設定機能を 10/22 から既定ポリシーに従わせる — 前提が崩れる

**要点**: 明示的に設定していない GA 機能を 10/22 から既定ポリシーに従わせる。

- 対象: Copilot Code Review のポリシー、MCP サーバーのポリシー
- https://github.blog/changelog/2026-09-24-default-enablement-of-copilot-features-for-copilot-business-and-enterprise
`;

const RUNTIME = `- [新機能] **Copilot Managed Runtime の Public Preview** — Cowork・Copilot Code・Copilot Studio で作ったアプリを M365 テナント内で動かす。設定は管理センター。`;

const STUDIO_GA = `- [予定] **Copilot Studio の9月 GA 期日（残り4日）** — GitHub Copilot ハーネスの GA は未反映。`;

const PRICE = `### 2. [料金+新機能] Microsoft が Copilot の課金を分けた — 定額は無制限ではなくなる

**要点**: USL と Copilot Credits の従量。Cowork / Copilot Studio エージェントは従量。Sonnet 5 と Opus 5 と GPT-5.6 は込み。
`;

const DAY = `# AI News Daily Summary — 2026-09-26

## 今日のハイライト

${HL1}

${PRICE}

## カテゴリ別まとめ

### Microsoft 365 Copilot / Copilot Studio

${RUNTIME}
${STUDIO_GA}

### GitHub Copilot / GitHub

- [新機能] **Copilot for Slack** — 会話の途中でモデルを切り替えられる。
`;

function fail(msg) {
  console.error(`scripts/check-category-classify.js: ${msg}`);
  process.exitCode = 1;
}

function main() {
  const { extractCategoryDay, catClassifySlugs } = loadViewer();

  const hl1 = catClassifySlugs(HL1);
  if (!hl1.includes('github-copilot')) {
    fail(`ハイライト1が github-copilot に入らない: ${JSON.stringify(hl1)}`);
  }

  const runtime = catClassifySlugs(RUNTIME);
  if (!runtime.includes('studio') && !runtime.includes('m365-copilot')) {
    fail(`Managed Runtime が Microsoft 側に入らない: ${JSON.stringify(runtime)}`);
  }

  const ga = catClassifySlugs(STUDIO_GA);
  if (!ga.includes('studio')) {
    fail(`Studio GA 期日が studio に入らない: ${JSON.stringify(ga)}`);
  }

  const price = catClassifySlugs(PRICE);
  if (!price.includes('m365-copilot') && !price.includes('studio')) {
    fail(`課金ハイライトが M365 / Studio に入らない: ${JSON.stringify(price)}`);
  }

  const gh = extractCategoryDay(DAY, 'github-copilot');
  const ghText = ((gh && gh.highlights) || []).join('\n');
  if (!/10\/22/.test(ghText)) {
    fail('github-copilot の時系列から 10/22 既定ポリシーが消える');
  }

  const studio = extractCategoryDay(DAY, 'studio');
  const studioText = [
    ...((studio && studio.highlights) || []),
    ...((studio && studio.items) || []),
  ].join('\n');
  if (!/Managed Runtime/.test(studioText) && !/GA 期日/.test(studioText)) {
    fail('studio の時系列から Managed Runtime / GA 期日が消える');
  }

  if (process.exitCode) {
    console.error('カテゴリ分類の検査が不合格');
    process.exit(process.exitCode);
  }
  console.log('カテゴリ分類: 合格');
}

main();
