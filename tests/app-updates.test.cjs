'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseVersion, compareVersions, checkForUpdates, candidate } = require('../electron/services/app-updates.cjs');
function release(version, patch = {}) {
  return { tag_name: `v${version}`, prerelease: /nightly/i.test(version), body: 'Release notes', assets: [
    { name: `TeXPro-${version}-mac-universal.dmg`, state: 'uploaded', size: 123, browser_download_url: 'https://untrusted.example/file' },
    { name: `TeXPro-${version}-windows-x64-setup.exe`, state: 'uploaded', size: 123 },
    { name: `TeXPro-${version}-linux-x86_64.AppImage`, state: 'uploaded', size: 123 },
  ], ...patch };
}
const options = { currentVersion: '0.1.1', platform: 'darwin', arch: 'arm64' };
function mock(stable, pages = []) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(url); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit'); assert.equal(init.headers.Authorization, undefined);
    return new Response(JSON.stringify(url.endsWith('/latest') ? stable : pages[Number(new URL(url).searchParams.get('page')) - 1] || []));
  };
  return { fetchImpl, calls };
}
test('update version ordering is numeric with stable promotion and dated Nightly ordering', () => {
  for (const [a,b] of [['0.1.10','0.1.9'], ['0.1.1','0.1.1-20261114-Nightly'], ['0.1.2-20261114-Nightly','0.1.1'], ['0.1.1-20261114-Nightly','0.1.1-nightly.20261113']]) assert.ok(compareVersions(parseVersion(a),parseVersion(b)) > 0);
  for (const value of ['0.1.1-rc.1', 'nightly', 'v0.1.1suffix', '01.2.3', '9007199254740993.0.0']) assert.equal(parseVersion(value),null);
});
test('stable-only update checks use latest endpoint and canonical repository download URLs', async () => {
  const m = mock(release('0.1.2'));
  const result = await checkForUpdates({ ...options, includeNightly: false, ...m });
  assert.equal(result.status, 'available'); assert.equal(m.calls.length,1);
  assert.equal(result.release.downloadUrl, 'https://github.com/lzhbhlrPython/TexPro/releases/download/v0.1.2/TeXPro-0.1.2-mac-universal.dmg');
});
test('Nightly pagination preserves stable and chooses highest version rather than API order', async () => {
  const old = release('0.1.0-20261114-Nightly');
  const m = mock(release('0.1.2'), [Array(100).fill(old), [release('0.1.3-20261113-Nightly'), release('0.1.9', { draft: true }), release('0.1.8', { prerelease: true })]]);
  const result = await checkForUpdates({ ...options, includeNightly: true, ...m });
  assert.equal(result.release.version,'0.1.3-20261113-Nightly'); assert.equal(m.calls.length,3);
});
test('equal versions, downgrade avoidance, missing installers and legacy nightly tags', async () => {
  for (const version of ['0.1.1','0.1.0']) assert.equal((await checkForUpdates({ ...options, includeNightly:false, ...mock(release(version)) })).status,'current');
  const bad = release('0.1.2', { assets: [{ name:'TeXPro-0.1.2-mac-universal.dmg', size:0, state:'uploaded' }] });
  assert.equal((await checkForUpdates({ ...options, includeNightly:false, ...mock(bad) })).status,'unavailable');
  assert.equal(candidate(release('0.1.2-20261114-Nightly', { tag_name:'nightly' }), 'darwin','arm64').version,'0.1.2-20261114-Nightly');
  assert.ok(candidate(release('0.1.2'), 'win32','x64').assetName.endsWith('setup.exe'));
  assert.equal(candidate(release('0.1.2'),'linux','arm64'),null);
  assert.equal((await checkForUpdates({ ...options, currentVersion:'0.1.2-20261114-Nightly', includeNightly:false, ...mock(release('0.1.2')) })).status,'available');
});
test('network failures and malformed or incomplete history never report up-to-date', async () => {
  for (const [fetchImpl, error] of [
    [async () => { throw new Error('offline'); }, 'network'],
    [async () => new Response('{}', {status:429}), 'rateLimit'],
    [async () => new Response('{bad'), 'invalidResponse'],
    [async () => new Response('[]'), 'invalidResponse'],
  ]) assert.equal((await checkForUpdates({ ...options, includeNightly:false, fetchImpl })).error,error);
  const m = mock(release('0.1.1'), Array(10).fill(Array(100).fill(release('0.1.1'))));
  assert.equal((await checkForUpdates({ ...options, includeNightly:true,...m })).error,'historyLimit');
  await assert.rejects(checkForUpdates({ ...options, includeNightly:'true' }), TypeError);
  assert.equal((await checkForUpdates({ ...options,currentVersion:'custom',includeNightly:false })).error,'unsupportedVersion');
});
test('repositories without stable releases can still offer Nightly', async () => {
  const fetchImpl = async url => url.endsWith('/latest') ? new Response('{}',{status:404}) : new Response(JSON.stringify([release('0.1.2-20261114-Nightly')]));
  assert.equal((await checkForUpdates({ ...options,includeNightly:true,fetchImpl })).status,'available');
});
