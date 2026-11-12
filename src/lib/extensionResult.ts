import type { ExtensionResult } from '../../packages/extension-sdk';
export function validateResult(result: ExtensionResult, source: string): ExtensionResult {
  if (!result || typeof result !== 'object' || Array.isArray(result) || JSON.stringify(result).length > 4 * 1024 * 1024) throw new Error('Invalid extension result');
  for (const key of ['message', 'content'] as const) if (result[key] !== undefined && typeof result[key] !== 'string') throw new Error('Invalid extension text');
  if (result.edits !== undefined) {
    if (!Array.isArray(result.edits) || result.edits.length > 1000) throw new Error('Invalid extension edits');
    let end = -1;
    for (const edit of result.edits) {
      if (!Number.isInteger(edit.from) || !Number.isInteger(edit.to) || edit.from < 0 || edit.to < edit.from || edit.to > source.length || edit.from < end || typeof edit.insert !== 'string') throw new Error('Invalid or overlapping extension edits');
      end = edit.to;
    }
  }
  if (result.diagnostics !== undefined && (!Array.isArray(result.diagnostics) || result.diagnostics.length > 2000 || result.diagnostics.some(d => !Number.isInteger(d.from) || !Number.isInteger(d.to) || d.from < 0 || d.to < d.from || d.to > source.length || !['error', 'warning', 'info'].includes(d.severity) || typeof d.message !== 'string'))) throw new Error('Invalid extension diagnostics');
  if (result.completions !== undefined && (!Array.isArray(result.completions) || result.completions.length > 500 || result.completions.some(c => typeof c.label !== 'string' || typeof c.template !== 'string'))) throw new Error('Invalid extension completions');
  if (result.output && (typeof result.output.name !== 'string' || /[/\\:\x00-\x1f]/.test(result.output.name) || !result.output.name || typeof result.output.content !== 'string')) throw new Error('Invalid extension export');
  if (result.project && (typeof result.project.name !== 'string' || !['pdflatex', 'xelatex', 'lualatex'].includes(result.project.engine) || !Array.isArray(result.project.files) || !result.project.files.length || result.project.files.length > 100 || result.project.files.some(f => typeof f.path !== 'string' || /[\\:\x00-\x1f]/.test(f.path) || f.path.startsWith('/') || f.path.split('/').some(p => !p || p === '..' || p === '.') || typeof f.content !== 'string'))) throw new Error('Invalid extension project');
  if (result.action !== undefined && result.action !== 'compile') throw new Error('Unsupported extension request');
  return result;
}
