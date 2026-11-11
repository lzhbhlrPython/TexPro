import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { RealtimePage } from '../lib/realtimeTypes';
import { useI18n } from '../i18n';

export function RealtimePageView({ page, pdf, scale, onPrepareSource, onError }: { page: RealtimePage; pdf: PDFDocumentProxy | null; scale: number; onPrepareSource: () => void; onError: (message: string) => void }) {
  const { t } = useI18n();
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [url, setUrl] = useState('');
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
    }).catch(error => { if (!cancelled && error?.name !== 'RenderingCancelledException') onError(String(error?.message || error)); });
    return () => { cancelled = true; task?.cancel(); };
  }, [page.svg, page.page, pdf, visible, onError]);
  return <div className="pdf-page-shell" data-page={page.page}>
    <div className="pdf-page-label">{t('Page {page}', { page: page.page })}</div>
    <div ref={container} className="pdf-page realtime-page" style={{ width: page.width * scale, height: page.height * scale }}
      onPointerDown={event => { if (event.metaKey || event.ctrlKey) { event.preventDefault(); onPrepareSource(); } }}>

      {page.svg ? <img src={url || undefined} alt={t('Typeset page {page}', { page: page.page })} /> : <>
        <canvas ref={canvas} aria-label={t('Typeset page {page}', { page: page.page })} />
      </>}
    </div>
  </div>;
}
