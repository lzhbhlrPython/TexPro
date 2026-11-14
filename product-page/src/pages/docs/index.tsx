import { htmlLang } from '@/i18n/locales';
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { GROUP_LABELS, findTopic, navFor, neighbors } from '@/content/docs';
import { documentationEntry, documentationHome, type DocumentationSection } from '@/content/docs/sections.mjs';
import { useLocale, useMessages } from '@/i18n';
import { MarkdownBlocks, collectSections } from '@/components/MarkdownBlocks';

const { Text } = Typography;

export default function DocsPage({ section }: { section?: DocumentationSection }) {
  const { slug } = useParams();
  const { locale } = useLocale();
  const msg = useMessages();
  const topic = findTopic(slug ?? documentationEntry(section ?? 'use'), locale);
  const { token } = theme.useToken();
  const { prev, next } = neighbors(topic.slug, locale);
  const docsNav = navFor(locale, topic.section);
  // 当前语言缺这一篇时，正文退回英文或中文，页面顶部说明实际语言
  const fallbackNotice = topic.bodyFallback ? msg('site.docs.body.fallback').replace('{language}', htmlLang(topic.bodyFallback)) : null;
  const sections = collectSections(topic.blocks);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = `${topic.title} · ${msg("site.texpro.docs")}`;

    // 目录很长时，把当前条目滚进可视区（桌面是竖向滚动，窄屏是横向）
    const active = document.querySelector<HTMLElement>('.docs-nav a.is-active');
    const nav = document.querySelector<HTMLElement>('.docs-nav');
    if (active && nav) {
      if (nav.scrollWidth > nav.clientWidth + 4) {
        const left = active.offsetLeft - nav.offsetLeft;
        if (left < nav.scrollLeft || left > nav.scrollLeft + nav.clientWidth - 96) {
          nav.scrollTo({ left: Math.max(0, left - nav.clientWidth / 2), behavior: 'auto' });
        }
      } else {
        const top = active.offsetTop - nav.offsetTop;
        if (top < nav.scrollTop || top > nav.scrollTop + nav.clientHeight - 40) {
          nav.scrollTo({ top: Math.max(0, top - nav.clientHeight / 2), behavior: 'auto' });
        }
      }
    }
  }, [topic.slug, topic.title, locale, msg]);

  return (
    <article className={`docs docs--${topic.section}`}>
      <div className="shell">
        <div className="docs-body">
          <nav className="docs-nav" aria-label={msg("site.documentation.index")}>
            <div className="docs-section-links">
              <Link to="/docs" aria-current={topic.section === 'use' ? 'location' : undefined} style={{ color: topic.section === 'use' ? token.colorPrimary : token.colorTextSecondary }}>{msg("site.user.guide")}</Link>
              <Link to="/developers" aria-current={topic.section === 'develop' ? 'location' : undefined} style={{ color: topic.section === 'develop' ? token.colorPrimary : token.colorTextSecondary }}>{msg("site.developer.docs")}</Link>
            </div>
            {docsNav.map((group) => (
              <div className="docs-nav-group" key={group.label}>
                <Text className="docs-nav-label" style={{ color: token.colorTextTertiary }}>
                  {msg.text(group.label)}
                </Text>
                {group.items.map((item) => {
                  const active = item.slug === topic.slug;
                  return (
                    <Link
                      key={item.slug}
                      to={`/docs/${item.slug}`}
                      className={active ? 'is-active' : undefined}
                      aria-current={active ? 'page' : undefined}
                      style={{
                        color: active ? token.colorPrimary : token.colorTextSecondary,
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="docs-main docs-reading-enter" key={topic.slug}>
            <header className="docs-head">
              <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
                <Link to={documentationHome(topic.section)}>{msg(topic.section === 'develop' ? "site.developer.docs" : "site.user.guide")}</Link> · {msg.text(GROUP_LABELS[topic.group] ?? topic.group)}
              </Text>
              <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
                {topic.title}
              </h1>
              <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
                {topic.summary}
              </p>
              {fallbackNotice ? (
                <p className="docs-lang-note" style={{ color: token.colorTextTertiary }}>
                  {fallbackNotice}
                </p>
              ) : null}
            </header>

            <div lang={topic.bodyFallback ? htmlLang(topic.bodyFallback) : undefined}>
              <MarkdownBlocks blocks={topic.blocks} />
            </div>

            <nav className="docs-pager" aria-label={msg("site.previous.and.next.page")}>
              {prev ? (
                <Link to={`/docs/${prev.slug}`} style={{ color: token.colorPrimary }}>
                  <span style={{ color: token.colorTextTertiary }}>{msg("site.previous")}</span>
                  {prev.title}
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  to={`/docs/${next.slug}`}
                  style={{ color: token.colorPrimary, textAlign: 'right' }}
                >
                  <span style={{ color: token.colorTextTertiary }}>{msg("site.next")}</span>
                  {next.title}
                </Link>
              ) : null}
            </nav>
          </div>

          {sections.length > 1 ? (
            <aside className="docs-toc" aria-label={msg("site.on.this.page.variant2")}>
              <Text className="docs-nav-label" style={{ color: token.colorTextTertiary }}>
                {msg("site.on.this.page.variant2")}
              </Text>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{ color: token.colorTextSecondary }}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(section.id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
                  }}
                >
                  {section.title}
                </a>
              ))}
            </aside>
          ) : null}
        </div>

      </div>
    </article>
  );
}
