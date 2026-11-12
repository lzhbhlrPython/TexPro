import { useCallback, useEffect, useState } from 'react';
import type { InstalledExtension } from '../../../packages/extension-sdk';
import type { Settings } from '../../types';
import { enabledContributions, extensionThemes } from './contracts';
import { useTheme } from '../themes/useTheme';

export function useExtensions(settings: Settings) {
  const [items, setItems] = useState<InstalledExtension[]>([]);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null | undefined>();
  const refresh = useCallback(async () => { try { const next = await window.texpro.extensionsList(); setItems(next); setError(''); } catch (error) { setError(String(error)); } }, []);
  useEffect(() => {
    let alive = true;
    const update = () => { void window.texpro.extensionsList().then(next => { if (alive) { setItems(next); setError(''); } }).catch(error => { if (alive) setError(String(error)); }); };
    update(); const unsubscribe = window.texpro.onExtensionsChanged(update);
    return () => { alive = false; unsubscribe(); };
  }, []);
  const themes = extensionThemes(items);
  const theme = themes.find(theme => theme.key === (preview === undefined ? settings.themePackage : preview));
  useTheme(settings, theme);
  const active = enabledContributions(items);
  const completions = active.flatMap(item => [...item.manifest.contributes.completions || [], ...item.manifest.contributes.snippets || []]).map(item => ({ label: item.label, template: item.template, detail: item.detail || 'Extension' }));
  return { items, error, refresh, themes, preview: setPreview, completions, active };
}
