import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  X,
  BookMarked,
  BookOpen,
  Copy,
  Eye,
  FileImage as FileImageIcon,
  ImagePlus,
  Trash2,
  Upload,
  Braces,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  File,
  FileCode2,
  FileImage,
  FilePlus2,
  FileText,
  Files,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderInput,
  Hash,
  ListTree,
  Loader2,
  Pencil,
  Plus,
  Search,
  Shapes,
  SquareDashed,
  Sigma,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import type { AssetItem, FileNode, OutlineItem, Project, ProjectSymbols, SearchResult } from '../types';
import { WritingNotes } from './WritingNotes';
import { WritingPlaceholders } from './WritingPlaceholders';
import type { PlaceholderKind, WritingPlaceholder } from '../../electron/services/writing-aids-core.mjs';
import type { WritingNote } from '../lib/writingNotes';
import { snippetLibrary } from '../editor/completions';
import { allSymbols, renderSymbolHtml, symbolModules, type SymbolItem } from '../lib/symbols';
import { assetUrl, basename, dirname, extname, relativePath } from '../lib/latex';
import { useI18n } from '../i18n';

type SidebarTab = 'files' | 'outline' | 'assets' | 'symbols' | 'search' | 'notes' | 'placeholders';

interface Props {
  project: Project | null;
  activePath: string | null;
  compiling: boolean;
  onSelectRoot: (path: string) => void;
  tab: SidebarTab;
  outline: OutlineItem[];
  cursorLine: number;
  symbols: ProjectSymbols;
  assets: AssetItem[];
  writingNotes: WritingNote[];
  placeholders: WritingPlaceholder[];
  onOpenPlaceholder: (item: WritingPlaceholder) => void;
  onInsertPlaceholder: (kind: PlaceholderKind) => void;
  onOpenNote: (note: WritingNote) => void;
  onToggleNote: (note: WritingNote) => void;
  onInsertNote: () => void;
  onTabChange: (tab: SidebarTab) => void;
  onOpenFile: (path: string) => void;
  onRenameFile: (path: string) => void;
  onMoveDirectory: (path: string) => void;
  onCreateFolder: (parent: string, name: string) => Promise<void>;
  onCreateFile: (parent: string, name: string) => Promise<void>;
  onMoveFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFolder: (path: string) => void;
  onDeleteFolder: (path: string) => void;
  onOutlineClick: (item: OutlineItem) => void;
  onInsert: (text: string) => void;
  onInsertAsset: (asset: AssetItem) => void;
  onPreviewAsset: (asset: AssetItem) => void;
  onImportAssets: () => Promise<void>;
  onDeleteAsset: (asset: AssetItem) => Promise<void>;
  onOpenFolder: () => void;
  onSearchResult: (result: SearchResult) => void;
}

function formatBytes(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(node: FileNode) {
  const ext = node.ext || extname(node.name);
  if (ext === '.tex' || ext === '.ltx') return <FileText size={13} className="file-icon tex" />;
  if (ext === '.bib') return <BookMarked size={13} className="file-icon bib" />;
  if (['.png', '.jpg', '.jpeg', '.pdf', '.svg', '.eps'].includes(ext)) return <FileImage size={13} className="file-icon img" />;
  if (['.sty', '.cls', '.def', '.clo'].includes(ext)) return <FileCode2 size={13} className="file-icon sty" />;
  return <File size={13} className="file-icon" />;
}

function containsPath(node: FileNode, path: string): boolean {
  if (node.path === path) return true;
  if (!node.children) return false;
  return node.children.some((child) => containsPath(child, path));
}

interface TreeDraft { parent: string; kind: 'file' | 'folder'; name: string; busy: boolean; error: string }
interface TreeCreationProps { draft: TreeDraft | null; onName: (name: string) => void; onSubmit: () => void; onCancel: () => void }
function TreeCreation({ draft, onName, onSubmit, onCancel, depth = 0 }: TreeCreationProps & { depth?: number }) {
  const { msg } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!draft?.busy) input.current?.focus(); }, [draft?.parent, draft?.kind, draft?.busy]);
  if (!draft) return null;
  return <form className="tree-create" data-testid="tree-create" style={{ paddingLeft: 9 + depth * 13 }} onSubmit={event => { event.preventDefault(); onSubmit(); }} onKeyDown={event => {
    if (event.nativeEvent.isComposing || draft.busy) return;
    if (event.key === 'Enter' && event.target === input.current) { event.preventDefault(); event.stopPropagation(); onSubmit(); }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onCancel(); }
  }}>
    <div className="tree-create-row">{draft.kind === 'file' ? <FilePlus2 size={13} /> : <FolderPlus size={13} />}
      <input ref={input} aria-label={msg(draft.kind === 'file' ? "app.new.file.name" : "app.new.folder.name")} aria-invalid={Boolean(draft.error)} aria-describedby={draft.error ? 'tree-create-error' : undefined} placeholder={draft.kind === 'file' ? 'section.tex' : 'sections'} value={draft.name} disabled={draft.busy} onChange={event => onName(event.target.value)} />
      <button type="submit" className="mini-btn" disabled={draft.busy || !draft.name.trim()} title={msg("app.create")} aria-label={msg("app.create")}>{draft.busy ? <Loader2 size={13} className="spin" /> : <Check size={13} />}</button>
      <button type="button" className="mini-btn" disabled={draft.busy} onClick={onCancel} title={msg("app.cancel")} aria-label={msg("app.cancel")}><X size={13} /></button>
    </div>
    {draft.error && <div id="tree-create-error" className="tree-create-error" role="alert">{draft.error}</div>}
  </form>;
}

function TreeItem({
  node,
  depth,
  activePath,
  onOpenFile,
  onNodeContextMenu,
  creation,
}: {
  node: FileNode;
  depth: number;
  activePath: string | null;
  onOpenFile: (path: string) => void;
  onNodeContextMenu: (node: FileNode, event: React.MouseEvent) => void;
  creation: TreeCreationProps;
}) {
  const { msg } = useI18n();
  const [open, setOpen] = useState(() => Boolean(activePath && containsPath(node, activePath)));
  useEffect(() => {
    if (node.type === 'dir' && activePath && containsPath(node, activePath)) setOpen(true);
  }, [activePath, node]);
  useEffect(() => { if (creation.draft?.parent === node.path) setOpen(true); }, [creation.draft?.parent, node.path]);
  if (node.type === 'dir') {
    return (
      <div className="tree-dir">
        <button
          className="tree-row"
          style={{ paddingLeft: 9 + depth * 13 }}
          onClick={() => setOpen((value) => !value)}
          onContextMenu={(event) => { event.preventDefault(); onNodeContextMenu(node, event); }}
          title={msg("app.right.click.for.file.actions")}
        >
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          {open ? <FolderOpen size={13} className="folder-icon" /> : <Folder size={13} className="folder-icon" />}
          <span>{node.name}</span>
          <span className="tree-count">{node.children?.length || 0}</span>
        </button>
        {open && creation.draft?.parent === node.path && <TreeCreation {...creation} depth={depth + 1} />}
        {open && node.children?.map((child) => (
          <TreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            activePath={activePath}
            onOpenFile={onOpenFile}
            onNodeContextMenu={onNodeContextMenu}
            creation={creation}
          />
        ))}
      </div>
    );
  }
  const active = node.path === activePath;
  return (
    <button
      className={`tree-row tree-file ${active ? 'active' : ''}`}
      style={{ paddingLeft: 21 + depth * 13 }}
      onClick={() => onOpenFile(node.path)}
      onContextMenu={(event) => { event.preventDefault(); onNodeContextMenu(node, event); }}
      title={`${node.relative} · ${msg("app.right.click.for.file.actions")}`}
    >
      {fileIcon(node)}
      <span>{node.name}</span>
    </button>
  );
}

function outlineIcon(item: OutlineItem) {
  if (item.kind === 'label') return <Tag size={12} className="outline-icon label" />;
  if (item.kind === 'equation') return <Sigma size={12} className="outline-icon equation" />;
  if (item.kind === 'todo') return <CheckSquare size={12} className="outline-icon todo" />;
  return <Hash size={12} className="outline-icon" />;
}

export function Sidebar({
  project,
  compiling,
  onSelectRoot,
  activePath,
  tab,
  outline,
  cursorLine,
  symbols,
  assets,
  writingNotes,
  onOpenNote,
  onToggleNote,
  placeholders,
  onOpenPlaceholder,
  onInsertPlaceholder,
  onInsertNote,
  onTabChange,
  onOpenFile,
  onRenameFile,
  onMoveDirectory,
  onCreateFolder,
  onCreateFile,
  onMoveFile,
  onDeleteFile,
  onRenameFolder,
  onDeleteFolder,
  onOutlineClick,
  onInsert,
  onInsertAsset,
  onPreviewAsset,
  onImportAssets,
  onDeleteAsset,
  onOpenFolder,
  onSearchResult,
}: Props) {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [symbolFilter, setSymbolFilter] = useState('');
  const [symbolConfigOpen, setSymbolConfigOpen] = useState(false);
  const [treeMenu, setTreeMenu] = useState<{ node: FileNode; x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<TreeDraft | null>(null);
  const draftRef = useRef(draft); draftRef.current = draft;
  useEffect(() => { setDraft(null); setTreeMenu(null); }, [project?.root]);
  const beginCreate = (parent: string, kind: 'file' | 'folder') => {
    if (!project || draftRef.current?.busy) return;
    setTreeMenu(null); setDraft({ parent, kind, name: '', busy: false, error: '' });
  };
  const submitCreate = async () => {
    const current = draftRef.current; if (!current || current.busy || !current.name.trim()) return;
    const pending = { ...current, busy: true, error: '' }; draftRef.current = pending; setDraft(pending);
    try {
      await (current.kind === 'file' ? onCreateFile : onCreateFolder)(current.parent, current.name.trim());
      if (draftRef.current === pending) setDraft(null);
    } catch (failure) {
      if (draftRef.current !== pending) return;
      const message = String(failure);
      const reason = message.includes('already exists') ? msg("app.a.file.or.folder.with.this.name.already.exists") : message.includes('Invalid') ? msg("app.use.a.file.name.without.path.separators.or.reserved") : msg(current.kind === 'file' ? "app.could.not.create.file" : "app.could.not.create.folder");
      setDraft({ ...current, error: reason, busy: false });
    }
  };
  const creation: TreeCreationProps = { draft, onName: name => setDraft(current => current && { ...current, name, error: '' }), onSubmit: () => void submitCreate(), onCancel: () => { setDraft(null); document.querySelector<HTMLElement>('.cm-content')?.focus(); } };

  const [enabledModules, setEnabledModules] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('texpro.symbolModules') || 'null');
      if (Array.isArray(stored) && stored.length) return stored;
    } catch {
      // ignore
    }
    return symbolModules.map((module) => module.id);
  });
  const [recentSymbols, setRecentSymbols] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('texpro.recentSymbols') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });
  const [assetFilter, setAssetFilter] = useState('');
  const { msg } = useI18n();

  useEffect(() => {
    if (tab !== 'search' || !project || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const found = await window.texpro.searchProject(project.root, query.trim(), caseSensitive);
        if (!cancelled) {
          setResults(found);
          setSearchError(null);
        }
      } catch (error) {
        if (!cancelled) setSearchError(String(error));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, caseSensitive, tab, project]);

  const catalog = useMemo(() => allSymbols(), []);
  const filteredModules = useMemo(() => {
    const needle = symbolFilter.toLowerCase().replace(/^\\/, '');
    return symbolModules
      .filter((module) => enabledModules.includes(module.id))
      .map((module) => ({
        ...module,
        symbols: module.symbols.filter((symbol) => {
          if (!needle) return true;
          return [symbol.name, symbol.latex, ...(symbol.aliases || [])]
            .join(' ')
            .toLowerCase()
            .includes(needle);
        }),
      }))
      .filter((module) => module.symbols.length > 0);
  }, [symbolFilter, enabledModules]);
  const recentItems = useMemo(
    () => recentSymbols.map((id) => catalog.find((symbol) => symbol.id === id)).filter(Boolean).slice(0, 16) as SymbolItem[],
    [recentSymbols, catalog],
  );

  useEffect(() => {
    localStorage.setItem('texpro.symbolModules', JSON.stringify(enabledModules));
  }, [enabledModules]);
  useEffect(() => {
    localStorage.setItem('texpro.recentSymbols', JSON.stringify(recentSymbols));
  }, [recentSymbols]);

  const insertSymbol = (symbol: SymbolItem) => {
    onInsert(symbol.latex);
    setRecentSymbols((current) => [symbol.id, ...current.filter((id) => id !== symbol.id)].slice(0, 24));
  };

  return (
    <aside className="sidebar" data-tree-menu={treeMenu ? treeMenu.node.name : ""}>
      <nav className="sidebar-rail" aria-label={msg("app.sidebar.sections")}>
        <button className={tab === 'files' ? 'active' : ''} data-testid="tab-files"
          onClick={() => onTabChange('files')} title={msg("app.project.files")} aria-label={msg("app.project.files")}>
          <Files size={17} />
        </button>
        <button className={tab === 'outline' ? 'active' : ''} onClick={() => onTabChange('outline')} title={msg("app.outline")} aria-label={msg("app.outline")}>
          <ListTree size={17} />
        </button>
        <button className={tab === 'assets' ? 'active' : ''} data-testid="tab-assets"
          onClick={() => onTabChange('assets')} title={msg("app.asset.library")} aria-label={msg("app.asset.library")}>
          <FileImageIcon size={17} />
        </button>
        <button className={tab === 'symbols' ? 'active' : ''} data-testid="tab-symbols"
          onClick={() => onTabChange('symbols')} title={msg("app.symbols")} aria-label={msg("app.symbols")}>
          <Shapes size={17} />
        </button>
        <button className={tab === 'search' ? 'active' : ''} onClick={() => onTabChange('search')} title={msg("app.search.project")} aria-label={msg("app.search.project")}>
          <Search size={17} />
        </button>
        <button className={tab === 'notes' ? 'active' : ''} data-testid="tab-notes" onClick={() => onTabChange('notes')} title={msg("app.revision.memos")} aria-label={msg("app.revision.memos")}><CheckSquare size={17} /></button>
        <button className={tab === 'placeholders' ? 'active' : ''} data-testid="tab-placeholders" onClick={() => onTabChange('placeholders')} title={msg("app.placeholders")} aria-label={msg("app.placeholders")}><SquareDashed size={17} /></button>
        <div className="rail-spacer" />
        <button onClick={onOpenFolder} title={msg("app.open.another.project")} aria-label={msg("app.open.another.project")}>
          <Plus size={17} />
        </button>
      </nav>

      <div className="sidebar-panel">
        {tab === 'notes' && <WritingNotes notes={writingNotes} onOpen={onOpenNote} onToggle={onToggleNote} onInsert={onInsertNote} />}
        {tab === 'placeholders' && <WritingPlaceholders items={placeholders} onOpen={onOpenPlaceholder} onInsert={onInsertPlaceholder} />}
        {tab === 'files' && (
          <>
            <div className="panel-heading">
              <span>{msg("app.project")}</span>
              <div className="panel-heading-actions">
                <button className="mini-btn" data-testid="new-file" onClick={() => beginCreate(project?.root || '', 'file')} title={msg("app.new.file")} aria-label={msg("app.new.file")}><Plus size={11} /></button>
                <button className="mini-btn" data-testid="new-folder" onClick={() => beginCreate(project?.root || '', 'folder')} title={msg("app.new.folder")} aria-label={msg("app.new.folder")}><FolderPlus size={11} /></button>
                <button className="mini-btn" onClick={onOpenFolder} title={msg("app.open.another.project.o")} aria-label={msg("app.open.another.project.o")}><FolderOpen size={11} /></button>
              </div>
            </div>
            <div className="project-card">
              <div className="project-card-icon"><BookOpen size={15} /></div>
              <div className="project-card-text">
                <strong>{project?.name || 'No project'}</strong>
                <span>{project ? project.root.replace(/^.*\/(?=[^/]+\/[^/]+$)/, '…/') : 'Open a folder to begin'}</span>
              </div>
            </div>
            {project && <div className={`project-main-file ${project.rootFile ? '' : 'needs-selection'}`}>
              <label htmlFor="project-main-file">{msg("app.main.file")}<small>{msg(project.rootSource === 'configured' ? "app.pinned.to.project" : project.rootFile ? "app.auto.detected" : "app.choose.main.file")}</small></label>
              <select id="project-main-file" data-testid="project-main-file" value={project.rootFile || ''} disabled={compiling} onChange={(event) => onSelectRoot(event.target.value)}>
                {!project.rootFile && <option value="" disabled>{msg("app.choose.main.file")}</option>}
                {(project.rootCandidates || (project.rootFile ? [project.rootFile] : [])).map(file => <option key={file} value={file}>{relativePath(project.root, file)}</option>)}
              </select>
              {!project.rootFile && <p role="status">{msg(project.rootSource === 'ambiguous' ? "app.several.documents.found.select.the.one.to.compile" : project.rootSource === 'invalid' ? "app.main.file.is.unavailable.select.a.valid.entry" : "app.add.a.file.containing.documentclass.to.begin")}</p>}
              {project.rootError && <details className="project-root-details"><summary>{msg("app.details")}</summary><p>{project.rootError}</p></details>}
            </div>}
            <div className="file-tree" onContextMenu={event => {
              if (!project) return; event.preventDefault();
              setTreeMenu({ node: { name: project.name, path: project.root, relative: '.', type: 'dir', children: project.tree }, x: event.clientX, y: event.clientY });
            }}>
              {draft?.parent === project?.root && <TreeCreation {...creation} />}
              {project ? (
                project.tree.length ? (
                  project.tree.map((node) => (
                    <TreeItem
                      key={node.path}
                      node={node}
                      depth={0}
                      activePath={activePath}
                      onOpenFile={onOpenFile}
                      creation={creation}
                      onNodeContextMenu={(node, event) => { event.stopPropagation(); setTreeMenu({ node, x: event.clientX, y: event.clientY }); }}
                    />
                  ))
                ) : (
                  <div className="panel-empty">{msg("app.this.folder.is.empty")}</div>
                )
              ) : (
                <div className="panel-empty">{msg("app.no.project.open")}</div>
              )}
            </div>
          </>
        )}

        {tab === 'outline' && (
          <>
            <div className="panel-heading">
              <span>{msg("app.outline")}</span>
              <span className="panel-badge">{outline.length}</span>
            </div>
            <div className="outline-list">
              {outline.length === 0 && (
                <div className="panel-empty">{msg("app.outline.empty")}</div>
              )}
              {outline.map((item) => {
                const active = Math.abs(cursorLine - item.line) <= 1;
                return (
                  <button
                    key={item.id}
                    className={`outline-row ${active ? 'active' : ''} outline-level-${Math.min(item.level, 4)}`}
                    style={{ paddingLeft: 10 + Math.min(item.level, 4) * 13 }}
                    onClick={() => onOutlineClick(item)}
                    title={`Line ${item.line}`}
                  >
                    {outlineIcon(item)}
                    <span>{msg.text(item.title)}</span>
                    <span className="outline-line">{item.line}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === 'assets' && (
          <>
            <div className="panel-heading">
              <span>{msg("app.assets")}</span>
              <span className="panel-badge">{assets.length}</span>
            </div>
            <div className="asset-toolbar">
              <button className="asset-import" onClick={() => void onImportAssets()}>
                <Upload size={12} /> {msg("app.import.images")}
              </button>
            </div>
            <div className="sidebar-search">
              <Search size={12} />
              <input
                value={assetFilter}
                onChange={(event) => setAssetFilter(event.target.value)}
                placeholder={msg("app.filter.assets")}
              />
            </div>
            <div className="asset-grid">
              {assets
                .filter((asset) => asset.name.toLowerCase().includes(assetFilter.toLowerCase()))
                .map((asset) => (
                  <div className="asset-card" key={asset.path}>
                    <button className="asset-thumb" onClick={() => onPreviewAsset(asset)} title={msg("app.preview.file")}>
                      {['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(asset.ext) ? (
                        <img src={assetUrl(asset.path)} alt={asset.name} loading="lazy" />
                      ) : (
                        <FileImageIcon size={22} />
                      )}
                    </button>
                    <div className="asset-meta">
                      <strong title={asset.relative}>{asset.name}</strong>
                      <small>{formatBytes(asset.size)} · {asset.ext.replace('.', '').toUpperCase()}</small>
                    </div>
                    <div className="asset-actions">
                      <button onClick={() => onInsertAsset(asset)} title={msg("app.insert.into.document")}><ImagePlus size={11} /></button>
                      <button onClick={() => onPreviewAsset(asset)} title={msg("app.preview.file")}><Eye size={11} /></button>
                      <button
                        onClick={() => {
                          void navigator.clipboard?.writeText(asset.relative);
                        }}
                        title={msg("app.copy.path")}
                      >
                        <Copy size={11} />
                      </button>
                      <button onClick={() => void window.texpro.reveal(asset.path)} title={msg("app.reveal.in.finder")}>
                        <FileImageIcon size={11} />
                      </button>
                      <button
                        className="asset-delete"
                        onClick={() => {
                          if (window.confirm(`${msg("app.delete.asset")}\n${asset.name}\n\n${msg("app.the.file.is.moved.to.texpro.trash")}`)) void onDeleteAsset(asset);
                        }}
                        title={msg("app.delete")}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              {assets.length === 0 && (
                <div className="asset-empty">
                  <ImagePlus size={22} />
                  <strong>{msg("app.no.assets.yet")}</strong>
                  <span>{msg("app.import.an.image.to.preview.and.insert.it.here")}</span>
                  <button className="primary-btn" onClick={() => void onImportAssets()}>
                    <Upload size={12} /> {msg("app.import.assets")}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'symbols' && (
          <>
            <div className="panel-heading">
              <span>{msg("app.symbols")}</span>
              <div className="symbol-heading-actions">
                <span className="panel-badge">{catalog.length}</span>
                <button
                  className={`mini-btn ${symbolConfigOpen ? 'active' : ''}`}
                  onClick={() => setSymbolConfigOpen((value) => !value)}
                  title={msg("app.configure.symbol.modules")}
                >
                  <SlidersHorizontal size={12} />
                </button>
              </div>
            </div>
            {symbolConfigOpen && (
              <div className="symbol-config">
                <div className="symbol-config-title">{msg("app.symbol.modules")}</div>
                <div className="symbol-config-list">
                  {symbolModules.map((module) => {
                    const enabled = enabledModules.includes(module.id);
                    return (
                      <label key={module.id} className="symbol-config-row">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => {
                            setEnabledModules((current) =>
                              enabled ? current.filter((id) => id !== module.id) : [...current, module.id],
                            );
                          }}
                        />
                        <span>{msg.text(module.name)}</span>
                        <em>{module.symbols.length}</em>
                      </label>
                    );
                  })}
                </div>
                <button
                  className="symbol-config-reset"
                  onClick={() => setEnabledModules(symbolModules.map((module) => module.id))}
                >
                  {msg("app.enable.all")}
                </button>
              </div>
            )}
            <div className="sidebar-search">
              <Search size={12} />
              <input
                value={symbolFilter}
                onChange={(event) => setSymbolFilter(event.target.value)}
                placeholder={msg("app.filter.symbols")}
              />
            </div>
            <div className="symbol-scroll">
              {recentItems.length > 0 && !symbolFilter && (
                <div className="symbol-group">
                  <div className="symbol-title">{msg("app.recently.used")}</div>
                  <div className="symbol-grid rendered">
                    {recentItems.map((symbol) => (
                      <button
                        key={`recent-${symbol.id}`}
                        onClick={() => insertSymbol(symbol)}
                        title={`${symbol.name} · ${symbol.latex}`}
                      >
                        <span className="symbol-render" dangerouslySetInnerHTML={{ __html: renderSymbolHtml(symbol) }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filteredModules.map((module) => (
                <div className="symbol-group" key={module.id}>
                  <div className="symbol-title">
                    {msg.text(module.name)}
                    <span>{module.symbols.length}</span>
                  </div>
                  <div className="symbol-grid rendered">
                    {module.symbols.map((symbol) => (
                      <button
                        key={symbol.id}
                        onClick={() => insertSymbol(symbol)}
                        title={`${symbol.name} · ${symbol.latex}`}
                      >
                        <span className="symbol-render" dangerouslySetInnerHTML={{ __html: renderSymbolHtml(symbol) }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {enabledModules.length === 0 && <div className="panel-empty">{msg("app.no.symbol.modules.enabled")}</div>}
              {filteredModules.length === 0 && enabledModules.length > 0 && (
                <div className="panel-empty">{msg("app.no.symbols.match.this.filter")}</div>
              )}
              <div className="symbol-group">
                <div className="symbol-title">{msg("app.structures")}</div>
                <div className="snippet-list">
                  {snippetLibrary.map((item) => (
                    <button key={item.id} className="snippet-row" onClick={() => onInsert(item.template)}>
                      <Braces size={13} />
                      <span>
                        <strong>{msg.text(item.title)}</strong>
                        <small>{msg.text(item.description)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'search' && (
          <>
            <div className="panel-heading">
              <span>{msg("app.search.project")}</span>
              <button
                className={`mini-btn ${caseSensitive ? 'active' : ''}`}
                onClick={() => setCaseSensitive((value) => !value)}
                title={msg("app.match.case")}
              >
                Aa
              </button>
            </div>
            <div className="sidebar-search">
              <Search size={12} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={msg("app.search.tex.bib.sty")}
              />
              {searching && <Loader2 size={12} className="spin" />}
            </div>
            <div className="search-meta">
              {query.length >= 2 && !searching ? `${results.length} result${results.length === 1 ? '' : 's'}` : msg("app.type.at.least.2.characters")}
            </div>
            <div className="search-results">
              {searchError && <div className="panel-empty danger-text">{searchError}</div>}
              {results.map((result) => (
                <button
                  key={`${result.file}-${result.line}`}
                  className="search-result"
                  onClick={() => onSearchResult(result)}
                >
                  <div className="search-result-head">
                    <span>{basename(result.file)}</span>
                    <em>:{result.line}</em>
                  </div>
                  <div className="search-result-text">{result.text}</div>
                  <div className="search-result-path">{result.relative}</div>
                </button>
              ))}
              {!searching && query.length >= 2 && results.length === 0 && !searchError && (
                <div className="panel-empty">{msg("app.no.matches.found")}</div>
              )}
            </div>
          </>
        )}
      </div>
      {treeMenu && createPortal(
        <>
          <div className="tree-menu-scrim" onMouseDown={() => setTreeMenu(null)} onContextMenu={(event) => { event.preventDefault(); setTreeMenu(null); }} />
          <div className="tree-menu" style={{ left: treeMenu.x, top: treeMenu.y }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="tree-menu-title">{treeMenu.node.type === 'dir' ? treeMenu.node.name : basename(treeMenu.node.path)}</div>
            {treeMenu.node.type === 'dir' ? (
              <>
                <button onClick={() => { beginCreate(treeMenu.node.path, 'file'); }}><FilePlus2 size={12} /> {msg("app.new.file")}</button>
                <button onClick={() => { beginCreate(treeMenu.node.path, 'folder'); }}><FolderPlus size={12} /> {msg("app.new.folder")}</button>
                {treeMenu.node.path !== project?.root && <button onClick={() => { onRenameFolder(treeMenu.node.path); setTreeMenu(null); }}><Pencil size={12} /> {msg("app.rename.folder")}</button>}
                {treeMenu.node.path !== project?.root && <button className="danger" onClick={() => { onDeleteFolder(treeMenu.node.path); setTreeMenu(null); }}><Trash2 size={12} /> {msg("app.delete.folder")}</button>}
              </>
            ) : (
              <>
                <button onClick={() => beginCreate(dirname(treeMenu.node.path), 'file')}><FilePlus2 size={12} /> {msg("app.new.file")}</button>
                <button onClick={() => beginCreate(dirname(treeMenu.node.path), 'folder')}><FolderPlus size={12} /> {msg("app.new.folder")}</button>
                <button onClick={() => { onRenameFile(treeMenu.node.path); setTreeMenu(null); }}><Pencil size={12} /> {msg("app.rename.file")}</button>
                <button onClick={() => { onMoveFile(treeMenu.node.path); setTreeMenu(null); }}><FolderInput size={12} /> {msg("app.move.file")}</button>
                <button className="danger" onClick={() => { onDeleteFile(treeMenu.node.path); setTreeMenu(null); }}><Trash2 size={12} /> {msg("app.delete.file")}</button>
              </>
            )}
          </div>
        </>,
        document.body,
      )}
    </aside>
  );
}

export type { SidebarTab };
