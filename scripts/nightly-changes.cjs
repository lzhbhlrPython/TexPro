'use strict';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function shanghaiDay(now) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  return { date, start: new Date(`${date}T00:00:00+08:00`), end: new Date(`${date}T00:00:00+08:00`).getTime() + 86400000 };
}

const NIGHTLY_TAG = /^(?:v\d+\.\d+\.\d+-\d{8}-Nightly|nightly)$/;
async function publishedNightly(repo, { fetcher = fetch, token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN } = {}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '')) throw new Error('GITHUB_REPOSITORY must identify the release repository');
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'texpro-nightly' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let latest = null;
  for (let page = 1; page <= 100; page++) {
    const response = await fetcher(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`Cannot read Nightly baseline: GitHub HTTP ${response.status}`);
    const releases = await response.json();
    if (!Array.isArray(releases)) throw new Error('Invalid GitHub release response');
    // GitHub's list order is not publication order when an older draft is published later.
    for (const item of releases) {
      const published = Date.parse(item.published_at);
      if (!item.draft && Number.isFinite(published) && NIGHTLY_TAG.test(item.tag_name) && item.assets?.some(asset => asset.state === 'uploaded' && asset.size > 0 && /\.(?:dmg|zip|exe|AppImage|deb|rpm)$/.test(asset.name || '')) && (!latest || published > latest.published)) latest = { tag: item.tag_name, published };
    }
    if (releases.length < 100) return latest?.tag ?? null;
  }
  throw new Error('Nightly release history exceeds the pagination limit');
}

function commitsSinceNightly(root, tag) {
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (!tag) return git('rev-list', '--reverse', 'HEAD').split('\n').filter(Boolean);
  if (!NIGHTLY_TAG.test(tag)) throw new Error('Invalid Nightly baseline tag');
  let baseline;
  try { baseline = git('rev-parse', '--verify', `refs/tags/${tag}^{commit}`); }
  catch { throw new Error(`Nightly baseline tag is missing locally: ${tag}; fetch full history and tags`); }
  try { git('merge-base', '--is-ancestor', baseline, 'HEAD'); }
  catch { throw new Error(`Nightly baseline ${tag} is not an ancestor of HEAD`); }
  // Commit identity is authoritative: old timestamps and empty commits are included.
  return git('rev-list', '--reverse', `${baseline}..HEAD`).split('\n').filter(Boolean);
}

function scheduledDay(now) {
  // A delayed schedule belongs to the most recent 21:23 Shanghai window.
  return shanghaiDay(new Date(now.getTime() - (21 * 60 + 23) * 60000)).date;
}
module.exports = { shanghaiDay, scheduledDay, publishedNightly, commitsSinceNightly };
if (require.main === module) (async () => {
  const scheduled = process.env.GITHUB_EVENT_NAME === 'schedule';
  const day = scheduled ? scheduledDay(new Date()) : shanghaiDay(new Date()).date;
  const tag = await publishedNightly(process.env.GITHUB_REPOSITORY);
  const commits = commitsSinceNightly(process.cwd(), tag);
  const alreadyPublished = scheduled && tag?.endsWith(`-${day.replaceAll('-', '')}-Nightly`);
  const build = commits.length > 0 && !alreadyPublished;
  const message = `${day} (Asia/Shanghai): ${commits.length} new commit(s) since ${tag || 'the first commit'}; ${build ? 'build' : 'skip'}.`;
  console.log(message);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `build=${build}\ndate=${day.replaceAll('-', '')}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, message + '\n');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
