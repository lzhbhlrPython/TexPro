/** Portable lexical TeX paths. Filesystem authorization is a separate native concern. */
export function dirname(file) {
  const index = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
  if (index === 2 && file[1] === ':') return file.slice(0, 3);
  return index >= 0 ? file.slice(0, index) || '/' : '.';
}

export function joinPath(base, relative) {
  const clean = relative.trim().replace(/^["']|["']$/g, '').replaceAll('\\', '/');
  const original = /^(?:\/|[A-Za-z]:\/)/.test(clean) ? clean : base.replaceAll('\\', '/') + '/' + clean;
  const prefix = /^[A-Za-z]:\//.exec(original)?.[0] || (original.startsWith('//') ? '//' : original.startsWith('/') ? '/' : '');
  const parts = [];
  for (const part of original.slice(prefix.length).split('/')) {
    if (!part || part === '.') continue;
    if (part === '..' && parts.at(-1) && parts.at(-1) !== '..') parts.pop();
    else if (part === '..') { if (!prefix) parts.push(part); }
    else parts.push(part);
  }
  return prefix + parts.join('/');
}

export function relativePath(from, to) {
  const base = joinPath('', from).replace(/\/+$/, '').split('/');
  const target = joinPath('', to).split('/');
  const windows = /^[A-Za-z]:/.test(base[0]) || base[0] === '' && base[1] === '';
  const equal = (a, b) => windows ? a.toLowerCase() === b.toLowerCase() : a === b;
  if (windows && !equal(base[0], target[0])) return joinPath('', to);
  let common = 0;
  while (common < base.length && common < target.length && equal(base[common], target[common])) common++;
  return [...base.slice(common).map(() => '..'), ...target.slice(common)].join('/');
}
