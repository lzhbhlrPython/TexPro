'use strict';
/** Immutable project snapshots for native editor projections. Never writes author files. */
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { randomUUID, createHash } = require('node:crypto');
const { resolveProjectRoot, readConfig } = require('./project-root.cjs');
const { createSyncTexService, parseForwardResults } = require('./synctex.cjs');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const run = promisify(execFile);
const MAX_BYTES = 512 * 1024 * 1024, MAX_FILES = 12000, MAX_SOURCE = 8 * 1024 * 1024;
function relative(root, file) {
  if (typeof file !== 'string' || !path.isAbsolute(file)) throw new Error('Invalid writing source path');
  const value = path.relative(root, file);
  if (!value || value === '..' || value.startsWith('..' + path.sep) || path.isAbsolute(value)) throw new Error('Writing source is outside the project');
  return value;
}
function cancelled() { throw new Error('Writing snapshot superseded'); }

function createNativeWritingService(tex) {
  const sessions = new Map();
  const sync = createSyncTexService({ resolveBinary: tex.resolveTexBinary, environment: () => ({ ...process.env, PATH: path.dirname(tex.resolveTexBinary('synctex')) + path.delimiter + (process.env.PATH || '') }) });
  async function dispose(record) { if (record) await fs.rm(record.folder, { recursive: true, force: true }); }
  async function stop(id) {
    const session = sessions.get(id); if (!session) return;
    sessions.delete(id); session.closed = true; session.sequence++;
    if (session.runId) tex.cancelCompilation(session.runId);
    await session.tail.catch(() => {});
    await Promise.all(session.records.map(dispose));
  }
  async function snapshot(session, input, sequence) {
    const root = path.resolve(input.root), realRoot = await fs.realpath(root);
    const project = resolveProjectRoot(root);
    if (!project.rootFile) throw new Error(project.rootError);
    let record, fresh = false;
    try {
      const check = () => { if (session.closed || sequence !== session.sequence) cancelled(); };
      const mainRelative = relative(root, project.rootFile);
      const config = readConfig(root), files = [], overlays = [];
      const hash = createHash('sha256').update(JSON.stringify([input.engine, mainRelative, config]));
      const buildRelative = path.relative(root, path.resolve(root, config.directories?.build || '.texpro/build'));
      let count = 0, bytes = 0;
      const visit = async (directory, rel = '', ancestry = new Set()) => {
        check();
        const real = await fs.realpath(directory);
        if (real !== realRoot) relative(realRoot, real);
        if (ancestry.has(real)) throw new Error('Cyclic project symlink');
        const nextAncestry = new Set(ancestry).add(real);
        for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
          check();
          if (['.git', '.texpro', 'node_modules', '.DS_Store'].includes(entry.name)) continue;
          const name = path.join(rel, entry.name), source = path.join(directory, entry.name);
          if (name === buildRelative) continue;
          const resolved = await fs.realpath(source); relative(realRoot, resolved);
          const stat = await fs.stat(source);
          if (stat.isDirectory()) { await visit(source, name, nextAncestry); continue; }
          if (!stat.isFile()) continue;
          if (/\.(aux|log|fls|fdb_latexmk|synctex(?:\.gz)?|xdv|dvi|toc|out|nav|snm|vrb)$/i.test(name) || name === mainRelative.replace(/\.(tex|ltx)$/i, '.pdf')) continue;
          if (++count > MAX_FILES || (bytes += stat.size) > MAX_BYTES) throw new Error('Writing snapshot exceeds project size limit');
          files.push({ source: resolved, name });
          hash.update(JSON.stringify([name, stat.size, stat.mtimeMs, stat.ctimeMs]));
        }
      };
      await visit(root);
      const seen = new Set(); let sourceBytes = 0;
      for (const document of input.documents) {
        check();
        if (!document || typeof document.content !== 'string' || !/\.(tex|ltx|sty|cls|bib)$/i.test(document.path)) throw new Error('Invalid writing buffer');
        const name = relative(root, document.path), real = await fs.realpath(document.path); relative(realRoot, real);
        if (seen.has(name) || (sourceBytes += Buffer.byteLength(document.content)) > MAX_SOURCE) throw new Error('Invalid or oversized writing buffers');
        seen.add(name);
        const disk = await fs.readFile(real, 'utf8');
        if (disk !== document.content) overlays.push({ name, content: document.content });
      }
      for (const overlay of overlays.sort((a, b) => a.name.localeCompare(b.name))) hash.update(JSON.stringify(overlay));
      const key = hash.digest('hex');
      record = session.records.find(item => item.key === key);
      if (!record) {
        const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'texpro-writing-'));
        record = { folder, key, revision: randomUUID(), pdf: null }; fresh = true;
        for (const file of files) {
          check(); const destination = path.join(folder, file.name);
          await fs.mkdir(path.dirname(destination), { recursive: true }); await fs.copyFile(file.source, destination);
        }
        for (const overlay of overlays) { check(); await fs.writeFile(path.join(folder, overlay.name), overlay.content); }
        await fs.mkdir(path.join(folder, '.texpro'), { recursive: true });
        await fs.writeFile(path.join(folder, '.texpro/project.json'), JSON.stringify({ ...config, rootFile: mainRelative, directories: { ...config.directories, build: '.texpro/build' } }));
        check(); session.runId = `writing-${record.revision}`;
        const compiled = await tex.runCompile({ projectRoot: folder, engine: input.engine, runId: session.runId, isolated: true, timeoutMs: 90000 });
        check();
        if (!compiled.ok || !compiled.pdfPath) throw new Error(compiled.error || compiled.diagnostics?.find(item => item.severity === 'error')?.message || 'Native writing compilation failed');
        record.pdf = compiled.pdfPath;
        const stat = await fs.stat(record.pdf);
        if (stat.size > 150 * 1024 * 1024) throw new Error('Writing PDF exceeds size limit');
      }
      const folder = record.folder;
      const sources = Object.create(null);
      sources[input.file] = await fs.readFile(path.join(folder, relative(root, input.file)), 'utf8');
      const activeSource = sources[input.file];
      const regions = []; let incomplete = false, queries = 0;
      const mappingDeadline = Date.now() + 30000;
      for (const region of input.regions) {
        check();
        const target = region.file || input.file, fileRelative = relative(root, target);
        const source = sources[target] ??= await fs.readFile(path.join(folder, fileRelative), 'utf8');
        if (!Number.isInteger(region.from) || !Number.isInteger(region.to) || region.from < 0 || region.to <= region.from || region.to > source.length) throw new Error('Invalid native projection range');
        const first = source.slice(0, region.from).split('\n').length, last = source.slice(0, region.to).split('\n').length;
        // Sample source lines, including both ends. SyncTeX may return several boxes per macro call.
        // Every source line matters: sparse sampling could silently omit figures.
        // Oversized blocks remain source; complete PDF pages stay in the formal preview.
        if (last - first > 240 || Date.now() > mappingDeadline || queries > 1024) { incomplete = true; continue; }
        const samples = last - first + 1, boxes = [];
        let complete = true;
        for (let index = 0; index < samples; index++) {
          if (Date.now() > mappingDeadline || ++queries > 1024) { complete = false; break; }
          check();
          const line = first + Math.round(index * (last - first) / Math.max(1, samples - 1));
          const stdout = (await run(tex.resolveTexBinary('synctex'), ['view', '-i', `${line}:0:${path.join(folder, fileRelative)}`, '-o', record.pdf], { cwd: folder, timeout: 12000, maxBuffer: 2 * 1024 * 1024 })).stdout;
          for (const hit of parseForwardResults(stdout)) {
            if (Date.now() > mappingDeadline || ++queries > 1024) { complete = false; break; }
            if (!hit.bounds) continue;
            const b = hit.bounds;
            const inverse = await sync.synctexInverse({ projectRoot: folder, pdfFile: record.pdf, page: hit.page, x: b.x + Math.min(b.width / 2, 20), y: b.y + b.height / 2 });
            check();
            if (inverse.ok && path.relative(folder, inverse.file) === fileRelative && inverse.line >= first && inverse.line <= last) boxes.push({ page: hit.page, ...b });
          }
        }
        if (!complete) { incomplete = true; continue; }
        const fragments = [];
        for (const box of boxes.sort((a, b) => a.page - b.page || a.y - b.y)) {
          const previous = fragments.at(-1);
          // Keep distinct columns and disconnected regions separate, rather than cropping unrelated text.
          if (previous && previous.page === box.page) {
            const right = Math.max(previous.x + previous.width, box.x + box.width), bottom = Math.max(previous.y + previous.height, box.y + box.height);
            previous.x = Math.min(previous.x, box.x); previous.y = Math.min(previous.y, box.y);
            previous.width = right - previous.x; previous.height = bottom - previous.y;
          } else fragments.push({ ...box });
        }
        if (!fragments.length) incomplete = true;
        if (fragments.length) regions.push({ ...region, fragments: fragments.map(b => ({ ...b, x: Math.max(0, b.x - 2), y: Math.max(0, b.y - 2), width: b.width + 4, height: b.height + 4 })) });
      }
      check();
      // A snapshot's source map must outlive its PDF. Read only when inverse mapping asks for a file.
      record.root = root;
      const pdf = new Uint8Array(await fs.readFile(record.pdf)); check();
      session.records = session.records.filter(item => item !== record);
      session.records.push(record);
      while (session.records.length > 2) await dispose(session.records.shift());
      return { revision: record.revision, pdf, regions, source: activeSource, sources, incomplete };
    } catch (error) { if (fresh) await dispose(record); throw error; }
    finally { session.runId = null; }
  }
  return {
    async render(input) {
      if (!input || !/^[a-zA-Z0-9-]{1,80}$/.test(input.session) || !['pdflatex', 'xelatex', 'lualatex'].includes(input.engine) || !Array.isArray(input.documents) || input.documents.length > 256 || !Array.isArray(input.regions) || input.regions.length > 64) throw new Error('Invalid native writing request');
      let session = sessions.get(input.session);
      if (session && session.root !== input.root) throw new Error('Writing session belongs to another project');
      if (!session) { session = { root: input.root, sequence: 0, tail: Promise.resolve(), records: [], closed: false }; sessions.set(input.session, session); }
      const sequence = ++session.sequence;
      if (session.runId) tex.cancelCompilation(session.runId);
      const task = session.tail.catch(() => {}).then(() => { if (session.closed || sequence !== session.sequence) cancelled(); return snapshot(session, input, sequence); });
      session.tail = task; return task;
    },
    async inverse(id, revision, point) {
      const session = sessions.get(id), record = session?.records.find(item => item.revision === revision);
      if (!record || !point || !Number.isInteger(point.page) || point.page < 1 || !Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error('Writing snapshot is no longer available');
      const hit = await sync.synctexInverse({ projectRoot: record.folder, pdfFile: record.pdf, ...point });
      if (!hit.ok) throw new Error(hit.error);
      const name = relative(record.folder, hit.file), file = path.join(record.root, name);
      const source = await fs.readFile(hit.file, 'utf8');
      return { file, line: hit.line, column: hit.column, source };
    },
    stop,
    async close() { await Promise.all([...sessions.keys()].map(stop)); },
  };
}
module.exports = { createNativeWritingService };
