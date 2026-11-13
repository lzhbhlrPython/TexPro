import { theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalizedFields, useMessages } from '@/i18n';

const DETAILS = [
  {
    kicker: "site.placeholder",
    title: "site.leave.the.missing.step.in.place",
    desc: "site.press.h.to.drop.a.placeholder.figure.table.citation",
  },
  {
    kicker: 'CTeX',
    title: "site.chinese.typesetting.in.one.command",
    desc: "site.two.character.indent.full.width.punctuation.and.1.3",
  },
];

/** 写作链路上的两件小事：不属于「能力」，单独用两行说明，与证据区同一套排版 */
export function Details() {
  const localize = useLocalizedFields();
  const items = localize(DETAILS, ["kicker","title","desc"]);
  const msg = useMessages();
  const { token } = theme.useToken();

  return (
    <section className="section section-details" id="details">
      <div className="shell">
        <SectionHeading
          eyebrow="site.small.touches"
          title="site.move.each.interruption.out.of.the.way.once"
          description="site.no.new.panel.no.new.workflow.what.is.missing"
        />

        <div className="details-grid">
          {items.map((item) => (
            <article className="details-note" key={item.title}>
              <span className="details-kicker" style={{ color: token.colorTextTertiary }}>
                {msg.text(item.kicker)}
              </span>
              <h3 className="details-title" style={{ color: token.colorTextHeading }}>
                {item.title}
              </h3>
              <p className="details-desc" style={{ color: token.colorTextSecondary }}>
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
