import { CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Space, theme } from 'antd';
import { LatexMark } from '@/components/LatexMark';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { useRelease } from '@/hooks/useRelease';
import { Reveal } from '@/components/Reveal';
import { HERO_METRICS, HERO_POINTS } from '@/data/site';
import { useLocalizedFields, useMessages } from '@/i18n';

export function Hero() {
  const { token } = theme.useToken();
  const release = useRelease();
  const msg = useMessages();
  const localize = useLocalizedFields();
  const points = localize([...HERO_POINTS], []);
  const metrics = localize([...HERO_METRICS], ["label"]);

  return (
    <section className="hero" id="top">
      <div
        className="hero-glow"
        aria-hidden="true"
        style={{
          background: `radial-gradient(52% 46% at 76% 4%, ${token.colorPrimaryBg} 0%, transparent 68%)`,
        }}
      />
      <div className="shell hero-inner">
        <div className="hero-copy">
          <p className="hero-badge" style={{ color: token.colorTextSecondary }}>
            <span className="badge-version">
              v<span className="badge-version-full">{release.version}</span>
              <span className="badge-version-short">{release.version.split('-')[0]}</span>
            </span>
            <span>{msg("site.local.first")}</span>
            <span>{msg("site.no.sign.in")}</span>
          </p>

          <h1 className="hero-title">
            {msg("site.make")} <LatexMark />
            <br />
            {msg("site.as.natural.as.paper")}
          </h1>

          <p className="hero-lede">
            {msg("site.texpro.puts.visual.editing.paper.like.typesetting.and.a")}
          </p>

          <Space size={12} wrap className="hero-actions">
            <Button
              type="primary"
              size="large"
              className="dl-cta"
              icon={<DownloadOutlined />}
              href="#download"
            >
              {msg("site.download.texpro")}
            </Button>
            <Button size="large" href="#capabilities">
              {msg("site.see.what.it.does")}
            </Button>
          </Space>

          <ul className="hero-points">
            {points.map((point) => (
              <li key={point} style={{ color: token.colorTextTertiary }}>
                <CheckOutlined style={{ color: token.colorSuccess }} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-visual">
          <ScreenshotFrame
            src="/shots/hero.jpg"
            alt={msg("site.texpro.main.window.project.tree.on.the.left.visual")}
            caption={msg("site.visual.editor.pdf.preview.two.way.synctex")}
            width={1800}
            height={1259}
            eager
          />
        </div>
      </div>

      <div className="shell">
        <dl className="hero-metrics">
          {metrics.map((metric, index) => (
            <Reveal key={metric.label} className="hero-metric" delay={index * 60}>
              <dt className="hero-metric-value" style={{ color: token.colorTextHeading }}>
                {metric.value}
              </dt>
              <dd className="hero-metric-label" style={{ color: token.colorTextTertiary }}>
                {msg.text(metric.label)}
                <sup className="claim-ref hero-metric-ref">
                  <a href={`#ref-${index + 7}`} aria-label={msg('site.references.seven.to.ten')}>
                    {index + 7}
                  </a>
                </sup>
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
