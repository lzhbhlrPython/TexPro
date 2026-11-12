import { useSyncExternalStore } from 'react';
import englishMessages from '../packages/extension-sdk/lib/locale-source.json';
import type { LanguagePack } from '../packages/extension-sdk';
import type { Language } from './types';

const STORAGE_KEY = 'texpro.lang';
const listeners = new Set<() => void>();
let revision = 0;
function notify() { revision++; listeners.forEach(listener => listener()); }

const packs = new Map<string, LanguagePack>();
let requestedLanguage = (() => { try { return localStorage.getItem(STORAGE_KEY) || navigator.language; } catch { return 'en'; } })();
let currentLanguage: Language = 'en';
function resolveLanguage(language: string) {
  if (typeof language !== 'string') return 'en';
  if (language === 'en' || packs.has(language)) return language;
  const base = language.split('-')[0];
  return packs.has(base) ? base : 'en';
}
export function availableLanguages() { return [{ id: 'en', title: 'English' }, ...[...packs.values()].map(({ id, title }) => ({ id, title }))]; }
export function setLanguage(language: Language) {
  requestedLanguage = language;
  const next = resolveLanguage(language), changed = next !== currentLanguage;
  currentLanguage = next;
  try { localStorage.setItem(STORAGE_KEY, language); } catch { /* storage is optional */ }
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : next;
  if (changed) notify();
}
export function updateLanguagePacks(values: LanguagePack[]) {
  packs.clear(); for (const pack of values) if (pack.id !== 'en') packs.set(pack.id, pack);
  setLanguage(requestedLanguage);
  notify();
}
export async function initializeLanguages() {
  try { updateLanguagePacks(await window.texpro.languagePacks()); } catch { updateLanguagePacks([]); }
  window.texpro.onExtensionsChanged(() => { void window.texpro.languagePacks().then(updateLanguagePacks).catch(() => updateLanguagePacks([])); });
}

export function getLanguage(): Language {
  return currentLanguage;
}

const en: Record<string, string> = englishMessages;

export function formatShortcut(value: string): string {
  if (typeof navigator === 'undefined' || /Mac|iPhone|iPad/.test(navigator.platform)) return value;
  return value.replace(/⌘\s*/g, 'Ctrl+').replace(/⇧\s*/g, 'Shift+').replace(/⌥\s*/g, 'Alt+').replace(/↩/g, 'Enter');
}

function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export function t(key: string, vars?: Record<string, string | number>): string {
  const table = packs.get(currentLanguage)?.messages || en;
  return formatShortcut(interpolate(table[key] ?? en[key] ?? key, vars));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useI18n() {
  useSyncExternalStore(subscribe, () => revision, () => revision);
  const language = currentLanguage;
  return {
    language,
    setLanguage,
    t: (key: string, vars?: Record<string, string | number>) => {
      const table = packs.get(language)?.messages || en;
      return formatShortcut(interpolate(table[key] ?? en[key] ?? key, vars));
    },
  };
}
