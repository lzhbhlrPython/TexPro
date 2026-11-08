#!/usr/bin/env node
/**
 * 预渲染 KaTeX 的 \LaTeX 字标，输出成静态 HTML 字符串。
 *
 * 字标是常量，没必要把整个 KaTeX 运行时（约 300 KB JS）打进首页；
 * 只在需要时（升级 KaTeX 后）跑 `pnpm latex:mark` 重新生成。
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import katex from 'katex';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// KaTeX 的 \LaTeX 按正文字号调紧字距，放在 40px 以上的标题里会挤成一坨。
const LOOSEN = {
  '-0.36em': '-0.26em',
  '-0.1667em': '-0.118em',
  '-0.15em': '-0.106em',
  '-0.125em': '-0.088em',
};

const html = Object.entries(LOOSEN).reduce(
  (markup, [from, to]) => markup.split(`margin-right:${from}`).join(`margin-right:${to}`),
  katex.renderToString('\\LaTeX', { throwOnError: false, output: 'html' }),
);

// 首页那段「视面 ↔ 源码」演示里的公式：同样预渲染，避免把 KaTeX 运行时打进包里
const DEMO = ['E=mc^2+\\frac{1}{2}mv^2', 'e^{i\\pi}+1=0', '\\langle\\psi|\\hat H|\\psi\\rangle'];
const demoMath = Object.fromEntries(
  DEMO.map((tex) => [tex, katex.renderToString(tex, { throwOnError: false, output: 'html' })]),
);

const file = path.join(root, 'src/components/latexMarkHtml.ts');
await writeFile(
  file,
  `// 由 scripts/build-latex-mark.mjs 生成，请勿手改。\n// 重新生成：pnpm latex:mark\n\nexport const LATEX_MARK_HTML = ${JSON.stringify(html)};\n\nexport const DEMO_MATH: Record<string, string> = ${JSON.stringify(demoMath, null, 2)};\n`,
  'utf8',
);
console.log(`[latex-mark] 已写入 ${path.relative(root, file)}（${html.length} 字符）`);
