'use strict';

const REPO = 'lzhbhlrPython/TexPro';
const RELEASES = `https://github.com/${REPO}/releases`;
const API = `https://api.github.com/repos/${REPO}/releases`;

// Only the release formats actually produced by TeXPro are eligible.
function parseVersion(value) {
  if (typeof value !== 'string') return null;
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:(\d{8})-Nightly|nightly\.(\d{8})))?$/i.exec(value);
  if (!match) return null;
  const base = match.slice(1, 4).map(Number);
  if (!base.every(Number.isSafeInteger)) return null;
  return { base, date: match[4] || match[5] || null, version: value.replace(/^v/, '') };
}
function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a.base[i] !== b.base[i]) return a.base[i] > b.base[i] ? 1 : -1;
  if (a.date === b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.date > b.date ? 1 : -1;
}
function installer(asset, version, platform, arch) {
  if (!asset || asset.state !== 'uploaded' || !(asset.size > 0) || typeof asset.name !== 'string') return false;
  const prefix = `TeXPro-${version}-`;
  if (!asset.name.startsWith(prefix)) return false;
  const suffix = asset.name.slice(prefix.length);
  if (platform === 'darwin') return suffix === `mac-${arch}.dmg` || suffix === 'mac-universal.dmg';
  if (platform === 'win32') return suffix === `windows-${arch}-setup.exe`;
  if (platform === 'linux') return (suffix === `linux-${arch}.AppImage` || (arch === 'x64' && suffix === 'linux-x86_64.AppImage'));
  return false;
}
function candidate(release, platform, arch) {
  if (!release || release.draft || typeof release.tag_name !== 'string') return null;
  const assets = Array.isArray(release.assets) ? release.assets : [];
  let parsed = parseVersion(release.tag_name);
  if (release.tag_name === 'nightly') {
    parsed = assets.map(asset => /^TeXPro-(.+)-(?:mac|linux|windows)-/.exec(asset?.name || '')?.[1])
      .map(parseVersion).filter(item => item?.date).sort((a, b) => compareVersions(b, a))[0];
  }
  if (!parsed || (release.prerelease && !parsed.date)) return null;
  const asset = assets.find(item => installer(item, parsed.version, platform, arch));
  // A release with no installer for this machine cannot be offered as an update.
  if (!asset) return null;
  const page = `${RELEASES}/tag/${encodeURIComponent(release.tag_name)}`;
  return { ...parsed, channel: parsed.date ? 'nightly' : 'stable', url: page,
    downloadUrl: `${RELEASES}/download/${encodeURIComponent(release.tag_name)}/${encodeURIComponent(asset.name)}`,
    assetName: asset.name, notes: typeof release.body === 'string' ? release.body.slice(0, 20000) : '' };
}
async function readJson(response) {
  if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'rateLimit' : 'network');
  if (!response.body) throw new Error('invalidResponse');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8 * 1024 * 1024) throw new Error('invalidResponse');
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('invalidResponse'); }
}
async function checkForUpdates({ includeNightly, currentVersion, platform = process.platform, arch = process.arch, fetchImpl = fetch }) {
  if (typeof includeNightly !== 'boolean') throw new TypeError('includeNightly must be boolean');
  const current = parseVersion(currentVersion);
  if (!current) return { ok: false, error: 'unsupportedVersion', currentVersion };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const request = async (url, allowMissing = false) => {
    const response = await fetchImpl(url, { signal: controller.signal, redirect: 'error', credentials: 'omit',
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'TeXPro-update-check' } });
    if (allowMissing && response.status === 404) return null;
    return readJson(response);
  };
  try {
    // Always fetch stable separately: a busy Nightly history must not hide stable releases.
    const stable = await request(`${API}/latest`, true);
    if (stable !== null && (!stable || Array.isArray(stable) || typeof stable.tag_name !== 'string')) throw new Error('invalidResponse');
    const candidates = [candidate(stable, platform, arch)].filter(Boolean);
    if (includeNightly) {
      for (let page = 1; page <= 10; page++) {
        const releases = await request(`${API}?per_page=100&page=${page}`);
        if (!Array.isArray(releases)) throw new Error('invalidResponse');
        candidates.push(...releases.map(item => candidate(item, platform, arch)).filter(Boolean));
        if (releases.length < 100) break;
        if (page === 10) throw new Error('historyLimit');
      }
    }
    const latest = candidates.filter(item => includeNightly || item.channel === 'stable')
      .sort((a, b) => compareVersions(b, a))[0];
    if (!latest) return { ok: true, currentVersion, status: 'unavailable', release: null };
    const { base, date, ...release } = latest;
    return { ok: true, currentVersion, status: compareVersions(latest, current) > 0 ? 'available' : 'current', release };
  } catch (error) {
    const known = ['rateLimit', 'invalidResponse', 'historyLimit'];
    return { ok: false, currentVersion, error: controller.signal.aborted ? 'timeout' : known.includes(error.message) ? error.message : 'network' };
  } finally { clearTimeout(timer); }
}
module.exports = { checkForUpdates, parseVersion, compareVersions, candidate };
