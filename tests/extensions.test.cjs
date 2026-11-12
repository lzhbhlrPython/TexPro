const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pack, unpack } = require('../electron/services/extensions/archive.cjs');
const { validateManifest, validateTheme } = require('../electron/services/extensions/schema.cjs');
const { ExtensionManager } = require('../electron/services/extensions/manager.cjs');
const manifest = (extra = {}) => ({ id: 'test.extension', name: { en: 'Test', zh: '测试' }, version: '1.0.0', author: 'Test', license: 'MIT', apiVersion: 1, capabilities: [], contributes: {}, ...extra });
function fixture(t, m, code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-extension-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source'); fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'texpro.extension.json'), JSON.stringify(m)); fs.writeFileSync(path.join(source, 'LICENSE'), 'MIT test fixture');
  if (code) fs.writeFileSync(path.join(source, 'index.cjs'), code);
  const manager = new ExtensionManager(path.join(dir, 'installed')); t.after(() => manager.stop());
  return { dir, source, manager };
}
const context = { source: 'Hello', selection: { from: 0, to: 5 }, language: 'en' };
test('extension manifest rejects incompatible APIs, undeclared capabilities, scripts and CSS injection', () => {
  assert.equal(validateManifest(manifest()).apiVersion, 1);
  for (const change of [{ apiVersion: 2 }, { id: '../escape' }, { capabilities: ['shell'] }, { scripts: { install: 'bad' } }]) assert.throws(() => validateManifest(manifest(change)));
  assert.throws(() => validateTheme({ id: 'test', title: 'Test', base: 'paper', tokens: { paper: 'url(https://example.com)' } }));
  assert.throws(() => validateTheme({ id: 'test', title: 'Test', base: 'paper', tokens: { arbitrary: '#ffffff' } }));
});
test('portable ZIP packages round trip Unicode and reject corruption, traversal and duplicates', () => {
  const files = new Map([['texpro.extension.json', Buffer.from('{}')], ['资源.txt', Buffer.from('中文')]]);
  const zip = pack(files); assert.equal(unpack(zip).get('资源.txt').toString(), '中文');
  const bad = Buffer.from(zip); bad[55] ^= 1; assert.throws(() => unpack(bad));
  assert.throws(() => pack(new Map([['../outside', 'no']])));
  assert.throws(() => pack(new Map([['One', 'a'], ['one', 'b']])));
});
test('local install verifies inspected bytes and does not auto-enable code or run installation scripts', async t => {
  const { source, manager } = fixture(t, manifest()); const preview = manager.inspect(source);
  fs.writeFileSync(path.join(source, 'extra.txt'), 'changed');
  await assert.rejects(manager.install(source, preview.digest), /changed/);
  const { readPackage, directoryFiles } = require('../electron/services/extensions/packages.cjs');
  const bytes = pack(directoryFiles(source)), archive = path.join(path.dirname(source), 'shared.tpp'); fs.writeFileSync(archive,bytes);
  assert.equal(readPackage(archive).manifest.id, 'test.extension');
  for (const suffix of ['tpt','zip']) { const bad = archive+'.'+suffix; fs.writeFileSync(bad,bytes); assert.throws(()=>readPackage(bad)); }
  await manager.install(archive, manager.inspect(archive).digest); assert.equal(manager.list()[0].enabled, false);
  await manager.enable('test.extension', true); assert.equal(manager.list()[0].enabled, true);
  fs.symlinkSync(path.join(source, 'LICENSE'), path.join(source, 'escape'));
  assert.throws(() => manager.inspect(source), /symbolic/);
});
test('trusted code lifecycle, storage and capability checks survive disable, update and rollback', async t => {
  const m = manifest({ entry: 'index.cjs', capabilities: ['storage'], contributes: { actions: [{ id: 'hello', title: 'Hello', kind: 'command' }] } });
  const { manager, source } = fixture(t, m, `exports.activate = ctx => { ctx.handle('hello', async c => { const n = (await c.services.call('storage.get', { key:'count' })) || 0; await c.services.call('storage.set', { key:'count', value:n+1 }); return { message: String(n+1), content:c.source }; }); };`);
  await manager.install(source, manager.inspect(source).digest);
  await assert.rejects(manager.enable(m.id, true), /explicit trust/);
  await manager.enable(m.id, true, true);
  assert.deepEqual(await manager.invoke(m.id, 'hello', context, {}), { message: '1', content: '' });
  await manager.enable(m.id, false); await assert.rejects(manager.invoke(m.id, 'hello', context, {}), /unavailable/);
  await manager.enable(m.id, true, true); assert.equal((await manager.invoke(m.id, 'hello', context, {})).message, '2');
  fs.writeFileSync(path.join(source, 'texpro.extension.json'), JSON.stringify({ ...m, version: '1.1.0' }));
  await manager.reload(m.id); assert.equal(manager.list()[0].enabled, false); assert.equal(manager.list()[0].manifest.version, '1.1.0');
  await manager.rollback(m.id); assert.equal(manager.list()[0].manifest.version, '1.0.0'); assert.equal(manager.list()[0].enabled, false);
  await manager.remove(m.id); assert.equal(manager.list().length, 0);
});
test('plugin crash rejects outstanding work, cannot edit without capability, and remains recoverable', async t => {
  const m = manifest({ entry: 'index.cjs', contributes: { actions: [{ id: 'edit', title: 'Edit', kind: 'transform' }, { id: 'crash', title: 'Crash', kind: 'command' }] } });
  const { manager, source } = fixture(t, m, `exports.activate = ctx => { ctx.handle('edit', () => ({ edits: [{ from:0,to:0,insert:'bad' }] })); ctx.handle('crash', () => process.exit(7)); };`);
  await manager.install(source, manager.inspect(source).digest); await manager.enable(m.id, true, true);
  await assert.rejects(manager.invoke(m.id, 'edit', context, {}), /document.write/);
  await assert.rejects(manager.invoke(m.id, 'crash', context, {}), /exited/);
  assert.equal(manager.list()[0].enabled, false); assert.match(manager.list()[0].error, /exited/);
  await manager.enable(m.id, true, true); assert.equal(manager.list()[0].enabled, true);
});

test('theme styles allow scoped layout, fonts and local assets but reject remote loads and expansion bombs', () => {
  const { compileTheme } = require('../electron/services/extensions/theme.cjs');
  const theme = { id:'local', title:'Local', base:'paper', tokens:{'font-editor':'Charter, serif','editor-width':'900px'}, stylesheet:'theme.css' };
  const m = manifest(); delete m.entry; m.contributes.actions=[]; m.capabilities=['theme.styles']; m.contributes.themes=[theme];
  assert.equal(validateManifest(m).contributes.themes[0].tokens['editor-width'], '900px');
  assert.throws(() => validateManifest({...m, capabilities:[]}), /theme.styles/);
  const files = new Map([['theme.css', Buffer.from('@font-face { font-family: Sample; src: url("assets/font.woff2"); } .toolbar { padding: 20px; background: url("assets/dot.png"); } @media (max-width: 700px) { :scope { --radius: 0px; } }')], ['assets/dot.png',Buffer.from('image')], ['assets/font.woff2',Buffer.from('font')]]);
  const { validatePackageType } = require('../electron/services/extensions/packages.cjs');
  validatePackageType(m, 'local.tpt', files);
  assert.throws(()=>validatePackageType({...m,entry:'index.cjs'},'local.tpt',files),/only themes/);
  const css = compileTheme(theme, files);
  assert.match(css, /@scope \(\[data-extension-theme\]\)/); assert.match(css, /data:image\/png;base64/); assert.match(css, /data:font\/woff2;base64/);
  // CSS annotations must never trigger filesystem reads outside the package.
  const readFile = fs.readFileSync; let mapRead = false;
  fs.readFileSync = function(file, ...args) { if (String(file).endsWith('external-secret.map')) { mapRead = true; throw new Error('Forbidden source-map read'); } return readFile.call(this, file, ...args); };
  try {
    files.set('theme.css', Buffer.from('.x{color:red} /*# sourceMappingURL=/tmp/external-secret.map */'));
    assert.doesNotMatch(compileTheme(theme, files), /sourceMappingURL/); assert.equal(mapRead, false);
  } finally { fs.readFileSync = readFile; }
  for (const source of ['@import "https://evil.test";', '.x{background:url(https://evil.test)}', '.x{background:image-set("https://evil.test" 1x)}', '.x{background:url(../outside.png)}', '.x{background:u\\72l(https://evil.test)}', '.x{background:url(data:image/png;base64,YQ==)}', '.x{background:url(assets/missing.png)}', '@namespace x url(https://evil.test);']) {
    files.set('theme.css',Buffer.from(source)); assert.throws(() => compileTheme(theme, files), undefined, source);
  }
  files.set('assets/dot.png',Buffer.alloc(900000)); files.set('theme.css', Buffer.from('.a{background:url(assets/dot.png)} .b{background:url(assets/dot.png)}')); assert.throws(() => compileTheme(theme,files), /2 MiB/);
});

test('safe mode disables persisted code and CSS without executing them, and reset survives restart', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'texpro-safe-')); t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  const source = path.join(root,'source'); fs.mkdirSync(source);
  const m=manifest({entry:"index.cjs", capabilities:["theme.styles"], contributes:{actions:[{id:"hello",kind:"command",title:"Hello"}],themes:[{id:"safe",title:"Safe",base:"paper",tokens:{},stylesheet:"theme.css"}]}});
  fs.writeFileSync(path.join(source,'texpro.extension.json'),JSON.stringify(m)); fs.writeFileSync(path.join(source,'LICENSE'),'MIT');
  fs.writeFileSync(path.join(source,'theme.css'), '.toolbar{opacity:0.9}');
  fs.writeFileSync(path.join(source,'index.cjs'), 'exports.activate = ctx => { ctx.handle("hello", () => ({message:"ok"})); };');
  const directory=path.join(root,'installed'), first=new ExtensionManager(directory); t.after(()=>first.stop());
  await first.install(source, first.inspect(source).digest); await first.enable(m.id,true,true); assert.equal(first.workers.size,1); first.stop();
  fs.writeFileSync(path.join(first.folder(m.id),'index.cjs'), 'throw new Error("MUST NOT EXECUTE IN SAFE MODE")');
  const safe=new ExtensionManager(directory,{safeMode:true}); t.after(()=>safe.stop()); await safe.start();
  assert.equal(safe.list()[0].enabled,false); assert.equal(safe.errors.size,0); assert.equal(safe.workers.size,0);
  const next=new ExtensionManager(directory); t.after(()=>next.stop()); await next.start(); assert.equal(next.list()[0].enabled,false);
});

test('published writing-kit example exercises every declared provider through the real worker', async t => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'texpro-provider-')); t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const manager=new ExtensionManager(path.join(dir,'installed')); t.after(()=>manager.stop());
  const source=path.join(__dirname,'../examples/extensions/writing-kit'), preview=manager.inspect(source);
  await manager.install(source,preview.digest); await manager.enable(preview.manifest.id,true,true);
  const context={source:'中文 abc\n% TODO note',selection:{from:3,to:6},language:'zh'};
  const invoke=(id,input={})=>manager.invoke(preview.manifest.id,id,context,input);
  assert.equal((await invoke('uppercase')).edits[0].insert,'ABC');
  const checks=await invoke('check-notes'); assert.equal(checks.diagnostics[0].from,9); assert.match(checks.message,/修订/);
  assert.equal((await invoke('completions')).completions[0].label,'\\writingnote');
  assert.match((await invoke('explain',{position:9})).content,/写作工具包/);
  assert.equal((await invoke('source-preview')).content,'abc');
  assert.match((await invoke('plain-import',{text:'A & B'})).project.files[0].content,/A \\& B/);
  assert.equal((await invoke('source-export')).output.content,context.source);
  assert.match((await invoke('bib-entry',{key:'sample',title:'A & B'})).output.content,/@misc\{sample/);
  assert.match((await invoke('csv-points',{text:'1,2\n3,4'})).output.content,/\(1,2\) \(3,4\)/);
  await assert.rejects(invoke('csv-points',{text:'not,csv'}),/两列数字/);
  assert.equal(JSON.parse((await invoke('word-count')).content).characters,context.source.length);
  assert.equal((await invoke('request-build')).action,'compile');
});

test('project SDK reads saved text only and rejects realpath escape and expired project epochs', async t => {
  const m=manifest({entry:'index.cjs',capabilities:['project.read'],contributes:{actions:[{id:'read',kind:'command',title:'Read'}]}});
  const {dir,manager,source}=fixture(t,m,`exports.activate = ctx => ctx.handle('read', async (context,input) => { if(input.delay) await new Promise(r=>setTimeout(r,80)); return {content:await context.services.call('project.readFile',{path:input.path})}; });`);
  const root=path.join(dir,'project'); fs.mkdirSync(root); fs.writeFileSync(path.join(root,'main.tex'),'saved source'); fs.writeFileSync(path.join(dir,'outside.tex'),'outside');
  await manager.install(source,manager.inspect(source).digest); await manager.enable(m.id,true,true);
  const context={source:'unsaved source',selection:{from:0,to:0},project:{root}};
  assert.equal((await manager.invoke(m.id,'read',context,{path:'main.tex'})).content,'saved source');
  await assert.rejects(manager.invoke(m.id,'read',context,{path:'../outside.tex'}),/unavailable/);
  const pending=manager.invoke(m.id,'read',context,{path:'main.tex',delay:true}); manager.event('projectChanged',null);
  await assert.rejects(pending,/expired/);
});

test('minimal color-only .tpt needs only manifest and license, without stylesheet, code or compiler', async t => {
  const { readPackage, directoryFiles } = require('../electron/services/extensions/packages.cjs');
  const sample = path.join(__dirname, '../examples/extensions/accent-only');
  const m = JSON.parse(fs.readFileSync(path.join(sample, 'texpro.extension.json'), 'utf8'));
  const { dir, manager } = fixture(t, m);
  const archive = path.join(dir, 'accent.tpt'); fs.writeFileSync(archive, pack(directoryFiles(sample)));
  const packageData = readPackage(archive);
  assert.equal(packageData.files.size, 2);
  assert.equal(packageData.manifest.entry, undefined);
  assert.deepEqual(packageData.manifest.capabilities, []);
  await manager.install(archive, manager.inspect(archive).digest);
  assert.equal(manager.list()[0].enabled, false);
  await manager.enable(m.id, true);
  assert.equal(manager.list()[0].enabled, true);
  assert.deepEqual(manager.list()[0].manifest.contributes.themes[0].tokens, { accent: '#9c472b' });
  assert.deepEqual(manager.list()[0].themeStyles, { accent: '' });
  await manager.enable(m.id, false); assert.equal(manager.list()[0].enabled, false);
});
