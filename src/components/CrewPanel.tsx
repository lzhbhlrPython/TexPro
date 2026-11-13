import { useRef, useState } from 'react';
import { BookOpen, Check, Clapperboard, GitBranch, Image, Loader2, Play, ScanSearch, Terminal, Users, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  projectRoot: string | null;
  rootFile: string | null;
  onClose: () => void;
  onOpenBuildDetails: () => void;
  onApplied: () => void;
}

interface CrewResult {
  role: string;
  status: 'idle' | 'running' | 'done' | 'failed';
  detail: string;
}

const roles = [
  { id: 'compiler', label: "app.compiler", icon: Clapperboard },
  { id: 'librarian', label: "app.librarian", icon: BookOpen },
  { id: 'figure', label: "app.figure.keeper", icon: Image },
  { id: 'reviewer', label: "app.reviewer", icon: ScanSearch },
  { id: 'git', label: "app.git.keeper", icon: GitBranch },
];

export function CrewPanel({ open, projectRoot, rootFile, onClose, onOpenBuildDetails, onApplied }: Props) {
  const { msg } = useI18n();
  const [results, setResults] = useState<CrewResult[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [proposals, setProposals] = useState<Array<{ id: string; title: string; detail: string; kind: 'figure' | 'git'; approved?: boolean; rejected?: boolean }>>([]);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'review' | 'applying' | 'done'>('idle');
  const clientId = useRef<string | null>(null);

  const close = () => {
    if (clientId.current) void window.texpro.mcpDisconnect(clientId.current);
    clientId.current = null;
    onClose();
  };

  const approve = async (proposal: { id: string; kind: 'figure' | 'git'; title: string; detail: string }) => {
    if (!projectRoot || !rootFile || !clientId.current) return;
    setRunning(true);
    setPhase('applying');
    setError('');
    try {
      if (proposal.kind === 'git') {
        await window.texpro.gitCommit(projectRoot, `Crew: ${proposal.detail}`);
        update('git', { status: 'done', detail: msg("app.committed.by.approved.crew.action") });
      } else {
        const relativeRoot = rootFile.startsWith(projectRoot) ? rootFile.slice(projectRoot.length + 1) : 'main.tex';
        const current = textOf(await window.texpro.mcpCall(clientId.current, 'texpro_read_file', { path: relativeRoot }));
        const block = `\n\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.8\\linewidth]{${proposal.detail}}\n  \\caption{TODO: describe this figure}\n  \\label{fig:${proposal.detail.split('/').pop()?.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-')}}\n\\end{figure}\n`;
        const updated = current.includes('\\end{document}') ? current.replace('\\end{document}', block + '\\end{document}') : current + block;
        await window.texpro.mcpCall(clientId.current, 'texpro_write_file', { path: relativeRoot, content: updated });
        update('figure', { status: 'done', detail: msg("app.figure.block.inserted.after.approval") });
      }
      setProposals((current) => current.map((item) => item.id === proposal.id ? { ...item, approved: true } : item));
      update('reviewer', { status: 'running', detail: msg("app.re.checking.the.paper.after.approval") });
      try {
        const check = JSON.parse(textOf(await window.texpro.mcpCall(clientId.current, 'texpro_diagnose', {})));
        update('reviewer', { status: 'done', detail: `${(check.issues || []).length} ${msg("app.issues.remain")}` });
      } catch { /* keep previous observation */ }
      setPhase('done');
      onApplied();
    } catch (failure) {
      setError(String(failure));
    } finally { setRunning(false); }
  };

  if (!open) return null;

  const update = (role: string, patch: Partial<CrewResult>) => {
    setResults((current) => {
      const found = current.find((item) => item.role === role);
      return found ? current.map((item) => item.role === role ? { ...item, ...patch } : item) : [...current, { role, status: 'idle', detail: '', ...patch }];
    });
  };

  const textOf = (result: unknown): string => {
    const content = (result as { content?: Array<{ type: string; text?: string }> })?.content;
    return content?.find((item) => item.type === 'text')?.text || JSON.stringify(result);
  };

  const run = async () => {
    if (!projectRoot || running) return;
    setRunning(true);
    setError('');
    const id = `crew-${Date.now()}`;
    try {
      update('compiler', { status: 'running', detail: msg("app.assembling.project.context") });
      const appInfo = await window.texpro.getInfo();
      const info = await window.texpro.mcpConnect(id, {
        command: 'node',
        args: [appInfo.mcpPath, '--project', projectRoot],
        cwd: projectRoot,
      });
      update('compiler', { status: 'done', detail: `${info.tools.length} ${msg("app.mcp.tools.online")}` });
      update('librarian', { status: 'running', detail: msg("app.reading.symbols.and.references") });
      const symbols = await window.texpro.mcpCall(id, 'texpro_project_symbols', {});
      const symbolText = textOf(symbols);
      let symbolCount = 0;
      let symbolData: { images?: Array<{ relative?: string; path?: string }> } = {};
      try { const parsed = JSON.parse(symbolText); symbolData = parsed; symbolCount = Array.isArray(parsed.labels) ? parsed.labels.length : 0; } catch { /* ignore */ }
      update('librarian', { status: 'done', detail: `${symbolCount} ${msg("app.labels.found")}` });
      update('figure', { status: 'running', detail: msg("app.inventorying.assets") });
      const assets = await window.texpro.mcpCall(id, 'texpro_list_assets', {});
      const assetsText = textOf(assets);
      let assetCount = 0;
      try { const parsed = JSON.parse(assetsText); assetCount = Array.isArray(parsed) ? parsed.length : Array.isArray(parsed.assets) ? parsed.assets.length : 0; } catch { /* ignore */ }
      update('figure', { status: 'done', detail: `${assetCount} ${msg("app.assets.found")}` });
      update('reviewer', { status: 'running', detail: msg("app.checking.labels.citations.and.includes") });
      const diagnosis = await window.texpro.mcpCall(id, 'texpro_diagnose', {});
      const diagnosisText = textOf(diagnosis);
      let issueCount = 0;
      try { const parsed = JSON.parse(diagnosisText); issueCount = Array.isArray(parsed.issues) ? parsed.issues.length : 0; } catch { /* ignore */ }
      update('reviewer', { status: issueCount ? 'failed' : 'done', detail: `${issueCount} ${msg("app.issues.found")}` });
      update('git', { status: 'running', detail: msg("app.reading.repository.state") });
      const git = await window.texpro.gitStatus(projectRoot);
      update('git', { status: 'done', detail: git.initialized ? `${git.branch} · ${git.changes.length} ${msg("app.changes")}` : msg("app.no.git.repository") });
      update('compiler', { status: 'running', detail: msg("app.autonomous.build.check") });
      let buildPassed = false;
      let buildPages = 0;
      try {
        const buildResult = await window.texpro.mcpCall(id, 'texpro_compile', {});
        const buildText = textOf(buildResult);
        const parsedBuild = JSON.parse(buildText);
        buildPassed = Boolean(parsedBuild.ok);
        buildPages = parsedBuild.pages || 0;
      } catch { /* build is advisory for the crew */ }
      update('compiler', { status: buildPassed ? 'done' : 'failed', detail: buildPassed ? `${msg("app.build.passed")} · ${buildPages} ${msg("app.pages.variant2")}` : msg("app.build.needs.attention") });
      clientId.current = id;
      const proposals: Array<{ id: string; title: string; detail: string; kind: 'figure' | 'git' }> = [];
      try {
        const assetsParsed = JSON.parse(assetsText);
        const assets = Array.isArray(assetsParsed) ? assetsParsed : assetsParsed.assets || [];
        const images = new Set((symbolData.images || []).map((image) => image.relative || image.path));
        const unreferenced = assets.find((asset: { relative?: string; path?: string }) => (asset.relative || asset.path) && !images.has(asset.relative || asset.path) && /\.(png|jpe?g|pdf)$/i.test(asset.relative || asset.path || ''));
        if (unreferenced) proposals.push({ id: 'figure', title: msg("app.insert.an.unreferenced.figure"), detail: unreferenced.relative || unreferenced.path, kind: 'figure' });
      } catch { /* ignore malformed assets */ }
      if (git.initialized && git.changes.length) proposals.push({ id: 'git', title: msg("app.commit.current.changes"), detail: msg("app.crew.inspected.the.project.and.left.it.unchanged"), kind: 'git' });
      setProposals(proposals);
      setPhase('review');
    } catch (failure) {
      setError(String(failure));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="crew-studio" data-testid="crew-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Users size={18} /></div>
            <div><span className="modal-eyebrow">{msg("app.orchestration")}</span><h2>{msg("app.mcp.crew")}</h2></div>
          </div>
          <div className="studio-header-actions">
            <span className={`studio-engine ${running ? '' : 'ok'}`}>{running ? <Loader2 size={11} className="spin" /> : <Check size={11} />}{running ? msg("app.working") : phase === 'review' ? msg("app.awaiting.review") : msg("app.ready")}</span>
            <button className="icon-btn" onClick={close}><X size={16} /></button>
          </div>
        </header>
        <div className="crew-body">
          <aside className="crew-roles">
            <div className="pane-label"><Users size={12} /> {msg("app.crew")}</div>
            {roles.map((role) => {
              const Icon = role.icon;
              const result = results.find((item) => item.role === role.id);
              return (
                <div key={role.id} className={`crew-role ${result?.status || 'idle'}`}>
                  <span className="crew-role-icon"><Icon size={15} /></span>
                  <div><strong>{msg.text(role.label)}</strong><small>{result?.detail || msg("app.waiting")}</small></div>
                  {result?.status === 'running' ? <Loader2 size={12} className="spin" /> : result?.status === 'done' ? <Check size={12} className="success-text" /> : null}
                </div>
              );
            })}
          </aside>
          <main className="crew-main">
            <div className="crew-intro">
              <span className="theater-kicker">{msg("app.one.project.several.specialists")} · {msg("app.round")} {phase === 'idle' ? '—' : '1'}</span>
              <h3>{msg("app.let.the.crew.inspect.the.paper")}</h3>
              <p>{msg("app.the.crew.calls.the.local.texpro.mcp.server.for")}</p>
            </div>
            <div className="crew-status">
              {results.length ? results.map((result) => <div key={result.role}><strong>{msg.text(roles.find((role) => role.id === result.role)?.label || result.role)}</strong><span>{result.detail}</span></div>) : <div className="crew-empty"><Terminal size={22} /><span>{msg("app.run.the.crew.to.collect.a.read.only.report")}</span></div>}
            </div>
            {proposals.length > 0 && (
              <div className="crew-proposals">
                <div className="pane-label">{msg("app.human.approval.required")}</div>
                {proposals.map((proposal) => (
                  <div key={proposal.id} className={`crew-proposal ${proposal.approved ? 'approved' : proposal.rejected ? 'rejected' : ''}`}>
                    <div><strong>{proposal.title}</strong><span>{proposal.detail}</span></div>
                    {proposal.approved ? <span className="crew-approved"><Check size={11} /> {msg("app.applied")}</span> : proposal.rejected ? <span className="crew-rejected">{msg("app.rejected")}</span> : (
                      <div className="crew-proposal-actions">
                        <button className="primary-btn" onClick={() => void approve(proposal)} disabled={running}>{msg("app.approve")}</button>
                        <button className="secondary-btn" onClick={() => setProposals((current) => current.map((item) => item.id === proposal.id ? { ...item, rejected: true } : item))}>{msg("app.reject")}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {error && <div className="ai-error">{error}</div>}
            <div className="crew-actions">
              <button className="primary-btn" onClick={() => void run()} disabled={running || !projectRoot}><Play size={12} /> {running ? msg("app.crew.is.working") : msg("app.run.crew")}</button>
              <button className="secondary-btn" onClick={onOpenBuildDetails}><Clapperboard size={12} /> {msg("app.open.build.details")}</button>
            </div>
          </main>
        </div>
        <footer className="studio-footer">
          <span className="studio-hint">{rootFile ? `${msg("app.root")}: ${rootFile.split('/').pop()}` : msg("app.open.a.project.first")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={close}>{msg("app.done")}</button>
        </footer>
      </section>
    </div>
  );
}
