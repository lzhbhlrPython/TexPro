import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, writeFile, rm, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';

const root = await realpath(await mkdtemp(path.join(tmpdir(), 'texpro-doc-count-')));
const docs = path.join(root, 'src/content/docs');
await mkdir(path.join(docs, 'en'), { recursive: true });
await mkdir(path.join(root, 'src/data'), { recursive: true });
await copyFile(new URL('../src/data/documentation.ts', import.meta.url), path.join(root, 'src/data/documentation.ts'));
async function snapshot() {
  const server = await createServer({ root, configFile: false, appType: 'custom', server: { middlewareMode: true, watch: null, ws: false } });
  try {
    const { code } = await server.transformRequest('/src/data/documentation.ts');
    assert.doesNotMatch(code, /import\s*\(/, 'Counting must not load Markdown bodies');
    return await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  } finally { await server.close(); }
}
try {
  for (const file of ['a.md', 'b.md', 'c.md', 'en/a.md', 'en/b.md', 'en/orphan.md']) await writeFile(path.join(docs, file), '# Test');
  let data = await snapshot();
  assert.deepEqual(data.DOC_COUNTS, { zh: 3, en: 2 });
  assert.equal(data.DOC_METRIC.value, '3 / 2');
  await writeFile(path.join(docs, 'en/c.md'), '# Translation');
  data = await snapshot();
  assert.deepEqual(data.DOC_COUNTS, { zh: 3, en: 3 });
  assert.equal(data.DOC_METRIC.value, '3 × 2');
  await rm(path.join(docs, 'c.md'));
  data = await snapshot();
  assert.deepEqual(data.DOC_COUNTS, { zh: 2, en: 2 });
  assert.equal(data.DOC_METRIC.value, '2 × 2');
  console.log('PASS Vite documentation counts: missing translations, paired additions, deletions, orphan translations and no body imports');
} finally { await rm(root, { recursive: true, force: true }); }
