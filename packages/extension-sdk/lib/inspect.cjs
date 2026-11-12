'use strict';
const { readPackage, packageKind } = require('./packages.cjs');
/** Inspection never imports the package entry or executes developer build tools. */
function inspectPackage(source) {
  const { manifest, files, digest, development } = readPackage(source);
  return { manifest, digest, kind: packageKind(manifest), development,
    fileCount: files.size, bytes: [...files.values()].reduce((sum, value) => sum + value.length, 0),
    executable: Boolean(manifest.entry),
    warnings: [manifest.entry ? 'Trusted Node code can access user files, networks and processes. Inspection is not a sandbox or malware scan.' : 'Themes can hide controls or imitate trusted UI. Inspection does not certify safety.'],
  };
}
module.exports = { inspectPackage };
