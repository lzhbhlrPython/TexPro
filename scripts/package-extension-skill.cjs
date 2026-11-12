'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { pack, unpack } = require('../packages/extension-sdk/lib/archive.cjs');
const { relative } = require('../packages/extension-sdk/lib/schema.cjs');
const NAME = 'texpro-extension-development';
function skillFiles(root) {
  const directory = path.join(root, 'skills', NAME), files = new Map();
  function visit(folder, prefix) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') throw new Error('Private or generated files must not enter the Skill archive');
      const name = prefix + entry.name; relative(name);
      if (entry.isSymbolicLink()) throw new Error('Skill archive cannot contain symbolic links');
      if (entry.isDirectory()) visit(path.join(folder, entry.name), name + '/');
      else if (entry.isFile()) files.set(NAME + '/' + name, fs.readFileSync(path.join(folder, entry.name)));
      else throw new Error('Unsupported Skill file');
    }
  }
  visit(directory, '');
  const skill = files.get(NAME + '/SKILL.md')?.toString('utf8');
  if (!skill || !/^---\r?\n[\s\S]*?name: texpro-extension-development\r?\n[\s\S]*?description: .+\r?\n[\s\S]*?---/m.test(skill)) throw new Error('Skill requires valid name and description front matter');
  if (!files.has(NAME + '/agents/openai.yaml')) throw new Error('Skill agent metadata missing');
  for (const match of skill.matchAll(/\]\((references\/[^)#]+)(?:#[^)]*)?\)/g)) if (!files.has(NAME + '/' + match[1])) throw new Error('Missing Skill reference: ' + match[1]);
  return files;
}
function verifySkillArchive(root, file) {
  const expected = skillFiles(root), actual = unpack(fs.readFileSync(file));
  if (actual.size !== expected.size || [...expected].some(([name, bytes]) => !actual.get(name)?.equals(bytes))) throw new Error('Skill archive content differs from the tested source');
  return { files: actual.size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
}
function packageSkill(root, version, output = path.join(root, 'release')) {
  if (!/^\d+\.\d+\.\d+(?:-\d{8}-Nightly)?$/.test(version)) throw new Error('Invalid Skill release version');
  fs.mkdirSync(output, { recursive: true });
  const file = path.join(output, `${NAME}-v${version}.skill`);
  fs.writeFileSync(file, pack(skillFiles(root)), { flag: 'wx' });
  return { file, ...verifySkillArchive(root, file) };
}
module.exports = { packageSkill, verifySkillArchive, skillFiles };
if (require.main === module) console.log(JSON.stringify(packageSkill(process.cwd(), process.argv[2] || process.env.BUILD_VERSION)));
