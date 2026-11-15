'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createNativeWritingService } = require('../electron/services/native-writing.cjs');
const { parseForwardResults } = require('../electron/services/synctex.cjs');

test('native SyncTeX preserves all macro boxes without combining different records', () => {
  const hits = parseForwardResults('SyncTeX result begin\nOutput:a.pdf\nPage:1\nx:1\ny:2\nh:1\nv:8\nW:20\nH:6\nOutput:a.pdf\nPage:2\nx:4\ny:5\nh:4\nv:11\nW:30\nH:7\nSyncTeX result end');
  assert.equal(hits.length, 2); assert.equal(hits[1].page, 2); assert.equal(hits[1].bounds.height, 7);
});

test('native writing snapshots overlay unsaved buffers and preserve author sources/configuration', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'texpro-native-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const main = path.join(root, 'main.tex'), child = path.join(root, 'chapter.tex');
  const original = '\\documentclass{article}\n\\begin{document}\n\\input{chapter}\n\\end{document}';
  await fs.writeFile(main, original); await fs.writeFile(child, 'on disk');
  await fs.mkdir(path.join(root, '.texpro')); const config = { rootFile: 'main.tex', custom: 'preserved', directories: { build: 'author-output' } };
  await fs.writeFile(path.join(root, '.texpro/project.json'), JSON.stringify(config));
  let compiledRoot;
  const service = createNativeWritingService({ resolveTexBinary: name => name, cancelCompilation() {}, async runCompile(options) {
    compiledRoot = options.projectRoot;
    assert.equal(await fs.readFile(path.join(compiledRoot, 'chapter.tex'), 'utf8'), 'unsaved');
    const copyConfig = JSON.parse(await fs.readFile(path.join(compiledRoot, '.texpro/project.json')));
    assert.equal(copyConfig.custom, 'preserved'); assert.equal(copyConfig.directories.build, '.texpro/build'); assert.equal(options.isolated, true);
    const pdfPath = path.join(compiledRoot, 'preview.pdf'); await fs.writeFile(pdfPath, '%PDF fixture'); return { ok: true, pdfPath };
  } });
  t.after(() => service.close());
  const request = { session: 'test-session', root, file: main, engine: 'pdflatex', documents: [{ path: child, content: 'unsaved' }], regions: [] };
  const result = await service.render(request);
  assert.equal(result.source, original); assert.equal(result.regions.length, 0); assert.equal(result.sources[main], original);
  assert.equal(await fs.readFile(child, 'utf8'), 'on disk'); assert.deepEqual(JSON.parse(await fs.readFile(path.join(root, '.texpro/project.json'))), config);
  await service.stop(request.session); await assert.rejects(fs.stat(compiledRoot));
  await assert.rejects(service.inverse(request.session, result.revision, { page: 1, x: 0, y: 0 }));
});

test('new native requests cancel old work, settle before cleanup and reject escapes', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'texpro-native-cancel-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const main = path.join(root, 'main.tex'); await fs.writeFile(main, '\\documentclass{article}');
  let release, started; const entered = new Promise(resolve => { started = resolve; }); let calls = 0, cancelled = 0, firstFolder;
  const service = createNativeWritingService({ resolveTexBinary: name => name, cancelCompilation() { cancelled++; release(); }, async runCompile(options) {
    if (++calls === 1) { firstFolder = options.projectRoot; started(); await new Promise(resolve => { release = resolve; }); return { ok: false }; }
    const pdfPath = path.join(options.projectRoot, 'preview.pdf'); await fs.writeFile(pdfPath, 'pdf'); return { ok: true, pdfPath };
  } });
  t.after(() => service.close());
  const request = { session: 'test-cancel', root, file: main, engine: 'pdflatex', documents: [], regions: [] };
  const first = service.render(request); const rejected = assert.rejects(first, /superseded/);
  await entered; const second = await service.render(request); await rejected;
  assert.ok(second.revision); assert.equal(cancelled, 1); await assert.rejects(fs.stat(firstFolder));
  await fs.symlink(os.tmpdir(), path.join(root, 'escape'));
  await assert.rejects(service.render(request), /outside the project/);
});
