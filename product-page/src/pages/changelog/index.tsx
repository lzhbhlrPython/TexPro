import { CopyOutlined, GithubOutlined } from '@ant-design/icons';
import { App, Button, Space, Table, Tag, Tooltip, Typography, theme } from 'antd';
import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/SectionHeading';
import { SITE_LINKS } from '@/config/constants';
import { useRelease } from '@/hooks/useRelease';
import { formatSize } from '@/lib/release';
import { useLocale, useMessages } from '@/i18n';

const { Text } = Typography;

function formatDate(locale: 'zh' | 'en', value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Releases 页地址去掉末尾斜杠，拼出单个资产下载链接 */
function assetUrl(name: string, tag?: string) {
  const base = SITE_LINKS.releases.replace(/\/$/, '');
  return tag ? `${base}/download/${tag}/${name}` : `${base}/download/nightly/${name}`;
}

export default function ChangelogPage() {
  const { token } = theme.useToken();
  const msg = useMessages();
  const { locale } = useLocale();
  const { message } = App.useApp();
  const release = useRelease();
  const assets = release.assets ?? [];

  const copy = async (digest?: string | null) => {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest.replace(/^sha256:/i, ''));
      message.success(msg("site.sha256.copied"));
    } catch {
      message.error(msg("site.the.browser.blocked.clipboard.access"));
    }
  };

  return (
    <div className="changelog">
      <div className="shell">
        <SectionHeading
          eyebrow="site.changelog"
          title="site.every.nightly.build.is.a.traceable.commit"
          description="site.versions.come.from.the.release.tag.nightly.tags.carry"
        />

        <div
          className="release-card"
          style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
        >
          <div className="release-main">
            <div className="release-version">
              <span style={{ color: token.colorTextHeading }}>v{release.version}</span>
              <Tag variant="filled" color={release.channel === 'nightly' ? 'default' : 'success'}>
                {msg(release.channel === 'nightly' ? "site.nightly" : "site.stable")}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {msg("site.published")} {formatDate(locale, release.publishedAt)}
              {release.releaseTag ? ` · tag ${release.releaseTag}` : ''}
              {release.source === 'snapshot' ? msg("site.build.time.snapshot") : ''}
            </Text>
          </div>
          <Space wrap>
            <Button href={SITE_LINKS.releases} target="_blank" rel="noreferrer" icon={<GithubOutlined />}>
              GitHub Releases
            </Button>
            <Link to="/docs/dev-release">
              <Button type="primary">{msg("site.release.process")}</Button>
            </Link>
          </Space>
        </div>

        <Table
          className="release-assets"
          rowKey="name"
          size="middle"
          pagination={false}
          dataSource={assets}
          scroll={{ x: 720 }}
          locale={{ emptyText: "site.no.asset.list.this.time.github.may.be.rate" }}
          columns={[
            {
              title: msg("site.installer"),
              dataIndex: 'name',
              render: (name: string) => (
                <a href={assetUrl(name, release.releaseTag)} target="_blank" rel="noreferrer">
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>{name}</span>
                </a>
              ),
            },
            {
              title: msg("site.size"),
              dataIndex: 'size',
              width: 110,
              align: 'right',
              render: (size?: number) => formatSize(size) ?? '—',
            },
            {
              title: 'SHA256',
              dataIndex: 'digest',
              width: 200,
              render: (digest?: string | null) =>
                digest ? (
                  <Tooltip title={msg("site.copy.complete.checksum")}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copy(digest)}
                      style={{ paddingInline: 0 }}
                    >
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                        {digest.replace(/^sha256:/i, '').slice(0, 12)}…
                      </span>
                    </Button>
                  </Tooltip>
                ) : (
                  '—'
                ),
            },
          ]}
        />

        <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 12.5 }}>
          {msg(
            "site.installers.are.unsigned.verify.a.download.with.shasum.a",
          )}
        </Text>
      </div>
    </div>
  );
}
