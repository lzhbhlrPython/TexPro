'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-ui-regression-'));
const env = { ...process.env, TEXPRO_SMOKE: '1', TEXPRO_REGRESSION: '1', TEXPRO_USER_DATA: userData, TEXPRO_ARTIFACTS: path.resolve(__dirname, '../artifacts') };
env.TEXPRO_FLOW_REGRESSION = '1';
if (process.argv.includes('--updates')) env.TEXPRO_UPDATE_REGRESSION = '1';
if (process.argv.includes('--realtime')) env.TEXPRO_REALTIME_REGRESSION = '1';
if (process.argv.includes('--extensions')) env.TEXPRO_EXTENSION_REGRESSION = '1';
if (process.argv.includes('--aids')) env.TEXPRO_AIDS_REGRESSION = '1';
env.TEXPRO_EXIT_REPORT = path.join(userData, 'exit-report.json');
delete env.ELECTRON_RUN_AS_NODE;
if (process.argv.includes('--music')) env.TEXPRO_MUSIC_REGRESSION = '1';
if (process.argv.includes('--writing')) env.TEXPRO_WRITING_REGRESSION = '1';
if (process.argv.includes('--assets')) env.TEXPRO_ASSETS_REGRESSION = '1';
if (process.argv.includes('--continuity')) env.TEXPRO_CONTINUITY_REGRESSION = '1';
const child = spawn(require('electron'), ['.'], { cwd: path.resolve(__dirname, '..'), env, stdio: 'inherit' });
let timedOut = false;
// This journey includes renderer restart and screenshots of all three themes.
const timer = setTimeout(() => { timedOut = true; console.error('UI regression timed out'); child.kill('SIGKILL'); }, (env.TEXPRO_REALTIME_REGRESSION || env.TEXPRO_EXTENSION_REGRESSION) ? 300000 : 180000);
const cleanup = () => { clearTimeout(timer); fs.rmSync(userData, { recursive: true, force: true }); };
child.on('error', (error) => { cleanup(); console.error(error); process.exitCode = 1; });
child.on('exit', (code, signal) => {
  let quit;
  try { quit = JSON.parse(fs.readFileSync(env.TEXPRO_EXIT_REPORT, 'utf8')); } catch { /* A crash/timeout has no successful quit report. */ }
  const recovered = !timedOut && signal === 'SIGKILL' && quit?.quit === true && quit.pid === child.pid && quit.code === 0;
  if (recovered) console.log('PASS macOS native teardown bounded by quit watchdog');
  cleanup(); process.exitCode = !timedOut && (code === 0 || recovered) ? 0 : 1;
});
