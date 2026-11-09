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
import { useLocalize } from '@/i18n';
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
    title: '原地可视编辑',
    desc: '公式、表格、TikZ、插图与乐谱在正文里直接出版面效果；点一下回到源码，改完再点回来。',
    claim: 'visual',
  },
  {
    icon: <ColumnWidthOutlined />,
    title: '纸面感写作',
    desc: '聚焦模式只留当前段落，打字机模式把光标稳在视线中间，长文写作不被面板打断。',
    claim: 'writing',
  },
  {
    icon: <ThunderboltOutlined />,
    title: '工程感知编译',
    desc: '自动识别主文件，latexmk 驱动 pdflatex / XeLaTeX / LuaLaTeX；错误进诊断面板，点一条就跳到出错行。',
    claim: 'compile',
  },
  {
    icon: <AimOutlined />,
    title: '双向 SyncTeX',
    desc: 'PDF 上单击定位源码，源码里 Shift+Cmd+J 定位版面；页码、行列与同步状态都在底部状态栏。',
    claim: 'synctex',
  },
  {
    icon: <FunctionOutlined />,
    title: '乐谱与图形工坊',
    desc: 'MusiXTeX 乐谱、pgfplots 曲线、TikZ 电路与逻辑图都有可视化面板，编辑时即时预览。',
    claim: 'music',
  },
  {
    icon: <TeamOutlined />,
    title: '协作与可扩展',
    desc: 'Git / Overleaf 工作流、内容寻址快照、局域网实时协作；对外提供 MCP server 与只读 Paper API。',
    claim: 'mcp',
  },
];

export function Capabilities() {
  const localize = useLocalize();
  const features = localize(FEATURES);
  const { token } = theme.useToken();

  return (
    <section className="section" id="capabilities">
      <div className="shell">
        <SectionHeading
          eyebrow="能力"
          title="写作在左，排版在右，中间没有来回切换"
          description="六件事决定了你每天写论文的手感：编辑、写作模式、编译、定位、绘图与协作。"
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
