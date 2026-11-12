'use strict';
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const { readPackage, relative, LIMIT } = require('@texpro/extension-sdk/package-tools');
const { writeScaffold } = require('./scaffold.cjs');
function parseSpec(spec) {
  const match = /^(?<name>(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*)(?:@(?<version>[a-zA-Z0-9][a-zA-Z0-9.+-]*))?$/.exec(spec);
  if (!match || spec.length > 250) throw new Error('Use a public npm package name with an optional exact version or tag');
  return { name: match.groups.name, version: match.groups.version || 'latest' };
}
function get(url, limit) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    if (target.protocol !== 'https:' || target.hostname !== 'registry.npmjs.org' || target.username || target.password || target.port) return reject(new Error('Only the public HTTPS npm registry is supported'));
    const request = https.get(target, { headers: { Accept: 'application/json' } }, response => {
      if (response.statusCode !== 200) { response.resume(); return reject(new Error(`npm registry returned ${response.statusCode}`)); }
      const chunks = []; let size = 0;
      response.on('data', chunk => { size += chunk.length; if (size > limit) response.destroy(new Error('Registry response exceeds size limit')); else chunks.push(chunk); });
      response.on('error', reject); response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    request.setTimeout(30000, () => request.destroy(new Error('Registry request timed out'))); request.on('error', reject);
  });
}
function tarFiles(gzip) {
  const bytes = zlib.gunzipSync(gzip, { maxOutputLength: LIMIT * 2 });
  const files = new Map(); let count = 0, offset = 0;
  const string = b => b.toString('utf8').replace(/\0.*$/s, '');
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512); offset += 512;
    if (header.every(byte => byte === 0)) break;
    if (++count > 500) throw new Error('Too many registry archive entries');
    const octal = string(header.subarray(124, 136)).trim();
    if (!/^[0-7]+$/.test(octal)) throw new Error('Unsupported tar size');
    const size = parseInt(octal, 8), type = header[156];
    const sumText = string(header.subarray(148, 156)).trim();
    const checksum = header.reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0);
    if (!/^[0-7]+$/.test(sumText) || parseInt(sumText, 8) !== checksum || size > LIMIT || offset + size > bytes.length) throw new Error('Invalid registry archive');
    const prefix = string(header.subarray(345, 500)), base = string(header.subarray(0, 100));
    const name = (prefix ? prefix + '/' : '') + base;
    if (![0, 48, 53].includes(type)) throw new Error('Links, extended headers and special registry archive entries are unsupported');
    const normalized = type === 53 ? name.replace(/\/$/, '') : name;
    relative(normalized);
    if (type === 53 && normalized === 'package') { if (size) throw new Error('Invalid directory'); continue; }
    if (!normalized.startsWith('package/')) throw new Error('Unexpected registry archive root');
    if (type !== 53) {
      const key = normalized.slice(8);
      if ([...files.keys()].some(name => name.toLowerCase() === key.toLowerCase())) throw new Error('Duplicate registry archive path');
      files.set(key, bytes.subarray(offset, offset + size));
    }
    offset += Math.ceil(size / 512) * 512;
  }
  if (!files.has('package.json')) throw new Error('Missing registry package metadata');
  return files;
}
function registryArtifact(bytes, metadata) {
  const integrity = metadata.dist?.integrity;
  if (typeof integrity !== 'string' || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(integrity)) throw new Error('Registry SHA-512 integrity is required');
  const expected = Buffer.from(integrity.slice(7), 'base64'), actual = crypto.createHash('sha512').update(bytes).digest();
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new Error('Registry tarball integrity mismatch');
  const files = tarFiles(bytes), pkg = JSON.parse(files.get('package.json'));
  if (pkg.name !== metadata.name || pkg.version !== metadata.version) throw new Error('Registry package identity mismatch');
  const artifact = pkg.texpro?.package;
  relative(artifact);
  if (!/\.(?:tpp|tpt)$/.test(artifact) || !files.has(artifact) || [...files.keys()].filter(name => /\.(?:tpp|tpt)$/i.test(name)).length !== 1) throw new Error('Declare exactly one .tpp or .tpt artifact in package.json texpro.package');
  return { artifact, bytes: files.get(artifact), name: pkg.name, version: pkg.version };
}
async function downloadExtension(spec, output, { fetch = get } = {}) {
  const { name, version } = parseSpec(spec);
  const metadata = JSON.parse(await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`, 4 * 1024 * 1024));
  if (metadata.name !== name || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(metadata.version)) throw new Error('Invalid registry metadata');
  const result = registryArtifact(await fetch(metadata.dist?.tarball, LIMIT), metadata);
  const destination = path.resolve(output);
  if (path.extname(destination) !== path.extname(result.artifact)) throw new Error('Output suffix must match the declared .tpp or .tpt artifact');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  // Exclusive creation also refuses existing symbolic links. Validate before returning a reviewable file.
  fs.writeFileSync(destination, result.bytes, { flag: 'wx' });
  try { const info = readPackage(destination); return { ...result, bytes: undefined, destination, manifest: info.manifest, digest: info.digest }; }
  catch (error) { fs.rmSync(destination); throw error; }
}
function wrapperPackage(source, destination, name) {
  parseSpec(name); if (parseSpec(name).name !== name) throw new Error('Choose a package name without a version');
  const info = readPackage(source); if (info.development) throw new Error('Pack the .tpp or .tpt first');
  const artifact = path.basename(source), pkg = { name, version: info.manifest.version, description: 'TeXPro extension package', license: info.manifest.license, author: info.manifest.author, files: [artifact, 'LICENSE'], texpro: { package: artifact }, publishConfig: { access: 'public' } };
  return writeScaffold(destination, new Map([['package.json', JSON.stringify(pkg, null, 2) + '\n'], [artifact, fs.readFileSync(source)], ['LICENSE', info.files.get('LICENSE')]]));
}
function openForReview(file, { platform = process.platform, execFile = require('node:child_process').execFile } = {}) {
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'explorer.exe' : 'xdg-open';
  const args = platform === 'darwin' ? ['-a', 'TeXPro', file] : [file];
  return new Promise((resolve, reject) => execFile(command, args, { timeout: 15000 }, error => error ? reject(error) : resolve()));
}
function openSyncReview(file, { platform = process.platform, executable = process.env.TEXPRO_APP_PATH, execFile = require('node:child_process').execFile, spawn = require('node:child_process').spawn } = {}) {
  const failure = error => new Error(`Could not open TeXPro. Run TeXPro --extension-sync "${file}" or set TEXPRO_APP_PATH. ${error.message}`);
  if (!executable && platform === 'darwin') {
    // A new launch forwards argv to the existing Electron single-instance owner.
    return new Promise((resolve, reject) => execFile('open', ['-n', '-a', 'TeXPro', '--args', '--extension-sync=' + file], { timeout: 15000 }, error => error ? reject(failure(error)) : resolve()));
  }
  const command = executable || (platform === 'win32' ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'TeXPro', 'TeXPro.exe') : 'texpro');
  // The desktop process outlives the CLI. Never wait for it or attach a kill timeout.
  return new Promise((resolve, reject) => {
    let child;
    try { child = spawn(command, ['--extension-sync=' + file], { detached: true, stdio: 'ignore' }); }
    catch (error) { reject(failure(error)); return; }
    child.once('error', error => reject(failure(error)));
    child.once('spawn', () => { child.unref(); resolve(); });
  });
}
module.exports = { openSyncReview, parseSpec, tarFiles, registryArtifact, downloadExtension, wrapperPackage, openForReview };
