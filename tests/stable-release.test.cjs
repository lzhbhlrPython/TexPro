'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { nextVersion, stampVersion } = require('../scripts/release-version.cjs');
const { commitVersion, publish, releasePresentation } = require('../scripts/publish-stable.cjs');
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-stable-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const remote = path.join(root, 'origin.git'), work = path.join(root, 'work');
  git(root, 'init', '--bare', remote); fs.mkdirSync(work); git(work, 'init', '-b', 'main');
  git(work, 'config', 'user.name', 'Test'); git(work, 'config', 'user.email', 'test@example.invalid');
  fs.writeFileSync(path.join(work, 'package.json'), JSON.stringify({ version: '1.2.3', private: true }, null, 2) + '\n');
  fs.writeFileSync(path.join(work, 'package-lock.json'), JSON.stringify({ version: '1.2.3', packages: { '': { version: '1.2.3' }, 'packages/extension-sdk': { version: '0.2.0' } }, custom: 'keep' }, null, 2) + '\n');
  git(work, 'add', '.'); git(work, 'commit', '-m', 'source'); git(work, 'remote', 'add', 'origin', remote); git(work, 'push', 'origin', 'main');
  return { work, remote, sourceSha: git(work, 'rev-parse', 'HEAD') };
}
test('stable bumps reset lower segments and stamping preserves independent SDK versions', t => {
  assert.equal(nextVersion('1.2.3','major'),'2.0.0'); assert.equal(nextVersion('1.2.3','minor'),'1.3.0'); assert.equal(nextVersion('1.2.3','patch'),'1.2.4');
  assert.equal(nextVersion('1.2.3','initial'),'1.2.3');
  for (const args of [['1.2.3-beta','patch'], ['01.2.3','patch'], ['1.2.3','shell']]) assert.throws(() => nextVersion(...args));
  const { work } = fixture(t); stampVersion(work, '2.0.0');
  const lock = JSON.parse(fs.readFileSync(path.join(work,'package-lock.json')));
  assert.equal(lock.version,'2.0.0'); assert.equal(lock.packages[''].version,'2.0.0'); assert.equal(lock.packages['packages/extension-sdk'].version,'0.2.0'); assert.equal(lock.custom,'keep');
  fs.writeFileSync(path.join(work,'release-series.json'),JSON.stringify({'0.1':{codename:'Tajpilo'}}));
  fs.mkdirSync(path.join(work,'docs/releases'),{recursive:true});fs.writeFileSync(path.join(work,'docs/releases/v0.1.0.md'),'First release / 首次发布');
  assert.deepEqual(releasePresentation(work,'0.1.0'),{title:'v0.1.0 · Tajpilo',notes:['--notes-file',path.join('docs','releases','v0.1.0.md')]});
  assert.deepEqual(releasePresentation(work,'0.1.9'),{title:'v0.1.9 · Tajpilo',notes:['--generate-notes']});
  assert.equal(releasePresentation(work,'0.2.0').title,'v0.2.0');
  assert.throws(()=>releasePresentation(work,'../../escape'),/Invalid release version/);
});
test('initial stable release preserves the base version and retries its empty version commit safely', t => {
  const {work,remote,sourceSha}=fixture(t), identity={version:'1.2.3',sourceSha,runId:'123',initial:true};
  const before=fs.readFileSync(path.join(work,'package-lock.json'),'utf8');
  const commit=commitVersion(work,identity);
  assert.equal(fs.readFileSync(path.join(work,'package-lock.json'),'utf8'),before);
  assert.equal(git(work,'diff-tree','--no-commit-id','--name-only','-r',commit),'');
  assert.equal(git(remote,'rev-parse','refs/tags/v1.2.3'),commit);
  assert.equal(commitVersion(work,identity),commit);
  assert.throws(()=>commitVersion(work,{...identity,runId:'456'}),/another release/);
  assert.throws(()=>commitVersion(work,{...identity,runId:'12'}),/another release/);
});
test('initial stable release rejects a different base and any previous stable series', t => {
  const {work,remote,sourceSha}=fixture(t), identity={version:'1.2.3',sourceSha,runId:'123',initial:true};
  assert.throws(()=>commitVersion(work,{...identity,version:'1.2.4'}),/current base/);
  git(work,'tag','v1.2.2');git(work,'push','origin','v1.2.2');
  assert.throws(()=>commitVersion(work,identity),/previous stable tags/);
  assert.equal(git(remote,'rev-parse','refs/heads/main'),sourceSha);
  assert.equal(git(remote,'tag','--list','v1.2.3'),'');
});
test('stable commits and tags publish atomically, retry the same run and never overwrite another release', t => {
  const { work, remote, sourceSha } = fixture(t), identity = {version:'1.2.4',sourceSha,runId:'123'};
  const commit = commitVersion(work,identity);
  assert.equal(git(remote,'rev-parse','refs/heads/main'),commit); assert.equal(git(remote,'rev-parse','refs/tags/v1.2.4'),commit);
  assert.equal(git(work,'rev-parse',`${commit}^`),sourceSha); assert.equal(commitVersion(work,identity),commit);
  assert.throws(()=>commitVersion(work,{...identity,runId:'456'}),/another release/);
  assert.throws(()=>commitVersion(work,{...identity,runId:'12'}),/another release/);
});
test('stable rejects an advanced main and leaves published version unchanged', t => {
  const {work,remote,sourceSha}=fixture(t);
  fs.writeFileSync(path.join(work,'new.txt'),'new source'); git(work,'add','new.txt'); git(work,'commit','-m','concurrent change'); git(work,'push','origin','main');
  git(work,'checkout',sourceSha);
  assert.throws(()=>commitVersion(work,{version:'1.2.4',sourceSha,runId:'123'}),/main advanced/);
  assert.equal(git(remote,'tag','--list'),''); assert.equal(JSON.parse(git(remote,'show','main:package.json')).version,'1.2.3');
});
test('stable keeps uploads draft on failure and retries publication and Pages without incrementing again', t => {
  const {work,sourceSha}=fixture(t), env={RELEASE_VERSION:'1.2.4',RELEASE_SOURCE:sourceSha,GITHUB_RUN_ID:'123',GITHUB_REPOSITORY:'owner/repo'};
  fs.mkdirSync(path.join(work,'release')); const names=['app.dmg','app.exe','app.deb','app.rpm','app.AppImage']; names.forEach(n=>fs.writeFileSync(path.join(work,'release',n),'asset'));
  fs.cpSync(path.join(__dirname, '../skills'), path.join(work, 'skills'), { recursive: true });
  const skill = require('../scripts/package-extension-skill.cjs').packageSkill(work, '1.2.4'); names.push(path.basename(skill.file));
  let release=null, failUpload=true, incompleteUpload=false, dispatches=0, draftLookups=0;
  const gh=(...args)=>{
    if(args[0]==='api') {
      if(args.includes('--slurp')) {draftLookups++;return JSON.stringify([[],release?[release]:[]]);}
      // Reproduce GitHub's draft response instead of treating it as public.
      if(!release || release.draft) {const error=Error('not found');error.stderr='HTTP 404';throw error;}
      return JSON.stringify(release);
    }
    if(args[1]==='create') {assert.equal(release,null,'never recreate an existing draft');release={tag_name:'v1.2.4',draft:true,assets:[]};}
    if(args[1]==='upload') {if(failUpload)throw Error('upload interrupted');release.assets=(incompleteUpload?names.slice(1):names).map(name=>({name,size:5,state:'uploaded'}));}
    if(args[1]==='edit') {release.draft=false;release.prerelease=false;release.published_at=new Date().toISOString();}
    if(args[0]==='workflow')dispatches++;
    return '';
  };
  assert.throws(()=>publish(work,env,gh),/upload interrupted/); assert.equal(release.draft,true);assert.equal(dispatches,0);
  failUpload=false; incompleteUpload=true;
  assert.throws(()=>publish(work,env,gh),/Uploaded assets incomplete/);assert.equal(release.draft,true);assert.equal(dispatches,0);
  incompleteUpload=false; publish(work,env,gh); const commit=git(work,'rev-parse','HEAD'); assert.equal(release.draft,false);assert.equal(dispatches,2);assert.ok(draftLookups>=4);
  publish(work,env,gh);assert.equal(git(work,'rev-parse','HEAD'),commit);assert.equal(dispatches,4);
});

test('release workflows gate publishing on shared three-platform success and pin the built source', () => {
  const yaml = require('js-yaml'), root = path.resolve(__dirname, '..');
  const read = name => yaml.load(fs.readFileSync(path.join(root,'.github/workflows',name),'utf8'));
  const build=read('_release-build.yml'), stable=read('_release-stable.yml'), nightly=read('nightly.yml');
  assert.deepEqual(build.jobs.package.needs, 'test');
  assert.deepEqual(build.jobs.package.strategy.matrix.include.map(p=>p.platform).sort(),['linux','macos','windows']);
  for(const job of Object.values(build.jobs))assert.equal(job.steps[0].with.ref,'${{ inputs.source_sha }}');
  assert.deepEqual(stable.jobs.publish.needs,['prepare','build']);assert.deepEqual(nightly.jobs.release.needs,['changes','build']);
  assert.equal(stable.jobs.build.uses,nightly.jobs.build.uses);assert.equal(nightly.on.schedule[0].cron,'23 13 * * *');
  for(const bump of ['major','minor','patch']) {const entry=read(`release-${bump}.yml`);assert.equal(entry.jobs.release.with.bump,bump==='patch'?"${{ inputs.initial_release && 'initial' || 'patch' }}":bump);assert.equal(entry.jobs.release.if,"github.ref == 'refs/heads/main'");assert.deepEqual(entry.concurrency,nightly.concurrency);assert.equal(entry.concurrency['cancel-in-progress'],false);}
  assert.equal(read('release-patch.yml').on.workflow_dispatch.inputs.initial_release.default,false);
  assert.equal(stable.jobs.publish.steps.at(-1).env.RELEASE_INITIAL,"${{ inputs.bump == 'initial' }}");
});
