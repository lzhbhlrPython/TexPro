import { skipTexSpace, texEnvironments, texGroup } from '../../texDocument';
import type { Projection, ProjectionProvider } from '../types';
import type { FormatProjection } from './format';

/** Page-only controls and full-width wrappers have no page geometry in continuous prose. */
export const flowProvider: ProjectionProvider = {
  id: 'tex.flow', priority: 70,
  project({ source }) {
    const { text } = source, result: Projection[] = [];
    for (const block of texEnvironments(text, ['center', 'minipage'])) {
      let to = block.bodyFrom;
      if (block.name === 'minipage') {
        const width = texGroup(text, skipTexSpace(text, to));
        if (!width || !/^\\(?:line|text)width$/.test(text.slice(width.from + 1, width.to - 1).trim())) continue;
        to = width.to;
      }
      result.push({ kind: 'flow', from: block.from, to, data: null }, { kind: 'flow', from: block.bodyTo, to: block.to, data: null });
    }
    for (const command of source.commands) {
      const { from } = command;
      if (['par', 'smallskip', 'medskip', 'bigskip', 'centering', 'raggedright', 'raggedleft', 'noindent'].includes(command.name)) {
        const lineEnd = text.indexOf('\n', command.to), tail = text.slice(command.to, lineEnd < 0 ? text.length : lineEnd);
        if (command.name === 'par' && tail.replace(/\\(?:smallskip|medskip|bigskip|centering|noindent)\b/g, '').trim()) continue;
        result.push({ kind: 'flow', from, to: command.to, data: null });
      } else if (command.name === 'Needspace') {
        const size = texGroup(text, skipTexSpace(text, command.to));
        if (size) result.push({ kind: 'flow', from, to: size.to, data: null });
      } else if (['small', 'footnotesize'].includes(command.name)) {
        let open = from - 1; while (open >= 0 && /\s/.test(text[open])) open--;
        const group = texGroup(text, open);
        const contentFrom = skipTexSpace(text, command.to);
        if (group && contentFrom < group.to - 1) result.push({ kind: 'format', from: open, to: group.to, data: { contentFrom, contentTo: group.to - 1, class: 'cm-prose-small' } satisfies FormatProjection });
      }
    }
    return result;
  },
};
