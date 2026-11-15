import katex from 'katex';

const mathHtmlCache = new Map<string, string>();

export function renderMath(tex: string, displayMode: boolean, macros: Record<string, string> = {}): string {
  const cacheKey = `${JSON.stringify(macros)}:${displayMode ? 'd' : 'i'}:${tex}`;
  const cached = mathHtmlCache.get(cacheKey);
  if (cached) {
    mathHtmlCache.delete(cacheKey);
    mathHtmlCache.set(cacheKey, cached);
    return cached;
  }
  try {
    const html = katex.renderToString(tex, {
      displayMode,
      throwOnError: true,
      errorColor: 'var(--danger)',
      strict: 'ignore',
      trust: false,
      maxExpand: 500,
      macros: {
        '\\R': '\\mathbb{R}',
        '\\N': '\\mathbb{N}',
        '\\Z': '\\mathbb{Z}',
        '\\C': '\\mathbb{C}',
        '\\dd': '\\mathrm{d}',
        ...macros,
      },
    });
    mathHtmlCache.set(cacheKey, html);
    if (mathHtmlCache.size > 800) {
      const oldest = mathHtmlCache.keys().next().value;
      if (oldest) mathHtmlCache.delete(oldest);
    }
    return html;
  } catch {
    return '';
  }
}
