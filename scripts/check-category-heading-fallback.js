#!/usr/bin/env node
/**
 * 複合見出しの下で、項目にカテゴリ語が無いと時系列から消えないこと。
 * 2026-09-29 の Power Pages GA と 2026-09-30 の OneDrive Prompt Gallery が、
 * 「Microsoft 365 Copilot / Copilot Studio / Power Platform」見出しの
 * 複数ヒットで * になり、語が無いため全カテゴリから落ちていた。
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
  return Function(`${script}\nreturn { extractCategoryDay, catHeadingSlugs, catHasKeywordHit };`)();
}

const MIXED = `## カテゴリ別まとめ

### Microsoft 365 Copilot / Copilot Studio / Power Platform

- [新機能] **Power Pages の Modern List** — Microsoft が Power Pages の Modern List を GA にし、新規サイトの既定のリスト表示にした（9/23）。
- [新機能] **Copilot Studio の Hooks（preview）** — メーカーが、GitHub Copilot ハーネスのセッション開始でワークフローを走らせられる。
- [予定] **OneDrive の Prompt Gallery** — Microsoft が Roadmap 571308 で、OneDrive の Copilot にプロンプト集が入ると起票した。
`;

const { extractCategoryDay, catHeadingSlugs, catHasKeywordHit } = loadViewer();

function titles(extracted) {
  if (!extracted) return [];
  return extracted.items.map((md) => {
    const m = md.match(/\*\*([^*]+)\*\*/);
    return m ? m[1] : md.slice(0, 40);
  });
}

const fail = [];
const head = catHeadingSlugs('Microsoft 365 Copilot / Copilot Studio / Power Platform');
if (!head.includes('studio') || !head.includes('m365-copilot')) {
  fail.push(`複合見出しの slug が足りない: ${head.join(',')}`);
}

const studio = extractCategoryDay(MIXED, 'studio');
const copilot = extractCategoryDay(MIXED, 'm365-copilot');
const claude = extractCategoryDay(MIXED, 'claude');
const studioTitles = titles(studio);
const copilotTitles = titles(copilot);

if (!studioTitles.includes('Power Pages の Modern List')) {
  fail.push('studio から Power Pages GA が消えている');
}
if (!studioTitles.includes('OneDrive の Prompt Gallery')) {
  fail.push('studio から OneDrive Prompt Gallery が消えている');
}
if (!copilotTitles.includes('Power Pages の Modern List')) {
  fail.push('m365-copilot から Power Pages GA が消えている');
}
if (!copilotTitles.includes('OneDrive の Prompt Gallery')) {
  fail.push('m365-copilot から OneDrive Prompt Gallery が消えている');
}
if (titles(claude).length) {
  fail.push('claude に複合見出しの項目が漏れている');
}

const hooks = MIXED.split('\n').find((l) => l.includes('Hooks'));
if (!catHasKeywordHit(hooks)) {
  fail.push('Hooks 行をキーワード無しと誤判定している');
}
if (studioTitles.includes('Copilot Studio の Hooks（preview）')) {
  fail.push('同点の Hooks を見出しフォールバックで拾っている（分類同点の修正範囲外）');
}

const real29 = path.join(ROOT, '..', '05_ai-news-daily', 'daily', '2026', 'ai-news-daily-2026-09-29.md');
const real30 = path.join(ROOT, '..', '05_ai-news-daily', 'daily', '2026', 'ai-news-daily-2026-09-30.md');
if (fs.existsSync(real29)) {
  const md = fs.readFileSync(real29, 'utf8');
  const got = titles(extractCategoryDay(md, 'studio'));
  if (!got.some((t) => t.includes('Power Pages の Modern List'))) {
    fail.push('実ファイル 09-29 の studio から Power Pages Modern List が消えている');
  }
  if (!got.some((t) => t.includes('Power Pages サイトの所有権移譲'))) {
    fail.push('実ファイル 09-29 の studio から Power Pages 所有権移譲が消えている');
  }
}
if (fs.existsSync(real30)) {
  const md = fs.readFileSync(real30, 'utf8');
  const got = titles(extractCategoryDay(md, 'm365-copilot'));
  if (!got.some((t) => t.includes('OneDrive の Prompt Gallery'))) {
    fail.push('実ファイル 09-30 の m365-copilot から OneDrive Prompt Gallery が消えている');
  }
}

if (fail.length) {
  console.error('複合見出しのフォールバック検査が不合格');
  for (const line of fail) console.error('  ' + line);
  process.exit(1);
}
console.log('複合見出しのフォールバック: 合格');
