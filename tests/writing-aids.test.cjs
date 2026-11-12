'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const core = import('../electron/services/writing-aids-core.mjs');
const service = require('../electron/services/writing-aids.cjs');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const article = body => '\\documentclass{article}\n\\begin{document}\n'+body+'\n\\end{document}\n';
const fixture = t => { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-aids-')); t.after(() => fs.rmSync(dir, {recursive:true,force:true})); return fs.realpathSync(dir); };
test('balanced placeholders and revision memos preserve UTF-16 locations and legacy notes', async () => {
  const {parseWritingAids, toggleMemoLine} = await core;
  const text = article('中文📝 \\texproplaceholder[data]{Measure \\textbf{nested} 50\\%}\n% MEMO: Recheck values\n% MEMO-DONE: Done\n% TODO: Legacy');
  const {placeholders:p,memos} = parseWritingAids(text,'chapter.tex');
  assert.equal(p.length,1); assert.equal(text.slice(p[0].from,p[0].to),p[0].source); assert.equal(p[0].line,3); assert.equal(p[0].kind,'data');
  assert.equal(memos.length,3); assert.equal(toggleMemoLine(memos[0].source,memos[0]),'% MEMO-DONE: Recheck values');
  assert.equal(toggleMemoLine(memos[1].source,memos[1]),'% MEMO: Done');
  assert.equal(toggleMemoLine(memos[0].source,{...memos[0],text:'changed'}),null);
});
test('examples, comments, definitions and math are excluded, including unfinished math', async () => {
  const c = await core, placeholder = c.placeholderSource('text','example');
  for(const wrapper of [x=>'% '+x,x=>'\\verb|'+x+'|',x=>'\\begin{verbatim}\n'+x+'\n\\end{verbatim}',x=>'\\newcommand{\\example}{'+x+'}',x=>'\\def\\example#1{'+x+'}',x=>'$'+x+'$',x=>'\\('+x+'\\)',x=>'\\begin{align}'+x+'\\end{align}']) assert.equal(c.parseWritingAids(article(wrapper(placeholder))).placeholders.length,0);
  for(const input of ['$x','$$x','\\(x','\\[x','\\begin{equation}x']) assert.equal(c.writingPositionAllowed(input,input.length),false,input);
  assert.equal(c.writingPositionAllowed('Plain prose',11),true);
  assert.equal(c.writingPositionAllowed(article('x'),2),false);
});
test('main support is idempotent and honors custom macro definitions and commented document examples', async () => {
  const c=await core, original='% \\begin{document}\n'+article('Text');
  const supported=c.ensurePlaceholderSupport(original); assert.equal(c.ensurePlaceholderSupport(supported),supported);
  assert.ok(supported.indexOf(c.placeholderPreamble)>supported.indexOf('\\documentclass'));
  const custom=article('x').replace('\\begin{document}', '\\def\\texproplaceholder#1{#1}\n\\begin{document}');
  assert.equal(c.ensurePlaceholderSupport(custom),custom);
  assert.equal(c.applyCtexTypography(c.applyCtexTypography(original)),c.applyCtexTypography(original));
  const chinese='\\documentclass[fontset=mac]{ctexart}\n\\begin{document}正文\\end{document}';
  assert.ok(c.applyCtexTypography(chinese).includes('fontset=mac')); assert.ok(!c.applyCtexTypography(chinese).includes('usepackage'));
});
test('closed-file edits install the macro in the actual main file and reject stale hashes and symlinks', async t => {
  const dir=fixture(t), main=path.join(dir,'main.tex'), child=path.join(dir,'chapter.tex');
  fs.writeFileSync(main,article('\\input{chapter}')); fs.writeFileSync(child,'Child prose.\n');
  let info=await service.listWritingAids(dir); const hashes=Object.fromEntries(info.files.map(i=>[i.file,i.hash]));
  await service.editWritingAid(dir,{file:child,action:'insert-placeholder',offset:6,kind:'data',text:'待核实 50%',expectedHash:hashes[child],expectedMainHash:hashes[main]});
  assert.ok(fs.readFileSync(main,'utf8').includes('providecommand{\\texproplaceholder}')); assert.ok(!fs.readFileSync(child,'utf8').includes('providecommand'));
  await assert.rejects(service.editWritingAid(dir,{file:child,action:'resolve-placeholder',offset:6,text:'42',expectedHash:hashes[child]}),/Source changed/);
  info=await service.listWritingAids(dir); const item=info.placeholders[0];
  await service.editWritingAid(dir,{file:child,action:'resolve-placeholder',offset:item.from,text:'42',expectedHash:hash(fs.readFileSync(child,'utf8'))});
  assert.equal((await service.listWritingAids(dir)).placeholders.length,0);
  await service.editWritingAid(dir,{file:child,action:'add-memo',line:1,text:'Continue here',expectedHash:hash(fs.readFileSync(child,'utf8'))});
  const memo=(await service.listWritingAids(dir)).memos[0];
  await service.editWritingAid(dir,{file:child,action:'complete-memo',line:memo.line,expectedHash:hash(fs.readFileSync(child,'utf8'))});
  assert.equal((await service.listWritingAids(dir)).memos[0].done,true);
  const outside=fixture(t); fs.writeFileSync(path.join(outside,'outside.tex'),'private'); fs.symlinkSync(path.join(outside,'outside.tex'),path.join(dir,'escape.tex'));
  await assert.rejects(service.editWritingAid(dir,{file:'escape.tex',action:'add-memo',line:1,text:'x',expectedHash:hash('private')}),/inside the project/);
});
test('draft placeholders compile with pdfLaTeX and Chinese typography compiles with XeLaTeX and LuaLaTeX', async t => {
  const c=await core, dir=fixture(t), texBin='/Library/TeX/texbin';
  const cache=path.join(dir,'cache'); fs.mkdirSync(cache); const env={...process.env,TEXMFVAR:cache,TEXMFCACHE:cache};
  for(const engine of ['pdflatex','xelatex','lualatex']) {
    const binary=fs.existsSync(path.join(texBin,engine))?path.join(texBin,engine):engine;
    const probe=spawnSync(binary,['--version'],{encoding:'utf8',timeout:5000});
    assert.equal(probe.status,0,engine+' is required for the complete baseline: '+(probe.error||probe.stderr));
    const chinese=engine!=='pdflatex';
    const source=(chinese?'\\documentclass[UTF8,fontset=fandol]{ctexart}\n'+c.ctexWritingSettings+'\n':'\\documentclass{article}\n')+c.placeholderPreamble+'\n\\begin{document}\n'+(chinese?'\\section{中文排版}正文与 English 123，标点。\n\n这是新的段落。\n':'Draft.\n')+c.placeholderSource('text','Text 50% & data')+'\n\n'+c.placeholderSource('figure','Figure later')+'\n\n'+c.placeholderSource('table','Table later')+'\n% MEMO: Must not enter PDF\n\\end{document}';
    fs.writeFileSync(path.join(dir,engine+'.tex'),source);
    // This isolated cache intentionally starts empty. Lua font database discovery can
    // take minutes on a cold machine; bound setup without skipping actual compilation.
    const result=spawnSync(binary,['-interaction=nonstopmode','-halt-on-error',engine+'.tex'],{cwd:dir,env,encoding:'utf8',timeout:engine==='lualatex'?180000:45000});
    assert.equal(result.status,0,engine+'\n'+(result.stdout||'').slice(-2500)+'\n'+result.error); assert.ok(fs.existsSync(path.join(dir,engine+'.pdf')));
  }
});
test('placeholder planner preserves the active child and maps main-file selection with one invertible edit group', async () => {
  const ts=require('typescript'), vm=require('node:vm'), {Text}=require('@codemirror/state');
  const filename=path.resolve(__dirname,'../src/lib/writingAids.ts');
  const texContext={exports:{},require};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/texDocument.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,texContext);
  const labelContext={exports:{},require:name=>name==='./texDocument'?texContext.exports:require(name)};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/labelRename.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,labelContext);
  const context={exports:{},require:name=>name==='./labelRename'?labelContext.exports:name.endsWith('.mjs')?require(path.resolve(path.dirname(filename),name)):require(name)};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
  for(const sameFile of [false,true]) {
    const main='/p/main.tex', file=sameFile?main:'/p/child.tex', sources={[main]:article('Prose here.'),...(!sameFile?{[file]:'Prose here.'}:{})};
    const at=sources[file].indexOf('here'), plan=context.exports.planPlaceholder(sources,main,file,{from:at,to:at+4},'data','50% sample');
    assert.equal(plan.after[file].slice(plan.from,plan.to),'50\\% sample');
    assert.ok(plan.after[main].includes('providecommand{\\texproplaceholder}'));
    for(const [target,change] of Object.entries(plan.changes)) {
      const before=Text.of(plan.before[target].split('\n')), after=Text.of(plan.after[target].split('\n'));
      assert.equal(change.invert(before).apply(after).toString(),plan.before[target]);
    }
  }
});
test('real MCP stdio exposes writing aids, protects edits and previews CTeX without saving', async t => {
  const dir=fixture(t), main=path.join(dir,'main.tex'); fs.writeFileSync(main,article('Draft sentence.'));
  const {spawn}=require('node:child_process'), readline=require('node:readline');
  const child=spawn(process.execPath,[path.resolve(__dirname,'../mcp/server.mjs'),'--project',dir],{stdio:['pipe','pipe','pipe']}); t.after(()=>child.kill()); child.stderr.resume();
  const lines=readline.createInterface({input:child.stdout}), pending=new Map(); t.after(()=>lines.close());
  lines.on('line',line=>{const msg=JSON.parse(line); pending.get(msg.id)?.(msg);}); let id=0;
  const request=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id, timer=setTimeout(()=>reject(new Error('MCP timeout: '+method)),5000);pending.set(requestId,msg=>{clearTimeout(timer);pending.delete(requestId);msg.error?reject(new Error(msg.error.message)):resolve(msg.result);});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id:requestId,method,params})+'\n');});
  const call=(name,args={})=>request('tools/call',{name,arguments:args}); const content=result=>JSON.parse(result.content[0].text);
  await request('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'writing-aids-test',version:'1'}});
  const listed=await request('tools/list'); for(const name of ['texpro_writing_aids','texpro_edit_writing_aid','texpro_ctex_typography']) assert.ok(listed.tools.some(tool=>tool.name===name));
  let info=content(await call('texpro_writing_aids')), expectedHash=info.files[0].hash;
  const inserted=await call('texpro_edit_writing_aid',{file:'main.tex',action:'insert-placeholder',offset:fs.readFileSync(main,'utf8').indexOf('Draft'),kind:'text',text:'Fill in',expectedHash,expectedMainHash:expectedHash}); assert.ok(!inserted.isError);
  const stale=await call('texpro_edit_writing_aid',{file:'main.tex',action:'resolve-placeholder',offset:0,text:'Wrong',expectedHash}); assert.equal(stale.isError,true);
  info=content(await call('texpro_writing_aids')); assert.equal(info.placeholders.length,1);
  const before=fs.readFileSync(main,'utf8'), preview=content(await call('texpro_ctex_typography')); assert.equal(preview.saved,false); assert.ok(preview.source.includes('Chinese typography begin')); assert.equal(fs.readFileSync(main,'utf8'),before);
  const tex=require('../electron/services/tex.cjs'); await assert.rejects(tex.createArxivPackage(dir),/Resolve 1 placeholder/);
});
