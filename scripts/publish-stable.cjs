'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { stampVersion } = require('./release-version.cjs');
const git = (root, ...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
function commitVersion(root, { version, sourceSha, runId, initial = false }) {
  if (!/^\d+\.\d+\.\d+$/.test(version) || !/^[a-f0-9]{40}$/.test(sourceSha) || !/^\d+$/.test(runId)) throw Error('Invalid release identity');
  const tag = `v${version}`, trailer = `Release-Source: ${sourceSha}\nRelease-Run: ${runId}${initial ? '\nRelease-Initial: true' : ''}`;
  git(root, 'fetch', 'origin', '+refs/heads/main:refs/remotes/origin/main', '--tags');
  if (initial) {
    if (JSON.parse(git(root, 'show', `${sourceSha}:package.json`)).version !== version) throw Error('Initial release must use the current base version');
    if (git(root, 'tag', '--list').split('\n').some(name => /^v\d+\.\d+\.\d+$/.test(name) && name !== tag)) throw Error('Initial release requires no previous stable tags');
  }
  const tags = git(root, 'tag', '--list', tag);
  if (tags) {
    const commit = git(root, 'rev-parse', `${tag}^{commit}`);
    const body = git(root, 'show', '-s', '--format=%B', commit);
    const files = git(root, 'diff-tree', '--no-commit-id', '--name-only', '-r', commit).split('\n').sort();
    const versionFiles = files.join(',') === 'package-lock.json,package.json' || (initial && files.join(',') === '');
    const owned = trailer.split('\n').every(line => body.split('\n').includes(line));
    if (git(root, 'rev-parse', `${commit}^`) !== sourceSha || !owned || !versionFiles) throw Error('Existing release tag belongs to another release; never overwrite it');
    git(root, 'merge-base', '--is-ancestor', commit, 'origin/main');
    if (JSON.parse(git(root, 'show', `${commit}:package.json`)).version !== version) throw Error('Release tag version mismatch');
    return commit;
  }
  if (git(root, 'rev-parse', 'origin/main') !== sourceSha || git(root, 'rev-parse', 'HEAD') !== sourceSha) throw Error('main advanced since this build; start a new release run');
  if (git(root, 'status', '--porcelain', '--untracked-files=no')) throw Error('Tracked checkout must be clean before version commit');
  stampVersion(root, version);
  git(root, 'add', '--', 'package.json', 'package-lock.json');
  git(root, '-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', ...(initial ? ['--allow-empty'] : []), '-m', `chore(release): v${version}\n\n${trailer}`);
  git(root, 'tag', tag);
  // Both refs advance together. A concurrent main push rejects the entire update.
  git(root, 'push', '--atomic', 'origin', 'HEAD:refs/heads/main', `refs/tags/${tag}`);
  return git(root, 'rev-parse', 'HEAD');
}
function releasePresentation(root, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error('Invalid release version');
  let codename = '';
  const config = path.join(root, 'release-series.json');
  if (fs.existsSync(config)) {
    codename = JSON.parse(fs.readFileSync(config, 'utf8'))[version.split('.').slice(0, 2).join('.')]?.codename || '';
    if (typeof codename !== 'string' || (codename && !/^[\p{L}\p{N} .'-]{1,80}$/u.test(codename))) throw Error('Invalid release series codename');
  }
  const notesFile = path.join('docs', 'releases', `v${version}.md`);
  return { title: `v${version}${codename ? ` · ${codename}` : ''}`, notes: fs.existsSync(path.join(root, notesFile)) ? ['--notes-file', notesFile] : ['--generate-notes'] };
}
function findRelease(gh, repo, tag) {
  try { return JSON.parse(gh('api', `repos/${repo}/releases/tags/${tag}`)); }
  catch (error) { if (!/HTTP 404/.test(String(error.stderr))) throw error; }
  // GitHub's tag endpoint can hide drafts even from their publisher. The
  // authenticated release list includes them; do not recreate an existing one.
  const pages = JSON.parse(gh('api', '--paginate', '--slurp', `repos/${repo}/releases?per_page=100`));
  return pages.flat().find(release => release.tag_name === tag);
}
function publish(root, env = process.env, runGh) {
  const { RELEASE_VERSION: version, RELEASE_SOURCE: sourceSha, GITHUB_RUN_ID: runId, GITHUB_REPOSITORY: repo } = env;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw Error('Invalid release repository');
  if (env.RELEASE_INITIAL && !['true', 'false'].includes(env.RELEASE_INITIAL)) throw Error('Invalid initial release flag');
  const presentation = releasePresentation(root, version);
  commitVersion(root, { version, sourceSha, runId, initial: env.RELEASE_INITIAL === 'true' });
  const tag = `v${version}`, gh = runGh || ((...args) => execFileSync('gh', args, { cwd: root, encoding: 'utf8', env }).trim());
  const existing = findRelease(gh, repo, tag);
  if (!existing || existing.draft) {
    if (!existing) gh('release', 'create', tag, '--repo', repo, '--verify-tag', '--draft', ...presentation.notes, '--title', presentation.title);
    const assets = fs.readdirSync(path.join(root, 'release')).filter(name => /\.(dmg|zip|exe|AppImage|deb|rpm|skill)$/.test(name));
    if (!assets.some(n => n.endsWith('.dmg')) || !assets.some(n => n.endsWith('.exe')) || !assets.some(n => n.endsWith('.deb')) || !assets.some(n => n.endsWith('.rpm')) || !assets.some(n => n.endsWith('.AppImage'))) throw Error('Three-platform assets incomplete');
    const skill = `texpro-extension-development-v${version}.skill`;
    if (!assets.includes(skill)) throw Error('Extension development Skill asset missing');
    require('./package-extension-skill.cjs').verifySkillArchive(root, path.join(root, 'release', skill));
    gh('release', 'upload', tag, '--repo', repo, '--clobber', ...assets.map(name => path.join('release', name)));
    const uploaded = findRelease(gh, repo, tag);
    if (!uploaded || !assets.every(name => uploaded.assets.some(a => a.name === name && a.state === 'uploaded' && a.size > 0))) throw Error('Uploaded assets incomplete; keeping release draft');
    gh('release', 'edit', tag, '--repo', repo, '--draft=false', '--prerelease=false', '--latest');
  } else if (existing.prerelease || !existing.published_at) throw Error('Existing release is not a published stable version');
  // Also repeat dispatch on retry: a Pages failure does not require a new version.
  gh('workflow', 'run', 'product-page.yml', '--repo', repo, '--ref', 'main', '-f', `release_tag=${tag}`);
}
module.exports = { commitVersion, publish, releasePresentation };
if (require.main === module) publish(process.cwd());
