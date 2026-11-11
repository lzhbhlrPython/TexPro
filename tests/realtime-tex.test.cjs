'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { safeFile, RealtimeHost } = require('../electron/services/realtime-tex.cjs');
const { Scene, inside, SP } = require('../electron/services/realtime-scene.cjs');

test('source validation rejects sibling prefixes and symlink escapes', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-realtime-paths-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const project = path.join(root, 'project'); fs.mkdirSync(project);
  fs.writeFileSync(path.join(root, 'outside.tex'), 'outside');
  fs.writeFileSync(path.join(project, 'main.tex'), 'inside');
  assert.ok(safeFile(project, 'main.tex').endsWith('main.tex'));
  assert.throws(() => safeFile(project, '../outside.tex'));
  assert.equal(inside(project, project + '-other/a.tex'), false);
  if (process.platform !== 'win32') {
    fs.symlinkSync(path.join(root, 'outside.tex'), path.join(project, 'link.tex'));
    assert.throws(() => safeFile(project, 'link.tex'));
  }
});

function layout(revision = 0) {
  return { versions: { source_revision: revision }, pages_total: 1, placements: [{ par_id: 42, fragments: [{ page: 1, xs: [SP], baselines: [2 * SP], first_line: 1, last_line: 1 }] }], pages_changed: [{ page: 1, exact: true, dl: { page_width: 100 * SP, page_height: 200 * SP, other: [], flags: {}, fonts: {}, lines: [{ unit: 999, x: SP, y: 2 * SP, items: [['r', SP, 2 * SP, 3 * SP, SP]] }] } }] };
}
test('scene replaces by placements, not capture unit IDs, and drops overlays after layout', () => {
  const scene = new Scene(os.tmpdir(), []);
  assert.match(scene.layout(layout())[0].svg, /width="3"/);
  const event = { par_id: 42, status: 'ok', versions: { source_revision: 1 }, fragments: layout().placements[0].fragments, dl: { fonts: {}, lines: [{ x: 0, y: 0, items: [['r', 0, 0, 5 * SP, SP]] }] } };
  const svg = scene.paragraph(event)[0].svg;
  assert.ok(svg.includes('width="5"'));
  assert.ok(!svg.includes('width="3"'));
  const newer = scene.layout(layout(0))[0].svg;
  assert.ok(newer.includes('width="5"'));
  assert.ok(scene.layout(layout(1))[0].svg.includes('width="3"'));
});
test('scene uses PDF for unsupported glyphs and raw PDF drawing commands', () => {
  const scene = new Scene(os.tmpdir(), []);
  const event = layout(); event.pages_changed[0].dl.lines[0].items = [['g', 1, 65, null, 0, 0, 0, 0]];
  assert.equal(scene.layout(event)[0].svg, null);
  event.pages_changed[0].dl.lines[0].items = [['l', 0, '<script>bad</script>']];
  assert.equal(scene.layout(event)[0].svg, null);
});
test('scene handles LuaTeX current-colour commands without losing glyph rendering', () => {
  const scene = new Scene(os.tmpdir(), []), event = layout();
  event.pages_changed[0].dl.other = [['c', 0, 0, '0 g 0 G'], ['c', 0, 3, '']];
  assert.ok(scene.layout(event)[0].svg);
  event.pages_changed[0].dl.other.push(['c', 0, 4, '']);
  assert.equal(scene.layout(event)[0].svg, null);
});
test('host keeps only the newest buffered update until the worker acknowledges', t => {
  const sent = [], host = Object.assign(Object.create(RealtimeHost.prototype), {
    ready: false, closed: false, worker: { postMessage: message => sent.push(message) },
  });
  t.after(() => clearTimeout(host.scheduled));
  host.update([{ path: 'main.tex', text: 'first' }]);
  host.update([{ path: 'main.tex', text: 'second' }]);
  host.pump(); assert.equal(sent.length, 0);
  host.ready = true; host.pump();
  assert.equal(sent[0].documents[0].text, 'second');
  host.update([{ path: 'main.tex', text: 'third' }]); host.pump();
  assert.equal(sent.length, 1);
  host.ready = true; host.pump();
  assert.equal(sent[1].documents[0].text, 'third');
  assert.throws(() => host.update([{ path: 'main.tex', text: 'x'.repeat(4 * 1024 * 1024 + 1) }]));
});
test('host rejects a non-LuaLaTeX main file before starting a TeX process', async t => {
  const { detectEngine } = await import('../electron/services/tex-engine.mjs');
  assert.equal(detectEngine('% !TeX program = lualatex\n\\documentclass{ctexart}', 'pdflatex'), 'lualatex');
  assert.equal(detectEngine('\\documentclass{ctexart}', 'lualatex'), 'xelatex');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-realtime-engine-'));
  const file = path.join(root, 'main.tex'), text = '\\documentclass{article}\n\\begin{document}Text.\\end{document}';
  fs.writeFileSync(file, text);
  let host, timer;
  t.after(async () => { clearTimeout(timer); await host?.stop(); fs.rmSync(root, { recursive: true, force: true }); });
  const error = await new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Engine validation timed out')), 10000);
    host = new RealtimeHost({ root, engine: 'pdflatex', documents: [{ path: file, text }] }, event => {
      if (event.kind === 'error') resolve(event.error);
    });
  });
  assert.match(error, /requires LuaLaTeX/);
  assert.equal(host.pids.size, 0);
  assert.equal(fs.existsSync(path.join(root, '.texpro/realtime')), false);
});
