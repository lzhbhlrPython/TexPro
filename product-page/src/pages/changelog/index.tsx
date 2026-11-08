import { CopyOutlined, GithubOutlined } from '@ant-design/icons';
import { App, Button, Space, Table, Tag, Tooltip, Typography, theme } from 'antd';
import { Link } from 'react-router-dom';
import { SectionHeading } from '@/components/SectionHeading';
import { SITE_LINKS } from '@/config/constants';
import { useRelease } from '@/hooks/useRelease';
import { formatSize } from '@/lib/release';
import { useLocale, useT } from '@/i18n';

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
  const t = useT();
  const { locale } = useLocale();
  const { message } = App.useApp();
  const release = useRelease();
  const assets = release.assets ?? [];

  const copy = async (digest?: string | null) => {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest.replace(/^sha256:/i, ''));
      message.success(t('SHA256 已复制'));
    } catch {
      message.error(t('浏览器不允许写剪贴板'));
    }
  };

  return (
    <div className="changelog">
      <div className="shell">
        <SectionHeading
          eyebrow="更新日志"
          title="每个夜间构建，都是一次可追溯的提交"
          description="版本号来自发布的 tag：nightly 的 tag 带日期（v0.1.0-20261109-Nightly），同一天重跑会覆盖当天产物。下面是当前这一版和它的全部安装包。"
        />

        <div
          className="release-card"
          style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}
        >
          <div className="release-main">
            <div className="release-version">
              <span style={{ color: token.colorTextHeading }}>v{release.version}</span>
              <Tag variant="filled" color={release.channel === 'nightly' ? 'default' : 'success'}>
                {t(release.channel === 'nightly' ? '夜间构建' : '正式版')}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('发布于')} {formatDate(locale, release.publishedAt)}
              {release.releaseTag ? ` · tag ${release.releaseTag}` : ''}
              {release.source === 'snapshot' ? t(' · 构建期快照') : ''}
            </Text>
          </div>
          <Space wrap>
            <Button href={SITE_LINKS.releases} target="_blank" rel="noreferrer" icon={<GithubOutlined />}>
              GitHub Releases
            </Button>
            <Link to="/docs/dev-release">
              <Button type="primary">{t('看发布流程')}</Button>
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
          locale={{ emptyText: '这次发布没有取到资产清单（GitHub 可能限流了），可以直接去 Releases 页看。' }}
          columns={[
            {
              title: t('安装包'),
              dataIndex: 'name',
              render: (name: string) => (
                <a href={assetUrl(name, release.releaseTag)} target="_blank" rel="noreferrer">
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5 }}>{name}</span>
                </a>
              ),
            },
            {
              title: t('体积'),
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
                  <Tooltip title="复制完整校验值">
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
          {t(
            '安装包未签名。校验下载文件：shasum -a 256 <file>，与本表对比。更早的构建在 Releases 页按 tag 分组保留。',
          )}
        </Text>
      </div>
    </div>
  );
}
