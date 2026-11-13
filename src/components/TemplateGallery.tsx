import { useDialogFocus } from '../hooks/useDialogFocus';
import { requestText } from './TextRequest';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutTemplate,
  Plus,
  Presentation,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { OpenDoc, TemplateItem } from '../types';
import { builtinTemplates, fillTemplate, type TemplateMeta } from '../lib/templates';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  userTemplates: TemplateItem[];
  activeDoc: OpenDoc | null;
  activeEngine: TemplateItem['engine'];
  onClose: () => void;
  onCreate: (template: TemplateItem, meta: TemplateMeta) => Promise<boolean>;
  onSaveCurrent: (name: string, description: string, content: string, engine: TemplateItem['engine']) => Promise<void>;
  onDuplicate: (name: string, description: string, content: string, engine: TemplateItem['engine']) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

function categoryIcon(category: string) {
  if (category === 'app.teaching') return <GraduationCap size={14} />;
  if (category === 'app.academic') return <BookOpen size={14} />;
  if (category === 'app.basics') return <FileText size={14} />;
  return <LayoutTemplate size={14} />;
}

export function TemplateGallery({
  open,
  userTemplates,
  activeDoc,
  activeEngine,
  onClose,
  onCreate,
  onSaveCurrent,
  onDuplicate,
  onDeleteTemplate,
}: Props) {
  const { msg } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocus(open, dialogRef, onClose);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('article');
  const [projectName, setProjectName] = useState('my-paper');
  const [title, setTitle] = useState('A Visual LaTeX Document');
  const [author, setAuthor] = useState('Your Name');
  const [busy, setBusy] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [thumbnailError, setThumbnailError] = useState('');

  const templates = useMemo(() => [...builtinTemplates, ...userTemplates], [userTemplates]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return templates;
    return templates.filter((item) =>
      [item.name, item.description, item.category, msg.text(item.nameKey || item.name), msg.text(item.description)]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [search, templates, msg]);

  const selected = templates.find((item) => item.id === selectedId) || filtered[0] || templates[0];

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSaveOpen(false);
    setSaveName('');
    setSaveDescription('');
    if (!templates.some((item) => item.id === selectedId)) setSelectedId(templates[0]?.id || 'article');
    if (!projectName || projectName === 'my-paper') {
      setProjectName(msg("app.my.project") === 'my-project' ? 'my-project' : '我的项目');
    }
  }, [open]);

  useEffect(() => {
    if (!open || !selected) return;
    if (!projectName || projectName === 'my-paper' || projectName === '我的项目' || projectName === 'my-project') {
      setProjectName(selected.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-project');
    }
  }, [selectedId, open]);

  useEffect(() => {
    if (!open || !selected) return;
    let cancelled = false;
    setThumbnail('');
    setThumbnailError('');
    setThumbnailBusy(true);
    void window.texpro.renderTemplatePreview({
      source: fillTemplate(selected.content, { projectName: 'preview', title: 'Template preview', author: 'TeXPro' }),
      engine: selected.engine,
    }).then((result) => {
      if (cancelled) return;
      if (result.ok && result.dataUrl) setThumbnail(result.dataUrl);
      else setThumbnailError(result.error || 'Preview unavailable');
    }).catch((failure) => {
      if (!cancelled) setThumbnailError(String(failure));
    }).finally(() => {
      if (!cancelled) setThumbnailBusy(false);
    });
    return () => { cancelled = true; };
  }, [open, selected?.id, selected?.content, selected?.engine]);

  if (!open) return null;

  const create = async () => {
    if (!selected || busy) return;
    setBusy(true);
    try {
      const ok = await onCreate(selected, { projectName, title, author });
      if (ok) onClose();
    } finally {
      setBusy(false);
    }
  };

  const saveCurrent = async () => {
    if (!activeDoc || !saveName.trim() || busy) return;
    setBusy(true);
    try {
      await onSaveCurrent(saveName.trim(), saveDescription.trim(), activeDoc.content, activeEngine);
      setSaveOpen(false);
      setSaveName('');
      setSaveDescription('');
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    if (!selected) return;
    const name = await requestText(msg("app.variant.name"), `${selected.name} variant`);
    if (!name?.trim()) return;
    await onDuplicate(name.trim(), `${msg("app.based.on")} ${selected.name}`, selected.content, selected.engine);
  };

  const remove = async (item: TemplateItem) => {
    if (item.builtin) return;
    if (!window.confirm(msg("app.delete.this.template"))) return;
    await onDeleteTemplate(item.id);
    if (selectedId === item.id) setSelectedId(templates[0]?.id || 'article');
  };

  const preview = selected ? fillTemplate(selected.content, { projectName, title, author }) : '';

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="template-modal-title" tabIndex={-1} className="template-modal" data-testid="template-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="template-header">
          <div className="template-heading">
            <div className="template-icon"><LayoutTemplate size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.template.library")}</span>
              <h2 id="template-modal-title">{msg("app.create.a.new.project")}</h2>
            </div>
          </div>
          <div className="template-header-actions">
            <button
              className="secondary-btn"
              disabled={!activeDoc}
              onClick={() => setSaveOpen((value) => !value)}
              title={!activeDoc ? msg("app.open.a.document.first") : msg("app.save.current.document.as.template")}
            >
              <Save size={13} />
              {msg("app.save.as.template")}
            </button>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")} title={msg("app.close")}>
              <X size={16} />
            </button>
          </div>
        </header>

        {saveOpen && (
          <div className="template-savebar">
            <input
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              placeholder={msg("app.template.name")}
              autoFocus
            />
            <input
              value={saveDescription}
              onChange={(event) => setSaveDescription(event.target.value)}
              placeholder={msg("app.template.description")}
            />
            <button className="primary-btn" onClick={() => void saveCurrent()} disabled={!saveName.trim() || busy}>
              <Save size={13} />
              {msg("app.save")}
            </button>
          </div>
        )}

        <div className="template-body">
          <aside className="template-sidebar">
            <div className="template-search">
              <Search size={13} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={msg("app.search.templates")}
              />
            </div>
            <div className="template-list">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  className={`template-card ${selected?.id === item.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="template-card-icon">{categoryIcon(item.category)}</span>
                  <span className="template-card-copy">
                    <strong>{msg.text(item.nameKey || item.name)}</strong>
                    <small>{msg.text(item.description)}</small>
                    <em>{msg.text(item.category)} · {item.engine}</em>
                  </span>
                  {item.builtin ? (
                    <span className="template-badge">{msg("app.built.in")}</span>
                  ) : (
                    <span className="template-badge user">{msg("app.user")}</span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && <div className="template-empty">{msg("app.no.templates.match")}</div>}
            </div>
          </aside>

          <div className="template-detail">
            <div className="template-preview">
              <div className="template-preview-bar">
                <span>{selected ? msg.text(selected.nameKey || selected.name) : msg('app.template')}</span>
                <span>{selected?.engine}</span>
              </div>
              <div className="template-thumb">
                {thumbnail ? (
                  <>
                    <img src={thumbnail} alt={selected ? msg.text(selected.nameKey || selected.name) : ''} />
                    <div className="template-thumb-copy">
                      <strong>{msg("app.compiled.first.page")}</strong>
                      <span>{selected ? msg.text(selected.nameKey || selected.name) : ''} · {selected?.engine}</span>
                    </div>
                  </>
                ) : (
                  <div className="template-thumb-placeholder">
                    {thumbnailBusy ? msg("app.compiling.preview") : thumbnailError ? msg("app.preview.unavailable") : ''}
                  </div>
                )}
              </div>
              <pre>
                {preview
                  .split('\n')
                  .slice(0, 24)
                  .map((line, index) => `${String(index + 1).padStart(2, ' ')}  ${line}`)
                  .join('\n')}
              </pre>
            </div>

            <div className="template-form">
              <div className="template-form-row">
                <label>
                  <span>{msg("app.project.name")}</span>
                  <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
                </label>
                <label>
                  <span>{msg("app.document.title")}</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} />
                </label>
              </div>
              <div className="template-form-row">
                <label>
                  <span>{msg("app.author")}</span>
                  <input value={author} onChange={(event) => setAuthor(event.target.value)} />
                </label>
                <label className="template-engine">
                  <span>{msg("app.latex.engine")}</span>
                  <div className="static-value">{selected?.engine}</div>
                </label>
              </div>
              <p className="template-hint">{msg("app.new.project.will.be.created.in.the.folder.you")}</p>
              <div className="template-actions">
                {selected && !selected.builtin && (
                  <button className="danger-btn" onClick={() => void remove(selected)}>
                    <Trash2 size={13} />
                    {msg("app.delete")}
                  </button>
                )}
                <div className="spacer" />
                <button className="secondary-btn" onClick={() => void duplicate()}>{msg("app.duplicate.as.variant")}</button>
                <button className="secondary-btn" onClick={onClose}>{msg("app.cancel")}</button>
                <button className="primary-btn" onClick={() => void create()} disabled={busy || !projectName.trim()}>
                  {busy ? <span className="inline-spinner" /> : <Plus size={14} />}
                  {msg("app.create.project")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
