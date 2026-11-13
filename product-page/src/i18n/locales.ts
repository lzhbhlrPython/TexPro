/** ISO 639-1 codes identify available site content; names are always autonyms. */
export const SITE_LANGUAGES = [
  { code: 'zh', name: '简体中文', htmlLang: 'zh-CN' },
  { code: 'en', name: 'English', htmlLang: 'en' },
] as const;
export type Locale = (typeof SITE_LANGUAGES)[number]['code'];
export function isLocale(value: unknown): value is Locale {
  return SITE_LANGUAGES.some(language => language.code === value);
}
