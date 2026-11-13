import type { ReactNode } from 'react';
import {
  AimOutlined,
  ColumnWidthOutlined,
  EditOutlined,
  FunctionOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalizedFields } from '@/i18n';
import { ClaimRef } from '@/components/ClaimFootnote';

interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
  claim: string;
}

const FEATURES: Feature[] = [
  {
    icon: <EditOutlined />,
    title: "site.in.place.visual.editing",
    desc: "site.formulas.tables.tikz.figures.and.scores.render.in.place",
    claim: 'visual',
  },
  {
    icon: <ColumnWidthOutlined />,
    title: "site.paper.like.writing",
    desc: "site.focus.mode.dims.everything.but.the.current.paragraph.typewriter",
    claim: 'writing',
  },
  {
    icon: <ThunderboltOutlined />,
    title: "site.project.aware.compiling",
    desc: "site.detects.the.main.file.drives.pdflatex.xelatex.lualatex.through",
    claim: 'compile',
  },
  {
    icon: <AimOutlined />,
    title: "site.two.way.synctex.variant2",
    desc: "site.click.in.the.pdf.to.locate.the.source.press",
    claim: 'synctex',
  },
  {
    icon: <FunctionOutlined />,
    title: "site.scores.and.figures",
    desc: "site.musixtex.scores.pgfplots.curves.and.tikz.circuits.all.have",
    claim: 'music',
  },
  {
    icon: <TeamOutlined />,
    title: "site.collaboration.and.extensibility",
    desc: "site.git.overleaf.workflows.content.addressed.snapshots.lan.collaboration.an",
    claim: 'mcp',
  },
];

export function Capabilities() {
  const localize = useLocalizedFields();
  const features = localize(FEATURES, ["title","desc"]);
  const { token } = theme.useToken();

  return (
    <section className="section" id="capabilities">
      <div className="shell">
        <SectionHeading
          eyebrow="site.capabilities"
          title="site.write.on.the.left.typeset.on.the.right.no"
          description="site.six.things.decide.how.writing.feels.every.day.editing"
        />

        <div className="feature-grid">
          {features.map((feature, index) => (
            <Reveal className="feature-item" key={feature.title} delay={index * 60}>
              <span className="feature-icon" aria-hidden="true" style={{ color: token.colorPrimary }}>
                {feature.icon}
              </span>
              <h3 className="feature-title" style={{ color: token.colorTextHeading }}>
                {feature.title}
              </h3>
              <p className="feature-desc" style={{ color: token.colorTextSecondary }}>
                {feature.desc}
                <ClaimRef id={feature.claim} />
              </p>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
