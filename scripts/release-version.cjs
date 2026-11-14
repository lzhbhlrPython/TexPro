'use strict';
const fs = require('node:fs');
const path = require('node:path');
function nextVersion(current, bump) {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(current)) throw Error('Expected a stable X.Y.Z base version');
  if (bump === 'initial' || bump === 'replace') {
    if (current.split('.').some(n => !Number.isSafeInteger(Number(n)))) throw Error('Invalid base version');
    return current;
  }
  const parts = current.split('.').map(Number), index = ['major', 'minor', 'patch'].indexOf(bump);
  if (index < 0 || parts.some(n => !Number.isSafeInteger(n)) || !Number.isSafeInteger(parts[index] + 1)) throw Error('Invalid version bump');
  parts[index] += 1;
  for (let i = index + 1; i < 3; i++) parts[i] = 0;
  return parts.join('.');
}
function stampVersion(root, version) {
  if (!/^\d+\.\d+\.\d+(?:-\d{8}-Nightly)?$/.test(version)) throw Error('Invalid build version');
  const pkgPath = path.join(root, 'package.json'), lockPath = path.join(root, 'package-lock.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')), lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (!lock.packages?.['']) throw Error('Root lockfile package missing');
  pkg.version = lock.version = lock.packages[''].version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
}
module.exports = { nextVersion, stampVersion };
if (require.main === module) {
  const [mode, value] = process.argv.slice(2);
  if (mode === 'plan') {
    const version = nextVersion(JSON.parse(fs.readFileSync('package.json')).version, value);
    if (value === 'replace' && process.env.RELEASE_REPLACEMENT_VERSION !== version) throw Error('Replacement must explicitly name the current stable version');
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ntag=v${version}\n`);
    console.log(`v${version}`);
  } else if (mode === 'stamp') stampVersion(process.cwd(), value);
  else throw Error('Usage: release-version.cjs plan major|minor|patch|initial|replace OR stamp VERSION');
}
