import { Link as RouterLink } from 'react-router-dom';
import { GithubOutlined } from '@ant-design/icons';
import { Button, Flex, Typography, theme } from 'antd';
import { APP_VERSION, SITE_LINKS } from '@/config/constants';
import { FOOTER_GROUPS } from '@/data/site';
import { AppLogo } from '@/layouts/components/AppLogo';

const { Text, Link } = Typography;

export function SiteFooter() {
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
            <Text type="secondary" style={{ display: 'block', marginTop: 14, fontSize: 13 }}>
              本地优先的 LaTeX 工作台。
              <br />
              可视编辑、纸面排版与工程化编译，放在同一个窗口里。
            </Text>
            <Flex gap={8} align="center" style={{ marginTop: 18 }}>
              <Button
                size="small"
                icon={<GithubOutlined />}
                href={SITE_LINKS.repo}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </Button>
            </Flex>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} className="foot-col" aria-label={group.title}>
              <Text strong style={{ fontSize: 13 }}>
                {group.title}
              </Text>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    {'to' in link && link.to ? (
                      <RouterLink to={link.to} style={{ color: token.colorTextSecondary }}>
                        {link.label}
                      </RouterLink>
                    ) : (
                      <a
                        href={'href' in link ? link.href : undefined}
                        target={'external' in link && link.external ? '_blank' : undefined}
                        rel={'external' in link && link.external ? 'noreferrer' : undefined}
                        style={{ color: token.colorTextSecondary }}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="foot-col">
            <Text strong style={{ fontSize: 13 }}>
              关于
            </Text>
            <ul>
              <li>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  版本 v{APP_VERSION} · 夜间构建
                </Text>
              </li>
              <li>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Electron · React · Ant Design
                </Text>
              </li>
              <li>
                <Link href={SITE_LINKS.issues} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                  反馈问题
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="foot-bottom"
          style={{ borderTopColor: token.colorBorderSecondary, color: token.colorTextTertiary }}
        >
          <span>© 2026 TeXPro</span>
          <span>本页无账号、无跟踪脚本，也不收集使用数据。</span>
        </div>
      </div>
    </footer>
  );
}
