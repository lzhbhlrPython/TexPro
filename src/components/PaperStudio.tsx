import { reviewProject, type InspectionIssue } from '../app/inspection';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Check, Clipboard, FileJson, Gavel, Loader2, Play, Server, Square, X } from 'lucide-react';
import { basename } from '../lib/latex';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  projectRoot: string | null;
  onClose: () => void;
  onJump: (file: string, line: number) => void;
}

type ReviewIssue = InspectionIssue;

export function PaperStudio({ open, projectRoot, onClose, onJump }: Props) {
  const { msg } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocus(open, dialogRef, onClose);
  const generation = useRef(0);
  useEffect(() => { generation.current++; setIssues([]); setReport(''); setNotice(''); setBusy(false); return () => { generation.current++; }; }, [open, projectRoot]);

  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<ReviewIssue[]>([]);
  const [report, setReport] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const runReview = async () => {
    if (!projectRoot || busy) return;
    const request = generation.current;
    setBusy(true);
    setNotice('');
    try {
      const next = await reviewProject(window.texpro, projectRoot);
      if (request !== generation.current) return;
      setIssues(next);
      const lines = ['# Referee report', '', `${msg("app.project")}: ${projectRoot}`, `${msg("app.issues")}: ${next.length}`, ''];
      for (const issue of next) lines.push(`- **[${issue.severity}] ${msg.text(issue.title)}** — ${msg.text(issue.detail)}${issue.file ? ` (${basename(issue.file)}:${issue.line})` : ''}`);
      setReport(lines.join('\n'));
    } catch (error) {
      if (request === generation.current) setNotice(String(error));
    } finally { if (request === generation.current) setBusy(false); }
  };

  const copyReport = async () => {
    await navigator.clipboard?.writeText(report);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const endpoints = ['/v1/project', '/v1/symbols', '/v1/diagnostics', '/v1/assets', '/v1/graph'];
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={msg("app.referee.mode")} className="paper-studio" data-testid="paper-studio" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Gavel size={18} /></div>
            <div><span className="modal-eyebrow">{msg("app.research")}</span><h2>{msg("app.referee.mode")}</h2></div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok">{issues.length} {msg("app.findings")}</span>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button>
          </div>
        </header>
          <div className="referee-body">
            <aside className="referee-summary">
              <div className="pane-label"><Gavel size={12} /> {msg("app.referee.mode")}</div>
              <p className="schematic-hint">{msg("app.a.deterministic.first.pass.over.labels.citations.todos.and")}</p>
              <div className="referee-counts">
                <span className="error"><AlertCircle size={12} /> {issues.filter((item) => item.severity === 'error').length} {msg("app.errors.variant2")}</span>
                <span className="warning"><AlertTriangle size={12} /> {issues.filter((item) => item.severity === 'warning').length} {msg("app.warnings.variant2")}</span>
                <span>{issues.filter((item) => item.severity === 'info').length} {msg("app.notes")}</span>
              </div>
              <button className="primary-btn" onClick={() => void runReview()} disabled={!projectRoot || busy}>{busy ? <Loader2 size={12} className="spin" /> : <Play size={12} />} {busy ? msg("app.reviewing") : msg("app.run.review")}</button>
              {report && <button className="secondary-btn" onClick={() => void copyReport()}>{copied ? <Check size={12} /> : <Clipboard size={12} />} {copied ? msg("app.copied") : msg("app.copy.report")}</button>}
              {notice && <div className="collab-notice">{notice}</div>}
            </aside>
            <main className="referee-main">
              <div className="referee-intro"><span className="theater-kicker">{msg("app.referee.mode")}</span><h3>{msg("app.what.would.a.careful.reviewer.question")}</h3></div>
              <div className="referee-list">
                {issues.map((issue, index) => (
                  <button key={index} className={`referee-issue ${issue.severity}`} onClick={() => issue.file && onJump(issue.file, issue.line || 1)}>
                    {issue.severity === 'error' ? <AlertCircle size={13} /> : issue.severity === 'warning' ? <AlertTriangle size={13} /> : <Gavel size={12} />}
                    <div><strong>{msg.text(issue.title)}</strong><span>{msg.text(issue.detail)}</span><small>{issue.file ? `${basename(issue.file)}${issue.line ? `:${issue.line}` : ''}` : ''}</small></div>
                  </button>
                ))}
                {!issues.length && <div className="referee-empty"><Gavel size={24} /><span>{msg("app.run.review.to.surface.the.questions.a.referee.would")}</span></div>}
              </div>
            </main>
          </div>
        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.referee.mode.reports.deterministic.project.checks.for.the.author")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.done")}</button>
        </footer>
      </section>
    </div>
  );
}
