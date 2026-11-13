import { AlertCircle, Check, Circle, Loader2 } from 'lucide-react';
import type { CompileResult, CursorInfo, Diagnostic } from '../types';
import { formatDuration } from '../lib/latex';
import { useI18n } from '../i18n';

interface Props {
  compileResult: CompileResult | null;
  compiling: boolean;
  cursor: CursorInfo;
  words: number;
  diagnostics: Diagnostic[];
  page: number;
  visual: boolean;
  focus: boolean;
  onProblems: () => void;
}

export function StatusBar({
  compileResult,
  compiling,
  cursor,
  words,
  diagnostics,
  page,
  visual,
  focus,
  onProblems,
}: Props) {
  const { msg } = useI18n();
  const errors = diagnostics.filter((item) => item.severity === 'error').length;
  const warnings = diagnostics.filter((item) => item.severity === 'warning').length;
  return (
    <footer className="statusbar">
      <div className="status-left">
        {compiling ? (
          <span className="status-item accent">
            <Loader2 size={10} className="spin" /> {msg("app.typesetting")}
          </span>
        ) : compileResult ? (
          <span className={`status-item ${compileResult.ok ? 'ok' : 'failed'}`}>
            {compileResult.ok ? <Check size={10} /> : <AlertCircle size={10} />}
            {compileResult.ok ? `${msg("app.pdf.ready")} · ${formatDuration(compileResult.duration)}` : msg("app.compile.failed")}
          </span>
        ) : (
          <span className="status-item muted"><Circle size={8} /> {msg("app.ready")}</span>
        )}
        {compileResult?.engine && <span className="status-item muted">{compileResult.engine}</span>}
        {compileResult?.ok && <span className="status-item muted">{msg("app.synctex.on")}</span>}
      </div>
      <div className="status-center">
        <span>{msg("app.ln.line.col.col", { line: cursor.line, col: cursor.column })}</span>
        {cursor.selected > 0 && <span>{msg("app.n.selected", { n: cursor.selected })}</span>}
        <span>{msg("app.n.words", { n: words.toLocaleString() })}</span>
      </div>
      <div className="status-right">
        <button className="status-button" onClick={onProblems}>
          {errors > 0 ? <AlertCircle size={10} className="error-text" /> : <Check size={10} className="success-text" />}
          {errors + warnings > 0 ? msg("app.n.problems", { n: errors + warnings }) : msg("app.no.problems")}
        </button>
        <span className="status-item muted">{visual ? msg("app.visual") : msg("app.source")}</span>
        {focus && <span className="status-item accent">{msg("app.focus")}</span>}
        <span className="status-item muted">p.{page}</span>
        <span className="status-item muted">UTF-8</span>
      </div>
    </footer>
  );
}
