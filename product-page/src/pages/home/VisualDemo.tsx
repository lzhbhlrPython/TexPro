import { useState } from 'react';
import { CodeOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Segmented, theme } from 'antd';
import { DEMO_MATH } from '@/components/latexMarkHtml';
import { useT } from '@/i18n';
import { SectionHeading } from '@/components/SectionHeading';

type BlockKey = 'heading' | 'math' | 'table';

const ENERGY_TEX = 'E=mc^2+\\frac{1}{2}mv^2';

const TABLE_ROWS = [
  ['pdfLaTeX', '1.8', '0.9'],
  ['XeLaTeX', '2.4', '1.2'],
  ['LuaLaTeX', '2.1', '1.1'],
];

const TABLE_SOURCE = [
  '\\begin{tabular}{lrr}',
  '  Engine & First run (s) & Warm run (s) \\\\',
  '  pdfLaTeX & 1.8 & 0.9 \\\\',
  '  XeLaTeX & 2.4 & 1.2 \\\\',
  '  LuaLaTeX & 2.1 & 1.1 \\\\',
  '\\end{tabular}',
].join('\n');

/**
 * 「视面 ↔ 源码」演示：点哪一块，哪一块翻回对应的 LaTeX 源码。
 * 所有排版结果都是构建期预渲染的静态 HTML，页面不加载 KaTeX 运行时。
 */
export function VisualDemo() {
  const t = useT();
  const { token } = theme.useToken();
  const [blocks, setBlocks] = useState<Record<BlockKey, boolean>>({
    heading: false,
    math: false,
    table: false,
  });
  const [showAll, setShowAll] = useState<'render' | 'source'>('render');

  const flipped = (key: BlockKey) => showAll === 'source' || blocks[key];

  const toggle = (key: BlockKey) => {
    if (showAll === 'source') {
      setShowAll('render');
      setBlocks((prev) => ({ ...prev, [key]: true }));
      return;
    }
    setBlocks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const codeStyle = {
    margin: 0,
    padding: '12px 14px',
    borderRadius: 6,
    background: token.colorFillQuaternary,
    fontFamily: 'var(--mono)',
    fontSize: 12.5,
    lineHeight: 1.75,
    color: token.colorTextSecondary,
    whiteSpace: 'pre-wrap' as const,
    overflowX: 'auto' as const,
  };

  return (
    <section className="section section-demo" id="demo">
      <div className="shell">
        <SectionHeading
          eyebrow="演示"
          title="点一下，视面就变回源码"
          description="下面是同一份 LaTeX 的三块内容。点标题、公式或表格，它会当场翻成对应的源码；再点一次翻回来。渲染结果由构建期预生成，页面不加载数学库。"
        />

        <div className="demo-grid">
          <div
            className="demo-paper"
            style={{ background: token.colorBgContainer, borderColor: token.colorBorderSecondary }}
          >
            <button type="button" className="demo-block" onClick={() => toggle('heading')}>
              {flipped('heading') ? (
                <pre style={codeStyle}>{'\\section{A quiet writing surface}'}</pre>
              ) : (
                <h3 className="demo-heading" style={{ color: token.colorTextHeading }}>
                  A quiet writing surface
                </h3>
              )}
            </button>

            <p className="demo-p" style={{ color: token.colorText }}>
              {t('光标离开公式，它显示成排版后的数学；点一下又回到源码。行内数学、行间公式和表格都走同一条规则。')}
            </p>

            <button type="button" className="demo-block" onClick={() => toggle('math')}>
              {flipped('math') ? (
                <pre style={codeStyle}>{`\\[ ${ENERGY_TEX} \\]`}</pre>
              ) : (
                <div
                  className="demo-math"
                  style={{ color: token.colorTextHeading }}
                  dangerouslySetInnerHTML={{ __html: DEMO_MATH[ENERGY_TEX] ?? '' }}
                />
              )}
            </button>

            <button type="button" className="demo-block" onClick={() => toggle('table')}>
              {flipped('table') ? (
                <pre style={codeStyle}>{TABLE_SOURCE}</pre>
              ) : (
                <table className="demo-table" style={{ color: token.colorText }}>
                  <thead>
                    <tr>
                      <th>Engine</th>
                      <th>First run (s)</th>
                      <th>Warm run (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TABLE_ROWS.map((row) => (
                      <tr key={row[0]}>
                        {row.map((cell) => (
                          <td key={cell}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </button>
          </div>

          <div className="demo-side">
            <Segmented
              value={showAll}
              onChange={(value) => setShowAll(value as 'render' | 'source')}
              options={[
                { value: 'render', label: t('视面'), icon: <EyeOutlined /> },
                { value: 'source', label: t('源码'), icon: <CodeOutlined /> },
              ]}
            />
            <p className="demo-hint" style={{ color: token.colorTextSecondary }}>
              {t('也可以直接点左边的元素。表格的每一行、公式的每一处，都只是同一份 .tex 的不同呈现。')}
            </p>
            <Button
              onClick={() => {
                setShowAll('render');
                setBlocks({ heading: false, math: false, table: false });
              }}
            >
              {t('全部还原')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
