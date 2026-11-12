export function parseStableRelease(item) {
  if (!item || item.draft || item.prerelease || !item.published_at || !/^v\d+\.\d+\.\d+$/.test(item.tag_name || '')) return null;
  if (Number.isNaN(Date.parse(item.published_at))) return null;
  const https = url => { try { return new URL(url).protocol === 'https:'; } catch { return false; } };
  return {
    tag: item.tag_name,
    publishedAt: item.published_at,
    notes: typeof item.body === 'string' ? item.body.slice(0, 128 * 1024) : '',
    url: https(item.html_url) ? item.html_url : '',
    assets: (Array.isArray(item.assets) ? item.assets : []).filter(a => a && typeof a.name === 'string' && https(a.browser_download_url) && a.size > 0 && (!a.state || a.state === 'uploaded')).map(a => ({ name: a.name, size: a.size, url: a.browser_download_url, digest: typeof a.digest === 'string' ? a.digest : null })),
  };
}
export async function fetchStableReleases(repo, { fetcher = fetch, token } = {}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw Error('Invalid release repository');
  const found = new Map(), headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'texpro-stable-releases' };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let page = 1; page <= 100; page++) {
    const response = await fetcher(`https://api.github.com/repos/${repo}/releases?per_page=100&page=${page}`, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error(`Release history HTTP ${response.status}`);
    const items = await response.json();
    if (!Array.isArray(items)) throw Error('Invalid release history response');
    for (const item of items) {
      const release = parseStableRelease(item);
      if (release) found.set(release.tag, release);
    }
    if (items.length < 100) return [...found.values()].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  }
  throw Error('Release history pagination limit reached');
}
