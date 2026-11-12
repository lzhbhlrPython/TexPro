'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable, Writable } = require('node:stream');
const { spawnSync } = require('node:child_process');
const { planInteractive, createPrompter, WizardCancelled } = require('../lib/wizard.cjs');
const { scaffold, scaffoldTokenTheme } = require('../lib/scaffold.cjs');
const { main } = require('../bin/qwertysay.cjs');
const { readPackage } = require('@gardenialiu/texpro-extension-sdk/package-tools');
function fixture(t) { const root=fs.mkdtempSync(path.join(os.tmpdir(),'qwertysay-wizard-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root; }
async function plan(answers, command) { const output=[];let index=0;const result=await planInteractive({command,ask:async()=>{if(index>=answers.length)throw new WizardCancelled();return answers[index++];},write:value=>output.push(value)});return {result,output}; }
test('guided plugin creation offers every language and produces a real CoffeeScript scaffold',async t=>{
  const root=fixture(t),directory=path.join(root,'plugin with spaces');
  const {result,output}=await plan(['en','init','plugin',directory,'wizard.coffee','Writer','coffee','yes']);
  assert.ok(output.join('\n').includes('GopherJS'));assert.ok(output.join('\n').includes('Scala.js'));
  scaffold(result.directory,result.options);
  assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'qwertysay.build.json'))).language,'coffee');
  assert.equal(fs.existsSync(path.join(directory,'node_modules')),false);
});
test('guided accent-only theme needs exactly a manifest and license and packs through the actual CLI',async t=>{
  const root=fixture(t),directory=path.join(root,'theme'),file=path.join(root,'accent.tpt');
  const {result}=await plan(['zh','init','theme',directory,'wizard.accent','作者','tokens','night','#123456','y']);
  scaffoldTokenTheme(result.directory,result.options);
  assert.deepEqual(fs.readdirSync(directory).sort(),['LICENSE','texpro.extension.json']);
  assert.deepEqual(readPackage(directory).manifest.contributes.themes[0].tokens,{accent:'#123456'});
  await main(['pack',directory,file]);assert.equal(readPackage(file).manifest.entry,undefined);
  const {result:packPlan}=await plan(['en',directory,path.join(root,'new.tpt'),'yes'],'pack');
  await main(packPlan.args);assert.ok(fs.existsSync(path.join(root,'new.tpt')));
});
test('guided CSS theme builds and checks without automatic dependency installation',async t=>{
  const root=fixture(t),directory=path.join(root,'css');
  const {result}=await plan(['en','theme',directory,'wizard.css','Writer','css','y'],'init');
  scaffold(result.directory,result.options);
  assert.equal(fs.existsSync(path.join(directory,'dist/package')),false);
  const {result:buildPlan,output}=await plan(['en',directory,'yes'],'build');
  assert.ok(output.some(line=>line.includes('permissions')));await main(buildPlan.args);
  const {result:checkPlan}=await plan(['en',directory,'yes'],'check');await main(checkPlan.args);
});
test('cancel, EOF and noninteractive startup do not create files or hang',async t=>{
  const root=fixture(t),directory=path.join(root,'cancelled');
  const {result}=await plan(['en','init','plugin',directory,'wizard.cancel','Writer','ts','']);
  assert.equal(result,null);assert.equal(fs.existsSync(directory),false);
  await assert.rejects(plan(['en','init']),WizardCancelled);assert.deepEqual(fs.readdirSync(root),[]);
  const child=spawnSync(process.execPath,[path.join(__dirname,'../bin/qwertysay.cjs')],{encoding:'utf8',timeout:3000,input:''});
  assert.equal(child.status,1);assert.match(child.stderr,/terminal/);
});
test('guided validation retries invalid choices and never overwrites occupied directories',async t=>{
  const root=fixture(t),occupied=path.join(root,'occupied'),directory=path.join(root,'new');
  fs.mkdirSync(occupied);fs.writeFileSync(path.join(occupied,'keep'),'original');
  const {result}=await plan(['en','bad','init','theme',occupied,directory,'../bad','wizard.valid','Writer','tokens','paper','red','#abcdef','yes']);
  scaffoldTokenTheme(result.directory,result.options);
  assert.equal(fs.readFileSync(path.join(occupied,'keep'),'utf8'),'original');
  assert.equal(readPackage(directory).manifest.id,'wizard.valid');
});
test('line-based prompting retains queued lines and cancels cleanly at EOF',async()=>{
  const output=new Writable({write(chunk,encoding,done){done();}});
  const prompt=createPrompter(Readable.from(['first\nsecond\n']),output);
  try{assert.equal(await prompt.ask('One: '),'first');assert.equal(await prompt.ask('Two: '),'second');await assert.rejects(prompt.ask('Three: '),WizardCancelled);}finally{prompt.close();}
});
