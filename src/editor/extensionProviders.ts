import type { CompletionSource } from '@codemirror/autocomplete';
import { hoverTooltip } from '@codemirror/view';
export interface EditorProviderBridge {
  completions: CompletionSource;
  hover: (source: string, position: number) => Promise<string | null>;
}
let bridge: EditorProviderBridge | null = null;
export function registerEditorProviders(next: EditorProviderBridge) { bridge = next; return () => { if (bridge === next) bridge = null; }; }
export const extensionCompletionSource: CompletionSource = context => bridge?.completions(context) || null;
export const extensionHover = hoverTooltip(async (view, position) => {
  if (view.composing || !bridge) return null;
  const doc = view.state.doc, text = await bridge.hover(doc.toString(), position);
  if (!text || view.state.doc !== doc || view.composing) return null;
  return { pos: position, create() { const dom = document.createElement('div'); dom.className = 'cm-reference-info'; dom.textContent = text; return { dom }; } };
});
