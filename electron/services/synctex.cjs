'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

function fields(text) {
  const values = Object.create(null);
  // A query can return multiple records. Never mix fields across records.
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Za-z]+):(.*)$/.exec(line);
    if (!match) continue;
    if (Object.hasOwn(values, match[1])) break;
    values[match[1]] = match[2].trim();
  }
  return values;
}
function number(value) { return value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null; }
function positiveInteger(value) { return Number.isInteger(value) && value > 0; }
function inside(root, file) {
  if (typeof root !== 'string' || typeof file !== 'string') throw new Error('Invalid SyncTeX path');
  const realRoot = fs.realpathSync(root), realFile = fs.realpathSync(path.resolve(root, file));
  const relative = path.relative(realRoot, realFile);
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error('SyncTeX file is outside the project');
  return path.join(path.resolve(root), relative);
}
function parseForward(stdout) {
  const value = fields(stdout), page = number(value.Page), x = number(value.x), y = number(value.y);
  if (!positiveInteger(page) || x === null || y === null) return { ok: false, error: 'No valid SyncTeX result', raw: stdout };
  const h = number(value.h), v = number(value.v), width = number(value.W), height = number(value.H);
  const bounds = h !== null && v !== null && width > 0 && height > 0 ? { x: h, y: v - height, width, height } : undefined;
  return { ok: true, page, x, y, h, v, width, height, bounds, raw: stdout };
}
function parseForwardResults(stdout) {
  const records = stdout.split(/(?=^Output:)/m).filter(value => /^Page:/m.test(value));
  return records.map(parseForward).filter(value => value.ok);
}
function parseInverse(stdout, root) {
  const value = fields(stdout), line = number(value.Line), column = number(value.Column);
  if (!value.Input || !positiveInteger(line)) return { ok: false, error: 'No valid SyncTeX source result', raw: stdout };
  return { ok: true, file: inside(root, value.Input), line, column: positiveInteger(column) ? column : 1, raw: stdout };
}

/** Shared desktop/MCP process boundary. PDF viewport conversion stays in pdfSync.ts. */
function createSyncTexService({ resolveBinary, environment, run = promisify(execFile) }) {
  const query = async (root, args) => (await run(resolveBinary('synctex'), args, { cwd: root, env: environment(), maxBuffer: 4 * 1024 * 1024, timeout: 12000 })).stdout;
  return {
    async synctexForward({ projectRoot, texFile, pdfFile, line, column = 0 }) {
      try {
        if (!positiveInteger(line) || !Number.isInteger(column) || column < 0) throw new Error('Invalid SyncTeX source position');
        const source = inside(projectRoot, texFile), pdf = inside(projectRoot, pdfFile);
        return parseForward(await query(projectRoot, ['view', '-i', `${line}:${column}:${source}`, '-o', pdf]));
      } catch (error) { return { ok: false, error: String(error.message || error) }; }
    },
    async synctexInverse({ projectRoot, pdfFile, page, x, y }) {
      try {
        if (!positiveInteger(page) || !Number.isFinite(x) || !Number.isFinite(y)) throw new Error('Invalid SyncTeX PDF position');
        const pdf = inside(projectRoot, pdfFile);
        return parseInverse(await query(projectRoot, ['edit', '-o', `${page}:${x}:${y}:${pdf}`]), projectRoot);
      } catch (error) { return { ok: false, error: String(error.message || error) }; }
    },
  };
}
module.exports = { createSyncTexService, parseForward, parseForwardResults, parseInverse };
