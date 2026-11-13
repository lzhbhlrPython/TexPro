import { useEffect, useRef, useState } from 'react';
import { Copy, Play, Server, Square, X } from 'lucide-react';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { useI18n } from '../i18n';
export function PaperApiPanel({ open, projectRoot, onClose }: { open: boolean; projectRoot: string | null; onClose: () => void }) {
  const { msg } = useI18n(), ref = useRef<HTMLElement>(null), generation = useRef(0);
  useDialogFocus(open, ref, onClose);
  const [status, setStatus] = useState<{ running: boolean; baseUrl?: string; token?: string; root?: string } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { const id = ++generation.current; setStatus(null); setError(''); setBusy(false); if (open) void window.texpro.paperApiStatus().then(value => { if (id === generation.current) setStatus(value); }).catch(error => { if (id === generation.current) setError(String(error)); }); return () => { generation.current++; }; }, [open, projectRoot]);
  async function change(start: boolean) {
    if (!projectRoot || busy) return;
    const id = generation.current; setBusy(true); setError('');
    try { if (start) await window.texpro.startPaperApi(projectRoot); else await window.texpro.stopPaperApi(); const next = await window.texpro.paperApiStatus(); if (id === generation.current) setStatus(next); }
    catch (error) { if (id === generation.current) setError(String(error)); }
    finally { if (id === generation.current) setBusy(false); }
  }
  if (!open) return null;
  return <div className="modal-scrim" onMouseDown={onClose}><section ref={ref} className="paper-studio" role="dialog" aria-modal="true" aria-label={msg("app.paper.api")} onMouseDown={event => event.stopPropagation()}>
    <header className="studio-header"><div className="studio-heading"><Server size={18} /><div><span className="modal-eyebrow">{msg("app.integrations")}</span><h2>{msg("app.paper.api")}</h2></div></div><button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button></header>
    <div className="extension-tool-body"><p>{msg("app.expose.this.project.to.tools.through.an.explicitly.started")}</p>
      {status?.running ? <><p className="extension-id">{status.baseUrl}</p><p className="extension-id">{status.root}</p><label className="extension-setting"><span>{msg("app.bearer.token")}</span><input type="password" readOnly value={status.token || ''} /><button className="icon-btn" aria-label={msg("app.copy.token")} onClick={() => { void navigator.clipboard.writeText(status.token || '').catch(error => setError(String(error))); }}><Copy size={14} /></button></label><button className="secondary-btn" disabled={busy} onClick={() => void change(false)}><Square size={13} />{msg("app.stop.api")}</button></> : <button className="primary-btn" disabled={!projectRoot || busy} onClick={() => void change(true)}><Play size={13} />{msg("app.start.local.api")}</button>}
      {error && <p role="alert" className="extension-error">{error}</p>}
      <h3>{msg("app.endpoints")}</h3>{['project', 'symbols', 'diagnostics', 'assets', 'graph'].map(endpoint => <p className="extension-id" key={endpoint}>/v1/{endpoint}</p>)}
    </div>
  </section></div>;
}
