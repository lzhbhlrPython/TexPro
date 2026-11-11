'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID, createHash } = require('node:crypto');
const { unpack, LIMIT } = require('./archive.cjs');
const { validateManifest, relative } = require('./schema.cjs');
function directoryFiles(directory) {
  const files = new Map(); let total = 0;
  const visit = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      const name = prefix + entry.name; relative(name);
      if (entry.isSymbolicLink()) throw new Error('Extension packages cannot contain symbolic links');
      if (entry.isDirectory()) visit(path.join(dir, entry.name), name + '/');
      else if (entry.isFile()) {
        const full = path.join(dir, entry.name), size = fs.statSync(full).size;
        if ((total += size) > LIMIT || files.size >= 300) throw new Error('Extension directory too large');
        files.set(name, fs.readFileSync(full));
      } else throw new Error('Unsupported extension file');
    }
  };
  visit(fs.realpathSync(directory), ''); return files;
}
function inspectFiles(files) {
  if (!files.has('texpro.extension.json') || !files.has('LICENSE')) throw new Error('Package requires texpro.extension.json and LICENSE');
  for (const name of files.keys()) {
    relative(name);
    if (/\.(?:node|exe|dll|dylib|so|bat|cmd|ps1|sh)$/i.test(name)) throw new Error('Native binaries and shell scripts are unsupported');
  }
  const manifest = validateManifest(JSON.parse(files.get('texpro.extension.json').toString('utf8')));
  if (manifest.entry && !files.has(manifest.entry)) throw new Error('Missing extension entry');
  const hash = createHash('sha256');
  for (const [name, data] of [...files].sort(([a], [b]) => a.localeCompare(b))) { hash.update(name); hash.update('\0'); hash.update(data); }
  return { manifest, digest: hash.digest('hex') };
}
function readPackage(source) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) throw new Error('Choose a regular extension package or directory');
  if (!stat.isDirectory() && (!stat.isFile() || stat.size > LIMIT)) throw new Error('Invalid extension package');
  const files = stat.isDirectory() ? directoryFiles(source) : unpack(fs.readFileSync(source));
  return { files, ...inspectFiles(files), development: stat.isDirectory() };
}
function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = file + '.' + randomUUID() + '.tmp';
  try { fs.writeFileSync(temp, JSON.stringify(value, null, 2)); fs.renameSync(temp, file); }
  finally { fs.rmSync(temp, { force: true }); }
}
module.exports = { readPackage, inspectFiles, directoryFiles, atomicJson };
