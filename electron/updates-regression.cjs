'use strict';
const assert = require('node:assert/strict');
module.exports = async ({ key, wait, click, open, shot, js, ipcMain }) => {
  // Exercise validation over the actual preload before replacing remote responses.
  assert.equal(await js(`window.texpro.checkForUpdates('bad').then(()=>false,()=>true)`), true);
  assert.equal(await js(`window.texpro.downloadUpdate().then(s=>s.error)`), 'noRelease');
  const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
  const { createHash } = require('node:crypto');
  const bytes = Buffer.alloc(100000, 42);
  const digest = 'sha256:' + createHash('sha256').update(bytes).digest('hex');
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-update-ui-'));
  const manager = new (require('./services/update-download.cjs').UpdateDownload)(folder, { fetchImpl: async () => new Response(bytes) });
  let answer = { ok: false, currentVersion: '0.1.1', error: 'network' };
  let releasePending; let seen;
  ipcMain.removeHandler('app:check-updates');
  ipcMain.handle('app:check-updates', (_event, includeNightly) => {
    seen = includeNightly;
    return answer === 'pending' ? new Promise(resolve => { releasePending = resolve; }) : answer;
  });
  for (const name of ['download', 'download-status', 'download-cancel', 'download-reveal']) ipcMain.removeHandler('app:update-' + name);
  ipcMain.handle('app:update-download', () => manager.start(answer?.release));
  ipcMain.handle('app:update-download-status', () => manager.snapshot());
  ipcMain.handle('app:update-download-cancel', () => manager.cancel());
  let revealed = '';
  ipcMain.handle('app:update-download-reveal', () => manager.reveal(file => { revealed = file; }));
  let opened = '';
  ipcMain.removeHandler('shell:openExternal');
  ipcMain.handle('shell:openExternal', (_event, url) => { opened = url; return { ok: true }; });
  const check = () => click(`document.querySelector('[data-testid="check-updates"]')`);
  const box = `document.querySelector('.settings-section input[type="checkbox"]')`;
  await open('language-en'); await wait(`document.documentElement.lang === 'en'`); await open('settings');
  await wait(`document.body.textContent.includes('Software updates')`);
  assert.equal(await js(`${box}.checked`), false);
  await check(); await wait(`document.body.textContent.includes('Could not reach GitHub')`); assert.equal(seen, false);
  answer = { ok: true, currentVersion:'0.1.1', status:'available', release:{ version:'0.1.2-20261114-Nightly', channel:'nightly', url:'https://github.com/lzhbhlrPython/TexPro/releases/tag/test', downloadUrl:'https://github.com/lzhbhlrPython/TexPro/releases/download/test/test.dmg', notes:'<script>test</script>\nRelease details', assetName:'TeXPro-0.1.2-20261114-Nightly-mac-universal.dmg', size:bytes.length, digest } };
  await click(box); await click(`document.querySelectorAll('.settings-section input[type="checkbox"]')[1]`); await check(); await wait(`document.body.textContent.includes('An update is available')`); assert.equal(seen,true);
  await wait(`document.body.textContent.includes('Download verified.')`);
  await click(`[...document.querySelectorAll('.settings-panel button')].find(e=>e.textContent==='Show in folder')`);
  assert.equal(fs.readFileSync(revealed).length, bytes.length);
  await click(`[...document.querySelectorAll('.settings-panel button')].find(e=>e.textContent==='Download in browser')`);
  assert.equal(opened, answer.release.downloadUrl);
  await click(`document.querySelector('.settings-section details summary')`);
  await wait(`document.body.textContent.includes('<script>test</script>')`);
  assert.equal(await js(`!!document.querySelector('.settings-panel script')`), false);
  await shot('updates-en-paper');
  answer = 'pending'; await check(); await wait(`document.querySelector('[data-testid="check-updates"]').disabled`);
  await click(box); releasePending({ ok:true,currentVersion:'0.1.1',status:'unavailable',release:null });
  await js(`new Promise(r=>setTimeout(r,100))`);
  assert.equal(await js(`document.body.textContent.includes('No compatible installer')`),false,'channel switch rejects stale response');
  await key('Escape'); await wait(`!document.querySelector('.settings-panel')`);
  await open('language-zh'); await open('theme-night'); await open('settings');
  await wait(`document.body.textContent.includes('软件更新')`);
  answer = { ok:true,currentVersion:'0.1.1',status:'current',release:null }; await check();
  await wait(`document.body.textContent.includes('所选渠道暂无更高的兼容版本')`);
  await shot('updates-zh-night');
  manager.fetch = async (_url, { signal }) => new Response(new ReadableStream({
    async pull(controller) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (signal.aborted) { controller.error(new Error('cancelled')); return; }
      controller.enqueue(bytes.subarray(0, 1000));
    },
  }));
  answer = { ok: true, currentVersion: '0.1.1', status: 'available', release: {
    version: '0.1.3-20261114-Nightly', channel: 'nightly', url: 'https://github.com/lzhbhlrPython/TexPro/releases/tag/test',
    downloadUrl: 'https://github.com/lzhbhlrPython/TexPro/releases/download/test/test.dmg',
    assetName: 'TeXPro-0.1.3-20261114-Nightly-mac-universal.dmg', size: bytes.length, digest, notes: '',
  } };
  await check(); await wait(`!!document.querySelector('.update-download progress')`);
  assert.equal(await js(`${box}.disabled`), true, 'channel changes wait for cancellation');
  await shot('updates-zh-progress');
  await click(`[...document.querySelectorAll('.settings-panel button')].find(e=>e.textContent==='取消下载')`);
  await wait(`document.body.textContent.includes('下载已取消')`);
  assert.equal(await js(`${box}.disabled`), false);

  await key('Escape'); await open('theme-studio'); await open('settings'); await shot('updates-zh-studio');
  await key('Escape'); await open('settings');
  assert.equal(await js(`${box}.checked`), false, 'channel preference survives reopen');
  await js(`document.querySelector('[data-testid="check-updates"]').focus()`);
  await key('Tab',['shift']); assert.equal(await js(`document.activeElement.type`),'checkbox');
  await key('Escape'); await wait(`!document.querySelector('.settings-panel')`);
  await manager.cancel(); fs.rmSync(folder, { recursive: true, force: true });
  console.log('PASS update settings: automatic in-app download, checksum, reveal, browser fallback, IPC validation, channels, errors, download, stale results, bilingual text, themes and keyboard');
};
