#!/usr/bin/env node
/**
 * 由 src/content/blog/*.md 生成 RSS 2.0 与 JSON Feed。
 * 只输出标题、摘要与链接——正文留在站点上，避免两处维护。
 */
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blogDir = join(root, 'src/content/blog');
const outDir = join(root, 'public');

const SITE = (process.env.SITE_URL || 'https://lzhbhlrpython.github.io/TexStudioPro').replace(/\/$/, '');
const FEED_URL = `${SITE}/feed.xml`;
const TITLE = 'TeXPro 开发博客';
const DESC = 'TeXPro 应用本体的开发记录：改了什么、为什么这么改、验证到哪一步、还欠什么。';

function frontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const meta = {};
  if (!match) return meta;
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (!kv) continue;
    meta[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return meta;
}

const files = (await readdir(blogDir)).filter((name) => name.endsWith('.md'));
const posts = [];
for (const file of files) {
  const raw = await readFile(join(blogDir, file), 'utf8');
  const meta = frontMatter(raw);
  const date = meta.date || file.slice(0, 10);
  posts.push({
    slug: meta.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''),
    title: meta.title || file,
    date,
    summary: meta.summary || '',
    tags: (meta.tags || '').split(/[,，]/).map((t) => t.trim()).filter(Boolean),
  });
}
posts.sort((a, b) => (a.date < b.date ? 1 : -1));

const iso = (date) => new Date(`${date}T00:00:00+08:00`).toISOString();
const esc = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(TITLE)}</title>
    <link>${SITE}/blog</link>
    <description>${esc(DESC)}</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date(iso(posts[0]?.date ?? new Date().toISOString().slice(0, 10))).toUTCString()}</lastBuildDate>
    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />
${posts
  .map(
    (post) => `    <item>
      <title>${esc(post.title)}</title>
      <link>${SITE}/blog/${post.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${post.slug}</guid>
      <pubDate>${new Date(iso(post.date)).toUTCString()}</pubDate>
      <description>${esc(post.summary)}</description>
${post.tags.map((tag) => `      <category>${esc(tag)}</category>`).join('\n')}
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`;

const json = {
  version: 'https://jsonfeed.org/version/1.1',
  title: TITLE,
  home_page_url: `${SITE}/blog`,
  feed_url: `${SITE}/feed.json`,
  description: DESC,
  language: 'zh-CN',
  items: posts.map((post) => ({
    id: `${SITE}/blog/${post.slug}`,
    url: `${SITE}/blog/${post.slug}`,
    title: post.title,
    summary: post.summary,
    content_text: post.summary,
    date_published: iso(post.date),
    tags: post.tags,
  })),
};

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'feed.xml'), rss, 'utf8');
await writeFile(join(outDir, 'feed.json'), `${JSON.stringify(json, null, 2)}\n`, 'utf8');
console.log(`[feed] ${posts.length} 篇博客 → public/feed.xml, public/feed.json`);
