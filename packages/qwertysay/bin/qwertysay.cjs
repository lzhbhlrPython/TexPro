#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { readPackage, validatePackageType } = require('@texpro/extension-sdk/package-tools');
const { pack } = require('@texpro/extension-sdk/package-tools');
const { scaffold, scaffoldTokenTheme } = require('../lib/scaffold.cjs');
const { scaffoldLocale, reportCoverage } = require('../lib/locales.cjs');
const { build, artifactDirectory } = require('../lib/build.cjs');
const { languages, styles } = require('@texpro/extension-sdk/package-tools');
async function main(args) {
  const [command, ...rest] = args;
  if (command === '--version') return console.log(require('../package.json').version);
  if (['--help', '-h', 'help'].includes(command)) return console.log(`qwertysay — guided setup / 引导式配置 (run without arguments in a terminal)\nSelect language, create/build/check/pack, package type and toolchain; review before execution.\nAutomation compatibility:\nqwertysay init <directory> [--id author.name] [--author "Your name"] [--type plugin|theme|locale] [--package-manager npm|yarn] [--locale fr] [--title Français] [--language ${Object.keys(languages).join('|')}] [--style ${Object.keys(styles).join('|')}]\nqwertysay environment <new-directory> [npm|yarn]\nqwertysay sync <extension-environment>\nqwertysay install <public-npm-name[@version]> <new-output.tpp|new-output.tpt>\nqwertysay npm-package <file.tpp|file.tpt> <new-directory> <npm-name>\nqwertysay build <source-directory>\nqwertysay check <source-or-built-directory|file.tpp|file.tpt>\nqwertysay pack <source-or-built-directory> <new-output.tpp|new-output.tpt>\nInit/check/pack never install, build, execute author code or access the network. Explicit build executes trusted compiler/project code; toolchains may download dependencies.`);
  if (!command || command === 'wizard' || (['init', 'build', 'check', 'pack', 'install', 'npm-package', 'environment', 'sync'].includes(command) && !rest.length)) {
    if (!process.stdin.isTTY) throw new Error('Guided setup requires a terminal / 引导式配置需要交互终端。For automation, use explicit commands; see qwertysay --help.');
    const { createPrompter, planInteractive } = require('../lib/wizard.cjs');
    const prompt = createPrompter(process.stdin, process.stdout);
    let plan;
    try { plan = await planInteractive({ ask: prompt.ask, command: command === 'wizard' ? undefined : command }); }
    finally { prompt.close(); }
    if (!plan) return console.log('Cancelled / 已取消；未开始所选操作。');
    if (plan.command === 'install') { const result = await require('../lib/registry.cjs').downloadExtension(plan.spec, plan.output); console.log(`${result.name}@${result.version}: ${result.destination}, SHA-256 ${result.digest}`); if (plan.open) await require('../lib/registry.cjs').openForReview(result.destination); return; }
    if (plan.command !== 'init') return main(plan.args);
    const result = plan.tokensOnly ? scaffoldTokenTheme(plan.directory, plan.options) : plan.options.type === 'locale' ? scaffoldLocale(plan.directory, plan.options) : scaffold(plan.directory, plan.options);
    const nextSteps = plan.tokensOnly ? 'No build required / 无需构建；run qwertysay to check or pack .tpt.' : plan.options.type === 'locale' ? 'Translate locales/*.json, then check and pack .tpp; no dependency installation or build required. / 翻译 locales/*.json 后校验并打包 .tpp，无需安装依赖或构建。' : 'Install dependencies explicitly with your selected package manager, then run qwertysay to build/check/pack. / 按所选包管理器明确安装依赖，再进入引导构建、校验、打包。';
    return console.log(`Created ${result.manifest.id} in ${result.destination}. ${nextSteps}`);
  }
  if (command === 'environment') {
    if (rest.length < 1 || rest.length > 2) throw new Error('Use environment <new-directory> [npm|yarn]');
    console.log(require('../lib/environment.cjs').environmentInit(rest[0], rest[1])); return;
  }
  if (command === 'sync') {
    if (rest.length !== 1) throw new Error('Use sync <extension-environment>');
    const file = require('../lib/environment.cjs').writeEnvironmentPlan(rest[0]);
    console.log(`Review plan: ${file}. TeXPro will ask before additions, updates and removals; nothing is automatically enabled.`);
    await require('../lib/registry.cjs').openSyncReview(file); return;
  }
  if (command === 'install') {
    if (rest.length !== 2) throw new Error('Use install <public-npm-name[@version]> <new-output.tpp|new-output.tpt>; use the wizard to open it for review');
    const result = await require('../lib/registry.cjs').downloadExtension(rest[0], rest[1]);
    console.log(`${result.name}@${result.version}: ${result.destination} SHA-256 ${result.digest}. Open this file in TeXPro to review and install disabled.`); return;
  }
  if (command === 'npm-package') {
    if (rest.length !== 3) throw new Error('Use npm-package <file.tpp|file.tpt> <new-directory> <npm-name>');
    console.log(require('../lib/registry.cjs').wrapperPackage(...rest)); return;
  }
  if (command === 'init') {
    if (!rest[0] || rest[0].startsWith('--')) throw new Error('Choose a destination directory');
    const options = {};
    for (let i = 1; i < rest.length; i += 2) { const key = rest[i].slice(2); if (!rest[i].startsWith('--') || !['id', 'author', 'type', 'language', 'style', 'locale', 'title', 'package-manager'].includes(key) || !rest[i + 1] || rest[i + 1].startsWith('--') || Object.hasOwn(options, key)) throw new Error('Invalid init option: ' + rest[i]); options[key] = rest[i + 1]; }
    if (options['package-manager']) { options.packageManager = options['package-manager']; delete options['package-manager']; }
    const result = options.type === 'locale' ? scaffoldLocale(rest[0], options) : scaffold(rest[0], options); return console.log(`Created ${result.manifest.id} in ${result.destination}. See README.md for build and .${result.suffix} packaging steps.`);
  }
  if (command === 'build') {
    if (rest.length !== 1) throw new Error('Choose one source directory');
    const result = await build(rest[0]); return console.log(`Built ${result.manifest.id}: ${result.output}`);
  }
  if (!['check', 'pack'].includes(command) || rest.length !== (command === 'pack' ? 2 : 1)) throw new Error('Invalid command; run qwertysay --help');
  const requested = path.resolve(rest[0]), source = fs.statSync(requested).isDirectory() ? artifactDirectory(requested) : requested;
  const { files, manifest, digest } = readPackage(source);
  if (command === 'pack') {
    const output = path.resolve(rest[1]), relative = path.relative(requested, output);
    if (!relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) throw new Error('Choose an output outside the source directory');
    validatePackageType(manifest, output, files);
    fs.writeFileSync(output, pack(files), { flag: 'wx' });
  }
  for (const coverage of reportCoverage(source)) console.log(`Language ${coverage.id}: ${coverage.translated}/${coverage.total}, missing ${coverage.missing.length}, unknown ${coverage.unknown.length}. Missing messages fall back to English.`);
  console.log(`${manifest.id}@${manifest.version}: valid API ${manifest.apiVersion}, SHA-256 ${digest}`);
}
module.exports = { main };
if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = error.exitCode || 1; });
