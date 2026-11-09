import { theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { Reveal } from '@/components/Reveal';
import { useLocalize, useT } from '@/i18n';

const LIMITS = [
  {
    topic: '在线协作',
    title: '不做账号与权限',
    desc: '局域网协作只校验房间码，同一网络里拿到房间码就能加入；它不适合跨团队审稿。真要多人编辑，请走 Git 或 Overleaf。',
  },
  {
    topic: '移动端',
    title: '不做手机 App',
    desc: '编译依赖本机 TeX 发行版与 latexmk，手机上跑不动完整工具链。目前只有桌面版：macOS、Windows、Linux。',
  },
  {
    topic: 'WYSIWYG',
    title: '不做藏起源码的编辑器',
    desc: '可视层是投影，源码始终是文档原件；复杂宏、未知模板、不支持的结构一律回退源码，不会替你改写导言区。',
  },
  {
    topic: '云服务',
    title: '不做账号体系与云同步',
    desc: '没有服务端，也就没有登录、额度与同步冲突；备份、历史与回收站都在本地磁盘上，删了就是删了。',
  },
];

/** 反向营销：把边界讲清楚，比再堆三个卖点更有用。 */
export function Limits() {
  const localize = useLocalize();
  const t = useT();
  const rows = localize(LIMITS);
  const { token } = theme.useToken();

  return (
    <section className="section section-limits" id="limits">
      <div className="shell">
        <SectionHeading
          eyebrow="它不做什么"
          title="先说清楚边界，再谈能力"
          description="下面四件事是刻意不做的。知道一个工具在哪里停手，比知道它能做什么更重要。"
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
                    {t(row.title)}
                  </strong>
                  {t(row.desc)}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
