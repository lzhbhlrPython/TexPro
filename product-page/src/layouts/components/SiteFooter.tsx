import { Link as RouterLink } from 'react-router-dom';
import { DownloadOutlined, GithubOutlined } from '@ant-design/icons';
import { Button, Flex, Typography, theme } from 'antd';
import { SITE_LINKS } from '@/config/constants';
import { useRelease } from '@/hooks/useRelease';
import { FOOTER_GROUPS } from '@/data/site';
import { useGoSection } from '@/lib/section';
import { AppLogo } from '@/layouts/components/AppLogo';
import { useLocalizedFields, useMessages } from '@/i18n';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const { Text, Link } = Typography;

export function SiteFooter() {
  const release = useRelease();
  const goSection = useGoSection();
  const msg = useMessages();
  const localize = useLocalizedFields();
  const channelLabel = msg(release.channel === 'nightly' ? "site.nightly" : "site.stable");
  const groups = localize(FOOTER_GROUPS, ["title","links"]).map(group => ({ ...group, links: group.links.map(link => ({ ...link, label: msg.text(link.label) })) }));
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
              {msg("site.a.local.first.latex.workbench")}
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
                  {msg("site.install.app")}
                </Button>
              ) : null}
              <Link
                href={SITE_LINKS.issues}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 13, color: token.colorTextSecondary }}
              >
                {msg("site.issues")}
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
                        {msg.text(link.label)}
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
                        {msg.text(link.label)}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

        </div>

        <div className="foot-meta" style={{ color: token.colorTextTertiary }}>
          <span>{msg("site.version")} v{release.version} · {channelLabel}</span>
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
            <RouterLink to="/texpad" className="foot-secret">
              © 2026 TeXPro
            </RouterLink>
            {' · '}
            <Link
              href={SITE_LINKS.license}
              target="_blank"
              rel="noreferrer"
              style={{ color: 'inherit' }}
            >
              MIT License
            </Link>
          </span>
          <span>{msg("site.no.accounts.no.tracking.scripts.no.usage.data.on")}</span>
        </div>
      </div>
    </footer>
  );
}
