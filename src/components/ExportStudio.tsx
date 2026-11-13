import { parseWritingAids } from '../../electron/services/writing-aids-core.mjs';
import { useMemo, useState } from 'react';
import { Check, Clipboard, Download, FileCode2, FileText, X } from 'lucide-react';
import { exportLatex, type ExportFormat } from '../lib/exporters';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  source: string;
  name: string;
  onClose: () => void;
  onReviewPlaceholders?: () => void;
}

const formats: Array<{ id: ExportFormat; label: string; ext: string; icon: typeof FileText }> = [
  { id: 'markdown', label: "app.markdown", ext: 'md', icon: FileText },
  { id: 'typst', label: "app.typst", ext: 'typ', icon: FileCode2 },
  { id: 'html', label: "app.html", ext: 'html', icon: FileCode2 },
];

export function ExportStudio({ open, source, name, onClose, onReviewPlaceholders }: Props) {
  const { msg } = useI18n();
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);
  const output = useMemo(() => exportLatex(source, format), [source, format]);
  const pending = useMemo(() => parseWritingAids(source).placeholders.length, [source]);
  const current = formats.find((item) => item.id === format) || formats[0];

  if (!open) return null;

  const copy = async () => {
    await navigator.clipboard?.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const download = () => {
    const blob = new Blob([output], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(name || 'document').replace(/\.(tex|ltx)$/i, '')}.${current.ext}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="export-studio" data-testid="export-studio" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Download size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.export")}</span>
              <h2>{msg("app.export.document")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok"><FileCode2 size={11} /> {msg("app.portable.text")}</span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        {pending > 0 && <div className="writing-aids-export-notice" role="status"><span>{msg("app.resolve.count.placeholders.before.submission", { count: pending })}</span><button className="secondary-btn" onClick={onReviewPlaceholders}>{msg("app.review.placeholders")}</button></div>}
        <div className="export-body">
          <aside className="export-side">
            <div className="pane-label">{msg("app.format")}</div>
            {formats.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} className={`export-format ${format === item.id ? 'active' : ''}`} onClick={() => setFormat(item.id)}>
                  <Icon size={14} />
                  <span>{item.label}</span>
                  <small>.{item.ext}</small>
                </button>
              );
            })}
            <p className="export-hint">{msg("app.the.latex.source.is.converted.directly.unsupported.macros.are")}</p>
          </aside>
          <div className="export-preview-pane">
            <div className="workshop-preview-head"><span>{msg("app.preview")}</span></div>
            <pre className="export-preview">{output}</pre>
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.markdown.typst.and.standalone.html.are.generated.from.the")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={() => void copy()}>{copied ? <Check size={12} /> : <Clipboard size={12} />} {msg("app.copy")}</button>
          <button className="primary-btn" onClick={download}><Download size={13} /> {msg("app.download")}</button>
        </footer>
      </section>
    </div>
  );
}
