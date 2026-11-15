import { geometryAdapters, geometryAdapter } from '../../electron/services/geometry-core.mjs';
import { skipTexSpace, texGroup, texCommands, texEnvironments, texDocumentStart, texDocumentClass } from '../../electron/services/tex-source-core.mjs';
export { skipTexSpace, texGroup, texCommands, texEnvironments, texDocumentStart, texDocumentClass } from '../../electron/services/tex-source-core.mjs';
export type { TexRange, TexCommand, TexEnvironment } from '../../electron/services/tex-source-core.mjs';
import type { TexRange, TexCommand, TexEnvironment } from '../../electron/services/tex-source-core.mjs';

export function isCtexClass(name: string): boolean {
  return /^ctex(?:art|rep|book|beamer)$/.test(name);
}

/** Layout owns size, paper and columns; language, fonts and class-specific options stay intact. */
export function updateLayoutClassOptions(text: string, replacement: string): string {
  const declaration = texDocumentClass(text);
  if (!declaration) return text;
  const split = (value: string) => {
    const parts: string[] = []; let part = '', depth = 0;
    for (let at = 0; at < value.length; at++) {
      const char = value[at];
      if (char === '\\') { part += char + (value[++at] || ''); continue; }
      if (char === '%') { const end = value.indexOf('\n', at); if (end < 0) break; at = end; part += ' '; continue; }
      if (char === '{') depth++;
      if (char === '}') depth--;
      if (char === ',' && depth === 0) { if (part.trim()) parts.push(part.trim()); part = ''; }
      else part += char;
    }
    if (part.trim()) parts.push(part.trim());
    return parts;
  };
  const original = declaration.options ? text.slice(declaration.options.from + 1, declaration.options.to - 1) : '';
  const managed = /^(?:\d+(?:\.\d+)?pt|(?:a\d|b\d|c\d|letter|legal|executive|ansi[a-e]|jisb\d)paper|onecolumn|twocolumn)$/;
  const options = [...new Set([...split(original).filter(option => !managed.test(option)), ...split(replacement)])].join(',');
  const from = declaration.options?.from ?? declaration.command.to;
  const to = declaration.options?.to ?? from;
  return text.slice(0, from) + `[${options}]` + text.slice(to);
}

export interface DiagramBlock extends TexRange { source: string; adapter?: string; kind: 'tikz' | 'circuit' | 'chemistry' }
export function diagramBlocks(text: string): DiagramBlock[] {
  const bodyStart = texDocumentStart(text)?.to ?? 0;
  const names = geometryAdapters.flatMap(adapter => [...adapter.environments]);
  const blocks: DiagramBlock[] = texEnvironments(text, names).map(block => {
    const adapter = geometryAdapter(text.slice(block.from, block.to), text.slice(0, bodyStart))!;
    return { ...block, source: text.slice(block.from, block.to), kind: adapter.kind, adapter: adapter.id };
  });
  for (const command of texCommands(text)) {
    const name = /^(?:xymatrix|Qcircuit)@/.test(command.name) ? command.name.split('@')[0] : command.name;
    const adapter = geometryAdapters.find(candidate => candidate.commands.includes(name));
    if (!adapter) continue;
    let at = skipTexSpace(text, command.from + 1 + name.length);
    if (!adapter.argument && text[at] === '[') { const options = texGroup(text, at, '[', ']'); if (!options) continue; at = skipTexSpace(text, options.to); }
    if (['xymatrix', 'Qcircuit'].includes(name)) {
      // Known Xy-pic spacing modifiers; reject arbitrary tokens before the matrix.
      const modifiers = /^(?:@[A-Za-z]?(?:!?[=+\-])?(?:[0-9.]+(?:em|ex|pt|pc|cm|mm)|[A-Za-z])?\s*)*/.exec(text.slice(at));
      at += modifiers?.[0].length || 0;
    }
    const group = adapter.argument === 'bracket' ? texGroup(text, at, '[', ']') : texGroup(text, at);
    if (group) {
      const after = skipTexSpace(text, group.to);
      const to = adapter.terminator && text[after] === adapter.terminator ? after + 1 : group.to;
      blocks.push({ from: command.from, to, source: text.slice(command.from, to), kind: adapter.kind, adapter: adapter.id });
    }
  }
  const result: DiagramBlock[] = [];
  for (const block of blocks.sort((a, b) => a.from - b.from || b.to - a.to)) {
    if (block.from < bodyStart) continue;
    if (!result.some(b => block.from >= b.from && block.to <= b.to)) result.push(block);
  }
  return result;
}

export interface TableCell extends TexRange { text: string }
export interface WritingTable extends TexEnvironment { rows: TableCell[][]; aligns: string[]; columns: TexRange[]; rowEnds: number[]; rowEnd: number; terminated: boolean }

/** Only expose cells when their source is unambiguous and every surrounding token can survive. */
export function writingTable(text: string, block: TexEnvironment): WritingTable | null {
  let at = skipTexSpace(text, block.bodyFrom);
  if (text[at] === '[') { const option = texGroup(text, at, '[', ']'); if (!option) return null; at = skipTexSpace(text, option.to); }
  if (block.name === 'tabularx') { const width = texGroup(text, at); if (!width) return null; at = skipTexSpace(text, width.to); }
  const spec = texGroup(text, at);
  if (!spec) return null;
  const aligns: string[] = [];
  const columns: TexRange[] = [];
  for (let i = spec.from + 1; i < spec.to - 1; i++) {
    const c = text[i];
    if (/\s|\|/.test(c)) continue;
    if (/[lcrX]/.test(c)) { aligns.push(c === 'X' ? 'l' : c); columns.push({ from: i, to: i + 1 }); }
    else if (/[pmb@!><]/.test(c)) {
      const group = texGroup(text, skipTexSpace(text, i + 1));
      if (!group || group.to >= spec.to) return null;
      if (/[pmb]/.test(c)) { aligns.push('l'); columns.push({ from: i, to: group.to }); }
      i = group.to - 1;
    } else return null;
  }
  if (!aligns.length || aligns.length > 24) return null;
  at = spec.to;
  let cellFrom = at, depth = 0, row: TableCell[] = [], rowEnd = at;
  const rows: TableCell[][] = [];
  const rowEnds: number[] = [];
  let terminated = true;
  const cell = (to: number) => {
    const raw = text.slice(cellFrom, to), leading = raw.length - raw.trimStart().length;
    const from = cellFrom + leading, end = Math.max(from, to - (raw.length - raw.trimEnd().length));
    return { from, to: end, text: text.slice(from, end) };
  };
  while (at < block.bodyTo) {
    const c = text[at];
    if (c === '%') return null; // Comments can change row semantics; keep them in the source editor.
    if (c === '{') depth++;
    if (c === '}' && --depth < 0) return null;
    if (c === '\\') {
      const command = /^\\([a-zA-Z@]+|.)/.exec(text.slice(at));
      if (!command) return null;
      const name = command[1];
      if (['multicolumn', 'multirow', 'begin', 'end', 'verb', 'catcode', 'omit', 'span', 'endhead', 'endfirsthead', 'endfoot', 'endlastfoot'].includes(name)) return null;
      if (!depth && ['toprule', 'midrule', 'bottomrule', 'hline', 'addlinespace'].includes(name)) {
        if (row.length || text.slice(cellFrom, at).trim()) return null;
        at += command[0].length;
        const optionAt = skipTexSpace(text, at);
        if (text[optionAt] === '[') { const option = texGroup(text, optionAt, '[', ']'); if (!option) return null; at = option.to; }
        cellFrom = at;
        continue;
      }
      if (!depth && name === '\\') {
        row.push(cell(at));
        if (row.length !== aligns.length) return null;
        rows.push(row); row = [];
        at += 2;
        if (text[at] === '*') at++;
        if (text[at] === '[') { const option = texGroup(text, at, '[', ']'); if (!option) return null; at = option.to; }
        rowEnd = at;
        rowEnds.push(at);
        cellFrom = at;
        continue;
      }
      at += command[0].length;
      continue;
    }
    if (!depth && c === '&') { row.push(cell(at)); cellFrom = at + 1; }
    at++;
  }
  if (depth) return null;
  if (row.length || text.slice(cellFrom, block.bodyTo).trim()) {
    row.push(cell(block.bodyTo));
    if (row.length !== aligns.length) return null;
    rows.push(row); rowEnd = block.bodyTo; rowEnds.push(rowEnd); terminated = false;
  }
  if (!rows.length || rows.length > 200) return null;
  return { ...block, rows, aligns, columns, rowEnds, rowEnd, terminated };
}

export function appendWritingRow(table: WritingTable) {
  return { from: table.rowEnd, insert: (table.terminated ? '' : ' \\\\') + '\n' + Array.from({ length: table.aligns.length }, () => ' ').join('&') + ' \\\\' };
}

export function ensureTexPackages(text: string, packages: string[]): string {
  const document = [...texCommands(text)].find(c => c.name === 'begin' && text.slice(c.to).match(/^\s*\{document\}/));
  if (!document) return text;
  const installed = new Set<string>();
  if (isCtexClass(texDocumentClass(text)?.name || '')) installed.add('ctex');
  for (const command of texCommands(text.slice(0, document.from))) {
    if (command.name !== 'usepackage' && command.name !== 'RequirePackage') continue;
    let at = skipTexSpace(text, command.to);
    if (text[at] === '[') { const option = texGroup(text, at, '[', ']'); if (!option) continue; at = skipTexSpace(text, option.to); }
    const group = texGroup(text, at);
    if (group) text.slice(group.from + 1, group.to - 1).split(',').forEach(p => installed.add(p.trim()));
  }
  const missing = [...new Set(packages)].filter(p => /^[a-zA-Z0-9-]+$/.test(p) && !installed.has(p));
  return text.slice(0, document.from) + missing.map(p => `\\usepackage${p === 'ctex' ? '[UTF8,fontset=fandol]' : ''}{${p}}\n`).join('') + text.slice(document.from);
}

/** Replace only our layout block. Existing package options belong to the author. */
export function applyLayoutPreamble(source: string, classOptions: string, generated: string): string {
  let text = updateLayoutClassOptions(source, classOptions);
  const document = texDocumentStart(text);
  if (!document) return source;
  const preamble = text.slice(0, document.from).replace(/^% TeXPro layout begin\r?\n[\s\S]*?^% TeXPro layout end(?:\r?\n|$)/gm, '');
  const installed = new Set<string>();
  if (isCtexClass(texDocumentClass(preamble)?.name || '')) installed.add('ctex');
  for (const command of texCommands(preamble)) {
    if (!['usepackage', 'RequirePackage'].includes(command.name)) continue;
    let at = skipTexSpace(preamble, command.to);
    const options = preamble[at] === '[' ? texGroup(preamble, at, '[', ']') : null;
    if (options) at = skipTexSpace(preamble, options.to);
    const group = texGroup(preamble, at);
    if (group) preamble.slice(group.from + 1, group.to - 1).split(',').forEach(name => installed.add(name.trim()));
  }
  const block = generated.replace(/\\usepackage(?:\[([^\]]*)\])?\{([^}]+)\}/g, (declaration, options: string | undefined, names: string) => {
    const missing = names.split(',').map(name => name.trim()).filter(name => !installed.has(name));
    if (!missing.length) return names.trim() === 'geometry' && options ? `\\geometry{${options}}` : '';
    missing.forEach(name => installed.add(name));
    return `\\usepackage${options ? `[${options}]` : ''}{${missing.join(',')}}`;
  }).replace(/^\s*\n/gm, '');
  text = `${preamble}% TeXPro layout begin\n${block}\n% TeXPro layout end\n${text.slice(document.from)}`;
  return text;
}
