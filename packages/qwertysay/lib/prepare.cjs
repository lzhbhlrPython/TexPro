'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const { execFileSync } = require('node:child_process');
const { npmSource, preparedPath, readNpmExtension, pack, validatePackageType } = require('@texpro/extension-sdk/package-tools');
const { build } = require('./build.cjs');

// On Windows run the package manager's JavaScript entry, never an interpolated cmd shell.
function managerCommand(pm, { platform = process.platform, env = process.env, exists = fs.existsSync } = {}) {
  if (platform !== 'win32') return { file: pm, args: [] };
  const entries = pm === 'npm' ? ['node_modules/npm/bin/npm-cli.js'] : ['node_modules/yarn/bin/yarn.js', 'node_modules/corepack/dist/yarn.js'];
  const candidates = (env.PATH || '').split(path.delimiter).flatMap(dir => entries.map(entry => path.join(dir, entry)));
  if (env.npm_execpath && new RegExp(pm === 'npm' ? 'npm-cli\\.js$' : 'yarn(?:-[^/\\\\]+)?\\.(?:c?js)$', 'i').test(env.npm_execpath)) candidates.unshift(env.npm_execpath);
  const entry = candidates.find(exists);
  if (!entry) throw new Error('Cannot locate the ' + pm + ' JavaScript entry. Run this command through ' + pm + ' run, or install ' + pm + ' on PATH.');
  return { file: process.execPath, args: [entry] };
}
function prepareTarget(directory, name) {
  const root = fs.realpathSync(directory), pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  if (!pkg.texpro?.environment || !['npm', 'yarn'].includes(pkg.texpro.environment.packageManager) || !Object.hasOwn(pkg.dependencies || {}, name) || require('./registry.cjs').parseSpec(name).name !== name) throw new Error('Choose a direct dependency in a dedicated extension environment');
  const value = npmSource(path.join(root, 'node_modules', name));
  if (value.metadata.name !== name || value.mode !== 'build') throw new Error('This dependency does not require a source build');
  return { ...value, packageManager: pkg.texpro.environment.packageManager };
}
async function prepareInstalled(directory, name, { trusted = false, trustedInstallScripts = false, run = execFileSync, compile = build } = {}) {
  if (!trusted) throw new Error('Building npm source requires explicit trust (--trust-build). Compilers and project configuration have your user permissions and may download dependencies.');
  const target = prepareTarget(directory, name);
  const previous = preparedPath(target), cacheDirectory = path.dirname(previous);
  if (fs.existsSync(cacheDirectory) && (fs.lstatSync(cacheDirectory).isSymbolicLink() || !fs.statSync(cacheDirectory).isDirectory())) throw new Error('Prepared output must use a regular directory');
  if (fs.existsSync(previous)) {
    if (fs.lstatSync(previous).isSymbolicLink() || !fs.statSync(previous).isFile()) throw new Error('Prepared artifact must be a regular file');
    fs.rmSync(previous); // A failed explicit rebuild must not leave the old output eligible for sync.
  }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-source-build-'));
  try {
    for (const [name, bytes] of target.files) {
      const file = path.join(work, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes, { flag: 'wx' });
    }
    // Published devDependencies are not installed for a consumer. Resolve them only here.
    const pkg = { ...target.metadata, private: true };
    delete pkg.scripts; delete pkg.workspaces; delete pkg.packageManager; delete pkg.dependenciesMeta;
    fs.writeFileSync(path.join(work, 'package.json'), JSON.stringify(pkg, null, 2));
    const command = managerCommand(target.packageManager), invoke = args => run(command.file, [...command.args, ...args], { cwd: work, env: { ...process.env, NODE_ENV: 'development', npm_config_ignore_scripts: String(!trustedInstallScripts), YARN_ENABLE_SCRIPTS: String(trustedInstallScripts) }, stdio: 'inherit', timeout: 240000 });
    if (target.packageManager === 'npm') invoke(['install', trustedInstallScripts ? '--ignore-scripts=false' : '--ignore-scripts', '--include=dev', '--no-audit', '--no-fund']);
    else {
      fs.writeFileSync(path.join(work, '.yarnrc.yml'), 'nodeLinker: node-modules\nenableScripts: ' + trustedInstallScripts + '\n');
      const version = run(command.file, [...command.args, '--version'], { cwd: work, encoding: 'utf8', timeout: 15000 }).trim();
      invoke(version.startsWith('1.') ? ['install', ...(!trustedInstallScripts ? ['--ignore-scripts'] : []), '--non-interactive', '--production=false'] : ['install', ...(!trustedInstallScripts ? ['--mode=skip-build'] : [])]);
    }
    const result = await compile(work);
    const { readPackage } = require('@texpro/extension-sdk/package-tools'), info = readPackage(result.output);
    const current = prepareTarget(directory, name);
    if (current.sourceDigest !== target.sourceDigest) throw new Error('Installed source changed during build; prepare again');
    if (info.manifest.id !== target.manifest.id || info.manifest.version !== target.manifest.version) throw new Error('Build changed extension identity');
    const file = preparedPath(target), cache = path.dirname(file);
    validatePackageType(info.manifest, file, info.files);
    if (fs.existsSync(cache) && (fs.lstatSync(cache).isSymbolicLink() || !fs.statSync(cache).isDirectory())) throw new Error('Prepared output must use a regular directory');
    fs.mkdirSync(cache, { recursive: true });
    // Never reuse an existing preparation silently, or leave a partial archive after failure.
    const temporary = path.join(cache, path.basename(work) + '.tmp');
    try { fs.writeFileSync(temporary, pack(info.files), { flag: 'wx' }); fs.renameSync(temporary, file); }
    finally { fs.rmSync(temporary, { force: true }); }
    return readNpmExtension(target.root);
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}
module.exports = { prepareTarget, prepareInstalled, managerCommand };
