/** ISO 639-1 codes identify available site content; names are always autonyms. */
export const SITE_LANGUAGES = [
  { code: 'zh', name: '简体中文', htmlLang: 'zh-CN', dateLocale: 'zh-CN' },
  { code: 'en', name: 'English', htmlLang: 'en', dateLocale: 'en-US' },
  { code: 'eo', name: 'Esperanto', htmlLang: 'eo', dateLocale: 'eo' },
] as const;
export type Locale = (typeof SITE_LANGUAGES)[number]['code'];
export function isLocale(value: unknown): value is Locale {
  return SITE_LANGUAGES.some(language => language.code === value);
}
/** BCP 47 tag used for dates and numbers in this site language. */
export function dateLocale(locale: Locale): string {
  return SITE_LANGUAGES.find(language => language.code === locale)?.dateLocale ?? 'en-US';
}
