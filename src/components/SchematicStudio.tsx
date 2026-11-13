import { WorkspaceFrame } from './WorkspaceFrame';
import { configs, generateSchematic, nextId, nodeLabel, restoreSchematic, type SchematicNode, type SchematicEdge } from '../lib/schematic';
import type { SchematicMode } from '../lib/schematic';
import { TexArtwork } from './TexArtwork';
export type { SchematicMode } from '../lib/schematic';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlignJustify, ArrowDownToLine, Atom, Battery, CircuitBoard, Cpu, FlaskConical,
  Gauge, GitBranch, Hexagon, Lightbulb, Loader2, LogIn, LogOut, Minus, Plus, Redo2,
  Copy, Check, Search, RotateCcw, ToggleLeft, Trash2, Undo2, Waves, X, Zap,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { useDiagramPreview } from '../hooks/useDiagramPreview';
import { useDialogFocus } from '../hooks/useDialogFocus';

interface Props {
  open: boolean;
  mode: SchematicMode;
  projectRoot: string | null;
  filePath: string | null;
  onClose: () => void;
  onInsert: (code: string, packageName: string) => void;
}

function NodeIcon({ kind }: { kind: string }) {
  if (kind === 'battery' || kind === 'vsource') return <Battery size={13} />;
  if (kind === 'resistor' || kind === 'potentiometer') return <Activity size={13} />;
  if (kind === 'capacitor') return <AlignJustify size={13} />;
  if (kind === 'inductor') return <Waves size={13} />;
  if (kind === 'diode' || kind === 'led') return <Zap size={13} />;
  if (kind === 'switch') return <ToggleLeft size={13} />;
  if (kind === 'lamp') return <Lightbulb size={13} />;
  if (kind === 'ammeter' || kind === 'voltmeter') return <Gauge size={13} />;
  if (kind === 'ground') return <ArrowDownToLine size={13} />;
  if (kind === 'input') return <LogIn size={12} />;
  if (kind === 'output') return <LogOut size={12} />;
  if (kind === 'benzene') return <Hexagon size={13} />;
  if (kind === 'C' || kind === 'CH3' || kind === 'CH2' || kind === 'CH') return <Atom size={13} />;
  if (kind === 'and' || kind === 'or' || kind === 'not' || kind === 'xor' || kind === 'nand' || kind === 'nor' || kind === 'xnor') return <Cpu size={13} />;
  return <CircuitBoard size={13} />;
}

export function SchematicStudio({ open, mode, projectRoot, filePath, onClose, onInsert }: Props) {
  const { msg } = useI18n();
  const config = configs[mode];
  const [nodes, setNodes] = useState<SchematicNode[]>([]);
  const [edges, setEdges] = useState<SchematicEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [template, setTemplate] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const dialogRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const [history, setHistory] = useState<Array<{ nodes: SchematicNode[]; edges: SchematicEdge[] }>>([]);
  const [future, setFuture] = useState<Array<{ nodes: SchematicNode[]; edges: SchematicEdge[] }>>([]);
  const dragRef = useRef<{ id: string; pointerId: number; target: HTMLElement; offsetX: number; offsetY: number; startNodes: SchematicNode[]; startEdges: SchematicEdge[]; moved: boolean } | null>(null);
  const storageKey = projectRoot ? `texpro.schematic.${mode}.${projectRoot}` : '';

  const commit = (nextNodes: SchematicNode[], nextEdges: SchematicEdge[]) => {
    setHistory((current) => [...current.slice(-39), { nodes, edges }]);
    setFuture([]);
    setNodes(nextNodes);
    setEdges(nextEdges);
  };

  const loadTemplate = (index: number) => {
    const selectedTemplate = config.templates[index];
    if (!selectedTemplate) return;
    const nextNodes: SchematicNode[] = selectedTemplate.nodes.map(([kind, x, y, label]) => ({
      id: nextId('n'), kind, x, y, label, value: '',
    }));
    const nextEdges: SchematicEdge[] = selectedTemplate.edges.map(([from, to, order]) => ({
      id: nextId('e'), from: nextNodes[from].id, to: nextNodes[to].id, order,
    }));
    commit(nextNodes, nextEdges);
    setSelectedNode(nextNodes[0]?.id ?? null);
    setSelectedEdge(null);
  };

  useEffect(() => {
    if (!open) return;
    let nextNodes: SchematicNode[] | null = null;
    let nextEdges: SchematicEdge[] | null = null;
    if (storageKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
        const restored = restoreSchematic(saved, mode);
        if (restored) { nextNodes = restored.nodes; nextEdges = restored.edges; }
      } catch { /* ignore */ }
    }
    if (!nextNodes || !nextEdges) {
      const first = config.templates[0];
      nextNodes = first.nodes.map(([kind, x, y, label]) => ({ id: nextId('n'), kind, x, y, label, value: '' }));
      nextEdges = first.edges.map(([from, to, order]) => ({ id: nextId('e'), from: nextNodes![from].id, to: nextNodes![to].id, order }));
    }
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNode(nextNodes[0]?.id ?? null);
    setSelectedEdge(null);
    setPending(null);
    dragRef.current = null;
    setTemplate(0);
    setZoom(1);
    setPaletteQuery('');
    setStorageError(false);
    setHistory([]);
    setFuture([]);
  }, [open, mode, storageKey]);

  useEffect(() => {
    if (!open || !storageKey) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ nodes, edges }));
        setStorageError(false);
      } catch { setStorageError(true); }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [open, storageKey, nodes, edges]);

  useEffect(() => {
    if (!open) return;
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault(); redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault(); removeSelected();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [open, history, future, selectedNode, selectedEdge, nodes, edges]);

  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setFuture((current) => [{ nodes, edges }, ...current].slice(0, 40));
    setHistory((current) => current.slice(0, -1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((current) => [...current.slice(-39), { nodes, edges }]);
    setFuture((current) => current.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  const code = useMemo(() => generateSchematic(mode, nodes, edges), [mode, nodes, edges]);

  const { preview, error: previewError, busy: previewBusy, retry } = useDiagramPreview(open, projectRoot, filePath, code);

  useEffect(() => {
    if (!open) return;
    const finish = () => endDrag();
    window.addEventListener('blur', finish);
    return () => { window.removeEventListener('blur', finish); dragRef.current = null; };
  }, [open]);

  if (!open) return null;

  const selected = nodes.find((node) => node.id === selectedNode);
  const selectedConnection = edges.find((edge) => edge.id === selectedEdge);

  const addNode = (kind: string, x = 260, y = 150) => {
    const id = nextId('n');
    commit([...nodes, { id, kind, x, y, label: nodeLabel(kind), value: '' }], edges);
    setSelectedNode(id);
    setSelectedEdge(null);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const kind = event.dataTransfer.getData('text/plain');
    if (!config.palette.some(([value]) => value === kind)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    addNode(kind, Math.max(10, (event.clientX - rect.left + event.currentTarget.scrollLeft) / zoom - 45), Math.max(10, (event.clientY - rect.top + event.currentTarget.scrollTop) / zoom - 20));
  };

  const startDrag = (event: React.PointerEvent<HTMLElement>, node: SchematicNode) => {
    if (event.button !== 0 || dragRef.current || !canvasRef.current) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.focus({ preventScroll: true });
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    dragRef.current = {
      id: node.id, pointerId: event.pointerId, target,
      offsetX: (event.clientX - rect.left + canvas.scrollLeft) / zoom - node.x,
      offsetY: (event.clientY - rect.top + canvas.scrollTop) / zoom - node.y,
      startNodes: nodes, startEdges: edges, moved: false,
    };
    target.setPointerCapture(event.pointerId);
    setSelectedNode(node.id);
    setSelectedEdge(null);
  };
  const moveDrag = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(10, Math.round(((event.clientX - rect.left + canvas.scrollLeft) / zoom - drag.offsetX) / 10) * 10);
    const y = Math.max(10, Math.round(((event.clientY - rect.top + canvas.scrollTop) / zoom - drag.offsetY) / 10) * 10);
    const original = drag.startNodes.find((node) => node.id === drag.id);
    drag.moved = Boolean(original && (original.x !== x || original.y !== y));
    setNodes((current) => current.map((node) => node.id === drag.id ? { ...node, x, y } : node));
  };
  const endDrag = (event?: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || (event && event.pointerId !== drag.pointerId)) return;
    // React may evaluate this updater after the ref has been cleared. Capture the
    // complete gesture first; no queued updater may dereference dragRef.current.
    dragRef.current = null;
    if (drag.moved) {
      const snapshot = { nodes: drag.startNodes, edges: drag.startEdges };
      setHistory((current) => [...current.slice(-39), snapshot]);
      setFuture([]);
    }
    if (drag.target.hasPointerCapture(drag.pointerId)) drag.target.releasePointerCapture(drag.pointerId);
  };

  const removeSelected = () => {
    if (selectedEdge) {
      commit(nodes, edges.filter((edge) => edge.id !== selectedEdge));
      setSelectedEdge(null);
      return;
    }
    if (!selectedNode) return;
    commit(nodes.filter((node) => node.id !== selectedNode), edges.filter((edge) => edge.from !== selectedNode && edge.to !== selectedNode));
    setSelectedNode(null);
  };

  const connect = (id: string) => {
    if (!pending) { setPending(id); return; }
    if (pending === id) { setPending(null); return; }
    if (edges.some((edge) => edge.from === pending && edge.to === id)) { setPending(null); return; }
    commit(nodes, [...edges, { id: nextId('e'), from: pending, to: id, order: 1 }]);
    setPending(null);
  };

  const updateSelected = (patch: Partial<SchematicNode>) => {
    if (!selectedNode) return;
    commit(nodes.map((node) => node.id === selectedNode ? { ...node, ...patch } : node), edges);
  };

  const title = mode === 'circuit' ? msg("app.circuit.studio") : mode === 'logic' ? msg("app.logic.studio") : msg("app.structure.studio");
  const Icon = mode === 'circuit' ? CircuitBoard : mode === 'logic' ? GitBranch : FlaskConical;

  return (
    <WorkspaceFrame title={title} className="schematic-studio" onClose={onClose} sectionRef={dialogRef} testId={`${mode}-studio`}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Icon size={18} /></div>
            <div><h2 id="schematic-title">{title}</h2><p className="studio-subtitle">{msg("app.build.a.diagram.insert.editable.latex")}</p></div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok">{config.package}</span>
            <button className="icon-btn" onClick={onClose} aria-label={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="schematic-toolbar">
          <select aria-label={msg("app.template")} value={template} onChange={(event) => { setTemplate(Number(event.target.value)); loadTemplate(Number(event.target.value)); }}>
            {config.templates.map((item, index) => <option key={item.name} value={index}>{msg.text(item.name)}</option>)}
          </select>
          <span className="toolbar-sep" />
          <button className="icon-btn" onClick={undo} disabled={!history.length} title={msg("app.undo")}><Undo2 size={13} /></button>
          <button className="icon-btn" onClick={redo} disabled={!future.length} title={msg("app.redo")}><Redo2 size={13} /></button>
          <button className="icon-btn" onClick={() => loadTemplate(template)} title={msg("app.reset")}><RotateCcw size={13} /></button>
          <span className="toolbar-sep" />
          <button className="icon-btn" onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))} title={msg("app.zoom.out")}><Minus size={13} /></button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button className="icon-btn" onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))} title={msg("app.zoom.in")}><Plus size={13} /></button>
          <span className="spacer" />
          <button className="danger-btn" onClick={removeSelected} disabled={!selectedNode && !selectedEdge}><Trash2 size={12} /> {msg("app.delete")}</button>
        </div>

        <div className={`schematic-context ${pending ? 'connecting' : ''}`} role="status">
          {pending ? <><span>{msg("app.choose.a.second.port.to.finish.the.connection")}</span><button onClick={() => setPending(null)}>{msg("app.cancel.connection")}</button></> : <span>{nodes.length} {msg("app.nodes")} · {edges.length} {msg("app.wires")} · {msg("app.select.to.inspect.drag.to.move")}</span>}
          {storageError && <span role="alert">{msg("app.draft.could.not.be.saved.copy.the.latex.before")}</span>}
        </div>
        <div className="schematic-body">
          <aside className="schematic-palette">
            <div className="pane-label"><Plus size={12} /> {msg("app.components")}</div>
            <label className="schematic-search"><Search size={14} /><input aria-label={msg("app.search.components")} placeholder={msg("app.search.components")} value={paletteQuery} onChange={(event) => setPaletteQuery(event.target.value)} /></label>
            <div className="schematic-palette-list">
              {config.palette.filter(([kind, label]) => `${kind} ${msg.text(label)}`.toLowerCase().includes(paletteQuery.trim().toLowerCase())).map(([kind, label]) => (
                <button key={kind} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', kind)} onClick={() => addNode(kind)}>
                  <span className="palette-label"><NodeIcon kind={kind} /> {msg.text(label)}</span><small>{kind}</small>
                </button>
              ))}
            </div>
            <p className="schematic-hint">{msg("app.drag.components.to.place.them.click.two.ports.to")}</p>
          </aside>

          <div ref={canvasRef} className="schematic-canvas" onDrop={onDrop} onDragOver={(event) => event.preventDefault()} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
            <div className="schematic-canvas-inner" style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
              <svg className="schematic-wires">
                {edges.map((edge) => {
                  const from = nodes.find((node) => node.id === edge.from);
                  const to = nodes.find((node) => node.id === edge.to);
                  if (!from || !to) return null;
                  const fromWidth = from.kind === 'input' || from.kind === 'output' ? 76 : 110;
                  const x1 = from.x + fromWidth;
                  const y1 = from.y + 24;
                  const x2 = to.x;
                  const incoming = edges.filter((item) => item.to === edge.to);
                  const inputIndex = Math.max(0, incoming.findIndex((item) => item.id === edge.id));
                  const isGate = mode === 'logic' && !['input', 'output'].includes(to.kind);
                  const y2 = to.y + (isGate && to.kind !== 'not' && to.kind !== 'buffer' ? (inputIndex === 0 ? 14 : 34) : 24);
                  const mid = (x1 + x2) / 2;
                  const path = mode === 'circuit' && to.x <= from.x
                    ? `M ${x1} ${y1} L ${x1} ${Math.max(from.y, to.y) + 86} L ${x2} ${Math.max(from.y, to.y) + 86} L ${x2} ${y2}`
                    : `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
                  return (
                    <g key={edge.id} className={selectedEdge === edge.id ? 'selected' : ''} onClick={() => { setSelectedEdge(edge.id); setSelectedNode(null); }}>
                      <path className="wire-hit" d={path} />
                      <path d={path} />
                      <circle className="wire-end" cx={x1} cy={y1} r="2.5" />
                      <circle className="wire-end" cx={x2} cy={y2} r="2.5" />
                    </g>
                  );
                })}
              </svg>
              {nodes.map((node) => (
                <div
                  key={node.id}
                  tabIndex={0}
                  role="group"
                  aria-label={`${msg("app.element")}: ${node.label}`}
                  onFocus={() => { setSelectedNode(node.id); setSelectedEdge(null); }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter') { event.preventDefault(); connect(node.id); }
                    const delta: Record<string, [number, number]> = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
                    if (delta[event.key]) {
                      event.preventDefault();
                      const [dx, dy] = delta[event.key];
                      commit(nodes.map((item) => item.id === node.id ? { ...item, x: Math.max(10, item.x + dx), y: Math.max(10, item.y + dy) } : item), edges);
                    }
                  }}
                  className={`schematic-node ${mode === 'logic' && !['input', 'output'].includes(node.kind) ? 'gate' : ''} ${mode === 'logic' && ['not', 'buffer'].includes(node.kind) ? 'gate-single' : ''} ${selectedNode === node.id ? 'selected' : ''} ${pending === node.id ? 'pending' : ''} kind-${node.kind}`}
                  style={{ left: node.x, top: node.y }}
                  onPointerDown={(event) => startDrag(event, node)}
                  onDoubleClick={() => connect(node.id)}
                >
                  <button className="schematic-port left" aria-label={msg("app.connect.input.of.name", { name: node.label })} onPointerDown={(event) => event.stopPropagation()} onClick={() => connect(node.id)} />
                  {mode === 'logic' && !['input', 'output', 'not', 'buffer'].includes(node.kind) && <button className="schematic-port left in-two" aria-label={msg("app.connect.second.input.of.name", { name: node.label })} onPointerDown={(event) => event.stopPropagation()} onClick={() => connect(node.id)} />}
                  <span className="schematic-node-icon"><NodeIcon kind={node.kind} /></span>
                  <span className="schematic-node-copy"><strong>{node.label}</strong><small>{node.kind}</small></span>
                  <button aria-label={msg("app.connect.output.of.name", { name: node.label })} className="schematic-port right" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); connect(node.id); }} />
                </div>
              ))}
            </div>
          </div>

          <aside className="schematic-preview">
            <div className="pane-label">{msg("app.inspector")}</div>
            {selected ? (
              <div className="schematic-inspector">
                <label className="workshop-field"><span>{msg("app.label")}</span><input value={selected.label} onChange={(event) => updateSelected({ label: event.target.value })} /></label>
                <label className="workshop-field"><span>{msg("app.element")}</span><input value={selected.kind} readOnly /></label>
                {mode === 'circuit' && <label className="workshop-field"><span>{msg("app.value")}</span><input value={selected.value} onChange={(event) => updateSelected({ value: event.target.value })} placeholder="10 kΩ" /></label>}
                <p className="schematic-hint">{msg("app.drag.the.node.on.canvas.connect.by.clicking.ports")}</p>
                <button className="secondary-btn" onClick={() => {
                  const id = nextId('n');
                  commit([...nodes, { ...selected, id, x: selected.x + 30, y: selected.y + 30 }], edges);
                  setSelectedNode(id);
                }}>{msg("app.duplicate")}</button>
              </div>
            ) : selectedConnection ? (
              <div className="schematic-inspector">
                <label className="workshop-field"><span>{msg("app.bond.order")}</span>
                  <select value={selectedConnection.order} onChange={(event) => {
                    const order = Number(event.target.value) as 1 | 2 | 3;
                    commit(nodes, edges.map((edge) => edge.id === selectedConnection.id ? { ...edge, order } : edge));
                  }}>
                    <option value={1}>{msg("app.single")}</option><option value={2}>{msg("app.double")}</option><option value={3}>{msg("app.triple")}</option>
                  </select>
                </label>
              </div>
            ) : <div className="schematic-empty"><CircuitBoard size={20} /><strong>{msg("app.select.a.node.or.wire")}</strong><span>{nodes.length} {msg("app.nodes")} · {edges.length} {msg("app.wires")}</span></div>}
            <div className="pane-label">{msg("app.preview")}</div>
            <div className="schematic-preview-canvas">
              {previewBusy && <div className="schematic-loading"><Loader2 size={16} className="spin" /><span>{msg("app.typesetting.preview")}</span></div>}
              {!previewBusy && preview && <TexArtwork src={preview} alt={msg("app.diagram.preview")} />}
              {!previewBusy && !preview && (previewError ? <div className="schematic-preview-error" role="alert"><strong>{msg("app.preview.unavailable")}</strong><p>{previewError}</p><button className="secondary-btn" onClick={retry}>{msg("app.retry.preview")}</button></div> : <span>{msg("app.preview.will.appear.here")}</span>)}
            </div>
            <details className="schematic-source" open>
              <summary>{msg("app.generated.latex")}</summary>
              <button className="mini-btn schematic-copy" onClick={async () => {
                try { await navigator.clipboard.writeText(code); setCopied(true); }
                catch { setCopied(false); }
              }}>{copied ? <Check size={12} /> : <Copy size={12} />}{msg(copied ? "app.copied" : "app.copy.latex")}</button>
              <pre className="schematic-code">{code}</pre>
            </details>
          </aside>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.visual.structure.editable.latex.output")}</span>
          <div className="spacer" />
          <button className="secondary-btn" onClick={onClose}>{msg("app.cancel")}</button>
          <button className="primary-btn" disabled={!nodes.length} onClick={() => { onInsert(code, config.package); onClose(); }}>{msg("app.insert.diagram")}</button>
        </footer>
    </WorkspaceFrame>
  );
}
