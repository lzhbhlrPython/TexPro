import { findMusicBlocks } from '../music';
import { texCommands, texDocumentStart, texEnvironments } from '../texDocument';
import { createTexWritingEngine } from './index';
import { renderMath } from '../texMath';
import { projectMathMacros, type ProjectWritingContext } from './project';
import type { Engine } from '../../types';

export interface NativeRegion { from: number; to: number; file?: string }
export interface NativeFragment { page: number; x: number; y: number; width: number; height: number }
export interface NativeRenderedRegion extends NativeRegion { fragments: NativeFragment[] }
export interface NativeWritingRequest {
  session: string; root: string; file: string; engine: Engine;
  documents: Array<{ path: string; content: string }>; regions: NativeRegion[];
}
export interface NativeWritingResult {
  sources?: Record<string, string>; incomplete: boolean; revision: string; pdf: Uint8Array; source: string; regions: NativeRenderedRegion[];
}
export interface NativeWritingProjection extends NativeWritingResult {
  session: string; file: string;
}

const simpleEnvironments = new Set(['document', 'table', 'table*', 'figure', 'figure*', 'equation', 'equation*', 'align', 'align*', 'gather', 'gather*', 'multline', 'multline*', 'eqnarray', 'eqnarray*', 'verbatim', 'lstlisting', 'minted']);
const simpleCommands = new Set(['input', 'include', 'section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph', 'chapter', 'part', 'item', 'label', 'ref', 'eqref', 'pageref', 'autoref', 'cite', 'citep', 'citet', 'parencite', 'textcite', 'caption', 'LaTeX', 'TeX', 'verb', 'begin', 'end']);
/** Unknown constructs become candidates, never rewritten or interpreted as HTML. */
export function nativeWritingRegions(text: string, file: string, project?: ProjectWritingContext): NativeRegion[] {
  const body = texDocumentStart(text)?.to ?? 0;
  const commands = [...texCommands(text)].filter(command => command.from >= body);
  const endDocument = commands.find(command => command.name === 'end' && /^\s*\{document\}/.test(text.slice(command.to)))?.from ?? text.length;
  const plan = createTexWritingEngine().compile({ text, preamble: project?.preamble || text.slice(0, body), project, filePath: file });
  const macros = projectMathMacros(project?.preamble || text.slice(0, body));
  const covered = plan.projections.filter(projection => (projection.kind !== 'math' || renderMath((projection.data as { tex: string }).tex, (projection.data as { display: boolean }).display, macros)) && (projection.kind !== 'table' || (projection.data as { table: unknown }).table));
  const music = findMusicBlocks(text);
  const coveredAt = (from: number) => music.some(block => from >= block.from && from < block.to) || covered.some(range => {
    if (from < range.from || from >= range.to) return false;
    if (range.kind !== 'format') return true;
    const data = range.data as { contentFrom: number; contentTo: number };
    return from < data.contentFrom || from >= data.contentTo;
  });
  const names = new Set(commands.filter(command => command.name === 'begin').map(command => /^\s*\{([^{}]+)\}/.exec(text.slice(command.to))?.[1]).filter((name): name is string => !!name));
  const environments = texEnvironments(text, [...names]).filter(environment => environment.from >= body && environment.to <= endDocument);
  const opaque = environments.filter(environment => !simpleEnvironments.has(environment.name) && !coveredAt(environment.from));
  const regions: NativeRegion[] = plan.projections.filter(projection => projection.kind === 'math' && !covered.includes(projection)).map(projection => {
    const from = text.lastIndexOf('\n', projection.from - 1) + 1, next = text.indexOf('\n', projection.to);
    return { from, to: next < 0 ? text.length : next };
  });
  const lineFrom = (at: number) => text.lastIndexOf('\n', at - 1) + 1;
  const lineTo = (at: number) => { const next = text.indexOf('\n', at); return next < 0 ? text.length : next; };
  // Included files have their own editor and source map. A neighboring layout
  // command must not turn a run of chapter inputs into one opaque native block.
  const paragraphBoundary = /^\s*\\(?:input|include|section|subsection|subsubsection|chapter|part|Needspace|begin|end)\b/;
  for (const env of opaque) {
    if (opaque.some(parent => parent !== env && parent.from <= env.from && parent.to >= env.to)) continue;
    const from = lineFrom(env.from), to = lineTo(env.to);
    if (from >= body && to <= endDocument) regions.push({ from, to });
  }
  for (const command of commands) {
    if (command.from >= endDocument || simpleCommands.has(command.name) || coveredAt(command.from) || regions.some(region => command.from >= region.from && command.from < region.to)) continue;
    // Literal escapes are native text; macro calls require the actual project if
    // no semantic provider owns them. Enclose complete paragraphs and groups.
    if (!/^[A-Za-z@]+$/.test(command.name)) continue;
    let from = lineFrom(command.from), to = lineTo(command.to);
    while (from > body && text.slice(lineFrom(from - 1), from).trim() && !paragraphBoundary.test(text.slice(lineFrom(from - 1), from))) from = lineFrom(from - 1);
    while (to < endDocument && text.slice(to + 1, lineTo(to + 1)).trim() && !paragraphBoundary.test(text.slice(to + 1, lineTo(to + 1)))) to = lineTo(to + 1);
    if (from < body || to > endDocument || !text.slice(from, to).trim()) continue;
    // Don't cut an environment at a paragraph break. Its outer native region owns it.
    if (opaque.some(env => env.name !== 'document' && (env.from < from && env.to > from || env.from < to && env.to > to))) continue;
    regions.push({ from, to });
  }
  const merged: NativeRegion[] = [];
  for (const region of regions.sort((a, b) => a.from - b.from || b.to - a.to)) {
    const last = merged.at(-1);
    if (last && region.from <= last.to) last.to = Math.max(last.to, region.to);
    else merged.push({ ...region });
  }
  return merged.filter(region => region.from >= body && region.to <= endDocument).slice(0, 64);
}

/** One snapshot may supply several composed files; each view keeps original offsets. */
export function nativeProjectionForFile(projection: NativeWritingProjection | undefined, file: string): NativeWritingProjection | undefined {
  if (!projection) return undefined;
  const source = projection.sources?.[file] ?? (projection.file === file ? projection.source : undefined);
  if (source === undefined) return undefined;
  return { ...projection, file, source, regions: projection.regions.filter(region => (region.file || projection.file) === file) };
}
