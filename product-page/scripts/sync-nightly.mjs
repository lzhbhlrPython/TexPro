import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const destination = fileURLToPath(new URL('../src/config/nightly-release.json', import.meta.url));
export async function syncNightly() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  try {
    const source = await readFile(new URL('../src/config/constants.ts', import.meta.url), 'utf8');
    const repo = /repo:\s*'https:\/\/github\.com\/([^']+)'/.exec(source)?.[1];
    if (!repo) throw Error('Missing repository');
    const candidates = [];
    for (let page = 1; page <= 100; page++) {
      const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`, { headers, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      const items = await response.json();
      if (!Array.isArray(items)) throw Error('Invalid release list');
      candidates.push(...items.filter(item => !item.draft && /^(v\d+\.\d+\.\d+-\d{8}-Nightly|nightly)$/.test(item.tag_name) && item.assets?.some(asset => asset.size > 0 && asset.state === 'uploaded')));
      if (items.length < 100) break;
      if (page === 100) throw Error('Release pagination limit');
    }
    candidates.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
    await writeFile(destination, JSON.stringify({ releaseTag: candidates[0]?.tag_name ?? null, source: 'github', fetchedAt: new Date().toISOString() }, null, 2) + '\n');
  } catch (error) {
    console.warn(`Nightly sync failed; retaining previous snapshot: ${error.message}`);
    if (process.env.TEXPRO_RELEASE_TAG?.includes('Nightly')) throw error;
  }
}
