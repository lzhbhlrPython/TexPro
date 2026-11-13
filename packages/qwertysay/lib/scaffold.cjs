'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { validateManifest, languages, styles } = require('@texpro/extension-sdk/package-tools');
const pluginTemplates = require('./templates/languages.cjs').templates;
const themeTemplates = require('./templates/styles.cjs').templates;
const SDK = '@texpro/extension-sdk';

function authorLicense(author) {
  return fs.readFileSync(path.join(__dirname, '../LICENSE'), 'utf8').replace(/Copyright[^\n]+/g, '').replace(/\n{3,}/g, '\n\n').replace('MIT License\n', `MIT License\n\nCopyright (c) ${new Date().getUTCFullYear()} ${author}\n`);
}
function writeScaffold(directory, files) {
  const destination = path.resolve(directory);
  if (fs.existsSync(destination) && (fs.lstatSync(destination).isSymbolicLink() || !fs.statSync(destination).isDirectory() || fs.readdirSync(destination).length)) throw new Error('Destination must be a new or empty regular directory');
  fs.mkdirSync(destination, { recursive: true });
  for (const [name, content] of files) { const target = path.join(destination, name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content, { flag: 'wx' }); }
  return destination;
}
function scaffoldTokenTheme(directory, { id, author, base = 'paper', accent = '#9c472b' }) {
  if (typeof author !== 'string' || !author.trim() || /[\r\n\x00-\x1f]/.test(author)) throw new Error('Invalid author');
  const manifest = validateManifest({ id, name: { en: 'My theme', zh: '我的主题' }, version: '1.0.0', apiVersion: 1, author, license: 'MIT', capabilities: [], contributes: { themes: [{ id: 'accent', title: { en: 'My accent', zh: '我的强调色' }, base, tokens: { accent } }] } });
  const destination = writeScaffold(directory, new Map([['texpro.extension.json', JSON.stringify(manifest, null, 2) + '\n'], ['LICENSE', authorLicense(author)]]));
  return { manifest, destination, suffix: 'tpt' };
}

function scaffold(directory, { id = 'author.example', author = 'Your name', type = 'plugin', language = 'ts', style = 'css', packageManager = 'npm' } = {}) {
  if (!['npm', 'yarn'].includes(packageManager)) throw new Error('Choose npm or yarn');
  if (!['plugin', 'theme'].includes(type) || !Object.hasOwn(languages, language) || !Object.hasOwn(styles, style) || typeof author !== 'string' || !author.trim() || /[\r\n\x00-\x1f]/.test(author)) throw new Error('Invalid scaffold options');
  if (type === 'plugin' && style !== 'css') throw new Error('--style applies to theme packages');
  const theme = type === 'theme', template = theme ? themeTemplates[style] : pluginTemplates[language];
  const manifest = validateManifest({ id, name: { en: theme ? 'My theme' : 'My plugin', zh: theme ? '我的主题' : '我的插件' }, version: '1.0.0', apiVersion: 1, author, license: 'MIT', ...(!theme ? { entry: 'index.cjs' } : {}), capabilities: theme ? ['theme.styles'] : ['document.read', 'document.write'], contributes: theme ? { themes: [{ id: 'paper', title: { en: 'My paper', zh: '我的纸面' }, base: 'paper', tokens: { accent: '#9c472b', 'font-editor': 'Charter, Georgia, serif', radius: '12px' }, stylesheet: 'theme.css' }] } : { actions: [{ id: 'uppercase', title: { en: 'Uppercase selection', zh: '大写选中文本' }, kind: 'transform', level: 'L2' }] } });
  const suffix = theme ? 'tpt' : 'tpp';
  const pkg = { name: id.replaceAll('.', '-'), version: manifest.version, private: true, type: 'commonjs', license: 'MIT', texpro: { source: '.' }, files: ['texpro.extension.json', 'qwertysay.build.json', 'src/', 'assets/', 'LICENSE', 'README.md', ...Object.keys(template.files || {}).filter(name => !name.startsWith('src/'))], scripts: { build: 'qwertysay build .', 'check:extension': 'qwertysay check .', 'pack:extension': `qwertysay pack . ../${id}.${suffix}` }, devDependencies: { '@texpro/qwertysay': require('../package.json').version, [SDK]: require('../package.json').dependencies[SDK], ...template.dependencies } };
  if (theme) pkg.files.push(template.source);
  if (!theme && language === 'go') pkg.files.push('go.sum');
  if (!theme && language === 'purs') pkg.files.push('spago.lock');
  if (language === 'purs' && !theme) pkg.engines = { node: '>=22.5.0' };
  else if (theme && ['scss', 'sass'].includes(style)) pkg.engines = { node: '>=20.19.0' };
  const files = new Map([
    ['texpro.extension.json', JSON.stringify(manifest, null, 2) + '\n'],
    ['qwertysay.build.json', JSON.stringify({ version: 1, type, ...(theme ? { style } : { language }) }, null, 2) + '\n'],
    ['package.json', JSON.stringify(pkg, null, 2) + '\n'],
    ['.gitignore', 'node_modules/\n.qwertysay/\ndist/\noutput/\ntarget/\n.spago/\n.shadow-cljs/\nelm-stuff/\nlib/\n*.res.js\n'],
    ['LICENSE', authorLicense(author)],
    ...Object.entries(template.files || {}),
  ]);
  if (theme) files.set(template.source, template.content);
  if (!theme && language === 'rescript') { const rescript = JSON.parse(files.get('rescript.json')); rescript.name = pkg.name; files.set('rescript.json', JSON.stringify(rescript, null, 2) + '\n'); }
  if (packageManager === 'yarn') files.set('.yarnrc.yml', 'nodeLinker: node-modules\n');
  const toolchain = theme ? styles[style].toolchain : languages[language].toolchain;
  const developmentNote = require('../package.json').version.includes('-') ? 'UNRELEASED SOURCE VERSION / 未发布源码版本：Install matching local SDK and qwertysay paths together with npm install --save-dev /absolute/TeXPro/packages/extension-sdk /absolute/TeXPro/packages/qwertysay before building. Do not request this development version from npm. / 构建前从同一源码检出同时安装 SDK 与脚手架，不要从 npm 请求此开发版本。\n\n' : '';
  files.set('README.md', `# ${id}\n\n${developmentNote}API 1 ${type}; ${theme ? styles[style].name : languages[language].name}. Prerequisite: ${toolchain}.\n\nRun npm install, npm run build, npm run check:extension, then npm run pack:extension. Build output: dist/package; shared artifact: ../${id}.${suffix}. Load dist/package (not this source directory) for development in TeXPro. Check and pack never build or execute author code; stale builds are rejected. Build explicitly executes trusted compilers and project configuration and may download compiler dependencies.\n\nAPI 1 ${theme ? '主题' : '插件'}；前提：${toolchain}。依次安装依赖、构建、校验、打包。开发时加载 dist/package，分发 ../${id}.${suffix}。源码后缀不等于安装包后缀：插件为 .tpp，主题为 .tpt。校验和打包不会隐式构建，源码变更后需重新构建。构建会执行可信编译器及工程配置，工具链可能联网下载依赖。\n\n${language === 'purs' && !theme ? 'Install the PureScript compiler and Spago through npm; Spago downloads the pinned registry dependencies. / Spago 会下载固定包集依赖。\n\n' : ''}${language === 'scala' && !theme ? 'Install Java and sbt first. On Windows set TEXPRO_SBT_LAUNCHER to the sbt-launch.jar path and put java on PATH. The pinned sbt/Scala.js toolchain resolves Maven dependencies. / 请先安装 Java 与 sbt，工具链会解析 Maven 依赖。\n\n' : ''}${language === 'go' && !theme ? 'Install GopherJS v1.21.0 with its required Go 1.21.x toolchain and put gopherjs on PATH. Run go mod tidy explicitly before building. On recent macOS, building this older Go tool with external linking and ad hoc signing may be necessary; see the authoring guide. / GopherJS 需要匹配的 Go 工具链；构建前明确执行 go mod tidy。\n\n' : ''}${style === 'tcss' && theme ? 'Install the official compiler: cargo install tcss-cli --version 1.0.0 --locked. Put tcss on PATH. tcss-js is not available on npm; this is Thematic CSS, not Textual CSS. / 需安装官方 tcss-cli 并使 tcss 在 PATH 中可用；不是 Textual CSS。\n\n' : ''}Security / 安全：Build tools execute code with developer permissions. Node plugins can access user files, networks and processes; process isolation is not a sandbox. Themes can hide controls or imitate UI. Only enable trusted authors. Native View reset and --safe-mode disable all extensions. / 构建工具拥有开发者权限；Node 插件有用户权限，主题也可隐藏或伪装界面；仅启用可信来源。原生视图菜单和 --safe-mode 可恢复。\n`);
  files.set('README.md', files.get('README.md').replace(`# ${id}\n\n`, `# ${id}\n\nGuided workflow / 引导操作：After explicitly installing dependencies, run npx --no-install qwertysay and choose build, check or pack. Review before confirming; Enter cancels. / 明确安装依赖后运行 npx --no-install qwertysay，选择构建、校验或打包并确认。无需记住工具参数；下方 npm scripts 保留用于自动化。\n\n`));
  if (packageManager === 'yarn') files.set('README.md', files.get('README.md').replaceAll('npm install', 'yarn install').replaceAll('npm run', 'yarn run').replaceAll('npx --no-install qwertysay', 'yarn qwertysay'));
  files.set('README.md', files.get('README.md') + `\nPackage manager / 包管理器：${packageManager}. Commit only its lockfile. / 仅提交该工具的锁文件，不混用 npm 与 yarn。\n`);
  files.set('README.md', files.get('README.md') + '\nDirect npm source / 直接发布源码：The template declares texpro.source and a publishing files list. To publish, choose an npm name you own, align manifest/package versions, remove private: true, inspect npm pack --dry-run --ignore-scripts and test the real tgz in a fresh extension environment. Consumers install with scripts disabled, explicitly prepare trusted source in qwertysay, then sync and review in TeXPro. Missing external or installer-dependent compilers must be reviewed and installed separately. / 模板包含源码声明与发布文件列表；改成自己的 npm 包名、同步版本、移除 private: true，核查并测试实际 tgz 后才发布。用户安装时禁用脚本，需要编译则在 qwertysay 单独确认构建，再同步审核；缺失的外部工具链需另行审核安装。\n');
  const destination = writeScaffold(directory, files);
  return { manifest, destination, suffix };
}
module.exports = { scaffold, scaffoldTokenTheme, writeScaffold, authorLicense };
