import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type SiteTheme = 'light' | 'dark';

const STORAGE_KEY = 'texpro:theme';

interface ThemeContextValue {
  mode: SiteTheme;
  toggle: () => void;
  setMode: (mode: SiteTheme) => void;
  /** 临时覆盖（不写 localStorage），离开这个页面时清空。 */
  setOverride: (mode: SiteTheme | null) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  toggle: () => {},
  setMode: () => {},
  setOverride: () => {},
});

function initialMode(): SiteTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 全站日间/夜间：只切 antd 算法与几组纸面变量，不动版式。 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SiteTheme>(initialMode);
  const [override, setOverride] = useState<SiteTheme | null>(null);
  const effective = override ?? mode;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode: effective,
      toggle: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
      setMode,
      setOverride,
    }),
    [effective, setMode, setOverride],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = override ?? mode;
  }, [mode, override]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
