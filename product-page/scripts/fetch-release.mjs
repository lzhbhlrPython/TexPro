#!/usr/bin/env node
/**
 * 从 GitHub 取最新版本号，写到 src/config/release.json。
 *
 * 为什么在构建期做：GitHub 的 API 有 60 次/小时的匿名限额，站点访客共用 IP 时
 * 很容易撞 403；构建期取一次、写进产物，页面就不会因为被限流而显示错版本。
 * 运行期仍会再试一次（见 src/lib/release.ts），失败就静默用这份快照。
 *
 * 用法：node scripts/fetch-release.mjs [--repo owner/name]
 * 普通构建离线时保留旧快照；TEXPRO_RELEASE_TAG 指定 Nightly 时必须同步成功。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 两种 nightly 命名都要认：
//   旧：0.1.0-nightly.20261025（tag 固定叫 nightly，版本只在资产名里）
//   新：0.1.0-20261109-Nightly（tag 自带日期版本，同一天重跑覆盖当天 tag）
const VERSION_RE = /\d+\.\d+\.\d+(?:-nightly\.\d{8}|-\d{8}-nightly)?/i;
const IS_NIGHTLY_RE = /-nightly\.\d{8}$|-\d{8}-nightly$/i;
const DATE_RE = /(20\d{6})/;

async function readRepoFromConstants(rootDir) {
  const source = await readFile(path.join(rootDir, 'src/config/constants.ts'), 'utf8');
  const match = /repo:\s*'https:\/\/github\.com\/([^/']+)\/([^/']+)'/.exec(source);
  return match ? `${match[1]}/${match[2]}` : null;
}

/** 只留体积元数据，页面用得上（文件名、大小、下载地址、校验值） */
function compactAssets(assets = []) {
  return assets
    .map((asset) => ({
      name: asset.name,
      size: asset.size,
      url: asset.browser_download_url,
      digest: asset.digest ?? null,
    }))
    .filter((asset) => asset.name && asset.url);
}

function versionFromAssets(assets = []) {
  const versions = assets
    .map((asset) => VERSION_RE.exec(asset.name ?? '')?.[0])
    .filter(Boolean)
    .map((version) => ({
      version,
      // nightly 用日期排序，稳定版按语义版本号排序
      sortKey: DATE_RE.exec(version)?.[1] ?? version.split('.').map((part) => part.padStart(4, '0')).join('.'),
      nightly: IS_NIGHTLY_RE.test(version),
    }))
    .sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));
  return versions[0]?.version ?? null;
}

export async function fromApi(repo, pinnedTag = '', fetcher = fetch) {
  const endpoint = pinnedTag ? `releases/tags/${encodeURIComponent(pinnedTag)}` : 'releases?per_page=10';
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'texpro-site-build' };
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  const response = await fetcher(`https://api.github.com/repos/${repo}/${endpoint}`, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const data = await response.json();
  const release = pinnedTag ? data : data.find(item => !item.draft);
  if (!release || release.draft || !release.tag_name || pinnedTag && release.tag_name !== pinnedTag) throw new Error('Published release not found');
  const version = VERSION_RE.exec(release.tag_name)?.[0] ?? versionFromAssets(release.assets);
  if (!version) throw new Error('Release has no supported version');
  const assets = compactAssets(release.assets);
  if (pinnedTag && !assets.length) throw new Error('Published Nightly has no downloadable assets');
  return {
    version,
    channel: release.prerelease || IS_NIGHTLY_RE.test(version) ? 'nightly' : 'stable',
    releaseTag: release.tag_name,
    publishedAt: release.published_at,
    assets,
  };
}

async function fromAtomFeed(repo, fetcher = fetch) {
  const response = await fetcher(`https://github.com/${repo}/releases.atom`, {
    headers: { 'User-Agent': 'texpro-site-build' }, signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const xml = await response.text();
  const tags = [...xml.matchAll(/releases\/tag\/([^"<]+)/g)].map((match) => match[1]);
  const version = tags.map((tag) => VERSION_RE.exec(tag)?.[0]).find(Boolean);
  if (!version) throw new Error('no version in feed');
  return { version, channel: IS_NIGHTLY_RE.test(version) ? 'nightly' : 'stable', releaseTag: tags[0] };
}

async function readPrevious(rootDir) {
  try {
    return JSON.parse(await readFile(path.join(rootDir, 'src/config/release.json'), 'utf8'));
  } catch {
    return null;
  }
}

export async function syncRelease({ rootDir = root, repo, pinnedTag = process.env.TEXPRO_RELEASE_TAG || '', fetcher = fetch, updateConstants = process.env.CI === 'true' } = {}) {
  repo ??= await readRepoFromConstants(rootDir);
  if (!repo) throw new Error('Could not determine the release repository');
  if (pinnedTag && !/^v\d+\.\d+\.\d+-\d{8}-Nightly$/.test(pinnedTag)) throw new Error('Invalid dated Nightly tag');
  let info = null;
  if (pinnedTag) {
    // A publication refresh must not silently deploy a stale snapshot.
    info = await fromApi(repo, pinnedTag, fetcher);
  } else for (const [name, task] of [
    ['api', () => fromApi(repo, '', fetcher)],
    ['atom', () => fromAtomFeed(repo, fetcher)],
  ]) {
    try { info = await task(); break; }
    catch (error) { console.warn(`[release] ${name} 失败：${error.message}`); }
  }

  const previous = await readPrevious(rootDir);
  const next = {
    version: info?.version ?? previous?.version ?? null,
    channel: info?.channel ?? previous?.channel ?? 'nightly',
    releaseTag: info?.releaseTag ?? previous?.releaseTag ?? 'nightly',
    publishedAt: info ? info.publishedAt ?? null : previous?.publishedAt ?? null,
    assets: info ? info.assets ?? [] : previous?.assets ?? [],
    repo,
    syncedAt: info ? new Date().toISOString() : (previous?.syncedAt ?? null),
    source: info ? 'github' : 'stale',
  };

  if (!next.version) {
    console.warn('[release] 没有拿到版本号，保留旧快照');
    return;
  }

  await writeFile(path.join(rootDir, 'src/config/release.json'), `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  // Only CI needs to adapt the legacy static entry; local content builds must not change the layout-locked constants.
  if (updateConstants) {
    const constantsFile = path.join(rootDir, 'src/config/constants.ts');
    const constants = await readFile(constantsFile, 'utf8');
    await writeFile(constantsFile, constants.replace(/(export const APP_VERSION = )'[^']*'/, (_, prefix) => `${prefix}'${next.version}'`), 'utf8');
  }
  console.log(
    `[release] ${next.repo} → v${next.version}（${next.channel}，${next.source === 'github' ? '刚从 GitHub 取到' : '沿用旧快照'}）`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repoArg = process.argv.indexOf('--repo');
  await syncRelease({ repo: repoArg > 0 ? process.argv[repoArg + 1] : undefined });
}
