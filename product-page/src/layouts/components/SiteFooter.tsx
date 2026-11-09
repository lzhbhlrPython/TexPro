import { Link as RouterLink } from 'react-router-dom';
import { DownloadOutlined, GithubOutlined } from '@ant-design/icons';
import { Button, Flex, Typography, theme } from 'antd';
import { SITE_LINKS } from '@/config/constants';
import { useRelease } from '@/hooks/useRelease';
import { FOOTER_GROUPS } from '@/data/site';
import { useGoSection } from '@/lib/section';
import { AppLogo } from '@/layouts/components/AppLogo';
import { useLocalize, useT } from '@/i18n';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const { Text, Link } = Typography;

export function SiteFooter() {
  const release = useRelease();
  const goSection = useGoSection();
  const t = useT();
  const localize = useLocalize();
  const channelLabel = t(release.channel === 'nightly' ? '夜间构建' : '正式版');
  const groups = localize(FOOTER_GROUPS);
  const { canInstall, install } = useInstallPrompt();
  const { token } = theme.useToken();

  return (
    <footer
      className="site-foot"
      style={{ background: token.colorBgLayout, borderTopColor: token.colorBorderSecondary }}
    >
      <div className="shell">
        <div className="foot-grid">
          <div className="foot-brand">
            <AppLogo />
            <Text type="secondary" style={{ display: 'block', marginTop: 12, fontSize: 13 }}>
              {t('本地优先的 LaTeX 工作台。')}
            </Text>
            <Flex gap={12} align="center" style={{ marginTop: 16 }}>
              <Button
                size="small"
                icon={<GithubOutlined />}
                href={SITE_LINKS.repo}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </Button>
              {canInstall ? (
                <Button size="small" icon={<DownloadOutlined />} onClick={install}>
                  {t('安装到桌面')}
                </Button>
              ) : null}
              <Link
                href={SITE_LINKS.issues}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 13, color: token.colorTextSecondary }}
              >
                {t('问题反馈')}
              </Link>
            </Flex>
          </div>

          {groups.map((group) => (
            <nav key={group.title} className="foot-col" aria-label={group.title}>
              <Text strong style={{ fontSize: 13 }}>
                {group.title}
              </Text>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link && link.to ? (
                      <RouterLink to={link.to} style={{ color: token.colorTextSecondary }}>
                        {t(link.label)}
                      </RouterLink>
                    ) : (
                      <a
                        href={'href' in link ? link.href : undefined}
                        target={'external' in link && link.external ? '_blank' : undefined}
                        rel={'external' in link && link.external ? 'noreferrer' : undefined}
                        onClick={(event) => {
                          const href = 'href' in link ? link.href : undefined;
                          if (href?.startsWith('#')) {
                            event.preventDefault();
                            goSection(href.slice(1));
                          }
                        }}
                        style={{ color: token.colorTextSecondary }}
                      >
                        {t(link.label)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

        </div>

        <div className="foot-meta" style={{ color: token.colorTextTertiary }}>
          <span>{t('版本')} v{release.version} · {channelLabel}</span>
          <span>Electron · React · Ant Design</span>
          <Link href={SITE_LINKS.license} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
            MIT License
          </Link>
        </div>

        <div
          className="foot-bottom"
          style={{ borderTopColor: token.colorBorderSecondary, color: token.colorTextTertiary }}
        >
          <span>
            © 2026 TeXPro ·{' '}
            <Link
              href={SITE_LINKS.license}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'inherit' }}
            >
              MIT License
            </Link>
          </span>
          <span>{t('本页无账号、无跟踪脚本，也不收集使用数据。')}</span>
        </div>
      </div>
    </footer>
  );
}
