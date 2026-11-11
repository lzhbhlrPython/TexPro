'use strict';
const fs = require('node:fs');
const path = require('node:path');

function verifyContents(read, files) {
  const required = ['package.json', 'electron/main.cjs', 'electron/preload.cjs', 'electron/quit-watchdog.cjs', 'electron/window-close.cjs', 'mcp/server.mjs', 'electron/services/writing-aids-core.mjs', 'electron/services/tex-engine.mjs', 'electron/services/realtime-tex.cjs', 'electron/services/realtime-scene.cjs', 'THIRD_PARTY_NOTICES.md', 'dist/index.html', ...['tex', 'history', 'git', 'project-files', 'project-root', 'project-operations', 'font-report', 'music', 'writing-aids'].map((name) => `electron/services/${name}.cjs`)];
  for (const file of required) if (!files.has(file)) throw new Error(`Release is missing ${file}. Run npm run build before packaging.`);
  const html = read('dist/index.html').toString();
  const assets = [...html.matchAll(/(?:src|href)=["'](?:\.\/)?(assets\/[^"']+)["']/g)].map((match) => `dist/${match[1]}`);
  if (!assets.some((file) => file.endsWith('.js')) || !assets.some((file) => file.endsWith('.css'))) throw new Error('Renderer entry scripts/styles are missing.');
  for (const asset of assets) if (!files.has(asset)) throw new Error(`Release references a missing asset: ${asset}`);
  if (![...files].some((file) => /^dist\/assets\/pdf\.worker.*\.mjs$/.test(file))) throw new Error('Release is missing the PDF worker.');
  if ([...files].some((file) => /(?:^|\/)(?:\.ai-notes|superpowers)(?:\/|$)/.test(file))) throw new Error('Private working notes must not enter a release.');
  return { entryAssets: assets.length, files: files.size };
}

function verifyDirectory(root) {
  verifyExternalResources(root);
  verifyRealtimeResources(root);
  const files = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const relative = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(relative); else files.add(relative);
    }
  };
  for (const name of ['dist', 'electron', 'mcp']) if (fs.existsSync(path.join(root, name))) walk(name);
  for (const file of ['package.json', 'THIRD_PARTY_NOTICES.md']) if (fs.existsSync(path.join(root, file))) files.add(file);
  return verifyContents((file) => fs.readFileSync(path.join(root, file)), files);
}

function verifyArchive(archive) {
  const asar = require('@electron/asar');
  const files = new Set(asar.listPackage(archive).map((file) => file.replace(/^[/\\]+/, '').replaceAll('\\', '/')));
  return verifyContents((file) => asar.extractFile(archive, file), files);
}

function verifyExternalResources(root) {
  for (const file of ['mcp/server.mjs', 'electron/services/writing-aids-core.mjs', 'electron/services/tex-engine.mjs', ...['tex', 'history', 'git', 'project-files', 'project-root', 'project-operations', 'font-report', 'music', 'writing-aids'].map((name) => `electron/services/${name}.cjs`)]) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`Release is missing external MCP dependency: ${file}`);
  }
}

function verifyRealtimeResources(root) {
  const packageRoot = path.join(root, 'node_modules/rtex-ts');
  for (const file of ['package.json', 'dist/index.js', 'dist/session.js', 'dist/engine.js', 'dist/document.js', 'dist/process.js', 'dist/display-list.js', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'UPSTREAM.md', 'vendor/realtime-tex/LICENSE', 'vendor/realtime-tex/manifest.json']) {
    if (!fs.existsSync(path.join(packageRoot, file))) throw new Error(`Release is missing realtime dependency: rtex-ts/${file}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'vendor/realtime-tex/manifest.json'), 'utf8'));
  for (const [file, hash] of Object.entries(manifest.files)) {
    if (!(file === 'LICENSE' || /^tex\/[a-zA-Z0-9._/-]+$/.test(file)) || file.split('/').includes('..')) throw new Error('Invalid realtime support manifest');
    const source = path.join(packageRoot, 'vendor/realtime-tex', file);
    if (!fs.existsSync(source) || require('node:crypto').createHash('sha256').update(fs.readFileSync(source)).digest('hex') !== hash) throw new Error(`Realtime support file missing or modified: ${file}`);
  }
  for (const file of ['electron/services/realtime-tex.cjs', 'electron/services/realtime-scene.cjs', ...['fontkit', '@swc/helpers', 'brotli', 'base64-js', 'clone', 'dfa', 'fast-deep-equal', 'restructure', 'tiny-inflate', 'unicode-properties', 'unicode-trie', 'pako'].map(name => `node_modules/${name}/package.json`)]) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`Release is missing realtime dependency: ${file}`);
  }
}

function verifyPackagedApp(archive) {
  verifyExternalResources(archive + '.unpacked');
  verifyRealtimeResources(archive + '.unpacked');
  return verifyArchive(archive);
}

module.exports = { verifyContents, verifyDirectory, verifyArchive, verifyExternalResources, verifyRealtimeResources, verifyPackagedApp };
if (require.main === module) {
  try {
    const target = path.resolve(process.argv[2] || '.');
    console.log('[release] verified', target.endsWith('.asar') ? verifyPackagedApp(target) : verifyDirectory(target));
  } catch (error) { console.error('[release]', error.message); process.exitCode = 1; }
}
