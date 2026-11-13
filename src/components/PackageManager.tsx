import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, CircleAlert, Package, Plus, Search, Trash2, X } from 'lucide-react';
import {
  addPackage, buildDocumentSetup, classCatalog, movePackage, packageCatalog,
  parseDocumentSetup, removePackage, type ClassCatalogItem, type DocumentSetup, type PackageCatalogItem,
} from '../lib/packageManager';
import type { Engine } from '../types';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  documentText: string;
  onClose: () => void;
  onApply: (text: string, engine?: Engine) => void;
}

const categories = ['All', ...Array.from(new Set(packageCatalog.map((item) => item.category)))];

export function PackageManager({ open, documentText, onClose, onApply }: Props) {
  const { msg } = useI18n();
  const [setup, setSetup] = useState<DocumentSetup>({ className: 'article', classOptions: '', packages: [] });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [custom, setCustom] = useState('');
  const [available, setAvailable] = useState<{ packages: Record<string, boolean>; classes: Record<string, boolean> }>({ packages: {}, classes: {} });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSetup(parseDocumentSetup(documentText));
    setQuery('');
    setCategory('All');
  }, [open, documentText]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setChecking(true);
    void window.texpro.checkTexAssets(packageCatalog.map((item) => item.name), classCatalog.map((item) => item.name)).then((result) => {
      if (cancelled) return;
      setAvailable({
        packages: Object.fromEntries(Object.entries(result.packages).map(([name, value]) => [name, value.installed])),
        classes: Object.fromEntries(Object.entries(result.classes).map(([name, value]) => [name, value.installed])),
      });
    }).finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return packageCatalog.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      return !needle || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(needle);
    });
  }, [query, category]);

  if (!open) return null;

  const add = (item: PackageCatalogItem) => setSetup((current) => addPackage(current, item));
  const remove = (name: string) => setSetup((current) => removePackage(current, name));
  const move = (name: string, direction: -1 | 1) => setSetup((current) => movePackage(current, name, direction));
  const updateOptions = (name: string, options: string) => setSetup((current) => ({
    ...current,
    packages: current.packages.map((pkg) => pkg.name === name ? { ...pkg, options } : pkg),
  }));

  const selectedClass = classCatalog.find((item) => item.name === setup.className);
  const engine: Engine | undefined = selectedClass?.engine;
  const classOptions = setup.classOptions.split(',').map((item) => item.trim()).filter(Boolean);
  const hasOption = (option: string) => classOptions.includes(option);
  const toggleOption = (option: string) => {
    const next = hasOption(option) ? classOptions.filter((item) => item !== option) : [...classOptions, option];
    setSetup((current) => ({ ...current, classOptions: next.join(',') }));
  };
  const setExclusive = (values: string[], option: string) => {
    const next = classOptions.filter((item) => !values.includes(item));
    next.push(option);
    setSetup((current) => ({ ...current, classOptions: next.join(',') }));
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="package-studio" data-testid="package-manager" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Package size={18} /></div>
            <div><span className="modal-eyebrow">{msg("app.document.setup")}</span><h2>{msg("app.packages.document.class")}</h2></div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok">{setup.packages.length} {msg("app.packages.variant2")}</span>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="package-body">
          <aside className="package-current">
            <div className="pane-label"><Package size={12} /> {msg("app.document.class")}</div>
            <input className="package-class" list="texpro-class-list" value={setup.className} onChange={(event) => setSetup((current) => ({ ...current, className: event.target.value.trim() }))} placeholder="article, ctexart, IEEEtran…" />
            <datalist id="texpro-class-list">
              {classCatalog.map((item) => <option key={item.name} value={item.name}>{item.description}</option>)}
            </datalist>
            {selectedClass && <p className="package-class-description">{msg.text(selectedClass.description)}</p>}
            <label className="workshop-field"><span>{msg("app.class.options")}</span><input value={setup.classOptions} onChange={(event) => setSetup((current) => ({ ...current, classOptions: event.target.value }))} placeholder="11pt,a4paper" /></label>
            <div className="package-options">
              {['10pt', '11pt', '12pt'].map((option) => <button key={option} className={hasOption(option) ? 'active' : ''} onClick={() => setExclusive(['10pt', '11pt', '12pt'], option)}>{option}</button>)}
              {['a4paper', 'letterpaper'].map((option) => <button key={option} className={hasOption(option) ? 'active' : ''} onClick={() => setExclusive(['a4paper', 'letterpaper'], option)}>{option}</button>)}
              <button className={hasOption('twocolumn') ? 'active' : ''} onClick={() => toggleOption('twocolumn')}>{msg("app.two.column")}</button>
            </div>
            <div className="package-availability">
              {available.classes[setup.className] === false
                ? <><CircleAlert size={11} /> {msg("app.class.file.not.found")}</>
                : available.classes[setup.className] === true
                  ? <><Check size={11} /> {msg("app.class.available")}</>
                  : <>{msg("app.class.not.checked")}</>}
            </div>

            <div className="pane-label package-list-label"><Package size={12} /> {msg("app.active.packages")}<span className="pane-hint">{setup.packages.length}</span></div>
            <div className="package-list">
              {setup.packages.map((pkg, index) => (
                <div key={pkg.name} className="package-row">
                  <div className="package-row-main">
                    <strong>{pkg.name}</strong>
                    {available.packages[pkg.name] === false && <span className="package-missing">{msg("app.missing")}</span>}
                    <input value={pkg.options} onChange={(event) => updateOptions(pkg.name, event.target.value)} placeholder={msg("app.options")} />
                  </div>
                  <div className="package-row-actions">
                    <button onClick={() => move(pkg.name, -1)} disabled={index === 0}><ArrowUp size={11} /></button>
                    <button onClick={() => move(pkg.name, 1)} disabled={index === setup.packages.length - 1}><ArrowDown size={11} /></button>
                    <button className="danger" onClick={() => remove(pkg.name)}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
              {!setup.packages.length && <div className="package-empty">{msg("app.no.packages.yet.add.from.the.catalog")}</div>}
            </div>
            <div className="package-custom">
              <input value={custom} onChange={(event) => setCustom(event.target.value)} placeholder={msg("app.custom.package.name")} onKeyDown={(event) => { if (event.key === 'Enter' && custom.trim()) { add({ name: custom.trim(), description: '', category: "app.custom.variant2" }); setCustom(''); } }} />
              <button className="secondary-btn" onClick={() => { if (custom.trim()) { add({ name: custom.trim(), description: '', category: "app.custom.variant2" }); setCustom(''); } }} disabled={!custom.trim()}><Plus size={12} /></button>
            </div>
          </aside>

          <main className="package-catalog">
            <div className="package-catalog-head">
              <div className="sidebar-search package-search"><Search size={12} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={msg("app.search.packages")} /></div>
              {checking && <span className="package-checking">{msg("app.checking.tex.installation")}</span>}
            </div>
            <div className="package-categories">
              {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{msg.text(item)}</button>)}
            </div>
            <div className="package-grid">
              {filtered.map((item) => {
                const active = setup.packages.some((pkg) => pkg.name === item.name);
                const installed = available.packages[item.name];
                return (
                  <button key={item.name} className={`package-card ${active ? 'active' : ''}`} onClick={() => active ? remove(item.name) : add(item)}>
                    <div className="package-card-head"><strong>{item.name}</strong>{active ? <Check size={12} /> : installed === false ? <CircleAlert size={12} /> : <Plus size={12} />}</div>
                    <span>{msg.text(item.description)}</span>
                    <small>{msg.text(item.category)}{installed === false ? ` · ${msg("app.not.installed")}` : ''}</small>
                  </button>
                );
              })}
            </div>
          </main>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{engine ? `${msg("app.suggested.engine")}: ${engine}` : msg("app.class.and.packages.are.written.back.to.the.preamble")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.cancel")}</button>
          <button className="primary-btn" onClick={() => onApply(buildDocumentSetup(documentText, setup), engine)} disabled={!documentText.trim()}><Check size={12} /> {msg("app.apply.to.preamble")}</button>
        </footer>
      </section>
    </div>
  );
}
