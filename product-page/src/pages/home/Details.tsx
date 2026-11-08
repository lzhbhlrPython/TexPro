import { theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalize } from '@/i18n';

const DETAILS = [
  {
    kicker: '占位符',
    title: '缺的那一步，留在原位',
    desc: '按 ⌘⇧H 就地插占位符（图 / 表 / 引用 / 数据），草稿 PDF 里留框、清单里可跳回；⌘⇧N 的修订备忘写进注释，读稿的人和 PDF 都不会被打断。',
  },
  {
    kicker: 'CTeX',
    title: '中文排版，一条命令',
    desc: '两字缩进、全角标点、1.3 倍行距写进主文件，字体与文档类保持作者原样；子文件位置不变，随时可撤销。',
  },
];

/** 写作链路上的两件小事：不属于「能力」，单独用两行说明，与证据区同一套排版 */
export function Details() {
  const localize = useLocalize();
  const items = localize(DETAILS);
  const { token } = theme.useToken();

  return (
    <section className="section section-details" id="details">
      <div className="shell">
        <SectionHeading
          eyebrow="小巧思"
          title="把打断写作的地方，各挪开一次"
          description="不是新面板，也不是新流程：缺的东西留在段落里，排版交给一条命令，然后接着往下写。"
        />

        <div className="details-grid">
          {items.map((item) => (
            <article className="details-note" key={item.title}>
              <span className="details-kicker" style={{ color: token.colorTextTertiary }}>
                {item.kicker}
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
