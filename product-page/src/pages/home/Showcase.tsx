import { CheckOutlined } from '@ant-design/icons';
import { Typography, theme } from 'antd';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { SectionHeading } from '@/components/SectionHeading';

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
    kicker: '编辑',
    title: '表格和公式，就在段落中间',
    desc: '光标离开时，tabular 显示成真正的表格，行间公式显示成排版后的数学；点一下又回到源码。加一行、改对齐、删一列都在原位完成，不用在源码和预览之间来回跳。',
    bullets: ['表格原位增删行列、切换对齐', '渲染后的公式点击即回退源码', '导言区折叠成一张「导言卡」'],
    src: '/shots/table.jpg',
    alt: '可视编辑器中的表格：表头、对齐工具条与嵌套公式',
    caption: 'tabular 在正文里直接呈现，工具条就在表格下方',
    width: 1600,
    height: 1119,
  },
  {
    id: 'diagram',
    kicker: '绘图',
    title: '乐谱、曲线和电路图',
    desc: '除了公式，TeXPro 还能把 MusiXTeX 乐谱、pgfplots 坐标系、TikZ 电路与逻辑门渲染成图，并给出对应的可视化面板：改一个音符或电阻，页面里立刻变。',
    bullets: ['MusiXTeX 乐谱预览', 'pgfplots 曲线在正文里成形', 'TikZ 电路 / 逻辑图可视化编辑'],
    src: '/shots/diagram.jpg',
    alt: '同一篇文档中的乐谱、电路图与逻辑门示意图',
    caption: '乐谱、电路与逻辑门在正文中直接渲染',
    width: 1600,
    height: 1152,
  },
];

export function Showcase() {
  const { token } = theme.useToken();

  return (
    <section className="section section-alt" id="showcase" style={{ background: token.colorFillQuaternary }}>
      <div className="shell">
        <SectionHeading
          eyebrow="场景"
          title="它看起来像编辑器，用起来像排版系统"
          description="以下都是真实运行截图：同一份 main.tex，没有经过任何美化。"
        />

        <div className="showcase-list">
          {ITEMS.map((item, index) => (
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
