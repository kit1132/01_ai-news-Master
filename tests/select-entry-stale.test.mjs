import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = readFileSync(join(root, 'index.html'), 'utf8');

test('selectEntry が日付切替の遅延応答を捨てるガードを持つ', () => {
  assert.match(index, /const isStaleSelect = \(token, id\) => token !== state\.token \|\| id !== state\.activeId/);
  assert.match(index, /if \(isStaleSelect\(my, id\)\) return; \/\/ ソース切替・別日付の遅延応答は描画しない/);
});

// index.html の isStaleSelect と同じ判定。日付 A の遅延 fetch が日付 B を上書きしないこと。
test('遅い昨日の応答は、既に選んだ今日を上書きしない', async () => {
  const state = { token: 1, activeId: null };
  const isStaleSelect = (token, id) => token !== state.token || id !== state.activeId;
  const rendered = [];

  async function selectEntry(id, delayMs, body) {
    const my = state.token;
    state.activeId = id;
    await new Promise((r) => setTimeout(r, delayMs));
    if (isStaleSelect(my, id)) return;
    rendered.push(body);
  }

  const yesterday = selectEntry('2026-09-21', 40, 'YESTERDAY');
  await new Promise((r) => setTimeout(r, 5));
  const today = selectEntry('2026-09-22', 5, 'TODAY');
  await Promise.all([yesterday, today]);

  assert.deepEqual(rendered, ['TODAY']);
  assert.equal(state.activeId, '2026-09-22');
});

test('既に別日付へ移ったあとの fetch 失敗は描画も throw もしない', async () => {
  const state = { token: 1, activeId: null };
  const isStaleSelect = (token, id) => token !== state.token || id !== state.activeId;
  const rendered = [];
  let threw = false;

  async function selectEntry(id, { delayMs, fail, body }) {
    const my = state.token;
    state.activeId = id;
    await new Promise((r) => setTimeout(r, delayMs));
    if (fail) {
      if (isStaleSelect(my, id)) return;
      threw = true;
      throw new Error('fetch failed');
    }
    if (isStaleSelect(my, id)) return;
    rendered.push(body);
  }

  const failed = selectEntry('2026-09-21', { delayMs: 40, fail: true }).catch((err) => {
    threw = true;
    throw err;
  });
  await new Promise((r) => setTimeout(r, 5));
  const ok = selectEntry('2026-09-22', { delayMs: 5, fail: false, body: 'TODAY' });
  await Promise.all([failed, ok]);

  assert.equal(threw, false);
  assert.deepEqual(rendered, ['TODAY']);
});
