'use strict';
// Repository convenience wrapper around the independently published qwertysay CLI.
process.argv.splice(2, 0, 'pack');
require('../packages/qwertysay/bin/qwertysay.cjs');
