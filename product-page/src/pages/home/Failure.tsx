import { useState } from 'react';
import { theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { useT } from '@/i18n';

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
    hint: '路径相对主文件：改成 tables/bench 或把文件移回工程目录。',
  },
  {
    line: 18,
    level: 'warning',
    message: 'Package biblatex Warning: Please rerun LaTeX.',
    hint: '第二次编译才会把引用写进 PDF，重新编译即可。',
  },
  {
    line: 17,
    level: 'warning',
    message: 'Reference `tab:bench\' on page 3 undefined.',
    hint: '标签在 tables/bench.tex 里定义，先修好上面的缺文件。',
  },
];

/** 错误现场：左边坏掉的源码，右边是真实的诊断面板，点一条跳到对应行。 */
export function Failure() {
  const t = useT();
  const { token } = theme.useToken();
  const [active, setActive] = useState(0);
  const current = DIAGNOSTICS[active];

  return (
    <section className="section section-failure" id="failure">
      <div className="shell">
        <SectionHeading
          eyebrow="出错的时候"
          title="报错不该是一屏日志"
          description="编译失败时，问题按文件、行号和类型排进面板；点一条就跳到出错的源码行。下面这份是真实编译产物的片段。"
        />

        <div className="failure-grid">
          <Reveal className="failure-source" style={{ borderColor: token.colorBorderSecondary }}>
            <div className="failure-bar" style={{ background: token.colorFillQuaternary }}>
              <span>main.tex</span>
              <span>{t('第 1 行，第 1 列')}</span>
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
                  <code style={{ color: token.colorText }}>{row.text}</code>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal className="failure-panel" delay={60}>
            <div className="failure-title" style={{ color: token.colorTextTertiary }}>
              {t('问题')} · {DIAGNOSTICS.length}
            </div>
            <ul className="failure-list">
              {DIAGNOSTICS.map((item, index) => (
                <li key={t(item.message)}>
                  <button
                    type="button"
                    className={`failure-item${index === active ? ' is-active' : ''}`}
                    onClick={() => setActive(index)}
                    style={{ borderColor: index === active ? token.colorPrimary : token.colorBorderSecondary }}
                  >
                    <div className="failure-item-head">
                      <span className={`diag-tag diag-${item.level}`}>
                        {item.level === 'error' ? t('错误') : t('警告')}
                      </span>
                      <span className="failure-line" style={{ color: token.colorTextTertiary }}>
                        main.tex:{item.line}
                      </span>
                    </div>
                    <p className="failure-message" style={{ color: token.colorText }}>
                      {t(item.message)}
                    </p>
                    {index === active ? (
                      <p className="failure-hint" style={{ color: token.colorTextSecondary }}>
                        {t(item.hint)}
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
