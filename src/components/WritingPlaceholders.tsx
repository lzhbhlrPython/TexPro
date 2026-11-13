import { useState } from 'react';
import { Plus, SquareDashed } from 'lucide-react';
import { useI18n } from '../i18n';
import { placeholderKinds, type WritingPlaceholder, type PlaceholderKind } from '../../electron/services/writing-aids-core.mjs';

export const placeholderLabel: Record<PlaceholderKind, string> = { text: "app.text.placeholder", figure: "app.figure.placeholder", table: "app.table.placeholder", citation: "app.citation.placeholder", data: "app.data.placeholder" };

export function WritingPlaceholders({ items, onOpen, onInsert }: { items: WritingPlaceholder[]; onOpen: (item: WritingPlaceholder) => void; onInsert: (kind: PlaceholderKind) => void }) {
  const { msg } = useI18n();
  const [kind, setKind] = useState<PlaceholderKind>('text');
  return <section className="writing-aids-panel" aria-label={msg("app.placeholders")}>
    <div className="panel-heading"><span>{msg("app.placeholders")} <small>{items.length}</small></span></div>
    <div className="placeholder-insert"><select aria-label={msg("app.placeholder.type")} value={kind} onChange={event => setKind(event.target.value as PlaceholderKind)}>{placeholderKinds.map(value => <option key={value} value={value}>{msg.text(placeholderLabel[value])}</option>)}</select><button className="mini-btn" onClick={() => onInsert(kind)} aria-label={msg("app.insert.placeholder")} title={msg("app.insert.placeholder")}><Plus size={14} /></button></div>
    <p className="writing-aids-hint">{msg("app.keep.writing.now.replace.these.before.submission.f4.moves")}</p>
    {!items.length && <div className="panel-empty">{msg("app.no.placeholders.left.your.draft.has.no.unfinished.slots")}</div>}
    <div className="writing-placeholders">{items.map(item => <button key={`${item.file}:${item.from}`} className="writing-placeholder-row" onClick={() => onOpen(item)} title={msg("app.select.placeholder.to.replace.it.in.the.editor")}><SquareDashed size={15} /><span><small>{msg.text(placeholderLabel[item.kind])}</small><span>{!item.text || item.text === 'TODO' ? msg("app.describe.what.belongs.here") : item.text}</span><small>{item.file.split(/[\\/]/).pop()}:{item.line}</small></span></button>)}</div>
  </section>;
}
