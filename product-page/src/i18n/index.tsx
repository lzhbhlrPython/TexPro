import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { initialCatalog, loadMessages, type MessageId } from './catalog';
import { SITE_LANGUAGES, type Locale } from './locales';
export type { Locale } from './locales';
export type { MessageId } from './catalog';
interface LocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<'loaded' | 'failed' | 'superseded'>;
  toggle: () => void;
  messages: ReturnType<typeof initialCatalog>['messages'];
  fallback: ReturnType<typeof initialCatalog>['fallback'];
  startupFailure: boolean;
}
const LocaleContext = createContext<LocaleValue | null>(null);
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const sequence = useRef(0);
  useEffect(() => () => { sequence.current++; }, []);
  useEffect(() => {
    document.documentElement.lang = SITE_LANGUAGES.find(language => language.code === catalog.locale)?.htmlLang ?? 'en';
  }, [catalog.locale]);
  const setLocale = useCallback((locale: Locale) => {
    const request = ++sequence.current;
    return loadMessages(locale).then(messages => {
      if (request !== sequence.current) return 'superseded' as const;
      setCatalog(previous => ({ ...previous, locale, messages, startupFailure: false }));
      try { localStorage.setItem('texpro:locale', locale); } catch { /* optional storage */ }
      return 'loaded' as const;
    }).catch(error => {
      if (request !== sequence.current) return 'superseded' as const;
      console.error('Language resources could not be loaded; keeping the current language.', error);
      return 'failed' as const;
    });
  }, []);
  const value = useMemo(() => ({ ...catalog, setLocale, toggle: () => setLocale(catalog.locale === 'zh' ? 'en' : 'zh') }), [catalog, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('LocaleProvider is required');
  return value;
}
export function useMessages() {
  const { messages, fallback } = useLocale();
  return useMemo(() => {
    const message = (id: MessageId) => messages[id] ?? fallback[id] ?? `[${id}]`;
    return Object.assign(message, {
      // Author data, routes and identifiers are never translated by accident.
      text: (value: string) => Object.hasOwn(fallback, value) ? message(value as MessageId) : value,
    });
  }, [messages, fallback]);
}
/** Project only explicitly named text fields. Never recurse into arbitrary objects or React nodes. */
export function useLocalizedFields() {
  const message = useMessages();
  return useCallback(<T,>(items: ReadonlyArray<T>, fields: readonly string[]): T[] => items.map(item => {
    if (typeof item === 'string') return message.text(item) as T;
    if (!item || typeof item !== 'object') return item;
    const result: T = { ...item };
    for (const field of fields) {
      const key = field as keyof T, value = item[key];
      if (typeof value === 'string') result[key] = message.text(value) as T[keyof T];
      else if (Array.isArray(value)) result[key] = value.map(text => typeof text === 'string' ? message.text(text) : text) as T[keyof T];
    }
    return result;
  }), [message]);
}
