'use strict';
// Run via npm run test:extensions:sdk:package -- /absolute/package.tgz (or a published npm spec).
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const spec = process.argv[2], scaffoldSpec = process.argv[3], npm = process.env.npm_execpath;
if (!spec || !scaffoldSpec || !npm) throw new Error('Run through npm with SDK and qwertysay tarball paths or explicit npm versions');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-sdk-distribution-'));
function run(args, cwd = root) { return execFileSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 120000, env: { ...process.env, NODE_PATH: '' } }); }
function install(args, cwd) { return run([npm, 'install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', path.join(root, 'cache'), ...args], cwd); }
try {
  fs.writeFileSync(path.join(root, 'package.json'), '{"private":true}');
  install([spec, ...(scaffoldSpec ? [scaffoldSpec] : []), 'typescript@5.9.3']);
  const sdk = path.join(root, 'node_modules/@gardenialiu/texpro-extension-sdk'), cli = path.join(root, 'node_modules/@gardenialiu/qwertysay/bin/qwertysay.cjs');
  assert.equal(fs.lstatSync(sdk).isSymbolicLink(), false, 'Must install actual distribution, not a source symlink');
  assert.equal(require(path.join(sdk, 'index.cjs')).API_VERSION, 1);
  const cliVersion = require(path.join(root, 'node_modules/@gardenialiu/qwertysay/package.json')).version;
  if (Number(cliVersion.split('.')[0]) > 0 || Number(cliVersion.split('.')[1]) >= 3) {
    const cliRoot = path.join(root, 'node_modules/@gardenialiu/qwertysay');
    run(['-e', `
      const assert = require('node:assert/strict'), fs = require('node:fs');
      const { planInteractive } = require(${JSON.stringify(path.join(cliRoot, 'lib/wizard.cjs'))});
      const { scaffoldTokenTheme } = require(${JSON.stringify(path.join(cliRoot, 'lib/scaffold.cjs'))});
      const { main } = require(${JSON.stringify(cli)});
      (async () => {
        const directory = ${JSON.stringify(path.join(root, 'guided theme'))};
        const answers = ['en', 'init', 'theme', directory, 'test.guided', 'Writer', 'tokens', 'paper', '#123456', 'yes'];
        const plan = await planInteractive({ ask: async () => { assert.ok(answers.length); return answers.shift(); }, write() {} });
        scaffoldTokenTheme(plan.directory, plan.options);
        assert.deepEqual(fs.readdirSync(directory).sort(), ['LICENSE', 'texpro.extension.json']);
        await main(['check', directory]);
        await main(['pack', directory, ${JSON.stringify(path.join(root, 'guided.tpt'))}]);
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `]);
  }
  for (const [type, language, suffix] of [['plugin', 'ts', 'tpp'], ['plugin', 'js', 'tpp'], ['theme', 'ts', 'tpt']]) {
    const directory = path.join(root, type + language), output = path.join(root, type + language + '.' + suffix);
    run([cli, 'init', directory, '--id', `test.${type}${language}`, '--author', 'Baolin Liu', '--type', type, '--language', language]);
    assert.equal(fs.existsSync(path.join(directory, 'node_modules')), false, 'CLI must not auto-install');
    if (require(path.join(root, 'node_modules/@gardenialiu/qwertysay/package.json')).version.startsWith('0.1.')) {
      if (type === 'plugin' && language === 'ts') run([path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(directory, 'tsconfig.json')]);
    } else run([cli, 'build', directory]);
    run([cli, 'check', directory]); run([cli, 'pack', directory, output]); run([cli, 'check', output]);
    assert.ok(fs.statSync(output).size > 100);
    assert.throws(() => run([cli, 'pack', directory, output]), 'Must not overwrite');
    if (type === 'plugin') assert.throws(() => run([cli, 'pack', directory, path.join(root, type + language + '.tpt')]), 'Must not disguise executable plugins as themes');
  }
  console.log('PASS independent npm distribution: actual install, public helper/types, TS/JS/theme scaffold, compile, validate, pack, archive check and rejection paths');
} finally { fs.rmSync(root, { recursive: true, force: true }); }
