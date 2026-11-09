import { CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Space, theme } from 'antd';
import { LatexMark } from '@/components/LatexMark';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { useRelease } from '@/hooks/useRelease';
import { Reveal } from '@/components/Reveal';
import { HERO_METRICS, HERO_POINTS } from '@/data/site';
import { useLocalize, useT } from '@/i18n';

export function Hero() {
  const { token } = theme.useToken();
  const release = useRelease();
  const t = useT();
  const localize = useLocalize();
  const points = localize([...HERO_POINTS]);
  const metrics = localize([...HERO_METRICS]);

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
            <span>{t('本地优先')}</span>
            <span>{t('免登录')}</span>
          </p>

          <h1 className="hero-title">
            {t('让')} <LatexMark />
            <br />
            {t('像纸面一样好写')}
          </h1>

          <p className="hero-lede">
            {t('TeXPro 把可视编辑、纸面排版和真正的 LaTeX 工程放进同一个窗口：公式、表格、TikZ 与乐谱在正文里直接出版面效果，PDF 与源码双向跳转，而文件始终留在你自己的磁盘上。')}
          </p>

          <Space size={12} wrap className="hero-actions">
            <Button type="primary" size="large" href="#download" icon={<DownloadOutlined />}>
              {t('下载 TeXPro')}
            </Button>
            <Button size="large" href="#capabilities">
              {t('看看能做什么')}
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
            alt={t('TeXPro 主界面：左侧项目树与主文件，中间可视编辑器，右侧 PDF 预览')}
            caption={t('可视编辑器 · PDF 预览 · 双向 SyncTeX 同屏')}
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
                {t(metric.label)}
                <sup className="claim-ref hero-metric-ref">
                  <a href={`#ref-${index + 7}`} aria-label={t('第 7–10 条参考文献')}>
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
