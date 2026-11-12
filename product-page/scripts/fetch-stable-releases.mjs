import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchStableReleases } from '../src/lib/stable-releases.mjs';
export async function syncStableReleases({ rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), repo, pinnedTag = process.env.TEXPRO_RELEASE_TAG || '', fetcher = fetch } = {}) {
  const target = path.join(rootDir, 'src/config/stable-releases.json');
  if (!repo) {
    const constants = await readFile(path.join(rootDir, 'src/config/constants.ts'), 'utf8');
    repo = /repo:\s*'https:\/\/github\.com\/([^']+)'/.exec(constants)?.[1];
  }
  let previous = { releases: [], syncedAt: null };
  try { previous = JSON.parse(await readFile(target, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  let next;
  try {
    const releases = await fetchStableReleases(repo, { fetcher, token: process.env.GH_TOKEN });
    if (/^v\d+\.\d+\.\d+$/.test(pinnedTag) && !releases.some(r => r.tag === pinnedTag && r.assets.length)) throw Error(`Published stable release ${pinnedTag} missing from history or assetless`);
    next = { releases, syncedAt: new Date().toISOString(), source: 'github' };
  } catch (error) {
    if (/^v\d+\.\d+\.\d+$/.test(pinnedTag)) throw error;
    console.warn(`[stable-releases] ${error.message}; retaining previous snapshot`);
    next = { ...previous, source: previous.syncedAt ? 'stale' : 'unavailable' };
  }
  await writeFile(target, JSON.stringify(next, null, 2) + '\n');
}
