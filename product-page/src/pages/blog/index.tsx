import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { BLOG_POSTS } from '@/content/blog';
import { useLocale, useMessages } from '@/i18n';

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
  const msg = useMessages();
  const { locale } = useLocale();
  const [activeTag, setActiveTag] = useState('');

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of BLOG_POSTS) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [msg]);

  const posts = activeTag ? BLOG_POSTS.filter((post) => post.tags.includes(activeTag)) : BLOG_POSTS;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = msg('site.page.blog.title');
  }, [msg]);

  return (
    <article className="blog">
      <div className="shell">
        <header className="blog-head docs-enter">
          <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
            {msg("site.dev.blog")}
          </Text>
          <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
            {msg("site.after.shipping.write.it.down")}
          </h1>
          <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
            {msg("site.texpro.moves.fast.and.the.reasons.get.lost.these")}
          </p>
          {locale === 'en' ? (
            <p className="blog-lang-note">
              Blog posts are written in Simplified Chinese only — readers of other languages will need
              to translate them.
            </p>
          ) : null}

        </header>

        {tags.length ? (
          <div className="tag-filter" role="group" aria-label={msg("site.filter.by.tag")}>
            <button
              type="button"
              className={`tag-pick${activeTag ? '' : ' is-active'}`}
              aria-pressed={!activeTag}
              onClick={() => setActiveTag('')}
            >
              {msg("site.all")}
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
                  <span>{post.minutes} {msg("site.min")}</span>
                  {post.version ? <span>v{post.version}</span> : null}
                </div>
              </div>
            </li>
          ))}
        </ol>

        {!BLOG_POSTS.length ? (
          <div className="blog-empty" style={{ borderColor: token.colorBorderSecondary }}>
            <p>{msg("site.no.posts.yet.after.the.next.round.of.development")}</p>
          </div>
        ) : null}


      </div>
    </article>
  );
}
