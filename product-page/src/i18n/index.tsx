import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { EN } from '@/i18n/en';

import { isLocale, SITE_LANGUAGES, type Locale } from './locales';
export type { Locale } from './locales';

interface LocaleValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'texpro:locale';
const LocaleContext = createContext<LocaleValue>({ locale: 'zh', setLocale: () => {}, toggle: () => {} });

function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* 隐私模式：当作没存过 */
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale());

  useEffect(() => {
    document.documentElement.lang = SITE_LANGUAGES.find(language => language.code === locale)?.htmlLang ?? 'en';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 忽略 */
    }
  }, []);

  const value = useMemo<LocaleValue>(
    () => ({ locale, setLocale, toggle: () => setLocale(locale === 'zh' ? 'en' : 'zh') }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  return useContext(LocaleContext);
}

/** 中文原文 → 当前语言。英文缺条目时回落到中文，保证界面永远不空。 */
export function useT(): (zh: string) => string {
  const { locale } = useLocale();
  return useMemo(() => (zh: string) => (locale === 'zh' ? zh : EN[zh] ?? zh), [locale]);
}

/**
 * 把数据表里所有字符串按词典翻一遍（数组、对象递归）。
 * 结构化字段（key / href / pattern）不在词典里，会原样返回。
 */
export function useLocalize(): <T>(value: T) => T {
  const t = useT();
  return useMemo(() => {
    const walk = (value: unknown): unknown => {
      if (typeof value === 'string') return t(value);
      if (Array.isArray(value)) return value.map(walk);
      if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, walk(inner)]));
      }
      return value;
    };
    return <T,>(value: T) => walk(value) as T;
  }, [t]);
}
