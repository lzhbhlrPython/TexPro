#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { readPackage, validatePackageType } = require('@gardenialiu/texpro-extension-sdk/package-tools');
const { pack } = require('@gardenialiu/texpro-extension-sdk/package-tools');
const { scaffold } = require('../lib/scaffold.cjs');
function main(args) {
  const [command, ...rest] = args;
  if (command === '--version') return console.log(require('../package.json').version);
  if (!command || ['--help', '-h', 'help'].includes(command)) return console.log('qwertysay init <directory> [--id author.name] [--author "Your name"] [--type plugin|theme] [--language ts|js]\nqwertysay check <directory|file.tpp|file.tpt>\nqwertysay pack <directory> <new-output.tpp|new-output.tpt>\nOffline tools: no automatic npm install, network request or code execution.');
  if (command === 'init') {
    if (!rest[0] || rest[0].startsWith('--')) throw new Error('Choose a destination directory');
    const options = {};
    for (let i = 1; i < rest.length; i += 2) { const key = rest[i].slice(2); if (!rest[i].startsWith('--') || !['id', 'author', 'type', 'language'].includes(key) || !rest[i + 1] || rest[i + 1].startsWith('--')) throw new Error('Invalid init option: ' + rest[i]); options[key] = rest[i + 1]; }
    const result = scaffold(rest[0], options); return console.log(`Created ${result.manifest.id} in ${result.destination}. See README.md for build and .${result.suffix} packaging steps.`);
  }
  if (!['check', 'pack'].includes(command) || rest.length !== (command === 'pack' ? 2 : 1)) throw new Error('Invalid command; run qwertysay --help');
  const source = path.resolve(rest[0]), { files, manifest, digest } = readPackage(source);
  if (command === 'pack') {
    const output = path.resolve(rest[1]), relative = path.relative(source, output);
    if (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) throw new Error('Choose an output outside the source directory');
    validatePackageType(manifest, output, files);
    fs.writeFileSync(output, pack(files), { flag: 'wx' });
  }
  console.log(`${manifest.id}@${manifest.version}: valid API ${manifest.apiVersion}, SHA-256 ${digest}`);
}
try { main(process.argv.slice(2)); } catch (error) { console.error(error.message); process.exitCode = 1; }
