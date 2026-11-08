'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { IGNORED_DIRS, isTextFile } = require('./project-files.cjs');

const inside = (root, file) => file === root || file.startsWith(root + path.sep);
const slash = value => value.replaceAll(path.sep, '/');

function sourceMask(text) {
  return text.replace(/\\begin\{(verbatim\*?|lstlisting|minted)\}[\s\S]*?\\end\{\1\}|\\verb\*?([^\w\s])[\s\S]*?\2|\\[%\\]|%[^\r\n]*/g,
    match => match.startsWith('\\%') || match === '\\\\' ? match : match.replace(/[^\r\n]/g, ' '));
}

function rewriteReferences(text, file, root, oldPath, newPath) {
  const destination = inside(oldPath, file) ? newPath + file.slice(oldPath.length) : file;
  const remap = target => inside(oldPath, target) ? newPath + target.slice(oldPath.length) : target;
  const changes = [], mask = sourceMask(text);
  const replace = (raw, command, local = false) => {
    if (!raw || /[\\#{}]/.test(raw)) return raw;
    const ext = path.extname(raw);
    const extensions = ext ? [''] : command === 'includegraphics' ? ['', '.pdf', '.png', '.jpg', '.jpeg', '.svg'] : /bibliography|addbibresource/.test(command) ? ['', '.bib'] : ['', '.tex', '.ltx'];
    const bases = local ? [path.dirname(file)] : [root, path.dirname(file)];
    let found;
    for (const base of bases) {
      for (const suffix of extensions) {
        const candidate = path.resolve(base, raw + suffix);
        if (inside(root, candidate) && fs.existsSync(candidate)) { found = { base, candidate, suffix }; break; }
      }
      if (found) break;
    }
    if (!found) return raw;
    const nextBase = found.base === root && !local ? root : path.dirname(destination);
    const target = remap(found.candidate);
    if (target === found.candidate && nextBase === found.base) return raw;
    let result = slash(path.relative(nextBase, target));
    if (!ext && found.suffix) result = result.slice(0, -found.suffix.length);
    return result;
  };
  const commands = /\\(input|include|includegraphics|bibliography|addbibresource|lstinputlisting|includepdf)(?:\s*\[[^\]]*\])?\s*\{([^{}]+)\}/g;
  for (const match of text.matchAll(commands)) {
    if (mask[match.index] !== '\\') continue;
    const argument = match[2];
    const next = argument.split(',').map(part => part.replace(/\S(?:[\s\S]*\S)?/, value => replace(value, match[1]))).join(',');
    if (next !== argument) changes.push({ from: match.index + match[0].length - argument.length - 1, to: match.index + match[0].length - 1, insert: next });
  }
  for (const match of text.matchAll(/^\s*%\s*!\s*TeX\s+root\s*=\s*(.+?)\s*$/gim)) {
    const next = replace(match[1], 'input', true);
    if (next !== match[1]) {
      const from = match.index + match[0].lastIndexOf(match[1]);
      changes.push({ from, to: from + match[1].length, insert: next });
    }
  }
  changes.sort((a, b) => a.from - b.from);
  let after = text;
  for (const change of [...changes].reverse()) after = after.slice(0, change.from) + change.insert + after.slice(change.to);
  return { path: destination, oldPath: file, before: text, after, changes };
}

/** Prepare every edit first; on a write failure restore source files and the original path. */
function relocate(projectRoot, source, target) {
  const root = path.resolve(projectRoot), oldPath = path.resolve(source), newPath = path.resolve(target);
  const realRoot = fs.realpathSync(root);
  if (oldPath === root || !inside(root, oldPath) || !inside(root, newPath) || !inside(realRoot, fs.realpathSync(oldPath)) || !inside(realRoot, fs.realpathSync(path.dirname(newPath)))) throw new Error('Path is outside the project');
  if (fs.existsSync(newPath)) throw new Error('A file or folder with that name already exists');
  const updates = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || IGNORED_DIRS.has(entry.name) || entry.isSymbolicLink()) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (isTextFile(file) && !file.endsWith('.bib')) {
        const update = rewriteReferences(fs.readFileSync(file, 'utf8'), file, root, oldPath, newPath);
        if (update.after !== update.before) updates.push(update);
      }
    }
  };
  visit(root);
  const configFile = path.join(root, '.texpro/project.json');
  if (fs.existsSync(configFile)) {
    const before = fs.readFileSync(configFile, 'utf8'), config = JSON.parse(before);
    if (typeof config.rootFile === 'string' && inside(oldPath, path.resolve(root, config.rootFile))) {
      config.rootFile = slash(path.relative(root, newPath + path.resolve(root, config.rootFile).slice(oldPath.length)));
      const after = JSON.stringify(config, null, 2);
      updates.push({ path: configFile, oldPath: configFile, before, after, changes: [{ from: 0, to: before.length, insert: after }] });
    }
  }
  const written = [];
  fs.renameSync(oldPath, newPath);
  try {
    for (const update of updates) {
      written.push(update);
      fs.writeFileSync(update.path, update.after, 'utf8');
    }
  } catch (error) {
    const failures = [];
    for (const update of written.reverse()) { try { fs.writeFileSync(update.path, update.before, 'utf8'); } catch (failure) { failures.push(failure.message); } }
    try { fs.renameSync(newPath, oldPath); } catch (failure) { failures.push(failure.message); }
    if (failures.length) throw new Error(`${error.message}; rollback incomplete: ${failures.join('; ')}`);
    throw error;
  }
  return { path: newPath, oldPath, oldRelative: slash(path.relative(root, oldPath)), newRelative: slash(path.relative(root, newPath)), updated: updates.length, updates };
}

function renameProjectFile(root, file, name) {
  name = String(name || '').trim();
  if (!name || /[\\/]/.test(name) || name === '.' || name === '..') throw new Error('Invalid file name');
  if (!path.extname(name)) name += path.extname(file);
  return relocate(root, file, path.join(path.dirname(file), name));
}
function moveProjectDirectory(root, dir, name) {
  name = String(name || '').trim();
  if (!name || /[\\/]/.test(name) || name === '.' || name === '..') throw new Error('Invalid directory name');
  return relocate(root, dir, path.join(path.dirname(dir), name));
}
function moveProjectFile(root, file, dir) {
  if (!fs.statSync(dir).isDirectory()) throw new Error('Target folder does not exist');
  return relocate(root, file, path.join(dir, path.basename(file)));
}
module.exports = { renameProjectFile, moveProjectDirectory, moveProjectFile, rewriteReferences };
