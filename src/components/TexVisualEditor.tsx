import { useEffect, useMemo, useState } from 'react';
import { applyTexVisualField, texVisualFields, type TexVisualField } from '../lib/texVisualEdits';
import { useI18n } from '../i18n';

function LiteralInput({ field, source, onChange }: { field: TexVisualField; source: string; onChange: (source: string) => void }) {
  const [draft, setDraft] = useState(field.value);
  useEffect(() => setDraft(field.value), [field.value]);
  return <input type="text" inputMode={field.kind === 'expression' ? 'text' : 'decimal'} value={draft} onChange={event => {
    setDraft(event.target.value);
    const next = applyTexVisualField(source, field, event.target.value);
    if (next !== null) onChange(next);
  }} onBlur={() => setDraft(field.value)} />;
}

/** Visual controls patch only understood literals; all surrounding TeX stays intact. */
export function TexVisualEditor({ source, onChange }: { source: string; onChange: (source: string) => void }) {
  const { msg } = useI18n();
  const fields = useMemo(() => texVisualFields(source), [source]);
  return <div className="tex-visual-editor">
    <p className="studio-hint">{msg(fields.length ? 'writing.studio.visual.fields' : 'writing.studio.visual.unavailable')}</p>
    {fields.map((field, index) => <label className="workshop-field" data-tex-command={field.command} key={`${field.command}-${index}`}>
      <span>{`\\${field.command} · ${index + 1} · ${field.axis || msg(field.kind === 'pitch' ? 'app.pitch' : 'app.value')}`}</span>
      {field.kind === 'pitch' ? <select value={field.value} onChange={event => { const next = applyTexVisualField(source, field, event.target.value); if (next !== null) onChange(next); }}>
        {[...'abcdefghijklmnABCDEFGHIJKLMN'].map(pitch => <option key={pitch}>{pitch}</option>)}
      </select> : <LiteralInput field={field} source={source} onChange={onChange} />}
    </label>)}
  </div>;
}
