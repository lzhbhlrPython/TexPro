'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { scaffoldLocale, reportCoverage } = require('../lib/locales.cjs');
const { planInteractive } = require('../lib/wizard.cjs');
const { main } = require('../bin/qwertysay.cjs');
const { readPackage } = require('@texpro/extension-sdk/package-tools');
function fixture(t) { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qwertysay-locale-')); t.after(() => fs.rmSync(root, { recursive: true, force: true })); return root; }
test('guided language pack selects Yarn, reports missing translations and packs without a build', async t => {
  const root = fixture(t), directory = path.join(root, 'language with spaces');
  const answers = ['en', 'init', 'locale', directory, 'author.french', 'Writer', 'fr', 'Français', 'yarn', 'yes'];
  const plan = await planInteractive({ ask: async () => { assert.ok(answers.length); return answers.shift(); }, write() {} });
  scaffoldLocale(plan.directory, plan.options);
  assert.equal(fs.readFileSync(path.join(directory, '.yarnrc.yml'), 'utf8'), 'nodeLinker: node-modules\n');
  assert.ok(reportCoverage(directory)[0].missing.length > 1000);
  fs.writeFileSync(path.join(directory, 'locales/fr.json'), JSON.stringify({ Save: 'Enregistrer' }));
  await main(['check', directory]); const file = path.join(root, 'fr.tpp'); await main(['pack', directory, file]);
  assert.equal(readPackage(file).manifest.entry, undefined);
  assert.equal(fs.existsSync(path.join(directory, 'node_modules')), false);
  await assert.rejects(main(['pack', directory, path.join(root, 'fr.tpt')]), /tpt/);
});
test('npm language scaffold refuses English replacement, overwrites and invalid placeholders', t => {
  const root = fixture(t), directory = path.join(root, 'locale');
  assert.throws(() => scaffoldLocale(directory, { locale: 'en' }));
  scaffoldLocale(directory); assert.throws(() => scaffoldLocale(directory));
  fs.writeFileSync(path.join(directory, 'locales/fr.json'), JSON.stringify({ 'Hello {name}': 'Bonjour' }));
  assert.throws(() => readPackage(directory), /placeholder/);
});
