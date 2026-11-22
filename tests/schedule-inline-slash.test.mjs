// 注目予定の区切りは全角「 ／ 」だけであることを検査する。
// 実行: node --test tests/*.test.mjs
// 2026-11-22 の 12/11 は、後継モデルを半角「 / 」で並べたまま、
// 音声モードの退役を全角「 ／ 」で足した。半角まで区切りにすると
// gpt-6.1 の後継と「Advanced / Standard」が別々の予定に裂ける。
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

  get textContent() {
    return this.childNodes.map((node) => node.textContent).join('');
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
    this.childNodes = [];
  }

  get textContent() {
    return this.nodeValue;
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
const { splitScheduleParts } = Function(
  `${script}\nreturn { splitScheduleParts };`,
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

test('半角スラッシュだけの本文は割らない', () => {
  const voice = text('ChatGPT の Advanced / Standard 音声モードが退役（二次・一次未読）');
  const body = bodyFrom([voice]);
  splitScheduleParts(body);
  assert.deepEqual(body.childNodes, [voice]);
  assert.equal(body.classes.has('sched-multi'), false);
});

test('12/11 は全角スラッシュの前後で2件になり、半角スラッシュは各件に残る', () => {
  const stopped = el('strong', 'OpenAI gpt-5 / gpt-5-mini が停止');
  const sol = el('code', 'gpt-6.1-sol');
  const terra = el('code', 'gpt-6.1-terra');
  const luna = el('code', 'gpt-6-luna');
  const lead = text('（→ ');
  const betweenA = text(' / ');
  const betweenB = text(' / ');
  const body = bodyFrom([
    stopped,
    lead,
    sol,
    betweenA,
    terra,
    betweenB,
    luna,
    text('） ／ ChatGPT の Advanced / Standard 音声モードが退役（二次・一次未読）'),
  ]);

  splitScheduleParts(body);

  assert.equal(body.classes.has('sched-multi'), true);
  assert.equal(body.childNodes.length, 2);
  for (const part of body.childNodes) assert.equal(part.className, 'sched-part');
  assert.deepEqual(partsOf(body), [
    [stopped, lead, sol, betweenA, terra, betweenB, luna, text('）')],
    [text('ChatGPT の Advanced / Standard 音声モードが退役（二次・一次未読）')],
  ]);
  assert.equal(sol.childNodes[0].nodeValue, 'gpt-6.1-sol');
  assert.equal(stopped.childNodes[0].nodeValue, 'OpenAI gpt-5 / gpt-5-mini が停止');
});
