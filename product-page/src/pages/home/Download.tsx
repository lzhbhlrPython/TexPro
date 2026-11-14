import { useState } from 'react';
import nightlySnapshot from '@/config/nightly-release.json';
import stableSnapshot from '@/config/stable-releases.json';
import { CopyOutlined, DownloadOutlined, GithubOutlined } from '@ant-design/icons';
import { App, Button, Segmented, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { SITE_LINKS } from '@/config/constants';
import { usePlatform } from '@/lib/platform';
import { findAsset, formatSize } from '@/lib/release';
import { DOWNLOADS } from '@/data/site';
import { useLocalizedFields, useMessages } from '@/i18n';

const { Text, Title } = Typography;

const PLATFORM_LABEL = { mac: 'macOS', windows: 'Windows', linux: 'Linux' } as const;

export function Download() {
  const { token } = theme.useToken();
  const msg = useMessages();
  const localize = useLocalizedFields();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<'stable' | 'nightly'>('stable');
  const stable = [...stableSnapshot.releases].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  const release = channel === 'stable'
    ? { version: stable?.tag.replace(/^v/, '') ?? '', assets: stable?.assets ?? [] }
    : { version: nightlySnapshot.version, assets: nightlySnapshot.assets };
  const platform = usePlatform();
  const targets = [
    ...localize(DOWNLOADS, ['detail', 'variants']),
    { key: 'skill', platform: msg('site.download.skill.title'), detail: msg('site.download.skill.description'), format: 'SKILL', assetPattern: '\\.skill$' },
  ];

  /** Releases 里的 digest 形如 sha256:abc…，复制时只留摘要本身，方便直接比对 */
  const copyDigest = async (digest?: string | null) => {
    if (!digest) return;
    const value = digest.replace(/^sha256:/i, '');
    try {
      await navigator.clipboard.writeText(value);
      message.success(msg("site.sha256.copied"));
    } catch {
      message.error(msg("site.the.browser.blocked.clipboard.access.copy.it.from.the"));
    }
  };

  return (
    <section className="section section-download" id="download">
      <div className="shell">
        <SectionHeading
          eyebrow="site.download"
          title="site.install.locally.writing.in.ten.minutes"
          description={msg("site.build.v.version.nightly.checks.for.new.commits.daily").replace(
            '{version}',
            release.version,
          )}
        />

        <div className="download-channel-bar">
          <Segmented
            aria-label={msg('site.build.channels')}
            value={channel}
            onChange={setChannel}
            options={[{ value: 'stable', label: msg('site.download.channel.stable') }, { value: 'nightly', label: 'Nightly' }]}
          />
          <span className="download-channel-version" aria-live="polite">{release.version ? `v${release.version}` : msg('site.build.unavailable')}</span>
        </div>

        {platform && (
          <p className="download-detect" style={{ color: token.colorTextSecondary }}>
            {msg("site.detected")} <strong style={{ color: token.colorText }}>{PLATFORM_LABEL[platform]}</strong>
            {msg("site.the.matching.installer.is.highlighted")}
          </p>
        )}

        <div className="download-list">
          {targets.map((target, index) => {
            const asset = findAsset(release.assets, release.version, new RegExp(target.assetPattern));
            const size = formatSize(asset?.size, target.key === 'skill' ? 'KB' : undefined);
            const current = platform === target.key;

            return (
              <Reveal
                className={`download-row${current ? ' is-current' : ''}`}
                key={target.key}
                delay={index * 60}
                style={{
                  borderColor: token.colorBorderSecondary,
                  background: current ? token.colorPrimaryBg : undefined,
                }}
              >
                <div className="download-main">
                  <span className="download-platform" style={{ color: token.colorTextHeading }}>
                    {target.platform}
                  </span>
                  <span className="download-detail" style={{ color: token.colorTextSecondary }}>
                    {target.detail}
                  </span>
                  {current && (
                    <Tag
                      variant="filled"
                      style={{
                        marginInlineStart: 4,
                        color: token.colorPrimary,
                        background: token.colorPrimaryBorder,
                        fontSize: 11,
                      }}
                    >
                      {msg("site.this.machine")}
                    </Tag>
                  )}
                </div>
                <span className="download-format" style={{ color: token.colorTextTertiary }}>
                  {target.format}
                  {size ? ` · ${size}` : ''}
                </span>
                {asset?.digest ? (
                  <Tooltip title={`SHA256 · ${asset.digest.replace(/^sha256:/i, '').slice(0, 12)}…`}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      aria-label={msg('site.download.copy.digest').replace('{name}', target.platform)}
                      onClick={() => copyDigest(asset.digest)}
                    />
                  </Tooltip>
                ) : <span aria-hidden="true" />}
                <Button
                  type={current ? 'primary' : 'link'}
                  className="dl-cta"
                  icon={<DownloadOutlined />}
                  href={asset?.url ?? SITE_LINKS.releases}
                  target="_blank"
                  rel="noreferrer"
                  style={current ? { justifySelf: 'end' } : { paddingInline: 0, justifySelf: 'end' }}
                >
                  {asset ? msg("site.download") : msg("site.open.releases")}
                </Button>
              </Reveal>
            );
          })}
        </div>

        <div className="download-note">
          <div>
            <Title level={4} style={{ margin: '0 0 6px', fontSize: 15 }}>
              {msg("site.requirements")}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {msg("site.tex.live.or.mactex.must.be.installed.any.of")}
            </Text>
          </div>
          <Space wrap>
            <Button
              type="primary"
              icon={<GithubOutlined />}
              href={SITE_LINKS.releases}
              target="_blank"
              rel="noreferrer"
            >
              {msg("site.all.builds")}
            </Button>
            <Button onClick={() => navigate('/docs/dev-setup')}>{msg("site.run.from.source")}</Button>
          </Space>
        </div>
      </div>
    </section>
  );
}
