import { useEffect, useRef, useState } from 'react';
import { TexArtwork } from './TexArtwork';
import {
  Code2,
  Loader2,
  PenTool,
  Play,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { TexSourceEditor } from './TexSourceEditor';
import { TexVisualEditor } from './TexVisualEditor';
import { ScorePreview } from '../editor/MusicBlock';
import { useDiagramPreview } from '../hooks/useDiagramPreview';
import { useDialogFocus } from '../hooks/useDialogFocus';
import type { Engine } from '../types';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  projectRoot: string | null;
  filePath: string | null;
  initialSource: string | null;
  kind?: 'diagram' | 'music';
  preamble?: string;
  engine?: Engine;
  onClose: () => void;
  onInsert: (source: string) => void;
}

const templates = [
  {
    id: 'axes',
    name: "app.function.plot",
    source: String.raw`\begin{tikzpicture}[scale=1.1]
  \draw[->] (-0.2,0) -- (4.4,0) node[right] {$x$};
  \draw[->] (0,-0.2) -- (0,3.4) node[above] {$y$};
  \draw[thick,blue,domain=0:4,smooth,samples=80]
    plot (\x,{0.55*\x + 0.35*sin(2*\x r)});
  \filldraw[orange] (2,1.36) circle (2pt) node[above right] {$P$};
\end{tikzpicture}`,
  },
  {
    id: 'flow',
    name: "app.flowchart",
    source: String.raw`\begin{tikzpicture}[
  node distance=1.5cm,
  box/.style={draw,rounded corners,fill=blue!8,minimum width=2.8cm,minimum height=0.9cm},
  arrow/.style={-{Latex[length=2mm]},thick}
]
  \node[box] (a) {Draft};
  \node[box,right=of a] (b) {Review};
  \node[box,below=of b] (c) {Publish};
  \draw[arrow] (a) -- (b);
  \draw[arrow] (b) -- (c);
  \draw[arrow] (c.west) -| (a.south);
\end{tikzpicture}`,
  },
  {
    id: 'geometry',
    name: "app.geometry",
    source: String.raw`\begin{tikzpicture}[scale=1.2]
  \coordinate (A) at (0,0);
  \coordinate (B) at (4,0);
  \coordinate (C) at (1.4,2.6);
  \draw[thick] (A) -- (B) -- (C) -- cycle;
  \draw (A) -- (C);
  \filldraw[orange] (A) circle (1.5pt) node[below left] {$A$};
  \filldraw[orange] (B) circle (1.5pt) node[below right] {$B$};
  \filldraw[orange] (C) circle (1.5pt) node[above] {$C$};
  \node at (2.3,-0.3) {$c$};
\end{tikzpicture}`,
  },
];

export function TikzStudio({ open, projectRoot, filePath, initialSource, kind = 'diagram', preamble, engine, onClose, onInsert }: Props) {
  const { msg } = useI18n();
  const [source, setSource] = useState(templates[0].source);
  const [sourceMode, setSourceMode] = useState(false);
  const [musicRefresh, setMusicRefresh] = useState(0);
  const { preview, error, busy, retry } = useDiagramPreview(open && kind === 'diagram', projectRoot, filePath, source, preamble, engine);
  const sectionRef = useRef<HTMLElement>(null);
  useDialogFocus(open, sectionRef, onClose);
  const textareaRef = useRef<{ focus: () => void } | null>(null);

  useEffect(() => {
    if (!open) return;
    setSource(initialSource || templates[0].source);
    setSourceMode(false);
  }, [open, initialSource]);

  if (!open) return null;
  const title = msg(kind === 'music' ? 'writing.studio.music' : 'app.diagram.studio');
  const sourceLabel = msg(kind === 'music' ? 'app.edit.tex.source' : 'app.diagram.source');
  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section ref={sectionRef} role="dialog" aria-modal="true" aria-label={title} className="tikz-studio" data-testid="tikz-studio" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><PenTool size={18} /></div>
            <div>
              <span className="modal-eyebrow">{title}</span>
              <h2>{title}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <button className="secondary-btn" onClick={() => setSourceMode(value => !value)}>{msg(sourceMode ? "writing.studio.visual.mode" : "writing.studio.source.mode")}</button>
            <span className={`studio-engine ${error ? 'failed' : preview ? 'ok' : ''}`}>
              {busy ? <Loader2 size={11} className="spin" /> : null}
              {error ? msg("app.error") : engine || 'TeX'}
            </span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="tikz-body">
          <div className="tikz-editor-pane">
            <div className="pane-label"><Code2 size={12} /> {sourceMode ? sourceLabel : msg("writing.studio.visual.mode")}</div>
            <div className="studio-source-mode" hidden={!sourceMode}><TexSourceEditor ref={textareaRef} className="tikz-source" value={source} onChange={setSource} label={sourceLabel} /></div>
            {!sourceMode && <TexVisualEditor source={source} onChange={setSource} />}
            {kind === 'diagram' && <div className="tikz-template-row">
              <span><Sparkles size={11} /> {msg("app.templates")}</span>
              {templates.map((item) => (
                <button key={item.id} onClick={() => setSource(item.source)}>{msg.text(item.name)}</button>
              ))}
            </div>}
          </div>

          <div className="tikz-preview-pane">
            <div className="pane-label">
              <Play size={12} /> {msg("app.preview")}
              <button className="mini-refresh" onClick={kind === 'music' ? () => setMusicRefresh(value => value + 1) : retry} title={msg("app.refresh")}>
                <RefreshCw size={11} />
              </button>
            </div>
            <div className="tikz-preview">
              {kind === 'music' && projectRoot && <ScorePreview preamble={preamble} engine={engine} root={projectRoot} source={source} refresh={musicRefresh} onSource={() => { setSourceMode(true); requestAnimationFrame(() => textareaRef.current?.focus()); }} onMeasure={() => {}} />}
              {busy && !preview && (
                <div className="tikz-placeholder"><Loader2 size={18} className="spin" /> {msg("app.typesetting.diagram")}</div>
              )}
              {kind === 'diagram' && !busy && !preview && !error && (
                <div className="tikz-placeholder">{msg("app.preview.will.appear.here")}</div>
              )}
              {preview && <TexArtwork src={preview} alt="TikZ preview" />}
              {error && (
                <div className="tikz-error-box">
                  <strong>{msg("app.could.not.render.this.diagram")}</strong>
                  <p>{error}</p>
                </div>
              )}
            </div>

            {sourceMode && <TexVisualEditor source={source} onChange={setSource} />}
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("writing.studio.preview.hint")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.cancel")}</button>
          <button
            className="primary-btn"
            disabled={!source.trim()}
            onClick={() => {
              onInsert(source);
              onClose();
            }}
          >
            <PenTool size={13} /> {msg(initialSource ? "writing.studio.apply" : "app.insert.diagram")}
          </button>
        </footer>
      </section>
    </div>
  );
}
