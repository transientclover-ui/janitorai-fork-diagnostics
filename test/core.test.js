import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const core = vm.runInNewContext(readFileSync('src/core.js', 'utf8') + '\nNFI', { URL });
const store = () => { const map = new Map(); return { getItem: k => map.get(k) ?? null, setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) }; };
test('accepts only canonical JanitorAI chat destinations and strips fragments/queries', () => {
  assert.equal(core.chatUrl('https://janitorai.com/chats/123?token=secret#abc'), 'https://janitorai.com/chats/123');
  for (const url of ['https://evil.test/chats/1', 'http://janitorai.com/chats/1', 'https://janitorai.com/chats/1/other', 'https://janitorai.com@evil.test/chats/1']) assert.equal(core.chatUrl(url), null);
});
test('report excludes private URLs and identifiers, and retention prunes both stores', () => {
  const s = store(), now = Date.now();
  const record = { id: 'secret-id', time: now, outcome: 'destination_observed', signal: 'different_chat_navigation', elapsedMs: 20 };
  core.save(s, record, 'https://janitorai.com/chats/123?private=1');
  const exported = JSON.stringify(core.report(core.prune(s, now).records));
  assert.ok(!exported.includes('123')); assert.ok(!exported.includes('secret-id')); assert.ok(!exported.includes('private'));
  assert.equal(core.prune(s, now).history[0].url, 'https://janitorai.com/chats/123');
  assert.equal(core.prune(s, now + 31 * 86400000).history.length, 0);
  core.clear(s); assert.equal(s.getItem(core.PRIVATE_KEY), null);
});
