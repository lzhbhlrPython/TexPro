/**
 * 一个很小、够用的 Markdown 解析器：文档与博客共用。
 * 支持的语法：`##` / `###` 标题、段落、`-` 列表、``` 代码块、`>` 提示、任意列数的 `|` 表格。
 * 行内只处理 `` `代码` `` 与 `**加粗**`。故意不引入解析库——可控、可预测、体积为零。
 */

export type DocBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'h4'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'code'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] };

export type FrontMatter = Record<string, string>;

/** 拆出文件顶部的 `---` 区块：每行 `key: value`，值两端的引号会被去掉。 */
export function splitFrontMatter(raw: string): { data: FrontMatter; body: string } {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return { data: {}, body: text };

  const end = text.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: text };

  const data: FrontMatter = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line.trim());
    if (!match) continue;
    data[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }

  return { data, body: text.slice(end + 4) };
}

/** 中文与中文之间不加空格，中文与西文之间留一个空格。 */
export function joinLines(lines: string[]): string {
  return lines.reduce((acc, line, index) => {
    if (index === 0) return line;
    const cjk = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/;
    const needSpace = !cjk.test(acc.slice(-1)) && !cjk.test(line[0] ?? '') ? ' ' : '';
    return `${acc}${needSpace}${line}`;
  }, '');
}

export function parseMarkdown(body: string): DocBlock[] {
  const blocks: DocBlock[] = [];
  const lines = body.split('\n');
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push({ kind: 'p', text: joinLines(paragraph) });
    paragraph = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

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

    // ## 小节标题 / ### 小节内分组
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      blocks.push({ kind: 'h4', text: trimmed.slice(4).trim() });
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph();
      blocks.push({ kind: 'h2', text: trimmed.slice(2).trim() });
      continue;
    }

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

    // | 表格 |（第二行是 | --- | 分隔线，列数不限）
    if (trimmed.startsWith('|') && lines[index + 1]?.trim().startsWith('|')) {
      const separator = lines[index + 1].trim();
      if (/^[|\s:-]+$/.test(separator)) {
        flushParagraph();
        const readRow = (raw: string) =>
          raw
            .trim()
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((cell) => cell.trim());
        const head = readRow(lines[index]);
        const rows: string[][] = [];
        index += 2;
        while (index < lines.length && lines[index].trim().startsWith('|')) {
          rows.push(readRow(lines[index]));
          index += 1;
        }
        index -= 1;
        blocks.push({ kind: 'table', head, rows });
        continue;
      }
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  return blocks;
}

/** 估算阅读时长：中文约 350 字 / 分钟，代码块按两倍权重计。 */
export function readingMinutes(blocks: DocBlock[]): number {
  let chars = 0;
  for (const block of blocks) {
    if (block.kind === 'p' || block.kind === 'note') chars += block.text.length;
    else if (block.kind === 'ul') chars += block.items.join('').length;
    else if (block.kind === 'code') chars += block.text.length * 2;
    else if (block.kind === 'table') chars += block.rows.flat().join('').length;
  }
  return Math.max(1, Math.round(chars / 350));
}
