import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Flex, Space, Typography, theme } from 'antd';
import { ArrowLeftOutlined, CheckCircleFilled, DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { SITE_LINKS } from '@/config/constants';
import { DOWNLOADS } from '@/data/site';
import { useRelease } from '@/hooks/useRelease';
import { usePlatform } from '@/lib/platform';
import { findAsset, formatSize } from '@/lib/release';
import { useLocalizedFields, useMessages } from '@/i18n';

const { Text } = Typography;

type Phase = 'checking' | 'packing' | 'ready';

const STEPS = ["site.checking.the.version", "site.preparing.the.installer", "site.ready"];

const INSTALL_FIRST_STEP = {
  mac: "site.open.the.installer.drag.texpro.into.applications.then.allow",
  windows: "site.run.the.exe.wizard.or.unzip.the.portable.build",
  linux: "site.make.the.appimage.executable.and.run.it.or.install",
} as const;

export default function DownloadPage() {
  const { token } = theme.useToken();
  const msg = useMessages();
  const localize = useLocalizedFields();
  const [params] = useSearchParams();
  const release = useRelease();
  const detected = usePlatform();

  const targets = localize(DOWNLOADS, ["detail","variants"]);
  const requested = params.get('platform');
  const target = targets.find((item) => item.key === requested) ?? targets.find((item) => item.key === detected) ?? targets[0];

  const primary = useMemo(
    () => findAsset(release.assets, release.version, new RegExp(target.assetPattern)),
    [release.assets, release.version, target.assetPattern],
  );

  const [phase, setPhase] = useState<Phase>('checking');

  useEffect(() => {
    setPhase('checking');
    const toPacking = window.setTimeout(() => setPhase('packing'), 520);
    const toReady = window.setTimeout(() => setPhase('ready'), 1180);
    return () => {
      window.clearTimeout(toPacking);
      window.clearTimeout(toReady);
    };
  }, [target.key, release.version]);

  useEffect(() => {
    document.title = `${msg("site.download")} · TeXPro`;
  }, [msg]);

  const variants = target.variants
    .map((variant) => ({
      ...variant,
      asset: findAsset(release.assets, release.version, new RegExp(variant.assetPattern)),
    }))
    // 主推荐格式已经在上面那张卡片里，这里不再重复
    .filter((variant) => variant.asset?.url !== primary?.url);

  return (
    <div className="dl-page">
      <div className="shell">
        <Link to="/#download" className="dl-page-back">
          <ArrowLeftOutlined /> {msg("site.back.to.downloads")}
        </Link>

        <header className="dl-page-hero">
          <Text className="eyebrow" style={{ color: token.colorPrimary }}>
            {msg("site.download")}
          </Text>
          <h1 className="dl-page-title">
          <span>{msg("site.your.latex.editor")}</span>
          <span className="dl-page-title-tail">{msg("site.is.on.its.way")}</span>
        </h1>
          <p className="dl-page-lede">
            {msg("site.the.installer.is.ready.next.install.it.then.let")}
          </p>
          <div className="dl-page-meta">
            <span>{release.version}</span>
            <span>·</span>
            <span>{target.platform}</span>
            <span>·</span>
            <span>{primary ? formatSize(primary.size) ?? '' : ''}</span>
          </div>
        </header>

        <ol className="dl-route" aria-live="polite">
          {STEPS.map((label, index) => {
            const done = phase === 'ready' ? true : index === 0 && phase !== 'checking';
            const active =
              (index === 0 && phase === 'checking') ||
              (index === 1 && phase === 'packing') ||
              (index === 2 && phase === 'ready' && false);
            return (
              <li key={label} className={`dl-route-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
                <span className="dl-route-mark">
                  {done ? <CheckCircleFilled /> : active ? <LoadingOutlined /> : null}
                </span>
                <span className="dl-route-label">{msg.text(label)}</span>
              </li>
            );
          })}
        </ol>

        <section className="dl-page-card">
          <div className="dl-page-file">
            <span className="dl-page-file-name">{primary?.name ?? `${target.platform} · ${target.format}`}</span>
            <span className="dl-page-file-size">{primary ? formatSize(primary.size) ?? '' : ''}</span>
          </div>
          <Flex gap={10} wrap align="center">
            <Button
              type="primary"
              size="large"
              className="dl-cta"
              icon={<DownloadOutlined />}
              href={primary?.url ?? SITE_LINKS.releases}
              target="_blank"
              rel="noreferrer"
            >
              {msg("site.download.now")}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {msg("site.the.button.opens.the.installer.on.github.releases.check")}
            </Text>
          </Flex>
        </section>

        <section className="dl-page-block">
          <h2 className="dl-page-h2">{msg("site.other.formats.for.this.platform")}</h2>
          <ul className="dl-variant-list">
            {variants.map((variant) => (
              <li key={msg.text(variant.label)} className="dl-variant-row">
                <span className="dl-variant-label">{msg.text(variant.label)}</span>
                {variant.note ? <span className="dl-variant-note">{msg.text(variant.note)}</span> : null}
                <span className="dl-variant-size">{variant.asset ? formatSize(variant.asset.size) ?? '—' : '—'}</span>
                <a href={variant.asset?.url ?? SITE_LINKS.releases} target="_blank" rel="noreferrer">
                  {msg("site.download")}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="dl-page-block">
          <h2 className="dl-page-h2">{msg("site.four.steps.after.install")}</h2>
          <ol className="dl-page-steps">
            <li>
              <div>
                <strong>{msg("site.install.it")}</strong>
                <span>{msg.text(INSTALL_FIRST_STEP[target.key])}</span>
              </div>
            </li>
            <li>
              <div>
                <strong>{msg("site.check.your.tex.distribution")}</strong>
                <span>{msg("site.tex.live.or.mactex.is.required.latexmk.v.in")}</span>
              </div>
            </li>
            <li>
              <div>
                <strong>{msg("site.open.the.demo.project")}</strong>
                <span>{msg("site.the.first.launch.ships.a.demo.project.press.once")}</span>
              </div>
            </li>
            <li>
              <div>
                <strong>{msg("site.switch.to.your.own.manuscript")}</strong>
                <span>{msg("site.point.file.open.folder.at.your.paper.texpro.detects")}</span>
              </div>
            </li>
          </ol>
        </section>

        <Space wrap className="dl-page-actions">
          <Button href={SITE_LINKS.releases} target="_blank" rel="noreferrer">
            {msg("site.all.builds")}
          </Button>
          <Button type="text" href="/#download">
            {msg("site.back.to.downloads")}
          </Button>
        </Space>
      </div>
    </div>
  );
}
