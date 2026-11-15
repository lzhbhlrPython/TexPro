import { EditorState } from '@codemirror/state';
import { EditorView, WidgetType } from '@codemirror/view';
import { latexLanguage } from '../latexLanguage';
import { editorHighlighting, editorTheme } from '../theme';
import { writingComposition } from '../writing';
import { visualLatex, type VisualContext } from '../visual';
import { msg } from '../../i18n';

const cleanups = new WeakMap<HTMLElement, () => void>();

/** Each editable inclusion owns a real file editor; repeated views remain projections. */
export class IncludedWritingWidget extends WidgetType {
  constructor(readonly file: string, readonly source: string, readonly context: VisualContext) { super(); }
  eq(other: IncludedWritingWidget) {
    return this.file === other.file && this.source === other.source && this.context.inclusionHost === other.context.inclusionHost && this.context.composition === other.context.composition && this.context.preamble === other.context.preamble && this.context.native?.revision === other.context.native?.revision;
  }
  updateDOM(dom: HTMLElement, _view: EditorView, previous: IncludedWritingWidget) {
    return dom.dataset.writingFile === this.file && dom.dataset.editable === 'true' && !!this.context.inclusionHost && this.context.inclusionHost === previous.context.inclusionHost;
  }
  toDOM(parent: EditorView) {
    const host = document.createElement('div'); host.className = 'cm-included-writing'; host.dataset.writingFile = this.file;
    const context = { ...this.context, filePath: this.file, ancestry: [...(this.context.ancestry || [this.context.filePath]), this.file] };
    host.setAttribute('role', 'group'); host.setAttribute('aria-label', this.file);
    const release = this.context.inclusionHost?.mount(host, this.file, this.source, context.ancestry);
    if (release) {
      host.dataset.editable = 'true';
      let frame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => { if (parent.dom.isConnected) parent.requestMeasure(); });
      });
      observer.observe(host);
      cleanups.set(host, () => { observer.disconnect(); cancelAnimationFrame(frame); release(); });
      return host;
    }
    host.tabIndex = 0; host.title = msg('app.click.to.edit.latex.source');
    const child = new EditorView({ parent: host, state: EditorState.create({ doc: this.source, extensions: [
      EditorState.readOnly.of(true), EditorView.editable.of(false), writingComposition,
      latexLanguage(), editorHighlighting, editorTheme, EditorView.lineWrapping,
      EditorView.contentAttributes.of({ tabindex: '-1' }),
      EditorView.theme({ '&': { height: 'auto' }, '.cm-scroller': { overflow: 'visible', padding: '0', lineHeight: 'inherit' }, '.cm-content': { padding: '0', margin: '0', maxWidth: 'none' } }),
      visualLatex({ get: () => context }),
      EditorView.updateListener.of(update => { if (update.geometryChanged || update.heightChanged) requestAnimationFrame(() => { if (parent.dom.isConnected) parent.requestMeasure(); }); }),
    ] }) });
    const jump = (line: number) => {
      if (!parent.composing && parent.dom.isConnected) window.dispatchEvent(new CustomEvent('texpro:native-writing-jump', { detail: { file: this.file, line, source: this.source } }));
    };
    host.addEventListener('mousedown', event => {
      if (event.button !== 0 || (event.target as HTMLElement).closest('.cm-included-writing') !== host) return;
      event.preventDefault(); event.stopPropagation();
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-texpro-pos]');
      const pos = target ? Number(target.dataset.texproPos) : child.posAtCoords({ x: event.clientX, y: event.clientY });
      jump(child.state.doc.lineAt(Math.max(0, Math.min(child.state.doc.length, pos ?? 0))).number);
    }, { capture: true });
    host.addEventListener('keydown', event => { if (event.target === host && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); jump(1); } });
    cleanups.set(host, () => child.destroy()); return host;
  }
  destroy(dom: HTMLElement) { cleanups.get(dom)?.(); cleanups.delete(dom); }
  ignoreEvent() { return true; }
}
