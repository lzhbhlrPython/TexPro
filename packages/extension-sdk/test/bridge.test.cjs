'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { defineJsonExtension, defineTextTransform } = require('../index.cjs');
function host() {
  const handlers = new Map(), events = new Map(), logs = [];
  const context = { apiVersion: 1, config: { locale: 'zh' }, handle(id, fn) { handlers.set(id, fn); return () => handlers.delete(id); }, on(name, fn) { events.set(name, fn); return () => events.delete(name); }, log(message) { logs.push(message); } };
  const invocation = controller => ({ source: '前😀hello后', language: 'zh', selection: { from: 3, to: 8 }, signal: controller.signal, services: { call: async (name, args) => ({ name, args }) } });
  return { handlers, events, logs, context, invocation };
}
test('compiled text binding retains UTF-16 ranges and cleans up registrations', async () => {
  const h = host(), dispose = await defineTextTransform(text => text.toUpperCase()).activate(h.context);
  assert.deepEqual(await h.handlers.get('uppercase')(h.invocation(new AbortController()), {}), { edits: [{ from: 3, to: 8, insert: 'HELLO' }] });
  await dispose(); await dispose(); assert.equal(h.handlers.size, 0); assert.equal(h.events.size, 0);
});
test('JSON bridge correlates concurrent requests, forwards services/events and rejects late cancelled results', async () => {
  const h = host(), sent = []; let receive, cleanup = 0;
  const dispose = await defineJsonExtension({ actions: ['edit'], start(callback) { receive = callback; return { send: json => sent.push(JSON.parse(json)), dispose: () => cleanup++ }; } }).activate(h.context);
  assert.deepEqual(sent[0], { type: 'init', apiVersion: 1, config: { locale: 'zh' } });
  const first = new AbortController(), second = new AbortController();
  const a = h.handlers.get('edit')(h.invocation(first), { index: 1 });
  const b = h.handlers.get('edit')(h.invocation(second), { index: 2 });
  const messages = sent.filter(m => m.type === 'invoke');
  assert.equal(messages[0].context.signal, undefined); assert.equal(messages[0].context.services, undefined);
  receive(JSON.stringify({ type: 'service', id: messages[1].id, callId: 'read', name: 'project.readFile', args: { path: 'chapter.tex' } }));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(sent.at(-1).result.name, 'project.readFile');
  receive(JSON.stringify({ type: 'result', id: messages[1].id, result: { message: 'second' } }));
  assert.deepEqual(await b, { message: 'second' });
  const rejected = assert.rejects(a, /cancelled/); first.abort(); await rejected;
  receive(JSON.stringify({ type: 'result', id: messages[0].id, result: { message: 'stale' } }));
  receive(JSON.stringify({ type: 'service', id: messages[0].id, callId: 'late', name: 'storage.set', args: {} }));
  h.events.get('projectChanged')({ root: 'new' }); assert.equal(sent.at(-1).type, 'event');
  await dispose(); assert.equal(cleanup, 1); assert.equal(sent.at(-1).type, 'dispose');
});
test('invalid bridge output and disposal reject pending work without leaking subscriptions', async () => {
  const h = host(); let receive;
  const dispose = await defineJsonExtension({ actions: ['edit'], start(callback) { receive = callback; return { send(json) {
    if (JSON.parse(json).type === 'dispose') receive(JSON.stringify({ type: 'result', id: 2, result: { message: 'late disposal result' } }));
  } }; } }).activate(h.context);
  const result = h.handlers.get('edit')(h.invocation(new AbortController()), {});
  const rejection = assert.rejects(result, /Invalid JSON/); receive('null'); await rejection;
  const pending = h.handlers.get('edit')(h.invocation(new AbortController()), {});
  const closed = assert.rejects(pending, /disposed/); await dispose(); await closed;
  assert.equal(h.handlers.size, 0); assert.ok(h.logs.length);
});
test('JSON bridge bounds outstanding work and cancels timed out requests', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const h = host(), sent = [];
  const dispose = await defineJsonExtension({ actions: ['edit'], start() { return { send: json => sent.push(JSON.parse(json)) }; } }).activate(h.context);
  const requests = Array.from({ length: 4 }, () => h.handlers.get('edit')(h.invocation(new AbortController()), {}));
  await assert.rejects(h.handlers.get('edit')(h.invocation(new AbortController()), {}), /busy/);
  const rejected = requests.map(p => assert.rejects(p, /timed out/)); t.mock.timers.tick(9500); await Promise.all(rejected);
  assert.equal(sent.filter(m => m.type === 'cancel').length, 4); await dispose();
});
