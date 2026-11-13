import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { GROUP_LABELS, findTopic, navFor, neighbors } from '@/content/docs';
import { documentationHome } from '@/content/docs/sections.mjs';
import { useLocale, useT } from '@/i18n';
import { MarkdownBlocks, collectSections } from '@/components/MarkdownBlocks';

const { Text } = Typography;

export default function DocsPage() {
  const { slug } = useParams();
  const { locale } = useLocale();
  const t = useT();
  const topic = findTopic(slug, locale);
  const { token } = theme.useToken();
  const { prev, next } = neighbors(topic.slug, locale);
  const docsNav = navFor(locale, topic.section);
  // 英文模式下这一篇还没有译文时，正文仍是中文，页面顶部给出提示
  const englishMissing = locale === 'en' && Boolean(topic.englishFallback);
  const sections = collectSections(topic.blocks);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = `${topic.title} · ${t('TeXPro 文档')}`;

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
  }, [topic.slug, topic.title, locale, t]);

  return (
    <article className={`docs docs--${topic.section}`}>
      <div className="shell">
        <header className="docs-head docs-enter" key={`head-${topic.slug}`}>
          <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
            <Link to={documentationHome(topic.section)}>{t(topic.section === 'develop' ? '开发文档' : '使用文档')}</Link> · {locale === 'en' ? (GROUP_LABELS[topic.group] ?? topic.group) : topic.group}
          </Text>
          <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
            {topic.title}
          </h1>
          <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
            {topic.summary}
          </p>
          {englishMissing ? (
            <p className="docs-lang-note" style={{ color: token.colorTextTertiary }}>
              {t('这一篇的英文版还在翻译中，正文暂时以简体中文呈现。')}
            </p>
          ) : null}
        </header>

        <div className="docs-body">
          <nav className="docs-nav" aria-label={t('文档目录')}>
            <div className="docs-section-links">
              <Link to="/docs" style={{ color: topic.section === 'use' ? token.colorPrimary : token.colorTextSecondary }}>{t('使用文档')}</Link>
              <Link to="/developers" style={{ color: topic.section === 'develop' ? token.colorPrimary : token.colorTextSecondary }}>{t('开发文档')}</Link>
            </div>
            {docsNav.map((group) => (
              <div className="docs-nav-group" key={group.label}>
                <Text className="docs-nav-label" style={{ color: token.colorTextTertiary }}>
                  {group.label}
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

          <div className="docs-main docs-enter" key={topic.slug}>
            <MarkdownBlocks blocks={topic.blocks} />

            <nav className="docs-pager" aria-label={t('上一页与下一页')}>
              {prev ? (
                <Link to={`/docs/${prev.slug}`} style={{ color: token.colorPrimary }}>
                  <span style={{ color: token.colorTextTertiary }}>{t('上一篇')}</span>
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
                  <span style={{ color: token.colorTextTertiary }}>{t('下一篇')}</span>
                  {next.title}
                </Link>
              ) : null}
            </nav>
          </div>

          {sections.length > 1 ? (
            <aside className="docs-toc" aria-label={t('本页目录')}>
              <Text className="docs-nav-label" style={{ color: token.colorTextTertiary }}>
                {t('本页目录')}
              </Text>
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{ color: token.colorTextSecondary }}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
