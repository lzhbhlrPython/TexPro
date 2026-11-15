import { skipTexSpace, texGroup } from '../../texDocument';
import { projectTextFormats } from '../project';
import type { Projection, ProjectionProvider } from '../types';

export interface FormatProjection { contentFrom: number; contentTo: number; class?: string; color?: string; href?: string }
export function createFormatProvider(): ProjectionProvider {
  let preamble: string | undefined;
  let inherited: ReturnType<typeof projectTextFormats> = {};
  const formats: Record<string, string> = { textbf: 'cm-bold', texttt: 'cm-inline-code', underline: 'cm-underline', textsc: 'cm-smallcaps', textit: 'cm-italic', emph: 'cm-italic', textsl: 'cm-italic' };
  return {
    id: 'tex.format', priority: 80,
    project(frame) {
      if (preamble !== frame.preamble) { preamble = frame.preamble; inherited = projectTextFormats(preamble); }
      const { source } = frame, result: Projection<FormatProjection>[] = [];
      for (const command of source.commands) {
        const format = inherited[command.name];
        const cls = formats[command.name] || format?.class;
        if (!cls && !format?.color && command.name !== 'href') continue;
        let at = skipTexSpace(source.text, command.to);
        const first = texGroup(source.text, at); if (!first) continue;
        const group = command.name === 'href' ? texGroup(source.text, skipTexSpace(source.text, first.to)) : first;
        if (!group || group.to <= group.from + 2) continue;
        result.push({ kind: 'format', from: command.from, to: group.to, data: { contentFrom: group.from + 1, contentTo: group.to - 1, class: cls, color: format?.color, href: command.name === 'href' ? source.text.slice(first.from + 1, first.to - 1) : undefined } });
      }
      return result;
    },
  };
}
