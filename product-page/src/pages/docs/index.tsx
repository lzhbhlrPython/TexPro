import { Fragment, useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { DOCS_NAV, findTopic, neighbors, type DocBlock } from '@/content/docs';

const { Text } = Typography;

/** 行内只处理两种标记：`代码` 与 **加粗**，其余按纯文本输出。 */
function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="docs-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  const { token } = theme.useToken();

  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        switch (block.kind) {
          case 'h3':
            return (
              <h2
                key={key}
                id={`sec-${index}`}
                className="docs-section-title"
                style={{ color: token.colorTextHeading }}
              >
                {block.text}
              </h2>
            );
          case 'ul':
            return (
              <ul key={key} className="docs-ul" style={{ color: token.colorText }}>
                {block.items.map((item) => (
                  <li key={item}>{inline(item)}</li>
                ))}
              </ul>
            );
          case 'code':
            return (
              <pre
                key={key}
                className="docs-code"
                style={{
                  background: token.colorFillQuaternary,
                  borderColor: token.colorBorderSecondary,
                  borderRadius: token.borderRadius,
                  color: token.colorText,
                }}
              >
                {block.text}
              </pre>
            );
          case 'note':
            return (
              <div
                key={key}
                className="docs-note"
                style={{
                  background: token.colorFillQuaternary,
                  borderRadius: token.borderRadius,
                  color: token.colorTextSecondary,
                }}
              >
                {inline(block.text)}
              </div>
            );
          case 'kv':
            return (
              <dl key={key} className="docs-kv">
                {block.rows.map((row) => (
                  <div key={row.term} style={{ borderColor: token.colorBorderSecondary }}>
                    <dt style={{ color: token.colorTextHeading }}>{inline(row.term)}</dt>
                    <dd style={{ color: token.colorTextSecondary }}>{inline(row.desc)}</dd>
                  </div>
                ))}
              </dl>
            );
          default:
            return (
              <p key={key} className="docs-p" style={{ color: token.colorText }}>
                {inline(block.text)}
              </p>
            );
        }
      })}
    </>
  );
}

export default function DocsPage() {
  const { slug } = useParams();
  const topic = findTopic(slug);
  const { token } = theme.useToken();
  const { prev, next } = neighbors(topic.slug);
  const sections = topic.blocks.flatMap((block, index) =>
    block.kind === 'h3' ? [{ id: `sec-${index}`, title: block.text }] : [],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = `${topic.title} · TeXPro 文档`;
  }, [topic.slug, topic.title]);

  return (
    <article className="docs">
      <div className="shell">
        <header className="docs-head">
          <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
            文档 · {topic.group}
          </Text>
          <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
            {topic.title}
          </h1>
          <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
            {topic.summary}
          </p>
        </header>

        <div className="docs-body">
          <nav className="docs-nav" aria-label="文档目录">
            {DOCS_NAV.map((group) => (
              <div className="docs-nav-group" key={group.label}>
                <Text className="docs-nav-label" style={{ color: token.colorTextTertiary }}>
                  {group.label}
                </Text>
                {group.items.map((item) => {
                  const active = item.slug === topic.slug;
                  return (
                    <Link
                      key={item.slug}
                      to={item.slug === 'start' ? '/docs' : `/docs/${item.slug}`}
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

          <div className="docs-main">
            <DocBlocks blocks={topic.blocks} />

            <nav className="docs-pager" aria-label="上下篇">
              {prev ? (
                <Link to={prev.slug === 'start' ? '/docs' : `/docs/${prev.slug}`} style={{ color: token.colorPrimary }}>
                  <span style={{ color: token.colorTextTertiary }}>上一篇</span>
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
                  <span style={{ color: token.colorTextTertiary }}>下一篇</span>
                  {next.title}
                </Link>
              ) : null}
            </nav>
          </div>

          {sections.length > 1 ? (
            <aside className="docs-toc" aria-label="本页目录">
              <Text className="docs-nav-label" style={{ color: token.colorTextTertiary }}>
                本页目录
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
