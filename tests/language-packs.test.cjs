'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { validateManifest, validateMessages, readPackage, pack, messageCoverage } = require('../packages/extension-sdk/package-tools.cjs');
const { ExtensionManager } = require('../electron/services/extensions/manager.cjs');
const builtin = path.join(__dirname, '../packages/extension-translate-zh-cn/language');
function fixture(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-locales-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
const manifest = { id: 'test.french', name: { en: 'French', fr: 'Français' }, version: '1.0.0', apiVersion: 1, author: 'Writer', license: 'MIT', capabilities: [], contributes: { locales: [{ id: 'fr', title: 'Français', messages: 'fr.json' }] } };
test('functional plugins use their own bundled i18n and the current invocation language', async t => {
  const root = fixture(t), source = path.join(root, 'functional.tpp');
  const plugin = { ...manifest, id: 'test.own-i18n', entry: 'index.cjs', contributes: { actions: [{ id: 'status', title: { en: 'Status', fr: 'État' }, kind: 'command' }] } };
  fs.writeFileSync(source, pack(new Map([
    ['texpro.extension.json', JSON.stringify(plugin)], ['LICENSE', 'MIT'],
    ['i18n/messages.json', JSON.stringify({ en: { ready: 'Ready', missing: 'English fallback' }, fr: { ready: 'Prêt' } })],
    ['index.cjs', `const messages=require('./i18n/messages.json');exports.activate=ctx=>ctx.handle('status',invocation=>{const table=messages[invocation.language]||messages[invocation.language.split('-')[0]]||messages.en;return {message:(table.ready||messages.en.ready)+' / '+(table.missing||messages.en.missing)};});`],
  ])));
  const manager = new ExtensionManager(path.join(root, 'installed')); t.after(() => manager.stop());
  await manager.install(source, manager.inspect(source).digest); await manager.enable(plugin.id, true, true);
  const context = { source: '', selection: { from: 0, to: 0 } };
  assert.equal((await manager.invoke(plugin.id, 'status', { ...context, language: 'fr-FR' }, {})).message, 'Prêt / English fallback');
  assert.equal((await manager.invoke(plugin.id, 'status', { ...context, language: 'de-DE' }, {})).message, 'Ready / English fallback');
  assert.equal(manager.languages().length, 0, 'Plugin dictionaries do not replace host language packs');
});
function languageSource(root) { const dir = path.join(root, 'français'); fs.mkdirSync(dir); fs.writeFileSync(path.join(dir, 'texpro.extension.json'), JSON.stringify(manifest)); fs.writeFileSync(path.join(dir, 'LICENSE'), 'MIT'); fs.writeFileSync(path.join(dir, 'fr.json'), JSON.stringify({ Save: 'Enregistrer' })); return dir; }
test('preinstalled Chinese is a complete independently valid data-only tpp language package', () => {
  const info = readPackage(builtin);
  assert.equal(info.manifest.entry, undefined); assert.deepEqual(info.manifest.capabilities, []);
  const messages = JSON.parse(info.files.get('locales/zh.json'));
  assert.equal(messages.Save, '保存'); assert.equal(messages['Close Project'], '关闭工程');
  assert.equal(messageCoverage(messages).missing.length, 0);
});
test('language validation rejects code, styles, duplicate identifiers, recovery replacement and unsafe message paths', () => {
  assert.equal(validateManifest(manifest).contributes.locales[0].id, 'fr');
  for (const patch of [{ entry: 'index.cjs' }, { capabilities: ['network'] }, { contributes: { locales: [{ id: 'en', title: 'Bad', messages: 'bad.json' }] } }, { contributes: { locales: [...manifest.contributes.locales, ...manifest.contributes.locales] } }, { contributes: { locales: [{ ...manifest.contributes.locales[0], messages: '../bad.json' }] } }]) assert.throws(() => validateManifest({ ...manifest, ...patch }));
  assert.throws(() => validateMessages(JSON.parse('{"__proto__":"bad"}')));
  assert.throws(() => validateMessages({ 'Hello {name}': 'Bonjour {other}' }));
  assert.throws(() => validateMessages({ Save: ['bad'] }));
  assert.equal(validateMessages({ 'Hello {name}': 'Bonjour {name}' })['Hello {name}'], 'Bonjour {name}');
});
test('language install, enable, disable, restart and remove stay declarative and preserve builtin state', async t => {
  const root = fixture(t), installed = path.join(root, 'installed'), source = languageSource(root);
  const manager = new ExtensionManager(installed, { builtinSources: [builtin] }); t.after(() => manager.stop());
  await manager.start(); assert.equal(manager.languages()[0].id, 'zh');
  assert.equal(manager.list()[0].builtin, true);
  const preview = manager.inspect(source); await manager.install(source, preview.digest);
  assert.equal(manager.languages().some(locale => locale.id === 'fr'), false);
  await manager.enable('test.french', true); assert.equal(manager.languages().find(locale => locale.id === 'fr').messages.Save, 'Enregistrer');
  assert.equal(manager.workers.size, 0);
  await manager.enable('texpro.language-zh-cn', false);
  const next = new ExtensionManager(installed, { builtinSources: [builtin] }); await next.start(); t.after(() => next.stop());
  assert.equal(next.languages().some(locale => locale.id === 'zh'), false);
  await assert.rejects(next.remove('texpro.language-zh-cn'), /Preinstalled/);
  await next.remove('test.french'); assert.deepEqual(next.languages(), []);
});
test('corrupt language data cannot provide enabled messages and changed packages require reinspection', async t => {
  const root = fixture(t), source = languageSource(root), manager = new ExtensionManager(path.join(root, 'installed')); t.after(() => manager.stop());
  const info = manager.inspect(source); fs.writeFileSync(path.join(source, 'fr.json'), '{"Save":"Changer"}');
  await assert.rejects(manager.install(source, info.digest), /changed/);
  await manager.install(source, manager.inspect(source).digest); await manager.enable('test.french', true);
  fs.writeFileSync(path.join(manager.folder('test.french'), 'fr.json'), '{bad');
  assert.deepEqual(manager.languages(), []); assert.equal(manager.list()[0].enabled, false);
});
test('safe mode disables language packs and builtin updates can be removed to recover bundled data', async t => {
  const root = fixture(t), manager = new ExtensionManager(path.join(root, 'installed'), { builtinSources: [builtin], safeMode: true });
  await manager.start(); assert.deepEqual(manager.languages(), []);
  await manager.install(builtin, manager.inspect(builtin).digest); await manager.enable('texpro.language-zh-cn', true);
  await manager.remove('texpro.language-zh-cn'); assert.equal(manager.list()[0].builtin, true); assert.deepEqual(manager.languages(), []);
});
