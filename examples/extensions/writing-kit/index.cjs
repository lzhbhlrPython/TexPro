// @ts-check
/** @param {import('../../../packages/extension-sdk').ExtensionContext} ctx */
exports.activate = function activate(ctx) {
  const tr = (context, en, zh) => context.language === 'zh' ? zh : en;
  const escape = text => String(text).replace(/[\\{}%&#_$^~]/g, value => ({ '\\': '\\textbackslash{}', '^': '\\textasciicircum{}', '~': '\\textasciitilde{}' }[value] || '\\' + value));
  ctx.handle('uppercase', async (context, input) => {
    // Optional delay also makes stale-result recovery reproducible during development.
    const delay = Math.min(1500, Math.max(0, Number(input.delay) || 0));
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const { from, to } = context.selection;
    return from === to ? { message: tr(context, 'Select text in the editor first.', '请先在正文中选中文字。') } : { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
  ctx.handle('check-notes', context => {
    const marker = String(ctx.config['note-word'] || 'TODO'), diagnostics = [];
    let from = context.source.indexOf(marker);
    while (from >= 0 && diagnostics.length < 100) { diagnostics.push({ from, to: from + marker.length, severity: /** @type {const} */ ('info'), message: tr(context, `${marker}: revision remains open`, `${marker}：修订尚未完成`) }); from = context.source.indexOf(marker, from + marker.length); }
    return { diagnostics, message: tr(context, `${diagnostics.length} revision markers`, `${diagnostics.length} 处修订标记`) };
  });
  ctx.handle('completions', context => ({ completions: [{ label: '\\writingnote', template: '\\textit{|}', detail: tr(context, 'Writing kit', '写作工具包') }] }));
  ctx.handle('explain', (context, input) => ({ content: tr(context, `Writing kit: ${context.source.slice(0, Number(input.position) || context.selection.from).split('\n').length} lines before this position.`, `写作工具包：此位置前有 ${context.source.slice(0, Number(input.position) || context.selection.from).split('\n').length} 行。`) }));
  ctx.handle('source-preview', context => ({ content: context.source.slice(context.selection.from, context.selection.to) || context.source }));
  ctx.handle('plain-import', (context, input) => ({ project: { name: tr(context, 'Imported note', '导入短笺'), engine: 'pdflatex', files: [{ path: 'main.tex', content: `\\documentclass{article}\n\\begin{document}\n${escape(input.text || '')}\n\\end{document}\n` }] } }));
  ctx.handle('source-export', context => ({ output: { name: 'document.tex', content: context.source } }));
  ctx.handle('bib-entry', (_context, input) => ({ output: { name: 'entry.bib', content: `@misc{${String(input.key || 'note').replace(/[^a-zA-Z0-9:_-]/g, '') || 'note'},\n  title = {${escape(input.title || input.text || 'Untitled')}},\n  author = {${escape(input.author || '')}}\n` } }));
  ctx.handle('csv-points', (context, input) => {
    const rows = String(input.text || '').trim().split(/\r?\n/).filter(Boolean).map(row => row.split(',').map(Number));
    if (!rows.length || rows.some(row => row.length !== 2 || row.some(value => !Number.isFinite(value)))) throw new Error(tr(context, 'Provide two numeric CSV columns, one point per line.', '请提供两列数字 CSV，每行一个坐标点。'));
    return { output: { name: 'coordinates.tex', content: `\\addplot coordinates { ${rows.map(([x, y]) => `(${x},${y})`).join(' ')} };` } };
  });
  ctx.handle('word-count', async context => {
    const count = context.source.trim() ? context.source.trim().split(/\s+/).length : 0;
    await context.services.call('storage.set', { key: 'last-count', value: count });
    return { content: JSON.stringify({ words: count, characters: context.source.length }, null, 2) };
  });
  ctx.handle('request-build', context => ({ action: 'compile', message: tr(context, 'Build uses TeXPro’s existing save and main-file workflow.', '构建沿用 TeXPro 现有保存与主文件流程。') }));
  ctx.onDispose(() => ctx.log('Writing kit disposed'));
};
