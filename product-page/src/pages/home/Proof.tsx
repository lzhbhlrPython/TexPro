import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { SITE_LINKS } from '@/config/constants';
import { CLAIMS } from '@/data/claims';
import { MCP_METRIC } from '@/data/site';
import { useMessages } from '@/i18n';

const REPO = SITE_LINKS.repo.replace(/\/$/, '');

/** 首屏四个数字的出处：与引用共用同一张表，编号 [7]–[10]。 */
const FIGURES = [
  {
    source: 'tests/',
    figure: '158',
    text: "site.metrics.regression.details",
    href: `${REPO}/tree/main/tests`,
  },
  {
    source: 'electron/',
    figure: '106',
    text: "site.ipc.channels.100.requests.and.6.event.types",
    href: `${REPO}/blob/main/electron/preload.cjs`,
  },
  {
    source: 'Releases',
    figure: '8',
    text: "site.installers.per.nightly.build.all.three.platforms.from.the.variant2",
    href: SITE_LINKS.releases,
  },
  {
    source: 'mcp/server.mjs',
    figure: MCP_METRIC.value,
    text: MCP_METRIC.description,
    to: '/docs/mcp',
  },
];

export function Proof() {
  const msg = useMessages();

  return (
    <section className="section section-proof" id="proof">
      <div className="shell">
        <SectionHeading
          eyebrow="site.evidence"
          title="site.the.parts.you.can.verify"
          description="site.every.superscript.on.this.page.points.back.here.the"
        />

        <Reveal>
          <ol className="ref-table">
            {CLAIMS.map((claim, index) => (
              <li className="ref-row" id={`ref-${index + 1}`} key={claim.id}>
                <a className="ref-line" href={claim.href} target="_blank" rel="noreferrer">
                  <span className="ref-num">[{index + 1}]</span>
                  <span className="ref-source">{claim.file}</span>
                  <span className="ref-text">{msg.text(claim.note)}</span>
                </a>
              </li>
            ))}

          {FIGURES.map((row, index) => {
            const number = CLAIMS.length + index + 1;
            const body = (
              <>
                <span className="ref-num">[{number}]</span>
                <span className="ref-source">{row.source}</span>
                <span className="ref-text">
                  <span className="proof-figure">{row.figure}</span>
                  {msg.text(row.text)}
                </span>
              </>
            );

            return (
              <li className="ref-row" id={`ref-${number}`} key={row.source}>
                {row.to ? (
                  <Link className="ref-line" to={row.to}>
                    {body}
                  </Link>
                ) : (
                  <a className="ref-line" href={row.href} target="_blank" rel="noreferrer">
                    {body}
                  </a>
                )}
              </li>
            );
          })}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
