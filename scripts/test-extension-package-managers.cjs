'use strict';
// Actual distribution and package-manager integration, deliberately separate from offline unit tests.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { ExtensionManager } = require('../electron/services/extensions/manager.cjs');
const { syncReview } = require('../electron/services/extensions/environment.cjs');
const [sdkSpec, cliSpec, chineseSpec] = process.argv.slice(2).map(value => value.startsWith('@') ? value : path.resolve(value));
if (!sdkSpec || !cliSpec || !chineseSpec || !process.env.npm_execpath) throw new Error('Run with npm and SDK, qwertysay and Chinese distribution tarballs/specs');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-real-package-managers-'));
const env = { ...process.env, NODE_PATH: '', YARN_ENABLE_SCRIPTS: 'false', YARN_CACHE_FOLDER: path.join(root, 'yarn-cache') };
function npm(args, cwd) { return execFileSync(process.execPath, [process.env.npm_execpath, ...args], { cwd, env, encoding: 'utf8', timeout: 180000 }); }
function yarn(args, cwd) { return execFileSync('yarn', args, { cwd, env, encoding: 'utf8', timeout: 180000 }); }
function save(file, value) { fs.writeFileSync(file, JSON.stringify(value, null, 2)); }
function dependencyValue(spec, name) { return spec.startsWith(name + '@') ? spec.slice(name.length + 1) : spec; }
(async () => {
  try {
    const tools = path.join(root, 'independent tools'); fs.mkdirSync(tools); save(path.join(tools, 'package.json'), { private: true });
    npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', sdkSpec, cliSpec], tools);
    const cliRoot = path.join(tools, 'node_modules/@texpro/qwertysay'), cli = path.join(cliRoot, 'bin/qwertysay.cjs');
    const { environmentInit, writeEnvironmentPlan } = require(path.join(cliRoot, 'lib/environment.cjs'));
    const { pack } = require(path.join(tools, 'node_modules/@texpro/extension-sdk/package-tools.cjs'));
    const artifact = path.join(root, 'accent.tpt');
    fs.writeFileSync(artifact, pack(new Map([
      ['texpro.extension.json', JSON.stringify({ id: 'test.package-manager-theme', name: 'Accent', version: '1.0.0', apiVersion: 1, author: 'Integration test', license: 'MIT', capabilities: [], contributes: { themes: [{ id: 'accent', title: 'Accent', base: 'paper', tokens: { accent: '#123456' } }] } })],
      ['LICENSE', 'MIT'],
    ])));
    const wrapper = path.join(root, 'theme wrapper');
    execFileSync(process.execPath, [cli, 'npm-package', artifact, wrapper, '@texpro-test/theme'], { env, encoding: 'utf8' });
    const wrapperFile = path.join(wrapper, 'package.json'), wrapperPackage = JSON.parse(fs.readFileSync(wrapperFile));
    wrapperPackage.scripts = { postinstall: 'node -e "require(\'fs\').writeFileSync(\'should-not-execute\',\'bad\')"' }; save(wrapperFile, wrapperPackage);
    const themeTarball = path.join(root, JSON.parse(npm(['pack', '--json'], wrapper))[0].filename);
    fs.renameSync(path.join(wrapper, path.basename(themeTarball)), themeTarball);
    const source = path.join(root, 'source plugin'); fs.mkdirSync(source);
    save(path.join(source, 'package.json'), { name: '@texpro-test/source', version: '1.0.0', texpro: { source: '.' }, files: ['texpro.extension.json', 'LICENSE'], scripts: { postinstall: 'node -e "require(\'fs\').writeFileSync(\'should-not-execute\',\'bad\')"' } });
    save(path.join(source, 'texpro.extension.json'), { id: 'test.npm-source', name: 'Source', version: '1.0.0', apiVersion: 1, author: 'Test', license: 'MIT', capabilities: [], contributes: { snippets: [{ label: 'source', template: 'source' }] } }); fs.writeFileSync(path.join(source, 'LICENSE'), 'MIT');
    const sourceTarball = path.join(source, JSON.parse(npm(['pack', '--json', '--ignore-scripts'], source))[0].filename);
    const installer = path.join(root, 'compiler installer'); fs.mkdirSync(installer);
    const marker = path.join(root, 'explicit-installer-ran');
    fs.writeFileSync(path.join(installer, 'install.cjs'), `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'explicitly trusted');`);
    save(path.join(installer, 'package.json'), { name: 'test-compiler-installer', version: '1.0.0', scripts: { postinstall: 'node install.cjs' } });
    const installerTarball = path.join(installer, JSON.parse(npm(['pack', '--json', '--ignore-scripts'], installer))[0].filename);
    const compiled = path.join(root, 'compiled theme'); require(path.join(cliRoot, 'lib/scaffold.cjs')).scaffold(compiled, { id: 'test.compiled-theme', author: 'Test', type: 'theme', style: 'css' });
    const compiledFile = path.join(compiled, 'package.json'), compiledPkg = JSON.parse(fs.readFileSync(compiledFile)); compiledPkg.devDependencies = { 'test-compiler-installer': 'file:' + installerTarball }; save(compiledFile, compiledPkg);
    const compiledTarball = path.join(compiled, JSON.parse(npm(['pack', '--json', '--ignore-scripts'], compiled))[0].filename);
    const { prepareInstalled } = require(path.join(cliRoot, 'lib/prepare.cjs'));
    for (const pm of ['npm', 'yarn']) {
      const directory = path.join(root, pm + ' environment with spaces'); environmentInit(directory, pm);
      const file = path.join(directory, 'package.json'), pkg = JSON.parse(fs.readFileSync(file));
      pkg.devDependencies = { '@texpro/extension-sdk': dependencyValue(sdkSpec, '@texpro/extension-sdk'), '@texpro/qwertysay': dependencyValue(cliSpec, '@texpro/qwertysay') };
      if (pm === 'yarn') pkg.resolutions = { '@texpro/extension-sdk': dependencyValue(sdkSpec, '@texpro/extension-sdk') };
      save(file, pkg);
      if (pm === 'npm') {
        npm(['install', '--ignore-scripts', '--no-audit', '--no-fund'], directory);
        npm(['install', '--ignore-scripts', '--no-audit', '--no-fund', chineseSpec, themeTarball, sourceTarball, compiledTarball], directory);
      } else {
        yarn(['install', '--ignore-scripts', '--non-interactive', '--registry', 'https://registry.npmjs.org'], directory);
        yarn(['add', '--ignore-scripts', '--non-interactive', '--registry', 'https://registry.npmjs.org', chineseSpec, themeTarball, sourceTarball, compiledTarball], directory);
      }
      assert.equal(fs.existsSync(path.join(directory, 'node_modules/@texpro-test/theme/should-not-execute')), false);
      assert.equal(fs.existsSync(path.join(directory, 'node_modules/@texpro-test/source/should-not-execute')), false);
      assert.throws(() => writeEnvironmentPlan(directory), /explicit trusted build/);
      await assert.rejects(prepareInstalled(directory, compiledPkg.name), /explicit trust/);
      await prepareInstalled(directory, compiledPkg.name, { trusted: true });
      assert.equal(fs.existsSync(marker), false, 'Build trust must not grant installer-script trust');
      await prepareInstalled(directory, compiledPkg.name, { trusted: true, trustedInstallScripts: true });
      assert.equal(fs.readFileSync(marker, 'utf8'), 'explicitly trusted'); fs.rmSync(marker);
      const manager = new ExtensionManager(path.join(root, pm + ' host'));
      try {
        const changes = syncReview(manager, writeEnvironmentPlan(directory)).changes;
        assert.equal(changes.length, 4);
        for (const change of changes) await manager.install(change.source, change.digest, change.origin);
        assert.equal(manager.list().every(item => !item.enabled), true);
        assert.equal(manager.list().some(item => item.locales?.length), false, 'Disabled language packs must not activate');
        const data = path.join(manager.directory, 'data/test.package-manager-theme.json'); fs.mkdirSync(path.dirname(data), { recursive: true }); fs.writeFileSync(data, 'keep');
        const names = ['@texpro/extension-translate-zh-cn', '@texpro-test/theme', '@texpro-test/source', compiledPkg.name];
        if (pm === 'npm') npm(['uninstall', '--ignore-scripts', '--no-audit', '--no-fund', ...names], directory);
        else yarn(['remove', '--ignore-scripts', '--non-interactive', ...names], directory);
        const removals = syncReview(manager, writeEnvironmentPlan(directory)).changes;
        assert.equal(removals.length, 4); assert.equal(removals.every(change => change.kind === 'remove' && change.digest), true);
        for (const change of removals) await manager.remove(change.id);
        assert.deepEqual(manager.list(), []); assert.equal(fs.readFileSync(data, 'utf8'), 'keep');
        console.log(`PASS actual ${pm}: actual npm source tarballs, explicit compiler preparation, compatible archives, disabled scripts, reviewed snapshots, uninstall sync and retained data`);
      } finally { await manager.stop(); }
    }
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
