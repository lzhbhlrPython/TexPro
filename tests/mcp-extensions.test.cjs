'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const readline = require('node:readline');
const { pack } = require('../packages/extension-sdk/package-tools.cjs');
test('real MCP stdio exposes read-only authoring and inspects packages without running entries or escaping project', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-mcp-extensions-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'main.tex'), '\\documentclass{article}\\begin{document}Test\\end{document}');
  const manifest = { id: 'test.inspect', name: 'Inspect', version: '1.0.0', apiVersion: 1, author: 'Test', license: 'MIT', entry: 'index.cjs', capabilities: [], contributes: {} };
  const sentinel = path.join(root, 'executed');
  const files = new Map([['texpro.extension.json', JSON.stringify(manifest)], ['LICENSE', 'MIT'], ['index.cjs', `require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'BAD');`]]);
  fs.writeFileSync(path.join(root, 'inspect.tpp'), pack(files));
  fs.writeFileSync(path.join(root, 'disguised.tpt'), pack(files));
  fs.symlinkSync(os.tmpdir(), path.join(root, 'outside'), process.platform === 'win32' ? 'junction' : 'dir');
  const child = spawn(process.execPath, [path.join(__dirname, '../mcp/server.mjs')], { stdio: ['pipe', 'pipe', 'pipe'] });
  t.after(() => child.kill()); child.stderr.resume();
  const pending = new Map(); let sequence = 0;
  const lines = readline.createInterface({ input: child.stdout }); t.after(() => lines.close());
  lines.on('line', line => { const message = JSON.parse(line); pending.get(message.id)?.(message); });
  function request(method, params = {}) {
    const id = ++sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('MCP timeout')), 15000);
      pending.set(id, message => { clearTimeout(timer); pending.delete(id); message.error ? reject(new Error(message.error.message)) : resolve(message.result); });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }
  const call = (name, args = {}) => request('tools/call', { name, arguments: args });
  const parse = result => JSON.parse(result.content[0].text);
  await request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  const tools = (await request('tools/list')).tools;
  for (const name of ['texpro_extension_capabilities', 'texpro_inspect_extension']) assert.equal(tools.find(tool => tool.name === name).annotations.readOnlyHint, true);
  const capabilities = parse(await call('texpro_extension_capabilities'));
  assert.equal(capabilities.languages.elm.source, '.elm'); assert.equal(capabilities.styles.tcss.name, 'Thematic CSS'); assert.equal(capabilities.mcp.invokesPlugins, false);
  assert.equal(capabilities.locales.code, false); assert.equal(capabilities.locales.preinstalled, '@texpro/extension-translate-zh-cn'); assert.equal(capabilities.distribution.reviewRequired, true);
  await call('texpro_open_project', { root });
  const language = { ...manifest, entry: undefined, contributes: { locales: [{ id: 'fr', title: 'Français', messages: 'fr.json' }] } };
  const languageFiles = new Map([['texpro.extension.json', JSON.stringify(language)], ['LICENSE', 'MIT'], ['fr.json', '{"Save":"Enregistrer"}']]);
  fs.writeFileSync(path.join(root, 'language.tpp'), pack(languageFiles));
  assert.equal(parse(await call('texpro_inspect_extension', { path: 'language.tpp' })).executable, false);
  languageFiles.set('fr.json', '{"Hello {name}":"Bonjour {wrong}"}'); fs.writeFileSync(path.join(root, 'bad-language.tpp'), pack(languageFiles));
  assert.equal((await call('texpro_inspect_extension', { path: 'bad-language.tpp' })).isError, true);
  const report = parse(await call('texpro_inspect_extension', { path: 'inspect.tpp' }));
  assert.equal(report.manifest.id, manifest.id); assert.equal(report.executable, true); assert.equal(report.fileCount, 3);
  assert.equal(fs.existsSync(sentinel), false);
  for (const name of ['disguised.tpt', '../outside.tpp', 'outside/no.tpp']) {
    const result = await call('texpro_inspect_extension', { path: name }); assert.equal(result.isError, true, name);
  }
  child.stdin.end();
});
test('MCP inspection core runs in external Node using only the copied unpacked dependency closure', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-mcp-external-core-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(path.join(__dirname, '../packages/extension-sdk/lib'), path.join(root, 'packages/extension-sdk/lib'), { recursive: true });
  for (const name of ['postcss', 'postcss-value-parser', 'nanoid', 'picocolors', 'source-map-js']) fs.cpSync(path.join(__dirname, '../node_modules', name), path.join(root, 'node_modules', name), { recursive: true });
  const source = path.join(root, 'theme'); fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'LICENSE'), 'MIT');
  fs.writeFileSync(path.join(source, 'texpro.extension.json'), JSON.stringify({ id: 'test.external', name: 'External', version: '1.0.0', apiVersion: 1, author: 'Test', license: 'MIT', capabilities: ['theme.styles'], contributes: { themes: [{ id: 'paper', title: 'Paper', base: 'paper', tokens: {}, stylesheet: 'theme.css' }] } }));
  fs.writeFileSync(path.join(source, 'theme.css'), '.toolbar { color: #123456; }');
  const result = execFileSync(process.execPath, ['-e', "console.log(JSON.stringify(require(process.argv[1]).inspectPackage(process.argv[2])))", path.join(root, 'packages/extension-sdk/lib/inspect.cjs'), source], { cwd: root, env: { ...process.env, NODE_PATH: '' }, encoding: 'utf8', timeout: 10000 });
  assert.equal(JSON.parse(result).kind, 'theme');
  fs.rmSync(path.join(root, 'node_modules/postcss-value-parser'), { recursive: true });
  assert.throws(() => execFileSync(process.execPath, ['-e', 'require(process.argv[1]).inspectPackage(process.argv[2])', path.join(root, 'packages/extension-sdk/lib/inspect.cjs'), source], { cwd: root, env: { ...process.env, NODE_PATH: '' }, stdio: 'pipe', timeout: 10000 }));
});
