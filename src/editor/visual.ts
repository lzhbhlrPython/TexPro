import { IncludedWritingWidget } from './projection/includeWidget';
import { writingIncludes, type WritingComposition } from '../lib/writingEngine/includes';
import { nativeProjectionForFile } from '../lib/writingEngine/native';
import { NativeWritingWidget } from './projection/nativeWidget';
import type { IncludedEditorHost } from './composedEditing';
import type { NativeWritingProjection } from '../lib/writingEngine/native';
import { PlaceholderWidget, InlineMathWidget, DisplayMathWidget, SectionBadgeWidget, BulletWidget, ImageWidget, CodeBlockWidget, PreambleWidget, TitleWidget, ReferenceWidget, TexLogoWidget, TikzWidget, ClearWidget, MusicDataWidget, HiddenBlockWidget, EnvironmentWidget, LabelWidget, CaptionBadgeWidget } from './projection/widgets';
import { MusicWidget, musicSourceField, revealMusicSource } from './musicWidget';
import { findMusicBlocks } from '../lib/music';
import { diagramBlocks, skipTexSpace, texCommands, texDocumentStart, texEnvironments, texGroup, writingTable, type TexCommand } from '../lib/texDocument';
import { WritingTableWidget } from './tableWidget';
import { focusWriting, selectionTouches, writingComposition, tableWritingField, writeTableCell } from './writing';
import { Decoration, EditorView, ViewPlugin, WidgetType, type DecorationSet, type ViewUpdate } from '@codemirror/view';
import { StateEffect, StateField, type EditorState, type Extension, type Range } from '@codemirror/state';
import { renderMath } from '../lib/texMath';
import { projectTextFormats } from '../lib/writingEngine/project';
import { assetUrl, parseDocumentTitle } from '../lib/latex';
import { reviewedRanges } from './writingReview';
import { parseWritingAids } from '../../electron/services/writing-aids-core.mjs';

import { projectMathMacros, type ProjectWritingContext } from '../lib/writingEngine/project';

import { createTexWritingEngine, type MathProjection, type GraphicProjection, type FormatProjection, type TableProjection, type DiagramProjection } from '../lib/writingEngine';

export const refreshWritingPreview = StateEffect.define<null>();

export interface VisualContext {
  filePath: string;
  projectRoot: string;
  collapsePreamble: boolean;
  engine?: import('../types').Engine;
  preamble?: string;
  project?: ProjectWritingContext;
  native?: NativeWritingProjection;
  composition?: WritingComposition;
  ancestry?: string[];
  inclusionHost?: IncludedEditorHost;
}

export interface VisualConfig {
  get: () => VisualContext;
}

let inheritedPreamble: string | undefined;
let inheritedMacros: Record<string, string> = {};

interface Occupied {
  from: number;
  to: number;
}

function overlaps(from: number, to: number, ranges: Occupied[]) {
  return ranges.some((range) => from < range.to && to > range.from);
}

function makeMarkerRange(from: number, to: number, classes: string[]): Range<Decoration> {
  return Decoration.mark({ class: classes.join(' ') }).range(from, to);
}

function textArgument(text: string, command: TexCommand) {
  let at = command.to;
  if (text[at] === '*') at++;
  at = skipTexSpace(text, at);
  if (text[at] === '[') {
    const option = texGroup(text, at, '[', ']');
    if (!option) return null;
    at = skipTexSpace(text, option.to);
  }
  return texGroup(text, at);
}

interface PreviewSelectionRange { from: number; to: number; selected: boolean }
const previewSelections = new WeakMap<EditorState, PreviewSelectionRange[]>();

function buildDecorations(state: EditorState, context: VisualContext, engine: ReturnType<typeof createTexWritingEngine>): DecorationSet {
  const text = state.doc.toString();
  const macroPreamble = context.preamble || text.slice(0, texDocumentStart(text)?.from ?? 0);
  if (inheritedPreamble !== macroPreamble) {
    inheritedPreamble = macroPreamble;
    inheritedMacros = projectMathMacros(macroPreamble);
  }
  const plan = engine.compile({ text, preamble: macroPreamble, project: context.project, filePath: context.filePath });
  const macros = inheritedMacros;
  const math = (source: string, display: boolean) => renderMath(source, display, macros);
  const ranges: Range<Decoration>[] = [];
  const occupied: Occupied[] = [];
  const revisions = state.field(reviewedRanges, false) || [];
  const selectionRanges: PreviewSelectionRange[] = [];
  const touched = (from: number, to: number) => {
    const selected = selectionTouches(state, { from, to });
    selectionRanges.push({ from, to, selected });
    return selected || revisions.some(hunk => hunk.from <= to && hunk.to >= from);
  };

  const addBlock = (from: number, to: number, widget: WidgetType) => {
    ranges.push(Decoration.replace({ widget, block: true }).range(from, to));
    occupied.push({ from, to });
  };

  const native = nativeProjectionForFile(context.native, context.filePath);
  if (native) {
    for (const region of native.regions) {
      const original = native.source.slice(region.from, region.to);
      // Preserve an unchanged projection when preceding prose shifts. Ambiguous
      // repeated blocks stay source until the next immutable snapshot arrives.
      let from = region.from;
      if (text.slice(from, region.to) !== original) {
        from = text.indexOf(original);
        if (from < 0 || text.indexOf(original, from + 1) >= 0) continue;
      }
      const to = from + original.length;
      if (!original.trim() || touched(from, to) || overlaps(from, to, occupied)) continue;
      const start = state.doc.lineAt(from), end = state.doc.lineAt(to);
      if (text.slice(start.from, from).trim() || text.slice(to, end.to).trim()) continue;
      addBlock(start.from, end.to, new NativeWritingWidget(native, region, from, to));
    }
  }

  if (context.project && context.composition) {
    for (const include of writingIncludes(text, context.project)) {
      const source = context.composition.sources[include.file];
      if (source === undefined || context.ancestry?.includes(include.file) || include.file === context.filePath || touched(include.from, include.to) || overlaps(include.from, include.to, occupied)) continue;
      const start = state.doc.lineAt(include.from), end = state.doc.lineAt(include.to);
      if (text.slice(start.from, include.from).trim() || text.slice(include.to, end.to).trim()) continue;
      addBlock(start.from, end.to, new IncludedWritingWidget(include.file, source, context));
    }
  }

  for (const block of findMusicBlocks(text)) {
    if (overlaps(block.from, block.to, occupied)) continue;
    // Reserve the entire block before math/TikZ scanners see generated TeX or metadata.
    if (state.field(musicSourceField, false) === block.id || touched(block.from, block.to)) {
      occupied.push({ from: block.from, to: block.to });
      ranges.push(Decoration.widget({ widget: new MusicWidget(block, context.projectRoot, true, context.filePath, context.preamble, context.engine), block: true, side: 1 }).range(block.to));
      const metadata = /^% texpro-music-data:.*$/m.exec(block.source);
      if (metadata) {
        const from = block.from + metadata.index, to = from + metadata[0].length;
        if (!touched(from, to)) ranges.push(Decoration.replace({ widget: new MusicDataWidget(), block: true }).range(from, to));
      }
    }
    else addBlock(block.from, block.to, new MusicWidget(block, context.projectRoot, false, context.filePath, context.preamble, context.engine));
  }

  const preamble = text.match(/\\documentclass(?:\[[^\]]*\])?\{[^}]+\}/);
  const documentStart = text.match(/\\begin\{document\}/);
  if (context.collapsePreamble && preamble && documentStart && !touched(0, documentStart.index! + documentStart[0].length)) {
    const startLine = state.doc.lineAt(preamble.index!);
    const endLine = state.doc.lineAt(documentStart.index! + documentStart[0].length);
    const info = parseDocumentTitle(text);
    addBlock(
      startLine.from,
      endLine.to,
      new PreambleWidget(info.documentClass, info.packages, endLine.number - startLine.number + 1, startLine.from + 1),
    );
  }

  for (const match of text.matchAll(/\\maketitle\b/g)) {
    if (match.index === undefined) continue;
    if (!preamble || match.index < (documentStart?.index ?? 0)) continue;
    if (touched(match.index, match.index + match[0].length)) continue;
    if (overlaps(match.index, match.index + match[0].length, occupied)) continue;
    const info = parseDocumentTitle(text);
    const titleLine = state.doc.lineAt(match.index);
    if (titleLine.text.trim() !== '\\maketitle') continue;
    ranges.push(
      Decoration.replace({
        widget: new TitleWidget(info.title, info.author, info.date, titleLine.from + 1),
        block: true,
      }).range(titleLine.from, titleLine.to),
    );
    occupied.push({ from: titleLine.from, to: titleLine.to });
  }

  for (const projection of plan.projections) {
    if (projection.kind !== 'math') continue;
    const data = projection.data as MathProjection;
    if (!data.display) continue;
    const { from, to } = projection;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    const startLine = state.doc.lineAt(from), endLine = state.doc.lineAt(to);
    if (text.slice(startLine.from, from).trim() || text.slice(to, endLine.to).trim()) continue;
    const html = math(data.tex, true);
    if (html) addBlock(startLine.from, endLine.to, new DisplayMathWidget(data.tex, data.label, data.focus, html));
  }

  for (const projection of plan.projections) {
    if (projection.kind !== 'table') continue;
    const { from, to } = projection;
    if (overlaps(from, to, occupied)) continue;
    const parsed = (projection.data as TableProjection).table;
    if (!parsed) { occupied.push({ from, to }); continue; }
    const active = state.field(tableWritingField, false);
    if (touched(from, to) && (!parsed || active?.from !== from || revisions.some(hunk => hunk.from <= to && hunk.to >= from))) continue;
    const startLine = state.doc.lineAt(from), endLine = state.doc.lineAt(to);
    if (startLine.text.slice(0, from - startLine.from).trim() || endLine.text.slice(to - endLine.from).trim()) continue;
    if (parsed) addBlock(startLine.from, endLine.to, new WritingTableWidget(parsed, { macros, formats: projectTextFormats(macroPreamble) }));

  }

  for (const match of text.matchAll(/\\begin\{(verbatim|lstlisting|minted)\}(?:\[([^\]]*)\])?(?:\{([^}]*)\})?([\s\S]*?)\\end\{\1\}/g)) {
    if (match.index === undefined) continue;
    const from = match.index;
    const to = from + match[0].length;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    const startLine = state.doc.lineAt(from);
    const endLine = state.doc.lineAt(to);
    if (startLine.text.slice(0, from - startLine.from).trim() || endLine.text.slice(to - endLine.from).trim()) continue;
    const language = match[2]?.match(/language\s*=\s*([\w+-]+)/)?.[1] || match[3] || 'code';
    const code = match[4].trim();
    if (!code) continue;
    addBlock(startLine.from, endLine.to, new CodeBlockWidget(code, language, startLine.from + 1));
  }

  for (const projection of plan.projections) {
    if (projection.kind !== 'diagram') continue;
    const block = projection.data as DiagramProjection;
    const { from, to } = block;
    if (overlaps(from, to, occupied)) continue;
    const startLine = state.doc.lineAt(from), endLine = state.doc.lineAt(to);
    const active = touched(from, to), inline = !!startLine.text.slice(0, from - startLine.from).trim() || !!endLine.text.slice(to - endLine.from).trim();
    const widget = new TikzWidget(block.source, context.projectRoot, context.filePath, from + 1, block.kind, inline, active, context.preamble ? context.preamble + '\n\\begin{document}' : undefined, context.engine, block.adapter);
    if (active) {
      occupied.push({ from, to });
      if (!inline) ranges.push(Decoration.widget({ widget, block: true, side: 1 }).range(to));
      continue;
    }
    if (!startLine.text.slice(0, from - startLine.from).trim() && !endLine.text.slice(to - endLine.from).trim()) addBlock(startLine.from, endLine.to, widget);
    else {
      ranges.push(Decoration.replace({ widget }).range(from, to));
      occupied.push({ from, to });
    }
  }

  for (const projection of plan.projections) {
    if (projection.kind !== 'graphic') continue;
    const { path, name } = projection.data as GraphicProjection;
    const { from, to } = projection;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    const line = state.doc.lineAt(from);
    const isBlock = line.text.trim() === text.slice(from, to).trim();
    const widget = new ImageWidget(assetUrl(path) + `&revision=${context.project?.revision || 0}`, name, isBlock, from + 1, path);
    if (isBlock) {
      ranges.push(Decoration.replace({ widget, block: true }).range(line.from, line.to));
      occupied.push({ from: line.from, to: line.to });
    } else {
      ranges.push(Decoration.replace({ widget }).range(from, to));
      occupied.push({ from, to });
    }
  }

  const flow = plan.projections.filter(projection => projection.kind === 'flow');
  const flowLines = new Map<number, typeof flow>();
  for (const projection of flow) {
    if (touched(projection.from, projection.to) || overlaps(projection.from, projection.to, occupied)) continue;
    const line = state.doc.lineAt(projection.from);
    if (projection.to > line.to) continue;
    flowLines.set(line.number, [...(flowLines.get(line.number) || []), projection]);
  }
  for (const [number, nodes] of flowLines) {
    const line = state.doc.line(number), sorted = nodes.sort((a, b) => a.from - b.from);
    let rest = '', at = line.from;
    for (const node of sorted) { rest += text.slice(at, node.from); at = node.to; }
    rest += text.slice(at, line.to);
    if (!rest.trim()) addBlock(line.from, line.to, new HiddenBlockWidget());
    else for (const node of sorted) {
      ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(node.from, node.to));
      occupied.push({ from: node.from, to: node.to });
    }
  }

  const bodyStart = texDocumentStart(text)?.to ?? 0;
  for (const item of parseWritingAids(text).placeholders) {
    if (touched(item.from, item.to) || overlaps(item.from, item.to, occupied)) continue;
    const line = state.doc.lineAt(item.from), endLine = state.doc.lineAt(item.to);
    const block = ['figure', 'table'].includes(item.kind) && !text.slice(line.from, item.from).trim() && !text.slice(item.to, endLine.to).trim();
    ranges.push(Decoration.replace({ widget: new PlaceholderWidget(item, block), block }).range(block ? line.from : item.from, block ? endLine.to : item.to));
    occupied.push({ from: item.from, to: item.to });
  }
  const chinese = /\\(?:documentclass(?:\[[^\]]*\])?\{ctex(?:art|rep|book)\}|(?:usepackage|RequirePackage)(?:\[[^\]]*\])?\{[^}]*\bctex\b)/.test(context.preamble || text.slice(0, bodyStart));
  if (chinese) for (let n = 1; n <= state.doc.lines; n++) {
    const line = state.doc.line(n);
    if (line.from < bodyStart || !/[\u3400-\u9fff]/.test(line.text) || /^\s*[\\%$}]/.test(line.text) || overlaps(line.from, line.to, occupied)) continue;
    // Indent paragraph starts only; wrapped visual lines inherit normal TeX-like flow.
    if (n > 1 && state.doc.line(n - 1).text.trim()) continue;
    ranges.push(Decoration.line({ class: 'cm-chinese-paragraph' }).range(line.from));
  }
  const inlineCommands = [...texCommands(text)].filter(c => c.from >= bodyStart);
  const headingLevels: Record<string, number> = { part: 1, chapter: 1, section: 1, subsection: 2, subsubsection: 3, paragraph: 4 };
  for (const command of inlineCommands) {
    const level = headingLevels[command.name];
    if (!level) continue;
    const group = textArgument(text, command);
    if (!group || touched(command.from, group.to) || overlaps(command.from, group.to, occupied)) continue;
    const line = state.doc.lineAt(command.from);
    if (text.slice(line.from, command.from).trim()) continue;
    for (let n = line.number; n <= state.doc.lineAt(group.to).number; n++) ranges.push(Decoration.line({ class: `cm-heading-line cm-heading-${level}` }).range(state.doc.line(n).from));
    ranges.push(Decoration.replace({ widget: new SectionBadgeWidget(level, command.name, command.from + 1) }).range(command.from, group.from + 1));
    ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(group.to - 1, group.to));
    occupied.push({ from: command.from, to: group.from + 1 }, { from: group.to - 1, to: group.to });
  }

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber);
    const match = /^\s*\\item\s+/.exec(line.text);
    if (!match) continue;
    if (touched(line.from, line.to)) continue;
    const from = line.from + match[0].indexOf('\\item');
    const to = from + '\\item'.length;
    if (overlaps(from, to, occupied)) continue;
    ranges.push(Decoration.line({ class: 'cm-list-line' }).range(line.from));
    ranges.push(Decoration.replace({ widget: new BulletWidget(from + 1) }).range(from, to));
    occupied.push({ from, to });
  }

  const environmentPattern = /^\s*\\(begin|end)\{(abstract|itemize|enumerate|description|figure|figure\*|table|table\*|center|quote|theorem|proof|lemma)\}(?:\[[^\]]*\])?\s*$/;
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber);
    const match = environmentPattern.exec(line.text);
    if (!match) continue;
    if (touched(line.from, line.to)) continue;
    if (overlaps(line.from, line.to, occupied)) continue;
    addBlock(
      line.from,
      line.to,
      new EnvironmentWidget(match[2], match[1] === 'end', line.from + 1),
    );
  }

  let abstractStart = -1;
  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber);
    if (/^\s*\\begin\{abstract\}/.test(line.text)) abstractStart = lineNumber;
    if (/^\s*\\end\{abstract\}/.test(line.text) && abstractStart > 0) {
      for (let inner = abstractStart + 1; inner < lineNumber; inner++) {
        ranges.push(Decoration.line({ class: 'cm-abstract-line' }).range(state.doc.line(inner).from));
      }
      abstractStart = -1;
    }
  }

  for (let lineNumber = 1; lineNumber <= state.doc.lines; lineNumber++) {
    const line = state.doc.line(lineNumber);
    if (!/^\s*\\centering\s*$/.test(line.text)) continue;
    if (touched(line.from, line.to) || overlaps(line.from, line.to, occupied)) continue;
    ranges.push(Decoration.replace({ widget: new HiddenBlockWidget(), block: true }).range(line.from, line.to));
    occupied.push({ from: line.from, to: line.to });
  }

  for (const match of text.matchAll(/\\label\{([^}]+)\}/g)) {
    if (match.index === undefined) continue;
    const from = match.index;
    const to = from + match[0].length;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    ranges.push(Decoration.replace({ widget: new LabelWidget(match[1], from + 1) }).range(from, to));
    occupied.push({ from, to });
  }

  for (const command of inlineCommands) {
    if (command.name !== 'caption') continue;
    const group = textArgument(text, command);
    if (!group || touched(command.from, group.to) || overlaps(command.from, group.to, occupied)) continue;
    ranges.push(Decoration.line({ class: 'cm-caption-line' }).range(state.doc.lineAt(command.from).from));
    ranges.push(Decoration.replace({ widget: new CaptionBadgeWidget(command.from + 1) }).range(command.from, group.from + 1));
    ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(group.to - 1, group.to));
    occupied.push({ from: command.from, to: group.from + 1 }, { from: group.to - 1, to: group.to });
  }

  for (const match of text.matchAll(/\\LaTeX\s*\{\}/g)) {
    if (match.index === undefined) continue;
    const from = match.index;
    const to = from + match[0].length;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    ranges.push(Decoration.replace({ widget: new TexLogoWidget(from + 1) }).range(from, to));
    occupied.push({ from, to });
  }

  for (const match of text.matchAll(/~(?=\\(?:ref|eqref|pageref|autoref|cite|citep|citet|parencite|textcite)\*?(?:\[[^\]]*\])?\{)/g)) {
    if (match.index === undefined) continue;
    const from = match.index;
    const to = from + 1;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(from, to));
    occupied.push({ from, to });
  }

  for (const match of text.matchAll(/\\(ref|eqref|pageref|autoref|cite|citep|citet|parencite|textcite)\*?(?:\[[^\]]*\])?\{([^}]+)\}/g)) {
    if (match.index === undefined) continue;
    const from = match.index;
    const to = from + match[0].length;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    ranges.push(Decoration.replace({ widget: new ReferenceWidget(match[1], match[2], from + 1) }).range(from, to));
    occupied.push({ from, to });
  }

  const commentPattern = /(^|[^\\])%.*$/gm;
  for (const match of text.matchAll(commentPattern)) {
    if (match.index === undefined) continue;
    const offset = match[1] ? match[1].length : 0;
    const from = match.index + offset;
    const to = match.index + match[0].length;
    if (overlaps(from, to, occupied)) continue;
    const isTodo = /^\s*%\s*(MEMO|TODO|FIXME|NOTE)\s*:/i.test(match[0].slice(offset));
    ranges.push(makeMarkerRange(from, to, ['cm-comment', isTodo ? 'cm-todo-comment' : '']));
  }

  for (const projection of plan.projections) {
    if (projection.kind !== 'format') continue;
    const { from, to } = projection;
    const data = projection.data as FormatProjection;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    const mark: { class?: string; attributes?: Record<string, string> } = data.class ? { class: data.class } : data.color ? { attributes: { style: `color:${data.color}` } } : { class: 'cm-link', attributes: { 'data-href': data.href || '', title: data.href || '' } };
    ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(from, data.contentFrom));
    ranges.push(Decoration.mark(mark).range(data.contentFrom, data.contentTo));
    ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(data.contentTo, to));
    occupied.push({ from, to: data.contentFrom }, { from: data.contentTo, to });
  }

  const verbPattern = /\\verb(.)([^\\n]*?)\1/g;
  for (const match of text.matchAll(verbPattern)) {
    if (match.index === undefined) continue;
    const from = match.index;
    const to = from + match[0].length;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    const contentStart = from + 5;
    const contentEnd = contentStart + match[2].length;
    ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(from, contentStart));
    ranges.push(Decoration.mark({ class: 'cm-inline-code' }).range(contentStart, contentEnd));
    ranges.push(Decoration.replace({ widget: new ClearWidget() }).range(contentEnd, to));
    occupied.push({ from, to });
  }

  for (const projection of plan.projections) {
    if (projection.kind !== 'math') continue;
    const data = projection.data as MathProjection;
    if (data.display) continue;
    const { from, to } = projection;
    if (touched(from, to) || overlaps(from, to, occupied)) continue;
    const html = math(data.tex, false);
    if (!html) continue;
    ranges.push(Decoration.replace({ widget: new InlineMathWidget(data.tex, data.focus, html) }).range(from, to));
    occupied.push({ from, to });
  }

  const result = Decoration.set(ranges, true);
  previewSelections.set(state, selectionRanges);
  return result;
}

export function visualLatex(config: VisualConfig): Extension {
  const engine = createTexWritingEngine();
  const field = StateField.define<DecorationSet>({
    create(state) { return buildDecorations(state, config.get(), engine); },
    update(value, tr) {
      if (tr.state.field(writingComposition)) return value.map(tr.changes);
      const refresh = tr.effects.some(effect => effect.is(refreshWritingPreview));
      const changedContext = tr.startState.field(musicSourceField, false) !== tr.state.field(musicSourceField, false)
        || tr.startState.field(tableWritingField, false) !== tr.state.field(tableWritingField, false)
        || tr.startState.field(reviewedRanges, false) !== tr.state.field(reviewedRanges, false)
        || tr.startState.field(writingComposition);
      if (tr.docChanged || refresh || changedContext) return buildDecorations(tr.state, config.get(), engine);
      // Cursor motion inside the same prose/TeX region changes no preview. Reuse the
      // decorations until a boundary is crossed, avoiding another full source scan.
      if (tr.selection) {
        const cached = previewSelections.get(tr.startState);
        if (!cached || cached.some(range => range.selected !== selectionTouches(tr.state, range))) return buildDecorations(tr.state, config.get(), engine);
      }
      const cached = previewSelections.get(tr.startState);
      if (cached) previewSelections.set(tr.state, cached);
      return value;
    },
    provide: candidate => EditorView.decorations.from(candidate),
  });
  return [
    musicSourceField,
    tableWritingField,
    field,
    EditorView.domEventHandlers({
      mousedown(event, view) {
        const target = event.target as HTMLElement | null;
        const rendered = target?.closest<HTMLElement>('[data-texpro-pos]');
        if (rendered && event.button === 0) {
          event.preventDefault();
          event.stopPropagation();
          const pos = Number(rendered.dataset.texproPos);
          if (Number.isFinite(pos)) {
            focusWriting(view, pos);
          }
          return true;
        }
        const link = target?.closest<HTMLElement>('.cm-link');
        if (link && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          const href = link.dataset.href;
          if (href) window.texpro.openExternal(href);
        }
        return false;
      },
    }),
  ];
}

class FocusPlugin {
  decorations: DecorationSet;
  private frame = 0;

  constructor(private readonly view: EditorView) {
    this.decorations = this.build();
  }

  private build(): DecorationSet {
    const state = this.view.state;
    const ranges: Range<Decoration>[] = [];
    const cursorLine = state.doc.lineAt(state.selection.main.head).number;
    let start = cursorLine;
    let end = cursorLine;
    while (start > 1 && state.doc.line(start - 1).text.trim() !== '') start--;
    while (end < state.doc.lines && state.doc.line(end + 1).text.trim() !== '') end++;
    for (let line = 1; line <= state.doc.lines; line++) {
      const info = state.doc.line(line);
      if (line >= start && line <= end) {
        ranges.push(Decoration.line({ class: 'cm-focus-active' }).range(info.from));
      } else {
        ranges.push(Decoration.line({ class: 'cm-focus-dim' }).range(info.from));
      }
    }
    return Decoration.set(ranges, true);
  }

  update(update: ViewUpdate) {
    if (!update.docChanged && !update.selectionSet && !update.viewportChanged) return;
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = 0;
      if (!this.view.dom.isConnected) return;
      this.decorations = this.build();
      this.view.requestMeasure();
    });
  }

  destroy() {
    if (this.frame) window.cancelAnimationFrame(this.frame);
  }
}

export function focusMode() {
  const plugin = ViewPlugin.fromClass(FocusPlugin, {
    decorations: (value) => value.decorations,
  });
  return plugin;
}

export function typewriterMode() {
  return EditorView.updateListener.of((update) => {
    if (!update.selectionSet || !update.view.hasFocus) return;
    const head = update.state.selection.main.head;
    window.setTimeout(() => {
      if (!update.view.hasFocus) return;
      update.view.dispatch({
        effects: EditorView.scrollIntoView(head, { y: 'center' }),
      });
    }, 20);
  });
}
