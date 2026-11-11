// Shared engine policy for compilation and automatic preview eligibility. No Node or DOM APIs.
export function detectEngine(text, requested) {
  const magic = text.match(/^\s*%\s*!TEX\s+program\s*=\s*(\w+)/im);
  const value = (magic?.[1] || '').toLowerCase();
  if (value === 'xelatex' || value === 'lualatex' || value === 'pdflatex') return value;
  if (/\\documentclass(?:\[[^\]]*\])?\{(?:ltjs|luatexja)|\\usepackage(?:\[[^\]]*\])?\{luatexja\}/.test(text)) return 'lualatex';
  if (/\\documentclass(?:\[[^\]]*\])?\{ctex|\\usepackage(?:\[[^\]]*\])?\{[^}]*\b(?:ctex|xeCJK|fontspec|polyglossia)\b|\\setCJKmainfont/.test(text)) return 'xelatex';
  if (requested && ['pdflatex', 'xelatex', 'lualatex'].includes(requested)) return requested;
  return 'pdflatex';
}
