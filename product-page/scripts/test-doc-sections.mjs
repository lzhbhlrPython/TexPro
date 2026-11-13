import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, configFile: false, appType: 'custom', resolve: { alias: { '@': path.join(root, 'src') } }, optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, watch: null, ws: false } });
try {
  const { topicsFor, navFor, neighbors } = await server.ssrLoadModule('/src/content/docs/index.ts');
  const { searchIndex } = await server.ssrLoadModule('/src/lib/search.ts');
  const { BLOG_POSTS } = await server.ssrLoadModule('/src/content/blog/index.ts');
  assert.ok(BLOG_POSTS.every(post => post.tags.every(tag => !/[\[\]`]/.test(tag))), 'Blog labels contain no formatting marks');
  const ownership = new Map();
  for (const locale of ['zh', 'en']) {
    const all = topicsFor(locale);
    assert.equal(new Set(all.map(topic => topic.slug)).size, all.length, 'Slugs must be unique');
    const partition = ['use', 'develop'].flatMap(section => topicsFor(locale, section));
    assert.deepEqual(partition.map(topic => topic.slug).sort(), all.map(topic => topic.slug).sort(), 'Every topic belongs to exactly one section');
    for (const section of ['use', 'develop']) {
      const topics = topicsFor(locale, section);
      assert.ok(topics.length > 0);
      assert.deepEqual(navFor(locale, section).flatMap(group => group.items).map(item => item.slug).sort(), topics.map(topic => topic.slug).sort());
      for (const topic of topics) {
        assert.equal(topic.section === 'develop', ['开发', 'AI 协作'].includes(topic.group));
        const { prev, next } = neighbors(topic.slug, locale);
        if (prev) assert.equal(prev.section, section);
        if (next) assert.equal(next.section, section);
        const hit = searchIndex(locale).find(hit => hit.id === `doc-${topic.slug}`);
        assert.equal(hit.to, `/docs/${topic.slug}`, 'Existing article URLs stay stable');
        assert.ok(hit.meta.startsWith(locale === 'en' ? (section === 'develop' ? 'Developer docs' : 'User guide') : (section === 'develop' ? '开发文档' : '使用文档')));
        if (locale === 'zh') ownership.set(topic.slug, section);
        else assert.equal(section, ownership.get(topic.slug), 'Translation inherits canonical ownership');
      }
      assert.equal(neighbors(topics[0].slug, locale).prev, undefined);
      assert.equal(neighbors(topics.at(-1).slug, locale).next, undefined);
    }
    for (const slug of ['start', 'extension-package-management', 'language-packs']) assert.equal(all.find(topic => topic.slug === slug).section, 'use');
    for (const slug of ['extension-development', 'qwertysay', 'mcp', 'dev-setup']) assert.equal(all.find(topic => topic.slug === slug).section, 'develop');
  }
} finally { await server.close(); }

// Exercise the real generator in an isolated fixture, including a GitHub Pages subpath.
const fixture = await mkdtemp(path.join(tmpdir(), 'texpro-doc-sections-'));
try {
  for (const dir of ['scripts', 'src/content/docs', 'src/content/blog', 'public']) await mkdir(path.join(fixture, dir), { recursive: true });
  await copyFile(path.join(root, 'scripts/gen-llms.mjs'), path.join(fixture, 'scripts/gen-llms.mjs'));
  await copyFile(path.join(root, 'src/content/docs/sections.mjs'), path.join(fixture, 'src/content/docs/sections.mjs'));
  for (const [slug, group] of [['start','开始'], ['sdk','开发'], ['mcp','AI 协作']]) await writeFile(path.join(fixture, `src/content/docs/${slug}.md`), `---\nslug: ${slug}\ntitle: ${slug}\ngroup: ${group}\norder: 1\nsummary: Example\n---\n\n## Body\n`);
  execFileSync(process.execPath, [path.join(fixture, 'scripts/gen-llms.mjs')], { env: { ...process.env, SITE_URL: 'https://example.test/TeXPro' } });
  const llms = await readFile(path.join(fixture, 'public/llms.txt'), 'utf8');
  assert.match(llms, /## 使用文档[\s\S]*\/docs\/start[\s\S]*## 开发文档[\s\S]*\/docs\/(?:mcp|sdk)/);
  assert.match(llms, /https:\/\/example.test\/TeXPro\/developers/);
  const sitemap = await readFile(path.join(fixture, 'public/sitemap.xml'), 'utf8');
  for (const route of ['docs', 'developers', 'docs/start', 'docs/sdk', 'docs/mcp']) assert.ok(sitemap.includes(`<loc>https://example.test/TeXPro/${route}</loc>`));
} finally { await rm(fixture, { recursive: true, force: true }); }
console.log('PASS documentation partition, localized ownership, section navigation, stable links, search labels and generated subpath routes');
