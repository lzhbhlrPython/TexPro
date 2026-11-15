import { useEffect, useState, useMemo } from 'react';
import { loadWritingComposition, type WritingComposition } from '../lib/writingEngine/includes';
import type { ProjectWritingContext } from '../lib/writingEngine/project';
import type { OpenDoc, Project } from '../types';

export function useWritingComposition(project: Project | null, active: string, docs: Record<string, OpenDoc>, enabled: boolean, composing: boolean, context?: ProjectWritingContext) {
  const [value, setValue] = useState<{ owner: string; value: WritingComposition } | null>(null);
  // Preamble refreshes must not unmount live file editors while discovery catches up.
  const owner = `${project?.root}\0${project?.rootFile}\0${active}`;
  const sources = JSON.stringify(Object.values(docs).map(doc => [doc.path, doc.content]));
  useEffect(() => {
    if (!enabled || !context || !project || !docs[active] || composing) return;
    let cancelled = false;
    const timer = setTimeout(() => { void loadWritingComposition(active, docs[active].content, context, async file => {
      if (cancelled) throw new Error('Obsolete composition');
      return docs[file]?.content ?? window.texpro.readWritingSource(project.root, file);
    }).then(result => { if (!cancelled) setValue({ owner, value: result }); }); }, 120);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [owner, context, sources, enabled, composing]);
  return useMemo(() => {
    if (value?.owner !== owner) return undefined;
    // Open buffers remain the immediate source of truth while dependency discovery settles.
    return { ...value.value, sources: Object.fromEntries(Object.entries(value.value.sources).filter(([file]) => file === active || context?.files.includes(file)).map(([file, text]) => [file, docs[file]?.content ?? text])) };
  }, [value, owner, sources, context, active]);
}
