'use strict';
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { ExtensionManager } = require('./manager.cjs');

function registerExtensionIpc({ app, ipcMain, dialog, getWindow, assertRoot, symbols, safeMode }) {
  const previews = new Map(); let serial = Promise.resolve();
  const changed = () => { const window = getWindow(); if (window && !window.isDestroyed()) window.webContents.send('extensions:changed'); };
  const manager = new ExtensionManager(path.join(app.getPath('userData'), 'extensions'), { assertRoot, symbols, changed, safeMode });
  const ready = manager.start();
  function handle(name, callback, mutation = false) {
    ipcMain.handle('extensions:' + name, async (event, ...args) => {
      if (!getWindow() || event.sender !== getWindow().webContents) throw new Error('Invalid extension sender');
      await ready;
      if (!mutation) return callback(...args);
      const result = serial.then(() => callback(...args)); serial = result.catch(() => {}); return result;
    });
  }
  handle('list', () => manager.list());
  handle('choose', async development => {
    const result = await dialog.showOpenDialog(getWindow(), { title: development ? 'Load extension directory' : 'Install extension package', properties: [development ? 'openDirectory' : 'openFile'], ...(development ? {} : { filters: [{ name: 'TeXPro packages', extensions: ['tpp', 'tpt'] }] }) });
    if (result.canceled || !result.filePaths[0]) return null;
    const source = result.filePaths[0], preview = manager.inspect(source), token = randomUUID();
    for (const [key, item] of previews) if (Date.now() - item.time > 300000) previews.delete(key);
    previews.set(token, { source, digest: preview.digest, time: Date.now() });
    return { token, ...preview };
  });
  handle('install', async token => {
    const preview = previews.get(token); previews.delete(token);
    if (!preview || Date.now() - preview.time > 300000) throw new Error('Extension preview expired; choose the package again');
    const result = await manager.install(preview.source, preview.digest); changed(); return result;
  }, true);
  for (const [name, method] of [['enable', 'enable'], ['configure', 'configure'], ['remove', 'remove'], ['reload', 'reload'], ['rollback', 'rollback']]) {
    handle(name, async (...args) => { const result = await manager[method](...args); changed(); return result; }, true);
  }
  handle('invoke', (id, action, snapshot, input) => manager.invoke(id, action, snapshot, input));
  handle('event', (name, payload) => {
    if (!['projectChanged', 'buildFinished'].includes(name) || Buffer.byteLength(JSON.stringify(payload ?? {})) > 100000) throw new Error('Invalid extension event');
    manager.event(name, payload); return true;
  });
  return manager;
}
module.exports = { registerExtensionIpc };
