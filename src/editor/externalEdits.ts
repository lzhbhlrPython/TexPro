import { ChangeSet } from '@codemirror/state';
import { isolateHistory } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import { validateResult } from '../lib/extensionResult';
/** One editor-owned history group; callers also hold the project/file/document lease. */
export function applyExternalEdits(view: Pick<EditorView, 'state' | 'dispatch' | 'composing' | 'scrollSnapshot'>, source: string, edits: Array<{ from: number; to: number; insert: string }>) {
  if (view.composing || view.state.doc.toString() !== source) return false;
  validateResult({ edits }, source);
  const changes = ChangeSet.of(edits, source.length);
  view.dispatch({ changes, selection: view.state.selection.map(changes), annotations: isolateHistory.of('full'), effects: view.scrollSnapshot() });
  return true;
}
