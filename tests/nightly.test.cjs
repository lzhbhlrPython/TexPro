'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { commitsSinceNightly, publishedNightly, shanghaiDay } = require('../scripts/nightly-changes.cjs');
const now = new Date('2026-10-21T03:17:00Z');

function repository(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-nightly-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (args, date = '2026-10-20T15:59:59Z', author = date) => execFileSync('git', ['-C', root, '-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', ...args], {
    encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: author, GIT_COMMITTER_DATE: date }, stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  git(['init', '-b', 'main']);
  fs.writeFileSync(path.join(root, 'source.tex'), 'initial');
  git(['add', '.']); git(['commit', '-m', 'initial']);
  return { root, git };
}

test('nightly compares the published tag, including old-dated and empty new commits', t => {
  const { root, git } = repository(t);
  git(['tag', 'v0.1.0-20261020-Nightly']);
  assert.deepEqual(commitsSinceNightly(root, 'v0.1.0-20261020-Nightly'), []);
  git(['commit', '--allow-empty', '-m', 'empty'], '2026-10-01T01:00:00Z');
  const next = git(['rev-parse', 'HEAD']);
  assert.deepEqual(commitsSinceNightly(root, 'v0.1.0-20261020-Nightly'), [next]);
  assert.deepEqual(commitsSinceNightly(root, 'v0.1.0-20261020-Nightly'), [next], 'A failed attempt does not advance the published baseline');
});

test('nightly first build includes history and annotated tags resolve to their commit', t => {
  const { root, git } = repository(t);
  const first = git(['rev-parse', 'HEAD']);
  assert.deepEqual(commitsSinceNightly(root, null), [first]);
  git(['tag', '-a', 'nightly', '-m', 'published']);
  assert.deepEqual(commitsSinceNightly(root, 'nightly'), []);
  assert.throws(() => commitsSinceNightly(root, 'v0.1.0-20261019-Nightly'), /missing locally/);
  assert.throws(() => commitsSinceNightly(root, 'main'), /Invalid Nightly/);
});

test('nightly includes merged commits regardless of date and rejects unrelated baselines', t => {
  const { root, git } = repository(t);
  git(['tag', 'nightly']);
  git(['checkout', '-b', 'feature']);
  git(['commit', '--allow-empty', '-m', 'feature']); const feature = git(['rev-parse', 'HEAD']);
  git(['checkout', 'main']); git(['merge', '--no-ff', 'feature', '-m', 'merge']);
  assert.deepEqual(commitsSinceNightly(root, 'nightly'), [feature, git(['rev-parse', 'HEAD'])]);
  git(['checkout', '--orphan', 'unrelated']); git(['commit', '--allow-empty', '-m', 'unrelated']);
  assert.throws(() => commitsSinceNightly(root, 'nightly'), /not an ancestor/);
});

test('nightly baseline selects a published Nightly, skips drafts/stable/empty releases and paginates', async () => {
  const release = { tag_name: 'v0.1.0-20261020-Nightly', published_at: '2026-10-20', assets: [{ state: 'uploaded', size: 100 }] };
  const calls = [];
  const first = Array.from({ length: 100 }, () => ({ ...release, tag_name: 'v0.1.0' }));
  const result = await publishedNightly('owner/repo', { token: 'fixture', fetcher: async (url, options) => {
    calls.push(url); assert.equal(options.headers.Authorization, 'Bearer fixture');
    return { ok: true, json: async () => calls.length === 1 ? first : [{ ...release, draft: true }, { ...release, assets: [] }, release] };
  } });
  assert.equal(result, release.tag_name); assert.equal(calls.length, 2); assert.match(calls[1], /page=2$/);
  const republished = { ...release, tag_name: 'v0.1.0-20261019-Nightly', published_at: '2026-10-25' };
  assert.equal(await publishedNightly('owner/repo', { fetcher: async () => ({ ok: true, json: async () => [release, republished] }) }), republished.tag_name);
  assert.equal(await publishedNightly('owner/repo', { fetcher: async () => ({ ok: true, json: async () => [] }) }), null);
});

test('nightly baseline API errors fail instead of pretending this is the first build', async () => {
  await assert.rejects(publishedNightly('owner/repo', { fetcher: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
  await assert.rejects(publishedNightly('owner/repo', { fetcher: async () => ({ ok: true, json: async () => ({}) }) }), /Invalid GitHub/);
  await assert.rejects(publishedNightly('invalid'), /GITHUB_REPOSITORY/);
});

test('nightly date follows Shanghai midnight instead of the runner timezone', () => {
  assert.equal(shanghaiDay(new Date('2026-11-08T15:59:59Z')).date, '2026-11-08');
  assert.equal(shanghaiDay(new Date('2026-11-08T16:00:00Z')).date, '2026-11-09');
});

test('nightly stamps manifests and release metadata consistently without stacking suffixes', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-nightly-version-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const script = path.resolve(__dirname, '../scripts/set-nightly-version.mjs');
  const pkgPath = path.join(root, 'package.json'), lockPath = path.join(root, 'package-lock.json');
  const output = path.join(root, 'outputs');
  const pkg = { name: 'fixture', version: '0.1.0', dependencies: { example: '^1.0.0' } };
  const lock = { version: '0.1.0', packages: { '': { version: '0.1.0' }, 'node_modules/example': { version: '1.2.3' } } };
  const run = (date, ...args) => execFileSync(process.execPath, [script, ...args], { cwd: root, env: { ...process.env, NIGHTLY_DATE: date, GITHUB_OUTPUT: output }, stdio: 'pipe' });
  fs.writeFileSync(pkgPath, JSON.stringify(pkg)); fs.writeFileSync(lockPath, JSON.stringify(lock));
  run('20261108', '--dry-run');
  assert.deepEqual(JSON.parse(fs.readFileSync(pkgPath)), pkg);
  assert.deepEqual(JSON.parse(fs.readFileSync(lockPath)), lock);
  assert.match(fs.readFileSync(output, 'utf8'), /tag=v0\.1\.0-20261108-Nightly\n/);
  run('20261108'); run('20261108'); run('20261109');
  const stamped = JSON.parse(fs.readFileSync(pkgPath)), stampedLock = JSON.parse(fs.readFileSync(lockPath));
  assert.equal(stamped.version, '0.1.0-20261109-Nightly');
  assert.deepEqual(stamped.dependencies, pkg.dependencies);
  assert.equal(stampedLock.version, stamped.version);
  assert.equal(stampedLock.packages[''].version, stamped.version);
  assert.deepEqual(stampedLock.packages['node_modules/example'], lock.packages['node_modules/example']);
  pkg.version = '0.2.0-nightly.20261101'; fs.writeFileSync(pkgPath, JSON.stringify(pkg));
  run('20261109'); assert.equal(JSON.parse(fs.readFileSync(pkgPath)).version, '0.2.0-20261109-Nightly');
  assert.throws(() => run('20260230'));
  assert.throws(() => run('2026-11-09'));
});
