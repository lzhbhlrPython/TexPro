import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { latexLanguage } from '../editor/latexLanguage';
import { editorHighlighting } from '../editor/theme';

/** Source is authoritative in tools too: highlighting, IME and local undo share CodeMirror. */
export const TexSourceEditor = forwardRef<{ focus: () => void }, { value: string; onChange: (source: string) => void; label: string; className?: string }>(function TexSourceEditor({ value, onChange, label, className }, ref) {
  const host = useRef<HTMLDivElement>(null), view = useRef<EditorView | null>(null), change = useRef(onChange);
  change.current = onChange;
  useImperativeHandle(ref, () => ({ focus: () => view.current?.focus() }), []);
  useEffect(() => {
    const editor = new EditorView({ parent: host.current!, state: EditorState.create({ doc: value, extensions: [
      latexLanguage(), editorHighlighting, history(), keymap.of([...defaultKeymap, ...historyKeymap]), EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': label, spellcheck: 'false' }),
      EditorView.theme({ '&': { height: '100%', background: 'transparent', color: 'var(--editor-text)' }, '.cm-scroller': { fontFamily: 'var(--font-mono)', lineHeight: '1.6', overflow: 'auto' }, '.cm-content': { padding: '12px', minHeight: '180px' }, '&.cm-focused': { outline: 'none' }, '.cm-cursor': { borderLeftColor: 'var(--accent)' }, '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'var(--accent-soft)' } }),
      EditorView.updateListener.of(update => { if (update.docChanged) change.current(update.state.doc.toString()); }),
    ] }) });
    view.current = editor;
    return () => { view.current = null; editor.destroy(); };
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.composing) return;
    const current = editor.state.doc.toString();
    if (current === value) return;
    let prefix = 0, suffix = 0;
    while (prefix < current.length && prefix < value.length && current[prefix] === value[prefix]) prefix++;
    while (suffix < current.length - prefix && suffix < value.length - prefix && current[current.length - suffix - 1] === value[value.length - suffix - 1]) suffix++;
    editor.dispatch({ changes: { from: prefix, to: current.length - suffix, insert: value.slice(prefix, value.length - suffix) } });
  }, [value]);
  useEffect(() => { view.current?.contentDOM.setAttribute('aria-label', label); }, [label]);
  return <div ref={host} className={className} />;
});
