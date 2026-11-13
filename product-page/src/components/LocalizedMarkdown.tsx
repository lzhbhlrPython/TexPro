import { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useLocale, useMessages } from '@/i18n';
import { parseMarkdown } from '@/lib/markdown';
import { MarkdownBlocks } from './MarkdownBlocks';

const letters = import.meta.glob<string>('../content/letters/*/*.md', { query: '?url', import: 'default' });
const requests = new Map<string, Promise<string>>();
function readDocument(loader: () => Promise<string>) {
  return loader().then(url => {
    let request = requests.get(url);
    if (!request) {
      request = fetch(url, { credentials: 'omit', cache: 'no-cache' }).then(response => {
        if (!response.ok || response.headers.get('content-type')?.includes('text/html')) throw new Error('Markdown resource unavailable');
        return response.text();
      }).catch(error => { requests.delete(url); throw error; });
      requests.set(url, request);
    }
    return request;
  });
}
/** One document per language. Prose never enters the UI message catalogue. */
export function LocalizedMarkdown({ document }: { document: 'qwerty' }) {
  const { locale } = useLocale();
  const msg = useMessages();
  const [retry, setRetry] = useState(0);
  const [loaded, setLoaded] = useState<{ locale: string; text: string; fallback?: boolean; failed?: boolean }>();
  useEffect(() => {
    let cancelled = false;
    const original = letters[`../content/letters/en/${document}.md`];
    const selected = letters[`../content/letters/${locale}/${document}.md`];
    void readDocument(selected ?? original).then(text => {
      if (!cancelled) setLoaded({ locale, text, fallback: !selected });
    }).catch(async () => {
      try {
        const text = await readDocument(original);
        if (!cancelled) setLoaded({ locale, text, fallback: true });
      } catch { if (!cancelled) setLoaded({ locale, text: '', failed: true }); }
    });
    return () => { cancelled = true; };
  }, [document, locale, retry]);
  const current = loaded?.locale === locale ? loaded : undefined;
  return <div aria-busy={!current} className="localized-markdown">
    {current?.failed ? <div role="status">{msg('site.content.load.failed')} <Button type="text" onClick={() => setRetry(value => value + 1)}>{msg('site.action.retry')}</Button></div> : null}
    {current?.fallback ? <p role="status">{msg('site.content.english.fallback')} <Button type="text" onClick={() => setRetry(value => value + 1)}>{msg('site.action.retry')}</Button></p> : null}
    {current && !current.failed ? <div lang={current.fallback ? 'en' : undefined}><MarkdownBlocks blocks={parseMarkdown(current.text)} idPrefix={document} /></div> : null}
  </div>;
}
