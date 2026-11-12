'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { validateManifest } = require('@gardenialiu/texpro-extension-sdk/package-tools');
const SDK = '@gardenialiu/texpro-extension-sdk';
function scaffold(directory, { id = 'author.example', author = 'Your name', type = 'plugin', language = 'ts' } = {}) {
  if (!['plugin', 'theme'].includes(type) || !['ts', 'js'].includes(language) || typeof author !== 'string' || !author.trim() || /[\r\n\x00-\x1f]/.test(author)) throw new Error('Invalid scaffold options');
  const theme = type === 'theme', manifest = validateManifest({ id, name: { en: theme ? 'My theme' : 'My plugin', zh: theme ? '我的主题' : '我的插件' }, version: '1.0.0', apiVersion: 1, author, license: 'MIT', ...(!theme ? { entry: language === 'ts' ? 'dist/index.cjs' : 'index.cjs' } : {}), capabilities: theme ? ['theme.styles'] : ['document.read', 'document.write'], contributes: theme ? { themes: [{ id: 'paper', title: { en: 'My paper', zh: '我的纸面' }, base: 'paper', tokens: { accent: '#9c472b', 'font-editor': 'Charter, Georgia, serif', radius: '12px' }, stylesheet: 'theme.css' }] } : { actions: [{ id: 'uppercase', title: { en: 'Uppercase selection', zh: '大写选中文本' }, kind: 'transform', level: 'L2' }] } });
  const suffix = theme ? 'tpt' : 'tpp';
  const pkg = { name: id.replaceAll('.', '-'), version: manifest.version, private: true, type: 'commonjs', license: 'MIT', scripts: { ...(!theme && language === 'ts' ? { build: 'tsc -p tsconfig.json' } : {}), 'check:extension': 'qwertysay check .', 'pack:extension': `qwertysay pack . ../${id}.${suffix}` }, devDependencies: { '@gardenialiu/qwertysay': require('../package.json').version, [SDK]: require('../package.json').dependencies[SDK], ...(!theme && language === 'ts' ? { typescript: '^5.9.3' } : {}) } };
  const files = new Map([['texpro.extension.json', JSON.stringify(manifest, null, 2) + '\n'], ['package.json', JSON.stringify(pkg, null, 2) + '\n'], ['.gitignore', 'node_modules/\n'], ['LICENSE', fs.readFileSync(path.join(__dirname, '../LICENSE'), 'utf8').replace(/Copyright[^\n]+/g, '').replace(/\n{3,}/g, '\n\n').replace('MIT License\n', `MIT License\n\nCopyright (c) ${new Date().getUTCFullYear()} ${author}\n`)] ]);
  if (theme) files.set('theme.css', '/* Theme styles can hide or imitate UI: review before enabling. */\n.extensions-panel, .extension-tool { border-radius: var(--radius); }\n@media (max-width: 760px) { .extensions-panel { border-radius: 0; } }\n');
  else {
    const handler = "ctx => {\n  ctx.handle('uppercase', context => {\n    const { from, to } = context.selection;\n    if (from === to) return { message: context.language === 'zh' ? '请先选中文字。' : 'Select text first.' };\n    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };\n  });\n}";
    files.set(language === 'ts' ? 'src/index.cts' : 'index.cjs', language === 'ts' ? `import type { Extension } from '${SDK}';\nexport const activate: Extension['activate'] = ${handler};\n` : `// @ts-check\n/** @type {import('${SDK}').Extension['activate']} */\nexports.activate = ${handler};\n`);
    if (language === 'ts') files.set('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'Node16', moduleResolution: 'Node16', strict: true, rootDir: 'src', outDir: 'dist', skipLibCheck: true }, include: ['src/**/*.cts'] }, null, 2) + '\n');
  }
  files.set('README.md', `# ${id}\n\nAPI 1 ${type}. Run npm install${!theme && language === 'ts' ? ', npm run build' : ''}, npm run check:extension, then npm run pack:extension. Output: ../${id}.${suffix}. No install/build commands run automatically. Install the artifact through TeXPro Extensions, review and enable.\n\nAPI 1 ${theme ? '主题' : '插件'}。安装依赖${!theme && language === 'ts' ? '并构建' : ''}后校验和打包，通过 TeXPro「扩展」安装，检查后启用。\n\nSecurity / 安全：Node plugins can access user files, networks and processes. Themes can hide controls or imitate UI. Only enable trusted authors. Native View reset and --safe-mode disable all extensions. / Node 插件有用户权限，主题也可隐藏或伪装界面；仅启用可信来源。原生视图菜单和 --safe-mode 可恢复。\n`);
  const destination = path.resolve(directory);
  if (fs.existsSync(destination) && (fs.lstatSync(destination).isSymbolicLink() || !fs.statSync(destination).isDirectory() || fs.readdirSync(destination).length)) throw new Error('Destination must be a new or empty regular directory');
  fs.mkdirSync(destination, { recursive: true });
  for (const [name, content] of files) { const target = path.join(destination, name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content, { flag: 'wx' }); }
  return { manifest, destination, suffix };
}
module.exports = { scaffold };
