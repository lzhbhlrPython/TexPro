import { isLocale, type Locale } from './locales';
export type MessageId = keyof typeof import('./messages/en.json');
export type Messages = Record<MessageId, string>;
const discovered = import.meta.glob('./messages/*.json', { eager: true, query: '?url', import: 'default' });
const resources = Object.fromEntries(Object.entries(discovered).map(([path, url]) => [path.split('/').pop()!.replace(/\.json$/, ''), url as string]));
const requests = new Map<Locale, Promise<Messages>>();
export function loadMessages(locale: Locale): Promise<Messages> {
  if (!isLocale(locale) || !resources[locale]) return Promise.reject(new Error(`Unregistered language: ${locale}`));
  let request = requests.get(locale);
  if (!request) {
    request = fetch(resources[locale], { credentials: 'omit', cache: 'no-cache' }).then(async response => {
      if (!response.ok || !response.headers.get('content-type')?.includes('json')) throw new Error(`Language resource unavailable: ${locale}`);
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length || Object.entries(value).some(([id, text]) => !/^site\.[a-z0-9.]+$/.test(id) || typeof text !== 'string')) throw new Error(`Invalid language catalogue: ${locale}`);
      return value as Messages;
    }).catch(error => { requests.delete(locale); throw error; });
    requests.set(locale, request);
  }
  return request;
}
export function initialLocale(): Locale {
  try { const stored = localStorage.getItem('texpro:locale'); if (isLocale(stored)) return stored; } catch { /* optional storage */ }
  const browser = navigator.language.toLowerCase().split('-')[0];
  return isLocale(browser) ? browser : 'en';
}
let initial: { locale: Locale; messages: Messages; fallback: Messages; startupFailure: boolean };
export async function initializeLocale() {
  const fallback = await loadMessages('en');
  const locale = initialLocale();
  try { initial = { locale, messages: await loadMessages(locale), fallback, startupFailure: false }; }
  catch { initial = { locale: 'en', messages: fallback, fallback, startupFailure: true }; }
}
export function initialCatalog() { return initial; }
