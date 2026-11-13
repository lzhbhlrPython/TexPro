import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { relativePath } from '../lib/latex';
import { useI18n } from '../i18n';

export function WritingReviewBar({ root, file, saved, onCompare, onClose }: { root: string; file: string; saved: string; onCompare: (source: string, label: string) => void; onClose: () => void }) {
  const { msg } = useI18n();
  const [choices, setChoices] = useState<Array<{ id: string; label: string }>>([]);
  const [selected, setSelected] = useState('saved'), [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void window.texpro.gitStatus(root).then(async status => {
      const next = status.initialized ? (status.commits || []).map(commit => ({ id: `git:${commit.hash}`, label: `${commit.hash} · ${commit.subject}` })) : (await window.texpro.historyList(root)).filter(version => version.files.includes(relativePath(root, file))).map(version => ({ id: `history:${version.id}`, label: new Date(version.time).toLocaleString() }));
      if (!cancelled) setChoices(next);
    }).catch(() => { if (!cancelled) setError(msg("app.could.not.load.review.baselines")); });
    return () => { cancelled = true; };
  }, [root, file]);
  useEffect(() => {
    if (selected === 'saved') { onCompare(saved, msg("app.last.saved.version")); return; }
    let cancelled = false; setBusy(true); setError('');
    const [kind, id] = selected.split(':');
    const read = kind === 'git' ? window.texpro.gitReadFile(root, id, file) : window.texpro.historyRead(root, id, relativePath(root, file));
    void read.then(source => { if (!cancelled) onCompare(source, choices.find(choice => choice.id === selected)?.label || selected); }).catch(failure => { if (!cancelled) setError(`${msg("app.could.not.load.review.baseline")}: ${String(failure)}`); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [selected]);
  return <div className="writing-review-bar" role="region" aria-label={msg("app.review.in.writing")}>
    <label>{msg("app.compare.with")} <select aria-label={msg("app.compare.with")} value={selected} onChange={event => setSelected(event.target.value)} disabled={busy}><option value="saved">{msg("app.last.saved.version")}</option>{choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label>
    <span role="status">{busy ? msg("app.loading") : error || msg("app.restore.a.passage.with.one.undoable.edit")}</span>
    <button className="icon-btn" onClick={onClose} aria-label={msg("app.close.review")}><X size={14} /></button>
  </div>;
}
