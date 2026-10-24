// カテゴリ別ページの振り分け（extractCategoryDay / catClassifySlugs）を検査する。
// 実行: node --test tests/*.test.mjs
// 2026-10-20: Cursor の PR #14・#15・#18・#20・#21・#22 の実例をまとめた。
// 方針は「同点は2カテゴリまで両方に出す」（kit 決定）。
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const { extractCategoryDay, catClassifySlugs, catHeadingSlugs, catHlClassifySlugs } = Function(
  `${script}\nreturn { extractCategoryDay, catClassifySlugs, catHeadingSlugs, catHlClassifySlugs };`,
)();

// 抽出結果から、項目とハイライトの見出し（太字か ### の題）を取り出す
function titles(day) {
  if (!day) return [];
  const item = day.items.map((md) => (md.match(/\*\*([^*]+)\*\*/) || [])[1] || md.slice(0, 40));
  const hl = day.highlights.map((md) => (md.match(/^###\s*\d+\.\s*(?:\[[^\]]*\]\s*)?(.+?)\s+—/m) || [])[1] || md.slice(0, 40));
  return [...item, ...hl];
}
const has = (md, slug, title) => titles(extractCategoryDay(md, slug)).some((t) => t.includes(title));

// --- 語の一致（単語の途中に当てない） ---
test('英字の語は単語の途中に当てない', () => {
  assert.ok(!catClassifySlugs('DeepSeek-V4ForCausalLM の重みを公開').includes('cursor'), 'ForCausalLM を Orca と読んだ');
  assert.ok(!catClassifySlugs('研究者の curiosity を測る').includes('apple'), 'curiosity を iOS と読んだ');
  assert.ok(!catClassifySlugs('MiniMaxAI が M3.1 を公開').includes('cursor'), 'MiniMaxAI を xAI と読んだ');
});

test('英字の語は単語の頭なら当たる', () => {
  assert.deepEqual(catClassifySlugs('Orca v1.4.230 を出した'), ['cursor']);
  assert.deepEqual(catClassifySlugs('iOS 27 の新機能'), ['apple']);
  assert.deepEqual(catClassifySlugs('AgentsView が履歴を集める'), ['cursor']);
});

// --- 同点の扱い（2カテゴリまで） ---
test('同点が2カテゴリなら両方を返す', () => {
  assert.deepEqual(catClassifySlugs('Copilot Studio の GA 期日。GitHub Copilot ハーネスは未反映').sort(), ['github-copilot', 'studio']);
});

test('同点が3カテゴリ以上なら空。見出しのカテゴリが分かれば、それと重なるものに絞る', () => {
  const runtime = 'Cowork・Copilot Code・Copilot Studio で作ったアプリを M365 テナント内で動かす。設定は管理センター。';
  assert.deepEqual(catClassifySlugs(runtime), []);
  assert.deepEqual(catClassifySlugs(runtime, ['m365-copilot', 'studio']).sort(), ['m365-copilot', 'studio']);
});

test('最高点が1つなら、そのカテゴリだけ（Claude 遮断の記事を OpenAI へ出さない）', () => {
  assert.deepEqual(catClassifySlugs('Anthropic が OpenAI 社員の Claude 利用を遮断した'), ['claude']);
});

// --- #14: 同点で全カテゴリから消える ---
const HL1 = `### 1. [破壊的変更] GitHub が Copilot Business / Enterprise の未設定機能を 10/22 から既定ポリシーに従わせる — 前提が崩れる

**要点**: 明示的に設定していない GA 機能を 10/22 から既定ポリシーに従わせる。

- 対象: Copilot Code Review のポリシー、MCP サーバーのポリシー
- https://github.blog/changelog/2026-09-24-default-enablement-of-copilot-features-for-copilot-business-and-enterprise
`;
const DAY0926 = `# AI News Daily Summary — 2026-09-26

## 今日のハイライト

${HL1}

## カテゴリ別まとめ

### Microsoft 365 Copilot / Copilot Studio

- [新機能] **Copilot Managed Runtime の Public Preview** — Cowork・Copilot Code・Copilot Studio で作ったアプリを M365 テナント内で動かす。設定は管理センター。
- [予定] **Copilot Studio の9月 GA 期日（残り4日）** — GitHub Copilot ハーネスの GA は未反映。

### GitHub Copilot / GitHub

- [新機能] **Copilot for Slack** — 会話の途中でモデルを切り替えられる。
`;

test('#14: 同点のハイライトと項目が、該当カテゴリから消えない', () => {
  assert.ok(has(DAY0926, 'github-copilot', 'GitHub が Copilot Business'), 'HL1 が GitHub Copilot に無い');
  assert.ok(has(DAY0926, 'studio', 'Copilot Managed Runtime'), 'Runtime が Studio に無い');
  assert.ok(has(DAY0926, 'm365-copilot', 'Copilot Managed Runtime'), 'Runtime が M365 Copilot に無い');
  assert.ok(has(DAY0926, 'studio', 'Copilot Studio の9月 GA 期日'), 'GA 期日が Studio に無い');
  assert.ok(!has(DAY0926, 'm365-admin', 'Copilot Managed Runtime'), '見出しに無い M365 管理へ漏れた');
});

// --- #15: 複合見出しの下で語の無い項目が消える ---
const MIXED = `## カテゴリ別まとめ

### Microsoft 365 Copilot / Copilot Studio / Power Platform

- [新機能] **Power Pages の Modern List** — Microsoft が Power Pages の Modern List を GA にし、新規サイトの既定のリスト表示にした（9/23）。
- [新機能] **Copilot Studio の Hooks（preview）** — メーカーが、GitHub Copilot ハーネスのセッション開始でワークフローを走らせられる。
- [予定] **OneDrive の Prompt Gallery** — Microsoft が Roadmap 571308 で、OneDrive の Copilot にプロンプト集が入ると起票した。
`;

test('#15: 複合見出しの下で語の無い項目は、見出しのカテゴリへ戻す', () => {
  assert.deepEqual(catHeadingSlugs('Microsoft 365 Copilot / Copilot Studio / Power Platform').sort(), ['m365-copilot', 'studio']);
  assert.ok(has(MIXED, 'studio', 'Power Pages の Modern List'));
  assert.ok(has(MIXED, 'm365-copilot', 'OneDrive の Prompt Gallery'));
  assert.ok(has(MIXED, 'studio', 'Copilot Studio の Hooks'));
  assert.ok(!has(MIXED, 'claude', 'Power Pages'), '無関係なカテゴリへ漏れた');
});

// --- #18: 1カテゴリ専用の「その他」見出しの下にある、別カテゴリの項目 ---
const DAY1006 = `# AI News Daily Summary — 2026-10-06

## カテゴリ別まとめ

### Cursor / AWS / その他エージェント

- [新機能] **Strands Decider 2B** — AWS が文章を生成せず選択だけ返す 2B モデルを公開した。
- [新機能] **Pi 1.0** — Earendil がターミナル型エージェント Pi の安定版を出し、MCP にネイティブ対応した。Anthropic モデル向けのキャッシュ温めもある。
- [予定] **Reflection AI のオープンウェイトモデル** — Nvidia が出資する Reflection AI が初のオープンウェイトモデルを近く公開すると報じられた。Hugging Face に該当リポジトリは見つからない。

### Claude / Anthropic

- [新機能] **Models API の line フィールド** — Anthropic がモデル系統を返すようになった。
`;

test('#18: 「その他」見出しの下で別カテゴリに一意に当たる項目は、そのカテゴリにも出す', () => {
  for (const t of ['Strands Decider 2B', 'Pi 1.0', 'Reflection AI']) assert.ok(has(DAY1006, 'cursor', t), `${t} が Cursor に無い`);
  assert.ok(has(DAY1006, 'open-weight', 'Reflection AI'), 'Reflection AI がオープンウェイトに無い');
  assert.ok(!has(DAY1006, 'open-weight', 'Strands Decider 2B'));
  assert.ok(!has(DAY1006, 'mcp', 'Pi 1.0'), '同点の Pi を MCP へ出した（一意でなければ出さない）');
  assert.ok(!has(DAY1006, 'claude', 'Reflection AI'));
});

// --- #20〜#22: 「その他エージェント」見出しと、足りない語 ---
const DAY1016 = `# AI News Daily Summary — 2026-10-16

## カテゴリ別まとめ

### OpenAI / Google / その他エージェント

- [新機能] **TypeSafe AI \`jev-1.14.0\`** — TypeSafe AI が 10/14 に Jev の新版を \`jev-preview\` で出した。
- [観測] **Orca \`v1.4.225\` のリリースが GitHub から消えた** — Stably AI の GitHub からタグが消えた。
`;
const DAY1017 = `# AI News Daily Summary — 2026-10-17

## カテゴリ別まとめ

### その他エージェント / 開発ツール

- [新機能] **OpenRouter Armor（ベータ）** — OpenRouter が 10/16 に、エージェントの操作を別の AI で事前に検査する機能をベータ公開した。同日に Perplexity もサンドボックス SPACE をオープンソース化した。
- [版更新] **Orca \`v1.4.227\`** — Stably AI が 10/16 に Orca を GitHub に出した。
`;
const DAY1018 = `# AI News Daily Summary — 2026-10-18

## カテゴリ別まとめ

### その他エージェント / 開発ツール

- [新機能] **Cursor cloud agent の Environments API（ベータ）** — Cursor が cloud agent の実行環境を API で作れるようにした。
- [新機能] **AgentsView** — GIGAZINE が紹介した OSS の AgentsView は、Claude Code・Codex・Cursor・Copilot・Gemini などのローカル履歴を集める。
`;

test('#20: TypeSafe と Orca が Cursor に出る', () => {
  assert.ok(has(DAY1016, 'cursor', 'TypeSafe AI'));
  assert.ok(has(DAY1016, 'cursor', 'Orca'));
});
test('#21: 「その他エージェント / 開発ツール」の OpenRouter と Orca が Cursor に出る', () => {
  assert.ok(has(DAY1017, 'cursor', 'OpenRouter Armor'));
  assert.ok(has(DAY1017, 'cursor', 'Orca'));
});
test('#22: AgentsView が Cursor に出て、同点の多い他カテゴリへは出ない', () => {
  assert.ok(has(DAY1018, 'cursor', 'AgentsView'));
  assert.ok(has(DAY1018, 'cursor', 'Environments API'));
  for (const s of ['claude', 'openai', 'google']) assert.ok(!has(DAY1018, s, 'AgentsView'), `AgentsView が ${s} へ漏れた`);
});

// --- 実データ（手元に 05_ai-news-daily があるときだけ。CI ではスキップ） ---
const DAILY = join(ROOT, '..', '05_ai-news-daily', 'daily', '2026');
const real = (d) => readFileSync(join(DAILY, `ai-news-daily-2026-${d}.md`), 'utf8');
const realCases = [
  ['09-26', 'github-copilot', 'GitHub'],
  ['09-29', 'studio', 'Power Pages'],
  ['10-06', 'open-weight', 'Reflection AI'],
  ['10-16', 'cursor', 'Orca'],
  ['10-17', 'cursor', 'OpenRouter'],
  ['10-18', 'cursor', 'AgentsView'],
];
for (const [d, slug, word] of realCases) {
  test(`実データ ${d}: ${slug} に「${word}」が出る`, { skip: !existsSync(DAILY) && '05_ai-news-daily が無い' }, () => {
    const got = titles(extractCategoryDay(real(d), slug));
    assert.ok(got.some((t) => t.includes(word)), `${d} の ${slug}: ${JSON.stringify(got)}`);
  });
}

// --- 2026-10-20 実データ比較で見つけた後退の防止 ---
test('Ollama はオープンウェイト（llama の部分一致に頼らない）', () => {
  assert.ok(catClassifySlugs('JetBrains 版の Copilot memory と Ollama 連携').includes('open-weight'));
});
test('「Microsoft（その他）」見出しは M365 Copilot と M365 管理を指す', () => {
  assert.deepEqual(catHeadingSlugs('Microsoft（その他）').sort(), ['m365-admin', 'm365-copilot']);
});

// --- 参照の無いハイライトは、題に語があれば題で振る（本文の他社名で上書きしない） ---
const DAY1015_HL1 = `### 1. [廃止] Copilot Studio の GPT-4.1 / GPT-5 系が 11/12 に退役する — 既定モデルが特定版から「最新版に追従する別名」に変わる

**要点**: 標準ハーネスの GPT-4.1 は 11/12 に GPT Chat Latest へ自動移行する。

- 続報: Claude Opus / Sonnet の旧版の退役日は別途告知される。実験枠は Grok 4.1 Fast から Grok 4.2 に替わった
`;
const DAY1015 = `# AI News Daily Summary — 2026-10-15

## 今日のハイライト

${DAY1015_HL1}

## カテゴリ別まとめ

### Claude / Anthropic

- **Claude Code \`2.1.300\`**（ハイライト参照・3）
- [動向] **シンガポール拠点** — Anthropic が事務所を開いた。

### Copilot Studio / Power Platform

- **Copilot Studio の GPT-4.1 / GPT-5 系退役**（ハイライト参照・1）
`;

test('catHlClassifySlugs は題の語を本文の他社名より優先する', () => {
  assert.deepEqual(catHlClassifySlugs(DAY1015_HL1).sort(), ['openai', 'studio']);
  assert.deepEqual(catClassifySlugs(DAY1015_HL1), ['claude']);
});

test('題に語が無いハイライトは本文全体で振る（changelog URL など）', () => {
  assert.deepEqual(catHlClassifySlugs(HL1).sort(), ['github-copilot', 'mcp']);
});

test('本文が Claude に触れても、Studio 退役を Claude ページに埋め込まない', () => {
  assert.ok(has(DAY1015, 'studio', 'Copilot Studio の GPT-4.1'), '正式参照の HL1 が Studio に無い');
  assert.ok(!has(DAY1015, 'claude', 'Copilot Studio の GPT-4.1'), 'Studio 退役が Claude に漏れた');
  assert.ok(has(DAY1015, 'claude', 'シンガポール拠点'), 'Claude の項目自体が消えた');
});

test('実データ 10-15: Claude に当日の Copilot Studio 退役ハイライトを出さない', { skip: !existsSync(DAILY) && '05_ai-news-daily が無い' }, () => {
  const got = titles(extractCategoryDay(real('10-15'), 'claude'));
  assert.ok(got.some((t) => t.includes('Claude Code') || t.includes('2.1.299')), `10-15 の claude: ${JSON.stringify(got)}`);
  assert.ok(!got.some((t) => t.includes('Copilot Studio') && t.includes('退役')), `10-15 の claude に Studio 退役が混入: ${JSON.stringify(got)}`);
});

test('実データ 10-04: Claude に Copilot Chat のモデルセレクターを出さない', { skip: !existsSync(DAILY) && '05_ai-news-daily が無い' }, () => {
  const got = titles(extractCategoryDay(real('10-04'), 'claude'));
  assert.ok(!got.some((t) => t.includes('モデルセレクター')), `10-04 の claude に Chat 料金が混入: ${JSON.stringify(got)}`);
});
