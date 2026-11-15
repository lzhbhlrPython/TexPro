import { WidgetType, type EditorView } from '@codemirror/view';
import type { RenderTask } from 'pdfjs-dist';
import { acquireNativePdf, releaseNativePdf, nativePdfScene } from './nativePdf';
import { nativeTextFragment } from './nativeText';
import { toSyncPoint, toViewportRect } from '../../lib/pdfSync';
import { themeTexArtwork } from '../../lib/texArtwork';
import type { NativeRenderedRegion, NativeWritingProjection } from '../../lib/writingEngine/native';
import { focusWriting } from '../writing';
import { getLanguage, msg } from '../../i18n';

/** PDF pixels are a projection of immutable source, never the document model. */
export class NativeWritingWidget extends WidgetType {
  readonly locale = getLanguage();
  constructor(readonly projection: NativeWritingProjection, readonly region: NativeRenderedRegion, readonly from: number, readonly to: number) { super(); }
  eq(other: NativeWritingWidget) { return this.projection.revision === other.projection.revision && this.region === other.region && this.from === other.from && this.to === other.to && this.locale === other.locale; }
  private cleanups = new WeakMap<HTMLElement, () => void>();
  toDOM(view: EditorView) {
    const host = document.createElement('div'); host.className = 'cm-native-writing';
    host.setAttribute('role', 'group'); host.setAttribute('aria-label', msg('app.click.to.edit.latex.source'));
    const resource = acquireNativePdf(this.projection), tasks = new Set<RenderTask>(), observers: IntersectionObserver[] = [];
    let destroyed = false;
    const original = this.projection.source.slice(this.region.from, this.region.to);
    const fallback = (error?: unknown) => {
      host.dataset.nativeError = String(error);
      if (!destroyed) window.dispatchEvent(new CustomEvent('texpro:native-render-error', { detail: { session: this.projection.session, error: String(error) } }));
      if (!destroyed) { host.replaceChildren(); const pre = document.createElement('pre'); pre.textContent = original; host.append(pre); host.title = msg('writing.native.unavailable'); view.requestMeasure(); }
    };
    const reveal = (pos: number) => {
      if (destroyed || view.composing || view.state.doc.sliceString(this.from, this.to) !== original) return;
      focusWriting(view, Math.max(this.from, Math.min(this.to, pos)));
      requestAnimationFrame(() => { if (view.dom.isConnected && document.activeElement === document.body) view.focus(); });
    };
    void resource.ready.then(async pdf => {
      const fragments = this.region.fragments;
      for (const fragment of fragments) {
        if (destroyed) return;
        const page = await pdf.getPage(fragment.page); if (destroyed) return;
        const viewport = page.getViewport({ scale: 1 });
        const crop = toViewportRect(fragment, viewport);
        if (crop.width <= 0 || crop.height <= 0 || !Number.isFinite(crop.width * crop.height)) continue;
        const frame = document.createElement('div'); frame.className = 'cm-native-fragment';
        frame.style.width = `${crop.width * 96 / 72}px`; frame.style.maxWidth = '100%'; frame.style.aspectRatio = `${crop.width} / ${crop.height}`;
        frame.tabIndex = 0; frame.setAttribute('role', 'button'); frame.setAttribute('aria-label', msg('app.click.to.edit.latex.source'));
        frame.title = msg('app.click.to.edit.latex.source');
        frame.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); reveal(this.from + 1); } });
        frame.addEventListener('mousedown', event => {
          if (event.button !== 0) return; event.preventDefault(); event.stopPropagation();
          if (view.composing) return;
          const bounds = frame.getBoundingClientRect();
          const run = (event.target as HTMLElement).closest<HTMLElement>('[data-native-x]');
          const point = run ? toSyncPoint({ x: Number(run.dataset.nativeX), y: Number(run.dataset.nativeY) }, viewport) : toSyncPoint({ x: crop.x + (event.clientX - bounds.left) * crop.width / bounds.width, y: crop.y + (event.clientY - bounds.top) * crop.height / bounds.height }, viewport);
          // Capture the target before awaiting native navigation. Cursor/file/source
          // changes while the query runs invalidate it, just like an editing proposal.
          const selection = view.state.selection.main, source = view.state.doc.toString();
          void window.texpro.inverseNativeWriting(this.projection.session, this.projection.revision, { page: fragment.page, ...point }).then(hit => {
            if (destroyed || view.composing || view.state.doc.toString() !== source || !view.state.selection.main.eq(selection)) return;
            if (hit.file !== this.projection.file) {
              window.dispatchEvent(new CustomEvent('texpro:native-writing-jump', { detail: hit })); return;
            }
            const offset = hit.source.split('\n').slice(0, hit.line - 1).reduce((sum, line) => sum + line.length + 1, 0) + Math.max(0, hit.column - 1);
            reveal(offset >= this.region.from && offset <= this.region.to ? this.from + offset - this.region.from : this.from + 1);
          }).catch(() => reveal(this.from + 1));
        });
        let rendering = false;
        const render = async () => {
          if (destroyed || rendering) return; rendering = true;
          const { scene } = await nativePdfScene(resource, fragment.page);
          if (destroyed) return;
          const prose = nativeTextFragment(scene, crop, original);
          if (prose) {
            frame.style.width = 'auto'; frame.style.aspectRatio = 'auto'; frame.classList.add('is-prose'); frame.append(prose); frame.dataset.nativeReady = 'true'; view.requestMeasure(); return;
          }
          const width = frame.getBoundingClientRect().width || crop.width * 96 / 72;
          const scale = width / crop.width;
          const density = Math.min(3, Math.max(2, window.devicePixelRatio || 1), Math.sqrt(16000000 / Math.max(1, crop.width * crop.height * scale * scale)));
          const rasterScale = scale * density, canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.ceil(crop.width * rasterScale)); canvas.height = Math.max(1, Math.ceil(crop.height * rasterScale));
          canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.setAttribute('aria-hidden', 'true');
          canvas.getContext('2d', { alpha: true });
          const task = page.render({ canvas, viewport: page.getViewport({ scale: rasterScale }), background: 'rgba(0,0,0,0)', transform: [1, 0, 0, 1, -crop.x * rasterScale, -crop.y * rasterScale] }); tasks.add(task);
          try {
            await task.promise;
            if (destroyed) return;
            frame.append(canvas); themeTexArtwork(frame, canvas); frame.dataset.nativeReady = 'true'; view.requestMeasure();
          } catch (error) { if (!destroyed) fallback(error); } finally { tasks.delete(task); }
        };
        host.append(frame);
        const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void render().catch(fallback); } }, { root: view.scrollDOM, rootMargin: '600px' });
        observers.push(observer); observer.observe(frame);
      }
      if (!destroyed) view.requestMeasure();
    }).catch(fallback);
    this.cleanups.set(host, () => { destroyed = true; for (const task of tasks) task.cancel(); observers.forEach(observer => observer.disconnect()); releaseNativePdf(this.projection.revision, resource); });
    return host;
  }
  destroy(dom: HTMLElement) { this.cleanups.get(dom)?.(); }
  ignoreEvent() { return true; }
}
