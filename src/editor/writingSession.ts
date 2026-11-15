import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

export interface WritingPosition { file: string; anchor: number; head: number; top: number; left: number }
export interface WritingSession { state: EditorState; top: number; left: number }
export type WritingSessions = Map<string, WritingSession>;

/** Embedded file editors share their paper's scroll container. */
export function writingScrollDOM(view: EditorView): HTMLElement {
  let scroll = view.scrollDOM;
  for (let parent = view.dom.parentElement?.closest<HTMLElement>('.cm-scroller'); parent; parent = parent.parentElement?.closest<HTMLElement>('.cm-scroller')) scroll = parent;
  return scroll;
}

export function writingPosition(view: EditorView, file: string): WritingPosition {
  const selection = view.state.selection.main;
  const scroll = writingScrollDOM(view);
  return { file, anchor: selection.anchor, head: selection.head, top: scroll.scrollTop, left: scroll.scrollLeft };
}

export function restoreWritingPosition(view: EditorView, point: WritingPosition) {
  const clamp = (pos: number) => Math.max(0, Math.min(view.state.doc.length, pos));
  view.dispatch({ selection: { anchor: clamp(point.anchor), head: clamp(point.head) } });
  view.focus();
  view.requestMeasure({ read: () => null, write: () => { const scroll = writingScrollDOM(view); scroll.scrollTop = point.top; scroll.scrollLeft = point.left; } });
}
