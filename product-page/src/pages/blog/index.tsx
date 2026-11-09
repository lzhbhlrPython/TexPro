import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { BLOG_POSTS } from '@/content/blog';
import { useLocale, useT } from '@/i18n';

const { Text } = Typography;

function formatDate(value: string, locale: 'zh' | 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogIndexPage() {
  const { token } = theme.useToken();
  const t = useT();
  const { locale } = useLocale();
  const [activeTag, setActiveTag] = useState('');

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of BLOG_POSTS) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const posts = activeTag ? BLOG_POSTS.filter((post) => post.tags.includes(activeTag)) : BLOG_POSTS;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = '开发博客 · TeXPro';
  }, []);

  return (
    <article className="blog">
      <div className="shell">
        <header className="blog-head docs-enter">
          <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
            {t('开发博客')}
          </Text>
          <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
            {t('更新之后，写一篇')}
          </h1>
          <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
            {t('TeXPro 更新得很快，理由却容易丢。这里放开发过程中的记录：一个渲染决策为什么这么做、一条编译边界为什么收紧、一次发布为什么换方案。每篇都写给下一个接手的人——改了什么、为什么这么改、验证到哪一步、还欠什么。')}
          </p>
          {locale === 'en' ? (
            <p className="blog-lang-note">
              Blog posts are written in Simplified Chinese only — readers of other languages will need
              to translate them.
            </p>
          ) : null}

        </header>

        {tags.length ? (
          <div className="tag-filter" role="group" aria-label={t('按标签筛选')}>
            <button
              type="button"
              className={`tag-pick${activeTag ? '' : ' is-active'}`}
              aria-pressed={!activeTag}
              onClick={() => setActiveTag('')}
            >
              {t('全部')}
              <sup>{BLOG_POSTS.length}</sup>
            </button>
            {tags.map(([tag, count]) => (
              <button
                key={tag}
                type="button"
                className={`tag-pick${activeTag === tag ? ' is-active' : ''}`}
                aria-pressed={activeTag === tag}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              >
                {tag}
                <sup>{count}</sup>
              </button>
            ))}
          </div>
        ) : null}

        <ol className="blog-list">
          {posts.map((post, index) => (
            <li className="blog-item" key={post.slug} style={{ animationDelay: `${index * 45}ms` }}>
              <time className="blog-date" dateTime={post.date} style={{ color: token.colorTextTertiary }}>
                {formatDate(post.date, locale)}
              </time>
              <div className="blog-item-main">
                <h2 className="blog-item-title">
                  <Link to={`/blog/${post.slug}`} style={{ color: token.colorTextHeading }}>
                    {post.title}
                  </Link>
                </h2>
                <p className="blog-summary" style={{ color: token.colorTextSecondary }}>
                  {post.summary}
                </p>
                <div className="blog-meta" style={{ color: token.colorTextTertiary }}>
                  {post.tags.map((tag) => (
                    <span className="blog-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                  <span>{post.minutes} {t('分钟')}</span>
                  {post.version ? <span>v{post.version}</span> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!BLOG_POSTS.length ? (
          <div className="blog-empty" style={{ borderColor: token.colorBorderSecondary }}>
            <p>{t('还没有文章。下一次开发之后，第一篇会出现在这里。')}</p>
          </div>
        ) : null}


      </div>
    </article>
  );
}
