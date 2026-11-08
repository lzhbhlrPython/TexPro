import { useEffect, useState } from 'react';

export type Platform = 'mac' | 'windows' | 'linux';

function detect(): Platform | null {
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Linux|X11/i.test(ua)) return 'linux';
  return null;
}

/**
 * 当前访客的系统。只在浏览器里判断：首帧返回 null，
 * 避免把「检测不到」误当成某个平台去高亮。
 */
export function usePlatform(): Platform | null {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    setPlatform(detect());
  }, []);

  return platform;
}
