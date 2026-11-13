import { useState } from 'react';
import { Segmented, theme } from 'antd';
import { CompareSlider } from '@/components/CompareSlider';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { SectionHeading } from '@/components/SectionHeading';
import { useLocalizedFields, useMessages } from '@/i18n';

type ThemeKey = 'studio' | 'night' | 'paper';

const THEMES: { key: ThemeKey; label: string; src: string; desc: string }[] = [
  {
    key: 'studio',
    label: "site.studio",
    src: '/shots/theme-studio.jpg',
    desc: "site.warm.white.paper.the.default.daylight.for.long.writing",
  },
  {
    key: 'night',
    label: "site.night",
    src: '/shots/theme-night.jpg',
    desc: "site.a.dark.window.for.late.edits.formulas.and.figures",
  },
  {
    key: 'paper',
    label: "site.paper",
    src: '/shots/theme-paper.jpg',
    desc: "site.a.cream.paper.tone.like.an.old.page.left",
  },
];

const MODES = [
  {
    title: "site.focus.mode",
    src: '/shots/focus.jpg',
    desc: "site.everything.but.the.current.paragraph.fades.out.the.status",
  },
  {
    title: "site.typewriter.mode",
    src: '/shots/typewriter.jpg',
    desc: "site.the.caret.stays.at.eye.level.and.the.page",
  },
  {
    title: "site.paper.margins",
    src: '/shots/theme-paper.jpg',
    desc: "site.text.sits.in.a.measured.column.with.real.margins",
  },
];

export function Themes() {
  const localize = useLocalizedFields();
  const msg = useMessages();
  const themes = localize(THEMES, ["label","desc"]);
  const modes = localize(MODES, ["title","desc"]);
  const { token } = theme.useToken();
  const [active, setActive] = useState<ThemeKey>('studio');
  const current = themes.find((item) => item.key === active) ?? themes[0];

  return (
    <section className="section" id="themes">
      <div className="shell">
        <SectionHeading
          eyebrow="site.writing"
          title="site.one.document.three.kinds.of.light"
          description="site.themes.only.change.the.interface.and.paper.colour.never"
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
            height={1003}
          />
        </div>

        <ul className="mode-list">
          {modes.map((mode) => (
            <li className="mode-item" key={mode.title}>
              <img
                className="mode-thumb"
                src={`${import.meta.env.BASE_URL}${mode.src.replace(/^\//, '')}`}
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
          <figcaption className="theme-compare-label">{msg("site.drag.the.divider.to.compare.studio.and.night")}</figcaption>
          <CompareSlider
            leftSrc="/shots/theme-studio.jpg"
            rightSrc="/shots/theme-night.jpg"
            leftLabel={msg("site.studio")}
            rightLabel={msg("site.night")}
            alt={msg("site.the.same.document.in.two.themes")}
            width={1600}
            height={1003}
          />
        </figure>
      </div>
    </section>
  );
}
