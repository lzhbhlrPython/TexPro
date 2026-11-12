'use strict';
// Real compiler matrix. No skips: install prerequisites and supply --tools <npm-prefix>.
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { languages, styles, readPackage } = require('../packages/extension-sdk/package-tools.cjs');
const { ExtensionManager } = require('../electron/services/extensions/manager.cjs');
const { scaffold } = require('../packages/qwertysay/lib/scaffold.cjs');
const args = process.argv.slice(2), index = args.indexOf('--tools');
if (index < 0 || !args[index + 1]) throw new Error('Supply --tools <npm-prefix> with the documented compiler devDependencies installed. Native tools must be on PATH.');
const tools = path.resolve(args[index + 1]); args.splice(index, 2);
const cases = [...Object.keys(languages).map(language => ({ name: 'plugin-' + language, language, type: 'plugin', suffix: 'tpp' })), ...Object.keys(styles).map(style => ({ name: 'theme-' + style, style, type: 'theme', suffix: 'tpt' }))];
if (args.some(name => !cases.some(item => item.name === name))) throw new Error('Unknown matrix case');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-authoring-matrix-'));
const cli = path.join(__dirname, '../packages/qwertysay/bin/qwertysay.cjs');
function run(file, params, cwd) {
  const result = spawnSync(file, params, { cwd, env: { ...process.env, PATH: path.join(tools, 'node_modules/.bin') + path.delimiter + process.env.PATH }, encoding: 'utf8', timeout: 300000 });
  if (result.status !== 0) throw new Error((result.error?.message || '') + '\n' + result.stdout + '\n' + result.stderr);
  return result.stdout;
}
(async () => {
  let failed = 0;
  try {
    for (const item of cases.filter(item => !args.length || args.includes(item.name))) {
      const directory = path.join(root, item.name), output = path.join(root, item.name + '.' + item.suffix);
      let manager;
      try {
        scaffold(directory, { id: 'matrix.' + item.name.replaceAll('-', ''), ...item });
        const modules = path.join(directory, 'node_modules'); fs.mkdirSync(modules);
        const sdk = path.join(modules, '@texpro/extension-sdk'); fs.mkdirSync(sdk, { recursive: true });
        for (const name of ['index.cjs', 'index.d.ts', 'package-tools.cjs', 'package-tools.d.ts', 'package.json', 'LICENSE', 'lib']) fs.cpSync(path.join(__dirname, '../packages/extension-sdk', name), path.join(sdk, name), { recursive: true });
        for (const name of fs.readdirSync(path.join(tools, 'node_modules'))) {
          if (name === '@gardenialiu') continue;
          fs.symlinkSync(path.join(tools, 'node_modules', name), path.join(modules, name), process.platform === 'win32' ? 'junction' : 'dir');
        }
        if (item.language === 'go') run('go', ['mod', 'tidy'], directory);
        run(process.execPath, [cli, 'build', directory], root);
        run(process.execPath, [cli, 'check', directory], root);
        run(process.execPath, [cli, 'pack', directory, output], root);
        const packaged = readPackage(output);
        assert.equal(packaged.files.has('package.json'), false);
        assert.equal([...packaged.files.keys()].some(name => name.startsWith('src/')), false);
        if (item.type === 'plugin') {
          assert.match(packaged.files.get('THIRD_PARTY_NOTICES.md').toString(), /MIT/);
          manager = new ExtensionManager(path.join(root, 'installed-' + item.name));
          await manager.install(output, manager.inspect(output).digest);
          assert.equal(manager.list()[0].enabled, false);
          await manager.enable(packaged.manifest.id, true, true);
          const result = await manager.invoke(packaged.manifest.id, 'uppercase', { language: 'en', source: '前😀hello后', selection: { from: 3, to: 8 } }, {});
          assert.deepEqual(result.edits, [{ from: 3, to: 8, insert: 'HELLO' }]);
          await manager.enable(packaged.manifest.id, false);
          await assert.rejects(manager.invoke(packaged.manifest.id, 'uppercase', { language: 'en', source: '', selection: { from: 0, to: 0 } }, {}));
        } else assert.equal([...packaged.files.keys()].some(name => /\.(?:[cm]?js|html?)$/i.test(name)), false);
        console.log('PASS real compiler, archive and ' + (item.type === 'plugin' ? 'host invocation: ' : 'static theme validation: ') + item.name);
      } catch (error) { failed++; console.error('FAIL ' + item.name + '\n' + error.stack); }
      finally { manager?.stop(); }
    }
    if (failed) throw new Error(failed + ' authoring matrix cases failed; none skipped. Temporary sources: ' + root);
  } finally {
    if (failed) console.error('Retained diagnostic fixture: ' + root);
    else fs.rmSync(root, { recursive: true, force: true });
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
