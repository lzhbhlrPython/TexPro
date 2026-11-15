'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawn } = require('node:child_process');
const readline = require('node:readline');

test('real MCP context query shares static project semantics and remains read-only and disk-only', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-context-mcp-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const main = '\\documentclass{article}\n\\input{style}\n\\begin{document}\nBody.\\end{document}';
  fs.writeFileSync(path.join(root, 'main.tex'), main);
  fs.writeFileSync(path.join(root, 'style.tex'), '\\newcommand{\\unit}[1]{\\mathrm{#1}}');
  const child = spawn(process.execPath, [process.env.TEXPRO_MCP_SERVER || path.join(__dirname, '../mcp/server.mjs'), '--project', root], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stderr.resume(); t.after(() => child.kill());
  const pending = new Map(); let sequence = 0;
  const lines = readline.createInterface({ input: child.stdout }); t.after(() => lines.close());
  const protocolErrors = [];
  lines.on('line', line => {
    try { const message = JSON.parse(line); pending.get(message.id)?.(message); }
    catch { protocolErrors.push(line); }
  });
  const request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(Error('MCP context timeout')); }, 15000);
    pending.set(id, message => { clearTimeout(timer); pending.delete(id); message.error ? reject(Error(message.error.message)) : resolve(message.result); });
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  const call = (name, args = {}) => request('tools/call', { name, arguments: args });
  const parse = result => JSON.parse(result.content[0].text);
  await request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'writing-test', version: '1' } });
  const tools = (await request('tools/list')).tools;
  assert.equal(tools.find(tool => tool.name === 'texpro_writing_context').annotations.readOnlyHint, true);
  for (const name of ['texpro_read_file', 'texpro_write_file', 'texpro_synctex_forward', 'texpro_synctex_inverse', 'texpro_render_tikz']) assert.ok(tools.find(tool => tool.name === name));
  let context = parse(await call('texpro_writing_context'));
  assert.equal(context.source, 'disk'); assert.equal(context.rootFile, path.join(root, 'main.tex'));
  assert.deepEqual(context.dependencies, ['main.tex', 'style.tex']); assert.equal(context.incomplete, false);
  assert.equal(context.mathMacros['\\unit'], '\\mathrm{#1}');
  fs.writeFileSync(path.join(root, 'style.tex'), '\\newcommand{\\unit}[1]{\\mathbf{#1}}');
  context = parse(await call('texpro_writing_context')); assert.equal(context.mathMacros['\\unit'], '\\mathbf{#1}');
  fs.unlinkSync(path.join(root, 'style.tex'));
  assert.equal(parse(await call('texpro_writing_context')).incomplete, true);
  fs.writeFileSync(path.join(root, 'second.tex'), main);
  assert.equal((await call('texpro_writing_context')).isError, true, 'ambiguous root is not silently substituted');
  assert.equal(fs.readFileSync(path.join(root, 'main.tex'), 'utf8'), main);
  assert.equal(fs.existsSync(path.join(root, '.texpro')), false); assert.deepEqual(protocolErrors, []);
  child.stdin.end();
});
