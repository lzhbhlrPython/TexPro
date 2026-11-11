import { useEffect, useMemo, useRef, useState } from 'react';
import { detectEngine } from '../../electron/services/tex-engine.mjs';
import type { Engine, OpenDoc } from '../types';
import type { RealtimeEvent, RealtimePage } from '../lib/realtimeTypes';

const EMPTY_PAGES: RealtimePage[] = [];
const EMPTY_DIAGNOSTICS: NonNullable<RealtimeEvent['diagnostics']> = [];

/** An internal acceleration path of the existing preview, with no user mode. */
export function useRealtimePreview(enabled: boolean, root: string | null, rootFile: string | null, engine: Engine, docs: Record<string, OpenDoc>, composing: boolean, projectFiles = '') {
  const [state, setState] = useState('Starting');
  const [error, setError] = useState('');
  const [pages, setPages] = useState<RealtimePage[]>([]);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const [diagnostics, setDiagnostics] = useState<NonNullable<RealtimeEvent['diagnostics']>>([]);
  const [diskMain, setDiskMain] = useState<{ path: string; text: string } | null>(null);
  const session = useRef<string | null>(null);
  const docsRef = useRef(docs); docsRef.current = docs;
  const committedDocs = useRef(docs);
  const composingRef = useRef(composing); composingRef.current = composing;
  if (!composing) committedDocs.current = docs;
  const sourceDocs = composing ? committedDocs.current : docs;
  const mainText = rootFile ? sourceDocs[rootFile]?.content ?? (diskMain?.path === rootFile ? diskMain.text : undefined) : undefined;
  const selectedEngine = useMemo(() => mainText === undefined ? null : detectEngine(mainText, engine), [mainText, engine]);
  const eligible = enabled && Boolean(root && rootFile) && selectedEngine === 'lualatex';
  // Closed or removed buffers must also leave the engine snapshot.
  const documentPaths = Object.keys(docs).sort().join('\0');
  const owner = [root, rootFile, engine].join('\0');
  const dataOwner = useRef('');
  const snapshot = () => Object.values(composingRef.current ? committedDocs.current : docsRef.current).filter(doc => /\.(tex|ltx)$/i.test(doc.path)).map(doc => ({ path: doc.path, text: doc.content }));
  useEffect(() => {
    if (!enabled || !rootFile || docsRef.current[rootFile]) return;
    let cancelled = false;
    void window.texpro.readFile(rootFile).then(text => { if (!cancelled) setDiskMain({ path: rootFile, text }); }).catch(() => {});
    return () => { cancelled = true; };
  }, [enabled, root, rootFile, documentPaths, projectFiles]);
  useEffect(() => {
    if (dataOwner.current !== owner || !eligible) { setPages([]); setPdf(null); }
    dataOwner.current = owner;
    setError(''); setDiagnostics([]); setState('Starting');
    if (!eligible || !root || !rootFile) return;
    const id = crypto.randomUUID(); session.current = id;
    const unsubscribe = window.texpro.onRealtime(event => {
      if (event.sessionId !== id || session.current !== id) return;
      if (event.error || event.kind === 'error') { setError(event.error || 'Realtime preview unavailable'); setState('Failed'); }
      else if (event.state) setState(event.partial ? 'Partial' : event.state);
      if (event.kind === 'diagnostics') setDiagnostics(event.diagnostics || []);
      if (event.pages) setPages(previous => {
        const next = new Map(previous.map(page => [page.page, page]));
        for (const page of event.pages!) next.set(page.page, page);
        if (event.total !== undefined) for (const number of next.keys()) if (number > event.total!) next.delete(number);
        return [...next.values()].sort((a, b) => a.page - b.page);
      });
      if (event.pdf) { setPdf(event.pdf); setError(''); }
    });
    void window.texpro.startRealtime({ root, engine, sessionId: id, documents: snapshot() }).then(() => {
      if (session.current === id) return window.texpro.updateRealtime(id, snapshot());
    }).catch(failure => { if (session.current === id) { setError(String(failure)); setState('Failed'); } });
    return () => { session.current = null; unsubscribe(); void window.texpro.stopRealtime(id).catch(() => {}); };
  }, [eligible, root, rootFile, engine, documentPaths, projectFiles]);
  useEffect(() => {
    if (!eligible || composing || !session.current || state === 'Failed') return;
    const id = session.current;
    const timer = setTimeout(() => {
      void window.texpro.updateRealtime(id, snapshot()).catch(failure => {
        if (session.current === id) { setError(String(failure)); setState('Failed'); }
      });
    }, 35);
    return () => clearTimeout(timer);
  }, [docs, eligible, composing]);
  const current = eligible && dataOwner.current === owner;
  return { state, error: current ? error : '', pages: current ? pages : EMPTY_PAGES, pdf: current ? pdf : null, diagnostics: current ? diagnostics : EMPTY_DIAGNOSTICS, running: eligible && state !== 'Failed' };
}
