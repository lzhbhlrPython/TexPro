#!/usr/bin/env node
/**
 * 版式锁：产品页的布局/排版属于「用户没要求就不能动」的部分。
 *
 * 做法很土但有效——把版式相关文件的内容哈希记进 layout.lock.json。
 * 任何 AI 或人都可以随意写 src/content/** 下的 Markdown；
 * 但只要动了页面结构、样式、路由或组件，`pnpm check:layout` 就会报出被改的文件。
 *
 *   pnpm check:layout    # 有改动 → 退出码 1，并列出文件
 *   pnpm layout:update   # 经用户同意改版后，重写基线（唯一合法入口）
 */

import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_FILE = path.join(ROOT, 'layout.lock.json');

/** 参与锁定的是「壳」：页面、组件、布局、样式、路由、入口与工程配置。 */
const TARGETS = [
  'src/App.tsx',
  'src/main.tsx',
  'src/router',
  'src/layouts',
  'src/components',
  'src/pages',
  'src/styles',
  'src/data',
  'src/config',
  'src/hooks',
  'src/lib',
  'src/types',
  'index.html',
  'vite.config.ts',
  'package.json',
];

/** 内容目录与构建产物永远可写，不在锁里。 */
const SKIP = [
  /^src\/content\//,
  // 每次 dev/build 都会刷新 syncedAt，锁它必然误报
  /^src\/config\/release\.json$/,
  /^src\/config\/stable-releases\.json$/,
];

async function walk(entry, out = []) {
  const abs = path.join(ROOT, entry);
  const info = await stat(abs).catch(() => null);
  if (!info) return out;

  if (info.isFile()) {
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (!SKIP.some((re) => re.test(rel))) out.push(rel);
    return out;
  }

  const names = await readdir(abs);
  for (const name of names.sort()) {
    await walk(path.join(entry, name), out);
  }
  return out;
}

async function collect() {
  const files = [];
  for (const target of TARGETS) await walk(target, files);
  const unique = Array.from(new Set(files)).sort();

  const entries = {};
  for (const rel of unique) {
    const buf = await readFile(path.join(ROOT, rel));
    entries[rel] = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  }
  return entries;
}

async function readLock() {
  try {
    return JSON.parse(await readFile(LOCK_FILE, 'utf8'));
  } catch {
    return null;
  }
}

const [, , command = 'check'] = process.argv;

const current = await collect();

if (command === '--update') {
  const payload = {
    note: '产品页版式基线。用 pnpm layout:update 更新，且只应在用户明确要求改版式时使用。',
    files: current,
  };
  await writeFile(LOCK_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`版式基线已更新：${Object.keys(current).length} 个文件。`);
  process.exit(0);
}

const lock = await readLock();
if (!lock?.files) {
  console.error('找不到 layout.lock.json，先运行 pnpm layout:update 建立基线。');
  process.exit(2);
}

const changed = [];
const added = [];
const removed = [];

for (const [file, hash] of Object.entries(current)) {
  if (!(file in lock.files)) added.push(file);
  else if (lock.files[file] !== hash) changed.push(file);
}
for (const file of Object.keys(lock.files)) {
  if (!(file in current)) removed.push(file);
}

if (!changed.length && !added.length && !removed.length) {
  console.log(`版式未动（${Object.keys(current).length} 个文件与基线一致）。`);
  process.exit(0);
}

console.error('检测到版式改动。产品页的布局与排版不由 AI 自行更改，除非用户明确要求。');
for (const file of changed) console.error(`  修改  ${file}`);
for (const file of added) console.error(`  新增  ${file}`);
for (const file of removed) console.error(`  删除  ${file}`);
console.error('\n只写文档与博客时，改动应全部落在 src/content/** 内。');
console.error('若这次改版是用户要求的，确认后运行：pnpm layout:update');
process.exit(1);
