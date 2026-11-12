'use strict';
/** Optional authoring helper; the host passes the actual context to activate(). */
exports.defineExtension = activate => ({ activate });
exports.API_VERSION = 1;
Object.assign(exports, require('./lib/json-bridge.cjs'));
