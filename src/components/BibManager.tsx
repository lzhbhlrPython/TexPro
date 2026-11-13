import { useDialogFocus } from '../hooks/useDialogFocus';
import { requestText } from './TextRequest';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  BookMarked,
  Check,
  FileInput,
  FilePlus2,
  Globe2,
  Link2,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  bibAuthors,
  bibDisplayName,
  bibEntryTypes,
  newBibEntry,
  parseBib,
  parseEnw,
  parseRis,
  serializeBib,
  type BibEntry,
} from '../lib/bib';
import { basename, dirname, relativePath, stem } from '../lib/latex';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  projectRoot: string | null;
  activeFile: string | null;
  activeContent: string;
  bibFiles: string[];
  onClose: () => void;
  onInsertCite: (key: string) => void;
  onAddBibliography: (bibPath: string, mode: 'bibtex' | 'biblatex', style: string) => void;
  onChanged: () => void;
}

const FIELD_LABELS: Array<[string, string]> = [
  ['author', "app.author"],
  ['title', "app.title"],
  ['year', "app.year"],
  ['journal', "app.journal"],
  ['booktitle', "app.book.title"],
  ['publisher', "app.publisher"],
  ['volume', "app.volume"],
  ['number', "app.number"],
  ["app.pages.variant2", "app.pages"],
  ['doi', "app.doi"],
  ['url', "app.url"],
  ['note', "app.note"],
];

export function BibManager({
  open,
  projectRoot,
  activeFile,
  activeContent,
  bibFiles,
  onClose,
  onInsertCite,
  onAddBibliography,
  onChanged,
}: Props) {
  const { msg } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocus(open, dialogRef, () => void close());
  const [files, setFiles] = useState<string[]>(bibFiles);
  const [entries, setEntries] = useState<BibEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [search, setSearch] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [zoteroOpen, setZoteroOpen] = useState(false);
  const [zoteroQuery, setZoteroQuery] = useState('');
  const [zoteroResults, setZoteroResults] = useState<Array<{ key: string; title: string; doi: string; author: string; year: string }>>([]);
  const [zoteroBusy, setZoteroBusy] = useState(false);
  const [zoteroError, setZoteroError] = useState('');
  const [zoteroSelected, setZoteroSelected] = useState<string[]>([]);
  const [bibMode, setBibMode] = useState<'bibtex' | 'biblatex'>('bibtex');
  const [bibStyle, setBibStyle] = useState('plain');

  useEffect(() => {
    if (!open) return;
    setFiles(bibFiles);
    setSelectedKey('');
    setDirty(false);
    setBibMode(/\\usepackage(?:\[[^\]]*\])?\{biblatex\}/.test(activeContent) ? 'biblatex' : 'bibtex');
    setBibStyle(/style=authoryear/.test(activeContent) ? 'authoryear' : /style=numeric/.test(activeContent) ? 'numeric' : 'plain');
    setLoading(true);
    let cancelled = false;
    Promise.all(
      bibFiles.map(async (file) => {
        try {
          return parseBib(await window.texpro.readFile(file), file);
        } catch {
          return [] as BibEntry[];
        }
      }),
    )
      .then((groups) => {
        if (cancelled) return;
        const next = groups.flat();
        setEntries(next);
        setSelectedFile(bibFiles[0] || '');
        setSelectedKey(next[0]?.key || '');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, bibFiles, activeContent]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (selectedFile && entry.file !== selectedFile) return false;
      if (!needle) return true;
      return [entry.key, entry.type, bibDisplayName(entry), bibAuthors(entry), entry.fields.year || '']
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [entries, search, selectedFile]);

  const selected = entries.find((entry) => entry.key === selectedKey && entry.file === selectedFile);

  const close = async () => {
    if (!dirty) { onClose(); return; }
    if (!window.confirm(msg("app.save.changes.before.closing"))) return;
    try {
      for (const file of files) await window.texpro.writeFile(file, serializeBib(entries.filter(entry => entry.file === file)));
      setDirty(false); onChanged(); onClose();
    } catch (error) { setNotice(String(error)); }
  };

  if (!open) return null;

  const updateSelected = (patch: Partial<BibEntry>) => {
    if (!selected) return;
    setEntries((current) =>
      current.map((entry) => (entry.key === selected.key && entry.file === selected.file ? { ...entry, ...patch, fields: patch.fields || entry.fields } : entry)),
    );
    setDirty(true);
  };

  const updateField = (name: string, value: string) => {
    if (!selected) return;
    setEntries((current) =>
      current.map((entry) =>
        entry.key === selected.key && entry.file === selected.file
          ? { ...entry, fields: { ...entry.fields, [name]: value } }
          : entry,
      ),
    );
    setDirty(true);
  };

  const saveFile = async (file = selectedFile) => {
    if (!file) return;
    const fileEntries = entries.filter((entry) => entry.file === file);
    await window.texpro.writeFile(file, serializeBib(fileEntries));
    setDirty(false);
    onChanged();
  };

  const addEntry = async () => {
    let file = selectedFile;
    if (!file) {
      if (!projectRoot) return;
      file = `${projectRoot}/references.bib`;
      if (await window.texpro.fileExists(file)) { setNotice(msg("app.a.file.with.this.name.already.exists")); return; }
      try { await window.texpro.createProjectFile(projectRoot, projectRoot, 'references.bib', ''); } catch (error) { setNotice(String(error)); return; }
      setFiles((current) => [...current, file]);
      setSelectedFile(file);
    }
    const keys = new Set(entries.map((entry) => entry.key));
    const entry = newBibEntry(file, keys);
    setEntries((current) => [...current, entry]);
    setSelectedKey(entry.key);
    setDirty(true);
  };

  const removeEntry = async () => {
    if (!selected) return;
    if (!window.confirm(`${msg("app.delete.entry")}\n${selected.key}`)) return;
    const next = entries.filter((entry) => !(entry.key === selected.key && entry.file === selected.file));
    setEntries(next);
    const fileEntries = next.filter((entry) => entry.file === selected.file);
    await window.texpro.writeFile(selected.file, serializeBib(fileEntries));
    setSelectedKey(fileEntries[0]?.key || '');
    setDirty(false);
    onChanged();
  };

  const targetFile = async (): Promise<string | null> => {
    if (selectedFile) return selectedFile;
    if (!projectRoot) return null;
    const file = `${projectRoot}/references.bib`;
    if (!files.includes(file)) {
      if (await window.texpro.fileExists(file)) { setNotice(msg("app.a.file.with.this.name.already.exists")); return null; }
    try { await window.texpro.createProjectFile(projectRoot, projectRoot, 'references.bib', ''); } catch (error) { setNotice(String(error)); return null; }
      setFiles((current) => [...current, file]);
    }
    setSelectedFile(file);
    return file;
  };

  const appendImported = async (imported: BibEntry[], source: string) => {
    const file = await targetFile();
    if (!file || !imported.length) return;
    const keys = new Set(entries.map((entry) => entry.key));
    const adjusted = imported.map((entry) => {
      let key = entry.key;
      let index = 2;
      while (keys.has(key)) key = `${entry.key}${index++}`;
      keys.add(key);
      return { ...entry, key, file };
    });
    const next = [...entries, ...adjusted];
    setEntries(next);
    setSelectedKey(adjusted[0].key);
    await window.texpro.writeFile(file, serializeBib(next.filter((entry) => entry.file === file)));
    setDirty(false);
    setNotice(`${msg("app.imported.from.source", { source })}: ${adjusted.length}`);
    onChanged();
  };

  const importOnline = async () => {
    const identifier = await requestText(msg("app.doi.or.arxiv.id"), '');
    if (!identifier) return;
    try {
      const result = await window.texpro.lookupBibtex(identifier);
      await appendImported([{ ...result.entry, file: selectedFile }], result.source);
    } catch (failure) {
      setNotice(String(failure));
    }
  };

  const importZotero = async () => {
    try {
      const library = await window.texpro.zoteroLibrary();
      const imported = parseBib(library.content);
      if (!imported.length) {
        setNotice(msg("app.no.entries.found.in.this.file"));
        return;
      }
      await appendImported(imported, 'Zotero');
    } catch (failure) {
      setNotice(msg("app.zotero.is.not.reachable.start.zotero.with.better.bibtex"));
    }
  };

  const searchZotero = async () => {
    if (!zoteroQuery.trim() || zoteroBusy) return;
    setZoteroBusy(true);
    setZoteroError('');
    try {
      const result = await window.texpro.zoteroSearch(zoteroQuery.trim());
      setZoteroResults(result.results);
      setZoteroSelected([]);
      if (!result.results.length) setZoteroError(msg("app.no.zotero.results"));
    } catch (failure) {
      setZoteroError(msg("app.zotero.is.not.reachable.start.zotero.with.better.bibtex"));
    } finally {
      setZoteroBusy(false);
    }
  };

  const insertZotero = async (key: string) => {
    try {
      if (!entries.some((entry) => entry.key === key)) {
        const result = await window.texpro.zoteroBibtex(key);
        const imported = parseBib(result.content);
        if (imported.length) await appendImported(imported, 'Zotero');
      }
      onInsertCite(key);
      setZoteroOpen(false);
    } catch (failure) {
      setZoteroError(String(failure));
    }
  };

  const importZoteroSelected = async () => {
    if (!zoteroSelected.length) return;
    try {
      const imported = [];
      for (const key of zoteroSelected) {
        if (entries.some((entry) => entry.key === key)) continue;
        const result = await window.texpro.zoteroBibtex(key);
        imported.push(...parseBib(result.content));
      }
      if (imported.length) await appendImported(imported, 'Zotero');
      setZoteroOpen(false);
    } catch (failure) {
      setZoteroError(String(failure));
    }
  };

  const importBibFile = async () => {
    const chosen = await window.texpro.chooseBibFile();
    if (!chosen) return;
    const imported = /\.ris$/i.test(chosen.name)
      ? parseRis(chosen.content)
      : /\.enw$/i.test(chosen.name)
        ? parseEnw(chosen.content)
        : parseBib(chosen.content);
    if (!imported.length) {
      setNotice(msg("app.no.entries.found.in.this.file"));
      return;
    }
    await appendImported(imported, chosen.name);
  };

  const createBibFile = async () => {
    if (!projectRoot) return;
    const name = await requestText(msg("app.new.bib.file.name"), 'references');
    if (!name) return;
    const safe = name.replace(/[\\/:*?"<>|]/g, '-').replace(/\.bib$/i, '');
    const file = `${projectRoot}/${safe}.bib`;
    if (await window.texpro.fileExists(file)) { setNotice(msg("app.a.file.with.this.name.already.exists")); return; }
    try { await window.texpro.createProjectFile(projectRoot, projectRoot, safe + '.bib', ''); } catch (error) { setNotice(String(error)); return; }
    setFiles((current) => (current.includes(file) ? current : [...current, file]));
    setSelectedFile(file);
    setSelectedKey('');
    onChanged();
  };

  const bibPathForDocument = selectedFile && activeFile ? relativePath(dirname(activeFile), selectedFile) : '';

  return (
    <div className="modal-scrim" onMouseDown={() => void close()}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bib-manager-title" tabIndex={-1} className="bib-manager" data-testid="bib-manager" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><BookMarked size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.bibliography.variant2")}</span>
              <h2 id="bib-manager-title">{msg("app.bibliography.manager")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok"><BookMarked size={11} /> BibTeX</span>
            <button className="icon-btn" onClick={() => void close()} aria-label={msg("app.close")} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="bib-body">
          <aside className="bib-sidebar">
            <div className="bib-toolbar">
              <select value={selectedFile} onChange={(event) => { setSelectedFile(event.target.value); setSelectedKey(''); }}>
                <option value="">{msg("app.all.bib.files")}</option>
                {files.map((file) => <option key={file} value={file}>{basename(file)}</option>)}
              </select>
              <button className="mini-btn" onClick={() => void createBibFile()} title={msg("app.new.bib.file")}><FilePlus2 size={12} /></button>
              <button className="mini-btn" onClick={() => void importOnline()} title={msg("app.import.by.doi.arxiv")}><Globe2 size={12} /></button>
              <button className="mini-btn" onClick={() => setZoteroOpen(true)} title={msg("app.search.zotero")}><Search size={12} /></button>
              <button className="mini-btn" onClick={() => void importZotero()} title={msg("app.import.from.zotero.better.bibtex")}><BookMarked size={12} /></button>
              <button className="mini-btn" onClick={() => void importBibFile()} title={msg("app.import.zotero.ris.endnote.bibtex")}><FileInput size={12} /></button>
            </div>
            {notice && <div className="bib-notice">{notice}</div>}
            <div className="sidebar-search bib-search">
              <Search size={12} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={msg("app.search.entries")} />
            </div>
            <div className="bib-list">
              {visible.map((entry) => (
                <button
                  key={`${entry.file}-${entry.key}`}
                  className={`bib-entry ${selected?.key === entry.key && selected?.file === entry.file ? 'active' : ''}`}
                  onClick={() => { setSelectedKey(entry.key); setSelectedFile(entry.file); }}
                >
                  <span className="bib-entry-type">{entry.type}</span>
                  <strong>{entry.key}</strong>
                  <span>{bibDisplayName(entry)}</span>
                  <small>{bibAuthors(entry)} {entry.fields.year ? `· ${entry.fields.year}` : ''}</small>
                </button>
              ))}
              {!loading && visible.length === 0 && <div className="panel-empty">{msg("app.no.bibliography.entries.yet")}</div>}
            </div>
            <button className="bib-add" onClick={() => void addEntry()}><Plus size={12} /> {msg("app.add.entry")}</button>
          </aside>

          <div className="bib-detail">
            {selected ? (
              <>
                <div className="bib-form-head">
                  <div className="bib-form-row">
                    <label><span>{msg("app.type")}</span>
                      <select value={selected.type} onChange={(event) => updateSelected({ type: event.target.value })}>
                        {[...new Set([selected.type, ...bibEntryTypes])].map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </label>
                    <label><span>{msg("app.citation.key")}</span>
                      <input value={selected.key} onChange={(event) => { updateSelected({ key: event.target.value }); setSelectedKey(event.target.value); }} />
                    </label>
                  </div>
                  <div className="bib-form-actions">
                    <button className="secondary-btn" onClick={() => void saveFile()} disabled={!dirty}><Check size={12} /> {msg("app.save")}</button>
                    <button className="danger-btn" onClick={() => void removeEntry()}><Trash2 size={12} /> {msg("app.delete")}</button>
                  </div>
                </div>
                <div className="bib-fields">
                  {FIELD_LABELS.map(([name, label]) => (
                    <label key={name} className={name === 'title' || name === 'author' ? 'wide' : ''}>
                      <span>{msg.text(label)}</span>
                      <input value={selected.fields[name] || ''} onChange={(event) => updateField(name, event.target.value)} />
                    </label>
                  ))}
                </div>
                <div className="bib-detail-footer">
                  <span className="bib-file-path">{selected.file}</span>
                  <div className="spacer" />
                  <select className="bib-mode-select" value={bibMode} onChange={(event) => {
                    const mode = event.target.value as 'bibtex' | 'biblatex';
                    setBibMode(mode);
                    if (mode === 'biblatex' && bibStyle === 'plain') setBibStyle('numeric');
                    if (mode === 'bibtex' && !['plain', 'unsrt', 'alpha', 'abbrv'].includes(bibStyle)) setBibStyle('plain');
                  }}>
                    <option value="bibtex">BibTeX</option>
                    <option value="biblatex">BibLaTeX</option>
                  </select>
                  <select className="bib-mode-select" value={bibStyle} onChange={(event) => setBibStyle(event.target.value)}>
                    {(bibMode === 'bibtex' ? ['plain', 'unsrt', 'alpha', 'abbrv'] : ['numeric', 'authoryear', 'apa']).map((style) => <option key={style} value={style}>{style}</option>)}
                  </select>
                  <button className="secondary-btn" onClick={() => onInsertCite(selected.key)} disabled={!activeFile}>
                    <Link2 size={12} /> {msg("app.insert.citation")}
                  </button>
                  <button className="primary-btn" onClick={() => onAddBibliography(selected.file, bibMode, bibStyle)} disabled={!activeFile}>
                    <BookMarked size={12} /> {msg("app.add.bibliography.block")}
                  </button>
                </div>
              </>
            ) : (
              <div className="bib-empty">
                <BookMarked size={26} />
                <h3>{msg("app.select.or.create.an.entry")}</h3>
                <p>{msg("app.bib.entries.live.in.bib.files.inside.the.project")}</p>
                <button className="primary-btn" onClick={() => void addEntry()}><Plus size={13} /> {msg("app.add.entry")}</button>
              </div>
            )}
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">
            {bibPathForDocument ? `${msg("app.bibliography.path")}: ${bibPathForDocument}` : msg("app.create.or.select.a.bib.file.to.add.a")}
          </span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={() => void saveFile()} disabled={!selectedFile || !dirty}><Check size={12} /> {msg("app.save.bib")}</button>
          <button className="primary-btn" onClick={() => void close()}>{msg("app.done")}</button>
        </footer>
        {zoteroOpen && (
          <div className="zotero-search-scrim" onMouseDown={() => setZoteroOpen(false)}>
            <div className="zotero-search" onMouseDown={(event) => event.stopPropagation()}>
              <div className="zotero-search-head"><BookMarked size={15} /><strong>{msg("app.search.zotero")}</strong><button className="icon-btn" onClick={() => setZoteroOpen(false)}><X size={14} /></button></div>
              <div className="zotero-search-row">
                <input autoFocus value={zoteroQuery} onChange={(event) => setZoteroQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void searchZotero(); }} placeholder={msg("app.title.author.or.doi")} />
                <button className="primary-btn" onClick={() => void searchZotero()} disabled={zoteroBusy}>{zoteroBusy ? <Loader2 size={12} className="spin" /> : <Search size={12} />} {msg("app.search")}</button>
              </div>
              {zoteroError && <div className="zotero-error">{zoteroError}</div>}
              <div className="zotero-results">
                {zoteroResults.map((result) => (
                  <div key={result.key} className={`zotero-result-row ${zoteroSelected.includes(result.key) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={zoteroSelected.includes(result.key)}
                      onChange={(event) => setZoteroSelected((current) => event.target.checked ? [...current, result.key] : current.filter((key) => key !== result.key))}
                    />
                    <button onClick={() => void insertZotero(result.key)}>
                      <strong>{result.title}</strong>
                      <span>{result.author}{result.year ? ` · ${result.year}` : ''}{result.doi ? ` · ${result.doi}` : ''}</span>
                      <code>{result.key}</code>
                    </button>
                  </div>
                ))}
                {!zoteroResults.length && !zoteroError && <div className="bib-empty-inline">{msg("app.search.your.running.zotero.library.with.better.bibtex")}</div>}
              </div>
              <div className="zotero-search-footer">
                <span>{zoteroSelected.length} {msg("app.selected")}</span>
                <button className="primary-btn" onClick={() => void importZoteroSelected()} disabled={!zoteroSelected.length}>{msg("app.import.selected")}</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
