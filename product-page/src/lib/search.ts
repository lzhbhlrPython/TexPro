import { GROUP_LABELS, topicsFor } from '@/content/docs';
import { BLOG_POSTS } from '@/content/blog';
import type { DocBlock } from '@/lib/markdown';

export interface SearchHit {
  id: string;
  kind: 'doc' | 'post';
  title: string;
  summary: string;
  /** 站内跳转地址 */
  to: string;
  /** 分组或标签，用于结果右侧的小字 */
  meta: string;
  /** 命中用的纯文本（标题 + 摘要 + 正文） */
  haystack: string;
}

function blocksToText(blocks: DocBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.kind) {
        case 'p':
        case 'h3':
        case 'h4':
        case 'code':
        case 'note':
          return block.text;
        case 'ul':
          return block.items.join(' ');
        case 'table':
          return [...block.head, ...block.rows.flat()].join(' ');
        default:
          return '';
      }
    })
    .join(' ');
}

const cache = new Map<'zh' | 'en', SearchHit[]>();

/** 文档 + 博客建一份内存索引；内容只在构建期变化，所以每种语言只建一次。 */
export function searchIndex(locale: 'zh' | 'en' = 'zh'): SearchHit[] {
  const cached = cache.get(locale);
  if (cached) return cached;

  const docsWord = locale === 'en' ? 'Docs' : '文档';
  const blogWord = locale === 'en' ? 'Blog' : '博客';

  const docs: SearchHit[] = topicsFor(locale).map((topic) => ({
    id: `doc-${topic.slug}`,
    kind: 'doc',
    title: topic.title,
    summary: topic.summary,
    to: `/docs/${topic.slug}`,
    meta: `${docsWord} · ${locale === 'en' ? (GROUP_LABELS[topic.group] ?? topic.group) : topic.group}`,
    haystack: `${topic.title} ${topic.summary} ${blocksToText(topic.blocks)}`.toLowerCase(),
  }));

  const posts: SearchHit[] = BLOG_POSTS.map((post) => ({
    id: `post-${post.slug}`,
    kind: 'post',
    title: post.title,
    summary: post.summary,
    to: `/blog/${post.slug}`,
    meta: `${blogWord} · ${post.dateLabel}`,
    haystack: `${post.title} ${post.summary} ${post.tags.join(' ')} ${blocksToText(post.blocks)}`.toLowerCase(),
  }));

  const hits = [...docs, ...posts];
  cache.set(locale, hits);
  return hits;
}

/** 多个关键词按「全部命中」匹配，结果按标题命中优先排序。 */
export function searchAll(query: string, limit = 8, locale: 'zh' | 'en' = 'zh'): SearchHit[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);
  if (!terms.length) return [];

  return searchIndex(locale)
    .filter((hit) => terms.every((term) => hit.haystack.includes(term)))
    .sort((a, b) => {
      const at = a.title.toLowerCase().includes(terms[0]) ? 0 : 1;
      const bt = b.title.toLowerCase().includes(terms[0]) ? 0 : 1;
      return at - bt;
    })
    .slice(0, limit);
}
