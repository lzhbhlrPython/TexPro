import { createHighlighterCore, type HighlighterCore, type ThemeRegistration } from '@shikijs/core';
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript';
import { codeLanguage } from './codeLanguages';

export type CodeToken = { content: string; color?: string; fontStyle?: number };

/** A site theme, not an imported editor palette. Values resolve in each code element. */
const paperTheme: ThemeRegistration = {
  name: 'texpro-paper',
  fg: 'var(--site-code-text)',
  bg: 'transparent',
  settings: [
    { scope: ['comment'], settings: { foreground: 'var(--site-code-comment)', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'constant.language'], settings: { foreground: 'var(--site-code-keyword)' } },
    { scope: ['string', 'markup.inline.raw'], settings: { foreground: 'var(--site-code-string)' } },
    { scope: ['constant.numeric'], settings: { foreground: 'var(--site-code-number)' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: 'var(--site-code-function)' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.tag'], settings: { foreground: 'var(--site-code-type)' } },
    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
  ],
};
const grammars = {
  shellscript: () => import('@shikijs/langs/shellscript'),
  latex: () => import('@shikijs/langs/latex'),
  json: () => import('@shikijs/langs/json'),
  jsonc: () => import('@shikijs/langs/jsonc'),
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  less: () => import('@shikijs/langs/less'),
  html: () => import('@shikijs/langs/html'),
  yaml: () => import('@shikijs/langs/yaml'),
  toml: () => import('@shikijs/langs/toml'),
  markdown: () => import('@shikijs/langs/markdown'),
  diff: () => import('@shikijs/langs/diff'),
  powershell: () => import('@shikijs/langs/powershell'),
};
let highlighter: Promise<HighlighterCore> | undefined;
const loading = new Map<string, Promise<void>>();
const cache = new Map<string, CodeToken[]>();
const MAX_CACHE = 64;

function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({ themes: [paperTheme], langs: [], engine: createJavaScriptRegexEngine() })
    .catch(error => { highlighter = undefined; throw error; });
  return highlighter;
}

/** Unknown, oversized or failed input stays text. Never returns serialized HTML. */
export async function highlightCode(text: string, label?: string): Promise<CodeToken[] | undefined> {
  const language = codeLanguage(label);
  if (!language || text.length > 40_000) return undefined;
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.length > 1000 || lines.some(line => line.length > 2000)) return undefined;
  const key = `${language}\0${text}`;
  const cached = cache.get(key);
  if (cached) { cache.delete(key); cache.set(key, cached); return cached; }
  try {
    const engine = await getHighlighter();
    const load = grammars[language as keyof typeof grammars];
    if (!load) return undefined;
    if (!loading.has(language)) {
      loading.set(language, engine.loadLanguage(load).catch(error => { loading.delete(language); throw error; }));
    }
    await loading.get(language);
    const separators = text.match(/\r\n|\n|\r/g) ?? [];
    const tokens = engine.codeToTokensBase(text, { lang: language, theme: 'texpro-paper' })
      .flatMap((line, index) => [...line.map(({ content, color, fontStyle }) => ({ content, color, fontStyle })), ...(separators[index] ? [{ content: separators[index] }] : [])]);
    // Shiki may normalize line endings. A rendering enhancement must never change source.
    if (tokens.map(token => token.content).join('') !== text) return undefined;
    cache.set(key, tokens);
    if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value as string);
    return tokens;
  } catch {
    return undefined;
  }
}
