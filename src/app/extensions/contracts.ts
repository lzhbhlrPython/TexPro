import type { ExtensionResult, Localized, InstalledExtension, ThemeContribution } from '../../../packages/extension-sdk';
export function localize(value: Localized | undefined, language: string) { return typeof value === 'string' ? value : value?.[language] || value?.[language.split('-')[0]] || value?.en || ''; }
export function capabilityTitle(value: string) { return ({ 'theme.styles': 'Custom theme styles', 'document.read': 'Read document', 'document.write': 'Propose document changes', 'project.read': 'Read project', 'build.request': 'Request builds', storage: 'Local plugin storage', network: 'Network access' } as Record<string, string>)[value] || value; }
export function providerTitle(value: string) { return ({ command: 'Command', diagnostic: 'Document checker', transform: 'Writing transform', completion: 'Completions', hover: 'Context information', preview: 'Preview', import: 'Import', export: 'Export', bibliography: 'Bibliography provider', asset: 'Asset provider', mcp: 'MCP data provider' } as Record<string, string>)[value] || value; }
export function enabledContributions(items: InstalledExtension[]) { return items.filter(item => item.enabled && !item.error); }
export function extensionThemes(items: InstalledExtension[]) {
  return enabledContributions(items).flatMap(item => (item.manifest.contributes.themes || []).map(theme => ({ ...theme, css: item.themeStyles?.[theme.id] || '', key: `${item.manifest.id}/${theme.id}` })));
}
export { validateResult } from '../../lib/extensionResult';
export function applyThemeTokens(root: HTMLElement, theme?: ThemeContribution) {
  const previous: string[] = JSON.parse(root.dataset.extensionTokens || '[]');
  for (const token of previous) root.style.removeProperty(`--${token}`);
  const tokens = Object.entries(theme?.tokens || {});
  for (const [key, value] of tokens) root.style.setProperty(`--${key}`, value);
  root.dataset.extensionTokens = JSON.stringify(tokens.map(([key]) => key));
}
