'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
module.exports = async ({ window, key, wait, type, click, open, shot, js, main }) => {
  const settle = async expression => {
    const start = Date.now();
    while (Date.now() - start < 70000) { if (await js(expression)) return; await new Promise(resolve => setTimeout(resolve, 150)); }
    await shot('source-studio-failure'); throw new Error('Preview timed out: ' + expression + '; ' + await js(`document.body.innerText.slice(-1600)`));
  };
  const saved = async expected => {
    const start = Date.now();
    while (Date.now() - start < 10000) {
      if (fs.readFileSync(main, 'utf8') === expected) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(fs.readFileSync(main, 'utf8'), expected);
  };
  await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
  const diagram = String.raw`\begin{circuitikz}
\draw (0,0) to[R,l=$R$] (2,0);
\end{circuitikz}`;
  const music = String.raw`\begin{music}
\instrumentnumber{1}
\generalmeter{\meterfrac{4}{4}}
\startpiece
\Notes \qu{c}\en
\Endpiece
\end{music}`;
  const original = `\\documentclass{article}\n\\usepackage{circuitikz,musixtex}\n\\begin{document}\nAnchor.\n\n${diagram}\n\n${music}\n\nContinue writing.\n\\end{document}`;
  fs.writeFileSync(main, original);
  await js(`localStorage.setItem('texpro.settings.v1',JSON.stringify({...JSON.parse(localStorage.getItem('texpro.settings.v1')||'{}'),visual:true,autoSave:false,autoCompile:false,compileMode:'manual'}));true`);
  const loaded = new Promise(resolve => window.webContents.once('did-finish-load', resolve)); window.webContents.reload(); await loaded;
  await settle(`!!document.querySelector('.cm-tikz-body img')?.naturalWidth && !!document.querySelector('.cm-music-block canvas')`);
  assert.equal(await js(`!!document.querySelector('.cm-tikz-body [data-artwork="monochrome"]')`), true);
  const locale = require('../packages/extension-translate-zh-cn/language/locales/zh.json');
  const toggle = async (studio, toSource) => click(`[...document.querySelectorAll('${studio} .studio-header-actions button')].find(e=>e.textContent===${JSON.stringify(locale[toSource ? 'writing.studio.source.mode' : 'writing.studio.visual.mode'])})`);
  const editAt = async (selector, source) => { await click(`document.querySelector(${JSON.stringify(selector)})`); await key('a', ['meta']); await type(source); };
  const changeInput = async (selector, value) => { await click(`document.querySelector(${JSON.stringify(selector)})`); window.webContents.selectAll(); await type(value); await key('Tab'); };
  await click(`document.querySelector('.cm-tikz-studio')`);
  await settle(`!!document.querySelector('.schematic-preview img')?.naturalWidth`);
  const before = await js(`document.querySelector('.schematic-preview img').src`);
  await changeInput('.schematic-studio .tex-visual-editor input', '1');
  await settle(`!!document.querySelector('.schematic-preview img')?.naturalWidth && document.querySelector('.schematic-preview img').src!==${JSON.stringify(before)}`);
  await toggle('.schematic-studio', true);
  await wait(`document.querySelector('.schematic-studio .cm-content')?.textContent.includes('(1,0)')`);
  const changedDiagram = diagram.replace('(0,0)', '(1,0)').replace('l=$R$', 'l=$R_2$');
  await editAt('.schematic-studio .cm-content', changedDiagram);
  await settle(`!!document.querySelector('.schematic-preview img')?.naturalWidth`);
  assert.equal(await js(`(()=>{const e=[...document.querySelectorAll('.schematic-studio .cm-line span')].find(e=>e.textContent===String.fromCharCode(92)+'draw');return !!e&&getComputedStyle(e).color!==getComputedStyle(document.querySelector('.schematic-studio .cm-content')).color})()`), true);
  await toggle('.schematic-studio', false);
  assert.equal(await js(`document.querySelector('.schematic-studio .tex-visual-editor input').value`), '1');
  await toggle('.schematic-studio', true);
  assert.equal(await js(`document.querySelector('.schematic-studio .cm-content').textContent.includes('R_2')`), true);
  for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot(`source-studio-circuit-${theme}`); }
  await click(`document.querySelector('.schematic-studio .primary-btn')`); await wait(`!document.querySelector('.schematic-studio')`); await key('s', ['meta']);
  await saved(original.replace(diagram, changedDiagram));
  await key('z', ['meta']); await key('s', ['meta']); await saved(original);
  await click(`document.querySelector('.cm-music-block .music-block-actions button')`);
  await settle(`!!document.querySelector('.tikz-studio .music-typeset canvas')`);
  await js(`(()=>{const control=document.querySelector('.tikz-studio [data-tex-command="qu"] select');control.value='d';control.dispatchEvent(new Event('change',{bubbles:true}));return control.value})()`);
  await toggle('.tikz-studio', true);
  await wait(`document.querySelector('.tikz-source .cm-content').textContent.includes('qu{d}')`);
  assert.equal(await js(`document.querySelector('.tikz-source .cm-content').textContent.includes('TeXPro music')`), false, 'handwritten music needs no metadata');
  const changedMusic = music.replace('\\qu{c}', '\\qu{e}');
  await editAt('.tikz-source .cm-content', changedMusic);
  await settle(`!!document.querySelector('.tikz-studio .music-typeset canvas') && !document.querySelector('.tikz-studio .music-preview-state .spin')`);
  assert.equal(await js(`document.querySelector('.tikz-studio [data-tex-command="qu"] select').value`), 'e');
  for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot(`source-studio-music-${theme}`); }
  await click(`document.querySelector('.tikz-studio .primary-btn')`); await wait(`!document.querySelector('.tikz-studio')`); await key('s', ['meta']);
  await saved(original.replace(music, changedMusic));
  await click(`[...document.querySelectorAll('.cm-line')].find(e=>e.textContent.includes('Continue writing.'))`);
  await key('k', ['meta']); await wait(`!!document.querySelector('.palette input')`); await type(locale['app.chart.studio']);
  await click(`[...document.querySelectorAll('.palette-row')].find(e=>e.querySelector('strong')?.textContent===${JSON.stringify(locale['app.chart.studio'])})`);
  await toggle('.chart-studio', true);
  await settle(`!!document.querySelector('.pgf-preview img')?.naturalWidth`);
  const chartPreview = await js(`document.querySelector('.pgf-preview img').src`);
  await editAt('.chart-code .cm-content', String.raw`\begin{tikzpicture}\begin{axis}\addplot {x^3};\end{axis}\end{tikzpicture}`);
  await settle(`!!document.querySelector('.pgf-preview img')?.naturalWidth && document.querySelector('.pgf-preview img').src!==${JSON.stringify(chartPreview)}`);
  await toggle('.chart-studio', false);
  const cubic = await js(`document.querySelector('.pgf-preview img').src`);
  assert.equal(await js(`document.querySelector('.chart-data-pane [data-tex-command="addplot"] input').value`), 'x^3');
  await changeInput('.chart-data-pane [data-tex-command="addplot"] input', 'x^2');
  await toggle('.chart-studio', true);
  assert.equal(await js(`document.querySelector('.chart-code .cm-content').textContent.includes('x^2')`), true);
  await settle(`!!document.querySelector('.pgf-preview img')?.naturalWidth && document.querySelector('.pgf-preview img').src!==${JSON.stringify(cubic)}`);
  await shot('source-studio-chart'); await key('Escape'); await wait(`!document.querySelector('.chart-code')`);
  await saved(original.replace(music, changedMusic));
  assert.deepEqual(await js('window.__flowErrors || []'), []);
  console.log('PASS handwritten circuit/music: metadata-free recognition, unified visual/source modes, bidirectional parameter edits, real live previews, source highlighting, three themes, exact replacement and grouped undo');
  console.log('PASS chart modes: source-to-visual expression edits, visual-to-source synchronization and cancellation');
};
