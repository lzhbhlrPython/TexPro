import { EditorView, WidgetType } from '@codemirror/view';
import { focusWriting } from '../writing';
import { getLanguage, msg } from '../../i18n';
import { assetUrl } from '../../lib/latex';
import { themeTexArtwork } from '../../lib/texArtwork';
import { rasterizeTexPdf } from '../../lib/texPdfArtwork';
import type { WritingPlaceholder } from '../../../electron/services/writing-aids-core.mjs';

function activate(view: EditorView, pos: number) {
  focusWriting(view, pos);
  // Revealing source removes the clicked widget during mousedown. Chromium may
  // then send focus to body on mouseup; restore it after that native sequence.
  requestAnimationFrame(() => {
    if (view.dom.isConnected && view.state.selection.main.head === pos && document.activeElement === document.body) view.focus();
  });
}

abstract class LatexWidget extends WidgetType {
  readonly locale = getLanguage();
  constructor(readonly focusPos: number) {
    super();
  }

  protected bind(dom: HTMLElement, view: EditorView) {
    dom.addEventListener('mousedown', (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      activate(view, this.focusPos);
    });
    dom.setAttribute('title', msg("app.click.to.edit.latex.source"));
    dom.setAttribute('data-texpro-pos', String(this.focusPos));
  }
}

export class PlaceholderWidget extends LatexWidget {
  constructor(readonly item: WritingPlaceholder, readonly block: boolean) { super(item.contentFrom); }
  eq(other: PlaceholderWidget) { return this.item.source === other.item.source && this.focusPos === other.focusPos && this.block === other.block && this.locale === other.locale; }
  toDOM(view: EditorView) {
    const dom = document.createElement('span');
    dom.className = `cm-writing-placeholder${this.block ? ' is-block' : ''}`;
    const labels = { text: "app.text.placeholder", figure: "app.figure.placeholder", table: "app.table.placeholder", citation: "app.citation.placeholder", data: "app.data.placeholder" };
    const label = document.createElement('small'); label.textContent = msg.text(labels[this.item.kind]);
    const description = document.createElement('span'); description.textContent = this.item.text === 'TODO' ? msg("app.describe.what.belongs.here") : this.item.text.replace(/\\([%#$&_{}])/g, '$1');
    dom.append(label, description); this.bind(dom, view);
    dom.setAttribute('role', 'button'); dom.tabIndex = 0;
    dom.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(view, this.focusPos); } });
    return dom;
  }
}

export class InlineMathWidget extends LatexWidget {
  constructor(readonly tex: string, focusPos: number, readonly html: string) {
    super(focusPos);
  }

  eq(other: InlineMathWidget) {
    return other.locale === this.locale && other.tex === this.tex && other.html === this.html;
  }

  toDOM(view: EditorView) {
    const span = document.createElement('span');
    span.className = 'cm-math-inline';
    span.innerHTML = this.html;
    this.bind(span, view);
    return span;
  }

  ignoreEvent() {
    return false;
  }
}

export class DisplayMathWidget extends LatexWidget {
  constructor(
    readonly tex: string,
    readonly label: string | null,
    focusPos: number,
    readonly html: string,
  ) {
    super(focusPos);
  }

  eq(other: DisplayMathWidget) {
    return other.locale === this.locale && other.tex === this.tex && other.label === this.label && other.html === this.html;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement('div');
    wrap.className = 'cm-math-block';
    const body = document.createElement('div');
    body.className = 'cm-math-block-body';
    body.innerHTML = this.html;
    wrap.appendChild(body);
    if (this.label) {
      const tag = document.createElement('span');
      tag.className = 'cm-math-label';
      tag.textContent = this.label;
      wrap.appendChild(tag);
    }
    this.bind(wrap, view);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

export class SectionBadgeWidget extends LatexWidget {
  constructor(
    readonly level: number,
    readonly command: string,
    focusPos: number,
  ) {
    super(focusPos);
  }

  eq(other: SectionBadgeWidget) {
    return other.locale === this.locale && other.level === this.level && other.command === this.command;
  }

  toDOM(view: EditorView) {
    const span = document.createElement('span');
    span.className = `cm-section-badge cm-section-badge-${this.level}`;
    const labels: Record<string, string> = { part: "app.part", chapter: "app.chapter", section: "app.section", subsection: "app.subsection", subsubsection: "app.subsubsection", paragraph: "app.paragraph" };
    span.textContent = msg.text(labels[this.command] || "app.section");
    this.bind(span, view);
    return span;
  }
}

export class BulletWidget extends LatexWidget {
  constructor(focusPos: number) {
    super(focusPos);
  }

  eq(other: BulletWidget) {
    return other.locale === this.locale;
  }

  toDOM(view: EditorView) {
    const span = document.createElement('span');
    span.className = 'cm-list-bullet';
    span.textContent = '•';
    this.bind(span, view);
    return span;
  }
}

export class ImageWidget extends LatexWidget {
  private abort?: AbortController;
  constructor(
    readonly src: string,
    readonly label: string,
    readonly block: boolean,
    focusPos: number,
    readonly file?: string,
  ) {
    super(focusPos);
  }

  eq(other: ImageWidget) {
    return other.locale === this.locale && other.src === this.src && other.block === this.block;
  }

  toDOM(view: EditorView) {
    const figure = document.createElement('figure');
    figure.className = this.block ? 'cm-image-figure cm-image-block' : 'cm-image-figure';
    const img = document.createElement('img');
    const abort = new AbortController(); this.abort = abort;
    const failed = () => {
      if (abort.signal.aborted) return;
      figure.classList.add('cm-image-missing'); img.remove();
      const fallback = document.createElement('span'); fallback.className = 'cm-image-fallback';
      fallback.textContent = msg("app.missing.image.name", { name: this.label }); figure.appendChild(fallback);
      view.requestMeasure();
    };
    if (this.file && /\.pdf$/i.test(this.file)) {
      void rasterizeTexPdf(this.file, { width: Math.max(240, view.contentDOM.clientWidth - 64), height: 500 }, abort.signal).then(rendered => {
        if (abort.signal.aborted || !figure.isConnected) return;
        img.style.width = `${rendered.width}px`; img.src = rendered.src; view.requestMeasure();
      }).catch(failed);
    } else img.src = this.src;
    img.alt = this.label;
    img.loading = 'eager';
    img.addEventListener('error', failed);
    img.addEventListener('load', () => { if (!abort.signal.aborted) view.requestMeasure(); });
    figure.appendChild(img);
    if (this.block) {
      const caption = document.createElement('figcaption');
      caption.textContent = this.label;
      figure.appendChild(caption);
    }
    this.bind(figure, view);
    return figure;
  }

  ignoreEvent() {
    return false;
  }
  destroy() { this.abort?.abort(); }
}

export class CodeBlockWidget extends LatexWidget {
  constructor(
    readonly code: string,
    readonly language: string,
    readonly focusPos: number,
  ) {
    super(focusPos);
  }

  eq(other: CodeBlockWidget) {
    return other.locale === this.locale && other.code === this.code && other.language === this.language;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement('div');
    wrap.className = 'cm-code-widget';
    const head = document.createElement('div');
    head.className = 'cm-code-head';
    const dot = document.createElement('i');
    const label = document.createElement('span');
    label.textContent = this.language === 'code' || !this.language ? msg("app.code") : this.language;
    head.append(dot, label);
    const pre = document.createElement('pre');
    pre.textContent = this.code;
    wrap.append(head, pre);
    this.bind(wrap, view);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

export class PreambleWidget extends LatexWidget {
  constructor(
    readonly documentClass: string,
    readonly packages: number,
    readonly lines: number,
    focusPos: number,
  ) {
    super(focusPos);
  }

  eq(other: PreambleWidget) {
    return other.locale === this.locale && other.documentClass === this.documentClass && other.packages === this.packages && other.lines === this.lines;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement('div');
    wrap.className = 'cm-preamble';
    const icon = document.createElement('div');
    icon.className = 'cm-preamble-icon';
    icon.textContent = 'P';
    const text = document.createElement('div');
    text.className = 'cm-preamble-text';
    const strong = document.createElement('strong');
    strong.textContent = msg("app.preamble");
    const detail = document.createElement('span');
    detail.textContent = `${this.documentClass} · ${msg("app.n.packages", { n: this.packages })} · ${msg("app.n.lines.hidden", { n: this.lines })}`;
    text.append(strong, detail);
    const action = document.createElement('div');
    action.className = 'cm-preamble-action';
    action.textContent = msg("app.reveal");
    wrap.append(icon, text, action);
    this.bind(wrap, view);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

export class TitleWidget extends LatexWidget {
  constructor(
    readonly title: string,
    readonly author: string,
    readonly date: string,
    focusPos: number,
  ) {
    super(focusPos);
  }

  eq(other: TitleWidget) {
    return other.locale === this.locale && other.title === this.title && other.author === this.author && other.date === this.date;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement('div');
    wrap.className = 'cm-title-widget';
    const eyebrow = document.createElement('div');
    eyebrow.className = 'cm-title-eyebrow';
    eyebrow.textContent = msg("app.title.page");
    const h1 = document.createElement('h1');
    h1.textContent = this.title || 'Untitled document';
    const meta = document.createElement('div');
    meta.className = 'cm-title-meta';
    meta.textContent = [this.author, this.date === '\\today' ? msg("app.resolved.at.compile.time") : this.date].filter(Boolean).join('  ·  ');
    wrap.append(eyebrow, h1);
    if (meta.textContent) wrap.appendChild(meta);
    this.bind(wrap, view);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

export class ReferenceWidget extends LatexWidget {
  constructor(
    readonly kind: string,
    readonly target: string,
    focusPos: number,
  ) {
    super(focusPos);
  }

  eq(other: ReferenceWidget) {
    return other.locale === this.locale && other.kind === this.kind && other.target === this.target;
  }

  toDOM(view: EditorView) {
    const element = document.createElement('span');
    const cite = this.kind.startsWith('cite') || this.kind === 'parencite' || this.kind === 'textcite';
    element.className = `cm-ref-pill ${cite ? 'cite' : 'ref'}`;
    element.textContent = cite
      ? `[${this.target}]`
      : this.kind === 'eqref'
        ? `(${this.target})`
        : `→ ${this.target}`;
    this.bind(element, view);
    return element;
  }
}
export class TexLogoWidget extends LatexWidget {
  constructor(focusPos: number) {
    super(focusPos);
  }

  eq(other: TexLogoWidget) {
    return other.locale === this.locale;
  }

  toDOM(view: EditorView) {
    const element = document.createElement('span');
    element.className = 'cm-tex-logo';
    element.textContent = 'LaTeX';
    this.bind(element, view);
    return element;
  }
}

interface TikzResult {
  ok: boolean;
  svgPath?: string;
  pdfPath?: string;
  error?: string;
  log?: string;
  engine?: string;
  cached?: boolean;
  warning?: string;
}

const tikzRequests = new Map<string, Promise<TikzResult>>();

function requestTikz(source: string, projectRoot: string, filePath: string, preamble?: string, engine?: import('../../types').Engine) {
  const key = JSON.stringify([projectRoot, filePath, preamble, source, engine]);
  const cached = tikzRequests.get(key);
  if (cached) return cached;
  const request: Promise<TikzResult> = window.texpro
    .renderTikz({ projectRoot, filePath, source, preamble, engine, preferPdf: true })
    .catch((error): TikzResult => ({ ok: false, error: String(error) }))
    .then(result => { if (!result.ok) tikzRequests.delete(key); return result; });
  if (tikzRequests.size >= 128) tikzRequests.delete(tikzRequests.keys().next().value!);
  tikzRequests.set(key, request);
  return request;
}

export class TikzWidget extends LatexWidget {
  private timer?: ReturnType<typeof setTimeout>;
  private previewAbort?: AbortController;
  constructor(
    readonly source: string,
    readonly projectRoot: string,
    readonly filePath: string,
    focusPos: number,
    readonly kind = 'tikz',
    readonly inline = false,
    readonly previewOnly = false,
    readonly preamble?: string,
    readonly engine?: import('../../types').Engine,
    readonly adapter = 'tikz',
  ) {
    super(focusPos);
  }

  eq(other: TikzWidget) {
    return other.locale === this.locale && other.source === this.source && other.filePath === this.filePath && other.preamble === this.preamble && other.engine === this.engine && other.adapter === this.adapter && other.inline === this.inline && other.previewOnly === this.previewOnly && other.focusPos === this.focusPos;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement(this.inline ? 'span' : 'div');
    wrap.className = `cm-tikz-widget${this.inline ? ' cm-diagram-inline' : ''}${this.previewOnly ? ' cm-writing-preview' : ''}`;
    wrap.dataset.diagramKind = this.kind;

    const header = document.createElement('div');
    header.className = 'cm-tikz-header';
    const label = document.createElement('span');
    label.className = 'cm-tikz-label';
    label.textContent = this.kind === 'chemistry' ? msg("app.chemical.structure") : this.kind === 'circuit' ? msg("app.circuit.logic") : this.adapter;
    const status = document.createElement('span');
    status.className = 'cm-tikz-status'; status.setAttribute('aria-live', 'polite');
    status.textContent = msg("app.rendering");
    const studio = document.createElement('button');
    studio.type = 'button';
    studio.className = 'cm-tikz-studio';
    studio.textContent = msg("app.studio");
    studio.title = msg("app.open.tikz.studio");
    studio.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.dispatchEvent(new CustomEvent('texpro:open-tikz', { detail: { source: this.source, from: this.focusPos - 1, to: this.focusPos - 1 + this.source.length, file: this.filePath } }));
    });
    header.append(label, status);
    header.append(studio);

    const body = document.createElement('div');
    body.className = 'cm-tikz-body';
    const spinner = document.createElement('div');
    spinner.className = 'cm-tikz-spinner';
    spinner.textContent = msg("app.typesetting.diagram");
    body.appendChild(spinner);
    wrap.append(header, body);
    this.bind(body, view);

    const abort = new AbortController(); this.previewAbort = abort;
    const showFailure = (result: TikzResult) => {
      if (abort.signal.aborted || !body.isConnected) return;
      wrap.classList.add('is-failed');
      const message = document.createElement('div');
      message.className = 'cm-tikz-error';
      message.textContent = result.error || msg("app.tikz.rendering.failed");
      body.replaceChildren(message);
      status.textContent = msg("app.render.error"); status.classList.add('failed');
      if (result.log) {
        const details = document.createElement('details'); details.className = 'cm-tikz-log';
        const summary = document.createElement('summary'); summary.textContent = msg("app.show.log");
        const pre = document.createElement('pre'); pre.textContent = result.log.slice(-3000);
        details.append(summary, pre); wrap.appendChild(details);
      }
      view.requestMeasure();
    };
    this.timer = setTimeout(() => { void requestTikz(this.source, this.projectRoot, this.filePath, this.preamble, this.engine).then(async (result) => {
      if (abort.signal.aborted || !body.isConnected) return;
      if (result.ok && (result.pdfPath || result.svgPath)) {
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        const frame = document.createElement('span'); frame.className = 'tex-artwork'; frame.dataset.artwork = 'document-color';
        if (result.pdfPath) {
          const style = getComputedStyle(view.contentDOM);
          const writingWidth = view.contentDOM.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
          const rendered = await rasterizeTexPdf(result.pdfPath, { width: Math.min(this.inline ? 360 : Infinity, writingWidth || 650), height: this.inline ? 150 : this.previewOnly ? 250 : 340 }, abort.signal);
          if (abort.signal.aborted || !body.isConnected) return;
          img.style.width = `${rendered.width}px`;
          img.src = rendered.src;
        } else img.src = assetUrl(result.svgPath!);
        img.addEventListener('load', () => { if (!abort.signal.aborted && body.isConnected) { themeTexArtwork(frame, img); view.requestMeasure(); } });
        img.alt = 'TikZ diagram';
        img.loading = 'lazy';
        img.addEventListener('error', () => showFailure({ ok: false, error: msg("app.could.not.load.the.rendered.diagram") }));
        frame.appendChild(img); body.replaceChildren(frame);
        status.textContent = result.cached ? msg("app.cached") : result.engine || msg("app.rendered");
        status.classList.add('ready');
        if (result.warning) { status.textContent = result.warning; wrap.classList.add('is-failed'); }
      } else {
        showFailure(result);
      }
      view.requestMeasure();
    }).catch(error => showFailure({ ok: false, error: String(error) })); }, 600);

    return wrap;
  }

  ignoreEvent() {
    return false;
  }
  destroy() { clearTimeout(this.timer); this.previewAbort?.abort(); }
}

export class ClearWidget extends WidgetType {
  eq() {
    return true;
  }

  toDOM() {
    return document.createElement('span');
  }
}

export class MusicDataWidget extends WidgetType {
  readonly locale = getLanguage();
  eq(other: MusicDataWidget) { return other.locale === this.locale; }
  toDOM() {
    const dom = document.createElement('div'); dom.className = 'cm-music-data'; dom.textContent = msg("app.music.data.preserved");
    return dom;
  }
}

export class HiddenBlockWidget extends WidgetType {
  eq() {
    return true;
  }

  toDOM() {
    const element = document.createElement('div');
    element.className = 'cm-hidden-block';
    return element;
  }
}

export class EnvironmentWidget extends LatexWidget {
  constructor(
    readonly name: string,
    readonly closing: boolean,
    focusPos: number,
  ) {
    super(focusPos);
  }

  eq(other: EnvironmentWidget) {
    return other.locale === this.locale && other.name === this.name && other.closing === this.closing;
  }

  toDOM(view: EditorView) {
    const element = document.createElement('div');
    element.className = `cm-env-marker ${this.closing ? 'closing' : ''}`;
    const icon = document.createElement('span');
    icon.className = 'cm-env-icon';
    icon.textContent = this.closing ? '/' : '▸';
    const label = document.createElement('span');
    label.textContent = this.name;
    element.append(icon, label);
    this.bind(element, view);
    return element;
  }

  ignoreEvent() {
    return false;
  }
}

export class LabelWidget extends LatexWidget {
  constructor(
    readonly label: string,
    focusPos: number,
  ) {
    super(focusPos);
  }

  eq(other: LabelWidget) {
    return other.locale === this.locale && other.label === this.label;
  }

  toDOM(view: EditorView) {
    const element = document.createElement('span');
    element.className = 'cm-label-pill';
    element.textContent = '#' + this.label;
    this.bind(element, view);
    return element;
  }
}

export class CaptionBadgeWidget extends LatexWidget {
  constructor(focusPos: number) {
    super(focusPos);
  }

  eq(other: CaptionBadgeWidget) {
    return other.locale === this.locale;
  }

  toDOM(view: EditorView) {
    const element = document.createElement('span');
    element.className = 'cm-caption-badge';
    element.textContent = msg("app.caption.variant2");
    this.bind(element, view);
    return element;
  }
}
