import { useEffect, useRef, useState } from 'react';
import { Bot, Check, Loader2, Settings2, Sparkles, X } from 'lucide-react';
import { aiChatStream, parseAgentActions, type AgentAction, type AiSettings } from '../lib/ai';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  settings: AiSettings;
  compileError: string;
  defaultContext: string;
  selection: string;
  onClose: () => void;
  onInsert: (text: string) => void;
  onOpenSettings: () => void;
  onApplyAction: (action: AgentAction) => void;
}

type Task = 'explain' | 'rewrite' | 'translate-zh' | 'translate-en' | 'formula' | 'agent';

const tasks: Array<{ id: Task; label: string; system: string }> = [
  {
    id: 'explain',
    label: "app.explain.compile.error",
    system: 'You are a LaTeX debugging assistant. Explain the error concisely in the user language, identify the likely cause, and give a minimal corrected snippet. Do not invent file contents.',
  },
  {
    id: 'rewrite',
    label: "app.rewrite.clearly",
    system: 'Rewrite the supplied LaTeX prose to be clearer and more concise while preserving all LaTeX commands, citations, labels, and math. Return only the rewritten LaTeX.',
  },
  {
    id: 'translate-zh',
    label: "app.translate.to.chinese",
    system: 'Translate the supplied LaTeX prose to natural academic Chinese. Preserve all LaTeX commands, citations, labels and math exactly. Return only the translated LaTeX.',
  },
  {
    id: 'translate-en',
    label: "app.translate.to.english",
    system: 'Translate the supplied LaTeX prose to natural academic English. Preserve all LaTeX commands, citations, labels and math exactly. Return only the translated LaTeX.',
  },
  {
    id: 'formula',
    label: "app.latex.from.description",
    system: 'Convert the user description into a single LaTeX math expression. Return only the LaTeX math, without dollar signs or explanation.',
  },
  {
    id: 'agent',
    label: "app.agent.actions",
    system: 'You are a controlled LaTeX editing agent. Return ONLY valid JSON: {"actions":[{"type":"insert|replace-selection|replace-document","text":"...","reason":"..."}]}. Never output prose outside JSON. Only propose changes directly supported by the user request. Keep existing LaTeX commands unless asked to rewrite them.',
  },
];

export function AIAssistant({ open, settings, compileError, defaultContext, selection, onClose, onInsert, onOpenSettings, onApplyAction }: Props) {
  const { msg } = useI18n();
  const [task, setTask] = useState<Task>('rewrite');
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [applied, setApplied] = useState<number[]>([]);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    setOutput('');
    setError('');
    setActions([]);
    setApplied([]);
    setContext(task === 'explain' ? compileError : task === 'agent' ? selection : defaultContext);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (task === 'explain') setContext(compileError);
    if (task === 'agent') setContext(selection || defaultContext);
  }, [task, open, compileError, selection, defaultContext]);

  useEffect(() => () => controller.current?.abort(), []);

  if (!open) return null;

  const run = async () => {
    const definition = tasks.find((item) => item.id === task) || tasks[0];
    setBusy(true);
    setError('');
    setOutput('');
    setActions([]);
    setApplied([]);
    const nextController = new AbortController();
    controller.current = nextController;
    try {
      const full = await aiChatStream(
        settings,
        definition.system,
        context.trim() || msg("app.no.context.provided"),
        (_delta, complete) => setOutput(complete),
        nextController.signal,
      );
      if (task === 'agent') {
        const parsed = parseAgentActions(full);
        setActions(parsed);
        if (!parsed.length) setError(msg("app.the.model.did.not.return.valid.agent.actions"));
      }
    } catch (failure) {
      if ((failure as Error)?.name !== 'AbortError') setError(String(failure));
    } finally {
      setBusy(false);
      controller.current = null;
    }
  };

  const configured = settings.enabled && Boolean(settings.apiKey.trim());

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="ai-studio" data-testid="ai-assistant" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Bot size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.optional")}</span>
              <h2>{msg("app.ai.assistant")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className={`studio-engine ${configured ? 'ok' : ''}`}><Sparkles size={11} /> {configured ? settings.model : msg("app.not.configured")}</span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        {!configured ? (
          <div className="ai-setup">
            <Sparkles size={30} />
            <h3>{msg("app.use.your.own.model.provider")}</h3>
            <p>{msg("app.ai.is.off.by.default.add.an.openai.compatible")}</p>
            <button className="primary-btn" onClick={() => { onClose(); onOpenSettings(); }}><Settings2 size={13} /> {msg("app.open.settings.variant2")}</button>
          </div>
        ) : (
          <div className="ai-body">
            <div className="ai-tasks">
              {tasks.map((item) => (
                <button key={item.id} className={`ai-task ${task === item.id ? 'active' : ''}`} onClick={() => setTask(item.id)}>
                  {msg.text(item.label)}
                </button>
              ))}
              <p className="ai-privacy">{msg("app.only.the.text.in.the.box.below.is.sent")}</p>
            </div>
            <div className="ai-work">
              <label className="ai-context-label">
                <span>{msg("app.context")}</span>
                <textarea value={context} onChange={(event) => setContext(event.target.value)} spellCheck={false} />
              </label>
              <div className="ai-actions">
                <button className="primary-btn" onClick={() => void run()} disabled={busy}>
                  {busy ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />} {msg("app.run.variant2")}
                </button>
                {busy && <button className="secondary-btn" onClick={() => controller.current?.abort()}>{msg("app.stop")}</button>}
                {output && !busy && task !== 'agent' && (
                  <button className="secondary-btn" onClick={() => { onInsert(output); onClose(); }}>
                    <Check size={12} /> {msg("app.insert.result")}
                  </button>
                )}
              </div>
              {error && <div className="ai-error">{error}</div>}
              {actions.length > 0 && (
                <div className="ai-actions-list">
                  {actions.map((action, index) => (
                    <div className="ai-action-card" key={index}>
                      <div className="ai-action-head">
                        <strong>{msg.text(action.type)}</strong>
                        {action.reason && <span>{action.reason}</span>}
                      </div>
                      <pre>{action.text}</pre>
                      <button
                        className="secondary-btn"
                        disabled={applied.includes(index)}
                        onClick={() => { onApplyAction(action); setApplied((current) => [...current, index]); }}
                      >
                        {applied.includes(index) ? <Check size={12} /> : null} {applied.includes(index) ? msg("app.applied") : msg("app.apply.action")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="ai-output">
                {output || <span className="ai-placeholder">{msg("app.the.result.will.appear.here")}</span>}
              </div>
            </div>
          </div>
        )}

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.ai.is.optional.and.never.runs.automatically")}</span>
          <div className="spacer" />
          <button className="primary-btn" onClick={onClose}>{msg("app.done")}</button>
        </footer>
      </section>
    </div>
  );
}
