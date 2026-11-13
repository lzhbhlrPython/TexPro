import { WorkspaceFrame } from './WorkspaceFrame';
import { useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  LayoutTemplate,
  Paintbrush,
  Save,
  X,
} from 'lucide-react';
import {
  defaultTemplateDesign,
  designTemplate,
  type TemplateDesign,
} from '../lib/templateDesigner';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string, content: string, engine: TemplateDesign['engine']) => Promise<void>;
  onApply?: (content: string) => void;
}

export function TemplateWorkshop({ open, onClose, onSave, onApply }: Props) {
  const { msg } = useI18n();
  const [design, setDesign] = useState<TemplateDesign>(defaultTemplateDesign);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const source = useMemo(() => designTemplate(design), [design]);

  if (!open) return null;

  const update = <K extends keyof TemplateDesign>(key: K, value: TemplateDesign[K]) => {
    setDesign((current) => ({ ...current, [key]: value }));
  };

  const setPackage = (key: keyof TemplateDesign['packages'], value: boolean) => {
    setDesign((current) => ({ ...current, packages: { ...current.packages, [key]: value } }));
  };

  const save = async () => {
    if (!design.name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(design.name.trim(), design.description.trim(), source, design.engine);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceFrame title={msg("app.template.workshop")} className="workshop-studio" onClose={onClose} testId="template-workshop">
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Paintbrush size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.template.workshop")}</span>
              <h2>{msg("app.design.a.template")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok"><LayoutTemplate size={11} /> LaTeX</span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="workshop-body">
          <aside className="workshop-controls">
            <div className="workshop-section">
              <div className="workshop-section-title">{msg("app.identity")}</div>
              <label className="workshop-field"><span>{msg("app.template.name")}</span><input value={design.name} onChange={(event) => update('name', event.target.value)} /></label>
              <label className="workshop-field"><span>{msg("app.description.variant2")}</span><input value={design.description} onChange={(event) => update('description', event.target.value)} /></label>
            </div>

            <div className="workshop-section">
              <div className="workshop-section-title">{msg("app.base.variant2")}</div>
              <div className="workshop-grid">
                <label className="workshop-field"><span>{msg("app.document.class")}</span>
                  <select value={design.base} onChange={(event) => {
                    const base = event.target.value as TemplateDesign['base'];
                    setDesign((current) => ({
                      ...current,
                      base,
                      engine: base === 'ctexart' ? 'xelatex' : current.engine,
                    }));
                  }}>
                    <option value="article">article</option>
                    <option value="report">report</option>
                    <option value="ctexart">ctexart</option>
                    <option value="beamer">beamer</option>
                  </select>
                </label>
                <label className="workshop-field"><span>{msg("app.engine")}</span>
                  <select value={design.engine} onChange={(event) => update('engine', event.target.value as TemplateDesign['engine'])}>
                    <option value="pdflatex">pdfLaTeX</option>
                    <option value="xelatex">XeLaTeX</option>
                    <option value="lualatex">LuaLaTeX</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="workshop-section">
              <div className="workshop-section-title">{msg("app.page")}</div>
              <div className="workshop-grid">
                <label className="workshop-field"><span>{msg("app.paper")}</span>
                  <select value={design.pageSize} onChange={(event) => update('pageSize', event.target.value as TemplateDesign['pageSize'])}>
                    <option value="a4paper">A4</option>
                    <option value="letterpaper">Letter</option>
                    <option value="a5paper">A5</option>
                  </select>
                </label>
                <label className="workshop-field"><span>{msg("app.margins")}</span><input value={design.margin} onChange={(event) => update('margin', event.target.value)} /></label>
                <label className="workshop-field"><span>{msg("app.font.size")}</span>
                  <select value={design.fontSize} onChange={(event) => update('fontSize', Number(event.target.value) as TemplateDesign['fontSize'])}>
                    <option value={10}>10 pt</option><option value={11}>11 pt</option><option value={12}>12 pt</option>
                  </select>
                </label>
                <label className="workshop-field"><span>{msg("app.line.spacing")}</span>
                  <select value={design.lineSpacing} onChange={(event) => update('lineSpacing', event.target.value as TemplateDesign['lineSpacing'])}>
                    <option value="1.0">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2.0">2.0</option>
                  </select>
                </label>
                <label className="workshop-field"><span>{msg("app.columns")}</span>
                  <select value={design.columns} onChange={(event) => update('columns', Number(event.target.value) as TemplateDesign['columns'])}>
                    <option value={1}>{msg("app.single.column")}</option><option value={2}>{msg("app.two.columns")}</option>
                  </select>
                </label>
                <label className="workshop-field"><span>{msg("app.title.align")}</span>
                  <select value={design.titleStyle} onChange={(event) => update('titleStyle', event.target.value as TemplateDesign['titleStyle'])}>
                    <option value="center">{msg("app.centered")}</option><option value="left">{msg("app.left.variant2")}</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="workshop-section">
              <div className="workshop-section-title">{msg("app.typography")}</div>
              <div className="workshop-grid">
                <label className="workshop-field"><span>{msg("app.accent.color")}</span>
                  <div className="color-field"><input type="color" value={design.accent} onChange={(event) => update('accent', event.target.value)} /><input value={design.accent} onChange={(event) => update('accent', event.target.value)} /></div>
                </label>
                <label className="workshop-field"><span>{msg("app.heading.font")}</span>
                  <select value={design.headingFont} onChange={(event) => update('headingFont', event.target.value as TemplateDesign['headingFont'])}>
                    <option value="sans">{msg("app.sans")}</option><option value="serif">{msg("app.serif")}</option>
                  </select>
                </label>
              </div>
              <label className="workshop-field"><span>{msg("app.header.text")}</span><input value={design.header} onChange={(event) => update('header', event.target.value)} placeholder={msg("app.optional.running.header")} /></label>
            </div>

            <div className="workshop-section">
              <div className="workshop-section-title">{msg("app.structure")}</div>
              <div className="workshop-checks">
                <label className="chart-check"><input type="checkbox" checked={design.toc} onChange={(event) => update('toc', event.target.checked)} /> {msg("app.table.of.contents")}</label>
                <label className="chart-check"><input type="checkbox" checked={design.abstract} onChange={(event) => update('abstract', event.target.checked)} /> {msg("app.abstract.variant2")}</label>
                <label className="chart-check"><input type="checkbox" checked={design.pageNumbers} onChange={(event) => update('pageNumbers', event.target.checked)} /> {msg("app.page.numbers")}</label>
              </div>
            </div>

            <div className="workshop-section">
              <div className="workshop-section-title">{msg("app.packages")}</div>
              <div className="workshop-checks">
                {([
                  ['amsmath', 'amsmath'],
                  ['graphicx', 'graphicx'],
                  ['booktabs', 'booktabs'],
                  ['tikz', 'tikz'],
                  ['pgfplots', 'pgfplots'],
                  ['hyperref', 'hyperref'],
                ] as const).map(([key, label]) => (
                  <label className="chart-check" key={key}>
                    <input type="checkbox" checked={design.packages[key]} onChange={(event) => setPackage(key, event.target.checked)} /> {label}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div className="workshop-preview">
            <div className="workshop-preview-head">
              <span>{msg("app.template.source")}</span>
              <div className="spacer" />
              <button className="mini-btn" onClick={async () => { await navigator.clipboard?.writeText(source); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }} title={msg("app.copy")}>
                {copied ? <Check size={12} /> : <Clipboard size={12} />}
              </button>
            </div>
            <pre className="workshop-code">{source}</pre>
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.templates.are.saved.to.the.user.template.library.and")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.cancel")}</button>
          {onApply && <button className="secondary-btn" onClick={() => { onApply(source); onClose(); }}>{msg("app.apply.to.document")}</button>}
          <button className="primary-btn" onClick={() => void save()} disabled={saving || !design.name.trim()}>
            <Save size={13} /> {msg("app.save.template")}
          </button>
        </footer>
    </WorkspaceFrame>
  );
}
