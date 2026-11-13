import { CheckOutlined, CloseOutlined, FolderOpenOutlined, FilePdfOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { useMessages, useLocalizedFields } from '@/i18n';

const NODES = [
  {
    key: 'disk',
    icon: <FolderOpenOutlined />,
    title: "site.your.project",
    detail: "site.main.tex.bib.images.and.sub.folders.right.where",
    tag: "site.disk",
  },
  {
    key: 'compile',
    icon: <ThunderboltOutlined />,
    title: "site.local.latexmk",
    detail: "site.pdflatex.xelatex.lualatex.incremental.with.synctex.1",
    tag: "site.local.process",
  },
  {
    key: 'pdf',
    icon: <FilePdfOutlined />,
    title: "site.pdf.and.preview",
    detail: "site.main.pdf.is.written.back.to.the.project.two",
    tag: "site.disk",
  },
] as const;

const NEVER = ["site.account", "site.upload", "site.telemetry", "site.crash.reports"] as const;

const OPTIONAL = ["site.git.remote", 'Overleaf', 'arXiv', "site.ai.service.you.turn.it.on"] as const;

export function DataFlow() {
  const localize = useLocalizedFields();
  const msg = useMessages();
  const nodes = localize(NODES, ["title","detail","tag"]);
  const never = localize([...NEVER], []);
  const optional = localize([...OPTIONAL], []);
  const { token } = theme.useToken();

  return (
    <section className="section section-local" id="local">
      <div className="shell">
        <SectionHeading
          eyebrow="site.privacy"
          title="site.files.stay.on.your.machine.compiling.runs.on.your"
          description="site.no.server.so.no.failed.syncs.and.no.quotas"
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
            {msg("site.never.appears")}
          </span>
          {never.map((item) => (
            <span className="flow-never-item" key={item} style={{ color: token.colorTextSecondary }}>
              <CloseOutlined style={{ color: token.colorTextQuaternary, fontSize: 11 }} />
              {item}
            </span>
          ))}
        </div>

        <div className="flow-optional" style={{ borderColor: token.colorBorderSecondary }}>
          <span style={{ color: token.colorTextSecondary }}>{msg("site.optional.outbound.connections.all.started.by.you")}</span>
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
