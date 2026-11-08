import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { SITE_LINKS } from '@/config/constants';
import { useLocalize } from '@/i18n';

const REPO = SITE_LINKS.repo.replace(/\/$/, '');

/**
 * 一行一条，像工程附录：左边是出处，右边是那句结论。
 * 数字写在句子里，不做数字墙。
 */
const RECORDS = [
  {
    source: 'tests/',
    figure: '89',
    text: '条回归用例，14 个文件：主文件判定、SyncTeX 坐标、历史快照、保存与退出。',
    href: `${REPO}/tree/main/tests`,
  },
  {
    source: 'electron/',
    figure: '87',
    text: '个 IPC 通道，preload 与主进程逐条对应，读写都先过工程根目录白名单。',
    href: `${REPO}/blob/main/electron/preload.cjs`,
  },
  {
    source: 'Releases',
    figure: '16',
    text: '个安装包 / 次夜构，三个平台来自同一份 main。',
    href: SITE_LINKS.releases,
  },
  {
    source: 'docs/',
    figure: '21 × 2',
    text: '篇文档，每篇都有中文与英文两版；缺译文时回落中文并在页头注明。',
    to: '/docs',
  },
];

export function Proof() {
  const localize = useLocalize();
  const rows = localize(RECORDS);

  return (
    <section className="section section-proof" id="proof">
      <div className="shell">
        <SectionHeading
          eyebrow="证据"
          title="可以核对的部分"
          description="下面几行来自当前仓库与最近一次夜间构建，不是估算。"
        />

        <div className="proof-list">
          {rows.map((row, index) => (
            <Reveal className="proof-row" key={row.source} delay={index * 60}>
              {row.to ? (
                <Link className="proof-link" to={row.to}>
                  <span className="proof-source">{row.source}</span>
                  <span className="proof-text">
                    <strong className="proof-figure">{row.figure}</strong>
                    {row.text}
                  </span>
                </Link>
              ) : (
                <a className="proof-link" href={row.href} target="_blank" rel="noreferrer">
                  <span className="proof-source">{row.source}</span>
                  <span className="proof-text">
                    <strong className="proof-figure">{row.figure}</strong>
                    {row.text}
                  </span>
                </a>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
