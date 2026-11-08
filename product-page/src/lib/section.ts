import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/** 目标区块可能还没挂载（刚从文档页切回首页），等它出现再滚。 */
export function scrollToSection(id: string, attempt = 0) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (attempt > 40) return;
  window.setTimeout(() => scrollToSection(id, attempt + 1), 50);
}

/** 站内锚点：在首页直接滚，在其它页面先切回首页再滚。 */
export function useGoSection() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (id: string) => {
      if (location.pathname === '/') {
        scrollToSection(id);
        return;
      }
      navigate('/');
      scrollToSection(id);
    },
    [location.pathname, navigate],
  );
}
