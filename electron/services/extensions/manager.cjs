'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { readPackage, atomicJson } = require('./packages.cjs');
const { validateManifest, validateConfig } = require('./schema.cjs');
const { ExtensionProcess } = require('./process.cjs');
function inside(root, file) { return file === root || file.startsWith(root + path.sep); }
class ExtensionManager {
  constructor(directory, options = {}) {
    this.directory = directory; this.workers = new Map(); this.errors = new Map(); this.options = options;
    this.stateFile = path.join(directory, 'installed.json'); this.records = {};
    try { this.records = JSON.parse(fs.readFileSync(this.stateFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') this.errors.set('host', 'Extension installation state could not be read'); }
    for (const [id, record] of Object.entries(this.records)) {
      if (!record || !/^[0-9a-f-]{36}$/.test(record.folder || '') || !/^[a-z][a-z0-9.-]+$/.test(id)) { delete this.records[id]; continue; }
      try { const manifest = this.manifest(id); if (manifest.id !== id) throw new Error('Extension identity mismatch'); }
      catch (error) { this.errors.set(id, error.message); record.enabled = false; }
    }
  }
  folder(id) { const record = this.records[id]; if (!record) throw new Error('Extension is not installed'); return path.join(this.directory, record.folder); }
  manifest(id) { return validateManifest(JSON.parse(fs.readFileSync(path.join(this.folder(id), 'texpro.extension.json'), 'utf8'))); }
  save() { atomicJson(this.stateFile, this.records); }
  async start() {
    for (const [id, record] of Object.entries(this.records)) if (record.enabled) {
      try { await this.activate(id); } catch (error) { record.enabled = false; this.errors.set(id, error.message); }
    }
    this.save(); return this.list();
  }
  list() {
    return Object.entries(this.records).map(([id, record]) => {
      try { return { manifest: this.manifest(id), enabled: record.enabled && (!this.manifest(id).entry || this.workers.has(id)), digest: record.digest, config: record.config || {}, development: Boolean(record.source), error: this.errors.get(id) || null }; }
      catch (error) { return { manifest: { id, name: id, version: 'unknown', capabilities: [], contributes: {} }, enabled: false, error: error.message }; }
    });
  }
  inspect(source) { const { manifest, digest, development } = readPackage(source); return { manifest, digest, development }; }
  async install(source, expectedDigest) {
    const { files, manifest, digest, development } = readPackage(source);
    if (digest !== expectedDigest) throw new Error('Extension package changed; inspect it again');
    const folder = randomUUID(), destination = path.join(this.directory, folder);
    try {
      fs.mkdirSync(destination, { recursive: true });
      for (const [name, data] of files) { const file = path.join(destination, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data, { flag: 'wx' }); }
      // Updating never silently grants a changed executable new access. Enable after review.
      const previous = this.records[manifest.id];
      this.records[manifest.id] = { folder, digest, enabled: false, config: validateConfig(manifest, previous?.config || {}), ...(development ? { source: fs.realpathSync(source) } : {}), ...(previous ? { previous } : {}) };
      try { this.save(); } catch (error) { if (previous) this.records[manifest.id] = previous; else delete this.records[manifest.id]; throw error; }
      this.workers.get(manifest.id)?.stop(); this.workers.delete(manifest.id); this.errors.delete(manifest.id);
      // Retain the previous package for explicit rollback until the next successful enable.
      return this.list();
    } catch (error) { if (!Object.values(this.records).some(record => record.folder === folder)) fs.rmSync(destination, { recursive: true, force: true }); throw error; }
  }
  async activate(id) {
    const manifest = this.manifest(id), record = this.records[id];
    if (!manifest.entry) return;
    const worker = new ExtensionProcess(this.folder(id), manifest, validateConfig(manifest, record.config || {}), (name, args, context) => this.service(id, manifest, name, args, context), message => {
      this.errors.set(id, message); this.workers.delete(id); record.enabled = false;
      try { this.save(); } catch { /* error remains visible in session */ }
      this.options.changed?.();
    });
    try { await worker.ready; this.workers.set(id, worker); }
    catch (error) { worker.stop(); throw error; }
  }
  async enable(id, enabled, trusted = false) {
    const manifest = this.manifest(id), record = this.records[id];
    if (enabled && manifest.entry && !trusted) throw new Error('Executable extensions require explicit trust');
    this.workers.get(id)?.stop(); this.workers.delete(id); record.enabled = false;
    try {
      if (enabled) await this.activate(id);
      record.enabled = Boolean(enabled); this.errors.delete(id); this.save();
    } catch (error) { this.errors.set(id, error.message); this.save(); throw error; }
    return this.list();
  }
  async configure(id, config) {
    const record = this.records[id], manifest = this.manifest(id), next = validateConfig(manifest, config), previous = record.config;
    const enabled = record.enabled; this.workers.get(id)?.stop(); this.workers.delete(id); record.enabled = false; record.config = next;
    try { if (enabled) await this.activate(id); record.enabled = enabled; this.save(); }
    catch (error) { record.config = previous; this.errors.set(id, error.message); this.save(); throw error; }
    return this.list();
  }
  async rollback(id) {
    const current = this.records[id]; if (!current?.previous) throw new Error('No previous extension version');
    this.workers.get(id)?.stop(); this.workers.delete(id);
    this.records[id] = { ...current.previous, enabled: false }; this.save(); this.errors.delete(id); return this.list();
  }
  async reload(id) {
    const source = this.records[id]?.source; if (!source) throw new Error('Extension is not a development directory');
    const preview = this.inspect(source); if (preview.manifest.id !== id) throw new Error('Development extension identity changed');
    return this.install(source, preview.digest);
  }
  async remove(id) {
    this.manifest(id); const record = this.records[id]; delete this.records[id];
    try { this.save(); } catch (error) { this.records[id] = record; throw error; }
    this.workers.get(id)?.stop(); this.workers.delete(id); this.errors.delete(id);
    // Only remove validated UUID directories owned by this manager. Keep plugin data for reinstallation.
    for (let old = record; old; old = old.previous) if (/^[0-9a-f-]{36}$/.test(old.folder)) fs.rmSync(path.join(this.directory, old.folder), { recursive: true, force: true });
    return this.list();
  }
  async invoke(id, actionId, context, input) {
    const manifest = this.manifest(id), action = manifest.contributes.actions.find(value => value.id === actionId);
    if (!this.records[id].enabled || !action || !this.workers.has(id)) throw new Error('Extension action is unavailable');
    if (!context || typeof context.source !== 'string' || context.source.length > 2 * 1024 * 1024 || !context.selection || !Number.isInteger(context.selection.from) || !Number.isInteger(context.selection.to) || context.selection.from < 0 || context.selection.to < context.selection.from || context.selection.to > context.source.length) throw new Error('Invalid extension document snapshot');
    if (Buffer.byteLength(JSON.stringify(input ?? {})) > 1024 * 1024) throw new Error('Extension input too large');
    const snapshot = { invocation: randomUUID(), language: context.language === 'zh' ? 'zh' : 'en', selection: context.selection, project: context.project, file: context.file, source: context.source };
    if (!manifest.capabilities.includes('document.read')) { snapshot.source = ''; snapshot.selection = { from: 0, to: 0 }; snapshot.file = undefined; }
    if (!manifest.capabilities.includes('project.read')) snapshot.project = undefined;
    const result = await this.workers.get(id).invoke(actionId, snapshot, input);
    if (result.edits && !manifest.capabilities.includes('document.write')) throw new Error('Extension has no document.write capability');
    if (result.action && !manifest.capabilities.includes('build.request')) throw new Error('Extension has no build.request capability');
    return result;
  }
  async service(id, manifest, name, args, context) {
    if (name === 'storage.get' || name === 'storage.set') {
      if (!manifest.capabilities.includes('storage')) throw new Error('Storage capability is required');
      if (!args || !/^[a-zA-Z0-9._-]{1,100}$/.test(args.key)) throw new Error('Invalid storage key');
      const file = path.join(this.directory, 'data', id + '.json'); let data = {};
      try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (name === 'storage.get') return Object.hasOwn(data, args.key) ? data[args.key] : null;
      if (['__proto__', 'constructor', 'prototype'].includes(args.key)) throw new Error('Invalid storage key');
      data[args.key] = args.value; if (Buffer.byteLength(JSON.stringify(data)) > 1024 * 1024) throw new Error('Extension storage limit exceeded');
      atomicJson(file, data); return true;
    }
    if (!manifest.capabilities.includes('project.read') || !context.project) throw new Error('Project capability is required');
    const root = fs.realpathSync(context.project.root); this.options.assertRoot?.(root);
    if (name === 'project.readFile') {
      if (!args || typeof args.path !== 'string') throw new Error('Invalid project file');
      const file = fs.realpathSync(path.resolve(root, args.path));
      if (!inside(root, file) || !fs.statSync(file).isFile() || fs.statSync(file).size > 2 * 1024 * 1024 || !/\.(tex|bib|txt|md|csv|json|sty|cls|cwl)$/i.test(file)) throw new Error('Project file is unavailable');
      return fs.readFileSync(file, 'utf8');
    }
    if (name === 'project.symbols') return this.options.symbols?.(root);
    throw new Error('Unsupported extension service');
  }
  event(event, payload) {
    for (const [id, worker] of this.workers) {
      const granted = this.manifest(id).capabilities;
      worker.event(event, granted.includes('project.read') ? payload : { available: Boolean(payload) });
    }
  }
  stop() { for (const worker of this.workers.values()) worker.stop(); this.workers.clear(); }
}
module.exports = { ExtensionManager };
