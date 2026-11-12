'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { readPackage, atomicJson } = require('./packages.cjs');
const { validateManifest, validateConfig } = require('./schema.cjs');
const { localeContributions } = require('../../../packages/extension-sdk/lib/locales.cjs');
const { ExtensionProcess } = require('./process.cjs');
function inside(root, file) { return file === root || file.startsWith(root + path.sep); }
class ExtensionManager {
  constructor(directory, options = {}) {
    this.directory = directory; this.workers = new Map(); this.errors = new Map(); this.options = options; this.projectEpoch = 0;
    this.stateFile = path.join(directory, 'installed.json'); this.records = {};
    try { this.records = JSON.parse(fs.readFileSync(this.stateFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') this.errors.set('host', 'Extension installation state could not be read'); }
    // Preinstalled data is versioned with the app, while enable/disable remains user-owned.
    this.builtins = new Map();
    for (const source of options.builtinSources || []) {
      let info; try { info = readPackage(source); } catch (error) { this.errors.set('host', error.message); continue; }
      this.builtins.set(info.manifest.id, { ...info, source });
      if (!this.records[info.manifest.id]) this.records[info.manifest.id] = { builtin: true, enabled: true, digest: info.digest };
    }
    for (const [id, record] of Object.entries(this.records)) {
      if (record?.builtin && this.builtins.has(id)) { record.digest = this.builtins.get(id).digest; continue; }
      if (!record || !/^[0-9a-f-]{36}$/.test(record.folder || '') || !/^[a-z][a-z0-9.-]+$/.test(id)) { delete this.records[id]; continue; }
      try { const manifest = this.manifest(id); if (manifest.id !== id) throw new Error('Extension identity mismatch'); }
      catch (error) { this.errors.set(id, error.message); record.enabled = false; }
    }
  }
  folder(id) { if (this.records[id]?.builtin && this.builtins.has(id)) return this.builtins.get(id).source; const record = this.records[id]; if (!record) throw new Error('Extension is not installed'); return path.join(this.directory, record.folder); }
  manifest(id) { return validateManifest(JSON.parse(fs.readFileSync(path.join(this.folder(id), 'texpro.extension.json'), 'utf8'))); }
  save() { atomicJson(this.stateFile, this.records); }
  async start() {
    if (this.options.safeMode) return this.disableAll();
    for (const [id, record] of Object.entries(this.records)) if (record.enabled) {
      try { await this.activate(id); } catch (error) { record.enabled = false; this.errors.set(id, error.message); }
    }
    this.save(); return this.list();
  }
  list() {
    return Object.entries(this.records).map(([id, record]) => {
      try { const manifest = this.manifest(id); return { manifest, builtin: Boolean(record.builtin), origin: record.origin, locales: record.enabled ? localeContributions(manifest, readPackage(this.folder(id)).files) : [], themeStyles: require('./theme.cjs').themeStyles(manifest, readPackage(this.folder(id)).files), enabled: record.enabled && (!manifest.entry || this.workers.has(id)), digest: record.digest, config: record.config || {}, development: Boolean(record.source), canRollback: Boolean(record.previous), error: this.errors.get(id) || null }; }
      catch (error) { return { manifest: { id, name: id, version: 'unknown', capabilities: [], contributes: {} }, enabled: false, error: error.message }; }
    });
  }
  languages() {
    const found = new Map();
    for (const item of this.list()) if (item.enabled && !item.error) for (const locale of item.locales || []) {
      if (!found.has(locale.id)) found.set(locale.id, { ...locale, extensionId: item.manifest.id });
    }
    return [...found.values()];
  }
  inspect(source) { const { manifest, digest, development } = readPackage(source); return { manifest, digest, development }; }
  async install(source, expectedDigest, origin) {
    const { files, manifest, digest, development } = readPackage(source);
    if (digest !== expectedDigest) throw new Error('Extension package changed; inspect it again');
    if (this.builtins.has(manifest.id) && (!manifest.contributes.locales.length || manifest.contributes.locales.some(locale => !this.builtins.get(manifest.id).manifest.contributes.locales.some(value => value.id === locale.id)))) throw new Error('Preinstalled identity is reserved for its declarative language');
    const folder = randomUUID(), destination = path.join(this.directory, folder);
    try {
      fs.mkdirSync(destination, { recursive: true });
      for (const [name, data] of files) { const file = path.join(destination, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data, { flag: 'wx' }); }
      // Updating never silently grants a changed executable new access. Enable after review.
      const previous = this.records[manifest.id];
      this.records[manifest.id] = { folder, digest, enabled: false, ...(origin ? { origin } : {}), config: validateConfig(manifest, previous?.config || {}), ...(development ? { source: fs.realpathSync(source) } : {}), ...(previous ? { previous } : {}) };
      try { this.save(); } catch (error) { if (previous) this.records[manifest.id] = previous; else delete this.records[manifest.id]; throw error; }
      this.workers.get(manifest.id)?.stop(); this.workers.delete(manifest.id); this.errors.delete(manifest.id);
      // Retain the previous package for explicit rollback until the next successful enable.
      return this.list();
    } catch (error) { if (!Object.values(this.records).some(record => record.folder === folder)) fs.rmSync(destination, { recursive: true, force: true }); throw error; }
  }
  async activate(id) {
    const manifest = this.manifest(id), record = this.records[id];
    readPackage(this.folder(id));
    for (const locale of manifest.contributes.locales) for (const [otherId, other] of Object.entries(this.records)) if (otherId !== id && other.enabled && this.manifest(otherId).contributes.locales.some(value => value.id === locale.id)) throw new Error('Language already provided by another enabled package: ' + locale.id);
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
    if (enabled && (manifest.entry || manifest.capabilities.includes('theme.styles')) && !trusted) throw new Error('Executable extensions and custom styles require explicit trust');
    if (enabled) readPackage(this.folder(id));
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
    this.manifest(id); if (this.records[id]?.builtin) throw new Error('Preinstalled packages can be disabled, not removed'); const record = this.records[id]; delete this.records[id];
    if (this.builtins.has(id)) this.records[id] = { builtin: true, enabled: false, digest: this.builtins.get(id).digest };
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
    const snapshot = { invocation: randomUUID(), projectEpoch: this.projectEpoch, language: typeof context.language === 'string' ? context.language.slice(0, 64) : 'en', selection: context.selection, project: context.project, file: context.file, source: context.source };
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
    if (context.projectEpoch !== this.projectEpoch) throw new Error('Project context has expired');
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
    if (event === 'projectChanged') this.projectEpoch++;
    for (const [id, worker] of this.workers) {
      const granted = this.manifest(id).capabilities;
      worker.event(event, granted.includes('project.read') ? payload : { available: Boolean(payload) });
    }
  }
  stop() { for (const worker of this.workers.values()) worker.stop(); this.workers.clear(); }
  disableAll() {
    this.stop(); for (const record of Object.values(this.records)) record.enabled = false;
    this.save(); this.options.changed?.(); return this.list();
  }
}
module.exports = { ExtensionManager };
