import { useState } from 'react';
import { CheckCircle2, FolderOpen, Package, RefreshCw, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  projectRoot: string | null;
  onClose: () => void;
  onOpen: (path: string) => void;
  onReveal: (path: string) => void;
}

export function ArxivPanel({ open, projectRoot, onClose, onOpen, onReveal }: Props) {
  const { msg } = useI18n();
  const [result, setResult] = useState<{ zipPath: string; files: number; engine: string; size: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const create = async () => {
    if (!projectRoot || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await window.texpro.createArxivPackage(projectRoot);
      setResult(next);
    } catch (failure) {
      setError(String(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="arxiv-studio" data-testid="arxiv-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Package size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.submission")}</span>
              <h2>{msg("app.arxiv.package")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok"><Package size={11} /> .zip</span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="arxiv-body">
          <div className="arxiv-icon"><Package size={42} /></div>
          <h3>{msg("app.create.an.arxiv.ready.source.archive")}</h3>
          <p>{msg("app.the.package.preserves.the.project.main.file.and.source")}</p>
          <ul className="arxiv-list">
            <li>{msg("app.excludes.texpro.build.products.logs.aux.and.synctex.files")}</li>
            <li>{msg("app.keeps.assets.bib.files.and.included.tex.files")}</li>
            <li>{msg("app.adds.a.readme.with.root.file.and.detected.engine")}</li>
          </ul>
          {error && <div className="ai-error">{error}</div>}
          {result && (
            <div className="arxiv-result">
              <CheckCircle2 size={18} />
              <div>
                <strong>{msg("app.package.created")}</strong>
                <span>{result.files} {msg("app.files")} · {result.engine} · {(result.size / 1024).toFixed(1)} KB</span>
                <code>{result.zipPath}</code>
              </div>
            </div>
          )}
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.review.the.generated.zip.before.uploading.it.to.arxiv")}</span>
          <div className="spacer" />
          {result && <button className="secondary-btn" onClick={() => onReveal(result.zipPath)}><FolderOpen size={12} /> {msg("app.reveal")}</button>}
          {result && <button className="secondary-btn" onClick={() => onOpen(result.zipPath)}>{msg("app.open.zip")}</button>}
          <button className="secondary-btn" onClick={onClose}>{msg("app.cancel")}</button>
          <button className="primary-btn" onClick={() => void create()} disabled={!projectRoot || busy}>
            <RefreshCw size={12} className={busy ? 'spin' : ''} /> {result ? msg("app.rebuild.package") : msg("app.create.package")}
          </button>
        </footer>
      </section>
    </div>
  );
}
