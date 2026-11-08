/**
 * 文档内容：一篇文档 = `src/content/docs/*.md` 一个文件。
 * 文件顶部是 front matter（slug / title / group / order / summary），正文用 Markdown 写。
 * 解析器在 `src/lib/markdown.ts`，博客页共用同一套。
 */

import { parseMarkdown, splitFrontMatter, type DocBlock } from '@/lib/markdown';

export type { DocBlock };

export interface DocTopic {
  slug: string;
  group: string;
  title: string;
  summary: string;
  order: number;
  blocks: DocBlock[];
  /** 英文模式下这一篇还没有译文，正文回落中文 */
  englishFallback?: boolean;
}

export interface DocsNavGroup {
  label: string;
  items: { slug: string; title: string }[];
}

const GROUP_ORDER = ['开始', '使用', '参考', '开发', 'AI 协作', '关于'];

const rawFiles = import.meta.glob('./*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** 英文版：`src/content/docs/en/<slug>.md`，缺哪篇就回落到中文正文。 */
const rawEnFiles = import.meta.glob('./en/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const GROUP_LABELS: Record<string, string> = {
  开始: 'Start',
  使用: 'Using',
  参考: 'Reference',
  开发: 'Development',
  'AI 协作': 'AI workflow',
  关于: 'About',
};

function parseTopic(path: string, raw: string): DocTopic {
  const { data, body } = splitFrontMatter(raw);
  const slug = data.slug ?? path.split('/').pop()!.replace('.md', '');
  return {
    slug,
    group: data.group ?? '使用',
    title: data.title ?? slug,
    summary: data.summary ?? '',
    order: Number(data.order ?? 99),
    blocks: parseMarkdown(body),
  };
}

export const DOC_TOPICS: DocTopic[] = Object.entries(rawFiles)
  .filter(([path]) => !path.includes('/en/'))
  .map(([path, raw]) => parseTopic(path, raw))
  .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-Hans-CN'));

const groups = Array.from(new Set(DOC_TOPICS.map((topic) => topic.group))).sort(
  (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b),
);

export const DOCS_NAV: DocsNavGroup[] = groups.map((label) => ({
  label,
  items: DOC_TOPICS.filter((topic) => topic.group === label).map(({ slug, title }) => ({
    slug,
    title,
  })),
}));

export const DEFAULT_DOC_SLUG = DOC_TOPICS[0]?.slug ?? 'start';

/** 英文版目录：与中文同结构，标题/摘要取自 en 文件；缺失的篇目回落中文正文。 */
export const DOC_TOPICS_EN: DocTopic[] = DOC_TOPICS.map((zh) => {
  const raw = Object.entries(rawEnFiles).find(
    ([path]) => path.split('/').pop() === `${zh.slug}.md`,
  )?.[1];
  if (!raw) return { ...zh, englishFallback: true };
  const en = parseTopic(`${zh.slug}.md`, raw);
  return {
    ...en,
    slug: zh.slug,
    group: zh.group,
    order: zh.order,
    // 英文正文缺失时用中文补位，页面会提示
    blocks: en.blocks.length ? en.blocks : zh.blocks,
  };
});

export function topicsFor(locale: 'zh' | 'en'): DocTopic[] {
  return locale === 'en' ? DOC_TOPICS_EN : DOC_TOPICS;
}

export function navFor(locale: 'zh' | 'en'): DocsNavGroup[] {
  const topics = topicsFor(locale);
  const labels = Array.from(new Set(topics.map((topic) => topic.group))).sort(
    (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b),
  );
  return labels.map((group) => ({
    label: locale === 'en' ? (GROUP_LABELS[group] ?? group) : group,
    items: topics
      .filter((topic) => topic.group === group)
      .map(({ slug, title }) => ({ slug, title })),
  }));
}

export function findTopic(slug?: string, locale: 'zh' | 'en' = 'zh'): DocTopic {
  const topics = topicsFor(locale);
  return topics.find((topic) => topic.slug === slug) ?? topics[0];
}

export function neighbors(
  slug: string,
  locale: 'zh' | 'en' = 'zh',
): { prev?: DocTopic; next?: DocTopic } {
  const topics = topicsFor(locale);
  const index = topics.findIndex((topic) => topic.slug === slug);
  return {
    prev: index > 0 ? topics[index - 1] : undefined,
    next: index >= 0 && index < topics.length - 1 ? topics[index + 1] : undefined,
  };
}
