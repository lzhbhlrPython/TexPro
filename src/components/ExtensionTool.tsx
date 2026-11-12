import { WorkspaceFrame } from './WorkspaceFrame';
import { useEffect, useRef, useState } from 'react';
import { Download, Play, X } from 'lucide-react';
import type { useExtensionRunner } from '../app/extensions/useExtensionRunner';
import { localize } from '../app/extensions/contracts';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { useI18n } from '../i18n';
type Runner = ReturnType<typeof useExtensionRunner>;
export function ExtensionTool({ runner }: { runner: Runner }) {
  const { t, language } = useI18n(), ref = useRef<HTMLElement>(null);
  const [input, setInput] = useState(''), [error, setError] = useState('');
  useDialogFocus(Boolean(runner.job) && runner.job?.action.level !== 'L3', ref, runner.close);
  useEffect(() => { setInput(''); setError(''); }, [runner.job?.extension.manifest.id, runner.job?.action.id]);
  const job = runner.job; if (!job) return null;
  const result = job.result;
  const body = <>
    <header className="studio-header"><div className="studio-heading"><div><span className="modal-eyebrow">{localize(job.extension.manifest.name, language)}</span><h2>{localize(job.action.title, language)}</h2></div></div><button className="icon-btn" onClick={runner.close} aria-label={t('Close')}><X size={18} /></button></header>
    {job.panel && <nav className="extension-install" aria-label={t('Tool actions')}>{(job.extension.manifest.contributes.actions || []).filter(action => job.panel!.actions.includes(action.id)).map(action => <button className={job.action.id === action.id ? 'primary-btn' : 'secondary-btn'} key={action.id} onClick={() => runner.selectAction(action)}>{localize(action.title, language)}</button>)}</nav>}
    <div className="extension-tool-body"><p>{localize(job.action.description, language)}</p><label className="extension-input"><span>{t('Input (optional)')}</span><textarea value={input} placeholder={t('Text or JSON parameters')} onChange={event => setInput(event.target.value)} /></label>
      <button className="primary-btn" disabled={job.busy} onClick={() => { try { setError(''); const parsed = input.trim().startsWith('{') ? JSON.parse(input) : { text: input }; if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(t('Use an object for parameters.')); void runner.run(parsed); } catch (error) { setError(String(error)); } }}><Play size={13} />{t(job.busy ? 'Running…' : 'Run')}</button>
      {(error || job.error) && <p role="alert" className="extension-error">{error || t(job.error || '')}</p>}
      {result && <div className="extension-result" aria-live="polite">
        {result.message && <p>{result.message}</p>}{result.content && <pre>{result.content}</pre>}
        {result.edits && <><h3>{t('Proposed changes')}</h3>{result.edits.map((edit, index) => <div key={index} className="extension-edit"><small>{edit.from}–{edit.to}</small><del>{job.snapshot.source.slice(edit.from, edit.to)}</del><pre>{edit.insert}</pre></div>)}<button className="primary-btn" onClick={() => void runner.apply('edits')}>{t('Apply changes')}</button></>}
        {result.diagnostics && <><h3>{t('Diagnostics')}</h3>{result.diagnostics.map((item, index) => <p key={index}>{t(item.severity)} · {item.message}</p>)}</>}
        {result.completions && <><pre>{result.completions.map(item => item.label).join('\n')}</pre><button className="secondary-btn" onClick={() => void runner.apply('completions')}>{t('Use completions for this document')}</button></>}
        {result.output && <><pre>{result.output.content}</pre><button className="secondary-btn" onClick={() => { const url = URL.createObjectURL(new Blob([result.output!.content], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = result.output!.name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }}><Download size={13} />{t('Save output')}</button></>}
        {result.project && <><pre>{result.project.files.map(file => file.path).join('\n')}</pre><button className="primary-btn" onClick={() => void runner.apply('project')}>{t('Create project')}</button></>}
        {result.action === 'compile' && <button className="primary-btn" onClick={() => void runner.apply('compile')}>{t('Compile document')}</button>}
      </div>}
    </div><footer className="extension-footer"><button className="secondary-btn" onClick={runner.close}>{t('Return to writing')}</button><span>{t('Changes are applied only when you accept them.')}</span></footer>
  </>;
  return job.action.level === 'L3' ? <WorkspaceFrame title={localize(job.panel?.title || job.action.title, language)} className="extension-tool" onClose={runner.close}>{body}</WorkspaceFrame> : <div className="modal-scrim" onMouseDown={runner.close}><section ref={ref} className="extension-tool" role="dialog" aria-modal="true" aria-label={localize(job.action.title, language)} onMouseDown={event => event.stopPropagation()}>{body}</section></div>;
}
