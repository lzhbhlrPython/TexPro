'use strict';

function fontMatches(name, resolved) {
  if (!resolved?.trim()) return null;
  const normalize = value => value.toLowerCase().replace(/[\s_-]+/g, '');
  return resolved.split(',').some(family => normalize(family) === normalize(name));
}

function parsePdfFonts(stdout) {
  const fonts = [];
  for (const line of stdout.split(/\r?\n/)) {
    // Read fixed fields from the right: type and encoding may contain spaces.
    const row = line.match(/^(\S+)\s{2,}(.+?)\s{2,}(\S+)\s+(yes|no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/i);
    if (row) fonts.push({ name: row[1], type: row[2].trim(), embedded: row[4].toLowerCase() === 'yes', unicode: row[6].toLowerCase() === 'yes' });
  }
  return fonts;
}

module.exports = { fontMatches, parsePdfFonts };
