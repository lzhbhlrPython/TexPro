import { CopyOutlined, DownloadOutlined, GithubOutlined } from '@ant-design/icons';
import { App, Button, Space, Tag, Tooltip, Typography, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { SectionHeading } from '@/components/SectionHeading';
import { SITE_LINKS } from '@/config/constants';
import { useRelease } from '@/hooks/useRelease';
import { usePlatform } from '@/lib/platform';
import { findAsset, formatSize } from '@/lib/release';
import { DOWNLOADS } from '@/data/site';
import { useLocale, useLocalize, useT } from '@/i18n';

const { Text, Title } = Typography;

const PLATFORM_LABEL = { mac: 'macOS', windows: 'Windows', linux: 'Linux' } as const;

export function Download() {
  const { token } = theme.useToken();
  const t = useT();
  const localize = useLocalize();
  const { locale } = useLocale();
  const { message } = App.useApp();
  const navigate = useNavigate();
  const release = useRelease();
  const platform = usePlatform();

  /** Releases 里的 digest 形如 sha256:abc…，复制时只留摘要本身，方便直接比对 */
  const copyDigest = async (digest?: string | null) => {
    if (!digest) return;
    const value = digest.replace(/^sha256:/i, '');
    try {
      await navigator.clipboard.writeText(value);
      message.success(t('SHA256 已复制'));
    } catch {
      message.error(t('浏览器不允许写剪贴板，请到 Releases 页手动复制'));
    }
  };

  return (
    <section className="section section-download" id="download">
      <div className="shell">
        <SectionHeading
          eyebrow="下载"
          title="装到本机，十分钟开始写"
          description={
            locale === 'en'
              ? `Build v${release.version}, repackaged on every commit. Installers are hosted on GitHub Releases.`
              : `当前构建 v${release.version}，随每次提交自动打包。安装包托管在 GitHub Releases。`
          }
        />

        {platform && (
          <p className="download-detect" style={{ color: token.colorTextSecondary }}>
            {t('检测到你在')} <strong style={{ color: token.colorText }}>{PLATFORM_LABEL[platform]}</strong>
            {t('，已标出对应的安装包。')}
          </p>
        )}

        <div className="download-list">
          {localize(DOWNLOADS).map((target, index) => {
            const asset = findAsset(release.assets, release.version, new RegExp(target.assetPattern));
            const size = formatSize(asset?.size);
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
                      {t('当前系统')}
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
                      aria-label={`复制 ${target.platform} 安装包的 SHA256`}
                      onClick={() => copyDigest(asset.digest)}
                    />
                  </Tooltip>
                ) : null}
                <Button
                  type={current ? 'primary' : 'link'}
                  icon={<DownloadOutlined />}
                  href={asset?.url ?? SITE_LINKS.releases}
                  target="_blank"
                  rel="noreferrer"
                  style={current ? { justifySelf: 'end' } : { paddingInline: 0, justifySelf: 'end' }}
                >
                  {asset ? t('下载') : t('前往 Releases')}
                </Button>
              </Reveal>
            );
          })}
        </div>

        <div className="download-note">
          <div>
            <Title level={4} style={{ margin: '0 0 6px', fontSize: 15 }}>
              {t('运行前提')}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('需要本机已安装 TeX Live 或 MacTeX（pdflatex / xelatex / lualatex 任一即可）；TeXPro 会自动探测发行版与可执行文件。安装包未签名，每行右侧的复制按钮给出该安装包的 SHA256。')}
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
              {t('查看全部构建')}
            </Button>
            <Button onClick={() => navigate('/docs/dev-setup')}>{t('从源码运行')}</Button>
          </Space>
        </div>
      </div>
    </section>
  );
}
