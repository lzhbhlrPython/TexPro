'use strict';
// Run with the packaged Electron binary in ELECTRON_RUN_AS_NODE mode.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ExtensionManager } = require(path.resolve(process.argv[2]));
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-packaged-extensions-'));
const directory = path.join(root, 'installed');
const manager = new ExtensionManager(directory);
(async () => {
  for (const name of ['quiet-paper', 'writing-kit']) {
    const source = path.join(__dirname, '..', 'examples', 'extensions', name), preview = manager.inspect(source);
    await manager.install(source, preview.digest);
    assert.equal(manager.list().find(item => item.manifest.id === preview.manifest.id).enabled, false);
    await manager.enable(preview.manifest.id, true, true);
  }
  assert.match(manager.list().find(item => item.manifest.id === 'texpro.quiet-paper').themeStyles.warm, /data:image\/png;base64/);
  const snapshot = { source: '中文 abc', selection: { from: 3, to: 6 }, language: 'en' };
  const result = await manager.invoke('texpro.writing-kit', 'uppercase', snapshot, {});
  assert.deepEqual(result.edits, [{ from: 3, to: 6, insert: 'ABC' }]);
  manager.disableAll(); assert.ok(manager.list().every(item => !item.enabled));
  console.log('PASS packaged extension host: ASAR parsers, local CSS assets, unpacked child, trusted transform and recovery');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { manager.stop(); fs.rmSync(root, { recursive: true, force: true }); });
