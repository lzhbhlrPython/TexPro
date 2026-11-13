'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { readNpmExtension } = require('../../../packages/extension-sdk/lib/npm-source.cjs');
function syncReview(manager, source) {
  const stat = fs.lstatSync(source);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) throw new Error('Invalid extension sync plan');
  const plan = JSON.parse(fs.readFileSync(source));
  if (plan.version !== 1 || !/^[0-9a-f-]{36}$/.test(plan.environment) || !path.isAbsolute(plan.root) || !['npm', 'yarn'].includes(plan.packageManager) || !Array.isArray(plan.packages) || plan.packages.length > 100) throw new Error('Invalid extension environment');
  const root = fs.realpathSync(plan.root), pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  if (pkg.texpro?.environment?.id !== plan.environment || pkg.texpro.environment.packageManager !== plan.packageManager) throw new Error('Extension environment identity changed');
  const npmLock = fs.existsSync(path.join(root, 'package-lock.json')), yarnLock = fs.existsSync(path.join(root, 'yarn.lock'));
  if (npmLock && yarnLock || plan.packageManager === 'npm' && !npmLock || plan.packageManager === 'yarn' && !yarnLock) throw new Error('A matching single package manager lockfile is required; sync again');
  const lock = path.join(root, plan.packageManager === 'npm' ? 'package-lock.json' : 'yarn.lock');
  if (crypto.createHash('sha256').update(fs.readFileSync(lock)).digest('hex') !== plan.lockDigest) throw new Error('Extension lockfile changed; sync again');
  const changes = [], ids = new Set(), names = new Set();
  for (const item of plan.packages) {
    if (typeof item.name !== 'string' || !Object.hasOwn(pkg.dependencies || {}, item.name) || names.has(item.name) || !path.isAbsolute(item.source)) throw new Error('Invalid or changed extension dependency');
    names.add(item.name);
    if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(item.name)) throw new Error('Invalid npm dependency name');
    const info = readNpmExtension(path.join(root, 'node_modules', item.name));
    if (info.metadata.name !== item.name || info.metadata.version !== item.version || info.source !== fs.realpathSync(item.source)) throw new Error('Installed npm source changed; sync again');
    if (info.digest !== item.digest || info.manifest.id !== item.id || ids.has(item.id)) throw new Error('Extension artifact changed; sync again');
    ids.add(item.id);
    const record = manager.records[item.id];
    if (record?.origin && record.origin.environment !== plan.environment) throw new Error('Extension belongs to another environment: ' + item.id);
    if (record && !record.origin && !record.builtin) throw new Error('Existing manually installed extension must be removed before environment management: ' + item.id);
    if (record?.digest !== info.digest) changes.push({ kind: 'install', ...item, manifest: info.manifest, origin: { environment: plan.environment, root, name: item.name, version: item.version, lockDigest: plan.lockDigest } });
  }
  if (names.size !== Object.keys(pkg.dependencies || {}).length) throw new Error('Extension dependency list changed; sync again');
  for (const [id, record] of Object.entries(manager.records)) if (record.origin?.environment === plan.environment && !ids.has(id)) changes.push({ kind: 'remove', id, digest: record.digest, manifest: manager.manifest(id), origin: record.origin });
  return { environment: plan.environment, root, source, changes };
}
module.exports = { syncReview };
