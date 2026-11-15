'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { createSyncTexService, parseForward, parseInverse } = require('../electron/services/synctex.cjs');

test('SyncTeX parser separates anchors from boxes and rejects malformed numeric records', () => {
  const value = parseForward('Page:2\nx:0\ny:25.5\nh:8\nv:40\nW:100\nH:10\nPage:3\nx:99\ny:99');
  assert.equal(value.page, 2); assert.equal(value.x, 0);
  assert.deepEqual(value.bounds, { x: 8, y: 30, width: 100, height: 10 });
  for (const source of ['Page:NaN\nx:1\ny:2', 'Page:-1\nx:1\ny:2', 'Page:1\nx:Infinity\ny:2']) assert.equal(parseForward(source).ok, false);
  assert.equal(parseForward('Page:1\nx:1\ny:2\nW:-1\nH:5').bounds, undefined);
});

test('shared SyncTeX service validates query paths, supports Chinese spaces and keeps argument arrays', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-sync-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, '章节 一.tex'), pdf = path.join(root, '材料.pdf'); fs.writeFileSync(file, 'source'); fs.writeFileSync(pdf, 'pdf');
  const calls = [];
  const service = createSyncTexService({ resolveBinary: () => 'synctex', environment: () => ({}), run: async (bin, args, options) => {
    calls.push({ bin, args, options });
    return { stdout: args[0] === 'view' ? 'Page:1\nx:12\ny:25' : 'Input:' + file + '\nLine:7\nColumn:-1' };
  } });
  assert.equal((await service.synctexForward({ projectRoot: root, texFile: file, pdfFile: pdf, line: 7, column: 0 })).ok, true);
  assert.equal(calls[0].args[2], '7:0:' + file); assert.equal(calls[0].options.cwd, root);
  const inverse = await service.synctexInverse({ projectRoot: root, pdfFile: pdf, page: 1, x: 12, y: 25 });
  assert.equal(inverse.file, file); assert.equal(inverse.column, 1);
  assert.equal((await service.synctexForward({ projectRoot: root, texFile: file, pdfFile: pdf, line: 0 })).ok, false);
  assert.equal((await service.synctexInverse({ projectRoot: root, pdfFile: pdf, page: 1, x: NaN, y: 2 })).ok, false);
  assert.equal(calls.length, 2);
  assert.equal(parseInverse('Input:' + file + '\nLine:NaN', root).ok, false);
});
