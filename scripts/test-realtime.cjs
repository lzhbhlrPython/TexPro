'use strict';
// Real host acceptance test, separate from the TeX-free regression suite.
const fs = require('node:fs'); const path = require('node:path'); const os = require('node:os'); const assert = require('node:assert/strict');
// An explicit module path also exercises the worker from a built app.asar.unpacked.
const { RealtimeHost } = require(process.argv[2] ? path.resolve(process.argv[2]) : '../electron/services/realtime-tex.cjs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-live-host-'));
let host;
const events = [], pids = new Set();
function waitFor(predicate, timeout = 90000) {
  const found = events.find(predicate); if (found) return Promise.resolve(found);
  return new Promise((resolve, reject) => { const start = Date.now(); const timer = setInterval(() => {
    const error = events.find(event => event.kind === 'error');
    if (error) { clearInterval(timer); reject(new Error(error.error)); return; }
    const event = events.find(predicate); if (event) { clearInterval(timer); resolve(event); }
    else if (Date.now() - start > timeout) { clearInterval(timer); reject(new Error('Realtime host timed out: ' + JSON.stringify(events.map(e => ({ kind: e.kind, state: e.state, diagnostics: e.diagnostics }))))); }
  }, 25); });
}
(async () => {
  let source = String.raw`% !TeX program = lualatex
\documentclass[fontset=fandol]{ctexart}
\usepackage{unicode-math}
\begin{document}
中文实时预览与 $\frac{x^2}{2}$。A paragraph for live updates.

Second paragraph for stable layout.
\end{document}
`;
  const file = path.join(root, 'main.tex'); fs.writeFileSync(file, source);
  host = new RealtimeHost({ root, engine: 'lualatex', documents: [{ path: file, text: source }] }, event => events.push(event));
  host.worker.on('message', event => { for (const pid of event.processes || []) pids.add(pid); });
  const layout = await waitFor(event => event.kind === 'layout'); assert.ok(layout.pdf.length > 1000); assert.ok(layout.pages[0].svg, 'CJK/OpenType page must draw with glyph outlines');
  await waitFor(event => event.state === 'Ready');
  source = source.replace('中文实时预览', '中文即时更新'); host.update([{ path: file, text: source }]);
  const paragraph = await waitFor(event => event.kind === 'paragraph'); assert.ok(paragraph.pages.some(page => page.svg)); assert.equal(fs.readFileSync(file, 'utf8').includes('中文即时更新'), false);
  await host.stop(); await new Promise(resolve => setTimeout(resolve, 400));
  for (const pid of pids) { let alive = true; try { process.kill(pid, 0); } catch { alive = false; } assert.equal(alive, false, `Owned TeX process ${pid} survived close`); }
  console.log('PASS realtime host: CJK/math glyph outlines, unsaved updates, PDF snapshot and process cleanup');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await host?.stop(); fs.rmSync(root, { recursive: true, force: true }); });
