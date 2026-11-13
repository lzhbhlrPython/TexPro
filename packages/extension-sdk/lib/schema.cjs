'use strict';

// Public data contract. Keep this module free of Electron and filesystem APIs.
const API_VERSION = 1;
const CAPABILITIES = ['document.read', 'document.write', 'project.read', 'build.request', 'storage', 'network', 'theme.styles'];
const PROVIDERS = ['command', 'diagnostic', 'transform', 'completion', 'hover', 'preview', 'import', 'export', 'bibliography', 'asset', 'mcp'];
const BASES = ['paper', 'studio', 'night'];
const TOKEN_NAMES = ['bg', 'bg-deep', 'panel', 'panel-alt', 'panel-raised', 'paper', 'paper-deep', 'text', 'text-muted', 'text-faint', 'border', 'border-strong', 'accent', 'accent-strong', 'accent-soft', 'accent-contrast', 'selection', 'selection-match', 'search-match', 'editor-text', 'editor-heading', 'editor-strong', 'editor-gutter', 'syn-comment', 'syn-command', 'syn-operator', 'syn-punctuation', 'syn-number', 'syn-string', 'syn-math', 'link', 'link-soft', 'math-bg', 'math-hover', 'code-bg', 'code-border', 'todo-bg', 'chip', 'popover', 'popover-soft', 'pdf-bg', 'log-bg', 'log-text', 'success', 'success-soft', 'warning', 'warning-soft', 'danger', 'danger-soft', 'info'];
const ID = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;
const LOCAL_ID = /^[a-z][a-z0-9-]{0,63}$/;
function assert(ok, message) { if (!ok) throw new Error(message); }
function text(value, limit = 200) { return typeof value === 'string' && value.length > 0 && value.length <= limit; }
function label(value) { return text(value) || value && typeof value === 'object' && !Array.isArray(value) && text(value.en) && Object.values(value).every(item => text(item)); }
function relative(file) {
  assert(text(file, 240) && !/[\\:<>"|?*\x00-\x1f]/.test(file) && !file.startsWith('/') && !file.split('/').some(p => !p || p === '.' || p === '..' || /[. ]$/.test(p) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)), 'Invalid package path');
  return file;
}
function validateTheme(theme) {
  assert(theme && LOCAL_ID.test(theme.id) && label(theme.title) && BASES.includes(theme.base), 'Invalid theme');
  assert(theme.tokens && typeof theme.tokens === 'object' && !Array.isArray(theme.tokens), 'Invalid theme tokens');
  for (const [key, value] of Object.entries(theme.tokens)) {
    const font = ['font-ui', 'font-editor', 'font-mono'].includes(key) && typeof value === 'string' && /^[\p{L}\p{N} ,'"-]{1,200}$/u.test(value);
    const bounds = { 'editor-font-size': [12, 36], 'editor-width': [400, 1600], radius: [0, 24], 'space-unit': [2, 12] }[key];
    const metric = bounds && typeof value === 'string' && /^\d+(?:\.\d+)?px$/.test(value) && parseFloat(value) >= bounds[0] && parseFloat(value) <= bounds[1];
    assert(font || metric || TOKEN_NAMES.includes(key) && typeof value === 'string' && /^#[a-fA-F0-9]{6}(?:[a-fA-F0-9]{2})?$/.test(value), `Invalid theme token: ${key}`);
  }
  if (theme.stylesheet !== undefined) { relative(theme.stylesheet); assert(/\.css$/i.test(theme.stylesheet), 'Theme stylesheet must be CSS'); }
  return theme;
}
function validateManifest(input) {
  // Produce an owned plain object; never propagate prototype properties or unknown executable fields.
  const m = JSON.parse(JSON.stringify(input));
  assert(m && ID.test(m.id) && m.id.length <= 100 && label(m.name), 'Invalid extension identity');
  assert(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(m.version) && text(m.author) && text(m.license), 'Version, author and license are required');
  assert(m.apiVersion === API_VERSION, 'Incompatible extension API version');
  assert(Array.isArray(m.capabilities) && m.capabilities.every(v => CAPABILITIES.includes(v)), 'Unknown extension capability');
  if (m.entry) { relative(m.entry); assert(/\.(?:cjs|mjs)$/.test(m.entry), 'Executable entry must be .cjs or .mjs'); }
  assert(!m.scripts && !m.dependencies, 'Packages must be self contained; install scripts and dependency installation are unsupported');
  const c = m.contributes ||= {};
  for (const kind of ['actions', 'themes', 'completions', 'snippets', 'templates', 'panels', 'settings', 'locales']) {
    if (c[kind] === undefined) c[kind] = [];
    assert(Array.isArray(c[kind]) && c[kind].length <= 200, `Invalid contribution list: ${kind}`);
  }
  const localeIds = new Set();
  for (const locale of c.locales) {
    const { localeId, LOCALE_CATALOG_VERSION } = require('./locales.cjs');
    assert(locale?.catalogVersion === LOCALE_CATALOG_VERSION, 'Language catalogue version 2 required; migrate old phrase-key language packs');
    const id = localeId(locale?.id);
    assert(!localeIds.has(id) && text(locale.title, 100), 'Invalid or duplicate language');
    relative(locale.messages); assert(/\.json$/.test(locale.messages), 'Language messages must be JSON');
    locale.id = id; localeIds.add(id);
  }
  if (c.locales.length) assert(!m.entry && !m.capabilities.length && Object.entries(c).every(([key, value]) => key === 'locales' || !value.length), 'Language packs must contain only declarative languages, without code or capabilities');
  const ids = new Set();
  for (const action of c.actions) {
    assert(action && LOCAL_ID.test(action.id) && !ids.has(action.id) && PROVIDERS.includes(action.kind) && label(action.title), 'Invalid or duplicate action');
    ids.add(action.id);
    if (action.level !== undefined) assert(['L1', 'L2', 'L3'].includes(action.level), 'Invalid interaction level');
    assert(m.entry, 'Actions require executable entry');
  }
  const themeIds = new Set();
  for (const theme of c.themes) { validateTheme(theme); assert(!theme.stylesheet || m.capabilities.includes('theme.styles'), 'Stylesheets require theme.styles capability'); assert(!themeIds.has(theme.id), 'Duplicate theme'); themeIds.add(theme.id); }
  for (const value of [...c.completions, ...c.snippets]) assert(value && text(value.label) && text(value.template, 100000), 'Invalid completion or snippet');
  for (const template of c.templates) assert(template && LOCAL_ID.test(template.id) && label(template.title) && text(template.source, 1000000) && ['pdflatex', 'xelatex', 'lualatex'].includes(template.engine), 'Invalid project template');
  for (const panel of c.panels) {
    assert(panel && LOCAL_ID.test(panel.id) && label(panel.title) && ['L2', 'L3'].includes(panel.level) && Array.isArray(panel.actions) && panel.actions.every(id => ids.has(id)), 'Invalid tool contribution');
  }
  const keys = new Set();
  for (const setting of c.settings) {
    assert(setting && LOCAL_ID.test(setting.key) && !keys.has(setting.key) && label(setting.title) && ['string', 'boolean', 'number'].includes(setting.type) && typeof setting.default === setting.type, 'Invalid extension setting');
    keys.add(setting.key);
  }
  assert(Buffer.byteLength(JSON.stringify(m)) <= 2 * 1024 * 1024, 'Manifest too large');
  return m;
}
function validateConfig(manifest, config) {
  assert(config && typeof config === 'object' && !Array.isArray(config), 'Invalid extension configuration');
  const result = {};
  for (const setting of manifest.contributes.settings) {
    const value = config[setting.key] ?? setting.default;
    assert(typeof value === setting.type && (typeof value !== 'string' || value.length <= 10000) && (typeof value !== 'number' || Number.isFinite(value)), `Invalid setting: ${setting.key}`);
    result[setting.key] = value;
  }
  return result;
}
module.exports = { API_VERSION, CAPABILITIES, PROVIDERS, BASES, TOKEN_NAMES, validateManifest, validateTheme, validateConfig, relative };
