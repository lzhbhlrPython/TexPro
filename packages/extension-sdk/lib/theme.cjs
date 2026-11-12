'use strict';
const path = require('node:path');
const postcss = require('postcss');
const values = require('postcss-value-parser');
const { relative } = require('./schema.cjs');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };

// A constrained stylesheet format, not a security sandbox. CSS can still conceal or impersonate UI.
function compileTheme(theme, files) {
  if (!theme.stylesheet) return '';
  const file = relative(theme.stylesheet), source = files.get(file);
  if (!source || source.length > 128 * 1024) throw new Error('Missing or oversized theme stylesheet');
  const css = source.toString('utf8');
  if (css.includes('\\') || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(css)) throw new Error('CSS escapes and control characters are unsupported');
  const root = postcss.parse(css, { from: undefined, map: false })
  root.walkComments(comment => comment.remove());
  let expanded = 0;
  root.walkAtRules(rule => {
    if (!['media', 'supports', 'container', 'layer', 'font-face', 'keyframes'].includes(rule.name.toLowerCase())) throw new Error('Unsupported theme CSS at-rule: ' + rule.name);
    if (/url\s*\(|https?:|file:|data:/i.test(rule.params)) throw new Error('Theme at-rules cannot load resources');
  });
  root.walkDecls(decl => {
    if (/^(?:behavior|-moz-binding)$/i.test(decl.prop)) throw new Error('Unsupported CSS property');
    const parsed = values(decl.value);
    parsed.walk(node => {
      if (node.type !== 'function') return;
      const name = node.value.toLowerCase();
      if (['expression', 'image-set', '-webkit-image-set', 'image', 'src', 'paint', 'element', '-moz-element', 'cross-fade', '-webkit-cross-fade'].includes(name)) throw new Error('Unsupported CSS resource function: ' + name);
      if (name !== 'url') return;
      if (node.nodes.length !== 1 || !['string', 'word'].includes(node.nodes[0].type)) throw new Error('Theme URLs must name a local package asset');
      const asset = node.nodes[0].value;
      relative(asset);
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), asset)); relative(target);
      const mime = MIME[path.posix.extname(target).toLowerCase()], data = files.get(target);
      if (!mime || !data || data.length > 1024 * 1024) throw new Error('Missing or unsupported theme asset: ' + asset);
      expanded += Math.ceil(data.length / 3) * 4;
      if (expanded > 2 * 1024 * 1024) throw new Error('Expanded theme CSS exceeds 2 MiB');
      node.nodes = [{ type: 'string', quote: '"', value: `data:${mime};base64,${data.toString('base64')}` }];
      return false;
    });
    decl.value = parsed.toString();
  });
  // Global font/keyframe definitions are active only while this single theme's style element exists.
  const result = postcss.root(), scope = postcss.atRule({ name: 'scope', params: '([data-extension-theme])' });
  for (const node of [...root.nodes]) {
    if (node.type === 'atrule' && ['font-face', 'keyframes'].includes(node.name.toLowerCase())) result.append(node);
    else scope.append(node);
  }
  result.append(scope);
  return result.toString();
}
function themeStyles(manifest, files) {
  let total = 0;
  return Object.fromEntries(manifest.contributes.themes.map(theme => {
    const css = compileTheme(theme, files); total += Buffer.byteLength(css);
    if (total > 4 * 1024 * 1024) throw new Error('Combined theme styles exceed 4 MiB');
    return [theme.id, css];
  }));
}
module.exports = { compileTheme, themeStyles };
