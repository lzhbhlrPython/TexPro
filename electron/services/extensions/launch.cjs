'use strict';
const path = require('node:path');
function syncPath(argv) {
  const assigned = argv.find(value => typeof value === 'string' && value.startsWith('--extension-sync='));
  if (assigned) { const value = assigned.slice('--extension-sync='.length); return path.isAbsolute(value) ? value : undefined; }
  // Electron may insert Chromium switches between an unknown switch and positional paths.
  const index = argv.indexOf('--extension-sync');
  return index < 0 ? undefined : argv.slice(index + 1).find(value => typeof value === 'string' && path.isAbsolute(value));
}
module.exports = { syncPath };
