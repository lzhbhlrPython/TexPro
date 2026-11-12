export interface InkPoint { x: number; y: number; pressure: number }
export interface InkStroke { color: string; width: number; points: InkPoint[]; pressured: boolean }
export function parseInkDraft(input: unknown): InkStroke[] {
  if (!Array.isArray(input) || input.length > 3000) throw new Error('Invalid ink draft');
  let total = 0;
  return input.map(value => {
    if (!value || !/^#[a-fA-F0-9]{6}$/.test(value.color) || !Number.isFinite(value.width) || value.width < 0.1 || value.width > 100 || typeof value.pressured !== 'boolean' || !Array.isArray(value.points) || (total += value.points.length) > 100000 || value.points.some((p: InkPoint) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x) > 1000000 || Math.abs(p.y) > 1000000 || !Number.isFinite(p.pressure) || p.pressure < 0 || p.pressure > 1)) throw new Error('Invalid ink draft');
    return { color: value.color, width: value.width, pressured: value.pressured, points: value.points.map((p: InkPoint) => ({ x: p.x, y: p.y, pressure: p.pressure })) };
  });
}
