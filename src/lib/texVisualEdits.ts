import { skipTexSpace, texGroup } from './texDocument';
import { scanWritingSource } from './writingEngine/source';

/** Small, lossless visual edits. A control owns a literal range, never a rebuilt document. */
export interface TexVisualField {
  from: number;
  to: number;
  value: string;
  command: string;
  axis?: 'x' | 'y';
  kind: 'number' | 'pitch' | 'expression';
}

export function texVisualFields(source: string): TexVisualField[] {
  if (source.length > 200000) return [];
  const model = scanWritingSource(source), fields: TexVisualField[] = [];
  const add = (from: number, to: number, command: string, kind: TexVisualField['kind'], axis?: 'x' | 'y') => {
    if (fields.length >= 128 || fields.some(field => field.from === from) || model.protectedRanges.some(range => from < range.to && to > range.from)) return;
    fields.push({ from, to, command, kind, axis, value: source.slice(from, to) });
  };
  for (const command of model.commands) {
    if (fields.length >= 128) break;
    if (model.protectedRanges.some(range => command.from >= range.from && command.from < range.to)) continue;
    if (['addplot', 'addplot3'].includes(command.name)) {
      let at = skipTexSpace(source, command.to);
      if (source[at] === '+') at = skipTexSpace(source, at + 1);
      if (source[at] === '[') { const options = texGroup(source, at, '[', ']'); if (options) at = skipTexSpace(source, options.to); }
      const group = texGroup(source, at);
      if (group && /^[\dxyz+*/^().,\s-]{1,200}$/.test(source.slice(group.from + 1, group.to - 1))) add(group.from + 1, group.to - 1, command.name, 'expression');
    }
    if (/^(?:wh|[qhcz]+[aul])$/.test(command.name)) {
      const group = texGroup(source, skipTexSpace(source, command.to));
      if (group) {
        const value = source.slice(group.from + 1, group.to - 1);
        if (/^[a-nA-N]$/.test(value)) add(group.from + 1, group.to - 1, command.name, 'pitch');
        else if (/^-?\d{1,2}$/.test(value)) add(group.from + 1, group.to - 1, command.name, 'number');
      }
    }
    if (['meterfrac', 'generalsignature', 'instrumentnumber'].includes(command.name)) {
      let at = skipTexSpace(source, command.to);
      for (let index = 0; index < (command.name === 'meterfrac' ? 2 : 1); index++) {
        const group = texGroup(source, at); if (!group) break;
        if (/^-?\d{1,2}$/.test(source.slice(group.from + 1, group.to - 1))) add(group.from + 1, group.to - 1, command.name, 'number');
        at = skipTexSpace(source, group.to);
      }
    }
    if (!['draw', 'fill', 'filldraw', 'node', 'coordinate', 'path'].includes(command.name)) continue;
    const end = source.indexOf(';', command.to);
    if (end < 0) continue;
    for (let at = command.to; at < end && fields.length < 128;) {
      const protectedRange = model.protectedRanges.find(range => at >= range.from && at < range.to);
      if (protectedRange) { at = protectedRange.to; continue; }
      if (source[at] === '{' || source[at] === '[') {
        const group = texGroup(source, at, source[at], source[at] === '{' ? '}' : ']');
        if (!group) break;
        at = group.to; continue;
      }
      const point = /^\(\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*\)/.exec(source.slice(at));
      if (point) {
        const x = at + point[0].indexOf(point[1]), y = at + point[0].indexOf(',', 1) + 1 + point[0].slice(point[0].indexOf(',') + 1).indexOf(point[2]);
        add(x, x + point[1].length, command.name, 'number', 'x');
        add(y, y + point[2].length, command.name, 'number', 'y');
        at += point[0].length;
      } else at++;
    }
  }
  return fields.sort((a, b) => a.from - b.from);
}

export function applyTexVisualField(source: string, field: TexVisualField, value: string): string | null {
  if (source.slice(field.from, field.to) !== field.value) return null;
  if (field.kind === 'expression') {
    if (!/^[\dxyz+*/^().,\s-]{1,200}$/.test(value)) return null;
  } else if (field.kind === 'pitch' ? !/^[a-nA-N]$/.test(value) : !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 10000) return null;
  if (field.kind === 'number' && !field.axis) {
    const number = Number(value);
    if (!Number.isInteger(number)) return null;
    if (field.command === 'generalsignature' ? Math.abs(number) > 7 : ['meterfrac', 'instrumentnumber'].includes(field.command) ? number < 1 || number > 64 : number < -14 || number > 28) return null;
  }
  return source.slice(0, field.from) + value + source.slice(field.to);
}
