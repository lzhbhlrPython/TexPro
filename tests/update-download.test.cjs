'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { UpdateDownload } = require('../electron/services/update-download.cjs');
const bytes = Buffer.from('test installer contents');
const release = { version: '0.1.2', assetName: 'TeXPro-0.1.2-mac-universal.dmg', size: bytes.length,
  digest: 'sha256:' + createHash('sha256').update(bytes).digest('hex'),
  downloadUrl: 'https://github.com/lzhbhlrPython/TexPro/releases/download/v0.1.2/TeXPro-0.1.2-mac-universal.dmg' };
async function setup(t, fetchImpl, options = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'texpro-download-test-'));
  t.after(() => fs.rm(dir, { force: true, recursive: true }));
  return new UpdateDownload(dir, { fetchImpl, ...options });
}
async function complete(manager, item = release) { manager.start(item); await manager.job?.done; return manager.snapshot(); }
test('installer downloads stream to a unique cache file, verify SHA256 and reveal without executing', async t => {
  let calls = 0;
  const manager = await setup(t, async (url, init) => {
    calls++; assert.equal(init.credentials,'omit'); assert.equal(init.redirect,'manual');
    if (calls === 1) return new Response(null, { status:302, headers:{location:'https://release-assets.githubusercontent.com/github-production-release-asset/file'} });
    return new Response(bytes, { headers:{'content-length':String(bytes.length)} });
  });
  assert.equal((await complete(manager)).status,'ready');
  let shown; assert.equal((await manager.reveal(file => { shown = file; })).ok,true);
  assert.deepEqual(await fs.readFile(shown),bytes);
  assert.equal((await fs.stat(shown)).mode & 0o777,0o600);
  manager.start(release); assert.equal(calls,2,'ready cache is reused');
  await fs.unlink(shown); assert.equal((await manager.reveal(() => {})).ok,false);
  assert.equal(manager.snapshot().status, 'error');
  assert.equal((await complete(manager)).status, 'ready', 'a deleted download can be downloaded again');
});
test('wrong checksum, truncated and oversized bodies never leave an installable file', async t => {
  for (const [body, item, error] of [[bytes,{...release,digest:'sha256:'+'0'.repeat(64)},'checksum'],[bytes.subarray(1),release,'size'],[Buffer.concat([bytes,bytes]),release,'size']]) {
    const manager = await setup(t,async()=>new Response(body));
    assert.equal((await complete(manager,item)).error,error);
    assert.deepEqual(await fs.readdir(manager.directory),[]);
    assert.equal((await manager.reveal(()=>{})).ok,false);
  }
});
test('missing checksum, path injection and unexpected redirect hosts are rejected',async t=>{
  let calls=0; const manager=await setup(t,async()=>{calls++; return new Response(null,{status:302,headers:{location:'https://attacker.example/installer'}});});
  assert.equal(manager.start({...release,digest:null}).error,'checksumUnavailable');
  assert.equal(manager.start({...release,assetName:'../installer.exe'}).error,'noRelease'); assert.equal(calls,0);
  assert.equal((await complete(manager)).error,'network'); assert.equal(calls,1);
  assert.deepEqual(await fs.readdir(manager.directory),[]);
});
test('cancel and timeout abort in-flight transfers and remove partial files; retry succeeds',async t=>{
  let fetching;
  const entered = new Promise(resolve=>{fetching=resolve;});
  const manager=await setup(t,async(_url,{signal})=>new Promise((_resolve,reject)=>{signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});fetching();}));
  manager.start(release); const first=manager.job; manager.start(release);assert.equal(manager.job,first);
  await entered; await manager.cancel();assert.equal(manager.snapshot().status,'cancelled'); assert.deepEqual(await fs.readdir(manager.directory),[]);
  manager.fetch=async()=>new Response(bytes); assert.equal((await complete(manager)).status,'ready');
  const timeout=await setup(t,async(_url,{signal})=>new Promise((_resolve,reject)=>{signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});}),{timeoutMs:50});
  assert.equal((await complete(timeout)).error,'timeout');assert.deepEqual(await fs.readdir(timeout.directory),[]);
});
test('symlinked download cache is rejected without touching its target',async t=>{
  const manager=await setup(t,async()=>new Response(bytes));const target=await fs.mkdtemp(path.join(os.tmpdir(),'texpro-download-outside-'));t.after(()=>fs.rm(target,{recursive:true,force:true}));
  const alias=path.join(manager.directory,'alias');await fs.symlink(target,alias);manager.directory=alias;
  assert.equal((await complete(manager)).error,'storage');assert.deepEqual(await fs.readdir(target),[]);
});
