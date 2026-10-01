#!/usr/bin/env node
/**
 * ハイライト参照の2形を読むこと。
 * 2026-10-01 の「ハイライト参照・3」は、語の同点で分類できず、
 * 手順形「ハイライト3参照」だけ見ていたため全カテゴリから消えた。
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
  return Function(`${script}\nreturn { extractCategoryDay, catHlRefs, parseStubNum };`)();
}

function hlTitles(extracted) {
  if (!extracted) return [];
  return extracted.highlights.map((md) => {
    const m = md.match(/^###\s+\d+\.\s*\[[^\]]+\]\s*(.+?)\s+—/);
    return m ? m[1] : md.slice(0, 60);
  });
}

const { extractCategoryDay, catHlRefs, parseStubNum } = loadViewer();
const fail = [];

const cases = [
  ['- **退役日確定**（ハイライト1参照）', '1'],
  ['- **退役日確定**（ハイライト参照・1）', '1'],
  ['- **退役日確定**（ハイライト参照1）', '1'],
  ['- **退役日確定**（ハイライト１参照）', '1'],
];
for (const [line, want] of cases) {
  const got = catHlRefs(line);
  if (!got.includes(want)) fail.push(`catHlRefs が ${want} を読めない: ${line} -> ${JSON.stringify(got)}`);
}

if (parseStubNum('（ハイライト1参照）') !== '1') {
  fail.push(`parseStubNum が手順形を読めない: ${parseStubNum('（ハイライト1参照）')}`);
}
if (parseStubNum('（ハイライト参照・3）') !== '3') {
  fail.push(`parseStubNum が回避形を読めない: ${parseStubNum('（ハイライト参照・3）')}`);
}
if (parseStubNum('本文（ハイライト参照・3）') !== '') {
  fail.push('parseStubNum が本文付き行を参照行と誤判定している');
}

const daily = path.join(ROOT, '..', '05_ai-news-daily', 'daily', '2026', 'ai-news-daily-2026-10-01.md');
if (fs.existsSync(daily)) {
  const md = fs.readFileSync(daily, 'utf8');
  const billing = 'Microsoft 365 の従量課金の対象が3種から6種に増えた';
  const copilot = hlTitles(extractCategoryDay(md, 'm365-copilot'));
  const studio = hlTitles(extractCategoryDay(md, 'studio'));
  const claude = hlTitles(extractCategoryDay(md, 'claude'));
  if (!copilot.some((t) => t.includes(billing))) {
    fail.push('2026-10-01 の m365-copilot から従量課金ハイライトが消えている');
  }
  if (!studio.some((t) => t.includes(billing))) {
    fail.push('2026-10-01 の studio から従量課金ハイライトが消えている');
  }
  if (claude.some((t) => t.includes(billing))) {
    fail.push('2026-10-01 の claude に従量課金ハイライトが漏れている');
  }
}

if (fail.length) {
  console.error('ハイライト参照の形式検査が不合格');
  for (const line of fail) console.error('  ' + line);
  process.exit(1);
}
console.log('ハイライト参照の形式: 合格');
