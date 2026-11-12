'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { dialog, Menu } = require('electron');
const { readPackage } = require('./services/extensions/packages.cjs');
const { pack } = require('./services/extensions/archive.cjs');

module.exports = async function extensionJourney({ window, key, wait, type, click, line, open, shot, js, main }) {
  const el = selector => `document.querySelector(${JSON.stringify(selector)})`;
  const button = (text, root = '.extensions-panel') => `[...document.querySelectorAll(${JSON.stringify(root + ' button')})].find(e=>e.textContent.trim()===${JSON.stringify(text)})`;
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  await open('language-en');
  const original = dialog.showOpenDialog; let chosen;
  dialog.showOpenDialog = async (...args) => args.at(-1)?.filters?.some(filter => filter.name === 'TeXPro packages') ? { canceled: false, filePaths: [chosen] } : original(...args);
  async function install(name) {
    const source = path.join(__dirname, '..', 'examples', 'extensions', name), file = path.join(path.dirname(main), name + (name === 'quiet-paper' ? '.tpt' : '.tpp'));
    fs.writeFileSync(file, pack(readPackage(source).files)); chosen = file;
    await open('plugin-market'); await wait(`!!${el('.extensions-panel')}`);
    await click(button('Install package…')); await wait(`!!${button('Install disabled')}`); await click(button('Install disabled'));
    await wait(`!!${button('Enable')}`);
  }
  const close = async () => { await click(el('.extensions-panel .studio-header .icon-btn')); await wait(`!${el('.extensions-panel')}`); };
  try {
    await install('quiet-paper'); assert.equal(await js(`(${button('Enable')}).disabled`), true);
    await click(el('.extension-trust input')); await click(button('Enable'));
    await wait(`!!${button('Preview')}`); await click(button('Preview'));
    assert.equal(await js(`document.documentElement.style.getPropertyValue('--paper')`), '#fff9ed');
    assert.equal(await js(`getComputedStyle(document.querySelector('.extensions-panel')).borderRadius`), '12px');
    assert.ok(await js(`document.querySelector('style[data-extension-styles]').textContent.includes('data:image/png;base64,')`));
    await close(); assert.equal(await js(`document.documentElement.style.getPropertyValue('--paper')`), '');
    await open('plugin-market'); await click(button('Apply theme'));
    await wait(`JSON.parse(localStorage.getItem('texpro.settings.v1')).themePackage==='texpro.quiet-paper/warm'`);
    await shot('extensions-theme');
    await click(button('Disable')); await wait(`document.documentElement.style.getPropertyValue('--paper')===''`);
    await click(el('.extension-trust input')); await click(button('Enable')); await wait(`!!${button('Preview')}`); await close();
    await install('writing-kit');
    assert.equal(await js(`(${button('Enable')}).disabled`), true);
    await click(el('.extension-trust input')); await click(button('Enable'));
    await wait(`!!${button('Disable')}`); await shot('extensions-manager'); await close();
    await click(line('Writing anchor.')); await key('Right', ['meta']); await type(' extension sample'); await key('Left', ['meta', 'shift']);
    await open('texpro.writing-kit/uppercase'); await click(button('Run', '.extension-tool')); await wait(`!!${button('Apply changes', '.extension-tool')}`); await shot('extensions-proposal');
    await click(button('Apply changes', '.extension-tool')); await wait(`!${el('.extension-tool')}`);
    assert.ok(await js(`document.querySelector('.cm-content').textContent.includes('EXTENSION SAMPLE')`));
    await key('z', ['meta']); assert.ok(await js(`document.querySelector('.cm-content').textContent.includes('extension sample')`), JSON.stringify(await js(`({text:document.querySelector('.cm-content').textContent,active:document.activeElement?.outerHTML.slice(0,180)})`)));
    // Closing during a delayed provider call must not reopen the tool or modify writing.
    await key('Left', ['meta', 'shift']); await open('texpro.writing-kit/uppercase');
    await click(el('.extension-tool textarea')); await type('{"delay":700}'); await click(button('Run', '.extension-tool'));
    await click(el('.extension-tool .studio-header .icon-btn')); await pause(900);
    assert.equal(await js(`!!document.querySelector('.extension-tool')`), false);
    assert.ok(await js(`document.querySelector('.cm-content').textContent.includes('extension sample')`));
    await open('compile-theater'); await wait(`!!document.querySelector('.problems-panel') && !!document.querySelector('.compile-log')`);
    assert.equal(await js(`!!document.querySelector('.compile-theater')`), false);
    await open('paper-api'); await wait(`!!document.querySelector('[aria-label="Paper API"]')`); await key('Escape');
    await open('circuit-studio'); await wait(`!!document.querySelector('.workspace-layer [data-testid="circuit-studio"]')`);
    const size = await js(`(()=>{const r=document.querySelector('.workspace-layer').getBoundingClientRect(); return {width:r.width,viewport:innerWidth};})()`); assert.equal(size.width, size.viewport);
    if (process.platform === 'darwin') assert.ok(await js(`document.querySelector('.workspace-navigation button').getBoundingClientRect().left >= 92`), 'workspace navigation clears native traffic lights');
    await js(`document.documentElement.dataset.platform='win32'`);
    assert.ok(await js(`document.querySelector('.workspace-navigation button').getBoundingClientRect().left < 40`), 'native-titlebar platforms do not reserve macOS traffic-light space');
    await js(`document.documentElement.dataset.platform=${JSON.stringify(process.platform)}`);
    await wait(`!!document.querySelector('.schematic-preview-canvas img') && document.querySelector('.schematic-preview-canvas img').complete`);
    await shot('diagram-workspace'); await click(button('Back to writing', '.workspace-layer'));
    await wait(`document.activeElement?.closest('.cm-editor')!==null`);
    for (const theme of ['paper', 'studio', 'night']) { await open('theme-' + theme); await wait(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`); await shot('theme-' + theme); }
    await open('theme-paper');
    await open('ink'); await wait(`!!document.querySelector('.workspace-layer [data-testid="ink-studio"]')`); await shot('ink-workspace'); await key('Escape');
    await open('workshop'); await wait(`!!document.querySelector('.workspace-layer [data-testid="template-workshop"]')`); await shot('template-workspace'); await key('Escape');
    await open('plugin-market'); window.setSize(700, 760); await pause(300); await shot('extensions-narrow'); window.setSize(1440, 920); await close();
    await open('language-zh'); await open('plugin-market'); await wait(`document.querySelector('.extensions-panel h2')?.textContent==='扩展'`); await shot('extensions-zh'); await key('Escape');
    const view = Menu.getApplicationMenu().items.find(item => item.submenu?.items.some(child => /Reset Appearance|重置外观/.test(child.label)));
    const reset = view?.submenu.items.find(item => /Reset Appearance|重置外观/.test(item.label));
    assert.ok(reset, 'native recovery command exists'); reset.click();
    await wait(`!document.querySelector('style[data-extension-styles]') && !JSON.parse(localStorage.getItem('texpro.settings.v1')).themePackage`);
    assert.equal(await js(`(async()=> (await window.texpro.extensionsList()).every(item=>!item.enabled))()`), true);
    await open('close-project'); await wait(`!!document.querySelector('[data-testid="welcome"]')`);
    fs.copyFileSync(path.join(__dirname, '..', 'demo', 'main.tex'), main);
    await click(el('.welcome-project-row')); await wait(`!!document.querySelector('.cm-content')`);
    await open('language-en'); if (!await js(`JSON.parse(localStorage.getItem('texpro.settings.v1')).visual`)) await open('visual');
    await key('Escape'); await click(el('.cm-content')); await key('End', ['meta']);
    await js(`document.querySelector('.cm-scroller').scrollTop=0`);
    await wait(`!!document.querySelector('.cm-math-inline,.cm-math-block,.cm-writing-table,.cm-image-figure')`);
    for (const theme of ['paper', 'studio', 'night']) { await open('theme-' + theme); await wait(`document.documentElement.dataset.theme===${JSON.stringify(theme)}`); await shot('preview-' + theme); }
    await open('theme-paper');
    console.log('PASS extensions native journey: trusted package install, theme preview/cancel/apply/disable, transaction undo, delayed-result dismissal, build details, integration ownership, workspaces, themes, narrow and bilingual');
  } finally { dialog.showOpenDialog = original; }
};
