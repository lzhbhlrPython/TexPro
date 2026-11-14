const SITE_LANGUAGES = Object.keys(import.meta.glob('../i18n/languages/*.json')).map(path => ({ code: path.split('/').pop()!.replace(/\.json$/, '') }));
const files = Object.keys(import.meta.glob('../content/docs/*/*.md'));
const canonical = new Set(files.filter(file => file.includes('/zh/')).map(file => file.split('/').pop()));
export const DOC_COUNTS: Record<string, number> = Object.fromEntries(SITE_LANGUAGES.map(({ code }) => [code, files.filter(file => file.split('/').at(-2) === code && canonical.has(file.split('/').pop())).length]));
export const DOC_METRIC = {
  value: SITE_LANGUAGES.map(({ code }) => DOC_COUNTS[code]).join(' / '),
  label: 'site.docs.languages',
  description: 'site.docs.translation.fallback',
};
