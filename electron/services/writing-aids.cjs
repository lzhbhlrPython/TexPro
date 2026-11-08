'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = import('./writing-aids-core.mjs');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');

function sourceFile(root, file) {
  const base = fs.realpathSync(root), target = fs.realpathSync(path.resolve(base, file));
  if (!target.startsWith(base + path.sep) || !/\.(tex|ltx)$/i.test(target) || !fs.statSync(target).isFile()) throw new Error('Writing aids require a TeX file inside the project.');
  return target;
}

async function listWritingAids(root) {
  const { parseWritingAids } = await core, result = { placeholders: [], memos: [], files: [] };
  const base = fs.realpathSync(root), ignored = new Set(['.git', '.texpro', 'node_modules', 'dist', 'build', 'out']);
  const visit = (dir, depth) => {
    if (depth > 20) throw new Error('Project nesting exceeds the writing-aid scan limit.');
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || ignored.has(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file, depth + 1);
      else if (entry.isFile() && /\.(tex|ltx)$/i.test(file)) {
        const text = fs.readFileSync(file, 'utf8'), parsed = parseWritingAids(text, file);
        result.placeholders.push(...parsed.placeholders); result.memos.push(...parsed.memos);
        result.files.push({ file, hash: hash(text) });
        if (result.files.length > 10000) throw new Error('Project exceeds the writing-aid scan limit.');
      }
    }
  };
  visit(base, 0);
  return result;
}

async function editWritingAid(root, options) {
  const { parseWritingAids, ensurePlaceholderSupport, placeholderSource, writingPositionAllowed, toggleMemoLine } = await core;
  const file = sourceFile(root, options.file), before = fs.readFileSync(file, 'utf8');
  if (typeof options.expectedHash !== 'string' || hash(before) !== options.expectedHash) throw new Error('Source changed. Read writing aids again before applying this edit.');
  const edits = new Map(), originals = new Map([[file, before]]);
  let after;
  if (options.action === 'insert-placeholder') {
    const at = options.offset;
    if (!writingPositionAllowed(before, at)) throw new Error('Insert placeholders in document prose, outside comments, code and the preamble.');
    if (typeof options.text !== 'string' || !options.text.trim() || options.text.length > 500) throw new Error('Describe the placeholder in 1–500 characters.');
    const main = sourceFile(root, require('./project-root.cjs').resolveProjectRoot(root).rootFile || '');
    const mainBefore = main === file ? before : fs.readFileSync(main, 'utf8');
    if (hash(mainBefore) !== options.expectedMainHash) throw new Error('Main file changed. Read writing aids again before applying this edit.');
    const supported = ensurePlaceholderSupport(mainBefore);
    const insert = placeholderSource(options.kind || 'text', options.text);
    if (main === file) { const mapped = at + supported.length - before.length; after = supported.slice(0, mapped) + insert + supported.slice(mapped); }
    else { originals.set(main, mainBefore); if (supported !== mainBefore) edits.set(main, supported); after = before.slice(0, at) + insert + before.slice(at); }
  } else if (options.action === 'resolve-placeholder') {
    const placeholder = parseWritingAids(before, file).placeholders.find(item => item.from === options.offset);
    if (!placeholder || typeof options.text !== 'string' || options.text.length > 100000) throw new Error('Placeholder moved or replacement is invalid.');
    after = before.slice(0, placeholder.from) + options.text + before.slice(placeholder.to);
  } else if (options.action === 'add-memo') {
    if (typeof options.text !== 'string' || !options.text.trim() || options.text.length > 2000) throw new Error('Write a revision memo in 1–2000 characters.');
    const lines = before.split('\n');
    if (!Number.isInteger(options.line) || options.line < 1 || options.line > lines.length) throw new Error('Invalid memo line.');
    const at = lines.slice(0, options.line).join('\n').length;
    if (!writingPositionAllowed(before, Math.max(0, at - 1))) throw new Error('Leave revision memos in document prose.');
    after = before.slice(0, at) + '\n% MEMO: ' + options.text.replace(/\r?\n/g, ' ') + '\n' + before.slice(at);
  } else if (['complete-memo', 'reopen-memo'].includes(options.action)) {
    const memo = parseWritingAids(before, file).memos.find(item => item.line === options.line);
    if (!memo || memo.done === (options.action === 'complete-memo')) throw new Error('Memo moved or is already in the requested state.');
    after = before.slice(0, memo.from) + toggleMemoLine(memo.source, memo) + before.slice(memo.to);
  } else throw new Error('Unknown writing-aid action.');
  edits.set(file, after);
  const written = [];
  try {
    for (const [target, content] of edits) {
      if (fs.readFileSync(target, 'utf8') !== originals.get(target)) throw new Error('Source changed before the edit could be saved.');
      fs.writeFileSync(target, content); written.push(target);
    }
  } catch (error) {
    for (const target of written.reverse()) fs.writeFileSync(target, originals.get(target));
    throw error;
  }
  return { ok: true, files: [...edits.keys()].map(target => ({ file: target, hash: hash(edits.get(target)) })) };
}

module.exports = { listWritingAids, editWritingAid };
