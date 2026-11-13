/** Explicit fence labels only: prose, logs and unknown languages remain literal. */
const aliases: Record<string, string> = {
  sh: 'shellscript', bash: 'shellscript', shell: 'shellscript', shellscript: 'shellscript',
  tex: 'latex', latex: 'latex', json: 'json', jsonc: 'jsonc',
  js: 'javascript', javascript: 'javascript', ts: 'typescript', typescript: 'typescript',
  jsx: 'jsx', tsx: 'tsx', css: 'css', scss: 'scss', less: 'less',
  html: 'html', xml: 'html', yaml: 'yaml', yml: 'yaml', toml: 'toml',
  md: 'markdown', markdown: 'markdown', diff: 'diff',
  powershell: 'powershell', ps1: 'powershell', pwsh: 'powershell',
};
export function codeLanguage(label?: string): string | undefined {
  const key = label?.trim().toLowerCase() ?? '';
  return Object.hasOwn(aliases, key) ? aliases[key] : undefined;
}
