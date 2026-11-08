import { useEffect } from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BRAND_PRIMARY } from '@/config/design';
import { router } from '@/router';

/**
 * 全站统一用思源宋体（Noto Serif SC，CDN 见 index.html）。
 * 后面的系统宋体是字体未加载完成时的兜底，最后才是通用 serif。
 */
export const FONT_FAMILY = `'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'Noto Serif CJK SC', 'SimSun', 'Times New Roman', Georgia, serif`;

const PALETTE = {
  colorBgLayout: '#F7F2EA',
  colorBgContainer: '#FFFCF7',
  colorBgElevated: '#FFFCF7',
  colorBorderSecondary: '#EBE1D2',
  colorText: '#2A231E',
  colorTextHeading: '#1C1613',
};

function ConfigEffects() {
  const { token } = antdTheme.useToken();

  useEffect(() => {
    document.body.style.backgroundColor = token.colorBgLayout;
    document.documentElement.style.colorScheme = 'light';
    const root = document.documentElement.style;
    root.setProperty('--site-brand', token.colorPrimary);
    root.setProperty('--site-border', token.colorBorderSecondary);
    root.setProperty('--site-bg', token.colorBgLayout);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', token.colorBgContainer);
  }, [token.colorBgLayout, token.colorBgContainer, token.colorPrimary]);

  return null;
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: antdTheme.defaultAlgorithm,
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
          ...PALETTE,
        },
        components: {
          // 宋体的字面看起来比无衬线细，按钮统一 500，避免主按钮发虚。
          Button: { fontWeight: 500 },
        },
      }}
    >
      <AntdApp>
        <ConfigEffects />
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  );
}
