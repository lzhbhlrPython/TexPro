// Object.keys(import.meta.glob(...)) is compiled to filenames by Vite: no Markdown body imports.
const chinese = Object.keys(import.meta.glob('../content/docs/zh/*.md'));
const english = new Set(
  Object.keys(import.meta.glob('../content/docs/en/*.md')).map((file) => file.split('/').pop()),
);

export const DOC_COUNTS = {
  zh: chinese.length,
  en: chinese.filter((file) => english.has(file.split('/').pop())).length,
};

const paired = DOC_COUNTS.zh === DOC_COUNTS.en;
export const DOC_METRIC = {
  value: paired ? `${DOC_COUNTS.zh} × 2` : `${DOC_COUNTS.zh} / ${DOC_COUNTS.en}`,
  label: paired ? "site.docs.chinese.and.english.editions" : "site.docs.chinese.english",
  description: paired
    ? "site.documents.chinese.and.english.editions.missing.translations.fall.back"
    : "site.documents.chinese.english.missing.translations.fall.back.to.chinese",
};
