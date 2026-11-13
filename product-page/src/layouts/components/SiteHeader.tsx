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
import { useT } from '@/i18n';
import { LanguageSwitch } from '@/components/LanguageSwitch';
import { findTopic } from '@/content/docs';
import { documentationHome } from '@/content/docs/sections.mjs';
import { useThemeMode } from '@/lib/theme';

const { Text } = Typography;

export function SiteHeader() {
  const { token } = theme.useToken();
  const t = useT();
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
        <Link className="brand-link" to="/" aria-label={t('TeXPro 首页')}>
          <AppLogo />
        </Link>

        <nav className="site-nav" aria-label={t('主导航')}>
          {PAGE_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.to ?? '/'}
              className={isActive(item.to ?? '') ? 'is-active' : undefined}
            >
              {t(item.label)}
            </Link>
          ))}
        </nav>

        <span className="head-spacer" />

        <Flex align="center" gap={4}>
          <Space size={4} className="site-head-actions">
            <Button
              type="text"
              icon={<SearchOutlined />}
              aria-label={t('搜索文档与博客（⌘K）')}
              onClick={() => setSearchOpen(true)}
            />
            <Button
              type="text"
              icon={<KeyOutlined />}
              aria-label={t('键盘快捷键')}
              onClick={() => setShortcutsOpen(true)}
            />
            <Button
              type="text"
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
              aria-label={t(mode === 'dark' ? '切换到日间模式' : '切换到夜间模式')}
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
              aria-label={t('在 GitHub 查看源码')}
            />
            <Button
              type="primary"
              className="dl-cta"
              icon={<DownloadOutlined />}
              onClick={() => goSection('download')}
            >
              {t('下载')}
            </Button>
          </Space>

          <Button
            className="site-menu-trigger"
            type="text"
            icon={<MenuOutlined />}
            aria-label={t('打开导航菜单')}
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
          {t('页面')}
        </Text>
        <Flex vertical gap={4}>
          <Link
            to="/"
            className="mobile-nav-link"
            style={{ color: token.colorText }}
            onClick={() => setMenuOpen(false)}
          >
            {t('首页')}
          </Link>
          {PAGE_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.to ?? '/'}
              className="mobile-nav-link"
              style={{ color: token.colorText }}
              onClick={() => setMenuOpen(false)}
            >
              {t(item.label)}
            </Link>
          ))}
        </Flex>

        {location.pathname === '/' ? (
          <>
            <Text type="secondary" className="drawer-group-label">
              {t('本页')}
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
                  {t(item.label)}
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
            {t('GitHub 源码')}
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
            {t('下载 TeXPro')}
          </Button>
        </Flex>

        <Text type="secondary" style={{ display: 'block', marginTop: 20, fontSize: 12 }}>
          {t('本地优先 · 不建账号 · 不上传文件')}
        </Text>
      </Drawer>
    </header>
  );
}
