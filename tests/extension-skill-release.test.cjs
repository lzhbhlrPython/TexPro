'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { packageSkill, verifySkillArchive } = require('../scripts/package-extension-skill.cjs');
const { unpack } = require('../packages/extension-sdk/lib/archive.cjs');
test('formal and Nightly Skill archives preserve exact importable source and fail on changed content', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-skill-release-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(path.join(__dirname, '../skills'), path.join(root, 'skills'), { recursive: true });
  for (const version of ['0.1.1', '0.1.0-20261113-Nightly']) {
    const result = packageSkill(root, version);
    assert.ok(result.sha256.length === 64); assert.ok(result.files >= 4);
    assert.ok(unpack(fs.readFileSync(result.file)).has('texpro-extension-development/SKILL.md'));
    assert.throws(() => packageSkill(root, version), /EEXIST/);
  }
  const file = path.join(root, 'release/texpro-extension-development-v0.1.1.skill');
  fs.appendFileSync(path.join(root, 'skills/texpro-extension-development/SKILL.md'), '\nChanged');
  assert.throws(() => verifySkillArchive(root, file), /differs/);
});
test('Skill packaging rejects unsafe sources and invalid versions', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-skill-unsafe-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.cpSync(path.join(__dirname, '../skills'), path.join(root, 'skills'), { recursive: true });
  assert.throws(() => packageSkill(root, '../bad'), /Invalid/);
  fs.writeFileSync(path.join(root, 'skills/texpro-extension-development/.secret'), 'private');
  assert.throws(() => packageSkill(root, '0.1.1'), /Private/);
});
