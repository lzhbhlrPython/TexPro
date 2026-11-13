import { useEffect, useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { useI18n } from '../i18n';

export interface ElicitationPayload {
  id: number;
  request: {
    message?: string;
    requestedSchema?: {
      type?: string;
      properties?: Record<string, { type?: string; title?: string; description?: string; enum?: string[]; default?: unknown }>;
      required?: string[];
    };
  };
}

interface Props {
  payload: ElicitationPayload | null;
  onRespond: (result: { action: 'accept' | 'decline' | 'cancel'; content?: Record<string, unknown> }) => void;
}

export function McpElicitation({ payload, onRespond }: Props) {
  const { msg } = useI18n();
  const schema = payload?.request.requestedSchema;
  const [values, setValues] = useState<Record<string, unknown>>({});
  useEffect(() => { setValues({}); }, [payload?.id]);
  if (!payload) return null;
  const properties = schema?.properties || {};
  const required = schema?.required || [];

  const field = (name: string, definition: NonNullable<typeof properties[string]>) => {
    const value = values[name] ?? definition.default ?? '';
    if (definition.enum) {
      return (
        <select value={String(value)} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}>
          {definition.enum.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    if (definition.type === 'boolean') {
      return <input type="checkbox" checked={Boolean(value)} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.checked }))} />;
    }
    if (definition.type === 'number' || definition.type === 'integer') {
      return <input type="number" value={String(value)} onChange={(event) => setValues((current) => ({ ...current, [name]: Number(event.target.value) }))} />;
    }
    if (definition.type === 'string' && (definition.description || '').length > 60) {
      return <textarea value={String(value)} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} />;
    }
    return <input value={String(value)} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} />;
  };

  return (
    <div className="modal-scrim" onMouseDown={() => onRespond({ action: 'decline' })}>
      <section className="elicitation-dialog" data-testid="mcp-elicitation" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><MessageSquare size={17} /></div>
            <div><span className="modal-eyebrow">{msg("app.mcp.request")}</span><h2>{msg("app.the.mcp.server.needs.input")}</h2></div>
          </div>
          <button className="icon-btn" onClick={() => onRespond({ action: 'decline' })}><X size={16} /></button>
        </header>
        <div className="elicitation-body">
          <p>{payload.request.message || msg("app.an.mcp.server.is.requesting.information")}</p>
          {Object.entries(properties).map(([name, definition]) => (
            <label key={name} className="workshop-field">
              <span>{definition.title || name}{required.includes(name) ? ' *' : ''}</span>
              {field(name, definition)}
              {definition.description && <small>{definition.description}</small>}
            </label>
          ))}
        </div>
        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.only.accept.if.you.trust.the.connected.mcp.server")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={() => onRespond({ action: 'decline' })}>{msg("app.decline")}</button>
          <button className="primary-btn" onClick={() => onRespond({ action: 'accept', content: values })}>{msg("app.accept")}</button>
        </footer>
      </section>
    </div>
  );
}
