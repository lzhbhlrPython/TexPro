import { useEffect, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, GitBranch, GitCommitHorizontal, Loader2, RefreshCw, Upload, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface GitStatus {
  initialized: boolean;
  branch: string;
  changes: Array<{ status: string; file: string }>;
  ahead: number;
  behind: number;
  commits: Array<{ hash: string; subject: string }>;
}

interface Props {
  open: boolean;
  projectRoot: string | null;
  onClose: () => void;
  onOpenProject: (path: string) => void;
  onGitChange?: (managed: boolean) => void;
}

export function GitPanel({ open, projectRoot, onClose, onOpenProject, onGitChange }: Props) {
  const { msg } = useI18n();
  const [status, setStatus] = useState<GitStatus | null>(null);
  const changes = status?.changes || [];
  const commits = status?.commits || [];
  const [message, setMessage] = useState('Update from TeXPro');
  const [overleaf, setOverleaf] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!projectRoot) return;
    try {
      const next = await window.texpro.gitStatus(projectRoot);
      setStatus(next);
      onGitChange?.(next.initialized);
    } catch (error) {
      setNotice(String(error));
    }
  };

  useEffect(() => { if (open) void load(); }, [open, projectRoot]);

  const run = async (action: 'init' | 'commit' | 'pull' | 'push') => {
    if (!projectRoot || busy) return;
    setBusy(true);
    setNotice('');
    try {
      if (action === 'init') await window.texpro.gitInit(projectRoot);
      if (action === 'commit') await window.texpro.gitCommit(projectRoot, message);
      if (action === 'pull') await window.texpro.gitPull(projectRoot);
      if (action === 'push') await window.texpro.gitPush(projectRoot);
      await load();
      setNotice(msg(action === 'init' ? "app.repository.initialized" : action === 'commit' ? "app.committed" : action === 'pull' ? "app.pulled" : "app.pushed"));
    } catch (error) {
      setNotice(String(error));
    } finally {
      setBusy(false);
    }
  };

  const clone = async () => {
    if (!overleaf.trim() || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const project = await window.texpro.overleafClone(overleaf.trim());
      onOpenProject(project.path);
      onClose();
    } catch (error) {
      setNotice(String(error));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="git-studio" data-testid="git-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><GitBranch size={18} /></div>
            <div><span className="modal-eyebrow">{msg("app.integration")}</span><h2>{msg("app.version.control")}</h2></div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok">{status?.initialized ? status.branch || 'git' : msg("app.not.a.repository")}</span>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button>
          </div>
        </header>
        <div className="git-body">
          <aside className="git-side">
            <div className="pane-label"><GitBranch size={12} /> {msg("app.repository")}</div>
            {!status?.initialized ? (
              <button className="primary-btn" onClick={() => void run('init')} disabled={busy}><GitBranch size={12} /> {msg("app.initialize.git")}</button>
            ) : (
              <>
                <div className="git-branch"><GitBranch size={12} /><strong>{status.branch}</strong>{status.ahead > 0 && <span>↑{status.ahead}</span>}{status.behind > 0 && <span>↓{status.behind}</span>}</div>
                <input className="collab-input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder={msg("app.commit.message")} />
                <button className="primary-btn" onClick={() => void run('commit')} disabled={busy || !message.trim()}><GitCommitHorizontal size={12} /> {msg("app.commit.all")}</button>
                <div className="git-row">
                  <button className="secondary-btn" onClick={() => void run('pull')} disabled={busy}><ArrowDownToLine size={12} /> {msg("app.pull")}</button>
                  <button className="secondary-btn" onClick={() => void run('push')} disabled={busy}><ArrowUpFromLine size={12} /> {msg("app.push")}</button>
                </div>
              </>
            )}
            <button className="secondary-btn" onClick={() => void load()} disabled={busy}><RefreshCw size={12} /> {msg("app.refresh")}</button>
            <div className="pane-label git-overleaf"><Upload size={12} /> {msg("app.import.from.overleaf")}</div>
            <input className="collab-input" value={overleaf} onChange={(event) => setOverleaf(event.target.value)} placeholder="https://git.overleaf.com/…" />
            <button className="secondary-btn" onClick={() => void clone()} disabled={busy || !overleaf.trim()}><ArrowDownToLine size={12} /> {msg("app.clone.overleaf.project")}</button>
            <p className="schematic-hint">{msg("app.overleaf.clones.into.documents.texpro.projects.push.and.pull")}</p>
          </aside>
          <main className="git-main">
            <div className="pane-label"><Check size={12} /> {msg("app.working.tree")}<span className="pane-hint">{changes.length || 0}</span></div>
            <div className="git-changes">
              {changes.length ? changes.map((change) => (
                <div key={change.file} className="git-change"><span className={`git-status ${change.status}`}>{change.status}</span><code>{change.file}</code></div>
              )) : <div className="git-empty">{msg("app.working.tree.is.clean")}</div>}
            </div>
            <div className="pane-label"><GitCommitHorizontal size={12} /> {msg("app.recent.commits")}</div>
            <div className="git-commits">
              {commits.length ? commits.map((commit) => (
                <div key={commit.hash}><code>{commit.hash}</code><span>{commit.subject}</span></div>
              )) : <div className="git-empty">{msg("app.no.commits.yet")}</div>}
            </div>
            {notice && <div className="collab-notice">{notice}</div>}
          </main>
        </div>
        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.git.operations.run.in.the.project.folder.texpro.never")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.done")}</button>
        </footer>
      </section>
    </div>
  );
}
