import { useEffect, useRef, useState } from 'react';
import type { InstalledExtension, ExtensionAction, ExtensionResult, ExtensionSnapshot, PanelContribution } from '../../../packages/extension-sdk';
import type { WritingEditorPort } from '../writingPort';
import { sameWritingSnapshot } from '../writingPort';
import type { Diagnostic, Project } from '../../types';
import { localize, validateResult } from './contracts';

interface Environment { editor: WritingEditorPort | null; project: Project | null; generation: number }
export function useExtensionRunner(options: {
  items: InstalledExtension[]; language: 'zh' | 'en'; source: string; file: string | null;
  current: () => Environment; compile: () => Promise<unknown>;
  create: (result: NonNullable<ExtensionResult['project']>) => Promise<void>;
}) {
  const latest = useRef(options); latest.current = options;
  const sequence = useRef(0);
  const [job, setJob] = useState<{ extension: InstalledExtension; action: ExtensionAction; panel?: PanelContribution; snapshot: ExtensionSnapshot; doc: unknown; generation: number; result?: ExtensionResult; error?: string; busy: boolean } | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [completions, setCompletions] = useState<Array<{ label: string; template: string; detail: string }>>([]);
  useEffect(() => { setDiagnostics([]); setCompletions([]); }, [options.source, options.file]);
  useEffect(() => { setDiagnostics([]); setCompletions([]); }, [options.items]);
  const close = () => { sequence.current++; setJob(null); const editor = latest.current.current().editor; requestAnimationFrame(() => { if (!document.querySelector('[role="dialog"]')) editor?.focus(); }); };
  function valid(value: NonNullable<typeof job>) {
    const env = latest.current.current();
    return sameWritingSnapshot({ generation: value.generation, file: value.snapshot.file, identity: value.doc }, env) && latest.current.items.some(item => item.enabled && item.manifest.id === value.extension.manifest.id && item.digest === value.extension.digest);
  }
  function open(extension: InstalledExtension, action: ExtensionAction, panel?: PanelContribution) {
    sequence.current++;
    const env = latest.current.current(), editor = env.editor;
    setJob({ extension, action: panel ? { ...action, level: panel.level } : action, panel, snapshot: { source: editor?.getContent() || '', file: editor?.getPath(), selection: editor?.getSelectionRange() || { from: 0, to: 0 }, language: latest.current.language, ...(env.project ? { project: { root: env.project.root, name: env.project.name, rootFile: env.project.rootFile } } : {}) }, doc: editor?.getDocumentIdentity() ?? null, generation: env.generation, busy: false });
  }
  async function run(input: Record<string, unknown>) {
    if (!job) return;
    const id = ++sequence.current, request = job;
    if (!valid(request)) { setJob({ ...request, error: 'Document changed. Reopen this tool.', busy: false }); return; }
    setJob({ ...request, result: undefined, error: undefined, busy: true });
    try {
      const result = validateResult(await window.texpro.extensionsInvoke(request.extension.manifest.id, request.action.id, request.snapshot, input), request.snapshot.source);
      if (id !== sequence.current) return;
      if (!valid(request)) throw new Error('Document changed. Reopen this tool.');
      setJob({ ...request, result, busy: false });
      if (result.diagnostics) setDiagnostics(result.diagnostics.map(item => ({ file: request.snapshot.file, line: request.snapshot.source.slice(0, item.from).split('\n').length, column: item.from - request.snapshot.source.lastIndexOf('\n', item.from - 1), severity: item.severity, message: item.message, source: request.extension.manifest.id })));
    } catch (error) { if (id === sequence.current) setJob({ ...request, busy: false, error: String(error instanceof Error ? error.message : error) }); }
  }
  async function apply(kind: 'edits' | 'completions' | 'compile' | 'project') {
    if (!job?.result) return;
    try {
      if (!valid(job)) throw new Error('Document changed. Reopen this tool.');
      const result = job.result;
      if (kind === 'edits' && result.edits) {
        if (!latest.current.current().editor?.applyExtensionEdits(job.snapshot.source, result.edits)) throw new Error('Document changed. Reopen this tool.');
        close(); latest.current.current().editor?.focus();
      } else if (kind === 'completions' && result.completions) {
        setCompletions(result.completions.map(item => ({ ...item, detail: item.detail || localize(job.action.title, options.language) }))); close();
      } else if (kind === 'compile') { close(); await latest.current.compile(); }
      else if (kind === 'project' && result.project) { await latest.current.create(result.project); close(); }
    } catch (error) { setJob({ ...job, error: String(error instanceof Error ? error.message : error), busy: false }); }
  }
  function openPanel(extension: InstalledExtension, panel: PanelContribution) { const action = extension.manifest.contributes.actions?.find(action => panel.actions.includes(action.id)); if (action) open(extension, action, panel); }
  function selectAction(action: ExtensionAction) { if (job) { sequence.current++; setJob({ ...job, action: { ...action, level: job.panel?.level || action.level }, result: undefined, error: undefined, busy: false }); } }
  return { job, open, openPanel, selectAction, close, run, apply, diagnostics, completions };
}
