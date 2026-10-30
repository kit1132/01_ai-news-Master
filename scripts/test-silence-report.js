#!/usr/bin/env node
/**
 * isSilenceReport はタイトルだけを見る。子行の「N日連続据え置き」で
 * 新機能を落とさないこと、沈黙タイトルは今までどおり落とすことを固定する。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const start = html.indexOf("    function isSilenceReport(md)");
const end = html.indexOf("    function extractCategoryDay(");
if (start < 0 || end < 0 || end <= start) {
  console.error("index.html から isSilenceReport を切り出せない");
  process.exit(1);
}
const isSilenceReport = new Function(`${html.slice(start, end)}\nreturn isSilenceReport;`)();

const cases = [
  {
    name: "子行の15日連続据え置きでは新機能を落とさない（2026-09-24 Claude Code）",
    md: [
      "- [セキュリティ+新機能] **Claude Code `2.1.281`** — 再帰 rm を確認するよう修正した（9/23）。",
      "  - 権限の修正: NUL バイトを含む権限ルールを直した",
      "  - 配布: npm の `next` タグで公開され、`stable` は `2.1.267` で15日連続据え置きになっている",
    ].join("\n"),
    want: false,
  },
  {
    name: "タイトルの2日連続で新規なしは落とす",
    md: "- [据え置き] **Cursor は2日連続で新規なし**: changelog は 9/10 のままである",
    want: true,
  },
  {
    name: "タイトルのN日連続据え置きは落とす",
    md: "- [据え置き] **OpenAI の一次料金ページは29日連続で据え置き** — 単価は前日と一致した。",
    want: true,
  },
  {
    name: "タイトルの最上位のまま＋新規なしは落とす",
    md: "- [据え置き] **changelog は最上位のまま**で新規はない。",
    want: true,
  },
  {
    name: "通常の新機能は残す",
    md: "- [新機能] **Codex CLI `0.156.1`** — モデルピッカーから GPT-6 を選べるようにした。",
    want: false,
  },
  {
    name: "本文が前日の「19日間動きなし」を引用しても新機能は残す（2026-09-22 Cursor）",
    md: "- [新機能] **Cursor フォーラムの Announcements に 9/21 の2本が出た**（ハイライト2参照）。`Grok 4.7 is now Live!` と `Share your Thoughts on Grok 4.7` で、9/2 の Grok Bot Android 版以来19日ぶりの更新である。⚠️ 前日まで「19日間動きなし」と記録していたソースが本日動いた。動きなしの連続日数は翌日の不在を予告しない",
    want: false,
  },
  {
    name: "本文の「changelog に新規は無い」で発効日の項目を落とさない（2026-09-28 Copilot）",
    md: "- [予定] **Copilot の3変更が本日発効** — GitHub が告知していた Copilot のチャット3面統合、code review の既定 effort の Balanced 化、チャットのデータ保持変更が本日 9/28 に発効する。github.blog changelog の Copilot ラベルは 9/25 の投稿が最上位のままで、9/26〜28 付の新規は無い。",
    want: false,
  },
  {
    name: "空は落とさない",
    md: "",
    want: false,
  },
];

let failed = 0;
for (const c of cases) {
  const got = isSilenceReport(c.md);
  if (got !== c.want) {
    failed += 1;
    console.error(`FAIL ${c.name}: want=${c.want} got=${got}`);
  } else {
    console.log(`ok   ${c.name}`);
  }
}

if (failed) {
  console.error(`${failed} 件失敗`);
  process.exit(1);
}
console.log("合格");
