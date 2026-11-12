'use strict';
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { ExtensionManager } = require('./manager.cjs');

function registerExtensionIpc({ app, ipcMain, dialog, getWindow, assertRoot, symbols, safeMode, onChanged }) {
  const previews = new Map(); let pendingToken; let pendingSync; let serial = Promise.resolve();
  const changed = () => { onChanged?.(); const window = getWindow(); if (window && !window.isDestroyed()) window.webContents.send('extensions:changed'); };
  const manager = new ExtensionManager(path.join(app.getPath('userData'), 'extensions'), { assertRoot, symbols, changed, safeMode, builtinSources: [path.join(__dirname, '../../../packages/extension-translate-zh-cn/language')] });
  const ready = manager.start();
  function handle(name, callback, mutation = false) {
    ipcMain.handle('extensions:' + name, async (event, ...args) => {
      if (!getWindow() || event.sender !== getWindow().webContents) throw new Error('Invalid extension sender');
      if (name !== 'languages') await ready;
      if (!mutation) return callback(...args);
      const result = serial.then(() => callback(...args)); serial = result.catch(() => {}); return result;
    });
  }
  manager.queueSync = source => { pendingSync = require('./environment.cjs').syncReview(manager, source); getWindow()?.webContents.send('extensions:package'); };
  handle('sync-pending', () => pendingSync ? { root: pendingSync.root, changes: pendingSync.changes.map(({ kind, id, manifest, origin }) => ({ kind, id, manifest, origin })) } : null);
  handle('sync-apply', async id => {
    if (!pendingSync) throw new Error('No extension sync review');
    const fresh = require('./environment.cjs').syncReview(manager, pendingSync.source);
    const expected = pendingSync.changes.find(item => item.id === id), change = fresh.changes.find(item => item.id === id);
    if (!expected || !change || expected.kind !== change.kind || expected.digest !== change.digest) throw new Error('Extension sync changed; review again');
    if (change.kind === 'install') await manager.install(change.source, change.digest, change.origin);
    else {
      if (manager.records[id]?.origin?.environment !== fresh.environment) throw new Error('Extension ownership changed');
      await manager.remove(id);
    }
    pendingSync = require('./environment.cjs').syncReview(manager, fresh.source); changed();
    return true;
  }, true);
  handle('sync-dismiss', () => { pendingSync = undefined; return true; });
  handle('pending', () => { const preview = previews.get(pendingToken); if (!preview || Date.now() - preview.time > 300000) return null; return { token: pendingToken, ...manager.inspect(preview.source) }; });
  manager.queuePackage = source => {
    const preview = manager.inspect(source); if (preview.development) throw new Error('Choose a .tpp or .tpt file');
    if (pendingToken) previews.delete(pendingToken);
    pendingToken = randomUUID(); previews.set(pendingToken, { source, digest: preview.digest, time: Date.now() });
    getWindow()?.webContents.send('extensions:package');
  };
  handle('languages', () => manager.languages());
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
