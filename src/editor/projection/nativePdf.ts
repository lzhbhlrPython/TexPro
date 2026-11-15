import type { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { loadPdfRuntime } from '../../lib/pdfRuntime';
import type { NativeWritingProjection } from '../../lib/writingEngine/native';
import { nativeTextItems, type NativeTextScene } from './nativeText';
import type { PdfRect } from '../../lib/pdfSync';

export interface NativePdfResource {
  refs: number; task?: PDFDocumentLoadingTask; ready: Promise<PDFDocumentProxy>;
  timer?: ReturnType<typeof setTimeout>; scenes: Map<number, Promise<{ page: PDFPageProxy; scene: NativeTextScene }>>;
}
const resources = new Map<string, NativePdfResource>();
export function acquireNativePdf(projection: NativeWritingProjection) {
  let resource = resources.get(projection.revision);
  if (!resource) {
    const created = { refs: 0, scenes: new Map() } as NativePdfResource;
    created.ready = loadPdfRuntime().then(runtime => { created.task = runtime.getDocument({ data: new Uint8Array(projection.pdf) }); return created.task.promise; });
    resource = created; resources.set(projection.revision, resource);
  }
  clearTimeout(resource.timer); resource.refs++; return resource;
}
export function releaseNativePdf(revision: string, resource: NativePdfResource) {
  if (--resource.refs) return;
  resource.timer = setTimeout(() => { resources.delete(revision); void resource.ready.catch(() => {}).then(() => resource.task?.destroy()).catch(() => {}); }, 500);
}
/** PDF.js operation boxes are recorded once at scale 1, shared by every crop on that page. */
export function nativePdfScene(resource: NativePdfResource, number: number) {
  let result = resource.scenes.get(number);
  if (!result) {
    result = (async () => {
      const pdf = await resource.ready, page = await pdf.getPage(number), viewport = page.getViewport({ scale: 1 });
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      try {
        canvas.getContext('2d', { alpha: true });
        await page.render({ canvas, viewport, background: 'rgba(0,0,0,0)', recordOperations: true }).promise;
        const [text, operators, runtime] = await Promise.all([page.getTextContent(), page.getOperatorList(), loadPdfRuntime()]);
        const boxes = page.recordedBBoxes as { length: number; isEmpty(i: number): boolean; minX(i: number): number; minY(i: number): number; maxX(i: number): number; maxY(i: number): number } | null;
        const scene: NativeTextScene = { items: nativeTextItems(text.items, text.styles, viewport, name => page.commonObjs.has(name) ? page.commonObjs.get(name) : undefined), geometry: [], colored: [], reliable: !!boxes };
        if (boxes) {
          const names = new Map(Object.entries(runtime.OPS).map(([name, value]) => [value, name]));
          const stack: string[] = []; let color = '#000000';
          for (let i = 0; i < operators.fnArray.length; i++) {
            const name = names.get(operators.fnArray[i]) || '';
            if (name === 'save') stack.push(color); else if (name === 'restore') color = stack.pop() || '#000000';
            else if (/^setFill(?:Color|CMYK)/.test(name)) scene.reliable = false;
            else if (name === 'setFillRGBColor' || name === 'setFillGray') color = String(operators.argsArray[i]?.[0] ?? '#000000');
            if (i >= boxes.length || boxes.isEmpty(i)) continue;
            const rect: PdfRect = { x: boxes.minX(i) * canvas.width, y: boxes.minY(i) * canvas.height, width: (boxes.maxX(i) - boxes.minX(i)) * canvas.width, height: (boxes.maxY(i) - boxes.minY(i)) * canvas.height };
            if (/paint.*Image|constructPath|^(?:stroke|fill|eoFill|shadingFill)$/.test(name)) scene.geometry.push(rect);
            if (/show.*Text/i.test(name) && !/^#000000$/i.test(color) && color !== '0') scene.colored.push(rect);
          }
        }
        return { page, scene };
      } finally { canvas.width = canvas.height = 0; }
    })(); resource.scenes.set(number, result);
  }
  return result;
}
