import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Minus, Plus, RefreshCw } from 'lucide-react';
import { loadPdfRuntime } from '../lib/pdfRuntime';
import type { RealtimePage } from '../lib/realtimeTypes';
import type { useRealtimePreview } from '../hooks/useRealtimePreview';
import { useI18n } from '../i18n';

type Preview = ReturnType<typeof useRealtimePreview>;
function Page({ page, pdf }: { page: RealtimePage; pdf: PDFDocumentProxy | null }) {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '300px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!page.svg) { setUrl(''); return; }
    const next = URL.createObjectURL(new Blob([page.svg], { type: 'image/svg+xml' }));
    setUrl(next); return () => URL.revokeObjectURL(next);
  }, [page.svg]);
  useEffect(() => {
    setError(false);
    if (page.svg || !pdf || !visible) return;
    let cancelled = false;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']> | undefined;
    void pdf.getPage(page.page).then(async source => {
      if (cancelled || !canvas.current) return;
      const viewport = source.getViewport({ scale: 1.5 });
      const target = canvas.current;
      target.width = viewport.width; target.height = viewport.height;
      task = source.render({ canvas: target, viewport });
      await task.promise;
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; task?.cancel(); };
  }, [page.svg, page.page, pdf, visible]);
  return <div ref={container} className="realtime-page" style={{ aspectRatio: `${page.width} / ${page.height}` }}>
    {page.svg ? <img src={url || undefined} alt={t('Typeset page {page}', { page: page.page })} /> : <>
      <canvas ref={canvas} aria-label={t('Typeset page {page}', { page: page.page })} />
      <span className="realtime-fallback">{t(error ? 'Could not display the PDF' : 'Full layout preview')}</span>
    </>}
  </div>;
}
export function RealtimePane({ preview }: { preview: Preview }) {
  const { t } = useI18n();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pdfError, setPdfError] = useState('');
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    if (!preview.pdf) { setPdf(null); setPdfError(''); return; }
    let cancelled = false;
    let task: ReturnType<typeof import('pdfjs-dist')['getDocument']> | undefined;
    void loadPdfRuntime().then(async runtime => {
      if (cancelled) return;
      task = runtime.getDocument({ data: preview.pdf!.slice() });
      const document = await task.promise;
      if (cancelled) { void task?.destroy(); return; }
      setPdf(document); setPdfError('');
    }).catch(failure => { if (!cancelled) setPdfError(String(failure)); });
    return () => { cancelled = true; void task?.destroy(); };
  }, [preview.pdf]);
  const states: Record<string, string> = {
    Starting: 'Starting realtime preview…', Ready: 'Realtime preview ready', Restarting: 'Restarting realtime preview…',
    Converged: 'Layout up to date', Converging: 'Updating pagination and references…', Stale: 'Updating pagination and references…',
    Live: 'Paragraph updated', Background: 'Waiting for full layout…', Failed: 'Realtime preview unavailable',
    PassLimitReached: 'References have not converged', Partial: 'Layout contains TeX errors',
  };
  return <section className="realtime-pane" aria-label={t('Realtime TeX preview')}>
    <div className="pdf-toolbar">
      <span className="realtime-state" role="status">{t(states[preview.state] || 'Waiting for full layout…')}</span>
      <div className="pdf-toolbar-actions">
        <button className="icon-btn" aria-label={t('Zoom out')} onClick={() => setZoom(x => Math.max(0.5, x - 0.1))}><Minus size={14} /></button>
        <button className="icon-btn" aria-label={t('Zoom in')} onClick={() => setZoom(x => Math.min(2.5, x + 0.1))}><Plus size={14} /></button>
        <button className="icon-btn" aria-label={t('Retry realtime preview')} onClick={preview.retry}><RefreshCw size={14} /></button>
      </div>
    </div>
    <div className="realtime-scroll">
      {(preview.error || pdfError) && <div className="realtime-message" role="alert"><p>{t('Realtime preview unavailable')}</p><p>{t(preview.error.includes('requires LuaLaTeX') ? 'Realtime preview requires LuaLaTeX' : preview.error.includes('ENOENT') ? 'Install LuaLaTeX to use realtime preview.' : 'Retry realtime preview')}</p><details><summary>{t('Technical details')}</summary>{preview.error || pdfError}</details><button className="secondary-btn" onClick={preview.retry}>{t('Retry realtime preview')}</button></div>}
      {!preview.pages.length && !preview.error && <p className="realtime-message">{t('Preparing the first layout. You can keep writing.')}</p>}
      {preview.diagnostics.filter(item => item.severity === 'error').slice(0, 3).map((item, i) => <p className="realtime-message" key={i}>{[item.file, item.line].filter(value => value !== undefined && value !== '').join(':')} {item.message}</p>)}
      <div className="realtime-pages" style={{ width: `${zoom * 100}%` }}>
        {preview.pages.map(page => <Page key={page.page} page={page} pdf={pdf} />)}
      </div>
    </div>
  </section>;
}
