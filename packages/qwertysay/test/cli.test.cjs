'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { readPackage } = require('@texpro/extension-sdk/package-tools');
const cli = path.resolve(__dirname, '../bin/qwertysay.cjs');
function fixture(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-sdk-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
function run(...args) { const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 10000 }); if (result.error) throw result.error; return result; }
test('standalone CLI creates, validates and packages JS plugins and CSS themes without Electron', t => {
  const root = fixture(t);
  for (const [type, suffix] of [['plugin','tpp'],['theme','tpt']]) {
    const directory = path.join(root, type), file = path.join(root, `example.${suffix}`);
    assert.equal(run('init', directory, '--id', `test.${type}`, '--type', type, '--language', 'js', '--author', 'Baolin Liu').status, 0);
    assert.equal(fs.existsSync(path.join(directory, 'node_modules')), false);
    assert.equal(run('check', directory).status, 1, 'Checking cannot implicitly build author code');
    if (type === 'plugin') fs.cpSync(path.join(__dirname, '../../extension-sdk'), path.join(directory, 'node_modules/@texpro/extension-sdk'), { recursive: true, filter: source => !source.split(path.sep).includes('node_modules') });
    assert.equal(run('build', directory).status, 0);
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
  const installed = path.join(directory, 'node_modules/@texpro/extension-sdk'); fs.mkdirSync(installed, { recursive: true });
  fs.cpSync(path.join(__dirname, '../../extension-sdk'), installed, { recursive: true, filter: source => !source.split(path.sep).includes('node_modules') });
  fs.symlinkSync(path.dirname(require.resolve('typescript/package.json')), path.join(directory, 'node_modules/typescript'), process.platform === 'win32' ? 'junction' : 'dir');
  fs.writeFileSync(path.join(directory, 'src/contracts.cts'), "import { authoringCapabilities, inspectPackage } from '@texpro/extension-sdk/package-tools';\nimport type { BridgeHostMessage } from '@texpro/extension-sdk';\nconst suffix: '.tpt' = authoringCapabilities().artifacts.theme;\nconst inspect: typeof inspectPackage = inspectPackage;\nconst message: BridgeHostMessage = { type: 'cancel', id: 1 };\nvoid [suffix, inspect, message];\n");
  const result = run('build', directory);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(fs.existsSync(path.join(directory, 'dist/package/index.cjs')));
  assert.equal(run('check', directory).status, 0);
});
test('staged packages exclude developer files, reject stale builds and preserve unrelated output', t => {
  const root = fixture(t), directory = path.join(root, 'theme');
  assert.equal(run('init', directory, '--id', 'test.staged', '--type', 'theme').status, 0);
  fs.writeFileSync(path.join(directory, 'build-helper.cjs'), "throw new Error('must never execute during check/pack')");
  assert.equal(run('build', directory).status, 0);
  const built = readPackage(path.join(directory, 'dist/package')); assert.equal(built.files.has('build-helper.cjs'), false); assert.equal(built.files.has('package.json'), false);
  fs.appendFileSync(path.join(directory, 'src/theme.css'), '\n.extensions-panel { color: #123456; }');
  assert.equal(run('check', directory).status, 1); assert.equal(run('pack', directory, path.join(root, 'stale.tpt')).status, 1);
  assert.equal(run('build', directory).status, 0); assert.equal(run('check', directory).status, 0);
  fs.writeFileSync(path.join(directory, 'src/theme.css'), '@import "https://example.invalid/evil.css";');
  assert.equal(run('build', directory).status, 1); assert.equal(run('check', directory).status, 1, 'Failed rebuild invalidates previous output');
  fs.writeFileSync(path.join(directory, 'src/theme.css'), '.extensions-panel { color: #123456; }');
  assert.equal(run('build', directory).status, 0, 'Failure can be recovered without deleting author files');
  const other = path.join(root, 'occupied'); assert.equal(run('init', other, '--type', 'theme').status, 0);
  fs.mkdirSync(path.join(other, 'dist/package'), { recursive: true }); fs.writeFileSync(path.join(other, 'dist/package/keep.txt'), 'original');
  assert.equal(run('build', other).status, 1); assert.equal(fs.readFileSync(path.join(other, 'dist/package/keep.txt'), 'utf8'), 'original');
});
test('scaffold refuses occupied destinations, invalid identities and unknown flags without changing files', t => {
  const root = fixture(t), directory = path.join(root, 'occupied'); fs.mkdirSync(directory); fs.writeFileSync(path.join(directory,'keep.txt'),'original');
  assert.equal(run('init', directory).status, 1); assert.equal(fs.readFileSync(path.join(directory,'keep.txt'),'utf8'),'original');
  for (const args of [['--id','../outside'],['--type','unknown'],['--unknown','value']]) {
    const output = path.join(root, 'invalid'); assert.equal(run('init', output, ...args).status, 1); assert.equal(fs.existsSync(output), false);
  }
});
