// Object.keys(import.meta.glob(...)) is compiled to filenames by Vite: no Markdown body imports.
const chinese = Object.keys(import.meta.glob('../content/docs/*.md'));
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
  label: paired ? '篇文档，中英各一版' : '篇文档（中文 / 英文）',
  description: paired
    ? '篇文档，中英各一版；缺译文时回落中文并在页头注明。'
    : '篇文档（中文 / 英文）；缺译文时回落中文并在页头注明。',
};
