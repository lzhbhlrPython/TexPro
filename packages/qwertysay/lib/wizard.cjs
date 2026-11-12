'use strict';
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { languages, styles, validateManifest, readPackage, packageKind } = require('@texpro/extension-sdk/package-tools');
const { artifactDirectory } = require('./build.cjs');

class WizardCancelled extends Error {
  constructor() { super('Cancelled / 已取消；未开始所选操作。'); this.exitCode = 130; }
}
function createPrompter(input, output) {
  const rl = readline.createInterface({ input, output, terminal: Boolean(input.isTTY && output.isTTY), crlfDelay: Infinity });
  const lines = rl[Symbol.asyncIterator]();
  let interrupted = false;
  rl.on('SIGINT', () => { interrupted = true; rl.close(); });
  return {
    async ask(prompt) {
      output.write(prompt);
      const next = await lines.next();
      if (interrupted || next.done) throw new WizardCancelled();
      return next.value;
    },
    close() { rl.close(); },
  };
}
async function planInteractive({ ask, write = console.log, command } = {}) {
  const language = await ask('Language / 语言: 1 简体中文, 2 English [1]: ');
  let locale;
  if (!language.trim() || ['1', 'zh'].includes(language.trim().toLowerCase())) locale = 'zh';
  else if (['2', 'en'].includes(language.trim().toLowerCase())) locale = 'en';
  else throw new Error('Choose 1 / 请选择 1，or / 或 2');
  const t = (zh, en) => locale === 'zh' ? zh : en;
  const clean = value => !/[\x00-\x1f\x7f]/.test(value);
  async function text(label, fallback = '', validate = value => Boolean(value)) {
    for (;;) {
      const answer = (await ask(`${label}${fallback ? ` [${fallback}]` : ''}: `)).trim() || fallback;
      try { if (clean(answer) && validate(answer)) return answer; } catch { /* Show an editable validation error. */ }
      write(t('输入无效，请重新填写。', 'Invalid input; please try again.'));
    }
  }
  async function choice(label, entries) {
    write(label);
    entries.forEach(([key, name], index) => write(`  ${index + 1}. ${name} (${key})`));
    const value = await text(t('选择', 'Choose'), '1', answer => entries.some(([key], index) => answer === key || answer === String(index + 1)));
    return entries.find(([key], index) => value === key || value === String(index + 1))[0];
  }
  const action = command || await choice(t('要进行什么操作？', 'What would you like to do?'), [
    ['init', t('创建插件或主题', 'Create a plugin or theme')], ['build', t('构建可信源码', 'Build trusted source')],
    ['check', t('校验目录或安装包', 'Check a directory or package')], ['pack', t('打包分发', 'Pack for distribution')], ['install', t('从 npm 获取扩展并交给 TeXPro 审核', 'Get an extension from npm for TeXPro review')], ['npm-package', t('创建 npm 分发包', 'Create an npm distribution wrapper')], ['environment', t('创建 npm／Yarn 扩展管理环境', 'Create an npm/Yarn extension environment')], ['sync', t('同步已安装依赖与移除请求', 'Sync installed dependencies and removal requests')],
  ]);
  let plan;
  if (action === 'environment') {
    const directory = await text(t('新扩展环境目录', 'New extension environment directory'), 'texpro-extensions', value => !fs.existsSync(value));
    const pm = await choice(t('包管理器', 'Package manager'), [['npm', 'npm'], ['yarn', 'Yarn']]);
    plan = { command: action, args: [action, path.resolve(directory), pm] };
    write(t('仅创建环境，不联网或安装依赖。后续安装依赖时禁用生命周期脚本。', 'Creates configuration only; no network or dependency installation. Disable lifecycle scripts when installing dependencies.'));
  } else if (action === 'sync') {
    const directory = await text(t('扩展环境目录', 'Extension environment directory'), '.', value => { require('./environment.cjs').environmentPlan(value); return true; });
    plan = { command: action, args: [action, path.resolve(directory)] };
    write(t('读取已安装包与锁文件，交给 TeXPro 审核新增、更新与移除；不自动启用。', 'Reads installed wrappers and the lockfile; asks TeXPro to review additions, updates and removals. Never auto-enables.'));
  } else if (action === 'install') {
    const spec = await text(t('公开 npm 包名（可附版本）', 'Public npm package name (optional version)'), '@texpro/extension-translate-zh-cn', value => { require('./registry.cjs').parseSpec(value); return true; });
    const output = await text(t('保存为新 .tpp 或 .tpt 文件', 'Save as a new .tpp or .tpt file'), 'extension.tpp', value => /\.(tpp|tpt)$/.test(value) && !fs.existsSync(value));
    const open = await choice(t('下载校验后交给 TeXPro？', 'Open in TeXPro after download and validation?'), [['no', t('仅下载，之后手动审核', 'Download only, review manually later')], ['yes', t('打开现有安装审核，不自动启用', 'Open install review; never auto-enable')]]);
    plan = { command: action, spec, output: path.resolve(output), open: open === 'yes' };
    write(t('这会联网下载公开 npm 元数据和归档，校验 SHA-512 与 .tpp/.tpt；不会安装 npm 依赖、执行脚本或启用扩展。安装仍需在 TeXPro 中确认。', 'This downloads public npm metadata and an archive, verifies SHA-512 and .tpp/.tpt validation; it never installs npm dependencies, runs scripts or enables extensions. Confirm installation in TeXPro.'));
  } else if (action === 'npm-package') {
    const source = await text(t('已打包 .tpp 或 .tpt 文件', 'Packed .tpp or .tpt file'), '', value => /\.(tpp|tpt)$/.test(value) && fs.existsSync(value));
    const destination = await text(t('新 npm 分发目录', 'New npm distribution directory'), 'npm-package', value => !fs.existsSync(value));
    const name = await text(t('npm 包名', 'npm package name'), '@author/my-extension', value => require('./registry.cjs').parseSpec(value).name === value);
    plan = { command: action, args: [action, path.resolve(source), path.resolve(destination), name] };
    write(t('仅创建分发包，不安装依赖或发布。', 'Creates a wrapper only; does not install dependencies or publish.'));
  } else if (action === 'init') {
    const type = await choice(t('扩展类型', 'Extension type'), [['plugin', t('插件', 'Plugin')], ['theme', t('主题包', 'Theme')], ['locale', t('语言包（仅数据）', 'Language pack (data only)')]]);
    const directory = await text(t('新建目录（新目录或空目录）', 'Destination (new or empty directory)'), type === 'theme' ? 'my-theme' : 'my-plugin', value => {
      const target = path.resolve(value);
      return !fs.existsSync(target) || (!fs.lstatSync(target).isSymbolicLink() && fs.statSync(target).isDirectory() && !fs.readdirSync(target).length);
    });
    const id = await text(t('包标识', 'Package ID'), 'author.example', value => {
      validateManifest({ id: value, name: 'Example', author: 'Author', version: '1.0.0', apiVersion: 1, license: 'MIT', capabilities: [], contributes: { themes: [{ id: 'accent', title: 'Accent', base: 'paper', tokens: {} }] } });
      return true;
    });
    const author = await text(t('作者（写入 MIT 许可证）', 'Author (included in the MIT license)'), 'Your name');
    const options = { id, author, type };
    if (type === 'plugin') options.language = await choice(t('开发语言', 'Plugin language'), Object.entries(languages).map(([key, value]) => [key, value.name]));
    else if (type === 'locale') {
      options.locale = await text(t('语言标识（BCP 47）', 'Language identifier (BCP 47)'), 'fr', value => { require('@texpro/extension-sdk/package-tools').localeId(value); return true; });
      options.title = await text(t('语言自称（如 Français）', 'Language autonym (for example Français)'), 'Français');
    } else {
      options.style = await choice(t('主题开发方式', 'Theme authoring style'), [['tokens', t('仅修改主题色，无需编译', 'Accent only, no compilation')], ...Object.entries(styles).map(([key, value]) => [key, value.name])]);
      if (options.style === 'tokens') {
        options.base = await choice(t('基础主题', 'Base theme'), ['paper', 'studio', 'night'].map(key => [key, key]));
        options.accent = await text(t('强调色（六位或八位十六进制）', 'Accent color (6 or 8 hex digits)'), '#9c472b', value => /^#[a-f\d]{6}(?:[a-f\d]{2})?$/i.test(value));
      }
    }
    if (options.style !== 'tokens') options.packageManager = await choice(t('包管理器（仅配置，不自动安装）', 'Package manager (configuration only, no installation)'), [['npm', 'npm'], ['yarn', 'Yarn (node_modules)']]);
    plan = { command: action, directory: path.resolve(directory), options, tokensOnly: options.style === 'tokens' };
    write(t('仅创建源码，不安装依赖、不构建。', 'Creates source only; no dependency installation or build.'));
  } else {
    const source = await text(t('源码目录、已构建目录或安装包路径', 'Source directory, built directory or package path'), '.', value => fs.existsSync(value) && (action === 'check' || fs.statSync(value).isDirectory()));
    plan = { command: action, args: [action, path.resolve(source)] };
    if (action === 'pack') {
      const { manifest } = readPackage(artifactDirectory(path.resolve(source)));
      const suffix = packageKind(manifest) === 'theme' ? 'tpt' : 'tpp';
      const fallback = path.join(path.dirname(path.resolve(source)), `${manifest.id}.${suffix}`);
      plan.args.push(await text(t('新安装包路径（目录外，不覆盖现有文件）', 'New package path (outside source, no overwrite)'), fallback, value => {
        const output = path.resolve(value), relative = path.relative(path.resolve(source), output);
        return !fs.existsSync(output) && (relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) && output.endsWith('.' + suffix);
      }));
    }
    write(action === 'build'
      ? t('构建会以你的权限执行编译器和工程配置，可能下载依赖。仅构建可信源码。', 'Build executes compilers and project configuration with your permissions and may download dependencies. Build trusted source only.')
      : t('校验和打包不会构建、联网或执行插件。', 'Check and pack do not build, access networks or execute plugins.'));
  }
  write(t('操作预览：', 'Review:'));
  write(JSON.stringify(plan, null, 2));
  const confirm = (await ask(t('继续？[y/N]: ', 'Continue? [y/N]: '))).trim().toLowerCase();
  if (!['y', 'yes', '是'].includes(confirm)) return null;
  return plan;
}
module.exports = { planInteractive, createPrompter, WizardCancelled };
