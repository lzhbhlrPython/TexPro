'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { stampVersion } = require('./release-version.cjs');
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
function commitVersion(root, { version, sourceSha, runId }) {
  if (!/^\d+\.\d+\.\d+$/.test(version) || !/^[a-f0-9]{40}$/.test(sourceSha) || !/^\d+$/.test(runId)) throw Error('Invalid release identity');
  const tag = `v${version}`, trailer = `Release-Source: ${sourceSha}\nRelease-Run: ${runId}`;
  git(root, 'fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main', '--tags');
  const tags = git(root, 'tag', '--list', tag);
  if (tags) {
    const commit = git(root, 'rev-parse', `${tag}^{commit}`);
    const body = git(root, 'show', '-s', '--format=%B', commit);
    const files = git(root, 'diff-tree', '--no-commit-id', '--name-only', '-r', commit).split('\n').sort();
    if (git(root, 'rev-parse', `${commit}^`) !== sourceSha || !body.includes(trailer) || files.join(',') !== 'package-lock.json,package.json') throw Error('Existing release tag belongs to another release; never overwrite it');
    git(root, 'merge-base', '--is-ancestor', commit, 'origin/main');
    if (JSON.parse(git(root, 'show', `${commit}:package.json`)).version !== version) throw Error('Release tag version mismatch');
    return commit;
  }
  if (git(root, 'rev-parse', 'origin/main') !== sourceSha || git(root, 'rev-parse', 'HEAD') !== sourceSha) throw Error('main advanced since this build; start a new release run');
  if (git(root, 'status', '--porcelain', '--untracked-files=no')) throw Error('Tracked checkout must be clean before version commit');
  stampVersion(root, version);
  git(root, 'add', '--', 'package.json', 'package-lock.json');
  git(root, '-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', '-m', `chore(release): v${version}\n\n${trailer}`);
  git(root, 'tag', tag);
  // Both refs advance together. A concurrent main push rejects the entire update.
  git(root, 'push', '--atomic', 'origin', 'HEAD:refs/heads/main', `refs/tags/${tag}`);
  return git(root, 'rev-parse', 'HEAD');
}
function publish(root, env = process.env, runGh) {
  const { RELEASE_VERSION: version, RELEASE_SOURCE: sourceSha, GITHUB_RUN_ID: runId, GITHUB_REPOSITORY: repo } = env;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw Error('Invalid release repository');
  commitVersion(root, { version, sourceSha, runId });
  const tag = `v${version}`, gh = runGh || ((...args) => execFileSync('gh', args, { cwd: root, encoding: 'utf8', env }).trim());
  const endpoint = `repos/${repo}/releases/tags/${tag}`;
  let existing;
  try { existing = JSON.parse(gh('api', endpoint)); }
  catch (error) { if (!/HTTP 404/.test(String(error.stderr))) throw error; }
  if (!existing || existing.draft) {
    if (!existing) gh('release', 'create', tag, '--repo', repo, '--verify-tag', '--draft', '--generate-notes', '--title', tag);
    const assets = fs.readdirSync(path.join(root, 'release')).filter(name => /\.(dmg|zip|exe|AppImage|deb|rpm)$/.test(name));
    if (!assets.some(n => n.endsWith('.dmg')) || !assets.some(n => n.endsWith('.exe')) || !assets.some(n => n.endsWith('.deb')) || !assets.some(n => n.endsWith('.rpm')) || !assets.some(n => n.endsWith('.AppImage'))) throw Error('Three-platform assets incomplete');
    gh('release', 'upload', tag, '--repo', repo, '--clobber', ...assets.map(name => path.join('release', name)));
    const uploaded = JSON.parse(gh('api', endpoint));
    if (!assets.every(name => uploaded.assets.some(a => a.name === name && a.state === 'uploaded' && a.size > 0))) throw Error('Uploaded assets incomplete; keeping release draft');
    gh('release', 'edit', tag, '--repo', repo, '--draft=false', '--prerelease=false', '--latest');
  } else if (existing.prerelease || !existing.published_at) throw Error('Existing release is not a published stable version');
  // Also repeat dispatch on retry: a Pages failure does not require a new version.
  gh('workflow', 'run', 'product-page.yml', '--repo', repo, '--ref', 'main', '-f', `release_tag=${tag}`);
}
module.exports = { commitVersion, publish };
if (require.main === module) publish(process.cwd());
