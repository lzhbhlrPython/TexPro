'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { validateManifest, localeId, sourceMessages, messageCoverage, readPackage } = require('@texpro/extension-sdk/package-tools');
const { writeScaffold, authorLicense } = require('./scaffold.cjs');
function scaffoldLocale(directory, { id = 'author.language', author = 'Your name', locale = 'fr', title = 'Français', packageManager = 'npm' } = {}) {
  locale = localeId(locale);
  if (!['npm', 'yarn'].includes(packageManager) || typeof author !== 'string' || !author.trim() || /[\r\n\x00-\x1f]/.test(author)) throw new Error('Invalid language scaffold options');
  const manifest = validateManifest({ id, name: title, version: '1.0.0', apiVersion: 1, author, license: 'MIT', capabilities: [], contributes: { locales: [{ catalogVersion: 2, id: locale, title, messages: `locales/${locale}.json` }] } });
  const pkg = { name: id.replaceAll('.', '-'), version: '1.0.0', private: true, license: 'MIT', texpro: { source: '.' }, files: ['texpro.extension.json', 'locales/', 'LICENSE', 'README.md'], scripts: { 'check:extension': 'qwertysay check .', 'pack:extension': `qwertysay pack . ../${id}.tpp` }, devDependencies: { '@texpro/qwertysay': require('../package.json').version } };
  const files = new Map([['texpro.extension.json', JSON.stringify(manifest, null, 2) + '\n'], ['LICENSE', authorLicense(author)], [`locales/${locale}.json`, '{}\n'], ['reference/en.json', JSON.stringify(sourceMessages, null, 2) + '\n'], ['package.json', JSON.stringify(pkg, null, 2) + '\n'], ['.gitignore', 'node_modules/\n*.tpp\n'], ['README.md', `# ${title}\n\nCatalogue v2 semantic message IDs: reference/en.json. Add translated string values in locales/${locale}.json. Keep {placeholders} unchanged. Missing keys fall back to English; check reports missing and unknown keys. No build is required. Old phrase-key catalogues are unsupported. Long prose belongs in whole localized Markdown documents, not one message per sentence.\n\n${packageManager} install\n${packageManager} run check:extension\n${packageManager} run pack:extension\n\nOnly use ${packageManager}; commit its lockfile. Do not mix package managers. Install the .tpp through TeXPro Extensions and enable it, then choose ${title} in Preferences. Language packs are data only; never add code or styles. Translations can impersonate instructions. Verify authors, and use English or --safe-mode for recovery.\n\n第 2 版语义消息键见 reference/en.json，在 locales/${locale}.json 中填写翻译并保留占位符。缺译回退英文；无需构建。旧正文键词典不受支持。长篇说明应按语言保存完整 Markdown，不逐句拆消息键。只使用 ${packageManager} 并提交其锁文件。通过「扩展」安装并启用 .tpp，再从「偏好设置」选择语言。语言包不能包含代码或样式，但文案仍可能误导用户；仅信任可靠作者，必要时使用英文或 --safe-mode 恢复。\n`]]);
  if (packageManager === 'yarn') files.set('.yarnrc.yml', 'nodeLinker: node-modules\n');
  return { manifest, destination: writeScaffold(directory, files), suffix: 'tpp' };
}
function reportCoverage(source) {
  const { files, manifest } = readPackage(source);
  return (manifest.contributes.locales || []).map(locale => ({ id: locale.id, ...messageCoverage(JSON.parse(files.get(locale.messages))) }));
}
module.exports = { scaffoldLocale, reportCoverage };
