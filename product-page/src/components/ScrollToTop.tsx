import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 站内路由切换后回到页面顶部。
 * 带 hash 的链接（如 /#download）交给锚点自己处理，不在这里抢滚动。
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
