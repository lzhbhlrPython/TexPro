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
import { useLocale, useT } from '@/i18n';

export default function ReleasesPage() {
  const t = useT();
  const { locale } = useLocale();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const releases: StableRelease[] = snapshot.releases;
  const groups = groupStableReleases(releases, releaseSeries);
  const date = (value: string) => new Date(value).toLocaleDateString(
    locale === 'zh' ? 'zh-CN' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
  const copy = async (digest: string) => {
    try {
      await navigator.clipboard.writeText(digest.replace(/^sha256:/, ''));
      message.success(t('SHA256 已复制'));
    } catch {
      message.error(t('浏览器不允许写剪贴板'));
    }
  };
  const status = snapshot.source === 'github'
    ? '构建时已同步 GitHub'
    : snapshot.source === 'stale'
      ? 'GitHub 暂不可用，显示此前快照'
      : '暂时无法获取正式版本，请前往 GitHub 查看';

  return (
    <div className="section">
      <div className="shell">
        <SectionHeading
          eyebrow="正式版本列表"
          title="选择一个正式版本"
          description="按系列代号浏览正式版本，展开小版本查看发布说明与安装包。Nightly 继续在更新日志中展示。"
        />
        <Space wrap style={{ marginBlock: 24 }}>
          <Link to="/changelog"><Button>{t('查看最新构建')}</Button></Link>
          <Button href={SITE_LINKS.releases} target="_blank" rel="noreferrer">GitHub Releases</Button>
          <Typography.Text type="secondary" role="status">
            {t(status)}{snapshot.syncedAt ? ` · ${date(snapshot.syncedAt)}` : ''}
          </Typography.Text>
        </Space>
        {!releases.length && snapshot.source !== 'unavailable' ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('暂无正式版本；可在更新日志中获取 Nightly。')}
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
                    <Typography.Text type="secondary">{t('发布于')} {date(release.publishedAt)}</Typography.Text>
                  </Flex>
                ),
                children: (
                  <>
                    <div className="release-notes">
                      {release.notes ? (
                        <MarkdownBlocks blocks={parseMarkdown(release.notes)} idPrefix={`release-${release.tag}`} headingOffset={3} />
                      ) : <Typography.Paragraph>{t('此版本未提供发布说明。')}</Typography.Paragraph>}
                    </div>
                    <Button
                      href={release.url || `${SITE_LINKS.releases}/tag/${release.tag}`}
                      target="_blank" rel="noreferrer" style={{ marginBlock: token.marginLG }}
                    >
                      {t('原始发布说明')}
                    </Button>
                    <Table
                      rowKey="name" size="middle" pagination={false} dataSource={release.assets}
                      scroll={{ x: 640 }}
                      locale={{ emptyText: t('此版本没有可下载的安装包。') }}
                      columns={[
                        {
                          title: t('安装包'), dataIndex: 'name',
                          render: (name: string, asset: StableRelease['assets'][number]) => (
                            <a href={asset.url} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--mono)' }}>{name}</a>
                          ),
                        },
                        {
                          title: t('体积'), dataIndex: 'size', width: 110,
                          render: (size: number) => formatSize(size) || '—',
                        },
                        {
                          title: 'SHA256', dataIndex: 'digest', width: 220,
                          render: (digest: string | null) => digest ? (
                            <Button
                              type="text" size="small" icon={<CopyOutlined />}
                              title={t('复制完整校验值')} aria-label={t('复制完整校验值')}
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
