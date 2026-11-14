/** ISO 639-1 codes identify available site content; names are always autonyms. */
interface Language { code: string; name: string; htmlLang: string; dateLocale: string; componentLocale: string }
const definitions = import.meta.glob<Language>('./languages/*.json', { eager: true, import: 'default' });
export const SITE_LANGUAGES = Object.values(definitions).sort((a, b) => a.code.localeCompare(b.code));
export type Locale = string;
export function isLocale(value: unknown): value is Locale {
  return SITE_LANGUAGES.some(language => language.code === value);
}
/** BCP 47 tag used for dates and numbers in this site language. */
export function dateLocale(locale: Locale): string {
  return SITE_LANGUAGES.find(language => language.code === locale)?.dateLocale ?? 'en-US';
}

export function htmlLang(locale: string): string {
  return SITE_LANGUAGES.find(language => language.code === locale)?.htmlLang ?? locale;
}
