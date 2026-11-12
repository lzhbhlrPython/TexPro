'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { readPackage } = require('@gardenialiu/texpro-extension-sdk/package-tools');
const cli = path.resolve(__dirname, '../bin/qwertysay.cjs');
function fixture(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-sdk-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
function run(...args) { const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 10000 }); if (result.error) throw result.error; return result; }
test('standalone CLI creates, validates and packages JS plugins and CSS themes without Electron', t => {
  const root = fixture(t);
  for (const [type, suffix] of [['plugin','tpp'],['theme','tpt']]) {
    const directory = path.join(root, type), file = path.join(root, `example.${suffix}`);
    assert.equal(run('init', directory, '--id', `test.${type}`, '--type', type, '--language', 'js', '--author', 'Baolin Liu').status, 0);
    assert.equal(fs.existsSync(path.join(directory, 'node_modules')), false);
    assert.equal(run('check', directory).status, 0);
    assert.equal(run('pack', directory, file).status, 0);
    const result = readPackage(file); assert.equal(result.manifest.id, `test.${type}`);
    assert.equal(run('pack', directory, file).status, 1); // Never silently replace a shared package.
    if (type === 'theme') assert.equal(result.manifest.entry, undefined);
    else assert.equal(run('pack', directory, path.join(root, 'disguised.tpt')).status, 1);
  }
});
test('TypeScript scaffold compiles against the public SDK and includes its actual executable', t => {
  const root = fixture(t), directory = path.join(root, 'typed');
  assert.equal(run('init', directory, '--id', 'test.typed').status, 0);
  const installed = path.join(directory, 'node_modules/@gardenialiu/texpro-extension-sdk'); fs.mkdirSync(installed, { recursive: true });
  for (const name of ['index.d.ts','index.cjs','package.json']) fs.copyFileSync(path.join(__dirname, '../../extension-sdk', name), path.join(installed, name));
  const result = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', path.join(directory, 'tsconfig.json')], { encoding: 'utf8', timeout: 15000 });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(fs.existsSync(path.join(directory, 'dist/index.cjs')));
  assert.equal(run('check', directory).status, 0);
});
test('scaffold refuses occupied destinations, invalid identities and unknown flags without changing files', t => {
  const root = fixture(t), directory = path.join(root, 'occupied'); fs.mkdirSync(directory); fs.writeFileSync(path.join(directory,'keep.txt'),'original');
  assert.equal(run('init', directory).status, 1); assert.equal(fs.readFileSync(path.join(directory,'keep.txt'),'utf8'),'original');
  for (const args of [['--id','../outside'],['--type','unknown'],['--unknown','value']]) {
    const output = path.join(root, 'invalid'); assert.equal(run('init', output, ...args).status, 1); assert.equal(fs.existsSync(output), false);
  }
});
