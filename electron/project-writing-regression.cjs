'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ window, key, wait, type, click, line, open, save, shot, js, main, ipcMain }) => {
  const root = path.dirname(main), chapter = path.join(root, 'sections', 'chapter.tex'), style = path.join(root, '样式', 'style.tex');
  await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
  for (const dir of ['sections', '样式', 'images']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.copyFileSync(path.join(__dirname, '../demo/assets/curve.png'), path.join(root, 'images', '实验.png'));
  fs.writeFileSync(main, '\\documentclass{article}\n\\usepackage{graphicx}\n\\input{样式/style}\n\\begin{document}\n\\input{sections/chapter}\n\\end{document}\n');
  fs.writeFileSync(style, '\\newcommand{\\unit}[1]{\\,\\mathrm{#1}}\n\\definecolor{Signal}{HTML}{99520C}\n\\DeclareRobustCommand{\\sig}[1]{{\\color{Signal}#1}}\n');
  fs.writeFileSync(chapter, 'Writing anchor.\n\n\\section{Project writing}\n\nVoltage $3\\unit{V}$ and \\sig{R1}.\n\n\\includegraphics{images/实验.png}\n\nUnknown $\\unknown{V}$ stays source.\n');
  await js(`localStorage.setItem('texpro.writing-positions.v1',JSON.stringify({[${JSON.stringify(root)}]:{active:${JSON.stringify(chapter)},points:{}}}));localStorage.setItem('texpro.settings.v1',JSON.stringify({...JSON.parse(localStorage.getItem('texpro.settings.v1')||'{}'),visual:true}));true`);
  const loaded = new Promise(resolve => window.webContents.once('did-finish-load', resolve)); window.webContents.reload(); await loaded;
  await wait(`!!document.querySelector('.cm-content')`);
  await wait(`document.querySelector('.titlebar-file-name').textContent==='chapter.tex'`);
  await wait(`document.querySelector('.cm-image-figure img')?.naturalWidth>0 && !!document.querySelector('.cm-math-inline .katex')`);
  assert.equal(await js(`document.querySelector('.cm-image-figure img').src.includes(encodeURIComponent('/images/实验.png'))`), true);
  assert.equal(await js(`document.querySelector('.cm-content').textContent.includes('\\\\unknown{V}')`), true);
  assert.equal(await js(`(()=>{const el=[...document.querySelectorAll('.cm-line span')].find(e=>e.textContent==='R1');return el && getComputedStyle(el).color})()`), 'rgb(153, 82, 12)');
  for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot(`project-writing-${theme}`); }
  window.setSize(1000, 720); await shot('project-writing-narrow'); window.setSize(1380, 960);
  await click(line('Writing anchor.')); await key('Right', ['meta']); await type(' Continue.');
  assert.equal(await js(`document.activeElement===document.querySelector('.cm-content')`), true);
  await key('z', ['meta']); await wait(`!document.querySelector('.cm-content').textContent.includes('Continue.')`);
  await key('z', ['meta', 'shift']); await wait(`document.querySelector('.cm-content').textContent.includes('Continue.')`);
  await save(); assert.ok(fs.readFileSync(chapter, 'utf8').includes('Continue.'));
  await click(`document.querySelector('.cm-math-inline')`);
  await wait(`document.querySelector('.cm-content').textContent.includes('3\\\\unit{V}')`);
  assert.equal(await js(`document.activeElement===document.querySelector('.cm-content')`), true);
  await click(line('Writing anchor.'));
  // Editing the open style buffer must refresh a different file before saving it.
  await js(`window.dispatchEvent(new CustomEvent('texpro:writing-jump',{detail:{file:${JSON.stringify(style)},line:1}}));true`);
  await wait(`document.querySelector('.titlebar-file-name').textContent==='style.tex'`);
  await key('a', ['meta']); await type('\\newcommand{\\unit}[1]{\\mathbf{#1}}\n');
  await js(`window.dispatchEvent(new CustomEvent('texpro:writing-jump',{detail:{file:${JSON.stringify(chapter)},line:1}}));true`);
  await wait(`document.querySelector('.titlebar-file-name').textContent==='chapter.tex'`);
  await wait(`!!document.querySelector('.cm-math-inline .mathbf')`);
  assert.ok(fs.readFileSync(style, 'utf8').includes('mathrm'), 'style changes remain unsaved while projections use the buffer');
  await shot('project-writing-unsaved-style');
  await open('language-en'); await shot('project-writing-en');
  assert.deepEqual(await js('window.__flowErrors || []'), []);
  console.log('PASS project writing: closed main, nested preamble, project-relative decoded images, inherited math/text macros, source reveal, typing, undo/redo, unsaved dependency refresh, themes and narrow layout');
  if (process.env.TEXPRO_WRITING_SAMPLE && process.env.TEXPRO_WRITING_SAMPLE_FILE) {
    // Optional acceptance on a real imported project. Always copy before opening.
    const copy = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'texpro-imported-writing-'));
    const handler = ipcMain._invokeHandlers.get('project:open');
    try {
      fs.cpSync(process.env.TEXPRO_WRITING_SAMPLE, copy, { recursive: true, filter: file => !['.git', '.texpro'].includes(path.basename(file)) });
      const target = path.resolve(copy, process.env.TEXPRO_WRITING_SAMPLE_FILE);
      assert.ok(target.startsWith(copy + path.sep));
      await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
      await js(`localStorage.setItem('texpro.writing-positions.v1',JSON.stringify({[${JSON.stringify(copy)}]:{active:${JSON.stringify(target)},points:{}}}));true`);
      ipcMain._invokeHandlers.set('project:open', (event) => handler(event, copy));
      await click(`document.querySelector('.welcome-project-row')`);
      await wait(`document.querySelector('.titlebar-file-name')?.textContent===${JSON.stringify(path.basename(target))}`);
      await wait(`document.querySelector('.cm-image-figure img')?.naturalWidth>0`);
      assert.equal(await js(`document.querySelectorAll('.cm-image-missing').length`), 0);
      for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot(`imported-project-${theme}`); }
      await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
      console.log('PASS imported project copy: closed-main chapter, actual project image decoding and three themes');
    } finally { ipcMain._invokeHandlers.set('project:open', handler); fs.rmSync(copy, { recursive: true, force: true }); }
  }
};
