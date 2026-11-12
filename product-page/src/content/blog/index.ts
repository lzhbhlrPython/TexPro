/**
 * 开发博客：一篇 = `src/content/blog/*.md` 一个文件。
 * 约定（也写在 README 里）：这里只记 **TeXPro 应用本体** 的开发——主进程与 IPC、渲染层
 * （编辑器与界面）、编译与 SyncTeX、服务层、测试、打包发布。负责本体的 AI 每完成一次
 * 用户可见的功能更新，就新增一篇 Markdown 记录「改了什么、为什么、怎么验证、留下什么问题」。
 *
 * 不写：产品页（product-page/）的开发与记录。做产品页的 AI——包括本协作方——不往这里写；
 * 产品页的改动留在它自己的提交信息与 README 里。
 * 文件名格式 `YYYY-MM-DD-slug.md`，front matter 至少包含 title / date / summary。
 *
 * 硬约束：本目录之外（页面、组件、样式、路由、依赖）的改动必须由用户明确提出；
 * 写完用 `pnpm check:layout` 自检，只写内容时应输出「版式未动」。
 */

import { parseMarkdown, readingMinutes, splitFrontMatter, type DocBlock } from '@/lib/markdown';

export interface BlogPost {
  slug: string;
  title: string;
  /** ISO 日期，用于排序 */
  date: string;
  /** 展示用的中文日期 */
  dateLabel: string;
  summary: string;
  tags: string[];
  /** 对应的产品版本，可省略 */
  version: string;
  author: string;
  minutes: number;
  blocks: DocBlock[];
}

const rawFiles = import.meta.glob('./*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

export const BLOG_POSTS: BlogPost[] = Object.entries(rawFiles)
  .map(([path, raw]) => {
    const { data, body } = splitFrontMatter(raw);
    const fileSlug = path.replace('./', '').replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    const blocks = parseMarkdown(body);
    const date = data.date ?? fileSlug.slice(0, 10);
    return {
      slug: data.slug ?? fileSlug,
      title: data.title ?? fileSlug,
      date,
      dateLabel: formatDate(date),
      summary: data.summary ?? '',
      tags: (data.tags ?? '')
        .split(/[,，]/)
        .map((tag) => tag.replace(/[\[\]`]/g, '').trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean),
      version: data.version ?? '',
      author: data.author ?? 'AI 协作者',
      minutes: readingMinutes(blocks),
      blocks,
    } satisfies BlogPost;
  })
  .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

export function findPost(slug?: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function neighborsOf(slug: string): { prev?: BlogPost; next?: BlogPost } {
  const index = BLOG_POSTS.findIndex((post) => post.slug === slug);
  return {
    // 列表按时间倒序：prev 是更早的一篇，next 是更新的一篇
    prev: index >= 0 && index < BLOG_POSTS.length - 1 ? BLOG_POSTS[index + 1] : undefined,
    next: index > 0 ? BLOG_POSTS[index - 1] : undefined,
  };
}

export const ALL_TAGS: string[] = Array.from(new Set(BLOG_POSTS.flatMap((post) => post.tags))).sort(
  (a, b) => a.localeCompare(b, 'zh-Hans-CN'),
);
