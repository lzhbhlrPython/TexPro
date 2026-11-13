import { useEffect, useState } from 'react';
import { Check, Download, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import type { ReviewComment } from '../types';
import { basename } from '../lib/latex';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  comments: ReviewComment[];
  activeFile: string | null;
  currentLine: number;
  currentSnippet: string;
  onClose: () => void;
  onAdd: (text: string, line: number, snippet: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  onOpen: (comment: ReviewComment) => void;
}

export function CommentsPanel({ open, comments, activeFile, currentLine, currentSnippet, onClose, onAdd, onResolve, onDelete, onOpen }: Props) {
  const { msg } = useI18n();
  const [text, setText] = useState('');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    if (!open) setText('');
  }, [open]);

  if (!open) return null;
  const visible = comments.filter((comment) => showResolved || !comment.resolved);

  const exportReport = () => {
    const lines = ['# Review comments', '', `Generated: ${new Date().toLocaleString()}`, ''];
    for (const comment of comments) {
      lines.push(`## ${basename(comment.file)}:${comment.line}${comment.resolved ? ' (resolved)' : ''}`);
      if (comment.snippet) lines.push('', `> ${comment.snippet}`);
      lines.push('', comment.text, '');
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'review-comments.md';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="comments-studio" data-testid="comments-studio" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><MessageSquare size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.review")}</span>
              <h2>{msg("app.comments")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok">{comments.filter((comment) => !comment.resolved).length} {msg("app.open.variant2")}</span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="comments-body">
          <aside className="comments-list">
            <label className="chart-check comments-filter">
              <input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} /> {msg("app.show.resolved")}
            </label>
            {visible.map((comment) => (
              <div className={`comment-item ${comment.resolved ? 'resolved' : ''}`} key={comment.id}>
                <button className="comment-anchor" onClick={() => onOpen(comment)}>
                  <strong>{basename(comment.file)}:{comment.line}</strong>
                  <span>{comment.snippet}</span>
                </button>
                <p>{comment.text}</p>
                <div className="comment-actions">
                  <button onClick={() => onResolve(comment.id, !comment.resolved)} title={comment.resolved ? msg("app.reopen") : msg("app.resolve")}>
                    <Check size={11} /> {comment.resolved ? msg("app.reopen") : msg("app.resolve")}
                  </button>
                  <button onClick={() => onDelete(comment.id)} title={msg("app.delete")}><Trash2 size={11} /></button>
                </div>
              </div>
            ))}
            {!visible.length && <div className="panel-empty">{msg("app.no.comments.yet")}</div>}
          </aside>

          <div className="comment-compose">
            <div className="pane-label"><MessageSquare size={12} /> {msg("app.new.comment")}</div>
            <div className="comment-context">
              <strong>{activeFile ? basename(activeFile) : msg("app.no.file")}:{currentLine}</strong>
              <span>{currentSnippet || msg("app.current.line")}</span>
            </div>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={msg("app.write.a.review.comment")}
              spellCheck={false}
            />
            <button
              className="primary-btn"
              disabled={!text.trim() || !activeFile}
              onClick={() => {
                onAdd(text.trim(), currentLine, currentSnippet);
                setText('');
              }}
            >
              <Plus size={12} /> {msg("app.add.comment")}
            </button>
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.comments.are.stored.in.texpro.comments.json.and.never")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={exportReport} disabled={!comments.length}><Download size={12} /> {msg("app.export.report")}</button>
          <button className="primary-btn" onClick={onClose}>{msg("app.done")}</button>
        </footer>
      </section>
    </div>
  );
}
