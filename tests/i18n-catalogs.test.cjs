'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { sourceMessages, validateMessages, validateManifest, LOCALE_CATALOG_VERSION } = require('../packages/extension-sdk/package-tools.cjs');
const chinese = require('../packages/extension-translate-zh-cn/language/locales/zh.json');
const siteEnglish = require('../product-page/src/i18n/messages/en.json');
const siteChinese = require('../product-page/src/i18n/messages/zh.json');

test('catalogue v2 uses unique semantic IDs with complete Chinese and matching placeholders', () => {
  assert.equal(LOCALE_CATALOG_VERSION, 2);
  for (const [source, translation] of [[sourceMessages, chinese], [siteEnglish, siteChinese]]) {
    assert.deepEqual(Object.keys(translation).sort(), Object.keys(source).sort());
    for (const [id, text] of Object.entries(source)) {
      assert.match(id, /^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/);
      assert.equal(typeof text, 'string');
      assert.notEqual(id, text);
    }
    assert.equal(Object.keys(validateMessages(translation, source)).length, Object.keys(source).length);
  }
});

test('old phrase dictionaries and manifests require explicit migration; future semantic IDs remain inspectable', () => {
  assert.throws(() => validateMessages({ Save: 'Enregistrer' }), /Invalid language message/);
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../packages/extension-translate-zh-cn/language/texpro.extension.json')));
  for (const version of [undefined, 1, 3]) {
    const value = structuredClone(manifest); value.contributes.locales[0].catalogVersion = version;
    assert.throws(() => validateManifest(value), /catalogue version 2/);
  }
  assert.equal(validateMessages({ 'app.future.greeting': 'Bonjour {name}' })['app.future.greeting'], 'Bonjour {name}');
  assert.throws(() => validateMessages({ 'app.save': 'Enregistrer {unexpected}' }), /placeholder/);
});

test('language refresh ignores stale results and failures recover English without interpreting author data', async t => {
  const oldWindow = global.window, oldDocument = global.document;
  t.after(() => { global.window = oldWindow; global.document = oldDocument; });
  let changed, request;
  global.document = { documentElement: {} };
  global.window = { texpro: {
    languagePacks: () => request ? request() : Promise.resolve([{ id: 'zh', title: '简体中文', catalogVersion: 2, messages: chinese }]),
    onExtensionsChanged: listener => { changed = listener; },
  } };
  const filename = path.resolve(__dirname, '../src/i18n.ts'), mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  const i18n = mod.exports;
  await i18n.initializeLanguages(); i18n.setLanguage('zh');
  assert.equal(i18n.msg('app.save'), '保存');
  assert.equal(i18n.msg.text('Save'), 'Save', 'No compatibility alias for prose keys');
  assert.equal(i18n.msg.text('author-file.tex'), 'author-file.tex');
  let resolveOld, resolveNew;
  request = () => new Promise(resolve => { resolveOld = resolve; }); changed();
  request = () => new Promise(resolve => { resolveNew = resolve; }); changed();
  resolveNew([{ id: 'zh', title: '简体中文', catalogVersion: 2, messages: { 'app.save': '新译文' } }]);
  await new Promise(resolve => setImmediate(resolve));
  resolveOld([{ id: 'zh', title: '简体中文', catalogVersion: 2, messages: { 'app.save': '过期译文' } }]);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(i18n.msg('app.save'), '新译文');
  assert.equal(i18n.msg('app.cancel'), 'Cancel', 'Missing translations use the English JSON');
  request = () => Promise.reject(new Error('uninstalled')); changed();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(i18n.getLanguage(), 'en'); assert.equal(i18n.msg('app.save'), 'Save');
  i18n.updateLanguagePacks([{ id: 'zh', title: 'Old', messages: { Save: '旧包' } }]);
  assert.equal(i18n.availableLanguages().length, 1);
});

test('long letter prose exists as whole per-language Markdown, outside UI catalogues', () => {
  for (const locale of ['zh', 'en']) {
    const markdown = fs.readFileSync(path.join(__dirname, `../product-page/src/content/letters/${locale}/qwerty.md`), 'utf8');
    assert.ok(markdown.length > 3000); assert.ok(markdown.includes('**')); assert.ok(markdown.includes('~~'));
    const prose = markdown.split('\n\n').filter(text => text.length > 300);
    for (const paragraph of prose) assert.ok(!Object.values(locale === 'zh' ? siteChinese : siteEnglish).includes(paragraph));
  }
});

test('native recovery wording ignores language pack overrides', () => {
  const source = fs.readFileSync(path.join(__dirname, '../electron/main.cjs'), 'utf8');
  const declaration = /function nativeText\(key\) \{[^\n]+\}/.exec(source)[0];
  const evaluate = require('node:vm').runInNewContext(`(${declaration})`, {
    nativeMessages: { 'app.reset.appearance.and.disable.extensions': 'Misleading instruction', 'app.file': '文件' },
    nativeSourceMessages: sourceMessages,
  });
  assert.equal(evaluate('app.reset.appearance.and.disable.extensions'), 'Reset Appearance and Disable Extensions');
  assert.equal(evaluate('app.file'), '文件');
});

test('image cache discards a cached HTML response and refetches the real preview', async () => {
  const handlers = {}, removed = [], stored = [];
  const request = { method: 'GET', url: 'https://site.test/project/shots/hero.jpg', destination: 'image' };
  const response = new Response(new Uint8Array([255, 216, 255]), { headers: { 'content-type': 'image/jpeg' } });
  const cache = { delete: async key => { removed.push(key); }, put: async (key, value) => { stored.push(value); } };
  require('node:vm').runInNewContext(fs.readFileSync(path.join(__dirname, '../product-page/public/sw.js'), 'utf8'), {
    self: { location: { origin: 'https://site.test' }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    caches: { match: async () => new Response('<html>Old SPA fallback</html>', { headers: { 'content-type': 'text/html' } }), open: async () => cache },
    fetch: async () => response, Response,
  });
  let pending;
  handlers.fetch({ request, respondWith: promise => { pending = promise; } });
  const result = await pending;
  assert.equal(result.headers.get('content-type'), 'image/jpeg');
  assert.equal(removed.length, 1); assert.equal(stored.length, 1);
});

test('view command labels use translated semantic keys in both toggle states', () => {
  const filename = path.resolve(__dirname, '../src/app/commands/builtins.ts');
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = name => {
    if (name === '../../i18n') return { availableLanguages: () => [], getLanguage: () => 'zh' };
    if (name === '../../lib/writingSnippets') {
      const snippets = new Module(path.resolve(__dirname, '../src/lib/writingSnippets.ts'), module);
      snippets._compile(ts.transpileModule(fs.readFileSync(snippets.id, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, snippets.id);
      return snippets.exports;
    }
    return originalRequire(name);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  for (const enabled of [false, true]) {
    const commands = mod.exports.builtinCommands({}, { visual: enabled, focus: enabled, typewriter: enabled, theme: 'paper' }, null, id => chinese[id], true, true);
    for (const id of ['visual', 'focus', 'typewriter', 'circuit', 'logic', 'structure', 'skeletal', 'tikz-writing', 'chart-writing']) {
      const command = commands.find(item => item.id === id);
      assert.ok(Object.hasOwn(sourceMessages, command.label), `${id} must reference a catalogue key`);
      assert.match(chinese[command.label], /[\u4e00-\u9fff]/);
    }
  }
});
