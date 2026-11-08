import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { DownloadOutlined, GithubOutlined, MenuOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Flex, Space, Typography, theme } from 'antd';
import { SITE_LINKS } from '@/config/constants';
import { NAV_ITEMS } from '@/data/site';
import { AppLogo } from '@/layouts/components/AppLogo';

const { Text } = Typography;

export function SiteHeader() {
  const { token } = theme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /** 从文档页回到首页的某个区块：先切路由，再滚动。 */
  const goSection = (id: string) => {
    setMenuOpen(false);
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate('/');
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const navLinkStyle = { color: token.colorTextSecondary };

  return (
    <header
      className={`site-head${scrolled ? ' is-scrolled' : ''}`}
      style={{
        background: token.colorBgContainer,
        borderBottomColor: scrolled ? token.colorBorderSecondary : 'transparent',
      }}
    >
      <div className="shell site-head-inner">
        <Link className="brand-link" to="/" aria-label="TeXPro 首页">
          <AppLogo />
        </Link>

        <nav className="site-nav" aria-label="主导航">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <Link key={item.label} to={item.to} style={navLinkStyle}>
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                style={navLinkStyle}
                onClick={(event) => {
                  event.preventDefault();
                  goSection((item.href ?? '').replace('#', ''));
                }}
              >
                {item.label}
              </a>
            ),
          )}
        </nav>

        <span className="head-spacer" />

        <Space size={4} className="site-head-actions">
          <Button
            type="text"
            icon={<GithubOutlined />}
            href={SITE_LINKS.repo}
            target="_blank"
            rel="noreferrer"
            aria-label="在 GitHub 查看源码"
          />
          <Button type="primary" icon={<DownloadOutlined />} onClick={() => goSection('download')}>
            下载
          </Button>
        </Space>

        <Button
          className="site-menu-trigger"
          type="text"
          icon={<MenuOutlined />}
          aria-label="打开导航菜单"
          onClick={() => setMenuOpen(true)}
        />
      </div>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="right"
        size="min(320px, 88vw)"
        title={<AppLogo />}
      >
        <Flex vertical gap={4}>
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                className="mobile-nav-link"
                style={{ color: token.colorText }}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="mobile-nav-link"
                style={{ color: token.colorText }}
                onClick={(event) => {
                  event.preventDefault();
                  goSection((item.href ?? '').replace('#', ''));
                }}
              >
                {item.label}
              </a>
            ),
          )}
        </Flex>

        <Divider />

        <Flex vertical gap={10}>
          <Button
            block
            icon={<GithubOutlined />}
            href={SITE_LINKS.repo}
            target="_blank"
            rel="noreferrer"
          >
            GitHub 源码
          </Button>
          <Button
            block
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => goSection('download')}
          >
            下载 TeXPro
          </Button>
        </Flex>

        <Text type="secondary" style={{ display: 'block', marginTop: 20, fontSize: 12 }}>
          本地优先 · 不建账号 · 不上传文件
        </Text>
      </Drawer>
    </header>
  );
}
