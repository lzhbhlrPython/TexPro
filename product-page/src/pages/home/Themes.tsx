import { useState } from 'react';
import { Col, Row, Segmented, Typography, theme } from 'antd';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { SectionHeading } from '@/components/SectionHeading';

const { Text } = Typography;

type ThemeKey = 'studio' | 'night' | 'paper';

const THEMES: { key: ThemeKey; label: string; src: string; desc: string }[] = [
  {
    key: 'studio',
    label: 'Studio',
    src: '/shots/theme-studio.jpg',
    desc: '暖白纸面，白天写长文默认的光线；侧栏压暗，正文永远是主角。',
  },
  {
    key: 'night',
    label: 'Night',
    src: '/shots/theme-night.jpg',
    desc: '整窗暗色，深夜改稿不刺眼；公式与图表保持原有对比度。',
  },
  {
    key: 'paper',
    label: 'Paper',
    src: '/shots/theme-paper.jpg',
    desc: '米黄纸色，像摊开的一页旧稿，长时间阅读更松弛。',
  },
];

const MODES = [
  { title: '聚焦模式', desc: '除当前段落外全部淡出，只留下一行正在写的字。' },
  { title: '打字机模式', desc: '光标固定在视线中央，页面随输入滚动，而不是视线跟着跑。' },
  { title: '纸面留白', desc: '正文按版心宽度排版，两侧留白，接近印刷后的阅读比例。' },
];

export function Themes() {
  const { token } = theme.useToken();
  const [active, setActive] = useState<ThemeKey>('studio');
  const current = THEMES.find((item) => item.key === active) ?? THEMES[0];

  return (
    <section className="section" id="themes">
      <div className="shell">
        <SectionHeading
          eyebrow="写作"
          title="同一份文档，三种光线"
          description="主题只改变界面与纸面底色，不改动 LaTeX 内容；切换后重新编译即可。"
        />

        <div className="theme-switch">
          <Segmented
            value={active}
            onChange={(value) => setActive(value as ThemeKey)}
            options={THEMES.map((item) => ({ label: item.label, value: item.key }))}
          />
        </div>

        <div className="theme-stage">
          <ScreenshotFrame
            key={current.key}
            src={current.src}
            alt={`${current.label} 主题下的编辑界面`}
            caption={current.desc}
            width={1600}
            height={1152}
          />
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
          {MODES.map((mode) => (
            <Col xs={24} md={8} key={mode.title}>
              <div
                className="mini-card"
                style={{ borderColor: token.colorBorderSecondary, borderRadius: token.borderRadiusLG }}
              >
                <Text strong>{mode.title}</Text>
                <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 13 }}>
                  {mode.desc}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
