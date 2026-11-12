'use strict';
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { languages, styles, validateManifest, readPackage, packageKind } = require('@gardenialiu/texpro-extension-sdk/package-tools');
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
    ['check', t('校验目录或安装包', 'Check a directory or package')], ['pack', t('打包分发', 'Pack for distribution')],
  ]);
  let plan;
  if (action === 'init') {
    const type = await choice(t('扩展类型', 'Extension type'), [['plugin', t('插件', 'Plugin')], ['theme', t('主题包', 'Theme')]]);
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
    else {
      options.style = await choice(t('主题开发方式', 'Theme authoring style'), [['tokens', t('仅修改主题色，无需编译', 'Accent only, no compilation')], ...Object.entries(styles).map(([key, value]) => [key, value.name])]);
      if (options.style === 'tokens') {
        options.base = await choice(t('基础主题', 'Base theme'), ['paper', 'studio', 'night'].map(key => [key, key]));
        options.accent = await text(t('强调色（六位或八位十六进制）', 'Accent color (6 or 8 hex digits)'), '#9c472b', value => /^#[a-f\d]{6}(?:[a-f\d]{2})?$/i.test(value));
      }
    }
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
