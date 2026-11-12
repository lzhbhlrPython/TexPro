import { useLayoutEffect } from 'react';
import type { Settings } from '../../types';
import type { ThemeContribution } from '../../../packages/extension-sdk';
import { applyThemeTokens } from '../extensions/contracts';

export function useTheme(settings: Settings, theme?: ThemeContribution & { key: string; css: string }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme?.base || settings.theme;
    root.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--editor-width', `${settings.editorWidth}px`);
    applyThemeTokens(root, theme);
    const style = document.createElement('style'); style.dataset.extensionStyles = '';
    if (theme) {
      root.dataset.extensionTheme = theme.key;
      // textContent avoids interpreting package CSS as HTML.
      style.textContent = theme.css + '\n@media (prefers-reduced-motion: reduce) { [data-extension-theme] *, [data-extension-theme] *::before, [data-extension-theme] *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }';
      document.head.appendChild(style);
    }
    return () => { style.remove(); delete root.dataset.extensionTheme; applyThemeTokens(root); };
  }, [theme?.key, theme?.css, JSON.stringify(theme?.tokens), settings.theme, settings.fontSize, settings.editorWidth]);
}
