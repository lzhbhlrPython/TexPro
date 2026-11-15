import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorPane, type EditorHandle, type EditorPaneProps } from './EditorPane';
import { composedEditorHandle, type IncludedEditorHost } from './composedEditing';
import { writingIncludes, type WritingInclude } from '../lib/writingEngine/includes';
import type { Text } from '@codemirror/state';

interface Inclusion {
  container: HTMLElement;
  file: string;
  source: string;
  ancestry: string[];
  ref: (handle: EditorHandle | null) => void;
}
interface Props extends EditorPaneProps {
  buffer: (file: string) => { content: string; savedContent: string } | undefined;
  onFileFocus: (file: string, source: string) => void;
  onFileChange: (file: string, before: string, content: string) => void;
  canEditFile: (file: string, source: string) => boolean;
  fileDiagnosticsStale: (file: string, source: string) => boolean;
}

/** One paper, ordinary file buffers. Embedded views reuse the complete editor. */
export const WritingSurface = forwardRef<EditorHandle, Props>(function WritingSurface(props, ref) {
  const root = useRef<EditorHandle | null>(null), active = useRef(props.path);
  const handles = useRef(new Map<string, EditorHandle>());
  const claims = useRef(new Map<string, HTMLElement>());
  const [inclusions, setInclusions] = useState<Inclusion[]>([]);
  const live = useRef(props); live.current = props;
  const composing = useRef(new Set<string>());
  const navigationCache = useRef(new Map<string, { doc: Text; includes: WritingInclude[]; context: EditorPaneProps['writingContext'] }>());
  const composition = (file: string, value: boolean) => {
    if (value) composing.current.add(file); else composing.current.delete(file);
    live.current.onCompositionChange?.(composing.current.size > 0);
  };
  const host = useMemo<IncludedEditorHost>(() => ({
    mount(container, file, source, ancestry) {
      // A repeated include is an additional projection, not another undo owner.
      if (file === live.current.path || claims.current.has(file)) return null;
      claims.current.set(file, container);
      let mounted: EditorHandle | null = null;
      const inclusion: Inclusion = { container, file, source, ancestry, ref: handle => {
        if (handle) handles.current.set(file, handle);
        else if (handles.current.get(file) === mounted) handles.current.delete(file);
        mounted = handle;
      } };
      let alive = true;
      queueMicrotask(() => { if (alive) setInclusions(current => [...current, inclusion]); });
      return () => {
        alive = false;
        if (claims.current.get(file) === container) claims.current.delete(file);
        if (handles.current.get(file) === mounted) handles.current.delete(file);
        queueMicrotask(() => setInclusions(current => current.filter(item => item !== inclusion)));
      };
    },
  }), []);
  useImperativeHandle(ref, () => composedEditorHandle(() => root.current, () => handles.current.get(active.current) || root.current, file => file === live.current.path ? root.current : handles.current.get(file) || null), []);
  const focus = (file: string, source: string) => {
    active.current = file;
    live.current.onFileFocus(file, source);
  };
  const arrow = (file: string, ancestry: string[], direction: -1 | 1, vertical: boolean) => {
    if (composing.current.size) return false;
    const editor = file === props.path ? root.current : handles.current.get(file);
    const session = editor?.getSession(); if (!editor || !session || !session.state.selection.main.empty) return false;
    const { doc } = session.state, head = session.state.selection.main.head, line = doc.lineAt(head);
    const includesFor = (path: string, text: Text) => {
      const cached = navigationCache.current.get(path);
      if (cached?.doc === text && cached.context === props.writingContext) return cached.includes;
      const includes = props.writingContext ? writingIncludes(text.toString(), props.writingContext) : [];
      navigationCache.current.set(path, { doc: text, includes, context: props.writingContext });
      return includes;
    };
    const nearby = doc.line(Math.max(1, Math.min(doc.lines, line.number + direction))).text;
    if (/\\(?:input|include)\s*\{/.test(nearby) || /\\(?:input|include)\s*\{/.test(line.text)) {
      const includes = includesFor(file, doc);
      const candidates = includes.filter(include => direction > 0 ? include.from >= head && !doc.sliceString(head, include.from).trim() : include.to <= head && !doc.sliceString(include.to, head).trim());
      const include = direction > 0 ? candidates[0] : candidates.at(-1);
      if (include && includes.find(item => item.file === include.file) === include) {
        const child = handles.current.get(include.file);
        if (child) { const source = child.getContent(), at = direction > 0 ? 0 : source.length; focus(include.file, source); child.selectRange(at, at); return true; }
      }
    }
    const edge = vertical ? direction < 0 ? line.number === 1 : line.number === doc.lines : head === (direction < 0 ? 0 : doc.length);
    if (!edge || ancestry.length < 2) return false;
    const parentFile = ancestry.at(-2)!;
    const parent = parentFile === props.path ? root.current : handles.current.get(parentFile), parentSession = parent?.getSession();
    if (!parent || !parentSession) return false;
    const include = includesFor(parentFile, parentSession.state.doc).find(item => item.file === file);
    if (!include) return false;
    const at = direction < 0 ? include.from : include.to;
    focus(parentFile, parent.getContent()); parent.selectRange(at, at); return true;
  };
  const gotoRequest = props.gotoRequest && { ...props.gotoRequest, file: props.gotoRequest.file || active.current };
  return <>
    <EditorPane {...props} gotoRequest={gotoRequest} ref={root} inclusionHost={props.collabExtension ? undefined : host} isActive={() => active.current === props.path || !handles.current.has(active.current)} onFocus={() => focus(props.path, root.current?.getContent() ?? props.value)} onCompositionChange={value => composition(props.path, value)} onWritingArrow={(direction, vertical) => arrow(props.path, [props.path], direction, vertical)} />
    {inclusions.map(inclusion => {
      const buffer = props.buffer(inclusion.file);
      const source = buffer?.content ?? props.writingComposition?.sources[inclusion.file] ?? inclusion.source;
      return createPortal(<EditorPane {...props}
        ref={inclusion.ref} path={inclusion.file} value={source} savedContent={buffer?.savedContent ?? inclusion.source}
        diagnosticsStale={props.fileDiagnosticsStale(inclusion.file, source)}
        embedded ancestry={inclusion.ancestry} inclusionHost={host} collabExtension={null}
        canEdit={before => props.canEditFile(inclusion.file, before)}
        onFocus={() => focus(inclusion.file, handles.current.get(inclusion.file)?.getContent() ?? source)}
        isActive={() => active.current === inclusion.file}
        onChange={(content, before) => props.onFileChange(inclusion.file, before, content)}
        onCursor={cursor => { if (active.current === inclusion.file) props.onCursor(cursor); }}
        onCompositionChange={value => composition(inclusion.file, value)}
        gotoRequest={gotoRequest}
        onWritingArrow={(direction, vertical) => arrow(inclusion.file, inclusion.ancestry, direction, vertical)}
      />, inclusion.container, inclusion.file);
    })}
  </>;
});
