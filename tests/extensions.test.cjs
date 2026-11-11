const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pack, unpack } = require('../electron/services/extensions/archive.cjs');
const { validateManifest, validateTheme } = require('../electron/services/extensions/schema.cjs');
const { ExtensionManager } = require('../electron/services/extensions/manager.cjs');
const manifest = (extra = {}) => ({ id: 'test.extension', name: { en: 'Test', zh: '测试' }, version: '1.0.0', author: 'Test', license: 'MIT', apiVersion: 1, capabilities: [], contributes: {}, ...extra });
function fixture(t, m, code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-extension-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source'); fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'texpro.extension.json'), JSON.stringify(m)); fs.writeFileSync(path.join(source, 'LICENSE'), 'MIT test fixture');
  if (code) fs.writeFileSync(path.join(source, 'index.cjs'), code);
  const manager = new ExtensionManager(path.join(dir, 'installed')); t.after(() => manager.stop());
  return { dir, source, manager };
}
const context = { source: 'Hello', selection: { from: 0, to: 5 }, language: 'en' };
test('extension manifest rejects incompatible APIs, undeclared capabilities, scripts and CSS injection', () => {
  assert.equal(validateManifest(manifest()).apiVersion, 1);
  for (const change of [{ apiVersion: 2 }, { id: '../escape' }, { capabilities: ['shell'] }, { scripts: { install: 'bad' } }]) assert.throws(() => validateManifest(manifest(change)));
  assert.throws(() => validateTheme({ id: 'test', title: 'Test', base: 'paper', tokens: { paper: 'url(https://example.com)' } }));
  assert.throws(() => validateTheme({ id: 'test', title: 'Test', base: 'paper', tokens: { arbitrary: '#ffffff' } }));
});
test('portable ZIP packages round trip Unicode and reject corruption, traversal and duplicates', () => {
  const files = new Map([['texpro.extension.json', Buffer.from('{}')], ['资源.txt', Buffer.from('中文')]]);
  const zip = pack(files); assert.equal(unpack(zip).get('资源.txt').toString(), '中文');
  const bad = Buffer.from(zip); bad[55] ^= 1; assert.throws(() => unpack(bad));
  assert.throws(() => pack(new Map([['../outside', 'no']])));
  assert.throws(() => pack(new Map([['One', 'a'], ['one', 'b']])));
});
test('local install verifies inspected bytes and does not auto-enable code or run installation scripts', async t => {
  const { source, manager } = fixture(t, manifest()); const preview = manager.inspect(source);
  fs.writeFileSync(path.join(source, 'extra.txt'), 'changed');
  await assert.rejects(manager.install(source, preview.digest), /changed/);
  await manager.install(source, manager.inspect(source).digest); assert.equal(manager.list()[0].enabled, false);
  await manager.enable('test.extension', true); assert.equal(manager.list()[0].enabled, true);
  fs.symlinkSync(path.join(source, 'LICENSE'), path.join(source, 'escape'));
  assert.throws(() => manager.inspect(source), /symbolic/);
});
test('trusted code lifecycle, storage and capability checks survive disable, update and rollback', async t => {
  const m = manifest({ entry: 'index.cjs', capabilities: ['storage'], contributes: { actions: [{ id: 'hello', title: 'Hello', kind: 'command' }] } });
  const { manager, source } = fixture(t, m, `exports.activate = ctx => { ctx.handle('hello', async c => { const n = (await c.services.call('storage.get', { key:'count' })) || 0; await c.services.call('storage.set', { key:'count', value:n+1 }); return { message: String(n+1), content:c.source }; }); };`);
  await manager.install(source, manager.inspect(source).digest);
  await assert.rejects(manager.enable(m.id, true), /explicit trust/);
  await manager.enable(m.id, true, true);
  assert.deepEqual(await manager.invoke(m.id, 'hello', context, {}), { message: '1', content: '' });
  await manager.enable(m.id, false); await assert.rejects(manager.invoke(m.id, 'hello', context, {}), /unavailable/);
  await manager.enable(m.id, true, true); assert.equal((await manager.invoke(m.id, 'hello', context, {})).message, '2');
  fs.writeFileSync(path.join(source, 'texpro.extension.json'), JSON.stringify({ ...m, version: '1.1.0' }));
  await manager.reload(m.id); assert.equal(manager.list()[0].enabled, false); assert.equal(manager.list()[0].manifest.version, '1.1.0');
  await manager.rollback(m.id); assert.equal(manager.list()[0].manifest.version, '1.0.0'); assert.equal(manager.list()[0].enabled, false);
  await manager.remove(m.id); assert.equal(manager.list().length, 0);
});
test('plugin crash rejects outstanding work, cannot edit without capability, and remains recoverable', async t => {
  const m = manifest({ entry: 'index.cjs', contributes: { actions: [{ id: 'edit', title: 'Edit', kind: 'transform' }, { id: 'crash', title: 'Crash', kind: 'command' }] } });
  const { manager, source } = fixture(t, m, `exports.activate = ctx => { ctx.handle('edit', () => ({ edits: [{ from:0,to:0,insert:'bad' }] })); ctx.handle('crash', () => process.exit(7)); };`);
  await manager.install(source, manager.inspect(source).digest); await manager.enable(m.id, true, true);
  await assert.rejects(manager.invoke(m.id, 'edit', context, {}), /document.write/);
  await assert.rejects(manager.invoke(m.id, 'crash', context, {}), /exited/);
  assert.equal(manager.list()[0].enabled, false); assert.match(manager.list()[0].error, /exited/);
  await manager.enable(m.id, true, true); assert.equal(manager.list()[0].enabled, true);
});
