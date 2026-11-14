import { useEffect } from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { SITE_LANGUAGES } from './i18n/locales';
import enUS from 'antd/locale/en_US';
import { RouterProvider } from 'react-router-dom';
import { LocaleProvider, useLocale } from '@/i18n';
import { ThemeProvider, useThemeMode } from '@/lib/theme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BRAND_PRIMARY } from '@/config/design';
import { router } from '@/router';

/**
 * 全站统一用思源宋体（Noto Serif SC，CDN 见 index.html）。
 * 后面的系统宋体是字体未加载完成时的兜底，最后才是通用 serif。
 */
export const FONT_FAMILY = `'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'Noto Serif CJK SC', 'SimSun', 'Times New Roman', Georgia, serif`;

const LIGHT_PALETTE = {
  colorBgLayout: '#F7F2EA',
  colorBgContainer: '#FFFCF7',
  colorBgElevated: '#FFFCF7',
  colorBorder: '#E0D3C0',
  colorBorderSecondary: '#EBE1D2',
  colorText: '#2A231E',
  colorTextHeading: '#1C1613',
};

const DARK_PALETTE = {
  colorBgLayout: '#141110',
  colorBgContainer: '#1D1917',
  colorBgElevated: '#241F1B',
  colorBorder: '#3A322C',
  colorBorderSecondary: '#332C27',
  colorText: '#E9E3DA',
  colorTextHeading: '#F5EFE6',
};

function ConfigEffects({ mode }: { mode: 'light' | 'dark' }) {
  const { token } = antdTheme.useToken();

  useEffect(() => {
    document.body.style.backgroundColor = token.colorBgLayout;
    document.documentElement.style.colorScheme = mode;
    const root = document.documentElement.style;
    root.setProperty('--site-brand', token.colorPrimary);
    root.setProperty('--site-border', token.colorBorderSecondary);
    root.setProperty('--site-bg', token.colorBgLayout);
    root.setProperty('--site-muted', token.colorTextSecondary);
    root.setProperty('--site-heading', token.colorTextHeading);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', token.colorBgContainer);
  }, [
    mode,
    token.colorBgLayout,
    token.colorBgContainer,
    token.colorPrimary,
    token.colorTextSecondary,
    token.colorTextHeading,
  ]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider><AppShell /></LocaleProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { locale } = useLocale();
  const { mode } = useThemeMode();
  const dark = mode === 'dark';

  return (
    <ConfigProvider
      locale={{ zh_CN: zhCN, en_US: enUS }[SITE_LANGUAGES.find(item => item.code === locale)?.componentLocale as 'zh_CN' | 'en_US'] ?? enUS}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: BRAND_PRIMARY,
          colorLink: BRAND_PRIMARY,
          colorInfo: BRAND_PRIMARY,
          borderRadius: 8,
          borderRadiusLG: 10,
          borderRadiusSM: 6,
          controlHeight: 40,
          controlHeightSM: 32,
          controlHeightLG: 48,
          fontFamily: FONT_FAMILY,
          ...(dark ? DARK_PALETTE : LIGHT_PALETTE),
        },
        components: {
          // 宋体的字面看起来比无衬线细，按钮统一 500，避免主按钮发虚。
          Button: { fontWeight: 500 },
        },
      }}
    >
      <AntdApp>
        <ConfigEffects mode={mode} />
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  );
}
