import { EditorView, WidgetType } from '@codemirror/view';

/** Keep artwork spacing inside the box CodeMirror measures for hit testing. */
export class WritingBlockWidget extends WidgetType {
  constructor(readonly content: WidgetType) { super(); }
  eq(other: WritingBlockWidget) {
    return this.content.constructor === other.content.constructor && this.content.eq(other.content);
  }
  toDOM(view: EditorView) {
    const host = document.createElement('div');
    host.className = 'cm-writing-block';
    host.appendChild(this.content.toDOM(view));
    return host;
  }
  updateDOM(host: HTMLElement, view: EditorView, previous: WritingBlockWidget) {
    const child = host.firstElementChild as HTMLElement | null;
    return !!child && this.content.constructor === previous.content.constructor
      && this.content.updateDOM(child, view, previous.content);
  }
  ignoreEvent(event: Event) { return this.content.ignoreEvent(event); }
  coordsAt(host: HTMLElement, pos: number, side: number) {
    const child = host.firstElementChild as HTMLElement | null;
    return child ? this.content.coordsAt(child, pos, side) : null;
  }
  destroy(host: HTMLElement) {
    const child = host.firstElementChild as HTMLElement | null;
    if (child) this.content.destroy(child);
  }
}
