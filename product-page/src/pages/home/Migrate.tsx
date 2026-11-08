import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { useT, useLocalize } from '@/i18n';

const PATHS = [
  {
    key: 'overleaf',
    from: '在线协作 / Overleaf',
    keep: '工程还是那个工程：main.tex、.bib、图片目录原样拿回来，主文件自动识别。',
    gain: '本地编译不再等队列；Git 面板直接提交，想推回远端也行。',
    doc: { label: '工程与文件', to: '/docs/project' },
  },
  {
    key: 'markdown',
    from: 'Markdown / Typst 笔记',
    keep: '导入时把标题层级、公式、表格、列表换成对应的 LaTeX 结构，剩下的正文照抄。',
    gain: '同一份稿子既能继续用 Markdown 写，也能直接编译成投稿用的 PDF。',
    doc: { label: '导入、模板与素材', to: '/docs/import' },
  },
  {
    key: 'ide',
    from: '传统 LaTeX IDE',
    keep: '不用改导言区，也不用换编译命令：仍然由 latexmk 驱动，pdflatex / xelatex / lualatex 都在。',
    gain: '多了正文内的可视化、双向定位与写作模式；快捷键有一张对照表。',
    doc: { label: '快捷键', to: '/docs/shortcuts' },
  },
] as const;

export function Migrate() {
  const localize = useLocalize();
  const t = useT();
  const paths = localize(PATHS);
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <section className="section section-alt" id="migrate">
      <div className="shell">
        <SectionHeading
          eyebrow="迁移"
          title="从哪来，都只搬一次"
          description="三条常见路径：没人要求你重写导言区，也没有导入配额。"
        />

        <div className="path-list">
          {paths.map((path, index) => (
            <Reveal key={path.key} className="path-row" delay={index * 60}>
              <div className="path-from">
                <span className="path-label" style={{ color: token.colorTextTertiary }}>
                  {t('从')}
                </span>
                <h3 className="path-title" style={{ color: token.colorTextHeading }}>
                  {path.from}
                </h3>
              </div>
              <div className="path-body">
                <p className="path-line" style={{ color: token.colorText }}>
                  {path.keep}
                </p>
                <p className="path-line path-gain" style={{ color: token.colorTextSecondary }}>
                  {path.gain}
                </p>
              </div>
              <Button
                type="link"
                className="path-link"
                onClick={() => navigate(path.doc.to)}
                iconPlacement="end"
                icon={<ArrowRightOutlined />}
              >
                {t(path.doc.label)}
              </Button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
