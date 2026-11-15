import { useEffect, useMemo, useRef, useState } from 'react';
import { loadProjectWriting, type ProjectWritingContext } from '../lib/writingEngine/project';
import type { OpenDoc, Project } from '../types';
import { flattenFiles } from '../app/project';
import { texDocumentStart } from '../lib/texDocument';

export function useProjectWriting(project: Project | null, docs: Record<string, OpenDoc>, composing: boolean) {
  const [result, setResult] = useState<{ owner: string; context: ProjectWritingContext } | null>(null);
  const revision = useRef(0);
  const files = useMemo(() => project ? flattenFiles(project.tree).map(file => file.path) : [], [project?.tree]);
  const owner = `${project?.root}\0${project?.rootFile}`;
  // Body edits do not trigger disk reads. Dependency edits and file refreshes do.
  const dependencies = result?.owner === owner ? result.context.dependencies : [project?.rootFile];
  const sources = JSON.stringify(Object.values(docs).filter(doc => dependencies.includes(doc.path)).map(doc => [doc.path, doc.content.slice(0, texDocumentStart(doc.content)?.from ?? doc.content.length)]));
  useEffect(() => {
    if (!project?.rootFile || composing) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void loadProjectWriting(project.rootFile!, files, async path => {
        if (cancelled) throw new Error('Obsolete writing context request');
        return docs[path]?.content ?? await window.texpro.readWritingSource(project.root, path);
      }, project.root).then(context => {
        if (!cancelled) setResult({ owner, context: { ...context, revision: ++revision.current } });
      }).catch(() => { if (!cancelled) setResult(null); });
    }, 100);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [owner, files, sources, composing]);
  return result?.owner === owner ? result.context : undefined;
}
