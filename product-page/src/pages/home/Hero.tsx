import { CheckOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Space, theme } from 'antd';
import { ScreenshotFrame } from '@/components/ScreenshotFrame';
import { APP_VERSION } from '@/config/constants';
import { HERO_METRICS, HERO_POINTS } from '@/data/site';

export function Hero() {
  const { token } = theme.useToken();

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
            <span>v{APP_VERSION}</span>
            <span>本地优先</span>
            <span>免登录</span>
          </p>

          <h1 className="hero-title">
            让 LaTeX
            <br />
            像纸面一样好写
          </h1>

          <p className="hero-lede">
            TeXPro 把可视编辑、纸面排版和真正的 LaTeX 工程放进同一个窗口：公式、表格、TikZ
            与乐谱在正文里直接出版面效果，PDF 与源码双向跳转，而文件始终留在你自己的磁盘上。
          </p>

          <Space size={12} wrap className="hero-actions">
            <Button type="primary" size="large" href="#download" icon={<DownloadOutlined />}>
              下载 TeXPro
            </Button>
            <Button size="large" href="#capabilities">
              看看能做什么
            </Button>
          </Space>

          <ul className="hero-points">
            {HERO_POINTS.map((point) => (
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
            alt="TeXPro 主界面：左侧项目树与主文件，中间可视编辑器，右侧 PDF 预览"
            caption="可视编辑器 · PDF 预览 · 双向 SyncTeX 同屏"
            width={1800}
            height={1259}
            eager
          />
        </div>
      </div>

      <div className="shell">
        <dl className="hero-metrics" style={{ borderTopColor: token.colorBorderSecondary }}>
          {HERO_METRICS.map((metric) => (
            <div key={metric.label} className="metric">
              <dt style={{ color: token.colorTextHeading }}>{metric.value}</dt>
              <dd style={{ color: token.colorTextTertiary }}>{metric.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
