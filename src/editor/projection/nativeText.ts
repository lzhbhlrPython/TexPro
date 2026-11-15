import type { TextItem, TextStyle } from 'pdfjs-dist/types/src/display/api';
import { intersects, toViewportRect, type PdfRect } from '../../lib/pdfSync';

export interface NativeTextScene {
  items: Array<TextItem & { rect: PdfRect; bold: boolean; italic: boolean; math: boolean }>;
  geometry: PdfRect[];
  colored: PdfRect[];
  reliable: boolean;
}

/** Only translate ordinary text. Math, authored colors and drawn geometry stay geometric. */
export function nativeTextFragment(scene: NativeTextScene, crop: PdfRect, source: string): HTMLElement | null {
  if (!scene.reliable || /\$|\\[([]|\\begin\{(?:equation|align|gather|multline)/.test(source) || scene.geometry.some(rect => intersects(rect, crop)) || scene.colored.some(rect => intersects(rect, crop))) return null;
  const items = scene.items.filter(item => item.str.trim() && intersects(item.rect, crop));
  if (!items.length || items.some(item => item.math || item.dir === 'ttb' || Math.abs(item.transform[1]) > .01 || Math.abs(item.transform[2]) > .01)) return null;
  const sizes = items.map(item => item.height || Math.abs(item.transform[3])).filter(size => size > 0).sort((a, b) => a - b), base = sizes[Math.floor(sizes.length / 2)];
  if (!base) return null;
  const host = document.createElement('div'); host.className = 'cm-native-prose';
  let paragraph = document.createElement('p'); host.append(paragraph);
  let baseline: number | undefined, previous: typeof items[number] | undefined;
  for (const item of items) {
    const y = item.transform[5], lineBreak = baseline !== undefined && Math.abs(y - baseline) > base * .35;
    if (lineBreak && Math.abs(y - baseline!) > base * 1.65) { paragraph = document.createElement('p'); host.append(paragraph); previous = undefined; }
    if (previous) {
      const gap = item.rect.x - previous.rect.x - previous.rect.width;
      if ((lineBreak || gap > base * .12) && !/\s$/.test(previous.str) && !/^\s/.test(item.str) && !(/[\u3400-\u9fff]$/.test(previous.str) && /^[\u3400-\u9fff]/.test(item.str))) paragraph.append(' ');
    }
    const span = document.createElement('span'); span.textContent = item.str;
    if (item.bold) span.classList.add('cm-bold'); if (item.italic) span.classList.add('cm-italic');
    // Map clicks by the original run's PDF anchor, independently of responsive DOM wrapping.
    span.dataset.nativeX = String(item.rect.x + Math.min(item.rect.width / 2, 20)); span.dataset.nativeY = String(item.rect.y + item.rect.height / 2);
    const ratio = item.height / base;
    if (ratio > 0 && Math.abs(ratio - 1) > .12) span.style.fontSize = `${ratio}em`;
    paragraph.append(span); previous = item; baseline = y;
  }
  return host;
}

export function nativeTextItems(items: Array<TextItem | { type: string }>, styles: Record<string, TextStyle>, viewport: ReturnType<import('pdfjs-dist').PDFPageProxy['getViewport']>, font: (name: string) => { name?: string; bold?: boolean; black?: boolean; italic?: boolean } | undefined): NativeTextScene['items'] {
  return items.filter((item): item is TextItem => 'str' in item).map(item => {
    const info = font(item.fontName), name = info?.name || styles[item.fontName]?.fontFamily || '';
    const height = item.height || Math.abs(item.transform[3]), ascent = styles[item.fontName]?.ascent ?? .8;
    const rect = toViewportRect({ x: item.transform[4] - viewport.viewBox[0], y: viewport.viewBox[3] - item.transform[5] - height * ascent, width: item.width, height }, viewport);
    return { ...item, rect, bold: !!(info?.bold || info?.black || /bold|cmbx|heiti|hei\b/i.test(name)), italic: !!(info?.italic || /italic|oblique|cmti|cmsl/i.test(name)), math: /math|cmmi|cmsy|cmex|msam|msbm/i.test(name) };
  });
}
