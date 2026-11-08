'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const releaseModule = import('../product-page/scripts/fetch-release.mjs');
const tag = 'v0.1.0-20261109-Nightly';
const release = (overrides = {}) => ({ tag_name: tag, prerelease: true, draft: false, published_at: '2026-11-09T03:30:00Z', assets: [{ name: 'TeXPro-0.1.0-20261109-Nightly-linux-x64.deb', size: 12345, browser_download_url: 'https://example.invalid/download', digest: 'sha256:verified' }], ...overrides });
const ok = data => ({ ok: true, json: async () => data });
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-product-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src/config'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src/config/constants.ts'), "export const APP_VERSION = '0.1.0';\nexport const SITE_LINKS = { repo: 'https://github.com/owner/repo' };\n");
  const snapshot = path.join(root, 'src/config/release.json');
  fs.writeFileSync(snapshot, JSON.stringify({ version: '0.1.0-20261108-Nightly', releaseTag: 'v0.1.0-20261108-Nightly', syncedAt: '2026-11-08T03:30:00Z', assets: [] }));
  return { root, snapshot };
}
test('pinned Nightly fetch uses the exact tag and copies download metadata', async () => {
  const { fromApi } = await releaseModule; let url;
  const info = await fromApi('owner/repo', tag, async input => { url = input; return ok(release()); });
  assert.ok(url.endsWith('/releases/tags/'+tag)); assert.equal(info.version,'0.1.0-20261109-Nightly'); assert.equal(info.channel,'nightly');
  assert.deepEqual(info.assets,[{ name: release().assets[0].name, size: 12345, url: 'https://example.invalid/download', digest: 'sha256:verified' }]);
});
test('latest release is consistent with the browser and legacy nightly versions still parse', async () => {
  const { fromApi } = await releaseModule;
  const info = await fromApi('owner/repo','',async () => ok([release({ draft:true }),release(),release({ tag_name:'v0.1.0',prerelease:false })]));
  assert.equal(info.releaseTag,tag);
  const old = await fromApi('owner/repo','',async () => ok([release({ tag_name:'nightly',assets:[{name:'TeXPro-0.1.0-nightly.20261025-linux.deb',browser_download_url:'https://example.invalid/old'}] })]));
  assert.equal(old.version,'0.1.0-nightly.20261025');
});
test('a successful pinned refresh updates snapshot and legacy constant without changing other configuration', async t => {
  const { syncRelease } = await releaseModule, { root,snapshot } = fixture(t);
  await syncRelease({rootDir:root,repo:'owner/repo',pinnedTag:tag,updateConstants:true,fetcher:async()=>ok(release())});
  const data=JSON.parse(fs.readFileSync(snapshot,'utf8')); assert.equal(data.releaseTag,tag); assert.equal(data.assets[0].size,12345); assert.equal(data.source,'github');
  const source=fs.readFileSync(path.join(root,'src/config/constants.ts'),'utf8'); assert.ok(source.includes("APP_VERSION = '0.1.0-20261109-Nightly'")); assert.ok(source.includes("repo: 'https://github.com/owner/repo'"));
});
test('pinned refresh rejects unavailable, wrong, draft and assetless releases instead of deploying stale data', async t => {
  const { syncRelease } = await releaseModule, {root,snapshot}=fixture(t), before=fs.readFileSync(snapshot,'utf8');
  for (const fetcher of [async()=>({ok:false,status:404,statusText:'Not Found'}),async()=>ok(release({tag_name:'nightly'})),async()=>ok(release({draft:true})),async()=>ok(release({assets:[]}))]) {
    await assert.rejects(syncRelease({rootDir:root,repo:'owner/repo',pinnedTag:tag,fetcher})); assert.equal(fs.readFileSync(snapshot,'utf8'),before);
  }
  await assert.rejects(syncRelease({rootDir:root,repo:'owner/repo',pinnedTag:'not-a-nightly',fetcher:async()=>{throw Error('must not fetch');}}),/Invalid dated Nightly/);
});
test('ordinary offline builds preserve the previous version and its original sync time', async t => {
  const { syncRelease } = await releaseModule, {root,snapshot}=fixture(t);
  const constants=fs.readFileSync(path.join(root,'src/config/constants.ts'),'utf8');
  await syncRelease({rootDir:root,repo:'owner/repo',updateConstants:false,fetcher:async()=>{throw Error('offline');}});
  assert.equal(fs.readFileSync(path.join(root,'src/config/constants.ts'),'utf8'),constants);
  const data=JSON.parse(fs.readFileSync(snapshot,'utf8')); assert.equal(data.version,'0.1.0-20261108-Nightly'); assert.equal(data.syncedAt,'2026-11-08T03:30:00Z'); assert.equal(data.source,'stale');
});
