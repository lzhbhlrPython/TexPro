'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { API_VERSION, defineExtension } = require('../index.cjs');
test('independent SDK exposes API 1 helper and shared tooling without an Electron runtime', () => {
  const activate = () => {};
  assert.equal(API_VERSION, 1); assert.equal(defineExtension(activate).activate, activate);
  const tools = require('../package-tools.cjs');
  assert.equal(typeof tools.readPackage, 'function'); assert.equal(typeof tools.validateManifest, 'function');
  assert.equal(typeof tools.pack, 'function');
});
