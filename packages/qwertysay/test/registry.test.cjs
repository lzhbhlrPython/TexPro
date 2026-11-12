'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { pack } = require('@texpro/extension-sdk/package-tools');
const { parseSpec, registryArtifact, downloadExtension, wrapperPackage, openForReview, openSyncReview } = require('../lib/registry.cjs');
function fixture(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qwertysay-registry-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
test('registry wrapper download checks SRI and artifact identity without running dependency scripts', async t => {
  const root = fixture(t), source = path.join(root, 'words.tpp');
  const m = { id: 'author.words', name: 'Words', version: '1.0.0', author: 'Writer', license: 'MIT', apiVersion: 1, capabilities: [], contributes: {} };
  fs.writeFileSync(source, pack(new Map([['texpro.extension.json', JSON.stringify(m)], ['LICENSE', 'MIT']])));
  const directory = path.join(root, 'package'); wrapperPackage(source, directory, '@author/words');
  const archive = path.join(root, 'npm.tgz'); execFileSync('tar', ['--format=ustar', '--no-xattrs', '-czf', archive, '-C', root, 'package/package.json', 'package/words.tpp', 'package/LICENSE'], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
  const bytes = fs.readFileSync(archive), metadata = { name: '@author/words', version: '1.0.0', dist: { tarball: 'https://registry.npmjs.org/@author/words/-/words-1.0.0.tgz', integrity: 'sha512-' + crypto.createHash('sha512').update(bytes).digest('base64') } };
  assert.equal(registryArtifact(bytes, metadata).name, '@author/words');
  const output = path.join(root, 'downloaded.tpp'), fetch = async url => url.endsWith('.tgz') ? bytes : Buffer.from(JSON.stringify(metadata));
  const result = await downloadExtension('@author/words@1.0.0', output, { fetch }); assert.equal(result.manifest.id, m.id);
  await assert.rejects(downloadExtension('@author/words', output, { fetch }), /EEXIST/);
  assert.throws(() => registryArtifact(Buffer.from('corrupt'), metadata), /integrity/);
  assert.throws(() => registryArtifact(bytes, { ...metadata, name: '@wrong/words' }), /identity/);
});
test('registry names and cross-platform launch use fixed executables and argument arrays', async () => {
  for (const spec of ['file:/tmp/plugin', 'https://evil.test/plugin', '../plugin', 'name@latest;evil']) assert.throws(() => parseSpec(spec));
  assert.deepEqual(parseSpec('@author/words@1.2.3'), { name: '@author/words', version: '1.2.3' });
  const file = '/tmp/plugin with spaces.tpp';
  for (const platform of ['darwin', 'win32', 'linux']) await openForReview(file, { platform, execFile(command, args, options, done) { assert.ok(['open', 'explorer.exe', 'xdg-open'].includes(command)); assert.equal(args.at(-1), file); assert.equal(options.shell, undefined); done(); } });
});
test('sync launches a persistent desktop independently and forwards macOS arguments on repeat launch', async () => {
  const { EventEmitter } = require('node:events'), file = '/tmp/environment with spaces/review.json';
  await openSyncReview(file, { platform: 'darwin', executable: undefined, execFile(command, args, options, done) {
    assert.equal(command, 'open'); assert.deepEqual(args, ['-n', '-a', 'TeXPro', '--args', '--extension-sync=' + file]); done();
  } });
  for (const platform of ['win32', 'linux', 'darwin']) {
    let unreferenced = false;
    await openSyncReview(file, { platform, executable: '/Applications/TeXPro with spaces', spawn(command, args, options) {
      assert.equal(command, '/Applications/TeXPro with spaces'); assert.deepEqual(args, ['--extension-sync=' + file]);
      assert.deepEqual(options, { detached: true, stdio: 'ignore' });
      const child = new EventEmitter(); child.unref = () => { unreferenced = true; };
      queueMicrotask(() => child.emit('spawn')); return child;
    } });
    assert.equal(unreferenced, true, 'Must return while the desktop stays alive');
  }
  await assert.rejects(openSyncReview(file, { executable: '/missing', spawn() {
    const child = new EventEmitter(); queueMicrotask(() => child.emit('error', new Error('ENOENT'))); return child;
  } }), /Could not open TeXPro.*ENOENT/);
});
