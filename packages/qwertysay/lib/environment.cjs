'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { readPackage, relative } = require('@texpro/extension-sdk/package-tools');
const { writeScaffold } = require('./scaffold.cjs');
function environmentInit(directory, packageManager = 'npm') {
  if (!['npm', 'yarn'].includes(packageManager)) throw new Error('Choose npm or yarn');
  const config = { id: crypto.randomUUID(), packageManager };
  const pkg = { name: 'texpro-extensions', version: '1.0.0', private: true, texpro: { environment: config }, scripts: { 'sync:extensions': 'qwertysay sync .' }, devDependencies: { '@texpro/qwertysay': require('../package.json').version } };
  const files = new Map([['package.json', JSON.stringify(pkg, null, 2) + '\n'], ['.gitignore', 'node_modules/\n.texpro-sync/\n'], ['README.md', `# TeXPro extension environment\n\nUse ${packageManager} only and commit its lockfile. Explicitly install trusted dependencies with lifecycle scripts disabled, then run ${packageManager} run sync:extensions. Review each addition, update or removal in TeXPro. No extension is enabled automatically.\n\n仅使用 ${packageManager} 并提交其锁文件。明确安装可信依赖并禁用生命周期脚本，再运行 ${packageManager} run sync:extensions。在 TeXPro 中逐项审核新增、更新与移除；不会自动启用插件。\n`]]);
  if (packageManager === 'yarn') files.set('.yarnrc.yml', 'nodeLinker: node-modules\nenableScripts: false\n');
  else files.set('.npmrc', 'ignore-scripts=true\n');
  return writeScaffold(directory, files);
}
function environmentPlan(directory) {
  const root = fs.realpathSync(directory), pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  const config = pkg.texpro?.environment;
  if (!config || !/^[0-9a-f-]{36}$/.test(config.id) || !['npm', 'yarn'].includes(config.packageManager)) throw new Error('Initialize a dedicated extension environment first');
  const npmLock = fs.existsSync(path.join(root, 'package-lock.json')), yarnLock = fs.existsSync(path.join(root, 'yarn.lock'));
  if (npmLock && yarnLock || config.packageManager === 'npm' && !npmLock || config.packageManager === 'yarn' && !yarnLock) throw new Error('A matching single package manager lockfile is required; install dependencies first');
  const packages = [], ids = new Set();
  for (const name of Object.keys(pkg.dependencies || {})) {
    if (require('./registry.cjs').parseSpec(name).name !== name) throw new Error('Invalid dependency name');
    // Resolve data paths directly. Never require a dependency or run its lifecycle code.
    const directory = path.join(root, 'node_modules', name), metadataFile = path.join(directory, 'package.json');
    const metadata = JSON.parse(fs.readFileSync(metadataFile));
    if (metadata.name !== name || !metadata.texpro?.package) throw new Error('Dependency is not a TeXPro extension wrapper: ' + name);
    relative(metadata.texpro.package);
    const source = fs.realpathSync(path.join(directory, metadata.texpro.package));
    const actualRoot = fs.realpathSync(directory);
    if (!source.startsWith(actualRoot + path.sep)) throw new Error('Extension artifact escapes its npm package');
    const info = readPackage(source);
    if (info.development || ids.has(info.manifest.id)) throw new Error('Duplicate extension identity or unpacked artifact');
    ids.add(info.manifest.id);
    packages.push({ name, version: metadata.version, source, id: info.manifest.id, digest: info.digest });
  }
  if (packages.length > 100) throw new Error('Too many extension dependencies');
  const lock = fs.readFileSync(path.join(root, npmLock ? 'package-lock.json' : 'yarn.lock'));
  return { version: 1, environment: config.id, root, packageManager: config.packageManager, lockDigest: crypto.createHash('sha256').update(lock).digest('hex'), packages };
}
function writeEnvironmentPlan(directory) {
  const plan = environmentPlan(directory), output = path.join(plan.root, '.texpro-sync');
  if (fs.existsSync(output) && (fs.lstatSync(output).isSymbolicLink() || !fs.statSync(output).isDirectory())) throw new Error('Sync output must be a regular directory');
  fs.mkdirSync(output, { recursive: true });
  const file = path.join(output, crypto.randomUUID() + '.json'); fs.writeFileSync(file, JSON.stringify(plan, null, 2), { flag: 'wx' });
  return file;
}
module.exports = { environmentInit, environmentPlan, writeEnvironmentPlan };
