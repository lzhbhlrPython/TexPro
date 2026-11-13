import { useSyncExternalStore } from 'react';
import type { LanguagePack } from '../packages/extension-sdk';
import type { Language } from './types';

export type MessageId = keyof typeof import('../packages/extension-sdk/lib/locale-source.json');
type Variables = Record<string, string | number>;
const STORAGE_KEY = 'texpro.lang';
const listeners = new Set<() => void>();
let revision = 0;
let english: Partial<Record<MessageId, string>> = {};
let englishRequest: Promise<void> | undefined;
let packRequest = 0;
const packs = new Map<string, LanguagePack>();
let requestedLanguage = (() => { try { return localStorage.getItem(STORAGE_KEY) || navigator.language; } catch { return 'en'; } })();
let currentLanguage: Language = 'en';
function notify() { revision++; listeners.forEach(listener => listener()); }
function loadEnglish() {
  return englishRequest ??= import('../packages/extension-sdk/lib/locale-source.json').then(module => { english = module.default; }).catch(error => { englishRequest = undefined; throw error; });
}
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
  packs.clear();
  for (const pack of values) if (pack.catalogVersion === 2 && pack.id !== 'en') packs.set(pack.id, pack);
  setLanguage(requestedLanguage);
  notify();
}
async function refreshLanguages() {
  const request = ++packRequest;
  try {
    const values = await window.texpro.languagePacks();
    if (request === packRequest) updateLanguagePacks(values);
  } catch { if (request === packRequest) updateLanguagePacks([]); }
}
export async function initializeLanguages() {
  await loadEnglish();
  window.texpro.onExtensionsChanged(() => { void refreshLanguages(); });
  await refreshLanguages();
}
export function getLanguage(): Language { return currentLanguage; }
export function formatShortcut(value: string): string {
  if (typeof navigator === 'undefined' || /Mac|iPhone|iPad/.test(navigator.platform)) return value;
  return value.replace(/⌘\s*/g, 'Ctrl+').replace(/⇧\s*/g, 'Shift+').replace(/⌥\s*/g, 'Alt+').replace(/↩/g, 'Enter');
}
function translate(language: Language, id: MessageId, vars?: Variables) {
  const text = packs.get(language)?.messages[id] ?? english[id] ?? `[${id}]`;
  return formatShortcut(text.replace(/\{(\w+)\}/g, (match, key) => vars?.[key] === undefined ? match : String(vars[key])));
}
function translator(language: Language) {
  return Object.assign((id: MessageId, vars?: Variables) => translate(language, id, vars), {
    // Explicit display boundary for mixed host labels and author/user data. Never use prose as a lookup key.
    text: (value: string, vars?: Variables) => Object.hasOwn(english, value) ? translate(language, value as MessageId, vars) : value,
  });
}
export const msg = Object.assign((id: MessageId, vars?: Variables) => translate(currentLanguage, id, vars), {
  text: (value: string, vars?: Variables) => translator(currentLanguage).text(value, vars),
});
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useI18n() {
  useSyncExternalStore(subscribe, () => revision, () => revision);
  return { language: currentLanguage, setLanguage, msg: translator(currentLanguage) };
}
