import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { useMessages, useLocalizedFields } from '@/i18n';

const PATHS = [
  {
    key: 'overleaf',
    from: "site.online.collaboration.overleaf",
    keep: "site.the.project.stays.the.project.main.tex.bib.and",
    gain: "site.local.builds.no.longer.wait.in.a.queue.commit",
    doc: { label: "site.projects.and.files", to: '/docs/project' },
  },
  {
    key: 'markdown',
    from: "site.markdown.typst.notes",
    keep: "site.import.converts.headings.formulas.tables.and.lists.into.latex",
    gain: "site.keep.writing.in.markdown.or.compile.straight.to.a",
    doc: { label: "site.import.templates.and.assets", to: '/docs/import' },
  },
  {
    key: 'ide',
    from: "site.classic.latex.ides",
    keep: "site.no.preamble.rewrite.no.new.build.command.latexmk.still",
    gain: "site.you.gain.in.place.visuals.two.way.navigation.and",
    doc: { label: "site.shortcuts", to: '/docs/shortcuts' },
  },
] as const;

export function Migrate() {
  const localize = useLocalizedFields();
  const msg = useMessages();
  const paths = localize(PATHS, ["from","keep","gain"]);
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <section className="section section-alt" id="migrate">
      <div className="shell">
        <SectionHeading
          eyebrow="site.switching"
          title="site.wherever.you.come.from.you.move.once"
          description="site.three.common.paths.nobody.asks.you.to.rewrite.the"
        />

        <div className="path-list">
          {paths.map((path, index) => (
            <Reveal key={path.key} className="path-row" delay={index * 60}>
              <div className="path-from">
                <span className="path-label" style={{ color: token.colorTextTertiary }}>
                  {msg("site.from")}
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
                {msg.text(path.doc.label)}
              </Button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
