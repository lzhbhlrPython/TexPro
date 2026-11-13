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
  const { msg, language } = useI18n();
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
    <section ref={ref} className="extensions-panel" role="dialog" aria-modal="true" aria-label={msg("app.extensions")} data-testid="extensions-panel" onMouseDown={event => event.stopPropagation()}>
      <header className="studio-header"><div className="studio-heading"><Package size={20} /><div><span className="modal-eyebrow">{msg("app.extend.texpro")}</span><h2>{msg("app.extensions")}</h2></div></div><button className="icon-btn" onClick={props.onClose} aria-label={msg("app.close")}><X size={18} /></button></header>
      <div className="extension-install"><button className="secondary-btn" disabled={busy} onClick={() => void choose(false)}><Package size={14} />{msg("app.install.package")}</button><button className="secondary-btn" disabled={busy} onClick={() => void choose(true)}><FolderOpen size={14} />{msg("app.load.development.directory")}</button><button className="icon-btn" disabled={busy} onClick={() => void perform(props.onRefresh)} aria-label={msg("app.refresh")}><RefreshCw size={14} /></button></div>
      <p className="extension-safety">{msg("app.only.enable.packages.from.authors.you.trust.code.can")}{' '}{msg("app.recovery.use.the.native.view.menu.to.reset.appearance")}</p>
      {(error || props.hostError) && <p role="alert" className="extension-error">{error || props.hostError}</p>}
      {sync && <section className="extension-sync" aria-label={msg("app.review.package.manager.changes")}>
        <h3>{msg("app.review.package.manager.changes")}</h3><p className="schematic-hint">{sync.root}</p>
        <p>{msg("app.changes.are.reviewed.one.at.a.time.new.packages")}</p>
        {!sync.changes.length && <p role="status">{msg("app.extension.environment.is.up.to.date")}</p>}
        {sync.changes.map(change => <div className="extension-contribution" key={change.id}><div><strong>{localize(change.manifest.name, language)}</strong><small>{change.origin.name} · {change.manifest.version}</small><small>{change.manifest.capabilities.map(value => msg.text(capabilityTitle(value))).join(' · ') || msg("app.data.only.no.executable.capabilities")}</small>{change.kind === 'install' && change.manifest.entry && <small>{msg("app.executable.extensions.run.trusted.node.code.with.your.user")}</small>}</div><button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsSyncApply(change.id))}>{msg(change.kind === 'remove' ? "app.uninstall" : "app.install.disabled")}</button></div>)}
        <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsSyncDismiss())}>{msg("app.close.review")}</button>
      </section>}
      <div className="extensions-body"><nav className="extensions-list" aria-label={msg("app.installed.extensions")}>
        {!props.items.length && <p className="schematic-hint">{msg("app.install.a.package.shared.by.its.author.or.load")}</p>}
        {props.items.map(value => <button key={value.manifest.id} className={selected === value.manifest.id && !preview ? 'active' : ''} onClick={() => { setSelected(value.manifest.id); setPreview(null); props.onPreviewTheme(undefined); }}><strong>{localize(value.manifest.name, language)}</strong><small>{value.manifest.version} · {msg(value.enabled ? "app.enabled" : "app.disabled")}</small>{value.error && <small className="error-text">{msg("app.extension.needs.attention")}</small>}</button>)}
      </nav><main className="extension-details">
        {manifest ? <><h3>{localize(manifest.name, language)}</h3><p>{localize(manifest.description, language)}</p>{Boolean(manifest.contributes.locales?.length) && <p className="schematic-hint">{msg("app.language.packs.change.interface.wording.and.may.imitate.trusted")}</p>}<p className="schematic-hint">{manifest.author} · {manifest.version} · {manifest.license}{item?.builtin ? ` · ${msg("app.preinstalled")}` : ''}</p>
          <p className="extension-id">{manifest.id}</p>
          <h4>{msg("app.requested.capabilities")}</h4><p>{manifest.capabilities.length ? manifest.capabilities.map(value => msg.text(capabilityTitle(value))).join(' · ') : msg("app.data.only.no.executable.capabilities")}</p>
          {manifest.entry && <p className="extension-trust-note">{msg("app.executable.extensions.run.trusted.node.code.with.your.user")}</p>}
          {Boolean(manifest.contributes.themes?.length) && <p className="extension-trust-note">{msg("app.theme.fonts.assets.and.styles.change.the.application.ui")}</p>}
          {preview ? <><p className="extension-id">SHA-256 {preview.digest}</p><button className="primary-btn" disabled={busy} onClick={() => void perform(async () => { await window.texpro.extensionsInstall(preview.token); setSelected(manifest.id); setPreview(null); })}>{msg("app.install.disabled")}</button><button className="secondary-btn" onClick={() => setPreview(null)}>{msg("app.cancel")}</button></> : item && <>
            {item.error && <p role="alert" className="extension-error">{item.error}</p>}
            {!item.enabled && (manifest.entry || manifest.capabilities.includes('theme.styles')) && <label className="extension-trust"><input type="checkbox" checked={trusted} onChange={event => setTrusted(event.target.checked)} />{msg("app.i.trust.this.package.and.understand.its.code.or")}</label>}
            <div className="extension-buttons"><button className="primary-btn" disabled={busy || (!item.enabled && Boolean(manifest.entry || manifest.capabilities.includes('theme.styles')) && !trusted)} onClick={() => void perform(() => window.texpro.extensionsEnable(manifest.id, !item.enabled, trusted))}>{msg(item.enabled ? "app.disable" : "app.enable")}</button>
              {item.development && <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsReload(manifest.id))}>{msg("app.reload.from.directory")}</button>}
              {item.canRollback && <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsRollback(manifest.id))}>{msg("app.restore.previous.package")}</button>}
              <button className="secondary-btn" disabled={busy || item?.builtin} onClick={() => void perform(() => window.texpro.extensionsRemove(manifest.id))}>{msg("app.uninstall")}</button></div>
            {(manifest.contributes.settings || []).map(setting => <label className="extension-setting" key={setting.key}><span>{localize(setting.title, language)}</span>{setting.type === 'boolean' ? <input type="checkbox" checked={Boolean(config[setting.key] ?? setting.default)} onChange={event => setConfig({ ...config, [setting.key]: event.target.checked })} /> : <input type={setting.type === 'number' ? 'number' : 'text'} value={String(config[setting.key] ?? setting.default)} onChange={event => setConfig({ ...config, [setting.key]: setting.type === 'number' ? event.target.valueAsNumber : event.target.value })} />}</label>)}
            {Boolean(manifest.contributes.settings?.length) && <button className="secondary-btn" disabled={busy} onClick={() => void perform(() => window.texpro.extensionsConfigure(manifest.id, config))}>{msg("app.save.configuration")}</button>}
            {item.enabled && <>
              {(manifest.contributes.themes || []).map(theme => { const key = `${manifest.id}/${theme.id}`; return <div className="extension-contribution" key={key}><strong>{localize(theme.title, language)}</strong><span>{theme.base}</span><button className="secondary-btn" onClick={() => props.onPreviewTheme(key)}>{msg("app.preview")}</button><button className="secondary-btn" onClick={() => props.onApplyTheme(key, theme.base)}>{props.themePackage === key ? <Check size={13} /> : null}{msg("app.apply.theme")}</button></div>; })}
              {(manifest.contributes.panels || []).map(panel => <div className="extension-contribution" key={panel.id}><strong>{localize(panel.title, language)}</strong><button className="secondary-btn" onClick={() => { props.onClose(); props.onRunPanel(item, panel); }}>{msg("app.open.tool")}</button></div>)}
              {(manifest.contributes.actions || []).map(action => <div className="extension-contribution" key={action.id}><div><strong>{localize(action.title, language)}</strong><small>{msg.text(providerTitle(action.kind))}</small></div><button className="secondary-btn" onClick={() => { props.onClose(); props.onRun(item, action); }}>{msg("app.open")}</button></div>)}
              {(manifest.contributes.templates || []).map(template => <div className="extension-contribution" key={template.id}><strong>{localize(template.title, language)}</strong><button className="secondary-btn" onClick={() => props.onTemplate({ name: localize(template.title, language), engine: template.engine, files: [{ path: 'main.tex', content: template.source }] })}>{msg("app.create.project")}</button></div>)}
            </>}
          </>}
        </> : <div className="extension-empty"><Package size={28} /><h3>{msg("app.your.writing.extended")}</h3><p>{msg("app.local.packages.add.tools.completions.templates.and.themes.nothing")}</p></div>}
      </main></div>
      <footer className="extension-footer"><label className="secondary-btn"><FileCode2 size={13} />{msg("app.import.cwl")}<input type="file" accept=".cwl,.txt" hidden disabled={!props.projectRoot || busy} onChange={event => { const file = event.target.files?.[0]; if (file && props.projectRoot) void perform(async () => { const content = await file.text(); await window.texpro.writeFile(`${props.projectRoot}/.texpro/completions.cwl`, content); const fresh = parseCwl(content), keys = new Set(props.completions.map(c => c.label)); props.onCompletionsChange([...props.completions, ...fresh.filter(c => !keys.has(c.label))]); }); event.target.value = ''; }} /></label><button className="secondary-btn" onClick={props.onOpenMcp}><Plug size={13} />{msg("app.mcp.integrations")}</button><span>{msg("app.packages.are.installed.locally.updates.are.manual")}</span></footer>
    </section>
  </div>;
}
