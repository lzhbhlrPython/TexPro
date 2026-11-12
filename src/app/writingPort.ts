/** Narrow host adapter used by extensions; no React, DOM or CodeMirror state crosses this port. */
export interface WritingEditorPort {
  getDocumentIdentity(): object | null;
  getPath(): string;
  getContent(): string;
  getSelectionRange(): { from: number; to: number };
  applyExtensionEdits(source: string, edits: Array<{ from: number; to: number; insert: string }>): boolean;
  focus(): void;
}
export function sameWritingSnapshot(expected: { generation: number; file?: string; identity: unknown }, current: { generation: number; editor: WritingEditorPort | null }) {
  return current.generation === expected.generation && current.editor?.getPath() === expected.file && (current.editor?.getDocumentIdentity() ?? null) === expected.identity;
}
