import { CheckOutlined, CloseOutlined, FolderOpenOutlined, FilePdfOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { useT, useLocalize } from '@/i18n';

const NODES = [
  {
    key: 'disk',
    icon: <FolderOpenOutlined />,
    title: '你的工程',
    detail: 'main.tex、.bib、图片与子目录，就在你放它的地方',
    tag: '磁盘',
  },
  {
    key: 'compile',
    icon: <ThunderboltOutlined />,
    title: '本机 latexmk',
    detail: 'pdflatex / xelatex / lualatex，带 -synctex=1 增量构建',
    tag: '本机进程',
  },
  {
    key: 'pdf',
    icon: <FilePdfOutlined />,
    title: 'PDF 与预览',
    detail: 'main.pdf 写回工程目录，双向定位用的也是它',
    tag: '磁盘',
  },
] as const;

const NEVER = ['账号', '上传', '遥测', '崩溃上报'] as const;

const OPTIONAL = ['Git 远程', 'Overleaf', 'arXiv', 'AI 服务（需你主动开启）'] as const;

export function DataFlow() {
  const localize = useLocalize();
  const t = useT();
  const nodes = localize(NODES);
  const never = localize([...NEVER]);
  const optional = localize([...OPTIONAL]);
  const { token } = theme.useToken();

  return (
    <section className="section section-local" id="local">
      <div className="shell">
        <SectionHeading
          eyebrow="隐私"
          title="文件不出本机，编译在你自己的机器上"
          description="没有服务端，也就没有「同步失败」和「额度用尽」。整条链路只经过三个地方。"
        />

        <div className="flow">
          {nodes.map((node, index) => (
            <Reveal key={node.key} className="flow-step" delay={index * 60}>
              <div
                className="flow-node"
                style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
              >
                <span className="flow-icon" style={{ color: token.colorPrimary }}>
                  {node.icon}
                </span>
                <span className="flow-tag" style={{ color: token.colorTextTertiary }}>
                  {node.tag}
                </span>
                <h3 className="flow-title" style={{ color: token.colorTextHeading }}>
                  {node.title}
                </h3>
                <p className="flow-detail" style={{ color: token.colorTextSecondary }}>
                  {node.detail}
                </p>
              </div>
              {index < NODES.length - 1 && (
                <span className="flow-link" aria-hidden="true" style={{ color: token.colorBorder }}>
                  <svg width="48" height="12" viewBox="0 0 48 12" fill="none">
                    <path d="M0 6h40" stroke="currentColor" strokeWidth="1" />
                    <path d="M40 2l6 4-6 4" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                </span>
              )}
            </Reveal>
          ))}
        </div>

        <div className="flow-never">
          <span className="flow-never-label" style={{ color: token.colorTextSecondary }}>
            {t('全程不出现')}
          </span>
          {never.map((item) => (
            <span className="flow-never-item" key={item} style={{ color: token.colorTextSecondary }}>
              <CloseOutlined style={{ color: token.colorTextQuaternary, fontSize: 11 }} />
              {item}
            </span>
          ))}
        </div>

        <div className="flow-optional" style={{ borderColor: token.colorBorderSecondary }}>
          <span style={{ color: token.colorTextSecondary }}>{t('可选的外连（都要你主动发起）：')}</span>
          <span className="flow-optional-list">
            {optional.map((item) => (
              <span key={item} style={{ color: token.colorText }}>
                <CheckOutlined style={{ color: token.colorPrimary, fontSize: 11, marginInlineEnd: 6 }} />
                {item}
              </span>
            ))}
          </span>
        </div>
      </div>
    </section>
  );
}
