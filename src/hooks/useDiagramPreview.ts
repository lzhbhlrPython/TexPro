import { useEffect, useState } from 'react';
import { rasterizeTexPdf } from '../lib/texPdfArtwork';
import { assetUrl } from '../lib/latex';
import type { Engine } from '../types';

/** One PDF path for inline and studio artwork, with stale-result and decode guards. */
export function useDiagramPreview(open: boolean, projectRoot: string | null, filePath: string | null, source: string, preamble?: string, engine?: Engine) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setPreview(null); setError('');
    if (!open || !projectRoot || !filePath || !source.trim()) { setBusy(false); return; }
    const abort = new AbortController();
    setBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await window.texpro.renderTikz({ projectRoot, filePath, source, preamble: preamble ? preamble + '\n\\begin{document}' : undefined, engine, preferPdf: true });
        if (abort.signal.aborted) return;
        if (!result.ok || (!result.pdfPath && !result.svgPath)) throw new Error(result.error || 'Preview failed');
        const src = result.pdfPath ? (await rasterizeTexPdf(result.pdfPath, { width: 900, height: 700 }, abort.signal)).src : assetUrl(result.svgPath!);
        if (!abort.signal.aborted) { setPreview(src); setError(result.warning || ''); }
      } catch (failure) {
        if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : String(failure));
      } finally { if (!abort.signal.aborted) setBusy(false); }
    }, 550);
    return () => { abort.abort(); window.clearTimeout(timer); };
  }, [open, projectRoot, filePath, source, preamble, engine, attempt]);
  return { preview, error, busy, retry: () => setAttempt(value => value + 1) };
}
