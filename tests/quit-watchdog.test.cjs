'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { spawn, spawnSync } = require('node:child_process');
const canInspectParent = process.platform !== 'win32' && spawnSync('/bin/ps', ['-p', String(process.pid), '-o', 'ppid=']).status === 0;
const path = require('node:path');
const { installQuitWatchdog } = require('../electron/quit-watchdog.cjs');

test('watchdog arms once, only on the final non-cancellable macOS quit event', () => {
  const app = new EventEmitter(), calls = []; let unref = 0;
  installQuitWatchdog(app, { platform: 'darwin', pid: 12345, launch: (...args) => { calls.push(args); const child = new EventEmitter(); child.unref = () => unref++; return child; } });
  app.emit('before-quit'); app.emit('will-quit'); assert.equal(calls.length, 0);
  app.emit('quit', {}, 0); app.emit('quit', {}, 0); assert.equal(calls.length, 1); assert.equal(unref, 1);
  assert.equal(calls[0][0], '/bin/sh'); assert.equal(calls[0][1].at(-1), '12345'); assert.equal(calls[0][2].detached, true);
  const other = new EventEmitter(); installQuitWatchdog(other, { platform: 'win32', launch: () => { throw new Error('should not launch'); } }); other.emit('quit');
});

test('watchdog actually ends its own stalled parent after quit; normal parent exit stays normal', { skip: !canInspectParent ? 'Native parent inspection is unavailable in this sandbox' : false, timeout: 15000 }, async t => {
  const helper = path.resolve(__dirname, '../electron/quit-watchdog.cjs');
  const run = normal => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', `const {EventEmitter}=require('node:events'); const app=new EventEmitter(); require(${JSON.stringify(helper)}).installQuitWatchdog(app,{platform:'darwin',delaySeconds:0.2}); app.emit('quit',{},0); ${normal ? 'process.exit(0);' : 'setInterval(()=>{},1000);'}`], { stdio: 'pipe' });
    t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); });
    child.on('error', reject); child.on('exit', (code, signal) => resolve({code,signal}));
  });
  assert.deepEqual(await run(false), { code: null, signal: 'SIGKILL' });
  assert.deepEqual(await run(true), { code: 0, signal: null });
});
