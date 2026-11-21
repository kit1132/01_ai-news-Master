// 注目予定で、1つの日付に並ぶ複数の停止を「 ／ 」で分ける処理を検査する。
// 実行: node --test tests/*.test.mjs
// 2026-11-21 のダイジェストは 11/30 などに退役を「 ／ 」で並べ、時期は「2027 春」。
// 区切りを外すと1行に潰れ、本文全体を文字で割ると code や太字の途中で割れる。
// 「2027 春」を年だけにすると、提出受付の時期が時期トグルから消える。
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const TEXT = 3;

class El {
  constructor(tag) {
    this.tag = tag;
    this.nodeType = 1;
    this.nodeValue = null;
    this.childNodes = [];
    this.className = '';
    this.classes = new Set();
    this.classList = { add: (name) => this.classes.add(name) };
  }

  appendChild(node) {
    this.childNodes.push(node);
    return node;
  }

  replaceChildren() {
    this.childNodes = [];
  }

  querySelectorAll(sel) {
    if (sel !== '.sched-part') return [];
    return this.childNodes.filter((node) => node.className === 'sched-part');
  }
}

class TextNode {
  constructor(value) {
    this.nodeType = TEXT;
    this.nodeValue = value;
  }
}

globalThis.Node = { TEXT_NODE: TEXT, ELEMENT_NODE: 1 };
globalThis.document = {
  createElement: (tag) => new El(tag),
  createTextNode: (value) => new TextNode(value),
  querySelector: () => null,
};

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));
const { splitScheduleParts, parseScheduleLabel, schedAnchor, state } = Function(
  `${script}\nreturn { splitScheduleParts, parseScheduleLabel, schedAnchor, state };`,
)();

const text = (value) => new TextNode(value);
const el = (tag, value) => {
  const node = new El(tag);
  if (value !== undefined) node.appendChild(text(value));
  return node;
};
const bodyFrom = (nodes) => {
  const body = new El('span');
  for (const node of nodes) body.appendChild(node);
  return body;
};
const partsOf = (body) => body.childNodes.map((part) => part.childNodes);

test('区切りの無い予定はそのまま残す', () => {
  const only = text('GitHub の cloud sandbox の課金が開始（日付は明記なし）');
  const body = bodyFrom([only]);
  splitScheduleParts(body);
  assert.deepEqual(body.childNodes, [only]);
  assert.equal(body.classes.has('sched-multi'), false);
});

test('11/30 の退役は4件に分かれ、code と太字はそれぞれの件に残る', () => {
  const sonnet = el('code', 'claude-sonnet-4-5-20250929');
  const opus = el('strong', 'Opus 4.8 の fast mode を削除');
  const prompts = el('strong', 'OpenAI /v1/prompts・Evals・Agent Builder が停止');
  const body = bodyFrom([
    sonnet,
    text(' が Claude API から退役 ／ '),
    opus,
    text(' ／ '),
    prompts,
    text(' ／ Gemini 4 Argon の導入価格が終了（二次）'),
  ]);
  splitScheduleParts(body);

  assert.equal(body.classes.has('sched-multi'), true);
  assert.equal(body.childNodes.length, 4);
  for (const part of body.childNodes) assert.equal(part.className, 'sched-part');
  const parts = partsOf(body);
  assert.deepEqual(parts[0], [sonnet, text('が Claude API から退役')]);
  assert.deepEqual(parts[1], [opus]);
  assert.deepEqual(parts[2], [prompts]);
  assert.deepEqual(parts[3], [text('Gemini 4 Argon の導入価格が終了（二次）')]);
});

test('要素の中の ／ では割らない。空の区切りは件にしない', () => {
  const inner = text('a／b');
  const code = el('code');
  code.appendChild(inner);
  const untouched = bodyFrom([text('前 '), code, text(' 後')]);
  splitScheduleParts(untouched);
  assert.equal(untouched.childNodes[1], code);
  assert.equal(inner.nodeValue, 'a／b');
  assert.equal(untouched.classes.has('sched-multi'), false);

  const doubled = bodyFrom([text('退役 ／／ 削除')]);
  splitScheduleParts(doubled);
  assert.equal(doubled.classes.has('sched-multi'), true);
  assert.deepEqual(partsOf(doubled), [[text('退役')], [text('削除')]]);
});

test('「2026年11月中」は今月の月トグル、「2027 春」は時期トグルに残る', () => {
  state.activeId = '2026-11-21';
  const digest = new Date(2026, 10, 21);

  const month = parseScheduleLabel('2026年11月中');
  assert.deepEqual(month, { day: '', quals: ['11月中'], year: 2026 });
  assert.deepEqual(schedAnchor(month, digest), { kind: 'month', y: 2026, m: 11 });

  const spring = parseScheduleLabel('2027 春');
  assert.deepEqual(spring, { day: '', quals: ['2027 春'], year: null });
  assert.deepEqual(schedAnchor(spring, digest), { kind: 'period', y: 2026, label: '2027 春' });
});
