import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type SiteTheme = 'light' | 'dark';

const STORAGE_KEY = 'texpro:theme';

interface ThemeContextValue {
  mode: SiteTheme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ mode: 'light', toggle: () => {} });

function initialMode(): SiteTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 全站日间/夜间：只切 antd 算法与几组纸面变量，不动版式。 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SiteTheme>(initialMode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, toggle: () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark')) }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}
