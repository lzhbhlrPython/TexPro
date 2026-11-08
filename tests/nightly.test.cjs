'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { changedCommitsToday, shanghaiDay } = require('../scripts/nightly-changes.cjs');
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

test('nightly skips yesterday and empty commits today', (t) => {
  const { root, git } = repository(t);
  assert.deepEqual(changedCommitsToday(root, now), []);
  git(['commit', '--allow-empty', '-m', 'empty'], '2026-10-21T01:00:00Z');
  assert.deepEqual(changedCommitsToday(root, now), []);
});

test('nightly counts Shanghai midnight by committer time, including old authored changes', (t) => {
  const { root, git } = repository(t);
  fs.writeFileSync(path.join(root, 'source.tex'), 'changed'); git(['add', '.']);
  git(['commit', '-m', 'change'], '2026-10-20T16:00:00Z', '2026-10-19T10:00:00Z');
  assert.deepEqual(changedCommitsToday(root, now), [git(['rev-parse', 'HEAD'])]);
});

test('nightly ignores future dated commits', (t) => {
  const { root, git } = repository(t);
  fs.writeFileSync(path.join(root, 'source.tex'), 'future'); git(['add', '.']);
  git(['commit', '-m', 'change'], '2026-10-22T01:00:00Z');
  assert.deepEqual(changedCommitsToday(root, now), []);
});

test('nightly counts a merge today when its first-parent tree changed', (t) => {
  const { root, git } = repository(t);
  git(['checkout', '-b', 'feature']);
  fs.writeFileSync(path.join(root, 'source.tex'), 'feature'); git(['add', '.']); git(['commit', '-m', 'feature']);
  git(['checkout', 'main']); git(['merge', '--no-ff', 'feature', '-m', 'merge'], '2026-10-21T01:00:00Z');
  assert.deepEqual(changedCommitsToday(root, now), [git(['rev-parse', 'HEAD'])]);
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
