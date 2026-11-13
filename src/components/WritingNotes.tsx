import { Check, Circle, Plus } from 'lucide-react';
import type { WritingNote } from '../lib/writingNotes';
import { useI18n } from '../i18n';

export function WritingNotes({ notes, onOpen, onToggle, onInsert }: { notes: WritingNote[]; onOpen: (note: WritingNote) => void; onToggle: (note: WritingNote) => void; onInsert: () => void }) {
  const { msg } = useI18n();
  return <>
    <div className="panel-heading"><span>{msg("app.revision.memos")} <small>{notes.filter(note => !note.done).length}</small></span><button className="mini-btn" onClick={onInsert} title={msg("app.leave.a.revision.memo")} aria-label={msg("app.leave.a.revision.memo")}><Plus size={13} /></button></div>
    <p className="writing-aids-hint">{msg("app.leave.the.next.step.beside.your.paragraph.memos.stay")}</p>
    {!notes.length && <div className="panel-empty">{msg("app.what.should.you.revise.next.leave.a.memo.where")}</div>}
    <div className="writing-notes">{[...notes].sort((a, b) => Number(a.done) - Number(b.done)).map(note => <div className={`writing-note ${note.done ? 'done' : ''}`} key={`${note.file}:${note.line}`}>
      <button onClick={() => onToggle(note)} title={msg(note.done ? "app.reopen.memo" : "app.complete.memo")} aria-label={msg(note.done ? "app.reopen.memo" : "app.complete.memo")}>{note.done ? <Check size={15} /> : <Circle size={15} />}</button>
      <button onClick={() => onOpen(note)}><span>{note.text || msg("app.unfinished.thought")}</span><small>{note.file.split(/[\\/]/).pop()}:{note.line}</small></button>
    </div>)}</div>
  </>;
}
