'use strict';
// Real host acceptance, separate from the TeX-free baseline. Optional path tests app.asar.unpacked.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), assert = require('node:assert/strict');
const { RealtimeHost } = require(process.argv[2] ? path.resolve(process.argv[2]) : '../electron/services/realtime-tex.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-live-host-'));
let host;
async function exercise(name, initial, before, after, requireParagraph) {
  const directory = path.join(root, name); fs.mkdirSync(directory);
  const file = path.join(directory, 'main.tex'); fs.writeFileSync(file, initial);
  const events = [], pids = new Set();
  function waitFor(predicate, timeout = 90000) {
    return new Promise((resolve, reject) => { const start = Date.now(); const timer = setInterval(() => {
      const error = events.find(event => event.kind === 'error');
      const event = events.find(predicate);
      if (error || event || Date.now() - start > timeout) {
        clearInterval(timer);
        if (error) reject(new Error(error.error));
        else if (event) resolve(event);
        else reject(new Error(name + ' timed out: ' + JSON.stringify(events.map(e => ({ kind: e.kind, state: e.state, versions: e.versions, diagnostics: e.diagnostics })))));
      }
    }, 25); });
  }
  host = new RealtimeHost({ root: directory, engine: 'lualatex', documents: [{ path: file, text: initial }] }, event => events.push(event));
  host.worker.on('message', event => { for (const pid of event.processes || []) pids.add(pid); });
  const layout = await waitFor(event => event.kind === 'layout');
  assert.ok(layout.pdf.length > 1000); assert.ok(layout.pages[0].svg, name + ' requires actual glyph outlines');
  await waitFor(event => event.state === 'Ready');
  const revision = layout.versions.source_revision;
  host.update([{ path: file, text: initial.replace(before, after) }]);
  // CJK contexts may legitimately use a new full layout. The separate plain-text case
  // strictly requires ParagraphUpdate, so fallback cannot mask a broken fast path.
  const update = await waitFor(event => (event.kind === 'paragraph' || (!requireParagraph && event.kind === 'layout')) && event.versions.source_revision > revision);
  assert.ok(update.pages.some(page => page.svg));
  assert.equal(fs.readFileSync(file, 'utf8'), initial, 'Unsaved preview must not overwrite source');
  const terminate = host.worker.terminate.bind(host.worker), sentinels = [];
  host.worker.terminate = async () => {
    for (let i = 0; i < 64; i++) sentinels.push(fs.openSync(file, 'r'));
    const result = await terminate();
    try { for (const fd of sentinels) assert.ok(fs.fstatSync(fd).isFile(), `Worker closed host-owned descriptor ${fd}`); }
    finally { for (const fd of sentinels) { try { fs.closeSync(fd); } catch { /* assertion reports invalid descriptors */ } } }
    return result;
  };
  await host.stop(); host = undefined; await new Promise(resolve => setTimeout(resolve, 400));
  for (const pid of pids) { let alive = true; try { process.kill(pid, 0); } catch { alive = false; } assert.equal(alive, false, `Owned TeX process ${pid} survived close`); }
  console.log(`PASS ${name}: ${update.kind}, new source revision, glyph outlines, unsaved source and process/descriptor cleanup`);
}
(async () => {
  await exercise('cjk-math', String.raw`% !TeX program = lualatex
\documentclass[fontset=fandol]{ctexart}
\usepackage{unicode-math}
\begin{document}
中文实时预览与 $\frac{x^2}{2}$。A paragraph for live updates.

Second paragraph for stable layout.
\end{document}
`, '中文实时预览', '中文即时更新', false);
  await exercise('paragraph-fast-path', String.raw`% !TeX program = lualatex
\documentclass{article}
\usepackage{fontspec}
\begin{document}
A paragraph for live updates.

Second paragraph for stable layout.
\end{document}
`, 'A paragraph', 'An updated paragraph', true);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await host?.stop(); fs.rmSync(root, { recursive: true, force: true }); });
