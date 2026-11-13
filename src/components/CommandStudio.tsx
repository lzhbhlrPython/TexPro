import { useEffect, useRef, useState } from 'react';
import { FileCode2, Play, Plus, RotateCcw, Save, Terminal, Trash2, X } from 'lucide-react';
import { defaultActions, parseActions, resolveTxsCommand, type ProjectAction } from '../lib/actions';
import { parseCwl, parseMacros, type CwlCompletion } from '../lib/cwl';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  projectRoot: string | null;
  rootFile: string | null;
  onBeforeRun: () => Promise<boolean>;
  actions: ProjectAction[];
  customCompletions: CwlCompletion[];
  onClose: () => void;
  onActionsChange: (actions: ProjectAction[]) => void;
  onCompletionsChange: (items: CwlCompletion[]) => void;
}

export function CommandStudio({ open, projectRoot, rootFile, onBeforeRun, actions, customCompletions, onClose, onActionsChange, onCompletionsChange }: Props) {
  const { msg } = useI18n();
  const [tab, setTab] = useState<'completions' | 'actions'>('actions');
  const [selectedId, setSelectedId] = useState(actions[0]?.id || '');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [macrosText, setMacrosText] = useState('');
  const [scanned, setScanned] = useState<Array<{ name: string; path: string }>>([]);
  const [scanning, setScanning] = useState(false);
  const cwlInput = useRef<HTMLInputElement | null>(null);
  const selected = actions.find((action) => action.id === selectedId) || actions[0];

  useEffect(() => {
    if (!open || !projectRoot) return;
    window.texpro.fileExists(`${projectRoot}/.texpro/macros.json`).then((exists) => exists ? window.texpro.readFile(`${projectRoot}/.texpro/macros.json`).then(setMacrosText) : setMacrosText('')).catch(() => setMacrosText(''));
    setScanning(true);
    window.texpro.scanCwlSources(projectRoot).then((files) => setScanned(files.map((file) => ({ name: file.name, path: file.path })))).catch(() => setScanned([])).finally(() => setScanning(false));
  }, [open, projectRoot]);

  if (!open) return null;

  const saveActions = async (next: ProjectAction[]) => {
    if (!projectRoot) return;
    onActionsChange(next);
    await window.texpro.writeFile(`${projectRoot}/.texpro/actions.json`, JSON.stringify(next, null, 2));
    setNotice(msg("app.build.actions.saved"));
  };

  const updateAction = (patch: Partial<ProjectAction>) => {
    if (!selected) return;
    const next = actions.map((action) => action.id === selected.id ? { ...action, ...patch } : action);
    onActionsChange(next);
  };

  const addAction = () => {
    const id = `action-${Date.now()}`;
    const next = [...actions, { id, name: msg("app.new.action"), command: 'latexmk', args: ['{rootFile}'] }];
    onActionsChange(next);
    setSelectedId(id);
  };

  const removeAction = () => {
    if (!selected) return;
    const next = actions.filter((action) => action.id !== selected.id);
    onActionsChange(next);
    setSelectedId(next[0]?.id || '');
  };

  const run = async () => {
    if (!selected || !projectRoot || !rootFile || busy) return;
    setBusy(true);
    setOutput('');
    setNotice('');
    try {
      if (!(await onBeforeRun())) return;
      const result = await window.texpro.runProjectAction(projectRoot, {
        command: resolveTxsCommand(selected.command),
        args: selected.args,
        cwd: selected.cwd,
        env: selected.env,
      }, rootFile);
      setOutput(`$ ${selected.command} ${selected.args.join(' ')}\n\n${result.stdout}${result.stderr ? `\n[stderr]\n${result.stderr}` : ''}`);
      setNotice(result.ok ? msg("app.action.completed") : result.timedOut ? msg("app.action.timed.out") : msg("app.action.failed"));
    } catch (error) {
      setNotice(String(error));
    } finally {
      setBusy(false);
    }
  };

  const importCwl = async (file: File) => {
    if (!projectRoot) return;
    const text = await file.text();
    const items = parseCwl(text);
    await window.texpro.writeFile(`${projectRoot}/.texpro/completions.cwl`, text);
    onCompletionsChange([...customCompletions.filter((item) => !items.some((next) => next.label === item.label)), ...items]);
    setNotice(`${msg("app.loaded")} ${items.length} ${msg("app.completions.variant2")}`);
  };

  const saveMacros = async () => {
    if (!projectRoot) return;
    await window.texpro.writeFile(`${projectRoot}/.texpro/macros.json`, macrosText);
    onCompletionsChange([...customCompletions.filter((item) => item.detail !== 'project macro'), ...parseMacros(macrosText)]);
    setNotice(msg("app.macros.saved"));
  };

  const scanNow = async () => {
    if (!projectRoot || scanning) return;
    setScanning(true);
    try {
      const files = await window.texpro.scanCwlSources(projectRoot);
      setScanned(files.map((file) => ({ name: file.name, path: file.path })));
      const parsed = files.flatMap((file) => parseCwl(file.content));
      const seen = new Set(customCompletions.map((item) => `${item.label}:${item.template}`));
      const fresh = parsed.filter((item) => {
        const key = `${item.label}:${item.template}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      onCompletionsChange([...customCompletions, ...fresh]);
      setNotice(`${msg("app.loaded")} ${fresh.length} ${msg("app.completions.variant2")}`);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="command-studio" data-testid="command-studio" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Terminal size={18} /></div>
            <div><span className="modal-eyebrow">{msg("app.customize")}</span><h2>{msg("app.commands.completions")}</h2></div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok">{actions.length} {msg("app.actions")}</span>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button>
          </div>
        </header>
        <div className="command-tabs">
          <button className={tab === 'actions' ? 'active' : ''} onClick={() => setTab('actions')}><Terminal size={12} /> {msg("app.build.actions")}</button>
          <button className={tab === 'completions' ? 'active' : ''} onClick={() => setTab('completions')}><FileCode2 size={12} /> {msg("app.completions")}</button>
        </div>
        {tab === 'actions' ? (
          <div className="command-body">
            <aside className="action-list">
              {actions.map((action) => (
                <button key={action.id} className={selected?.id === action.id ? 'active' : ''} onClick={() => setSelectedId(action.id)}>
                  <strong>{action.name}</strong><code>{action.command}</code>
                </button>
              ))}
              <button className="action-add" onClick={addAction}><Plus size={12} /> {msg("app.add.action")}</button>
            </aside>
            <main className="action-editor">
              {selected ? (
                <>
                  <div className="action-fields">
                    <label className="workshop-field"><span>{msg("app.name")}</span><input value={selected.name} onChange={(event) => updateAction({ name: event.target.value })} /></label>
                    <label className="workshop-field"><span>{msg("app.command")}</span><input value={selected.command} onChange={(event) => updateAction({ command: event.target.value })} placeholder="latexmk or txs:///latexmk" /></label>
                    <label className="workshop-field"><span>{msg("app.arguments")}</span><input value={selected.args.join(' ')} onChange={(event) => updateAction({ args: event.target.value.split(/\s+/).filter(Boolean) })} placeholder="-pdf -synctex=1 {rootFile}" /></label>
                    <label className="workshop-field"><span>{msg("app.working.directory")}</span><input value={selected.cwd || ''} onChange={(event) => updateAction({ cwd: event.target.value })} placeholder="." /></label>
                  </div>
                  <p className="schematic-hint">{msg("app.use.rootfile.rootname.builddir.or.projectroot.txs.references.are")}</p>
                  <div className="action-buttons">
                    <button className="primary-btn" onClick={() => void run()} disabled={busy || !rootFile}><Play size={12} /> {busy ? msg("app.running") : msg("app.run.action")}</button>
                    <button className="secondary-btn" onClick={() => void saveActions(actions)}><Save size={12} /> {msg("app.save.actions")}</button>
                    <button className="danger-btn" onClick={removeAction}><Trash2 size={12} /> {msg("app.delete")}</button>
                    <button className="secondary-btn" onClick={() => onActionsChange(defaultActions)}><RotateCcw size={12} /> {msg("app.defaults")}</button>
                  </div>
                  <pre className="action-output">{output || msg("app.action.output.will.appear.here")}</pre>
                  {notice && <div className="collab-notice">{notice}</div>}
                </>
              ) : <div className="panel-empty">{msg("app.no.actions.configured")}</div>}
            </main>
          </div>
        ) : (
          <div className="completion-body">
            <div className="completion-card">
              <div className="pane-label"><FileCode2 size={12} /> {msg("app.texstudio.cwl")}<span className="pane-hint">{customCompletions.filter((item) => item.detail === 'cwl command' || item.detail === 'cwl environment').length}</span></div>
              <p className="schematic-hint">{msg("app.load.a.cwl.file.to.extend.completion.with.your")}</p>
              <input ref={cwlInput} type="file" accept=".cwl,.txt" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCwl(file); event.target.value = ''; }} />
              <button className="secondary-btn" onClick={() => cwlInput.current?.click()} disabled={!projectRoot}><FileCode2 size={12} /> {msg("app.import.cwl")}</button>
              <button className="secondary-btn" onClick={() => void scanNow()} disabled={!projectRoot || scanning}><RotateCcw size={12} /> {scanning ? msg("app.scanning") : msg("app.scan.texstudio")}</button>
              <div className="completion-path">.texpro/completions.cwl · {scanned.length} {msg("app.auto.detected.cwl.sources")}</div>
              {customCompletions.some((item) => item.detail.startsWith('cwl')) ? (
                <div className="completion-list">
                  {customCompletions.filter((item) => item.detail.startsWith('cwl')).slice(0, 16).map((item) => <code key={item.label}>{item.label}</code>)}
                </div>
              ) : <div className="completion-empty">{msg("app.no.custom.commands.loaded.import.a.cwl.file.to")}</div>}
            </div>
            <div className="completion-card macros-card">
              <div className="pane-label"><FileCode2 size={12} /> {msg("app.macros")}<span className="pane-hint">{customCompletions.filter((item) => item.detail === 'project macro').length}</span></div>
              <p className="schematic-hint">{msg("app.json.array.with.label.trigger.and.a.body.containing")}</p>
              <textarea value={macrosText} onChange={(event) => setMacrosText(event.target.value)} placeholder={'[{"label":"\\\\todo","body":"\\\\todo{|}"}]'} spellCheck={false} />
              <div className="completion-actions">
                <button className="secondary-btn" onClick={() => setMacrosText('[{\"label\":\"\\\\todo\",\"detail\":\"project macro\",\"body\":\"\\\\todo{|}\"}]')}>{msg("app.insert.example")}</button>
                <button className="primary-btn" onClick={() => void saveMacros()} disabled={!projectRoot}><Save size={12} /> {msg("app.save.macros")}</button>
              </div>
            </div>
            {notice && <div className="collab-notice completion-notice">{notice}</div>}
          </div>
        )}
        <footer className="studio-footer">
          <span className="studio-hint">{projectRoot ? '.texpro/actions.json · .texpro/completions.cwl · .texpro/macros.json' : msg("app.open.a.project.first")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.close")}</button>
        </footer>
      </section>
    </div>
  );
}
