import { useEffect, useRef, useState } from 'react';
import { Code2, FileMusic, Loader2, Minus, Music2, Plus, RefreshCw, Undo2, X } from 'lucide-react';
import type * as pdfjs from 'pdfjs-dist';
import { loadPdfRuntime } from '../lib/pdfRuntime';
import { useI18n } from '../i18n';
import { themeTexArtwork } from '../lib/texArtwork';
import { musicBlock, musicIssues, musicTemplates, newScore, previewDocument, type MusicNote, type MusicScore, type ParsedMusicBlock } from '../lib/music';
const pitchName = (p: number | null) => p === null ? 'Rest' : `${['C', 'D', 'E', 'F', 'G', 'A', 'B'][((p % 7) + 7) % 7]}${4 + Math.floor(p / 7)}`;
function ChordInput({ note, onChange }: {
    note: MusicNote;
    onChange: (chord: number[]) => void;
}) {
    const { msg } = useI18n();
    const value = (note.chord || []).map(p => pitchName(p)).join(', ');
    const [draft, setDraft] = useState(value);
    useEffect(() => setDraft(value), [value]);
    return <label>{msg("app.chord.tones")}<input aria-label={msg("app.chord.tones")} placeholder="E4, G4" value={draft} onChange={e => { setDraft(e.target.value); e.target.setCustomValidity(''); }} onBlur={e => {
            const names = draft.trim() ? draft.split(/[,，\s]+/).filter(Boolean) : [];
            const pitches = names.map(name => { const m = /^([A-Ga-g])([2-8])$/.exec(name); return m ? ('CDEFGAB'.indexOf(m[1].toUpperCase()) + (Number(m[2]) - 4) * 7) : NaN; });
            if (pitches.length > 7 || pitches.some(p => !Number.isInteger(p) || p < -14 || p > 28)) {
                e.target.setCustomValidity(msg("app.use.up.to.seven.note.names.such.as.e4"));
                e.target.reportValidity();
                return;
            }
            onChange([...new Set(pitches)]);
        }}/></label>;
}
/** Immediate editable notation. Final spacing and pagination always come from TeX below. */
function NotationInput({ score, part, selected, onSelect, onPitch, onAdd }: {
    score: MusicScore;
    part: number;
    selected: number;
    onSelect: (n: number) => void;
    onPitch: (index: number, p: number) => void;
    onAdd: (n: MusicNote) => void;
}) {
    const { msg } = useI18n(), p = score.parts[part];
    const bottom = p.clef === 'bass' ? -12 : p.clef === 'alto' ? -6 : 2;
    const count = Math.max(p.notes.length + 2, 12), width = 62 + count * 34;
    const ys = score.kind === 'staff' ? p.notes.flatMap(n => n.pitch === null ? [58] : [n.pitch, ...(n.chord || [])].map(pitch => 78 - (pitch-bottom)*5)) : [58];
    const top = Math.min(0,...ys.map(y=>y-34)), lyricY = Math.max(135,...ys.map(y=>y+24)), height = lyricY+16-top;
    return <div className="music-input-scroll"><svg className="music-input" viewBox={`0 ${top} ${width} ${height}`} width={width} height={height} role="group" aria-label={msg("app.edit.notation")}>
    {(score.kind === 'numbered' ? [] : score.kind === 'guitar' ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4]).map(i => <line key={i} x1={12} x2={width - 12} y1={78 - i * 10} y2={78 - i * 10} stroke="currentColor" strokeWidth="0.7" opacity="0.45"/>)}
    <text x={15} y={76} fontSize={score.kind === 'staff' ? 45 : 18} fontFamily="serif">{score.kind === 'guitar' ? 'TAB' : score.kind === 'numbered' ? '1=' : p.clef === 'bass' ? '𝄢' : p.clef === 'alto' ? '𝄡' : '𝄞'}</text>
    <rect x={55} y={top+4} width={width - 67} height={lyricY-top-10} fill="transparent" onPointerDown={e => { const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect(); const y = top+(e.clientY - box.top) * height / box.height; onAdd(score.kind==='guitar'?{pitch:0,duration:4,fret:0,string:Math.max(1,Math.min(6,Math.round((y-28)/10)+1))}:{ pitch: score.kind==='numbered'?0:Math.max(-14, Math.min(28, bottom + Math.round((78 - y) / 5))), duration: 4 }); }}/>
    {p.notes.map((n, i) => {
            const x = 70 + i * 34, y = n.pitch === null ? 58 : 78 - (n.pitch - bottom) * 5;
            return <g key={i} role="button" tabIndex={0} aria-label={`${i + 1}. ${pitchName(n.pitch)}, 1/${n.duration}`} aria-pressed={i === selected} className={i === selected ? 'music-note selected' : 'music-note'} onPointerDown={e => { e.stopPropagation(); onSelect(i); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(i);
            } if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                onSelect(i);
                onPitch(i, Math.max(-14, Math.min(28, (n.pitch || 0) + (e.key === 'ArrowUp' ? 1 : -1))));
            } }}>
        <rect x={x - 13} y={top+4} width={28} height={lyricY-top-12} rx={3} className="music-note-target"/>
        {score.kind === 'staff' && n.pitch !== null && Array.from({ length: Math.max(0, Math.ceil((-y + 28) / 10)) }, (_, j) => <line key={`u${j}`} x1={x - 10} x2={x + 10} y1={28 - j * 10} y2={28 - j * 10} stroke="currentColor"/>)}
        {score.kind === 'staff' && n.pitch !== null && Array.from({ length: Math.max(0, Math.ceil((y - 88) / 10) + 1) }, (_, j) => y >= 88 ? <line key={`l${j}`} x1={x - 10} x2={x + 10} y1={88 + j * 10} y2={88 + j * 10} stroke="currentColor"/> : null)}
        {score.kind === 'numbered' ? <text x={x} y={60} textAnchor="middle" fontSize={19}>{n.pitch === null ? '0' : (((n.pitch-((score.key*4)%7+7)%7) % 7) + 7) % 7 + 1}</text> : score.kind === 'guitar' ? <text x={x} y={28 + ((n.string || 1) - 1) * 10 + 5} textAnchor="middle" fontSize={18}>{n.pitch === null ? 'r' : n.fret || 0}</text> : n.pitch === null ? <text x={x} y={68} textAnchor="middle" fontSize={22}>𝄽</text> : <>
          <ellipse cx={x} cy={y} rx={6} ry={4} transform={`rotate(-18 ${x} ${y})`} fill={n.duration <= 2 ? 'var(--paper)' : 'currentColor'} stroke="currentColor" strokeWidth={1.4}/>
          {n.duration > 1 && <line x1={x + 5} x2={x + 5} y1={y} y2={y - 28} stroke="currentColor" strokeWidth={1.3}/>}
          {n.duration >= 8 && Array.from({ length: Math.log2(n.duration) - 2 }, (_, b) => <path key={b} d={`M${x + 5} ${y - 28 + b * 6} q15 8 5 17`} fill="none" stroke="currentColor" strokeWidth={2}/>)}
          {n.accidental !== undefined && <text x={x - 21} y={y + 5} fontSize={19}>{n.accidental === 1 ? '♯' : n.accidental === -1 ? '♭' : '♮'}</text>}
        </>}
        {score.kind === 'staff' && n.pitch !== null && (n.chord || []).filter(p => p !== n.pitch).map((pitch, j) => <ellipse key={j} cx={x} cy={78 - (pitch - bottom) * 5} rx={6} ry={4} fill={n.duration <= 2 ? 'var(--paper)' : 'currentColor'} stroke="currentColor"/>)}
        {n.dotted && <circle cx={x + 12} cy={y - 2} r={1.6} fill="currentColor"/>}
        <text x={x} y={lyricY} textAnchor="middle" fontSize={11}>{n.lyric || ''}</text>
      </g>;
        })}
  </svg></div>;
}
export function ScorePreview({ root, source, refresh, onMeasure, onSource }: {
    root: string;
    onSource: () => void;
    source: string;
    refresh: number;
    onMeasure: () => void;
}) {
    const { msg } = useI18n(), host = useRef<HTMLDivElement>(null);
    const [busy, setBusy] = useState(true), [error, setError] = useState(''), [retry, setRetry] = useState(0);
    useEffect(() => {
        let dead = false;
        const runId = `music-${crypto.randomUUID()}`;
        let task: ReturnType<typeof pdfjs.getDocument> | undefined;
        setBusy(true);
        setError('');
        const timer = window.setTimeout(async () => {
            try {
                const result = await window.texpro.renderMusicPreview({ projectRoot: root, source: previewDocument(source), runId });
                if (dead)
                    return;
                if (!result.ok || !result.bytes)
                    throw new Error(result.error || 'Music typesetting failed');
                const runtime = await loadPdfRuntime();
                if (dead) return;
                task = runtime.getDocument({ data: new Uint8Array(result.bytes) });
                const doc = await task.promise;
                if (dead)
                    return;
                const pages: HTMLCanvasElement[] = [];
                for (let i = 1; i <= doc.numPages; i++) {
                    const page = await doc.getPage(i);
                    if (dead)
                        return;
                    const base = page.getViewport({ scale: 1 }), scale = Math.min(1.5, Math.max(0.6, (host.current?.clientWidth || 650) / base.width));
                    const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
                    canvas.style.height = 'auto';
                    await page.render({ canvas, viewport }).promise;
                    if (dead)
                        return;
                    // TeX pages are real; trim only blank vertical margins for an in-flow writing block.
                    const ctx = canvas.getContext('2d', { willReadFrequently: true })!, data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                    let top = canvas.height, bottom = 0;
                    for (let y = 0; y < canvas.height; y++)
                        for (let x = 0; x < canvas.width; x++) {
                            const k = (y * canvas.width + x) * 4;
                            if (data[k + 3] > 0 && (data[k] < 235 || data[k + 1] < 235 || data[k + 2] < 235)) {
                                top = Math.min(top, y);
                                bottom = Math.max(bottom, y);
                                break;
                            }
                        }
                    if (bottom > top) {
                        const margin = 16 * window.devicePixelRatio;
                        top = Math.max(0, top - margin);
                        bottom = Math.min(canvas.height, bottom + margin);
                        const cropped = document.createElement('canvas');
                        cropped.width = canvas.width;
                        cropped.height = bottom - top;
                        cropped.style.width = canvas.style.width;
                        cropped.style.height = 'auto';
                        cropped.getContext('2d')!.drawImage(canvas, 0, top, canvas.width, bottom - top, 0, 0, canvas.width, bottom - top);
                        pages.push(cropped);
                    }
                    else
                        pages.push(canvas);
                }
                if (!dead) {
                    host.current?.replaceChildren(...pages.map(canvas => {
                        const frame = document.createElement('span');
                        frame.appendChild(canvas); themeTexArtwork(frame, canvas); return frame;
                    }));
                    onMeasure();
                }
            }
            catch (e) {
                if (!dead) {
                    host.current?.replaceChildren();
                    setError(e instanceof Error ? e.message : String(e));
                }
            }
            finally {
                if (!dead) {
                    setBusy(false);
                    onMeasure();
                }
            }
        }, 600);
        return () => { dead = true; clearTimeout(timer); void window.texpro.cancelCompile(runId).catch(() => { }); void task?.destroy(); };
        // onMeasure is a widget callback; changing it must not restart TeX.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [root, source, refresh, retry]);
    return <><div className="music-typeset" ref={host} aria-label={msg("app.tex.score.preview")}/><div className={`music-preview-state ${error?'has-error':''}`} role="status">{busy && <><Loader2 size={12} className="spin"/>{msg("app.typesetting.score")}</>}{error && <div className="music-preview-error music-error" role="alert"><strong>{msg("app.could.not.typeset.this.score")}</strong><p>{msg("app.your.source.is.safe.check.that.the.tex.music")}</p><div className="music-error-actions"><button onClick={()=>setRetry(x=>x+1)}>{msg("app.retry.preview")}</button><button onClick={onSource}>{msg("app.edit.tex.source")}</button></div><details><summary>{msg("app.technical.details")}</summary><pre>{error}</pre></details></div>}</div></>;
}
export function MusicBlock({ block, root, onChange, onSource, onContinue, onUndo, onMeasure }: {
    block: ParsedMusicBlock;
    root: string;
    onChange: (source: string) => void;
    onSource: () => void;
    onContinue: () => void;
    onUndo: () => void;
    onMeasure: () => void;
}) {
    const { msg } = useI18n();
    const [editing, setEditing] = useState(false), [part, setPart] = useState(0), [selected, setSelected] = useState(0), [refresh, setRefresh] = useState(0);
    const score = block.score, host = useRef<HTMLElement>(null);
    const p = score?.parts[Math.min(part, score.parts.length - 1)], n = p?.notes[selected];
    useEffect(() => { onMeasure(); }, [editing, part, score?.parts.length, onMeasure]);
    const change = (next: MusicScore) => onChange(musicBlock(next, block.id));
    const patch = (patch: Partial<MusicScore>) => { if (score)
        change({ ...score, ...patch }); };
    const patchNote = (delta: Partial<MusicNote>) => { if (score && p && n)
        patch({ parts: score.parts.map((v, i) => i === part ? { ...v, notes: v.notes.map((a, j) => j === selected ? { ...a, ...delta } : a) } : v) }); };
    const add = (note: MusicNote) => { if (score && p && p.notes.length < 256) {
        patch({ parts: score.parts.map((v, i) => i === part ? { ...v, notes: [...v.notes, note] } : v) });
        setSelected(p.notes.length);
    } };
    const remove = () => { if (score && p && n) {
        patch({ parts: score.parts.map((v, i) => i === part ? { ...v, notes: v.notes.filter((_, j) => j !== selected) } : v) });
        setSelected(Math.max(0, selected - 1));
    } };
    return <section className={`cm-music-block ${editing ? 'editing' : ''}`} ref={host} contentEditable={false} aria-label={msg("app.music.block")} data-testid="music-block" onBlur={e => { if (!host.current?.contains(e.relatedTarget as Node))
        setEditing(false); }} onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                e.stopPropagation();
                onUndo();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setEditing(false);
                onContinue();
            }
        }}>
    <div className="music-block-actions"><span><Music2 size={13}/>{msg("app.music")}</span><div><button title={msg("app.write.music")} aria-label={msg("app.write.music")} onClick={onSource}><Code2 size={14}/>{msg("app.write.music")}</button>{score && <button title={msg("app.notation.tools")} aria-label={msg("app.notation.tools")} aria-expanded={editing} onClick={() => setEditing(!editing)}><FileMusic size={14}/>{msg(editing ? "app.hide.notation.tools" : "app.notation.tools")}</button>}</div></div>
    {editing && score && <div className="music-inline-controls">
      <div className="music-meta"><label>{msg("app.score.template")}<select aria-label={msg("app.score.template")} value="" onChange={e => { change(newScore(e.target.value)); setPart(0); setSelected(0); }}><option value="" disabled>{msg("app.choose.template")}</option>{musicTemplates.map(a => <option key={a.id} value={a.id}>{msg.text(a.name)}</option>)}</select></label><label>{msg("app.notation")}<select value={score.kind} onChange={e => patch({ kind: e.target.value as MusicScore['kind'] })}><option value="staff">{msg("app.staff.notation")}</option><option value="numbered">{msg("app.numbered.notation")}</option><option value="guitar">{msg("app.guitar.tablature")}</option></select></label><label>{msg("app.score.title")}<input value={score.title} maxLength={200} onChange={e => patch({ title: e.target.value })}/></label></div>
      <div className="music-part-tabs" role="group" aria-label={msg("app.instruments")}>{score.parts.map((a, i) => <button key={i} className={i === part ? 'active' : ''} onClick={() => { setPart(i); setSelected(0); }}>{a.name}</button>)}<button disabled={score.parts.length >= 8} onClick={() => { patch({ parts: [...score.parts, { name: `Part ${score.parts.length + 1}`, clef: 'treble', notes: [] }] }); setPart(score.parts.length); setSelected(0); }} aria-label={msg("app.add.instrument")} title={msg("app.add.instrument")}><Plus size={14}/></button></div>
      {p && <><div className="music-meta"><label>{msg("app.instrument")}<input value={p.name} maxLength={80} onChange={e => patch({ parts: score.parts.map((a, i) => i === part ? { ...a, name: e.target.value } : a) })}/></label><label>{msg("app.clef")}<select value={p.clef} onChange={e => patch({ parts: score.parts.map((a, i) => i === part ? { ...a, clef: e.target.value as typeof p.clef } : a) })}><option value="treble">{msg("app.treble")}</option><option value="bass">{msg("app.bass")}</option><option value="alto">{msg("app.alto")}</option></select></label><label>{msg("app.meter")}<select value={score.meter.join('/')} onChange={e => patch({ meter: e.target.value.split('/').map(Number) as [
                    number,
                    number
                ] })}>{['2/4', '3/4', '4/4', '6/8', '9/8', '12/8'].map(a => <option key={a}>{a}</option>)}</select></label><label>{msg("app.key.signature")}<select value={score.key} onChange={e => patch({ key: Number(e.target.value) })}>{Array.from({ length: 15 }, (_, i) => i - 7).map(a => <option key={a} value={a}>{a === 0 ? 'C' : `${Math.abs(a)} ${a < 0 ? '♭' : '♯'}`}</option>)}</select></label><label>{msg("app.tempo")}<input type="number" min={20} max={300} value={score.tempo} onChange={e => patch({ tempo: Math.round(Math.max(20, Math.min(300, Number(e.target.value)))) })}/></label><label>{msg("app.output")}<select value={score.display} onChange={e => patch({ display: Number(e.target.value) })}><option value={-1}>{msg("app.full.score")}</option>{score.parts.map((a, i) => <option key={i} value={i}>{a.name}</option>)}</select></label><button className="music-remove-part" disabled={score.parts.length === 1} title={msg("app.remove.instrument")} aria-label={msg("app.remove.instrument")} onClick={() => { const next = score.parts.filter((_, i) => i !== part); patch({ parts: next, display: -1 }); setPart(Math.max(0, part - 1)); setSelected(0); }}><X size={14}/></button></div>
      <NotationInput score={score} part={Math.min(part, score.parts.length - 1)} selected={selected} onSelect={setSelected} onPitch={(index, pitch) => { if (score && p)
                patch({ parts: score.parts.map((v, i) => i === part ? { ...v, notes: v.notes.map((a, j) => j === index ? { ...a, pitch } : a) } : v) }); }} onAdd={add}/>
      <div className="music-note-tools"><span>{msg("app.add.note")}</span>{['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((a, i) => <button key={a} disabled={!p || p.notes.length >= 256} onClick={() => add({ pitch: i, duration: n?.duration || 4 })}>{a}</button>)}<button disabled={!p || p.notes.length >= 256} onClick={() => add({ pitch: null, duration: n?.duration || 4 })}>{msg("app.rest")}</button><button disabled={!n} onClick={remove} title={msg("app.delete.note")} aria-label={msg("app.delete.note")}><Minus size={14}/></button><button onClick={onUndo} title={msg("app.undo")} aria-label={msg("app.undo")}><Undo2 size={14}/></button></div>
      {n && <div className="music-meta"><label>{msg("app.pitch")}<select value={n.pitch === null ? 'r' : n.pitch} onChange={e => patchNote({ pitch: e.target.value === 'r' ? null : Number(e.target.value) })}><option value="r">{msg("app.rest")}</option>{Array.from({ length: 43 }, (_, i) => i - 14).map(a => <option key={a} value={a}>{pitchName(a)}</option>)}</select></label><label>{msg("app.duration")}<select value={n.duration} onChange={e => patchNote({ duration: Number(e.target.value) })}>{[1, 2, 4, 8, 16, 32].map(a => <option key={a} value={a}>1/{a}</option>)}</select></label><label>{msg("app.accidental")}<select value={n.accidental ?? ''} onChange={e => patchNote({ accidental: e.target.value === '' ? undefined : Number(e.target.value) as -1 | 0 | 1 })}><option value="">—</option><option value={1}>♯</option><option value={-1}>♭</option><option value={0}>♮</option></select></label><label className="music-check"><input type="checkbox" checked={!!n.dotted} onChange={e => patchNote({ dotted: e.target.checked })}/>{msg("app.dotted")}</label><label className="music-check"><input type="checkbox" checked={!!n.tie} onChange={e => patchNote({ tie: e.target.checked })}/>{msg("app.tie")}</label>{n.pitch !== null && score.kind === 'staff' && <ChordInput note={n} onChange={chord => patchNote({ chord })}/>}<label>{msg("app.chord.symbol")}<input value={n.harmony || ''} maxLength={24} placeholder="Cmaj7" onChange={e => patchNote({ harmony: e.target.value })}/></label><label>{msg("app.dynamics")}<select value={n.dynamic || ''} onChange={e => patchNote({ dynamic: e.target.value })}>{['', 'pp', 'p', 'mp', 'mf', 'f', 'ff', 'sfz'].map(v => <option key={v} value={v}>{v || '—'}</option>)}</select></label><label>{msg("app.lyric.syllable")}<input value={n.lyric || ''} maxLength={80} onChange={e => patchNote({ lyric: e.target.value })}/></label>{score.kind === 'guitar' && <><label>{msg("app.string")}<input type="number" min={1} max={6} value={n.string || 1} onChange={e => patchNote({ string: Math.round(Math.max(1, Math.min(6, Number(e.target.value)))) })}/></label><label>{msg("app.fret")}<input type="number" min={0} max={24} value={n.fret || 0} onChange={e => patchNote({ fret: Math.round(Math.max(0, Math.min(24, Number(e.target.value)))) })}/></label></>}</div>}
      <p className="music-help">{msg("app.click.the.staff.to.add.a.note.select.notes")}</p></>}
      {musicIssues(score).length > 0 && <p className="music-warning">{msg("app.incomplete.measure")}: {musicIssues(score).join('; ')}</p>}
    </div>}
    <div className="music-paper" tabIndex={0} role="button" aria-label={msg("app.write.music")} onClick={onSource} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSource();
    } }}><ScorePreview root={root} onSource={onSource} source={block.body} refresh={refresh} onMeasure={onMeasure}/></div>
    {editing && <div className="music-inline-footer"><button onClick={() => setRefresh(x => x + 1)}><RefreshCw size={12}/>{msg("app.refresh.preview")}</button><button onClick={onSource}><Code2 size={12}/>{msg("app.edit.in.document.source")}</button></div>}
  </section>;
}
