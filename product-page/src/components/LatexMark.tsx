import 'katex/dist/katex.min.css';
import { LATEX_MARK_HTML } from '@/components/latexMarkHtml';

/**
 * LaTeX 字标：用 KaTeX 排出来的 `\LaTeX`，与公式编辑器里看到的是同一个形状。
 *
 * HTML 由 scripts/build-latex-mark.mjs 预渲染成常量（字标不变，不需要把 KaTeX
 * 运行时打进首页）；这里只负责语义与样式挂点。
 */
export function LatexMark({ className }: { className?: string }) {
  return (
    <span
      className={`latex-mark${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="LaTeX"
      dangerouslySetInnerHTML={{ __html: LATEX_MARK_HTML }}
    />
  );
}
