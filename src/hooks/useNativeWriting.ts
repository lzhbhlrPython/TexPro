import { useEffect, useMemo, useState } from 'react';
import type { Engine, OpenDoc, Project } from '../types';
import { nativeWritingRegions, type NativeWritingProjection } from '../lib/writingEngine/native';
import type { WritingComposition } from '../lib/writingEngine/includes';
import type { ProjectWritingContext } from '../lib/writingEngine/project';

/** Snapshot compilation is deliberately independent of save and formal PDF state. */
export function useNativeWriting(project: Project | null, docs: Record<string, OpenDoc>, active: string, engine: Engine, enabled: boolean, composing: boolean, context?: ProjectWritingContext, composition?: WritingComposition) {
  const session = useMemo(() => crypto.randomUUID(), [project?.root, project?.rootFile, engine, enabled]);
  const [result, setResult] = useState<{ owner: string; projection?: NativeWritingProjection; error?: string; incomplete?: boolean }>({ owner: '' });
  const documents = JSON.stringify(Object.values(docs).filter(doc => /\.(tex|ltx|sty|cls|bib)$/i.test(doc.path)).map(doc => ({ path: doc.path, content: doc.content })));
  const source = docs[active]?.content;
  const regions = useMemo(() => source && enabled && context ? Object.entries(composition?.sources || { [active]: source }).flatMap(([file, text]) => nativeWritingRegions(docs[file]?.content ?? text, file, context).map(region => ({ ...region, file }))) : [], [source, active, context, enabled, composition]);
  const owner = `${session}\0${active}\0${context?.revision}`;
  useEffect(() => {
    const failed = (event: Event) => {
      const detail = (event as CustomEvent<{ session: string; error: string }>).detail;
      if (detail?.session === session) setResult({ owner, error: detail.error });
    };
    window.addEventListener('texpro:native-render-error', failed);
    return () => window.removeEventListener('texpro:native-render-error', failed);
  }, [session, owner]);
  useEffect(() => () => { void window.texpro.stopNativeWriting(session); }, [session]);
  useEffect(() => {
    if (!enabled || !project?.rootFile || composing || !regions.length) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void window.texpro.renderNativeWriting({ session, root: project.root, file: active, engine, documents: JSON.parse(documents), regions: regions.slice(0, 64) }).then(value => {
        if (!cancelled && value) setResult({ owner, projection: { ...value, session, file: active }, incomplete: value.incomplete || regions.length > 64 });
      }).catch(error => { if (!cancelled) setResult({ owner, error: String(error.message || error) }); });
    }, 650);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [owner, documents, source, regions, composing, enabled, engine]);
  // A region is eligible only when its original source still matches. The view
  // adapter maps unchanged regions around edits; it never displays stale changes.
  return result.owner === owner && regions.length ? { ...result, session } : { owner, session };
}
