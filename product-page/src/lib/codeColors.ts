type RGB = [number, number, number];
function parseColor(value: string): { rgb: RGB; alpha: number } | undefined {
  const hex = /^#([\da-f]{6})([\da-f]{2})?$/i.exec(value);
  if (hex) return { rgb: [0, 2, 4].map(index => parseInt(hex[1].slice(index, index + 2), 16)) as RGB, alpha: hex[2] ? parseInt(hex[2], 16) / 255 : 1 };
  const rgba = /^rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)$/.exec(value);
  if (rgba) return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: rgba[4] ? Number(rgba[4]) : 1 };
  return undefined;
}
function blend(front: RGB, back: RGB, amount: number): RGB {
  return front.map((value, index) => Math.round(value * amount + back[index] * (1 - amount))) as RGB;
}
function luminance(rgb: RGB): number {
  const linear = rgb.map(channel => { const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
/** Retain the existing semantic hue, moving toward readable site text when necessary. */
export function readableCodeColor(color: string, background: string, text: string): string {
  const source = parseColor(color), paper = parseColor(background), foreground = parseColor(text);
  if (!source || !paper || !foreground) return text;
  const base = blend(source.rgb, paper.rgb, source.alpha);
  const bg = luminance(paper.rgb);
  for (let step = 0; step <= 20; step++) {
    const rgb = blend(foreground.rgb, base, step / 20), fg = luminance(rgb);
    // Slightly above AA to allow for the existing translucent code background.
    if ((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05) >= 5) return `rgb(${rgb.join(', ')})`;
  }
  return text;
}
