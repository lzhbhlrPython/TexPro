import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { findPost, neighborsOf } from '@/content/blog';
import { MarkdownBlocks } from '@/components/MarkdownBlocks';
import NotFoundPage from '@/pages/exception/NotFound';
import { useMessages } from '@/i18n';

const { Text } = Typography;

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = findPost(slug);
  const { token } = theme.useToken();
  const msg = useMessages();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (post) document.title = `${post.title} · ${msg("site.texpro.dev.blog")}`;
  }, [post]);

  if (!post) return <NotFoundPage />;

  const { prev, next } = neighborsOf(post.slug);

  return (
    <article className="blog-article">
      <div className="shell">
        <Link className="blog-back" to="/blog" style={{ color: token.colorTextTertiary }}>
          ← {msg("site.dev.blog")}
        </Link>

        <header className="blog-article-head docs-enter" key={post.slug}>
          <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
            {msg("site.dev.blog")} · {post.dateLabel}
          </Text>
          <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
            {post.title}
          </h1>
          <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
            {post.summary}
          </p>
          <div className="blog-meta blog-meta-line" style={{ color: token.colorTextTertiary }}>
            {post.tags.map((tag) => (
              <span className="blog-tag" key={tag}>
                {tag}
              </span>
            ))}
            <span>{post.author}</span>
            <span>{post.minutes} {msg("site.min")}</span>
            {post.version ? <span>v{post.version}</span> : null}
          </div>
        </header>

        <div className="docs-main blog-main docs-enter" key={`body-${post.slug}`}>
          <MarkdownBlocks blocks={post.blocks} />

          <nav className="docs-pager" aria-label={msg("site.adjacent.posts")}>
            {prev ? (
              <Link to={`/blog/${prev.slug}`} style={{ color: token.colorPrimary }}>
                <span style={{ color: token.colorTextTertiary }}>{msg("site.older.variant2")}</span>
                {prev.title}
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link to={`/blog/${next.slug}`} style={{ color: token.colorPrimary, textAlign: 'right' }}>
                <span style={{ color: token.colorTextTertiary }}>{msg("site.newer.variant2")}</span>
                {next.title}
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </article>
  );
}
