'use strict';
// Data-only resolution shared by the CLI, host and MCP. Never imports an npm entry.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { directoryFiles, readPackage, inspectFiles, packageKind, validatePackageType } = require('./packages.cjs');
const { relative, validateManifest } = require('./schema.cjs');
const SKIP = new Set(['node_modules', 'dist', 'output', 'target', 'elm-stuff', 'lib']);
function buildSourceFiles(directory) {
  return directoryFiles(directory, name => SKIP.has(name) || name.endsWith('.res.js'));
}
function hashFiles(files) {
  const hash = crypto.createHash('sha256');
  for (const [name, data] of [...files].sort(([a], [b]) => a.localeCompare(b))) { hash.update(JSON.stringify([name, data.length])); hash.update(data); }
  return hash.digest('hex');
}
function sourceFingerprint(directory) {
  // Spago may materialize this lock during compilation; npm source identity still includes it.
  return hashFiles(new Map([...buildSourceFiles(directory)].filter(([name]) => path.posix.basename(name) !== 'spago.lock')));
}
function contained(root, name, allowRoot = false) {
  if (!(allowRoot && name === '.')) relative(name);
  const parts = name === '.' ? [] : name.split('/');
  let cursor = root;
  for (const part of parts) {
    cursor = path.join(cursor, part);
    if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error('npm extension paths cannot contain symbolic links');
  }
  const actual = fs.realpathSync(cursor);
  if (actual !== root && !actual.startsWith(root + path.sep)) throw new Error('npm extension source escapes its package');
  return actual;
}
function npmSource(directory) {
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('Choose a regular npm extension directory');
  const root = fs.realpathSync(directory);
  const metadataStat = fs.lstatSync(path.join(root, 'package.json'));
  if (metadataStat.isSymbolicLink() || !metadataStat.isFile() || metadataStat.size > 1024 * 1024) throw new Error('npm metadata must be a bounded regular file, never a symbolic link');
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (typeof metadata.name !== 'string' || !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(metadata.name) || typeof metadata.version !== 'string' || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(metadata.version)) throw new Error('Invalid npm extension identity');
  if (metadata.texpro?.package !== undefined) {
    if (metadata.texpro.source !== undefined) throw new Error('Declare texpro.package or texpro.source, not both');
    return { root, metadata, source: contained(root, metadata.texpro.package), mode: 'archive' };
  }
  const source = contained(root, metadata.texpro?.source ?? '.', true);
  if (!fs.statSync(source).isDirectory()) throw new Error('texpro.source must name a directory');
  const needsBuild = fs.existsSync(path.join(source, 'qwertysay.build.json'));
  const files = needsBuild ? buildSourceFiles(source) : directoryFiles(source);
  if (!files.has('texpro.extension.json') || !files.has('LICENSE')) throw new Error('npm source requires texpro.extension.json and LICENSE');
  const manifest = validateManifest(JSON.parse(files.get('texpro.extension.json')));
  const sourceDigest = crypto.createHash('sha256').update(JSON.stringify(metadata)).update('\0').update(hashFiles(files)).digest('hex');
  return { root, metadata, source, files, manifest, sourceDigest, mode: needsBuild ? 'build' : 'source' };
}
function preparedPath(value) { return path.join(value.root, '.texpro-prepared', value.sourceDigest + (packageKind(value.manifest) === 'theme' ? '.tpt' : '.tpp')); }
function readNpmExtension(directory) {
  const value = npmSource(directory);
  if (value.mode === 'archive') return { ...value, ...readPackage(value.source) };
  if (value.mode === 'build') {
    const file = preparedPath(value);
    if (!fs.existsSync(file)) throw new Error('Source requires an explicit trusted build. Run qwertysay, choose Prepare installed source, then sync again: ' + value.metadata.name);
    const source = contained(value.root, path.relative(value.root, file).split(path.sep).join('/'));
    const info = readPackage(source);
    if (info.manifest.id !== value.manifest.id || info.manifest.version !== value.manifest.version) throw new Error('Prepared source identity changed');
    return { ...value, ...info, source };
  }
  // Direct JS must be self-contained; node_modules is deliberately not copied into the host.
  const info = inspectFiles(value.files);
  validatePackageType(info.manifest, packageKind(info.manifest) === 'theme' ? 'source.tpt' : 'source.tpp', value.files);
  return { ...value, ...info, development: true };
}
module.exports = { buildSourceFiles, sourceFingerprint, npmSource, preparedPath, readNpmExtension };
