import { skipTexSpace, texCommands, texGroup } from '../../texDocument';
import type { Projection, ProjectionProvider, WritingSource } from '../types';

export interface MathProjection { tex: string; display: boolean; label: string | null; focus: number }
function mathData(tex: string, display: boolean, focus: number, environment = ''): MathProjection {
  let label: string | null = null;
  const changes: Array<{ from: number; to: number }> = [];
  for (const command of texCommands(tex)) {
    if (command.name === 'label') {
      const group = texGroup(tex, skipTexSpace(tex, command.to));
      if (group) { label = tex.slice(group.from + 1, group.to - 1); changes.push({ from: command.from, to: group.to }); }
    } else if (command.name === 'nonumber' || command.name === 'notag') changes.push(command);
  }
  for (const change of changes.reverse()) tex = tex.slice(0, change.from) + tex.slice(change.to);
  tex = tex.trim();
  if (environment && /^(align|eqnarray|gather)/.test(environment)) {
    const wrapper = /^(align|eqnarray)/.test(environment) ? 'aligned' : 'gathered';
    tex = `\\begin{${wrapper}}${tex}\\end{${wrapper}}`;
  }
  return { tex, display, label, focus };
}

function closing(source: WritingSource, from: number, delimiter: string) {
  for (let at = from; at < source.text.length; at++) {
    if (source.protectedRanges.some(range => at >= range.from && at < range.to)) continue;
    if (source.text.startsWith(delimiter, at)) return at;
    if (source.text[at] === '\\') at++;
    if (delimiter === '$' && source.text[at] === '\n') return -1;
  }
  return -1;
}

export const mathProvider: ProjectionProvider = {
  id: 'tex.math', priority: 100,
  project({ source }) {
    const result: Projection<MathProjection>[] = [];
    const occupied = source.environments.filter(env => /^(equation|align|gather|multline|eqnarray)\*?$/.test(env.name));
    const blockedRanges = [...source.protectedRanges, ...occupied].sort((a, b) => a.from - b.from);
    for (const env of occupied) result.push({ kind: 'math', from: env.from, to: env.to, data: mathData(source.text.slice(env.bodyFrom, env.bodyTo), true, env.bodyFrom, env.name) });
    for (let at = source.bodyFrom; at < source.text.length; at++) {
      const blocked = blockedRanges.find(range => at >= range.from && at < range.to);
      if (blocked) { at = blocked.to - 1; continue; }
      const from = at;
      let open = '', close = '';
      if (source.text.startsWith('$$', at)) { open = close = '$$'; }
      else if (source.text[at] === '$') { open = close = '$'; }
      else if (source.text.startsWith('\\[', at)) { open = '\\['; close = '\\]'; }
      else if (source.text.startsWith('\\(', at)) { open = '\\('; close = '\\)'; }
      else { if (source.text[at] === '\\') at++; continue; }
      const end = closing(source, at + open.length, close);
      if (end < 0) continue;
      const to = end + close.length;
      result.push({ kind: 'math', from, to, data: mathData(source.text.slice(from + open.length, end), open === '$$' || open === '\\[', from + open.length) });
      at = to - 1;
    }
    return result;
  },
};
