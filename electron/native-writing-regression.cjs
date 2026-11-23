'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ window, key, wait, type, click, line, open, shot, js, main, ipcMain }) => {
  window.webContents.on('console-message', (_event, details) => { if (details.message?.includes('Native writing raster')) console.log(details.message); });
  const root = path.dirname(main), child = path.join(root, 'sections/chapter.tex');
  const nativeWait = async condition => {
    const start = Date.now();
    while (Date.now() - start < 100000) { if (await js(condition)) return; await new Promise(resolve => setTimeout(resolve, 150)); }
    await js(`document.querySelector('.problems-collapsed .problems-toggle')?.click()`);
    await shot('native-writing-failure'); console.log(await js(`document.querySelector('.problems-list')?.textContent`));
    throw new Error(`Native preview timed out: ${condition}; ` + await js(`document.querySelector('.app')?.textContent.slice(-3000)`));
  };
  await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
  fs.mkdirSync(path.dirname(child), { recursive: true });
  fs.writeFileSync(main, '\\documentclass{article}\n\\usepackage{xcolor}\n\\newenvironment{examplebox}{\\begin{quote}\\itshape}{\\end{quote}}\n\\newcommand{\\plain}[1]{#1}\n\\newcommand{\\badge}[1]{\\fcolorbox{blue}{white}{#1}}\n\\begin{document}\n\\section{Native project}\n\\input{sections/chapter}\n\\end{document}\n');
  const original = 'Writing anchor.\n\n\\begin{examplebox}\nOpaque environment with \\badge{PROJECT}.\n\\end{examplebox}\n\n\\plain{Native text follows the writing typography.}\n\nSimple $a^2$.\n'; fs.writeFileSync(child, original);
  await js(`localStorage.setItem('texpro.writing-positions.v1',JSON.stringify({[${JSON.stringify(root)}]:{active:${JSON.stringify(child)},points:{}}}));localStorage.setItem('texpro.settings.v1',JSON.stringify({...JSON.parse(localStorage.getItem('texpro.settings.v1')||'{}'),visual:true,autoCompile:true,compileMode:'pdfOpen'}));true`);
  const loaded = new Promise(resolve => window.webContents.once('did-finish-load', resolve)); window.webContents.reload(); await loaded;
  await nativeWait(`!!document.querySelector('.cm-native-fragment[data-native-ready="true"]')`);
  assert.equal(await js(`!!document.querySelector('.cm-native-fragment')`), true);
  assert.equal(await js(`document.querySelector('.cm-content').textContent.includes('Writing anchor.')`), true);
  assert.equal(await js(`document.querySelector('.cm-native-fragment canvas').width>100`), true, 'authored box/color stays geometric');
  await nativeWait(`!!document.querySelector('.cm-native-fragment.is-prose')`);
  assert.equal(await js(`getComputedStyle(document.querySelector('.cm-native-prose')).fontFamily===getComputedStyle(document.querySelector('.cm-content')).fontFamily`), true, 'native ordinary text uses the writing font');
  for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot(`native-writing-${theme}`); }
  window.setSize(1000, 720); await shot('native-writing-narrow'); window.setSize(1380, 960);
  await click(`document.querySelector('.cm-native-fragment')`);
  await wait(`document.querySelector('.cm-content').textContent.includes('Opaque environment')`);
  assert.equal(await js(`document.activeElement===document.querySelector('.cm-content')`), true);
  assert.equal(await js(`(()=>{const node=[...document.querySelectorAll('.cm-line span')].find(el=>el.textContent==='\\\\begin');return !!node && getComputedStyle(node).color!==getComputedStyle(document.querySelector('.cm-content')).color})()`), true, 'revealed TeX retains syntax highlighting');
  await shot('native-writing-source-reveal');
  await click(line('Opaque environment')); await key('Right', ['meta']);
  await type(' EDITED');
  await key('z', ['meta']); await wait(`!document.querySelector('.cm-content').textContent.includes('EDITED')`);
  await key('z', ['meta', 'shift']);
  await click(line('Writing anchor.'));
  await nativeWait(`!!document.querySelector('.cm-native-fragment[data-native-ready="true"]')`);
  assert.equal(fs.readFileSync(child, 'utf8'), original, 'native preview must not save author buffers');
  await shot('native-writing-unsaved');
  // The master composes the same child projections, including unsaved text.
  await js(`window.dispatchEvent(new CustomEvent('texpro:writing-jump',{detail:{file:${JSON.stringify(main)},line:1}}));true`);
  await wait(`document.querySelector('.titlebar-file-name').textContent==='main.tex'`);
  await nativeWait(`!!document.querySelector('.cm-included-writing .cm-native-fragment[data-native-ready="true"]')`);
  assert.equal(await js(`document.querySelectorAll('.cm-included-writing').length`), 1);
  assert.equal(await js(`document.querySelector('.cm-included-writing').textContent.includes('Writing anchor.')`), true);
  await shot('native-writing-master');
  const nativePoint = await js(`(()=>{const r=document.querySelector('.cm-native-fragment').getBoundingClientRect();return {x:Math.round(r.x+r.width*.35),y:Math.round(r.y+r.height*.22)}})()`);
  for (const eventType of ['mouseDown', 'mouseUp']) window.webContents.sendInputEvent({ type: eventType, ...nativePoint, button: 'left', clickCount: 1 });
  await wait(`document.querySelector('.titlebar-file-name').textContent==='chapter.tex'`);
  await shot('native-writing-master-inverse');
  await js(`window.dispatchEvent(new CustomEvent('texpro:writing-jump',{detail:{file:${JSON.stringify(main)},line:1}}));true`);
  await wait(`document.querySelector('.titlebar-file-name').textContent==='main.tex'`);
  await nativeWait(`!!document.querySelector('.cm-native-fragment[data-native-ready="true"]')`);
  await open('visual'); await wait(`!document.querySelector('.cm-native-writing')`);
  assert.equal(await js(`(()=>{const node=[...document.querySelectorAll('.cm-line span')].find(el=>el.textContent==='\\\\documentclass');return !!node && getComputedStyle(node).color!==getComputedStyle(document.querySelector('.cm-content')).color})()`), true, 'source mode retains syntax highlighting');
  await shot('native-writing-source-mode'); await open('visual');
  assert.deepEqual(await js('window.__flowErrors || []'), []);
  console.log('PASS native writing: arbitrary custom macro/environment, native geometry crops in continuous paper, themes, narrow layout, source reveal focus, undo/redo, unsaved snapshots and master composition');
  if (process.env.TEXPRO_WRITING_SAMPLE) {
    await open('save');
    const copy = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'texpro-native-import-'));
    const handler = ipcMain._invokeHandlers.get('project:open');
    try {
      fs.cpSync(process.env.TEXPRO_WRITING_SAMPLE, copy, { recursive: true, filter: file => !['.git', '.texpro'].includes(path.basename(file)) });
      await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
      await js(`localStorage.setItem('texpro.writing-positions.v1','{}');true`);
      ipcMain._invokeHandlers.set('project:open', event => handler(event, copy));
      await click(`document.querySelector('.welcome-project-row')`);
      await nativeWait(`!!document.querySelector('.cm-included-writing .cm-line')`);
      assert.equal(await js(`!!document.querySelector('.cm-included-writing .cm-line')`), true, 'chapters share the editor typography');
      await nativeWait(`!!document.querySelector('.cm-included-writing')?.querySelector('.cm-native-fragment[data-native-ready="true"]')`);
      for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot(`native-imported-${theme}`); }
      console.log('PASS real imported master: continuous child composition, original source offsets and three themes on temporary copy');
      if (process.env.TEXPRO_WRITING_SAMPLE_FILE) {
        const chapter = path.resolve(copy, process.env.TEXPRO_WRITING_SAMPLE_FILE); assert.ok(chapter.startsWith(copy + path.sep));
        await js(`window.dispatchEvent(new CustomEvent('texpro:writing-jump',{detail:{file:${JSON.stringify(chapter)},line:1}}));true`);
        await wait(`document.querySelector('.titlebar-file-name').textContent===${JSON.stringify(path.basename(chapter))}`);
        await nativeWait(`!!document.querySelector('.cm-native-fragment[data-native-ready="true"]')`);
        for (const theme of ['paper', 'studio', 'night']) { await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`); await shot(`native-imported-child-${theme}`); }
        console.log('PASS real imported child: native complex blocks with original class, packages, macros and figures');
      }

    } finally { ipcMain._invokeHandlers.set('project:open', handler); await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`); fs.rmSync(copy, { recursive: true, force: true }); }
  }
};
