'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { environmentInit, writeEnvironmentPlan } = require('../packages/qwertysay/lib/environment.cjs');
const { syncReview } = require('../electron/services/extensions/environment.cjs');
const { ExtensionManager } = require('../electron/services/extensions/manager.cjs');
const { pack } = require('../packages/extension-sdk/package-tools.cjs');
const manifest = { id: 'author.words', name: 'Words', version: '1.0.0', author: 'Writer', license: 'MIT', apiVersion: 1, capabilities: [], contributes: { snippets: [{ label: 'Word', template: 'Word' }] } };
test('startup sync paths survive Electron switch reordering and keep spaced paths intact', () => {
  const { syncPath } = require('../electron/services/extensions/launch.cjs');
  const file = path.resolve(os.tmpdir(), 'environment with spaces', 'plan.json');
  assert.equal(syncPath(['TeXPro', '--extension-sync=' + file, '--no-sandbox']), file);
  assert.equal(syncPath(['TeXPro', '--extension-sync', '--no-sandbox', '--disable-gpu', file]), file);
  assert.equal(syncPath(['TeXPro', '--extension-sync', file]), file);
  assert.equal(syncPath(['TeXPro', '--extension-sync=relative.json']), undefined);
  assert.equal(syncPath(['TeXPro', '--extension-sync', '--disable-gpu']), undefined);
});
function fixture(t, pm = 'npm') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-extension-env-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const env = path.join(root, 'environment with spaces'); environmentInit(env, pm);
  const pkg = JSON.parse(fs.readFileSync(path.join(env, 'package.json'))); pkg.dependencies = { '@author/words': '1.0.0' }; fs.writeFileSync(path.join(env, 'package.json'), JSON.stringify(pkg));
  fs.writeFileSync(path.join(env, pm === 'npm' ? 'package-lock.json' : 'yarn.lock'), 'fixture lock');
  const directory = path.join(env, 'node_modules/@author/words'); fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: '@author/words', version: '1.0.0', texpro: { package: 'words.tpp' }, scripts: { install: 'throw' } }));
  fs.writeFileSync(path.join(directory, 'words.tpp'), pack(new Map([['texpro.extension.json', JSON.stringify(manifest)], ['LICENSE', 'MIT']])));
  const manager = new ExtensionManager(path.join(root, 'installed')); t.after(() => manager.stop());
  return { root, env, directory, manager, pkg };
}
test('npm and Yarn dependency sync install disabled, update only their own records and remove after package-manager uninstall', async t => {
  for (const pm of ['npm', 'yarn']) {
    const { env, directory, manager, pkg } = fixture(t, pm);
    const file = writeEnvironmentPlan(env), review = syncReview(manager, file);
    assert.equal(review.changes.length, 1); const change = review.changes[0];
    await manager.install(change.source, change.digest, change.origin);
    assert.equal(manager.list()[0].enabled, false); assert.equal(manager.records[manifest.id].origin.name, '@author/words');
    assert.deepEqual(syncReview(manager, file).changes, []);
    await manager.enable(manifest.id, true); assert.equal(manager.workers.size, 0);
    delete pkg.dependencies['@author/words']; fs.writeFileSync(path.join(env, 'package.json'), JSON.stringify(pkg)); fs.rmSync(directory, { recursive: true });
    const next = syncReview(manager, writeEnvironmentPlan(env)); assert.equal(next.changes[0].kind, 'remove');
    await manager.remove(next.changes[0].id); assert.deepEqual(manager.list(), []);
  }
});
test('sync rejects mixed locks, changed files and attempts to take over manual installs', async t => {
  const { env, directory, manager } = fixture(t);
  const file = writeEnvironmentPlan(env);
  fs.writeFileSync(path.join(env, 'yarn.lock'), 'late mixed lock');
  assert.throws(() => syncReview(manager, file), /single package manager lockfile/);
  fs.rmSync(path.join(env, 'yarn.lock'));
  fs.appendFileSync(path.join(env, 'package-lock.json'), 'changed'); assert.throws(() => syncReview(manager, file), /lockfile changed/);
  const fresh = writeEnvironmentPlan(env), change = syncReview(manager, fresh).changes[0];
  await manager.install(change.source, change.digest);
  assert.throws(() => syncReview(manager, fresh), /manually installed/);
  fs.writeFileSync(path.join(env, 'yarn.lock'), 'mixed'); assert.throws(() => writeEnvironmentPlan(env), /single/);
  fs.rmSync(path.join(env, 'yarn.lock')); fs.writeFileSync(path.join(directory, 'words.tpp'), 'corrupt'); assert.throws(() => writeEnvironmentPlan(env));
});
test('one environment cannot uninstall or adopt another environment extension, and plugin data survives removal', async t => {
  const a = fixture(t), b = fixture(t);
  const change = syncReview(a.manager, writeEnvironmentPlan(a.env)).changes[0];
  await a.manager.install(change.source, change.digest, change.origin);
  assert.throws(() => syncReview(a.manager, writeEnvironmentPlan(b.env)), /another environment/);
  const data = path.join(a.manager.directory, 'data', manifest.id + '.json'); fs.mkdirSync(path.dirname(data), { recursive: true }); fs.writeFileSync(data, 'saved preferences');
  await a.manager.remove(manifest.id); assert.equal(fs.readFileSync(data, 'utf8'), 'saved preferences');
});
test('an uninstall review expires when rollback changes the installed package', async t => {
  const { root, env, pkg } = fixture(t), callbacks = new Map();
  const contents = { send() {} }, window = { webContents: contents, isDestroyed: () => false };
  const manager = require('../electron/services/extensions/ipc.cjs').registerExtensionIpc({
    app: { getPath: () => path.join(root, 'ipc-profile') }, ipcMain: { handle: (name, callback) => callbacks.set(name, callback) },
    dialog: {}, getWindow: () => window,
  });
  t.after(() => manager.stop());
  const change = syncReview(manager, writeEnvironmentPlan(env)).changes[0];
  await manager.install(change.source, change.digest, change.origin);
  const updated = path.join(root, 'updated.tpp');
  fs.writeFileSync(updated, pack(new Map([['texpro.extension.json', JSON.stringify({ ...manifest, version: '1.0.1' })], ['LICENSE', 'MIT']])));
  await manager.install(updated, manager.inspect(updated).digest, change.origin);
  delete pkg.dependencies['@author/words']; fs.writeFileSync(path.join(env, 'package.json'), JSON.stringify(pkg));
  manager.queueSync(writeEnvironmentPlan(env));
  await manager.rollback(manifest.id);
  await assert.rejects(callbacks.get('extensions:sync-apply')({ sender: contents }, manifest.id), /sync changed/);
  assert.equal(manager.manifest(manifest.id).version, '1.0.0');
});
