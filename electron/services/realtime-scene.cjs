'use strict';
// Host-side glyph rendering, independent of the editor and rtex process.
const fs = require('node:fs');
const path = require('node:path');
let fontkit;
const SP = 65536 * 72.27 / 72;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const num = value => { if (!Number.isFinite(value)) throw new Error('Invalid display-list coordinate'); return +value.toFixed(6); };
const bp = value => num(value / SP);
function inside(root, file) { const relative = path.relative(root, file); return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); }

class Scene {
  constructor(root, fontRoots) {
    this.root = fs.realpathSync(root);
    this.fontRoots = fontRoots.map(p => { try { return fs.realpathSync(p); } catch { return null; } }).filter(Boolean);
    this.fonts = new Map(); this.glyphs = new Map(); this.pages = new Map(); this.overlays = new Map(); this.placements = new Map();
  }
  resource(file, font = false) {
    const real = fs.realpathSync(path.resolve(this.root, file));
    if (!(font ? [this.root, ...this.fontRoots] : [this.root]).some(root => inside(root, real))) throw new Error('Resource outside permitted roots');
    if (fs.statSync(real).size > 64 * 1024 * 1024) throw new Error('Resource too large');
    return real;
  }
  font(desc) {
    const file = this.resource(desc.filename, true), key = file + ':' + (desc.subfont || 0);
    if (!this.fonts.has(key)) {
      if (this.fonts.size >= 64) { this.fonts.clear(); this.glyphs.clear(); }
      fontkit ||= require('fontkit');
      let face = fontkit.openSync(file);
      if (face.fonts) face = face.fonts[desc.subfont || 0];
      if (!face?.getGlyph) throw new Error('Unsupported font');
      this.fonts.set(key, face);
    }
    return { face: this.fonts.get(key), key };
  }
  items(dl, items, colors) {
    let out = '';
    for (const item of items) {
      const [kind, ...v] = item;
      if (kind === 'g') {
        const [id, , index, x, y, , expansion] = v, desc = dl.fonts[String(id)];
        if (index == null || !desc || (desc.squeeze && desc.squeeze !== 1000)) throw new Error('Font requires PDF rendering');
        const { face, key } = this.font(desc);
        const glyphKey = key + ':' + index;
        if (!this.glyphs.has(glyphKey)) {
          if (this.glyphs.size >= 16000) this.glyphs.clear();
          this.glyphs.set(glyphKey, face.getGlyph(index).path.toSVG());
        }
        const size = desc.size / SP / face.unitsPerEm;
        const sx = size * (1 + (expansion || 0) / 1000000) * (desc.extend ? desc.extend / 1000 : 1);
        out += `<path fill="${colors.at(-1)}" d="${esc(this.glyphs.get(glyphKey))}" transform="matrix(${num(sx)} 0 ${num(-size * (desc.slant || 0) / 1000)} ${num(-size)} ${bp(x)} ${bp(y)})"/>`;
      } else if (kind === 'r') {
        out += `<rect fill="${colors.at(-1)}" x="${bp(v[0])}" y="${bp(v[1])}" width="${bp(v[2])}" height="${bp(v[3])}"/>`;
      } else if (kind === 'c') {
        const [stack, command, data] = v;
        if (stack !== 0) throw new Error('Multiple colour stacks require PDF rendering');
        if (command === 2) { if (colors.length > 1) colors.pop(); continue; }
        // LuaTeX's current command emits the existing colour without changing it.
        if (command === 3) continue;
        if (command !== 0 && command !== 1) throw new Error('Unknown colour stack command');
        const match = String(data).match(/^\s*([\d.]+)(?:\s+([\d.]+)\s+([\d.]+))?\s+(g|rg)(?:\s|$)/);
        if (!match) throw new Error('Unsupported colour operation');
        const values = match[4] === 'g' ? [match[1], match[1], match[1]] : match.slice(1, 4);
        const color = '#' + values.map(x => Math.round(Math.max(0, Math.min(1, Number(x))) * 255).toString(16).padStart(2, '0')).join('');
        if (command === 1) colors.push(color); else colors[colors.length - 1] = color;
      } else if (kind === 'i') {
        const info = dl.images_info[String(v[0])];
        const file = this.resource(info.file), ext = path.extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg'].includes(ext)) throw new Error('Image requires PDF rendering');
        const data = fs.readFileSync(file).toString('base64');
        out += `<image x="${bp(v[1])}" y="${bp(v[2])}" width="${bp(v[3])}" height="${bp(v[4])}" preserveAspectRatio="none" href="data:image/${ext === '.png' ? 'png' : 'jpeg'};base64,${data}"/>`;
      } else if (kind === 'M') {
        throw new Error('Transformed content requires PDF rendering');
      } else if (kind !== 'm') throw new Error('Page requires PDF rendering');
    }
    return out;
  }
  layout(event) {
    if (event.pages_total > 1000) throw new Error('Realtime preview page limit exceeded');
    this.placements = new Map(event.placements.map(p => [p.par_id, p.fragments]));
    for (const page of event.pages_changed) this.pages.set(page.page, page);
    for (const page of this.pages.keys()) if (page > event.pages_total) this.pages.delete(page);
    // Background snapshots never replace a newer paragraph result.
    for (const [id, overlay] of this.overlays) {
      if (overlay.versions.source_revision <= event.versions.source_revision) this.overlays.delete(id);
      else {
        const placement = event.placements.find(p => p.par_id === id);
        if (placement) overlay.fragments = placement.fragments;
      }
    }
    return [...this.pages.keys()].map(page => this.render(page));
  }
  paragraph(event) {
    const affected = new Set();
    for (const f of this.placements.get(event.par_id) || []) affected.add(f.page);
    for (const fragment of this.overlays.get(event.par_id)?.fragments || []) affected.add(fragment.page);
    if (event.status === 'removed') this.overlays.set(event.par_id, { ...event, fragments: [] });
    else if (event.status === 'ok') this.overlays.set(event.par_id, event);
    else return [];
    for (const fragment of event.fragments) affected.add(fragment.page);
    return [...affected].filter(page => this.pages.has(page)).map(page => this.render(page));
  }
  render(page) {
    const base = this.pages.get(page), dl = base.dl;
    const width = bp(dl.page_width), height = bp(dl.page_height);
    try {
      if (!base.exact || Object.values(dl.flags || {}).some(Boolean)) throw new Error('Degraded display list');
      const colors = ['#000000'];
      let content = this.items(dl, dl.other, colors);
      for (const line of dl.lines) {
        // Process colours even for replaced rows, so the following rows inherit their state.
        const rendered = this.items(dl, line.items, colors);
        const replaced = [...this.overlays.keys()].some(id => (this.placements.get(id) || []).some(f => f.page === page && f.baselines.some((y, i) => y === line.y && f.xs[i] === line.x)));
        if (!replaced) content += rendered;
      }
      for (const overlay of this.overlays.values()) for (const f of overlay.fragments) {
        if (f.page !== page) continue;
        const palette = ['#000000'];
        for (let i = 0; i < overlay.dl.lines.length; i++) {
          const line = overlay.dl.lines[i], rendered = this.items(overlay.dl, line.items, palette);
          if (i + 1 < f.first_line || i + 1 > f.last_line) continue;
          const j = i + 1 - f.first_line;
          content += `<g transform="translate(${bp(f.xs[j] - line.x)} ${bp(f.baselines[j] - line.y)})">${rendered}</g>`;
        }
      }
      if (content.length > 16 * 1024 * 1024) throw new Error('Page too large');
      return { page, width, height, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>${content}</svg>` };
    } catch {
      return { page, width, height, svg: null };
    }
  }
}
module.exports = { Scene, inside, SP };
