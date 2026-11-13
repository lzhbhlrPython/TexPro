import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SECTION_LINKS } from '@/data/site';
import { useMessages } from '@/i18n';
import { scrollToSection } from '@/lib/section';

/** 首页右侧的页内定位：一列小点，当前段落实心；不放文字，避免和正文抢注意力。 */
export function SectionRail() {
  const { pathname } = useLocation();
  const msg = useMessages();
  const [active, setActive] = useState(SECTION_LINKS[0]?.id ?? '');
  const onHome = pathname === '/';

  useEffect(() => {
    if (!onHome) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * 0.42;
      let current = SECTION_LINKS[0]?.id ?? '';
      for (const item of SECTION_LINKS) {
        const node = document.getElementById(item.id);
        if (node && node.getBoundingClientRect().top <= line) current = item.id;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [onHome]);

  if (!onHome) return null;

  return (
    <nav className="dot-rail" aria-label={msg("site.on.this.page.variant3")}>
      {SECTION_LINKS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`dot${active === item.id ? ' is-active' : ''}`}
          aria-label={msg.text(item.label)}
          aria-current={active === item.id ? 'true' : undefined}
          onClick={() => scrollToSection(item.id)}
        >
          <span className="dot-name">{msg.text(item.label)}</span>
          <span className="dot-mark" />
        </button>
      ))}
    </nav>
  );
}
