import { Fragment, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { App, Button, theme } from 'antd';
import type { DocBlock } from '@/lib/markdown';
import { useT } from '@/i18n';

/** 行内标记：`代码`、**加粗**、[链接](地址)。其余按纯文本输出。 */
export function inline(text: string): ReactNode {
  return text
    .split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g)
    .map((part, index) => {
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

      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link) {
        const [, label, href] = link;
        const content = inline(label);

        // 站内路由：交给 react-router，不整页刷新
        if (href.startsWith('/')) {
          return (
            <Link key={index} to={href} className="docs-link">
              {content}
            </Link>
          );
        }

        // 页内锚点：平滑滚动，不走路由
        if (href.startsWith('#')) {
          return (
            <a
              key={index}
              href={href}
              className="docs-link"
              onClick={(event) => {
                event.preventDefault();
                document
                  .getElementById(href.slice(1))
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {content}
            </a>
          );
        }

        // 站外链接与 mailto：新窗口打开，带 noreferrer
        if (/^(https?:|mailto:)/i.test(href)) {
          return (
            <a key={index} href={href} target="_blank" rel="noreferrer" className="docs-link">
              {content}
            </a>
          );
        }

        return <Fragment key={index}>{content}</Fragment>;
      }

      return <Fragment key={index}>{part}</Fragment>;
    });
}

/** 文档与博客共用的正文渲染：把解析出来的块排成带样式的元素。 */
function CodeBlock({ text }: { text: string }) {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      message.success(t('已复制'));
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      message.error(t('复制失败，请手动选择'));
    }
  };

  return (
    <div className="code-block" style={{ borderColor: token.colorBorderSecondary }}>
      <pre
        className="docs-code"
        style={{
          background: token.colorFillQuaternary,
          color: token.colorText,
        }}
      >
        {text}
      </pre>
      <Button
        type="text"
        size="small"
        className="code-copy"
        onClick={copy}
        aria-label={t('复制代码')}
        style={{ color: token.colorTextTertiary, background: token.colorBgContainer }}
      >
        {copied ? t('已复制') : t('复制')}
      </Button>
    </div>
  );
}

export function MarkdownBlocks({ blocks }: { blocks: DocBlock[] }) {
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
          case 'h4':
            return (
              <h3 key={key} className="docs-h4" style={{ color: token.colorTextHeading }}>
                {block.text}
              </h3>
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
            return <CodeBlock key={key} text={block.text} />;
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
          case 'table':
            return (
              <div key={key} className="docs-table-wrap">
                <table
                  className="docs-table"
                  style={{ borderColor: token.colorBorderSecondary, color: token.colorText }}
                >
                  <thead>
                    <tr>
                      {block.head.map((cell) => (
                        <th
                          key={cell}
                          style={{
                            color: token.colorTextTertiary,
                            borderColor: token.colorBorderSecondary,
                          }}
                        >
                          {inline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`${key}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`${key}-${rowIndex}-${cellIndex}`}
                            style={{ borderColor: token.colorBorderSecondary }}
                          >
                            {inline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

/** 从块里挑出 `##` 小节，供右侧「本页目录」用。 */
export function collectSections(blocks: DocBlock[]): { id: string; title: string }[] {
  return blocks.flatMap((block, index) =>
    block.kind === 'h3' ? [{ id: `sec-${index}`, title: block.text }] : [],
  );
}
