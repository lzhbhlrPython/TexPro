'use strict';
const fs = require('node:fs');
const path = require('node:path');

/** Narrow read boundary for automatic project-context discovery. No TeX execution. */
function readWritingSource(root, file) {
  if (typeof root !== 'string' || typeof file !== 'string' || !/\.(tex|ltx|sty|cls)$/i.test(file)) throw new Error('Invalid writing context source');
  const realRoot = fs.realpathSync(root), realFile = fs.realpathSync(file);
  const relative = path.relative(realRoot, realFile);
  if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) throw new Error('Writing source is outside the project');
  const descriptor = fs.openSync(realFile, 'r');
  try {
    const stat = fs.fstatSync(descriptor);
    if (!stat.isFile() || stat.size > 2_000_000) throw new Error('Writing context source is too large');
    // Read at most the checked limit even if the file grows during the read.
    const buffer = Buffer.alloc(Math.min(stat.size + 1, 2_000_001));
    const size = fs.readSync(descriptor, buffer, 0, buffer.length, 0);
    if (size > 2_000_000) throw new Error('Writing context source is too large');
    return buffer.subarray(0, size).toString('utf8');
  } finally { fs.closeSync(descriptor); }
}
module.exports = { readWritingSource };
