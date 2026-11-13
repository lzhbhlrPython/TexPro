'use strict';
const { readPackage, packageKind } = require('./packages.cjs');
/** Inspection never imports the package entry or executes developer build tools. */
function inspectPackage(source) {
  const fs = require('node:fs'), path = require('node:path');
  if (fs.statSync(source).isDirectory() && fs.existsSync(path.join(source, 'package.json'))) {
    const { npmSource, readNpmExtension } = require('./npm-source.cjs'), npm = npmSource(source);
    if (npm.mode === 'build') return { manifest: npm.manifest, digest: npm.sourceDigest, kind: packageKind(npm.manifest), development: true, requiresBuild: true, npm: { name: npm.metadata.name, version: npm.metadata.version }, fileCount: npm.files.size, bytes: [...npm.files.values()].reduce((sum, value) => sum + value.length, 0), executable: Boolean(npm.manifest.entry), warnings: ['Source inspection does not compile, install dependencies or execute entries. Explicit local build runs compilers and project configuration with user permissions and may download dependencies.'] };
    const info = readNpmExtension(source);
    return report(info, { npm: { name: npm.metadata.name, version: npm.metadata.version }, requiresBuild: false });
  }
  const { manifest, files, digest, development } = readPackage(source);
  return report({ manifest, files, digest, development });
}
function report({ manifest, files, digest, development }, extra = {}) {
  return { manifest, digest, kind: packageKind(manifest), development,
    ...extra,
    fileCount: files.size, bytes: [...files.values()].reduce((sum, value) => sum + value.length, 0),
    executable: Boolean(manifest.entry),
    warnings: [manifest.entry ? 'Trusted Node code can access user files, networks and processes. Inspection is not a sandbox or malware scan.' : 'Themes can hide controls or imitate trusted UI. Inspection does not certify safety.'],
  };
}
module.exports = { inspectPackage };
