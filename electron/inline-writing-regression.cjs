'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ window, key, wait, type, click, open, save, shot, js, main }) => {
  await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
  const source = String.raw`\documentclass{article}
\usepackage{xcolor}
\definecolor{Signal}{HTML}{99520C}
\DeclareRobustCommand{\sig}[1]{{\color{Signal}#1}}
\title{Inline writing}
\begin{document}
\maketitle
Writing anchor.

\[x^2+12\]

\begin{tabular}{ll}
A & B \\
1 & 2 \\
\end{tabular}


\section{Chapter 2}
Before \textbf{Signal \sig{R12}} and 51 ohms.

Raw \unknown{12}.
\end{document}
`;
  fs.writeFileSync(main, source);
  const root = path.dirname(main);
  await js(`localStorage.setItem('texpro.writing-positions.v1',JSON.stringify({[${JSON.stringify(root)}]:{active:${JSON.stringify(main)},points:{}}}));localStorage.setItem('texpro.settings.v1',JSON.stringify({...JSON.parse(localStorage.getItem('texpro.settings.v1')||'{}'),visual:true,autoSave:false,autoCompile:false,compileMode:'manual'}));true`);
  const loaded = new Promise(resolve => window.webContents.once('did-finish-load', resolve)); window.webContents.reload(); await loaded;
  require('electron').app.focus({ steal: true }); window.focus();
  await wait(`!!document.querySelector('.cm-bold') && !!document.querySelector('.cm-math-block') && !!document.querySelector('.cm-table-widget') && !!document.querySelector('.cm-title-widget')`);
  // Use actual mouse input at the desired text boundary, rather than reaching
  // into a private CodeMirror view or bypassing its selection/DOM observer.
  const caret = async (text, offset, selector = '.cm-content') => {
    await js(`(()=>{const walk=document.createTreeWalker(document.querySelector(${JSON.stringify(selector)}),NodeFilter.SHOW_TEXT);let node;while(node=walk.nextNode())if(node.textContent===${JSON.stringify(text)}){node.parentElement.scrollIntoView({block:'center'});return}})()`);
    await new Promise(resolve => setTimeout(resolve, 120));
    const point = await js(`(()=>{const walk=document.createTreeWalker(document.querySelector(${JSON.stringify(selector)}),NodeFilter.SHOW_TEXT);let node;while(node=walk.nextNode()){if(node.textContent===${JSON.stringify(text)}){const range=document.createRange();range.setStart(node,${offset});range.collapse(true);const r=range.getBoundingClientRect();return {x:Math.round(r.left),y:Math.round(r.top+r.height/2)}}}throw Error('Missing text node: '+${JSON.stringify(text)})})()`);
    for (const eventType of ['mouseDown', 'mouseUp']) window.webContents.sendInputEvent({ type: eventType, ...point, button: 'left', clickCount: 1 });
    await new Promise(resolve => setTimeout(resolve, 120));
  };
  const visible = `!document.querySelector('.cm-content').textContent.includes('\\\\textbf') && !document.querySelector('.cm-content').textContent.includes('\\\\sig')`;
  for (const theme of ['paper', 'studio', 'night']) {
    await js(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    assert.equal(await js(`(()=>{const el=[...document.querySelectorAll('.cm-bold span')].find(e=>e.textContent==='12');return !!el && getComputedStyle(el).color===getComputedStyle(el.parentElement).color})()`), true, 'numeric tokens inherit the authored color');
    assert.equal(await js(`(()=>{const line=document.querySelector('.cm-heading-line');const el=[...line.querySelectorAll('span')].find(e=>e.textContent==='2');return !!el && getComputedStyle(el).color===getComputedStyle(line).color})()`), true, 'heading digits retain heading typography');
    await shot(`inline-writing-${theme}`);
  }
  await caret('12', 1, '.cm-bold');
  await wait(visible);
  await js(`document.activeElement.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));true`);
  await type('中文');
  await js(`document.activeElement.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'中文'}));true`);
  await wait(visible); await shot('inline-writing-ime'); await save();
  const edited = source.replace('R12', 'R1中文2');
  assert.equal(fs.readFileSync(main, 'utf8'), edited, 'only the real argument changes, without flattening nested commands');
  assert.equal(await js(`document.activeElement===document.querySelector('.cm-content')`), true);
  await key('z', ['meta']); await save(); assert.equal(fs.readFileSync(main, 'utf8'), source);
  await key('z', ['meta', 'shift']); await save(); assert.equal(fs.readFileSync(main, 'utf8'), edited);
  await shot('inline-writing-editing');
  window.setSize(1000, 720); await shot('inline-writing-narrow'); window.setSize(1380, 960);
  // A heading is real source text too: its badge keeps an explicit source entry.
  await caret('Chapter ', 3); await type('X'); await save();
  assert.equal(fs.readFileSync(main, 'utf8'), edited.replace('Chapter 2', 'ChaXpter 2'));
  assert.equal(await js(`!document.querySelector('.cm-content').textContent.includes('\\\\section')`), true);
  await key('z', ['meta']); await save(); assert.equal(fs.readFileSync(main, 'utf8'), edited);
  await click(`document.querySelector('.cm-section-badge')`);
  await wait(`document.querySelector('.cm-content').textContent.includes('\\\\section')`);
  await open('visual');
  assert.equal(await js(`!document.querySelector('.cm-prose-line')`), true);
  assert.equal(await js(`(()=>{const node=[...document.querySelectorAll('.cm-line span')].find(el=>el.textContent==='12');return !!node && getComputedStyle(node).color!==getComputedStyle(document.querySelector('.cm-content')).color})()`), true, 'source mode keeps numeric syntax highlighting');
  await shot('inline-writing-source'); await open('visual');
  assert.deepEqual(await js('window.__flowErrors || []'), []);
  console.log('PASS inline writing: nested styled text, authored numeric color, direct heading input, mouse caret, Chinese IME, exact saved TeX, undo/redo, source entry, three themes and narrow layout');
};
