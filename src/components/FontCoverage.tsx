import { useDialogFocus } from '../hooks/useDialogFocus';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, FileText, RefreshCw, HelpCircle, Type, X, XCircle } from 'lucide-react';
import { basename } from '../lib/latex';
import { useI18n } from '../i18n';

interface Report {
  scripts: Record<string, number>;
  declared: string[];
  fontChecks: Array<{ name: string; resolved: string; ok: boolean | null }>;
  pdfFonts: Array<{ name: string; type: string; embedded: boolean; unicode: boolean }>;
  issues: Array<{ severity: string; message: string; file: string; line: number }>;
  pdfPath: string | null;
  pdfInspection: string;
}

const SCRIPT_LABELS: Record<string, string> = {
  latin: "app.latin", cjk: "app.cjk", greek: "app.greek", cyrillic: "app.cyrillic", arabic: "app.arabic", hebrew: "app.hebrew",
};

export function FontCoverage({ open, projectRoot, onClose, onOpen }: {
  open: boolean;
  projectRoot: string | null;
  onClose: () => void;
  onOpen: (path: string) => void;
}) {
  const { msg } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocus(open, dialogRef, onClose);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scanRequest = useRef(0);

  const scan = async () => {
    if (!projectRoot) return;
    const request = ++scanRequest.current;
    setLoading(true); setReport(null);
    setError('');
    try {
      const next = await window.texpro.fontCoverage(projectRoot);
      if (request === scanRequest.current) setReport(next);
    } catch (failure) {
      if (request === scanRequest.current) setError(String(failure));
    } finally {
      if (request === scanRequest.current) setLoading(false);
    }
  };

  useEffect(() => { if (open) void scan(); return () => { scanRequest.current++; }; }, [open, projectRoot]);

  if (!open) return null;

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="font-studio-title" tabIndex={-1} className="font-studio" data-testid="font-coverage" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Type size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.project.health")}</span>
              <h2 id="font-studio-title">{msg("app.font.coverage")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <button className="secondary-btn" onClick={() => void scan()} disabled={loading}><RefreshCw size={12} className={loading ? 'spin' : ''} /> {msg("app.re.scan")}</button>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        {error && <p className="font-issue error" role="alert">{error}</p>}
        {loading && <p className="panel-empty" role="status">{msg("app.checking.fonts")}</p>}
        <div className="font-body">
          <div className="font-column">
            <div className="pane-label"><Type size={12} /> {msg("app.detected.scripts")}</div>
            <div className="font-scripts">
              {Object.entries(report?.scripts || {}).map(([name, count]) => (
                <div className={`font-script ${count > 0 ? 'present' : ''}`} key={name}>
                  <strong>{count}</strong>
                  <span>{msg.text(SCRIPT_LABELS[name] || name)}</span>
                  {count > 0 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                </div>
              ))}
            </div>
            <div className="pane-label">{msg("app.declared.fonts")}</div>
            <div className="font-list">
              {report?.fontChecks.map((font) => (
                <div className="font-row" data-status={font.ok === null ? 'unknown' : font.ok ? 'ok' : 'warning'} key={font.name}>
                  {font.ok === null ? <HelpCircle size={12} aria-label={msg("app.unable.to.verify")} /> : font.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <strong>{font.name}</strong>
                  <span>{font.resolved || msg("app.unable.to.verify")}</span>
                </div>
              ))}
              {report && !report.fontChecks.length && <div className="panel-empty">{msg("app.no.explicit.font.commands.found")}</div>}
            </div>
          </div>

          <div className="font-column">
            <div className="pane-label"><FileText size={12} /> {msg("app.pdf.fonts")}<span className="pane-hint">{report?.pdfFonts.length || 0}</span></div>
            <div className="font-list">
              {report?.pdfFonts.map((font) => (
                <div className="font-row" data-status={font.embedded ? 'ok' : 'warning'} key={font.name + font.type}>
                  {font.embedded ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <strong>{font.name}</strong>
                  <span>{font.type} · {font.embedded ? msg("app.embedded") : msg("app.not.embedded")}{font.unicode ? ' · Unicode' : ''}</span>
                </div>
              ))}
              {report && !report.pdfFonts.length && <div className="panel-empty">{msg(report.pdfInspection === 'unavailable' ? "app.pdf.font.inspection.is.unavailable.install.poppler.pdffonts.and" : report.pdfInspection === 'complete' ? "app.no.fonts.listed.in.this.pdf" : "app.compile.once.to.inspect.embedded.pdf.fonts")}</div>}
            </div>
            <div className="pane-label">{msg("app.issues")}</div>
            <div className="font-issues">
              {report?.issues.map((issue, index) => (
                <div className={`font-issue ${issue.severity}`} key={index}>
                  <strong>{issue.message}</strong>
                  {issue.file && <small>{basename(issue.file)}:{issue.line}</small>}
                </div>
              ))}
              {report && !report.issues.length && <div className={report.fontChecks.some(font => font.ok === null) || report.pdfInspection !== 'complete' ? 'panel-empty' : 'doctor-clean'}>{report.fontChecks.some(font => font.ok === null) || report.pdfInspection !== 'complete' ? <HelpCircle size={22} /> : <CheckCircle2 size={22} />}<strong>{msg(report.fontChecks.some(font => font.ok === null) || report.pdfInspection !== 'complete' ? "app.font.check.is.incomplete" : "app.no.font.issues.found")}</strong></div>}
            </div>
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.font.checks.combine.source.scripts.declared.font.commands.and")}</span>
          <div className="spacer" />
          {report?.pdfPath && <button className="secondary-btn" onClick={() => onOpen(report.pdfPath!)}>{msg("app.open.pdf")}</button>}
          <button className="primary-btn" onClick={onClose}>{msg("app.done")}</button>
        </footer>
      </section>
    </div>
  );
}
