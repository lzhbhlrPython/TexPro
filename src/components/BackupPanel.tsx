import { useDialogFocus } from '../hooks/useDialogFocus';
import { useState, useRef } from 'react';
import { Cloud, CloudUpload, FileCode2, HardDrive, Image, KeyRound, MessageSquare, Server, X } from 'lucide-react';
import { useI18n } from '../i18n';

type BackupType = 'icloud' | 'webdav' | 'ssh';

interface Props {
  open: boolean;
  projectRoot: string | null;
  onClose: () => void;
  onReveal: (path: string) => void;
}

export function BackupPanel({ open, projectRoot, onClose, onReveal }: Props) {
  const { msg } = useI18n();
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocus(open, dialogRef, onClose);
  const [type, setType] = useState<BackupType>('icloud');
  const [destination, setDestination] = useState('~/Library/Mobile Documents/com~apple~CloudDocs/TeXPro Backups');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [host, setHost] = useState('');
  const [user, setUser] = useState('');
  const [remotePath, setRemotePath] = useState('~/TeXPro-Backups');
  const [port, setPort] = useState('22');
  const [keyPath, setKeyPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  if (!open) return null;

  const run = async () => {
    if (!projectRoot || busy) return;
    setBusy(true);
    setError('');
    setResult('');
    try {
      const next = await window.texpro.backupProject(projectRoot, {
        type,
        destination: destination || undefined,
        url: type === 'webdav' ? url : undefined,
        username: type === 'webdav' ? username : undefined,
        password: type === 'webdav' ? password : undefined,
        host: type === 'ssh' ? host : undefined,
        user: type === 'ssh' ? user : undefined,
        remotePath: type === 'ssh' ? remotePath : undefined,
        port: type === 'ssh' ? port : undefined,
        keyPath: type === 'ssh' ? keyPath : undefined,
      });
      setResult(next.target);
    } catch (failure) {
      setError(String(failure));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="backup-studio-title" tabIndex={-1} className="backup-studio" data-testid="backup-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><CloudUpload size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.safety")}</span>
              <h2 id="backup-studio-title">{msg("app.project.backup")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok">{msg("app.source.assets")}</span>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="backup-body">
          <div className="backup-types">
            {([
              ['icloud', Cloud, 'iCloud Drive'],
              ['webdav', HardDrive, 'WebDAV'],
              ['ssh', Server, 'SSH / SCP'],
            ] as const).map(([id, Icon, label]) => (
              <button key={id} className={type === id ? 'active' : ''} onClick={() => setType(id)}>
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="backup-form">
            {type === 'icloud' && (
              <label className="workshop-field"><span>{msg("app.destination.folder")}</span><input value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="~/Library/Mobile Documents/com~apple~CloudDocs/TeXPro Backups" /></label>
            )}
            {type === 'webdav' && (
              <>
                <label className="workshop-field"><span>{msg("app.webdav.url")}</span><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/remote.php/dav/files/me/paper.zip" /></label>
                <div className="workshop-grid">
                  <label className="workshop-field"><span>{msg("app.username")}</span><input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
                  <label className="workshop-field"><span>{msg("app.password")}</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                </div>
              </>
            )}
            {type === 'ssh' && (
              <>
                <div className="workshop-grid">
                  <label className="workshop-field"><span>{msg("app.host")}</span><input value={host} onChange={(event) => setHost(event.target.value)} placeholder="mac-mini.local" /></label>
                  <label className="workshop-field"><span>{msg("app.user")}</span><input value={user} onChange={(event) => setUser(event.target.value)} placeholder="me" /></label>
                  <label className="workshop-field"><span>{msg("app.port")}</span><input value={port} onChange={(event) => setPort(event.target.value)} /></label>
                  <label className="workshop-field"><span>{msg("app.remote.path")}</span><input value={remotePath} onChange={(event) => setRemotePath(event.target.value)} /></label>
                </div>
                <label className="workshop-field"><span>{msg("app.ssh.key.path.optional")}</span><input value={keyPath} onChange={(event) => setKeyPath(event.target.value)} placeholder="~/.ssh/id_ed25519" /></label>
              </>
            )}
            <p className="backup-hint"><KeyRound size={11} /> {msg("app.webdav.passwords.and.ssh.keys.are.used.for.this")}</p>
            <div className="backup-included">
              <div><FileCode2 size={13} /><span>{msg("app.sources.bib.and.project.config")}</span></div>
              <div><Image size={13} /><span>{msg("app.assets.and.figures")}</span></div>
              <div><MessageSquare size={13} /><span>{msg("app.review.comments")}</span></div>
            </div>
            <div className="backup-steps">
              <div><b>1</b><span>{msg("app.pack.sources.and.assets.into.a.timestamped.zip")}</span></div>
              <div><b>2</b><span>{msg("app.upload.to.the.selected.destination")}</span></div>
              <div><b>3</b><span>{msg("app.keep.build.and.history.caches.out.of.the.archive")}</span></div>
            </div>
            {error && <div className="ai-error">{error}</div>}
            {result && (
              <div className="backup-result">
                <strong>{msg("app.backup.complete")}</strong>
                <code>{result}</code>
                {type === 'icloud' && <button className="secondary-btn" onClick={() => onReveal(result)}>{msg("app.reveal")}</button>}
              </div>
            )}
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.backups.include.sources.assets.bib.files.project.config.and")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.cancel")}</button>
          <button className="primary-btn" onClick={() => void run()} disabled={!projectRoot || busy}><CloudUpload size={12} /> {busy ? msg("app.uploading") : msg("app.back.up.now")}</button>
        </footer>
      </section>
    </div>
  );
}
