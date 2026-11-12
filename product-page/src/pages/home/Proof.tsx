import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { SITE_LINKS } from '@/config/constants';
import { CLAIMS } from '@/data/claims';
import { DOC_METRIC } from '@/data/documentation';
import { useT } from '@/i18n';

const REPO = SITE_LINKS.repo.replace(/\/$/, '');

/** 首屏四个数字的出处：与引用共用同一张表，编号 [7]–[10]。 */
const FIGURES = [
  {
    source: 'tests/',
    figure: '137',
    text: '条回归用例，21 个文件：主文件判定、SyncTeX 坐标、历史快照、保存与退出。',
    href: `${REPO}/tree/main/tests`,
  },
  {
    source: 'electron/',
    figure: '106',
    text: '个 IPC 通道（100 个请求、6 类事件）。',
    href: `${REPO}/blob/main/electron/preload.cjs`,
  },
  {
    source: 'Releases',
    figure: '8',
    text: '个安装包 / 次夜构，三平台同一份 main。',
    href: SITE_LINKS.releases,
  },
  {
    source: 'docs/',
    figure: DOC_METRIC.value,
    text: DOC_METRIC.description,
    to: '/docs',
  },
];

export function Proof() {
  const t = useT();

  return (
    <section className="section section-proof" id="proof">
      <div className="shell">
        <SectionHeading
          eyebrow="证据"
          title="可以核对的部分"
          description="正文里的每个上标都能在这里找到出处：左边是文件，右边是那句结论，编号与正文一一对应。"
        />

        <Reveal>
          <ol className="ref-table">
            {CLAIMS.map((claim, index) => (
              <li className="ref-row" id={`ref-${index + 1}`} key={claim.id}>
                <a className="ref-line" href={claim.href} target="_blank" rel="noreferrer">
                  <span className="ref-num">[{index + 1}]</span>
                  <span className="ref-source">{claim.file}</span>
                  <span className="ref-text">{t(claim.note)}</span>
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
                  {t(row.text)}
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
