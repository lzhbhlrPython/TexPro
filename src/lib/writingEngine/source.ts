import { skipTexSpace, texCommands, texDocumentStart, texEnvironments, texGroup, type TexRange } from '../texDocument';
import type { WritingSource } from './types';

const environments = ['equation', 'equation*', 'align', 'align*', 'gather', 'gather*', 'multline', 'multline*', 'eqnarray', 'eqnarray*', 'tabular', 'tabularx', 'longtable', 'tikzpicture', 'circuitikz'];
/** Parse once per source revision. The cache belongs to an engine instance. */
export function scanWritingSource(text: string): WritingSource {
  const protectedRanges: TexRange[] = [];
  const commands = [...texCommands(text)];
  const bodyFrom = texDocumentStart(text)?.to ?? 0;
  if (bodyFrom) protectedRanges.push({ from: 0, to: bodyFrom });
  for (let at = bodyFrom; at < text.length;) {
    const from = at;
    if (text[at] === '%') {
      const end = text.indexOf('\n', at);
      at = end < 0 ? text.length : end;
      protectedRanges.push({ from, to: at }); continue;
    }
    if (text[at++] !== '\\') continue;
    const match = /^[A-Za-z@]+|[\s\S]/.exec(text.slice(at));
    const name = match?.[0] || ''; at += name.length;
    if (name === 'verb') {
      if (text[at] === '*') at++;
      const delimiter = text[at++];
      const end = delimiter ? text.indexOf(delimiter, at) : -1;
      at = end < 0 ? text.length : end + 1;
      protectedRanges.push({ from, to: at });
    } else if (name === 'begin') {
      const group = texGroup(text, skipTexSpace(text, at));
      const env = group && text.slice(group.from + 1, group.to - 1);
      if (env && ['verbatim', 'verbatim*', 'lstlisting', 'minted'].includes(env)) {
        const close = `\\end{${env}}`, end = text.indexOf(close, group!.to);
        at = end < 0 ? text.length : end + close.length;
        protectedRanges.push({ from, to: at });
      }
    }
  }
  for (const command of commands) {
    if (command.from < bodyFrom || !['newcommand', 'renewcommand', 'providecommand', 'DeclareRobustCommand'].includes(command.name)) continue;
    let at = skipTexSpace(text, command.to);
    if (text[at] === '*') at = skipTexSpace(text, at + 1);
    const name = texGroup(text, at); if (!name) continue;
    at = skipTexSpace(text, name.to);
    for (let index = 0; index < 2 && text[at] === '['; index++) {
      const option = texGroup(text, at, '[', ']'); if (!option) break;
      at = skipTexSpace(text, option.to);
    }
    const body = texGroup(text, at);
    if (body) protectedRanges.push({ from: command.from, to: body.to });
  }
  protectedRanges.sort((a, b) => a.from - b.from || b.to - a.to);
  return { text, bodyFrom, commands, environments: texEnvironments(text, environments), protectedRanges };
}
