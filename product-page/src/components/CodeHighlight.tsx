import { useEffect, useState, type CSSProperties } from 'react';
import { theme } from 'antd';
import { codeLanguage } from '@/lib/codeLanguages';
import { readableCodeColor } from '@/lib/codeColors';
import type { CodeToken } from '@/lib/codeHighlighting';

type Highlight = { text: string; language: string; tokens: CodeToken[] };

/** Shared by Markdown and page examples; React escapes every token as ordinary text. */
export function CodeHighlight({ text, language }: { text: string; language?: string }) {
  const { token } = theme.useToken();
  const resolved = codeLanguage(language);
  const [highlight, setHighlight] = useState<Highlight>();
  useEffect(() => {
    let current = true;
    if (resolved) {
      void import('@/lib/codeHighlighting')
        .then(module => module.highlightCode(text, resolved))
        .then(tokens => { if (current && tokens) setHighlight({ text, language: resolved, tokens }); })
        .catch(() => { /* A failed enhancement leaves the original text available. */ });
    }
    return () => { current = false; };
  }, [text, resolved]);

  const tokens = highlight?.text === text && highlight.language === resolved ? highlight.tokens : undefined;
  const readable = (color: string) => readableCodeColor(color, token.colorBgContainer, token.colorText);
  const colors: CSSProperties & Record<`--${string}`, string> = {
    '--site-code-text': token.colorText,
    '--site-code-comment': readable(token.colorTextSecondary),
    '--site-code-keyword': readable(token.colorPrimaryText),
    '--site-code-string': readable(token.colorSuccessText),
    '--site-code-number': readable(token.colorWarningText),
    '--site-code-function': readable(token.colorPrimaryText),
    '--site-code-type': readable(token.colorInfoText),
  };
  return <code className="code-highlight" data-language={resolved ?? 'text'} data-highlighted={tokens ? 'true' : 'false'} style={colors}>
    {tokens ? tokens.map((part, index) => <span key={index} style={{
      color: part.color,
      fontStyle: (part.fontStyle ?? 0) & 1 ? 'italic' : undefined,
      fontWeight: (part.fontStyle ?? 0) & 2 ? 600 : undefined,
      textDecoration: (part.fontStyle ?? 0) & 4 ? 'underline' : undefined,
    }}>{part.content}</span>) : text}
  </code>;
}
