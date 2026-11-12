'use strict';
const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
module.exports = async function realtimeRegression({ window, key, wait, type, click, line, open, shot, js, main, ipcMain }) {
  let updateCount = 0;
  const update = ipcMain._invokeHandlers.get('realtime:update');
  ipcMain._invokeHandlers.set('realtime:update', (...args) => { updateCount++; return update(...args); });
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const waitLong = async source => { const deadline = Date.now() + 90000; while (Date.now() < deadline) { if (await js(source)) return; await pause(100); } throw new Error('Realtime UI timed out: ' + source + '\n' + await js("JSON.stringify({text:document.querySelector('.pdf-pane')?.textContent,events:window.__realtimeEvents,errors:window.__realtimeErrors})")); };
  await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
  fs.writeFileSync(main, String.raw`% !TeX program = lualatex
\documentclass[fontset=fandol]{ctexart}
\usepackage{unicode-math}
\begin{document}
中文实时写作。A live paragraph with $\frac{x^2}{2}$.

\input{chapter}

\newpage
Drawing page. \pdfextension literal direct {0 0 m 20 20 l S}
\end{document}
`);
  fs.writeFileSync(path.join(path.dirname(main), 'chapter.tex'), 'Child paragraph. 子文件写作。\n');
  await js(`localStorage.setItem('texpro.settings.v1',JSON.stringify({...JSON.parse(localStorage.getItem('texpro.settings.v1')||'{}'),realtimePreview:true,visual:false,autoSave:false,autoCompile:true,compileMode:'pdfOpen',spellcheck:false,language:'zh'}))`);
  const loaded = new Promise(resolve => window.webContents.once('did-finish-load', resolve)); window.webContents.reload(); await loaded;
  await wait(`!!document.querySelector('.cm-content')`);
  await js(`window.__realtimeEvents=[]; window.__realtimeErrors=[]; window.texpro.onRealtime(e=>__realtimeEvents.push({kind:e.kind,state:e.state,versions:e.versions,sessionId:e.sessionId}));addEventListener('error',e=>__realtimeErrors.push(e.message));addEventListener('unhandledrejection',e=>__realtimeErrors.push(String(e.reason)));true`);
  await key('p', ['meta', 'alt']);
  await waitLong(`document.querySelectorAll('.realtime-page').length===2 && document.querySelector('.realtime-page img')?.naturalWidth>0`);
  await js(`document.querySelector('.pdf-page-shell:last-child .realtime-page').scrollIntoView();true`);
  await waitLong(`[...document.querySelectorAll('.realtime-page canvas')].some(c=>c.width>300)`);
  await js(`document.querySelector('.pdf-page-shell:first-child .realtime-page').scrollIntoView();true`);
  assert.equal(await js(`(()=>{const e=document.querySelector('.pdf-scroll');return e.scrollWidth<=e.clientWidth+1})()`), true, 'Default zoom must fit the preview pane');
  await waitLong(`__realtimeEvents.some(e=>e.state==='Ready')`);
  for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot('realtime-' + theme); }
  await click(line('中文实时写作'));
  await key('Right', ['meta']);
  const before = await js(`document.querySelector('.realtime-page img').src`);
  await type('继续写。');
  await waitLong(`__realtimeEvents.some(e=>e.kind==='paragraph')`);
  assert.equal(await js(`document.activeElement===document.querySelector('.cm-content')`), true);
  assert.equal(fs.readFileSync(main, 'utf8').includes('继续写。'), false);
  assert.notEqual(await js(`document.querySelector('.realtime-page img').src`), before);
  await key('z', ['meta']); await wait(`!document.querySelector('.cm-content').textContent.includes('继续写。')`);
  await key('z', ['meta', 'shift']); await wait(`document.querySelector('.cm-content').textContent.includes('继续写。')`);
  console.log('PASS realtime UI: CJK/math glyphs, PDF literal fallback, native typing, undo/redo and stable editor focus');
  // Exercise the host's composition gate using DOM composition events. This is
  // not a claim that an OS candidate-window IME was manually tested.
  await pause(100);
  const updatesBeforeComposition = updateCount;
  await js(`document.querySelector('.cm-content').dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));true`);
  await type('组合'); await pause(200);
  assert.equal(updateCount, updatesBeforeComposition);
  await js(`document.querySelector('.cm-content').dispatchEvent(new CompositionEvent('compositionend',{bubbles:true}));true`);
  const updateDeadline = Date.now() + 5000;
  while (updateCount === updatesBeforeComposition && Date.now() < updateDeadline) await pause(50);
  assert.ok(updateCount > updatesBeforeComposition);
  await click(`document.querySelector('.tree-file[title^="chapter.tex"]')`);
  await wait(`document.querySelector('.titlebar-file-name').textContent==='chapter.tex'`);
  await waitLong(`__realtimeEvents.filter(e=>e.state==='Ready').length>=2`);
  assert.equal(await js(`document.querySelector('.titlebar-main-file').title`), main);
  await click(line('Child paragraph')); await key('Right', ['meta']); await type('接着写。');
  await waitLong(`__realtimeEvents.filter(e=>e.kind==='paragraph').length>=2`);
  assert.equal(await js(`document.activeElement===document.querySelector('.cm-content')`), true);
  console.log('PASS realtime UI: composition synchronization gate and child-file editing preserve main identity');
  assert.equal(await js(`document.querySelectorAll('.pdf-toolbar').length`), 1);
  assert.equal(await js(`!!document.querySelector('.preview-switch,.realtime-state,.realtime-fallback')`), false);
  await click(`document.querySelector('[aria-label="放大"]')`);
  const zoom = await js(`document.querySelector('.zoom-label').textContent`);
  const scroll = await js(`document.querySelector('.pdf-scroll').scrollTo({top:140,behavior:'instant'});document.querySelector('.pdf-scroll').scrollTop`);
  await click(`document.querySelector('[data-testid="pdf-search-toggle"]')`);
  await waitLong(`!!document.querySelector('[data-testid="pdf-search-input"]') && !document.querySelector('.realtime-page') && !!document.querySelector('.pdf-text-layer')`);
  assert.equal(await js(`document.querySelector('.zoom-label').textContent`), zoom);
  const afterScroll = await js(`document.querySelector('.pdf-scroll').scrollTop`);
  assert.ok(Math.abs(afterScroll - scroll) < 3, `Preparing a PDF must preserve scroll: ${scroll} -> ${afterScroll}`);
  await type('Child'); await waitLong(`document.querySelector('.pdf-search-count').textContent.includes('1/1')`);
  await key('Escape');
  await click(line('Child paragraph')); await key('Right', ['meta']); await type('Again.');
  await waitLong(`document.querySelectorAll('.realtime-page').length===2`);
  assert.equal(await js(`document.querySelector('.zoom-label').textContent`), zoom);
  console.log('PASS L0 preview: one toolbar, no mode controls, search prepares current PDF, next edit resumes live pages with the same zoom');
  await click(`document.querySelector('[aria-label="适应页宽"]')`);
  window.setSize(1000,720); await shot('realtime-narrow');
  assert.equal(await js(`(()=>{const e=document.querySelector('.pdf-scroll');return e.scrollWidth<=e.clientWidth+1})()`), true, 'Narrow preview must keep its fitted width');
  window.setSize(1380,960);
  await open('settings'); await wait(`!!document.querySelector('.settings-panel')`);
  await click(`document.querySelector('[data-testid="language-switch"]')`);
  await wait(`document.documentElement.lang==='en'`);
  assert.doesNotMatch(await js(`document.querySelector('.settings-panel').textContent`), /Realtime TeX preview|rtex-ts/);
  assert.equal(await js(`JSON.parse(localStorage.getItem('texpro.settings.v1')).realtimePreview`), undefined);
  await key('Escape'); await wait(`!document.querySelector('.settings-panel')`);
  assert.equal(await js(`document.querySelector('.pdf-toolbar-title').textContent.includes('PDF Preview')`), true);
  assert.deepEqual(await js('__realtimeErrors'), []);
  await shot('realtime-en');
  await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
  assert.ok(fs.readFileSync(main, 'utf8').includes('继续写。'));
  assert.ok(fs.readFileSync(path.join(path.dirname(main), 'chapter.tex'), 'utf8').includes('接着写。'));
  console.log('PASS realtime UI: three themes, narrow pane, English labels, L0 controls and saved project close');
};
