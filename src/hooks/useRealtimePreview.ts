import { useEffect, useRef, useState } from 'react';
import type { Engine, OpenDoc } from '../types';
import type { RealtimeEvent, RealtimePage } from '../lib/realtimeTypes';

export function useRealtimePreview(enabled: boolean, root: string | null, rootFile: string | null, engine: Engine, docs: Record<string, OpenDoc>, composing: boolean, projectFiles = '') {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('Starting');
  const [error, setError] = useState('');
  const [pages, setPages] = useState<RealtimePage[]>([]);
  const [pdf, setPdf] = useState<Uint8Array | null>(null);
  const [diagnostics, setDiagnostics] = useState<NonNullable<RealtimeEvent['diagnostics']>>([]);
  const session = useRef<string | null>(null);
  const docsRef = useRef(docs); docsRef.current = docs;
  // A closed, renamed or deleted buffer may still exist in the engine snapshot.
  const documentPaths = Object.keys(docs).sort().join('\0');
  const snapshot = () => Object.values(docsRef.current).filter(doc => /\.(tex|ltx)$/i.test(doc.path)).map(doc => ({ path: doc.path, text: doc.content }));
  useEffect(() => {
    setPages([]); setPdf(null); setError(''); setDiagnostics([]); setState('Starting');
    if (!enabled || !root || !rootFile) return;
    const id = crypto.randomUUID(); session.current = id;
    const unsubscribe = window.texpro.onRealtime(event => {
      if (event.sessionId !== id || session.current !== id) return;
      if (event.error || event.kind === 'error') { setError(event.error || 'Realtime preview unavailable'); setState('Failed'); }
      if (event.state) setState(event.partial ? 'Partial' : event.state);
      if (event.kind === 'diagnostics') setDiagnostics(event.diagnostics || []);
      if (event.pages) setPages(previous => {
        const next = new Map(previous.map(page => [page.page, page]));
        for (const page of event.pages!) next.set(page.page, page);
        if (event.total !== undefined) for (const number of next.keys()) if (number > event.total!) next.delete(number);
        return [...next.values()].sort((a, b) => a.page - b.page);
      });
      if (event.pdf) { setPdf(event.pdf); setError(''); }
      if (event.state === 'Ready') setError('');
    });
    void window.texpro.startRealtime({ root, engine, sessionId: id, documents: snapshot() }).then(() => {
      if (session.current === id) return window.texpro.updateRealtime(id, snapshot());
    }).catch(failure => { if (session.current === id) { setError(String(failure)); setState('Failed'); } });
    return () => { session.current = null; unsubscribe(); void window.texpro.stopRealtime(id).catch(() => {}); };
  }, [enabled, root, rootFile, engine, attempt, documentPaths, projectFiles]);
  useEffect(() => {
    if (!enabled || composing || !session.current) return;
    const id = session.current;
    const timer = setTimeout(() => {
      void window.texpro.updateRealtime(id, snapshot()).catch(failure => {
        if (session.current === id) { setError(String(failure)); setState('Failed'); }
      });
    }, 35);
    return () => clearTimeout(timer);
  }, [docs, enabled, composing, attempt]);
  return { state, error, pages, pdf, diagnostics, retry: () => setAttempt(value => value + 1), running: enabled && state !== 'Failed' };
}
