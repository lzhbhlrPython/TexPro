import type { ExtensionResult, Localized, InstalledExtension, ThemeContribution } from '../../../packages/extension-sdk';
export function localize(value: Localized | undefined, language: string) { return typeof value === 'string' ? value : value?.[language] || value?.[language.split('-')[0]] || value?.en || ''; }
export function capabilityTitle(value: string) { return ({ 'theme.styles': "app.custom.theme.styles", 'document.read': "app.read.document", 'document.write': "app.propose.document.changes", 'project.read': "app.read.project", 'build.request': "app.request.builds", storage: "app.local.plugin.storage", network: "app.network.access" } as Record<string, string>)[value] || value; }
export function providerTitle(value: string) { return ({ command: "app.command", diagnostic: "app.document.checker", transform: "app.writing.transform", completion: "app.completions", hover: "app.context.information", preview: "app.preview", import: "app.import", export: "app.export", bibliography: "app.bibliography.provider", asset: "app.asset.provider", mcp: "app.mcp.data.provider" } as Record<string, string>)[value] || value; }
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
