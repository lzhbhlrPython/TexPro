/**
 * 文档内容：一篇文档 = `src/content/docs/*.md` 一个文件。
 * 文件顶部是 front matter（slug / title / group / order / summary），正文用 Markdown 写。
 * 这里只做一件小事：把 Markdown 的常用语法解析成页面可以直接排版的块。
 * 支持的语法有限（标题、段落、列表、代码块、引用、表格），够写文档，也避免了引入解析库。
 */

export type DocBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'code'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'kv'; rows: { term: string; desc: string }[] };

export interface DocTopic {
  slug: string;
  group: string;
  title: string;
  summary: string;
  order: number;
  blocks: DocBlock[];
}

export interface DocsNavGroup {
  label: string;
  items: { slug: string; title: string }[];
}

interface FrontMatter {
  slug?: string;
  title?: string;
  group?: string;
  order?: string;
  summary?: string;
}

const GROUP_ORDER = ['开始', '使用', '参考'];

function splitFrontMatter(raw: string): { data: FrontMatter; body: string } {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { data: {}, body: text };

  const end = text.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: text };

  const data: Record<string, string> = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    data[match[1]] = value;
  }

  return { data: data as FrontMatter, body: text.slice(end + 4) };
}

/** 中文与中文之间不加空格，中文与西文之间留一个空格。 */
function joinLines(lines: string[]): string {
  return lines.reduce((acc, line, index) => {
    if (index === 0) return line;
    const cjk = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/;
    const needSpace = !cjk.test(acc.slice(-1)) && !cjk.test(line[0] ?? '') ? ' ' : '';
    return `${acc}${needSpace}${line}`;
  }, '');
}

function parseBody(body: string): DocBlock[] {
  const blocks: DocBlock[] = [];
  const lines = body.split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ kind: 'p', text: joinLines(paragraph) });
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // ``` 代码块
    if (trimmed.startsWith('```')) {
      flushParagraph();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      blocks.push({ kind: 'code', text: code.join('\n') });
      continue;
    }

    // ## 小节标题
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      blocks.push({ kind: 'h3', text: trimmed.slice(3).trim() });
      continue;
    }

    // > 提示
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      const quote = [trimmed.slice(2)];
      while (index + 1 < lines.length && lines[index + 1].trim().startsWith('> ')) {
        index += 1;
        quote.push(lines[index].trim().slice(2));
      }
      blocks.push({ kind: 'note', text: joinLines(quote) });
      continue;
    }

    // - 列表
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        const item = lines[index].trim().replace(/^[-*]\s+/, '');
        index += 1;
        items.push(item);
      }
      index -= 1;
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // | 表格 |（第二行是 | --- | 分隔线）
    if (trimmed.startsWith('|') && lines[index + 1]?.trim().startsWith('|')) {
      const separator = lines[index + 1].trim();
      if (/^[|\s:-]+$/.test(separator)) {
        flushParagraph();
        const rows: { term: string; desc: string }[] = [];
        index += 2;
        while (index < lines.length && lines[index].trim().startsWith('|')) {
          const cells = lines[index]
            .trim()
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((cell) => cell.trim());
          if (cells.length >= 2) rows.push({ term: cells[0], desc: cells[1] });
          index += 1;
        }
        index -= 1;
        blocks.push({ kind: 'kv', rows });
        continue;
      }
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

const rawFiles = import.meta.glob('./*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const DOC_TOPICS: DocTopic[] = Object.entries(rawFiles)
  .map(([path, raw]) => {
    const { data, body } = splitFrontMatter(raw);
    const slug = data.slug ?? path.replace('./', '').replace('.md', '');
    return {
      slug,
      group: data.group ?? '使用',
      title: data.title ?? slug,
      summary: data.summary ?? '',
      order: Number(data.order ?? 99),
      blocks: parseBody(body),
    } satisfies DocTopic;
  })
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

export function findTopic(slug?: string): DocTopic {
  return DOC_TOPICS.find((topic) => topic.slug === slug) ?? DOC_TOPICS[0];
}

export function neighbors(slug: string): { prev?: DocTopic; next?: DocTopic } {
  const index = DOC_TOPICS.findIndex((topic) => topic.slug === slug);
  return {
    prev: index > 0 ? DOC_TOPICS[index - 1] : undefined,
    next: index >= 0 && index < DOC_TOPICS.length - 1 ? DOC_TOPICS[index + 1] : undefined,
  };
}
