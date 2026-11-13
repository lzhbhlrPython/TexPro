import { useEffect, useMemo, useRef, useState } from 'react';
import katex from 'katex';
import { Check, Clipboard, Copy, GitBranch, Sigma, Sparkles, Type, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { FormulaTree } from './FormulaTree';
import { astFromLatex, astToLatex, makeNode, type AstNode } from '../lib/formulaAst';

type FormulaMode = 'inline' | 'display' | 'equation' | 'align';

interface Props {
  open: boolean;
  initialLatex: string;
  onClose: () => void;
  onInsert: (code: string) => void;
}

const symbolGroups: Array<{ name: string; symbols: Array<[string, string]> }> = [
  {
    name: "app.greek",
    symbols: [
      ['\\alpha', 'α'], ['\\beta', 'β'], ['\\gamma', 'γ'], ['\\delta', 'δ'], ['\\epsilon', 'ϵ'],
      ['\\theta', 'θ'], ['\\lambda', 'λ'], ['\\mu', 'μ'], ['\\pi', 'π'], ['\\sigma', 'σ'],
      ['\\phi', 'φ'], ['\\omega', 'ω'], ['\\Gamma', 'Γ'], ['\\Delta', 'Δ'], ['\\Sigma', 'Σ'], ['\\Omega', 'Ω'],
    ],
  },
  {
    name: "app.operators",
    symbols: [
      ['\\sum_{i=1}^{n}', '∑'], ['\\prod_{i=1}^{n}', '∏'], ['\\int_{a}^{b}', '∫'], ['\\oint', '∮'],
      ['\\partial', '∂'], ['\\nabla', '∇'], ['\\infty', '∞'], ['\\pm', '±'], ['\\times', '×'], ['\\cdot', '·'],
      ['\\frac{a}{b}', 'a/b'], ['\\sqrt{x}', '√'], ['\\lim_{x \\to 0}', 'lim'],
    ],
  },
  {
    name: "app.relations",
    symbols: [
      ['\\leq', '≤'], ['\\geq', '≥'], ['\\neq', '≠'], ['\\approx', '≈'], ['\\equiv', '≡'],
      ['\\in', '∈'], ['\\notin', '∉'], ['\\subset', '⊂'], ['\\subseteq', '⊆'], ['\\cup', '∪'],
      ['\\cap', '∩'], ['\\forall', '∀'], ['\\exists', '∃'], ['\\propto', '∝'],
    ],
  },
  {
    name: "app.structures",
    symbols: [
      ['\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', 'matrix'],
      ['\\begin{cases} a & x > 0 \\\\ b & x \\leq 0 \\end{cases}', 'cases'],
      ['\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}', 'aligned'],
      ['\\vec{v}', 'vector'], ['\\hat{x}', 'hat'], ['\\bar{x}', 'bar'], ['\\dot{x}', 'dot'],
      ['\\langle x, y \\rangle', 'inner'], ['\\left( x \\right)', 'parens'],
      ['\\binom{n}{k}', 'binom'], ['\\underbrace{x+y}_{n}', 'underbrace'],
    ],
  },
];

const variantStyles = [
  { id: 'mathbb', label: "app.blackboard", command: '\\mathbb' },
  { id: 'mathcal', label: "app.calligraphic.variant2", command: '\\mathcal' },
  { id: 'mathfrak', label: "app.fraktur", command: '\\mathfrak' },
  { id: 'mathscr', label: "app.script.variant2", command: '\\mathscr' },
  { id: 'mathbf', label: "app.bold.variant2", command: '\\mathbf' },
  { id: 'mathsf', label: "app.sans", command: '\\mathsf' },
  { id: 'mathtt', label: "app.mono", command: '\\mathtt' },
  { id: 'boldsymbol', label: "app.bold.italic", command: '\\boldsymbol' },
];

const templates: Array<{ label: string; latex: string }> = [
  { label: "app.quadratic", latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: "app.sum.variant2", latex: '\\sum_{i=1}^{n} a_i = \\frac{n(n+1)}{2}' },
  { label: "app.integral.variant2", latex: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)' },
  { label: "app.limit.variant2", latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' },
  { label: "app.matrix", latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: "app.cases", latex: 'f(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\leq 0 \\end{cases}' },
  { label: "app.maxwell", latex: '\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}' },
  { label: "app.bayes", latex: 'P(A \\mid B) = \\frac{P(B \\mid A) P(A)}{P(B)}' },
];

function wrapFormula(latex: string, mode: FormulaMode, label: string) {
  const body = latex.trim();
  if (mode === 'inline') return `$${body}$`;
  if (mode === 'display') return `\\[\n  ${body}\n\\]`;
  if (mode === 'align') return `\\begin{align}\n  ${body}\n\\end{align}`;
  const labelLine = label.trim() ? `\\label{${label.trim()}}\n  ` : '';
  return `\\begin{equation}\n  ${labelLine}${body}\n\\end{equation}`;
}

export function FormulaStudio({ open, initialLatex, onClose, onInsert }: Props) {
  const { msg } = useI18n();
  const [latex, setLatex] = useState('');
  const [mode, setMode] = useState<FormulaMode>('inline');
  const [label, setLabel] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<'text' | 'ast'>('text');
  const [variantStyle, setVariantStyle] = useState(variantStyles[0]);
  const [ast, setAst] = useState<AstNode>(() => astFromLatex(''));
  const variantGlyphs = useMemo(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return letters.map((letter) => ({
      letter,
      html: katex.renderToString(`${variantStyle.command}{${letter}}`, { throwOnError: false }),
      latex: `${variantStyle.command}{${letter}}`,
    }));
  }, [variantStyle]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setLatex(initialLatex.replace(/^\$+|\$+$/g, '').trim());
    setMode('inline');
    setLabel('');
    setEditorMode('text');
    setAst(astFromLatex(initialLatex));
    try {
      const stored = JSON.parse(localStorage.getItem('texpro.formulas') || '[]');
      setRecent(Array.isArray(stored) ? stored.slice(0, 6) : []);
    } catch {
      setRecent([]);
    }
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open, initialLatex]);

  const preview = useMemo(() => {
    if (!latex.trim()) return { html: '', error: null as string | null };
    try {
      const source =
        mode === 'align' ? `\\begin{aligned}${latex}\\end{aligned}` : latex;
      return {
        html: katex.renderToString(source, {
          displayMode: mode !== 'inline',
          throwOnError: true,
          strict: 'ignore',
          trust: false,
        }),
        error: null,
      };
    } catch (error) {
      return { html: '', error: String((error as Error).message || error) };
    }
  }, [latex, mode]);

  if (!open) return null;

  const insertAtCursor = (snippet: string) => {
    if (editorMode === 'ast') {
      const parsed = astFromLatex(snippet);
      const inserted = parsed.type === 'row' ? parsed.children : [parsed];
      const next = { ...ast, children: [...(ast.type === 'row' ? ast.children : []), ...inserted] } as AstNode;
      setAst(next);
      setLatex(astToLatex(next));
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) {
      setLatex((value) => value + snippet);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = latex.slice(0, start) + snippet + latex.slice(end);
    setLatex(next);
    window.setTimeout(() => {
      textarea.focus();
      const cursor = start + snippet.length;
      textarea.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const insertIntoDocument = () => {
    const code = wrapFormula(latex, mode, label);
    onInsert(code);
    if (latex.trim()) {
      const next = [latex.trim(), ...recent.filter((item) => item !== latex.trim())].slice(0, 6);
      setRecent(next);
      try {
        localStorage.setItem('texpro.formulas', JSON.stringify(next));
      } catch {
        // ignore
      }
    }
    onClose();
  };

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="formula-studio" data-testid="formula-studio" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Sigma size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.formula.editor")}</span>
              <h2>{msg("app.compose.mathematics")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className={`studio-engine ${preview.error ? 'failed' : preview.html ? 'ok' : ''}`}>
              {preview.error ? msg("app.syntax.error") : 'KaTeX'}
            </span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="formula-body">
          <div className="formula-compose">
            <div className="formula-editor-switch">
              <button className={editorMode === 'text' ? 'active' : ''} onClick={() => setEditorMode('text')}>
                <Type size={11} /> {msg("app.code")}
              </button>
              <button
                className={editorMode === 'ast' ? 'active' : ''}
                onClick={() => {
                  setAst(astFromLatex(latex));
                  setEditorMode('ast');
                }}
              >
                <GitBranch size={11} /> AST
              </button>
            </div>
            <div className="formula-mode-row">
              {([
                ['inline', msg("app.inline")],
                ['display', msg("app.display")],
                ['equation', msg("app.equation")],
                ['align', msg("app.align")],
              ] as Array<[FormulaMode, string]>).map(([value, text]) => (
                <button key={value} className={mode === value ? 'active' : ''} onClick={() => setMode(value)}>
                  {text}
                </button>
              ))}
            </div>
            {editorMode === 'ast' ? (
              <FormulaTree
                root={ast}
                onChange={(next) => {
                  setAst(next);
                  setLatex(astToLatex(next));
                }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                className="formula-input"
                value={latex}
                onChange={(event) => setLatex(event.target.value)}
                placeholder={msg("app.type.latex.math.here")}
                spellCheck={false}
              />
            )}
            {mode === 'equation' && (
              <label className="formula-label-row">
                <span>{msg("app.label.optional")}</span>
                <input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="eq:energy" />
              </label>
            )}
            <div className="formula-output">
              <div className="formula-output-label">{msg("app.generated.source")}</div>
              <pre>{wrapFormula(latex, mode, label)}</pre>
            </div>
          </div>

          <div className="formula-preview-pane">
            <div className="formula-preview">
              {preview.error ? (
                <div className="formula-error">
                  <strong>{msg("app.syntax.error")}</strong>
                  <span>{preview.error}</span>
                </div>
              ) : preview.html ? (
                <div className="formula-render" dangerouslySetInnerHTML={{ __html: preview.html }} />
              ) : (
                <div className="formula-placeholder"><Sparkles size={18} /> {msg("app.your.formula.preview.appears.here")}</div>
              )}
            </div>
            <div className="formula-template-row">
              <span>{msg("app.templates")}</span>
              {templates.map((item) => (
                <button key={item.label} onClick={() => setLatex(item.latex)} title={item.latex}>{msg.text(item.label)}</button>
              ))}
            </div>
            {recent.length > 0 && (
              <div className="formula-recent">
                <span>{msg("app.recent")}</span>
                {recent.map((item) => (
                  <button key={item} onClick={() => setLatex(item)} title={item}>{item.slice(0, 34)}</button>
                ))}
              </div>
            )}
          </div>

          <aside className="formula-symbols">
            <div className="pane-label"><Sigma size={12} /> {msg("app.symbols")}</div>
            <div className="formula-symbol-scroll">
              <div className="formula-symbol-group variant-group">
                <div className="variant-head">
                  <span>{msg("app.letter.variants")}</span>
                  <select value={variantStyle.id} onChange={(event) => setVariantStyle(variantStyles.find((item) => item.id === event.target.value) || variantStyles[0])}>
                    {variantStyles.map((style) => <option key={style.id} value={style.id}>{msg.text(style.label)}</option>)}
                  </select>
                </div>
                <div className="formula-variant-grid">
                  {variantGlyphs.map((item) => (
                    <button key={item.letter} onClick={() => insertAtCursor(item.latex)} title={item.latex} dangerouslySetInnerHTML={{ __html: item.html }} />
                  ))}
                </div>
              </div>
              {symbolGroups.map((group) => (
                <div className="formula-symbol-group" key={group.name}>
                  <div>{msg.text(group.name)}</div>
                  <div className="formula-symbol-grid">
                    {group.symbols.map(([command, glyph]) => (
                      <button key={command} onClick={() => insertAtCursor(command)} title={command}>
                        {glyph}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.click.a.symbol.to.insert.it.at.the.caret")}</span>
          <div className="spacer" />
          <button
            className="secondary-btn"
            onClick={async () => {
              try { await navigator.clipboard.writeText(wrapFormula(latex, mode, label)); } catch { /* ignore */ }
            }}
            disabled={!latex.trim()}
          >
            <Copy size={13} /> {msg("app.copy.source")}
          </button>
          <button className="primary-btn" onClick={insertIntoDocument} disabled={!latex.trim() || Boolean(preview.error)}>
            <Check size={13} /> {msg("app.insert.formula")}
          </button>
        </footer>
      </section>
    </div>
  );
}
