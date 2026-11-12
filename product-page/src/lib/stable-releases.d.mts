export interface StableRelease {
  tag: string;
  publishedAt: string;
  notes: string;
  url: string;
  assets: { name: string; size: number; url: string; digest: string | null }[];
}
export function parseStableRelease(item: unknown): StableRelease | null;
export function groupStableReleases(releases: StableRelease[], series?: Record<string, { codename?: string }>): { key: string; title: string; releases: StableRelease[] }[];
export function fetchStableReleases(repo: string, options?: { fetcher?: typeof fetch; token?: string }): Promise<StableRelease[]>;
