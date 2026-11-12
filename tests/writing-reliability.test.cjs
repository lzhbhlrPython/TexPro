'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { EventEmitter } = require('node:events');
const operations = require('../electron/services/project-operations.cjs');
const { guardWindowClose } = require('../electron/window-close.cjs');
const { fontMatches, parsePdfFonts } = require('../electron/services/font-report.cjs');
const modules = new Map();
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file);
  const context = { exports: {}, require: name => name.endsWith('.json') ? require(path.resolve(path.dirname(file), name)) : name.endsWith('.mjs') ? require(path.resolve(path.dirname(file), name)) : name.startsWith('.') ? load(path.resolve(path.dirname(file), name) + '.ts') : require(name) };
  modules.set(file, context.exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context.exports;
}
const temp = t => { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-reliability-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; };

test('relocation updates root, child, extensionless and bibliography references but leaves examples alone', t => {
  const root = temp(t), main = path.join(root, 'main.tex'), chapter = path.join(root, 'draft/chapter.tex');
  fs.mkdirSync(path.dirname(chapter)); fs.mkdirSync(path.join(root, '.texpro'));
  fs.writeFileSync(main, '\\input{draft/chapter}\n% \\input{draft/chapter}\n\\verb|\\input{draft/chapter}|\n\\begin{verbatim}\\input{draft/chapter}\\end{verbatim}\n\\bibliography{draft/refs,other}');
  fs.writeFileSync(chapter, '% !TeX root = ../main.tex\n\\input{../shared}\n');
  fs.writeFileSync(path.join(root, 'shared.tex'), 'Shared'); fs.writeFileSync(path.join(root, 'draft/refs.bib'), '');
  fs.writeFileSync(path.join(root, '.texpro/project.json'), JSON.stringify({ rootFile: 'main.tex', engine: 'xelatex', custom: 42 }));
  const result = operations.moveProjectDirectory(root, path.join(root, 'draft'), 'final');
  const content = fs.readFileSync(main, 'utf8');
  assert.ok(content.startsWith('\\input{final/chapter}'));
  assert.ok(content.includes('% \\input{draft/chapter}')); assert.ok(content.includes('\\verb|\\input{draft/chapter}|'));
  assert.ok(content.includes('\\begin{verbatim}\\input{draft/chapter}\\end{verbatim}'));
  assert.ok(content.includes('\\bibliography{final/refs,other}'));
  assert.equal(result.updates[0].after, fs.readFileSync(result.updates[0].path, 'utf8'));
  operations.renameProjectFile(root, main, 'paper.tex');
  assert.ok(fs.readFileSync(path.join(root, 'final/chapter.tex'), 'utf8').includes('% !TeX root = ../paper.tex'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, '.texpro/project.json'))), { rootFile: 'paper.tex', engine: 'xelatex', custom: 42 });
});

test('a failed reference write restores both source content and original file name', t => {
  const root = temp(t), main = path.join(root, 'main.tex'), chapter = path.join(root, 'chapter.tex');
  fs.writeFileSync(main, '\\input{chapter}'); fs.writeFileSync(chapter, 'Chapter');
  const write = fs.writeFileSync; let fail = true;
  fs.writeFileSync = function(file, ...args) { if (file === main && fail) { fail = false; throw new Error('disk full'); } return write.call(this, file, ...args); };
  try { assert.throws(() => operations.renameProjectFile(root, chapter, 'renamed.tex'), /disk full/); }
  finally { fs.writeFileSync = write; }
  assert.equal(fs.readFileSync(main, 'utf8'), '\\input{chapter}'); assert.ok(fs.existsSync(chapter)); assert.ok(!fs.existsSync(path.join(root, 'renamed.tex')));
});

test('inactive buffers and concurrent typing survive reference updates and path rebasing', () => {
  const { reconcileFiles } = load(path.join(__dirname, '../src/app/fileOperations.ts'));
  const before = '\\input{chapter}\nWriting.', after = '\\input{renamed}\nWriting.';
  const operation = { oldPath: '/p/chapter.tex', path: '/p/renamed.tex', updates: [{ oldPath: '/p/main.tex', path: '/p/main.tex', before, after, changes: [{ from: 7, to: 14, insert: 'renamed' }] }] };
  const result = reconcileFiles({ '/p/main.tex': { path: '/p/main.tex', content: before + ' More.', savedContent: before, dirty: true }, '/p/chapter.tex': { path: '/p/chapter.tex', content: 'Chapter', savedContent: 'Chapter', dirty: false } }, operation);
  assert.equal(result.docs['/p/main.tex'].content, after + ' More.'); assert.equal(result.docs['/p/main.tex'].savedContent, after); assert.equal(result.docs['/p/main.tex'].dirty, true);
  assert.ok(result.docs['/p/renamed.tex']); assert.ok(!result.docs['/p/chapter.tex']);
  const overlap = reconcileFiles({ '/p/main.tex': { path: '/p/main.tex', content: before.replace('chapter', 'typing'), savedContent: before, dirty: true } }, operation);
  assert.equal(overlap.conflicts, 1); assert.ok(overlap.docs['/p/main.tex'].content.includes('typing'));
});

test('save queue orders writes and continues after a rejected save', async () => {
  const { SaveQueue } = load(path.join(__dirname, '../src/app/saveQueue.ts'));
  const queue = new SaveQueue(), order = []; let release;
  const first = queue.run(async () => { order.push('first'); await new Promise(resolve => { release = resolve; }); throw new Error('disk'); });
  const second = queue.run(async () => { order.push('second'); });
  await Promise.resolve(); assert.deepEqual(order, ['first']); release(); await assert.rejects(first, /disk/); await second; await queue.idle(); assert.deepEqual(order, ['first', 'second']);
});

function closeFixture(t, options = {}) {
  const window = new EventEmitter(), ipcMain = new EventEmitter(); const requests = [];
  window.webContents = { send: (_channel, request) => requests.push(request) }; window.isDestroyed = () => false;
  let finished = 0, prevented = 0;
  window.close = () => window.emit('close', { preventDefault: () => prevented++ });
  guardWindowClose(window, { ipcMain, confirmFailure: async () => false, finish: () => finished++, ...options });
  t.after(() => window.emit('closed'));
  return { window, ipcMain, requests, finished: () => finished, prevented: () => prevented };
}

test('native close waits for matching renderer save acknowledgment; duplicates and forged replies cannot close', t => {
  const f = closeFixture(t); f.window.close(); f.window.close(); assert.equal(f.requests.length, 1); assert.equal(f.finished(), 0);
  f.ipcMain.emit('window:close-ready', { sender: {} }, { id: f.requests[0].id, ok: true });
  f.ipcMain.emit('window:close-ready', { sender: f.window.webContents }, { id: 'stale', ok: true }); assert.equal(f.finished(), 0);
  f.ipcMain.emit('window:close-ready', { sender: f.window.webContents }, { ...f.requests[0], ok: true }); assert.equal(f.finished(), 1);
  f.window.close(); assert.equal(f.prevented(), 2);
});

test('failed or unresponsive close keeps the window open, with a fresh save request on retry', async t => {
  let prompts = 0; const f = closeFixture(t, { timeoutMs: 20, confirmFailure: async () => ++prompts === 1 });
  f.window.close(); f.ipcMain.emit('window:close-ready', { sender: f.window.webContents }, { ...f.requests[0], ok: false });
  await new Promise(resolve => setImmediate(resolve)); assert.equal(f.requests.length, 2); assert.equal(f.finished(), 0);
  await new Promise(resolve => setTimeout(resolve, 40)); assert.equal(prompts, 2); assert.equal(f.finished(), 0);
});

test('font checks preserve unknown status and parse multiword PDF font types and encoding columns', () => {
  assert.equal(fontMatches('Times New Roman', ''), null); assert.equal(fontMatches('Times New Roman', 'Times New Roman,TimesNewRomanPSMT'), true);
  assert.equal(fontMatches('Noto Serif CJK SC', 'Noto Sans CJK SC'), false);
  const rows = parsePdfFonts('name                                 type              encoding         emb sub uni object ID\n------------------------------------ ----------------- ---------------- --- --- --- ---------\nABCDEF+FandolSong-Regular             CID Type 0C       Identity-H       yes yes yes      4  0\nArial                                CID TrueType      Identity-H       no  no  yes      8  0\nHelvetica                            Type 1            WinAnsi          no  no  no       9  0\n');
  assert.deepEqual(rows.map(row => row.type), ['CID Type 0C', 'CID TrueType', 'Type 1']); assert.equal(rows[1].embedded, false); assert.equal(rows[2].unicode, false);
});

test('wrapped warnings and package errors retain the cause and correct source line', () => {
  const { parseDiagnostics } = require('../electron/services/tex.cjs');
  const result = parseDiagnostics('Package fontspec Warning: Font "STSong" does not contain requested Script\n(fontspec)                "CJK" on input line 18.\n\n! Package fontspec Error: The font "Missing" cannot be found.\n(fontspec)                Check the font installation.\n\nl.24 \\setmainfont{Missing}\n! Emergency stop.\n', '/p/main.tex', '/p');
  const warning = result.find(row => row.severity === 'warning'); assert.ok(warning.message.includes('"CJK"')); assert.equal(warning.line, 18);
  const error = result.find(row => row.message.includes('Missing')); assert.ok(error.message.includes('Check the font installation.')); assert.equal(error.line, 24);
});

test('preview reuses decorations for prose cursor motion and rebuilds when entering TeX', () => {
  const { EditorState, StateField, StateEffect } = require('@codemirror/state');
  const { EditorView, WidgetType } = require('@codemirror/view');
  const field = StateField.define({ create: () => null, update: value => value });
  const context = { exports: {}, require: name => {
    if (name === './musicWidget') return { MusicWidget: class extends WidgetType {}, musicSourceField: field, revealMusicSource: StateEffect.define() };
    if (name === './tableWidget') return { WritingTableWidget: class extends WidgetType {} };
    if (name === '../i18n') return { t: value => value, getLanguage: () => 'en' };
    if (name === '../lib/texPdfArtwork') return { rasterizeTexPdf: () => {} };
    return name.endsWith('.json') ? require(path.resolve(path.dirname(file), name)) : name.endsWith('.mjs') ? require(path.resolve(__dirname, '../src/editor', name)) : name.startsWith('.') ? load(path.join(__dirname, '../src/editor', name + '.ts')) : require(name);
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/editor/visual.ts'), 'utf8'), { compilerOptions: { esModuleInterop: true, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, context);
  const writing = load(path.join(__dirname, '../src/editor/writing.ts'));
  let builds = 0;
  let state = EditorState.create({ doc: 'Prose $x$ continues.', extensions: [writing.writingComposition, context.exports.visualLatex({ get: () => { builds++; return { filePath: '/p/main.tex', projectRoot: '/p', collapsePreamble: false }; } })] });
  const before = state.facet(EditorView.decorations)[0];
  state = state.update({ selection: { anchor: 1 } }).state; assert.equal(state.facet(EditorView.decorations)[0], before);
  state = state.update({ selection: { anchor: 7 } }).state; assert.notEqual(state.facet(EditorView.decorations)[0], before);
  const active = state.facet(EditorView.decorations)[0];
  state = state.update({ effects: StateEffect.define().of(null) }).state; assert.equal(state.facet(EditorView.decorations)[0], active);
  const previousBuilds = builds;
  state = state.update({ changes: { from: 8, insert: 'y' } }).state; assert.equal(builds, previousBuilds + 1);
});
