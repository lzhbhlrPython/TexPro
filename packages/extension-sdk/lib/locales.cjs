'use strict';
const sourceMessages = Object.freeze(require('./locale-source.json'));
const LOCALE_CATALOG_VERSION = 2;
const forbidden = new Set(['__proto__', 'prototype', 'constructor']);
function localeId(id) {
  if (typeof id !== 'string' || id.length > 64 || !/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(id)) throw new Error('Invalid language identifier');
  const value = Intl.getCanonicalLocales(id)[0];
  if (value === 'en') throw new Error('The English recovery language cannot be replaced');
  return value;
}
function placeholders(text) { return [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().filter((value, index, list) => !index || value !== list[index - 1]); }
function validateMessages(value, source = sourceMessages) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Buffer.byteLength(JSON.stringify(value)) > 2 * 1024 * 1024 || Object.keys(value).length > 10000) throw new Error('Invalid language messages');
  const result = Object.create(null);
  for (const [key, text] of Object.entries(value)) {
    if (!/^[a-z][a-z0-9]*(?:\.[a-z0-9]+)+$/.test(key) || key.length > 240 || forbidden.has(key) || typeof text !== 'string' || text.length > 20000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) throw new Error('Invalid language message: ' + key);
    const original = Object.hasOwn(source, key) ? source[key] : undefined;
    if (original !== undefined && JSON.stringify(placeholders(text)) !== JSON.stringify(placeholders(original))) throw new Error('Language placeholder mismatch: ' + key);
    result[key] = text;
  }
  return result;
}
function localeContributions(manifest, files) {
  return (manifest.contributes.locales || []).map(locale => {
    if (locale.catalogVersion !== LOCALE_CATALOG_VERSION) throw new Error('Language catalogue version 2 required: migrate phrase keys to semantic message IDs; old language packs are not supported');
    const data = files.get(locale.messages);
    if (!data || data.length > 2 * 1024 * 1024) throw new Error('Missing or oversized language messages');
    return { id: localeId(locale.id), title: locale.title, catalogVersion: LOCALE_CATALOG_VERSION, messages: validateMessages(JSON.parse(data.toString('utf8'))) };
  });
}
function messageCoverage(messages) {
  const missing = Object.keys(sourceMessages).filter(key => !Object.hasOwn(messages, key));
  const unknown = Object.keys(messages).filter(key => !Object.hasOwn(sourceMessages, key));
  return { total: Object.keys(sourceMessages).length, translated: Object.keys(sourceMessages).length - missing.length, missing, unknown };
}
module.exports = { LOCALE_CATALOG_VERSION, sourceMessages, localeId, validateMessages, localeContributions, messageCoverage };
