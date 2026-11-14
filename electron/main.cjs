'use strict';

const { app, BrowserWindow, dialog, ipcMain, Menu, net, protocol, shell, safeStorage } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const tex = require('./services/tex.cjs');
const collab = require('./services/collab.cjs');
const mcpClient = require('./services/mcp-client.cjs');
const paperApi = require('./services/paper-api.cjs');
const { RealtimeHost } = require('./services/realtime-tex.cjs');
const { registerExtensionIpc } = require('./services/extensions/ipc.cjs');
const { syncPath } = require('./services/extensions/launch.cjs');
let extensionManager = null;
let realtimeHost = null;
let realtimeOwner = null;
let realtimeSerial = Promise.resolve();
const elicitationRequests = new Map();
let elicitationSeq = 0;

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const safeMode = process.argv.includes('--safe-mode');
const isSmoke = process.env.TEXPRO_SMOKE === '1';
const isSmokeWelcome = process.env.TEXPRO_SMOKE_WELCOME === '1';
if (process.env.TEXPRO_SMOKE === '1' || process.env.TEXPRO_NO_SANDBOX === '1') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('disable-dev-shm-usage');
  const userData = process.env.TEXPRO_USER_DATA || path.join(process.cwd(), '.texpro-userdata');
  app.setPath('userData', userData);
  app.setPath('cache', path.join(userData, 'cache'));
}

const allowedRoots = new Set();
let mainWindow = null;
let demoSource = path.join(__dirname, '..', 'demo');
const appIconPath = path.join(__dirname, '..', 'build', 'icon.png');
let menuActionHandlerReady = false;
let pendingExtensionFile = null;
let pendingSyncFile = null;
function queueSyncFile(file) {
  if (!path.isAbsolute(file)) return;
  if (!extensionManager || !mainWindow) { pendingSyncFile = file; return; }
  try { extensionManager.queueSync(file); mainWindow.show(); mainWindow.focus(); }
  catch (error) { void dialog.showMessageBox(mainWindow, { type: 'error', message: nativeText('app.could.not.review.extension.sync'), detail: error.message }); }
}
function queueExtensionFile(file) {
  if (typeof file !== 'string' || !path.isAbsolute(file) || !/\.(?:tpp|tpt)$/i.test(file)) return;
  if (!extensionManager || !mainWindow) { pendingExtensionFile = file; return; }
  try { extensionManager.queuePackage(file); mainWindow.show(); mainWindow.focus(); }
  catch (error) { void dialog.showMessageBox(mainWindow, { type: 'error', message: nativeText('app.could.not.inspect.extension.package'), detail: String(error.message) }); }
}
app.on('open-file', (event, file) => { if (/\.(?:tpp|tpt)$/i.test(file)) { event.preventDefault(); queueExtensionFile(file); } });
if (!isSmoke && !app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', (_event, argv) => {
  for (const file of argv) queueExtensionFile(file);
  const sync = syncPath(argv); if (sync) queueSyncFile(sync);
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
});


protocol.registerSchemesAsPrivileged([
  {
    scheme: 'texpro-asset',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function isAllowed(file) {
  const resolved = path.resolve(file);
  for (const root of allowedRoots) {
    if (resolved === root || resolved.startsWith(root + path.sep)) return true;
  }
  return false;
}

function rememberRoot(root) {
  allowedRoots.add(path.resolve(root));
}

function userTemplateDir() {
  return path.join(app.getPath('userData'), 'templates');
}

function sendMenu(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('menu:action', action);
  }
}

let menuLanguage = 'en';
const nativeSourceMessages = require('../packages/extension-sdk/lib/locale-source.json');
let nativeMessages = {};
function nativeText(key) { return key === 'app.reset.appearance.and.disable.extensions' ? nativeSourceMessages[key] : nativeMessages[key] || nativeSourceMessages[key] || key; }

function localizeMenu(items) {
  return items.map((item) => {
    const next = { ...item };
    if (next.label) next.label = nativeText(next.label);
    if (next.submenu) next.submenu = localizeMenu(next.submenu);
    return next;
  });
}

function buildMenu() {
  nativeMessages = extensionManager?.languages().find(locale => locale.id === menuLanguage)?.messages || {};
  const isMac = process.platform === 'darwin';
  const tool = (label, id, accelerator) => ({
    label,
    ...(accelerator ? { accelerator } : {}),
    click: () => sendMenu('tool:' + id),
  });
  const template = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: "app.file.variant2",
      submenu: [
        { label: "app.open.folder.variant3", accelerator: 'CmdOrCtrl+O', click: () => sendMenu('open-folder') },
        { label: "app.close.project", accelerator: 'CmdOrCtrl+Shift+W', click: () => sendMenu('close-project') },
        { label: "app.save", accelerator: 'CmdOrCtrl+S', click: () => sendMenu('save') },
        { type: 'separator' },
        tool("app.import.markdown.typst.variant2", 'import'),
        tool("app.export.document.variant2", 'export'),
        tool("app.create.arxiv.package", 'arxiv'),
        tool("app.project.backup.variant2", 'backup'),
        { type: 'separator' },
        tool("app.template.library.variant2", 'templates'),
        tool("app.template.workshop.variant2", 'workshop'),
        { type: 'separator' },
        { role: isMac ? 'close' : 'quit' },
      ],
    },
    {
      label: "app.edit",
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: "app.insert",
      submenu: [
        tool("app.insert.music.variant2", 'music'),
        tool("app.display.equation", 'equation'),
        { type: 'separator' },
        tool("app.table.variant2", 'table'),
        tool("app.figure.variant2", 'figure'),
        tool("app.code.block", 'code'),
        { type: 'separator' },
        tool("app.circuit", 'circuit'), tool("app.logic.gates", 'logic'),
        tool("app.chemical.structure.variant2", 'structure'), tool("app.skeletal.formula", 'skeletal'),
        tool("app.tikz.diagram", 'tikz-writing'), tool("app.chart", 'chart-writing'),
        { label: "app.visual.assistance", submenu: [
          tool("app.formula.editor.variant2", 'formula', 'CmdOrCtrl+Shift+E'), tool("app.visual.table.editor.variant2", 'table-editor'),
          tool("app.chart.studio.variant2", 'chart'), tool("app.circuit.studio.variant2", 'circuit-studio'), tool("app.logic.studio.variant2", 'logic-studio'),
          tool("app.structure.studio.variant2", 'structure-studio'), tool("app.ink.studio.variant2", 'ink'), tool("app.tikz.studio.variant2", 'tikz'),
        ] },
        tool("app.page.layout.variant2", 'layout'),
        tool("app.packages.document.class.variant2", 'packages'),
        tool("app.commands.completions.variant2", 'commands'),
      ],
    },
    {
      label: "app.project",
      submenu: [
        tool("app.project.structure.variant2", 'project-structure'),
        tool("app.asset.library.variant2", 'assets'),
        tool("app.bibliography.variant3", 'bibliography'),
        { type: 'separator' },
        tool("app.citation.label.graph.variant2", 'graph'),
        tool("app.font.coverage.variant2", 'font'),
        tool("app.project.doctor.variant2", 'doctor'),
        { type: 'separator' },
        tool("app.version.review.variant2", 'version'),
        tool("app.lan.collaboration.variant2", 'collab'),
        tool("app.version.control.variant2", 'git'),
        tool("app.convert.svg.assets", 'convert-svgs'),
        tool("app.comments.variant2", 'comments'),
        tool("app.ai.assistant.variant2", 'ai'),
        tool("app.mcp.server.variant2", 'mcp'),
      ],
    },
    {
      label: "app.build",
      submenu: [
        { label: "app.compile", accelerator: 'CmdOrCtrl+Enter', click: () => sendMenu('compile') },
        { label: "app.cancel.compile", click: () => sendMenu('cancel-compile') },
        { label: "app.forward.search", accelerator: 'CmdOrCtrl+Shift+J', click: () => sendMenu('forward-sync') },
      ],
    },
    {
      label: "app.navigate.variant2",
      submenu: [
        { label: "app.command.palette.variant2", accelerator: 'CmdOrCtrl+K', click: () => sendMenu('command-palette') },
        { label: "app.toggle.pdf.preview.variant2", accelerator: 'CmdOrCtrl+Alt+P', click: () => sendMenu('toggle-pdf') },
        { label: "app.toggle.sidebar.variant3", accelerator: 'CmdOrCtrl+\\', click: () => sendMenu('toggle-sidebar') },
      ],
    },
    {
      label: "app.view",
      submenu: [
        { label: "app.toggle.visual.mode", accelerator: 'CmdOrCtrl+Shift+M', click: () => sendMenu('toggle-visual') },
        { label: "app.toggle.focus.mode", accelerator: 'CmdOrCtrl+Shift+F', click: () => sendMenu('toggle-focus') },
        { label: "app.typewriter.mode", accelerator: 'CmdOrCtrl+Shift+T', click: () => sendMenu('toggle-typewriter') },
        { type: 'separator' },
        { label: "app.toggle.day.night.variant2", accelerator: 'CmdOrCtrl+Shift+L', click: () => sendMenu('tool:day-night') },
        { label: "app.reset.appearance.and.disable.extensions", click: async () => {
          try { await extensionManager?.disableAll(); sendMenu('reset-appearance'); }
          catch (error) { dialog.showErrorBox('TeXPro', String(error)); }
        } },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(localizeMenu(template)));
}


function mcpConfigPath() {
  return path.join(app.getPath('userData'), 'mcp-servers.json');
}

function readMcpConfigs() {
  try {
    const value = JSON.parse(fs.readFileSync(mcpConfigPath(), 'utf8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeMcpConfigs(configs) {
  const file = mcpConfigPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(configs, null, 2));
}


function installElicitationBridge() {
  mcpClient.setElicitationHandler((params) => new Promise((resolve) => {
    const id = ++elicitationSeq;
    const timer = setTimeout(() => {
      elicitationRequests.delete(id);
      resolve({ action: 'decline' });
    }, 120000);
    elicitationRequests.set(id, {
      resolve: (result) => {
        clearTimeout(timer);
        elicitationRequests.delete(id);
        resolve(result || { action: 'decline' });
      },
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mcp:elicitation', { id, request: params });
    } else {
      elicitationRequests.get(id)?.resolve({ action: 'decline' });
    }
  }));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    icon: appIconPath,
    backgroundColor: process.platform === 'darwin' ? '#00000000' : '#161618',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 16 },
    ...(process.platform === 'darwin'
      ? { vibrancy: 'sidebar', visualEffectState: 'active' }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      additionalArguments: safeMode ? ['--texpro-safe-mode'] : [],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    const query = new URLSearchParams();
    if (isSmoke) query.set('smoke', '1');
    if (isSmokeWelcome) query.set('welcome', '1');
    mainWindow.loadURL(devUrl + (query.toString() ? '?' + query.toString() : ''));
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      query: {
        ...(isSmoke ? { smoke: '1' } : {}),
        ...(isSmokeWelcome ? { welcome: '1' } : {}),
      },
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    }
  });

  const guardedWindow = mainWindow;
  require('./window-close.cjs').guardWindowClose(guardedWindow, {
    ipcMain,
    confirmFailure: async () => {
      const wasQuitting = quitting;
      quitting = false;
      const result = await dialog.showMessageBox(guardedWindow, {
        type: 'warning',
        message: nativeText('app.your.changes.could.not.be.confirmed.as.saved'),
        detail: nativeText('app.your.document.will.stay.open.check.the.save.error'),
        buttons: ['app.keep.writing', 'app.retry.saving.and.close'].map(nativeText),
        defaultId: 0, cancelId: 0,
      });
      if (result.response === 1) quitting = wasQuitting;
      return result.response === 1;
    },
    // Finish outside the IPC callback so native window teardown is not reentrant.
    finish: () => setImmediate(() => { if (quitting) app.quit(); else if (!guardedWindow.isDestroyed()) guardedWindow.close(); }),
  });
  mainWindow.webContents.on('render-process-gone', () => {
    void realtimeHost?.stop(); realtimeHost = null; realtimeOwner = null;
  });
  mainWindow.webContents.on('did-start-navigation', (_event, _url, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) { void realtimeHost?.stop(); realtimeHost = null; realtimeOwner = null; }
  });
  mainWindow.on('closed', () => {
    void realtimeHost?.stop(); realtimeHost = null;
    mainWindow = null;
  });

  if (isSmoke) {
    if (process.env.TEXPRO_FLOW_REGRESSION === '1') require('./flow-regression.cjs')(mainWindow, { app, ipcMain, extensionManager });
    else if (process.env.TEXPRO_CONTINUITY_REGRESSION === '1') require('./continuity-regression.cjs')(mainWindow, { app, ipcMain });
    else if (process.env.TEXPRO_ASSETS_REGRESSION === '1') require('./assets-regression.cjs')(mainWindow, { app, ipcMain });
    else if (process.env.TEXPRO_WRITING_REGRESSION === '1') require('./writing-regression.cjs')(mainWindow, { app, ipcMain });
    else if (process.env.TEXPRO_MUSIC_REGRESSION === '1') require('./music-regression.cjs')(mainWindow, { app, ipcMain });
    else if (process.env.TEXPRO_REGRESSION === '1') require('./regression.cjs')(mainWindow, { app, ipcMain });
    else require('./smoke.cjs')(mainWindow, { app, isSmokeWelcome });
  }
}

function registerIpc() {
  let updateCheck = null;
  ipcMain.handle('app:check-updates', async (event, includeNightly) => {
    if (event.sender !== mainWindow?.webContents || typeof includeNightly !== 'boolean') throw new Error('Invalid update request');
    if (updateCheck) return { ok: false, currentVersion: app.getVersion(), error: 'busy' };
    updateCheck = require('./services/app-updates.cjs').checkForUpdates({ includeNightly, currentVersion: app.getVersion(), fetchImpl: (...args) => net.fetch(...args) });
    try { return await updateCheck; } finally { updateCheck = null; }
  });
  extensionManager = registerExtensionIpc({ app, ipcMain, dialog, getWindow: () => mainWindow, safeMode, onChanged: () => { if (!extensionManager?.languages().some(locale => locale.id === menuLanguage)) menuLanguage = 'en'; buildMenu(); },
    assertRoot: root => { if (!isAllowed(root)) throw new Error('Project access is not authorized'); }, symbols: root => tex.collectProjectSymbols(root) });
  const realtimeOperation = task => {
    const result = realtimeSerial.then(task);
    realtimeSerial = result.catch(() => {});
    return result;
  };
  const assertRealtimeSender = event => {
    if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('Invalid realtime sender');
  };
  ipcMain.handle('realtime:start', (event, options) => realtimeOperation(async () => {
    assertRealtimeSender(event);
    if (!options || typeof options.root !== 'string' || !isAllowed(options.root)) throw new Error('Project is not open');
    if (typeof options.sessionId !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(options.sessionId)) throw new Error('Invalid realtime session');
    await realtimeHost?.stop();
    realtimeOwner = event.sender;
    realtimeHost = new RealtimeHost(options, payload => {
      if (!event.sender.isDestroyed()) event.sender.send('realtime:event', payload);
    });
    return realtimeHost.id;
  }));
  ipcMain.handle('realtime:update', (event, id, documents) => {
    assertRealtimeSender(event);
    if (!realtimeHost || realtimeOwner !== event.sender || realtimeHost.id !== id) return false;
    realtimeHost.update(documents); return true;
  });
  ipcMain.handle('realtime:stop', (event, id) => realtimeOperation(async () => {
    assertRealtimeSender(event);
    if (realtimeHost?.id === id && realtimeOwner === event.sender) { await realtimeHost.stop(); realtimeHost = null; }
  }));
  ipcMain.handle('dialog:openProject', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open a LaTeX project',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Open Project',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const project = tex.openProject(result.filePaths[0]);
    rememberRoot(project.root);
    return project;
  });

  ipcMain.handle('project:open', async (_event, root) => {
    if (typeof root !== 'string' || !root) throw new Error('Invalid project path');
    const project = tex.openProject(root);
    rememberRoot(project.root);
    return project;
  });

  ipcMain.handle('project:demo', async () => {
    const project = tex.ensureDemoProject(demoSource, app.getPath('userData'));
    rememberRoot(project.root);
    return project;
  });

  ipcMain.handle('project:create', async (_event, options) => {
    if (!options || typeof options.name !== 'string' || !Array.isArray(options.files)) {
      throw new Error('Invalid project options');
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose where to create the project',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Create Here',
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const parent = result.filePaths[0];
    const safeName = options.name.trim().replace(/[\\/:*?"<>|]/g, '-').slice(0, 80) || 'untitled';
    let target = path.join(parent, safeName);
    let index = 2;
    while (fs.existsSync(target)) {
      target = path.join(parent, `${safeName}-${index}`);
      index++;
    }
    fs.mkdirSync(target, { recursive: true });
    for (const file of options.files) {
      if (!file || typeof file.path !== 'string' || typeof file.content !== 'string') continue;
      const resolved = path.resolve(target, file.path);
      if (!resolved.startsWith(target + path.sep)) continue;
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, file.content, 'utf8');
    }
    const project = tex.openProject(target);
    rememberRoot(project.root);
    return project;
  });

  ipcMain.handle('assets:list', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.collectAssets(root);
  });

  ipcMain.handle('assets:import', async (_event, root, assetsDir) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Import images',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images and PDF', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf', 'eps'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return tex.collectAssets(root);
    return tex.importAssets(root, result.filePaths, assetsDir || 'assets');
  });

  ipcMain.handle('assets:save-buffer', async (_event, root, assetsDir, payload) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    if (!payload || !payload.data) throw new Error('Invalid image data');
    return tex.saveImageBuffer(root, assetsDir || 'assets', payload);
  });

  ipcMain.handle('assets:delete', async (_event, root, file) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('Asset is outside the project');
    return tex.deleteAsset(root, file);
  });

  const secretFile = () => path.join(app.getPath('userData'), 'secrets.json');
  const readSecrets = () => {
    try { return JSON.parse(fs.readFileSync(secretFile(), 'utf8')); } catch { return {}; }
  };
  ipcMain.handle('secret:set', async (_event, name, value) => {
    if (!safeStorage.isEncryptionAvailable()) return { ok: false, error: 'OS keychain encryption is not available' };
    if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error('Invalid secret name');
    const secrets = readSecrets();
    secrets[name] = safeStorage.encryptString(String(value || '')).toString('base64');
    fs.mkdirSync(path.dirname(secretFile()), { recursive: true });
    fs.writeFileSync(secretFile(), JSON.stringify(secrets, null, 2), { mode: 0o600 });
    return { ok: true };
  });
  ipcMain.handle('secret:get', async (_event, name) => {
    const secrets = readSecrets();
    if (!secrets[name] || !safeStorage.isEncryptionAvailable()) return null;
    try { return safeStorage.decryptString(Buffer.from(secrets[name], 'base64')); } catch { return null; }
  });
  ipcMain.handle('secret:delete', async (_event, name) => {
    const secrets = readSecrets();
    delete secrets[name];
    fs.writeFileSync(secretFile(), JSON.stringify(secrets, null, 2), { mode: 0o600 });
    return { ok: true };
  });

  ipcMain.handle('dialog:open-import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Markdown and Typst', extensions: ['md', 'markdown', 'mdown', 'typ', 'typst', 'txt'] },
        { name: 'All files', extensions: ['*'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const file = result.filePaths[0];
    const content = fs.readFileSync(file, 'utf8');
    return { path: file, content, name: path.basename(file) };
  });

  ipcMain.handle('bib:lookup', async (_event, identifier) => tex.lookupBibtex(identifier));

  ipcMain.handle('bib:open', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Bibliography', extensions: ['ris', 'enw', 'bib'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const file = result.filePaths[0];
    return { path: file, name: path.basename(file), content: fs.readFileSync(file, 'utf8') };
  });

  ipcMain.handle('music:preview', async (_event, payload) => {
    if (!payload || typeof payload.projectRoot !== 'string' || !isAllowed(payload.projectRoot) || typeof payload.runId !== 'string' || !/^music-[a-f0-9-]{36}$/.test(payload.runId)) throw new Error('Project is not open');
    return tex.renderMusicPreview(payload);
  });

  ipcMain.handle('templates:preview', async (_event, payload) => {
    if (!payload || typeof payload.source !== 'string') throw new Error('Invalid template');
    return tex.renderTemplatePreview({
      source: payload.source,
      engine: payload.engine,
      cacheDir: path.join(app.getPath('userData'), 'template-previews'),
    });
  });

  ipcMain.handle('templates:list', async () => tex.listUserTemplates(userTemplateDir()));

  ipcMain.handle('templates:save', async (_event, payload) => {
    if (!payload || typeof payload.content !== 'string') throw new Error('Invalid template');
    return tex.saveUserTemplate(userTemplateDir(), payload);
  });

  ipcMain.handle('templates:delete', async (_event, id) => tex.deleteUserTemplate(userTemplateDir(), id));

  ipcMain.handle('project:symbols', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    const aids = await require('./services/writing-aids.cjs').listWritingAids(root);
    return { ...tex.collectProjectSymbols(root), placeholders: aids.placeholders, writingNotes: aids.memos };
  });

  ipcMain.handle('tikz:render', async (_event, options) => {
    if (!options || typeof options.projectRoot !== 'string' || !isAllowed(options.projectRoot)) {
      throw new Error('Project is not open');
    }
    if (options.filePath && !isAllowed(options.filePath)) throw new Error('File is outside the project');
    return tex.renderTikz(options);
  });

  ipcMain.handle('project:impact', async (_event, root, target) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.projectImpact(root, target);
  });

  ipcMain.handle('project:create-folder', async (_event, root, parent, name) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.createProjectFolder(root, parent, name);
  });

  ipcMain.handle('project:create-file', async (_event, root, parent, name, content) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.createProjectFile(root, parent, name, content || '');
  });

  ipcMain.handle('project:move-file', async (_event, root, file, targetDir) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.moveProjectFile(root, file, targetDir);
  });

  ipcMain.handle('project:delete-file', async (_event, root, file) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.deleteProjectFile(root, file);
  });

  ipcMain.handle('project:delete-folder', async (_event, root, dir) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.deleteProjectFolder(root, dir);
  });

  ipcMain.handle('project:move-dir', async (_event, root, dir, name) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    if (typeof dir !== 'string' || !isAllowed(dir)) throw new Error('Directory is outside the project');
    return tex.moveProjectDirectory(root, dir, name);
  });

  ipcMain.handle('project:rename', async (_event, root, file, name) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('File is outside the project');
    return tex.renameProjectFile(root, file, name);
  });

  ipcMain.handle('collab:start', async (_event, options) => collab.startCollab(options || {}));
  ipcMain.handle('collab:stop', async () => collab.stopCollab());
  ipcMain.handle('collab:status', async () => collab.status());

  ipcMain.handle('backup:run', async (_event, root, options) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.backupProject(root, options || {});
  });

  ipcMain.handle('mcp:respond-elicitation', async (_event, id, result) => {
    const pending = elicitationRequests.get(Number(id));
    if (pending) pending.resolve(result);
    return { ok: Boolean(pending) };
  });

  ipcMain.handle('mcp:client-connect', async (_event, id, options) => mcpClient.connectClient(String(id), options || {}));
  ipcMain.handle('mcp:client-call', async (_event, id, name, args) => mcpClient.callClient(String(id), String(name), args || {}));
  ipcMain.handle('mcp:client-disconnect', async (_event, id) => mcpClient.disconnectClient(String(id)));
  ipcMain.handle('mcp:client-list', async () => mcpClient.listClients());
  ipcMain.handle('mcp:configs', async () => readMcpConfigs());
  ipcMain.handle('mcp:config-save', async (_event, config) => {
    const configs = readMcpConfigs().filter((item) => item.id !== config?.id);
    if (!config?.id || !config?.command) throw new Error('Invalid MCP configuration');
    configs.push({ id: String(config.id), name: String(config.name || config.id), command: String(config.command), args: Array.isArray(config.args) ? config.args.map(String) : [] });
    writeMcpConfigs(configs);
    return configs;
  });
  ipcMain.handle('mcp:config-remove', async (_event, id) => {
    const configs = readMcpConfigs().filter((item) => item.id !== id);
    writeMcpConfigs(configs);
    return configs;
  });

  ipcMain.handle('tex:check-assets', async (_event, packages, classes) => tex.checkTexAssets(packages || [], classes || []));
  ipcMain.handle('menu:set-language', async (_event, language) => {
    menuLanguage = extensionManager.languages().some(locale => locale.id === language) ? language : 'en';
    buildMenu();
    return { ok: true, language: menuLanguage };
  });

  ipcMain.handle('paper-api:start', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return paperApi.start(root);
  });
  ipcMain.handle('paper-api:stop', async () => paperApi.stop());
  ipcMain.handle('paper-api:status', async () => paperApi.status());

  ipcMain.handle('tex:scan-cwl', async (_event, root) => tex.scanCwlSources(root || null));

  ipcMain.handle('tex:run-action', async (_event, root, action, rootFile) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.runProjectAction(root, action, rootFile);
  });

  ipcMain.handle('git:status', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.gitStatus(root);
  });
  ipcMain.handle('git:read-file', async (_event, root, revision, file) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('File is outside the project');
    return tex.gitReadFile(root, revision, file);
  });
  ipcMain.handle('git:init', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.gitInit(root);
  });
  ipcMain.handle('git:commit', async (_event, root, message) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.gitCommit(root, message);
  });
  ipcMain.handle('git:pull', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.gitPull(root);
  });
  ipcMain.handle('git:push', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.gitPush(root);
  });
  ipcMain.handle('git:overleaf-clone', async (_event, url) => tex.overleafClone(url));
  ipcMain.handle('zotero:library', async () => tex.zoteroLibrary());
  ipcMain.handle('zotero:search', async (_event, query) => tex.zoteroSearch(query));
  ipcMain.handle('zotero:bibtex', async (_event, key) => tex.zoteroBibtex(key));

  ipcMain.handle('project:convert-svgs', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.convertSvgReferences(root);
  });

  ipcMain.handle('assets:rasterize-svg', async (_event, root, file) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('File is outside the project');
    return tex.rasterizeSvg(root, file);
  });

  ipcMain.handle('project:arxiv', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.createArxivPackage(root);
  });

  ipcMain.handle('history:list', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.listHistory(root);
  });
  ipcMain.handle('history:commit', async (_event, root, reason) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.commitHistory(root, String(reason || 'manual'));
  });
  ipcMain.handle('history:read', async (_event, root, version, file) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.readHistoryFile(root, String(version), String(file));
  });
  ipcMain.handle('history:delete', async (_event, root, version) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.deleteHistoryVersion(root, String(version));
  });
  ipcMain.handle('history:clear', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.clearHistory(root);
  });

  ipcMain.handle('history:restore', async (_event, root, version, file) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.restoreHistoryFile(root, String(version), String(file));
  });

  ipcMain.handle('project:graph', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.collectProjectGraph(root);
  });

  ipcMain.handle('project:font-coverage', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.fontCoverage(root);
  });

  ipcMain.handle('project:diagnose', async (_event, root) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.diagnoseProject(root);
  });

  ipcMain.handle('project:clean-build', async (_event, root, buildDir) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.cleanBuild(root, buildDir);
  });

  ipcMain.handle('project:search', async (_event, root, query, caseSensitive) => {
    if (typeof root !== 'string' || !isAllowed(root)) throw new Error('Project is not open');
    return tex.searchProject(root, String(query || ''), Boolean(caseSensitive));
  });

  ipcMain.handle('file:stat', async (_event, file) => {
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('File is outside the open project');
    return tex.statFile(file);
  });

  ipcMain.handle('file:read', async (_event, file) => {
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('File is outside the open project');
    return tex.readTextFile(file);
  });

  ipcMain.handle('file:write', async (_event, file, content) => {
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('File is outside the open project');
    tex.writeTextFile(file, String(content ?? ''));
    return { ok: true, savedAt: Date.now() };
  });

  ipcMain.handle('file:exists', async (_event, file) => {
    if (typeof file !== 'string' || !isAllowed(file)) return false;
    try {
      return fs.statSync(file).isFile();
    } catch {
      return false;
    }
  });

  ipcMain.handle('compile:run', async (event, options) => {
    if (!options || typeof options.projectRoot !== 'string' || !isAllowed(options.projectRoot)) {
      throw new Error('Project is not open');
    }
    const runId = options.runId || String(Date.now());
    const sender = event.sender;
    try {
      return await tex.runCompile({
        projectRoot: options.projectRoot,
        activeFile: options.activeFile || null,
        fallbackRoot: options.rootFile || null,
        engine: options.engine || null,
        timeoutMs: options.timeoutMs || 180000,
        runId,
        buildDir: options.buildDir || null,
        onData: (data) => {
          if (!sender.isDestroyed()) sender.send('compile:output', { runId, ...data });
        },
      });
    } catch (error) {
      return {
        ok: false,
        diagnostics: [],
        error: String(error.message || error),
        duration: 0,
      };
    }
  });

  ipcMain.handle('compile:cancel', async (_event, runId) => tex.cancelCompilation(runId));

  ipcMain.handle('pdf:read', async (_event, file) => {
    if (typeof file !== 'string' || !isAllowed(file)) throw new Error('PDF is outside the open project');
    const buffer = fs.readFileSync(file);
    return new Uint8Array(buffer);
  });

  ipcMain.handle('sync:forward', async (_event, options) => {
    if (!options || !isAllowed(options.projectRoot) || !isAllowed(options.pdfFile)) {
      throw new Error('Project is not open');
    }
    return tex.synctexForward(options);
  });

  ipcMain.handle('sync:inverse', async (_event, options) => {
    if (!options || !isAllowed(options.projectRoot) || !isAllowed(options.pdfFile)) {
      throw new Error('Project is not open');
    }
    return tex.synctexInverse(options);
  });

  ipcMain.handle('shell:openExternal', async (_event, url) => {
    if (typeof url !== 'string' || !/^https?:/i.test(url)) return { ok: false };
    await shell.openExternal(url);
    return { ok: true };
  });

  ipcMain.handle('shell:openPath', async (_event, file) => {
    if (typeof file !== 'string' || !isAllowed(file)) return { ok: false };
    const error = await shell.openPath(file);
    return { ok: !error, error: error || null };
  });

  ipcMain.handle('shell:reveal', async (_event, file) => {
    if (typeof file !== 'string' || !isAllowed(file)) return { ok: false };
    shell.showItemInFolder(file);
    return { ok: true };
  });

  let spellWordsCache = null;
  ipcMain.handle('spell:words', async () => {
    if (spellWordsCache) return spellWordsCache;
    try {
      spellWordsCache = fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n').map((word) => word.trim().toLowerCase()).filter(Boolean);
    } catch {
      spellWordsCache = [];
    }
    return spellWordsCache;
  });

  ipcMain.handle('app:info', async () => ({
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    home: app.getPath('home'),
    documents: app.getPath('documents'),
    userData: app.getPath('userData'),
    isDev,
    appPath: app.getAppPath(),
    mcpPath: app.isPackaged ? path.join(process.resourcesPath, 'app.asar.unpacked', 'mcp', 'server.mjs') : path.join(__dirname, '..', 'mcp', 'server.mjs'),
  }));

  ipcMain.handle('app:assetUrl', async (_event, file) => {
    if (typeof file !== 'string' || !isAllowed(file)) return null;
    return 'texpro-asset://asset/?path=' + encodeURIComponent(path.resolve(file));
  });
}

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock && fs.existsSync(appIconPath)) app.dock.setIcon(appIconPath);
  if (!fs.existsSync(path.join(demoSource, 'main.tex'))) {
    demoSource = path.join(app.getAppPath(), 'demo');
  }
  protocol.handle('texpro-asset', async (request) => {
    try {
      const url = new URL(request.url);
      const file = url.searchParams.get('path');
      if (!file) return new Response('Missing path', { status: 400 });
      if (!isAllowed(file)) return new Response('Forbidden', { status: 403 });
      const response = await net.fetch(pathToFileURL(file).toString());
      const headers = new Headers(response.headers);
      // Only the local app renderer may read project artwork into a theme mask.
      const rendererOrigin = isDev ? new URL(process.env.VITE_DEV_SERVER_URL).origin : 'null';
      headers.set('Access-Control-Allow-Origin', rendererOrigin);
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (error) {
      return new Response(String(error), { status: 500 });
    }
  });

  registerIpc();
  buildMenu();
  menuActionHandlerReady = true;
  installElicitationBridge();
  createWindow();
  for (const file of process.argv) queueExtensionFile(file);
  const sync = syncPath(process.argv); if (sync) queueSyncFile(sync);
  if (pendingSyncFile) { queueSyncFile(pendingSyncFile); pendingSyncFile = null; }
  if (pendingExtensionFile) { queueExtensionFile(pendingExtensionFile); pendingExtensionFile = null; }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

let quitting = false;
require('./quit-watchdog.cjs').installQuitWatchdog(app, {
  report: code => {
    if (isSmoke && process.env.TEXPRO_EXIT_REPORT) fs.writeFileSync(process.env.TEXPRO_EXIT_REPORT, JSON.stringify({ code, pid: process.pid, quit: true }));
  },
});
app.on('before-quit', () => { quitting = true; });
app.on('will-quit', () => { extensionManager?.stop(); mcpClient.disconnectAll(); paperApi.stop(); collab.stopCollab(); });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || isSmoke) setImmediate(() => app.quit());
});

process.on('uncaughtException', (error) => {
  console.error('[main] uncaught exception', error);
});
