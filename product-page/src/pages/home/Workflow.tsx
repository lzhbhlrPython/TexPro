import { CheckCircleFilled, SyncOutlined } from '@ant-design/icons';
import { Col, Grid, Row, Steps, Typography, theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalizedFields, useMessages } from '@/i18n';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const STEPS = [
  {
    title: "site.open.the.project",
    description: "site.the.tree.the.main.file.the.symbol.index.and",
  },
  {
    title: "site.write.directly",
    description: "site.the.visual.layer.handles.layout.the.source.layer.keeps",
  },
  {
    title: "site.compile.once",
    description: "site.incremental.latexmk.builds.duration.warnings.and.the.full.log",
  },
  {
    title: "site.click.the.pdf.land.in.source",
    description: "site.two.way.synctex.click.in.the.pdf.and.the",
  },
];

const STATUS_ITEMS = [
  { icon: <CheckCircleFilled />, label: "site.pdf.ready.2.0.s", tone: 'success' as const },
  { icon: <SyncOutlined />, label: 'xelatex', tone: 'default' as const },
  { icon: <CheckCircleFilled />, label: "site.synctex.on", tone: 'success' as const },
  { icon: <CheckCircleFilled />, label: "site.no.errors", tone: 'success' as const },
];

const NOTES = [
  {
    title: "site.compiling.never.blocks.writing",
    desc: "site.builds.run.in.the.background.while.you.keep.typing",
  },
  {
    title: "site.stale.results.never.land.in.a.new.project",
    desc: "site.switch.projects.or.recompile.and.late.async.results.are",
  },
  {
    title: "site.everything.is.reversible",
    desc: "site.edits.moves.and.deletes.leave.content.addressed.snapshots.roll",
  },
];

export function Workflow() {
  const localize = useLocalizedFields();
  const msg = useMessages();
  const steps = localize(STEPS, ["title","description"]);
  const statusItems = localize(STATUS_ITEMS, ["label"]);
  const notes = localize(NOTES, ["title","desc"]);
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const horizontal = Boolean(screens.lg);

  return (
    <section className="section" id="workflow">
      <div className="shell">
        <SectionHeading
          eyebrow="site.workflow"
          title="site.from.opening.a.project.to.that.one.line.in"
          description="site.no.habits.to.relearn.still.main.tex.still.latexmk"
        />

        <div style={{ marginTop: 40 }}>
          <Steps
            current={3}
            responsive={false}
            orientation={horizontal ? 'horizontal' : 'vertical'}
            items={steps.map((step) => ({
              title: step.title,
              content: step.description,
            }))}
          />
        </div>

        <div
          className="status-bar"
          style={{
            background: token.colorFillQuaternary,
            borderColor: token.colorBorderSecondary,
            borderRadius: token.borderRadiusLG,
            marginTop: 40,
          }}
        >
          <div className="status-left">
            {statusItems.map((item) => (
              <span
                key={item.label}
                className="status-item"
                style={{ color: item.tone === 'success' ? token.colorSuccess : token.colorTextSecondary }}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>
          <div className="status-right">
            <Text type="secondary" style={{ fontSize: 12 }}>
              {msg("site.line.1.col.1.420.words")}
            </Text>
          </div>
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 40 }}>
          {notes.map((item) => (
            <Col xs={24} md={8} key={item.title}>
              <div className="mini-block" style={{ borderLeftColor: token.colorBorderSecondary }}>
                <Text strong>{item.title}</Text>
                <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 13 }}>
                  {item.desc}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
