import { CheckOutlined } from '@ant-design/icons';
import { Typography, theme } from 'antd';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalizedFields } from '@/i18n';

const { Title } = Typography;

interface ShowcaseItem {
  id: string;
  kicker: string;
  title: string;
  desc: string;
  bullets: string[];
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

const ITEMS: ShowcaseItem[] = [
  {
    id: 'table',
    kicker: "site.editing",
    title: "site.tables.and.formulas.right.inside.the.paragraph",
    desc: "site.when.the.caret.leaves.tabular.becomes.a.real.table",
    bullets: ["site.add.or.remove.rows.and.columns.in.place", "site.click.rendered.math.to.get.the.source.back", "site.the.preamble.collapses.into.one.card"],
    src: '/shots/table.jpg',
    alt: "site.a.table.in.the.visual.editor.header.alignment.toolbar",
    caption: "site.tabular.renders.in.place.with.its.toolbar.right.below",
    width: 1600,
    height: 1119,
  },
  {
    id: 'diagram',
    kicker: "site.drawing",
    title: "site.inline.previews.a.workspace.for.complex.diagrams",
    desc: "site.music.plots.and.diagrams.still.preview.in.the.document",
    bullets: ["site.musixtex.score.preview", "site.pgfplots.curves.take.shape.in.the.page", "site.visual.editing.for.tikz.circuits.and.logic.gates"],
    src: '/shots/diagram.jpg',
    alt: "site.circuit.workspace.components.full.canvas.inspector.and.actual.tex",
    caption: "site.dedicated.drawing.tasks.share.a.workspace.and.return.to",
    width: 1600,
    height: 976,
  },
  {
    id: 'extensions', kicker: "site.extensions", title: "site.extend.on.demand.keep.your.writing.flow",
    desc: "site.install.local.extensions.and.themes.from.trusted.authors.commands",
    bullets: ["site.manual.distribution.and.updates.with.no.public.market", "site.accept.proposed.edits.with.undo.preserved", "site.native.reset.command.and.safe.mode.recovery"],
    src: '/shots/extensions.jpg', alt: "site.local.extension.manager.installed.packages.capabilities.configuration.and.code",
    caption: "site.local.packages.and.themes.in.the.real.application.enable", width: 1600, height: 1003,
  },
];

export function Showcase() {
  const localize = useLocalizedFields();
  const items = localize(ITEMS, ["kicker","title","desc","bullets","alt","caption"]);
  const { token } = theme.useToken();

  return (
    <section className="section section-alt" id="showcase" style={{ background: token.colorFillQuaternary }}>
      <div className="shell">
        <SectionHeading
          eyebrow="site.in.use"
          title="site.it.looks.like.an.editor.it.works.like.a"
          description="site.real.application.screenshots.showing.writing.professional.canvases.and.local"
        />

        <div className="showcase-list">
          {items.map((item, index) => (
            <div className={`showcase-row${index % 2 === 1 ? ' is-reversed' : ''}`} key={item.id}>
              <div className="showcase-copy">
                <span className="showcase-kicker" style={{ color: token.colorPrimary }}>
                  {item.kicker}
                </span>
                <Title level={3} style={{ margin: '8px 0 12px', fontSize: 26, lineHeight: '34px' }}>
                  {item.title}
                </Title>
                <p style={{ color: token.colorTextSecondary, margin: 0, fontSize: 15, lineHeight: '26px' }}>
                  {item.desc}
                </p>
                <ul className="showcase-bullets" style={{ color: token.colorText }}>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>
                      <CheckOutlined style={{ color: token.colorPrimary }} />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="showcase-visual">
                <ScreenshotFrame
                  src={item.src}
                  alt={item.alt}
                  caption={item.caption}
                  width={item.width}
                  height={item.height}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
