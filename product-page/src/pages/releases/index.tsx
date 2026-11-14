import { CopyOutlined } from '@ant-design/icons';
import { App, Button, Collapse, Empty, Flex, Space, Table, Typography, theme } from 'antd';
import { Link } from 'react-router-dom';
import { MarkdownBlocks } from '@/components/MarkdownBlocks';
import { parseMarkdown } from '@/lib/markdown';
import releaseSeries from '../../../../release-series.json';
import { SectionHeading } from '@/components/SectionHeading';
import { SITE_LINKS } from '@/config/constants';
import snapshot from '@/config/stable-releases.json';
import { groupStableReleases, type StableRelease } from '@/lib/stable-releases.mjs';
import { formatSize } from '@/lib/release';
import { useLocale, useMessages } from '@/i18n';
import { dateLocale } from '@/i18n/locales';

export default function ReleasesPage() {
  const msg = useMessages();
  const { locale } = useLocale();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const releases: StableRelease[] = snapshot.releases;
  const groups = groupStableReleases(releases, releaseSeries);
  const date = (value: string) => new Date(value).toLocaleDateString(
    dateLocale(locale),
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
  const copy = async (digest: string) => {
    try {
      await navigator.clipboard.writeText(digest.replace(/^sha256:/, ''));
      message.success(msg("site.sha256.copied"));
    } catch {
      message.error(msg("site.the.browser.blocked.clipboard.access"));
    }
  };
  const status = snapshot.source === 'github'
    ? "site.synced.from.github.at.build.time"
    : snapshot.source === 'stale'
      ? "site.github.is.unavailable.showing.a.previous.snapshot"
      : "site.release.data.is.unavailable.check.github";

  return (
    <div className="section">
      <div className="shell">
        <SectionHeading
          eyebrow="site.stable.releases"
          title="site.choose.a.stable.release"
          description="site.browse.stable.releases.by.series.expand.a.version.for"
        />
        <Space wrap style={{ marginBlock: 24 }}>
          <Link to="/changelog"><Button>{msg("site.view.latest.build")}</Button></Link>
          <Button href={SITE_LINKS.releases} target="_blank" rel="noreferrer">GitHub Releases</Button>
          <Typography.Text type="secondary" role="status">
            {msg.text(status)}{snapshot.syncedAt ? ` · ${date(snapshot.syncedAt)}` : ''}
          </Typography.Text>
        </Space>
        {!releases.length && snapshot.source !== 'unavailable' ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={msg("site.no.stable.releases.yet.find.nightly.builds.in.the")}
          />
        ) : null}
        {groups.map((group, groupIndex) => (
          <section key={group.key} aria-labelledby={`series-${group.key}`} style={{ marginBottom: token.marginXXL }}>
            <Typography.Title level={2} id={`series-${group.key}`}>{group.title}</Typography.Title>
            <Collapse
              ghost
              defaultActiveKey={groupIndex === 0 ? [group.releases[0].tag] : []}
              styles={{
                header: { paddingBlock: token.paddingLG, paddingInline: 0 },
                body: { padding: 0 },
              }}
              items={group.releases.map(release => ({
                key: release.tag,
                label: (
                  <Flex align="center" justify="space-between" wrap gap={token.marginXS}>
                    <Typography.Title level={3} style={{ margin: 0, fontSize: token.fontSizeLG }}>{release.tag}</Typography.Title>
                    <Typography.Text type="secondary">{msg("site.published")} {date(release.publishedAt)}</Typography.Text>
                  </Flex>
                ),
                children: (
                  <>
                    <div className="release-notes">
                      {release.notes ? (
                        <MarkdownBlocks blocks={parseMarkdown(release.notes)} idPrefix={`release-${release.tag}`} headingOffset={3} />
                      ) : <Typography.Paragraph>{msg("site.no.release.notes.provided")}</Typography.Paragraph>}
                    </div>
                    <Button
                      href={release.url || `${SITE_LINKS.releases}/tag/${release.tag}`}
                      target="_blank" rel="noreferrer" style={{ marginBlock: token.marginLG }}
                    >
                      {msg("site.original.release.notes")}
                    </Button>
                    <Table
                      rowKey="name" size="middle" pagination={false} dataSource={release.assets}
                      scroll={{ x: 640 }}
                      locale={{ emptyText: msg("site.this.release.has.no.downloadable.assets") }}
                      columns={[
                        {
                          title: msg("site.installer"), dataIndex: 'name',
                          render: (name: string, asset: StableRelease['assets'][number]) => (
                            <a href={asset.url} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)' }}>{name}</a>
                          ),
                        },
                        {
                          title: msg("site.size"), dataIndex: 'size', width: 110,
                          render: (size: number, asset: StableRelease['assets'][number]) => formatSize(size, asset.name.endsWith('.skill') ? 'KB' : undefined) || '—',
                        },
                        {
                          title: 'SHA256', dataIndex: 'digest', width: 220,
                          render: (digest: string | null) => digest ? (
                            <Button
                              type="text" size="small" icon={<CopyOutlined />}
                              title={msg("site.copy.complete.checksum")} aria-label={msg("site.copy.complete.checksum")}
                              onClick={() => copy(digest)} style={{ fontFamily: 'var(--mono)' }}
                            >
                              {digest.replace(/^sha256:/, '').slice(0, 12)}…
                            </Button>
                          ) : '—',
                        },
                      ]}
                    />
                  </>
                ),
              }))}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
