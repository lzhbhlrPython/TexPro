import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import changes from './nightly-changes.cjs';

export function nightlyVersion(version, date) {
  if (!/^\d{8}$/.test(date)) throw new Error('NIGHTLY_DATE must be YYYYMMDD');
  const iso = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
  if (new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) !== iso) throw new Error('Invalid NIGHTLY_DATE');
  const base = String(version).replace(/\+.*$/, '').replace(/(?:-nightly\.\d{8}|-\d{8}-Nightly)$/i, '');
  return `${base}-${date}-Nightly`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const date = process.env.NIGHTLY_DATE || changes.shanghaiDay(new Date()).date.replaceAll('-', '');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = nightlyVersion(pkg.version, date);

  if (!process.argv.includes('--dry-run')) {
    // Read both manifests before writing; malformed lockfiles must fail the build.
    let lock;
    try { lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (lock) {
      lock.version = pkg.version;
      if (lock.packages?.['']) lock.packages[''].version = pkg.version;
      fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
    }
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  }

  const tag = `v${pkg.version}`;
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${pkg.version}\ntag=${tag}\n`);
  console.log(`Nightly version: ${tag}`);
}
