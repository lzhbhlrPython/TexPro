import { useState } from 'react';
import { theme } from 'antd';
import { CodeHighlight } from '@/components/CodeHighlight';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { useMessages } from '@/i18n';

const SOURCE = [
  { line: 12, text: '\\section{Methods}' },
  { line: 13, text: 'We evaluate on three datasets.' },
  { line: 14, text: '\\begin{table}[ht]' },
  { line: 15, text: '  \\input{tables/bench.tex}' },
  { line: 16, text: '\\end{table}' },
  { line: 17, text: 'The results are shown in Table~\\ref{tab:bench}.' },
  { line: 18, text: '\\bibliography{refs}' },
];

const DIAGNOSTICS = [
  {
    line: 15,
    level: 'error',
    message: 'LaTeX Error: File `tables/bench.tex\' not found.',
    hint: "site.paths.are.relative.to.the.main.file.either.point",
  },
  {
    line: 18,
    level: 'warning',
    message: 'Package biblatex Warning: Please rerun LaTeX.',
    hint: "site.references.land.in.the.pdf.on.the.second.pass",
  },
  {
    line: 17,
    level: 'warning',
    message: 'Reference `tab:bench\' on page 3 undefined.',
    hint: "site.the.label.is.defined.inside.tables.bench.tex.fix",
  },
];

/** 错误现场：左边坏掉的源码，右边是真实的诊断面板，点一条跳到对应行。 */
export function Failure() {
  const msg = useMessages();
  const { token } = theme.useToken();
  const [active, setActive] = useState(0);
  const current = DIAGNOSTICS[active];

  return (
    <section className="section section-failure" id="failure">
      <div className="shell">
        <SectionHeading
          eyebrow="site.when.it.breaks"
          title="site.an.error.should.not.be.a.wall.of.log"
          description="site.when.a.build.fails.problems.are.sorted.by.file"
        />

        <div className="failure-grid">
          <Reveal className="failure-source" style={{ borderColor: token.colorBorderSecondary }}>
            <div className="failure-bar" style={{ background: token.colorFillQuaternary }}>
              <span>main.tex</span>
              <span>{msg("site.line.1.column.1")}</span>
            </div>
            <ol className="failure-lines">
              {SOURCE.map((row) => (
                <li
                  key={row.line}
                  className={row.line === current.line ? 'is-active' : undefined}
                >
                  <span className="failure-no" style={{ color: token.colorTextTertiary }}>
                    {row.line}
                  </span>
                  <CodeHighlight text={row.text} language="tex" />
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal className="failure-panel" delay={60}>
            <div className="failure-title" style={{ color: token.colorTextTertiary }}>
              {msg("site.problems")} · {DIAGNOSTICS.length}
            </div>
            <ul className="failure-list">
              {DIAGNOSTICS.map((item, index) => (
                <li key={msg.text(item.message)}>
                  <button
                    type="button"
                    className={`failure-item${index === active ? ' is-active' : ''}`}
                    onClick={() => setActive(index)}
                    style={{ borderColor: index === active ? token.colorPrimary : token.colorBorderSecondary }}
                  >
                    <div className="failure-item-head">
                      <span className={`diag-tag diag-${item.level}`}>
                        {item.level === 'error' ? msg("site.error") : msg("site.warning")}
                      </span>
                      <span className="failure-line" style={{ color: token.colorTextTertiary }}>
                        main.tex:{item.line}
                      </span>
                    </div>
                    <p className="failure-message" style={{ color: token.colorText }}>
                      {msg.text(item.message)}
                    </p>
                    {index === active ? (
                      <p className="failure-hint" style={{ color: token.colorTextSecondary }}>
                        {msg.text(item.hint)}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
