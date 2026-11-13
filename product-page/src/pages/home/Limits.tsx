import { theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { useLocalizedFields, useMessages } from '@/i18n';

const LIMITS = [
  {
    topic: "site.online.collaboration",
    title: "site.no.accounts.no.permissions",
    desc: "site.lan.collaboration.only.checks.a.room.code.anyone.on",
  },
  {
    topic: "site.mobile",
    title: "site.no.mobile.app",
    desc: "site.compiling.needs.a.local.tex.distribution.and.latexmk.a",
  },
  {
    topic: "site.wysiwyg",
    title: "site.no.source.hiding.editor",
    desc: "site.the.visual.layer.is.a.projection.the.source.stays",
  },
  {
    topic: "site.cloud",
    title: "site.no.accounts.no.cloud.sync",
    desc: "site.no.server.means.no.sign.in.quotas.or.sync",
  },
];

/** 反向营销：把边界讲清楚，比再堆三个卖点更有用。 */
export function Limits() {
  const localize = useLocalizedFields();
  const msg = useMessages();
  const rows = localize(LIMITS, ["topic","title","desc"]);
  const { token } = theme.useToken();

  return (
    <section className="section section-limits" id="limits">
      <div className="shell">
        <SectionHeading
          eyebrow="site.what.it.does.not.do"
          title="site.draw.the.boundary.before.the.pitch"
          description="site.four.things.are.deliberately.out.of.scope.knowing.where"
        />

        <div className="proof-list">
          {rows.map((row, index) => (
            <Reveal className="proof-row" key={row.topic} delay={index * 60}>
              <div className="proof-link">
                <span className="proof-source" style={{ color: token.colorTextTertiary }}>
                  {row.topic}
                </span>
                <span className="proof-text" style={{ color: token.colorTextSecondary }}>
                  <strong className="limit-title" style={{ color: token.colorTextHeading }}>
                    {msg.text(row.title)}
                  </strong>
                  {msg.text(row.desc)}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
