'use strict';
const { spawn } = require('node:child_process');

// JS timers cannot run once Chromium blocks the main thread in native shutdown.
// Query this child's live parent, rather than a captured $PPID, to avoid killing
// a reused PID after the app has already exited and the child was reparented.
const SCRIPT = `
/bin/sleep "$1"
parent=$(/bin/ps -p "$$" -o ppid=)
[ "$parent" -eq "$2" ] 2>/dev/null || exit 0
/bin/kill -KILL "$2"
`;

function installQuitWatchdog(app, { platform = process.platform, pid = process.pid, delaySeconds = 5, launch = spawn, report = () => {} } = {}) {
  if (platform !== 'darwin') return;
  app.once('quit', (_event, code) => {
    // quit cannot be cancelled: renderer saves and will-quit cleanup are over.
    try { report(code); } catch (error) { console.error('[shutdown] exit report unavailable', error); }
    try {
      const child = launch('/bin/sh', ['-c', SCRIPT, 'texpro-quit-watchdog', String(delaySeconds), String(pid)], { detached: true, stdio: 'ignore' });
      child.on('error', error => console.error('[shutdown] watchdog unavailable', error));
      child.unref();
    } catch (error) { console.error('[shutdown] watchdog unavailable', error); }
  });
}

module.exports = { installQuitWatchdog, SCRIPT };
