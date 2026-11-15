'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), ts = require('typescript');
const { EditorState, Transaction } = require('@codemirror/state');
const { history, undo } = require('@codemirror/commands');
function load(name) {
  const file = path.join(__dirname, '../src/editor', name + '.ts'), context = { exports: {}, require };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context, { filename: file });
  return context.exports;
}
const { composedEditorHandle, guardWritingChanges, externalWritingUpdate } = load('composedEditing');

test('composed commands follow focus, while captured edits and file rebases retain their owner', () => {
  const calls = [];
  const editor = file => ({ getPath: () => file, getContent: () => file + ' content', insert: value => calls.push([file, 'insert', value]), applyWriting: target => { calls.push([file, 'apply', target.id]); return true; }, applyProjectChanges: change => calls.push([file, 'rebase', change]), getSession: () => file + ' state', restorePosition: point => calls.push([file, 'restore', point.head]) });
  const main = editor('main'), a = editor('a'), b = editor('b'), files = new Map([['main', main], ['a', a], ['b', b]]);
  let active = main;
  const surface = composedEditorHandle(() => main, () => active, file => files.get(file) || null);
  active = a; assert.equal(surface.getPath(), 'a'); surface.insert('typing');
  active = b; assert.equal(surface.getContent(), 'b content');
  assert.equal(surface.applyWriting({ file: 'a', id: 'anchor' }, 'replacement'), true);
  surface.applyProjectChanges('labels', 'main'); surface.restorePosition({ file: 'a', head: 4 });
  assert.equal(surface.getSession('main'), 'main state');
  files.delete('a'); assert.equal(surface.applyWriting({ file: 'a', id: 'obsolete' }, 'replacement'), false);
  assert.equal(surface.getSession('a'), null);
  assert.deepEqual(calls, [['a', 'insert', 'typing'], ['a', 'apply', 'anchor'], ['main', 'rebase', 'labels'], ['a', 'restore', 4]]);
});

test('a stale embedded transaction cannot overwrite a newer buffer or contaminate undo', () => {
  let buffer = 'Original';
  let state = EditorState.create({ doc: buffer, extensions: [history(), guardWritingChanges(source => source === buffer)] });
  buffer = 'External update';
  const stale = state.update({ changes: { from: 0, to: state.doc.length, insert: 'Stale replacement' }, userEvent: 'input' });
  assert.equal(stale.docChanged, false); state = stale.state;
  state = state.update({ changes: { from: 0, to: state.doc.length, insert: buffer }, annotations: [externalWritingUpdate.of(true), Transaction.addToHistory.of(false)] }).state;
  state = state.update({ changes: { from: state.doc.length, insert: ' typed' }, userEvent: 'input' }).state;
  buffer = state.doc.toString(); assert.equal(buffer, 'External update typed');
  assert.equal(undo({ state, dispatch: transaction => { state = transaction.state; } }), true);
  assert.equal(state.doc.toString(), 'External update');
});

test('nested file positions use the outer paper scroll container', () => {
  const { writingScrollDOM } = load('writingSession');
  const outer = { parentElement: { closest: () => null } }, inner = { parentElement: { closest: () => outer } };
  const view = { dom: { parentElement: { closest: () => inner } }, scrollDOM: {} };
  assert.equal(writingScrollDOM(view), outer);
  assert.equal(writingScrollDOM({ dom: { parentElement: null }, scrollDOM: inner }), inner);
});
