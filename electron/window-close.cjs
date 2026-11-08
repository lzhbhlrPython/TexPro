'use strict';
const { randomUUID } = require('node:crypto');

/** A native close is acknowledged only after the renderer has flushed its documents. */
function guardWindowClose(window, { ipcMain, confirmFailure, finish, timeoutMs = 15000 }) {
  let approved = false, pending = null, timer = null, prompting = false;
  const clear = () => { clearTimeout(timer); timer = null; pending = null; };
  const failed = async () => {
    if (prompting) return;
    clear();
    if (window.isDestroyed()) return;
    prompting = true;
    let retry = false;
    try { retry = await confirmFailure(); }
    catch { /* Keep writing if the native prompt cannot be displayed. */ }
    finally { prompting = false; }
    if (retry && !window.isDestroyed()) window.close();
  };
  const reply = (event, result) => {
    if (event.sender !== window.webContents || !pending || result?.id !== pending) return;
    if (!result.ok) { void failed(); return; }
    clear(); approved = true; finish();
  };
  const close = event => {
    if (approved) return;
    event.preventDefault();
    if (pending || prompting) return;
    pending = randomUUID();
    timer = setTimeout(() => void failed(), timeoutMs);
    window.webContents.send('window:prepare-close', { id: pending });
  };
  ipcMain.on('window:close-ready', reply);
  window.on('close', close);
  window.once('closed', () => { clear(); ipcMain.removeListener('window:close-ready', reply); });
}

module.exports = { guardWindowClose };
