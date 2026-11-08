import { useState } from 'react';
import { Plus, SquareDashed } from 'lucide-react';
import { useI18n } from '../i18n';
import { placeholderKinds, type WritingPlaceholder, type PlaceholderKind } from '../../electron/services/writing-aids-core.mjs';

export const placeholderLabel: Record<PlaceholderKind, string> = { text: 'Text placeholder', figure: 'Figure placeholder', table: 'Table placeholder', citation: 'Citation placeholder', data: 'Data placeholder' };

export function WritingPlaceholders({ items, onOpen, onInsert }: { items: WritingPlaceholder[]; onOpen: (item: WritingPlaceholder) => void; onInsert: (kind: PlaceholderKind) => void }) {
  const { t } = useI18n();
  const [kind, setKind] = useState<PlaceholderKind>('text');
  return <section className="writing-aids-panel" aria-label={t('Placeholders')}>
    <div className="panel-heading"><span>{t('Placeholders')} <small>{items.length}</small></span></div>
    <div className="placeholder-insert"><select aria-label={t('Placeholder type')} value={kind} onChange={event => setKind(event.target.value as PlaceholderKind)}>{placeholderKinds.map(value => <option key={value} value={value}>{t(placeholderLabel[value])}</option>)}</select><button className="mini-btn" onClick={() => onInsert(kind)} aria-label={t('Insert placeholder')} title={t('Insert placeholder')}><Plus size={14} /></button></div>
    <p className="writing-aids-hint">{t('Keep writing now. Replace these before submission. F4 moves to the next placeholder.')}</p>
    {!items.length && <div className="panel-empty">{t('No placeholders left. Your draft has no unfinished slots.')}</div>}
    <div className="writing-placeholders">{items.map(item => <button key={`${item.file}:${item.from}`} className="writing-placeholder-row" onClick={() => onOpen(item)} title={t('Select placeholder to replace it in the editor')}><SquareDashed size={15} /><span><small>{t(placeholderLabel[item.kind])}</small><span>{!item.text || item.text === 'TODO' ? t('Describe what belongs here') : item.text}</span><small>{item.file.split(/[\\/]/).pop()}:{item.line}</small></span></button>)}</div>
  </section>;
}
