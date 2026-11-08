import { useEffect, useState } from 'react';
import { fetchLatestRelease, SNAPSHOT_RELEASE, type ReleaseInfo } from '@/lib/release';

let pending: Promise<ReleaseInfo> | null = null;

function loadOnce(): Promise<ReleaseInfo> {
  pending ??= fetchLatestRelease();
  return pending;
}

/**
 * 站点上所有版本号都从这里取：默认先渲染构建期同步到的版本，
 * GitHub 回来之后替换成最新发布的 tag（含 nightly 预发布）。
 */
export function useRelease(): ReleaseInfo {
  const [release, setRelease] = useState<ReleaseInfo>(SNAPSHOT_RELEASE);

  useEffect(() => {
    let alive = true;
    loadOnce().then((info) => {
      if (alive) setRelease(info);
    });
    return () => {
      alive = false;
    };
  }, []);

  return release;
}
