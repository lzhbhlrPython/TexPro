import snapshot from '@/config/release.json';
import { APP_VERSION, SITE_LINKS } from '@/config/constants';

export type ReleaseChannel = 'nightly' | 'stable';

export interface ReleaseAsset {
  name: string;
  size?: number;
  url: string;
  digest?: string | null;
}

export interface ReleaseInfo {
  /** 不带前缀 v 的版本号：0.1.0-nightly.20261025（旧）或 0.1.0-20261109-Nightly（新） */
  version: string;
  channel: ReleaseChannel;
  /** 版本快照来自哪里：构建期同步 / 运行期实时 / 打包兜底 */
  source: 'github' | 'snapshot' | 'fallback';
  /** 该次发布的安装包清单（构建期快照有；运行期接口取不到时为空） */
  assets?: ReleaseAsset[];
  /** 发布时间（ISO 字符串） */
  publishedAt?: string;
  /** 原始 tag，如 v0.1.0-20261109-Nightly 或 nightly */
  releaseTag?: string;
}

/**
 * 构建期由 scripts/fetch-release.mjs 从 GitHub 写好；拿不到时退回 constants 里的
 * APP_VERSION。运行期还会再试一次实时接口，失败就安静地用这份快照。
 */
const SNAPSHOT: ReleaseInfo = {
  version: snapshot.version ?? APP_VERSION,
  channel: snapshot.channel === 'stable' ? 'stable' : 'nightly',
  source: snapshot.version ? 'snapshot' : 'fallback',
  assets: (snapshot.assets ?? []) as ReleaseAsset[],
  publishedAt: snapshot.publishedAt ?? undefined,
  releaseTag: snapshot.releaseTag ?? undefined,
};

const VERSION_RE = /\d+\.\d+\.\d+(?:-nightly\.\d{8}|-\d{8}-nightly)?/i;
const IS_NIGHTLY_RE = /-nightly\.\d{8}$|-\d{8}-nightly$/i;
const DATE_RE = /(20\d{6})/;

const CACHE_KEY = 'texpro:release';
const CACHE_TTL = 10 * 60 * 1000;

interface CachedRelease extends ReleaseInfo {
  fetchedAt: number;
}

/** 从 SITE_LINKS.repo 的地址里推出 GitHub owner/repo */
function repoSlug(): string | null {
  const match = /github\.com\/([^/]+)\/([^/#?]+)/.exec(SITE_LINKS.repo);
  return match ? `${match[1]}/${match[2].replace(/\.git$/, '')}` : null;
}

/** 从安装包文件名里取版本：旧 nightly（tag 固定）只能靠这一步，新 nightly 用 tag 即可 */
function versionFromAssets(assets: Array<{ name?: string }> = []): string | null {
  const versions = assets
    .map((asset) => VERSION_RE.exec(asset.name ?? '')?.[0])
    .filter((version): version is string => Boolean(version))
    .sort((a, b) => (DATE_RE.exec(a)?.[1] ?? a) < (DATE_RE.exec(b)?.[1] ?? b) ? 1 : -1);
  return versions[0] ?? null;
}

export function parseRelease(release: {
  tag_name?: string;
  prerelease?: boolean;
  published_at?: string;
  assets?: Array<{ name?: string; size?: number; browser_download_url?: string; digest?: string | null }>;
}): ReleaseInfo | null {
  const tag = (release.tag_name ?? '').replace(/^v/, '');
  // 新 tag 直接带版本；旧 nightly 的 tag 只有一个词，退回资产名解析
  const version = VERSION_RE.exec(tag)?.[0] ?? versionFromAssets(release.assets);
  if (!version) return null;
  return {
    version,
    channel: release.prerelease || IS_NIGHTLY_RE.test(version) ? 'nightly' : 'stable',
    source: 'github',
    publishedAt: release.published_at ?? undefined,
    releaseTag: release.tag_name ?? undefined,
    assets: (release.assets ?? [])
      .filter((asset) => asset.name && asset.browser_download_url)
      .map((asset) => ({
        name: asset.name as string,
        size: asset.size,
        url: asset.browser_download_url as string,
        digest: asset.digest ?? null,
      })),
  };
}

/** 在安装包清单里找当前版本、匹配平台的那一个 */
export function findAsset(
  assets: ReleaseAsset[] | undefined,
  version: string,
  pattern: RegExp,
): ReleaseAsset | null {
  if (!assets?.length) return null;
  return assets.find((asset) => asset.name.includes(version) && pattern.test(asset.name)) ?? null;
}

/** 字节数 → 人类可读体积 */
export function formatSize(bytes?: number, unit?: 'KB'): string | null {
  if (!bytes) return null;
  if (unit === 'KB' || bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

function readCache(): ReleaseInfo | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null') as CachedRelease | null;
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL && cached.version) return cached;
  } catch {
    /* 隐私模式或存储被禁用：当作没有缓存 */
  }
  return null;
}

function writeCache(info: ReleaseInfo) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...info, fetchedAt: Date.now() }));
  } catch {
    /* 忽略：缓存失败不影响展示 */
  }
}

/** 实时取最新一次发布。失败（离线、限流、被拦截）时返回构建期快照。 */
export async function fetchLatestRelease(signal?: AbortSignal): Promise<ReleaseInfo> {
  const cached = readCache();
  if (cached) return cached;

  const slug = repoSlug();
  if (!slug) return SNAPSHOT;

  try {
    const response = await fetch(`https://api.github.com/repos/${slug}/releases?per_page=5`, {
      signal,
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return SNAPSHOT;

    const releases = (await response.json()) as Array<{
      tag_name?: string;
      prerelease?: boolean;
      draft?: boolean;
      published_at?: string;
      assets?: Array<{ name?: string }>;
    }>;
    const latest = releases.find((item) => !item.draft);
    const info = latest ? parseRelease(latest) : null;
    if (!info) return SNAPSHOT;

    writeCache(info);
    return info;
  } catch {
    // 离线、被拦截、超时都走快照，不打扰阅读
    return SNAPSHOT;
  }
}

export const SNAPSHOT_RELEASE = SNAPSHOT;
