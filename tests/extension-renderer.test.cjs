const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const loaded = new Map();
function load(file) {
  const filename = path.resolve(__dirname, '..', file), mod = new Module(filename, module); mod.paths = module.paths;
  if (loaded.has(filename)) return loaded.get(filename);
  loaded.set(filename, mod.exports);
  const originalRequire = Module.createRequire(filename);
  mod.require = specifier => {
    const target = path.resolve(path.dirname(filename), specifier + '.ts');
    return specifier.startsWith('.') && fs.existsSync(target) ? load(target) : originalRequire(specifier);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  return mod.exports;
}
const { validateResult, applyThemeTokens, extensionThemes } = load('src/app/extensions/contracts.ts');
const { commandRegistry } = load('src/app/commands/types.ts');
test('extension edit proposals reject malformed positions, overlap, traversal exports and unsupported requests', () => {
  assert.deepEqual(validateResult({ edits: [{ from: 0, to: 2, insert: 'A' }] }, 'abc').edits[0].insert, 'A');
  for (const result of [null, { edits: [{ from: -1, to: 0, insert: '' }] }, { edits: [{ from: 0, to: 2, insert: '' }, { from: 1, to: 3, insert: '' }] }, { edits: [{ from: 0, to: 9, insert: '' }] }, { diagnostics: [{ from: 0, to: 1, severity: 'unknown', message: 'bad' }] }, { output: { name: '../outside', content: 'bad' } }, { project: { name: 'x', engine: 'pdflatex', files: [{ path: '../x.tex', content: '' }] } }, { action: 'shell' }]) assert.throws(() => validateResult(result, 'abc'));
});
test('theme preview replaces only package tokens and returns cleanly to the built-in cascade', () => {
  const values = new Map([['--editor-width', '760px']]);
  const root = { dataset: {}, style: { setProperty: (key, value) => values.set(key, value), removeProperty: key => values.delete(key) } };
  applyThemeTokens(root, { tokens: { paper: '#fff9ed', 'editor-text': '#302c25' } });
  assert.equal(values.get('--paper'), '#fff9ed');
  applyThemeTokens(root, { tokens: { accent: '#994321' } });
  assert.equal(values.has('--paper'), false); assert.equal(values.get('--accent'), '#994321');
  applyThemeTokens(root); assert.deepEqual([...values], [['--editor-width', '760px']]);
  assert.equal(extensionThemes([{ enabled: false, manifest: { contributes: { themes: [{ id: 'x' }] } } }]).length, 0);
});
test('one command registry rejects conflicting IDs across built-in and external commands', () => {
  const action = { id: 'save', run() {} };
  assert.equal(commandRegistry([action], [{ id: 'author.plugin/action', run() {} }]).length, 2);
  assert.throws(() => commandRegistry([action], [action]), /duplicate/);
  const { builtinCommands } = load('src/app/commands/builtins.ts');
  const i18n = load('src/i18n.ts');
  global.document = { documentElement: {} };
  i18n.updateLanguagePacks([{ catalogVersion: 2, id: 'zh', title: '简体中文', messages: {} }]);
  for (const [language, label, target] of [['zh','English','language-en'],['en','简体中文','language-zh']]) {
    i18n.setLanguage(language); let invoked=''; const handlers = new Proxy({}, { get: (_object, id) => value => { invoked = id === 'language-select' ? 'language-' + value : id; } });
    const commands = builtinCommands(handlers, {language}, null, value=>value, false, false);
    const choices = commands.filter(command => command.id.startsWith('language'));
    assert.equal(choices.length,1); assert.equal(choices[0].label,label); choices[0].run(); assert.equal(invoked,target);
  }
  delete global.document;
});

const { applyExternalEdits } = load('src/editor/externalEdits.ts');
const { sameWritingSnapshot } = load('src/app/writingPort.ts');
const { EditorState, StateEffect } = require('@codemirror/state');
const { history, undo, redo } = require('@codemirror/commands');
test('external multi-range edits retain a single real CodeMirror undo group and reject composition', () => {
  let state = EditorState.create({ doc: '中文 abc xyz', extensions: [history()] });
  const effect = StateEffect.define();
  const view = { get state() { return state; }, composing: false, scrollSnapshot: () => effect.of(null), dispatch(spec) { state = spec.state || state.update(spec).state; } };
  assert.equal(applyExternalEdits(view, state.doc.toString(), [{ from: 3, to: 6, insert: 'ABC' }, { from: 7, to: 10, insert: 'XYZ' }]), true);
  assert.equal(state.doc.toString(), '中文 ABC XYZ'); undo(view); assert.equal(state.doc.toString(), '中文 abc xyz'); redo(view); assert.equal(state.doc.toString(), '中文 ABC XYZ');
  view.composing = true; assert.equal(applyExternalEdits(view, state.doc.toString(), [{ from: 0, to: 2, insert: 'no' }]), false);
});
test('editing then undoing identical source still invalidates a pending writing snapshot', () => {
  let state = EditorState.create({ doc: 'source', extensions: [history()] });
  const expected = { generation: 1, file: 'main.tex', identity: state.doc };
  const editor = { getPath: () => 'main.tex', getDocumentIdentity: () => state.doc };
  assert.equal(sameWritingSnapshot(expected, { generation: 1, editor }), true);
  state = state.update({ changes: { from: 0, insert: 'new ' } }).state;
  undo({ state, dispatch(tr) { state = tr.state; } }); assert.equal(state.doc.toString(), 'source');
  assert.equal(sameWritingSnapshot(expected, { generation: 1, editor }), false);
  assert.equal(sameWritingSnapshot({ ...expected, identity: state.doc }, { generation: 2, editor }), false);
});
test('ink drafts reject corrupt, non-finite and oversized data while retaining authored colors', () => {
  const { parseInkDraft } = load('src/lib/inkDraft.ts');
  const value = [{ color: '#ab1234', width: 3, pressured: true, points: [{ x: 4, y: 5, pressure: 0.7 }] }];
  assert.deepEqual(parseInkDraft(value), value);
  assert.throws(() => parseInkDraft([{ ...value[0], points: [{ x: NaN, y: 0, pressure: 0 }] }]));
  assert.throws(() => parseInkDraft(Array(3001).fill(value[0])));
});
