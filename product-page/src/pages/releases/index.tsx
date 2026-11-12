import { CopyOutlined } from '@ant-design/icons';
import { App, Button, Empty, Flex, Space, Table, Typography, theme } from 'antd';
import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/SectionHeading';
import { SITE_LINKS } from '@/config/constants';
import snapshot from '@/config/stable-releases.json';
import type { StableRelease } from '@/lib/stable-releases.mjs';
import { formatSize } from '@/lib/release';
import { useLocale, useT } from '@/i18n';

export default function ReleasesPage() {
  const t = useT();
  const { locale } = useLocale();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const releases: StableRelease[] = snapshot.releases;
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
          description="这里收录已公开的正式 Release，提供发布说明和原始安装包。Nightly 继续在更新日志中展示。"
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
        {releases.map(release => (
          <section key={release.tag} aria-label={release.tag} style={{ marginBottom: 40 }}>
            <Flex
              justify="space-between" align="center" wrap gap={16}
              style={{ borderBottom: `1px solid ${token.colorBorderSecondary}`, paddingBlock: 24, marginBottom: 24 }}
            >
              <div>
                <Typography.Title level={2} style={{ margin: 0 }}>{release.tag}</Typography.Title>
                <Typography.Text type="secondary">{t('发布于')} {date(release.publishedAt)}</Typography.Text>
              </div>
              <Button
                href={release.url || `${SITE_LINKS.releases}/tag/${release.tag}`}
                target="_blank" rel="noreferrer"
              >
                {t('原始发布说明')}
              </Button>
            </Flex>
            <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {release.notes.slice(0, 4000) || t('此版本未提供发布说明。')}
              {release.notes.length > 4000 ? `\n${t('完整内容请查看原始发布说明。')}` : ''}
            </Typography.Paragraph>
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
          </section>
        ))}
      </div>
    </div>
  );
}
