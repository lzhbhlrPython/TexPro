import { useEffect, useRef, useState } from 'react';
import { Check, FileCode2, FolderOpen, Package, Plug, RefreshCw, X } from 'lucide-react';
import type { InstalledExtension, PackageManifest, ExtensionAction, PanelContribution } from '../../packages/extension-sdk';
import { localize, capabilityTitle, providerTitle } from '../app/extensions/contracts';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { useI18n } from '../i18n';
import { parseCwl, type CwlCompletion } from '../lib/cwl';

interface Props {
  open: boolean; projectRoot: string | null; items: InstalledExtension[]; hostError: string;
  completions: CwlCompletion[]; onClose: () => void; onRefresh: () => Promise<void>;
  onCompletionsChange: (items: CwlCompletion[]) => void; onOpenMcp: () => void;
  themePackage?: string; onPreviewTheme: (key: string | null | undefined) => void;
  onApplyTheme: (key: string, base: 'paper' | 'studio' | 'night') => void;
  onRunPanel: (extension: InstalledExtension, panel: PanelContribution) => void;
  onRun: (extension: InstalledExtension, action: ExtensionAction) => void;
  onTemplate: (template: { name: string; engine: 'pdflatex' | 'xelatex' | 'lualatex'; files: Array<{ path: string; content: string }> }) => void;
}
export function ExtensionsPanel(props: Props) {
  const { t, language } = useI18n();
  const ref = useRef<HTMLElement>(null); useDialogFocus(props.open, ref, props.onClose);
  const [selected, setSelected] = useState('');
  const [preview, setPreview] = useState<{ token: string; manifest: PackageManifest; digest: string } | null>(null);
  const [sync, setSync] = useState<Awaited<ReturnType<typeof window.texpro.extensionsSyncPending>>>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [trusted, setTrusted] = useState(false);
  const [config, setConfig] = useState<Record<string, string | number | boolean>>({});
  const item = props.items.find(item => item.manifest.id === selected);
  useEffect(() => { setTrusted(false); setConfig(item?.config || {}); setError(''); }, [selected, item?.manifest.version, item?.digest, item?.enabled]);
  useEffect(() => { if (!props.open) { props.onPreviewTheme(undefined); setPreview(null); } }, [props.open]);
  async function perform(task: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await task(); await props.onRefresh(); setSync(await window.texpro.extensionsSyncPending()); } catch (error) { setError(String(error)); }
    finally { setBusy(false); }
  }
  async function choose(development: boolean) { await perform(async () => { const next = await window.texpro.extensionsChoose(development); if (next) { setPreview(next); setSelected(''); } }); }
  useEffect(() => {
    if (!props.open) return;
    let alive = true;
    const update = () => { void window.texpro.extensionsPending().then(value => { if (alive && value) { setPreview(value); setSelected(''); } }).catch(error => { if (alive) setError(String(error)); }); };
    const updateAll = () => { update(); void window.texpro.extensionsSyncPending().then(value => { if (alive) setSync(value); }).catch(error => { if (alive) setError(String(error)); }); };
    updateAll(); const unsubscribe = window.texpro.onExtensionPackage(updateAll);
    return () => { alive = false; unsubscribe(); };
  }, [props.open]);
  if (!props.open) return null;
  const manifest = preview?.manifest || item?.manifest;
  return <div className="modal-scrim" onMouseDown={props.onClose}>
    <section ref={ref} className="extensions-panel" role="dialog" aria-modal="true" aria-label={t('Extensions')} data-testid="extensions-panel" onMouseDown={event => event.stopPropagation()}>
      <header className="studio-header"><div className="studio-heading"><Package size={20} /><div><span className="modal-eyebrow">{t('Extend TeXPro')}</span><h2>{t('Extensions')}</h2></div></div><button className="icon-btn" onClick={props.onClose} aria-label={t('Close')}><X size={18} /></button></header>
      <div className="extension-install"><button className="secondary-btn" disabled={busy} onClick={() => void choose(false)}><Package size={14} />{t('Install package…')}</button><button className="secondary-btn" disabled={busy} onClick={() => void choose(true)}><FolderOpen size={14} />{t('Load development directory…')}</button><button className="icon-btn" disabled={busy} onClick={() => void perform(props.onRefresh)} aria-label={t('Refresh')}><RefreshCw size={14} /></button></div>
      <p className="extension-safety">{t('Only enable packages from authors you trust. Code can access your files, network and processes; themes can hide controls or imitate trusted UI.')}{' '}{t('Recovery: use the native View menu to reset appearance and disable extensions, or start TeXPro with --safe-mode.')}</p>
      {(error || props.hostError) && <p role="alert" className="extension-error">{error || props.hostError}</p>}
      {sync && <section className="extension-sync" aria-label={t('Review package manager changes')}>
        <h3>{t('Review package manager changes')}</h3><p className="schematic-hint">{sync.root}</p>
        <p>{t('Changes are reviewed one at a time. New packages stay disabled. Uninstall keeps plugin data.')}</p>
        {!sync.changes.length && <p role="status">{t('Extension environment is up to date.')}</p>}
        {sync.changes.map(change => <div className="extension-contribution" key={change.id}><div><strong>{localize(change.manifest.name, language)}</strong><small>{change.origin.name} · {change.manifest.version}</small><small>{change.manifest.capabilities.map(value => t(capabilityTitle(value))).join(' · ') || t('Data only; no executable capabilities.')}</small>{change.kind === 'install' && change.manifest.entry && <small>{t('Executable extensions run trusted Node code with your user permissions. A separate process is not a security sandbox.')}</small>}</div><button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsSyncApply(change.id))}>{t(change.kind === 'remove' ? 'Uninstall' : 'Install disabled')}</button></div>)}
        <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsSyncDismiss())}>{t('Close review')}</button>
      </section>}
      <div className="extensions-body"><nav className="extensions-list" aria-label={t('Installed extensions')}>
        {!props.items.length && <p className="schematic-hint">{t('Install a package shared by its author, or load a development directory.')}</p>}
        {props.items.map(value => <button key={value.manifest.id} className={selected === value.manifest.id && !preview ? 'active' : ''} onClick={() => { setSelected(value.manifest.id); setPreview(null); props.onPreviewTheme(undefined); }}><strong>{localize(value.manifest.name, language)}</strong><small>{value.manifest.version} · {t(value.enabled ? 'Enabled' : 'Disabled')}</small>{value.error && <small className="error-text">{t('Extension needs attention')}</small>}</button>)}
      </nav><main className="extension-details">
        {manifest ? <><h3>{localize(manifest.name, language)}</h3><p>{localize(manifest.description, language)}</p>{Boolean(manifest.contributes.locales?.length) && <p className="schematic-hint">{t('Language packs change interface wording and may imitate trusted instructions. Review the author; English remains available for recovery.')}</p>}<p className="schematic-hint">{manifest.author} · {manifest.version} · {manifest.license}{item?.builtin ? ` · ${t('Preinstalled')}` : ''}</p>
          <p className="extension-id">{manifest.id}</p>
          <h4>{t('Requested capabilities')}</h4><p>{manifest.capabilities.length ? manifest.capabilities.map(value => t(capabilityTitle(value))).join(' · ') : t('Data only; no executable capabilities.')}</p>
          {manifest.entry && <p className="extension-trust-note">{t('Executable extensions run trusted Node code with your user permissions. A separate process is not a security sandbox.')}</p>}
          {Boolean(manifest.contributes.themes?.length) && <p className="extension-trust-note">{t('Theme fonts, assets and styles change the application UI. Validation does not guarantee readability, accessibility or safety. Check the author and package contents before enabling.')}</p>}
          {preview ? <><p className="extension-id">SHA-256 {preview.digest}</p><button className="primary-btn" disabled={busy} onClick={() => void perform(async () => { await window.texpro.extensionsInstall(preview.token); setSelected(manifest.id); setPreview(null); })}>{t('Install disabled')}</button><button className="secondary-btn" onClick={() => setPreview(null)}>{t('Cancel')}</button></> : item && <>
            {item.error && <p role="alert" className="extension-error">{item.error}</p>}
            {!item.enabled && (manifest.entry || manifest.capabilities.includes('theme.styles')) && <label className="extension-trust"><input type="checkbox" checked={trusted} onChange={event => setTrusted(event.target.checked)} />{t('I trust this package and understand its code or custom style risks.')}</label>}
            <div className="extension-buttons"><button className="primary-btn" disabled={busy || (!item.enabled && Boolean(manifest.entry || manifest.capabilities.includes('theme.styles')) && !trusted)} onClick={() => void perform(() => window.texpro.extensionsEnable(manifest.id, !item.enabled, trusted))}>{t(item.enabled ? 'Disable' : 'Enable')}</button>
              {item.development && <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsReload(manifest.id))}>{t('Reload from directory')}</button>}
              {item.canRollback && <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsRollback(manifest.id))}>{t('Restore previous package')}</button>}
              <button className="secondary-btn" disabled={busy || item?.builtin} onClick={() => void perform(() => window.texpro.extensionsRemove(manifest.id))}>{t('Uninstall')}</button></div>
            {(manifest.contributes.settings || []).map(setting => <label className="extension-setting" key={setting.key}><span>{localize(setting.title, language)}</span>{setting.type === 'boolean' ? <input type="checkbox" checked={Boolean(config[setting.key] ?? setting.default)} onChange={event => setConfig({ ...config, [setting.key]: event.target.checked })} /> : <input type={setting.type === 'number' ? 'number' : 'text'} value={String(config[setting.key] ?? setting.default)} onChange={event => setConfig({ ...config, [setting.key]: setting.type === 'number' ? event.target.valueAsNumber : event.target.value })} />}</label>)}
            {Boolean(manifest.contributes.settings?.length) && <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsConfigure(manifest.id, config))}>{t('Save configuration')}</button>}
            {item.enabled && <>
              {(manifest.contributes.themes || []).map(theme => { const key = `${manifest.id}/${theme.id}`; return <div className="extension-contribution" key={key}><strong>{localize(theme.title, language)}</strong><span>{theme.base}</span><button className="secondary-btn" onClick={() => props.onPreviewTheme(key)}>{t('Preview')}</button><button className="secondary-btn" onClick={() => props.onApplyTheme(key, theme.base)}>{props.themePackage === key ? <Check size={13} /> : null}{t('Apply theme')}</button></div>; })}
              {(manifest.contributes.panels || []).map(panel => <div className="extension-contribution" key={panel.id}><strong>{localize(panel.title, language)}</strong><button className="secondary-btn" onClick={() => { props.onClose(); props.onRunPanel(item, panel); }}>{t('Open tool')}</button></div>)}
              {(manifest.contributes.actions || []).map(action => <div className="extension-contribution" key={action.id}><div><strong>{localize(action.title, language)}</strong><small>{t(providerTitle(action.kind))}</small></div><button className="secondary-btn" onClick={() => { props.onClose(); props.onRun(item, action); }}>{t('Open')}</button></div>)}
              {(manifest.contributes.templates || []).map(template => <div className="extension-contribution" key={template.id}><strong>{localize(template.title, language)}</strong><button className="secondary-btn" onClick={() => props.onTemplate({ name: localize(template.title, language), engine: template.engine, files: [{ path: 'main.tex', content: template.source }] })}>{t('Create project')}</button></div>)}
            </>}
          </>}
        </> : <div className="extension-empty"><Package size={28} /><h3>{t('Your writing, extended')}</h3><p>{t('Local packages add tools, completions, templates and themes. Nothing is downloaded automatically.')}</p></div>}
      </main></div>
      <footer className="extension-footer"><label className="secondary-btn"><FileCode2 size={13} />{t('Import .cwl')}<input type="file" accept=".cwl,.txt" hidden disabled={!props.projectRoot || busy} onChange={event => { const file = event.target.files?.[0]; if (file && props.projectRoot) void perform(async () => { const content = await file.text(); await window.texpro.writeFile(`${props.projectRoot}/.texpro/completions.cwl`, content); const fresh = parseCwl(content), keys = new Set(props.completions.map(c => c.label)); props.onCompletionsChange([...props.completions, ...fresh.filter(c => !keys.has(c.label))]); }); event.target.value = ''; }} /></label><button className="secondary-btn" onClick={props.onOpenMcp}><Plug size={13} />{t('MCP integrations')}</button><span>{t('Packages are installed locally. Updates are manual.')}</span></footer>
    </section>
  </div>;
}
