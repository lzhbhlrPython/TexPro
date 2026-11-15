import { declarations } from '../../../electron/services/writing-context-core.mjs';
import { skipTexSpace, texDocumentStart, texGroup } from '../texDocument';
import { joinPath } from '../latex';
import type { ProjectWritingContext } from './project';

export interface WritingInclude { from: number; to: number; file: string }
export interface WritingComposition { sources: Readonly<Record<string, string>>; incomplete: boolean }
/** Literal includes share the compiler's project working directory. Never expand macros. */
export function writingIncludes(text: string, project: ProjectWritingContext): WritingInclude[] {
  const body = texDocumentStart(text)?.to ?? 0, results: WritingInclude[] = [];
  for (const command of declarations(text)) {
    if (command.from < body || !['input', 'include'].includes(command.name)) continue;
    const group = texGroup(text, skipTexSpace(text, command.to)); if (!group) continue;
    const name = text.slice(group.from + 1, group.to - 1).trim();
    if (!name || /[\\#%{}]/.test(name)) continue;
    const file = joinPath(project.base, /\.(tex|ltx)$/i.test(name) ? name : name + '.tex');
    results.push({ from: command.from, to: group.to, file });
  }
  return results;
}
export async function loadWritingComposition(file: string, text: string, project: ProjectWritingContext, read: (file: string) => Promise<string>): Promise<WritingComposition> {
  const sources: Record<string, string> = { [file]: text }; let incomplete = false, count = 0, size = text.length;
  const visit = async (owner: string, source: string, stack: Set<string>) => {
    if (stack.size >= 8) { incomplete = true; return; }
    for (const include of writingIncludes(source, project)) {
      if (!project.files.includes(include.file)) { incomplete = true; continue; }
      if (stack.has(include.file)) { incomplete = true; continue; }
      if (sources[include.file] !== undefined) continue;
      if (++count > 64) { incomplete = true; continue; }
      try {
        const value = await read(include.file);
        if ((size += value.length) > 4000000) { incomplete = true; continue; }
        sources[include.file] = value;
        await visit(include.file, value, new Set(stack).add(include.file));
      } catch { incomplete = true; }
    }
  };
  await visit(file, text, new Set([file]));
  return { sources, incomplete };
}
