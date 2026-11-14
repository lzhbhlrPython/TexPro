import { readFile, readdir } from 'node:fs/promises';
const root = new URL('../src/i18n/', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const english = await read('messages/en.json');
const variables = text => [...text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map(match => match[1]).sort().join(',');
const codes = new Set();
for (const file of await readdir(new URL('languages/', root))) {
  if (!file.endsWith('.json')) continue;
  const language = await read(`languages/${file}`);
  if (!/^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(language.code) || file !== `${language.code}.json` || codes.has(language.code)) throw Error(`Invalid language identifier: ${file}`);
  codes.add(language.code);
  for (const field of ['name', 'htmlLang', 'dateLocale', 'componentLocale']) if (typeof language[field] !== 'string' || !language[field].trim()) throw Error(`${file}: missing ${field}`);
  if (!['zh_CN', 'en_US'].includes(language.componentLocale)) throw Error(`${file}: unsupported componentLocale; use explicit en_US fallback`);
  Intl.getCanonicalLocales(language.htmlLang);
  new Intl.DateTimeFormat(language.dateLocale);
  const messages = await read(`messages/${language.code}.json`);
  for (const [key, value] of Object.entries(messages)) {
    if (!Object.hasOwn(english, key) || typeof value !== 'string') throw Error(`${language.code}: invalid key/value ${key}`);
    if (variables(value) !== variables(english[key])) throw Error(`${language.code}: placeholder mismatch ${key}`);
  }
  console.log(`${language.code}: ${Object.keys(messages).length}/${Object.keys(english).length} messages; missing keys fall back to English`);
}
if (!codes.has('en')) throw Error('English recovery catalogue is required');
