import fs from 'node:fs';
import path from 'node:path';
import { documentationSection } from '../src/content/docs/sections.mjs';

const root = path.resolve(import.meta.dirname, '..');
const site = (process.env.SITE_URL || 'https://lzhbhlrpython.github.io/TexStudioPro').replace(/\/$/, '');
const blogBase = (process.env.SITE_URL || 'https://lzhbhlrpython.github.io/TexStudioPro').replace(/\/$/, '');

const docsDir = path.join(root, 'src/content/docs');
const blogDir = path.join(root, 'src/content/blog');
const out = (name, body) => fs.writeFileSync(path.join(root, 'public', name), body);

const frontMatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return [{}, text];
  const meta = {};
  for (const line of match[1].split('\n')) {
    const index = line.indexOf(':');
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    meta[key] = value;
  }
  return [meta, text.slice(match[0].length)];
};

const docs = fs
  .readdirSync(docsDir)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const [meta, body] = frontMatter(fs.readFileSync(path.join(docsDir, file), 'utf8'));
    return { slug: meta.slug ?? file.replace(/\.md$/, ''), section: documentationSection(meta.group), title: meta.title ?? file, summary: meta.summary ?? '', order: Number(meta.order ?? 0), body };
  })
  .sort((a, b) => a.order - b.order);

const posts = fs.existsSync(blogDir)
  ? fs
      .readdirSync(blogDir)
      .filter((file) => file.endsWith('.md'))
      .map((file) => {
        const [meta, body] = frontMatter(fs.readFileSync(path.join(blogDir, file), 'utf8'));
        return { slug: meta.slug ?? file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''), date: meta.date ?? '', title: meta.title ?? '', summary: meta.summary ?? '', body };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  : [];

const lines = [];
lines.push('# TeXPro');
lines.push('');
lines.push('> 本地优先的 LaTeX 桌面工作台：可视编辑、纸面排版与工程化编译在同一个窗口。源码 .tex 是文档原件，排版以本机 TeX 生成的 PDF 为准。');
lines.push('');
lines.push('## 事实');
lines.push('');
lines.push('- 平台：macOS 13+、Windows 10+、Linux x64（AppImage / deb / rpm）。');
lines.push('- 编译：latexmk 驱动 pdflatex / XeLaTeX / LuaLaTeX，支持 SyncTeX 双向定位。');
lines.push('- 架构与验证：以 electron/main.cjs、electron/preload.cjs、tests/ 和当前工作流为准；历史数量不代表当前结果。');
lines.push(`- 中文文档 ${docs.length} 篇，英文版位于同 slug 的 en 目录；博客只写简体中文，只记录应用本体开发。`);
lines.push('- 许可：MIT。');
lines.push('');
for (const [section, title, route] of [['use', '使用文档', 'docs'], ['develop', '开发文档', 'developers']]) {
  lines.push(`## ${title}`);
  lines.push('');
  lines.push(`- [${title}入口](${site}/${route})`);
  for (const doc of docs.filter(doc => doc.section === section)) lines.push(`- [${doc.title}](${site}/docs/${doc.slug}): ${doc.summary}`);
  lines.push('');
}
lines.push('');
lines.push('## 博客');
lines.push('');
for (const post of posts) {
  lines.push(`- [${post.title}](${site}/blog/${post.slug}): ${post.summary}`);
}
lines.push('');
lines.push('## 机器可读');
lines.push('');
lines.push(`- ${site}/llms-full.txt — 全部中文文档正文`);
lines.push(`- ${site}/feed.json — 博客 JSON Feed 1.1`);
lines.push(`- ${site}/sitemap.xml — 全部页面`);
lines.push(`- ${site}/ai — 给 AI 的结构化入口页`);
lines.push('');

out('llms.txt', lines.join('\n'));

const full = [];
for (const doc of docs) {
  full.push(`# ${doc.title}`);
  full.push('');
  full.push(`> ${doc.summary}`);
  full.push('');
  full.push(doc.body.trim());
  full.push('');
  full.push('---');
  full.push('');
}
out('llms-full.txt', full.join('\n'));
const urls = [
  '',
  'docs',
  'developers',
  'blog',
  'changelog',
  'releases',
  'ai',
  ...docs.map((doc) => `docs/${doc.slug}`),
  ...posts.map((post) => `blog/${post.slug}`),
];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((url) => `  <url><loc>${site}/${url}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
out('sitemap.xml', sitemap);
out('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);

console.log(`[llms] ${docs.length} docs, ${posts.length} posts → public/llms.txt`);
