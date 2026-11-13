import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  DownloadOutlined,
  GithubOutlined,
  KeyOutlined,
  MenuOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { Button, Divider, Drawer, Flex, Space, Typography, theme } from 'antd';
import { SITE_LINKS } from '@/config/constants';
import { useGoSection } from '@/lib/section';
import { PAGE_LINKS, SECTION_LINKS } from '@/data/site';
import { AppLogo } from '@/layouts/components/AppLogo';
import { SearchDialog } from '@/components/SearchDialog';
import { ShortcutsDialog } from '@/components/ShortcutsDialog';
import { useMessages } from '@/i18n';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { findTopic } from '@/content/docs';
import { documentationHome } from '@/content/docs/sections.mjs';
import { useThemeMode } from '@/lib/theme';

const { Text } = Typography;

export function SiteHeader() {
  const { token } = theme.useToken();
  const msg = useMessages();
  const { mode, toggle: toggleTheme } = useThemeMode();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToSection = useGoSection();

  // ⌘K / Ctrl+K 打开搜索；在输入框里不拦截
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && /^(INPUT|TEXTAREA)$/.test(target.tagName));

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (typing) return;
        event.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === '/') {
        event.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      if (event.key === '?' && !typing) {
        event.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  /** 从文档页回到首页的某个区块：先切路由，再滚动。 */
  const goSection = (id: string) => {
    setMenuOpen(false);
    goToSection(id);
  };

  const isActive = (to: string) => {
    if ((to === '/docs' || to === '/developers') && location.pathname.startsWith('/docs/')) {
      return documentationHome(findTopic(location.pathname.slice('/docs/'.length)).section) === to;
    }
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <header
      className={`site-head${scrolled ? ' is-scrolled' : ''}`}
      style={{
        background: token.colorBgContainer,
        borderBottomColor: scrolled ? token.colorBorderSecondary : 'transparent',
      }}
    >
      <div className="shell site-head-inner">
        <Link className="brand-link" to="/" aria-label={msg("site.texpro.home")}>
          <AppLogo />
        </Link>

        <nav className="site-nav" aria-label={msg("site.main.navigation")}>
          {PAGE_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.to ?? '/'}
              className={isActive(item.to ?? '') ? 'is-active' : undefined}
            >
              {msg.text(item.label)}
            </Link>
          ))}
        </nav>

        <span className="head-spacer" />

        <Flex align="center" gap={4}>
          <Space size={4} className="site-head-actions">
            <Button
              type="text"
              icon={<SearchOutlined />}
              aria-label={msg("site.search.docs.and.blog.k")}
              onClick={() => setSearchOpen(true)}
            />
            <Button
              type="text"
              icon={<KeyOutlined />}
              aria-label={msg("site.keyboard.shortcuts")}
              onClick={() => setShortcutsOpen(true)}
            />
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              aria-label={msg(mode === 'dark' ? "site.switch.to.light.mode" : "site.switch.to.dark.mode")}
            />
          </Space>
          <LanguageSwitch />
          <Space size={4} className="site-head-actions">
            <Button
              type="text"
              icon={<GithubOutlined />}
              href={SITE_LINKS.repo}
              target="_blank"
              rel="noreferrer"
              aria-label={msg("site.view.source.on.github")}
            />
            <Button
              type="primary"
              className="dl-cta"
              icon={<DownloadOutlined />}
              onClick={() => goSection('download')}
            >
              {msg("site.download")}
            </Button>
          </Space>

          <Button
            className="site-menu-trigger"
            type="text"
            icon={<MenuOutlined />}
            aria-label={msg("site.open.menu")}
            onClick={() => setMenuOpen(true)}
          />
        </Flex>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="right"
        size="min(320px, 88vw)"
        title={<AppLogo />}
      >
        <Text type="secondary" className="drawer-group-label">
          {msg("site.pages")}
        </Text>
        <Flex vertical gap={4}>
          <Link
            to="/"
            className="mobile-nav-link"
            style={{ color: token.colorText }}
            onClick={() => setMenuOpen(false)}
          >
            {msg("site.home")}
          </Link>
          {PAGE_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.to ?? '/'}
              className="mobile-nav-link"
              style={{ color: token.colorText }}
              onClick={() => setMenuOpen(false)}
            >
              {msg.text(item.label)}
            </Link>
          ))}
        </Flex>

        {location.pathname === '/' ? (
          <>
            <Text type="secondary" className="drawer-group-label">
              {msg("site.on.this.page")}
            </Text>
            <Flex vertical gap={4}>
              {SECTION_LINKS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="mobile-nav-link"
                  style={{ color: token.colorText }}
                  onClick={(event) => {
                    event.preventDefault();
                    goSection(item.id);
                  }}
                >
                  {msg.text(item.label)}
                </a>
              ))}
            </Flex>
          </>
        ) : null}

        <Divider />

        <Flex vertical gap={10}>
          <Button
            block
            icon={<GithubOutlined />}
            href={SITE_LINKS.repo}
            target="_blank"
            rel="noreferrer"
          >
            {msg("site.github")}
          </Button>
          <Button
            block
            type="primary"
            className="dl-cta"
            icon={<DownloadOutlined />}
            onClick={() => {
              setMenuOpen(false);
              goSection('download');
            }}
          >
            {msg("site.download.texpro")}
          </Button>
        </Flex>

        <Text type="secondary" style={{ display: 'block', marginTop: 20, fontSize: 12 }}>
          {msg("site.local.first.no.account.nothing.uploaded")}
        </Text>
      </Drawer>
    </header>
  );
}
