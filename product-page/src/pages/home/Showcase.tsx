import { CheckOutlined } from '@ant-design/icons';
import { Typography, theme } from 'antd';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalize } from '@/i18n';

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
    height: 976,
  },
  {
    id: 'diagram',
    kicker: '绘图',
    title: '正文原位预览，复杂绘图进入工作台',
    desc: '乐谱、曲线和图示仍在正文中预览。需要多区域操作时，电路、逻辑门和结构式使用完整画布，完成后返回此前的写作位置。',
    bullets: ['MusiXTeX 乐谱预览', 'pgfplots 曲线在正文里成形', 'TikZ 电路 / 逻辑图可视化编辑'],
    src: '/shots/diagram.jpg',
    alt: '电路工作台：元件栏、完整画布、检查器与实际 TeX 预览',
    caption: '独立绘图任务使用共享工作台，返回正文继续写作',
    width: 1600,
    height: 976,
  },
  {
    id: 'extensions', kicker: '扩展', title: '按需扩展，保留自己的写作方式',
    desc: '从可信作者安装本地插件包和主题包。命令、补全、检查和工具接入既有流程；主题可定制字体、布局和样式，启用前明确查看能力与风险。',
    bullets: ['自行分发和手动更新，无公开市场', '修改提案经确认后应用，保留撤销', '原生菜单重置与安全模式恢复'],
    src: '/shots/extensions.jpg', alt: '本地扩展管理：已安装包、能力、配置与代码及主题风险提示',
    caption: '真实应用中的本地插件与主题管理；仅启用可信来源', width: 1600, height: 1003,
  },
];

export function Showcase() {
  const localize = useLocalize();
  const items = localize(ITEMS);
  const { token } = theme.useToken();

  return (
    <section className="section section-alt" id="showcase" style={{ background: token.colorFillQuaternary }}>
      <div className="shell">
        <SectionHeading
          eyebrow="场景"
          title="它看起来像编辑器，用起来像排版系统"
          description="以下均为真实应用截图，展示正文编辑、专业画布与本地扩展。"
        />

        <div className="showcase-list">
          {items.map((item, index) => (
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
