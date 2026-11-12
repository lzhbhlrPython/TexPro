'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { randomUUID } = require('node:crypto');
const { Worker, isMainThread, parentPort, workerData } = require('node:worker_threads');
const { spawn, execFileSync } = require('node:child_process');
const { resolveProjectRoot } = require('./project-root.cjs');
const { detectEngine, resolveTexBinary } = require('./tex.cjs');
const { inside } = require('./realtime-scene.cjs');
const MAX_TEXT = 4 * 1024 * 1024;

function validateDocuments(documents) {
  if (!Array.isArray(documents) || documents.length > 100) throw new Error('Invalid realtime update');
  let total = 0;
  for (const doc of documents) {
    if (!doc || typeof doc.path !== 'string' || typeof doc.text !== 'string' || Buffer.byteLength(doc.text) > MAX_TEXT) throw new Error('Invalid realtime document');
    total += Buffer.byteLength(doc.text);
  }
  if (total > 16 * 1024 * 1024) throw new Error('Realtime buffer limit exceeded');
}
function safeFile(root, file) {
  root = fs.realpathSync(root);
  if (typeof file !== 'string') throw new Error('Invalid source path');
  const real = fs.realpathSync(path.resolve(root, file));
  if (!inside(root, real) || !/\.(tex|ltx)$/i.test(real) || !fs.statSync(real).isFile()) throw new Error('Source outside project');
  return real;
}
function killTree(pid, signal = 'SIGTERM') {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      const child = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
      child.on('error', () => {});
    } else process.kill(-pid, signal);
  } catch { /* already exited */ }
}
class RealtimeHost {
  constructor(options, send) {
    validateDocuments(options.documents);
    this.id = options.sessionId || randomUUID(); this.pids = new Set(); this.closed = false; this.ready = false;
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(this.id)) throw new Error('Invalid realtime session');
    this.root = fs.realpathSync(options.root);
    // rtex-ts transfers fs.openSync FIFO descriptors to net.Socket, which owns their close.
    // Worker fs tracking cannot observe that ownership transfer and may close a reused host FD.
    this.worker = new Worker(__filename.replace(/app\.asar([/\\])/, 'app.asar.unpacked$1'), { trackUnmanagedFds: false, workerData: { ...options, sessionId: this.id } });
    this.worker.on('message', event => {
      if (event.processes) this.pids = new Set(event.processes);
      else if (event.buildDir) this.buildDir = event.buildDir;
      else if (event.accepted) { this.ready = true; this.pump(); }
      else if (!this.closed) { send({ ...event, sessionId: this.id }); if (event.kind === 'error') void this.stop(); }
    });
    this.worker.on('error', error => { if (!this.closed) send({ sessionId: this.id, kind: 'error', error: error.message }); void this.stop(); });
    this.worker.on('exit', code => {
      if (!this.closed) { send({ sessionId: this.id, kind: 'error', error: `Realtime worker exited (${code})` }); void this.stop(); }
    });
  }
  update(documents) {
    if (this.closed) throw new Error('Realtime session is closed');
    validateDocuments(documents);
    // Coalesce IPC bursts in the main process; at most one batch is in the worker queue.
    this.pending = documents;
    if (!this.scheduled) {
      this.scheduled = setTimeout(() => { this.scheduled = null; this.pump(); }, 25);
    }
  }
  pump() {
    if (this.closed || !this.ready || !this.pending) return;
    const documents = this.pending; this.pending = null; this.ready = false;
    this.worker.postMessage({ cmd: 'update', documents });
  }
  async stop() {
    if (this.stopping) return this.stopping;
    this.closed = true; clearTimeout(this.scheduled);
    this.stopping = (async () => {
      try { this.worker.postMessage({ cmd: 'stop' }); } catch { /* worker already exited */ }
      for (const pid of this.pids) killTree(pid);
      await new Promise(resolve => setTimeout(resolve, 500));
      for (const pid of this.pids) killTree(pid, 'SIGKILL');
      await this.worker.terminate();
      // Only remove the UUID directory created for this session, after TeX exits.
      const expected = path.join(this.root, '.texpro', 'realtime', this.id);
      try { if (this.buildDir === expected && inside(this.root, fs.realpathSync(expected))) fs.rmSync(expected, { recursive: true, force: true }); } catch { /* locked caches can be cleaned on a later launch */ }
    })();
    return this.stopping;
  }
}

async function runWorker() {
  const { Session } = await import('rtex-ts');
  const { Scene } = require('./realtime-scene.cjs');
  const root = fs.realpathSync(workerData.root), main = resolveProjectRoot(root);
  if (!main.rootFile) throw new Error(main.rootError);
  const documents = new Map();
  for (const doc of workerData.documents || []) {
    if (typeof doc.text !== 'string' || Buffer.byteLength(doc.text) > MAX_TEXT) throw new Error('Invalid realtime document');
    documents.set(safeFile(root, doc.path), doc.text);
  }
  const source = documents.get(main.rootFile) ?? fs.readFileSync(main.rootFile, 'utf8');
  if (detectEngine(source, workerData.engine) !== 'lualatex') throw new Error('Realtime preview requires LuaLaTeX');
  const lua = resolveTexBinary('lualatex');
  const fontRoots = [path.join(os.homedir(), 'Library', 'Fonts'), '/Library/Fonts', '/System/Library/Fonts', '/usr/share/fonts', '/usr/local/share/fonts', path.join(os.homedir(), '.fonts'), path.join(os.homedir(), '.local/share/fonts')];
  if (process.env.WINDIR) fontRoots.push(path.join(process.env.WINDIR, 'Fonts'));
  for (const variable of ['TEXMFROOT', 'TEXMFLOCAL', 'TEXMFHOME']) {
    try { fontRoots.push(execFileSync(resolveTexBinary('kpsewhich'), ['-var-value=' + variable], { encoding: 'utf8', timeout: 5000 }).trim()); } catch { /* absent roots force PDF rendering */ }
  }
  let build = root;
  for (const part of ['.texpro', 'realtime', workerData.sessionId]) {
    build = path.join(build, part); fs.mkdirSync(build, { recursive: true });
    if (!inside(root, fs.realpathSync(build))) throw new Error('Realtime build directory escapes project');
  }
  parentPort.postMessage({ buildDir: build });
  const scene = new Scene(root, [...fontRoots, build]);
  const session = await Session.open({ projectRoot: root, mainFile: path.relative(root, main.rootFile), buildDir: build, lualatex: lua });
  let stopped = false, revision = 0;
  const send = event => { if (!stopped) parentPort.postMessage(event); };
  const stop = () => { if (stopped) return; stopped = true; session.close(); clearInterval(processTimer); setTimeout(() => parentPort.close(), 400).unref(); };
  const fail = error => { send({ kind: 'error', error: String(error.message || error).slice(0, 2000) }); stop(); };
  // The supervisor can terminate owned processes if this worker exits unexpectedly.
  const processTimer = setInterval(() => {
    parentPort.postMessage({ processes: session.processIds() });
  }, 100);
  processTimer.unref();
  function update(docs) {
    if (resolveProjectRoot(root).rootFile !== main.rootFile) throw new Error('Project main file changed; restart realtime preview');
    if (!Array.isArray(docs) || docs.length > 100) throw new Error('Invalid realtime update');
    for (const doc of docs) {
      if (typeof doc.text !== 'string' || Buffer.byteLength(doc.text) > MAX_TEXT) throw new Error('Invalid realtime document');
      const file = safeFile(root, doc.path);
      if (file === main.rootFile && detectEngine(doc.text, workerData.engine) !== 'lualatex') throw new Error('Realtime preview requires LuaLaTeX');
      revision = Math.max(revision, session.setDocument(file, doc.text).source_revision);
    }
  }
  session.subscribe(event => {
    try {
      const versions = event.versions;
      if (versions && versions.source_revision < revision && event.event === 'ParagraphUpdate') return;
      if (event.event === 'LayoutUpdate' && event.compile.state !== 'Failed') {
        const pages = scene.layout(event), real = fs.realpathSync(event.pdf_path);
        if (!inside(fs.realpathSync(build), real) || fs.statSync(real).size > 64 * 1024 * 1024) throw new Error('Invalid layout PDF');
        send({ kind: 'layout', pages, pdf: new Uint8Array(fs.readFileSync(real)), total: event.pages_total, versions, state: event.convergence.state, partial: event.compile.state !== 'Ok' });
      } else if (event.event === 'ParagraphUpdate') {
        send({ kind: 'paragraph', pages: scene.paragraph(event), versions, state: event.pagination_stale || event.context_stale ? 'Stale' : 'Live' });
      } else if (event.event === 'EngineState') send({ kind: 'state', state: event.state, error: event.state === 'Failed' ? event.reason : undefined });
      else if (event.event === 'BackgroundScheduled') send({ kind: 'state', state: 'Background' });
      else if (event.event === 'Diagnostics') send({ kind: 'diagnostics', diagnostics: event.items });
    } catch (error) { fail(error); }
  });
  parentPort.on('message', message => {
    try { if (message.cmd === 'stop') stop(); else if (!stopped) { update(message.documents); parentPort.postMessage({ accepted: true }); } } catch (error) { fail(error); }
  });
  send({ kind: 'state', state: 'Starting' });
  try { update([...documents].map(([file, text]) => ({ path: file, text }))); parentPort.postMessage({ accepted: true }); } catch (error) { fail(error); }
}
if (!isMainThread) { void runWorker().catch(error => { parentPort.postMessage({ kind: 'error', error: error.message }); parentPort.close(); }); }
module.exports = { RealtimeHost, safeFile };
