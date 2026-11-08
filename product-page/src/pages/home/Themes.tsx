import { useState } from 'react';
import { Segmented, theme } from 'antd';
import { CompareSlider } from '@/components/CompareSlider';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalize } from '@/i18n';

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
  {
    title: '聚焦模式',
    src: '/shots/focus.jpg',
    desc: '除当前段落外全部淡出，只留下一段正在写的字；状态栏会亮起「专注」。',
  },
  {
    title: '打字机模式',
    src: '/shots/typewriter.jpg',
    desc: '光标固定在视线中央，页面随输入滚动，而不是视线跟着光标跑。',
  },
  {
    title: '纸面留白',
    src: '/shots/theme-paper.jpg',
    desc: '正文按版心宽度排版，两侧留白，接近印刷后的阅读比例。',
  },
];

export function Themes() {
  const localize = useLocalize();
  const themes = localize(THEMES);
  const modes = localize(MODES);
  const { token } = theme.useToken();
  const [active, setActive] = useState<ThemeKey>('studio');
  const current = themes.find((item) => item.key === active) ?? themes[0];

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
            options={themes.map((item) => ({ label: item.label, value: item.key }))}
          />
        </div>

        <div className="theme-stage">
          <ScreenshotFrame
            key={current.key}
            src={current.src}
            alt={current.label}
            caption={current.desc}
            width={1600}
            height={1152}
          />
        </div>

        <ul className="mode-list">
          {modes.map((mode) => (
            <li className="mode-item" key={mode.title}>
              <img
                className="mode-thumb"
                src={mode.src}
                alt={mode.title}
                loading="lazy"
                style={{ borderColor: token.colorBorderSecondary }}
              />
              <div className="mode-body">
                <h3 className="mode-title" style={{ color: token.colorTextHeading }}>
                  {mode.title}
                </h3>
                <p className="mode-desc" style={{ color: token.colorTextSecondary }}>
                  {mode.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <figure className="theme-compare">
          <figcaption className="theme-compare-label">拖动分割线，对比 Studio 与 Night</figcaption>
          <CompareSlider
            leftSrc="/shots/theme-studio.jpg"
            rightSrc="/shots/theme-night.jpg"
            leftLabel="Studio"
            rightLabel="Night"
            alt="同一份文档的两种主题"
            width={1600}
            height={1152}
          />
        </figure>
      </div>
    </section>
  );
}
